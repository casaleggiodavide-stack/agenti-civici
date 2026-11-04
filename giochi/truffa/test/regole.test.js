import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MESSAGGI, FONTI } from '../src/messaggi.js';
import { scegliPartita, giusto, punti, nuovoStato, segna, finita, PER_PARTITA, VITE, medaglieGuadagnate, MEDAGLIE, TITOLI } from '../src/regole.js';
import { caso } from '../../comune/premi.js';
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

test('serie, scudo del Polpo e medaglie', () => {
  let s = nuovoStato();
  for (let i = 0; i < 5; i++) s = segna(s, true, 0, { livello: 1 });
  assert.equal(s.punti, 5 * 10 + 3 * 5); // dalla terza giusta di fila, +5
  assert.equal(s.scudo, true);
  s = segna(s, false, 0, { livello: 2, cascato: true });
  assert.equal(s.vite, VITE); // lo scudo para l'errore
  assert.equal(s.scudo, false);
  assert.equal(s.parati, 1);
  s = segna(s, false, 0, { livello: 2 });
  assert.equal(s.vite, VITE - 1);
  const m = medaglieGuadagnate({ ...s, indice: PER_PARTITA }, PER_PARTITA);
  assert.ok(m.includes('scudo') && !m.includes('mai-cascato') && !m.includes('perfetto'));
  for (const id of m) assert.ok(MEDAGLIE[id]);
});

test('la partita della sfida è la stessa per chi ha lo stesso seme, e il punteggio massimo arriva all\'ultimo titolo', () => {
  const a = scegliPartita(MESSAGGI, caso('2026-11-04-truffa')).map((m) => m.id);
  const b = scegliPartita(MESSAGGI, caso('2026-11-04-truffa')).map((m) => m.id);
  assert.deepEqual(a, b);
  let s = nuovoStato();
  for (let i = 0; i < PER_PARTITA; i++) s = segna(s, true, 1, { livello: 3 });
  assert.ok(s.punti >= TITOLI[TITOLI.length - 1][0], `massimo ${s.punti}`);
});
