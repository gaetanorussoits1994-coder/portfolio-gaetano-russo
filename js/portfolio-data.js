(function () {
  'use strict';

  const t = (it, en) => ({ it, en });

  window.PORTFOLIO_DATA = {
    profile: {
      name: 'Gaetano Russo',
      role: t('IT Infrastructure Specialist', 'IT Infrastructure Specialist'),
      location: t('Padova, Italia', 'Padua, Italy'),
      email: 'gaetano.russoits1994@gmail.com',
      linkedin: 'https://www.linkedin.com/in/gaetano-russo-b11664220/'
    },
    skills: [
      { track: 'it', name: 'Windows Server', detail: t('Amministrazione, manutenzione, file server e servizi di dominio.', 'Administration, maintenance, file servers and domain services.') },
      { track: 'it', name: 'Active Directory', detail: t('Utenti, gruppi, OU, permessi, GPO e autenticazione centralizzata.', 'Users, groups, OUs, permissions, GPOs and centralised authentication.') },
      { track: 'it', name: 'DNS & DHCP', detail: t('Servizi di rete, indirizzamento e diagnosi della connettività.', 'Network services, addressing and connectivity diagnostics.') },
      { track: 'it', name: 'LAN · VLAN · VPN', detail: t('Routing, switching, segmentazione e accessi remoti sicuri.', 'Routing, switching, segmentation and secure remote access.') },
      { track: 'it', name: t('Supporto SAP', 'SAP Support'), detail: t('SAP GUI, SAP Router, utenti, trasporti CR e troubleshooting.', 'SAP GUI, SAP Router, users, CR transports and troubleshooting.') },
      { track: 'it', name: 'Supporto enterprise', detail: t('Gestione utenti, workstation, periferiche e continuità operativa.', 'User, workstation and device management with operational continuity.') },
      { track: 'web', name: 'HTML & CSS', detail: t('Interfacce semantiche, responsive e accessibili.', 'Semantic, responsive and accessible interfaces.') },
      { track: 'web', name: 'JavaScript', detail: t('Interazioni, filtri, modali, preferenze e progressive enhancement.', 'Interactions, filters, dialogs, preferences and progressive enhancement.') },
      { track: 'web', name: 'Git & GitHub', detail: t('Versionamento, repository e workflow di rilascio controllato.', 'Version control, repositories and controlled release workflows.') },
      { track: 'web', name: 'Responsive & SEO', detail: t('Esperienze coerenti su ogni dispositivo e struttura indicizzabile.', 'Consistent cross-device experiences and indexable structure.') }
    ],
    infrastructureCases: [
      {
        eyebrow: t('Caso principale · Identità e accessi', 'Main case · Identity and access'),
        title: t('Gestione di utenti e permessi in dominio Windows', 'Managing users and permissions in a Windows domain'),
        scenario: t('Supporto quotidiano a utenti e risorse condivise in un ambiente aziendale basato su Windows Server e Active Directory.', 'Day-to-day support for users and shared resources in a corporate Windows Server and Active Directory environment.'),
        problem: t('Un accesso negato o una policy non applicata può dipendere dall’account, dai gruppi, dall’OU, dalla GPO o dai servizi di risoluzione del dominio.', 'Denied access or a policy that does not apply may depend on the account, groups, OU, GPO or domain name-resolution services.'),
        analysis: t('Parto dal sintomo segnalato, verifico identità e appartenenze, controllo l’ambito della policy e considero DNS e autenticazione prima di modificare la configurazione.', 'I start from the reported symptom, check identity and group membership, review the policy scope and consider DNS and authentication before changing the configuration.'),
        intervention: t('Gestisco utenti, gruppi, OU, permessi e GPO; quando serve intervengo sul problema di autenticazione o sui servizi collegati.', 'I manage users, groups, OUs, permissions and GPOs; when needed, I address authentication issues or related services.'),
        verification: t('Verifico nuovamente l’accesso dell’utente, l’applicazione della policy e la disponibilità della risorsa interessata.', 'I recheck user access, policy application and availability of the affected resource.'),
        technologies: ['Windows Server', 'Active Directory', 'GPO', 'DNS', 'DHCP'],
        result: t('L’utente torna a lavorare con i soli permessi necessari e la modifica resta coerente con la struttura del dominio.', 'The user can work again with only the required permissions, and the change remains consistent with the domain structure.'),
        competencies: [t('Analisi delle dipendenze', 'Dependency analysis'), t('Gestione delle identità', 'Identity management'), t('Troubleshooting controllato', 'Controlled troubleshooting')],
        diagram: [t('Utente', 'User'), 'Active Directory', t('Permessi', 'Permissions'), t('Risorsa autorizzata', 'Authorised resource')]
      },
      {
        eyebrow: t('Networking e accesso remoto', 'Networking and remote access'),
        title: t('Diagnosi di connettività tra client e servizio aziendale', 'Diagnosing connectivity between a client and a business service'),
        scenario: t('Supporto a reti aziendali, reparti produttivi e collegamenti VPN.', 'Support for corporate networks, production departments and VPN connections.'),
        problem: t('Un client non raggiunge una risorsa oppure la connessione remota non consente di proseguire il lavoro.', 'A client cannot reach a resource, or a remote connection prevents work from continuing.'),
        analysis: t('Verifico configurazione IP, percorso di rete, segmentazione, stato della VPN e raggiungibilità del servizio, procedendo per livelli.', 'I check IP configuration, network path, segmentation, VPN status and service reachability, working layer by layer.'),
        intervention: t('Correggo la configurazione coinvolta o circoscrivo il punto di guasto per l’intervento successivo.', 'I correct the affected configuration or isolate the fault domain for the next intervention.'),
        verification: t('Ripeto i test di raggiungibilità e controllo che il servizio sia accessibile dal percorso previsto.', 'I repeat reachability tests and confirm that the service is accessible through the expected path.'),
        technologies: ['LAN', 'VLAN', 'VPN', 'Routing', 'Switching', 'Wi-Fi survey'],
        result: t('La causa viene isolata e l’accesso viene ripristinato oppure affidato al livello competente con informazioni tecniche utili.', 'The cause is isolated and access is restored, or the issue is handed to the appropriate level with useful technical context.'),
        competencies: [t('Troubleshooting per livelli', 'Layered troubleshooting'), t('Analisi della rete', 'Network analysis')],
        diagram: [t('Client', 'Client'), t('Rete o VPN', 'Network or VPN'), t('Servizio aziendale', 'Business service'), t('Verifica', 'Verification')]
      },
      {
        eyebrow: t('Supporto applicativo', 'Application support'),
        title: t('Supporto tecnico su accessi e componenti SAP', 'Technical support for SAP access and components'),
        scenario: t('Assistenza agli utenti SAP in ambienti ERP, con attività su SAP GUI e SAP Router.', 'Support for SAP users in ERP environments, including work with SAP GUI and SAP Router.'),
        problem: t('L’utente incontra un problema di accesso, configurazione del client o utilizzo dell’applicazione.', 'A user encounters an access, client-configuration or application-use issue.'),
        analysis: t('Raccolgo il messaggio ricevuto, distinguo il problema locale da quello applicativo e verifico utente, client e collegamento.', 'I collect the reported message, distinguish a local issue from an application issue and check the user, client and connection.'),
        intervention: t('Intervengo su SAP GUI, gestione utenti, SAP Router e troubleshooting; l’esperienza ABAP mi aiuta a leggere il contesto applicativo.', 'I work on SAP GUI, user management, SAP Router and troubleshooting; my ABAP background helps me understand the application context.'),
        verification: t('Confermo con l’utente il nuovo accesso o raccolgo gli elementi necessari per un’escalation circostanziata.', 'I confirm restored access with the user or collect the information required for a well-scoped escalation.'),
        technologies: ['SAP GUI', 'SAP Router', 'ABAP', t('Gestione utenti', 'User management')],
        result: t('Il problema viene risolto nel perimetro del supporto oppure inoltrato senza perdere il contesto già verificato.', 'The issue is resolved within the support scope or escalated without losing the context already checked.'),
        competencies: [t('Supporto agli utenti', 'User support'), t('Analisi applicativa', 'Application analysis')]
      },
      {
        eyebrow: t('Operations', 'Operations'),
        title: t('Manutenzione dell’infrastruttura in ambiente produttivo', 'Infrastructure maintenance in a production environment'),
        scenario: t('Gestione operativa di server, ambienti virtualizzati, utenti e servizi collegati alla produzione.', 'Operational management of servers, virtual environments, users and production-related services.'),
        problem: t('Aggiornamenti, backup e anomalie devono essere gestiti senza introdurre modifiche non controllate.', 'Updates, backups and incidents must be handled without introducing uncontrolled changes.'),
        analysis: t('Valuto il servizio coinvolto, le dipendenze e il rischio operativo prima di intervenire.', 'I assess the affected service, its dependencies and operational risk before making changes.'),
        intervention: t('Eseguo attività su Windows Server, VMware, backup, aggiornamenti e supporto tecnico seguendo una sequenza verificabile.', 'I work on Windows Server, VMware, backups, updates and technical support using a verifiable sequence.'),
        verification: t('Controllo disponibilità del servizio, esito dell’attività e condizioni per un eventuale ripristino.', 'I check service availability, the outcome of the activity and the conditions for a possible recovery.'),
        technologies: ['VMware', 'Windows Server', 'Backup', 'VPN'],
        result: t('L’intervento resta tracciabile e il servizio viene riconsegnato dopo una verifica tecnica.', 'The intervention remains traceable and the service is handed back after technical verification.'),
        competencies: [t('Valutazione del rischio', 'Risk assessment'), t('Continuità operativa', 'Operational continuity')]
      }
    ],
    webProjects: [
      {
        type: t('Progetto personale', 'Personal project'),
        status: t('Online', 'Online'),
        title: t('Portfolio professionale di Gaetano Russo', 'Gaetano Russo’s professional portfolio'),
        audience: t('Recruiter IT e professionisti interessati a un sito web.', 'IT recruiters and professionals interested in a website.'),
        need: t('Presentare nello stesso sito il profilo infrastrutturale e i lavori web senza confondere i due interlocutori.', 'Present infrastructure experience and web work on the same site without confusing the two audiences.'),
        decisions: t('Ho mantenuto un’architettura statica, separato dati e interfaccia e introdotto due percorsi consultabili senza ricaricare la pagina.', 'I kept a static architecture, separated data from the interface and introduced two paths that can be explored without reloading the page.'),
        features: t('Contenuti bilingue, tema chiaro/scuro, video adattivo, consenso cookie, modali accessibili, CV protetto da informativa e form EmailJS.', 'Bilingual content, light/dark theme, adaptive video, cookie consent, accessible dialogs, privacy-gated CV and EmailJS form.'),
        problems: t('Il lavoro principale è stato organizzare molti contenuti esistenti, preservare i deep link e limitare il peso dei video Canva.', 'The main work involved organising a large amount of existing content, preserving deep links and limiting the impact of Canva videos.'),
        stack: ['HTML5', 'CSS3', 'JavaScript', 'EmailJS', 'GitHub Pages'],
        result: t('Il sito pubblicato comprende la homepage, le pagine legali, gli articoli e contenuti bilingue organizzati in due percorsi.', 'The published website includes the homepage, legal pages, articles and bilingual content organised into two paths.'),
        proof: t('La pagina che stai consultando è il progetto in esecuzione.', 'The page you are viewing is the running project.'),
        links: [
          { label: t('Apri il sito', 'Open website'), href: 'https://gaetanorussoits1994-coder.github.io/portfolio-gaetano-russo/' }
        ]
      },
      {
        type: t('Progetto reale per studio fotografico', 'Live project for a photography studio'),
        status: t('Online', 'Live'),
        title: 'Luca Magarotto Photography',
        audience: t('Fotografo e visitatori interessati ai suoi lavori.', 'Photographer and visitors interested in his work.'),
        need: t('Realizzare una presenza online professionale che organizzasse portfolio, progetti Fine Art, articoli e richieste di contatto.', 'Create a professional online presence for portfolios, Fine Art projects, journal articles and contact enquiries.'),
        decisions: t('Ho realizzato un sito bilingue con percorsi fotografici distinti e un’area amministrativa riservata con recupero password.', 'I built a bilingual website with distinct photography paths and a restricted administration area with password recovery.'),
        features: t('Portfolio In Studio e On Location, Fine Art Prints, Journal, pagina Contatti, selettore italiano/inglese e accesso amministrativo riservato.', 'In Studio and On Location portfolios, Fine Art Prints, Journal, Contact page, Italian/English selector and restricted admin access.'),
        problems: t('Organizzare servizi, progetti e contenuti editoriali in una navigazione coerente, mantenendo separata l’area di gestione.', 'Organising services, projects and editorial content in a consistent navigation while keeping the management area separate.'),
        stack: ['Next.js', 'React', 'Vercel'],
        result: t('Il sito è online su dominio personalizzato e le sezioni pubbliche verificate sono accessibili.', 'The website is live on a custom domain and its verified public sections are accessible.'),
        links: [
          { label: t('Visita il sito', 'Visit the website'), href: 'https://lucamagarotto42photography.it/' }
        ]
      }
    ],
    experiences: [
      { period: t('01/2024 — Presente', 'Jan 2024 — Present'), company: 'ZILMET S.P.A.', focus: t('Responsabilità attuale · infrastruttura e operations', 'Current role · infrastructure and operations'), role: t('IT Infrastructure Specialist · System Administrator · SAP Support', 'IT Infrastructure Specialist · System Administrator · SAP Support'), detail: t('Gestione infrastruttura IT, VMware, Windows Server, Active Directory, VPN e supporto operativo per ambiente produttivo.', 'IT infrastructure, VMware, Windows Server, Active Directory, VPN and operational support for a production environment.') },
      { period: '01/2023 — 12/2023', company: 'LET’S CO S.R.L.', focus: t('Supporto tecnico · utenti e connettività', 'Technical support · users and connectivity'), role: t('Tecnico IT', 'IT Technician'), detail: t('Supporto utenti, networking, VPN, Google Workspace, workstation e periferiche.', 'User support, networking, VPN, Google Workspace, workstations and devices.') },
      { period: '11/2021 — 02/2022', company: 'MINDSET S.R.L.', focus: t('Formazione sul campo · ecosistema SAP', 'On-the-job training · SAP environment'), role: t('ABAP Developer · Stage SAP Developer', 'ABAP Developer · SAP Developer Internship'), detail: t('Sviluppo ABAP, assistenza SAP, SAP Router e troubleshooting in ambiente ERP.', 'ABAP development, SAP support, SAP Router and ERP troubleshooting.') }
    ],
    certifications: [
      { title: 'IFOA Academy Developer', subtitle: t('Programmatore ABAP · Attestato di frequenza', 'ABAP Developer · Attendance certificate'), detail: t('Sviluppo ABAP, logiche SAP e formazione tecnica.', 'ABAP development, SAP logic and technical training.'), image: 'immagini/Attestato ABAP.png' },
      { title: 'TelsySkills', subtitle: t('CyberSecurity Awareness · Attestato di partecipazione', 'Cybersecurity Awareness · Participation certificate'), detail: t('Consapevolezza cyber, sicurezza informatica e protezione degli ambienti aziendali.', 'Cyber awareness, information security and protection of corporate environments.'), image: 'immagini/Attestato Telsy.png' }
    ],
    labs: [
      { category: 'access', area: t('Active Directory e accessi', 'Active Directory and access'), title: 'Active Directory', mode: t('Gestito e verificato', 'Managed and verified'), detail: t('Gestione di identità, gruppi, OU, permessi, GPO e autenticazione centralizzata.', 'Management of identities, groups, OUs, permissions, GPOs and centralised authentication.'), evidence: t('Controllo di appartenenze, ambito delle policy e accesso finale alla risorsa.', 'Checks of group membership, policy scope and final access to the resource.'), tags: ['GPO', 'DNS', 'Users'] },
      { category: 'windows', area: t('Sistemi Windows', 'Windows systems'), title: 'Windows Server', mode: t('Configurato e mantenuto', 'Configured and maintained'), detail: t('Servizi di dominio, file server, backup e attività di manutenzione.', 'Domain services, file servers, backups and maintenance activities.'), evidence: t('Verifica di disponibilità del servizio e dell’esito dell’attività.', 'Verification of service availability and the activity outcome.'), tags: ['Server', 'Backup', 'Domain'] },
      { category: 'windows', area: t('Ambienti di test', 'Test environments'), title: t('Virtualizzazione', 'Virtualisation'), mode: t('Configurato in ambienti virtuali', 'Configured in virtual environments'), detail: t('Macchine virtuali, snapshot, reti virtuali e scenari di laboratorio.', 'Virtual machines, snapshots, virtual networks and lab scenarios.'), evidence: t('Uso di snapshot e ambienti isolati per provare attività ripetibili.', 'Use of snapshots and isolated environments to test repeatable activities.'), tags: ['VMware', 'Snapshot', 'Lab'] },
      { category: 'sap', area: t('SAP e applicativi aziendali', 'SAP and business applications'), title: 'SAP Support', mode: t('Supportato e verificato con l’utente', 'Supported and verified with the user'), detail: t('Supporto utenti, SAP GUI, SAP Router e troubleshooting applicativo.', 'User support, SAP GUI, SAP Router and application troubleshooting.'), evidence: t('Distinzione tra problema locale e applicativo, quindi conferma dell’accesso o escalation circostanziata.', 'Distinction between local and application issues, followed by access confirmation or a well-scoped escalation.'), tags: ['SAP GUI', 'Router', 'ABAP'] },
      { category: 'network', area: t('Networking e troubleshooting', 'Networking and troubleshooting'), title: 'Enterprise Networking', mode: t('Analizzato per livelli', 'Analysed layer by layer'), detail: t('Routing, switching, VLAN, VPN, subnetting e Wi-Fi survey.', 'Routing, switching, VLANs, VPNs, subnetting and Wi-Fi surveys.'), evidence: t('Controllo di configurazione IP, percorso di rete, segmentazione e raggiungibilità del servizio.', 'Checks of IP configuration, network path, segmentation and service reachability.'), tags: ['LAN', 'VLAN', 'VPN'] },
      { category: 'web', area: t('Sviluppo e ambienti', 'Development and environments'), title: 'Docker', mode: t('Studiato in laboratorio', 'Studied in a lab'), detail: t('Immagini, container, Compose e ambienti riproducibili.', 'Images, containers, Compose and reproducible environments.'), evidence: t('Argomento di laboratorio; non presentato come progetto pubblicato o certificazione.', 'Lab topic; not presented as a published project or certification.'), tags: ['Docker', 'Compose', 'Containers'] },
      { category: 'web', area: t('Sviluppo web', 'Web development'), title: 'Next.js', mode: t('Studiato in laboratorio', 'Studied in a lab'), detail: t('Studio di routing, SEO, organizzazione dei componenti e performance.', 'Study of routing, SEO, component organisation and performance.'), evidence: t('Presentato come argomento di laboratorio, non come stack di un progetto pubblicato.', 'Presented as a lab topic, not as the stack of a published project.'), tags: ['Routing', 'SEO', 'Performance'] },
      { category: 'web', area: t('Backend e dati', 'Backend and data'), title: 'Supabase', mode: t('Studiato in laboratorio', 'Studied in a lab'), detail: t('Laboratorio su PostgreSQL, Auth, API REST, realtime e storage.', 'Lab work on PostgreSQL, Auth, REST APIs, realtime and storage.'), evidence: t('Nessun servizio esterno è collegato a questa versione del portfolio.', 'No external service is connected to this version of the portfolio.'), tags: ['PostgreSQL', 'Auth', 'REST API'] }
    ]
  };
})();
