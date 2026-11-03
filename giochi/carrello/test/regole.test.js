import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NEGOZI, CASI, NORME } from '../src/negozi.js';
import { nuovoNegozio, tocca, conto, esiti, punti, trappole, testoCondivisione } from '../src/regole.js';

const decisioni = JSON.parse(readFileSync(new URL('../../../legge/antitrust/dati/decisioni.json', import.meta.url), 'utf8'));
const sintesi = JSON.parse(readFileSync(new URL('../../../legge/antitrust/dati/sintesi.json', import.meta.url), 'utf8'));
const idTrappole = new Set(sintesi.trappole.map((t) => t.id));

test('ogni caso citato è una decisione vera del dossier Antitrust, con lo stesso importo e lo stesso bollettino', () => {
  for (const [codice, c] of Object.entries(CASI)) {
    const d = decisioni.find((x) => x.codice === codice);
    assert.ok(d, `${codice} non c'è nel dossier`);
    assert.equal(d.euro, c.euro, `${codice}: importo`);
    assert.equal(d.url, c.url, `${codice}: bollettino`);
    assert.ok(d.imprese.some((i) => i.toLowerCase().includes(c.impresa.toLowerCase().split(' ')[0])), `${codice}: impresa ${c.impresa}`);
  }
});

test('ogni trappola ha un tipo del dossier, un caso, una norma e una spiegazione breve', () => {
  for (const n of NEGOZI) {
    assert.ok(trappole(n).length >= 4, `${n.id}: poche trappole`);
    assert.ok(n.elementi.some((e) => !e.trappola), `${n.id}: nessun elemento innocuo`);
    assert.ok(n.dominio.endsWith('.esempio'), `${n.id}: il dominio deve essere finto`);
    for (const e of n.elementi) {
      assert.ok(e.spiega && e.spiega.length <= 160, `${n.id}/${e.id}: spiegazione`);
      if (!e.trappola) continue;
      assert.ok(idTrappole.has(e.trappola), `${n.id}/${e.id}: trappola ${e.trappola}`);
      assert.ok(CASI[e.caso], `${n.id}/${e.id}: caso ${e.caso}`);
      assert.ok(NORME[e.norma], `${n.id}/${e.id}: norma ${e.norma}`);
    }
  }
});

test('toccare, togliere, scegliere', () => {
  const n = NEGOZI[0];
  let s = nuovoNegozio(n), r;
  [s, r] = tocca(s, n.elementi.find((e) => e.id === 'barrato')); assert.equal(r, 'scoperta');
  [s, r] = tocca(s, n.elementi.find((e) => e.id === 'spedizione')); assert.equal(r, 'falso');
  [s, r] = tocca(s, n.elementi.find((e) => e.id === 'protezione')); assert.equal(r, 'tolta');
  assert.equal(s.caselle.protezione, false);
  const v = NEGOZI[1];
  let t = nuovoNegozio(v);
  [t, r] = tocca(t, v.elementi.find((e) => e.id === 'premium'), 'grande'); assert.equal(r, 'caduto');
  assert.equal(conto(v, t).abbonamento, 69.99);
});

test('il conto: prezzo, aggiunte spuntate e costi; quanto è finito in trappole', () => {
  const n = NEGOZI[0];
  const s = nuovoNegozio(n);
  assert.deepEqual(conto(n, s), { totale: 49.7, inPiu: 9.8, abbonamento: 0 });
  const [t] = tocca(s, n.elementi.find((e) => e.id === 'protezione'));
  assert.equal(conto(n, t).inPiu, 2.9);
});

test('esiti e punti', () => {
  const n = NEGOZI[0];
  let s = nuovoNegozio(n);
  assert.deepEqual(esiti(n, s).map((x) => x.esito), ['sfuggita', 'sfuggita', 'caduto', 'caduto']);
  for (const id of ['barrato', 'timer', 'protezione', 'gestione']) [s] = tocca(s, n.elementi.find((e) => e.id === id));
  assert.deepEqual(esiti(n, s).map((x) => x.esito), ['scoperta', 'scoperta', 'evitata', 'scoperta']);
  assert.equal(punti(n, s, 20), 40 + 10);
  assert.equal(punti(n, nuovoNegozio(n), 40), 0); // nessuna trappola vista: niente premio per la velocità
  assert.match(testoCondivisione(10, 15, 3.5), /3,50 € in più/);
});
