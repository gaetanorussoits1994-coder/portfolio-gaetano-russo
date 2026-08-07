# Sistema visivo del portfolio

Il frontend usa un sistema visivo piccolo e intenzionalmente privo di framework. I token sono definiti in `:root` dentro `css/home.css`.

## Identità

L'aspetto richiama il lavoro infrastrutturale senza simulare terminali o dashboard:

- blu notte per hero, sezioni operative e contesti tecnici;
- grigi caldi per superfici e documentazione;
- ambra attenuata per azioni principali e stati che richiedono attenzione;
- blu acciaio per link, etichette tecniche e progressione;
- verde desaturato esclusivamente per materiale realmente disponibile o pubblicato.

Non vengono usati neon, contatori decorativi, recensioni, statistiche o schermate ricostruite.

## Tipografia

- Font locali di sistema: `Segoe UI Variable`, `Segoe UI`, Arial e sans-serif.
- Titoli con peso 600/700, interlinea compatta e dimensioni responsive tramite `clamp()`.
- Testo normale a 16 px; note e metadati da 10 a 13 px.
- Nessun font remoto: questo evita richieste esterne e riduce il layout shift.

## Spaziatura e forma

- Contenitore principale: massimo 1180 px.
- Scala prevalente: 8, 12, 18, 24, 32, 48, 72 px.
- Raggio standard: 10 px; pulsanti: 7 px.
- Le composizioni editoriali usano soprattutto linee, colonne e cambi di densità. Le card chiuse sono riservate a contenuti che ne beneficiano realmente.

## Componenti

- Pulsante primario ambra; secondario chiaro; azioni quiete con solo bordo.
- Link testuali sottolineati tramite movimento della linea o variazione cromatica.
- Focus da tastiera: contorno ambra da 2 px con offset di 4 px.
- Stato selezionato: fondo blu acciaio molto attenuato e indicatore inferiore.
- Stato verificato/pubblicato: verde desaturato.
- Stato incompleto: testo esplicito, mai mascherato da badge promozionali.

## Movimento

Il movimento comunica un cambio di stato: apertura dei casi, cambio percorso, focus della navigazione e comparsa discreta delle sezioni. `prefers-reduced-motion` disabilita video, scorrimento animato e transizioni non necessarie.
