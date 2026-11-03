// Il Polpo differenzia: le regole del gioco, senza disegno, così si possono provare.
// I rifiuti e i loro contenitori stanno in rifiuti.js (generato da rifiuti.json, con le fonti).

/** I contenitori, nell'ordine in cui stanno in fondo allo schermo. */
export const CONTENITORI = [
  { id: 'carta', nome: 'Carta', icona: '📦' },
  { id: 'plastica', nome: 'Plastica', icona: '🧴' },
  { id: 'vetro', nome: 'Vetro', icona: '🍾' },
  { id: 'organico', nome: 'Organico', corto: 'Umido', icona: '🍂' },
  { id: 'indifferenziato', nome: 'Secco', icona: '🗑️' },
  { id: 'isola', nome: 'Isola ecologica', corto: 'Isola', icona: '🔋' },
];

export const PUNTI = 10;
export const VITE = 3;
export const DURATA = 90; // secondi

/**
 * Com'è andato un lancio.
 * «giusto»: il contenitore indicato dalle regole nazionali; «dipende»: un'alternativa accettata
 * perché la regola cambia da Comune a Comune; «sbagliato»: tutto il resto.
 */
export function valuta(rifiuto, contenitore) {
  if (contenitore === rifiuto.contenitore) return 'giusto';
  if ((rifiuto.alternative || []).includes(contenitore)) return 'dipende';
  return 'sbagliato';
}

/** Punti e serie: ogni 5 lanci giusti di fila il moltiplicatore sale di uno, fino a 4. */
export function segna(stato, esito) {
  const s = { ...stato };
  if (esito === 'sbagliato') {
    s.serie = 0;
    s.vite -= 1;
    s.errori += 1;
  } else {
    s.serie += 1;
    s.giusti += 1;
    s.punti += PUNTI * moltiplicatore(s.serie);
  }
  s.migliore = Math.max(s.migliore, s.serie);
  return s;
}

export const moltiplicatore = (serie) => Math.min(4, 1 + Math.floor(serie / 5));

export function nuovoStato() {
  return { punti: 0, serie: 0, migliore: 0, giusti: 0, errori: 0, persi: 0, vite: VITE };
}

/** Un rifiuto caduto a terra senza lancio: si perde la serie, non una vita. */
export function perso(stato) {
  return { ...stato, serie: 0, persi: stato.persi + 1 };
}

/**
 * In quale contenitore arriva un lancio: si prolunga la direzione dello swipe dal rifiuto
 * fino all'altezza dei contenitori. Restituisce l'indice del contenitore, o -1 se il lancio
 * va verso l'alto o fuori dallo schermo.
 */
export function bersaglio(da, direzione, quotaContenitori, larghezza, n = CONTENITORI.length) {
  const { dx, dy } = direzione;
  if (dy <= 0.15 * Math.hypot(dx, dy)) return -1; // verso l'alto o quasi orizzontale
  const x = da.x + (dx * (quotaContenitori - da.y)) / dy;
  if (x < 0 || x >= larghezza) return -1;
  return Math.min(n - 1, Math.floor((x / larghezza) * n));
}

/** Quanto spesso arriva un rifiuto e quanto veloce cade, secondo il tempo passato (0-1). */
export function ritmo(t) {
  const p = Math.max(0, Math.min(1, t));
  return { intervallo: 1.9 - 1.15 * p, velocita: 0.12 + 0.2 * p }; // secondi; altezze dello schermo al secondo
}

/** Mescolanza ripetibile (per i test) o casuale. */
export function mescola(lista, caso = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(caso() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Il testo da condividere a fine partita: niente dati personali, solo il risultato. */
export function testoCondivisione(stato) {
  const totale = stato.giusti + stato.errori;
  return `Ho differenziato ${stato.giusti} rifiuti su ${totale} con il Polpo civico: ${stato.punti} punti. Sai dove va il cartone della pizza?`;
}
