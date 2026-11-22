// Il filo del labirinto: la pratica è un labirinto disegnato al tratto. Il Polpo cammina con il filo rosso;
// a ogni bivio scegli la strada (pulsanti, lettere nel disegno o tasti A, B, C). La strada giusta avanza e
// il filo si allunga; un vicolo cieco costa giorni e il Polpo spiega perché, con la norma e il link.
// Del labirinto si vede solo quello che hai già percorso: il resto è muro (gli schedari). Tutto resta nel browser.
import {
  PERCORSI, PER_ID, STRUMENTI, LIVELLI, TIPI, percorsoDaSeme, semeLibero, prossimo, ordineScelte, labirintoDi,
  nuovoStato, scegli, finito, totale, MEDAGLIE, medaglieGuadagnate, filaDopo, TITOLI, testoCondivisione, SERIE_MIN,
} from '../src/regole.js';
import { aperti } from '../src/labirinto.js';
import { classificaFine, inTesta } from '../../comune/classifica.js';
import { semeDelGiorno, semeNuovo, preparaApertura, chiudiPartita, condividi, annuncioGrande, coriandoli, suona, pulsanteSuono, archivio } from '../../comune/premi.js';

const GIOCO = 'labirinto';
const $ = (s) => document.querySelector(s);
const meno = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LETTERE = ['A', 'B', 'C'];
const NS = 'http://www.w3.org/2000/svg';
const S = 36, M = 18; // lato della cella e margine del disegno
const palco = $('.palco-lab'), mappa = $('#mappa');

let modo = 'libera', seme = '', p = null, stato = null, pianta = null, ordine = [], occupato = false;
let svelate = new Set(), bocche = new Map(), esplorati = [], collegate = new Set();
const sfida = preparaApertura({ gioco: GIOCO, catalogo: MEDAGLIE, el: $('#premi'), bottone: $('#gioca') });
inTesta(GIOCO, $('#in-testa'));

// ---------------------------------------------------------------- memoria: i percorsi finiti (nello stesso archivio dei record)

const CHIAVE = `polpo-gioco-${GIOCO}`;
function memoria() { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}') || {}; } catch { return {}; } }
function ricordaPercorso(id, giorni) {
  try {
    const x = memoria(), fatti = x.percorsi || {};
    fatti[id] = id in fatti ? Math.min(fatti[id], giorni) : giorni;
    localStorage.setItem(CHIAVE, JSON.stringify({ ...x, percorsi: fatti }));
  } catch { /* niente */ }
}
const finiti = () => Object.keys(memoria().percorsi || {}).filter((id) => PER_ID[id]);

function elencoPercorsi() {
  const fatti = memoria().percorsi || {};
  $('#percorsi').innerHTML = PERCORSI.map((q) => `<li class="${q.id in fatti ? 'fatto' : ''}"><button type="button" data-percorso="${q.id}">${esc(q.titolo)}
    <small>${'●'.repeat(q.livello)}${'○'.repeat(3 - q.livello)} ${esc(LIVELLI[q.livello])} · ${q.bivi.length} bivi${q.id in fatti ? ` · uscito, ${fatti[q.id]} giorni persi al meglio` : ''}</small></button></li>`).join('');
  const oggi = percorsoDaSeme(semeDelGiorno());
  $('#oggi').innerHTML = sfida?.seme
    ? `La sfida ricevuta: <b>${esc(percorsoDaSeme(sfida.seme).titolo)}</b>.`
    : `Sfida del giorno: <b>${esc(oggi.titolo)}</b>, livello ${oggi.livello}. ${(prossimo(finiti()) ? `«Gioca» ti porta a <b>${esc(prossimo(finiti()).titolo)}</b>.` : 'Sei uscito da tutti i percorsi: «Gioca» te ne sceglie uno a caso.')}`;
}
elencoPercorsi();

// ---------------------------------------------------------------- la partita

function nuovaPartita(m = modo, id = null) {
  modo = m;
  if (modo === 'sfida' && sfida?.seme) seme = sfida.seme;
  else if (modo === 'giorno') seme = semeDelGiorno();
  else {
    const q = id ? PER_ID[id] : prossimo(finiti()) || PERCORSI[Math.floor(Math.random() * PERCORSI.length)];
    seme = semeLibero(q.id, semeNuovo());
  }
  p = percorsoDaSeme(seme);
  stato = nuovoStato(p);
  pianta = labirintoDi(p, seme);
  ordine = ordineScelte(p, seme);
  collegate = aperti(pianta);
  svelate = new Set(); bocche = new Map(); esplorati = [];
  $('#apertura').hidden = true; $('#fine').hidden = true; $('.lab-tavolo').hidden = false;
  $('#pratica').innerHTML = `<b>${esc(p.titolo)}</b>${esc(p.pratica)}`;
  $('#esito').textContent = '';
  window.scrollTo({ top: $('.barra-gioco').getBoundingClientRect().top + window.scrollY - 6, behavior: 'auto' });
  disegnaBase();
  aggiornaBarra();
  occupato = true;
  cammina(pianta.via.slice(0, pianta.bivi[0].indice + 1), true).then(() => { occupato = false; mostraBivio(); });
}

function aggiornaBarra() {
  $('#punti').textContent = totale(stato, p);
  $('#giorni').textContent = stato.giorni;
  $('#numero').textContent = `${Math.min(stato.bivio + 1, p.bivi.length)} / ${p.bivi.length}`;
  $('#serie').textContent = stato.serie >= 2 ? `serie ${stato.serie}${stato.serie + 1 >= SERIE_MIN ? ' · +20' : ''}` : '';
}

function mostraBivio() {
  const b = p.bivi[stato.bivio], o = ordine[stato.bivio], lb = pianta.bivi[stato.bivio];
  // la strada giusta è il corridoio che continua; le sbagliate, nell'ordine, i vicoli
  const rami = [...lb.rami];
  bocche = new Map(o.map((i) => [i, b.scelte[i].giusta ? { cella: lb.avanti, vicolo: null } : { cella: rami[0][0], vicolo: rami.shift() }]));
  $('#bivio-tipo').textContent = `Bivio ${stato.bivio + 1} · ${TIPI[b.tipo]}`;
  $('#domanda').textContent = b.domanda;
  $('#scelte').innerHTML = o.map((i, k) => `<button type="button" class="lab-scelta" data-i="${i}" aria-keyshortcuts="${LETTERE[k]}"><span class="l" aria-hidden="true">${LETTERE[k]}</span><span class="t">${esc(b.scelte[i].testo)}</span></button>`).join('');
  $('#spiega').hidden = true; $('#avanti').hidden = true;
  disegna();
  const primo = $('#scelte button');
  if (primo) primo.focus({ preventScroll: true });
}

async function rispondi(i) {
  if (occupato || !p || finito(stato, p) || stato.tentate.includes(i)) return;
  const b = p.bivi[stato.bivio], c = b.scelte[i], k = ordine[stato.bivio].indexOf(i), bivio = pianta.bivi[stato.bivio];
  const prima = stato;
  stato = scegli(stato, p, i);
  occupato = true;
  const bottone = $(`#scelte [data-i="${i}"]`);
  aggiornaBarra();
  if (!c.giusta) {
    bottone.classList.add('vicolo');
    bottone.disabled = true;
    bottone.querySelector('.t').insertAdjacentHTML('beforeend', `<small>vicolo cieco · −${c.giorni} giorni</small>`);
    suona('no');
    const vicolo = bocche.get(i).vicolo;
    vicolo.forEach((x) => svelate.add(x));
    disegna();
    await cammina([bivio.cella, ...vicolo], false, true);
    urta(vicolo);
    esplorati.push({ celle: [bivio.cella, ...vicolo], giorni: c.giorni });
    await cammina([...vicolo].reverse().concat(bivio.cella), false, true);
    disegna();
    spiega('no', `Vicolo cieco: −${c.giorni} giorni.`, c.perche, b);
    $('#esito').textContent = `Vicolo cieco, ${c.giorni} giorni persi. ${c.perche}`;
    occupato = false;
    const altra = $('#scelte button:not([disabled])');
    if (altra) altra.focus({ preventScroll: true });
    return;
  }
  [...$('#scelte').children].forEach((x) => { x.disabled = true; });
  bottone.classList.add('giusta');
  festeggia(prima);
  spiega('si', prima.tentate.length ? 'Ecco la strada giusta.' : 'Strada giusta al primo colpo!', b.spiega, b);
  $('#esito').textContent = `${prima.tentate.length ? 'Strada giusta.' : 'Strada giusta al primo colpo.'} ${b.spiega}`;
  $('#avanti').hidden = false;
  $('#avanti').textContent = finito(stato, p) ? 'Verso l\'uscita' : 'Avanti';
  occupato = false;
  $('#avanti').focus({ preventScroll: true });
}

function spiega(tono, titolo, testo, b) {
  $('#spiega-titolo').textContent = titolo;
  $('#spiega-titolo').dataset.tono = tono;
  $('#spiega-perche').textContent = testo;
  $('#spiega-fonte').innerHTML = `<span class="spiega-et">La regola</span> <a href="${esc(b.fonte.url)}" target="_blank" rel="noopener">${esc(b.fonte.norma)}</a>`;
  $('#spiega').hidden = false;
  if (stretto()) $('#spiega').scrollIntoView({ block: 'nearest', behavior: meno ? 'auto' : 'smooth' });
}

const stretto = () => innerWidth < 760;

async function avanti() {
  if (occupato || $('#avanti').hidden) return;
  occupato = true;
  $('#avanti').hidden = true;
  if (stretto()) palco.scrollIntoView({ block: 'start', behavior: meno ? 'auto' : 'smooth' });
  const da = pianta.bivi[stato.bivio - 1].indice;
  if (finito(stato, p)) {
    await cammina(pianta.via.slice(da), true, false, true);
    occupato = false;
    return fine();
  }
  await cammina(pianta.via.slice(da, pianta.bivi[stato.bivio].indice + 1), true);
  occupato = false;
  mostraBivio();
}

/** Le sorprese: le serie al primo colpo e il bivio difficile preso subito. */
function festeggia(prima) {
  const r = mappa.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 3;
  if (prima.tentate.length) { suona('si'); return; }
  if (stato.serie === SERIE_MIN) { annuncioGrande(palco, `${SERIE_MIN} di fila: +20 a bivio`); suona('serie'); return; }
  if (stato.serie === 5) { annuncioGrande(palco, 'Cinque al primo colpo!'); coriandoli(x, y, 20); suona('serie'); return; }
  if (p.bivi[stato.bivio - 1].tipo === 'termine' && p.livello === 3) { annuncioGrande(palco, 'Termine centrato!'); suona('serie'); return; }
  suona('si');
}

function fine() {
  const giorni = stato.giorni, finitiPrima = finiti();
  const fila = filaDopo(archivio(GIOCO).leggi(), semeDelGiorno());
  ricordaPercorso(p.id, giorni);
  const punti = totale(stato, p);
  annuncioGrande(palco, giorni ? `Fuori! ${giorni} giorni persi` : 'Fuori, senza vicoli ciechi!');
  $('#fine-punti').textContent = punti;
  $('#fine-dettaglio').textContent = `punti · ${p.titolo} · ${giorni ? `${giorni} giorni persi in ${stato.vicoli} ${stato.vicoli === 1 ? 'vicolo cieco' : 'vicoli ciechi'}` : 'nessun giorno perso'} · ${stato.alPrimo.filter(Boolean).length} bivi su ${p.bivi.length} al primo colpo`;
  chiudiPartita({ gioco: GIOCO, punti, delGiorno: modo === 'giorno', sfida: modo === 'sfida' ? sfida : null, catalogo: MEDAGLIE,
    guadagnate: medaglieGuadagnate(stato, p, { finiti: finitiPrima, fila, delGiorno: modo === 'giorno' }), soglie: TITOLI, el: $('#fine-premi'), palco });
  classificaFine({ gioco: GIOCO, el: $('#fine-classifica'), seme, delGiorno: modo === 'giorno', partita: { percorso: p.id, scelte: stato.scelte } });
  $('#davvero-testo').textContent = `Con «${STRUMENTI[p.strumento]}» il Polpo controlla le tue date e ti prepara la lettera.`;
  $('#davvero').href = `../../${p.strumento}/`;
  $('#davvero').textContent = `Apri «${STRUMENTI[p.strumento]}»`;
  $('#fine-regole').innerHTML = p.bivi.map((b, k) => `<li><span class="${stato.alPrimo[k] ? 'si' : 'no'}">${stato.alPrimo[k] ? '✓' : '✗'}</span> <b>${esc(TIPI[b.tipo])}.</b> ${esc(b.spiega)} <a href="${esc(b.fonte.url)}" target="_blank" rel="noopener">${esc(b.fonte.norma)}</a></li>`).join('');
  const dopo = prossimo(finiti());
  $('#rigioca').textContent = modo === 'sfida' ? 'Riprova la sfida' : modo === 'giorno' ? 'Riprova la sfida del giorno' : dopo ? 'Prossimo percorso' : 'Un altro percorso';
  $('#ripeti').hidden = modo !== 'libera';
  setTimeout(() => {
    $('.lab-tavolo').hidden = true;
    $('#fine').hidden = false;
    elencoPercorsi();
    $('#rigioca').focus({ preventScroll: true });
    window.scrollTo({ top: $('.barra-gioco').getBoundingClientRect().top + window.scrollY - 6, behavior: meno ? 'auto' : 'smooth' });
  }, meno ? 200 : 1100);
}

// ---------------------------------------------------------------- il disegno

const el = (nome, attr = {}, genitore = null) => {
  const e = document.createElementNS(NS, nome);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v);
  if (genitore) genitore.appendChild(e);
  return e;
};
const centro = (c) => [M + (c % pianta.colonne) * S + S / 2, M + Math.floor(c / pianta.colonne) * S + S / 2];
const ingresso = () => [M - 10, M + S / 2];
const uscita = () => [M + pianta.colonne * S + 10, M + (pianta.righe - 1) * S + S / 2];
let strati = {}, polpo = null, posizione = null;

function disegnaBase() {
  const w = M * 2 + pianta.colonne * S, h = M * 2 + pianta.righe * S;
  mappa.setAttribute('viewBox', `0 0 ${w} ${h}`);
  mappa.innerHTML = `<defs><pattern id="retino" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="currentColor" opacity=".32"/><circle cx="4.5" cy="4.5" r="1.1" fill="currentColor" opacity=".32"/></pattern></defs>`;
  strati = { pieni: el('g', {}, mappa), muri: el('g', {}, mappa), vicoli: el('g', {}, mappa), filo: el('g', {}, mappa), lettere: el('g', {}, mappa), polpo: el('g', {}, mappa) };
  // il bordo, aperto all'ingresso e all'uscita; il nodo all'ingresso, la porta all'uscita
  const x1 = M + pianta.colonne * S, y1 = M + pianta.righe * S;
  el('path', { class: 'bordo', d: `M${M} ${M + S} V${y1} H${x1} M${x1} ${y1 - S} V${M} H${M}` }, mappa);
  const [ix, iy] = ingresso(), [ux, uy] = uscita();
  el('circle', { class: 'nodo', cx: ix, cy: iy, r: 5 }, mappa);
  el('path', { class: 'porta', d: `M${x1 + 3} ${uy - 13} h8 v26 h-8 M${x1 + 7} ${uy} h0.1` }, mappa);
  polpo = el('g', { 'aria-hidden': 'true' }, strati.polpo);
  polpo.innerHTML = `<g class="corpo"><path class="polpo-braccia" d="M-7 4 C-9 9 -12 10 -13 13 M-3 6 C-3 10 -5 12 -6 15 M3 6 C3 10 5 12 6 15 M7 4 C9 9 12 10 13 13"/><path class="polpo-testa" d="M-9 4 C-11 -12 11 -12 9 4 Z"/><circle class="polpo-occhiali" cx="-3.6" cy="-2" r="3"/><circle class="polpo-occhiali" cx="3.6" cy="-2" r="3"/></g>`;
  posizione = ingresso();
  muovi(posizione);
}

function muovi([x, y]) { polpo.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); }

/** Ridisegna muri, nebbia e lettere secondo quello che è già stato visto. */
function disegna() {
  const { colonne, righe } = pianta, n = colonne * righe;
  const aperte = new Set(stato && !finito(stato, p) ? [...bocche.values()].map((b) => b.cella) : []);
  strati.pieni.innerHTML = ''; strati.muri.innerHTML = ''; strati.lettere.innerHTML = ''; strati.vicoli.innerHTML = '';
  const pieni = [], muri = new Set();
  for (let c = 0; c < n; c++) {
    const x = M + (c % colonne) * S, y = M + Math.floor(c / colonne) * S;
    if (!svelate.has(c)) {
      pieni.push(`M${x} ${y}h${S}v${S}h${-S}Z`);
      continue;
    }
    const lati = [[c - colonne, Math.floor(c / colonne) > 0, `M${x} ${y}h${S}`], [c + 1, c % colonne < colonne - 1, `M${x + S} ${y}v${S}`],
      [c + colonne, Math.floor(c / colonne) < righe - 1, `M${x} ${y + S}h${S}`], [c - 1, c % colonne > 0, `M${x} ${y}v${S}`]];
    for (const [v, dentro, d] of lati) {
      if (!dentro) continue;
      if (collegate.has(c < v ? `${c}-${v}` : `${v}-${c}`)) continue;
      muri.add(d);
    }
  }
  el('path', { class: 'pieno', d: pieni.join('') }, strati.pieni);
  for (const c of aperte) if (!svelate.has(c)) {
    const x = M + (c % colonne) * S, y = M + Math.floor(c / colonne) * S;
    el('rect', { class: 'bocca', x, y, width: S, height: S }, strati.pieni);
  }
  el('path', { class: 'muro', d: [...muri].join('') }, strati.muri);
  for (const v of esplorati) {
    el('path', { class: 'vicolo', d: 'M' + v.celle.map((c) => centro(c).join(' ')).join(' L') }, strati.vicoli);
    const [x, y] = centro(v.celle[v.celle.length - 1]);
    el('path', { class: 'croce', d: `M${x - 6} ${y - 6} l12 12 M${x + 6} ${y - 6} l-12 12` }, strati.vicoli);
    const t = el('text', { class: 'costo', x, y: y + 16, 'text-anchor': 'middle' }, strati.vicoli);
    t.textContent = `−${v.giorni} g`;
  }
  if (stato && !finito(stato, p) && bocche.size) {
    ordine[stato.bivio].forEach((i, k) => {
      if (stato.tentate.includes(i) || !bocche.has(i)) return;
      const [x, y] = centro(bocche.get(i).cella);
      const g = el('g', { class: 'lettera', 'data-i': i }, strati.lettere);
      el('circle', { cx: x, cy: y, r: 11 }, g);
      el('text', { x, y }, g).textContent = LETTERE[k];
    });
  }
  mappa.setAttribute('aria-label', stato && !finito(stato, p)
    ? `Il labirinto: bivio ${stato.bivio + 1} di ${p.bivi.length}, ${stato.giorni} giorni persi. Davanti al Polpo si aprono ${ordine[stato.bivio].length - stato.tentate.length} corridoi, con le lettere delle scelte.`
    : `Il labirinto di «${p.titolo}»: il filo rosso va dall'ingresso all'uscita.`);
}

/**
 * Il Polpo cammina di cella in cella. filo: il filo rosso si srotola dietro di lui (strada giusta);
 * tratteggio: il passo nel vicolo cieco; finale: esce dalla porta.
 */
function cammina(celle, filo, tratteggio = false, finale = false) {
  const punti = celle.map(centro);
  if (filo && svelate.size === 0) punti.unshift(ingresso());
  if (finale) punti.push(uscita());
  if (filo) celle.forEach((c) => svelate.add(c));
  if (filo && stato.bivio < p.bivi.length && pianta.bivi[stato.bivio] && celle[celle.length - 1] === pianta.bivi[stato.bivio].cella) bocche = new Map();
  if (filo) disegna();
  let traccia = null, lunghezza = 0;
  if (filo && punti.length > 1) {
    traccia = el('path', { class: 'filo', d: 'M' + punti.map((q) => q.join(' ')).join(' L') }, strati.filo);
    lunghezza = traccia.getTotalLength();
    traccia.style.strokeDasharray = `${lunghezza}`;
    traccia.style.strokeDashoffset = `${lunghezza}`;
  }
  const tratti = [];
  for (let k = 1; k < punti.length; k++) tratti.push(Math.hypot(punti[k][0] - punti[k - 1][0], punti[k][1] - punti[k - 1][1]));
  const tot = tratti.reduce((a, b) => a + b, 0);
  const durata = meno ? 0 : Math.min(1600, tot * (tratteggio ? 4.5 : 6));
  return new Promise((fatto) => {
    if (!durata || punti.length < 2) {
      if (traccia) traccia.style.strokeDashoffset = '0';
      posizione = punti[punti.length - 1] || posizione; muovi(posizione);
      return fatto();
    }
    const t0 = performance.now();
    const passo = (ora) => {
      const f = Math.min(1, (ora - t0) / durata), d = f * tot;
      let a = 0, k = 0;
      while (k < tratti.length - 1 && a + tratti[k] < d) a += tratti[k++];
      const u = tratti[k] ? (d - a) / tratti[k] : 1;
      posizione = [punti[k][0] + (punti[k + 1][0] - punti[k][0]) * u, punti[k][1] + (punti[k + 1][1] - punti[k][1]) * u];
      muovi(posizione);
      if (traccia) traccia.style.strokeDashoffset = `${lunghezza * (1 - f)}`;
      if (f < 1) fotogramma(passo); else fatto();
    };
    fotogramma(passo);
  });
}

/** Il prossimo fotogramma; se la pagina non disegna (scheda in secondo piano) va avanti lo stesso, con un timer. */
function fotogramma(fn) {
  let fatto = false;
  const una = (t) => { if (fatto) return; fatto = true; cancelAnimationFrame(a); clearTimeout(b); fn(typeof t === 'number' && t > 0 ? t : performance.now()); };
  const a = requestAnimationFrame(una), b = setTimeout(() => una(performance.now()), 120);
}

/** In fondo al vicolo il Polpo urta il muro. */
function urta(vicolo) {
  if (meno) return;
  const [a, b] = vicolo.length > 1 ? vicolo.slice(-2) : [pianta.bivi[stato.bivio].cella, vicolo[0]];
  const [ax, ay] = centro(a), [bx, by] = centro(b);
  const corpo = polpo.querySelector('.corpo');
  corpo.style.setProperty('--ux', `${Math.sign(bx - ax) * 7}px`);
  corpo.style.setProperty('--uy', `${Math.sign(by - ay) * 7}px`);
  corpo.classList.remove('urto'); void corpo.getBoundingClientRect(); corpo.classList.add('urto');
}

// ---------------------------------------------------------------- comandi

$('#scelte').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b && !b.disabled) rispondi(Number(b.dataset.i)); });
mappa.addEventListener('click', (e) => { const g = e.target.closest('.lettera'); if (g) rispondi(Number(g.dataset.i)); });
$('#avanti').addEventListener('click', avanti);
document.addEventListener('keydown', (e) => {
  if (!$('#apertura').hidden || !$('#fine').hidden || !p || e.altKey || e.ctrlKey || e.metaKey) return;
  const k = LETTERE.indexOf(e.key.toUpperCase()), n = ['1', '2', '3'].indexOf(e.key);
  const quale = k >= 0 ? k : n;
  if (quale >= 0 && !finito(stato, p) && $('#avanti').hidden) {
    const i = ordine[stato.bivio][quale];
    if (i !== undefined) { rispondi(i); e.preventDefault(); }
  } else if ((e.key === 'Enter' || e.key === ' ') && !$('#avanti').hidden && document.activeElement !== $('#avanti')) { avanti(); e.preventDefault(); }
});
$('#gioca').addEventListener('click', () => nuovaPartita(sfida?.seme ? 'sfida' : 'libera'));
$('#gioca-giorno').addEventListener('click', () => nuovaPartita('giorno'));
$('#percorsi').addEventListener('click', (e) => { const b = e.target.closest('[data-percorso]'); if (b) nuovaPartita('libera', b.dataset.percorso); });
$('#rigioca').addEventListener('click', () => (modo === 'libera' ? nuovaPartita('libera') : nuovaPartita(modo)));
$('#ripeti').addEventListener('click', () => nuovaPartita('libera', p.id));
$('#condividi').addEventListener('click', () => condividi({ titolo: 'Il filo del labirinto', testo: testoCondivisione(stato, p), punti: totale(stato, p), seme, bottone: $('#condividi') }));
pulsanteSuono($('#suono'));

if (location.hash === '#prova') {
  window.labirintoProva = {
    stato: () => stato && { ...stato }, percorso: () => p?.id, seme: () => seme,
    giusta: () => (p && !finito(stato, p) ? ordine[stato.bivio].findIndex((i) => p.bivi[stato.bivio].scelte[i].giusta) : -1),
    occupato: () => occupato,
  };
}
