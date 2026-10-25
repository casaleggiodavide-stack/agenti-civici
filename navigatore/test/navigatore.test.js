// Navigatore dei servizi: ogni scheda ha fonti ufficiali e la ricerca capisce le parole di tutti i giorni.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRATICHE, CATEGORIE } from '../src/pratiche.js';
import { cerca } from '../src/cerca.js';

test('ogni scheda ha titolo, categoria, passi, fonti https e data di verifica', () => {
  assert.ok(PRATICHE.length >= 20);
  const id = new Set();
  for (const p of PRATICHE) {
    assert.ok(!id.has(p.id), `id doppio: ${p.id}`);
    id.add(p.id);
    assert.ok(CATEGORIE[p.categoria], `${p.id}: categoria ${p.categoria}`);
    assert.ok(p.passi.length >= 2, `${p.id}: passi`);
    assert.ok(p.fonti.length >= 1, `${p.id}: fonti`);
    for (const f of [...p.fonti, ...p.norme]) assert.match(f.url, /^https:\/\//, `${p.id}: ${f.url}`);
    assert.match(p.verificato, /^2026-\d\d-\d\d$/);
    assert.ok(p.sinonimi.length >= 3, `${p.id}: sinonimi`);
  }
});

test('la ricerca trova la pratica giusta da frasi comuni', () => {
  const primo = (q) => cerca(q, 1)[0]?.pratica.id;
  assert.equal(primo('mi trasferisco in un altro comune'), 'cambio-residenza');
  assert.equal(primo('rinnovare il passaporto'), 'passaporto');
  assert.equal(primo('è morto mio padre'), 'decesso-cosa-fare');
  assert.equal(primo('voglio sposarmi'), 'matrimonio-civile');
  assert.equal(primo('cambiare medico'), 'medico-di-base');
  assert.equal(primo('permesso di soggiorno scaduto'), 'permesso-di-soggiorno');
  assert.deepEqual(cerca('zzzz qwerty'), []);
});

test('le novità 2026 sono nelle schede: carta cartacea e passaporto 42,70 €', () => {
  const cie = PRATICHE.find((p) => p.id === 'carta-identita-elettronica');
  assert.match(JSON.stringify(cie), /cartacea/i);
  assert.match(PRATICHE.find((p) => p.id === 'passaporto').costo, /42,70/);
});
