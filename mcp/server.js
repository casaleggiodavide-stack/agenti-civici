#!/usr/bin/env node
// Server MCP degli agenti civici su stdio (un messaggio JSON-RPC per riga),
// per Claude Desktop, Claude Code e gli altri client locali. Le regole sono in
// nucleo.js; per l'uso via internet c'è http.js.
import { createInterface } from 'node:readline';
import { gestisci } from './nucleo.js';

createInterface({ input: process.stdin }).on('line', (riga) => {
  if (!riga.trim()) return;
  let msg;
  try { msg = JSON.parse(riga); } catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON non valido' } }) + '\n'); return; }
  const r = gestisci(msg);
  if (r) process.stdout.write(JSON.stringify(r) + '\n');
});
