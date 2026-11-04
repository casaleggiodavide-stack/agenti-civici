// Gioca con il Polpo: quello che i giochi hanno in comune per essere divertenti e far tornare a giocare.
//   - partite ripetibili: la sfida del giorno (uguale per tutti) e la sfida a un amico (stessa partita, stesso seme)
//   - titoli secondo i punti, record personale, medaglie da sbloccare
//   - piccole sorprese: coriandoli, suoni brevi (spegnibili), annunci
// Niente server e niente dati personali: record e medaglie restano nel browser; il link di sfida contiene
// solo i punti da battere e il seme della partita.

/** Generatore pseudocasuale ripetibile (mulberry32) a partire da una parola. */
export function caso(seme) {
  let h = 1779033703 ^ String(seme).length;
  for (const c of String(seme)) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Il seme della sfida del giorno: la data italiana, uguale per tutti. */
export function semeDelGiorno(d = new Date()) {
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }); // AAAA-MM-GG
}

/** Legge la sfida dall'indirizzo: #sfida=120&seme=xyz. Restituisce null se non c'è. */
export function leggiSfida(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const punti = Number(p.get('sfida'));
  const seme = (p.get('seme') || '').replace(/[^\w-]/g, '').slice(0, 24);
  if (!Number.isFinite(punti) || punti <= 0 || punti > 100000) return null;
  return { punti: Math.round(punti), seme: seme || null };
}

/** Il link per sfidare un amico sulla stessa partita. */
export function linkSfida(base, punti, seme) {
  const u = String(base).split('#')[0];
  return `${u}#sfida=${Math.round(punti)}${seme ? `&seme=${encodeURIComponent(seme)}` : ''}`;
}

/** Un seme nuovo per una partita libera. */
export const semeNuovo = () => Math.random().toString(36).slice(2, 10);

/** Il titolo secondo i punti: soglie crescenti [[punti, titolo], ...]. */
export function titolo(punti, soglie) {
  let t = soglie[0][1];
  for (const [min, nome] of soglie) if (punti >= min) t = nome;
  return t;
}

// ---------------------------------------------------------------- record e medaglie (solo nel browser)

function memoria() {
  try { const k = '__polpo__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch { return null; }
}

/** Il giorno prima di AAAA-MM-GG. */
export function giornoPrima(giorno) {
  const d = new Date(`${giorno}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function archivio(gioco, deposito = memoria()) {
  const chiave = `polpo-gioco-${gioco}`;
  const leggi = () => {
    let x = {};
    try { x = JSON.parse(deposito?.getItem(chiave) || '{}') || {}; } catch { x = {}; }
    if (!x.record) { // il record delle prime versioni del gioco
      try { const v = +(deposito?.getItem(`polpo-${gioco}-record`) || 0); if (v > 0) { x.record = v; x.partite = x.partite || 1; } } catch { /* niente */ }
    }
    return x;
  };
  const scrivi = (x) => { try { deposito?.setItem(chiave, JSON.stringify(x)); } catch { /* niente */ } };
  return {
    leggi,
    /** Registra una partita: record, giorni di fila, migliore della sfida del giorno. */
    partita(punti, oggi = semeDelGiorno(), delGiorno = false) {
      const x = leggi();
      const prima = x.record || 0, partite = (x.partite || 0) + 1;
      const fila = x.ultimo === oggi ? (x.fila || 1) : x.ultimo === giornoPrima(oggi) ? (x.fila || 1) + 1 : 1;
      const giorno = delGiorno ? { data: oggi, record: Math.max(x.giorno?.data === oggi ? x.giorno.record : 0, punti) } : x.giorno;
      scrivi({ ...x, record: Math.max(prima, punti), partite, ultimo: oggi, fila, giorno });
      return { record: Math.max(prima, punti), prima, nuovoRecord: punti > prima && prima > 0, partite, fila, migliorOggi: giorno?.data === oggi ? giorno.record : null };
    },
    /** Sblocca le medaglie guadagnate: restituisce solo quelle nuove. */
    medaglie(guadagnate) {
      const x = leggi();
      const gia = new Set(x.medaglie || []);
      const nuove = guadagnate.filter((m) => !gia.has(m));
      if (nuove.length) scrivi({ ...x, medaglie: [...gia, ...nuove] });
      return nuove;
    },
  };
}

// ---------------------------------------------------------------- sorprese

/** Coriandoli nei tre colori del sito, da un punto dello schermo (rispetta il movimento ridotto). */
export function coriandoli(x, y, quanti = 28) {
  if (typeof document === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const strato = document.createElement('div');
  strato.className = 'coriandoli';
  strato.setAttribute('aria-hidden', 'true');
  const colori = ['#FF4A36', '#F2EFE8', '#62D29C', '#F0C252'];
  for (let i = 0; i < quanti; i++) {
    const c = document.createElement('i');
    const ang = Math.random() * Math.PI * 2, forza = 60 + Math.random() * 140;
    c.style.cssText = `left:${x}px;top:${y}px;background:${colori[i % colori.length]};--dx:${Math.cos(ang) * forza}px;--dy:${Math.sin(ang) * forza - 60}px;--r:${Math.random() * 720 - 360}deg`;
    strato.appendChild(c);
  }
  document.body.appendChild(strato);
  setTimeout(() => strato.remove(), 1300);
}

let audio = null, muto = (() => { try { return localStorage.getItem('polpo-suono') === 'no'; } catch { return false; } })();

/** Suoni brevi fatti al volo (niente file): «si», «no», «serie», «premio». */
export function suona(tipo) {
  if (muto || typeof window === 'undefined') return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const note = { si: [660, 880], no: [220, 170], serie: [523, 659, 784], premio: [523, 659, 784, 1047] }[tipo] || [440];
    note.forEach((f, i) => {
      const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * 0.07;
      o.type = tipo === 'no' ? 'sawtooth' : 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.18);
    });
  } catch { /* niente suono */ }
}

/** Il pulsante per accendere e spegnere il suono. */
export function pulsanteSuono(b) {
  const scrivi = () => { b.textContent = muto ? '🔇 Suono' : '🔊 Suono'; b.setAttribute('aria-pressed', muto ? 'false' : 'true'); };
  b.addEventListener('click', () => { muto = !muto; try { localStorage.setItem('polpo-suono', muto ? 'no' : 'si'); } catch { /* niente */ } scrivi(); if (!muto) suona('si'); });
  scrivi();
}

/** Un annuncio grande e breve al centro del gioco («Serie da 10!»). */
export function annuncioGrande(contenitore, testo) {
  if (typeof document === 'undefined') return;
  const a = document.createElement('div');
  a.className = 'annuncio-grande';
  a.textContent = testo;
  a.setAttribute('aria-hidden', 'true');
  contenitore.appendChild(a);
  setTimeout(() => a.remove(), 1400);
}

/** Il riquadro finale con titolo, record, medaglie nuove e sfida. */
export function riquadroFine({ titoloOttenuto, record, nuovoRecord, medaglieNuove, catalogo, sfida, punti, mancano, fila = 1, migliorOggi = null }) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const righe = [`<p class="titolo-polpo">${esc(titoloOttenuto)}</p>`];
  if (sfida) righe.push(punti > sfida.punti ? `<p class="sfida-esito si">Sfida vinta: hai superato ${sfida.punti} punti!</p>` : `<p class="sfida-esito no">Sfida persa: ne servivano ${sfida.punti}. Riprova la stessa partita.</p>`);
  if (nuovoRecord) righe.push('<p class="sfida-esito si">Nuovo record personale!</p>');
  else if (mancano > 0) righe.push(`<p class="vicino">Ti mancavano ${mancano} punti per il tuo record (${record}).</p>`);
  if (migliorOggi !== null) righe.push(`<p class="vicino">Sfida del giorno: il tuo migliore di oggi è ${migliorOggi}. Domani ce n'è una nuova.</p>`);
  if (fila > 1) righe.push(`<p class="vicino">🔥 ${fila} giorni di fila: torna domani per allungare la serie.</p>`);
  if (medaglieNuove.length) righe.push(`<p class="medaglie-nuove"><b>Medaglie nuove:</b> ${medaglieNuove.map((m) => `<span class="medaglia">${esc(catalogo[m].icona)} ${esc(catalogo[m].nome)}</span>`).join(' ')}</p>`);
  return righe.join('');
}

/** L'elenco di tutte le medaglie, con quelle già prese accese. */
export function elencoMedaglie(catalogo, prese) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return Object.entries(catalogo).map(([id, m]) => `<li class="${prese.includes(id) ? 'presa' : ''}" title="${esc(m.come)}"><span>${esc(m.icona)}</span> ${esc(m.nome)}<small>${esc(m.come)}</small></li>`).join('');
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * La schermata d'apertura: la sfida ricevuta, il record, i giorni di fila, le medaglie.
 * Restituisce la sfida letta dall'indirizzo (o null).
 */
export function preparaApertura({ gioco, catalogo, el, bottone }) {
  const sfida = leggiSfida(typeof location === 'undefined' ? '' : location.hash);
  const x = archivio(gioco).leggi();
  const prese = x.medaglie || [], oggi = semeDelGiorno();
  const righe = [];
  if (sfida && el) { // in cima, prima delle regole: è la prima cosa che vede chi apre il link
    const banner = document.createElement('p');
    banner.className = 'banner-sfida';
    banner.innerHTML = `Ti hanno sfidato: fai più di <b>${sfida.punti}</b> punti${sfida.seme ? ', con la stessa partita di chi ti ha sfidato' : ''}.`;
    (el.closest('.velo-box') || el.parentElement).prepend(banner);
    if (bottone) bottone.textContent = 'Accetta la sfida';
  }
  const info = [];
  if (x.record) info.push(`Il tuo record: <b>${x.record}</b>`);
  if (x.giorno?.data === oggi) info.push(`oggi nella sfida del giorno: <b>${x.giorno.record}</b>`);
  if (x.fila > 1 && (x.ultimo === oggi || x.ultimo === giornoPrima(oggi))) info.push(`🔥 ${x.fila} giorni di fila`);
  if (info.length) righe.push(`<p class="vicino">${info.join(' · ')}</p>`);
  righe.push(`<details class="medaglie"><summary>Medaglie: ${prese.filter((m) => catalogo[m]).length} su ${Object.keys(catalogo).length}</summary><ul>${elencoMedaglie(catalogo, prese)}</ul></details>`);
  if (el) el.innerHTML = righe.join('');
  return sfida;
}

/**
 * Chiude la partita: registra punti e medaglie, scrive il riquadro finale, festeggia record e medaglie.
 * Restituisce { record, nuovoRecord, medaglieNuove }.
 */
export function chiudiPartita({ gioco, punti, delGiorno, sfida, catalogo, guadagnate, soglie, el, palco }) {
  const a = archivio(gioco);
  const r = a.partita(punti, semeDelGiorno(), delGiorno);
  const medaglieNuove = a.medaglie(guadagnate.filter((m) => catalogo[m]));
  if (el) el.innerHTML = riquadroFine({ titoloOttenuto: titolo(punti, soglie), record: r.prima, nuovoRecord: r.nuovoRecord, medaglieNuove, catalogo, sfida, punti,
    mancano: r.prima - punti, fila: r.fila, migliorOggi: delGiorno ? r.migliorOggi : null });
  const vinta = sfida && punti > sfida.punti;
  if (r.nuovoRecord || medaglieNuove.length || vinta) {
    suona('premio');
    if (palco) { const b = palco.getBoundingClientRect(); coriandoli(b.left + b.width / 2, Math.max(80, b.top + 120), 46); }
  }
  return { ...r, medaglieNuove };
}

/** Condividi il risultato con il link di sfida (stessa partita, punti da battere). */
export async function condividi({ titolo: t, testo, punti, seme, bottone }) {
  const url = linkSfida(location.href, punti, seme);
  try {
    if (navigator.share) await navigator.share({ title: t, text: testo, url });
    else { await navigator.clipboard.writeText(`${testo} ${url}`); if (bottone) bottone.textContent = 'Link copiato'; }
  } catch { /* condivisione annullata */ }
}
