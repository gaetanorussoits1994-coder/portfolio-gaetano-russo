(function () {
  'use strict';

  const data = window.PORTFOLIO_DATA;
  if (!data) return;

  let activeTrack = (() => {
    try { return sessionStorage.getItem('portfolio-track') === 'web' ? 'web' : 'it'; }
    catch (error) { return 'it'; }
  })();
  const getLanguage = () => (document.documentElement.lang === 'en' ? 'en' : 'it');
  const text = (value) => typeof value === 'string' ? value : (value && (value[getLanguage()] || value.it)) || '';
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const bilingual = (value) => typeof value === 'string'
    ? ''
    : `data-i18n-it="${escapeHtml(value.it)}" data-i18n-en="${escapeHtml(value.en)}"`;
  const content = (value) => typeof value === 'string' ? escapeHtml(value) : escapeHtml(text(value));
  const translated = (value, tag = 'span') => typeof value === 'string'
    ? `<${tag}>${escapeHtml(value)}</${tag}>`
    : `<${tag} ${bilingual(value)}>${content(value)}</${tag}>`;
  const tags = (items) => `<div class="tags">${items.map((item) => `<span class="tag"${typeof item === 'string' ? '' : ` ${bilingual(item)}`}>${content(item)}</span>`).join('')}</div>`;

  function renderTrackLegacy() {
    const panel = document.querySelector('#track-panel');
    if (!panel) return;
    const isInfrastructure = activeTrack === 'it';
    const items = isInfrastructure ? data.infrastructureCases : data.webProjects;
    const title = isInfrastructure
      ? { it: 'Come affronto i problemi infrastrutturali', en: 'How I approach infrastructure issues' }
      : { it: 'Progetti web con stato e materiali dichiarati', en: 'Web projects with clearly stated status and evidence' };
    const summary = isInfrastructure
      ? { it: 'Attività già presenti nel portfolio, descritte senza dati aziendali riservati e senza metriche ricostruite.', en: 'Work already documented in this portfolio, described without confidential business data or reconstructed metrics.' }
      : { it: 'Distinguo ciò che è online da ciò che è ancora dimostrativo. Lo stack compare solo quando è verificabile.', en: 'I distinguish what is online from what is still demonstrative. A stack is shown only when it can be verified.' };

    let trackContent = '';
    if (isInfrastructure) {
      const featured = items[0];
      const flowLabel = `data-i18n-label-it="Flusso concettuale" data-i18n-label-en="Conceptual flow" aria-label="Flusso concettuale"`;
      const featuredDiagram = featured.diagram ? `<ol class="concept-flow" ${flowLabel}>${featured.diagram.map((step) => `<li ${bilingual(step)}>${content(step)}</li>`).join('')}</ol>` : '';
      const featuredCase = `<article class="case-featured">
        <header class="case-featured__header">
          ${translated(featured.eyebrow, 'span').replace('<span', '<span class="case-eyebrow"')}
          ${translated(featured.title, 'h4')}
          <p ${bilingual(featured.scenario)}>${content(featured.scenario)}</p>
        </header>
        ${featuredDiagram}
        <div class="case-featured__body">
          <section><h5 data-i18n-it="Problema osservato" data-i18n-en="Observed problem">Problema osservato</h5><p ${bilingual(featured.problem)}>${content(featured.problem)}</p></section>
          <ol class="case-workflow">
            <li><span data-i18n-it="Verifiche eseguite" data-i18n-en="Checks performed">Verifiche eseguite</span><p ${bilingual(featured.analysis)}>${content(featured.analysis)}</p></li>
            ${featured.cause ? `<li><span data-i18n-it="Causa individuata" data-i18n-en="Identified cause">Causa individuata</span><p ${bilingual(featured.cause)}>${content(featured.cause)}</p></li>` : ''}
            <li><span data-i18n-it="Intervento" data-i18n-en="Intervention">Intervento</span><p ${bilingual(featured.intervention)}>${content(featured.intervention)}</p></li>
            <li><span data-i18n-it="Verifica" data-i18n-en="Verification">Verifica</span><p ${bilingual(featured.verification)}>${content(featured.verification)}</p></li>
          </ol>
          <aside class="case-result"><span data-i18n-it="Risultato operativo" data-i18n-en="Operational outcome">Risultato operativo</span><p ${bilingual(featured.result)}>${content(featured.result)}</p></aside>
        </div>
        <footer class="case-featured__footer"><div><span class="fact-label" data-i18n-it="Tecnologie nel contesto" data-i18n-en="Technologies in context">Tecnologie nel contesto</span>${tags(featured.technologies)}</div><div><span class="fact-label" data-i18n-it="Competenze dimostrate" data-i18n-en="Skills demonstrated">Competenze dimostrate</span>${tags(featured.competencies)}</div></footer>
      </article>`;
      const secondaryCases = items.slice(1).map((item) => `<details class="case-brief">
        <summary><span ${bilingual(item.eyebrow)}>${content(item.eyebrow)}</span><strong ${bilingual(item.title)}>${content(item.title)}</strong><i aria-hidden="true">+</i></summary>
        <div class="case-brief__content">
          <p class="case-scenario" ${bilingual(item.scenario)}>${content(item.scenario)}</p>
          ${item.diagram ? `<ol class="concept-flow concept-flow--compact" ${flowLabel}>${item.diagram.map((step) => `<li ${bilingual(step)}>${content(step)}</li>`).join('')}</ol>` : ''}
          <dl class="case-details">
            <div><dt data-i18n-it="Problema" data-i18n-en="Problem">Problema</dt><dd ${bilingual(item.problem)}>${content(item.problem)}</dd></div>
            <div><dt data-i18n-it="Verifiche eseguite" data-i18n-en="Checks performed">Verifiche eseguite</dt><dd ${bilingual(item.analysis)}>${content(item.analysis)}</dd></div>
            ${item.cause ? `<div><dt data-i18n-it="Causa individuata" data-i18n-en="Identified cause">Causa individuata</dt><dd ${bilingual(item.cause)}>${content(item.cause)}</dd></div>` : ''}
            <div><dt data-i18n-it="Intervento" data-i18n-en="Intervention">Intervento</dt><dd ${bilingual(item.intervention)}>${content(item.intervention)}</dd></div>
            <div><dt data-i18n-it="Verifica" data-i18n-en="Verification">Verifica</dt><dd ${bilingual(item.verification)}>${content(item.verification)}</dd></div>
          </dl>
          <div class="case-brief__outcome"><p ${bilingual(item.result)}>${content(item.result)}</p>${tags(item.technologies)}</div>
        </div>
      </details>`).join('');
      trackContent = `<div class="case-editorial">${featuredCase}<div class="case-secondary-list">${secondaryCases}</div></div>`;
    } else {
      trackContent = `<div class="project-list">${items.map((item, index) => `<article class="project-editorial${index === 0 ? ' project-editorial--primary' : ''}">
        <header><div><span class="project-type" ${bilingual(item.type)}>${content(item.type)}</span><span class="project-status" ${bilingual(item.status)}>${content(item.status)}</span></div><h4 ${bilingual(item.title)}>${content(item.title)}</h4><p ${bilingual(item.audience)}>${content(item.audience)}</p></header>
        ${item.proof ? `<div class="project-live-proof"><span data-i18n-it="Anteprima reale" data-i18n-en="Real preview">Anteprima reale</span><p ${bilingual(item.proof)}>${content(item.proof)}</p></div>` : ''}
        <dl class="project-decisions">
          <div><dt data-i18n-it="Esigenza" data-i18n-en="Need">Esigenza</dt><dd ${bilingual(item.need)}>${content(item.need)}</dd></div>
          <div><dt data-i18n-it="Soluzione realizzata" data-i18n-en="Implemented solution">Soluzione realizzata</dt><dd ${bilingual(item.decisions)}>${content(item.decisions)}</dd></div>
          <div><dt data-i18n-it="Funzionalità" data-i18n-en="Features">Funzionalità</dt><dd ${bilingual(item.features)}>${content(item.features)}</dd></div>
          <div><dt data-i18n-it="Problemi affrontati" data-i18n-en="Problems addressed">Problemi affrontati</dt><dd ${bilingual(item.problems)}>${content(item.problems)}</dd></div>
          <div><dt data-i18n-it="Stato del risultato" data-i18n-en="Outcome status">Stato del risultato</dt><dd ${bilingual(item.result)}>${content(item.result)}</dd></div>
        </dl>
        <div class="project-stack"><span class="fact-label">Stack</span>${item.stack.length ? tags(item.stack) : `<p data-i18n-it="Stack specifico non documentato." data-i18n-en="Specific stack not documented.">Stack specifico non documentato.</p>`}</div>
        ${item.note ? `<p class="project-note" ${bilingual(item.note)}>${content(item.note)}</p>` : ''}
        ${item.links ? `<div class="project-links">${item.links.map((link) => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" ${bilingual(link.label)}>${content(link.label)} ↗</a>`).join('')}</div>` : ''}
      </article>`).join('')}</div>`;
    }

    const primaryAction = isInfrastructure
      ? { label: { it: 'Vai alle competenze IT', en: 'Explore IT skills' }, href: '#competenze' }
      : { label: { it: 'Vai alle competenze web', en: 'Explore web skills' }, href: '#competenze' };
    panel.innerHTML = `<div class="track-intro">${translated(title, 'h3')}<div>${translated(summary, 'p')}<a class="button track-intro__action" href="${primaryAction.href}" ${bilingual(primaryAction.label)}>${content(primaryAction.label)} →</a></div></div>${trackContent}`;
    renderSkills();
    applyCurrentLanguage();
  }

  function setupCaseAccordion(container) {
    const triggers = [...container.querySelectorAll('[data-accordion-trigger]')];
    const setExpanded = (trigger, expanded) => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.setAttribute('aria-expanded', String(expanded));
      if (panel) panel.hidden = !expanded;
    };
    triggers.forEach((trigger) => trigger.addEventListener('click', () => {
      const shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';
      triggers.forEach((item) => setExpanded(item, false));
      if (shouldOpen) setExpanded(trigger, true);
    }));
  }

  function renderTrack() {
    const panel = document.querySelector('#track-panel');
    if (!panel) return;
    const isInfrastructure = activeTrack === 'it';
    const items = isInfrastructure ? data.infrastructureCases : data.webProjects;
    const title = isInfrastructure
      ? { it: 'Come affronto i problemi infrastrutturali', en: 'How I approach infrastructure issues' }
      : { it: 'Progetti web con stato e materiali dichiarati', en: 'Web projects with clearly stated status and evidence' };
    const summary = isInfrastructure
      ? { it: 'Attività già presenti nel portfolio, descritte senza dati aziendali riservati e senza metriche ricostruite.', en: 'Work already documented in this portfolio, described without confidential business data or reconstructed metrics.' }
      : { it: 'Distinguo ciò che è online da ciò che è ancora dimostrativo. Lo stack compare solo quando è verificabile.', en: 'I distinguish what is online from what is still demonstrative. A stack is shown only when it can be verified.' };
    const flowLabel = 'data-i18n-label-it="Flusso concettuale" data-i18n-label-en="Conceptual flow" aria-label="Flusso concettuale"';

    const accordionItems = items.map((item, index) => {
      const triggerId = `case-trigger-${activeTrack}-${index}`;
      const panelId = `case-panel-${activeTrack}-${index}`;
      const meta = isInfrastructure
        ? `<span class="case-accordion__category" ${bilingual(item.eyebrow)}>${content(item.eyebrow)}</span>`
        : `<span class="case-accordion__category"><span ${bilingual(item.type)}>${content(item.type)}</span><span class="project-status" ${bilingual(item.status)}>${content(item.status)}</span></span>`;
      const intro = isInfrastructure ? item.scenario : item.audience;
      const details = isInfrastructure
        ? `${item.diagram ? `<ol class="concept-flow concept-flow--compact" ${flowLabel}>${item.diagram.map((step) => `<li ${bilingual(step)}>${content(step)}</li>`).join('')}</ol>` : ''}
          <dl class="case-details">
            <div><dt data-i18n-it="Problema" data-i18n-en="Problem">Problema</dt><dd ${bilingual(item.problem)}>${content(item.problem)}</dd></div>
            <div><dt data-i18n-it="Verifiche eseguite" data-i18n-en="Checks performed">Verifiche eseguite</dt><dd ${bilingual(item.analysis)}>${content(item.analysis)}</dd></div>
            ${item.cause ? `<div><dt data-i18n-it="Causa individuata" data-i18n-en="Identified cause">Causa individuata</dt><dd ${bilingual(item.cause)}>${content(item.cause)}</dd></div>` : ''}
            <div><dt data-i18n-it="Intervento" data-i18n-en="Intervention">Intervento</dt><dd ${bilingual(item.intervention)}>${content(item.intervention)}</dd></div>
            <div><dt data-i18n-it="Verifica" data-i18n-en="Verification">Verifica</dt><dd ${bilingual(item.verification)}>${content(item.verification)}</dd></div>
          </dl>
          <aside class="case-brief__outcome"><span class="fact-label" data-i18n-it="Risultato operativo" data-i18n-en="Operational outcome">Risultato operativo</span><p ${bilingual(item.result)}>${content(item.result)}</p>${tags(item.technologies)}${item.competencies ? tags(item.competencies) : ''}</aside>`
        : `${item.proof ? `<div class="project-live-proof"><span data-i18n-it="Anteprima reale" data-i18n-en="Real preview">Anteprima reale</span><p ${bilingual(item.proof)}>${content(item.proof)}</p></div>` : ''}
          <dl class="project-decisions">
            <div><dt data-i18n-it="Esigenza" data-i18n-en="Need">Esigenza</dt><dd ${bilingual(item.need)}>${content(item.need)}</dd></div>
            <div><dt data-i18n-it="Soluzione realizzata" data-i18n-en="Implemented solution">Soluzione realizzata</dt><dd ${bilingual(item.decisions)}>${content(item.decisions)}</dd></div>
            <div><dt data-i18n-it="Funzionalità" data-i18n-en="Features">Funzionalità</dt><dd ${bilingual(item.features)}>${content(item.features)}</dd></div>
            <div><dt data-i18n-it="Problemi affrontati" data-i18n-en="Problems addressed">Problemi affrontati</dt><dd ${bilingual(item.problems)}>${content(item.problems)}</dd></div>
            <div><dt data-i18n-it="Stato del risultato" data-i18n-en="Outcome status">Stato del risultato</dt><dd ${bilingual(item.result)}>${content(item.result)}</dd></div>
          </dl>
          <div class="project-stack"><span class="fact-label">Stack</span>${item.stack.length ? tags(item.stack) : `<p data-i18n-it="Stack specifico non documentato." data-i18n-en="Specific stack not documented.">Stack specifico non documentato.</p>`}</div>
          ${item.note ? `<p class="project-note" ${bilingual(item.note)}>${content(item.note)}</p>` : ''}
          ${item.links ? `<div class="project-links">${item.links.map((link) => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" ${bilingual(link.label)}>${content(link.label)} ↗</a>`).join('')}</div>` : ''}`;
      return `<article class="case-accordion__item">
        <h4 class="case-accordion__heading"><button class="case-accordion__trigger" id="${triggerId}" type="button" aria-expanded="${index === 0}" aria-controls="${panelId}" data-accordion-trigger>
          ${meta}<strong ${bilingual(item.title)}>${content(item.title)}</strong><span class="case-accordion__intro" ${bilingual(intro)}>${content(intro)}</span>
          <span class="case-accordion__control"><span class="accordion-open" data-i18n-it="Apri dettagli" data-i18n-en="Open details">Apri dettagli</span><span class="accordion-close" data-i18n-it="Chiudi dettagli" data-i18n-en="Close details">Chiudi dettagli</span><svg aria-hidden="true" viewBox="0 0 16 16"><path d="m3 6 5 5 5-5"/></svg></span>
        </button></h4>
        <div class="case-accordion__panel" id="${panelId}" role="region" aria-labelledby="${triggerId}"${index === 0 ? '' : ' hidden'}>${details}</div>
      </article>`;
    }).join('');
    const action = isInfrastructure
      ? { label: { it: 'Vai alle competenze IT', en: 'Explore IT skills' }, href: '#competenze' }
      : { label: { it: 'Vai alle competenze web', en: 'Explore web skills' }, href: '#competenze' };
    panel.innerHTML = `<div class="track-intro">${translated(title, 'h3')}<div>${translated(summary, 'p')}<a class="button track-intro__action" href="${action.href}" ${bilingual(action.label)}>${content(action.label)} →</a></div></div><div class="case-accordion">${accordionItems}</div>`;
    setupCaseAccordion(panel);
    renderSkills();
    applyCurrentLanguage();
  }

  function renderSkills() {
    const grid = document.querySelector('[data-skills-grid]');
    if (!grid) return;
    grid.innerHTML = data.skills.map((skill) => `<article class="skill-row${skill.track === activeTrack ? ' is-active' : ' is-dimmed'}" data-skill-track="${skill.track}">
      <span class="skill-track">${skill.track === 'it' ? 'IT' : 'WEB'}</span>
      <div><h3 ${bilingual(skill.name)}>${content(skill.name)}</h3><p ${bilingual(skill.detail)}>${content(skill.detail)}</p></div>
    </article>`).join('');
  }

  function renderLabs() {
    const grid = document.querySelector('[data-lab-grid]');
    if (!grid) return;
    grid.innerHTML = data.labs.map((lab) => `<article class="lab-card reveal" data-lab-category="${lab.category}">
      <small ${bilingual(lab.area)}>${content(lab.area)}</small>
      <div><span class="lab-mode" ${bilingual(lab.mode)}>${content(lab.mode)}</span><h3 ${bilingual(lab.title)}>${content(lab.title)}</h3></div>
      <p ${bilingual(lab.detail)}>${content(lab.detail)}</p>
      <p class="lab-evidence"><strong data-i18n-it="Controllo / evidenza" data-i18n-en="Check / evidence">Controllo / evidenza</strong><span ${bilingual(lab.evidence)}>${content(lab.evidence)}</span></p>${tags(lab.tags)}
    </article>`).join('');
  }

  function renderExperience() {
    const list = document.querySelector('[data-experience-list]');
    if (!list) return;
    list.innerHTML = data.experiences.map((item) => `<article class="timeline-item reveal">
      <time ${bilingual(item.period)}>${content(item.period)}</time>
      <div><span class="timeline-focus" ${bilingual(item.focus)}>${content(item.focus)}</span><h3>${escapeHtml(item.company)}</h3><strong ${bilingual(item.role)}>${content(item.role)}</strong></div>
      <p ${bilingual(item.detail)}>${content(item.detail)}</p>
    </article>`).join('');
  }

  function renderCertifications() {
    const list = document.querySelector('[data-certification-list]');
    if (!list) return;
    list.innerHTML = data.certifications.map((item) => `<article class="certificate-card reveal">
      <img src="${escapeHtml(item.image)}" alt="" loading="lazy" width="120" height="92">
      <div><h3>${escapeHtml(item.title)}</h3><p ${bilingual(item.subtitle)}>${content(item.subtitle)}</p><p ${bilingual(item.detail)}>${content(item.detail)}</p>
      <button type="button" data-certificate="${escapeHtml(item.image)}" data-certificate-title="${escapeHtml(item.title)}" data-i18n-it="Visualizza attestato" data-i18n-en="View certificate">Visualizza attestato ↗</button></div>
    </article>`).join('');
  }

  function applyCurrentLanguage() {
    if (window.portfolioI18n) window.portfolioI18n.applyLanguage(getLanguage());
  }

  function setupTracks() {
    const buttons = [...document.querySelectorAll('[data-track]')];
    const skillButtons = [...document.querySelectorAll('[data-skill-track-select]')];
    const activeLabel = document.querySelector('[data-active-track-label]');
    const updateActiveLabel = () => {
      if (!activeLabel) return;
      activeLabel.textContent = activeTrack === 'it'
        ? (getLanguage() === 'en' ? 'IT Infrastructure' : 'Infrastruttura IT')
        : (getLanguage() === 'en' ? 'Web Development' : 'Sviluppo web');
    };
    const select = (track, focusPanel) => {
      activeTrack = track === 'web' ? 'web' : 'it';
      try { sessionStorage.setItem('portfolio-track', activeTrack); } catch (error) { /* Session persistence is optional. */ }
      buttons.forEach((button) => {
        const active = button.dataset.track === activeTrack;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      skillButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.skillTrackSelect === activeTrack)));
      updateActiveLabel();
      const panel = document.querySelector('#track-panel');
      panel.setAttribute('aria-labelledby', `track-${activeTrack}`);
      renderTrack();
      if (focusPanel) panel.focus({ preventScroll: true });
    };
    buttons.forEach((button) => {
      button.addEventListener('click', () => select(button.dataset.track));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const next = button.dataset.track === 'it' ? 'web' : 'it';
        select(next);
        document.querySelector(`[data-track="${next}"]`).focus();
      });
    });
    skillButtons.forEach((button) => {
      button.addEventListener('click', () => select(button.dataset.skillTrackSelect));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const next = button.dataset.skillTrackSelect === 'it' ? 'web' : 'it';
        select(next);
        document.querySelector(`[data-skill-track-select="${next}"]`).focus();
      });
    });
    document.querySelectorAll('[data-select-track]').forEach((link) => link.addEventListener('click', () => select(link.dataset.selectTrack)));
    document.addEventListener('portfolio:languagechange', updateActiveLabel);
    select(activeTrack);
  }

  function setupLabFilters() {
    document.querySelectorAll('[data-lab-filter]').forEach((button) => button.addEventListener('click', () => {
      const filter = button.dataset.labFilter;
      document.querySelectorAll('[data-lab-filter]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      document.querySelectorAll('[data-lab-category]').forEach((card) => { card.hidden = filter !== 'all' && card.dataset.labCategory !== filter; });
    }));
  }

  function setupTheme() {
    const toggle = document.querySelector('#darkToggle');
    if (!toggle) return;
    const root = document.documentElement;
    const apply = (theme) => {
      root.dataset.theme = theme;
      root.classList.toggle('dark', theme === 'dark');
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.setAttribute('aria-label', getLanguage() === 'en'
        ? (theme === 'dark' ? 'Use light theme' : 'Use dark theme')
        : (theme === 'dark' ? 'Attiva tema chiaro' : 'Attiva tema scuro'));
    };
    apply(root.dataset.theme || 'light');
    toggle.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('site-theme', next); } catch (error) { /* Preferences remain session-only. */ }
      apply(next);
    });
    document.addEventListener('portfolio:languagechange', () => apply(root.dataset.theme || 'light'));
  }

  function setupVideo() {
    const video = document.querySelector('[data-hero-video]');
    if (!video || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const source = video.querySelector('source');
    let currentKind = '';
    let resizeTimer;
    const loadForViewport = () => {
      const nextKind = matchMedia('(max-width: 600px)').matches ? 'mobile' : 'desktop';
      if (nextKind === currentKind) return;
      currentKind = nextKind;
      video.pause();
      video.classList.remove('is-ready');
      source.removeAttribute('src');
      source.src = nextKind === 'mobile' ? source.dataset.mobileSrc : source.dataset.desktopSrc;
      video.load();
      video.addEventListener('canplay', () => video.classList.add('is-ready'), { once: true });
      video.play().catch(() => { /* The static poster remains a complete fallback. */ });
    };
    const activate = () => {
      loadForViewport();
      addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(loadForViewport, 180);
      }, { passive: true });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(activate, { timeout: 1800 });
    else setTimeout(activate, 700);
  }

  function setupReveal() {
    const items = document.querySelectorAll('.reveal');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px' });
    items.forEach((item) => observer.observe(item));
  }

  function setupHeader() {
    const header = document.querySelector('[data-header]');
    const navToggle = document.querySelector('#navToggle');
    const nav = document.querySelector('#primaryNavigation');
    const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
    const hero = document.querySelector('#home');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let activeHash = '';
    const navTargets = navLinks.map((link) => ({ link, target: document.querySelector(link.getAttribute('href')) })).filter((item) => item.target);
    const navHashes = new Set(navTargets.map(({ link }) => link.getAttribute('href')));
    const syncHeaderOffset = () => {
      const offset = Math.ceil(header.getBoundingClientRect().height + 20);
      document.documentElement.style.setProperty('--header-offset', `${offset}px`);
      return offset;
    };
    const setActive = (hash, updateUrl) => {
      if (hash === activeHash) return;
      activeHash = hash;
      navTargets.forEach(({ link }) => {
        const active = link.getAttribute('href') === hash;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
      if (!updateUrl) return;
      const cleanUrl = `${location.pathname}${location.search}`;
      if (hash) history.replaceState(null, '', hash);
      else if (navHashes.has(location.hash)) history.replaceState(null, '', cleanUrl);
    };
    const update = () => {
      header.classList.toggle('is-scrolled', scrollY > 24);
      const headerHeight = syncHeaderOffset();
      const activationLine = headerHeight + Math.min(52, innerHeight * .08);
      if (hero && hero.getBoundingClientRect().bottom > activationLine) {
        setActive('', true);
        return;
      }
      const visible = navTargets.find(({ target }) => {
        const rect = target.getBoundingClientRect();
        return rect.top <= activationLine && rect.bottom > activationLine;
      });
      setActive(visible ? `#${visible.target.id}` : '', true);
    };
    const requestUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    const scrollToTarget = (hash, behavior) => {
      const target = hash && document.querySelector(hash);
      if (!target) return false;
      target.scrollIntoView({ block: 'start', behavior });
      return true;
    };
    const setMenu = (open, returnFocus) => {
      nav.classList.toggle('is-open', open);
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', getLanguage() === 'en'
        ? (open ? 'Close menu' : 'Open menu')
        : (open ? 'Chiudi il menu' : 'Apri il menu'));
      document.body.classList.toggle('nav-open', open);
      if (open && navLinks.length) requestAnimationFrame(() => navLinks[0].focus());
      if (returnFocus) navToggle.focus();
    };
    syncHeaderOffset();
    header.classList.toggle('is-scrolled', scrollY > 24);
    addEventListener('scroll', requestUpdate, { passive: true });
    navToggle.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      if (!scrollToTarget(hash, reducedMotion ? 'auto' : 'smooth')) return;
      event.preventDefault();
      history.pushState(null, '', hash);
      setMenu(false);
    }));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true);
      if (event.key === 'Tab' && nav.classList.contains('is-open')) {
        const focusable = [navToggle, ...navLinks, ...document.querySelectorAll('.header-tools button:not([disabled])')];
        const current = focusable.indexOf(document.activeElement);
        if (event.shiftKey && current <= 0) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
        else if (!event.shiftKey && current === focusable.length - 1) { event.preventDefault(); focusable[0].focus(); }
      }
    });
    addEventListener('resize', () => {
      syncHeaderOffset();
      if (innerWidth > 780 && nav.classList.contains('is-open')) setMenu(false);
      requestUpdate();
    }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(() => { syncHeaderOffset(); requestUpdate(); }).observe(header);

    addEventListener('popstate', () => { if (location.hash) scrollToTarget(location.hash, 'auto'); else scrollTo({ top: 0, behavior: 'auto' }); });
    const initialHash = location.hash;
    if (initialHash) setTimeout(() => { scrollToTarget(initialHash, 'auto'); requestUpdate(); }, 80);
    else { setActive('', false); requestUpdate(); }
  }

  function setupFocusCarousel() {
    const card = document.querySelector('[data-focus-card]');
    if (!card) return;
    const focusItems = [
      {
        title: { it: 'Continuità operativa', en: 'Operational continuity' },
        description: { it: 'Supporto e diagnosi per mantenere accessibili sistemi e servizi aziendali.', en: 'Support and diagnostics to keep business systems and services available.' }
      },
      {
        title: { it: 'Infrastrutture affidabili', en: 'Reliable infrastructure' },
        description: { it: 'Gestione di server Windows, identità, rete e accessi in contesti enterprise.', en: 'Windows server, identity, network and access management in enterprise environments.' }
      },
      {
        title: { it: 'Interfacce responsive', en: 'Responsive interfaces' },
        description: { it: 'Contenuti, navigazione e interazioni verificati su desktop e dispositivi mobili.', en: 'Content, navigation and interactions checked across desktop and mobile devices.' }
      }
    ];
    const title = card.querySelector('[data-hero-focus]');
    const description = card.querySelector('[data-focus-description]');
    const count = card.querySelector('[data-focus-count]');
    const controls = [...card.querySelectorAll('[data-focus-index]')];
    let index = 0;
    let timer;
    let stopped = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const render = () => {
      title.textContent = text(focusItems[index].title);
      description.textContent = text(focusItems[index].description);
      count.textContent = `0${index + 1} / 03`;
      controls.forEach((control, controlIndex) => {
        control.setAttribute('aria-current', String(controlIndex === index));
        control.setAttribute('aria-label', `Focus ${controlIndex + 1}: ${text(focusItems[controlIndex].title)}`);
      });
    };
    const stop = () => { stopped = true; clearInterval(timer); };
    const start = () => {
      if (stopped) return;
      timer = setInterval(() => { index = (index + 1) % focusItems.length; render(); }, 5200);
    };
    controls.forEach((control) => control.addEventListener('click', () => {
      stop();
      index = Number(control.dataset.focusIndex);
      render();
    }));
    card.addEventListener('focusin', stop, { once: true });
    card.addEventListener('pointerdown', stop, { once: true });
    document.addEventListener('portfolio:languagechange', render);
    render();
    start();
  }

  function setupDialogs() {
    const certificateModal = document.querySelector('[data-certificate-modal]');
    const cvModal = document.querySelector('[data-cv-modal]');
    let modalTrigger = null;
    const focusable = (dialog) => [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-disabled') !== 'true');
    const prepareCv = () => {
      const consent = cvModal && cvModal.querySelector('[data-cv-consent]');
      const message = cvModal && cvModal.querySelector('[data-cv-message]');
      if (consent) consent.checked = false;
      if (message) message.textContent = '';
      cvModal && cvModal.querySelectorAll('[data-view-cv], [data-download-cv]').forEach((link) => {
        link.classList.add('is-disabled');
        link.setAttribute('aria-disabled', 'true');
        link.tabIndex = -1;
      });
    };
    const openDialog = (dialog, trigger) => {
      if (!dialog) return;
      modalTrigger = trigger;
      if (dialog === cvModal) prepareCv();
      dialog.showModal();
      document.body.classList.add('modal-open');
      const initialFocus = dialog === cvModal ? dialog.querySelector('[data-cv-consent]') : dialog.querySelector('[data-close-modal]');
      requestAnimationFrame(() => (initialFocus || dialog).focus());
    };
    document.addEventListener('click', (event) => {
      const certificate = event.target.closest('[data-certificate]');
      if (certificate && certificateModal) {
        const certificateTitle = certificate.dataset.certificateTitle || (getLanguage() === 'en' ? certificate.dataset.certificateTitleEn : certificate.dataset.certificateTitleIt);
        const certificateImage = certificateModal.querySelector('img');
        certificateImage.src = certificate.dataset.certificate;
        certificateImage.alt = certificateTitle;
        certificateImage.hidden = false;
        certificateModal.querySelector('figcaption').textContent = certificateTitle;
        openDialog(certificateModal, certificate);
      }
      const cvTrigger = event.target.closest('[data-open-cv]');
      if (cvTrigger && cvModal) openDialog(cvModal, cvTrigger);
      if (event.target.closest('[data-close-modal]')) event.target.closest('dialog').close();
    });
    document.querySelectorAll('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') return;
        const items = focusable(dialog);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
      dialog.addEventListener('close', () => {
        document.body.classList.toggle('modal-open', Boolean(document.querySelector('dialog[open]')));
        if (modalTrigger && modalTrigger.isConnected) modalTrigger.focus({ preventScroll: true });
        modalTrigger = null;
      });
    });
    const consent = document.querySelector('[data-cv-consent]');
    const links = document.querySelectorAll('[data-view-cv], [data-download-cv]');
    const message = document.querySelector('[data-cv-message]');
    if (consent) consent.addEventListener('change', () => {
      links.forEach((link) => {
        link.classList.toggle('is-disabled', !consent.checked);
        link.setAttribute('aria-disabled', String(!consent.checked));
        link.tabIndex = consent.checked ? 0 : -1;
      });
      message.textContent = consent.checked ? '' : (getLanguage() === 'en'
        ? 'Accept the notice to enable the document.'
        : 'Accetta l’informativa per abilitare il documento.');
    });
    links.forEach((link) => link.addEventListener('click', (event) => { if (!consent.checked) event.preventDefault(); }));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (window.PORTFOLIO_READY) await window.PORTFOLIO_READY;
    renderLabs();
    renderExperience();
    renderCertifications();
    setupTracks();
    setupLabFilters();
    setupTheme();
    setupVideo();
    setupHeader();
    setupFocusCarousel();
    setupDialogs();
    applyCurrentLanguage();
    setupReveal();
  });
})();
