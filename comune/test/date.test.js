import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scadenza, iso, festivo, data, pasqua } from '../date.js';

test('Pasqua 2026 è il 5 aprile, 2027 il 28 marzo', () => {
  assert.equal(iso(pasqua(2026)), '2026-04-05');
  assert.equal(iso(pasqua(2027)), '2027-03-28');
});

test('festivi: Pasquetta, 2 giugno, 4 ottobre solo dal 2026', () => {
  assert.ok(festivo(data('2026-04-06')));
  assert.ok(festivo(data('2026-06-02')));
  assert.ok(festivo(data('2027-10-04')));
  assert.ok(!festivo(data('2025-10-03')));
  assert.ok(!festivo(data('2026-10-12')));
});

test('60 giorni dal 1° settembre 2026 = 31 ottobre (sabato), slitta a lunedì 2 novembre se il sabato non è utile', () => {
  assert.equal(iso(scadenza('2026-09-01', 60)), '2026-10-31');
  assert.equal(iso(scadenza('2026-09-01', 60, { slitta: true, sabato: true })), '2026-11-02');
});

test('sospensione feriale: 30 giorni dal 20 luglio saltano agosto', () => {
  // 11 giorni di luglio (21-31) + 19 di settembre = 19 settembre
  assert.equal(iso(scadenza('2026-07-20', 30, { feriale: true })), '2026-09-19');
});
