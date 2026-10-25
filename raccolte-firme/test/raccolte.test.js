// Raccolte firme: stima della probabilità e dati copiati dalla piattaforma.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import RACCOLTE, { LETTO, SERIE } from '../dati/raccolte.js';
import { stima, storico } from '../src/stima.js';

const base = { stato: 'IN RACCOLTA FIRME', tipo: 'legge', quorum: 50000, inizio: '2026-09-01', fine: '2026-12-01' };

test('stima: raggiunto, probabile, in bilico, molto difficile, senza scadenza', () => {
  const oggi = '2026-10-01';
  assert.equal(stima({ ...base, firme: 52000 }, { oggi }).livello, 'raggiunto');
  assert.equal(stima({ ...base, firme: 40000 }, { oggi }).livello, 'probabile');
  assert.equal(stima({ ...base, firme: 22000 }, { oggi }).livello, 'in_bilico');
  assert.equal(stima({ ...base, firme: 1500 }, { oggi }).livello, 'molto_difficile');
  assert.equal(stima({ ...base, fine: null, firme: 1500 }, { oggi }).livello, 'senza_scadenza');
  assert.equal(stima({ ...base, fine: '2026-09-15', firme: 1500 }, { oggi }).livello, 'conclusa');
});

test('il ritmo recente prevale sulla media quando ci sono almeno tre giorni di letture', () => {
  const s = stima({ ...base, firme: 30000 }, { oggi: '2026-10-10', serie: [['2026-10-03', 29300], ['2026-10-10', 30000]] });
  assert.equal(s.recente, 100);
  assert.equal(s.ritmo, 100);
  assert.equal(s.livello, 'molto_difficile');
});

test('dati della piattaforma: decine di raccolte con firme, obiettivo e id', () => {
  assert.ok(RACCOLTE.length > 50);
  assert.match(LETTO, /^\d{4}-\d\d-\d\d$/);
  for (const r of RACCOLTE) {
    assert.ok(r.id && r.titolo, JSON.stringify(r).slice(0, 80));
    assert.ok([50000, 500000].includes(r.quorum), `${r.id} quorum ${r.quorum}`);
  }
  assert.ok(Object.keys(SERIE).length >= RACCOLTE.length);
  const st = storico(RACCOLTE, LETTO);
  assert.ok(st.legge.totale > 10 && st.legge.riuscite > 0);
});
