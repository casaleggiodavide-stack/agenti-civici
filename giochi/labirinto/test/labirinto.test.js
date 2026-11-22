import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PERCORSI, PER_ID, STRUMENTI, percorsoDaSeme, semeLibero, prossimo, ordineScelte, labirintoDi, nuovoStato, scegli, finito, totale,
  punteggio, MEDAGLIE, medaglieGuadagnate, filaDopo, TITOLI, BASE, BONUS_PULITO, PER_GIORNO, BONUS_SERIE,
} from '../src/regole.js';
import { aperti, misure } from '../src/labirinto.js';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const giusta = (b) => b.scelte.findIndex((s) => s.giusta);
const sbagliate = (b) => b.scelte.map((s, i) => (s.giusta ? -1 : i)).filter((i) => i >= 0);
const tuttoGiusto = (p) => p.bivi.map(giusta);

test('almeno 10 percorsi, dal più facile al più difficile, con 5-8 bivi', () => {
  assert.ok(PERCORSI.length >= 10);
  for (let i = 1; i < PERCORSI.length; i++) assert.ok(PERCORSI[i - 1].livello <= PERCORSI[i].livello, 'livelli in ordine');
  for (const p of PERCORSI) {
    assert.ok(p.bivi.length >= 5 && p.bivi.length <= 8, p.id);
    if (p.livello === 1) assert.equal(p.bivi.length, 5, p.id);
    if (p.livello === 3) assert.ok(p.bivi.filter((b) => b.tipo === 'termine').length >= 2, `${p.id}: almeno due bivi sui termini`);
  }
  const corti = PERCORSI.filter((p) => p.livello === 1), lunghi = PERCORSI.filter((p) => p.livello === 3);
  assert.ok(Math.max(...corti.map((p) => p.bivi.length)) < Math.min(...lunghi.map((p) => p.bivi.length)), 'i primi più corti');
});

test('ogni bivio ha una sola strada giusta, vicoli con giorni e perché, la norma con il link', () => {
  for (const p of PERCORSI) {
    assert.ok(STRUMENTI[p.strumento], `${p.id}: strumento ${p.strumento}`);
    assert.ok(fs.existsSync(path.join(REPO, p.strumento, 'index.html')), `${p.id}: lo strumento esiste`);
    for (const [k, b] of p.bivi.entries()) {
      const dove = `${p.id} bivio ${k + 1}`;
      assert.ok(b.scelte.length >= 2 && b.scelte.length <= 3, dove);
      assert.equal(b.scelte.filter((s) => s.giusta).length, 1, dove);
      for (const s of b.scelte) if (!s.giusta) assert.ok(s.giorni > 0 && s.perche.length > 10, dove);
      assert.match(b.fonte.url, /^https:\/\//, dove);
      assert.ok(b.fonte.norma.length > 5 && b.spiega.length > 20, dove);
      const [file, riga] = b.rif.split(':');
      const righe = fs.readFileSync(path.join(REPO, file), 'utf8').split('\n');
      assert.ok(Number(riga) >= 1 && Number(riga) <= righe.length, `${dove}: rif ${b.rif}`);
    }
  }
});

test('le norme citano l\'articolo quando sono leggi', () => {
  const legge = /(L\.|D\.lgs|D\.l\.|Codice|codice|D\.P\.R\.|Regolamento|Cod\. proc|Disposizioni)/;
  for (const p of PERCORSI) for (const b of p.bivi) if (legge.test(b.fonte.norma)) assert.match(b.fonte.norma, /artt?\.\s/, `${p.id}: ${b.fonte.norma}`);
});

test('ogni link dei bivi compare nei file dello strumento (anche composto nel codice)', async () => {
  for (const p of PERCORSI) {
    const urls = new Set();
    const raccogli = (v, visti = new Set()) => {
      if (typeof v === 'string') { for (const m of v.matchAll(/https?:\/\/[^\s"'<>)]+/g)) urls.add(m[0]); return; }
      if (!v || typeof v !== 'object' || visti.has(v)) return;
      visti.add(v);
      for (const k of Object.keys(v)) raccogli(v[k], visti);
    };
    const leggi = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, f.name); if (f.isDirectory()) { if (!['test', 'comune'].includes(f.name)) leggi(q); } else if (/\.(js|json)$/.test(f.name)) raccogli(fs.readFileSync(q, 'utf8')); } };
    leggi(path.join(REPO, p.strumento));
    for (const f of ['src/regole.js', 'src/documento.js', 'src/pratiche.js', 'src/prestazioni/index.js']) {
      const q = path.join(REPO, p.strumento, f);
      if (fs.existsSync(q)) raccogli(await import(q));
    }
    for (const b of p.bivi) assert.ok(urls.has(b.fonte.url), `${p.id}: ${b.fonte.url}`);
  }
});

test('il seme sceglie il percorso: id per le partite libere, data per la sfida del giorno', () => {
  assert.equal(percorsoDaSeme('multa-x7k2p').id, 'multa');
  assert.equal(percorsoDaSeme(semeLibero('delibera', 'ab-12/zz')).id, 'delibera');
  assert.equal(percorsoDaSeme('2026-11-22').id, percorsoDaSeme('2026-11-22').id);
  const visti = new Set();
  for (let g = 1; g <= 60; g++) visti.add(percorsoDaSeme(`2026-12-${String(g).padStart(2, '0')}`).id);
  assert.ok(visti.size >= 6, 'la sfida del giorno cambia percorso');
  assert.equal(prossimo([]).id, PERCORSI[0].id);
  assert.equal(prossimo(PERCORSI.slice(0, 3).map((p) => p.id)).id, PERCORSI[3].id);
  assert.equal(prossimo(PERCORSI.map((p) => p.id)), null);
});

test('l\'ordine delle scelte è mescolato dal seme, uguale per tutti', () => {
  const p = PER_ID.multa;
  assert.deepEqual(ordineScelte(p, '2026-11-22'), ordineScelte(p, '2026-11-22'));
  for (const o of ordineScelte(p, 'xyz')) assert.deepEqual([...o].sort(), o.map((_, i) => i));
  const giuste = new Set();
  for (let i = 0; i < 30; i++) ordineScelte(p, `s${i}`).forEach((o, k) => giuste.add(o.indexOf(giusta(p.bivi[k]))));
  assert.ok(giuste.size >= 2, 'la giusta non sta sempre nello stesso posto');
});

test('la pianta: una strada dall\'ingresso all\'uscita, un corridoio per ogni scelta', () => {
  for (const p of PERCORSI) for (const seme of ['2026-11-22', `${p.id}-a1`, `${p.id}-b2`]) {
    const l = labirintoDi(p, seme), ap = aperti(l), [c, r] = misure(p.bivi.length);
    assert.equal(l.colonne, c); assert.equal(l.righe, r);
    assert.equal(l.via[0], 0); assert.equal(l.via[l.via.length - 1], c * r - 1);
    assert.equal(new Set(l.via).size, l.via.length, 'la strada non passa due volte');
    for (let k = 1; k < l.via.length; k++) assert.ok(ap.has(`${Math.min(l.via[k - 1], l.via[k])}-${Math.max(l.via[k - 1], l.via[k])}`));
    assert.equal(l.bivi.length, p.bivi.length);
    for (const [k, b] of l.bivi.entries()) {
      assert.equal(b.rami.length + 1, p.bivi[k].scelte.length, `${p.id}: corridoi al bivio ${k + 1}`);
      if (k) assert.ok(b.indice > l.bivi[k - 1].indice + 1, 'i bivi sono distanziati');
    }
    const usate = [...l.via, ...l.bivi.flatMap((b) => b.rami.flat())];
    assert.equal(new Set(usate).size, usate.length, 'i vicoli non si toccano');
    assert.deepEqual(labirintoDi(p, seme), l, 'stesso seme, stesso labirinto');
  }
});

test('strada giusta: avanza e dà 100 punti; vicolo cieco: giorni persi e si resta al bivio', () => {
  const p = PER_ID.buca, b = p.bivi[0];
  let s = nuovoStato(p);
  s = scegli(s, p, sbagliate(b)[0]);
  assert.equal(s.bivio, 0); assert.equal(s.vicoli, 1); assert.equal(s.giorni, b.scelte[sbagliate(b)[0]].giorni);
  assert.throws(() => scegli(s, p, sbagliate(b)[0]), /già provata/);
  assert.throws(() => scegli(s, p, 7), /inesistente/);
  s = scegli(s, p, giusta(b));
  assert.equal(s.bivio, 1); assert.equal(s.punti, BASE); assert.deepEqual(s.alPrimo, [false]); assert.equal(s.serie, 0);
});

test('i punti: serie dal terzo bivio al primo colpo, giorni persi, uscita pulita', () => {
  const p = PER_ID.garanzia;
  let s = nuovoStato(p);
  for (const i of tuttoGiusto(p)) s = scegli(s, p, i);
  assert.ok(finito(s, p));
  assert.equal(totale(s, p), 5 * BASE + 3 * BONUS_SERIE + BONUS_PULITO);
  let t = nuovoStato(p);
  const vicolo = sbagliate(p.bivi[2])[0], g = p.bivi[2].scelte[vicolo].giorni;
  for (const [k, i] of tuttoGiusto(p).entries()) { if (k === 2) t = scegli(t, p, vicolo); t = scegli(t, p, i); }
  assert.equal(totale(t, p), 5 * BASE + 0 - PER_GIORNO * g, 'il vicolo rompe la serie e toglie il bonus');
  assert.throws(() => scegli(s, p, 0), /già finito/);
});

test('punteggio(partita, seme) per la classifica ricalcola i punti e rifiuta le mosse impossibili', () => {
  const p = PER_ID.multa;
  const pulita = { percorso: 'multa', scelte: tuttoGiusto(p) };
  assert.equal(punteggio(pulita, 'multa-abc'), 6 * BASE + 4 * BONUS_SERIE + BONUS_PULITO);
  const conVicolo = { percorso: 'multa', scelte: [sbagliate(p.bivi[0])[1], ...tuttoGiusto(p)] };
  assert.equal(punteggio(conVicolo, 'multa-abc'), 6 * BASE + 3 * BONUS_SERIE - PER_GIORNO * p.bivi[0].scelte[sbagliate(p.bivi[0])[1]].giorni);
  const delGiorno = percorsoDaSeme('2026-11-22');
  assert.ok(punteggio({ percorso: delGiorno.id, scelte: tuttoGiusto(delGiorno) }, '2026-11-22') > 0);
  assert.throws(() => punteggio({ percorso: 'multa', scelte: tuttoGiusto(p) }, 'volo-abc'), /seme/);
  assert.throws(() => punteggio({ percorso: 'nessuno', scelte: [0] }, ''), /sconosciuto/);
  assert.throws(() => punteggio({ percorso: 'multa', scelte: tuttoGiusto(p).slice(0, 3) }, 'multa-a'), /non finito/);
  assert.throws(() => punteggio({ percorso: 'multa', scelte: [...tuttoGiusto(p), 0] }, 'multa-a'), /già finito/);
  assert.throws(() => punteggio({ percorso: 'multa', scelte: ['1', 0] }, 'multa-a'), /inesistente/);
  assert.throws(() => punteggio(null, 'multa-a'), /mancante/);
  assert.throws(() => punteggio({ percorso: 'multa', scelte: new Array(99).fill(0) }, 'multa-a'), /non valide/);
});

test('medaglie e titoli', () => {
  const p = PER_ID.ferma;
  let s = nuovoStato(p);
  for (const i of tuttoGiusto(p)) s = scegli(s, p, i);
  const m = medaglieGuadagnate(s, p, { finiti: PERCORSI.map((x) => x.id), fila: 7, delGiorno: true });
  for (const id of ['prima', 'pulito', 'termini', 'difficile', 'giorno', 'meta', 'tutti', 'fila']) assert.ok(m.includes(id), id);
  for (const id of m) assert.ok(MEDAGLIE[id], id);
  assert.deepEqual(medaglieGuadagnate(nuovoStato(p), p), [], 'niente medaglie a metà');
  const q = PER_ID.buca;
  let t = nuovoStato(q);
  t = scegli(t, q, sbagliate(q.bivi[0])[0]);
  for (const i of tuttoGiusto(q)) t = scegli(t, q, i);
  assert.deepEqual(medaglieGuadagnate(t, q, { finiti: ['buca'] }), ['prima']);
  assert.equal(filaDopo({ ultimo: '2026-11-21', fila: 6 }, '2026-11-22'), 7);
  assert.equal(filaDopo({ ultimo: '2026-11-22', fila: 3 }, '2026-11-22'), 3);
  assert.equal(filaDopo({ ultimo: '2026-11-10', fila: 9 }, '2026-11-22'), 1);
  for (let i = 1; i < TITOLI.length; i++) assert.ok(TITOLI[i][0] > TITOLI[i - 1][0]);
  const max = Math.max(...PERCORSI.map((x) => { let z = nuovoStato(x); for (const i of tuttoGiusto(x)) z = scegli(z, x, i); return totale(z, x); }));
  assert.ok(max >= TITOLI[TITOLI.length - 1][0], 'il titolo più alto si può prendere');
});

test('testi brevi, senza nomi di assistenti e senza la parola vietata', () => {
  const tutto = JSON.stringify(PERCORSI);
  assert.doesNotMatch(tutto, /\b(Claude|ChatGPT|GPT|Gemini|Anthropic|OpenAI)\b/);
  assert.doesNotMatch(tutto, /piovra/i);
  for (const p of PERCORSI) for (const b of p.bivi) {
    assert.ok(b.domanda.length <= 150 && b.spiega.length <= 220, p.id);
    for (const s of b.scelte) assert.ok(s.testo.length <= 75 && (!s.perche || s.perche.length <= 170), p.id);
  }
});
