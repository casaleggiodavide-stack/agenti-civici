// Prova il server MCP come lo userebbe un assistente: avvio, elenco strumenti, chiamate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { gestisci } from '../nucleo.js';

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

test('server MCP: tredici strumenti, risposte con fonti e documenti', async () => {
  const [init, lista, multa, ente, atti] = await sessione([
    { id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } },
    { method: 'notifications/initialized' },
    { id: 2, method: 'tools/list' },
    { id: 3, method: 'tools/call', params: { name: 'valuta_multa', arguments: { tipo: 'semaforo', data_violazione: '2026-04-02', modo: 'posta', data_notifica: '2026-09-20', data_spedizione: '2026-07-10', veicolo_tuo: true, provincia: 'NA', documento: 'prefetto', oggi: '2026-10-11' } } },
    { id: 4, method: 'tools/call', params: { name: 'cerca_ente', arguments: { testo: 'asl roma 1' } } },
    { id: 5, method: 'tools/call', params: { name: 'prepara_accesso_atti', arguments: { cosa: 'Elenco delle consulenze affidate nel 2025 con importo e affidatario', ente_nome: 'Comune di Lecce', oggi: '2026-10-11' } } },
  ]);
  assert.equal(init.result.serverInfo.name, 'agenti-civici');
  assert.deepEqual(lista.result.tools.map((t) => t.name), ['valuta_reclamo', 'valuta_prestazioni', 'valuta_multa', 'cerca_ente', 'prepara_accesso_atti', 'search', 'fetch', 'bilancio_comune', 'appalti_ente', 'prepara_segnalazione', 'reclamo_pa', 'raccolte_firme', 'trova_pratica']);
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

test('tutti gli strumenti sono in sola lettura e hanno un titolo', async () => {
  const [, lista] = await sessione([{ id: 1, method: 'initialize', params: {} }, { id: 2, method: 'tools/list' }]);
  for (const t of lista.result.tools) {
    assert.ok(t.title, t.name);
    assert.equal(t.annotations.readOnlyHint, true, t.name);
  }
});

test('search e fetch: trovare e leggere una misura regionale', async () => {
  const [cerca] = await sessione([{ id: 1, method: 'tools/call', params: { name: 'search', arguments: { query: 'nido Toscana' } } }]);
  const { results } = JSON.parse(cerca.result.content[0].text);
  assert.equal(results[0].id, 'prestazione:toscana_nidi_gratis');
  const [leggi] = await sessione([{ id: 2, method: 'tools/call', params: { name: 'fetch', arguments: { id: results[0].id } } }]);
  const scheda = JSON.parse(leggi.result.content[0].text);
  assert.match(scheda.text, /Regione: Toscana/);
  assert.ok(scheda.url.startsWith('https://'));
  const [manca] = await sessione([{ id: 3, method: 'tools/call', params: { name: 'fetch', arguments: { id: 'prestazione:inventata' } } }]);
  assert.equal(manca.result.isError, true);
});

test('server MCP: bilancio di un Comune e segnali sugli appalti, con fonti', () => {
  const b = gestisci({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'bilancio_comune', arguments: { comune: 'Termoli' } } }).result;
  assert.match(b.content[0].text, /Comune di Termoli/);
  assert.match(b.content[0].text, /16 giorni prima/);
  assert.match(b.content[0].text, /openbdap\.rgs\.mef\.gov\.it/);
  const a = gestisci({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'appalti_ente', arguments: { cf: '80014890638' } } }).result;
  assert.match(a.content[0].text, /Comune di Napoli/);
  assert.match(a.content[0].text, /in house/);
  assert.match(a.content[0].text, /non sono illeciti/);
  const x = gestisci({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'bilancio_comune', arguments: { comune: 'Paperopoli' } } }).result;
  assert.equal(x.isError, true);
});

test('server MCP: trova_pratica risponde con passi e fonti, o dice che non ha la scheda', () => {
  const r = gestisci({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'trova_pratica', arguments: { domanda: 'devo rinnovare il passaporto' } } }).result;
  assert.match(r.content[0].text, /# Passaporto/);
  assert.match(r.content[0].text, /Fonti: .*https:\/\//);
  const n = gestisci({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'trova_pratica', arguments: { domanda: 'zzzz qwerty' } } }).result;
  assert.equal(n.structuredContent.trovata, false);
});

test('server MCP: segnalazione e reclamo alla PA con destinatari, scadenze e lettera', () => {
  const s = gestisci({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'prepara_segnalazione', arguments: { categoria: 'buca', strada: 'provinciale', comune: 'Lecce', luogo: 'SP 1' } } }).result;
  assert.match(s.content[0].text, /Provincia di Lecce/i);
  assert.match(s.content[0].text, /18-bis/);
  const r = gestisci({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'reclamo_pa', arguments: { problema: 'ritardo', data_domanda: '2026-06-03', ente_nome: 'Comune di Bari', oggi: '2026-10-25' } } }).result;
  assert.match(r.content[0].text, /potere sostitutivo/);
  assert.match(r.content[0].text, /2027-07-03/);
});
