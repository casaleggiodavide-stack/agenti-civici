// Più o meno: le regole del gioco, senza disegno, così si possono provare (e la classifica può rifare i conti).
// Due contratti pubblici veri: quale è costato di più? Il contratto appena svelato resta in tavola con il suo
// importo e ne arriva uno nuovo, coperto. Si comincia con importi molto diversi e oggetti familiari, si finisce
// con coppie dello stesso ordine di grandezza. Venti coppie al massimo, tre vite.

import { META, CARTE } from './contratti.js';
import { caso } from '../../comune/premi.js';

export { META, CARTE };

export const COPPIE = 20;
export const VITE = 3;
export const SECONDI = [12, 10, 8];          // tempo per decidere, per livello
export const PUNTI_LIVELLO = [10, 15, 20];   // punti per una risposta giusta, per livello
export const LAMPO = 0.6;                    // «colpo d'occhio»: rispondi con più del 60% del tempo ancora da usare
export const BONUS_LAMPO = 5;
export const BONUS_SERIE = 5;                // dalla terza giusta di fila
export const BONUS_ORO = 25;                 // contratto d'oro indovinato
export const SERIE_VITA = 5;                 // ogni cinque giuste di fila il Polpo ti ridà una vita (se ne hai perse)
// quanto sono lontani gli importi, per livello: rapporto fra il più caro e il meno caro [minimo, massimo)
export const FINESTRE = [[6, Infinity], [2, 6], [1.15, 2]];

/** Il livello della coppia k (da 0): le prime 5 facili, poi 7 medie, poi le vicine. */
export const livello = (k) => (k < 5 ? 1 : k < 12 ? 2 : 3);

/** Una carta del mazzo come oggetto con i nomi dei campi. */
export function carta(i, carte = CARTE, meta = META) {
  const c = carte[i];
  if (!c) return null;
  const cat = meta.categorie[c[1]];
  return {
    indice: i, cig: c[0], categoria: cat.id, nomeCategoria: cat.nome, emoji: cat.emoji, facile: cat.facile,
    testo: c[2], originale: c[3], ente: c[4], tipoEnte: meta.enti[c[5]], provincia: c[6], regione: meta.regioni[c[7]],
    procedura: meta.procedure[c[8]], importo: c[9], offerte: c[10], abitanti: c[11], oro: c[12], anno: c[13],
    mediana: cat.mediana, contrattiCategoria: cat.n, link: meta.link_cig.replace('%CIG%', encodeURIComponent(c[0])),
  };
}

const rapporto = (a, b) => Math.max(a, b) / Math.min(a, b);

/**
 * Le carte della partita dal seme: COPPIE + 1 indici del mazzo, e quali sono «d'oro» (hanno una curiosità
 * vera e valgono di più: ogni tanto, mai due a meno di tre coppie di distanza). La coppia k è (carte[k], carte[k + 1]):
 * la prima carta è quella già svelata (a sinistra), la seconda è la nuova. Le scelte del giocatore non
 * cambiano le carte, così la classifica può rifare la stessa partita.
 */
export function preparaPartita(seme, carte = CARTE, meta = META) {
  const rnd = caso(`${seme}-piu-o-meno`);
  const ordine = carte.map((_, i) => i);
  for (let i = ordine.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ordine[i], ordine[j]] = [ordine[j], ordine[i]]; }
  const facile = (i) => meta.categorie[carte[i][1]].facile;
  const imp = (i) => carte[i][9];
  const usate = new Set();
  const scelte = [], oro = [false], volte = {};
  const primo = ordine.find((i) => facile(i) && imp(i) >= 15000 && imp(i) <= 150000) ?? ordine[0];
  scelte.push(primo); usate.add(primo); volte[carte[primo][1]] = 1;
  let ultimoOro = -9;
  for (let k = 0; k < COPPIE; k++) {
    const lv = livello(k), [min, max] = FINESTRE[lv - 1];
    const prima = scelte[k], primaPrima = scelte[k - 1];
    const a = imp(prima);
    const voglioOro = k >= 2 && k - ultimoOro >= 3 && rnd() < 0.35;
    let su = rnd() < 0.5;
    if (lv === 1 && a > 250000) su = false;
    if (lv === 1 && a < 12000) su = true;
    const partenza = Math.floor(rnd() * ordine.length);
    // passaggi sempre più larghi: la carta giusta si trova sempre
    const passi = [
      { oro: voglioOro, verso: true, regione: true, cat: 3, finestra: 1 },
      { oro: false, verso: true, regione: true, cat: 3, finestra: 1, senzaOro: true },
      { oro: false, verso: false, regione: true, cat: 3, finestra: 1, senzaOro: true },
      { oro: false, verso: false, regione: true, cat: 2, finestra: 1 },
      { oro: false, verso: false, regione: false, cat: 1, finestra: 1 },
      { oro: false, verso: false, regione: false, cat: 0, finestra: 1 },
      { oro: false, verso: false, regione: false, cat: 0, finestra: 2 },
    ];
    let trovata = null, conOro = false;
    for (const p of passi) {
      for (let n = 0; n < ordine.length && trovata === null; n++) {
        const i = ordine[(partenza + n) % ordine.length];
        if (usate.has(i)) continue;
        const b = imp(i), r = rapporto(a, b);
        if (r < 1.15) continue; // mai importi quasi uguali: c'è sempre una risposta giusta
        if (p.finestra === 1 ? (r < min || r >= max) : r < Math.min(min, 1.5)) continue;
        if (p.verso && (b > a) !== su) continue;
        if (lv === 1 && !facile(i)) continue;
        if (p.oro && !carte[i][12]) continue;
        if (p.senzaOro && carte[i][12]) continue; // le curiosità restano per i contratti d'oro
        if (p.cat >= 3 && (volte[carte[i][1]] || 0) >= 2) continue;
        if (p.regione && carte[i][7] === carte[prima][7]) continue;
        if (p.cat >= 1 && carte[i][1] === carte[prima][1]) continue;
        if (p.cat >= 2 && primaPrima !== undefined && carte[i][1] === carte[primaPrima][1]) continue;
        trovata = i; conOro = p.oro;
      }
      if (trovata !== null) break;
    }
    if (trovata === null) throw new Error('mazzo troppo piccolo');
    if (conOro) ultimoOro = k;
    scelte.push(trovata); usate.add(trovata); oro.push(conOro);
    volte[carte[trovata][1]] = (volte[carte[trovata][1]] || 0) + 1;
  }
  return { carte: scelte, oro };
}

/** La scelta 's' (il contratto a sinistra, già svelato) o 'd' (quello nuovo) è giusta? '-' = tempo scaduto. */
export function giusta(partita, k, scelta, carte = CARTE) {
  const a = carte[partita.carte[k]][9], b = carte[partita.carte[k + 1]][9];
  if (scelta === 's') return a > b;
  if (scelta === 'd') return b > a;
  return false;
}

export function nuovoStato() {
  return { punti: 0, giuste: 0, sbagliate: 0, vite: VITE, indice: 0, serie: 0, migliore: 0, lampi: 0, ori: 0, oriPresi: 0, viteRese: 0, vicine: 0, vicineGiuste: 0 };
}

/** I punti di una risposta giusta. */
export function puntiRisposta(lv, rimasto, serie, oro) {
  return PUNTI_LIVELLO[lv - 1] + (rimasto >= LAMPO ? BONUS_LAMPO : 0) + (serie >= 3 ? BONUS_SERIE : 0) + (oro ? BONUS_ORO : 0);
}

/** Segna una risposta. rimasto: frazione di tempo non usata (0-1). oro: la carta nuova era d'oro. */
export function segna(s, ok, rimasto, { livello: lv = 1, oro = false } = {}) {
  const t = { ...s, indice: s.indice + 1 };
  if (oro) t.ori += 1;
  if (lv === 3) t.vicine += 1;
  if (ok) {
    t.giuste += 1; t.serie += 1;
    t.punti += puntiRisposta(lv, rimasto, t.serie, oro);
    if (rimasto >= LAMPO) t.lampi += 1;
    if (oro) t.oriPresi += 1;
    if (lv === 3) t.vicineGiuste += 1;
    if (t.serie % SERIE_VITA === 0 && t.vite < VITE) { t.vite += 1; t.viteRese += 1; }
  } else {
    t.sbagliate += 1; t.serie = 0; t.vite -= 1;
  }
  t.migliore = Math.max(t.migliore, t.serie);
  return t;
}

export const finita = (s) => s.vite <= 0 || s.indice >= COPPIE;

/**
 * I punti veri di una partita, dalle sole mosse: partita = { scelte: [['s'|'d'|'-', rimasto 0-1], ...] }.
 * Lancia un errore se le mosse sono impossibili (troppe, dopo la fine, valori strani) o la partita non è finita.
 */
export function punteggio(partita, seme, carte = CARTE, meta = META) {
  if (!partita || typeof partita !== 'object' || !Array.isArray(partita.scelte)) throw new Error('scelte mancanti');
  const sc = partita.scelte;
  if (!sc.length || sc.length > COPPIE) throw new Error('numero di scelte non valido');
  if (typeof seme !== 'string' || !seme || seme.length > 40) throw new Error('seme non valido');
  const p = preparaPartita(seme, carte, meta);
  let s = nuovoStato();
  sc.forEach((m, k) => {
    if (!Array.isArray(m) || m.length > 2) throw new Error('scelta non valida');
    const [x, rimasto] = m;
    if (finita(s)) throw new Error('partita già finita');
    if (!['s', 'd', '-'].includes(x)) throw new Error('scelta non valida');
    if (x !== '-' && (typeof rimasto !== 'number' || !(rimasto >= 0 && rimasto <= 1))) throw new Error('tempo non valido');
    s = segna(s, giusta(p, k, x, carte), x === '-' ? 0 : rimasto, { livello: livello(k), oro: p.oro[k + 1] });
  });
  if (!finita(s)) throw new Error('partita non finita');
  return s.punti;
}

// ---------------------------------------------------------------- confronti (solo fatti calcolabili dai dati)

/** 125000 → «125.000 €»; sotto i 10.000 euro si tengono i centesimi solo se ci sono. */
export function euro(v) {
  const n = Math.round(v * 100) / 100;
  const intero = Math.floor(n), cent = Math.round((n - intero) * 100);
  const s = String(intero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${s}${n < 10000 && cent ? `,${String(cent).padStart(2, '0')}` : ''} €`;
}

/** 1363 → «1.363» (sempre con il punto delle migliaia, anche a quattro cifre). */
export const migliaia = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Numero all'italiana con una cifra decimale: 3.24 → «3,2». */
export const virgola = (x, cifre = 1) => x.toFixed(cifre).replace('.', ',');

/** Il confronto con la mediana della stessa categoria. */
export function rispettoMediana(importo, mediana) {
  if (!mediana) return '';
  const r = importo / mediana;
  if (r >= 0.95 && r <= 1.05) return 'in linea con la mediana';
  if (r > 1) return `${virgola(r, r < 10 ? 1 : 0)} volte la mediana`;
  return `il ${Math.max(1, Math.round(r * 100))}% della mediana`;
}

/** Euro per abitante, per i contratti dei Comuni con la popolazione ISTAT. */
export function perAbitante(importo, abitanti) {
  if (!abitanti) return null;
  const v = importo / abitanti;
  return v < 10 ? virgola(v, 2) : String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** «A è costato 3,2 volte B». */
export const quanteVolte = (a, b) => virgola(Math.max(a, b) / Math.min(a, b), Math.max(a, b) / Math.min(a, b) < 10 ? 1 : 0);

// ---------------------------------------------------------------- premi

export const MEDAGLIE = {
  prima: { icona: '🌱', nome: 'Prima partita', come: 'Finisci una partita' },
  lampo: { icona: '⚡', nome: 'Colpo d\'occhio', come: '5 risposte giuste in fretta nella stessa partita' },
  oro: { icona: '✦', nome: 'Cercatore d\'oro', come: 'Indovina un contratto d\'oro' },
  serie: { icona: '🔥', nome: 'Dieci di fila', come: '10 risposte giuste di fila' },
  vicine: { icona: '🔍', nome: 'Occhio da revisore', come: 'Tutte giuste le coppie più vicine (livello 3)' },
  venti: { icona: '🐙', nome: 'Venti su venti', come: 'Nessun errore in tutta la partita' },
};

export function medaglieGuadagnate(s) {
  const m = ['prima'];
  if (s.lampi >= 5) m.push('lampo');
  if (s.oriPresi >= 1) m.push('oro');
  if (s.migliore >= 10) m.push('serie');
  if (s.indice >= COPPIE && s.vicine >= 8 && s.vicineGiuste === s.vicine) m.push('vicine');
  if (s.indice >= COPPIE && s.giuste === COPPIE) m.push('venti');
  return m;
}

export const TITOLI = [[0, 'Turista dei bilanci'], [100, 'Cittadino curioso'], [220, 'Lettore di determine'], [350, 'Revisore dei conti'], [500, 'Polpo degli appalti']];

export const LIVELLI = ['', 'Livello 1: importi molto diversi', 'Livello 2: più vicini, meno tempo', 'Livello 3: stesso ordine di grandezza'];

export function testoCondivisione(s) {
  return `Ho indovinato ${s.giuste} contratti pubblici su ${s.giuste + s.sbagliate} a «Più o meno» del Polpo civico: ${s.punti} punti. Sai quanto costa una mensa scolastica?`;
}
