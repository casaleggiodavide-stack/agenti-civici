// Interfaccia di «Mi spetta». Tutto gira nel browser: nessuna richiesta di rete
// dopo il caricamento, nessun dato inviato.

import { valuta, valoreAnnuo } from '../src/motore.js';
import { SEZIONI, DOMANDE, CONDIZIONI_18_21, etaDa } from '../src/situazione.js';
import { pulsantiCalendario, scaricaIcs, dentroClaude } from '../src/comune/calendario.js';

const CHIAVE = 'mi-spetta-risposte-v1';
const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const OGGI = new Date();

const ESEMPI = {
  famiglia: {
    eta: 36, cittadinanza: 'italiana', anni_residenza: 36, coniuge: true, coniuge_eta: 38,
    figli: [{ nascita: '2022-05' }, { nascita: '2026-03' }], sei_madre: true, altri_adulti: 0, disabile_nucleo: false,
    isee: 16000, reddito_personale: 14000, reddito_coniuge: 21000, reddito_familiare: 35000, patrimonio_mobiliare: 4000, altri_immobili: 0,
    lavoro: 'dipendente_indeterminato', casa: 'affitto', canone_annuo: 7800, contratto_registrato: true, utenze_intestate: true,
  },
  pensionata: {
    eta: 78, cittadinanza: 'italiana', anni_residenza: 78, coniuge: false, figli: [], altri_adulti: 0, disabile_nucleo: false,
    isee: 8200, reddito_personale: 7600, reddito_familiare: 7600, patrimonio_mobiliare: 5000, altri_immobili: 0,
    lavoro: 'pensionato', anni_contributi: 17, pensione_tipo: 'minima', casa: 'proprieta', utenze_intestate: true,
  },
  giovane: {
    eta: 26, cittadinanza: 'italiana', anni_residenza: 26, coniuge: false, figli: [], altri_adulti: 0, disabile_nucleo: false,
    isee: 14000, reddito_personale: 13500, reddito_familiare: 13500, patrimonio_mobiliare: 3000, altri_immobili: 0,
    lavoro: 'dipendente_determinato', casa: 'affitto', canone_annuo: 6000, contratto_registrato: true, utenze_intestate: true,
  },
  disoccupato: {
    eta: 44, cittadinanza: 'extra_ue_lungo', anni_residenza: 12, coniuge: true, coniuge_eta: 41,
    figli: [{ nascita: '2014-09' }, { nascita: '2019-02' }], sei_madre: false, altri_adulti: 0, disabile_nucleo: false,
    isee: 7000, reddito_personale: 9000, reddito_coniuge: 0, reddito_familiare: 9000, patrimonio_mobiliare: 2500, altri_immobili: 0,
    lavoro: 'disoccupato', perso_lavoro: true, contributi_13_settimane: true, casa: 'affitto', canone_annuo: 5400, contratto_registrato: true, utenze_intestate: true,
  },
};

let risposte = carica();
let inEsempio = false;

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function carica() {
  try {
    const t = localStorage.getItem(CHIAVE);
    return t ? JSON.parse(t) : {};
  } catch {
    return {};
  }
}
function salva() {
  if (inEsempio) return;
  try { localStorage.setItem(CHIAVE, JSON.stringify(risposte)); } catch { /* archivio non disponibile */ }
}

// ---------- Questionario ----------

function campo(d) {
  const id = 'q-' + d.id;
  const aiuto = d.aiuto ? `<p class="aiuto" id="${id}-aiuto">${esc(d.aiuto)}</p>` : '';
  const desc = d.aiuto ? ` aria-describedby="${id}-aiuto"` : '';
  if (d.tipo === 'numero') {
    return `<label for="${id}">${esc(d.etichetta)}</label>${aiuto}
      <input class="numero" type="number" inputmode="${d.passo ? 'decimal' : 'numeric'}" id="${id}" name="${d.id}" min="${d.min ?? 0}" max="${d.max ?? 999}"${d.passo ? ` step="${d.passo}"` : ''}${desc}>`;
  }
  if (d.tipo === 'elenco') {
    return `<label for="${id}">${esc(d.etichetta)}</label>${aiuto}
      <select id="${id}" name="${d.id}"${desc}><option value="">Non indicata</option>${d.opzioni.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select>`;
  }
  if (d.tipo === 'euro') {
    return `<label for="${id}">${esc(d.etichetta)}</label>${aiuto}
      <div class="euro"><input type="text" inputmode="numeric" id="${id}" name="${d.id}" placeholder="es. 15.000"${desc}></div>`;
  }
  if (d.tipo === 'si_no') {
    return `<span class="etichetta" id="${id}-et">${esc(d.etichetta)}</span>${aiuto}
      <div class="si-no" role="radiogroup" aria-labelledby="${id}-et">
        <label><input type="radio" id="${id}-si" name="${d.id}" value="si"> Sì</label>
        <label><input type="radio" id="${id}-no" name="${d.id}" value="no"> No</label>
      </div>`;
  }
  if (d.tipo === 'scelta') {
    return `<span class="etichetta" id="${id}-et">${esc(d.etichetta)}</span>${aiuto}
      <div class="scelte" role="radiogroup" aria-labelledby="${id}-et">
        ${d.opzioni.map(([v, t], i) => `<label><input type="radio" id="${id}-${i}" name="${d.id}" value="${v}"> ${esc(t)}</label>`).join('')}
      </div>`;
  }
  if (d.tipo === 'figli') {
    return `<span class="etichetta">${esc(d.etichetta)}</span>${aiuto}
      <div class="figli" id="figli"></div>
      <button type="button" class="aggiungi" id="aggiungi-figlio">Aggiungi un figlio</button>
      <div class="si-no"><label><input type="checkbox" id="nessun-figlio"> Non ho figli nel nucleo</label></div>`;
  }
  return '';
}

function costruisciQuestionario() {
  const form = $('#questionario');
  form.innerHTML = SEZIONI.map((s, i) => `
    <section class="sezione" id="s-${s.id}" aria-labelledby="t-${s.id}">
      <h2 id="t-${s.id}"><span class="n">${i + 1} di ${SEZIONI.length}</span>${esc(s.titolo)}</h2>
      ${DOMANDE.filter((d) => d.sezione === s.id).map((d) => `<div class="domanda" id="d-${d.id}" data-id="${d.id}">${campo(d)}</div>`).join('')}
    </section>`).join('');

  form.addEventListener('input', aggiornaDaForm);
  form.addEventListener('change', aggiornaDaForm);
  $('#aggiungi-figlio').addEventListener('click', () => {
    risposte.figli = [...(risposte.figli || []), { nascita: '' }];
    disegnaFigli();
    const ultimi = document.querySelectorAll('.figlio input[type="month"]');
    ultimi[ultimi.length - 1]?.focus();
    ricalcola();
  });
}

function riempiForm() {
  for (const d of DOMANDE) {
    const v = risposte[d.id];
    if (d.tipo === 'numero') $('#q-' + d.id).value = v ?? '';
    else if (d.tipo === 'euro') $('#q-' + d.id).value = v === undefined || v === null ? '' : Number(v).toLocaleString('it-IT');
    else if (d.tipo === 'si_no') {
      $('#q-' + d.id + '-si').checked = v === true;
      $('#q-' + d.id + '-no').checked = v === false;
    } else if (d.tipo === 'scelta') {
      d.opzioni.forEach(([val], i) => { $('#q-' + d.id + '-' + i).checked = v === val; });
    } else if (d.tipo === 'elenco') $('#q-' + d.id).value = v ?? '';
  }
  $('#nessun-figlio').checked = Array.isArray(risposte.figli) && risposte.figli.length === 0;
  disegnaFigli();
}

function disegnaFigli() {
  const box = $('#figli');
  const figli = risposte.figli || [];
  box.innerHTML = figli.map((f, i) => {
    const e = etaDa(f.nascita, OGGI);
    const tra18e21 = e && e.anni >= 18 && e.anni < 21;
    return `<div class="figlio" data-i="${i}">
      <label>Nato o nata nel <input type="month" id="figlio-${i}-nascita" value="${esc(f.nascita || '')}" max="${OGGI.toISOString().slice(0, 7)}" aria-label="Mese e anno di nascita del figlio ${i + 1}"></label>
      <span class="quanti" id="figlio-${i}-eta">${e ? (e.anni < 1 ? e.mesi + ' mesi' : e.anni + (e.anni === 1 ? ' anno' : ' anni')) : ''}</span>
      <label><input type="checkbox" id="figlio-${i}-disabile" ${f.disabile ? 'checked' : ''}> con disabilità</label>
      <select id="figlio-${i}-condizione" aria-label="Cosa fa il figlio ${i + 1} tra 18 e 21 anni" ${tra18e21 ? '' : 'hidden'}>
        <option value="">Cosa fa oggi?</option>
        ${CONDIZIONI_18_21.map(([v, t]) => `<option value="${v}" ${f.condizione === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}
      </select>
      <button type="button" class="togli" data-togli="${i}">Togli</button>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-togli]').forEach((b) => b.addEventListener('click', () => {
    risposte.figli.splice(Number(b.dataset.togli), 1);
    disegnaFigli();
    ricalcola();
  }));
}

function leggiNumero(t) {
  const s = String(t).trim();
  if (!s) return undefined;
  const n = Number(s.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function aggiornaDaForm(ev) {
  const t = ev.target;
  if (t.id === 'nessun-figlio') {
    risposte.figli = t.checked ? [] : risposte.figli && risposte.figli.length ? risposte.figli : undefined;
    if (t.checked) disegnaFigli();
  } else if (t.closest('.figlio')) {
    const i = Number(t.closest('.figlio').dataset.i);
    const f = risposte.figli[i];
    if (t.type === 'month') {
      f.nascita = t.value;
      const e = etaDa(t.value, OGGI);
      $('#figlio-' + i + '-eta').textContent = e ? (e.anni < 1 ? e.mesi + ' mesi' : e.anni + (e.anni === 1 ? ' anno' : ' anni')) : '';
      $('#figlio-' + i + '-condizione').hidden = !(e && e.anni >= 18 && e.anni < 21);
      $('#nessun-figlio').checked = false;
    } else if (t.type === 'checkbox') f.disabile = t.checked;
    else if (t.tagName === 'SELECT') f.condizione = t.value || undefined;
  } else if (t.name) {
    const d = DOMANDE.find((x) => x.id === t.name);
    if (!d) return;
    if (d.tipo === 'numero') risposte[d.id] = t.value === '' ? undefined : Number(t.value);
    else if (d.tipo === 'euro') risposte[d.id] = leggiNumero(t.value);
    else if (d.tipo === 'si_no') risposte[d.id] = t.value === 'si';
    else if (d.tipo === 'scelta') risposte[d.id] = t.value;
    else if (d.tipo === 'elenco') risposte[d.id] = t.value || undefined;
  }
  if (inEsempio) esciDaEsempio(false);
  ricalcola();
}

function aggiornaVisibilita() {
  for (const d of DOMANDE) {
    const el = $('#d-' + d.id);
    const vis = !d.visibile || d.visibile(risposte);
    el.hidden = !vis;
    if (!vis && risposte[d.id] !== undefined) delete risposte[d.id];
  }
}

// ---------- Risultati ----------

const ETICHETTE_DATI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));

function importoHtml(r) {
  const i = r.importo;
  if (!i) return '';
  if (i.annuo) return `${euro.format(i.annuo)}<small>${i.mensile ? euro.format(i.mensile) + ' al mese' : 'all\'anno'}</small>`;
  if (i.unaTantum) return `${euro.format(i.unaTantum)}<small>una tantum</small>`;
  if (i.breve) return `<small>${esc(i.breve)}</small>`;
  return '';
}

function scheda(r, aperta = false) {
  const segno = (ok) => (ok === true ? ['r-si', '✓'] : ok === false ? ['r-no', '✗'] : ['r-nd', '?']);
  const mancano = r.mancano.length && r.esito !== 'non_spetta'
    ? `<p class="mancano">Per saperlo: ${r.mancano.map((m) => `<button type="button" data-vai="${esc(m)}">${esc(ETICHETTE_DATI[m] || m)}</button>`).join(', ')}</p>` : '';
  const apertaFinoA = r.finestra && r.finestra.a && r.esito !== 'chiusa' && r.esito !== 'non_spetta' ? r.finestra.a : null;
  const finestra = r.finestra ? `<h4>Quando</h4><p>${esc(r.finestra.testo)}</p>${apertaFinoA ? pulsantiCalendario({ titolo: `Ultimo giorno per chiedere: ${r.nome}`, data: apertaFinoA, descrizione: `${r.finestra.testo} ${r.come?.link || ''} Promemoria creato con Mi spetta.` }, { conIcs: !dentroClaude() }) : ''}` : '';
  const come = r.come ? `<h4>Come fare</h4>
      ${r.come.testo ? `<p>${esc(r.come.testo)}</p>` : ''}
      ${r.come.passi ? `<ol class="passi">${r.come.passi.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>` : ''}
      ${r.come.documenti ? `<h4>Documenti utili</h4><ul class="passi">${r.come.documenti.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${r.come.link ? `<a class="vai" href="${esc(r.come.link)}" target="_blank" rel="noopener">${esc(r.come.etichettaLink || 'Vai al servizio ufficiale')}</a>` : ''}` : '';
  return `<details class="scheda" data-esito="${r.esito}" ${aperta ? 'open' : ''}>
    <summary>
      <div><h3>${esc(r.nome)}</h3><span class="ente">${esc(r.ente)}</span></div>
      <div class="importo">${r.esito === 'non_spetta' ? '' : importoHtml(r)}</div>
      <div class="etichette"><span class="pill p-${r.esito}">${esc(r.etichetta)}</span>${r.automatica ? '<span class="pill p-auto">arriva in automatico</span>' : ''}</div>
      ${mancano}
      <span class="apri">Perché, e cosa fare</span>
    </summary>
    <div class="dettaglio">
      <div><h4>In breve</h4><p>${esc(r.sintesi)}</p>${r.importo && r.importo.testo ? `<p style="margin-top:6px">${esc(r.importo.testo)}</p>` : ''}</div>
      <div><h4>Requisiti</h4><ul class="requisiti">${r.requisiti.map((q) => { const [c, s] = segno(q.ok); return `<li class="${c}"><span class="segno" aria-label="${q.ok === true ? 'sì' : q.ok === false ? 'no' : 'da sapere'}">${s}</span><span>${esc(q.testo)}</span></li>`; }).join('')}</ul></div>
      ${r.note.length ? `<div><h4>Da sapere</h4><ul class="note">${r.note.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
      ${finestra}
      <div>${come}</div>
      <div><h4>Fonti, verificate il ${esc(new Date(r.verificato).toLocaleDateString('it-IT'))}</h4><ul class="fonti">${r.fonti.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a></li>`).join('')}</ul></div>
    </div>
  </details>`;
}

function ricalcola() {
  aggiornaVisibilita();
  salva();
  const v = valuta(risposte, { oggi: OGGI });
  const si = v.risultati.filter((r) => r.esito === 'spetta' || r.esito === 'probabile');
  const nd = v.risultati.filter((r) => r.esito === 'manca_dato');
  const chiuse = v.risultati.filter((r) => r.esito === 'chiusa');
  const no = v.risultati.filter((r) => r.esito === 'non_spetta');
  const vuoto = Object.keys(risposte).length === 0;

  $('#riepilogo').innerHTML = `
    <div class="titolo">${vuoto ? 'Rispondi a quello che sai' : 'La tua stima'}</div>
    <div class="cifra">${euro.format(v.totaleAnnuoStimato)} <small>all'anno, circa</small></div>
    <p>${vuoto
      ? `Mi spetta controlla ${v.risultati.length} prestazioni nazionali. Ogni risposta toglie un dubbio.`
      : `Somma delle ${si.length} prestazioni che ti spettano o probabilmente ti spettano, compresi i bonus una tantum.`}</p>
    <div class="conteggi">
      <span><span class="pill p-spetta">${si.length}</span> ti spettano</span>
      <span><span class="pill p-manca_dato">${nd.length}</span> serve un dato</span>
      ${chiuse.length ? `<span><span class="pill p-chiusa">${chiuse.length}</span> domanda chiusa</span>` : ''}
      <span><span class="pill p-non_spetta">${no.length}</span> non ti spettano</span>
    </div>
    ${si.length ? '<div class="azioni-riepilogo"><button type="button" id="stampa">Stampa la lista di cosa fare</button></div>' : ''}`;

  $('#elenco').innerHTML = `
    ${si.length ? `<p class="gruppo-titolo">Ti spettano</p>${si.map((r) => scheda(r)).join('')}` : ''}
    ${nd.length ? `<p class="gruppo-titolo">Serve un dato per decidere</p>${nd.map((r) => scheda(r)).join('')}` : ''}
    ${chiuse.length ? `<p class="gruppo-titolo">Ti spetterebbero, ma la domanda è chiusa</p>${chiuse.map((r) => scheda(r)).join('')}` : ''}
    ${no.length ? `<details class="non-spettano"><summary>Non ti spettano (${no.length}): guarda perché</summary>${no.map((r) => scheda(r)).join('')}</details>` : ''}`;

  $('#stampa')?.addEventListener('click', () => {
    document.querySelectorAll('.scheda').forEach((d) => { d.open = true; });
    window.print();
  });
  document.querySelectorAll('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  document.querySelectorAll('[data-vai]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    vaiAllaDomanda(b.dataset.vai);
  }));

  $('#barra-mobile-testo').textContent = si.length
    ? `${si.length} ti spettano · circa ${euro.format(v.totaleAnnuoStimato)} l'anno · Vedi`
    : 'Vedi i risultati';
}

function vaiAllaDomanda(id) {
  const el = $('#d-' + id);
  if (!el) return;
  el.hidden = false;
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  el.classList.remove('evidenzia');
  void el.offsetWidth;
  el.classList.add('evidenzia');
  el.querySelector('input, select, button')?.focus({ preventScroll: true });
}

// ---------- Esempi ----------

function caricaEsempio(nome) {
  inEsempio = true;
  risposte = structuredClone(ESEMPI[nome]);
  riempiForm();
  $('#avviso-esempio').hidden = false;
  ricalcola();
}
function esciDaEsempio(azzera) {
  inEsempio = false;
  $('#avviso-esempio').hidden = true;
  if (azzera) {
    risposte = carica();
    riempiForm();
    ricalcola();
  }
}

document.querySelectorAll('[data-esempio]').forEach((b) => b.addEventListener('click', () => caricaEsempio(b.dataset.esempio)));
$('#ricomincia-esempio').addEventListener('click', () => esciDaEsempio(true));
$('#cancella').addEventListener('click', () => {
  try { localStorage.removeItem(CHIAVE); } catch { /* niente */ }
  risposte = {};
  inEsempio = false;
  $('#avviso-esempio').hidden = true;
  riempiForm();
  ricalcola();
});

costruisciQuestionario();
riempiForm();
ricalcola();
