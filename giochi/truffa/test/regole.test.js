import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MESSAGGI, FONTI } from '../src/messaggi.js';
import { scegliPartita, giusto, punti, nuovoStato, segna, finita, PER_PARTITA, VITE } from '../src/regole.js';
import { analizza } from '../../../truffe/src/segnali.js';

test('i messaggi sono completi, con fonte e spiegazione breve', () => {
  const ids = new Set();
  for (const m of MESSAGGI) {
    assert.ok(!ids.has(m.id), `id doppio ${m.id}`); ids.add(m.id);
    assert.ok(['sms', 'whatsapp', 'email', 'telefonata', 'sito', 'social'].includes(m.canale), m.id);
    assert.ok([1, 2, 3].includes(m.livello), m.id);
    assert.ok(m.testo.length <= 200, `${m.id}: testo di ${m.testo.length} caratteri`);
    assert.ok(m.perche.length <= 160, `${m.id}: spiegazione di ${m.perche.length} caratteri`);
    assert.ok(FONTI[m.fonte], `${m.id}: fonte ${m.fonte}`);
  }
  assert.ok(MESSAGGI.filter((m) => m.truffa).length >= 20);
  assert.ok(MESSAGGI.filter((m) => !m.truffa).length >= 10);
});

test('i messaggi affidabili non accendono segnali forti nel motore di «È una truffa?»', () => {
  for (const m of MESSAGGI.filter((x) => !x.truffa)) {
    const forti = analizza(m.testo).segnali.filter((s) => s.forza === 'forte');
    assert.deepEqual(forti.map((s) => s.id), [], `${m.id} accende: ${forti.map((s) => s.titolo).join('; ')}`);
  }
});

test('nelle truffe, i siti nominati non sono domini ufficiali', () => {
  for (const m of MESSAGGI.filter((x) => x.truffa)) {
    for (const d of analizza(m.testo).domini) assert.ok(!/dominio ufficiale/.test(d.nota), `${m.id}: ${d.host} risulta ufficiale`);
  }
});

test('la maggior parte delle truffe accende almeno un segnale del motore', () => {
  const truffe = MESSAGGI.filter((x) => x.truffa);
  const viste = truffe.filter((m) => analizza(m.testo).segnali.length > 0);
  assert.ok(viste.length / truffe.length >= 0.8, `solo ${viste.length} su ${truffe.length}`);
});

test('la partita: 15 messaggi, un terzo affidabili, dal più facile', () => {
  let n = 7; const caso = () => ((n = (n * 16807) % 2147483647) / 2147483647);
  const p = scegliPartita(MESSAGGI, caso);
  assert.equal(p.length, PER_PARTITA);
  assert.equal(p.filter((m) => !m.truffa).length, 5);
  for (let i = 1; i < p.length; i++) assert.ok(p[i - 1].livello <= p[i].livello);
});

test('punti, vite e fine', () => {
  assert.equal(giusto({ truffa: true }, 'truffa'), true);
  assert.equal(giusto({ truffa: false }, 'truffa'), false);
  assert.equal(punti(true, 1), 15); assert.equal(punti(true, 0), 10); assert.equal(punti(false, 1), 0);
  let s = nuovoStato();
  s = segna(s, true, 0.5); s = segna(s, false, 0);
  assert.equal(s.punti, 13); assert.equal(s.vite, VITE - 1); assert.equal(s.indice, 2);
  assert.equal(finita({ ...s, vite: 0 }, 15), true);
  assert.equal(finita(s, 2), true);
  assert.equal(finita(s, 15), false);
});
