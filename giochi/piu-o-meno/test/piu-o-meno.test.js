import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  META, CARTE, COPPIE, VITE, FINESTRE, PUNTI_LIVELLO, BONUS_ORO, BONUS_LAMPO, BONUS_SERIE, carta, preparaPartita, giusta, livello, nuovoStato, segna, finita,
  punteggio, puntiRisposta, euro, rispettoMediana, perAbitante, quanteVolte, medaglieGuadagnate, MEDAGLIE, TITOLI,
} from '../src/regole.js';

const CF_PERSONA = /[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]/;

/** Una partita giocata da un giocatore che sbaglia quando vuole (sbaglia(k) true = sceglie il meno caro). */
function gioca(seme, sbaglia = () => false, rimasto = () => 0.5) {
  const p = preparaPartita(seme);
  const scelte = [];
  let s = nuovoStato();
  for (let k = 0; !finita(s); k++) {
    const caro = CARTE[p.carte[k]][9] > CARTE[p.carte[k + 1]][9] ? 's' : 'd';
    const x = sbaglia(k) ? (caro === 's' ? 'd' : 's') : caro;
    const r = rimasto(k);
    scelte.push([x, r]);
    s = segna(s, giusta(p, k, x), r, { livello: livello(k), oro: p.oro[k + 1] });
  }
  return { p, scelte, s };
}

test('il mazzo: almeno 600 contratti veri, con CIG, importo plausibile e categoria nota', () => {
  assert.ok(CARTE.length >= 600, `solo ${CARTE.length} contratti`);
  const cig = new Set();
  for (let i = 0; i < CARTE.length; i++) {
    const c = carta(i);
    assert.ok(/^[A-Z0-9]{10}$/.test(c.cig), `CIG strano: ${c.cig}`);
    assert.ok(!cig.has(c.cig), `CIG doppio ${c.cig}`); cig.add(c.cig);
    assert.ok(c.importo >= 1500 && c.importo < 50_000_000, `${c.cig}: importo ${c.importo}`);
    assert.ok(c.importo <= c.mediana * 60 && c.importo >= c.mediana / 120, `${c.cig}: fuori scala per la categoria`); // la regola usa la mediana prima del filtro
    assert.ok(c.testo.length >= 14 && c.originale.length >= c.testo.length * 0.5, `${c.cig}: testo`);
    assert.ok(c.ente && c.regione && c.procedura && c.tipoEnte, `${c.cig}: campi mancanti`);
    assert.equal(c.anno, META.anno);
    assert.ok(c.link.startsWith('https://dati.anticorruzione.it/') && c.link.includes(c.cig));
  }
});

test('categorie bilanciate e varietà territoriale', () => {
  const per = {};
  for (const c of CARTE) per[c[1]] = (per[c[1]] || 0) + 1;
  const n = Object.values(per);
  assert.ok(Object.keys(per).length >= 20, 'troppo poche categorie');
  assert.ok(Math.max(...n) <= 30, `una categoria ha ${Math.max(...n)} contratti`);
  assert.ok(Math.max(...n) / CARTE.length < 0.06);
  const regioni = new Set(CARTE.map((c) => c[7]));
  assert.equal(regioni.size, 20, 'mancano regioni');
  for (const cat of META.categorie) assert.ok(cat.n >= 12 && cat.mediana > 0 && cat.min <= cat.mediana && cat.mediana <= cat.max, cat.id);
});

test('niente persone fisiche e niente frasi da giudizio nei testi', () => {
  for (const c of CARTE) {
    const testo = [c[2], c[3], c[4], c[12]].join(' ');
    assert.ok(!CF_PERSONA.test(testo), `${c[0]}: codice fiscale di una persona`);
    assert.ok(!/\b(ING|ARCH|DOTT|AVV|GEOM)\.\s+[A-Z]/i.test(c[3]), `${c[0]}: nomina un professionista`);
    assert.ok(!/\bditta\b|\bs\.?r\.?l\b/i.test(c[3]), `${c[0]}: nomina una ditta`);
    assert.ok(!/spreco|scandal|gonfiat|ruberi/i.test(c[12]), `${c[0]}: curiosità con un giudizio`);
  }
  const testo = readFileSync(new URL('../src/regole.js', import.meta.url), 'utf8') + readFileSync(new URL('../web/gioco.js', import.meta.url), 'utf8');
  assert.ok(!/spreco|scandal/i.test(testo));
});

test('la partita dipende solo dal seme: stesso seme, stesse carte', () => {
  const a = preparaPartita('2026-11-22'), b = preparaPartita('2026-11-22'), c = preparaPartita('2026-11-23');
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.carte, c.carte);
  assert.equal(a.carte.length, COPPIE + 1);
  assert.equal(new Set(a.carte).size, COPPIE + 1, 'una carta ripetuta');
});

test('dal facile al difficile: prime coppie lontane e familiari, ultime dello stesso ordine di grandezza', () => {
  for (let n = 0; n < 200; n++) {
    const p = preparaPartita(`prova-${n}`);
    for (let k = 0; k < COPPIE; k++) {
      const a = CARTE[p.carte[k]][9], b = CARTE[p.carte[k + 1]][9], r = Math.max(a, b) / Math.min(a, b);
      const [min, max] = FINESTRE[livello(k) - 1];
      assert.ok(r >= 1.15, 'importi quasi uguali');
      assert.ok(r >= min && r < max, `seme ${n}, coppia ${k}: rapporto ${r.toFixed(2)} fuori dal livello ${livello(k)}`);
      if (livello(k) === 1) assert.ok(META.categorie[CARTE[p.carte[k + 1]][1]].facile, 'nelle prime coppie solo oggetti familiari');
    }
    assert.ok(META.categorie[CARTE[p.carte[0]][1]].facile);
  }
});

test('i contratti d\'oro: ogni tanto, con una curiosità, mai due di fila', () => {
  let tot = 0;
  for (let n = 0; n < 200; n++) {
    const p = preparaPartita(`oro-${n}`);
    p.oro.forEach((o, i) => { if (o) { tot += 1; assert.ok(CARTE[p.carte[i]][12], 'oro senza curiosità'); assert.ok(!p.oro[i + 1] && !p.oro[i + 2], 'ori troppo vicini'); } });
  }
  assert.ok(tot / 200 >= 1.5 && tot / 200 <= 6, `in media ${tot / 200} ori a partita`);
});

test('giusta, punti, serie, vite restituite e fine', () => {
  const p = { carte: [0, 1] };
  const carte = [['A', 0, '', '', '', 0, '', 0, 0, 100], ['B', 0, '', '', '', 0, '', 0, 0, 300]];
  assert.equal(giusta(p, 0, 'd', carte), true);
  assert.equal(giusta(p, 0, 's', carte), false);
  assert.equal(giusta(p, 0, '-', carte), false);
  assert.equal(puntiRisposta(1, 0, 1, false), PUNTI_LIVELLO[0]);
  assert.equal(puntiRisposta(3, 0.9, 3, true), PUNTI_LIVELLO[2] + BONUS_LAMPO + BONUS_SERIE + BONUS_ORO);
  let s = nuovoStato();
  s = segna(s, false, 0); assert.equal(s.vite, VITE - 1);
  for (let i = 0; i < 5; i++) s = segna(s, true, 0, { livello: 1 });
  assert.equal(s.vite, VITE, 'cinque di fila ridanno una vita');
  assert.equal(s.viteRese, 1);
  assert.equal(s.punti, 5 * 10 + 3 * BONUS_SERIE);
  s = segna(segna(segna(s, false, 0), false, 0), false, 0);
  assert.equal(finita(s), true);
});

test('punteggio(partita, seme) rifà i conti del browser', () => {
  for (const seme of ['2026-11-22', 'abc123', 'x']) {
    const tutte = gioca(seme, () => false, (k) => (k % 3 ? 0.8 : 0.2));
    assert.equal(punteggio({ scelte: tutte.scelte }, seme), tutte.s.punti);
    assert.equal(tutte.scelte.length, COPPIE);
    const tre = gioca(seme, (k) => k >= 4, () => 0.3);
    assert.equal(tre.scelte.length, 7, 'tre errori di fila chiudono la partita');
    assert.equal(punteggio({ scelte: tre.scelte }, seme), tre.s.punti);
  }
});

test('punteggio rifiuta le partite impossibili', () => {
  const { scelte } = gioca('2026-11-22', (k) => k >= 2);
  assert.throws(() => punteggio({ scelte: [...scelte, ['s', 0.5]] }, '2026-11-22'), /già finita|numero/);
  assert.throws(() => punteggio({ scelte: scelte.slice(0, 2) }, '2026-11-22'), /non finita/);
  assert.throws(() => punteggio({ scelte: [['x', 0.5]] }, 'a'), /non valida/);
  assert.throws(() => punteggio({ scelte: [['s', 2]] }, 'a'), /tempo/);
  assert.throws(() => punteggio({ scelte: [] }, 'a'));
  assert.throws(() => punteggio(null, 'a'));
  assert.throws(() => punteggio({ scelte: Array(COPPIE + 1).fill(['s', 0.5]) }, 'a'));
  // con un seme diverso le stesse mosse danno un altro risultato (o non tornano)
  const tutte = gioca('seme-a');
  let diverso;
  try { diverso = punteggio({ scelte: tutte.scelte }, 'seme-b'); } catch { diverso = -1; }
  assert.notEqual(diverso, tutte.s.punti);
});

test('confronti: euro, mediana, per abitante, quante volte', () => {
  assert.equal(euro(125000), '125.000 €');
  assert.equal(euro(1234567.4), '1.234.567 €');
  assert.equal(euro(8970.5), '8.970,50 €');
  assert.equal(rispettoMediana(30000, 10000), '3,0 volte la mediana');
  assert.equal(rispettoMediana(5000, 10000), 'il 50% della mediana');
  assert.equal(rispettoMediana(10200, 10000), 'in linea con la mediana');
  assert.equal(rispettoMediana(250000, 10000), '25 volte la mediana');
  assert.equal(perAbitante(20000, 4000), '5,00');
  assert.equal(perAbitante(200000, 1000), '200');
  assert.equal(perAbitante(1000, 0), null);
  assert.equal(quanteVolte(100, 320), '3,2');
});

test('medaglie e titoli: la partita perfetta prende tutto', () => {
  const { s } = gioca('2026-11-22', () => false, () => 0.9);
  const m = medaglieGuadagnate(s);
  for (const id of ['prima', 'lampo', 'serie', 'vicine', 'venti']) assert.ok(m.includes(id), id);
  for (const id of m) assert.ok(MEDAGLIE[id]);
  assert.ok(s.punti >= TITOLI[TITOLI.length - 1][0], `massimo ${s.punti}`);
  const breve = gioca('2026-11-22', () => true).s;
  assert.deepEqual(medaglieGuadagnate(breve), ['prima']);
  assert.equal(breve.punti, 0);
});
