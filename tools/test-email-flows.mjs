import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { createHandler, _test } = require('../api/reply-message.js');

const REPLY_ID = '11111111-1111-4111-8111-111111111111';
const MESSAGE_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';
const REQUEST_ID = '44444444-4444-4444-8444-444444444444';
const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';

const baseEnv = Object.freeze({
  SUPABASE_URL: 'https://project.example.invalid',
  SUPABASE_ANON_KEY: 'test-anon-placeholder',
  PUBLIC_EMAILJS_PUBLIC_KEY: 'test-public-placeholder',
  PUBLIC_EMAILJS_SERVICE_ID: 'test-service-placeholder',
  EMAILJS_REPLY_TEMPLATE_ID: 'test-reply-template-placeholder',
  EMAILJS_PRIVATE_KEY: 'test-private-placeholder',
  PUBLIC_CONTACT_EMAIL: 'contact@example.invalid',
  PUBLIC_SITE_URL: 'https://portfolio.example.invalid'
});

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

function makeResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value = '') { this.body = value; }
  };
}

function makeRequest(overrides = {}) {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer test-session-placeholder', origin: baseEnv.PUBLIC_SITE_URL },
    body: { replyId: REPLY_ID },
    ...overrides
  };
}

function createFetchScenario(options = {}) {
  const calls = [];
  const replyStatus = options.replyStatus || 'queued';
  const providerStatus = options.providerStatus ?? 200;
  const providerText = options.providerText ?? (providerStatus === 200 ? 'OK' : 'Provider rejected request');
  const fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url) === EMAILJS_URL) {
      if (options.timeout) {
        return new Promise((resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
        });
      }
      return new Response(providerText, { status: providerStatus });
    }
    const path = new URL(String(url)).pathname + new URL(String(url)).search;
    if (path === '/auth/v1/user') return jsonResponse({ id: USER_ID });
    if (path.startsWith('/rest/v1/admin_users')) return jsonResponse(options.activeAdmin === false ? [] : [{ user_id: USER_ID }]);
    if (path.includes('/rest/v1/message_replies') && path.includes('status=in.')) {
      if (replyStatus === 'sent' || replyStatus === 'sending') return jsonResponse([]);
      return jsonResponse([{ id: REPLY_ID, message_id: MESSAGE_ID, reply_text: 'Grazie per il messaggio. Questa è una risposta di prova.' }]);
    }
    if (path.includes('/rest/v1/message_replies') && (!init.method || init.method === 'GET')) return jsonResponse([{ id: REPLY_ID, message_id: MESSAGE_ID, status: replyStatus }]);
    if (path.includes('/rest/v1/contact_messages') && init.method !== 'PATCH') {
      return jsonResponse([{ id: MESSAGE_ID, sender_name: 'Mario Rossi', sender_email: 'mario@example.invalid', subject: 'Richiesta informazioni', message_text: 'Questo è il testo completo del messaggio originale.' }]);
    }
    return jsonResponse([]);
  };
  return { fetch, calls };
}

async function invoke(options = {}) {
  const scenario = createFetchScenario(options);
  const logs = [];
  const logger = {
    info: (line) => logs.push(line),
    warn: (line) => logs.push(line),
    error: (line) => logs.push(line)
  };
  const response = makeResponse();
  const handler = createHandler({
    fetch: scenario.fetch,
    env: options.env || { ...baseEnv },
    logger,
    randomUUID: () => REQUEST_ID,
    providerTimeoutMs: 5
  });
  await handler(options.request || makeRequest(), response);
  return { response, body: JSON.parse(response.body), calls: scenario.calls, logs };
}

async function testSuccessContract() {
  const result = await invoke();
  assert.equal(result.response.statusCode, 200);
  assert.equal(result.body.ok, true);
  const providerCall = result.calls.find((call) => call.url === EMAILJS_URL);
  assert.ok(providerCall, 'EmailJS must be called');
  const payload = JSON.parse(providerCall.init.body);
  assert.deepEqual(Object.keys(payload).sort(), ['accessToken', 'service_id', 'template_id', 'template_params', 'user_id'].sort());
  assert.equal(payload.accessToken, baseEnv.EMAILJS_PRIVATE_KEY);
  assert.deepEqual(Object.keys(payload.template_params).sort(), [
    'from_name', 'message', 'original_message', 'original_subject', 'reply_to', 'site_url', 'subject', 'to_email', 'to_name'
  ].sort());
  assert.ok(Object.values(payload.template_params).every((value) => typeof value === 'string' && value.length > 0));
  const stateBodies = result.calls.filter((call) => call.init.method === 'PATCH').map((call) => JSON.parse(call.init.body));
  assert.ok(stateBodies.some((body) => body.status === 'sending'));
  assert.ok(stateBodies.some((body) => body.status === 'sent'));
  assert.ok(stateBodies.some((body) => body.status === 'replied'));
}

async function testProviderFailures() {
  const cases = [
    [400, 'Template invalid or not found', 502, 'EMAIL_PROVIDER_REJECTED', 'template_not_found'],
    [401, 'Invalid access token', 502, 'EMAIL_PROVIDER_AUTH', 'invalid_private_key'],
    [403, 'Forbidden', 502, 'EMAIL_PROVIDER_AUTH', 'provider_auth'],
    [422, 'Recipient missing', 502, 'EMAIL_TEMPLATE_INVALID', 'recipient_missing'],
    [429, 'Rate limit exceeded', 503, 'EMAIL_RATE_LIMIT', 'rate_limited'],
    [500, 'Provider unavailable', 503, 'EMAIL_PROVIDER_UNAVAILABLE', 'provider_unavailable']
  ];
  for (const [providerStatus, providerText, httpStatus, code, category] of cases) {
    const result = await invoke({ providerStatus, providerText });
    assert.equal(result.response.statusCode, httpStatus, `provider ${providerStatus}`);
    assert.equal(result.body.code, code, `provider ${providerStatus}`);
    assert.equal(result.body.category, category, `provider ${providerStatus}`);
    const failedUpdate = result.calls.find((call) => call.init.method === 'PATCH' && String(call.init.body).includes('"status":"failed"'));
    assert.ok(failedUpdate, `provider ${providerStatus} must mark failed`);
    assert.equal(JSON.parse(failedUpdate.init.body).error_code, category);
  }
}

async function testTimeout() {
  const result = await invoke({ timeout: true });
  assert.equal(result.response.statusCode, 504);
  assert.equal(result.body.code, 'EMAIL_TIMEOUT');
  assert.ok(result.calls.some((call) => call.init.method === 'PATCH' && String(call.init.body).includes('"status":"failed"')));
}

async function testConfigurationAndAuthorization() {
  const missingEnv = { ...baseEnv };
  delete missingEnv.EMAILJS_PRIVATE_KEY;
  const missing = await invoke({ env: missingEnv });
  assert.equal(missing.response.statusCode, 503);
  assert.equal(missing.body.code, 'CONFIG_MISSING');
  assert.equal(missing.calls.length, 0);

  const noAuth = await invoke({ request: makeRequest({ headers: { origin: baseEnv.PUBLIC_SITE_URL } }) });
  assert.equal(noAuth.response.statusCode, 401);
  assert.equal(noAuth.body.code, 'AUTH_REQUIRED');

  const nonAdmin = await invoke({ activeAdmin: false });
  assert.equal(nonAdmin.response.statusCode, 403);
  assert.equal(nonAdmin.body.code, 'ADMIN_FORBIDDEN');
  assert.ok(!nonAdmin.calls.some((call) => call.url === EMAILJS_URL));
}

async function testRetryAndDuplicateProtection() {
  const retry = await invoke({ replyStatus: 'failed' });
  assert.equal(retry.response.statusCode, 200);
  assert.equal(retry.calls.filter((call) => call.url === EMAILJS_URL).length, 1);

  const duplicate = await invoke({ replyStatus: 'sent' });
  assert.equal(duplicate.response.statusCode, 200);
  assert.equal(duplicate.body.duplicate, true);
  assert.equal(duplicate.calls.filter((call) => call.url === EMAILJS_URL).length, 0);
}

async function testPublicMessages() {
  const source = await readFile(new URL('../js/contact.js', import.meta.url), 'utf8');
  assert.ok(!source.includes('La notifica email ha riscontrato un problema temporaneo'));
  assert.ok(!source.includes('administration area'));

  async function runContactScenario({ storageError = null, emailError = null } = {}) {
    const classList = { add() {}, remove() {}, contains() { return true; } };
    const input = (value = '') => ({ value, checked: false, classList, setAttribute() {}, removeAttribute() {}, focus() {} });
    const fields = {
      '#name': input('Mario Rossi'),
      '#email': input('mario@example.invalid'),
      '#company': input('Example'),
      '#subject': input('Richiesta informazioni'),
      '#message': input('Questo è un messaggio pubblico sufficientemente lungo.'),
      '#privacyConsent': input(),
      '[name=website]': input('')
    };
    fields['#privacyConsent'].checked = true;
    const submitButton = { textContent: 'Invia', disabled: false };
    let resetCount = 0;
    let emailCalls = 0;
    const form = {
      dataset: {},
      querySelector(selector) { return selector === 'button[type="submit"]' ? submitButton : fields[selector]; },
      reset() { resetCount += 1; },
      addEventListener() {}
    };
    const message = { classList, style: {}, textContent: '', setAttribute() {}, focus() {} };
    const context = {
      console,
      window: {
        PORTFOLIO_CONFIG: {
          emailJsPublicKey: 'public-placeholder',
          emailJsServiceId: 'service-placeholder',
          emailJsContactTemplateId: 'template-placeholder',
          contactEmail: 'contact@example.invalid',
          publicSiteUrl: 'https://portfolio.example.invalid'
        },
        location: { hostname: 'portfolio.example.invalid', protocol: 'https:' },
        portfolioBackend: { getClient: () => ({ rpc: async () => storageError ? { error: { message: storageError } } : { data: { accepted: true }, error: null } }) },
        addEventListener() {},
        matchMedia() { return { matches: false }; }
      },
      document: {
        documentElement: { lang: 'it', classList },
        body: { classList },
        getElementById(id) { return id === 'contactForm' ? form : id === 'formMessage' ? message : null; },
        querySelectorAll() { return []; }
      },
      emailjs: {
        init() {},
        async send() { emailCalls += 1; if (emailError) throw new Error(emailError); return { status: 200 }; }
      },
      localStorage: { getItem() { return null; }, setItem() {} },
      IntersectionObserver: class { observe() {} unobserve() {} }
    };
    vm.createContext(context);
    vm.runInContext(`${source}\nglobalThis.__submit = handleContactFormSubmit;`, context);
    await context.__submit({ preventDefault() {} });
    return { fields, message, resetCount, emailCalls };
  }

  const notificationFailure = await runContactScenario({ emailError: 'mocked-notification-failure' });
  assert.equal(notificationFailure.resetCount, 1);
  assert.equal(notificationFailure.message.textContent, 'Messaggio inviato correttamente. Ti risponderò appena possibile.');

  const storageFailure = await runContactScenario({ storageError: 'mocked-storage-failure' });
  assert.equal(storageFailure.emailCalls, 0);
  assert.equal(storageFailure.resetCount, 0);
  assert.equal(storageFailure.fields['#message'].value, 'Questo è un messaggio pubblico sufficientemente lungo.');
  assert.equal(storageFailure.message.textContent, 'Il messaggio non è stato registrato. Riprova più tardi.');
}

function testDiagnosticCategories() {
  assert.equal(_test.providerCategory(400, 'invalid public key'), 'invalid_public_key');
  assert.equal(_test.providerCategory(401, 'invalid private key'), 'invalid_private_key');
  assert.equal(_test.providerCategory(400, 'service not found'), 'service_not_found');
  assert.equal(_test.providerCategory(400, 'template not found'), 'template_not_found');
  assert.equal(_test.providerCategory(422, 'recipient missing'), 'recipient_missing');
  assert.equal(_test.providerCategory(429, 'requests limit reached'), 'rate_limited');
  assert.equal(_test.sanitizeProviderText('contact@example.invalid\nsecret_value_that_is_long'), '[email] [redacted]');
}

await testSuccessContract();
await testProviderFailures();
await testTimeout();
await testConfigurationAndAuthorization();
await testRetryAndDuplicateProtection();
await testPublicMessages();
testDiagnosticCategories();
console.log('Email flow tests: 15 mocked scenarios passed; no real email was sent.');
