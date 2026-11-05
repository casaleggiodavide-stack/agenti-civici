import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { valuta, PRESTAZIONI } from '../../mi-spetta/src/motore.js';
import { PREFETTURE } from '../../faccio-ricorso/src/dati/prefetture.js';
import fonti from '../../reclami-pa/src/dati/fonti.js';
import { cerca } from '../../raccolta/src/regole.js';
import { indicizza, prossima, regioneId, regioneDifensore, prefettura, risposteMiSpetta, aiuti, riquadri, anteprima, conta, articoloRegione, testo, GRUPPI, trovaDifensore } from '../src/regole.js';

const oggi = new Date('2026-11-05T12:00:00');
const famiglia = { eta: '30-59', partner: true, figli: { piccoli: 1, minori: 1, grandi: 0 }, altri: 0, altri60: false, disabile: false };
const base = { istat: '026086', nome: 'Treviso', sigla: 'TV', regione: 'Veneto' };
const sintesi = {
  b: { anno: 2025, pop: 85652, fascia: 'da 60.000 a 100.000 abitanti', istat: '026086', tempestivita: -9.4, debito_pc: 111, riscossione: 90.2, deficitario: false, parametri: 0, med: { debito_pc: 281, riscossione: 75.4 } },
  a: { anno: 2025, cf: '80007310263', n: 260, v: 48920505, senza_gara: { quota: 19.9, quota_n: 84.2, mediana: 22.2, pct: 43 }, un_offerente: { quota: 15.4, mediana: 41.4, pct: 3, n: 4, base: 26 }, primo_fornitore: { quota: 19, mediana: 20.7, pct: 47 } },
  r: [['Contarina', '800 07 66 11', 'https://contarina.it/calendari', 1, 'https://contarina.it']],
  pec: 'postacertificata@cert.comune.treviso.it',
};
const territorio = (x = sintesi) => ({ comune: base, x, prefetture: PREFETTURE, difensori: fonti.difensori, conteggio: conta(PRESTAZIONI, 'veneto') });

test('le domande arrivano in ordine e «saltata» conta come risposta', () => {
  assert.equal(prossima({}), 'comune');
  assert.equal(prossima(base), 'famiglia');
  assert.equal(prossima({ ...base, famiglia: 'saltata' }), 'isee');
  assert.equal(prossima({ ...base, famiglia, isee: 'nd' }), null);
});

test('Regioni, Province autonome, Prefetture e articoli', () => {
  assert.equal(regioneId('Emilia-Romagna', 'BO'), 'emilia_romagna');
  assert.equal(regioneId("Valle d'Aosta", 'AO'), 'valle_d_aosta');
  assert.equal(regioneId('Trentino-Alto Adige', 'BZ'), 'bolzano');
  assert.equal(regioneId('Trentino-Alto Adige', 'TN'), 'trento');
  assert.equal(regioneDifensore('Trentino-Alto Adige', 'TN'), 'Provincia autonoma di Trento');
  assert.equal(trovaDifensore(fonti.difensori, 'Trentino-Alto Adige', 'BZ').regione, 'Provincia autonoma di Bolzano');
  assert.match(prefettura(PREFETTURE, 'TV').nome, /Treviso/);
  assert.match(prefettura(PREFETTURE, 'OT').nome, /Sassari/, 'le vecchie province sarde vanno alla Prefettura che le copre');
  assert.match(prefettura(PREFETTURE, 'AO').nome, /Valle d'Aosta/);
  assert.equal(articoloRegione('Veneto'), 'del Veneto');
  assert.equal(articoloRegione('Umbria'), "dell'Umbria");
  assert.equal(articoloRegione('Marche'), 'delle Marche');
  assert.equal(articoloRegione('Lombardia'), 'della Lombardia');
  // tutte le Regioni hanno un difensore civico nei dati (in carica o no) e misure regionali in Mi spetta
  for (const [r, s] of [['Piemonte', 'TO'], ['Veneto', 'VE'], ['Sicilia', 'PA'], ['Trentino-Alto Adige', 'BZ'], ['Friuli Venezia Giulia', 'UD']]) {
    assert.ok(trovaDifensore(fonti.difensori, r, s), r);
    assert.ok(conta(PRESTAZIONI, regioneId(r, s)).regionali > 0, r);
  }
});

test('le fasce diventano risposte per Mi spetta ai due estremi', () => {
  const p = { ...base, famiglia, isee: '25000' };
  const lo = risposteMiSpetta(p, 'basso', oggi), hi = risposteMiSpetta(p, 'alto', oggi);
  assert.equal(lo.regione, 'veneto');
  assert.equal(lo.eta, 30); assert.equal(hi.eta, 59);
  assert.equal(lo.isee, 15001); assert.equal(hi.isee, 25000);
  assert.equal(lo.figli.length, 2);
  assert.equal(risposteMiSpetta({ ...p, isee: 'nd' }, 'alto', oggi).isee, undefined, 'senza ISEE non si inventa un numero');
});

test('una famiglia con due figli: assegno unico probabile, con le condizioni scritte', () => {
  const a = aiuti(valuta, { ...base, famiglia, isee: '25000' }, oggi);
  const au = a.probabili.find((x) => /Assegno unico/.test(x.nome));
  assert.ok(au, 'l\'assegno unico deve essere probabile');
  assert.match(au.importo, /^da [\d.]+ € a [\d.]+ € l'anno$/);
  assert.ok(au.condizioni.some((c) => /Cittadinanza/.test(c)), 'la cittadinanza non si chiede: si scrive come condizione');
  assert.ok(!a.probabili.some((x) => /Assegno sociale/.test(x.nome)), 'niente aiuti per anziani a chi ha 30-59 anni');
});

test('senza ISEE gli aiuti con la soglia restano possibili e la prossima domanda lo dice', () => {
  const p = { ...base, famiglia };
  const a = aiuti(valuta, p, oggi);
  assert.ok(a.possibili.some((x) => x.dipendeIsee));
  assert.match(anteprima(p, a, conta(PRESTAZIONI, 'veneto')), /dipend\w+ dall'ISEE/);
});

test('una persona sola sopra i 70 anni con ISEE basso: bonus sociale probabile', () => {
  const a = aiuti(valuta, { istat: '072006', nome: 'Bari', sigla: 'BA', regione: 'Puglia', famiglia: { eta: '70-79', partner: false, figli: {}, altri: 0, disabile: false }, isee: '9530' }, oggi);
  assert.ok(a.probabili.some((x) => /Bonus sociale luce/.test(x.nome)));
  assert.ok(!a.probabili.some((x) => /Assegno unico/.test(x.nome)));
});

test('i riquadri: ordine per gruppo, dati del Comune, anteprima degli aiuti prima della domanda', () => {
  const r = riquadri(territorio(), base, null);
  const ordine = GRUPPI.map(([g]) => g);
  assert.deepEqual(r.map((x) => ordine.indexOf(x.gruppo)), [...r.map((x) => ordine.indexOf(x.gruppo))].sort((a, b) => a - b));
  const per = Object.fromEntries(r.map((x) => [x.id, x]));
  assert.equal(per['aiuti-anteprima'].titolo, '24 aiuti nazionali e 4 del Veneto da controllare');
  assert.equal(per.rifiuti.titolo, 'Raccoglie Contarina');
  assert.ok(per.rifiuti.azioni.some((a) => a.href === 'https://contarina.it/calendari' && a.testo === 'Il calendario'));
  assert.match(per.multe.titolo, /Prefettura di Treviso/);
  assert.match(per.bilancio.titolo, /in tempo, in media 9 giorni prima/);
  assert.match(per.bilancio.testo, /111 € per abitante.*mediana è 281 €/);
  assert.equal(per.appalti.titolo, '260 procedure, nessun segnale');
  assert.deepEqual(per.appalti.azioni[0], { strumento: 'appalti', ancora: 'cf=80007310263', testo: 'Vedi gli appalti' });
  assert.match(per.atti.testo, /postacertificata@cert\.comune\.treviso\.it/);
  assert.match(testo(base, r), /Come va il tuo Comune:/);
});

test('un segnale sugli appalti si dice, con la parola «segnale»', () => {
  const x = { ...sintesi, a: { ...sintesi.a, senza_gara: { quota: 80, quota_n: 95, mediana: 22, pct: 96 } } };
  const ap = riquadri(territorio(x), base, null).find((r) => r.id === 'appalti');
  assert.match(ap.titolo, /^Un segnale da guardare: spesa senza gara$/);
  assert.match(ap.testo, /non è un illecito/);
});

test('dopo le risposte: aiuti probabili al posto dell\'anteprima, e domanda saltata senza riquadri aiuti', () => {
  const p = { ...base, famiglia, isee: '25000' };
  const r = riquadri(territorio(), p, aiuti(valuta, p, oggi));
  assert.ok(r.some((x) => x.id.startsWith('aiuto-') && x.gruppo === 'soldi'));
  assert.ok(!r.some((x) => x.id === 'aiuti-anteprima'));
  const s = riquadri(territorio(), { ...base, famiglia: 'saltata' }, null);
  assert.ok(!s.some((x) => x.gruppo === 'soldi'));
});

test('senza dati sui rifiuti rimanda allo strumento con il Comune', () => {
  const r = riquadri(territorio({ pec: 'x@pec.it' }), base, null);
  assert.deepEqual(r.find((x) => x.id === 'rifiuti').azioni[0], { strumento: 'raccolta', ancora: 'istat=026086', testo: 'Trova il gestore' });
  assert.ok(!r.some((x) => x.id === 'bilancio' || x.id === 'appalti'));
});

test('i dati preparati: tutti i Comuni nella ricerca e la sintesi per provincia', { skip: !existsSync(new URL('../dati/comuni.json', import.meta.url)) }, () => {
  const dati = JSON.parse(readFileSync(new URL('../dati/comuni.json', import.meta.url), 'utf8'));
  assert.ok(dati.comuni.length >= 7800, `${dati.comuni.length} Comuni`);
  const idx = indicizza(dati);
  const tv = cerca(idx, 'Treviso', 1)[0];
  assert.equal(tv.istat, '026086');
  assert.equal(tv.regione, 'Veneto');
  const p = JSON.parse(readFileSync(new URL('../dati/p/TV.json', import.meta.url), 'utf8'));
  assert.equal(p['026086'].b.anno >= 2024, true);
  assert.ok(p['026086'].a.n > 0);
  assert.match(p['026086'].pec, /@/);
});

test('un indicatore dei pagamenti impossibile non diventa un titolo', () => {
  const x = { ...sintesi, b: { ...sintesi.b, tempestivita: -1321 } };
  const b = riquadri(territorio(x), base, null).find((r) => r.id === 'bilancio');
  assert.equal(b.titolo, 'Il rendiconto 2025 del Comune');
});
