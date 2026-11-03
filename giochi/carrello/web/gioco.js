// Il carrello del Black Friday: tre negozi, 40 secondi ciascuno. Compra il regalo senza cadere nelle
// trappole: tocca quelle che vedi, togli le caselle già spuntate, rifiuta l'abbonamento. Alla cassa
// compaiono i costi nascosti. Poi il conto e i casi veri sanzionati dall'Antitrust.
import { NEGOZI, CASI, NORME } from '../src/negozi.js';
import { SECONDI, nuovoNegozio, tocca, conto, esiti, punti, trappole, testoCondivisione } from '../src/regole.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = (x) => x.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const meno = matchMedia('(prefers-reduced-motion: reduce)').matches;

let k = 0, n = null, s = null, passo = 'prodotto', fineTempo = 0, orologio = 0, totale = { punti: 0, viste: 0, trappole: 0, inPiu: 0, abbonamenti: 0 };
const pagina = $('#pagina'), polpo = $('.tavolo .logo-polpo');

function nuovaPartita() {
  k = 0; totale = { punti: 0, viste: 0, trappole: 0, inPiu: 0, abbonamenti: 0 };
  $('#apertura').hidden = true; $('#fine').hidden = true; $('#esito-negozio').hidden = true; $('.tavolo').hidden = false;
  window.scrollTo({ top: $('.barra-gioco').getBoundingClientRect().top + window.scrollY - 6, behavior: 'auto' });
  apriNegozio();
}

function apriNegozio() {
  n = NEGOZI[k]; s = nuovoNegozio(n); passo = 'prodotto';
  fineTempo = performance.now() + SECONDI * 1000 * (meno ? 1.5 : 1);
  $('#esito-negozio').hidden = true; $('.tavolo').hidden = false;
  disegna();
  cancelAnimationFrame(orologio);
  orologio = requestAnimationFrame(batti);
  annuncia(`${n.nome}: compra «${n.regalo}» senza cadere nelle trappole.`);
}

let ultimoConto = 59;
function batti(ora) {
  const resta = Math.max(0, Math.ceil((fineTempo - ora) / 1000));
  $('#tempo').textContent = resta;
  // il conto alla rovescia del negozio, che riparte da capo
  const t = pagina.querySelector('[data-conto]');
  if (t) {
    const sec = 59 - (Math.floor(ora / 1000) % 60);
    if (sec !== ultimoConto) { ultimoConto = sec; t.querySelector('.cifre').textContent = `00:${String(sec).padStart(2, '0')}`; }
  }
  if (resta <= 0) return paga(true);
  orologio = requestAnimationFrame(batti);
}

function annuncia(testo, tono = 'info') {
  const e = $('#esito');
  e.textContent = testo;
  e.dataset.tono = tono;
}

function reagisci(buono) {
  polpo.classList.remove('contento', 'triste');
  void polpo.getBoundingClientRect();
  polpo.classList.add(buono ? 'contento' : 'triste');
}

function elemento(e) {
  const vista = s.trovati.includes(e.id), falso = s.falsi.includes(e.id);
  const stato = vista ? ' vista' : falso ? ' falso' : '';
  if (e.tipo === 'info') {
    const testo = e.conto ? esc(e.testo).replace('00:59', '<span class="cifre">00:59</span>') : esc(e.testo);
    return `<button type="button" class="etichetta${stato}${e.conto ? ' conto' : ''}" data-id="${e.id}" ${e.conto ? 'data-conto' : ''}>${testo}${vista ? '<span class="bollino">Trappola!</span>' : ''}</button>`;
  }
  if (e.tipo === 'casella') {
    const on = s.caselle[e.id];
    return `<label class="opzione${on ? ' on' : ''}"><input type="checkbox" data-id="${e.id}" ${on ? 'checked' : ''}> <span>${esc(e.testo)}</span> <b>+ ${euro(e.euro)}</b></label>`;
  }
  if (e.tipo === 'scelta') {
    if (s.scelta) return `<p class="scelta-fatta">${s.scelta === 'piccolo' ? 'Hai continuato senza abbonamento.' : `Hai attivato la prova: ${esc(e.dopo)}.`}</p>`;
    return `<div class="scelta"><p>${esc(e.testo)}</p><button type="button" class="grande" data-id="${e.id}" data-come="grande">${esc(e.grande)}</button><button type="button" class="piccolo" data-id="${e.id}" data-come="piccolo">${esc(e.piccolo)}</button></div>`;
  }
  return '';
}

function disegna() {
  $('#negozio-n').textContent = `${k + 1} / ${NEGOZI.length}`;
  $('#punti').textContent = totale.punti;
  const el = n.elementi;
  const c = conto(n, s);
  let corpo;
  if (passo === 'prodotto') {
    corpo = `<div class="prodotto">
        <div class="foto-prodotto" aria-hidden="true">${n.foto || n.icona}</div>
        <div>
          <h3>${esc(n.regalo)}</h3>
          <p class="prezzo">${euro(n.prezzo)}</p>
          <div class="etichette">${el.filter((e) => e.tipo === 'info').map(elemento).join('')}</div>
        </div>
      </div>
      <div class="opzioni">${el.filter((e) => e.tipo === 'casella').map(elemento).join('')}</div>
      ${el.filter((e) => e.tipo === 'scelta').map(elemento).join('')}
      <button type="button" class="btn btn-primario cassa" id="vai-cassa">Vai alla cassa</button>`;
  } else {
    const righe = [[n.regalo, n.prezzo, null]]
      .concat(el.filter((e) => e.tipo === 'casella' && s.caselle[e.id]).map((e) => [e.testo, e.euro, null]))
      .concat(el.filter((e) => e.tipo === 'costo').map((e) => [e.testo, e.euro, e]));
    corpo = `<h3>Riepilogo dell'ordine</h3>
      <table class="riepilogo"><tbody>${righe.map(([t, x, e]) => e
        ? `<tr><td><button type="button" class="voce${s.trovati.includes(e.id) ? ' vista' : ''}" data-id="${e.id}">${esc(t)}${s.trovati.includes(e.id) ? '<span class="bollino">Trappola!</span>' : ''}</button></td><td class="n">${euro(x)}</td></tr>`
        : `<tr><td>${esc(t)}</td><td class="n">${euro(x)}</td></tr>`).join('')}
      <tr class="tot"><td>Totale</td><td class="n">${euro(c.totale)}</td></tr></tbody></table>
      ${c.abbonamento ? `<p class="nota-abb">Più ${euro(c.abbonamento)} all'anno di abbonamento, se non disdici.</p>` : ''}
      <div class="opzioni">${el.filter((e) => e.tipo === 'casella').map(elemento).join('')}</div>
      <div class="azioni-cassa"><button type="button" class="btn" id="torna">← Torna al prodotto</button><button type="button" class="btn btn-primario" id="paga">Paga ${euro(c.totale)}</button></div>`;
  }
  pagina.innerHTML = `<div class="finestra-barra"><span class="pallini" aria-hidden="true"><i></i><i></i><i></i></span><span class="indirizzo">🔒 ${esc(n.dominio)}${passo === 'cassa' ? '/cassa' : ''}</span></div>
    <div class="negozio-testa"><b>${esc(n.nome)}</b><span>BLACK FRIDAY</span></div>
    <div class="negozio-corpo">${corpo}</div>`;
}

function paga(scaduto = false) {
  cancelAnimationFrame(orologio);
  const resta = Math.max(0, (fineTempo - performance.now()) / 1000);
  const c = conto(n, s), lista = esiti(n, s);
  const p = punti(n, s, scaduto ? 0 : resta);
  const viste = lista.filter((x) => x.esito === 'evitata' || x.esito === 'scoperta').length;
  totale.punti += p; totale.viste += viste; totale.trappole += lista.length; totale.inPiu += c.inPiu; totale.abbonamenti += c.abbonamento;
  $('#punti').textContent = totale.punti;
  reagisci(viste >= lista.length - 1);
  const icona = { evitata: '✓', scoperta: '✓', caduto: '✗', sfuggita: '·' };
  const parola = { evitata: 'evitata', scoperta: 'scoperta', caduto: 'ci sei cascato', sfuggita: 'non l\'hai vista' };
  $('#esito-titolo').textContent = `${scaduto ? 'Tempo scaduto: ' : ''}${n.nome}, ${viste} trappole su ${lista.length}`;
  $('#esito-conto').innerHTML = `Hai pagato <b>${euro(c.totale)}</b>${c.inPiu > 0 ? `, di cui <b>${euro(c.inPiu)}</b> per trappole` : ''}${c.abbonamento ? `, e hai attivato un abbonamento da ${euro(c.abbonamento)} l'anno` : ''}. ${s.falsi.length ? `Falsi allarmi: ${s.falsi.length}. ` : ''}Punti: ${p}.`;
  $('#esito-lista').innerHTML = lista.map(({ e, esito }) => {
    const caso = CASI[e.caso], norma = NORME[e.norma];
    return `<li data-esito="${esito}"><span class="segno" aria-hidden="true">${icona[esito]}</span><div><b>${esc(e.testo)}</b> · ${parola[esito]}<br>${esc(e.spiega)}
      <br><small>Caso vero: ${esc(caso.impresa)}, ${euro(caso.euro).replace(',00 €', ' €')} di multa (${caso.anno}) per ${esc(caso.pratica)}. <a href="${esc(caso.url)}" target="_blank" rel="noopener">La decisione</a> · <a href="${esc(norma.url)}" target="_blank" rel="noopener">La norma</a></small></div></li>`;
  }).join('');
  $('#prossimo').textContent = k < NEGOZI.length - 1 ? 'Prossimo negozio' : 'Vedi il risultato';
  $('.tavolo').hidden = true;
  $('#esito-negozio').hidden = false;
  $('#esito-negozio').scrollIntoView({ block: 'start', behavior: meno ? 'auto' : 'smooth' });
  $('#prossimo').focus({ preventScroll: true });
}

function fine() {
  let record = 0;
  try { record = Math.max(+localStorage.getItem('polpo-carrello-record') || 0, totale.punti); localStorage.setItem('polpo-carrello-record', String(record)); } catch { record = totale.punti; }
  $('#esito-negozio').hidden = true; $('.tavolo').hidden = true;
  $('#fine-punti').textContent = totale.punti;
  $('#fine-dettaglio').textContent = `Trappole scoperte o evitate: ${totale.viste} su ${totale.trappole} · record ${record}`;
  $('#fine-conto').textContent = totale.inPiu > 0 || totale.abbonamenti > 0
    ? `Nei tre negozi hai pagato ${euro(totale.inPiu)} in più per le trappole${totale.abbonamenti ? `, più ${euro(totale.abbonamenti)} l'anno di abbonamenti` : ''}.`
    : 'Non hai pagato un euro in più: sei pronto per il Black Friday.';
  $('#fine').hidden = false;
  $('#rigioca').focus();
}

// ---------------------------------------------------------------- comandi

pagina.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-id]');
  if (ev.target.id === 'vai-cassa') { passo = 'cassa'; disegna(); annuncia('Alla cassa: controlla bene il riepilogo prima di pagare.'); return; }
  if (ev.target.id === 'torna') { passo = 'prodotto'; disegna(); return; }
  if (ev.target.id === 'paga') { paga(false); return; }
  if (!b || b.tagName === 'INPUT') return;
  const e = n.elementi.find((x) => x.id === b.dataset.id);
  let r;
  [s, r] = tocca(s, e, b.dataset.come);
  if (r === 'scoperta') { annuncia(`Trappola! ${e.spiega}`, 'si'); reagisci(true); }
  else if (r === 'falso') { annuncia(`Qui non c'è trappola: ${e.spiega} (−5 punti)`, 'no'); reagisci(false); }
  else if (r === 'evitata') { annuncia(`Bene: ${e.spiega}`, 'si'); reagisci(true); }
  else if (r === 'caduto') { annuncia(`Ci sei cascato: ${e.spiega}`, 'no'); reagisci(false); }
  disegna();
});
pagina.addEventListener('change', (ev) => {
  const b = ev.target.closest('input[data-id]');
  if (!b) return;
  const e = n.elementi.find((x) => x.id === b.dataset.id);
  let r;
  [s, r] = tocca(s, e);
  if (e.trappola && r === 'tolta') { annuncia(`Bene, l'hai tolta: ${e.spiega}`, 'si'); reagisci(true); }
  else if (e.trappola) annuncia(`L'hai rimessa: ${e.testo} costa ${euro(e.euro)}.`, 'no');
  else annuncia(r === 'aggiunta' ? `Aggiunta: ${e.testo}. L'hai scelta tu, va bene.` : `Tolta: ${e.testo}.`);
  disegna();
});
$('#prossimo').addEventListener('click', () => { k += 1; if (k < NEGOZI.length) apriNegozio(); else fine(); });
$('#gioca').addEventListener('click', nuovaPartita);
$('#rigioca').addEventListener('click', nuovaPartita);
$('#condividi').addEventListener('click', async () => {
  const testo = testoCondivisione(totale.viste, totale.trappole, totale.inPiu), url = location.href.split('#')[0];
  try {
    if (navigator.share) await navigator.share({ title: 'Il carrello del Black Friday', text: testo, url });
    else { await navigator.clipboard.writeText(`${testo} ${url}`); $('#condividi').textContent = 'Copiato'; }
  } catch { /* condivisione annullata */ }
});

if (location.hash === '#prova') window.carrelloProva = { negozio: () => n && n.id, stato: () => s && JSON.parse(JSON.stringify(s)), totale: () => ({ ...totale }), passo: () => passo };
