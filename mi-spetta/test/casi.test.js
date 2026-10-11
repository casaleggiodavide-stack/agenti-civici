// Casi di prova: ogni caso è una famiglia realistica con l'esito atteso,
// calcolato a mano dalle fonti ufficiali. Data di riferimento fissa.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuta } from '../src/motore.js';
import { TABELLA_AUU_2026 } from '../src/dati/auu-2026.js';

const OGGI = '2026-10-11';
const esiti = (risposte, oggi = OGGI) => Object.fromEntries(valuta(risposte, { oggi }).risultati.map((r) => [r.id, r]));

const famiglia = {
  eta: 36, cittadinanza: 'italiana', anni_residenza: 36, coniuge: true, coniuge_eta: 38,
  figli: [{ nascita: '2022-05' }, { nascita: '2026-03' }], sei_madre: true, altri_adulti: 0, disabile_nucleo: false,
  isee: 16000, reddito_personale: 14000, reddito_coniuge: 21000, reddito_familiare: 35000, patrimonio_mobiliare: 4000, altri_immobili: 0,
  lavoro: 'dipendente_indeterminato', casa: 'affitto', canone_annuo: 7800, contratto_registrato: true, utenze_intestate: true,
};

test('senza risposte nessuna prestazione è esclusa e nessuna è data per certa', () => {
  const v = valuta({}, { oggi: OGGI });
  assert.equal(v.conteggio.spetta, 0);
  assert.equal(v.conteggio.non_spetta, 0);
  assert.equal(v.totaleAnnuoStimato, 0);
});

test('tabella Assegno unico: 252 fasce crescenti, dal massimo al minimo ufficiale', () => {
  assert.equal(TABELLA_AUU_2026.length, 252);
  assert.deepEqual(TABELLA_AUU_2026[0], [17468.51, 203.8, 99.1, 99.1, 34.9]);
  assert.deepEqual(TABELLA_AUU_2026.at(-1), [Infinity, 58.3, 29.1, 17.4, 0]);
  for (let i = 1; i < TABELLA_AUU_2026.length; i++) {
    assert.ok(TABELLA_AUU_2026[i][0] > TABELLA_AUU_2026[i - 1][0]);
    assert.ok(TABELLA_AUU_2026[i][1] <= TABELLA_AUU_2026[i - 1][1]);
  }
});

test('famiglia con due figli, ISEE 16.000: Assegno unico con maggiorazione sotto 1 anno e secondo percettore', () => {
  const r = esiti(famiglia).assegno_unico;
  assert.equal(r.esito, 'spetta');
  // 203,8 × 1,5 (figlio di 7 mesi) + 203,8 + 34,9 × 2 = 579,3
  assert.equal(r.importo.mensile, 579.3);
});

test('famiglia con due figli: bonus nido 3.600 €, nuovi nati e maternità scaduti, ticket esente con figlio sotto i 6 anni', () => {
  const e = esiti(famiglia);
  assert.equal(e.bonus_nido.esito, 'probabile');
  assert.equal(e.bonus_nido.importo.annuo, 3600);
  assert.equal(e.bonus_nuovi_nati.esito, 'non_spetta');
  assert.equal(e.assegno_maternita_comuni.esito, 'non_spetta');
  assert.equal(e.esenzione_ticket.esito, 'spetta');
  assert.equal(e.bonus_mamme.esito, 'probabile');
  assert.equal(e.trattamento_integrativo.importo.annuo, 1200);
  assert.equal(e.cuneo_fiscale.importo.annuo, 742);
  assert.equal(e.detrazione_affitto.importo.annuo, 300);
  assert.equal(e.bonus_sociale_bollette.esito, 'non_spetta');
  assert.equal(e.contributo_luce_isee_25000.esito, 'probabile');
});

test('neonato di due mesi e madre casalinga: bonus nuovi nati e assegno di maternità dei Comuni', () => {
  const e = esiti({ ...famiglia, figli: [{ nascita: '2026-08' }], lavoro: 'casa', isee: 12000 });
  assert.equal(e.bonus_nuovi_nati.esito, 'spetta');
  assert.equal(e.bonus_nuovi_nati.importo.unaTantum, 1000);
  assert.equal(e.assegno_maternita_comuni.esito, 'spetta');
  assert.equal(e.assegno_maternita_comuni.importo.unaTantum, 2065.5);
});

test('senza ISEE l\'Assegno unico spetta lo stesso, al minimo', () => {
  const e = esiti({ figli: [{ nascita: '2018-01' }], cittadinanza: 'italiana' });
  assert.equal(e.assegno_unico.esito, 'spetta');
  assert.equal(e.assegno_unico.importo.mensile, 58.3);
});

test('quattro figli: maggiorazioni dell\'Assegno unico e soglia ISEE del bonus sociale a 20.000 €', () => {
  const e = esiti({
    cittadinanza: 'italiana', coniuge: true, coniuge_eta: 40, reddito_personale: 20000, reddito_coniuge: 0,
    figli: [{ nascita: '2012-01' }, { nascita: '2014-01' }, { nascita: '2016-01' }, { nascita: '2018-01' }],
    isee: 15000, utenze_intestate: true,
  });
  // 203,8 × 4 + 99,1 × 2 (oltre il secondo) + 150 (almeno 4 figli) = 1163,4
  assert.equal(e.assegno_unico.importo.mensile, 1163.4);
  assert.equal(e.bonus_sociale_bollette.esito, 'spetta');
  assert.equal(e.bonus_sociale_bollette.importo.annuo, 204.4);
});

test('figlio di 19 anni: serve sapere cosa fa; se studia l\'assegno spetta', () => {
  const base = { cittadinanza: 'italiana', isee: 30000 };
  assert.equal(esiti({ ...base, figli: [{ nascita: '2007-05' }] }).assegno_unico.esito, 'manca_dato');
  assert.equal(esiti({ ...base, figli: [{ nascita: '2007-05', condizione: 'nessuna' }] }).assegno_unico.esito, 'non_spetta');
  assert.equal(esiti({ ...base, figli: [{ nascita: '2007-05', condizione: 'studia' }] }).assegno_unico.esito, 'spetta');
});

test('pensionata sola di 78 anni con ISEE 8.200: ADI, quattordicesima, bollette, canone, ticket', () => {
  const e = esiti({
    eta: 78, cittadinanza: 'italiana', anni_residenza: 78, coniuge: false, figli: [], altri_adulti: 0, disabile_nucleo: false,
    isee: 8200, reddito_personale: 7600, reddito_familiare: 7600, patrimonio_mobiliare: 5000, altri_immobili: 0,
    lavoro: 'pensionato', anni_contributi: 17, pensione_tipo: 'minima', casa: 'proprieta', utenze_intestate: true,
  });
  assert.equal(e.assegno_inclusione.esito, 'spetta');
  assert.equal(e.assegno_inclusione.importo.annuo, 590); // 8.190 − 7.600
  assert.equal(e.quattordicesima.importo.annuo, 546);
  assert.equal(e.esonero_canone_tv.esito, 'spetta');
  assert.equal(e.esenzione_ticket.esito, 'spetta');
  assert.equal(e.assegno_sociale.esito, 'non_spetta'); // 7.600 > 7.101,12
});

test('assegno sociale: 70enne sola con 3.000 € di reddito', () => {
  const e = esiti({ eta: 70, cittadinanza: 'italiana', anni_residenza: 70, coniuge: false, reddito_personale: 3000 });
  assert.equal(e.assegno_sociale.esito, 'spetta');
  assert.equal(e.assegno_sociale.importo.annuo, 4101.12);
});

test('cittadino extra UE con un permesso non di lungo periodo: niente ADI', () => {
  const e = esiti({ cittadinanza: 'extra_ue_altro', eta: 65, isee: 3000 });
  assert.equal(e.assegno_inclusione.esito, 'non_spetta');
});

test('giovane di 26 anni in affitto: detrazione giovani al 20% del canone, non quella ordinaria', () => {
  const e = esiti({ eta: 26, casa: 'affitto', canone_annuo: 6000, contratto_registrato: true, reddito_personale: 13500 });
  assert.equal(e.detrazione_affitto_giovani.esito, 'spetta');
  assert.equal(e.detrazione_affitto_giovani.importo.annuo, 1200);
  assert.equal(e.detrazione_affitto.esito, 'non_spetta');
});

test('detrazione giovani: minimo 991,60 € con canone basso', () => {
  const e = esiti({ eta: 22, casa: 'affitto', canone_annuo: 3000, contratto_registrato: true, reddito_personale: 9000 });
  assert.equal(e.detrazione_affitto_giovani.importo.annuo, 991.6);
});

test('NASpI: licenziato da poco con contributi', () => {
  const e = esiti({ lavoro: 'disoccupato', perso_lavoro: true, contributi_13_settimane: true });
  assert.equal(e.naspi.esito, 'spetta');
  assert.equal(esiti({ lavoro: 'disoccupato', perso_lavoro: false }).naspi.esito, 'non_spetta');
});

test('quattordicesima: 66 anni, 30 anni di contributi, reddito 12.000 €', () => {
  const e = esiti({ eta: 66, lavoro: 'pensionato', pensione_tipo: 'contributiva', anni_contributi: 30, reddito_personale: 12000 });
  assert.equal(e.quattordicesima.importo.annuo, 504);
});

test('cuneo fiscale tra 32.000 e 40.000 €: detrazione decrescente', () => {
  const e = esiti({ lavoro: 'dipendente_determinato', reddito_personale: 36000 });
  assert.equal(e.cuneo_fiscale.importo.annuo, 500);
});

test('bonus nido: dopo il 31 dicembre la domanda per il 2026 è chiusa', () => {
  const e = esiti({ figli: [{ nascita: '2025-06' }], cittadinanza: 'italiana', isee: 20000 }, '2027-01-15');
  assert.equal(e.bonus_nido.esito, 'chiusa');
});

test('il totale non somma le prestazioni incerte (nido, SFL, Carta Dedicata a te)', () => {
  const v = valuta(famiglia, { oggi: OGGI });
  const sommati = v.risultati.filter((r) => (r.esito === 'spetta' || r.esito === 'probabile') && r.importo && !r.importo.nonSommare);
  const atteso = Math.round(sommati.reduce((t, r) => t + (r.importo.annuo || 0) + (r.importo.unaTantum || 0), 0));
  assert.equal(v.totaleAnnuoStimato, atteso);
  assert.ok(!sommati.some((r) => r.id === 'bonus_nido'));
});

test('ogni prestazione ha almeno una fonte https e la data di verifica', () => {
  const v = valuta({}, { oggi: OGGI });
  for (const r of v.risultati) {
    assert.ok(r.fonti.length > 0, r.id);
    for (const f of r.fonti) assert.match(f.url, /^https:\/\//, r.id);
    assert.equal(r.verificato, '2026-10-11', r.id);
  }
});
