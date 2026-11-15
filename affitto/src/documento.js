// Le lettere di «Affitto: i tuoi diritti». Sono lettere della persona che firma: niente
// nome del sito. I campi mancanti restano evidenziati, da completare.

import { esc } from './comune/interfaccia.js';
import { data } from './comune/date.js';
import { MOTIVI_DISDETTA } from './regole.js';

const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const v = (x, t) => (x === undefined || x === null || x === '' ? vuoto(t) : esc(String(x)));
const giorno = (s, t = 'data') => (s ? esc(data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })) : vuoto(t));
const fmt = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
const euro = (n, t = 'importo') => (n === undefined || n === null ? vuoto(t) : esc(`${fmt.format(Number(n))} euro`));
const TIPO = { libero: 'a canone libero (art. 2, comma 1, legge 431/1998)', concordato: 'a canone concordato (art. 2, comma 3, legge 431/1998)', transitorio: 'di natura transitoria (art. 5, comma 1, legge 431/1998)', studenti: 'per studenti universitari (art. 5, comma 2, legge 431/1998)' };

const OGGETTI = {
  recesso: 'Recesso dal contratto di locazione',
  disdetta_inquilino: 'Disdetta del contratto di locazione alla scadenza',
  contestazione_disdetta: 'Contestazione della disdetta del contratto di locazione',
  disdetta_proprietario: 'Disdetta del contratto di locazione',
  deposito: 'Restituzione del deposito cauzionale e degli interessi legali',
  contesta_aumento: 'Richiesta di aggiornamento del canone: contestazione',
  richiesta_istat: 'Aggiornamento ISTAT del canone di locazione',
  documenti_spese: 'Richiesta del rendiconto e dei documenti delle spese accessorie',
  canone_nero: 'Canone eccedente quello del contratto registrato',
  richiesta_registrazione: 'Registrazione del contratto di locazione',
  diffida_pagamento: 'Diffida al pagamento dei canoni scaduti',
  riparazione: 'Richiesta di riparazione',
  riparazione_urgente: 'Avviso di riparazione urgente',
};

export const oggetto = (r, e) => `${OGGETTI[e.documento?.tipo] || 'Contratto di locazione'}${r.indirizzo ? ` - immobile in ${r.indirizzo}` : ''}`;
export const raccomandata = (e) => !['documenti_spese', 'riparazione'].includes(e.documento?.tipo);

const testa = (r, e, mittente) => `<p>${v(r.nome, 'nome e cognome')}<br>${v(r.recapito, 'il tuo indirizzo o PEC')}</p>
  <p class="destra">Gent.le ${v(r.controparte, mittente === 'inquilino' ? 'nome del proprietario' : 'nome dell\'inquilino')}<br>${vuoto('indirizzo')}</p>
  <p>${raccomandata(e) ? 'Raccomandata con ricevuta di ritorno' : 'Per email o raccomandata'}</p>
  <p class="oggetto">Oggetto: ${esc(oggetto(r, e))}</p>`;
const contratto = (r, c) => `il contratto di locazione ${c.tipo ? TIPO[c.tipo] : ''} dell'immobile in ${v(r.indirizzo, 'indirizzo della casa')}, con decorrenza dal ${giorno(c.inizio, 'data di inizio')}`;
const firma = (r) => `<p>${v(r.comune_firma, 'luogo')}, ${vuoto('data')}</p><p class="destra">${v(r.nome, 'nome e cognome')}<br>${vuoto('firma')}</p>`;

/**
 * @param r risposte del questionario (anche i dati personali, che restano nel browser)
 * @param c contratto, @param e esito di valutaAffitto
 */
export function lettera(r, c, e) {
  const d = e.documento || {};
  const k = e.calcoli || {};
  const io = e.ruolo;
  const corpo = {
    recesso: () => `<p>con riferimento al${contratto(r, c).slice(2)}, comunico il mio recesso dal contratto ${d.motivo === 'gravi'
      ? `per gravi motivi, ai sensi dell'art. 3, comma 6, della legge 431/1998 e dell'art. 4 della legge 392/1978. I motivi sono i seguenti: ${r.motivi_testo ? esc(r.motivi_testo) : vuoto('descrivi i fatti, con le date')}.`
      : 'in base alla clausola di recesso prevista dal contratto e all\'art. 4, primo comma, della legge 392/1978.'}</p>
      <p>Il recesso avrà effetto decorsi ${esc(String(d.mesi))} mesi dal ricevimento della presente, e quindi dal ${giorno(d.dataUscita)}, data entro la quale riconsegnerò l'immobile libero e le chiavi.</p>
      <p>Chiedo di concordare la data del sopralluogo per il verbale di riconsegna e la restituzione del deposito cauzionale con gli interessi legali maturati, come previsto dall'art. 11 della legge 392/1978.</p>`,
    disdetta_inquilino: () => `<p>con riferimento al${contratto(r, c).slice(2)}, comunico che non intendo rinnovare il contratto alla scadenza del ${giorno(d.scadenza)}, ai sensi dell'art. ${c.tipo === 'studenti' ? '5 della legge 431/1998 e dell\'art. 3 del D.M. 16 gennaio 2017' : '2 della legge 431/1998'}.</p>
      <p>Riconsegnerò l'immobile libero e le chiavi entro quella data. Chiedo di concordare il sopralluogo per il verbale di riconsegna e la restituzione del deposito cauzionale con gli interessi legali maturati.</p>`,
    contestazione_disdetta: () => `<p>ho ricevuto in data ${giorno(r.data_disdetta, 'data di ricezione')} la Sua comunicazione di disdetta relativa al${contratto(r, c).slice(2)}.</p>
      <p>${d.vizio === 'tardi'
      ? `La disdetta mi è pervenuta dopo il ${giorno(d.limite)}, cioè con un preavviso inferiore ai sei mesi previsti dalla legge rispetto alla scadenza del ${giorno(d.scadenza)}. Non può quindi avere effetto per tale scadenza.`
      : `La disdetta per la prima scadenza del ${giorno(d.scadenza)} non indica alcuno dei motivi tassativamente previsti dall'art. 3, comma 1, della legge 431/1998, e pertanto è nulla ai sensi del comma 2 dello stesso articolo.`}</p>
      <p>Il contratto prosegue quindi alle condizioni in essere${d.prossima ? `, con prossima scadenza il ${giorno(d.prossima)}` : ''}. Continuerò a pagare regolarmente il canone.</p>`,
    disdetta_proprietario: () => `<p>con riferimento al${contratto(r, c).slice(2)}, comunico disdetta del contratto per la scadenza del ${giorno(d.scadenza)}${d.prima
      ? `, ai sensi dell'art. 3, comma 1, della legge 431/1998, per il seguente motivo: ${esc((MOTIVI_DISDETTA[d.motivo] || '').replace(/^./, (x) => x.toLowerCase()))}. In particolare: ${vuoto('i fatti concreti che giustificano il motivo')}.`
      : `, ai sensi dell'art. 2, ${c.tipo === 'concordato' ? 'comma 5' : 'comma 1'}, della legge 431/1998.`}</p>
      <p>Chiedo pertanto la riconsegna dell'immobile libero e delle chiavi entro tale data e propongo di concordare il sopralluogo per il verbale di riconsegna.</p>`,
    deposito: () => `<p>con riferimento al${contratto(r, c).slice(2)}, ${r.data_riconsegna ? `ho riconsegnato l'immobile e le chiavi in data ${giorno(r.data_riconsegna)}` : 'alla riconsegna dell\'immobile'}.</p>
      <p>Chiedo la restituzione del deposito cauzionale di ${euro(d.deposito)}, con gli interessi legali maturati dal ${giorno(d.dal)} al ${giorno(d.al)}, pari a ${euro(d.interessi)} calcolati al tasso legale di ciascun anno (art. 11 della legge 392/1978 e art. 1284 del codice civile), per un totale di ${euro(d.deposito + d.interessi)}.</p>
      ${d.trattenuta ? `<p>Quanto alla trattenuta di ${euro(d.trattenuta)}, chiedo il dettaglio delle singole voci con i documenti che le giustificano. Ricordo che non sono addebitabili il deterioramento dovuto al normale uso né quello dovuto alla vetustà (art. 1590 del codice civile).</p>` : ''}
      <p>Chiedo il pagamento entro quindici giorni dal ricevimento della presente sul conto IBAN ${vuoto('IBAN')}. In mancanza mi riservo di agire per il recupero.</p>`,
    contesta_aumento: () => `<p>ho ricevuto la Sua richiesta di aumento del canone${r.canone_richiesto ? ` a ${euro(r.canone_richiesto)} mensili` : ''} relativa al${contratto(r, c).slice(2)}.</p>
      <p>${c.cedolare === true
      ? 'Avendo Lei optato per il regime della cedolare secca, la facoltà di chiedere l\'aggiornamento del canone, inclusa la variazione ISTAT, è sospesa per tutta la durata dell\'opzione, ai sensi dell\'art. 3, comma 11, del d.lgs. 23/2011, disposizione inderogabile.'
      : d.motivo === 'clausola' ? 'Il contratto non prevede l\'aggiornamento del canone, che pertanto non è dovuto; è nulla ogni pattuizione diretta ad attribuire al locatore un canone superiore a quello contrattualmente stabilito (art. 13, comma 4, legge 431/1998).'
        : `L'importo richiesto supera il massimo risultante dalla clausola contrattuale e dalla variazione ISTAT, pari a ${euro(d.massimo)} mensili.`}</p>
      <p>Continuerò pertanto a corrispondere il canone di ${euro(c.cedolare === true || d.motivo === 'clausola' ? c.canone : d.massimo)} mensili.</p>`,
    richiesta_istat: () => `<p>con riferimento al${contratto(r, c).slice(2)}, in base alla clausola contrattuale di aggiornamento comunico che il canone mensile è aggiornato nella misura del ${esc(String(d.quota))}% della variazione ISTAT dell'indice dei prezzi al consumo per le famiglie di operai e impiegati, pari al ${esc(String(d.varIstat).replace('.', ','))}%.</p>
      <p>Il canone passa quindi da ${euro(c.canone)} a ${euro(d.nuovoCanone)} mensili (aumento di ${euro(d.aumento)}), a decorrere dal ${vuoto('mese di decorrenza previsto dal contratto')}.</p>
      <p>Confermo di non aver optato per il regime della cedolare secca.</p>`,
    documenti_spese: () => `<p>con riferimento al${contratto(r, c).slice(2)} e alla richiesta di pagamento delle spese accessorie${r.importo_spese ? ` per ${euro(r.importo_spese)}` : ''}${r.data_richiesta_spese ? ` del ${giorno(r.data_richiesta_spese)}` : ''},</p>
      <p>chiedo, prima di effettuare il pagamento, l'indicazione specifica delle spese con la menzione dei criteri di ripartizione, e di prendere visione dei documenti giustificativi (rendiconto condominiale, ripartizione, fatture), come previsto dall'art. 9 della legge 392/1978.</p>
      <p>Il pagamento delle somme effettivamente dovute avverrà entro due mesi dalla richiesta.</p>`,
    canone_nero: () => `<p>con riferimento al${contratto(r, c).slice(2)}, il canone risultante dal contratto registrato è di ${euro(r.canone_dichiarato)} mensili, mentre di fatto mi è stato chiesto e ho versato ${euro(c.canone)} mensili.</p>
      <p>Ai sensi dell'art. 13, comma 1, della legge 431/1998 è nulla ogni pattuizione volta a determinare un canone superiore a quello del contratto scritto e registrato. Da ora in poi corrisponderò il solo canone registrato e mi riservo di chiedere la restituzione delle somme versate in più${d.totale ? `, finora circa ${euro(d.totale)}` : ''}, come previsto dal comma 2 dello stesso articolo.</p>`,
    richiesta_registrazione: () => `<p>con riferimento alla locazione dell'immobile in ${v(r.indirizzo, 'indirizzo della casa')}, che occupo dal ${giorno(c.inizio, 'data di inizio')} versando un canone di ${euro(c.canone)} mensili,</p>
      <p>Le ricordo che l'obbligo di registrare il contratto spetta al locatore entro trenta giorni, con comunicazione documentata al conduttore e all'amministratore di condominio nei sessanta giorni successivi (art. 13, comma 1, della legge 431/1998), e che i contratti non registrati sono nulli (art. 1, comma 346, della legge 311/2004).</p>
      <p>La invito a provvedere alla registrazione e a inviarmene copia entro quindici giorni. In mancanza mi riservo di chiedere all'autorità giudiziaria che la locazione sia ricondotta alle condizioni di legge, ai sensi dell'art. 13, comma 6, della legge 431/1998.</p>`,
    diffida_pagamento: () => `<p>con riferimento al${contratto(r, c).slice(2)}, risultano non pagati ${d.rate ? `${esc(String(d.rate))} canoni mensili` : vuoto('quali canoni, con le scadenze')}${d.importo ? `, per complessivi ${euro(d.importo)}` : ''}, a partire da quello in scadenza il ${giorno(r.data_prima_rata, 'data')}.</p>
      <p>La invito a pagare l'importo dovuto entro quindici giorni dal ricevimento della presente sul conto IBAN ${vuoto('IBAN')}. Le ricordo che il mancato pagamento del canone decorsi venti giorni dalla scadenza costituisce motivo di risoluzione del contratto (art. 5 della legge 392/1978).</p>
      <p>In mancanza sarò costretto ad agire in giudizio per la risoluzione del contratto e il pagamento delle somme dovute.</p>`,
    riparazione: () => `<p>con riferimento al${contratto(r, c).slice(2)}, La informo, ai sensi dell'art. 1577 del codice civile, che l'immobile necessita della seguente riparazione: ${r.descrizione_guasto ? esc(r.descrizione_guasto) : vuoto('descrivi il guasto, con la data in cui è comparso')}.</p>
      <p>Non si tratta di piccola manutenzione dovuta all'uso, ma di un guasto dovuto a vetustà o a caso fortuito, a carico del locatore (artt. 1575, 1576 e 1609 del codice civile). Le chiedo di provvedere entro ${vuoto('numero')} giorni e di concordare con me l'accesso.</p>
      <p>Allego fotografie.</p>`,
    riparazione_urgente: () => `<p>con riferimento al${contratto(r, c).slice(2)}, La avviso che si è verificato il seguente guasto, che richiede una riparazione urgente: ${r.descrizione_guasto ? esc(r.descrizione_guasto) : vuoto('descrivi il guasto, con data e ora')}.</p>
      <p>Ai sensi dell'art. 1577, secondo comma, del codice civile, data l'urgenza, ${vuoto('provvederò direttamente / ho provveduto')} alla riparazione tramite ${vuoto('ditta')}, e Le chiederò il rimborso della spesa, documentata con fattura.</p>
      <p>Allego fotografie e, appena disponibile, il preventivo o la fattura.</p>`,
  }[d.tipo];
  if (!corpo) return '';
  const destinatario = io === 'inquilino' ? 'inquilino' : 'proprietario';
  return `${testa(r, e, destinatario)}<p>Gentile ${v(r.controparte, io === 'inquilino' ? 'nome del proprietario' : 'nome dell\'inquilino')},</p>${corpo()}<p>Distinti saluti.</p>${firma(r)}`;
}
