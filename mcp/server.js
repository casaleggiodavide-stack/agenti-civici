#!/usr/bin/env node
// Server MCP di «Mi spetta», senza dipendenze.
// Permette a un assistente (Claude, ChatGPT, altri agenti) di usare le
// stesse regole del sito invece di indovinare a quali bonus ha diritto una
// persona. Protocollo: JSON-RPC 2.0 su stdio, un messaggio per riga.

import { createInterface } from 'node:readline';
import { valuta, PRESTAZIONI } from '../src/motore.js';
import { DOMANDE, CONDIZIONI_18_21 } from '../src/situazione.js';

const INFO = { name: 'mi-spetta', version: '0.1.0' };

function schemaRisposte() {
  const properties = {};
  for (const d of DOMANDE) {
    let p;
    if (d.tipo === 'numero' || d.tipo === 'euro') p = { type: 'number' };
    else if (d.tipo === 'si_no') p = { type: 'boolean' };
    else if (d.tipo === 'scelta') p = { type: 'string', enum: d.opzioni.map((o) => o[0]) };
    else if (d.tipo === 'figli') {
      p = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nascita: { type: 'string', description: 'Mese di nascita, formato AAAA-MM' },
            disabile: { type: 'boolean' },
            condizione: { type: 'string', enum: CONDIZIONI_18_21.map((c) => c[0]), description: 'Solo per figli tra 18 e 21 anni' },
          },
          required: ['nascita'],
        },
      };
    }
    p.description = d.etichetta + (d.aiuto ? ' ' + d.aiuto : '');
    properties[d.id] = p;
  }
  return { type: 'object', properties, additionalProperties: false };
}

const TOOLS = [
  {
    name: 'valuta_prestazioni',
    description:
      'Calcola a quali bonus e prestazioni pubbliche italiane (INPS, Comuni, ARERA, fisco) una persona ha diritto, con importo stimato, requisiti verificati uno per uno, dati mancanti, come fare domanda e fonte ufficiale. Le regole sono deterministiche e citate: usa questo strumento invece di rispondere a memoria. Tutti i campi sono facoltativi; quelli mancanti vengono restituiti come "mancano".',
    inputSchema: schemaRisposte(),
  },
  {
    name: 'elenca_prestazioni',
    description: 'Elenca le prestazioni coperte da Mi spetta, con ente, sintesi e fonti ufficiali.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'domande',
    description: 'Restituisce le domande del questionario di Mi spetta, da porre alla persona in linguaggio semplice.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function testoRisultato(v) {
  const righe = [`Valutazione al ${v.oggi}. Totale annuo stimato delle prestazioni che spettano: ${v.totaleAnnuoStimato} euro.`];
  for (const r of v.risultati) {
    righe.push(`\n## ${r.nome} (${r.ente}) — ${r.etichetta}`);
    if (r.importo && r.importo.testo) righe.push(`Importo: ${r.importo.testo}`);
    for (const q of r.requisiti) righe.push(`- [${q.ok === true ? 'sì' : q.ok === false ? 'no' : '?'}] ${q.testo}`);
    if (r.mancano.length) righe.push(`Dati mancanti: ${r.mancano.join(', ')}`);
    if (r.esito !== 'non_spetta' && r.come) righe.push(`Come fare: ${r.come.testo} ${r.come.link || ''}`);
    righe.push(`Fonte: ${r.fonti.map((f) => f.url).join(' ; ')}`);
  }
  righe.push('\nAvvertenza: stima informativa basata sulle regole pubbliche; decide sempre l\'ente erogatore. Non è un parere legale o fiscale.');
  return righe.join('\n');
}

function chiama(nome, args) {
  if (nome === 'valuta_prestazioni') {
    const v = valuta(args || {});
    return { content: [{ type: 'text', text: testoRisultato(v) }], structuredContent: v };
  }
  if (nome === 'elenca_prestazioni') {
    const elenco = PRESTAZIONI.map((p) => ({ id: p.id, nome: p.nome, ente: p.ente, sintesi: p.sintesi, fonti: p.fonti }));
    return { content: [{ type: 'text', text: JSON.stringify(elenco, null, 2) }] };
  }
  if (nome === 'domande') {
    const d = DOMANDE.map(({ id, sezione, tipo, etichetta, aiuto, opzioni }) => ({ id, sezione, tipo, etichetta, aiuto, opzioni }));
    return { content: [{ type: 'text', text: JSON.stringify(d, null, 2) }] };
  }
  throw Object.assign(new Error('Strumento sconosciuto: ' + nome), { code: -32602 });
}

function rispondi(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function errore(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

const rl = createInterface({ input: process.stdin });
rl.on('line', (riga) => {
  if (!riga.trim()) return;
  let msg;
  try {
    msg = JSON.parse(riga);
  } catch {
    return errore(null, -32700, 'JSON non valido');
  }
  const { id, method, params } = msg;
  const isNotifica = id === undefined || id === null;
  try {
    if (method === 'initialize') {
      return rispondi(id, {
        protocolVersion: params?.protocolVersion || '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: INFO,
        instructions: 'Usa valuta_prestazioni per sapere a quali bonus italiani ha diritto una persona. Chiedi prima i dati con lo strumento domande. Riporta sempre la fonte e ricorda che decide l\'ente.',
      });
    }
    if (method === 'ping') return rispondi(id, {});
    if (method === 'tools/list') return rispondi(id, { tools: TOOLS });
    if (method === 'tools/call') return rispondi(id, chiama(params.name, params.arguments));
    if (isNotifica) return;
    return errore(id, -32601, 'Metodo non supportato: ' + method);
  } catch (e) {
    if (!isNotifica) errore(id, e.code || -32603, e.message);
  }
});
