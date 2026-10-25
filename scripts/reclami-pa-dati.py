#!/usr/bin/env python3
"""Reclami alla PA e difensore civico: dalle fonti verificate (reclami-pa/dati/fonti.json)
al modulo reclami-pa/src/dati/fonti.js. Uso: python3 -I scripts/reclami-pa-dati.py
"""
import json, os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(REPO, 'reclami-pa', 'dati', 'fonti.json'), encoding='utf-8'))
ALIAS = {'Friuli Venezia Giulia': 'Friuli-Venezia Giulia', 'Provincia autonoma di Bolzano': 'Bolzano', 'Provincia autonoma di Trento': 'Trento'}
dati = {
    'verificato': d['verificato_il'],
    'regole': {r['id']: {'testo': r['testo'], 'giorni': r.get('termine_giorni'), 'norma': r.get('norma')} for r in d['regole']},
    'difensori': {ALIAS.get(x['regione'], x['regione']): {k: x.get(k) for k in ('regione', 'esiste', 'ufficio', 'titolare', 'url', 'pec', 'email', 'modulo_online', 'sanita', 'comuni', 'note', 'verificato_il')} for x in d['difensori']},
    'garanti': d['altri_garanti'],
}
out = ('// Fonti verificate per «Reclami alla PA e difensore civico». File generato da\n'
       '// scripts/reclami-pa-dati.py da reclami-pa/dati/fonti.json: non modificarlo a mano.\n\n'
       f'export default {json.dumps(dati, ensure_ascii=False, indent=1)};\n')
open(os.path.join(REPO, 'reclami-pa', 'src', 'dati', 'fonti.js'), 'w', encoding='utf-8').write(out)
print(len(dati['regole']), 'regole,', len(dati['difensori']), 'difensori')
