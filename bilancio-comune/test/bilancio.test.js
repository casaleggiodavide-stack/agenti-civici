// Il bilancio del mio Comune: controlli sui conti e integrità dei dati pubblicati.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { controlli, ripartizione, entrate, FONTI, MISSIONI } from '../src/spiegazioni.js';

const dati = (p) => JSON.parse(readFileSync(new URL(`../dati/${p}`, import.meta.url), 'utf8'));
const { comuni } = dati('comuni.json');
const conf = dati('confronto.json');
const scheda = (istat) => { const c = comuni.find((x) => x.istat === istat); return dati(`p/${c.sigla}.json`)[istat]; };

test('tutti i Comuni dell\'elenco hanno la loro scheda e la popolazione', () => {
  assert.ok(comuni.length > 7500, String(comuni.length));
  const file = new Set(comuni.map((c) => c.sigla));
  for (const f of file) assert.ok(existsSync(new URL(`../dati/p/${f}.json`, import.meta.url)), f);
  assert.equal(comuni.filter((c) => !c.pop).length, 0);
});

test('Termoli 2025: indicatori uguali a quelli trasmessi alla BDAP', () => {
  const s = scheda('070078');
  assert.equal(s.anno, 2025);
  assert.equal(s.pdi.tempestivita, -16);
  assert.equal(s.pdi.debito_pc, 312.44);
  assert.equal(s.deficitario, false);
  const c = controlli(s, conf.fasce[s.fascia]);
  assert.equal(c.find((x) => x.id === 'pagamenti').tono, 'si');
  assert.match(c.find((x) => x.id === 'pagamenti').titolo, /16 giorni prima/);
});

test('un disavanzo accende il controllo rosso, un ente deficitario anche', () => {
  const base = { anno: 2025, pop: 10000, pdi: {}, risultato: { libera: -500000 }, deficitario: true, parametri: ['Indicatore 1.1 maggiore del 48%'] };
  const c = controlli(base, null);
  assert.equal(c.find((x) => x.id === 'disavanzo').tono, 'no');
  assert.match(c.find((x) => x.id === 'disavanzo').titolo, /50 € per abitante/);
  assert.equal(c.find((x) => x.id === 'deficitario').tono, 'no');
});

test('la ripartizione esclude partite di giro e somma a 100', () => {
  const s = scheda('037006');
  const r = ripartizione(s, conf.fasce[s.fascia]);
  assert.ok(!r.righe.some((x) => x.missione === '99' || x.missione === '60'));
  const somma = r.righe.reduce((a, x) => a + x.su100, 0);
  assert.ok(somma > 99 && somma <= 100.5, String(somma));
  assert.ok(entrate(s).righe.length >= 4);
});

test('ogni missione ha un nome e ogni fonte è un indirizzo https', () => {
  for (const [k, [nome]] of Object.entries(MISSIONI)) assert.ok(nome, k);
  for (const f of Object.values(FONTI)) assert.match(f.url, /^https:\/\//);
});
