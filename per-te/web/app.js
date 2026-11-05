// Interfaccia di «Per te». Le risposte restano nel browser (chiave polpo-profilo-v1): nessun server.
// Agli altri strumenti passa solo il Comune, nell'ancora dell'indirizzo (#istat=…), che non va al server.
import { $, $$, esc, archivio } from '../src/comune/interfaccia.js';
import { pulsantiCalendario, incorporata } from '../src/comune/calendario.js';
import { cerca } from '../../raccolta/src/regole.js';
import { valuta, PRESTAZIONI } from '../../mi-spetta/src/motore.js';
import { PREFETTURE } from '../../faccio-ricorso/src/dati/prefetture.js';
import fontiReclami from '../../reclami-pa/src/dati/fonti.js';
import { DOMANDE, FASCE_ETA, FASCE_ISEE, GRUPPI, indicizza, prossima, aiuti, riquadri, anteprima, conta, regioneId, firma } from '../src/regole.js';

const CHIAVE = 'polpo-profilo-v1';
const memoria = archivio(CHIAVE);
let profilo = pulito(memoria.leggi({}));
let esempio = null; // un profilo d'esempio: si mostra ma non si salva
let indice = null;
const province = new Map();

function pulito(p) {
  const x = p && typeof p === 'object' ? p : {};
  return { v: 1, istat: x.istat, nome: x.nome, sigla: x.sigla, regione: x.regione, famiglia: x.famiglia, isee: x.isee, firme: x.firme && typeof x.firme === 'object' ? x.firme : {} };
}
const attuale = () => esempio || profilo;
function salva() { if (!esempio) memoria.scrivi(profilo); }

const carica = async () => (indice ||= indicizza(await (await fetch('dati/comuni.json')).json()));
async function sintesi(sigla, istat) {
  if (!province.has(sigla)) province.set(sigla, fetch(`dati/p/${encodeURIComponent(sigla)}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})));
  return (await province.get(sigla))[istat] || {};
}
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;

// ---------- le domande ----------

const q = $('#questionario');

function domandaComune() {
  const d = DOMANDE[0];
  return `<section class="sezione domanda-per-te" id="d-comune">
    <h2>${esc(d.titolo)}</h2>
    <div class="domanda cerca-ente">
      <label for="cerca-comune">Il nome del Comune</label>
      <input type="text" id="cerca-comune" placeholder="es. Treviso, Bari, San Giovanni in Persiceto" autocomplete="off" aria-controls="risultati-comuni" enterkeyhint="search">
      <ul class="risultati-enti" id="risultati-comuni" hidden></ul>
    </div>
    <p class="aiuto"><b>Perché te lo chiedo.</b> ${esc(d.perche)}</p>
  </section>`;
}

const radio = (nome, opzioni, scelto) => `<div class="pillole" role="radiogroup">${opzioni.map(([v, t]) => `<label><input type="radio" name="${nome}" value="${esc(v)}" ${String(scelto) === String(v) ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div>`;
const numeroCampo = (id, etichetta, valore) => `<label class="contatore"><span>${esc(etichetta)}</span><input type="number" id="${id}" min="0" max="10" step="1" inputmode="numeric" value="${Number(valore) || 0}"></label>`;

function domandaFamiglia() {
  const d = DOMANDE[1];
  const f = typeof attuale().famiglia === 'object' && attuale().famiglia ? attuale().famiglia : { figli: {} };
  return `<section class="sezione domanda-per-te" id="d-famiglia">
    <h2>${esc(d.titolo)}</h2>
    <fieldset class="domanda"><legend>Quanti anni hai?</legend>${radio('eta', FASCE_ETA.map(([v, t]) => [v, t]), f.eta)}</fieldset>
    <fieldset class="domanda"><legend>Vivi con un partner (coniuge, unione civile o convivente)?</legend>${radio('partner', [['si', 'Sì'], ['no', 'No']], f.partner === true ? 'si' : f.partner === false ? 'no' : '')}</fieldset>
    <fieldset class="domanda"><legend>Figli nel tuo stato di famiglia</legend>
      <div class="contatori">${numeroCampo('f-piccoli', 'sotto i 3 anni', f.figli?.piccoli)}${numeroCampo('f-minori', 'da 3 a 17 anni', f.figli?.minori)}${numeroCampo('f-grandi', 'da 18 a 20 anni', f.figli?.grandi)}</div>
    </fieldset>
    <fieldset class="domanda"><legend>Altre persone che vivono con te (genitori, fratelli…)</legend>
      <div class="contatori">${numeroCampo('f-altri', 'quante', f.altri)}</div>
      <label class="spunta"><input type="checkbox" id="f-altri60" ${f.altri60 ? 'checked' : ''}> almeno una ha 60 anni o più</label>
    </fieldset>
    <fieldset class="domanda"><legend>In casa c'è una persona con disabilità riconosciuta (anche tu)?</legend>${radio('disabile', [['si', 'Sì'], ['no', 'No']], f.disabile === true ? 'si' : f.disabile === false ? 'no' : '')}</fieldset>
    <p class="aiuto"><b>Perché te lo chiedo.</b> ${esc(d.perche)}</p>
    <div class="azioni-doc"><button type="button" class="btn btn-primario" id="famiglia-ok">Aggiorna la scheda</button><button type="button" class="btn" data-salta="famiglia">Salta</button></div>
  </section>`;
}

function domandaIsee() {
  const d = DOMANDE[2];
  return `<section class="sezione domanda-per-te" id="d-isee">
    <h2>${esc(d.titolo)}</h2>
    ${radio('isee', FASCE_ISEE.map(([v, t]) => [v, t]), attuale().isee)}
    <p class="aiuto"><b>Perché te lo chiedo.</b> ${esc(d.perche)} L'ISEE si chiede gratis al CAF o sul sito dell'INPS.</p>
    <div class="azioni-doc"><button type="button" class="btn" data-salta="isee">Salta</button></div>
  </section>`;
}

const ETICHETTE_RISPOSTA = {
  comune: (p) => `${p.nome} (${p.sigla})`,
  famiglia: (p) => {
    if (p.famiglia === 'saltata') return 'saltata';
    const f = p.famiglia || {};
    const figli = (f.figli?.piccoli || 0) + (f.figli?.minori || 0) + (f.figli?.grandi || 0);
    const pezzi = [f.eta ? `${FASCE_ETA.find((x) => x[0] === f.eta)?.[1]} anni` : '', f.partner ? 'con partner' : f.partner === false ? 'senza partner' : '', figli ? `${figli} ${figli === 1 ? 'figlio' : 'figli'}` : '', f.altri ? `${f.altri} ${f.altri === 1 ? 'altra persona' : 'altre persone'}` : ''];
    return pezzi.filter(Boolean).join(', ') || 'risposta vuota';
  },
  isee: (p) => (p.isee === 'saltata' ? 'saltata' : FASCE_ISEE.find((x) => x[0] === p.isee)?.[1] || ''),
};

function risposte() {
  const p = attuale();
  const fatte = DOMANDE.filter((d) => (d.id === 'comune' ? p.istat : p[d.id] !== undefined));
  if (!fatte.length) return '';
  return `<section class="sezione risposte-per-te"><h2>${esempio ? 'Le risposte dell\'esempio' : 'Le tue risposte'}</h2><ul>${fatte.map((d) => `<li><span>${esc(d.titolo)}</span><b>${esc(ETICHETTE_RISPOSTA[d.id](p))}</b>${esempio ? '' : `<button type="button" class="link" data-cambia="${d.id}">Cambia</button>`}</li>`).join('')}</ul></section>`;
}

let inModifica = null;
function mostraDomande() {
  const p = attuale();
  const quale = inModifica || prossima(p);
  const html = { comune: domandaComune, famiglia: domandaFamiglia, isee: domandaIsee };
  q.innerHTML = (quale && !esempio ? html[quale]() : '') + risposte() + (!quale && !esempio ? `<section class="sezione fine-per-te"><h2>La tua scheda è pronta</h2><p>La prossima volta che apri questa pagina la trovi già fatta, con i dati aggiornati. Per lavoro, casa e redditi le domande complete sono in <a href="${esc(altroStrumento('mi-spetta'))}">Mi spetta</a>.</p></section>` : '');
  if (quale === 'comune' && !esempio) collegaRicerca();
  if (quale === 'famiglia' && !esempio) {
    $('#famiglia-ok').addEventListener('click', () => {
      const v = (n) => $(`input[name="${n}"]:checked`)?.value;
      const n = (id) => Math.max(0, Math.min(10, Math.round(Number($(id).value) || 0)));
      profilo.famiglia = {
        eta: v('eta') || null, partner: v('partner') === 'si' ? true : v('partner') === 'no' ? false : null,
        figli: { piccoli: n('#f-piccoli'), minori: n('#f-minori'), grandi: n('#f-grandi') },
        altri: n('#f-altri'), altri60: $('#f-altri60').checked, disabile: v('disabile') === 'si' ? true : v('disabile') === 'no' ? false : null,
      };
      dopoRisposta();
    });
  }
  if (quale === 'isee' && !esempio) {
    $$('input[name="isee"]').forEach((i) => i.addEventListener('change', () => { profilo.isee = i.value; dopoRisposta(); }));
  }
  $$('[data-salta]', q).forEach((b) => b.addEventListener('click', () => { profilo[b.dataset.salta] = 'saltata'; dopoRisposta(); }));
  $$('[data-cambia]', q).forEach((b) => b.addEventListener('click', () => {
    inModifica = b.dataset.cambia;
    mostraDomande();
    $(`#d-${inModifica}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    $(`#d-${inModifica} input`)?.focus({ preventScroll: true });
  }));
}

function dopoRisposta() {
  inModifica = null;
  salva();
  mostraDomande();
  mostraScheda();
}

// ---------- la ricerca del Comune ----------

function collegaRicerca() {
  const campo = $('#cerca-comune'), lista = $('#risultati-comuni');
  let attesa, trovati = [];
  async function suggerisci() {
    const testo = campo.value;
    if (testo.trim().length < 2) { lista.hidden = true; return; }
    lista.hidden = false;
    if (!indice) lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco dei Comuni…</button></li>';
    try {
      trovati = cerca(await carica(), testo, 8);
      lista.innerHTML = trovati.length
        ? trovati.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.nome)}<small>${esc(`${r.sigla} · ${r.regione}`)}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessun Comune con questo nome: controlla come è scritto.</button></li>';
      $$('[data-i]', lista).forEach((b) => b.addEventListener('click', () => scegli(trovati[Number(b.dataset.i)])));
    } catch {
      lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
    }
  }
  campo.addEventListener('focus', () => { carica().catch(() => {}); });
  campo.addEventListener('input', () => { clearTimeout(attesa); attesa = setTimeout(suggerisci, 120); });
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (trovati[0]) scegli(trovati[0]); }
    if (e.key === 'ArrowDown') { e.preventDefault(); $('button', lista)?.focus(); }
  });
  // dalla casa del Polpo: il nome scritto lì arriva per la memoria della scheda, mai nell'indirizzo
  try {
    const da = sessionStorage.getItem('polpo-per-te-cerca');
    if (da) { sessionStorage.removeItem('polpo-per-te-cerca'); campo.value = da; suggerisci(); }
  } catch { /* niente */ }
}

function scegli(r) {
  const cambiato = profilo.istat && profilo.istat !== r.istat;
  Object.assign(profilo, { istat: r.istat, nome: r.nome, sigla: r.sigla, regione: r.regione });
  if (cambiato) profilo.firme = {};
  dopoRisposta();
  if (matchMedia('(max-width: 900px)').matches) $('#esito').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

// ---------- la scheda ----------

const link = (a, istat) => {
  if (a.domanda) return `<button type="button" class="btn" data-vai="${esc(a.domanda)}">${esc(a.testo)}</button>`;
  if (a.tel) return `<a class="btn" href="tel:${esc(a.tel.replace(/[^\d+]/g, ''))}">📞 ${esc(a.testo)}</a>`;
  if (a.href) return `<a class="btn" href="${esc(a.href)}" target="_blank" rel="noopener">${esc(a.testo)}</a>`;
  return `<a class="btn" href="${esc(altroStrumento(a.strumento))}${a.ancora ? `#${esc(a.ancora)}` : ''}">${esc(a.testo)} →</a>`;
};

async function mostraScheda(scorri = false) {
  const p = attuale();
  const esito = $('#esito');
  if (!p.istat) {
    esito.innerHTML = `<section class="pannello scheda-vuota"><p class="occhiello">La tua scheda</p><p class="titolo-vuota">Comincia dal Comune dove abiti</p><p>Ti mostro subito chi raccoglie i rifiuti, dove mandare un ricorso contro una multa, a chi rivolgerti se un ufficio non risponde e come vanno i conti e gli appalti del tuo Comune. Poi, se vuoi, gli aiuti per la tua famiglia.</p></section>`;
    return;
  }
  const x = await sintesi(p.sigla, p.istat);
  const reg = regioneId(p.regione, p.sigla);
  const ai = p.famiglia && p.famiglia !== 'saltata' ? aiuti(valuta, p) : null;
  const t = { comune: { istat: p.istat, nome: p.nome, sigla: p.sigla, regione: p.regione }, x, prefetture: PREFETTURE, difensori: fontiReclami.difensori || {}, conteggio: conta(PRESTAZIONI, reg) };
  const elenco = riquadri(t, p, ai);

  // nuovo o cambiato rispetto all'ultima volta che hai visto la scheda (solo per il tuo profilo, non per gli esempi)
  const prima = p.firme || {};
  const segno = (r) => (esempio ? '' : !(r.id in prima) ? (Object.keys(prima).length ? 'nuovo' : '') : prima[r.id] !== firma(r) ? 'cambiato' : '');
  const segni = Object.fromEntries(elenco.map((r) => [r.id, segno(r)]));
  if (!esempio) { profilo.firme = Object.fromEntries(elenco.map((r) => [r.id, firma(r)])); salva(); }

  const blocchi = GRUPPI.map(([g, nome]) => {
    const qui = elenco.filter((r) => r.gruppo === g);
    if (!qui.length) return '';
    return `<section class="gruppo-per-te"><h3>${esc(nome)}</h3><div class="riquadri">${qui.map((r) => `
      <article class="riquadro"${r.tono ? ` data-tono="${r.tono}"` : ''}>
        <p class="r-etichetta"><span>${esc(r.etichetta)}</span>${segni[r.id] ? `<span class="r-segno">${segni[r.id]}</span>` : ''}</p>
        <p class="r-titolo">${esc(r.titolo)}</p>
        ${r.testo ? `<p class="r-testo">${esc(r.testo)}</p>` : ''}
        ${r.scadenza ? pulsantiCalendario({ titolo: r.scadenza.titolo, data: r.scadenza.data, descrizione: 'Promemoria creato con Per te del Polpo civico: verifica sempre la data sul bando.' }, { conIcs: !incorporata() }) : ''}
        <div class="azioni-doc">${r.azioni.map((a) => link(a, p.istat)).join('')}</div>
        ${r.fonte ? `<p class="r-fonte">Fonte: ${esc(r.fonte)}</p>` : ''}
      </article>`).join('')}</div></section>`;
  }).join('');
  const prossimaQ = anteprima(p, ai, t.conteggio);
  esito.innerHTML = `
    <section class="pannello testa-scheda">
      <p class="occhiello">${esempio ? 'Esempio · ' : ''}La scheda di</p>
      <p class="titolo-scheda">${esc(p.nome)}</p>
      <p class="aiuto">${esc(`${p.sigla} · ${p.regione}`)}${x.b?.pop ? ` · ${new Intl.NumberFormat('it-IT').format(x.b.pop)} abitanti` : ''}</p>
    </section>
    ${blocchi}
    ${prossimaQ && !esempio ? `<p class="prossima-per-te"><span aria-hidden="true">↑</span> ${esc(prossimaQ)} <button type="button" class="link" data-vai="${esc(prossima(p))}">Rispondi</button></p>` : ''}
    <p class="fonti">I numeri vengono dagli strumenti del Polpo civico, ognuno con le sue fonti ufficiali. Gli aiuti sono calcolati dal motore di Mi spetta con le fasce che hai scelto: «probabile» non è «certo».</p>`;
  $$('[data-vai]', esito).forEach((b) => b.addEventListener('click', () => {
    const d = $(`#d-${b.dataset.vai}`);
    if (d) { d.scrollIntoView({ block: 'start', behavior: 'smooth' }); $('input', d)?.focus({ preventScroll: true }); }
  }));
  if (scorri) esito.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

// ---------- esempi, cancella ----------

const ESEMPI = {
  treviso: { cerca: 'Treviso', famiglia: { eta: '30-59', partner: true, figli: { piccoli: 1, minori: 1, grandi: 0 }, altri: 0, altri60: false, disabile: false }, isee: '25000' },
  bari: { cerca: 'Bari BA', famiglia: { eta: '70-79', partner: false, figli: { piccoli: 0, minori: 0, grandi: 0 }, altri: 0, altri60: false, disabile: false }, isee: '9530' },
  piccolo: { cerca: 'Luogosanto', famiglia: undefined, isee: undefined },
};

$$('[data-esempio]').forEach((b) => b.addEventListener('click', async () => {
  const e = ESEMPI[b.dataset.esempio];
  const r = cerca(await carica(), e.cerca, 1)[0];
  if (!r) return;
  esempio = { ...pulito({}), istat: r.istat, nome: r.nome, sigla: r.sigla, regione: r.regione, famiglia: e.famiglia, isee: e.isee };
  $('#avviso-esempio').hidden = false;
  mostraDomande();
  mostraScheda(true);
}));
$('#esci-esempio')?.addEventListener('click', () => {
  esempio = null;
  $('#avviso-esempio').hidden = true;
  mostraDomande();
  mostraScheda();
});
$('#cancella')?.addEventListener('click', () => {
  memoria.cancella();
  profilo = pulito({});
  esempio = null;
  $('#avviso-esempio').hidden = true;
  mostraDomande();
  mostraScheda();
  const n = $('#cancella');
  n.insertAdjacentHTML('afterend', ' <span role="status">Fatto: la scheda è cancellata da questo dispositivo.</span>');
});

mostraDomande();
mostraScheda().catch(() => {});
