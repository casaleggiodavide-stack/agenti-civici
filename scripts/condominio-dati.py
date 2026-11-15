#!/usr/bin/env python3
"""Condominio: i tuoi diritti. Dalle fonti verificate (condominio/dati/fonti.json) al modulo
condominio/src/dati/fonti.js che usano le regole nel browser e nei test.

Uso: python3 -I scripts/condominio-dati.py

Le norme sono state lette a mano su Normattiva il giorno indicato in «verificato_il»
(testi copiati in ~/dati-civici/condominio/norme/, fuori dal repository). Quando cambia una
norma si aggiorna fonti.json e si rilancia questo script: nessun'altra fonte viene letta.
"""
import json, os, sys
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(REPO, 'condominio', 'dati', 'fonti.json'), encoding='utf-8'))
CAMPI = ('testo', 'giorni', 'mesi', 'anni', 'millesimi', 'teste', 'frazione_uso', 'norma')
regole = {r['id']: {k: r[k] for k in CAMPI if k in r} for r in d['regole']}
errori = [f"{t['id']}: fonte {f} mancante" for t in d['tipi_delibera'] for f in t['fonti'] if f not in regole]
errori += [f"{i}: norma senza url" for i, r in regole.items() if not (r.get('norma') or {}).get('url')]
if errori:
    sys.exit('\n'.join(errori))
dati = {'verificato': d['verificato_il'], 'regole': regole, 'tipi': d['tipi_delibera']}
out = ('// Fonti verificate per «Condominio: i tuoi diritti». File generato da\n'
       '// scripts/condominio-dati.py da condominio/dati/fonti.json: non modificarlo a mano.\n\n'
       f'export default {json.dumps(dati, ensure_ascii=False, indent=1)};\n')
os.makedirs(os.path.join(REPO, 'condominio', 'src', 'dati'), exist_ok=True)
open(os.path.join(REPO, 'condominio', 'src', 'dati', 'fonti.js'), 'w', encoding='utf-8').write(out)
print(len(regole), 'regole,', len(dati['tipi']), 'tipi di delibera')
