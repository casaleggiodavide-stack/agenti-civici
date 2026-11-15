#!/usr/bin/env python3
"""Dove finiscono le mie tasse: prepara i dati dello strumento in tasse/dati/.

Fonti (tutte lette rispettando robots.txt, anche i divieti rivolti ai soli
agenti di intelligenza artificiale; User-Agent «PolpoCivico/1.0 (strumenti
civici)», una richiesta per volta, almeno un secondo di pausa):

  Eurostat, gov_10a_exp: spesa delle Amministrazioni pubbliche per funzione
    (COFOG), milioni di euro, settore S13. I dati dell'Italia sono quelli che
    l'ISTAT trasmette a Eurostat; la media europea è l'aggregato EU27_2020.
    Licenza CC BY 4.0 (avviso sul riuso di Eurostat).
  Eurostat, gov_10a_main: uscite totali (TE), entrate totali (TR) e
    indebitamento netto (B9) delle Amministrazioni pubbliche.
  Dipartimento delle Finanze (www1.finanze.gov.it, «Elenchi generali»):
    aliquote dell'addizionale comunale all'IRPEF 2026 e 2025 (CSV) e
    dell'addizionale regionale 2026 (CSV). Il sito www.finanze.gov.it risponde
    «Access Denied» anche al robots.txt: non lo usiamo. www1 non ha robots.txt.
  Il bilancio del mio Comune (bilancio-comune/dati/, preparato da
    scripts/bilancio-bdap.py dai rendiconti OpenBDAP): spesa impegnata per
    missione di ogni Comune e mediane per fascia di abitanti. Si legge soltanto.
  Elenco dei Comuni con codice ISTAT e catastale: ~/dati-civici/raccolta/arera-comuni.json.

Scrive in tasse/dati/:
  stato.json      spesa pubblica per funzione (Italia e media UE), deficit,
                  addizionali regionali 2026 con le regole particolari, mediane
                  della spesa comunale per fascia
  comuni.json     elenco per la ricerca: [istat, nome, sigla, regione]
  p/<SIGLA>.json  per ogni Comune della provincia: addizionale comunale e spesa
                  per missione dall'ultimo rendiconto

Uso:
  python3 -I scripts/tasse-dati.py            usa i file già scaricati in ~/dati-civici/tasse/grezzi
  python3 -I scripts/tasse-dati.py --scarica  li riscarica prima (5 richieste)
"""
import csv
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.robotparser
from datetime import date

QUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(QUI)
GREZZI = os.path.expanduser('~/dati-civici/tasse/grezzi')
USCITA = os.path.join(REPO, 'tasse', 'dati')
BILANCIO = os.path.join(REPO, 'bilancio-comune', 'dati')
ELENCO = os.path.expanduser('~/dati-civici/raccolta/arera-comuni.json')
UA = 'PolpoCivico/1.0 (strumenti civici)'
_P_AGENTI = os.path.expanduser('~/dati-civici/agenti-ia.txt')
AGENTI = ['PolpoCivico', '*'] + ([a.strip() for a in open(_P_AGENTI, encoding='utf-8') if a.strip()] if os.path.exists(_P_AGENTI) else [])

EUROSTAT = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data'
FINANZE = 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale'
SCARICHI = {
    'eurostat-gov_10a_exp.json': f'{EUROSTAT}/gov_10a_exp?format=JSON&lang=EN&unit=MIO_EUR&sector=S13&na_item=TE&geo=IT&geo=EU27_2020&sinceTimePeriod=2021',
    'eurostat-gov_10a_main.json': f'{EUROSTAT}/gov_10a_main?format=JSON&lang=EN&unit=MIO_EUR&sector=S13&na_item=TE&na_item=TR&na_item=B9&geo=IT&geo=EU27_2020&sinceTimePeriod=2021',
    'addcom-2026.csv': f'{FINANZE}/nuova_addcomirpef/download/download.php?anno=2026',
    'addcom-2025.csv': f'{FINANZE}/nuova_addcomirpef/download/download.php?anno=2025',
    'addreg-2026.csv': f'{FINANZE}/addregirpef/download/download.php?tipo=reg&anno=2026',
}

# ---------------------------------------------------------------- rete

_ultima = [0.0]
_robots = {}


def _get(url, timeout=120):
    d = time.time() - _ultima[0]
    if d < 1.5:
        time.sleep(1.5 - d)
    _ultima[0] = time.time()
    r = subprocess.run(['curl', '-sS', '-L', '--max-redirs', '5', '-m', str(timeout), '-A', UA, '-o', '-', '-w', '\n%{http_code}', url], capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode()[:200])
    corpo, _, codice = r.stdout.rpartition(b'\n')
    return int(codice or 0), corpo


def permesso(url):
    p = urllib.parse.urlparse(url)
    base = f'{p.scheme}://{p.netloc}'
    if base not in _robots:
        codice, corpo = _get(base + '/robots.txt', 30)
        if codice in (401, 403) or b'Access Denied' in corpo[:600]:
            sys.exit(f'{base}: robots.txt risponde {codice} / Access Denied: mi fermo')
        testo = corpo.decode('utf-8', 'replace') if codice == 200 and b'<html' not in corpo[:500].lower() else ''
        rp = urllib.robotparser.RobotFileParser()
        rp.parse(testo.splitlines())
        _robots[base] = rp
    vietati = [a for a in AGENTI if not _robots[base].can_fetch(a, url)]
    if vietati:
        sys.exit(f'robots.txt vieta {url} a {", ".join(vietati)}: mi fermo')


def scarica():
    os.makedirs(GREZZI, exist_ok=True)
    for nome, url in SCARICHI.items():
        permesso(url)
        codice, corpo = _get(url)
        if codice != 200 or len(corpo) < 1000:
            sys.exit(f'{url}: HTTP {codice}, {len(corpo)} byte')
        open(os.path.join(GREZZI, nome), 'wb').write(corpo)
        print('scaricato', nome, len(corpo), 'byte')
    open(os.path.join(GREZZI, 'letto.txt'), 'w').write(date.today().isoformat())


# ---------------------------------------------------------------- spesa pubblica per funzione

# Le voci mostrate, dalla classificazione COFOG (divisioni e alcuni gruppi).
# Ogni voce: chiave, nome, cosa c'è dentro, codici da sommare, codici da togliere.
VOCI = [
    ('protezione', 'Pensioni e protezione sociale', 'Pensioni di vecchiaia e ai superstiti, invalidità, famiglie, disoccupazione, povertà', ['GF10'], []),
    ('sanita', 'Sanità', 'Ospedali, medici di base e specialisti, farmaci, prevenzione', ['GF07'], []),
    ('servizi', 'Servizi generali', 'Organi di governo, uffici finanziari e fiscali, ricerca di base, aiuti allo sviluppo, servizi comuni', ['GF01'], ['GF0107']),
    ('interessi', 'Interessi sul debito pubblico', 'Interessi pagati su titoli di Stato e prestiti', ['GF0107'], []),
    ('istruzione', 'Istruzione', 'Scuole di ogni grado, università, servizi per gli studenti', ['GF09'], []),
    ('trasporti', 'Trasporti', 'Strade, ferrovie, trasporto pubblico, porti e aeroporti', ['GF0405'], []),
    ('economia', 'Altri interventi per l\'economia', 'Lavoro e imprese, energia, agricoltura, industria, comunicazioni, ricerca applicata', ['GF04'], ['GF0405']),
    ('ordine', 'Ordine pubblico e sicurezza', 'Polizia, vigili del fuoco, tribunali, carceri', ['GF03'], []),
    ('difesa', 'Difesa', 'Forze armate, difesa civile, aiuti militari', ['GF02'], []),
    ('ambiente', 'Ambiente', 'Rifiuti, acque reflue, inquinamento, tutela della natura', ['GF05'], []),
    ('casa', 'Abitazioni e territorio', 'Edilizia abitativa, sviluppo del territorio, acquedotti, illuminazione pubblica', ['GF06'], []),
    ('cultura', 'Cultura, sport e tempo libero', 'Musei, biblioteche, spettacolo, sport, radio e televisione pubbliche', ['GF08'], []),
]
DETTAGLI = {  # sottovoci utili da citare, con il loro nome
    'pensioni': ('di cui pensioni di vecchiaia e ai superstiti', ['GF1002', 'GF1003']),
}


def jsonstat(percorso):
    d = json.load(open(percorso, encoding='utf-8'))
    dims, size = d['id'], d['size']
    idx = {k: d['dimension'][k]['category']['index'] for k in dims}

    def val(**kw):
        pos = 0
        for k, s in zip(dims, size):
            v = kw.get(k)
            if v is None:  # dimensione con un solo valore
                v = next(iter(idx[k]))
            if v not in idx[k]:
                return None
            pos = pos * s + idx[k][v]
        return d['value'].get(str(pos))
    return d, idx, val


def spesa_funzioni():
    d, idx, val = jsonstat(os.path.join(GREZZI, 'eurostat-gov_10a_exp.json'))
    anni = sorted(idx['time'], reverse=True)
    # l'ultimo anno con tutte le funzioni per l'Italia e per la media europea
    anno = next(a for a in anni if all(val(cofog99=c, geo=g, time=a) is not None for g in ('IT', 'EU27_2020') for c in ['TOTAL', 'GF01', 'GF0107', 'GF04', 'GF0405', 'GF10', 'GF1002', 'GF1003']))
    out = {'anno': int(anno), 'aggiornato_eurostat': d.get('updated', '')[:10], 'voci': [], 'paesi': {}}
    for chiave, nome, dentro, piu, meno in VOCI:
        out['voci'].append({'chiave': chiave, 'nome': nome, 'dentro': dentro, 'cofog': piu + ['-' + m for m in meno]})
    for g, sigla in (('IT', 'italia'), ('EU27_2020', 'ue')):
        tot = val(cofog99='TOTAL', geo=g, time=anno)
        mil = {}
        for chiave, _, _, piu, meno in VOCI:
            mil[chiave] = round(sum(val(cofog99=c, geo=g, time=anno) for c in piu) - sum(val(cofog99=c, geo=g, time=anno) for c in meno), 1)
        somma = round(sum(mil.values()), 1)
        assert abs(somma - tot) < 1, f'{g}: le voci ({somma}) non fanno il totale ({tot})'
        det = {k: round(sum(val(cofog99=c, geo=g, time=anno) for c in cc), 1) for k, (_, cc) in DETTAGLI.items()}
        out['paesi'][sigla] = {'totale_milioni': tot, 'milioni': mil, 'dettagli_milioni': det}
    out['dettagli'] = {k: v[0] for k, v in DETTAGLI.items()}

    # entrate, uscite e indebitamento, stesso anno della spesa per funzione
    d2, idx2, val2 = jsonstat(os.path.join(GREZZI, 'eurostat-gov_10a_main.json'))
    out['conti'] = {}
    for g, sigla in (('IT', 'italia'), ('EU27_2020', 'ue')):
        out['conti'][sigla] = {a: {'uscite': val2(na_item='TE', geo=g, time=a), 'entrate': val2(na_item='TR', geo=g, time=a), 'indebitamento': val2(na_item='B9', geo=g, time=a)}
                               for a in idx2['time'] if val2(na_item='TE', geo=g, time=a) is not None}
    out['aggiornato_eurostat_conti'] = d2.get('updated', '')[:10]
    return out


# ---------------------------------------------------------------- addizionale regionale

REGIONI_ISTAT = {
    '01': 'Piemonte', '02': "Valle d'Aosta", '03': 'Lombardia', '05': 'Veneto', '06': 'Friuli Venezia Giulia',
    '07': 'Liguria', '08': 'Emilia-Romagna', '09': 'Toscana', '10': 'Umbria', '11': 'Marche', '12': 'Lazio',
    '13': 'Abruzzo', '14': 'Molise', '15': 'Campania', '16': 'Puglia', '17': 'Basilicata', '18': 'Calabria',
    '19': 'Sicilia', '20': 'Sardegna',
}  # '04' Trentino-Alto Adige: si divide per provincia autonoma

NOME_CSV = {  # come il Dipartimento delle Finanze scrive le regioni
    'REGIONE PIEMONTE': 'Piemonte', "REGIONE VALLE D'AOSTA": "Valle d'Aosta", 'REGIONE LOMBARDIA': 'Lombardia',
    'PROVINCIA AUTONOMA DI BOLZANO': 'Bolzano', 'PROVINCIA AUTONOMA DI TRENTO': 'Trento', 'REGIONE VENETO': 'Veneto',
    'REGIONE FRIULI VENEZIA GIULIA': 'Friuli Venezia Giulia', 'REGIONE LIGURIA': 'Liguria', 'REGIONE EMILIA-ROMAGNA': 'Emilia-Romagna',
    'REGIONE TOSCANA': 'Toscana', 'REGIONE UMBRIA': 'Umbria', 'REGIONE MARCHE': 'Marche', 'REGIONE LAZIO': 'Lazio',
    'REGIONE ABRUZZO': 'Abruzzo', 'REGIONE MOLISE': 'Molise', 'REGIONE CAMPANIA': 'Campania', 'REGIONE PUGLIA': 'Puglia',
    'REGIONE BASILICATA': 'Basilicata', 'REGIONE CALABRIA': 'Calabria', 'REGIONE SICILIA': 'Sicilia', 'REGIONE SARDEGNA': 'Sardegna',
}

# Regole particolari scritte a mano dal testo della «disposizione» pubblicata dal Dipartimento delle Finanze
# per il 2026. «firma» è un pezzo del testo: se la disposizione cambia, lo script si ferma e chiede di rileggerla.
#   esenzione: fino a quella cifra di reddito imponibile non si paga
#   intero_fino: [soglia, aliquota]: fino alla soglia si paga quell'aliquota su tutto il reddito
#   detrazioni: [{da, a, euro}] da togliere dall'addizionale (senza credito se supera l'imposta)
#   lineare: detrazione = euro × (reddito − da) / base, al massimo «max»
#   non_calcolate: agevolazioni legate alla famiglia o alla disabilità, che lo strumento non chiede
SPECIALI = {
    "Valle d'Aosta": {'firma': 'fino a 15.000 euro, sono esentati', 'esenzione': 15000},
    'Umbria': {'firma': 'non trovano applicazione nei confronti dei soggetti con un reddito imponibile complessivo, ai fini dell\'addizionale regionale all\'IRPEF, fino a 28.000,00',
               'intero_fino': [28000, 1.23], 'detrazioni': [{'da': 28000, 'a': 50000, 'euro': 150}]},
    'Friuli Venezia Giulia': {'firma': 'aliquota e\' pari a 1,23 per cento sull\'intero importo', 'intero_fino': [15000, 0.70], 'scaglioni': [[None, 1.23]]},
    'Marche': {'firma': 'figli portatori di handicap', 'non_calcolate': 'aliquota dell\'1,23% fino a 50.000 euro di reddito per chi ha figli a carico con disabilità (legge 104/1992)'},
    'Trento': {'firma': 'spetta una deduzione di euro 30.000,00', 'esenzione': 30000,
               'non_calcolate': 'detrazione di 246 euro per ogni figlio a carico, fino a 50.000 euro di reddito'},
    'Veneto': {'firma': 'Aliquota agevolata pari allo 0.9%', 'non_calcolate': 'aliquota dello 0,9% fino a 50.000 euro di reddito per le persone con disabilità o con un familiare disabile a carico'},
    'Lazio': {'firma': 'non superiore a euro 28.000,00 l\'aliquota', 'intero_fino': [28000, 1.73], 'detrazioni': [{'da': 28000, 'a': 30000, 'euro': 60}]},
    'Puglia': {'firma': 'piu\' di tre figli a carico', 'non_calcolate': 'detrazioni per chi ha più di tre figli a carico o figli con disabilità'},
    'Bolzano': {'firma': 'non superiore a 90.000,00 euro spetta una detrazione d\'imposta di 430,50 euro',
                'detrazioni': [{'da': 0, 'a': 90000, 'euro': 430.5}], 'lineare': {'da': 50000, 'base': 25000, 'euro': 125, 'max': 125},
                'non_calcolate': 'detrazione di 340 euro per ogni figlio a carico, fino a 90.000 euro di reddito'},
    'Sardegna': {'firma': 'figli minorenni fiscalmente a carico', 'non_calcolate': 'detrazione di 200 euro per ogni figlio minorenne a carico, fino a 50.000 euro di reddito'},
    'Piemonte': {'firma': 'piu\' di due figli a carico', 'non_calcolate': 'detrazioni per chi ha più di due figli a carico o figli con disabilità'},
    'Campania': {'firma': 'almeno due figli fiscalmente a carico', 'non_calcolate': 'detrazioni per chi ha almeno due figli a carico o figli con disabilità, fino a 28.000 euro di reddito'},
}


def num_it(t):
    t = t.strip().replace('€', '').replace('euro', '').strip(' .')
    if ',' in t:
        t = t.replace('.', '').replace(',', '.')
    elif re.fullmatch(r'\d{1,3}(\.\d{3})+\.\d{2}', t):  # «15.000.00»: l'ultimo punto separa i centesimi
        t = t[:-3].replace('.', '') + t[-3:]
    elif re.fullmatch(r'\d{1,3}(\.\d{3})+', t):
        t = t.replace('.', '')
    return float(t)


def tetto(fascia):
    """Il limite superiore di uno scaglione dal testo («fino a 15000.00 euro», «oltre 50000.00 euro» → None)."""
    f = fascia.lower()
    numeri = [num_it(n) for n in re.findall(r'\d[\d.,]*\d|\d', f)]
    if 'unica' in f:
        return None
    if re.search(r'\boltre\b', f) and len(numeri) == 1:
        return None
    if not numeri:
        raise ValueError(fascia)
    return round(numeri[-1])


def regionali():
    righe = list(csv.DictReader(open(os.path.join(GREZZI, 'addreg-2026.csv'), encoding='latin-1'), delimiter=';'))
    per = {}
    for r in righe:
        nome = NOME_CSV[r['REGIONE'].strip()]
        n = int(r['NUMERO'])
        per.setdefault(nome, {}).setdefault(n, []).append(r)
    out = {}
    for nome, pubb in per.items():
        n = max(pubb)  # l'ultima pubblicazione sostituisce le precedenti (per esempio gli aumenti per il disavanzo sanitario)
        rr = pubb[n]
        scaglioni = [[tetto(r['FASCIA ']), float(r['ALIQUOTA'])] for r in rr]
        assert scaglioni[-1][0] is None and all(scaglioni[i][0] < scaglioni[i + 1][0] for i in range(len(scaglioni) - 2)), (nome, scaglioni)
        disp = ' '.join(rr[0]['DISPOSIZIONE'].split())
        voce = {'scaglioni': scaglioni, 'pubblicazione': f'n. {n} del {rr[0]["DATA PUBBLICAZIONE"]}', 'norme': ' '.join(rr[0]['NORME'].split()),
                'disposizione': disp, 'altre_pubblicazioni': len(pubb) - 1}
        sp = SPECIALI.get(nome)
        if disp and not sp:
            sys.exit(f'{nome}: c\'è una disposizione particolare da leggere e scrivere in SPECIALI:\n{disp}')
        if sp:
            if sp['firma'] not in rr[0]['DISPOSIZIONE']:
                sys.exit(f'{nome}: la disposizione è cambiata, rileggila e aggiorna SPECIALI:\n{disp}')
            voce.update({k: v for k, v in sp.items() if k != 'firma'})
        out[nome] = voce
    mancano = set(NOME_CSV.values()) - set(out)
    assert not mancano, f'regioni senza dati 2026: {mancano}'
    return out


# ---------------------------------------------------------------- addizionale comunale

def aliquota(t):
    t = (t or '').strip()
    if not t or t == '0*':
        return None
    return float(t.replace(',', '.'))


def comunale(r, anno):
    """Dalla riga del CSV alla regola dell'addizionale comunale; None se il Comune non ha la delibera di quell'anno."""
    if (r['ALIQUOTA'] or '').strip() == '0*':
        return None
    coppie = [(r['ALIQUOTA' + s], r['FASCIA' + s]) for s in [''] + [f'_{i}' for i in range(2, 13)]]
    coppie = [(aliquota(a), (f or '').strip()) for a, f in coppie if (f or '').strip() or aliquota(a)]
    flag = (r['FLAG_NUOVA'] or '').strip()
    esente = float((r['IMPORTO_ESENTE'] or '0').replace('.', '').replace(',', '.'))
    voce = {'anno': anno, 'delibera': f'n. {r["NUMERO_DELIBERA"]} del {r["DATA_DELIBERA"]}' if r['NUMERO_DELIBERA'] else ''}
    scaglioni, particolari, dubbi = [], [], []
    for a, f in coppie:
        fl = f.lower()
        if fl.startswith('esenzione'):
            if re.match(r'esenzione per redditi imponibili fino a euro [\d.,]+\s*$', fl) and flag in ('2', '4'):
                continue  # è l'esenzione generale, già in IMPORTO_ESENTE
            m = re.fullmatch(r'esenzione per (?:i )?redditi (?:imponibili |complessivi )?(?:fino|inferiori) ad? (?:euro |€ ?)?([\d.,]+)(?: euro)?', fl.strip(' .'))
            if m and not esente:
                esente = num_it(m.group(1))  # esenzione per tutti, scritta solo nel testo
                continue
            particolari.append(f)
            continue
        try:
            scaglioni.append([tetto(f) if f else None, a])
        except ValueError:
            dubbi.append(f)
    if scaglioni and scaglioni[-1][0] is not None:
        dubbi.append('l\'ultimo scaglione non arriva a «oltre»')
    if any(scaglioni[i][0] is None or scaglioni[i][0] >= (scaglioni[i + 1][0] or 1e12) for i in range(len(scaglioni) - 1)):
        dubbi.append('scaglioni non in ordine')
    if any(a is None for _, a in scaglioni):
        dubbi.append('aliquota mancante')
    if not scaglioni:
        dubbi.append('nessuna aliquota')
    voce['scaglioni'] = scaglioni
    if esente:
        voce['esenzione'] = esente
    if particolari:
        voce['particolari'] = [p[:240] for p in particolari]
    if dubbi:
        voce['da_verificare'] = True
        voce['dubbi'] = dubbi
    if flag == '0':
        voce['forma_libera'] = True  # la delibera è stata inserita come testo: le cifre vengono dalla descrizione
    return voce


def norm(t):
    import unicodedata
    t = unicodedata.normalize('NFD', t.lower())
    return re.sub(r'[^a-z0-9]+', ' ', ''.join(ch for ch in t if not unicodedata.combining(ch))).strip()


def comuni():
    elenco = json.load(open(ELENCO, encoding='utf-8'))['elenco']
    per_cat = {c['catastale']: c for c in elenco}
    lette = {}
    for anno in (2026, 2025):
        for r in csv.DictReader(open(os.path.join(GREZZI, f'addcom-{anno}.csv'), encoding='utf-8'), delimiter=';'):
            lette.setdefault(r['CODICE_CATASTALE'].strip(), {})[anno] = r
    per_nome = {}
    for cat, anni in lette.items():
        r = next(iter(anni.values()))
        per_nome[(norm(r['COMUNE']), r['PR'].strip())] = anni
    bilanci = {}
    for f in glob.glob(os.path.join(BILANCIO, 'p', '*.json')):
        bilanci.update(json.load(open(f, encoding='utf-8')))
    righe, schede = [], {}
    senza = 0
    for c in elenco:
        reg = 'Bolzano' if c['provincia'] == '021' else 'Trento' if c['provincia'] == '022' else REGIONI_ISTAT[c['regione']]
        righe.append([c['istat'], c['comune'], c['sigla'], reg])
        csvr = lette.get(c['catastale']) or per_nome.get((norm(c['comune']), c['sigla']), {})
        add = None
        if 2026 in csvr:
            add = comunale(csvr[2026], 2026)
        if add is None and 2025 in csvr:
            add = comunale(csvr[2025], 2025)
            if add is not None:
                add['prorogata'] = True  # senza delibera 2026 valgono le aliquote del 2025 (L. 296/2006, art. 1, c. 169)
        if add is None:
            add = {'anno': 2026, 'nessuna': True} if csvr else None
        if add is None:
            senza += 1
        s = {'add': add}
        b = bilanci.get(c['istat'])
        if b:
            s['bil'] = {'anno': b['anno'], 'pop': b.get('pop'), 'fascia': b.get('fascia'), 'tot': b.get('spesa_tot'),
                        'missioni': {m: v[0] for m, v in sorted(b.get('spesa', {}).items()) if v and v[0] > 0}}
        schede.setdefault(c['sigla'], {})[c['istat']] = s
    print(f'Comuni: {len(righe)}, senza riga nel CSV delle addizionali: {senza}, con bilancio: {sum(1 for p in schede.values() for s in p.values() if "bil" in s)}')
    return righe, schede


# ---------------------------------------------------------------- scrittura

def main():
    if '--scarica' in sys.argv:
        scarica()
    letto = open(os.path.join(GREZZI, 'letto.txt')).read().strip() if os.path.exists(os.path.join(GREZZI, 'letto.txt')) else date.today().isoformat()
    os.makedirs(os.path.join(USCITA, 'p'), exist_ok=True)
    conf = json.load(open(os.path.join(BILANCIO, 'confronto.json'), encoding='utf-8'))
    stato = {
        'aggiornato': date.today().isoformat(),
        'letto': letto,
        'cofog': spesa_funzioni(),
        'regioni': regionali(),
        'bilancio_comuni': {'fonte': conf['fonte'], 'aggiornato': conf['aggiornato'],
                            'fasce': {k: {'comuni': v['comuni'], 'missioni_pc': v['missioni_pc'], 'spesa_pc': v['spesa_pc']} for k, v in conf['fasce'].items()}},
        'firme': {n: hashlib.sha1(open(os.path.join(GREZZI, n), 'rb').read()).hexdigest()[:12] for n in SCARICHI},
    }
    righe, schede = comuni()
    json.dump(stato, open(os.path.join(USCITA, 'stato.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump({'aggiornato': stato['aggiornato'], 'comuni': righe}, open(os.path.join(USCITA, 'comuni.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    for f in glob.glob(os.path.join(USCITA, 'p', '*.json')):
        os.unlink(f)
    for sigla, s in schede.items():
        json.dump(s, open(os.path.join(USCITA, 'p', f'{sigla}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    it = stato['cofog']['paesi']['italia']
    print('Spesa per funzione', stato['cofog']['anno'], {k: round(100 * v / it['totale_milioni'], 1) for k, v in it['milioni'].items()})
    print('Regioni:', len(stato['regioni']))


if __name__ == '__main__':
    main()
