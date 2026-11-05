import { test } from 'node:test';
import assert from 'node:assert/strict';
import DATI from '../src/dati/raccolta.js';
import { indicizza, cerca, scheda, testo, DIRITTI, normalizza } from '../src/regole.js';

const FINTI = indicizza({
  aggiornato: '2026-11-05', fonti: {},
  comuni: [
    ['026086', 'Treviso', 'TV', 'Veneto', [0], 'postacertificata@cert.comune.treviso.it', 'www.comune.treviso.it'],
    ['075018', 'Castro', 'LE', 'Puglia', [1], '', ''],
    ['016063', 'Castro', 'BG', 'Lombardia', [2, 0], '', ''],
    ['026012', 'Castelfranco Veneto', 'TV', 'Veneto', [0], '', ''],
    ['999999', 'Senzagestore', 'XX', 'Molise', [], 'comune@pec.it', ''],
  ],
  gestori: [
    ['Contarina S.p.A.', '02196020263', 'https://contarina.it', '800 07 66 11', 'https://contarina.it/cittadino/raccolta-differenziata/eco-calendario', 0, 1],
    ['Comune di Castro', '00000000001', '', '', '', 1],
    ['Gestore Esempio S.r.l.', '00000000002', 'https://esempio.it', '', '', 0],
  ],
});

test('la ricerca: nome intero prima, poi chi comincia così; la sigla della provincia distingue gli omonimi', () => {
  assert.equal(cerca(FINTI, 'treviso')[0].nome, 'Treviso');
  assert.deepEqual(cerca(FINTI, 'castro').map((r) => r.sigla).sort(), ['BG', 'LE']);
  assert.deepEqual(cerca(FINTI, 'Castro LE').map((r) => r.sigla), ['LE']);
  assert.equal(cerca(FINTI, 'castel')[0].nome, 'Castelfranco Veneto');
  assert.deepEqual(cerca(FINTI, 'x'), []);
  assert.equal(normalizza('Città di Sant\'Agata'), 'citta di sant agata');
});

test('la scheda: gestore, calendario, gestione diretta, più gestori, nessun gestore', () => {
  const t = scheda(FINTI, cerca(FINTI, 'treviso')[0]);
  assert.equal(t.gestori[0].nome, 'Contarina S.p.A.');
  assert.match(t.gestori[0].calendario, /eco-calendario/);
  assert.equal(t.gestori[0].eCalendario, true);
  assert.equal(t.sitoComune, 'https://www.comune.treviso.it');
  assert.ok(!t.segnala.includes('postacertificata'), 'nel link di segnalazione niente PEC o dati personali');
  assert.equal(scheda(FINTI, cerca(FINTI, 'castro le')[0]).gestori[0].inEconomia, true);
  assert.equal(scheda(FINTI, cerca(FINTI, 'castro bg')[0]).gestori.length, 2);
  const vuota = scheda(FINTI, cerca(FINTI, 'senzagestore')[0]);
  assert.equal(vuota.gestori.length, 0);
  assert.match(testo(vuota), /non indica un gestore/);
  assert.match(testo(t), /Contarina/);
});

test('ogni diritto ha la sua fonte ARERA', () => {
  assert.ok(DIRITTI.length >= 5);
  for (const d of DIRITTI) {
    assert.match(d.url, /^https:\/\/www\.arera\.it\/.+\.pdf$/);
    assert.match(d.fonte, /ARERA, T(ITR|QRIF)/);
  }
});

test('i dati: Comuni con codice ISTAT, sigla e gestori validi; siti in https o http; niente persone', () => {
  assert.ok(DATI.comuni.length >= 7800, `${DATI.comuni.length} Comuni`);
  const visti = new Set();
  for (const [istat, nome, sigla, regione, gestori] of DATI.comuni) {
    assert.match(istat, /^\d{6}$/, nome);
    assert.ok(!visti.has(istat), `doppio ${istat}`); visti.add(istat);
    assert.match(sigla, /^[A-Z]{2}$/, `${nome}: sigla ${sigla}`);
    assert.ok(regione, `${nome}: regione`);
    for (const g of gestori) assert.ok(DATI.gestori[g], `${nome}: gestore ${g}`);
  }
  for (const [nome, piva, sito, , calendario] of DATI.gestori) {
    assert.ok(nome && /^\w{8,16}$/.test(piva), `gestore ${nome} ${piva}`);
    if (sito) assert.match(sito, /^https?:\/\//, nome);
    if (calendario) assert.match(calendario, /^https?:\/\//, nome);
  }
});
