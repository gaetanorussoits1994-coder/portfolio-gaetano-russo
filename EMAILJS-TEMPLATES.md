# Configurazione template EmailJS

Questa configurazione usa soltanto variabili dinamiche con doppie parentesi graffe. Non inserire chiavi o token nei template o nel codice client.

## Template contatto pubblico

Impostare nel pannello EmailJS:

- To Email: `{{to_email}}`
- Reply-To: `{{reply_to}}`
- Subject: `Nuovo contatto: {{subject}}`

Il corpo può usare:

- `{{from_name}}`
- `{{from_email}}`
- `{{company}}`
- `{{subject}}`
- `{{message}}`
- `{{site_url}}`

Il browser invia anche `raw_message`, equivalente a `message`, per compatibilità con un eventuale template precedente. Non è necessario usarla nel nuovo template.

## Template risposta amministrativa

Impostare nel pannello EmailJS:

- To Email: `{{to_email}}`
- From Name: `{{from_name}}`
- Reply-To: `{{reply_to}}`
- Subject: `{{subject}}`

Corpo consigliato:

```text
Ciao {{to_name}},

{{message}}

Messaggio originale — {{original_subject}}
{{original_message}}

{{site_url}}
```

La funzione server invia sempre i parametri `to_email`, `to_name`, `from_name`, `reply_to`, `subject`, `message`, `original_subject`, `original_message` e `site_url`. Il destinatario deriva dal messaggio salvato in Supabase e non dalla richiesta del browser.

## Variabili Vercel

Pubbliche, fornite al browser tramite `/api/public-config`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PUBLIC_SITE_URL`
- `PUBLIC_EMAILJS_PUBLIC_KEY`
- `PUBLIC_EMAILJS_SERVICE_ID`
- `PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID`
- `PUBLIC_CONTACT_EMAIL`

Esclusivamente server-side:

- `EMAILJS_PRIVATE_KEY`
- `EMAILJS_REPLY_TEMPLATE_ID`

Dopo avere configurato il dominio definitivo, aggiungere l'origine HTTPS esatta del sito alle origini autorizzate EmailJS. Applicare le variabili agli ambienti Vercel necessari e avviare un nuovo deployment affinché la funzione e la configurazione pubblica usino la versione aggiornata.

## Diagnostica sicura

La funzione `/api/reply-message` restituisce un `requestId` e registra nei log Vercel fase, categoria e stato HTTP del provider. I log non includono chiavi, token, destinatari o contenuto dei messaggi. Usare il `requestId` per correlare un errore dell'interfaccia admin con il relativo log.
