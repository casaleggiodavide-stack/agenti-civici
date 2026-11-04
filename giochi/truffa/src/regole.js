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
  return { punti: 0, giuste: 0, sbagliate: 0, vite: VITE, indice: 0, serie: 0, migliore: 0, scudo: false, scudi: 0, parati: 0, veloci: 0, cascato: 0, difficili: 0, difficiliGiuste: 0 };
}

/** Ogni quanti giusti di fila il Polpo ti dà uno scudo, che para il prossimo errore. */
export const SERIE_SCUDO = 5;

/** Il premio per la serie: dalla terza risposta giusta di fila, 5 punti in più. */
export const bonusSerie = (serie) => (serie >= 3 ? 5 : 0);

/**
 * Segna una risposta. info: { livello, cascato } (cascato = una truffa presa per vera).
 * Con lo scudo, l'errore non toglie una vita.
 */
export function segna(s, ok, rimasto, { livello = 1, cascato = false } = {}) {
  const t = { ...s, indice: s.indice + 1 };
  if (livello === 3) t.difficili += 1;
  if (ok) {
    t.giuste += 1; t.serie += 1;
    t.punti += punti(true, rimasto) + bonusSerie(t.serie);
    if (rimasto > 2 / 3) t.veloci += 1;
    if (livello === 3) t.difficiliGiuste += 1;
    if (t.serie % SERIE_SCUDO === 0 && !t.scudo) { t.scudo = true; t.scudi += 1; }
  } else {
    t.sbagliate += 1; t.serie = 0;
    if (cascato) t.cascato += 1;
    if (t.scudo) { t.scudo = false; t.parati += 1; } else t.vite -= 1;
  }
  t.migliore = Math.max(t.migliore, t.serie);
  return t;
}

export const LIVELLI = ['', 'Livello 1: le truffe più comuni', 'Livello 2: messaggi più credibili, meno tempo', 'Livello 3: le truffe dei professionisti'];

export const MEDAGLIE = {
  prima: { icona: '🌱', nome: 'Primo giro', come: 'Finisci una partita' },
  scudo: { icona: '🐙', nome: 'Lo scudo del Polpo', come: '5 risposte giuste di fila' },
  fulmine: { icona: '⚡', nome: 'Fulmine', come: '5 risposte giuste nel primo terzo del tempo' },
  'mai-cascato': { icona: '🛡️', nome: 'Mai cascato', come: 'Arriva in fondo senza prendere una truffa per vera' },
  occhio: { icona: '🦅', nome: 'Occhio di falco', come: 'Tutti i messaggi del livello 3 giusti' },
  perfetto: { icona: '🏆', nome: 'Quindici su quindici', come: 'Nessun errore in tutta la partita' },
};

export function medaglieGuadagnate(s, totale) {
  const m = ['prima'];
  const inFondo = s.indice >= totale;
  if (s.scudi > 0) m.push('scudo');
  if (s.veloci >= 5) m.push('fulmine');
  if (inFondo && s.cascato === 0) m.push('mai-cascato');
  if (inFondo && s.difficili >= 3 && s.difficiliGiuste === s.difficili) m.push('occhio');
  if (inFondo && s.giuste === totale) m.push('perfetto');
  return m;
}

export const TITOLI = [[0, 'Facile preda'], [80, 'Attento ai messaggi'], [150, 'Detective digitale'], [210, 'Cacciatore di truffe'], [260, 'Incorruttibile']];

export const finita = (s, totale) => s.vite <= 0 || s.indice >= totale;

export function testoCondivisione(s) {
  return `Ho riconosciuto ${s.giuste} messaggi su ${s.giuste + s.sbagliate} con il Polpo civico: ${s.punti} punti. Sfida chi ti manda «Ciao mamma»!`;
}
