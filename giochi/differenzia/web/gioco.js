// Il Polpo differenzia: i rifiuti cadono, il Polpo li afferra con un tentacolo e li lancia
// nel contenitore verso cui fai scorrere il dito (o il mouse). Con la tastiera: freccia giù
// sceglie il rifiuto più in basso, i tasti da 1 a 6 lo mandano nel contenitore.
// Tutto avviene nel browser: nessun dato esce da qui. Il record resta sul tuo dispositivo.
import { CONTENITORI, DURATA, VITE, valuta, segna, perso, nuovoStato, bersaglio, ritmo, mescola, moltiplicatore, testoCondivisione } from '../src/regole.js';
import DATI from '../src/rifiuti.js';

const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const $ = (s) => document.querySelector(s);
const meno = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FONTI = DATI.fonti;
const NOMI = Object.fromEntries(CONTENITORI.map((c) => [c.id, c.nome]));

let L = 0, H = 0, dpr = 1, colori = {};
let stato = nuovoStato(), attivi = [], volo = [], scritte = [], coda = [], sbagli = [];
let inizio = 0, ultimo = 0, prossimo = 0, inCorso = false, pausa = false, scelto = null, tentacolo = null, scossa = 0;

function leggiColori() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n, d) => (cs.getPropertyValue(n).trim() || d);
  colori = { fondo: v('--fondo', '#0B0B0A'), carta: v('--carta', '#141413'), ink: v('--inchiostro', '#F2EFE8'), ink2: v('--inchiostro-2', '#C9C5BC'),
    ink3: v('--inchiostro-3', '#8F8B83'), riga: v('--riga', '#2B2A28'), rosso: v('--accento', '#FF4A36'), si: v('--si', '#62D29C') };
}

function misura() {
  const box = tela.parentElement.getBoundingClientRect();
  L = Math.round(box.width);
  H = Math.round(Math.min(Math.max(innerHeight - 140, 380), 680)); // barra e messaggio sopra, il campo sotto: tutto in una schermata
  dpr = Math.min(2, devicePixelRatio || 1);
  tela.width = L * dpr; tela.height = H * dpr;
  tela.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const quotaBidoni = () => H - Math.max(78, H * 0.17);
const polpo = () => ({ x: L / 2, y: quotaBidoni() - Math.max(46, H * 0.09) });
const raggio = () => Math.max(26, Math.min(36, L / 13));

// ---------------------------------------------------------------- partita

function nuovaPartita() {
  stato = nuovoStato(); attivi = []; volo = []; scritte = []; sbagli = []; scelto = null; tentacolo = null;
  coda = mescola(DATI.rifiuti);
  inizio = ultimo = performance.now(); prossimo = inizio + 600;
  inCorso = true; pausa = false;
  $('#apertura').hidden = true; $('#fine').hidden = true;
  $('#esito').textContent = '';
  aggiornaBarra();
  misura();
  const barra = document.querySelector('.barra-gioco');
  window.scrollTo({ top: barra.getBoundingClientRect().top + window.scrollY - 6, behavior: 'auto' });
  tela.focus({ preventScroll: true });
  requestAnimationFrame(passo);
}

function prendiRifiuto() {
  if (!coda.length) coda = mescola(DATI.rifiuti);
  return coda.pop();
}

function genera(ora) {
  const t = (ora - inizio) / 1000 / DURATA;
  const { intervallo } = ritmo(t);
  if (ora < prossimo || attivi.length >= 5) return;
  const r = raggio();
  attivi.push({ r: prendiRifiuto(), x: r + Math.random() * (L - 2 * r), y: -r, vy: 0, giro: (Math.random() - 0.5) * 0.4, ang: 0, nato: ora });
  prossimo = ora + intervallo * 1000 * (meno ? 1.25 : 1);
}

function lancia(o, indice) {
  const c = CONTENITORI[indice];
  const esito = valuta(o.r, c.id);
  stato = segna(stato, esito);
  attivi = attivi.filter((x) => x !== o);
  if (scelto === o) scelto = null;
  const larg = L / CONTENITORI.length;
  const arrivo = { x: larg * indice + larg / 2, y: quotaBidoni() + 14 };
  volo.push({ o, da: { x: o.x, y: o.y }, a: arrivo, t0: performance.now(), dur: meno ? 260 : 420, esito, indice });
  tentacolo = { a: { x: o.x, y: o.y }, t0: performance.now() };
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
  if (esito !== 'sbagliato') scritte.push({ x: arrivo.x, y: arrivo.y - 40, testo: `+${10 * m}${m > 1 ? ` ×${m}` : ''}`, t0: performance.now(), colore: colori.si });
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
  $('#serie').textContent = stato.serie >= 5 ? `serie ${stato.serie} · ×${moltiplicatore(stato.serie)}` : '';
}

function fine() {
  if (!inCorso) return;
  inCorso = false;
  let record = 0;
  try { record = Math.max(+localStorage.getItem('polpo-differenzia-record') || 0, stato.punti); localStorage.setItem('polpo-differenzia-record', String(record)); } catch { record = stato.punti; }
  const totale = stato.giusti + stato.errori;
  $('#fine-punti').textContent = stato.punti;
  $('#fine-dettaglio').textContent = `${stato.giusti} giusti su ${totale} lanci · serie migliore ${stato.migliore} · record ${record}`;
  const unici = [...new Map(sbagli.map((s) => [s.r.id, s])).values()];
  $('#fine-errori').innerHTML = unici.length
    ? unici.map((s) => `<li><b>${esc(s.r.emoji || '')} ${esc(s.r.nome)}</b> → ${esc(NOMI[s.r.contenitore])}${s.r.alternative?.length ? ` (o ${s.r.alternative.map((a) => esc(NOMI[a])).join(', ')}, secondo il Comune)` : ''}. ${esc(s.r.spiegazione)} ${FONTI[s.r.fonte] ? `<a href="${esc(FONTI[s.r.fonte].url)}" target="_blank" rel="noopener">Fonte</a>` : ''}</li>`).join('')
    : '<li>Nessun errore: complimenti, il tuo Comune ti ringrazia.</li>';
  $('#fine').hidden = false;
  $('#rigioca').focus();
}

// ---------------------------------------------------------------- animazione

function passo(ora) {
  if (!inCorso && !volo.length) { disegna(ora); return; }
  const dt = Math.min(0.05, (ora - ultimo) / 1000);
  ultimo = ora;
  if (pausa && inCorso) { inizio += dt * 1000; prossimo += dt * 1000; }
  if (!pausa && inCorso) {
    if ((ora - inizio) / 1000 >= DURATA) { fine(); }
    genera(ora);
    const { velocita } = ritmo((ora - inizio) / 1000 / DURATA);
    const quota = quotaBidoni() - raggio();
    for (const o of attivi) {
      o.y += velocita * H * dt * (meno ? 0.8 : 1);
      o.ang += o.giro * dt;
    }
    for (const o of attivi.filter((x) => x.y > quota)) {
      attivi = attivi.filter((x) => x !== o);
      if (scelto === o) scelto = null;
      stato = perso(stato);
      scritte.push({ x: o.x, y: quota, testo: 'a terra', t0: ora, colore: colori.ink3 });
    }
    aggiornaBarra();
  }
  disegna(ora);
  requestAnimationFrame(passo);
}

function disegna(ora) {
  ctx.save();
  ctx.clearRect(0, 0, L, H);
  if (scossa > 0.2) { ctx.translate((Math.random() - 0.5) * scossa, 0); scossa *= 0.86; }
  disegnaBidoni(ora);
  disegnaPolpo(ora);
  for (const o of attivi) disegnaRifiuto(o, o.x, o.y, o === scelto);
  volo = volo.filter((v) => {
    const p = Math.min(1, (ora - v.t0) / v.dur);
    const e = 1 - (1 - p) * (1 - p);
    const x = v.da.x + (v.a.x - v.da.x) * e;
    const y = v.da.y + (v.a.y - v.da.y) * e - Math.sin(Math.PI * p) * 60;
    disegnaRifiuto(v.o, x, y, false, 1 - p * 0.6);
    if (p >= 1) v.fatto = true;
    return p < 1;
  });
  if (tentacolo) {
    const p = (ora - tentacolo.t0) / 220;
    if (p >= 1) tentacolo = null; else disegnaTentacolo(tentacolo.a, Math.sin(Math.PI * p));
  }
  scritte = scritte.filter((s) => {
    const p = (ora - s.t0) / 900;
    if (p >= 1) return false;
    ctx.globalAlpha = 1 - p; ctx.fillStyle = s.colore; ctx.font = '700 18px "Atkinson Hyperlegible Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText(s.testo, s.x, s.y - p * 30); ctx.globalAlpha = 1;
    return true;
  });
  ctx.restore();
}

function disegnaBidoni(ora) {
  const n = CONTENITORI.length, larg = L / n, y = quotaBidoni(), h = H - y - 8;
  const ultimoVolo = volo.find((v) => v.fatto === undefined && (ora - v.t0) / v.dur > 0.7);
  CONTENITORI.forEach((c, i) => {
    const x = i * larg + 4, w = larg - 8;
    const colpo = ultimoVolo && ultimoVolo.indice === i ? ultimoVolo.esito : null;
    ctx.fillStyle = colori.carta;
    ctx.strokeStyle = colpo === 'sbagliato' ? colori.rosso : colpo ? colori.si : colori.riga;
    ctx.lineWidth = colpo ? 3 : 1.5;
    rett(x, y, w, h, 10); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = `${Math.min(30, w * 0.38)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.fillText(c.icona, x + w / 2, y + h * 0.48);
    ctx.fillStyle = colori.ink2;
    ctx.font = `600 ${Math.max(10, Math.min(13, w / 7))}px "Atkinson Hyperlegible Next", system-ui, sans-serif`;
    riga(w < 84 && c.corto ? c.corto : c.nome, x + w / 2, y + h * 0.78, w - 6);
    ctx.fillStyle = colori.ink3;
    ctx.font = '11px "Atkinson Hyperlegible Mono", monospace';
    ctx.fillText(String(i + 1), x + 12, y + 16);
  });
}

function disegnaPolpo(ora) {
  const { x, y } = polpo();
  const s = Math.max(0.42, Math.min(0.62, L / 900));
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  // le otto braccia, che ondeggiano piano
  ctx.lineCap = 'round';
  for (let k = 0; k < 8; k++) {
    const a = Math.PI * (0.05 + (k / 7) * 0.9);
    const onda = meno ? 0 : Math.sin(ora / 600 + k) * 10;
    ctx.strokeStyle = colori.ink3; ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 60, 20);
    ctx.bezierCurveTo(Math.cos(a) * 110 + onda, 40, Math.cos(a) * 150 - onda, 70, Math.cos(a) * 190, 60 + Math.sin(a) * 20);
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
  const guarda = attivi.length ? Math.max(-1, Math.min(1, (attivi[0].x - x) / (L / 2))) * 7 : 0;
  ctx.fillStyle = colori.fondo;
  ctx.beginPath(); ctx.arc(-26 + guarda, -4, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(26 + guarda, -4, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function disegnaTentacolo(a, forza) {
  const p = polpo();
  ctx.strokeStyle = colori.rosso; ctx.lineCap = 'round'; ctx.lineWidth = 9 * forza + 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 6);
  ctx.quadraticCurveTo((p.x + a.x) / 2 + 40, (p.y + a.y) / 2 - 30, p.x + (a.x - p.x) * forza, p.y + (a.y - p.y) * forza);
  ctx.stroke();
}

function disegnaRifiuto(o, x, y, acceso, alfa = 1) {
  const r = raggio();
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(x, y);
  ctx.fillStyle = colori.carta;
  ctx.strokeStyle = acceso ? colori.rosso : colori.riga;
  ctx.lineWidth = acceso ? 3 : 1.5;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.rotate(o.ang);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(r * 1.05)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.fillText(o.r.emoji || '♻️', 0, 1);
  ctx.rotate(-o.ang);
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${Math.max(11, Math.min(13, L / 40))}px "Atkinson Hyperlegible Next", system-ui, sans-serif`;
  const w = Math.min(ctx.measureText(o.r.nome).width + 14, L * 0.5);
  ctx.fillStyle = colori.ink;
  rett(-w / 2, r + 4, w, 20, 10); ctx.fill();
  ctx.fillStyle = colori.fondo;
  riga(o.r.nome, 0, r + 18, w - 10);
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

let presa = null;
const punto = (e) => { const b = tela.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
const colpito = (p) => [...attivi].reverse().find((o) => Math.hypot(o.x - p.x, o.y - p.y) < raggio() + 14);

tela.addEventListener('pointerdown', (e) => {
  if (!inCorso) return;
  const p = punto(e);
  // tocco su un contenitore con un rifiuto scelto: lo manda lì
  if (p.y > quotaBidoni() && scelto) { lancia(scelto, Math.min(CONTENITORI.length - 1, Math.floor(p.x / (L / CONTENITORI.length)))); return; }
  const o = colpito(p);
  if (!o) return;
  presa = { o, da: p, t: performance.now() };
  tela.setPointerCapture(e.pointerId);
  e.preventDefault();
});
tela.addEventListener('pointermove', (e) => {
  if (!presa) return;
  const p = punto(e), dx = p.x - presa.da.x, dy = p.y - presa.da.y;
  if (Math.hypot(dx, dy) > 28) {
    const i = bersaglio({ x: presa.o.x, y: presa.o.y }, { dx, dy }, quotaBidoni() + 20, L);
    if (i >= 0 && attivi.includes(presa.o)) lancia(presa.o, i);
    presa = null;
  }
});
tela.addEventListener('pointerup', () => {
  if (presa && attivi.includes(presa.o)) scelto = scelto === presa.o ? null : presa.o; // tocco senza swipe: lo sceglie
  presa = null;
});
tela.addEventListener('keydown', (e) => {
  if (!inCorso) return;
  if (e.key === 'ArrowDown' || e.key === ' ') {
    const ordinati = [...attivi].sort((a, b) => b.y - a.y);
    const i = ordinati.indexOf(scelto);
    scelto = ordinati[(i + 1) % ordinati.length] || null;
    if (scelto) annuncia(`Scelto: ${scelto.r.nome}. Premi da 1 a 6 per il contenitore.`, 'info');
    e.preventDefault();
  } else if (/^[1-6]$/.test(e.key) && scelto) {
    lancia(scelto, +e.key - 1);
    e.preventDefault();
  } else if (e.key === 'p' || e.key === 'Escape') {
    pausa = !pausa;
    annuncia(pausa ? 'In pausa. Premi P per riprendere.' : '', 'info');
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && inCorso) { pausa = true; annuncia('In pausa. Tocca il gioco o premi P per riprendere.', 'info'); }
});
tela.addEventListener('pointerdown', () => { if (pausa && inCorso) { pausa = false; annuncia('', 'info'); } }, true);
$('#gioca').addEventListener('click', nuovaPartita);
$('#rigioca').addEventListener('click', nuovaPartita);
$('#condividi').addEventListener('click', async () => {
  const testo = testoCondivisione(stato), url = location.href.split('#')[0];
  try {
    if (navigator.share) await navigator.share({ title: 'Il Polpo differenzia', text: testo, url });
    else { await navigator.clipboard.writeText(`${testo} ${url}`); $('#condividi').textContent = 'Copiato'; }
  } catch { /* condivisione annullata */ }
});
let attesa;
addEventListener('resize', () => { clearTimeout(attesa); attesa = setTimeout(() => { misura(); if (!inCorso) disegna(performance.now()); }, 120); });

// Solo per le prove automatiche (#prova nell'indirizzo): posizione dei rifiuti sullo schermo
if (location.hash === '#prova') {
  window.polpoProva = { rifiuti: () => attivi.map((o) => ({ id: o.r.id, contenitore: o.r.contenitore, alternative: o.r.alternative || [], x: o.x, y: o.y })), stato: () => ({ ...stato }), quota: () => quotaBidoni(), L: () => L };
}

leggiColori();
misura();
disegna(performance.now());
