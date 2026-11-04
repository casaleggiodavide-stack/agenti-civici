// Il carrello del Black Friday: le regole del gioco, senza disegno, così si possono provare.

export const SECONDI = [45, 40, 35]; // per negozio: ogni negozio ha meno tempo del precedente
export const secondiPer = (k) => SECONDI[Math.min(k, SECONDI.length - 1)];

export const trappole = (negozio) => negozio.elementi.filter((e) => e.trappola);

export function nuovoNegozio(negozio) {
  return { caselle: Object.fromEntries(negozio.elementi.filter((e) => e.tipo === 'casella').map((e) => [e.id, !!e.spuntata])), trovati: [], falsi: [], scelta: null };
}

/** Cosa succede toccando un elemento. Restituisce il nuovo stato e cosa è successo. */
export function tocca(s, e, come) {
  const t = { ...s, caselle: { ...s.caselle }, trovati: [...s.trovati], falsi: [...s.falsi] };
  if (e.tipo === 'casella') { t.caselle[e.id] = !t.caselle[e.id]; return [t, t.caselle[e.id] ? 'aggiunta' : 'tolta']; }
  if (e.tipo === 'scelta') { t.scelta = come; return [t, come === 'piccolo' ? 'evitata' : 'caduto']; }
  if (e.trappola) { if (!t.trovati.includes(e.id)) t.trovati.push(e.id); return [t, 'scoperta']; }
  if (!t.falsi.includes(e.id)) t.falsi.push(e.id);
  return [t, 'falso'];
}

/** Il conto: quanto paghi, e quanto di questo è finito in trappole. */
export function conto(negozio, s) {
  let totale = negozio.prezzo, inPiu = 0, abbonamento = 0;
  for (const e of negozio.elementi) {
    if (e.tipo === 'casella' && s.caselle[e.id]) { totale += e.euro; if (e.trappola) inPiu += e.euro; }
    if (e.tipo === 'costo') { totale += e.euro; inPiu += e.euro; }
    if (e.tipo === 'scelta' && s.scelta === 'grande') abbonamento += e.euro;
  }
  const r = (x) => Math.round(x * 100) / 100;
  return { totale: r(totale), inPiu: r(inPiu), abbonamento: r(abbonamento) };
}

/** Quanto hai pagato per trappole che potevi evitare (caselle già spuntate lasciate lì); i costi della cassa si pagano comunque. */
export function evitabile(negozio, s) {
  return Math.round(negozio.elementi.filter((e) => e.tipo === 'casella' && e.trappola && s.caselle[e.id]).reduce((t, e) => t + e.euro, 0) * 100) / 100;
}

/** Per ogni trappola: «evitata» (tolta o rifiutata), «scoperta» (vista), «caduto» (pagata senza accorgersene), «sfuggita». */
export function esiti(negozio, s) {
  return trappole(negozio).map((e) => {
    let esito;
    if (e.tipo === 'casella') esito = s.caselle[e.id] ? 'caduto' : 'evitata';
    else if (e.tipo === 'scelta') esito = s.scelta === 'piccolo' ? 'evitata' : s.scelta === 'grande' ? 'caduto' : 'sfuggita';
    else esito = s.trovati.includes(e.id) ? 'scoperta' : e.tipo === 'costo' ? 'caduto' : 'sfuggita';
    return { e, esito };
  });
}

const buone = (negozio, s) => esiti(negozio, s).filter((x) => x.esito === 'evitata' || x.esito === 'scoperta').length;

/** Negozio perfetto: tutte le trappole viste o evitate, nessun falso allarme. */
export const perfetto = (negozio, s) => buone(negozio, s) === trappole(negozio).length && !s.falsi.length;
export const PREMIO_PERFETTO = 20;

/** Le stelle del negozio: 3 se perfetto, 2 se almeno due trappole su tre, 1 se almeno una su tre. */
export function stelle(negozio, s) {
  if (perfetto(negozio, s)) return 3;
  const b = buone(negozio, s), tot = trappole(negozio).length;
  return b * 3 >= tot * 2 ? 2 : b * 3 >= tot ? 1 : 0;
}

export function punti(negozio, s, secondiRimasti) {
  const lista = esiti(negozio, s);
  const b = buone(negozio, s);
  const bonus = b * 2 >= lista.length ? Math.round(Math.max(0, secondiRimasti) / 2) : 0; // la fretta premia solo chi guarda
  return Math.max(0, b * 10 - s.falsi.length * 5 + bonus + (perfetto(negozio, s) ? PREMIO_PERFETTO : 0));
}

/** La pagina del negozio con le etichette e le caselle in un ordine ripetibile (stessa partita per chi sfidi). */
export function disponi(negozio, caso = Math.random) {
  const mescola = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(caso() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const tipi = ['info', 'casella', 'scelta', 'costo'];
  return { ...negozio, elementi: tipi.flatMap((t) => mescola(negozio.elementi.filter((e) => e.tipo === t))) };
}

export const MEDAGLIE = {
  prima: { icona: '🌱', nome: 'Primo giro', come: 'Finisci una partita' },
  perfetto: { icona: '⭐', nome: 'Negozio perfetto', come: 'Tre stelle in un negozio' },
  lampo: { icona: '⚡', nome: 'Occhio lampo', come: 'Un negozio perfetto con metà del tempo ancora da usare' },
  'zero-euro': { icona: '💶', nome: 'Neanche un euro', come: 'Tre negozi senza un euro per le caselle già spuntate né abbonamenti' },
  'niente-falsi': { icona: '🎯', nome: 'Mira precisa', come: 'Nessun falso allarme in tutta la partita' },
  'tre-stelle': { icona: '🏆', nome: 'Ispettore dell\'Antitrust', come: 'Tre stelle in tutti e tre i negozi' },
};

/** negozi: [{ stelle, inPiu (evitabile), abbonamento, falsi, restaFrazione }] */
export function medaglieGuadagnate(negozi) {
  const m = ['prima'];
  if (negozi.some((n) => n.stelle === 3)) m.push('perfetto');
  if (negozi.some((n) => n.stelle === 3 && n.restaFrazione >= 0.5)) m.push('lampo');
  if (negozi.length >= 3 && negozi.every((n) => n.inPiu === 0 && n.abbonamento === 0)) m.push('zero-euro');
  if (negozi.length >= 3 && negozi.every((n) => n.falsi === 0)) m.push('niente-falsi');
  if (negozi.length >= 3 && negozi.every((n) => n.stelle === 3)) m.push('tre-stelle');
  return m;
}

export const TITOLI = [[0, 'Cliente distratto'], [60, 'Cliente attento'], [130, 'Occhio al carrello'], [190, 'Difensore dei consumatori'], [240, 'Ispettore dell\'Antitrust']];

export function testoCondivisione(viste, totali, inPiu) {
  const euro = inPiu.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Al Black Friday del Polpo civico ho scoperto ${viste} trappole su ${totali}${inPiu > 0 ? ` e ho pagato ${euro} € in più` : ' senza pagare un euro in più'}. Tu ci cadresti?`;
}
