"""Il disegno della pagina d'ingresso: un labirinto in prospettiva (quadrati concentrici che
ruotano e si allontanano verso il centro) e il filo rosso che ne esce, con i nodi.
Scrive comune/labirinto.svg e lo inserisce in index.html tra <!--labirinto--> e <!--/labirinto-->.
Uso: python3 -I scripts/labirinto-3d.py
"""
import math
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 900, 640
CX, CY = 520, 330          # punto di fuga
ANELLI = 16


def anello(k):
    s = 520 * (0.84 ** k)
    a = math.radians(k * 5.5)
    pts = []
    for i in range(4):
        t = a + math.pi / 4 + i * math.pi / 2
        pts.append((CX + s * math.cos(t), CY + s * 0.78 * math.sin(t)))
    return pts


def p(x, y):
    return f'{x:.1f} {y:.1f}'


righe = []
for k in range(ANELLI):
    pts = anello(k)
    alfa = max(0.08, 0.55 - k * 0.03)
    # il labirinto: ogni anello ha un varco in un lato diverso
    lati = []
    for i in range(4):
        a, b = pts[i], pts[(i + 1) % 4]
        if i == k % 4 and k > 1:
            m1 = (a[0] + (b[0] - a[0]) * 0.38, a[1] + (b[1] - a[1]) * 0.38)
            m2 = (a[0] + (b[0] - a[0]) * 0.62, a[1] + (b[1] - a[1]) * 0.62)
            lati.append(f'M{p(*a)} L{p(*m1)} M{p(*m2)} L{p(*b)}')
        else:
            lati.append(f'M{p(*a)} L{p(*b)}')
    righe.append(f'<path d="{" ".join(lati)}" stroke-opacity="{alfa:.2f}"/>')
# i corridoi: linee che uniscono gli angoli di anelli vicini
for i in range(4):
    d = ' '.join(('M' if k == 0 else 'L') + p(*anello(k)[i]) for k in range(ANELLI))
    righe.append(f'<path d="{d}" stroke-opacity=".28"/>')

# il filo: dal centro, attraverso i varchi, fuori verso il basso a sinistra
filo = []
for k in range(ANELLI - 1, -1, -1):
    pts = anello(k)
    i = k % 4
    a, b = pts[i], pts[(i + 1) % 4]
    filo.append((a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5))
filo.append((W + 30, H - 30))
d = f'M{p(*filo[0])} ' + ' '.join(f'L{p(*q)}' for q in filo[1:])

# nodi: alcuni rossi lungo il filo, alcuni chiari sparsi sugli anelli
nodi = []
for j, q in enumerate(filo[:-1]):
    if j % 3 == 0:
        nodi.append(f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="{3 + j * 0.35:.1f}" class="l-nodo"/>')
for k in range(2, ANELLI, 2):
    pts = anello(k)
    q = pts[(k * 3 + 1) % 4]
    nodi.append(f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="{max(2, 7 - k * 0.35):.1f}" class="l-punto"/>')

svg = (f'<svg class="labirinto-3d" viewBox="0 0 {W} {H}" role="img" aria-label="Un labirinto in prospettiva, fatto di corridoi che girano verso il centro; un filo rosso parte dal centro, passa attraverso i varchi e porta fuori" preserveAspectRatio="xMidYMid slice">'
       f'<g class="l-righe" fill="none" stroke="currentColor" stroke-width="1.1">{"".join(righe)}</g>'
       f'<path class="l-filo" d="{d}" fill="none"/>'
       f'<g>{"".join(nodi)}</g></svg>')

open(os.path.join(REPO, 'comune', 'labirinto.svg'), 'w', encoding='utf-8').write(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1) + '\n')
pag = os.path.join(REPO, 'index.html')
s = open(pag, encoding='utf-8').read()
blocco = f'<!--labirinto-->{svg}<!--/labirinto-->'
if '<!--labirinto-->' in s:
    s = re.sub(r'<!--labirinto-->.*?<!--/labirinto-->', lambda m: blocco, s, count=1, flags=re.S)
    open(pag, 'w', encoding='utf-8').write(s)
print(len(svg), 'caratteri')
