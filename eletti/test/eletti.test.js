import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { indicizza, cerca, rappresentanti, testo, votoComune, votoCommissariato, votoRegione, votoParlamento, votoEuropa, provinciaDi, FONTI, COME_FARE } from '../src/regole.js';

const qui = new URL('../dati/', import.meta.url);
const leggi = (f) => JSON.parse(readFileSync(new URL(f, qui), 'utf-8'));
const COMUNI = leggi('comuni.json');
const NAZIONALE = leggi('nazionale.json');
const conProvince = (...sigle) => indicizza(COMUNI, NAZIONALE, Object.fromEntries(sigle.map((s) => [s, leggi(`p/${s}.json`)])));
const istatDi = (nome, sigla) => COMUNI.comuni.find((c) => c[1] === nome && c[2] === sigla)?.[0];
const livello = (e, id) => e.livelli.find((l) => l.id === id);
const tutte = (l) => l.gruppi.flatMap((g) => g.persone);

// ---------- regole sulle date del voto (pure) ----------

test('Comune: scadenza naturale a cinque anni e turno di primavera (primo o secondo semestre)', () => {
  const giugno = votoComune('2024-06-09', false);
  assert.equal(giugno.certo, true);
  assert.equal(giugno.scadenza, '2029-06');
  assert.equal(giugno.turno, 2029);
  assert.match(giugno.testo, /Scadenza naturale: giugno 2029/);
  assert.match(giugno.testo, /15 aprile e il 15 giugno 2029/);
  const ottobre = votoComune('2021-10-03', false);
  assert.equal(ottobre.scadenza, '2026-10');
  assert.equal(ottobre.turno, 2027, 'scade nel secondo semestre: si vota la primavera dopo');
  assert.ok(giugno.fonti.includes(FONTI.tuel51) && giugno.fonti.includes(FONTI.turno));
});

test('Comune: senza data o a statuto speciale non si inventa la data del voto', () => {
  const senza = votoComune('', false);
  assert.equal(senza.certo, false);
  assert.match(senza.testo, /Serve un dato/);
  const speciale = votoComune('2023-05-28', true);
  assert.equal(speciale.certo, false);
  assert.equal(speciale.turno, undefined);
  assert.match(speciale.testo, /legge regionale/);
});

test('Comune commissariato: art. 143 per la commissione straordinaria, art. 141 negli altri casi', () => {
  const mafia = votoCommissariato([['Rossi Mario', 'Commissione Straordinaria', '2026-01-10']], false);
  assert.ok(mafia.fonti.includes(FONTI.tuel143));
  assert.match(mafia.testo, /12 a 18 mesi/);
  const ordinario = votoCommissariato([['Bianchi Anna', 'Commissario Prefettizio', '2026-06-26']], false);
  assert.ok(ordinario.fonti.includes(FONTI.tuel141));
  assert.match(ordinario.testo, /24 febbraio/);
  assert.equal(votoCommissariato([['X', 'Commissario Regionale', '']], true).fonti.length, 0);
});

test('Regione, Parlamento, Unione europea: cinque anni, con la fonte', () => {
  const r = votoRegione('2024-06-09', false);
  assert.equal(r.scadenza, '2029-06');
  assert.ok(r.fonti.includes(FONTI.regioni));
  assert.equal(votoRegione('2024-06-09', true).certo, false);
  assert.match(votoRegione('', false).testo, /Serve un dato/);
  assert.equal(votoParlamento().scadenza, '2027-10');
  assert.match(votoParlamento().testo, /70 giorni/);
  assert.equal(votoEuropa().scadenza, '2029');
  for (const f of Object.values(FONTI)) assert.match(f.url, /^https:\/\/(www\.normattiva\.it|eur-lex\.europa\.eu|www\.camera\.it|www\.europarl\.europa\.eu)\//, f.titolo);
  for (const c of COME_FARE) assert.ok(c.titolo && c.testo);
});

// ---------- ricerca ----------

test('la ricerca: nome intero prima, la sigla distingue gli omonimi, il codice porta alla provincia', () => {
  const idx = indicizza(COMUNI);
  assert.equal(cerca(idx, 'milano')[0].nome, 'Milano');
  const castro = cerca(idx, 'castro').filter((r) => r.nome === 'Castro').map((r) => r.sigla).sort();
  assert.deepEqual(castro, ['BG', 'LE']);
  assert.deepEqual(cerca(idx, 'Castro LE').map((r) => r.sigla), ['LE']);
  assert.deepEqual(cerca(idx, '   '), []);
  assert.equal(provinciaDi(idx, istatDi('Milano', 'MI')), 'MI');
  assert.equal(rappresentanti(idx, '999999').errore, 'Nessun Comune con codice ISTAT 999999.');
  assert.deepEqual(rappresentanti(idx, istatDi('Milano', 'MI')).serveDato, ['p/MI.json', 'nazionale.json'], 'senza dati: serve un dato, non un\'ipotesi');
});

// ---------- casi veri sui dati preparati ----------

test('Comune capoluogo (Milano): sindaco, giunta, consiglio, Città metropolitana, più collegi uninominali', () => {
  const e = rappresentanti(conProvince('MI'), istatDi('Milano', 'MI'));
  const c = livello(e, 'comune');
  assert.equal(c.stato, 'ordinario');
  assert.deepEqual(c.gruppi.map((g) => g.id), ['vertice', 'giunta', 'consiglio']);
  assert.equal(c.gruppi[0].persone.length, 1);
  assert.ok(c.gruppi[2].persone.length >= 30, 'il consiglio comunale di Milano');
  assert.match(c.ente.pec, /@/);
  assert.equal(livello(e, 'provincia').tipo, 'citta-metropolitana');
  assert.match(livello(e, 'provincia').gruppi[0].titolo, /Sindaco metropolitano/);
  const cam = livello(e, 'camera');
  assert.ok(cam.gruppi.filter((g) => g.id === 'uninominale').length > 1, 'Milano è divisa in più collegi');
  assert.match(cam.nota, /sezione elettorale/);
  assert.ok(tutte(cam).length > 5);
  for (const p of tutte(cam)) assert.match(p.scheda, /^https:\/\/www\.camera\.it\//);
  assert.equal(livello(e, 'europa').gruppi[0].titolo, 'Circoscrizione I · Italia nord-occidentale');
  assert.ok(tutte(livello(e, 'europa')).length >= 15);
  // nessun dato personale ulteriore: solo i campi dell'incarico
  for (const l of e.livelli) for (const p of tutte(l)) assert.deepEqual(Object.keys(p).sort(), ['elezione', 'gruppo', 'inCarica', 'lista', 'nome', 'ruolo', 'scheda']);
  const t = testo(e);
  assert.match(t, /Chi rappresenta chi vive a Milano \(MI\)/);
  assert.match(t, /Quando si vota/);
});

test('ordine per carica e poi per cognome, mai per lista', () => {
  const e = rappresentanti(conProvince('MI'), istatDi('Milano', 'MI'));
  const consiglio = livello(e, 'comune').gruppi.find((g) => g.id === 'consiglio').persone;
  const consiglieri = consiglio.filter((p) => p.ruolo === 'Consigliere');
  const nomi = consiglieri.map((p) => p.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
  assert.deepEqual(nomi, [...nomi].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
});

test('Comune piccolo (Luogosanto, OT): dati del Comune, Provincia senza amministratori nella fonte, Sardegna a statuto speciale', () => {
  const e = rappresentanti(conProvince('OT'), istatDi('Luogosanto', 'OT'));
  const c = livello(e, 'comune');
  assert.ok(['ordinario', 'commissariato'].includes(c.stato));
  assert.ok(tutte(c).length >= 5);
  assert.equal(e.comune.statutoSpeciale, true);
  assert.equal(c.voto.certo, false, 'in Sardegna la data del voto la fissa la Regione');
  assert.equal(livello(e, 'europa').gruppi[0].titolo, 'Circoscrizione V · Italia insulare');
});

test('Comune commissariato nei dati: gestione commissariale e regola del ritorno al voto', () => {
  const sigla = 'CN';
  const e = rappresentanti(conProvince(sigla), istatDi('Clavesana', sigla));
  const c = livello(e, 'comune');
  assert.equal(c.stato, 'commissariato');
  assert.equal(c.gruppi[0].id, 'commissari');
  assert.match(c.gruppi[0].persone[0].ruolo, /Commissari/);
  assert.equal(c.voto.certo, false);
  assert.ok(c.voto.fonti.includes(FONTI.tuel141));
});

test('Provincia autonoma (Bolzano): presidente e consiglio provinciale, Regione Trentino-Alto Adige senza dati nell\'Anagrafe', () => {
  const e = rappresentanti(conProvince('BZ'), istatDi('Bolzano/Bozen', 'BZ') || istatDi('Bolzano', 'BZ'));
  const p = livello(e, 'provincia');
  assert.equal(p.tipo, 'provincia-autonoma');
  assert.ok(tutte(p).length >= 30);
  assert.match(p.ente.pec, /prov\.bz/);
  const r = livello(e, 'regione');
  assert.equal(r.stato, 'serve-dato');
  assert.match(r.nota, /non riporta/);
  assert.match(r.consiglio.pec, /consiglio\.regione\.taa/);
  assert.equal(livello(e, 'europa').gruppi[0].titolo, 'Circoscrizione II · Italia nord-orientale');
});

test('Valle d\'Aosta (Aosta): niente Provincia, collegio unico della Camera e del Senato', () => {
  const e = rappresentanti(conProvince('AO'), istatDi('Aosta', 'AO'));
  assert.equal(livello(e, 'provincia').stato, 'serve-dato');
  const cam = livello(e, 'camera');
  assert.equal(cam.gruppi.length, 1);
  assert.match(cam.gruppi[0].titolo, /VALLE D'AOSTA - U01/);
  assert.equal(cam.gruppi[0].persone.length, 1);
  assert.equal(livello(e, 'senato').gruppi.filter((g) => g.id === 'uninominale')[0].persone.length, 1);
  assert.ok(tutte(livello(e, 'regione')).length >= 30, 'il Consiglio della Valle conta 35 consiglieri');
});

test('collegio che comprende più province: lo stesso deputato per Comuni di province diverse', () => {
  // cerca un collegio uninominale della Camera con Comuni in almeno due province
  const sigle = [...new Set(COMUNI.comuni.map((c) => c[2]))];
  const perCollegio = new Map();
  for (const s of sigle) {
    const p = leggi(`p/${s}.json`);
    for (const [istat, c] of Object.entries(p.comuni)) for (const u of c.camera?.uninominale || []) {
      if (!perCollegio.has(u)) perCollegio.set(u, new Map());
      perCollegio.get(u).set(s, istat);
    }
  }
  const [collegio, province] = [...perCollegio].find(([, m]) => m.size >= 2);
  const [[s1, i1], [s2, i2]] = [...province];
  const idx = conProvince(s1, s2);
  const d1 = livello(rappresentanti(idx, i1), 'camera').gruppi.find((g) => g.titolo.endsWith(collegio));
  const d2 = livello(rappresentanti(idx, i2), 'camera').gruppi.find((g) => g.titolo.endsWith(collegio));
  assert.ok(d1 && d2, collegio);
  assert.deepEqual(d1.persone.map((p) => p.nome), d2.persone.map((p) => p.nome));
});

// ---------- i dati preparati ----------

test('i dati: tutti i Comuni, file di provincia, parlamentari e circoscrizioni coerenti, niente dati personali', () => {
  assert.ok(COMUNI.comuni.length >= 7800, `${COMUNI.comuni.length} Comuni`);
  const visti = new Set();
  for (const [istat, nome, sigla, regione] of COMUNI.comuni) {
    assert.match(istat, /^\d{6}$/, nome);
    assert.ok(!visti.has(istat), `doppio ${istat}`); visti.add(istat);
    assert.match(sigla, /^[A-Z]{2}$/);
    assert.ok(COMUNI.regioni[regione], `${nome}: regione ${regione}`);
    assert.ok(existsSync(new URL(`p/${sigla}.json`, qui)), `manca p/${sigla}.json`);
  }
  assert.ok(NAZIONALE.camera.length >= 380 && NAZIONALE.camera.length <= 400);
  assert.ok(NAZIONALE.senato.length >= 190 && NAZIONALE.senato.length <= 206);
  assert.equal(NAZIONALE.europa.deputati.length, 76);
  assert.equal(Object.values(NAZIONALE.europa.circoscrizioni).reduce((a, c) => a + c.seggi, 0), 76);
  assert.equal(new Set(Object.values(NAZIONALE.europa.circoscrizioni).flatMap((c) => c.regioni)).size, 20, 'ogni Regione in una circoscrizione');
  assert.equal(Object.keys(NAZIONALE.regioni).length, 20);
  const testoTutto = JSON.stringify(NAZIONALE) + readFileSync(new URL('p/MI.json', qui), 'utf-8');
  assert.doesNotMatch(testoTutto, /data_nascita|luogo_nascita|professione|titolo_studio|Laurea|nato\/a il/, 'niente dati personali oltre l\'incarico');
  for (const d of NAZIONALE.camera) assert.ok(d.nome && d.collegio && d.scheda.startsWith('https://'), d.nome);
});

test('nessuna lista e nessun gruppo nei dati pubblicati', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const dir = new URL('../dati/', import.meta.url);
  const file = ['comuni.json', 'nazionale.json', ...readdirSync(new URL('p/', dir)).map((f) => `p/${f}`)];
  for (const f of file) {
    const s = readFileSync(new URL(f, dir), 'utf8');
    assert.doesNotMatch(s, /"(lista|gruppo)":"[^"]/, f);
  }
});
