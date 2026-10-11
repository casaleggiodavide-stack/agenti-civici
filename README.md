# Agenti civici

Strumenti aperti al servizio del cittadino, che funzionano **senza chiedere niente a nessuno**: niente accordi con la pubblica amministrazione, niente server, niente chiavi API, niente registrazione. Solo norme pubbliche, dati aperti e calcoli che girano nel browser.

| Strumento | Cosa fa |
|---|---|
| [Mi spetta](mi-spetta/) | A quali bonus e prestazioni pubbliche hai diritto: 24 prestazioni nazionali con le regole 2026, importi, requisiti, come chiederle, fonti. |
| [Faccio ricorso?](faccio-ricorso/) | Controlla una multa stradale: termini, motivi oggettivi, confronto dei costi, Prefettura competente con PEC, ricorso al Prefetto o al Giudice di Pace pronto da firmare. |
| [Chiedo gli atti](chiedo-gli-atti/) | Chiedi documenti e dati a qualsiasi ente: sceglie tra FOIA, accesso civico semplice e accesso documentale, prepara richiesta, riesame e ricorsi, calcola le scadenze. 23.705 enti con PEC da IndicePA. |

Principi comuni: nessun dato inviato, nessuna AI che inventa (regole scritte come codice, testate e citate), l'esito «serve un dato» invece di un'ipotesi, nessun parere legale.

## Usarli

```bash
cd agenti-civici && python3 -m http.server 8080
```

Poi apri `http://localhost:8080`. Per metterli online gratis: GitHub Pages sulla cartella principale.

## Dagli assistenti AI (MCP)

`mcp/server.js` espone i tre strumenti come strumenti MCP, senza dipendenze: `valuta_prestazioni`, `valuta_multa`, `cerca_ente`, `prepara_accesso_atti`. Per Claude Desktop:

```json
{ "mcpServers": { "agenti-civici": { "command": "node", "args": ["/percorso/di/agenti-civici/mcp/server.js"] } } }
```

## Controlli

```bash
npm test                                # 50 casi: date, tre strumenti, server MCP
node mi-spetta/scripts/controlla-link.mjs   # le fonti di Mi spetta rispondono
python3 scripts/aggiorna-indicepa.py        # aggiorna PEC di Prefetture ed enti (richiede openpyxl)
```

## Struttura

- `comune/`: codice condiviso (logica a tre valori, scadenze con festività italiane e sospensione feriale, questionari, stile). Si copia dentro ogni strumento con `npm run sincronizza`, così ogni strumento resta pubblicabile da solo.
- `mi-spetta/`, `faccio-ricorso/`, `chiedo-gli-atti/`: uno strumento per cartella, con `src/` (regole e dati), `web/` (interfaccia), `test/`.
- `mcp/`: server per gli assistenti AI.

## Punti da ricontrollare

Oltre a quelli elencati in `mi-spetta/README.md`:

- **Multe.** Che aprire un verbale sul portale della Polizia di Stato equivalga alla notifica: lo strumento lo tratta così per prudenza. Proroga del termine per il Prefetto se cade di domenica o festivo: lo strumento non la considera. Le periodicità di taratura del nuovo decreto MIT dell'8/6/2026 (allegato pubblicato solo come immagine). La competenza delle Prefetture sarde per i comuni delle nuove province.
- **Accesso agli atti.** Il termine per chiedere il riesame (30 giorni è l'indicazione della Funzione pubblica, non della legge). L'elenco aggiornato dei difensori civici regionali. Il sito foia.gov.it non risponde all'11/10/2026: si usano i moduli ANAC e le circolari su docs.italia.it.

## Licenza

Codice AGPL-3.0-or-later. Dati IndicePA con licenza CC BY 4.0. Mi spetta adatta il modello del simulatore francese Mes Aides / 1jeune1solution.
