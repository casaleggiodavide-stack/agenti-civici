// Copia di comune/schede.js: non modificare qui, usa npm run sincronizza.
// Strumenti condivisi dagli agenti che mostrano schede di enti pubblici
// (Il bilancio del mio Comune, Red flag sugli appalti): dati caricati a pezzi,
// ricerca per nome, numeri scritti in modo leggibile.

const cache = new Map();

/** Carica un file JSON una volta sola. */
export function caricaJSON(url) {
  const k = String(url);
  if (!cache.has(k)) {
    cache.set(k, fetch(k).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} su ${k}`);
      return r.json();
    }).catch((e) => { cache.delete(k); throw e; }));
  }
  return cache.get(k);
}

export const normalizza = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Cerca per parole in un elenco: tutte devono comparire nel testo indicizzato.
 * `testoDi(riga)` dà il testo da cercare, `pesoDi(riga)` un bonus (per esempio i Comuni prima).
 */
export function cercaIn(righe, testo, { testoDi, nomeDi = testoDi, pesoDi = () => 0, limite = 8 } = {}) {
  const parole = normalizza(testo).replace(/^comune di /, '').split(' ').filter((p) => p.length > 1 || /\d/.test(p));
  if (!parole.length) return [];
  const trovati = [];
  for (const r of righe) {
    const t = r.__n || (r.__n = ` ${normalizza(testoDi(r))} `);
    if (!parole.every((p) => t.includes(p))) continue;
    const nome = normalizza(nomeDi(r));
    let punti = pesoDi(r);
    if (nome === parole.join(' ') || nome === 'comune di ' + parole.join(' ')) punti += 20;
    if (nome.startsWith(parole[0]) || nome.startsWith('comune di ' + parole[0])) punti += 4;
    punti -= nome.length / 40;
    trovati.push([punti, r]);
  }
  return trovati.sort((a, b) => b[0] - a[0]).slice(0, limite).map(([, r]) => r);
}

const intero = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' });
const unaCifra = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1, minimumFractionDigits: 0 });

/** 1.234.567 → «1,2 milioni di euro»; 45.300 → «45.300 euro». */
export function euroParole(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  const a = Math.abs(n);
  const segno = n < 0 ? '−' : '';
  if (a >= 1e9) return `${segno}${unaCifra.format(a / 1e9)} miliardi di euro`;
  if (a >= 1e6) return `${segno}${unaCifra.format(a / 1e6)} ${a < 2e6 && a / 1e6 < 1.05 ? 'milione' : 'milioni'} di euro`;
  if (a >= 1e5) return `${segno}${intero.format(Math.round(a / 1000))} mila euro`;
  return `${segno}${intero.format(Math.round(a))} euro`;
}

/** Euro senza decimali, con il simbolo: 1.234 €. */
export const euroTondi = (n) => (n === null || n === undefined || !Number.isFinite(n) ? '' : `${intero.format(Math.round(n))} €`);

export const percento = (n, cifre = 0) => (n === null || n === undefined || !Number.isFinite(n) ? '' : `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: cifre }).format(n)}%`);

export const numeroIt = (n) => (n === null || n === undefined ? '' : intero.format(n));

/** Come si confronta un valore con la mediana degli enti simili, in parole. */
export function rispettoA(valore, mediana, { tolleranza = 0.15 } = {}) {
  if (valore === null || valore === undefined || !mediana) return null;
  const r = valore / mediana;
  if (r > 1 + tolleranza * 3) return { tono: 'piu', parola: `circa ${unaCifra.format(r)} volte` };
  if (r > 1 + tolleranza) return { tono: 'piu', parola: `${percento((r - 1) * 100)} in più` };
  if (r < 1 - tolleranza) return { tono: 'meno', parola: `${percento((1 - r) * 100)} in meno` };
  return { tono: 'pari', parola: 'in linea' };
}

/** Parametri nell'indirizzo dopo il cancelletto: #cf=…&istat=… */
export function leggiAncora() {
  try {
    return Object.fromEntries(new URLSearchParams(location.hash.replace(/^#/, '')));
  } catch {
    return {};
  }
}

export function scriviAncora(param) {
  try {
    history.replaceState(null, '', '#' + new URLSearchParams(param).toString());
  } catch { /* in una pagina incorporata l'indirizzo può non essere modificabile */ }
}
