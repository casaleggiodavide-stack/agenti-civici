// Le lettere di «Condominio: i tuoi diritti». I campi mancanti restano evidenziati,
// da completare. Nessun dato lascia il dispositivo.

import { esc } from './comune/interfaccia.js';
import { data } from './comune/date.js';
import { DOMANDE } from './domande.js';

const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const v = (x, t) => (x === undefined || x === null || x === '' ? vuoto(t) : esc(String(x)));
const giorno = (s, t) => (s ? esc(data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })) : vuoto(t));
const euro = (n) => (n === undefined || n === null ? vuoto('importo') : esc(Number(n).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })));
const etichetta = (id, valore) => DOMANDE.find((d) => d.id === id)?.opzioni?.find(([k]) => k === valore)?.[1];

const TITOLI = {
  contestazione: 'Contestazione della delibera assembleare',
  documenti: 'Richiesta di visione e copia di documenti condominiali',
  documenti_sollecito: 'Sollecito: richiesta di visione e copia di documenti condominiali',
  richiesta_assemblea: 'Richiesta di convocazione dell\'assemblea straordinaria',
  avviso_convocazione: 'Avviso di convocazione dell\'assemblea dei condòmini',
  rateizzazione: 'Richiesta di attestazione dei pagamenti e proposta di piano di rientro',
  morosi: 'Richiesta di informazioni sulle quote non pagate e sulle azioni di recupero',
  revoca: 'Contestazione e richiesta di convocazione dell\'assemblea per la revoca dell\'amministratore',
  rimborso: 'Richiesta di rimborso di spesa urgente ai sensi dell\'art. 1134 c.c.',
};

export function oggetto(r, esito) {
  const d = esito.documento || {};
  const t = d.tipo === 'documenti' && d.sollecito ? TITOLI.documenti_sollecito : TITOLI[d.tipo] || 'Comunicazione';
  return `${t}${r.indirizzo ? ` - Condominio di ${r.indirizzo}` : ''}`;
}

/** Destinatario: per l'avviso di convocazione sono tutti i condòmini, altrimenti l'amministratore. */
export function destinatario(r, esito) {
  if (esito.documento?.tipo === 'avviso_convocazione') return { nome: 'A tutti i condòmini', pec: null };
  return { nome: r.amministratore ? `${r.amministratore}, amministratore del condominio` : null, pec: r.pec_amministratore || null };
}

const testa = (r, esito) => {
  const d = destinatario(r, esito);
  const cond = `Condominio di ${v(r.indirizzo, 'indirizzo del condominio')}`;
  return `<p class="destra">${esito.documento?.tipo === 'avviso_convocazione' ? `A tutti i condòmini del ${cond}` : `Spett.le ${d.nome ? esc(d.nome) : vuoto('nome dell\'amministratore')}<br>${cond}<br>PEC: ${d.pec ? esc(d.pec) : vuoto('PEC o email dell\'amministratore')}`}</p>
    <p class="oggetto">Oggetto: ${esc(oggetto(r, esito))}</p>`;
};
const chi = (r) => `Il sottoscritto ${v(r.nome, 'nome e cognome')}, condòmino (${v(r.interno, 'scala e interno')}), recapito ${v(r.recapito, 'PEC o email')},`;
const firma = (r) => `<p>${v(r.comune_firma, 'luogo')}, ${vuoto('data')}</p><p class="destra">${v(r.nome, 'nome e cognome')}<br>${vuoto('firma')}</p>`;

const RICHIESTE_DOC = {
  giustificativi: 'di prendere visione dei documenti giustificativi di spesa (fatture, contratti, ricevute) e di estrarne copia a proprie spese, come previsto dall\'art. 1130-bis, primo comma, c.c.',
  registri: 'di prendere visione gratuitamente del registro dei verbali delle assemblee, del registro di anagrafe condominiale, del registro di nomina e revoca dell\'amministratore e del registro di contabilità, e di ottenerne copia firmata previo rimborso della spesa, come previsto dall\'art. 1129, secondo comma, c.c.',
  conto: 'di prendere visione ed estrarre copia, a proprie spese, della rendicontazione periodica del conto corrente intestato al condominio, come previsto dall\'art. 1129, settimo comma, c.c.',
  attestazione: 'il rilascio dell\'attestazione relativa allo stato dei propri pagamenti degli oneri condominiali e delle eventuali liti in corso, come previsto dall\'art. 1130, n. 9, c.c.',
  rendiconto: 'la redazione del rendiconto condominiale annuale e la convocazione dell\'assemblea per la sua approvazione, che l\'art. 1130, n. 10, c.c. impone entro centottanta giorni, nonché di prendere visione dei documenti giustificativi di spesa (art. 1130-bis c.c.)',
};

const PROBLEMI = {
  rendiconto: 'la mancata presentazione del rendiconto e la mancata convocazione dell\'assemblea per la sua approvazione (art. 1129, dodicesimo comma, n. 1, c.c.)',
  registri: 'il mancato accesso ai registri condominiali e/o il mancato rilascio dell\'attestazione dei pagamenti (art. 1129, dodicesimo comma, n. 7, c.c.)',
  conto: 'la mancata apertura o utilizzazione del conto corrente intestato al condominio (art. 1129, settimo e dodicesimo comma, n. 3, c.c.)',
  fiscale: 'gravi irregolarità fiscali',
  confusione: 'una gestione che può generare confusione tra il patrimonio del condominio e quello personale dell\'amministratore o di altri (art. 1129, dodicesimo comma, n. 4, c.c.)',
  delibere: 'la mancata esecuzione di deliberazioni dell\'assemblea o di provvedimenti giudiziari (art. 1129, dodicesimo comma, n. 2, c.c.)',
  riscossione: 'la mancata cura delle azioni di recupero delle somme dovute al condominio (art. 1129, dodicesimo comma, n. 6, c.c.)',
  citazione: 'la mancata informazione all\'assemblea di una citazione o di un provvedimento che esorbita dalle attribuzioni dell\'amministratore (art. 1131, terzo e quarto comma, c.c.)',
  dati: 'l\'omessa, incompleta o inesatta comunicazione dei dati previsti dall\'art. 1129, secondo comma, c.c. (art. 1129, dodicesimo comma, n. 8)',
  fiducia: 'il venir meno del rapporto di fiducia',
};

export function lettera(r, esito) {
  const d = esito.documento || {};
  const T = testa(r, esito);

  if (d.tipo === 'contestazione') {
    const vizio = etichetta('vizio', r.vizio);
    return `${T}
      <p>${chi(r)} con riferimento alla delibera adottata dall'assemblea del ${giorno(r.data_assemblea, 'data dell\'assemblea')}, relativa a ${vuoto('punto dell\'ordine del giorno e contenuto della delibera')},</p>
      <p>CONTESTA</p>
      <p>la delibera per i seguenti motivi: ${vizio ? `${esc(vizio.toLowerCase())}; ` : ''}${vuoto('descrivi i fatti e cosa non va, con riferimento al verbale')}.</p>
      ${r.voto === 'assente' ? `<p>Dichiara di non aver partecipato all'assemblea${r.data_comunicazione ? ` e di aver ricevuto il verbale il ${giorno(r.data_comunicazione)}` : ' e chiede che gli sia trasmessa copia del verbale'}.</p>` : `<p>Dichiara di aver ${r.voto === 'astenuto' ? 'espresso la propria astensione' : 'espresso voto contrario'} nel corso dell'assemblea.</p>`}
      <p>CHIEDE</p>
      <p>che l'assemblea sia convocata per riesaminare e revocare la delibera, e che nel frattempo non le sia data esecuzione.</p>
      <p>Si riserva ogni azione a tutela dei propri diritti, compresa la domanda di mediazione e l'impugnazione ai sensi dell'art. 1137 c.c.${d.nulla ? ', nonché di far valere la nullità della delibera' : ''}.</p>
      ${firma(r)}`;
  }
  if (d.tipo === 'documenti') {
    const cosa = RICHIESTE_DOC[r.documenti_cosa] || RICHIESTE_DOC.giustificativi;
    return `${T}
      <p>${chi(r)}${d.sollecito && r.data_richiesta ? ` facendo seguito alla richiesta ricevuta il ${giorno(r.data_richiesta)} e rimasta ${r.risposta === 'parziale' ? 'in parte inevasa' : 'senza riscontro'},` : ''}</p>
      <p>CHIEDE</p>
      <p>${esc(cosa)}${r.anni ? `, con riferimento a: ${esc(r.anni)}` : ''}.</p>
      <p>Chiede di conoscere giorni e orari in cui è possibile la consultazione presso ${vuoto('luogo indicato dall\'amministratore')}, o in alternativa l'invio delle copie in formato digitale.</p>
      ${d.sollecito ? '<p>Ricorda che l\'inottemperanza agli obblighi di cui all\'art. 1130, numeri 6, 7 e 9, c.c. costituisce grave irregolarità ai sensi dell\'art. 1129, dodicesimo comma, n. 7, c.c.</p>' : ''}
      ${firma(r)}`;
  }
  if (d.tipo === 'richiesta_assemblea') {
    const base = {
      innovazioni_agevolate: 'ai sensi dell\'art. 1120, terzo comma, c.c., chiede che l\'assemblea sia convocata entro trenta giorni per deliberare sui seguenti interventi, di cui si indicano contenuto e modalità di esecuzione',
      barriere: 'ai sensi dell\'art. 1120, terzo comma, c.c. e dell\'art. 2 della legge 13/1989, chiede che l\'assemblea sia convocata entro trenta giorni per deliberare sui seguenti interventi per l\'eliminazione delle barriere architettoniche, di cui si indicano contenuto e modalità di esecuzione',
      irregolarita: 'ai sensi dell\'art. 1129, undicesimo comma, c.c., avendo rilevato le irregolarità indicate di seguito, chiede la convocazione dell\'assemblea per farle cessare e per deliberare sulla revoca dell\'amministratore e sulla nomina del nuovo',
      ricarica: 'chiede, anche ai sensi dell\'art. 17-quinquies del decreto-legge 83/2012, la convocazione dell\'assemblea per deliberare sull\'installazione di un punto di ricarica per veicoli elettrici',
    }[d.motivo] || 'insieme agli altri condòmini firmatari, che rappresentano almeno un sesto del valore dell\'edificio, chiede la convocazione dell\'assemblea straordinaria ai sensi dell\'art. 66, primo comma, delle disposizioni di attuazione del codice civile';
    return `${T}
      <p>${chi(r)} ${esc(base)}, con il seguente ordine del giorno:</p>
      <p>${r.ordine_giorno ? esc(r.ordine_giorno).replace(/\n/g, '<br>') : vuoto('ordine del giorno, con contenuto e modalità degli interventi proposti')}</p>
      ${d.motivo === 'generale' || !d.motivo ? `<p>Ricorda che, decorsi inutilmente dieci giorni dalla presente, i richiedenti potranno provvedere direttamente alla convocazione.</p><p>Firmano anche: ${vuoto('nomi, interni e millesimi degli altri condòmini richiedenti')}</p>` : ''}
      ${d.motivo === 'ricarica' ? '<p>Ricorda che, se il condominio non delibera entro tre mesi dalla presente richiesta scritta, il sottoscritto potrà installare il punto di ricarica a proprie spese (art. 17-quinquies, comma 3).</p>' : ''}
      ${d.motivo === 'barriere' ? '<p>Ricorda che, se il condominio rifiuta o non delibera entro tre mesi dalla richiesta scritta, gli aventi diritto possono procedere ai sensi dell\'art. 2, comma 2, della legge 13/1989.</p>' : ''}
      ${firma(r)}`;
  }
  if (d.tipo === 'avviso_convocazione') {
    return `${T}
      <p>${esc(esito.caso === 'assemblea' && r.amministratore_presente === false ? 'In mancanza dell\'amministratore, ai sensi dell\'art. 66, secondo comma, delle disposizioni di attuazione del codice civile,' : `Decorsi inutilmente dieci giorni dalla richiesta inviata all'amministratore${r.data_richiesta ? ` e ricevuta il ${data(r.data_richiesta).toLocaleDateString('it-IT', { timeZone: 'UTC' })}` : ''}, ai sensi dell'art. 66, primo comma, delle disposizioni di attuazione del codice civile,`)} i sottoscritti condòmini convocano l'assemblea:</p>
      <p>in prima convocazione il ${vuoto('giorno')} alle ore ${vuoto('ora')} presso ${vuoto('luogo')}<br>
      in seconda convocazione il ${vuoto('giorno, non lo stesso della prima ed entro dieci giorni')} alle ore ${vuoto('ora')} presso ${vuoto('luogo')}</p>
      <p>con il seguente ordine del giorno:</p>
      <p>${r.ordine_giorno ? esc(r.ordine_giorno).replace(/\n/g, '<br>') : vuoto('ordine del giorno')}</p>
      <p>L'avviso deve pervenire almeno cinque giorni prima della prima convocazione, con raccomandata, PEC, fax o consegna a mano. Ogni condòmino può farsi rappresentare con delega scritta.</p>
      <p>${v(r.comune_firma, 'luogo')}, ${vuoto('data')}</p><p class="destra">${v(r.nome, 'nome e cognome')} e ${vuoto('gli altri condòmini che convocano')}<br>${vuoto('firme')}</p>`;
  }
  if (d.tipo === 'rateizzazione') {
    return `${T}
      <p>${chi(r)}</p>
      <p>CHIEDE</p>
      <p>il rilascio dell'attestazione relativa allo stato dei propri pagamenti degli oneri condominiali e delle eventuali liti in corso (art. 1130, n. 9, c.c.).</p>
      <p>Riconosce di non aver ancora versato ${r.debito ? euro(r.debito) : vuoto('importo')}${r.data_scadenza_rata ? `, a partire dalla rata scaduta il ${giorno(r.data_scadenza_rata)}` : ''}, e propone il seguente piano di rientro: ${vuoto('importi e date delle rate che puoi rispettare')}.</p>
      <p>Chiede di sapere se il piano è accettato e, in attesa, di non essere sospeso dai servizi comuni.</p>
      ${firma(r)}`;
  }
  if (d.tipo === 'morosi') {
    return `${T}
      <p>${chi(r)}</p>
      <p>CHIEDE</p>
      <p>di conoscere l'ammontare complessivo delle quote condominiali non versate risultante dal registro di contabilità, i solleciti inviati e le azioni di recupero avviate${r.data_chiusura_esercizio ? ` per i crediti dell'esercizio chiuso il ${giorno(r.data_chiusura_esercizio)}` : ''}.</p>
      <p>Ricorda che, salvo dispensa espressa dell'assemblea, l'amministratore è tenuto ad agire per la riscossione forzosa entro sei mesi dalla chiusura dell'esercizio nel quale il credito esigibile è compreso (art. 1129, nono comma, c.c.), anche con decreto ingiuntivo immediatamente esecutivo (art. 63 disp. att. c.c.).</p>
      <p>Chiede che la questione sia inserita all'ordine del giorno della prossima assemblea.</p>
      ${firma(r)}`;
  }
  if (d.tipo === 'revoca') {
    return `${T}
      <p>${chi(r)} contesta all'amministratore ${esc(PROBLEMI[d.problema] || 'le irregolarità descritte di seguito')}, e in particolare i seguenti fatti: ${r.fatti_amministratore ? esc(r.fatti_amministratore) : vuoto('fatti precisi, con date')}.</p>
      <p>CHIEDE</p>
      <p>${d.problema === 'conto' || d.problema === 'fiscale' ? 'ai sensi dell\'art. 1129, undicesimo comma, c.c., la convocazione dell\'assemblea per far cessare la violazione e per deliberare sulla revoca dell\'amministratore e sulla nomina del nuovo' : 'la convocazione dell\'assemblea con all\'ordine del giorno la revoca dell\'amministratore e la nomina del nuovo (art. 1129, decimo e undicesimo comma, c.c.)'}.</p>
      ${d.problema === 'fiducia' ? '<p>La richiesta è sottoscritta anche dagli altri condòmini indicati, che insieme rappresentano almeno un sesto del valore dell\'edificio (art. 66 disp. att. c.c.): ' + vuoto('nomi, interni e millesimi') + '.</p>' : '<p>In mancanza, si riserva di chiedere la revoca all\'autorità giudiziaria ai sensi dell\'art. 1129, undicesimo comma, c.c. e dell\'art. 64 disp. att. c.c.</p>'}
      ${firma(r)}`;
  }
  if (d.tipo === 'rimborso') {
    const c = esito.calcolo;
    return `${T}
      <p>${chi(r)} comunica che in data ${giorno(r.data_lavori, 'data dei lavori')} ha dovuto far eseguire a proprie spese il seguente intervento sulle parti comuni: ${r.lavoro ? esc(r.lavoro) : vuoto('cosa è successo e cosa hai fatto riparare')}.</p>
      <p>L'intervento ${r.autorizzato === true ? 'era stato autorizzato' : 'era urgente e non poteva essere rinviato senza danno alle parti comuni'}${r.avvisato === true ? '; l\'amministratore era stato avvisato' : ''}.</p>
      <p>La spesa sostenuta è di ${euro(c?.importo ?? r.importo)}, come da fatture e ricevute allegate.</p>
      <p>CHIEDE</p>
      <p>ai sensi dell'art. 1134 c.c., il rimborso della quota a carico degli altri condòmini, pari a ${c?.rimborso !== undefined ? euro(c.rimborso) : vuoto('importo')} (spesa totale meno la propria quota per millesimi), e che la spesa sia riportata nella prossima assemblea.</p>
      <p>Allega: ${vuoto('fatture, ricevute, foto del guasto, messaggi')}.</p>
      ${firma(r)}`;
  }
  return '';
}
