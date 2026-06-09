/**
 * Sistema di contatto con EmailJS
 * Gestisce l'invio dei messaggi dal modulo di contatto
 * a gaetano.russoits1994@gmail.com
 * EmailJS template parameters:
 * {{from_name}}, {{from_email}}, {{company}}, {{message}}, {{reply_to}}
 * EmailJS Reply-To should be configured as: {{from_email}}
 */

console.log("SCRIPT CARICATO");

const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'LVIQKRE0XckbgqZNr',
  SERVICE_ID: 'service_n51cthn',
  TEMPLATE_ID: 'template_pr1yfvy',
  RECIPIENT_EMAIL: 'gaetano.russoits1994@gmail.com'
};

function initEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.error('Errore: EmailJS non è stato caricato. Controlla il CDN.');
    return false;
  }

  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  console.log("EMAILJS INIZIALIZZATO");
  console.log('Public Key:', EMAILJS_CONFIG.PUBLIC_KEY);
  console.log('Service ID:', EMAILJS_CONFIG.SERVICE_ID);
  console.log('Template ID:', EMAILJS_CONFIG.TEMPLATE_ID);
  return true;
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

async function handleContactFormSubmit(event) {
  event.preventDefault();
  console.log('Form intercettato');

  const form = document.getElementById('contactForm');
  const messageContainer = document.getElementById('formMessage');

  if (!form) {
    console.error('Errore: form di contatto non trovato.');
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const companyInput = document.getElementById('company');
  const messageInput = document.getElementById('message');

  if (!nameInput || !emailInput || !messageInput) {
    console.error('Errore: uno o più campi obbligatori del form non sono presenti.');
    showMessage(messageContainer, 'Errore: campi del form mancanti', 'error');
    return;
  }

  const fromName = nameInput.value.trim();
  const fromEmail = emailInput.value.trim();
  const company = companyInput ? companyInput.value.trim() : '';
  const message = messageInput.value.trim();

  if (!fromName || !fromEmail || !message) {
    console.error('Errore: compila Nome, Email e Messaggio.');
    showMessage(messageContainer, 'Errore: compila i campi obbligatori', 'error');
    return;
  }

  if (!isValidEmail(fromEmail)) {
    console.error('Errore: indirizzo email non valido.');
    showMessage(messageContainer, 'Errore: email non valida', 'error');
    return;
  }

  const companyLabel = company || 'Non indicata';
  const formattedMessage = [
    'Nome: ' + fromName,
    'Email: ' + fromEmail,
    'Azienda: ' + companyLabel,
    '',
    'Messaggio:',
    message
  ].join('\n');

  console.log('FORM TROVATO');

  const formData = {
    from_name: fromName,
    from_email: fromEmail,
    company: companyLabel,
    message: formattedMessage,
    raw_message: message,
    reply_to: fromEmail,
    to_email: EMAILJS_CONFIG.RECIPIENT_EMAIL
  };

  console.log('Dati raccolti:', formData);
  console.log('INVIO EMAILJS AVVIATO');

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Invio in corso...';
  }

  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      formData
    );

    console.log('RISPOSTA EMAILJS:', response);

    if (response && response.status === 200) {
      console.log('Email inviata con successo');
      showMessage(messageContainer, 'Messaggio inviato correttamente', 'success');
      form.reset();
    } else {
      console.warn('Risposta EmailJS non valida:', response);
      showMessage(messageContainer, 'Errore durante l\'invio', 'error');
    }
  } catch (error) {
    console.error('ERRORE EMAILJS:', error);
    console.error('Status:', error && error.status);
    console.error('Text:', error && error.text);
    console.error('Message:', error && error.message);
    showMessage(messageContainer, 'Errore durante l\'invio', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Invia messaggio';
    }
  }
}

function setupVideoIntro() {
  var intro = document.getElementById('videoIntro');
  var video = document.getElementById('introVideo');
  var enterButton = document.getElementById('enterSiteBtn');
  var siteContent = document.getElementById('siteContent');
  var homeSection = document.getElementById('home');
  var introSeenKey = 'portfolioIntroSeen';

  if (!intro || !video || !enterButton || !siteContent) {
    document.body.classList.remove('intro-active');
    return;
  }

  function showPortfolio(scrollToHome) {
    document.body.classList.remove('intro-active');
    siteContent.setAttribute('aria-hidden', 'false');
    intro.classList.add('is-hidden');
    video.pause();

    if (scrollToHome && homeSection) {
      homeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (sessionStorage.getItem(introSeenKey) === 'true') {
    showPortfolio(false);
    return;
  }

  video.muted = true;
  video.removeAttribute('controls');
  siteContent.setAttribute('aria-hidden', 'true');

  var playPromise = video.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(function(error) {
      console.warn('Autoplay intro video non avviato automaticamente:', error);
    });
  }

  video.addEventListener('timeupdate', function() {
    if (video.currentTime >= 6) {
      video.currentTime = 0;
      video.play();
    }
  });

  enterButton.addEventListener('click', function() {
    sessionStorage.setItem(introSeenKey, 'true');
    showPortfolio(true);
  });
}

function setupDarkModeAndReveal() {
  var root = document.documentElement;
  var toggle = document.getElementById('darkToggle');
  var key = 'site-theme';

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
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

function setupCertificateLightbox() {
  var lightbox = document.getElementById('certificateLightbox');
  var image = document.getElementById('certificateLightboxImage');
  var caption = document.getElementById('certificateLightboxCaption');
  var closeButton = lightbox ? lightbox.querySelector('.lightbox__close') : null;

  if (!lightbox || !image || !caption || !closeButton) return;

  function openLightbox(src, title) {
    image.src = src;
    image.alt = title || 'Attestato';
    caption.textContent = title || 'Attestato';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    image.src = '';
    image.alt = '';
    caption.textContent = '';
  }

  document.querySelectorAll('.certificate-link').forEach(function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      openLightbox(link.dataset.certificateImage || link.getAttribute('href'), link.dataset.certificateTitle || link.textContent.trim());
    });
  });

  closeButton.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', function(event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });
}

window.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded');
  setupVideoIntro();

  const contactForm = document.getElementById('contactForm');
  if (!contactForm) {
    console.error('Errore: form di contatto non trovato in DOM.');
  } else {
    console.log('FORM TROVATO');
    contactForm.addEventListener('submit', handleContactFormSubmit);
    console.log('addEventListener("submit") impostato sul form');
  }

  initEmailJS();
  setupDarkModeAndReveal();
  setupCertificateLightbox();
});
