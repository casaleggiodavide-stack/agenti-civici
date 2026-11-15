// Interfaccia di «Chi ti rappresenta». Tutto gira nel browser: il Comune che scrivi non esce da qui
// (resta solo sul tuo dispositivo, per ritrovarlo la prossima volta).
import { $, $$, esc, archivio } from '../src/comune/interfaccia.js';
import { indicizza, cerca, rappresentanti, dataLunga, VERIFICATO } from '../src/regole.js';

const memoria = archivio('eletti-v1');
let indice = null;
const json = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const carica = async () => {
  if (!indice) { const [c, n] = await Promise.all([json('dati/comuni.json'), json('dati/nazionale.json')]); indice = indicizza(c, n, {}); }
  return indice;
};
const caricaProvincia = async (sigla) => { if (!indice.province[sigla]) indice.province[sigla] = await json(`dati/p/${encodeURIComponent(sigla)}.json`); };
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;

// ---------- la ricerca del Comune ----------

$('#questionario').innerHTML = `
  <section class="sezione" id="s-comune">
    <h2>Il tuo Comune</h2>
    <div class="domanda cerca-ente">
      <label for="cerca-comune">Scrivi il nome del Comune dove voti</label>
      <input type="text" id="cerca-comune" placeholder="es. Treviso, Bari, San Giovanni in Persiceto" autocomplete="off" aria-controls="risultati-comuni" enterkeyhint="search">
      <ul class="risultati-enti" id="risultati-comuni" hidden></ul>
    </div>
    <p class="aiuto">Se ci sono più Comuni con lo stesso nome, aggiungi la sigla della provincia: «Castro LE».</p>
  </section>`;
const campo = $('#cerca-comune'), lista = $('#risultati-comuni');
const largo = document.createElement('div');
largo.id = 'livelli';
largo.setAttribute('aria-live', 'polite');
$('main.corpo').after(largo);

let attesa, trovati = [];
campo.addEventListener('focus', () => { carica().catch(() => {}); });
campo.addEventListener('input', () => { clearTimeout(attesa); attesa = setTimeout(suggerisci, 120); });
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
      ? trovati.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.nome)}<small>${esc(`${r.sigla} · ${r.regioneNome}`)}</small></button></li>`).join('')
      : '<li><button type="button" disabled>Nessun Comune con questo nome: controlla come è scritto.</button></li>';
    $$('[data-i]', lista).forEach((b) => b.addEventListener('click', () => scegli(trovati[Number(b.dataset.i)])));
  } catch {
    lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
  }
}

async function scegli(riga, scorri = true) {
  lista.hidden = true;
  campo.value = `${riga.nome} (${riga.sigla})`;
  memoria.scrivi({ istat: riga.istat });
  $('#esito').innerHTML = '<section class="pannello"><p>Carico i dati della provincia…</p></section>';
  try {
    await caricaProvincia(riga.sigla);
    mostra(rappresentanti(indice, riga.istat), scorri);
  } catch {
    $('#esito').innerHTML = '<section class="pannello" data-tono="forse"><p>Non riesco a caricare i dati di questa provincia. Riprova tra poco.</p></section>';
  }
}

// ---------- l'esito ----------

const link = (url, testo, cls = 'link') => (url ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(testo)}</a>` : '');
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const data = (iso) => (iso ? `<time datetime="${esc(iso)}">${esc(dataLunga(iso))}</time>` : '—');

function contatti(ente, etichetta = '') {
  if (!ente) return '';
  const parti = [
    ente.pec && `<span>PEC${etichetta}: <b>${esc(ente.pec)}</b></span>`,
    ente.sito && link(ente.sito, `Sito ufficiale${etichetta}`),
  ].filter(Boolean);
  return parti.length ? `<p class="contatti">${parti.join('')}</p>` : '';
}

let tabelle = [];
function tabella(gruppo, parlamento) {
  const id = tabelle.length;
  tabelle.push(gruppo.persone);
  if (!gruppo.persone.length) return `<h3>${esc(gruppo.titolo)}</h3><p class="nota">Nessuna persona in carica nei dati.</p>`;
  const testa = `<tr>
    <th scope="col" data-k="nome"><button type="button">Nome</button></th>
    <th scope="col" data-k="ruolo"><button type="button">Ruolo</button></th>
    <th scope="col" data-k="elezione"><button type="button">Eletto/a il</button></th>
    <th scope="col" data-k="inCarica"><button type="button">In carica dal</button></th>
    ${parlamento ? '<th scope="col">Scheda</th>' : ''}</tr>`;
  return `<h3>${esc(gruppo.titolo)}</h3><div class="scorri"><table class="persone" data-t="${id}" data-parlamento="${parlamento ? 1 : 0}"><thead>${testa}</thead><tbody>${righe(gruppo.persone, parlamento)}</tbody></table></div>`;
}
function righe(persone, parlamento) {
  return persone.map((p) => `<tr><td class="chi">${esc(p.nome)}</td><td data-l="Ruolo">${esc(p.ruolo)}</td><td class="d" data-l="Eletto/a il">${data(p.elezione)}</td><td class="d" data-l="In carica dal">${data(p.inCarica)}</td>${parlamento ? `<td data-l="Scheda">${link(p.scheda, 'Scheda ufficiale')}</td>` : ''}</tr>`).join('');
}
function attivaOrdinamento(radice) {
  $$('table.persone', radice).forEach((t) => {
    const persone = tabelle[Number(t.dataset.t)];
    $$('th button', t).forEach((b) => b.addEventListener('click', () => {
      const th = b.closest('th'), k = th.dataset.k;
      const verso = th.getAttribute('aria-sort') === 'ascending' ? -1 : 1;
      $$('th', t).forEach((x) => x.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', verso > 0 ? 'ascending' : 'descending');
      const ordinate = [...persone].sort((a, x) => String(a[k] || '').localeCompare(String(x[k] || ''), 'it') * verso);
      $('tbody', t).innerHTML = righe(ordinate, t.dataset.parlamento === '1');
    }));
  });
}

function mostra(e, scorri = true) {
  tabelle = [];
  if (e.errore) { $('#esito').innerHTML = `<section class="pannello" data-tono="forse"><p>${esc(e.errore)}</p></section>`; largo.innerHTML = ''; return; }
  const com = e.livelli[0];
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${com.stato === 'commissariato' ? 'forse' : 'si'}">
      <p class="occhiello">${esc(`${e.comune.nome} · ${e.comune.sigla} · ${e.comune.regioneNome}`)}</p>
      <p class="titolo">Chi ti rappresenta a ${esc(e.comune.nome)}</p>
      ${com.stato === 'commissariato' ? '<p>Il Comune è guidato da una gestione commissariale.</p>' : ''}
      <ul class="indice-livelli">${e.livelli.map((l) => `<li><a href="#l-${l.id}">${esc(l.titolo)}</a></li>`).join('')}</ul>
      <p class="aiuto">Amministratori locali e regionali aggiornati al ${esc(dataLunga(e.aggiornato))}. In ordine di carica e poi di cognome; liste e gruppi come li scrive la fonte.</p>
    </section>`;
  largo.innerHTML = e.livelli.map((l) => {
    const parl = ['camera', 'senato', 'europa'].includes(l.id);
    return `<section class="pannello livello" id="l-${l.id}" aria-labelledby="t-${l.id}" ${l.stato === 'serve-dato' ? 'data-tono="forse"' : ''}>
      <p class="occhiello">${esc({ comune: 'Comune', provincia: l.tipo === 'citta-metropolitana' ? 'Città metropolitana' : l.tipo === 'provincia-autonoma' ? 'Provincia autonoma' : 'Provincia', regione: 'Regione', camera: 'Parlamento', senato: 'Parlamento', europa: 'Unione europea' }[l.id])}${l.stato === 'commissariato' ? ' · commissariato' : ''}</p>
      <h2 id="t-${l.id}">${esc(l.titolo)}</h2>
      ${contatti(l.ente)}${l.consiglio ? contatti(l.consiglio, ' del Consiglio') : ''}
      ${l.gruppi.map((g) => tabella(g, parl)).join('')}
      ${l.voto ? `<div class="voto"><b>Quando si vota.</b> ${esc(l.voto.testo)}${l.voto.fonti.length ? `<small>${l.voto.fonti.map(fonte).join(' · ')}</small>` : ''}</div>` : ''}
      ${l.nota ? `<p class="nota">${esc(l.nota)}</p>` : ''}
    </section>`;
  }).join('') + `
    <section class="pannello" id="come-fare" aria-labelledby="t-come">
      <p class="occhiello">Farsi sentire</p>
      <h2 id="t-come">Come contattarli, una petizione, un'interrogazione</h2>
      <ol class="passi">${e.comeFare.map((c) => `<li><b>${esc(c.titolo)}.</b> ${esc(c.testo)}${c.fonti.length ? `<small> ${c.fonti.map(fonte).join(' · ')}</small>` : ''}</li>`).join('')}</ol>
      <p class="azioni-doc"><a class="btn" href="${esc(altroStrumento('chiedo-gli-atti'))}">Chiedi un documento all'ente</a><a class="btn" href="${esc(altroStrumento('raccolte-firme'))}">Raccolte firme in corso</a><a class="btn" href="${esc(altroStrumento('bilancio-comune'))}#istat=${esc(e.comune.istat)}">Il bilancio del tuo Comune</a></p>
    </section>
    <p class="fonti">Fonti: ${Object.values(e.fonti).map((f) => `${link(f.url, f.titolo)}${f.licenza ? ` (${esc(f.licenza)})` : ''}${f.aggiornato ? `, aggiornato al ${esc(dataLunga(f.aggiornato))}` : f.letto ? `, letto il ${esc(dataLunga(f.letto))}` : ''}`).join('; ')}. Regole verificate il ${esc(dataLunga(VERIFICATO))}. Un dato sbagliato? ${link(`https://github.com/casaleggiodavide-stack/agenti-civici/issues/new?title=${encodeURIComponent(`Chi ti rappresenta: dato da correggere per ${e.comune.nome} (${e.comune.sigla})`)}`, 'Segnalalo')} (serve un account GitHub).</p>`;
  attivaOrdinamento(largo);
  if (scorri) $('#esito').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

// ---------- esempi, memoria ----------

$$('[data-esempio]').forEach((b) => b.addEventListener('click', async () => {
  const idx = await carica();
  const r = cerca(idx, b.dataset.esempio, 1)[0];
  if (r) scegli(r);
}));
$('#esci-esempio')?.addEventListener('click', () => { campo.value = ''; $('#esito').innerHTML = ''; largo.innerHTML = ''; campo.focus(); });
$('#cancella')?.addEventListener('click', () => { memoria.cancella(); campo.value = ''; $('#esito').innerHTML = ''; largo.innerHTML = ''; });

// Apertura diretta da un altro strumento: #istat=026086 (l'ancora non arriva al server)
(async () => {
  const ancora = /(?:^|[#&])istat=(\d{6})/.exec(location.hash)?.[1];
  const ultimo = ancora ? { istat: ancora } : memoria.leggi({});
  if (ultimo?.istat) {
    const idx = await carica();
    const r = idx.righe.find((x) => x.istat === ultimo.istat);
    if (r) scegli(r, false);
  }
})().catch(() => {});
