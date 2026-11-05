#!/usr/bin/env python3
"""I dati di «Per te»: per ogni Comune la sintesi di quello che sanno gli altri strumenti, in un file per provincia.

Legge i dati già preparati nel repository:
- Il bilancio del mio Comune (bilancio-comune/dati): pagamenti, debito, riscossione, parametri, con le mediane della fascia;
- Red flag sugli appalti (appalti/dati): le tre quote principali con mediana e posizione fra gli enti simili;
- Chi raccoglie i rifiuti? (raccolta/src/dati/raccolta.js): gestore, telefono, pagina del calendario;
- IndicePA (chiedo-gli-atti/src/dati/enti.js): PEC e sito del Comune;
- l'elenco dei Comuni di ARERA (~/dati-civici/raccolta/arera-comuni.json), che li ha tutti.

Scrive per-te/dati/comuni.json (l'elenco per la ricerca) e per-te/dati/p/<sigla>.json.
Uso: python3 -I -B scripts/per-te-dati.py
"""
import json
import os
import re
import unicodedata

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARERA = os.path.expanduser('~/dati-civici/raccolta/arera-comuni.json')
REGIONI = {'01': 'Piemonte', '02': "Valle d'Aosta", '03': 'Lombardia', '04': 'Trentino-Alto Adige', '05': 'Veneto', '06': 'Friuli Venezia Giulia',
           '07': 'Liguria', '08': 'Emilia-Romagna', '09': 'Toscana', '10': 'Umbria', '11': 'Marche', '12': 'Lazio', '13': 'Abruzzo', '14': 'Molise',
           '15': 'Campania', '16': 'Puglia', '17': 'Basilicata', '18': 'Calabria', '19': 'Sicilia', '20': 'Sardegna'}


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def modulo_js(percorso):
    s = open(percorso, encoding='utf-8').read()
    return json.loads(s[s.index('{'):s.rindex('}') + 1])


def tondo(x, n=1):
    return None if x is None else round(x, n)


def main():
    arera = json.load(open(ARERA, encoding='utf-8'))
    elenco = sorted(arera['elenco'], key=lambda c: norm(c['comune']))

    # Bilancio: per codice ISTAT e per nome con la provincia (in Sardegna i codici sono cambiati)
    conf = json.load(open(os.path.join(REPO, 'bilancio-comune', 'dati', 'confronto.json'), encoding='utf-8'))
    bil, bil_nome = {}, {}
    cartella = os.path.join(REPO, 'bilancio-comune', 'dati', 'p')
    for f in os.listdir(cartella):
        for s in json.load(open(os.path.join(cartella, f), encoding='utf-8')).values():
            bil[s['istat']] = s
            bil_nome.setdefault(norm(s['nome']), []).append(s)

    # Appalti: per codice fiscale dell'ente e per ISTAT
    app_cf, app_istat = {}, {}
    cartella = os.path.join(REPO, 'appalti', 'dati', 'p')
    anno_app = json.load(open(os.path.join(REPO, 'appalti', 'dati', 'indice.json'), encoding='utf-8')).get('anno')
    for f in os.listdir(cartella):
        for cf, s in json.load(open(os.path.join(cartella, f), encoding='utf-8')).items():
            app_cf[cf] = s
            if s.get('istat'):
                app_istat[s['istat']] = s

    racc = modulo_js(os.path.join(REPO, 'raccolta', 'src', 'dati', 'raccolta.js'))
    racc_di = {c[0]: c for c in racc['comuni']}

    ipa = modulo_js(os.path.join(REPO, 'chiedo-gli-atti', 'src', 'dati', 'enti.js'))
    pec_comuni = {}
    for nome, cat, comune, prov, pec, sito, _ in ipa['enti']:
        if cat == 'L6' and norm(nome).startswith('comune'):
            pec_comuni[(norm(comune), prov)] = (pec, sito)

    comuni, per_prov, regioni = [], {}, {}
    conti = {'bilancio': 0, 'appalti': 0, 'raccolta': 0, 'pec': 0}
    for c in elenco:
        nome = c['comune'].replace('_', ' ')
        sigla, istat = c['sigla'], c['istat']
        regione = REGIONI.get(c['regione'], '')
        comuni.append([istat, nome, sigla])
        regioni[sigla] = regione
        x = {}

        b = bil.get(istat)
        if not b or norm(b['nome']) != norm(nome):
            cand = bil_nome.get(norm(nome), [])
            b = cand[0] if len(cand) == 1 else next((s for s in cand if s.get('sigla') == sigla), None)
        if b:
            conti['bilancio'] += 1
            fa = conf['fasce'].get(b['fascia'], {})
            pdi = b.get('pdi') or {}
            x['b'] = {
                'anno': b['anno'], 'pop': b.get('pop'), 'fascia': b['fascia'], 'istat': b['istat'],
                'tempestivita': tondo(pdi.get('tempestivita')), 'debito_pc': tondo(pdi.get('debito_pc'), 0),
                'riscossione': tondo(b.get('riscossione')), 'deficitario': bool(b.get('deficitario')),
                'parametri': len(b.get('parametri') or []),
                'med': {'debito_pc': tondo((fa.get('pdi') or {}).get('debito_pc'), 0), 'riscossione': tondo(fa.get('riscossione')),
                        'tempestivita': tondo((fa.get('pdi') or {}).get('tempestivita')), 'comuni': fa.get('comuni')},
            }

        a = (app_cf.get(b['cf']) if b and b.get('cf') else None) or app_istat.get(istat)
        if a and a.get('n'):
            conti['appalti'] += 1
            ind = a.get('ind') or {}
            sel = lambda k, campi: {f: ind[k].get(f) for f in campi if f in ind[k]} if k in ind else None
            x['a'] = {
                'anno': anno_app, 'cf': a['cf'], 'n': a['n'], 'v': a['v'],
                'senza_gara': sel('senza_gara', ['quota', 'quota_n', 'mediana', 'pct', 'n', 'base']),
                'un_offerente': sel('un_offerente', ['quota', 'mediana', 'pct', 'n', 'base']),
                'primo_fornitore': sel('primo_fornitore', ['quota', 'mediana', 'pct', 'fornitori']),
            }

        r = racc_di.get(istat)
        if r:
            gest = [racc['gestori'][i] for i in r[4]]
            if gest:
                conti['raccolta'] += 1
                # [nome, telefono, pagina del calendario, è proprio il calendario, sito]
                x['r'] = [[g[0], g[3], g[4], g[6], g[2]] for g in gest]
        pec, sito = (r[5], r[6]) if r and r[5] else pec_comuni.get((norm(nome), sigla), ('', ''))
        if pec:
            conti['pec'] += 1
            x['pec'] = pec
        if sito:
            x['sito'] = sito if sito.startswith('http') else f'https://{sito}'
        per_prov.setdefault(sigla, {})[istat] = x

    uscita = os.path.join(REPO, 'per-te', 'dati')
    os.makedirs(os.path.join(uscita, 'p'), exist_ok=True)
    fonti = {
        'bilancio': conf.get('fonte', ''), 'bilancio_aggiornato': conf.get('aggiornato', ''),
        'raccolta': racc['fonti']['arera']['titolo'], 'raccolta_aggiornato': racc.get('aggiornato', ''),
        'ipa': 'Indice dei domicili digitali delle pubbliche amministrazioni (IndicePA, CC BY 4.0)',
    }
    with open(os.path.join(uscita, 'comuni.json'), 'w', encoding='utf-8') as f:
        json.dump({'fonti': fonti, 'regioni': regioni, 'comuni': comuni}, f, ensure_ascii=False, separators=(',', ':'))
    for sigla, dati in per_prov.items():
        with open(os.path.join(uscita, 'p', f'{sigla}.json'), 'w', encoding='utf-8') as f:
            json.dump(dati, f, ensure_ascii=False, separators=(',', ':'))
    print(f"{len(comuni)} Comuni in {len(per_prov)} province: bilancio {conti['bilancio']}, appalti {conti['appalti']}, "
          f"rifiuti {conti['raccolta']}, PEC {conti['pec']}")


if __name__ == '__main__':
    main()
