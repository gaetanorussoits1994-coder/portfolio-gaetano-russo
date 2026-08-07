# Modello contenuti per una futura area amministratore

## Scopo e confini

Questo documento descrive il modello editoriale da adottare in una fase futura. La homepage continua a leggere dati locali da `js/portfolio-data.js`: non sono presenti chiamate API, credenziali, utenti fittizi o collegamenti a Supabase.

Principi obbligatori:

- separare contenuti, traduzioni, media e presentazione;
- mantenere una revisione editoriale prima della pubblicazione;
- non archiviare credenziali, hostname, IP, nomi di colleghi, configurazioni aziendali o documenti non autorizzati;
- pubblicare case study solo dopo anonimizzazione e verifica della fonte;
- trattare il CV come documento personale con accesso mediato dall'informativa;
- usare URL e identificatori tecnici stabili, mai testi tradotti come chiavi.

## Tipi condivisi

| Tipo | Struttura | Validazione |
|---|---|---|
| `uuid` | identificatore | generato dal database, non modificabile dall'editor |
| `localized_text` | `{ it: string, en: string }` | entrambe le lingue obbligatorie per contenuti pubblicati |
| `slug` | stringa ASCII | univoca, minuscola, `a-z`, `0-9` e trattini |
| `status` | `draft`, `review`, `published`, `archived` | transizioni controllate; `published` richiede validazione completa |
| `url` | URL HTTPS o percorso locale consentito | schema e dominio controllati; nessun `javascript:` o URL vuoto |
| `sort_order` | intero >= 0 | univoco solo quando serve un ordine rigoroso |
| `timestamps` | `created_at`, `updated_at`, `published_at` | gestiti dal database; `published_at` solo per contenuti pubblicati |

Tutte le entità editoriali includono `id`, `status`, `sort_order`, `created_at`, `updated_at` e `updated_by`. I contenuti traducibili usano campi JSON strutturati in prima fase; se il volume cresce, potranno essere normalizzati in una tabella `translations`.

## Ruoli editoriali futuri

| Ruolo | Permessi previsti |
|---|---|
| `owner` | gestione completa, ruoli, pubblicazione, media, contatti e impostazioni |
| `editor` | crea e modifica bozze; non gestisce ruoli, dati sensibili o pubblicazione definitiva |
| `reviewer` | verifica accuratezza, anonimizzazione e traduzioni; può portare una bozza in revisione |
| `viewer` | sola lettura dell'anteprima amministrativa |

Non devono esistere ruoli o password codificati nel frontend. I ruoli saranno associati all'identità autenticata lato database.

## Entità

### `profiles`

| Campo | Tipo | Obbligatorio | IT/EN | Relazioni e validazioni |
|---|---|---:|---:|---|
| `name` | stringa, max 100 | sì | no | nome pubblico |
| `primary_role` | `localized_text` | sì | sì | max 140 per lingua |
| `summary` | `localized_text` | sì | sì | testo breve, niente slogan o metriche non provate |
| `approach` | `localized_text` | sì | sì | metodo professionale, max 800 per lingua |
| `location` | `localized_text` | no | sì | solo località pubblicabile |
| `availability` | `localized_text` | no | sì | nessuna promessa su tempi di risposta |
| `hero_media_id` | `uuid` | no | no | FK a `media_assets` |

Modificabile da `owner`, `editor`; pubblicabile da `owner` dopo revisione.

### `it_case_studies`

| Campo | Tipo | Obbligatorio | IT/EN | Relazioni e validazioni |
|---|---|---:|---:|---|
| `slug` | `slug` | sì | no | univoco |
| `title`, `context`, `problem` | `localized_text` | sì | sì | fatti verificabili e anonimizzati |
| `checks_performed` | `localized_text` | sì | sì | attività realmente svolte |
| `identified_cause` | `localized_text` | no | sì | omettere se non documentata; non dedurre |
| `intervention` | `localized_text` | sì | sì | nessuna configurazione riservata |
| `final_check` | `localized_text` | sì | sì | criterio concreto di verifica |
| `operational_result` | `localized_text` | no | sì | vietate metriche o risultati non dimostrabili |
| `technology_ids` | lista `uuid` | no | no | relazione N:N con `technologies` |
| `evidence_ids` | lista `uuid` | no | no | relazione N:N con `media_assets` o documenti autorizzati |

Contenuti sensibili vietati: aziende non autorizzate, hostname, IP, account, ticket, colleghi, credenziali, topologie e procedure interne. Modificabile da `owner`, `editor`; revisione obbligatoria di `reviewer` o `owner`.

### `web_projects`

| Campo | Tipo | Obbligatorio | IT/EN | Relazioni e validazioni |
|---|---|---:|---:|---|
| `slug`, `name` | stringa | sì | nome no, slug no | slug univoco |
| `project_type` | enum | sì | no | `personal`, `demo`, `client` |
| `project_state` | enum | sì | no | `online`, `in_development`, `archived` |
| `need`, `solution`, `features`, `result` | `localized_text` | sì | sì | niente funzioni o risultati non verificati |
| `technology_ids` | lista `uuid` | no | no | solo stack verificato, relazione N:N |
| `live_url`, `repository_url` | `url` | no | no | link reali; repository solo se pubblico |
| `preview_media_id` | `uuid` | no | no | FK a screenshot reale in `media_assets` |
| `evidence_note` | `localized_text` | no | sì | dichiara esplicitamente limiti e materiale mancante |

Per i progetti cliente, nome, URL e screenshot richiedono autorizzazione documentata. Modificabile da `owner`, `editor`; pubblicazione da `owner`.

### `technologies` e `skills`

`technologies`: `name` obbligatorio e univoco, `official_url` opzionale, `category` enum. Non traducibile.

`skills`: `name`, `track` (`it` o `web`), `description` traducibile, `evidence_note` traducibile, `technology_id` opzionale. Vietati percentuali, stelle e livelli arbitrari. Modificabili da `owner`, `editor`.

### `technical_lab_entries`

| Campo | Tipo | Obbligatorio | IT/EN | Relazioni e validazioni |
|---|---|---:|---:|---|
| `title`, `category` | stringa/enum | sì | titolo se necessario | categorie controllate: Windows, accessi, networking, troubleshooting, SAP, web |
| `activity_type` | enum | sì | no | `studied`, `configured`, `verified`, `documented` |
| `activity` | `localized_text` | sì | sì | cosa è stato realmente fatto |
| `check_or_evidence` | `localized_text` | sì | sì | metodo di controllo o limite dichiarato |
| `technology_ids` | lista `uuid` | no | no | relazione N:N |
| `media_ids` | lista `uuid` | no | no | solo materiali anonimizzati e autorizzati |

Un argomento studiato non può essere trasformato in certificazione. Modificabile da `owner`, `editor`, revisionabile da `reviewer`.

### `experiences`

Campi: `company_name`, `role` traducibile, `start_date`, `end_date` nullable, `is_current`, `focus` traducibile, `summary` traducibile, `source_note` privata e non pubblicata. Date coerenti, nessuna sovrapposizione automatica corretta dal sistema, nessuna responsabilità aggiunta senza fonte. Modificabile da `owner`, `editor`; pubblicazione con revisione.

### `certifications`

Campi: `title`, `issuer`, `credential_type` (`certification`, `attendance`, `participation`), `issued_on` opzionale, `expires_on` opzionale, `description` traducibile, `media_asset_id`, `public_verification_url` opzionale. Il tipo deve corrispondere al documento. Niente numero credenziale se non autorizzato. Modificabile da `owner`, `editor`; revisione obbligatoria.

### `links` e `contacts`

`links`: `label` traducibile, `url`, `kind` (`github`, `linkedin`, `demo`, `repository`, `legal`, `article`), `open_new_tab`, `is_active`, `last_checked_at`. Validazione HTTPS salvo `mailto:` autorizzato; controllo periodico degli stati HTTP.

`contacts`: email pubblica, località pubblica, testo CTA traducibile e riferimenti a `links`. Non salvare messaggi del form nel database in questa fase. Telefono, indirizzo completo e dati personali aggiuntivi devono essere esclusi salvo decisione esplicita del titolare.

### `translations`

Opzione normalizzata futura: `entity_type`, `entity_id`, `field_name`, `locale` (`it`, `en`), `value`, `review_status`. Vincolo univoco su entità, campo e lingua. Solo campi dichiarati traducibili possono essere salvati. La pubblicazione richiede entrambe le lingue e revisione terminologica.

### `media_assets`

Campi: `kind` (`image`, `video`, `document`), `storage_path`, `mime_type`, `width`, `height`, `duration_seconds`, `bytes`, `alt_text` traducibile, `caption` traducibile, `poster_asset_id`, `rights_confirmed`, `contains_personal_data`, `checksum`. Estensioni e dimensioni in allowlist; scansione del tipo reale; niente eseguibili o SVG non sanificati. CV e documenti personali non devono essere in bucket pubblico indiscriminato.

## Relazioni principali

- profilo → un media hero e molti link;
- case study IT ↔ tecnologie e media/evidenze;
- progetti web ↔ tecnologie, link e un'anteprima reale;
- Technical Lab ↔ tecnologie e media;
- certificazioni → un documento o un'immagine;
- tutte le entità editoriali → autore dell'ultima modifica e stato editoriale.

## Piano Supabase futuro, non attivo

1. Creare un progetto separato per sviluppo e definire migrazioni SQL versionate.
2. Usare Supabase Auth senza credenziali nel repository; l'area pubblica non richiede autenticazione.
3. Tenere i ruoli in una tabella `user_roles` protetta, assegnabili solo dall'`owner` tramite policy o funzione server-side.
4. Abilitare Row Level Security su ogni tabella: lettura anonima soltanto per righe `published`; bozze visibili agli utenti autorizzati; scrittura limitata per ruolo.
5. Usare bucket distinti: media pubblici approvati e documenti privati. Servire eventuali documenti privati con URL firmati a breve durata.
6. Validare input sia nel database sia nel livello server; il frontend non è un confine di sicurezza.
7. Registrare revisioni e audit senza copiare contenuti sensibili nei log.
8. Migrare i dati locali solo dopo confronto automatico tra output corrente e output API.

## RLS minima attesa

- `anon`: `SELECT` esclusivamente su record `status = 'published'` e media pubblici approvati;
- `viewer`: lettura delle bozze, nessuna scrittura;
- `editor`: inserimento e modifica di bozze, nessuna gestione ruoli o pubblicazione definitiva;
- `reviewer`: aggiornamento dello stato di revisione, nessuna gestione utenti;
- `owner`: amministrazione editoriale completa;
- nessun client può impostare autonomamente `updated_by`, ruolo o privilegi.

Questo piano non autorizza la creazione del backend: prima dell'integrazione serviranno approvazione esplicita, progetto Supabase dedicato, variabili d'ambiente locali e revisione delle policy.
