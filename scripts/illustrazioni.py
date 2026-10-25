#!/usr/bin/env python3
"""Illustrazioni del sito: disegni al tratto nello stile del marchio (inchiostro e filo rosso).
Sono SVG in linea, così seguono il tema chiaro e scuro con le classi di comune/stile.css
(.s-l tratto, .s-t filo, .s-c carta, .s-f fondo, .s-r rosso pieno, .s-p rosso tenue).

Inserisce o aggiorna le scene tra i marcatori <!--scena:nome--> ... <!--/scena--> nelle pagine.
Uso: python3 -I scripts/illustrazioni.py
"""
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def svg(corpo, etichetta, vb='0 0 320 140'):
    return f'<svg class="scena-svg" viewBox="{vb}" role="img" aria-label="{etichetta}" preserveAspectRatio="xMidYMid meet">{corpo}</svg>'


NODO = lambda x, y, r=5: f'<circle class="s-r" cx="{x}" cy="{y}" r="{r}"/>'

SCENE = {
    # Il labirinto della burocrazia, il filo che porta fuori, la porta aperta
    'eroe': svg(
        '<rect class="s-p" x="232" y="34" width="56" height="92" rx="4"/>'
        '<path class="s-l" d="M40 130 V20 H220 V130 M70 130 V50 H190 V100 M100 20 V80 H160 M130 130 V110 M220 75 H190" />'
        '<path class="s-l" d="M232 126 V34 H288 V126" />'
        '<path class="s-l" d="M240 126 V44 L276 38 V120 Z" style="fill:var(--carta)"/>'
        '<circle class="s-r" cx="268" cy="82" r="2.6"/>'
        f'{NODO(22, 130, 6)}'
        '<path class="s-t" d="M28 128 C44 124 52 112 55 96 V34 H205 V115 H145 V93 C145 86 118 86 115 93 V65 H175 V88 M175 88 C182 96 200 92 205 78 C212 66 226 72 240 76" />'
        '<circle class="s-l" cx="300" cy="66" r="7" style="fill:var(--carta)"/><path class="s-l" d="M300 73 V104 M300 104 L292 126 M300 104 L308 126 M300 82 L288 94 M300 82 L312 92"/>',
        'Un labirinto di muri e, dentro, un filo rosso che parte da un nodo, attraversa i corridoi ed esce da una porta aperta, dove aspetta una persona', '0 0 320 140'),

    'assistente': svg(
        '<rect class="s-l" x="70" y="26" width="130" height="44" rx="14" style="fill:var(--carta)"/><path class="s-l" d="M92 70 L86 84 L106 70" style="fill:var(--carta)"/>'
        '<path class="s-l" d="M88 42 H180 M88 54 H150"/>'
        '<path class="s-l" d="M246 116 L258 130 L234 116" style="fill:var(--carta)"/><rect class="s-c" x="140" y="78" width="134" height="40" rx="14"/><rect class="s-p" x="140" y="78" width="134" height="40" rx="14"/><rect class="s-l" x="140" y="78" width="134" height="40" rx="14"/>'
        '<path class="s-l" d="M158 94 H250 M158 106 H214"/>'
        f'{NODO(24, 112)}<path class="s-t" d="M30 112 C48 112 46 78 70 66 M134 70 C136 80 136 88 140 94"/>'
        '<rect class="s-l" x="290" y="40" width="22" height="30" rx="2" style="fill:var(--carta)"/><path class="s-t" d="M284 98 C296 92 300 84 301 70"/>',
        'Due nuvolette di dialogo legate da un filo rosso a un documento pronto'),

    'mi-spetta': svg(
        '<ellipse class="s-l" cx="110" cy="112" rx="40" ry="10" style="fill:var(--carta)"/><path class="s-l" d="M70 112 V100 M150 112 V100"/><ellipse class="s-l" cx="110" cy="100" rx="40" ry="10" style="fill:var(--carta)"/>'
        '<path class="s-l" d="M70 100 V88 M150 100 V88"/><ellipse class="s-l" cx="110" cy="88" rx="40" ry="10" style="fill:var(--carta)"/>'
        '<path class="s-l" d="M70 88 V76 M150 88 V76"/><ellipse class="s-p" cx="110" cy="76" rx="40" ry="10"/><ellipse class="s-l" cx="110" cy="76" rx="40" ry="10"/>'
        '<text x="110" y="81" text-anchor="middle" class="s-testo">€</text>'
        '<rect class="s-l" x="190" y="22" width="80" height="100" rx="4" style="fill:var(--carta)"/><path class="s-l" d="M204 44 L210 50 L222 38 M230 44 H258 M204 68 L210 74 L222 62 M230 68 H258 M230 92 H258"/><path class="s-t" d="M204 92 L210 98 L222 86"/>'
        f'{NODO(30, 60)}<path class="s-t" d="M36 60 C70 50 90 40 110 58 C120 66 150 60 190 54"/>',
        'Una pila di monete e una lista di requisiti spuntati, legate dal filo rosso'),

    'faccio-ricorso': svg(
        '<rect class="s-l" x="60" y="18" width="40" height="96" rx="10" style="fill:var(--carta)"/><circle class="s-r" cx="80" cy="40" r="11"/><circle class="s-l" cx="80" cy="66" r="11"/><circle class="s-l" cx="80" cy="92" r="11"/><path class="s-l" d="M80 114 V132"/>'
        '<path class="s-l" d="M150 28 H246 L258 40 V124 H150 Z" style="fill:var(--carta)"/><path class="s-l" d="M246 28 V40 H258 M166 52 H232 M166 66 H220 M166 80 H236"/>'
        '<path class="s-t" d="M170 104 L180 114 L200 94"/>'
        f'{NODO(112, 132)}<path class="s-t" d="M118 130 C132 124 136 110 150 104"/>'
        '<path class="s-t" d="M272 70 C292 70 294 96 272 100 M278 92 L270 100 L278 108"/>',
        'Un semaforo rosso e un verbale con una spunta: il ricorso che torna indietro'),

    'chiedo-gli-atti': svg(
        '<path class="s-l" d="M40 54 L110 22 L180 54 Z" style="fill:var(--carta)"/><path class="s-l" d="M48 58 H172 M56 62 V112 M80 62 V112 M104 62 V112 M128 62 V112 M152 62 V112 M40 116 H180 M34 124 H186"/>'
        '<circle class="s-r" cx="110" cy="42" r="4"/>'
        '<path class="s-l" d="M224 38 H274 L286 50 V118 H224 Z" style="fill:var(--carta)"/><path class="s-l" d="M274 38 V50 H286 M236 64 H274 M236 78 H274 M236 92 H262"/>'
        f'{NODO(110, 96)}<path class="s-t" d="M116 94 C150 90 170 70 200 74 C212 76 216 82 224 84"/>'
        '<path class="s-p" d="M236 104 H274 V110 H236 Z"/>',
        'Un municipio con le colonne e un documento che ne esce, tenuto dal filo rosso'),

    'mi-rimborsano': svg(
        '<path class="s-l" d="M30 66 L120 58 L140 40 L150 42 L140 60 L180 58 C188 58 188 70 180 70 L140 70 L150 88 L140 90 L120 72 L30 70 Z" style="fill:var(--carta)"/>'
        '<rect class="s-l" x="200" y="60" width="64" height="60" rx="12" style="fill:var(--carta)"/><rect class="s-p" x="210" y="70" width="44" height="20" rx="4"/><circle class="s-l" cx="216" cy="104" r="4"/><circle class="s-l" cx="248" cy="104" r="4"/><path class="s-l" d="M206 128 L214 120 M258 128 L250 120"/>'
        '<path class="s-l" d="M276 18 H306 V54 L300 50 L294 54 L288 50 L282 54 L276 50 Z" style="fill:var(--carta)"/><text x="291" y="40" text-anchor="middle" class="s-testo s-piccolo">€</text>'
        f'{NODO(24, 110)}<path class="s-t" d="M30 110 C80 120 150 112 190 96 M292 60 C292 86 280 96 266 100"/>'
        '<path class="s-t" d="M296 64 L292 56 L286 64"/>',
        'Un aereo, un treno e uno scontrino: il rimborso che torna verso chi ne ha diritto'),

    'bilancio-comune': svg(
        '<path class="s-l" d="M24 124 H296"/>'
        '<rect class="s-l" x="60" y="80" width="28" height="44" style="fill:var(--carta)"/><rect class="s-p" x="104" y="54" width="28" height="70"/><rect class="s-l" x="104" y="54" width="28" height="70"/>'
        '<rect class="s-l" x="148" y="70" width="28" height="54" style="fill:var(--carta)"/><rect class="s-l" x="192" y="40" width="28" height="84" style="fill:var(--carta)"/><rect class="s-l" x="236" y="62" width="28" height="62" style="fill:var(--carta)"/>'
        f'{NODO(36, 88)}<path class="s-t" d="M42 86 C60 70 70 72 74 70 S110 40 118 44 S150 62 162 58 S198 26 206 30 S240 56 250 50 L284 30"/>'
        '<path class="s-t" d="M276 28 L286 29 L282 38"/>',
        'Le colonne di un grafico della spesa e il filo rosso che le confronta'),

    'appalti': svg(
        '<path class="s-l" d="M40 124 H160 V96 H40 Z M48 96 V72 H152 V96 M56 72 V52 H144 V72" style="fill:var(--carta)"/>'
        '<path class="s-l" d="M188 128 V18"/><path class="s-r" d="M190 22 H254 L240 40 L254 58 H190 Z"/>'
        '<circle class="s-l" cx="262" cy="98" r="18" style="fill:var(--carta)"/><path class="s-l" d="M275 111 L294 130"/>'
        f'{NODO(24, 110)}<path class="s-t" d="M30 110 C34 100 40 100 40 100 M160 108 C176 108 180 118 188 120"/>',
        'Una pila di fascicoli di gara, una bandiera rossa e una lente d\'ingrandimento'),

    'mondo': svg(
        '<circle class="s-l" cx="160" cy="70" r="56" style="fill:var(--carta)"/><ellipse class="s-l" cx="160" cy="70" rx="24" ry="56"/><path class="s-l" d="M104 70 H216 M112 44 H208 M112 96 H208"/>'
        '<circle class="s-r" cx="128" cy="48" r="4"/><circle class="s-r" cx="196" cy="56" r="4"/><circle class="s-r" cx="146" cy="100" r="4"/><circle class="s-r" cx="186" cy="92" r="4"/>'
        '<path class="s-t" d="M128 48 C150 30 180 40 196 56 C206 70 200 84 186 92 C172 100 160 104 146 100"/>'
        f'{NODO(40, 120)}<path class="s-t" d="M46 118 C80 110 100 110 128 48" style="opacity:.55"/>',
        'Un globo con quattro punti rossi legati da un filo: gli agenti civici nel mondo'),

    'navigatore': svg(
        '<path class="s-l" d="M160 132 V16 M140 132 H180"/>'
        '<path class="s-l" d="M160 26 H232 L246 38 L232 50 H160 Z" style="fill:var(--carta)"/><path class="s-p" d="M160 62 H88 L74 74 L88 86 H160 Z"/><path class="s-l" d="M160 62 H88 L74 74 L88 86 H160 Z"/>'
        '<path class="s-l" d="M176 38 H222 M100 74 H146"/><circle class="s-r" cx="160" cy="16" r="5"/>'
        f'{NODO(30, 124)}<path class="s-t" d="M36 122 C70 118 90 112 104 100 C112 94 120 92 140 100 C150 104 154 110 160 112 M160 112 C196 116 230 96 262 104 C280 108 290 120 300 122"/>',
        'Un cartello stradale con le frecce e il filo rosso che indica la strada'),

    'governa': svg(
        '<path class="s-l" d="M70 50 L160 18 L250 50 Z" style="fill:var(--carta)"/><path class="s-l" d="M80 54 H240 M92 58 V110 M124 58 V110 M156 58 V110 M188 58 V110 M220 58 V110 M70 114 H250 M62 122 H258"/>'
        '<path class="s-l" d="M160 18 V4"/><path class="s-r" d="M161 4 H180 L174 9 L180 14 H161 Z"/>',
        'Un palazzo pubblico con la bandiera', '0 0 320 130'),
    'controlla': svg(
        '<path class="s-l" d="M80 18 H186 L200 32 V118 H80 Z" style="fill:var(--carta)"/><path class="s-l" d="M96 44 H184 M96 60 H184 M96 76 H160 M96 92 H176"/>'
        '<circle class="s-l" cx="200" cy="84" r="30" style="fill:var(--carta);fill-opacity:.85"/><path class="s-t" d="M184 80 H216 M190 92 H208"/><path class="s-l" d="M222 106 L250 126"/>',
        'Una lente d\'ingrandimento su un documento pubblico', '0 0 320 130'),
    'organizza': svg(
        '<circle class="s-l" cx="100" cy="46" r="14" style="fill:var(--carta)"/><path class="s-l" d="M74 104 C74 78 126 78 126 104 Z" style="fill:var(--carta)"/>'
        '<circle class="s-l" cx="160" cy="40" r="15" style="fill:var(--carta)"/><path class="s-p" d="M132 104 C132 74 188 74 188 104 Z"/><path class="s-l" d="M132 104 C132 74 188 74 188 104 Z"/>'
        '<circle class="s-l" cx="220" cy="46" r="14" style="fill:var(--carta)"/><path class="s-l" d="M194 104 C194 78 246 78 246 104 Z" style="fill:var(--carta)"/>'
        '<path class="s-t" d="M100 60 C120 116 200 116 220 60"/><path class="s-l" d="M60 116 H260"/>',
        'Tre persone legate dallo stesso filo', '0 0 320 130'),
    'diritto': svg(
        '<path class="s-l" d="M120 22 H200 V104 H120 Z" style="fill:var(--carta)"/><path class="s-l" d="M134 42 H186 M134 56 H186 M134 70 H170"/><path class="s-t" d="M136 86 L146 96 L166 76"/>'
        '<path class="s-l" d="M70 112 C96 100 110 104 130 108 H190 C200 108 200 120 190 120 H150 M90 124 C120 132 200 132 250 112 C258 108 254 98 246 100 L206 110"/>',
        'Una mano aperta che riceve un documento con la spunta', '0 0 320 130'),
}

# Dove vanno le scene: (file, ancora dopo cui inserire, nome della scena)
POSTI = [
    ('index.html', '<a class="strumento" href="assistente/" data-strumento="assistente" style="grid-column:1/-1">', 'assistente'),
    ('index.html', '<a class="strumento" href="navigatore/" data-strumento="navigatore">', 'navigatore'),
    ('index.html', '<a class="strumento" href="mi-spetta/" data-strumento="mi-spetta">', 'mi-spetta'),
    ('index.html', '<a class="strumento" href="faccio-ricorso/" data-strumento="faccio-ricorso">', 'faccio-ricorso'),
    ('index.html', '<a class="strumento" href="chiedo-gli-atti/" data-strumento="chiedo-gli-atti">', 'chiedo-gli-atti'),
    ('index.html', '<a class="strumento" href="mi-rimborsano/" data-strumento="mi-rimborsano">', 'mi-rimborsano'),
    ('index.html', '<a class="strumento" href="bilancio-comune/" data-strumento="bilancio-comune">', 'bilancio-comune'),
    ('index.html', '<a class="strumento" href="appalti/" data-strumento="appalti">', 'appalti'),
    ('index.html', '<a class="strumento" href="catalogo/#governo">', 'governa'),
    ('index.html', '<a class="strumento" href="catalogo/#trasparenza">', 'controlla'),
    ('index.html', '<a class="strumento" href="catalogo/#aggregazioni">', 'organizza'),
    ('index.html', '<a class="strumento" href="catalogo/#servizi">', 'diritto'),
    ('index.html', '<h2 id="t-mondo" style="font-size:var(--s3);margin:0 0 6px">Gli agenti civici nel mondo</h2>', 'mondo'),
]


def inserisci(testo, ancora, nome):
    blocco = f'<!--scena:{nome}--><div class="scena scena-{nome}">{SCENE[nome]}</div><!--/scena-->'
    gia = re.compile(rf'<!--scena:{re.escape(nome)}-->.*?<!--/scena-->', re.S)
    if gia.search(testo):
        return gia.sub(lambda m: blocco, testo, count=1)
    if ancora not in testo:
        raise SystemExit(f'ancora non trovata per {nome}: {ancora[:60]}')
    return testo.replace(ancora, ancora + blocco, 1)


STRUMENTI = ['assistente', 'mi-spetta', 'faccio-ricorso', 'chiedo-gli-atti', 'mi-rimborsano', 'bilancio-comune', 'appalti', 'navigatore']

# Pagine con un loro foglio di stile (Atlante, catalogo): stesse classi, colori presi dai loro token
STILE_ESTERNO = '''<style>
.scena-est{background:var(--riga-tenue);border-radius:8px;aspect-ratio:32/9;max-height:210px;display:grid;place-items:center;overflow:hidden;color:var(--inchiostro-2);margin:0 0 22px}
.scena-est .scena-svg{width:100%;height:100%;display:block}
.s-l{fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.s-t{fill:none;stroke:var(--accento);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}
.s-r{fill:var(--accento)} .s-p{fill:var(--accento-tenue)} .s-c{fill:var(--carta)}
.s-testo{font-weight:800;font-size:15px;fill:var(--inchiostro)}
@media (prefers-reduced-motion:no-preference){.scena-est .s-t{stroke-dasharray:900;stroke-dashoffset:900;animation:filo 2.4s ease-out forwards}@keyframes filo{to{stroke-dashoffset:0}}}
</style>'''
ESTERNE = [  # (file, ancora, scena, variabili)
    ('mondo/atlante.html', '  <h1>Atlante degli Agenti Civici</h1>', 'mondo', '--accento:var(--accent);--accento-tenue:var(--accent-soft);--carta:var(--paper);--riga-tenue:var(--panel);--inchiostro-2:var(--ink-2);--inchiostro:var(--ink)'),
    ('catalogo/sorgente.html', '  <h1>agenti civici</h1>', 'eroe', '--accento:var(--filo);--accento-tenue:color-mix(in srgb,var(--filo) 16%,transparent);--carta:var(--paper);--riga-tenue:var(--paper-2);--inchiostro-2:var(--ink-2);--inchiostro:var(--ink)'),
]


def esterna(testo, ancora, nome, variabili):
    blocco = f'<!--scena:{nome}-->{STILE_ESTERNO}<div class="scena-est" style="{variabili}">{SCENE[nome]}</div><!--/scena-->\n'
    gia = re.compile(rf'<!--scena:{re.escape(nome)}-->.*?<!--/scena-->\n?', re.S)
    if gia.search(testo):
        return gia.sub(lambda m: blocco, testo, count=1)
    return testo.replace(ancora, blocco + ancora, 1)


def main():
    pagine = {}
    for t in STRUMENTI:
        p = os.path.join(REPO, t, 'index.html')
        testo = open(p, encoding='utf-8').read()
        blocco = f'<!--scena:{t}--><div class="scena scena-testata">{SCENE[t]}</div><!--/scena-->'
        if f'<!--scena:{t}-->' in testo:
            testo = re.sub(rf'<!--scena:{t}-->.*?<!--/scena-->', lambda m: blocco, testo, count=1, flags=re.S)
        else:
            testo, n = re.subn(r'<svg class="icona"[^>]*>.*?</svg>', lambda m: blocco, testo, count=1, flags=re.S)
            if not n:
                raise SystemExit('icona non trovata in ' + t)
        open(p, 'w', encoding='utf-8').write(testo)
    for f, ancora, nome, variabili in ESTERNE:
        p = os.path.join(REPO, f)
        if os.path.exists(p):
            testo = open(p, encoding='utf-8').read()
            if ancora not in testo and f'<!--scena:{nome}-->' not in testo:
                raise SystemExit('ancora non trovata in ' + f)
            open(p, 'w', encoding='utf-8').write(esterna(testo, ancora, nome, variabili))
    for f, ancora, nome in POSTI:
        p = os.path.join(REPO, f)
        pagine.setdefault(p, open(p, encoding='utf-8').read())
        pagine[p] = inserisci(pagine[p], ancora, nome)
    # testata della home: il disegno del labirinto al posto del marchio grande
    p = os.path.join(REPO, 'index.html')
    s = pagine[p]
    eroe = f'<!--scena:eroe--><div class="scena-eroe">{SCENE["eroe"]}</div><!--/scena-->'
    if '<!--scena:eroe-->' in s:
        s = re.sub(r'<!--scena:eroe-->.*?<!--/scena-->', lambda m: eroe, s, count=1, flags=re.S)
    else:
        s = re.sub(r'(<header class="testata"[^>]*>\s*)<svg viewBox="0 0 64 70".*?</svg>', lambda m: m.group(1) + eroe, s, count=1, flags=re.S)
    pagine[p] = s
    for p, s in pagine.items():
        # le card con la scena non mostrano più la piccola icona
        s = re.sub(r'(<!--/scena-->)\s*<svg class="icona"[^>]*>.*?</svg>', r'\1', s, flags=re.S)
        open(p, 'w', encoding='utf-8').write(s)
    print(len(POSTI) + 1, 'scene inserite')


if __name__ == '__main__':
    main()
