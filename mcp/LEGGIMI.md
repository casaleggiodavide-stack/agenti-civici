# Gli agenti civici dentro Claude e ChatGPT

Il server MCP mette le regole degli agenti civici a disposizione di un assistente AI. Così l'assistente risponde con importi, termini e PEC verificati sulle fonti ufficiali, invece che a memoria.

Strumenti (tutti in sola lettura, nessun dato salvato):

| Strumento | Cosa fa |
|---|---|
| `valuta_prestazioni` | Mi spetta: bonus e prestazioni nazionali e regionali, con importo, dati mancanti, come chiederle e fonte |
| `valuta_multa` | Faccio ricorso?: controllo della multa, scadenze, costi, Prefettura con PEC, testo del ricorso |
| `cerca_ente`, `prepara_accesso_atti` | Chiedo gli atti: ente pubblico con PEC, tipo di accesso, scadenze, richiesta e ricorsi |
| `valuta_reclamo` | Mi rimborsano?: voli, bagagli, treni, bollette, telefono, banche; importo, termini, lettera di messa in mora |
| `search`, `fetch` | Cerca e leggi le schede (91 prestazioni e gli strumenti), anche per la ricerca approfondita di ChatGPT |

## Claude Desktop

**Con l'estensione.** Il file `agenti-civici.mcpb` si prepara con `npm run estensione` (in `dist/`) e sarà scaricabile dalle versioni su GitHub. Si apre con un doppio clic: Claude Desktop chiede conferma e la installa. Serve solo Claude Desktop, che contiene già Node.

**A mano.** In Impostazioni, Sviluppatore, Modifica configurazione, aggiungi:

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

## Claude Code

```bash
claude mcp add agenti-civici -- npx -y --package=github:casaleggiodavide-stack/agenti-civici agenti-civici-mcp
```

## ChatGPT e claude.ai (via internet)

ChatGPT e i connettori di claude.ai usano un server raggiungibile da internet. Il server è `mcp/http.js` (Streamable HTTP senza stato); `render.yaml` lo pubblica gratis su Render.

- **ChatGPT**: Impostazioni, App e connettori, Impostazioni avanzate, attiva la modalità sviluppatore; poi Crea, incolla l'indirizzo del server seguito da `/mcp`, autenticazione «Nessuna».
- **claude.ai**: Impostazioni, Connettori, Aggiungi connettore personalizzato, incolla lo stesso indirizzo.

Indirizzo pubblico: da indicare qui dopo la pubblicazione su Render.

## Altri client (Cursor, VS Code, Windsurf)

Usano la stessa configurazione di Claude Desktop (`command` `npx` con gli stessi `args`), nel file di configurazione MCP del client.

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
