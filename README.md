<img src="comune/marchio.svg" width="72" alt="Il marchio degli agenti civici: un filo rosso legato a un nodo che attraversa un labirinto">

# Agenti civici

**Il filo per uscire dal labirinto.** La burocrazia è un labirinto; questi strumenti sono il filo di Arianna: un capo resta legato all'ingresso, alla fonte ufficiale, e il filo accompagna una regola dopo l'altra fino a quello che ti spetta. I passi e la firma restano tuoi.

Strumenti aperti al servizio del cittadino, che funzionano **senza chiedere niente a nessuno**: niente accordi con la pubblica amministrazione, niente server, niente chiavi API, niente registrazione. Solo norme pubbliche, dati aperti e calcoli che girano nel browser.

| Strumento | Cosa fa |
|---|---|
| [Assistente civico](assistente/) | Lo stesso lavoro in conversazione: racconti il problema con parole tue, l'assistente fa le domande che servono e usa i motori di regole dei tre strumenti qui sotto. Funziona quando la pagina è aperta dentro un assistente AI, con l'account di chi la usa; altrove rimanda agli strumenti. |
| [Mi spetta](mi-spetta/) | A quali bonus e prestazioni pubbliche hai diritto: 24 prestazioni nazionali e 67 misure regionali (tutte le Regioni e le Province autonome) con le regole 2026, importi, requisiti, come chiederle, fonti. |
| [Faccio ricorso?](faccio-ricorso/) | Controlla una multa stradale: termini, motivi oggettivi, confronto dei costi, Prefettura competente con PEC, ricorso al Prefetto o al Giudice di Pace pronto da firmare. |
| [Mi rimborsano?](mi-rimborsano/) | Reclami e rimborsi: volo in ritardo o cancellato (Reg. 261/2004, con la riforma 2026/2202 che si applica dal 23/10/2027), bagaglio (Montreal), treno (Reg. 2021/782), bollette e prescrizione di due anni (ARERA), telefono e internet (indennizzi AGCOM), addebiti bancari non autorizzati (d.lgs. 11/2010). Importo, termini, passi e lettera di messa in mora. |
| [Navigatore dei servizi](navigatore/) | «Cosa devo fare per…»: 40 schede di pratiche (residenza, documenti, famiglia, stranieri, salute, scuola, lavoro, fisco, auto, casa) con passi, documenti, costi, tempi, scadenze e link al servizio ufficiale, verificate sulle fonti istituzionali. Ricerca con parole di tutti i giorni, senza modello linguistico. Le schede sono in `navigatore/dati/`, il modulo si rigenera con `python3 -I scripts/navigatore-schede.py`. Da riverificare a gennaio 2027 (testi unici fiscali). |
| [Segnalazioni urbane](segnalazioni/) | Buca, lampione, rifiuti, veicolo abbandonato, barriere, perdite, scarichi, amianto, rumore: chi deve intervenire (Comune, Provincia, ANAS con la PEC regionale, agenzia per l'ambiente, ASL, gestori), 112 e Pronto ANAS se c'è pericolo, segnalazione formale e sollecito a 30 giorni. Fonti in `segnalazioni/dati/fonti.json`, rigenera con `python3 -I scripts/segnalazioni-dati.py`. |
| [Reclami alla PA](reclami-pa/) | Pratica ferma, preavviso di rigetto, disservizio, sanità, servizi digitali, privacy: il passo giusto (sollecito, titolare del potere sostitutivo, difensore civico regionale, Garante, giudice), termini della legge 241/1990 calcolati, indennizzo da ritardo solo per le imprese, lettere pronte. Difensori civici dei 21 territori verificati sui siti dei Consigli regionali (`reclami-pa/dati/fonti.json`, rigenera con `python3 -I scripts/reclami-pa-dati.py`). |
| [Raccolte firme in corso](raccolte-firme/) | Le raccolte firme online per proposte di legge di iniziativa popolare e referendum sulla piattaforma pubblica del Ministero della Giustizia: firme online, obiettivo, scadenza, ritmo e stima della probabilità con metodo dichiarato, link per firmare. Dati copiati con `node scripts/raccolte-firme.mjs` (una richiesta, ogni giorno con il workflow «Raccolte firme», orario automatico spento). |
| [Il bilancio del mio Comune](bilancio-comune/) | Il rendiconto più recente di 7.808 Comuni (OpenBDAP, Ragioneria Generale dello Stato): spesa per finalità e per servizio, per abitante, accanto alla mediana dei Comuni della stessa fascia di abitanti; entrate; avanzo o disavanzo, debito, tempestività dei pagamenti, parametri di deficitarietà, con la norma per ogni controllo. Dati preparati da `scripts/bilancio-bdap.py`. |
| [Red flag sugli appalti](appalti/) | Segnali di rischio sulle 1,45 milioni di procedure pubblicate nel 2025 da 19.356 stazioni appaltanti (dati aperti ANAC, CC BY-SA 4.0): affidamenti senza gara, gare con una sola offerta, peso del primo fornitore, affidamenti appena sotto soglia, cumuli allo stesso fornitore, tempi brevi sopra soglia UE, esclusioni. Metodi OCP, Cardinal e ANAC, segnale oltre il 75° percentile degli enti simili, in house contati a parte, nomi delle persone fisiche nascosti, richiesta degli atti pronta per ogni gara. Dati preparati da `scripts/appalti-anac.py`. |
| [Chiedo gli atti](chiedo-gli-atti/) | Chiedi documenti e dati a qualsiasi ente: sceglie tra FOIA, accesso civico semplice e accesso documentale, prepara richiesta, riesame e ricorsi, calcola le scadenze. 23.705 enti con PEC da IndicePA. |
| [Si è rotto o ci ho ripensato](garanzia/) | Garanzia e recesso dal Codice del consumo vigente: due anni di garanzia del venditore (12 mesi in più con la riparazione per i contratti dal 31/7/2026), presunzione del primo anno, prescrizione di 26 mesi, riparazione dal fabbricante per gli elettrodomestici e i telefoni, recesso di 14 giorni (12 mesi in più senza informativa), funzione «recedere dal contratto qui», rimborso in 14 giorni; lettere al venditore. |
| [La visita nei tempi](liste-attesa/) | Liste d'attesa: tempo massimo per classe di priorità (U 72 ore, B 10 giorni, D 30/60, P 120) dal Piano nazionale 2026-2028, richiamo dalla prelista, disdetta, e la richiesta all'ASL di attivare il percorso di tutela al costo del ticket (DL 73/2024 art. 3), con la PEC dell'azienda sanitaria da IndicePA. |
| [È una truffa?](truffe/) | Segnali di truffa in SMS, email, chat e telefonate con regole scritte: domini che imitano banche, Poste, corrieri ed enti pubblici (confronto con IndicePA), siti oscurati dalla CONSOB (`node scripts/truffe-consob.mjs`), conto di sicurezza, codici, «ciao mamma»; cosa fare subito, scadenze per contestare alla banca e per la querela; secondo parere facoltativo dell'assistente AI sul testo senza dati personali. Non dice mai «è sicuro». |

Ogni scadenza calcolata (ricorso, riesame, ultimo giorno per chiedere un bonus) si aggiunge in un clic a Google Calendar o Outlook, oppure si scarica come file `.ics` quando la pagina non è incorporata in un'altra applicazione.

Principi comuni: nessun dato inviato, nessuna AI che inventa (regole scritte come codice, testate e citate), l'esito «serve un dato» invece di un'ipotesi, nessun parere legale.

## Chi lo fa

Agenti civici è promosso dall'[Associazione Gianroberto Casaleggio](https://www.gianrobertocasaleggio.com/), senza fini di lucro. Gli strumenti sono gratuiti, senza pubblicità e senza tracciamento. Per sostenere l'iniziativa: [donazioni all'Associazione](https://www.gianrobertocasaleggio.com/donazioni/).

## Usarli

```bash
cd agenti-civici && python3 -m http.server 8080
```

Poi apri `http://localhost:8080`. Per metterli online gratis: GitHub Pages con il workflow `.github/workflows/pagine.yml` (Settings > Pages > Source: GitHub Actions), che pubblica solo le pagine degli strumenti dopo che i test sono passati.

## Compila da una foto

Quando la pagina è aperta dentro un assistente AI, ogni strumento mostra il riquadro «Compila da una foto» (`comune/foto.js`): si fotografa il documento (verbale, carta d'imbarco, bolletta, estratto conto, risposta dell'ente, attestazione ISEE) e l'assistente, con l'account di chi usa la pagina, legge i dati e riempie le domande. Regole:

- L'assistente legge solo i campi del questionario che sono scritti nel documento, senza dedurre; i dubbi li elenca.
- Nome, codice fiscale, data di nascita, indirizzo, email, telefono e IBAN non vengono trascritti: il controllo in `comune/campi.js` li scarta anche se arrivano.
- La pagina chiede di ricontrollare ogni campo: fa fede il documento.
- Altrove (GitHub Pages, file locali) il riquadro non appare, perché non c'è un lettore di immagini nel browser.

Anche l'Assistente accetta la foto di un documento insieme al messaggio.

## L'Assistente civico

`assistente/` non ha un server suo: usa la capacità `sample` della piattaforma che ospita la pagina, cioè un modello di intelligenza artificiale con l'account e i limiti di chi la apre. Il modello non calcola niente da solo: chiama nove strumenti della pagina (`assistente/src/strumenti.js`) che eseguono gli stessi motori di regole di Mi spetta, Faccio ricorso?, Chiedo gli atti e Mi rimborsano?. Le istruzioni permanenti sono in `assistente/src/istruzioni.js`.

- Cifre, soglie, termini e PEC arrivano solo dai risultati degli strumenti, con la fonte.
- Nome, codice fiscale e indirizzo non passano dalla chat: i documenti si completano nel pannello accanto, e quei dati restano nel browser (si cancellano con il pulsante in fondo alla pagina).
- Se la vista non permette alla pagina di usare i suoi strumenti, l'assistente non risponde e rimanda ai tre strumenti: senza i motori di regole dovrebbe inventare.

Si pubblica con `node scripts/prepara-assistente.mjs <cartella> '<link>'`, che conserva i percorsi del repository perché l'assistente importa i motori degli altri strumenti.

## Sentinella delle regole

Le regole valgono finché non cambia la fonte. `npm run sentinella` rilegge tutte le fonti citate dagli strumenti (187 pagine e PDF ufficiali, comprese le misure regionali) e i feed di INPS e Gazzetta Ufficiale, e scrive `sentinella/rapporto.md`:

- fonti cambiate, con gli importi in euro comparsi o spariti (sotto il 2% di parole diverse e senza importi toccati è un «ritocco» e non si segnala);
- link rotti, pagine vietate da robots.txt e pagine non leggibili in automatico (errori, controlli anti-bot: non si aggirano, si controllano a mano);
- nuove circolari e atti con parole chiave dei tre strumenti;
- revisioni a calendario: regole verificate da più di 120 giorni, rivalutazioni di gennaio, aggiornamento biennale delle sanzioni stradali.

Rispetta robots.txt, compresi i divieti rivolti solo ai crawler di intelligenza artificiale, e legge un sito per volta con due secondi tra una richiesta e l'altra. Lo stato dell'ultima lettura è in `sentinella/stato.json`. Il feed della Gazzetta contiene solo l'ultimo numero: va letto ogni giorno con `npm run sentinella -- --solo-feed` (rapporto in `sentinella/rapporto-feed.md`).

Su GitHub il workflow `.github/workflows/sentinella.yml` fa lo stesso e apre una issue quando c'è qualcosa da guardare; gli orari automatici sono commentati e vanno accesi a mano.

## Altri strumenti civici

La pagina d'ingresso segnala anche progetti di altri, già in funzione: [Fiumi Puliti](https://www.fiumipuliti.it/), la qualità dei fiumi misurata dai cittadini (Associazione Gianroberto Casaleggio), e [Alberi per il futuro](alberi/), l'iniziativa nata da un'idea di Gianroberto Casaleggio: una pagina con le edizioni dal 2015, la guida per chiedere l'area al Comune e gli alberi ai vivai pubblici di ogni Regione, e le lettere pronte. L'Assistente li suggerisce quando c'entrano.

## Dagli assistenti AI (MCP)

`mcp/` contiene un server MCP senza dipendenze con sedici strumenti in sola lettura (`garanzia_recesso`, `visita_nei_tempi`, `e_una_truffa`, `valuta_prestazioni`, `valuta_multa`, `cerca_ente`, `prepara_accesso_atti`, `valuta_reclamo`, `trova_pratica`, `prepara_segnalazione`, `reclamo_pa`, `raccolte_firme`, `bilancio_comune`, `appalti_ente`, `search`, `fetch`). Il nucleo è `mcp/nucleo.js`; `mcp/server.js` lo espone su stdio (app desktop, riga di comando, editor), `mcp/http.js` via internet (connettori remoti; `render.yaml` per pubblicarlo su Render). `npm run estensione` prepara l'estensione per le app desktop, `dist/agenti-civici.mcpb`. Istruzioni per ogni app in [mcp/LEGGIMI.md](mcp/LEGGIMI.md).

## Controlli

```bash
npm test                                # 120 casi: date e calendario, dieci strumenti, misure regionali, assistente, sentinella, server MCP
node mi-spetta/scripts/controlla-link.mjs   # le fonti di Mi spetta rispondono
python3 scripts/aggiorna-indicepa.py        # aggiorna PEC di Prefetture ed enti (richiede openpyxl)
```

## Identità visiva

Carta #F5F1E8, inchiostro #17202E, filo rosso #C2362B (su fondo scuro #F06A55); titoli in Bricolage Grotesque, testo in Atkinson Hyperlegible. Ogni fonte ha accanto il suo «nodo» rosso. Il marchio è in `comune/marchio.svg`, le icone degli strumenti in `scripts/applica-marca.py`.

## Struttura

- `comune/`: codice condiviso (logica a tre valori, scadenze con festività italiane e sospensione feriale, questionari, stile). Si copia dentro ogni strumento con `npm run sincronizza`, così ogni strumento resta pubblicabile da solo.
- `mi-spetta/`, `faccio-ricorso/`, `chiedo-gli-atti/`: uno strumento per cartella, con `src/` (regole e dati), `web/` (interfaccia), `test/`.
- `assistente/`: l'Assistente civico (strumenti per il modello, istruzioni, interfaccia della chat).
- `sentinella/`: controllo delle fonti; `scripts/sentinella.mjs` lo esegue.
- `mcp/`: server per gli assistenti AI.

## Misure regionali di Mi spetta

Le misure regionali sono in `mi-spetta/src/prestazioni/regionali/`, un file per Regione, verificate il 25/10/2026 sui siti ufficiali (rispettando robots.txt: dove il sito regionale lo vieta si sono usati enti strumentali, bollettini o gestori). Si valutano solo per chi indica la propria Regione. Sono escluse le borse universitarie, che dipendono dall'ateneo frequentato e non dalla residenza, e le misure chiuse senza una nuova edizione in vista. Trento usa l'ICEF al posto dell'ISEE. Molte misure passano da Comuni o Ambiti sociali con date proprie: lo strumento lo dice e rimanda all'avviso locale.

## Punti da ricontrollare

Oltre a quelli elencati in `mi-spetta/README.md`:

- **Multe.** Che aprire un verbale sul portale della Polizia di Stato equivalga alla notifica: lo strumento lo tratta così per prudenza. Proroga del termine per il Prefetto se cade di domenica o festivo: lo strumento non la considera. Le periodicità di taratura del nuovo decreto MIT dell'8/6/2026 (allegato pubblicato solo come immagine). La competenza delle Prefetture sarde per i comuni delle nuove province.
- **Reclami.** Il termine per chiedere la compensazione di un volo in Italia è incerto (Cassazione 4427/2024 esclude i 2 anni di Montreal ma non indica il termine): lo strumento consiglia di reclamare entro 6 mesi. Non è certo che la conciliazione ART sia obbligatoria anche per la sola compensazione. Il valore in euro dei DSP per i bagagli cambia ogni giorno. Il regolamento indennizzi AGCOM letto è quello della delibera 347/18/CONS. Le regole dell'ACF (Consob) non sono state lette perché il sito è dietro un controllo anti-bot.
- **Accesso agli atti.** Il termine per chiedere il riesame (30 giorni è l'indicazione della Funzione pubblica, non della legge). L'elenco aggiornato dei difensori civici regionali. Il sito foia.gov.it non risponde all'11/10/2026: si usano i moduli ANAC e le circolari su docs.italia.it.

## Licenza

Codice AGPL-3.0-or-later. Dati IndicePA con licenza CC BY 4.0. Mi spetta adatta il modello del simulatore francese Mes Aides / 1jeune1solution.


## Aggiornare i dati di bilancio e appalti

I file grezzi (alcuni gigabyte) stanno fuori dal repo, in `~/dati-civici/`. Si scaricano dai portali ufficiali (OpenBDAP «Rendiconto - Schemi di bilancio» e «Piano degli indicatori»; ANAC cig-AAAA, aggiudicazioni, aggiudicatari, partecipanti, varianti, stazioni appaltanti; ISTAT POSAS), poi:

```
python3 -I scripts/bilancio-bdap.py   # prima: serve anche agli appalti per riconoscere i Comuni
python3 -I scripts/appalti-anac.py
```
