#!/usr/bin/env python3
"""Disdici un abbonamento: dalle fonti verificate (disdette/dati/fonti.json) al modulo
disdette/src/dati/fonti.js che usano le regole nel browser e nel server MCP.

Uso: python3 -I scripts/disdette-dati.py

Non scarica niente: le norme e le delibere sono state lette a mano sui siti ufficiali
(Normattiva, AGCOM, ARERA, IVASS) e annotate in fonti.json con la data di verifica.
Per aggiornare: ricontrolla le fonti, correggi fonti.json, cambia «verificato_il» e rilancia.
"""
import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(REPO, 'disdette', 'dati', 'fonti.json'), encoding='utf-8'))
CAMPI = ('testo', 'giorni', 'mesi', 'data', 'norma', 'piattaforma')
dati = {
    'verificato': d['verificato_il'],
    'regole': {r['id']: {k: r[k] for k in CAMPI if k in r} for r in d['regole']},
}
for r in d['regole']:
    assert r['norma']['url'].startswith('https://'), r['id']
out = ('// Fonti verificate per «Disdici un abbonamento». File generato da\n'
       '// scripts/disdette-dati.py da disdette/dati/fonti.json: non modificarlo a mano.\n\n'
       f'export default {json.dumps(dati, ensure_ascii=False, indent=1)};\n')
os.makedirs(os.path.join(REPO, 'disdette', 'src', 'dati'), exist_ok=True)
open(os.path.join(REPO, 'disdette', 'src', 'dati', 'fonti.js'), 'w', encoding='utf-8').write(out)
print(len(dati['regole']), 'regole, verificate il', dati['verificato'])
