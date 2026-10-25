// Le lettere di «Reclami alla PA e difensore civico». I campi mancanti restano
// evidenziati, da completare.

import { esc } from './comune/interfaccia.js';
import { data } from './comune/date.js';

const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const v = (x, t) => (x === undefined || x === null || x === '' ? vuoto(t) : esc(String(x)));
const giorno = (s, t) => (s ? esc(data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })) : vuoto(t));

const TITOLI = {
  sollecito: 'Sollecito e richiesta di informazioni sullo stato della pratica',
  reclamo: 'Reclamo',
  sanita: 'Reclamo ai sensi dell\'art. 14, comma 5, del d.lgs. 502/1992',
  digitale: 'Segnalazione di malfunzionamento di un servizio digitale',
  privacy: 'Richiesta al Responsabile della protezione dei dati',
  sostitutivo: 'Richiesta di intervento del titolare del potere sostitutivo ai sensi dell\'art. 2, comma 9-ter, della legge 241/1990',
  difensore: 'Istanza di intervento del Difensore civico',
  osservazioni: 'Osservazioni ai sensi dell\'art. 10-bis della legge 241/1990',
};

export function oggetto(r, val) {
  const d = val.documento || {};
  const t = d.tipo === 'reclamo' ? TITOLI[d.variante] || TITOLI.reclamo : TITOLI[d.tipo] || 'Reclamo';
  return `${t}${r.protocollo ? ` (pratica n. ${r.protocollo})` : ''}`;
}

/** Destinatario della lettera: nome e PEC. */
export function destinatario(r, val) {
  const d = val.documento || {};
  const e = r.ente;
  if (d.tipo === 'difensore') {
    const dc = val.difensore;
    return { nome: dc?.ufficio || 'Difensore civico regionale', pec: dc?.pec || null };
  }
  const presso = {
    sostitutivo: 'Al titolare del potere sostitutivo',
    reclamo: d.variante === 'sanita' ? 'Al Direttore generale, tramite l\'Ufficio relazioni con il pubblico' : d.variante === 'privacy' ? 'Al Responsabile della protezione dei dati' : 'All\'Ufficio relazioni con il pubblico',
    osservazioni: 'Al responsabile del procedimento',
  }[d.tipo] || '';
  return { nome: e ? `${e.nome}${presso ? `, ${presso.charAt(0).toLowerCase() + presso.slice(1)}` : ''}${r.ufficio ? `, ${r.ufficio}` : ''}` : null, pec: e?.pec || null };
}

const testa = (r, val) => {
  const d = destinatario(r, val);
  return `<p class="destra">Spett.le ${d.nome ? esc(d.nome) : vuoto('ente e ufficio')}<br>PEC: ${d.pec ? esc(d.pec) : vuoto('indirizzo PEC')}</p>
    <p class="oggetto">Oggetto: ${esc(oggetto(r, val))}</p>`;
};
const chi = (r) => `Il sottoscritto ${v(r.nome, 'nome e cognome')}, recapito ${v(r.recapito, 'PEC o email')},`;
const firma = (r) => `<p>${v(r.comune_firma, 'luogo')}, ${vuoto('data')}</p><p class="destra">${v(r.nome, 'nome e cognome')}<br>${vuoto('firma')}</p>`;
const fatti = (r) => (r.cosa_chiesto ? esc(r.cosa_chiesto) : vuoto('cosa hai chiesto o cosa è successo, con date e numeri di protocollo'));

export function lettera(r, val) {
  const d = val.documento || {};
  if (d.tipo === 'sostitutivo') {
    return `${testa(r, val)}
      <p>${chi(r)} premesso che in data ${giorno(r.data_domanda, 'data della domanda')} ha presentato la seguente domanda${r.protocollo ? ` (protocollo n. ${esc(r.protocollo)})` : ''}: ${fatti(r)};</p>
      <p>che il termine per la conclusione del procedimento, pari a ${esc(String(d.termine))} giorni, è scaduto il ${giorno(d.fine)} senza che sia stato adottato il provvedimento;</p>
      <p>CHIEDE</p>
      <p>l'intervento del titolare del potere sostitutivo, affinché concluda il procedimento entro la metà del termine originariamente previsto, come stabilisce l'art. 2, comma 9-ter, della legge 241/1990.</p>
      ${d.indennizzo ? '<p>Trattandosi di un procedimento relativo all\'avvio o all\'esercizio di un\'attività d\'impresa, chiede altresì la corresponsione dell\'indennizzo per il mero ritardo previsto dall\'art. 28 del decreto-legge 69/2013, pari a 30 euro per ogni giorno di ritardo fino a un massimo di 2.000 euro.</p>' : ''}
      <p>Chiede infine di conoscere il nome del responsabile del procedimento. In mancanza di riscontro si riserva di rivolgersi al difensore civico e al giudice amministrativo.</p>
      ${firma(r)}`;
  }
  if (d.tipo === 'difensore') {
    return `${testa(r, val)}
      <p>${chi(r)} chiede l'intervento del Difensore civico nei confronti di ${r.ente ? esc(r.ente.nome) : vuoto('ente')}${r.ufficio ? `, ${esc(r.ufficio)}` : ''}, per i seguenti fatti: ${fatti(r)}.</p>
      ${r.data_domanda ? `<p>La domanda è stata presentata il ${giorno(r.data_domanda)}${r.protocollo ? ` (protocollo n. ${esc(r.protocollo)})` : ''}.</p>` : ''}
      <p>In data ${giorno(r.data_invio, 'data')} il sottoscritto ha inviato ${r.passo === 'sostitutivo' ? 'la richiesta di intervento al titolare del potere sostitutivo' : 'un reclamo all\'ufficio'}, ${r.risposta === 'parziale' ? 'ricevendo una risposta che non risolve il problema' : 'senza ricevere risposta'}.</p>
      <p>Chiede pertanto che il Difensore civico intervenga presso l'amministrazione per ottenere la conclusione della pratica o la soluzione del problema, e di essere informato sull'esito.</p>
      <p>Allega copia della corrispondenza e delle ricevute di invio.</p>
      ${firma(r)}`;
  }
  if (d.tipo === 'osservazioni') {
    return `${testa(r, val)}
      <p>${chi(r)} con riferimento alla comunicazione dei motivi ostativi all'accoglimento della domanda${r.protocollo ? ` n. ${esc(r.protocollo)}` : ''}, ricevuta il ${giorno(r.data_preavviso, 'data della comunicazione')}, presenta entro il termine di 10 giorni le seguenti osservazioni:</p>
      <p>${vuoto('le tue osservazioni: perché i motivi indicati non sono corretti, con i documenti che lo dimostrano')}</p>
      <p>Chiede che le osservazioni siano valutate e che, in caso di mancato accoglimento, il provvedimento finale ne indichi le ragioni, come prevede l'art. 10-bis della legge 241/1990.</p>
      <p>Allega: ${vuoto('elenco dei documenti')}.</p>
      ${firma(r)}`;
  }
  // reclamo e sue varianti
  const variante = d.variante;
  const richiesta = {
    sollecito: `chiede di conoscere lo stato della pratica, il nome del responsabile del procedimento e il termine entro cui sarà concluso${r.data_domanda ? `, considerato che la domanda è stata presentata il ${giorno(r.data_domanda)}` : ''}.`,
    sanita: 'presenta reclamo contro l\'atto o il comportamento descritto, che ha negato o limitato una prestazione sanitaria, e chiede che il Direttore generale decida entro 15 giorni, come previsto dalla legge.',
    digitale: 'segnala il malfunzionamento descritto e chiede che il servizio sia reso disponibile e accessibile nel rispetto del Codice dell\'amministrazione digitale. In mancanza di soluzione si riserva di segnalare il caso al Difensore civico per il digitale presso AgID.',
    privacy: 'chiede di sapere quali dati personali che lo riguardano sono trattati, per quali finalità e da chi, e di porre rimedio al trattamento descritto, ai sensi degli articoli 15 e seguenti del Regolamento (UE) 2016/679. In mancanza di risposta entro un mese si riserva di presentare reclamo al Garante per la protezione dei dati personali.',
  }[variante] || 'presenta reclamo per quanto descritto e chiede una risposta scritta che indichi le misure adottate, il nome del responsabile e i tempi.';
  return `${testa(r, val)}
    <p>${chi(r)} ${variante === 'sollecito' ? 'in relazione alla seguente domanda' : 'con riferimento ai seguenti fatti'}${r.data_fatto ? `, avvenuti o conosciuti il ${giorno(r.data_fatto)}` : ''}: ${fatti(r)}${r.protocollo ? ` (protocollo n. ${esc(r.protocollo)})` : ''},</p>
    <p>${richiesta}</p>
    <p>Chiede inoltre ricevuta con numero di protocollo della presente.</p>
    ${firma(r)}`;
}
