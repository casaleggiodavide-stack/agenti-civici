import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  progettiComune, testo, riquadroPerTe, oltreLaData, fascia, comuniDellaFascia, cerca, indicizza, confronta, dataIt,
  FONTI, MISSIONI, VERIFICATO,
} from '../src/regole.js';

const DATI = new URL('../dati/', import.meta.url);
const leggi = (rel) => JSON.parse(readFileSync(new URL(rel, DATI), 'utf8'));

// Dati finti nel formato prodotto da scripts/progetti-comune-dati.py
const riga = (cup, quota, stato, fp, fe = '', extra = {}) => [cup, `Progetto ${cup}`, extra.tot ?? quota, quota, extra.pnrr ?? quota, 0, extra.m ?? 'M4', 'M4C1I3.03.00', stato, extra.att ?? 'COMUNE DI PROVA', '2023-01-01', '2023-02-01', fp, fe, 0, extra.nc ?? 1];
const ELENCO = {
  aggiornato: '2026-11-15', estrazione: '2026-06-13', versione: '13.0',
  fasce: { 'da 5.000 a 10.000 abitanti': { comuni: 1172, mediana_pc: 900, con_progetti: 1172 }, 'meno di 1.000 abitanti': { comuni: 2023, mediana_pc: 1100 } },
  misure: { 'M4C1I3.03.00': 'Piano di messa in sicurezza e riqualificazione dell\'edilizia scolastica' },
  fasi: ['Collaudo (fase in corso)'],
  comuni: [
    ['099001', 'Provalunga', 'XX', 'Toscana', 8000, 4, 9000000, 7200000],
    ['099002', 'Senzaprogetti', 'XX', 'Toscana', 600, 0, 0, 0],
    ['098001', 'Castro', 'LE', 'Puglia', 2300, 0, 0, 0],
    ['016063', 'Castro', 'BG', 'Lombardia', 1300, 0, 0, 0],
    ['097001', 'Altraprovincia', 'YY', 'Lazio', 5000, 3, 1, 1],
  ],
};
const PROV = {
  '099001': {
    n: 4, v: 9000000, pnrr: 7000000, ue: 200000, multi: 1,
    temi: [['M4', 2, 6000000], ['M2', 2, 3000000]],
    stati: { c: [1, 1000000], i: [3, 8000000] },
    scad: [['2025-12-31', 1, 2000000], ['2026-06-13', 1, 500000], ['2026-09-30', 1, 5500000]],
    senza_data: 0,
    att: [['COMUNE DI PROVALUNGA', 3, 8000000], ['REGIONE TOSCANA', 1, 1000000]], att_altri: [0, 0],
    top: [
      riga('A11B22000000001', 5500000, 'i', '2026-09-30', '', { tot: 6000000, pnrr: 5000000 }),
      riga('A11B22000000002', 2000000, 'i', '2025-12-31', '', { m: 'M2' }),
      riga('A11B22000000003', 1000000, 'c', '2024-06-30', '2024-05-10', { m: 'M2', tot: 10000000, nc: 10, att: 'REGIONE TOSCANA' }),
      riga('A11B22000000004', 500000, 'i', '2026-06-13'),
    ],
  },
};
const INDICE = { elenco: ELENCO, province: { XX: PROV } };
const OGGI = new Date('2026-11-15T12:00:00');

test('la regola del ritardo: data di fine prevista passata alla data dei dati e progetto non concluso, e nient\'altro', () => {
  const rif = '2026-06-13';
  assert.equal(oltreLaData({ finePrevista: '2025-12-31', stato: 'i' }, rif), true);
  assert.equal(oltreLaData({ finePrevista: '2025-12-31', stato: 'a' }, rif), true);
  assert.equal(oltreLaData({ finePrevista: '2025-12-31', stato: 'c' }, rif), false, 'concluso: mai in ritardo');
  assert.equal(oltreLaData({ finePrevista: '', stato: 'i' }, rif), false, 'senza data prevista non si dice niente');
  assert.equal(oltreLaData({ finePrevista: '2026-06-13', stato: 'i' }, rif), false, 'il giorno stesso non è ancora passato');
  assert.equal(oltreLaData({ finePrevista: '2026-09-30', stato: 'i' }, rif), false, 'dopo la data dei dati la fonte non dice niente');
  assert.equal(oltreLaData({ finePrevista: '2026-06-12', stato: 'x' }, new Date(2026, 5, 13)), true, 'accetta anche una data');
});

test('le fasce di abitanti sono quelle del bilancio, con i confini giusti', () => {
  assert.equal(fascia(999), 'meno di 1.000 abitanti');
  assert.equal(fascia(1000), 'da 1.000 a 2.000 abitanti');
  assert.equal(fascia(59999), 'da 20.000 a 60.000 abitanti');
  assert.equal(fascia(249999), 'da 100.000 a 250.000 abitanti');
  assert.equal(fascia(250000), 'oltre 250.000 abitanti');
  assert.equal(fascia(0), null);
  assert.equal(comuniDellaFascia('meno di 1.000 abitanti'), 'con meno di 1.000 abitanti');
  assert.equal(comuniDellaFascia('da 1.000 a 2.000 abitanti'), 'da 1.000 a 2.000 abitanti');
});

test('la ricerca: nome esatto prima, la sigla distingue gli omonimi, «Comune di» si ignora', () => {
  const idx = indicizza(ELENCO);
  assert.equal(cerca(idx, 'provalunga')[0].istat, '099001');
  assert.deepEqual(cerca(idx, 'Castro').map((r) => r.sigla), ['LE', 'BG'], 'a parità di nome prima il più popoloso');
  assert.deepEqual(cerca(idx, 'Castro BG').map((r) => r.istat), ['016063']);
  assert.equal(cerca(idx, 'Comune di Senzaprogetti')[0].istat, '099002');
  assert.deepEqual(cerca(idx, '  '), []);
  assert.equal(cerca(ELENCO, 'prova')[0].nome, 'Provalunga', 'indicizza da sé se serve');
});

test('il confronto con la mediana in parole, con tolleranza del 15%', () => {
  assert.equal(confronta(1000, 1000).tono, 'pari');
  assert.equal(confronta(1140, 1000).tono, 'pari');
  assert.deepEqual(confronta(1200, 1000), { tono: 'piu', parola: 'il 20% in più della mediana' });
  assert.deepEqual(confronta(500, 1000), { tono: 'meno', parola: 'il 50% in meno della mediana' });
  assert.equal(confronta(3000, 1000).parola, 'circa 3 volte la mediana');
  assert.equal(confronta(100, 0), null);
  assert.equal(confronta(null, 1000), null);
});

test('la sintesi: totali, fondi europei per abitante, temi, stati, ritardi rispetto alla data dei dati', () => {
  const s = progettiComune(INDICE, '099001', OGGI);
  assert.equal(s.esito, 'ok');
  assert.equal(s.n, 4);
  assert.equal(s.fondiUe, 7200000);
  assert.equal(s.perAbitante, 900, 'fondi europei (PNRR + altri UE) diviso abitanti');
  assert.equal(s.fascia, 'da 5.000 a 10.000 abitanti');
  assert.equal(s.confronto.tono, 'pari');
  assert.equal(Math.round(s.temi.reduce((x, t) => x + t.su100, 0)), 100);
  assert.equal(s.temi[0].nome, MISSIONI.M4.breve);
  assert.deepEqual(s.stati.map((x) => x.codice), ['c', 'i']);
  assert.deepEqual(s.oltre, { n: 1, valore: 2000000, date: [{ data: '2025-12-31', n: 1, valore: 2000000 }] });
  assert.deepEqual(s.dopo, { n: 2, valore: 6000000 }, 'fine prevista tra la data dei dati e oggi: la fonte non dice ancora');
  assert.deepEqual(s.progetti.map((p) => p.oltre), [false, true, false, false]);
  const p = s.progetti[0];
  assert.match(p.link, /^https:\/\/www\.opencup\.gov\.it\/portale\/progetto\/-\/cup\/A11B22000000001$/);
  assert.equal(p.misura, ELENCO.misure['M4C1I3.03.00']);
  assert.equal(p.fase, 'Collaudo (fase in corso)');
  // con «oggi» uguale alla data dei dati nessun progetto è «tra la data dei dati e oggi»
  assert.equal(progettiComune(INDICE, '099001', '2026-06-13').dopo.n, 0);
});

test('gli esiti senza progetti, senza dati e senza Comune', () => {
  const nessuno = progettiComune({ elenco: ELENCO, province: { XX: PROV } }, '099002', OGGI);
  assert.equal(nessuno.esito, 'nessuno');
  assert.equal(nessuno.perAbitante, 0);
  assert.match(testo(nessuno), /non localizza nel Comune nessun progetto/);
  const manca = progettiComune(INDICE, '097001', OGGI);
  assert.equal(manca.esito, 'serve_dato', 'senza il file della provincia: serve un dato, non un\'ipotesi');
  assert.match(testo(manca), /Serve un dato/);
  assert.equal(riquadroPerTe(manca), null);
  assert.equal(progettiComune(INDICE, '123456').trovato, false);
  assert.match(testo(progettiComune(INDICE, '123456')), /non trovato/);
});

test('il testo per l\'assistente e il riquadro di «Per te»', () => {
  const s = progettiComune(INDICE, '099001', OGGI);
  const t = testo(s);
  assert.match(t, /4 progetti per 9 milioni di euro/);
  assert.match(t, /1 progetto aveva superato la data di fine prevista indicata dalla fonte e non risultava concluso \(1 con fine prevista il 31 dicembre 2025\)/);
  assert.match(t, /CUP A11B22000000001/);
  assert.match(t, /italiadomani\.gov\.it/);
  const r = riquadroPerTe(s);
  assert.equal(r.gruppo, 'comune');
  assert.equal(r.titolo, '4 progetti, 9 milioni di euro; 1 oltre la data di fine prevista');
  assert.match(r.testo, /Un progetto era oltre la data di fine prevista senza risultare concluso al 13 giugno 2026/);
  assert.deepEqual(r.azioni[0], { strumento: 'progetti-comune', ancora: 'istat=099001', testo: 'Vedi i progetti' });
  assert.equal(riquadroPerTe(progettiComune(INDICE, '099002', OGGI)).titolo, 'Nessun progetto PNRR localizzato nel Comune');
});

test('date e fonti', () => {
  assert.equal(dataIt('2026-06-13'), '13 giugno 2026');
  assert.equal(dataIt('2025-01-01'), '1 gennaio 2025');
  assert.equal(dataIt(''), '');
  assert.match(VERIFICATO, /^\d{4}-\d{2}-\d{2}$/);
  for (const f of Object.values(FONTI)) {
    assert.ok(f.titolo, 'ogni fonte ha un titolo');
    assert.match(f.url, /^https:\/\//);
  }
  assert.match(FONTI.rrf.url, /eur-lex\.europa\.eu/);
  assert.match(FONTI.rrf.titolo, /art\. 24/);
});

// ---------- i dati veri ----------

const elenco = leggi('comuni.json');
const vero = (istat) => {
  const c = elenco.comuni.find((x) => x[0] === istat);
  return progettiComune({ elenco, province: { [c[2]]: leggi(`p/${c[2]}.json`) } }, istat, OGGI);
};

test('dati veri, un Comune grande: Milano', () => {
  const s = vero('015146');
  assert.equal(s.esito, 'ok');
  assert.equal(s.comune.nome, 'Milano');
  assert.ok(s.n > 1000, `${s.n} progetti`);
  assert.ok(s.valore > 1e9, 'più di un miliardo');
  assert.equal(s.fascia, 'oltre 250.000 abitanti');
  assert.equal(s.progetti.length, 20, 'al massimo 20 progetti, e Milano ne ha di più');
  for (let i = 1; i < s.progetti.length; i++) assert.ok(s.progetti[i - 1].quota >= s.progetti[i].quota, 'dal più grande');
  assert.equal(s.stati.reduce((x, t) => x + t.n, 0), s.n, 'ogni progetto ha uno stato');
  assert.equal(s.temi.reduce((x, t) => x + t.n, 0), s.n, 'ogni progetto ha una missione');
  assert.ok(s.oltre.n + s.dopo.n + s.senzaData <= s.n);
  for (const p of s.progetti) {
    assert.match(p.cup, /^[A-Z0-9]{15}$/);
    assert.ok(p.quota <= p.totale + 1, 'la parte nel Comune non supera il progetto');
    if (p.oltre) assert.ok(p.finePrevista < s.estrazione && p.stato !== 'c');
  }
  assert.ok(Object.keys(MISSIONI).includes(s.temi[0].codice));
});

test('dati veri, un Comune piccolo: Moncenisio (TO), 48 abitanti', () => {
  const s = vero('001157');
  assert.equal(s.esito, 'ok');
  assert.equal(s.comune.pop, 48);
  assert.equal(s.fascia, 'meno di 1.000 abitanti');
  assert.ok(s.n >= 1 && s.n <= 30, `${s.n} progetti`);
  assert.equal(s.progetti.length, Math.min(20, s.n));
  assert.ok(s.attuatori.some((a) => /MONCENISIO/.test(a.nome)), 'tra gli attuatori c\'è il Comune');
  assert.ok(s.mediana > 0 && s.comuniFascia > 1500);
  assert.match(riquadroPerTe(s).titolo, /^\d+ progett[oi], /);
});

test('i dati preparati: elenco, fasce, file per provincia coerenti; niente codici fiscali di persone', () => {
  assert.equal(elenco.estrazione, '2026-06-13');
  assert.ok(elenco.comuni.length >= 7890, `${elenco.comuni.length} Comuni`);
  const visti = new Set();
  for (const [istat, nome, sigla, regione, pop, n] of elenco.comuni) {
    assert.match(istat, /^\d{6}$/, nome);
    assert.ok(!visti.has(istat), `doppio ${istat}`); visti.add(istat);
    assert.match(sigla, /^[A-Z]{2}$/, `${nome}: ${sigla}`);
    assert.ok(regione, `${nome}: Regione`);
    assert.ok(pop >= 0 && n >= 0);
  }
  const totFasce = Object.values(elenco.fasce).reduce((x, f) => x + f.comuni, 0);
  assert.ok(totFasce >= 7890, 'tutti i Comuni con popolazione stanno in una fascia');
  // la mediana calcolata dallo script coincide con quella che si ricava dall'elenco
  const piccoli = elenco.comuni.filter((c) => c[4] && fascia(c[4]) === 'meno di 1.000 abitanti').map((c) => c[7] / c[4]).sort((x, y) => x - y);
  const m = piccoli.length % 2 ? piccoli[(piccoli.length - 1) / 2] : (piccoli[piccoli.length / 2 - 1] + piccoli[piccoli.length / 2]) / 2;
  assert.ok(Math.abs(m - elenco.fasce['meno di 1.000 abitanti'].mediana_pc) <= 1);
  const perIstat = new Map(elenco.comuni.map((c) => [c[0], c]));
  const cfPersona = /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/;
  for (const f of readdirSync(new URL('p/', DATI))) {
    const sigla = f.replace('.json', '');
    const d = leggi(`p/${f}`);
    for (const [istat, s] of Object.entries(d)) {
      const c = perIstat.get(istat);
      assert.ok(c && c[2] === sigla, `${istat} nel file ${f}`);
      assert.equal(c[5], s.n);
      assert.ok(s.top.length <= 20);
      for (const a of s.att) assert.doesNotMatch(a[0], cfPersona);
    }
  }
});
