"""Applica l'identità «Il filo per uscire dal labirinto» a sito e strumenti.
Una tantum, ripetibile: ogni sostituzione controlla di non essere già fatta.
Uso: python3 scripts/applica-marca.py
"""
import re
from pathlib import Path

R = Path(__file__).resolve().parent.parent

# ---------- I segni (SVG in linea, colori dai token CSS) ----------
MARCHIO = ('<svg class="segno-marchio" viewBox="0 0 64 70" width="22" height="24" aria-hidden="true">'
           '<path d="M12 52 V12 H52 V52 H22 V22 H42 V42 H32" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
           '<path class="m-filo" d="M17 64 V17 H47 V47 H27 V27 H37 V37" fill="none" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>'
           '<circle class="m-nodo" cx="17" cy="64" r="4"/></svg>')

def icona(corpo, etichetta=None):
    a = f'role="img" aria-label="{etichetta}"' if etichetta else 'aria-hidden="true"'
    return f'<svg class="icona" viewBox="0 0 48 48" width="44" height="44" {a}>{corpo}</svg>'

INK = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'
FILO = 'class="m-filo" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'
ICONE = {
    'assistente': icona(f'<path d="M8 8 H40 V30 H22 L14 38 V30 H8 Z" {INK}/><circle class="m-nodo" cx="15" cy="19" r="2.6"/><path d="M17 19 C21 13 25 25 29 19 S33 16 34 17" {FILO}/>'),
    'mi-spetta': icona(f'<circle cx="28" cy="22" r="13" {INK}/><circle class="m-nodo" cx="7" cy="41" r="2.6"/><path d="M9 39 C15 34 18 30 24 26" {FILO}/>'),
    'faccio-ricorso': icona(f'<path d="M12 5 H28 L34 11 V43 H12 Z" {INK}/><circle class="m-nodo" cx="42" cy="33" r="2.6"/><path d="M40 33 H25 C19 33 19 23 25 23 H31 M28 19 L32 23 L28 27" {FILO}/>'),
    'chiedo-gli-atti': icona(f'<path d="M16 42 V7 H36 V42 M10 42 H42" {INK}/><circle class="m-nodo" cx="5" cy="30" r="2.6"/><path d="M7 30 C14 30 18 24 24 24 H31" {FILO}/>'),
    'mi-rimborsano': icona(f'<path d="M28 32 H43 V42 H28 Z" {INK}/><circle class="m-nodo" cx="9" cy="36" r="2.6"/><path d="M9 33 C9 12 34 8 34 22 C34 28 28 30 22 30 M25 26 L21 30 L25 34" {FILO}/>'),
}

FAVICON = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 70">'
           '<rect x="-3" y="-1" width="70" height="72" rx="16" fill="#17202E"/>'
           '<path d="M12 52 V12 H52 V52 H22 V22 H42 V42 H32" fill="none" stroke="#F5F1E8" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>'
           '<path d="M17 64 V17 H47 V47 H27 V27 H37 V37" fill="none" stroke="#F06A55" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>'
           '<circle cx="17" cy="64" r="4.2" fill="#F06A55"/></svg>\n')

# ---------- Token ----------
CHIARO = {
    '--fondo': '#F5F1E8', '--carta': '#FFFDF8', '--inchiostro': '#17202E', '--inchiostro-2': '#2B3444', '--inchiostro-3': '#5D6270',
    '--riga': '#DED6C4', '--riga-tenue': '#EDE6D6', '--accento': '#C2362B', '--accento-tenue': '#F6E3DF', '--sul-accento': '#FFFFFF',
    '--neutro-tenue': '#EDE6D6',
}
SCURO = {
    '--fondo': '#111824', '--carta': '#17202E', '--inchiostro': '#F5F1E8', '--inchiostro-2': '#C9CED8', '--inchiostro-3': '#9AA1AE',
    '--riga': '#2C3647', '--riga-tenue': '#1E2737', '--accento': '#F06A55', '--accento-tenue': '#3A2026', '--sul-accento': '#111824',
    '--neutro-tenue': '#1E2737',
}

def token(css):
    blocchi = re.split(r'(@media \(prefers-color-scheme: dark\)|:root\[data-theme="dark"\])', css)
    # blocchi[0] è il :root chiaro, poi i blocchi scuri
    def sostituisci(testo, valori):
        for k, v in valori.items():
            testo = re.sub(rf'({re.escape(k)}:\s*)#[0-9A-Fa-f]{{6}}', rf'\g<1>{v}', testo)
        return testo
    out = sostituisci(blocchi[0], CHIARO)
    for i in range(1, len(blocchi), 2):
        out += blocchi[i] + sostituisci(blocchi[i + 1], SCURO)
    return out

MARCA_CSS = '''
/* Identità «Il filo per uscire dal labirinto» (25/10/2026): titoli in Bricolage Grotesque,
   il filo rosso per accenti e collegamenti, il nodo accanto a ogni fonte. */
:root { --titoli: "Bricolage Grotesque", var(--testo); }
h1, h2, .verdetto .titolo, .strumento h2 { font-family: var(--titoli); letter-spacing: -0.02em; }
h1 { font-weight: 800; }
.m-filo { stroke: var(--accento); }
.m-nodo { fill: var(--accento); }
.icona { display: block; color: var(--inchiostro); flex: none; }
.famiglia .marchio { display: inline-flex; align-items: center; gap: 8px; font-family: var(--titoli); font-weight: 800; font-size: 18px; letter-spacing: -0.02em; color: var(--inchiostro); margin-right: 8px; }
.famiglia .marchio .segno-marchio { color: var(--inchiostro); }
.testata .icona { margin-bottom: 10px; }
.btn-primario { background: var(--inchiostro) !important; border-color: var(--inchiostro) !important; color: var(--fondo) !important; }
.fonti a::before { content: ""; display: inline-block; width: 0.55em; height: 0.55em; border-radius: 50%; background: var(--accento); margin-right: 0.45em; vertical-align: 0.05em; }
'''

def stile(path):
    p = R / path
    s = p.read_text()
    s = token(s)
    if '--titoli' not in s:
        s = s.rstrip() + '\n' + MARCA_CSS
    p.write_text(s)

FONT_VECCHIO = 'family=Atkinson+Hyperlegible+Next'
FONT_NUOVO = 'family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Atkinson+Hyperlegible+Next'

def pagina(path, favicon_href, icona_strumento=None):
    p = R / path
    s = p.read_text()
    if 'Bricolage+Grotesque' not in s:
        s = s.replace(FONT_VECCHIO, FONT_NUOVO, 1)
    if 'rel="icon"' not in s:
        s = s.replace('<link rel="preconnect" href="https://fonts.googleapis.com">', f'<link rel="icon" href="{favicon_href}" type="image/svg+xml">\n<link rel="preconnect" href="https://fonts.googleapis.com">', 1)
    s = re.sub(r'<b>Agenti civici</b>', f'<b class="marchio">{MARCHIO}agenti civici</b>', s)
    if icona_strumento and 'class="icona"' not in s:
        s = re.sub(r'(<header class="testata">\s*<div[^>]*>\s*)', lambda m: m.group(1) + ICONE[icona_strumento] + '\n      ', s, count=1)
    p.write_text(s)

def main():
    (R / 'comune/marchio.svg').write_text(FAVICON)
    stile('comune/stile.css')
    stile('mi-spetta/web/stile.css')
    for t in ['mi-spetta', 'faccio-ricorso', 'chiedo-gli-atti', 'mi-rimborsano', 'assistente']:
        pagina(f'{t}/index.html', 'src/comune/marchio.svg', t)
    pagina('index.html', 'comune/marchio.svg')
    print('marca applicata')

main()
