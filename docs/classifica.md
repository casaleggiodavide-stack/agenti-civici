# La classifica condivisa dei giochi

I tre giochi di [Gioca con il Polpo](../giochi/) hanno una classifica comune a tutti i giocatori: **oggi** (la sfida del giorno, la stessa partita per tutti), **di sempre** (il miglior punteggio di ogni giocatore) e **regioni** (media dei migliori punteggi della sfida del giorno negli ultimi 7 giorni, solo per le regioni con almeno tre giocatori).

## Cosa si manda e cosa no

- Si entra **solo se lo scegli**, a fine partita. Si può uscire quando si vuole: «Esci dalla classifica» cancella il giocatore da tutte le classifiche.
- Il **nome è inventato** (una creatura del mare, un aggettivo e un numero, per esempio «Seppia Saggia 27»): non si può scrivere un nome libero, quindi niente nomi veri, offese o dati personali da moderare.
- La **regione** è facoltativa e si sceglie da un elenco.
- Il browser crea un **codice casuale del giocatore** (24 caratteri) che resta nel browser e serve a tenere un solo punteggio per persona. Non viene mai mostrato.
- Insieme ai punti vanno le **mosse della partita**: il servizio rigioca la partita con le stesse regole del browser (`classifica/src/verifica.js`) e calcola i punti da sé. Un punteggio inventato non entra.
- **Nessun indirizzo IP salvato**, niente cookie, niente email. I limiti contro gli abusi (richieste al minuto) stanno solo in memoria.
- Le classifiche del giorno si cancellano dopo 60 giorni.

## Come è fatta

- `classifica/src/api.js`: le regole del servizio, uguali ovunque.
- `classifica/worker.js`: il servizio su Cloudflare Workers con il database D1 (piano gratuito: 100.000 richieste al giorno).
- `classifica/server.js`: lo stesso servizio su Node senza dipendenze (SQLite), per le prove in locale: `PORT=8089 node classifica/server.js`, poi nel browser su localhost `localStorage.setItem('polpo-classifica-url', 'http://localhost:8089')`.
- `giochi/comune/classifica.js`: la parte nel browser. Finché `INDIRIZZO` è vuoto, la classifica non compare.

## Pubblicazione (una volta sola)

1. Creare un account gratuito su Cloudflare.
2. Creare un token API (My Profile > API Tokens > Create Token > «Edit Cloudflare Workers», aggiungendo il permesso D1: Edit) e copiare l'Account ID.
3. Nel repository GitHub, Settings > Secrets and variables > Actions: aggiungere `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`.
4. Avviare il workflow «Classifica» (Actions > Classifica > Run workflow). Crea il database, le tabelle e pubblica il servizio su `https://polpo-classifica.<sottodominio>.workers.dev`.
5. Scrivere quell'indirizzo in `INDIRIZZO` in `giochi/comune/classifica.js`.

Dopo, il workflow ripubblica il servizio da solo ogni volta che cambiano le regole dei giochi.
