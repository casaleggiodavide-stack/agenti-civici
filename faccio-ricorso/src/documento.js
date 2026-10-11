// Il ricorso, pronto da firmare: al Prefetto (art. 203 CdS) o al Giudice di
// Pace (art. 204-bis CdS, art. 7 d.lgs. 150/2011). I dati mancanti restano
// evidenziati da completare a mano.

import { data, scrittaBreve, oggi as oggiCal } from './comune/date.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const campo = (v, segnaposto) => (v ? esc(v) : vuoto(segnaposto));
const dataCampo = (v, segnaposto) => (v ? esc(scrittaBreve(data(v))) : vuoto(segnaposto));
/** Le parti tra parentesi quadre nei testi dei motivi diventano campi da completare. */
const conCampi = (t) => esc(t).replace(/\[([^\]]+)\]/g, (_, x) => vuoto(x));
const euro = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, useGrouping: 'always' }).format(n);

function allegati(v) {
  const a = ['Copia del verbale', 'Copia di un documento d\'identità'];
  const id = new Set(v.motivi.filter((m) => m.esito === 'vizio' || m.esito === 'da_provare').map((m) => m.id));
  if (id.has('veicolo_non_tuo')) a.push('Atto di vendita o denuncia di furto del veicolo');
  if (id.has('dati_errati')) a.push('Copia della carta di circolazione');
  if (id.has('notifica_tardiva')) a.push('Copia della busta o dell\'avviso con la data di spedizione, o della ricevuta PEC');
  if (id.has('segnalazione')) a.push('Fotografie del tratto di strada');
  if (id.has('permesso_ztl')) a.push('Copia del permesso di accesso alla ZTL');
  if (id.has('strisce_blu')) a.push('Ticket o ricevuta del pagamento della sosta');
  if (id.has('cumulo_velocita') || id.has('cumulo_ztl')) a.push('Copia degli altri verbali dello stesso giorno');
  return a;
}

function intestazione(r) {
  return `<p>Il/La sottoscritto/a ${campo(r.nome, 'nome e cognome')}, nato/a a ${campo(r.nascita, 'luogo e data di nascita')}, residente in ${campo(r.residenza, 'indirizzo di residenza')}, codice fiscale ${campo(r.codice_fiscale, 'codice fiscale')}, recapito per le comunicazioni ${campo(r.recapito, 'PEC o email')}, in relazione al verbale n. ${campo(r.numero_verbale, 'numero del verbale')} redatto da ${campo(r.organo, 'ufficio che ha redatto il verbale')} per la violazione del ${dataCampo(r.data_violazione, 'data della violazione')} commessa in ${campo(r.comune, 'comune')} con il veicolo targato ${campo(r.targa, 'targa')}, ${r.modo === 'immediata' ? 'contestato immediatamente' : `notificato il ${dataCampo(r.data_notifica, 'data di notifica')}`},</p>`;
}

function elencoMotivi(v) {
  const usati = v.motivi.filter((m) => (m.esito === 'vizio' || m.esito === 'da_provare') && m.testoRicorso);
  if (!usati.length) return `<ol><li>${vuoto('Descrivi qui i motivi del ricorso: Faccio ricorso? non ha trovato motivi oggettivi nel verbale')}</li></ol>`;
  return `<ol>${usati.map((m) => `<li>${conCampi(m.testoRicorso)}</li>`).join('')}</ol>`;
}

function chiusura(r, v) {
  const conducente = r.punti > 0 && r.modo !== 'immediata'
    ? '<p>Dichiara infine che il presente ricorso è proposto entro il termine per la comunicazione dei dati del conducente previsto dall\'art. 126-bis, comma 2, del Codice della Strada, e che la pendenza del ricorso costituisce giustificato motivo della mancata comunicazione.</p>' : '';
  const oggi = oggiCal();
  return `${conducente}
    <p>Allegati:</p><ol>${allegati(v).map((a) => `<li>${esc(a)}</li>`).join('')}</ol>
    <p>${campo(r.comune_firma, 'luogo')}, ${esc(scrittaBreve(oggi))}</p>
    <p class="destra">Firma<br>${r.nome ? esc(r.nome) : vuoto('firma')}</p>`;
}

export function ricorsoPrefetto(r, v) {
  const p = v.destinatari.prefetto;
  const viaOrgano = r.invio_prefetto === 'organo';
  const dest = p
    ? `${esc(p.nome.startsWith('Presidente') ? 'Al ' + p.nome : 'Al Prefetto, ' + p.nome)}<br>${esc(p.indirizzo)}<br>PEC: ${esc(p.pec)}`
    : `Al Prefetto di ${vuoto('provincia in cui è avvenuta la violazione')}`;
  const tramite = viaOrgano ? `<br><br>per il tramite di ${campo(r.organo, 'ufficio che ha redatto il verbale')}${r.pec_organo ? `<br>PEC: ${esc(r.pec_organo)}` : ''}` : '';
  return `
    <p class="destra">${dest}${tramite}</p>
    <p class="oggetto">Oggetto: ricorso ai sensi dell'art. 203 del Codice della Strada avverso il verbale n. ${campo(r.numero_verbale, 'numero del verbale')}.</p>
    ${intestazione(r)}
    <p style="text-align:center"><b>propone ricorso</b></p>
    <p>per i seguenti motivi:</p>
    ${elencoMotivi(v)}
    <p>Per questi motivi chiede che il Prefetto disponga l'archiviazione del verbale e l'annullamento della sanzione.${r.audizione === true ? ' Chiede inoltre di essere ascoltato/a personalmente, ai sensi dell\'art. 203, comma 1, del Codice della Strada.' : ''}</p>
    ${chiusura(r, v)}`;
}

export function ricorsoGiudiceDiPace(r, v) {
  const valore = r.importo > 0 ? r.importo : null;
  const cu = v.costi ? v.costi.cu : null;
  return `
    <p class="destra">All'Ufficio del Giudice di Pace di ${vuoto(r.comune ? `sede competente per ${r.comune}` : 'sede competente per il luogo della violazione')}</p>
    <p class="oggetto">Ricorso ai sensi dell'art. 204-bis del Codice della Strada e dell'art. 7 del d.lgs. 1° settembre 2011, n. 150, avverso il verbale n. ${campo(r.numero_verbale, 'numero del verbale')}.</p>
    ${intestazione(r)}
    <p>che sta in giudizio personalmente ai sensi dell'art. 7, comma 8, del d.lgs. 150/2011,</p>
    <p style="text-align:center"><b>contro</b></p>
    <p>${vuoto(r.organo ? `amministrazione da cui dipende ${r.organo}` : 'amministrazione che ha emesso il verbale (per la polizia locale: il Comune)')}</p>
    <p style="text-align:center"><b>propone ricorso</b></p>
    <p>Il presente ricorso è proposto entro trenta giorni dalla ${r.modo === 'immediata' ? 'contestazione' : 'notificazione'} del verbale e non è stato presentato ricorso al Prefetto per la stessa violazione.</p>
    <p>Motivi:</p>
    ${elencoMotivi(v)}
    <p>Per questi motivi chiede che il Giudice di Pace annulli il verbale impugnato e, in subordine, ridetermini la sanzione nel minimo di legge, con rimborso delle spese sostenute.</p>
    <p>Ai fini del contributo unificato dichiara che il valore della causa è di ${valore ? esc(euro(valore)) : vuoto('importo indicato nel verbale')} e che il contributo dovuto è di ${cu ? esc(euro(cu)) : vuoto('importo del contributo unificato')}.</p>
    ${chiusura(r, v)}`;
}

export function oggettoEmail(r) {
  return `Ricorso ai sensi dell'art. 203 del Codice della Strada avverso il verbale n. ${r.numero_verbale || '…'}${r.targa ? ' - targa ' + r.targa : ''}`;
}
