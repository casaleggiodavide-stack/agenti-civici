import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONTENITORI, valuta, segna, perso, nuovoStato, bersaglio, ritmo, mescola, moltiplicatore, testoCondivisione, VITE } from '../src/regole.js';

const dati = JSON.parse(readFileSync(new URL('../src/rifiuti.json', import.meta.url), 'utf8'));
const ids = CONTENITORI.map((c) => c.id);

test('ogni rifiuto ha un contenitore valido, una spiegazione breve e una fonte esistente', () => {
  assert.ok(dati.rifiuti.length >= 40, `troppi pochi rifiuti: ${dati.rifiuti.length}`);
  const visti = new Set();
  for (const r of dati.rifiuti) {
    assert.ok(!visti.has(r.id), `id doppio: ${r.id}`); visti.add(r.id);
    assert.ok(ids.includes(r.contenitore), `${r.id}: contenitore ${r.contenitore}`);
    for (const a of r.alternative || []) assert.ok(ids.includes(a) && a !== r.contenitore, `${r.id}: alternativa ${a}`);
    if ((r.alternative || []).length) assert.equal(r.dipende, true, `${r.id}: con alternative deve dipendere dal Comune`);
    assert.ok(r.nome && r.nome.length <= 28, `${r.id}: nome`);
    assert.ok(r.spiegazione && r.spiegazione.length <= 140, `${r.id}: spiegazione di ${r.spiegazione?.length} caratteri`);
    assert.ok(dati.fonti[r.fonte]?.url?.startsWith('https://'), `${r.id}: fonte ${r.fonte}`);
  }
  for (const c of ids) assert.ok(dati.rifiuti.some((r) => r.contenitore === c), `nessun rifiuto per ${c}`);
});

test('valuta: giusto, dipende dal Comune, sbagliato', () => {
  const r = { contenitore: 'carta', alternative: ['plastica'] };
  assert.equal(valuta(r, 'carta'), 'giusto');
  assert.equal(valuta(r, 'plastica'), 'dipende');
  assert.equal(valuta(r, 'vetro'), 'sbagliato');
  assert.equal(valuta({ contenitore: 'vetro' }, 'vetro'), 'giusto');
});

test('punti, serie e vite', () => {
  let s = nuovoStato();
  for (let i = 0; i < 5; i++) s = segna(s, 'giusto');
  assert.equal(s.punti, 10 * 4 + 20); // il quinto vale doppio
  assert.equal(moltiplicatore(20), 4);
  s = segna(s, 'sbagliato');
  assert.equal(s.serie, 0); assert.equal(s.vite, VITE - 1); assert.equal(s.migliore, 5);
  s = perso(segna(s, 'dipende'));
  assert.equal(s.serie, 0); assert.equal(s.vite, VITE - 1); assert.equal(s.persi, 1);
});

test('bersaglio: il lancio verso il basso arriva nel contenitore giusto', () => {
  const L = 600, quota = 500; // sei contenitori da 100 px
  assert.equal(bersaglio({ x: 50, y: 100 }, { dx: 0, dy: 10 }, quota, L), 0);
  assert.equal(bersaglio({ x: 250, y: 100 }, { dx: 1, dy: 4 }, quota, L), 3); // arriva a x = 350
  assert.equal(bersaglio({ x: 590, y: 400 }, { dx: 0, dy: 1 }, quota, L), 5);
});

test('bersaglio: lanci verso l\'alto o fuori schermo non valgono', () => {
  assert.equal(bersaglio({ x: 300, y: 300 }, { dx: 0, dy: -10 }, 500, 600), -1);
  assert.equal(bersaglio({ x: 300, y: 300 }, { dx: 10, dy: 0.5 }, 500, 600), -1);
  assert.equal(bersaglio({ x: 550, y: 100 }, { dx: 10, dy: 10 }, 500, 600), -1);
});

test('il ritmo accelera e resta nei limiti', () => {
  assert.ok(ritmo(0).intervallo > ritmo(1).intervallo);
  assert.ok(ritmo(0).velocita < ritmo(1).velocita);
  assert.deepEqual(ritmo(5), ritmo(1));
});

test('mescola non perde nulla e il testo da condividere non ha dati personali', () => {
  let n = 1; const caso = () => ((n = (n * 16807) % 2147483647) / 2147483647);
  const m = mescola(dati.rifiuti, caso);
  assert.equal(m.length, dati.rifiuti.length);
  assert.deepEqual(new Set(m.map((r) => r.id)), new Set(dati.rifiuti.map((r) => r.id)));
  const t = testoCondivisione({ ...nuovoStato(), giusti: 12, errori: 3, punti: 150 });
  assert.match(t, /12 rifiuti su 15/);
});
