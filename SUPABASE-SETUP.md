# Configurazione Supabase del portfolio

Questa integrazione non contiene credenziali, password, URL reali o service role key. Il frontend usa esclusivamente URL del progetto e anon key, che restano comunque soggetti a RLS. Il repository deve rimanere privato durante configurazione e collaudo.

## 1. Creare il progetto e applicare le migrazioni

Creare un progetto Supabase dedicato, quindi applicare in ordine i file presenti in `supabase/migrations/`:

1. `001_content_schema.sql`
2. `002_row_level_security.sql`
3. `003_storage.sql`
4. `004_seed_current_content.sql`

È possibile usare Supabase CLI oppure SQL Editor. Le migrazioni creano schema, funzioni, trigger, RLS, bucket Storage e seed iniziale. Non copiare la service role key nel browser o in `.env.local`.

## 2. Creare o invitare l’unico utente amministratore

In Supabase Dashboard aprire Authentication > Users e invitare o creare manualmente l’account autorizzato:

`g.russomacteanimo@gmail.com`

Non aggiungere password a file SQL o documentazione. Se si usa l’invito, completare il primo accesso dal link ricevuto. Disabilitare la registrazione pubblica se il progetto non la utilizza per altre funzioni.

## 3. Autorizzare l’utente nel database

Dopo che l’utente esiste in `auth.users`, eseguire in SQL Editor con un ruolo privilegiato:

```sql
select public.grant_portfolio_admin('g.russomacteanimo@gmail.com');
```

La procedura non è eseguibile da `anon` o `authenticated`. Le policy non si basano sul solo confronto dell’email nel frontend: verificano `auth.uid()` nella tabella `admin_users`.

Per revocare l’accesso senza eliminare l’utente:

```sql
update public.admin_users
set is_active = false, updated_at = now()
where user_id = (select id from auth.users where lower(email) = lower('g.russomacteanimo@gmail.com'));
```

## 4. Redirect URL di Supabase Auth

In Authentication > URL Configuration configurare almeno:

- Site URL locale: `http://127.0.0.1:4173/`
- Redirect locale: `http://127.0.0.1:4173/admin/reset-password.html`
- URL della futura preview Vercel, quando esisterà
- URL di produzione: `https://DOMINIO-DEFINITIVO/admin/reset-password.html`

Non usare wildcard più ampie del necessario in produzione. Aggiornare gli URL quando il portfolio non userà più GitHub Pages.

## 5. Variabili locali

Installare prima le dipendenze con `npm install`. Gli script `predev` e `prebuild` generano in `vendor/` le copie browser locali di Supabase JS e QR Code: l'admin non richiede CDN per queste librerie.

Copiare `.env.example` in `.env.local` e inserire esclusivamente:

```text
SUPABASE_URL=https://PROJECT-REF.supabase.co
SUPABASE_ANON_KEY=ANON-KEY-PUBBLICA
PUBLIC_SITE_URL=http://127.0.0.1:4173/
```

Riavviare `npm.cmd run dev`. Il server genera in memoria `runtime-config.js`; `.env.local` non viene servito e risulta escluso da Git.

Non inserire mai `SUPABASE_SERVICE_ROLE_KEY`, password o token amministrativi.

## 6. Variabili Vercel future

Quando verrà autorizzato il deploy, aggiungere nelle impostazioni del progetto Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PUBLIC_SITE_URL`

Impostare `PUBLIC_SITE_URL` sull’URL pubblico definitivo. Non usare `127.0.0.1` in produzione. Il comando `npm run build` crea la cartella `dist/` includendo soltanto i file pubblici necessari e genera il runtime config dai valori dell’ambiente.

## 7. Login, logout e account non autorizzato

1. Aprire `http://127.0.0.1:4173/admin/`.
2. Senza `.env.local`, verificare che entro pochi secondi compaia “Configurazione richiesta” e che “Verifica della sessione…” scompaia.
3. Verificare che senza sessione compaia solo il login.
4. Provare credenziali errate: deve comparire un messaggio generico.
5. Accedere con l’utente Auth autorizzato e verificare la dashboard.
6. Accedere con un eventuale utente Auth non presente in `admin_users`: l’app deve eseguire logout e negare l’area.
7. Ricaricare la pagina: la sessione autorizzata deve persistere.
8. Eseguire logout e verificare il ritorno al login.

## 8. Recupero password

1. Dal login selezionare “Password dimenticata?”.
2. Inserire l’email dell’account e inviare.
3. Aprire il link ricevuto: deve raggiungere `/admin/reset-password.html`.
4. Inserire e confermare una password di almeno 12 caratteri.
5. Verificare il messaggio di successo e il nuovo login.
6. Riprovare con un link scaduto: deve comparire un messaggio leggibile senza dettagli tecnici.

Supabase può restituire un messaggio neutro anche per indirizzi inesistenti, riducendo l’enumerazione degli account.

## 9. RLS e verifica database

Eseguire i test con tre contesti distinti:

- anonimo: legge solo `content_items.status = 'published'`, impostazioni pubbliche e media pubblicati;
- autenticato non amministratore: non può creare, modificare o eliminare;
- amministratore attivo: può gestire contenuti, impostazioni e media.

Controllare che tutte le tabelle abbiano RLS attiva. Non disabilitare RLS per risolvere errori applicativi.

## 10. Storage

Il bucket privato `portfolio-media` accetta JPEG, PNG, WebP e PDF fino a 8 MB. Solo l’amministratore può caricare, sostituire o eliminare. I file sono salvati sotto `media/`; RLS permette di generare URL firmati pubblici soltanto per i record `media_assets` con stato `published`. I file in bozza o nascosti restano leggibili esclusivamente dall’amministratore. Non caricare CV, attestati non oscurati, messaggi o documenti personali senza revisione.

## 11. Fallback pubblico

Se URL/anon key mancano, Supabase non risponde o il seed non è ancora applicato, la homepage continua a usare `js/portfolio-data.js`. Gli errori tecnici non vengono mostrati ai visitatori.

## 12. Checklist prima della produzione

- verificare tutte le policy con utenti anonimo, non autorizzato e amministratore;
- limitare Redirect URL e origini consentite;
- controllare i file Storage e relativi metadati;
- testare recupero password e scadenza link;
- impostare `PUBLIC_SITE_URL` definitivo e testare QR PNG/SVG;
- eseguire `npm run check`, `npm run build` e `git diff --check`;
- verificare che `dist/` non contenga SQL, documentazione, `.env`, `tatus` o file interni;
- non pubblicare finché il proprietario non ha completato il collaudo.
