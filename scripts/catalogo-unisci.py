# Unisce nel catalogo gli strumenti fatti qui, in costruzione, esistenti altrove e da fare.
import re, sys, html as H
src, out = sys.argv[1], sys.argv[2]
s = open(src).read()
SITO = 'https://casaleggiodavide-stack.github.io/agenti-civici/'
# titolo della scheda -> (stato, nome nostro, link, nota)
QUI = {
  'Navigatore di bonus e sussidi': ('fatto', 'Mi spetta', SITO + 'mi-spetta/', '24 prestazioni nazionali e 67 misure regionali, con fonti'),
  'Multe e sanzioni': ('fatto', 'Faccio ricorso?', SITO + 'faccio-ricorso/', 'controllo del verbale e ricorso al Prefetto o al Giudice di Pace'),
  'Accesso civico assistito': ('fatto', 'Chiedo gli atti', SITO + 'chiedo-gli-atti/', 'FOIA verso 23.705 enti, riesame e ricorsi pronti'),
  'Consumatori e lavoratori': ('fatto', 'Mi rimborsano?', SITO + 'mi-rimborsano/', 'voli, treni, bagagli, bollette, telefono, banca: per ora la parte consumatori'),
  'Red flag sugli appalti': ('fatto', 'Red flag sugli appalti', SITO + 'appalti/', '1,45 milioni di procedure ANAC del 2025, 19.356 enti'),
  'Il bilancio del mio Comune spiegato': ('fatto', 'Il bilancio del mio Comune', SITO + 'bilancio-comune/', 'rendiconti di 7.808 Comuni, confronto con i Comuni simili'),
  'Dati civici come tool per ogni assistente': ('fatto', 'Server MCP degli agenti civici', 'https://github.com/casaleggiodavide-stack/agenti-civici/blob/main/mcp/LEGGIMI.md', 'dieci strumenti dentro gli assistenti AI'),
  'Assistente unico ai servizi con fonti': ('parziale', 'Assistente civico', SITO + 'assistente/', 'per ora bonus, multe, accesso agli atti e reclami'),
  'Sorveglianza dei siti pubblici': ('parziale', 'Sentinella delle regole', 'https://github.com/casaleggiodavide-stack/agenti-civici/tree/main/sentinella', 'sorveglia le 190 fonti usate dagli agenti'),
  'Reclami alla PA e difensore civico': ('fatto', 'Reclami alla PA', SITO + 'reclami-pa/', 'potere sostitutivo, difensori civici regionali, termini calcolati e lettere pronte'),
  'Segnalazioni urbane indipendenti': ('fatto', 'Segnalazioni urbane', SITO + 'segnalazioni/', 'chi deve intervenire, PEC dall\'Indice PA, segnalazione e sollecito pronti'),
  'Navigatore dei servizi con fonti': ('fatto', 'Navigatore dei servizi', SITO + 'navigatore/', '40 pratiche verificate sulle fonti ufficiali, cercabili con parole di tutti i giorni'),
  'Nomine pubbliche: Le carte del potere': ('arrivo', None, None, 'in arrivo'),
}
# priorità dalla classifica del Cantiere (pesi suggeriti, punteggio su 100)
PRIORITA = {'Multe e sanzioni': 80, 'Accesso civico assistito': 79, 'Consumatori e lavoratori': 79, 'Affinità con LLM': 77, 'Navigatore di bonus e sussidi': 73,
  'Lettera al rappresentante, consegnata': 72, 'Lettore della Gazzetta Ufficiale': 72, 'Il mio parlamentare, questa settimana': 71, 'Navigatore dei servizi con fonti': 71,
  'Segnalazioni urbane indipendenti': 69, 'Il bilancio del mio Comune spiegato': 64, 'Tasse senza intermediari': 63, 'Red flag sugli appalti': 60,
  'Il consiglio comunale in dieci righe': 59, 'Dati civici come tool per ogni assistente': 53}
TAG = {'fatto': ('t-qui', 'fatto qui'), 'parziale': ('t-qui', 'fatto qui, in parte'), 'costruzione': ('t-cantiere', 'in costruzione'), 'arrivo': ('t-cantiere', 'in arrivo')}

def stato_da_tag(tags):
    t = ' '.join(tags).lower()
    if 'esiste in italia' in t or 'in corso in italia' in t or 'partner in italia' in t: return 'italia'
    if 'estero' in t: return 'estero'
    return 'dafare'

def card(m):
    blocco = m.group(0)
    titolo = H.unescape(re.sub('<[^>]+>', '', re.search(r'<h3>(.*?)</h3>', blocco, re.S).group(1))).strip()
    tags = re.findall(r'class="tag [^"]+">([^<]+)', blocco)
    stato = stato_da_tag(tags)
    q = QUI.get(titolo)
    if q: stato = q[0]
    attr = f' data-stato="{stato}" data-titolo="{H.escape(titolo)}"' + (f' data-priorita="{PRIORITA[titolo]}"' if titolo in PRIORITA else '')
    blocco = blocco.replace('<div class="card">', f'<div class="card"{attr}>', 1)
    extra = ''
    if q:
        cls, testo = TAG[q[0]]
        blocco = blocco.replace('<div class="tags">', f'<div class="tags"><span class="tag {cls}">{testo}</span>', 1)
        if q[2]:
            extra = f'<a class="nostro" href="{q[2]}" target="_top"><b>{H.escape(q[1])}</b><span>{H.escape(q[3])}</span></a>'
        else:
            extra = f'<div class="nostro cantiere"><b>Agenti civici</b><span>{H.escape(q[3])}</span></div>'
    if titolo in PRIORITA and stato not in ('fatto', 'parziale'):
        blocco = blocco.replace('<div class="tags">', f'<div class="tags"><span class="tag t-prio" title="Punteggio nella classifica del Cantiere">priorità {PRIORITA[titolo]}/100</span>', 1)
    # la scheda «fatta qui» porta il link subito sotto la descrizione
    return re.sub(r'(</p>)', r'\1' + extra.replace('\\', r'\\'), blocco, count=1) if extra else blocco

s, n = re.subn(r'<div class="card">.*?</div></div>(?=\s*(?:<div class="card">|</div>))', card, s, flags=re.S)
print('schede', n, file=sys.stderr)

css = '''
[hidden]{display:none!important}
.t-qui{background:var(--filo);color:#fff}
.t-cantiere{background:var(--paper-2);color:var(--filo);border:1px dashed var(--filo)}
.t-prio{border:1px solid var(--line);color:var(--ink-2)}
.nostro{display:grid;gap:2px;margin:10px 0 4px;padding:10px 12px;background:var(--paper-2);border-radius:4px;color:var(--ink);text-decoration:none}
a.nostro b::after{content:" →";color:var(--filo)}
.nostro span{font-size:13px;color:var(--ink-2)}
.nostro.cantiere{border-style:dashed}
.card[data-stato="fatto"],.card[data-stato="parziale"]{box-shadow:inset 0 3px 0 var(--filo)}
.filtri{position:sticky;top:44px;z-index:4;background:var(--paper);padding:12px 0;margin-top:26px;border-bottom:1px solid var(--line);display:grid;gap:10px}
.filtri .righe{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.filtri button{font:inherit;font-size:13.5px;background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:6px 12px;cursor:pointer;color:var(--ink)}
.filtri button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.filtri button .c{font-family:var(--mono);font-size:11.5px;opacity:.75;margin-left:4px}
.filtri input{font:inherit;font-size:15px;padding:8px 12px;border:1px solid var(--line);border-radius:6px;background:#fff;min-width:min(320px,100%)}
.filtri .vista{margin-left:auto}
.filtri .conta{font-family:var(--mono);font-size:12px;color:var(--ink-3)}
.vuoto-filtro{display:none;padding:18px 0;color:var(--ink-3)}
.tabella{display:none;overflow-x:auto;margin-top:18px;border:1px solid var(--line);border-radius:8px;background:#fff}
.tabella table{border-collapse:collapse;width:100%;min-width:760px;font-size:14px}
.tabella th{text-align:left;font-family:var(--mono);font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);font-weight:400;padding:0;border-bottom:1px solid var(--line);background:var(--paper)}
.tabella th button{all:unset;cursor:pointer;display:block;padding:9px 10px}
.tabella th[aria-sort="descending"] button::after{content:" ↓"} .tabella th[aria-sort="ascending"] button::after{content:" ↑"}
.tabella td{padding:9px 10px;border-bottom:1px solid var(--line-soft);vertical-align:top}
.tabella td a{color:var(--ink);border-bottom:1px solid var(--filo)}
.tabella td.n{font-family:var(--mono);text-align:right}
body.vista-tabella .s,body.vista-tabella .rules{display:none}
body.vista-tabella .tabella{display:block}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .filtri input,:root:not([data-theme="light"]) .tabella{background:var(--paper-2)}}
'''
s = s.replace('</style>', css + '</style>', 1)

filtri = '''
<div class="filtri" role="region" aria-label="Filtra il catalogo">
  <div class="righe" role="group" aria-label="Stato">
    <button type="button" data-filtro="tutti" aria-pressed="true">Tutti<span class="c"></span></button>
    <button type="button" data-filtro="qui" aria-pressed="false">Fatti qui<span class="c"></span></button>
    <button type="button" data-filtro="cantiere" aria-pressed="false">In costruzione<span class="c"></span></button>
    <button type="button" data-filtro="italia" aria-pressed="false">Esistono in Italia<span class="c"></span></button>
    <button type="button" data-filtro="estero" aria-pressed="false">Esistono all'estero<span class="c"></span></button>
    <button type="button" data-filtro="dafare" aria-pressed="false">Da fare<span class="c"></span></button>
    <button type="button" class="vista" id="vista" aria-pressed="false">Vista tabella</button>
  </div>
  <div class="righe"><input type="search" id="cerca" placeholder="Cerca: multe, bilancio, petizioni, Estonia…" aria-label="Cerca nel catalogo"><span class="conta" id="conta" aria-live="polite"></span></div>
</div>
<p class="vuoto-filtro" id="vuoto">Nessuno strumento corrisponde: prova un'altra parola o togli il filtro.</p>
<div class="tabella" id="tabella"><table><thead><tr>
  <th scope="col" data-k="titolo"><button type="button">Strumento</button></th>
  <th scope="col" data-k="area"><button type="button">Per chi</button></th>
  <th scope="col" data-k="stato"><button type="button">Stato</button></th>
  <th scope="col" data-k="dove"><button type="button">Dove esiste</button></th>
  <th scope="col" data-k="priorita" class="n"><button type="button">Priorità</button></th>
</tr></thead><tbody></tbody></table></div>
'''
s = s.replace('<!-- ============ 1. GOVERNO ============ -->', filtri + '\n<!-- ============ 1. GOVERNO ============ -->', 1)

js = r'''
<script>
(() => {
  const carte = [...document.querySelectorAll('.card[data-stato]')];
  const AREE = { gov: 'Per chi governa', see: 'Per chi controlla', org: 'Per chi si organizza', svc: 'Per chi ha diritto' };
  const NOMI = { fatto: 'Fatto qui', parziale: 'Fatto qui, in parte', costruzione: 'In costruzione', arrivo: 'In arrivo', italia: 'Esiste in Italia', estero: 'Esiste all\'estero', dafare: 'Da fare' };
  const ORDINE = { fatto: 0, parziale: 1, costruzione: 2, arrivo: 3, italia: 4, estero: 5, dafare: 6 };
  const GRUPPO = (st) => (st === 'fatto' || st === 'parziale') ? 'qui' : (st === 'costruzione' || st === 'arrivo') ? 'cantiere' : st;
  const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const righe = carte.map((c) => {
    const link = c.querySelector('a.nostro') || c.querySelector('h3 a');
    const dove = [...c.querySelectorAll('.world a:not(.src)')].slice(0, 3).map((a) => a.textContent.trim()).join(', ');
    return { c, nostro: c.querySelector('.nostro b')?.textContent || '', titolo: c.dataset.titolo, stato: c.dataset.stato, gruppo: GRUPPO(c.dataset.stato), area: AREE[c.closest('section')?.dataset.s] || '', priorita: Number(c.dataset.priorita || 0), dove, href: link?.href || '', testo: norm(c.textContent) };
  });
  let filtro = 'tutti', q = '', ordine = { k: 'stato', v: 1 };
  const passa = (r) => (filtro === 'tutti' || r.gruppo === filtro) && (!q || q.split(' ').every((p) => r.testo.includes(p)));
  function conta() {
    document.querySelectorAll('[data-filtro]').forEach((b) => {
      const f = b.dataset.filtro;
      b.querySelector('.c').textContent = righe.filter((r) => (f === 'tutti' || r.gruppo === f) && (!q || q.split(' ').every((p) => r.testo.includes(p)))).length;
    });
  }
  function aggiorna() {
    let n = 0;
    for (const r of righe) { const ok = passa(r); r.c.hidden = !ok; if (ok) n++; }
    document.querySelectorAll('section.s').forEach((s) => {
      s.querySelectorAll('.grid').forEach((g) => { g.hidden = ![...g.querySelectorAll('.card')].some((c) => !c.hidden); const h = g.previousElementSibling; if (h?.classList.contains('sub-h')) h.hidden = g.hidden; });
      s.hidden = ![...s.querySelectorAll('.card')].some((c) => !c.hidden);
    });
    document.getElementById('conta').textContent = `${n} strumenti su ${righe.length}`;
    document.getElementById('vuoto').style.display = n ? 'none' : 'block';
    conta();
    tabella();
  }
  function tabella() {
    const lista = righe.filter(passa).sort((a, b) => {
      const k = ordine.k;
      const va = k === 'stato' ? ORDINE[a.stato] : a[k], vb = k === 'stato' ? ORDINE[b.stato] : b[k];
      return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * ordine.v || b.priorita - a.priorita || a.titolo.localeCompare(b.titolo);
    });
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    document.querySelector('#tabella tbody').innerHTML = lista.map((r) => `<tr><td>${r.href ? `<a href="${esc(r.href)}" target="_top">${esc(r.titolo)}</a>` : esc(r.titolo)}${r.nostro && r.nostro !== 'Agenti civici' ? `<br><small>${esc(r.nostro)}</small>` : ''}</td><td>${esc(r.area)}</td><td>${esc(NOMI[r.stato])}</td><td>${esc(r.dove)}</td><td class="n">${r.priorita || '—'}</td></tr>`).join('');
    document.querySelectorAll('#tabella th').forEach((th) => th.toggleAttribute('aria-sort', th.dataset.k === ordine.k) || th.setAttribute('aria-sort', ordine.v < 0 ? 'descending' : 'ascending'));
    document.querySelectorAll('#tabella th').forEach((th) => { if (th.dataset.k === ordine.k) th.setAttribute('aria-sort', ordine.v < 0 ? 'descending' : 'ascending'); else th.removeAttribute('aria-sort'); });
  }
  document.querySelectorAll('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
    filtro = b.dataset.filtro;
    document.querySelectorAll('[data-filtro]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    aggiorna();
  }));
  document.getElementById('cerca').addEventListener('input', (e) => { q = norm(e.target.value.trim()); aggiorna(); });
  document.getElementById('vista').addEventListener('click', (e) => {
    const on = document.body.classList.toggle('vista-tabella');
    e.currentTarget.setAttribute('aria-pressed', String(on));
    e.currentTarget.textContent = on ? 'Vista schede' : 'Vista tabella';
  });
  document.querySelectorAll('#tabella th button').forEach((b) => b.addEventListener('click', () => {
    const k = b.parentElement.dataset.k;
    ordine = ordine.k === k ? { k, v: -ordine.v } : { k, v: k === 'priorita' ? -1 : 1 };
    tabella();
  }));
  aggiorna();
})();
</script>
'''
s = s.replace('</footer>\n</div>', '</footer>\n</div>\n' + js, 1) if '</footer>\n</div>' in s else s + js
# testi aggiornati
s = s.replace("Gli strumenti già costruiti (Assistente civico, Mi spetta, Faccio ricorso?, Chiedo gli atti, Mi rimborsano?) sono sul", "Gli strumenti già costruiti, segnati in rosso e con il link, sono anche sul")
s = s.replace('Agenti Civici · catalogo aggiornato al 14 settembre 2026', 'Agenti Civici · catalogo aggiornato al 25 ottobre 2026')
s = re.sub(r'54 strumenti · 4 sezioni', f'{n} strumenti · fatti qui, in costruzione, esistenti altrove e da fare', s)
open(out, 'w').write(s)
