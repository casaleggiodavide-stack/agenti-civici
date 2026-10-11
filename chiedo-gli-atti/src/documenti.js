// I documenti di «Chiedo gli atti»: la richiesta (generalizzata, semplice o
// documentale), il riesame, il ricorso al difensore civico o alla Commissione
// per l'accesso, la richiesta al titolare del potere sostitutivo.

import { data, scrittaBreve, oggi as oggiCal } from './comune/date.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const campo = (v, segnaposto) => (v ? esc(v) : vuoto(segnaposto));
const paragrafi = (t) => esc(t).split(/\n+/).filter(Boolean).join('</p><p>');

function richiedente(r) {
  return `Il/La sottoscritto/a ${campo(r.nome, 'nome e cognome')}, nato/a a ${campo(r.nascita, 'luogo e data di nascita')}, residente in ${campo(r.residenza, 'indirizzo di residenza')}, recapito per le comunicazioni ${campo(r.recapito, 'PEC o email')}${r.telefono ? `, telefono ${esc(r.telefono)}` : ''},`;
}

function destinatario(v, a) {
  const e = v.ente;
  return `<p class="destra">${e ? esc(e.nome) : vuoto('ente')}<br>${esc(a || v.destinatario)}${e?.pec ? `<br>PEC: ${esc(e.pec)}` : ''}</p>`;
}

function firma(r) {
  const allegato = r.canale === 'email' ? '<p>Allegato: copia del documento d\'identità.</p>' : '';
  return `${allegato}<p>${campo(r.luogo, 'luogo')}, ${esc(scrittaBreve(oggiCal()))}</p><p class="destra">Firma<br>${r.nome ? esc(r.nome) : vuoto('firma')}</p>`;
}

function oggettoRichiesta(r) {
  const cosa = r.cosa ? paragrafi(r.cosa) : vuoto('descrivi i documenti o i dati richiesti');
  return `<p>${cosa}</p>${r.periodo ? `<p>Periodo di riferimento: ${esc(r.periodo)}.</p>` : ''}`;
}

function formato(r) {
  if (r.formato === 'aperto') return 'Chiede di ricevere i dati in formato elettronico aperto e lavorabile (CSV, XLSX od ODS), ove disponibili in tale formato.';
  if (r.formato === 'pdf') return 'Chiede di ricevere copia dei documenti in formato elettronico (PDF).';
  return 'Chiede di ricevere i documenti e i dati in formato elettronico.';
}

export function richiesta(r, v) {
  const tipo = v.tipo.id;
  if (tipo === 'semplice') {
    return `${destinatario(v)}
      <p class="oggetto">Oggetto: richiesta di accesso civico ai sensi dell'art. 5, comma 1, del d.lgs. 14 marzo 2013, n. 33.</p>
      <p>${richiedente(r)}</p>
      <p>considerato che i seguenti documenti, dati o informazioni sono oggetto di pubblicazione obbligatoria e non risultano pubblicati nella sezione «Amministrazione trasparente» del sito istituzionale:</p>
      ${oggettoRichiesta(r)}
      <p><b>chiede</b> la loro pubblicazione e la comunicazione del collegamento ipertestuale alla pagina in cui sono pubblicati, ai sensi dell'art. 5, comma 6, del d.lgs. 33/2013, entro trenta giorni dalla presente.</p>
      <p>Chiede che le comunicazioni siano inviate a ${campo(r.recapito, 'PEC o email')}.</p>
      ${firma(r)}`;
  }
  if (tipo === 'documentale') {
    return `${destinatario(v)}
      <p class="oggetto">Oggetto: richiesta di accesso ai documenti amministrativi ai sensi degli artt. 22 e seguenti della legge 7 agosto 1990, n. 241 e del DPR 12 aprile 2006, n. 184.</p>
      <p>${richiedente(r)}</p>
      <p><b>chiede</b> di prendere visione e di estrarre copia dei seguenti documenti amministrativi:</p>
      ${oggettoRichiesta(r)}
      <p>A tal fine dichiara di avere un interesse diretto, concreto e attuale, corrispondente a una situazione giuridicamente tutelata e collegata ai documenti richiesti, per i seguenti motivi:</p>
      <p>${r.interesse ? paragrafi(r.interesse) : vuoto('spiega perché i documenti ti riguardano e a cosa ti servono')}</p>
      <p>${formato(r)} Ricorda che l'amministrazione deve concludere il procedimento entro trenta giorni (art. 25, comma 4, della legge 241/1990).</p>
      <p>Chiede che le comunicazioni siano inviate a ${campo(r.recapito, 'PEC o email')}.</p>
      ${firma(r)}`;
  }
  const amb = r.ambiente === true;
  return `${destinatario(v)}
    <p class="oggetto">Oggetto: richiesta di accesso civico generalizzato ai sensi dell'art. 5, comma 2, del d.lgs. 14 marzo 2013, n. 33${amb ? ' e dell\'art. 3 del d.lgs. 19 agosto 2005, n. 195' : ''}.</p>
    <p>${richiedente(r)}</p>
    <p><b>chiede</b>, ai sensi dell'art. 5, comma 2, del d.lgs. 33/2013${amb ? ' e, trattandosi di informazioni ambientali, dell\'art. 3 del d.lgs. 195/2005' : ''}, di ricevere i seguenti documenti e dati:</p>
    ${oggettoRichiesta(r)}
    <p>${formato(r)}</p>
    ${r.dati_personali === true ? '<p>Ove i documenti contengano dati personali di terzi, chiede l\'accesso parziale con l\'oscuramento di tali dati, ai sensi dell\'art. 5-bis, comma 4, del d.lgs. 33/2013.</p>' : ''}
    <p>Ricorda che l'amministrazione deve provvedere con atto espresso e motivato entro trenta giorni (art. 5, comma 6) e che, se ritenesse la richiesta non sufficientemente precisa, è tenuta a invitare il richiedente a precisarla prima di dichiararla inammissibile, come indicato dalla circolare del Ministro per la pubblica amministrazione n. 2/2017.</p>
    <p>Chiede che la risposta sia inviata a ${campo(r.recapito, 'PEC o email')}.</p>
    ${firma(r)}`;
}

function riferimentoRichiesta(r) {
  return `la richiesta di accesso ${r.data_invio ? `presentata il ${esc(scrittaBreve(data(r.data_invio)))}` : vuoto('data della richiesta')}${r.ente ? ` a ${esc(r.ente.nome)}` : ''}, avente a oggetto: «${esc((r.cosa || '').slice(0, 300))}${(r.cosa || '').length > 300 ? '…' : ''}»`;
}

function esitoPrimaIstanza(r) {
  if (r.risposta === 'nessuna' || !r.risposta) return 'alla quale l\'amministrazione non ha dato risposta nel termine di trenta giorni previsto dall\'art. 5, comma 6, del d.lgs. 33/2013';
  const quando = r.data_risposta ? ` con comunicazione del ${esc(scrittaBreve(data(r.data_risposta)))}` : '';
  const come = { parziale: 'ha accolto solo in parte', respinta: 'ha respinto', inammissibile: 'ha dichiarato inammissibile', differita: 'ha differito' }[r.risposta] || 'ha respinto';
  return `che l'amministrazione${quando} ${come}${r.motivo_rifiuto ? `, con la seguente motivazione: «${esc(r.motivo_rifiuto.slice(0, 600))}»` : ''}`;
}

export function riesame(r, v) {
  const motivi = r.risposta === 'nessuna' || !r.risposta
    ? '<p>Il silenzio dell\'amministrazione viola l\'obbligo di concludere il procedimento con provvedimento espresso e motivato.</p>'
    : `<p>Il diniego non è legittimo: le eccezioni dell'art. 5-bis del d.lgs. 33/2013 richiedono la dimostrazione di un pregiudizio concreto e probabile a uno degli interessi indicati dalla norma, che la risposta non fornisce; in ogni caso, l'amministrazione avrebbe dovuto consentire l'accesso parziale con l'oscuramento delle sole parti eventualmente sottratte (art. 5-bis, comma 4)${r.risposta === 'inammissibile' ? ', e prima di dichiarare inammissibile la richiesta avrebbe dovuto invitare il richiedente a precisarla (circolare del Ministro per la pubblica amministrazione n. 2/2017)' : ''}.</p>`;
  return `${destinatario(v, 'Al Responsabile della prevenzione della corruzione e della trasparenza')}
    <p class="oggetto">Oggetto: richiesta di riesame ai sensi dell'art. 5, comma 7, del d.lgs. 14 marzo 2013, n. 33.</p>
    <p>${richiedente(r)}</p>
    <p>con riferimento al${riferimentoRichiesta(r)}, ${esitoPrimaIstanza(r)},</p>
    ${motivi}
    <p><b>chiede</b> il riesame della richiesta e l'accoglimento dell'istanza di accesso, con provvedimento motivato entro venti giorni, ai sensi dell'art. 5, comma 7, del d.lgs. 33/2013.</p>
    <p>Chiede che la risposta sia inviata a ${campo(r.recapito, 'PEC o email')}.</p>
    ${firma(r)}`;
}

export function ricorso(r, v) {
  const e = v.ente;
  const documentale = v.tipo.id === 'documentale';
  const aChi = documentale && e?.statale
    ? 'Alla Commissione per l\'accesso ai documenti amministrativi, Presidenza del Consiglio dei ministri'
    : `Al Difensore civico della Regione ${e?.regione ? esc(e.regione) : vuoto('regione')}`;
  const norma = documentale ? 'dell\'art. 25, comma 4, della legge 241/1990' : 'dell\'art. 5, comma 8, del d.lgs. 33/2013';
  return `<p class="destra">${aChi}<br>e, per conoscenza, a ${e ? esc(e.nome) : vuoto('ente')}${e?.pec ? ` (PEC: ${esc(e.pec)})` : ''}</p>
    <p class="oggetto">Oggetto: ricorso ai sensi ${norma} contro il ${r.risposta && r.risposta !== 'nessuna' ? 'diniego' : 'silenzio'} sulla richiesta di accesso.</p>
    <p>${richiedente(r)}</p>
    <p>premesso di aver presentato ${riferimentoRichiesta(r)}, ${esitoPrimaIstanza(r).replace('trenta giorni previsto dall\'art. 5, comma 6, del d.lgs. 33/2013', documentale ? 'trenta giorni previsto dall\'art. 25, comma 4, della legge 241/1990' : 'trenta giorni previsto dall\'art. 5, comma 6, del d.lgs. 33/2013')},</p>
    <p><b>chiede</b> che ${documentale && e?.statale ? 'la Commissione' : 'il Difensore civico'} riesamini la determinazione e, ritenutala illegittima, ne informi l'amministrazione, affinché consenta l'accesso ai documenti richiesti.</p>
    ${documentale ? '<p>Allega copia della richiesta di accesso e dell\'eventuale risposta. Il presente ricorso viene inviato anche all\'amministrazione e, se presenti, ai controinteressati.</p>' : '<p>Allega copia della richiesta di accesso e dell\'eventuale risposta. Il presente ricorso viene inviato anche all\'amministrazione interessata.</p>'}
    <p>Chiede che le comunicazioni siano inviate a ${campo(r.recapito, 'PEC o email')}.</p>
    ${firma(r)}`;
}

export function sostitutivo(r, v) {
  return `${destinatario(v, 'Al titolare del potere sostitutivo')}
    <p class="oggetto">Oggetto: richiesta di intervento del titolare del potere sostitutivo ai sensi dell'art. 2, comma 9-ter, della legge 241/1990.</p>
    <p>${richiedente(r)}</p>
    <p>premesso di aver presentato ${riferimentoRichiesta(r)}, ai sensi dell'art. 5, comma 1, del d.lgs. 33/2013, e che nel termine di trenta giorni l'amministrazione non ha provveduto alla pubblicazione,</p>
    <p><b>chiede</b> che il titolare del potere sostitutivo provveda alla pubblicazione dei documenti e dei dati indicati e ne dia comunicazione al richiedente entro un termine pari alla metà di quello originario.</p>
    <p>Chiede che le comunicazioni siano inviate a ${campo(r.recapito, 'PEC o email')}.</p>
    ${firma(r)}`;
}

export const OGGETTI = {
  richiesta: (v) => (v.tipo.id === 'semplice' ? 'Richiesta di accesso civico (art. 5, comma 1, d.lgs. 33/2013)' : v.tipo.id === 'documentale' ? 'Richiesta di accesso ai documenti amministrativi (L. 241/1990)' : 'Richiesta di accesso civico generalizzato (art. 5, comma 2, d.lgs. 33/2013)'),
  riesame: () => 'Richiesta di riesame (art. 5, comma 7, d.lgs. 33/2013)',
  ricorso: (v) => (v.tipo.id === 'documentale' ? 'Ricorso contro il diniego di accesso (art. 25 L. 241/1990)' : 'Ricorso al difensore civico (art. 5, comma 8, d.lgs. 33/2013)'),
  sostitutivo: () => 'Richiesta di intervento del titolare del potere sostitutivo',
};
