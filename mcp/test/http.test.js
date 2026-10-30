// Il server via internet (Streamable HTTP senza stato), come lo chiamano i connettori remoti.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../http.js';

await new Promise((ok) => server.listen(0, ok));
const base = `http://127.0.0.1:${server.address().port}`;
after(() => server.close());

const post = (corpo) => fetch(`${base}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(corpo) });

test('initialize, tools/list e una chiamata via HTTP', async () => {
  const init = await (await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'prova', version: '1' } } })).json();
  assert.equal(init.result.serverInfo.name, 'agenti-civici');
  assert.match(init.result.instructions, /non sono pareri legali/i);
  const notifica = await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(notifica.status, 202);
  const lista = await (await post({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();
  assert.equal(lista.result.tools.length, 16);
  const treno = await (await post({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'valuta_reclamo', arguments: { caso: 'treno', ritardo_minuti: 75, prezzo_treno: 40, causa_treno: 'guasto', oggi: '2026-10-25' } } })).json();
  assert.match(treno.result.content[0].text, /10 €/);
});

test('lotti, errori e pagine di servizio', async () => {
  const lotto = await (await post([{ jsonrpc: '2.0', id: 1, method: 'ping' }, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'inesistente' } }])).json();
  assert.equal(lotto.length, 2);
  assert.equal(lotto[1].error.code, -32602);
  const rotto = await fetch(`${base}/mcp`, { method: 'POST', body: '{non json' });
  assert.equal(rotto.status, 400);
  assert.equal((await fetch(`${base}/mcp`)).status, 405);
  assert.equal((await (await fetch(`${base}/salute`)).json()).ok, true);
  assert.match(await (await fetch(`${base}/`)).text(), /Il Polpo civico/);
});
