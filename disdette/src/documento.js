// Le lettere di «Disdici un abbonamento»: ripensamento, recesso, disdetta, contestazione.
// I campi mancanti restano evidenziati, da completare. Le lettere sono del cittadino:
// non portano il nome del sito.

import { esc } from './comune/interfaccia.js';
import { data } from './comune/date.js';

const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const v = (x, t) => (x === undefined || x === null || x === '' ? vuoto(t) : esc(String(x)));
const giorno = (s, t) => (s ? esc(data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })) : vuoto(t || 'data'));
const MATERIA = { luce: 'energia elettrica', gas: 'gas naturale', entrambi: 'energia elettrica e gas naturale' };

const OGGETTI = {
  ripensamento: 'Recesso dal contratto entro il periodo di ripensamento (artt. 52 e seguenti del Codice del consumo)',
  recesso: 'Recesso dal contratto',
  disdetta: 'Disdetta del contratto alla scadenza',
  contestazione: 'Contestazione di contratto o servizio non richiesto',
};

export function oggetto(r, e) {
  const d = e.documento || {};
  let t = OGGETTI[d.tipo] || 'Comunicazione';
  if (d.variante === 'polizza_5anni') t = 'Recesso dalla polizza pluriennale ai sensi dell\'art. 1899 del codice civile';
  else if (d.variante === 'polizza') t = 'Disdetta della polizza alla scadenza';
  else if (d.variante === 'modifica' || d.variante === 'modifica_servizi') t = 'Recesso per modifica delle condizioni contrattuali';
  return `${t}${r.codice_cliente ? ` (contratto n. ${r.codice_cliente})` : ''}`;
}

/** Il destinatario: il fornitore indicato dalla persona. */
export const destinatario = (r) => ({ nome: r.fornitore || null, recapito: r.fornitore_recapito || null });

function intestazione(r, e) {
  const riferimenti = [
    `n. ${v(r.codice_cliente, 'codice cliente o numero di contratto')}`,
    r.tipo === 'telefonia' ? `linea n. ${v(r.numero_linea, 'numero della linea')}` : '',
    r.tipo === 'energia' ? `codice POD/PDR ${v(r.codice_fornitura, 'codice POD o PDR')}` : '',
  ].filter(Boolean).join(', ');
  return `<p class="destra">Spett.le ${v(r.fornitore, 'nome del fornitore')}<br>${v(r.fornitore_recapito, 'PEC o indirizzo per le disdette')}</p>
    <p class="oggetto">Oggetto: ${esc(oggetto(r, e))}</p>
    <p>Il/La sottoscritto/a ${v(r.nome, 'nome e cognome')}, residente in ${v(r.indirizzo, 'indirizzo')}, intestatario/a del contratto (${riferimenti}),</p>`;
}

const chiusura = (r) => `<p>Chiede conferma scritta del ricevimento della presente e della data di cessazione del contratto${r.recapito ? `, all'indirizzo ${esc(r.recapito)}` : ''}.</p>
  <p>${v(r.comune_firma, 'luogo')}, ${vuoto('data')}</p>
  <p class="destra">${v(r.nome, 'nome e cognome')}<br>${vuoto('firma')}</p>
  <p><small>Allegato: copia di un documento d'identità.</small></p>`;

function corpo(r, e) {
  const d = e.documento || {};
  const tlc = ['telefonia', 'paytv'].includes(r.tipo);
  const ecs = r.tipo === 'telefonia' || (r.tipo === 'paytv' && r.con_internet === true);
  if (d.tipo === 'contestazione') {
    return `<p>contesta l'attivazione del contratto o del servizio indicato, che non ha mai richiesto né autorizzato.</p>
      <p>Ai sensi dell'art. 66-quinquies del Codice del consumo (d.lgs. 206/2005)${tlc ? ' e dell\'art. 1, comma 3-quater, del decreto-legge 7/2007, convertito dalla legge 40/2007' : ''}, per una fornitura non richiesta non è dovuto alcun corrispettivo e il silenzio non vale come consenso.</p>
      <p>Chiede pertanto la cessazione immediata del servizio, lo storno degli importi addebitati, il rimborso di quelli già pagati e copia dell'eventuale prova del consenso in vostro possesso. In mancanza si riserva di rivolgersi alle autorità competenti.</p>`;
  }
  if (d.tipo === 'ripensamento') {
    const rip = e.ripensamento || {};
    return `<p>comunica di recedere dal contratto concluso il ${giorno(r.data_firma, 'data di conclusione')}, ai sensi degli articoli 52 e seguenti del Codice del consumo (d.lgs. 206/2005), entro il periodo di recesso di ${rip.giorni || 14} giorni${rip.prolungato ? ', prolungato di dodici mesi per la mancata informazione sul diritto di recesso (art. 53)' : ''}.</p>
      <p>Chiede il rimborso di tutti i pagamenti ricevuti entro 14 giorni dal ricevimento della presente (art. 56), con lo stesso mezzo di pagamento usato, salvo l'importo proporzionale al servizio eventualmente prestato su sua richiesta espressa fino a oggi (art. 57, comma 3).</p>`;
  }
  if (d.tipo === 'recesso' && d.variante === 'energia') {
    return `<p>comunica il recesso dal contratto di fornitura di ${esc(MATERIA[r.materia] || 'energia')}, ai sensi dell'art. 6.2 dell'allegato A alla deliberazione ARERA 302/2016/R/com, con preavviso di un mese dal ricevimento della presente e senza penali né spese di chiusura (art. 6.5).</p>
      <p>Comunica l'autolettura del contatore alla data del ${vuoto('data')}: ${vuoto('lettura')}.</p>`;
  }
  if (d.tipo === 'recesso' && d.variante === '65bis') {
    return `<p>premesso di non aver ricevuto, trenta giorni prima della scadenza del contratto, la comunicazione del termine per la disdetta prevista dall'art. 65-bis del Codice del consumo (d.lgs. 206/2005), e che il contratto si è quindi rinnovato senza tale avviso,</p>
      <p>comunica di recedere dal contratto senza spese, come consente lo stesso articolo, con effetto dal ricevimento della presente. Chiede di non addebitare ulteriori importi e di revocare eventuali addebiti automatici.</p>`;
  }
  if (d.tipo === 'recesso' && d.variante === 'modifica_servizi') {
    return `<p>con riferimento alla modifica delle condizioni del contratto comunicata il ${giorno(r.data_modifica, 'data della comunicazione')}, la contesta e comunica di recedere dal contratto senza oneri, con effetto dal ricevimento della presente.</p>
      <p>Ricorda che si presumono vessatorie, e sono quindi nulle, le clausole che consentono al professionista di modificare unilateralmente le condizioni senza un giustificato motivo indicato nel contratto o di aumentare il prezzo senza riconoscere al consumatore il diritto di recedere (art. 33, comma 2, lettere m e o, e art. 36 del Codice del consumo).</p>`;
  }
  if (d.tipo === 'recesso') {
    const base = {
      modifica: `a seguito della comunicazione di modifica delle condizioni contrattuali ricevuta il ${giorno(r.data_modifica, 'data della comunicazione')}, comunica di recedere dal contratto senza penali né costi di disattivazione, entro sessanta giorni dalla comunicazione, ai sensi dell'art. 98-septiesdecies, comma 5, del d.lgs. 259/2003 (Codice delle comunicazioni elettroniche).`,
      qualita: 'comunica di recedere dal contratto senza costi, ai sensi dell\'art. 98-septiesdecies, comma 6, del d.lgs. 259/2003, per la discrepanza significativa e continuativa tra le prestazioni effettive della connessione a Internet e quelle indicate nel contratto, come risulta dalle misure allegate.',
      rinnovato: `comunica il recesso dal contratto ai sensi dell'art. 1, comma 3, del decreto-legge 7/2007, convertito dalla legge 40/2007, con preavviso di trenta giorni dal ricevimento della presente.${ecs ? ` Essendo il contratto rinnovato automaticamente dopo il periodo iniziale, il recesso avviene senza penali né costi di disattivazione, ai sensi dell'art. 98-septiesdecies, comma 4, del d.lgs. 259/2003${(r.data_firma || '') >= '2024-01-03' ? ' e dell\'art. 5, comma 5, del regolamento allegato B alla delibera AGCOM 307/23/CONS' : ''}.` : ''}`,
    }[d.variante] || 'comunica il recesso dal contratto ai sensi dell\'art. 1, comma 3, del decreto-legge 7/2007, convertito dalla legge 40/2007, con preavviso di trenta giorni dal ricevimento della presente.';
    const rate = r.rate === true
      ? `<p>Quanto alle rate residue per apparati o servizi acquistati con il contratto, chiede ${r.rate_scelta === 'unica' ? 'di pagarle in un\'unica soluzione, senza costi ulteriori' : 'di continuare a pagarle alle scadenze originariamente previste'}, come previsto dalle linee guida allegate alla delibera AGCOM 487/18/CONS (punto 29).</p>`
      : '';
    return `<p>${base}</p>${rate}
      <p>Chiede che dalla data di cessazione non sia addebitato alcun importo (art. 8, comma 2, del regolamento allegato B alla delibera AGCOM 307/23/CONS) e che siano indicate le modalità di restituzione degli apparati eventualmente concessi in comodato o noleggio.</p>`;
  }
  // disdetta
  if (d.variante === 'polizza_5anni') {
    return `<p>con riferimento alla polizza n. ${v(r.codice_cliente, 'numero di polizza')}, con decorrenza ${giorno(r.data_firma, 'data di decorrenza')} e durata superiore a cinque anni, trascorso il quinquennio comunica di recedere dal contratto ai sensi dell'art. 1899, primo comma, del codice civile, con preavviso di sessanta giorni e con effetto dalla fine dell'annualità in corso, il ${giorno(d.fine)}.</p>`;
  }
  const scad = e.effetto?.data;
  const cosa = r.tipo === 'polizza' ? `della polizza n. ${v(r.codice_cliente, 'numero di polizza')}` : 'del contratto';
  return `<p>comunica la disdetta ${cosa} ${d.variante === 'tardiva' ? 'per la prima scadenza utile' : scad ? `per la scadenza del ${giorno(scad)}` : `per la scadenza del ${vuoto('data di scadenza')}`}, così da impedirne il rinnovo automatico.</p>
    <p>Chiede che dopo tale data non sia addebitato alcun importo e che siano revocati eventuali addebiti automatici.</p>`;
}

/** La lettera in HTML, pronta da completare e firmare. */
export function lettera(r, e) {
  if (!e?.documento) return '';
  return `${intestazione(r, e)}${corpo(r, e)}${chiusura(r)}`;
}
