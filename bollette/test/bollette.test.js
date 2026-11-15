import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import PARAMETRI from '../src/dati/parametri.js';
import COMUNI from '../src/dati/comuni.js';
import { confronta, testo, quoteRegolate, spesaOfferta, progressivo, exCassaMezzogiorno, nonStimabile, compatibile, mancanti, CAMBIO, FONTI } from '../src/regole.js';
import { profiloDa } from '../src/domande.js';

const LUCE = JSON.parse(fs.readFileSync(new URL('../dati/luce.json', import.meta.url)));
const GAS = JSON.parse(fs.readFileSync(new URL('../dati/gas.json', import.meta.url)));
const vicino = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} invece di ${b}`);

// Profili tipo del brief: 2.700 kWh, 3 kW, residente; 1.400 Smc con riscaldamento. Roma e Milano.
const LUCE_TIPO = { fornitura: 'luce', consumo: 2700, potenza: 3, residente: true, regione: '03', comune: '015146' };
const GAS_TIPO = { fornitura: 'gas', consumo: 1400, regione: '03', comune: '015146', riscaldamento: true };

// Offerte finte, nello stesso formato di dati/*.json.
const FISSA = { c: 'FISSA', v: 0, n: 'Fissa prova', t: 'F', d: 12, fine: '2026-12-31', f: '01', comp: [['04', 'Prezzo', [['03', '01', 0.12]]], ['01', 'Quota', [['01', null, 120]]]], disp: [['14']] };
const VARIABILE = { c: 'VAR', v: 0, n: 'Variabile prova', t: 'V', d: -1, fine: '2026-12-31', f: '01', comp: [['04', 'SPREAD', [['03', '01', 0.01]]], ['01', 'Quota', [['01', null, 96]]]], idx: [['12', null, null]], disp: [['14']] };
const GAS_FISSA = { c: 'GF', v: 0, n: 'Gas fisso prova', t: 'F', d: 12, fine: '2026-12-31', comp: [['04', 'Prezzo', [['04', null, 0.9]]], ['01', 'Quota', [['01', null, 120]]]] };
const GAS_VAR = { c: 'GV', v: 0, n: 'Gas variabile prova', t: 'V', d: -1, fine: '2026-12-31', comp: [['04', 'SPREAD', [['04', null, 0.1]]]], idx: [['14', null, null]] };
const DATI_FINTI = (offerte) => ({ aggiornato: '2026-11-15', venditori: [['Venditore Prova S.p.A.', '00000000000']], offerte });

test('trasporto e oneri della luce: identici ai valori ARERA del cliente tipo (2.000 kWh, 3 kW, IV trimestre 2026)', () => {
  // Comunicato ARERA del 29/9/2026: trasporto e contatore 6,18 c€/kWh, oneri di sistema 3,32 c€/kWh.
  const q = quoteRegolate({ ...LUCE_TIPO, consumo: 2000 });
  vicino(q.rete / 2000 * 100, 6.18, 0.005, 'trasporto in centesimi per kWh');
  vicino(q.oneri / 2000 * 100, 3.32, 0.005, 'oneri in centesimi per kWh');
});

test('accise luce: esenzione dei residenti fino a 3 kW (150 kWh al mese) e casi limite', () => {
  const acc = PARAMETRI.luce.acc_c_r_l;
  assert.equal(quoteRegolate({ ...LUCE_TIPO, consumo: 1800 }).accise, 0, 'fino a 1.800 kWh niente accisa');
  vicino(quoteRegolate({ ...LUCE_TIPO, consumo: 2000 }).accise, 200 * acc, 1e-9, 'oltre 1.800: si paga solo la parte in più');
  vicino(quoteRegolate({ ...LUCE_TIPO, consumo: 2700 }).accise, (2700 - 1740) * acc, 1e-9, 'oltre 2.640 l\'esenzione si riduce');
  vicino(quoteRegolate({ ...LUCE_TIPO, consumo: 4440 }).accise, 4440 * acc, 1e-9, 'a 4.440 kWh l\'esenzione è finita');
  vicino(quoteRegolate({ ...LUCE_TIPO, potenza: 4.5 }).accise, 2700 * PARAMETRI.luce.acc_c_r_h, 1e-9, 'oltre 3 kW tutto tassato');
  const nr = quoteRegolate({ ...LUCE_TIPO, residente: false });
  vicino(nr.accise, 2700 * PARAMETRI.luce.acc_c_nr, 1e-9, 'non residente tutto tassato');
  vicino(nr.oneri, PARAMETRI.luce.asos_dnr_f + PARAMETRI.luce.arim_dnr_f + 2700 * (PARAMETRI.luce.asos_dnr_v + PARAMETRI.luce.arim_dnr_v), 1e-9, 'non residente: quota fissa degli oneri');
});

test('offerta luce a prezzo fisso, profilo 2.700 kWh: somma voce per voce con IVA al 10%', () => {
  const s = spesaOfferta(FISSA, LUCE_TIPO);
  const q = quoteRegolate(LUCE_TIPO);
  const L = PARAMETRI.luce;
  const atteso = (0.12 * 2700 + 120 + L.cdispd * 2700 + q.rete + q.oneri + q.accise) * (1 + L.iva_c);
  vicino(s.totale, atteso, 1e-6, 'totale');
  vicino(s.iva, s.totale / 1.1 * 0.1, 1e-6, 'IVA 10%');
  assert.ok(s.totale > 600 && s.totale < 1000, `ordine di grandezza plausibile: ${s.totale}`);
});

test('offerta luce variabile: indice per le perdite di rete (lambda) più spread; margine dal minimo al massimo dei 12 mesi', () => {
  const s = spesaOfferta(VARIABILE, LUCE_TIPO);
  const pun = PARAMETRI.indici.PUN.valore;
  vicino(s.energia, (pun * (1 + PARAMETRI.luce.lambda) + 0.01) * 2700, 1e-6, 'materia prima');
  const e = confronta(LUCE_TIPO, DATI_FINTI([VARIABILE, FISSA]));
  const v = e.elenco.find((x) => x.tipo === 'V');
  assert.equal(v.stima, true);
  assert.ok(v.margine[0] < v.margine[1] && v.margine[1] >= v.spesa - 0.01, 'il margine contiene la stima');
  assert.match(v.indice, /PUN mensile/);
});

test('gas: trasporto, oneri e vendita al dettaglio identici al cliente tipo ARERA (1.100 Smc, ottobre 2026)', () => {
  // Comunicato ARERA del 3/11/2026: trasporto e contatore 27,25 c€/Smc, oneri 4,98 c€/Smc, vendita al dettaglio 5,83 c€/Smc,
  // approvvigionamento 97,06 c€/Smc (CMEM 0,945436 + CCR).
  const p = { fornitura: 'gas', consumo: 1100, regione: '05', comune: '027042', riscaldamento: true };
  const q = quoteRegolate(p);
  vicino(q.rete / 1100 * 100, 27.25, 0.01, 'trasporto');
  vicino(q.oneri / 1100 * 100, 4.98, 0.01, 'oneri');
  const tutela = { t: 'V', comp: [], idx: [['06', null, null]], cr: ['03', '09', '10'] };
  const s = spesaOfferta(tutela, p);
  vicino(s.commercializzazione / 1100 * 100, 5.83, 0.01, 'vendita al dettaglio (QVD)');
  vicino(s.energia / 1100 * 100, 97.06, 0.05, 'approvvigionamento (CMEM + CCR)');
  // Con l'addizionale minima di legge (0,005165 €/mc), il totale ARERA è 176,80 c€/Smc.
  const par = { ...PARAMETRI, addizionali_gas: { ...PARAMETRI.addizionali_gas, '05': { nome: 'prova', scaglioni: [[null, 0.005165]] } } };
  const t = spesaOfferta(tutela, p, par);
  vicino(t.totale / 1100 * 100, 176.80, 0.2, 'prezzo totale per Smc');
});

test('gas 1.400 Smc: accise progressive Centro-Nord e Sud, IVA 10% fino a 480 Smc e 22% oltre', () => {
  vicino(progressivo(1400, PARAMETRI.accise_gas.centro_nord), 120 * 0.044 + 360 * 0.175 + 920 * 0.170, 1e-9, 'accisa Centro-Nord');
  vicino(progressivo(1400, PARAMETRI.accise_gas.ex_cassa_mezzogiorno), 120 * 0.038 + 360 * 0.135 + 920 * 0.120, 1e-9, 'accisa ex Cassa per il Mezzogiorno');
  const s = spesaOfferta(GAS_FISSA, GAS_TIPO);
  const imponibile = s.totale - s.iva;
  vicino(s.iva, imponibile * (480 * 0.10 + 920 * 0.22) / 1400, 1e-6, 'IVA ripartita per scaglione');
  assert.equal(quoteRegolate(GAS_TIPO).addizionale, 0, 'Lombardia: addizionale non applicata');
  vicino(quoteRegolate({ ...GAS_TIPO, regione: '09', comune: '048017' }).addizionale, 120 * 0.022 + 1280 * 0.030987, 1e-9, 'Toscana');
});

test('ex Cassa per il Mezzogiorno: regioni, province, isole e province da chiedere', () => {
  assert.equal(exCassaMezzogiorno('16', '072006'), true, 'Bari');
  assert.equal(exCassaMezzogiorno('12', '059011'), true, 'Latina');
  assert.equal(exCassaMezzogiorno('09', '049014'), true, 'Portoferraio (Elba)');
  assert.equal(exCassaMezzogiorno('09', '049009'), false, 'Livorno');
  assert.equal(exCassaMezzogiorno('12', '058091'), null, 'Roma: dipende dalla zona');
  assert.equal(exCassaMezzogiorno('03', '015146'), false, 'Milano');
  const e = confronta({ ...GAS_TIPO, regione: '12', comune: '058091' }, DATI_FINTI([GAS_FISSA]));
  assert.ok(e.elenco[0].margine && e.elenco[0].margine[0] < e.elenco[0].spesa, 'se non si sa, la spesa ha un margine verso il basso');
});

test('gas variabile: PSV più spread, senza perdite di rete; Psbil approssimato con il PSV se non ancora pubblicato', () => {
  const s = spesaOfferta(GAS_VAR, GAS_TIPO);
  vicino(s.energia, (PARAMETRI.indici.PSV.valore + 0.1) * 1400, 1e-6, 'materia prima gas');
  if (PARAMETRI.indici.Psbil.approssimato) assert.equal(PARAMETRI.indici.Psbil.valore, PARAMETRI.indici.PSV.valore);
});

test('sconti: senza condizioni nel calcolo; sconto solo su una parte del consumo; sconto fisso dopo l\'IVA', () => {
  const conSconto = { ...FISSA, sc: [['03', '03', 0.05, true, null, null, 0, 840]] };
  const base = spesaOfferta(FISSA, LUCE_TIPO), s = spesaOfferta(conSconto, LUCE_TIPO);
  vicino(base.totale - s.totale, 0.05 * 840 * 1.1, 1e-6, 'sconto sui primi 840 kWh, con IVA');
  const fisso = spesaOfferta({ ...FISSA, sc: [['01', '05', 30, false]] }, LUCE_TIPO);
  vicino(base.totale - fisso.totale, 30, 1e-6, 'sconto fisso fuori IVA');
  const perc = spesaOfferta({ ...FISSA, sc: [['03', '06', 10, true]] }, LUCE_TIPO);
  vicino(base.totale - perc.totale, 0.12 * 2700 * 0.1 * 1.1, 1e-6, 'sconto del 10% sul prezzo dell\'energia');
});

test('casi limite: dati mancanti, offerte fuori zona o per non residenti, offerte non stimabili, Sardegna per il gas', () => {
  assert.deepEqual(mancanti({ fornitura: 'luce', consumo: 2700 }), ['comune', 'potenza', 'residente']);
  const vuoto = confronta({ fornitura: 'luce' }, LUCE);
  assert.equal(vuoto.stato, 'dato');
  assert.match(testo(vuoto), /serve/);
  assert.equal(compatibile({ ...FISSA, z: { r: ['12'] } }, LUCE_TIPO), 'zona');
  assert.equal(compatibile({ ...FISSA, z: { p: ['015'] } }, LUCE_TIPO), null, 'la provincia di Milano va bene');
  assert.equal(compatibile({ ...FISSA, r: '02' }, LUCE_TIPO), 'solo non residenti');
  assert.equal(compatibile({ ...FISSA, lim: [null, 2000, null, null] }, LUCE_TIPO), 'consumo');
  assert.match(nonStimabile({ ...GAS_FISSA, cr: ['06'] }, 'gas'), /QTint/);
  assert.match(nonStimabile({ ...FISSA, comp: [['01', 'Quota', [['01', null, 120]]]] }, 'luce'), /prezzo dell'energia/);
  assert.equal(confronta({ ...GAS_TIPO, regione: '20', comune: '092009' }, GAS).stato, 'fuori');
  const assurda = { ...FISSA, c: 'X', comp: [['04', 'Prezzo', [['03', '01', 184.9]]]] };
  const e = confronta(LUCE_TIPO, DATI_FINTI([assurda, FISSA]));
  assert.deepEqual(e.elenco.map((x) => x.codice), ['FISSA'], 'un prezzo in €/MWh scritto come €/kWh si scarta');
});

test('confronto con quanto paghi oggi: dalla spesa annua o dal prezzo e dalla quota fissa', () => {
  const e = confronta({ ...LUCE_TIPO, attuale: { spesa: 1100 } }, DATI_FINTI([FISSA, VARIABILE]));
  vicino(e.risparmio.F, 1100 - e.migliori.F.spesa, 0.01, 'risparmio sul fisso');
  const p = confronta({ ...LUCE_TIPO, attuale: { prezzo: 0.12, quotaFissa: 10 } }, DATI_FINTI([FISSA]));
  vicino(p.attuale.totale, p.migliori.F.spesa, 0.01, 'stesso prezzo e stessa quota fissa: stessa spesa');
  const t = testo(e);
  assert.match(t, /Oggi paghi circa 1\.100 €/);
  assert.match(t, /Venditore Prova/);
  assert.match(t, /gratis/);
  assert.ok(!/Claude|Anthropic/.test(t));
});

test('il profilo dalle risposte del questionario', () => {
  const r = { fornitura: 'entrambe', consumo_luce: 2700, potenza: 'altra', potenza_altra: 4, residente: false, consumo_gas: 900, riscaldamento: false, come_paghi: 'prezzo', prezzo_gas: 1.1, fissa_gas: 8 };
  const c = { istat: '058091', regione: '12' };
  const l = profiloDa(r, 'luce', c), g = profiloDa(r, 'gas', c);
  assert.equal(l.potenza, 4); assert.equal(l.residente, false); assert.equal(l.consumo, 2700);
  assert.deepEqual(g.attuale, { prezzo: 1.1, quotaFissa: 8 }); assert.equal(g.riscaldamento, false); assert.equal(g.comune, '058091');
});

test('i passi per cambiare fornitore e le fonti hanno indirizzi ufficiali', () => {
  assert.ok(CAMBIO.length >= 5);
  for (const p of CAMBIO) assert.match(p.fonte.url, /^https:\/\/www\.arera\.it\//);
  assert.ok(CAMBIO.some((p) => /onere/.test(p.testo)), 'l\'eccezione degli oneri di recesso anticipato è detta');
  for (const f of Object.values(FONTI)) assert.match(f.url, /^https:\/\//);
});

test('i dati preparati: offerte domestiche, prezzi, venditori, parametri e Comuni', () => {
  for (const [nome, d] of [['luce', LUCE], ['gas', GAS]]) {
    assert.match(d.aggiornato, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(d.offerte.length > 500, `${nome}: ${d.offerte.length} offerte`);
    const codici = new Set();
    for (const of of d.offerte) {
      assert.match(of.c, /^\S{32}$/, `${nome}: codice ${of.c}`);
      codici.add(of.c);
      assert.ok(d.venditori[of.v]?.[0], `${nome}: venditore di ${of.c}`);
      assert.ok(['F', 'V', 'M', 'FLAT'].includes(of.t));
    }
    assert.ok(codici.size > d.offerte.length * 0.95, `${nome}: codici quasi tutti diversi`);
    const e = confronta(nome === 'luce' ? LUCE_TIPO : GAS_TIPO, d);
    assert.equal(e.stato, 'ok');
    assert.ok(e.elenco.length > 300, `${nome}: ${e.elenco.length} offerte stimate`);
    const spese = e.elenco.map((x) => x.spesa);
    const mediana = spese[Math.floor(spese.length / 2)];
    assert.ok(nome === 'luce' ? mediana > 500 && mediana < 2500 : mediana > 1000 && mediana < 5000, `${nome}: mediana plausibile ${mediana}`);
    assert.ok(spese[0] > 0, `${nome}: nessuna spesa negativa`);
  }
  for (const k of ['sigma1', 'sigma2', 'sigma3', 'asos_dr', 'arim_dr', 'cdispd', 'lambda', 'iva_c', 'acc_c_r_l']) assert.equal(typeof PARAMETRI.luce[k], 'number', k);
  for (const k of ['qt', 'rs', 'ug1', 're', 'ug3', 'ug2s', 'qvd_f_d', 'tau1_cc1_a1', 'tau3_f2_a6']) assert.equal(typeof PARAMETRI.gas[k], 'number', k);
  for (const i of ['PUN', 'PSV']) { assert.ok(PARAMETRI.indici[i].valore > 0); assert.match(PARAMETRI.indici[i].url, /^https:\/\//); }
  assert.ok(COMUNI.length > 7800);
  assert.ok(COMUNI.every(([istat, nome, sigla, reg]) => /^\d{6}$/.test(istat) && nome && /^[A-Z]{2}$/.test(sigla) && /^\d{2}$/.test(reg)));
});
