# Mi spetta

**A cosa ho diritto?** Un navigatore aperto dei bonus e delle prestazioni pubbliche italiane. Il cittadino risponde a quello che sa e vede subito cosa gli spetta, quanto vale, perché, come chiederlo e su quale fonte ufficiale si basa la risposta.

Funziona senza chiedere niente a nessuno:

- **Nessuna PA coinvolta.** Usa solo norme, circolari e moduli pubblici.
- **Nessun server.** Tutto il calcolo gira nel browser. Le risposte restano sul dispositivo.
- **Nessuna chiave API, nessuna registrazione, nessun tracciamento.**
- **Nessuna AI che inventa.** Le regole sono scritte come codice, testate e citate. Se manca un dato, il sito lo dice invece di indovinare.

È un adattamento all'Italia del modello francese [Mes Aides / 1jeune1solution](https://github.com/DNUM-SocialGouv/aides-jeunes) (AGPL-3.0), il simulatore pubblico che in Francia orienta decine di migliaia di persone al mese: una scheda per prestazione con condizioni, importo, istruzioni e link al servizio. Il codice francese è legato al motore fiscale francese OpenFisca e il tentativo italiano su OpenFisca è archiviato dal 2018, quindi il motore qui è scritto da zero, in JavaScript senza dipendenze.

## Cosa valuta

24 prestazioni nazionali, regole verificate sulle fonti ufficiali all'11 ottobre 2026.

| Area | Prestazioni |
|---|---|
| Famiglia e figli | Assegno unico (tabella INPS 2026 a 252 fasce), bonus asilo nido, bonus nuovi nati, assegno di maternità dei Comuni, bonus mamme lavoratrici, esonero contributi madri con 3 figli, Carta Dedicata a te, detrazione figli 21-29 anni |
| Reddito | Assegno di inclusione, Supporto formazione e lavoro, Carta Acquisti |
| Anziani | Assegno sociale, quattordicesima, esonero canone TV over 75 |
| Casa e bollette | Bonus sociale luce gas acqua, sconto luce per ISEE fino a 25.000 €, bonus TARI, detrazione affitto, detrazione affitto giovani |
| Salute e lavoro | Esenzione ticket E01-E04, bonus psicologo, trattamento integrativo, taglio del cuneo fiscale, NASpI |

Ogni esito è uno di: **ti spetta**, **probabilmente ti spetta** (regola certa ma condizione non verificabile, o fonte solo secondaria), **serve un dato**, **domanda chiusa**, **non ti spetta**. Il totale annuo somma solo ciò che spetta o probabilmente spetta, escluse le prestazioni a graduatoria o legate a spese effettive (nido, SFL, Carta Dedicata a te, bonus psicologo).

## Usarlo

Serve un qualunque server di file statici, perché il browser carica i moduli JavaScript:

```bash
cd mi-spetta && python3 -m http.server 8080
```

Poi apri `http://localhost:8080`. Per metterlo online gratis basta GitHub Pages: pubblica il repository e attiva Pages sulla cartella principale.

## Usarlo da un assistente AI (MCP)

`mcp/server.js` espone le stesse regole come strumenti MCP, senza dipendenze. Un assistente che lo usa risponde con il motore e le fonti invece che a memoria. Nel file di configurazione MCP dell'app:

```json
{
  "mcpServers": {
    "mi-spetta": { "command": "node", "args": ["/percorso/di/mi-spetta/mcp/server.js"] }
  }
}
```

Strumenti: `valuta_prestazioni` (le risposte del questionario, tutte facoltative), `elenca_prestazioni`, `domande`.

## Controlli

```bash
npm test                          # 19 casi reali calcolati a mano dalle fonti
node scripts/controlla-link.mjs   # verifica che le fonti e i link ai servizi rispondano
```

## Aggiornare o aggiungere una prestazione

Ogni prestazione è un oggetto in `src/prestazioni/` con: `requisiti` (ciascuno vero, falso o null se manca il dato), `importo`, `come` (passi, documenti, link al servizio), `finestra` (date di apertura e chiusura), `fonti` e data di `verificato`. Per aggiungerne una: scrivi la scheda, aggiungila a `src/prestazioni/index.js`, aggiungi un caso in `test/casi.test.js`.

Ogni anno cambiano soprattutto le soglie ISEE e gli importi (gennaio-febbraio, con le circolari INPS di rivalutazione) e la tabella dell'Assegno unico (`src/dati/auu-2026.js`, estratta dall'allegato 1 della circolare INPS 7/2026).

## Punti da ricontrollare

Segnalati come «probabile» o nelle note delle schede:

- Assegno di inclusione: se la soglia di reddito di 10.140 € per chi è in affitto va moltiplicata per la scala di equivalenza.
- Carta Acquisti: soglie 2026 da fonti secondarie; la soglia più alta per gli anziani vale dai 70 o dai 75 anni.
- Bonus mamme 2026: istruzioni INPS per la domanda non ancora pubblicate all'11 ottobre 2026.
- Bonus psicologo: finestra 2026 non ancora annunciata.
- Detrazione affitto giovani: alcune fonti secondarie parlano di nuove soglie con la legge di bilancio 2026.
- Il nuovo «ISEE per prestazioni familiari e inclusione» (legge 199/2025) può essere più basso dell'ISEE ordinario: il sito usa l'ISEE indicato dall'utente.

## Limiti

Solo prestazioni nazionali: Regioni e Comuni hanno molti altri bonus. Non calcola l'ISEE (rimanda al simulatore INPS). È una stima informativa, non un parere: decide sempre l'ente erogatore.

## Licenza

AGPL-3.0-or-later, come il progetto francese da cui prende il modello.
