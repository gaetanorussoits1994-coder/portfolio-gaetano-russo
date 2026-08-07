# Contenuti reali da raccogliere

Questo file contiene materiali mancanti che non devono comparire come segnaposto nel portfolio pubblico. Ogni contenuto futuro dovrà essere verificato, autorizzato alla pubblicazione, anonimizzato e privo di dati aziendali riservati.

## Case study IT

Per trasformare uno dei casi operativi attuali in un case study completamente documentato, servono risposte precise alle seguenti domande:

1. Qual era il sintomo iniziale, descritto senza azienda, sede, utente o sistema identificabile?
2. Quali verifiche sono state eseguite e in quale ordine?
3. Quali strumenti o console sono stati realmente utilizzati?
4. Quale causa è stata confermata dalle verifiche? Se non è stata confermata, il caso deve dichiararlo.
5. Quale modifica o intervento è stato eseguito personalmente da Gaetano?
6. Quale controllo conclusivo ha dimostrato il ripristino o la corretta escalation?
7. Quale risultato operativo può essere dichiarato senza ricostruire numeri, tempi o percentuali?
8. Esiste una procedura, checklist o schermata di laboratorio che possa sostenere il racconto?

Non fornire hostname, indirizzi IP, nomi di dominio reali, ticket, nomi di colleghi, credenziali, topologie interne o configurazioni riservate.

## Evidenze tecniche pubblicabili

Materiali utili che potrebbero essere aggiunti in futuro:

- diagramma di un dominio Windows costruito esclusivamente in laboratorio;
- checklist anonimizzata per la verifica di utenti, gruppi, OU e GPO;
- procedura di troubleshooting DNS/DHCP priva di indirizzi o nomi reali;
- schema di laboratorio LAN/VLAN/VPN con dati inventati esclusivamente per il lab e chiaramente dichiarati;
- schermate di macchine virtuali di test senza identificativi aziendali;
- checklist di manutenzione, backup e controllo conclusivo ricreata come modello generico;
- documentazione di un laboratorio SAP pubblicabile, senza sistemi o utenti reali;
- note di test responsive e accessibilità relative a un progetto web pubblico.

Prima della pubblicazione ogni file dovrà essere controllato anche nei metadati, nei nomi dei file e nelle aree secondarie delle schermate.

## Luca Magarotto Photography

Il sito pubblico conferma Next.js, React, hosting Vercel, dominio personalizzato, selettore IT/EN, Portfolio In Studio e On Location, Fine Art Prints, Journal, Contatti, area amministrativa e recupero password. Prima di attribuire altro stack o funzioni interne al case study servono:

- conferma tecnica di TypeScript dai file sorgente del progetto;
- conferma dell’integrazione Supabase per database e autenticazione;
- conferma dell’integrazione Brevo per l’invio email;
- elenco verificato dei contenuti gestibili dall’area amministrativa;
- eventuali screenshot pubblicabili, privi di messaggi, credenziali o dati del cliente.

## Progetti web futuri

Per ogni nuovo progetto raccogliere nome, tipologia, esigenza iniziale, soluzione, funzioni implementate, stack reale, stato, screenshot reale e URL online quando disponibile. Per i progetti cliente è necessaria un’autorizzazione esplicita alla pubblicazione di nome, immagini e collegamenti.

## Contenuti non inseriti perché non verificabili

- TypeScript, Supabase e Brevo non sono ancora attribuiti a Luca Magarotto Photography perché non risultano verificabili dai file pubblici ispezionati.
- Non sono state pubblicate cause specifiche nei case study IT perché i testi disponibili descrivono il metodo e le verifiche, ma non documentano un singolo incidente con causa confermata.
- Non sono stati aggiunti risultati numerici, tempi di ripristino, recensioni, statistiche o risultati commerciali.
- Non sono stati aggiunti screenshot tecnici: l’immagine generica già presente nel repository non documenta una procedura o un ambiente reale.

## Protezione del repository e pubblicazione

- [ ] completare i test locali e il controllo responsive;
- [ ] verificare che nessun file sensibile sia tracciato da Git;
- [ ] verificare la cronologia Git prima della pubblicazione;
- [ ] valutare la rotazione di eventuali chiavi già esposte;
- [ ] mantenere il repository privato durante sviluppo e collaudo;
- [ ] preparare il dominio o il provider di hosting definitivo;
- [ ] configurare HTTPS;
- [ ] pubblicare solo la build necessaria al sito;
- [ ] rimuovere i riferimenti al vecchio GitHub Pages dopo la migrazione;
- [ ] eseguire un controllo finale di link, privacy, cookie e CV;
- [ ] rendere pubblico il repository solo dopo verifica esplicita del proprietario.

### Esiti dell’audit locale da risolvere

- [ ] valutare la rimozione del file tracciato `tatus`, che conserva un vecchio output tecnico e non deve entrare nella build pubblica;
- [ ] verificare restrizioni di dominio e quote degli identificatori EmailJS presenti nel frontend e rimuovere la configurazione duplicata dal file legacy `script.js` solo dopo conferma;
- [ ] predisporre copie pubblicabili e oscurate degli attestati che espongono dati anagrafici, identificativi del documento o firme;
- [ ] sostituire in produzione il collegamento statico al CV con una consegna protetta lato server o tramite URL temporaneo, se è richiesto un controllo di accesso reale;
- [ ] completare l’ispezione visiva del PDF del CV in un ambiente dotato di renderer PDF.
