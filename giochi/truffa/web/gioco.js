// Truffa o no?: arriva un messaggio alla volta. Scorri a sinistra se è una truffa, a destra se è
// affidabile (o usa i pulsanti, o le frecce della tastiera). Dopo ogni risposta il Polpo spiega
// il perché e mostra i segnali che vede lo strumento «È una truffa?». Tutto resta nel browser.
import { MESSAGGI, FONTI } from '../src/messaggi.js';
import { scegliPartita, giusto, nuovoStato, segna, finita, testoCondivisione, SECONDI, VITE, bonusSerie, LIVELLI, MEDAGLIE, medaglieGuadagnate, TITOLI } from '../src/regole.js';
import { caso, semeDelGiorno, semeNuovo, preparaApertura, chiudiPartita, condividi, annuncioGrande, coriandoli, suona, pulsanteSuono } from '../../comune/premi.js';
import { analizza } from '../../../truffe/src/segnali.js';

const $ = (s) => document.querySelector(s);
const meno = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CANALI = { sms: ['💬', 'SMS'], whatsapp: ['🟢', 'WhatsApp'], email: ['✉️', 'Email'], telefonata: ['📞', 'Telefonata'], sito: ['🌐', 'Sito o QR'], social: ['📣', 'Social'] };

let partita = [], stato = nuovoStato(), corrente = null, inizio = 0, durata = 0, timer = 0, attesa = false, errori = [];
const carta = $('#carta'), polpo = $('.tavolo .logo-polpo'), palco = $('.palco-truffa');
let modo = 'libera', seme = '';
const sfida = preparaApertura({ gioco: 'truffa', catalogo: MEDAGLIE, el: $('#premi'), bottone: $('#gioca') });

function nuovaPartita(m = modo) {
  modo = m;
  seme = modo === 'sfida' && sfida?.seme ? sfida.seme : modo === 'giorno' ? semeDelGiorno() : semeNuovo();
  partita = scegliPartita(MESSAGGI, caso(`${seme}-truffa`));
  stato = nuovoStato(); errori = [];
  $('#apertura').hidden = true; $('#fine').hidden = true; $('.tavolo').hidden = false;
  window.scrollTo({ top: $('.barra-gioco').getBoundingClientRect().top + window.scrollY - 6, behavior: 'auto' });
  mostra();
}

function aggiornaBarra() {
  $('#punti').textContent = stato.punti;
  $('#numero').textContent = `${Math.min(stato.indice + 1, partita.length)} / ${partita.length}`;
  $('#vite').textContent = '♥'.repeat(Math.max(0, stato.vite)) + '♡'.repeat(Math.max(0, VITE - stato.vite));
  $('#vite').setAttribute('aria-label', `${stato.vite} vite su ${VITE}`);
  $('#scudo').hidden = !stato.scudo;
  $('#serie').textContent = stato.serie >= 2 ? `serie ${stato.serie}${bonusSerie(stato.serie + 1) ? ' · +5' : ''}` : '';
}

function mostra() {
  aggiornaBarra();
  if (finita(stato, partita.length)) return fine();
  const prima = corrente;
  corrente = partita[stato.indice];
  if (!prima || prima.livello !== corrente.livello) { // un livello nuovo: si annuncia, come nei giochi a livelli
    annuncioGrande(palco, LIVELLI[corrente.livello]);
    if (prima) suona('serie');
  }
  const [icona, canale] = CANALI[corrente.canale];
  carta.className = 'carta entra';
  carta.style.transform = '';
  carta.innerHTML = `<div class="carta-testa"><span class="carta-icona" aria-hidden="true">${icona}</span><span class="carta-canale">${canale}</span><span class="carta-mittente">${esc(corrente.mittente)}</span></div>
    <p class="carta-testo">${esc(corrente.testo)}</p>
    <div class="carta-tempo" aria-hidden="true"><i></i></div>
    <span class="carta-timbro" aria-hidden="true"></span>`;
  carta.setAttribute('aria-label', `${canale} da ${corrente.mittente}: ${corrente.testo}`);
  $('#spiega').hidden = true;
  $('#scelte').hidden = false;
  attesa = false;
  durata = SECONDI[corrente.livello - 1] * 1000 * (meno ? 1.5 : 1);
  inizio = performance.now();
  cancelAnimationFrame(timer);
  timer = requestAnimationFrame(scorri);
  $('#esito').textContent = '';
  carta.focus({ preventScroll: true });
}

function scorri(ora) {
  if (attesa) return;
  const p = Math.min(1, (ora - inizio) / durata);
  const barra = carta.querySelector('.carta-tempo i');
  if (barra) barra.style.width = `${(1 - p) * 100}%`;
  if (p >= 1) return rispondi(null);
  timer = requestAnimationFrame(scorri);
}

function rispondi(risposta) {
  if (attesa || !corrente) return;
  attesa = true;
  cancelAnimationFrame(timer);
  const rimasto = Math.max(0, 1 - (performance.now() - inizio) / durata);
  const m = corrente;
  let ok, parato = false;
  if (risposta === null) {
    ok = false;
    stato = { ...stato, indice: stato.indice + 1, serie: 0 }; // tempo scaduto: niente punti, nessuna vita persa
  } else {
    ok = giusto(m, risposta);
    const prima = stato;
    parato = !ok && prima.scudo;
    stato = segna(stato, ok, rimasto, { livello: m.livello, cascato: m.truffa && risposta === 'affidabile' });
    festeggia(prima, ok, rimasto, m);
  }
  if (!ok) errori.push(m);
  carta.className = `carta esce ${risposta === 'truffa' ? 'a-sinistra' : risposta === 'affidabile' ? 'a-destra' : 'ferma'}`;
  carta.querySelector('.carta-timbro').textContent = m.truffa ? 'TRUFFA' : 'AFFIDABILE';
  polpo.classList.remove('contento', 'triste');
  void polpo.getBoundingClientRect();
  polpo.classList.add(ok ? 'contento' : 'triste');
  const segnali = analizza(m.testo).segnali;
  const verdetto = risposta === null ? 'Tempo scaduto.' : ok ? 'Giusto!' : parato ? 'Sbagliato, ma lo scudo ti ha salvato.' : 'Sbagliato.';
  $('#spiega-titolo').textContent = `${verdetto} ${m.truffa ? 'È una truffa.' : 'È un messaggio affidabile.'}`;
  $('#spiega-titolo').dataset.tono = ok ? 'si' : 'no';
  $('#spiega-perche').textContent = m.perche;
  $('#spiega-segnali').innerHTML = m.truffa && segnali.length
    ? `<p class="spiega-et">I segnali che il Polpo vede</p><ul>${segnali.slice(0, 3).map((s) => `<li><b>${esc(s.titolo)}.</b> ${esc(s.testo)}</li>`).join('')}</ul>`
    : !m.truffa && segnali.length
      ? `<p class="spiega-et">Perché il Polpo si insospettiva</p><ul>${segnali.slice(0, 2).map((s) => `<li>${esc(s.titolo)}: qui però non chiede soldi, dati o link.</li>`).join('')}</ul>`
      : '';
  const f = FONTI[m.fonte];
  $('#spiega-fonte').innerHTML = f ? `<a href="${esc(f.url)}" ${f.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${esc(f.titolo)}</a>` : '';
  $('#esito').textContent = `${verdetto} ${m.perche}`;
  aggiornaBarra();
  $('#scelte').hidden = true;
  $('#spiega').hidden = false;
  $('#avanti').textContent = finita(stato, partita.length) ? 'Vedi il risultato' : 'Avanti';
  $('#avanti').focus({ preventScroll: true });
}

/** Le sorprese: lo scudo conquistato, lo scudo che para un errore, la risposta lampo, le serie. */
function festeggia(prima, ok, rimasto, m) {
  const b = carta.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + 40;
  if (!ok && prima.scudo) { annuncioGrande(palco, 'Lo scudo del Polpo ha parato l\'errore!'); suona('serie'); return; }
  if (!ok) { suona('no'); return; }
  if (stato.scudo && !prima.scudo) { annuncioGrande(palco, '5 di fila: hai lo scudo del Polpo!'); coriandoli(x, y, 30); suona('premio'); return; }
  if (m.livello === 3 && rimasto > 0.75) { annuncioGrande(palco, 'Colpo d\'occhio!'); coriandoli(x, y, 18); suona('serie'); return; }
  if (stato.serie === 3) { annuncioGrande(palco, 'Serie da 3: +5 a risposta'); suona('serie'); return; }
  suona('si');
}

function fine() {
  corrente = null;
  $('#fine-punti').textContent = stato.punti;
  $('#fine-dettaglio').textContent = `${stato.giuste} giusti su ${stato.indice} messaggi · serie migliore ${stato.migliore}${stato.parati ? ` · ${stato.parati} errori parati dallo scudo` : ''}`;
  chiudiPartita({ gioco: 'truffa', punti: stato.punti, delGiorno: modo === 'giorno', sfida: modo === 'sfida' ? sfida : null, catalogo: MEDAGLIE,
    guadagnate: medaglieGuadagnate(stato, partita.length), soglie: TITOLI, el: $('#fine-premi'), palco });
  $('#rigioca').textContent = modo === 'sfida' ? 'Riprova la sfida' : modo === 'giorno' ? 'Riprova la sfida del giorno' : 'Gioca ancora';
  $('#fine-errori').innerHTML = errori.length
    ? errori.map((m) => `<li><b>${CANALI[m.canale][0]} ${esc(m.mittente)}</b>: ${m.truffa ? 'era una truffa' : 'era affidabile'}. ${esc(m.perche)}</li>`).join('')
    : '<li>Nessun errore: sei pronto per insegnarlo ai tuoi genitori.</li>';
  $('#spiega').hidden = true; $('#scelte').hidden = true; $('.tavolo').hidden = true;
  $('#fine').hidden = false;
  $('#rigioca').focus();
}

// ---------------------------------------------------------------- comandi

let trascina = null;
carta.addEventListener('pointerdown', (e) => {
  if (attesa || !corrente) return;
  trascina = { x: e.clientX, y: e.clientY };
  carta.setPointerCapture(e.pointerId);
  carta.classList.remove('entra');
});
carta.addEventListener('pointermove', (e) => {
  if (!trascina) return;
  const dx = e.clientX - trascina.x;
  carta.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
  carta.dataset.verso = dx < -40 ? 'truffa' : dx > 40 ? 'affidabile' : '';
});
function lascia(e) {
  if (!trascina) return;
  const dx = e.clientX - trascina.x;
  trascina = null;
  carta.dataset.verso = '';
  if (dx < -90) rispondi('truffa');
  else if (dx > 90) rispondi('affidabile');
  else carta.style.transform = '';
}
carta.addEventListener('pointerup', lascia);
carta.addEventListener('pointercancel', () => { trascina = null; carta.style.transform = ''; carta.dataset.verso = ''; });

$('#no').addEventListener('click', () => rispondi('truffa'));
$('#si').addEventListener('click', () => rispondi('affidabile'));
$('#avanti').addEventListener('click', mostra);
document.addEventListener('keydown', (e) => {
  if (!$('#apertura').hidden || !$('#fine').hidden) return;
  if (!attesa && (e.key === 'ArrowLeft' || e.key === 't' || e.key === 'T')) { rispondi('truffa'); e.preventDefault(); }
  else if (!attesa && (e.key === 'ArrowRight' || e.key === 'a' || e.key === 'A')) { rispondi('affidabile'); e.preventDefault(); }
  else if (attesa && corrente && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') && document.activeElement !== $('#avanti')) { mostra(); e.preventDefault(); }
});
$('#gioca').addEventListener('click', () => nuovaPartita(sfida ? 'sfida' : 'libera'));
$('#gioca-giorno').addEventListener('click', () => nuovaPartita('giorno'));
$('#rigioca').addEventListener('click', () => nuovaPartita());
$('#condividi').addEventListener('click', () => condividi({ titolo: 'Truffa o no?', testo: testoCondivisione(stato), punti: stato.punti, seme, bottone: $('#condividi') }));
pulsanteSuono($('#suono'));

if (location.hash === '#prova') window.truffaProva = { corrente: () => corrente && { id: corrente.id, truffa: corrente.truffa, livello: corrente.livello }, stato: () => ({ ...stato }), seme: () => seme, partita: () => partita.map((m) => m.id) };
