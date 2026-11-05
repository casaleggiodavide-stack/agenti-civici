import { test } from 'node:test';
import assert from 'node:assert/strict';
import { punteggio } from '../src/verifica.js';
import { crea } from '../src/api.js';
import { apri } from '../server.js';
import { scegliPartita } from '../../giochi/truffa/src/regole.js';
import { MESSAGGI } from '../../giochi/truffa/src/messaggi.js';
import { NEGOZI } from '../../giochi/carrello/src/negozi.js';
import RIFIUTI from '../../giochi/differenzia/src/rifiuti.js';
import { caso } from '../../giochi/comune/premi.js';
import { nome, codiceCasuale, CREATURE, AGGETTIVI } from '../../giochi/comune/nomi.js';

const truffaPerfetta = (seme) => ({ risposte: scegliPartita(MESSAGGI, caso(`${seme}-truffa`)).map((m) => [m.truffa ? 't' : 'a', 1]) });
const carrelloPerfetto = () => ({ negozi: NEGOZI.map((n) => ({
  trovati: n.elementi.filter((e) => e.trappola && ['info', 'costo'].includes(e.tipo)).map((e) => e.id), falsi: [],
  caselle: Object.fromEntries(n.elementi.filter((e) => e.tipo === 'casella').map((e) => [e.id, false])), scelta: 'piccolo', resta: 20 })) });
const giusti = (k) => ({ lanci: RIFIUTI.rifiuti.slice(0, k).map((r) => [r.id, r.contenitore, 0]) });

test('i nomi sono solo quelli inventati, con l\'accordo giusto', () => {
  assert.equal(nome([1, 1, 7]), 'Seppia Saggia 7');
  assert.equal(nome([0, 0, 42]), 'Polpo Rapido 42');
  assert.equal(nome([CREATURE.length, 0, 1]), null);
  assert.equal(nome(['Mario', 'Rossi', 1]), null);
  assert.equal(nome([0, AGGETTIVI.length, 1]), null);
  for (let i = 0; i < 50; i++) assert.ok(nome(codiceCasuale()));
});

test('il servizio rifà i conti: truffa, carrello, differenzia', () => {
  assert.equal(punteggio('truffa', truffaPerfetta('abc'), 'abc'), 15 * 15 + 13 * 5);
  assert.equal(punteggio('carrello', carrelloPerfetto()), NEGOZI.reduce((t, n) => t + n.elementi.filter((e) => e.trappola).length * 10 + 10 + 20, 0));
  assert.equal(punteggio('differenzia', giusti(5)), 10 + 10 + 10 + 10 + 20);
  // un trucco: la stessa partita della truffa con un altro seme non torna
  assert.throws(() => punteggio('truffa', truffaPerfetta('abc'), 'altro'));
  assert.throws(() => punteggio('differenzia', { lanci: [['non-esiste', 'carta', 0]] }));
  assert.throws(() => punteggio('differenzia', { lanci: RIFIUTI.rifiuti.slice(0, 10).map((r) => [r.id, r.contenitore, 1]) }), /oro/);
  assert.throws(() => punteggio('carrello', { negozi: [carrelloPerfetto().negozi[0]] }));
  const furbo = carrelloPerfetto(); furbo.negozi[0].trovati.push('spedizione');
  assert.throws(() => punteggio('carrello', furbo), /trappola/);
});

const nuovo = (giorno = '2026-11-05T10:00:00Z') => crea({ db: apri(), adesso: () => new Date(giorno) });
const chiama = (g, metodo, percorso, corpo, ip = '1.1.1.1') => { const u = new URL(`http://x${percorso}`); return g({ metodo, percorso: u.pathname, query: u.searchParams, corpo: corpo && JSON.stringify(corpo), ip }); };
const gioc = (i) => String(i).padStart(2, '0').repeat(8);

test('classifica del giorno, di sempre, posizione e regioni', async () => {
  const g = nuovo();
  const [s1, r1] = await chiama(g, 'POST', '/classifica/truffa', { giocatore: gioc(1), nome: [1, 1, 7], regione: 'Puglia', seme: '2026-11-05', giorno: true, partita: truffaPerfetta('2026-11-05') });
  assert.equal(s1, 200);
  assert.equal(r1.punti, 290);
  assert.equal(r1.oggi[0].nome, 'Seppia Saggia 7');
  assert.equal(r1.tu.oggi.posizione, 1);
  // un'altra persona, partita libera: va solo nella classifica di sempre
  const peggio = { risposte: truffaPerfetta('xyz').risposte.map(([r], i) => [i < 1 ? (r === 't' ? 'a' : 't') : r, 0]) };
  const [s2, r2] = await chiama(g, 'POST', '/classifica/truffa', { giocatore: gioc(2), nome: [0, 0, 1], regione: 'Inventata', seme: 'xyz', giorno: false, partita: peggio });
  assert.equal(s2, 200);
  assert.equal(r2.delGiorno, false);
  assert.equal(r2.tu.oggi, null);
  assert.equal(r2.tu.sempre.posizione, 2);
  assert.equal(r2.sempre[1].regione, ''); // regione fuori elenco: non salvata
  // il codice del giocatore non esce mai
  const [, lettura] = await chiama(g, 'GET', `/classifica/truffa?giocatore=${gioc(2)}`);
  assert.ok(!JSON.stringify(lettura).includes(gioc(1)));
  assert.equal(lettura.giocatori.sempre, 2);
  // regioni: compaiono solo con almeno tre giocatori
  assert.deepEqual(lettura.regioni, []);
  for (const i of [3, 4]) await chiama(g, 'POST', '/classifica/truffa', { giocatore: gioc(i), nome: [2, 2, i], regione: 'Puglia', seme: '2026-11-05', giorno: true, partita: truffaPerfetta('2026-11-05') }, `9.9.9.${i}`);
  const [, conRegioni] = await chiama(g, 'GET', '/classifica/truffa');
  assert.deepEqual(conRegioni.regioni.map((r) => [r.regione, r.giocatori, r.media]), [['Puglia', 3, 290]]);
});

test('una sfida del giorno vecchia non entra nella classifica di oggi; si può uscire dalla classifica', async () => {
  const g = nuovo();
  const [, r] = await chiama(g, 'POST', '/classifica/carrello', { giocatore: gioc(5), nome: [3, 3, 3], seme: '2026-10-01', giorno: true, partita: carrelloPerfetto() });
  assert.equal(r.delGiorno, false);
  const [s, rifiuto] = await chiama(g, 'POST', '/classifica/carrello', { giocatore: gioc(5), nome: [3, 3, 3], seme: 'a', partita: carrelloPerfetto() });
  assert.equal(s, 429, rifiuto.errore); // una partita alla volta
  await chiama(g, 'DELETE', `/classifica/giocatore/${gioc(5)}`);
  const [, dopo] = await chiama(g, 'GET', '/classifica/carrello');
  assert.equal(dopo.sempre.length, 0);
});

test('richieste sbagliate', async () => {
  const g = nuovo();
  assert.equal((await chiama(g, 'POST', '/classifica/truffa', { giocatore: 'corto', nome: [0, 0, 1], seme: 'a', partita: {} }))[0], 400);
  assert.equal((await chiama(g, 'POST', '/classifica/truffa', { giocatore: gioc(6), nome: [0, 0, 1], seme: 'a', partita: {} }))[0], 422);
  assert.equal((await chiama(g, 'GET', '/classifica/sconosciuto'))[0], 404);
  assert.equal((await g({ metodo: 'POST', percorso: '/classifica/truffa', query: new URLSearchParams(), corpo: '{', ip: 'x' }))[0], 400);
});
