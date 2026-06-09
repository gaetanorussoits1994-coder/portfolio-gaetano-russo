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

function isMobileIntroDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  const isSmallScreen = window.innerWidth <= 900;

  const isMobileUserAgent =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(userAgent);

  return isMobileUserAgent || (isTouchDevice && isSmallScreen);
}

function getIntroVideoSource() {
  if (isMobileIntroDevice()) {
    return 'video/smartphone.mp4';
  }

  return 'video/intro.mp4.mp4';
}

function setupVideoIntro() {
  const intro = document.getElementById('videoIntro');
  const introVideo = document.getElementById('introVideo');
  const enterBtn = document.getElementById('enterSiteBtn');
  const siteContent = document.getElementById('siteContent');

  document.body.classList.add('intro-active');

  if (!intro || !introVideo || !enterBtn) {
    document.body.classList.remove('intro-active');
    return;
  }

  const selectedVideo = getIntroVideoSource();

  console.log('Intro video device mobile:', isMobileIntroDevice());
  console.log('Intro video selezionato:', selectedVideo);
  console.log('User agent:', navigator.userAgent);
  console.log('Viewport:', window.innerWidth, window.innerHeight);

  introVideo.pause();
  introVideo.removeAttribute('src');
  introVideo.innerHTML = '';
  introVideo.src = selectedVideo;
  introVideo.muted = true;
  introVideo.autoplay = true;
  introVideo.loop = true;
  introVideo.playsInline = true;
  introVideo.setAttribute('muted', '');
  introVideo.setAttribute('autoplay', '');
  introVideo.setAttribute('loop', '');
  introVideo.setAttribute('playsinline', '');
  introVideo.removeAttribute('controls');
  introVideo.load();

  const playPromise = introVideo.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(function(error) {
      console.warn('Autoplay intro video bloccato:', error);
    });
  }

  introVideo.addEventListener('timeupdate', function() {
    if (introVideo.currentTime >= 6) {
      introVideo.currentTime = 0;
      introVideo.play();
    }
  });

  enterBtn.addEventListener('click', function() {
    intro.classList.add('hidden');
    document.body.classList.remove('intro-active');
    introVideo.pause();
    if (siteContent) {
      siteContent.style.display = '';
    }

    const target = document.getElementById('chi-sono');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
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
