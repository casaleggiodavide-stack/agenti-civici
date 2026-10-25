// Le misure regionali: schede complete, filtro per Regione, nessun errore su risposte vuote o piene.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuta, PRESTAZIONI } from '../src/motore.js';
import { REGIONI } from '../src/situazione.js';

const REGIONALI = PRESTAZIONI.filter((p) => p.regione);
const ID_REGIONI = new Set(REGIONI.map(([id]) => id));

test('ogni misura regionale ha Regione valida, fonte https, link e data di verifica', () => {
  assert.ok(REGIONALI.length >= 40);
  for (const p of REGIONALI) {
    assert.ok(ID_REGIONI.has(p.regione), `${p.id}: regione ${p.regione}`);
    assert.ok(p.fonti.length && p.fonti.every((f) => f.url.startsWith('https://')), p.id);
    assert.ok(p.come?.link?.startsWith('https://'), p.id);
    assert.match(p.verificato, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.finestra?.testo, `${p.id}: finestra`);
  }
});

test('senza Regione si vedono solo le misure nazionali; con la Regione solo quelle sue', () => {
  const nessuna = valuta({ eta: 40 }, { oggi: '2026-10-25' });
  assert.equal(nessuna.risultati.filter((r) => r.regione).length, 0);
  const toscana = valuta({ eta: 40, regione: 'toscana' }, { oggi: '2026-10-25' });
  const regionali = toscana.risultati.filter((r) => r.regione);
  assert.ok(regionali.length > 0);
  assert.ok(regionali.every((r) => r.regione === 'toscana'));
});

test('nessuna misura regionale va in errore, con risposte vuote o complete', () => {
  const piena = { eta: 34, anni_residenza_regione: 6, figli: [{ nascita: '2026-03' }, { nascita: '2013-09' }, { nascita: '2019-01' }], sei_madre: true, coniuge: true, isee: 12000, icef: 0.3, lavoro: 'dipendente_indeterminato', casa: 'affitto', canone_annuo: 7200, contratto_registrato: true, disabile_nucleo: false };
  for (const [regione] of REGIONI) {
    for (const r of [{ regione }, { ...piena, regione }]) {
      const v = valuta(r, { oggi: '2026-10-25' });
      for (const x of v.risultati.filter((y) => y.regione)) assert.ok(!x.requisiti.some((q) => /Errore/.test(q.testo)), `${x.id} ${JSON.stringify(r).slice(0, 40)}`);
    }
  }
});

test('casi noti: Bolzano 200 € fino ai 3 anni, Lazio over 70, finestra chiusa in Toscana', () => {
  const bz = valuta({ regione: 'bolzano', anni_residenza_regione: 6, figli: [{ nascita: '2025-06' }] }, { oggi: '2026-10-25' });
  assert.equal(bz.risultati.find((r) => r.id === 'bolzano_assegno_nucleo').esito, 'spetta');
  const bzNuovo = valuta({ regione: 'bolzano', anni_residenza_regione: 2, figli: [{ nascita: '2025-06' }] }, { oggi: '2026-10-25' });
  assert.equal(bzNuovo.risultati.find((r) => r.id === 'bolzano_assegno_nucleo').esito, 'non_spetta');
  const lazio = valuta({ regione: 'lazio', eta: 71 }, { oggi: '2026-10-25' });
  assert.equal(lazio.risultati.find((r) => r.id === 'lazio_over70_trasporti').esito, 'spetta');
  const to = valuta({ regione: 'toscana', figli: [{ nascita: '2012-02' }], isee: 9000 }, { oggi: '2026-10-25' });
  assert.equal(to.risultati.find((r) => r.id === 'toscana_libri_gratis').esito, 'chiusa');
});
