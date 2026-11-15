// Interfaccia di «Dove finiscono le mie tasse». Tutto gira nel browser: reddito e cifre restano sul dispositivo;
// nell'indirizzo va solo il codice ISTAT del Comune (#istat=058091), che è pubblico.

import { $, $$, esc } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { caricaJSON, cercaIn, euroTondi, euroParole, rispettoA, leggiAncora, scriviAncora } from '../src/comune/schede.js';
import { montaFoto } from '../src/comune/foto.js';
import { SEZIONI, DOMANDE, contribuente } from '../src/domande.js';
import { doveVanno, preparaComune, FONTI, VERIFICATO, TIPI } from '../src/regole.js';

const DATI = new URL('../dati/', import.meta.url);
const statoDati = () => caricaJSON(new URL('stato.json', DATI));
const elenco = () => caricaJSON(new URL('comuni.json', DATI));
const provincia = (sigla) => caricaJSON(new URL(`p/${sigla}.json`, DATI));

const ESEMPI = {
  dip28: { r: { modo: 'stima', tipo: 'dipendente', reddito: 28000 }, istat: '058091' },
  pens15: { r: { modo: 'stima', tipo: 'pensionato', reddito: 15000 }, istat: '072006' },
  dip50: { r: { modo: 'stima', tipo: 'dipendente', reddito: 50000 }, istat: '015146' },
  cu: { r: { modo: 'dichiarazione', irpef: 3465, add_reg: 484.4, add_com: 252 }, istat: '058091' },
};

const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const it1 = (n) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
const euro = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: Math.abs(n - Math.round(n)) < 0.005 ? 0 : 2, maximumFractionDigits: 2, useGrouping: 'always' }).format(n);
const miliardi = (milioni) => `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1, useGrouping: 'always' }).format(milioni / 1000)} miliardi di euro`;
const minuscola = (t) => t.charAt(0).toLowerCase() + t.slice(1);
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;

let comuneScelto = null; // { riga, scheda }
const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'tasse-v1', alCambio: disegna });

// ---------- il Comune ----------

const box = document.createElement('div');
box.className = 'domanda cerca-ente';
box.innerHTML = `
  <label for="cerca-comune">Scrivi il nome del Comune</label>
  <input type="text" id="cerca-comune" placeholder="es. Roma, Bari, San Giovanni in Persiceto" autocomplete="off" aria-controls="risultati-comuni" enterkeyhint="search">
  <ul class="risultati-enti" id="risultati-comuni" hidden></ul>
  <div id="comune-scelto"></div>`;
$('#s-comune h2').after(box);
const campo = $('#cerca-comune'), lista = $('#risultati-comuni');
let attesa, trovati = [];
campo.addEventListener('focus', () => { elenco().catch(() => {}); });
campo.addEventListener('input', () => { clearTimeout(attesa); attesa = setTimeout(suggerisci, 120); });
campo.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); if (trovati[0]) scegli(trovati[0][0]); }
  if (e.key === 'ArrowDown') { e.preventDefault(); $('button', lista)?.focus(); }
});

async function suggerisci() {
  const q = campo.value;
  if (q.trim().length < 2) { lista.hidden = true; return; }
  lista.hidden = false;
  lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco dei Comuni…</button></li>';
  try {
    const { comuni } = await elenco();
    trovati = cercaIn(comuni, q, { testoDi: (c) => `${c[1]} ${c[2]}`, nomeDi: (c) => c[1] });
    lista.innerHTML = trovati.length
      ? trovati.map((c) => `<li><button type="button" data-istat="${c[0]}">${esc(c[1])}<small>${esc(`${c[2]} · ${c[3]}`)}</small></button></li>`).join('')
      : '<li><button type="button" disabled>Nessun Comune con questo nome: controlla come è scritto.</button></li>';
    $$('[data-istat]', lista).forEach((b) => b.addEventListener('click', () => scegli(b.dataset.istat)));
  } catch {
    lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
  }
}

async function scegli(istat, { aggiorna = true } = {}) {
  lista.hidden = true;
  campo.value = '';
  const { comuni } = await elenco();
  const riga = comuni.find((c) => c[0] === istat);
  if (!riga) return;
  const scheda = (await provincia(riga[2]))[istat] || null;
  comuneScelto = { riga, scheda };
  scriviAncora({ istat });
  $('#comune-scelto').innerHTML = `<div class="ente-scelto"><b>${esc(riga[1])}</b> <span>${esc(`${riga[2]} · ${riga[3]}`)}</span><span><button type="button" class="link" id="togli-comune">Cambia Comune</button></span></div>`;
  $('#togli-comune').addEventListener('click', () => { comuneScelto = null; $('#comune-scelto').innerHTML = ''; scriviAncora({}); modulo.aggiorna(); campo.focus(); });
  if (aggiorna) modulo.aggiorna();
}

// ---------- l'esito ----------

let ultimo = null;
async function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  const giro = Symbol('giro');
  ultimo = giro;
  let dati;
  try { dati = await statoDati(); } catch {
    $('#esito').innerHTML = '<section class="pannello"><p>Non riesco a caricare i dati. Riprova tra poco.</p></section>';
    return;
  }
  if (ultimo !== giro) return;
  const comune = comuneScelto ? preparaComune(dati, comuneScelto.riga, comuneScelto.scheda) : null;
  const e = doveVanno(contribuente(r), dati.cofog, comune);
  // l'aliquota comunale si chiede solo quando i dati pubblicati non bastano
  const serve = !!comune && (!comune.add || comune.add.da_verificare === true) && (r.modo !== 'dichiarazione' || r.add_com === undefined);
  if (serve !== (r._serve_aliquota === true)) { r._serve_aliquota = serve; modulo.aggiorna(); return; }
  $('#esito').innerHTML = e.servono.length ? inizio(e, comune) : risultato(e, dati, comune);
  attivaOrdinamento();
}

function inizio(e, comune) {
  return `<section class="pannello verdetto" data-tono="forse">
    <div class="occhiello">Inizia da qui</div>
    <p class="titolo">Per fare il conto mi serve ${esc(e.servono.join(' e '))}</p>
    <p>${comune ? `Comune scelto: <b>${esc(comune.nome)}</b>.` : 'Scegli anche il tuo Comune, per le addizionali e per vedere come spende 100 euro.'} Se non hai il reddito sotto mano, prova un esempio qui sopra.</p>
  </section>`;
}

function rigaConto(nome, a) {
  if (!a) return '';
  if (a.stato === 'serve') return `<li><span>${esc(nome)}</span><span>serve un dato</span></li>`;
  return `<li><span>${esc(nome)}${a.perche ? `<small style="display:block;color:var(--inchiostro-3)">${esc(a.perche)}</small>` : ''}</span><span>${euro(a.euro)}</span></li>`;
}

function risultato(e, dati, comune) {
  const anno = e.anno_spesa;
  const max = Math.max(...e.funzioni.map((f) => Math.max(f.su100, f.ue || 0)));
  const note = [
    ...(e.irpef?.note || []), ...(e.regionale?.note || []).map((n) => `Addizionale regionale: ${minuscola(n)}`), ...(e.comunale?.note || []).map((n) => `Addizionale comunale: ${minuscola(n)}`), ...e.avvisi,
  ];
  const serveAliquota = e.comunale?.stato === 'serve' && comune;
  const d = e.debito;
  return `
  <section class="pannello verdetto" data-tono="si">
    <div class="occhiello">${e.modo === 'stima' ? `Stima per il ${e.anno}${e.tipo ? ` · ${esc(TIPI[e.tipo])}` : ''}` : 'Dalle tue cifre'}${comune ? ` · ${esc(comune.nome)}` : ''}</div>
    <p class="titolo">${e.sostitutiva ? `Paghi circa ${euroTondi(e.totale)} di imposta sostitutiva` : `Paghi circa ${euroTondi(e.totale)} tra IRPEF e addizionali`}</p>
    <div class="cifre">
      ${e.sostitutiva ? `<div><b>${euroTondi(e.sostitutiva.euro)}</b><span>imposta sostitutiva del ${e.sostitutiva.aliquota}%</span></div>` : `
      <div><b>${euroTondi(e.irpef.netta)}</b><span>IRPEF netta</span></div>
      <div><b>${e.regionale?.euro === null ? '?' : euroTondi(e.regionale.euro)}</b><span>addizionale regionale</span></div>
      <div><b>${e.comunale?.euro === null ? '?' : euroTondi(e.comunale.euro)}</b><span>addizionale comunale</span></div>`}
      ${e.bonus ? `<div><b>${euroTondi(e.bonus)}</b><span>ricevi in busta paga dallo Stato</span></div>` : ''}
    </div>
    ${e.bonus ? `<p>Tolto quello che ricevi (somma esente e trattamento integrativo), il saldo è <b>${euro(e.saldo)}</b>${e.saldo < 0 ? ': ricevi più di quanto paghi di IRPEF e addizionali' : ''}.</p>` : ''}
    ${serveAliquota ? `<p>Per l'addizionale comunale di ${esc(comune.nome)} serve l'aliquota: scrivila qui a sinistra. La trovi nella delibera del Comune o negli <a href="${esc(FONTI.aliquote_comunali.url)}" target="_blank" rel="noopener">elenchi del Dipartimento delle Finanze</a>.</p>` : ''}
  </section>

  ${e.irpef && !e.irpef.dichiarata ? `<section class="pannello" aria-labelledby="t-conto">
    <div class="occhiello">Il conto, passo per passo</div>
    <h2 id="t-conto">Come arriviamo a ${euroTondi(e.irpef.netta)} di IRPEF</h2>
    <ul class="conto-righe">
      <li><span>Reddito imponibile</span><span>${euro(e.reddito)}</span></li>
      <li><span>Imposta lorda (23% fino a 28.000 euro, 33% fino a 50.000, 43% oltre)</span><span>${euro(e.irpef.lorda)}</span></li>
      ${e.irpef.detrazioni.map((x) => `<li><span>meno ${esc(x.nome.toLowerCase())}</span><span>− ${euro(x.euro)}</span></li>`).join('')}
      <li class="tot"><span>IRPEF netta</span><span>${euro(e.irpef.netta)}</span></li>
      ${rigaConto(`Addizionale regionale${comune ? ` (${comune.regione})` : ''}`, e.regionale)}
      ${rigaConto(`Addizionale comunale${comune ? ` (${comune.nome})` : ''}`, e.comunale)}
      <li class="tot"><span>Totale</span><span>${euro(e.totale)}</span></li>
      ${e.irpef.bonus.map((b) => `<li><span>In più ricevi: ${esc(b.nome.toLowerCase())}</span><span>+ ${euro(b.euro)}</span></li>`).join('')}
    </ul>
    <ul class="fonti">${[FONTI.scaglioni, FONTI.detrazioni, FONTI.cuneo, FONTI.integrativo, FONTI.regionale, FONTI.comunale].map((f) => `<li>${fonte(f)}</li>`).join('')}</ul>
  </section>` : ''}

  <section class="pannello" aria-labelledby="t-funzioni">
    <div class="occhiello">Stato, Regioni, Comuni ed enti previdenziali · ${anno}</div>
    <h2 id="t-funzioni">Come si dividono 100 euro di spesa pubblica</h2>
    <p>Applichiamo le stesse quote alle tue <b>${euroTondi(e.allo_stato)}</b> ${e.sostitutiva ? 'di imposta sostitutiva' : 'di IRPEF e addizionale regionale'}.</p>
    <ul class="barre">${e.funzioni.map((f) => barra(f, max)).join('')}</ul>
    <div class="legenda"><span><i></i>su 100 euro di spesa in Italia</span><span><i class="r"></i>media dell'Unione europea</span></div>
    ${e.pensioni ? `<p><small>Le pensioni di vecchiaia e ai superstiti da sole valgono ${it1(e.pensioni.su100)} euro su 100.</small></p>` : ''}
    <details><summary>La tabella, da ordinare</summary><div class="scorre"><table class="tabella" id="tab-funzioni">
      <thead><tr><th data-k="nome"><button type="button">Voce</button></th><th data-k="su100" aria-sort="descending"><button type="button">Italia su 100</button></th><th data-k="ue"><button type="button">Media UE</button></th><th data-k="euro"><button type="button">Le tue</button></th></tr></thead>
      <tbody>${righeTabella(e.funzioni, 'su100', -1)}</tbody></table></div></details>
  </section>

  <section class="pannello" aria-labelledby="t-unico">
    <div class="occhiello">Da sapere</div>
    <h2 id="t-unico">Le tasse non hanno una destinazione</h2>
    <p>IRPEF, IVA, contributi e le altre entrate finiscono nello stesso bilancio: nessun euro è legato a una spesa precisa. Le quote dicono come si divide la spesa <b>totale</b>; «delle tue tasse, tanto alla sanità» vuol dire la tua parte divisa nello stesso modo.</p>
    ${d ? `<p>Nel ${d.anno} la spesa pubblica è stata di ${miliardi(d.uscite)} e le entrate di ${miliardi(d.entrate)}: <b>${it1(d.su100)} euro ogni 100 spesi</b> sono stati presi a prestito (deficit)${e.debitoUe ? `; nella media europea ${it1(e.debitoUe.su100)}` : ''}. Il debito si ripaga negli anni dopo, interessi compresi.</p>
    <div class="debito" style="grid-template-columns:${100 - d.su100}fr ${d.su100}fr" role="img" aria-label="${esc(`Su 100 euro spesi, ${it1(100 - d.su100)} coperti dalle entrate e ${it1(d.su100)} a debito`)}"><span style="background:var(--inchiostro-2)"></span><span style="background:var(--accento)"></span></div>
    <div class="legenda"><span><i></i>coperto dalle entrate: ${it1(100 - d.su100)}</span><span><i style="background:var(--accento)"></i>a debito: ${it1(d.su100)}</span></div>` : ''}
    <ul class="fonti"><li>${fonte(FONTI.cofog)}</li><li>${fonte(FONTI.conti)}</li><li>${fonte(FONTI.istat_cofog)}</li></ul>
  </section>

  ${comunePannello(e, comune, dati)}

  ${note.length ? `<section class="pannello"><div class="occhiello">Cosa non abbiamo contato</div><ul class="passi">${note.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>` : ''}

  <p class="fonti">Regole verificate il ${esc(new Date(VERIFICATO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }))}; aliquote delle addizionali lette il ${esc(new Date(dati.letto).toLocaleDateString('it-IT'))}. Dal 2027 il TUIR lascia il posto al nuovo ${fonte(FONTI.testo_unico)}: le regole dello strumento valgono per i redditi del 2026.</p>`;
}

function barra(f, max) {
  const larg = Math.max(0.5, (100 * f.su100) / max);
  const ue = f.ue !== null ? (100 * f.ue) / max : null;
  return `<li><div class="testa"><b>${esc(f.nome)}</b><span class="val">${it1(f.su100)} su 100 · ${euroTondi(f.euro)} tue</span></div>
    <div class="pista" role="img" aria-label="${esc(`${f.nome}: ${it1(f.su100)} euro su 100${f.ue !== null ? `, media UE ${it1(f.ue)}` : ''}; circa ${euroTondi(f.euro)} delle tue`)}"><span class="pieno" style="width:${larg}%"></span>${ue !== null ? `<span class="segno-ue" style="left:calc(${ue}% - 1px)"></span>` : ''}</div>
    <small>${esc(f.dentro)}${f.ue !== null ? ` · media UE ${it1(f.ue)}` : ''}</small></li>`;
}

let righeCorrenti = [];
function righeTabella(righe, chiave, verso) {
  righeCorrenti = righe;
  return ordina(chiave, verso);
}
function ordina(chiave, verso) {
  return [...righeCorrenti].sort((a, b) => (typeof a[chiave] === 'string' ? a[chiave].localeCompare(b[chiave]) : (a[chiave] ?? -1) - (b[chiave] ?? -1)) * verso)
    .map((x) => `<tr><td>${esc(x.nome)}</td><td class="n">${it1(x.su100)}</td><td class="n">${x.ue !== null ? it1(x.ue) : '—'}</td><td class="n">${euroTondi(x.euro)}</td></tr>`).join('');
}
function attivaOrdinamento() {
  const t = $('#tab-funzioni');
  if (!t) return;
  $$('th button', t).forEach((b) => b.addEventListener('click', () => {
    const th = b.closest('th');
    const verso = th.getAttribute('aria-sort') === 'descending' ? 1 : -1;
    $$('th', t).forEach((x) => x.removeAttribute('aria-sort'));
    th.setAttribute('aria-sort', verso < 0 ? 'descending' : 'ascending');
    $('tbody', t).innerHTML = ordina(th.dataset.k, th.dataset.k === 'nome' ? -verso : verso);
  }));
}

function comunePannello(e, comune, dati) {
  if (!comune) return `<section class="pannello"><div class="occhiello">Il tuo Comune</div><p>Scegli il Comune qui a sinistra per calcolare l'addizionale comunale e vedere come il Comune spende 100 euro.</p></section>`;
  const s = e.spesaComune;
  if (!s) return '';
  const max = s.righe[0]?.su100 || 100;
  const pc = s.pop ? s.tot / s.pop : null;
  const simili = comune.simili;
  const c = rispettoA(pc, simili?.spesa_pc);
  return `<section class="pannello" aria-labelledby="t-spesa-comune">
    <div class="occhiello">Rendiconto ${s.anno} · ${esc(comune.nome)}</div>
    <h2 id="t-spesa-comune">Come il Comune spende 100 euro</h2>
    <p>Nel ${s.anno} il Comune si è impegnato a spendere ${euroParole(s.tot)}${pc ? `, ${euroTondi(pc)} per abitante` : ''}${c && simili ? ` (Comuni ${esc(s.fascia)}: tipico ${euroTondi(simili.spesa_pc)})` : ''}. ${e.al_comune ? `Le tue <b>${euroTondi(e.al_comune)}</b> di addizionale comunale vanno al Comune: divise allo stesso modo, sono le cifre qui sotto.` : 'L\'addizionale comunale è solo una parte delle entrate del Comune, insieme a IMU, TARI, rette e trasferimenti.'}</p>
    <ul class="barre">${s.righe.filter((x) => x.su100 >= 0.5).map((x) => {
      const cc = rispettoA(x.pc, x.pcSimili);
      return `<li><div class="testa"><b>${esc(x.nome)}</b><span class="val">${it1(x.su100)} su 100${e.al_comune ? ` · ${euroTondi(x.tuoi)} tue` : ''}</span></div>
      <div class="pista" role="img" aria-label="${esc(`${x.nome}: ${it1(x.su100)} euro su 100`)}"><span class="pieno" style="width:${Math.max(0.5, (100 * x.su100) / max)}%"></span></div>
      <small>${x.pc !== null ? `${euroTondi(x.pc)} per abitante` : ''}${x.pcSimili ? ` · tipico ${euroTondi(x.pcSimili)}${cc ? `, qui ${cc.tono === 'pari' ? 'in linea' : esc(cc.parola)}` : ''}` : ''}</small></li>`;
    }).join('')}</ul>
    <p class="azioni-doc"><a class="btn" href="${esc(altroStrumento('bilancio-comune'))}#istat=${esc(comune.istat)}">Il bilancio completo del Comune</a></p>
    <ul class="fonti"><li>${fonte(FONTI.bilancio_comune)}</li><li>${fonte(FONTI.aliquote_comunali)}</li><li>${fonte(FONTI.aliquote_regionali)}</li></ul>
  </section>`;
}

// ---------- esempi, memoria, foto ----------

$$('[data-esempio]').forEach((b) => b.addEventListener('click', async () => {
  const es = ESEMPI[b.dataset.esempio];
  await scegli(es.istat, { aggiorna: false });
  modulo.imposta(es.r, { esempio: true });
}));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => {
  modulo.azzera();
  try { localStorage.removeItem('tasse-comune'); } catch { /* niente */ }
  comuneScelto = null; $('#comune-scelto').innerHTML = ''; scriviAncora({}); modulo.aggiorna();
});

// il Comune si ricorda sul dispositivo e si può aprire da un altro strumento con #istat=...
const ricorda = (istat) => { try { localStorage.setItem('tasse-comune', istat); } catch { /* niente */ } };
(async () => {
  const istat = leggiAncora().istat || (() => { try { return localStorage.getItem('tasse-comune'); } catch { return null; } })();
  if (istat && /^\d{6}$/.test(istat)) await scegli(istat).catch(() => modulo.aggiorna());
  else modulo.aggiorna();
})();
document.addEventListener('click', (ev) => { const b = ev.target.closest('[data-istat]'); if (b) ricorda(b.dataset.istat); });

montaFoto({
  contenitore: $('#foto'), strumento: 'Dove finiscono le mie tasse', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'la Certificazione Unica o il prospetto di liquidazione del 730',
  note: 'Leggi solo le ritenute IRPEF (o l\'IRPEF netta), l\'addizionale regionale e l\'addizionale comunale dell\'anno, e imposta modo = dichiarazione. Non trascrivere nome, codice fiscale, indirizzo o dati del datore di lavoro.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, modo: 'dichiarazione', ...r }),
});
window.addEventListener('hashchange', () => { const istat = leggiAncora().istat; if (istat && /^\d{6}$/.test(istat) && istat !== comuneScelto?.riga[0]) scegli(istat).catch(() => {}); });
