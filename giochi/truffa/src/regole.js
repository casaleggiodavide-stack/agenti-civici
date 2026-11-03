// Truffa o no?: le regole del gioco, senza disegno, così si possono provare.

export const PER_PARTITA = 15;
export const VITE = 3;
export const SECONDI = [10, 8, 6]; // tempo per decidere, per livello del messaggio

/** La partita: 15 messaggi, circa due su tre truffe, dal più facile al più difficile. */
export function scegliPartita(messaggi, caso = Math.random, n = PER_PARTITA) {
  const mescola = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(caso() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const truffe = mescola(messaggi.filter((m) => m.truffa)), veri = mescola(messaggi.filter((m) => !m.truffa));
  const quanteVere = Math.round(n / 3);
  const scelti = [...truffe.slice(0, n - quanteVere), ...veri.slice(0, quanteVere)];
  return mescola(scelti).sort((a, b) => a.livello - b.livello);
}

/** risposta: 'truffa' o 'affidabile'. */
export const giusto = (m, risposta) => (risposta === 'truffa') === m.truffa;

/** 10 punti se giusto, più fino a 5 per la rapidità (frazione di tempo rimasto, 0-1). */
export const punti = (ok, rimasto) => (ok ? 10 + Math.round(5 * Math.max(0, Math.min(1, rimasto))) : 0);

export function nuovoStato() {
  return { punti: 0, giuste: 0, sbagliate: 0, vite: VITE, indice: 0, serie: 0, migliore: 0 };
}

export function segna(s, ok, rimasto) {
  const t = { ...s, indice: s.indice + 1 };
  if (ok) { t.giuste += 1; t.serie += 1; t.punti += punti(true, rimasto); } else { t.sbagliate += 1; t.serie = 0; t.vite -= 1; }
  t.migliore = Math.max(t.migliore, t.serie);
  return t;
}

export const finita = (s, totale) => s.vite <= 0 || s.indice >= totale;

export function testoCondivisione(s) {
  return `Ho riconosciuto ${s.giuste} messaggi su ${s.giuste + s.sbagliate} con il Polpo civico: ${s.punti} punti. Sfida chi ti manda «Ciao mamma»!`;
}
