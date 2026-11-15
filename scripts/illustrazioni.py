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
        'Un globo con quattro punti rossi legati da un filo: gli strumenti civici nel mondo'),

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

    'raccolte-firme': svg(
        '<rect class="s-l" x="40" y="60" width="150" height="10" rx="3" style="fill:var(--carta)"/><path class="s-l" d="M56 70 L48 130 M174 70 L182 130"/>'
        '<rect class="s-l" x="70" y="30" width="44" height="30" rx="3" style="fill:var(--carta)"/><path class="s-l" d="M78 40 H106 M78 48 H98"/>'
        + persona(240, 130, 1.0) + persona(286, 124, 1.05, rossa=True) +
        '<rect class="s-l" x="254" y="76" width="18" height="30" rx="3" style="fill:var(--carta)"/>'
        '<path class="s-l" d="M20 130 H300"/>'
        f'{NODO(24, 100, 5)}<path class="s-t" d="M30 100 C40 92 60 96 70 92 M114 46 C150 40 190 60 210 70 C224 78 240 84 254 88"/><path class="s-t" d="M150 52 C156 46 160 58 166 52"/>',
        'Un banchetto con un modulo e due persone che firmano dal telefono: le raccolte firme', '0 0 320 140'),

    'garanzia': svg(
        '<rect class="s-l" x="40" y="34" width="78" height="92" rx="6" style="fill:var(--carta)"/><circle class="s-l" cx="79" cy="86" r="24" style="fill:var(--carta)"/><circle class="s-p" cx="79" cy="86" r="15"/><path class="s-l" d="M48 50 H110 M54 42 H64"/>'
        '<path class="s-l" d="M150 70 L200 52 L250 70 L200 88 Z" style="fill:var(--carta)"/><path class="s-l" d="M150 70 V112 L200 130 L250 112 V70 M200 88 V130"/>'
        '<path class="s-l" d="M268 30 H300 V70 L295 66 L290 70 L285 66 L280 70 L275 66 L268 70 Z" style="fill:var(--carta)"/><path class="s-l" d="M274 40 H294 M274 48 H290"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C34 112 38 108 40 104 M118 70 C132 66 140 66 150 70 M250 70 C262 62 264 56 268 52"/><path class="s-t" d="M214 40 C228 28 248 30 258 40 M252 32 L258 40 L249 43"/>',
        'Una lavatrice, un pacco da restituire con la freccia del reso e lo scontrino: garanzia e recesso', '0 0 320 140'),
    'liste-attesa': svg(
        '<rect class="s-l" x="40" y="30" width="110" height="96" rx="6" style="fill:var(--carta)"/><path class="s-l" d="M40 52 H150 M66 22 V38 M124 22 V38 M58 70 H70 M86 70 H98 M114 70 H126 M58 90 H70 M86 90 H98 M58 108 H70"/>'
        '<circle class="s-p" cx="120" cy="92" r="10"/><circle class="s-l" cx="120" cy="92" r="10"/>'
        '<circle class="s-l" cx="232" cy="74" r="40" style="fill:var(--carta)"/><path class="s-l" d="M232 46 V74 L252 86"/>'
        + persona(296, 132, 0.9, rossa=True) +
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C34 112 36 108 40 104 M130 92 C160 92 176 96 192 82 M272 80 C280 84 284 90 288 96"/>',
        'Un calendario con una data cerchiata, un orologio e una persona in attesa: i tempi massimi delle visite', '0 0 320 140'),
    'progetti-comune': svg(
        '<path class="s-l" d="M36 70 L76 48 L116 70 Z" style="fill:var(--carta)"/><rect class="s-l" x="42" y="70" width="68" height="54" style="fill:var(--carta)"/><path class="s-l" d="M70 124 V100 H82 V124 M52 82 H62 M90 82 H100"/>'
        '<path class="s-l" d="M170 126 V22 M150 22 H286 M170 34 L190 22 M262 22 V58"/><rect class="s-l" x="252" y="58" width="20" height="14" style="fill:var(--carta)"/>'
        '<rect class="s-l" x="196" y="82" width="96" height="42" rx="3" style="fill:var(--carta)"/><circle class="s-p" cx="220" cy="103" r="12"/><path class="s-l" d="M240 96 H282 M240 106 H272 M240 116 H262"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C34 112 36 106 42 102 M110 104 C140 104 160 112 196 108"/>',
        'Un municipio, una gru e il cartello di un cantiere con il codice del progetto: i fondi europei nel tuo Comune', '0 0 320 140'),
    'bollette': svg(
        '<rect class="s-l" x="40" y="22" width="78" height="104" rx="5" style="fill:var(--carta)"/><path class="s-l" d="M52 40 H106 M52 52 H96 M52 64 H100 M52 98 H106"/><rect class="s-p" x="52" y="74" width="40" height="12" rx="2"/>'
        '<path class="s-l" d="M170 86 C152 74 154 40 178 36 C202 40 204 74 186 86 Z M172 92 H184 M173 100 H183" style="fill:var(--carta)"/>'
        '<path class="s-l" d="M250 120 C228 112 230 86 246 70 C246 84 256 86 256 72 C272 88 274 112 250 120 Z" style="fill:var(--accento-tenue)"/>'
        '<path class="s-l" d="M290 40 V84 M280 74 L290 86 L300 74"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C34 112 36 104 40 98 M118 80 C134 80 146 70 156 64 M200 60 C226 48 270 40 286 42"/>',
        'Una bolletta, una lampadina, una fiamma del gas e una freccia che scende: quanto risparmi cambiando offerta', '0 0 320 140'),
    'imu': svg(
        '<path class="s-l" d="M40 72 L80 40 L120 72" style="fill:var(--carta)"/><rect class="s-l" x="48" y="72" width="64" height="52" style="fill:var(--carta)"/><path class="s-l" d="M74 124 V98 H90 V124"/><rect class="s-l" x="120" y="94" width="34" height="30" style="fill:var(--carta)"/>'
        '<rect class="s-l" x="176" y="26" width="64" height="98" rx="3" style="fill:var(--carta)"/><path class="s-l" d="M186 42 H230 M186 54 H230 M186 66 H218 M186 90 H206 M210 90 H230 M186 104 H206 M210 104 H230"/><rect class="s-p" x="210" y="84" width="20" height="12"/>'
        '<rect class="s-l" x="254" y="44" width="50" height="50" rx="4" style="fill:var(--carta)"/><path class="s-l" d="M254 58 H304 M266 38 V50 M292 38 V50"/><circle class="s-l" cx="279" cy="76" r="9"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C34 110 38 100 46 94 M154 108 C164 104 170 98 176 92 M240 70 C246 68 250 66 254 66"/>',
        'Una casa con il box, un modello F24 e un calendario con il 16 cerchiato: quanto paghi di IMU e quando', '0 0 320 140'),
    'eletti': svg(
        '<rect class="s-l" x="30" y="92" width="44" height="32" style="fill:var(--carta)"/><path class="s-l" d="M30 92 L52 78 L74 92 M48 124 V108 H56 V124"/>'
        '<rect class="s-l" x="88" y="78" width="50" height="46" style="fill:var(--carta)"/><path class="s-l" d="M98 90 V114 M113 90 V114 M128 90 V114"/>'
        '<rect class="s-l" x="152" y="62" width="58" height="62" style="fill:var(--carta)"/><path class="s-l" d="M162 76 V114 M181 76 V114 M200 76 V114"/>'
        '<path class="s-l" d="M226 124 V64 H290 V124 M234 64 C234 40 282 40 282 64" style="fill:var(--carta)"/><path class="s-l" d="M240 80 V114 M258 80 V114 M276 80 V114"/>'
        '<circle class="s-p" cx="294" cy="30" r="14"/><circle class="s-l" cx="294" cy="30" r="14"/>'
        f'{NODO(24, 132, 4)}<path class="s-t" d="M28 130 C60 132 100 130 140 130 C180 130 220 130 290 130"/>',
        'Cinque edifici dal municipio al Parlamento e la cerchia di stelle europea: chi ti rappresenta a ogni livello', '0 0 320 140'),
    'disdette': svg(
        '<rect class="s-l" x="40" y="54" width="92" height="56" rx="8" style="fill:var(--carta)"/><path class="s-l" d="M52 70 H96 M52 82 H84"/><rect class="s-p" x="100" y="88" width="22" height="14" rx="2"/>'
        '<path class="s-l" d="M150 30 L196 76 M196 30 L150 76"/><circle class="s-l" cx="146" cy="26" r="9" style="fill:var(--carta)"/><circle class="s-l" cx="200" cy="26" r="9" style="fill:var(--carta)"/>'
        '<rect class="s-l" x="214" y="70" width="86" height="54" rx="3" style="fill:var(--carta)"/><path class="s-l" d="M214 70 L257 102 L300 70"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C34 112 38 108 44 106 M132 84 C150 84 160 60 173 53 M196 60 C214 66 224 74 230 82"/>',
        'Una tessera d\'abbonamento, una forbice aperta e una busta: disdire un contratto', '0 0 320 140'),
    'affitto': svg(
        '<rect class="s-l" x="48" y="24" width="64" height="102" rx="3" style="fill:var(--carta)"/><circle class="s-l" cx="100" cy="80" r="4"/><rect class="s-p" x="60" y="36" width="40" height="30" rx="2"/>'
        '<path class="s-l" d="M140 50 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M150 50 H186 M174 50 V60 M182 50 V58"/>'
        '<path class="s-l" d="M216 112 C200 112 196 90 214 82 C224 70 262 70 272 84 L286 84 L284 96 C280 104 276 108 270 112 Z" style="fill:var(--carta)"/><path class="s-l" d="M236 76 H252 M226 112 V122 M262 112 V122"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C36 110 40 104 48 100 M112 76 C124 70 128 62 130 56 M186 54 C204 60 214 70 224 78"/>',
        'Una porta di casa, le chiavi e un salvadanaio per il deposito: i diritti di chi è in affitto e di chi affitta', '0 0 320 140'),
    'condominio': svg(
        '<rect class="s-l" x="36" y="24" width="72" height="102" style="fill:var(--carta)"/><path class="s-l" d="M36 58 H108 M36 92 H108 M48 36 H60 M84 36 H96 M48 70 H60 M84 70 H96 M66 126 V104 H78 V126"/>'
        '<path class="s-l" d="M140 96 H232 M150 96 V122 M222 96 V122"/><rect class="s-p" x="168" y="84" width="34" height="10" rx="1"/>'
        '<path class="s-l" d="M266 40 V112 M246 112 H286 M240 52 H292 M240 52 L232 74 H248 Z M292 52 L284 74 H300 Z" style="fill:var(--carta)"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C32 112 34 108 36 104 M108 76 C130 80 150 82 168 86 M202 88 C220 80 230 70 240 62"/>',
        'Un piccolo condominio, il tavolo dell\'assemblea con il verbale e una bilancia: delibere, millesimi e conti', '0 0 320 140'),
    'pensione': svg(
        '<path class="s-l" d="M36 98 H140 M44 98 V124 M132 98 V124 M36 86 H140"/>'
        '<rect class="s-l" x="168" y="26" width="64" height="76" rx="4" style="fill:var(--carta)"/><path class="s-l" d="M168 44 H232 M180 20 V32 M220 20 V32"/><circle class="s-p" cx="200" cy="72" r="13"/><circle class="s-l" cx="200" cy="72" r="13"/>'
        '<path class="s-l" d="M260 40 H300 M260 120 H300 M264 40 C264 70 296 70 296 80 C296 90 264 90 264 120 M296 40 C296 70 264 70 264 80" style="fill:none"/><path class="s-p" d="M270 112 L290 112 L280 100 Z"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C40 108 60 100 80 92 M140 90 C156 86 164 80 187 74 M213 72 C240 70 250 66 262 62"/>',
        'Una panchina, un calendario con un giorno cerchiato e una clessidra: quando vai in pensione', '0 0 320 140'),
    'tasse': svg(
        '<path class="s-l" d="M56 116 C36 116 30 88 52 80 C62 66 104 66 114 80 L128 80 L126 94 C122 104 116 110 108 116 Z" style="fill:var(--carta)"/><path class="s-l" d="M76 74 H94 M66 116 V126 M100 116 V126"/>'
        '<circle class="s-p" cx="150" cy="56" r="8"/><circle class="s-p" cx="174" cy="40" r="8"/>'
        '<path class="s-l" d="M206 28 H222 V40 H234 V56 H222 V68 H206 V56 H194 V40 H206 Z" style="fill:var(--carta)"/>'
        '<path class="s-l" d="M250 84 H290 V118 H250 Z M270 84 V118" style="fill:var(--carta)"/>'
        '<path class="s-l" d="M210 124 V92 M202 92 H226 L218 84 H210"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C34 106 36 98 40 92 M120 76 C136 66 140 60 144 58 M180 36 C190 34 194 40 196 44 M178 48 C210 70 236 84 250 96"/>',
        'Un salvadanaio da cui escono monete verso la croce della farmacia, un libro e un lampione: dove finiscono le tasse', '0 0 320 140'),
    'per-te': svg(
        '<circle class="s-l" cx="66" cy="62" r="26" style="fill:var(--carta)"/><path class="s-l" d="M66 88 L66 120 M52 120 H80"/><circle class="s-p" cx="66" cy="62" r="10"/>'
        '<rect class="s-l" x="150" y="18" width="150" height="112" rx="8" style="fill:var(--carta)"/>'
        '<rect class="s-p" x="164" y="32" width="56" height="10" rx="3"/><path class="s-l" d="M164 54 H286 M164 64 H252"/>'
        '<rect class="s-l" x="164" y="78" width="56" height="38" rx="4"/><rect class="s-l" x="230" y="78" width="56" height="38" rx="4"/><path class="s-l" d="M172 90 H210 M172 100 H200 M238 90 H276 M238 100 H262"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C38 110 40 100 44 92 M92 62 C110 62 124 50 150 48 M258 116 C258 124 254 130 248 134"/>',
        'Un segnaposto sul Comune e una scheda che si riempie di riquadri: quello che vale per te', '0 0 320 140'),
    'raccolta': svg(
        '<path class="s-l" d="M36 50 H84 M40 50 L44 126 H76 L80 50 M52 42 H68 V50" style="fill:var(--carta)"/><path class="s-l" d="M52 64 V112 M68 64 V112"/>'
        '<path class="s-l" d="M98 58 H146 M102 58 L106 126 H138 L142 58 M114 50 H130 V58" style="fill:var(--carta)"/><circle class="s-p" cx="122" cy="92" r="12"/>'
        '<path class="s-l" d="M160 66 H208 M164 66 L168 126 H200 L204 66 M176 58 H192 V66" style="fill:var(--carta)"/><path class="s-l" d="M176 84 L192 108 M192 84 L176 108"/>'
        '<rect class="s-l" x="226" y="30" width="72" height="80" rx="6" style="fill:var(--carta)"/><path class="s-l" d="M226 50 H298 M244 22 V36 M280 22 V36 M238 64 H248 M256 64 H266 M274 64 H284 M238 80 H248 M256 80 H266 M238 96 H248"/>'
        '<circle class="s-l" cx="279" cy="80" r="9"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C34 112 36 106 40 100 M80 90 C88 90 94 92 102 92 M142 92 C150 92 156 94 166 94 M204 96 C216 96 230 90 240 84 C252 78 262 76 270 78"/>',
        'Tre bidoni della raccolta differenziata e un calendario con un giorno cerchiato: chi raccoglie i rifiuti e quando', '0 0 320 140'),
    'truffe': svg(
        '<rect class="s-l" x="56" y="16" width="70" height="116" rx="10" style="fill:var(--carta)"/><path class="s-l" d="M82 122 H100"/>'
        '<path class="s-l" d="M66 36 H116 V70 H80 L72 78 V70 H66 Z" style="fill:var(--carta)"/><path class="s-p" d="M72 46 H110 V52 H72 Z"/><path class="s-l" d="M72 60 H100"/>'
        '<path class="s-l" d="M170 10 V60 C170 78 196 78 196 60 V54"/><path class="s-l" d="M196 54 L190 62 M196 54 L202 62"/>'
        '<circle class="s-l" cx="256" cy="80" r="26" style="fill:var(--carta);fill-opacity:.85"/><path class="s-l" d="M274 98 L298 122"/><path class="s-t" d="M244 80 H268"/>'
        f'{NODO(24, 120, 5)}<path class="s-t" d="M30 118 C40 110 48 104 56 100 M126 54 C150 60 156 70 170 66 M206 80 C218 80 222 80 230 80"/>',
        'Un telefono con un messaggio, un amo da pesca e una lente che esamina il link: riconoscere le truffe', '0 0 320 140'),

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
]


def inserisci(testo, ancora, nome):
    blocco = f'<!--scena:{nome}--><div class="scena scena-{nome}">{SCENE[nome]}</div><!--/scena-->'
    gia = re.compile(rf'<!--scena:{re.escape(nome)}-->.*?<!--/scena-->', re.S)
    if gia.search(testo):
        return gia.sub(lambda m: blocco, testo, count=1)
    if ancora not in testo:
        raise SystemExit(f'ancora non trovata per {nome}: {ancora[:60]}')
    return testo.replace(ancora, ancora + blocco, 1)


STRUMENTI = ['assistente', 'mi-spetta', 'faccio-ricorso', 'chiedo-gli-atti', 'mi-rimborsano', 'bilancio-comune', 'appalti', 'navigatore', 'segnalazioni', 'reclami-pa', 'raccolte-firme', 'garanzia', 'liste-attesa', 'truffe', 'raccolta', 'per-te', 'progetti-comune', 'bollette', 'imu', 'eletti', 'disdette', 'affitto', 'condominio', 'pensione', 'tasse']

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
    ('mondo/atlante.html', '  <h1>Atlante degli strumenti civici</h1>', 'mondo', '--accento:var(--accent);--accento-tenue:var(--accent-soft);--carta:var(--paper);--riga-tenue:var(--panel);--inchiostro-2:var(--ink-2);--inchiostro:var(--ink)'),
    ('catalogo/sorgente.html', '  <h1>Il Polpo civico</h1>', 'eroe', '--accento:var(--filo);--accento-tenue:color-mix(in srgb,var(--filo) 16%,transparent);--carta:var(--paper);--riga-tenue:var(--paper-2);--inchiostro-2:var(--ink-2);--inchiostro:var(--ink)'),
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
    s = pagine.setdefault(p, open(p, encoding='utf-8').read())
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
    # il Polpo civico: occhialini, quattro braccia e il braccio rosso che disegna il labirinto
    'assistente': ('Polpo', _logo('<g transform="translate(6.5 4) scale(0.8)"><path class="lg-i" d="M15 35 C12 12 52 12 49 35 M15 35 C11 40 5 41 3 48 M21 38 C19 47 13 51 11 59 M29 39 C29 49 25 55 21 64 M37 39 C38 46 37 50 34 56" style="stroke-width:4.4"/><circle class="lg-i" cx="26" cy="28" r="4.2"/><circle class="lg-i" cx="38" cy="28" r="4.2"/><path class="lg-i" d="M30.2 28 H33.8"/></g>', 'M45.7 32 C50.5 35.2 52.9 38.4 52.9 43.2 V56.8 H39.3 V48 H48.1 V52.8', (43.3, 52.8))),
    'navigatore': ('Navigatore dei servizi', _logo('<path class="lg-i" d="M32 52 V12 M24 52 H40 M32 16 H45 L50 21 L45 26 H32 M32 31 H19 L14 36 L19 41 H32"/>', 'M14 52 C20 49 24 47 32 47', (11, 53))),
    'mi-spetta': ('Mi spetta', _logo('<ellipse class="lg-i" cx="28" cy="44" rx="13" ry="5"/><path class="lg-i" d="M15 44 V36 M41 44 V36"/><ellipse class="lg-i" cx="28" cy="36" rx="13" ry="5"/><path class="lg-i" d="M15 36 V28 M41 36 V28"/><ellipse class="lg-i" cx="28" cy="28" rx="13" ry="5"/>', 'M14 53 C30 54 40 44 42 34 M38 18 L43 23 L52 12', (11, 52))),
    'faccio-ricorso': ('Faccio ricorso?', _logo('<path class="lg-i" d="M18 13 H38 L46 21 V51 H18 Z M38 13 V21 H46"/><path class="lg-i" d="M24 30 H40 M24 37 H36"/>', 'M52 46 H31 C25 46 25 40 31 40 H35 M33 37 L36 40 L33 43', (52, 52))),
    'chiedo-gli-atti': ('Chiedo gli atti', _logo('<path class="lg-i" d="M14 27 L32 15 L50 27 Z M18 31 V47 M26 31 V47 M38 31 V47 M46 31 V47 M14 51 H50"/>', 'M12 41 C20 41 26 37 32 37 V47', (9, 41))),
    'mi-rimborsano': ('Mi rimborsano?', _logo('<path class="lg-i" d="M30 36 H50 V50 H30 Z M30 41 H50"/>', 'M14 44 C13 22 40 14 42 28 M38 24 L42 29 L46 24', (13, 49))),
    'reclami-pa': ('Reclami alla PA', _logo('<path class="lg-i" d="M14 44 H50 M17 44 C17 30 47 30 47 44 M32 30 V25 M28 25 H36"/><path class="lg-i" d="M12 50 H52"/>', 'M14 22 C22 14 34 14 42 20 M38 16 L42 20 L38 24', (11, 26))),
    'segnalazioni': ('Segnalazioni urbane', _logo('<path class="lg-i" d="M32 50 C22 38 18 32 18 25 A14 14 0 0 1 46 25 C46 32 42 38 32 50 Z"/><path class="lg-i" d="M32 18 V27"/><circle class="lg-n" cx="32" cy="32" r="2.2"/>', 'M12 52 C18 52 22 50 26 46', (9, 53))),
    'bilancio-comune': ('Il bilancio del mio Comune', _logo('<path class="lg-i" d="M13 50 H51 M19 50 V36 M28 50 V28 M37 50 V33 M46 50 V22"/>', 'M14 30 C20 24 24 18 28 20 S36 28 40 22 L49 14', (12, 33))),
    'appalti': ('Red flag sugli appalti', _logo('<path class="lg-i" d="M20 52 V12"/>', 'M21 14 H47 L41 21 L47 28 H21 M14 52 H20', (12, 52))),
    'raccolte-firme': ('Raccolte firme in corso', _logo('<path class="lg-i" d="M17 12 H41 L47 18 V52 H17 Z M41 12 V18 H47 M23 24 H39 M23 31 H35"/>', 'M12 50 C18 50 20 42 25 42 S30 48 34 44 S40 38 44 42 L52 34', (9, 50))),
    'garanzia': ('Si è rotto o ci ho ripensato', _logo('<path class="lg-i" d="M20 12 H44 V52 L40 48 L36 52 L32 48 L28 52 L24 48 L20 52 Z M26 22 H38 M26 30 H38"/>', 'M10 40 C10 28 18 22 26 38 M22 36 L26 39 L29 34', (9, 44))),
    'liste-attesa': ('La visita nei tempi', _logo('<path class="lg-i" d="M14 18 H50 V52 H14 Z M14 28 H50 M24 12 V22 M40 12 V22"/>', 'M10 53 C20 53 24 46 28 40 L34 34', (8, 53))),
    'raccolta': ('Chi raccoglie i rifiuti?', _logo('<path class="lg-i" d="M17 22 H47 M21 22 L24 52 H40 L43 22 M27 15 H37 V22 M29 30 V44 M35 30 V44"/>', 'M8 52 C14 52 16 46 20 42', (8, 52))),
    'truffe': ('È una truffa?', _logo('<path class="lg-i" d="M16 10 H38 V54 H16 Z M23 48 H31"/>', 'M48 8 V30 C48 40 36 40 36 31 V28', (48, 8))),
    'mcp': ('Server MCP', _logo('<path class="lg-i" d="M22 20 V12 M34 20 V12 M17 20 H39 V30 C39 38 34 42 28 42 C22 42 17 38 17 30 Z M28 42 V48"/>', 'M28 48 C28 54 38 54 44 48 S50 38 52 34', (52, 31))),
}
LOGHI['per-te'] = ('Per te', LOGHI['assistente'][1])
for _n, _t, _da in [('progetti-comune', 'I fondi europei nel mio Comune', 'bilancio-comune'), ('bollette', 'Quanto risparmi in bolletta?', 'mi-rimborsano'),
                    ('imu', 'Quanto pago di IMU?', 'bilancio-comune'), ('eletti', 'Chi ti rappresenta', 'raccolte-firme'), ('disdette', 'Disdici un abbonamento', 'garanzia'),
                    ('affitto', 'Affitto: i tuoi diritti', 'reclami-pa'), ('condominio', 'Condominio: i tuoi diritti', 'reclami-pa'), ('pensione', 'Quando vado in pensione?', 'mi-spetta'),
                    ('tasse', 'Dove finiscono le mie tasse', 'bilancio-comune')]:
    LOGHI[_n] = (_t, LOGHI[_da][1])  # il logo vero degli strumenti è il Polpo con il suo braccio (braccia-strumenti.py)

STILE_LOGO = ('.lg-f{fill:var(--carta,#FFFDF8);stroke:var(--inchiostro,#17202E);stroke-width:2.4}'
              '.lg-i{fill:none;stroke:var(--inchiostro,#17202E);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}'
              '.lg-t{fill:none;stroke:var(--accento,#C2362B);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}'
              '.lg-n{fill:var(--accento,#C2362B)}')


def logo_svg(nome, classe='logo-strumento', titolo=True):
    etichetta, corpo = LOGHI[nome]
    return f'<svg class="{classe}" viewBox="0 0 64 64" role="img" aria-label="Logo {'del Polpo' if etichetta == 'Polpo' else 'dello ' + etichetta[3:] if etichetta.startswith('Lo ') else 'di ' + etichetta}">{corpo}</svg>'


def favicon(nome):
    """Versione autonoma per la scheda del browser: colori fissi, niente variabili."""
    _, corpo = LOGHI[nome]
    stile = STILE_LOGO.replace('var(--carta,#FFFDF8)', '#FFFDF8').replace('var(--inchiostro,#17202E)', '#17202E').replace('var(--accento,#C2362B)', '#C2362B')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>{stile}</style>{corpo}</svg>\n'


def applica_loghi():
    nomi_h1 = {'assistente': 'Chiedi al Polpo', 'navigatore': 'Navigatore dei servizi', 'mi-spetta': 'Mi spetta', 'faccio-ricorso': 'Faccio ricorso?',
               'chiedo-gli-atti': 'Chiedo gli atti', 'mi-rimborsano': 'Mi rimborsano?', 'reclami-pa': 'Reclami alla PA', 'segnalazioni': 'Segnalazioni urbane',
               'bilancio-comune': 'Il bilancio del mio Comune', 'appalti': 'Red flag sugli appalti', 'raccolte-firme': 'Raccolte firme in corso', 'garanzia': 'Si è rotto o ci ho ripensato', 'liste-attesa': 'La visita nei tempi', 'truffe': 'È una truffa?', 'raccolta': 'Chi raccoglie i rifiuti?', 'per-te': 'Per te', 'progetti-comune': 'I fondi europei nel mio Comune', 'bollette': 'Quanto risparmi in bolletta?', 'imu': 'Quanto pago di IMU?', 'eletti': 'Chi ti rappresenta', 'disdette': 'Disdici un abbonamento', 'affitto': 'Affitto: i tuoi diritti', 'condominio': 'Condominio: i tuoi diritti', 'pensione': 'Quando vado in pensione?', 'tasse': 'Dove finiscono le mie tasse'}
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
    # negli strumenti il logo è il Polpo con il braccio dello strumento (scripts/braccia-strumenti.py)
    import runpy
    runpy.run_path(os.path.join(REPO, 'scripts', 'braccia-strumenti.py'), run_name='__main__')
    # home: il logo dentro la scena di ogni scheda
    p = os.path.join(REPO, 'index.html')
    s = open(p, encoding='utf-8').read()
    for t in list(nomi_h1):
        s = re.sub(rf'(<!--scena:{re.escape(t)}--><div class="scena scena-{re.escape(t)}">)(?:<!--logo-->.*?<!--/logo-->)?', lambda m, t=t: m.group(1) + f'<!--logo-->{logo_svg(t, "logo-scheda")}<!--/logo-->', s, count=1, flags=re.S)
    open(p, 'w', encoding='utf-8').write(s)



if __name__ == '__main__':
    main()
    applica_loghi()
