/** EmailJS browser identifiers are injected by the public runtime configuration endpoint. */
const EMAILJS_CONFIG = Object.freeze({
  publicKey: String(window.PORTFOLIO_CONFIG?.emailJsPublicKey || ''),
  serviceId: String(window.PORTFOLIO_CONFIG?.emailJsServiceId || ''),
  contactTemplateId: String(window.PORTFOLIO_CONFIG?.emailJsContactTemplateId || ''),
  contactEmail: String(window.PORTFOLIO_CONFIG?.contactEmail || '')
});

function emailJsConfigured() {
  return Boolean(EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.contactTemplateId && EMAILJS_CONFIG.contactEmail);
}

function updateDebugStatus(message, isError) {
  const debugStatus = document.getElementById('debugStatus');
  if (!debugStatus) return;
  debugStatus.style.display = 'block';
  debugStatus.style.color = isError ? '#d32f2f' : '#0f1f38';
  debugStatus.style.backgroundColor = isError ? 'rgba(255, 138, 128, 0.16)' : 'rgba(30, 95, 196, 0.08)';
  debugStatus.style.border = isError ? '1px solid rgba(211, 47, 47, 0.3)' : '1px solid rgba(30, 95, 196, 0.2)';
  debugStatus.textContent = message;
}

function initEmailJS() {
  if (typeof emailjs === 'undefined' || !emailJsConfigured()) {
    updateDebugStatus(contactText('Il servizio di invio non è disponibile.', 'The sending service is unavailable.'), true);
    return false;
  }

  if (window.location.protocol === 'file:') {
    updateDebugStatus('Attenzione: sei su file://. Servi la pagina via HTTP/HTTPS o abilita "API access from non-browser environments" in EmailJS.', true);
  }

  emailjs.init(EMAILJS_CONFIG.publicKey);
  updateDebugStatus(contactText('Modulo pronto.', 'Form ready.'));
  return true;
}

function contactText(it, en) {
  const language = window.portfolioI18n ? window.portfolioI18n.getLanguage() : document.documentElement.lang;
  return language === 'en' ? en : it;
}

async function handleContactFormSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('contactForm');
  const messageContainer = document.getElementById('formMessage');

  if (!form) {
    return;
  }

  const nameInput = form.querySelector('#name');
  const emailInput = form.querySelector('#email');
  const companyInput = form.querySelector('#company');
  const subjectInput = form.querySelector('#subject');
  const messageInput = form.querySelector('#message');
  const privacyConsent = form.querySelector('#privacyConsent');

  if (!nameInput || !emailInput || !companyInput || !messageInput) {
    showMessage(messageContainer, contactText('Il modulo non è completo. Ricarica la pagina e riprova.', 'The form is incomplete. Reload the page and try again.'), 'error');
    return;
  }

  const fromName = nameInput.value.trim();
  const fromEmail = emailInput.value.trim();
  const rawMessage = messageInput.value.trim();
  const subject = subjectInput?.value.trim() || contactText('Richiesta dal portfolio', 'Portfolio enquiry');
  [nameInput, emailInput, messageInput, privacyConsent].filter(Boolean).forEach((field) => field.removeAttribute('aria-invalid'));

  const firstEmptyField = !fromName ? nameInput : (!fromEmail ? emailInput : (!rawMessage ? messageInput : null));
  if (firstEmptyField) {
    firstEmptyField.setAttribute('aria-invalid', 'true');
    firstEmptyField.focus();
    showMessage(messageContainer, contactText('Compila nome, email e messaggio.', 'Complete your name, email and message.'), 'error');
    return;
  }

  if (!isValidEmail(fromEmail)) {
    emailInput.setAttribute('aria-invalid', 'true');
    emailInput.focus();
    showMessage(messageContainer, contactText('Inserisci un indirizzo email valido.', 'Enter a valid email address.'), 'error');
    return;
  }

  if (!privacyConsent || !privacyConsent.checked) {
    if (privacyConsent) {
      privacyConsent.setAttribute('aria-invalid', 'true');
      privacyConsent.focus();
    }
    showMessage(
      messageContainer,
      contactText('Per inviare il messaggio è necessario accettare la Privacy Policy e l’informativa sul trattamento dei dati.', 'To send the message, you must accept the Privacy Policy and the data processing notice.'),
      'error'
    );
    return;
  }

  const companyLabel = companyInput.value.trim() || contactText('Non indicata', 'Not provided');
  const formattedMessage = [
    'Nome: ' + fromName,
    'Email: ' + fromEmail,
    'Azienda: ' + companyLabel,
    '',
    'Messaggio:',
    rawMessage
  ].join('\n');

  const formData = {
    from_name: fromName,
    from_email: fromEmail,
    company: companyLabel,
    subject: subject,
    message: formattedMessage,
    raw_message: rawMessage,
    reply_to: fromEmail,
    to_email: EMAILJS_CONFIG.contactEmail
  };

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : contactText('Invio in corso…', 'Sending…');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = contactText('Invio in corso…', 'Sending…');
  }

  try {
    if (!emailJsConfigured()) throw new Error('emailjs-not-configured');
    const backendClient = window.portfolioBackend?.getClient?.();
    if (backendClient) {
      const { error: storageError } = await backendClient.rpc('submit_contact_message', {
        submitted_name: fromName,
        submitted_email: fromEmail,
        submitted_company: companyInput.value.trim(),
        submitted_subject: subject,
        submitted_message: rawMessage,
        website: form.querySelector('[name=website]')?.value || ''
      });
      if (storageError) throw new Error(storageError.message?.includes('Rate limit') ? 'rate-limit' : 'message-storage');
    }
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.contactTemplateId,
      formData
    );

    if (response && response.status === 200) {
      showMessage(messageContainer, contactText('Messaggio inviato correttamente.', 'Message sent successfully.'), 'success');
      updateDebugStatus(contactText('Messaggio inviato correttamente.', 'Message sent successfully.'));
      form.reset();
    } else {
      showMessage(messageContainer, contactText('Invio non riuscito. Riprova più tardi.', 'Sending failed. Please try again later.'), 'error');
      updateDebugStatus(contactText('Invio non riuscito.', 'Sending failed.'), true);
    }
  } catch (error) {
    const rateLimited = error?.message === 'rate-limit';
    showMessage(messageContainer, rateLimited ? contactText('Hai effettuato troppi invii. Attendi 15 minuti e riprova.', 'Too many submissions. Wait 15 minutes and try again.') : contactText('Invio non riuscito. Riprova più tardi.', 'Sending failed. Please try again later.'), 'error');
    updateDebugStatus(contactText('Invio non riuscito.', 'Sending failed.'), true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

window.addEventListener('DOMContentLoaded', function() {
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
    toggle.addEventListener('click', function() {
      var now = root.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem(key, now);
      applyTheme(now);
    });
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(function(el) {
    observer.observe(el);
  });
}
