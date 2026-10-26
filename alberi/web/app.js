// Interfaccia di «Alberi per il futuro». Tutto gira nel browser: i dati delle lettere
// restano su questo dispositivo.

import { $, $$, esc, copia, stampa, mailto, testoDa } from '../src/comune/interfaccia.js';
import { caricaEnti, cerca } from '../../chiedo-gli-atti/src/enti.js';
import { EDIZIONI, FOTO, TOTALE, sommaAlberi, prossimaGiornata } from '../src/edizioni.js';
import { PASSI, VIVAI, NAZIONALE, FONTI, REGIONI, faseDi } from '../src/guida.js';
import { letteraComune, letteraVivaio, oggettoComune, oggettoVivaio } from '../src/lettere.js';

const n = (x) => Math.round(x).toLocaleString('it-IT', { useGrouping: 'always' });
const oggi = new Date().toISOString().slice(0, 10);
const giorno = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
const link = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;

// ---------- Il conto alla rovescia, senza anno fisso ----------

const prossima = prossimaGiornata(oggi);
const fase = faseDi(prossima.giorni);
$('#conto').innerHTML = `<b>${prossima.giorni === 0 ? 'Oggi è la Giornata nazionale degli alberi' : `Il prossimo 21 novembre è tra ${prossima.giorni} giorni`}</b><p>${esc(fase.testo)}</p>`;

// ---------- La storia ----------

$('#storia').innerHTML = `
  <p>Alberi per il futuro nasce nel 2015 da un'idea di <b>Gianroberto Casaleggio</b>: mille alberi in più a Reggio Emilia, poi un bosco urbano, un prato fiorito e un frutteto all'ex velodromo di Milano. Alberi pagati dai cittadini, piantati dai cittadini, che li potevano dedicare ai propri figli.</p>
  <p>Da allora, ogni anno intorno al 21 novembre, Giornata nazionale degli alberi, gruppi di cittadini chiedono al proprio Comune un'area pubblica e la riempiono di alberi, insieme a scuole, associazioni e amministrazioni di ogni colore. Nelle prime cinque edizioni sono stati messi a dimora ${esc(TOTALE.testo)}; dal 2019 c'è anche una festa di primavera per curare quelli già piantati.</p>
  <p>Dal 2024 l'iniziativa è cresciuta oltre i suoi promotori: la portano avanti <b>gruppi di attivisti di associazioni diverse</b>, ognuno nella propria città. Il seme dell'idea è sbocciato su più fronti, e chiunque voglia può raccoglierlo: un'associazione, un comitato, una scuola, un gruppo di cittadini. Questo sito continua a sostenere tutti con lo stesso formato e le stesse indicazioni.</p>
  <p>Le regole sono semplici: <b>specie del posto</b>, scelte con l'ufficio verde del Comune; <b>alberi giovani</b>, che attecchiscono meglio; e un impegno a <b>curarli per i primi tre anni</b>, perché un albero piantato e poi lasciato senz'acqua d'estate spesso non arriva al secondo autunno.</p>`;

// ---------- I numeri ----------

const somma = sommaAlberi();
const record = EDIZIONI.reduce((a, e) => ((e.alberi || 0) > (a.alberi || 0) ? e : a));
const massimoComuni = EDIZIONI.reduce((a, e) => ((e.comuni || 0) > (a.comuni || 0) && !e.comuniNota?.includes('gruppi') ? e : a));
$('#cifre').innerHTML = `
  <div><b>${n(TOTALE.alberi)}+</b><span>alberi messi a dimora dal 2015 al 2019</span></div>
  <div><b>${n(TOTALE.citta)}</b><span>città coinvolte, da Aosta a Pantelleria</span></div>
  <div><b>${n(record.alberi)}</b><span>alberi nel solo ${record.anno}, l'edizione più grande</span></div>
  <div><b>${n(massimoComuni.comuni)}</b><span>Comuni in un'edizione (${massimoComuni.anno})</span></div>
  <div><b>${EDIZIONI.length}</b><span>edizioni raccontate, dal ${EDIZIONI[0].anno} al ${EDIZIONI.at(-1).anno}</span></div>`;
$('#nota-numeri').innerHTML = `I numeri sono quelli dichiarati a ogni edizione. La somma degli anni che hanno contato gli alberi (2015-2019) fa circa ${n(Math.round(somma / 500) * 500)}, coerente con il totale di ${n(TOTALE.alberi)} indicato nel 2020 (${link(TOTALE.fonte)}). Dal 2020 le edizioni non hanno più pubblicato un totale di alberi: dove manca un numero lo lasciamo vuoto.`;

let ordine = { k: 'anno', v: 1 };
function tabella() {
  const val = (e, k) => (k === 'anno' ? e.anno : e[k] ?? -1);
  const righe = [...EDIZIONI].sort((a, b) => (val(a, ordine.k) - val(b, ordine.k)) * ordine.v);
  const th = (k, t, cls = '') => `<th scope="col" class="${cls}" data-k="${k}"${ordine.k === k ? ` aria-sort="${ordine.v < 0 ? 'descending' : 'ascending'}"` : ''}><button type="button">${t}</button></th>`;
  const alberi = (e) => (e.alberi ? `${e.alberiNota === 'oltre' ? 'oltre ' : ''}${n(e.alberi)}${e.alberiNota && e.alberiNota !== 'oltre' ? `<small>${esc(e.alberiNota)}</small>` : ''}` : '—');
  const comuni = (e) => (e.comuni ? `${e.comuniNota && e.comuniNota !== 'gruppi in' ? `${esc(e.comuniNota)} ` : ''}${n(e.comuni)}${e.comuniNota === 'gruppi in' ? '<small>gruppi</small>' : ''}` : '—');
  $('#edizioni').innerHTML = `<thead><tr>${th('anno', 'Anno')}<th scope="col">Quando</th>${th('alberi', 'Alberi', 'n')}${th('comuni', 'Comuni', 'n')}<th scope="col">Cosa è successo</th></tr></thead>
    <tbody>${righe.map((e) => `<tr><td class="anno">${e.anno}</td><td>${esc(e.quando)}${e.persone ? `<small>${esc(e.persone)}</small>` : ''}</td><td class="n">${alberi(e)}</td><td class="n">${comuni(e)}</td><td>${esc(e.racconto)}<div class="fonti-riga">${e.fonti.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">fonte ${i + 1}</a>`).join('')}</div></td></tr>`).join('')}</tbody>`;
  $$('th button', $('#edizioni')).forEach((b) => b.addEventListener('click', () => {
    const k = b.parentElement.dataset.k;
    ordine = ordine.k === k ? { k, v: -ordine.v } : { k, v: k === 'anno' ? 1 : -1 };
    tabella();
  }));
}
tabella();

// ---------- Le foto ----------

$('#galleria').innerHTML = FOTO.map((f) => `<figure><div class="foto-ac-mini"><img src="${esc(new URL(`edizioni/${f.file}`, import.meta.url).href)}" alt="${esc(f.testo)}" loading="lazy" decoding="async"></div><figcaption><b>${f.anno}</b>${esc(f.testo)}</figcaption></figure>`).join('')
  + '<p style="grid-column:1/-1;font-size:var(--s-1);color:var(--inchiostro-3);margin:0">Foto dagli articoli del Blog delle Stelle sulle edizioni, indicati nella tabella.</p>';

// ---------- I passi ----------

function vivaioHtml(regione) {
  const v = VIVAI[regione];
  if (!v) return '';
  return `<div class="vivaio"><b>${esc(v.nome)}</b><span>${esc(v.come)}</span>${v.quando ? `<span><b>Quando:</b> ${esc(v.quando)}</span>` : ''}${v.url ? `<span>${link({ titolo: v.fonte || 'Pagina ufficiale', url: v.url })}</span>` : ''}${v.nota ? `<small>${esc(v.nota)}</small>` : ''}</div>`;
}

$('#passi').innerHTML = PASSI.map((p) => `<li id="passo-${esc(p.id)}">
  ${p.quando ? `<span class="quando">${esc(p.quando)}</span>` : ''}
  <h3>${esc(p.titolo)}</h3>
  ${p.testo.map((t) => `<p>${esc(t)}</p>`).join('')}
  ${p.elenco ? `<ul>${p.elenco.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
  ${p.id === 'alberi' ? `<div class="vivaio"><b>${esc(NAZIONALE.nome)}</b><span>${esc(NAZIONALE.come)}</span>${NAZIONALE.url ? `<span>${link({ titolo: NAZIONALE.fonte, url: NAZIONALE.url })}</span>` : ''}</div>
    <label class="etichetta" for="regione" style="display:block;margin-top:12px">Il vivaio della tua Regione</label>
    <select id="regione"><option value="">Scegli la Regione</option>${REGIONI.map((r) => `<option>${esc(r)}</option>`).join('')}</select>
    <div id="vivaio-regione"></div>` : ''}
  ${p.lettera ? `<p><a class="btn" href="#lettere" data-apri="${esc(p.lettera)}">${p.lettera === 'comune' ? 'Prepara la lettera al Comune' : 'Prepara la lettera al vivaio'}</a></p>` : ''}
  ${p.fonti?.length ? `<p class="fonte-passo">Fonti: ${p.fonti.map((k) => (FONTI[k] ? link(FONTI[k]) : '')).filter(Boolean).join(' · ')}</p>` : ''}
</li>`).join('');

// ---------- Le lettere ----------

const CHIAVE = 'alberi-v1';
let dati = {};
try { dati = JSON.parse(localStorage.getItem(CHIAVE) || '{}'); } catch { dati = {}; }
const salva = () => { try { localStorage.setItem(CHIAVE, JSON.stringify(dati)); } catch { /* niente */ } };
let lettera = 'comune';

const CAMPI = [
  ['gruppo', 'Chi scrive (gruppo, associazione o nome del referente)', 'text', 'es. Comitato di quartiere San Pietro'],
  ['referente', 'Nome e cognome del referente', 'text', ''],
  ['contatto', 'Telefono o email per essere ricontattati', 'text', ''],
  ['area', 'Area proposta (se ne avete una)', 'text', 'es. parco di via Roma, aiuola davanti alla scuola'],
  ['quanti', 'Quanti alberi, più o meno', 'number', 'es. 30'],
  ['data', 'Data proposta per la piantumazione', 'date', ''],
];

function campi() {
  const regioneSel = `<label>Regione<select data-campo="regione"><option value="">Scegli</option>${REGIONI.map((r) => `<option${dati.regione === r ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></label>`;
  $('#campi').innerHTML = CAMPI.map(([k, t, tipo, ph]) => `<label>${esc(t)}<input type="${tipo}" data-campo="${k}" value="${esc(dati[k] || '')}" placeholder="${esc(ph)}"${tipo === 'number' ? ' min="1" step="1"' : ''}></label>`).join('') + (lettera === 'vivaio' ? regioneSel : '');
  $$('[data-campo]', $('#campi')).forEach((el) => el.addEventListener('input', () => { dati[el.dataset.campo] = el.value; salva(); documento(); }));
}

function enteHtml() {
  const e = dati.ente;
  $('#ente-scelto').innerHTML = e ? `<div class="ente-scelto"><b>${esc(e.nome)}</b><span>${esc(`${e.comune || ''} (${e.prov || ''})`)}</span>${e.pec ? `<span class="pec">PEC: ${esc(e.pec)}</span>` : '<span>PEC non indicata in IndicePA: cerca sul sito del Comune l\'indirizzo dell\'ufficio ambiente o del protocollo.</span>'}</div>` : '';
}

function documento() {
  const box = $('#documento');
  const v = lettera === 'vivaio' ? VIVAI[dati.regione] : null;
  if (lettera === 'vivaio' && !dati.regione) { box.innerHTML = '<p>Scegli la Regione per sapere a chi scrivere.</p>'; return; }
  const html = lettera === 'comune' ? letteraComune(dati, { oggi }) : letteraVivaio(dati, { oggi, vivaio: v, nazionale: NAZIONALE });
  const oggetto = lettera === 'comune' ? oggettoComune(dati) : oggettoVivaio(dati);
  const a = lettera === 'comune' ? (dati.ente?.pec || '') : (v?.email || '');
  box.innerHTML = `<div class="documento"><div class="foglio" id="foglio">${html}</div>
    <div class="azioni" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <a class="btn" href="${esc(mailto(a, oggetto, testoDa(html)))}">Apri nel programma di posta</a>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      <span id="avviso" role="status" style="font-size:var(--s-1);color:var(--inchiostro-3)"></span>
    </div>
    <p style="font-size:var(--s-1);color:var(--inchiostro-3)">${lettera === 'comune' ? 'Mandala dalla tua PEC all\'indirizzo del Comune, oppure consegnala al protocollo: ti daranno un numero da citare se devi sollecitare.' : 'Ogni vivaio ha le sue regole: alcuni chiedono che la domanda arrivi dal Comune. In quel caso dai questa lettera all\'ufficio verde, che la firma e la manda.'}</p></div>`;
  $('#copia').addEventListener('click', () => copia(testoDa(html), $('#avviso')));
  $('#stampa').addEventListener('click', () => stampa(html));
}

function scegli(tipo) {
  lettera = tipo;
  $$('[data-lettera]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lettera === tipo)));
  campi();
  documento();
}
$$('[data-lettera]').forEach((b) => b.addEventListener('click', () => scegli(b.dataset.lettera)));
$$('[data-apri]').forEach((a) => a.addEventListener('click', () => scegli(a.dataset.apri)));

$('#regione')?.addEventListener('change', (e) => {
  $('#vivaio-regione').innerHTML = vivaioHtml(e.target.value);
  dati.regione = e.target.value; salva();
  if (lettera === 'vivaio') { campi(); documento(); }
});
if (dati.regione && $('#regione')) { $('#regione').value = dati.regione; $('#vivaio-regione').innerHTML = vivaioHtml(dati.regione); }

let indice = null;
const enti = async () => (indice ||= await caricaEnti());
let attesa;
$('#cerca-ente').addEventListener('focus', () => { enti().catch(() => {}); });
$('#cerca-ente').addEventListener('input', (e) => {
  clearTimeout(attesa);
  const q = e.target.value;
  attesa = setTimeout(async () => {
    const lista = $('#risultati-enti');
    if (q.trim().length < 2) { lista.hidden = true; return; }
    lista.hidden = false;
    lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco dei Comuni…</button></li>';
    try {
      const trovati = cerca(await enti(), /comune/i.test(q) ? q : `comune ${q}`, 8).filter((t) => t.cat === 'L6');
      lista.innerHTML = trovati.length
        ? trovati.map((t, i) => `<li><button type="button" data-ente="${i}">${esc(t.nome)}<small>${esc(`${t.comune || ''} (${t.prov || ''})`)}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessun Comune trovato: prova con meno parole.</button></li>';
      $$('[data-ente]', lista).forEach((b) => b.addEventListener('click', () => {
        dati.ente = trovati[Number(b.dataset.ente)];
        salva();
        lista.hidden = true;
        $('#cerca-ente').value = '';
        enteHtml();
        documento();
      }));
    } catch {
      lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
    }
  }, 160);
});

$('#cancella').addEventListener('click', () => { dati = {}; try { localStorage.removeItem(CHIAVE); } catch { /* niente */ } enteHtml(); campi(); documento(); });

$('#fonti').innerHTML = Object.values(FONTI).map((f) => `<li>${link(f)}</li>`).join('');

enteHtml();
campi();
documento();
