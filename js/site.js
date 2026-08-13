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
    document.querySelectorAll('.language-switcher [data-lang="it"]:not([data-detailed-language])').forEach(function (button) { button.textContent = '🇮🇹 IT'; });
    document.querySelectorAll('.language-switcher [data-lang="en"]:not([data-detailed-language])').forEach(function (button) { button.textContent = '🇬🇧 EN'; });
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
      var inner = toggle.closest('.topbar__inner');
      var nav = inner && inner.querySelector('.nav');
      var languageSwitcher = inner && inner.querySelector('.language-switcher');
      var themeToggle = inner && inner.querySelector('.dark-toggle');
      var hamburger = toggle.nextElementSibling;
      if (!inner || !nav || inner.querySelector('[data-legacy-mobile-menu]')) return;
      var panel = document.createElement('div');
      panel.className = 'legacy-mobile-menu';
      panel.id = 'legacy-primary-navigation';
      panel.dataset.legacyMobileMenu = 'true';
      panel.setAttribute('aria-label', text('Menu di navigazione', 'Navigation menu'));
      var panelHeader = document.createElement('div');
      panelHeader.className = 'legacy-mobile-menu__header';
      var panelBrand = document.createElement('strong');
      panelBrand.className = 'legacy-mobile-menu__brand';
      panelBrand.textContent = 'Gaetano Russo';
      var close = document.createElement('button');
      close.className = 'legacy-mobile-menu__close';
      close.type = 'button';
      close.setAttribute('aria-label', text('Chiudi il menu', 'Close menu'));
      close.textContent = '×';
      var actions = document.createElement('div');
      actions.className = 'legacy-mobile-menu__actions';
      actions.setAttribute('aria-label', text('Azioni principali', 'Primary actions'));
      actions.innerHTML =
        '<a href="index.html#case-study" data-site-it="Esplora il profilo IT" data-site-en="Explore the IT profile">Esplora il profilo IT</a>' +
        '<a href="index.html#case-study" data-site-it="Esplora i progetti tecnici" data-site-en="Explore technical projects">Esplora i progetti tecnici</a>' +
        '<a href="index.html#contatti" data-site-it="Contattami" data-site-en="Contact me">Contattami</a>' +
        '<a href="index.html#curriculum" data-site-it="Consulta il CV" data-site-en="View CV">Consulta il CV</a>';
      inner.insertBefore(panel, nav);
      panel.appendChild(panelHeader);
      panelHeader.appendChild(panelBrand);
      if (languageSwitcher) panelHeader.appendChild(languageSwitcher);
      if (themeToggle) panelHeader.appendChild(themeToggle);
      panelHeader.appendChild(close);
      panel.appendChild(nav);
      panel.appendChild(actions);
      toggle.setAttribute('aria-controls', panel.id);
      toggle.setAttribute('aria-expanded', 'false');
      var lockedScrollY = 0;
      var inertElements = [];
      function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }
      function setPageInert(inert) {
        if (!inert) {
          inertElements.forEach(function (element) { element.inert = false; });
          inertElements = [];
          return;
        }
        if (inertElements.length) return;
        inertElements = [document.querySelector('main'), document.querySelector('footer'), inner.querySelector('.brand'), toggle, hamburger].filter(function (element) { return element && !element.inert; });
        inertElements.forEach(function (element) { element.inert = true; });
      }
      function lockScroll() {
        if (document.body.classList.contains('legacy-nav-open')) return;
        lockedScrollY = window.scrollY;
        document.body.classList.add('legacy-nav-open');
        document.body.style.position = 'fixed';
        document.body.style.top = '-' + lockedScrollY + 'px';
        document.body.style.width = '100%';
      }
      function unlockScroll(restore) {
        var wasLocked = document.body.classList.contains('legacy-nav-open');
        document.body.classList.remove('legacy-nav-open');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('width');
        if (wasLocked && restore !== false) window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'auto' });
      }
      function setOpen(open, returnFocus) {
        open = Boolean(open && isMobile());
        toggle.checked = open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', text(open ? 'Chiudi menu' : 'Apri menu', open ? 'Close menu' : 'Open menu'));
        panel.classList.toggle('is-open', open);
        if (isMobile()) {
          panel.inert = !open;
          panel.setAttribute('aria-hidden', String(!open));
          panel.setAttribute('role', 'dialog');
          panel.setAttribute('aria-modal', 'true');
        } else {
          panel.inert = false;
          panel.removeAttribute('aria-hidden');
          panel.removeAttribute('role');
          panel.removeAttribute('aria-modal');
        }
        if (open) { lockScroll(); setPageInert(true); requestAnimationFrame(function () { close.focus(); }); }
        else { setPageInert(false); unlockScroll(); if (returnFocus && isMobile()) toggle.focus(); }
      }
      function syncMode() {
        if (isMobile()) setOpen(panel.classList.contains('is-open'));
        else { setOpen(false); panel.inert = false; panel.removeAttribute('aria-hidden'); panel.removeAttribute('role'); panel.removeAttribute('aria-modal'); }
      }
      toggle.addEventListener('change', function () { setOpen(toggle.checked); });
      close.addEventListener('click', function () { setOpen(false, true); });
      panel.querySelectorAll('a[href]').forEach(function (link) { link.addEventListener('click', function () { setOpen(false, true); }); });
      document.addEventListener('keydown', function (event) {
        if (!panel.classList.contains('is-open')) return;
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); return; }
        if (event.key !== 'Tab') return;
        var focusable = Array.prototype.slice.call(panel.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'));
        if (!focusable.length) return;
        var first = focusable[0]; var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
      window.addEventListener('resize', syncMode, { passive: true });
      window.addEventListener('pagehide', function () { setPageInert(false); unlockScroll(false); });
      document.addEventListener('portfolio:languagechange', function () {
        panel.setAttribute('aria-label', text('Menu di navigazione', 'Navigation menu'));
        close.setAttribute('aria-label', text('Chiudi il menu', 'Close menu'));
        toggle.setAttribute('aria-label', text(panel.classList.contains('is-open') ? 'Chiudi menu' : 'Apri menu', panel.classList.contains('is-open') ? 'Close menu' : 'Open menu'));
      });
      syncMode();
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
    if (footer && footer.hasAttribute('data-preserve-footer')) {
      var currentYear = footer.querySelector('[data-current-year]');
      if (currentYear) currentYear.textContent = new Date().getFullYear();
      return;
    }
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
          '<a href="index.html#profilo" data-site-it="Profilo" data-site-en="Profile">Profilo</a>' +
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
        '<div class="lightbox__content cookie-preferences__content"><button type="button" class="lightbox__close" data-cookie-close aria-label="Chiudi" data-site-label-it="Chiudi preferenze cookie" data-site-label-en="Close cookie preferences">×</button>' +
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
    document.addEventListener('keydown', function (event) {
      if (!modal.classList.contains('is-open')) return;
      if (event.key === 'Escape') { closePreferences(); return; }
      if (event.key !== 'Tab') return;
      var focusable = Array.prototype.slice.call(modal.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
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
    var footer = document.querySelector('.footer');
    function update() {
      button.hidden = window.scrollY < Math.max(480, window.innerHeight * 0.65);
      var overlap = 0;
      if (footer) {
        var footerRect = footer.getBoundingClientRect();
        if (footerRect.top < window.innerHeight && footerRect.bottom > 0) {
          overlap = Math.min(Math.max(0, window.innerHeight - Math.max(footerRect.top, 0)), Math.max(0, window.innerHeight - 80));
        }
      }
      button.style.setProperty('--footer-overlap', overlap + 'px');
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', update, { passive: true });
      window.visualViewport.addEventListener('scroll', update, { passive: true });
    }
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
