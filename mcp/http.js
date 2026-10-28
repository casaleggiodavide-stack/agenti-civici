#!/usr/bin/env node
// Server MCP dello Scrivano civico via internet (Streamable HTTP, senza stato),
// per i connettori remoti degli assistenti AI. Le regole sono in
// nucleo.js. Nessun dato viene salvato o registrato: niente log delle domande,
// niente cookie, niente sessioni. Uso: PORT=8080 node mcp/http.js
import { createServer } from 'node:http';
import { gestisci, INFO, TOOLS } from './nucleo.js';

const PORTA = Number(process.env.PORT || 8080);
const LIMITE_CORPO = 1_000_000;
const LIMITE_MINUTO = Number(process.env.LIMITE_MINUTO || 120);
const visite = new Map(); // ip -> [inizio minuto, richieste]

function troppe(ip) {
  const ora = Date.now();
  const v = visite.get(ip);
  if (!v || ora - v[0] > 60_000) { visite.set(ip, [ora, 1]); return false; }
  v[1] += 1;
  return v[1] > LIMITE_MINUTO;
}
setInterval(() => { const ora = Date.now(); for (const [ip, v] of visite) if (ora - v[0] > 60_000) visite.delete(ip); }, 60_000).unref();

const INTESTAZIONI = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id',
  'x-content-type-options': 'nosniff',
};

function invia(res, stato, corpo, tipo = 'application/json') {
  res.writeHead(stato, { ...INTESTAZIONI, 'content-type': `${tipo}; charset=utf-8`, 'cache-control': 'no-store' });
  res.end(typeof corpo === 'string' ? corpo : JSON.stringify(corpo));
}

const PAGINA = `Lo Scrivano civico, server MCP (${INFO.version})

Strumenti: ${TOOLS.map((t) => t.name).join(', ')}.
Indirizzo da aggiungere tra i connettori del tuo assistente AI: questo indirizzo seguito da /mcp
Codice e istruzioni: https://github.com/casaleggiodavide-stack/agenti-civici
Nessun dato viene salvato. Non sono pareri legali: decide sempre l'ente o il giudice.
`;

export const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, INTESTAZIONI); res.end(); return; }
  if (req.method === 'GET' && url.pathname === '/salute') return invia(res, 200, { ok: true, versione: INFO.version });
  if (req.method === 'GET' && url.pathname === '/') return invia(res, 200, PAGINA, 'text/plain');
  if (url.pathname !== '/mcp') return invia(res, 404, { error: 'non trovato' });
  if (req.method !== 'POST') { res.writeHead(405, { ...INTESTAZIONI, allow: 'POST' }); res.end(); return; }
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (troppe(ip)) return invia(res, 429, { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Troppe richieste: riprova tra un minuto' } });

  let corpo = '';
  let troppo = false;
  req.setEncoding('utf8');
  req.on('data', (c) => { corpo += c; if (corpo.length > LIMITE_CORPO) { troppo = true; req.destroy(); } });
  req.on('end', () => {
    if (troppo) return;
    let msg;
    try { msg = JSON.parse(corpo); } catch { return invia(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON non valido' } }); }
    const risposte = (Array.isArray(msg) ? msg : [msg]).map(gestisci).filter(Boolean);
    if (!risposte.length) { res.writeHead(202, INTESTAZIONI); res.end(); return; }
    invia(res, 200, Array.isArray(msg) ? risposte : risposte[0]);
  });
});

if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORTA, () => process.stderr.write(`Lo Scrivano civico MCP su http://localhost:${PORTA}/mcp\n`));
}
