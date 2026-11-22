// Indovina il Comune: ogni giorno un Comune misterioso, uguale per tutti, e partite libere quando vuoi.
// Sei tentativi; a ogni errore il Polpo svela un indizio in più (bilancio, debiti, appalti, PNRR, rifiuti,
// e alla fine la provincia). Per ogni Comune scritto dice se è nella stessa Regione o in una confinante,
// se il misterioso ha più o meno abitanti, da che parte sta e quanto è lontano. Tutto resta nel browser.
import DATI from '../src/comuni.js';
import { TENTATIVI, INDIZI, LIVELLI, LIBERI, cerca, misterioso, indizi, nuovoStato, mossa, punti, semeLibero, leggiSeme, testoCondivisione, quadrato,
  DIREZIONI, VICINANZA, MEDAGLIE, TITOLI, medaglieGuadagnate, aggiornaMemoria, filaInCorso, prepara, migliaia, nomeFascia, fasciaDi } from '../src/regole.js';
import { classificaFine, inTesta } from '../../comune/classifica.js';
import { semeDelGiorno, semeNuovo, preparaApertura, chiudiPartita, condividi, annuncioGrande, coriandoli, suona, pulsanteSuono } from '../../comune/premi.js';

const GIOCO = 'indovina-comune';
const CHIAVE = `polpo-gioco-${GIOCO}`;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const meno = matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = prepara(DATI);
const per = (istat) => base.perIstat.get(istat);
const leggi = () => { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}') || {}; } catch { return {}; } };
const scrivi = (x) => { try { localStorage.setItem(CHIAVE, JSON.stringify(x)); } catch { /* niente */ } };
const fonte = (k, breve = false) => `<a href="${esc(DATI.fonti[k].url)}" target="_blank" rel="noopener"${breve ? ` title="${esc(DATI.fonti[k].titolo)}"` : ''}>${esc(breve ? DATI.fonti[k].breve : DATI.fonti[k].titolo.split(' (')[0])}</a>`;

const palco = $('.palco-comune'), polpo = $('.tavolo .logo-polpo');
const campo = $('#campo'), lista = $('#suggerimenti');
let modo = 'libera', seme = '', livello = 'capoluoghi', M = null, stato = null, elenco = [], mosse = [], rivista = false;
let livelloLibero = (() => { const l = leggi().livello; return LIBERI.includes(l) ? l : 'capoluoghi'; })();

const sfida = preparaApertura({ gioco: GIOCO, catalogo: MEDAGLIE, el: $('#premi'), bottone: $('#gioca') });
inTesta(GIOCO, $('#in-testa'));

// ---------------------------------------------------------------- apertura

function preparaScelte() {
  const oggi = semeDelGiorno(), x = leggi();
  document.querySelectorAll('[name="livello"]').forEach((r) => { r.checked = r.value === livelloLibero; });
  const giorno = $('#gioca-giorno');
  const gia = x.giocato?.data === oggi;
  giorno.textContent = gia ? 'Sfida di oggi: rivedi' : 'Sfida del giorno';
  $('#giorno-livello').textContent = `Oggi: ${LIVELLI[leggiSeme(oggi).livello].spiega}.${gia ? ' L\'hai già giocata: domani ce n\'è una nuova.' : ''}`;
  const fila = filaInCorso(x, oggi);
  $('#serie-apertura').textContent = fila > 1 ? `🔥 ${fila} sfide del giorno indovinate di fila` : '';
  $('#serie-apertura').hidden = fila < 2;
  if (sfida) {
    try { const l = leggiSeme(sfida.seme || '').livello; $('#scelta-livello').hidden = true; $('#giorno-livello').textContent = `La sfida è fra ${LIVELLI[l].spiega}.`; } catch { /* seme non valido: partita libera */ }
  }
}
preparaScelte();
document.querySelectorAll('[name="livello"]').forEach((r) => r.addEventListener('change', () => { livelloLibero = r.value; scrivi({ ...leggi(), livello: livelloLibero }); }));

function nuovaPartita(m = modo) {
  modo = m;
  let s;
  if (modo === 'sfida' && sfida?.seme) { try { leggiSeme(sfida.seme); s = sfida.seme; } catch { s = null; } }
  seme = s || (modo === 'giorno' ? semeDelGiorno() : semeLibero(livelloLibero, semeNuovo()));
  if (!s && modo === 'sfida') modo = 'libera';
  ({ comune: M, livello } = misterioso(seme, base));
  stato = nuovoStato(M); mosse = []; rivista = false;
  elenco = indizi(M, livello, base);
  $('#apertura').hidden = true; $('#fine').hidden = true; $('.tavolo').hidden = false;
  $('#ic-livello').textContent = `${modo === 'giorno' ? `Sfida del giorno, ${seme.split('-').reverse().join('/')}` : modo === 'sfida' ? 'Sfida di un amico' : 'Partita libera'} · ${LIVELLI[livello].spiega}`;
  campo.value = ''; chiudiLista();
  window.scrollTo({ top: $('.barra-gioco').getBoundingClientRect().top + window.scrollY - 6, behavior: 'auto' });
  disegna();
  annuncioGrande(palco, 'Chi è il Comune misterioso?');
  $('#esito').textContent = 'Leggi il primo indizio e scrivi un Comune.';
  campo.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- disegno

function disegna() {
  const n = stato.tentativi.length;
  $('#n-tentativo').textContent = `${Math.min(n + 1, TENTATIVI)} / ${TENTATIVI}`;
  $('#n-indizi').textContent = `${stato.indizi} / ${INDIZI}`;
  $('#vale').textContent = stato.finita ? punti(stato, livello) : punti({ ...stato, vinto: true, tentativi: [...stato.tentativi, M.istat] }, livello);
  $('#serie').textContent = filaInCorso(leggi(), semeDelGiorno()) > 1 ? `🔥 ${filaInCorso(leggi(), semeDelGiorno())} giorni` : '';
  $('#indizi').innerHTML = elenco.slice(0, stato.indizi).map((x, i) =>
    `<li class="ic-indizio${i === stato.indizi - 1 && i > 0 ? ' nuovo' : ''}"><span class="ic-n">${i + 1}</span><div><b>${esc(x.titolo)}</b><p>${esc(x.testo)}</p><small>Fonte: ${x.fonti.map(fonte).join(' · ')}</small></div></li>`).join('');
  const coperti = elenco.slice(stato.indizi);
  $('#coperti').innerHTML = coperti.length && !stato.finita
    ? `<span>Ancora coperti:</span> ${coperti.map((x, i) => `<span class="ic-chip"><span class="ic-n">${stato.indizi + i + 1}</span>${esc(x.titolo)}</span>`).join('')}`
    : '';
  $('#aiuto').disabled = stato.finita || stato.indizi >= INDIZI;
  $('#aiuto').textContent = stato.indizi >= INDIZI ? 'Tutti gli indizi sono aperti' : `Chiedi un indizio in più (−${Math.round(10 * LIVELLI[livello].per)} punti)`;
  $('#tentativi').innerHTML = stato.tentativi.map((x, i) => riga(per(x), stato.esiti[i], i + 1)).reverse().join(''); // l'ultimo in cima, sotto il campo
  $('#prova').hidden = stato.finita;
}

const REGIONE = { stessa: 'stessa Regione', confinante: 'Regione confinante', altra: 'Regione lontana' };
function riga(c, e, n) {
  if (e.giusto) return `<li class="ic-tentativo" data-r="giusto"><span class="ic-q" aria-hidden="true">🟩</span><div><span class="sr-only">Tentativo ${n}: </span><b>${esc(c.nome)}</b> <small>${esc(c.sigla)} · ${esc(c.regione)}</small><p>È lui!</p></div></li>`;
  const [, vicino, km] = VICINANZA[e.vicino];
  return `<li class="ic-tentativo" data-r="${e.regione}"><span class="ic-q" aria-hidden="true">${quadrato(e)}<small>${n}</small></span><div><span class="sr-only">Tentativo ${n}: </span><b>${esc(c.nome)}</b> <small>${esc(c.sigla)} · ${esc(c.regione)}</small>
    <p><span class="ic-et">${REGIONE[e.regione]}</span> <span class="ic-et">${e.abitanti === 'più' ? '▲ il misterioso ha più abitanti' : '▼ il misterioso ha meno abitanti'}</span>
    <span class="ic-et ic-dir"><svg class="ic-freccia" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(${Math.round(e.gradi)}deg)"><path d="M12 3 L18 13 H14 V21 H10 V13 H6 Z"/></svg>verso ${DIREZIONI[e.dir]}, ${vicino} (${km})</span></p></div></li>`;
}

// ---------------------------------------------------------------- la ricerca con i suggerimenti

let trovati = [], scelto = -1;
function chiudiLista() { lista.hidden = true; campo.setAttribute('aria-expanded', 'false'); campo.removeAttribute('aria-activedescendant'); scelto = -1; }
function suggerisci() {
  const q = campo.value;
  if (q.trim().length < 2) { trovati = []; chiudiLista(); return; }
  trovati = cerca(q, 12, base).filter((r) => !stato.tentativi.includes(r.istat)).slice(0, 8);
  scelto = trovati.length ? 0 : -1;
  lista.innerHTML = trovati.length
    ? trovati.map((r, i) => `<li role="option" id="sug-${i}" data-i="${i}" aria-selected="${i === scelto}">${esc(r.nome)}<small>${esc(`${r.sigla} · ${r.regione}`)}</small></li>`).join('')
    : '<li class="vuoto" role="option" aria-disabled="true">Nessun Comune con questo nome: controlla come è scritto.</li>';
  lista.hidden = false;
  campo.setAttribute('aria-expanded', 'true');
  evidenzia();
}
function evidenzia() {
  lista.querySelectorAll('[data-i]').forEach((li) => li.setAttribute('aria-selected', String(+li.dataset.i === scelto)));
  if (scelto >= 0) { campo.setAttribute('aria-activedescendant', `sug-${scelto}`); $(`#sug-${scelto}`)?.scrollIntoView({ block: 'nearest' }); }
}
campo.addEventListener('input', suggerisci);
campo.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' && trovati.length) { e.preventDefault(); scelto = (scelto + 1) % trovati.length; evidenzia(); }
  else if (e.key === 'ArrowUp' && trovati.length) { e.preventDefault(); scelto = (scelto - 1 + trovati.length) % trovati.length; evidenzia(); }
  else if (e.key === 'Escape') chiudiLista();
});
lista.addEventListener('pointerdown', (e) => e.preventDefault()); // il campo non perde il fuoco
lista.addEventListener('click', (e) => { const li = e.target.closest('[data-i]'); if (li) prova(trovati[+li.dataset.i]); });
$('#prova').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!lista.hidden && scelto >= 0 && trovati[scelto]) return prova(trovati[scelto]);
  const t = cerca(campo.value, 12, base).filter((r) => !stato.tentativi.includes(r.istat));
  const esatti = t.filter((r) => r.n === normale(campo.value));
  if (t.length === 1 || esatti.length === 1) return prova(esatti[0] || t[0]);
  if (!t.length) { $('#esito').textContent = 'Non trovo questo Comune: scegli dai suggerimenti.'; return; }
  suggerisci();
  $('#esito').textContent = 'Più Comuni con questo nome: scegli quello giusto dalla lista.';
});
const normale = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
document.addEventListener('click', (e) => { if (!e.target.closest('#prova')) chiudiLista(); });

// ---------------------------------------------------------------- le mosse

function prova(c) {
  if (!c || stato.finita) return;
  chiudiLista(); campo.value = '';
  const prima = stato;
  stato = mossa(stato, c.istat, base);
  mosse.push(c.istat);
  const e = stato.esiti.at(-1);
  disegna();
  polpo.classList.remove('contento', 'triste'); void polpo.getBoundingClientRect();
  if (e.giusto) {
    polpo.classList.add('contento');
    annuncioGrande(palco, stato.tentativi.length === 1 ? 'Al primo colpo!' : `Trovato: ${M.nome}!`);
    const b = palco.getBoundingClientRect(); coriandoli(b.left + b.width / 2, Math.max(80, b.top + 120), 40); suona('premio');
    $('#esito').textContent = `Giusto: era ${M.nome}.`;
    return setTimeout(fine, meno ? 300 : 1100);
  }
  polpo.classList.add('triste');
  const [, vicino] = VICINANZA[e.vicino];
  $('#esito').textContent = `${c.nome}: no. ${REGIONE[e.regione][0].toUpperCase()}${REGIONE[e.regione].slice(1)}, il misterioso ha ${e.abitanti} abitanti ed è verso ${DIREZIONI[e.dir]}, ${vicino}.${stato.finita ? '' : stato.indizi > prima.indizi ? ` Si apre l'indizio ${stato.indizi}.` : ''}`;
  if (e.vicino === 0) { annuncioGrande(palco, 'Fuochino!'); suona('serie'); }
  else if (e.regione === 'stessa') { annuncioGrande(palco, 'Regione giusta!'); suona('serie'); }
  else suona('no');
  if (stato.finita) return setTimeout(fine, meno ? 300 : 900);
  campo.focus({ preventScroll: true });
}

$('#aiuto').addEventListener('click', () => {
  if (stato.finita || stato.indizi >= INDIZI) return;
  stato = mossa(stato, 'i', base);
  mosse.push('i');
  disegna();
  $('#esito').textContent = `Indizio ${stato.indizi}: ${elenco[stato.indizi - 1].testo}`;
  campo.focus({ preventScroll: true });
});

// ---------------------------------------------------------------- fine

function scheda(c) {
  const d = c.dati, m = DATI.mediane[nomeFascia(fasciaDi(c.pop))] || {};
  const r = (et, v, med, f) => `<tr><th scope="row">${et}</th><td>${v}</td><td>${med ?? ''}</td><td>${f}</td></tr>`;
  const e = (x) => (x === null ? 'n.d.' : `${migliaia(x)} €`), p = (x) => (x === null ? 'n.d.' : `${String(x).replace('.', ',')}%`);
  return `<p class="ic-scheda-testa"><b>${esc(c.nome)}</b> (${esc(c.sigla)}), ${esc(c.regione)} · ${migliaia(c.pop)} abitanti${c.capoluogo ? ' · capoluogo' : ''}</p>
    <div class="scorri"><table class="ic-scheda"><thead><tr><th scope="col">I numeri</th><th scope="col">${esc(c.nome)}</th><th scope="col">Mediana dei Comuni simili</th><th scope="col">Fonte</th></tr></thead><tbody>
    ${r(`Spesa per abitante (${d.anno})`, e(d.spesa), e(m.spesa), fonte('bdap', true))}
    ${r('Debito per abitante', e(d.debito), e(m.debito), fonte('bdap', true))}
    ${r('Entrate proprie incassate', p(d.riscossione), p(m.riscossione), fonte('bdap', true))}
    ${r('Rifiuti, spesa per abitante', e(d.rifiuti), e(m.rifiuti), fonte('bdap', true))}
    ${r('Appalti senza gara, quota del valore', p(d.senzaGara), p(m.senza_gara), fonte('anac', true))}
    ${r('Progetti del PNRR', migliaia(d.pnrr), migliaia(m.pnrr || 0), fonte('pnrr', true))}
    </tbody></table></div>
    <p class="ic-link"><a class="btn" href="../../bilancio-comune/#istat=${c.istat}">Il bilancio di ${esc(c.nome)}</a><a class="btn" href="../../raccolta/#istat=${c.istat}">Chi raccoglie i rifiuti</a><a class="btn" href="../../progetti-comune/#istat=${c.istat}">I progetti del PNRR</a><a class="btn" href="../../per-te/">Il tuo Comune, per te</a></p>`;
}
function fine() {
  const delGiorno = modo === 'giorno';
  const tot = punti(stato, livello);
  const partita = delGiorno ? { tentativi: mosse } : { tentativi: mosse, livello };
  $('#t-fine').textContent = stato.vinto ? `Era ${M.nome}!` : `Era ${M.nome}`;
  $('#fine-punti').textContent = tot;
  $('#fine-dettaglio').textContent = stato.vinto
    ? `punti · ${stato.tentativi.length} ${stato.tentativi.length === 1 ? 'tentativo' : 'tentativi'} su ${TENTATIVI}, ${INDIZI - stato.indizi} indizi rimasti coperti`
    : `punti · niente da fare questa volta: la prossima lo trovi.`;
  $('#fine-quadrati').textContent = stato.esiti.map(quadrato).join('') + (stato.chiesti ? ` 💡${stato.chiesti}` : '');
  $('#scheda').innerHTML = scheda(M);
  if (!rivista) {
    const prima = leggi();
    const x = aggiornaMemoria(prima, { oggi: semeDelGiorno(), delGiorno, vinto: stato.vinto, regione: M.regione, partita: { seme, tentativi: mosse } });
    scrivi(x);
    chiudiPartita({ gioco: GIOCO, punti: tot, delGiorno, sfida: modo === 'sfida' ? sfida : null, catalogo: MEDAGLIE,
      guadagnate: medaglieGuadagnate(stato, M, { filaGiusti: delGiorno ? x.filaGiusti || 0 : filaInCorso(x, semeDelGiorno()), regioni: x.regioni || [] }), soglie: TITOLI, el: $('#fine-premi'), palco });
    const persa = $('#fine-premi .sfida-esito.no');
    if (persa && modo === 'sfida') persa.textContent = `Sfida persa: ne servivano ${sfida.punti}. Rilancia tu: gioca un altro Comune e sfidalo.`;
    if (delGiorno && stato.vinto && x.filaGiusti > 1) $('#fine-premi').insertAdjacentHTML('beforeend', `<p class="vicino">🔥 ${x.filaGiusti} sfide del giorno indovinate di fila.</p>`);
    if (x.regioni?.length) $('#fine-premi').insertAdjacentHTML('beforeend', `<p class="vicino">Regioni in cui hai indovinato un Comune: ${x.regioni.length} su 20.</p>`);
    classificaFine({ gioco: GIOCO, el: $('#fine-classifica'), seme, delGiorno, partita });
  } else {
    $('#fine-premi').innerHTML = '<p class="vicino">La sfida di oggi l\'hai già giocata: questa è la tua partita. Domani c\'è un Comune nuovo.</p>';
    $('#fine-classifica').hidden = true;
  }
  $('#rigioca').textContent = delGiorno ? 'Gioca una partita libera' : modo === 'sfida' ? 'Gioca una partita libera' : 'Un altro Comune';
  $('.tavolo').hidden = true;
  $('#fine').hidden = false;
  $('#rigioca').focus({ preventScroll: true });
  $('#fine').scrollIntoView({ block: 'start', behavior: meno ? 'auto' : 'smooth' });
}

/** La sfida di oggi già giocata: si rivede la partita, senza giocarla di nuovo (la risposta la conosci già). */
function rivedi() {
  const g = leggi().giocato;
  modo = 'giorno'; seme = semeDelGiorno();
  ({ comune: M, livello } = misterioso(seme, base));
  stato = nuovoStato(M); mosse = []; elenco = indizi(M, livello, base);
  try { for (const x of g.partita?.tentativi || []) { stato = mossa(stato, x, base); mosse.push(x); } } catch { /* partita salvata male */ }
  rivista = true;
  $('#apertura').hidden = true;
  fine();
}

$('#gioca').addEventListener('click', () => nuovaPartita(sfida ? 'sfida' : 'libera'));
$('#gioca-giorno').addEventListener('click', () => (leggi().giocato?.data === semeDelGiorno() && leggi().giocato?.partita?.seme === semeDelGiorno() ? rivedi() : nuovaPartita('giorno')));
$('#rigioca').addEventListener('click', () => nuovaPartita('libera'));
$('#condividi').addEventListener('click', () => stato && condividi({ titolo: 'Indovina il Comune', testo: testoCondivisione(stato, leggiSeme(seme)), punti: punti(stato, livello), seme, bottone: $('#condividi') }));
pulsanteSuono($('#suono'));

if (location.hash === '#prova') window.comuneProva = { mistero: () => M && { istat: M.istat, nome: M.nome }, stato: () => stato && { ...stato }, seme: () => seme, livello: () => livello };
