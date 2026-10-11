// Ricerca degli enti dell'Indice delle pubbliche amministrazioni (IndicePA,
// CC BY 4.0). Il modulo dei dati (circa 3 MB) si carica solo alla prima ricerca.

// Sinonimi e sigle che i cittadini usano e che nell'Indice compaiono per esteso.
const ALIAS = {
  asl: ['asl', 'azienda sanitaria', 'ausl', 'asp ', 'ats ', 'ulss', 'asst', 'usl'],
  usl: ['usl', 'azienda sanitaria', 'ausl', 'ulss'],
  ospedale: ['ospedal', 'policlinico', 'azienda ospedaliera'],
  inps: ['inps', 'previdenza sociale'],
  inail: ['inail', 'infortuni sul lavoro'],
  mef: ['economia e delle finanze'],
  mit: ['infrastrutture e dei trasporti'],
  mim: ['istruzione e del merito'],
  miur: ['istruzione'],
  arpa: ['arpa', 'protezione ambientale', 'protezione dell ambiente'],
  ater: ['ater', 'edilizia residenziale'],
  universita: ['universita', 'ateneo', 'politecnico'],
};

const PRIORITA = { L6: 6, L4: 6, L45: 5, L5: 5, C1: 5, C16: 5, L7: 4, L8: 3, L17: 3, C10: 3, C3: 2, L18: 2, SA: -2, SAG: -2, S01: -1 };

export const normalizza = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Prepara l'indice: aggiunge il testo normalizzato a ogni ente. */
export function indicizza(dati) {
  return {
    ...dati,
    righe: dati.enti.map(([nome, cat, comune, prov, pec, sito, sigla]) => ({ nome, cat, comune, prov, pec, sito, chiave: ` ${normalizza(`${nome} ${sigla || ''} ${comune} ${prov}`)} `, nomeN: normalizza(nome), siglaN: normalizza(sigla) })),
  };
}

/** Cerca per parole: tutte devono comparire nel nome, nel comune o nella provincia. */
export function cerca(indice, testo, limite = 8) {
  const parole = normalizza(testo).split(' ').filter((p) => p.length > 1 || /\d/.test(p));
  if (!parole.length) return [];
  const trovati = [];
  for (const e of indice.righe) {
    if (!parole.every((p) => (ALIAS[p] || [p]).some((a) => e.chiave.includes(a)))) continue;
    let punti = PRIORITA[e.cat] || 0;
    if (parole.every((p) => (ALIAS[p] || [p]).some((a) => e.nomeN.includes(a.trim())))) punti += 3;
    if (e.nomeN.startsWith(parole[0])) punti += 2;
    if (e.siglaN && parole.includes(e.siglaN)) punti += 8;
    if (e.nomeN === normalizza('comune di ' + parole.join(' '))) punti += 10;
    punti -= e.nomeN.length / 40;
    trovati.push([punti, e]);
  }
  return trovati.sort((a, b) => b[0] - a[0]).slice(0, limite).map(([, e]) => ({ nome: e.nome, cat: e.cat, categoria: indice.categorie[e.cat] || '', comune: e.comune, prov: e.prov, pec: e.pec, sito: e.sito }));
}

let promessa = null;
/** Carica e indicizza i dati una volta sola (browser e Node). */
export function caricaEnti() {
  if (!promessa) {
    promessa = import('./dati/enti.js').then((m) => indicizza(m.default));
  }
  return promessa;
}
