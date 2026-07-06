/**
 * Sistema di contatto con EmailJS
 * Gestisce l'invio dei messaggi dal modulo di contatto
 * a gaetano.russoits1994@gmail.com
 * EmailJS template parameters:
 * {{from_name}}, {{from_email}}, {{company}}, {{message}}, {{reply_to}}
 * EmailJS Reply-To should be configured as: {{from_email}}
 */

const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'LVIQKRE0XckbgqZNr',
  SERVICE_ID: 'service_n51cthn',
  TEMPLATE_ID: 'template_pr1yfvy',
  RECIPIENT_EMAIL: 'gaetano.russoits1994@gmail.com'
};

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
  console.log('Form contact: inizializzazione EmailJS');
  console.log('Public Key utilizzata:', EMAILJS_CONFIG.PUBLIC_KEY);
  console.log('Service ID utilizzato:', EMAILJS_CONFIG.SERVICE_ID);
  console.log('Template ID utilizzato:', EMAILJS_CONFIG.TEMPLATE_ID);

  if (typeof emailjs === 'undefined') {
    console.error('Errore: EmailJS non è stato caricato. Controlla il CDN in contact.html.');
    updateDebugStatus('Errore: EmailJS non è stato caricato. Apri la console per dettagli.', true);
    return false;
  }

  if (window.location.protocol === 'file:') {
    console.warn('Attenzione: la pagina è servita tramite file://. EmailJS potrebbe considerare questo un ambiente non browser.');
    updateDebugStatus('Attenzione: sei su file://. Servi la pagina via HTTP/HTTPS o abilita "API access from non-browser environments" in EmailJS.', true);
  }

  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  console.log('EmailJS inizializzato con Public Key:', EMAILJS_CONFIG.PUBLIC_KEY);
  updateDebugStatus('EmailJS caricato e pronto.');
  return true;
}

async function handleContactFormSubmit(event) {
  event.preventDefault();
  console.log('Form intercettato');

  const form = document.getElementById('contactForm');
  const messageContainer = document.getElementById('formMessage');

  if (!form) {
    console.error('Errore: form di contatto non trovato.');
    updateDebugStatus('Errore: form di contatto non trovato.', true);
    return;
  }

  const nameInput = form.querySelector('#name');
  const emailInput = form.querySelector('#email');
  const companyInput = form.querySelector('#company');
  const messageInput = form.querySelector('#message');
  const privacyConsent = form.querySelector('#privacyConsent');

  if (!nameInput || !emailInput || !companyInput || !messageInput) {
    console.error('Errore: uno o più campi del form non sono presenti.');
    updateDebugStatus('Errore: uno o più campi del form non sono presenti.', true);
    return;
  }

  if (!privacyConsent || !privacyConsent.checked) {
    const language = window.portfolioI18n ? window.portfolioI18n.getLanguage() : 'it';
    showMessage(
      messageContainer,
      language === 'en'
        ? 'To send the message, you must accept the Privacy Policy and the data processing notice.'
        : 'Per inviare il messaggio è necessario accettare la Privacy Policy e l’informativa sul trattamento dei dati.',
      'error'
    );
    if (privacyConsent) privacyConsent.focus();
    return;
  }

  const fromName = nameInput.value.trim();
  const fromEmail = emailInput.value.trim();
  const companyLabel = companyInput.value.trim() || 'Non indicata';
  const rawMessage = messageInput.value.trim();
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
    message: formattedMessage,
    raw_message: rawMessage,
    reply_to: fromEmail,
    to_email: EMAILJS_CONFIG.RECIPIENT_EMAIL
  };

  console.log('Dati raccolti:', formData);
  console.log('Contenuto di formData:', JSON.stringify(formData));

  if (!formData.from_name || !formData.from_email || !formData.message) {
    showMessage(messageContainer, 'Errore durante l\'invio', 'error');
    updateDebugStatus('Errore: compila Nome, Email e Messaggio.', true);
    return;
  }

  if (!isValidEmail(formData.from_email)) {
    showMessage(messageContainer, 'Errore durante l\'invio', 'error');
    updateDebugStatus('Errore: indirizzo email non valido.', true);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : 'Invio in corso...';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Invio in corso...';
  }

  console.log('Invio verso EmailJS');
  console.log('Public Key:', EMAILJS_CONFIG.PUBLIC_KEY);
  console.log('Service ID:', EMAILJS_CONFIG.SERVICE_ID);
  console.log('Template ID:', EMAILJS_CONFIG.TEMPLATE_ID);
  console.log('formData:', JSON.stringify(formData));

  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      formData
    );

    console.log('Risposta completa ricevuta da EmailJS:', response);

    if (response && response.status === 200) {
      console.log('Email inviata con successo');
      showMessage(messageContainer, 'Messaggio inviato correttamente', 'success');
      updateDebugStatus('Messaggio inviato correttamente.');
      form.reset();
    } else {
      console.warn('Risposta EmailJS non valida:', response);
      showMessage(messageContainer, 'Errore durante l\'invio', 'error');
      updateDebugStatus('Errore durante l\'invio: risposta non valida da EmailJS.', true);
    }
  } catch (error) {
    console.error('Errore completo ricevuto da EmailJS:', error);
    console.error('  • Status:', error && error.status);
    console.error('  • Status Text:', error && error.statusText);
    console.error('  • Text:', error && error.text);
    console.error('  • Message:', error && error.message);
    console.error('  • Response:', error && error.response);
    console.error('  • Stack:', error && error.stack);

    showMessage(messageContainer, 'Errore durante l\'invio', 'error');
    updateDebugStatus('Errore durante l\'invio. Controlla la console per dettagli.', true);
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
  container.textContent = text;
  container.style.display = 'block';
}

window.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) {
    console.error('Errore: form di contatto non trovato in DOM.');
    return;
  }

  contactForm.addEventListener('submit', handleContactFormSubmit);
  console.log('addEventListener("submit") impostato sul form');
  initEmailJS();
  setupDarkModeAndReveal();
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
