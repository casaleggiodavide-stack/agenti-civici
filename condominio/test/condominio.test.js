// Condominio: maggioranze, termine di 30 giorni, mediazione, assemblea, spese, morosità, lavori urgenti.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { maggioranze, valutaCondominio, testo, termineImpugnazione, aggiungiMesi, TIPI, FONTI, VERIFICATO } from '../src/regole.js';
import { lettera, oggetto } from '../src/documento.js';
import { DOMANDE } from '../src/domande.js';

const OGGI = '2026-11-15';
const base = { partecipanti: 20, totale_millesimi: 1000 };
const voto = (tipo, convocazione, pt, pm, ft, fm) => maggioranze({ ...base, tipo, convocazione, presenti_teste: pt, presenti_millesimi: pm, favorevoli_teste: ft, favorevoli_millesimi: fm });

test('prima convocazione: servono due terzi del valore e la maggioranza dei condòmini per costituirsi', () => {
  const ok = voto('ordinaria', 'prima', 11, 667, 8, 500);
  assert.equal(ok.costituita.esito, true);
  assert.equal(ok.approvata.esito, true);
  assert.equal(ok.valida, true);
  const pochiMillesimi = voto('ordinaria', 'prima', 15, 660, 12, 600);
  assert.equal(pochiMillesimi.costituita.esito, false, '660 millesimi sono meno di due terzi');
  assert.equal(pochiMillesimi.valida, false);
  assert.equal(voto('ordinaria', 'prima', 10, 800, 8, 700).costituita.esito, false, '10 su 20 non è la maggioranza dei partecipanti');
  assert.equal(voto('ordinaria', 'prima', 11, 700, 6, 499).approvata.esito, false, 'serve almeno la metà del valore');
});

test('seconda convocazione ordinaria: un terzo dei condòmini e del valore, delibera con un terzo del valore', () => {
  const sotto = voto('ordinaria', 'seconda', 7, 400, 5, 333);
  assert.equal(sotto.costituita.esito, true);
  assert.equal(sotto.approvata.esito, false, '333 millesimi sono meno di un terzo di 1000');
  const sopra = voto('ordinaria', 'seconda', 7, 400, 5, 333.34);
  assert.equal(sopra.valida, true);
  assert.equal(voto('ordinaria', 'seconda', 6, 400, 5, 340).costituita.esito, false, '6 su 20 è meno di un terzo');
  assert.equal(voto('ordinaria', 'seconda', 7, 400, 3, 340).approvata.esito, false, 'serve la maggioranza dei presenti');
});

test('nomina e revoca dell\'amministratore: metà del valore anche in seconda convocazione', () => {
  const m = voto('amministratore', 'seconda', 8, 450, 6, 400);
  assert.equal(m.costituita.esito, true);
  assert.equal(m.approvata.esito, false);
  assert.equal(m.approvata.millesimi.servono, 500);
  assert.equal(voto('amministratore', 'seconda', 12, 600, 8, 500).valida, true);
  assert.equal(voto('straordinaria_notevole', 'seconda', 12, 600, 8, 499).valida, false);
  assert.equal(voto('straordinaria', 'seconda', 12, 600, 8, 400).valida, true, 'manutenzione straordinaria non notevole: regole ordinarie');
});

test('innovazioni due terzi; barriere architettoniche metà; risparmio energetico con APE un terzo; ricarica come le ordinarie', () => {
  assert.equal(voto('innovazioni', 'seconda', 12, 700, 9, 666).valida, false);
  assert.equal(voto('innovazioni', 'seconda', 12, 700, 9, 667).valida, true);
  const barriere = voto('barriere', 'seconda', 8, 520, 5, 500);
  assert.equal(barriere.valida, true);
  assert.ok(barriere.voci.some((v) => /3 mesi/.test(v.titolo)));
  assert.equal(voto('barriere', 'seconda', 8, 520, 5, 480).valida, false);
  assert.equal(voto('energia_ape', 'prima', 11, 700, 6, 340).valida, true, 'un terzo basta anche in prima convocazione');
  assert.equal(voto('ricarica', 'prima', 11, 700, 6, 340).valida, false);
  assert.equal(voto('ricarica', 'seconda', 7, 400, 4, 340).valida, true);
});

test('destinazione d\'uso: quattro quinti di tutti; criteri di spesa: unanimità', () => {
  assert.equal(voto('destinazione_uso', 'prima', 18, 900, 16, 800).valida, true);
  assert.equal(voto('destinazione_uso', 'prima', 18, 900, 15, 850).valida, false, '15 su 20 è meno di quattro quinti');
  assert.equal(voto('criteri_spese', 'prima', 20, 1000, 19, 990).valida, false);
  assert.equal(voto('criteri_spese', 'prima', 20, 1000, 20, 1000).valida, true);
});

test('dati mancanti e numeri incoerenti: serve un dato, mai un\'ipotesi', () => {
  const m = maggioranze({ tipo: 'ordinaria', convocazione: 'prima' });
  assert.equal(m.valida, null);
  assert.equal(m.verdetto.tono, 'dato');
  assert.ok(m.mancano.includes('partecipanti'));
  const x = maggioranze({ ...base, tipo: 'ordinaria', convocazione: 'prima', presenti_teste: 12, presenti_millesimi: 700, favorevoli_teste: 14, favorevoli_millesimi: 600 });
  assert.equal(x.valida, null);
  assert.ok(x.voci.some((v) => v.esito === 'no' && /non tornano/.test(v.titolo)));
});

test('tempi della convocazione: avviso di 5 giorni, seconda entro 10 giorni e non lo stesso giorno', () => {
  const m = maggioranze({ ...base, tipo: 'ordinaria', convocazione: 'seconda', data_avviso: '2026-10-02', data_prima: '2026-10-06', data_seconda: '2026-10-20' });
  assert.ok(m.voci.some((v) => v.esito === 'no' && /solo 4 giorni/.test(v.titolo)));
  assert.ok(m.voci.some((v) => v.esito === 'no' && /14 giorni dopo/.test(v.titolo)));
  const stesso = maggioranze({ ...base, tipo: 'ordinaria', convocazione: 'seconda', data_prima: '2026-10-06', data_seconda: '2026-10-06' });
  assert.ok(stesso.voci.some((v) => v.esito === 'no' && /stesso giorno/.test(v.titolo)));
});

test('30 giorni per impugnare: festivi, sabato e sospensione feriale di agosto', () => {
  // 2 ottobre + 30 = 1° novembre, domenica e Ognissanti: si va a lunedì 2 novembre
  assert.deepEqual(termineImpugnazione('2026-10-02'), { scadenza: '2026-11-02', senzaSospensione: '2026-11-02', sospesa: false, slittata: true });
  // 3 ottobre + 30 = 2 novembre, lunedì
  assert.equal(termineImpugnazione('2026-10-03').scadenza, '2026-11-02');
  // 17 settembre + 30 = 17 ottobre, sabato: non si sposta
  assert.equal(termineImpugnazione('2026-09-17').scadenza, '2026-10-17');
  // 15 luglio: 16 giorni a luglio, poi da settembre (agosto non si conta)
  assert.equal(termineImpugnazione('2026-07-15').scadenza, '2026-09-14');
  assert.equal(termineImpugnazione('2026-07-15').senzaSospensione, '2026-08-14');
  // assemblea ad agosto: il termine parte dal 1° settembre
  assert.equal(termineImpugnazione('2026-08-10').scadenza, '2026-09-30');
});

test('impugnare: per i presenti dalla delibera, per gli assenti dalla comunicazione del verbale', () => {
  const contrario = valutaCondominio({ caso: 'impugnare', vizio: 'maggioranza', voto: 'contrario', data_assemblea: '2026-11-02' }, { oggi: OGGI });
  assert.equal(contrario.scadenze[0].data, '2026-12-02');
  assert.equal(contrario.verdetto.tono, 'si');
  const assente = valutaCondominio({ caso: 'impugnare', vizio: 'convocazione', voto: 'assente', data_assemblea: '2026-10-01', data_comunicazione: '2026-11-02' }, { oggi: OGGI });
  assert.equal(assente.scadenze[0].data, '2026-12-02', 'conta la data del verbale, non quella dell\'assemblea');
  const senzaVerbale = valutaCondominio({ caso: 'impugnare', vizio: 'convocazione', voto: 'assente', data_assemblea: '2026-10-01' }, { oggi: OGGI });
  assert.equal(senzaVerbale.scadenze.length, 0);
  assert.ok(senzaVerbale.voci.some((v) => v.dato === 'data_comunicazione'));
  const tardi = valutaCondominio({ caso: 'impugnare', vizio: 'riparto_concreto', voto: 'astenuto', data_assemblea: '2026-09-01' }, { oggi: OGGI });
  assert.equal(tardi.verdetto.tono, 'no');
  assert.ok(tardi.fonti.some((f) => /28\/2010, art. 5/.test(f.titolo)), 'cita la mediazione obbligatoria');
});

test('impugnare: chi ha votato a favore non può chiedere l\'annullamento; la nullità non ha termine; dopo la mediazione altri 30 giorni', () => {
  const fav = valutaCondominio({ caso: 'impugnare', vizio: 'maggioranza', voto: 'favorevole', data_assemblea: '2026-11-02' }, { oggi: OGGI });
  assert.equal(fav.verdetto.tono, 'no');
  assert.equal(fav.documento, null);
  const nulla = valutaCondominio({ caso: 'impugnare', vizio: 'criteri_spese', voto: 'favorevole', data_assemblea: '2026-03-02' }, { oggi: OGGI });
  assert.equal(nulla.verdetto.tono, 'forse');
  assert.match(nulla.verdetto.titolo, /nulla/);
  const med = valutaCondominio({ caso: 'impugnare', vizio: 'maggioranza', voto: 'contrario', data_assemblea: '2026-09-01', mediazione: 'senza_accordo', data_verbale_mediazione: '2026-11-10' }, { oggi: OGGI });
  assert.ok(med.scadenze.some((s) => s.data === '2026-12-10' && /causa/.test(s.titolo)));
  assert.equal(med.verdetto.tono, 'si');
});

test('chiedere un\'assemblea: due condòmini e un sesto del valore, poi 10 giorni; senza amministratore basta uno', () => {
  const pochi = valutaCondominio({ caso: 'assemblea', amministratore_presente: true, motivo_assemblea: 'generale', richiedenti: 2, millesimi_richiedenti: 166 }, { oggi: OGGI });
  assert.equal(pochi.verdetto.tono, 'no');
  const ok = valutaCondominio({ caso: 'assemblea', amministratore_presente: true, motivo_assemblea: 'generale', richiedenti: 2, millesimi_richiedenti: 167, data_richiesta: '2026-11-02', convocata: false }, { oggi: OGGI });
  assert.equal(ok.scadenze[0].data, '2026-11-12');
  assert.equal(ok.documento.tipo, 'avviso_convocazione', 'passati i 10 giorni si convoca direttamente');
  const uno = valutaCondominio({ caso: 'assemblea', amministratore_presente: false, partecipanti: 12 }, { oggi: OGGI });
  assert.equal(uno.verdetto.tono, 'si');
  assert.ok(uno.voci.some((v) => /obbligatorio/.test(v.titolo)));
  const agevolata = valutaCondominio({ caso: 'assemblea', amministratore_presente: true, motivo_assemblea: 'barriere', data_richiesta: '2026-11-02' }, { oggi: OGGI });
  assert.deepEqual(agevolata.scadenze.map((s) => s.data), ['2026-12-02', '2027-02-02']);
});

test('chi paga: millesimi, lastrico solare 1/3 e 2/3, solaio a metà, scale con la tabella', () => {
  const gen = valutaCondominio({ caso: 'spese', voce_spesa: 'generali', importo: 12000, millesimi: 45.5 });
  assert.equal(gen.calcolo.quota, 546);
  const lastrico = valutaCondominio({ caso: 'spese', voce_spesa: 'lastrico', lastrico_uso: 'mio', importo: 9000, millesimi: 85 });
  assert.equal(lastrico.calcolo.quota, 3510);
  const altro = valutaCondominio({ caso: 'spese', voce_spesa: 'lastrico', lastrico_uso: 'altro', importo: 9000, millesimi: 85 });
  assert.equal(altro.calcolo.quota, 510);
  assert.equal(valutaCondominio({ caso: 'spese', voce_spesa: 'solaio', importo: 3000 }).calcolo.quota, 1500);
  const scale = valutaCondominio({ caso: 'spese', voce_spesa: 'scale_ascensore', importo: 20000 });
  assert.equal(scale.verdetto.tono, 'dato');
  assert.equal(valutaCondominio({ caso: 'spese', voce_spesa: 'scale_ascensore', importo: 20000, millesimi_scale: 62 }).calcolo.quota, 1240);
  assert.equal(valutaCondominio({ caso: 'spese', voce_spesa: 'balcone' }).calcolo, null, 'sui balconi nessun calcolo');
});

test('morosità: sospensione dei servizi dopo sei mesi, amministratore entro sei mesi dalla chiusura', () => {
  assert.equal(aggiungiMesi('2026-08-31', 6).toISOString().slice(0, 10), '2027-02-28');
  const io = valutaCondominio({ caso: 'morosita', ruolo: 'io', data_scadenza_rata: '2026-08-31', sospeso: true, data_sospensione: '2026-11-10' }, { oggi: OGGI });
  assert.equal(io.scadenze[0].data, '2027-02-28');
  assert.ok(io.voci.some((v) => v.esito === 'no' && /prima dei sei mesi/.test(v.titolo)));
  const altri = valutaCondominio({ caso: 'morosita', ruolo: 'altro', data_chiusura_esercizio: '2025-12-31' }, { oggi: OGGI });
  assert.ok(altri.scadenze.some((s) => s.data === '2026-06-30'));
  assert.ok(altri.voci.some((v) => /sei mesi sono passati/.test(v.titolo)));
});

test('amministratore e lavori urgenti', () => {
  const conto = valutaCondominio({ caso: 'amministratore', problema_amministratore: 'conto' }, { oggi: OGGI });
  assert.match(conto.verdetto.titolo, /da solo/);
  assert.ok(conto.voci.some((v) => /31 ottobre 2027/.test(v.spiegazione)));
  assert.equal(valutaCondominio({ caso: 'amministratore', problema_amministratore: 'fiducia' }, { oggi: OGGI }).verdetto.tono, 'forse');
  const urg = valutaCondominio({ caso: 'lavori_urgenti', urgente: 'si', autorizzato: false, importo: 640, millesimi: 42 }, { oggi: OGGI });
  assert.equal(urg.calcolo.rimborso, 613.12);
  assert.equal(urg.documento.tipo, 'rimborso');
  assert.equal(valutaCondominio({ caso: 'lavori_urgenti', urgente: 'no', autorizzato: false, importo: 640, millesimi: 42 }).verdetto.tono, 'no');
  const rendiconto = valutaCondominio({ caso: 'documenti', documenti_cosa: 'rendiconto', data_chiusura_esercizio: '2025-12-31', rendiconto_convocato: false }, { oggi: OGGI });
  assert.equal(rendiconto.scadenze[0].data, '2026-06-29');
  assert.equal(rendiconto.verdetto.tono, 'no');
});

test('testo semplice e lettere: niente errori, campi da completare evidenziati, fonti citate', () => {
  const casi = [
    { caso: 'impugnare', vizio: 'convocazione', voto: 'assente', data_comunicazione: '2026-11-02' },
    { caso: 'documenti', documenti_cosa: 'giustificativi', data_richiesta: '2026-10-01', risposta: 'no' },
    { caso: 'assemblea', amministratore_presente: true, motivo_assemblea: 'generale', richiedenti: 3, millesimi_richiedenti: 200 },
    { caso: 'assemblea', amministratore_presente: false },
    { caso: 'morosita', ruolo: 'io', data_scadenza_rata: '2026-09-30' },
    { caso: 'morosita', ruolo: 'altro' },
    { caso: 'amministratore', problema_amministratore: 'rendiconto' },
    { caso: 'lavori_urgenti', urgente: 'si', importo: 500, millesimi: 50 },
  ];
  for (const r of casi) {
    const e = valutaCondominio(r, { oggi: OGGI });
    assert.ok(e.documento, r.caso);
    const html = lettera(r, e);
    assert.match(html, /campo-vuoto/, r.caso);
    assert.ok(oggetto(r, e).length > 10);
    const t = testo(e);
    assert.match(t, /normattiva\.it/, r.caso);
    assert.match(t, /non un parere legale/);
  }
  const m = testo(maggioranze({ ...base, tipo: 'ordinaria', convocazione: 'prima', presenti_teste: 11, presenti_millesimi: 700, favorevoli_teste: 8, favorevoli_millesimi: 520 }));
  assert.match(m, /Quorum costitutivo: condòmini 11 \(servono 11\)/);
  assert.match(m, /raggiunto/);
  assert.equal(valutaCondominio({}).verdetto.tono, 'dato');
});

test('dati preparati: fonti.js generato da fonti.json, ogni regola con norma ufficiale', () => {
  const json = JSON.parse(readFileSync(new URL('../dati/fonti.json', import.meta.url), 'utf-8'));
  assert.equal(VERIFICATO, json.verificato_il);
  assert.equal(Object.keys(FONTI.regole).length, json.regole.length, 'rilancia python3 -I scripts/condominio-dati.py');
  for (const r of json.regole) {
    assert.ok(r.testo.length > 20, r.id);
    assert.match(r.norma.url, /^https:\/\/www\.(normattiva\.it|cortedicassazione\.it)\//, r.id);
    assert.deepEqual(FONTI.regole[r.id].norma, r.norma, r.id);
  }
  const regole = new Set(['base', 'meta', 'due_terzi', 'terzo', 'quattro_quinti', 'unanimita']);
  for (const t of TIPI) {
    assert.ok(regole.has(t.regola), t.id);
    for (const f of t.fonti) assert.ok(FONTI.regole[f], `${t.id}: ${f}`);
  }
  assert.equal(FONTI.regole.impugnazione_30.giorni, 30);
  assert.deepEqual(FONTI.regole.costitutiva_prima.millesimi, [2, 3]);
  assert.deepEqual(FONTI.regole.assemblea_richiesta.millesimi, [1, 6]);
  // nessun dato personale nelle domande che finiscono nell'indirizzo: le risposte restano nel browser
  for (const id of ['nome', 'indirizzo', 'recapito', 'comune_firma']) assert.ok(DOMANDE.some((d) => d.id === id && d.sezione === 'tuoi'), id);
});
