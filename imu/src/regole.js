// Regole di «Quanto pago di IMU?»: dalla rendita catastale all'imposta dell'anno, all'acconto
// di giugno, al saldo di dicembre e alle righe del modello F24. Funzioni pure, niente DOM.
//
// Norme verificate il 15/11/2026 sul testo vigente in Normattiva (legge 160/2019, art. 1, commi
// 738-783, versione in vigore dal 12/8/2026 al 26/11/2026: le modifiche del d.lgs. 147/2026 toccano
// solo le dichiarazioni, commi 768-bis, 769 e 770; nessuna modifica in vista ai commi del calcolo).
// Le aliquote dei Comuni vengono dai prospetti pubblicati dal Dipartimento delle Finanze
// (scripts/imu-dati.py): se un'aliquota manca, l'esito chiede il dato, non lo stima.

import { data, iso, scadenza, oggi as oggiDi, giorniTra } from './comune/date.js';

export const VERIFICATO = '2026-11-15';

const NT = (urn) => `https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:${urn}`;
const L160 = (c) => NT(`legge:2019-12-27;160~art1-com${c}`);

export const FONTI = {
  presupposto: { titolo: 'Legge 160/2019, art. 1, comma 740 (abitazione principale esclusa, salvo A/1, A/8, A/9)', url: L160(740) },
  definizioni: { titolo: 'Legge 160/2019, art. 1, comma 741 (abitazione principale, pertinenze C/2, C/6, C/7, casi assimilati)', url: L160(741) },
  corte209: { titolo: 'Corte costituzionale, sentenza 209/2022 (conta la residenza e la dimora di chi possiede)', url: 'https://www.cortecostituzionale.it/actionSchedaPronuncia.do?anno=2022&numero=209' },
  territorio: { titolo: 'Legge 160/2019, art. 1, comma 739 (IMIS a Trento, IMI a Bolzano, ILIA in Friuli Venezia Giulia)', url: L160(739) },
  base: { titolo: 'Legge 160/2019, art. 1, comma 745 (rendita rivalutata del 5% e moltiplicatori)', url: L160(745) },
  terreniAree: { titolo: 'Legge 160/2019, art. 1, comma 746 (aree: valore venale al 1° gennaio; terreni: reddito dominicale +25% × 135)', url: L160(746) },
  riduzioni: { titolo: 'Legge 160/2019, art. 1, comma 747 (base ridotta del 50%: immobili storici, inagibili, comodato ai figli o ai genitori)', url: L160(747) },
  lusso: { titolo: 'Legge 160/2019, art. 1, comma 748 (abitazione principale A/1, A/8, A/9: 0,5%, da 0 a 0,6%)', url: L160(748) },
  detrazione: { titolo: 'Legge 160/2019, art. 1, comma 749 (detrazione di 200 euro)', url: L160(749) },
  rurali: { titolo: 'Legge 160/2019, art. 1, comma 750 (fabbricati rurali strumentali: 0,1%, da 0 a 0,1%)', url: L160(750) },
  beniMerce: { titolo: 'Legge 160/2019, art. 1, comma 751 (beni merce esenti dal 2022)', url: L160(751) },
  terreni: { titolo: 'Legge 160/2019, art. 1, comma 752 (terreni agricoli: 0,76%, da 0 a 1,06%)', url: L160(752) },
  gruppoD: { titolo: 'Legge 160/2019, art. 1, comma 753 (gruppo D: 0,86%, di cui 0,76% allo Stato; da 0,76 a 1,06%)', url: L160(753) },
  altri: { titolo: 'Legge 160/2019, art. 1, comma 754 (altri immobili: 0,86%, da 0 a 1,06%)', url: L160(754) },
  maggiorazione: { titolo: 'Legge 160/2019, art. 1, comma 755 (maggiorazione ex TASI fino a 0,08 punti in più, quindi fino all\'1,14%)', url: L160(755) },
  prospetto: { titolo: 'Legge 160/2019, art. 1, commi 756-757 (prospetto delle aliquote obbligatorio)', url: L160(757) },
  esenzioniTerreni: { titolo: 'Legge 160/2019, art. 1, comma 758 (terreni esenti: coltivatori diretti e IAP, isole minori, montagna e collina)', url: L160(758) },
  esenzioni: { titolo: 'Legge 160/2019, art. 1, comma 759 (esenzioni, compresi gli immobili occupati abusivamente denunciati)', url: L160(759) },
  concordato: { titolo: 'Legge 160/2019, art. 1, comma 760 (canone concordato: imposta al 75%)', url: L160(760) },
  mesi: { titolo: 'Legge 160/2019, art. 1, comma 761 (quota, mesi e regola dei 15 giorni)', url: L160(761) },
  rate: { titolo: 'Legge 160/2019, art. 1, comma 762 (acconto 16 giugno con le aliquote dell\'anno prima, saldo 16 dicembre)', url: L160(762) },
  f24: { titolo: 'Legge 160/2019, art. 1, comma 765 (pagamento con F24, bollettino o pagoPA)', url: L160(765) },
  efficacia: { titolo: 'Legge 160/2019, art. 1, comma 767 (aliquote valide se pubblicate entro il 28 ottobre; altrimenti quelle dell\'anno prima o di base)', url: L160(767) },
  dichiarazione: { titolo: 'Legge 160/2019, art. 1, comma 768-bis (dichiarazione IMU entro il 30 giugno dell\'anno dopo)', url: L160('768bis') },
  pensionati: { titolo: 'Legge 178/2020, art. 1, comma 48 (pensionati residenti all\'estero: IMU alla metà)', url: NT('legge:2020-12-30;178~art1-com48') },
  arrotondamento: { titolo: 'Legge 296/2006, art. 1, comma 166 (arrotondamento all\'euro)', url: NT('legge:2006-12-27;296~art1-com166') },
  codici: { titolo: 'Agenzia delle Entrate, codici tributo IMU (risoluzioni 35/E 2012, 33/E 2013, 29/E 2020) e esempio di compilazione', url: 'https://www1.agenziaentrate.gov.it/servizi/codici/ricerca/elencoTributi.php?Q1=&Q3=IMU%2FICI+E+ALTRI+TRIBUTI+COMUNALI&Q2=Tutte&Q4=Tutte' },
  scadenzeFestive: { titolo: 'Decreto-legge 70/2011, art. 7, comma 2, lettera l) (scadenza di sabato o festivo: primo giorno lavorativo dopo)', url: NT('decreto.legge:2011-05-13;70~art7') },
  aliquoteMef: { titolo: 'Dipartimento delle Finanze: prospetti delle aliquote IMU per Comune', url: 'https://www.finanze.gov.it/it/fiscalita/fiscalita-regionale-e-locale/Imposta-municipale-propria-IMU/Regolamenti-e-aliquote-ricerca/' },
};

export const RICERCA_MEF = 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_imu/sceltaregione.htm';

// ---------------- categorie catastali ----------------

export const CATEGORIE = {
  'A/1': 'Abitazione signorile', 'A/2': 'Abitazione civile', 'A/3': 'Abitazione economica', 'A/4': 'Abitazione popolare', 'A/5': 'Abitazione ultrapopolare',
  'A/6': 'Abitazione rurale', 'A/7': 'Villino', 'A/8': 'Villa', 'A/9': 'Castello, palazzo storico', 'A/10': 'Ufficio, studio privato', 'A/11': 'Alloggio tipico dei luoghi',
  'B/1': 'Collegi, convitti, caserme', 'B/2': 'Case di cura e ospedali senza fine di lucro', 'B/3': 'Prigioni e riformatori', 'B/4': 'Uffici pubblici', 'B/5': 'Scuole e laboratori scientifici',
  'B/6': 'Biblioteche, musei, gallerie', 'B/7': 'Cappelle e oratori', 'B/8': 'Magazzini sotterranei',
  'C/1': 'Negozio, bottega', 'C/2': 'Magazzino, cantina, soffitta', 'C/3': 'Laboratorio artigiano', 'C/4': 'Fabbricato per esercizi sportivi senza fine di lucro', 'C/5': 'Stabilimento balneare senza fine di lucro',
  'C/6': 'Box, garage, posto auto, stalla', 'C/7': 'Tettoia', 'D/1': 'Opificio', 'D/2': 'Albergo', 'D/3': 'Teatro, cinema', 'D/4': 'Casa di cura con fine di lucro', 'D/5': 'Banca, assicurazione',
  'D/6': 'Impianto sportivo con fine di lucro', 'D/7': 'Capannone industriale', 'D/8': 'Capannone commerciale, centro commerciale', 'D/9': 'Edificio galleggiante', 'D/10': 'Fabbricato rurale strumentale',
  'E/1': 'Stazione per servizi di trasporto', 'E/2': 'Ponte comunale o provinciale', 'E/3': 'Costruzione per speciali esigenze pubbliche', 'E/4': 'Recinto chiuso per speciali esigenze pubbliche',
  'E/5': 'Fabbricato costituente fortificazione', 'E/6': 'Faro, semaforo, torre per orologio', 'E/7': 'Fabbricato per il culto', 'E/8': 'Fabbricato o costruzione nei cimiteri', 'E/9': 'Edificio a destinazione particolare',
};
const LUSSO = ['A/1', 'A/8', 'A/9'];
const PERTINENZE = ['C/2', 'C/6', 'C/7'];
const gruppo = (cat) => String(cat || '').split('/')[0];

/** Il moltiplicatore della rendita (comma 745). null se la categoria non è valida. */
export function moltiplicatore(cat) {
  if (!CATEGORIE[cat]) return null;
  const g = gruppo(cat);
  if (cat === 'A/10' || cat === 'D/5') return 80;
  if (g === 'A' || PERTINENZE.includes(cat)) return 160;
  if (g === 'B' || ['C/3', 'C/4', 'C/5'].includes(cat)) return 140;
  if (cat === 'C/1') return 55;
  if (g === 'D') return 65;
  return null; // E: esenti
}

/** Aliquote di base di legge (commi 748-754), in percento. */
export const ALIQUOTE_BASE = { abitazione_lusso: 0.5, rurali: 0.1, gruppo_d: 0.86, terreni: 0.76, aree: 0.86, altri: 0.86 };
/** Intervallo che il Comune può scegliere (commi 748-754), più la maggiorazione ex TASI fino a 0,08 punti (comma 755). */
export const FORCHETTA = { abitazione_lusso: [0, 0.68], rurali: [0, 0.1], gruppo_d: [0.76, 1.14], terreni: [0, 1.14], aree: [0, 1.14], altri: [0, 1.14] };
const MASSIMO_SENZA_755 = { abitazione_lusso: 0.6, rurali: 0.1, gruppo_d: 1.06, terreni: 1.06, aree: 1.06, altri: 1.06 };
export const QUOTA_STATO_D = 0.76;
export const DETRAZIONE = 200;

export const VOCI_ALIQUOTA = {
  abitazione_lusso: 'Abitazione principale di lusso (A/1, A/8, A/9) e pertinenze',
  rurali: 'Fabbricati rurali strumentali',
  gruppo_d: 'Fabbricati del gruppo D',
  terreni: 'Terreni agricoli',
  aree: 'Aree fabbricabili',
  altri: 'Altri fabbricati',
};

export const CODICI = {
  3912: 'Abitazione principale di lusso e pertinenze, Comune',
  3913: 'Fabbricati rurali strumentali, Comune',
  3914: 'Terreni, Comune',
  3916: 'Aree fabbricabili, Comune',
  3918: 'Altri fabbricati, Comune',
  3925: 'Gruppo D, quota Stato',
  3930: 'Gruppo D, quota Comune',
};

// Sigle delle province senza IMU (comma 739)
const SENZA_IMU = { TN: 'IMIS (imposta immobiliare semplice della Provincia di Trento)', BZ: 'IMI (imposta municipale immobiliare della Provincia di Bolzano)', GO: 'ILIA (imposta locale immobiliare autonoma del Friuli Venezia Giulia)', PN: 'ILIA (imposta locale immobiliare autonoma del Friuli Venezia Giulia)', TS: 'ILIA (imposta locale immobiliare autonoma del Friuli Venezia Giulia)', UD: 'ILIA (imposta locale immobiliare autonoma del Friuli Venezia Giulia)' };

// ---------------- arrotondamenti e mesi ----------------

const cent = (x) => Math.round(x * 100) / 100;

/** Arrotondamento all'euro dei tributi locali (L. 296/2006, c. 166): fino a 49 centesimi per difetto, da 50 per eccesso. */
export function arrotonda(x) {
  const c = Math.round(Math.abs(x) * 100);
  const e = Math.floor(c / 100) + (c % 100 >= 50 ? 1 : 0);
  return x < 0 ? -e : e;
}

const giorniMese = (anno, m) => new Date(Date.UTC(anno, m, 0)).getUTCDate(); // m 1-12

/**
 * I mesi di possesso di un anno (comma 761). `dal` = giorno in cui il possesso comincia (rogito d'acquisto,
 * successione), `al` = giorno del trasferimento a un altro (rogito di vendita): quel giorno conta per chi compra.
 * Un mese conta se il possesso supera metà dei giorni; a parità di giorni conta per chi acquista.
 * @returns {{mesi: number, primoSemestre: number, elenco: number[]}} elenco = mesi contati (1-12)
 */
export function mesiPossesso(anno, dal, al) {
  const inizio = dal ? data(dal) : null;
  const fine = al ? data(al) : null;
  const elenco = [];
  for (let m = 1; m <= 12; m++) {
    const n = giorniMese(anno, m);
    const primo = Date.UTC(anno, m - 1, 1, 12);
    const ultimo = Date.UTC(anno, m - 1, n, 12);
    let da = primo;
    let a = ultimo;
    if (inizio) da = Math.max(da, inizio.getTime());
    if (fine) a = Math.min(a, fine.getTime() - 86400000); // il giorno del trasferimento è di chi compra
    const giorni = a >= da ? Math.round((a - da) / 86400000) + 1 : 0;
    const acquistoQui = inizio && inizio.getTime() >= primo && inizio.getTime() <= ultimo;
    const cessioneQui = fine && fine.getTime() >= primo && fine.getTime() <= ultimo;
    // a parità di giorni il mese va a chi acquista (comma 761, terzo periodo)
    if (giorni * 2 > n || (giorni * 2 === n && acquistoQui && !cessioneQui)) elenco.push(m);
  }
  return { mesi: elenco.length, primoSemestre: elenco.filter((m) => m <= 6).length, elenco };
}

// ---------------- le aliquote del Comune ----------------

/** Quale fattispecie del prospetto vale per l'immobile. */
export function voceAliquota(im) {
  const cat = im.categoria;
  if (im.tipo === 'terreno') return 'terreni';
  if (im.tipo === 'area') return 'aree';
  if (im.uso === 'rurale' || cat === 'D/10') return 'rurali';
  if (gruppo(cat) === 'D') return 'gruppo_d';
  if ((im.uso === 'abitazione_principale' || im.uso === 'pertinenza' || im.uso === 'assimilata') && LUSSO.includes(im._categoriaPrincipale || cat)) return 'abitazione_lusso';
  return 'altri';
}

const PREFISSI = {
  abitazione_lusso: /^Abitazione principale/i, rurali: /^Fabbricati rurali/i, gruppo_d: /^Fabbricati appartenenti al gruppo catastale D/i,
  terreni: /^Terreni/i, aree: /^Aree/i, altri: /^Altri fabbricati/i,
};

/** Le aliquote differenziate del prospetto che possono valere per l'immobile (stessa fattispecie e categoria). */
export function alternative(voce, im) {
  const chiave = voceAliquota(im);
  return (voce?.diff || []).map((d, i) => ({ ...d, i })).filter((d) => PREFISSI[chiave]?.test(d.fattispecie) && (!d.categorie || !im.categoria || d.categorie.includes(im.categoria)));
}

// la stessa aliquota differenziata in due anni: confronto senza accenti, apostrofi e spazi («Purché» = «Purche'»)
const chiaveDiff = (d) => `${d.fattispecie}|${(d.condizioni || []).join('|')}`.toLowerCase().normalize('NFD').replace(/[^a-z0-9|]/g, '');

/**
 * Le aliquote che valgono nel Comune per l'anno (comma 767): il prospetto dell'anno pubblicato entro il 28 ottobre,
 * altrimenti quello dell'anno prima; senza prospetti dal 2025 in poi, le aliquote di base di legge.
 * @param comune { nome, sigla, anni: { '2025': [voce], '2026': [voce] } } dal file dati/p/<sigla>.json
 * @param anniDisponibili gli anni coperti dai dati (per sapere se «nessun prospetto» è un fatto o un buco)
 */
export function prospettoDellAnno(comune, anno, { exComune, anniDisponibili = [2025, 2026] } = {}) {
  if (!comune) return { stato: 'manca', motivo: 'comune' };
  // undefined = anno non coperto dai dati; null = nessun prospetto pubblicato
  const cerca = (a) => {
    if (!anniDisponibili.includes(a)) return undefined;
    const lista = comune.anni?.[String(a)];
    if (!lista?.length) return null;
    if (lista.length === 1) return lista[0];
    const v = exComune && lista.find((x) => x.ex_comune && x.ex_comune.toLowerCase() === String(exComune).toLowerCase());
    return v || { stato: 'fusione', ex: lista.map((x) => x.ex_comune).filter(Boolean) };
  };
  // senza prospetto nuovo valgono le aliquote «vigenti nell'anno precedente», che possono venire da un anno ancora prima
  const ultimo = Math.max(...anniDisponibili);
  if (anno < 2025) return { stato: 'manca', motivo: 'anno', anno };
  for (let a = anno; a >= 2025; a--) {
    const v = cerca(a);
    if (v === undefined) {
      if (a > ultimo) continue; // anno non ancora pubblicato: si guarda l'anno prima
      return { stato: 'manca', motivo: 'anno', anno: a };
    }
    if (v === null) continue;
    if (v.stato === 'fusione') return { stato: 'fusione', ex: v.ex, anno: a };
    if (v.stato === 'pdf_mancante' || v.stato === 'non_prospetto' || !v.base) return { stato: 'manca', motivo: 'lettura', anno: a, voce: v };
    return { stato: a === anno ? 'prospetto' : 'anno_prima', anno: a, voce: v };
  }
  // dal 2025, senza una delibera con il prospetto: aliquote di base (comma 767, ultimo periodo)
  return { stato: 'base_legge', anno, voce: { base: { ...ALIQUOTE_BASE, assimilazione_anziani: false }, diff: [], esenzioni: [] } };
}

/**
 * L'aliquota per un immobile in un anno: { valore (percento) | 'esente' | null, origine, alternative, ... }
 * opz.diff = indice di un'aliquota differenziata del prospetto; opz.diffChiave = la stessa cercata per testo (anno prima).
 */
export function aliquotaPer(im, comune, anno, opz = {}) {
  const chiave = voceAliquota(im);
  const p = prospettoDellAnno(comune, anno, { exComune: im.ex_comune, anniDisponibili: opz.anniDisponibili });
  const alt = p.voce ? alternative(p.voce, im) : [];
  const out = { chiave, prospetto: p, alternative: alt, base: p.voce?.base?.[chiave] ?? null };
  out.valore = out.base;
  out.origine = p.stato;
  const lista = p.voce?.diff || [];
  const d = opz.diff !== undefined && opz.diff !== null && opz.diff !== '' ? lista[Number(opz.diff)] : opz.diffChiave ? lista.find((x) => chiaveDiff(x) === opz.diffChiave) : null;
  if (d) { out.valore = d.aliquota; out.origine = 'differenziata'; out.scelta = d; }
  if (p.stato === 'manca' || p.stato === 'fusione') out.valore = null;
  return out;
}

// ---------------- il calcolo ----------------

const TIPI = { fabbricato: 'Fabbricato', terreno: 'Terreno agricolo', area: 'Area fabbricabile' };
export const USI = [
  ['abitazione_principale', 'Ci abito: residenza e dimora abituale (abitazione principale)'],
  ['pertinenza', 'Pertinenza della casa in cui abito (cantina, box, tettoia)'],
  ['assimilata', 'Equiparata per legge all\'abitazione principale (casa assegnata al genitore affidatario, Forze armate e polizia, cooperativa a proprietà indivisa, alloggio sociale)'],
  ['ricoverato', 'Casa non affittata di un anziano o disabile ricoverato in modo permanente in un istituto'],
  ['disposizione', 'Seconda casa, sfitta o a disposizione'],
  ['locato', 'Affittata a canone libero o ad uso diverso'],
  ['concordato', 'Affittata a canone concordato (legge 431/1998)'],
  ['comodato', 'In comodato gratuito a un figlio o a un genitore che ci abita'],
  ['pensionato_estero', 'Unica casa in Italia di chi vive all\'estero con una pensione in convenzione internazionale'],
  ['impresa', 'Uso dell\'attività (negozio, ufficio, laboratorio, capannone)'],
  ['rurale', 'Fabbricato rurale strumentale all\'attività agricola'],
  ['beni_merce', 'Costruito dall\'impresa per venderlo, non affittato'],
  ['occupato', 'Occupato abusivamente, con denuncia presentata'],
];
const NOME_USO = Object.fromEntries(USI);

const norma = (f) => FONTI[f];

/**
 * Calcola l'IMU di un insieme di immobili.
 * @param {Array} immobili ogni immobile:
 *   { nome?, comune: 'H501' (codice catastale), tipo: 'fabbricato'|'terreno'|'area', categoria: 'A/2', rendita (euro),
 *     reddito_dominicale, valore_venale, quota (percento, default 100), dal?, al? ('AAAA-MM-GG' nell'anno), mesi?, mesi_primo_semestre?,
 *     uso (vedi USI), storico?, inagibile?, comodato_requisiti?, coltivatore?, aliquota? (percento scelto da te),
 *     aliquota_acconto?, diff? (indice di un'aliquota differenziata del prospetto dell'anno), ex_comune?, abitanti? (contitolari che ci abitano) }
 * @param {object} opzioni { anno (default 2026), oggi, comuni: { 'H501': {nome, sigla, anni} }, anniDisponibili, unica_soluzione }
 */
export function calcolaImu(immobili = [], opzioni = {}) {
  const anno = Number(opzioni.anno) || 2026;
  const oggi = oggiDi(opzioni.oggi);
  const comuni = opzioni.comuni || {};
  const anniDisponibili = opzioni.anniDisponibili || [2025, 2026];
  const avvisi = [];
  const servono = [];
  const fontiUsate = new Set(['base', 'mesi', 'rate', 'efficacia', 'arrotondamento', 'codici', 'aliquoteMef']);
  const righe = [];

  // l'abitazione principale di riferimento per le pertinenze, per Comune
  const principali = {};
  immobili.forEach((im, i) => {
    if (['abitazione_principale', 'assimilata', 'ricoverato'].includes(im.uso) && (im.tipo || 'fabbricato') === 'fabbricato') principali[im.comune] ??= { i, categoria: im.categoria };
  });
  const pertinenzeViste = {};

  immobili.forEach((im0, i) => {
    const im = { tipo: 'fabbricato', quota: 100, ...im0 };
    const nome = im.nome || `${TIPI[im.tipo] || 'Immobile'}${im.categoria && im.tipo === 'fabbricato' ? ` ${im.categoria}` : ''}`;
    const r = { i, nome, tipo: im.tipo, categoria: im.tipo === 'fabbricato' ? im.categoria || null : null, uso: im.uso || null, comune: im.comune || null, stato: 'calcolato', note: [], servono: [], esente: null };
    righe.push(r);
    const c = comuni[im.comune];
    r.comuneNome = c?.nome || null;
    r.sigla = c?.sigla || im.sigla || null;
    const manca = (campo, testo) => { r.servono.push({ campo, testo }); r.stato = 'dato'; };

    if (!im.comune) manca('comune', 'Il Comune dove si trova l\'immobile.');
    if (r.sigla && SENZA_IMU[r.sigla]) {
      r.stato = 'non_imu';
      r.esente = `In questa provincia non c'è l'IMU ma la ${SENZA_IMU[r.sigla]}: questo calcolo non vale.`;
      fontiUsate.add('territorio');
      return;
    }
    if (!['fabbricato', 'terreno', 'area'].includes(im.tipo)) { manca('tipo', 'Se è un fabbricato, un terreno agricolo o un\'area fabbricabile.'); return; }

    // --- possesso: quota e mesi ---
    const quota = Number(im.quota);
    if (!(quota > 0 && quota <= 100)) manca('quota', 'La tua quota di possesso, in percento (100 se l\'immobile è tutto tuo).');
    let mesi = 12;
    let semestre = 6;
    if (im.dal || im.al) {
      const dal = im.dal ? data(im.dal) : null;
      const al = im.al ? data(im.al) : null;
      if ((im.dal && !dal) || (im.al && !al)) { manca('dal', 'Le date del possesso vanno scritte come AAAA-MM-GG.'); return; }
      const inizioAnno = data(`${anno}-01-01`);
      const fineAnno = data(`${anno}-12-31`);
      if ((dal && dal > fineAnno) || (al && al <= inizioAnno)) { mesi = 0; semestre = 0; r.elencoMesi = []; } else {
        const mp = mesiPossesso(anno, dal && dal >= inizioAnno ? im.dal : null, al && al <= fineAnno ? im.al : null);
        mesi = mp.mesi;
        semestre = mp.primoSemestre;
        r.elencoMesi = mp.elenco;
      }
      r.variato = (dal && dal >= inizioAnno && dal <= fineAnno) || (al && al > inizioAnno && al <= fineAnno) || false;
    } else if (im.mesi !== undefined && im.mesi !== null && im.mesi !== '') {
      mesi = Math.max(0, Math.min(12, Math.round(Number(im.mesi))));
      if (mesi < 12) {
        r.variato = true;
        if (im.mesi_primo_semestre !== undefined && im.mesi_primo_semestre !== null) semestre = Math.max(0, Math.min(6, mesi, Math.round(Number(im.mesi_primo_semestre))));
        else { semestre = null; r.note.push('Per dividere l\'imposta tra acconto e saldo servono le date di inizio o fine del possesso (o i mesi tra gennaio e giugno).'); }
      }
    }
    r.quota = quota;
    r.mesi = mesi;
    r.mesiPrimoSemestre = semestre;

    // --- esenzioni ---
    const cat = im.categoria;
    if (im.tipo === 'fabbricato') {
      if (!cat || !CATEGORIE[cat]) { manca('categoria', 'La categoria catastale (es. A/2, C/6): è scritta nella visura catastale o nell\'atto.'); return; }
      if (gruppo(cat) === 'E') { r.esente = 'I fabbricati delle categorie da E/1 a E/9 sono esenti.'; fontiUsate.add('esenzioni'); r.stato = 'esente'; }
    }
    if (!r.esente && im.uso === 'occupato') { r.esente = 'Esente finché è occupato abusivamente e c\'è la denuncia: devi comunicarlo al Comune con la dichiarazione IMU.'; fontiUsate.add('esenzioni').add('dichiarazione'); r.stato = 'esente'; }
    if (!r.esente && im.uso === 'beni_merce') { r.esente = 'Dal 2022 i fabbricati costruiti dall\'impresa per venderli, finché non sono affittati, sono esenti.'; fontiUsate.add('beniMerce'); r.stato = 'esente'; }
    if (!r.esente && im.tipo === 'terreno' && im.coltivatore) { r.esente = 'Esente: terreno posseduto e condotto da coltivatore diretto o imprenditore agricolo professionale iscritto alla previdenza agricola.'; fontiUsate.add('esenzioniTerreni'); r.stato = 'esente'; }

    let principale = null;
    if (!r.esente && im.tipo === 'fabbricato' && im.uso === 'ricoverato') {
      fontiUsate.add('definizioni');
      const p = prospettoDellAnno(c, anno, { exComune: im.ex_comune, anniDisponibili });
      const ok = p.voce?.base?.assimilazione_anziani;
      if (ok === true) { im.uso = 'assimilata'; r.note.push('Il prospetto del Comune equipara all\'abitazione principale la casa dell\'anziano o disabile ricoverato (una sola, non affittata).'); }
      else if (ok === false) { im.uso = 'disposizione'; r.note.push(p.stato === 'base_legge' ? 'Senza un prospetto del Comune l\'equiparazione non c\'è: si paga come altro fabbricato.' : 'Il prospetto del Comune non equipara la casa dell\'anziano o disabile ricoverato: si paga come altro fabbricato.'); }
      else { manca('aliquota', 'Serve il prospetto del Comune per sapere se equipara all\'abitazione principale la casa dell\'anziano o disabile ricoverato.'); return; }
    }
    if (!r.esente && im.tipo === 'fabbricato' && (im.uso === 'abitazione_principale' || im.uso === 'assimilata')) {
      fontiUsate.add('presupposto').add('definizioni');
      if (im.uso === 'abitazione_principale') fontiUsate.add('corte209');
      if (gruppo(cat) !== 'A' || cat === 'A/10') { r.note.push(`La categoria ${cat} non è un'abitazione: la calcolo come altro fabbricato.`); im.uso = 'disposizione'; }
      else if (!LUSSO.includes(cat)) { r.esente = 'Abitazione principale non di lusso: non si paga l\'IMU.'; r.stato = 'esente'; }
      else principale = true;
    }
    if (!r.esente && im.tipo === 'fabbricato' && im.uso === 'pertinenza') {
      fontiUsate.add('definizioni');
      const p = principali[im.comune];
      if (!PERTINENZE.includes(cat)) { r.note.push(`Solo le categorie C/2, C/6 e C/7 possono essere pertinenze: ${cat} si calcola come altro fabbricato.`); im.uso = 'disposizione'; }
      else if (!p) { manca('principale', 'Aggiungi anche la casa in cui abiti (anche se non paga): la pertinenza segue le sue regole.'); return; }
      else {
        const k = `${im.comune}|${cat}`;
        pertinenzeViste[k] = (pertinenzeViste[k] || 0) + 1;
        if (pertinenzeViste[k] > 1) { r.note.push(`Una sola pertinenza per categoria: questa seconda ${cat} paga come altro fabbricato.`); im.uso = 'disposizione'; }
        else if (!LUSSO.includes(p.categoria)) { r.esente = `Pertinenza dell'abitazione principale (una per categoria): non si paga l'IMU.`; r.stato = 'esente'; }
        else { principale = true; im._categoriaPrincipale = p.categoria; }
      }
    }
    if (r.esente) { r.imposta = 0; r.acconto = 0; r.saldo = 0; return; }
    if (r.stato === 'dato') return;

    // --- base imponibile ---
    let base = null;
    if (im.tipo === 'fabbricato') {
      const rendita = Number(im.rendita);
      if (!(rendita > 0)) { manca('rendita', 'La rendita catastale in euro (nella visura catastale, o nell\'atto d\'acquisto).'); return; }
      const k = moltiplicatore(cat);
      base = rendita * 1.05 * k;
      r.calcoloBase = `${fmtEur(rendita)} × 1,05 × ${k}`;
    } else if (im.tipo === 'terreno') {
      const rd = Number(im.reddito_dominicale);
      if (!(rd > 0)) { manca('reddito_dominicale', 'Il reddito dominicale in euro (nella visura catastale del terreno).'); return; }
      base = rd * 1.25 * 135;
      r.calcoloBase = `${fmtEur(rd)} × 1,25 × 135`;
      fontiUsate.add('terreniAree');
    } else {
      const vv = Number(im.valore_venale);
      if (!(vv > 0)) { manca('valore_venale', 'Il valore di mercato dell\'area al 1° gennaio: molti Comuni pubblicano valori di riferimento per zona.'); return; }
      base = vv;
      r.calcoloBase = `valore venale ${fmtEur(vv)}`;
      fontiUsate.add('terreniAree');
    }
    r.baseImponibile = cent(base);

    // --- riduzioni della base (comma 747) ---
    const riduzioni = [];
    if (im.tipo === 'fabbricato') {
      if (im.uso === 'comodato') {
        fontiUsate.add('riduzioni');
        if (LUSSO.includes(cat)) r.note.push('La riduzione per il comodato non vale per A/1, A/8 e A/9.');
        else if (gruppo(cat) !== 'A' && !PERTINENZE.includes(cat)) r.note.push('La riduzione per il comodato vale per le abitazioni (e le loro pertinenze).');
        else if (im.comodato_requisiti === true) riduzioni.push('comodato a un parente in linea retta di primo grado (contratto registrato, una sola abitazione oltre alla tua nello stesso Comune, residenza nello stesso Comune)');
        else if (im.comodato_requisiti === false) r.note.push('Senza tutti i requisiti del comodato (contratto registrato, figlio o genitore che ci abita, al massimo un\'altra abitazione tua nello stesso Comune in cui risiedi) la base non si riduce.');
        else { manca('comodato_requisiti', 'Se il comodato ha tutti i requisiti: contratto registrato, figlio o genitore che ci abita con la residenza, tu possiedi in Italia solo questa casa (o anche quella dove abiti, nello stesso Comune) e risiedi nello stesso Comune.'); return; }
      }
      if (im.storico) riduzioni.push('immobile di interesse storico o artistico');
      if (im.inagibile) riduzioni.push('inagibile o inabitabile e di fatto non usato');
      if (im.storico || im.inagibile) fontiUsate.add('riduzioni');
    }
    let baseRidotta = base;
    if (riduzioni.length) {
      baseRidotta = base * 0.5;
      if (riduzioni.length > 1) r.note.push('La norma elenca le riduzioni del 50% una per una e non dice se si sommano: ne applico una sola. Chiedi all\'ufficio tributi del Comune.');
      if (im.inagibile) r.note.push('La riduzione per inagibilità vale solo per il periodo in cui l\'immobile è inagibile, con perizia del Comune o dichiarazione sostitutiva di un tecnico.');
    }
    r.riduzioni = riduzioni;
    r.baseRidotta = cent(baseRidotta);

    // --- aliquote: dell'anno (per il totale) e dell'anno prima (per l'acconto) ---
    const al = aliquotaPer(im, c, anno, { anniDisponibili, diff: im.diff });
    r.voce = al.chiave;
    r.prospetto = al.prospetto;
    r.alternative = al.alternative;
    r.esenzioniComune = al.prospetto.voce?.esenzioni || [];
    let aliq = al.valore;
    r.origineAliquota = al.origine;
    if (im.aliquota !== undefined && im.aliquota !== null && im.aliquota !== '') { aliq = Number(im.aliquota); r.origineAliquota = 'tua'; }
    if (al.scelta) r.sceltaDiff = al.scelta;
    fontiUsate.add({ abitazione_lusso: 'lusso', rurali: 'rurali', gruppo_d: 'gruppoD', terreni: 'terreni', aree: 'altri', altri: 'altri' }[al.chiave]);

    if (aliq === 'esente') {
      r.esente = im.tipo === 'terreno' ? 'Il Comune indica i terreni agricoli come esenti (isole minori o zone montane e collinari, comma 758).' : 'Il prospetto del Comune indica questa voce come esente.';
      fontiUsate.add('esenzioniTerreni');
      r.stato = 'esente'; r.imposta = 0; r.acconto = 0; r.saldo = 0;
      return;
    }
    if (aliq === null || aliq === undefined || !Number.isFinite(aliq)) {
      const motivo = al.prospetto.stato === 'fusione'
        ? `Il Comune ha aliquote diverse per i Comuni fusi (${al.prospetto.ex.join(', ')}): indica l'ex Comune dove si trova l'immobile, o scrivi l'aliquota.`
        : al.prospetto.motivo === 'lettura'
          ? 'Il prospetto del Comune c\'è ma non sono riuscito a leggerlo: scrivi l\'aliquota che trovi nel prospetto.'
          : 'Non ho le aliquote di questo Comune per quest\'anno: scrivi l\'aliquota che trovi nel prospetto pubblicato dal Dipartimento delle Finanze.';
      manca(al.prospetto.stato === 'fusione' ? 'ex_comune' : 'aliquota', motivo);
      return;
    }
    if (!(aliq >= 0 && aliq <= 1.2)) { manca('aliquota', 'L\'aliquota va scritta in percento (per esempio 1,06): nessuna aliquota IMU supera l\'1,14%.'); return; }
    if (r.origineAliquota === 'tua') {
      const [mi, ma] = FORCHETTA[al.chiave];
      if (aliq < mi || aliq > ma) r.note.push(`L'aliquota ${fmtPerc(aliq)} è fuori dalla forchetta di legge per questa voce (${fmtPerc(mi)}-${fmtPerc(ma)}): ricontrolla.`);
    }
    if (aliq > MASSIMO_SENZA_755[al.chiave] + 1e-9) fontiUsate.add('maggiorazione');
    if (al.alternative.length && r.origineAliquota !== 'differenziata' && r.origineAliquota !== 'tua') r.note.push('Il Comune prevede aliquote diverse per alcuni casi: controlla se il tuo è tra questi e sceglilo.');
    if (al.prospetto.voce?.non_letti && r.origineAliquota !== 'tua') r.note.push(`Nel prospetto ci sono ${al.prospetto.voce.non_letti} aliquote differenziate che non sono riuscito a leggere: se il tuo caso è particolare, controlla il prospetto.`);
    r.aliquota = aliq;

    // acconto: aliquota dell'anno prima (comma 762)
    let aliqAcc = null;
    let origineAcc = null;
    if (im.aliquota_acconto !== undefined && im.aliquota_acconto !== null && im.aliquota_acconto !== '') { aliqAcc = Number(im.aliquota_acconto); origineAcc = 'tua'; }
    else {
      const ap = aliquotaPer(im, c, anno - 1, { anniDisponibili, diffChiave: al.scelta ? chiaveDiff(al.scelta) : undefined });
      if (ap.valore === 'esente') { aliqAcc = 0; origineAcc = ap.origine; }
      else if (Number.isFinite(ap.valore)) {
        aliqAcc = ap.valore; origineAcc = ap.origine;
        if (al.scelta && ap.origine !== 'differenziata') r.note.push(`Per l'acconto ho usato l'aliquota di base dell'anno prima (${fmtPerc(ap.valore)}): nel prospetto ${anno - 1} non trovo la stessa aliquota differenziata.`);
      } else {
        aliqAcc = aliq; origineAcc = 'stessa';
        r.note.push(`Per l'acconto serviva l'aliquota del ${anno - 1}, che non ho: ho usato quella del ${anno}. Il totale dell'anno non cambia, cambia solo come si divide tra acconto e saldo.`);
      }
    }
    r.aliquotaAcconto = aliqAcc;
    r.origineAliquotaAcconto = origineAcc;

    // --- imposta ---
    const fattore = (im.uso === 'concordato' ? 0.75 : 1) * (im.uso === 'pensionato_estero' ? 0.5 : 1);
    if (im.uso === 'concordato') { fontiUsate.add('concordato'); if (gruppo(cat) !== 'A' && !PERTINENZE.includes(cat)) r.note.push('Il canone concordato riguarda le abitazioni: controlla che il contratto copra questo immobile.'); }
    if (im.uso === 'pensionato_estero') { fontiUsate.add('pensionati'); r.note.push('La riduzione vale per una sola abitazione, non affittata e non in comodato, di chi risiede all\'estero ed è titolare di una pensione maturata in convenzione internazionale con l\'Italia.'); }
    const lordo = (al2, m) => baseRidotta * (al2 / 100) * (quota / 100) * (m / 12) * fattore;
    let imposta = lordo(aliq, mesi);
    let acconto = semestre === null ? null : lordo(aliqAcc, semestre);
    let detr = 0;
    let detrAcc = 0;
    if (principale) {
      fontiUsate.add('detrazione');
      const abitanti = Math.max(1, Number(im.abitanti) || 1);
      r.detrazioneTeorica = DETRAZIONE * (mesi / 12) / abitanti;
      r.detrazioneTeoricaAcconto = semestre === null ? null : DETRAZIONE * (semestre / 12) / abitanti;
      r.principale = true;
    }
    // quota Stato per il gruppo D (comma 753)
    if (al.chiave === 'gruppo_d') {
      const st = Math.min(aliq, QUOTA_STATO_D);
      const stAcc = Math.min(aliqAcc, QUOTA_STATO_D);
      r.stato_quota = { anno: lordo(st, mesi), acconto: semestre === null ? null : lordo(stAcc, semestre) };
      if (aliq < QUOTA_STATO_D) r.note.push('Per il gruppo D l\'aliquota non può scendere sotto lo 0,76%, che va allo Stato: ricontrolla.');
    }
    r.impostaLorda = imposta;
    r.accontoLordo = acconto;
    r.detr = detr; r.detrAcc = detrAcc;
  });

  // --- detrazione: si applica all'abitazione principale di lusso e alle sue pertinenze, fino a concorrenza ---
  const gruppiDetr = {};
  for (const r of righe) if (r.principale) (gruppiDetr[r.comune] ||= []).push(r);
  for (const lista of Object.values(gruppiDetr)) {
    const casa = lista.find((x) => x.detrazioneTeorica !== undefined && (x.uso === 'abitazione_principale' || x.uso === 'assimilata')) || lista[0];
    for (const [campo, lordo, out] of [['detrazioneTeorica', 'impostaLorda', 'detr'], ['detrazioneTeoricaAcconto', 'accontoLordo', 'detrAcc']]) {
      let resta = casa[campo];
      if (resta === null || resta === undefined) continue;
      for (const r of [casa, ...lista.filter((x) => x !== casa)]) {
        if (r[lordo] === null || r[lordo] === undefined) continue;
        const usa = Math.min(resta, r[lordo]);
        r[out] = usa; resta -= usa;
      }
    }
  }

  for (const r of righe) {
    if (r.impostaLorda === undefined) continue;
    r.detrazione = cent(r.detr || 0);
    r.detrazioneAcconto = cent(r.detrAcc || 0);
    r.imposta = cent(r.impostaLorda - (r.detr || 0));
    r.acconto = r.accontoLordo === null ? null : cent(r.accontoLordo - (r.detrAcc || 0));
    r.saldo = r.acconto === null ? null : cent(r.imposta - r.acconto);
    if (r.saldo !== null && r.saldo < 0) r.note.push('Con le aliquote nuove l\'acconto supera l\'imposta dell\'anno: la differenza si chiede a rimborso o in compensazione al Comune.');
    r.codice = { abitazione_lusso: 3912, rurali: 3913, terreni: 3914, aree: 3916, altri: 3918, gruppo_d: 3930 }[r.voce];
    delete r.impostaLorda; delete r.accontoLordo; delete r.detr; delete r.detrAcc;
  }

  // --- totali e righe del modello F24 (arrotondate per riga, comma 166 L. 296/2006) ---
  const calcolate = righe.filter((r) => r.stato === 'calcolato');
  const totale = cent(calcolate.reduce((s, r) => s + (r.imposta || 0), 0));
  const completo = righe.every((r) => r.stato !== 'dato');
  const divisibile = calcolate.every((r) => r.acconto !== null);
  const f24 = { acconto: [], saldo: [], unica: [] };
  const mappa = {};
  const somma = (k, comune, codice, campo, v, detr, im) => {
    const key = `${k}|${comune}|${codice}`;
    const x = (mappa[key] ||= { rata: k, comune, codice, importo: 0, detrazione: 0, immobili: new Set(), variati: false });
    x.importo += v; x.detrazione += detr || 0; x.immobili.add(im.i); x.variati ||= !!im.variato;
  };
  for (const r of calcolate) {
    const stAnno = r.stato_quota?.anno || 0;
    const stAcc = r.stato_quota?.acconto || 0;
    const parti = (k, valore, stato, detr) => {
      if (r.voce === 'gruppo_d') { somma(k, r.comune, 3925, 'stato', stato, 0, r); somma(k, r.comune, 3930, 'comune', valore - stato, 0, r); }
      else somma(k, r.comune, r.codice, 'comune', valore, detr, r);
    };
    parti('unica', r.imposta, stAnno, r.detrazione);
    if (r.acconto !== null) {
      parti('acconto', r.acconto, stAcc, r.detrazioneAcconto);
      parti('saldo', r.saldo, stAnno - stAcc, r.detrazione - r.detrazioneAcconto);
    }
  }
  const accontoArr = {};
  for (const x of Object.values(mappa)) {
    const riga = {
      sezione: 'IMU e altri tributi locali', codice_ente: x.comune, codice_tributo: String(x.codice), descrizione: CODICI[x.codice],
      anno_riferimento: anno, acconto: x.rata !== 'saldo', saldo: x.rata !== 'acconto', immobili_variati: x.variati, ravvedimento: false,
      numero_immobili: x.immobili.size, detrazione: x.codice === 3912 ? cent(x.detrazione) : 0, importo_esatto: cent(x.importo),
      importo: arrotonda(x.importo),
    };
    if (x.rata === 'acconto') accontoArr[`${x.comune}|${x.codice}`] = riga.importo;
    f24[x.rata].push(riga);
  }
  // il saldo di ogni riga è il dovuto dell'anno meno l'acconto versato (arrotondato)
  for (const riga of f24.saldo) {
    const annua = mappa[`unica|${riga.codice_ente}|${riga.codice_tributo}`];
    riga.importo = arrotonda(annua.importo) - (accontoArr[`${riga.codice_ente}|${riga.codice_tributo}`] || 0);
  }
  for (const k of ['acconto', 'saldo', 'unica']) {
    f24[k] = f24[k].filter((x) => x.importo > 0).sort((a, b) => a.codice_ente.localeCompare(b.codice_ente) || a.codice_tributo.localeCompare(b.codice_tributo));
  }
  const tot = (l) => l.reduce((s, x) => s + x.importo, 0);

  // --- scadenze (comma 762), con lo slittamento se cadono di sabato o festivo ---
  const sc = (d) => scadenza(d, 0, { slitta: true, sabato: true });
  const scadenze = [];
  const giugno = sc(`${anno}-06-16`);
  const dicembre = sc(`${anno}-12-16`);
  if (calcolate.length) {
    scadenze.push({ data: iso(giugno), titolo: `IMU ${anno}: acconto`, testo: divisibile ? `Acconto IMU ${anno}: ${fmtEur(tot(f24.acconto))} con F24 (codici ${[...new Set(f24.acconto.map((x) => x.codice_tributo))].join(', ')}). Si può anche pagare tutto (${fmtEur(tot(f24.unica))}) entro questa data.` : `Acconto IMU ${anno}.`, scaduta: giugno < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, giugno)) });
    scadenze.push({ data: iso(dicembre), titolo: `IMU ${anno}: saldo`, testo: divisibile ? `Saldo IMU ${anno}: ${fmtEur(tot(f24.saldo))} con F24.` : `Saldo IMU ${anno}.`, scaduta: dicembre < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, dicembre)) });
    fontiUsate.add('f24').add('scadenzeFestive');
  }

  // avvisi generali
  if (righe.some((r) => r.variato)) { avvisi.push('Quando acquisti, vendi o cambi l\'uso di un immobile, controlla se devi presentare la dichiarazione IMU: si presenta entro il 30 giugno dell\'anno dopo.'); fontiUsate.add('dichiarazione'); }
  if (righe.some((r) => r.tipo === 'terreno' && r.stato === 'calcolato')) avvisi.push('I terreni nelle zone montane o collinari indicate dalla circolare 9/1993, nelle isole minori o posseduti da coltivatori diretti e IAP sono esenti: se il Comune è «parzialmente delimitato», controlla il foglio di mappa.');
  if (anno > Math.max(...anniDisponibili)) avvisi.push(`Le aliquote ${anno} non sono ancora pubblicate (il termine è il 28 ottobre ${anno}): il saldo è calcolato con quelle del ${anno - 1}, che restano valide se il Comune non le cambia.`);
  if (calcolate.length) avvisi.push('Il regolamento del Comune può fissare un importo minimo sotto il quale non si paga: controllalo se l\'importo è piccolo.');

  for (const r of righe) for (const s of r.servono) servono.push({ immobile: r.i, nome: r.nome, ...s });

  return {
    anno, completo, divisibile,
    righe, totale, acconto: divisibile ? tot(f24.acconto) : null, saldo: divisibile ? tot(f24.saldo) : null, unica: tot(f24.unica),
    totaleEsatto: totale, f24, scadenze, avvisi, servono,
    fonti: [...fontiUsate].filter(Boolean).map(norma).filter(Boolean),
    verificato: VERIFICATO,
  };
}

// ---------------- testo semplice (per il server MCP) ----------------

export const fmtEur = (n) => (n === null || n === undefined ? '' : `${Number(n).toLocaleString('it-IT', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2, useGrouping: 'always' })} €`);
export const fmtPerc = (n) => `${Number(n).toLocaleString('it-IT', { maximumFractionDigits: 4 })}%`;
const giornoLungo = (s) => data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const ORIGINE = {
  prospetto: (r) => `prospetto ${r.prospetto.anno} del Comune`,
  anno_prima: (r) => `prospetto ${r.prospetto.anno} del Comune, che vale ancora perché non ne risulta uno nuovo pubblicato entro il 28 ottobre`,
  base_legge: () => 'aliquota di base di legge: non risulta un prospetto del Comune',
  differenziata: (r) => `aliquota differenziata del prospetto ${r.prospetto.anno}`,
  tua: () => 'aliquota indicata da te',
};

/** L'esito in testo semplice. */
export function testo(esito) {
  const e = esito;
  const out = [`IMU ${e.anno}: ${e.completo ? '' : 'calcolo incompleto. '}imposta dell'anno ${fmtEur(e.unica)}${e.divisibile ? ` (acconto ${fmtEur(e.acconto)} entro il 16 giugno, saldo ${fmtEur(e.saldo)} entro il 16 dicembre)` : ''}.`];
  for (const r of e.righe) {
    const dove = r.comuneNome ? ` a ${r.comuneNome}` : '';
    if (r.stato === 'esente' || r.stato === 'non_imu') { out.push(`- ${r.nome}${dove}: ${r.esente}`); continue; }
    if (r.stato === 'dato') { out.push(`- ${r.nome}${dove}: servono dati. ${r.servono.map((s) => s.testo).join(' ')}`); continue; }
    out.push(`- ${r.nome}${dove}: base ${fmtEur(r.baseImponibile)} (${r.calcoloBase})${r.riduzioni?.length ? ', ridotta del 50%' : ''}; aliquota ${fmtPerc(r.aliquota)} (${(ORIGINE[r.origineAliquota] || (() => r.origineAliquota))(r)}); quota ${r.quota}%, ${r.mesi} mesi${r.uso === 'concordato' ? ', canone concordato al 75%' : ''}${r.uso === 'pensionato_estero' ? ', ridotta alla metà' : ''}${r.detrazione ? `, detrazione ${fmtEur(r.detrazione)}` : ''}: ${fmtEur(r.imposta)}.${r.note.length ? ' ' + r.note.join(' ') : ''}`);
  }
  for (const k of e.divisibile ? ['acconto', 'saldo'] : ['unica']) {
    if (!e.f24[k].length) continue;
    out.push(`F24 ${k === 'unica' ? 'in un\'unica soluzione' : k} (sezione IMU e altri tributi locali, anno ${e.anno}):`);
    for (const x of e.f24[k]) out.push(`  codice ente ${x.codice_ente}, tributo ${x.codice_tributo} (${x.descrizione}), immobili ${x.numero_immobili}${x.immobili_variati ? ', immobili variati' : ''}${x.detrazione ? `, detrazione ${fmtEur(x.detrazione)}` : ''}: ${x.importo} €`);
  }
  for (const s of e.scadenze) out.push(`Scadenza ${giornoLungo(s.data)}: ${s.titolo}${s.scaduta ? ' (passata)' : ''}.`);
  for (const a of e.avvisi) out.push(`Nota: ${a}`);
  if (e.servono.length) out.push(`Dati che mancano: ${e.servono.map((s) => `${s.nome} (${s.campo})`).join(', ')}.`);
  out.push(`Regole verificate il ${giornoLungo(e.verificato)}: ${e.fonti.map((f) => f.titolo).join('; ')}.`);
  return out.join('\n');
}
