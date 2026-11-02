#!/usr/bin/env python3
"""Il Polpo legge per te: «Le domande senza risposta».

Le interrogazioni e le interpellanze della XIX legislatura (dal 13 ottobre 2022), Camera e Senato:
quante ricevono risposta dal Governo, Ministero per Ministero, in quanto tempo, e di cosa parlano.

Fonti (solo dati aperti):
  - endpoint SPARQL di dati.camera.it (ontologia OCD, classe ocd:aic): contiene gli atti di sindacato
    ispettivo di entrambi i rami, con Ministeri destinatari e delegati, data di presentazione,
    eventuale risposta e data di conclusione, testo;
  - endpoint SPARQL di dati.senato.it (classe osr:SindacatoIspettivo): usato come controllo incrociato
    dei conteggi del Senato (tipo ed esito).
  Non si usa aic.camera.it (il robots.txt lo vieta) né www.senato.it (protetto da una verifica anti-robot).

Uso:
  python3 -I scripts/legge-interrogazioni.py --scarica   # aggiorna i grezzi in ~/dati-civici/interrogazioni/ e rifà tutto
  python3 -I scripts/legge-interrogazioni.py             # rifà derivati e pagina dai grezzi già scaricati (circa 4 minuti)
  python3 -I scripts/legge-interrogazioni.py --solo-pagina   # rifà solo la pagina dai derivati

Grezzi:   ~/dati-civici/interrogazioni/  (fuori dal repository)
Derivati: legge/interrogazioni/dati/riepilogo.json, atti.json (compatti); sintesi.json è scritto a mano
          (temi, parole chiave, sintesi ed esempi) e qui viene solo letto.
"""
import collections
import datetime
import gzip
import html
import importlib.util
import json
import os
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request

sys.dont_write_bytecode = True   # i moduli comuni si caricano senza lasciare file .pyc

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GREZZI = os.path.expanduser('~/dati-civici/interrogazioni')
CARTELLA = os.path.join(REPO, 'legge', 'interrogazioni')
DATI = os.path.join(CARTELLA, 'dati')
# Gli agenti di intelligenza artificiale di cui rispettare i divieti nei robots.txt: i nomi stanno
# in ~/dati-civici/agenti-ia.txt (uno per riga), fuori dal repository.
def _agenti_ia():
    p = os.path.expanduser('~/dati-civici/agenti-ia.txt')
    return [r.strip() for r in open(p, encoding='utf-8') if r.strip()] if os.path.exists(p) else []


AGENTI_IA = _agenti_ia()

UA = 'PolpoCivico/1.0 (+https://casaleggiodavide-stack.github.io/agenti-civici/)'
CAMERA = 'https://dati.camera.it/sparql'
SENATO = 'https://dati.senato.it/sparql'
LEG = 'http://dati.camera.it/ocd/legislatura.rdf/repubblica_19'
INIZIO_LEG = datetime.date(2022, 10, 13)
TIPI = ['INTERROGAZIONE A RISPOSTA SCRITTA', 'INTERROGAZIONE A RISPOSTA IN COMMISSIONE',
        'INTERROGAZIONE A RISPOSTA ORALE', 'INTERPELLANZA']


def _carica(nome, file):
    spec = importlib.util.spec_from_file_location(nome, os.path.join(REPO, 'scripts', file))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


# ---------------------------------------------------------------- scarico (una richiesta al secondo)

_ultima = [0.0]


def _get(url, params, accept='application/sparql-results+json', tentativi=3):
    attesa = 1.05 - (time.time() - _ultima[0])
    if attesa > 0:
        time.sleep(attesa)
    q = url + '?' + urllib.parse.urlencode(params)
    for t in range(tentativi):
        try:
            req = urllib.request.Request(q, headers={'User-Agent': UA, 'Accept': accept})
            with urllib.request.urlopen(req, timeout=300) as r:
                _ultima[0] = time.time()
                if r.status != 200 or r.headers.get('x-amzn-waf-action'):
                    raise SystemExit(f'Risposta inattesa ({r.status}, WAF={r.headers.get("x-amzn-waf-action")}) da {url}: mi fermo.')
                return r.read().decode('utf-8')
        except urllib.error.HTTPError as e:
            _ultima[0] = time.time()
            if e.code in (403, 429) or t == tentativi - 1:
                raise SystemExit(f'{url} ha risposto {e.code}: mi fermo (nessun aggiramento).')
            time.sleep(5 * (t + 1))
        except (urllib.error.URLError, TimeoutError):
            _ultima[0] = time.time()
            if t == tentativi - 1:
                raise
            time.sleep(5 * (t + 1))


def sparql(endpoint, query, pagina=None):
    """Righe come dict {variabile: valore}; con pagina=N scorre LIMIT/OFFSET finché finisce."""
    righe, offset = [], 0
    while True:
        q = query if pagina is None else f'{query} LIMIT {pagina} OFFSET {offset}'
        params = {'query': q, 'format': 'application/sparql-results+json'}
        dati = json.loads(_get(endpoint, params))
        b = [{k: v['value'] for k, v in r.items()} for r in dati['results']['bindings']]
        righe += b
        if pagina is None or len(b) < pagina:
            return righe
        offset += pagina
        print(f'  … {len(righe)} righe', file=sys.stderr)


def robots():
    """Controlla i robots.txt degli host usati: se un host vieta i percorsi che usiamo, ci fermiamo."""
    esito = {}
    for host, percorso in (('dati.camera.it', '/sparql'), ('dati.senato.it', '/sparql')):
        req = urllib.request.Request(f'https://{host}/robots.txt', headers={'User-Agent': UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                testo = r.read().decode('utf-8', 'replace') if r.status == 200 and 'text/plain' in r.headers.get('content-type', '') else ''
        except urllib.error.HTTPError:
            testo = ''
        time.sleep(1.05)
        vietato, gruppo = False, False
        for riga in testo.splitlines():
            riga = riga.split('#')[0].strip()
            if riga.lower().startswith('user-agent:'):
                ua = riga.split(':', 1)[1].strip().lower()
                gruppo = ua in ['*', 'polpocivico'] + [x.lower() for x in AGENTI_IA]
            elif gruppo and riga.lower().startswith('disallow:'):
                p = riga.split(':', 1)[1].strip()
                if p and (percorso.startswith(p.rstrip('*')) or p == '/'):
                    vietato = True
        esito[host] = 'vietato' if vietato else ('consentito' if testo else 'nessun robots.txt: consentito')
        if vietato:
            raise SystemExit(f'robots.txt di {host} vieta {percorso}: mi fermo.')
    return esito


P = 'PREFIX ocd: <http://dati.camera.it/ocd/> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> '


def scarica():
    os.makedirs(GREZZI, exist_ok=True)
    log = {'scaricato': datetime.datetime.now().isoformat(timespec='seconds'), 'robots': robots(), 'query': {}}

    def salva(nome, query, pagina=None, gz=False):
        print(f'{nome}…', file=sys.stderr)
        righe = sparql(CAMERA if not nome.startswith('senato') else SENATO, query, pagina)
        log['query'][nome] = {'righe': len(righe), 'query': query}
        f = os.path.join(GREZZI, nome + ('.json.gz' if gz else '.json'))
        with (gzip.open(f, 'wt', encoding='utf-8') if gz else open(f, 'w', encoding='utf-8')) as fh:
            json.dump(righe, fh, ensure_ascii=False)
        return righe

    # Il server non ordina più di 10.000 righe per query: si spezza per tipo e anno di presentazione.
    parti = [(t, a) for t in TIPI for a in range(2022, datetime.date.today().year + 1)]

    def a_pezzi(nome, corpo, pagina, gz=False):
        tutte = []
        for t, a in parti:
            f = f'?a a ocd:aic ; ocd:rif_leg <{LEG}> ; dc:type {json.dumps(t)} ; ocd:startDate ?inizio . FILTER(STRSTARTS(STR(?inizio), "{a}")) '
            tutte += sparql(CAMERA, P + corpo.replace('§', f), pagina)
        log['query'][nome] = {'righe': len(tutte), 'query': P + corpo.replace('§', '[per tipo e anno] ')}
        print(f'{nome}: {len(tutte)} righe', file=sys.stderr)
        fn = os.path.join(GREZZI, nome + ('.json.gz' if gz else '.json'))
        with (gzip.open(fn, 'wt', encoding='utf-8') if gz else open(fn, 'w', encoding='utf-8')) as fh:
            json.dump(tutte, fh, ensure_ascii=False)

    a_pezzi('camera_atti', 'SELECT DISTINCT ?a ?tipo ?ramo ?id ?inizio ?fine ?concluso ?risposta ?scheda WHERE { § ?a dc:type ?tipo ; '
            'ocd:ramo ?ramo ; dc:identifier ?id ; ocd:concluso ?concluso . '
            'OPTIONAL { ?a ocd:endDate ?fine } OPTIONAL { ?a ocd:risposta ?risposta } OPTIONAL { ?a dc:relation ?scheda } } ORDER BY ?a', 5000)
    a_pezzi('camera_destinatari', 'SELECT DISTINCT ?a ?d WHERE { § ?a ocd:destinatario ?d } ORDER BY ?a ?d', 5000)
    a_pezzi('camera_delegati', 'SELECT DISTINCT ?a ?g WHERE { § ?a ocd:rif_delegato ?g } ORDER BY ?a ?g', 5000)
    a_pezzi('camera_testi', 'SELECT DISTINCT ?a ?d WHERE { § ?a dc:description ?d } ORDER BY ?a', 1000, gz=True)
    salva('camera_organi', P + 'SELECT DISTINCT ?o ?l WHERE { ?o a ocd:organoGoverno ; rdfs:label ?l . FILTER(REGEX(STR(?o), "/og(182|2[0-9][0-9])_")) } ORDER BY ?o', 5000)
    # Controllo incrociato col Senato: tipo, esito e anno di presentazione
    salva('senato_controllo', 'SELECT DISTINCT ?s ?numero ?tipo ?esito ?data WHERE { '
          '?s a <http://dati.senato.it/osr/SindacatoIspettivo> ; <http://dati.senato.it/osr/legislatura> 19 ; '
          '<http://dati.senato.it/osr/tipo> ?tipo ; <http://dati.senato.it/osr/numero> ?numero . '
          'OPTIONAL { ?s <http://dati.senato.it/osr/esito> ?esito } OPTIONAL { ?s <http://dati.senato.it/osr/dataPresentazione> ?data } } ORDER BY ?s', 5000)
    json.dump(log, open(os.path.join(GREZZI, 'scarico.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def leggi(nome):
    f = os.path.join(GREZZI, nome + '.json')
    if os.path.exists(f + '.gz'):
        return json.load(gzip.open(f + '.gz', 'rt', encoding='utf-8'))
    return json.load(open(f, encoding='utf-8'))


# ---------------------------------------------------------------- dai grezzi agli atti

# Ministero competente a rispondere: l'identificativo dell'organo di Governo (uguale tra Governi) e il nome di oggi.
MINISTERI = {
    '1': 'Presidenza del Consiglio', '15': 'Interno', '52': 'Economia e finanze', '264': 'Salute',
    '285': 'Lavoro e politiche sociali', '49': 'Giustizia', '504': 'Esteri e cooperazione internazionale', '6': 'Difesa',
    '169': 'Imprese e made in Italy', '704': 'Imprese e made in Italy',
    '604': 'Agricoltura e sovranità alimentare', '705': 'Agricoltura e sovranità alimentare',
    '624': 'Istruzione e merito', '708': 'Istruzione e merito', '626': 'Università e ricerca',
    '180': 'Ambiente e sicurezza energetica', '666': 'Ambiente e sicurezza energetica', '706': 'Ambiente e sicurezza energetica',
    '198': 'Infrastrutture e trasporti', '667': 'Infrastrutture e trasporti', '707': 'Infrastrutture e trasporti',
    '605': 'Cultura', '664': 'Cultura', '665': 'Turismo',
    '424': 'Affari regionali e autonomie', '524': 'Rapporti con il Parlamento', '545': 'Pubblica amministrazione',
    '646': 'Disabilità', '588': 'Famiglia, natalità e pari opportunità', '687': 'Famiglia, natalità e pari opportunità',
    '686': 'Sport e giovani', '645': 'Sport e giovani', '688': 'Riforme istituzionali', '725': 'Riforme istituzionali',
    '684': 'Protezione civile e politiche del mare', '724': 'Protezione civile e politiche del mare',
    '586': 'Affari europei, PNRR e coesione', '685': 'Affari europei, PNRR e coesione', '726': 'Affari europei, PNRR e coesione',
    '745': 'Affari europei, PNRR e coesione', '644': 'Innovazione tecnologica', '647': 'Turismo',
}
SENZA_PORTAFOGLIO = {'Affari regionali e autonomie', 'Rapporti con il Parlamento', 'Pubblica amministrazione', 'Disabilità',
                     'Famiglia, natalità e pari opportunità', 'Sport e giovani', 'Riforme istituzionali',
                     'Protezione civile e politiche del mare', 'Affari europei, PNRR e coesione', 'Innovazione tecnologica'}

# Sottotipi letti dall'intestazione del testo («Atto Camera Interrogazione a risposta immediata in Assemblea 3-…»)
SOTTOTIPI = [
    ('scritta', 'Interrogazioni a risposta scritta'),
    ('commissione', 'Interrogazioni in commissione'),
    ('orale', 'Interrogazioni a risposta orale'),
    ('interpellanza', 'Interpellanze'),
    ('urgente', 'Interpellanze urgenti'),
    ('qt_aula', 'Question time in Aula'),
    ('qt_comm', 'Question time in commissione'),
]
NOME_TIPO = dict(SOTTOTIPI)
QUESTION_TIME = {'qt_aula', 'qt_comm'}


def sottotipo(tipo, testo):
    t = testo[:200].lower()
    if 'risposta immediata in assemblea' in t:
        return 'qt_aula'
    if 'risposta immediata in commissione' in t:
        return 'qt_comm'
    if 'interpellanza urgente' in t:
        return 'urgente'
    return {'INTERROGAZIONE A RISPOSTA SCRITTA': 'scritta', 'INTERROGAZIONE A RISPOSTA IN COMMISSIONE': 'commissione',
            'INTERROGAZIONE A RISPOSTA ORALE': 'orale', 'INTERPELLANZA': 'interpellanza'}[tipo]


def data(s):
    return datetime.date(int(s[:4]), int(s[4:6]), int(s[6:8])) if s and len(s) >= 8 else None


def pulisci(t):
    t = html.unescape(t).replace('\xa0', ' ')
    return re.sub(r'\s+', ' ', t).strip()


def corpo_testo(t):
    """Il testo senza intestazione e firmatari: da «Al Ministro…» / «interpellare…» in poi."""
    m = re.search(r'(?:[—–-]\s*(?:Al|Ai|Alla|All\')\s|chiede(?:no)? di interpellare|Per sapere)', t[:1500])
    return t[m.start():] if m else t


def atti_da_grezzi():
    base = leggi('camera_atti')
    testi = {r['a']: pulisci(r['d']) for r in leggi('camera_testi')}
    deleghe = collections.defaultdict(list)
    for r in leggi('camera_delegati'):
        m = re.search(r'_delegato_(\d+)_(\d{8})$', r['g'])
        if m:
            deleghe[r['a']].append((m.group(2), m.group(1)))
    destinatari = collections.defaultdict(list)
    for r in leggi('camera_destinatari'):
        m = re.search(r'og\d+_(\d+)$', r['d'])
        if m:
            destinatari[r['a']].append(m.group(1))
    atti = []
    for r in base:
        a, testo = r['a'], testi.get(r['a'], '')
        st = sottotipo(r['tipo'], testo)
        dl = sorted(deleghe.get(a, []))
        competente = dl[-1][1] if dl else (destinatari[a][0] if destinatari.get(a) else '')
        inizio, fine = data(r['inizio']), data(r.get('fine'))
        risposta = 'risposta' in r
        atti.append({
            'uri': a, 'ramo': 'C' if r['ramo'].startswith('Camera') else 'S', 'num': r['id'].replace('/', '-'), 'tipo': st,
            'inizio': inizio, 'risposta': risposta, 'data_risposta': fine if risposta else None,
            'chiuso_senza': (not risposta) and r['concluso'] == '1', 'data_chiusura': fine,
            'ministero': MINISTERI.get(competente, 'Altro'),
            'destinatari': sorted({MINISTERI.get(x, 'Altro') for x in destinatari.get(a, [])}),
            'scheda': (r.get('scheda') or '').replace('http://', 'https://'), 'testo': testo,
        })
    return atti


# ---------------------------------------------------------------- temi e territori

def finestra(testo):
    """Il pezzo di testo che dice di cosa si parla: dopo «premesso che» (o dopo il destinatario), 2.000 caratteri."""
    c = corpo_testo(testo)
    m = re.search(r'premess[oa] che', c[:600], re.I)
    if m:
        c = c[m.end():]
    return c[:2000]


def classificatore(temi):
    """Punteggio per tema: per ogni espressione, quante volte compare (al massimo 3) più 1,5 se compare
    nelle prime righe; 3,5 punti in più al tema del Ministero competente. Vince il punteggio più alto."""
    regole = [(t['id'], [re.compile(r'(?<![a-zàèéìòù])' + p) for p in t['parole']]) for t in temi]
    prior = {}
    for t in temi:
        for mi in t['ministeri']:
            prior.setdefault(mi, t['id'])

    def tema(testo, ministero):
        f = finestra(testo).lower()
        punti = collections.Counter()
        for tid, pat in regole:
            for p in pat:
                pos = [m.start() for m in p.finditer(f)]
                if pos:
                    punti[tid] += min(len(pos), 3) + (1.5 if pos[0] < 450 else 0)
        if ministero in prior:
            punti[prior[ministero]] += 3.5
        if not punti:
            return 'altro'
        return max(punti, key=lambda k: (punti[k], k == prior.get(ministero)))
    return tema


# Regioni: nome, aggettivi (minuscoli) e codici ISTAT delle province (prime tre cifre del codice comune)
REGIONI = [
    ('Piemonte', ['piemontes'], ['001', '002', '003', '004', '005', '006', '096', '103']),
    ("Valle d'Aosta", ['valdostan'], ['007']),
    ('Lombardia', ['lombard[oaie]\\b'], ['012', '013', '014', '015', '016', '017', '018', '019', '020', '097', '098', '108']),
    ('Trentino-Alto Adige', ['trentin[oaie]\\b', 'altoatesin'], ['021', '022']),
    ('Veneto', ['venet[oaie]\\b'], ['023', '024', '025', '026', '027', '028', '029']),
    ('Friuli Venezia Giulia', ['friulan'], ['030', '031', '032', '093']),
    ('Liguria', ['ligur[ei]\\b'], ['008', '009', '010', '011']),
    ('Emilia-Romagna', ['emilian', 'romagnol'], ['033', '034', '035', '036', '037', '038', '039', '040', '099']),
    ('Toscana', ['toscan[oaie]\\b'], ['045', '046', '047', '048', '049', '050', '051', '052', '053', '100']),
    ('Umbria', ['umbr[oaie]\\b'], ['054', '055']),
    ('Marche', ['marchigian'], ['041', '042', '043', '044', '109']),
    ('Lazio', ['lazial[ei]\\b'], ['056', '057', '058', '059', '060']),
    ('Abruzzo', ['abruzzes'], ['066', '067', '068', '069']),
    ('Molise', ['molisan'], ['070', '094']),
    ('Campania', [], ['061', '062', '063', '064', '065']),
    ('Puglia', ['puglies[ei]\\b'], ['071', '072', '073', '074', '075', '110']),
    ('Basilicata', ['lucan[oaie]\\b'], ['076', '077']),
    ('Calabria', ['calabres[ei]\\b'], ['078', '079', '080', '101', '102']),
    ('Sicilia', ['sicilian[oaie]\\b'], ['081', '082', '083', '084', '085', '086', '087', '088', '089']),
    ('Sardegna', ['sard[oaie]\\b'], ['090', '091', '092', '095', '111', '112', '113', '114', '115', '116', '117', '118']),
]
NOMI_REGIONE = {'Piemonte': ['Piemonte'], "Valle d'Aosta": ["Valle d'Aosta", 'Valle d’Aosta', 'Val d\'Aosta'],
                'Trentino-Alto Adige': ['Trentino', 'Alto Adige', 'Südtirol'], 'Friuli Venezia Giulia': ['Friuli'],
                'Emilia-Romagna': ['Emilia-Romagna', 'Emilia Romagna', 'Romagna'], 'Puglia': ['Puglia', 'Puglie'],
                'Marche': ['Marche'], 'Lazio': ['Lazio'], 'Sardegna': ['Sardegna'], 'Sicilia': ['Sicilia']}
# Comuni che sono anche parole o cognomi comuni: non si contano
AMBIGUI = {'Vittoria', 'Fondi', 'Cento', 'Marino', 'Augusta', 'Alba', 'Quarto', 'Noto', 'Magenta', 'Mira', 'Rende',
           'Paese', 'Bra', 'Sora', 'Volla', 'Erice', 'Lugo', 'Carpi', 'Gela', 'Vasto', 'Ardea', 'Bacoli', 'Eboli', 'Melito di Napoli'}
NAZIONALE = re.compile(r"(procura (della repubblica )?(presso il tribunale )?di|tribunale (ordinario )?di|corte d.(appello|assise) di|tribunale amministrativo regionale del|tar( del)?|trattato di|con sede (legale )?(in|a)|sede di) (Roma|Lazio)$", re.I)
CAPOLUOGHI_PICCOLI = {'Urbino': '041', 'Tempio Pausania': '090', 'Lanusei': '091', 'Tortolì': '091', 'Sanluri': '111', 'Villacidro': '111',
                      'Carbonia': '111', 'Iglesias': '111', 'Isernia': '094', 'Sondrio': '014', 'Aosta': '007', 'Verbania': '103'}


def territori():
    """Restituisce una funzione testo -> insieme di Regioni citate (nome della Regione, aggettivo o Comune sopra i 15.000 abitanti)."""
    regione_di = {c: r for r, _, cod in REGIONI for c in cod}
    comuni = {}
    f = os.path.expanduser('~/dati-civici/istat/POSAS_2025_it_Comuni.csv')
    if os.path.exists(f):
        import csv
        r = csv.reader(open(f, encoding='utf-8-sig'), delimiter=';')
        next(r), next(r)
        for row in r:
            if row[2] == '999' and int(row[-1]) >= 15000:
                comuni[row[1].split('/')[0]] = regione_di.get(row[0][:3])
    for c, cod in CAPOLUOGHI_PICCOLI.items():
        comuni[c] = regione_di[cod]
    comuni.update({'Reggio Emilia': 'Emilia-Romagna', 'Reggio Calabria': 'Calabria', 'Bolzano': 'Trentino-Alto Adige'})
    for a in AMBIGUI:
        comuni.pop(a, None)
    voci = {}
    for r, _, _ in REGIONI:
        for n in NOMI_REGIONE.get(r, [r]):
            voci[n] = r
    for c, r in comuni.items():
        if r:
            voci.setdefault(c, r)
    nomi = sorted(voci, key=len, reverse=True)
    rx_nomi = re.compile(r"(?<![\w'’])(" + '|'.join(re.escape(n) for n in nomi) + r")(?![\w])")
    rx_agg = [(re.compile(r'(?<![\w])' + a), r) for r, aa, _ in REGIONI for a in aa]

    def cerca(testo):
        c = corpo_testo(testo)[:4000]
        trovate = collections.Counter()
        for m in rx_nomi.finditer(c):
            n = m.group(1)
            if n == 'Latina' and c[max(0, m.start() - 8):m.start()].endswith('America '):
                continue
            if n == 'Fermo' and c[m.end():m.end() + 9] == ' restando':
                continue
            if n in ('Roma', 'Lazio') and NAZIONALE.search(c[max(0, m.start() - 45):m.end()]):
                continue   # sedi nazionali a Roma (procura, tribunale, Tar del Lazio): non dicono di quale territorio si parla
            trovate[voci[n]] += 1
        for rx, r in rx_agg:
            if rx.search(c):
                trovate[r] += 1
        return set(trovate)
    return cerca


# ---------------------------------------------------------------- i numeri

def mediana(v):
    return round(statistics.median(v)) if v else None


def quota(a, b):
    return round(100 * a / b, 1) if b else None


def conta(gruppo, oggi):
    n = len(gruppo)
    risp = [a for a in gruppo if a['risposta']]
    giorni = [(a['data_risposta'] - a['inizio']).days for a in risp if a['data_risposta'] and a['inizio']]
    return {
        'atti': n, 'con_risposta': len(risp), 'quota': quota(len(risp), n),
        'giorni_mediani': mediana(giorni),
        'chiusi_senza_risposta': sum(1 for a in gruppo if a['chiuso_senza']),
        'in_attesa': sum(1 for a in gruppo if not a['risposta'] and not a['chiuso_senza']),
        'in_attesa_oltre_un_anno': sum(1 for a in gruppo if not a['risposta'] and not a['chiuso_senza'] and a['inizio'] and (oggi - a['inizio']).days > 365),
    }


def elabora():
    sintesi = json.load(open(os.path.join(DATI, 'sintesi.json'), encoding='utf-8'))
    log = json.load(open(os.path.join(GREZZI, 'scarico.json'), encoding='utf-8')) if os.path.exists(os.path.join(GREZZI, 'scarico.json')) else {}
    oggi = datetime.date.fromisoformat(log['scaricato'][:10]) if log.get('scaricato') else datetime.date.today()
    atti = atti_da_grezzi()
    tema_di = classificatore(sintesi['temi'])
    cerca = territori()
    print('classifico temi e territori…', file=sys.stderr)
    for a in atti:
        a['tema'] = tema_di(a['testo'], a['ministero'])
        a['regioni'] = sorted(cerca(a['testo']))
    controllo = [a for a in atti if a['tipo'] not in QUESTION_TIME]   # il question time ha sempre risposta: si conta a parte

    R = {'aggiornato': oggi.isoformat(), 'legislatura': 'XIX (dal 13 ottobre 2022)', 'totale': len(atti),
         'per_ramo': {r: sum(1 for a in atti if a['ramo'] == r) for r in 'CS'}, 'senza_question_time': conta(controllo, oggi)}
    R['per_tipo'] = []
    for ramo in 'CS':
        for st, nome in SOTTOTIPI:
            g = [a for a in atti if a['ramo'] == ramo and a['tipo'] == st]
            if g:
                R['per_tipo'].append({'ramo': ramo, 'tipo': st, 'nome': nome, **conta(g, oggi)})
    # Risposta scritta entro i 20 giorni del regolamento (solo atti presentati da più di 20 giorni)
    scritte = [a for a in atti if a['tipo'] == 'scritta' and a['inizio'] and (oggi - a['inizio']).days > 20]
    entro = [a for a in scritte if a['risposta'] and a['data_risposta'] and (a['data_risposta'] - a['inizio']).days <= 20]
    R['scritte'] = conta([a for a in atti if a['tipo'] == 'scritta'], oggi)
    R['scritte_entro_20_giorni'] = {'atti': len(scritte), 'entro_20': len(entro), 'quota': quota(len(entro), len(scritte))}
    R['per_ministero'] = []
    for mi in sorted({a['ministero'] for a in controllo}):
        g = [a for a in controllo if a['ministero'] == mi]
        sc = [a for a in g if a['tipo'] == 'scritta']
        R['per_ministero'].append({'ministero': mi, 'senza_portafoglio': mi in SENZA_PORTAFOGLIO, **conta(g, oggi),
                                   'scritte': len(sc), 'quota_scritte': quota(sum(1 for a in sc if a['risposta']), len(sc))})
    R['per_anno'] = []
    for anno in sorted({a['inizio'].year for a in controllo if a['inizio']}):
        g = [a for a in controllo if a['inizio'] and a['inizio'].year == anno]
        R['per_anno'].append({'anno': anno, **conta(g, oggi)})
    nomi_temi = {t['id']: t['nome'] for t in sintesi['temi']}
    nomi_temi['altro'] = 'Altro'
    R['per_tema'] = []
    for tid, nome in nomi_temi.items():
        g = [a for a in atti if a['tema'] == tid]
        if g:
            gc = [a for a in g if a['tipo'] not in QUESTION_TIME]
            mins = collections.Counter(a['ministero'] for a in g).most_common(2)
            R['per_tema'].append({'tema': tid, 'nome': nome, 'atti': len(g), 'quota_risposta': conta(gc, oggi)['quota'],
                                  'ministeri_principali': [m for m, _ in mins]})
    R['per_tema'].sort(key=lambda x: -x['atti'])
    R['per_regione'] = []
    con_regione = [a for a in atti if a['regioni']]
    for r, _, _ in REGIONI:
        g = [a for a in atti if r in a['regioni']]
        gc = [a for a in g if a['tipo'] not in QUESTION_TIME]
        R['per_regione'].append({'regione': r, 'atti': len(g), 'quota_risposta': conta(gc, oggi)['quota']})
    R['per_regione'].sort(key=lambda x: -x['atti'])
    R['atti_con_territorio'] = len(con_regione)
    # Controllo incrociato col Senato (dati.senato.it): tipo ed esito
    try:
        sen = leggi('senato_controllo')
        c = collections.Counter((x['tipo'], x.get('esito', '')) for x in sen)
        R['controllo_senato'] = {'atti': len({x['s'] for x in sen}),
                                 'per_tipo_esito': [{'tipo': t, 'esito': e or '(nessuno)', 'n': n} for (t, e), n in sorted(c.items())]}
    except FileNotFoundError:
        R['controllo_senato'] = None
    R['scarico'] = {k: v['righe'] for k, v in log.get('query', {}).items()}

    os.makedirs(DATI, exist_ok=True)
    json.dump(R, open(os.path.join(DATI, 'riepilogo.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # Elenco compatto degli atti: ramo, numero, tipo, presentazione, risposta (data o vuoto), stato, Ministero, tema, Regioni
    temi_idx = {t['id']: i for i, t in enumerate(sintesi['temi'])}
    temi_idx['altro'] = -1
    mins = sorted({a['ministero'] for a in atti})
    compatti = {
        'campi': ['ramo', 'numero', 'tipo', 'presentato', 'risposta', 'stato', 'ministero', 'tema', 'regioni'],
        'stati': {'r': 'con risposta', 'c': 'chiuso senza risposta (ritirato, trasformato o decaduto)', 'a': 'in attesa'},
        'ministeri': mins, 'temi': [t['id'] for t in sintesi['temi']] + ['altro'],
        'scheda': 'https://documenti.camera.it/apps/commonServices/getDocumento.ashx?sezione=lavori&tipoDoc=sicross&idlegislatura=19&ramo={camera|senato}&stile=6&idDocumento={numero con / al posto del -}',
        'atti': [[a['ramo'], a['num'], a['tipo'], a['inizio'].isoformat() if a['inizio'] else '',
                  a['data_risposta'].isoformat() if a['data_risposta'] else '',
                  'r' if a['risposta'] else ('c' if a['chiuso_senza'] else 'a'), mins.index(a['ministero']),
                  temi_idx[a['tema']], a['regioni']] for a in sorted(atti, key=lambda a: (a['ramo'], a['num']))],
    }
    json.dump(compatti, open(os.path.join(DATI, 'atti.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    return R, sintesi, atti


# ---------------------------------------------------------------- la pagina

REG_CAMERA = 'https://conoscere.camera.it/norme-essenziali/il-regolamento-della-camera/parte_terza/'
SCHEDA = 'https://documenti.camera.it/apps/commonServices/getDocumento.ashx?sezione=lavori&tipoDoc=sicross&idlegislatura=19&ramo={ramo}&stile=6&idDocumento={num}'
RAMO = {'C': 'Camera', 'S': 'Senato'}
MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

CSS_EXTRA = """
  .dossier .scorri { margin: 16px 0 6px; overflow-x: auto; }
  .dossier .nota { font-size: var(--s-1); color: var(--inchiostro-3); margin: 8px 0 0; }
  .dossier .esempi { list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 4px; font-size: var(--s0); }
  .dossier .esempi a { font-family: var(--cifre); font-size: 12.5px; }
  .dossier .esempi .stato { font-family: var(--cifre); font-size: 11.5px; color: var(--inchiostro-3); }
  .dossier .tema { margin-top: 26px; }
  .dossier .tema h3 { margin-bottom: 4px; }
  .dossier .tema .conta { font-family: var(--cifre); font-size: 12px; color: var(--inchiostro-3); margin: 0 0 6px; }
  .dossier .regole-gov { padding-left: 18px; display: grid; gap: 6px; }
"""


class Fonti:
    """Numera le fonti nell'ordine in cui compaiono e restituisce il rimando cit()."""

    def __init__(self, d):
        self.d, self.elenco, self.num = d, [], {}

    def __call__(self, titolo, url):
        if url not in self.num:
            self.elenco.append((titolo, url))
            self.num[url] = len(self.elenco)
        return self.d.cit(self.num[url], url, titolo)


def scrivi_pagina(R, sintesi, atti):
    d = _carica('dossier', 'dossier.py')
    it, esc = d.it, d.esc
    F = Fonti(d)
    per_num = {(a['ramo'], a['num']): a for a in atti}
    oggi = datetime.date.fromisoformat(R['aggiornato'])
    data_it = f'{oggi.day} {MESI[oggi.month - 1]} {oggi.year}'

    def pc(x):
        return it(x, 1) + '%' if x is not None else '–'

    def al(x):
        """«al 20%» ma «all'80%», «all'1%», «all'11%»."""
        intero = int(x) if x is not None else 0
        return ("all'" if str(intero).startswith('8') or intero in (1, 11) or 1000 <= intero < 2000 else 'al ') + pc(x)

    def gg(x):
        return (it(x) if x is not None else '–', x if x is not None else -1)

    f_camera = F('Camera dei deputati, dati aperti: endpoint SPARQL (ontologia OCD, atti di indirizzo e controllo)', 'https://dati.camera.it/sparql')
    f_senato = F('Senato della Repubblica, dati aperti: endpoint SPARQL (sindacato ispettivo)', 'https://dati.senato.it/sito/home')

    def art(n, capo='capo_xxix'):
        return F(f'Regolamento della Camera dei deputati, articolo {n.replace("-", " ")}', f'{REG_CAMERA}{capo}/art-{n}')

    sq, sc, e20 = R['senza_question_time'], R['scritte'], R['scritte_entro_20_giorni']
    mins = [m for m in R['per_ministero'] if m['atti'] >= 20 and m['ministero'] != 'Altro']
    con_scritte = [m for m in mins if m['scritte'] >= 200]
    alti = sorted(con_scritte, key=lambda m: -(m['quota_scritte'] or 0))[:2]
    bassi = sorted(con_scritte, key=lambda m: m['quota_scritte'] or 0)[:3]
    piu = max(mins, key=lambda m: m['atti'])
    temi = [t for t in R['per_tema'] if t['tema'] != 'altro']
    reg = R['per_regione']
    quote_reg = [r['quota_risposta'] for r in reg if r['atti'] >= 100]
    n_qt = sum(t['atti'] for t in R['per_tipo'] if t['tipo'] in QUESTION_TIME)

    def quante(m):
        return it(round(m['quota_scritte'] * m['scritte'] / 100))

    frase_alti = ' e '.join(f'{m["ministero"]} {al(m["quota_scritte"])}' for m in alti)
    frase_bassi = ', '.join(f'{m["ministero"]} {al(m["quota_scritte"])} ({quante(m)} su {it(m["scritte"])})' for m in bassi)
    breve = [
        f'Dal 13 ottobre 2022 al {data_it} deputati e senatori hanno presentato <b>{it(R["totale"])}</b> interrogazioni e interpellanze al Governo: '
        f'{it(R["per_ramo"]["C"])} alla Camera e {it(R["per_ramo"]["S"])} al Senato.{f_camera}',
        f'Tolto il question time ({it(n_qt)} domande, a cui si risponde in diretta e quasi sempre), ha avuto risposta il <b>{pc(sq["quota"])}</b> degli atti: '
        f'{it(sq["con_risposta"])} su {it(sq["atti"])}. Ne aspettano ancora una {it(sq["in_attesa"])}, {it(sq["in_attesa_oltre_un_anno"])} da più di un anno.',
        f'Per le interrogazioni a risposta scritta il regolamento della Camera dà al Governo <b>venti giorni</b>.{art("134")} '
        f'È successo nello <b>{pc(e20["quota"])}</b> dei casi: {it(e20["entro_20"])} su {it(e20["atti"])}. In tutto ha avuto risposta il {pc(sc["quota"])} '
        f'delle {it(sc["atti"])} interrogazioni scritte, dopo una mediana di {it(sc["giorni_mediani"])} giorni.',
        f'Tra i Ministeri le differenze sono grandi. Sulle interrogazioni scritte hanno risposto {frase_alti}; {frase_bassi}. '
        f'Il Ministero con più domande ({piu["ministero"]}) ne ha ricevute {it(piu["atti"])}, con risposta {al(piu["quota"])}.',
        'I temi più frequenti: ' + ', '.join(f'{t["nome"].lower()} ({it(t["atti"])} atti)' for t in temi[:3]) + '.',
        f'Le Regioni più nominate sono {", ".join(r["regione"] for r in reg[:3])}. La quota di risposte cambia poco da una Regione all\'altra: '
        f'tra il {pc(min(quote_reg))} e il {pc(max(quote_reg))}.',
    ]
    numeri = f'''<div class="dato numeri">
      <div><b>{it(R["totale"])}</b><span>interrogazioni e interpellanze dal 13 ottobre 2022</span></div>
      <div><b>{pc(sq["quota"])}</b><span>hanno avuto risposta (question time escluso)</span></div>
      <div><b>{pc(e20["quota"])}</b><span>delle interrogazioni scritte ha risposta entro i 20 giorni del regolamento</span></div>
      <div><b>{it(sq["in_attesa_oltre_un_anno"])}</b><span>aspettano una risposta da più di un anno</span></div>
    </div>'''

    regole = f'''<p>Un'<b>interrogazione</b> è una domanda scritta che un parlamentare rivolge al Governo: se un fatto è vero, se il Governo ne è informato, se intende prendere un provvedimento.{art("128")} Un'<b>interpellanza</b> chiede invece i motivi e le intenzioni della politica del Governo su una questione.{art("136", "capo_xxx")} Sono lo strumento più diretto con cui il Parlamento controlla il Governo: la domanda resta agli atti e chi risponde lo fa a nome del Governo.</p>
      <ul class="regole-gov">
        <li><b>Risposta scritta:</b> il Governo deve rispondere entro venti giorni; se non lo fa, chi ha chiesto può far mettere la domanda all'ordine del giorno della commissione competente.{art("134")}</li>
        <li><b>Risposta in commissione:</b> la domanda va all'ordine del giorno della prima seduta della commissione dopo quindici giorni dalla presentazione.{art("133")}</li>
        <li><b>Risposta orale in Aula:</b> il Governo può dichiarare di non poter rispondere, spiegando perché, o rinviare indicando un giorno entro un mese.{art("131")}</li>
        <li><b>Question time:</b> una volta alla settimana, di norma il mercoledì, un Ministro o il Presidente del Consiglio risponde in diretta a domande brevi presentate il giorno prima.{art("135-bis")}</li>
        <li><b>Interpellanze urgenti:</b> sono svolte di norma nella seduta del giovedì della settimana in cui sono presentate.{art("138-bis", "capo_xxx")}</li>
      </ul>
      <p class="nota">Al Senato il regolamento prevede strumenti analoghi (interrogazioni a risposta orale, scritta e in commissione, interpellanze, question time). Il sito del Senato non si lascia leggere in modo automatico e non abbiamo riletto il suo regolamento: per questo citiamo solo gli articoli del regolamento della Camera.</p>'''

    tipi = d.tabella('t-tipi', [('Ramo', 't'), ('Tipo di atto', 't'), ('Atti', 'n'), ('Risposte', 'n'), ('Quota', 'n'), ('Giorni', 'n'), ('In attesa', 'n')],
                     [[(RAMO[t['ramo']], RAMO[t['ramo']]), (t['nome'], t['nome']), (it(t['atti']), t['atti']), (it(t['con_risposta']), t['con_risposta']),
                       (pc(t['quota']), t['quota'] or 0), gg(t['giorni_mediani']), (it(t['in_attesa']), t['in_attesa'])] for t in R['per_tipo']], 2)
    anni = d.barre([(str(a['anno']), a['quota'], f'{pc(a["quota"])} · {it(a["con_risposta"])} su {it(a["atti"])}') for a in R['per_anno']], 100)

    righe_m = []
    for m in sorted(mins, key=lambda m: -m['atti']):
        nome = esc(m['ministero']) + (' <span class="nota">(senza portafoglio)</span>' if m['senza_portafoglio'] else '')
        righe_m.append([(nome, m['ministero']), (it(m['atti']), m['atti']), (it(m['con_risposta']), m['con_risposta']), (pc(m['quota']), m['quota'] or 0),
                        gg(m['giorni_mediani']), (pc(m['quota_scritte']), m['quota_scritte'] if m['quota_scritte'] is not None else -1),
                        (it(m['in_attesa_oltre_un_anno']), m['in_attesa_oltre_un_anno'])])
    piccoli = [m for m in R['per_ministero'] if m not in mins]
    tab_m = d.tabella('t-ministeri', [('Ministero', 't'), ('Atti', 'n'), ('Risposte', 'n'), ('Quota', 'n'), ('Giorni', 'n'),
                                      ('Scritte', 'n'), ('Attesa >1 anno', 'n')], righe_m, 1)

    barre_temi = d.barre([(esc(t['nome']), t['atti'], f'{it(t["atti"])} · {pc(t["quota_risposta"])} con risposta') for t in temi])
    blocchi = []
    for t in temi:
        s = sintesi['sintesi'].get(t['tema'])
        if not s:
            continue
        rimandi, esempi = '', []
        for e in s['esempi']:
            a = per_num.get((e['ramo'], e['numero']))
            if not a:
                continue
            url = SCHEDA.format(ramo='camera' if e['ramo'] == 'C' else 'senato', num=e['numero'].replace('-', '/'))
            etichetta = f'{RAMO[e["ramo"]]} {e["numero"]}'
            rimandi += F(f'{etichetta}: {e["oggetto"]}', url)
            stato = 'con risposta' if a['risposta'] else ('chiuso senza risposta' if a['chiuso_senza'] else 'in attesa di risposta')
            esempi.append(f'<li><a href="{esc(url)}" target="_blank" rel="noopener">{etichetta}</a> {esc(e["oggetto"])} '
                          f'<span class="stato">· {a["inizio"].year} · {stato}</span></li>')
        blocchi.append(f'''<div class="tema"><h3>{esc(t["nome"])}</h3>
        <p class="conta">{it(t["atti"])} atti · {pc(t["quota_risposta"])} con risposta · Ministeri più interrogati: {esc(", ".join(t["ministeri_principali"]))}</p>
        <p>{esc(s["testo"])}{rimandi}</p><ul class="esempi">{"".join(esempi)}</ul></div>''')

    barre_reg = d.barre([(esc(r['regione']), r['atti'], f'{it(r["atti"])} · {pc(r["quota_risposta"])} con risposta') for r in reg])

    cs = R.get('controllo_senato') or {}
    sen_scritte = sum(x['n'] for x in cs.get('per_tipo_esito', []) if x['tipo'] == 'Interrogazione con richiesta di risposta scritta')
    sen_risp = sum(x['n'] for x in cs.get('per_tipo_esito', []) if x['tipo'] == 'Interrogazione con richiesta di risposta scritta' and x['esito'] == 'Risposta pubblicata')
    s_scritte = next((t for t in R['per_tipo'] if t['ramo'] == 'S' and t['tipo'] == 'scritta'), {})

    letti = (f'Tutti i {it(R["totale"])} atti di sindacato ispettivo della XIX legislatura presentati dal 13 ottobre 2022 al {data_it} '
             '(interrogazioni a risposta scritta, in commissione e orale, interpellanze, question time), di Camera e Senato, come li pubblica '
             f'l\'endpoint dei dati aperti della Camera{f_camera}: tipo, data di presentazione, Ministero delegato a rispondere, eventuale risposta e sua data, testo. '
             f'Per il Senato abbiamo controllato i conteggi anche sui dati aperti del Senato.{f_senato}')
    come = ('I numeri sono calcolati da uno script che si può rilanciare (scripts/legge-interrogazioni.py nel repository del sito). Un atto «ha avuto risposta» '
            'quando i dati aperti registrano la risposta: pubblicata, per le interrogazioni scritte; data in seduta, per le altre. I giorni sono contati dalla presentazione '
            'alla risposta e riassunti con la mediana (metà degli atti ha avuto risposta prima, metà dopo). Ogni atto è attribuito al Ministero delegato a rispondere '
            'più di recente; i Ministeri che hanno cambiato nome sono uniti sotto il nome di oggi. Il tema è assegnato con parole chiave scelte dopo aver letto '
            'un campione di atti, più un piccolo peso al Ministero competente: su 120 atti estratti a caso e letti a mano prima di vedere il risultato, il tema '
            'coincideva in 95 casi (79%). Il territorio è la Regione nominata nel testo, direttamente, con un aggettivo («siciliano») o con un Comune sopra i '
            f'15.000 abitanti; ne nomina almeno una il {pc(quota(R["atti_con_territorio"], R["totale"]))} degli atti. Le sintesi dei temi sono scritte leggendo circa '
            '330 atti estratti a caso dai diversi temi.')
    limiti = ('I dati aperti dicono se e quando è arrivata una risposta, non che cosa dice: una risposta può essere parziale. Gli atti più recenti hanno avuto '
              'meno tempo, quindi la quota di risposte del 2026 è più bassa anche per questo. Al Senato le interrogazioni a risposta orale comprendono anche quelle '
              'in commissione e il question time, che i dati non distinguono: per questo la loro quota è più alta e i giorni mediani sono pochi. Anche alla Camera '
              'molte interrogazioni orali vengono svolte a pochi giorni dalla presentazione. Un atto «chiuso senza risposta» può essere stato ritirato, trasformato '
              'in un altro tipo di atto (che compare con un nuovo numero) o decaduto. '
              f'I conteggi del Senato sui dati della Camera ({it(s_scritte.get("atti", 0))} interrogazioni scritte, {it(s_scritte.get("con_risposta", 0))} con risposta) '
              f'e su quelli del Senato ({it(sen_scritte)} e {it(sen_risp)}) differiscono di poco per i tempi di aggiornamento. '
              'Il tema è assegnato in modo automatico e circa un atto su cinque può finire in un tema vicino. I nomi di città che sono anche parole comuni o cognomi '
              '(Vittoria, Fondi, Marino…) non sono contati, e le sedi nazionali a Roma (procura, tribunale, Tar del Lazio) non contano per il Lazio. Il testo '
              'pubblicato negli open data a volte è tagliato. Nessuna classifica di partiti o parlamentari: il confronto è solo tra Ministeri, tipi di atto, temi e territori.')

    corpo = f'''    <section><div class="occhiello">In breve</div><h2>Meno di una domanda su quattro ha avuto risposta</h2>
      {numeri}
      <ul class="lista">{"".join(f"<li>{x}</li>" for x in breve)}</ul>
    </section>
    <section><div class="occhiello">Le regole</div><h2>Che cos'è un'interrogazione, e perché il Governo deve rispondere</h2>
      {regole}
    </section>
    <section><div class="occhiello">Tipo per tipo</div><h2>Dove la risposta arriva, e dove no</h2>
      <p>Il question time e le interpellanze urgenti hanno un giorno fisso in calendario e quasi sempre una risposta. Le interrogazioni scritte, le più numerose, l'hanno avuta in circa un caso su cinque.</p>
      {tipi}
      <p class="nota">Giorni: mediana dei giorni tra presentazione e risposta, per gli atti che l'hanno avuta.</p>
      <h3>Anno per anno</h3>
      <p>Quota di atti con risposta per anno di presentazione, question time escluso. Gli atti più vecchi hanno avuto più tempo.</p>
      {anni}
    </section>
    <section><div class="occhiello">Ministero per Ministero</div><h2>Chi risponde e chi no</h2>
      <p>Ogni atto è contato una volta, per il Ministero delegato a rispondere; question time escluso. Clicca sul titolo di una colonna per ordinare.</p>
      {tab_m}
      <p class="nota">Atti: quelli ricevuti dal Ministero. Giorni: mediana dei giorni tra presentazione e risposta. Scritte: quota con risposta tra le sole interrogazioni a risposta scritta, le più confrontabili tra Ministeri. Attesa &gt;1 anno: atti senza risposta presentati da più di un anno. Non in tabella: {", ".join(f'{esc(m["ministero"])} ({it(m["atti"])})' for m in piccoli)}, con meno di 20 atti.</p>
    </section>
    <section><div class="occhiello">Di cosa parlano</div><h2>{len(temi)} temi, dalle strade alle carceri</h2>
      <p>Numero di atti per tema (question time compreso) e quota con risposta (question time escluso). Sotto, per ogni tema, che cosa chiedono più spesso i parlamentari, con tre esempi.</p>
      {barre_temi}
      {"".join(blocchi)}
    </section>
    <section><div class="occhiello">I territori</div><h2>Le Regioni più nominate</h2>
      <p>Atti che nominano la Regione, una sua città sopra i 15.000 abitanti o un aggettivo regionale; un atto può nominarne più d'una. La quota di risposte è calcolata senza question time.</p>
      {barre_reg}
    </section>
    <section><div class="occhiello">Come l'abbiamo letto</div><h2>Metodo e limiti</h2>
      {d.metodo(letti, come, limiti, data_it)}
    </section>
    <section><div class="occhiello">Fonti</div><h2>Fonti</h2>
      {d.fonti(F.elenco)}
    </section>'''
    intro = ('Deputati e senatori fanno ogni anno migliaia di domande al Governo. Il Polpo le ha lette tutte, dall\'inizio della legislatura: '
             'quante ricevono risposta, Ministero per Ministero, in quanto tempo, e di cosa parlano.')
    pagina_html = d.pagina('../../', 'Le domande senza risposta',
                           'Le interrogazioni dei parlamentari al Governo nella XIX legislatura: quante ricevono risposta, Ministero per Ministero, in quanto tempo e di cosa parlano.',
                           'Il Polpo legge per te · interrogazioni e interpellanze', 'Le domande senza risposta', intro, corpo, braccio=4, css_extra=CSS_EXTRA)
    os.makedirs(CARTELLA, exist_ok=True)
    open(os.path.join(CARTELLA, 'index.html'), 'w', encoding='utf-8').write(pagina_html)
    print('legge/interrogazioni/index.html scritta', file=sys.stderr)


if __name__ == '__main__':
    if '--scarica' in sys.argv:
        scarica()
    if '--solo-pagina' in sys.argv:   # rifà solo la pagina dai derivati già scritti
        R = json.load(open(os.path.join(DATI, 'riepilogo.json'), encoding='utf-8'))
        sintesi = json.load(open(os.path.join(DATI, 'sintesi.json'), encoding='utf-8'))
        C = json.load(open(os.path.join(DATI, 'atti.json'), encoding='utf-8'))
        atti = [{'ramo': r[0], 'num': r[1], 'inizio': datetime.date.fromisoformat(r[3]) if r[3] else None,
                 'risposta': r[5] == 'r', 'chiuso_senza': r[5] == 'c'} for r in C['atti']]
    else:
        R, sintesi, atti = elabora()
    if '--solo-dati' not in sys.argv:
        scrivi_pagina(R, sintesi, atti)
