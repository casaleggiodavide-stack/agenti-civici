// «I fondi europei nel mio Comune»: i progetti del PNRR che riguardano un Comune, con quanto valgono,
// per tema, chi li realizza, a che punto sono e il confronto per abitante con i Comuni della stessa grandezza.
// Funzioni pure (niente DOM, niente rete): i dati li prepara scripts/progetti-comune-dati.py
// dagli open data di Italia Domani (ReGiS) e li passa l'interfaccia o il server MCP.

import { euroParole, numeroIt } from './comune/schede.js';

export const VERIFICATO = '2026-11-15';

/** Fonti dei dati e delle norme, lette il 15/11/2026. */
export const FONTI = {
  progetti: {
    titolo: 'Italia Domani, Catalogo Open Data: «Progetti del PNRR» (dati del sistema ReGiS), licenza CC BY 4.0',
    url: 'https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data/progetti-del-pnrr---missione-1.html',
  },
  localizzazione: {
    titolo: 'Italia Domani, Catalogo Open Data: «Localizzazione dei progetti del PNRR», licenza CC BY 4.0',
    url: 'https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data/localizzazione-dei-progetti-del-pnrr.html',
  },
  catalogo: { titolo: 'Italia Domani, Catalogo Open Data del PNRR', url: 'https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html' },
  opencup: { titolo: 'OpenCUP, Dipartimento per la programmazione e il coordinamento della politica economica: la scheda di ogni CUP', url: 'https://www.opencup.gov.it/' },
  opencoesione: { titolo: 'OpenCoesione: i progetti delle politiche di coesione in Italia', url: 'https://opencoesione.gov.it/it/' },
  istat: { titolo: 'ISTAT, popolazione residente al 1° gennaio 2025 (CC BY 4.0)', url: 'https://demo.istat.it/' },
  rrf: {
    titolo: 'Regolamento (UE) 2021/241 sul dispositivo per la ripresa e la resilienza, art. 18 par. 4 lettera i) (investimenti da completare entro il 31 agosto 2026) e art. 24 par. 1 (pagamenti entro il 31 dicembre 2026)',
    url: 'https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:02021R0241-20240301',
  },
  tfue: {
    titolo: 'Trattato sul funzionamento dell\'Unione europea, art. 174 (coesione economica, sociale e territoriale)',
    url: 'https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:12016E174',
  },
  accesso: {
    titolo: 'Decreto legislativo 33/2013, art. 5 commi 2 e 4 (accesso civico generalizzato: gratuito, salvo il costo delle copie su supporto materiale)',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2013-03-14;33~art5',
  },
  cpr: {
    titolo: 'Regolamento (UE) 2021/1060 sui fondi della coesione, art. 49 par. 3 (elenco pubblico delle operazioni finanziate)',
    url: 'https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32021R1060',
  },
};

/** Le sette missioni del PNRR, con un nome breve per i grafici (Italia Domani, «Il Piano»). */
export const MISSIONI = {
  M1: { breve: 'Digitale, imprese, cultura e turismo', esteso: 'Digitalizzazione, innovazione, competitività, cultura e turismo' },
  M2: { breve: 'Ambiente ed energia', esteso: 'Rivoluzione verde e transizione ecologica' },
  M3: { breve: 'Ferrovie e porti', esteso: 'Infrastrutture per una mobilità sostenibile' },
  M4: { breve: 'Scuola, università e ricerca', esteso: 'Istruzione e ricerca' },
  M5: { breve: 'Lavoro, sociale e rigenerazione urbana', esteso: 'Inclusione e coesione' },
  M6: { breve: 'Sanità', esteso: 'Salute' },
  M7: { breve: 'Energia (REPowerEU)', esteso: 'REPowerEU' },
};

/**
 * Lo stato di un progetto. «Concluso» vale se la fonte dice Concluso (ReGiS lo attribuisce quando c'è la data
 * di fine effettiva), se c'è la data di fine effettiva o se il CUP è «Chiuso»: lo decide lo script dei dati.
 */
export const STATI = {
  c: { nome: 'Concluso', spiega: 'La fonte indica la data di fine effettiva o lo stato «Concluso».' },
  i: { nome: 'In corso', spiega: 'Il soggetto attuatore lo sta realizzando e aggiorna i dati.' },
  a: { nome: 'Da attivare', spiega: 'Registrato dall\'amministrazione titolare, non ancora affidato al soggetto attuatore.' },
  x: { nome: 'Stato non indicato', spiega: 'La fonte non indica lo stato.' },
};

export const normalizza = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
/** «2026-06-13» → «13 giugno 2026» (senza fusi orari). */
export function dataIt(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${Number(m[3])} ${MESI[Number(m[2]) - 1]} ${m[1]}` : '';
}
const isoDi = (d) => (typeof d === 'string' ? d.slice(0, 10) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);

/** Le fasce di abitanti, le stesse di «Il bilancio del mio Comune». */
export function fascia(pop) {
  if (!pop) return null;
  const limiti = [[1000, 'meno di 1.000'], [2000, 'da 1.000 a 2.000'], [5000, 'da 2.000 a 5.000'], [10000, 'da 5.000 a 10.000'], [20000, 'da 10.000 a 20.000'], [60000, 'da 20.000 a 60.000'], [100000, 'da 60.000 a 100.000'], [250000, 'da 100.000 a 250.000']];
  for (const [l, nome] of limiti) if (pop < l) return `${nome} abitanti`;
  return 'oltre 250.000 abitanti';
}

/** «meno di 1.000 abitanti» → «con meno di 1.000 abitanti», per scrivere «i Comuni con meno di…». */
export const comuniDellaFascia = (f) => (/^(meno|oltre)/.test(f || '') ? `con ${f}` : f || '');

/**
 * La regola del ritardo, e solo questa: un progetto è «oltre la data di fine prevista» se la fonte indica
 * una data di fine prevista, quella data è passata al momento dei dati e il progetto non risulta concluso.
 * Il riferimento è la data di estrazione dei dati, non oggi: dopo quella data la fonte non dice niente.
 */
export function oltreLaData(p, riferimento) {
  return !!(p.finePrevista && p.stato !== 'c' && p.finePrevista < isoDi(riferimento));
}

/** Prepara l'indice per la ricerca dal file dati/comuni.json. */
export function indicizza(elenco) {
  return {
    ...elenco,
    righe: elenco.comuni.map(([istat, nome, sigla, regione, pop, n, valore, fondiUe]) => ({ istat, nome, sigla, regione, pop, n, valore, fondiUe, k: normalizza(nome) })),
  };
}

/** I Comuni che corrispondono a quello che hai scritto: prima il nome esatto, poi chi comincia così. Accetta «Castro LE». */
export function cerca(indice, testo, limite = 8) {
  const idx = indice.righe ? indice : indicizza(indice);
  let t = normalizza(testo).replace(/^comune di /, '');
  if (!t) return [];
  let sigla = '';
  const m = t.match(/^(.*?)\s+([a-z]{2})$/);
  if (m && idx.righe.some((r) => r.sigla.toLowerCase() === m[2] && r.k.startsWith(m[1]))) { t = m[1]; sigla = m[2].toUpperCase(); }
  const punti = (r) => (r.k === t ? 3 : r.k.startsWith(t) ? 2 : r.k.includes(` ${t}`) ? 1 : r.k.includes(t) ? 0.5 : -1);
  return idx.righe
    .filter((r) => (!sigla || r.sigla === sigla) && punti(r) >= 0)
    .sort((a, b) => punti(b) - punti(a) || b.pop - a.pop || a.k.localeCompare(b.k))
    .slice(0, limite);
}

/** Confronto in parole con la mediana, con la stessa tolleranza del bilancio (15%). */
export function confronta(valore, mediana) {
  if (valore === null || valore === undefined || !mediana) return null;
  const r = valore / mediana;
  const f = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
  if (r > 1.45) return { tono: 'piu', parola: `circa ${f.format(r)} volte la mediana` };
  if (r > 1.15) return { tono: 'piu', parola: `il ${Math.round((r - 1) * 100)}% in più della mediana` };
  if (r < 0.85) return { tono: 'meno', parola: `il ${Math.round((1 - r) * 100)}% in meno della mediana` };
  return { tono: 'pari', parola: 'in linea con la mediana' };
}

const link = (cup) => `https://www.opencup.gov.it/portale/progetto/-/cup/${encodeURIComponent(cup)}`;

/** Una riga dei progetti più grandi, dal formato compatto del file della provincia. */
function progetto(riga, elenco, riferimento) {
  const [cup, titolo, totale, quota, pnrr, ue, missione, misura, stato, attuatore, inizioPrevista, inizioEffettiva, finePrevista, fineEffettiva, fase, nComuni] = riga;
  const p = {
    cup, titolo, totale, quota, pnrr, ue, missione, tema: MISSIONI[missione]?.breve || missione,
    misura: elenco.misure?.[misura] || misura, stato, statoNome: STATI[stato]?.nome || STATI.x.nome, attuatore,
    inizioPrevista, inizioEffettiva, finePrevista, fineEffettiva, fase: fase >= 0 ? (elenco.fasi?.[fase] || '') : '', nComuni,
    link: link(cup),
  };
  p.oltre = oltreLaData(p, riferimento);
  return p;
}

/**
 * La sintesi dei progetti per un Comune.
 * indice: { elenco: contenuto di dati/comuni.json, province: { SIGLA: contenuto di dati/p/SIGLA.json } }
 * oggi: per dire quanti progetti avevano la fine prevista tra la data dei dati e oggi (la fonte non dice ancora com'è andata).
 */
export function progettiComune(indice, istat, oggi = new Date()) {
  const elenco = indice.elenco;
  const riga = elenco.comuni.find((c) => c[0] === istat);
  if (!riga) return { trovato: false, istat };
  const [, nome, sigla, regione, pop] = riga;
  const base = { trovato: true, comune: { istat, nome, sigla, regione, pop }, estrazione: elenco.estrazione, versione: elenco.versione, aggiornato: elenco.aggiornato };
  const prov = indice.province?.[sigla];
  if (!prov) return { ...base, esito: 'serve_dato', motivo: `Mancano i dati della provincia ${sigla}.` };
  const s = prov[istat];
  const fasciaC = fascia(pop);
  const simili = fasciaC ? elenco.fasce[fasciaC] : null;
  if (!s) {
    return { ...base, esito: 'nessuno', n: 0, valore: 0, fondiUe: 0, perAbitante: pop ? 0 : null, fascia: fasciaC, mediana: simili?.mediana_pc ?? null, comuniFascia: simili?.comuni ?? null, confronto: null };
  }
  const rif = elenco.estrazione;
  const oggiIso = isoDi(oggi);
  const oltre = { n: 0, valore: 0, date: [] };
  const dopo = { n: 0, valore: 0 };
  for (const [d, n, v] of s.scad) {
    if (d < rif) { oltre.n += n; oltre.valore += v; oltre.date.push({ data: d, n, valore: v }); } else if (d < oggiIso) { dopo.n += n; dopo.valore += v; }
  }
  const fondiUe = s.pnrr + s.ue;
  const perAbitante = pop ? fondiUe / pop : null; // fondi europei (PNRR + altri fondi UE) per abitante
  return {
    ...base,
    esito: 'ok',
    n: s.n, valore: s.v, pnrr: s.pnrr, ue: s.ue, fondiUe, multi: s.multi,
    perAbitante, fascia: fasciaC, mediana: simili?.mediana_pc ?? null, comuniFascia: simili?.comuni ?? null,
    confronto: perAbitante !== null && simili ? confronta(perAbitante, simili.mediana_pc) : null,
    temi: s.temi.map(([m, n, v]) => ({ codice: m, nome: MISSIONI[m]?.breve || m, esteso: MISSIONI[m]?.esteso || m, n, valore: v, su100: s.v ? (100 * v) / s.v : 0 })),
    stati: ['c', 'i', 'a', 'x'].filter((k) => s.stati[k]).map((k) => ({ codice: k, nome: STATI[k].nome, spiega: STATI[k].spiega, n: s.stati[k][0], valore: s.stati[k][1] })),
    oltre, dopo, senzaData: s.senza_data,
    attuatori: s.att.map(([nomeA, n, v]) => ({ nome: nomeA, n, valore: v })),
    altriAttuatori: { n: s.att_altri[0], valore: s.att_altri[1] },
    progetti: s.top.map((r) => progetto(r, elenco, rif)),
  };
}

const mln = (v) => euroParole(v).replace(' di euro', '');

/** Il testo della sintesi, per l'assistente e il server MCP. */
export function testo(s) {
  if (!s.trovato) return `Comune non trovato (codice ISTAT ${s.istat}).`;
  const c = s.comune;
  const righe = [`${c.nome} (${c.sigla}), ${c.regione}: progetti finanziati con il PNRR localizzati nel Comune, dati ReGiS al ${dataIt(s.estrazione)}.`];
  if (s.esito === 'serve_dato') return `${righe[0]}\nServe un dato: ${s.motivo}`;
  if (s.esito === 'nessuno') return `${righe[0]}\nLa fonte non localizza nel Comune nessun progetto con fondi del PNRR o di altri fondi europei.`;
  righe.push(`${numeroIt(s.n)} progetti per ${euroParole(s.valore)} attribuiti al Comune (di cui ${euroParole(s.pnrr)} dal PNRR${s.ue ? ` e ${euroParole(s.ue)} da altri fondi europei` : ''}).`);
  if (s.multi) righe.push(`${numeroIt(s.multi)} ${s.multi === 1 ? 'progetto riguarda' : 'progetti riguardano'} anche altri Comuni: si conta solo la parte attribuita a questo Comune dalla percentuale di localizzazione.`);
  if (s.perAbitante !== null && s.mediana !== null) righe.push(`Fondi europei (PNRR e altri fondi UE) per abitante: ${numeroIt(Math.round(s.perAbitante))} euro; mediana dei ${numeroIt(s.comuniFascia)} Comuni ${comuniDellaFascia(s.fascia)}: ${numeroIt(s.mediana)} euro (${s.confronto?.parola || 'confronto non disponibile'}).`);
  righe.push('Per tema (missione del PNRR): ' + s.temi.map((t) => `${t.nome} ${numeroIt(t.n)} ${t.n === 1 ? 'progetto' : 'progetti'}, ${mln(t.valore)}`).join('; ') + '.');
  righe.push('Stato: ' + s.stati.map((t) => `${t.nome.toLowerCase()} ${numeroIt(t.n)}`).join(', ') + '.');
  if (s.oltre.n) {
    const d = s.oltre.date.slice().sort((a, b) => b.n - a.n).slice(0, 3).map((x) => `${numeroIt(x.n)} con fine prevista il ${dataIt(x.data)}`).join(', ');
    righe.push(`Al ${dataIt(s.estrazione)} ${numeroIt(s.oltre.n)} ${s.oltre.n === 1 ? 'progetto aveva' : 'progetti avevano'} superato la data di fine prevista indicata dalla fonte e non ${s.oltre.n === 1 ? 'risultava concluso' : 'risultavano conclusi'} (${d}${s.oltre.date.length > 3 ? ', e altri' : ''}).`);
  } else righe.push(`Al ${dataIt(s.estrazione)} nessun progetto aveva superato la data di fine prevista senza risultare concluso.`);
  if (s.dopo.n) righe.push(`${numeroIt(s.dopo.n)} ${s.dopo.n === 1 ? 'progetto aveva' : 'progetti avevano'} la fine prevista tra il ${dataIt(s.estrazione)} e oggi: i dati non dicono ancora se ${s.dopo.n === 1 ? 'è concluso' : 'sono conclusi'}.`);
  righe.push('Chi li realizza (soggetti attuatori): ' + s.attuatori.slice(0, 5).map((a) => `${a.nome} (${numeroIt(a.n)}, ${mln(a.valore)})`).join('; ') + '.');
  righe.push('I più grandi:');
  for (const p of s.progetti.slice(0, 10)) {
    righe.push(`- ${p.titolo} (${p.misura}) — ${euroParole(p.quota)}${p.nComuni > 1 ? ` (parte di un progetto da ${euroParole(p.totale)} su ${p.nComuni} Comuni)` : ''}; ${p.statoNome.toLowerCase()}${p.finePrevista ? `, fine prevista ${dataIt(p.finePrevista)}` : ''}${p.fineEffettiva ? `, conclusa il ${dataIt(p.fineEffettiva)}` : ''}${p.oltre ? ' (oltre la data di fine prevista)' : ''}; attuatore ${p.attuatore}; CUP ${p.cup}, ${p.link}`);
  }
  righe.push(`Fonte: ${FONTI.progetti.url} e ${FONTI.localizzazione.url} (CC BY 4.0). Per gli atti di un progetto si può chiedere l'accesso civico al soggetto attuatore indicando il CUP.`);
  return righe.join('\n');
}

/** Il riquadro per «Per te» (gruppo «Come va il tuo Comune»). */
export function riquadroPerTe(s) {
  if (!s?.trovato || s.esito === 'serve_dato') return null;
  const azioni = [{ strumento: 'progetti-comune', ancora: `istat=${s.comune.istat}`, testo: 'Vedi i progetti' }];
  const fonte = `Italia Domani, open data del PNRR (ReGiS) al ${dataIt(s.estrazione)}`;
  if (s.esito === 'nessuno') return { id: 'fondi-ue', gruppo: 'comune', etichetta: 'Fondi europei', titolo: 'Nessun progetto PNRR localizzato nel Comune', testo: '', tono: null, azioni, fonte };
  const righe = [];
  if (s.perAbitante !== null && s.mediana !== null) righe.push(`${numeroIt(Math.round(s.perAbitante))} euro di fondi europei per abitante; nei Comuni ${comuniDellaFascia(s.fascia)} la mediana è ${numeroIt(s.mediana)} euro.`);
  if (s.oltre.n) righe.push(`${s.oltre.n === 1 ? 'Un progetto era' : `${numeroIt(s.oltre.n)} progetti erano`} oltre la data di fine prevista senza risultare ${s.oltre.n === 1 ? 'concluso' : 'conclusi'} al ${dataIt(s.estrazione)}.`);
  return {
    id: 'fondi-ue', gruppo: 'comune', etichetta: 'Fondi europei',
    titolo: `${numeroIt(s.n)} ${s.n === 1 ? 'progetto' : 'progetti'}, ${euroParole(s.valore)}${s.oltre.n ? `; ${numeroIt(s.oltre.n)} oltre la data di fine prevista` : ''}`,
    testo: righe.join(' '), tono: null, azioni, fonte,
  };
}
