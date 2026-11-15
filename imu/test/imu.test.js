// Test delle regole di «Quanto pago di IMU?» e dei dati preparati.
// node --test imu/test/*.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { calcolaImu, testo, mesiPossesso, arrotonda, moltiplicatore, prospettoDellAnno, ALIQUOTE_BASE } from '../src/regole.js';

const dir = new URL('../', import.meta.url);
const BASE25 = { abitazione_lusso: 0.6, assimilazione_anziani: false, rurali: 0.1, gruppo_d: 1.06, terreni: 0.76, aree: 1.06, altri: 1.06 };
const BASE26 = { ...BASE25, altri: 1.14, assimilazione_anziani: true };
// Comuni di prova (codici catastali veri, aliquote di prova)
const COMUNI = {
  X001: { nome: 'Prova', sigla: 'RM', anni: {
    2025: [{ base: BASE25, diff: [], esenzioni: [] }],
    2026: [{ base: BASE26, diff: [
      { fattispecie: 'Altri fabbricati (fabbricati diversi dall\'abitazione principale e dai fabbricati appartenenti al gruppo catastale D)', condizioni: ['Abitazione locata o in comodato', 'Tipo contratto: Comodato d\'uso gratuito'], categorie: ['A/2', 'A/3'], aliquota: 0.76 },
      { fattispecie: 'Altri fabbricati (fabbricati diversi dall\'abitazione principale e dai fabbricati appartenenti al gruppo catastale D)', condizioni: ['Immobili di categoria C'], categorie: ['C/1'], aliquota: 0.96 },
    ], esenzioni: [] }],
  } },
  X002: { nome: 'Senza prospetto 2026', sigla: 'MI', anni: { 2025: [{ base: { ...BASE25, altri: 0.96 }, diff: [], esenzioni: [] }] } },
  X003: { nome: 'Mai pubblicato', sigla: 'NA', anni: {} },
  X004: { nome: 'Montano', sigla: 'BL', anni: { 2025: [{ base: { ...BASE25, terreni: 'esente' }, diff: [], esenzioni: [] }], 2026: [{ base: { ...BASE25, terreni: 'esente' }, diff: [], esenzioni: [] }] } },
  X005: { nome: 'Fuso', sigla: 'BG', anni: { 2026: [{ ex_comune: 'Alfa', base: BASE26, diff: [], esenzioni: [] }, { ex_comune: 'Beta', base: { ...BASE26, altri: 0.9 }, diff: [], esenzioni: [] }] } },
  L378: { nome: 'Trento', sigla: 'TN', anni: {} },
};
const calc = (immobili, opz = {}) => calcolaImu(immobili, { anno: 2026, oggi: '2026-11-15', comuni: COMUNI, ...opz });
const fab = (o) => ({ comune: 'X001', tipo: 'fabbricato', quota: 100, ...o });

test('abitazione principale non di lusso e la sua pertinenza: esenti, niente F24', () => {
  const e = calc([fab({ categoria: 'A/2', rendita: 700, uso: 'abitazione_principale' }), fab({ categoria: 'C/6', rendita: 100, uso: 'pertinenza' })]);
  assert.equal(e.righe[0].stato, 'esente');
  assert.equal(e.righe[1].stato, 'esente');
  assert.equal(e.unica, 0);
  assert.equal(e.f24.unica.length, 0);
  assert.equal(e.completo, true);
});

test('A/1 abitazione principale: aliquota del Comune e detrazione di 200 euro, pertinenza con lo stesso codice 3912', () => {
  const e = calc([fab({ categoria: 'A/1', rendita: 2000, uso: 'abitazione_principale' }), fab({ categoria: 'C/6', rendita: 150, uso: 'pertinenza' })]);
  const [casa, box] = e.righe;
  assert.equal(casa.baseImponibile, 2000 * 1.05 * 160); // 336.000
  assert.equal(casa.imposta, 336000 * 0.006 - 200); // 1816
  assert.equal(casa.detrazione, 200);
  assert.equal(box.imposta, 151.2); // 25.200 × 0,6%
  const r = e.f24.unica.find((x) => x.codice_tributo === '3912');
  assert.equal(r.numero_immobili, 2);
  assert.equal(r.detrazione, 200);
  assert.equal(r.importo, arrotonda(1816 + 151.2)); // 1967
  // acconto: semestre con l'aliquota 2025 (uguale) e metà detrazione
  assert.equal(e.f24.acconto.find((x) => x.codice_tributo === '3912').importo, arrotonda(1008 - 100 + 75.6));
});

test('detrazione divisa tra due proprietari che ci abitano e mai oltre l\'imposta', () => {
  const e = calc([fab({ categoria: 'A/8', rendita: 100, uso: 'abitazione_principale', quota: 50, abitanti: 2 })]);
  // imposta lorda 16.800 × 0,6% × 50% = 50,40; detrazione teorica 100: si ferma a 50,40
  assert.equal(e.righe[0].detrazione, 50.4);
  assert.equal(e.righe[0].imposta, 0);
});

test('seconda casa: moltiplicatore 160, aliquota «altri fabbricati» del prospetto 2026, codice 3918', () => {
  const e = calc([fab({ categoria: 'A/3', rendita: 545.06, uso: 'disposizione' })]);
  const r = e.righe[0];
  assert.equal(moltiplicatore('A/3'), 160);
  assert.equal(r.baseImponibile, Math.round(545.06 * 1.05 * 160 * 100) / 100);
  assert.equal(r.aliquota, 1.14);
  assert.equal(r.origineAliquota, 'prospetto');
  assert.equal(r.aliquotaAcconto, 1.06); // l'acconto usa il prospetto 2025
  assert.equal(r.codice, 3918);
  assert.ok(r.alternative.length >= 1, 'propone le aliquote differenziate per A/3');
});

test('comodato a un figlio con i requisiti: base dimezzata; senza requisiti nessuna riduzione; requisiti non detti: serve un dato', () => {
  const si = calc([fab({ categoria: 'A/2', rendita: 650, uso: 'comodato', comodato_requisiti: true })]).righe[0];
  assert.equal(si.baseRidotta, 650 * 1.05 * 160 / 2);
  assert.equal(si.imposta, Math.round(650 * 1.05 * 160 / 2 * 0.0114 * 100) / 100);
  const no = calc([fab({ categoria: 'A/2', rendita: 650, uso: 'comodato', comodato_requisiti: false })]).righe[0];
  assert.equal(no.baseRidotta, 650 * 1.05 * 160);
  const boh = calc([fab({ categoria: 'A/2', rendita: 650, uso: 'comodato' })]);
  assert.equal(boh.righe[0].stato, 'dato');
  assert.equal(boh.servono[0].campo, 'comodato_requisiti');
  // aliquota differenziata scelta (indice 0 del prospetto 2026: 0,76%)
  const diff = calc([fab({ categoria: 'A/2', rendita: 650, uso: 'comodato', comodato_requisiti: true, diff: 0 })]).righe[0];
  assert.equal(diff.aliquota, 0.76);
  assert.equal(diff.origineAliquota, 'differenziata');
  // A/1 in comodato: niente riduzione
  const lusso = calc([fab({ categoria: 'A/1', rendita: 650, uso: 'comodato', comodato_requisiti: true })]).righe[0];
  assert.equal(lusso.baseRidotta, 650 * 1.05 * 160);
});

test('canone concordato: imposta ridotta al 75%', () => {
  const r = calc([fab({ categoria: 'A/3', rendita: 480, uso: 'concordato' })]).righe[0];
  assert.equal(r.imposta, Math.round(480 * 1.05 * 160 * 0.0114 * 0.75 * 100) / 100);
});

test('pensionato residente all\'estero: imposta alla metà (legge 178/2020)', () => {
  const r = calc([fab({ categoria: 'A/3', rendita: 480, uso: 'pensionato_estero' })]).righe[0];
  assert.equal(r.imposta, Math.round(480 * 1.05 * 160 * 0.0114 * 0.5 * 100) / 100);
});

test('terreno agricolo: reddito dominicale +25% × 135; esente se coltivatore o se il Comune lo indica esente', () => {
  const r = calc([{ comune: 'X001', tipo: 'terreno', reddito_dominicale: 210.4 }]).righe[0];
  assert.equal(r.baseImponibile, Math.round(210.4 * 1.25 * 135 * 100) / 100);
  assert.equal(r.imposta, Math.round(210.4 * 1.25 * 135 * 0.0076 * 100) / 100);
  assert.equal(r.codice, 3914);
  assert.equal(calc([{ comune: 'X001', tipo: 'terreno', reddito_dominicale: 210.4, coltivatore: true }]).righe[0].stato, 'esente');
  assert.equal(calc([{ comune: 'X004', tipo: 'terreno', reddito_dominicale: 210.4 }]).righe[0].stato, 'esente');
});

test('area fabbricabile: valore venale, aliquota aree, codice 3916; senza valore serve un dato', () => {
  const r = calc([{ comune: 'X001', tipo: 'area', valore_venale: 85000 }]).righe[0];
  assert.equal(r.imposta, 85000 * 0.0106);
  assert.equal(r.codice, 3916);
  assert.equal(calc([{ comune: 'X001', tipo: 'area' }]).servono[0].campo, 'valore_venale');
});

test('mesi di possesso: la regola dei 15 giorni e il giorno del rogito che conta per chi compra', () => {
  // giugno ha 30 giorni: comprato il 16 → 15 giorni, pari: il mese va a chi compra
  assert.deepEqual(mesiPossesso(2026, '2026-06-16', null).elenco, [6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual(mesiPossesso(2026, null, '2026-06-16').elenco, [1, 2, 3, 4, 5]);
  // luglio ha 31 giorni: dal 16 sono 16 giorni (conta), dal 17 sono 15 (non conta)
  assert.equal(mesiPossesso(2026, '2026-07-16', null).mesi, 6);
  assert.equal(mesiPossesso(2026, '2026-07-17', null).mesi, 5);
  assert.equal(mesiPossesso(2026, null, '2026-07-17').mesi, 7); // il venditore tiene luglio (16 giorni)
  // febbraio 2026 ha 28 giorni: dal 15 sono 14, pari, conta per chi compra
  assert.equal(mesiPossesso(2026, '2026-02-15', null).mesi, 11);
  // compratore e venditore insieme fanno sempre 12 mesi
  for (const d of ['2026-03-15', '2026-03-16', '2026-03-17', '2026-04-15', '2026-04-16', '2026-09-30']) {
    assert.equal(mesiPossesso(2026, d, null).mesi + mesiPossesso(2026, null, d).mesi, 12, d);
  }
  // nel calcolo: casa comprata il 16 aprile, l'acconto conta i mesi tra gennaio e giugno
  const r = calc([fab({ categoria: 'A/3', rendita: 1000, uso: 'disposizione', dal: '2026-04-16' })]).righe[0];
  assert.equal(r.mesi, 9);
  assert.equal(r.mesiPrimoSemestre, 3); // aprile (15 giorni su 30, pari: va a chi compra), maggio, giugno
  assert.equal(r.imposta, Math.round(1000 * 1.05 * 160 * 0.0114 * 9 / 12 * 100) / 100);
});

test('quote di proprietà: metà casa, metà imposta', () => {
  const intera = calc([fab({ categoria: 'A/2', rendita: 800, uso: 'disposizione' })]).righe[0].imposta;
  const meta = calc([fab({ categoria: 'A/2', rendita: 800, uso: 'disposizione', quota: 50 })]).righe[0].imposta;
  assert.equal(meta, intera / 2);
  assert.equal(calc([fab({ categoria: 'A/2', rendita: 800, uso: 'disposizione', quota: 0 })]).servono[0].campo, 'quota');
});

test('arrotondamenti: all\'euro riga per riga, fino a 49 centesimi per difetto; il saldo è il dovuto meno l\'acconto versato', () => {
  assert.equal(arrotonda(10.49), 10);
  assert.equal(arrotonda(10.5), 11);
  assert.equal(arrotonda(10.51), 11);
  assert.equal(arrotonda(0.49), 0);
  const e = calc([fab({ categoria: 'A/3', rendita: 545.06, uso: 'disposizione' })]);
  const annua = 545.06 * 1.05 * 160 * 0.0114; // 1.043,93
  const acc = 545.06 * 1.05 * 160 * 0.0106 / 2; // 485,27
  assert.equal(e.f24.unica[0].importo, arrotonda(annua));
  assert.equal(e.f24.acconto[0].importo, arrotonda(acc));
  assert.equal(e.f24.saldo[0].importo, arrotonda(annua) - arrotonda(acc));
  assert.equal(e.acconto + e.saldo, e.unica);
});

test('gruppo D: 0,76% allo Stato (3925), il resto al Comune (3930); D/10 è rurale (3913)', () => {
  const e = calc([fab({ categoria: 'D/7', rendita: 6200, uso: 'impresa' })]);
  const base = 6200 * 1.05 * 65;
  assert.equal(e.f24.unica.find((x) => x.codice_tributo === '3925').importo, arrotonda(base * 0.0076));
  assert.equal(e.f24.unica.find((x) => x.codice_tributo === '3930').importo, arrotonda(base * (0.0106 - 0.0076)));
  const r = calc([fab({ categoria: 'D/10', rendita: 1000, uso: 'rurale' })]).righe[0];
  assert.equal(r.codice, 3913);
  assert.equal(r.aliquota, 0.1);
  assert.equal(moltiplicatore('C/1'), 55);
  assert.equal(moltiplicatore('A/10'), 80);
  assert.equal(moltiplicatore('D/5'), 80);
  assert.equal(moltiplicatore('C/3'), 140);
});

test('aliquote: prospetto dell\'anno, poi quello dell\'anno prima, poi le aliquote di base; fusione e Trentino', () => {
  assert.equal(prospettoDellAnno(COMUNI.X001, 2026).stato, 'prospetto');
  assert.equal(prospettoDellAnno(COMUNI.X002, 2026).stato, 'anno_prima');
  const b = prospettoDellAnno(COMUNI.X003, 2026);
  assert.equal(b.stato, 'base_legge');
  assert.equal(b.voce.base.altri, ALIQUOTE_BASE.altri);
  assert.equal(prospettoDellAnno(COMUNI.X003, 2025).stato, 'base_legge');
  assert.equal(prospettoDellAnno(COMUNI.X001, 2027).stato, 'anno_prima'); // 2027 non ancora pubblicato
  assert.equal(prospettoDellAnno(COMUNI.X005, 2026).stato, 'fusione');
  assert.equal(prospettoDellAnno(COMUNI.X005, 2026, { exComune: 'Beta' }).voce.base.altri, 0.9);
  assert.equal(calc([fab({ comune: 'X002', categoria: 'A/2', rendita: 500, uso: 'disposizione' })]).righe[0].aliquota, 0.96);
  const f = calc([fab({ comune: 'X005', categoria: 'A/2', rendita: 500, uso: 'disposizione' })]);
  assert.equal(f.servono[0].campo, 'ex_comune');
  const tn = calc([fab({ comune: 'L378', categoria: 'A/2', rendita: 500, uso: 'disposizione' })]);
  assert.equal(tn.righe[0].stato, 'non_imu');
  // un Comune che non conosciamo: serve l'aliquota, mai stimata
  const ignoto = calc([fab({ comune: 'Z999', categoria: 'A/2', rendita: 500, uso: 'disposizione' })]);
  assert.equal(ignoto.servono[0].campo, 'aliquota');
  const scritta = calc([fab({ comune: 'Z999', categoria: 'A/2', rendita: 500, uso: 'disposizione', aliquota: 1.06 })]).righe[0];
  assert.equal(scritta.origineAliquota, 'tua');
  assert.equal(scritta.imposta, Math.round(500 * 1.05 * 160 * 0.0106 * 100) / 100);
});

test('categorie E esenti, pertinenze oltre una per categoria pagano, scadenze e testo semplice', () => {
  assert.equal(calc([fab({ categoria: 'E/7', rendita: 1000, uso: 'disposizione' })]).righe[0].stato, 'esente');
  const e = calc([fab({ categoria: 'A/2', rendita: 700, uso: 'abitazione_principale' }), fab({ categoria: 'C/6', rendita: 100, uso: 'pertinenza' }), fab({ categoria: 'C/6', rendita: 90, uso: 'pertinenza' })]);
  assert.equal(e.righe[1].stato, 'esente');
  assert.equal(e.righe[2].stato, 'calcolato');
  assert.equal(e.righe[2].codice, 3918);
  assert.deepEqual(e.scadenze.map((s) => s.data), ['2026-06-16', '2026-12-16']);
  assert.equal(e.scadenze[0].scaduta, true);
  const t = testo(e);
  assert.match(t, /IMU 2026/);
  assert.match(t, /3918/);
  assert.match(t, /16 dicembre 2026/);
  assert.doesNotMatch(t, /undefined|NaN/);
});

test('aliquota differenziata scelta: per l\'acconto si cerca la stessa nel prospetto dell\'anno prima, anche se il testo cambia di un accento', () => {
  const diff = (cond, aliquota) => ({ fattispecie: 'Altri fabbricati (fabbricati diversi)', condizioni: ['Abitazione locata o in comodato', cond], aliquota });
  const comuni = { Y001: { nome: 'Prova', sigla: 'TO', anni: {
    2025: [{ base: BASE25, diff: [diff('Destinazione d\'uso: Purché la utilizzi come abitazione principale.', 0.5)], esenzioni: [] }],
    2026: [{ base: BASE26, diff: [diff('Destinazione d\'uso: Purche\' la utilizzi come abitazione principale.', 0.575)], esenzioni: [] }],
  } } };
  const r = calcolaImu([fab({ comune: 'Y001', categoria: 'A/2', rendita: 800, uso: 'concordato', diff: 0 })], { anno: 2026, comuni }).righe[0];
  assert.equal(r.aliquota, 0.575);
  assert.equal(r.aliquotaAcconto, 0.5);
  assert.equal(r.imposta, Math.round(800 * 1.05 * 160 * 0.00575 * 0.75 * 100) / 100);
});

// ---------- i dati preparati da scripts/imu-dati.py ----------

test('dati: indice dei Comuni e prospetti per provincia, aliquote nella forchetta di legge', { skip: !existsSync(new URL('dati/indice.json', dir)) }, () => {
  const indice = JSON.parse(readFileSync(new URL('dati/indice.json', dir), 'utf8'));
  assert.ok(indice.comuni.length > 7800);
  assert.deepEqual(indice.anni, [2025, 2026]);
  const roma = indice.comuni.find((c) => c[0] === 'H501');
  assert.equal(roma[1], 'Roma');
  const rm = JSON.parse(readFileSync(new URL('dati/p/RM.json', dir), 'utf8'));
  const p = prospettoDellAnno(rm.comuni.H501, 2026);
  assert.ok(['prospetto', 'anno_prima'].includes(p.stato), p.stato);
  let n = 0;
  let fuori = 0;
  for (const sigla of ['RM', 'MI', 'NA', 'TO', 'BO', 'PA', 'BA', 'FI']) {
    const f = new URL(`dati/p/${sigla}.json`, dir);
    if (!existsSync(f)) continue;
    for (const c of Object.values(JSON.parse(readFileSync(f, 'utf8')).comuni)) {
      for (const voci of Object.values(c.anni)) for (const v of voci) {
        if (!v.base) continue;
        for (const [k, x] of Object.entries(v.base)) {
          if (typeof x !== 'number') continue;
          n++;
          if (x < 0 || x > 1.14) fuori++;
        }
      }
    }
  }
  assert.ok(n > 1000, `aliquote lette: ${n}`);
  assert.equal(fuori, 0);
  // nessun Comune del Trentino-Alto Adige o del Friuli Venezia Giulia ha prospetti IMU
  for (const s of ['TN', 'BZ', 'UD']) assert.equal(existsSync(new URL(`dati/p/${s}.json`, dir)), false, s);
});
