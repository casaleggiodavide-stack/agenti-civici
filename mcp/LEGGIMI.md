# Gli agenti civici dentro il tuo assistente AI

Il server MCP mette le regole degli agenti civici a disposizione di un assistente AI. Così l'assistente risponde con importi, termini e PEC verificati sulle fonti ufficiali, invece che a memoria.

Strumenti (tutti in sola lettura, nessun dato salvato):

| Strumento | Cosa fa |
|---|---|
| `valuta_prestazioni` | Mi spetta: bonus e prestazioni nazionali e regionali, con importo, dati mancanti, come chiederle e fonte |
| `valuta_multa` | Faccio ricorso?: controllo della multa, scadenze, costi, Prefettura con PEC, testo del ricorso |
| `cerca_ente`, `prepara_accesso_atti` | Chiedo gli atti: ente pubblico con PEC, tipo di accesso, scadenze, richiesta e ricorsi |
| `valuta_reclamo` | Mi rimborsano?: voli, bagagli, treni, bollette, telefono, banche; importo, termini, lettera di messa in mora |
| `trova_pratica` | Navigatore dei servizi: cosa devo fare per… passi, documenti, costi, tempi e fonti delle pratiche più comuni |
| `bilancio_comune` | Il bilancio del mio Comune: spesa, entrate e conti dal rendiconto ufficiale, con il confronto con i Comuni simili |
| `appalti_ente` | Red flag sugli appalti: segnali di rischio negli appalti di un ente pubblico, dai dati aperti ANAC |
| `search`, `fetch` | Cerca e leggi le schede (prestazioni e strumenti), anche per le funzioni di ricerca approfondita |

## App desktop con estensioni MCP

**Con l'estensione (consigliato).** Scarica [agenti-civici.mcpb](https://github.com/casaleggiodavide-stack/agenti-civici/releases/latest/download/agenti-civici.mcpb) dall'ultima versione e aprilo con un doppio clic: l'app chiede conferma e la installa. Il formato MCPB contiene già tutto, non serve installare Node.

**A mano.** Nel file di configurazione MCP dell'app aggiungi:

```json
{
  "mcpServers": {
    "agenti-civici": {
      "command": "npx",
      "args": ["-y", "--package=github:casaleggiodavide-stack/agenti-civici", "agenti-civici-mcp"]
    }
  }
}
```

La stessa configurazione vale per gli assistenti da riga di comando e per gli editor (Cursor, VS Code, Windsurf): comando `npx` con gli stessi argomenti.

## Assistenti via internet

Gli assistenti che si collegano a un connettore remoto usano un server raggiungibile da internet. Il server è `mcp/http.js` (Streamable HTTP senza stato); `render.yaml` lo pubblica gratis su Render. Nelle impostazioni dei connettori dell'assistente si aggiunge un connettore personalizzato con l'indirizzo del server seguito da `/mcp` e autenticazione «Nessuna».

Indirizzo pubblico: da indicare qui dopo la pubblicazione su Render.

## Provarlo in locale

```bash
npm run mcp
```

```bash
npm run mcp-http
```

Il secondo risponde su `http://localhost:8080/mcp`. Per rifare l'estensione: `npm run estensione`, che scrive `dist/agenti-civici.mcpb`.

## Regole del server

- Importi, soglie e termini solo dai motori di regole; le fonti sono nelle risposte.
- Nome, codice fiscale, indirizzo e IBAN non si chiedono: i documenti hanno campi tra [ ] da completare a mano.
- Niente log delle domande, niente cookie, niente sessioni. Limite di 120 richieste al minuto per indirizzo.
- Non è un parere legale: decide sempre l'ente o il giudice.
