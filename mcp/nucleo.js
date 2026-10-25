// Server MCP degli agenti civici, senza dipendenze: mette a disposizione di un
// assistente AI (Claude, ChatGPT, altri) le stesse regole dei tre strumenti,
// così risponde con norme e scadenze verificate invece che a memoria.
// Questo file è il nucleo, uguale per tutti i trasporti: server.js lo espone
// su stdio (Claude Desktop, Claude Code), http.js via internet (ChatGPT,
// connettori di claude.ai). Nessun dato viene salvato o registrato.

import { valuta as valutaPrestazioni, PRESTAZIONI } from '../mi-spetta/src/motore.js';
import { NOME_REGIONE } from '../mi-spetta/src/situazione.js';
import { DOMANDE as D_SPETTA, CONDIZIONI_18_21 } from '../mi-spetta/src/situazione.js';
import { valuta as valutaMulta } from '../faccio-ricorso/src/regole.js';
import { DOMANDE as D_MULTA } from '../faccio-ricorso/src/domande.js';
import { ricorsoPrefetto, ricorsoGiudiceDiPace } from '../faccio-ricorso/src/documento.js';
import { valuta as valutaAccesso } from '../chiedo-gli-atti/src/regole.js';
import { DOMANDE as D_ATTI } from '../chiedo-gli-atti/src/domande.js';
import { richiesta, riesame, ricorso, sostitutivo } from '../chiedo-gli-atti/src/documenti.js';
import { indicizza, cerca } from '../chiedo-gli-atti/src/enti.js';
import DATI_ENTI from '../chiedo-gli-atti/src/dati/enti.js';
import { valuta as valutaReclamo } from '../mi-rimborsano/src/regole.js';
import { DOMANDE as D_RECLAMI } from '../mi-rimborsano/src/domande.js';
import { lettera } from '../mi-rimborsano/src/documento.js';

export const INFO = { name: 'agenti-civici', title: 'Agenti civici', version: '0.4.0' };
const AVVERTENZA = 'Stima informativa basata su norme pubbliche verificate all\'11/10/2026: non è un parere legale. Decide sempre l\'ente o il giudice competente.';

let indiceEnti = null;
const enti = () => (indiceEnti ||= indicizza(DATI_ENTI));

/** Dalle domande di uno strumento allo schema JSON degli argomenti. */
function schema(domande, extra = {}) {
  const properties = {};
  for (const d of domande) {
    let p;
    if (d.tipo === 'numero' || d.tipo === 'euro') p = { type: 'number' };
    else if (d.tipo === 'si_no') p = { type: 'boolean' };
    else if (d.tipo === 'scelta' || d.tipo === 'elenco') p = { type: 'string', enum: d.opzioni.map((o) => o[0]) };
    else if (d.tipo === 'data') p = { type: 'string', description: 'Data AAAA-MM-GG' };
    else if (d.tipo === 'figli') p = { type: 'array', items: { type: 'object', properties: { nascita: { type: 'string', description: 'AAAA-MM' }, disabile: { type: 'boolean' }, condizione: { type: 'string', enum: CONDIZIONI_18_21.map((c) => c[0]) } }, required: ['nascita'] } };
    else p = { type: 'string' };
    p.description = [p.description, d.etichetta, d.aiuto].filter(Boolean).join('. ');
    properties[d.id] = p;
  }
  return { type: 'object', properties: { ...properties, ...extra } };
}

/** Dall'HTML dei documenti a testo semplice; i campi da completare tra [ ]. */
function testo(html) {
  return html
    .replace(/<span class="campo-vuoto">([^<]*)<\/span>/g, '[$1]')
    .replace(/<br\s*\/?>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<li>/g, '- ').replace(/<\/li>/g, '\n')
    .replace(/<[^>]+>/g, '').replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ').replace(/\n /g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export const TOOLS = [
  {
    name: 'valuta_reclamo',
    description: 'Mi rimborsano?: dice se spetta un rimborso, un indennizzo o una compensazione per volo in ritardo o cancellato (Reg. 261/2004), bagaglio (Montreal), treno (Reg. 2021/782), bolletta (prescrizione di due anni, ARERA), telefono e internet (indennizzi AGCOM), addebito bancario non autorizzato (d.lgs. 11/2010). Restituisce verdetto, importo, controlli, scadenze, passi e la lettera di messa in mora da completare. Il campo caso è obbligatorio; aeroporti con codice IATA.',
    inputSchema: { ...schema(D_RECLAMI, { oggi: { type: 'string', description: 'Data di riferimento AAAA-MM-GG' } }), required: ['caso'] },
  },
  {
    name: 'valuta_prestazioni',
    description: 'Mi spetta: a quali bonus e prestazioni pubbliche italiane (INPS, Comuni, ARERA, fisco) ha diritto una persona, con importo, requisiti, dati mancanti, come fare domanda e fonte ufficiale. Tutti i campi sono facoltativi.',
    inputSchema: schema(D_SPETTA),
  },
  {
    name: 'valuta_multa',
    description: 'Faccio ricorso?: controlla una multa stradale italiana. Restituisce verdetto, motivi oggettivi trovati (notifica oltre 90 giorni, autovelox non omologato, taratura, tolleranza, strisce blu, ZTL…), scadenze, confronto dei costi, Prefettura competente con PEC, e se richiesto il testo del ricorso al Prefetto o al Giudice di Pace da completare.',
    inputSchema: schema(D_MULTA, { documento: { type: 'string', enum: ['nessuno', 'prefetto', 'gdp'], description: 'Se indicato, restituisce anche il testo del ricorso' }, oggi: { type: 'string', description: 'Data di riferimento AAAA-MM-GG, se diversa da oggi' } }),
  },
  {
    name: 'cerca_ente',
    description: 'Chiedo gli atti: cerca un ente pubblico italiano nell\'Indice delle pubbliche amministrazioni (IndicePA) e ne restituisce nome, categoria, comune e PEC.',
    inputSchema: { type: 'object', properties: { testo: { type: 'string', description: 'Nome o parte del nome, anche sigle come ASL, INPS, ARPA' } }, required: ['testo'] },
  },
  {
    name: 'prepara_accesso_atti',
    description: 'Chiedo gli atti: sceglie il tipo di accesso (FOIA, accesso civico semplice, accesso documentale), controlla la richiesta, calcola le scadenze e prepara il documento (richiesta, riesame, ricorso al difensore civico o alla Commissione, potere sostitutivo). L\'ente si indica con ente_nome: viene cercato in IndicePA.',
    inputSchema: schema(D_ATTI, { ente_nome: { type: 'string', description: 'Nome dell\'ente, es. «Comune di Lecce»' }, documento: { type: 'string', enum: ['richiesta', 'riesame', 'ricorso', 'sostitutivo'] }, oggi: { type: 'string', description: 'Data di riferimento AAAA-MM-GG' } }),
  },
];

function rispostaPrestazioni(args) {
  const v = valutaPrestazioni(args || {});
  const righe = [`Valutazione al ${v.oggi}. Totale annuo stimato: ${v.totaleAnnuoStimato} euro.`];
  for (const r of v.risultati) {
    righe.push(`\n## ${r.nome} (${r.ente}): ${r.etichetta}`);
    if (r.importo?.testo) righe.push(`Importo: ${r.importo.testo}`);
    for (const q of r.requisiti) righe.push(`- [${q.ok === true ? 'sì' : q.ok === false ? 'no' : '?'}] ${q.testo}`);
    if (r.mancano.length) righe.push(`Dati mancanti: ${r.mancano.join(', ')}`);
    if (r.esito !== 'non_spetta' && r.come) righe.push(`Come fare: ${r.come.testo} ${r.come.link || ''}`);
    righe.push(`Fonte: ${r.fonti.map((f) => f.url).join(' ; ')}`);
  }
  righe.push('\n' + AVVERTENZA);
  return { content: [{ type: 'text', text: righe.join('\n') }], structuredContent: v };
}

function rispostaMulta(args = {}) {
  const { documento, oggi, ...r } = args;
  const v = valutaMulta(r, oggi ? { oggi } : {});
  const righe = [`# ${v.verdetto.titolo}`, v.verdetto.testo];
  if (v.motivi.length) {
    righe.push('\n## Controlli');
    for (const m of v.motivi) righe.push(`- ${m.titolo}: ${m.esito}${m.forza ? ` (${m.forza})` : ''}. ${m.spiegazione}`);
  }
  if (v.scadenze.length) {
    righe.push('\n## Scadenze');
    for (const s of v.scadenze) righe.push(`- ${s.data}: ${s.titolo}${s.scaduta ? ' (scaduta)' : ''}. ${s.testo}`);
  }
  if (v.costi) {
    righe.push('\n## Costi');
    for (const c of v.costi.righe) righe.push(`- ${c.strada}: ${c.costo} €${c.seRespinto ? `; se respinto ${c.id === 'gdp' ? 'fino a' : 'almeno'} ${c.seRespinto} €` : ''}. ${c.nota}`);
  }
  if (v.destinatari.prefetto) righe.push(`\nPrefettura competente: ${v.destinatari.prefetto.nome}, PEC ${v.destinatari.prefetto.pec}, ${v.destinatari.prefetto.indirizzo}`);
  if (documento === 'prefetto' || documento === 'gdp') righe.push('\n## Testo del ricorso\n' + testo(documento === 'gdp' ? ricorsoGiudiceDiPace(r, v) : ricorsoPrefetto(r, v)));
  righe.push('\nFonti: ' + v.fonti.map((f) => f.url).join(' ; '));
  righe.push(AVVERTENZA);
  return { content: [{ type: 'text', text: righe.join('\n') }], structuredContent: v };
}

function rispostaEnte({ testo: q } = {}) {
  const t = cerca(enti(), q || '', 8);
  return { content: [{ type: 'text', text: t.length ? t.map((e) => `- ${e.nome} (${e.categoria}${e.comune ? `, ${e.comune} ${e.prov}` : ''}): PEC ${e.pec}${e.sito ? `, sito ${e.sito}` : ''}`).join('\n') : 'Nessun ente trovato.' }], structuredContent: { enti: t } };
}

function rispostaAccesso(args = {}) {
  const { ente_nome: nomeEnte, documento = 'richiesta', oggi, ...r } = args;
  if (nomeEnte && !r.ente) r.ente = cerca(enti(), nomeEnte, 1)[0];
  const v = valutaAccesso(r, oggi ? { oggi } : {});
  const doc = { richiesta, riesame, ricorso, sostitutivo }[documento] || richiesta;
  const righe = [
    `# ${v.fase.titolo}`, v.fase.testo,
    `\nTipo di accesso: ${v.tipo.nome} (${v.tipo.norma}). ${v.tipo.perche}`,
    v.ente ? `Ente: ${v.ente.nome}, PEC ${v.ente.pec}. Destinatario: ${v.destinatario}.` : 'Ente non indicato o non trovato.',
    '\n## Controlli sulla richiesta', ...v.controlli.map((c) => `- [${c.livello}] ${c.testo}`),
    '\n## Come inviarla', ...v.invio.passi.map((p) => `- ${p}`),
  ];
  if (v.scadenze.length) righe.push('\n## Scadenze', ...v.scadenze.map((s) => `- ${s.data || '—'}: ${s.titolo}. ${s.testo}`));
  righe.push(`\n## Documento: ${documento}\n${testo(doc(r, v))}`);
  righe.push('\nFonti: ' + v.fonti.map((f) => f.url).join(' ; '), AVVERTENZA);
  return { content: [{ type: 'text', text: righe.join('\n') }], structuredContent: v };
}

function rispostaReclamo(args = {}) {
  const { oggi, ...r } = args;
  const v = valutaReclamo(r, oggi ? { oggi } : {});
  const righe = [`# ${v.verdetto.titolo}`, v.verdetto.testo];
  if (v.importo) righe.push(`Importo: ${v.importo.testo}`);
  if (v.voci.length) righe.push('\n## Controlli', ...v.voci.map((x) => `- [${x.esito}] ${x.titolo}: ${x.spiegazione}`));
  if (v.scadenze.length) righe.push('\n## Scadenze', ...v.scadenze.map((s) => `- ${s.data}${s.scaduta ? ' (passata)' : ''}: ${s.titolo}. ${s.testo}`));
  if (v.passi.length) righe.push('\n## Passi', ...v.passi.map((p) => `- ${p.titolo}: ${p.testo} ${p.link}`));
  if (v.documento) righe.push('\n## Lettera\n' + testo(lettera(r, v)));
  righe.push('\nFonti: ' + v.fonti.map((f) => f.url).join(' ; '));
  righe.push('Stima informativa basata su norme pubbliche verificate al 25/10/2026: non è un parere legale.');
  return { content: [{ type: 'text', text: righe.join('\n') }], structuredContent: v };
}

// ---------- search e fetch: le schede, per chi le vuole consultare ----------

const SITO = 'https://casaleggiodavide-stack.github.io/agenti-civici/';
const STRUMENTI_SCHEDE = [
  ['mi-spetta', 'Mi spetta', 'A quali bonus e prestazioni pubbliche hai diritto: 24 prestazioni nazionali e 67 misure regionali con le regole 2026, importi, requisiti, come chiederle e fonti. Strumento: valuta_prestazioni.'],
  ['faccio-ricorso', 'Faccio ricorso?', 'Controllo di una multa stradale: termini di notifica, autovelox e taratura, ZTL, strisce blu, costi del ricorso al Prefetto e al Giudice di Pace, PEC della Prefettura e ricorso da completare. Strumento: valuta_multa.'],
  ['chiedo-gli-atti', 'Chiedo gli atti', 'Accesso agli atti verso qualsiasi ente pubblico: FOIA, accesso civico semplice, accesso documentale; richiesta, riesame e ricorsi, scadenze, 23.705 enti con PEC da IndicePA. Strumenti: cerca_ente, prepara_accesso_atti.'],
  ['mi-rimborsano', 'Mi rimborsano?', 'Reclami e rimborsi: volo in ritardo o cancellato (Reg. 261/2004), bagaglio (Montreal), treno (Reg. 2021/782), bollette e prescrizione di due anni (ARERA), telefono e internet (indennizzi AGCOM), addebiti bancari non autorizzati (d.lgs. 11/2010). Strumento: valuta_reclamo.'],
];

const SCHEDE = [
  ...STRUMENTI_SCHEDE.map(([slug, titolo, testo]) => ({ id: `strumento:${slug}`, title: titolo, text: testo, url: `${SITO}${slug}/`, metadata: { tipo: 'strumento' } })),
  ...PRESTAZIONI.map((p) => ({
    id: `prestazione:${p.id}`,
    title: p.nome,
    text: [p.sintesi, p.regione ? `Regione: ${NOME_REGIONE[p.regione]}.` : 'Misura nazionale.', p.finestra?.testo ? `Quando: ${p.finestra.testo}` : '', p.come?.testo ? `Come chiederla: ${p.come.testo} ${p.come.link || ''}` : '', 'Fonti: ' + p.fonti.map((f) => `${f.titolo} (${f.url})`).join('; '), `Verificata il ${p.verificato}. Per sapere se spetta usa valuta_prestazioni.`].filter(Boolean).join('\n'),
    url: p.fonti[0]?.url || `${SITO}mi-spetta/`,
    metadata: { tipo: 'prestazione', ente: p.ente, regione: p.regione ? NOME_REGIONE[p.regione] : null, verificato: p.verificato },
  })),
];
const PER_ID = Object.fromEntries(SCHEDE.map((x) => [x.id, x]));
const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Ricerca semplice per parole: titolo pesa tre volte il testo. */
export function cercaSchede(query, quante = 10) {
  const parole = norm(query).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (!parole.length) return [];
  return SCHEDE.map((x) => {
    const t = norm(x.title);
    const c = norm(x.text);
    const punti = parole.reduce((n, w) => n + (t.includes(w) ? 3 : 0) + (c.includes(w) ? 1 : 0), 0);
    return { x, punti };
  }).filter((r) => r.punti > 0).sort((a, b) => b.punti - a.punti).slice(0, quante).map((r) => r.x);
}

function rispostaSearch({ query = '' } = {}) {
  const results = cercaSchede(query).map((x) => ({ id: x.id, title: x.title, url: x.url }));
  return { content: [{ type: 'text', text: JSON.stringify({ results }) }], structuredContent: { results } };
}

function rispostaFetch({ id = '' } = {}) {
  const x = PER_ID[id];
  if (!x) return { isError: true, content: [{ type: 'text', text: `Scheda non trovata: ${id}` }] };
  return { content: [{ type: 'text', text: JSON.stringify(x) }], structuredContent: x };
}

TOOLS.push(
  { name: 'search', title: 'Cerca nelle schede', description: 'Cerca tra le schede degli agenti civici: le 91 prestazioni pubbliche nazionali e regionali di Mi spetta e gli strumenti (multe, accesso agli atti, reclami). Restituisce id, titolo e link; poi usa fetch per leggere la scheda.', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Parole da cercare, es. «nido Toscana» o «assegno sociale»' } }, required: ['query'] } },
  { name: 'fetch', title: 'Leggi una scheda', description: 'Legge per intero una scheda trovata con search: sintesi, Regione, quando e come chiederla, fonti ufficiali e data di verifica.', inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Id restituito da search, es. prestazione:toscana_nidi_gratis' } }, required: ['id'] } },
);
const TITOLI = { valuta_reclamo: 'Mi rimborsano? Reclami e rimborsi', valuta_prestazioni: 'Mi spetta: bonus e prestazioni', valuta_multa: 'Faccio ricorso? Controllo della multa', cerca_ente: 'Cerca un ente pubblico', prepara_accesso_atti: 'Chiedo gli atti' };
for (const t of TOOLS) {
  t.title ||= TITOLI[t.name];
  t.annotations = { title: t.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
}

const GESTORI = { search: rispostaSearch, fetch: rispostaFetch, valuta_reclamo: rispostaReclamo, valuta_prestazioni: rispostaPrestazioni, valuta_multa: rispostaMulta, cerca_ente: rispostaEnte, prepara_accesso_atti: rispostaAccesso };


export const ISTRUZIONI = [
  'Strumenti civici italiani con regole verificate sulle fonti ufficiali: bonus e prestazioni nazionali e regionali (valuta_prestazioni), multe stradali (valuta_multa), accesso agli atti (cerca_ente, prepara_accesso_atti), reclami e rimborsi per voli, bagagli, treni, bollette, telefono e banche (valuta_reclamo); search e fetch per consultare le schede.',
  'Importi, soglie, termini e indirizzi vengono solo dai risultati degli strumenti: non usare la memoria per questi dati. Riporta sempre fonti e scadenze.',
  'Non chiedere e non trascrivere nome, codice fiscale, indirizzo o IBAN: i documenti restituiti hanno campi tra [ ] da completare a mano.',
  'Non sono pareri legali: decide sempre l\'ente o il giudice. Per i casi complessi indica un patronato, un CAF, un\'associazione di consumatori o un avvocato.',
].join(' ');

/** Gestisce un messaggio JSON-RPC; restituisce la risposta, o null per le notifiche. */
export function gestisci(msg) {
  const { id, method, params } = msg || {};
  const notifica = id === undefined || id === null;
  const risposta = (o) => (notifica ? null : { jsonrpc: '2.0', id, ...o });
  try {
    if (method === 'initialize') return risposta({ result: { protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: INFO, instructions: ISTRUZIONI } });
    if (method === 'ping') return risposta({ result: {} });
    if (method === 'tools/list') return risposta({ result: { tools: TOOLS } });
    if (method === 'tools/call') {
      const g = GESTORI[params?.name];
      if (!g) return risposta({ error: { code: -32602, message: 'Strumento sconosciuto: ' + params?.name } });
      return risposta({ result: g(params.arguments || {}) });
    }
    if (method?.startsWith('notifications/')) return null;
    return risposta({ error: { code: -32601, message: 'Metodo non supportato: ' + method } });
  } catch (e) {
    return risposta({ error: { code: -32603, message: e.message } });
  }
}
