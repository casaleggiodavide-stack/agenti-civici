// Regole di «Si è rotto o ci ho ripensato»: Codice del consumo (d.lgs. 206/2005) nel testo
// vigente al 25 ottobre 2026. Ogni regola cita l'articolo da cui viene.

import { data, iso, oggi as oggiDi, giorniTra, aggiungiGiorni } from './comune/date.js';

export const VERIFICATO = '2026-10-25';
const CC = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art';
export const FONTI = {
  art133: { titolo: 'Codice del consumo, art. 133: due anni di garanzia, 12 mesi in più con la riparazione, prescrizione in 26 mesi', url: `${CC}133` },
  art135: { titolo: 'Codice del consumo, art. 135: il difetto del primo anno si presume già presente alla consegna', url: `${CC}135` },
  art135bis: { titolo: 'Codice del consumo, art. 135-bis: riparazione, sostituzione, riduzione del prezzo o risoluzione', url: `${CC}135bis` },
  art135ter: { titolo: 'Codice del consumo, art. 135-ter: riparazione e sostituzione gratuite, in tempi ragionevoli', url: `${CC}135ter` },
  art127q: { titolo: 'Codice del consumo, art. 127-quinquies: obbligo di riparazione del fabbricante', url: `${CC}127quinquies` },
  art52: { titolo: 'Codice del consumo, art. 52: 14 giorni per recedere dai contratti a distanza o fuori dei locali', url: `${CC}52` },
  art53: { titolo: 'Codice del consumo, art. 53: se non ti hanno informato, 12 mesi in più', url: `${CC}53` },
  art54bis: { titolo: 'Codice del consumo, art. 54-bis: la funzione «recedere dal contratto qui»', url: `${CC}54bis` },
  art56: { titolo: 'Codice del consumo, art. 56: rimborso entro 14 giorni dal recesso', url: `${CC}56` },
  art57: { titolo: 'Codice del consumo, art. 57: restituzione entro 14 giorni', url: `${CC}57` },
  art59: { titolo: 'Codice del consumo, art. 59: i casi senza diritto di recesso', url: `${CC}59` },
  eccnet: { titolo: 'Centro europeo consumatori Italia (ECC-Net): acquisti in un altro Paese dell\'Unione', url: 'https://www.ecc-netitalia.it/' },
  agcm: { titolo: 'Autorità garante della concorrenza e del mercato: segnalazioni dei consumatori', url: 'https://www.agcm.it/segnalazioni/' },
};

// Beni con obbligo di riparazione del fabbricante: le categorie della direttiva (UE) 2024/1799,
// richiamate dall'allegato II-decies del Codice del consumo (elenco italiano da ricontrollare).
export const RIPARABILI = new Set(['lavatrice', 'lavastoviglie', 'frigorifero', 'asciugatrice', 'aspirapolvere', 'telefono', 'schermo', 'batteria', 'server', 'saldatrice']);

/** Aggiunge mesi a una data, fermandosi all'ultimo giorno del mese se serve. */
export function piuMesi(d, n) {
  const x = new Date(d);
  const giorno = x.getUTCDate();
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + n);
  const ultimo = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0, 12)).getUTCDate();
  x.setUTCDate(Math.min(giorno, ultimo));
  return x;
}

const lungo = (d) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function valuta(r, opz = {}) {
  const oggi = oggiDi(opz.oggi);
  const scadenze = [];
  const voci = [];
  const passi = [];
  const fonti = [];
  let documento = null;
  let verdetto;
  const usa = (...k) => k.forEach((x) => { if (FONTI[x] && !fonti.includes(FONTI[x])) fonti.push(FONTI[x]); });
  const scad = (d, titolo, testo) => d && scadenze.push({ data: iso(d), titolo, testo, scaduta: d < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, d)) });
  const esito = (o) => ({ verdetto: o, voci, scadenze: scadenze.sort((a, b) => a.data.localeCompare(b.data)), passi, fonti, documento });

  if (!r.caso) return esito({ tono: 'dato', titolo: 'Scegli che cosa ti serve', testo: 'Un oggetto che si è rotto, un acquisto su cui hai cambiato idea o un rimborso che non arriva: le regole e i tempi sono diversi.' });
  if (!r.venditore) return esito({ tono: 'dato', titolo: 'Da chi l\'hai comprato?', testo: 'La garanzia e il recesso del Codice del consumo valgono solo quando compri da un\'azienda o da un professionista.' });
  if (r.venditore === 'privato') {
    passi.push({ titolo: 'Parla con chi te l\'ha venduto', testo: 'Tra privati valgono le regole generali del codice civile sulla vendita, con termini brevi per segnalare i difetti: scrivi subito al venditore e conserva l\'annuncio e i messaggi. Per un consiglio, rivolgiti a un\'associazione dei consumatori.' });
    return esito({ tono: 'no', titolo: 'Tra privati il Codice del consumo non si applica', testo: 'Garanzia legale di due anni e recesso di 14 giorni valgono solo quando il venditore è un professionista. Su un sito di annunci tra persone, il venditore di solito è un privato.' });
  }
  const contratto = data(r.data_contratto);
  const bene = r.tipo !== 'servizio' && r.tipo !== 'digitale';
  const consegna = bene ? data(r.data_consegna) : contratto;
  if (contratto && contratto < data('2022-01-01')) {
    voci.push({ esito: 'forse', titolo: 'Contratto prima del 2022', spiegazione: 'Per i contratti conclusi fino al 31 dicembre 2021 valgono le regole precedenti, tra cui la denuncia del difetto entro due mesi dalla scoperta: questo strumento non le calcola.' });
    usa('art133');
    return esito({ tono: 'forse', titolo: 'Regole precedenti al 2022', testo: 'Il tuo contratto è anteriore al 1° gennaio 2022: valgono le regole di allora. Rivolgiti a un\'associazione dei consumatori per i termini esatti.' });
  }

  // ---------- Il difetto ----------
  if (r.caso === 'difetto') {
    usa('art133', 'art135', 'art135bis', 'art135ter');
    if (!consegna) {
      voci.push({ esito: 'dato', titolo: 'La data di consegna', spiegazione: 'La garanzia dura due anni dalla consegna: serve quella data.', dato: bene ? 'data_consegna' : 'data_contratto' });
      return esito({ tono: 'dato', titolo: 'Quando l\'hai ricevuto?', testo: 'Dalla data di consegna dipende se sei ancora in garanzia.' });
    }
    const ridotta = r.usato === true && r.garanzia_ridotta === true;
    const fine = piuMesi(consegna, ridotta ? 12 : 24);
    const prescrizione = piuMesi(consegna, ridotta ? 12 : 26);
    const estendibile = contratto && contratto >= data('2026-07-31');
    const comparso = data(r.data_difetto) || oggi;
    const inGaranzia = comparso <= fine;
    const presunto = comparso <= piuMesi(consegna, 12);

    voci.push({ esito: inGaranzia ? 'si' : 'no', titolo: inGaranzia ? `In garanzia fino al ${lungo(fine)}` : `Garanzia del venditore finita il ${lungo(fine)}`, spiegazione: ridotta ? 'Usato con garanzia ridotta a un anno dal contratto: vale se la clausola è scritta nel contratto.' : 'Il venditore risponde dei difetti che si manifestano entro due anni dalla consegna.' });
    if (inGaranzia) {
      voci.push({ esito: presunto ? 'si' : 'forse', titolo: presunto ? 'Non devi provare che il difetto c\'era già' : 'Dopo il primo anno la prova tocca a te', spiegazione: presunto ? 'Un difetto comparso entro un anno dalla consegna si presume presente fin dall\'inizio: è il venditore a dover dimostrare il contrario.' : 'Il difetto è comparso dopo un anno dalla consegna: se il venditore contesta, dovrai dimostrare che non dipende dall\'uso, per esempio con una perizia o una scheda del centro assistenza.' });
      if (estendibile && r.rimedio === 'riparazione') voci.push({ esito: 'si', titolo: 'Con la riparazione, 12 mesi di garanzia in più', spiegazione: `Per i contratti dal 31 luglio 2026, se scegli la riparazione la responsabilità del venditore si allunga una volta di 12 mesi: fino al ${lungo(piuMesi(fine, 12))}.` });
      else if (!estendibile && r.rimedio === 'riparazione') voci.push({ esito: 'forse', titolo: 'Niente estensione di 12 mesi', spiegazione: 'L\'estensione dopo la riparazione vale solo per i contratti conclusi dal 31 luglio 2026.' });
      if (r.usato === true && r.garanzia_ridotta === 'non_so') voci.push({ esito: 'dato', titolo: 'Garanzia ridotta?', spiegazione: 'Controlla il contratto: per l\'usato la garanzia può essere ridotta a un anno, solo se è scritto.', dato: 'garanzia_ridotta' });
      scad(estendibile && r.rimedio === 'riparazione' ? piuMesi(fine, 12) : fine, 'Fine della garanzia del venditore', 'Entro questa data il difetto deve manifestarsi.');
      scad(prescrizione, 'Prescrizione', ridotta ? 'Termine per far valere la garanzia, ridotto a un anno come la garanzia.' : 'Termine per far valere la garanzia, anche davanti al giudice: 26 mesi dalla consegna. Una lettera scritta lo interrompe.');

      const secondo = r.gia_riparato === true || (r.grave === true && ['riduzione', 'risoluzione'].includes(r.rimedio));
      if (['riduzione', 'risoluzione'].includes(r.rimedio) && !secondo) {
        voci.push({ esito: 'forse', titolo: 'Prima si chiede riparazione o sostituzione', spiegazione: 'Sconto o restituzione si possono chiedere se riparazione e sostituzione sono impossibili, non avvengono in tempi ragionevoli, il difetto si ripresenta o è così grave da giustificarlo. Per un difetto lieve non si può risolvere il contratto.' });
      }
      documento = { tipo: secondo ? 'riduzione' : 'denuncia', rimedio: secondo ? (r.rimedio === 'riduzione' ? 'riduzione' : 'risoluzione') : (r.rimedio === 'sostituzione' ? 'sostituzione' : 'riparazione'), fine: iso(fine), presunto };
      const ricontrolla = aggiungiGiorni(oggi, 30);
      scad(ricontrolla, 'Ricontrolla la riparazione', 'Promemoria, non un termine di legge: la riparazione o la sostituzione vanno fatte in un tempo ragionevole. Se non arrivano, puoi chiedere lo sconto o la restituzione.');
      passi.push({ titolo: 'Scrivi al venditore', testo: 'Non al produttore: la garanzia legale è del venditore, anche se ti rimanda all\'assistenza della marca. Manda la lettera per email, PEC o raccomandata e tieni la ricevuta.' });
      passi.push({ titolo: 'Allega lo scontrino o la fattura', testo: 'Basta la prova d\'acquisto con la data: anche l\'estratto conto o l\'email di conferma dell\'ordine.' });
      passi.push({ titolo: 'Se ti dicono di no', testo: 'Rivolgiti a un\'associazione dei consumatori o a una conciliazione; per acquisti da un venditore di un altro Paese dell\'Unione c\'è il Centro europeo consumatori. Se il venditore nega la garanzia legale, puoi segnalarlo all\'Autorità garante della concorrenza e del mercato.' });
      usa('eccnet', 'agcm');
      return esito({ tono: 'si', titolo: secondo ? 'Puoi chiedere lo sconto o la restituzione' : `Il venditore deve ${documento.rimedio === 'sostituzione' ? 'sostituirlo' : 'ripararlo'} gratis`, testo: `Sei in garanzia fino al ${lungo(fine)}. ${presunto ? 'Il difetto è del primo anno: non devi provare che c\'era già.' : 'Il difetto è comparso dopo il primo anno: se contestano, la prova tocca a te.'} La lettera è pronta.` });
    }
    // fuori garanzia: obbligo del fabbricante
    if (bene && RIPARABILI.has(r.categoria)) {
      usa('art127q');
      documento = { tipo: 'fabbricante' };
      voci.push({ esito: 'si', titolo: 'Il fabbricante deve ripararlo', spiegazione: 'Per questi oggetti, finita la garanzia del venditore, il fabbricante deve ripararli su richiesta, gratis o a un prezzo ragionevole, in tempi ragionevoli.' });
      passi.push({ titolo: 'Scrivi al fabbricante', testo: 'Cerca sul sito della marca il servizio di riparazione e l\'indirizzo per i reclami; chiedi un preventivo scritto.' });
      return esito({ tono: 'forse', titolo: 'Garanzia finita, ma il fabbricante deve ripararlo', testo: `La garanzia del venditore è finita il ${lungo(fine)}. Per questo tipo di oggetto il fabbricante deve offrirti la riparazione a un prezzo ragionevole.` });
    }
    if (bene && !r.categoria) voci.push({ esito: 'dato', titolo: 'Che oggetto è?', spiegazione: 'Per alcuni oggetti (elettrodomestici, telefoni, schermi) il fabbricante deve ripararli anche dopo la garanzia.', dato: 'categoria' });
    return esito({ tono: 'no', titolo: 'Garanzia del venditore finita', testo: `La garanzia legale è finita il ${lungo(fine)}. Controlla se hai una garanzia commerciale della marca, scritta nel libretto: è in più rispetto a quella di legge.` });
  }

  // ---------- Il ripensamento ----------
  usa('art52', 'art59', 'art56', 'art57');
  if (!r.dove) return esito({ tono: 'dato', titolo: 'Dove hai fatto il contratto?', testo: 'Il diritto di ripensarci vale per gli acquisti online, per telefono e fuori dal negozio.' });
  if (r.dove === 'negozio' && r.caso === 'ripensamento') {
    passi.push({ titolo: 'Chiedi al negozio la sua politica di reso', testo: 'Molti negozi accettano cambi o resi per scelta commerciale, spesso con un buono: le condizioni sono quelle scritte sullo scontrino o esposte alla cassa.' });
    return esito({ tono: 'no', titolo: 'In negozio non c\'è un diritto di ripensamento', testo: 'Il recesso di 14 giorni vale per gli acquisti online, per telefono o fuori dal negozio. In negozio puoi restituire solo se il venditore lo prevede, oppure se l\'oggetto è difettoso.' });
  }
  if (r.caso === 'ripensamento') {
    if (r.eccezione && r.eccezione !== 'nessuna') {
      return esito({ tono: 'no', titolo: 'In questo caso il recesso non c\'è', testo: 'La legge esclude il ripensamento per oggetti su misura, deperibili, sigillati e aperti, biglietti per il tempo libero in una data precisa e servizi o contenuti digitali già forniti con il tuo consenso.' });
    }
    const inizio = bene ? consegna : contratto;
    if (!inizio) {
      voci.push({ esito: 'dato', titolo: bene ? 'La data di consegna' : 'La data del contratto', spiegazione: bene ? 'Per gli oggetti i 14 giorni partono dalla consegna.' : 'Per i servizi i 14 giorni partono dal contratto.', dato: bene ? 'data_consegna' : 'data_contratto' });
      return esito({ tono: 'dato', titolo: 'Da quando contare i giorni?', testo: 'Indica la data e calcolo la scadenza.' });
    }
    const giorni = r.dove === 'visita' ? 30 : 14;
    let fine = aggiungiGiorni(inizio, giorni);
    if (r.informato === false) {
      usa('art53');
      fine = piuMesi(fine, 12);
      voci.push({ esito: 'si', titolo: 'Non ti hanno informato: 12 mesi in più', spiegazione: `Se il venditore non ti ha informato del diritto di recesso, il termine si allunga di 12 mesi: fino al ${lungo(fine)}. Se ti informa più tardi, hai 14 giorni da quel momento.` });
    } else if (r.informato === 'non_so') voci.push({ esito: 'dato', titolo: 'Ti hanno informato?', spiegazione: 'Se il venditore non ti ha informato per iscritto del diritto di recesso, hai 12 mesi in più.', dato: 'informato' });
    if (r.funzione === false && r.dove === 'distanza') {
      usa('art54bis', 'agcm');
      voci.push({ esito: 'forse', titolo: 'Manca il pulsante per recedere', spiegazione: 'Dal 19 giugno 2026 i siti devono offrire la funzione «recedere dal contratto qui». Puoi recedere lo stesso con una dichiarazione esplicita per email o PEC, e segnalare il sito all\'Autorità garante della concorrenza e del mercato.' });
    }
    const aperto = fine >= oggi;
    scad(fine, 'Ultimo giorno per recedere', 'Basta mandare la dichiarazione entro questa data, anche se l\'oggetto arriva dopo. Meglio non aspettare l\'ultimo giorno.');
    if (aperto) {
      scad(aggiungiGiorni(oggi, 14), 'Restituisci l\'oggetto', 'Se mandi il recesso oggi: hai 14 giorni per rispedirlo. Paghi solo la spedizione di ritorno, se il venditore ti aveva avvisato.');
      scad(aggiungiGiorni(oggi, 14), 'Il rimborso deve arrivare', 'Se mandi il recesso oggi: 14 giorni per rimborsarti tutto, consegna compresa, con lo stesso mezzo di pagamento. Il venditore può aspettare di ricevere l\'oggetto o la prova della spedizione.');
      documento = { tipo: 'recesso', fine: iso(fine) };
      passi.push({ titolo: 'Usa il pulsante del sito o la lettera', testo: 'Se il sito ha la funzione «recedere dal contratto qui», usala e conserva la conferma. Altrimenti manda la lettera per email o PEC: non serve spiegare il motivo.' });
      passi.push({ titolo: 'Spedisci e conserva la ricevuta', testo: 'La ricevuta della spedizione è la prova che serve per pretendere il rimborso.' });
    }
    return esito({ tono: aperto ? 'si' : 'no', titolo: aperto ? `Puoi recedere fino al ${lungo(fine)}` : `Il termine per recedere è scaduto il ${lungo(fine)}`, testo: aperto ? 'Non serve dare un motivo e non ci sono penali. La dichiarazione di recesso è pronta.' : 'Puoi ancora chiedere al venditore un reso per cortesia commerciale. Se l\'oggetto è difettoso, vale la garanzia di due anni: scegli «Si è rotto».' });
  }

  // ---------- Il rimborso che non arriva ----------
  const comunicato = data(r.data_recesso);
  if (!comunicato) {
    voci.push({ esito: 'dato', titolo: 'La data del recesso', spiegazione: 'Il rimborso è dovuto entro 14 giorni da quando hai comunicato il recesso.', dato: 'data_recesso' });
    return esito({ tono: 'dato', titolo: 'Quando hai comunicato il recesso?', testo: 'Da quella data contano i 14 giorni per il rimborso.' });
  }
  const dovuto = aggiungiGiorni(comunicato, 14);
  const reso = data(r.data_reso);
  scad(dovuto, 'Termine per il rimborso', 'Il venditore doveva rimborsarti tutto, consegna compresa, entro 14 giorni dalla comunicazione del recesso.');
  if (bene && !reso) voci.push({ esito: 'dato', titolo: 'Hai rispedito l\'oggetto?', spiegazione: 'Il venditore può aspettare di ricevere l\'oggetto, o la prova che l\'hai spedito, prima di rimborsare.', dato: 'data_reso' });
  if (dovuto < oggi) {
    documento = { tipo: 'diffida', dovuto: iso(dovuto) };
    scad(aggiungiGiorni(oggi, 15), 'Ricontrolla il rimborso', 'Promemoria: se dopo la diffida il rimborso non arriva, rivolgiti a un\'associazione dei consumatori o, per un venditore di un altro Paese dell\'Unione, al Centro europeo consumatori.');
    usa('eccnet');
    return esito({ tono: 'si', titolo: 'Il rimborso è in ritardo', testo: `Doveva arrivare entro il ${lungo(dovuto)}. La diffida è pronta: chiede il rimborso entro un termine breve.` });
  }
  return esito({ tono: 'forse', titolo: `Il rimborso deve arrivare entro il ${lungo(dovuto)}`, testo: 'Il termine non è ancora scaduto. Ti ricordiamo noi la data: se passa senza rimborso, qui trovi la diffida.' });
}
