// Casi di prova di Faccio ricorso?, con data di riferimento fissa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuta } from '../src/regole.js';
import { ricorsoPrefetto, ricorsoGiudiceDiPace } from '../src/documento.js';

const OGGI = '2026-10-11';
const v = (r, oggi = OGGI) => valuta(r, { oggi });
const motivo = (x, id) => x.motivi.find((m) => m.id === id);

test('già pagato: niente ricorso', () => {
  assert.equal(v({ gia_pagato: true }).verdetto.tono, 'no');
});

test('verbale spedito dopo 90 giorni: motivo forte, strada Prefetto', () => {
  const x = v({ tipo: 'semaforo', data_violazione: '2026-04-02', modo: 'posta', data_notifica: '2026-09-20', data_spedizione: '2026-07-10', veicolo_tuo: true, dati_corretti: true, provincia: 'MI' });
  const m = motivo(x, 'notifica_tardiva');
  assert.equal(m.esito, 'vizio');
  assert.equal(m.forza, 'forte');
  assert.equal(x.verdetto.tono, 'si');
  assert.equal(x.verdetto.strada, 'prefetto');
  assert.equal(x.destinatari.prefetto.pec, 'protocollo.prefmi@pec.interno.it');
});

test('verbale ricevuto dopo 90 giorni ma senza data di spedizione: serve il dato', () => {
  const x = v({ tipo: 'semaforo', data_violazione: '2026-04-02', modo: 'posta', data_notifica: '2026-07-20', veicolo_tuo: true });
  assert.equal(motivo(x, 'notifica_tardiva').esito, 'dato');
  assert.equal(motivo(x, 'notifica_tardiva').dato, 'data_spedizione');
});

test('PEC arrivata dopo 90 giorni: spedizione e consegna coincidono', () => {
  const x = v({ tipo: 'ztl', data_violazione: '2026-05-01', modo: 'pec', data_notifica: '2026-08-15', veicolo_tuo: true });
  assert.equal(motivo(x, 'notifica_tardiva').esito, 'vizio');
});

test('residente all\'estero: 360 giorni', () => {
  const x = v({ tipo: 'ztl', data_violazione: '2026-01-10', modo: 'posta', data_notifica: '2026-09-01', estero: true, veicolo_tuo: true });
  assert.equal(motivo(x, 'notifica_tardiva').esito, 'nessuno');
});

test('autovelox solo approvato, violazione prima del 12/7/2026: motivo discusso, meglio il Giudice di Pace', () => {
  const x = v({ tipo: 'velocita', data_violazione: '2026-06-10', modo: 'posta', data_notifica: '2026-09-25', veicolo_tuo: true, dati_corretti: true, strumento: 'approvato', taratura: '2026-01-15', vel_rilevata: 87, vel_contestata: 82, cartello: true });
  const m = motivo(x, 'omologazione');
  assert.equal(m.esito, 'vizio');
  assert.equal(m.forza, 'discusso');
  assert.equal(x.verdetto.tono, 'forse');
  assert.equal(x.verdetto.strada, 'gdp');
  assert.equal(motivo(x, 'tolleranza').esito, 'nessuno');
  assert.equal(motivo(x, 'taratura').esito, 'nessuno');
});

test('taratura di oltre un anno prima: motivo forte', () => {
  const x = v({ tipo: 'velocita', data_violazione: '2026-08-01', taratura: '2025-06-30', strumento: 'omologato', modo: 'immediata', veicolo_tuo: true });
  assert.equal(motivo(x, 'taratura').esito, 'vizio');
});

test('tolleranza non applicata: 132 rilevati, contestati 130 invece di 125', () => {
  const x = v({ tipo: 'velocita', data_violazione: '2026-08-01', modo: 'immediata', vel_rilevata: 132, vel_contestata: 130, strumento: 'omologato', veicolo_tuo: true });
  assert.equal(motivo(x, 'tolleranza').esito, 'vizio');
});

test('strisce blu: 5 minuti oltre su 60 pagati, nessuna sanzione dal 14/12/2024', () => {
  const x = v({ tipo: 'strisce_blu', data_violazione: '2026-09-20', modo: 'posta', data_notifica: '2026-10-05', ticket: true, minuti_pagati: 60, minuti_oltre: 5, veicolo_tuo: true });
  assert.equal(motivo(x, 'strisce_blu').esito, 'vizio');
  assert.match(motivo(x, 'strisce_blu').testoRicorso, /non si applica/);
});

test('strisce blu prima della riforma: la regola del 10% non vale', () => {
  const x = v({ tipo: 'strisce_blu', data_violazione: '2024-11-20', modo: 'immediata', ticket: true, minuti_pagati: 60, minuti_oltre: 5, veicolo_tuo: true });
  assert.equal(motivo(x, 'strisce_blu'), undefined);
});

test('nessun motivo: verdetto negativo e sconto del 30% ancora possibile', () => {
  const x = v({ tipo: 'semaforo', data_violazione: '2026-09-01', modo: 'posta', data_notifica: '2026-10-08', veicolo_tuo: true, dati_corretti: true, importo: 182.4, spese: 15.4 });
  assert.equal(x.verdetto.tono, 'no');
  const sconto = x.costi.righe.find((c) => c.id === 'sconto');
  assert.equal(sconto.costo, 132.3); // 167 × 0,7 + 15,40
  assert.equal(x.costi.righe.find((c) => c.id === 'prefetto').seRespinto, 349.4); // 167 × 2 + 15,40
  assert.equal(x.costi.cu, 43);
});

test('scadenze: Prefetto 60 giorni senza proroghe, Giudice di Pace 30 con sospensione di agosto', () => {
  const x = v({ tipo: 'semaforo', data_violazione: '2026-07-01', modo: 'posta', data_notifica: '2026-07-20', veicolo_tuo: true }, '2026-07-21');
  const s = Object.fromEntries(x.scadenze.map((d) => [d.id, d]));
  assert.equal(s.prefetto.data, '2026-09-18');
  assert.equal(s.gdp.data, '2026-08-19');
  assert.equal(s.gdp.legale, '2026-09-21'); // 19 settembre è sabato
  assert.equal(s.sconto.data, '2026-07-25');
});

test('termini scaduti per entrambe le strade', () => {
  const x = v({ tipo: 'semaforo', data_violazione: '2026-01-10', modo: 'posta', data_notifica: '2026-02-01', veicolo_tuo: true });
  assert.equal(x.verdetto.tono, 'no');
  assert.match(x.verdetto.titolo, /scaduti/);
});

test('Valle d\'Aosta: ricorso al Presidente della Regione', () => {
  const x = v({ provincia: 'AO', tipo: 'sosta' });
  assert.equal(x.destinatari.prefetto.pec, 'sanzioni_amministrative@pec.regione.vda.it');
});

test('documenti: i dati mancanti restano da completare, i motivi entrano nel testo', () => {
  const r = { tipo: 'semaforo', data_violazione: '2026-04-02', modo: 'posta', data_notifica: '2026-09-20', data_spedizione: '2026-07-10', veicolo_tuo: true, provincia: 'TO', importo: 180 };
  const x = v(r);
  const p = ricorsoPrefetto(r, x);
  assert.match(p, /Prefettura di Torino/);
  assert.match(p, /art\. 201, comma 5/);
  assert.match(p, /campo-vuoto">nome e cognome/);
  const g = ricorsoGiudiceDiPace(r, x);
  assert.match(g, /art\. 7, comma 8/);
  assert.match(g, /43,00/);
});
