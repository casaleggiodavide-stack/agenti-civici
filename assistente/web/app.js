// Interfaccia dell'Assistente civico. La conversazione passa da Claude con
// l'account di chi usa la pagina (capacità «sample» delle pagine claude.ai);
// i calcoli, i documenti e i dati personali restano nel browser.

import { $, $$, esc, eur, copia, stampa, mailto, testoDa, archivio } from '../src/comune/interfaccia.js';
import { pulsantiCalendario, scaricaIcs, dentroClaude } from '../src/comune/calendario.js';
import { iso, oggi, data } from '../src/comune/date.js';
import { creaStrumenti } from '../src/strumenti.js';
import { istruzioni } from '../src/istruzioni.js';

const OGGI = iso(oggi());
const PERSONALI = [['nome', 'Nome e cognome'], ['nascita', 'Luogo e data di nascita'], ['residenza', 'Indirizzo di residenza'], ['codice_fiscale', 'Codice fiscale'], ['recapito', 'PEC o email'], ['luogo', 'Luogo in cui firmi']];
const datiPersonali = archivio('assistente-dati-personali-v1');
const MAX_TURNI = 16;

let sample = null;
let turni = [];
let ctl = null;
let corrente = null; // il messaggio dell'assistente in scrittura
let documento = null;
const raccolti = {}; // ultime risposte passate agli strumenti, senza dati personali

// ---------- Testo dell'assistente: un markdown minimo e sicuro ----------

function inline(t) {
  return t
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:])/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
}

function md(testo) {
  const righe = esc(testo).split('\n');
  let html = '';
  let lista = null;
  let par = [];
  const chiudiPar = () => { if (par.length) { html += `<p>${inline(par.join(' '))}</p>`; par = []; } };
  const chiudiLista = () => { if (lista) { html += `</${lista}>`; lista = null; } };
  for (const r of righe) {
    const t = r.trim();
    const ul = t.match(/^[-*•]\s+(.*)/);
    const ol = t.match(/^\d+[.)]\s+(.*)/);
    if (ul || ol) {
      chiudiPar();
      const tipo = ul ? 'ul' : 'ol';
      if (lista !== tipo) { chiudiLista(); html += `<${tipo}>`; lista = tipo; }
      html += `<li>${inline((ul || ol)[1])}</li>`;
    } else if (!t) {
      chiudiPar(); chiudiLista();
    } else {
      chiudiLista();
      par.push(t.replace(/^#+\s*/, ''));
    }
  }
  chiudiPar(); chiudiLista();
  return html;
}

// ---------- Messaggi ----------

function aggiungiMessaggio(chi, testo, classe = '') {
  const el = document.createElement('div');
  el.className = `msg ${chi === 'tu' ? 'tu' : 'ai'} ${classe}`;
  el.innerHTML = `<span class="chi">${chi === 'tu' ? 'Tu' : 'Assistente'}</span><div class="testo">${chi === 'tu' ? `<p>${esc(testo).replace(/\n/g, '<br>')}</p>` : md(testo)}</div><span class="stato"></span>`;
  $('#messaggi').appendChild(el);
  el.scrollIntoView({ block: 'end', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  return el;
}

const ERRORI = {
  not_granted: 'Per usare l\'assistente serve il tuo permesso a usare Claude da questa pagina. Puoi darlo ricaricando la pagina, oppure usare direttamente gli strumenti dalla barra in alto.',
  sampling_disabled: 'Claude non è disponibile per questo account. Puoi usare direttamente gli strumenti dalla barra in alto.',
  rate_limited: 'Troppe richieste in poco tempo, o hai raggiunto il limite di utilizzo del tuo account. Riprova tra qualche minuto.',
  session_expired: 'La sessione è scaduta: accedi di nuovo a Claude e riprova.',
  refused: 'Non posso rispondere a questa richiesta così com\'è. Prova a riformularla.',
  prompt_too_large: 'La conversazione è diventata troppo lunga. Inizia una nuova conversazione.',
  empty_completion: 'Non è arrivata una risposta. Prova a riformulare la domanda.',
  upstream_error: 'Si è interrotta la connessione con Claude. Puoi riprovare inviando di nuovo il messaggio.',
  tools_unavailable: 'Questa versione dell\'app di Claude non permette all\'assistente di usare i suoi strumenti di calcolo.',
  capability_disabled: 'L\'assistente non può usare Claude in questa vista. Puoi usare direttamente gli strumenti dalla barra in alto.',
};

function contesto() {
  const pezzi = Object.entries(raccolti).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return pezzi.length
    ? `DATI GIÀ RACCOLTI NEI TURNI PRECEDENTI (passati agli strumenti; riusali e aggiornali, non richiederli):\n${pezzi.join('\n')}`
    : 'Nessun dato raccolto finora.';
}

const NASCONDI = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'tools_unavailable'];

// Le istruzioni vanno nel primo turno della persona: sample non ha un
// messaggio di sistema, e i turni devono iniziare e finire con la persona.
function preparaInput() {
  let ultimi = turni.slice(-MAX_TURNI);
  while (ultimi.length && ultimi[0].role !== 'user') ultimi = ultimi.slice(1);
  const [primo, ...resto] = ultimi;
  return [{ role: 'user', content: `${istruzioni(OGGI)}\n\n${contesto()}\n\nPRIMO MESSAGGIO DELLA PERSONA:\n${primo.content}` }, ...resto];
}

async function invia(testo) {
  testo = testo.trim();
  if (!testo || ctl) return;
  await avvio;
  if (!sample) return;
  aggiungiMessaggio('tu', testo);
  turni.push({ role: 'user', content: testo });
  $('#domanda').value = '';
  corrente = aggiungiMessaggio('ai', '');
  corrente.querySelector('.testo').innerHTML = '<p class="stato">Sto pensando…</p>';
  ctl = new AbortController();
  $('#ferma').hidden = false;
  $('#invia').disabled = true;
  try {
    const { text, truncated } = await sample(preparaInput(), {
      tools: strumenti,
      signal: ctl.signal,
      modelTier: 'default',
      onText: ({ text: t }) => { corrente.querySelector('.testo').innerHTML = md(t); corrente.querySelector('.stato').textContent = ''; },
    });
    corrente.querySelector('.testo').innerHTML = md(text);
    corrente.querySelector('.stato').textContent = truncated ? 'Risposta interrotta per lunghezza: chiedimi di continuare.' : '';
    turni.push({ role: 'assistant', content: text });
  } catch (e) {
    const codice = e?.code || 'upstream_error';
    const parziale = codice === 'refused' ? '' : e?.text;
    if (parziale) {
      corrente.querySelector('.testo').innerHTML = md(parziale);
      turni.push({ role: 'assistant', content: parziale });
    } else {
      // Nessuna risposta: il messaggio torna nella casella per poterlo rimandare.
      turni.pop();
      if (!$('#domanda').value) $('#domanda').value = testo;
    }
    if (codice === 'cancelled') {
      if (parziale) corrente.querySelector('.stato').textContent = 'Interrotto.';
      else corrente.remove();
    } else {
      const avviso = ERRORI[codice] || ERRORI.upstream_error;
      if (parziale) corrente.querySelector('.stato').textContent = avviso;
      else { corrente.classList.add('errore'); corrente.querySelector('.testo').innerHTML = `<p>${esc(avviso)}</p>`; }
      if (NASCONDI.includes(codice)) { sample = null; mostraNonDisponibile(codice); }
    }
  } finally {
    ctl = null;
    $('#ferma').hidden = true;
    $('#invia').disabled = !sample;
  }
}

// ---------- Pannello: risultati, documenti, promemoria ----------

function nascondiVuoto() { $('#pannello-vuoto').hidden = true; }

function sezioneRisultato(id, html) {
  nascondiVuoto();
  let el = document.getElementById('ris-' + id);
  if (!el) {
    el = document.createElement('section');
    el.id = 'ris-' + id;
    el.className = 'pannello risultato';
    $('#risultati').prepend(el);
  }
  el.innerHTML = html;
  $$('[data-ics]', el).forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
}

const linkFonte = (f) => (f ? ` <a href="${esc(f.url)}" target="_blank" rel="noopener">fonte</a>` : '');
const calendario = (titolo, giorno, descrizione) => pulsantiCalendario({ titolo, data: giorno, descrizione }, { conIcs: !dentroClaude() });

function mostraRisultato(tipo, v) {
  if (tipo === 'prestazioni') {
    const si = v.risultati.filter((r) => r.esito === 'spetta' || r.esito === 'probabile');
    const nd = v.risultati.filter((r) => r.esito === 'manca_dato');
    sezioneRisultato('prestazioni', `
      <div class="occhiello">Mi spetta · calcolato il ${esc(new Date(v.oggi).toLocaleDateString('it-IT'))}</div>
      <h2>${si.length ? `${si.length} prestazioni, circa ${eur(v.totaleAnnuoStimato)} l'anno` : 'Nessuna prestazione ancora certa'}</h2>
      ${si.length ? `<h3>Ti spettano o probabilmente ti spettano</h3><ul>${si.map((r) => `<li><b>${esc(r.nome)}</b>: ${esc(r.importo?.testo || r.importo?.breve || r.etichetta)}${r.come?.link ? ` <a href="${esc(r.come.link)}" target="_blank" rel="noopener">come chiederla</a>` : ''}${linkFonte(r.fonti[0])}</li>`).join('')}</ul>` : ''}
      ${nd.length ? `<h3>Serve ancora un dato</h3><ul>${nd.map((r) => `<li>${esc(r.nome)}</li>`).join('')}</ul>` : ''}`);
  } else if (tipo === 'multa') {
    sezioneRisultato('multa', `
      <div class="occhiello">Faccio ricorso? · controllo della multa</div>
      <h2>${esc(v.verdetto.titolo)}</h2>
      <p>${esc(v.verdetto.testo)}</p>
      ${v.motivi.filter((m) => m.esito === 'vizio' || m.esito === 'da_provare').length ? `<h3>Motivi trovati</h3><ul>${v.motivi.filter((m) => m.esito === 'vizio' || m.esito === 'da_provare').map((m) => `<li><b>${esc(m.titolo)}</b>${m.forza ? ` (${esc(m.forza)})` : ''}: ${esc(m.spiegazione)}${linkFonte(m.fonti[0])}</li>`).join('')}</ul>` : ''}
      ${v.scadenze.length ? `<h3>Scadenze</h3><ul>${v.scadenze.map((s) => `<li><b>${esc(data(s.data).toLocaleDateString('it-IT', { timeZone: 'UTC' }))}</b> ${esc(s.titolo)}${s.scaduta ? ' (scaduta)' : calendario(s.titolo, s.data, s.testo)}</li>`).join('')}</ul>` : ''}
      ${v.costi ? `<h3>Costi</h3><ul>${v.costi.righe.map((c) => `<li><b>${esc(c.strada)}</b>: ${eur(c.costo)}${c.seRespinto ? `, se respinto ${c.id === 'gdp' ? 'fino a' : 'almeno'} ${eur(c.seRespinto)}` : ''}</li>`).join('')}</ul>` : ''}
      ${v.destinatari.prefetto ? `<p>${esc(v.destinatari.prefetto.nome)}, PEC ${esc(v.destinatari.prefetto.pec)}</p>` : ''}`);
  } else if (tipo === 'accesso') {
    sezioneRisultato('accesso', `
      <div class="occhiello">Chiedo gli atti · ${esc(v.ente?.nome || 'ente da scegliere')}</div>
      <h2>${esc(v.tipo.nome)}</h2>
      <p>${esc(v.fase.titolo)}. ${esc(v.fase.testo)}</p>
      ${v.ente ? `<p>PEC dell'ente: ${esc(v.ente.pec)}${v.ente.sito ? ` · <a href="https://${esc(v.ente.sito)}" target="_blank" rel="noopener">sito</a>` : ''}</p>` : ''}
      ${v.scadenze.filter((s) => s.data).length ? `<h3>Scadenze</h3><ul>${v.scadenze.filter((s) => s.data).map((s) => `<li><b>${esc(data(s.data).toLocaleDateString('it-IT', { timeZone: 'UTC' }))}</b> ${esc(s.titolo)}${s.scaduta ? ' (passata)' : calendario(s.titolo, s.data, s.testo)}</li>`).join('')}</ul>` : ''}`);
  }
}

function disegnaDocumento() {
  if (!documento) return;
  const p = datiPersonali.leggi({});
  const html = documento.genera(p);
  nascondiVuoto();
  $('#documento').innerHTML = `
    <section class="pannello">
      <div class="occhiello">Documento</div>
      <h2>${esc(documento.titolo)}</h2>
      <p>Completa qui i tuoi dati: restano su questo dispositivo e non vengono mandati all'assistente.</p>
      <div class="dati-personali">${PERSONALI.map(([id, et]) => `<label>${esc(et)}<input type="text" id="p-${id}" value="${esc(p[id] || '')}" autocomplete="off"></label>`).join('')}</div>
      <div class="foglio" id="foglio">${html}</div>
      <div class="azioni-doc">
        <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
        <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
        ${documento.pec ? `<a class="btn" href="${esc(mailto(documento.pec, documento.oggetto, testoDa(html)))}">Apri nel programma di posta</a>` : ''}
        <span class="esito-copia" id="esito-copia" role="status"></span>
      </div>
    </section>`;
  PERSONALI.forEach(([id]) => $('#p-' + id).addEventListener('input', (e) => {
    const nuovi = { ...datiPersonali.leggi({}), [id]: e.target.value };
    datiPersonali.scrivi(nuovi);
    $('#foglio').innerHTML = documento.genera(nuovi);
  }));
  $('#copia').addEventListener('click', () => copia(testoDa($('#foglio').innerHTML), $('#esito-copia')));
  $('#stampa').addEventListener('click', () => stampa($('#foglio').innerHTML));
}

function mostraPromemoria(p) {
  nascondiVuoto();
  let box = $('#promemoria .pannello');
  if (!box) {
    $('#promemoria').innerHTML = '<section class="pannello"><div class="occhiello">Promemoria</div><h2>Scadenze da segnare</h2><ul class="lista-promemoria" style="margin:6px 0 0;padding-left:18px;display:grid;gap:8px"></ul></section>';
    box = $('#promemoria .pannello');
  }
  const chiave = `${p.data}|${p.titolo}`;
  if ($$('.lista-promemoria li', box).some((x) => x.dataset.chiave === chiave)) return;
  const li = document.createElement('li');
  li.dataset.chiave = chiave;
  li.innerHTML = `<b>${esc(data(p.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }))}</b> ${esc(p.titolo)}${calendario(p.titolo, p.data, p.descrizione)}`;
  $('.lista-promemoria', box).appendChild(li);
  $$('[data-ics]', li).forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
}

const strumenti = creaStrumenti({
  mostraRisultato(tipo, v) {
    if (v.risposte) raccolti[tipo === 'multa' ? 'risposte_multa' : 'risposte_accesso'] = v.risposte.ente ? { ...v.risposte, ente: undefined, ente_nome: v.risposte.ente.nome } : v.risposte;
    mostraRisultato(tipo, v);
  },
  mostraDocumento(d) { documento = d; disegnaDocumento(); },
  mostraPromemoria,
  progresso(t) { if (corrente) corrente.querySelector('.stato').textContent = t; },
});
// Le risposte di Mi spetta arrivano già pulite: le teniamo per i turni successivi.
const valutaPrestazioni = strumenti.find((s) => s.name === 'valuta_prestazioni');
const eseguiPrestazioni = valutaPrestazioni.execute;
valutaPrestazioni.execute = (input, c) => { raccolti.risposte_prestazioni = input.risposte; return eseguiPrestazioni(input, c); };

// ---------- Avvio ----------

function mostraNonDisponibile(codice) {
  const el = $('#non-disponibile');
  const link = 'usa direttamente <a href="../mi-spetta/" data-strumento="mi-spetta">Mi spetta</a>, <a href="../faccio-ricorso/" data-strumento="faccio-ricorso">Faccio ricorso?</a> e <a href="../chiedo-gli-atti/" data-strumento="chiedo-gli-atti">Chiedo gli atti</a>: fanno gli stessi calcoli, con un modulo da compilare.';
  const perche = !codice
    ? 'L\'assistente conversazionale funziona quando questa pagina è aperta dentro Claude, sul sito claude.ai o nell\'app, perché usa Claude con il tuo account.'
    : codice === 'tools_unavailable'
      ? 'Questa versione dell\'app di Claude non permette all\'assistente di usare i suoi strumenti di calcolo, e senza di loro preferisce non rispondere. Aggiorna l\'app.'
      : 'L\'assistente non può usare Claude da questa pagina: il permesso non è stato dato o non è disponibile per il tuo account.';
  el.hidden = false;
  el.innerHTML = `${perche} Intanto ${link}`;
  $('#invia').disabled = true;
  $('#domanda').placeholder = 'L\'assistente non è disponibile in questa vista.';
  aggiornaLinkFamiglia(el);
}

// Nella versione pubblicata su claude.ai i link tra strumenti vengono riscritti
// verso gli indirizzi pubblicati; qui riusiamo quelli della barra in alto.
function aggiornaLinkFamiglia(el) {
  $$('a[data-strumento]', el).forEach((a) => {
    const nav = document.querySelector(`nav.famiglia a[data-strumento="${a.dataset.strumento}"]`);
    if (nav) { a.href = nav.href; if (nav.target) a.target = nav.target; }
  });
}

$('#scrivi').addEventListener('submit', (e) => { e.preventDefault(); invia($('#domanda').value); });
$('#domanda').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); invia($('#domanda').value); } });
$('#ferma').addEventListener('click', () => ctl?.abort());
$('#nuova').addEventListener('click', () => {
  ctl?.abort();
  turni = [];
  for (const k of Object.keys(raccolti)) delete raccolti[k];
  documento = null;
  $('#messaggi').querySelectorAll('.msg').forEach((m, i) => { if (i > 0) m.remove(); });
  $('#risultati').innerHTML = ''; $('#documento').innerHTML = ''; $('#promemoria').innerHTML = '';
  $('#pannello-vuoto').hidden = false;
  $('#domanda').focus();
});
$('#cancella').addEventListener('click', () => { datiPersonali.cancella(); disegnaDocumento(); });
$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => invia(b.dataset.esempio)));

const avvio = (async () => {
  const s = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('sample') : null;
  if (!s) { mostraNonDisponibile(); return; }
  // Se la pagina gira dentro Claude ma senza strumenti, l'assistente non risponde:
  // senza i motori di regole dovrebbe inventare cifre e scadenze.
  const limiti = await s.limits().catch(() => null);
  if (!limiti?.tools) { mostraNonDisponibile('tools_unavailable'); return; }
  sample = s;
})();
