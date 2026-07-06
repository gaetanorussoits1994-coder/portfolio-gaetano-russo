(function () {
  'use strict';

  var STORAGE_KEY = 'portfolio-language';

  var keyedTranslations = {
    it: {
      'nav.about': 'Chi sono',
      'nav.skills': 'Competenze',
      'nav.lab': 'Technical Lab',
      'nav.services': 'Servizi',
      'nav.experience': 'Esperienze',
      'nav.certifications': 'Certificazioni',
      'nav.blog': 'Blog',
      'nav.cv': 'CV',
      'nav.contact': 'Contatti',
      'nav.privacy': 'Privacy Policy',
      'nav.data': 'Trattamento dati',
      'nav.back': 'Torna al Portfolio',
      'action.learn': 'Scopri di più',
      'action.contact': 'Contattami',
      'action.viewLab': 'Visualizza Lab',
      'action.readMore': 'Leggi di più',
      'action.viewCertificate': 'Visualizza attestato',
      'action.viewCv': 'Visualizza CV',
      'action.openCv': 'Apri CV',
      'action.send': 'Invia messaggio',
      'about.tag': 'Chi sono',
      'about.title': 'IT Specialist con esperienza operativa reale',
      'about.approach': 'Il mio approccio',
      'skills.tag': 'Competenze',
      'skills.title': 'Specializzazioni chiave',
      'lab.tag': 'Technical Lab',
      'lab.title': 'Technical Lab',
      'experience.tag': 'Esperienze',
      'experience.title': 'Esperienze professionali',
      'certifications.tag': 'Certificazioni e Attestati',
      'certifications.title': 'Formazione certificata',
      'services.tag': 'Servizi',
      'services.title': 'Proposte di valore',
      'blog.tag': 'Blog',
      'blog.title': 'Approfondimenti tecnici',
      'cv.title': 'Curriculum Vitae',
      'contact.tag': 'Contatti',
      'contact.title': 'Parliamo del tuo progetto IT',
      'form.name': 'Nome',
      'form.company': 'Azienda (opzionale)',
      'form.message': 'Messaggio',
      'footer.privacy': 'Privacy Policy',
      'footer.data': 'Trattamento dati',
      'cv.modal.title': 'Prima di visualizzare il CV'
    },
    en: {
      'nav.about': 'About me',
      'nav.skills': 'Skills',
      'nav.lab': 'Technical Lab',
      'nav.services': 'Services',
      'nav.experience': 'Experience',
      'nav.certifications': 'Certifications',
      'nav.blog': 'Blog',
      'nav.cv': 'CV',
      'nav.contact': 'Contact',
      'nav.privacy': 'Privacy Policy',
      'nav.data': 'Data processing',
      'nav.back': 'Back to Portfolio',
      'action.learn': 'Learn more',
      'action.contact': 'Contact me',
      'action.viewLab': 'View lab',
      'action.readMore': 'Read more',
      'action.viewCertificate': 'View certificate',
      'action.viewCv': 'View CV',
      'action.openCv': 'Open CV',
      'action.send': 'Send message',
      'about.tag': 'About me',
      'about.title': 'IT Specialist with hands-on professional experience',
      'about.approach': 'My approach',
      'skills.tag': 'Skills',
      'skills.title': 'Core specialisations',
      'lab.tag': 'Technical Lab',
      'lab.title': 'Technical Lab',
      'experience.tag': 'Experience',
      'experience.title': 'Professional experience',
      'certifications.tag': 'Certifications and awards',
      'certifications.title': 'Certified training',
      'services.tag': 'Services',
      'services.title': 'How I can help',
      'blog.tag': 'Blog',
      'blog.title': 'Technical insights',
      'cv.title': 'Curriculum Vitae',
      'contact.tag': 'Contact',
      'contact.title': 'Let’s talk about your IT project',
      'form.name': 'Name',
      'form.company': 'Company (optional)',
      'form.message': 'Message',
      'footer.privacy': 'Privacy Policy',
      'footer.data': 'Data processing',
      'cv.modal.title': 'Before viewing the CV'
    }
  };

  var translations = {
    en: {
      'Chi sono': 'About me',
      'Competenze': 'Skills',
      'Servizi': 'Services',
      'Esperienze': 'Experience',
      'Certificazioni': 'Certifications',
      'Certificazioni e Attestati': 'Certifications and awards',
      'Contatti': 'Contact',
      'Portfolio': 'Portfolio',
      'Learn More': 'Learn more',
      'Contattami': 'Contact me',
      'IT Specialist con esperienza operativa reale': 'IT Specialist with hands-on professional experience',
      'Gestisco quotidianamente infrastrutture IT aziendali, supporto utenti, reti e piattaforme SAP in contesti enterprise, industriali e multinazionali.': 'I manage corporate IT infrastructure, user support, networks and SAP platforms every day across enterprise, industrial and multinational environments.',
      'Il mio approccio': 'My approach',
      'Gestione infrastruttura IT enterprise e datacenter': 'Enterprise IT infrastructure and data centre management',
      'Supporto a reparti produttivi e filiali estere': 'Support for production departments and international branches',
      'Sicurezza operativa e continuità dei servizi': 'Operational security and service continuity',
      'Specializzazioni chiave': 'Core specialisations',
      'Laboratori, ambienti di test e tecnologie utilizzate per consolidare competenze operative in infrastrutture IT, networking, sistemi enterprise e sviluppo web.': 'Labs, test environments and technologies used to strengthen hands-on skills in IT infrastructure, networking, enterprise systems and web development.',
      'Tutti': 'All',
      'Visualizza Lab': 'View lab',
      'Active Directory': 'Active Directory',
      'Gestione centralizzata di identità, gruppi, OU, permessi, policy e autenticazione in domini Windows.': 'Centralised management of identities, groups, OUs, permissions, policies and authentication in Windows domains.',
      'Installazione, configurazione, manutenzione e amministrazione di server Windows in ambienti enterprise.': 'Installation, configuration, maintenance and administration of Windows servers in enterprise environments.',
      'Virtualizzazione e gestione ambienti': 'Virtualisation and environment management',
      'Creazione e amministrazione di ambienti virtualizzati, snapshot, networking virtuale e scenari di laboratorio.': 'Creation and administration of virtual environments, snapshots, virtual networking and lab scenarios.',
      'Supporto tecnico SAP, gestione utenti, troubleshooting, SAP GUI, SAP Router e attività di assistenza applicativa.': 'SAP technical support, user management, troubleshooting, SAP GUI, SAP Router and application assistance.',
      'Configurazione e troubleshooting di accessi remoti sicuri, tunnel VPN e connettività aziendale.': 'Configuration and troubleshooting of secure remote access, VPN tunnels and corporate connectivity.',
      'Analisi e gestione di routing, switching, VLAN, subnetting e troubleshooting della connettività.': 'Analysis and management of routing, switching, VLANs, subnetting and connectivity troubleshooting.',
      'Analisi della copertura wireless, progettazione reti Wi-Fi enterprise, ottimizzazione segnale e troubleshooting.': 'Wireless coverage analysis, enterprise Wi-Fi design, signal optimisation and troubleshooting.',
      'Containerizzazione delle applicazioni, gestione immagini, container, compose e ambienti di sviluppo.': 'Application containerisation and management of images, containers, Compose and development environments.',
      'Sviluppo frontend moderno con Next.js, ottimizzazione SEO, routing e performance.': 'Modern frontend development with Next.js, SEO optimisation, routing and performance.',
      'Backend-as-a-Service, autenticazione, database PostgreSQL, API REST, realtime e storage.': 'Backend as a Service, authentication, PostgreSQL databases, REST APIs, real-time features and storage.',
      'Esperienze professionali': 'Professional experience',
      'LET’S CO S.R.L. — Tecnico IT': 'LET’S CO S.R.L. — IT Technician',
      '01/2024 - Presente · Gestione infrastruttura IT, VMware, Windows Server, Active Directory, VPN e supporto operativo per ambiente produttivo.': '01/2024 - Present · IT infrastructure management, VMware, Windows Server, Active Directory, VPN and operational support for a production environment.',
      '01/2023 - 12/2023 · Supporto utente, networking aziendale, configurazione VPN, Google Workspace e gestione workstation e periferiche.': '01/2023 - 12/2023 · User support, corporate networking, VPN configuration, Google Workspace, workstations and peripherals.',
      '11/2021 - 02/2022 · Sviluppo ABAP, assistenza SAP, SAP Router e troubleshooting in ambiente ERP.': '11/2021 - 02/2022 · ABAP development, SAP support, SAP Router and troubleshooting in an ERP environment.',
      'Formazione certificata': 'Certified training',
      'Visualizza attestato': 'View certificate',
      'Progetti': 'Projects',
      'Progetti selezionati': 'Selected projects',
      'Gestione infrastruttura IT enterprise': 'Enterprise IT infrastructure management',
      'Supporto SAP e troubleshooting': 'SAP support and troubleshooting',
      'Reti e Wi-Fi industriale': 'Industrial networks and Wi-Fi',
      'Amministrazione server, Active Directory e datacenter esterni con attenzione alla continuità operativa.': 'Server, Active Directory and external data centre administration with a focus on operational continuity.',
      'Assistenza SAP, SAP Router, trasporti CR e troubleshooting applicativo in contesti mission-critical.': 'SAP assistance, SAP Router, CR transports and application troubleshooting in mission-critical environments.',
      'Progettazione networking aziendale, indirizzamenti IP e Wi-Fi survey in ambienti di produzione.': 'Corporate network design, IP addressing and Wi-Fi surveys in production environments.',
      'Proposte di valore': 'How I can help',
      'Supporto infrastrutture Windows Server, datacenter esterni, migrazioni server e gestione operativa delle risorse IT.': 'Support for Windows Server infrastructure, external data centres, server migrations and operational IT resource management.',
      'Amministrazione Domain Controller, policy AD e gestione utenti in ambienti enterprise.': 'Domain Controller administration, AD policies and user management in enterprise environments.',
      'Supporto SAP, SAP Router, trasporti CR e troubleshooting per piattaforme ERP critiche.': 'SAP support, SAP Router, CR transports and troubleshooting for critical ERP platforms.',
      'Progetto reti aziendali, VPN sicure, indirizzamenti IP e Wi-Fi survey per stabilità in ambienti produttivi.': 'Corporate network design, secure VPNs, IP addressing and Wi-Fi surveys for stable production environments.',
      'Approfondimenti tecnici': 'Technical insights',
      'Guida a Windows Server e Active Directory': 'Guide to Windows Server and Active Directory',
      'Best practice per assicurare disponibilità, domain controller corretti e gestione degli utenti in ambienti enterprise.': 'Best practices for availability, reliable domain controllers and user management in enterprise environments.',
      'Strategie di difesa per infrastrutture aziendali': 'Defence strategies for corporate infrastructure',
      'Approccio concreto alla protezione di reti, VPN e sistemi SAP in contesti multinazionali.': 'A practical approach to protecting networks, VPNs and SAP systems in multinational environments.',
      'Gestione del supporto tecnico SAP, utenti, SAP GUI, SAP Router e troubleshooting applicativo.': 'Management of SAP technical support, users, SAP GUI, SAP Router and application troubleshooting.',
      'Routing, switching, VLAN, indirizzamenti IP e continuità operativa nelle reti aziendali.': 'Routing, switching, VLANs, IP addressing and operational continuity in corporate networks.',
      'Analisi della copertura wireless e ottimizzazione della connettività in ambienti produttivi.': 'Wireless coverage analysis and connectivity optimisation in production environments.',
      'Creazione di ambienti di test, snapshot, reti virtuali e laboratori per infrastrutture IT.': 'Creation of test environments, snapshots, virtual networks and IT infrastructure labs.',
      'Containerizzazione, gestione immagini, compose e ambienti riproducibili per sviluppo e test.': 'Containerisation, image management, Compose and reproducible environments for development and testing.',
      'Workflow di versionamento, repository, branch, deploy e gestione del ciclo di rilascio.': 'Version control workflows, repositories, branches, deployments and release cycle management.',
      'Come ho sviluppato questo Portfolio': 'How I built this portfolio',
      'Struttura del sito, organizzazione dei contenuti, responsive design e integrazione del form contatti.': 'Website structure, content organisation, responsive design and contact form integration.',
      'Sviluppo Full Stack - Barber Booking Platform': 'Full-stack development - Barber Booking Platform',
      'Architettura di una piattaforma booking con frontend moderno, backend, autenticazione e database.': 'Architecture of a booking platform with a modern frontend, backend, authentication and database.',
      'Leggi di più': 'Read more',
      'Curriculum Vitae': 'Curriculum Vitae',
      'Consulta il mio curriculum aggiornato con esperienze professionali, competenze tecniche, certificazioni e progetti sviluppati nel settore IT Infrastructure e Software Development.': 'View my updated CV with professional experience, technical skills, certifications and projects in IT Infrastructure and Software Development.',
      'Visualizza CV': 'View CV',
      'Parliamo del tuo progetto IT': 'Let’s talk about your IT project',
      'Aiuto aziende e team a migliorare affidabilità, sicurezza e continuità operativa delle infrastrutture IT.': 'I help companies and teams improve the reliability, security and continuity of their IT infrastructure.',
      'Nel portfolio sono raccolte esperienze professionali, competenze tecniche, certificazioni e approfondimenti relativi a sistemi enterprise, networking, Active Directory, SAP e cybersecurity.': 'This portfolio presents professional experience, technical skills, certifications and insights into enterprise systems, networking, Active Directory, SAP and cybersecurity.',
      'Per informazioni, collaborazioni professionali o confronto tecnico, puoi contattarmi tramite il modulo sottostante o attraverso LinkedIn.': 'For information, professional collaborations or a technical discussion, contact me through the form below or LinkedIn.',
      'Contattami su WhatsApp': 'Contact me on WhatsApp',
      'Visualizza il mio profilo LinkedIn': 'View my LinkedIn profile',
      'Visita il mio profilo LinkedIn': 'Visit my LinkedIn profile',
      'Nome': 'Name',
      'Azienda (opzionale)': 'Company (optional)',
      'Messaggio': 'Message',
      'Invia messaggio': 'Send message',
      'Invio in corso...': 'Sending...',
      'Messaggio inviato correttamente': 'Message sent successfully',
      'Errore: compila i campi obbligatori': 'Please complete all required fields',
      'Errore: email non valida': 'Please enter a valid email address',
      'Errore durante l’invio': 'An error occurred while sending',
      'Privacy Policy': 'Privacy Policy',
      'Trattamento dati': 'Data processing notice',
      'Informativa sul trattamento dei dati': 'Data processing notice',
      'Ho letto e accetto la': 'I have read and accept the',
      'e l’informativa sul': 'and the',
      'Per inviare il messaggio è necessario accettare la Privacy Policy e l’informativa sul trattamento dei dati.': 'To send the message, you must accept the Privacy Policy and the data processing notice.',
      'Prima di visualizzare il CV': 'Before viewing the CV',
      'Prima di visualizzare il CV, conferma di aver letto la Privacy Policy e l’informativa sul trattamento dei dati. Il documento contiene dati personali e professionali di Gaetano Russo ed è reso disponibile esclusivamente per finalità di consultazione professionale.': 'Before viewing the CV, confirm that you have read the Privacy Policy and the data processing notice. The document contains Gaetano Russo’s personal and professional information and is made available exclusively for professional consultation.',
      'Confermo di aver letto e accettato': 'I confirm that I have read and accepted the',
      'e il': 'and the',
      'Apri CV': 'Open CV',
      'Chiudi': 'Close',
      'Approfondimento': 'Details',
      'Il tuo nome': 'Your name',
      'Nome azienda': 'Company name',
      'Descrivi il progetto o la richiesta': 'Describe your project or request',
      'Blog professionale IT': 'Professional IT blog',
      'Approfondimenti su infrastrutture enterprise, reti, SAP e cybersecurity per recruiter e professionisti del settore.': 'Insights into enterprise infrastructure, networking, SAP and cybersecurity for recruiters and IT professionals.',
      'Categorie': 'Categories',
      'Filtra per argomento': 'Filter by topic',
      'Tutte': 'All',
      'Torna al Blog': 'Back to the blog',
      'Introduzione': 'Introduction',
      'Best practice': 'Best practices',
      'Modalità del trattamento': 'Processing methods',
      'Dati trattati': 'Data processed',
      'Finalità del trattamento': 'Purpose of processing',
      'Base giuridica': 'Legal basis',
      'Soggetti terzi tecnici': 'Technical third parties',
      'Conservazione dei dati': 'Data retention',
      'Diritti dell’interessato': 'Your rights',
      'Contatti del titolare': 'Data controller contact',
      'Natura del sito': 'About this website',
      'Ultimo aggiornamento: 6 luglio 2026': 'Last updated: 6 July 2026',
      'Il presente testo ha finalità informative e non costituisce consulenza legale.': 'This text is provided for information purposes and does not constitute legal advice.'
    }
  };

  function currentLanguage() {
    var saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'it';
  }

  function translateLeafText(language) {
    if (language !== 'en') {
      document.querySelectorAll('[data-i18n-original]').forEach(function (element) {
        element.textContent = element.dataset.i18nOriginal;
      });
      return;
    }

    document.querySelectorAll('h1, h2, h3, p, li, span, label, button, a, option').forEach(function (element) {
      if (element.children.length || element.hasAttribute('data-i18n-skip') || element.hasAttribute('data-i18n') || element.hasAttribute('data-i18n-it')) return;
      var original = element.dataset.i18nOriginal || element.textContent.trim();
      var translated = translations.en[original];
      if (!translated) return;
      element.dataset.i18nOriginal = original;
      element.textContent = translated;
    });
  }

  function translateKeyedText(language) {
    var dictionary = keyedTranslations[language] || keyedTranslations.it;
    document.querySelectorAll('[data-i18n]').forEach(function (element) {
      var value = dictionary[element.dataset.i18n];
      if (typeof value === 'string') element.textContent = value;
    });
  }

  function translateAttributes(language) {
    document.querySelectorAll('[placeholder]').forEach(function (element) {
      var original = element.dataset.i18nPlaceholder || element.getAttribute('placeholder');
      element.dataset.i18nPlaceholder = original;
      element.setAttribute('placeholder', language === 'en' && translations.en[original] ? translations.en[original] : original);
    });

    document.querySelectorAll('[data-i18n-it][data-i18n-en]').forEach(function (element) {
      element.textContent = language === 'en' ? element.dataset.i18nEn : element.dataset.i18nIt;
    });
  }

  function updateSwitcher(language) {
    document.querySelectorAll('.language-switcher button').forEach(function (button) {
      var active = button.dataset.lang === language;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyLanguage(language) {
    document.documentElement.lang = language;
    translateKeyedText(language);
    translateLeafText(language);
    translateAttributes(language);
    updateSwitcher(language);
    document.dispatchEvent(new CustomEvent('portfolio:languagechange', { detail: { language: language } }));
  }

  function createSwitcher() {
    document.querySelectorAll('.topbar__inner').forEach(function (container) {
      if (container.querySelector('.language-switcher')) return;

      var switcher = document.createElement('div');
      switcher.className = 'language-switcher';
      switcher.setAttribute('role', 'group');
      switcher.setAttribute('aria-label', 'Seleziona lingua / Select language');
      switcher.innerHTML =
        '<button type="button" data-lang="it" aria-pressed="false">IT</button>' +
        '<span aria-hidden="true">/</span>' +
        '<button type="button" data-lang="en" aria-pressed="false">EN</button>';

      var darkToggle = container.querySelector('.dark-toggle');
      container.insertBefore(switcher, darkToggle || null);
    });

    document.querySelectorAll('.language-switcher button').forEach(function (button) {
      button.dataset.languageHandler = 'ready';
      button.addEventListener('click', function () {
        var language = button.dataset.lang;
        localStorage.setItem(STORAGE_KEY, language);
        applyLanguage(language);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    createSwitcher();
    applyLanguage(currentLanguage());
  });

  window.portfolioI18n = {
    getLanguage: currentLanguage,
    applyLanguage: applyLanguage
  };
})();
