// Interfaccia di «Quanto pago di IMU?». Tutto gira nel browser: immobili e rendite restano su
// questo dispositivo (localStorage), non vanno mai nell'indirizzo della pagina.

import { $, $$, esc, eur, numero, archivio, copia } from '../src/comune/interfaccia.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { caricaJSON, normalizza } from '../src/comune/schede.js';
import { calcolaImu, CODICI, RICERCA_MEF, VOCI_ALIQUOTA, fmtPerc, testo as testoEsito } from '../src/regole.js';
import { CAMPI, ESEMPI } from '../src/domande.js';

const memoria = archivio('imu-v1');
const ANNI = [[2026, '2026'], [2025, '2025'], [2027, '2027 (aliquote 2027 non ancora pubblicate)']];
let stato = memoria.leggi(null) || { anno: 2026, immobili: [{ tipo: 'fabbricato', quota: 100 }] };
let esempio = false;
let indice = null;
const province = {};
let rata = 'saldo';
let ordine = { col: null, giu: false };

// ---------- dati: elenco dei Comuni e aliquote per provincia ----------

const caricaIndice = async () => {
  if (indice) return indice;
  const d = await caricaJSON('dati/indice.json');
  d.righe = d.comuni.map(([cat, nome, sigla, istat, anni]) => ({ cat, nome, sigla, istat, anni, n: normalizza(nome) }));
  d.perCat = Object.fromEntries(d.righe.map((r) => [r.cat, r]));
  return (indice = d);
};
const caricaProvincia = async (sigla) => (province[sigla] ||= await caricaJSON(`dati/p/${sigla}.json`).catch(() => ({ comuni: {} })));

function cercaComune(q, limite = 8) {
  let t = normalizza(q);
  if (!t || !indice) return [];
  let sigla = '';
  const m = t.match(/^(.*?)\s+([a-z]{2})$/);
  if (m && indice.righe.some((r) => r.sigla.toLowerCase() === m[2] && r.n.startsWith(m[1]))) { t = m[1]; sigla = m[2].toUpperCase(); }
  const punti = (r) => (r.n === t ? 3 : r.n.startsWith(t) ? 2 : r.n.includes(` ${t}`) ? 1 : r.n.includes(t) ? 0.5 : -1);
  return indice.righe.filter((r) => (!sigla || r.sigla === sigla) && punti(r) >= 0)
    .sort((a, b) => punti(b) - punti(a) || a.n.length - b.n.length || a.n.localeCompare(b.n)).slice(0, limite);
}

async function comuniPerCalcolo() {
  const idx = await caricaIndice().catch(() => null);
  const out = {};
  for (const im of stato.immobili) {
    const r = idx?.perCat[im.comune];
    if (!r) continue;
    const p = await caricaProvincia(r.sigla);
    out[r.cat] = { nome: r.nome, sigla: r.sigla, anni: p.comuni?.[r.cat]?.anni || {} };
  }
  return { comuni: out, anniDisponibili: idx?.anni || [2025, 2026] };
}

// ---------- il questionario ----------

const form = $('#questionario');
form.innerHTML = `
  <section class="sezione" id="s-anno">
    <h2><span class="n">1 di 2</span>L'anno</h2>
    <div class="domanda">
      <span class="etichetta" id="anno-et">Per quale anno calcoli l'IMU?</span>
      <div class="scelte" role="radiogroup" aria-labelledby="anno-et">
        ${ANNI.map(([v, t]) => `<label><input type="radio" name="anno" value="${v}"> ${esc(t)}</label>`).join('')}
      </div>
      <p class="aiuto">L'acconto di giugno si calcola con le aliquote dell'anno prima, il saldo di dicembre con quelle pubblicate entro il 28 ottobre dell'anno.</p>
    </div>
  </section>
  <section class="sezione" id="s-immobili">
    <h2><span class="n">2 di 2</span>I tuoi immobili</h2>
    <p class="aiuto">Uno per volta: casa, box e cantina vanno scritti separati, ognuno con la sua rendita. Trovi categoria e rendita nella visura catastale (gratis con SPID sul sito dell'Agenzia delle Entrate) o nell'atto.</p>
    <div id="immobili"></div>
    <button type="button" class="btn aggiungi" id="aggiungi">Aggiungi un immobile</button>
  </section>`;

function campoHtml(c, im, k) {
  const id = `i${k}-${c.id}`;
  const v = im[c.id];
  const aiuto = c.aiuto ? `<p class="aiuto">${esc(c.aiuto)}</p>` : '';
  const nascosto = c.visibile && !c.visibile(im) ? ' hidden' : '';
  let campo = '';
  if (c.tipo === 'testo') campo = `<label for="${id}">${esc(c.etichetta)}</label>${aiuto}<input type="text" id="${id}" data-k="${k}" data-campo="${c.id}" value="${esc(v ?? '')}" placeholder="${esc(c.segnaposto || '')}" autocomplete="off">`;
  else if (c.tipo === 'numero') campo = `<label for="${id}">${esc(c.etichetta)}</label>${aiuto}<input type="number" inputmode="decimal" id="${id}" data-k="${k}" data-campo="${c.id}" value="${esc(v ?? '')}" style="max-width:140px">`;
  else if (c.tipo === 'euro') campo = `<label for="${id}">${esc(c.etichetta)}</label>${aiuto}<div class="euro"><input type="text" inputmode="decimal" id="${id}" data-k="${k}" data-campo="${c.id}" value="${v === undefined || v === null ? '' : esc(Number(v).toLocaleString('it-IT', { maximumFractionDigits: 2 }))}" placeholder="es. 520,46"></div>`;
  else if (c.tipo === 'data') campo = `<label for="${id}">${esc(c.etichetta)}</label>${aiuto}<input type="date" id="${id}" data-k="${k}" data-campo="${c.id}" value="${esc(v ?? '')}">`;
  else if (c.tipo === 'elenco') campo = `<label for="${id}">${esc(c.etichetta)}</label>${aiuto}<select id="${id}" data-k="${k}" data-campo="${c.id}"><option value="">Scegli…</option>${c.opzioni.map(([o, t]) => `<option value="${esc(o)}"${o === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  else if (c.tipo === 'si_no') campo = `<span class="etichetta">${esc(c.etichetta)}</span>${aiuto}<div class="si-no" role="radiogroup"><label><input type="radio" name="${id}" data-k="${k}" data-campo="${c.id}" value="si"${v === true ? ' checked' : ''}> Sì</label><label><input type="radio" name="${id}" data-k="${k}" data-campo="${c.id}" value="no"${v === false ? ' checked' : ''}> No</label></div>`;
  else if (c.tipo === 'spunta') campo = `<div class="spunte"><label><input type="checkbox" id="${id}" data-k="${k}" data-campo="${c.id}"${v ? ' checked' : ''}> ${esc(c.etichetta)}</label></div>`;
  return `<div class="domanda" id="d-${id}" data-vis="${c.id}"${nascosto}>${campo}</div>`;
}

function disegnaImmobili() {
  const box = $('#immobili');
  box.innerHTML = stato.immobili.map((im, k) => {
    const comune = indice?.perCat[im.comune];
    return `<article class="immobile" data-k="${k}" aria-labelledby="t-imm-${k}">
      <header><h3 id="t-imm-${k}">${esc(im.nome || `Immobile ${k + 1}`)}</h3>${stato.immobili.length > 1 ? `<button type="button" class="link" data-togli="${k}">Togli</button>` : ''}</header>
      <div class="domanda cerca-ente">
        <label for="i${k}-cerca">Comune dove si trova</label>
        <input type="text" id="i${k}-cerca" data-cerca="${k}" placeholder="es. Pescara, San Giovanni in Persiceto" autocomplete="off" value="${comune ? esc(`${comune.nome} (${comune.sigla})`) : ''}" enterkeyhint="search">
        <ul class="risultati-enti" id="i${k}-risultati" hidden></ul>
      </div>
      ${CAMPI.map((c) => campoHtml(c, im, k)).join('')}
      <div class="domanda" id="i${k}-aliquota"></div>
    </article>`;
  }).join('');
}

function aggiornaVisibilita(k) {
  const im = stato.immobili[k];
  for (const c of CAMPI) {
    const el = document.getElementById(`d-i${k}-${c.id}`);
    if (el) el.hidden = Boolean(c.visibile && !c.visibile(im));
  }
}

function leggi(ev) {
  const t = ev.target;
  const k = Number(t.dataset.k);
  const campo = t.dataset.campo;
  if (t.name === 'anno') { stato.anno = Number(t.value); return cambia(); }
  if (Number.isNaN(k) || !campo) return;
  const c = CAMPI.find((x) => x.id === campo) || { tipo: t.dataset.tipo || 'testo' };
  const im = stato.immobili[k];
  let v;
  if (c.tipo === 'euro') v = numero(t.value);
  else if (c.tipo === 'numero' || campo === 'aliquota' || campo === 'aliquota_acconto') v = t.value === '' ? undefined : numero(t.value);
  else if (c.tipo === 'si_no') v = t.value === 'si';
  else if (c.tipo === 'spunta') v = t.checked || undefined;
  else v = t.value === '' ? undefined : t.value;
  if (v === undefined) delete im[campo]; else im[campo] = v;
  if (campo === 'nome') $(`#t-imm-${k}`).textContent = im.nome || `Immobile ${k + 1}`;
  if (campo === 'tipo' || campo === 'categoria' || campo === 'uso') { delete im.diff; }
  aggiornaVisibilita(k);
  cambia();
}

form.addEventListener('input', (e) => { if (!e.target.dataset.cerca && e.target.type !== 'radio' && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') leggi(e); });
form.addEventListener('change', (e) => { if (!e.target.dataset.cerca) leggi(e); });

// ricerca del Comune, per ogni immobile
let attesa;
form.addEventListener('focusin', (e) => { if (e.target.dataset.cerca !== undefined) caricaIndice().catch(() => {}); });
form.addEventListener('input', (e) => {
  const k = e.target.dataset.cerca;
  if (k === undefined) return;
  clearTimeout(attesa);
  attesa = setTimeout(async () => {
    const lista = $(`#i${k}-risultati`);
    const q = e.target.value;
    if (q.trim().length < 2) { lista.hidden = true; return; }
    lista.hidden = false;
    if (!indice) lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco dei Comuni…</button></li>';
    try {
      await caricaIndice();
      const trovati = cercaComune(q);
      lista.innerHTML = trovati.length
        ? trovati.map((r) => `<li><button type="button" data-scegli="${k}" data-cat="${r.cat}">${esc(r.nome)}<small>${esc(`${r.sigla} · codice catastale ${r.cat}`)}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessun Comune con questo nome: controlla come è scritto.</button></li>';
    } catch {
      lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
    }
  }, 120);
});
form.addEventListener('keydown', (e) => {
  if (e.target.dataset.cerca !== undefined && e.key === 'Enter') { e.preventDefault(); $(`#i${e.target.dataset.cerca}-risultati button[data-scegli]`)?.click(); }
});
form.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.scegli !== undefined) {
    const k = Number(b.dataset.scegli);
    const r = indice.perCat[b.dataset.cat];
    stato.immobili[k].comune = r.cat;
    delete stato.immobili[k].diff; delete stato.immobili[k].ex_comune;
    $(`#i${k}-cerca`).value = `${r.nome} (${r.sigla})`;
    $(`#i${k}-risultati`).hidden = true;
    cambia();
  } else if (b.dataset.togli !== undefined) {
    stato.immobili.splice(Number(b.dataset.togli), 1);
    ridisegna();
  } else if (b.id === 'aggiungi') {
    const prima = stato.immobili.at(-1);
    stato.immobili.push({ tipo: 'fabbricato', quota: 100, comune: prima?.comune });
    ridisegna();
    $(`#i${stato.immobili.length - 1}-nome`)?.focus();
  }
});

// ---------- il riquadro dell'aliquota sotto ogni immobile ----------

const ORIGINE = {
  prospetto: (p) => `prospetto ${p.anno} del Comune`,
  anno_prima: (p) => `prospetto ${p.anno} del Comune: per l'anno dopo non risulta un prospetto nuovo pubblicato entro il 28 ottobre, quindi vale questo`,
  base_legge: () => 'aliquota di base della legge: non risulta un prospetto del Comune pubblicato dal 2025',
  differenziata: (p) => `aliquota differenziata del prospetto ${p.anno}`,
  tua: () => 'scritta da te',
};

function riquadroAliquota(k, r) {
  const box = document.getElementById(`i${k}-aliquota`);
  if (!box) return;
  const im = stato.immobili[k];
  if (!r || !im.comune || r.stato === 'esente' || r.stato === 'non_imu' || (!r.prospetto && !r.servono.some((s) => ['aliquota', 'ex_comune'].includes(s.campo)))) { box.hidden = true; box.innerHTML = ''; delete box.dataset.pronto; return; }
  box.hidden = false;
  const p = r.prospetto || {};
  const v = p.voce || {};
  const alt = r.alternative || [];
  const pdf = `<a href="${esc(RICERCA_MEF)}" target="_blank" rel="noopener">Apri i prospetti del Dipartimento delle Finanze</a>`;
  const trovata = r.aliquota !== undefined && r.origineAliquota !== 'tua'
    ? `<div class="aliquota-trovata">Aliquota per «${esc(VOCI_ALIQUOTA[r.voce] || '')}»: <b>${esc(fmtPerc(r.aliquota))}</b>, ${esc((ORIGINE[r.origineAliquota] || (() => ''))(p))}${v.delibera ? `, delibera ${esc(v.delibera)}` : ''}${v.pubblicato ? `, pubblicata il ${esc(data(v.pubblicato).toLocaleDateString('it-IT', { timeZone: 'UTC' }))}` : ''}. ${pdf}.</div>`
    : `<div class="aliquota-trovata">${p.stato === 'fusione' ? 'Questo Comune nasce da una fusione e applica aliquote diverse nei Comuni di prima.' : 'Non ho l\'aliquota di questo Comune per quest\'anno.'} Cercala nel prospetto: ${pdf} (scegli Regione, Comune e anno).</div>`;
  const fusione = p.stato === 'fusione' ? `<label for="i${k}-ex">Ex Comune dove si trova l'immobile</label><select id="i${k}-ex" data-k="${k}" data-campo="ex_comune"><option value="">Scegli…</option>${p.ex.map((x) => `<option${x === im.ex_comune ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>` : '';
  const scelte = alt.length ? `<label for="i${k}-diff">Il Comune ha aliquote diverse per alcuni casi. Il tuo è tra questi?</label>
    <select id="i${k}-diff" data-k="${k}" data-campo="diff"><option value="">No: vale l'aliquota di base${Number.isFinite(p.voce?.base?.[r.voce]) ? ` (${fmtPerc(p.voce.base[r.voce])})` : ''}</option>
    ${alt.map((d) => `<option value="${d.i}"${String(im.diff) === String(d.i) ? ' selected' : ''}>${esc(fmtPerc(d.aliquota))}: ${esc((d.condizioni || []).join('; ').slice(0, 220))}</option>`).join('')}</select>` : '';
  const esenzioni = v.esenzioni?.length ? `<details><summary>Esenzioni e agevolazioni indicate dal Comune (${v.esenzioni.length})</summary><ul class="nota-imm">${v.esenzioni.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>` : '';
  if (!box.dataset.pronto) {
    box.innerHTML = `<div data-parte="info"></div><div data-parte="scelte" class="cerca-ente"></div>
      <div data-parte="manuale" class="cerca-ente"><label for="i${k}-aliq">Oppure scrivi l'aliquota che trovi nel prospetto, in percento</label>
      <p class="aiuto">Per esempio 1,06. Lascia vuoto per usare quella trovata qui sopra.</p>
      <input type="text" inputmode="decimal" id="i${k}-aliq" data-k="${k}" data-campo="aliquota" value="${im.aliquota === undefined ? '' : esc(String(im.aliquota).replace('.', ','))}" style="max-width:140px"></div>
      <div data-parte="esenzioni"></div>`;
    box.dataset.pronto = '1';
  }
  const parte = (nome, html) => {
    const el = box.querySelector(`[data-parte="${nome}"]`);
    if (el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
    if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
  };
  parte('info', trovata);
  parte('scelte', fusione + scelte);
  parte('esenzioni', esenzioni);
}

// ---------- l'esito ----------

const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const lungo = (s) => data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function tabellaImmobili(e) {
  const righe = e.righe.map((r) => ({
    r,
    nome: r.nome, comune: r.comuneNome || '', base: r.baseRidotta ?? null, aliquota: r.aliquota ?? null,
    mesi: r.mesi ?? null, quota: r.quota ?? null, imposta: r.stato === 'calcolato' || r.stato === 'esente' ? r.imposta : null,
  }));
  if (ordine.col) righe.sort((a, b) => {
    const x = a[ordine.col]; const y = b[ordine.col];
    const c = typeof x === 'string' ? String(x).localeCompare(String(y)) : (x ?? -1) - (y ?? -1);
    return ordine.giu ? -c : c;
  });
  const th = (col, t, num) => `<th${num ? ' class="num"' : ''} aria-sort="${ordine.col === col ? (ordine.giu ? 'descending' : 'ascending') : 'none'}"><button type="button" class="ordina" data-ordina="${col}">${t}</button></th>`;
  const stato = (r) => (r.stato === 'esente' ? '<span class="pill p-si">esente</span>' : r.stato === 'non_imu' ? '<span class="pill p-neutro">niente IMU</span>' : r.stato === 'dato' ? '<span class="pill p-dato">serve un dato</span>' : '');
  return `<div class="scorri-x"><table class="confronto tab-imm">
    <thead><tr>${th('nome', 'Immobile')}${th('base', 'Base imponibile', 1)}${th('aliquota', 'Aliquota', 1)}${th('mesi', 'Quota e mesi', 1)}${th('imposta', 'IMU dell\'anno', 1)}</tr></thead>
    <tbody>${righe.map(({ r }) => `<tr>
      <td><b>${esc(r.nome)}</b>${r.comuneNome ? `<small class="nota-imm" style="display:block;margin:0">${esc(r.comuneNome)}</small>` : ''} ${stato(r)}${r.esente ? `<p class="nota-imm">${esc(r.esente)}</p>` : ''}${r.servono.map((s) => `<p class="nota-imm">${esc(s.testo)}</p>`).join('')}${(r.note || []).map((n) => `<p class="nota-imm">${esc(n)}</p>`).join('')}${r.riduzioni?.length ? `<p class="nota-imm">Base ridotta del 50%: ${esc(r.riduzioni.join('; '))}.</p>` : ''}</td>
      <td class="euro-c" data-et="Base">${r.baseRidotta !== undefined ? eur(r.baseRidotta) : ''}${r.calcoloBase ? `<small class="nota-imm" style="display:block">${esc(r.calcoloBase)}</small>` : ''}</td>
      <td class="euro-c" data-et="Aliquota">${r.aliquota !== undefined ? esc(fmtPerc(r.aliquota)) : ''}${r.uso === 'concordato' && r.aliquota !== undefined ? '<small class="nota-imm" style="display:block">imposta al 75%</small>' : ''}${r.uso === 'pensionato_estero' && r.aliquota !== undefined ? '<small class="nota-imm" style="display:block">imposta alla metà</small>' : ''}</td>
      <td class="euro-c" data-et="Quota">${r.quota !== undefined && !Number.isNaN(r.quota) ? `${esc(String(r.quota).replace('.', ','))}%` : ''}${r.mesi !== undefined ? `<small class="nota-imm" style="display:block">${r.mesi} ${r.mesi === 1 ? 'mese' : 'mesi'}</small>` : ''}</td>
      <td class="euro-c" data-et="IMU">${r.imposta !== undefined && r.imposta !== null ? eur(r.imposta) : ''}${r.detrazione ? `<small class="nota-imm" style="display:block">detrazione ${eur(r.detrazione)}</small>` : ''}</td>
    </tr>`).join('')}</tbody></table></div>`;
}

function tabellaF24(e) {
  const disponibili = e.divisibile ? ['acconto', 'saldo', 'unica'] : ['unica'];
  if (!disponibili.includes(rata)) rata = disponibili[0];
  const nomi = { acconto: `Acconto (16 giugno ${e.anno})`, saldo: `Saldo (16 dicembre ${e.anno})`, unica: 'Tutto in una volta (entro il 16 giugno)' };
  const lista = e.f24[rata];
  const x = (b) => (b ? 'X' : '');
  return `<div class="schede-rata" role="group" aria-label="Quale versamento">${disponibili.map((k) => `<button type="button" class="btn" data-rata="${k}" aria-pressed="${k === rata}">${esc(nomi[k])}</button>`).join('')}</div>
    ${lista.length ? `<div class="scorri-x"><table class="tab-f24">
      <thead><tr><th>Codice ente</th><th>Immob. variati</th><th>Acc.</th><th>Saldo</th><th>Num. immobili</th><th>Codice tributo</th><th>Anno di rif.</th><th>Importi a debito versati</th></tr></thead>
      <tbody>${lista.map((r) => `<tr><td>${esc(r.codice_ente)}</td><td>${x(r.immobili_variati)}</td><td>${x(r.acconto)}</td><td>${x(r.saldo)}</td><td>${r.numero_immobili}</td><td title="${esc(CODICI[r.codice_tributo] || '')}">${esc(r.codice_tributo)}</td><td>${r.anno_riferimento}</td><td class="num">${esc(r.importo.toLocaleString('it-IT', { minimumFractionDigits: 2, useGrouping: 'always' }))}</td></tr>`).join('')}
      <tr><td colspan="7" style="text-align:right">Totale G${lista.some((r) => r.detrazione) ? ` · Detrazione abitazione principale: ${esc(lista.filter((r) => r.detrazione).map((r) => r.detrazione.toLocaleString('it-IT', { minimumFractionDigits: 2 })).join(' + '))}` : ''}</td><td class="num"><b>${esc(lista.reduce((s, r) => s + r.importo, 0).toLocaleString('it-IT', { minimumFractionDigits: 2, useGrouping: 'always' }))}</b></td></tr>
      </tbody></table></div>
      <p class="aiuto">Sezione «IMU e altri tributi locali» del modello F24. Codici tributo: ${[...new Set(lista.map((r) => r.codice_tributo))].map((c) => `${c} = ${esc(CODICI[c])}`).join('; ')}. Importi arrotondati all'euro riga per riga. Le caselle «Ravv.» e «Rateazione» restano vuote. Il modello lo paghi dalla tua banca, alla posta o con l'app: i dati personali li completi tu.</p>
      <p class="azioni-doc"><button type="button" class="btn" id="copia-f24">Copia le righe</button><span class="esito-copia" id="esito-copia" role="status"></span></p>`
    : '<p>Niente da versare in questa rata.</p>'}`;
}

function testoF24(e) {
  return e.f24[rata].map((r) => `Codice ente ${r.codice_ente} | ${r.immobili_variati ? 'Immob. variati X | ' : ''}${r.acconto ? 'Acc. X | ' : ''}${r.saldo ? 'Saldo X | ' : ''}Num. immobili ${r.numero_immobili} | Codice tributo ${r.codice_tributo} | Anno ${r.anno_riferimento} | Importo ${r.importo},00${r.detrazione ? ` | Detrazione ${r.detrazione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : ''}`).join('\n');
}

let ultimo = null;
async function calcola() {
  const { comuni, anniDisponibili } = await comuniPerCalcolo();
  const immobili = stato.immobili.map((im) => ({ ...im, comune: im.comune, sigla: comuni[im.comune]?.sigla }));
  const e = calcolaImu(immobili, { anno: stato.anno, comuni, anniDisponibili });
  ultimo = e;
  e.righe.forEach((r, k) => riquadroAliquota(k, r));
  const vuoto = !stato.immobili.some((im) => im.comune || im.rendita || im.categoria);
  const tono = !e.righe.length || vuoto ? 'dato' : !e.completo ? 'forse' : e.unica === 0 ? 'si' : 'no';
  const titolo = vuoto ? 'Scrivi il primo immobile'
    : e.unica === 0 && e.completo ? `Per il ${e.anno} non devi pagare l'IMU`
      : e.unica === 0 ? 'Per fare il conto mi manca un dato'
      : `IMU ${e.anno}: ${eur(e.unica)}${e.completo ? '' : ' (finora)'}`;
  const sotto = vuoto ? 'Comune, categoria catastale, rendita e uso: con questi dati calcolo base imponibile, aliquota, detrazioni e le righe del modello F24.'
    : e.divisibile && e.unica > 0 ? `Acconto ${eur(e.acconto)} entro il 16 giugno, saldo ${eur(e.saldo)} entro il 16 dicembre. Oppure tutto in una volta entro il 16 giugno.`
      : !e.completo ? 'Per qualche immobile mi manca un dato: lo trovi indicato qui sotto.' : '';
  const dati = indice ? `Aliquote: prospetti pubblicati dal Dipartimento delle Finanze, letti il ${esc(Object.values(indice.letto || {}).sort().at(-1) ? lungo(Object.values(indice.letto).sort().at(-1)) : lungo(indice.aggiornato))}.` : '';
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${tono}">
      <div class="occhiello">${vuoto ? 'Inizia da qui' : 'Il conto'}</div>
      <p class="titolo">${esc(titolo)}</p>
      ${sotto ? `<p>${esc(sotto)}</p>` : ''}
    </section>
    ${vuoto ? '' : `<section class="pannello" aria-labelledby="t-imm"><div class="occhiello">Immobile per immobile</div><h2 id="t-imm">Come si arriva al conto</h2>${tabellaImmobili(e)}</section>`}
    ${e.unica > 0 ? `<section class="pannello" aria-labelledby="t-f24"><div class="occhiello">Pronto da copiare</div><h2 id="t-f24">Il modello F24</h2>${tabellaF24(e)}</section>` : ''}
    ${e.unica > 0 && e.scadenze.length ? `<section class="pannello" aria-labelledby="t-scad"><div class="occhiello">Le date</div><h2 id="t-scad">Le scadenze</h2>
      <ul class="scadenze">${e.scadenze.map((s) => `<li class="${s.scaduta ? 'scaduta' : s.giorniMancanti <= 10 ? 'vicina' : ''}"><span class="quando">${esc(data(s.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}<small>${s.scaduta ? 'passata' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con Quanto pago di IMU?: verifica sempre importi e date.` }, { conIcs: !incorporata() })}</span></li>`).join('')}</ul>
      ${e.scadenze.some((s) => s.scaduta) ? '<p class="aiuto">Se una rata è passata e non l\'hai pagata, puoi rimediare con il ravvedimento operoso (sanzione ridotta e interessi): chiedi all\'ufficio tributi del Comune o a un CAF.</p>' : ''}</section>` : ''}
    ${e.avvisi.length && !vuoto ? `<section class="pannello"><div class="occhiello">Da sapere</div><ul class="passi">${e.avvisi.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></section>` : ''}
    <section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(lungo(e.verificato))}</div><ul class="fonti">${e.fonti.map((f) => `<li>${fonte(f)}</li>`).join('')}</ul><p class="aiuto">${dati}</p></section>`;
  $$('[data-ordina]').forEach((b) => b.addEventListener('click', () => { ordine = { col: b.dataset.ordina, giu: ordine.col === b.dataset.ordina ? !ordine.giu : false }; calcola(); }));
  $$('[data-rata]').forEach((b) => b.addEventListener('click', () => { rata = b.dataset.rata; calcola(); }));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  $('#copia-f24')?.addEventListener('click', () => copia(testoF24(e), $('#esito-copia')));
}

function cambia() {
  $('#avviso-esempio').hidden = !esempio;
  if (!esempio) memoria.scrivi(stato);
  calcola().catch((err) => { $('#esito').innerHTML = `<section class="pannello verdetto" data-tono="forse"><p class="titolo">Non riesco a caricare le aliquote</p><p>${esc(err.message)}. Riprova tra poco.</p></section>`; });
}

function ridisegna() {
  $$('input[name="anno"]').forEach((r) => { r.checked = Number(r.value) === stato.anno; });
  disegnaImmobili();
  cambia();
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', async () => {
  await caricaIndice().catch(() => null);
  stato = structuredClone(ESEMPI[b.dataset.esempio]);
  esempio = true;
  ridisegna();
}));
$('#esci-esempio').addEventListener('click', () => { stato = memoria.leggi(null) || { anno: 2026, immobili: [{ tipo: 'fabbricato', quota: 100 }] }; esempio = false; ridisegna(); });
$('#cancella').addEventListener('click', () => { memoria.cancella(); stato = { anno: 2026, immobili: [{ tipo: 'fabbricato', quota: 100 }] }; esempio = false; ridisegna(); });

// Per chi usa l'assistente AI: il testo dell'esito
window.imuTesto = () => (ultimo ? testoEsito(ultimo) : '');

caricaIndice().then(() => ridisegna()).catch(() => ridisegna());
