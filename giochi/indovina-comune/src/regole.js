// Indovina il Comune: le regole del gioco, senza disegno, così si possono provare (e la classifica può rifare i conti).
// Ogni giorno un Comune misterioso, uguale per tutti; sei tentativi; un indizio in più a ogni errore, dal più vago
// al più preciso, presi dai dati che il sito ha già (bilancio, appalti, PNRR, rifiuti). Dopo ogni tentativo il Polpo
// dice se il Comune scritto è nella stessa Regione o in una confinante, se ha più o meno abitanti, e da che parte
// e quanto lontano sta il Comune misterioso (baricentri dai confini ISTAT).
import DATI from './comuni.js';
import { cerca as cercaRaccolta, normalizza } from '../../../raccolta/src/regole.js';
import { caso } from '../../comune/premi.js';

export const TENTATIVI = 6;
export const INDIZI = 6;

/** Le cinque ripartizioni geografiche dell'ISTAT, Regione per Regione. */
export const RIPARTIZIONI = {
  'Nord-ovest': ['Piemonte', "Valle d'Aosta", 'Liguria', 'Lombardia'],
  'Nord-est': ['Trentino-Alto Adige', 'Veneto', 'Friuli-Venezia Giulia', 'Emilia-Romagna'],
  Centro: ['Toscana', 'Umbria', 'Marche', 'Lazio'],
  Sud: ['Abruzzo', 'Molise', 'Campania', 'Puglia', 'Basilicata', 'Calabria'],
  Isole: ['Sicilia', 'Sardegna'],
};
export const ripartizioneDi = (regione) => Object.keys(RIPARTIZIONI).find((r) => RIPARTIZIONI[r].includes(regione));

/** Le Regioni che si toccano via terra (scritte a mano; i test le confrontano con i confini ISTAT). Le isole non confinano con nessuno. */
export const CONFINANTI = {
  Piemonte: ["Valle d'Aosta", 'Lombardia', 'Liguria', 'Emilia-Romagna'],
  "Valle d'Aosta": ['Piemonte'],
  Lombardia: ['Piemonte', 'Trentino-Alto Adige', 'Veneto', 'Emilia-Romagna'],
  'Trentino-Alto Adige': ['Lombardia', 'Veneto'],
  Veneto: ['Lombardia', 'Trentino-Alto Adige', 'Friuli-Venezia Giulia', 'Emilia-Romagna'],
  'Friuli-Venezia Giulia': ['Veneto'],
  Liguria: ['Piemonte', 'Emilia-Romagna', 'Toscana'],
  'Emilia-Romagna': ['Piemonte', 'Lombardia', 'Veneto', 'Liguria', 'Toscana', 'Marche'],
  Toscana: ['Liguria', 'Emilia-Romagna', 'Marche', 'Umbria', 'Lazio'],
  Umbria: ['Toscana', 'Marche', 'Lazio'],
  Marche: ['Emilia-Romagna', 'Toscana', 'Umbria', 'Lazio', 'Abruzzo'],
  Lazio: ['Toscana', 'Umbria', 'Marche', 'Abruzzo', 'Molise', 'Campania'],
  Abruzzo: ['Marche', 'Lazio', 'Molise'],
  Molise: ['Abruzzo', 'Lazio', 'Campania', 'Puglia'],
  Campania: ['Lazio', 'Molise', 'Puglia', 'Basilicata'],
  Puglia: ['Molise', 'Campania', 'Basilicata'],
  Basilicata: ['Campania', 'Puglia', 'Calabria'],
  Calabria: ['Basilicata'],
  Sicilia: [],
  Sardegna: [],
};

/** Le fasce di abitanti del «Bilancio del mio Comune» (le stesse delle mediane). */
export const FASCE = [[0, 1000], [1000, 2000], [2000, 5000], [5000, 10000], [10000, 20000], [20000, 60000], [60000, 100000], [100000, 250000], [250000, Infinity]];
/** 12345 → «12.345» (sempre col punto, anche per le migliaia: come nelle tabelle del sito). */
export const migliaia = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const nomeFascia = (i) => {
  const [a, b] = FASCE[i];
  return a === 0 ? `meno di ${migliaia(b)} abitanti` : b === Infinity ? `oltre ${migliaia(a)} abitanti` : `da ${migliaia(a)} a ${migliaia(b)} abitanti`;
};
export const fasciaDi = (pop) => FASCE.findIndex(([a, b]) => pop >= a && pop < b);

/** Le difficoltà. Le prime tre sono quelle della sfida del giorno, le ultime tre quelle della partita libera. */
export const LIVELLI = {
  capoluoghi: { nome: 'Capoluoghi', spiega: 'i capoluoghi di provincia', per: 1, prova: (c) => c.capoluogo },
  grandi: { nome: 'Sopra i 30.000', spiega: 'i Comuni sopra i 30.000 abitanti che non sono capoluoghi', per: 1.3, prova: (c) => !c.capoluogo && c.pop >= 30000 },
  diecimila: { nome: 'Da 10.000 a 30.000', spiega: 'i Comuni da 10.000 a 30.000 abitanti che non sono capoluoghi', per: 1.6, prova: (c) => !c.capoluogo && c.pop >= 10000 && c.pop < 30000 },
  medi: { nome: 'Medi', spiega: 'tutti i Comuni da 10.000 abitanti in su, capoluoghi compresi', per: 1.3, prova: (c) => c.pop >= 10000 },
  tutti: { nome: 'Tutti', spiega: 'tutti i Comuni d\'Italia, anche i più piccoli', per: 2, prova: () => true },
};
export const LIBERI = ['capoluoghi', 'medi', 'tutti'];
const SIGLE_LIVELLO = { c: 'capoluoghi', m: 'medi', t: 'tutti' };

// ---------------------------------------------------------------- l'elenco dei Comuni

/** Prepara i dati: un oggetto per Comune, l'indice per la ricerca (compatibile con raccolta/src/regole.js). */
export function prepara(dati = DATI) {
  const regioni = dati.regioni;
  const comuni = dati.comuni.map(([istat, nome, sigla, pop, lat, lon, cap, d]) => {
    const [provincia, ri] = dati.province[sigla];
    const regione = regioni[ri];
    const c = { istat, nome, sigla, provincia, regione, ripartizione: ripartizioneDi(regione), pop, lat: lat / 100, lon: lon / 100, capoluogo: !!cap, n: normalizza(nome) };
    if (d) {
      const [spesa, rifiuti, debito, riscossione, senzaGara, pnrr, gi, piuGestori, anno] = d;
      c.dati = { spesa, rifiuti, debito, riscossione, senzaGara, pnrr, gestore: gi === null ? null : { nome: dati.gestori[gi][0], comuni: dati.gestori[gi][1] }, piuGestori: !!piuGestori, anno };
    }
    return c;
  });
  const perIstat = new Map(comuni.map((c) => [c.istat, c]));
  return { dati, comuni, perIstat, righe: comuni };
}

let _base = null;
const base = () => (_base ||= prepara());

/** I Comuni che corrispondono a quello che scrivi (la stessa ricerca di «Chi raccoglie i rifiuti?»). */
export const cerca = (testo, limite = 8, b = base()) => cercaRaccolta(b, testo, limite);

/** Il gruppo di Comuni da cui si pesca il misterioso: solo quelli con i dati per tutti gli indizi, in ordine di codice. */
const _gruppi = new Map();
export function gruppo(livello, b = base()) {
  if (!LIVELLI[livello]) throw new Error(`difficoltà sconosciuta: ${livello}`);
  const k = `${livello}`;
  if (b === _base && _gruppi.has(k)) return _gruppi.get(k);
  const g = b.comuni.filter((c) => c.dati && LIVELLI[livello].prova(c)).sort((x, y) => x.istat.localeCompare(y.istat));
  if (b === _base) _gruppi.set(k, g);
  return g;
}

function mescola(a, rnd) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// ---------------------------------------------------------------- il Comune del giorno

const GIORNO = /^(\d{4})-(\d{2})-(\d{2})$/;
const LUNEDI_ZERO = Date.UTC(2024, 0, 1) / 864e5; // lunedì 1° gennaio 2024

/** Il numero del giorno da lunedì 1° gennaio 2024 e il giorno della settimana (0 = lunedì). */
export function giornoNumero(data) {
  const m = GIORNO.exec(data);
  if (!m) throw new Error(`data non valida: ${data}`);
  const d = Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 - LUNEDI_ZERO;
  if (!Number.isInteger(d) || new Date((d + LUNEDI_ZERO) * 864e5).toISOString().slice(0, 10) !== data) throw new Error(`data non valida: ${data}`);
  return { d, settimana: Math.floor(d / 7), dow: ((d % 7) + 7) % 7 };
}

/** Lunedì e martedì i capoluoghi, da mercoledì a venerdì i Comuni sopra i 30.000, nel fine settimana quelli da 10.000 a 30.000. */
export function livelloDelGiorno(data) {
  const { dow } = giornoNumero(data);
  return dow <= 1 ? 'capoluoghi' : dow <= 4 ? 'grandi' : 'diecimila';
}

/**
 * Il Comune del giorno. Ogni difficoltà ha i suoi giorni della settimana e il suo elenco, rimescolato una volta
 * per tutte: il giorno k di quella difficoltà prende il k-esimo Comune dell'elenco, e si ricomincia solo quando
 * l'elenco è finito. Così lo stesso Comune torna dopo almeno «lunghezza dell'elenco» giorni della sua difficoltà
 * (119 capoluoghi su due giorni a settimana: più di un anno).
 */
export function comuneDelGiorno(data, b = base()) {
  const { settimana, dow } = giornoNumero(data);
  const livello = livelloDelGiorno(data);
  const turno = livello === 'capoluoghi' ? 2 * settimana + dow : livello === 'grandi' ? 3 * settimana + dow - 2 : 2 * settimana + dow - 5;
  const elenco = mescola(gruppo(livello, b), caso(`indovina-comune-${livello}`));
  return { comune: elenco[((turno % elenco.length) + elenco.length) % elenco.length], livello };
}

/** Da un seme alla partita: «AAAA-MM-GG» è il giorno, «c-…», «m-…», «t-…» una partita libera (capoluoghi, medi, tutti). */
export function leggiSeme(seme) {
  const s = String(seme || '');
  if (GIORNO.test(s)) { giornoNumero(s); return { giorno: s, livello: livelloDelGiorno(s) }; }
  const m = /^([cmt])-([\w]{1,20})$/.exec(s);
  if (!m) throw new Error(`seme non valido: ${s}`);
  return { giorno: null, livello: SIGLE_LIVELLO[m[1]] };
}

export const semeLibero = (livello, casuale) => `${Object.keys(SIGLE_LIVELLO).find((k) => SIGLE_LIVELLO[k] === livello)}-${casuale}`;

/** Il Comune misterioso di una partita. */
export function misterioso(seme, b = base()) {
  const { giorno, livello } = leggiSeme(seme);
  if (giorno) return comuneDelGiorno(giorno, b);
  const g = gruppo(livello, b);
  return { comune: g[Math.floor(caso(`indovina-comune-${seme}`)() * g.length)], livello };
}

// ---------------------------------------------------------------- gli indizi

const euro = (n) => `${migliaia(n)} €`;
const pc = (n) => `${n.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;
/** L'articolo davanti a una percentuale: «l'85%», «l'11%», «il 7,3%». */
export const ilPc = (n) => { const i = Math.floor(n); return `${i === 1 || i === 8 || i === 11 || (i >= 80 && i < 90) ? 'l\'' : 'il '}${pc(n)}`; };
/** «più di», «meno di» o «in linea con» la mediana (entro il 5%). */
export function confronto(v, mediana) {
  if (v === null || v === undefined || !mediana) return '';
  const r = v / mediana;
  return r > 1.05 ? 'sopra' : r < 0.95 ? 'sotto' : 'in linea';
}
const paragone = (v, m, fmt) => (v === null || v === undefined || !m ? '' : ` (${{ sopra: 'più della', sotto: 'meno della', 'in linea': 'in linea con la' }[confronto(v, m)]} mediana dei Comuni simili, ${fmt(m)})`);
const DEL = { 'Nord-ovest': 'del Nord-ovest', 'Nord-est': 'del Nord-est', Centro: 'del Centro', Sud: 'del Sud', Isole: 'delle Isole' };

/**
 * La fascia di abitanti da dire nel primo indizio: quella del Comune, allargata alle fasce vicine finché nella sua
 * ripartizione ci sono almeno tre Comuni del gruppo con la stessa fascia (così il primo indizio non basta mai da solo).
 */
const _conteggi = new WeakMap();
function conteggi(elenco) { // quanti Comuni del gruppo per ripartizione e fascia
  if (!_conteggi.has(elenco)) {
    const t = {};
    for (const x of elenco) { t[x.ripartizione] ||= FASCE.map(() => 0); t[x.ripartizione][fasciaDi(x.pop)] += 1; }
    _conteggi.set(elenco, t);
  }
  return _conteggi.get(elenco);
}

export function fasciaIndizio(c, elenco) {
  let a = fasciaDi(c.pop), z = a;
  const riga = conteggi(elenco)[c.ripartizione] || FASCE.map(() => 0);
  const conta = () => riga.slice(a, z + 1).reduce((x, y) => x + y, 0);
  let verso = -1;
  while (conta() < 3 && (a > 0 || z < FASCE.length - 1)) {
    if ((verso < 0 && a > 0) || z === FASCE.length - 1) a -= 1; else z += 1;
    verso = -verso;
  }
  const [da] = FASCE[a], [, fino] = FASCE[z];
  return { da, fino, testo: da === 0 ? `meno di ${migliaia(fino)} abitanti` : fino === Infinity ? `oltre ${migliaia(da)} abitanti` : `da ${migliaia(da)} a ${migliaia(fino)} abitanti` };
}

/** I sei indizi, dal più vago al più preciso: [{ titolo, testo, fonti: [chiave] }]. */
export function indizi(c, livello, b = base()) {
  const d = c.dati, m = b.dati.mediane[nomeFascia(fasciaDi(c.pop))] || {};
  const f = fasciaIndizio(c, gruppo(livello, b));
  const nd = 'dato non disponibile';
  const gest = !d.gestore ? 'il gestore della raccolta non è indicato'
    : d.gestore.nome.startsWith('il Comune stesso') ? 'i rifiuti li raccoglie il Comune stesso, in economia'
      : `il gestore della raccolta è «${d.gestore.nome}», ${d.gestore.comuni === 1 ? 'che lavora solo in questo Comune' : `che lavora in ${migliaia(d.gestore.comuni)} Comuni`}${d.piuGestori ? ' (insieme a un altro gestore)' : ''}`;
  return [
    { titolo: 'Dove e quanto è grande', testo: `È un Comune ${DEL[c.ripartizione]}, ${f.testo}.`, fonti: ['istat_elenco', 'istat_pop'] },
    { titolo: 'Quanto spende', testo: `Nel ${d.anno} ha speso ${euro(d.spesa)} per abitante${paragone(d.spesa, m.spesa, euro)}.`, fonti: ['bdap'] },
    { titolo: 'Debiti e incassi', testo: `Debito: ${d.debito === null ? nd : `${euro(d.debito)} per abitante${paragone(d.debito, m.debito, euro)}`}. ${d.riscossione === null ? 'Entrate proprie incassate: dato non disponibile' : `Delle entrate proprie dell'anno (tributi, tariffe, multe) ha incassato ${ilPc(d.riscossione)}${paragone(d.riscossione, m.riscossione, pc)}`}.`, fonti: ['bdap'] },
    { titolo: 'Appalti e PNRR', testo: `Appalti senza gara: ${d.senzaGara === null ? nd : `${ilPc(d.senzaGara)} del valore${paragone(d.senzaGara, m.senza_gara, pc)}`}. Progetti del PNRR sul suo territorio: ${migliaia(d.pnrr)}${paragone(d.pnrr, m.pnrr, migliaia)}.`, fonti: ['anac', 'pnrr'] },
    { titolo: 'Rifiuti', testo: `${d.rifiuti === null ? 'Spesa per i rifiuti: dato non disponibile' : (d.rifiuti < 20 ? `Per i rifiuti il bilancio del Comune segna appena ${euro(d.rifiuti)} per abitante (di solito succede quando la tariffa la incassa direttamente il gestore)` : `Per i rifiuti spende ${euro(d.rifiuti)} per abitante${paragone(d.rifiuti, m.rifiuti, euro)}`)}; ${gest}.`, fonti: ['bdap', 'arera'] },
    { titolo: 'La provincia', testo: `È in provincia di ${c.provincia} (${c.sigla}), in ${c.regione}.`, fonti: ['istat_elenco'] },
  ];
}

// ---------------------------------------------------------------- il confronto dopo ogni tentativo

const rad = (x) => (x * Math.PI) / 180;
/** Distanza in km (sfera) e direzione in gradi (0 = nord, 90 = est) da a verso b. */
export function rotta(a, b) {
  const f1 = rad(a.lat), f2 = rad(b.lat), dl = rad(b.lon - a.lon);
  const h = Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  const y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return { km, gradi: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 };
}
export const DIREZIONI = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'];
export const FRECCE = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
export const direzione = (gradi) => Math.round(gradi / 45) % 8;
export const VICINANZA = [[20, 'a un passo', 'meno di 20 km'], [60, 'vicino', 'meno di 60 km'], [150, 'a media distanza', 'da 60 a 150 km'], [400, 'lontano', 'da 150 a 400 km'], [Infinity, 'molto lontano', 'più di 400 km']];
export const vicinanza = (km) => VICINANZA.findIndex(([max]) => km < max);

/** Cosa dice il Polpo del Comune scritto rispetto al misterioso. */
export function confronta(t, m) {
  if (t.istat === m.istat) return { giusto: true, regione: 'stessa', abitanti: 'uguale', km: 0, gradi: null, dir: null, vicino: 0 };
  const regione = t.regione === m.regione ? 'stessa' : CONFINANTI[t.regione].includes(m.regione) ? 'confinante' : 'altra';
  const { km, gradi } = rotta(t, m);
  return { giusto: false, regione, abitanti: m.pop > t.pop ? 'più' : 'meno', km, gradi, dir: direzione(gradi), vicino: vicinanza(km) };
}

export const QUADRATI = { giusto: '🟩', stessa: '🟨', confinante: '🟧', altra: '⬜' };
export const quadrato = (esito) => (esito.giusto ? QUADRATI.giusto : QUADRATI[esito.regione]);

// ---------------------------------------------------------------- la partita

/** Lo stato di una partita sul Comune misterioso m. */
export function nuovoStato(m) {
  return { mistero: m.istat, tentativi: [], esiti: [], chiesti: 0, indizi: 1, vinto: false, finita: false };
}

/**
 * Applica una mossa: un codice ISTAT (un tentativo) o «i» (chiedi un indizio in più, senza consumare un tentativo).
 * Lancia un errore se la mossa è impossibile: partita finita, Comune sconosciuto o già provato, indizi finiti.
 */
export function mossa(s, x, b = base()) {
  if (s.finita) throw new Error('partita già finita');
  if (x === 'i') {
    if (s.indizi >= INDIZI) throw new Error('indizi finiti');
    return { ...s, indizi: s.indizi + 1, chiesti: s.chiesti + 1 };
  }
  const t = b.perIstat.get(x);
  if (!t) throw new Error(`Comune sconosciuto: ${x}`);
  if (s.tentativi.includes(x)) throw new Error(`Comune già provato: ${x}`);
  const esito = confronta(t, b.perIstat.get(s.mistero));
  const tentativi = [...s.tentativi, x], esiti = [...s.esiti, esito];
  const vinto = esito.giusto, finita = vinto || tentativi.length >= TENTATIVI;
  return { ...s, tentativi, esiti, vinto, finita, indizi: vinto || finita ? s.indizi : Math.min(INDIZI, s.indizi + 1) };
}

/** I punti: 40, più 20 per ogni tentativo risparmiato, più 10 per ogni indizio rimasto coperto, per la difficoltà. Chi non indovina fa 0. */
export function punti(s, livello) {
  if (!s.vinto) return 0;
  return Math.round(LIVELLI[livello].per * (40 + 20 * (TENTATIVI - s.tentativi.length) + 10 * (INDIZI - s.indizi)));
}

/**
 * Ricalcola i punti di una partita (per la classifica condivisa).
 * partita = { tentativi: ['058091', 'i', '015146', ...], livello: 'capoluoghi' | 'medi' | 'tutti' (solo nella partita libera) }
 * seme = 'AAAA-MM-GG' (sfida del giorno) oppure 'c-…', 'm-…', 't-…' (partita libera: la lettera è la difficoltà).
 */
export function punteggio(partita, seme) {
  const { giorno, livello } = leggiSeme(seme);
  if (!partita || !Array.isArray(partita.tentativi)) throw new Error('mosse mancanti');
  if (!giorno && partita.livello !== livello) throw new Error('difficoltà diversa dal seme');
  if (giorno && partita.livello !== undefined && partita.livello !== livello) throw new Error('difficoltà diversa dal giorno');
  if (partita.tentativi.length < 1 || partita.tentativi.length > TENTATIVI + INDIZI - 1) throw new Error('numero di mosse impossibile');
  const { comune } = misterioso(seme);
  let s = nuovoStato(comune);
  for (const x of partita.tentativi) {
    if (typeof x !== 'string' || !/^(\d{6}|i)$/.test(x)) throw new Error('mossa non valida');
    s = mossa(s, x);
  }
  if (!s.finita) throw new Error('partita non finita');
  return punti(s, livello);
}

// ---------------------------------------------------------------- premi

export const TITOLI = [[0, 'Turista per caso'], [60, 'Viaggiatore attento'], [120, 'Conoscitore dei Comuni'], [170, 'Geografo civico'], [250, 'Atlante vivente']];

export const MEDAGLIE = {
  prima: { icona: '🗺️', nome: 'Primo Comune', come: 'Indovina il tuo primo Comune' },
  colpo: { icona: '🎯', nome: 'Al primo colpo', come: 'Indovina con il primo tentativo' },
  cassetto: { icona: '🧠', nome: 'Indizi nel cassetto', come: 'Indovina lasciando almeno tre indizi coperti' },
  respiro: { icona: '😅', nome: 'All\'ultimo respiro', come: 'Indovina al sesto tentativo' },
  borgo: { icona: '🏘️', nome: 'Borgo scovato', come: 'Indovina un Comune sotto i 5.000 abitanti' },
  tre: { icona: '🔥', nome: 'Tre giorni giusti', come: 'Indovina la sfida del giorno tre giorni di fila' },
  sette: { icona: '📅', nome: 'Sette giorni di fila', come: 'Indovina la sfida del giorno sette giorni di fila' },
  cinque: { icona: '🧭', nome: 'Cinque Regioni', come: 'Indovina Comuni in cinque Regioni diverse' },
  regioni: { icona: '🏆', nome: 'Tutte le Regioni', come: 'Indovina almeno un Comune in ognuna delle 20 Regioni' },
};

/** Le medaglie della partita: extra = { filaGiusti, regioni: [nomi delle Regioni indovinate finora, questa compresa] }. */
export function medaglieGuadagnate(s, m, { filaGiusti = 0, regioni = [] } = {}) {
  if (!s.vinto) return [];
  const out = ['prima'];
  if (s.tentativi.length === 1) out.push('colpo');
  if (INDIZI - s.indizi >= 3) out.push('cassetto');
  if (s.tentativi.length === TENTATIVI) out.push('respiro');
  if (m.pop < 5000) out.push('borgo');
  if (filaGiusti >= 3) out.push('tre');
  if (filaGiusti >= 7) out.push('sette');
  if (new Set(regioni).size >= 5) out.push('cinque');
  if (Object.keys(CONFINANTI).every((r) => regioni.includes(r))) out.push('regioni');
  return out;
}

/** Il giorno prima di AAAA-MM-GG. */
const giornoPrima = (g) => { const d = new Date(`${g}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };

/**
 * Aggiorna la memoria del gioco dopo una partita: giorni giusti di fila (solo la sfida del giorno), Regioni indovinate,
 * la sfida del giorno già giocata (una sola volta al giorno: chi la rigioca conosce già la risposta).
 */
export function aggiornaMemoria(x, { oggi, delGiorno, vinto, regione, partita }) {
  const y = { ...x };
  if (delGiorno) {
    y.giocato = { data: oggi, partita };
    if (vinto) {
      y.filaGiusti = x.ultimoGiusto === oggi ? x.filaGiusti || 1 : x.ultimoGiusto === giornoPrima(oggi) ? (x.filaGiusti || 0) + 1 : 1;
      y.ultimoGiusto = oggi;
      y.filaMigliore = Math.max(x.filaMigliore || 0, y.filaGiusti);
    } else if (x.ultimoGiusto !== oggi) y.filaGiusti = 0;
  }
  if (vinto && regione) y.regioni = [...new Set([...(x.regioni || []), regione])];
  return y;
}

/** La serie in corso: vale se l'ultimo giorno giusto è oggi o ieri. */
export const filaInCorso = (x, oggi) => (x.ultimoGiusto === oggi || x.ultimoGiusto === giornoPrima(oggi) ? x.filaGiusti || 0 : 0);

/** Il testo da condividere: i tentativi come quadratini, senza svelare il Comune. */
export function testoCondivisione(s, { giorno, livello }) {
  const data = giorno ? giorno.split('-').reverse().join('/') : null;
  const riga = s.tentativi.length ? s.esiti.map(quadrato).join('') : '';
  return `Indovina il Comune · ${data ? `sfida del ${data}` : `partita libera, ${LIVELLI[livello].nome.toLowerCase()}`} · ${s.vinto ? `${s.tentativi.length}/${TENTATIVI}` : `X/${TENTATIVI}`}${s.chiesti ? ` · 💡${s.chiesti}` : ''}\n${riga}`;
}
