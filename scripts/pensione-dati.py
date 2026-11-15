#!/usr/bin/env python3
"""Quando vado in pensione?: dalle fonti verificate (pensione/dati/fonti.json) al modulo
pensione/src/dati/fonti.js che le regole importano nel browser.

Uso: python3 -I scripts/pensione-dati.py

Non scarica niente: le norme e le circolari sono state lette a mano il giorno indicato in
«verificato_il» (Normattiva, Gazzetta Ufficiale, INPS; robots.txt rispettati, vedi «nota»).
Copie di lavoro dei testi letti in ~/dati-civici/pensione/ (fuori dal repository).
Quando esce una norma nuova (legge di bilancio 2027, decreto sulla speranza di vita dal 2029)
si aggiorna fonti.json e si rilancia questo script.
"""
import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(REPO, 'pensione', 'dati', 'fonti.json'), encoding='utf-8'))
for chiave, f in d['fonti'].items():
    assert f['url'].startswith('https://'), chiave
    assert f.get('verificato_il'), chiave
dati = {
    'verificato': d['verificato_il'],
    'fonti': {k: {'titolo': f['titolo'], 'url': f['url']} for k, f in d['fonti'].items()},
    'valori': d['valori'],
    'requisiti': d['requisiti'],
}
out = ('// Fonti verificate per «Quando vado in pensione?». File generato da\n'
       '// scripts/pensione-dati.py da pensione/dati/fonti.json: non modificarlo a mano.\n\n'
       f'export default {json.dumps(dati, ensure_ascii=False, indent=1)};\n')
open(os.path.join(REPO, 'pensione', 'src', 'dati', 'fonti.js'), 'w', encoding='utf-8').write(out)
print(len(dati['fonti']), 'fonti,', len(dati['requisiti']), 'tabelle di requisiti')
