"""La pagina d'ingresso, semplice: il Polpo con le sue otto braccia che girano una alla volta
(ogni braccio un mestiere e i suoi strumenti), sotto tutte le braccia in una griglia e una riga
di collegamenti. Sostituisce tutto quello che sta tra l'inizio di <div class="max"> (dopo la banda)
e <section class="principi">, e scrive le regole CSS tra /*casa*/ e /*/casa*/.
Uso: python3 -I scripts/casa-polpo.py
"""
import json
import math
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (lato, mestiere, spiegazione, icona, [(nome, link)])
BRACCIA = [
    ('burocrazia', 'Fa i conti dei tuoi diritti', 'Quali bonus e aiuti ti spettano, quanto ti devono per un volo, un treno o una bolletta.',
     'M17 7.5 A6.2 6.2 0 1 0 17 16.5 M5 10.5 H13 M5 13.5 H13', [('Mi spetta', 'mi-spetta/'), ('Mi rimborsano?', 'mi-rimborsano/')]),
    ('burocrazia', 'Scrive le lettere', 'Il ricorso contro la multa, la richiesta di documenti, il reclamo all\'ufficio che non risponde.',
     'M5 19 L9 18 L19 8 L16 5 L6 15 Z M14 7 L17 10', [('Faccio ricorso?', 'faccio-ricorso/'), ('Chiedo gli atti', 'chiedo-gli-atti/'), ('Reclami alla PA', 'reclami-pa/')]),
    ('burocrazia', 'Trova la strada', 'Cosa fare per una pratica, a quale ufficio andare, come avere la visita nei tempi.',
     'M12 3 V21 M12 5 H17.5 L20 7.5 L17.5 10 H12 M12 12 H6.5 L4 14.5 L6.5 17 H12', [('Navigatore dei servizi', 'navigatore/'), ('La visita nei tempi', 'liste-attesa/')]),
    ('burocrazia', 'Ti difende', 'Garanzia e diritto di recesso; il messaggio sospetto prima di cliccare.',
     'M12 3 L19 6 V11 C19 16 15.5 19 12 21 C8.5 19 5 16 5 11 V6 Z M9 12 L11 14 L15 10', [('Si è rotto o ci ho ripensato', 'garanzia/'), ('È una truffa?', 'truffe/')]),
    ('vita', 'Legge i conti del Comune', 'Come spende il tuo Comune, voce per voce, confrontato con gli altri.',
     'M4 20 H20 M7 20 V13 M11 20 V8 M15 20 V11 M19 20 V5', [('Il bilancio del mio Comune', 'bilancio-comune/')]),
    ('vita', 'Controlla gli appalti', 'I segnali d\'allarme negli appalti pubblici, con i dati ufficiali.',
     'M10.5 4 A6.5 6.5 0 1 0 10.5 17 A6.5 6.5 0 1 0 10.5 4 Z M15.5 15.5 L20 20', [('Red flag sugli appalti', 'appalti/')]),
    ('vita', 'Ti porta a firmare', 'Referendum e leggi di iniziativa popolare aperti, con il link per firmare.',
     'M5 4 H15 L19 8 V20 H5 Z M8 13 L11 16 L16 10', [('Raccolte firme in corso', 'raccolte-firme/')]),
    ('vita', 'Si prende cura dei luoghi', 'La buca in strada, gli alberi da piantare, la salute dei fiumi.',
     'M12 20 V11 M12 13 C12 8 8.5 6 5 6 C5 10 8 13 12 13 M12 11 C12 7 15 5 19 5 C19 9 16 11 12 11', [('Segnalazioni urbane', 'segnalazioni/'), ('Alberi per il futuro', 'alberi/'), ('Fiumi Puliti', 'https://www.fiumipuliti.it/')]),
]
LATI = {'burocrazia': 'Davanti alla burocrazia', 'vita': 'Dentro la vita pubblica'}

# «Chiedi al Polpo»: le parole che portano a uno strumento (minuscolo, senza accenti).
# Funziona tutto nel browser: niente viene mandato da nessuna parte.
PAROLE = [
    ('faccio-ricorso/', ['multa', 'multe', 'verbale', 'autovelox', 'contravvenzion', 'ztl', 'semaforo', 'divieto di sosta', 'strisce blu', 'ricorso', 'tutor', 'eccesso di velocita']),
    ('mi-spetta/', ['bonus', 'assegno', 'isee', 'aiuto', 'aiuti', 'sussidi', 'pensione', 'reddito', 'contribut', 'agevolazion', 'esenzion', 'ticket', 'figli', 'bambino', 'maternita', 'disoccupa', 'invalidita', 'mi spetta', 'diritto a']),
    ('mi-rimborsano/', ['volo', 'aereo', 'ritardo', 'cancellat', 'bagaglio', 'valigia', 'treno', 'bolletta', 'conguaglio', 'telefon', 'internet', 'fibra', 'banca', 'addebito', 'rimborso', 'rimborsare', 'compensazione']),
    ('chiedo-gli-atti/', ['documenti', 'documento', 'atti ', 'accesso agli atti', 'foia', 'quanto ha speso', 'delibera', 'determina', 'trasparenza', 'copia di', 'consulenze']),
    ('reclami-pa/', ['non risponde', 'non mi rispond', 'reclamo', 'reclamare', 'sportello', 'difensore civico', 'silenzio', 'ufficio pubblico']),
    ('navigatore/', ['residenza', "carta d'identita", 'carta di identita', 'passaporto', 'patente', 'spid', 'certificato', 'anagrafe', 'come si fa', 'pratica', 'permesso di soggiorno', 'cittadinanza', 'cambio di', 'iscriver', 'a quale ufficio']),
    ('liste-attesa/', ['visita', 'esame', 'esami', 'prenotazion', 'prenotare', 'cup', 'specialist', "lista d'attesa", "liste d'attesa", 'impegnativa', 'ricetta', 'risonanza', 'ecografia', 'tac']),
    ('garanzia/', ['garanzia', 'rotto', 'rotta', 'guasto', 'difettos', 'non funziona', 'reso', 'recesso', 'restituire', 'ripensato', 'comprato', 'acquisto']),
    ('truffe/', ['truffa', 'truffe', 'sms', 'messaggio strano', 'link', 'phishing', 'mail sospetta', 'pacco', 'ciao mamma', 'falso', 'clonat', 'bonifico', 'investimento', 'crypto', 'sospett', 'strano', 'strana', 'whatsapp', 'codice otp', 'mi chiedono il codice', 'vinto']),
    ('bilancio-comune/', ['bilancio', 'spende il comune', 'come spende', 'spesa del comune', 'conti del comune', 'debito del comune', 'tasse comunali']),
    ('appalti/', ['appalto', 'appalti', 'gara', 'affidamento', 'lavori pubblici', 'ditta']),
    ('raccolte-firme/', ['firma', 'firmare', 'referendum', 'legge popolare', 'legge di iniziativa', 'petizione', 'raccolta firme']),
    ('segnalazioni/', ['buca', 'buche', 'strada', 'marciapiede', 'lampion', 'illuminazione', 'rifiuti', 'spazzatura', 'degrado', 'graffiti', 'segnalare', 'segnalazione', 'semaforo rotto']),
    ('alberi/', ['albero', 'alberi', 'piantare', 'bosco']),
    ('https://www.fiumipuliti.it/', ['fiume', 'fiumi', 'torrente', 'acqua inquinata']),
]
ESEMPI = ['Mi è arrivata una multa dopo quattro mesi', 'Il volo è arrivato con cinque ore di ritardo', 'Ho 70 anni e la pensione minima: che aiuti ci sono?', 'Davanti a casa c\'è una buca da mesi', 'Mi è arrivato un SMS strano dalla banca']


def link(nome, href, classe=''):
    c = f' class="{classe}"' if classe else ''
    if href.startswith('http'):
        return f'<a{c} href="{href}" target="_blank" rel="noopener">{nome}</a>'
    return f'<a{c} href="{href}" data-strumento="{href.strip("/")}">{nome}</a>'


def braccio_svg(k):
    """Un braccio in posizione «a destra»; il gruppo lo ruota di k*45 gradi."""
    ondulato = 'M58 0 C92 -34 118 30 150 2 S 196 -22 214 0'
    ventose = 'M80 9 C104 -8 124 30 152 12 S 190 -6 206 8'
    _, mestiere, _, icona, _ = BRACCIA[k]
    return (f'<g class="b" data-k="{k}" style="--a:{k * 45}deg" transform="rotate({k * 45})">'
            f'<path class="b-arto" d="{ondulato}"/><path class="b-ventose" d="{ventose}"/>'
            f'<g class="b-stazione" transform="translate(252 0)"><circle r="36"/>'
            f'<g class="b-icona"><g transform="scale(1.75)"><rect x="-12" y="-12" width="24" height="24" fill="none" stroke="none"/><path transform="translate(-12 -12)" d="{icona}"/></g></g></g>'
            f'<title>{mestiere}</title></g>')


TESTA = ('<g class="testa"><path class="t-corpo" d="M-82 34 C-104 -96 104 -96 82 34 C64 64 -64 64 -82 34 Z"/>'
         '<circle class="t-lente" cx="-26" cy="-6" r="22"/><circle class="t-lente" cx="26" cy="-6" r="22"/><path class="t-lente" d="M-4 -6 H4"/>'
         '<circle class="t-occhio" cx="-26" cy="-4" r="7"/><circle class="t-occhio" cx="26" cy="-4" r="7"/>'
         '<path class="t-bocca" d="M-12 30 Q0 38 12 30"/></g>')


def polpo_mini(attivo=None, fisso=False, classe='logo-polpo', etichetta=''):
    """Il Polpo in piccolo, lo stesso disegno della giostra: il braccio `attivo` è rosso e indica
    a destra (verso il titolo). fisso=True: colori scritti nel disegno, per l'icona del browser."""
    if fisso:
        c = dict(arto='#8A93A3', st='#F5F1E8', st_bordo='#8A93A3', ic='#17202E', rosso='#F06A55', corpo='#F5F1E8', ink='#17202E')
    pezzi = []
    for j in range(8):
        ang = ((j - attivo) if attivo is not None else j) * 45
        on = j == attivo
        if fisso:
            ac = c['rosso'] if on else c['arto']
            sf, sb = (c['rosso'], c['rosso']) if on else (c['st'], c['st_bordo'])
            arto = f'<path d="M70 0 C112 -42 140 40 182 0" fill="none" stroke="{ac}" stroke-width="34" stroke-linecap="round"/>'
            st = f'<circle r="58" fill="{sf}" stroke="{sb}" stroke-width="8"/>'
            ic = f'<path transform="rotate({-ang}) scale(2.6) translate(-12 -12)" d="{BRACCIA[j][3]}" fill="none" stroke="{c["ic"]}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>'
        else:
            cl = ' pm-attivo' if on else ''
            arto = '<path class="pm-arto" d="M70 0 C112 -42 140 40 182 0"/>'
            st = '<circle class="pm-st" r="58"/>'
            ic = f'<path class="pm-ic" transform="rotate({-ang}) scale(2.6) translate(-12 -12)" d="{BRACCIA[j][3]}"/>'
            arto = arto.replace('class="pm-arto"', f'class="pm-arto{cl}"'); st = st.replace('class="pm-st"', f'class="pm-st{cl}"'); ic = ic.replace('class="pm-ic"', f'class="pm-ic{cl}"')
        pezzi.append(f'<g transform="rotate({ang})">{arto}<g transform="translate(226 0)">{st}{ic}</g></g>')
    if fisso:
        testa = (f'<g transform="scale(1.25)"><path d="M-82 34 C-104 -96 104 -96 82 34 C64 64 -64 64 -82 34 Z" fill="{c["corpo"]}" stroke="{c["ink"]}" stroke-width="6"/>'
                 f'<circle cx="-26" cy="-6" r="22" fill="none" stroke="{c["ink"]}" stroke-width="6"/><circle cx="26" cy="-6" r="22" fill="none" stroke="{c["ink"]}" stroke-width="6"/>'
                 f'<path d="M-4 -6 H4" stroke="{c["ink"]}" stroke-width="6"/><circle cx="-26" cy="-4" r="8" fill="{c["ink"]}"/><circle cx="26" cy="-4" r="8" fill="{c["ink"]}"/></g>')
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-300 -300 600 600"><rect x="-300" y="-300" width="600" height="600" rx="130" fill="#17202E"/>'
                f'<g transform="scale(0.9)">{"".join(pezzi)}{testa}</g></svg>\n')
    testa = ('<g class="pm-testa" transform="scale(1.25)"><path class="pm-corpo" d="M-82 34 C-104 -96 104 -96 82 34 C64 64 -64 64 -82 34 Z"/>'
             '<circle class="pm-lente" cx="-26" cy="-6" r="22"/><circle class="pm-lente" cx="26" cy="-6" r="22"/><path class="pm-lente" d="M-4 -6 H4"/>'
             '<circle class="pm-occhio" cx="-26" cy="-4" r="8"/><circle class="pm-occhio" cx="26" cy="-4" r="8"/></g>')
    aria = f'role="img" aria-label="{etichetta}"' if etichetta else 'aria-hidden="true"'
    return f'<svg class="{classe}" viewBox="-300 -300 600 600" {aria}>{"".join(pezzi)}{testa}</svg>'


def pannello(k):
    lato, mestiere, spiega, _, strumenti = BRACCIA[k]
    bottoni = ''.join(link(n, h, 'btn btn-primario' if i == 0 else 'btn') for i, (n, h) in enumerate(strumenti))
    return (f'<span class="g-n">{k + 1:02d} / 08 · {LATI[lato]}</span><h2 class="g-titolo">{mestiere}</h2>'
            f'<p class="g-spiega">{spiega}</p><p class="g-strumenti">{bottoni}</p>')


def griglia():
    out = []
    for k, (lato, mestiere, spiega, icona, strumenti) in enumerate(BRACCIA):
        out.append(f'<li class="tessera" data-lato="{lato}"><button type="button" class="tessera-icona" data-vai="{k}" aria-label="Mostra il braccio {k + 1}: {mestiere}">'
                   f'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="{icona}"/></svg></button>'
                   f'<span class="tessera-n">{k + 1:02d}</span><h3>{mestiere}</h3>'
                   f'<p>{"".join(link(n, h) for n, h in strumenti)}</p></li>')
    return ''.join(out)


def chiedi():
    esempi = ''.join(f'<button type="button" class="chiedi-esempio">{e}</button>' for e in ESEMPI)
    return f'''<section class="chiedi" aria-labelledby="t-chiedi">
      <div class="chiedi-testa">{polpo_mini(None, classe='chiedi-polpo')}<div><h2 id="t-chiedi">Chiedi al Polpo</h2><p>Scrivi con parole tue cosa ti serve: il Polpo ti indica il braccio e lo strumento giusto. Quello che scrivi resta sul tuo dispositivo.</p></div></div>
      <form class="chiedi-form" novalidate>
        <label for="chiedi-testo" class="sr-only">Cosa ti serve?</label>
        <textarea id="chiedi-testo" rows="2" placeholder="Per esempio: mi è arrivata una multa dopo quattro mesi"></textarea>
        <button type="submit" class="btn btn-primario">Chiedi</button>
      </form>
      <div class="chiedi-esempi"><span>Prova con</span>{esempi}</div>
      <div class="chiedi-risposta" aria-live="polite" hidden></div>
    </section>
    <script>
    /* Chiedi al Polpo: sceglie lo strumento dalle parole, nel browser. Gira la giostra sul braccio giusto.
       Il testo passa alla chat solo se lo chiedi, tramite la memoria della scheda (mai nell'indirizzo). */
    (() => {{
      const PAROLE = {json.dumps(PAROLE, ensure_ascii=False)};
      const BRACCIA = {json.dumps([{'mestiere': b[1], 'strumenti': b[4]} for b in BRACCIA], ensure_ascii=False)};
      const f = document.querySelector('.chiedi-form');
      const t = document.getElementById('chiedi-testo');
      const r = document.querySelector('.chiedi-risposta');
      const pulisci = (x) => ' ' + x.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[’`]/g, "'").replace(/\\s+/g, ' ') + ' ';
      const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({{'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}}[c]));
      const braccioDi = (h) => BRACCIA.findIndex((b) => b.strumenti.some(([, x]) => x === h));
      const nomeDi = (h) => BRACCIA.flatMap((b) => b.strumenti).find(([, x]) => x === h)[0];
      const a = (h, cl) => h.startsWith('http') ? `<a class="${{cl}}" href="${{h}}" target="_blank" rel="noopener">${{esc(nomeDi(h))}}</a>` : `<a class="${{cl}}" href="${{h}}" data-strumento="${{h.replace(/\\//g, '')}}">${{esc(nomeDi(h))}} →</a>`;
      function rispondi(testo) {{
        const x = pulisci(testo);
        if (!x.trim()) {{ t.focus(); return; }}
        const punti = PAROLE.map(([h, ps]) => [h, ps.reduce((n, p) => n + (x.includes(p) ? 1 : 0), 0)]).filter(([, n]) => n > 0).sort((p, q) => q[1] - p[1]);
        r.hidden = false;
        const chat = '<a class="chiedi-chat" href="assistente/" data-strumento="assistente">Raccontalo al Polpo in chat</a>';
        if (!punti.length) {{
          r.innerHTML = `<p class="chiedi-titolo">Con queste parole non trovo il braccio giusto.</p><p>Prova a dirlo in un altro modo, guarda le otto braccia qui sotto oppure cerca la pratica nel ${{a('navigatore/', 'chiedi-link')}}</p><p>${{chat}}</p>`;
          return;
        }}
        const primo = punti[0][0], k = braccioDi(primo);
        const altri = punti.slice(1, 3).map(([h]) => a(h, 'btn')).join('');
        r.innerHTML = `<p class="chiedi-n">Braccio ${{String(k + 1).padStart(2, '0')}} · ${{esc(BRACCIA[k].mestiere)}}</p>`
          + `<p class="chiedi-titolo">Ci metto il braccio giusto: ${{a(primo, 'btn btn-primario')}}</p>`
          + (altri ? `<p class="chiedi-altri"><span>Potrebbe servirti anche</span>${{altri}}</p>` : '')
          + `<p>${{chat}}</p>`;
        if (window.polpoMostra) window.polpoMostra(k);
      }}
      f.addEventListener('submit', (e) => {{ e.preventDefault(); rispondi(t.value); }});
      t.addEventListener('keydown', (e) => {{ if (e.key === 'Enter' && !e.shiftKey) {{ e.preventDefault(); rispondi(t.value); }} }});
      document.querySelectorAll('.chiedi-esempio').forEach((b) => b.addEventListener('click', () => {{ t.value = b.textContent; rispondi(t.value); }}));
      r.addEventListener('click', (e) => {{
        if (!e.target.closest('.chiedi-chat')) return;
        try {{ sessionStorage.setItem('polpo-domanda', t.value.slice(0, 2000)); }} catch {{ /* niente */ }}
      }});
    }})();
    </script>'''


def blocco():
    braccia = ''.join(braccio_svg(k) for k in range(8))
    dati = json.dumps([{'lato': LATI[b[0]], 'mestiere': b[1], 'spiega': b[2], 'strumenti': b[4]} for b in BRACCIA], ensure_ascii=False)
    punti = ''.join(f'<button type="button" class="g-punto" data-vai="{k}" aria-label="{k + 1}: {b[1]}"></button>' for k, b in enumerate(BRACCIA))
    return f'''<!--casa--><header class="casa">
    <div class="casa-testa">
      <div class="occhiello">Al servizio del cittadino</div>
      <h1>Polpo civico</h1>
      <p class="casa-motto">La burocrazia ha mille tentacoli. <span>Il Polpo ne ha otto, tutti dalla tua parte.</span></p>
    </div>
    {chiedi()}
    <section class="giostra" aria-roledescription="carosello" aria-label="Le otto braccia del Polpo" style="--rot:0deg">
      <div class="giostra-scena">
        <svg class="polpo" viewBox="-300 -300 600 600" role="img" aria-label="Il Polpo con gli occhialini e le sue otto braccia; il braccio in evidenza indica il mestiere descritto accanto">
          <g class="braccia">{braccia}</g>{TESTA}
        </svg>
      </div>
      <div class="giostra-pannello">
        <div class="g-testo" aria-live="polite">{pannello(0)}</div>
        <div class="g-comandi">
          <button type="button" class="g-freccia" data-passo="-1" aria-label="Braccio precedente">←</button>
          <span class="g-punti">{punti}</span>
          <button type="button" class="g-freccia" data-passo="1" aria-label="Braccio successivo">→</button>
          <button type="button" class="g-pausa" aria-pressed="false">Ferma</button>
        </div>
      </div>
    </section>
  </header>

  <section class="tutte" id="cosa-puoi-fare" aria-labelledby="t-tutte">
    <h2 id="t-tutte">Tutte le otto braccia</h2>
    <ol class="tessere">{griglia()}</ol>
    <p class="arrivo"><span>In arrivo</span> Le carte del potere: chi siede sulle poltrone nominate dalla politica, chi l'ha nominato, quando scade.</p>
  </section>

  <nav class="altro" aria-label="Altro">
    <a href="https://github.com/casaleggiodavide-stack/agenti-civici/releases/latest/download/agenti-civici.mcpb">Il Polpo dentro il tuo assistente AI</a>
    <a href="mondo/">L'Atlante degli strumenti civici nel mondo</a>
    <a href="catalogo/">Il catalogo completo</a>
  </nav>
<script>
/* La giostra: un braccio alla volta. Il gruppo delle braccia gira perché il braccio scelto
   indichi il testo. Gira da sola; dopo un clic si riposa qualche secondo e riparte; si ferma
   del tutto solo con «Ferma», e non cambia mentre la tastiera è al suo interno o la pagina non si vede.
   Con #braccio-N nell'indirizzo parte da quel braccio (ci arrivano gli strumenti). */
(() => {{
  const DATI = {dati};
  const g = document.querySelector('.giostra');
  if (!g) return;
  const testo = g.querySelector('.g-testo');
  const pausa = g.querySelector('.g-pausa');
  const meno = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let k = 0, giri = 0, fermo = false, tastiera = false, riposo = 0;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({{'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}}[c]));
  const a = (n, h, cl) => h.startsWith('http')
    ? `<a class="${{cl}}" href="${{h}}" target="_blank" rel="noopener">${{esc(n)}}</a>`
    : `<a class="${{cl}}" href="${{h}}" data-strumento="${{h.replace(/\\//g, '')}}">${{esc(n)}}</a>`;
  function mostra(nuovo, passo) {{
    const d = ((nuovo % 8) + 8) % 8;
    let delta = passo ?? (((d - k) % 8) + 8) % 8;
    if (passo === undefined && delta > 4) delta -= 8;
    giri += delta; k = d;
    g.style.setProperty('--rot', (-giri * 45) + 'deg');
    g.querySelectorAll('.b').forEach((b) => b.classList.toggle('attivo', +b.dataset.k === k));
    g.querySelectorAll('.g-punto').forEach((p, i) => p.setAttribute('aria-current', i === k ? 'true' : 'false'));
    const x = DATI[k];
    testo.innerHTML = `<span class="g-n">${{String(k + 1).padStart(2, '0')}} / 08 · ${{x.lato}}</span><h2 class="g-titolo">${{esc(x.mestiere)}}</h2>`
      + `<p class="g-spiega">${{esc(x.spiega)}}</p><p class="g-strumenti">${{x.strumenti.map(([n, h], i) => a(n, h, i ? 'btn' : 'btn btn-primario')).join('')}}</p>`;
  }}
  setInterval(() => {{ if (!fermo && !tastiera && !document.hidden && Date.now() > riposo) mostra(k + 1, 1); }}, meno ? 6000 : 4200);
  const tocca = () => {{ riposo = Date.now() + 12000; }};
  function ferma(si) {{ fermo = si; pausa.setAttribute('aria-pressed', si ? 'true' : 'false'); pausa.textContent = si ? 'Riprendi' : 'Ferma'; if (!si) riposo = 0; }}
  g.querySelectorAll('[data-passo]').forEach((b) => b.addEventListener('click', () => {{ tocca(); mostra(k + +b.dataset.passo, +b.dataset.passo); }}));
  g.querySelectorAll('.g-punto').forEach((b) => b.addEventListener('click', () => {{ tocca(); mostra(+b.dataset.vai); }}));
  g.querySelectorAll('.b').forEach((b) => b.addEventListener('click', () => {{ tocca(); mostra(+b.dataset.k); }}));
  document.querySelectorAll('.tessera-icona').forEach((b) => b.addEventListener('click', () => {{ tocca(); mostra(+b.dataset.vai); g.scrollIntoView({{ behavior: meno ? 'auto' : 'smooth', block: 'center' }}); }}));
  pausa.addEventListener('click', () => ferma(!fermo));
  g.addEventListener('focusin', (e) => {{ tastiera = e.target.matches(':focus-visible'); }});
  g.addEventListener('focusout', () => {{ tastiera = false; }});
  function daIndirizzo() {{
    const m = location.hash.match(/^#braccio-([1-8])$/);
    if (!m) return false;
    tocca(); mostra(+m[1] - 1);
    g.scrollIntoView({{ block: 'center' }});
    return true;
  }}
  window.polpoMostra = (n) => {{ tocca(); mostra(n); }};
  addEventListener('hashchange', daIndirizzo);
  if (!daIndirizzo()) mostra(0, 0);
}})();
</script><!--/casa-->
'''


CSS = '''/*casa*/
  /* La pagina d'ingresso semplice: il Polpo e le otto braccia (scripts/casa-polpo.py) */
  .casa { padding: clamp(18px, 3vw, 32px) 0 8px; }
  .casa-testa { display: grid; gap: 8px; max-width: 900px; }
  .casa-testa h1 { font-size: clamp(46px, 8vw, 104px); line-height: .88; letter-spacing: -0.06em; margin: 4px 0 6px; }
  .casa-motto { font-family: var(--titoli); font-weight: 600; font-size: clamp(20px, 2.4vw, 30px); letter-spacing: -0.03em; line-height: 1.15; margin: 0; max-width: 30ch; }
  .casa-motto span { color: var(--accento); }
  .chiedi { position: relative; margin-top: clamp(16px, 2.6vw, 26px); background: var(--carta); border: 1px solid color-mix(in srgb, var(--accento) 45%, var(--riga)); border-radius: 6px; padding: clamp(16px, 3vw, 26px); display: grid; gap: 12px; max-width: 980px; background-image: radial-gradient(110% 90% at 100% 0%, color-mix(in srgb, var(--accento) 12%, transparent), transparent 55%); }
  .chiedi-testa { display: flex; gap: 14px; align-items: center; }
  .chiedi-polpo { width: 86px; height: 86px; flex: none; overflow: visible; }
  .chiedi h2 { font-size: clamp(24px, 2.8vw, 34px); letter-spacing: -0.04em; margin: 0; }
  .chiedi-testa p { margin: 4px 0 0; color: var(--inchiostro-2); max-width: 62ch; }
  .chiedi-form { display: flex; gap: 10px; align-items: stretch; }
  .chiedi-form textarea { flex: 1; min-height: 58px; max-width: none; resize: vertical; background: var(--fondo); border: 1px solid var(--riga); border-radius: 6px; padding: 12px 14px; font: inherit; font-size: var(--s1); color: var(--inchiostro); }
  .chiedi-form textarea:focus { border-color: var(--accento); outline: none; }
  .chiedi-form .btn { padding: 0 26px; justify-content: center; }
  .chiedi-esempi { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .chiedi-esempi span { font-family: var(--cifre); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--inchiostro-3); margin-right: 4px; }
  .chiedi-esempio { font: inherit; font-size: 13.5px; color: var(--inchiostro-2); background: none; border: 1px solid var(--riga); border-radius: 999px; padding: 5px 12px; cursor: pointer; }
  .chiedi-esempio:hover, .chiedi-esempio:focus-visible { border-color: var(--accento); color: var(--inchiostro); outline: none; }
  .chiedi-risposta { border-top: 1px solid var(--riga); padding-top: 12px; display: grid; gap: 10px; }
  .chiedi-risposta p { margin: 0; color: var(--inchiostro-2); }
  .chiedi-n { font-family: var(--cifre); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--accento) !important; }
  .chiedi-titolo { font-family: var(--titoli); font-size: clamp(19px, 2vw, 24px); letter-spacing: -0.03em; color: var(--inchiostro) !important; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .chiedi-altri { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .chiedi-altri span { font-size: 14px; color: var(--inchiostro-3); }
  .chiedi-chat { font-family: var(--cifre); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; }
  @media (max-width: 620px) { .chiedi-form { flex-direction: column; } .chiedi-form .btn { padding: 12px 22px; } .chiedi-polpo { width: 64px; height: 64px; } }
  .giostra { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(8px, 3vw, 40px); align-items: center; margin-top: clamp(8px, 2vw, 18px); }
  .giostra-scena { aspect-ratio: 1; max-height: 620px; justify-self: center; width: 100%; }
  .polpo { width: 100%; height: 100%; overflow: visible; }
  .polpo .braccia { transform-box: view-box; transform-origin: 0 0; transform: rotate(var(--rot)); transition: transform .9s cubic-bezier(.6, .05, .25, 1); }
  .b { cursor: pointer; }
  .b-arto { fill: none; stroke: var(--inchiostro-3); stroke-width: 18; stroke-linecap: round; transition: stroke .4s; }
  .b-ventose { fill: none; stroke: var(--fondo, #0B0B0A); stroke-width: 5; stroke-linecap: round; stroke-dasharray: 0 13; opacity: .55; }
  .b-stazione circle { fill: var(--carta); stroke: var(--inchiostro-3); stroke-width: 3; transition: fill .4s, stroke .4s; }
  .b-icona { transform-box: fill-box; transform-origin: center; transform: rotate(calc(-1 * (var(--a) + var(--rot)))); transition: transform .9s cubic-bezier(.6, .05, .25, 1); }
  .b-icona path { fill: none; stroke: var(--inchiostro); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
  .b-stazione .b-icona { transform-origin: center; }
  .b.attivo .b-arto { stroke: var(--accento); }
  .b.attivo .b-stazione circle { fill: var(--accento); stroke: var(--accento); }
  .b.attivo .b-icona path { stroke: #0B0B0A; stroke-width: 2.2; }
  .b:hover .b-stazione circle { stroke: var(--accento); }
  .b-stazione { transform-box: fill-box; }
  .testa .t-corpo { fill: var(--carta); stroke: var(--inchiostro); stroke-width: 5; }
  .testa .t-lente { fill: none; stroke: var(--inchiostro); stroke-width: 4.5; }
  .testa .t-occhio { fill: var(--inchiostro); }
  .testa .t-bocca { fill: none; stroke: var(--inchiostro); stroke-width: 4; stroke-linecap: round; }
  .giostra-pannello { display: grid; gap: 18px; align-content: center; min-height: 300px; }
  .g-testo { display: grid; gap: 10px; }
  .g-n { font-family: var(--cifre); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--inchiostro-3); }
  .g-titolo { font-size: clamp(30px, 3.6vw, 48px); line-height: 1; letter-spacing: -0.045em; margin: 0; }
  .g-spiega { font-size: var(--s1); color: var(--inchiostro-2); margin: 0; max-width: 42ch; }
  .g-strumenti { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 0; }
  .g-comandi { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .g-freccia, .g-pausa { font: inherit; font-family: var(--cifre); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--inchiostro); background: none; border: 1px solid var(--riga); border-radius: 999px; padding: 7px 12px; cursor: pointer; }
  .g-freccia:hover, .g-pausa:hover, .g-freccia:focus-visible, .g-pausa:focus-visible { border-color: var(--accento); outline: none; }
  .g-punti { display: inline-flex; gap: 6px; }
  .g-punto { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid var(--inchiostro-3); background: none; padding: 0; cursor: pointer; }
  .g-punto[aria-current="true"] { background: var(--accento); border-color: var(--accento); }
  .g-punto:focus-visible { outline: 2px solid var(--accento); outline-offset: 2px; }
  .casa-azioni { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin: clamp(10px, 2vw, 20px) 0 0; color: var(--inchiostro-2); }
  .tutte { margin-top: clamp(36px, 5vw, 64px); border-top: 1px solid var(--riga); padding-top: 22px; }
  .tutte h2 { font-size: clamp(26px, 3vw, 38px); letter-spacing: -0.04em; margin: 0 0 14px; }
  .tessere { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; border-top: 1px solid var(--riga); }
  .tessera { padding: 16px 16px 18px 0; border-bottom: 1px solid var(--riga); display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; align-content: start; }
  .tessera-icona { grid-row: span 3; width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--inchiostro-3); background: var(--carta); display: grid; place-items: center; cursor: pointer; padding: 0; }
  .tessera-icona svg { width: 20px; height: 20px; fill: none; stroke: var(--inchiostro); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
  .tessera-icona:hover, .tessera-icona:focus-visible { border-color: var(--accento); outline: none; }
  .tessera-n { font-family: var(--cifre); font-size: 11px; color: var(--inchiostro-3); }
  .tessera h3 { font-family: var(--titoli); font-size: 18px; letter-spacing: -0.02em; line-height: 1.15; margin: 0; }
  .tessera p { margin: 2px 0 0; display: flex; flex-wrap: wrap; gap: 4px 12px; }
  .tessera p a { font-size: 14.5px; }
  .arrivo { margin: 14px 0 0; color: var(--inchiostro-3); font-size: 14px; }
  .arrivo span { font-family: var(--cifre); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; border: 1px solid var(--riga); border-radius: 999px; padding: 3px 9px; margin-right: 8px; }
  .altro { display: flex; flex-wrap: wrap; gap: 10px; margin: clamp(28px, 4vw, 44px) 0 0; }
  .altro a { font-family: var(--cifre); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; text-decoration: none; color: var(--inchiostro); border: 1px solid var(--riga); border-radius: 999px; padding: 9px 14px; }
  .altro a:hover { border-color: var(--accento); }
  @media (max-width: 1000px) { .tessere { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 760px) {
    .giostra { grid-template-columns: minmax(0, 1fr); }
    .giostra-scena { max-width: 420px; }
    .giostra-pannello { min-height: 0; }
  }
  @media (max-width: 520px) { .tessere { grid-template-columns: minmax(0, 1fr); } }
  @media (prefers-reduced-motion: reduce) { .polpo .braccia, .b-icona { transition: none; } }
/*/casa*/'''


def main():
    p = os.path.join(REPO, 'index.html')
    s = open(p, encoding='utf-8').read()
    if '<!--casa-->' in s:
        s = re.sub(r'<!--casa-->.*?<!--/casa-->\n', lambda m: blocco(), s, count=1, flags=re.S)
    else:
        i = s.index('  <header class="eroe">')
        j = s.index('  <section class="principi"')
        s = s[:i] + '  ' + blocco() + '\n' + s[j:]
    if '/*casa*/' in s:
        s = re.sub(r'/\*casa\*/.*?/\*/casa\*/', lambda m: CSS, s, count=1, flags=re.S)
    else:
        s = re.sub(r'/\*mappa\*/.*?/\*/mappa\*/', lambda m: CSS, s, count=1, flags=re.S)
    s = s.replace('<meta name="description" content="Strumenti aperti al servizio del cittadino, che funzionano senza chiedere niente a nessuno: bonus che ti spettano, ricorso alle multe, accesso agli atti della pubblica amministrazione.">',
                  '<meta name="description" content="Polpo civico: il Polpo e le sue otto braccia ti aiutano con la burocrazia e con la vita pubblica. Bonus, multe, rimborsi, documenti, bilanci del Comune, raccolte firme. Gratis, con le fonti.">')
    open(p, 'w', encoding='utf-8').write(s)
    print('pagina d\'ingresso scritta')


if __name__ == '__main__':
    main()
