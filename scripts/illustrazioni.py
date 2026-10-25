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



def persona(x, y, s=1.0, rossa=False, braccio=None):
    """Mezzo busto: testa e spalle. y è la base delle spalle."""
    r = 9 * s
    corpo = f'M{x - 16 * s:.1f} {y:.1f} C{x - 16 * s:.1f} {y - 24 * s:.1f} {x + 16 * s:.1f} {y - 24 * s:.1f} {x + 16 * s:.1f} {y:.1f} Z'
    riempi = 'var(--accento-tenue)' if rossa else 'var(--carta)'
    b = ''
    if braccio == 'su':
        b = f'<path class="s-l" d="M{x + 10 * s:.1f} {y - 16 * s:.1f} L{x + 18 * s:.1f} {y - 44 * s:.1f}"/><circle class="s-l" cx="{x + 18.5 * s:.1f}" cy="{y - 47 * s:.1f}" r="{3 * s:.1f}" style="fill:var(--carta)"/>'
    return (f'<path class="s-l" d="{corpo}" style="fill:{riempi}"/>'
            f'<circle class="s-l" cx="{x}" cy="{y - 30 * s:.1f}" r="{r:.1f}" style="fill:var(--carta)"/>{b}')

NODO = lambda x, y, r=5: f'<circle class="s-r" cx="{x}" cy="{y}" r="{r}"/>'

SCENE = {
    # Il labirinto della burocrazia, il filo che porta fuori, la porta aperta
    'eroe': svg(
        '<path class="s-l" d="M20 170 V40 H150 V170 M44 170 V64 H126 V140 M68 40 V110 H102 M88 170 V150 M150 100 H126" />'
        '<path class="s-l" d="M108 52 H138 V64 H108 Z M112 76 H140 V88 H112 Z" style="fill:var(--carta)"/>'
        f'{NODO(10, 170, 6)}'
        '<path class="s-t" d="M16 168 C28 164 32 150 32 130 V52 H138 V152 H114 V124 C114 116 82 116 80 124 V78 H114 V100 M114 100 C124 110 140 108 150 102 C164 94 176 104 186 112"/>'
        '<circle class="s-l" cx="214" cy="84" r="10" style="fill:var(--carta)"/><path class="s-l" d="M214 94 V130 M214 130 L204 160 M214 130 L224 160 M214 104 L196 116 M214 104 L234 116" />'
        '<path class="s-t" d="M186 112 C190 116 194 116 196 116 M234 116 C262 122 280 110 300 112"/>'
        + persona(320, 160, 1.0) + persona(360, 150, 1.05, rossa=True, braccio='su') + persona(402, 160, 1.0) + persona(440, 152, 0.95) +
        '<rect class="s-l" x="352" y="30" width="96" height="40" rx="12" style="fill:var(--carta)"/><path class="s-l" d="M376 70 L370 82 L390 70" style="fill:var(--carta)"/>'
        '<path class="s-t" d="M374 50 L384 60 L404 40"/><path class="s-l" d="M412 46 H434 M412 56 H428"/>'
        '<path class="s-t" d="M300 112 C310 114 314 120 316 124"/>',
        'Una persona esce dal labirinto delle carte tenendo un filo rosso e lo porta a un gruppo di cittadini che discutono e votano: tecnologia per superare la burocrazia e partecipare', '0 0 470 180'),

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

    'segnalazioni': svg(
        '<path class="s-l" d="M20 118 H300"/><ellipse class="s-p" cx="120" cy="118" rx="44" ry="8"/><ellipse class="s-l" cx="120" cy="118" rx="44" ry="8"/>'
        '<path class="s-l" d="M186 118 L200 62 H212 L226 118 Z" style="fill:var(--carta)"/><path class="s-r" d="M193 92 H219 L222 104 H190 Z"/><path class="s-l" d="M180 118 H232"/>'
        '<rect class="s-l" x="244" y="30" width="44" height="76" rx="8" style="fill:var(--carta)"/><rect class="s-p" x="251" y="40" width="30" height="40" rx="3"/><circle class="s-l" cx="266" cy="94" r="4"/>'
        f'{NODO(30, 96)}<path class="s-t" d="M36 94 C60 80 78 98 96 110 M150 110 C170 96 182 80 196 74 M222 70 C232 62 240 58 251 58"/>',
        'Una buca nella strada, un cono stradale e un telefono che fotografa: la segnalazione'),

    'reclami-pa': svg(
        '<path class="s-l" d="M40 120 H200 V70 H40 Z" style="fill:var(--carta)"/><path class="s-l" d="M30 70 H210 M56 96 H112 M56 108 H96"/><rect class="s-p" x="132" y="84" width="52" height="28" rx="3"/><path class="s-l" d="M132 84 H184 V112 H132 Z M140 94 H176 M140 102 H166"/>'
        '<path class="s-l" d="M150 52 C150 40 166 40 166 52 Z" style="fill:var(--carta)"/><path class="s-l" d="M146 52 H170 M158 36 V32"/>'
        '<path class="s-l" d="M236 34 H290 V96 H236 Z" style="fill:var(--carta)"/><path class="s-l" d="M236 34 L263 62 L290 34"/>'
        f'{NODO(24, 112)}<path class="s-t" d="M30 110 C34 96 36 88 40 86 M210 96 C222 96 226 80 236 74"/><path class="s-t" d="M248 112 L258 122 L278 102"/>',
        'Lo sportello di un ufficio pubblico con il campanello, una pratica e una lettera che parte'),

    'burocrazia': svg(
        '<path class="s-l" d="M40 150 H150 V136 H40 Z M46 136 V122 H144 V136 M52 122 V108 H138 V122 M58 108 V94 H132 V108" style="fill:var(--carta)"/>'
        '<path class="s-l" d="M64 94 V82 H126 V94" style="fill:var(--carta)"/><path class="s-l" d="M70 86 H120"/>'
        + persona(230, 150, 1.15) +
        '<rect class="s-l" x="252" y="96" width="30" height="46" rx="5" style="fill:var(--carta)"/><rect class="s-p" x="257" y="104" width="20" height="26" rx="2"/>'
        f'{NODO(24, 150, 5)}<path class="s-t" d="M30 148 C36 120 60 70 100 66 C140 62 160 96 190 110 C206 118 216 112 224 110 M250 112 C254 112 256 110 258 112"/>'
        '<path class="s-t" d="M262 118 L268 124 L280 110"/><path class="s-l" d="M300 70 H372 V130 H300 Z M300 82 H372" style="fill:var(--carta)"/><path class="s-t" d="M312 100 L322 110 L340 92"/><path class="s-l" d="M346 100 H362 M346 112 H358"/>'
        '<path class="s-t" d="M282 104 C290 100 294 98 300 98"/>',
        'Una persona con il telefono lascia alle spalle una pila di moduli: il filo rosso la porta a un documento già pronto e spuntato', '0 0 400 170'),
    'partecipazione': svg(
        '<ellipse class="s-l" cx="200" cy="150" rx="150" ry="14" style="fill:var(--carta)"/>'
        + persona(90, 140, 1.0) + persona(140, 132, 1.0, braccio='su') + persona(200, 128, 1.1, rossa=True) + persona(262, 132, 1.0, braccio='su') + persona(312, 140, 1.0) +
        '<rect class="s-l" x="160" y="22" width="80" height="44" rx="8" style="fill:var(--carta)"/><path class="s-l" d="M172 54 V42 M188 54 V34 M204 54 V46 M220 54 V30"/>'
        f'{NODO(24, 150, 5)}<path class="s-t" d="M30 148 C50 120 70 110 90 110 C110 110 120 100 140 100 S180 96 200 98 S240 100 262 100 S300 108 312 110 C330 112 350 120 370 130"/>'
        '<path class="s-t" d="M168 50 C180 44 194 46 206 40 S226 30 234 28"/>',
        'Cinque persone intorno a un tavolo, due con la mano alzata, unite dallo stesso filo rosso; sopra, un grafico: partecipare alle scelte con i dati', '0 0 400 170'),

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
    ('index.html', '<a class="strumento" href="segnalazioni/" data-strumento="segnalazioni">', 'segnalazioni'),
    ('index.html', '<a class="strumento" href="reclami-pa/" data-strumento="reclami-pa">', 'reclami-pa'),
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


STRUMENTI = ['assistente', 'mi-spetta', 'faccio-ricorso', 'chiedo-gli-atti', 'mi-rimborsano', 'bilancio-comune', 'appalti', 'navigatore', 'segnalazioni', 'reclami-pa']

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
    if '<!--foto-->' in s:  # la testata ha una fotografia: niente disegno
        pass
    elif '<!--scena:eroe-->' in s:
        s = re.sub(r'<!--scena:eroe-->.*?<!--/scena-->', lambda m: eroe, s, count=1, flags=re.S)
    else:
        s = re.sub(r'(<header class="testata"[^>]*>\s*)<svg viewBox="0 0 64 70".*?</svg>', lambda m: m.group(1) + eroe, s, count=1, flags=re.S)
    pagine[p] = s
    for p, s in pagine.items():
        # le card con la scena non mostrano più la piccola icona
        s = re.sub(r'(<!--/scena-->)\s*<svg class="icona"[^>]*>.*?</svg>', r'\1', s, flags=re.S)
        open(p, 'w', encoding='utf-8').write(s)
    print(len(POSTI) + 1, 'scene inserite')



# ---------------------------------------------------------------------------
# Loghi degli strumenti: una piastrella con il pittogramma in inchiostro e il
# filo rosso che parte dal nodo. Stessa famiglia del marchio.
# ---------------------------------------------------------------------------

def _logo(corpo, filo, nodo):
    x, y = nodo
    return (f'<rect class="lg-f" x="3" y="3" width="58" height="58" rx="16"/>{corpo}'
            f'<path class="lg-t" d="{filo}"/><circle class="lg-n" cx="{x}" cy="{y}" r="3.4"/>')

LOGHI = {
    'assistente': ('Assistente civico', _logo('<path class="lg-i" d="M15 17 H49 V39 H31 L22 47 V39 H15 Z"/>', 'M15 52 C20 50 21 44 22 41 M22 28 C26 23 30 33 34 28 S41 24 43 28', (12, 53))),
    'navigatore': ('Navigatore dei servizi', _logo('<path class="lg-i" d="M32 52 V12 M24 52 H40 M32 16 H45 L50 21 L45 26 H32 M32 31 H19 L14 36 L19 41 H32"/>', 'M14 52 C20 49 24 47 32 47', (11, 53))),
    'mi-spetta': ('Mi spetta', _logo('<ellipse class="lg-i" cx="28" cy="44" rx="13" ry="5"/><path class="lg-i" d="M15 44 V36 M41 44 V36"/><ellipse class="lg-i" cx="28" cy="36" rx="13" ry="5"/><path class="lg-i" d="M15 36 V28 M41 36 V28"/><ellipse class="lg-i" cx="28" cy="28" rx="13" ry="5"/>', 'M14 53 C30 54 40 44 42 34 M38 18 L43 23 L52 12', (11, 52))),
    'faccio-ricorso': ('Faccio ricorso?', _logo('<path class="lg-i" d="M18 13 H38 L46 21 V51 H18 Z M38 13 V21 H46"/><path class="lg-i" d="M24 30 H40 M24 37 H36"/>', 'M52 46 H31 C25 46 25 40 31 40 H35 M33 37 L36 40 L33 43', (52, 52))),
    'chiedo-gli-atti': ('Chiedo gli atti', _logo('<path class="lg-i" d="M14 27 L32 15 L50 27 Z M18 31 V47 M26 31 V47 M38 31 V47 M46 31 V47 M14 51 H50"/>', 'M12 41 C20 41 26 37 32 37 V47', (9, 41))),
    'mi-rimborsano': ('Mi rimborsano?', _logo('<path class="lg-i" d="M30 36 H50 V50 H30 Z M30 41 H50"/>', 'M14 44 C13 22 40 14 42 28 M38 24 L42 29 L46 24', (13, 49))),
    'reclami-pa': ('Reclami alla PA', _logo('<path class="lg-i" d="M14 44 H50 M17 44 C17 30 47 30 47 44 M32 30 V25 M28 25 H36"/><path class="lg-i" d="M12 50 H52"/>', 'M14 22 C22 14 34 14 42 20 M38 16 L42 20 L38 24', (11, 26))),
    'segnalazioni': ('Segnalazioni urbane', _logo('<path class="lg-i" d="M32 50 C22 38 18 32 18 25 A14 14 0 0 1 46 25 C46 32 42 38 32 50 Z"/><path class="lg-i" d="M32 18 V27"/><circle class="lg-n" cx="32" cy="32" r="2.2"/>', 'M12 52 C18 52 22 50 26 46', (9, 53))),
    'bilancio-comune': ('Il bilancio del mio Comune', _logo('<path class="lg-i" d="M13 50 H51 M19 50 V36 M28 50 V28 M37 50 V33 M46 50 V22"/>', 'M14 30 C20 24 24 18 28 20 S36 28 40 22 L49 14', (12, 33))),
    'appalti': ('Red flag sugli appalti', _logo('<path class="lg-i" d="M20 52 V12"/>', 'M21 14 H47 L41 21 L47 28 H21 M14 52 H20', (12, 52))),
    'mcp': ('Server MCP', _logo('<path class="lg-i" d="M22 20 V12 M34 20 V12 M17 20 H39 V30 C39 38 34 42 28 42 C22 42 17 38 17 30 Z M28 42 V48"/>', 'M28 48 C28 54 38 54 44 48 S50 38 52 34', (52, 31))),
}

STILE_LOGO = ('.lg-f{fill:var(--carta,#FFFDF8);stroke:var(--inchiostro,#17202E);stroke-width:2.4}'
              '.lg-i{fill:none;stroke:var(--inchiostro,#17202E);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}'
              '.lg-t{fill:none;stroke:var(--accento,#C2362B);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}'
              '.lg-n{fill:var(--accento,#C2362B)}')


def logo_svg(nome, classe='logo-strumento', titolo=True):
    etichetta, corpo = LOGHI[nome]
    return f'<svg class="{classe}" viewBox="0 0 64 64" role="img" aria-label="Logo di {etichetta}">{corpo}</svg>'


def favicon(nome):
    """Versione autonoma per la scheda del browser: colori fissi, niente variabili."""
    _, corpo = LOGHI[nome]
    stile = STILE_LOGO.replace('var(--carta,#FFFDF8)', '#FFFDF8').replace('var(--inchiostro,#17202E)', '#17202E').replace('var(--accento,#C2362B)', '#C2362B')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>{stile}</style>{corpo}</svg>\n'


def applica_loghi():
    nomi_h1 = {'assistente': 'Assistente civico', 'navigatore': 'Navigatore dei servizi', 'mi-spetta': 'Mi spetta', 'faccio-ricorso': 'Faccio ricorso?',
               'chiedo-gli-atti': 'Chiedo gli atti', 'mi-rimborsano': 'Mi rimborsano?', 'reclami-pa': 'Reclami alla PA', 'segnalazioni': 'Segnalazioni urbane',
               'bilancio-comune': 'Il bilancio del mio Comune', 'appalti': 'Red flag sugli appalti'}
    for t, h1 in nomi_h1.items():
        cartella = os.path.join(REPO, t)
        open(os.path.join(cartella, 'src', 'logo.svg'), 'w', encoding='utf-8').write(favicon(t))
        p = os.path.join(cartella, 'index.html')
        s = open(p, encoding='utf-8').read()
        blocco = f'<!--logo:{t}--><div class="titolo-logo">{logo_svg(t)}<h1>{h1}</h1></div><!--/logo-->'
        if f'<!--logo:{t}-->' in s:
            s = re.sub(rf'<!--logo:{re.escape(t)}-->.*?<!--/logo-->', lambda m: blocco, s, count=1, flags=re.S)
        else:
            s = s.replace(f'<h1>{h1}</h1>', blocco, 1)
        s = re.sub(r'<link rel="icon" href="src/comune/marchio\.svg" type="image/svg\+xml">', '<link rel="icon" href="src/logo.svg" type="image/svg+xml">', s)
        open(p, 'w', encoding='utf-8').write(s)
    # home: il logo dentro la scena di ogni scheda
    p = os.path.join(REPO, 'index.html')
    s = open(p, encoding='utf-8').read()
    for t in list(nomi_h1):
        s = re.sub(rf'(<!--scena:{re.escape(t)}--><div class="scena scena-{re.escape(t)}">)(?:<!--logo-->.*?<!--/logo-->)?', lambda m, t=t: m.group(1) + f'<!--logo-->{logo_svg(t, "logo-scheda")}<!--/logo-->', s, count=1, flags=re.S)
    open(p, 'w', encoding='utf-8').write(s)



if __name__ == '__main__':
    main()
    applica_loghi()
