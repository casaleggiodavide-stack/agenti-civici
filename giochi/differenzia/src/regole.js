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

/**
 * Punti e serie: ogni 5 lanci giusti di fila il moltiplicatore sale di uno, fino a 4.
 * Un rifiuto d'oro giusto vale il triplo e restituisce una vita persa.
 */
export function segna(stato, esito, { oro = false, difficile = false } = {}) {
  const s = { ...stato };
  if (esito === 'sbagliato') {
    s.serie = 0;
    s.vite -= 1;
    s.errori += 1;
  } else {
    s.serie += 1;
    s.giusti += 1;
    s.punti += PUNTI * moltiplicatore(s.serie) * (oro ? 3 : 1);
    if (oro) { s.ori += 1; if (s.vite < VITE) s.vite += 1; }
    if (difficile) s.difficili += 1;
  }
  s.migliore = Math.max(s.migliore, s.serie);
  return s;
}

/**
 * Le fasi della partita, come nei giochi che si imparano giocando: si comincia con i bidoni più
 * conosciuti, poi si aprono il secco e l'isola ecologica, poi arrivano i rifiuti che ingannano
 * e quelli la cui regola cambia da Comune a Comune.
 */
export const FASI = [
  { da: 0, nome: 'Riscaldamento', testo: 'Carta, plastica, vetro e umido', bidoni: ['carta', 'plastica', 'vetro', 'organico'] },
  { da: 20, nome: 'Si aprono il secco e l\'isola ecologica', testo: 'Pile, farmaci, scontrini: dove vanno?', bidoni: null },
  { da: 45, nome: 'Dipende dal Comune', testo: 'Arrivano i rifiuti con le regole che cambiano', bidoni: null },
  { da: 70, nome: 'Gran finale', testo: 'Più veloci, e più rifiuti d\'oro', bidoni: null },
];
export const fase = (secondi) => FASI.reduce((f, x, i) => (secondi >= x.da ? i : f), 0);

/** 1 = un imballaggio che si riconosce; 2 = va nel secco o all'isola; 3 = dipende dal Comune. */
export const difficolta = (r) => ((r.dipende || (r.alternative || []).length) ? 3 : ['indifferenziato', 'isola'].includes(r.contenitore) ? 2 : 1);

/** I rifiuti che possono cadere in una fase. */
export const ammessi = (rifiuti, f) => rifiuti.filter((r) => difficolta(r) <= Math.min(3, f + 1));

/** Ogni quanti rifiuti ne cade uno d'oro: mai nel riscaldamento, più spesso nel finale. */
export const ogniOro = (f) => (f === 0 ? Infinity : f === 3 ? 6 : 9);

/** Le serie che il gioco festeggia. */
export function traguardo(serie) {
  return { 5: 'Serie da 5: punti doppi!', 10: 'Serie da 10: punti tripli!', 15: 'Serie da 15: punti ×4!', 25: 'Serie da 25: inarrestabile!', 40: 'Serie da 40: leggenda!' }[serie] || null;
}

export const MEDAGLIE = {
  prima: { icona: '🌱', nome: 'Primo giro', come: 'Finisci una partita' },
  serie10: { icona: '🔥', nome: 'Mano calda', come: '10 giusti di fila' },
  serie25: { icona: '🌋', nome: 'Inarrestabile', come: '25 giusti di fila' },
  oro: { icona: '🥇', nome: 'Cercatore d\'oro', come: '3 rifiuti d\'oro in una partita' },
  comune: { icona: '🏛️', nome: 'Esperto del Comune', come: '5 rifiuti «dipende» giusti in una partita' },
  pulito: { icona: '✨', nome: 'Senza macchia', come: 'Arriva alla fine dei 90 secondi con tutte le vite' },
  maestro: { icona: '🐙', nome: 'Maestro del riciclo', come: 'Fai 800 punti' },
};

export function medaglieGuadagnate(s, finitoIlTempo) {
  const m = ['prima'];
  if (s.migliore >= 10) m.push('serie10');
  if (s.migliore >= 25) m.push('serie25');
  if (s.ori >= 3) m.push('oro');
  if (s.difficili >= 5) m.push('comune');
  if (finitoIlTempo && s.vite === VITE) m.push('pulito');
  if (s.punti >= 800) m.push('maestro');
  return m;
}

export const TITOLI = [[0, 'Apprendista del riciclo'], [120, 'Differenziatore di quartiere'], [300, 'Campione della raccolta'], [550, 'Asso dell\'isola ecologica'], [800, 'Maestro del riciclo']];

export const moltiplicatore = (serie) => Math.min(4, 1 + Math.floor(serie / 5));

export function nuovoStato() {
  return { punti: 0, serie: 0, migliore: 0, giusti: 0, errori: 0, persi: 0, vite: VITE, ori: 0, difficili: 0 };
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
