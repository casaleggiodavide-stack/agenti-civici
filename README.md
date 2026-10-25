<img src="comune/marchio.svg" width="72" alt="Il marchio degli agenti civici: un filo rosso legato a un nodo che attraversa un labirinto">

# Agenti civici

**Il filo per uscire dal labirinto.** La burocrazia è un labirinto; questi strumenti sono il filo di Arianna: un capo resta legato all'ingresso, alla fonte ufficiale, e il filo accompagna una regola dopo l'altra fino a quello che ti spetta. I passi e la firma restano tuoi.

Strumenti aperti al servizio del cittadino, che funzionano **senza chiedere niente a nessuno**: niente accordi con la pubblica amministrazione, niente server, niente chiavi API, niente registrazione. Solo norme pubbliche, dati aperti e calcoli che girano nel browser.

| Strumento | Cosa fa |
|---|---|
| [Assistente civico](assistente/) | Lo stesso lavoro in conversazione: racconti il problema con parole tue, l'assistente fa le domande che servono e usa i motori di regole dei tre strumenti qui sotto. Funziona dentro claude.ai o l'app di Claude, con l'account di chi lo usa; fuori da Claude rimanda agli strumenti. |
| [Mi spetta](mi-spetta/) | A quali bonus e prestazioni pubbliche hai diritto: 24 prestazioni nazionali e 67 misure regionali (tutte le Regioni e le Province autonome) con le regole 2026, importi, requisiti, come chiederle, fonti. |
| [Faccio ricorso?](faccio-ricorso/) | Controlla una multa stradale: termini, motivi oggettivi, confronto dei costi, Prefettura competente con PEC, ricorso al Prefetto o al Giudice di Pace pronto da firmare. |
| [Mi rimborsano?](mi-rimborsano/) | Reclami e rimborsi: volo in ritardo o cancellato (Reg. 261/2004, con la riforma 2026/2202 che si applica dal 23/10/2027), bagaglio (Montreal), treno (Reg. 2021/782), bollette e prescrizione di due anni (ARERA), telefono e internet (indennizzi AGCOM), addebiti bancari non autorizzati (d.lgs. 11/2010). Importo, termini, passi e lettera di messa in mora. |
| [Chiedo gli atti](chiedo-gli-atti/) | Chiedi documenti e dati a qualsiasi ente: sceglie tra FOIA, accesso civico semplice e accesso documentale, prepara richiesta, riesame e ricorsi, calcola le scadenze. 23.705 enti con PEC da IndicePA. |

Ogni scadenza calcolata (ricorso, riesame, ultimo giorno per chiedere un bonus) si aggiunge in un clic a Google Calendar o Outlook, oppure si scarica come file `.ics` fuori da claude.ai.

Principi comuni: nessun dato inviato, nessuna AI che inventa (regole scritte come codice, testate e citate), l'esito «serve un dato» invece di un'ipotesi, nessun parere legale.

## Usarli

```bash
cd agenti-civici && python3 -m http.server 8080
```

Poi apri `http://localhost:8080`. Per metterli online gratis: GitHub Pages con il workflow `.github/workflows/pagine.yml` (Settings > Pages > Source: GitHub Actions), che pubblica solo le pagine degli strumenti dopo che i test sono passati.

## Compila da una foto

Dentro claude.ai ogni strumento mostra il riquadro «Compila da una foto» (`comune/foto.js`): si fotografa il documento (verbale, carta d'imbarco, bolletta, estratto conto, risposta dell'ente, attestazione ISEE) e Claude, con l'account di chi usa la pagina, legge i dati e riempie le domande. Regole:

- Claude legge solo i campi del questionario che sono scritti nel documento, senza dedurre; i dubbi li elenca.
- Nome, codice fiscale, data di nascita, indirizzo, email, telefono e IBAN non vengono trascritti: il controllo in `comune/campi.js` li scarta anche se arrivano.
- La pagina chiede di ricontrollare ogni campo: fa fede il documento.
- Fuori da claude.ai (GitHub Pages, file locali) il riquadro non appare, perché non c'è un lettore di immagini nel browser.

Anche l'Assistente accetta la foto di un documento insieme al messaggio.

## L'Assistente civico

`assistente/` non ha un server suo: usa la capacità `sample` delle pagine pubblicate su claude.ai, cioè Claude con l'account e i limiti di chi apre la pagina. Claude non calcola niente da solo: chiama nove strumenti della pagina (`assistente/src/strumenti.js`) che eseguono gli stessi motori di regole di Mi spetta, Faccio ricorso?, Chiedo gli atti e Mi rimborsano?. Le istruzioni permanenti sono in `assistente/src/istruzioni.js`.

- Cifre, soglie, termini e PEC arrivano solo dai risultati degli strumenti, con la fonte.
- Nome, codice fiscale e indirizzo non passano dalla chat: i documenti si completano nel pannello accanto, e quei dati restano nel browser (si cancellano con il pulsante in fondo alla pagina).
- Se la vista di Claude non permette alla pagina di usare i suoi strumenti, l'assistente non risponde e rimanda ai tre strumenti: senza i motori di regole dovrebbe inventare.

Si pubblica con `node scripts/prepara-assistente.mjs <cartella> '<link>'`, che conserva i percorsi del repository perché l'assistente importa i motori degli altri strumenti.

## Sentinella delle regole

Le regole valgono finché non cambia la fonte. `npm run sentinella` rilegge tutte le fonti citate dagli strumenti (187 pagine e PDF ufficiali, comprese le misure regionali) e i feed di INPS e Gazzetta Ufficiale, e scrive `sentinella/rapporto.md`:

- fonti cambiate, con gli importi in euro comparsi o spariti (sotto il 2% di parole diverse e senza importi toccati è un «ritocco» e non si segnala);
- link rotti, pagine vietate da robots.txt e pagine non leggibili in automatico (errori, controlli anti-bot: non si aggirano, si controllano a mano);
- nuove circolari e atti con parole chiave dei tre strumenti;
- revisioni a calendario: regole verificate da più di 120 giorni, rivalutazioni di gennaio, aggiornamento biennale delle sanzioni stradali.

Rispetta robots.txt, compresi i divieti rivolti solo agli agenti di Anthropic (ClaudeBot, Claude-User, anthropic-ai), e legge un sito per volta con due secondi tra una richiesta e l'altra. Lo stato dell'ultima lettura è in `sentinella/stato.json`. Il feed della Gazzetta contiene solo l'ultimo numero: va letto ogni giorno con `npm run sentinella -- --solo-feed` (rapporto in `sentinella/rapporto-feed.md`).

Su GitHub il workflow `.github/workflows/sentinella.yml` fa lo stesso e apre una issue quando c'è qualcosa da guardare; gli orari automatici sono commentati e vanno accesi a mano.

## Altri strumenti civici

La pagina d'ingresso segnala anche progetti di altri, già in funzione: [Fiumi Puliti](https://www.fiumipuliti.it/), la qualità dei fiumi misurata dai cittadini (Associazione Gianroberto Casaleggio), e [Alberi per il futuro](https://www.alberiperilfuturo.it/), piantare alberi con il proprio Comune intorno al 21 novembre. L'Assistente li suggerisce quando c'entrano.

## Dagli assistenti AI (MCP)

`mcp/` contiene un server MCP senza dipendenze con sette strumenti in sola lettura (`valuta_prestazioni`, `valuta_multa`, `cerca_ente`, `prepara_accesso_atti`, `valuta_reclamo`, `search`, `fetch`). Il nucleo è `mcp/nucleo.js`; `mcp/server.js` lo espone su stdio (Claude Desktop, Claude Code, Cursor), `mcp/http.js` via internet (ChatGPT, connettori di claude.ai; `render.yaml` per pubblicarlo su Render). `npm run estensione` prepara l'estensione per Claude Desktop, `dist/agenti-civici.mcpb`. Istruzioni per ogni app in [mcp/LEGGIMI.md](mcp/LEGGIMI.md).

## Controlli

```bash
npm test                                # 93 casi: date e calendario, quattro strumenti, misure regionali, assistente, sentinella, server MCP
node mi-spetta/scripts/controlla-link.mjs   # le fonti di Mi spetta rispondono
python3 scripts/aggiorna-indicepa.py        # aggiorna PEC di Prefetture ed enti (richiede openpyxl)
```

## Identità visiva

Carta #F5F1E8, inchiostro #17202E, filo rosso #C2362B (su fondo scuro #F06A55); titoli in Bricolage Grotesque, testo in Atkinson Hyperlegible. Ogni fonte ha accanto il suo «nodo» rosso. Il marchio è in `comune/marchio.svg`, le icone degli strumenti in `scripts/applica-marca.py`.

## Struttura

- `comune/`: codice condiviso (logica a tre valori, scadenze con festività italiane e sospensione feriale, questionari, stile). Si copia dentro ogni strumento con `npm run sincronizza`, così ogni strumento resta pubblicabile da solo.
- `mi-spetta/`, `faccio-ricorso/`, `chiedo-gli-atti/`: uno strumento per cartella, con `src/` (regole e dati), `web/` (interfaccia), `test/`.
- `assistente/`: l'Assistente civico (strumenti per Claude, istruzioni, interfaccia della chat).
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
