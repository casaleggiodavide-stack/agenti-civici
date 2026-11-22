// Più o meno: due contratti pubblici veri, quale è costato di più? Il contratto appena svelato resta in
// tavola con il suo importo e ne arriva uno nuovo. Tocca la carta (o usa le frecce o i tasti 1 e 2).
// Dopo ogni risposta: importi, ente, anno, procedura, CIG con la scheda ANAC e il confronto con la mediana.
// Tutto resta nel browser; alla classifica (se scegli di entrare) vanno solo le scelte e il tempo.
import { CARTE, COPPIE, VITE, SECONDI, LAMPO, BONUS_ORO, LIVELLI, MEDAGLIE, TITOLI, preparaPartita, carta, giusta, livello, nuovoStato, segna, finita,
  euro, migliaia, rispettoMediana, perAbitante, quanteVolte, medaglieGuadagnate, testoCondivisione } from '../src/regole.js';
import { classificaFine, inTesta } from '../../comune/classifica.js';
import { semeDelGiorno, semeNuovo, preparaApertura, chiudiPartita, condividi, annuncioGrande, coriandoli, suona, pulsanteSuono } from '../../comune/premi.js';

const $ = (s) => document.querySelector(s);
const meno = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const GIOCO = 'piu-o-meno';

const palco = $('.palco-piu'), polpo = $('.domanda .logo-polpo');
const lati = { s: $('#pm-s'), d: $('#pm-d') };
let modo = 'libera', seme = '', partita = null, stato = nuovoStato(), k = 0, attesa = true, inizio = 0, durata = 0, timer = 0, scelte = [], errori = [];
const sfida = preparaApertura({ gioco: GIOCO, catalogo: MEDAGLIE, el: $('#premi'), bottone: $('#gioca') });
inTesta(GIOCO, $('#in-testa'));

function nuovaPartita(m = modo) {
  modo = m;
  seme = modo === 'sfida' && sfida?.seme ? sfida.seme : modo === 'giorno' ? semeDelGiorno() : semeNuovo();
  partita = preparaPartita(seme);
  stato = nuovoStato(); k = 0; scelte = []; errori = [];
  $('#apertura').hidden = true; $('#fine').hidden = true; $('.tavolo-piu').hidden = false;
  window.scrollTo({ top: $('.barra-gioco').getBoundingClientRect().top + window.scrollY - 6, behavior: 'auto' });
  mostra();
}

function aggiornaBarra() {
  $('#punti').textContent = stato.punti;
  $('#numero').textContent = `${Math.min(k + 1, COPPIE)} / ${COPPIE}`;
  $('#vite').textContent = '♥'.repeat(Math.max(0, stato.vite)) + '♡'.repeat(Math.max(0, VITE - stato.vite));
  $('#vite').setAttribute('aria-label', `${stato.vite} vite su ${VITE}`);
  $('#serie').textContent = stato.serie >= 2 ? `serie ${stato.serie}${stato.serie + 1 >= 3 ? ' · +5' : ''}` : '';
  $('#fase').textContent = `livello ${livello(Math.min(k, COPPIE - 1))}`;
}

/** L'oggetto in chiaro è l'originale con le sole minuscole? Allora l'originale non si ripete. */
const piano = (t) => t.toLowerCase().replace(/[^a-zà-ù0-9]+/g, ' ').trim();
const uguale = (a, b) => piano(a) === piano(b);

/** Il contenuto di una carta: categoria, oggetto in chiaro e originale, ente, luogo, anno, procedura, importo. */
function riempi(el, c, { svelato, oro }) {
  el.innerHTML = `<span class="c-cat">${esc(c.emoji)} ${esc(c.nomeCategoria)}</span>
    ${oro && !svelato ? '<span class="c-oro">✦ contratto d\'oro · +25</span>' : ''}
    <span class="c-testo">${esc(c.testo)}</span>
    ${uguale(c.testo, c.originale) ? '' : `<span class="c-orig"><i>OGGETTO ORIGINALE</i> ${esc(c.originale)}</span>`}
    <span class="c-ente"><b>${esc(c.ente)}</b> · ${esc(c.tipoEnte)}</span>
    <span class="c-dove">${esc([c.provincia, c.regione].filter(Boolean).join(', '))} · ${c.anno} · ${esc(c.procedura)}</span>
    <span class="c-importo${svelato ? '' : ' coperto'}">${svelato ? esc(euro(c.importo)) : '? €'}</span>`;
  el.dataset.oro = oro && !svelato ? '1' : '';
  el.dataset.esito = '';
  const etichetta = `${c.nomeCategoria}: ${c.testo}. ${c.ente}, ${c.regione}, ${c.anno}, ${c.procedura}. ${svelato ? `Importo ${euro(c.importo)}.` : 'Importo coperto.'}${oro && !svelato ? ' Contratto d\'oro.' : ''}`;
  el.setAttribute('aria-label', etichetta);
}

function mostra() {
  aggiornaBarra();
  if (finita(stato)) return fine();
  const lv = livello(k);
  if (k === 0 || livello(k - 1) !== lv) { annuncioGrande(palco, LIVELLI[lv]); if (k) suona('serie'); }
  const a = carta(partita.carte[k]), b = carta(partita.carte[k + 1]);
  riempi(lati.s, a, { svelato: k > 0, oro: false });
  riempi(lati.d, b, { svelato: false, oro: partita.oro[k + 1] });
  lati.d.classList.remove('entra'); void lati.d.offsetWidth; lati.d.classList.add('entra');
  for (const el of Object.values(lati)) el.setAttribute('aria-disabled', 'false');
  $('#pm-domanda').textContent = k === 0 ? 'Quale è costato di più?' : `Più o meno di ${euro(a.importo)}? Tocca il più caro.`;
  $('#pm-spiega').hidden = true;
  $('#pm-tempo').hidden = false;
  $('#pm-aiuto').hidden = false;
  $('#esito').textContent = '';
  attesa = false;
  durata = SECONDI[lv - 1] * 1000 * (meno ? 1.5 : 1);
  inizio = performance.now();
  cancelAnimationFrame(timer);
  timer = requestAnimationFrame(scorri);
  (k === 0 ? lati.s : lati.d).focus({ preventScroll: true });
}

function scorri(ora) {
  if (attesa) return;
  const p = Math.min(1, (ora - inizio) / durata);
  $('#pm-tempo i').style.width = `${(1 - p) * 100}%`;
  if (p >= 1) return rispondi('-');
  timer = requestAnimationFrame(scorri);
}

function rispondi(x) {
  if (attesa || !partita) return;
  attesa = true;
  cancelAnimationFrame(timer);
  const rimasto = x === '-' ? 0 : Math.round(Math.max(0, 1 - (performance.now() - inizio) / durata) * 100) / 100; // arrotondato: la classifica rifà gli stessi conti
  scelte.push([x, rimasto]);
  const lv = livello(k), oro = partita.oro[k + 1];
  const ok = giusta(partita, k, x);
  const prima = stato;
  stato = segna(stato, ok, rimasto, { livello: lv, oro });
  const a = carta(partita.carte[k]), b = carta(partita.carte[k + 1]);
  if (!ok) errori.push([a, b]);
  // le due carte svelate
  riempi(lati.s, a, { svelato: true, oro: false });
  riempi(lati.d, b, { svelato: true, oro: false });
  const caro = a.importo > b.importo ? 's' : 'd';
  lati[caro].dataset.esito = 'caro';
  lati[caro].insertAdjacentHTML('beforeend', '<span class="c-timbro" aria-hidden="true">PIÙ CARO</span>');
  if (!ok && x !== '-') lati[x].dataset.esito = 'scelto-no';
  for (const el of Object.values(lati)) el.setAttribute('aria-disabled', 'true');
  polpo.classList.remove('contento', 'triste'); void polpo.getBoundingClientRect(); polpo.classList.add(ok ? 'contento' : 'triste');
  festeggia(prima, ok, rimasto, oro);

  const guadagno = stato.punti - prima.punti;
  const verdetto = x === '-' ? 'Tempo scaduto.' : ok ? `Giusto! +${guadagno}` : 'Sbagliato.';
  $('#pm-verdetto').textContent = verdetto;
  $('#pm-verdetto').dataset.tono = ok ? 'si' : 'no';
  const [piu, meno_] = caro === 's' ? [a, b] : [b, a];
  $('#pm-confronto').innerHTML = `<b>${esc(piu.nomeCategoria)}</b> (${esc(euro(piu.importo))}) è costato <b>${quanteVolte(a.importo, b.importo)} volte</b> ${esc(meno_.nomeCategoria.toLowerCase() === piu.nomeCategoria.toLowerCase() ? 'l\'altro contratto' : meno_.nomeCategoria)} (${esc(euro(meno_.importo))}).`;
  $('#pm-dettagli').innerHTML = [a, b].map(dettaglio).join('');
  $('#pm-curiosita').hidden = !oro;
  if (oro) $('#pm-curiosita').innerHTML = `✦ <b>Contratto d'oro${ok ? `: +${BONUS_ORO} punti` : ''}.</b> ${esc(b.oro)}`;
  $('#esito').textContent = `${verdetto} ${piu.nomeCategoria}: ${euro(piu.importo)}; ${meno_.nomeCategoria}: ${euro(meno_.importo)}.`;
  aggiornaBarra();
  $('#numero').textContent = `${k + 1} / ${COPPIE}`;
  $('#pm-tempo').hidden = true;
  $('#pm-aiuto').hidden = true;
  $('#pm-spiega').hidden = false;
  k += 1;
  $('#pm-avanti').textContent = finita(stato) ? 'Vedi il risultato' : 'Avanti';
  $('#pm-avanti').focus({ preventScroll: true });
}

function dettaglio(c) {
  const ab = perAbitante(c.importo, c.abitanti);
  const parti = [
    `<b>${esc(c.emoji)} ${esc(euro(c.importo))}</b>, ${esc(c.ente)} (${esc([c.provincia, c.regione].filter(Boolean).join(', '))}), pubblicato nel ${c.anno}, ${esc(c.procedura.toLowerCase())}${c.offerte ? `, ${c.offerte} ${c.offerte === 1 ? 'offerta' : 'offerte'}` : ''}.`,
    `Mediana di «${esc(c.nomeCategoria)}»: ${esc(euro(c.mediana))} su ${migliaia(c.contrattiCategoria)} contratti del 2025; questo è ${esc(rispettoMediana(c.importo, c.mediana))}.`,
    ab ? `Per i ${migliaia(c.abitanti)} abitanti del Comune fanno ${ab} € a testa.` : '',
    `CIG <a href="${esc(c.link)}" target="_blank" rel="noopener">${esc(c.cig)}</a> (scheda ANAC).`,
  ];
  return `<li>${parti.filter(Boolean).join(' ')}</li>`;
}

/** Le sorprese: il contratto d'oro, la vita restituita dalla serie, il colpo d'occhio, le serie. */
function festeggia(prima, ok, rimasto, oro) {
  const r = lati.d.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + 30;
  if (!ok) { suona('no'); return; }
  if (oro) { annuncioGrande(palco, `Contratto d'oro! +${BONUS_ORO}`); coriandoli(x, y, 36); suona('premio'); return; }
  if (stato.viteRese > prima.viteRese) { annuncioGrande(palco, `${stato.serie} di fila: il Polpo ti ridà una vita!`); coriandoli(x, y, 26); suona('premio'); return; }
  if (rimasto >= LAMPO) { annuncioGrande(palco, 'Colpo d\'occhio! +5'); suona('serie'); return; }
  if (stato.serie === 3) { annuncioGrande(palco, 'Serie da 3: +5 a risposta'); suona('serie'); return; }
  if (stato.serie > 0 && stato.serie % 5 === 0) { annuncioGrande(palco, `Serie da ${stato.serie}!`); coriandoli(x, y, 20); suona('serie'); return; }
  suona('si');
}

function fine() {
  attesa = true;
  $('#fine-punti').textContent = stato.punti;
  $('#fine-dettaglio').textContent = `${stato.giuste} giuste su ${stato.indice} coppie · serie migliore ${stato.migliore}${stato.lampi ? ` · ${stato.lampi} colpi d'occhio` : ''}${stato.oriPresi ? ` · ${stato.oriPresi} contratti d'oro` : ''}`;
  chiudiPartita({ gioco: GIOCO, punti: stato.punti, delGiorno: modo === 'giorno', sfida: modo === 'sfida' ? sfida : null, catalogo: MEDAGLIE,
    guadagnate: medaglieGuadagnate(stato), soglie: TITOLI, el: $('#fine-premi'), palco });
  classificaFine({ gioco: GIOCO, el: $('#fine-classifica'), seme, delGiorno: modo === 'giorno', partita: { scelte } });
  $('#rigioca').textContent = modo === 'sfida' ? 'Riprova la sfida' : modo === 'giorno' ? 'Riprova la sfida del giorno' : 'Gioca ancora';
  $('#fine-errori').innerHTML = errori.length
    ? errori.map(([a, b]) => `<li>${esc(a.emoji)} ${esc(a.nomeCategoria)}, ${esc(a.ente)}: <b>${esc(euro(a.importo))}</b> · ${esc(b.emoji)} ${esc(b.nomeCategoria)}, ${esc(b.ente)}: <b>${esc(euro(b.importo))}</b></li>`).join('')
    : '<li>Nessun errore: hai l\'occhio di chi legge le determine.</li>';
  $('.tavolo-piu').hidden = true;
  $('#fine').hidden = false;
  $('#rigioca').focus();
}

// ---------------------------------------------------------------- comandi

lati.s.addEventListener('click', () => rispondi('s'));
lati.d.addEventListener('click', () => rispondi('d'));
$('#pm-avanti').addEventListener('click', mostra);
document.addEventListener('keydown', (e) => {
  if (!$('#apertura').hidden || !$('#fine').hidden || e.altKey || e.ctrlKey || e.metaKey) return;
  if (!attesa && ['ArrowLeft', 'ArrowUp', '1'].includes(e.key)) { rispondi('s'); e.preventDefault(); }
  else if (!attesa && ['ArrowRight', 'ArrowDown', '2'].includes(e.key)) { rispondi('d'); e.preventDefault(); }
  else if (attesa && !$('#pm-spiega').hidden && (e.key === 'Enter' || e.key === ' ') && document.activeElement !== $('#pm-avanti') && document.activeElement?.tagName !== 'A') { mostra(); e.preventDefault(); }
});
$('#gioca').addEventListener('click', () => nuovaPartita(sfida ? 'sfida' : 'libera'));
$('#gioca-giorno').addEventListener('click', () => nuovaPartita('giorno'));
$('#rigioca').addEventListener('click', () => nuovaPartita());
$('#condividi').addEventListener('click', () => condividi({ titolo: 'Più o meno', testo: testoCondivisione(stato), punti: stato.punti, seme, bottone: $('#condividi') }));
pulsanteSuono($('#suono'));

// «I dati del gioco»: l'elenco di tutti i contratti del mazzo, scritto solo quando lo apri (la tabella resta ordinabile)
const elenco = $('#elenco-contratti');
elenco?.addEventListener('toggle', () => {
  const corpo = $('#t-contratti tbody');
  if (!elenco.open || corpo.rows.length) return;
  const cella = (mostrato, valore, num) => `<td${num ? ' class="n"' : ''} data-v="${esc(valore)}">${mostrato}</td>`;
  corpo.innerHTML = CARTE.map((_, i) => carta(i)).sort((a, b) => b.importo - a.importo).map((c) => `<tr>${[
    cella(`${esc(c.emoji)} ${esc(c.nomeCategoria)}`, c.nomeCategoria), cella(esc(c.originale), c.originale), cella(esc(c.ente), c.ente),
    cella(esc(c.regione), c.regione), cella(esc(c.procedura), c.procedura), cella(esc(euro(c.importo)), c.importo, true),
    cella(`<a href="${esc(c.link)}" target="_blank" rel="noopener">${esc(c.cig)}</a>`, c.cig)].join('')}</tr>`).join('');
});

if (location.hash === '#prova') {
  window.piuProva = {
    seme: () => seme, stato: () => ({ ...stato }), coppia: () => k, scelte: () => scelte.map((x) => [...x]),
    giusta: () => (partita && !attesa ? (CARTE[partita.carte[k]][9] > CARTE[partita.carte[k + 1]][9] ? 's' : 'd') : null),
  };
}
