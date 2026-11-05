// La classifica non si fida dei punti che arrivano: rigioca la partita con le regole dei giochi
// (le stesse del browser) e calcola i punti da sé. Il browser manda solo le mosse:
//   differenzia  lanci: [[idRifiuto, idContenitore | '' se è caduto a terra, 1 se era d'oro], ...]
//   truffa       risposte: [['t' truffa | 'a' affidabile | '-' tempo scaduto, tempo rimasto 0-1], ...]
//   carrello     negozi: [{ trovati: [id], falsi: [id], caselle: { id: true/false }, scelta: 'grande'|'piccolo'|null, resta: secondi }, ...]
import * as D from '../../giochi/differenzia/src/regole.js';
import RIFIUTI from '../../giochi/differenzia/src/rifiuti.js';
import * as T from '../../giochi/truffa/src/regole.js';
import { MESSAGGI } from '../../giochi/truffa/src/messaggi.js';
import * as C from '../../giochi/carrello/src/regole.js';
import { NEGOZI } from '../../giochi/carrello/src/negozi.js';
import { caso } from '../../giochi/comune/premi.js';

export const GIOCHI = ['differenzia', 'truffa', 'carrello'];

class Rifiutata extends Error {}
const no = (perche) => { throw new Rifiutata(perche); };
export const eRifiutata = (e) => e instanceof Rifiutata;

const PER_ID = Object.fromEntries(RIFIUTI.rifiuti.map((r) => [r.id, r]));
const CONTENITORI = new Set(D.CONTENITORI.map((c) => c.id));

function differenzia({ lanci }) {
  if (!Array.isArray(lanci) || !lanci.length) no('nessun lancio');
  if (lanci.length > 140) no('troppi lanci per 90 secondi');
  let s = D.nuovoStato(), ori = 0;
  lanci.forEach(([id, contenitore, oro], i) => {
    const r = PER_ID[id];
    if (!r) no(`rifiuto sconosciuto: ${id}`);
    if (s.vite <= 0) no('partita già finita');
    if (contenitore === '') { s = D.perso(s); return; }
    if (!CONTENITORI.has(contenitore)) no(`contenitore sconosciuto: ${contenitore}`);
    if (oro === 1) ori += 1;
    if (ori > 2 + Math.floor((i + 1) / 6)) no('troppi rifiuti d\'oro');
    s = D.segna(s, D.valuta(r, contenitore), { oro: oro === 1, difficile: D.difficolta(r) === 3 });
  });
  return s.punti;
}

function truffa({ risposte }, seme) {
  const partita = T.scegliPartita(MESSAGGI, caso(`${seme}-truffa`));
  if (!Array.isArray(risposte) || !risposte.length || risposte.length > partita.length) no('risposte non valide');
  let s = T.nuovoStato();
  risposte.forEach(([r, rimasto], i) => {
    if (T.finita(s, partita.length)) no('partita già finita');
    const m = partita[i];
    if (r === '-') { s = { ...s, indice: s.indice + 1, serie: 0 }; return; }
    if (r !== 't' && r !== 'a') no('risposta non valida');
    if (typeof rimasto !== 'number' || !(rimasto >= 0 && rimasto <= 1)) no('tempo non valido');
    const risposta = r === 't' ? 'truffa' : 'affidabile';
    s = T.segna(s, T.giusto(m, risposta), rimasto, { livello: m.livello, cascato: m.truffa && risposta === 'affidabile' });
  });
  if (!T.finita(s, partita.length)) no('partita non finita');
  return s.punti;
}

function carrello({ negozi }) {
  if (!Array.isArray(negozi) || negozi.length !== NEGOZI.length) no('servono tutti e tre i negozi');
  return negozi.reduce((tot, x, k) => {
    const n = NEGOZI[k], ids = new Set(n.elementi.map((e) => e.id));
    const tipo = (id) => n.elementi.find((e) => e.id === id);
    const lista = (a) => (Array.isArray(a) ? [...new Set(a)] : no('elenco non valido'));
    const trovati = lista(x.trovati), falsi = lista(x.falsi);
    if (trovati.some((id) => !ids.has(id) || !tipo(id).trappola || !['info', 'costo'].includes(tipo(id).tipo))) no('trappola sconosciuta');
    if (falsi.some((id) => !ids.has(id) || tipo(id).trappola || tipo(id).tipo !== 'info')) no('falso allarme non valido');
    const s = C.nuovoNegozio(n);
    for (const [id, v] of Object.entries(x.caselle || {})) {
      if (!(id in s.caselle) || typeof v !== 'boolean') no('casella sconosciuta');
      s.caselle[id] = v;
    }
    if (![null, 'grande', 'piccolo'].includes(x.scelta ?? null)) no('scelta non valida');
    s.scelta = x.scelta ?? null; s.trovati = trovati; s.falsi = falsi;
    const resta = Number(x.resta);
    if (!(resta >= 0 && resta <= C.secondiPer(k) * 1.5)) no('tempo non valido');
    return tot + C.punti(n, s, Math.min(resta, C.secondiPer(k)));
  }, 0);
}

/** I punti veri della partita, o un errore Rifiutata. */
export function punteggio(gioco, partita, seme) {
  if (!partita || typeof partita !== 'object') no('partita mancante');
  if (gioco === 'differenzia') return differenzia(partita);
  if (gioco === 'truffa') return truffa(partita, seme);
  if (gioco === 'carrello') return carrello(partita);
  return no('gioco sconosciuto');
}
