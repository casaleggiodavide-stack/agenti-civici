// Casi noti di «Mi rimborsano?», uno o più per ambito.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuta, fasciaVolo } from '../src/regole.js';
import { distanzaKm } from '../src/dati/aeroporti.js';
import { lettera } from '../src/documento.js';

const OGGI = { oggi: '2026-10-25' };

test('distanze e fasce del 261: Roma-Milano 250, Roma-Lisbona 400, Milano-New York 600', () => {
  const romaMilano = distanzaKm('FCO', 'LIN');
  assert.ok(romaMilano > 450 && romaMilano < 500, String(romaMilano));
  assert.equal(fasciaVolo(distanzaKm('FCO', 'LIS'), true).importo, 400);
  const mxpJfk = distanzaKm('MXP', 'JFK');
  assert.ok(mxpJfk > 6300 && mxpJfk < 6500, String(mxpJfk));
  assert.equal(fasciaVolo(mxpJfk, false).importo, 600);
  assert.equal(fasciaVolo(4000, true).importo, 400, 'tratta europea oltre 3.500 km resta a 400');
});

test('volo: ritardo di 4 ore per guasto, Catania-Parigi, spettano 400 €', () => {
  const v = valuta({ caso: 'volo', volo_tipo: 'ritardo', data_volo: '2026-09-12', da: 'CTA', a: 'CDG', ritardo_ore: 4, causa_volo: 'guasto' }, OGGI);
  assert.equal(v.verdetto.tono, 'si');
  assert.equal(v.importo.valore, 400);
  assert.ok(v.documento);
  assert.match(lettera({ caso: 'volo', volo_tipo: 'ritardo', data_volo: '2026-09-12', da: 'CTA', a: 'CDG', ritardo_ore: 4, causa_volo: 'guasto' }, v), /400,00 €/);
});

test('volo: 2 ore e 50 non bastano; 3 ore esatte sì (prima della riforma)', () => {
  const base = { caso: 'volo', volo_tipo: 'ritardo', data_volo: '2026-09-12', da: 'FCO', a: 'LIN', causa_volo: 'guasto' };
  assert.equal(valuta({ ...base, ritardo_ore: 2.83 }, OGGI).verdetto.tono, 'no');
  assert.equal(valuta({ ...base, ritardo_ore: 3 }, OGGI).importo.valore, 250);
});

test('volo: maltempo è «forse», cancellazione con 20 giorni di preavviso non dà compensazione', () => {
  const meteo = valuta({ caso: 'volo', volo_tipo: 'ritardo', data_volo: '2026-09-12', da: 'FCO', a: 'LIN', ritardo_ore: 5, causa_volo: 'meteo' }, OGGI);
  assert.equal(meteo.verdetto.tono, 'forse');
  const canc = valuta({ caso: 'volo', volo_tipo: 'cancellazione', data_volo: '2026-09-12', da: 'FCO', a: 'LIN', preavviso_giorni: 20 }, OGGI);
  assert.equal(canc.verdetto.tono, 'no');
});

test('volo: cancellazione con 3 giorni e alternativa in arrivo 1 ora dopo, nessuna compensazione; 3 ore dopo sì, ridotta', () => {
  const base = { caso: 'volo', volo_tipo: 'cancellazione', data_volo: '2026-09-12', da: 'MXP', a: 'JFK', preavviso_giorni: 3, alternativa: true, alt_anticipo_ore: 0, causa_volo: 'sciopero_vettore' };
  assert.equal(valuta({ ...base, alt_ritardo_ore: 1 }, OGGI).verdetto.tono, 'no');
  const v = valuta({ ...base, alt_ritardo_ore: 3 }, OGGI);
  assert.equal(v.verdetto.tono, 'si');
  assert.equal(v.importo.valore, 300, '600 € ridotti del 50% con arrivo entro 4 ore');
});

test('volo: da New York con compagnia non europea il 261 non si applica', () => {
  const v = valuta({ caso: 'volo', volo_tipo: 'ritardo', data_volo: '2026-09-12', da: 'JFK', a: 'FCO', vettore_ue: false, ritardo_ore: 6 }, OGGI);
  assert.equal(v.verdetto.tono, 'no');
});

test('volo dopo il 23/10/2027: soglia «più di 3 ore» e termine di 9 mesi', () => {
  const v = valuta({ caso: 'volo', volo_tipo: 'ritardo', data_volo: '2027-11-02', da: 'FCO', a: 'LIN', ritardo_ore: 3, causa_volo: 'guasto' }, { oggi: '2027-11-10' });
  assert.equal(v.verdetto.tono, 'no');
  const w = valuta({ caso: 'volo', volo_tipo: 'ritardo', data_volo: '2027-11-02', da: 'FCO', a: 'LIN', ritardo_ore: 3.5, causa_volo: 'guasto' }, { oggi: '2027-11-10' });
  assert.ok(w.scadenze.some((s) => s.id === 'richiesta' && s.data === '2028-08-02'));
});

test('bagaglio danneggiato: 7 giorni per il reclamo', () => {
  const v = valuta({ caso: 'bagaglio', bagaglio_tipo: 'danneggiato', data_arrivo_volo: '2026-10-20', data_bagaglio: '2026-10-20', pir: true }, OGGI);
  assert.equal(v.scadenze.find((s) => s.id === 'reclamo').data, '2026-10-27');
  assert.equal(v.verdetto.tono, 'si');
  const tardi = valuta({ caso: 'bagaglio', bagaglio_tipo: 'danneggiato', data_arrivo_volo: '2026-10-01', data_bagaglio: '2026-10-01' }, OGGI);
  assert.equal(tardi.verdetto.tono, 'no');
});

test('treno: 75 minuti su 40 € danno 10 €; persone sui binari è «forse»', () => {
  const v = valuta({ caso: 'treno', data_treno: '2026-10-10', ritardo_minuti: 75, prezzo_treno: 40, causa_treno: 'guasto' }, OGGI);
  assert.equal(v.importo.valore, 10);
  assert.equal(v.verdetto.tono, 'si');
  assert.equal(valuta({ caso: 'treno', ritardo_minuti: 130, prezzo_treno: 40, causa_treno: 'terzi' }, OGGI).verdetto.tono, 'forse');
  assert.equal(valuta({ caso: 'treno', ritardo_minuti: 40, prezzo_treno: 40 }, OGGI).verdetto.tono, 'no');
});

test('bolletta: conguaglio gas con consumi di tre anni prima, prescrizione', () => {
  const r = { caso: 'bolletta', servizio: 'gas', domestico: true, problema_bolletta: 'vecchia', scadenza_bolletta: '2026-11-15', consumi_dal: '2023-06-01', importo_bolletta: 1240 };
  const v = valuta(r, OGGI);
  assert.equal(v.verdetto.tono, 'si');
  assert.equal(v.documento.tipo, 'prescrizione');
  assert.match(lettera(r, v), /eccepisco la prescrizione/);
  assert.ok(v.scadenze.some((s) => s.id === 'rate' && s.data === '2026-11-25'));
  const recente = valuta({ ...r, consumi_dal: '2025-06-01' }, OGGI);
  assert.equal(recente.verdetto.tono, 'no');
  assert.equal(valuta({ ...r, servizio: 'rifiuti' }, OGGI).verdetto.tono, 'no');
});

test('telefono: 20 giorni di fibra interrotta, 160 €; affari raddoppia', () => {
  const r = { caso: 'telefono', disservizio: 'interruzione', data_inizio: '2026-10-01', risolto: true, data_fine: '2026-10-21', fibra: true, gia_reclamato: true, data_reclamo: '2026-10-02' };
  const v = valuta(r, OGGI);
  assert.equal(v.importo.valore, 160);
  assert.equal(valuta({ ...r, affari: true }, OGGI).importo.valore, 320);
  const tardi = valuta({ ...r, data_reclamo: '2026-09-01', data_inizio: '2026-05-01', data_fine: '2026-05-10' }, OGGI);
  assert.equal(tardi.verdetto.tono, 'forse');
});

test('banca: phishing di 900 €, rimborso con franchigia, 13 mesi', () => {
  const v = valuta({ caso: 'banca', banca_tipo: 'non_autorizzata', data_addebito: '2026-10-20', importo_banca: 900, codici_dati: false }, OGGI);
  assert.equal(v.importo.valore, 850);
  assert.equal(v.scadenze.find((s) => s.id === 'tredici').data, '2027-11-20');
  assert.equal(valuta({ caso: 'banca', banca_tipo: 'non_autorizzata', data_addebito: '2025-01-10', importo_banca: 900 }, OGGI).verdetto.tono, 'no');
  assert.equal(valuta({ caso: 'banca', banca_tipo: 'non_autorizzata', data_addebito: '2026-10-20', importo_banca: 900, codici_dati: true }, OGGI).verdetto.tono, 'forse');
});

test('ogni esito ha fonti https e nessun caso va in errore con risposte vuote', () => {
  for (const caso of ['volo', 'bagaglio', 'treno', 'bolletta', 'telefono', 'banca', undefined]) {
    const v = valuta({ caso }, OGGI);
    assert.ok(v.verdetto.titolo);
    assert.ok(v.fonti.every((f) => f.url.startsWith('https://')), caso);
  }
});
