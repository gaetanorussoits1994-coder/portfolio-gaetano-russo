/** EmailJS browser identifiers are injected by the public runtime configuration endpoint. */
const EMAILJS_CONFIG = Object.freeze({
  publicKey: String(window.PORTFOLIO_CONFIG?.emailJsPublicKey || ''),
  serviceId: String(window.PORTFOLIO_CONFIG?.emailJsServiceId || ''),
  contactTemplateId: String(window.PORTFOLIO_CONFIG?.emailJsContactTemplateId || ''),
  contactEmail: String(window.PORTFOLIO_CONFIG?.contactEmail || ''),
  siteUrl: String(window.PORTFOLIO_CONFIG?.publicSiteUrl || '')
});

function contactText(it, en) {
  const language = window.portfolioI18n ? window.portfolioI18n.getLanguage() : document.documentElement.lang;
  return language === 'en' ? en : it;
}

function isDevelopmentEnvironment() {
  return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
}

function emailJsConfigured() {
  return Boolean(
    EMAILJS_CONFIG.publicKey
    && EMAILJS_CONFIG.serviceId
    && EMAILJS_CONFIG.contactTemplateId
    && EMAILJS_CONFIG.contactEmail
    && EMAILJS_CONFIG.siteUrl
  );
}

function updateDebugStatus(message, isError) {
  const debugStatus = document.getElementById('debugStatus');
  if (!debugStatus || !isDevelopmentEnvironment()) return;
  debugStatus.style.display = 'block';
  debugStatus.style.color = isError ? '#d32f2f' : '#0f1f38';
  debugStatus.style.backgroundColor = isError ? 'rgba(255, 138, 128, 0.16)' : 'rgba(30, 95, 196, 0.08)';
  debugStatus.style.border = isError ? '1px solid rgba(211, 47, 47, 0.3)' : '1px solid rgba(30, 95, 196, 0.2)';
  debugStatus.textContent = message;
}

function initEmailJS() {
  if (typeof emailjs === 'undefined' || !emailJsConfigured()) {
    updateDebugStatus('EmailJS: configurazione pubblica incompleta o libreria non disponibile.', true);
    return false;
  }
  if (window.location.protocol === 'file:') {
    updateDebugStatus('EmailJS richiede una pagina servita tramite HTTP o HTTPS.', true);
  }
  emailjs.init(EMAILJS_CONFIG.publicKey);
  updateDebugStatus('Modulo pronto.');
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(container, text, type) {
  if (!container) return;
  container.classList.remove('success', 'error');
  container.classList.add(type);
  container.setAttribute('role', type === 'error' ? 'alert' : 'status');
  container.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  container.textContent = text;
  container.style.display = 'block';
}

function focusMessage(container) {
  if (!container) return;
  container.setAttribute('tabindex', '-1');
  container.focus({ preventScroll: false });
}

function invalidate(field, container, message) {
  field.setAttribute('aria-invalid', 'true');
  field.focus();
  showMessage(container, message, 'error');
}

async function handleContactFormSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('contactForm');
  const messageContainer = document.getElementById('formMessage');
  if (!form || form.dataset.submitting === 'true') return;

  const nameInput = form.querySelector('#name');
  const emailInput = form.querySelector('#email');
  const companyInput = form.querySelector('#company');
  const subjectInput = form.querySelector('#subject');
  const messageInput = form.querySelector('#message');
  const privacyConsent = form.querySelector('#privacyConsent');
  if (!nameInput || !emailInput || !companyInput || !subjectInput || !messageInput || !privacyConsent) {
    showMessage(messageContainer, contactText('Il modulo non è completo. Ricarica la pagina e riprova.', 'The form is incomplete. Reload the page and try again.'), 'error');
    focusMessage(messageContainer);
    return;
  }

  const fromName = nameInput.value.trim();
  const fromEmail = emailInput.value.trim().toLowerCase();
  const company = companyInput.value.trim();
  const subject = subjectInput.value.trim();
  const rawMessage = messageInput.value.trim();
  const honeypot = form.querySelector('[name=website]')?.value.trim() || '';
  [nameInput, emailInput, companyInput, subjectInput, messageInput, privacyConsent].forEach((field) => field.removeAttribute('aria-invalid'));

  if (fromName.length < 2 || fromName.length > 120) {
    invalidate(nameInput, messageContainer, contactText('Il nome deve contenere da 2 a 120 caratteri.', 'The name must contain between 2 and 120 characters.'));
    return;
  }
  if (fromEmail.length > 254 || !isValidEmail(fromEmail)) {
    invalidate(emailInput, messageContainer, contactText('Inserisci un indirizzo email valido.', 'Enter a valid email address.'));
    return;
  }
  if (company.length > 160) {
    invalidate(companyInput, messageContainer, contactText('Il nome dell’azienda non può superare 160 caratteri.', 'The company name cannot exceed 160 characters.'));
    return;
  }
  if (subject.length < 2 || subject.length > 180) {
    invalidate(subjectInput, messageContainer, contactText('L’oggetto deve contenere da 2 a 180 caratteri.', 'The subject must contain between 2 and 180 characters.'));
    return;
  }
  if (rawMessage.length < 10 || rawMessage.length > 5000) {
    invalidate(messageInput, messageContainer, contactText('Il messaggio deve contenere da 10 a 5000 caratteri.', 'The message must contain between 10 and 5000 characters.'));
    return;
  }
  if (!privacyConsent.checked) {
    invalidate(privacyConsent, messageContainer, contactText('Per inviare il messaggio è necessario accettare la Privacy Policy e l’informativa sul trattamento dei dati.', 'To send the message, you must accept the Privacy Policy and the data processing notice.'));
    return;
  }
  if (honeypot) {
    showMessage(messageContainer, contactText('Invio non riuscito. Riprova più tardi.', 'Sending failed. Please try again later.'), 'error');
    focusMessage(messageContainer);
    return;
  }

  const companyLabel = company || contactText('Non indicata', 'Not provided');
  const formattedMessage = [
    'Nome: ' + fromName,
    'Email: ' + fromEmail,
    'Azienda: ' + companyLabel,
    '',
    'Messaggio:',
    rawMessage
  ].join('\n');
  const templateParams = {
    from_name: fromName,
    from_email: fromEmail,
    company,
    subject,
    message: formattedMessage,
    raw_message: rawMessage,
    reply_to: fromEmail,
    to_email: EMAILJS_CONFIG.contactEmail,
    site_url: EMAILJS_CONFIG.siteUrl
  };

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : contactText('Invio in corso…', 'Sending…');
  form.dataset.submitting = 'true';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = contactText('Invio in corso…', 'Sending…');
  }

  try {
    const backendClient = window.portfolioBackend?.getClient?.();
    if (!backendClient) throw new Error('message-storage-not-configured');
    const { data: submissionResult, error: storageError } = await backendClient.rpc('submit_contact_message', {
      submitted_name: fromName,
      submitted_email: fromEmail,
      submitted_company: company,
      submitted_subject: subject,
      submitted_message: rawMessage,
      submitted_privacy_consent: true,
      website: honeypot
    });
    if (storageError) throw new Error(storageError.message?.includes('Rate limit') ? 'rate-limit' : 'message-storage');
    if (submissionResult?.accepted !== true) throw new Error('message-storage');

    let notificationSent = false;
    try {
      if (typeof emailjs === 'undefined' || !emailJsConfigured()) throw new Error('emailjs-not-configured');
      const response = await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.contactTemplateId, templateParams);
      if (!response || response.status !== 200) throw Object.assign(new Error('emailjs-unexpected-response'), { status: response?.status });
      notificationSent = true;
    } catch (notificationError) {
      const providerStatus = Number(notificationError?.status) || 0;
      updateDebugStatus(`EmailJS: ${notificationError?.message || 'notification-failed'}${providerStatus ? ` (HTTP ${providerStatus})` : ''}`, true);
    }

    form.reset();
    if (notificationSent) {
      showMessage(messageContainer, contactText('Messaggio inviato correttamente. Ti risponderò appena possibile.', 'Message sent successfully. I will reply as soon as possible.'), 'success');
      updateDebugStatus('Supabase: messaggio registrato. EmailJS: notifica inviata.');
    } else {
      showMessage(messageContainer, contactText('Il messaggio è stato ricevuto correttamente. La notifica email ha riscontrato un problema temporaneo, ma la richiesta è disponibile nell’area amministrativa.', 'Your message was received correctly. The email notification encountered a temporary problem, but your request is available in the administration area.'), 'success');
    }
    focusMessage(messageContainer);
  } catch (error) {
    const rateLimited = error?.message === 'rate-limit';
    const configurationMissing = error?.message === 'message-storage-not-configured';
    const userMessage = rateLimited
      ? contactText('Hai effettuato troppi invii. Attendi 15 minuti e riprova.', 'Too many submissions. Wait 15 minutes and try again.')
      : configurationMissing
        ? contactText('Il servizio di ricezione non è temporaneamente disponibile. Riprova più tardi.', 'The receiving service is temporarily unavailable. Please try again later.')
        : contactText('Il messaggio non è stato registrato. Riprova più tardi.', 'The message was not saved. Please try again later.');
    showMessage(messageContainer, userMessage, 'error');
    updateDebugStatus(`Supabase: ${error?.message || 'message-storage'}`, true);
    focusMessage(messageContainer);
  } finally {
    delete form.dataset.submitting;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

window.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;
  contactForm.addEventListener('submit', handleContactFormSubmit);
  initEmailJS();
  if (!document.body.classList.contains('enhanced-home')) setupDarkModeAndReveal();
});

function setupDarkModeAndReveal() {
  var root = document.documentElement;
  var toggle = document.getElementById('darkToggle');
  var key = 'site-theme';

  function applyTheme(theme) {
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    if (toggle) {
      toggle.textContent = theme === 'dark' ? '\u263E' : '\u2600';
      toggle.title = theme === 'dark' ? 'Modalita scura' : 'Modalita chiara';
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  var saved = localStorage.getItem(key) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);
  if (toggle) {
    toggle.addEventListener('click', function () {
      var now = root.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem(key, now);
      applyTheme(now);
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (element) { observer.observe(element); });
}
