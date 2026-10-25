// Navigatore dei servizi: trova la pratica giusta a partire dalle parole del cittadino.
// Nessun modello linguistico: si cercano le parole nei titoli e nei modi di dire raccolti per ogni pratica.

import { PRATICHE, CATEGORIE } from './pratiche.js';

const VUOTE = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'e', 'o', 'come', 'cosa', 'che', 'devo', 'fare', 'faccio', 'posso', 'si', 'mi', 'mio', 'mia', 'miei', 'mie', 'del', 'della', 'dei', 'delle', 'al', 'alla', 'ai', 'alle', 'nel', 'nella', 'quando', 'dove', 'serve', 'servono', 'voglio', 'vorrei', 'ho', 'non', 'chiedere', 'richiedere', 'ottenere', 'avere']);

export const normalizza = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// Parole di tutti i giorni → parole delle pratiche
const EQUIVALENTI = {
  morto: 'decesso', morta: 'decesso', morti: 'decesso', deceduto: 'decesso', deceduta: 'decesso', lutto: 'decesso', funerale: 'decesso', mancato: 'decesso', mancata: 'decesso', eredita: 'successione', erede: 'successione', eredi: 'successione',
  sposarmi: 'matrimonio', sposare: 'matrimonio', sposarci: 'matrimonio', sposo: 'matrimonio', nozze: 'matrimonio', convivente: 'unione',
  bambino: 'nascita', bambina: 'nascita', neonato: 'nascita', neonata: 'nascita', nato: 'nascita', nata: 'nascita', partorito: 'nascita',
  licenziato: 'naspi', licenziata: 'naspi', licenziamento: 'naspi', disoccupato: 'naspi', disoccupata: 'naspi', perso: 'perso',
  macchina: 'auto', automobile: 'auto', venduto: 'passaggio', venduta: 'passaggio', comprato: 'passaggio', comprata: 'passaggio',
  trasloco: 'residenza', trasferisco: 'residenza', trasferito: 'residenza', trasferita: 'residenza', traslocare: 'residenza',
  lasciare: 'separazione', lasciarci: 'separazione', lasciati: 'separazione', separati: 'separazione', separarmi: 'separazione', divorziare: 'divorzio',
  dottore: 'medico', pediatra: 'medico', ricetta: 'ticket',
  inquilino: 'affitto', affittare: 'affitto', affittato: 'affitto',
  scaduta: 'rinnovo', scade: 'rinnovo', scaduto: 'rinnovo',
  estero: 'estero', espatrio: 'espatrio',
  tasse: 'redditi', dichiarazione: 'dichiarazione',
};

// radice grossolana: «rinnovare», «rinnovo», «rinnova» → «rinnov»
const radice = (p) => (p.length > 5 ? p.replace(/(azione|azioni|amento|amenti|are|ere|ire|ato|ata|ati|ate|ito|ita|iti|ite|o|a|i|e)$/, '') : p);

function parole(t) {
  return normalizza(t).split(' ').filter((p) => p && !VUOTE.has(p)).flatMap((p) => (EQUIVALENTI[p] && EQUIVALENTI[p] !== p ? [p, EQUIVALENTI[p]] : [p])).map(radice);
}

const INDICE = PRATICHE.map((p) => {
  const titolo = parole(p.titolo);
  const sinonimi = (p.sinonimi || []).map(parole);
  const corpo = new Set(parole([p.titolo, ...(p.sinonimi || []), p.chi, p.dove, CATEGORIE[p.categoria]?.nome].join(' ')));
  return { p, titolo, sinonimi, corpo };
});

/** Le pratiche più vicine a una domanda, con un punteggio. */
export function cerca(domanda, limite = 6) {
  const q = parole(domanda);
  if (!q.length) return [];
  const frase = ` ${q.join(' ')} `;
  return INDICE.map(({ p, titolo, sinonimi, corpo }) => {
    let punti = 0;
    for (const w of q) {
      if (titolo.includes(w)) punti += 3;
      else if (corpo.has(w)) punti += 1.5;
      else if (w.length >= 4 && [...corpo].some((c) => c.startsWith(w) || w.startsWith(c))) punti += 0.75;
    }
    for (const s of sinonimi) if (s.length && frase.includes(` ${s.join(' ')} `)) punti += 4 + s.length;
    return { pratica: p, punti: punti / Math.sqrt(q.length) };
  }).filter((r) => r.punti >= 1.5).sort((a, b) => b.punti - a.punti).slice(0, limite);
}

export const perCategoria = () => Object.entries(CATEGORIE).map(([id, c]) => ({ id, ...c, pratiche: PRATICHE.filter((p) => p.categoria === id) })).filter((c) => c.pratiche.length);

export const trova = (id) => PRATICHE.find((p) => p.id === id);
