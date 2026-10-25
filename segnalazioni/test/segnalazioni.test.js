// Segnalazioni urbane: chi è competente, a chi scrivere, sollecito.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuta, pecAnas, CATEGORIE, SOLLECITO_DOPO } from '../src/regole.js';
import { segnalazione, sollecito } from '../src/documento.js';
import { indicizza, cerca } from '../../chiedo-gli-atti/src/enti.js';
import DATI from '../../chiedo-gli-atti/src/dati/enti.js';

const idx = indicizza(DATI);
const enti = idx.righe;
const lecce = cerca(idx, 'comune di lecce', 1)[0];
const OGGI = '2026-10-25';

test('ogni categoria ha chi interviene, cosa chiedere e norme https', () => {
  assert.ok(Object.keys(CATEGORIE).length >= 14);
  for (const c of Object.values(CATEGORIE)) {
    assert.ok(c.chi.length, c.id);
    assert.ok(c.cosa_chiedere?.length, c.id);
    for (const n of c.norme) assert.match(n.url, /^https:\/\//, `${c.id}: ${n.url}`);
  }
});

test('buca in centro a Lecce: si scrive al Comune, PEC da IndicePA', () => {
  const v = valuta({ categoria: 'buca', strada: 'urbana', ente: lecce, luogo: 'via X', descrizione: 'buca', foto: 2 }, { enti, oggi: OGGI });
  const p = v.destinatari.find((d) => d.ruolo === 'principale');
  assert.equal(p.nome, 'Comune di Lecce');
  assert.equal(p.pec, 'protocollo@pec.comune.lecce.it');
  assert.equal(v.verdetto.tono, 'si');
  assert.match(segnalazione({ categoria: 'buca', ente: lecce, luogo: 'via X' }, v), /art\. 18-bis/);
});

test('strada provinciale: la Provincia di Lecce; statale: ANAS Puglia e, se c\'è pericolo, il 112 e Pronto ANAS', () => {
  const pr = valuta({ categoria: 'buca', strada: 'provinciale', ente: lecce }, { enti, oggi: OGGI });
  assert.match(pr.destinatari[0].nome, /Provincia di Lecce/i);
  assert.equal(pecAnas('Puglia'), 'anas.puglia@postacert.stradeanas.it');
  const ss = valuta({ categoria: 'segnaletica', strada: 'statale', pericolo: true, ente: lecce }, { enti, oggi: OGGI });
  assert.equal(ss.destinatari[0].pec, 'anas.puglia@postacert.stradeanas.it');
  assert.deepEqual(ss.telefoni.map((t) => t.numero), ['112', '800 841 148']);
  assert.equal(ss.verdetto.tono, 'no');
});

test('scarichi: agenzia regionale per l\'ambiente della Puglia, Comune in copia', () => {
  const v = valuta({ categoria: 'scarichi_odori', ente: lecce }, { enti, oggi: OGGI });
  assert.match(v.destinatari[0].nome, /Protezione dell'Ambiente della Puglia/i);
  assert.equal(v.destinatari[1].nome, 'Comune di Lecce');
});

test('dopo 30 giorni senza risposta: promemoria passato e sollecito pronto', () => {
  const r = { categoria: 'lampione_spento', strada: 'urbana', ente: lecce, data_invio: '2026-09-01', risposta: 'nessuna', protocollo: '123' };
  const v = valuta(r, { enti, oggi: OGGI });
  assert.equal(v.scadenze[0].data, '2026-10-01');
  assert.equal(v.scadenze[0].scaduta, true);
  assert.equal(v.documento.tipo, 'sollecito');
  assert.match(sollecito(r, v), /protocollo n\. 123/);
  assert.equal(SOLLECITO_DOPO, 30);
  assert.equal(valuta({ ...r, risposta: 'risolto' }, { enti, oggi: OGGI }).documento, null);
});
