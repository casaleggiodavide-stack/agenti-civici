// La visita nei tempi: i casi di prova della ricerca del 25/10/2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuta, ultimaDisdetta } from '../src/regole.js';
import { lettera } from '../src/documento.js';
import { iso } from '../src/comune/date.js';

const OGGI = '2026-11-03';
const prima = { accesso: 'primo', rifiutato: false, pagato: false };
const scad = (v, re) => v.scadenze.find((s) => re.test(s.titolo))?.data;

test('classe B, data a marzo: termine 12/11, 128 giorni oltre, lettera', () => {
  const r = { ...prima, classe: 'B', data_contatto: '2026-11-02', proposta: 'data', data_proposta: '2027-03-20', ambito: 'vicino', prestazione: 'prima visita cardiologica' };
  const v = valuta(r, { oggi: OGGI });
  assert.equal(v.documento.termine, '2026-11-12');
  assert.equal(v.documento.ritardo, 128);
  assert.match(lettera(r, v), /percorso di tutela/);
  assert.match(lettera(r, v), /10-bis/);
});

test('classe B in prelista: richiamo entro il 7/11', () => {
  const v = valuta({ ...prima, classe: 'B', data_contatto: '2026-11-02', proposta: 'prelista' }, { oggi: OGGI });
  assert.equal(scad(v, /Richiamo/), '2026-11-07');
});

test('classe D esame nei tempi: termine 1/1/2027, disdetta entro venerdì 11/12', () => {
  const v = valuta({ ...prima, classe: 'D', tipo: 'esame', data_contatto: '2026-11-02', proposta: 'data', data_proposta: '2026-12-15', ambito: 'vicino' }, { oggi: OGGI });
  assert.equal(v.documento, null);
  assert.equal(scad(v, /Tempo massimo/), '2027-01-01');
  assert.equal(scad(v, /disdire/), '2026-12-11');
});

test('classe D visita: termine 2/12, superato di 13 giorni', () => {
  const v = valuta({ ...prima, classe: 'D', tipo: 'visita', data_contatto: '2026-11-02', proposta: 'data', data_proposta: '2026-12-15', ambito: 'vicino' }, { oggi: OGGI });
  assert.equal(v.documento.termine, '2026-12-02');
  assert.equal(v.documento.ritardo, 13);
});

test('classe P: 120 giorni, 29/1/2027, nei tempi', () => {
  const v = valuta({ ...prima, classe: 'P', data_contatto: '2026-10-01', proposta: 'data', data_proposta: '2027-01-10', ambito: 'vicino' }, { oggi: OGGI });
  assert.equal(scad(v, /Tempo massimo/), '2027-01-29');
  assert.equal(v.documento, null);
});

test('controlli, rifiuto, rimborso a posteriori: niente lettera', () => {
  assert.equal(valuta({ accesso: 'successivo' }, { oggi: OGGI }).documento, null);
  assert.match(valuta({ ...prima, classe: 'B', rifiutato: true }, { oggi: OGGI }).verdetto.titolo, /garanzia non vale/);
  assert.match(valuta({ ...prima, classe: 'B', pagato: true }, { oggi: OGGI }).verdetto.titolo, /rimborso/);
});

test('urgenza: messaggio prioritario', () => {
  const v = valuta({ ...prima, sintomi: true, classe: 'U', data_contatto: '2026-11-02', proposta: 'niente' }, { oggi: OGGI });
  assert.equal(v.urgente, true);
  assert.match(v.voci[0].titolo, /salute/);
});

test('disdetta: due giorni lavorativi prima, saltando weekend e festivi', () => {
  assert.equal(iso(ultimaDisdetta('2026-12-28')), '2026-12-23');
});
