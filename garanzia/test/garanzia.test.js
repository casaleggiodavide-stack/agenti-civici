// Si è rotto o ci ho ripensato: i casi di prova della ricerca del 25/10/2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuta, piuMesi } from '../src/regole.js';
import { lettera } from '../src/documento.js';
import { data, iso } from '../src/comune/date.js';

const OGGI = '2026-10-25';
const base = { venditore: 'professionista', tipo: 'bene' };
const scad = (v, re) => v.scadenze.find((s) => re.test(s.titolo))?.data;

test('lavatrice del 2025: garanzia al 10/3/2027, prova a carico, prescrizione al 10/5/2027', () => {
  const v = valuta({ ...base, caso: 'difetto', dove: 'negozio', data_contratto: '2025-03-08', data_consegna: '2025-03-10', data_difetto: '2026-10-25', rimedio: 'riparazione', categoria: 'lavatrice' }, { oggi: OGGI });
  assert.equal(v.documento.tipo, 'denuncia');
  assert.equal(v.documento.presunto, false);
  assert.equal(scad(v, /Fine della garanzia/), '2027-03-10');
  assert.equal(scad(v, /Prescrizione/), '2027-05-10');
  assert.ok(v.voci.some((x) => /Niente estensione/.test(x.titolo)));
  assert.match(lettera({ ...base, cosa_comprato: 'lavatrice' }, v), /art\. 133/);
});

test('smartphone dal 31/7/2026 con riparazione: responsabilità fino al 5/8/2029', () => {
  const v = valuta({ ...base, caso: 'difetto', dove: 'distanza', data_contratto: '2026-08-05', data_consegna: '2026-08-05', data_difetto: '2026-10-01', rimedio: 'riparazione' }, { oggi: OGGI });
  assert.equal(v.documento.presunto, true);
  assert.equal(scad(v, /Fine della garanzia/), '2029-08-05');
});

test('recesso: scarpe consegnate il 20/10 → entro il 3/11, rimborso 14 giorni dopo la comunicazione', () => {
  const v = valuta({ ...base, caso: 'ripensamento', dove: 'distanza', data_contratto: '2026-10-18', data_consegna: '2026-10-20', informato: true, eccezione: 'nessuna' }, { oggi: OGGI });
  assert.equal(v.documento.tipo, 'recesso');
  assert.equal(scad(v, /Ultimo giorno/), '2026-11-03');
  assert.equal(scad(v, /rimborso deve arrivare/), '2026-11-08');
});

test('nessuna informativa: 12 mesi in più (15/9/2027)', () => {
  const v = valuta({ ...base, caso: 'ripensamento', dove: 'distanza', data_contratto: '2026-08-28', data_consegna: '2026-09-01', informato: false, eccezione: 'nessuna' }, { oggi: OGGI });
  assert.equal(scad(v, /Ultimo giorno/), '2027-09-15');
});

test('eccezioni, negozio e privati: niente recesso o niente Codice del consumo', () => {
  assert.equal(valuta({ ...base, caso: 'ripensamento', dove: 'distanza', eccezione: 'data' }, { oggi: OGGI }).verdetto.tono, 'no');
  assert.equal(valuta({ ...base, caso: 'ripensamento', dove: 'negozio' }, { oggi: OGGI }).verdetto.tono, 'no');
  const p = valuta({ caso: 'difetto', venditore: 'privato' }, { oggi: OGGI });
  assert.equal(p.documento, null);
  assert.match(p.verdetto.titolo, /privati/);
});

test('usato con garanzia ridotta: difetto al 14° mese fuori garanzia', () => {
  const v = valuta({ ...base, caso: 'difetto', dove: 'negozio', usato: true, garanzia_ridotta: true, data_contratto: '2025-08-01', data_consegna: '2025-08-01', data_difetto: '2026-10-01', categoria: 'altro' }, { oggi: OGGI });
  assert.equal(v.verdetto.tono, 'no');
});

test('lavastoviglie del 2022 fuori garanzia: riparazione dal fabbricante', () => {
  const v = valuta({ ...base, caso: 'difetto', dove: 'negozio', data_contratto: '2022-05-02', data_consegna: '2022-05-04', data_difetto: '2026-10-20', categoria: 'lavastoviglie' }, { oggi: OGGI });
  assert.equal(v.documento.tipo, 'fabbricante');
});

test('sito senza pulsante di recesso dopo il 19/6/2026: segnalazione', () => {
  const v = valuta({ venditore: 'professionista', tipo: 'servizio', caso: 'ripensamento', dove: 'distanza', data_contratto: '2026-10-20', funzione: false, informato: true, eccezione: 'nessuna' }, { oggi: OGGI });
  assert.ok(v.voci.some((x) => /pulsante/.test(x.titolo)));
  assert.equal(scad(v, /Ultimo giorno/), '2026-11-03');
});

test('rimborso in ritardo: diffida', () => {
  const v = valuta({ ...base, caso: 'rimborso', dove: 'distanza', data_recesso: '2026-09-20', data_reso: '2026-09-21' }, { oggi: OGGI });
  assert.equal(v.documento.tipo, 'diffida');
  assert.equal(v.documento.dovuto, '2026-10-04');
});

test('mesi: fine mese', () => {
  assert.equal(iso(piuMesi(data('2026-01-31'), 1)), '2026-02-28');
});
