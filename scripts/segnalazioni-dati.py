#!/usr/bin/env python3
"""Segnalazioni urbane: dalle fonti verificate (segnalazioni/dati/fonti.json) al modulo
segnalazioni/src/dati/fonti.js usato dalla pagina e dai test.
Uso: python3 -I scripts/segnalazioni-dati.py
"""
import json, os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(REPO, 'segnalazioni', 'dati', 'fonti.json'), encoding='utf-8'))
strade = d['come_capire_chi_e_competente_strade']
anas = strade['anas']
dati = {
    'verificato': d['verificato_il'],
    'categorie': [{k: c.get(k) for k in ('id', 'nome', 'esempi', 'chi', 'come_capire_chi_e_competente', 'norme', 'urgenza', 'cosa_chiedere', 'note')} for c in d['categorie']],
    'norme': {n['id']: {'titolo': n['titolo'], 'url': n['url'], 'cosa': n.get('cosa_dice')} for n in d['norme']},
    'istanza': d['segnalazione_vs_istanza'],
    'pericolo': d['esposto_e_pericolo'],
    'strade': {'regola': strade['regola']},
    'anas': {k: anas.get(k) for k in ('pronto_anas', 'email', 'pec_servizio_clienti', 'pec_strutture_territoriali_url', 'pagina_ufficiale', 'cerca_strada', 'pec_elencate')},
    'piattaforme': [{k: p.get(k) for k in ('nome', 'url', 'attiva', 'cosa_fa_oggi')} for p in d['piattaforme']],
}
out = ('// Fonti verificate per «Segnalazioni urbane indipendenti». File generato da\n'
       '// scripts/segnalazioni-dati.py da segnalazioni/dati/fonti.json: non modificarlo a mano.\n\n'
       f'export default {json.dumps(dati, ensure_ascii=False, indent=1)};\n')
open(os.path.join(REPO, 'segnalazioni', 'src', 'dati', 'fonti.js'), 'w', encoding='utf-8').write(out)
print(len(dati['categorie']), 'categorie,', len(dati['norme']), 'norme')
