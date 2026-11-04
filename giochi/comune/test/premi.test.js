import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caso, semeDelGiorno, leggiSfida, linkSfida, titolo, archivio, giornoPrima, riquadroFine } from '../premi.js';

const finto = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

test('lo stesso seme dà la stessa partita, semi diversi partite diverse', () => {
  const a = caso('2026-11-04'), b = caso('2026-11-04'), c = caso('2026-11-05');
  const sa = Array.from({ length: 5 }, a), sb = Array.from({ length: 5 }, b), sc = Array.from({ length: 5 }, c);
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  assert.ok(sa.every((x) => x >= 0 && x < 1));
});

test('la sfida del giorno usa la data italiana', () => {
  assert.equal(semeDelGiorno(new Date('2026-11-04T23:30:00Z')), '2026-11-05'); // a mezzanotte e mezza in Italia è già il 5
  assert.equal(giornoPrima('2026-03-01'), '2026-02-28');
});

test('il link di sfida contiene solo i punti e il seme, e si rilegge', () => {
  const u = linkSfida('https://esempio.it/giochi/truffa/#prova', 142, 'ab12cd');
  assert.equal(u, 'https://esempio.it/giochi/truffa/#sfida=142&seme=ab12cd');
  assert.deepEqual(leggiSfida('#sfida=142&seme=ab12cd'), { punti: 142, seme: 'ab12cd' });
  assert.deepEqual(leggiSfida('#sfida=50&seme=<script>'), { punti: 50, seme: 'script' });
  assert.equal(leggiSfida('#prova'), null);
  assert.equal(leggiSfida('#sfida=-3'), null);
});

test('titoli secondo i punti', () => {
  const soglie = [[0, 'A'], [100, 'B'], [300, 'C']];
  assert.equal(titolo(0, soglie), 'A');
  assert.equal(titolo(150, soglie), 'B');
  assert.equal(titolo(999, soglie), 'C');
});

test('record, giorni di fila, sfida del giorno e medaglie restano nel browser', () => {
  const d = finto();
  const a = archivio('prova', d);
  let r = a.partita(50, '2026-11-03');
  assert.equal(r.nuovoRecord, false); // la prima partita non è un «nuovo record»
  r = a.partita(80, '2026-11-04', true);
  assert.equal(r.nuovoRecord, true);
  assert.equal(r.fila, 2);
  assert.equal(r.migliorOggi, 80);
  r = a.partita(60, '2026-11-04', true);
  assert.equal(r.migliorOggi, 80);
  assert.equal(r.fila, 2);
  assert.equal(r.prima, 80);
  r = a.partita(10, '2026-11-07');
  assert.equal(r.fila, 1); // giorni saltati: la serie riparte
  assert.deepEqual(a.medaglie(['x', 'y']), ['x', 'y']);
  assert.deepEqual(a.medaglie(['x', 'z']), ['z']);
  assert.equal(a.leggi().record, 80);
});

test('il record delle prime versioni non si perde', () => {
  const d = finto();
  d.setItem('polpo-truffa-record', '120');
  assert.equal(archivio('truffa', d).leggi().record, 120);
});

test('il riquadro finale: sfida, record sfiorato, medaglie', () => {
  const html = riquadroFine({ titoloOttenuto: 'Detective', record: 200, nuovoRecord: false, medaglieNuove: ['m'], catalogo: { m: { icona: '⭐', nome: 'Stella', come: 'x' } },
    sfida: { punti: 150 }, punti: 180, mancano: 20 });
  assert.match(html, /Sfida vinta/);
  assert.match(html, /Ti mancavano 20 punti/);
  assert.match(html, /Stella/);
});
