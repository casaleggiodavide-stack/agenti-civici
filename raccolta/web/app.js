// Interfaccia di «Chi raccoglie i rifiuti?». Tutto gira nel browser: il Comune che scrivi non esce da qui
// (resta solo sul tuo dispositivo, per ritrovarlo la prossima volta).
import { $, $$, esc, archivio } from '../src/comune/interfaccia.js';
import { indicizza, cerca, scheda, DIRITTI } from '../src/regole.js';

const memoria = archivio('raccolta-v1');
let indice = null;
const carica = async () => (indice ||= indicizza((await import('../src/dati/raccolta.js')).default));
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;

// ---------- la ricerca del Comune ----------

$('#questionario').innerHTML = `
  <section class="sezione" id="s-comune">
    <h2>Il tuo Comune</h2>
    <div class="domanda cerca-ente">
      <label for="cerca-comune">Scrivi il nome del Comune</label>
      <input type="text" id="cerca-comune" placeholder="es. Treviso, Bari, San Giovanni in Persiceto" autocomplete="off" aria-controls="risultati-comuni" enterkeyhint="search">
      <ul class="risultati-enti" id="risultati-comuni" hidden></ul>
    </div>
    <p class="aiuto">Se ci sono più Comuni con lo stesso nome, aggiungi la sigla della provincia: «Castro LE».</p>
  </section>`;
const campo = $('#cerca-comune'), lista = $('#risultati-comuni');

let attesa, trovati = [];
campo.addEventListener('focus', () => { carica().catch(() => {}); });
campo.addEventListener('input', () => {
  clearTimeout(attesa);
  attesa = setTimeout(suggerisci, 120);
});
campo.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); if (trovati[0]) scegli(trovati[0]); }
  if (e.key === 'ArrowDown') { e.preventDefault(); $('button', lista)?.focus(); }
});

async function suggerisci() {
  const q = campo.value;
  if (q.trim().length < 2) { lista.hidden = true; return; }
  lista.hidden = false;
  if (!indice) lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco dei Comuni…</button></li>';
  try {
    trovati = cerca(await carica(), q, 8);
    lista.innerHTML = trovati.length
      ? trovati.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.nome)}<small>${esc(`${r.sigla} · ${r.regione}`)}</small></button></li>`).join('')
      : '<li><button type="button" disabled>Nessun Comune con questo nome: controlla come è scritto.</button></li>';
    $$('[data-i]', lista).forEach((b) => b.addEventListener('click', () => scegli(trovati[Number(b.dataset.i)])));
  } catch {
    lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
  }
}

function scegli(riga) {
  lista.hidden = true;
  campo.value = `${riga.nome} (${riga.sigla})`;
  memoria.scrivi({ istat: riga.istat });
  mostra(scheda(indice, riga));
}

// ---------- l'esito ----------

const link = (url, testo, cls = 'btn') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(testo)}</a>`;
const tel = (t) => `<a class="btn" href="tel:${esc(t.replace(/[^\d+]/g, ''))}">📞 ${esc(t)}</a>`;

function mostra(s, scorri = true) {
  const g = s.gestori;
  const nomi = g.map((x) => x.nome);
  const a = /^[Aa]/.test(s.comune) ? 'Ad' : 'A';
  const titolo = !g.length ? `Per ${s.comune} l'Autorità non indica un gestore` : g.length === 1 ? `${a} ${s.comune} raccoglie i rifiuti ${nomi[0]}` : `${a} ${s.comune} raccolgono i rifiuti ${nomi.slice(0, -1).join(', ')} e ${nomi.at(-1)}`;
  const schede = g.map((x) => `
    <div class="gestore">
      <p class="occhiello">${x.inEconomia ? 'Gestione diretta del Comune' : 'Gestore della raccolta'}</p>
      <h3>${esc(x.nome)}</h3>
      <div class="azioni-doc">
        ${x.calendario ? link(x.calendario, '🗓️ Il calendario della raccolta', 'btn btn-primario') : ''}
        ${x.sito ? link(x.sito, x.calendario ? 'Il sito' : 'Il sito del gestore', x.calendario ? 'btn' : 'btn btn-primario') : ''}
        ${x.telefono ? tel(x.telefono) : ''}
      </div>
      ${x.calendario ? '<p class="aiuto">Pagina trovata in automatico sul sito del gestore: se è sbagliata, segnalalo qui sotto.</p>' : ''}
      ${!x.sito && x.inEconomia && s.sitoComune ? `<div class="azioni-doc">${link(s.sitoComune, 'Il sito del Comune')}</div>` : ''}
    </div>`).join('');
  const senzaCalendario = !g.some((x) => x.calendario);
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${g.length ? 'si' : 'forse'}">
      <p class="occhiello">${esc(`${s.comune} · ${s.provincia} · ${s.regione}`)}</p>
      <p class="titolo">${esc(titolo)}</p>
      ${g.length > 1 ? '<p>L\'Autorità ne indica più di uno: di solito uno raccoglie porta a porta e un altro gestisce i centri di raccolta, oppure è in corso un cambio di gestore.</p>' : ''}
      ${!g.length ? `<p>Chiedi al Comune chi fa il servizio${s.pecComune ? `: la PEC è <b>${esc(s.pecComune)}</b>` : ''}.</p>` : ''}
      ${schede}
      ${senzaCalendario ? `<p>Non abbiamo trovato la pagina del calendario. ${link(s.cercaCalendario, 'Cercala sul web', 'link')}, oppure guarda l'avviso della TARI: almeno una volta l'anno deve riportare il calendario o dove trovarlo.</p>` : ''}
      ${s.pecComune ? `<p class="aiuto">Per la TARI (importi, rate, rimborsi) di solito risponde il Comune: PEC ${esc(s.pecComune)}${s.sitoComune ? ` · ${link(s.sitoComune, 'sito del Comune', 'link')}` : ''}.</p>` : ''}
    </section>

    <section class="pannello">
      <h2>Cosa deve garantirti</h2>
      <ul class="controlli">${DIRITTI.map((d) => `<li class="c-si"><span class="segno" aria-hidden="true">✓</span><div><b>${esc(d.titolo)}.</b> ${esc(d.testo)}<small><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.fonte)}</a></small></div></li>`).join('')}</ul>
      <p class="azioni-doc"><a class="btn" href="${esc(altroStrumento('reclami-pa'))}">Il servizio non funziona? Scrivi un reclamo</a><a class="btn" href="../giochi/differenzia/">Dove va un rifiuto? Le regole e il gioco</a></p>
    </section>

    <p class="fonti">Gestore: ${link(indice.fonti.arera.url, indice.fonti.arera.titolo, 'link')}${indice.aggiornato ? `, letta il ${esc(new Date(indice.aggiornato).toLocaleDateString('it-IT'))}` : ''}. PEC: ${link(indice.fonti.ipa.url, 'IndicePA', 'link')}. Un dato sbagliato? ${link(s.segnala, 'Segnalalo', 'link')} (serve un account GitHub).</p>`;
  if (scorri) $('#esito').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

// ---------- esempi, memoria, foto ----------

$$('[data-esempio]').forEach((b) => b.addEventListener('click', async () => {
  const idx = await carica();
  const r = cerca(idx, b.dataset.esempio, 1)[0];
  if (r) { campo.value = `${r.nome} (${r.sigla})`; lista.hidden = true; mostra(scheda(idx, r)); }
}));
$('#cancella')?.addEventListener('click', () => { memoria.cancella(); campo.value = ''; $('#esito').innerHTML = ''; });

(async () => {
  const ultimo = memoria.leggi({});
  if (ultimo?.istat) {
    const idx = await carica();
    const r = idx.righe.find((x) => x.istat === ultimo.istat);
    if (r) { campo.value = `${r.nome} (${r.sigla})`; mostra(scheda(idx, r), false); }
  }
})().catch(() => {});

