// Reclami alla PA: termini, potere sostitutivo, indennizzo per le imprese, difensori civici.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuta, difensore } from '../src/regole.js';
import { lettera, destinatario } from '../src/documento.js';
import { indicizza, cerca } from '../../chiedo-gli-atti/src/enti.js';
import DATI from '../../chiedo-gli-atti/src/dati/enti.js';

const idx = indicizza(DATI);
const lecce = cerca(idx, 'comune di lecce', 1)[0];
const bari = cerca(idx, 'comune di bari', 1)[0];
const OGGI = '2026-10-25';

test('pratica ferma: 30 giorni di default, poi titolare del potere sostitutivo e ricorso entro un anno', () => {
  const v = valuta({ problema: 'ritardo', data_domanda: '2026-06-03', ente: bari }, { oggi: OGGI });
  assert.equal(v.documento.tipo, 'sostitutivo');
  assert.equal(v.documento.fine, '2026-07-03');
  assert.ok(v.scadenze.some((s) => s.data === '2027-07-03' && /TAR/.test(s.titolo)));
  assert.match(lettera({ problema: 'ritardo', data_domanda: '2026-06-03', ente: bari }, v), /comma 9-ter/);
  assert.match(destinatario({ ente: bari }, v).nome, /titolare del potere sostitutivo/);
});

test('termine non ancora scaduto: sollecito e data di scadenza', () => {
  const v = valuta({ problema: 'ritardo', data_domanda: '2026-10-10', termine: 60, ente: lecce }, { oggi: OGGI });
  assert.equal(v.verdetto.tono, 'forse');
  assert.equal(v.documento.variante, 'sollecito');
  assert.equal(v.scadenze[0].data, '2026-12-09');
});

test('impresa: indennizzo solo entro 20 giorni dalla scadenza, al massimo 2.000 euro', () => {
  const dentro = valuta({ problema: 'ritardo', data_domanda: '2026-09-01', termine: 30, impresa: true, ente: lecce }, { oggi: '2026-10-15' });
  assert.equal(dentro.documento.indennizzo, true);
  assert.match(dentro.voci.find((x) => /Indennizzo/.test(x.titolo)).titolo, /fino a 420 euro/);
  const fuori = valuta({ problema: 'ritardo', data_domanda: '2026-01-10', termine: 30, impresa: true, ente: lecce }, { oggi: OGGI });
  assert.equal(fuori.documento.indennizzo, false);
  assert.equal(valuta({ problema: 'ritardo', data_domanda: '2026-01-10', impresa: false, ente: lecce }, { oggi: OGGI }).documento.indennizzo, undefined);
});

test('difensori civici: Puglia senza, Toscana con PEC, Calabria vacante; enti nazionali esclusi', () => {
  assert.equal(difensore('LE').stato, 'assente');
  assert.equal(difensore('FI').stato, 'attivo');
  assert.match(difensore('FI').pec, /@/);
  assert.equal(difensore('CS').stato, 'vacante');
  const inps = cerca(idx, 'inps', 1)[0];
  assert.equal(valuta({ problema: 'disservizio', ente: inps }, { oggi: OGGI }).nazionale, true);
});

test('preavviso di rigetto: 10 giorni; sanità: 15 giorni; accesso negato rimanda a Chiedo gli atti', () => {
  const p = valuta({ problema: 'preavviso', data_preavviso: '2026-10-20', ente: lecce }, { oggi: OGGI });
  assert.equal(p.scadenze[0].data, '2026-10-30');
  assert.equal(p.documento.tipo, 'osservazioni');
  const s = valuta({ problema: 'sanita', data_fatto: '2026-10-20', ente: lecce }, { oggi: OGGI });
  assert.equal(s.scadenze[0].data, '2026-11-04');
  assert.equal(valuta({ problema: 'accesso', ente: lecce }, { oggi: OGGI }).documento, null);
});

test('reclamo senza risposta dopo 30 giorni: istanza al difensore civico (Toscana)', () => {
  const firenze = cerca(idx, 'comune di firenze', 1)[0];
  const r = { problema: 'disservizio', cosa_chiesto: 'x', ente: firenze, passo: 'reclamo', data_invio: '2026-09-01', risposta: 'no' };
  const v = valuta(r, { oggi: OGGI });
  assert.equal(v.documento.tipo, 'difensore');
  assert.match(destinatario(r, v).pec, /toscana/i);
});
