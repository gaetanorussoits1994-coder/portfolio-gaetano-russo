# Test dell'area amministratore

Questa checklist riguarda l'ambiente locale. Non applica migrazioni e non modifica il progetto Supabase remoto.

## Controlli senza configurazione

1. Assicurarsi che `.env.local` non sia presente oppure che URL e anon key siano vuoti.
2. Eseguire `npm run dev` e aprire `/admin/`.
3. Verificare che la dashboard resti nascosta e che compaia “Configurazione richiesta”.
4. Verificare che “Verifica della sessione…” venga sempre rimosso.
5. Aprire `/admin/reset-password.html` e verificare lo stesso stato di configurazione.

## Controlli con Supabase configurato

1. Verificare login errato, login dell'account autorizzato e logout.
2. Verificare che un utente Auth senza riga attiva in `admin_users` non veda la dashboard.
3. Verificare recupero password, link scaduto e impostazione di una password di almeno 12 caratteri.
4. Interrompere temporaneamente la connettività e verificare un messaggio comprensibile entro il timeout, con dettaglio tecnico soltanto nella console.
5. Verificare CRUD, pubblicazione, visibilità e ordine per ogni tipo di contenuto.
6. Verificare upload, sostituzione ed eliminazione media con allowlist e limite di 8 MB.
7. Verificare QR Code PNG/SVG, selettore contenuti IT/EN, tema e menu mobile.

## Controlli RLS

- `anon`: legge solo contenuti, impostazioni e metadati pubblicati;
- utente autenticato non autorizzato: nessuna scrittura e nessuna dashboard;
- amministratore previsto con riga attiva: gestione editoriale completa;
- qualsiasi altro indirizzo: `is_portfolio_admin()` restituisce falso anche in presenza di una riga non conforme.

## Controlli automatici locali

Eseguire `npm run check`, `npm run build` e `git diff --check`. Verificare inoltre che non esistano riferimenti CDN a Supabase JS o QR Code, credenziali private nei file versionabili e risposte 404 per gli asset caricati dalle pagine pubblica e amministrativa.
