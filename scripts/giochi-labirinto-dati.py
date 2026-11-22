#!/usr/bin/env python3
"""Il filo del labirinto: prepara giochi/labirinto/src/percorsi.js dai percorsi scritti a mano.

I percorsi stanno in giochi/labirinto/dati/percorsi/<id>.json: uno per
pratica, ogni bivio con la regola, la norma e il link presi dallo strumento vero del sito (`strumento`)
e il punto del repository da cui vengono (`rif`, file:riga). Lo script controlla il formato e che ogni
link compaia nei file dello strumento (scritto per intero, o composto da un prefisso dello strumento
più il suo pezzo finale, come i link a Normattiva costruiti nel codice), poi scrive il modulo per il
browser nell'ordine di difficoltà.

Uso: python3 -I scripts/giochi-labirinto-dati.py
"""
import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATI = os.path.join(REPO, 'giochi', 'labirinto', 'dati', 'percorsi')
USCITA = os.path.join(REPO, 'giochi', 'labirinto', 'src', 'percorsi.js')

# dal più facile al più difficile: livello 1 (5 bivi, scelte nette), 2 (6 bivi), 3 (8 bivi, termini che cambiano)
ORDINE = ['buca', 'garanzia', 'residenza', 'bonus', 'multa', 'volo', 'disdetta', 'atti', 'visita', 'ferma', 'deposito', 'delibera']
BIVI = {1: (5, 5), 2: (6, 6), 3: (7, 8)}
TIPI = {'ufficio', 'termine', 'lettera', 'documento', 'diritto'}
GIORNI = {5, 10, 15, 30, 60}
LIMITI = {'titolo': 40, 'pratica': 170, 'domanda': 150, 'testo': 75, 'perche': 170, 'spiega': 220}


def testi_strumento(cartella):
    """Tutto il testo dei file dello strumento (senza test e senza la copia dei moduli comuni)."""
    pezzi = []
    for radice, cartelle, file in os.walk(os.path.join(REPO, cartella)):
        cartelle[:] = [c for c in cartelle if c not in ('test', 'comune', 'node_modules')]
        for f in file:
            if f.endswith(('.js', '.json')):
                pezzi.append(open(os.path.join(radice, f), encoding='utf-8').read())
    return '\n'.join(pezzi)


def link_nello_strumento(url, testo):
    if url in testo:
        return True
    # link composti nel codice: const N = 'https://…~art'; … N + '201'  oppure `${C}32004R0261`
    for prefisso in re.findall(r"['\"`](https?://[^'\"`\s]+)['\"`]", testo):
        if url.startswith(prefisso) and len(url) > len(prefisso):
            coda = url[len(prefisso):]
            if re.search(r"['\"`]" + re.escape(coda) + r"['\"`]", testo) or ('}' + coda + '`') in testo or ('}' + coda) in testo:
                return True
    return False


def controlla(p, errori):
    e = lambda m: errori.append(f'{p.get("id")}: {m}')
    if not re.fullmatch(r'[a-z]{1,10}', p['id']):
        e('id non valido')
    if not os.path.isdir(os.path.join(REPO, p['strumento'])):
        e(f'strumento {p["strumento"]} inesistente')
    for k in ('titolo', 'pratica'):
        if len(p[k]) > LIMITI[k]:
            e(f'{k} troppo lungo')
    lo, hi = BIVI[p['livello']]
    if not lo <= len(p['bivi']) <= hi:
        e(f'{len(p["bivi"])} bivi per il livello {p["livello"]}')
    testo = testi_strumento(p['strumento'])
    for i, b in enumerate(p['bivi'], 1):
        if b['tipo'] not in TIPI:
            e(f'bivio {i}: tipo {b["tipo"]}')
        for k in ('domanda', 'spiega'):
            if len(b[k]) > LIMITI[k]:
                e(f'bivio {i}: {k} troppo lungo')
        if not 2 <= len(b['scelte']) <= 3 or sum(1 for s in b['scelte'] if s['giusta']) != 1:
            e(f'bivio {i}: servono 2-3 scelte e una sola giusta')
        for s in b['scelte']:
            if len(s['testo']) > LIMITI['testo']:
                e(f'bivio {i}: scelta troppo lunga')
            if not s['giusta'] and (s.get('giorni') not in GIORNI or not s.get('perche') or len(s['perche']) > LIMITI['perche']):
                e(f'bivio {i}: scelta sbagliata senza giorni o perché')
        if not b['fonte'].get('norma') or not b['fonte'].get('url', '').startswith('https://'):
            e(f'bivio {i}: fonte incompleta')
        elif not link_nello_strumento(b['fonte']['url'], testo):
            e(f'bivio {i}: il link {b["fonte"]["url"]} non è nei file di {p["strumento"]}')
        f, _, riga = b['rif'].rpartition(':')
        if not os.path.isfile(os.path.join(REPO, f)) or not riga.isdigit():
            e(f'bivio {i}: rif {b["rif"]} non trovato')
    tipi = {b['tipo'] for b in p['bivi']}
    if 'termine' not in tipi or not tipi & {'ufficio', 'lettera'}:
        e('servono un bivio sui termini e uno su ufficio o lettera')


def main():
    percorsi, errori = [], []
    for id_ in ORDINE:
        p = json.load(open(os.path.join(DATI, f'{id_}.json'), encoding='utf-8'))
        controlla(p, errori)
        percorsi.append({k: p[k] for k in ('id', 'titolo', 'pratica', 'strumento', 'livello', 'bivi')})
    if errori:
        print('\n'.join(errori), file=sys.stderr)
        sys.exit(1)
    with open(USCITA, 'w', encoding='utf-8') as f:
        f.write('// Generato da scripts/giochi-labirinto-dati.py da giochi/labirinto/dati/percorsi: non modificare a mano.\n'
                '// Ogni bivio: la regola, la norma con l\'articolo e il link dello strumento del sito (strumento), e dove sta nel repository (rif).\n'
                'export default ' + json.dumps(percorsi, ensure_ascii=False, indent=1) + ';\n')
    print(f'percorsi: {len(percorsi)}, bivi: {sum(len(p["bivi"]) for p in percorsi)}')


if __name__ == '__main__':
    main()
