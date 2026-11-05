// Il Polpo differenzia: i rifiuti cadono, il Polpo corre sotto di loro, li afferra con un
// tentacolo e li porta nel contenitore. Si gioca così:
//   - trascina il rifiuto nel bidone (mouse o dito): il Polpo lo tiene con il tentacolo;
//   - oppure lancialo con uno swipe veloce verso il bidone;
//   - con la tastiera, le frecce spostano il Polpo sotto un bidone e lo spazio gli fa
//     afferrare il rifiuto più in basso e lanciarlo lì (i tasti da 1 a 6 scelgono il bidone).
// Il gioco gira nel browser; record e medaglie restano sul tuo dispositivo. Solo se scegli la classifica
// condivisa partono il nome inventato e le mosse della partita (giochi/comune/classifica.js).
import { CONTENITORI, DURATA, VITE, valuta, segna, perso, nuovoStato, bersaglio, ritmo, mescola, moltiplicatore, testoCondivisione,
  FASI, fase, ammessi, difficolta, ogniOro, traguardo, MEDAGLIE, medaglieGuadagnate, TITOLI } from '../src/regole.js';
import { classificaFine, inTesta } from '../../comune/classifica.js';
import { caso, semeDelGiorno, semeNuovo, preparaApertura, chiudiPartita, condividi, annuncioGrande, coriandoli, suona, pulsanteSuono } from '../../comune/premi.js';
import DATI from '../src/rifiuti.js';

const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const $ = (s) => document.querySelector(s);
const meno = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FONTI = DATI.fonti;
const NOMI = Object.fromEntries(CONTENITORI.map((c) => [c.id, c.nome]));
const N = CONTENITORI.length;

let L = 0, H = 0, dpr = 1, colori = {};
let stato = nuovoStato(), attivi = [], volo = [], scritte = [], coda = [], sbagli = [];
let inizio = 0, ultimo = 0, prossimo = 0, inCorso = false, pausa = false, scossa = 0;
// il Polpo: dove sta, dove vuole andare, che faccia fa
let px = 0, colonna = Math.floor(N / 2), conTastiera = false, umore = null;
// il rifiuto tenuto dal tentacolo mentre lo trascini
let presa = null;
// la partita ripetibile: stesso seme, stessi rifiuti nello stesso ordine (sfida del giorno, sfida a un amico)
let modo = 'libera', seme = '', rng = Math.random, faseOra = 0, codaFase = -1, generati = 0, finitoIlTempo = false, mosse = [];
const palco = tela.parentElement;
const sfida = preparaApertura({ gioco: 'differenzia', catalogo: MEDAGLIE, el: $('#premi'), bottone: $('#gioca') });
inTesta('differenzia', $('#in-testa'));

function leggiColori() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n, d) => (cs.getPropertyValue(n).trim() || d);
  colori = { fondo: v('--fondo', '#0B0B0A'), carta: v('--carta', '#141413'), ink: v('--inchiostro', '#F2EFE8'), ink2: v('--inchiostro-2', '#C9C5BC'),
    ink3: v('--inchiostro-3', '#8F8B83'), riga: v('--riga', '#2B2A28'), rosso: v('--accento', '#FF4A36'), si: v('--si', '#62D29C'), forse: v('--forse', '#F0C252') };
}

function misura() {
  const box = tela.parentElement.getBoundingClientRect();
  L = Math.round(box.width);
  H = Math.round(Math.min(Math.max(innerHeight - 140, 380), 680)); // barra e messaggio sopra, il campo sotto: tutto in una schermata
  dpr = Math.min(2, devicePixelRatio || 1);
  tela.width = L * dpr; tela.height = H * dpr;
  tela.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!px) px = L / 2;
}

const larg = () => L / N;
const centro = (i) => larg() * i + larg() / 2;
const quotaBidoni = () => H - Math.max(78, H * 0.17);
const quotaPolpo = () => quotaBidoni() - Math.max(46, H * 0.09);
const polpo = () => {
  const salto = umore && umore.tipo === 'giusto' ? -Math.sin(Math.min(1, (performance.now() - umore.t0) / 380) * Math.PI) * 14 : 0;
  return { x: px, y: quotaPolpo() + salto };
};
const raggio = () => Math.max(26, Math.min(36, L / 13));
const colonnaDi = (x) => Math.max(0, Math.min(N - 1, Math.floor(x / larg())));

// ---------------------------------------------------------------- partita

function nuovaPartita(m = modo) {
  modo = m;
  seme = modo === 'sfida' && sfida?.seme ? sfida.seme : modo === 'giorno' ? semeDelGiorno() : semeNuovo();
  rng = caso(`${seme}-differenzia`);
  stato = nuovoStato(); attivi = []; volo = []; scritte = []; sbagli = []; presa = null; umore = null;
  coda = []; codaFase = -1; faseOra = 0; generati = 0; finitoIlTempo = false; mosse = [];
  misura();
  const barra = document.querySelector('.barra-gioco');
  window.scrollTo({ top: barra.getBoundingClientRect().top + window.scrollY - 6, behavior: 'auto' });
  inizio = ultimo = performance.now(); prossimo = inizio + 600;
  inCorso = true; pausa = false;
  $('#apertura').hidden = true; $('#fine').hidden = true;
  annuncia(`${FASI[0].nome}: ${FASI[0].testo}.`, 'info');
  $('#fase').textContent = `fase 1 di ${FASI.length}`;
  aggiornaBarra();
  tela.focus({ preventScroll: true });
  requestAnimationFrame(passo);
}

function prendiRifiuto() {
  if (!coda.length || codaFase !== faseOra) { coda = mescola(ammessi(DATI.rifiuti, faseOra), rng); codaFase = faseOra; }
  return coda.pop();
}

/** Il passaggio di fase: un annuncio grande, come un livello nuovo. */
function cambiaFase(f) {
  faseOra = f;
  $('#fase').textContent = `fase ${f + 1} di ${FASI.length}`;
  annuncioGrande(palco, FASI[f].nome);
  annuncia(`${FASI[f].nome}: ${FASI[f].testo}${/[.?!]$/.test(FASI[f].testo) ? '' : '.'}`, 'info');
  suona('serie');
}

function genera(ora) {
  const { intervallo } = ritmo((ora - inizio) / 1000 / DURATA);
  if (ora < prossimo || attivi.length >= 5) return;
  const r = raggio();
  generati += 1;
  const oro = generati % ogniOro(faseOra) === 0;
  attivi.push({ r: prendiRifiuto(), x: r + rng() * (L - 2 * r), y: -r, giro: (rng() - 0.5) * 0.4, ang: 0, oro });
  prossimo = ora + intervallo * 1000 * (meno ? 1.25 : 1);
}

function lancia(o, indice) {
  if (stato.vite <= 0) return; // partita finita: si aspetta il riquadro finale
  const c = CONTENITORI[indice];
  mosse.push([o.r.id, c.id, o.oro ? 1 : 0]); // le mosse, per il controllo dei punti della classifica
  const esito = valuta(o.r, c.id);
  const vitePrima = stato.vite;
  stato = segna(stato, esito, { oro: o.oro, difficile: difficolta(o.r) === 3 });
  attivi = attivi.filter((x) => x !== o);
  if (presa && presa.o === o) presa = null;
  const arrivo = { x: centro(indice), y: quotaBidoni() + 14 };
  volo.push({ o, da: { x: o.x, y: o.y }, a: arrivo, t0: performance.now(), dur: meno ? 240 : 380, esito, indice });
  umore = { tipo: esito, t0: performance.now() };
  if (esito === 'sbagliato') {
    scossa = meno ? 0 : 10;
    sbagli.push({ r: o.r, messo: c.id });
    annuncia(`No: ${o.r.nome} va in ${NOMI[o.r.contenitore]}. ${o.r.spiegazione}`, 'no');
  } else if (esito === 'dipende') {
    annuncia(`Va bene, ma dipende dal Comune: ${o.r.spiegazione}`, 'forse');
  } else {
    annuncia(`${o.r.nome}: ${NOMI[c.id]}. Giusto!`, 'si');
  }
  const m = moltiplicatore(stato.serie);
  const b = tela.getBoundingClientRect();
  if (esito !== 'sbagliato') {
    scritte.push({ x: arrivo.x, y: arrivo.y - 40, testo: `+${10 * m * (o.oro ? 3 : 1)}${m > 1 ? ` ×${m}` : ''}`, t0: performance.now(), colore: o.oro ? colori.forse : colori.si });
    const festa = traguardo(stato.serie);
    if (o.oro) {
      annuncioGrande(palco, stato.vite > vitePrima ? 'Rifiuto d\'oro: una vita in più!' : 'Rifiuto d\'oro: punti ×3!');
      coriandoli(b.left + arrivo.x, b.top + arrivo.y - 20, 30); suona('premio');
    } else if (festa) {
      annuncioGrande(palco, festa);
      coriandoli(b.left + arrivo.x, b.top + arrivo.y - 20, 22); suona('serie');
    } else suona('si');
  } else suona('no');
  aggiornaBarra();
  if (stato.vite <= 0) setTimeout(fine, 500);
}

function annuncia(testo, tono) {
  const e = $('#esito');
  e.textContent = testo;
  e.dataset.tono = tono;
}

function aggiornaBarra() {
  const resta = inCorso ? Math.max(0, DURATA - Math.floor((performance.now() - inizio) / 1000)) : DURATA;
  $('#punti').textContent = stato.punti;
  $('#tempo').textContent = resta;
  $('#vite').textContent = '♥'.repeat(Math.max(0, stato.vite)) + '♡'.repeat(Math.max(0, VITE - stato.vite));
  $('#vite').setAttribute('aria-label', `${stato.vite} vite su ${VITE}`);
  $('#serie').textContent = stato.serie >= 5 ? `serie ${stato.serie} · ×${moltiplicatore(stato.serie)}` : stato.serie >= 2 ? `serie ${stato.serie}` : '';
}

function fine() {
  if (!inCorso) return;
  inCorso = false;
  presa = null;
  const totale = stato.giusti + stato.errori;
  $('#fine-punti').textContent = stato.punti;
  $('#fine-dettaglio').textContent = `${stato.giusti} giusti su ${totale} lanci · serie migliore ${stato.migliore}${stato.ori ? ` · ${stato.ori} d'oro` : ''}`;
  chiudiPartita({ gioco: 'differenzia', punti: stato.punti, delGiorno: modo === 'giorno', sfida: modo === 'sfida' ? sfida : null, catalogo: MEDAGLIE,
    guadagnate: medaglieGuadagnate(stato, finitoIlTempo), soglie: TITOLI, el: $('#fine-premi'), palco });
  classificaFine({ gioco: 'differenzia', el: $('#fine-classifica'), seme, delGiorno: modo === 'giorno', partita: { lanci: mosse } });
  $('#rigioca').textContent = modo === 'sfida' ? 'Riprova la sfida' : modo === 'giorno' ? 'Riprova la sfida del giorno' : 'Gioca ancora';
  const unici = [...new Map(sbagli.map((s) => [s.r.id, s])).values()];
  $('#fine-errori').innerHTML = unici.length
    ? unici.map((s) => `<li><b>${esc(s.r.emoji || '')} ${esc(s.r.nome)}</b> → ${esc(NOMI[s.r.contenitore])}${s.r.alternative?.length ? ` (o ${s.r.alternative.map((a) => esc(NOMI[a])).join(', ')}, secondo il Comune)` : ''}. ${esc(s.r.spiegazione)} ${FONTI[s.r.fonte] ? `<a href="${esc(FONTI[s.r.fonte].url)}" target="_blank" rel="noopener">Fonte</a>` : ''}</li>`).join('')
    : '<li>Nessun errore: complimenti, il tuo Comune ti ringrazia.</li>';
  $('#fine').hidden = false;
  $('#rigioca').focus();
}

// ---------------------------------------------------------------- animazione

function passo(ora) {
  const dt = Math.min(0.05, (ora - ultimo) / 1000);
  ultimo = ora;
  if (pausa && inCorso) { inizio += dt * 1000; prossimo += dt * 1000; }
  if (!pausa && inCorso) {
    const secondi = (ora - inizio) / 1000;
    if (secondi >= DURATA) { finitoIlTempo = true; fine(); }
    if (fase(secondi) !== faseOra) cambiaFase(fase(secondi));
    genera(ora);
    const { velocita } = ritmo((ora - inizio) / 1000 / DURATA);
    const quota = quotaBidoni() - raggio();
    for (const o of attivi) {
      if (presa && presa.o === o) continue; // tenuto dal tentacolo: non cade
      o.y += velocita * H * dt * (meno ? 0.8 : 1);
      o.ang += o.giro * dt;
    }
    for (const o of attivi.filter((x) => x.y > quota && !(presa && presa.o === x))) {
      attivi = attivi.filter((x) => x !== o);
      if (stato.vite <= 0) continue;
      mosse.push([o.r.id, '', 0]);
      stato = perso(stato);
      scritte.push({ x: o.x, y: quota, testo: 'a terra', t0: ora, colore: colori.ink3 });
    }
    aggiornaBarra();
  }
  // il Polpo corre verso il rifiuto che tieni, verso il bidone scelto con la tastiera
  // o sotto il rifiuto più vicino a terra
  const basso = [...attivi].sort((a, b) => b.y - a.y)[0];
  const meta = presa ? presa.o.x : conTastiera ? centro(colonna) : basso ? basso.x : L / 2;
  const limite = Math.max(40, Math.min(L - 40, meta));
  px += (limite - px) * Math.min(1, dt * (presa ? 14 : 5));
  disegna(ora);
  if (inCorso || volo.length || scritte.length) requestAnimationFrame(passo);
}

function disegna(ora) {
  ctx.save();
  ctx.clearRect(0, 0, L, H);
  if (scossa > 0.2) { ctx.translate((Math.random() - 0.5) * scossa, 0); scossa *= 0.86; }
  disegnaBidoni(ora);
  if (presa) disegnaTentacolo({ x: presa.o.x, y: presa.o.y }, 1);
  disegnaPolpo(ora);
  for (const o of attivi) disegnaRifiuto(o, o.x, o.y, presa && presa.o === o);
  volo = volo.filter((v) => {
    const p = Math.min(1, (ora - v.t0) / v.dur);
    const e = 1 - (1 - p) * (1 - p);
    const x = v.da.x + (v.a.x - v.da.x) * e;
    const y = v.da.y + (v.a.y - v.da.y) * e - Math.sin(Math.PI * p) * 50;
    if (p < 0.45) disegnaTentacolo({ x, y }, 1 - p / 0.45); // il tentacolo accompagna il lancio e poi si ritira
    disegnaRifiuto(v.o, x, y, false, 1 - p * 0.6);
    v.p = p;
    return p < 1;
  });
  scritte = scritte.filter((s) => {
    const p = (ora - s.t0) / 900;
    if (p >= 1) return false;
    ctx.globalAlpha = 1 - p; ctx.fillStyle = s.colore; ctx.font = '700 18px "Atkinson Hyperlegible Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText(s.testo, s.x, s.y - p * 30); ctx.globalAlpha = 1;
    return true;
  });
  ctx.restore();
}

/** Il bidone che si accende: quello sotto il rifiuto trascinato, o quello scelto con la tastiera. */
function bidoneAcceso() {
  if (presa) return presa.o.y > quotaBidoni() - raggio() * 1.5 ? colonnaDi(presa.o.x) : -1;
  return conTastiera && inCorso ? colonna : -1;
}

function disegnaBidoni() {
  const y = quotaBidoni(), h = H - y - 8, acceso = bidoneAcceso();
  const colpito = volo.find((v) => v.p > 0.7);
  const aperti = inCorso ? FASI[faseOra].bidoni : null;
  CONTENITORI.forEach((c, i) => {
    const x = i * larg() + 4, w = larg() - 8;
    ctx.globalAlpha = aperti && !aperti.includes(c.id) ? 0.35 : 1; // ancora chiuso: si apre nella fase dopo
    const colpo = colpito && colpito.indice === i ? colpito.esito : null;
    ctx.fillStyle = i === acceso ? colori.riga : colori.carta;
    ctx.strokeStyle = colpo === 'sbagliato' ? colori.rosso : colpo === 'dipende' ? colori.forse : colpo ? colori.si : i === acceso ? colori.ink : colori.riga;
    ctx.lineWidth = colpo || i === acceso ? 3 : 1.5;
    rett(x, y, w, h, 10); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = `${Math.min(30, w * 0.38)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.fillText(c.icona, x + w / 2, y + h * 0.48);
    ctx.fillStyle = i === acceso ? colori.ink : colori.ink2;
    ctx.font = `600 ${Math.max(10, Math.min(13, w / 7))}px "Atkinson Hyperlegible Next", system-ui, sans-serif`;
    riga(w < 84 && c.corto ? c.corto : c.nome, x + w / 2, y + h * 0.78, w - 6);
    ctx.fillStyle = colori.ink3;
    ctx.font = '11px "Atkinson Hyperlegible Mono", monospace';
    ctx.fillText(String(i + 1), x + 12, y + 16);
    ctx.globalAlpha = 1;
  });
}

function disegnaPolpo(ora) {
  const { x, y } = polpo();
  const s = Math.max(0.42, Math.min(0.62, L / 900));
  const no = umore && umore.tipo === 'sbagliato' && ora - umore.t0 < 600;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  if (no && !meno) ctx.rotate(Math.sin((ora - umore.t0) / 45) * 0.12); // scuote la testa
  // le otto braccia, che ondeggiano e si piegano nel verso in cui corre
  const corsa = Math.max(-1, Math.min(1, ((presa ? presa.o.x : px) - px) / 60));
  ctx.lineCap = 'round';
  for (let k = 0; k < 8; k++) {
    const a = Math.PI * (0.05 + (k / 7) * 0.9);
    const onda = meno ? 0 : Math.sin(ora / 300 + k) * 10;
    ctx.strokeStyle = colori.ink3; ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 60, 20);
    ctx.bezierCurveTo(Math.cos(a) * 110 + onda - corsa * 30, 40, Math.cos(a) * 150 - onda - corsa * 50, 70, Math.cos(a) * 190 - corsa * 40, 60 + Math.sin(a) * 20);
    ctx.stroke();
  }
  // la testa con gli occhialini
  ctx.fillStyle = colori.rosso;
  ctx.beginPath();
  ctx.moveTo(-82, 34); ctx.bezierCurveTo(-104, -96, 104, -96, 82, 34); ctx.bezierCurveTo(64, 64, -64, 64, -82, 34); ctx.fill();
  ctx.strokeStyle = colori.fondo; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(-26, -6, 22, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(26, -6, 22, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.stroke();
  // gli occhi guardano il rifiuto più vicino (o quello che tiene)
  const guardato = presa ? presa.o : [...attivi].sort((a, b) => b.y - a.y)[0];
  const gx = guardato ? Math.max(-1, Math.min(1, (guardato.x - x) / 120)) * 7 : 0;
  const gy = guardato ? Math.max(-1, Math.min(1, (guardato.y - y) / 160)) * 6 : 0;
  ctx.fillStyle = colori.fondo;
  ctx.beginPath(); ctx.arc(-26 + gx, -6 + gy, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(26 + gx, -6 + gy, 8, 0, Math.PI * 2); ctx.fill();
  // la bocca: sorride quando indovini, si storce quando sbagli
  ctx.strokeStyle = colori.fondo; ctx.lineWidth = 6;
  ctx.beginPath();
  if (no) { ctx.moveTo(-14, 30); ctx.quadraticCurveTo(0, 20, 14, 30); } else { ctx.moveTo(-14, 24); ctx.quadraticCurveTo(0, 34, 14, 24); }
  ctx.stroke();
  ctx.restore();
}

function disegnaTentacolo(a, forza) {
  const p = polpo();
  const fx = p.x + (a.x - p.x) * forza, fy = p.y + (a.y - p.y) * forza;
  ctx.strokeStyle = colori.rosso; ctx.lineCap = 'round'; ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 4);
  const onda = meno ? 0 : Math.sin(performance.now() / 120) * 12;
  ctx.bezierCurveTo(p.x + (fx - p.x) * 0.3 + 30 + onda, p.y + (fy - p.y) * 0.3, p.x + (fx - p.x) * 0.7 - 20 - onda, p.y + (fy - p.y) * 0.7, fx, fy);
  ctx.stroke();
  // le ventose sulla punta
  ctx.fillStyle = colori.fondo;
  ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2); ctx.fill();
}

function disegnaRifiuto(o, x, y, acceso, alfa = 1) {
  const r = raggio();
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(x, y);
  if (o.oro) { // il rifiuto d'oro brilla
    const pulsa = meno ? 0.5 : 0.5 + 0.5 * Math.sin(performance.now() / 160);
    ctx.fillStyle = colori.forse; ctx.globalAlpha = alfa * (0.18 + 0.22 * pulsa);
    ctx.beginPath(); ctx.arc(0, 0, r + 9 + pulsa * 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = alfa;
  }
  ctx.fillStyle = colori.carta;
  ctx.strokeStyle = acceso ? colori.rosso : o.oro ? colori.forse : colori.riga;
  ctx.lineWidth = acceso || o.oro ? 3.5 : 1.5;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.rotate(o.ang);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(r * 1.05)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.fillText(o.r.emoji || '♻️', 0, 1);
  ctx.rotate(-o.ang);
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${Math.max(11, Math.min(13, L / 40))}px "Atkinson Hyperlegible Next", system-ui, sans-serif`;
  const w = Math.min(ctx.measureText(o.r.nome).width + 14, L * 0.5);
  const sposta = Math.max(2 - (x - w / 2), Math.min(0, L - 2 - (x + w / 2))); // l'etichetta resta dentro il campo
  ctx.fillStyle = colori.ink;
  rett(-w / 2 + sposta, r + 4, w, 20, 10); ctx.fill();
  ctx.fillStyle = colori.fondo;
  riga(o.r.nome, sposta, r + 18, w - 10);
  ctx.restore();
}

function rett(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function riga(t, x, y, max) {
  let s = t;
  while (s.length > 3 && ctx.measureText(s).width > max) s = s.slice(0, -2) + '…';
  ctx.fillText(s, x, y);
}

// ---------------------------------------------------------------- comandi

const punto = (e) => { const b = tela.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
const colpito = (p) => [...attivi].reverse().find((o) => Math.hypot(o.x - p.x, o.y - p.y) < raggio() + 16);

tela.addEventListener('pointerdown', (e) => {
  if (!inCorso) return;
  if (pausa) { pausa = false; annuncia('', 'info'); }
  conTastiera = false;
  const p = punto(e);
  const o = colpito(p);
  if (!o) return;
  // il tentacolo afferra il rifiuto: da qui lo trascini dove vuoi
  presa = { o, dx: o.x - p.x, dy: o.y - p.y, scia: [{ x: p.x, y: p.y, t: performance.now() }], da: p };
  tela.setPointerCapture(e.pointerId);
  tela.style.cursor = 'grabbing';
  e.preventDefault();
});
tela.addEventListener('pointermove', (e) => {
  const p = punto(e);
  if (!presa) {
    tela.style.cursor = inCorso && colpito(p) ? 'grab' : 'default';
    return;
  }
  presa.o.x = Math.max(0, Math.min(L, p.x + presa.dx));
  presa.o.y = Math.max(0, Math.min(H, p.y + presa.dy));
  presa.scia.push({ x: p.x, y: p.y, t: performance.now() });
  if (presa.scia.length > 8) presa.scia.shift();
});
function lascia(e) {
  if (!presa) return;
  const o = presa.o, p = punto(e);
  tela.style.cursor = 'default';
  // portato sopra un bidone: va lì
  if (o.y > quotaBidoni() - raggio() * 1.5) { lancia(o, colonnaDi(o.x)); return; }
  // lanciato con uno swipe veloce: va dove punta la scia
  const s = presa.scia, a = s[0], b = s[s.length - 1], tempo = (b.t - a.t) / 1000;
  const vel = tempo > 0 ? Math.hypot(b.x - a.x, b.y - a.y) / tempo : 0;
  if (vel > 500) {
    const i = bersaglio({ x: o.x, y: o.y }, { dx: b.x - a.x, dy: b.y - a.y }, quotaBidoni() + 20, L);
    if (i >= 0) { lancia(o, i); return; }
  }
  // lasciato a mezz'aria: riprende a cadere da lì
  const fermo = Math.hypot(p.x - presa.da.x, p.y - presa.da.y) < 8;
  presa = null;
  if (fermo) annuncia('Trascinalo fino al bidone, o lancialo con uno swipe.', 'info');
}
tela.addEventListener('pointerup', lascia);
tela.addEventListener('pointercancel', () => { presa = null; tela.style.cursor = 'default'; });

tela.addEventListener('keydown', (e) => {
  if (!inCorso) return;
  const passa = (d) => { conTastiera = true; colonna = Math.max(0, Math.min(N - 1, colonna + d)); annuncia(`Il Polpo è sotto: ${CONTENITORI[colonna].nome}. Spazio per lanciare il rifiuto più in basso.`, 'info'); };
  const basso = () => [...attivi].sort((a, b) => b.y - a.y)[0];
  if (e.key === 'ArrowLeft') { passa(-1); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { passa(1); e.preventDefault(); }
  else if ((e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter') && basso()) { conTastiera = true; lancia(basso(), colonna); e.preventDefault(); }
  else if (/^[1-6]$/.test(e.key) && basso()) { conTastiera = true; colonna = +e.key - 1; lancia(basso(), colonna); e.preventDefault(); }
  else if (e.key === 'p' || e.key === 'Escape') {
    pausa = !pausa;
    annuncia(pausa ? 'In pausa. Premi P per riprendere.' : '', 'info');
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && inCorso) { pausa = true; annuncia('In pausa. Tocca il gioco o premi P per riprendere.', 'info'); }
});
$('#gioca').addEventListener('click', () => nuovaPartita(sfida ? 'sfida' : 'libera'));
$('#gioca-giorno').addEventListener('click', () => nuovaPartita('giorno'));
$('#rigioca').addEventListener('click', () => nuovaPartita());
$('#condividi').addEventListener('click', () => condividi({ titolo: 'Il Polpo differenzia', testo: testoCondivisione(stato), punti: stato.punti, seme, bottone: $('#condividi') }));
pulsanteSuono($('#suono'));
let attesa;
addEventListener('resize', () => { clearTimeout(attesa); attesa = setTimeout(() => { misura(); if (!inCorso) disegna(performance.now()); }, 120); });

// Solo per le prove automatiche (#prova nell'indirizzo): posizione dei rifiuti e del Polpo
if (location.hash === '#prova') {
  window.polpoProva = { rifiuti: () => attivi.map((o) => ({ id: o.r.id, contenitore: o.r.contenitore, alternative: o.r.alternative || [], x: o.x, y: o.y })),
    stato: () => ({ ...stato }), quota: () => quotaBidoni(), L: () => L, polpo: () => px, tenuto: () => presa && presa.o.r.id,
    fase: () => faseOra, seme: () => seme, oro: () => attivi.filter((o) => o.oro).map((o) => o.r.id), avanti: (sec) => { inizio -= sec * 1000; prossimo = 0; } };
}

leggiColori();
misura();
disegna(performance.now());
