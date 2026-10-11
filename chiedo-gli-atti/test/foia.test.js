// Casi di prova di Chiedo gli atti, con data di riferimento fissa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import DATI from '../src/dati/enti.js';
import { valuta } from '../src/regole.js';
import { richiesta, riesame, ricorso, sostitutivo } from '../src/documenti.js';
import { indicizza, cerca } from '../src/enti.js';

const OGGI = '2026-10-11';
const v = (r, oggi = OGGI) => valuta(r, { oggi });
const indice = indicizza(DATI);
const COMUNE_BARI = cerca(indice, 'comune di bari', 1)[0];
const MINISTERO = cerca(indice, 'ministero della salute', 1)[0];

test('ricerca enti: Comune di Bari e Ministero della Salute in cima, con PEC', () => {
  assert.equal(COMUNE_BARI.nome.toLowerCase(), 'comune di bari');
  assert.match(COMUNE_BARI.pec, /@/);
  assert.equal(COMUNE_BARI.cat, 'L6');
  assert.match(MINISTERO.nome, /Ministero della Salute/i);
});

test('scelta del tipo: da pubblicare → semplice; personale con dati di altri → documentale; altrimenti FOIA', () => {
  assert.equal(v({ da_pubblicare: 'si' }).tipo.id, 'semplice');
  assert.equal(v({ riguarda_te: true, dati_personali: true }).tipo.id, 'documentale');
  assert.equal(v({ riguarda_te: true, dati_personali: false }).tipo.id, 'generalizzato');
  assert.equal(v({}).tipo.id, 'generalizzato');
});

test('controlli: richiesta generica e «perché» segnalate, richiesta precisa approvata', () => {
  const vaga = v({ cosa: 'Voglio tutti i documenti sul parco' });
  assert.ok(vaga.controlli.some((c) => /tutti i documenti/.test(c.testo)));
  const perche = v({ cosa: 'Vorrei sapere perché il Comune ha chiuso la piscina comunale di via Roma', periodo: '2026' });
  assert.ok(perche.controlli.some((c) => /non spiegazioni/.test(c.testo)));
  const buona = v({ cosa: 'Chiedo l\'elenco degli incarichi di consulenza affidati nel 2025, con importo e affidatario' });
  assert.equal(buona.controlli[0].livello, 'ok');
});

test('in attesa: 30 giorni dall\'invio', () => {
  const x = v({ cosa: 'x', ente: COMUNE_BARI, data_invio: '2026-10-01', risposta: 'nessuna' });
  assert.equal(x.fase.id, 'attesa');
  assert.equal(x.scadenze.find((s) => s.id === 'risposta').data, '2026-10-31');
});

test('controinteressati: fino a 10 giorni in più', () => {
  const x = v({ ente: COMUNE_BARI, data_invio: '2026-10-01', controinteressati: true });
  assert.equal(x.scadenze.find((s) => s.id === 'risposta').data, '2026-11-10');
});

test('silenzio sul FOIA: riesame, non silenzio-rigetto', () => {
  const x = v({ ente: COMUNE_BARI, data_invio: '2026-08-01', risposta: 'nessuna' });
  assert.equal(x.fase.id, 'silenzio');
  assert.ok(x.passi.includes('riesame'));
  assert.equal(x.scadenze.find((s) => s.id === 'riesame').data, '2026-09-30');
});

test('silenzio sull\'accesso documentale verso un Ministero: rifiuto, Commissione o TAR', () => {
  const x = v({ riguarda_te: true, dati_personali: true, ente: MINISTERO, data_invio: '2026-08-01' });
  assert.equal(x.fase.id, 'silenzio');
  assert.match(x.fase.testo, /Commissione per l'accesso/);
  assert.ok(x.scadenze.some((s) => s.id === 'tar'));
});

test('rifiuto da un Comune pugliese: niente difensore civico (Puglia senza difensore)', () => {
  const x = v({ ente: COMUNE_BARI, data_invio: '2026-08-01', risposta: 'respinta', data_risposta: '2026-09-15' });
  assert.equal(x.ente.regione, 'Puglia');
  assert.ok(!x.passi.includes('difensore'));
  assert.ok(x.passi.includes('riesame'));
});

test('riesame senza risposta dopo 20 giorni: TAR con contributo di 300 €', () => {
  const x = v({ ente: COMUNE_BARI, data_invio: '2026-07-01', risposta: 'respinta', data_risposta: '2026-07-20', data_riesame: '2026-08-01', esito_riesame: 'nessuno' });
  assert.equal(x.fase.id, 'tar');
  assert.match(x.scadenze.find((s) => s.id === 'tar').testo, /300 €/);
});

test('accesso semplice senza risposta: potere sostitutivo e ANAC', () => {
  const x = v({ da_pubblicare: 'si', ente: COMUNE_BARI, data_invio: '2026-08-01', risposta: 'nessuna' });
  assert.ok(x.passi.includes('sostitutivo'));
  assert.match(x.destinatario, /RPCT/);
});

test('documenti: richiesta FOIA con oscuramento, riesame con motivazione, ricorso al difensore', () => {
  const r = { cosa: 'Elenco delle consulenze 2025', ente: { ...COMUNE_BARI, nome: 'Comune di Prova', prov: 'MI', cat: 'L6' }, dati_personali: true, formato: 'aperto', canale: 'email', data_invio: '2026-08-01', risposta: 'respinta', data_risposta: '2026-08-20', motivo_rifiuto: 'Tutela della riservatezza' };
  const x = v(r);
  const doc = richiesta(r, x);
  assert.match(doc, /art\. 5, comma 2/);
  assert.match(doc, /oscuramento/);
  assert.match(doc, /CSV/);
  assert.match(doc, /documento d'identità/);
  const rie = riesame(r, x);
  assert.match(rie, /alla richiesta di accesso/);
  assert.match(rie, /Tutela della riservatezza/);
  assert.match(ricorso(r, x), /Difensore civico della Regione Lombardia/);
  assert.match(sostitutivo({ ...r, da_pubblicare: 'si' }, v({ ...r, da_pubblicare: 'si' })), /potere sostitutivo/);
});
