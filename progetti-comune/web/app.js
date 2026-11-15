// Interfaccia di «I fondi europei nel mio Comune». Tutto gira nel browser: l'elenco dei Comuni e le schede
// di una provincia si caricano solo quando servono; il Comune scelto resta sul tuo dispositivo.
import { $, $$, esc, archivio } from '../src/comune/interfaccia.js';
import { caricaJSON, euroParole, euroTondi, numeroIt } from '../src/comune/schede.js';
import { indicizza, cerca, progettiComune, dataIt, comuniDellaFascia, FONTI, VERIFICATO } from '../src/regole.js';

const DATI = new URL('../dati/', import.meta.url);
const memoria = archivio('progetti-comune-v1');
let indice = null;
const carica = async () => (indice ||= indicizza(await caricaJSON(new URL('comuni.json', DATI))));
const provincia = (sigla) => caricaJSON(new URL(`p/${sigla}.json`, DATI));
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;
const fonte = (f, testo) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(testo || f.titolo)}</a>`;
const lisci = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
const plurale = (n, uno, molti) => `${numeroIt(n)} ${n === 1 ? uno : molti}`;

// ---------- la ricerca del Comune ----------

$('#questionario').innerHTML = `
  <section class="sezione" id="s-comune">
    <h2>Il tuo Comune</h2>
    <div class="domanda cerca-ente">
      <label for="cerca-comune">Scrivi il nome del Comune</label>
      <input type="text" id="cerca-comune" placeholder="es. Treviso, Matera, San Giovanni in Persiceto" autocomplete="off" aria-controls="risultati-comuni" enterkeyhint="search">
      <ul class="risultati-enti" id="risultati-comuni" hidden></ul>
    </div>
    <p class="aiuto">Se ci sono più Comuni con lo stesso nome, aggiungi la sigla della provincia: «Castro LE».</p>
  </section>`;
const campo = $('#cerca-comune'), lista = $('#risultati-comuni');

let attesa, trovati = [];
campo.addEventListener('focus', () => { carica().catch(() => {}); });
campo.addEventListener('input', () => { clearTimeout(attesa); attesa = setTimeout(suggerisci, 120); });
campo.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); if (trovati[0]) apri(trovati[0].istat); }
  if (e.key === 'ArrowDown') { e.preventDefault(); $('button', lista)?.focus(); }
});

async function suggerisci() {
  const q = campo.value;
  if (q.trim().length < 2) { lista.hidden = true; return; }
  lista.hidden = false;
  if (!indice) lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco dei Comuni…</button></li>';
  try {
    trovati = cerca(await carica(), q, 8);
    lista.innerHTML = trovati.length
      ? trovati.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.nome)}<small>${esc(`${r.sigla} · ${r.regione}${r.n ? ` · ${plurale(r.n, 'progetto', 'progetti')}` : ''}`)}</small></button></li>`).join('')
      : '<li><button type="button" disabled>Nessun Comune con questo nome: controlla come è scritto.</button></li>';
    $$('[data-i]', lista).forEach((b) => b.addEventListener('click', () => apri(trovati[Number(b.dataset.i)].istat)));
  } catch {
    lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
  }
}

// ---------- la scheda del Comune ----------

async function apri(istat, scorri = true) {
  lista.hidden = true;
  const box = $('#esito');
  box.innerHTML = '<section class="pannello"><p>Carico i progetti…</p></section>';
  try {
    const idx = await carica();
    const voce = idx.righe.find((r) => r.istat === istat);
    if (!voce) { box.innerHTML = '<section class="pannello"><p>Non trovo questo Comune nell\'elenco.</p></section>'; return; }
    campo.value = `${voce.nome} (${voce.sigla})`;
    const prov = voce.n ? await provincia(voce.sigla) : {};
    const s = progettiComune({ elenco: idx, province: { [voce.sigla]: prov } }, istat, new Date());
    memoria.scrivi({ istat });
    try { history.replaceState(null, '', `#istat=${istat}`); } catch { /* pagina incorporata */ }
    box.innerHTML = disegna(s);
    attivaOrdinamento();
    if (scorri) box.scrollIntoView({ block: 'start', behavior: lisci() });
  } catch (e) {
    box.innerHTML = `<section class="pannello"><p>Non riesco a caricare i dati di questo Comune. Riprova tra poco.</p><p><small>${esc(e.message)}</small></p></section>`;
  }
}

const a = (nome) => (/^[AEIOUaeiou]/.test(nome) ? 'Ad' : 'A');

function disegna(s) {
  const c = s.comune;
  const quando = dataIt(s.estrazione);
  const occhiello = `PNRR · dati al ${quando} · ${c.sigla} · ${c.regione}`;
  if (s.esito === 'serve_dato') return `<section class="pannello verdetto" data-tono="forse"><p class="occhiello">${esc(occhiello)}</p><p class="titolo">Serve un dato</p><p>${esc(s.motivo)}</p></section>`;
  if (s.esito === 'nessuno') {
    return `<section class="pannello verdetto" data-tono="neutro"><p class="occhiello">${esc(occhiello)}</p><p class="titolo">${esc(`${a(c.nome)} ${c.nome} la fonte non localizza progetti del PNRR`)}</p>
      <p>Può darsi che il Comune partecipi a progetti registrati a livello di provincia o di Regione, che qui non contiamo. Per saperlo con certezza puoi chiedere al Comune: <a href="${esc(altroStrumento('chiedo-gli-atti'))}">prepara la richiesta con Chiedo gli atti</a>.</p></section>${spiegazioni()}`;
  }
  const conf = s.confronto;
  const concl = s.stati.find((x) => x.codice === 'c');
  return `
  <section class="pannello verdetto" data-tono="neutro" aria-labelledby="t-comune">
    <p class="occhiello">${esc(occhiello)}</p>
    <h2 class="titolo" id="t-comune" tabindex="-1">${esc(`${a(c.nome)} ${c.nome} ${s.n === 1 ? 'un progetto' : `${numeroIt(s.n)} progetti`} per ${euroParole(s.valore)}`)}</h2>
    <p>Sono i progetti finanziati dal PNRR che la fonte localizza nel Comune, chiunque li realizzi: il Comune, la Regione, l'azienda sanitaria, un ministero, una scuola, un'impresa. ${s.valore - s.fondiUe > 1 ? `Del valore totale, <b>${euroParole(s.pnrr)}</b> vengono dal PNRR${s.ue ? ` e <b>${euroParole(s.ue)}</b> da altri fondi europei` : ''}; il resto da altre fonti pubbliche e private.` : 'Sono pagati per intero con i fondi europei.'}</p>
    <div class="cifre">
      <div><b>${numeroIt(s.n)}</b><span>progetti</span></div>
      <div><b>${s.perAbitante !== null ? euroTondi(s.perAbitante) : '—'}</b><span>di fondi europei per abitante${s.mediana !== null ? ` · mediana ${euroTondi(s.mediana)}` : ''}</span></div>
      <div><b>${concl ? numeroIt(concl.n) : 0}</b><span>conclusi secondo la fonte</span></div>
      <div><b>${numeroIt(s.oltre.n)}</b><span>oltre la data di fine prevista</span></div>
    </div>
    ${s.perAbitante !== null && s.mediana !== null ? `<p><small>${esc(`Fondi europei (PNRR e altri fondi UE) per abitante: ${euroTondi(s.perAbitante)} con ${numeroIt(c.pop)} abitanti al 1° gennaio 2025, ${conf ? conf.parola : ''} dei ${numeroIt(s.comuniFascia)} Comuni ${comuniDellaFascia(s.fascia)} (${euroTondi(s.mediana)}). La mediana è il valore di mezzo: metà dei Comuni ne ha di più, metà di meno. Un valore alto o basso non è un merito né una colpa: dipende anche da ospedali, scuole e opere di area vasta che hanno sede nel Comune.`)}</small></p>` : ''}
    ${s.multi ? `<p><small>${esc(`${plurale(s.multi, 'progetto riguarda', 'progetti riguardano')} anche altri Comuni: qui conta solo la parte attribuita a ${c.nome} dalla percentuale di localizzazione indicata dalla fonte.`)}</small></p>` : ''}
  </section>

  <div class="due">
    <section class="pannello" aria-labelledby="t-temi">
      <p class="occhiello">Missioni del PNRR</p>
      <h2 id="t-temi">Per cosa sono, su 100 euro di valore</h2>
      <ul class="barre">${s.temi.map((t) => barra(t, s.temi[0].su100)).join('')}</ul>
    </section>

    <section class="pannello" aria-labelledby="t-stato">
      <p class="occhiello">Stato al ${esc(quando)}</p>
      <h2 id="t-stato">A che punto sono</h2>
      <ul class="stati">${s.stati.map((x) => `<li><b>${esc(x.nome)}</b><span class="val">${plurale(x.n, 'progetto', 'progetti')} · ${euroParole(x.valore)}</span><small>${esc(x.spiega)}</small></li>`).join('')}</ul>
      ${ritardi(s)}
    </section>
  </div>

  <section class="pannello" aria-labelledby="t-grandi">
    <p class="occhiello">I ${Math.min(20, s.progetti.length)} più grandi per valore nel Comune</p>
    <h2 id="t-grandi">I progetti più grandi</h2>
    <p>Il CUP è il codice unico del progetto: apre la scheda ufficiale su OpenCUP e serve per chiedere gli atti. Tocca i titoli delle colonne per ordinare.</p>
    <div class="scorri"><table class="tabella" id="tab-progetti">
      <thead><tr>
        <th scope="col" data-k="titolo"><button type="button">Progetto</button></th>
        <th scope="col" data-k="quota" aria-sort="descending"><button type="button">Valore nel Comune</button></th>
        <th scope="col" data-k="statoNome"><button type="button">Stato</button></th>
        <th scope="col" data-k="finePrevista"><button type="button">Fine prevista</button></th>
        <th scope="col" data-k="attuatore"><button type="button">Chi lo realizza</button></th>
      </tr></thead>
      <tbody>${righeProgetti(s.progetti, 'quota', -1)}</tbody>
    </table></div>
    ${s.n > s.progetti.length ? `<p><small>${esc(`Gli altri ${numeroIt(s.n - s.progetti.length)} progetti sono nei dati di Italia Domani: cerca il Comune nel file «Localizzazione dei progetti del PNRR».`)} ${fonte(FONTI.localizzazione, 'Apri il catalogo')}</small></p>` : ''}
  </section>

  <section class="pannello" aria-labelledby="t-chi">
    <p class="occhiello">Soggetti attuatori</p>
    <h2 id="t-chi">Chi li realizza</h2>
    <p>Il soggetto attuatore è l'ente o l'impresa che porta avanti il progetto e risponde delle date e delle spese. È a lui che si chiedono gli atti.</p>
    <div class="scorri"><table class="tabella" id="tab-attuatori">
      <thead><tr>
        <th scope="col" data-k="nome"><button type="button">Soggetto attuatore</button></th>
        <th scope="col" data-k="n"><button type="button">Progetti</button></th>
        <th scope="col" data-k="valore" aria-sort="descending"><button type="button">Valore nel Comune</button></th>
      </tr></thead>
      <tbody>${righeAttuatori(s.attuatori, 'valore', -1)}</tbody>
    </table></div>
    ${s.altriAttuatori.n ? `<p><small>${esc(`Altri ${plurale(s.altriAttuatori.n, 'progetto', 'progetti')} di altri soggetti, per ${euroParole(s.altriAttuatori.valore)}. I nomi sono scritti come nella fonte, che li tronca a 40 caratteri; i nomi delle persone fisiche non si mostrano.`)}</small></p>` : ''}
  </section>
  ${spiegazioni(c)}
  <p class="fonti"><small>Dati: ${fonte(FONTI.progetti)} e ${fonte(FONTI.localizzazione)}, versione ${esc(s.versione)} con i dati estratti da ReGiS il ${esc(quando)}; popolazione: ${fonte(FONTI.istat)}. Contiamo i progetti con finanziamento del PNRR o di altri fondi europei; un CUP conta una volta anche se ha più righe. Regole verificate il ${esc(dataIt(VERIFICATO))}.</small></p>`;
}

function barra(t, massimo) {
  const larg = Math.max(0.5, (100 * t.su100) / (massimo || 100));
  return `<li><div class="testa"><b>${esc(t.nome)}</b><span class="val">${euroParole(t.valore)}</span></div>
    <div class="pista" role="img" aria-label="${esc(`${t.nome}: ${Math.round(t.su100)} euro su 100, ${t.n} progetti`)}"><span class="pieno" style="width:${larg}%"></span></div>
    <small>${esc(`${t.su100 < 1 ? 'meno di 1' : Math.round(t.su100)} su 100 · ${plurale(t.n, 'progetto', 'progetti')} · missione «${t.esteso}»`)}</small></li>`;
}

function ritardi(s) {
  const quando = dataIt(s.estrazione);
  const righe = [];
  if (s.oltre.n) {
    const date = s.oltre.date.slice().sort((x, y) => y.n - x.n || (x.data < y.data ? -1 : 1));
    const prime = date.slice(0, 6).map((d) => `<li>${esc(`${plurale(d.n, 'progetto', 'progetti')} con fine prevista il ${dataIt(d.data)} (${euroParole(d.valore)})`)}</li>`).join('');
    righe.push(`<p><b>${esc(`${plurale(s.oltre.n, 'progetto aveva', 'progetti avevano')} superato la data di fine prevista`)}</b>${esc(` e al ${quando} non ${s.oltre.n === 1 ? 'risultava concluso' : 'risultavano conclusi'}:`)}</p><ul class="date">${prime}${date.length > 6 ? `<li>${esc(`e altre ${date.length - 6} date`)}</li>` : ''}</ul>
      <p><small>È quello che dice la fonte. La data può essere stata spostata, oppure il progetto può essere finito senza che la data di fine effettiva sia stata registrata: chiedilo al soggetto attuatore.</small></p>`);
  } else righe.push(`<p>${esc(`Al ${quando} nessun progetto aveva superato la data di fine prevista senza risultare concluso.`)}</p>`);
  if (s.dopo.n) righe.push(`<p><small>${esc(`${plurale(s.dopo.n, 'progetto aveva', 'progetti avevano')} la fine prevista tra il ${quando} e oggi: i dati pubblicati non dicono ancora se ${s.dopo.n === 1 ? 'è concluso' : 'sono conclusi'}.`)}</small></p>`);
  if (s.senzaData) righe.push(`<p><small>${esc(`${plurale(s.senzaData, 'progetto non concluso è', 'progetti non conclusi sono')} senza data di fine prevista nella fonte.`)}</small></p>`);
  return righe.join('');
}

function spiegazioni(c) {
  return `
  <section class="pannello" aria-labelledby="t-cosa">
    <p class="occhiello">In breve</p>
    <h2 id="t-cosa">PNRR, coesione e come chiedere gli atti</h2>
    <dl class="glossario">
      <dt>PNRR</dt><dd>Il Piano nazionale di ripresa e resilienza è la parte italiana di Next Generation EU: soldi europei, in parte a prestito, legati a obiettivi da raggiungere entro il 31 agosto 2026; l'Unione paga entro il 31 dicembre 2026. ${fonte(FONTI.rrf, 'Regolamento (UE) 2021/241, artt. 18 e 24')}</dd>
      <dt>Politiche di coesione</dt><dd>I fondi europei per ridurre i divari tra territori (FESR, FSE+) e il Fondo nazionale per lo sviluppo e la coesione, in programmi di sette anni. ${fonte(FONTI.tfue, 'TFUE, art. 174')}. Qui compaiono solo come «altri fondi europei» dentro i progetti PNRR: i progetti pagati soltanto dalla coesione li trovi su ${fonte(FONTI.opencoesione, 'OpenCoesione')}, che li elenca per Comune come chiede il ${fonte(FONTI.cpr, 'regolamento (UE) 2021/1060, art. 49')}.</dd>
    </dl>
    <ol class="passi">
      <li><b>Copia il CUP</b> del progetto che ti interessa e apri la sua scheda su OpenCUP.</li>
      <li><b>Chiedi gli atti al soggetto attuatore</b> (il Comune, la Regione, l'azienda sanitaria…): cronoprogramma, contratti, stati di avanzamento, collaudo. L'accesso civico è gratuito, salvo il costo delle copie su carta o supporto (${fonte(FONTI.accesso, 'd.lgs. 33/2013, art. 5')}). <a href="${esc(altroStrumento('chiedo-gli-atti'))}">Prepara la richiesta con Chiedo gli atti</a>.</li>
      <li><b>Guarda come ha comprato</b> l'ente: gare, affidamenti diretti, fornitori. <a href="${esc(altroStrumento('appalti'))}">Apri Red flag sugli appalti</a>${c ? ` e <a href="${esc(altroStrumento('bilancio-comune'))}#istat=${esc(c.istat)}">il bilancio del Comune</a>` : ''}.</li>
    </ol>
  </section>`;
}

// ---------- tabelle ordinabili ----------

const tabelle = {};
function righeProgetti(righe, chiave, verso) {
  tabelle.progetti = righe;
  return ordinaProgetti(chiave, verso);
}
function ordinaProgetti(chiave, verso) {
  return ordina(tabelle.progetti, chiave, verso).map((p) => `<tr>
      <td><b>${esc(p.titolo)}</b><small>${esc(p.misura)} · <a href="${esc(p.link)}" target="_blank" rel="noopener" class="cup">CUP ${esc(p.cup)}</a>${p.nComuni > 1 ? esc(` · progetto da ${euroParole(p.totale)} su ${p.nComuni} Comuni`) : ''}</small></td>
      <td class="n" data-e="Valore nel Comune">${euroParole(p.quota)}${p.pnrr && p.pnrr < p.totale ? `<small>${esc(`PNRR ${Math.round((100 * p.pnrr) / p.totale)}%`)}</small>` : ''}</td>
      <td data-e="Stato">${esc(p.statoNome)}${p.fase ? `<small>${esc(p.fase)}</small>` : ''}</td>
      <td class="n" data-e="Fine prevista">${p.finePrevista ? esc(dataIt(p.finePrevista)) : '—'}${p.fineEffettiva ? `<small>${esc(`conclusa il ${dataIt(p.fineEffettiva)}`)}</small>` : ''}${p.oltre ? '<small class="segnale">oltre la data prevista</small>' : ''}</td>
      <td data-e="Chi lo realizza">${esc(p.attuatore)}</td>
    </tr>`).join('') || '<tr><td colspan="5">Nessun progetto.</td></tr>';
}
function righeAttuatori(righe, chiave, verso) {
  tabelle.attuatori = righe;
  return ordinaAttuatori(chiave, verso);
}
function ordinaAttuatori(chiave, verso) {
  return ordina(tabelle.attuatori, chiave, verso).map((x) => `<tr><td>${esc(x.nome)}</td><td class="n">${numeroIt(x.n)}</td><td class="n">${euroParole(x.valore)}</td></tr>`).join('');
}
function ordina(righe, chiave, verso) {
  return [...righe].sort((x, y) => {
    const va = x[chiave], vb = y[chiave];
    if (typeof va === 'string' || typeof vb === 'string') return String(va || '￿').localeCompare(String(vb || '￿')) * verso;
    return ((va ?? -Infinity) - (vb ?? -Infinity)) * verso;
  });
}
function attivaOrdinamento() {
  for (const [id, f] of [['#tab-progetti', ordinaProgetti], ['#tab-attuatori', ordinaAttuatori]]) {
    const t = $(id);
    if (!t) continue;
    $$('th button', t).forEach((b) => b.addEventListener('click', () => {
      const th = b.closest('th');
      const k = th.dataset.k;
      const testo = ['titolo', 'statoNome', 'attuatore', 'nome', 'finePrevista'].includes(k);
      const scendi = th.getAttribute('aria-sort') ? th.getAttribute('aria-sort') === 'ascending' : !testo;
      $$('th', t).forEach((x) => x.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', scendi ? 'descending' : 'ascending');
      $('tbody', t).innerHTML = f(k, scendi ? -1 : 1);
    }));
  }
}

// ---------- esempi, memoria, apertura diretta ----------

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => apri(b.dataset.esempio)));
$('#cancella')?.addEventListener('click', () => {
  memoria.cancella(); campo.value = ''; $('#esito').innerHTML = '';
  try { history.replaceState(null, '', location.pathname); } catch { /* niente */ }
});

// Apertura diretta da un altro strumento: #istat=026086 (l'ancora non arriva al server)
(async () => {
  const ancora = /(?:^|[#&])istat=(\d{6})/.exec(location.hash)?.[1];
  const scelto = ancora || memoria.leggi({})?.istat;
  if (scelto) await apri(scelto, false);
})().catch(() => {});

