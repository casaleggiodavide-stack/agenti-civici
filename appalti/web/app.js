// Interfaccia di «Red flag sugli appalti». Tutto gira nel browser:
// l'indice degli enti e le schede di una provincia si caricano solo quando servono.

import { $, $$, esc, copia } from '../src/comune/interfaccia.js';
import { caricaJSON, cercaIn, euroParole, percento, numeroIt, leggiAncora, scriviAncora } from '../src/comune/schede.js';
import { FONTI, INDICATORI, livello, PAROLE_LIVELLO, procedure, richiestaAtti, VERIFICATO } from '../src/indicatori.js';

const DATI = new URL('../dati/', import.meta.url);
const indice = () => caricaJSON(new URL('indice.json', DATI));
const confronto = () => caricaJSON(new URL('confronto.json', DATI));
// le medie nazionali e regionali degli affidamenti diretti (scripts/appalti-medie.py); se mancano, la scheda si vede lo stesso
const medie = () => caricaJSON(new URL('medie.json', DATI)).catch(() => null);
// i Comuni in ordine di abitanti, per il confronto con quelli di dimensione simile
const simili = () => caricaJSON(new URL('comuni-simili.json', DATI)).catch(() => null);
const file = (nome) => caricaJSON(new URL(`p/${nome}.json`, DATI));

const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;
const nomeEnte = (e) => (e[6] ? `Comune di ${e[0]}` : e[0]).replace(/^Comune di Roma Capitale$/, 'Roma Capitale');

// ---------- Ricerca ----------

let attesa;
const campo = $('#cerca-comune');
const lista = $('#risultati-comuni');
campo.addEventListener('focus', () => { indice().catch(() => {}); });
campo.addEventListener('input', () => {
  clearTimeout(attesa);
  attesa = setTimeout(async () => {
    const q = campo.value;
    if (q.trim().length < 2) { lista.hidden = true; return; }
    lista.hidden = false;
    lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco degli enti…</button></li>';
    try {
      const { enti } = await indice();
      const trovati = cercaIn(enti, q, {
        testoDi: (e) => `${e[6] ? 'comune ' : ''}${e[0]} ${e[2]} ${e[3]} ${alias(e[0])}`,
        nomeDi: (e) => e[0],
        pesoDi: (e) => (e[6] ? 3 : 0) + Math.log10(e[5] + 1),
        limite: 10,
      });
      lista.innerHTML = trovati.length
        ? trovati.map((e) => `<li><button type="button" data-cf="${esc(e[1])}" data-file="${esc(e[4])}">${esc(nomeEnte(e))}<small>${esc([e[2] && `${e[2]}${e[3] ? ` (${e[3]})` : ''}`, `${numeroIt(e[5])} procedure nel 2025`].filter(Boolean).join(' · '))}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessun ente trovato. Prova con meno parole: gli enti con meno di 5 procedure nel 2025 non sono in elenco.</button></li>';
      $$('[data-cf]', lista).forEach((b) => b.addEventListener('click', () => { lista.hidden = true; campo.value = ''; apri(b.dataset.cf, b.dataset.file); }));
    } catch {
      lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
    }
  }, 120);
});

// Le sigle che i cittadini usano, cercabili anche se l'ente le scrive per esteso
function alias(nome) {
  const n = nome.toLowerCase();
  const a = [];
  if (/azienda sanitaria|aziendasanitaria|unita sanitaria|unità sanitaria/.test(n)) a.push('asl ausl usl');
  if (/ospedalier/.test(n)) a.push('ospedale ao aou');
  if (/universit/.test(n)) a.push('universita ateneo');
  return a.join(' ');
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => apri(b.dataset.esempio)));

// ---------- Scheda ----------

async function apri(cf, nomeFile) {
  const box = $('#scheda');
  box.innerHTML = '<section class="pannello"><p>Carico gli appalti…</p></section>';
  try {
    if (!nomeFile) {
      const { enti } = await indice();
      nomeFile = enti.find((e) => e[1] === cf)?.[4];
      if (!nomeFile) { box.innerHTML = '<section class="pannello"><p>Questo ente non ha almeno 5 procedure pubblicate nel 2025, oppure non compare nei dati ANAC con questo codice fiscale.</p></section>'; return; }
    }
    const [schede, conf, med] = await Promise.all([file(nomeFile), confronto(), medie()]);
    const s = schede[cf];
    if (!s) throw new Error('ente non trovato nel file ' + nomeFile);
    if (med && s.istat && s.pop) med.simili = await simili();
    box.innerHTML = disegna(s, conf, med);
    scriviAncora({ cf });
    collega(box, s);
    box.querySelector('h2')?.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  } catch (e) {
    box.innerHTML = `<section class="pannello"><p>Non riesco a caricare i dati di questo ente. Riprova tra poco.</p><p><small>${esc(e.message)}</small></p></section>`;
  }
}

function disegna(s, conf, med) {
  const nome = s.istat ? (s.nome === 'Roma Capitale' ? s.nome : `Comune di ${s.nome}`) : s.nome;
  const proc = procedure(s);
  const accesi = INDICATORI.filter((i) => ['alto', 'medio', 'basso'].includes(livello(i.id, s.ind[i.id])));
  const pc = s.per_conto;
  return `
  <section class="pannello" aria-labelledby="t-ente">
    <div class="occhiello">Procedure pubblicate nel ${conf.anno} · ${esc([s.comune, s.prov].filter(Boolean).join(' · '))}</div>
    <h2 id="t-ente" tabindex="-1">${esc(nome)}</h2>
    <p>Nel ${conf.anno} ha avviato <b>${numeroIt(s.n)} procedure</b> di acquisto, per un valore a base di gara di <b>${euroParole(s.v)}</b>. ${accesi.length ? `<b>${accesi.length === 1 ? 'Un segnale' : `${accesi.length} segnali`} da guardare</b>: ${esc(accesi.map((i) => i.nome.toLowerCase()).join(', '))}.` : 'Nessun indicatore è sopra quello degli enti simili.'}</p>
    <p><small>Confronto con: ${esc(s.gruppo)}. Un segnale si accende, come fa ANAC, quando l'ente supera il 75% degli enti simili.</small></p>
    <div class="scorri"><table class="procedure"><thead><tr><th scope="col">Come ha comprato</th><th scope="col" class="n">Procedure</th><th scope="col" class="n">Valore</th><th scope="col" class="n">Quota del valore</th></tr></thead>
      <tbody>${proc.map((p) => `<tr><td>${esc(p.nome)}</td><td class="n">${numeroIt(p.n)}</td><td class="n">${euroParole(p.v)}</td><td class="n">${percento(p.quota, 1)}</td></tr>`).join('')}</tbody></table></div>
    ${s.per_conto ? `<p><small>In più, altre stazioni appaltanti (centrali uniche di committenza, Unioni di Comuni) hanno svolto per questo ente ${pc[0] === 1 ? 'una procedura' : `${numeroIt(pc[0])} procedure`}, per ${euroParole(pc[1])}.</small></p>` : ''}
  </section>

  <div class="avviso-segnale"><b>Un segnale non è un illecito.</b> Indica una procedura che merita di essere guardata meglio. Spesso la ragione è buona e si legge negli atti: per questo accanto alle gare segnalate trovi la richiesta già pronta.</div>

  <section aria-labelledby="t-ind">
    <h2 id="t-ind" class="sr-only">Gli indicatori</h2>
    <div class="indicatori">${INDICATORI.map((i) => schedaIndicatore(i, s, med)).join('')}</div>
  </section>

  <div class="due">
    ${s.fornitori?.length ? `<section class="pannello" aria-labelledby="t-forn">
      <div class="occhiello">Valore aggiudicato nel ${conf.anno}</div>
      <h2 id="t-forn">I fornitori principali</h2>
      <div class="scorri"><table class="procedure"><thead><tr><th scope="col">Fornitore</th><th scope="col" class="n">Contratti</th><th scope="col" class="n">Valore</th><th scope="col" class="n">Quota</th></tr></thead>
      <tbody>${s.fornitori.map((f) => `<tr><td>${esc(f.nome)}</td><td class="n">${numeroIt(f.n)}</td><td class="n">${euroParole(f.v)}</td><td class="n">${percento(f.quota, 1)}</td></tr>`).join('')}</tbody></table></div>
      <p><small>Una società partecipata dall'ente in cima alla lista è normale: gestisce servizi per conto suo. I nomi delle persone fisiche non sono mostrati.</small></p>
    </section>` : ''}
    <section class="pannello" aria-labelledby="t-grandi">
      <div class="occhiello">Per valore a base di gara</div>
      <h2 id="t-grandi">Le procedure più grandi</h2>
      ${lotti(s.piu_grandi, s)}
    </section>
  </div>

  <section class="pannello" aria-labelledby="t-fare">
    <div class="occhiello">Il passo successivo</div>
    <h2 id="t-fare">Cosa puoi fare</h2>
    <ol class="passi">
      <li><b>Chiedi gli atti</b> di una gara segnalata: decisione di contrarre, verbali, aggiudicazione, contratto. È gratis e non devi spiegare perché. Copia il testo accanto alla gara e <a href="${esc(altroStrumento('chiedo-gli-atti'))}">completa la richiesta con Chiedo gli atti</a>.</li>
      <li><b>Cerca la gara</b> nella sezione «Amministrazione trasparente», voce «Bandi di gara e contratti», del sito dell'ente: il codice CIG la identifica.</li>
      ${s.istat ? `<li><b>Guarda il bilancio</b> del Comune: quanto spende e per cosa. <a href="${esc(altroStrumento('bilancio-comune'))}#istat=${esc(s.istat)}">Apri Il bilancio del mio Comune</a>.</li>` : ''}
      <li><b>Se trovi qualcosa di serio</b>, puoi segnalarlo ad ANAC o, se lavori per l'ente, usare il canale per il whistleblowing previsto dal d.lgs. 24/2023.</li>
    </ol>
  </section>
  <p><small>Dati: ${fonte(FONTI.anac)}, procedure con data di pubblicazione nel ${conf.anno}, aggiudicazioni comunicate entro gennaio 2026. Metodi: ${fonte(FONTI.ocp)}; ${fonte(FONTI.cardinal)}; ${fonte(FONTI.anac_indicatori)}. Verificato il ${new Date(VERIFICATO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}.</small></p>`;
}

function schedaIndicatore(i, s, med) {
  const v = s.ind[i.id];
  const liv = livello(i.id, v);
  const [parola, tono] = PAROLE_LIVELLO[liv];
  const esempi = i.esempi ? s.esempi?.[i.esempi] : null;
  const valore = !v ? '—' : i.id === 'cumulo' ? numeroIt(v.n) : percento(v.quota, 1);
  const barra = v && v.mediana !== undefined && i.id !== 'cumulo'
    ? `<div class="confronto-ind" role="img" aria-label="${esc(`Questo ente ${percento(v.quota, 1)}, valore tipico ${percento(v.mediana, 1)}`)}"><span class="tipico" style="left:${Math.min(100, v.mediana)}%"></span><span class="questo" style="left:${Math.min(100, v.quota)}%"></span></div><small>Valore tipico degli enti simili: ${percento(v.mediana, 1)} · ${v.pct !== undefined ? `più alto del ${v.pct}% degli enti simili` : ''}</small>`
    : '';
  return `<article class="ind" data-tono="${tono}">
    <span class="codice">${esc(i.codice)}</span>
    <h3>${esc(i.nome)}</h3>
    <div class="valore">${valore}</div>
    <span class="pill p-${tono === 'neutro' ? 'neutro' : tono}">${esc(parola)}</span>
    <p>${v ? esc(i.misura(v)).replace(/^./, (c) => c.toUpperCase()) + '.' : 'Non ci sono abbastanza procedure per calcolarlo.'}</p>
    ${barra}
    ${i.id === 'senza_gara' ? riferimenti(v, s, med) : ''}
    <details><summary>Perché conta</summary><p>${esc(i.perche)}</p><ul class="fonti">${i.fonti.map((f) => `<li>${fonte(FONTI[f])}</li>`).join('')}</ul></details>
    ${esempi?.length ? `<details><summary>${i.id === 'cumulo' ? 'I fornitori' : 'Le procedure segnalate'} (${esempi.length})</summary>${i.id === 'cumulo' ? cumuli(esempi) : lotti(esempi, s)}</details>` : ''}
  </article>`;
}

/** Affidamenti diretti: l'ente accanto alla media della sua Regione e dell'Italia, per lo stesso tipo di ente e per tutti gli enti. */
function riferimenti(v, s, med) {
  if (!v || !med) return '';
  const regione = med.prov_regione?.[s.prov];
  const righe = [['Questo ente', [v.quota, v.quota_n ?? v.quota], true]];
  const tipo = s.gruppo ? s.gruppo.charAt(0).toLowerCase() + s.gruppo.slice(1) : '';
  if (regione && med.regioni?.[regione]?.[s.gruppo]) righe.push([`Media in ${regione}, ${tipo}`, med.regioni[regione][s.gruppo]]);
  if (med.nazionale?.[s.gruppo]) righe.push([`Media in Italia, ${tipo}`, med.nazionale[s.gruppo]]);
  if (regione && med.regioni?.[regione]?._tutti) righe.push([`Media di tutti gli enti in ${regione}`, med.regioni[regione]._tutti]);
  if (med.nazionale?._tutti) righe.push(['Media di tutti gli enti in Italia', med.nazionale._tutti]);
  if (righe.length < 2) return '';
  const vicini = comuniSimili(s, med.simili);
  return `<div class="riferimenti" role="group" aria-label="Medie di riferimento degli affidamenti diretti">
    <p class="rif-titolo">Per confronto, nel ${esc(String(med.anno))}</p>
    <ul>${righe.map(([nome, [q, qn, enti], questo]) => `<li class="${questo ? 'rif-questo' : ''}">
      <span class="rif-nome">${esc(nome)}${enti ? ` <small>(${numeroIt(enti)} enti)</small>` : ''}</span>
      <span class="rif-barra" aria-hidden="true"><i style="width:${Math.min(100, Math.max(0, q))}%"></i></span>
      <span class="rif-valore"><b>${percento(q, 1)}</b> <small>del valore · ${percento(qn, 1)} delle procedure</small></span></li>`).join('')}</ul>
    ${vicini.length ? `<p class="rif-titolo">Comuni di dimensione simile</p>
    <ul>${vicini.map(([cf, nome, prov, pop, q, qn]) => `<li>
      <span class="rif-nome"><button type="button" class="link" data-apri="${esc(cf)}">${esc(nome)}</button> <small>(${esc(prov)}, ${numeroIt(pop)} abitanti)</small></span>
      <span class="rif-barra" aria-hidden="true"><i style="width:${Math.min(100, Math.max(0, q))}%"></i></span>
      <span class="rif-valore"><b>${percento(q, 1)}</b> <small>del valore · ${percento(qn, 1)} delle procedure</small></span></li>`).join('')}
      <li class="rif-media"><span class="rif-nome">Media di questi ${vicini.length} Comuni</span>
      <span class="rif-barra" aria-hidden="true"><i style="width:${Math.min(100, media(vicini, 4))}%"></i></span>
      <span class="rif-valore"><b>${percento(media(vicini, 4), 1)}</b> <small>del valore · ${percento(media(vicini, 5), 1)} delle procedure</small></span></li></ul>` : ''}
    <small>Media semplice tra gli enti con almeno 5 procedure: ogni ente conta uno, grande o piccolo. I Comuni di dimensione simile sono quelli d'Italia con il numero di abitanti più vicino. Fonte: ANAC, elaborazione del Polpo civico.</small>
  </div>`;
}

const media = (lista, i) => lista.reduce((t, x) => t + x[i], 0) / lista.length;

/** I 6 Comuni con il numero di abitanti più vicino (in proporzione: per Roma contano le grandi città). */
function comuniSimili(s, dati) {
  const lista = dati?.comuni;
  if (!lista || !s.pop) return [];
  const qui = lista.findIndex((c) => c[0] === s.cf);
  let a, b;
  if (qui >= 0) { a = qui - 1; b = qui + 1; } else {
    b = lista.findIndex((c) => c[3] >= s.pop);
    if (b < 0) b = lista.length;
    a = b - 1;
  }
  const vicini = [];
  const dist = (c) => Math.abs(Math.log(c[3] / s.pop));
  while (vicini.length < 6 && (a >= 0 || b < lista.length)) {
    if (b < lista.length && lista[b][0] === s.cf) { b++; continue; }
    if (a >= 0 && lista[a][0] === s.cf) { a--; continue; }
    if (a < 0 || (b < lista.length && dist(lista[b]) < dist(lista[a]))) vicini.push(lista[b++]);
    else vicini.push(lista[a--]);
  }
  return vicini.sort((x, y) => x[3] - y[3]);
}

function lotti(lista, s) {
  if (!lista?.length) return '<p>Nessuna procedura.</p>';
  return `<ul class="lotti">${lista.map((l) => `<li>
    <b>${esc(capitalizza(l.oggetto))}</b>
    <small>${esc([euroParole(l.importo), l.procedura, l.data && new Date(l.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }), l.offerenti > 0 && `${l.offerenti} ${l.offerenti === 1 ? 'offerta' : 'offerte'}`, l.giorni !== undefined && `${l.giorni} giorni per le offerte`, l.fornitore && `a ${l.fornitore}`].filter(Boolean).join(' · '))} · CIG <span class="cig">${esc(l.cig)}</span></small>
    <span><button type="button" class="link" data-copia="${esc(richiestaAtti(s, l))}">Copia la richiesta degli atti</button> <span class="esito-copia" aria-live="polite"></span></span>
  </li>`).join('')}</ul>`;
}

function cumuli(lista) {
  return `<ul class="lotti">${lista.map((c) => `<li><b>${esc(c.fornitore)}</b><small>${numeroIt(c.n)} affidamenti diretti di ${esc(c.tipo)}, in tutto ${euroParole(c.v)} (soglia della gara: ${euroParole(c.soglia)})</small></li>`).join('')}</ul>`;
}

const capitalizza = (t) => (t && t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t || '');

function collega(box) {
  $$('[data-copia]', box).forEach((b) => b.addEventListener('click', () => copia(b.dataset.copia, b.nextElementSibling)));
  $$('[data-apri]', box).forEach((b) => b.addEventListener('click', () => apri(b.dataset.apri)));
}

// Apertura diretta: #cf=80014890638
const ancora = leggiAncora();
if (ancora.cf) apri(ancora.cf);
