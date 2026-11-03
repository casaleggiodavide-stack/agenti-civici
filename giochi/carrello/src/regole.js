// Il carrello del Black Friday: le regole del gioco, senza disegno, così si possono provare.

export const SECONDI = 40; // per negozio

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

export function punti(negozio, s, secondiRimasti) {
  const lista = esiti(negozio, s);
  const buone = lista.filter((x) => x.esito === 'evitata' || x.esito === 'scoperta').length;
  const bonus = buone * 2 >= lista.length ? Math.round(Math.max(0, secondiRimasti) / 2) : 0; // la fretta premia solo chi guarda
  return Math.max(0, buone * 10 - s.falsi.length * 5 + bonus);
}

export function testoCondivisione(viste, totali, inPiu) {
  const euro = inPiu.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Al Black Friday del Polpo civico ho scoperto ${viste} trappole su ${totali}${inPiu > 0 ? ` e ho pagato ${euro} € in più` : ' senza pagare un euro in più'}. Tu ci cadresti?`;
}
