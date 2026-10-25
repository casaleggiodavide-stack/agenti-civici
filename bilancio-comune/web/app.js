// Interfaccia di «Il bilancio del mio Comune». Tutto gira nel browser:
// l'elenco dei Comuni e le schede di una provincia si caricano solo quando servono.

import { $, $$, esc } from '../src/comune/interfaccia.js';
import { caricaJSON, cercaIn, euroParole, euroTondi, percento, numeroIt, rispettoA, leggiAncora, scriviAncora } from '../src/comune/schede.js';
import { FONTI, GLOSSARIO, controlli, ripartizione, entrate, servizi, VERIFICATO } from '../src/spiegazioni.js';

const DATI = new URL('../dati/', import.meta.url);
const elenco = () => caricaJSON(new URL('comuni.json', DATI));
const confronto = () => caricaJSON(new URL('confronto.json', DATI));
const provincia = (sigla) => caricaJSON(new URL(`p/${sigla}.json`, DATI));

const SEGNI = { si: ['c-si', '✓'], forse: ['c-att', '!'], no: ['c-no', '✕'], dato: ['c-nd', '?'] };
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;

// ---------- Ricerca ----------

let attesa;
const campo = $('#cerca-comune');
const lista = $('#risultati-comuni');
campo.addEventListener('focus', () => { elenco().catch(() => {}); });
campo.addEventListener('input', () => {
  clearTimeout(attesa);
  attesa = setTimeout(async () => {
    const q = campo.value;
    if (q.trim().length < 2) { lista.hidden = true; return; }
    lista.hidden = false;
    lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco dei Comuni…</button></li>';
    try {
      const { comuni } = await elenco();
      const trovati = cercaIn(comuni, q, { testoDi: (c) => `${c.nome} ${c.sigla}`, nomeDi: (c) => c.nome, pesoDi: (c) => Math.log10((c.pop || 1) + 1) / 2 });
      lista.innerHTML = trovati.length
        ? trovati.map((c) => `<li><button type="button" data-istat="${c.istat}">${esc(c.nome)} <small>${esc(c.sigla.startsWith('P') ? '' : `(${c.sigla}) · `)}${c.pop ? `${numeroIt(c.pop)} abitanti` : ''}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessun Comune trovato: controlla il nome.</button></li>';
      $$('[data-istat]', lista).forEach((b) => b.addEventListener('click', () => { lista.hidden = true; campo.value = ''; apri(b.dataset.istat); }));
    } catch {
      lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
    }
  }, 120);
});

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => apri(b.dataset.esempio)));

// ---------- Scheda ----------

async function apri(istat) {
  const box = $('#scheda');
  box.innerHTML = '<section class="pannello"><p>Carico il bilancio…</p></section>';
  try {
    const { comuni } = await elenco();
    const voce = comuni.find((c) => c.istat === istat);
    if (!voce) { box.innerHTML = '<section class="pannello"><p>Questo Comune non ha trasmesso un rendiconto utilizzabile alla banca dati.</p></section>'; return; }
    const [schede, conf] = await Promise.all([provincia(voce.sigla), confronto()]);
    const s = schede[istat];
    const simili = s.fascia ? conf.fasce[s.fascia] : null;
    box.innerHTML = disegna(s, simili, conf);
    scriviAncora({ istat });
    attivaOrdinamento();
    box.querySelector('h2')?.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  } catch (e) {
    box.innerHTML = `<section class="pannello"><p>Non riesco a caricare i dati di questo Comune. Riprova tra poco.</p><p><small>${esc(e.message)}</small></p></section>`;
  }
}

function disegna(s, simili, conf) {
  const rip = ripartizione(s, simili);
  const ent = entrate(s);
  const pc = s.pop ? s.spesa_tot / s.pop : null;
  const conf1 = rispettoA(pc, simili?.spesa_pc);
  const inv = s.pop ? s.investimenti / s.pop : null;
  const nSimili = simili?.comuni ? `${numeroIt(simili.comuni)} Comuni ${s.fascia}` : '';
  return `
  <section class="pannello" aria-labelledby="t-comune">
    <div class="occhiello">Rendiconto ${s.anno} · ${esc(s.provincia)} · ${esc(s.regione)}</div>
    <h2 id="t-comune" tabindex="-1">Comune di ${esc(s.nome)}</h2>
    <p>Nel ${s.anno} il Comune si è impegnato a spendere <b>${euroParole(s.spesa_tot)}</b> per i servizi e le opere${pc ? `, cioè <b>${euroTondi(pc)} per abitante</b>` : ''}${conf1 ? `: ${conf1.tono === 'pari' ? 'in linea con' : conf1.parola + ' rispetto al'} valore tipico dei Comuni della stessa grandezza (${euroTondi(simili.spesa_pc)})` : ''}.</p>
    <div class="cifre">
      <div><b>${s.pop ? numeroIt(s.pop) : '—'}</b><span>abitanti al 1° gennaio 2025</span></div>
      <div><b>${euroTondi(pc)}</b><span>spesa per abitante${simili ? ` · tipico ${euroTondi(simili.spesa_pc)}` : ''}</span></div>
      <div><b>${euroTondi(inv)}</b><span>investimenti per abitante${simili ? ` · tipico ${euroTondi(simili.investimenti_pc)}` : ''}</span></div>
      <div><b>${s.risultato?.libera !== undefined ? euroParole(s.risultato.libera) : '—'}</b><span>${s.risultato?.libera < 0 ? 'disavanzo' : 'avanzo libero'} a fine anno</span></div>
    </div>
    ${nSimili ? `<p><small>«Tipico» è la mediana dei ${nSimili}: metà spende di più, metà di meno.</small></p>` : ''}
  </section>

  <div class="due">
    <section class="pannello" aria-labelledby="t-spesa">
      <div class="occhiello">Spesa impegnata, per finalità</div>
      <h2 id="t-spesa">Per cosa spende, su 100 euro</h2>
      <ul class="barre">${rip.righe.map((r) => barra(r.nome, r.su100, r.pc, r.pcSimili, r.dentro, rip.righe[0].su100)).join('')}</ul>
      <div class="legenda"><span><i></i>su 100 euro di spesa</span>${simili ? '<span><i class="r"></i>dove starebbe con la spesa per abitante tipica</span>' : ''}</div>
      <ul class="fonti"><li>${fonte(FONTI.missioni)}</li></ul>
    </section>

    <section class="pannello verdetto" aria-labelledby="t-conti" data-tono="${tonoComplessivo(controlli(s, simili))}">
      <div class="occhiello">Controlli sui conti del ${s.anno}</div>
      <h2 id="t-conti">I conti sono in ordine?</h2>
      <ul class="controlli">${controlli(s, simili).map((c) => {
        const [cls, segno] = SEGNI[c.tono];
        return `<li class="${cls}"><span class="segno" aria-hidden="true">${segno}</span><div><b>${esc(c.titolo)}</b><small>${esc(c.testo)} ${fonte(c.fonte)}</small></div></li>`;
      }).join('')}</ul>
      <p><small>Sono gli stessi indicatori che il Comune calcola e manda allo Stato. Dissesto e riequilibrio sono dichiarati dal Consiglio comunale: l'elenco ufficiale è in ${fonte(FONTI.elenco_dissesti)}.</small></p>
    </section>
  </div>

  <section class="pannello" aria-labelledby="t-servizi">
    <div class="occhiello">Spesa per abitante, servizio per servizio</div>
    <h2 id="t-servizi">I servizi che usi</h2>
    <p>Quanto ha impegnato il Comune per ogni abitante, accanto al valore tipico dei Comuni della stessa grandezza. Una spesa più alta può voler dire più servizi, costi più alti o un servizio gestito direttamente invece che da una società esterna: è una domanda da fare, non una risposta.</p>
    <div class="scorri"><table class="servizi" id="tab-servizi">
      <thead><tr><th scope="col" data-k="nome"><button type="button">Servizio</button></th><th scope="col" data-k="pc" aria-sort="descending"><button type="button">Per abitante</button></th><th scope="col" data-k="pcSimili"><button type="button">Tipico</button></th><th scope="col" data-k="diff"><button type="button">Differenza</button></th><th scope="col" data-k="impegnato"><button type="button">Totale</button></th></tr></thead>
      <tbody>${righeServizi(servizi(s, simili, conf.programmi), 'pc', -1)}</tbody>
    </table></div>
  </section>

  <div class="due">
    <section class="pannello" aria-labelledby="t-entrate">
      <div class="occhiello">Entrate accertate</div>
      <h2 id="t-entrate">Da dove arrivano i soldi</h2>
      <ul class="barre">${ent.righe.map((r) => barra(r.nome, r.su100, r.pc, simili?.entrate_pc?.[r.titolo] ?? null, r.dentro, ent.righe[0]?.su100 || 100)).join('')}</ul>
      ${s.tributi?.['0101'] && s.pop ? `<p>Imposte e tasse locali (IMU, TARI, addizionale IRPEF e simili): <b>${euroTondi(s.tributi['0101'] / s.pop)} per abitante</b>.</p>` : ''}
    </section>

    <section class="pannello" aria-labelledby="t-fare">
      <div class="occhiello">Se vuoi saperne di più</div>
      <h2 id="t-fare">Cosa puoi fare</h2>
      <ol class="passi">
        <li><b>Leggi il rendiconto ufficiale</b> nella sezione «Amministrazione trasparente», voce «Bilanci», del sito del Comune. Lì ci sono anche la relazione della Giunta e il parere dei revisori.</li>
        <li><b>Chiedi i documenti</b> che non trovi pubblicati, per esempio il contratto dei rifiuti o il dettaglio di una spesa: è un tuo diritto, gratis. <a href="${esc(altroStrumento('chiedo-gli-atti'))}">Prepara la richiesta con Chiedo gli atti</a>.</li>
        <li><b>Guarda come compra il Comune</b>: gare, affidamenti diretti, fornitori. <a href="${esc(altroStrumento('appalti'))}${s.cf ? `#cf=${esc(s.cf)}` : ''}">Apri Red flag sugli appalti</a>.</li>
        <li><b>Partecipa</b>: il rendiconto si approva in Consiglio comunale entro il 30 aprile, il bilancio di previsione entro il 31 dicembre. Le sedute sono pubbliche.</li>
      </ol>
      <dl class="glossario">${GLOSSARIO.map(([t, d, f]) => `<dt>${esc(t)}</dt><dd>${esc(d)} ${fonte(f)}</dd>`).join('')}</dl>
    </section>
  </div>
  <p><small>Dati: ${fonte(FONTI.bdap)}, rendiconto ${s.anno}; ${fonte(FONTI.istat)}. Regole verificate il ${new Date(VERIFICATO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}. Dalla spesa sono escluse le partite di giro e le anticipazioni di cassa, che non pagano servizi.</small></p>`;
}

function barra(nome, su100, pc, pcSimili, dentro, massimo) {
  const larg = Math.max(0.5, (100 * su100) / (massimo || 100));
  // il segno rosso mostra dove arriverebbe la barra con la spesa per abitante tipica
  const posSimili = pc && pcSimili ? Math.min(100, (larg * pcSimili) / pc) : null;
  const c = rispettoA(pc, pcSimili);
  return `<li><div class="testa"><b>${esc(nome)}</b><span class="val">${percento(su100, 1)} · ${euroTondi(pc)}/ab.</span></div>
    <div class="pista" role="img" aria-label="${esc(`${nome}: ${percento(su100, 1)} della spesa, ${euroTondi(pc)} per abitante${pcSimili ? `, tipico ${euroTondi(pcSimili)}` : ''}`)}"><span class="pieno" style="width:${larg}%"></span>${posSimili !== null ? `<span class="segno-simili" style="left:calc(${posSimili}% - 1px)"></span>` : ''}</div>
    <small>${esc(dentro)}${c && pcSimili ? ` · tipico ${euroTondi(pcSimili)} per abitante, qui ${c.tono === 'pari' ? 'in linea' : c.parola}` : ''}</small></li>`;
}

let righeCorrenti = [];
function righeServizi(righe, chiave, verso) {
  righeCorrenti = righe.map((r) => ({ ...r, diff: r.pc && r.pcSimili ? r.pc / r.pcSimili : null }));
  return ordina(chiave, verso);
}
function ordina(chiave, verso) {
  const r = [...righeCorrenti].sort((a, b) => {
    const va = a[chiave], vb = b[chiave];
    if (typeof va === 'string') return va.localeCompare(vb) * verso;
    return ((va ?? -Infinity) - (vb ?? -Infinity)) * verso;
  });
  return r.map((x) => {
    const c = rispettoA(x.pc, x.pcSimili);
    return `<tr><td>${esc(x.nome)}</td><td class="n">${euroTondi(x.pc)}</td><td class="n">${x.pcSimili ? euroTondi(x.pcSimili) : '—'}</td><td class="n ${c ? 'tono-' + c.tono : ''}">${c ? esc(c.parola) : '—'}</td><td class="n">${euroParole(x.impegnato)}</td></tr>`;
  }).join('') || '<tr><td colspan="5">Nessun dato per i servizi principali.</td></tr>';
}
function attivaOrdinamento() {
  const t = $('#tab-servizi');
  if (!t) return;
  $$('th button', t).forEach((b) => b.addEventListener('click', () => {
    const th = b.closest('th');
    const k = th.dataset.k;
    const verso = th.getAttribute('aria-sort') === 'descending' ? 1 : -1;
    $$('th', t).forEach((x) => x.removeAttribute('aria-sort'));
    th.setAttribute('aria-sort', verso < 0 ? 'descending' : 'ascending');
    $('tbody', t).innerHTML = ordina(k, k === 'nome' ? -verso : verso);
  }));
}

function tonoComplessivo(lista) {
  if (lista.some((c) => c.tono === 'no')) return 'no';
  if (lista.some((c) => c.tono === 'forse')) return 'forse';
  return 'si';
}

// Apertura diretta: #istat=070078 oppure #cf=00067530709
const ancora = leggiAncora();
if (ancora.istat) apri(ancora.istat);
else if (ancora.cf) elenco().then(({ comuni }) => { const c = comuni.find((x) => x.cf === ancora.cf); if (c) apri(c.istat); }).catch(() => {});
