# Architettura dell’area amministratore

## Implementazione attuale

L’area amministrativa è ora disponibile in `/admin/` senza trasformare il portfolio statico in Next.js. L’interfaccia usa `admin/index.html`, `admin/admin.css`, `admin/common.js` e `admin/app.js`; il recupero password usa `admin/reset-password.html` e `admin/reset-password.js`.

Il client Supabase è inizializzato da `js/supabase-client.js` soltanto quando `/api/public-config` fornisce URL e anon key. In locale il server carica `.env.local`; su Vercel la funzione legge le variabili d'ambiente a runtime e restituisce esclusivamente i valori autorizzati per il browser. La homepage usa `js/content-service.js` come adapter e conserva `js/portfolio-data.js` come fallback.

Supabase JS e QR Code sono dipendenze npm trasformate in script browser locali dal task `vendor`, eseguito automaticamente prima di sviluppo e build. L'avvio dell'admin mantiene tutte le viste protette nascoste, limita temporalmente le verifiche di sessione e autorizzazione e chiude sempre lo stato di caricamento con una schermata esplicita di configurazione, accesso o indisponibilità temporanea.

Le migrazioni versionate in `supabase/migrations/` adottano quattro tabelle:

- `admin_users`, collegata a `auth.users`, per l’autorizzazione reale;
- `content_items`, modello editoriale bilingue e ordinabile con stati `draft`, `published` e `hidden`;
- `site_settings`, impostazioni pubbliche non sensibili;
- `media_assets`, metadati dei file nel bucket privato `portfolio-media`.

La funzione `is_portfolio_admin()` verifica `auth.uid()` sul database, la riga attiva in `admin_users` e l'unico indirizzo amministratore previsto. Il frontend non autorizza in base alla sola email. RLS permette lettura anonima dei soli contenuti pubblicati e scrittura esclusivamente all'amministratore attivo. Storage usa URL firmati: bozze e file nascosti non sono leggibili pubblicamente.

La dashboard gestisce contenuti bilingue, slug, stato, ordine, anteprima, media, impostazioni e QR Code. Il codice amministrativo non usa `innerHTML` per contenuti gestiti e rifiuta markup, URL `javascript:` e strutture JSON pericolose.

Configurazione e collaudo sono descritti in `SUPABASE-SETUP.md`. Senza URL e anon key reali, l’admin mostra uno stato di configurazione mancante e non simula autenticazione o operazioni CRUD.

## Proposta originaria conservata come riferimento

## Stato della prima fase

La homepage resta un sito statico e non contiene autenticazione simulata, password, service-role key o credenziali fittizie. I contenuti ripetibili sono centralizzati in `js/portfolio-data.js` e consumati dai componenti di rendering in `js/home.js`; presentazione e responsive design sono isolati in `css/home.css`.

Le pagine legali, gli articoli, il PDF del CV, i certificati e i video rimangono file indipendenti. L'integrazione EmailJS preesistente non viene trasformata in un servizio amministrativo.

## Modello dati proposto

In Supabase/PostgreSQL creare le tabelle seguenti, usando UUID come chiave primaria e i campi comuni `created_at`, `updated_at`, `published`, `sort_order`:

- `profiles`: nome, ruolo, presentazione, posizione, email pubblica, URL social;
- `projects`: slug, percorso (`it`/`web`), stato, titolo, esigenza/problema, soluzione/attività, funzionalità, risultato, nota, URL demo e repository;
- `project_technologies`: relazione molti-a-molti tra progetti e tecnologie;
- `skills`: percorso, nome, descrizione e livello/ordine editoriale;
- `experiences`: azienda, ruolo, data iniziale/finale, descrizione;
- `certifications`: ente, titolo, descrizione, data, percorso file nello Storage;
- `labs`: percorso, categoria, titolo, descrizione e tag;
- `content_translations`: `entity_type`, `entity_id`, `locale`, campi testuali localizzati;
- `site_settings`: sole impostazioni editoriali non sensibili.

Separare le relazioni (`project_technologies`) evita stringhe di stack non verificabili e permette di mostrare Next.js, React, TypeScript, Supabase, PostgreSQL, Vercel o GitHub solo sui progetti a cui sono realmente collegati.

## Autenticazione e ruoli

1. Attivare Supabase Auth con accesso amministrativo tramite magic link o provider OAuth verificato.
2. Non consentire registrazione pubblica; inserire gli amministratori tramite procedura controllata.
3. Creare una tabella `user_roles` collegata a `auth.users`, con ruolo iniziale `editor` o `admin`.
4. Verificare il ruolo sul server o in una funzione sicura; la sola UI non costituisce autorizzazione.
5. Tenere `SUPABASE_SERVICE_ROLE_KEY` esclusivamente in variabili d'ambiente server-side. Nel browser sono ammesse solo URL e anon/publishable key, protette da RLS.

## Row Level Security

Abilitare RLS su ogni tabella e sullo Storage:

- lettura anonima soltanto delle righe con `published = true`;
- inserimento, modifica ed eliminazione soltanto per utenti autenticati presenti in `user_roles`;
- modifica dei ruoli riservata agli `admin`;
- bucket pubblico limitato agli asset pubblicati; upload, sostituzione e cancellazione solo per editor autorizzati;
- nessuna policy basata su email o dati inviati dal client;
- validazione di URL, tipo MIME, dimensione file e campi obbligatori prima della scrittura.

Le policy vanno testate con sessione anonima, editor e admin prima di collegare l'interfaccia.

## Flusso applicativo futuro

La migrazione può avvenire senza riscrivere i componenti:

1. sostituire `window.PORTFOLIO_DATA` con un adapter `contentRepository`;
2. l'adapter carica dati pubblicati da Supabase e mantiene la stessa forma attualmente usata da `home.js`;
3. prevedere un fallback statico per resilienza e deploy;
4. creare l'area `/admin` separata dal sito pubblico, con sessione Auth e operazioni CRUD;
5. invalidare o rigenerare la cache pubblica dopo una pubblicazione;
6. registrare modifiche editoriali essenziali in una tabella audit append-only.

## Sicurezza e rilascio

- Configurare URL e chiavi pubblicabili tramite variabili d'ambiente del provider di hosting, mai nel repository.
- Usare HTTPS, Content Security Policy e restrizioni di origine compatibili con i servizi effettivamente attivi.
- Non salvare il consenso al CV nel database: resta una conferma locale prima dell'accesso al documento.
- Valutare se il CV debba restare pubblico con consenso UI o passare a URL firmati a scadenza; questa è una decisione privacy separata.
- Conservare backup del database e versionare le migrazioni SQL.
- Aggiungere test automatici delle policy RLS e una preview locale prima di ogni pubblicazione.

## Passi consigliati

1. Confermare il modello editoriale e quali contenuti possono essere pubblici.
2. Creare un progetto Supabase dedicato e le migrazioni SQL in un ambiente di sviluppo.
3. Implementare e testare Auth/RLS senza collegare ancora il dominio pubblico.
4. Introdurre l'adapter dati e verificare il fallback statico.
5. Costruire infine l'interfaccia amministrativa con audit e validazione.
