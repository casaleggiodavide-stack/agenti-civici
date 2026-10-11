// Motore delle regole di «Mi spetta».
// Ogni prestazione dichiara dei requisiti a tre valori: vero, falso, oppure
// null quando manca il dato per deciderlo. Il motore ne ricava l'esito e
// non inventa mai: se un dato manca, lo dice.

import { PRESTAZIONI } from './prestazioni/index.js';
import { arricchisci } from './situazione.js';
export { tutti, almenoUno, minoreUguale, minore, maggioreUguale } from './logica.js';

export const ESITI = {
  spetta: 'Ti spetta',
  probabile: 'Probabilmente ti spetta',
  manca_dato: 'Serve un dato',
  chiusa: 'Ti spetterebbe, ma la domanda è chiusa',
  non_spetta: 'Non ti spetta',
};

const ORDINE_ESITI = ['spetta', 'probabile', 'manca_dato', 'chiusa', 'non_spetta'];

function esitoDaRequisiti(requisiti) {
  const valori = requisiti.map((r) => r.ok);
  if (valori.some((v) => v === false)) return 'non_spetta';
  if (valori.some((v) => v === null || v === undefined)) return 'manca_dato';
  return 'spetta';
}

function finestraChiusa(finestra, oggi) {
  if (!finestra || !finestra.a) return false;
  return oggi > new Date(finestra.a + 'T23:59:59');
}

/**
 * Valuta una situazione su tutte le prestazioni.
 * @param {object} risposte - le risposte del questionario (vedi situazione.js)
 * @param {object} [opzioni] - { oggi: Date }
 */
export function valuta(risposte, opzioni = {}) {
  const oggi = opzioni.oggi ? new Date(opzioni.oggi) : new Date();
  const s = arricchisci(risposte, oggi);
  const risultati = [];

  for (const p of PRESTAZIONI) {
    let r;
    try {
      r = p.valuta(s, oggi);
    } catch (e) {
      r = { requisiti: [{ testo: 'Errore nel calcolo: ' + e.message, ok: null }] };
    }
    const requisiti = (r.requisiti || []).filter(Boolean);
    let esito = r.esito || esitoDaRequisiti(requisiti);
    if (esito === 'spetta' && r.probabile) esito = 'probabile';
    if ((esito === 'spetta' || esito === 'probabile') && finestraChiusa(p.finestra, oggi)) esito = 'chiusa';

    const mancano = requisiti.filter((q) => q.ok === null || q.ok === undefined).map((q) => q.dato).filter(Boolean);

    risultati.push({
      id: p.id,
      nome: p.nome,
      ente: p.ente,
      categoria: p.categoria,
      sintesi: p.sintesi,
      esito,
      etichetta: ESITI[esito],
      automatica: Boolean(p.automatica),
      importo: r.importo || null,
      requisiti,
      mancano: [...new Set(mancano)],
      note: r.note || [],
      come: p.come,
      finestra: p.finestra || null,
      fonti: p.fonti,
      verificato: p.verificato,
    });
  }

  risultati.sort((a, b) => {
    const d = ORDINE_ESITI.indexOf(a.esito) - ORDINE_ESITI.indexOf(b.esito);
    if (d !== 0) return d;
    return valoreAnnuo(b) - valoreAnnuo(a);
  });

  const positivi = risultati.filter((r) => r.esito === 'spetta' || r.esito === 'probabile');
  return {
    oggi: oggi.toISOString().slice(0, 10),
    totaleAnnuoStimato: Math.round(positivi.reduce((t, r) => t + valoreAnnuo(r), 0)),
    conteggio: Object.fromEntries(ORDINE_ESITI.map((e) => [e, risultati.filter((r) => r.esito === e).length])),
    risultati,
  };
}

/** Valore economico annuo usato per ordinare e sommare: annuo, oppure una tantum. */
export function valoreAnnuo(r) {
  if (!r.importo || r.importo.nonSommare) return 0;
  return (r.importo.annuo || 0) + (r.importo.unaTantum || 0);
}

export { PRESTAZIONI };
