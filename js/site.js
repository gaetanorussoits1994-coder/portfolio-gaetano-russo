(function () {
  'use strict';

  var CONSENT_KEY = 'portfolio-cookie-consent';
  var GA_MEASUREMENT_ID = '';

  function language() {
    return localStorage.getItem('portfolio-language') === 'en' ? 'en' : 'it';
  }

  function text(it, en) {
    return language() === 'en' ? en : it;
  }

  function setLanguageAttributes() {
    document.querySelectorAll('.language-switcher [data-lang="it"]').forEach(function (button) { button.textContent = '🇮🇹 IT'; });
    document.querySelectorAll('.language-switcher [data-lang="en"]').forEach(function (button) { button.textContent = '🇬🇧 EN'; });
    document.querySelectorAll('[data-site-it][data-site-en]').forEach(function (element) {
      element.textContent = text(element.dataset.siteIt, element.dataset.siteEn);
    });
    document.querySelectorAll('[data-site-label-it][data-site-label-en]').forEach(function (element) {
      element.setAttribute('aria-label', text(element.dataset.siteLabelIt, element.dataset.siteLabelEn));
    });
  }

  function addSkipLink() {
    var main = document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'main-content';
    if (document.querySelector('.skip-link')) return;
    var link = document.createElement('a');
    link.className = 'skip-link';
    link.href = '#' + main.id;
    link.dataset.siteIt = 'Salta al contenuto';
    link.dataset.siteEn = 'Skip to content';
    link.textContent = text('Salta al contenuto', 'Skip to content');
    document.body.insertBefore(link, document.body.firstChild);
  }

  function enhanceNavigation() {
    document.querySelectorAll('.nav-toggle__checkbox').forEach(function (toggle) {
      var nav = toggle.closest('.topbar__inner') && toggle.closest('.topbar__inner').querySelector('.nav');
      toggle.setAttribute('aria-expanded', toggle.checked ? 'true' : 'false');
      if (nav && !nav.id) nav.id = 'primary-navigation';
      if (nav) toggle.setAttribute('aria-controls', nav.id);
      toggle.addEventListener('change', function () {
        toggle.setAttribute('aria-expanded', toggle.checked ? 'true' : 'false');
      });
    });
  }

  function secureExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
      var values = (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      ['noopener', 'noreferrer'].forEach(function (value) { if (values.indexOf(value) === -1) values.push(value); });
      link.setAttribute('rel', values.join(' '));
    });
  }

  function createFooter() {
    var footer = document.querySelector('.footer');
    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'footer';
      document.body.appendChild(footer);
    }
    footer.innerHTML =
      '<div class="container footer-pro">' +
        '<div class="footer-pro__identity"><strong>Gaetano Russo</strong>' +
          '<p>IT Infrastructure Specialist<br>System Administrator · SAP Support<br>Windows Server · Networking</p></div>' +
        '<nav class="footer-pro__nav" aria-label="Footer">' +
          '<a href="index.html#home" data-site-it="Home" data-site-en="Home">Home</a>' +
          '<a href="index.html#chi-sono" data-site-it="Chi sono" data-site-en="About me">Chi sono</a>' +
          '<a href="index.html#competenze" data-site-it="Competenze" data-site-en="Skills">Competenze</a>' +
          '<a href="index.html#technical-lab">Technical Lab</a>' +
          '<a href="index.html#esperienze" data-site-it="Esperienze" data-site-en="Experience">Esperienze</a>' +
          '<a href="blog.html">Blog</a><a href="index.html#curriculum">Curriculum Vitae</a>' +
          '<a href="index.html#contatti" data-site-it="Contatti" data-site-en="Contact">Contatti</a>' +
        '</nav>' +
        '<nav class="footer-pro__nav" aria-label="Legal">' +
          '<a href="privacy.html">Privacy Policy</a><a href="cookie-policy.html">Cookie Policy</a>' +
          '<a href="trattamento-dati.html" data-site-it="Trattamento dati" data-site-en="Data processing">Trattamento dati</a>' +
          '<button class="footer-cookie-button" type="button" data-cookie-settings data-site-it="Gestisci cookie" data-site-en="Manage cookies">Gestisci cookie</button>' +
          '<a href="https://www.linkedin.com/in/gaetano-russo-b11664220/" target="_blank" rel="noopener noreferrer">LinkedIn</a>' +
          '<a href="mailto:gaetano.russoits1994@gmail.com">Email</a>' +
        '</nav>' +
        '<p class="footer-pro__copyright">© <span data-current-year></span> Gaetano Russo. <span data-site-it="Tutti i diritti riservati." data-site-en="All rights reserved.">Tutti i diritti riservati.</span></p>' +
      '</div>';
    footer.querySelector('[data-current-year]').textContent = new Date().getFullYear();
  }

  function loadAnalytics() {
    if (!GA_MEASUREMENT_ID || !/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) || window.__portfolioAnalyticsLoaded) return;
    window.__portfolioAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function saveConsent(statistics) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ necessary: true, statistics: statistics, updatedAt: new Date().toISOString() }));
    if (statistics) loadAnalytics();
  }

  function createCookieUi() {
    var wrapper = document.createElement('div');
    wrapper.innerHTML =
      '<section class="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-title" hidden>' +
        '<div><h2 id="cookie-title" data-site-it="La tua privacy" data-site-en="Your privacy">La tua privacy</h2>' +
        '<p data-site-it="Usiamo solo tecnologie necessarie e, con il tuo consenso, statistiche. Analytics non è attualmente configurato." data-site-en="We use only necessary technologies and, with your consent, analytics. Analytics is not currently configured.">Usiamo solo tecnologie necessarie e, con il tuo consenso, statistiche. Analytics non è attualmente configurato.</p>' +
        '<p class="cookie-banner__links"><a href="cookie-policy.html">Cookie Policy</a> · <a href="privacy.html">Privacy Policy</a> · <a href="trattamento-dati.html" data-site-it="Trattamento dati" data-site-en="Data processing">Trattamento dati</a></p></div>' +
        '<div class="cookie-banner__actions"><button type="button" class="button button--primary" data-cookie-accept data-site-it="Accetta tutti" data-site-en="Accept all">Accetta tutti</button>' +
        '<button type="button" class="button button--secondary" data-cookie-reject data-site-it="Rifiuta non necessari" data-site-en="Reject non-essential">Rifiuta non necessari</button>' +
        '<button type="button" class="button button--secondary" data-cookie-customize data-site-it="Personalizza" data-site-en="Customise">Personalizza</button></div>' +
      '</section>' +
      '<div class="cookie-preferences lightbox" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title" aria-hidden="true">' +
        '<div class="lightbox__content cookie-preferences__content"><button type="button" class="lightbox__close" data-cookie-close aria-label="Chiudi">×</button>' +
        '<h2 id="cookie-preferences-title" data-site-it="Preferenze cookie" data-site-en="Cookie preferences">Preferenze cookie</h2>' +
        '<label><input type="checkbox" checked disabled> <span data-site-it="Tecnologie necessarie (sempre attive)" data-site-en="Necessary technologies (always active)">Tecnologie necessarie (sempre attive)</span></label>' +
        '<label><input type="checkbox" data-statistics-consent> <span data-site-it="Statistiche facoltative" data-site-en="Optional analytics">Statistiche facoltative</span></label>' +
        '<div class="cookie-banner__actions"><button type="button" class="button button--primary" data-cookie-save data-site-it="Salva preferenze" data-site-en="Save preferences">Salva preferenze</button></div></div>' +
      '</div>';
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

    var banner = document.querySelector('.cookie-banner');
    var modal = document.querySelector('.cookie-preferences');
    var statistics = modal.querySelector('[data-statistics-consent]');
    var previousFocus = null;
    function readConsent() { try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch (error) { return null; } }
    function closePreferences() { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lightbox-open'); if (previousFocus) previousFocus.focus(); }
    function openPreferences(trigger) { var saved = readConsent(); previousFocus = trigger || document.activeElement; statistics.checked = !!(saved && saved.statistics); modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('lightbox-open'); statistics.focus(); }
    function decide(value) { saveConsent(value); banner.hidden = true; }
    document.querySelector('[data-cookie-accept]').addEventListener('click', function () { decide(true); });
    document.querySelector('[data-cookie-reject]').addEventListener('click', function () { decide(false); });
    document.querySelector('[data-cookie-customize]').addEventListener('click', function (event) { openPreferences(event.currentTarget); });
    document.querySelector('[data-cookie-save]').addEventListener('click', function () { decide(statistics.checked); closePreferences(); });
    document.querySelector('[data-cookie-close]').addEventListener('click', closePreferences);
    modal.addEventListener('click', function (event) { if (event.target === modal) closePreferences(); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && modal.classList.contains('is-open')) closePreferences(); });
    document.querySelectorAll('[data-cookie-settings]').forEach(function (button) { button.addEventListener('click', function () { openPreferences(button); }); });
    var saved = readConsent();
    banner.hidden = !!saved;
    if (saved && saved.statistics) loadAnalytics();
  }

  function createBackToTop() {
    var button = document.createElement('button');
    button.className = 'back-to-top';
    button.type = 'button';
    button.hidden = true;
    button.dataset.siteIt = 'Torna su';
    button.dataset.siteEn = 'Back to top';
    button.dataset.siteLabelIt = 'Torna all’inizio della pagina';
    button.dataset.siteLabelEn = 'Back to the top of the page';
    button.textContent = text('Torna su', 'Back to top');
    document.body.appendChild(button);
    function update() { button.hidden = window.scrollY < 500; }
    window.addEventListener('scroll', update, { passive: true });
    button.addEventListener('click', function () {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    addSkipLink();
    enhanceNavigation();
    secureExternalLinks();
    createFooter();
    createCookieUi();
    createBackToTop();
    setLanguageAttributes();
    document.addEventListener('portfolio:languagechange', setLanguageAttributes);
  });
})();
