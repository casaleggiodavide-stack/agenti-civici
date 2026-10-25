// Red flag sugli appalti: livelli dei segnali e integrità dei dati pubblicati.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { livello, INDICATORI, FONTI, procedure, richiestaAtti } from '../src/indicatori.js';

const dati = (p) => JSON.parse(readFileSync(new URL(`../dati/${p}`, import.meta.url), 'utf8'));
const indice = dati('indice.json');

test('l\'indice punta a file esistenti e contiene i grandi Comuni', () => {
  assert.ok(indice.enti.length > 15000);
  for (const f of new Set(indice.enti.map((e) => e[4]))) assert.ok(existsSync(new URL(`../dati/p/${f}.json`, import.meta.url)), f);
  for (const cf of ['02438750586', '80014890638', '01199250158']) assert.ok(indice.enti.some((e) => e[1] === cf), cf);
});

test('un segnale si accende solo sopra il 75° percentile e sopra la mediana', () => {
  assert.equal(livello('un_offerente', { quota: 60, pct: 92, mediana: 40 }), 'alto');
  assert.equal(livello('un_offerente', { quota: 50, pct: 80, mediana: 40 }), 'medio');
  assert.equal(livello('un_offerente', { quota: 40, pct: 60, mediana: 40 }), 'normale');
  assert.equal(livello('tempi_brevi', { quota: 0, pct: 80, mediana: 0 }), 'normale', 'zero non è mai un segnale');
  assert.equal(livello('un_offerente', undefined), 'pochi');
  assert.equal(livello('cumulo', { n: 2 }), 'basso');
  assert.equal(livello('cumulo', { n: 0 }), 'normale');
});

test('Napoli: in house separato dagli affidamenti diretti, nessun nome di persona fisica', () => {
  const s = dati('p/NA.json')['80014890638'];
  const p = procedure(s);
  assert.ok(p.find((x) => x.id === 'in_house').v > 100e6);
  const testo = JSON.stringify(s);
  assert.doesNotMatch(testo, /"fornitore":"[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]"/);
  assert.match(richiestaAtti(s, s.piu_grandi[0]), /art\. 5, comma 2, del d\.lgs\. 33\/2013/);
});

test('ogni indicatore ha fonti esistenti e https', () => {
  for (const i of INDICATORI) for (const f of i.fonti) assert.match(FONTI[f]?.url || '', /^https:\/\//, `${i.id}: ${f}`);
});
