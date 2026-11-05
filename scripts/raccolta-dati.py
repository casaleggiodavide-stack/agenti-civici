#!/usr/bin/env python3
"""I dati di «Chi raccoglie i rifiuti?»: per ogni Comune il gestore della raccolta (ARERA), il suo sito,
il telefono e la pagina del calendario trovata sul sito; la PEC del Comune dall'Indice delle PA.

Prima: python3 -I scripts/raccolta-arera.py e python3 -I scripts/raccolta-siti.py (in ~/dati-civici/raccolta).
Scrive raccolta/src/dati/raccolta.js.
Uso: python3 -I scripts/raccolta-dati.py
"""
import json
import os
import re
import unicodedata
import urllib.parse

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATI = os.path.expanduser('~/dati-civici/raccolta')
REGIONI = {'01': 'Piemonte', '02': "Valle d'Aosta", '03': 'Lombardia', '04': 'Trentino-Alto Adige', '05': 'Veneto', '06': 'Friuli Venezia Giulia',
           '07': 'Liguria', '08': 'Emilia-Romagna', '09': 'Toscana', '10': 'Umbria', '11': 'Marche', '12': 'Lazio', '13': 'Abruzzo', '14': 'Molise',
           '15': 'Campania', '16': 'Puglia', '17': 'Basilicata', '18': 'Calabria', '19': 'Sicilia', '20': 'Sardegna'}


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '').lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', s)).strip()


def telefono(contatti):
    for c in contatti:
        m = re.search(r'(?:numero verde|telefono)\s*:?\s*([+\d][\d ./-]{5,})', c or '', re.I)
        if m:
            return re.sub(r'[\s./-]+', ' ', m.group(1)).strip()
    return ''


SCARTA = re.compile(r'selezion|concors|graduatori|assunzion|bando|gara|avviso-pubblico|/(de|en|fr|sl)/?$|%20|var_http|login|news|notizi|/tag/|trashed|/object/|non[- _.%]*domestic|comunicat|evento|eventi/', re.I)
CHIAVI = re.compile(r'calendar|porta[-_ ]?a[-_ ]?porta|raccolta|differenziat|rifiut|eco[-_]?calendario|quando[-_ ]passa', re.I)


def calendario_buono(c, slug_comuni):
    """Tiene la pagina trovata solo se ha l'aria di essere quella giusta per tutti i Comuni del gestore."""
    url, testo = c['url'], c.get('testo', '')
    parti = urllib.parse.urlsplit(url)
    if c.get('punti', 0) < 5 or '.' not in parti.netloc or SCARTA.search(url) or SCARTA.search(testo):
        return False
    if not CHIAVI.search(f'{testo} {parti.path}'):
        return False
    percorso = norm(urllib.parse.unquote(parti.path))
    if any(f' {sl} ' in f' {percorso} ' for sl in slug_comuni if len(sl) > 3):
        return False  # il calendario di un solo Comune: non vale per gli altri serviti dallo stesso gestore
    return True


def bel_nome(nome):
    """I nomi ARERA sono spesso in maiuscolo: «HERA S.P.A.» → «Hera S.p.A.» (le sigle corte restano maiuscole)."""
    if nome != nome.upper():
        return nome.strip()
    out = []
    for p in nome.split():
        q = p.strip()
        if re.fullmatch(r'S\.?P\.?A\.?|S\.?R\.?L\.?|S\.?C\.?A?\.?R\.?L\.?|S\.?C\.?P\.?A\.?|S\.?N\.?C\.?|S\.?A\.?S\.?', q):
            out.append(q.replace('SPA', 'S.p.A.').replace('S.P.A.', 'S.p.A.').replace('SRL', 'S.r.l.').replace('S.R.L.', 'S.r.l.'))
        elif len(q) <= 4 and q.isalpha() and q not in ('DI', 'DEL', 'DELLA', 'E', 'IL', 'LA', 'DEI', 'DELLE', 'PER', 'AL', 'ALLA'):
            out.append(q)
        else:
            out.append(q.capitalize() if q not in ('DI', 'DEL', 'DELLA', 'E', 'DEI', 'DELLE', 'PER', 'AL', 'ALLA') else q.lower())
    return ' '.join(out)


def main():
    import openpyxl
    arera = json.load(open(os.path.join(DATI, 'arera-comuni.json'), encoding='utf-8'))
    siti = json.load(open(os.path.join(DATI, 'siti.json'), encoding='utf-8')) if os.path.exists(os.path.join(DATI, 'siti.json')) else {}
    wb = openpyxl.load_workbook(os.path.join(DATI, 'operatori-arera.xlsx'), read_only=True)
    righe = wb.active.iter_rows(values_only=True)
    testa = next(righe)
    operatori = {str(d['Partita IVA']): d for d in (dict(zip(testa, r)) for r in righe)}

    s = open(os.path.join(REPO, 'chiedo-gli-atti', 'src', 'dati', 'enti.js'), encoding='utf-8').read()
    ipa = json.loads(s[s.index('{'):s.rindex('}') + 1])
    pec_comuni = {}
    for nome, cat, comune, prov, pec, sito, _ in ipa['enti']:
        if cat == 'L6' and norm(nome).startswith('comune'):
            pec_comuni[(norm(comune), prov)] = (pec, sito)

    gestori, indice_g = [], {}
    comuni_di = {}
    for c in arera['elenco']:
        for o in arera['comuni'].get(c['istat']) or []:
            comuni_di.setdefault(o['piva'], set()).add(norm(c['comune'].replace('_', ' ')))

    def gestore(piva, nome):
        if piva in indice_g:
            return indice_g[piva]
        op = operatori.get(piva, {})
        sito = (op.get('Sito Internet') or '').strip()
        if sito and not sito.startswith('http'):
            sito = 'https://' + sito
        cal = [c for c in (siti.get(piva) or {}).get('candidati') or [] if calendario_buono(c, comuni_di.get(piva, set()))]
        nome_g = bel_nome(op.get('Società') or nome)
        e_comune = norm(nome_g).startswith(('comune ', 'gemeinde ', 'unione ', 'citta di ')) or norm(nome_g).startswith('comunita')
        c0 = cal[0] if cal else None
        e_calendario = 1 if c0 and re.search(r'calendar', f"{c0['url']} {c0.get('testo', '')}", re.I) else 0
        gestori.append([nome_g, piva, sito, telefono([op.get('Contatti Cliente'), op.get('Contatti Cliente2')]), c0['url'] if c0 else '', 1 if e_comune else 0, e_calendario])
        indice_g[piva] = len(gestori) - 1
        return indice_g[piva]

    comuni, senza, senza_pec = [], 0, 0
    for c in arera['elenco']:
        ops = arera['comuni'].get(c['istat'])
        if ops is None:
            continue  # non ancora letto
        idx = [gestore(o['piva'], o['nome']) for o in ops]
        senza += not idx
        nome = c['comune'].replace('_', ' ')
        pec, sito = pec_comuni.get((norm(nome), c['sigla']), ('', ''))
        senza_pec += not pec
        comuni.append([c['istat'], nome, c['sigla'], REGIONI.get(c['regione'], ''), idx, pec, sito])
    comuni.sort(key=lambda x: norm(x[1]))
    uscita = {
        'aggiornato': arera.get('letto') or '',
        'fonti': {
            'arera': {'titolo': 'ARERA, Ricerca operatori: raccolta e trasporto dei rifiuti urbani (licenza CC BY-SA 4.0)', 'url': 'https://www.arera.it/area-operatori/ricerca-operatori'},
            'ipa': {'titolo': 'Indice dei domicili digitali delle pubbliche amministrazioni (IndicePA, CC BY 4.0)', 'url': 'https://www.indicepa.gov.it/'},
        },
        'comuni': comuni,
        'gestori': gestori,
    }
    os.makedirs(os.path.join(REPO, 'raccolta', 'src', 'dati'), exist_ok=True)
    with open(os.path.join(REPO, 'raccolta', 'src', 'dati', 'raccolta.js'), 'w', encoding='utf-8') as f:
        f.write('// Generato da scripts/raccolta-dati.py: non modificare a mano.\nexport default ' + json.dumps(uscita, ensure_ascii=False, separators=(',', ':')) + ';\n')
    con_cal = sum(1 for g in gestori if g[4])
    print(f'{len(comuni)} Comuni ({senza} senza gestore, {senza_pec} senza PEC), {len(gestori)} gestori ({con_cal} con pagina del calendario)')


if __name__ == '__main__':
    main()
