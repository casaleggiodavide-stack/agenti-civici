import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EDIZIONI, FOTO, TOTALE, sommaAlberi, prossimaGiornata } from '../src/edizioni.js';
import { PASSI, VIVAI, REGIONI, FONTI, faseDi } from '../src/guida.js';
import { letteraComune, letteraVivaio, oggettoComune } from '../src/lettere.js';
import { existsSync } from 'node:fs';

test('edizioni: numeri coerenti e fonti https', () => {
  assert.equal(EDIZIONI[0].anno, 2015);
  const s = sommaAlberi();
  assert.ok(Math.abs(s - TOTALE.alberi) / TOTALE.alberi < 0.05, `somma ${s}`);
  for (const e of EDIZIONI) for (const u of e.fonti) assert.match(u, /^https:\/\//);
  for (const f of FOTO) assert.ok(existsSync(new URL(`../web/edizioni/${f.file}`, import.meta.url)), f.file);
  const testo = JSON.stringify({ EDIZIONI, FOTO, TOTALE, PASSI, VIVAI });
  assert.doesNotMatch(testo, /movimento|m5s|5 stelle|cinque stelle/i);
  assert.doesNotMatch(testo, /alberiperilfuturo\.it/);
});

test('il prossimo 21 novembre, senza anno fisso', () => {
  assert.deepEqual(prossimaGiornata('2026-10-25'), { data: '2026-11-21', giorni: 27 });
  assert.equal(prossimaGiornata('2026-11-21').giorni, 0);
  assert.equal(prossimaGiornata('2026-11-22').data, '2027-11-21');
  assert.equal(faseDi(27).fase, 'ottobre');
  assert.equal(faseDi(70).fase, 'settembre');
  assert.equal(faseDi(360).fase, 'dopo');
});

test('guida: tutte le Regioni, fonti valide', () => {
  assert.equal(REGIONI.length, 21);
  for (const p of PASSI) for (const k of p.fonti || []) assert.ok(FONTI[k], k);
  for (const f of Object.values(FONTI)) assert.match(f.url, /^https:\/\//);
  for (const v of Object.values(VIVAI)) if (v.url) assert.match(v.url, /^https:\/\//);
});

test('lettere: dati del Comune e segnaposto', () => {
  const d = { ente: { nome: 'Comune di Pavia', comune: 'Pavia', pec: 'protocollo@pec.comune.pavia.it' }, gruppo: 'Comitato Ticino', quanti: '30', data: '2026-11-21' };
  const c = letteraComune(d, { oggi: '2026-10-25' });
  assert.match(c, /Comune di Pavia/);
  assert.match(c, /circa 30 alberi/);
  assert.match(c, /\[nome e cognome\]/);
  assert.match(oggettoComune(d), /Pavia/);
  const v = letteraVivaio(d, { oggi: '2026-10-25', vivaio: VIVAI.Lombardia });
  assert.match(v, /ERSAF/);
  assert.match(v, /30 piantine/);
  assert.match(letteraVivaio({}, { oggi: '2026-10-25', vivaio: VIVAI.Toscana }), /Servizio foreste della Regione/);
});
