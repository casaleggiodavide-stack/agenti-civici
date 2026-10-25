// Interfaccia di «Raccolte firme in corso». I dati sono una copia giornaliera
// della piattaforma pubblica (dati/raccolte.js), letta dal browser senza altre richieste.

import { $, $$, esc } from '../src/comune/interfaccia.js';
import { normalizza } from '../src/comune/schede.js';
import RACCOLTE, { LETTO, SERIE } from '../dati/raccolte.js';
import { stima, storico, LIVELLI, FONTI, dettaglio } from '../src/stima.js';

const oggi = LETTO;
const n = (x) => (x === null || x === undefined ? '—' : Math.round(x).toLocaleString('it-IT'));
const giorno = (d) => (d ? new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const titolo = (t) => (t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t);
const righe = RACCOLTE.map((x) => ({ ...x, s: stima(x, { oggi, serie: SERIE[x.id] }), testo: normalizza(`${x.titolo} ${x.breve}`) }));

let filtro = 'attive';
let tipo = 'tutte';
let q = '';
let ordine = { k: 'firme', v: -1 };

function riepilogo() {
  const attive = righe.filter((r) => r.s.attiva);
  const st = storico(RACCOLTE, oggi);
  const ok = attive.filter((r) => ['raggiunto', 'probabile'].includes(r.s.livello)).length;
  $('#riepilogo').innerHTML = `
    <div><b>${attive.length}</b><span>raccolte in corso</span></div>
    <div><b>${n(attive.reduce((a, r) => a + r.firme, 0))}</b><span>firme online raccolte, in tutto</span></div>
    <div><b>${ok}</b><span>già all'obiettivo o probabili</span></div>
    <div><b>${st.legge.riuscite} su ${st.legge.totale}</b><span>proposte di legge concluse oltre 50.000 firme online</span></div>
    <div><b>${st.referendum.riuscite} su ${st.referendum.totale}</b><span>referendum conclusi oltre 500.000 firme online</span></div>`;
}

function scheda(r) {
  const [parola, tono] = LIVELLI[r.s.livello];
  const s = r.s;
  const testoStima = {
    raggiunto: `Ha superato le ${n(r.quorum)} firme richieste${s.mancanti ? `, e mancano ancora ${s.mancanti} giorni` : ''}.`,
    probabile: `Al ritmo di ${n(s.ritmo)} firme al giorno ne servirebbero ${n(s.servono)}: arriverebbe a circa ${n(s.proiezione)}.`,
    in_bilico: `Servono ${n(s.servono)} firme al giorno; il ritmo ${s.recente !== null ? 'degli ultimi giorni' : 'medio finora'} è ${n(s.ritmo)}. Si gioca negli ultimi giorni.`,
    difficile: `Servono ${n(s.servono)} firme al giorno, più del doppio del ritmo ${s.recente !== null ? 'recente' : 'medio'} (${n(s.ritmo)}).`,
    molto_difficile: s.mancanti ? `Servirebbero ${n(s.servono)} firme al giorno contro un ritmo di ${n(s.ritmo)}.` : 'La raccolta online si chiude oggi.',
    senza_scadenza: 'La piattaforma non indica una scadenza. Per le proposte di legge contano le firme degli ultimi 6 mesi prima del deposito.',
    conclusa: `Si è chiusa con ${n(r.firme)} firme online su ${n(r.quorum)} richieste. Possono essersi aggiunte firme su carta.`,
  }[s.livello];
  return `<article class="raccolta" data-tono="${tono}">
    <small>${r.tipo === 'referendum' ? 'Referendum abrogativo' : 'Proposta di legge di iniziativa popolare'}${r.fine ? ` · scade il ${giorno(r.fine)}${s.attiva && s.mancanti !== null ? `, tra ${s.mancanti} giorni` : ''}` : ''}</small>
    <h3>${esc(titolo(r.titolo))}</h3>
    ${r.breve ? `<p>${esc(r.breve.length > 220 ? r.breve.slice(0, 219).replace(/\s\S*$/, '') + '…' : r.breve)}</p>` : ''}
    <div class="numeri"><b>${n(r.firme)}</b> firme online su ${n(r.quorum)} · ${s.quota !== null ? `${Math.floor(s.quota)}%` : ''}</div>
    <div class="barra" role="img" aria-label="${esc(`${n(r.firme)} firme su ${n(r.quorum)}`)}"><span style="width:${s.quota || 0}%"></span></div>
    <div><span class="pill p-${tono === 'neutro' ? 'neutro' : tono}">${esc(parola)}</span></div>
    <p>${esc(testoStima)}</p>
    <div class="azioni">${s.attiva ? `<a class="btn btn-primario" href="${esc(dettaglio(r.id))}" target="_blank" rel="noopener">Leggi e firma sulla piattaforma</a>` : `<a class="btn" href="${esc(dettaglio(r.id))}" target="_blank" rel="noopener">Scheda ufficiale</a>`}${r.sito ? ` <a class="btn" href="${esc(r.sito)}" target="_blank" rel="noopener nofollow">Sito dei promotori</a>` : ''}</div>
  </article>`;
}

function concluse(lista) {
  const ord = [...lista].sort((a, b) => {
    const va = ordine.k === 'titolo' ? a.titolo : ordine.k === 'quota' ? a.s.quota || 0 : ordine.k === 'fine' ? a.fine || '' : a[ordine.k];
    const vb = ordine.k === 'titolo' ? b.titolo : ordine.k === 'quota' ? b.s.quota || 0 : ordine.k === 'fine' ? b.fine || '' : b[ordine.k];
    return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * ordine.v;
  });
  const th = (k, t, cls = '') => `<th scope="col" class="${cls}" data-k="${k}"${ordine.k === k ? ` aria-sort="${ordine.v < 0 ? 'descending' : 'ascending'}"` : ''}><button type="button">${t}</button></th>`;
  return `<div class="scorri" style="grid-column:1/-1"><table class="tabella-concluse"><thead><tr>${th('titolo', 'Raccolta')}${th('tipo', 'Tipo')}${th('fine', 'Chiusa il')}${th('firme', 'Firme online', 'n')}${th('quota', 'Dell\'obiettivo', 'n')}</tr></thead>
    <tbody>${ord.map((r) => `<tr><td><a href="${esc(dettaglio(r.id))}" target="_blank" rel="noopener">${esc(titolo(r.titolo))}</a></td><td>${r.tipo === 'referendum' ? 'Referendum' : 'Proposta di legge'}</td><td>${giorno(r.fine)}</td><td class="n">${n(r.firme)}</td><td class="n">${r.s.quota !== null ? `${Math.floor(r.s.quota)}%${r.firme >= r.quorum ? ' ✓' : ''}` : '—'}</td></tr>`).join('')}</tbody></table></div>`;
}

const PESO = { raggiunto: 0, probabile: 1, in_bilico: 2, difficile: 3, molto_difficile: 4, senza_scadenza: 5 };
function disegna() {
  const lista = righe.filter((r) => (filtro === 'attive' ? r.s.attiva : !r.s.attiva) && (tipo === 'tutte' || r.tipo === tipo) && (!q || q.split(' ').every((p) => r.testo.includes(p))));
  const box = $('#elenco');
  if (!lista.length) { box.innerHTML = '<p>Nessuna raccolta con questi filtri.</p>'; return; }
  if (filtro === 'attive') {
    box.innerHTML = lista.sort((a, b) => (PESO[a.s.livello] - PESO[b.s.livello]) || ((a.fine || '9999').localeCompare(b.fine || '9999'))).map(scheda).join('');
  } else {
    box.innerHTML = concluse(lista);
    $$('th button', box).forEach((b) => b.addEventListener('click', () => {
      const k = b.parentElement.dataset.k;
      ordine = ordine.k === k ? { k, v: -ordine.v } : { k, v: k === 'titolo' || k === 'tipo' ? 1 : -1 };
      disegna();
    }));
  }
}

$$('[data-f]').forEach((b) => b.addEventListener('click', () => { filtro = b.dataset.f; $$('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); disegna(); }));
$$('[data-t]').forEach((b) => b.addEventListener('click', () => { tipo = b.dataset.t; $$('[data-t]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); disegna(); }));
$('#cerca-raccolta').addEventListener('input', (e) => { q = normalizza(e.target.value.trim()); disegna(); });

$('#metodo').innerHTML = `
  <ol class="passi">
    <li><b>I numeri.</b> Sono le firme online che la piattaforma mostra per ogni raccolta, copiate qui una volta al giorno (ultima lettura: ${giorno(LETTO)}). Le firme su carta non ci sono.</li>
    <li><b>Il ritmo.</b> Quando abbiamo almeno tre giorni di letture usiamo le firme al giorno delle ultime due settimane; altrimenti la media dall'inizio della raccolta.</li>
    <li><b>La stima.</b> Confrontiamo le firme al giorno che servirebbero fino alla scadenza con il ritmo. Di solito le raccolte rallentano dopo le prime settimane e accelerano solo alla fine: per questo una raccolta è «probabile» quando le basta meno della metà del ritmo tenuto, «in bilico» fino a poco più dello stesso ritmo, «difficile» fino al triplo, «molto difficile» oltre.</li>
    <li><b>Il confronto.</b> Delle raccolte già concluse sulla piattaforma, quelle oltre l'obiettivo con le sole firme online sono indicate nel riepilogo in alto.</li>
  </ol>
  <ul class="fonti">${Object.values(FONTI).map((f) => `<li>${fonte(f)}</li>`).join('')}</ul>`;

riepilogo();
disegna();
