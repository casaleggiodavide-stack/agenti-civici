"""Cornice comune delle fotografie: rifà ogni blocco <!--foto-->…<!--/foto--> con lo stesso
taglio, la stessa luce, l'angolo rosso del marchio e la firma «Polpo civico · <sezione>».
Le regole CSS sono in comune/stile.css (.foto-ac). Si può rilanciare: è idempotente.
Uso: python3 -I scripts/cornice-foto.py
"""
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MARCHIO = ('<svg class="segno-marchio" viewBox="0 0 64 70" aria-hidden="true"><path d="M15 35 C12 12 52 12 49 35 M15 35 C11 40 5 41 3 48 M21 38 C19 47 13 51 11 59 M29 39 C29 49 25 55 21 64 M37 39 C38 46 37 50 34 56" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round"/><circle cx="26" cy="28" r="4.2" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="38" cy="28" r="4.2" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M30.2 28 H33.8" stroke="currentColor" stroke-width="2.4"/><circle cx="26" cy="28.5" r="1.4" fill="currentColor"/><circle cx="38" cy="28.5" r="1.4" fill="currentColor"/><path class="m-filo" d="M49 35 C55 39 58 43 58 49 V66 H41 V55 H52 V61 H46" fill="none" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/><circle class="m-nodo" cx="46" cy="61" r="3.6"/></svg>')

NOMI = {
    'assistente': 'In conversazione', 'navigatore': 'Navigatore dei servizi', 'mi-spetta': 'Mi spetta',
    'faccio-ricorso': 'Faccio ricorso?', 'chiedo-gli-atti': 'Chiedo gli atti', 'mi-rimborsano': 'Mi rimborsano?',
    'bilancio-comune': 'Il bilancio del Comune', 'appalti': 'Red flag appalti', 'segnalazioni': 'Segnalazioni urbane',
    'reclami-pa': 'Reclami alla PA', 'raccolte-firme': 'Raccolte firme', 'alberi': 'Alberi per il futuro',
    'garanzia': 'Garanzia e recesso', 'liste-attesa': 'La visita nei tempi', 'truffe': 'È una truffa?',
}
# home: la firma dice la sezione
HOME = {'piazza.jpg': None, 'cucina.jpg': 'Meno burocrazia', 'assemblea.jpg': 'Più partecipazione'}
# dove inquadrare ogni foto (verticale), se diverso dal centro-alto
FUOCO = {'alberi': 'center 58%'}


def cornice(blocco, firma, classe_extra='', fuoco=None):
    img = re.search(r'<img [^>]*>', blocco).group(0)
    img = re.sub(r'\sstyle="[^"]*"', '', img)
    if fuoco:
        img = img.replace('<img ', f'<img style="object-position:{fuoco}" ', 1)
    didascalia = re.search(r'<figcaption>.*?</figcaption>', blocco, re.S)
    didascalia = didascalia.group(0) if didascalia else '<figcaption>Fotografia illustrativa generata con intelligenza artificiale.</figcaption>'
    marca = f'<span class="foto-ac-marca">{MARCHIO}Polpo civico{f" <span>· {firma}</span>" if firma else ""}</span>'
    classi = ' '.join(c for c in ['foto-ac', classe_extra] if c)
    return f'<!--foto--><figure class="{classi}"><div class="foto-ac-quadro">{img}{marca}</div>{didascalia}</figure><!--/foto-->'


def classe_vecchia(blocco):
    m = re.search(r'<figure class="([^"]*)"', blocco)
    return m.group(1) if m else ''


def main():
    toccati = 0
    for t, nome in NOMI.items():
        p = os.path.join(REPO, t, 'index.html')
        s = open(p, encoding='utf-8').read()
        n = 0

        def rifai(m):
            nonlocal n
            n += 1
            return cornice(m.group(0), nome, 'foto-testata', FUOCO.get(t))
        s = re.sub(r'<!--foto-->.*?<!--/foto-->', rifai, s, flags=re.S)
        # le vecchie regole locali della foto: ora vale la cornice comune
        s = re.sub(r'\n  \.foto-testata \{[^\n]*\n', '\n', s)
        s = re.sub(r'\n  @media \(max-width: 560px\) \{ \.foto-testata img \{[^\n]*\n', '\n', s)
        s = re.sub(r'\n  figcaption \{ font-size: 11\.5px;[^\n]*\n', '\n', s)
        if n:
            toccati += n
            open(p, 'w', encoding='utf-8').write(s)
    p = os.path.join(REPO, 'index.html')
    s = open(p, encoding='utf-8').read()

    def rifai_home(m):
        nonlocal toccati
        blocco = m.group(0)
        file = re.search(r'comune/foto/([\w-]+\.jpg)', blocco).group(1)
        vecchia = classe_vecchia(blocco).replace('foto-ac', '').replace('ac-lato', '').split()
        toccati += 1
        return cornice(blocco, HOME.get(file), ' '.join([c for c in vecchia if c] + ([] if file == 'piazza.jpg' else ['ac-lato'])))
    s = re.sub(r'<!--foto-->.*?<!--/foto-->', rifai_home, s, flags=re.S)
    # niente più trattino rosso a parte: l'angolo rosso è nella cornice
    s = re.sub(r'\n  \.foto-eroe::after, \.foto-pilastro::after \{[^\n]*\n', '\n', s)
    s = s.replace('.foto-eroe img, .foto-pilastro img, .foto-testata img { display: block; width: 100%; height: auto; border-radius: 10px; box-shadow: 0 14px 34px -18px rgba(23, 32, 46, .45); }', '.foto-eroe, .foto-pilastro { margin: 0; }')
    s = s.replace('<div class="scena scena-alberi">', '<div class="scena scena-alberi foto-ac-mini">')
    open(p, 'w', encoding='utf-8').write(s)
    print(toccati, 'fotografie con la cornice')


if __name__ == '__main__':
    main()
