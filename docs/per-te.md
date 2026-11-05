# «Per te»: la scheda che cresce con le risposte

Progetto della sezione, 5/11/2026. Primo rilascio (domande 1-3) fatto lo stesso giorno: `per-te/`, dati da `scripts/per-te-dati.py`, regole in `per-te/src/regole.js`.

## L'idea in una riga

Rispondi a una domanda alla volta, a partire dal Comune dove abiti. A ogni risposta la scheda si allunga con quello che vale per te: il dato chiave di ogni strumento, già calcolato, e il pulsante per andare a fondo. Ogni domanda si può saltare. Tutto resta nel browser.

## Perché

Oggi gli strumenti sono 15 e ognuno chiede di nuovo le stesse cose: il Comune, la Regione, chi vive in casa. Chi arriva non sa quale aprire per primo. La scheda fa il contrario: sei tu che dai un'informazione, e il Polpo ti mostra subito quello che ne ricava, attraverso tutti gli strumenti.

## Dove sta

- **Nella casa del Polpo** (la home): al posto dell'elenco degli strumenti, in cima c'è una sola domanda, «Dove abiti?». Sotto restano gli strumenti per chi sa già cosa cerca.
- **Una pagina sua**, `per-te/`, nel menu come «Per te». È la stessa scheda, con lo spazio per tutte le domande.

Il Polpo qui non ha un braccio rosso suo: è il Polpo intero, perché la scheda le usa tutte.

## Le domande, in ordine

L'ordine conta: prima quella che costa meno e dà di più. Dopo ogni risposta la scheda dice cosa si ottiene con la domanda successiva, prima che tu la veda («Con la prossima domanda: 3 aiuti possibili per la tua famiglia»). Il numero viene dai motori di regole, non è un'esca.

| # | Domanda | Come si risponde | Cosa sblocca |
|---|---|---|---|
| 1 | Dove abiti? | Nome del Comune, con i suggerimenti | Tutte le schede del territorio (vedi sotto) |
| 2 | Chi vive in casa con te? | Pulsanti: solo, in coppia, con figli (quanti, se sotto i 3 anni o sotto i 18), con una persona oltre i 65, con una persona con disabilità | Gli aiuti di Mi spetta per la famiglia, nazionali e della tua Regione |
| 3 | Più o meno, quanto è il tuo ISEE? | Fasce: non lo so, fino a 9.530, fino a 15.000, fino a 25.000, fino a 40.000, oltre | Restringe gli aiuti ai probabili; bonus sociale (bollette e ingombranti senza contributo) |
| 4 | Casa: affitto, mutuo o proprietà? | Tre pulsanti | Contributi per l'affitto della Regione, detrazioni, diritti TARI |
| 5 | Che lavoro fai? | Dipendente, autonomo, pensionato, in cerca, studente, altro | Prestazioni e pratiche del Navigatore per la tua situazione |
| 6 | Ti sposti con…? | Auto, treno, aereo (più di una scelta) | Faccio ricorso? con la tua Prefettura, Mi rimborsano? con gli aeroporti vicini |
| 7 | Stai aspettando una visita o un esame? | Sì, no | La visita nei tempi, con i termini massimi |
| 8 | Ti interessa come si spendono i soldi pubblici dove abiti? | Sì, no | Bilancio e appalti del Comune più in dettaglio, raccolte firme in corso, Il Polpo legge per te |

Mai chiesti: nome, codice fiscale, indirizzo, data di nascita, email, importi esatti. Le fasce bastano per dire «probabile» o «da verificare», e il motore lo dice sempre.

Accanto a ogni domanda: «Perché te lo chiedo», una riga su cosa ci fa il Polpo con la risposta.

## Cosa compare dopo la prima risposta (il Comune)

Una scheda per riquadro: **un numero, un confronto, un'azione**. Esempio vero, Treviso (dati già nel repository):

| Riquadro | Dato chiave | Confronto | Azione |
|---|---|---|---|
| Rifiuti | Raccoglie Contarina | | Calendario, telefono; i tuoi diritti (ingombranti gratis una volta al mese) |
| Il bilancio del Comune | Paga i fornitori 9 giorni prima della scadenza | Debito 111 € per abitante; mediana dei Comuni da 60 a 100 mila abitanti 281 € | Apri il bilancio |
| Appalti del Comune | 84 affidamenti su 100 senza gara, il 20% del valore | Mediana dei Comuni simili: 22% del valore. Nessun segnale | Le gare con una sola offerta |
| Multe | Prefettura di Treviso, PEC pronta | | Controlla una multa |
| Uffici che non rispondono | Difensore civico del Veneto | | Scrivi un reclamo |
| Aiuti della Regione | 4 misure del Veneto in Mi spetta (più 24 nazionali) | Quante probabili lo dice la domanda 2 | Rispondi alla prossima domanda |
| Chiedere gli atti | PEC del Comune pronta | | Chiedi un documento |
| Una buca, un lampione | Chi interviene sulle strade del Comune, della Provincia e dell'ANAS in Veneto | | Segnala |

Regole per i confronti, come negli strumenti: sempre la mediana dei Comuni simili, mai giudizi; «segnale» solo quando lo strumento lo dà (oltre il 75° percentile), con la parola «segnale» e non «anomalia» o «sospetto».

## Come si ordina la scheda

Non per strumento, ma per quanto ti serve:

1. **Scadenze vicine** (una domanda di bonus che chiude, il ricorso a una multa che hai inserito): in cima, con il pulsante per il calendario.
2. **Soldi che puoi ricevere**: gli aiuti probabili, con l'importo.
3. **Diritti e contatti utili**: rifiuti, Prefettura, difensore civico, ASL.
4. **Come va il tuo Comune**: bilancio e appalti.

Ogni riquadro nuovo arriva con un'etichetta «nuovo» finché non lo apri. In fondo c'è sempre la prossima domanda, con l'anteprima di cosa aggiunge.

## Il ritorno

Alla seconda visita la scheda è già pronta. Se nel frattempo un dato è cambiato (nuovi aiuti regionali, il rendiconto dell'anno dopo, un altro gestore dei rifiuti, una scadenza che si avvicina), il riquadro lo dice: «cambiato dal 12 ottobre». È la ragione per tornare, ed è utile; niente notifiche, niente email.

## Gli altri strumenti la usano

Le risposte stanno in una sola chiave del browser, `polpo-profilo-v1`. Nel primo rilascio i pulsanti verso bilancio, appalti e rifiuti passano solo il Comune, nell'ancora dell'indirizzo (`#istat=…`, `#cf=…`), come già fanno fra loro bilancio e appalti: l'ancora non arriva al server e il Comune è un dato pubblico. Famiglia e ISEE non escono mai dalla pagina. Più avanti ogni strumento potrà leggere la chiave e precompilare quello che sa (la Regione e la famiglia in Mi spetta, la Prefettura in Faccio ricorso?), con la scritta «Ho usato il Comune della tua scheda. Cambia».

Anche lo Scrivano (Chiedi al Polpo) può partire dalla scheda, con il permesso della persona: «Uso le risposte della tua scheda?».

## Privacy, in pratica

- Le risposte restano sul dispositivo. Nessun server, come per il resto del sito.
- I dati del territorio arrivano da file statici per provincia: chi guarda i log del sito vede al massimo che qualcuno ha aperto il file di una provincia.
- Un pulsante «Cancella la mia scheda» toglie tutto, anche dagli altri strumenti.
- «Stampa o salva in PDF» per avere la scheda su carta.

## I dati da preparare

Un nuovo script, `scripts/per-te-dati.py`, scrive un file per provincia (`per-te/dati/p/XX.json`, pochi KB) con la sintesi di ogni Comune, presa dai dati che già ci sono:

- bilancio: anno, abitanti, fascia, tempestività dei pagamenti, debito per abitante, deficitario o no, numero di parametri fuori soglia, e le mediane della fascia;
- appalti: le quote principali (senza gara, una sola offerta, primo fornitore) con mediana e segnale sì o no, senza l'elenco delle gare;
- rifiuti: gestore e link del calendario;
- PEC del Comune, Prefettura, difensore civico della Regione.

I motori di Mi spetta, Faccio ricorso? e degli altri si importano come oggi fa lo Scrivano: niente regole copiate.

Due dati mancano:

- **Il Comune e la sua ASL.** IndicePA dà le PEC delle aziende sanitarie, non i Comuni che servono. Serve una fonte ufficiale con l'elenco (Ministero della Salute o le Regioni), da cercare e verificare; finché manca, il riquadro rimanda alla ricerca della ASL in La visita nei tempi.
- **Gli aeroporti vicini**: Mi rimborsano? li ha, ma senza le coordinate dei Comuni; basta la Regione, si fa con quello che c'è.

## Come calcola gli aiuti (primo rilascio)

Il motore di Mi spetta gira due volte, agli estremi delle fasce (età, età dei figli, ISEE): la prima con i valori più bassi, la seconda con i più alti.

- **Probabile**: spetta tutte e due le volte, oppure manca solo un dato che vale per quasi tutti (cittadinanza, anni di residenza, bolletta o TARI intestata): accanto c'è «Vale se: …».
- **Possibile**: manca anche un dato da confermare (redditi, risparmi, ISEE se non lo sai), al massimo tre; oppure spetta a un estremo della fascia e all'altro no.
- Fuori: tutto il resto, comprese le misure che dipendono da lavoro e casa, che Per te non chiede ancora.

## Dati da ricontrollare

L'indicatore di tempestività dei pagamenti dei rendiconti ha valori impossibili in 791 Comuni su 7.342 (da −23 milioni a +3,7 milioni di giorni): fuori dall'intervallo da −60 a +730 giorni né Per te né Il bilancio del mio Comune lo mostrano come dato.

## Server MCP

Un tool `scheda_comune` (Comune ed eventualmente le altre risposte) che restituisce gli stessi riquadri in testo, con le fonti, per gli assistenti AI.

## Misurare se funziona

Senza tracciamento non si contano le visite. Si può guardare solo da fuori: le issue «dato sbagliato» per Comune e le richieste dei file per provincia nelle statistiche di GitHub Pages, che non danno dati personali. Va bene così.

## Quanto costa farla

Stima del lavoro dell'assistente AI, non di una persona:

| Pezzo | Token | Tempo |
|---|---|---|
| Script dei dati per provincia e test | 60-80 mila | 30-40 minuti |
| Pagina, domande, ordinamento, «prossima domanda», test dei motori | 150-200 mila | 1,5-2 ore |
| Precompilazione negli altri strumenti, home, menu, MCP | 60-80 mila | 40-60 minuti |
| Verifica nel browser, telefono e tema scuro | 30-40 mila | 20-30 minuti |
| **Totale** | **300-400 mila** | **3-4 ore** |

Le domande da 1 a 3 sono il primo rilascio: da sole coprono rifiuti, bilancio, appalti, Prefettura, difensore civico e Mi spetta. Le domande da 4 a 8 vengono dopo.
