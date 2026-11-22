import { test } from 'node:test';
import assert from 'node:assert/strict';
import DATI from '../src/comuni.js';
import * as R from '../src/regole.js';
import { leggiSfida } from '../../comune/premi.js';

const per = (nome, sigla) => R.prepara().comuni.find((c) => c.nome === nome && (!sigla || c.sigla === sigla));
const giorni = (da, a) => { const out = []; for (let d = new Date(`${da}T12:00:00Z`); d <= new Date(`${a}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10)); return out; };

test('le Regioni confinanti scritte a mano sono simmetriche e coprono tutte le 20 Regioni', () => {
  assert.deepEqual(Object.keys(R.CONFINANTI).sort(), [...DATI.regioni].sort());
  for (const [a, vicine] of Object.entries(R.CONFINANTI)) {
    for (const b of vicine) assert.ok(R.CONFINANTI[b].includes(a), `${a} confina con ${b} ma non il contrario`);
    assert.ok(!vicine.includes(a));
  }
  assert.deepEqual(R.CONFINANTI.Sicilia, []);
  assert.deepEqual(R.CONFINANTI.Sardegna, []);
});

test('le confinanti scritte a mano sono le stesse dei confini ISTAT', () => {
  for (const r of DATI.regioni) assert.deepEqual([...R.CONFINANTI[r]].sort(), DATI.verifica.confinanti[r], r);
});

test('le fasce di abitanti hanno tutte la loro mediana', () => {
  R.FASCE.forEach((_, i) => assert.ok(DATI.mediane[R.nomeFascia(i)], R.nomeFascia(i)));
  assert.equal(R.nomeFascia(R.fasciaDi(1500)), 'da 1.000 a 2.000 abitanti');
  assert.equal(R.nomeFascia(R.fasciaDi(2747290)), 'oltre 250.000 abitanti');
  assert.equal(R.migliaia(1234567), '1.234.567');
});

test('ogni Regione sta in una sola ripartizione', () => {
  const tutte = Object.values(R.RIPARTIZIONI).flat();
  assert.equal(tutte.length, 20);
  assert.deepEqual([...tutte].sort(), [...DATI.regioni].sort());
  assert.equal(R.ripartizioneDi('Lazio'), 'Centro');
  assert.equal(R.ripartizioneDi('Sardegna'), 'Isole');
});

test('la difficoltà del giorno: lunedì e martedì capoluoghi, poi sopra i 30.000, nel fine settimana da 10.000', () => {
  // lunedì 23 novembre 2026
  assert.deepEqual(['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29'].map(R.livelloDelGiorno),
    ['capoluoghi', 'capoluoghi', 'grandi', 'grandi', 'grandi', 'diecimila', 'diecimila']);
  for (const g of giorni('2026-11-23', '2026-12-31')) {
    const { comune, livello } = R.comuneDelGiorno(g);
    assert.ok(R.LIVELLI[livello].prova(comune), `${g}: ${comune.nome}`);
    if (livello === 'capoluoghi') assert.ok(comune.capoluogo);
    if (livello === 'grandi') assert.ok(comune.pop >= 30000 && !comune.capoluogo);
    if (livello === 'diecimila') assert.ok(comune.pop >= 10000);
  }
});

test('mai lo stesso Comune due volte in 365 giorni (2026-2030)', () => {
  const visto = new Map();
  for (const g of giorni('2026-01-01', '2030-12-31')) {
    const { comune } = R.comuneDelGiorno(g);
    const prima = visto.get(comune.istat);
    if (prima) assert.ok((new Date(g) - new Date(prima)) / 864e5 >= 365, `${comune.nome} il ${prima} e il ${g}`);
    visto.set(comune.istat, g);
  }
});

test('il Comune del giorno è lo stesso per tutti e cambia ogni giorno', () => {
  assert.equal(R.misterioso('2026-11-23').comune.istat, R.misterioso('2026-11-23').comune.istat);
  const settimana = giorni('2026-11-23', '2026-11-29').map((g) => R.misterioso(g).comune.istat);
  assert.equal(new Set(settimana).size, 7);
  // partita libera: stesso seme, stesso Comune; la lettera dice la difficoltà
  assert.equal(R.misterioso('m-abc123').comune.istat, R.misterioso('m-abc123').comune.istat);
  assert.equal(R.misterioso('c-zz').livello, 'capoluoghi');
  assert.ok(R.misterioso('c-zz').comune.capoluogo);
  assert.throws(() => R.leggiSeme('x-abc'));
  assert.throws(() => R.leggiSeme('2026-02-30'));
});

test('i semi passano dal link di sfida senza perdere niente', () => {
  for (const seme of ['2026-11-23', R.semeLibero('tutti', 'k3j9x2ab'), R.semeLibero('capoluoghi', 'a1')]) {
    const s = leggiSfida(`#sfida=120&seme=${encodeURIComponent(seme)}`);
    assert.equal(s.seme, seme);
    assert.doesNotThrow(() => R.leggiSeme(s.seme));
  }
  assert.equal(R.leggiSeme(R.semeLibero('medi', 'q')).livello, 'medi');
});

test('i gruppi hanno abbastanza Comuni, tutti con i dati per gli indizi', () => {
  const g = Object.fromEntries(Object.keys(R.LIVELLI).map((l) => [l, R.gruppo(l)]));
  assert.ok(g.capoluoghi.length >= 105, 'servono più capoluoghi dei lunedì e martedì di un anno');
  assert.ok(g.grandi.length >= 157, 'servono più Comuni dei mercoledì-venerdì di un anno');
  assert.ok(g.diecimila.length >= 105);
  for (const c of g.tutti) {
    assert.ok(c.dati && c.dati.spesa > 0 && c.dati.pnrr >= 0, c.nome);
    assert.ok(c.dati.debito !== null || c.dati.riscossione !== null, c.nome);
    assert.ok(c.dati.rifiuti !== null || c.dati.gestore, c.nome);
    assert.ok(c.lat > 35 && c.lat < 47.2 && c.lon > 6.5 && c.lon < 18.6, `${c.nome}: ${c.lat}, ${c.lon}`);
  }
});

test('nessun indizio prima dell\'ultimo svela il Comune o la provincia, e il primo non basta mai da solo', () => {
  const piano = (t) => ` ${String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ')} `;
  const parola = (t, p) => piano(t).includes(piano(p));
  for (const livello of Object.keys(R.LIVELLI)) {
    const g = R.gruppo(livello);
    for (const c of g) {
      const ii = R.indizi(c, livello);
      assert.equal(ii.length, R.INDIZI);
      for (const x of ii.slice(0, -1)) {
        assert.ok(!parola(x.testo, c.nome), `${livello}: «${x.testo}» svela ${c.nome}`);
        if (c.provincia.length > 3) assert.ok(!parola(x.testo, c.provincia), `${livello}: «${x.testo}» svela la provincia di ${c.nome}`);
        assert.ok(!x.testo.includes(`(${c.sigla})`));
        assert.ok(x.fonti.length && x.fonti.every((f) => DATI.fonti[f]?.url.startsWith('https://')));
      }
      const f = R.fasciaIndizio(c, g);
      const simili = g.filter((x) => x.ripartizione === c.ripartizione && x.pop >= f.da && x.pop < f.fino);
      assert.ok(simili.length >= 3, `${livello}: ${c.nome} è troppo riconoscibile dal primo indizio`);
      assert.ok(c.pop >= f.da && c.pop < f.fino);
    }
  }
  const messina = per('Messina');
  assert.match(R.indizi(messina, 'capoluoghi').at(-1).testo, /provincia di Messina \(ME\), in Sicilia/);
});

test('dopo il tentativo: stessa Regione, confinante, abitanti, direzione e distanza', () => {
  const milano = per('Milano'), roma = per('Roma'), monza = per('Monza'), bologna = per('Bologna'), palermo = per('Palermo');
  const e = R.confronta(milano, roma);
  assert.equal(e.giusto, false);
  assert.equal(e.regione, 'altra');
  assert.equal(e.abitanti, 'più');
  assert.equal(R.DIREZIONI[e.dir], 'sud-est');
  assert.ok(e.km > 450 && e.km < 500, `Milano-Roma ${e.km}`);
  assert.equal(R.DIREZIONI[R.confronta(roma, milano).dir], 'nord-ovest');
  assert.equal(R.confronta(monza, milano).regione, 'stessa');
  assert.equal(R.confronta(monza, milano).abitanti, 'più');
  assert.equal(R.confronta(milano, monza).abitanti, 'meno');
  assert.equal(R.VICINANZA[R.confronta(monza, milano).vicino][1], 'a un passo');
  assert.equal(R.confronta(bologna, milano).regione, 'confinante');
  assert.equal(R.confronta(palermo, per('Reggio di Calabria')).regione, 'altra');
  assert.equal(R.DIREZIONI[R.confronta(palermo, per('Cagliari')).dir], 'ovest');
  assert.equal(R.confronta(roma, roma).giusto, true);
  assert.equal(R.quadrato(R.confronta(bologna, milano)), '🟧');
});

test('le mosse impossibili sono rifiutate', () => {
  const { comune } = R.misterioso('2026-11-23');
  const altro = per('Roma').istat === comune.istat ? per('Milano') : per('Roma');
  let s = R.mossa(R.nuovoStato(comune), altro.istat);
  assert.equal(s.indizi, 2);
  assert.throws(() => R.mossa(s, altro.istat), /già provato/);
  assert.throws(() => R.mossa(s, '999999'), /sconosciuto/);
  for (let i = 0; i < 4; i++) s = R.mossa(s, 'i');
  assert.equal(s.indizi, 6);
  assert.throws(() => R.mossa(s, 'i'), /indizi finiti/);
  s = R.mossa(s, comune.istat);
  assert.ok(s.vinto && s.finita);
  assert.throws(() => R.mossa(s, 'i'), /finita/);
});

test('i punti: meno tentativi e indizi coperti valgono di più; chi perde fa zero', () => {
  const { comune, livello } = R.misterioso('2026-11-23');
  assert.equal(livello, 'capoluoghi');
  const subito = R.mossa(R.nuovoStato(comune), comune.istat);
  assert.equal(R.punti(subito, 'capoluoghi'), 40 + 100 + 50);
  assert.equal(R.punti(subito, 'tutti'), 2 * 190);
  const sbagliati = R.gruppo('capoluoghi').filter((c) => c.istat !== comune.istat).slice(0, 6).map((c) => c.istat);
  let s = R.nuovoStato(comune);
  for (const x of sbagliati) s = R.mossa(s, x);
  assert.ok(s.finita && !s.vinto);
  assert.equal(R.punti(s, 'capoluoghi'), 0);
  // il sesto tentativo giusto vale il minimo; chiedere un indizio costa 10 punti
  let t = R.nuovoStato(comune);
  for (const x of sbagliati.slice(0, 5)) t = R.mossa(t, x);
  assert.equal(R.punti(R.mossa(t, comune.istat), 'capoluoghi'), 40);
  const conAiuto = R.mossa(R.mossa(R.nuovoStato(comune), 'i'), comune.istat);
  assert.equal(R.punti(conAiuto, 'capoluoghi'), 180);
});

test('punteggio(partita, seme) rifà i conti come il browser e rifiuta le partite impossibili', () => {
  const seme = '2026-11-28';
  const { comune, livello } = R.misterioso(seme);
  const altri = R.gruppo(livello).filter((c) => c.istat !== comune.istat).slice(0, 2).map((c) => c.istat);
  const tentativi = [altri[0], 'i', altri[1], comune.istat];
  let s = R.nuovoStato(comune);
  for (const x of tentativi) s = R.mossa(s, x);
  assert.equal(R.punteggio({ tentativi }, seme), R.punti(s, livello));
  assert.equal(R.punteggio({ tentativi }, seme), Math.round(1.6 * (40 + 20 * 3 + 10 * 2)));
  assert.throws(() => R.punteggio({ tentativi: [altri[0]] }, seme), /non finita/);
  assert.throws(() => R.punteggio({ tentativi: ['ciao'] }, seme), /non valida/);
  assert.throws(() => R.punteggio({}, seme), /mancanti/);
  assert.throws(() => R.punteggio({ tentativi, livello: 'tutti' }, seme), /giorno/);
  const libero = R.semeLibero('tutti', 'p4rt1t4');
  const m = R.misterioso(libero).comune;
  assert.equal(R.punteggio({ tentativi: [m.istat], livello: 'tutti' }, libero), 380);
  assert.throws(() => R.punteggio({ tentativi: [m.istat], livello: 'capoluoghi' }, libero), /difficoltà/);
  assert.throws(() => R.punteggio({ tentativi: [m.istat] }, libero), /difficoltà/);
});

test('la memoria: giorni giusti di fila, Regioni, sfida del giorno una sola volta', () => {
  let x = {};
  x = R.aggiornaMemoria(x, { oggi: '2026-11-20', delGiorno: true, vinto: true, regione: 'Lazio', partita: {} });
  x = R.aggiornaMemoria(x, { oggi: '2026-11-21', delGiorno: true, vinto: true, regione: 'Sicilia', partita: {} });
  x = R.aggiornaMemoria(x, { oggi: '2026-11-22', delGiorno: true, vinto: true, regione: 'Lazio', partita: {} });
  assert.equal(x.filaGiusti, 3);
  assert.equal(R.filaInCorso(x, '2026-11-23'), 3);
  assert.equal(R.filaInCorso(x, '2026-11-25'), 0);
  assert.deepEqual(x.regioni, ['Lazio', 'Sicilia']);
  assert.equal(x.giocato.data, '2026-11-22');
  const libera = R.aggiornaMemoria(x, { oggi: '2026-11-22', delGiorno: false, vinto: true, regione: 'Puglia', partita: {} });
  assert.equal(libera.filaGiusti, 3);
  assert.deepEqual(libera.regioni, ['Lazio', 'Sicilia', 'Puglia']);
  const persa = R.aggiornaMemoria(x, { oggi: '2026-11-23', delGiorno: true, vinto: false, regione: 'Lazio', partita: {} });
  assert.equal(persa.filaGiusti, 0);
  assert.equal(persa.filaMigliore, 3);
});

test('le medaglie', () => {
  const { comune } = R.misterioso('c-medaglie');
  const s = R.mossa(R.nuovoStato(comune), comune.istat);
  assert.deepEqual(R.medaglieGuadagnate(s, comune, { filaGiusti: 7, regioni: DATI.regioni }), ['prima', 'colpo', 'cassetto', ...(comune.pop < 5000 ? ['borgo'] : []), 'tre', 'sette', 'cinque', 'regioni']);
  for (const m of R.medaglieGuadagnate(s, comune)) assert.ok(R.MEDAGLIE[m], m);
  const persa = { ...s, vinto: false };
  assert.deepEqual(R.medaglieGuadagnate(persa, comune), []);
});

test('la condivisione mostra i quadratini e non svela il Comune', () => {
  const { comune, livello } = R.misterioso('2026-11-24');
  const sbagliato = R.gruppo('capoluoghi').find((c) => c.istat !== comune.istat);
  const s = R.mossa(R.mossa(R.mossa(R.nuovoStato(comune), sbagliato.istat), 'i'), comune.istat);
  const t = R.testoCondivisione(s, { giorno: '2026-11-24', livello });
  assert.match(t, /sfida del 24\/11\/2026 · 2\/6 · 💡1/);
  assert.ok(t.endsWith(`${R.quadrato(s.esiti[0])}🟩`));
  assert.ok(!t.includes(comune.nome) && !t.includes(comune.sigla));
});

test('la ricerca trova i Comuni come «Chi raccoglie i rifiuti?»', () => {
  assert.equal(R.cerca('Roma')[0].nome, 'Roma');
  assert.ok(R.cerca('reggio').some((c) => c.nome === "Reggio nell'Emilia"));
  assert.deepEqual(R.cerca('Castro LE').map((c) => c.sigla), ['LE']);
  assert.ok(R.cerca('Forlì')[0].istat);
  assert.deepEqual(R.cerca(''), []);
});
