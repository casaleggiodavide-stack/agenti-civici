#!/usr/bin/env python3
"""I dati di «Indovina il Comune» (giochi/indovina-comune/src/comuni.js).

Per ogni Comune italiano: nome, provincia, Regione, abitanti, il punto centrale (per la freccia e la distanza),
se è capoluogo, e i numeri degli indizi, presi dai dati che il sito ha già:
- Il bilancio del mio Comune (bilancio-comune/dati): spesa per abitante, rifiuti per abitante (programma 09.03),
  debito per abitante (Piano degli indicatori), quota delle entrate proprie incassate, con le mediane della fascia;
- Chi raccoglie i rifiuti? (raccolta/src/dati/raccolta.js): il gestore della raccolta e quanti Comuni serve;
- Per te (per-te/dati/p): la quota del valore degli appalti senza gara, con la mediana dei Comuni simili;
- I fondi europei nel mio Comune (progetti-comune/dati/comuni.json): il numero di progetti del PNRR.

Dall'ISTAT (CC BY 4.0, robots.txt senza divieti), scaricati una volta in ~/dati-civici/giochi-indovina-comune/:
- Elenco-comuni-italiani.xlsx: codici, Regione, ripartizione, Provincia e Comuni capoluogo;
- Limiti01012026_g.zip: i confini generalizzati dei Comuni, da cui il baricentro di ogni Comune.

Uso: python3 -I -B scripts/giochi-indovina-comune-dati.py [--scarica]
"""
import json
import math
import os
import re
import struct
import sys
import unicodedata
import urllib.request
import zipfile
from collections import Counter, defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GREZZI = os.path.expanduser('~/dati-civici/giochi-indovina-comune')
USCITA = os.path.join(REPO, 'giochi', 'indovina-comune', 'src', 'comuni.js')

URL_ELENCO = 'https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx'
URL_CONFINI = 'https://www.istat.it/storage/cartografia/confini_amministrativi/generalizzati/2026/Limiti01012026_g.zip'
SHP = 'Com01012026_g/Com01012026_g_WGS84'

FONTI = {
    'istat_elenco': {'breve': 'ISTAT, elenco dei Comuni', 'titolo': 'ISTAT, Codici statistici delle unità amministrative territoriali (elenco dei Comuni, CC BY 4.0)', 'url': 'https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/'},
    'istat_confini': {'breve': 'ISTAT, confini dei Comuni', 'titolo': 'ISTAT, Confini delle unità amministrative a fini statistici al 1° gennaio 2026, versione generalizzata (CC BY 4.0)', 'url': 'https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/'},
    'istat_pop': {'breve': 'ISTAT, popolazione', 'titolo': 'ISTAT, popolazione residente al 1° gennaio 2025 (CC BY 4.0)', 'url': 'https://demo.istat.it/app/?i=POS&l=it'},
    'bdap': {'breve': 'RGS, OpenBDAP', 'titolo': 'Ragioneria Generale dello Stato, OpenBDAP: rendiconti dei Comuni e Piano degli indicatori', 'url': 'https://openbdap.rgs.mef.gov.it/it/FET/Analizza'},
    'arera': {'breve': 'ARERA', 'titolo': 'ARERA, Ricerca operatori: raccolta e trasporto dei rifiuti urbani (CC BY-SA 4.0)', 'url': 'https://www.arera.it/area-operatori/ricerca-operatori'},
    'anac': {'breve': 'ANAC', 'titolo': 'ANAC, Banca dati nazionale dei contratti pubblici, dati aperti (CC BY-SA 4.0)', 'url': 'https://dati.anticorruzione.it/opendata'},
    'pnrr': {'breve': 'Italia Domani', 'titolo': 'Italia Domani, open data del PNRR: localizzazione dei progetti', 'url': 'https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data/localizzazione-dei-progetti-del-pnrr.html'},
}


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def modulo_js(percorso):
    s = open(percorso, encoding='utf-8').read()
    return json.loads(s[s.index('{'):s.rindex('}') + 1])


def scarica():
    os.makedirs(GREZZI, exist_ok=True)
    for url in (URL_ELENCO, URL_CONFINI):
        dest = os.path.join(GREZZI, url.rsplit('/', 1)[1])
        if os.path.exists(dest):
            continue
        print('scarico', url, file=sys.stderr)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; agenti-civici)'})
        with urllib.request.urlopen(req, timeout=120) as r, open(dest, 'wb') as f:
            f.write(r.read())


# ---------------------------------------------------------------- ISTAT: elenco e confini

def elenco():
    import openpyxl
    wb = openpyxl.load_workbook(os.path.join(GREZZI, 'Elenco-comuni-italiani.xlsx'), read_only=True)
    righe = list(wb[wb.sheetnames[0]].iter_rows(values_only=True))
    testa = [str(x or '') for x in righe[0]]
    col = lambda inizio: next(i for i, x in enumerate(testa) if x.startswith(inizio))
    c_cod, c_nome, c_rip, c_reg = col('Codice Comune formato alfanumerico'), col('Denominazione in italiano'), col('Ripartizione geografica'), col('Denominazione Regione')
    c_altra, c_codreg = col('Denominazione altra lingua'), col('Codice Regione')
    c_uts, c_cap, c_sig = col("Denominazione dell'Unità territoriale"), col('Flag Comune capoluogo'), col('Sigla automobilistica')
    out = {}
    for r in righe[1:]:
        if not r[c_cod]:
            continue
        out[str(r[c_cod]).zfill(6)] = {'nome': r[c_nome], 'altra': r[c_altra] or '', 'cod_reg': int(r[c_codreg]), 'ripartizione': r[c_rip], 'regione': r[c_reg], 'provincia': r[c_uts],
                                        'capoluogo': str(r[c_cap]) == '1', 'sigla': r[c_sig]}
    return out


def dbf(percorso):
    f = open(percorso, 'rb').read()
    n, hl, rl = struct.unpack('<I', f[4:8])[0], struct.unpack('<H', f[8:10])[0], struct.unpack('<H', f[10:12])[0]
    campi, i, off = [], 32, 1
    while f[i] != 0x0D:
        campi.append((f[i:i + 11].split(b'\0')[0].decode(), off, f[i + 16]))
        off += f[i + 16]
        i += 32
    return [{nome: f[hl + k * rl + o:hl + k * rl + o + l].decode('latin1').strip() for nome, o, l in campi} for k in range(n)]


def baricentri(percorso):
    """Il baricentro (per area) di ogni forma del file .shp, in coordinate UTM 32N."""
    f = open(percorso, 'rb').read()
    pos, out = 100, []
    while pos < len(f):
        _, lung = struct.unpack('>ii', f[pos:pos + 8])
        rec = f[pos + 8:pos + 8 + 2 * lung]
        pos += 8 + 2 * lung
        tipo = struct.unpack('<i', rec[:4])[0]
        if tipo != 5:
            out.append(None)
            continue
        np_, nv = struct.unpack('<ii', rec[36:44])
        parti = list(struct.unpack(f'<{np_}i', rec[44:44 + 4 * np_])) + [nv]
        punti = struct.unpack(f'<{2 * nv}d', rec[44 + 4 * np_:44 + 4 * np_ + 16 * nv])
        A = cx = cy = 0.0
        for a, b in zip(parti, parti[1:]):
            for k in range(a, b - 1):
                x0, y0, x1, y1 = punti[2 * k], punti[2 * k + 1], punti[2 * k + 2], punti[2 * k + 3]
                c = x0 * y1 - x1 * y0
                A += c
                cx += (x0 + x1) * c
                cy += (y0 + y1) * c
        out.append((cx / (3 * A), cy / (3 * A)) if A else None)
    return out


def utm_latlon(e, n, meridiano=9.0):
    """Da UTM (WGS84, fuso nord) a latitudine e longitudine in gradi (formule di Snyder, USGS 1987)."""
    a, f, k0 = 6378137.0, 1 / 298.257223563, 0.9996
    e2 = f * (2 - f)
    ep2 = e2 / (1 - e2)
    x, y = e - 500000.0, n
    M = y / k0
    mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256))
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    p = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * math.sin(4 * mu) \
        + (151 * e1 ** 3 / 96) * math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * math.sin(8 * mu)
    C1, T1 = ep2 * math.cos(p) ** 2, math.tan(p) ** 2
    N1 = a / math.sqrt(1 - e2 * math.sin(p) ** 2)
    R1 = a * (1 - e2) / (1 - e2 * math.sin(p) ** 2) ** 1.5
    D = x / (N1 * k0)
    lat = p - (N1 * math.tan(p) / R1) * (D ** 2 / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4 / 24
                                          + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) * D ** 6 / 720)
    lon = (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5 / 120) / math.cos(p)
    return math.degrees(lat), meridiano + math.degrees(lon)


def coordinate():
    cartella = os.path.join(GREZZI, 'limiti')
    if not os.path.exists(os.path.join(cartella, SHP + '.shp')):
        with zipfile.ZipFile(os.path.join(GREZZI, 'Limiti01012026_g.zip')) as z:
            for n in z.namelist():
                if n.startswith('Com01012026_g/') and n.rsplit('.', 1)[-1] in ('shp', 'dbf', 'prj'):
                    z.extract(n, cartella)
    righe = dbf(os.path.join(cartella, SHP + '.dbf'))
    punti = baricentri(os.path.join(cartella, SHP + '.shp'))
    return {r['PRO_COM_T']: utm_latlon(*p) for r, p in zip(righe, punti) if p}


def confinanti_istat(nomi):
    """Le Regioni che si toccano secondo i confini ISTAT (almeno tre punti di confine in comune, a 10 metri):
    serve ai test per controllare la mappa delle confinanti scritta a mano in src/regole.js."""
    cartella = os.path.join(GREZZI, 'limiti')
    base = 'Reg01012026_g/Reg01012026_g_WGS84'
    if not os.path.exists(os.path.join(cartella, base + '.shp')):
        with zipfile.ZipFile(os.path.join(GREZZI, 'Limiti01012026_g.zip')) as z:
            for n in z.namelist():
                if n.startswith('Reg01012026_g/') and n.rsplit('.', 1)[-1] in ('shp', 'dbf'):
                    z.extract(n, cartella)
    f = open(os.path.join(cartella, base + '.shp'), 'rb').read()
    pos, punti = 100, []
    while pos < len(f):
        _, lung = struct.unpack('>ii', f[pos:pos + 8])
        rec = f[pos + 8:pos + 8 + 2 * lung]
        pos += 8 + 2 * lung
        np_, nv = struct.unpack('<ii', rec[36:44])
        xy = struct.unpack(f'<{2 * nv}d', rec[44 + 4 * np_:44 + 4 * np_ + 16 * nv])
        punti.append({(round(xy[2 * i] / 10), round(xy[2 * i + 1] / 10)) for i in range(nv)})
    cod = [int(r['COD_REG']) for r in dbf(os.path.join(cartella, base + '.dbf'))]
    return {nomi[cod[i]]: sorted(nomi[cod[j]] for j in range(len(cod)) if j != i and len(punti[i] & punti[j]) >= 3) for i in range(len(cod))}


# ---------------------------------------------------------------- i dati del sito

def fascia(pop):
    for limite, nome in ((1000, 'meno di 1.000'), (2000, 'da 1.000 a 2.000'), (5000, 'da 2.000 a 5.000'), (10000, 'da 5.000 a 10.000'),
                         (20000, 'da 10.000 a 20.000'), (60000, 'da 20.000 a 60.000'), (100000, 'da 60.000 a 100.000'), (250000, 'da 100.000 a 250.000')):
        if pop < limite:
            return nome + ' abitanti'
    return 'oltre 250.000 abitanti'


def mediana(v):
    v = sorted(x for x in v if x is not None)
    if not v:
        return None
    n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2


VUOTE = {'nord', 'est', 'sud', 'ovest', 'san', 'santa', 'santo', 'del', 'della', 'dei', 'delle', 'di', 'de', 'la', 'le', 'il', 'lo', 'nel', 'nell',
         'sul', 'sulla', 'valle', 'monte', 'alto', 'alta', 'basso', 'bassa', 'centro', 'terme', 'marina', 'isola', 'citta', 'metropolitana', 'comune'}


def maschera(nome_gestore, parole):
    """Toglie dal nome del gestore le parole che svelerebbero il Comune o la provincia, anche come aggettivo
    («AMIU Genova» → «AMIU …», «Azienda Milanese» → «Azienda …», «Bozen» se è il nome tedesco)."""
    radici = set()
    for p in parole:
        for w in norm(p).split():
            if len(w) >= 3 and w not in VUOTE:
                radici.add((w, w[:max(4, len(w) - 2)] if len(w) >= 5 else None))
    def svela(tok):
        t = norm(tok).replace(' ', '')
        return bool(t) and any(t == w or (r and t.startswith(r)) for w, r in radici)
    pezzi = re.split(r'(\s+|[-\'’/()])', nome_gestore.strip())
    out = ''.join('…' if svela(p) else p for p in pezzi)
    return re.sub(r'…([\s\'’/-]*…)+', '…', out).strip()


def main():
    if '--scarica' in sys.argv:
        scarica()
    istat = elenco()
    coord = coordinate()
    bil = {}
    for f in os.listdir(os.path.join(REPO, 'bilancio-comune', 'dati', 'p')):
        bil.update(json.load(open(os.path.join(REPO, 'bilancio-comune', 'dati', 'p', f), encoding='utf-8')))
    conf = json.load(open(os.path.join(REPO, 'bilancio-comune', 'dati', 'confronto.json'), encoding='utf-8'))
    perte = {}
    for f in os.listdir(os.path.join(REPO, 'per-te', 'dati', 'p')):
        perte.update(json.load(open(os.path.join(REPO, 'per-te', 'dati', 'p', f), encoding='utf-8')))
    prog = json.load(open(os.path.join(REPO, 'progetti-comune', 'dati', 'comuni.json'), encoding='utf-8'))
    pnrr = {r[0]: dict(zip(prog['campi'], r)) for r in prog['comuni']}
    racc = modulo_js(os.path.join(REPO, 'raccolta', 'src', 'dati', 'raccolta.js'))
    gest_di = {r[0]: r[4] for r in racc['comuni']}
    serviti = Counter(i for g in gest_di.values() for i in g)

    capoluoghi_di = defaultdict(list)
    for k, c in istat.items():
        if c['capoluogo']:
            capoluoghi_di[c['sigla']].append(c['nome'])

    for c in istat.values():
        c['regione'] = c['regione'].split('/')[0]
    regioni = sorted({c['regione'] for c in istat.values()})
    province = {}
    for c in istat.values():
        province[c['sigla']] = [c['provincia'], regioni.index(c['regione'])]
    for sig in province:  # i nomi dei capoluoghi, per la scheda
        province[sig].append(capoluoghi_di.get(sig, []))

    gestori, idx_g = [], {}
    comuni, scarti = [], Counter()
    for k in sorted(istat, key=lambda k: norm(istat[k]['nome'])):
        c = istat[k]
        if k not in coord:
            scarti['senza confini'] += 1
            continue
        lat, lon = coord[k]
        b = bil.get(k)
        pop = (b or {}).get('pop') or (pnrr.get(k) or {}).get('pop')
        if not pop:
            scarti['senza abitanti'] += 1
            continue
        riga = [k, c['nome'], c['sigla'], pop, round(lat * 100), round(lon * 100), 1 if c['capoluogo'] else 0]
        dati = None
        a = (perte.get(k) or {}).get('a') or {}
        sg = (a.get('senza_gara') or {})
        g = gest_di.get(k) or []
        prog_b = (b or {}).get('programmi', {})
        debito = ((b or {}).get('pdi') or {}).get('debito_pc')
        if debito is not None and debito < 0:  # un indicatore negativo è un errore del dato: meglio dire «non disponibile»
            debito = None
        risc = (b or {}).get('riscossione')
        valori = [prog_b.get('0903'), debito, risc, sg.get('quota'), g or None]
        # serve il bilancio, il PNRR e almeno un numero per ogni indizio doppio; ne può mancare al massimo uno in tutto
        if b and b.get('spesa_tot') and k in pnrr and (debito is not None or risc is not None) and (prog_b.get('0903') or g) \
                and sum(v is None for v in valori) <= 1:
            gi = None
            if g:
                nome_g, in_econ = racc['gestori'][g[0]][0], racc['gestori'][g[0]][5]
                nascosto = 'il Comune stesso, in economia' if in_econ else maschera(nome_g, [c['nome'], c['altra'], c['provincia'], c['regione'], *capoluoghi_di.get(c['sigla'], [])] + c['provincia'].split('-'))
                chiave = (nascosto, serviti[g[0]] if not in_econ else 1)
                if chiave not in idx_g:
                    idx_g[chiave] = len(gestori)
                    gestori.append(list(chiave))
                gi = idx_g[chiave]
            tondo = lambda x, n=0: None if x is None else (round(x, n) if n else round(x))
            dati = [round(b['spesa_tot'] / pop), tondo(prog_b['0903'] / pop) if prog_b.get('0903') else None, tondo(debito), tondo(risc, 1),
                    tondo(sg.get('quota'), 1), pnrr[k]['n'], gi, 1 if len(g) > 1 else 0, b['anno']]
        else:
            scarti['dati incompleti'] += 1
        comuni.append(riga + [dati] if dati else riga)

    # mediane della fascia: dal bilancio (già calcolate), dagli appalti e dal PNRR (qui, sugli stessi Comuni)
    app = json.load(open(os.path.join(REPO, 'appalti', 'dati', 'confronto.json'), encoding='utf-8'))
    n_per_fascia = defaultdict(list)
    for r in prog['comuni']:
        x = dict(zip(prog['campi'], r))
        if x.get('pop'):
            n_per_fascia[fascia(x['pop'])].append(x['n'])
    mediane = {}
    for f, m in conf['fasce'].items():
        sg_f = [r[7][4] for r in comuni if len(r) > 7 and r[7][4] is not None and fascia(r[3]) == f]
        mediane[f] = {'spesa': m['spesa_pc'], 'rifiuti': m['programmi_pc']['0903'], 'debito': round(m['pdi']['debito_pc']),
                      'riscossione': round(m['riscossione'], 1), 'senza_gara': round(mediana(sg_f), 1) if sg_f else None, 'pnrr': round(mediana(n_per_fascia[f]) or 0),
                      'comuni': m['comuni']}

    completi = [r for r in comuni if len(r) > 7]
    out = {
        'aggiornato': max(conf['aggiornato'], racc['aggiornato'], prog['aggiornato']),
        'fonti': FONTI,
        'anni': {'bilancio': conf['anni'], 'appalti': app['anno'], 'pnrr': prog['estrazione']},
        'regioni': regioni,
        'province': province,
        'mediane': mediane,
        'gestori': gestori,
        'campi': ['istat', 'nome', 'sigla', 'abitanti', 'lat×100', 'lon×100', 'capoluogo', '[spesa €/ab, rifiuti €/ab, debito €/ab, % entrate proprie incassate, % valore appalti senza gara, progetti PNRR, gestore, più gestori, anno del bilancio]'],
        'comuni': comuni,
        'verifica': {'confinanti': confinanti_istat({c['cod_reg']: c['regione'] for c in istat.values()})},
    }
    os.makedirs(os.path.dirname(USCITA), exist_ok=True)
    with open(USCITA, 'w', encoding='utf-8') as f:
        f.write('// Generato da scripts/giochi-indovina-comune-dati.py: non modificare a mano.\nexport default '
                + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'{len(comuni)} Comuni ({len(completi)} con tutti gli indizi, {sum(1 for r in completi if r[6])} capoluoghi); scartati: {dict(scarti)}; '
          f'{len(gestori)} gestori; {os.path.getsize(USCITA) // 1024} KB', file=sys.stderr)


if __name__ == '__main__':
    main()
