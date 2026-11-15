// Affitto: preavvisi, scadenze, disdetta, interessi sul deposito, ISTAT, termine di grazia, dati verificati.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { valutaAffitto, cicloContratto, interessiLegali, tassoLegale, aggiungiMesi, daRisposte, testo, TASSI_LEGALI, FONTI, VERIFICATO } from '../src/regole.js';
import { iso } from '../src/comune/date.js';

const OGGI = '2026-11-15';
const v = (s, c) => valutaAffitto(s, c, { oggi: OGGI });
const libero = (inizio, x = {}) => ({ tipo: 'libero', inizio, registrato: 'si', cedolare: false, canone: 800, deposito: 1600, ...x });

test('scadenze: 4+4 finisce il giorno prima dell\'anniversario; 3+2 poi si rinnova ogni due anni', () => {
  const l = cicloContratto(libero('2022-03-01'), OGGI);
  assert.equal(l.scadenze[0].data, '2026-02-28');
  assert.equal(l.scadenze[1].data, '2030-02-28');
  assert.equal(l.prossima, '2030-02-28');
  const c = cicloContratto({ tipo: 'concordato', inizio: '2020-01-01' }, OGGI);
  assert.deepEqual(c.scadenze.slice(0, 4).map((x) => x.data), ['2022-12-31', '2024-12-31', '2026-12-31', '2028-12-31']);
  assert.equal(cicloContratto({ tipo: 'transitorio', inizio: '2026-03-01', durata_mesi: 12 }, OGGI).prossima, '2027-02-28');
});

test('mesi di calendario: dal 31 agosto sei mesi portano al 28 febbraio', () => {
  assert.equal(iso(aggiungiMesi('2026-08-31', 6)), '2027-02-28');
  assert.equal(iso(aggiungiMesi('2027-06-30', -6)), '2026-12-30');
});

test('recesso per gravi motivi: sei mesi dalla ricezione, e ultimo giorno per uscire alla data voluta', () => {
  const e = v({ tipo: 'recesso', ruolo: 'inquilino', motivo_recesso: 'gravi', data_comunicazione: '2026-11-20', data_uscita: '2027-06-30' }, libero('2024-02-01'));
  assert.equal(e.calcoli.dataUscita, '2027-05-20');
  assert.equal(e.calcoli.ultimoGiornoInvio, '2026-12-30');
  assert.equal(e.calcoli.canoniPreavviso, 4800);
  assert.equal(e.documento.tipo, 'recesso');
  assert.ok(e.fonti.some((f) => /431\/1998, art\. 3, comma 6/.test(f.titolo)));
});

test('recesso con clausola di 3 mesi: per prudenza si contano i sei mesi di legge, con avviso', () => {
  const e = v({ tipo: 'recesso', ruolo: 'inquilino', motivo_recesso: 'clausola', data_comunicazione: '2026-12-01' }, libero('2024-02-01', { clausola_recesso: true, preavviso_mesi: 3 }));
  assert.equal(e.calcoli.preavvisoMesi, 6);
  assert.equal(e.calcoli.dataUscita, '2027-06-01');
  assert.ok(e.voci.some((x) => /3 mesi di preavviso/.test(x.titolo)));
});

test('recesso senza motivo nel 4+4: disdetta per la seconda scadenza, sei mesi prima', () => {
  const e = v({ tipo: 'recesso', ruolo: 'inquilino', motivo_recesso: 'nessuno' }, libero('2022-03-01'));
  assert.match(e.verdetto.titolo, /28 febbraio 2030/);
  assert.ok(e.scadenze.some((s) => s.data === '2029-08-28'));
  assert.equal(e.documento.tipo, 'disdetta_inquilino');
});

test('disdetta alla prima scadenza: senza motivo è nulla, tardiva non vale, con motivo e in tempo regge', () => {
  const c = libero('2023-05-01', { canone: 820 });
  const nulla = v({ tipo: 'disdetta', ruolo: 'inquilino', data_disdetta: '2026-10-20', motivo_disdetta: 'nessuno' }, c);
  assert.equal(nulla.calcoli.scadenza.data, '2027-04-30');
  assert.equal(nulla.calcoli.ultimoGiornoDisdetta, '2026-10-30');
  assert.equal(nulla.documento.vizio, 'motivo');
  assert.equal(nulla.documento.prossima, '2031-04-30');
  const tardi = v({ tipo: 'disdetta', ruolo: 'inquilino', data_disdetta: '2026-11-05', motivo_disdetta: 'uso_proprio' }, c);
  assert.equal(tardi.documento.vizio, 'tardi');
  const ok = v({ tipo: 'disdetta', ruolo: 'inquilino', data_disdetta: '2026-10-20', motivo_disdetta: 'vendita' }, c);
  assert.equal(ok.verdetto.tono, 'forse');
  assert.equal(ok.calcoli.risarcimentoMinimo, 820 * 36);
  assert.ok(ok.voci.some((x) => /prelazione/.test(x.titolo)));
});

test('disdetta del proprietario: alla prima scadenza serve il motivo, dopo bastano sei mesi', () => {
  const prima = v({ tipo: 'disdetta', ruolo: 'proprietario', motivo_disdetta: 'nessuno' }, libero('2024-01-01'));
  assert.equal(prima.verdetto.tono, 'no');
  assert.equal(prima.calcoli.scadenzaSenzaMotivo.data, '2031-12-31');
  const conMotivo = v({ tipo: 'disdetta', ruolo: 'proprietario', motivo_disdetta: 'uso_proprio' }, libero('2024-01-01'));
  assert.equal(conMotivo.documento.tipo, 'disdetta_proprietario');
  assert.equal(conMotivo.calcoli.ultimoGiornoDisdetta, '2027-06-30');
  const seconda = v({ tipo: 'disdetta', ruolo: 'proprietario' }, libero('2021-06-01'));
  assert.equal(seconda.calcoli.scadenza.data, '2029-05-31');
  assert.equal(seconda.verdetto.tono, 'si');
  const conc = v({ tipo: 'disdetta', ruolo: 'proprietario' }, { tipo: 'concordato', inizio: '2020-01-01', canone: 600 });
  assert.equal(conc.calcoli.scadenza.data, '2028-12-31');
});

test('tassi legali dai decreti MEF: 2,5% nel 1999, 0,01% nel 2021, 5% nel 2023, 1,6% nel 2026', () => {
  assert.ok(TASSI_LEGALI.length >= 21);
  assert.equal(tassoLegale('1999-05-01').tasso, 2.5);
  assert.equal(tassoLegale('2021-03-01').tasso, 0.01);
  assert.equal(tassoLegale('2023-12-31').tasso, 5);
  assert.equal(tassoLegale('2026-06-01').tasso, 1.6);
  assert.equal(tassoLegale('2013-06-01').tasso, 2.5); // 2013 senza decreto: resta il 2,5% del 2012
});

test('interessi sul deposito su più anni: 1.000 € dal 2023 al 2025 = 50 + 25 + 20', () => {
  const i = interessiLegali(1000, '2022-12-31', '2025-12-31');
  assert.deepEqual(i.righe.map((r) => [r.anno, r.giorni, r.tasso, r.interessi]), [[2023, 365, 5, 50], [2024, 366, 2.5, 25], [2025, 365, 2, 20]]);
  assert.equal(i.totale, 95);
  const e = v({ tipo: 'deposito', ruolo: 'inquilino', data_riconsegna: '2026-10-31', trattenuta: 300 }, { tipo: 'concordato', inizio: '2018-09-01', canone: 600, deposito: 1800, registrato: 'si' });
  assert.equal(e.tabella.righe[0].anno, 2018);
  assert.equal(e.tabella.righe[0].tasso, 0.3);
  assert.equal(e.tabella.righe.at(-1).anno, 2026);
  assert.equal(e.calcoli.totale, Math.round((1800 + e.calcoli.interessi - 300) * 100) / 100);
  assert.equal(e.documento.tipo, 'deposito');
});

test('deposito oltre tre mensilità e transitorio oltre 18 mesi: segnalati', () => {
  const e = v({ tipo: 'deposito', ruolo: 'inquilino' }, libero('2025-01-01', { canone: 500, deposito: 2000 }));
  assert.ok(e.voci.some((x) => x.esito === 'no' && /oltre il limite/.test(x.titolo)));
  const t = v({ tipo: 'recesso', ruolo: 'inquilino' }, { tipo: 'transitorio', inizio: '2026-01-01', durata_mesi: 24 });
  assert.ok(t.voci.some((x) => /più dei 18/.test(x.titolo)));
});

test('aumento ISTAT: niente con la cedolare secca; 75% nel concordato; misura del contratto nel libero', () => {
  const ced = v({ tipo: 'aumento', ruolo: 'inquilino', canone_richiesto: 815 }, libero('2022-03-01', { cedolare: true }));
  assert.equal(ced.verdetto.tono, 'si');
  assert.equal(ced.calcoli.nuovoCanone, 800);
  assert.equal(ced.documento.tipo, 'contesta_aumento');
  const conc = v({ tipo: 'aumento', ruolo: 'proprietario', variazione_istat: 2 }, { tipo: 'concordato', inizio: '2022-03-01', cedolare: false, canone: 600, clausola_aggiornamento: true, quota_istat: 100 });
  assert.equal(conc.calcoli.quotaApplicata, 75);
  assert.equal(conc.calcoli.nuovoCanone, 609);
  assert.equal(conc.documento.tipo, 'richiesta_istat');
  const lib = v({ tipo: 'aumento', ruolo: 'inquilino', variazione_istat: 1.5, canone_richiesto: 830 }, libero('2022-03-01', { clausola_aggiornamento: true, quota_istat: 100 }));
  assert.equal(lib.calcoli.nuovoCanone, 812);
  assert.equal(lib.documento.motivo, 'eccesso');
  const senza = v({ tipo: 'aumento', ruolo: 'inquilino' }, libero('2022-03-01', { clausola_aggiornamento: false }));
  assert.match(senza.verdetto.titolo, /non è dovuto/);
});

test('sfratto per morosità: 20 giorni, udienza dopo 20 giorni liberi, termine di grazia di 90 o 120 giorni', () => {
  const base = { tipo: 'morosita', ruolo: 'inquilino', data_prima_rata: '2026-09-05', data_notifica: '2026-11-10', data_udienza: '2026-12-10', sanatorie: 0 };
  const e = v(base, libero('2021-10-01', { canone: 700 }));
  assert.equal(e.calcoli.dataRisoluzione, '2026-09-26');
  assert.equal(e.calcoli.udienzaMinima, '2026-12-01');
  assert.equal(e.calcoli.giorniGrazia, 90);
  assert.equal(e.calcoli.fineTermineGrazia, '2027-03-10');
  assert.equal(e.calcoli.rinvioMassimo, '2027-03-20');
  assert.equal(e.calcoli.rateScadute, 4); // 5/9, 5/10, 5/11, 5/12
  assert.ok(e.calcoli.daVersare > 2800);
  const diff = v({ ...base, data_prima_rata: '2026-10-15', difficolta: true }, libero('2021-10-01', { canone: 700 }));
  assert.equal(diff.calcoli.giorniGrazia, 120);
  assert.equal(diff.calcoli.fineTermineGrazia, '2027-04-09');
  const esaurita = v({ ...base, sanatorie: 3 }, libero('2021-10-01', { canone: 700 }));
  assert.equal(esaurita.verdetto.tono, 'no');
  const prop = v({ tipo: 'morosita', ruolo: 'proprietario', data_prima_rata: '2026-10-05', rate_non_pagate: 2 }, libero('2021-10-01', { canone: 700 }));
  assert.equal(prop.documento.tipo, 'diffida_pagamento');
});

test('registrazione e canone in nero: differenza non dovuta, termine di 30 giorni', () => {
  const nero = v({ tipo: 'registrazione', ruolo: 'inquilino', canone_dichiarato: 500 }, libero('2025-11-01', { canone: 700 }));
  assert.equal(nero.calcoli.differenzaMensile, 200);
  assert.equal(nero.documento.tipo, 'canone_nero');
  const non = v({ tipo: 'registrazione', ruolo: 'inquilino' }, libero('2026-10-01', { registrato: 'no' }));
  assert.equal(non.calcoli.limiteRegistrazione, '2026-10-31');
  assert.equal(non.documento.tipo, 'richiesta_registrazione');
  assert.ok(non.voci.some((x) => /nullo/.test(x.titolo)));
});

test('riparazioni: riduzione del canone solo oltre un sesto della durata e oltre 20 giorni', () => {
  const lungo = v({ tipo: 'riparazioni', ruolo: 'inquilino', tipo_guasto: 'vecchiaia', giorni_lavori: 30 }, libero('2024-01-01'));
  assert.equal(lungo.calcoli.sogliaRiduzione, 244);
  assert.equal(lungo.documento.tipo, 'riparazione');
  const breve = v({ tipo: 'riparazioni', ruolo: 'inquilino', tipo_guasto: 'urgente', giorni_lavori: 35 }, { tipo: 'transitorio', inizio: '2026-06-01', durata_mesi: 6 });
  assert.equal(breve.calcoli.sogliaRiduzione, 31);
  assert.ok(breve.voci.some((x) => x.esito === 'si' && /riduzione/.test(x.titolo)));
  assert.equal(v({ tipo: 'riparazioni', ruolo: 'inquilino', tipo_guasto: 'uso' }, libero('2024-01-01')).verdetto.tono, 'no');
});

test('risposte del questionario e testo semplice per il server MCP', () => {
  const { situazione, contratto } = daRisposte({ ruolo: 'inquilino', situazione: 'recesso', tipo_contratto: 'libero', inizio: '2024-02-01', cedolare: false, canone: 750, motivo_recesso: 'gravi', nome: 'Mario' });
  assert.equal(contratto.tipo, 'libero');
  assert.equal(situazione.tipo, 'recesso');
  assert.equal(situazione.canone, undefined);
  const e = valutaAffitto(situazione, contratto, { oggi: OGGI });
  const t = testo(e);
  assert.match(t, /Fonti \(verificate il/);
  assert.match(t, /normattiva\.it/);
  assert.doesNotMatch(t, /Mario/);
  assert.equal(valutaAffitto({}, {}, { oggi: OGGI }).verdetto.tono, 'dato');
});

test('dati preparati: ogni regola ha fonte ufficiale ed estratto, i tassi sono completi e ordinati', () => {
  const j = JSON.parse(readFileSync(new URL('../dati/fonti.json', import.meta.url), 'utf-8'));
  assert.equal(j.verificato_il, VERIFICATO);
  for (const r of j.regole) {
    assert.match(r.norma.url, /^https:\/\/(www\.normattiva\.it|www\.gazzettaufficiale\.it|rivaluta\.istat\.it)\//, r.id);
    if (r.id !== 'istat_foi') assert.ok(r.verifica?.estratto?.length > 20, r.id);
    assert.ok(FONTI[r.id]?.titolo, r.id);
  }
  const dal = TASSI_LEGALI.map((t) => t.dal);
  assert.deepEqual(dal, [...dal].sort());
  assert.equal(dal[0], '1999-01-01');
  assert.ok(TASSI_LEGALI.every((t) => /^D\.M\. /.test(t.decreto) && /^GU n\. \d+/.test(t.gazzetta)));
  assert.ok(dal.includes('2026-01-01'));
});
