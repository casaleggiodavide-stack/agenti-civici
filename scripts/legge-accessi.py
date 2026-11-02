#!/usr/bin/env python3
"""Il Polpo legge per te: «Cosa chiedono gli italiani alla PA».

Legge i registri degli accessi (accesso civico semplice, generalizzato/FOIA e documentale) pubblicati
dalle amministrazioni in «Amministrazione trasparente», li porta in una tabella comune e scrive
legge/accessi/index.html con la cornice comune di scripts/dossier.py.

Uso:
  python3 -I scripts/legge-accessi.py              # scrive solo la pagina dai dati già pronti
  ~/dati-civici/accessi/.venv/bin/python -I scripts/legge-accessi.py --scarica
                                                    # riscarica i registri e rifà i dati, poi la pagina
  ... --scarica --forza                             # riscarica anche i file già presenti

--scarica legge PDF, Excel, ODS e CSV: servono pdfplumber, openpyxl e xlrd (pip install pdfplumber openpyxl xlrd).
Regole: robots.txt letto prima di ogni host e rispettato anche quando vieta solo gli agenti di intelligenza
artificiale; al massimo una richiesta al secondo; se un sito risponde con un blocco ci si ferma su quel sito.
I grezzi stanno in ~/dati-civici/accessi/ (fuori dal repository), i derivati in legge/accessi/dati/ (la tabella riga per riga, richieste.csv, resta nei grezzi).
Dai dati pubblicati si tolgono nomi, indirizzi e recapiti: il registro non dovrebbe contenerne, ma a volte succede.
"""
import argparse
import collections
import csv
import datetime
import html
import importlib.util
import io
import json
import os
import re
import statistics
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.robotparser
import zipfile
import xml.etree.ElementTree as ET

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GREZZI = os.path.expanduser('~/dati-civici/accessi')
CARTELLA = os.path.join(REPO, 'legge', 'accessi')
DATI = os.path.join(CARTELLA, 'dati')
UA = 'PolpoCivico/1.0 (+https://casaleggiodavide-stack.github.io/agenti-civici/)'
# Oltre al nostro nome e a «*», si rispettano i divieti rivolti ai programmi di intelligenza artificiale che usiamo:
# i loro nomi stanno in ~/dati-civici/accessi/agenti-ia.txt (uno per riga), fuori dal repository.
_P_AGENTI = os.path.join(GREZZI, 'agenti-ia.txt')
AGENTI = ['PolpoCivico', '*'] + ([a.strip() for a in open(_P_AGENTI, encoding='utf-8') if a.strip()] if os.path.exists(_P_AGENTI) else [])
sys.dont_write_bytecode = True


def _carica(nome, file):
    spec = importlib.util.spec_from_file_location(nome, os.path.join(REPO, 'scripts', file))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


# ---------------------------------------------------------------- gli enti

# id, nome, gruppo, pagina del registro, quali link scaricare (regex su testo+indirizzo del link)
ENTI = [
    ('pcm', 'Presidenza del Consiglio dei Ministri', 'Governo e Ministeri',
     'https://presidenza.governo.it/AmministrazioneTrasparente/AltriContenuti/AccessoCivico/', r'registro_accessi/(2024|2025|2026)/'),
    ('mef', 'Ministero dell\'Economia e delle Finanze', 'Governo e Ministeri',
     'https://www.mef.gov.it/operazione-trasparenza/altri_contenuti/foia/index.html', r'Anno(2024|2025)\.7z|Semestre2026'),
    ('mimit', 'Ministero delle Imprese e del Made in Italy', 'Governo e Ministeri',
     'https://www.mimit.gov.it/it/amministrazione-trasparente/altri-contenuti/accesso-civico/registro-degli-accessi', r'FOIA-2026|FOIA-2025|Anno_2024'),
    ('mur', 'Ministero dell\'Università e della Ricerca', 'Governo e Ministeri',
     'https://trasparenza.mur.gov.it/pagina770_accesso-civico.html', r'semestre (2024|2025|2026)'),
    ('mit', 'Ministero delle Infrastrutture e dei Trasporti', 'Governo e Ministeri',
     'http://www.mit.gov.it/node/7784', r'/(2025|2026)-0\d/[^ ]*(2024|2025)[^ ]*\.pdf'),
    ('giustizia', 'Ministero della Giustizia', 'Governo e Ministeri',
     'https://www.giustizia.it/giustizia/page/it/accesso_civico', r'registro_?accessi.*(2024|2025|2026)'),
    ('difesa', 'Ministero della Difesa', 'Governo e Ministeri',
     'https://www.difesa.it/amministrazione-trasparente/accessocivico/3007.html', r'registro_acg_iv_trim_anonimizzato|registro_acg__4_2025|registro_acg_2__trim_2026'),
    ('masaf', 'Ministero dell\'Agricoltura (MASAF)', 'Governo e Ministeri',
     'https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/11121', r'(2024|2025|2026).*E/ods'),
    ('cultura', 'Ministero della Cultura', 'Governo e Ministeri',
     'https://trasparenza.cultura.gov.it/contenuto89_registro-degli-accessi_770.html', r'Registro%20accesso%20civico'),
    ('inps', 'INPS', 'Enti nazionali',
     'https://www.inps.it/it/it/amministrazione-trasparente/altri-contenuti/accesso-civico/registro-degli-accessi.html',
     r'Registro accesso civico (semplice|generalizzato) (2024|2025|2026)'),
    ('istat', 'Istat', 'Enti nazionali',
     'https://www.istat.it/amministrazione-trasparente/altri-contenuti/accesso-civico/', r'Anno (2024|2025|2026)'),
    ('anac', 'ANAC (Autorità anticorruzione)', 'Autorità indipendenti',
     'https://www.anticorruzione.it/amministrazione-trasparente/altri-contenuti-accesso-civico/registrodegliaccessi', r'semestre anno (2024|2025|2026)'),
    ('consob', 'Consob', 'Autorità indipendenti',
     'https://www.consob.it/web/area-pubblica/altri-contenuti-accesso-civico', r'Registro accesso civico al 3[01] (dicembre (2024|2025)|giugno 2026)'),
    ('agcm', 'Antitrust (AGCM)', 'Autorità indipendenti',
     'https://www.agcm.it/autorita-trasparente/accesso-civico', None),
    ('lazio', 'Regione Lazio', 'Regioni e Comuni',
     'https://regione.lazio.it/amministrazione-trasparente/altri-contenuti-accesso-civico', r'2024_0\.ods|civici-2025\.pdf|civici-2026'),
    ('er', 'Regione Emilia-Romagna', 'Regioni e Comuni',
     'https://trasparenza.regione.emilia-romagna.it/altri-contenuti/accesso-civico', r'\.csv/@@download'),
    ('firenze', 'Comune di Firenze', 'Regioni e Comuni',
     'https://amministrazionetrasparente.comune.fi.it/pagina/amministrazione-trasparente-altri-contenuti/accesso-civico', r'anno (2024|2025|2026)'),
]
# file scaricati a mano perché la pagina li carica con uno script
EXTRA = {
    'agcm': ['https://www.agcm.it/dotcmsdoc/trasparenza/accesso-civico/Registro_degli_accessi_I_semestre_2025.pdf',
             'https://www.agcm.it/dotcmsdoc/trasparenza/accesso-civico/Registro_degli_accessi_II_Semestre_2025_def_pubblicazione.pdf'],
}
# pagine dell'Emilia-Romagna: una per anno
PAGINE_ANNO = {'er': ['https://trasparenza.regione.emilia-romagna.it/altri-contenuti/accesso-civico/registro-degli-accessi-2024',
                      'https://trasparenza.regione.emilia-romagna.it/altri-contenuti/accesso-civico/registro-degli-accessi-2025',
                      'https://trasparenza.regione.emilia-romagna.it/altri-contenuti/accesso-civico/registro-degli-accessi-2026']}
# anno del registro quando il nome del file non lo dice (o dice la data di pubblicazione)
ANNO_FILE = {
    'registro_acg_iv_trim_anonimizzato.pdf': 2024, 'registro_acg__4_2025.pdf': 2025, 'registro_acg_2__trim_2026.pdf': 2026,
    'REGISTRO-ACCESSI-30.01.2025_0.pdf': 2024, '2026.01.28-REGISTRO-ACCESSI.pdf': 2025, 'REGISTRO-ACCESSI-30.10.2026.pdf': 2026,
    'Registro degli accessi MIC_ al 17 luglio 2024 1.xls': 2024,
}

# Chi non c'è e perché (verificato il 2 novembre 2026): anche questo è un risultato.
NON_TROVATI = [
    ('Ministero dell\'Interno', 'non pubblica', 'La pagina «Registro degli accessi» c\'è ma dice «pagina in costruzione»: il Ministero scrive che il registro è una soluzione «suggerita, non avente carattere obbligatorio» e che un sistema informatico è «in fase di progettazione».',
     'https://www.interno.gov.it/it/amministrazione-trasparente/altri-contenuti-accesso-civico/registro-accessi'),
    ('INAIL', 'non leggibile da programmi', 'Il file robots.txt del sito vieta a tutti i programmi di leggere la sezione «Amministrazione trasparente» e la cartella dei suoi documenti. Abbiamo rispettato il divieto: il registro si può guardare solo a mano.',
     'https://www.inail.it/robots.txt'),
    ('Ministero del Lavoro', 'non leggibile da programmi', 'Il robots.txt del sito vieta l\'accesso agli assistenti di intelligenza artificiale: abbiamo rispettato il divieto.',
     'https://www.lavoro.gov.it/robots.txt'),
    ('Agenzia delle Entrate', 'sito chiuso ai programmi', 'Il sito risponde «Access Denied» anche alla richiesta del robots.txt: ci siamo fermati.',
     'https://www.agenziaentrate.gov.it/'),
    ('Agenzia delle Dogane e dei Monopoli', 'sito chiuso ai programmi', 'Il sito risponde «Access Denied» anche alla richiesta del robots.txt: ci siamo fermati.',
     'https://www.adm.gov.it/'),
    ('Ministero dell\'Ambiente (MASE)', 'sito chiuso ai programmi', 'Il sito risponde «Access Denied» anche alla richiesta del robots.txt: ci siamo fermati.',
     'https://www.mase.gov.it/'),
    ('Ministero degli Esteri', 'sito chiuso ai programmi', 'Il sito rimanda a una verifica anti-robot (Radware): ci siamo fermati.',
     'https://www.esteri.it/'),
    ('Ministero della Salute', 'sito chiuso ai programmi', 'Il sito mostra una pagina di «verifica del sito» che richiede un browser: ci siamo fermati.',
     'https://www.salute.gov.it/'),
    ('Ministero dell\'Istruzione e del Merito', 'non trovato', 'Nella sezione «Amministrazione trasparente» non abbiamo trovato un registro degli accessi scaricabile.',
     'https://www.mim.gov.it/web/guest/amministrazione-trasparente'),
    ('Ministero del Turismo', 'non trovato', 'La sezione «Amministrazione trasparente» si carica solo con uno script: non abbiamo trovato il registro in forma leggibile.',
     'https://www.ministeroturismo.gov.it/amministrazione-trasparente/'),
    ('Regione Lombardia', 'non trovato', 'Il registro non compare nella sezione trasparenza raggiungibile dal sito istituzionale.',
     'https://www.regione.lombardia.it/'),
    ('Comune di Milano', 'non leggibile da programmi', 'Il robots.txt vieta a tutti i programmi la sezione «Amministrazione trasparente»: abbiamo rispettato il divieto.',
     'https://www.comune.milano.it/robots.txt'),
    ('Roma Capitale', 'non leggibile da programmi', 'Il robots.txt vieta a tutti i programmi la sezione «Amministrazione trasparente»: abbiamo rispettato il divieto.',
     'https://www.comune.roma.it/robots.txt'),
]
# Registri trovati ma vecchi o parziali
VECCHI = {
    'cultura': 'Il registro pubblicato si ferma al 17 luglio 2024 (file Excel con le richieste dal 2022): non ci sono dati più recenti.',
    'lazio': 'Il «report» indica solo la materia (es. «sanità», «ambiente»), non l\'oggetto della richiesta né il motivo del diniego.',
    'agcm': 'L\'oggetto è indicato solo per materia (es. «richiesta in materia di concorrenza»); la pagina carica i file con uno script e abbiamo potuto leggere solo i due registri del 2025.',
    'masaf': 'Registro molto breve; per il secondo semestre 2024 manca la categoria dell\'esito (solo «sì/no»).',
}


# ---------------------------------------------------------------- rete (solo con --scarica)

_ultima = [0.0]
_robots = {}


class Bloccato(Exception):
    pass


def _attendi():
    d = time.time() - _ultima[0]
    if d < 1.1:
        time.sleep(1.1 - d)
    _ultima[0] = time.time()


def _get(url, timeout=90):
    """GET con curl (certificati verificati dal sistema), redirect seguiti. Ritorna (codice, tipo, byte, url finale)."""
    url = urllib.parse.quote(url, safe=":/?&=%#@+,;~!$'()*[]")
    _attendi()
    with tempfile.NamedTemporaryFile(delete=False) as f:
        tmp = f.name
    try:
        r = subprocess.run(['curl', '-sS', '-L', '--max-redirs', '5', '-m', str(timeout), '-A', UA, '-o', tmp,
                            '-w', '%{http_code}\t%{content_type}\t%{url_effective}', url], capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(r.stderr.strip()[:150])
        codice, tipo, finale = (r.stdout.split('\t') + ['', ''])[:3]
        corpo = open(tmp, 'rb').read()
    finally:
        os.unlink(tmp)
    return int(codice or 0), tipo, corpo, finale


def permesso(url):
    p = urllib.parse.urlparse(url)
    base = f'{p.scheme}://{p.netloc}'
    if base not in _robots:
        codice, _, corpo, _ = _get(base + '/robots.txt', 30)
        if codice in (401, 403) or b'Access Denied' in corpo[:600]:
            raise Bloccato(f'{base}: robots.txt risponde {codice} / Access Denied')
        testo = corpo.decode('utf-8', 'replace') if codice == 200 and b'<html' not in corpo[:500].lower() else ''
        rp = urllib.robotparser.RobotFileParser()
        rp.parse(testo.splitlines())
        _robots[base] = rp
    rp = _robots[base]
    return [a for a in AGENTI if not rp.can_fetch(a, url)]


def prendi(url):
    vietati = permesso(url)
    if vietati:
        raise Bloccato(f'robots.txt vieta {url} a {", ".join(vietati)}')
    codice, tipo, corpo, finale = _get(url)
    if codice >= 400:
        raise RuntimeError(f'HTTP {codice} per {url}')
    if 'perfdrive' in finale or b'Site verification' in corpo[:3000] or b'<TITLE>Access Denied' in corpo[:600]:
        raise Bloccato(f'verifica anti-robot su {url}')
    return tipo, corpo, finale


def collegamenti(corpo, base):
    t = corpo.decode('utf-8', 'replace')
    for m in re.finditer(r'<a\s[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', t, re.S | re.I):
        h = urllib.parse.urljoin(base, html.unescape(m.group(1)))
        tx = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', m.group(2)))).strip()
        yield h, tx


def nome_file(ente, url, testo, tipo):
    p = urllib.parse.unquote(urllib.parse.urlparse(url).path).replace('/@@download/file', '')
    pezzi = [x for x in p.split('/') if x]
    con_est = [x for x in pezzi if re.search(r'\.(pdf|xlsx?|ods|csv|7z|zip)$', x, re.I)]
    if 'ServeAttachment' in url:
        return re.sub(r'\W+', '_', testo)[:80].strip('_') + '.ods'
    if con_est:
        return con_est[-1]
    est = '.pdf' if 'pdf' in tipo else '.bin'
    return re.sub(r'\W+', '_', testo or pezzi[-1])[:80].strip('_') + est


def scarica(forza=False):
    """Scarica i registri; ritorna l'indice {percorso relativo: {ente, url, titolo, pagina}}."""
    p_indice = os.path.join(GREZZI, 'indice.json')
    indice = json.load(open(p_indice, encoding='utf-8')) if os.path.exists(p_indice) else {}
    problemi = {}
    for ente, nome, _, pagina, scegli in ENTI:
        cartella = os.path.join(GREZZI, ente)
        os.makedirs(cartella, exist_ok=True)
        links = [(u, os.path.basename(u)) for u in EXTRA.get(ente, [])]
        try:
            for pag in PAGINE_ANNO.get(ente, [pagina]):
                if not scegli:
                    break
                try:
                    _, corpo, finale = prendi(pag)
                except RuntimeError as e:
                    print('  ', ente, e)
                    continue
                visti = set()
                for h, tx in collegamenti(corpo, finale):
                    if '#' in h or h in visti or not re.search(scegli, tx + ' ' + h):
                        continue
                    visti.add(h)
                    links.append((h, tx))
            for h, tx in links:
                f = nome_file(ente, h, tx, '')
                if f.endswith('.bin') and os.path.exists(os.path.join(cartella, f[:-4] + '.pdf')):
                    f = f[:-4] + '.pdf'
                dest = os.path.join(cartella, f)
                if forza or not os.path.exists(dest):
                    tipo, corpo, _ = prendi(h)
                    if f.endswith('.bin') and corpo[:4] == b'%PDF':
                        f = f[:-4] + '.pdf'
                        dest = os.path.join(cartella, f)
                    open(dest, 'wb').write(corpo)
                    print(f'   {ente}: {f} ({len(corpo) // 1024} KB)')
                    if f.endswith('.7z'):
                        sotto = dest[:-3]
                        os.makedirs(sotto, exist_ok=True)
                        subprocess.run(['bsdtar', '-xf', dest, '-C', sotto], check=True)
                indice[os.path.relpath(dest, GREZZI)] = {'ente': ente, 'url': h, 'titolo': tx, 'pagina': pagina}
        except Bloccato as e:
            problemi[ente] = str(e)
            print('  BLOCCO', ente, e)
    # i file dentro gli archivi .7z ereditano l'indirizzo dell'archivio
    for rel, v in list(indice.items()):
        if rel.endswith('.7z'):
            sotto = os.path.join(GREZZI, rel[:-3])
            for f in sorted(os.listdir(sotto)) if os.path.isdir(sotto) else []:
                indice[os.path.relpath(os.path.join(sotto, f), GREZZI)] = dict(v, archivio=True)
    json.dump(indice, open(p_indice, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return indice, problemi


# ---------------------------------------------------------------- lettura delle tabelle

def _pulisci(x):
    if x is None:
        return ''
    if hasattr(x, 'strftime'):
        return x.strftime('%d/%m/%Y')
    if isinstance(x, float) and x.is_integer():
        x = int(x)
    return re.sub(r'\s+', ' ', str(x)).strip()


def _da_pdf(f):
    import pdfplumber
    righe = []
    with pdfplumber.open(f) as pdf:
        for p in pdf.pages:
            for t in p.extract_tables() or []:
                righe.extend([_pulisci(c) for c in r] for r in t)
    return righe


def _da_xlsx(f):
    import openpyxl
    wb = openpyxl.load_workbook(f, read_only=True, data_only=True)
    out = []
    for ws in wb.worksheets:
        out.extend([_pulisci(c) for c in r] for r in ws.iter_rows(values_only=True))
    return out


def _da_xls(f):
    import xlrd
    wb = xlrd.open_workbook(f)
    out = []
    for sh in wb.sheets():
        for i in range(sh.nrows):
            riga = []
            for j in range(sh.ncols):
                c = sh.cell(i, j)
                if c.ctype == xlrd.XL_CELL_DATE:
                    try:
                        riga.append(xlrd.xldate_as_datetime(c.value, wb.datemode).strftime('%d/%m/%Y'))
                        continue
                    except Exception:
                        pass
                riga.append(_pulisci(c.value))
            out.append(riga)
    return out


def _da_ods(f):
    T = '{urn:oasis:names:tc:opendocument:xmlns:table:1.0}'
    O = '{urn:oasis:names:tc:opendocument:xmlns:office:1.0}'
    P = '{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p'
    x = ET.fromstring(zipfile.ZipFile(f).read('content.xml'))
    out = []
    for tab in x.iter(T + 'table'):
        for tr in tab.iter(T + 'table-row'):
            riga = []
            for tc in tr:
                if tc.tag not in (T + 'table-cell', T + 'covered-table-cell'):
                    continue
                rip = int(tc.get(T + 'number-columns-repeated', '1'))
                v = tc.get(O + 'date-value') or ''
                v = '/'.join(reversed(v[:10].split('-'))) if v else ' '.join(''.join(p.itertext()) for p in tc.iter(P))
                riga.extend([_pulisci(v)] * min(rip, 60))
            while riga and not riga[-1]:
                riga.pop()
            if riga:
                out.append(riga)
    return out


def _da_csv(f):
    b = open(f, 'rb').read()
    for enc in ('utf-8-sig', 'cp1252'):
        try:
            t = b.decode(enc)
            break
        except UnicodeDecodeError:
            pass
    d = csv.Sniffer().sniff(t[:5000], delimiters=';,\t')
    return [[_pulisci(c) for c in r] for r in csv.reader(io.StringIO(t), d)]


def _da_pdf_ancore(f, colonne):
    """PDF senza righe di tabella (Istat): le colonne si ricavano dalla posizione delle intestazioni,
    ogni riga di testo va al record la cui riga «ancora» (numero + data) è più vicina in verticale."""
    import pdfplumber
    righe = []
    with pdfplumber.open(f) as pdf:
        bordi = None
        for p in pdf.pages:
            parole = p.extract_words(keep_blank_chars=False, use_text_flow=False)
            alto = [w for w in parole if w['top'] < p.height * 0.45]
            testa, prima = {}, -1
            for nome, rx in colonne:               # da sinistra a destra: ogni intestazione dopo la precedente
                cand = [w for w in alto if re.fullmatch(rx, w['text'], re.I) and w['x0'] > prima + 5]
                if not cand:
                    break
                w = min(cand, key=lambda w: w['x0'])
                testa[nome], prima = w['x0'], w['x0']
            if len(testa) == len(colonne):
                xs = [testa[n] for n, _ in colonne]
                bordi = [x - 4 for x in xs] + [1e9]
                scelte = [w for w in alto if w['x0'] in xs and any(re.fullmatch(rx, w['text'], re.I) for _, rx in colonne)]
                y_testa = max(w['bottom'] for w in scelte) + 30      # l'intestazione va a capo su 2-4 righe
            elif bordi is None:
                continue
            else:
                y_testa = 0
            linee = collections.defaultdict(list)
            for w in parole:
                if w['top'] <= y_testa + 2:
                    continue
                linee[round(w['top'] / 3)].append(w)
            ancore = []
            for k, ws in sorted(linee.items()):
                c0 = ' '.join(w['text'] for w in ws if w['x0'] < bordi[1])
                c1 = ' '.join(w['text'] for w in ws if bordi[1] <= w['x0'] < bordi[2])
                if re.match(r'^\d+\.?$', c0.strip()) and re.search(r'\d{1,2}/\d{1,2}/\d{2,4}', c1):
                    ancore.append(k)
            if not ancore:
                continue
            recs = {a: [[] for _ in colonne] for a in ancore}
            for k, ws in sorted(linee.items()):
                a = min(ancore, key=lambda x: abs(x - k))
                if abs(a - k) > 40:
                    continue
                for w in sorted(ws, key=lambda w: w['x0']):
                    i = max(j for j in range(len(colonne)) if w['x0'] >= bordi[j] or j == 0)
                    recs[a][i].append(w['text'])
            for a in ancore:
                righe.append([' '.join(c) for c in recs[a]])
    return [[n for n, _ in colonne]] + righe


def leggi_file(percorso):
    e = percorso.lower().rsplit('.', 1)[-1]
    if e == 'xls' and open(percorso, 'rb').read(2) == b'PK':
        e = 'xlsx'
    if '/istat/' in percorso:
        if 'documentale' in percorso:
            col = [('num', r'Num\.?'), ('data di arrivo', r'Data'), ('oggetto', r'PROCEDIMENTO'), ('esito', r'ESITO'),
                   ('data provvedimento', r'DATA'), ('sintesi della motivazione', r'MOTIVAZIONE')]
        else:
            col = [('num', r'Num\.?'), ('data di arrivo', r'DATA'), ('oggetto', r'OGGETTO'), ('controinteressati', r'NOTIFICA|CONTRO-?'),
                   ('esito', r'ESITO'), ('data provvedimento', r'ESTREMI'), ('sintesi della motivazione', r'SINTESI'), ('riesame', r'RIESAME')]
        return _da_pdf_ancore(percorso, col)
    return {'pdf': _da_pdf, 'xlsx': _da_xlsx, 'xls': _da_xls, 'ods': _da_ods, 'csv': _da_csv}[e](percorso)


# ---------------------------------------------------------------- normalizzazione

MESI = {'gen': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'mag': 5, 'giu': 6, 'lug': 7, 'ago': 8, 'set': 9, 'ott': 10, 'nov': 11, 'dic': 12}


def data_iso(s):
    """Prima data valida dentro il testo -> 'AAAA-MM-GG' (o '')."""
    if not s:
        return ''
    s = s.replace('. ', '.').lower()
    modi = [(r'(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)', lambda m: (int(m[1]), int(m[2]), int(m[3]))),
            (r'(?<!\d)(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4}|\d{2})(?!\d)', lambda m: (int(m[3]), int(m[2]), int(m[1]))),
            (r'(?<!\d)(\d{1,2})[\- ]([a-z]{3})[a-z]*[\- ](\d{4}|\d{2})(?!\d)', lambda m: (int(m[3]), MESI.get(m[2], 0), int(m[1])))]
    for rx, f in modi:
        for m in re.finditer(rx, s):
            a, me, g = f(m)
            if a < 100:
                a += 2000
            if not 2015 <= a <= 2027 or not me:
                continue
            try:
                return datetime.date(a, me, g).isoformat()
            except ValueError:
                continue
    return ''


def esito_norm(s, ente=''):
    t = (s or '').strip().lower()
    if ente == 'mit' and t in ('a', 'p', 'r', 'ap', 'i', 'd'):
        return {'a': 'accolto', 'p': 'accolto in parte', 'ap': 'accolto in parte', 'r': 'rifiutato', 'd': 'differito'}.get(t, 'archiviato/altro')
    if not t:
        return ''
    if re.search(r'parzial|in parte|diniego parziale', t):
        return 'accolto in parte'
    if re.search(r'differ', t):
        return 'differito'
    if re.search(r'non accolt|non accoglibil|diniego|rifiut|negativ|respint|^no\b|rigett', t):
        return 'rifiutato'
    if re.search(r'accol|accogli|positiv|^si\b|^sì\b|rilasci|evas|già pubblicat|pubblicat|fornit|trasmessi i|consegnat', t):
        return 'accolto'
    return 'archiviato/altro'


def tipo_norm(s):
    t = (s or '').lower()
    if re.search(r'documental|241|accesso atti|accesso agli atti|dati personali|art\.? ?22', t):
        return 'documentale'
    if re.search(r'generalizzat|foia|comma 2|c\. ?2|co\. ?2', t):
        return 'generalizzato'
    if re.search(r'semplice|comma 1|c\. ?1\b|co\. ?1\b', t):
        return 'semplice'
    return ''


# colonne: nome normalizzato -> parole dell'intestazione (si scartano riesame e ricorso)
COLONNE = [
    ('data_richiesta', r'data (di )?(arrivo|presentazione|richiesta|ricezione|istanza)|datacreazione|^data$|^data protocollo$'),
    ('data_risposta', r'data (del )?(provvedimento|decisione|risposta|di risposta|riscontro|esito|effettiva risposta)|dataesito$|^provvedimento$|^estremi|^data$|data provvedime'),
    ('oggetto', r'oggetto|materia'),
    ('esito', r'^esito|tipo ?esito$|esito (della richiesta|dell.istanza|istanza|prima trattazione|\(\d\))|^e ?s ?i ?t ?o'),
    ('motivazione', r'sintesi (della )?motivazione|motivo rifiuto|ragioni del mancato|sintesimotivazione$|sintesi esiti|eccezioni/limiti|^motivazione'),
    ('tipo', r'^tipologia( di accesso)?$|tipo di accesso|^tipologia accesso'),
    ('richiedente', r'tipologia richiedente|categoria ?richiedente|^richiedente$|^mittente$'),
]
CATEGORIE_RICHIEDENTE = r'cittadin|privat|giornalist|associaz|impres|avvocat|sindacal|ricercat|accadem|professionist|^ente|amministrazion|altro|soggetto|organizzazion|studente|consiglier|onlus|societ|ordine|persona fisica|persona giuridica|rappresentant|categoria|parlamentar|comitat'


def _compatta(h):
    h = re.sub(r'\b\w(?: \w\b){2,}', lambda m: m.group(0).replace(' ', ''), h)
    return h.replace('d ata', 'data').replace('presentazi one', 'presentazione')


# per le intestazioni spezzate a metà parola («provvedim ento»): si riprova senza spazi
COLONNE_SENZA_SPAZI = [
    ('data_richiesta', r'^data(di)?(arrivo|presentazione|richiesta|ricezione|istanza)'),
    ('data_risposta', r'^data(del)?(provvedim|decisione|risposta|riscontro|esito)'),
]


def _intestazione(righe):
    """Trova la riga di intestazione (eventualmente spezzata su più righe) e la mappa colonna -> campo."""
    for i, r in enumerate(righe[:40]):
        testo = _compatta(' '.join(r).lower())
        if not (re.search(r'oggetto|materia|richiesta di accesso', testo) and re.search(r'data|esito', testo)) or len([c for c in r if c]) < 3 \
                or any(data_iso(c) for c in r):
            continue
        # unisce fino a 3 righe sopra e sotto finché non compaiono date (intestazioni su più righe)
        inizio, fine = i, i + 1
        while inizio > 0 and i - inizio < 3 and not any(data_iso(c) for c in righe[inizio - 1]) and len(' '.join(righe[inizio - 1])) < 200 \
                and len([c for c in righe[inizio - 1] if c]) >= 2:
            inizio -= 1
        while fine < len(righe) and fine - i < 3 and not any(data_iso(c) for c in righe[fine]) and all(len(c) < 45 for c in righe[fine]):
            fine += 1
        n = max(len(x) for x in righe[inizio:fine])
        testa = [' '.join(x[j] for x in righe[inizio:fine] if j < len(x) and x[j]).lower() for j in range(n)]
        testa = [re.sub(r'\s+', ' ', re.sub(r'\(\d\)|\d+$', '', h.replace('ns1:', ''))).strip() for h in testa]
        testa = [re.sub(r'/{2,}|={2,}|-{3,}', '', h).strip() for h in testa]
        testa = [_compatta(h) for h in testa]                                        # «d a t a» -> «data», «e s i t o» -> «esito»
        testa = [re.sub(r'presentazi one', 'presentazione', h) for h in testa]
        mappa = {}
        for j, h in enumerate(testa):
            if re.search(r'riesame|ricorso|tar\b|giudice|scadenza|riferimento|direzione|struttura|ufficio|ente interess|notifica|n\. ?procedimento', h) and not h.startswith('oggetto'):
                continue
            for campo, rx in COLONNE + COLONNE_SENZA_SPAZI:
                hh = h.replace(' ', '') if (campo, rx) in COLONNE_SENZA_SPAZI else h
                if re.search(rx, hh) and campo not in mappa:
                    if campo == 'data_risposta' and h == 'data' and 'data_richiesta' not in mappa:
                        continue
                    if campo == 'data_richiesta' and h == 'data' and 'data_richiesta' in mappa:
                        continue
                    mappa[campo] = j
                    break
        return fine, testa, mappa
    return None, [], {}


RIPIEGO = {'firenze': {'data_richiesta': 0, 'oggetto': 1, 'esito': 3, 'data_risposta': 4},
           'er': {'oggetto': 1, 'data_richiesta': 3, 'data_risposta': 4, 'esito': 5, 'motivazione': 6}}


def _sezione(r):
    """Righe-titolo dentro la tabella che cambiano il tipo di accesso (es. «ACCESSO CIVICO GENERALIZZATO»)."""
    pieni = [c for c in r if c]
    if len(pieni) == 1 and len(pieni[0]) < 120 and re.search(r'accesso|foia', pieni[0], re.I) and not data_iso(pieni[0]):
        return tipo_norm(pieni[0]) or None
    return None


def normalizza_file(percorso, meta):
    """Una lista di richieste normalizzate dal file."""
    ente = meta['ente']
    nome = os.path.basename(percorso)
    righe = [r for r in leggi_file(percorso) if any(r)]
    anno = ANNO_FILE.get(nome)
    if not anno:
        anni = re.findall(r'(?<!\d)(202[3-7])(?!\d)', nome + ' ' + meta.get('titolo', ''))
        anno = int(anni[-1]) if anni else None
    f_low = (nome + ' ' + meta.get('titolo', '')).lower()
    tipo_file = ('documentale' if re.search(r'docum|241', f_low) else
                 'semplice' if re.search(r'semplic', f_low) and not re.search(r'generalizz|foia', f_low) else
                 'generalizzato' if re.search(r'generalizz|foia', f_low) else '')
    if ente in ('mef', 'masaf', 'anac', 'giustizia') and not tipo_file:
        tipo_file = 'generalizzato'
    if ente == 'istat' and not tipo_file:
        tipo_file = 'civico (semplice o generalizzato)'
    if ente == 'agcm':
        tipo_file = 'generalizzato'
    fine, testa, mappa = _intestazione(righe)
    if ente == 'difesa' and anno == 2024:          # colonne spostate di due nel file del 2024
        fine, mappa = 2, {'data_richiesta': 1, 'richiedente': 2, 'oggetto': 3, 'esito': 8, 'data_risposta': 9}
    if fine is None and ente in RIPIEGO:          # file senza riga di intestazione: stesse colonne degli altri anni
        fine, mappa = 0, RIPIEGO[ente]
    if fine is None:
        return [], f'intestazione non trovata in {nome}'
    # INPS: esito in tre colonne con una X
    colonne_x = [(j, h) for j, h in enumerate(testa) if re.search(r'esito', h) and re.search(r'accogli|diniego|^esito$', h)] if ente == 'inps' else []
    # Consob: l'oggetto sta nella colonna FOIA o in quella dell'accesso semplice
    consob = [(j, h) for j, h in enumerate(testa) if 'richiesta di accesso' in h] if ente == 'consob' else []
    # MASAF 2024: le eccezioni dell'art. 5-bis sono colonne vero/falso
    flag_5bis = [(j, h) for j, h in enumerate(testa) if re.fullmatch(r'[a-z_]+', h) and '_' in h] if ente == 'masaf' else []
    out, tipo_sez = [], None
    for r in righe[fine:]:
        s = _sezione(r)
        if s is not None or (len([c for c in r if c]) == 1 and re.search(r'accesso civico generalizzato|accesso civico semplice', ' '.join(r), re.I)):
            tipo_sez = s or tipo_norm(' '.join(r))
            continue
        testo_riga = ' '.join(r).lower()
        if re.search(r"oggetto dell.istanza|oggetto della richiesta|^n\. data di arrivo", testo_riga) and not data_iso(testo_riga):
            continue
        g = lambda campo: r[mappa[campo]] if campo in mappa and mappa[campo] < len(r) else ''
        dr = data_iso(g('data_richiesta'))
        ogg = g('oggetto')
        if consob:
            pieni = [(h, r[j]) for j, h in consob if j < len(r) and r[j]]
            if pieni:
                ogg = pieni[0][1]
                tipo_sez = 'semplice' if 'semplice' in pieni[0][0] else 'generalizzato'
            else:
                tipo_sez = 'generalizzato'
        if not dr:
            # riga di continuazione (testo che va a capo su più righe della tabella)
            if out and (ogg or g('motivazione')) and not re.search(r'nessuna istanza', testo_riga):
                if ogg and ogg not in out[-1]['oggetto']:
                    out[-1]['oggetto'] = (out[-1]['oggetto'] + ' ' + ogg).strip()
                if g('motivazione') and g('motivazione') not in out[-1]['motivazione']:
                    out[-1]['motivazione'] = (out[-1]['motivazione'] + ' ' + g('motivazione')).strip()
            continue
        es_orig = g('esito')
        if colonne_x:
            segnate = [h for j, h in colonne_x if j < len(r) and r[j].strip().lower() == 'x']
            es_orig = ('diniego parziale' if any('parziale' in h for h in segnate) else
                       'diniego totale' if any('totale' in h for h in segnate) else
                       'accoglimento' if segnate else '')
        if ente == 'inps' and tipo_file == 'semplice':
            es_orig = 'accesso semplice: ' + g('motivazione')[:120]
        if data_iso(es_orig) and not re.search(r'[a-z]{4}', es_orig.lower()):
            for c in r:
                if re.fullmatch(r'(parziale )?(accoglimento|rifiuto|diniego)( parziale)?|accolt[ao].*|in trattazione.*', c.strip().lower()):
                    es_orig = c
                    break
        mot = g('motivazione')
        if flag_5bis:
            veri = [h.replace('_', ' ') for j, h in flag_5bis if j < len(r) and r[j].upper() in ('VERO', 'TRUE')]
            if veri:
                mot = (mot + ' [' + '; '.join(veri) + ']').strip()
        tipo = tipo_norm(g('tipo')) or tipo_sez or tipo_file
        if ente == 'mit':
            tipo = 'documentale' if re.search(r'241', ogg) else 'semplice' if re.search(r'semplice', ogg, re.I) else 'generalizzato'
            ogg = re.sub(r'^(civico generalizzato|accesso atti legge 241/90|accesso civico semplice|civico semplice)\s*-?\s*', '', ogg, flags=re.I)
        if ente == 'difesa':
            tipo = 'semplice' if re.match(r'ACS', r[0] or '') else 'generalizzato'
        if ente == 'inps' and tipo_file == 'semplice':
            tipo = 'semplice'
        richiedente = g('richiedente')
        if not re.search(CATEGORIE_RICHIEDENTE, richiedente, re.I) or len(richiedente) > 70:
            richiedente = ''
        out.append({
            'ente': ente, 'anno': anno, 'tipo': tipo or 'non indicato', 'data_richiesta': dr,
            'data_risposta': data_iso(g('data_risposta')), 'oggetto': ogg, 'esito_originale': es_orig,
            'motivazione': mot, 'richiedente': richiedente, 'file': nome,
        })
    for x in out:
        x['esito'] = esito_norm(x['esito_originale'], ente)
        if ente == 'inps' and x['tipo'] == 'semplice':
            x['esito'] = 'accolto' if re.search(r'è inquadrabile come istanza di accesso civico semplice', x['motivazione']) else 'archiviato/altro'
        if ente == 'cultura' and x['esito_originale'].lower().startswith('già pubblicat'):
            x['esito'] = 'accolto'
        if ente == 'cultura' and (x['data_richiesta'] or '')[:4] != '2024':
            x['scarta'] = True
    return [x for x in out if not x.get('scarta')], None


# ---------------------------------------------------------------- dati personali: via prima di pubblicare

_TITOLI = r'(?:sig\.?(?:ra|na)?|signor[ae]?|dott\.?(?:ssa)?|dr\.?|avv\.?(?:ocato)?|prof\.?(?:ssa)?|ing\.?|arch\.?|geom\.?|rag\.?|on\.|sen\.)'


NOMI = set('''adriana adriano agnese agostino alberto alessandra alessandro alessia alessio alfredo alice alma andrea angela angelo anna annalisa antonella antonio arianna arturo aurora barbara beatrice benedetta bruno camilla carla carlo carmela carmen carmine caterina cesare chiara cinzia claudia claudio concetta corrado cristian cristiana cristina daniela daniele dario davide debora denis diego domenico donatella edoardo elena eleonora elisa elisabetta emanuela emanuele emma enrico enzo erika ettore fabio fabrizio federica federico filippo flavia francesca francesco franco gabriele gabriella gaetano giacomo gianluca gianni gino giorgia giorgio giovanna giovanni giulia giuliana giuliano giulio giuseppe giuseppina gloria graziella guido ilaria irene italo ivan ivana jacopo laura lea leonardo letizia lidia lina lisa livia loredana lorena lorenzo luca lucia luciana luciano luigi luisa manuela marcello marco margherita maria mariangela marianna mario marisa marta martina massimo matteo mattia maurizio michela michele mirko monica nadia nicola nicoletta noemi orazio paola paolo patrizia pietro piero raffaele raffaella renato riccardo rita roberta roberto rocco rosa rosaria rossana rossella salvatore samuele sandra sara serena sergio silvana silvia simona simone sofia stefania stefano teresa tiziana tommaso ugo umberto valentina valeria valerio vanessa vincenzo virginia vittoria vittorio walter mihai ion ioan elena andrei mohamed mohammed ahmed ali omar youssef fatima john michael david maria jose juan carlos ana ivan sergei olga tatiana irina'''.split())


def _nascondi_nomi(t):
    """«Nome Cognome» / «Cognome Nome» con un nome di persona noto, e nomi dopo parole come «decesso», «sig.»"""
    def sost(m):
        a, b = m.group(1), m.group(2)
        if a.lower() in NOMI or b.lower() in NOMI:
            return '[nome omesso]'
        return m.group(0)
    t = re.sub(r"\b([A-ZÀ-Ý][a-zà-ÿ'’]{1,20}|[A-ZÀ-Ý]{2,20})\s+([A-ZÀ-Ý][a-zà-ÿ'’]{1,20}|[A-ZÀ-Ý]{2,20})\b", sost, t)
    t = re.sub(r"\b(decesso|morte|deceduto|defunto|de cuius|marittimo|militare|caporal\w*|appuntato|luogotenente|maresciallo|signor\w*)\s+(di\s+|del\s+)?(?:[A-ZÀ-Ý][\w'’]+\s*){2,3}", lambda m: m.group(1) + ' [nome omesso] ', t, flags=0)
    return t


def senza_dati_personali(t):
    """Toglie nomi preceduti da un titolo, nascita, residenza, indirizzi, recapiti e codici fiscali."""
    if not t:
        return t
    t = re.sub(r'[\w.+-]+@[\w-]+\.[\w.]+', '[recapito omesso]', t)
    t = re.sub(r'(?<!\d)(?:\+39\s?)?(?:0\d{1,3}|3\d{2})[\s./-]?\d{5,8}(?!\d)', '[recapito omesso]', t)
    t = re.sub(r'\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b', '[codice omesso]', t, flags=re.I)
    t = re.sub(r'\bIT\d{2}[A-Z]\d{10}[0-9A-Z]{12}\b', '[codice omesso]', t)
    t = re.sub(r'\b' + _TITOLI + r'\s+(?:[A-ZÀ-Ý][\w\'’]+|[A-Z]\.)(?:\s+(?:[A-ZÀ-Ý][\w\'’]+|[A-Z]\.)){0,3}', lambda m: m.group(0).split()[0] + ' [nome omesso]', t)
    t = re.sub(r'\b(nat[oa] a|residente (?:a|in)|domiciliat[oa] (?:a|in))\s+[^,;.()]{2,60}', r'\1 [omesso]', t, flags=re.I)
    t = re.sub(r'\b(via|viale|piazza|piazzale|corso|vicolo|largo|località|loc\.|contrada|strada)\s+[A-ZÀ-Ý][^,;()]{1,50}?\s*(?:n\.?\s*|civico\s*)?\d+\w?', r'\1 [indirizzo omesso]', t, flags=re.I)
    t = re.sub(r'\b(?:sig|signor|dott|avv)\w*\.?\s+[A-Z]{2,}(?:\s+[A-Z]{2,}){1,2}\b', '[nome omesso]', t)
    return _nascondi_nomi(t)


# ---------------------------------------------------------------- temi e motivi (leggendo gli oggetti)

# L'ordine conta: vince il primo tema che corrisponde. Le regole sono state scritte leggendo gli oggetti
# di tutti i registri e controllate su un campione (vedi sintesi.json, «metodo»).
TEMI = [
    ('trasporti', 'Trasporti, patenti e incidenti in mare e su strada',
     r'patent|c\.d\.s|\bcds\b|art\.? ?12[89]|esame (di )?guida|arruolament'),
    ('contributi', 'Contributi, bandi e fondi pubblici',
     r'contribut[oi](?! previdenzial)|finanziament|sovvenzion|bando (per|regional|piccoli|rigenerazion|tratta)|bando azione|bandi regional|griglie? di valutazione|nucleo di valutazione|domanda di aiuto|aiuto all|feamp|feasr|fesr|otto per mille|8x1000|pnrr|sostegno a progetti|incentiv|agevolaz|bonus|indennizz|erogazion|ristor[oi] (ai|per)|cas- sisma|cooperazione internazionale|patrocini|investimenti produttivi'),
    ('concorsi', 'Concorsi, selezioni e graduatorie',
     r'concors|graduatori|selezion|selettiv|interpell|mobilit[aà] (estern|intern|volontari)|avviso di mobilit|prov[ae] (scritt|oral|preselett|selett)|preselett|elaborat|tracce|candidat|commission\w* (esaminatric|giudicatric|di valutazione|di concorso)|vincitor|idone|\babilitazion|esame di stato|procedura comparativ|progression|sviluppi economici|scorriment|assunzion|reclutament|posti di|peo 20|magistratura|dossier prova'),
    ('trasporti', 'Trasporti, patenti e incidenti in mare e su strada',
     r'patent|sinistr|marittim|\bnav[ei]\b|natant|diporto|motopesca|peschereccio|imbarc|armator|inchiesta (formale|sommaria)|evento straordinario|eventi straordinari|autovelox|rilevatore della velocit|velox|safedrive|revisione art|art\.? ?12[89]|c\.d\.s|\bcds\b|codice della strada|veicol|motorizzazion|ferrovi|\btren[oi]\b|autostrad|aere[oi]|aeroport|\bvol[oi]\b|velivol|elicotter|porto|portual|capitaneri|incident|registro navi|trasporto pubblico|ztl|parchegg|sanzioni .*strada'),
    ('edilizia', 'Edilizia, immobili e territorio',
     r'cemento armato|\bcdm\b|c\.d\.m|edilizi|sanatoria|permesso di costruire|licenza edilizia|vincol|terren[oi]|immobil|fabbricat|demani|spiagg|urbanistic|catast|cantier|frazionamento|zona blu|piano regolatore|lottizzazion|abusiv|scia\b|agibilit|condon|alloggi|casa|case cantoniere|piazza|parco|restauro|riqualificazion|scuola don|scalinata'),
    ('ambiente', 'Ambiente, agricoltura, caccia e pesca',
     r'ambient|rifiut|inquinament|bonific|discaric|emission|falde|acque|idric|idrogeolog|fium|torrent|alluvion|frana|sismic|impiant\w* (eolic|fotovoltaic|di)|eolic|fotovoltaic|rigassificat|gasdott|energ|termovalorizz|valutazione di impatto|\bvia\b|\bvas\b|cave?\b|cave di|caccia|faunistic|venator|fauna|pesca|ittic|agricol|\buma\b|vitivinicol|tartuf|forest|deforest|alber|pino|pianta di|coltur|allevament|animal|canin|cani |gatti|razza|biomass|fitosanitar|xylella|clima'),
    ('sanita', 'Sanità, Covid e vaccini',
     r'sanit|salute|ospedal|\basl\b|\bausl\b|azienda usl|medic[oi]|farmac|vaccin|covid|sars|pandemi|malatti|pazient|liste d.attesa|prenotazion|pronto soccorso|\brsa\b|infermier|screening|tampon|terapeut|fecondazion|fertilit|disabilit|invalidit|handicap|\bfse\b|comitato tecnico scientifico'),
    ('giustizia', 'Giustizia, carceri e sicurezza',
     r'sentenz|tribunal|procur[ae]|giudizi|giudiziar|processo|procediment\w* penal|reat[oi]|detenut|carcer|penitenziar|istituti? penitenz|intercettazion|braccialett|misure cautelari|pene |condann|assoluzion|magistrat|notai|notaio|avvocat|cpr\b|rimpatri|migrant|sbarc|terroris|strage|mafia|antimafia|polizia|carabinier|forze dell.ordine|sequestr|videosorveglianza|immagini videoregistrate|body ?cam|armi\b|difesa|militar|f-35|eurofighter|typhoon|missione aerea|esercito'),
    ('vigilanza', 'Ispezioni, controlli, esposti e multe',
     r'ispezion|ispettiv|vigilanza|esposto|esposti|segnalazion|verbal\w* di (accertamento|ispezione|contestazione)|accertament|sanzion|ordinanza.{0,5}ingiunzion|ingiunzion|multa|contravvenzion|\bpvc\b|irregolarit|illecit|truff|reclam|uvif|uvcp|cooperativ|verifica di capienza'),
    ('appalti', 'Contratti, appalti e concessioni',
     r'appalt|\bgar[ae]\b|contratt|affidament|fornitor|fornitur|convenzion|\bcig\b|offert|aggiudica|concession|accordo quadro|capitolato|subappalt|stazione appaltante|bdncp|mepa|acquist|approvvigionament|sponsorizzazion|project financing|leonardo|lavori (di|pubblici)|opere (di|pubbliche)|progett[oi] (di|esecutiv)|ristorazione|pulizia|distributori automatici|quietanza|canone concessorio'),
    ('personale', 'Personale pubblico, dirigenti e nomine',
     r'personale|dipendent|incaric\w* (dirigenzial|di)|dirigent|retribuzion|stipend|trattamento economico|indennit|straordinar|organico|dotazione organica|pianta organica|sindacal|orario di lavoro|lavoro agile|smart working|nomin[ae]|consulen|collaborator|curricul|regolamento del personale|carriere|promozion|cda|consiglio (direttivo|di amministrazione)|commissari\w* straordinari|esperti?\b|formazione del personale|corsi di formazione'),
    ('pratiche', 'Pratiche personali e propri documenti',
     r'propri[ao]? |pratica|posizione (contributiva|assicurativa|previdenziale)|pension|previdenz|tfs\b|tfr\b|buonuscit|reddito di cittadinanza|assegno|naspi|cartella|cedolin|erede|de cuius|decedut|decesso|fascicolo|certificat|stato di famiglia|cittadinanza|permesso di soggiorno|visto|anagraf|riliquidazion|competenze economiche|risarciment|infortun|lavoratori|denunce contributive|avvisi di addebito|equipollenz|titolo di studio|scheda di valutazione'),
    ('dati', 'Dati, numeri e statistiche',
     r'\bdati\b|dato |statistic|numer[oi] (d|complessiv|total|annual)|quant[ie] |elenc[oh]|serie storic|percentual|monitoraggi|report|censiment|rilevazion|indicator|database|banca dati|dataset|tabell|prezzi|costi|spes[ae]|bilanc|rendicont|importi|ammontare|frequentazione|presenze'),
    ('istituzioni', 'Governo, organi politici e trasparenza',
     r'ministr[oi]|sottosegretar|gabinetto|consiglio dei ministri|parlament|governo|presidente|giunta|consiglio (regionale|comunale)|consiglier|assessor|sindaco|agenda|incontri|riunioni|lobby|portatori di interess|disegno di legge|decreto legge|pubblicazion|amministrazione trasparente|\bpiao\b|obblighi di pubblicazione|delibera cipe|cipess|ciae|fondazione|universit|ateneo|scuol|ricerca|istruzion|potere sostitutivo'),
    ('atti', 'Altri atti, decreti e pareri',
     r'decret|circolar|\bnot[ae]\b|nota prot|protocollo|verbal|delibera|determin|ordinanz|provvediment|parer[ei]|relazion|atti|atto|documentazion|document|corrispondenz|comunicazion|istruttori|regolament|direttiv|linee guida|copia'),
]
TEMA_ALTRO = ('altro', 'Richieste generiche o non classificabili')

MOTIVI = [
    ('economici', 'Interessi economici e commerciali', 'Segreti industriali e commerciali, proprietà intellettuale, interessi di imprese (art. 5-bis, comma 2, lett. c)',
     r'interessi economici|commercial|segreto industriale|segreti industriali|riservatezza (commerciale|industriale)|proprietà intellettuale|know.how|segreti tecnici|interessi_economici'),
    ('privacy', 'Dati personali di altre persone', 'Protezione dei dati personali di terzi (art. 5-bis, comma 2, lett. a)',
     r'dati personali|protezione dei dati|privacy|riservatezza|dati sensibil|gdpr|anonimizzazion|vita privata|protezione_dei_dati|2 ?terdecies'),
    ('sicurezza', 'Sicurezza, difesa e rapporti internazionali', 'Sicurezza pubblica e nazionale, difesa, relazioni internazionali (art. 5-bis, comma 1, lett. a-d)',
     r'sicurezza|ordine pubblico|difesa e questioni|questioni militari|relazioni internazionali|classificat|segreto di stato|relazioni_internazionali|difesa_e'),
    ('indagini', 'Indagini, processi e ispezioni', 'Indagini sui reati, atti trasmessi alla magistratura, attività ispettive (art. 5-bis, comma 1, lett. e-g)',
     r'indagin|penale|autorità giudiziaria|\ba\.?g\.?\b|procura|reat[oi]|polizia giudiziaria|ispettiv|contenzios|sub iudice|segreto istruttorio|atti giudiziari|funzione giurisdizional|conduzione_di_indagini|attivita_ispettive'),
    ('segreto', 'Segreti e divieti previsti dalla legge', 'Segreto d\'ufficio, segreto statistico e altri casi esclusi per legge (art. 5-bis, comma 3; art. 24 l. 241/1990)',
     r'segreto|art\.? ?24|esclus\w* dal diritto|sottrazione al diritto|sottratt\w* al diritto|sottratt\w* all.accesso|divieto di (divulgazione|accesso)|altri_divieti|riservat|parere legale|avvocatura|esclus[ao] ai sensi|5.? ?bis,? comma 3'),
    ('art5bis', 'Limiti dell\'art. 5-bis, senza dettaglio', 'Il registro cita solo l\'articolo 5-bis, senza dire quale interesse si protegge',
     r'5.?bis|5 bis'),
    ('in_corso', 'Pratica ancora in corso', 'Il documento riguarda un procedimento non concluso: spesso l\'accesso è rinviato (differito)',
     r'in corso|non (ancora )?conclus|non ancora|fase (istruttoria|endoprocedimentale|di sottoscrizione)|differit|differiment|perfezionament|atti preparatori|endoprocediment'),
    ('non_posseduto', 'Documento inesistente o non posseduto', 'L\'ufficio dice di non avere il documento o il dato, o di non averlo nella forma richiesta',
     r'non (è |sono |risulta |risultano |più )?(stabilmente )?(in possesso|detenut|nella disponibilit|agli atti|present)|non detien|non detenzion|non dispon|non sono disponibil|inesisten|non esist|non risult|indisponibil|non (è|sono) stat[oi] (prodott|redatt|adottat|rinvenut|trovat)|non è stato rinvenuto|mancanza (di atti|documentazion|degli atti)|assenza (della )?documentazion|impossibilità di fornire|non ci sono|informazione_non_esistente|documentazione non in possesso|non possesso|non vi sono|rinvenut|non possied|assenza (di |della )?documentazion|non (è stata )?trovat|parzialment\w* in possesso|non nella disponibilit|nono sono nella|non possiede|non ha erogato|non (sono )?posseduti|non sussistono gli atti|non sono emersi|non tutti i dati'),
    ('competenza', 'Competenza di un altro ente', 'La richiesta va rivolta a un\'altra amministrazione (spesso è stata inoltrata)',
     r'competen|altra amministrazione|altro (ente|dicastero)|formato da altra|rivolgersi|indirizzat\w* (al|alla|a )|va indirizzata|rimanda|rinvio (all|alle|al)|avanzate direttamente|organo segnalante|trasmess\w* (all|alla|al)|inoltrat|smistament|esclusiva disponibilit|rivolta all.amministrazione'),
    ('pubblicato', 'Già pubblicato o già consegnato', 'Il documento è già pubblico o era già stato dato: viene indicato dove trovarlo',
     r'già (oggetto di )?pubblicat|link|collegamento ipertestuale|pubblicat\w* (nella|sul|nel|presso)|presente sul mepa|consultabil|consultazione pubblica|già stat[ao] fornit|già trasmess|già in possesso|già nelle disponibilit|già concess'),
    ('incompleta', 'Domanda incompleta', 'Manca la firma, il documento d\'identità, il modulo o un\'integrazione chiesta dall\'ufficio',
     r'firma|sottoscrizion|document\w* d.identit|document\w* di riconoscimento|modulo|integrazion\w* (documental|richiest)|mancata integrazione|nessun riscontro alla richiesta|incomplet|modulistica|dichiarazione sostitutiva|requisiti minimi'),
    ('generica', 'Richiesta generica, massiva o da elaborare', 'Richieste troppo ampie o poco precise, o che costringerebbero l\'ufficio a creare dati nuovi',
     r'generic|massiv|onero|sproporzion|irragionevol|elaborazion|rielabor|non (consente|permette) (all.amministrazione )?l.individuazione|identificabil|non sono già disponibili|attività di ricerca|indetermin|esplorativ|eccessiv|controllo generalizzato|maggiori dettagli|riformulazione|richiesta_manifestamente|riferimenti più dettagliati|assenza di riferimenti|individuare|elaborat'),
    ('strumento', 'Fuori dalle regole dell\'accesso scelto', 'La domanda non rientra nel FOIA o nell\'accesso usato: serve a un interesse personale, non riguarda documenti amministrativi, o chiede di pubblicare ciò che la legge non obbliga a pubblicare',
     r'esula|non (è )?suscettibile|non qualificat|irricevibil|non riconducibil|(forma|natura) di documento amministrativo|non (è|e\') (inquadrabile|riconducibile)|non può essere esaminata|pubblicazione obbligatoria|obbligo (legale )?di pubblica|non è prevista la pubblicazione|interesse pubblico|non si configura|assenza (dei )?presupposti|non qualificabil|non ritenendosi integrate|strumentalit|qualificat|giurisdizion|interesse privato|valenza pubblica'),
    ('interesse', 'Manca un interesse diretto', 'Accesso documentale: chi chiede non ha dimostrato un interesse diretto, concreto e attuale, o non ha motivato la domanda',
     r'interesse (diretto|concreto|attuale|differenziato|qualificato|legittim|dell.istante)|carenza di interesse|mancanza di interesse|legittimazion|priva di motivazione|non è specificata la motivazione|interesse del richiedente|non direttamente collegat|attualità e concretezza|enza di motivazione|dimostrazione ?dell.interesse'),
    ('controinteressati', 'Opposizione di altre persone o imprese', 'Chi è citato nei documenti si è opposto',
     r'opposizion|oppost|controinteressat'),
]
MOTIVO_ALTRO = ('altro', 'Altri motivi', 'Motivazioni diverse (es. richiesta ripetuta, concessione scaduta)')
MOTIVO_NONE = ('non_indicato', 'Motivazione non indicata', 'Il registro non riporta il motivo')


def classifica(testo, regole, altro):
    t = (testo or '').lower()
    for k, nome, *_, rx in regole:
        if re.search(rx, t):
            return k
    # testo «schiacciato» senza spazi (alcuni PDF): si riprova togliendo gli spazi anche dalle regole
    if len(t) > 30 and t.count(' ') < len(t) / 12:
        t2 = t.replace(' ', '')
        for k, nome, *_, rx in regole:
            if re.search(rx.replace(' ', ''), t2):
                return k
    return altro[0]


# ---------------------------------------------------------------- costruzione dei dati

def costruisci_dati(indice, problemi):
    righe, errori, file_letti = [], [], []
    for rel, meta in sorted(indice.items()):
        p = os.path.join(GREZZI, rel)
        if rel.endswith('.7z') or not os.path.exists(p):
            continue
        try:
            r, err = normalizza_file(p, meta)
        except Exception as e:
            r, err = [], f'{rel}: {e}'
        if err:
            errori.append(err)
        for x in r:
            x['registro'] = meta['url']
            x['pagina'] = meta['pagina']
        righe.extend(r)
        file_letti.append({'file': rel, 'ente': meta['ente'], 'url': meta['url'], 'righe': len(r)})
        print(f'   {rel}: {len(r)} richieste')
    # doppioni: la stessa richiesta in due file (registri cumulativi, richieste a cavallo d'anno) -> si tiene il file
    # più recente; dentro lo stesso file le righe uguali restano (sono richieste diverse con lo stesso oggetto)
    chiave = lambda x: (x['ente'], x['tipo'], x['data_richiesta'], re.sub(r'\W+', '', x['oggetto'].lower())[:80])
    ultimo = {}
    for x in righe:
        k = chiave(x)
        if not x['oggetto']:
            continue
        if k not in ultimo or (x['anno'] or 0, x['file']) > ultimo[k]:
            ultimo[k] = (x['anno'] or 0, x['file'])
    uniche = [x for x in righe if not x['oggetto'] or ultimo[chiave(x)] == (x['anno'] or 0, x['file'])]
    # si conta per anno di arrivo della richiesta (i registri includono code dell'anno prima)
    for x in uniche:
        x['anno_registro'] = x['anno']
        if x['data_richiesta']:
            x['anno'] = int(x['data_richiesta'][:4])
    scartate = sum(1 for x in uniche if (x['anno'] or 0) < 2024)
    uniche = [x for x in uniche if (x['anno'] or 0) >= 2024]
    errori.append(f'{scartate} richieste arrivate prima del 2024 (code dei registri 2024) non contate')
    for x in uniche:
        x['oggetto'] = senza_dati_personali(x['oggetto'])[:400]
        x['motivazione'] = senza_dati_personali(x['motivazione'])[:400]
        x['esito_originale'] = senza_dati_personali(x['esito_originale'])[:120]
        x['tema'] = classifica(x['oggetto'], TEMI, TEMA_ALTRO)
        neg = x['esito'] in ('rifiutato', 'accolto in parte', 'differito')
        es_resto = re.sub(r'\b(istanza|richiesta|accoglimento|accolt[ao]|parzial\w*|diniego|rifiut\w*|respint\w*|differ\w*|totale|non|negativo|si|no|[aprdi])\b|[^\w]', ' ', x['esito_originale'].lower()).strip()
        testo_mot = re.sub(r'sintesi della motivazione.*|testo libero -|altri motivi -|^[\s\-/=]+$', '', (x['motivazione'] + ' ' + (x['esito_originale'] if len(es_resto) > 6 else '')).lower()).strip(' -/')
        x['motivo'] = '' if not neg else classifica(testo_mot, MOTIVI, MOTIVO_ALTRO) if len(testo_mot) > 12 else MOTIVO_NONE[0]
        g = None
        if x['data_richiesta'] and x['data_risposta']:
            g = (datetime.date.fromisoformat(x['data_risposta']) - datetime.date.fromisoformat(x['data_richiesta'])).days
            if not 0 <= g <= 730:
                g = None
        x['giorni'] = g
    return uniche, errori, file_letti


CAMPI = ['ente', 'anno', 'anno_registro', 'tipo', 'data_richiesta', 'data_risposta', 'giorni', 'esito', 'esito_originale', 'tema', 'oggetto',
         'motivo', 'motivazione', 'richiedente', 'file', 'registro']


def salva(righe, errori, file_letti, problemi):
    os.makedirs(DATI, exist_ok=True)
    with open(os.path.join(GREZZI, 'richieste.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, CAMPI, extrasaction='ignore')
        w.writeheader()
        for x in sorted(righe, key=lambda x: (x['ente'], x['anno'] or 0, x['data_richiesta'])):
            w.writerow(x)
    json.dump({'aggiornato': datetime.date.today().isoformat(), 'file': file_letti, 'errori': errori, 'blocchi': problemi},
              open(os.path.join(DATI, 'registri.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def carica_righe():
    with open(os.path.join(GREZZI, 'richieste.csv'), encoding='utf-8') as f:
        righe = list(csv.DictReader(f))
    for x in righe:
        x['anno'] = int(x['anno']) if x['anno'] else None
        x['giorni'] = int(x['giorni']) if x['giorni'] not in ('', None) else None
    return righe




# ---------------------------------------------------------------- numeri

NOMI_ENTI = {e: n for e, n, *_ in ENTI}
BREVI = {'pcm': 'Presidenza del Consiglio', 'mef': 'Economia (MEF)', 'mimit': 'Imprese (MIMIT)', 'mur': 'Università (MUR)',
         'mit': 'Infrastrutture (MIT)', 'giustizia': 'Giustizia', 'difesa': 'Difesa', 'masaf': 'Agricoltura (MASAF)', 'cultura': 'Cultura',
         'inps': 'INPS', 'istat': 'Istat', 'anac': 'ANAC', 'consob': 'Consob', 'agcm': 'Antitrust (AGCM)', 'lazio': 'Regione Lazio',
         'er': 'Emilia-Romagna', 'firenze': 'Comune di Firenze'}
# «del/della/dell'» davanti al nome dell'ente
DI = {'pcm': 'della', 'inps': "dell'", 'istat': "dell'", 'anac': "dell'", 'consob': 'della', 'agcm': "dell'", 'lazio': 'della', 'er': 'della', 'firenze': 'del'}


def di_ente(e):
    a = DI.get(e, 'del')
    return f"{a}{'' if a.endswith(chr(39)) else ' '}{NOMI_ENTI[e]}"


def con_art(prep, n):
    """«dal 85%» -> «dall'85%»: preposizione articolata davanti a una percentuale."""
    v = round(n)
    vocale = str(v).startswith('8') or v in (1, 11)
    base = {'da': ('dal', "dall'"), 'a': ('al', "all'"), 'in': ('nel', "nell'"), 'di': ('del', "dell'")}[prep]
    return (base[1] if vocale else base[0] + ' ')
GRUPPI = {e: g for e, _, g, *_ in ENTI}
PAGINE = {e: p for e, _, _, p, _ in ENTI}
NEGATIVI = ('rifiutato', 'accolto in parte')


def conta(xs):
    """Riepilogo di un gruppo di richieste."""
    con = [x for x in xs if x['esito']]
    c = collections.Counter(x['esito'] for x in con)
    g = [x['giorni'] for x in xs if x['giorni'] is not None]
    neg = c['rifiutato'] + c['accolto in parte']
    return {
        'richieste': len(xs), 'con_esito': len(con), 'accolte': c['accolto'], 'rifiutate': c['rifiutato'],
        'in_parte': c['accolto in parte'], 'differite': c['differito'], 'altro': c['archiviato/altro'],
        'negate': neg, 'quota': round(100 * neg / len(con), 1) if con else None,
        'quota_rifiutate': round(100 * c['rifiutato'] / len(con), 1) if con else None,
        'con_date': len(g), 'mediana_giorni': statistics.median(g) if g else None,
        'oltre_30': round(100 * sum(v > 30 for v in g) / len(g), 1) if g else None,
    }


def statistiche(righe):
    pieni = [x for x in righe if x['anno'] in (2024, 2025)]
    foia = [x for x in pieni if x['tipo'] == 'generalizzato']
    per_ente_anno = []
    for (e, a), xs in sorted(_raggruppa(righe, lambda x: (x['ente'], x['anno'])).items()):
        r = conta(xs)
        r.update({'ente': e, 'nome': NOMI_ENTI[e], 'gruppo': GRUPPI[e], 'anno': a, 'pagina': PAGINE[e],
                  'tipi': sorted(set(x['tipo'] for x in xs)),
                  'foia': sum(x['tipo'] == 'generalizzato' for x in xs)})
        per_ente_anno.append(r)
    foia_enti = []
    for e, xs in _raggruppa(foia, lambda x: x['ente']).items():
        r = conta(xs)
        r.update({'ente': e, 'nome': NOMI_ENTI[e]})
        foia_enti.append(r)
    foia_enti.sort(key=lambda r: -(r['quota'] or 0))
    neg = [x for x in righe if x['esito'] in NEGATIVI + ('differito',)]
    return {
        'totale': len(righe), 'enti': len(set(x['ente'] for x in righe)),
        'per_anno': dict(sorted(collections.Counter(x['anno'] for x in righe).items())),
        'per_tipo': dict(collections.Counter(x['tipo'] for x in righe).most_common()),
        'tutte_24_25': conta(pieni), 'foia_24_25': conta(foia),
        'documentale_24_25': conta([x for x in pieni if x['tipo'] == 'documentale']),
        'per_ente_anno': per_ente_anno, 'foia_per_ente': foia_enti,
        'temi': dict(collections.Counter(x['tema'] for x in righe).most_common()),
        'temi_foia': dict(collections.Counter(x['tema'] for x in righe if x['tipo'] == 'generalizzato').most_common()),
        'temi_documentale': dict(collections.Counter(x['tema'] for x in righe if x['tipo'] == 'documentale').most_common()),
        'temi_negati': {t: conta(xs)['quota'] for t, xs in _raggruppa(righe, lambda x: x['tema']).items()},
        'motivi': dict(collections.Counter(x['motivo'] for x in neg).most_common()),
        'motivi_foia': dict(collections.Counter(x['motivo'] for x in neg if x['tipo'] == 'generalizzato').most_common()),
        'motivi_documentale': dict(collections.Counter(x['motivo'] for x in neg if x['tipo'] == 'documentale').most_common()),
        'senza_motivo_per_ente': {e: round(100 * sum(x['motivo'] == 'non_indicato' for x in xs) / len(xs)) for e, xs in _raggruppa(neg, lambda x: x['ente']).items() if len(xs) >= 10},
        'senza_esito_per_ente': {e: sum(1 for x in xs if not x['esito']) for e, xs in _raggruppa(righe, lambda x: x['ente']).items()},
        'richiedenti_foia': dict(collections.Counter(_cat_richiedente(x['richiedente']) for x in foia if x['richiedente']).most_common()),
    }


def _raggruppa(xs, k):
    d = collections.defaultdict(list)
    for x in xs:
        d[k(x)].append(x)
    return d


def _cat_richiedente(s):
    t = s.lower()
    for k, rx in [('giornalisti', r'giornalist'), ('associazioni e sindacati', r'associaz|sindacal|onlus|comitat|organizzazion'),
                  ('imprese', r'impres|societ|persona giuridica'), ('avvocati e professionisti', r'avvocat|professionist'),
                  ('ricercatori', r'ricercat|accadem|universit|studente'), ('altre amministrazioni ed eletti', r'amministrazion|^ente|consiglier|parlamentar')]:
        if re.search(rx, t):
            return k
    return 'cittadini'


# ---------------------------------------------------------------- pagina

def scrivi_pagina(righe, registri, sintesi):
    d = _carica('dossier', 'dossier.py')
    it, esc = d.it, d.esc
    S = statistiche(righe)
    json.dump(S, open(os.path.join(DATI, 'statistiche.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    fonti, numeri = [], {}

    def rif(url, titolo):
        if url.endswith('.7z'):
            url = PAGINE['mef']
        if url not in numeri:
            fonti.append((titolo, url))
            numeri[url] = len(fonti)
        return d.cit(numeri[url], url, titolo)

    def reg(e):
        return rif(PAGINE[e], f'{NOMI_ENTI[e]}: registro degli accessi')

    pc = lambda v: it(v, 0) + '%' if v is not None else '–'

    def titolo_file(e):
        f = urllib.parse.unquote(e['url'].split('?')[0].replace('/@@download/file', '')).rstrip('/').split('/')[-1]
        if not re.search(r'\.(pdf|xlsx?|ods|csv)$', f, re.I):
            f = 'pagina del registro'
        return f'{NOMI_ENTI[e["ente"]]}: {f}'
    F, T, D = S['foia_24_25'], S['tutte_24_25'], S['documentale_24_25']
    fe = [r for r in S['foia_per_ente'] if r['con_esito'] >= 20]
    piu, meno = fe[0], fe[-1]
    temi_nomi = {k: n for k, n, _ in TEMI} | {TEMA_ALTRO[0]: TEMA_ALTRO[1]}
    motivi_nomi = {k: (n, spieg) for k, n, spieg, _ in MOTIVI} | {MOTIVO_ALTRO[0]: MOTIVO_ALTRO[1:], MOTIVO_NONE[0]: MOTIVO_NONE[1:]}
    tema_top = [t for t in S['temi'] if t != 'altro'][0]
    mot_foia = [(k, v) for k, v in S['motivi_foia'].items() if k not in ('non_indicato', 'altro')]
    n_neg_foia = sum(S['motivi_foia'].values())
    inps = next((r for r in S['foia_per_ente'] if r['ente'] == 'inps'), None)
    interno = NON_TROVATI[0]

    # --- In breve
    n_str = sum(1 for x in righe if x['ente'] == 'inps' and x['tipo'] == 'generalizzato' and x['anno'] in (2024, 2025) and x['esito'] in NEGATIVI and x['motivo'] == 'strumento')
    breve = [
        f'Abbiamo letto <b>{it(S["totale"])} richieste</b> di accesso arrivate tra il 2024 e il 2026 a {S["enti"]} amministrazioni, '
        f'da {len(registri["file"])} file di registro. {it(T["richieste"])} sono del 2024 e del 2025, gli anni completi.',
        f'Nel FOIA (accesso civico generalizzato) del 2024-2025, su {it(F["con_esito"])} richieste con un esito scritto '
        f'<b>il {pc(F["quota"])} è stato respinto o accolto solo in parte</b> (il {pc(F["quota_rifiutate"])} respinto del tutto). '
        f'Nell\'accesso documentale, quello di chi ha un interesse personale, la quota scende al {pc(D["quota"])}.',
        f'La quota cambia molto da un ente all\'altro: si va {con_art("da", piu["quota"])}{pc(piu["quota"])} {esc(di_ente(piu["ente"]))}{reg(piu["ente"])} '
        f'{con_art("a", meno["quota"])}{pc(meno["quota"])} {esc(di_ente(meno["ente"]))}{reg(meno["ente"])}, tra gli enti con almeno 20 richieste FOIA decise.'
        + (f' All\'INPS {it(n_str)} dinieghi su {it(inps["negate"])} dicono che la domanda «esula» dal FOIA perché riguarda un interesse personale (pensioni, invalidità, propria posizione){reg("inps")}.' if inps and n_str else ''),
        f'Il tema più frequente è <b>{esc(temi_nomi[tema_top].lower())}</b> ({it(S["temi"][tema_top])} richieste): soprattutto candidati che chiedono i propri elaborati e i verbali delle commissioni.',
        f'Il motivo di diniego più citato nel FOIA è «{esc(motivi_nomi[mot_foia[0][0]][0].lower())}» ({it(mot_foia[0][1])} casi su {it(n_neg_foia)}); '
        f'{con_art("in", 100 * S["motivi_foia"].get("non_indicato", 0) / max(n_neg_foia, 1))}{pc(100 * S["motivi_foia"].get("non_indicato", 0) / max(n_neg_foia, 1))} dei no il registro non scrive il motivo.',
        f'Dove ci sono le date, la risposta al FOIA arriva in una mediana di {it(F["mediana_giorni"])} giorni; '
        f'<b>il {pc(F["oltre_30"])} dopo i 30 giorni</b> previsti dalla legge. Il Ministero dell\'Interno non pubblica il registro: la pagina dice «in costruzione»{rif(interno[3], "Ministero dell\'Interno: registro degli accessi")}.',
    ]
    in_breve = '<ul class="lista">' + ''.join(f'<li>{b}</li>' for b in breve) + '</ul>'
    cifre = (f'<div class="dato numeri"><div><b>{it(S["totale"])}</b><span>richieste lette</span></div>'
             f'<div><b>{S["enti"]}</b><span>amministrazioni con un registro leggibile</span></div>'
             f'<div><b>{pc(F["quota"])}</b><span>FOIA respinti o accolti in parte (2024-2025)</span></div>'
             f'<div><b>{pc(F["oltre_30"])}</b><span>FOIA con risposta oltre 30 giorni</span></div></div>')

    # --- Ente per ente
    righe_t = []
    for r in sorted(S['per_ente_anno'], key=lambda r: -r['richieste']):
        parz = '*' if r['anno'] == 2026 else ''
        righe_t.append([(esc(BREVI[r['ente']]), BREVI[r['ente']]), (f'{r["anno"]}{parz}', r['anno']),
                        (it(r['richieste']), r['richieste']), (it(r['foia']), r['foia']),
                        (it(r['accolte']), r['accolte']), (it(r['negate']), r['negate']),
                        (pc(r['quota']), r['quota'] if r['quota'] is not None else -1),
                        (it(r['mediana_giorni']) if r['mediana_giorni'] is not None else '–', r['mediana_giorni'] if r['mediana_giorni'] is not None else -1),
                        (pc(r['oltre_30']), r['oltre_30'] if r['oltre_30'] is not None else -1),
                        (f'<a href="{esc(r["pagina"])}" target="_blank" rel="noopener">registro</a>', r['ente'])])
    tab = d.tabella('t-enti', [('Ente', 't'), ('Anno', 'n'), ('Richieste', 'n'), ('di cui FOIA', 'n'), ('Accolte', 'n'),
                               ('Respinte o in parte', 'n'), ('Quota', 'n'), ('Giorni (mediana)', 'n'), ('Oltre 30 giorni', 'n'), ('Fonte', 't')], righe_t, 2)
    barre_foia = d.barre([(esc(BREVI[r['ente']]), r['quota'], f'{pc(r["quota"])} · {it(r["negate"])} su {it(r["con_esito"])}') for r in fe], 100,
                         evidenzia=lambda i, et, v: v >= 50)
    barre_tempi = d.barre([(esc(BREVI[r['ente']]), r['oltre_30'], f'{pc(r["oltre_30"])} · mediana {it(r["mediana_giorni"])} gg') for r in
                           sorted([r for r in S['foia_per_ente'] if r['con_date'] >= 20], key=lambda r: -r['oltre_30'])], 100)

    # --- Cosa si chiede
    temi_ord = [(t, n) for t, n in S['temi'].items() if t != TEMA_ALTRO[0]] + [(TEMA_ALTRO[0], S['temi'].get(TEMA_ALTRO[0], 0))]
    barre_temi = d.barre([(esc(temi_nomi[t]), n, it(n)) for t, n in temi_ord], evidenzia=lambda i, et, v: i < 3)
    sint_temi = ''
    for t in sintesi['temi']:
        es = ''.join(f'<li>{esc(e["testo"])} <span class="chi">({esc(NOMI_ENTI[e["ente"]])}, {e["anno"]})</span>{rif(e["url"], titolo_file(e))}</li>' for e in t['esempi'])
        q = S['temi_negati'].get(t['id'])
        sint_temi += (f'<h3>{esc(temi_nomi[t["id"]])} <span class="conta">{it(S["temi"].get(t["id"], 0))} richieste · {pc(q)} respinte o in parte</span></h3>'
                      f'<p>{esc(t["testo"])}</p>' + (f'<ul class="lista esempi">{es}</ul>' if es else ''))
    foia_vs = (f'<p>Il FOIA e l\'accesso documentale servono a cose diverse e si vede. Nel FOIA i temi più frequenti sono '
               + ', '.join(f'{esc(temi_nomi[t].lower())} ({it(n)})' for t, n in list(S['temi_foia'].items())[:5] if t != 'altro')
               + '; nell\'accesso documentale '
               + ', '.join(f'{esc(temi_nomi[t].lower())} ({it(n)})' for t, n in list(S['temi_documentale'].items())[:5] if t != 'altro') + '.</p>')

    # --- Perché si dice no
    mot = [(k, v) for k, v in S['motivi'].items()]
    barre_mot = d.barre([(esc(motivi_nomi[k][0]), v, it(v)) for k, v in mot], evidenzia=lambda i, et, v: et == esc(motivi_nomi['non_indicato'][0]))
    spieg = ''
    sint_mot = {m['id']: m for m in sintesi['motivi']}
    for k, v in mot:
        if k in ('altro',):
            continue
        m = sint_mot.get(k)
        es = ''.join(f' Esempio: {esc(e["testo"])} ({esc(NOMI_ENTI[e["ente"]])}){rif(e["url"], titolo_file(e))}.' for e in (m or {}).get('esempi', []))
        testo = esc(m['testo']) if m else esc(motivi_nomi[k][1]) + '.'
        spieg += f'<li><b>{esc(motivi_nomi[k][0])}</b> ({it(v)}). {testo}{es}</li>'
    senza = sorted(S['senza_motivo_per_ente'].items(), key=lambda kv: -kv[1])
    senza_txt = ', '.join(f'{esc(NOMI_ENTI[e])} {v}%' for e, v in senza[:4] if v >= 20)

    # --- Chi non pubblica
    nt = ''.join(f'<li><b>{esc(n)}</b> · {esc(stato)}. {esc(t)}{rif(u, n)}</li>' for n, stato, t, u in NON_TROVATI)
    vecchi = ''.join(f'<li><b>{esc(NOMI_ENTI[e])}</b>. {esc(t)}{reg(e)}</li>' for e, t in VECCHI.items())
    mit_senza = S['senza_esito_per_ente'].get('mit', 0)
    vecchi += (f'<li><b>{esc(NOMI_ENTI["mit"])}</b>. In {it(mit_senza)} richieste (soprattutto accessi documentali alle Capitanerie di porto) '
               f'la colonna dell\'esito è vuota e spesso l\'oggetto dice solo «accesso atti legge 241/90»{reg("mit")}.</li>')
    vecchi += (f'<li><b>{esc(NOMI_ENTI["anac"])}</b>. Uno dei due file del secondo semestre 2024 è una scansione (immagine): '
               f'non si legge senza riconoscimento ottico del testo e non l\'abbiamo contato{reg("anac")}.</li>')

    # --- Metodo
    letti = (f'{len(registri["file"])} file (PDF, Excel, ODS, CSV) pubblicati da {S["enti"]} amministrazioni nella sezione «Amministrazione trasparente», '
             f'con le richieste arrivate dal 1° gennaio 2024 a oggi: {it(S["totale"])} richieste dopo aver tolto i doppioni '
             f'(alcuni registri ripubblicano le richieste del semestre precedente). Il 2026 è parziale.')
    come = (f'Uno script ({esc("scripts/legge-accessi.py")}) scarica i registri rispettando i robots.txt e al massimo una richiesta al secondo, '
            'riconosce le colonne di ogni tabella e porta tutto in una tabella comune: ente, anno di arrivo, tipo di accesso, date, oggetto, esito, motivazione. '
            'Gli esiti sono raggruppati in cinque classi (accolto, accolto in parte, respinto, differito, altro: inoltrato ad altro ente, ritirato, in corso). '
            'La «quota» è calcolata sulle richieste che hanno un esito scritto. I giorni sono contati tra arrivo e provvedimento, dove ci sono entrambe le date. '
            f'Per i temi un assistente AI ha letto {it(sintesi["lettura"]["oggetti_letti"])} oggetti estratti a caso; ne sono uscite {len(TEMI)} famiglie e regole di parole chiave che lo script applica a tutte le richieste. '
            f'{esc(sintesi["lettura"]["controllo"])} Nomi di persone, indirizzi e recapiti trovati negli oggetti sono stati tolti prima di pubblicare i dati.')
    limiti = ('Ogni ente compila il registro a modo suo: alcuni mettono solo il FOIA, altri anche l\'accesso documentale (che pesa molto sui totali: '
              f'{it(S["per_tipo"].get("documentale", 0))} richieste, quasi tutte di Presidenza del Consiglio, Infrastrutture ed Emilia-Romagna). '
              'Per questo i totali tra enti non sono confrontabili; le quote lo sono di più, ma restano influenzate da come l\'ente classifica gli esiti '
              '(per esempio «smistamento» alla Presidenza del Consiglio, o il codice «I» del Ministero delle Infrastrutture, che abbiamo contato come «altro»). '
              'I codici A, P e R del Ministero delle Infrastrutture sono letti come accolto, accolto in parte e respinto. Un diniego può essere del tutto legittimo: '
              'la tabella mette i numeri uno accanto all\'altro, non dà voti. Alcuni PDF hanno perso gli spazi tra le parole o hanno righe spezzate: l\'oggetto di una parte delle richieste è imperfetto.')
    met = d.metodo(letti, come, limiti, '2 novembre 2026')

    # La tabella riga per riga resta fuori dal sito: gli oggetti delle richieste possono contenere riferimenti
    # a persone che il filtro automatico non riconosce. Si pubblicano solo numeri e sintesi.
    dati_link = ('<p class="nota-dati">I dati: '
                 '<a href="dati/statistiche.json">numeri</a> · <a href="dati/sintesi.json">sintesi</a> · <a href="dati/registri.json">file letti</a>.</p>')

    corpo = f'''    <section id="in-breve"><div class="occhiello">In breve</div><h2>Cosa abbiamo trovato</h2>
      {cifre}
      {in_breve}
    </section>
    <section id="enti"><div class="occhiello">Ente per ente</div><h2>Quante richieste, quante respinte</h2>
      <p>Una riga per ente e per anno di arrivo delle richieste. «Respinte o in parte» somma i dinieghi totali e gli accoglimenti parziali; la quota è sul totale delle richieste con un esito scritto. Clicca sui titoli per ordinare.</p>
      {tab}
      <p class="nota-dati">* 2026: anno in corso, solo i registri già pubblicati. I totali dipendono da quali tipi di accesso ogni ente mette nel registro: per confrontare gli enti conta di più la quota.</p>
      <h3>Solo FOIA, 2024-2025: quota respinta o accolta in parte</h3>
      <p>Enti con almeno 20 richieste di accesso civico generalizzato decise. In evidenza chi supera la metà.</p>
      {barre_foia}
      <h3>Quanto si aspetta</h3>
      <p>Per il FOIA la legge dà 30 giorni per rispondere. Quota di risposte arrivate dopo i 30 giorni, tra le richieste con entrambe le date (2024-2025, almeno 20 casi).</p>
      {barre_tempi}
    </section>
    <section id="temi"><div class="occhiello">Cosa si chiede</div><h2>I temi delle richieste</h2>
      <p>Tutte le richieste, divise in {len(TEMI)} temi in base all'oggetto. «Richieste generiche o non classificabili» sono soprattutto quelle in cui il registro scrive solo «accesso agli atti».</p>
      {barre_temi}
      {foia_vs}
      {sint_temi}
    </section>
    <section id="perche"><div class="occhiello">Perché si dice no</div><h2>Le motivazioni dei dinieghi</h2>
      <p>Motivi delle {it(sum(S["motivi"].values()))} richieste respinte, accolte solo in parte o differite. Un diniego non è per forza un abuso: la legge prevede eccezioni precise (articolo 5-bis del decreto 33/2013 per il FOIA, articolo 24 della legge 241/1990 per l'accesso documentale).</p>
      {barre_mot}
      <ul class="lista">{spieg}</ul>
      <p>In molti casi il registro non scrive il motivo{(": " + senza_txt + " dei no senza motivazione scritta") if senza_txt else ""}. I registri della Difesa, della Regione Lazio e del Comune di Firenze non hanno proprio una colonna per il motivo, che le linee guida dell'ANAC indicano tra i contenuti del registro («sintesi della motivazione»).</p>
    </section>
    <section id="assenti"><div class="occhiello">Chi non pubblica il registro</div><h2>Gli enti che non abbiamo potuto leggere</h2>
      <p>Abbiamo cercato il registro anche in queste amministrazioni (verifica del 2 novembre 2026). Non trovarlo, o non poterlo leggere, è anch'esso un risultato.</p>
      <ul class="lista">{nt}</ul>
      <h3>Registri vecchi, parziali o difficili da leggere</h3>
      <ul class="lista">{vecchi}</ul>
    </section>
    <section id="chiedi"><div class="occhiello">Fai anche tu una richiesta</div><h2>Chiedere bene per avere una risposta</h2>
      <ul class="lista">
        <li><b>Sii preciso.</b> Le richieste generiche o che chiedono di elaborare dati nuovi sono tra le più respinte: chiedi documenti o dati che l'ufficio ha già, indicando periodo e argomento.</li>
        <li><b>Scegli lo strumento giusto.</b> Per una tua pratica (pensione, concorso, multa) serve l'accesso documentale e devi spiegare il tuo interesse; il FOIA è per ciò che interessa a tutti.</li>
        <li><b>Conta i giorni.</b> Dopo 30 giorni senza risposta, o dopo un no, puoi chiedere il riesame al responsabile della trasparenza e poi rivolgerti al giudice amministrativo.</li>
      </ul>
      <p><a class="bottone" href="../../chiedo-gli-atti/">Prepara la tua richiesta con «Chiedo gli atti» del Polpo →</a></p>
    </section>
    <section id="metodo"><div class="occhiello">Come l'abbiamo letto</div><h2>Metodo e limiti</h2>
      {met}
      {dati_link}
    </section>
    <section id="fonti"><div class="occhiello">Fonti</div><h2>I documenti citati</h2>
      {d.fonti(fonti)}
    </section>'''
    css = '''
  .dossier h3 .conta { display: block; font-family: var(--cifre); font-size: 12px; font-weight: 400; color: var(--inchiostro-3); margin-top: 4px; letter-spacing: .02em; }
  .dossier .esempi { font-size: var(--s0); }
  .dossier .esempi .chi { color: var(--inchiostro-3); }
  .dossier .scorri { overflow-x: auto; margin: 16px 0 6px; }
  .dossier .occhiello { font-family: var(--cifre); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--accento); }
  .dossier .bottone { display: inline-block; padding: 10px 16px; border: 2px solid var(--inchiostro); border-radius: 4px; font-weight: 600; text-decoration: none; color: var(--inchiostro); }
  .dossier .bottone:hover { border-color: var(--accento); color: var(--accento); }
  .dossier .nota-dati { font-size: var(--s-1); color: var(--inchiostro-3); }
  .dossier .barre { margin: 14px 0 8px; }
  .dossier .ordinabile td { white-space: nowrap; }
  .dossier .ordinabile td:first-child { white-space: normal; min-width: 9em; }
'''
    intro = ('I registri degli accessi raccontano cosa cittadini, giornalisti, imprese e associazioni chiedono alle amministrazioni, '
             'e cosa ricevono in risposta. Il Polpo ne ha letti ' + it(S['totale']) + ' righe, ente per ente.')
    html_ = d.pagina('../../', 'Cosa chiedono gli italiani alla PA',
                     f'Il Polpo civico ha letto {it(S["totale"])} richieste di accesso civico e documentale a {S["enti"]} amministrazioni: cosa si chiede, quante volte si dice no, perché e in quanto tempo.',
                     'Il Polpo legge per te · registri degli accessi', 'Cosa chiedono gli italiani alla PA', intro, corpo, braccio=1, css_extra=css)
    os.makedirs(CARTELLA, exist_ok=True)
    open(os.path.join(CARTELLA, 'index.html'), 'w', encoding='utf-8').write(html_)
    return S


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--scarica', action='store_true', help='riscarica i registri e rifà i dati (serve pdfplumber)')
    ap.add_argument('--forza', action='store_true', help='con --scarica: riscarica anche i file già presenti')
    ap.add_argument('--solo-dati', action='store_true', help='rifà i dati dai grezzi già scaricati, senza rete')
    a = ap.parse_args()
    if a.scarica or a.solo_dati:
        try:
            import pdfplumber, openpyxl, xlrd  # noqa: F401
        except ImportError:
            sys.exit('Per leggere i registri servono pdfplumber, openpyxl e xlrd: pip install pdfplumber openpyxl xlrd')
        if a.scarica:
            indice, problemi = scarica(a.forza)
        else:
            indice, problemi = json.load(open(os.path.join(GREZZI, 'indice.json'), encoding='utf-8')), {}
        righe, errori, file_letti = costruisci_dati(indice, problemi)
        salva(righe, errori, file_letti, problemi)
        print(f'{len(righe)} richieste; avvisi: {errori}')
    righe = carica_righe()
    registri = json.load(open(os.path.join(DATI, 'registri.json'), encoding='utf-8'))
    sintesi = json.load(open(os.path.join(DATI, 'sintesi.json'), encoding='utf-8'))
    S = scrivi_pagina(righe, registri, sintesi)
    print(f'legge/accessi/index.html scritta: {S["totale"]} richieste, {S["enti"]} enti')


if __name__ == '__main__':
    main()
