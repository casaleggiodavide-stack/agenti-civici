// Calcolo delle scadenze per gli agenti civici.
// Le date sono «di calendario» (anno, mese, giorno) senza ore né fusi orari.
// Festività nazionali: legge 260/1949 e successive, compreso il 4 ottobre
// (San Francesco) dal 2026 per la legge 151/2025.

/** Da 'AAAA-MM-GG' a Date a mezzogiorno UTC, per evitare salti di fuso. */
export function data(s) {
  if (s instanceof Date) return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), 12));
  if (!s) return null;
  const [a, m, g] = String(s).split('-').map(Number);
  if (!a || !m || !g) return null;
  return new Date(Date.UTC(a, m - 1, g, 12));
}

/** Da Date a 'AAAA-MM-GG'. */
export const iso = (d) => d.toISOString().slice(0, 10);

/** Oggi, come data di calendario. */
export function oggi(rif) {
  const d = rif ? new Date(rif) : new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));
}

export function aggiungiGiorni(d, n) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

/** Giorni di calendario da a a b (positivo se b è dopo a). */
export const giorniTra = (a, b) => Math.round((b - a) / 86400000);

/** Domenica di Pasqua (algoritmo di Meeus/Jones/Butcher). */
export function pasqua(anno) {
  const a = anno % 19, b = Math.floor(anno / 100), c = anno % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31);
  const giorno = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anno, mese - 1, giorno, 12));
}

const FISSE = ['01-01', '01-06', '04-25', '05-01', '06-02', '08-15', '11-01', '12-08', '12-25', '12-26'];

export function festivo(d) {
  const anno = d.getUTCFullYear();
  const md = iso(d).slice(5);
  if (d.getUTCDay() === 0) return true;
  if (FISSE.includes(md)) return true;
  if (anno >= 2026 && md === '10-04') return true;
  const p = pasqua(anno);
  return iso(d) === iso(aggiungiGiorni(p, 1));
}

/**
 * Scadenza a n giorni da una data.
 * opzioni.feriale: salta i giorni dal 1° al 31 agosto (sospensione feriale, L. 742/1969).
 * opzioni.slitta: se la scadenza cade di domenica o in un festivo, passa al primo giorno utile.
 * opzioni.sabato: con slitta, considera non utile anche il sabato (art. 155 c. 5 cpc).
 */
export function scadenza(inizio, n, opzioni = {}) {
  let d = data(inizio);
  if (!d) return null;
  if (opzioni.feriale) {
    let contati = 0;
    while (contati < n) {
      d = aggiungiGiorni(d, 1);
      const agosto = d.getUTCMonth() === 7;
      if (!agosto) contati += 1;
    }
  } else {
    d = aggiungiGiorni(d, n);
  }
  if (opzioni.slitta) {
    while (festivo(d) || (opzioni.sabato && d.getUTCDay() === 6)) d = aggiungiGiorni(d, 1);
  }
  return d;
}

const fmt = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtBreve = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const scritta = (d) => (d ? fmt.format(d) : '');
export const scrittaBreve = (d) => (d ? fmtBreve.format(d) : '');
