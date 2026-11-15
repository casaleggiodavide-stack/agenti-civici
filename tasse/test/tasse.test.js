import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  perScaglioni, detrazioneLavoro, ulterioreDetrazione, sommaEsente, stimaIrpef, addizionaleRegionale, addizionaleComunale,
  ripartisci, quoteFunzioni, quotaDebito, quoteComune, doveVanno, testo, preparaComune, IRPEF, FONTI, VERIFICATO,
} from '../src/regole.js';

const DATI = new URL('../dati/', import.meta.url);
const leggi = (p) => JSON.parse(fs.readFileSync(new URL(p, DATI), 'utf-8'));
const STATO = leggi('stato.json');
const somma = (a) => Math.round(a.reduce((x, y) => x + y, 0) * 1e6) / 1e6;

test('IRPEF 2026: tre scaglioni 23, 33 e 43 per cento', () => {
  assert.deepEqual(IRPEF, [[28000, 23], [50000, 33], [null, 43]]);
  assert.equal(perScaglioni(28000, IRPEF), 6440);
  assert.equal(perScaglioni(50000, IRPEF), 13700); // 6.440 + 22.000 × 33%
  assert.equal(perScaglioni(0, IRPEF), 0);
  assert.equal(perScaglioni(-5, IRPEF), 0);
});

test('dipendente con 15.000 euro: 1.495 di IRPEF, più somma esente e trattamento integrativo', () => {
  const s = stimaIrpef('dipendente', 15000);
  assert.equal(s.lorda, 3450);
  assert.deepEqual(s.detrazioni.map((d) => d.euro), [1955]);
  assert.equal(s.netta, 1495);
  assert.deepEqual(s.bonus.map((b) => b.euro), [795, 1200]); // 5,3% di 15.000; trattamento integrativo
});

test('dipendente con 28.000 euro: detrazione 1.910 + 65, ulteriore detrazione 1.000', () => {
  const s = stimaIrpef('dipendente', 28000);
  assert.equal(s.lorda, 6440);
  assert.deepEqual(s.detrazioni.map((d) => d.euro), [1975, 1000]);
  assert.equal(s.netta, 3465);
  assert.equal(s.bonus.length, 0);
  assert.match(s.note.join(' '), /trattamento integrativo/);
});

test('dipendente con 35.000 euro: rapporto a quattro decimali e ulteriore detrazione decrescente', () => {
  // 1.910 × 0,6818 (15.000/22.000 troncato) = 1.302,24 + 65; ulteriore 1.000 × 5.000/8.000 = 625
  assert.equal(detrazioneLavoro('dipendente', 35000), 1367.24);
  assert.equal(ulterioreDetrazione(35000), 625);
  assert.equal(stimaIrpef('dipendente', 35000).netta, 6757.76);
});

test('dipendente con 50.000 e 80.000 euro: nessuna detrazione da lavoro', () => {
  assert.equal(stimaIrpef('dipendente', 50000).netta, 13700);
  assert.equal(detrazioneLavoro('dipendente', 50000), 0);
  assert.equal(stimaIrpef('dipendente', 80000).netta, 26600); // 13.700 + 30.000 × 43%
});

test('soglie: no tax area, cuneo, somma esente', () => {
  assert.equal(stimaIrpef('dipendente', 8500).netta, 0); // 1.955 = 1.955
  assert.equal(stimaIrpef('pensionato', 8500).netta, 0);
  assert.equal(ulterioreDetrazione(20000), 0);
  assert.equal(ulterioreDetrazione(20001), 1000);
  assert.equal(ulterioreDetrazione(32000), 1000);
  assert.equal(ulterioreDetrazione(40000), 0);
  assert.equal(sommaEsente(8500), 603.5); // 7,1%
  assert.equal(sommaEsente(8501), 450.55); // 5,3%
  assert.equal(sommaEsente(20000), 960); // 4,8%
  assert.equal(sommaEsente(20001), 0);
});

test('pensionato e autonomo: le loro detrazioni', () => {
  // 700 + 1.255 × 0,6666 = 1.536,58
  assert.equal(stimaIrpef('pensionato', 15000).netta, 1913.42);
  assert.equal(detrazioneLavoro('pensionato', 26000), cent(700 + 1255 * 0.1025 + 50));
  // 500 × 0,909 (20.000/22.000 troncato)
  assert.equal(stimaIrpef('autonomo', 30000).netta, 6645.5);
  assert.equal(detrazioneLavoro('autonomo', 12000), cent(500 + 765 * 0.7111 + 50));
});
function cent(n) { return Math.round(n * 100) / 100; }

test('addizionale regionale: scaglioni, aliquota su tutto il reddito sotto soglia, esenzione, detrazioni', () => {
  const lom = STATO.regioni.Lombardia;
  assert.equal(addizionaleRegionale(lom, 35000, 6757.76).euro, 510.3); // 15.000×1,23% + 13.000×1,58% + 7.000×1,72%
  assert.equal(addizionaleRegionale(lom, 35000, 0).euro, 0); // niente IRPEF, niente addizionale
  const laz = STATO.regioni.Lazio;
  assert.equal(addizionaleRegionale(laz, 28000, 3465).euro, 484.4); // 1,73% su tutto fino a 28.000
  assert.equal(addizionaleRegionale(laz, 29000, 3800).euro, cent(15000 * 0.0173 + 14000 * 0.0333 - 60));
  assert.equal(addizionaleRegionale(STATO.regioni["Valle d'Aosta"], 15000, 1495).euro, 0);
  assert.equal(addizionaleRegionale(STATO.regioni['Friuli Venezia Giulia'], 20000, 2000).euro, 246); // 1,23% su tutto
  assert.equal(addizionaleRegionale(STATO.regioni.Trento, 30000, 3000).euro, 0); // deduzione di 30.000
  assert.equal(addizionaleRegionale(STATO.regioni.Bolzano, 40000, 6000).euro, cent(40000 * 0.0123 - 430.5));
  assert.equal(addizionaleRegionale(null, 30000, 3000).stato, 'serve');
});

test('addizionale comunale: esenzione su tutto il reddito, scaglioni, Comune senza addizionale, dati da verificare', () => {
  const esente = { scaglioni: [[null, 0.8]], esenzione: 23000 };
  assert.equal(addizionaleComunale(esente, 23000, 4000).euro, 0);
  assert.equal(addizionaleComunale(esente, 23001, 4000).euro, 184.01); // sopra la soglia si paga su tutto
  const scaglioni = { scaglioni: [[28000, 0.5], [50000, 0.7], [null, 0.8]] };
  assert.equal(addizionaleComunale(scaglioni, 60000, 15000).euro, 140 + 154 + 80);
  assert.equal(addizionaleComunale({ nessuna: true }, 60000, 15000).euro, 0);
  assert.equal(addizionaleComunale({ da_verificare: true, dubbi: ['scaglioni non in ordine'] }, 30000, 3000).stato, 'serve');
  assert.match(addizionaleComunale({ scaglioni: [[null, 0.9]], prorogata: true, anno: 2025 }, 30000, 3000).note[0], /aliquote del 2025/);
});

test('ripartizione con i resti più grandi: le parti sommano esattamente al totale', () => {
  assert.deepEqual(ripartisci(100, [1, 1, 1], 1), [34, 33, 33]);
  assert.equal(somma(ripartisci(100, [1, 1, 1], 0.1)), 100);
  assert.equal(somma(ripartisci(7268, [42.2, 13.2, 8, 7.9, 7.4, 5.5, 4.7, 3.5, 2.6, 1.8, 1.7, 1.5])), 7268);
  assert.deepEqual(ripartisci(0, [1, 2]), [0, 0]);
  assert.deepEqual(ripartisci(10, [0, 0]), [0, 0]);
});

test('spesa per funzione: quote che sommano a 100, per l\'Italia e per la media UE, e quota a debito', () => {
  const q = quoteFunzioni(STATO.cofog);
  assert.equal(q.length, 12);
  assert.equal(somma(q.map((x) => x.su100)), 100);
  assert.equal(somma(q.map((x) => x.ue)), 100);
  assert.equal(q[0].chiave, 'protezione');
  for (const x of q) assert.ok(x.su100 > 0 && x.su100 < 60, x.nome);
  const d = quotaDebito(STATO.cofog);
  assert.equal(d.anno, STATO.cofog.anno);
  assert.ok(d.su100 > 0 && d.su100 < 20, `${d.su100}`);
});

test('doveVanno: esito completo, servono dati, dichiarazione, forfettario', () => {
  const elenco = leggi('comuni.json').comuni;
  const riga = elenco.find((r) => r[0] === '015146');
  const scheda = leggi('p/MI.json')['015146'];
  const comune = preparaComune(STATO, riga, scheda);
  const e = doveVanno({ tipo: 'dipendente', reddito: 35000 }, STATO.cofog, comune);
  assert.equal(e.irpef.netta, 6757.76);
  assert.equal(e.totale, cent(e.irpef.netta + e.regionale.euro + e.comunale.euro));
  assert.equal(somma(e.funzioni.map((f) => f.euro)), Math.round(e.allo_stato));
  assert.equal(somma(e.spesaComune.righe.map((r) => r.su100)), 100);
  assert.equal(somma(e.spesaComune.righe.map((r) => r.tuoi)), Math.round(e.al_comune));
  assert.match(testo(e), /Sanità: [\d,]+ euro su 100/);
  assert.match(testo(e), /presi a prestito/);

  assert.deepEqual(doveVanno({}, STATO.cofog).servono.length, 2);
  assert.match(testo(doveVanno({ tipo: 'dipendente' }, STATO.cofog)), /serve: il reddito/);

  const d = doveVanno({ modo: 'dichiarazione', irpef: 4000, addRegionale: 300, addComunale: 120 }, STATO.cofog, comune);
  assert.equal(d.totale, 4420);
  assert.equal(d.allo_stato, 4300);

  const f = doveVanno({ tipo: 'autonomo', reddito: 20000, forfettario: 15 }, STATO.cofog, comune);
  assert.equal(f.sostitutiva.euro, 3000);
  assert.equal(f.al_comune, 0);
  assert.equal(f.regionale, null);
});

test('i dati: Comuni con codice ISTAT, Regioni con la regola 2026, nessun dato personale', () => {
  const { comuni } = leggi('comuni.json');
  assert.ok(comuni.length >= 7890, `${comuni.length} Comuni`);
  const regioni = new Set(Object.keys(STATO.regioni));
  assert.equal(regioni.size, 21);
  const sigle = new Set();
  for (const [istat, nome, sigla, regione] of comuni) {
    assert.match(istat, /^\d{6}$/, nome);
    assert.ok(regioni.has(regione), `${nome}: ${regione}`);
    sigle.add(sigla);
  }
  let conAdd = 0, conBil = 0;
  for (const s of sigle) {
    for (const [istat, sc] of Object.entries(leggi(`p/${s}.json`))) {
      if (sc.add && !sc.add.nessuna && !sc.add.da_verificare) {
        conAdd++;
        for (const [, al] of sc.add.scaglioni) assert.ok(al >= 0 && al <= 1.2, `${istat}: aliquota ${al}`); // di regola fino a 0,8; di più per Roma e per i Comuni con disavanzo che lo prevede la legge
      }
      if (sc.bil) conBil++;
    }
  }
  assert.ok(conAdd > 6500, `${conAdd} Comuni con l'addizionale calcolabile`);
  assert.ok(conBil > 7700, `${conBil} Comuni con il bilancio`);
  for (const r of Object.values(STATO.regioni)) {
    assert.equal(r.scaglioni.at(-1)[0], null);
    for (const [, al] of r.scaglioni) assert.ok(al >= 0.7 && al <= 3.63, `${al}`);
  }
});

test('fonti: ogni norma ha un collegamento ufficiale e la data di verifica', () => {
  assert.match(VERIFICATO, /^2026-\d\d-\d\d$/);
  for (const [k, f] of Object.entries(FONTI)) {
    assert.ok(f.titolo.length > 10, k);
    assert.match(f.url, /^https:\/\/(www\.normattiva\.it|www1\.finanze\.gov\.it|ec\.europa\.eu|www\.istat\.it|openbdap\.rgs\.mef\.gov\.it)\//, k);
  }
});
