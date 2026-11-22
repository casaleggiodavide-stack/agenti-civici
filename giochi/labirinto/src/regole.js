// Il filo del labirinto: le regole del gioco, senza disegno, così si possono provare.
// Hai una pratica da chiudere: a ogni bivio scegli la strada. La giusta avanza e srotola il filo;
// la sbagliata è un vicolo cieco che costa giorni, e si torna al bivio. Si esce con meno giorni persi
// possibile. I bivi vengono dalle regole degli strumenti del sito (src/percorsi.js, con fonte e link).
import PERCORSI from './percorsi.js';
import { caso, giornoPrima } from '../../comune/premi.js';
import { pianta } from './labirinto.js';

export { PERCORSI };
export const PER_ID = Object.fromEntries(PERCORSI.map((p) => [p.id, p]));

export const STRUMENTI = {
  segnalazioni: 'Segnalazioni urbane', garanzia: 'Si è rotto o ci ho ripensato', navigatore: 'Navigatore dei servizi', 'mi-spetta': 'Mi spetta',
  'faccio-ricorso': 'Faccio ricorso?', 'mi-rimborsano': 'Mi rimborsano?', disdette: 'Disdici un abbonamento', 'chiedo-gli-atti': 'Chiedo gli atti',
  'liste-attesa': 'La visita nei tempi', 'reclami-pa': 'Reclami alla PA', affitto: 'Affitto: i tuoi diritti', condominio: 'Condominio: i tuoi diritti',
};
export const LIVELLI = { 1: 'Primi passi', 2: 'Più bivi', 3: 'Termini che cambiano' };
export const TIPI = { ufficio: 'A chi rivolgersi', termine: 'Il termine', lettera: 'Come scrivere', documento: 'Cosa portare', diritto: 'Cosa ti spetta' };

export const BASE = 100;          // ogni bivio superato
export const BONUS_SERIE = 20;    // dal terzo bivio giusto al primo colpo di fila
export const SERIE_MIN = 3;
export const BONUS_PULITO = 150;  // uscito senza vicoli ciechi
export const PER_GIORNO = 3;      // ogni giorno perso nei vicoli costa 3 punti

/** Il percorso di una partita: il seme di una partita libera comincia con l'id («multa-x7k2p»); la sfida del giorno lo pesca dalla data. */
export function percorsoDaSeme(seme) {
  const m = /^([a-z]{1,10})(?:-|$)/.exec(String(seme || ''));
  if (m && PER_ID[m[1]]) return PER_ID[m[1]];
  const r = caso(`${seme}-labirinto`);
  return PERCORSI[Math.floor(r() * PERCORSI.length)];
}

export const semeLibero = (id, coda) => `${id}-${String(coda).replace(/[^a-z0-9]/g, '').slice(0, 8)}`;

/** Il prossimo percorso da giocare: il primo non ancora finito, nell'ordine di difficoltà. */
export function prossimo(finiti = []) {
  const f = new Set(finiti);
  return PERCORSI.find((p) => !f.has(p.id)) || null;
}

/** In che ordine compaiono le scelte di ogni bivio (gli indici restano quelli dei dati). */
export function ordineScelte(p, seme) {
  const r = caso(`${seme}-${p.id}-ordine`);
  return p.bivi.map((b) => {
    const a = b.scelte.map((_, i) => i);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  });
}

/** La pianta del labirinto di questa partita. */
export const labirintoDi = (p, seme) => pianta(p.bivi.map((b) => b.scelte.length), caso(`${seme}-${p.id}-pianta`));

export function nuovoStato(p) {
  return { percorso: p.id, bivio: 0, giorni: 0, vicoli: 0, tentate: [], serie: 0, migliore: 0, punti: 0, alPrimo: [], scelte: [] };
}

export const finito = (s, p) => s.bivio >= p.bivi.length;

/** Una scelta al bivio corrente (indice nei dati). Lancia un errore se la mossa è impossibile. */
export function scegli(s, p, i) {
  if (finito(s, p)) throw new Error('percorso già finito');
  const b = p.bivi[s.bivio];
  if (!Number.isInteger(i) || i < 0 || i >= b.scelte.length) throw new Error('scelta inesistente');
  if (s.tentate.includes(i)) throw new Error('strada già provata');
  const c = b.scelte[i], t = { ...s, scelte: [...s.scelte, i] };
  if (c.giusta) {
    const primo = s.tentate.length === 0;
    t.serie = primo ? s.serie + 1 : 0;
    t.punti = s.punti + BASE + (primo && t.serie >= SERIE_MIN ? BONUS_SERIE : 0);
    t.alPrimo = [...s.alPrimo, primo];
    t.bivio = s.bivio + 1;
    t.tentate = [];
    t.migliore = Math.max(s.migliore, t.serie);
  } else {
    t.giorni = s.giorni + c.giorni;
    t.vicoli = s.vicoli + 1;
    t.tentate = [...s.tentate, i];
    t.serie = 0;
  }
  return t;
}

/** I punti: i bivi superati, meno i giorni persi; uscire senza vicoli ciechi vale 150 in più. */
export const totale = (s, p) => Math.max(0, s.punti - PER_GIORNO * s.giorni) + (finito(s, p) && s.vicoli === 0 ? BONUS_PULITO : 0);

/**
 * Per la classifica: ricalcola i punti dalle mosse. partita = { percorso: 'multa', scelte: [2, 0, 1, …] }
 * (gli indici delle scelte nei dati, in ordine, vicoli compresi). seme: quello della partita.
 */
export function punteggio(partita, seme) {
  if (!partita || typeof partita !== 'object') throw new Error('partita mancante');
  const p = PER_ID[partita.percorso];
  if (!p) throw new Error('percorso sconosciuto');
  if (seme && percorsoDaSeme(seme).id !== p.id) throw new Error('il percorso non è quello del seme');
  const scelte = partita.scelte;
  const massimo = p.bivi.reduce((n, b) => n + b.scelte.length, 0);
  if (!Array.isArray(scelte) || !scelte.length || scelte.length > massimo) throw new Error('scelte non valide');
  let s = nuovoStato(p);
  for (const i of scelte) s = scegli(s, p, i);
  if (!finito(s, p)) throw new Error('percorso non finito');
  return totale(s, p);
}

// ---------------------------------------------------------------- premi

export const MEDAGLIE = {
  prima: { icona: '🧶', nome: 'Il primo filo', come: 'Esci dal tuo primo labirinto' },
  pulito: { icona: '✨', nome: 'Nessun vicolo cieco', come: 'Esci da un percorso senza sbagliare strada' },
  termini: { icona: '📅', nome: 'Contagiorni', come: 'Tutti i bivi sui termini giusti al primo colpo, in un percorso con almeno tre' },
  difficile: { icona: '🏛️', nome: 'Fuori dai termini', come: 'Esci senza vicoli ciechi da un percorso del livello 3' },
  giorno: { icona: '☀️', nome: 'Sfida del giorno', come: 'Esci dal labirinto della sfida del giorno' },
  meta: { icona: '🗺️', nome: 'Metà labirinto', come: 'Esci da 6 percorsi diversi' },
  tutti: { icona: '🐙', nome: 'Tutti i fili', come: `Esci da tutti i ${PERCORSI.length} percorsi` },
  fila: { icona: '🔥', nome: 'Sette giorni di fila', come: 'Gioca sette giorni di fila' },
};

/** I giorni di fila dopo questa partita, come li conta l'archivio di giochi/comune/premi.js. */
export function filaDopo(archivio, oggi) {
  if (archivio?.ultimo === oggi) return archivio.fila || 1;
  if (archivio?.ultimo === giornoPrima(oggi)) return (archivio.fila || 1) + 1;
  return 1;
}

/** finiti: gli id dei percorsi già finiti, compreso questo; fila: giorni di fila; delGiorno: era la sfida del giorno. */
export function medaglieGuadagnate(s, p, { finiti = [], fila = 1, delGiorno = false } = {}) {
  if (!finito(s, p)) return [];
  const m = ['prima'];
  const pulito = s.vicoli === 0;
  if (pulito) m.push('pulito');
  const termini = p.bivi.map((b, i) => [b.tipo, s.alPrimo[i]]).filter(([t]) => t === 'termine');
  if (termini.length >= 3 && termini.every(([, ok]) => ok)) m.push('termini');
  if (pulito && p.livello === 3) m.push('difficile');
  if (delGiorno) m.push('giorno');
  const n = new Set([...finiti, p.id].filter((id) => PER_ID[id])).size;
  if (n >= 6) m.push('meta');
  if (n >= PERCORSI.length) m.push('tutti');
  if (fila >= 7) m.push('fila');
  return m;
}

export const TITOLI = [[0, 'Perso tra le carte'], [300, 'Cerca la via'], [500, 'Sa dove bussare'], [700, 'Trova sempre l\'uscita'], [900, 'Il filo d\'Arianna']];

export function testoCondivisione(s, p) {
  return `Sono uscito dal labirinto «${p.titolo}» con ${s.giorni ? `${s.giorni} giorni persi` : 'zero giorni persi'}: ${totale(s, p)} punti con il Polpo civico. Trovi la strada più in fretta?`;
}
