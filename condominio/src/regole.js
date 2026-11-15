// Regole di «Condominio: i tuoi diritti». Funzioni pure, senza DOM: le usano la pagina,
// i test e il server MCP. Ogni soglia, termine e testo viene da condominio/dati/fonti.json
// (norme lette su Normattiva il 15/11/2026, vedi scripts/condominio-dati.py).
//
//   maggioranze(delibera)        quorum costitutivo e deliberativo, prima e seconda convocazione
//   valutaCondominio(situazione) una delle otto situazioni: termini, passi, lettera, fonti
//   testo(esito)                 l'esito in testo semplice

import FONTI from './dati/fonti.js';
import { data, iso, scadenza, oggi as oggiDi, giorniTra } from './comune/date.js';

export const VERIFICATO = FONTI.verificato;
export { FONTI };
export const TIPI = FONTI.tipi;
const R = FONTI.regole;

export const CASI = [
  ['impugnare', 'Voglio contestare una delibera dell\'assemblea'],
  ['delibera', 'Voglio sapere se una delibera è passata con la maggioranza giusta'],
  ['documenti', 'Voglio vedere i conti, i registri o le fatture'],
  ['assemblea', 'Voglio che si convochi un\'assemblea'],
  ['spese', 'Voglio capire chi paga una spesa'],
  ['morosita', 'Ritardi nei pagamenti delle quote'],
  ['amministratore', 'L\'amministratore non fa il suo lavoro: revoca e obblighi'],
  ['lavori_urgenti', 'Ho pagato io un lavoro urgente sulle parti comuni'],
];

// ---------- utilità ----------

const fonte = (id) => (R[id] ? { id, titolo: R[id].norma.titolo, url: R[id].norma.url } : null);
const unici = (lista) => [...new Map(lista.filter((f) => f?.url).map((f) => [f.titolo + f.url, f])).values()];
const lungo = (d) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtNum = (n) => Number(n).toLocaleString('it-IT', { maximumFractionDigits: 2 });
const fmtEur = (n) => Number(n).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
const pos = (x) => { const n = num(x); return n !== null && n >= 0 ? n : null; };

/** Numero da stringa o numero; accetta la virgola decimale. null se manca o non è valido. */
export function num(x) {
  if (x === undefined || x === null || x === '') return null;
  if (typeof x === 'number') return Number.isFinite(x) ? x : null;
  const n = Number(String(x).replace(/\s|€/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Aggiunge mesi «secondo il calendario comune»: 31 agosto + 6 mesi = 28 (o 29) febbraio. */
export function aggiungiMesi(d, n) {
  const x = data(d);
  const anno = x.getUTCFullYear(), mese = x.getUTCMonth() + n, giorno = x.getUTCDate();
  const ultimo = new Date(Date.UTC(anno, mese + 1, 0, 12)).getUTCDate();
  return new Date(Date.UTC(anno, mese, Math.min(giorno, ultimo), 12));
}

/** Termine di 30 giorni dell'art. 1137 c.c.: sospensione feriale (1-31 agosto) e festivi. */
export function termineImpugnazione(inizio) {
  if (!data(inizio)) return null;
  const n = R.impugnazione_30.giorni;
  const conSospensione = scadenza(inizio, n, { feriale: true, slitta: true });
  const senzaSlittamento = scadenza(inizio, n, { feriale: true });
  const senzaSospensione = scadenza(inizio, n, { slitta: true });
  return { scadenza: iso(conSospensione), senzaSospensione: iso(senzaSospensione), sospesa: iso(senzaSlittamento) !== iso(scadenza(inizio, n)), slittata: iso(senzaSlittamento) !== iso(conSospensione) };
}

// ---------- 2. Le maggioranze ----------

const frazioneOk = (valore, totale, [a, b]) => valore * b - totale * a >= -1e-9;
const piuDellaMeta = (x, di) => x * 2 > di;
const servonoTeste = (regola, n) => (regola === 'maggioranza' ? Math.floor(n / 2) + 1 : null);

const DELIBERATIVE = {
  base: { prima: 'deliberativa_prima', seconda: 'deliberativa_seconda' },
  meta: { prima: 'sempre_meta', seconda: 'sempre_meta' },
  due_terzi: { prima: 'due_terzi', seconda: 'due_terzi' },
  terzo: { prima: 'energia_terzo', seconda: 'energia_terzo' },
  quattro_quinti: { prima: 'destinazione_uso', seconda: 'destinazione_uso' },
  unanimita: { prima: 'tabelle_modifica', seconda: 'tabelle_modifica' },
};

/**
 * Quorum costitutivo e deliberativo di una delibera.
 * @param {object} d
 *   tipo: id da TIPI (ordinaria, amministratore, innovazioni, barriere, energia_ape, ricarica, …)
 *   convocazione: 'prima' | 'seconda'
 *   partecipanti: numero dei condòmini (teste) dell'edificio
 *   totale_millesimi: valore dell'edificio, di solito 1000
 *   presenti_teste, presenti_millesimi: chi era presente, anche per delega
 *   favorevoli_teste, favorevoli_millesimi: chi ha votato sì
 *   data_prima, data_seconda, data_avviso (facoltative): controllano i tempi della convocazione
 */
export function maggioranze(d = {}) {
  const tipo = TIPI.find((t) => t.id === d.tipo) || null;
  const conv = d.convocazione === 'seconda' ? 'seconda' : d.convocazione === 'prima' ? 'prima' : null;
  const T = pos(d.totale_millesimi) || 1000;
  const N = pos(d.partecipanti);
  const P = pos(d.presenti_teste), PM = pos(d.presenti_millesimi);
  const F = pos(d.favorevoli_teste), FM = pos(d.favorevoli_millesimi);
  const voci = [];
  const mancano = [];
  const fonti = [];
  const manca = (id, titolo, spiegazione) => { mancano.push(id); voci.push({ esito: 'dato', titolo, spiegazione, dato: id }); };

  if (!tipo) manca('tipo', 'Scegli il tipo di decisione', 'La maggioranza cambia secondo l\'argomento: gestione ordinaria, amministratore, lavori straordinari, innovazioni, barriere architettoniche, risparmio energetico e così via.');
  if (!conv) manca('convocazione', 'Prima o seconda convocazione?', 'Il verbale lo dice. In seconda convocazione bastano numeri più bassi per le decisioni ordinarie.');
  if (N === null) manca('partecipanti', 'Quanti sono i condòmini?', 'Il numero delle persone (le «teste»): i comproprietari di uno stesso appartamento hanno un solo rappresentante.');
  if (P === null) manca('presenti_teste', 'Quanti erano presenti?', 'Contano anche le deleghe. Lo trovi nel verbale.');
  if (PM === null) manca('presenti_millesimi', 'Quanti millesimi erano presenti?', 'La somma dei millesimi dei presenti, deleghe comprese.');
  if (F === null) manca('favorevoli_teste', 'Quanti hanno votato a favore?', 'Le persone che hanno votato sì.');
  if (FM === null) manca('favorevoli_millesimi', 'Quanti millesimi hanno votato a favore?', 'La somma dei millesimi di chi ha votato sì.');

  // numeri che non tornano
  const incoerenze = [];
  if (N !== null && P !== null && P > N) incoerenze.push('i presenti sono più dei condòmini');
  if (PM !== null && PM > T + 1e-9) incoerenze.push('i millesimi presenti superano il totale');
  if (P !== null && F !== null && F > P) incoerenze.push('i favorevoli sono più dei presenti');
  if (PM !== null && FM !== null && FM > PM + 1e-9) incoerenze.push('i millesimi favorevoli superano quelli presenti');
  if (incoerenze.length) voci.push({ esito: 'no', titolo: 'I numeri non tornano', spiegazione: `Controlla il verbale: ${incoerenze.join('; ')}.` });

  // quorum costitutivo
  let costituita = null;
  if (conv) {
    const id = conv === 'prima' ? 'costitutiva_prima' : 'costitutiva_seconda';
    const r = R[id];
    fonti.push(fonte(id));
    const tOk = N !== null && P !== null ? (conv === 'prima' ? piuDellaMeta(P, N) : frazioneOk(P, N, r.teste)) : null;
    const mOk = PM !== null ? frazioneOk(PM, T, r.millesimi) : null;
    costituita = {
      regola: id, testo: r.testo,
      teste: { servono: N !== null ? (conv === 'prima' ? servonoTeste('maggioranza', N) : Math.ceil((N * r.teste[0]) / r.teste[1] - 1e-9)) : null, ci_sono: P, ok: tOk },
      millesimi: { servono: (T * r.millesimi[0]) / r.millesimi[1], ci_sono: PM, ok: mOk },
      esito: tOk === null || mOk === null ? null : tOk && mOk,
    };
  }

  // quorum deliberativo
  let approvata = null;
  if (tipo && conv) {
    const id = DELIBERATIVE[tipo.regola][conv];
    const r = R[id];
    fonti.push(...tipo.fonti.map(fonte));
    let tOk = null, mOk = null, servonoT = null, servonoM = null, testoRegola = r.testo;
    if (tipo.regola === 'quattro_quinti') {
      servonoT = N !== null ? Math.ceil((N * 4) / 5 - 1e-9) : null;
      servonoM = (T * 4) / 5;
      tOk = N !== null && F !== null ? frazioneOk(F, N, r.teste) : null;
      mOk = FM !== null ? frazioneOk(FM, T, r.millesimi) : null;
    } else if (tipo.regola === 'unanimita') {
      servonoT = N; servonoM = T;
      testoRegola = 'Serve il consenso di tutti i condòmini e di tutti i millesimi. ' + r.testo;
      tOk = N !== null && F !== null ? F >= N : null;
      mOk = FM !== null ? FM >= T - 1e-9 : null;
    } else {
      servonoT = P !== null ? servonoTeste('maggioranza', P) : null;
      servonoM = (T * r.millesimi[0]) / r.millesimi[1];
      tOk = P !== null && F !== null ? piuDellaMeta(F, P) : null;
      mOk = FM !== null ? frazioneOk(FM, T, r.millesimi) : null;
    }
    approvata = { regola: id, testo: testoRegola, teste: { servono: servonoT, ci_sono: F, ok: tOk }, millesimi: { servono: servonoM, ci_sono: FM, ok: mOk }, esito: tOk === null || mOk === null ? null : tOk && mOk };
    if (tipo.nota) voci.push({ esito: 'forse', titolo: 'Da sapere', spiegazione: tipo.nota });
    if (['barriere', 'ricarica'].includes(tipo.id)) {
      const rr = R[tipo.id === 'barriere' ? 'barriere_legge13' : 'ricarica'];
      voci.push({ esito: 'forse', titolo: `Se l'assemblea non decide entro ${rr.mesi} mesi`, spiegazione: rr.testo });
    }
    if (tipo.id === 'destinazione_uso') voci.push({ esito: 'forse', titolo: 'Convocazione speciale', spiegazione: 'Per cambiare destinazione d\'uso la convocazione va affissa per almeno 30 giorni e deve arrivare almeno 20 giorni prima, indicando a pena di nullità le parti comuni e la nuova destinazione; la delibera deve dichiarare che questi adempimenti sono stati fatti.' });
  }

  // tempi della convocazione
  const dp = data(d.data_prima), ds = data(d.data_seconda), da = data(d.data_avviso);
  if (dp && da) {
    const g = giorniTra(da, dp);
    const min = R.avviso_cinque_giorni.giorni;
    fonti.push(fonte('avviso_cinque_giorni'));
    if (g < min) voci.push({ esito: 'no', titolo: `Avviso arrivato ${g < 0 ? 'dopo la riunione' : `solo ${g} giorni prima`}`, spiegazione: `${R.avviso_cinque_giorni.testo} Chi non è stato convocato in tempo può chiedere l'annullamento entro 30 giorni.` });
    else if (g === min) voci.push({ esito: 'forse', titolo: 'Avviso arrivato esattamente 5 giorni prima', spiegazione: 'È al limite: la legge non dice se i cinque giorni devono essere «liberi», cioè senza contare il giorno di arrivo e quello della riunione.' });
    else voci.push({ esito: 'si', titolo: `Avviso arrivato ${g} giorni prima`, spiegazione: 'Rispetta i cinque giorni di preavviso.' });
  }
  if (conv === 'seconda' && dp && ds) {
    const g = giorniTra(dp, ds);
    fonti.push(fonte('seconda_quando'), fonte('seconda_non_stesso_giorno'));
    if (g <= 0) voci.push({ esito: 'no', titolo: 'Seconda convocazione nello stesso giorno della prima o prima', spiegazione: `${R.seconda_non_stesso_giorno.testo} ${R.seconda_quando.testo}` });
    else if (g > R.seconda_quando.giorni) voci.push({ esito: 'no', titolo: `Seconda convocazione ${g} giorni dopo la prima`, spiegazione: R.seconda_quando.testo });
    else voci.push({ esito: 'si', titolo: `Seconda convocazione ${g} giorni dopo la prima`, spiegazione: 'Entro i dieci giorni previsti.' });
  }

  // esito complessivo
  let valida = null;
  if (costituita?.esito === false) valida = false;
  else if (costituita?.esito === true && approvata?.esito !== null && approvata) valida = approvata.esito;
  if (incoerenze.length) valida = null;

  const T1 = (x) => fmtNum(x);
  let verdetto;
  if (incoerenze.length) verdetto = { tono: 'dato', titolo: 'Ricontrolla i numeri', testo: 'Con questi dati il calcolo non ha senso: confrontali con il verbale.' };
  else if (costituita?.esito === false) verdetto = { tono: 'no', titolo: `L'assemblea non era costituita in ${conv} convocazione`, testo: `${costituita.testo} Servivano almeno ${T1(costituita.millesimi.servono)} millesimi${costituita.teste.servono !== null ? ` e ${costituita.teste.servono} condòmini` : ''}: c'erano ${PM !== null ? T1(PM) : '?'} millesimi e ${P ?? '?'} condòmini. Una delibera presa così si può impugnare.` };
  else if (valida === true) verdetto = { tono: 'si', titolo: 'La delibera ha la maggioranza richiesta', testo: `${approvata.testo} Favorevoli: ${F} condòmini e ${T1(FM)} millesimi; ne servivano ${approvata.teste.servono} e ${T1(approvata.millesimi.servono)}.` };
  else if (valida === false) verdetto = { tono: 'no', titolo: 'La delibera non ha la maggioranza richiesta', testo: `${approvata.testo} Favorevoli: ${F} condòmini e ${T1(FM)} millesimi; ne servivano ${approvata.teste.servono} e ${T1(approvata.millesimi.servono)}. Se è stata dichiarata approvata, puoi impugnarla entro 30 giorni.` };
  else verdetto = { tono: 'dato', titolo: 'Servono altri dati', testo: 'Inserisci i numeri del verbale: condòmini e millesimi presenti e favorevoli, tipo di decisione e convocazione.' };

  return { tipo: tipo ? { id: tipo.id, etichetta: tipo.etichetta } : null, convocazione: conv, totale_millesimi: T, costituita, approvata, valida, verdetto, voci, mancano, fonti: unici(fonti) };
}

// ---------- le situazioni ----------

const NULLITA = ['criteri_spese', 'diritti_individuali', 'fuori_competenza', 'oggetto_illecito'];

function nuovoEsito(caso) {
  return { caso, verdetto: null, voci: [], scadenze: [], passi: [], fonti: [], documento: null, calcolo: null };
}

function impugnare(s, e, oggi) {
  const scad = scadenziere(e, oggi);
  e.fonti.push(fonte('impugnazione_30'), fonte('sospensione_feriale'), fonte('computo_termini'), fonte('mediazione_obbligatoria'), fonte('mediazione_condominio'), fonte('mediazione_decadenza'), fonte('mediazione_dopo'), fonte('mediazione_come'), fonte('impugnazione_sospensione'));
  const nulla = NULLITA.includes(s.vizio);
  if (s.vizio) e.fonti.push(fonte('nulle_annullabili'));
  if (s.vizio === 'convocazione') e.fonti.push(fonte('avviso_cinque_giorni'));
  if (!s.vizio) e.voci.push({ esito: 'dato', titolo: 'Qual è il problema della delibera?', spiegazione: 'Da questo dipende se la delibera è annullabile (30 giorni per agire) o nulla (senza termine).', dato: 'vizio' });
  if (!s.voto) e.voci.push({ esito: 'dato', titolo: 'Come hai votato?', spiegazione: 'Può impugnare solo chi era assente, contrario o astenuto; e i 30 giorni partono da date diverse.', dato: 'voto' });
  if (s.vizio === 'maggioranza') e.voci.push({ esito: 'forse', titolo: 'Controlla i numeri', spiegazione: 'Scegli «Voglio sapere se una delibera è passata con la maggioranza giusta» per rifare il conto con i dati del verbale.' });

  const inizio = s.voto === 'assente' ? s.data_comunicazione : ['contrario', 'astenuto'].includes(s.voto) ? s.data_assemblea : null;
  if (s.voto === 'assente' && !s.data_comunicazione) e.voci.push({ esito: 'dato', titolo: 'Quando hai ricevuto il verbale?', spiegazione: 'Per chi era assente i 30 giorni partono da quando gli è arrivata la comunicazione della delibera. Se non l\'hai ricevuta, il termine non è ancora partito: chiedi il verbale all\'amministratore.', dato: 'data_comunicazione' });
  if (['contrario', 'astenuto'].includes(s.voto) && !s.data_assemblea) e.voci.push({ esito: 'dato', titolo: 'Quando si è tenuta l\'assemblea?', spiegazione: 'Per chi era presente e ha votato contro o si è astenuto i 30 giorni partono dal giorno della delibera.', dato: 'data_assemblea' });

  const t = inizio ? termineImpugnazione(inizio) : null;
  const fine = t ? data(t.scadenza) : null;
  if (t?.sospesa) e.voci.push({ esito: 'si', titolo: 'Agosto non si conta', spiegazione: `${R.sospensione_feriale.testo} Senza la sospensione la scadenza sarebbe stata il ${lungo(data(t.senzaSospensione))}.` });
  if (t?.slittata) e.voci.push({ esito: 'si', titolo: 'Il trentesimo giorno è festivo', spiegazione: R.computo_termini.testo });
  if (fine && data(t.scadenza).getUTCDay() === 6) e.voci.push({ esito: 'forse', titolo: 'La scadenza cade di sabato', spiegazione: 'Per prudenza la consideriamo valida così, senza spostarla al lunedì.' });

  let verdetto;
  if (s.mediazione === 'accordo') {
    verdetto = { tono: 'si', titolo: 'La mediazione si è chiusa con un accordo', testo: 'Se l\'accordo coinvolge il condominio deve essere approvato dall\'assemblea entro il termine fissato, altrimenti la conciliazione non è conclusa.' };
    e.fonti.push(fonte('mediazione_amministratore'));
  } else if (s.voto === 'favorevole' && !nulla) {
    verdetto = { tono: 'no', titolo: 'Hai votato a favore: non puoi chiederne l\'annullamento', testo: `${R.impugnazione_30.testo} Resta possibile far valere la nullità se la delibera rientra nei casi di nullità.` };
  } else if (nulla) {
    verdetto = { tono: 'forse', titolo: 'Potrebbe essere una delibera nulla: non c\'è il termine di 30 giorni', testo: `${R.nulle_annullabili.testo} La nullità può farla valere chiunque vi abbia interesse, ma decidere se è nulla spetta al giudice: per prudenza muoviti entro i 30 giorni${fine ? `, cioè entro il ${lungo(fine)}` : ''}. Anche qui serve prima la mediazione.` };
  } else if (s.mediazione === 'depositata') {
    verdetto = { tono: 'si', titolo: 'Mediazione avviata', testo: `${R.mediazione_decadenza.testo} Conta che la comunicazione sia arrivata al condominio${fine ? ` entro il ${lungo(fine)}` : ' entro i 30 giorni'}. Se la mediazione finisce senza accordo, avrai 30 giorni dal deposito del verbale per la causa.` };
  } else if (fine && fine < oggi) {
    verdetto = { tono: 'no', titolo: `I 30 giorni sono finiti il ${lungo(fine)}`, testo: 'Per una delibera annullabile il termine è perentorio: passato, la delibera resta valida. Se però il vizio è uno dei casi di nullità, il termine non vale.' };
  } else if (fine) {
    verdetto = { tono: 'si', titolo: `Hai tempo fino al ${lungo(fine)}`, testo: `Entro quella data la domanda di mediazione deve arrivare al condominio, cioè all'amministratore. ${R.mediazione_decadenza.testo} La lettera all'amministratore, da sola, non ferma il termine.` };
  } else {
    verdetto = { tono: 'dato', titolo: 'Hai 30 giorni per contestare una delibera annullabile', testo: R.impugnazione_30.testo };
  }
  if (fine && !(s.voto === 'favorevole' && !nulla)) scad(fine, nulla ? 'Per prudenza: 30 giorni per impugnare la delibera' : 'Ultimo giorno per impugnare la delibera', 'La domanda di mediazione deve arrivare al condominio entro questa data. Agosto non si conta; se il giorno è festivo si va al primo giorno non festivo.');

  if (s.mediazione === 'depositata') {
    e.voci.push({ esito: 'si', titolo: 'Mediazione avviata', spiegazione: R.mediazione_come.testo });
  }
  if (s.mediazione === 'senza_accordo') {
    if (s.data_verbale_mediazione) {
      const t2 = termineImpugnazione(s.data_verbale_mediazione);
      const f2 = data(t2.scadenza);
      scad(f2, 'Ultimo giorno per iniziare la causa dopo la mediazione', R.mediazione_dopo.testo);
      verdetto = f2 < oggi
        ? { tono: 'no', titolo: `Il termine per la causa è finito il ${lungo(f2)}`, testo: R.mediazione_dopo.testo }
        : { tono: 'si', titolo: `La causa va iniziata entro il ${lungo(f2)}`, testo: `${R.mediazione_dopo.testo} Serve un avvocato.` };
    } else e.voci.push({ esito: 'dato', titolo: 'Quando è stato depositato il verbale della mediazione?', spiegazione: R.mediazione_dopo.testo, dato: 'data_verbale_mediazione' });
  }
  e.verdetto = verdetto;

  if (s.voto === 'assente') e.passi.push({ titolo: 'Procurati il verbale', testo: R.registri_visione.testo });
  e.passi.push(
    { titolo: 'Scrivi all\'amministratore', testo: 'Contesta la delibera per iscritto e chiedi che l\'assemblea la riesamini. È utile, ma non ferma i 30 giorni.' },
    { titolo: 'Rivolgiti a un avvocato e deposita la domanda di mediazione', testo: `${R.mediazione_obbligatoria.testo} ${R.mediazione_come.testo}` },
    { titolo: 'Se la mediazione non riesce', testo: R.mediazione_dopo.testo },
    { titolo: 'Se la delibera sta per essere eseguita', testo: R.impugnazione_sospensione.testo },
  );
  e.documento = s.voto === 'favorevole' && !nulla ? null : { tipo: 'contestazione', nulla, fine: fine ? iso(fine) : null };
}

function delibera(s, e) {
  const m = maggioranze(s);
  e.calcolo = m;
  e.verdetto = m.verdetto;
  e.voci.push(...m.voci);
  e.fonti.push(...m.fonti);
  if (m.valida === false) {
    e.passi.push({ titolo: 'Puoi impugnarla', testo: `Una delibera presa senza la maggioranza richiesta è annullabile. ${R.impugnazione_30.testo} Scegli «Voglio contestare una delibera» per calcolare la scadenza.` });
    e.fonti.push(fonte('impugnazione_30'));
  }
  e.passi.push({ titolo: 'Controlla anche la convocazione', testo: `${R.convocati_tutti.testo} ${R.avviso_cinque_giorni.testo}` }, { titolo: 'Le deleghe', testo: R.deleghe.testo });
  e.fonti.push(fonte('convocati_tutti'), fonte('deleghe'));
  if (m.valida === false) e.voci.push({ esito: 'forse', titolo: 'Casi speciali', spiegazione: R.recupero_dl32.testo });
}

function documenti(s, e, oggi) {
  const scad = scadenziere(e, oggi);
  e.fonti.push(fonte('registri_visione'), fonte('giustificativi'), fonte('conto_corrente'), fonte('attestazione_pagamenti'), fonte('rendiconto_180'), fonte('rendiconto_contenuto'), fonte('registri_tenuta'));
  e.verdetto = { tono: 'si', titolo: 'Hai diritto di vedere i conti e i documenti', testo: `${R.giustificativi.testo} ${R.registri_visione.testo}` };
  if (s.documenti_cosa === 'attestazione') e.verdetto = { tono: 'si', titolo: 'L\'amministratore deve darti l\'attestazione', testo: R.attestazione_pagamenti.testo };
  if (s.documenti_cosa === 'conto') e.verdetto = { tono: 'si', titolo: 'Puoi vedere i movimenti del conto del condominio', testo: R.conto_corrente.testo };
  if (s.documenti_cosa === 'rendiconto') e.verdetto = { tono: 'si', titolo: 'Il rendiconto va presentato ogni anno', testo: `${R.rendiconto_180.testo} ${R.rendiconto_contenuto.testo}` };
  if (s.data_chiusura_esercizio) {
    const lim = scadenza(s.data_chiusura_esercizio, R.rendiconto_180.giorni);
    scad(lim, 'Entro oggi l\'amministratore deve convocare l\'assemblea per il rendiconto', '180 giorni dalla chiusura dell\'esercizio (art. 1130, n. 10, c.c.).');
    if (lim < oggi && s.rendiconto_convocato === false) {
      e.verdetto = { tono: 'no', titolo: `Il rendiconto andava portato in assemblea entro il ${lungo(lim)}`, testo: `Non convocare l'assemblea per il rendiconto è una grave irregolarità: ciascun condòmino può chiedere al giudice la revoca dell'amministratore. ${R.gravi_irregolarita.testo}` };
      e.fonti.push(fonte('gravi_irregolarita'), fonte('revoca_giudiziale'));
    }
  } else if (s.documenti_cosa === 'rendiconto') e.voci.push({ esito: 'dato', titolo: 'Quando si chiude l\'esercizio?', spiegazione: 'Di solito è scritto nel preventivo o nel rendiconto dell\'anno prima. Serve per calcolare i 180 giorni.', dato: 'data_chiusura_esercizio' });
  e.voci.push({ esito: 'forse', titolo: 'Nessun termine per rispondere', spiegazione: 'La legge non fissa un termine entro cui l\'amministratore deve mostrarti i documenti: chiedi un appuntamento nei giorni e orari che ha comunicato. Le copie sono a tue spese.' });
  if (s.data_richiesta && s.risposta && s.risposta !== 'si') {
    e.voci.push({ esito: 'no', titolo: s.risposta === 'parziale' ? 'Risposta incompleta' : 'Nessuna risposta', spiegazione: `Non mostrare i registri o non dare l'attestazione dei pagamenti è una grave irregolarità (art. 1129, comma 12, n. 7). Puoi sollecitare, chiedere un'assemblea o chiedere al giudice la revoca dell'amministratore.` });
    e.fonti.push(fonte('gravi_irregolarita'), fonte('revoca_giudiziale'));
    e.documento = { tipo: 'documenti', sollecito: true };
  } else e.documento = { tipo: 'documenti', sollecito: false };
  if (s.risposta === 'si') { e.verdetto = { tono: 'si', titolo: 'Hai ottenuto i documenti', testo: 'Conserva le copie. Se trovi spese che non ti tornano, chiedi spiegazioni per iscritto e portale in assemblea; l\'assemblea può nominare un revisore dei conti.' }; e.documento = null; }
  e.passi.push({ titolo: 'Chiedi per iscritto', testo: 'Manda la richiesta per PEC o raccomandata, indicando cosa vuoi vedere e di quali anni.' }, { titolo: 'Porta le domande in assemblea', testo: R.rendiconto_contenuto.testo });
}

function assemblea(s, e, oggi) {
  const scad = scadenziere(e, oggi);
  const T = pos(s.totale_millesimi) || 1000;
  const r = R.assemblea_richiesta;
  e.fonti.push(fonte('assemblea_richiesta'), fonte('avviso_cinque_giorni'), fonte('seconda_quando'), fonte('seconda_non_stesso_giorno'));
  const n = pos(s.richiedenti), m = pos(s.millesimi_richiedenti);
  const sesto = (T * r.millesimi[0]) / r.millesimi[1];

  if (s.amministratore_presente === false) {
    e.fonti.push(fonte('assemblea_senza_amministratore'), fonte('nomina_giudiziale'));
    e.verdetto = { tono: 'si', titolo: 'Senza amministratore puoi convocarla tu', testo: R.assemblea_senza_amministratore.testo };
    const N = pos(s.partecipanti);
    if (N !== null && N > R.nomina_giudiziale.teste) e.voci.push({ esito: 'forse', titolo: `Siete ${N} condòmini: l'amministratore è obbligatorio`, spiegazione: R.nomina_giudiziale.testo });
    e.documento = { tipo: 'avviso_convocazione', motivo: s.motivo_assemblea || 'generale' };
  } else if (['innovazioni_agevolate', 'barriere'].includes(s.motivo_assemblea)) {
    const rr = R.innovazioni_richiesta_30;
    e.fonti.push(fonte('innovazioni_richiesta_30'));
    e.verdetto = { tono: 'si', titolo: 'Basta la tua richiesta: l\'amministratore deve convocare entro 30 giorni', testo: rr.testo };
    if (s.data_richiesta) scad(scadenza(s.data_richiesta, rr.giorni), 'Entro oggi l\'amministratore deve convocare l\'assemblea', 'Per le innovazioni agevolate basta la richiesta di un condòmino (art. 1120, comma 3, c.c.).');
    if (s.motivo_assemblea === 'barriere') {
      e.fonti.push(fonte('barriere_legge13'));
      e.voci.push({ esito: 'si', titolo: 'Barriere architettoniche: tre mesi', spiegazione: R.barriere_legge13.testo });
      if (s.data_richiesta) scad(aggiungiMesi(s.data_richiesta, R.barriere_legge13.mesi), 'Tre mesi dalla richiesta per le barriere architettoniche', 'Se il condominio non ha deliberato, chi ha una disabilità può installare a proprie spese servoscala e strutture mobili (L. 13/1989, art. 2).');
    }
    e.documento = { tipo: 'richiesta_assemblea', motivo: s.motivo_assemblea };
  } else if (s.motivo_assemblea === 'irregolarita') {
    e.fonti.push(fonte('revoca_fiscale_conto'));
    e.verdetto = { tono: 'si', titolo: 'Puoi chiederla anche da solo', testo: R.revoca_fiscale_conto.testo };
    e.documento = { tipo: 'richiesta_assemblea', motivo: 'irregolarita' };
  } else {
    const okN = n !== null ? n >= r.teste : null;
    const okM = m !== null ? frazioneOk(m, T, r.millesimi) : null;
    if (s.motivo_assemblea === 'ricarica') {
      e.fonti.push(fonte('ricarica'));
      e.voci.push({ esito: 'si', titolo: 'Punti di ricarica: tre mesi', spiegazione: R.ricarica.testo });
      if (s.data_richiesta) scad(aggiungiMesi(s.data_richiesta, R.ricarica.mesi), 'Tre mesi dalla richiesta per il punto di ricarica', 'Se il condominio non ha deliberato, puoi installarlo a tue spese (d.l. 83/2012, art. 17-quinquies).');
    }
    if (okN === null || okM === null) {
      e.verdetto = { tono: 'dato', titolo: `Servono almeno ${r.teste} condòmini con ${fmtNum(sesto)} millesimi`, testo: r.testo };
      if (n === null) e.voci.push({ esito: 'dato', titolo: 'Quanti siete a chiederla?', spiegazione: 'Contate le persone che firmano la richiesta.', dato: 'richiedenti' });
      if (m === null) e.voci.push({ esito: 'dato', titolo: 'Quanti millesimi avete insieme?', spiegazione: 'Sommate i millesimi di proprietà dalla tabella.', dato: 'millesimi_richiedenti' });
    } else if (okN && okM) {
      e.verdetto = { tono: 'si', titolo: 'Avete i numeri per chiederla', testo: `${n} condòmini con ${fmtNum(m)} millesimi su ${fmtNum(T)}: ne servono almeno ${r.teste} con ${fmtNum(sesto)}. ${r.testo}` };
      e.documento = { tipo: 'richiesta_assemblea', motivo: s.motivo_assemblea || 'generale' };
      if (s.data_richiesta) {
        const lim = scadenza(s.data_richiesta, r.giorni);
        scad(lim, 'Finiscono i 10 giorni per l\'amministratore', 'Se non ha convocato l\'assemblea, dal giorno dopo potete convocarla voi (art. 66 disp. att. c.c.).');
        if (lim < oggi && s.convocata === false) {
          e.verdetto = { tono: 'si', titolo: 'L\'amministratore non ha convocato: potete farlo voi', testo: `Sono passati i 10 giorni dalla richiesta. ${R.avviso_cinque_giorni.testo}` };
          e.documento = { tipo: 'avviso_convocazione', motivo: s.motivo_assemblea || 'generale' };
          e.fonti.push(fonte('gravi_irregolarita'));
          e.voci.push({ esito: 'forse', titolo: 'Rifiuti ripetuti', spiegazione: 'Il ripetuto rifiuto di convocare l\'assemblea per revoca e nomina, o negli altri casi previsti dalla legge, è una grave irregolarità (art. 1129, comma 12, n. 1).' });
        }
      }
    } else {
      e.verdetto = { tono: 'no', titolo: 'Non avete ancora i numeri', testo: `Servono almeno ${r.teste} condòmini con ${fmtNum(sesto)} millesimi su ${fmtNum(T)}; voi siete ${n} con ${fmtNum(m)}. Cercate altri condòmini che firmino con voi. Puoi sempre chiedere all'amministratore di inserire un punto nell'ordine del giorno dell'assemblea ordinaria.` };
    }
  }
  e.passi.push({ titolo: 'La convocazione', testo: `${R.avviso_cinque_giorni.testo} ${R.seconda_non_stesso_giorno.testo} ${R.seconda_quando.testo}` }, { titolo: 'In videoconferenza', testo: R.videoconferenza.testo });
  e.fonti.push(fonte('videoconferenza'));
}

const SPESE = {
  generali: 'spese_millesimi', uso: 'spese_uso', gruppo: 'spese_gruppo', scale_ascensore: 'scale_ascensore',
  lastrico: 'lastrico_esclusivo', solaio: 'solai', balcone: 'balconi', riscaldamento: 'distacco_riscaldamento',
};

function spese(s, e) {
  const id = SPESE[s.voce_spesa];
  if (!id) { e.verdetto = { tono: 'dato', titolo: 'Che spesa è?', testo: 'Le regole cambiano tra spese generali, scale e ascensore, lastrico solare, solai, balconi e impianti che servono solo una parte dell\'edificio.' }; e.voci.push({ esito: 'dato', titolo: 'Scegli la spesa', spiegazione: 'Dalla spesa dipende la regola.', dato: 'voce_spesa' }); return; }
  const r = R[id];
  e.fonti.push(fonte(id), fonte('spese_millesimi'), fonte('millesimi_tabella'));
  const I = pos(s.importo), T = pos(s.totale_millesimi) || 1000, M = pos(s.millesimi);
  const calc = { importo: I, quota: null, righe: [] };
  const serve = (dato, titolo, spiegazione) => e.voci.push({ esito: 'dato', titolo, spiegazione, dato });
  if (I === null && !['balcone', 'riscaldamento', 'uso'].includes(s.voce_spesa)) serve('importo', 'Quanto costa la spesa?', 'L\'importo totale da dividere.');

  let titolo = 'La regola';
  if (s.voce_spesa === 'generali' || (s.voce_spesa === 'lastrico' && s.lastrico_uso === 'comune')) {
    if (s.voce_spesa === 'lastrico') e.fonti.push(fonte('spese_millesimi'));
    if (M === null) serve('millesimi', 'Quanti millesimi hai?', 'Li trovi nella tabella millesimale di proprietà, allegata al regolamento o nel rendiconto.');
    if (I !== null && M !== null) { calc.quota = (I * M) / T; calc.righe.push(`${fmtEur(I)} × ${fmtNum(M)} / ${fmtNum(T)} millesimi`); }
  } else if (s.voce_spesa === 'gruppo') {
    const S = pos(s.millesimi_serviti);
    if (M === null) serve('millesimi', 'Quanti millesimi hai?', 'I tuoi millesimi di proprietà.');
    if (S === null) serve('millesimi_serviti', 'Quanti millesimi hanno, insieme, le unità servite?', 'La somma dei millesimi di chi usa quella scala, quel cortile o quell\'impianto.');
    if (I !== null && M !== null && S) { calc.quota = (I * M) / S; calc.righe.push(`${fmtEur(I)} × ${fmtNum(M)} / ${fmtNum(S)} millesimi del gruppo`); }
  } else if (s.voce_spesa === 'scale_ascensore') {
    const MS = pos(s.millesimi_scale), TS = pos(s.totale_scale) || 1000;
    if (MS === null) serve('millesimi_scale', 'Quanti millesimi hai nella tabella scale o ascensore?', 'Di solito il regolamento ha una tabella apposita che applica già la regola: metà per valore, metà per altezza del piano. Senza la tabella non possiamo fare il conto.');
    if (I !== null && MS !== null) { calc.quota = (I * MS) / TS; calc.righe.push(`${fmtEur(I)} × ${fmtNum(MS)} / ${fmtNum(TS)} millesimi della tabella scale`); }
  } else if (s.voce_spesa === 'lastrico') {
    const S = pos(s.millesimi_serviti) || T;
    const utenti = pos(s.utenti_esclusivi) || 1;
    if (!s.lastrico_uso) serve('lastrico_uso', 'Chi usa il lastrico?', 'Se lo usi solo tu, se lo usa un altro condòmino o se è di uso comune.');
    if (M === null) serve('millesimi', 'Quanti millesimi hai?', 'I tuoi millesimi di proprietà.');
    if (I !== null && M !== null && s.lastrico_uso) {
      const due = (I * 2) / 3 * (M / S);
      const uno = s.lastrico_uso === 'mio' ? I / 3 / utenti : 0;
      calc.quota = uno + due;
      if (uno) calc.righe.push(`un terzo per l'uso esclusivo: ${fmtEur(I)} / 3${utenti > 1 ? ` / ${utenti}` : ''} = ${fmtEur(uno)}`);
      calc.righe.push(`due terzi per millesimi: ${fmtEur(I)} × 2/3 × ${fmtNum(M)} / ${fmtNum(S)} = ${fmtEur(due)}`);
    }
  } else if (s.voce_spesa === 'solaio') {
    if (I !== null) { calc.quota = I / 2; calc.righe.push(`${fmtEur(I)} / 2 tra il piano di sopra e quello di sotto`); }
    e.voci.push({ esito: 'si', titolo: s.piano_solaio === 'sotto' ? 'A tuo carico anche intonaco e tinta del soffitto' : s.piano_solaio === 'sopra' ? 'A tuo carico anche il pavimento' : 'Pavimento e soffitto', spiegazione: r.testo });
  }
  if (calc.quota !== null) {
    calc.quota = Math.round(calc.quota * 100) / 100;
    titolo = `La tua quota: ${fmtEur(calc.quota)}`;
    e.calcolo = calc;
  }
  e.verdetto = { tono: calc.quota !== null ? 'si' : ['balcone', 'riscaldamento', 'uso', 'solaio'].includes(s.voce_spesa) ? 'forse' : 'dato', titolo, testo: r.testo };
  if (s.voce_spesa === 'riscaldamento') e.voci.push({ esito: 'forse', titolo: 'Spetta a te dimostrarlo', spiegazione: 'Di solito serve una relazione tecnica che mostri che il distacco non crea squilibri né aggravi di spesa.' });
  if (s.voce_spesa === 'uso') e.voci.push({ esito: 'forse', titolo: 'Serve la tabella d\'uso', spiegazione: 'Per acqua, riscaldamento o altri servizi divisi a consumo valgono le tabelle o i contatori indicati nel regolamento.' });
  e.voci.push({ esito: 'forse', titolo: 'Salvo diversa convenzione', spiegazione: 'Un regolamento contrattuale (accettato da tutti, per esempio negli atti di acquisto) può dividere le spese in modo diverso. Cambiare i criteri a maggioranza rende la delibera nulla.' });
  e.fonti.push(fonte('nulle_annullabili'), fonte('non_rinuncia'));
  e.passi.push({ titolo: 'Controlla il riparto', testo: 'Confronta la tua quota con il preventivo o il rendiconto. Se l\'assemblea ha approvato un riparto sbagliato, la delibera è annullabile entro 30 giorni.' });
}

function morosita(s, e, oggi) {
  const scad = scadenziere(e, oggi);
  const r = R.sospensione_servizi;
  e.fonti.push(fonte('sospensione_servizi'), fonte('decreto_ingiuntivo'), fonte('creditori_prima_morosi'), fonte('subentro'), fonte('riscossione_6_mesi'), fonte('mediazione_esclusioni'));
  const da = s.data_scadenza_rata ? aggiungiMesi(s.data_scadenza_rata, r.mesi) : null;
  if (s.ruolo === 'io') {
    e.verdetto = da && da > oggi
      ? { tono: 'si', titolo: `Fino al ${lungo(da)} non possono sospenderti i servizi`, testo: `${r.testo} Usa questo tempo per pagare o chiedere di rateizzare.` }
      : { tono: 'forse', titolo: 'Dopo sei mesi di ritardo possono sospenderti alcuni servizi', testo: `${r.testo} ${R.decreto_ingiuntivo.testo}` };
    if (!s.data_scadenza_rata) e.voci.push({ esito: 'dato', titolo: 'Da quando sei in ritardo?', spiegazione: 'La data di scadenza della prima rata non pagata: da lì si contano i sei mesi.', dato: 'data_scadenza_rata' });
    if (da) scad(da, 'Da oggi l\'amministratore può sospenderti i servizi separabili', 'Sei mesi di ritardo nei pagamenti (art. 63, comma 3, disp. att. c.c.).');
    if (s.sospeso === true && s.data_sospensione && da && data(s.data_sospensione) < da) e.voci.push({ esito: 'no', titolo: 'Sospensione prima dei sei mesi', spiegazione: 'La sospensione è arrivata prima che il ritardo durasse sei mesi: è un segnale da contestare per iscritto all\'amministratore.' });
    e.voci.push({ esito: 'forse', titolo: 'Quali servizi', spiegazione: 'Solo quelli che si possono godere separatamente. La legge non li elenca: su servizi essenziali come l\'acqua i giudici hanno deciso in modi diversi.' });
    e.voci.push({ esito: 'forse', titolo: 'Se ti arriva un decreto ingiuntivo', spiegazione: `${R.decreto_ingiuntivo.testo} Per opporti c'è un termine scritto nel decreto: rivolgiti subito a un avvocato o a un'associazione di consumatori.` });
    e.documento = { tipo: 'rateizzazione' };
    e.passi.push({ titolo: 'Chiedi lo stato dei pagamenti', testo: R.attestazione_pagamenti.testo }, { titolo: 'Proponi un piano di rientro', testo: 'Per iscritto, con importi e date che puoi rispettare. Decide l\'amministratore o l\'assemblea.' }, { titolo: 'Se vendi o compri casa', testo: R.subentro.testo });
    e.fonti.push(fonte('attestazione_pagamenti'));
  } else if (s.ruolo === 'altro') {
    const lim = s.data_chiusura_esercizio ? aggiungiMesi(s.data_chiusura_esercizio, R.riscossione_6_mesi.mesi) : null;
    e.verdetto = { tono: 'si', titolo: lim ? `L'amministratore deve agire contro i morosi entro il ${lungo(lim)}` : 'L\'amministratore deve agire contro i morosi entro sei mesi dalla chiusura dell\'esercizio', testo: `${R.riscossione_6_mesi.testo} ${R.decreto_ingiuntivo.testo}` };
    if (lim) scad(lim, 'Entro oggi l\'amministratore deve agire contro i morosi', 'Sei mesi dalla chiusura dell\'esercizio, salvo dispensa dell\'assemblea (art. 1129, comma 9, c.c.).');
    else e.voci.push({ esito: 'dato', titolo: 'Quando si è chiuso l\'esercizio?', spiegazione: 'Serve per calcolare i sei mesi.', dato: 'data_chiusura_esercizio' });
    if (lim && lim < oggi) e.voci.push({ esito: 'forse', titolo: 'I sei mesi sono passati', spiegazione: 'Chiedi all\'amministratore quali azioni ha avviato. Se ha avviato una causa e non la segue con diligenza è una grave irregolarità (art. 1129, comma 12, n. 6).' });
    e.voci.push({ esito: 'si', titolo: 'Se sei in regola, i creditori devono prima rivolgersi ai morosi', spiegazione: R.creditori_prima_morosi.testo });
    if (da) scad(da, 'Da oggi l\'amministratore può sospendere i servizi al moroso', 'Sei mesi di ritardo (art. 63, comma 3, disp. att. c.c.).');
    e.documento = { tipo: 'morosi' };
    e.passi.push({ titolo: 'Chiedi conto all\'amministratore', testo: 'Per iscritto: quanto manca, quali solleciti e quali azioni ha avviato.' }, { titolo: 'Porta la questione in assemblea', testo: 'Il rendiconto deve indicare i rapporti in corso e le questioni pendenti.' });
    e.fonti.push(fonte('rendiconto_contenuto'), fonte('gravi_irregolarita'));
  } else {
    e.verdetto = { tono: 'dato', titolo: 'Sei tu in ritardo o un altro condòmino?', testo: r.testo };
    e.voci.push({ esito: 'dato', titolo: 'Chi è in ritardo?', spiegazione: 'Le regole sono le stesse, ma i passi cambiano.', dato: 'ruolo' });
  }
  e.voci.push({ esito: 'forse', titolo: 'Niente mediazione per il decreto ingiuntivo', spiegazione: R.mediazione_esclusioni.testo });
}

const GIUDIZIALI = ['rendiconto', 'registri', 'confusione', 'delibere', 'riscossione', 'citazione', 'dati', 'conto', 'fiscale'];

function amministratore(s, e, oggi) {
  const scad = scadenziere(e, oggi);
  const p = s.problema_amministratore;
  e.fonti.push(fonte('revoca_assemblea'), fonte('revoca_giudiziale'), fonte('gravi_irregolarita'), fonte('revoca_procedimento'), fonte('attribuzioni'), fonte('durata_incarico'), fonte('compenso'), fonte('consegna_documenti'), fonte('mediazione_esclusioni'));
  if (!p) { e.verdetto = { tono: 'dato', titolo: 'Cosa non va?', testo: R.attribuzioni.testo }; e.voci.push({ esito: 'dato', titolo: 'Scegli il problema', spiegazione: 'Alcuni casi permettono di chiedere la revoca al giudice, altri solo all\'assemblea.', dato: 'problema_amministratore' }); }
  else if (p === 'fiducia') {
    e.verdetto = { tono: 'forse', titolo: 'Senza gravi irregolarità la revoca la decide l\'assemblea', testo: `${R.revoca_assemblea.testo} ${R.durata_incarico.testo}` };
    e.passi.push({ titolo: 'Chiedete l\'assemblea', testo: R.assemblea_richiesta.testo });
    e.fonti.push(fonte('assemblea_richiesta'));
    e.documento = { tipo: 'revoca', problema: p };
  } else if (['conto', 'fiscale'].includes(p)) {
    e.fonti.push(fonte('revoca_fiscale_conto'), fonte('conto_corrente'));
    e.verdetto = { tono: 'si', titolo: 'Puoi chiedere da solo l\'assemblea per la revoca, poi il giudice', testo: R.revoca_fiscale_conto.testo };
    e.documento = { tipo: 'revoca', problema: p };
  } else if (GIUDIZIALI.includes(p)) {
    e.verdetto = { tono: 'si', titolo: 'Può essere una grave irregolarità: puoi chiedere la revoca al giudice', testo: `${R.revoca_giudiziale.testo} ${R.gravi_irregolarita.testo}` };
    e.documento = { tipo: 'revoca', problema: p };
  }
  if (p && p !== 'fiducia') {
    e.passi.push({ titolo: 'Prima scrivi e chiedi l\'assemblea', testo: `Contesta per iscritto all'amministratore cosa non va e chiedi la convocazione dell'assemblea con la revoca all'ordine del giorno. ${R.revoca_assemblea.testo}` });
    e.passi.push({ titolo: 'Il ricorso al giudice', testo: `${R.revoca_procedimento.testo} Non serve la mediazione: è un procedimento in camera di consiglio. Conviene farsi assistere da un avvocato.` });
    e.voci.push({ esito: 'forse', titolo: 'Tribunale o giudice di pace', spiegazione: 'A novembre 2026 decide il tribunale. Il passaggio al giudice di pace è stato rinviato al 31 ottobre 2027 (d.l. 100/2026): controlla prima di depositare.' });
  }
  if (s.data_richiesta) {
    scad(scadenza(s.data_richiesta, R.assemblea_richiesta.giorni), 'Finiscono i 10 giorni per convocare l\'assemblea', 'Se la richiesta l\'avete fatta in almeno due con un sesto del valore e l\'amministratore non convoca, potete convocarla voi.');
  }
  if (s.assemblea_esito === 'non_revocato') e.voci.push({ esito: 'si', titolo: 'L\'assemblea non lo ha revocato', spiegazione: ['conto', 'fiscale'].includes(p) ? 'Ora ciascun condòmino può rivolgersi al giudice; se vince, si rivale sul condominio per le spese legali.' : 'Nei casi di gravi irregolarità puoi comunque rivolgerti al giudice.' });
  e.voci.push({ esito: 'si', titolo: 'Gli obblighi dell\'amministratore', spiegazione: `${R.attribuzioni.testo} ${R.compenso.testo} ${R.consegna_documenti.testo}` });
}

function lavoriUrgenti(s, e) {
  e.fonti.push(fonte('spesa_urgente'), fonte('straordinaria_amministratore'), fonte('spese_millesimi'));
  const I = pos(s.importo), T = pos(s.totale_millesimi) || 1000, M = pos(s.millesimi);
  const altri = I !== null && M !== null ? Math.round(I * (1 - M / T) * 100) / 100 : null;
  if (altri !== null) e.calcolo = { importo: I, quota: Math.round((I * M / T) * 100) / 100, rimborso: altri, righe: [`la tua quota: ${fmtEur(I)} × ${fmtNum(M)} / ${fmtNum(T)} = ${fmtEur(Math.round((I * M / T) * 100) / 100)}`, `da chiedere agli altri: ${fmtEur(altri)}`] };
  if (I === null) e.voci.push({ esito: 'dato', titolo: 'Quanto hai speso?', spiegazione: 'L\'importo delle fatture o ricevute.', dato: 'importo' });
  if (M === null) e.voci.push({ esito: 'dato', titolo: 'Quanti millesimi hai?', spiegazione: 'La tua parte resta a tuo carico: il rimborso riguarda la parte degli altri.', dato: 'millesimi' });
  const cifra = altri !== null ? ` Su ${fmtEur(I)} spesi, la parte degli altri è ${fmtEur(altri)}.` : '';
  if (s.autorizzato === true) e.verdetto = { tono: 'si', titolo: 'Spesa autorizzata: hai diritto al rimborso', testo: `Se la spesa era autorizzata dall'amministratore o dall'assemblea non si applica il divieto di rimborso.${cifra}` };
  else if (s.urgente === 'si') e.verdetto = { tono: 'forse', titolo: 'Spesa urgente: puoi chiedere il rimborso', testo: `${R.spesa_urgente.testo}${cifra} Se l'urgenza viene contestata, dovrai dimostrarla.` };
  else if (s.urgente === 'no') e.verdetto = { tono: 'no', titolo: 'Senza urgenza e senza autorizzazione non c\'è rimborso', testo: R.spesa_urgente.testo };
  else {
    e.verdetto = { tono: 'dato', titolo: 'Era urgente?', testo: `${R.spesa_urgente.testo} La legge non definisce «urgente»: in pratica una spesa che non si poteva rimandare senza danno e senza il tempo di avvisare amministratore o assemblea.` };
    e.voci.push({ esito: 'dato', titolo: 'Era urgente?', spiegazione: 'Per esempio un tubo comune rotto che allaga le cantine, un cornicione che rischia di cadere.', dato: 'urgente' });
  }
  if (s.avvisato === false && s.urgente === 'si') e.voci.push({ esito: 'forse', titolo: 'Non hai avvisato l\'amministratore', spiegazione: 'Se c\'era il tempo per avvisarlo, l\'urgenza è più difficile da sostenere. Avvisalo ora per iscritto.' });
  if (s.urgente !== 'no' || s.autorizzato === true) e.documento = { tipo: 'rimborso' };
  e.passi.push({ titolo: 'Conserva le prove', testo: 'Fatture intestate o ricevute, foto del guasto prima e dopo, messaggi all\'amministratore, eventuale intervento di vigili del fuoco o tecnici.' }, { titolo: 'Chiedi il rimborso per iscritto', testo: 'All\'amministratore, che deve riferirne in assemblea. ' + R.straordinaria_amministratore.testo });
}

function scadenziere(e, oggi) {
  return (d, titolo, testo) => d && e.scadenze.push({ data: iso(d), titolo, testo, scaduta: d < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, d)) });
}

/**
 * Valuta una situazione di condominio.
 * @param {object} s  s.caso in CASI; le altre chiavi sono le risposte (vedi src/domande.js).
 * @param {object} opz { oggi: 'AAAA-MM-GG' }
 * @returns {{caso, verdetto:{tono,titolo,testo}, voci, scadenze, passi, fonti, documento, calcolo}}
 */
export function valutaCondominio(s = {}, opz = {}) {
  const oggi = oggiDi(opz.oggi);
  const e = nuovoEsito(s.caso || null);
  const casi = { impugnare, delibera, documenti, assemblea, spese, morosita, amministratore, lavori_urgenti: lavoriUrgenti };
  if (!casi[s.caso]) {
    e.verdetto = { tono: 'dato', titolo: 'Scegli la situazione', testo: 'Contestare una delibera, controllare le maggioranze, vedere i conti, chiedere un\'assemblea, capire chi paga, ritardi nei pagamenti, revoca dell\'amministratore, lavori urgenti.' };
    return e;
  }
  casi[s.caso](s, e, oggi);
  if (e.voci.some((v) => v.esito === 'dato') && e.verdetto?.tono === 'si') e.verdetto = { ...e.verdetto, tono: 'dato' };
  e.fonti = unici(e.fonti);
  e.scadenze.sort((a, b) => a.data.localeCompare(b.data));
  return e;
}

// ---------- testo semplice ----------

/** L'esito (di valutaCondominio o di maggioranze) in testo semplice, per il server MCP. */
export function testo(esito) {
  if (!esito) return '';
  const righe = [];
  const v = esito.verdetto;
  if (v) righe.push(`${v.titolo}.`, v.testo);
  const m = esito.calcolo?.costituita !== undefined ? esito.calcolo : esito.costituita !== undefined ? esito : null;
  if (m) {
    if (m.tipo) righe.push(`Decisione: ${m.tipo.etichetta}; ${m.convocazione || '?'} convocazione; totale ${fmtNum(m.totale_millesimi)} millesimi.`);
    const riga = (nome, q) => q && righe.push(`${nome}: condòmini ${q.teste.ci_sono ?? '?'} (servono ${q.teste.servono ?? '?'}), millesimi ${q.millesimi.ci_sono !== null ? fmtNum(q.millesimi.ci_sono) : '?'} (servono ${fmtNum(q.millesimi.servono)}) → ${q.esito === null ? 'serve un dato' : q.esito ? 'raggiunto' : 'non raggiunto'}.`);
    riga('Quorum costitutivo', m.costituita);
    riga('Quorum deliberativo', m.approvata);
  } else if (esito.calcolo?.righe) righe.push(...esito.calcolo.righe.map((r) => `Calcolo: ${r}`));
  for (const x of esito.voci || []) righe.push(`- ${x.titolo}: ${x.spiegazione}`);
  if (esito.scadenze?.length) {
    righe.push('Scadenze:');
    for (const s of esito.scadenze) righe.push(`- ${lungo(data(s.data))}: ${s.titolo}${s.scaduta ? ' (passata)' : ''}. ${s.testo}`);
  }
  if (esito.passi?.length) {
    righe.push('Passi:');
    esito.passi.forEach((p, i) => righe.push(`${i + 1}. ${p.titolo}. ${p.testo}`));
  }
  if (esito.fonti?.length) {
    righe.push(`Fonti (verificate il ${lungo(data(VERIFICATO))}):`);
    for (const f of esito.fonti) righe.push(`- ${f.titolo}: ${f.url}`);
  }
  righe.push('Informazioni sulle regole, non un parere legale: per una causa serve un avvocato.');
  return righe.join('\n');
}
