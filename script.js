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

function setupLanguageSelector() {
  var storageKey = 'portfolio-language';
  var savedLanguage = localStorage.getItem(storageKey) === 'en' ? 'en' : 'it';
  var buttons = document.querySelectorAll('.language-switcher [data-lang]');

  function applyLanguage(language) {
    localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;

    if (window.portfolioI18n && typeof window.portfolioI18n.applyLanguage === 'function') {
      window.portfolioI18n.applyLanguage(language);
      return;
    }

    document.querySelectorAll('[data-i18n-it][data-i18n-en]').forEach(function(element) {
      element.textContent = language === 'en' ? element.dataset.i18nEn : element.dataset.i18nIt;
    });
  }

  buttons.forEach(function(button) {
    if (button.dataset.languageHandler === 'ready') return;
    button.dataset.languageHandler = 'ready';
    button.addEventListener('click', function() {
      applyLanguage(button.dataset.lang === 'en' ? 'en' : 'it');
    });
  });

  applyLanguage(savedLanguage);
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
  const privacyConsent = document.getElementById('privacyConsent');

  if (!nameInput || !emailInput || !messageInput) {
    console.error('Errore: uno o più campi obbligatori del form non sono presenti.');
    showMessage(messageContainer, 'Errore: campi del form mancanti', 'error');
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
    submitButton.textContent = window.portfolioI18n && window.portfolioI18n.getLanguage() === 'en'
      ? 'Sending...'
      : 'Invio in corso...';
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
      showMessage(
        messageContainer,
        window.portfolioI18n && window.portfolioI18n.getLanguage() === 'en'
          ? 'Message sent successfully'
          : 'Messaggio inviato correttamente',
        'success'
      );
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
      submitButton.textContent = window.portfolioI18n && window.portfolioI18n.getLanguage() === 'en'
        ? 'Send message'
        : 'Invia messaggio';
    }
  }
}

function isMobileDevice() {
  return window.matchMedia("(max-width: 768px)").matches ||
    /Android|iPhone|iPad|iPod|Windows Phone|Opera Mini|IEMobile/i.test(navigator.userAgent);
}

function isPortfolioHomepage() {
  const pathname = window.location.pathname.toLowerCase();
  return pathname === '/' || pathname.endsWith('/') || pathname.endsWith('/index.html') || pathname.endsWith('index.html');
}

function configureManagedVideo(video, source, loopSeconds, label, playImmediately) {
  if (!video) return;

  video.pause();
  video.removeAttribute('src');
  video.innerHTML = '';
  video.src = source;
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.removeAttribute('controls');
  video.load();

  if (loopSeconds) {
    video.addEventListener('timeupdate', function() {
      const maxDuration = typeof loopSeconds === 'function' ? loopSeconds() : loopSeconds;

      if (video.currentTime >= maxDuration) {
        video.currentTime = 0;
        video.play();
      }
    });
  }

  if (playImmediately) {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function(error) {
        console.warn('Autoplay ' + label + ' video bloccato:', error);
      });
    }
  } else {
    video.pause();
  }
}

function setupVideoIntro() {
  if (!isPortfolioHomepage()) {
    document.body.classList.remove('intro-active');
    return;
  }

  if (window.location.hash) {
    window.history.replaceState(null, document.title, window.location.pathname);
  }

  const intro = document.getElementById('videoIntro');
  const introVideo = document.getElementById('introVideo');
  const enterBtn = document.getElementById('enterSiteBtn');
  const siteContent = document.getElementById('siteContent');
  const globalBgVideo = document.getElementById('globalBgVideo');
  const globalBgSource = 'video/sottofondo.mp4';
  const isMobile = isMobileDevice();

  document.body.classList.add('intro-active');

  if (!intro || !introVideo || !enterBtn) {
    document.body.classList.remove('intro-active');
    return;
  }

  if (globalBgVideo) {
    globalBgVideo.src = globalBgSource;
    globalBgVideo.muted = true;
    globalBgVideo.playsInline = true;
    globalBgVideo.loop = true;
    globalBgVideo.setAttribute('muted', '');
    globalBgVideo.setAttribute('playsinline', '');
    globalBgVideo.setAttribute('loop', '');
    globalBgVideo.removeAttribute('controls');
    globalBgVideo.load();
    globalBgVideo.pause();
  }

  const introSource = isMobile
    ? 'video/smartphone.mp4'
    : 'video/intro.mp4';

  console.log('Intro video device mobile:', isMobile);
  console.log('Intro video selezionato:', introSource);

  const introLoopSeconds = isMobile ? 10 : null;
  configureManagedVideo(introVideo, introSource, introLoopSeconds, 'intro', true);

  enterBtn.addEventListener('click', function() {
    const heroVideo = document.getElementById('heroVideo');

    intro.classList.add('hidden');
    document.body.classList.remove('intro-active');
    introVideo.pause();

    if (siteContent) {
      siteContent.style.display = '';
    }

    if (globalBgVideo) {
      const globalPlayPromise = globalBgVideo.play();
      if (globalPlayPromise && typeof globalPlayPromise.catch === 'function') {
        globalPlayPromise.catch(function(error) {
          console.warn('Autoplay global background video bloccato:', error);
        });
      }
    }

    if (heroVideo) {
      const playPromise = heroVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function(error) {
          console.warn('Autoplay hero video bloccato:', error);
        });
      }
    }
  });
}

function setupHeroVideo() {
  const heroVideo = document.getElementById('heroVideo');
  const isMobile = isMobileDevice();
  const heroSource = isMobile
    ? 'video/testata mobile.mp4'
    : 'video/testata desktop.mp4';

  console.log('Hero video device mobile:', isMobile);
  console.log('Hero video selezionato:', heroSource);

  configureManagedVideo(heroVideo, heroSource, isMobile ? 5 : null, 'hero', false);
}

function setupReveal() {
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

function setupTechnicalLab() {
  var filters = document.querySelectorAll('.lab-filter');
  var cards = document.querySelectorAll('.technical-lab__card');
  var lightbox = document.getElementById('detailLightbox');
  var title = document.getElementById('detailLightboxTitle');
  var description = document.getElementById('detailLightboxText');
  var closeButton = lightbox ? lightbox.querySelector('.lightbox__close') : null;

  filters.forEach(function(filterButton) {
    filterButton.addEventListener('click', function() {
      var selectedFilter = filterButton.dataset.filter || 'all';

      filters.forEach(function(button) {
        var isActive = button === filterButton;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      cards.forEach(function(card) {
        var categories = (card.dataset.category || '').split(' ');
        var shouldShow = selectedFilter === 'all' || categories.indexOf(selectedFilter) !== -1;
        card.classList.toggle('is-hidden', !shouldShow);
      });
    });
  });

  if (!lightbox || !title || !description || !closeButton) return;

  function openDetailLightbox(detailTitle, detailText) {
    title.textContent = detailTitle || 'Approfondimento';
    description.textContent = detailText || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  }

  function closeDetailLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    title.textContent = '';
    description.textContent = '';
  }

  document.querySelectorAll('[data-detail-title][data-detail-text]').forEach(function(actionButton) {
    actionButton.addEventListener('click', function() {
      openDetailLightbox(actionButton.dataset.detailTitle, actionButton.dataset.detailText);
    });
  });

  closeButton.addEventListener('click', closeDetailLightbox);

  lightbox.addEventListener('click', function(event) {
    if (event.target === lightbox) closeDetailLightbox();
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeDetailLightbox();
  });
}

function setupCvConsentModal() {
  var openTrigger = document.getElementById('viewCvButton');
  var modal = document.getElementById('cvConsentModal');
  var checkbox = document.getElementById('cvPrivacyConsent');
  var openCvButton = document.getElementById('openCvButton');
  var message = document.getElementById('cvConsentMessage');
  var closeButton = modal ? modal.querySelector('.lightbox__close') : null;

  if (!openTrigger || !modal || !checkbox || !openCvButton || !closeButton) return;

  function updateButtonState() {
    var enabled = checkbox.checked;
    openCvButton.classList.toggle('is-disabled', !enabled);
    openCvButton.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    if (enabled) {
      openCvButton.setAttribute('href', openCvButton.dataset.cvHref);
    } else {
      openCvButton.removeAttribute('href');
    }
    if (enabled && message) message.textContent = '';
  }

  function openModal() {
    checkbox.checked = false;
    updateButtonState();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    checkbox.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    checkbox.checked = false;
    updateButtonState();
    openTrigger.focus();
  }

  openTrigger.addEventListener('click', openModal);
  checkbox.addEventListener('change', updateButtonState);
  closeButton.addEventListener('click', closeModal);

  openCvButton.addEventListener('click', function(event) {
    if (!checkbox.checked) {
      event.preventDefault();
      if (message) {
        message.textContent = window.portfolioI18n && window.portfolioI18n.getLanguage() === 'en'
          ? 'Please accept the privacy notices before opening the CV.'
          : 'Accetta le informative privacy prima di aprire il CV.';
      }
      checkbox.focus();
      return;
    }
    closeModal();
  });

  modal.addEventListener('click', function(event) {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  updateButtonState();
}

window.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded');
  document.documentElement.classList.remove('dark');
  setupLanguageSelector();
  setupVideoIntro();
  setupHeroVideo();

  const contactForm = document.getElementById('contactForm');
  if (!contactForm) {
    console.error('Errore: form di contatto non trovato in DOM.');
  } else {
    console.log('FORM TROVATO');
    contactForm.addEventListener('submit', handleContactFormSubmit);
    console.log('addEventListener("submit") impostato sul form');
  }

  initEmailJS();
  setupReveal();
  setupCertificateLightbox();
  setupTechnicalLab();
  setupCvConsentModal();
});
