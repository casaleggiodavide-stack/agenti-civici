// I nomi della classifica: inventati, scelti fra creature del mare e aggettivi gentili, con un numero.
// Nessun testo libero: così in classifica non finiscono nomi veri, offese o dati personali.
// Il nome viaggia come tre numeri (creatura, aggettivo, numero) e lo ricompone chi lo mostra.

export const CREATURE = [
  ['Polpo', 'm'], ['Seppia', 'f'], ['Medusa', 'f'], ['Delfino', 'm'], ['Granchio', 'm'], ['Tartaruga', 'f'],
  ['Cavalluccio', 'm'], ['Stella marina', 'f'], ['Riccio', 'm'], ['Balena', 'f'], ['Gabbiano', 'm'], ['Aragosta', 'f'],
  ['Paguro', 'm'], ['Murena', 'f'], ['Calamaro', 'm'], ['Orata', 'f'], ['Pellicano', 'm'], ['Foca', 'f'],
  ['Tonno', 'm'], ['Sogliola', 'f'], ['Narvalo', 'm'], ['Razza', 'f'], ['Gambero', 'm'], ['Lontra', 'f'],
];

export const AGGETTIVI = [
  ['Rapido', 'Rapida'], ['Saggio', 'Saggia'], ['Attento', 'Attenta'], ['Curioso', 'Curiosa'], ['Gentile', 'Gentile'],
  ['Tenace', 'Tenace'], ['Allegro', 'Allegra'], ['Sveglio', 'Sveglia'], ['Coraggioso', 'Coraggiosa'], ['Paziente', 'Paziente'],
  ['Brillante', 'Brillante'], ['Instancabile', 'Instancabile'], ['Preciso', 'Precisa'], ['Vivace', 'Vivace'], ['Sereno', 'Serena'],
  ['Ingegnoso', 'Ingegnosa'], ['Scattante', 'Scattante'], ['Prudente', 'Prudente'], ['Leale', 'Leale'], ['Generoso', 'Generosa'],
];

export const REGIONI = ['Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 'Friuli Venezia Giulia', 'Lazio', 'Liguria',
  'Lombardia', 'Marche', 'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana', 'Trentino-Alto Adige', 'Umbria',
  'Valle d\'Aosta', 'Veneto'];

/** Il nome da tre numeri; null se i numeri non sono validi. */
export function nome(codice) {
  if (!Array.isArray(codice) || codice.length !== 3 || !codice.every(Number.isInteger)) return null;
  const [c, a, n] = codice;
  if (c < 0 || c >= CREATURE.length || a < 0 || a >= AGGETTIVI.length || n < 1 || n > 99) return null;
  const [creatura, genere] = CREATURE[c];
  return `${creatura} ${AGGETTIVI[a][genere === 'm' ? 0 : 1]} ${n}`;
}

/** Un nome a caso, come tre numeri. */
export function codiceCasuale(caso = Math.random) {
  return [Math.floor(caso() * CREATURE.length), Math.floor(caso() * AGGETTIVI.length), 1 + Math.floor(caso() * 99)];
}

/** La regione: il nome esatto dell'elenco, oppure stringa vuota. */
export const regioneValida = (r) => (REGIONI.includes(r) ? r : '');
