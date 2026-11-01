#!/usr/bin/env python3
"""Immagini leggere: da ogni illustrazione JPEG fa le versioni WebP in più larghezze, così il telefono
scarica la più piccola che gli basta (srcset) e il computer quella grande.

  <strumento>/web/foto.jpg        → foto-480.webp, foto-800.webp, foto-1024.webp, foto-1344.webp
  alberi/web/edizioni/*.jpg        → stesso nome .webp, larga al massimo 800

Il JPEG resta come riserva per i browser che non leggono WebP. Si può rilanciare: rifà solo le
versioni più vecchie del JPEG. Poi scripts/cornice-foto.py scrive i tag <picture>.
Serve cwebp (brew install webp).

Uso: python3 -I scripts/immagini-leggere.py
"""
import glob
import os
import shutil
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LARGHEZZE = (480, 800, 1024, 1344)
QUALITA = '72'


def webp(origine, destinazione, larghezza):
    if os.path.exists(destinazione) and os.path.getmtime(destinazione) >= os.path.getmtime(origine):
        return False
    subprocess.run(['cwebp', '-quiet', '-q', QUALITA, '-m', '6', '-sharp_yuv', '-metadata', 'none',
                    '-resize', str(larghezza), '0', origine, '-o', destinazione], check=True)
    return True


def main():
    if not shutil.which('cwebp'):
        sys.exit('manca cwebp: brew install webp')
    fatti = prima = dopo = 0
    for jpg in sorted(glob.glob(os.path.join(REPO, '*', 'web', 'foto.jpg'))):
        prima += os.path.getsize(jpg)
        for w in LARGHEZZE:
            out = jpg.replace('foto.jpg', f'foto-{w}.webp')
            fatti += webp(jpg, out, w)
        dopo += os.path.getsize(jpg.replace('foto.jpg', 'foto-800.webp'))
    for jpg in sorted(glob.glob(os.path.join(REPO, 'alberi', 'web', 'edizioni', '*.jpg'))):
        fatti += webp(jpg, jpg[:-4] + '.webp', 800)
    print(f'{fatti} immagini WebP scritte; illustrazioni: {prima // 1024} KB in JPEG, {dopo // 1024} KB nella misura per telefono')


if __name__ == '__main__':
    main()
