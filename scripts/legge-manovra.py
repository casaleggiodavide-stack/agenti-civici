#!/usr/bin/env python3
"""La manovra letta dal Polpo: la legge di bilancio 2027 misura per misura, le audizioni, gli emendamenti.

Scrive legge/manovra/index.html con la cornice comune di scripts/dossier.py (caricato con importlib).

Uso:
  python3 -I scripts/legge-manovra.py                legge i JSON, ricava numeri.json e misure.json, scrive la pagina
  python3 -I scripts/legge-manovra.py --ddl          cerca il disegno di legge negli open data di Camera e Senato;
                                                     se c'è, scarica testi (relazioni comprese) e dossier dei Servizi studi
  python3 -I scripts/legge-manovra.py --memorie      scarica le memorie delle audizioni sulla manovra e fa l'inventario
  python3 -I scripts/legge-manovra.py --emendamenti  scarica i bollettini della Commissione Bilancio con gli emendamenti
                                                     e fa l'inventario (serve il numero dell'atto: da ddl.json o --atto N)
Dopo ogni modalità di scaricamento la pagina viene riscritta.

Dove stanno i dati
  ~/dati-civici/manovra/            dati grezzi, fuori dal repository (MANOVRA_DATI per cambiarlo)
    documenti/    i documenti letti per la sintesi (comunicato del Consiglio dei ministri, DPB 2027, DPFP 2026) + .txt
    pagine/       le pagine HTML consultate per capire dove stanno le cose
    ddl/          testi e dossier del disegno di legge (--ddl) + .txt
    memorie/      memorie e contributi scritti (--memorie) + .txt, con inventario.json
    emendamenti/  bollettini e allegati della Commissione Bilancio (--emendamenti) + .txt, con inventario.json
  legge/manovra/dati/               dati pubblici del dossier
    sintesi.json      scritto a mano dopo aver letto i documenti (struttura sotto)
    numeri.json       ricavato in automatico dai .txt di DPB e DPFP: quadro dei conti e Tabella I.6-1
    misure.json       ricavato da sintesi.json: una riga per misura, quella della tabella ordinabile
    ddl.json          --ddl: numero dell'atto, testi, dossier
    memorie.json      --memorie: soggetto, seduta, link, pagine di ogni memoria (pronto per la sintesi)
    emendamenti.json  --emendamenti: allegati, emendamenti contati per articolo (pronto per la sintesi)

Struttura di sintesi.json
  aggiornato      data della lettura, in parole
  atto            {titolo, approvato_cdm, camera, senato, stato, rimandi, verifiche: [{cosa, esito, dove}]}
  fonti           [{id, titolo, url, file}]   l'ordine dà il numero della citazione [n]; file è relativo a ~/dati-civici/manovra
  in_breve        [{testo, rimandi}]           testo può contenere <b>
  temi            [{id, titolo, intro, rimandi, misure: [{misura, cosa_cambia, per_chi, euro: {"2027": n, ...},
                    valore_testo, articolo, rimandi}]}]
                  euro: solo cifre scritte nei documenti, in euro; null o assente se il documento non la dà
  audizioni       {stato, quando, chi, come, rimandi, pagine: [[titolo, url]], gia_online}
  emendamenti     {stato, quando, come, pagine: [[titolo, url]]}
  Un rimando è [id della fonte, punto del documento], per esempio ["dpb", "Tabella I.6-1, p. 11"].

Da dove arriveranno audizioni ed emendamenti (verificato il 2 novembre 2026)
  - Memorie: pagina «Documenti acquisiti» della V Commissione Bilancio della Camera,
    https://www.camera.it/leg19/1347?shadow_organo_parlamentare=3505&id_tipografico=05 ; i contributi scritti senza audizione
    stanno in «Altra documentazione», .../leg19/1425?... I file sono su documenti.camera.it/leg19/documentiAcquisiti/COM05/...
    Le audizioni sul bilancio sono «attività conoscitiva preliminare all'esame del disegno di legge recante bilancio di
    previsione dello Stato per l'anno finanziario 2027», svolte insieme alla 5a Commissione del Senato.
  - Calendario: convocazioni .../leg19/1099?submit1=invia&slAnnoMese=AAAAMM&slGiorno=G&shadow_organo_parlamentare=3505 e
    calendario settimanale .../leg19/76?active_tab_3806=3811
  - Emendamenti: allegati al Bollettino delle Giunte e Commissioni, getDocumento.ashx?...sezione=bollettini&
    tipoDoc=comunicato&anno=AAAA&mese=MM&giorno=GG&idCommissione=05 ; ricerca: https://www.camera.it/ricerca-emendamenti/
  - Testo: scheda https://www.camera.it/leg19/126?tab=&leg=19&idDocumento=N («Testi disponibili» e dossier).
  Il riconoscimento degli emendamenti negli allegati è euristico: va controllato sul primo fascicolo vero.

Regole di rete
  - robots.txt letto prima di ogni sito: niente download se vieta il percorso a User-agent * o agli agenti di
    intelligenza artificiale elencati in ~/dati-civici/agenti-ia.txt; robots.txt irraggiungibile per 401/403 = tutto vietato.
  - una richiesta al secondo al massimo, User-Agent «PolpoCivico/1.0 (+https://casaleggiodavide-stack.github.io/agenti-civici/)».
  - CAPTCHA, WAF o blocchi (per esempio senato.it con AWS WAF, rgs.mef.gov.it e dt.mef.gov.it con Akamai il 2/11/2026):
    lo script si ferma su quel sito e lo scrive, senza aggiramenti.
  I file scaricati sono dati non fidati: si leggono solo come testo (pdftotext, zip per i .docx), mai eseguiti.
"""
import datetime
import hashlib
import html
import importlib.util
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
import zipfile

sys.dont_write_bytecode = True   # niente __pycache__ nel repository
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARTELLA = os.path.join(REPO, 'legge', 'manovra')
DATI = os.path.join(CARTELLA, 'dati')
GREZZI = os.environ.get('MANOVRA_DATI') or os.path.expanduser('~/dati-civici/manovra')

UA = 'PolpoCivico/1.0 (+https://casaleggiodavide-stack.github.io/agenti-civici/)'
# Gli agenti di intelligenza artificiale di cui rispettare i divieti nei robots.txt: i nomi stanno
# in ~/dati-civici/agenti-ia.txt (uno per riga), fuori dal repository.
def _agenti_ia():
    p = os.path.expanduser('~/dati-civici/agenti-ia.txt')
    return [r.strip() for r in open(p, encoding='utf-8') if r.strip()] if os.path.exists(p) else []


AGENTI_IA = _agenti_ia()
AGENTI = ['*'] + AGENTI_IA
COMMISSIONE = '3505'      # V Commissione Bilancio della Camera, XIX legislatura
OGGI = datetime.date.today()


def _carica(nome, file):
    spec = importlib.util.spec_from_file_location(nome, os.path.join(REPO, 'scripts', file))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


dossier = _carica('dossier', 'dossier.py')
esc, it, barre, tabella, cit = dossier.esc, dossier.it, dossier.barre, dossier.tabella, dossier.cit
MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']


def euro(v):
    """Cifre come nei documenti, senza arrotondare: 1,25 mld, 850 mln."""
    for soglia, nome in ((1e9, 'mld'), (1e6, 'mln')):
        if v >= soglia:
            return f'{v / soglia:.2f}'.rstrip('0').rstrip('.').replace('.', ',') + ' ' + nome
    return it(v) + ' euro'


def data_it(iso):
    try:
        g = datetime.date.fromisoformat(iso)
        return f'{g.day} {MESI[g.month - 1]} {g.year}'
    except ValueError:
        return iso


def leggi_json(nome, cartella=DATI):
    p = os.path.join(cartella, nome)
    if not os.path.exists(p):
        return None
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def scrivi_json(nome, dati, cartella=DATI):
    os.makedirs(cartella, exist_ok=True)
    with open(os.path.join(cartella, nome), 'w', encoding='utf-8') as f:
        json.dump(dati, f, ensure_ascii=False, indent=1)
        f.write('\n')


# ---------------------------------------------------------------- rete: robots, una richiesta al secondo, blocchi

class Bloccato(Exception):
    """Il sito risponde con un WAF, un CAPTCHA o un divieto: ci si ferma su quel sito."""


class NonPermesso(Exception):
    """robots.txt vieta il percorso."""


_robots, _bloccati, _ultimo = {}, {}, [0.0]


def _richiesta(url, dati=None):
    attesa = 1.0 - (time.time() - _ultimo[0])
    if attesa > 0:
        time.sleep(attesa)
    req = urllib.request.Request(url, data=dati, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            esito = r.status, {k.lower(): v for k, v in r.headers.items()}, r.read()
    except urllib.error.HTTPError as e:
        esito = e.code, {k.lower(): v for k, v in (e.headers or {}).items()}, (e.read() if e.fp else b'')
    _ultimo[0] = time.time()
    return esito


def _e_un_blocco(stato, intest, corpo):
    testa = corpo[:4000].decode('utf-8', 'replace').lower()
    if 'x-amzn-waf-action' in intest or stato == 429:
        return 'WAF o limite di richieste'
    if stato == 403 and ('akamai' in intest.get('server', '').lower() or 'access denied' in testa or 'access forbidden' in testa):
        return 'accesso negato da un WAF'
    if 'captcha' in testa or 'cf-chl' in testa:
        return 'CAPTCHA'
    return ''


def _robots_ok(url):
    p = urllib.parse.urlsplit(url)
    base = f'{p.scheme}://{p.netloc}'
    if base not in _robots:
        stato, intest, corpo = _richiesta(base + '/robots.txt')
        blocco = _e_un_blocco(stato, intest, corpo)
        if blocco:
            _bloccati[p.netloc] = blocco
            raise Bloccato(f'{p.netloc}: {blocco} già su robots.txt')
        rp = urllib.robotparser.RobotFileParser()
        if stato in (401, 403):
            rp.disallow_all = True
        elif stato >= 400:
            rp.allow_all = True
        else:
            rp.parse(corpo.decode('utf-8', 'replace').splitlines())
        _robots[base] = rp
    return all(_robots[base].can_fetch(a, url) for a in AGENTI)


def scarica(url, dest=None, rifai=False):
    """Scarica url (rispettando robots e blocchi). Con dest salva il file e, se c'è già, non lo riscarica."""
    if dest and os.path.exists(dest) and not rifai:
        with open(dest, 'rb') as f:
            return f.read()
    host = urllib.parse.urlsplit(url).netloc
    if host in _bloccati:
        raise Bloccato(f'{host}: {_bloccati[host]}')
    if not _robots_ok(url):
        raise NonPermesso(f'robots.txt vieta {url}')
    stato, intest, corpo = _richiesta(url)
    blocco = _e_un_blocco(stato, intest, corpo)
    if blocco:
        _bloccati[host] = blocco
        raise Bloccato(f'{host}: {blocco}')
    if stato != 200:
        raise IOError(f'HTTP {stato} per {url}')
    if dest:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, 'wb') as f:
            f.write(corpo)
    return corpo


def sparql(endpoint, query, formato):
    url = endpoint + '?' + urllib.parse.urlencode({'query': query, 'format': formato})
    return json.loads(scarica(url).decode('utf-8'))['results']['bindings']


# ---------------------------------------------------------------- testo dai file (solo lettura, niente esecuzione)

def estrai(percorso):
    """Scrive percorso + '.txt' e restituisce (testo, pagine). PDF con pdftotext, DOCX con zipfile, HTML togliendo i tag."""
    est = os.path.splitext(percorso)[1].lower()
    txt, pagine = percorso + '.txt', None
    if est == '.pdf':
        subprocess.run(['pdftotext', '-layout', percorso, txt], check=False, capture_output=True)
        info = subprocess.run(['pdfinfo', percorso], capture_output=True, text=True, errors='replace').stdout
        m = re.search(r'^Pages:\s+(\d+)', info, re.M)
        pagine = int(m.group(1)) if m else None
    elif est == '.docx':
        try:
            with zipfile.ZipFile(percorso) as z:
                x = z.read('word/document.xml').decode('utf-8', 'replace')
            testo = html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'</w:p>', '\n', x)))
        except (zipfile.BadZipFile, KeyError):
            testo = ''
        open(txt, 'w', encoding='utf-8').write(testo)
    else:
        with open(percorso, 'rb') as f:
            x = f.read().decode('utf-8', 'replace')
        x = re.sub(r'<script.*?</script>|<style.*?</style>', '', x, flags=re.S)
        x = re.sub(r'<(br|p|div|li|tr|h\d)[^>]*>', '\n', x)
        open(txt, 'w', encoding='utf-8').write(html.unescape(re.sub(r'<[^>]+>', '', x)))
    testo = open(txt, encoding='utf-8', errors='replace').read() if os.path.exists(txt) else ''
    if pagine is None and testo:
        pagine = testo.count('\f') + 1 if '\f' in testo else None
    return testo, pagine


def sha256(percorso):
    with open(percorso, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def pulito(frammento):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', frammento))).strip()


# ---------------------------------------------------------------- --ddl: il disegno di legge negli open data

RE_TITOLO = 'anno finanziario 2027'


def _e_il_ddl(titolo):
    return re.search(r'bilancio di previsione', titolo, re.I) and not re.search(r'nota di variazioni|assestamento', titolo, re.I)


def cerca_ddl():
    trovati = {'camera': None, 'senato': None}
    q = ('PREFIX ocd: <http://dati.camera.it/ocd/> PREFIX dc: <http://purl.org/dc/elements/1.1/> '
         'SELECT DISTINCT ?atto ?num ?tit ?data WHERE { ?atto a ocd:atto; '
         'ocd:rif_leg <http://dati.camera.it/ocd/legislatura.rdf/repubblica_19>; dc:title ?tit; dc:identifier ?num; dc:date ?data . '
         f'FILTER(?data >= "20261001" && regex(?tit, "{RE_TITOLO}", "i")) }} ORDER BY ?data')
    try:
        for b in sparql('https://dati.camera.it/sparql', q, 'application/sparql-results+json'):
            if _e_il_ddl(b['tit']['value']):
                trovati['camera'] = {'numero': b['num']['value'], 'data': b['data']['value'], 'titolo': pulito(b['tit']['value']),
                                     'scheda': f"https://www.camera.it/leg19/126?tab=&leg=19&idDocumento={b['num']['value']}"}
                break
    except (Bloccato, NonPermesso, IOError, ValueError) as e:
        print('  Camera, open data:', e)
    q = ('PREFIX osr: <http://dati.senato.it/osr/> SELECT ?ddl ?num ?tit ?data WHERE { ?ddl a osr:Ddl; osr:legislatura 19; '
         'osr:titolo ?tit; osr:numeroFase ?num; osr:dataPresentazione ?data . '
         f'FILTER(str(?data) >= "2026-10-01" && regex(?tit, "{RE_TITOLO}", "i")) }} ORDER BY ?data')
    try:
        for b in sparql('https://dati.senato.it/sparql', q, 'json'):
            if _e_il_ddl(b['tit']['value']):
                trovati['senato'] = {'numero': b['num']['value'], 'data': b['data']['value'], 'titolo': pulito(b['tit']['value']),
                                     'nota': 'senato.it è dietro un controllo anti-robot: i testi si leggono dalla Camera'}
                break
    except (Bloccato, NonPermesso, IOError, ValueError) as e:
        print('  Senato, open data:', e)
    return trovati


def modo_ddl():
    print('Cerco il disegno di legge di bilancio 2027 negli open data...')
    t = cerca_ddl()
    esito = {'aggiornato': OGGI.isoformat(), 'camera': t['camera'], 'senato': t['senato'], 'testi': [], 'dossier': [], 'problemi': []}
    if not t['camera']:
        print('  Non ancora presentato alla Camera.' + (f" Al Senato: S. {t['senato']['numero']}." if t['senato'] else ''))
    else:
        n = t['camera']['numero']
        print(f'  Camera: C. {n}. Leggo la scheda e scarico testi e dossier.')
        cart = os.path.join(GREZZI, 'ddl')
        try:
            scheda = scarica(t['camera']['scheda'], os.path.join(cart, f'scheda_C{n}.html'), rifai=True).decode('utf-8', 'replace')
            visti = set()
            for m in re.finditer(r'<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>', scheda, re.S):
                u = urllib.parse.urljoin('https://www.camera.it/leg19/', html.unescape(m.group(1)))
                if u in visti:
                    continue
                if 'tipoDoc=testo_pdl_pdf' in u:
                    tipo, nome = 'testi', re.search(r'codice=([\w.]+)', u).group(1) + '.pdf'
                elif re.search(r'documenti\.camera\.it/leg19/dossier/Pdf/[\w-]+\.pdf', u):
                    tipo, nome = 'dossier', os.path.basename(u)
                else:
                    continue
                visti.add(u)
                # il titolo è nel testo che precede il link (es. «C. 2112 TOMO I Disegno di legge presentato il ...»)
                prima = pulito(scheda[max(0, m.start() - 600):m.start()])[-200:]
                dest = os.path.join(cart, nome)
                try:
                    scarica(u, dest)
                    testo, pagine = estrai(dest)
                    esito[tipo].append({'titolo': prima, 'url': u, 'file': os.path.relpath(dest, GREZZI), 'pagine': pagine,
                                        'caratteri': len(testo)})
                    print(f'   {tipo}: {nome} ({pagine} pagine)')
                except (Bloccato, NonPermesso, IOError) as e:
                    esito['problemi'].append(f'{u}: {e}')
        except (Bloccato, NonPermesso, IOError) as e:
            esito['problemi'].append(str(e))
    scrivi_json('ddl.json', esito)
    print('  scritto legge/manovra/dati/ddl.json')


# ---------------------------------------------------------------- --memorie: documenti acquisiti della Commissione Bilancio

PAGINE_MEMORIE = [
    ('documenti acquisiti nelle audizioni', f'https://www.camera.it/leg19/1347?shadow_organo_parlamentare={COMMISSIONE}&id_tipografico=05'),
    ('altra documentazione', f'https://www.camera.it/leg19/1425?shadow_organo_parlamentare={COMMISSIONE}&id_tipografico=05'),
]


def categoria_memoria(titolo, numero_camera=None):
    if re.search(r'finanziario 2027|legge di bilancio 2027', titolo, re.I):
        return 'ddl'
    if numero_camera and re.search(rf'\bC\.\s*{re.escape(numero_camera)}\b', titolo):
        return 'ddl'
    if re.search(r'Documento programmatico di (finanza pubblica 2026|bilancio 2027)', titolo, re.I):
        return 'quadro'
    return None


def voci_documenti(pagina_html, base):
    """[(seduta 'AAAA-MM-GG', titolo, [(testo link, url)])] dalla lista «doc_acquisiti_video_list»."""
    voci = []
    for pezzo in pagina_html.split('class="no_link_bol_seduta"')[1:]:
        d = re.search(r'(\d{2})/(\d{2})/(\d{4})', pezzo[:200])
        m = re.search(r'class="autore_titolo">(.*?)</div>', pezzo, re.S)
        titolo = pulito(m.group(1)) if m else ''
        link = [(pulito(a.group(2)), urllib.parse.urljoin(base, html.unescape(a.group(1))))
                for a in re.finditer(r'<li class="documentoLink">\s*<a href="([^"]+)"[^>]*>(.*?)</a>', pezzo, re.S)]
        voci.append((f'{d.group(3)}-{d.group(2)}-{d.group(1)}' if d else '', titolo, link))
    return voci


def soggetto_e_tipo(testo_link):
    m = re.match(r'(Memoria|Documento|Proposte emendative|Contributo scritto|Nota|Audizione|Presentazione|Slide)\s*(?:di|del|della|dell\'|degli|delle)?\s*(.*)',
                 testo_link, re.I)
    if m and m.group(2):
        return m.group(2).strip(' -–'), m.group(1).capitalize()
    return testo_link, 'Documento'


def modo_memorie():
    ddl = leggi_json('ddl.json') or {}
    numero = (ddl.get('camera') or {}).get('numero')
    cart = os.path.join(GREZZI, 'memorie')
    documenti, problemi, visti = [], [], set()
    for nome, url in PAGINE_MEMORIE:
        print(f'Leggo {nome}: {url}')
        try:
            pag = scarica(url, os.path.join(GREZZI, 'pagine', f'memorie_{url.split("/")[-1].split("?")[0]}.html'), rifai=True)
        except (Bloccato, NonPermesso, IOError) as e:
            problemi.append(f'{url}: {e}')
            print('  ', e)
            continue
        for seduta, titolo, link in voci_documenti(pag.decode('utf-8', 'replace'), url):
            cat = categoria_memoria(titolo, numero)
            if not cat:
                continue
            for testo, u in link:
                if u in visti:
                    continue
                visti.add(u)
                est = os.path.splitext(urllib.parse.urlsplit(u).path)[1].lower() or '.pdf'
                ide = re.search(r'ideGes\.(\d+)', u)
                slug = re.sub(r'[^a-z0-9]+', '-', testo.lower()).strip('-')[:60]
                dest = os.path.join(cart, f'{seduta}_{slug}{"_" + ide.group(1) if ide else ""}{est}')
                soggetto, tipo = soggetto_e_tipo(testo)
                voce = {'categoria': cat, 'seduta': seduta, 'attivita': re.split(r':\s*Audizion', titolo)[0].strip(),
                        'soggetto': soggetto, 'tipo': tipo, 'url': u, 'formato': est.lstrip('.')}
                try:
                    scarica(u, dest)
                    t, pagine = estrai(dest)
                    voce.update({'file': os.path.relpath(dest, GREZZI), 'pagine': pagine, 'caratteri': len(t), 'sha256': sha256(dest)})
                    print(f'   {seduta} {soggetto} ({pagine} pagine)')
                except (Bloccato, NonPermesso, IOError) as e:
                    voce['problema'] = str(e)
                    problemi.append(f'{u}: {e}')
                documenti.append(voce)
    documenti.sort(key=lambda v: (v['categoria'] != 'ddl', v['seduta'], v['soggetto'].lower()))
    inv = {'aggiornato': OGGI.isoformat(), 'atto_camera': numero, 'pagine_lette': [u for _, u in PAGINE_MEMORIE],
           'categorie': {'ddl': 'audizioni sul disegno di legge di bilancio 2027',
                         'quadro': 'audizioni sul Documento programmatico di finanza pubblica 2026 (la cornice della manovra)'},
           'conteggi': {c: sum(1 for d in documenti if d['categoria'] == c) for c in ('ddl', 'quadro')},
           'documenti': documenti, 'problemi': problemi}
    scrivi_json('memorie.json', inv)
    scrivi_json('inventario.json', inv, cart)
    print(f"  {inv['conteggi']['ddl']} documenti sul disegno di legge, {inv['conteggi']['quadro']} sul quadro: legge/manovra/dati/memorie.json")


# ---------------------------------------------------------------- --emendamenti: allegati ai bollettini della Commissione

RE_EMENDAMENTO = re.compile(r'(?m)^\s*(\d{1,3})\.\s?(0?\d{1,4})\.\s')   # «12. 3.» o «12.03.»: articolo e numero (euristico)


def url_bollettino(g):
    return ('https://documenti.camera.it/apps/commonServices/getDocumento.ashx?idLegislatura=19&sezione=bollettini'
            f'&tipoDoc=comunicato&anno={g.year}&mese={g.month:02d}&giorno={g.day:02d}&idCommissione=05')


def conta_emendamenti(testo):
    ids = {(int(a), int(b)) for a, b in RE_EMENDAMENTO.findall(testo)}
    per_articolo = {}
    for a, b in ids:
        per_articolo[str(a)] = per_articolo.get(str(a), 0) + 1
    return len(ids), dict(sorted(per_articolo.items(), key=lambda x: int(x[0])))


def modo_emendamenti(numero=None):
    ddl = leggi_json('ddl.json') or {}
    camera = ddl.get('camera') or {}
    numero = numero or camera.get('numero')
    inv = {'aggiornato': OGGI.isoformat(), 'atto_camera': numero, 'giorni_letti': [], 'allegati': [], 'problemi': [],
           'metodo': 'Per ogni giorno dalla presentazione si legge il bollettino della V Commissione; si tengono i pezzi '
                     'che citano l\'atto e gli emendamenti, e gli allegati collegati. Il conteggio degli emendamenti è euristico.'}
    if not numero:
        inv['stato'] = 'Il disegno di legge non è ancora presentato alla Camera: lancia prima --ddl (o passa --atto N).'
        scrivi_json('emendamenti.json', inv)
        print(inv['stato'])
        return
    d = camera.get('data', '')
    inizio = datetime.date(int(d[:4]), int(d[4:6]), int(d[6:8])) if re.fullmatch(r'\d{8}', d) else datetime.date(2026, 11, 1)
    cart = os.path.join(GREZZI, 'emendamenti')
    rif = re.compile(rf'\bC\.\s*{re.escape(numero)}\b')
    g = inizio
    while g <= min(OGGI, datetime.date(2026, 12, 31)):
        dest = os.path.join(cart, 'bollettini', f'{g.isoformat()}.html')
        recente = (OGGI - g).days < 3
        try:
            pag = scarica(url_bollettino(g), dest, rifai=recente).decode('utf-8', 'replace')
        except Bloccato as e:
            inv['problemi'].append(str(e))
            print('  bloccato, mi fermo:', e)
            break
        except (NonPermesso, IOError) as e:
            inv['problemi'].append(f'{g}: {e}')
            g += datetime.timedelta(days=1)
            continue
        inv['giorni_letti'].append(g.isoformat())
        if rif.search(pulito(pag)):
            # 1) allegati collegati (PDF o HTML) nel bollettino del giorno
            for m in re.finditer(r'<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>', pag, re.S):
                testo_link, u = pulito(m.group(2)), urllib.parse.urljoin(url_bollettino(g), html.unescape(m.group(1)))
                if not re.search(r'allegat|emendament', testo_link + u, re.I):
                    continue
                if any(a['url'] == u for a in inv['allegati']):
                    continue
                nome = f"{g.isoformat()}_{hashlib.sha1(u.encode()).hexdigest()[:10]}" + ('.pdf' if '.pdf' in u.lower() else '.html')
                f = os.path.join(cart, nome)
                try:
                    scarica(u, f)
                    t, pagine = estrai(f)
                    if not rif.search(t) and not re.search(r'emendament', t, re.I):
                        continue
                    n, per = conta_emendamenti(t)
                    inv['allegati'].append({'data': g.isoformat(), 'titolo': testo_link, 'url': u, 'file': os.path.relpath(f, GREZZI),
                                            'pagine': pagine, 'emendamenti_stimati': n, 'per_articolo': per})
                    print(f'   {g} allegato: {testo_link[:60]} ({n} emendamenti stimati)')
                except (Bloccato, NonPermesso, IOError) as e:
                    inv['problemi'].append(f'{u}: {e}')
            # 2) allegati dentro la pagina: le sezioni «ALLEGATO» che parlano dell'atto
            testo = estrai(dest)[0]
            for sez in re.split(r'\n\s*ALLEGATO\b', testo)[1:]:
                if rif.search(sez[:3000]) and re.search(r'emendament|proposte emendative', sez[:3000], re.I):
                    n, per = conta_emendamenti(sez)
                    inv['allegati'].append({'data': g.isoformat(), 'titolo': pulito(sez[:160]), 'url': url_bollettino(g),
                                            'file': os.path.relpath(dest, GREZZI), 'pagine': None, 'emendamenti_stimati': n,
                                            'per_articolo': per})
                    print(f'   {g} allegato nel bollettino ({n} emendamenti stimati)')
        g += datetime.timedelta(days=1)
    inv['totale_stimato'] = sum(a['emendamenti_stimati'] for a in inv['allegati'])
    scrivi_json('emendamenti.json', inv)
    scrivi_json('inventario.json', inv, cart)
    print(f"  {len(inv['allegati'])} allegati, {inv['totale_stimato']} emendamenti stimati: legge/manovra/dati/emendamenti.json")


# ---------------------------------------------------------------- numeri.json dai documenti letti

def _numero(s):
    s = s.replace(' ', '').replace('O', '0').replace(',', '.')
    return float(s)


def numeri_dpb(testo):
    pagine = testo.split('\f')
    for i, p in enumerate(pagine):
        k = p.find('TABELLA I.6-1')
        if k < 0 or 'Impieghi' not in p.replace('Im pieghi', 'Impieghi'):
            continue
        blocco = p[k:].replace('Im pieghi', 'Impieghi')
        sez, out = None, {'impieghi': [], 'risorse': []}
        for riga in blocco.splitlines():
            r = riga.strip()
            if r == 'Impieghi':
                sez = 'impieghi'
            elif r == 'Risorse':
                sez = 'risorse'
            elif r.replace(' ', '').startswith('IMPATTOCOMPLESSIVO'):
                out['impatto_complessivo'] = [_numero(x) for x in re.findall(r'-?\s?0\s?,\s?\d\s?\d', r.split('O M PLESSIVO')[-1])]
                break
            elif sez:
                m = re.match(r'(.+?)\s{2,}(no|si)\s+(e/s|e|s)\s+(-?\d,\d\d)\s+(-?\d,\d\d)\s+(-?\d,\d\d)$', r)
                if m:
                    out[sez].append({'voce': m.group(1), 'una_tantum': m.group(2) == 'si', 'entrate_spese': m.group(3),
                                     'valori': [_numero(m.group(j)) for j in (4, 5, 6)]})
        out['somma_impieghi'] = [round(sum(v['valori'][j] for v in out['impieghi']), 2) for j in range(3)]
        out['somma_risorse'] = [round(sum(v['valori'][j] for v in out['risorse']), 2) for j in range(3)]
        out['anni'] = [2027, 2028, 2029]
        out['unita'] = '% del PIL; negativo = peggiora il saldo (interventi), positivo = lo migliora (coperture)'
        out['pagina_pdf'] = i + 1
        return out
    return None


def numeri_dpfp(testo):
    p = next((x for x in testo.split('\f') if 'TAVOLA DI SINTESI' in x), None)
    if not p:
        return None
    blocchi = re.split(r'(DPFP 2026 - QUADRO PROGRAMMATICO|DPFP 2026 - QUADRO TENDENZIALE|DFP 2026 - QUADRO TENDENZIALE|RACCOMANDAZIONE DEL CONSIGLIO)', p)
    nomi = {'DPFP 2026 - QUADRO PROGRAMMATICO': 'programmatico', 'DPFP 2026 - QUADRO TENDENZIALE': 'tendenziale',
            'DFP 2026 - QUADRO TENDENZIALE': 'tendenziale_aprile', 'RACCOMANDAZIONE DEL CONSIGLIO': 'raccomandazione'}
    out = {'anni': [2025, 2026, 2027, 2028, 2029]}
    for j in range(1, len(blocchi), 2):
        q = {}
        for riga in blocchi[j + 1].splitlines():
            m = re.search(r'([A-Za-zà][^\d\-]*?\([^)]*\)(?: al netto NEC)?)\s+((?:-?[\dO],\d\s+){4}-?[\dO],\d|(?:-?\d{3},\d\s+){4}-?\d{3},\d)\s*$', riga)
            if m:
                q[re.sub(r'^(MACROECONOMIA|FINANZA PUBBLICA)\s+', '', m.group(1).strip())] = [_numero(x) for x in m.group(2).split()]
        out[nomi[blocchi[j]]] = q
    return out


def aggiorna_numeri():
    vecchi = leggi_json('numeri.json') or {}
    nuovi = {'_nota': 'Ricavato in automatico da scripts/legge-manovra.py dai testi di DPB 2027 e DPFP 2026: non modificare a mano.'}
    f_dpb = os.path.join(GREZZI, 'documenti', 'DPB-2027_Italia.txt')
    f_dpfp = os.path.join(GREZZI, 'documenti', 'DPFP-2026_Doc-CCXLIV-2.txt')
    if os.path.exists(f_dpb):
        nuovi['manovra_dpb'] = numeri_dpb(open(f_dpb, encoding='utf-8').read())
        nuovi['manovra_dpb_fonte'] = ['dpb', 'Tabella I.6-1, p. 11']
    if os.path.exists(f_dpfp):
        nuovi['quadro_dpfp'] = numeri_dpfp(open(f_dpfp, encoding='utf-8').read())
        nuovi['quadro_dpfp_fonte'] = ['dpfp', 'Tavola di sintesi, p. X']
    for k in ('manovra_dpb', 'quadro_dpfp'):
        if not nuovi.get(k) and vecchi.get(k):
            nuovi[k], nuovi[k + '_fonte'] = vecchi[k], vecchi.get(k + '_fonte')
    d = nuovi.get('manovra_dpb')
    if d:
        tot, imp, ris = d.get('impatto_complessivo', []), d['somma_impieghi'], d['somma_risorse']
        for j in range(min(3, len(tot))):
            if abs(imp[j] + ris[j] - tot[j]) > 0.03:
                print(f'  attenzione: Tabella I.6-1, anno {2027 + j}: la somma delle voci ({imp[j] + ris[j]:.2f}) non torna con il totale ({tot[j]})')
    scrivi_json('numeri.json', nuovi)
    return nuovi


def misure_piatte(sintesi):
    righe = []
    for t in sintesi['temi']:
        for m in t['misure']:
            righe.append({'tema': t['titolo'], 'misura': m['misura'], 'per_chi': m['per_chi'],
                          'euro_2027': (m.get('euro') or {}).get('2027'), 'euro_2028': (m.get('euro') or {}).get('2028'),
                          'euro_2029': (m.get('euro') or {}).get('2029'), 'valore_testo': m.get('valore_testo') or '',
                          'articolo': m.get('articolo'), 'rimandi': m['rimandi']})
    scrivi_json('misure.json', {'_nota': 'Ricavato da sintesi.json: una riga per misura.', 'misure': righe})
    return righe


# ---------------------------------------------------------------- la pagina

CSS_EXTRA = '''
  .dossier .scorri { margin: 18px 0 6px; overflow-x: auto; }
  .dossier .dato { margin: 22px 0; padding: 18px; background: var(--carta); border: 1px solid var(--riga); border-radius: 4px; }
  .dossier .dato figcaption { font-family: var(--cifre); font-size: 12px; letter-spacing: .04em; color: var(--inchiostro-3); margin-bottom: 12px; }
  .dossier .dato .nota { font-size: var(--s-1); color: var(--inchiostro-3); margin: 10px 0 0; }
  .dossier .numeri { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
  .dossier .numeri b { display: block; font-family: var(--titoli); font-size: clamp(26px, 3.6vw, 36px); line-height: 1; letter-spacing: -0.03em; color: var(--accento); }
  .dossier .numeri span { display: block; margin-top: 6px; font-size: var(--s0); color: var(--inchiostro-2); }
  .dossier .misure { list-style: none; padding: 0; display: grid; gap: 12px; }
  .dossier .misure b { color: var(--inchiostro); }
  .dossier .misure .chi { display: block; font-size: var(--s-1); color: var(--inchiostro-3); margin-top: 2px; }
  .dossier .stato { margin-top: 22px; }
  .dossier .stato p { margin: 0; }
  .dossier .in-arrivo p { margin: 0 0 8px; }
  .dossier .in-arrivo p:last-child { margin: 0; }
  .dossier .piccolo { font-size: var(--s-1); color: var(--inchiostro-3); }
'''


def pagina(sintesi, numeri, memorie, emendamenti, ddl):
    fonti_ = sintesi['fonti']
    indice = {f['id']: i + 1 for i, f in enumerate(fonti_)}

    def rim(rimandi):
        return ''.join(cit(indice[f], next(x['url'] for x in fonti_ if x['id'] == f), dove) for f, dove in rimandi)

    atto = sintesi['atto']
    numero_c = ((ddl or {}).get('camera') or {}).get('numero') or atto.get('camera')
    stato = atto['stato']
    if numero_c:
        stato = (f'Il disegno di legge è alla Camera come <b>C. {esc(numero_c)}</b>. ' +
                 'La sintesi qui sotto è ancora quella fatta prima del testo: articoli e cifre della relazione tecnica arrivano con il prossimo aggiornamento.')

    # In breve
    cifre = [('26 mld', 'valore della manovra nel 2027, secondo il Governo'), ('3,4%', 'deficit sul PIL programmato per il 2027 (2,9% senza manovra)'),
             ('146,3 mld', 'Fondo sanitario nazionale nel 2027 (+3,4 miliardi)'), ('0,6 punti', 'di PIL l\'anno per difesa ed energia che non contano nei limiti di spesa europei, nel 2027 e 2028')]
    breve = (f'<div class="dato numeri">' + ''.join(f'<div><b>{esc(c)}</b><span>{esc(t)}</span></div>' for c, t in cifre) + '</div>'
             '<ul class="lista">' + ''.join(f'<li>{p["testo"]}{rim(p["rimandi"])}</li>' for p in sintesi['in_breve']) + '</ul>')

    # Grafico: interventi del 2027 dalla Tabella I.6-1 del DPB
    grafico = ''
    d = (numeri or {}).get('manovra_dpb')
    if d:
        f_dpb = d and (numeri.get('manovra_dpb_fonte') or ['dpb', 'Tabella I.6-1, p. 11'])
        righe = []
        for v in d['impieghi']:
            x = -v['valori'][0]
            if x > 0:
                righe.append((esc(v['voce'] + (' (una tantum)' if v['una_tantum'] else '')), x, it(x, 2) + '%'))
        righe.sort(key=lambda r: -r[1])
        cop = sorted(((esc(v['voce'] + (' (una tantum)' if v['una_tantum'] else '')), v['valori'][0], it(v['valori'][0], 2) + '%')
                      for v in d['risorse'] if v['valori'][0] > 0), key=lambda r: -r[1])
        m = max([r[1] for r in righe] + [r[1] for r in cop])
        tot = d.get('impatto_complessivo') or [None]
        grafico = (f'<figure class="dato"><figcaption>DOVE VANNO I SOLDI NEL 2027 · IN % DEL PIL</figcaption>'
                   f'{barre(righe, m, evidenzia=lambda i, et, v: i == 0)}'
                   f'<figcaption style="margin-top:18px">CON COSA SI PAGA NEL 2027 · IN % DEL PIL</figcaption>{barre(cop, m)}'
                   f'<p class="nota">Interventi {it(-d["somma_impieghi"][0], 2)}% e coperture {it(d["somma_risorse"][0], 2)}% del PIL '
                   f'(somme nostre delle voci); effetto complessivo sul deficit indicato dalla tabella: '
                   f'{it(tot[0], 2) if tot[0] is not None else "n.d."}% (le piccole differenze vengono dagli arrotondamenti). '
                   f'Fonte: Documento programmatico di bilancio 2027, {esc(f_dpb[1])}{rim([f_dpb])}. '
                   f'«Fondo sentenze» è una voce una tantum che la tabella non descrive.</p></figure>')

    # Tabella ordinabile di tutte le misure
    righe_t = []
    for t in sintesi['temi']:
        for mi in t['misure']:
            e27 = (mi.get('euro') or {}).get('2027')
            righe_t.append([(esc(t['titolo']), t['titolo']), (esc(mi['misura']) + rim(mi['rimandi']), mi['misura']),
                            (esc(mi['per_chi']), mi['per_chi']),
                            (euro(e27) if e27 else '<span class="piccolo">' + (esc(mi.get('valore_testo')) or 'non indicato') + '</span>', e27 or -1),
                            (esc(mi['articolo']) if mi.get('articolo') else '<span class="piccolo" title="Il testo non è ancora pubblicato">—</span>', mi.get('articolo') or 'zzz')])
    tab = tabella('t-misure', [('Tema', 't'), ('Misura', 't'), ('Per chi', 't'), ('Euro 2027', 'n'), ('Articolo', 't')], righe_t)

    temi = ''.join(
        f'<h3 id="{esc(t["id"])}">{esc(t["titolo"])}</h3><p>{t["intro"]}{rim(t.get("rimandi", []))}</p><ul class="misure">' +
        ''.join(f'<li><b>{esc(mi["misura"])}.</b> {mi["cosa_cambia"]}{rim(mi["rimandi"])}<span class="chi">Per chi: {esc(mi["per_chi"])}'
                + (f' · Quanto: {esc(" · ".join(f"{euro(v)} nel {a}" for a, v in sorted((mi.get("euro") or {}).items()) if v))}' if any((mi.get("euro") or {}).values()) else '')
                + '</span></li>' for mi in t['misure']) + '</ul>'
        for t in sintesi['temi'])
    n_misure = sum(len(t['misure']) for t in sintesi['temi'])

    # Audizioni
    a = sintesi['audizioni']
    mem = memorie or {}
    gia = [x for x in mem.get('documenti', []) if x.get('categoria') == 'quadro' and not x.get('problema')]
    sul_ddl = [x for x in mem.get('documenti', []) if x.get('categoria') == 'ddl' and not x.get('problema')]

    def elenco_memorie(lista):
        return '<ul class="lista">' + ''.join(
            f'<li><a href="{esc(x["url"])}" target="_blank" rel="noopener">{esc(x["tipo"])} {esc(x["soggetto"])}</a> '
            f'<span class="piccolo">· seduta del {esc(data_it(x["seduta"]))}{" · " + str(x["pagine"]) + " pagine" if x.get("pagine") else ""}</span></li>'
            for x in lista) + '</ul>'

    audizioni = (f'<div class="in-arrivo"><p><b>In arrivo.</b> {esc(a["quando"])}</p><p>{esc(a["chi"])}{rim(a.get("rimandi", []))}</p><p>{esc(a["come"])}</p></div>'
                 + (f'<h3>Memorie sul disegno di legge già pubblicate: {len(sul_ddl)}</h3>' + elenco_memorie(sul_ddl) if sul_ddl else '')
                 + (f'<h3>Già online: la cornice dei conti</h3><p>{esc(a["gia_online"])}</p>' + elenco_memorie(gia) if gia else '')
                 + '<p class="piccolo">Le pagine da cui arriveranno: ' + ' · '.join(
                     f'<a href="{esc(u)}" target="_blank" rel="noopener">{esc(t)}</a>' for t, u in a['pagine']) + '</p>')

    # Emendamenti
    e = sintesi['emendamenti']
    em = emendamenti or {}
    gia_em = ''
    if em.get('allegati'):
        gia_em = (f'<p>Finora il Polpo ha trovato {len(em["allegati"])} allegati con circa {it(em.get("totale_stimato", 0))} '
                  'proposte di modifica (conteggio automatico, da verificare).</p>')
    emend = (f'<div class="in-arrivo"><p><b>In arrivo.</b> {esc(e["quando"])}</p><p>{esc(e["come"])}</p></div>{gia_em}'
             '<p class="piccolo">Le pagine da cui arriveranno: ' + ' · '.join(
                 f'<a href="{esc(u)}" target="_blank" rel="noopener">{esc(t)}</a>' for t, u in e['pagine'] if 'NUMERO' not in u) + '</p>')

    # Metodo
    letti = ('Il comunicato del Consiglio dei ministri del 28 ottobre 2026 sulla legge di bilancio; il Documento programmatico di bilancio 2027 '
             'inviato alla Commissione europea (44 pagine); il Documento programmatico di finanza pubblica 2026 (156 pagine); '
             'le pagine della Commissione Bilancio della Camera e i dati aperti di Camera e Senato per sapere a che punto è il testo.'
             + (f' In più {len(mem.get("documenti", []))} memorie delle audizioni, elencate qui sopra.' if mem.get('documenti') else ''))
    come = (f'Abbiamo letto i documenti per intero e messo in fila {n_misure} misure in {len(sintesi["temi"])} temi: cosa cambia, per chi, '
            'quanto vale. Le cifre sono solo quelle scritte nei documenti: dove il documento non dà un numero, non lo stimiamo. '
            'I numeri del grafico sono letti in automatico dalla tabella del Documento programmatico di bilancio. '
            'I dati sono scaricabili: <a href="dati/sintesi.json">sintesi.json</a>, <a href="dati/misure.json">misure.json</a>, '
            '<a href="dati/numeri.json">numeri.json</a>.')
    limiti = ('Il testo del disegno di legge, con articoli, relazione tecnica e prospetto degli effetti finanziari, non era ancora '
              'pubblicato quando abbiamo scritto: le misure vengono dal comunicato del Governo e possono cambiare nel testo depositato. '
              'Il sito del Senato non è leggibile da programmi automatici (ha un controllo anti-robot) e non lo abbiamo usato. '
              'Una misura annunciata non è ancora legge: il Parlamento può cambiarla.')
    verifiche = '<ul class="lista piccolo">' + ''.join(f'<li>{esc(v["cosa"])}: {esc(v["esito"])} ({esc(v["dove"])}).</li>' for v in atto['verifiche']) + '</ul>'

    corpo = f'''    <div class="in-arrivo stato"><p><b>A che punto è.</b> {stato}{rim(atto["rimandi"])}</p></div>
    <section id="in-breve"><h2>In breve</h2>
      {breve}</section>
    <section id="temi"><h2>La manovra misura per misura</h2>
      <p>Le misure annunciate, divise in {len(sintesi["temi"])} temi. Il Governo ha diviso la manovra in grandi voci, in percentuale del PIL (il valore di tutto ciò che il Paese produce in un anno): il grafico le mette in fila.</p>
      {grafico}
      <p>Tutte le misure in una tabella: clicca sul titolo di una colonna per ordinarla. Gli articoli arriveranno con il testo.</p>
      {tab}
      {temi}</section>
    <section id="audizioni"><h2>Le audizioni</h2>
      <p>Prima di votare, il Parlamento ascolta istituzioni, sindacati, imprese e associazioni: sono le audizioni.</p>
      {audizioni}</section>
    <section id="emendamenti"><h2>Gli emendamenti</h2>
      <p>Gli emendamenti sono le proposte di modifica al testo, presentate da deputati, relatori o Governo.</p>
      {emend}</section>
    <section id="metodo"><h2>Come l'abbiamo letto</h2>
      {dossier.metodo(letti, come, limiti, sintesi["aggiornato"])}
      <h3>Le verifiche sullo stato del testo</h3>
      {verifiche}</section>
    <section id="fonti"><h2>Fonti</h2>
      {dossier.fonti([(f["titolo"], f["url"]) for f in fonti_])}</section>'''
    return dossier.pagina('../../', 'La manovra letta dal Polpo',
                          'La legge di bilancio 2027 misura per misura: cosa cambia, per chi, quanto vale, con il rimando ai documenti ufficiali. Poi audizioni ed emendamenti.',
                          'Il Polpo legge per te · legge di bilancio 2027', 'La manovra letta dal Polpo',
                          'La legge di bilancio 2027 approvata dal Consiglio dei ministri il 28 ottobre: cosa cambia, per chi e quanto vale, '
                          'con il rimando al documento da cui viene ogni frase. Poi arriveranno le audizioni e gli emendamenti.',
                          corpo, braccio=4, css_extra=CSS_EXTRA)


def scrivi_pagina():
    sintesi = leggi_json('sintesi.json')
    if not sintesi:
        sys.exit('manca legge/manovra/dati/sintesi.json')
    numeri = aggiorna_numeri()
    misure_piatte(sintesi)
    out = pagina(sintesi, numeri, leggi_json('memorie.json'), leggi_json('emendamenti.json'), leggi_json('ddl.json'))
    with open(os.path.join(CARTELLA, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(out)
    print(f'legge/manovra/index.html scritta ({len(out) // 1024} kB)')


def main(argv):
    if '--ddl' in argv:
        modo_ddl()
    if '--memorie' in argv:
        modo_memorie()
    if '--emendamenti' in argv:
        n = argv[argv.index('--atto') + 1] if '--atto' in argv else None
        modo_emendamenti(n)
    if _bloccati:
        print('Siti bloccati (nessun aggiramento):', '; '.join(f'{h}: {m}' for h, m in _bloccati.items()))
    scrivi_pagina()


if __name__ == '__main__':
    main(sys.argv[1:])
