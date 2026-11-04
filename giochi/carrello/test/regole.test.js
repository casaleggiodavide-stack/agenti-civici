import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NEGOZI, CASI, NORME } from '../src/negozi.js';
import { nuovoNegozio, tocca, conto, esiti, punti, trappole, testoCondivisione, stelle, perfetto, disponi, evitabile, medaglieGuadagnate, MEDAGLIE, SECONDI } from '../src/regole.js';
import { caso } from '../../comune/premi.js';

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
  const v = NEGOZI.find((x) => x.id === 'viaggio');
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
  assert.equal(punti(n, s, 20), 40 + 10 + 20); // tutte le trappole, nessun falso allarme: negozio perfetto
  assert.equal(stelle(n, s), 3);
  assert.ok(perfetto(n, s));
  assert.equal(punti(n, nuovoNegozio(n), 40), 0); // nessuna trappola vista: niente premio per la velocità
  assert.match(testoCondivisione(10, 15, 3.5), /3,50 € in più/);
});

test('dal più facile al più difficile: più trappole e meno tempo', () => {
  assert.deepEqual(NEGOZI.map((n) => n.id), ['casa', 'tech', 'viaggio']);
  for (let i = 1; i < NEGOZI.length; i++) {
    assert.ok(trappole(NEGOZI[i]).length >= trappole(NEGOZI[i - 1]).length, `${NEGOZI[i].id}: meno trappole del precedente`);
    assert.ok(SECONDI[i] < SECONDI[i - 1], 'il tempo deve scendere');
  }
});

test('stelle, falsi allarmi e medaglie', () => {
  const n = NEGOZI[0];
  let s = nuovoNegozio(n);
  assert.equal(stelle(n, s), 0);
  for (const id of ['barrato', 'timer', 'protezione', 'gestione', 'spedizione']) [s] = tocca(s, n.elementi.find((e) => e.id === id));
  assert.equal(stelle(n, s), 2); // tutte trovate ma con un falso allarme: niente perfetto
  assert.equal(evitabile(n, s), 0);
  assert.equal(evitabile(n, nuovoNegozio(n)), 6.9);
  const tre = { stelle: 3, inPiu: 0, abbonamento: 0, falsi: 0, restaFrazione: 0.6 };
  assert.deepEqual(medaglieGuadagnate([tre, tre, tre]).sort(), Object.keys(MEDAGLIE).sort());
  assert.deepEqual(medaglieGuadagnate([{ stelle: 1, inPiu: 3, abbonamento: 0, falsi: 1, restaFrazione: 0 }]), ['prima']);
});

test('la disposizione dipende solo dal seme e non perde elementi', () => {
  const a = disponi(NEGOZI[2], caso('x')), b = disponi(NEGOZI[2], caso('x'));
  assert.deepEqual(a.elementi.map((e) => e.id), b.elementi.map((e) => e.id));
  assert.deepEqual(a.elementi.map((e) => e.id).sort(), NEGOZI[2].elementi.map((e) => e.id).sort());
});
