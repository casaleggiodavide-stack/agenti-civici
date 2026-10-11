// Prova il server MCP come lo userebbe un assistente: avvio, elenco strumenti, chiamate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

function sessione(messaggi) {
  return new Promise((ok, ko) => {
    const p = spawn(process.execPath, [new URL('../server.js', import.meta.url).pathname]);
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.on('error', ko);
    p.on('close', () => ok(out.trim().split('\n').map((l) => JSON.parse(l))));
    for (const m of messaggi) p.stdin.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
    p.stdin.end();
  });
}

test('server MCP: quattro strumenti, risposte con fonti e documenti', async () => {
  const [init, lista, multa, ente, atti] = await sessione([
    { id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } },
    { method: 'notifications/initialized' },
    { id: 2, method: 'tools/list' },
    { id: 3, method: 'tools/call', params: { name: 'valuta_multa', arguments: { tipo: 'semaforo', data_violazione: '2026-04-02', modo: 'posta', data_notifica: '2026-09-20', data_spedizione: '2026-07-10', veicolo_tuo: true, provincia: 'NA', documento: 'prefetto', oggi: '2026-10-11' } } },
    { id: 4, method: 'tools/call', params: { name: 'cerca_ente', arguments: { testo: 'asl roma 1' } } },
    { id: 5, method: 'tools/call', params: { name: 'prepara_accesso_atti', arguments: { cosa: 'Elenco delle consulenze affidate nel 2025 con importo e affidatario', ente_nome: 'Comune di Lecce', oggi: '2026-10-11' } } },
  ]);
  assert.equal(init.result.serverInfo.name, 'agenti-civici');
  assert.deepEqual(lista.result.tools.map((t) => t.name), ['valuta_prestazioni', 'valuta_multa', 'cerca_ente', 'prepara_accesso_atti']);
  const tm = multa.result.content[0].text;
  assert.match(tm, /Verbale spedito dopo 99 giorni/);
  assert.match(tm, /protocollo\.prefna@pec\.interno\.it/);
  assert.match(tm, /art\. 201, comma 5/);
  assert.match(tm, /\[nome e cognome\]/);
  assert.match(ente.result.content[0].text, /Azienda Sanitaria Locale Roma 1/);
  const ta = atti.result.content[0].text;
  assert.match(ta, /Comune di Lecce/);
  assert.match(ta, /art\. 5, comma 2/);
});
