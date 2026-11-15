// Interfaccia di «Quanto risparmi in bolletta?». Tutto gira nel browser: consumi e spese restano sul
// dispositivo; nell'indirizzo della pagina va al massimo il codice ISTAT del Comune (#istat=058091).

import { $, $$, esc, eur } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { montaFoto } from '../src/comune/foto.js';
import { SEZIONI, DOMANDE, profiloDa } from '../src/domande.js';
import { confronta, exCassaMezzogiorno, CAMBIO, FONTI, VERIFICATO, TIPI } from '../src/regole.js';
import PARAMETRI from '../src/dati/parametri.js';

const ESEMPI = {
  famiglia: { fornitura: 'entrambe', consumo_luce: 2700, potenza: '3', residente: true, consumo_gas: 1400, riscaldamento: true, come_paghi: 'spesa', spesa_luce: 950, spesa_gas: 2300, tipo_prezzo: 'tutte', _istat: '058091' },
  single: { fornitura: 'luce', consumo_luce: 1500, potenza: '3', residente: true, come_paghi: 'prezzo', prezzo_luce: 0.18, fissa_luce: 12, tipo_prezzo: 'tutte', _istat: '015146' },
  seconda: { fornitura: 'luce', consumo_luce: 800, potenza: '3', residente: false, come_paghi: 'non_so', tipo_prezzo: 'F', _istat: '090064' },
};

// ---------- dati ----------

const cache = {};
const offerte = (f) => (cache[f] ||= fetch(new URL(`../dati/${f}.json`, import.meta.url)).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }));
let comuni = null;
const caricaComuni = async () => (comuni ||= (await import('../src/dati/comuni.js')).default.map(([istat, nome, sigla, regione]) => ({ istat, nome, sigla, regione, n: norm(nome) })));
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;

function cercaComune(elenco, testo, limite = 8) {
  let t = norm(testo), sigla = '';
  const m = t.match(/^(.*?)\s+([a-z]{2})$/);
  if (m && elenco.some((c) => c.sigla.toLowerCase() === m[2] && c.n.startsWith(m[1]))) { t = m[1]; sigla = m[2].toUpperCase(); }
  if (!t) return [];
  const punti = (c) => (c.n === t ? 3 : c.n.startsWith(t) ? 2 : c.n.includes(` ${t}`) ? 1 : -1);
  return elenco.filter((c) => (!sigla || c.sigla === sigla) && punti(c) >= 0).sort((a, b) => punti(b) - punti(a) || a.nome.localeCompare(b.nome)).slice(0, limite);
}

// ---------- il questionario ----------

const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'bollette-v1', alCambio: disegna });

const box = document.createElement('div');
box.className = 'domanda cerca-ente';
box.id = 'd-comune';
box.innerHTML = `
  <label for="cerca-comune">Comune</label>
  <input type="text" id="cerca-comune" placeholder="es. Bologna, Bari, Castro LE" autocomplete="off" aria-controls="risultati-comuni" enterkeyhint="search">
  <ul class="risultati-enti" id="risultati-comuni" hidden></ul>
  <div id="comune-scelto"></div>`;
$('#s-dove h2').after(box);

let attesa, trovati = [];
$('#cerca-comune').addEventListener('focus', () => { caricaComuni().catch(() => {}); });
$('#cerca-comune').addEventListener('input', (e) => {
  clearTimeout(attesa);
  attesa = setTimeout(async () => {
    const lista = $('#risultati-comuni');
    if (e.target.value.trim().length < 2) { lista.hidden = true; return; }
    lista.hidden = false;
    try {
      trovati = cercaComune(await caricaComuni(), e.target.value);
      lista.innerHTML = trovati.length
        ? trovati.map((c, i) => `<li><button type="button" data-c="${i}">${esc(c.nome)}<small>${esc(`${c.sigla} · ${PARAMETRI.regioni[c.regione] || ''}`)}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessun Comune con questo nome: controlla come è scritto.</button></li>';
      $$('[data-c]', lista).forEach((b) => b.addEventListener('click', () => scegli(trovati[Number(b.dataset.c)])));
    } catch {
      lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
    }
  }, 120);
});
$('#cerca-comune').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (trovati[0]) scegli(trovati[0]); } });

function scegli(c, { aggiorna = true } = {}) {
  const r = modulo.risposte;
  r.comune = { istat: c.istat, nome: c.nome, sigla: c.sigla, regione: c.regione };
  r._inParte = exCassaMezzogiorno(c.regione, c.istat) === null;
  $('#risultati-comuni').hidden = true;
  $('#cerca-comune').value = '';
  try { history.replaceState(null, '', `#istat=${c.istat}`); } catch { /* niente */ }
  if (aggiorna) modulo.aggiorna();
}

function disegnaComune(c) {
  $('#comune-scelto').innerHTML = c
    ? `<div class="ente-scelto"><b>${esc(c.nome)} (${esc(c.sigla)})</b><span>${esc(PARAMETRI.regioni[c.regione] || '')}${PARAMETRI.ambiti_gas[c.regione] ? ` · ambito gas ${esc(PARAMETRI.nomi_ambiti[PARAMETRI.ambiti_gas[c.regione]])}` : ''}</span><span><button type="button" class="link" id="togli-comune">Cambia Comune</button></span></div>`
    : '';
  $('#togli-comune')?.addEventListener('click', () => { delete modulo.risposte.comune; modulo.aggiorna(); $('#cerca-comune').focus(); });
}

// ---------- l'esito ----------

const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const dataIt = (s) => new Date(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
const meseIt = (m) => { const [a, mm] = m.split('-').map(Number); return new Date(Date.UTC(a, mm - 1, 15)).toLocaleDateString('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' }); };
const tondi = (n) => eur(Math.round(n));
const NOMI_DATI = { consumo: 'il consumo annuo', comune: 'il Comune', potenza: 'la potenza impegnata', residente: 'se hai la residenza', fornitura: 'quale bolletta' };
const DOMANDA_DI = { consumo: (f) => `consumo_${f}`, potenza: () => 'potenza', residente: () => 'residente', fornitura: () => 'fornitura', comune: () => 'comune' };
const filtro = { luce: 'tutte', gas: 'tutte' };
const ordine = { luce: ['spesa', 1], gas: ['spesa', 1] };
let ultimi = {};
let giro = 0;

function schedaOfferta(x, esito, evidenzia) {
  const diff = esito.attuale ? esito.attuale.totale - x.spesa : null;
  const v = x.voci;
  const righe = [
    ['Materia prima e spread', v.energia], ['Commercializzazione', v.commercializzazione], ['Dispacciamento', v.dispacciamento],
    ['Una tantum', v.unaTantum], ['Sconti senza condizioni', -v.sconti], ['Trasporto e contatore', v.rete], ['Oneri di sistema', v.oneri],
    ['Accise', v.accise], ['Addizionale regionale', v.addizionale], ['IVA', v.iva], ['Sconti dopo l\'IVA', -v.scontiDopoIva],
  ].filter(([, n]) => Math.abs(n) >= 0.5);
  return `<article class="offerta" ${evidenzia ? 'data-tono="si"' : ''}>
    <p class="occhiello">${esc(TIPI[x.tipo])}${x.indice ? ` · ${esc(x.indice)}` : ''}${x.durata > 0 ? ` · condizioni per ${x.durata} mesi` : ''}</p>
    <h3>${esc(x.nome)}</h3>
    <p style="margin:0">${esc(x.venditore)}</p>
    <p style="margin:6px 0 0"><span class="spesa">${tondi(x.spesa)}</span> l'anno${x.margine ? ` <small>(stima: tra ${tondi(x.margine[0])} e ${tondi(x.margine[1])})</small>` : ''}${diff != null ? ` · <b>${diff >= 0 ? `risparmi ${tondi(diff)}` : `spendi ${tondi(-diff)} in più`}</b>` : ''}</p>
    ${x.onereRecesso ? '<p class="aiuto">Prevede un onere se recedi prima della scadenza: leggi la scheda sintetica.</p>' : ''}
    <details><summary>Dettagli, condizioni e come attivarla</summary>
      <dl>
        <dt>Codice offerta</dt><dd class="codice">${esc(x.codice)}</dd>
        <dt>Valida fino al</dt><dd>${esc(dataIt(x.scade))}</dd>
        ${x.attivazione.length ? `<dt>Si attiva</dt><dd>${esc(x.attivazione.join(', '))}</dd>` : ''}
        ${x.pagamento.length ? `<dt>Pagamento</dt><dd>${esc(x.pagamento.join(', '))}</dd>` : ''}
        ${x.garanzie ? `<dt>Garanzie</dt><dd>${esc(x.garanzie)}</dd>` : ''}
        ${x.scontiCondizionati.length ? `<dt>Altri sconti</dt><dd>${esc(x.scontiCondizionati.join('; '))} (non conteggiati)</dd>` : ''}
        ${x.opzionali.length ? `<dt>Servizi a scelta</dt><dd>${esc(x.opzionali.join('; '))} (non conteggiati)</dd>` : ''}
        ${x.condizioni.map((c) => `<dt>${esc(c.tipo)}${c.limitante ? ' (limitante)' : ''}</dt><dd>${esc(c.testo)}</dd>`).join('')}
      </dl>
      <ul class="scomposizione">${righe.map(([t, n]) => `<li><span>${esc(t)}</span><span>${eur(Math.round(n * 100) / 100)}</span></li>`).join('')}<li><b>Totale stimato</b><b>${eur(x.spesa)}</b></li></ul>
      ${x.note.length ? `<p class="aiuto">${esc(x.note.join(' '))}</p>` : ''}
      <p class="azioni-doc">${x.url ? `<a class="btn btn-primario" href="${esc(x.url)}" target="_blank" rel="noopener">La pagina dell'offerta</a>` : ''}${x.telefono ? `<a class="btn" href="tel:${esc(x.telefono.replace(/[^\d+]/g, ''))}">Telefono ${esc(x.telefono)}</a>` : ''}<a class="btn" href="${esc(FONTI.portale.url)}" target="_blank" rel="noopener">Verifica sul Portale Offerte</a></p>
    </details>
  </article>`;
}

function righeTabella(f) {
  const e = ultimi[f];
  if (!e) return '';
  const [k, verso] = ordine[f];
  const lista = e.elenco.filter((x) => filtro[f] === 'tutte' || x.tipo === filtro[f]).slice(0, 60)
    .sort((a, b) => (typeof a[k] === 'string' ? a[k].localeCompare(b[k]) : (a[k] ?? 0) - (b[k] ?? 0)) * verso);
  return lista.map((x) => `<tr><td>${esc(x.venditore)}<small>${esc(x.nome)}</small></td><td>${x.tipo === 'F' ? 'fisso' : 'variabile'}</td><td class="n">${x.durata > 0 ? x.durata + ' mesi' : '—'}</td><td class="n">${tondi(x.spesa)}${x.margine ? '*' : ''}</td><td class="n">${e.attuale ? tondi(e.attuale.totale - x.spesa) : '—'}</td></tr>`).join('');
}

function pannelloFornitura(f, e, r) {
  const nome = f === 'luce' ? 'la luce' : 'il gas';
  if (e.stato === 'dato') {
    return `<section class="pannello verdetto" data-tono="neutro"><div class="occhiello">${f === 'luce' ? 'Luce' : 'Gas'}</div><p class="titolo">Serve un dato</p>
      <p>Per stimare la spesa per ${nome} mi manca: ${esc(e.manca.map((m) => NOMI_DATI[m] || m).join(', '))}.</p>
      <p>${e.manca.map((m) => `<button type="button" class="vai-a" data-vai="${esc(DOMANDA_DI[m]?.(f) || m)}">Rispondi: ${esc(NOMI_DATI[m] || m)}</button>`).join(' ')}</p></section>`;
  }
  if (e.stato === 'fuori') return `<section class="pannello verdetto" data-tono="forse"><div class="occhiello">Gas</div><p class="titolo">Qui il calcolo non è affidabile</p><p>${esc(e.motivo)}</p><p class="azioni-doc"><a class="btn" href="${esc(FONTI.portale.url)}" target="_blank" rel="noopener">Apri il Portale Offerte</a></p></section>`;
  const pref = r.tipo_prezzo && r.tipo_prezzo !== 'tutte' ? r.tipo_prezzo : null;
  const migliore = pref ? e.migliori[pref] : [e.migliori.F, e.migliori.V].filter(Boolean).sort((a, b) => a.spesa - b.spesa)[0];
  const risp = e.attuale && migliore ? e.attuale.totale - migliore.spesa : null;
  const tono = risp == null ? 'forse' : risp > 20 ? 'si' : 'neutro';
  const idx = f === 'luce' ? e.indici.PUN : e.indici.PSV;
  const titolo = !migliore ? 'Nessuna offerta stimabile per questo profilo'
    : risp == null ? `L'offerta più conveniente costa circa ${tondi(migliore.spesa)} l'anno`
      : risp > 20 ? `Puoi risparmiare circa ${tondi(risp)} l'anno sul${f === 'luce' ? 'la luce' : ' gas'}`
        : risp >= -20 ? 'Paghi già più o meno quanto le offerte più convenienti' : `Le offerte che vedi costano più di quanto paghi oggi`;
  const reg = e.regolate;
  const escluse = e.escluse;
  const tipi = pref ? [pref] : ['F', 'V'];
  return `<section class="pannello verdetto" data-tono="${tono}">
      <div class="occhiello">${f === 'luce' ? 'Luce' : 'Gas'} · ${esc(String(e.profilo.consumo).replace(/\B(?=(\d{3})+(?!\d))/g, '.'))} ${f === 'luce' ? 'kWh' : 'Smc'} l'anno</div>
      <p class="titolo">${esc(titolo)}</p>
      ${e.attuale ? `<p>Oggi paghi circa <b>${tondi(e.attuale.totale)}</b> l'anno (${esc(e.attuale.testo)}).</p>` : '<p>Scrivi quanto paghi oggi per sapere quanto risparmi.</p>'}
      <div class="cifre-bolletta">
        ${tipi.map((t) => e.migliori[t] ? `<div><small>Migliore a prezzo ${t === 'F' ? 'fisso' : 'variabile'}</small><b>${tondi(e.migliori[t].spesa)}</b><small>${esc(e.migliori[t].venditore)}${e.risparmio?.[t] != null ? ` · ${e.risparmio[t] >= 0 ? 'risparmi' : 'in più'} ${tondi(Math.abs(e.risparmio[t]))}` : ''}</small></div>` : '').join('')}
        <div><small>Uguale per tutte le offerte</small><b>${tondi(reg.rete + reg.oneri + reg.accise + reg.addizionale)}</b><small>trasporto, oneri, accise (più IVA)</small></div>
      </div>
      <p class="aiuto">Le variabili sono stimate con il ${f === 'luce' ? 'PUN' : 'PSV'} di ${esc(meseIt(idx.mese))}: ${esc(String(idx.valore).replace('.', ','))} ${esc(idx.unita)} (${fonte({ titolo: 'fonte', url: idx.url })}). Il Portale usa le quotazioni future: il margine dice quanto cambierebbe la spesa se l'indice tornasse al minimo o al massimo degli ultimi 12 mesi.${idx.approssimato ? ' ' + esc(idx.approssimato) + '.' : ''}</p>
    </section>
    <section class="pannello" aria-labelledby="t-top-${f}">
      <div class="occhiello">Dal Portale Offerte, offerte valide il ${esc(dataIt(e.aggiornato))}</div>
      <h2 id="t-top-${f}">Le più convenienti per ${nome}</h2>
      ${tipi.map((t) => { const l = e.elenco.filter((x) => x.tipo === t).slice(0, 3); return l.length ? `<h3 style="margin:14px 0 0">A prezzo ${t === 'F' ? 'fisso' : 'variabile'}</h3>${l.map((x, i) => schedaOfferta(x, e, i === 0)).join('')}` : ''; }).join('')}
    </section>
    <section class="pannello" aria-labelledby="t-tab-${f}">
      <h2 id="t-tab-${f}">Tutte le offerte stimate (${e.elenco.length})</h2>
      <div class="filtri-offerte" role="group" aria-label="Tipo di prezzo">${[['tutte', 'Tutte'], ['F', 'Fisso'], ['V', 'Variabile']].map(([k, t]) => `<button type="button" data-filtro="${f}:${k}" aria-pressed="${filtro[f] === k}">${t}</button>`).join('')}</div>
      <div class="tabella-scorre"><table class="offerte-tab" id="tab-${f}"><thead><tr>
        <th data-k="venditore"><button type="button">Venditore e offerta</button></th><th data-k="tipo"><button type="button">Prezzo</button></th>
        <th class="n" data-k="durata"><button type="button">Durata</button></th><th class="n" data-k="spesa" aria-sort="ascending"><button type="button">Spesa l'anno</button></th>
        <th class="n" data-k="spesa"><button type="button">Risparmio</button></th></tr></thead><tbody>${righeTabella(f)}</tbody></table></div>
      <p class="aiuto">Le prime 60. * stima con margine (prezzo variabile o accisa da confermare). Non conteggiate: ${escluse.zona} offerte non disponibili nel tuo Comune, ${escluse.residenza + escluse.consumo + escluse.potenza} non adatte al tuo profilo, ${escluse.non_stimabili} che qui non possiamo stimare in modo affidabile${Object.keys(escluse.motivi).length ? ` (${esc(Object.entries(escluse.motivi).map(([m, n]) => `${m}: ${n}`).join('; '))})` : ''}: per queste usa il Portale Offerte.</p>
      <ul class="scomposizione"><li><span>Trasporto e gestione del contatore${reg.ambito ? ` (ambito ${esc(reg.ambito)})` : ''}</span><span>${eur(reg.rete)}</span></li><li><span>Oneri di sistema</span><span>${eur(reg.oneri)}</span></li><li><span>Accise${f === 'luce' && reg.kwhTassati != null ? ` (su ${reg.kwhTassati} kWh)` : ''}</span><span>${eur(reg.accise)}</span></li>${f === 'gas' ? `<li><span>Addizionale regionale</span><span>${eur(reg.addizionale)}</span></li>` : ''}</ul>
      ${e.note.length ? `<p class="aiuto">${esc(e.note.join(' '))}</p>` : ''}
    </section>`;
}

async function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  disegnaComune(r.comune);
  const forniture = r.fornitura === 'entrambe' ? ['luce', 'gas'] : r.fornitura ? [r.fornitura] : [];
  const verificato = dataIt(VERIFICATO);
  if (!forniture.length) {
    giro++;
    $('#esito').innerHTML = `<section class="pannello verdetto" data-tono="neutro"><div class="occhiello">Inizia da qui</div><p class="titolo">Scegli la bolletta da confrontare</p>
      <p>Ti servono il consumo annuo e, per la luce, la potenza impegnata: sono scritti in bolletta. Il calcolo segue le regole del Portale Offerte di ARERA, con trasporto, oneri, accise e IVA.</p></section>${pannelloCambio()}`;
    return;
  }
  const turno = ++giro;
  if (!forniture.every((f) => cache[f]?.pronto)) $('#esito').innerHTML = '<section class="pannello"><p>Carico le offerte del Portale…</p></section>';
  let dati;
  try { dati = await Promise.all(forniture.map(offerte)); forniture.forEach((f) => { cache[f].pronto = true; }); } catch {
    if (turno === giro) $('#esito').innerHTML = '<section class="pannello verdetto" data-tono="forse"><p class="titolo">Non riesco a caricare le offerte</p><p>Controlla la connessione e riprova.</p></section>';
    return;
  }
  if (turno !== giro) return; // nel frattempo sono cambiate le risposte
  ultimi = {};
  forniture.forEach((f, i) => { ultimi[f] = confronta(profiloDa(r, f, r.comune), dati[i]); });
  const tot = forniture.every((f) => ultimi[f].stato === 'ok' && ultimi[f].attuale) && forniture.length === 2
    ? forniture.reduce((s, f) => { const m = [ultimi[f].migliori.F, ultimi[f].migliori.V].filter(Boolean).sort((a, b) => a.spesa - b.spesa)[0]; return s + (m ? ultimi[f].attuale.totale - m.spesa : 0); }, 0) : null;
  $('#esito').innerHTML = `
    ${tot != null ? `<section class="pannello verdetto" data-tono="${tot > 20 ? 'si' : 'neutro'}"><div class="occhiello">Luce e gas insieme</div><p class="titolo">${tot > 20 ? `In tutto puoi risparmiare circa ${tondi(tot)} l'anno` : 'Paghi già più o meno quanto le offerte più convenienti'}</p><p>Con l'offerta più conveniente per ciascuna fornitura, anche di venditori diversi.</p></section>` : ''}
    ${forniture.map((f) => pannelloFornitura(f, ultimi[f], r)).join('')}
    ${pannelloCambio()}
    <section class="pannello"><div class="occhiello">Altri diritti</div><h2>Bonus e bollette vecchie</h2>
      <ul class="controlli">
        <li class="c-si"><span class="segno" aria-hidden="true">✓</span><div><b>Bonus sociale luce e gas.</b> Con un ISEE basso lo sconto in bolletta arriva in automatico, qualunque sia il venditore: se cambi, non lo perdi. <a href="${esc(altroStrumento('mi-spetta'))}">Controlla con Mi spetta</a></div></li>
        <li class="c-si"><span class="segno" aria-hidden="true">✓</span><div><b>Consumi di più di due anni fa.</b> Per luce e gas di casa puoi non pagare gli importi fatturati con oltre due anni di ritardo. <a href="${esc(altroStrumento('mi-rimborsano'))}">Prepara la contestazione con Mi rimborsano?</a></div></li>
      </ul></section>
    <section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${[...new Map([...forniture.flatMap((f) => ultimi[f].fonti), ...Object.values(FONTI).filter((x) => /Atlante/.test(x.titolo))].map((x) => [x.url, x])).values()].map((x) => `<li>${fonte(x)}</li>`).join('')}</ul></section>`;
  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => (b.dataset.vai === 'comune' ? $('#cerca-comune').focus() : vaiA(b.dataset.vai))));
  $$('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
    const [f, k] = b.dataset.filtro.split(':');
    filtro[f] = k;
    $$(`[data-filtro^="${f}:"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $(`#tab-${f} tbody`).innerHTML = righeTabella(f);
  }));
  for (const f of forniture) {
    const t = $(`#tab-${f}`);
    if (!t) continue;
    $$('th button', t).forEach((b) => b.addEventListener('click', () => {
      const th = b.closest('th');
      const verso = th.getAttribute('aria-sort') === 'ascending' ? -1 : 1;
      $$('th', t).forEach((x) => x.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', verso > 0 ? 'ascending' : 'descending');
      ordine[f] = [th.dataset.k, th.textContent.includes('Risparmio') ? -verso : verso];
      $('tbody', t).innerHTML = righeTabella(f);
    }));
  }
}

function vaiA(id) {
  const el = document.getElementById('d-' + id);
  if (!el) return;
  el.hidden = false;
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  el.querySelector('input, select, textarea, button')?.focus({ preventScroll: true });
}

function pannelloCambio() {
  return `<section class="pannello"><div class="occhiello">Come si cambia fornitore</div><h2>Gratis, senza interruzioni, con un contratto</h2>
    <ol class="passi">${CAMBIO.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)} <a href="${esc(p.fonte.url)}" target="_blank" rel="noopener">Fonte</a></li>`).join('')}</ol>
    <p class="aiuto">Ti serve il codice POD (luce) o PDR (gas): è in bolletta. Prima di firmare leggi la scheda sintetica dell'offerta.</p></section>`;
}

// ---------- esempi, memoria, foto ----------

async function comuneDa(istat) {
  const c = (await caricaComuni()).find((x) => x.istat === istat);
  return c ? { istat: c.istat, nome: c.nome, sigla: c.sigla, regione: c.regione } : undefined;
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', async () => {
  const { _istat, ...es } = ESEMPI[b.dataset.esempio];
  const comune = await comuneDa(_istat).catch(() => undefined);
  modulo.imposta({ ...es, comune, _inParte: comune ? exCassaMezzogiorno(comune.regione, comune.istat) === null : false }, { esempio: true });
}));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => { modulo.azzera(); try { history.replaceState(null, '', location.pathname); } catch { /* niente */ } });

(async () => {
  const ancora = /(?:^|[#&])istat=(\d{6})/.exec(location.hash)?.[1];
  if (ancora && modulo.risposte.comune?.istat !== ancora) {
    const c = await comuneDa(ancora).catch(() => undefined);
    if (c) { scegli(c, { aggiorna: false }); modulo.aggiorna(); return; }
  }
  modulo.aggiorna();
})();

montaFoto({
  contenitore: $('#foto'), strumento: 'Quanto risparmi in bolletta?', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'la bolletta della luce o del gas (prima e seconda pagina)',
  note: 'Leggi solo: consumo annuo (kWh per la luce, Smc per il gas), potenza impegnata, se il cliente è domestico residente, la spesa annua sostenuta e il prezzo della componente energia o gas con la quota fissa. Non trascrivere codice POD, PDR, nome, indirizzo o codice cliente.',
  alRisultato: (x) => modulo.imposta({ ...modulo.risposte, ...x }),
});
