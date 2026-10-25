# Agenti civici

Strumenti aperti al servizio del cittadino, che funzionano **senza chiedere niente a nessuno**: niente accordi con la pubblica amministrazione, niente server, niente chiavi API, niente registrazione. Solo norme pubbliche, dati aperti e calcoli che girano nel browser.

| Strumento | Cosa fa |
|---|---|
| [Assistente civico](assistente/) | Lo stesso lavoro in conversazione: racconti il problema con parole tue, l'assistente fa le domande che servono e usa i motori di regole dei tre strumenti qui sotto. Funziona dentro claude.ai o l'app di Claude, con l'account di chi lo usa; fuori da Claude rimanda agli strumenti. |
| [Mi spetta](mi-spetta/) | A quali bonus e prestazioni pubbliche hai diritto: 24 prestazioni nazionali con le regole 2026, importi, requisiti, come chiederle, fonti. |
| [Faccio ricorso?](faccio-ricorso/) | Controlla una multa stradale: termini, motivi oggettivi, confronto dei costi, Prefettura competente con PEC, ricorso al Prefetto o al Giudice di Pace pronto da firmare. |
| [Chiedo gli atti](chiedo-gli-atti/) | Chiedi documenti e dati a qualsiasi ente: sceglie tra FOIA, accesso civico semplice e accesso documentale, prepara richiesta, riesame e ricorsi, calcola le scadenze. 23.705 enti con PEC da IndicePA. |

Ogni scadenza calcolata (ricorso, riesame, ultimo giorno per chiedere un bonus) si aggiunge in un clic a Google Calendar o Outlook, oppure si scarica come file `.ics` fuori da claude.ai.

Principi comuni: nessun dato inviato, nessuna AI che inventa (regole scritte come codice, testate e citate), l'esito «serve un dato» invece di un'ipotesi, nessun parere legale.

## Usarli

```bash
cd agenti-civici && python3 -m http.server 8080
```

Poi apri `http://localhost:8080`. Per metterli online gratis: GitHub Pages con il workflow `.github/workflows/pagine.yml` (Settings > Pages > Source: GitHub Actions), che pubblica solo le pagine degli strumenti dopo che i test sono passati.

## L'Assistente civico

`assistente/` non ha un server suo: usa la capacità `sample` delle pagine pubblicate su claude.ai, cioè Claude con l'account e i limiti di chi apre la pagina. Claude non calcola niente da solo: chiama sette strumenti della pagina (`assistente/src/strumenti.js`) che eseguono gli stessi motori di regole di Mi spetta, Faccio ricorso? e Chiedo gli atti. Le istruzioni permanenti sono in `assistente/src/istruzioni.js`.

- Cifre, soglie, termini e PEC arrivano solo dai risultati degli strumenti, con la fonte.
- Nome, codice fiscale e indirizzo non passano dalla chat: i documenti si completano nel pannello accanto, e quei dati restano nel browser (si cancellano con il pulsante in fondo alla pagina).
- Se la vista di Claude non permette alla pagina di usare i suoi strumenti, l'assistente non risponde e rimanda ai tre strumenti: senza i motori di regole dovrebbe inventare.

Si pubblica con `node scripts/prepara-assistente.mjs <cartella> '<link>'`, che conserva i percorsi del repository perché l'assistente importa i motori degli altri strumenti.

## Sentinella delle regole

Le regole valgono finché non cambia la fonte. `npm run sentinella` rilegge tutte le fonti citate dai tre strumenti (60 pagine e PDF ufficiali) e i feed di INPS e Gazzetta Ufficiale, e scrive `sentinella/rapporto.md`:

- fonti cambiate, con gli importi in euro comparsi o spariti (sotto il 2% di parole diverse e senza importi toccati è un «ritocco» e non si segnala);
- link rotti, pagine vietate da robots.txt e pagine non leggibili in automatico (errori, controlli anti-bot: non si aggirano, si controllano a mano);
- nuove circolari e atti con parole chiave dei tre strumenti;
- revisioni a calendario: regole verificate da più di 120 giorni, rivalutazioni di gennaio, aggiornamento biennale delle sanzioni stradali.

Rispetta robots.txt, compresi i divieti rivolti solo agli agenti di Anthropic (ClaudeBot, Claude-User, anthropic-ai), e legge un sito per volta con due secondi tra una richiesta e l'altra. Lo stato dell'ultima lettura è in `sentinella/stato.json`. Il feed della Gazzetta contiene solo l'ultimo numero: va letto ogni giorno con `npm run sentinella -- --solo-feed` (rapporto in `sentinella/rapporto-feed.md`).

Su GitHub il workflow `.github/workflows/sentinella.yml` fa lo stesso e apre una issue quando c'è qualcosa da guardare; gli orari automatici sono commentati e vanno accesi a mano.

## Dagli assistenti AI (MCP)

`mcp/server.js` espone i tre strumenti come strumenti MCP, senza dipendenze: `valuta_prestazioni`, `valuta_multa`, `cerca_ente`, `prepara_accesso_atti`. Per Claude Desktop:

```json
{ "mcpServers": { "agenti-civici": { "command": "node", "args": ["/percorso/di/agenti-civici/mcp/server.js"] } } }
```

## Controlli

```bash
npm test                                # 69 casi: date e calendario, tre strumenti, assistente, sentinella, server MCP
node mi-spetta/scripts/controlla-link.mjs   # le fonti di Mi spetta rispondono
python3 scripts/aggiorna-indicepa.py        # aggiorna PEC di Prefetture ed enti (richiede openpyxl)
```

## Struttura

- `comune/`: codice condiviso (logica a tre valori, scadenze con festività italiane e sospensione feriale, questionari, stile). Si copia dentro ogni strumento con `npm run sincronizza`, così ogni strumento resta pubblicabile da solo.
- `mi-spetta/`, `faccio-ricorso/`, `chiedo-gli-atti/`: uno strumento per cartella, con `src/` (regole e dati), `web/` (interfaccia), `test/`.
- `assistente/`: l'Assistente civico (strumenti per Claude, istruzioni, interfaccia della chat).
- `sentinella/`: controllo delle fonti; `scripts/sentinella.mjs` lo esegue.
- `mcp/`: server per gli assistenti AI.

## Punti da ricontrollare

Oltre a quelli elencati in `mi-spetta/README.md`:

- **Multe.** Che aprire un verbale sul portale della Polizia di Stato equivalga alla notifica: lo strumento lo tratta così per prudenza. Proroga del termine per il Prefetto se cade di domenica o festivo: lo strumento non la considera. Le periodicità di taratura del nuovo decreto MIT dell'8/6/2026 (allegato pubblicato solo come immagine). La competenza delle Prefetture sarde per i comuni delle nuove province.
- **Accesso agli atti.** Il termine per chiedere il riesame (30 giorni è l'indicazione della Funzione pubblica, non della legge). L'elenco aggiornato dei difensori civici regionali. Il sito foia.gov.it non risponde all'11/10/2026: si usano i moduli ANAC e le circolari su docs.italia.it.

## Licenza

Codice AGPL-3.0-or-later. Dati IndicePA con licenza CC BY 4.0. Mi spetta adatta il modello del simulatore francese Mes Aides / 1jeune1solution.
