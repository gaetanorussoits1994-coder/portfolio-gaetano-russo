'use strict';

const { randomUUID } = require('node:crypto');

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';
const PROVIDER_TIMEOUT_MS = 10000;
const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'PUBLIC_EMAILJS_PUBLIC_KEY',
  'PUBLIC_EMAILJS_SERVICE_ID',
  'EMAILJS_REPLY_TEMPLATE_ID',
  'EMAILJS_PRIVATE_KEY',
  'PUBLIC_CONTACT_EMAIL',
  'PUBLIC_SITE_URL'
];

class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AppError';
    this.httpStatus = options.httpStatus || 500;
    this.clientCode = options.clientCode || 'INTERNAL_ERROR';
    this.clientMessage = options.clientMessage || 'Invio non riuscito. Puoi riprovare.';
    this.category = options.category || 'internal_error';
    this.providerStatus = options.providerStatus || null;
  }
}

function writeJson(response, status, body, requestId) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Request-Id', requestId);
  response.end(JSON.stringify(body));
}

function logDiagnostic(logger, level, fields) {
  const safeFields = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  const method = typeof logger?.[level] === 'function' ? logger[level].bind(logger) : logger?.log?.bind(logger);
  if (method) method(JSON.stringify({ scope: 'reply-message', ...safeFields }));
}

function sanitizeProviderText(value) {
  return String(value || '')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/\b[A-Za-z0-9_-]{17,}\b/g, '[redacted]')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 180);
}

function providerCategory(status, text) {
  const normalized = String(text || '').toLowerCase();
  if (/private key|accesstoken|access token/.test(normalized)) return 'invalid_private_key';
  if (/public key|user_id|user id/.test(normalized)) return 'invalid_public_key';
  if (/service/.test(normalized) && /not found|invalid|exist/.test(normalized)) return 'service_not_found';
  if (/template/.test(normalized) && /not found|invalid|exist/.test(normalized)) return 'template_not_found';
  if (/recipient|to_email|to email/.test(normalized) && /missing|required|empty|invalid/.test(normalized)) return 'recipient_missing';
  if (/limit|rate|too many/.test(normalized) || status === 429) return 'rate_limited';
  if (status === 401 || status === 403) return 'provider_auth';
  if (status === 422) return 'provider_validation';
  if (status >= 500) return 'provider_unavailable';
  return 'provider_rejected';
}

function providerError(status, text) {
  const category = providerCategory(status, text);
  if (status === 429) {
    return new AppError('EmailJS rate limit', { httpStatus: 503, clientCode: 'EMAIL_RATE_LIMIT', clientMessage: 'Servizio email temporaneamente occupato. Riprova tra poco.', category, providerStatus: status });
  }
  if (status >= 500) {
    return new AppError('EmailJS unavailable', { httpStatus: 503, clientCode: 'EMAIL_PROVIDER_UNAVAILABLE', clientMessage: 'Servizio email temporaneamente non disponibile. Riprova più tardi.', category, providerStatus: status });
  }
  const clientCode = (status === 401 || status === 403) ? 'EMAIL_PROVIDER_AUTH' : status === 422 ? 'EMAIL_TEMPLATE_INVALID' : 'EMAIL_PROVIDER_REJECTED';
  return new AppError('EmailJS rejected request', { httpStatus: 502, clientCode, clientMessage: 'La risposta non è stata inviata. Puoi riprovare.', category, providerStatus: status });
}

function normalizePlainText(value, minLength, maxLength, field) {
  const normalized = String(value || '').replace(/\r\n?/g, '\n').trim();
  if (normalized.length < minLength || normalized.length > maxLength || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized) || /<\/?[a-z][^>]*>/i.test(normalized)) {
    throw new AppError(`Invalid ${field}`, { httpStatus: 422, clientCode: 'INVALID_REPLY', clientMessage: 'Il testo della risposta non è valido.', category: `invalid_${field}` });
  }
  return normalized;
}

function validUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function parseResponseBody(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (error) { return text; }
}

function createHandler(dependencies = {}) {
  const fetchImpl = dependencies.fetch || globalThis.fetch;
  const env = dependencies.env || process.env;
  const logger = dependencies.logger || console;
  const createRequestId = dependencies.randomUUID || randomUUID;
  const providerTimeoutMs = dependencies.providerTimeoutMs || PROVIDER_TIMEOUT_MS;

  async function supabaseRequest(path, token, options = {}) {
    let result;
    try {
      result = await fetchImpl(`${env.SUPABASE_URL}${path}`, {
        ...options,
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
    } catch (error) {
      throw new AppError('Supabase network failure', { httpStatus: 503, clientCode: 'DATABASE_UNAVAILABLE', clientMessage: 'Servizio dati temporaneamente non disponibile.', category: 'supabase_network' });
    }
    const text = await result.text();
    const body = parseResponseBody(text);
    if (!result.ok) {
      throw new AppError('Supabase request failed', { httpStatus: result.status === 401 ? 401 : result.status === 403 ? 403 : 502, clientCode: result.status === 401 ? 'AUTH_REQUIRED' : result.status === 403 ? 'ADMIN_FORBIDDEN' : 'DATABASE_ERROR', clientMessage: result.status === 401 ? 'Sessione non valida.' : result.status === 403 ? 'Amministratore non autorizzato.' : 'Operazione dati non riuscita.', category: `supabase_${result.status}` });
    }
    return body;
  }

  async function sendEmail(payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), providerTimeoutMs);
    try {
      const result = await fetchImpl(EMAILJS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const text = await result.text();
      if (result.status !== 200) throw Object.assign(providerError(result.status, text), { providerText: sanitizeProviderText(text) });
      return text;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error?.name === 'AbortError') {
        throw new AppError('EmailJS timeout', { httpStatus: 504, clientCode: 'EMAIL_TIMEOUT', clientMessage: 'Il servizio email non ha risposto in tempo. Puoi riprovare.', category: 'provider_timeout' });
      }
      throw new AppError('EmailJS network failure', { httpStatus: 503, clientCode: 'EMAIL_NETWORK_ERROR', clientMessage: 'Servizio email temporaneamente non raggiungibile. Puoi riprovare.', category: 'provider_network' });
    } finally {
      clearTimeout(timer);
    }
  }

  return async function handler(request, response) {
    const requestId = createRequestId();
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return writeJson(response, 405, { ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Metodo non consentito.', requestId }, requestId);
    }

    const missing = REQUIRED_ENV.filter((key) => !String(env[key] || '').trim());
    if (missing.length) {
      logDiagnostic(logger, 'error', { requestId, phase: 'configuration', category: 'missing_configuration', missing });
      return writeJson(response, 503, { ok: false, code: 'CONFIG_MISSING', error: 'Servizio email non configurato.', requestId }, requestId);
    }

    let configuredOrigin;
    try { configuredOrigin = new URL(env.PUBLIC_SITE_URL).origin; } catch (error) {
      logDiagnostic(logger, 'error', { requestId, phase: 'configuration', category: 'invalid_public_site_url' });
      return writeJson(response, 503, { ok: false, code: 'CONFIG_INVALID', error: 'Servizio email non configurato.', requestId }, requestId);
    }
    const requestOrigin = String(request.headers.origin || '');
    if (requestOrigin && requestOrigin !== configuredOrigin) {
      logDiagnostic(logger, 'warn', { requestId, phase: 'origin', category: 'origin_rejected' });
      return writeJson(response, 403, { ok: false, code: 'ORIGIN_FORBIDDEN', error: 'Origine non autorizzata.', requestId }, requestId);
    }
    if (requestOrigin) {
      response.setHeader('Access-Control-Allow-Origin', configuredOrigin);
      response.setHeader('Vary', 'Origin');
    }

    const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const replyId = String(request.body?.replyId || '');
    if (!token) return writeJson(response, 401, { ok: false, code: 'AUTH_REQUIRED', error: 'Sessione non valida.', requestId }, requestId);
    if (!validUuid(replyId)) return writeJson(response, 400, { ok: false, code: 'INVALID_REQUEST', error: 'Richiesta non valida.', requestId }, requestId);

    let claimed = false;
    let providerDelivered = false;
    let reply;
    try {
      const user = await supabaseRequest('/auth/v1/user', token);
      if (!validUuid(user?.id)) throw new AppError('Invalid auth user', { httpStatus: 401, clientCode: 'AUTH_REQUIRED', clientMessage: 'Sessione non valida.', category: 'invalid_auth_user' });
      const authorization = await supabaseRequest(`/rest/v1/admin_users?user_id=eq.${encodeURIComponent(user.id)}&is_active=eq.true&select=user_id`, token);
      if (!Array.isArray(authorization) || !authorization.length) throw new AppError('Inactive admin', { httpStatus: 403, clientCode: 'ADMIN_FORBIDDEN', clientMessage: 'Amministratore non autorizzato.', category: 'inactive_admin' });

      const claimedRows = await supabaseRequest(`/rest/v1/message_replies?id=eq.${encodeURIComponent(replyId)}&status=in.(queued,failed)&select=*`, token, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status: 'sending', error_code: null })
      });
      if (!Array.isArray(claimedRows) || !claimedRows.length) {
        const existing = await supabaseRequest(`/rest/v1/message_replies?id=eq.${encodeURIComponent(replyId)}&select=id,status,message_id`, token);
        if (existing?.[0]?.status === 'sent') {
          if (validUuid(existing[0].message_id)) {
            try { await supabaseRequest(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(existing[0].message_id)}`, token, { method: 'PATCH', body: JSON.stringify({ status: 'replied' }) }); } catch (stateError) { logDiagnostic(logger, 'error', { requestId, phase: 'message_state', category: stateError.category }); }
          }
          return writeJson(response, 200, { ok: true, duplicate: true, requestId }, requestId);
        }
        return writeJson(response, 409, { ok: false, code: 'REPLY_IN_PROGRESS', error: 'Risposta già in elaborazione.', requestId }, requestId);
      }
      claimed = true;
      reply = claimedRows[0];
      if (!validUuid(reply.message_id)) throw new AppError('Invalid message id', { httpStatus: 422, clientCode: 'INVALID_REPLY', clientMessage: 'Risposta non valida.', category: 'invalid_message_id' });
      const replyText = normalizePlainText(reply.reply_text, 2, 10000, 'reply_text');

      const messages = await supabaseRequest(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(reply.message_id)}&select=id,sender_name,sender_email,subject,message_text`, token);
      const message = messages?.[0];
      if (!message) throw new AppError('Message missing', { httpStatus: 404, clientCode: 'MESSAGE_NOT_FOUND', clientMessage: 'Messaggio originale non disponibile.', category: 'message_missing' });
      const toEmail = String(message.sender_email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail) || toEmail.length > 254) throw new AppError('Invalid recipient', { httpStatus: 422, clientCode: 'INVALID_RECIPIENT', clientMessage: 'Destinatario non valido.', category: 'invalid_recipient' });
      const toName = normalizePlainText(message.sender_name, 2, 120, 'recipient_name');
      const originalSubject = normalizePlainText(message.subject, 2, 180, 'original_subject');
      const originalMessage = normalizePlainText(message.message_text, 10, 5000, 'original_message');

      const emailPayload = {
        service_id: env.PUBLIC_EMAILJS_SERVICE_ID,
        template_id: env.EMAILJS_REPLY_TEMPLATE_ID,
        user_id: env.PUBLIC_EMAILJS_PUBLIC_KEY,
        accessToken: env.EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: toEmail,
          to_name: toName,
          from_name: 'Gaetano Russo',
          reply_to: env.PUBLIC_CONTACT_EMAIL,
          subject: `Re: ${originalSubject}`,
          message: replyText,
          original_subject: originalSubject,
          original_message: originalMessage,
          site_url: env.PUBLIC_SITE_URL
        }
      };
      await sendEmail(emailPayload);
      providerDelivered = true;

      const sentAt = new Date().toISOString();
      let replyStateSaved = false;
      for (let attempt = 0; attempt < 2 && !replyStateSaved; attempt += 1) {
        try {
          await supabaseRequest(`/rest/v1/message_replies?id=eq.${encodeURIComponent(replyId)}`, token, { method: 'PATCH', body: JSON.stringify({ status: 'sent', sent_at: sentAt, provider_id: `emailjs:${requestId}`, error_code: null }) });
          replyStateSaved = true;
        } catch (stateError) {
          if (attempt === 1) logDiagnostic(logger, 'error', { requestId, phase: 'reply_state', category: stateError.category });
        }
      }
      if (replyStateSaved) {
        try { await supabaseRequest(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(message.id)}`, token, { method: 'PATCH', body: JSON.stringify({ status: 'replied' }) }); } catch (stateError) { logDiagnostic(logger, 'error', { requestId, phase: 'message_state', category: stateError.category }); }
      }
      logDiagnostic(logger, 'info', { requestId, phase: 'complete', category: replyStateSaved ? 'sent' : 'sent_state_pending', providerStatus: 200 });
      return writeJson(response, 200, { ok: true, sentAt, statePending: !replyStateSaved, requestId }, requestId);
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError('Unexpected failure');
      if (claimed && !providerDelivered) {
        try {
          await supabaseRequest(`/rest/v1/message_replies?id=eq.${encodeURIComponent(replyId)}&status=neq.sent`, token, { method: 'PATCH', body: JSON.stringify({ status: 'failed', error_code: String(appError.category).slice(0, 120) }) });
        } catch (stateError) {
          logDiagnostic(logger, 'error', { requestId, phase: 'failure_state', category: stateError.category });
        }
      }
      logDiagnostic(logger, 'error', { requestId, phase: providerDelivered ? 'state_persistence' : claimed ? 'email_delivery' : 'authorization', category: appError.category, providerStatus: appError.providerStatus, providerMessage: sanitizeProviderText(error.providerText) });
      return writeJson(response, appError.httpStatus, { ok: false, code: appError.clientCode, category: appError.category, error: appError.clientMessage, requestId }, requestId);
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
module.exports._test = { providerCategory, sanitizeProviderText, REQUIRED_ENV, PROVIDER_TIMEOUT_MS };
