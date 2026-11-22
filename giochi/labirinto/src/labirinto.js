// Il filo del labirinto: la pianta del labirinto, senza disegno, così si può provare.
// Una griglia di celle; la strada giusta va dall'ingresso (a sinistra della prima cella in alto) all'uscita
// (a destra dell'ultima cella in basso). Su quella strada ci sono i bivi: da ogni bivio partono tanti
// corridoi quante sono le scelte; uno continua la strada, gli altri sono vicoli ciechi corti.
// Tutto il resto è muro pieno (gli schedari). Stesso seme, stesso labirinto: la sfida è uguale per tutti.

/** La griglia cresce con i bivi: 9×7 fino a cinque bivi, poi più righe e colonne. */
export const misure = (bivi) => (bivi <= 5 ? [9, 7] : bivi === 6 ? [9, 8] : [10, 10]);
const PASSI = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // est, sud, ovest, nord

function griglia(colonne, righe) {
  const xy = (c) => [c % colonne, Math.floor(c / colonne)];
  const vicine = (c) => {
    const [x, y] = xy(c);
    return PASSI.map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < colonne && b < righe).map(([a, b]) => b * colonne + a);
  };
  return { n: colonne * righe, vicine };
}

function mescola(a, rng) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

/** La strada da un angolo all'altro: quella di un labirinto perfetto scavato a caso (visita in profondità). */
function strada(rng, { n, vicine }) {
  const padre = new Array(n).fill(-1), visto = new Array(n).fill(false);
  const pila = [0];
  visto[0] = true;
  while (pila.length) {
    const c = pila[pila.length - 1];
    const libere = vicine(c).filter((v) => !visto[v]);
    if (!libere.length) { pila.pop(); continue; }
    const v = libere[Math.floor(rng() * libere.length)];
    visto[v] = true; padre[v] = c; pila.push(v);
  }
  const via = [];
  for (let c = n - 1; c !== -1; c = padre[c]) via.push(c);
  return via.reverse();
}

function tenta(scelte, rng, colonne, righe) {
  const g = griglia(colonne, righe), vicine = g.vicine;
  const via = strada(rng, g), L = via.length, N = scelte.length;
  if (L < 3 * N + 3) return null;
  const preso = new Set(via);
  const bivi = [];
  let prima = 0;
  for (let j = 0; j < N; j++) {
    const servono = scelte[j] - 1;
    const meta = Math.round(((j + 1) * (L - 1)) / (N + 1));
    const candidati = [];
    for (let i = prima + 2; i <= L - 3 - 2 * (N - 1 - j); i++) candidati.push(i);
    candidati.sort((a, b) => Math.abs(a - meta) - Math.abs(b - meta));
    const i = candidati.find((k) => vicine(via[k]).filter((v) => !preso.has(v)).length >= servono);
    if (i === undefined) return null;
    const rami = [];
    for (const bocca of mescola(vicine(via[i]).filter((v) => !preso.has(v)), rng).slice(0, servono)) {
      if (preso.has(bocca)) return null;
      const celle = [bocca];
      preso.add(bocca);
      const lunghezza = 1 + Math.floor(rng() * 3); // vicoli di una, due o tre celle
      while (celle.length < lunghezza) {
        const avanti = vicine(celle[celle.length - 1]).filter((v) => !preso.has(v));
        if (!avanti.length) break;
        const v = avanti[Math.floor(rng() * avanti.length)];
        celle.push(v); preso.add(v);
      }
      rami.push(celle);
    }
    bivi.push({ indice: i, cella: via[i], avanti: via[i + 1], rami });
    prima = i;
  }
  const collegamenti = [];
  for (let k = 1; k < L; k++) collegamenti.push([via[k - 1], via[k]]);
  for (const b of bivi) for (const r of b.rami) { collegamenti.push([b.cella, r[0]]); for (let k = 1; k < r.length; k++) collegamenti.push([r[k - 1], r[k]]); }
  return { colonne, righe, via, bivi, collegamenti };
}

/**
 * La pianta: scelte = quante strade ha ogni bivio (2 o 3). Restituisce
 * { colonne, righe, via: [celle dall'ingresso all'uscita], bivi: [{ indice, cella, avanti, rami: [[celle del vicolo]] }], collegamenti: [[a, b]] }.
 */
export function pianta(scelte, rng) {
  const [colonne, righe] = misure(scelte.length);
  for (let t = 0; t < 500; t++) {
    const p = tenta(scelte, rng, colonne, righe);
    if (p) return p;
  }
  throw new Error('labirinto impossibile per questi bivi');
}

/** Le celle collegate, come insieme di chiavi «a-b» con a < b. */
export const aperti = (p) => new Set(p.collegamenti.map(([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`)));
