#!/usr/bin/env python3
"""Icone del browser per tutte le pagine.

Il sito (pagina d'ingresso, storie, catalogo, atlante) usa il marchio del Polpo (comune/marchio.svg);
ogni strumento la testa del Polpo con il distintivo rosso del suo braccio (<strumento>/src/icona.svg,
scritta da questo script: a 16 pixel il Polpo con otto braccia non si legge). Accanto all'SVG servono due PNG:
  icona-32.png   per i browser che non leggono le icone SVG (Safari)
  icona-180.png  per la schermata Home di iPhone e iPad (quadrata, senza trasparenze)
I tag stanno fra <!--icone--> e <!--/icone-->. Si può rilanciare. Serve rsvg-convert (brew install librsvg).

Uso: python3 -I scripts/favicon.py
"""
import importlib.util
import os
import re
import shutil
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONDO = '#17202E'
casa = None


def carica(nome, file):
    spec = importlib.util.spec_from_file_location(nome, os.path.join(REPO, 'scripts', file))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def png(svg, uscita, lato):
    subprocess.run(['rsvg-convert', '-w', str(lato), '-h', str(lato), '-o', uscita], input=svg.encode('utf-8'), check=True)


def quadrato_marchio():
    """Il marchio è 64×70 con l'angolo arrotondato: per l'iPhone lo centro su un quadrato pieno."""
    s = open(os.path.join(REPO, 'comune', 'marchio.svg'), encoding='utf-8').read()
    interno = re.sub(r'^<svg[^>]*>|</svg>\s*$', '', s.strip())
    interno = re.sub(r'<rect [^>]*/>', '', interno, count=1)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-11 -6 86 86"><rect x="-11" y="-6" width="86" height="86" fill="{FONDO}"/>'
            f'{interno}</svg>')


def icona_strumento(k, angoli=True):
    """L'icona piccola dello strumento: la testa del Polpo con gli occhialini e, in basso a destra,
    il distintivo rosso con il segno del suo braccio. A 16 pixel il Polpo con otto braccia non si legge."""
    segno = casa.BRACCIA[k][3] if k is not None else 'M5 6 H19 V15 H11 L7 18.5 V15 H5 Z'  # Chiedi al Polpo: il fumetto
    rx = 'rx="130"' if angoli else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-300 -300 600 600"><rect x="-300" y="-300" width="600" height="600" {rx} fill="{FONDO}"/>'
            '<g transform="translate(-58 -40) scale(2.05)"><path d="M-82 34 C-104 -96 104 -96 82 34 C64 64 -64 64 -82 34 Z" fill="#F5F1E8"/>'
            f'<circle cx="-26" cy="-6" r="22" fill="none" stroke="{FONDO}" stroke-width="8"/><circle cx="26" cy="-6" r="22" fill="none" stroke="{FONDO}" stroke-width="8"/>'
            f'<path d="M-4 -6 H4" stroke="{FONDO}" stroke-width="8"/><circle cx="-26" cy="-4" r="9" fill="{FONDO}"/><circle cx="26" cy="-4" r="9" fill="{FONDO}"/></g>'
            f'<circle cx="150" cy="150" r="128" fill="#F06A55" stroke="{FONDO}" stroke-width="22"/>'
            f'<path transform="translate(70 70) scale(6.67)" d="{segno}" fill="none" stroke="{FONDO}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>')


def senza_angoli(svg):
    """Il logo degli strumenti ha gli angoli arrotondati: per l'iPhone il fondo va pieno (li arrotonda lui)."""
    return re.sub(r'rx="\d+"', 'rx="0"', svg, count=1)


def tag(cartella):
    return (f'<!--icone--><link rel="icon" href="{cartella}icona-32.png" type="image/png" sizes="32x32">\n'
            f'<link rel="icon" href="{cartella}{"icona.svg" if cartella.endswith("src/") else "marchio.svg"}" type="image/svg+xml">\n'
            f'<link rel="apple-touch-icon" href="{cartella}icona-180.png"><!--/icone-->')


def metti(pagina, blocco):
    s = open(pagina, encoding='utf-8').read()
    if '<!--icone-->' in s:
        s = re.sub(r'<!--icone-->.*?<!--/icone-->', lambda m: blocco, s, count=1, flags=re.S)
    else:
        s = re.sub(r'<link rel="icon"[^>]*>\n?', '', s)  # le icone vecchie, compresa quella in data: dell'atlante
        s = s.replace('<meta name="viewport" content="width=device-width, initial-scale=1">\n',
                      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' + blocco + '\n', 1)
        assert '<!--icone-->' in s, pagina
    open(pagina, 'w', encoding='utf-8').write(s)


def main():
    if not shutil.which('rsvg-convert'):
        sys.exit('manca rsvg-convert: brew install librsvg')
    global casa
    casa = carica('casa', 'casa-polpo.py')
    braccia = carica('braccia', 'braccia-strumenti.py')

    # il sito
    marchio = open(os.path.join(REPO, 'comune', 'marchio.svg'), encoding='utf-8').read()
    png(marchio, os.path.join(REPO, 'comune', 'icona-32.png'), 32)
    png(quadrato_marchio(), os.path.join(REPO, 'comune', 'icona-180.png'), 180)
    for pagina, cartella in (('index.html', 'comune/'), ('storie/index.html', '../comune/'),
                             ('catalogo/index.html', '../comune/'), ('mondo/index.html', '../comune/')):
        metti(os.path.join(REPO, pagina), tag(cartella))

    # gli strumenti
    n = 0
    for t in sorted(set(braccia.DI) | {'assistente'}):
        k = braccia.DI.get(t)
        svg = icona_strumento(k)
        with open(os.path.join(REPO, t, 'src', 'icona.svg'), 'w', encoding='utf-8') as f:
            f.write(svg + '\n')
        png(svg, os.path.join(REPO, t, 'src', 'icona-32.png'), 32)
        png(icona_strumento(k, angoli=False), os.path.join(REPO, t, 'src', 'icona-180.png'), 180)
        metti(os.path.join(REPO, t, 'index.html'), tag('src/'))
        n += 1
    print(f'icone scritte: sito e {n} strumenti')


if __name__ == '__main__':
    main()
