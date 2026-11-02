#!/usr/bin/env python3
"""Il Polpo legge per te: «Le trappole sanzionate».

I provvedimenti dell'Autorità garante della concorrenza e del mercato (AGCM) sulle pratiche commerciali
scorrette verso i consumatori (procedimenti PS, Codice del consumo artt. 20-27), sulle clausole vessatorie (CV),
sulle inottemperanze (IP) e su poche altre norme a tutela del consumatore (PV), dal 2024 a oggi: i trucchi
più usati, settore per settore, le sanzioni e il modo per riconoscerli.

Fonti:
  - bollettini settimanali dell'AGCM (PDF in ~/dati-civici/antitrust/bollettini/N-AA.pdf, dal n. 1 del 2024): pubblicano
    il testo integrale di ogni provvedimento. Il robots.txt di agcm.it vieta solo i bollettini fino al 2021. Il testo si
    estrae con pdftotext; dal «dispositivo» (la parte che decide) lo script legge esito e sanzione, impresa per impresa;
  - comunicati stampa e news di www.agcm.it: gli elenchi per anno (…/comunicati-stampa/index?anno=AAAA&limit=0)
    contengono già il testo completo di ogni comunicato, quindi bastano tre richieste per anno;
  - portale open data dati.agcm.it: il dataset «Istruttorie Tutela del Consumatore» (conteggi ufficiali per anno,
    esito e sanzioni). Il portale chiede 10 secondi tra una richiesta e l'altra (Crawl-Delay) e vieta /api/.
  Non si leggono i testi dei provvedimenti in /dettaglio?tc/ e /dotcmsCustom/tc/ (vietati dal robots.txt per tutti gli anni).

Uso:
  python3 -I -B scripts/legge-antitrust.py --scarica   # aggiorna i grezzi in ~/dati-civici/antitrust/ e rifà tutto
  python3 -I -B scripts/legge-antitrust.py             # rifà derivati e pagina dai grezzi già scaricati

Grezzi:   ~/dati-civici/antitrust/  (robots, html degli elenchi, comunicati.json, csv open data, bollettini/ e
          bollettini_txt/, bollettini.json con i provvedimenti sui consumatori estratti)
Derivati scritti a mano e qui solo letti:
          legge/antitrust/dati/provvedimenti.json  la lettura dei comunicati (settore, pratica, trappole, ricorsi al TAR);
          legge/antitrust/dati/classificazione.json  la lettura dei provvedimenti nei bollettini (imprese, settore,
          trappole, pratica) e le correzioni dei giudici.
Derivati scritti dallo script: decisioni.json e decisioni.csv (una riga per decisione finale, con link al bollettino),
          statistiche.json, sintesi.json (le trappole con i rimandi), riconciliazione.json (comunicati e bollettini a
          confronto), da_leggere.json (comunicati nuovi non ancora schedati) e legge/antitrust/index.html.
"""
import collections
import csv
import datetime
import html
import importlib.util
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GREZZI = os.path.expanduser('~/dati-civici/antitrust')
CARTELLA = os.path.join(REPO, 'legge', 'antitrust')
DATI = os.path.join(CARTELLA, 'dati')
# Gli agenti di intelligenza artificiale di cui rispettare i divieti nei robots.txt: i nomi stanno
# in ~/dati-civici/agenti-ia.txt (uno per riga), fuori dal repository.
def _agenti_ia():
    p = os.path.expanduser('~/dati-civici/agenti-ia.txt')
    return [r.strip() for r in open(p, encoding='utf-8') if r.strip()] if os.path.exists(p) else []


AGENTI_IA = _agenti_ia()

UA = 'PolpoCivico/1.0 (+https://casaleggiodavide-stack.github.io/agenti-civici/)'
AGCM = 'https://www.agcm.it'
OPEN = 'https://dati.agcm.it'
ANNO_INIZIO = 2024
SEGNALA = 'https://www.agcm.it/servizi/segnala-on-line'
MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']


def _carica(nome, file):
    spec = importlib.util.spec_from_file_location(nome, os.path.join(REPO, 'scripts', file))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


# ---------------------------------------------------------------- scarico (robots.txt rispettato, una richiesta al secondo)

_regole = {}     # host -> (lista di regex vietate, ritardo in secondi)
_ultima = {}     # host -> istante dell'ultima richiesta


def _regex(p):
    r = re.escape(p).replace(r'\*', '.*')
    if r.endswith(r'\$'):
        r = r[:-2] + '$'
    return re.compile(r, re.I)   # senza distinzione di maiuscole: più prudente


def _get_grezzo(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'it'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, r.read()


def robots(host):
    """Legge il robots.txt dell'host e tiene i divieti dei gruppi '*' e di quelli rivolti ad agenti AI noti."""
    if host in _regole:
        return _regole[host]
    _, corpo = _get_grezzo(f'https://{host}/robots.txt')
    testo = corpo.decode('utf-8', 'replace')
    open(os.path.join(GREZZI, f'robots-{host}.txt'), 'w', encoding='utf-8').write(testo)
    vietati, ritardo, agenti, in_regole = [], 1.1, [], False
    for riga in testo.splitlines():
        riga = riga.split('#')[0].strip()
        if ':' not in riga:
            continue
        k, v = [x.strip() for x in riga.split(':', 1)]
        k = k.lower()
        if k == 'user-agent':
            if in_regole:
                agenti, in_regole = [], False
            agenti.append(v.lower())
            continue
        in_regole = True
        nostro = any(a == '*' or any(s in a for s in ['polpo'] + [x.lower() for x in AGENTI_IA]) for a in agenti)
        if not nostro:
            continue
        if k == 'disallow' and v:
            vietati.append(_regex(v))
        elif k == 'crawl-delay':
            try:
                ritardo = max(ritardo, float(v))
            except ValueError:
                pass
    _regole[host] = (vietati, ritardo)
    return _regole[host]


def get(url):
    """GET rispettoso: controlla il robots.txt, aspetta il ritardo dell'host, si ferma davanti a blocchi."""
    p = urllib.parse.urlsplit(url)
    vietati, ritardo = robots(p.netloc)
    percorso = p.path + ('?' + p.query if p.query else '')
    if any(r.match(percorso) for r in vietati):
        raise SystemExit(f'robots.txt vieta {url}: non lo leggo')
    attesa = _ultima.get(p.netloc, 0) + ritardo - time.time()
    if attesa > 0:
        time.sleep(attesa)
    try:
        stato, corpo = _get_grezzo(url)
    except urllib.error.HTTPError as e:
        raise SystemExit(f'{url}: HTTP {e.code}. Mi fermo (possibile blocco o limite del sito).')
    finally:
        _ultima[p.netloc] = time.time()
    testo = corpo[:4000].decode('utf-8', 'replace').lower()
    if any(s in testo for s in ('captcha', 'cf-challenge', 'just a moment', 'access denied')):
        raise SystemExit(f'{url}: pagina di verifica anti-robot. Mi fermo.')
    return corpo


def scarica():
    os.makedirs(os.path.join(GREZZI, 'html'), exist_ok=True)
    oggi = datetime.date.today()
    salva = lambda nome, corpo: open(os.path.join(GREZZI, 'html', nome), 'wb').write(corpo)
    for anno in range(ANNO_INIZIO, oggi.year + 1):
        salva(f'cs-{anno}.html', get(f'{AGCM}/Media-e-Comunicazione/comunicati-stampa/index?anno={anno}&limit=0'))
        salva(f'news-{anno}.html', get(f'{AGCM}/Media-e-Comunicazione/news?anno={anno}&limit=0'))
        print('elenchi', anno)
    # le news che riguardano decisioni sui consumatori (PS, CV, moral suasion): il testo sta solo nella pagina di dettaglio
    for n in news_elenco():
        if re.match(r'(PS|CV)\d|Moral suasion', n['titolo']):
            f = os.path.join(GREZZI, 'html', f"news-{n['id']}.html")
            if not os.path.exists(f):
                salva(f"news-{n['id']}.html", get(AGCM + n['percorso']))
                print('news', n['titolo'][:70])
    # open data: il dataset più recente del gruppo «consumatore» (10 secondi tra le richieste)
    elenco = get(f'{OPEN}/dataset/?groups=consumatore').decode('utf-8', 'replace')
    slug = max(set(re.findall(r'/dataset/(istruttorie-tutela-del-consumatore-\d{4}-\d{4})', elenco)))
    pagina_ds = get(f'{OPEN}/dataset/{slug}').decode('utf-8', 'replace')
    url_csv = re.search(r'href="(https://dati\.agcm\.it/dataset/[^"]+\.csv)"', pagina_ds).group(1)
    open(os.path.join(GREZZI, 'opendata_consumatore.csv'), 'wb').write(get(url_csv))
    json.dump({'dataset': f'{OPEN}/dataset/{slug}', 'csv': url_csv, 'scaricato': oggi.isoformat()},
              open(os.path.join(GREZZI, 'opendata_consumatore.json'), 'w'), indent=1)
    print('open data', slug)


# ---------------------------------------------------------------- lettura dei grezzi

def _testo(frammento):
    t = re.sub(r'</p>|<br\s*/?>', '\n', frammento)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t))
    t = re.sub(r'[ \t\xa0]+', ' ', t)
    return re.sub(r'\n\s*\n+', '\n', t).strip()


def comunicati_elenco():
    out = []
    for f in sorted(os.listdir(os.path.join(GREZZI, 'html'))):
        if not re.fullmatch(r'cs-\d{4}\.html', f):
            continue
        h = open(os.path.join(GREZZI, 'html', f), encoding='utf-8').read()
        for c in h.split('<div class="card card-img')[1:]:
            d = re.search(r'var dateStr = "(\d{4}-\d\d-\d\d)', c)
            t = re.search(r'<h3 class="card-title[^>]*>\s*(.*?)\s*</h3>', c, re.S)
            l = re.search(r'<a class="read-more" href="([^"]+)"', c)
            tx = re.search(r'<div id="testo_com_\d+_hidden" hidden>(.*?)</div>\s*<script>', c, re.S)
            if d and t and l:
                out.append({'tipo': 'comunicato', 'data': d.group(1), 'titolo': html.unescape(re.sub(r'\s+', ' ', t.group(1))),
                            'url': AGCM + l.group(1), 'testo': _testo(tx.group(1)) if tx else ''})
    return out


def news_elenco():
    out = []
    for f in sorted(os.listdir(os.path.join(GREZZI, 'html'))):
        if not re.fullmatch(r'news-\d{4}\.html', f):
            continue
        h = open(os.path.join(GREZZI, 'html', f), encoding='utf-8').read()
        for c in h.split('<div class="card-body')[1:]:
            d = re.search(r'var dateStr = "(\d{4}-\d\d-\d\d)', c)
            t = re.search(r'<h3 class="card-title[^>]*>\s*(.*?)\s*</h3>', c, re.S)
            l = re.search(r'href="(/media-e-comunicazione/dettaglio-notizia\?id=([0-9a-f-]+)[^"]*)"', c)
            if d and t and l:
                percorso = html.unescape(l.group(1))
                out.append({'tipo': 'news', 'data': d.group(1), 'titolo': html.unescape(re.sub(r'\s+', ' ', t.group(1))),
                            'id': l.group(2), 'percorso': percorso, 'url': AGCM + percorso})
    return out


def news_testi():
    out = []
    for n in news_elenco():
        f = os.path.join(GREZZI, 'html', f"news-{n['id']}.html")
        if os.path.exists(f):
            h = re.sub(r'<script.*?</script>', '', open(f, encoding='utf-8').read(), flags=re.S)
            m = re.search(r'<h1[^>]*>.*?</h1>(.*?)(<footer|class="it-footer)', h, re.S)
            t = _testo(m.group(1)) if m else ''
            t = re.sub(r'^.*?Copia il link\s*', '', t, flags=re.S)
            out.append({**{k: n[k] for k in ('tipo', 'data', 'titolo', 'url')}, 'testo': t})
    return out


def open_data():
    f = os.path.join(GREZZI, 'opendata_consumatore.csv')
    meta = json.load(open(os.path.join(GREZZI, 'opendata_consumatore.json')))
    per_anno = collections.defaultdict(lambda: {'decisioni': 0, 'con_sanzione': 0, 'euro': 0.0, 'impegni': 0})
    testo = open(f, encoding='utf-8-sig').read()
    for r in csv.DictReader(io.StringIO(testo), delimiter=';'):
        anno, n = int(r['ANNO DECISIONE']), int(r['NUMERO'])
        euro = float(r['SANZIONE'].replace('€', '').replace('.', '').replace(',', '.').strip() or 0)
        a = per_anno[anno]
        a['decisioni'] += n
        a['euro'] += euro
        if euro > 0:
            a['con_sanzione'] += n
        if 'impegni' in r['ESITO'].lower():
            a['impegni'] += n
    return {'fonte': meta, 'per_anno': {k: dict(v) for k, v in sorted(per_anno.items()) if k >= ANNO_INIZIO}}


# ---------------------------------------------------------------- i bollettini settimanali (testi integrali dei provvedimenti)
# I PDF stanno in ~/dati-civici/antitrust/bollettini/N-AA.pdf; il testo estratto con pdftotext in bollettini_txt/.
# Il robots.txt di agcm.it vieta i bollettini fino al 2021 (…/bollettini/*-91.pdf … *-21.pdf), non quelli dal 2024.

BOLL_PDF = os.path.join(GREZZI, 'bollettini')
BOLL_TXT = os.path.join(GREZZI, 'bollettini_txt')
FINALI = ('sanzione', 'inottemperanza', 'impegni', 'non violazione', 'non luogo a provvedere')
_TESTA = re.compile(r'^\s{0,6}((?:[A-Z]{1,5})\d{2,6}[A-Z]{0,2}(?:[-–/_ ]+[A-Z]{0,5}\d{2,6}[A-Z]{0,2})*)\s*[-–]\s*(\S.*?)\s*$')
_SANZ = re.compile(r'sanzion[ei] amministrativ[ae] pecuniari[ae]\s+(?:complessiva\s+)?(?:,\s*)?(?:in solido\s+)?(?:di|pari a|nella misura di|per un importo (?:complessivo )?(?:di|pari a))\s+'
                   r'(?:euro\s+|€\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?', re.I)
_MESE = {m: i + 1 for i, m in enumerate(MESI)}


def scarica_bollettini():
    """Scarica i PDF dei bollettini che mancano, dal 2024 all'anno in corso (si ferma al primo numero che non esiste)."""
    os.makedirs(BOLL_PDF, exist_ok=True)
    for anno in range(ANNO_INIZIO, datetime.date.today().year + 1):
        aa = str(anno)[2:]
        for n in range(1, 60):
            f = os.path.join(BOLL_PDF, f'{n}-{aa}.pdf')
            if os.path.exists(f):
                continue
            try:
                corpo = get(f'{AGCM}/dotcmsdoc/bollettini/{anno}/{n}-{aa}.pdf')
            except SystemExit:
                break
            if not corpo.startswith(b'%PDF'):
                break
            open(f, 'wb').write(corpo)
            print('bollettino', n, anno)


def estrai_testi():
    """pdftotext -layout per i PDF nuovi o cambiati."""
    import subprocess
    os.makedirs(BOLL_TXT, exist_ok=True)
    for f in sorted(os.listdir(BOLL_PDF)) if os.path.isdir(BOLL_PDF) else []:
        if not re.fullmatch(r'\d+-\d\d\.pdf', f):
            continue
        pdf, txt = os.path.join(BOLL_PDF, f), os.path.join(BOLL_TXT, f[:-4] + '.txt')
        if not os.path.exists(txt) or os.path.getmtime(txt) < os.path.getmtime(pdf):
            subprocess.run(['pdftotext', '-layout', pdf, txt], check=True, capture_output=True)


def _norm(t):
    return re.sub(r'\s+', ' ', t)


def _data(t):
    m = re.search(r"ADUNANZA\s+de(?:l|ll['’])\s*(\d{1,2})\s*°?\s+([a-zà]+)\s+(\d{4})", t, re.I)
    return f'{m.group(3)}-{_MESE.get(m.group(2).lower(), 0):02d}-{int(m.group(1)):02d}' if m else None


def _dispositivo(t):
    """Dal primo «DELIBERA» (o «DISPONE») alla firma: la parte che decide."""
    ms = [m.start() for m in re.finditer(r'^\s*DELIBERA:?\s*$', t, re.M)] or [m.start() for m in re.finditer(r'^\s*DISPONE:?\s*$', t, re.M)]
    if not ms:
        return ''
    fine = [m.start() for m in re.finditer(r'IL SEGRETARIO GENERALE', t) if m.start() > ms[0]]
    return _norm(t[ms[0]:(fine[-1] if fine else len(t))])


def _importi(d):
    d = d.split('deve essere pagata')[0].split('Il pagamento deve')[0]
    return [int(x.replace('.', '')) for x in _SANZ.findall(d)]


def _esito(tipo, codice, d):
    if tipo == 'avviso':
        return 'avvio'
    dl = d.lower()
    if re.search(r'di contestare .{0,200}violazione|l.avvio del procedimento|riapertura del procedimento', dl[:600]) and 'irrogare' not in dl:
        return 'avvio'
    if re.search(r'annullamento del provvedimento|revoca del provvedimento', dl[:200]):
        return 'annullamento'
    if re.search(r'non vi è luogo a provvedere|venuti meno i motivi per provvedere', dl):
        return 'non luogo a provvedere'
    if re.search(r'non presenta.{0,40}elementi sufficienti', dl):
        return 'non violazione'
    if re.search(r'sostituire .{0,80}responsabile del procedimento|di non adottare la predetta misura cautelare', dl):
        return 'procedurale'
    if 'ridetermin' in dl:
        return 'rideterminazione'
    if re.search(r'sospensione provvisoria|in via cautelare|misure? cautelar|ai sensi dell.articolo 27, comma 3', dl) and 'irrogare' not in dl \
            and not re.search(r'pratica commerciale.{0,200}costituisce', dl):
        return 'cautelare'
    if re.search(r'(le|la) modific\w+ propost\w+.{0,40}agli impegni', dl):
        return 'modifica impegni'
    if _importi(d):
        return 'inottemperanza' if codice.startswith('IP') else 'sanzione'
    if re.search(r'rendere obbligatori|impegni.{0,200}obbligatori|obbligatori.{0,60}impegni', dl):
        return 'impegni'
    if re.search(r'non costituisc|non integr|non sussist|non è vessatori|non sono vessatori|non risult', dl):
        return 'non violazione'
    if re.search(r'avvi\w+ (un |il )?(procedimento|istruttoria)|estensione (oggettiva|soggettiva)', dl):
        return 'avvio'
    return 'altro'


def blocchi_bollettini():
    """Un blocco per ogni provvedimento PS/CV/IP/PV dei bollettini: codice, provvedimento, data, pagina, esito, euro."""
    out = []
    for f in sorted(os.listdir(BOLL_TXT)) if os.path.isdir(BOLL_TXT) else []:
        m = re.fullmatch(r'(\d+)-(\d\d)\.txt', f)
        if not m:
            continue
        num, aa = int(m.group(1)), m.group(2)
        righe = []
        for pg, testo in enumerate(open(os.path.join(BOLL_TXT, f), encoding='utf-8', errors='replace').read().split('\f')):
            righe += [(pg + 1, r) for r in testo.split('\n')]
        teste = []
        for i, (pg, r) in enumerate(righe):
            mt = _TESTA.match(r)
            if not mt or re.search(r'\s\d{1,3}\s*$', r):       # nel sommario la riga finisce con il numero di pagina
                continue
            titolo, prov, tipo = mt.group(2), None, None
            for j in range(i + 1, min(i + 7, len(righe))):
                rj = righe[j][1].strip()
                mp = re.match(r'Provvedimento n\.\s*(\d+)\s*$', rj)
                if mp:
                    prov, tipo = mp.group(1), 'provvedimento'
                    break
                if re.match(r'Avviso', rj) and not re.search(r'\d+\s*$', rj):
                    tipo = 'avviso'
                    break
                if rj and not re.search(r'\d\s*$', rj):
                    titolo += ' ' + rj
            if tipo:
                teste.append((i, mt.group(1), titolo, prov, tipo, pg))
        for k, (i, codice, titolo, prov, tipo, pg) in enumerate(teste):
            if not re.match(r'(PS|CV|IP|PV)\d', codice):
                continue
            fine = teste[k + 1][0] if k + 1 < len(teste) else len(righe)
            for j in range(i + 3, fine):                       # un provvedimento senza codice (es. «Varie») chiude il blocco
                if re.match(r'\s*Provvedimento n\.\s*\d+\s*$', righe[j][1]):
                    fine = j - 3
                    break
            testo = '\n'.join(r for _, r in righe[i:fine])
            disp = _dispositivo(testo)
            esito = _esito(tipo, codice, disp)
            out.append({'boll': f'{num}-{aa}', 'anno_boll': 2000 + int(aa), 'num_boll': num, 'pagina': pg,
                        'codice': codice.replace('–', '-').split()[0], 'titolo': _norm(titolo), 'prov': prov, 'tipo': tipo,
                        'data': _data(testo), 'esito': esito, 'importi': _importi(disp) if esito in ('sanzione', 'inottemperanza') else [],
                        'misure': [int(x.replace('.', '')) for x in re.findall(r'nella misura di (?:euro\s+)?(\d{1,3}(?:\.\d{3})+|\d+)', disp)] if esito == 'rideterminazione' else [],
                        'annulla': re.findall(r'provvedimento (?:del [^,]{4,30},\s*)?n\.\s*(\d{5})', disp[:300]) if esito == 'annullamento' else [],
                        'sentenze': list(dict.fromkeys(re.findall(r'sentenza del Consiglio di Stato.{0,60}?n\.\s*\d+(?:/\d{4})?', _norm(testo))))[:2],
                        'dispositivo': disp[:3000]})
    return out


def url_boll(b):
    aa = b['boll'].split('-')[1]
    return f"{AGCM}/dotcmsdoc/bollettini/20{aa}/{b['boll']}.pdf#page={b['pagina']}"


def per_impresa(disp, imprese):
    """Somma delle sanzioni per impresa dal dispositivo; chi è condannato «in solido» resta in coppia."""
    out = collections.OrderedDict()
    for seg in re.split(r'(?:(?<=;)|(?<=DELIBERA))\s+(?=[a-h]\)\s)|(?=\b(?:irrogare|applicare)\b)', disp.split('deve essere pagata')[0])[1:]:
        imp = _importi(seg)
        if not imp:
            continue
        chi = []
        for nome in imprese:
            if 'persona fisica' in nome:
                if re.search(r'\b(Sig\.|sig\.|signor|signora)', seg[:300]) and nome not in chi:
                    chi.append(nome)
                continue
            parola = next((w for w in re.split(r'[\s,.]+', nome) if len(w) >= 4 and w.lower() not in ('società', 'societa', 'cooperativa', 'group', 'italia', 'italy')), nome.split()[0])
            if parola.lower() in seg[:300].lower():
                chi.append(nome)
        chiave = ' e '.join(chi) if chi else imprese[0] if len(imprese) == 1 else 'non attribuita'
        out[chiave] = out.get(chiave, 0) + sum(imp)
    return dict(out)


# ---------------------------------------------------------------- le trappole (sintesi scritta a mano, rimandi ai casi)
# casi: codici dei procedimenti

GARANZIA, TRUFFE, RECLAMI = '../../garanzia/', '../../truffe/', '../../reclami-pa/'
TRAPPOLE = [
    ('costi-nascosti', 'Il prezzo che cresce alla cassa',
     'Il prezzo esposto è basso; poi, passo dopo passo, si aggiungono commissioni di servizio, costi di consegna, supplementi o tariffe fisse che all\'inizio non erano chiari. A volte il prezzo base semplicemente non si trova, e resta solo il pacchetto più caro (il biglietto con la visita guidata).',
     'Il totale compare solo all\'ultima schermata; spuntano voci come «commissione di servizio», «gestione pratica», «fee»; il prezzo pubblicizzato vale solo a condizioni scritte in piccolo.',
     'Confronta il totale finale, non il prezzo di partenza. Se la commissione non era indicata fin dall\'inizio puoi <a href="{segnala}" target="_blank" rel="noopener">segnalarlo all\'Autorità</a>.',
     ['PS12603', 'CV263', 'PS12974', 'PS12717']),
    ('sovrapprezzo-carta', 'Il sovrapprezzo se paghi con la carta',
     'Il venditore aggiunge qualche euro, o qualche centesimo al litro, se paghi con carta, American Express o PayPal. In Italia è vietato: il Codice del consumo (art. 62) non permette di far pagare al cliente lo strumento di pagamento che sceglie.',
     '«+3% con PayPal», «commissione carta», un prezzo alla pompa diverso tra contanti e carta.',
     'Chiedi lo stesso prezzo; fotografa il cartello o lo schermo e <a href="{segnala}" target="_blank" rel="noopener">segnala</a>.',
     ['PS12727', 'IP369', 'PS12619']),
    ('falsi-sconti', 'Lo sconto su un prezzo mai esistito',
     'Il prezzo «barrato» non è mai stato davvero praticato, oppure il prezzo «in offerta» non è più basso di quello delle settimane prima. Chi annuncia uno sconto deve indicare il prezzo più basso degli ultimi 30 giorni (Codice del consumo, art. 17-bis).',
     'Manca il prezzo più basso dei 30 giorni; lo «sconto» è sempre lì, settimana dopo settimana; il cartellino arriva dalla fabbrica già con due prezzi.',
     'Cerca la riga «prezzo più basso degli ultimi 30 giorni» e confrontala con il prezzo scontato; se manca, <a href="{segnala}" target="_blank" rel="noopener">segnala</a>.',
     ['PS12706', 'PS12704', 'PS12804']),
    ('fretta', 'Il conto alla rovescia che riparte',
     'Timer, «ultimi pezzi», «termina domenica», il venditore a domicilio che insiste: servono a non farti pensare. Nei casi sanzionati il timer ripartiva da capo alla scadenza e la scarsità era costruita.',
     'La scadenza si rinnova; messaggi come «12 persone stanno guardando»; pressione a firmare subito, magari a casa tua.',
     'Riapri la pagina il giorno dopo: se l\'offerta c\'è ancora, non era a tempo. Se hai firmato a casa o online hai 14 giorni per ripensarci: il Polpo ti aiuta a <a href="' + GARANZIA + '">scrivere il recesso</a>.',
     ['PS13027', 'PS12853', 'PS12706']),
    ('preselezioni', 'La casella già spuntata',
     'L\'opzione più cara o ricorrente è già scelta per te: l\'acquisto periodico al posto di quello singolo, la versione «Plus» dell\'abbonamento, il servizio per andata e ritorno. Se non stai attento, la confermi.',
     'Pallini e caselle già selezionati; il pulsante colorato per l\'opzione costosa e quello grigio per l\'altra.',
     'Rileggi ogni scelta prima di pagare: per un pagamento in più il venditore deve avere il tuo consenso espresso, non una casella già spuntata (Codice del consumo, art. 65).',
     ['PS12585', 'PS12853', 'PS12689']),
    ('rinnovi-recesso', 'L\'abbonamento da cui non si esce',
     'Entrare è un clic, uscire un percorso a ostacoli: rinnovo automatico senza preavviso, aumenti annunciati in mail che sembrano pubblicità o applicati anche a chi aveva un prezzo «finché non disdici», istruzioni per disdire introvabili, disdette ignorate e fatture che continuano.',
     'Il contratto non dice chiaramente come e quando disdire; la disdetta si fa solo al telefono; il servizio clienti prova a «trattenerti».',
     'Segna la data di rinnovo e disdici per iscritto (PEC o raccomandata), conservando la ricevuta. Per i contratti online o fuori dai negozi hai 14 giorni di ripensamento: <a href="' + GARANZIA + '">prepara la lettera</a>.',
     ['PS12917', 'PS12879', 'PS12558']),
    ('non-richiesti', 'Il servizio che non hai chiesto',
     'Ti ritrovi un contratto, un dispositivo o un contributo mai chiesto: forniture di luce e gas attivate senza firma, accessori a pagamento installati sull\'ascensore, un servizio online «per scrivere la disdetta» che diventa un abbonamento, un «contributo verde» imposto.',
     'In bolletta o in fattura compare una voce nuova; ti dà il benvenuto un fornitore che non hai scelto; arrivano solleciti per un servizio che non ricordi di aver comprato.',
     'Non pagare ciò che non hai chiesto: per le forniture non richieste non è dovuto nulla (Codice del consumo, art. 66-quinquies). Contesta per iscritto e <a href="{segnala}" target="_blank" rel="noopener">segnala</a>.',
     ['PS12557', 'PS12789', 'PS12700']),
    ('travestimenti', 'Chi si spaccia per un altro',
     'Il call center dice di chiamare «dall\'Autorità» o dall\'ufficio tecnico del tuo fornitore; il sito ha il nome e la grafica della compagnia di traghetti ma è un rivenditore con le sue commissioni; l\'agenzia funebre privata si presenta come «ufficiale del Comune»; il modulo sembra un aggiornamento gratuito dei dati dell\'impresa e invece è un contratto.',
     'Chi chiama annuncia rincari o guasti imminenti e ti offre la soluzione; l\'indirizzo del sito non è quello ufficiale; nel modulo c\'è una firma e una cifra in piccolo.',
     'Riaggancia e richiama tu il numero che trovi in bolletta. Per un messaggio o un sito sospetto chiedi al Polpo <a href="' + TRUFFE + '">se è una truffa</a>.',
     ['PS12978', 'PS12898', 'PS12571', 'IP367']),
    ('dopo-vendita', 'Dopo il pagamento, i diritti negati',
     'Il prodotto arriva in ritardo, incompleto o non arriva; l\'assistenza non risponde; il rimborso non arriva; per avere quello che ti spetta servono passaggi inutili. Rientrano qui anche le bollette di luce, gas e acqua per consumi di oltre due anni prima, che per legge non si devono più pagare e che sono state chieste lo stesso.',
     'Disponibilità «immediata» su prodotti che non ci sono; tempi strettissimi per i reclami; nessun contatto, solo un modulo; una bolletta con consumi vecchi di anni.',
     'La garanzia legale dura due anni e il venditore deve riparare, sostituire o rimborsare: <a href="' + GARANZIA + '">il Polpo scrive la richiesta</a>. Per bollette con consumi di oltre due anni puoi chiedere la prescrizione; per i servizi pubblici, come acqua, bus e metro, si comincia dal <a href="' + RECLAMI + '">reclamo all\'ente</a>.',
     ['PS11564B', 'PS12515', 'PS12580', 'PS13019']),
    ('green-etica', 'Verde ed etico solo a parole',
     '«Impatto zero», «100% green», «circolare», «rispettiamo i lavoratori»: affermazioni generiche o smentite dai fatti, usate per vendere. Qui rientra anche la beneficenza annunciata ma non davvero legata all\'acquisto.',
     'Parole assolute senza numeri né certificazioni; compensazioni presentate come assenza di emissioni; la linea «sostenibile» è una piccola parte del catalogo.',
     'Cerca dati verificabili: quale fase del ciclo di vita, quale certificazione. La direttiva europea 2024/825 vieta i vanti ambientali generici e chiede di applicare le nuove regole dal 27 settembre 2026.',
     ['PS12525', 'PS12793', 'PS12709']),
    ('promesse', 'La promessa che il prodotto non mantiene',
     'Auto «italiane» fatte in Cina, autonomia delle auto elettriche indicata solo in teoria, solari che «si rinforzano» con l\'acqua, tabacco «senza fumo» presentato come innocuo, un «cashback» che in realtà è un investimento, offerte «unlimited» con limiti, titoli di giornale che l\'articolo non mantiene.',
     'Superlativi senza prove; la frase forte nello spot e la smentita nel foglietto o nelle condizioni.',
     'Leggi condizioni e foglietto prima di comprare. Se il prodotto non è come promesso è un difetto di conformità: <a href="' + GARANZIA + '">fai valere la garanzia</a>.',
     ['PS12638', 'PS12940', 'PS12985']),
    ('recensioni', 'Recensioni, follower e pubblicità nascosta',
     'Recensioni non controllate anche quando sono segnate come «verificate», siti che vendono follower, like e recensioni a pacchetti, comparatori pagati dai fornitori, influencer e giornali che non dicono di fare pubblicità.',
     'Solo recensioni entusiaste e tutte simili; manca la scritta «pubblicità» o #adv; il comparatore non dice chi lo paga; la classifica non spiega come è fatta.',
     'Leggi le recensioni negative e le più recenti; chiediti chi paga il comparatore o la classifica. Ad ottobre 2026 l\'Autorità ha pubblicato le Linee guida sulle recensioni online.',
     ['PS12962', 'PS12798', 'PS12920']),
    ('clausole', 'Le clausole scritte a senso unico',
     'Nel contratto ci sono regole che pesano solo su di te: una tariffa fissa per ogni multa presa con l\'auto a noleggio, l\'esclusiva con il mediatore del mutuo, il diritto dell\'azienda di cambiare servizio e prezzi quando vuole, limiti al recesso, il tribunale lontano da casa. Dal 2022 l\'Autorità può multare anche le clausole vessatorie.',
     '«La società può modificare in qualsiasi momento…», «penale», «fee amministrativa», «esclusiva», un foro competente diverso dalla tua residenza.',
     'Una clausola vessatoria non vale anche se l\'hai firmata: contestala per iscritto. Il giudice competente è quello del luogo in cui vive il consumatore.',
     ['CV263', 'CV242', 'PS12922']),
    ('dati-account', 'I tuoi dati e il tuo account come merce',
     'Consensi all\'uso dei dati chiesti con spiegazioni incomplete o con un ricatto (l\'app della banca che si blocca se non le dai accesso al telefono); account o conti bloccati senza preavviso, senza spiegazioni e senza possibilità di replica, a volte con i tuoi soldi dentro.',
     'Il pulsante «accetta tutto» in evidenza e il rifiuto nascosto; nessuna indicazione su come contestare un blocco.',
     'Scegli «personalizza» e limita i consensi. Se il conto è bloccato chiedi per iscritto il motivo e i tempi, poi <a href="{segnala}" target="_blank" rel="noopener">segnala</a>.',
     ['PS12974', 'PS12768', 'PS12566']),
    ('minori', 'Ragazzi e persone fragili nel mirino',
     'Sfide social pericolose rilanciate dall\'algoritmo, snack venduti come «sfida», dispositivi al tabacco presentati come oggetti di design, venditori a domicilio che insistono con le persone anziane.',
     'Pubblicità che punta sull\'emulazione e sulla sfida; avvertenze assenti; acquisti dentro i giochi in monete virtuali che nascondono il prezzo in euro.',
     'Imposta i controlli parentali al livello più protettivo. Ricorda a chi è più fragile che dopo una vendita a domicilio ci sono 14 giorni per ripensarci: <a href="' + GARANZIA + '">ecco come</a>.',
     ['PS12543', 'PS12661', 'PS12524']),
]

# comunicati sui consumatori letti ma senza scheda nel catalogo dei comunicati, con il motivo
LETTI_SENZA_SCHEDA = {
    'PS12483': 'verifica degli impegni accettati nel 2023',
    'PS12615-PS12616-PS12617': 'sanzioni deliberate a fine 2023',
    'Grazie-a-impegni-presi-con-Autorita': 'riepilogo di decisioni del 2023 sull\'energia',
}


# ---------------------------------------------------------------- derivati

def euro_t(v, nota=None):
    return (f'{nota} ' if nota else '') + _dossier.euro(v).replace(',0 ', ' ')


def controlla_comunicati(cat):
    """Controllo del catalogo dei comunicati contro i grezzi: ogni rimando esiste, e cosa resta da leggere."""
    testi = comunicati_elenco() + news_testi()
    json.dump(testi, open(os.path.join(GREZZI, 'comunicati.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    noti = {t['url'] for t in testi}
    usati = {x['url'] for x in cat['decisioni'] + cat['moral_suasion'] + cat['in_corso']}
    mancanti = sorted(usati - noti)
    if mancanti:
        print('ATTENZIONE: rimandi non trovati nei grezzi:', *mancanti, sep='\n  ')
    consumatori = [t for t in testi if re.match(r'(PS|CV|IP|PV)\d', t['titolo']) or re.search(r'surcharge|ristori a consumatori|Moral suasion', t['titolo'])]
    seguiti = {n for d in cat['decisioni'] for n in d['numeri']}
    da_leggere = []
    for t in consumatori:
        if t['url'] in usati or any(k in t['url'] for k in LETTI_SENZA_SCHEDA):
            continue
        codici = set(re.findall(r'(?:PS|CV|IP|PV)\d+', t['titolo']))
        if codici and codici <= seguiti | {'PS12810', 'PS12811', 'PS12812', 'PS12813', 'PS12977', 'PS12979', 'PS12793', 'PS12805', 'PV27'}:
            continue   # avvio di un procedimento già chiuso nel catalogo
        da_leggere.append({'data': t['data'], 'titolo': t['titolo'], 'url': t['url']})
    json.dump(da_leggere, open(os.path.join(DATI, 'da_leggere.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if da_leggere:
        print(f'{len(da_leggere)} comunicati da leggere e schedare (dati/da_leggere.json)')
    return testi, consumatori


def derivati():
    cat = json.load(open(os.path.join(DATI, 'provvedimenti.json'), encoding='utf-8'))
    cls = json.load(open(os.path.join(DATI, 'classificazione.json'), encoding='utf-8'))
    testi, consumatori = controlla_comunicati(cat)
    # dal catalogo dei comunicati: codice -> scheda (settore, trappole, pratica, comunicato, TAR, ristori)
    da_com = {}
    for d in cat['decisioni']:
        for n in d['numeri']:
            if not n.startswith('('):
                da_com[n] = d

    estrai_testi()
    blocchi = blocchi_bollettini()
    json.dump([{k: v for k, v in b.items() if k != 'dispositivo'} for b in blocchi],
              open(os.path.join(GREZZI, 'bollettini.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    annullati = {n for b in blocchi if b['esito'] == 'annullamento' for n in b['annulla']}

    dec, mancano = [], []
    for b in blocchi:
        if b['esito'] not in FINALI or not b['data'] or b['data'][:4] < str(ANNO_INIZIO):
            continue
        c = cls['procedimenti'].get(b['codice'], {})
        com = da_com.get(b['codice'], {})
        if len(com.get('numeri', [])) > 1 and 'imprese' not in c:
            mancano.append(b['codice'] + ' (imprese)')
        imprese = c.get('imprese') or com.get('imprese')
        settore, trappole, pratica = (c.get('settore') or com.get('settore'), c.get('trappole') or com.get('trappole'), c.get('pratica') or com.get('pratica'))
        if not (imprese and settore and trappole and pratica):
            mancano.append(f"{b['codice']} {b['titolo'][:50]}")
            continue
        euro = sum(b['importi'])
        annullata = b['prov'] in annullati
        dec.append({'codice': b['codice'], 'provvedimento': b['prov'], 'data': b['data'], 'anno': int(b['data'][:4]),
                    'bollettino': b['boll'], 'pagina': b['pagina'], 'url': url_boll(b),
                    'imprese': imprese, 'settore': settore, 'trappole': trappole, 'pratica': pratica,
                    'norma': re.match(r'[A-Z]+', b['codice']).group(), 'esito': b['esito'], 'euro': 0 if annullata else euro,
                    'euro_deliberati': euro, 'annullata': annullata,
                    'per_impresa': (lambda pi: pi if sum(pi.values()) == euro else {imprese[0]: euro} if len(imprese) == 1
                                    else {**pi, 'non attribuita': euro - sum(pi.values())})(per_impresa(b['dispositivo'], imprese)) if euro else {},
                    'comunicato': com.get('url'), 'tar': com.get('tar'), 'ristori': com.get('ristori')})
    if mancano:
        print('ATTENZIONE: decisioni senza classificazione:', *mancano, sep='\n  ')
    dec.sort(key=lambda d: d['data'])
    per_cod = {d['codice']: d for d in dec}

    # riconciliazione con il catalogo dei comunicati
    ric = []
    for d in cat['decisioni']:
        cod = [n for n in d['numeri'] if not n.startswith('(')]
        trov = [per_cod[n] for n in cod if n in per_cod]
        bol = sum(x['euro_deliberati'] for x in trov)
        stato = 'non trovata nei bollettini' if not trov else 'uguale' if bol == d['euro'] else 'importo diverso'
        if not cod:
            stato = 'senza codice nel comunicato'
        ric.append({'numeri': d['numeri'], 'imprese': d['imprese'], 'comunicato_data': d['data'], 'euro_comunicato': d['euro'], 'nota_comunicato': d.get('euro_nota'),
                    'euro_bollettini': bol, 'trovati': [x['codice'] for x in trov], 'stato': stato,
                    'date_delibera': sorted({x['data'] for x in trov})})
    json.dump(ric, open(os.path.join(DATI, 'riconciliazione.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    # le correzioni dei giudici e gli annullamenti
    giudici = []
    for b in blocchi:
        if b['esito'] in ('rideterminazione', 'annullamento') and b['data'] and b['data'][:4] >= str(ANNO_INIZIO):
            g = cls.get('giudici', {}).get(b['codice'], {})
            giudici.append({'codice': b['codice'], 'data': b['data'], 'esito': b['esito'], 'imprese': g.get('imprese', b['titolo']),
                            'pratica': g.get('pratica', ''), 'anno_originale': g.get('anno_originale'), 'nuova_sanzione': sum(b['misure']),
                            'sentenze': b['sentenze'], 'url': url_boll(b)})

    # avvii e misure cautelari: per anno del bollettino (gli avvisi non hanno la data dell'adunanza)
    avvii = collections.Counter(b['anno_boll'] for b in blocchi if b['esito'] == 'avvio')
    cautelari = collections.Counter(b['anno_boll'] for b in blocchi if b['esito'] == 'cautelare')
    modifiche = [b['codice'] for b in blocchi if b['esito'] == 'modifica impegni']

    # numeri
    od = open_data()
    per_anno = collections.OrderedDict()
    for d in dec:
        a = per_anno.setdefault(d['anno'], {'decisioni': 0, 'sanzioni': 0, 'impegni': 0, 'senza_violazione': 0, 'euro': 0, 'euro_deliberati': 0})
        a['decisioni'] += 1
        a['sanzioni'] += d['esito'] in ('sanzione', 'inottemperanza')
        a['impegni'] += d['esito'] == 'impegni'
        a['senza_violazione'] += d['esito'] in ('non violazione', 'non luogo a provvedere')
        a['euro'] += d['euro']
        a['euro_deliberati'] += d['euro_deliberati']
    for anno, a in per_anno.items():
        a['avvii'], a['cautelari'] = avvii.get(anno, 0), cautelari.get(anno, 0)
        if anno in od['per_anno']:
            a['open_data'] = od['per_anno'][anno]
    sanz = [d for d in dec if d['euro'] > 0]
    per_settore = {}
    for d in dec:
        s = per_settore.setdefault(d['settore'], {'decisioni': 0, 'sanzioni': 0, 'euro': 0, 'trappole': collections.Counter()})
        s['decisioni'] += 1
        s['sanzioni'] += d['euro'] > 0
        s['euro'] += d['euro']
        s['trappole'].update(t for t in d['trappole'] if t != 'altro')
    per_trappola = {}
    for tid in [t[0] for t in TRAPPOLE] + ['altro']:
        ds = [d for d in dec if tid in d['trappole']]
        ms = [m for m in cat['moral_suasion'] if tid in m['trappole']]
        per_trappola[tid] = {'decisioni': len(ds), 'sanzioni': sum(d['euro'] > 0 for d in ds), 'euro': sum(d['euro'] for d in ds),
                             'moral_suasion': len(ms), 'settori': [s for s, _ in collections.Counter(d['settore'] for d in ds).most_common()]}
    imprese = {i for d in dec for i in d['imprese'] if 'persona fisica' not in i}
    stat = {
        'periodo': [dec[0]['data'], dec[-1]['data']],
        'bollettini_letti': len({b['boll'] for b in blocchi}) if blocchi else 0,
        'bollettini_file': len([f for f in os.listdir(BOLL_TXT) if f.endswith('.txt')]) if os.path.isdir(BOLL_TXT) else 0,
        'provvedimenti_consumatore': len(blocchi),
        'comunicati_letti': len(consumatori),
        'decisioni': len(dec), 'imprese': len(imprese),
        'con_sanzione': len(sanz), 'impegni': sum(d['esito'] == 'impegni' for d in dec),
        'senza_violazione': sum(d['esito'] in ('non violazione', 'non luogo a provvedere') for d in dec),
        'inottemperanze': sum(d['esito'] == 'inottemperanza' for d in dec),
        'euro_totale': sum(d['euro'] for d in dec),
        'avvii': sum(avvii.values()), 'cautelari': sum(cautelari.values()), 'modifiche_impegni': modifiche,
        'moral_suasion': len(cat['moral_suasion']),
        'per_anno': per_anno,
        'per_settore': {k: {**v, 'trappole': dict(v['trappole'].most_common())} for k, v in sorted(per_settore.items(), key=lambda x: -x[1]['euro'])},
        'per_trappola': per_trappola,
        'sanzioni_piu_alte': [{k: d.get(k) for k in ('data', 'codice', 'imprese', 'settore', 'pratica', 'euro', 'per_impresa', 'url', 'comunicato', 'tar')}
                              for d in sorted(sanz, key=lambda d: -d['euro'])[:15]],
        'giudici': giudici,
        'riconciliazione': collections.Counter(r['stato'] for r in ric),
        'open_data': od,
    }
    json.dump(stat, open(os.path.join(DATI, 'statistiche.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=int)

    sintesi = {'nota': 'Le trappole sono una lettura dei provvedimenti dell\'AGCM (bollettini settimanali e comunicati) fatta con un assistente AI e controllata a mano. '
                       'Una decisione può ricadere in più trappole: gli euro di una decisione contano per ogni trappola che contiene.',
               'trappole': []}
    for tid, titolo, come, ricon, fare, casi in TRAPPOLE:
        sintesi['trappole'].append({'id': tid, 'titolo': titolo, 'come_funziona': come, 'come_riconoscerla': ricon,
                                    'cosa_fare': re.sub(r'<[^>]+>', '', fare.format(segnala=SEGNALA)), **per_trappola[tid],
                                    'casi': [{k: per_cod[c][k] for k in ('codice', 'provvedimento', 'data', 'imprese', 'esito', 'euro', 'url', 'comunicato')} for c in casi]})
    json.dump(sintesi, open(os.path.join(DATI, 'sintesi.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    json.dump(dec, open(os.path.join(DATI, 'decisioni.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with open(os.path.join(DATI, 'decisioni.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['data_delibera', 'procedimento', 'provvedimento', 'bollettino', 'pagina', 'imprese', 'settore', 'norma', 'esito', 'sanzione_euro',
                    'sanzione_per_impresa', 'annullata', 'trappole', 'pratica', 'url_bollettino', 'url_comunicato'])
        for d in dec:
            w.writerow([d['data'], d['codice'], d['provvedimento'], d['bollettino'], d['pagina'], '; '.join(d['imprese']), d['settore'], d['norma'], d['esito'],
                        d['euro'], '; '.join(f'{k}: {v}' for k, v in d['per_impresa'].items()), 'sì' if d['annullata'] else '', ' '.join(d['trappole']),
                        d['pratica'], d['url'], d['comunicato'] or ''])
    vecchio = os.path.join(DATI, 'provvedimenti.csv')
    if os.path.exists(vecchio):
        os.remove(vecchio)   # sostituito da decisioni.csv
    return cat, dec, per_cod, stat, {t['url']: t for t in testi}, ric


# ---------------------------------------------------------------- pagina

_dossier = _carica('dossier', 'dossier.py')
esc = _dossier.esc

CSS = '''
  .trappole { list-style: none; padding: 0; margin: 18px 0 0; display: grid; gap: 16px; counter-reset: tr; }
  .trappole > li { padding: 18px 20px; background: var(--carta); border: 1px solid var(--riga); border-radius: 4px; counter-increment: tr; }
  .trappole h3 { margin: 0 0 8px; display: flex; gap: 12px; align-items: baseline; }
  .trappole h3::before { content: counter(tr); font-family: var(--cifre); font-size: 13px; color: var(--accento); border: 1px solid var(--accento); border-radius: 999px; min-width: 26px; height: 26px; display: inline-grid; place-items: center; flex: none; }
  .trappole .conta { font-family: var(--cifre); font-size: 12px; color: var(--inchiostro-3); margin: 0 0 10px; }
  .trappole dl { margin: 10px 0 0; display: grid; gap: 8px; }
  .trappole dt { font-family: var(--cifre); font-size: 11.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--inchiostro-3); }
  .trappole dd { margin: 0; color: var(--inchiostro-2); }
  .trappole .casi { padding-left: 18px; margin: 4px 0 0; display: grid; gap: 4px; font-size: var(--s0); }
  .consigli { counter-reset: c; list-style: none; padding: 0; display: grid; gap: 12px; }
  .consigli li { counter-increment: c; display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 12px; }
  .consigli li::before { content: counter(c); font-family: var(--titoli); font-size: 26px; line-height: 1; color: var(--accento); }
  .consigli b { color: var(--inchiostro); }
  .dossier .scorri { margin: 18px 0 6px; overflow-x: auto; }
  .dossier .nota { font-size: var(--s-1); color: var(--inchiostro-3); }
  .ordinabile td { overflow-wrap: anywhere; }
'''


class Fonti:
    def __init__(self, titoli):
        self.ordine, self.titoli, self.extra = [], titoli, {}

    def c(self, url, titolo=''):
        if url not in self.ordine:
            self.ordine.append(url)
        if titolo:
            self.extra.setdefault(url, titolo)
        t = titolo or self.extra.get(url) or self.titoli.get(url, {}).get('titolo', '')
        return _dossier.cit(self.ordine.index(url) + 1, url, t)

    def elenco(self, extra):
        out = []
        for u in self.ordine:
            if u in extra or u in self.extra:
                out.append((extra.get(u) or self.extra[u], u))
            else:
                t = self.titoli.get(u)
                tit = re.sub(r'-+\s+-\s+', ' - ', t['titolo']) if t else u
                out.append((f"AGCM, {'comunicato stampa' if not t or t['tipo'] == 'comunicato' else 'news'} {del_(data_it(t['data'])) if t else ''}: {tit}", u))
        return _dossier.fonti(out)


TESTATE = {'money.it': 'Money.it', 'ilsole24ore': 'Il Sole 24 Ore', 'milanofinanza': 'Milano Finanza'}


def minuscola(t, su=False):
    """Prima lettera maiuscola o minuscola, il resto com'è (per non rovinare sigle come IA)."""
    return (t[:1].upper() if su else t[:1].lower()) + t[1:]


def del_(data):
    return ("dell'" if data.startswith(('8 ', '11 ')) else 'del ') + data


def euro_parola(v, nota=None):
    t = euro_t(v, nota)
    return t + (' di euro' if ('mln' in t or 'mld' in t) else ' euro')


def data_it(s):
    d = datetime.date.fromisoformat(s)
    return f'{d.day} {MESI[d.month - 1]} {d.year}'


def imprese_breve(d, n=2):
    i = d['imprese']
    resto = len(i) - n
    return esc(', '.join(i[:n]) + (" e un'altra" if resto == 1 else f' e altre {resto}' if resto > 1 else ''))


def titolo_boll(d):
    n, aa = d['bollettino'].split('-')
    return f"AGCM, Bollettino settimanale n. {n}/20{aa}, p. {d['pagina']}: provvedimento n. {d['provvedimento']} ({d['codice']}), {d['imprese'][0]}"


ESITI = {'sanzione': 'Sanzione', 'inottemperanza': 'Sanzione per inottemperanza', 'impegni': 'Impegni', 'non violazione': 'Nessuna violazione',
         'non luogo a provvedere': 'Non luogo a provvedere'}


def pagina(cat, dec, per_cod, stat, titoli, ric):
    F = Fonti(titoli)
    od = stat['open_data']
    url_od = od['fonte']['dataset']
    extra = {url_od: 'AGCM, portale open data: Istruttorie Tutela del Consumatore (CSV, licenza CC BY 4.0)',
             SEGNALA: 'AGCM, segnalazione online di una pratica scorretta'}
    for d in dec:
        if d.get('tar'):
            testata = next((v for k, v in TESTATE.items() if k in d['tar']['url']), urllib.parse.urlsplit(d['tar']['url']).netloc)
            extra[d['tar']['url']] = f"{testata}, sul ricorso al TAR ({d['codice']}, {d['imprese'][0]})"
    it = _dossier.it
    pt = stat['per_trappola']
    trap_tit = {t[0]: t[1] for t in TRAPPOLE}
    trap_tit['altro'] = 'Altro'
    vere = {k: v for k, v in pt.items() if k != 'altro'}
    mx = max(v['decisioni'] for v in vere.values())
    top_n = [k for k in vere if vere[k]['decisioni'] == mx]
    top_e = max(vere, key=lambda k: vere[k]['euro'])
    alte = sorted([d for d in dec if d['euro'] > 0], key=lambda d: -d['euro'])
    s = lambda k: per_cod[k]
    B = lambda k: F.c(s(k)['url'], titolo_boll(s(k)))            # rimando al bollettino (testo integrale)
    sett_top = next(iter(stat['per_settore']))
    pa = stat['per_anno']
    anni = [a for a in pa if 'open_data' in pa[a]]
    ultimo = max(pa)

    confronto = '; '.join(f"nel {a} {pa[a]['decisioni']} decisioni e {euro_t(pa[a]['euro_deliberati'])} (open data: {pa[a]['open_data']['decisioni']} e {euro_t(pa[a]['open_data']['euro'])})" for a in anni)
    breve = [
        f"Abbiamo letto per intero i {stat['bollettini_file']} bollettini settimanali dell'Antitrust da gennaio 2024 a ottobre 2026 e i {stat['provvedimenti_consumatore']} provvedimenti "
        f"che riguardano i consumatori. Le <b>decisioni finali</b> deliberate dal 2024 sono <b>{stat['decisioni']}</b>: {stat['con_sanzione']} con una multa, {stat['impegni']} chiuse con impegni, "
        f"{stat['senza_violazione']} senza violazione accertata. Le multe valgono <b>{euro_t(stat['euro_totale'])} di euro</b>.",
        f"I nostri conti coincidono quasi del tutto con quelli ufficiali dell'Autorità: {confronto}{F.c(url_od)}. Le piccole differenze sono spiegate nel metodo.",
        f"La decisione più cara: {euro_t(alte[0]['euro'])} per i biglietti del Colosseo introvabili a prezzo base, divisi fra il gestore della biglietteria e sei operatori turistici{B(alte[0]['codice'])}. "
        f"Poi {euro_t(s('PS12974')['euro'])} a Revolut{B('PS12974')}, 10 mln ciascuno ad Amazon{B('PS12585')} e TikTok{B('PS12543')}, 9 mln ad Avis per la tariffa sulle multe{B('CV242')} "
        f"e 9 mln a eDreams{B('PS12853')}.",
        f"Nei bollettini ci sono multe che i comunicati non raccontano: 8 mln a Sicily by Car per la tariffa sulle multe{B('CV263')}, 7,5 mln a Enel Energia e Servizio Elettrico Nazionale per "
        f"le bollette vecchie di oltre due anni chieste lo stesso{B('PS11564B')}, 4,2 mln a Sky per gli aumenti degli abbonamenti{B('PS12917')}, 4 mln a Poste Italiane per le app "
        f"BancoPosta e PostePay bloccate a chi non dava accesso ai dati del telefono{B('PS12768')}, 1 mln a Poltronesofà per gli sconti{B('PS12704')}.",
        f"{'Le trappole che tornano più spesso sono ' if len(top_n) > 1 else 'La trappola che torna più spesso è '}{' e '.join('«' + trap_tit[k] + '»' for k in top_n)} "
        f"({mx} decisioni{' ciascuna' if len(top_n) > 1 else ''}); quella costata di più alle imprese è «{trap_tit[top_e]}» ({euro_t(vere[top_e]['euro'])}). "
        f"Il settore con più euro di sanzioni: {minuscola(sett_top)} ({euro_t(stat['per_settore'][sett_top]['euro'])}).",
        f"Una multa non è definitiva: le imprese possono ricorrere al TAR del Lazio e poi al Consiglio di Stato. Dal 2024 l'Autorità ha dovuto ricalcolare {sum(g['esito'] == 'rideterminazione' for g in stat['giudici'])} "
        f"vecchie sanzioni e ritirarne {sum(g['esito'] == 'annullamento' for g in stat['giudici'])} dopo sentenze del Consiglio di Stato. Per Mondo Convenienza il TAR ha invece confermato la multa"
        f"{F.c(s('PS12515')['tar']['url'])}, per due operatori del Colosseo ha respinto i ricorsi{F.c(s('PS12603')['tar']['url'])}.",
    ]

    # le trappole
    schede = []
    for tid, titolo, come, ricon, fare, casi in TRAPPOLE:
        p = pt[tid]
        casi_html = ''.join(
            f"<li><a href=\"{esc(s(c)['url'])}\" target=\"_blank\" rel=\"noopener\">{imprese_breve(s(c))}</a> ({s(c)['data'][:4]}): "
            f"{esc(s(c)['pratica'])}. <b>{euro_t(s(c)['euro']) + ' di sanzione' if s(c)['euro'] else ESITI[s(c)['esito']]}</b>{B(c)}</li>" for c in casi)
        conta = f"{p['decisioni']} decisioni" + (f", {p['sanzioni']} con multa per {euro_parola(p['euro'])}" if p['euro'] else '') + \
                (f" · {p['moral_suasion']} interventi informali" if p['moral_suasion'] else '')
        schede.append(f'''<li id="{tid}"><h3>{esc(titolo)}</h3><p class="conta">{conta}</p><p>{esc(come)}</p>
<dl><dt>Dove</dt><dd>{esc(', '.join([p['settori'][0]] + [minuscola(x) for x in p['settori'][1:4]]))}</dd>
<dt>Casi decisi</dt><dd><ul class="casi">{casi_html}</ul></dd>
<dt>Come riconoscerla</dt><dd>{esc(ricon)}</dd>
<dt>Cosa fare</dt><dd>{fare.format(segnala=SEGNALA)}</dd></dl></li>''')

    # settore per settore
    ps = stat['per_settore']
    barre = _dossier.barre([(esc(k), v['euro'], euro_t(v['euro'])) for k, v in ps.items() if v['euro'] > 0])
    tab_sett = _dossier.tabella('t-settori', [('Settore', 't'), ('Decisioni', 'n'), ('Con multa', 'n'), ('Sanzioni', 'n'), ('Trappola più frequente', 't')],
                                [[(esc(k), k), (it(v['decisioni']), v['decisioni']), (it(v['sanzioni']), v['sanzioni']), (euro_t(v['euro']) if v['euro'] else '–', v['euro']),
                                  (esc(trap_tit[next(iter(v['trappole']), 'altro')]), trap_tit[next(iter(v['trappole']), 'altro')])] for k, v in ps.items()], 3)
    tab_anni = _dossier.tabella('t-anni', [('Anno', 't'), ('Decisioni', 'n'), ('Con multa', 'n'), ('Impegni', 'n'), ('Multe', 'n'), ('Open data: decisioni', 'n'), ('Open data: multe', 'n'), ('Avvii', 'n')],
                                [[(str(a), str(a)), (it(v['decisioni']), v['decisioni']), (it(v['sanzioni']), v['sanzioni']), (it(v['impegni']), v['impegni']),
                                  (euro_t(v['euro']), v['euro']), (it(v['open_data']['decisioni']) if 'open_data' in v else '–', v.get('open_data', {}).get('decisioni', 0)),
                                  (euro_t(v['open_data']['euro']) if 'open_data' in v else '–', v.get('open_data', {}).get('euro', 0)), (it(v['avvii']), v['avvii'])] for a, v in pa.items()])

    # tutte le multe, ordinabili
    righe = []
    for d in alte:
        tar = d.get('tar')
        fonte = f'<a href="{esc(d["url"])}" target="_blank" rel="noopener">bollettino {esc(d["bollettino"])}, p. {d["pagina"]}</a>'
        if d.get('comunicato'):
            fonte += f' · <a href="{esc(d["comunicato"])}" target="_blank" rel="noopener">comunicato</a>'
        dett = ' · '.join(f'{esc(k)}: {euro_t(v)}' for k, v in d['per_impresa'].items()) if len(d['per_impresa']) > 1 else ''
        righe.append([(esc(data_it(d['data'])), d['data']), (imprese_breve(d, 3), ', '.join(d['imprese'])), (esc(d['settore']), d['settore']),
                      (esc(d['pratica']) + (f'<br><span class="nota">{dett}</span>' if dett else ''), d['pratica']), (euro_t(d['euro']), d['euro']),
                      (f'<a href="{esc(tar["url"])}" target="_blank" rel="noopener">{esc(tar["testo"])}</a>' if tar else 'non verificato', tar['testo'] if tar else ''),
                      (fonte, d['codice'])])
    tab_alte = _dossier.tabella('t-sanzioni', [('Data', 't'), ('Impresa', 't'), ('Settore', 't'), ('Pratica', 't'), ('Sanzione', 'n'), ('Ricorso al TAR', 't'), ('Fonte', 't')], righe, 4)

    giud = ''.join(f"<li><b>{esc(g['imprese'])}</b> ({esc(g['codice'])}, decisione del {g['anno_originale']}): {esc(g['pratica'])}. "
                   + (f"Sanzione ricalcolata a {euro_parola(g['nuova_sanzione'])}" if g['esito'] == 'rideterminazione' else 'Provvedimento ritirato')
                   + f" dopo la {esc(g['sentenze'][0]) if g['sentenze'] else 'sentenza del giudice'}{F.c(g['url'], 'AGCM, Bollettino settimanale: ' + g['codice'] + ' (' + data_it(g['data']) + ')')}.</li>"
                   for g in sorted(stat['giudici'], key=lambda g: g['data']))

    chiusi = set(per_cod)
    aperti_l = [x for x in cat['in_corso'] if not set(x['numeri']) & chiusi]
    aperti = ''.join(f"<li><b>{esc(', '.join(x['imprese'][:2]))}</b> ({data_it(x['data'])}): {esc(x['pratica'])}{F.c(x['url'])}</li>"
                     for x in sorted(aperti_l, key=lambda x: x['data'], reverse=True))

    bf = [
        f"<b>Guarda il prezzo più basso degli ultimi 30 giorni.</b> Ogni sconto deve indicarlo. Se manca, o se il prezzo «in offerta» non è più basso, è la trappola dello sconto finto, sanzionata per esempio a Tannico{B('PS12820')}, Bernabei{B('PS12804')} e Poltronesofà{B('PS12704')}. <a href=\"#falsi-sconti\">Scheda</a>.",
        f"<b>Un timer non è una scadenza.</b> Se il conto alla rovescia riparte, la fretta è finta: Deghi è stata multata per 2 mln proprio così{B('PS13027')}. Metti il prodotto nel carrello e riguardalo il giorno dopo. <a href=\"#fretta\">Scheda</a>.",
        f"<b>Conta il totale, non il prezzo di partenza.</b> Consegna, commissioni e «servizi» devono essere chiari dall'inizio; e pagare con carta, American Express o PayPal non può costare di più. Schede: <a href=\"#costi-nascosti\">costi nascosti</a> · <a href=\"#sovrapprezzo-carta\">sovrapprezzo sulla carta</a>.",
        f"<b>Togli le spunte che non hai messo tu.</b> Acquisto periodico, abbonamento «Plus», prova gratuita che si rinnova: controlla ogni casella prima di pagare (Amazon{B('PS12585')}, eDreams{B('PS12853')}). <a href=\"#preselezioni\">Scheda</a>.",
        f"<b>Dopo l'acquisto hai dei diritti, e attenzione ai messaggi.</b> Online hai 14 giorni per ripensarci e due anni di garanzia: <a href=\"{GARANZIA}\">il Polpo prepara la lettera</a>. Se il negozio online non consegna e non rimborsa, come nei casi sanzionati di farmacie e negozi per animali, conserva ordini e ricevute. In questi giorni arrivano anche finti avvisi di pacchi e offerte: <a href=\"{TRUFFE}\">controlla se è una truffa</a>. E se trovi una trappola, <a href=\"{SEGNALA}\" target=\"_blank\" rel=\"noopener\">segnalala all'Antitrust</a> (numero verde 800.166.661).",
    ]

    rc = stat['riconciliazione']
    diversi = [r for r in ric if r['stato'] == 'importo diverso']
    a24, a25 = pa.get(2024, {}), pa.get(2025, {})
    met = _dossier.metodo(
        f"I {stat['bollettini_file']} bollettini settimanali dell'Autorità dal n. 1 del 2024 al n. {max(int(f.split('-')[0]) for f in os.listdir(BOLL_TXT) if f.endswith(f'-{str(ultimo)[2:]}.txt'))} "
        f"del {ultimo}, che pubblicano per intero ogni provvedimento: {stat['provvedimenti_consumatore']} riguardano i consumatori (pratiche commerciali scorrette, clausole vessatorie, "
        f"inottemperanze, pubblicità parassitaria). Poi i comunicati stampa e le news ({stat['comunicati_letti']} testi) e il dataset aperto «Istruttorie Tutela del Consumatore» per i conteggi ufficiali{F.c(url_od)}.",
        f"Dai bollettini lo script prende numero del provvedimento e del procedimento, data della delibera, pagina e la parte che decide (il «dispositivo»): da lì vengono l'esito e la sanzione, impresa per impresa. "
        f"Le decisioni finali sono le multe, gli impegni accettati, le chiusure senza violazione e le multe per non aver rispettato una decisione precedente; "
        f"abbiamo contato a parte {stat['avvii']} avvii di istruttoria e contestazioni, {stat['cautelari']} misure cautelari, {len(stat['modifiche_impegni'])} modifiche di impegni già presi "
        f"e le correzioni chieste dai giudici. Settore, trappole e descrizione di ogni caso li abbiamo scritti leggendo i provvedimenti; i nomi delle imprese sono quelli del dispositivo. "
        f"Abbiamo confrontato ogni decisione con i comunicati: {rc.get('uguale', 0)} hanno lo stesso importo, {len(diversi)} differiscono solo perché il comunicato arrotonda "
        f"(«oltre 18 milioni», «quasi 20 milioni»), {rc.get('senza codice nel comunicato', 0)} comunicati senza numero di procedimento li abbiamo ritrovati nei bollettini; "
        f"nessuna decisione comunicata manca nei bollettini." if not rc.get('non trovata nei bollettini') else
        f"Abbiamo confrontato ogni decisione con i comunicati: {rc.get('non trovata nei bollettini')} non sono state trovate nei bollettini.",
        f"Il confronto con gli open data: nel 2024 le multe coincidono al centesimo ({euro_parola(a24.get('euro', 0))}); le decisioni sono {a24.get('decisioni')} contro {a24.get('open_data', {}).get('decisioni')}, "
        f"perché l'Autorità conta due volte la decisione che riguarda insieme pratiche scorrette e clausole vessatorie (Star Italia), conta fra gli impegni una modifica di impegni già presi "
        f"e conta una chiusura «non luogo a provvedere» che nei bollettini del 2024 non troviamo. "
        f"Nel 2025 le multe deliberate sono {euro_t(a25.get('euro_deliberati', 0))} contro {euro_t(a25.get('open_data', {}).get('euro', 0))}: la differenza è una sanzione di 100 mila euro che l'Autorità "
        f"ha ritirato un mese dopo, a seguito di una sentenza (nei nostri totali non c'è). Le decisioni sono {a25.get('decisioni')} contro {a25.get('open_data', {}).get('decisioni')}: "
        f"gli open data contano anche due ricalcoli di vecchie multe, una modifica di impegni e due volte la decisione mista su Wizz Air. "
        f"Le persone fisiche, influencer e titolari di imprese individuali, non sono nominate. I bollettini arrivano al n. 41 del 2026 (metà ottobre); gli open data non coprono ancora il 2026. "
        f"Una sanzione può essere ridotta o annullata dal giudice: l'esito dei ricorsi lo indichiamo solo dove l'abbiamo trovato.",
        data_it(datetime.date.today().isoformat()))

    corpo = f'''    <section id="in-breve"><h2>In breve</h2>
      <ul class="lista">{''.join(f'<li>{b}</li>' for b in breve)}</ul></section>
    <section id="trappole"><h2>Le trappole</h2>
      <p>Quindici trucchi, ricavati dalle decisioni dell'Antitrust. Per ognuno: come funziona, dove si trova, i casi decisi, come riconoscerlo e cosa fare. I numeri accanto ai casi portano alla pagina del bollettino con il testo integrale.</p>
      <ol class="trappole">{''.join(schede)}</ol></section>
    <section id="settori"><h2>Settore per settore</h2>
      <p>Gli euro di sanzione delle decisioni finali, per settore. Le decisioni chiuse con impegni non hanno multa ma spesso portano rimborsi.</p>
      <figure class="dato"><figcaption>SANZIONI PER SETTORE, 2024-2026</figcaption>{barre}</figure>
      {tab_sett}
      <h3>Anno per anno, e il confronto con i conti ufficiali</h3>
      {tab_anni}
      <p class="nota">Il 2026 arriva al bollettino di metà ottobre. Gli avvii sono le istruttorie aperte e le contestazioni di inottemperanza pubblicate nell'anno.</p></section>
    <section id="sanzioni"><h2>Le sanzioni più alte</h2>
      <p>Tutte le {len(alte)} decisioni con multa deliberate dal 2024, dalla più alta. Clicca sui titoli per ordinare. Le imprese possono ricorrere al TAR del Lazio e poi al Consiglio di Stato: dove abbiamo trovato l'esito lo riportiamo.</p>
      {tab_alte}
      <h3>Quando il giudice corregge l'Antitrust</h3>
      <p>Nei bollettini dal 2024 ci sono anche i provvedimenti con cui l'Autorità ricalcola o ritira le proprie decisioni dopo una sentenza. Quasi tutte riguardano multe di anni precedenti.</p>
      <ul class="lista">{giud}</ul>
      <h3>Ancora sotto esame</h3>
      <p>Istruttorie annunciate di cui non abbiamo trovato la conclusione. L'avvio di un'istruttoria non è una condanna.</p>
      <ul class="lista">{aperti}</ul></section>
    <section id="black-friday"><h2>Prima del Black Friday</h2>
      <p>Il 27 novembre è il giorno degli sconti. Cinque controlli, presi dalle trappole sanzionate.</p>
      <ol class="consigli">{''.join(f'<li><span>{b}</span></li>' for b in bf)}</ol></section>
    <section id="metodo"><h2>Come l'abbiamo letto</h2>{met}</section>
    <section id="fonti"><h2>Fonti</h2>{F.elenco(extra)}</section>'''

    return _dossier.pagina(
        prof='../../', titolo='Le trappole sanzionate',
        descrizione='Le decisioni dell\'Antitrust sulle pratiche commerciali scorrette dal 2024, lette nei bollettini: i trucchi più usati, settore per settore, le multe e come riconoscerli prima del Black Friday.',
        occhiello='Il Polpo legge per te · Antitrust e consumatori',
        h1='Le trappole sanzionate',
        intro=f"L'Antitrust multa le imprese che ingannano i consumatori. Abbiamo letto tutti i provvedimenti pubblicati dal 2024: {stat['decisioni']} decisioni finali, "
              f"{euro_t(stat['euro_totale'])} di euro di multe, quindici trappole che si ripetono. Ecco come riconoscerle.",
        corpo=corpo, braccio=3, css_extra=CSS)


def main():
    if '--scarica' in sys.argv:
        scarica()
        scarica_bollettini()
    os.makedirs(DATI, exist_ok=True)
    cat, dec, per_cod, stat, titoli, ric = derivati()
    open(os.path.join(CARTELLA, 'index.html'), 'w', encoding='utf-8').write(pagina(cat, dec, per_cod, stat, titoli, ric))
    print(f"legge/antitrust/index.html scritta: {stat['decisioni']} decisioni finali, {stat['con_sanzione']} con multa, {_dossier.it(stat['euro_totale'])} euro")


if __name__ == '__main__':
    main()
