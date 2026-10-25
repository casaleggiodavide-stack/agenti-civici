// Le lettere di «Mi rimborsano?»: reclamo e messa in mora, o eccezione di
// prescrizione per le bollette. Campi mancanti evidenziati da completare.

import { esc } from './comune/interfaccia.js';
import { data, scritta } from './comune/date.js';
import { PER_CODICE } from './dati/aeroporti.js';

const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const v = (x, t) => (x === undefined || x === null || x === '' ? vuoto(t) : esc(String(x)));
const giorno = (s, t) => (s ? esc(scritta(data(s))) : vuoto(t));
const eur = (n) => `${Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const aeroporto = (c) => (PER_CODICE[c] ? `${PER_CODICE[c].nome} (${c})` : null);

const TITOLI = {
  compensazione_volo: 'Richiesta di compensazione pecuniaria ai sensi del Regolamento (CE) 261/2004 e messa in mora',
  bagaglio: 'Reclamo per bagaglio ai sensi dell\'art. 31 della Convenzione di Montreal e richiesta di risarcimento',
  treno: 'Richiesta di indennizzo per ritardo ai sensi dell\'art. 19 del Regolamento (UE) 2021/782',
  prescrizione: 'Eccezione di prescrizione biennale ai sensi dell\'art. 1, commi 4 e seguenti, della legge 205/2017',
  reclamo_bolletta: 'Reclamo scritto ai sensi del Testo integrato della qualità della vendita (ARERA)',
  telefono: 'Reclamo e richiesta di indennizzo ai sensi del Regolamento indennizzi AGCOM (delibera 347/18/CONS)',
  banca: 'Reclamo per operazione di pagamento non autorizzata ai sensi del d.lgs. 11/2010',
};

export const oggetto = (doc) => TITOLI[doc.tipo] || 'Reclamo e messa in mora';

function fatti(r, val) {
  if (r.caso === 'volo') {
    const tratta = `da ${v(aeroporto(r.da), 'aeroporto di partenza')} a ${v(aeroporto(r.a), 'destinazione finale')}`;
    const cosa = r.volo_tipo === 'ritardo'
      ? `è giunto alla destinazione finale con un ritardo di ${v(r.ritardo_ore?.toLocaleString('it-IT'), 'ore di ritardo')} ore rispetto all'orario previsto`
      : r.volo_tipo === 'cancellazione'
        ? `è stato cancellato, con comunicazione pervenuta ${r.preavviso_giorni === 0 ? 'il giorno stesso della partenza' : `${v(r.preavviso_giorni, 'giorni')} giorni prima della partenza`}${r.alternativa === true ? `; il volo alternativo offerto mi ha portato a destinazione con ${v(r.alt_ritardo_ore?.toLocaleString('it-IT'), 'ore')} ore di ritardo` : ''}`
        : 'non mi ha consentito l\'imbarco contro la mia volontà, benché mi fossi presentato all\'accettazione nei tempi previsti con prenotazione confermata';
    return `<p>Ero passeggero, con prenotazione confermata ${r.riferimento ? `n. ${esc(r.riferimento)}` : vuoto('codice di prenotazione')}, del volo ${v(r.numero_volo, 'numero del volo')} del ${giorno(r.data_volo, 'data del volo')}, ${tratta}. Il volo ${cosa}.</p>
      ${r.causa_volo && ['guasto', 'sciopero_vettore', 'ritardo_precedente', 'non_detta'].includes(r.causa_volo) ? '<p>Il motivo, per quanto comunicato, non costituisce una circostanza eccezionale ai sensi dell\'art. 5, par. 3, del Regolamento, come chiarito dalla Corte di giustizia dell\'Unione europea (cause C-402/07 e C-28/20). Resta comunque a vostro carico la prova di una circostanza eccezionale e di aver adottato tutte le misure del caso.</p>' : r.causa_volo ? '<p>Qualora riteniate che il disservizio sia dovuto a circostanze eccezionali, vi chiedo di fornirne prova documentale, unitamente alla prova di aver adottato tutte le misure del caso per evitarle (art. 5, par. 3, del Regolamento).</p>' : ''}`;
  }
  if (r.caso === 'bagaglio') {
    const cosa = { danneggiato: 'mi è stato riconsegnato danneggiato', ritardo: 'mi è stato consegnato in ritardo', smarrito: 'non mi è stato riconsegnato' }[r.bagaglio_tipo] || vuoto('che cosa è successo al bagaglio');
    return `<p>Il bagaglio registrato sul volo ${v(r.numero_volo, 'numero del volo')} arrivato il ${giorno(r.data_arrivo_volo, 'data di arrivo')} ${cosa}${r.data_bagaglio && r.bagaglio_tipo !== 'smarrito' ? ` (riconsegna del ${esc(scritta(data(r.data_bagaglio)))})` : ''}. ${r.pir === true ? `Ho compilato il rapporto di irregolarità (PIR) n. ${r.riferimento ? esc(r.riferimento) : vuoto('numero del PIR')}.` : ''}</p>`;
  }
  if (r.caso === 'treno') {
    return `<p>Ero passeggero, con biglietto ${r.riferimento ? `n. ${esc(r.riferimento)}` : vuoto('numero del biglietto')}, del treno ${vuoto('numero del treno e tratta')} del ${giorno(r.data_treno, 'data del viaggio')}, che ${r.soppresso ? 'è stato soppresso' : `è giunto a destinazione con ${v(r.ritardo_minuti, 'minuti')} minuti di ritardo`}. Il prezzo pagato per la tratta è stato di ${r.prezzo_treno ? eur(r.prezzo_treno) : vuoto('prezzo')}.</p>`;
  }
  if (r.caso === 'bolletta') {
    return `<p>Sono titolare della fornitura di ${esc(r.servizio || '')} con codice ${v(r.codice_fornitura, 'POD, PDR o codice cliente')}. Ho ricevuto la bolletta con scadenza ${giorno(r.scadenza_bolletta, 'scadenza')}${r.importo_bolletta ? `, di importo pari a ${eur(r.importo_bolletta)}` : ''}${r.consumi_dal ? `, che comprende consumi a partire dal ${esc(scritta(data(r.consumi_dal)))}` : ''}.</p>`;
  }
  if (r.caso === 'telefono') {
    const cosa = { interruzione: 'è completamente interrotto', malfunzionamento: 'funziona in modo irregolare e discontinuo', attivazione: 'non è stato attivato nei tempi previsti dal contratto', sospensione: 'è stato sospeso senza presupposti o senza preavviso', non_richiesti: 'comprende servizi che non ho mai richiesto', portabilita: 'non è stato trasferito nei tempi previsti', costi_recesso: 'prevede costi di recesso che contesto' }[r.disservizio] || vuoto('descrizione del disservizio');
    return `<p>Sono titolare della linea ${v(r.numero_linea, 'numero o codice cliente')}. Dal ${giorno(r.data_inizio, 'data di inizio')} il servizio ${cosa}${r.risolto === true && r.data_fine ? `, fino al ${esc(scritta(data(r.data_fine)))}` : r.risolto === false ? ', e il problema non è ancora risolto' : ''}.</p>`;
  }
  if (r.caso === 'banca') {
    return `<p>Sul mio conto o carta presso di voi è stata addebitata il ${giorno(r.data_addebito, 'data dell\'addebito')} un'operazione di ${r.importo_banca ? eur(r.importo_banca) : vuoto('importo')} che non ho autorizzato. ${r.bloccato === true ? 'L\'operazione è successiva alla mia richiesta di blocco dello strumento.' : ''} Ho sporto o sporgerò denuncia alle autorità.</p>`;
  }
  return '';
}

function richiesta(r, val) {
  const imp = val.importo?.valore;
  if (r.caso === 'volo') return `<p>Vi chiedo pertanto il pagamento della compensazione pecuniaria prevista dall'art. 7 del Regolamento (CE) 261/2004, pari a ${imp ? eur(imp) : vuoto('importo')}, in denaro${r.iban ? ` sul conto IBAN ${esc(r.iban)}` : ''}, oltre al rimborso delle spese documentate per pasti e alloggio non forniti (art. 9).</p>`;
  if (r.caso === 'bagaglio') return `<p>Vi chiedo il risarcimento del danno, pari a ${imp ? eur(imp) : vuoto('importo')} come da documentazione allegata, nei limiti dell'art. 22 della Convenzione di Montreal${r.iban ? `, sul conto IBAN ${esc(r.iban)}` : ''}.</p>`;
  if (r.caso === 'treno') return `<p>Vi chiedo l'indennizzo previsto dall'art. 19 del Regolamento (UE) 2021/782, pari a ${imp ? eur(imp) : vuoto('importo')}, in denaro${r.iban ? ` sul conto IBAN ${esc(r.iban)}` : ''}, entro un mese dalla presente.</p>`;
  if (r.caso === 'bolletta' && val.documento?.tipo === 'prescrizione') return '<p>Con la presente eccepisco la prescrizione biennale prevista dall\'art. 1, commi 4 e seguenti, della legge 205/2017 per gli importi relativi a consumi risalenti a più di due anni prima della scadenza della bolletta, che pertanto non pagherò. Vi chiedo di emettere una bolletta rettificata con i soli importi non prescritti e, se la fornitura è domiciliata, di non addebitare gli importi prescritti.</p>';
  if (r.caso === 'bolletta') return '<p>Vi chiedo la verifica e la rettifica della fatturazione, con risposta scritta motivata entro 30 giorni come previsto dal Testo integrato della qualità della vendita, e la sospensione di ogni azione di sollecito o di sospensione della fornitura fino alla definizione del reclamo.</p>';
  if (r.caso === 'telefono') return `<p>Vi chiedo ${r.disservizio === 'costi_recesso' ? 'lo storno dei costi di recesso non giustificati' : `la risoluzione del disservizio e il pagamento dell'indennizzo previsto dal Regolamento indennizzi AGCOM, pari a ${imp ? eur(imp) : vuoto('importo')}`}, oltre allo storno degli importi fatturati per il servizio non reso, con risposta scritta entro 45 giorni.</p>`;
  if (r.caso === 'banca') return `<p>Vi chiedo il rimborso immediato dell'importo di ${imp ? eur(imp) : vuoto('importo')}, al più tardi entro la fine della giornata operativa successiva, come previsto dall'art. 11 del d.lgs. 11/2010, ripristinando il conto nello stato in cui si sarebbe trovato e con valuta non successiva all'addebito. Resta a vostro carico la prova dell'autenticazione e di un'eventuale colpa grave (art. 10).</p>`;
  return '';
}

function seguito(r) {
  const vie = {
    volo: 'In mancanza di riscontro entro 15 giorni, mi rivolgerò all\'ENAC, all\'Autorità di regolazione dei trasporti per la conciliazione e, se necessario, all\'autorità giudiziaria.',
    bagaglio: 'In mancanza di riscontro entro 15 giorni, mi riservo di agire in giudizio.',
    treno: 'In mancanza di riscontro entro un mese, mi rivolgerò all\'Autorità di regolazione dei trasporti e chiederò la conciliazione.',
    bolletta: 'In mancanza di riscontro nei termini, attiverò il Servizio Conciliazione ARERA.',
    telefono: 'In mancanza di riscontro nei termini, presenterò istanza di conciliazione su ConciliaWeb.',
    banca: 'In mancanza di riscontro nei termini, presenterò ricorso all\'Arbitro Bancario Finanziario.',
  }[r.caso];
  return `<p>La presente vale come costituzione in mora ai sensi dell'art. 1219 del Codice civile e interrompe la prescrizione (art. 2943 c.c.). ${vie}</p>`;
}

/** La lettera completa, in HTML semplice. */
export function lettera(r, val) {
  const doc = val.documento;
  if (!doc) return '';
  return `
    <p>${v(r.nome, 'nome e cognome')}<br>${v(r.indirizzo, 'indirizzo')}<br>${v(r.recapito, 'email o PEC')}</p>
    <p style="text-align:right">Spett.le ${esc(doc.destinatario)}<br>Ufficio reclami</p>
    <p><b>Oggetto: ${esc(oggetto(doc))}</b></p>
    ${fatti(r, val)}
    ${richiesta(r, val)}
    ${seguito(r)}
    <p>Allego: ${r.caso === 'volo' ? 'biglietto, carta d\'imbarco, eventuali ricevute di spesa' : r.caso === 'bagaglio' ? 'PIR, talloncino del bagaglio, carta d\'imbarco, foto e ricevute' : r.caso === 'treno' ? 'biglietto' : r.caso === 'bolletta' ? 'copia della bolletta' : r.caso === 'banca' ? 'estratto conto, copia della denuncia' : 'copia delle fatture contestate'}, copia di un documento d'identità.</p>
    <p>${v(r.luogo, 'luogo')}, ${vuoto('data')}</p>
    <p>Firma ${vuoto('firma')}</p>`;
}
