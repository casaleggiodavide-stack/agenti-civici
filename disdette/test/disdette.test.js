// Disdici un abbonamento: ripensamento, telefonia, palestre, assicurazioni, luce e gas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { valutaDisdetta, testo, ripensamento, FONTI, VERIFICATO, CONTRATTI } from '../src/regole.js';
import { lettera, oggetto } from '../src/documento.js';
import { DOMANDE, contratto } from '../src/domande.js';
import DATI from '../src/dati/fonti.js';

const OGGI = { oggi: '2026-11-15' };
const v = (c) => valutaDisdetta(c, OGGI);
const costo = (e, re) => e.costi.find((x) => re.test(x.titolo));

test('senza tipo serve un dato; ogni tipo di contratto dà un esito con fonti', () => {
  assert.equal(v({}).verdetto.tono, 'dato');
  for (const tipo of Object.keys(CONTRATTI)) {
    const e = v({ tipo, motivo: 'chiudo', data_firma: '2025-01-10', durata_mesi: 12, rinnovo: true, data_scadenza: '2027-01-10', preavviso_giorni: 30 });
    assert.ok(e.verdetto.titolo, tipo);
    assert.ok(e.fonti.length > 0, tipo);
    assert.ok(e.fonti.every((f) => f.url.startsWith('https://')), tipo);
  }
});

test('ripensamento: 14 giorni dalla firma per i servizi online, 30 per la visita non richiesta, 12 mesi in più senza informativa', () => {
  assert.equal(ripensamento({ tipo: 'servizi', canale: 'online', data_firma: '2026-11-10' }, '2026-11-15').fine, '2026-11-24');
  assert.equal(ripensamento({ tipo: 'energia', canale: 'visita', data_firma: '2026-11-10' }, '2026-11-15').fine, '2026-12-10');
  const senza = ripensamento({ tipo: 'servizi', canale: 'fuori', data_firma: '2026-01-10', informato: false }, '2026-11-15');
  assert.equal(senza.fine, '2027-01-24');
  assert.equal(senza.attivo, true);
  assert.equal(ripensamento({ tipo: 'servizi', canale: 'negozio', data_firma: '2026-11-10' }, '2026-11-15'), null);
  assert.equal(ripensamento({ tipo: 'polizza', canale: 'online', data_firma: '2026-11-10' }, '2026-11-15'), null);
  const e = v({ tipo: 'digitale', canale: 'online', data_firma: '2026-11-09', motivo: 'chiudo' });
  assert.equal(e.verdetto.tono, 'si');
  assert.equal(e.documento.tipo, 'ripensamento');
  assert.ok(e.ripensamento.funzioneOnline, 'contratto online dopo il 19/6/2026: pulsante «recedere dal contratto qui»');
  assert.ok(e.come.some((x) => /recedere dal contratto qui/.test(x.titolo)));
  assert.equal(ripensamento({ tipo: 'digitale', canale: 'online', data_firma: '2026-06-18' }, '2026-06-20').funzioneOnline, false);
});

test('telefonia dopo 24 mesi con rinnovo, firmata dal 3/1/2024: niente penali né costi di disattivazione, preavviso 30 giorni', () => {
  const e = v({ tipo: 'telefonia', motivo: 'chiudo', data_firma: '2024-03-12', durata_mesi: 24, rinnovo: true, promo: true, rate: true, canale: 'negozio' });
  assert.equal(e.verdetto.tono, 'si');
  assert.equal(costo(e, /Penali e costi di disattivazione/).puo, false);
  assert.equal(costo(e, /sconti/).puo, false);
  assert.equal(costo(e, /rate residue/).puo, true);
  assert.equal(e.preavviso.giorni, 30);
  assert.equal(e.effetto.data, '2026-12-15');
  assert.ok(e.come.some((x) => /negozio/.test(x.titolo)), 'firmato in negozio: si può recedere anche lì');
});

test('telefonia firmata prima del 3/1/2024: dopo il rinnovo i costi di disattivazione sono contestabili, non esclusi da AGCOM', () => {
  const e = v({ tipo: 'telefonia', motivo: 'chiudo', data_firma: '2022-05-01', durata_mesi: 24, rinnovo: true, canale: 'online' });
  assert.equal(costo(e, /disattivazione/).puo, 'forse');
  assert.match(costo(e, /disattivazione/).spiegazione, /comma 4/);
});

test('telefonia dentro il vincolo con promozione: costi e sconti solo a certe condizioni; vincolo oltre 24 mesi segnalato', () => {
  const e = v({ tipo: 'telefonia', motivo: 'chiudo', data_firma: '2026-02-01', durata_mesi: 24, rinnovo: true, promo: true, canale: 'negozio' });
  assert.equal(e.verdetto.tono, 'forse');
  assert.equal(costo(e, /sconti/).puo, 'forse');
  assert.ok(e.scadenze.some((s) => s.data === '2028-02-01' && /vincolo/.test(s.titolo)));
  assert.ok(e.scadenze.some((s) => s.data === '2027-12-01' && /avvisarti/.test(s.titolo)), 'avviso 2 mesi prima del rinnovo');
  const lungo = v({ tipo: 'telefonia', motivo: 'chiudo', data_firma: '2026-02-01', durata_mesi: 36, canale: 'negozio', promo: false });
  assert.ok(lungo.voci.some((x) => /oltre 24 mesi/.test(x.titolo)));
});

test('modifica delle condizioni: 60 giorni per uscire gratis, poi regole ordinarie', () => {
  const dentro = v({ tipo: 'telefonia', motivo: 'modifica', data_modifica: '2026-10-01', data_firma: '2025-06-01', durata_mesi: 24, canale: 'online', promo: true });
  assert.equal(dentro.verdetto.tono, 'si');
  assert.ok(dentro.scadenze.some((s) => s.data === '2026-11-30'));
  assert.equal(dentro.documento.variante, 'modifica');
  assert.match(lettera({ tipo: 'telefonia', data_modifica: '2026-10-01' }, dentro), /comma 5/);
  const fuori = v({ tipo: 'telefonia', motivo: 'modifica', data_modifica: '2026-08-01', data_firma: '2025-06-01', durata_mesi: 24, canale: 'online', promo: true });
  assert.ok(fuori.voci.some((x) => /60 giorni/.test(x.titolo) && x.esito === 'no'));
  assert.equal(fuori.verdetto.tono, 'forse');
});

test('rate: la lettera rispetta la scelta tra rate e unica soluzione', () => {
  const r = { tipo: 'telefonia', motivo: 'chiudo', data_firma: '2024-03-12', durata_mesi: 24, rinnovo: true, rate: true, rate_scelta: 'rate', canale: 'negozio', nome: 'Anna Rossi' };
  const e = v(r);
  assert.match(lettera(r, e), /continuare a pagarle/);
  assert.match(lettera({ ...r, rate_scelta: 'unica' }, e), /unica soluzione/);
  assert.match(lettera(r, e), /307\/23\/CONS/);
  assert.match(lettera(r, e), /Anna Rossi/);
});

test('palestra rinnovata senza avviso: recesso senza spese (art. 65-bis)', () => {
  const e = v({ tipo: 'servizi', motivo: 'chiudo', data_firma: '2025-09-01', durata_mesi: 12, rinnovo: true, data_scadenza: '2027-09-01', preavviso_giorni: 60, avviso_rinnovo: false, canale: 'negozio' });
  assert.equal(e.verdetto.tono, 'si');
  assert.equal(e.documento.variante, '65bis');
  assert.ok(e.fonti.some((f) => /65-bis/.test(f.titolo)));
  assert.match(lettera({ tipo: 'servizi' }, e), /65-bis/);
  assert.ok(!e.costi.some((x) => x.puo === true), 'con il 65-bis non restano quote dovute fino alla scadenza');
});

test('questionario: il motivo arriva alle regole da qualunque delle tre domande', () => {
  assert.equal(contratto({ tipo: 'energia', motivo_energia: 'chiudo' }).motivo, 'chiudo');
  assert.equal(contratto({ tipo: 'servizi', motivo_altro: 'non_richiesto' }).motivo, 'non_richiesto');
  assert.equal(v(contratto({ tipo: 'telefonia', motivo_tlc: 'non_richiesto' })).documento.tipo, 'contestazione');
});

test('palestra: ultimo giorno per la disdetta dal preavviso; termine passato rimanda alla scadenza successiva', () => {
  const ok = v({ tipo: 'servizi', motivo: 'chiudo', data_firma: '2026-01-15', durata_mesi: 12, rinnovo: true, data_scadenza: '2027-01-15', preavviso_giorni: 30, canale: 'negozio' });
  assert.equal(ok.verdetto.tono, 'si');
  assert.ok(ok.scadenze.some((s) => s.data === '2026-12-16' && /Ultimo giorno per la disdetta/.test(s.titolo)));
  assert.ok(ok.scadenze.some((s) => s.data === '2026-12-16' && /avviso del rinnovo/.test(s.titolo)), 'avviso del 65-bis 30 giorni prima');
  const tardi = v({ tipo: 'servizi', motivo: 'chiudo', data_firma: '2025-12-01', durata_mesi: 12, rinnovo: true, preavviso_giorni: 30, canale: 'negozio' });
  assert.equal(tardi.verdetto.tono, 'forse');
  assert.equal(tardi.effetto.data, '2027-12-01');
  assert.ok(tardi.scadenze.some((s) => s.data === '2027-11-01'));
  const manca = v({ tipo: 'servizi', motivo: 'chiudo', data_firma: '2026-01-15', durata_mesi: 12, rinnovo: true, canale: 'negozio' });
  assert.ok(manca.voci.some((x) => x.dato === 'preavviso_giorni'));
});

test('RC auto: niente disdetta, avviso 30 giorni prima, copertura fino a 15 giorni dopo', () => {
  const e = v({ tipo: 'rc_auto', data_scadenza: '2027-01-20' });
  assert.equal(e.verdetto.tono, 'si');
  assert.equal(e.documento, null);
  assert.deepEqual(e.scadenze.map((s) => s.data), ['2026-12-21', '2027-01-20', '2027-02-04']);
  assert.ok(e.fonti.some((f) => /170-bis/.test(f.titolo)));
});

test('polizza danni pluriennale: recesso dopo il quinto anno con 60 giorni di preavviso, a fine annualità', () => {
  const e = v({ tipo: 'polizza', data_firma: '2019-03-01', durata_mesi: 120 });
  assert.equal(e.verdetto.tono, 'si');
  assert.equal(e.effetto.data, '2027-03-01');
  assert.ok(e.scadenze.some((s) => s.data === '2026-12-31'));
  assert.match(lettera({ tipo: 'polizza', data_firma: '2019-03-01' }, e), /1899/);
  const presto = v({ tipo: 'polizza', data_firma: '2023-06-01', durata_mesi: 120 });
  assert.equal(presto.verdetto.tono, 'no');
  assert.equal(presto.effetto.data, '2029-06-01');
  assert.ok(presto.scadenze.some((s) => s.data === '2028-06-01'));
  assert.equal(v({ tipo: 'polizza', data_firma: '2008-01-01', durata_mesi: 120 }).verdetto.tono, 'forse');
  assert.equal(v({ tipo: 'polizza', data_firma: '2024-01-01', durata_mesi: 36 }).verdetto.tono, 'no');
});

test('luce e gas: cambio senza disdetta; chiusura con un mese di preavviso; onere solo sulla luce a prezzo fisso', () => {
  const cambio = v({ tipo: 'energia', materia: 'gas', motivo: 'cambio' });
  assert.equal(cambio.documento, null);
  assert.equal(costo(cambio, /Penali/).puo, false);
  assert.equal(costo(cambio, /Onere/), undefined);
  assert.ok(cambio.collegamenti.some((l) => l.strumento === 'bollette'));
  const chiudo = v({ tipo: 'energia', materia: 'luce', motivo: 'chiudo', prezzo_fisso: true });
  assert.equal(chiudo.effetto.data, '2026-12-15');
  assert.equal(costo(chiudo, /Onere/).puo, 'forse');
  assert.equal(chiudo.documento.variante, 'energia');
  const modificato = v({ tipo: 'energia', materia: 'luce', motivo: 'modifica', prezzo_fisso: true });
  assert.equal(costo(modificato, /Onere/).puo, false, 'con la modifica unilaterale l\'onere decade');
});

test('servizio attivato senza consenso: niente da pagare, contestazione e rimando a È una truffa?', () => {
  const e = v({ tipo: 'telefonia', motivo: 'non_richiesto' });
  assert.equal(e.documento.tipo, 'contestazione');
  assert.ok(e.collegamenti.some((l) => l.strumento === 'truffe'));
  assert.match(lettera({ tipo: 'telefonia' }, e), /66-quinquies/);
  assert.match(lettera({ tipo: 'telefonia' }, e), /3-quater/);
  assert.match(oggetto({ codice_cliente: 'X1' }, e), /X1/);
});

test('testo(esito) per il server MCP: verdetto, costi, scadenze, conciliazione e fonti in chiaro', () => {
  const t = testo(v({ tipo: 'telefonia', motivo: 'chiudo', data_firma: '2024-03-12', durata_mesi: 24, rinnovo: true, rate: true, canale: 'negozio' }));
  assert.match(t, /Cosa NON possono chiederti/);
  assert.match(t, /ConciliaWeb/);
  assert.match(t, /normattiva\.it/);
  assert.match(t, /non un parere legale/);
  assert.equal(testo(null), '');
});

test('dati personali: non vanno mai nell\'indirizzo della pagina e la lettera li prende solo dalle risposte', () => {
  const app = readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /location\.(hash|search)|history\.(push|replace)State/);
  const personali = ['nome', 'indirizzo', 'codice_cliente', 'numero_linea', 'codice_fornitura', 'recapito'];
  for (const id of personali) assert.ok(DOMANDE.some((d) => d.id === id && d.sezione === 'tuoi'), id);
});

test('fonti preparate: fonti.js allineato a fonti.json, ogni regola con norma e URL ufficiale', () => {
  const json = JSON.parse(readFileSync(new URL('../dati/fonti.json', import.meta.url), 'utf8'));
  assert.equal(DATI.verificato, json.verificato_il);
  assert.equal(VERIFICATO, '2026-11-15');
  assert.deepEqual(Object.keys(DATI.regole).sort(), json.regole.map((r) => r.id).sort());
  const ufficiali = /^https:\/\/(www\.normattiva\.it|www\.agcom\.it|www\.arera\.it|www\.ivass\.it|www\.misurainternet\.it|www\.agcm\.it|www\.ecc-netitalia\.it)\//;
  for (const [id, f] of Object.entries(FONTI)) {
    assert.match(f.url, ufficiali, id);
    assert.ok(f.titolo && f.testo, id);
  }
  assert.equal(DATI.regole.bersani_c3.giorni, 30);
  assert.equal(DATI.regole.cce_c5.giorni, 60);
  assert.equal(DATI.regole.cdc_54bis.data, '2026-06-19');
  assert.equal(DATI.regole.agcom_24mesi.data, '2024-01-03');
});
