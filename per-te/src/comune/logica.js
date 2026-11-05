// Copia di comune/logica.js: non modificare qui, usa npm run sincronizza.
// Logica a tre valori: vero, falso, null quando manca il dato.

/** Combina requisiti a tre valori: basta un falso per escludere. */
export function tutti(...valori) {
  if (valori.some((v) => v === false)) return false;
  if (valori.some((v) => v === null || v === undefined)) return null;
  return true;
}

/** Almeno uno vero; null se nessuno è vero e qualcuno è sconosciuto. */
export function almenoUno(...valori) {
  if (valori.some((v) => v === true)) return true;
  if (valori.some((v) => v === null || v === undefined)) return null;
  return false;
}

/** Confronto che restituisce null se il valore non è noto. */
export function minoreUguale(valore, soglia) {
  if (valore === null || valore === undefined || Number.isNaN(valore)) return null;
  return valore <= soglia;
}
export function minore(valore, soglia) {
  if (valore === null || valore === undefined || Number.isNaN(valore)) return null;
  return valore < soglia;
}
export function maggioreUguale(valore, soglia) {
  if (valore === null || valore === undefined || Number.isNaN(valore)) return null;
  return valore >= soglia;
}

