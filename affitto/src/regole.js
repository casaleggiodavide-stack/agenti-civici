// Regole di «Affitto: i tuoi diritti». Per chi è in affitto e per chi affitta una casa:
// recesso, disdetta, deposito, aumento ISTAT, spese, registrazione, morosità e sfratto,
// riparazioni. Ogni termine e ogni soglia vengono da affitto/dati/fonti.json, verificato
// su Normattiva e Gazzetta Ufficiale (scripts/affitto-dati.py --verifica). Niente DOM.

import F from './dati/fonti.js';
import { data, iso, oggi as oggiDi, giorniTra, aggiungiGiorni } from './comune/date.js';

export const VERIFICATO = F.verificato;
export const AVVERTENZE = F.avvertenze;
/** Ogni norma usata: id → { titolo, url, testo }. */
export const FONTI = Object.fromEntries(Object.entries(F.regole).map(([id, r]) => [id, { titolo: r.norma.titolo, url: r.norma.url, testo: r.testo }]));
/** Tassi legali annui (art. 1284 c.c. e decreti MEF), dal 1999. */
export const TASSI_LEGALI = F.tassi;
const R = F.regole;
const fonte = (id) => (R[id] ? { titolo: R[id].norma.titolo, url: R[id].norma.url } : null);

export const TIPI = {
  libero: '4+4 a canone libero',
  concordato: '3+2 a canone concordato',
  transitorio: 'transitorio',
  studenti: 'per studenti universitari',
};
export const SITUAZIONI = {
  recesso: 'Andarsene prima della scadenza',
  disdetta: 'Disdetta o mancato rinnovo alla scadenza',
  deposito: 'Restituzione del deposito cauzionale',
  aumento: 'Aumento del canone (ISTAT)',
  spese: 'Spese condominiali e accessorie',
  registrazione: 'Contratto non registrato o canone più basso sulla carta',
  morosita: 'Ritardo nei pagamenti e sfratto per morosità',
  riparazioni: 'Riparazioni e manutenzione',
};
export const MOTIVI_DISDETTA = {
  uso_proprio: 'Uso della casa per sé, il coniuge, i genitori, i figli o i parenti fino al secondo grado (lettera a)',
  ente: 'Proprietario società o ente che la usa per le proprie finalità e offre un altro alloggio (lettera b)',
  altro_alloggio: 'L\'inquilino ha un altro alloggio libero e idoneo nello stesso Comune (lettera c)',
  edificio_danneggiato: 'Edificio gravemente danneggiato da ricostruire o mettere in sicurezza (lettera d)',
  ristrutturazione: 'Ristrutturazione integrale, demolizione o sopraelevazione (lettera e)',
  non_occupa: 'L\'inquilino non abita la casa con continuità senza giustificato motivo (lettera f)',
  vendita: 'Vendita, se il proprietario non ha altre case oltre a quella dove abita (lettera g)',
  nessuno: 'Nessun motivo indicato',
  altro: 'Un altro motivo',
};

// ---------- date ----------

/** Aggiunge mesi di calendario; se il giorno non esiste (31 aprile) usa l'ultimo del mese. */
export function aggiungiMesi(d, n) {
  const x = data(d);
  if (!x) return null;
  const g = x.getUTCDate();
  const r = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + n, 1, 12));
  const ultimo = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0, 12)).getUTCDate();
  r.setUTCDate(Math.min(g, ultimo));
  return r;
}
/** Ultimo giorno di un periodo di n mesi che comincia in «inizio»: 1/3/2022 + 48 mesi → 28/2/2026. */
export const fineDopo = (inizio, mesi) => aggiungiGiorni(aggiungiMesi(inizio, mesi), -1);
const lungo = (d) => (d ? data(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');
const fmtEuro = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
const euro = (n) => `${fmtEuro.format(Math.round(n * 100) / 100)} €`;
const cent = (n) => Math.round(n * 100) / 100;
const num = (x) => (x === undefined || x === null || x === '' || !Number.isFinite(Number(x)) ? null : Number(x));

// ---------- interessi legali ----------

/** Tasso legale annuo (in %) in vigore in una data. */
export function tassoLegale(d) {
  const s = iso(data(d));
  let t = null;
  for (const r of TASSI_LEGALI) if (r.dal <= s) t = r;
  return t;
}

/**
 * Interessi legali semplici su un capitale, dal giorno dopo «dal» fino ad «al» compreso,
 * anno per anno con il tasso di ciascun anno (giorni effettivi / giorni dell'anno civile).
 * Prima del 1999 non calcola: restituisce prima1999 = true e parte dal 1/1/1999.
 */
export function interessiLegali(capitale, dal, al) {
  const c = num(capitale);
  let a = data(dal);
  const b = data(al);
  if (c === null || !a || !b || b <= a) return { totale: 0, righe: [], prima1999: false };
  const primo = data(TASSI_LEGALI[0].dal);
  let prima1999 = false;
  if (aggiungiGiorni(a, 1) < primo) { prima1999 = true; a = aggiungiGiorni(primo, -1); }
  const righe = [];
  let totale = 0;
  while (a < b) {
    const anno = a.getUTCFullYear() + (a.getUTCMonth() === 11 && a.getUTCDate() === 31 ? 1 : 0);
    const fineAnno = data(`${anno}-12-31`);
    const fine = b < fineAnno ? b : fineAnno;
    const giorni = giorniTra(a, fine);
    const giorniAnno = giorniTra(data(`${anno - 1}-12-31`), fineAnno);
    const t = tassoLegale(fine);
    const quota = (c * t.tasso / 100) * giorni / giorniAnno;
    totale += quota;
    righe.push({ anno, dal: iso(aggiungiGiorni(a, 1)), al: iso(fine), giorni, tasso: t.tasso, interessi: cent(quota), decreto: t.decreto, gazzetta: t.gazzetta });
    a = fine;
  }
  return { totale: cent(totale), righe, prima1999 };
}

// ---------- ciclo del contratto ----------

/**
 * Scadenze del contratto. Restituisce l'elenco dei periodi (fine di ciascuno) e la
 * prossima scadenza rispetto a «rif». Le scadenze sono l'ultimo giorno del periodo.
 */
export function cicloContratto(c, rif) {
  const inizio = data(c.inizio);
  const out = { tipo: c.tipo, inizio: c.inizio || null, scadenze: [], prossima: null, indice: null, note: [] };
  if (!inizio || !TIPI[c.tipo]) return out;
  const oggi = oggiDi(rif);
  let mesi = [];
  if (c.tipo === 'libero') {
    const primo = 12 * Math.max(R.durata_libero.anni, num(c.durata_anni) || R.durata_libero.anni);
    mesi = [primo, primo + 48];
    for (let k = 1; k < 30; k += 1) mesi.push(primo + 48 + 48 * k);
  } else if (c.tipo === 'concordato') {
    const primo = 12 * Math.max(R.durata_concordato.anni, num(c.durata_anni) || R.durata_concordato.anni);
    mesi = [primo, primo + 24];
    for (let k = 1; k < 40; k += 1) mesi.push(primo + 24 + 24 * k);
  } else {
    const m = num(c.durata_mesi);
    if (m) mesi = [m];
  }
  out.scadenze = mesi.map((m, i) => ({ n: i + 1, data: iso(fineDopo(inizio, m)) }));
  const prossima = out.scadenze.find((s) => data(s.data) >= oggi);
  if (prossima) { out.prossima = prossima.data; out.indice = prossima.n; }
  return out;
}

const nomeScadenza = (tipo, n) => {
  if (tipo === 'libero') return n === 1 ? 'prima scadenza (dopo i primi 4 anni)' : n === 2 ? 'seconda scadenza (dopo 8 anni)' : `scadenza del rinnovo n. ${n - 2}`;
  if (tipo === 'concordato') return n === 1 ? 'prima scadenza (fine dei 3 anni)' : n === 2 ? 'fine della proroga di 2 anni' : `fine del rinnovo biennale n. ${n - 2}`;
  return 'scadenza del contratto';
};

// ---------- controlli comuni sul contratto ----------

function controlliContratto(c, voci, fonti) {
  if (!c.tipo) voci.push({ esito: 'dato', titolo: 'Manca il tipo di contratto', spiegazione: 'Durata, preavvisi e aggiornamento del canone cambiano tra 4+4, 3+2, transitorio e studenti. Lo trovi nel titolo o nel primo articolo del contratto.', dato: 'tipo_contratto' });
  if (!c.inizio) voci.push({ esito: 'dato', titolo: 'Manca la data di inizio', spiegazione: 'Da lì contiamo le scadenze del contratto.', dato: 'inizio' });
  if (c.registrato === 'a_voce') {
    voci.push({ esito: 'no', titolo: 'Senza contratto scritto il contratto non è valido', spiegazione: R.forma_scritta.testo + ' Vedi la situazione «contratto non registrato».' });
    fonti.push(fonte('forma_scritta'));
  } else if (c.registrato === 'no') {
    voci.push({ esito: 'no', titolo: 'Contratto non registrato: è nullo', spiegazione: `${R.nullita_non_registrato.testo} ${R.registrazione_30.testo}` });
    fonti.push(fonte('nullita_non_registrato'), fonte('registrazione_30'));
  } else if (c.registrato === 'non_so') {
    voci.push({ esito: 'forse', titolo: 'Controlla che il contratto sia registrato', spiegazione: `${R.registrazione_30.testo} Chiedi al proprietario gli estremi della registrazione.`, dato: 'registrato' });
  }
  const dep = num(c.deposito), can = num(c.canone);
  if (dep !== null && can) {
    const max = R.deposito_max.mensilita * can;
    if (dep > max + 0.005) {
      voci.push({ esito: 'no', titolo: `Deposito oltre il limite: ${euro(dep)} invece di massimo ${euro(max)}`, spiegazione: `${R.deposito_max.testo} La parte in più (${euro(dep - max)}) supera il limite di legge: si può chiedere indietro per iscritto; se il proprietario rifiuta, decide il giudice.` });
      fonti.push(fonte('deposito_max'));
    }
  }
  if (c.tipo === 'transitorio' && num(c.durata_mesi) > R.transitorio_durata.mesi_max) {
    voci.push({ esito: 'no', titolo: `Contratto transitorio di ${num(c.durata_mesi)} mesi: più dei 18 consentiti`, spiegazione: R.transitorio_durata.testo });
    fonti.push(fonte('transitorio_durata'));
  }
  if (c.tipo === 'studenti') {
    const m = num(c.durata_mesi);
    if (m && (m < R.studenti_durata.mesi_min || m > R.studenti_durata.mesi_max)) voci.push({ esito: 'forse', titolo: `Contratto per studenti di ${m} mesi`, spiegazione: R.studenti_durata.testo });
    fonti.push(fonte('studenti_durata'));
  }
  if (['transitorio', 'studenti'].includes(c.tipo) && !num(c.durata_mesi)) voci.push({ esito: 'dato', titolo: 'Manca la durata in mesi', spiegazione: 'È scritta nel contratto: serve per la data di scadenza.', dato: 'durata_mesi' });
  if (c.tipo === 'concordato') fonti.push(fonte('accordi_territoriali'));
}

const uscita = ({ verdetto, voci, scadenze, passi, fonti, calcoli = {}, documento = null, collegamenti = [], tabella = null, situazione, ruolo, ciclo }) => {
  const visti = new Map();
  for (const f of fonti) if (f?.url && !visti.has(f.titolo)) visti.set(f.titolo, f);
  const tono = verdetto.tono === 'si' && voci.some((v) => v.esito === 'dato') ? 'dato' : verdetto.tono;
  return { situazione, ruolo, verdetto: { ...verdetto, tono }, voci, scadenze: scadenze.sort((a, b) => a.data.localeCompare(b.data)), passi, fonti: [...visti.values()], calcoli, documento, collegamenti, tabella, ciclo, verificato: VERIFICATO, avvertenze: AVVERTENZE };
};

/**
 * Funzione principale.
 * @param {object} situazione { tipo: recesso|disdetta|deposito|aumento|spese|registrazione|morosita|riparazioni,
 *   ruolo: inquilino|proprietario, e i dati della situazione (date in 'AAAA-MM-GG', importi in euro) }
 * @param {object} contratto { tipo: libero|concordato|transitorio|studenti, inizio, durata_anni, durata_mesi,
 *   registrato: si|no|non_so|a_voce, cedolare: true|false|'non_so', canone, deposito, spese: a_parte|comprese|non_so,
 *   clausola_recesso, preavviso_mesi, clausola_aggiornamento, quota_istat }
 * @param {object} opz { oggi: 'AAAA-MM-GG' }
 */
export function valutaAffitto(situazione = {}, contratto = {}, opz = {}) {
  const oggi = oggiDi(opz.oggi);
  const s = situazione || {};
  const c = contratto || {};
  const ruolo = s.ruolo === 'proprietario' ? 'proprietario' : 'inquilino';
  const inq = ruolo === 'inquilino';
  const voci = [], scadenze = [], passi = [], fonti = [], collegamenti = [];
  const calcoli = {};
  let documento = null, tabella = null, verdetto;
  const ciclo = cicloContratto(c, oggi);
  const scad = (d, titolo, testo) => {
    if (!d) return;
    const x = data(d);
    scadenze.push({ data: iso(x), titolo, testo, scaduta: x < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, x)) });
  };
  const base = { situazione: s.tipo || null, ruolo, ciclo };

  if (!s.tipo || !SITUAZIONI[s.tipo]) {
    verdetto = { tono: 'dato', titolo: 'Scegli la situazione', testo: 'Dimmi se sei inquilino o proprietario e che cosa sta succedendo: andarsene prima, disdetta, deposito, aumento, spese, registrazione, ritardi nei pagamenti o riparazioni.' };
    controlliContratto(c, voci, fonti);
    return uscita({ ...base, verdetto, voci, scadenze, passi, fonti });
  }
  controlliContratto(c, voci, fonti);
  const canone = num(c.canone);
  if (ciclo.prossima && ['recesso', 'disdetta'].includes(s.tipo)) calcoli.prossimaScadenza = { data: ciclo.prossima, n: ciclo.indice, nome: nomeScadenza(c.tipo, ciclo.indice) };

  // ================= 1. andarsene prima =================
  if (s.tipo === 'recesso') {
    const motivo = s.motivo_recesso || (c.clausola_recesso === true ? 'clausola' : null);
    const mesiContratto = num(c.preavviso_mesi);
    let mesi = R.recesso_gravi_motivi.mesi;
    if (motivo === 'clausola') {
      fonti.push(fonte('recesso_convenzionale'));
      if (c.clausola_recesso === false) voci.push({ esito: 'no', titolo: 'Hai detto che il contratto non ha la clausola di recesso', spiegazione: 'Senza clausola puoi andartene prima solo per gravi motivi, alla scadenza giusta o con un accordo scritto con il proprietario.' });
      if (mesiContratto && mesiContratto < R.recesso_convenzionale.mesi) voci.push({ esito: 'forse', titolo: `Il contratto indica ${mesiContratto} mesi di preavviso`, spiegazione: `La legge parla di almeno ${R.recesso_convenzionale.mesi} mesi: per prudenza contiamo ${R.recesso_convenzionale.mesi} mesi. Se il proprietario accetta per iscritto il preavviso più breve, vale l'accordo.` });
      if (mesiContratto && mesiContratto > mesi) mesi = mesiContratto;
    } else if (motivo === 'gravi') {
      fonti.push(fonte('recesso_gravi_motivi'));
      if (['transitorio', 'studenti'].includes(c.tipo) && mesiContratto && mesiContratto < mesi) {
        mesi = mesiContratto;
        voci.push({ esito: 'forse', titolo: `Preavviso del contratto: ${mesiContratto} mesi`, spiegazione: 'I contratti transitori e per studenti seguono il tipo di contratto ministeriale: usiamo il preavviso scritto nel tuo contratto. Se non è scritto, valgono i sei mesi della legge.' });
      }
      voci.push({ esito: 'forse', titolo: 'I gravi motivi vanno scritti nella lettera', spiegazione: 'La legge non li elenca: indica fatti concreti, sopravvenuti dopo la firma e indipendenti dalla tua volontà, per esempio un trasferimento di lavoro. Se il proprietario li contesta, decide il giudice.' });
    }
    const daQuando = s.data_comunicazione ? data(s.data_comunicazione) : oggi;
    if (motivo === 'gravi' || motivo === 'clausola') {
      const effetto = aggiungiMesi(daQuando, mesi);
      calcoli.preavvisoMesi = mesi;
      calcoli.dataUscita = iso(effetto);
      calcoli.canoniPreavviso = canone ? cent(canone * mesi) : null;
      verdetto = inq
        ? { tono: 'si', titolo: `Se la lettera arriva il ${lungo(daQuando)}, puoi lasciare la casa dal ${lungo(effetto)}`, testo: `Il preavviso è di ${mesi} mesi da quando il proprietario riceve la lettera: fino ad allora paghi il canone${calcoli.canoniPreavviso ? ` (circa ${euro(calcoli.canoniPreavviso)})` : ''}. Manda la lettera con raccomandata con ricevuta di ritorno.` }
        : { tono: 'si', titolo: `Il recesso ha effetto dal ${lungo(effetto)}`, testo: `Sono ${mesi} mesi da quando hai ricevuto la lettera. Fino ad allora l'inquilino deve il canone.` };
      if (s.data_uscita) {
        const ultimo = aggiungiMesi(s.data_uscita, -mesi);
        calcoli.ultimoGiornoInvio = iso(ultimo);
        scad(ultimo, 'La lettera di recesso deve arrivare entro oggi', `Per lasciare la casa il ${lungo(s.data_uscita)} servono ${mesi} mesi di preavviso dalla ricezione. Spediscila qualche giorno prima.`);
      }
      scad(effetto, 'Fine del preavviso: riconsegna delle chiavi', 'Fai un verbale di riconsegna con foto e letture dei contatori, e chiedi il deposito con gli interessi.');
      if (inq) documento = { tipo: 'recesso', motivo, mesi, dataUscita: iso(effetto) };
    } else {
      // senza gravi motivi e senza clausola: la scadenza giusta o un accordo
      fonti.push(fonte('recesso_gravi_motivi'), fonte('mutuo_consenso'));
      let titolo = 'Senza gravi motivi e senza clausola: alla scadenza giusta o con un accordo';
      let testo = `${R.mutuo_consenso?.testo || ''} Altrimenti resta la strada dei gravi motivi, con sei mesi di preavviso.`.trim();
      if (c.tipo === 'libero' || c.tipo === 'concordato') {
        const seconda = ciclo.scadenze.find((x) => x.n >= 2 && data(x.data) >= aggiungiMesi(oggi, 6));
        if (seconda) {
          const ultimo = aggiungiMesi(seconda.data, -6);
          titolo = `Puoi non rinnovare alla ${nomeScadenza(c.tipo, seconda.n)}, il ${lungo(seconda.data)}`;
          testo = `Manda la raccomandata entro il ${lungo(ultimo)}: sei mesi prima. ${testo}`;
          scad(ultimo, 'Ultimo giorno per la raccomandata di disdetta', `Deve arrivare almeno sei mesi prima della ${nomeScadenza(c.tipo, seconda.n)} del ${lungo(seconda.data)}.`);
          fonti.push(fonte(c.tipo === 'libero' ? 'seconda_scadenza_libero' : 'rinnovo_biennale_concordato'));
          if (inq) documento = { tipo: 'disdetta_inquilino', scadenza: seconda.data };
        }
        if (ciclo.indice === 1) voci.push({ esito: 'forse', titolo: 'Alla prima scadenza il contratto si rinnova da solo', spiegazione: c.tipo === 'libero' ? R.durata_libero.testo : R.durata_concordato.testo });
      }
      if (c.tipo === 'studenti' && ciclo.prossima) {
        const da = aggiungiMesi(ciclo.prossima, -R.studenti_durata.disdetta_mesi_max);
        const a = aggiungiMesi(ciclo.prossima, -R.studenti_durata.disdetta_mesi_min);
        titolo = `Per non rinnovare, la disdetta va mandata tra il ${lungo(da)} e il ${lungo(a)}`;
        testo = R.studenti_durata.testo;
        scad(a, 'Ultimo giorno per la disdetta del contratto per studenti', `Almeno un mese prima della scadenza del ${lungo(ciclo.prossima)}, e non prima del ${lungo(da)}.`);
        if (inq) documento = { tipo: 'disdetta_inquilino', scadenza: ciclo.prossima };
      }
      if (c.tipo === 'transitorio' && ciclo.prossima) {
        titolo = `Il contratto transitorio finisce il ${lungo(ciclo.prossima)}`;
        testo = `Alla scadenza non si rinnova. Per andartene prima servono gravi motivi o un accordo. ${R.transitorio_durata.testo}`;
        scad(ciclo.prossima, 'Scadenza del contratto transitorio', 'Riconsegna le chiavi con un verbale e chiedi il deposito.');
        fonti.push(fonte('transitorio_durata'));
      }
      verdetto = { tono: 'forse', titolo, testo };
      if (!motivo) voci.push({ esito: 'dato', titolo: 'Perché vuoi andartene?', spiegazione: 'Con gravi motivi o con la clausola di recesso nel contratto bastano sei mesi di preavviso.', dato: 'motivo_recesso' });
    }
    passi.push({ titolo: 'Spedisci con raccomandata con ricevuta di ritorno', testo: 'La data che conta è quella in cui il proprietario la riceve: conserva la ricevuta.' });
    passi.push({ titolo: 'Quando il contratto finisce', testo: `${R.risoluzione_comunicazione?.testo || ''} Ricorda la restituzione del deposito con gli interessi.`.trim() });
    fonti.push(fonte('risoluzione_comunicazione'));
  }

  // ================= 2. disdetta o mancato rinnovo =================
  if (s.tipo === 'disdetta') {
    fonti.push(fonte('disdetta_prima_scadenza'), fonte('disdetta_motivo_nullita'));
    const rif = s.data_disdetta ? data(s.data_disdetta) : oggi;
    // la scadenza a cui mira la disdetta: la prima che arriva dopo la data
    const bersaglio = ciclo.scadenze.find((x) => data(x.data) >= rif);
    if (['transitorio'].includes(c.tipo)) {
      verdetto = { tono: 'si', titolo: ciclo.prossima ? `Il contratto transitorio finisce il ${lungo(ciclo.prossima)} senza bisogno di disdetta` : 'Il contratto transitorio finisce alla scadenza', testo: R.transitorio_durata.testo };
      fonti.push(fonte('transitorio_durata'));
      if (ciclo.prossima) scad(ciclo.prossima, 'Scadenza del contratto transitorio', 'Riconsegna con verbale; il deposito va restituito con gli interessi.');
    } else if (c.tipo === 'studenti') {
      verdetto = { tono: 'forse', titolo: 'Contratto per studenti: si rinnova alla prima scadenza', testo: `${R.studenti_durata.testo} Il decreto parla solo della disdetta dell'inquilino: per quella del proprietario conta quello che dice il contratto. Fatti aiutare da un sindacato degli inquilini o da un'associazione dei proprietari.` };
      if (ciclo.prossima) scad(ciclo.prossima, 'Prima scadenza del contratto per studenti', 'Senza disdetta dell\'inquilino il contratto si rinnova.');
    } else if (!bersaglio || !c.tipo || !c.inizio) {
      verdetto = { tono: 'dato', titolo: 'Servono tipo di contratto e data di inizio', testo: 'Così calcoliamo se la disdetta riguarda la prima scadenza (servono un motivo di legge e sei mesi di preavviso) o una successiva (bastano sei mesi di preavviso).' };
    } else {
      const prima = bersaglio.n === 1;
      const limite = aggiungiMesi(bersaglio.data, -6);
      const inTempo = rif <= limite;
      calcoli.scadenza = { data: bersaglio.data, n: bersaglio.n, nome: nomeScadenza(c.tipo, bersaglio.n) };
      calcoli.ultimoGiornoDisdetta = iso(limite);
      const motivo = s.motivo_disdetta;
      const motivoValido = motivo && !['nessuno', 'altro'].includes(motivo);
      const successiva = ciclo.scadenze.find((x) => x.n === bersaglio.n + 1);
      if (inq) {
        if (!s.data_disdetta) {
          verdetto = { tono: 'dato', titolo: 'Quando hai ricevuto la disdetta?', testo: `La ${calcoli.scadenza.nome} è il ${lungo(bersaglio.data)}: la disdetta doveva arrivarti entro il ${lungo(limite)}.` };
          voci.push({ esito: 'dato', titolo: 'Manca la data di ricezione', spiegazione: 'Guarda la ricevuta della raccomandata o la data della PEC.', dato: 'data_disdetta' });
        } else if (!inTempo) {
          verdetto = { tono: 'si', titolo: `Disdetta arrivata tardi: il contratto continua oltre il ${lungo(bersaglio.data)}`, testo: `Doveva arrivare entro il ${lungo(limite)}, sei mesi prima della ${calcoli.scadenza.nome}. ${prima ? (c.tipo === 'libero' ? 'Il contratto si rinnova per altri quattro anni.' : 'Il contratto è prorogato di due anni.') : 'Il contratto si rinnova alle stesse condizioni.'}${successiva ? ` La prossima scadenza è il ${lungo(successiva.data)}.` : ''}` };
          documento = { tipo: 'contestazione_disdetta', vizio: 'tardi', scadenza: bersaglio.data, limite: iso(limite), prossima: successiva?.data || null };
        } else if (prima && !motivoValido) {
          verdetto = { tono: 'si', titolo: 'Alla prima scadenza la disdetta senza un motivo di legge è nulla', testo: `${R.disdetta_motivo_nullita.testo} ${c.tipo === 'libero' ? 'Il contratto si rinnova per altri quattro anni.' : 'Il contratto è prorogato di due anni.'}` };
          documento = { tipo: 'contestazione_disdetta', vizio: 'motivo', scadenza: bersaglio.data, prossima: successiva?.data || null };
          if (!motivo) voci.push({ esito: 'dato', titolo: 'Che motivo è scritto nella disdetta?', spiegazione: 'Alla prima scadenza il proprietario deve indicare uno dei motivi dell\'art. 3 della legge 431/1998.', dato: 'motivo_disdetta' });
        } else if (prima) {
          verdetto = { tono: 'forse', titolo: `La disdetta sembra in regola: la casa va lasciata alla scadenza del ${lungo(bersaglio.data)}`, testo: `È arrivata in tempo e indica un motivo previsto dalla legge. Il motivo deve essere vero: ${R.disdetta_ripristino.testo} ${R.disdetta_risarcimento.testo}` };
          calcoli.risarcimentoMinimo = canone ? cent(canone * R.disdetta_risarcimento.mensilita) : null;
          if (calcoli.risarcimentoMinimo) voci.push({ esito: 'forse', titolo: `Se il motivo si rivela falso: almeno ${euro(calcoli.risarcimentoMinimo)}`, spiegazione: `Sono ${R.disdetta_risarcimento.mensilita} mensilità dell'ultimo canone.` });
          fonti.push(fonte('disdetta_risarcimento'), fonte('disdetta_ripristino'));
          scad(aggiungiMesi(bersaglio.data, R.disdetta_ripristino.mesi), 'Controlla che la casa sia usata per il motivo dichiarato', 'Entro dodici mesi dal rilascio il proprietario deve adibirla all\'uso indicato; altrimenti puoi chiedere il ripristino o il risarcimento. La data esatta parte da quando restituisci le chiavi.');
          if (motivo === 'vendita') { voci.push({ esito: 'si', titolo: 'Hai diritto di prelazione', spiegazione: R.disdetta_vendita_prelazione.testo }); fonti.push(fonte('disdetta_vendita_prelazione')); }
          if (['edificio_danneggiato', 'ristrutturazione'].includes(motivo)) voci.push({ esito: 'forse', titolo: 'Per i lavori serve il titolo edilizio', spiegazione: 'Per i motivi delle lettere d) ed e) il proprietario deve avere il permesso o l\'autorizzazione per i lavori prima di chiedere il rilascio; finiti i lavori, se riaffitta, hai la prelazione.' });
        } else {
          verdetto = { tono: 'forse', titolo: `Disdetta in tempo per la ${calcoli.scadenza.nome}: il contratto finisce il ${lungo(bersaglio.data)}`, testo: 'Dopo la prima scadenza non serve un motivo: bastano la raccomandata e i sei mesi di preavviso.' };
          fonti.push(fonte(c.tipo === 'libero' ? 'seconda_scadenza_libero' : 'rinnovo_biennale_concordato'));
        }
        if (verdetto.tono !== 'si' || !documento) scad(bersaglio.data, `Fine del contratto (${calcoli.scadenza.nome})`, 'Riconsegna con verbale; chiedi il deposito con gli interessi.');
        passi.push({ titolo: 'Non andartene prima di aver chiarito', testo: 'Finché la disdetta non è valida il contratto continua: continua a pagare il canone e rispondi per iscritto.' });
        passi.push({ titolo: 'Se il proprietario va in tribunale', testo: `${R.licenza_finita_locazione.testo} Con l'atto riceverai la data dell'udienza: rivolgiti a un sindacato degli inquilini o a un avvocato.` });
        fonti.push(fonte('licenza_finita_locazione'));
      } else {
        // proprietario: vuole dare disdetta
        const utile = ciclo.scadenze.find((x) => aggiungiMesi(x.data, -6) >= oggi);
        if (!utile) {
          verdetto = { tono: 'dato', titolo: 'Servono tipo di contratto e data di inizio', testo: 'Per calcolare la prima scadenza utile.' };
        } else {
          const lim = aggiungiMesi(utile.data, -6);
          const primaU = utile.n === 1;
          calcoli.scadenza = { data: utile.data, n: utile.n, nome: nomeScadenza(c.tipo, utile.n) };
          calcoli.ultimoGiornoDisdetta = iso(lim);
          scad(lim, 'Ultimo giorno perché la disdetta arrivi all\'inquilino', `Sei mesi prima della ${calcoli.scadenza.nome} del ${lungo(utile.data)}. Spediscila con anticipo.`);
          scad(utile.data, `Fine del contratto se la disdetta è valida (${calcoli.scadenza.nome})`, 'Se l\'inquilino non lascia la casa, serve l\'intimazione di licenza o sfratto per finita locazione con un avvocato.');
          if (primaU && (!motivo || !motivoValido)) {
            const dopo = ciclo.scadenze.find((x) => x.n === utile.n + 1);
            calcoli.scadenzaSenzaMotivo = dopo ? { data: dopo.data, ultimoGiorno: iso(aggiungiMesi(dopo.data, -6)) } : null;
            verdetto = { tono: 'no', titolo: `Alla ${calcoli.scadenza.nome} puoi dare disdetta solo per un motivo di legge`, testo: `${R.disdetta_prima_scadenza.testo} ${R.disdetta_motivo_nullita.testo} Senza motivo potrai dare disdetta per la scadenza successiva${dopo ? `, il ${lungo(dopo.data)}, con la raccomandata entro il ${lungo(calcoli.scadenzaSenzaMotivo.ultimoGiorno)}` : ''}.` };
            if (!motivo) voci.push({ esito: 'dato', titolo: 'Per quale motivo vuoi riavere la casa?', spiegazione: 'Alla prima scadenza servono uno dei motivi dell\'art. 3 della legge 431/1998.', dato: 'motivo_disdetta' });
          } else {
            verdetto = { tono: 'si', titolo: `Puoi dare disdetta per il ${lungo(utile.data)}: deve arrivare entro il ${lungo(lim)}`, testo: primaU ? `Indica nella lettera il motivo: «${MOTIVI_DISDETTA[motivo]}». ${R.disdetta_ripristino.testo} ${R.disdetta_risarcimento.testo}` : 'Dopo la prima scadenza non serve un motivo: raccomandata almeno sei mesi prima.' };
            documento = { tipo: 'disdetta_proprietario', scadenza: utile.data, prima: primaU, motivo: primaU ? motivo : null };
            if (primaU) fonti.push(fonte('disdetta_risarcimento'), fonte('disdetta_ripristino'));
            if (primaU && motivo === 'vendita') { voci.push({ esito: 'forse', titolo: 'Vendita: l\'inquilino ha la prelazione', spiegazione: R.disdetta_vendita_prelazione.testo }); fonti.push(fonte('disdetta_vendita_prelazione')); }
          }
          if (!primaU) fonti.push(fonte(c.tipo === 'libero' ? 'seconda_scadenza_libero' : 'rinnovo_biennale_concordato'));
          passi.push({ titolo: 'Se alla scadenza la casa non viene lasciata', testo: R.licenza_finita_locazione.testo });
          fonti.push(fonte('licenza_finita_locazione'));
        }
      }
    }
  }

  // ================= 3. deposito =================
  if (s.tipo === 'deposito') {
    fonti.push(fonte('deposito_max'), fonte('deposito_interessi'), fonte('tasso_legale'), fonte('restituzione_stato'));
    const dep = num(s.deposito ?? c.deposito);
    const dal = s.data_deposito || c.inizio;
    const al = s.data_riconsegna || iso(oggi);
    const pagatiFino = s.interessi_pagati_fino && data(s.interessi_pagati_fino) > data(dal) ? s.interessi_pagati_fino : dal;
    if (dep === null) voci.push({ esito: 'dato', titolo: 'Manca l\'importo del deposito', spiegazione: 'È scritto nel contratto o nella ricevuta del versamento.', dato: 'deposito' });
    if (!dal) voci.push({ esito: 'dato', titolo: 'Manca la data del versamento', spiegazione: 'Di solito coincide con la firma o l\'inizio del contratto.', dato: 'data_deposito' });
    if (dep !== null && dal) {
      const int = interessiLegali(dep, pagatiFino, al);
      const tratt = num(s.trattenuta) || 0;
      calcoli.deposito = dep;
      calcoli.interessi = int.totale;
      calcoli.trattenuta = tratt;
      calcoli.totale = cent(dep + int.totale - tratt);
      calcoli.dal = pagatiFino; calcoli.al = al;
      tabella = { titolo: 'Interessi legali anno per anno', colonne: [['anno', 'Anno', 'num'], ['dal', 'Dal'], ['al', 'Al'], ['giorni', 'Giorni', 'num'], ['tasso', 'Tasso %', 'num'], ['interessi', 'Interessi €', 'num'], ['decreto', 'Decreto']], righe: int.righe };
      if (int.prima1999) voci.push({ esito: 'forse', titolo: 'Interessi calcolati dal 1° gennaio 1999', spiegazione: 'Per gli anni prima del 1999 il calcolo non c\'è: chiedi il conteggio a un\'associazione.' });
      if (canone && dep > R.deposito_max.mensilita * canone + 0.005) calcoli.eccedenza = cent(dep - R.deposito_max.mensilita * canone);
      verdetto = inq
        ? { tono: 'si', titolo: `Ti spettano ${euro(calcoli.totale)}: deposito ${euro(dep)} più ${euro(int.totale)} di interessi legali${tratt ? `, meno ${euro(tratt)} trattenuti` : ''}`, testo: `Interessi dal ${lungo(aggiungiGiorni(data(pagatiFino), 1))} al ${lungo(al)}, con il tasso legale di ogni anno. ${R.deposito_interessi.testo} ${R.restituzione_stato.testo}` }
        : { tono: 'si', titolo: `Da restituire: ${euro(calcoli.totale)} (deposito ${euro(dep)} più ${euro(int.totale)} di interessi${tratt ? `, meno ${euro(tratt)} trattenuti` : ''})`, testo: `${R.deposito_interessi.testo} ${R.restituzione_stato.testo}` };
      if (tratt) voci.push({ esito: 'forse', titolo: `Trattenuta di ${euro(tratt)}`, spiegazione: inq ? 'Chiedi per iscritto il dettaglio delle voci con i documenti (preventivi, fatture, verbale di riconsegna). Il normale uso e la vecchiaia della casa non si pagano.' : 'Tieni da parte i documenti di ogni voce: fatture, preventivi, foto, verbale di riconsegna. Il normale uso e la vecchiaia della casa non si addebitano.' });
      voci.push({ esito: 'forse', titolo: 'La legge non fissa un numero di giorni per la restituzione', spiegazione: 'Il deposito garantisce gli obblighi fino alla fine del contratto: va restituito alla riconsegna della casa, salvo le somme documentate per danni oltre il normale uso o per canoni e spese non pagati.' });
      if (inq) documento = { tipo: 'deposito', deposito: dep, interessi: int.totale, totale: calcoli.totale, trattenuta: tratt, dal: pagatiFino, al };
    } else {
      verdetto = { tono: 'dato', titolo: 'Servono importo e data del deposito', testo: R.deposito_interessi.testo };
    }
    calcoli.tassi = TASSI_LEGALI;
    passi.push({ titolo: 'Alla riconsegna fai un verbale', testo: 'Stato della casa, foto con data, letture dei contatori, numero di chiavi. Firmato da entrambi.' });
    if (inq) passi.push({ titolo: 'Se non ti rispondono', testo: 'Dopo la lettera puoi rivolgerti a un sindacato degli inquilini o a un avvocato.' });
  }

  // ================= 4. aumento del canone =================
  if (s.tipo === 'aumento') {
    const varIstat = num(s.variazione_istat);
    const quotaContratto = num(c.quota_istat ?? s.quota_istat);
    fonti.push(fonte('istat_foi'));
    if (c.cedolare === true) {
      fonti.push(fonte('aggiornamento_cedolare'), fonte('aggiornamento_cedolare_2027'));
      verdetto = inq
        ? { tono: 'si', titolo: 'Con la cedolare secca l\'aumento ISTAT non è dovuto', testo: R.aggiornamento_cedolare.testo }
        : { tono: 'no', titolo: 'Con la cedolare secca non puoi chiedere l\'aggiornamento ISTAT', testo: `${R.aggiornamento_cedolare.testo} Se rinunci all'opzione, l'aggiornamento torna possibile secondo il contratto.` };
      calcoli.nuovoCanone = canone;
      if (inq && (num(s.canone_richiesto) || s.data_richiesta_aumento)) documento = { tipo: 'contesta_aumento' };
    } else if (c.cedolare === 'non_so' || c.cedolare === undefined || c.cedolare === null) {
      verdetto = { tono: 'dato', titolo: 'Prima di tutto: il proprietario ha la cedolare secca?', testo: `${R.aggiornamento_cedolare.testo} Lo trovi nella raccomandata che il proprietario deve averti mandato quando ha scelto la cedolare, o chiedilo a lui.` };
      voci.push({ esito: 'dato', titolo: 'Cedolare secca: sì o no?', spiegazione: 'Con la cedolare secca l\'aumento non è dovuto.', dato: 'cedolare' });
      fonti.push(fonte('aggiornamento_cedolare'));
    } else {
      const tetto = c.tipo === 'concordato' ? R.aggiornamento_concordato_75.quota_max * 100 : null;
      if (c.tipo === 'concordato') fonti.push(fonte('aggiornamento_concordato_75'));
      else fonti.push(fonte('aggiornamento_libero'));
      if (c.clausola_aggiornamento === false) {
        verdetto = inq
          ? { tono: 'si', titolo: 'Se il contratto non prevede l\'aggiornamento, l\'aumento non è dovuto', testo: R.aggiornamento_libero.testo }
          : { tono: 'no', titolo: 'Senza una clausola nel contratto non puoi chiedere l\'aggiornamento', testo: R.aggiornamento_libero.testo };
        if (inq) documento = { tipo: 'contesta_aumento', motivo: 'clausola' };
      } else if (varIstat === null || quotaContratto === null || c.clausola_aggiornamento === undefined) {
        verdetto = { tono: 'dato', titolo: 'Servono la clausola del contratto e la variazione ISTAT', testo: `${c.tipo === 'concordato' ? R.aggiornamento_concordato_75.testo : R.aggiornamento_libero.testo} ${R.istat_foi.testo}` };
        if (c.clausola_aggiornamento === undefined) voci.push({ esito: 'dato', titolo: 'Il contratto prevede l\'aggiornamento ISTAT?', spiegazione: 'Cerca nel contratto la parola «aggiornamento» o «ISTAT».', dato: 'clausola_aggiornamento' });
        if (quotaContratto === null) voci.push({ esito: 'dato', titolo: 'In che percentuale della variazione ISTAT?', spiegazione: 'Di solito il contratto dice «nella misura del 75%» o «del 100%» della variazione.', dato: 'quota_istat' });
        if (varIstat === null) voci.push({ esito: 'dato', titolo: 'Manca la variazione ISTAT', spiegazione: R.istat_foi.testo, dato: 'variazione_istat' });
      } else {
        let quota = quotaContratto;
        if (tetto !== null && quota > tetto) {
          voci.push({ esito: 'no', titolo: `Il contratto dice ${quota}%, ma nel concordato il massimo è ${tetto}%`, spiegazione: R.aggiornamento_concordato_75.testo });
          quota = tetto;
        }
        if (!canone) voci.push({ esito: 'dato', titolo: 'Manca il canone mensile', spiegazione: 'Serve per calcolare l\'aumento.', dato: 'canone' });
        const aumento = canone ? cent(canone * (varIstat / 100) * (quota / 100)) : null;
        calcoli.quotaApplicata = quota;
        calcoli.variazioneIstat = varIstat;
        calcoli.aumentoMensile = aumento;
        calcoli.nuovoCanone = canone ? cent(canone + aumento) : null;
        const chiesto = num(s.canone_richiesto);
        if (chiesto && calcoli.nuovoCanone && chiesto > calcoli.nuovoCanone + 0.01) {
          voci.push({ esito: 'no', titolo: `Ti chiedono ${euro(chiesto)}: è più del massimo calcolato, ${euro(calcoli.nuovoCanone)}`, spiegazione: `Il calcolo usa ${quota}% della variazione ISTAT del ${String(varIstat).replace('.', ',')}%. ${R.aggiornamento_libero.testo}` });
          if (inq) documento = { tipo: 'contesta_aumento', motivo: 'eccesso', massimo: calcoli.nuovoCanone, chiesto };
        }
        verdetto = calcoli.nuovoCanone
          ? { tono: inq && chiesto && chiesto > calcoli.nuovoCanone + 0.01 ? 'si' : 'forse', titolo: `Canone aggiornato: al massimo ${euro(calcoli.nuovoCanone)} al mese (+${euro(aumento)})`, testo: `${quota}% della variazione ISTAT FOI del ${String(varIstat).replace('.', ',')}% su ${euro(canone)}. ${c.tipo === 'concordato' ? R.aggiornamento_concordato_75.testo : R.aggiornamento_libero.testo}` }
          : { tono: 'dato', titolo: 'Serve il canone mensile', testo: 'Scrivi il canone attuale per calcolare l\'aumento.' };
        if (!inq && calcoli.nuovoCanone) documento = { tipo: 'richiesta_istat', nuovoCanone: calcoli.nuovoCanone, aumento, quota, varIstat };
      }
    }
    passi.push({ titolo: 'Dove si trova la variazione ISTAT', testo: R.istat_foi.testo, link: R.istat_foi.norma.url });
  }

  // ================= 5. spese =================
  if (s.tipo === 'spese') {
    fonti.push(fonte('oneri_accessori'), fonte('oneri_pagamento'), fonte('oneri_assemblea'), fonte('riparazioni_locatore'));
    if (['concordato', 'transitorio', 'studenti'].includes(c.tipo)) fonti.push(fonte('oneri_tabella_dm'));
    const importo = num(s.importo_spese);
    const scad2 = s.data_richiesta_spese ? aggiungiMesi(s.data_richiesta_spese, R.oneri_pagamento.mesi) : null;
    calcoli.ripartizione = {
      inquilino: ['pulizia delle parti comuni', 'funzionamento e ordinaria manutenzione dell\'ascensore', 'acqua', 'energia elettrica', 'riscaldamento e condizionamento', 'spurgo dei pozzi neri e delle latrine', 'altri servizi comuni', `portineria al ${R.oneri_accessori.portineria * 100}% (o meno, se pattuito)`],
      proprietario: ['manutenzione straordinaria dell\'edificio e degli impianti', 'riparazioni necessarie che non sono piccola manutenzione', `portineria per il restante ${100 - R.oneri_accessori.portineria * 100}%`],
    };
    verdetto = inq
      ? { tono: 'si', titolo: scad2 ? `Hai tempo fino al ${lungo(scad2)} per pagare, e prima puoi vedere i documenti` : 'Prima di pagare hai diritto di vedere il dettaglio e i documenti', testo: `${R.oneri_pagamento.testo} ${R.oneri_accessori.testo}` }
      : { tono: 'si', titolo: 'Manda all\'inquilino il dettaglio delle spese con i criteri di ripartizione', testo: `${R.oneri_pagamento.testo} ${R.oneri_accessori.testo}` };
    if (scad2) scad(scad2, 'Scadenza per pagare le spese richieste', 'Due mesi dalla richiesta. Se mancano il dettaglio o i documenti, chiedili per iscritto prima.');
    if (c.spese === 'comprese') voci.push({ esito: 'forse', titolo: 'Spese comprese nel canone', spiegazione: 'Se il contratto dice che le spese sono comprese nel canone, il proprietario non può chiederle a parte: conta il testo del contratto.' });
    if (importo !== null && canone) {
      const soglia = R.morosita_20.mensilita_oneri * canone;
      calcoli.sogliaRisoluzione = soglia;
      if (importo > soglia) voci.push({ esito: 'forse', titolo: `Spese non pagate oltre ${euro(soglia)}`, spiegazione: `${R.morosita_20.testo} Qui l'importo richiesto è ${euro(importo)}.` });
      fonti.push(fonte('morosita_20'));
    }
    if (inq && s.documenti_spese !== true) documento = { tipo: 'documenti_spese', importo };
    voci.push({ esito: 'si', titolo: 'Riscaldamento e aria condizionata: in assemblea voti tu', spiegazione: R.oneri_assemblea.testo });
  }

  // ================= 6. registrazione =================
  if (s.tipo === 'registrazione') {
    fonti.push(fonte('registrazione_30'), fonte('registrazione_dpr'), fonte('registrazione_2027'), fonte('nullita_non_registrato'), fonte('canone_superiore_nullo'), fonte('riconduzione_giudice'));
    const dich = num(s.canone_dichiarato ?? c.canone_dichiarato);
    const pag = num(s.canone_pagato ?? c.canone);
    if (c.inizio) {
      const lim = aggiungiGiorni(data(c.inizio), R.registrazione_30.giorni);
      calcoli.limiteRegistrazione = iso(lim);
      calcoli.limiteComunicazione = iso(aggiungiGiorni(lim, R.registrazione_30.giorni_comunicazione));
      scad(lim, 'Termine per registrare il contratto', 'Trenta giorni dalla firma o dall\'inizio. Lo fa il proprietario.');
    }
    if (dich !== null && pag !== null && pag > dich) {
      const mesi = c.inizio ? Math.max(0, Math.round(giorniTra(data(c.inizio), oggi) / 30.4375)) : null;
      calcoli.differenzaMensile = cent(pag - dich);
      calcoli.mesiPagati = mesi;
      calcoli.differenzaTotale = mesi !== null ? cent((pag - dich) * mesi) : null;
    }
    if (inq) {
      if (c.registrato === 'si' && calcoli.differenzaMensile) {
        verdetto = { tono: 'si', titolo: `Paghi ${euro(calcoli.differenzaMensile)} al mese in più di quanto registrato: quella parte non è dovuta`, testo: `${R.canone_superiore_nullo.testo}${calcoli.differenzaTotale ? ` Finora, in circa ${calcoli.mesiPagati} mesi, fanno ${euro(calcoli.differenzaTotale)}.` : ''}` };
        documento = { tipo: 'canone_nero', differenza: calcoli.differenzaMensile, totale: calcoli.differenzaTotale };
      } else if (c.registrato === 'si') {
        verdetto = { tono: 'si', titolo: 'Il contratto è registrato', testo: 'Se paghi solo il canone scritto nel contratto registrato, sei in regola. Conserva le ricevute dei pagamenti.' };
      } else {
        verdetto = { tono: 'si', titolo: 'Il contratto non registrato è nullo: puoi chiedere che l\'affitto torni alle condizioni di legge', testo: `${R.nullita_non_registrato.testo} ${R.registrazione_30.testo} ${R.riconduzione_giudice.testo}` };
        documento = { tipo: 'richiesta_registrazione' };
        if (calcoli.differenzaMensile) voci.push({ esito: 'forse', titolo: `Differenza tra canone pagato e scritto: ${euro(calcoli.differenzaMensile)} al mese`, spiegazione: R.canone_superiore_nullo.testo });
      }
      if (c.registrato === 'si' && calcoli.differenzaMensile) voci.push({ esito: 'forse', titolo: 'Restituzione: sei mesi dalla riconsegna', spiegazione: 'L\'azione per riavere le somme pagate in più va avviata entro sei mesi da quando lasci la casa. Serve un avvocato o un sindacato degli inquilini.' });
      passi.push({ titolo: 'Conserva le prove dei pagamenti', testo: 'Bonifici, ricevute, messaggi: provano quanto hai pagato davvero.' });
      collegamenti.push({ strumento: 'mi-spetta', titolo: 'Detrazioni e contributi per l\'affitto', testo: 'Controlla con Mi spetta le detrazioni e i contributi per chi è in affitto.' });
    } else {
      verdetto = c.registrato === 'si' && !calcoli.differenzaMensile
        ? { tono: 'si', titolo: 'Contratto registrato: ricordati la comunicazione all\'inquilino e all\'amministratore', testo: R.registrazione_30.testo }
        : { tono: 'no', titolo: 'Registra il contratto con il canone vero', testo: `${R.registrazione_30.testo} ${R.nullita_non_registrato.testo} ${R.canone_superiore_nullo.testo} ${R.registrazione_tardiva_sanzioni.testo}` };
      fonti.push(fonte('registrazione_tardiva_sanzioni'), fonte('cedolare_registro'));
      passi.push({ titolo: 'Come si registra', testo: 'All\'Agenzia delle Entrate, online o in ufficio, anche tramite un CAF o un professionista. Con la cedolare secca non paghi registro e bollo.' });
    }
  }

  // ================= 7. morosità =================
  if (s.tipo === 'morosita') {
    fonti.push(fonte('morosita_20'), fonte('termine_grazia'), fonte('termine_grazia_120'), fonte('intimazione_sfratto'), fonte('intimazione_termini'), fonte('convalida'), fonte('rilascio_data'), fonte('preavviso_rilascio'));
    const prima = s.data_prima_rata ? data(s.data_prima_rata) : null;
    if (prima) {
      const risol = aggiungiGiorni(prima, R.morosita_20.giorni);
      calcoli.dataRisoluzione = iso(aggiungiGiorni(risol, 1));
      scad(aggiungiGiorni(risol, 1), 'Da oggi il ritardo è motivo di risoluzione', 'Sono passati venti giorni dalla scadenza della rata non pagata.');
    } else voci.push({ esito: 'dato', titolo: 'Quando scadeva la prima rata non pagata?', spiegazione: 'Da lì contiamo i venti giorni e gli interessi.', dato: 'data_prima_rata' });
    const notifica = s.data_notifica ? data(s.data_notifica) : null;
    const udienza = s.data_udienza ? data(s.data_udienza) : null;
    if (notifica) {
      const minima = aggiungiGiorni(notifica, R.intimazione_termini.giorni + 1);
      calcoli.udienzaMinima = iso(minima);
      if (udienza && udienza < minima) voci.push({ esito: 'forse', titolo: 'Tra notifica e udienza ci sono meno di venti giorni liberi', spiegazione: `${R.intimazione_termini.testo} Il giudice può dimezzarli solo con un decreto motivato scritto sull'atto: controlla.` });
    }
    const precedenti = num(s.sanatorie) || 0;
    const difficolta = s.difficolta === true;
    const ritardoMesi = prima ? giorniTra(prima, udienza || oggi) / 30.4375 : null;
    const speciale = difficolta && ritardoMesi !== null && ritardoMesi <= 2;
    const maxVolte = speciale ? R.termine_grazia.volte_difficolta : R.termine_grazia.volte;
    const giorniGrazia = speciale ? R.termine_grazia.giorni_difficolta : R.termine_grazia.giorni;
    calcoli.sanatoriaPossibile = precedenti < maxVolte;
    calcoli.giorniGrazia = giorniGrazia;
    // importo da sanare: canoni scaduti fino all'udienza (o a oggi) con gli interessi legali di ciascuno
    if (prima && canone) {
      const fino = udienza || oggi;
      let rate = 0, interessi = 0;
      for (let k = 0; k < 600; k += 1) {
        const sc = aggiungiMesi(prima, k);
        if (sc > fino) break;
        rate += 1;
        interessi += interessiLegali(canone, sc, fino).totale;
      }
      if (num(s.rate_non_pagate) && !udienza) rate = Math.max(rate, num(s.rate_non_pagate));
      calcoli.rateScadute = rate;
      calcoli.canoniScaduti = cent(rate * canone);
      calcoli.interessiStimati = cent(interessi);
      calcoli.daVersare = cent(rate * canone + interessi);
      calcoli.alla = iso(fino);
    }
    if (udienza) {
      const fineGrazia = aggiungiGiorni(udienza, giorniGrazia);
      calcoli.fineTermineGrazia = iso(fineGrazia);
      calcoli.rinvioMassimo = iso(aggiungiGiorni(fineGrazia, R.termine_grazia.rinvio_giorni));
      calcoli.esecuzioneMassima = iso(aggiungiGiorni(fineGrazia, R.rilascio_data.giorni_dopo_grazia));
      scad(udienza, 'Udienza di convalida', inq ? 'Presentati: puoi pagare in udienza e il contratto non si risolve, o chiedere il termine di grazia spiegando le tue difficoltà con i documenti.' : 'Serve l\'attestazione che la morosità persiste.');
      if (calcoli.sanatoriaPossibile) scad(fineGrazia, `Termine di grazia massimo (${giorniGrazia} giorni)`, 'Se il giudice lo concede, entro questa data devi pagare tutto: canoni, spese, interessi e spese del processo.');
    }
    if (inq) {
      if (!calcoli.sanatoriaPossibile) {
        verdetto = { tono: 'no', titolo: `Hai già usato la sanatoria ${precedenti} volte in quattro anni: il termine di grazia non c'è più`, testo: `${R.termine_grazia.testo} Rivolgiti subito a un avvocato o a un sindacato degli inquilini.` };
      } else {
        verdetto = { tono: 'si', titolo: calcoli.daVersare ? `Puoi fermare lo sfratto pagando circa ${euro(calcoli.daVersare)} più le spese del processo` : 'Puoi fermare lo sfratto pagando tutto alla prima udienza o nel termine di grazia', testo: `${R.termine_grazia.testo}${speciale ? ' Nel tuo caso valgono i 120 giorni, se dimostri le difficoltà.' : ''}` };
      }
      passi.push({ titolo: 'Se non puoi pagare un avvocato', testo: 'L\'atto di sfratto deve dirti che, con i requisiti di legge, puoi chiedere il patrocinio a spese dello Stato. Chiedi come fare al tribunale indicato nell\'atto o a un sindacato degli inquilini.' });
      passi.push({ titolo: 'Chiedi aiuto al Comune', testo: 'I servizi sociali sanno se ci sono contributi per l\'affitto o per chi non riesce a pagare. Controlla anche con Mi spetta.' });
      collegamenti.push({ strumento: 'mi-spetta', titolo: 'Contributi per l\'affitto', testo: 'Bonus e contributi che potrebbero spettarti.' });
    } else {
      verdetto = prima && oggi > aggiungiGiorni(prima, R.morosita_20.giorni)
        ? { tono: 'si', titolo: 'Il ritardo supera i venti giorni: è motivo di risoluzione', testo: `${R.morosita_20.testo} Prima di andare in tribunale conviene una diffida scritta; poi l'intimazione di sfratto con un avvocato.` }
        : { tono: 'forse', titolo: prima ? `Il ritardo diventa motivo di risoluzione dal ${lungo(calcoli.dataRisoluzione)}` : 'Il ritardo oltre venti giorni è motivo di risoluzione', testo: R.morosita_20.testo };
      documento = { tipo: 'diffida_pagamento', importo: calcoli.canoniScaduti || null, rate: calcoli.rateScadute || num(s.rate_non_pagate) || null };
      passi.push({ titolo: 'Come va il procedimento', testo: `${R.intimazione_sfratto.testo} ${R.intimazione_termini.testo} ${R.convalida.testo} ${R.termine_grazia.testo} ${R.rilascio_data.testo} ${R.preavviso_rilascio.testo}` });
    }
  }

  // ================= 8. riparazioni =================
  if (s.tipo === 'riparazioni') {
    fonti.push(fonte('obblighi_locatore'), fonte('riparazioni_locatore'), fonte('piccola_manutenzione'), fonte('riparazioni_urgenti'), fonte('riduzione_canone_lavori'));
    const t = s.tipo_guasto;
    if (!t) {
      verdetto = { tono: 'dato', titolo: 'Che tipo di guasto è?', testo: `${R.riparazioni_locatore.testo} ${R.piccola_manutenzione.testo}` };
      voci.push({ esito: 'dato', titolo: 'Scegli il tipo di guasto', spiegazione: 'Dovuto all\'uso di tutti i giorni, alla vecchiaia dell\'impianto o a un evento, oppure urgente.', dato: 'tipo_guasto' });
    } else if (t === 'uso') {
      verdetto = inq
        ? { tono: 'no', titolo: 'Piccola manutenzione da usura: di solito tocca a te', testo: `${R.piccola_manutenzione.testo} Controlla anche cosa dice il contratto.` }
        : { tono: 'si', titolo: 'Piccola manutenzione da usura: tocca all\'inquilino', testo: R.piccola_manutenzione.testo };
    } else {
      verdetto = inq
        ? { tono: 'si', titolo: t === 'urgente' ? 'Riparazione urgente: avvisa subito il proprietario; se serve, puoi farla tu e farti rimborsare' : 'Riparazione dovuta a vecchiaia o a un evento: tocca al proprietario', testo: `${R.riparazioni_locatore.testo} ${R.riparazioni_urgenti.testo}` }
        : { tono: 'no', titolo: t === 'urgente' ? 'Riparazione urgente: tocca a te, e l\'inquilino può farla e chiederti il rimborso' : 'Riparazione dovuta a vecchiaia o a un evento: tocca a te', testo: `${R.obblighi_locatore.testo} ${R.riparazioni_locatore.testo} ${R.riparazioni_urgenti.testo}` };
      if (inq) documento = { tipo: t === 'urgente' ? 'riparazione_urgente' : 'riparazione' };
    }
    const giorni = num(s.giorni_lavori);
    if (giorni) {
      let durata = null;
      if (ciclo.scadenze.length && c.inizio) {
        const fine = ciclo.prossima || ciclo.scadenze[0].data;
        const n = ciclo.scadenze.find((x) => x.data === fine)?.n || 1;
        const inizioPeriodo = n > 1 ? aggiungiGiorni(data(ciclo.scadenze[n - 2].data), 1) : data(c.inizio);
        durata = giorniTra(inizioPeriodo, data(fine)) + 1;
      }
      const soglia = Math.max(R.riduzione_canone_lavori.giorni, durata ? Math.ceil(durata / 6) : R.riduzione_canone_lavori.giorni);
      calcoli.sogliaRiduzione = soglia;
      calcoli.durataPeriodo = durata;
      if (!durata) voci.push({ esito: 'dato', titolo: 'Per la riduzione del canone serve la durata del contratto', spiegazione: R.riduzione_canone_lavori.testo, dato: 'inizio' });
      voci.push(giorni > soglia
        ? { esito: 'si', titolo: `Lavori di ${giorni} giorni: oltre la soglia di ${soglia}, spetta una riduzione del canone`, spiegazione: R.riduzione_canone_lavori.testo }
        : { esito: 'no', titolo: `Lavori di ${giorni} giorni: sotto la soglia di ${soglia} giorni`, spiegazione: R.riduzione_canone_lavori.testo });
    }
    if (s.inabitabile === true) voci.push({ esito: 'si', titolo: 'Casa inabitabile durante i lavori', spiegazione: 'Se le riparazioni rendono inabitabile la parte necessaria per te e la tua famiglia, puoi ottenere lo scioglimento del contratto, secondo le circostanze.' });
    passi.push({ titolo: 'Avvisa sempre per iscritto', testo: 'Con foto e data: l\'avviso al proprietario è un obbligo e ti tutela.' });
  }

  if (['recesso', 'disdetta', 'deposito', 'registrazione', 'morosita'].includes(s.tipo)) collegamenti.push({ strumento: 'chiedo-gli-atti', titolo: 'Documenti dal Comune', testo: 'Per chiedere al Comune atti che ti riguardano, come gli accordi territoriali depositati o i titoli edilizi dei lavori.' });
  if (c.tipo === 'concordato') passi.push({ titolo: 'Valori del canone concordato', testo: R.accordi_territoriali.testo });
  return uscita({ ...base, verdetto, voci, scadenze, passi, fonti, calcoli, documento, collegamenti, tabella });
}

/** Dalle risposte piatte del questionario a (situazione, contratto). */
export function daRisposte(r = {}) {
  const sn = (v) => (v === true || v === false || v === 'non_so' ? v : undefined);
  const contratto = {
    tipo: r.tipo_contratto, inizio: r.inizio, durata_anni: r.durata_anni, durata_mesi: r.durata_mesi,
    registrato: r.registrato, cedolare: sn(r.cedolare), canone: r.canone, deposito: r.deposito, spese: r.spese,
    clausola_recesso: sn(r.clausola_recesso), preavviso_mesi: r.preavviso_mesi,
    clausola_aggiornamento: sn(r.clausola_aggiornamento), quota_istat: r.quota_istat, canone_dichiarato: r.canone_dichiarato,
  };
  const situazione = { ...r };
  for (const k of ['situazione', 'tipo_contratto', 'inizio', 'durata_anni', 'durata_mesi', 'registrato', 'cedolare', 'canone', 'deposito', 'spese', 'clausola_recesso', 'preavviso_mesi', 'clausola_aggiornamento', 'quota_istat']) delete situazione[k];
  situazione.tipo = r.situazione;
  situazione.ruolo = r.ruolo;
  return { situazione, contratto };
}

/** L'esito in testo semplice, per il server MCP e per chi copia. */
export function testo(e) {
  if (!e) return '';
  const righe = [];
  const g = (d) => lungo(d);
  righe.push(`${e.situazione ? SITUAZIONI[e.situazione] : 'Affitto'} (${e.ruolo})`);
  righe.push('', e.verdetto.titolo, e.verdetto.testo);
  const c = e.calcoli || {};
  const conti = [];
  if (c.prossimaScadenza) conti.push(`Prossima scadenza del contratto: ${g(c.prossimaScadenza.data)} (${c.prossimaScadenza.nome})`);
  if (c.dataUscita) conti.push(`Fine del preavviso: ${g(c.dataUscita)}`);
  if (c.ultimoGiornoDisdetta) conti.push(`Disdetta da far arrivare entro: ${g(c.ultimoGiornoDisdetta)}`);
  if (c.totale !== undefined) conti.push(`Deposito ${euro(c.deposito)} + interessi ${euro(c.interessi)}${c.trattenuta ? ` - trattenuta ${euro(c.trattenuta)}` : ''} = ${euro(c.totale)}`);
  if (c.nuovoCanone) conti.push(`Nuovo canone massimo: ${euro(c.nuovoCanone)}`);
  if (c.daVersare) conti.push(`Da versare per sanare (stima al ${g(c.alla)}): ${euro(c.daVersare)} più spese del processo`);
  if (c.differenzaMensile) conti.push(`Pagato in più ogni mese: ${euro(c.differenzaMensile)}`);
  if (conti.length) righe.push('', 'Conti:', ...conti.map((x) => `- ${x}`));
  if (e.tabella?.righe?.length) righe.push('', `${e.tabella.titolo}:`, ...e.tabella.righe.map((x) => `- ${x.anno}: ${x.giorni} giorni al ${String(x.tasso).replace('.', ',')}% = ${euro(x.interessi)}`));
  if (e.voci.length) righe.push('', 'Controlli:', ...e.voci.map((v) => `- [${v.esito}] ${v.titolo}. ${v.spiegazione}`));
  if (e.scadenze.length) righe.push('', 'Scadenze:', ...e.scadenze.map((x) => `- ${g(x.data)}: ${x.titolo}${x.scaduta ? ' (passata)' : ''}`));
  if (e.passi.length) righe.push('', 'Passi:', ...e.passi.map((p, i) => `${i + 1}. ${p.titolo}. ${p.testo}`));
  if (e.documento) righe.push('', `Lettera pronta: ${e.documento.tipo.replace(/_/g, ' ')}.`);
  if (e.fonti.length) righe.push('', `Fonti (verificate il ${g(e.verificato)}):`, ...e.fonti.map((f) => `- ${f.titolo}: ${f.url}`));
  righe.push('', 'Strumento informativo: non sostituisce un avvocato, un sindacato degli inquilini o un\'associazione dei proprietari.');
  return righe.join('\n');
}
