// La classifica condivisa dei giochi del Polpo civico, dal lato del browser.
// Si entra solo se lo scegli: il nome è inventato (creatura del mare + aggettivo + numero), la regione è facoltativa.
// Al servizio vanno il nome, la regione, il codice della partita e le mosse, perché rifà i conti da sé:
// niente email, niente nomi veri, nessun indirizzo salvato. Puoi uscire quando vuoi.
import { nome, codiceCasuale, REGIONI, regioneValida } from './nomi.js';
import { coriandoli, suona } from './premi.js';

/** L'indirizzo del servizio (Cloudflare Workers). Vuoto: la classifica non compare. */
export const INDIRIZZO = '';

const CHIAVE = 'polpo-classifica';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function indirizzo() {
  try { // nelle prove in locale si può puntare a un servizio locale
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return localStorage.getItem('polpo-classifica-url') || INDIRIZZO;
  } catch { /* niente */ }
  return INDIRIZZO;
}

function leggi() { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}') || {}; } catch { return {}; } }
function scrivi(p) { try { localStorage.setItem(CHIAVE, JSON.stringify(p)); } catch { /* niente */ } }
function profilo() {
  const p = leggi();
  if (!/^[a-f0-9]{16,32}$/.test(p.giocatore || '')) {
    const b = new Uint8Array(12); crypto.getRandomValues(b);
    p.giocatore = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  if (!nome(p.nome)) p.nome = codiceCasuale();
  p.regione = regioneValida(p.regione);
  scrivi(p);
  return p;
}

async function chiama(percorso, opzioni = {}) {
  const base = indirizzo();
  if (!base) return null;
  const c = new AbortController(), t = setTimeout(() => c.abort(), 8000);
  try {
    const r = await fetch(base.replace(/\/$/, '') + percorso, { ...opzioni, signal: c.signal, headers: { 'content-type': 'application/json' } });
    const j = await r.json().catch(() => ({}));
    return r.ok ? j : { errore: j.errore || `errore ${r.status}` };
  } catch { return { errore: 'servizio non raggiungibile' }; } finally { clearTimeout(t); }
}

const posto = (n) => `${n}°`;

function righe(elenco, mio) {
  if (!elenco.length) return '<p class="vicino">Ancora nessuno: il primo posto è libero.</p>';
  return `<ol class="podio">${elenco.map((r) => `<li class="${mio && r.nome === mio ? 'mio' : ''}"><span class="pos">${posto(r.posizione)}</span><span class="chi">${esc(r.nome)}${r.regione ? ` <small>${esc(r.regione)}</small>` : ''}</span><b>${r.punti}</b></li>`).join('')}</ol>`;
}

function tabella(d, mio, iniziale = 'oggi') {
  const tu = d.tu || {};
  const dove = (x, quanti, quando) => (x ? `<p class="vicino">Tu: <b>${posto(x.posizione)}</b> su ${quanti} ${quando}, con ${x.punti} punti.</p>` : '');
  const regioni = d.regioni.length
    ? `<ol class="podio">${d.regioni.map((r, i) => `<li><span class="pos">${posto(i + 1)}</span><span class="chi">${esc(r.regione)} <small>${r.giocatori} giocatori</small></span><b>${r.media}</b></li>`).join('')}</ol><p class="vicino">Media dei punti migliori di ogni giocatore negli ultimi 7 giorni, nella sfida del giorno. Compaiono le regioni con almeno tre giocatori.</p>`
    : '<p class="vicino">Le regioni compaiono quando hanno almeno tre giocatori nella sfida del giorno. Scegli la tua per farla salire.</p>';
  return `<div class="schede-classifica" role="tablist">
      ${[['oggi', 'Oggi'], ['sempre', 'Di sempre'], ['regioni', 'Regioni']].map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === iniziale}" data-scheda="${k}">${t}</button>`).join('')}
    </div>
    <div data-pannello="oggi" ${iniziale === 'oggi' ? '' : 'hidden'}>${righe(d.oggi, mio)}${dove(tu.oggi, d.giocatori?.oggi, 'oggi')}<p class="vicino">Conta solo la sfida del giorno: la stessa partita per tutti.</p></div>
    <div data-pannello="sempre" ${iniziale === 'sempre' ? '' : 'hidden'}>${righe(d.sempre, mio)}${dove(tu.sempre, d.giocatori?.sempre, 'di sempre')}</div>
    <div data-pannello="regioni" hidden>${regioni}</div>`;
}

function attivaSchede(el) {
  el.querySelectorAll('[data-scheda]').forEach((b) => b.addEventListener('click', () => {
    el.querySelectorAll('[data-scheda]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    el.querySelectorAll('[data-pannello]').forEach((p) => { p.hidden = p.dataset.pannello !== b.dataset.scheda; });
  }));
}

/** In apertura: chi è in testa oggi. */
export async function inTesta(gioco, el) {
  if (!el || !indirizzo()) return;
  const d = await chiama(`/classifica/${gioco}`);
  if (!d || d.errore) return;
  el.innerHTML = d.oggi[0]
    ? `🏆 In testa nella sfida del giorno: <b>${esc(d.oggi[0].nome)}</b>${d.oggi[0].regione ? ` (${esc(d.oggi[0].regione)})` : ''}, ${d.oggi[0].punti} punti.`
    : '🏆 Nessuno ha ancora giocato la sfida di oggi: il primo posto è libero.';
  el.hidden = false;
}

/**
 * A fine partita: se partecipi, manda la partita e mostra la classifica; altrimenti chiede se vuoi entrare.
 * partita: le mosse per il controllo dei punti; seme e delGiorno: quale partita era.
 */
export function classificaFine({ gioco, el, seme, delGiorno, partita }) {
  if (!el) return;
  if (!indirizzo()) { el.hidden = true; return; }
  el.hidden = false;
  const p = leggi();
  if (p.partecipa === true) return invia();
  if (p.partecipa === false) {
    el.innerHTML = '<p class="vicino"><button type="button" class="link" data-entra>Partecipa alla classifica condivisa</button></p>';
    el.querySelector('[data-entra]').addEventListener('click', invito);
    return;
  }
  invito();

  function invito() {
    const q = profilo();
    el.innerHTML = `<div class="invito-classifica">
        <p><b>Entra nella classifica</b>: sfida chi gioca in tutta Italia.</p>
        <p class="nome-classifica">Il tuo nome: <b data-nome>${esc(nome(q.nome))}</b> <button type="button" class="link" data-cambia>Cambia nome</button></p>
        <label>La tua regione (facoltativa) <select data-regione><option value="">Nessuna</option>${REGIONI.map((r) => `<option ${r === q.regione ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
        <div class="scelta-partita"><button type="button" class="btn btn-primario" data-si>Metti i miei punti in classifica</button><button type="button" class="btn" data-no>No grazie</button></div>
        <p class="vicino"><small>Mandiamo solo il nome inventato, la regione se la scegli e le mosse della partita, con cui il servizio ricalcola i punti. Niente nomi veri, email o indirizzi salvati. Puoi uscire quando vuoi.</small></p>
      </div>`;
    el.querySelector('[data-cambia]').addEventListener('click', () => { const x = profilo(); x.nome = codiceCasuale(); scrivi(x); el.querySelector('[data-nome]').textContent = nome(x.nome); });
    el.querySelector('[data-regione]').addEventListener('change', (e) => { const x = profilo(); x.regione = regioneValida(e.target.value); scrivi(x); });
    el.querySelector('[data-si]').addEventListener('click', () => { const x = profilo(); x.partecipa = true; scrivi(x); invia(); });
    el.querySelector('[data-no]').addEventListener('click', () => { const x = profilo(); x.partecipa = false; scrivi(x); el.innerHTML = '<p class="vicino">Va bene, niente classifica. Puoi cambiare idea alla fine di ogni partita.</p>'; });
  }

  async function invia() {
    const q = profilo();
    el.innerHTML = '<p class="vicino">Invio alla classifica…</p>';
    const d = await chiama(`/classifica/${gioco}`, { method: 'POST', body: JSON.stringify({ giocatore: q.giocatore, nome: q.nome, regione: q.regione, seme, giorno: delGiorno, partita }) });
    if (!d || d.errore) { el.innerHTML = `<p class="vicino">La classifica non ha accettato la partita (${esc(d?.errore || 'servizio non raggiungibile')}).</p>`; return; }
    const mio = nome(q.nome);
    const primo = (d.tu?.oggi && delGiorno && d.tu.oggi.posizione <= 10) || (d.tu?.sempre && d.tu.sempre.posizione <= 10);
    el.innerHTML = `<p class="titolo-classifica">Classifica${primo ? ' · sei fra i primi dieci!' : ''}</p>${tabella(d, mio, d.delGiorno ? 'oggi' : 'sempre')}
      <p class="vicino"><small>Giochi come <b>${esc(mio)}</b>${q.regione ? ` (${esc(q.regione)})` : ''}. <button type="button" class="link" data-modifica>Cambia nome o regione</button> · <button type="button" class="link" data-esci>Esci dalla classifica</button></small></p>`;
    attivaSchede(el);
    if (primo) { suona('premio'); const b = el.getBoundingClientRect(); coriandoli(b.left + b.width / 2, b.top + 20, 34); }
    el.querySelector('[data-modifica]').addEventListener('click', () => { const x = profilo(); x.partecipa = undefined; scrivi(x); invito(); });
    el.querySelector('[data-esci]').addEventListener('click', async () => {
      const x = profilo();
      const r = await chiama(`/classifica/giocatore/${x.giocatore}`, { method: 'DELETE' });
      if (r && !r.errore) { scrivi({ partecipa: false }); el.innerHTML = '<p class="vicino">Fatto: sei uscito da tutte le classifiche dei giochi.</p>'; }
      else el.insertAdjacentHTML('beforeend', '<p class="vicino">Non sono riuscito a toglierti: riprova tra poco.</p>');
    });
  }
}
