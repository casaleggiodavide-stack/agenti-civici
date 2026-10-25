// Le lettere di «Si è rotto o ci ho ripensato». I campi mancanti restano evidenziati.

import { esc } from './comune/interfaccia.js';
import { data } from './comune/date.js';

const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const v = (x, t) => (x === undefined || x === null || x === '' ? vuoto(t) : esc(String(x)));
const giorno = (s, t) => (s ? esc(data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })) : vuoto(t));

const TITOLI = {
  denuncia: 'Denuncia di difetto di conformità e richiesta di {rimedio} (artt. 133 e 135-bis del Codice del consumo)',
  riduzione: 'Richiesta di {rimedio} per difetto di conformità (art. 135-bis del Codice del consumo)',
  fabbricante: 'Richiesta di riparazione al fabbricante (art. 127-quinquies del Codice del consumo)',
  recesso: 'Dichiarazione di recesso dal contratto (art. 54 del Codice del consumo)',
  diffida: 'Diffida al rimborso dopo l\'esercizio del diritto di recesso (art. 56 del Codice del consumo)',
};
const RIMEDI = { riparazione: 'riparazione', sostituzione: 'sostituzione', riduzione: 'riduzione del prezzo', risoluzione: 'risoluzione del contratto e rimborso' };

export function oggetto(r, val) {
  const d = val.documento || {};
  return (TITOLI[d.tipo] || 'Comunicazione').replace('{rimedio}', RIMEDI[d.rimedio] || 'riparazione');
}

export const destinatario = (r, val) => (val.documento?.tipo === 'fabbricante' ? 'il fabbricante (servizio riparazioni della marca)' : r.venditore_nome || null);

const testa = (r, val) => `<p class="destra">Spett.le ${val.documento?.tipo === 'fabbricante' ? vuoto('nome del fabbricante e indirizzo') : v(r.venditore_nome, 'nome e indirizzo email o PEC del venditore')}</p>
  <p class="oggetto">Oggetto: ${esc(oggetto(r, val))}${r.ordine ? ` - ordine n. ${esc(r.ordine)}` : ''}</p>`;
const chi = (r) => `${v(r.nome, 'nome e cognome')}${r.indirizzo ? `, residente in ${esc(r.indirizzo)}` : ''}, recapito ${v(r.recapito, 'email o PEC')}`;
const firma = (r) => `<p>${v(r.comune_firma, 'luogo')}, ${vuoto('data')}</p><p class="destra">${v(r.nome, 'nome e cognome')}<br>${vuoto('firma')}</p>`;
const bene = (r) => v(r.cosa_comprato, 'che cosa hai comprato, con marca e modello');
const acquisto = (r) => `${bene(r)}, acquistato il ${giorno(r.data_contratto, 'data dell\'acquisto')}${r.data_consegna ? ` e consegnato il ${giorno(r.data_consegna)}` : ''}`;

export function lettera(r, val) {
  const d = val.documento || {};
  if (d.tipo === 'denuncia') {
    return `${testa(r, val)}
      <p>Io sottoscritto ${chi(r)}, ho acquistato presso di voi ${acquisto(r)}.</p>
      <p>Il bene presenta il seguente difetto di conformità, manifestatosi il ${giorno(r.data_difetto, 'data in cui è comparso')}: ${v(r.descrizione, 'descrizione del difetto')}.</p>
      <p>Il difetto si è manifestato entro due anni dalla consegna: ne rispondete ai sensi dell'art. 133 del Codice del consumo (d.lgs. 206/2005).${d.presunto ? ' Poiché si è manifestato entro un anno dalla consegna, si presume esistente già a quella data (art. 135).' : ''}</p>
      <p>Vi chiedo pertanto, ai sensi dell'art. 135-bis, la <b>${esc(RIMEDI[d.rimedio])}</b> del bene, senza spese, entro un periodo ragionevole e senza notevoli inconvenienti, come prevede l'art. 135-ter. Resto a disposizione per concordare il ritiro o la consegna.</p>
      <p>In mancanza, mi riservo di chiedere la riduzione del prezzo o la risoluzione del contratto. La presente vale anche come atto interruttivo della prescrizione.</p>
      <p>Allego la prova d'acquisto.</p>
      ${firma(r)}`;
  }
  if (d.tipo === 'riduzione') {
    return `${testa(r, val)}
      <p>Io sottoscritto ${chi(r)}, ho acquistato presso di voi ${acquisto(r)}.</p>
      <p>Il bene presenta il seguente difetto di conformità: ${v(r.descrizione, 'descrizione del difetto')}. ${r.gia_riparato ? 'Ho già chiesto la riparazione o la sostituzione, che non è stata eseguita in modo soddisfacente o in tempi ragionevoli, oppure il difetto si è ripresentato.' : 'Il difetto è talmente grave da giustificare l\'immediata richiesta.'}</p>
      <p>Vi chiedo pertanto, ai sensi dell'art. 135-bis del Codice del consumo, la <b>${esc(RIMEDI[d.rimedio])}</b>${d.rimedio === 'risoluzione' ? ', con la restituzione del prezzo pagato a fronte della riconsegna del bene a vostre spese' : ', in misura proporzionale alla diminuzione del valore del bene'}.</p>
      <p>La presente vale anche come atto interruttivo della prescrizione.</p>
      <p>Allego la prova d'acquisto e le comunicazioni precedenti.</p>
      ${firma(r)}`;
  }
  if (d.tipo === 'fabbricante') {
    return `${testa(r, val)}
      <p>Io sottoscritto ${chi(r)}, sono proprietario di ${acquisto(r)}.</p>
      <p>Il bene presenta il seguente guasto: ${v(r.descrizione, 'descrizione del guasto')}.</p>
      <p>Poiché il bene rientra tra quelli per cui il diritto dell'Unione prevede requisiti di riparabilità, vi chiedo ai sensi dell'art. 127-quinquies del Codice del consumo di ripararlo, indicandomi per iscritto il costo, che deve essere ragionevole, e i tempi dell'intervento.</p>
      ${firma(r)}`;
  }
  if (d.tipo === 'recesso') {
    return `${testa(r, val)}
      <p>Io sottoscritto ${chi(r)}, con la presente comunico di recedere dal contratto relativo a ${bene(r)}${r.ordine ? `, ordine n. ${esc(r.ordine)}` : ''}, concluso il ${giorno(r.data_contratto, 'data del contratto o dell\'ordine')}${r.data_consegna ? ` e ricevuto il ${giorno(r.data_consegna)}` : ''}.</p>
      <p>Esercito il diritto di recesso previsto dall'art. 52 del Codice del consumo (d.lgs. 206/2005), entro il termine di legge.</p>
      <p>Vi chiedo il rimborso di tutti i pagamenti ricevuti, comprese le spese di consegna, entro 14 giorni dal ricevimento della presente, con lo stesso mezzo di pagamento che ho usato (art. 56), e di indicarmi come restituire il bene.</p>
      <p>Vi chiedo di confermare su supporto durevole la ricezione di questo recesso.</p>
      ${firma(r)}`;
  }
  if (d.tipo === 'diffida') {
    return `${testa(r, val)}
      <p>Io sottoscritto ${chi(r)}, il ${giorno(r.data_recesso, 'data del recesso')} vi ho comunicato il recesso dal contratto relativo a ${bene(r)}${r.ordine ? `, ordine n. ${esc(r.ordine)}` : ''}${r.data_reso ? `, e il ${giorno(r.data_reso)} ho restituito il bene` : ''}.</p>
      <p>Il termine di 14 giorni per il rimborso previsto dall'art. 56 del Codice del consumo è scaduto il ${giorno(d.dovuto)} senza che abbia ricevuto il rimborso.</p>
      <p>Vi diffido pertanto a rimborsarmi l'intero importo pagato, comprese le spese di consegna, entro 7 giorni dal ricevimento della presente. In mancanza mi rivolgerò alle associazioni dei consumatori e alle autorità competenti per la tutela dei miei diritti.</p>
      ${firma(r)}`;
  }
  return '';
}
