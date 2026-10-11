#!/usr/bin/env node
// Server MCP degli agenti civici, senza dipendenze: mette a disposizione di un
// assistente AI (Claude, ChatGPT, altri) le stesse regole dei tre strumenti,
// così risponde con norme e scadenze verificate invece che a memoria.
// Protocollo: JSON-RPC 2.0 su stdio, un messaggio per riga.

import { createInterface } from 'node:readline';
import { valuta as valutaPrestazioni } from '../mi-spetta/src/motore.js';
import { DOMANDE as D_SPETTA, CONDIZIONI_18_21 } from '../mi-spetta/src/situazione.js';
import { valuta as valutaMulta } from '../faccio-ricorso/src/regole.js';
import { DOMANDE as D_MULTA } from '../faccio-ricorso/src/domande.js';
import { ricorsoPrefetto, ricorsoGiudiceDiPace } from '../faccio-ricorso/src/documento.js';
import { valuta as valutaAccesso } from '../chiedo-gli-atti/src/regole.js';
import { DOMANDE as D_ATTI } from '../chiedo-gli-atti/src/domande.js';
import { richiesta, riesame, ricorso, sostitutivo } from '../chiedo-gli-atti/src/documenti.js';
import { indicizza, cerca } from '../chiedo-gli-atti/src/enti.js';
import DATI_ENTI from '../chiedo-gli-atti/src/dati/enti.js';

const INFO = { name: 'agenti-civici', version: '0.2.0' };
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

const TOOLS = [
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

const GESTORI = { valuta_prestazioni: rispostaPrestazioni, valuta_multa: rispostaMulta, cerca_ente: rispostaEnte, prepara_accesso_atti: rispostaAccesso };

const scrivi = (o) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...o }) + '\n');
createInterface({ input: process.stdin }).on('line', (riga) => {
  if (!riga.trim()) return;
  let msg;
  try { msg = JSON.parse(riga); } catch { return scrivi({ id: null, error: { code: -32700, message: 'JSON non valido' } }); }
  const { id, method, params } = msg;
  const notifica = id === undefined || id === null;
  try {
    if (method === 'initialize') {
      return scrivi({ id, result: { protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: INFO, instructions: 'Strumenti civici italiani con regole verificate: bonus e prestazioni (valuta_prestazioni), multe stradali (valuta_multa), accesso agli atti (cerca_ente, prepara_accesso_atti). Riporta sempre fonti e scadenze, e ricorda che non sono pareri legali.' } });
    }
    if (method === 'ping') return scrivi({ id, result: {} });
    if (method === 'tools/list') return scrivi({ id, result: { tools: TOOLS } });
    if (method === 'tools/call') {
      const g = GESTORI[params?.name];
      if (!g) return scrivi({ id, error: { code: -32602, message: 'Strumento sconosciuto: ' + params?.name } });
      return scrivi({ id, result: g(params.arguments || {}) });
    }
    if (!notifica) scrivi({ id, error: { code: -32601, message: 'Metodo non supportato: ' + method } });
  } catch (e) {
    if (!notifica) scrivi({ id, error: { code: -32603, message: e.message } });
  }
});
