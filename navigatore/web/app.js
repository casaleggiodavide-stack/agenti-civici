// Interfaccia del «Navigatore dei servizi». Tutto gira nel browser.

import { $, $$, esc } from '../src/comune/interfaccia.js';
import { pulsantiCalendario, incorporata } from '../src/comune/calendario.js';
import { cerca, perCategoria, trova } from '../src/cerca.js';
import { VERIFICATO, COLLEGATI, CATEGORIE } from '../src/pratiche.js';

const campo = $('#domanda');
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;
const data = (iso) => new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

// ---------- Elenco per argomento ----------

$('#argomenti').innerHTML = perCategoria().map((c) => `<section class="argomento">
  <h3>${esc(c.nome)}</h3>
  <ul>${c.pratiche.map((p) => `<li><button type="button" class="link" data-pratica="${esc(p.id)}">${esc(p.titolo)}</button></li>`).join('')}</ul>
</section>`).join('');

// ---------- Ricerca ----------

let attesa;
campo.addEventListener('input', () => {
  clearTimeout(attesa);
  attesa = setTimeout(() => mostraRisultati(campo.value), 120);
});
$('#cerca').addEventListener('submit', (e) => {
  e.preventDefault();
  const r = cerca(campo.value, 1);
  if (r[0]) apri(r[0].pratica.id);
  else mostraRisultati(campo.value);
});

function mostraRisultati(q) {
  const box = $('#risultati');
  if (q.trim().length < 3) { box.hidden = true; return; }
  const r = cerca(q);
  box.hidden = false;
  box.innerHTML = r.length
    ? `<p class="occhiello">Forse cerchi</p><ul>${r.map(({ pratica: p }) => `<li><button type="button" data-pratica="${esc(p.id)}"><b>${esc(p.titolo)}</b><small>${esc(p.dove || '')}</small></button></li>`).join('')}</ul>`
    : `<p>Non ho una scheda verificata per questa domanda. Prova con altre parole, guarda l'elenco per argomento qui sotto, oppure chiedi al <a href="${esc(altroStrumento('assistente'))}">Polpo</a>, che ti dice almeno a quale ufficio rivolgerti.</p>`;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-pratica]');
  if (!b) return;
  $('#risultati').hidden = true;
  apri(b.dataset.pratica);
});

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => { campo.value = b.dataset.esempio; mostraRisultati(campo.value); const r = cerca(campo.value, 1); if (r[0]) apri(r[0].pratica.id); }));

// ---------- Scheda ----------

const ONLINE = { si: ['Si fa online', 'si'], parziale: ['In parte online', 'forse'], no: ['Di persona', 'neutro'] };

function apri(id) {
  const p = trova(id);
  if (!p) return;
  const [onlineTesto, onlineTono] = ONLINE[p.online?.stato] || ONLINE.no;
  const collegati = (p.collegati || []).map((k) => COLLEGATI[k]).filter(Boolean);
  $('#scheda').innerHTML = `
  <article class="pannello scheda" aria-labelledby="t-pratica">
    <div class="occhiello">${esc(CATEGORIE[p.categoria]?.nome || '')}</div>
    <h2 id="t-pratica" tabindex="-1">${esc(p.titolo)}</h2>
    <p class="chi">${esc(p.chi || '')}</p>
    <div class="fatti">
      <div><span>Dove</span><b>${esc(p.dove || '—')}</b></div>
      <div><span>Come</span><b><span class="pill p-${onlineTono}">${onlineTesto}</span></b>${p.online?.url ? `<a class="btn btn-primario" href="${esc(p.online.url)}" target="_blank" rel="noopener">Vai al servizio ufficiale</a>` : ''}${p.online?.note ? `<small>${esc(p.online.note)}</small>` : ''}</div>
      <div><span>Quanto costa</span><b>${esc(p.costo || 'Non indicato dalle fonti ufficiali')}</b></div>
      <div><span>Quanto ci vuole</span><b>${esc(p.tempi || 'Non indicato dalle fonti ufficiali')}</b></div>
    </div>
    ${p.scadenze ? `<div class="scadenza"><b>Da non dimenticare.</b> ${esc(p.scadenze)}</div>` : ''}
    <div class="due">
      <section><h3>I passi</h3><ol class="passi">${(p.passi || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>
      <section><h3>Cosa serve</h3><ul class="documenti">${(p.documenti || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
    </div>
    ${p.attenzione?.length ? `<div class="attenzione"><b>Attenzione</b><ul>${p.attenzione.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    ${collegati.length ? `<div class="collegati">${collegati.map((c) => `<a class="btn" href="${esc(altroStrumento(c.strumento))}">${esc(c.testo)}</a>`).join('')}</div>` : ''}
    ${p.promemoria ? `<p class="promemoria"><b>Promemoria.</b> ${esc(p.promemoria.testo)} ${pulsantiCalendario({ titolo: p.promemoria.titolo, data: p.promemoria.data, descrizione: `${p.promemoria.testo} Dal Navigatore dei servizi: verifica sempre sul sito ufficiale.` }, { conIcs: !incorporata() })}</p>` : ''}
    <h3>Le fonti</h3>
    <ul class="fonti">${[...(p.fonti || []), ...(p.norme || [])].map((f) => `<li>${fonte(f)}</li>`).join('')}</ul>
    <p><small>Scheda verificata il ${data(p.verificato || VERIFICATO)} sulle pagine ufficiali. Regole e importi cambiano: prima di muoverti controlla la pagina ufficiale indicata. Non è un sito della pubblica amministrazione.</small></p>
  </article>`;
  try { history.replaceState(null, '', '#' + encodeURIComponent(id)); } catch { /* pagina incorporata */ }
  const h = $('#t-pratica');
  h.focus({ preventScroll: true });
  $('#scheda').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

const ancora = decodeURIComponent(location.hash.replace(/^#/, ''));
if (ancora && trova(ancora)) apri(ancora);
