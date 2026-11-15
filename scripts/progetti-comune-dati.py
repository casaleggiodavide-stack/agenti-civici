#!/usr/bin/env python3
"""I fondi europei nel mio Comune: dai dati aperti del PNRR (ReGiS) alle schede per Comune.

Fonte: Italia Domani, Catalogo Open Data (Presidenza del Consiglio dei Ministri, dati dal sistema
ReGiS della Ragioneria Generale dello Stato), licenza CC BY 4.0:
  https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html
  - «Progetti del PNRR - Missione 1…7» (PNRR_Progetti_M1.csv … M7.csv): per ogni CUP e codice locale
    progetto stato, titolo, finanziamenti per fonte (PNRR, UE diverso dal PNRR, Stato…), soggetto
    attuatore, date di inizio e fine previste ed effettive;
  - «Localizzazione dei progetti del PNRR» (PNRR_Localizzazione.csv): Comune e percentuale di
    localizzazione di ogni progetto.
Versione letta: 13.0, data di osservazione (estrazione da ReGiS) 13/06/2026, scaricata il 15/11/2026.
robots.txt di www.italiadomani.gov.it: il server risponde 403 «Access Denied» al solo robots.txt
(15/11/2026) mentre serve le pagine; secondo RFC 9309 (par. 2.3.1.3) un robots.txt non disponibile
con un codice 4xx non pone divieti. Da ricontrollare a mano.

Fonti valutate e NON usate (lette il 15/11/2026):
  - OpenCoesione (opencoesione.gov.it, CC BY 4.0), la fonte giusta per i progetti della sola coesione:
    il suo robots.txt vieta tutto il sito ai crawler degli assistenti AI. Rispettiamo il divieto anche
    se questo script usa un altro User-Agent. Lo strumento rimanda a OpenCoesione con un link.
  - OpenCUP (DIPE, CC BY 4.0): il campo LINK_OPENCOESIONE riconosce i CUP della coesione, ma non ci
    sono date previste né quote per Comune, e i file per area pesano 3,1 GB in tutto e si fermano a
    metà senza poter riprendere: da riprovare con un download più stabile.
  - OpenPNRR (openpnrr.it, Openpolis): protetto da un controllo anti-bot (Anubis), non si aggira.
  - Kohesio (Commissione europea): niente codice del Comune né stato, nomi di persone fisiche.
Popolazione: ISTAT, POSAS al 1° gennaio 2025 (~/dati-civici/istat/, come Il bilancio del mio Comune).
Comuni soppressi e fusi: ISTAT, «Elenco comuni soppressi» (CC BY 4.0, robots.txt senza divieti).

Scrive in progetti-comune/dati/:
  comuni.json      elenco per la ricerca, con numero di progetti, valore e fondi europei, e le mediane
                   per fascia di abitanti dei fondi europei (PNRR + altri fondi UE) per abitante
  p/<SIGLA>.json   le schede dei Comuni di una provincia: totali, temi (missioni), stati,
                   date di fine prevista dei progetti non conclusi, soggetti attuatori, i 20 più grandi

Regole (le stesse di src/regole.js):
  - entra un progetto con finanziamento PNRR o UE (diverso dal PNRR) maggiore di zero;
  - un CUP conta una volta per Comune: le sue righe (codici locali) si sommano;
  - il valore attribuito al Comune è il finanziamento totale per la percentuale di localizzazione;
  - concluso: stato «Concluso», oppure data di fine effettiva indicata, oppure CUP «Chiuso»;
  - i nomi dei soggetti attuatori con codice fiscale di persona fisica (16 caratteri) non si mostrano.

Uso:
  python3 -I scripts/progetti-comune-dati.py --scarica   # scarica i CSV (una richiesta per volta)
  python3 -I scripts/progetti-comune-dati.py             # prepara i dati dai CSV già scaricati
"""
import csv
import json
import os
import re
import sys
import time
import unicodedata
import urllib.request
import zipfile
from collections import Counter, defaultdict
from datetime import date
from statistics import median

csv.field_size_limit(10**9)
QUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(QUI)
GREZZI = os.path.expanduser('~/dati-civici')
CARTELLA = os.path.join(GREZZI, 'progetti-comune', 'pnrr')
USCITA = os.path.join(REPO, 'progetti-comune', 'dati')
UA = 'PolpoCivico/1.0 (strumenti civici)'
BASE = 'https://www.italiadomani.gov.it/content/dam/sogei-ng/opendata/'
FILE = [f'PNRR_Progetti_M{i}.csv' for i in range(1, 8)] + ['PNRR_Localizzazione.csv', 'PNRR_Progetti_Metadati.zip', 'PNRR_Localizzazione_Metadati.zip']
ISTAT_SOPPRESSI = 'https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-soppressi.zip'  # robots.txt: nessun divieto
VERSIONE = '13.0'
MAX_TOP = 20
MAX_ATTUATORI = 8


def scarica():
    os.makedirs(CARTELLA, exist_ok=True)
    for i, nome in enumerate(FILE):
        if i:
            time.sleep(2)
        dest = os.path.join(CARTELLA, nome)
        req = urllib.request.Request(BASE + nome, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=900) as r, open(dest + '.tmp', 'wb') as f:
            while True:
                b = r.read(1 << 20)
                if not b:
                    break
                f.write(b)
        os.replace(dest + '.tmp', dest)
        print('scaricato', nome, os.path.getsize(dest))
    time.sleep(2)
    cart = os.path.join(GREZZI, 'progetti-comune', 'istat')
    os.makedirs(cart, exist_ok=True)
    req = urllib.request.Request(ISTAT_SOPPRESSI, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=120) as r, open(os.path.join(cart, 'soppressi.zip'), 'wb') as f:
        f.write(r.read())
    with zipfile.ZipFile(os.path.join(cart, 'soppressi.zip')) as z:
        z.extractall(os.path.join(cart, 'soppressi'))


def euro(t):
    t = (t or '').strip().replace('.', '').replace(',', '.') if ',' in (t or '') else (t or '').strip()
    try:
        return float(t)
    except ValueError:
        return 0.0


def data_iso(t):
    m = re.match(r'(\d{2})/(\d{2})/(\d{4})', (t or '').strip())
    return f'{m.group(3)}-{m.group(2)}-{m.group(1)}' if m else ''


def chiave_nome(t):
    t = unicodedata.normalize('NFD', (t or '').lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z]', '', t)


def fascia(pop):
    """Le stesse fasce di Il bilancio del mio Comune (scripts/bilancio-bdap.py)."""
    for limite, nome in ((1000, 'meno di 1.000'), (2000, 'da 1.000 a 2.000'), (5000, 'da 2.000 a 5.000'), (10000, 'da 5.000 a 10.000'),
                         (20000, 'da 10.000 a 20.000'), (60000, 'da 20.000 a 60.000'), (100000, 'da 60.000 a 100.000'), (250000, 'da 100.000 a 250.000')):
        if pop < limite:
            return nome + ' abitanti'
    return 'oltre 250.000 abitanti'


def titolo_leggibile(t):
    """I titoli arrivano spesso in maiuscolo e con gli asterischi del CUP: li rendiamo leggibili, senza cambiare le parole."""
    t = re.sub(r'\s*\*\s*', ' · ', (t or '').strip()).strip(' ·')
    t = re.sub(r'\s+', ' ', t)
    if t and sum(c.isupper() for c in t) > 0.6 * sum(c.isalpha() for c in t):
        t = t[:1] + t[1:].lower()
    return t if len(t) <= 160 else t[:157].rsplit(' ', 1)[0] + '…'


def comuni_e_popolazione():
    """Elenco dei Comuni (ARERA, come Chi raccoglie i rifiuti), Regione per sigla (Per te) e popolazione ISTAT."""
    arera = json.load(open(os.path.join(GREZZI, 'raccolta', 'arera-comuni.json'), encoding='utf-8'))['elenco']
    regioni = json.load(open(os.path.join(REPO, 'per-te', 'dati', 'comuni.json'), encoding='utf-8'))['regioni']
    pop, pop_nome = {}, {}
    with open(os.path.join(GREZZI, 'istat', 'POSAS_2025_it_Comuni.csv'), encoding='utf-8-sig') as f:
        next(f)
        for r in csv.DictReader(f, delimiter=';'):
            if r['Età'] == '999':
                pop[r['Codice comune']] = int(r['Totale'])
                pop_nome[chiave_nome(r['Comune'])] = int(r['Totale'])
    comuni = {}
    for c in arera:
        p = pop.get(c['istat']) or pop_nome.get(chiave_nome(c['comune']))
        comuni[c['istat']] = {'istat': c['istat'], 'nome': c['comune'], 'sigla': c['sigla'], 'regione': regioni.get(c['sigla'], ''), 'cod_regione': c['regione'], 'pop': p}
    return comuni


def comuni_soppressi(comuni):
    """Codici dei Comuni soppressi (fusioni, incorporazioni) → Comune di oggi, dall'elenco ISTAT."""
    p = os.path.join(GREZZI, 'progetti-comune', 'istat', 'soppressi', 'Elenco comuni soppressi', 'Elenco comuni soppressi.csv')
    passo = {}
    with open(p, encoding='latin-1', newline='') as f:
        for r in csv.DictReader(f, delimiter=';'):
            if r['Codice del Comune associato alla variazione'] and not r['Comune soppresso per scorporo']:
                passo[r['Codice Comune']] = r['Codice del Comune associato alla variazione']
    for vecchio in [k for k in passo if k in comuni and not comuni[k]['pop']]:
        del comuni[vecchio]  # Comuni soppressi rimasti nell'elenco ARERA, senza abitanti: non si mostrano
    fusioni = {}
    for vecchio in passo:
        c, visti = vecchio, set()
        while c not in comuni and c in passo and c not in visti:
            visti.add(c)
            c = passo[c]
        if c in comuni:
            fusioni[vecchio] = c
    return fusioni


MISURE, FASI = {}, []


def fase(descr, stato):
    """La fase dell'iter come la scrive la fonte («Collaudo — Fase in corso»), con un numero per non ripeterla."""
    d = re.sub(r'\s+', ' ', (descr or '').strip())
    if not d or d.lower().startswith('fase non disponibile') or d == 'N/A':
        return -1
    t = d[:1] + d[1:].lower() + (f' ({stato.strip().lower()})' if stato.strip() and stato.strip() != 'N/A' else '')
    if t not in FASI:
        FASI.append(t)
    return FASI.index(t)


def leggi_progetti():
    righe = {}
    scartate = Counter()
    estrazione = set()
    for nome in FILE[:7]:
        with open(os.path.join(CARTELLA, nome), encoding='utf-8-sig', newline='') as f:
            for r in csv.DictReader(f, delimiter=';'):
                pnrr, ue = euro(r['Finanziamento PNRR']), euro(r['Finanziamento UE (Diverso da PNRR)'])
                if pnrr <= 0 and ue <= 0:
                    scartate['senza fondi PNRR o UE'] += 1
                    continue
                stato = r['Stato Avanzamento Progetto'].strip().lower()
                fe = data_iso(r['Data Fine Progetto Effettiva'])
                concluso = stato == 'concluso' or bool(fe) or r['Stato CUP'].strip().lower() == 'chiuso'
                cf = r['Codice Fiscale Soggetto Attuatore'].strip().upper()
                persona = bool(re.fullmatch(r'[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]', cf))
                righe[(r['CUP'].strip(), r['Codice Locale Progetto'].strip())] = {
                    'cup': r['CUP'].strip(),
                    'missione': r['Missione'].strip(),
                    'misura': r['Codice Univoco Submisura'].strip(),
                    'titolo': titolo_leggibile(r['Titolo Progetto']),
                    'tot': euro(r['Finanziamento Totale']) or (pnrr + ue),
                    'pnrr': pnrr, 'ue': ue,
                    'stato': 'c' if concluso else 'i' if stato == 'in corso' else 'a' if stato == 'da attivare' else 'x',
                    'att': 'Persona fisica (nome non mostrato)' if persona else re.sub(r'\s+', ' ', r['Soggetto Attuatore'].strip()),
                    'cf': '' if persona else cf,
                    'ip': data_iso(r['Data Inizio Progetto Prevista']), 'ie': data_iso(r['Data Inizio Progetto Effettiva']),
                    'fp': data_iso(r['Data Fine Progetto Prevista']), 'fe': fe,
                    'fase': fase(r['Descrizione Fase Iter di Progetto'], r['Stato Fase Iter di Progetto']),
                }
                MISURE[r['Codice Univoco Submisura'].strip()] = r['Descrizione Submisura'].strip() or r['Descrizione Misura'].strip()
                estrazione.add(data_iso(r['Data di Estrazione']))
    return righe, scartate, estrazione


def leggi_localizzazioni():
    loc = defaultdict(list)
    with open(os.path.join(CARTELLA, 'PNRR_Localizzazione.csv'), encoding='utf-8-sig', newline='') as f:
        for r in csv.DictReader(f, delimiter=';'):
            if r['Comune'].strip('0') == '' or r['Provincia'].strip('0') == '':
                continue  # progetto localizzato solo a livello di Regione o nazionale
            loc[(r['CUP'].strip(), r['Codice Locale Progetto'].strip())].append((r['Provincia'] + r['Comune'], r['Regione'][-2:], r['Descrizione Comune'], euro(r['Percentuale di Localizzazione'])))
    return loc


def main():
    if '--scarica' in sys.argv:
        scarica()
    comuni = comuni_e_popolazione()
    per_nome = defaultdict(list)
    for c in comuni.values():
        per_nome[(c['cod_regione'], chiave_nome(c['nome']))].append(c['istat'])
        per_nome[('*', chiave_nome(c['nome']))].append(c['istat'])
    fusioni = comuni_soppressi(comuni)
    per_nome.clear()
    for c in comuni.values():
        per_nome[(c['cod_regione'], chiave_nome(c['nome']))].append(c['istat'])
        per_nome[('*', chiave_nome(c['nome']))].append(c['istat'])
    righe, scartate, estrazione = leggi_progetti()
    loc = leggi_localizzazioni()
    if len(estrazione) != 1:
        print('attenzione: più date di estrazione', estrazione)
    estr = max(estrazione)

    # Codici ISTAT del 2024 (per esempio le vecchie province sarde) → codici di oggi, per nome nella stessa Regione
    non_trovati = Counter()

    def codice(istat, reg, nome):
        if istat in comuni:
            return istat
        if istat[0] == '3' and f'{int(istat[:3]) - 200:03d}{istat[3:]}' in comuni:
            return f'{int(istat[:3]) - 200:03d}{istat[3:]}'  # nuove province sarde: 318 Cagliari → Comuni 118xxx
        if istat in fusioni:
            return fusioni[istat]
        for chiave in ((reg, chiave_nome(nome)), (reg, chiave_nome(re.sub(r'\bdi\b', '', nome, flags=re.I))), ('*', chiave_nome(nome))):
            k = per_nome.get(chiave)
            if k and len(k) == 1:
                return k[0]  # stesso nome nella stessa Regione (o unico in Italia: Comuni passati a un'altra Regione)
        non_trovati[f'{istat} {nome}'] += 1
        return None

    # Comune → CUP → righe con la quota
    per_comune = defaultdict(lambda: defaultdict(list))
    ncomuni = defaultdict(set)
    for k, posti in loc.items():
        r = righe.get(k)
        if not r:
            continue
        for istat, reg, nome, perc in posti:
            c = codice(istat, reg, nome)
            if c and perc > 0:
                per_comune[c][r['cup']].append((r, perc / 100))
                ncomuni[r['cup']].add(c)

    schede = {}
    for istat, cups in per_comune.items():
        n = len(cups)
        v = pn = ue = 0.0
        temi = defaultdict(lambda: [0, 0.0])
        stati = defaultdict(lambda: [0, 0.0])
        scad = defaultdict(lambda: [0, 0.0])
        senza_data = 0
        att = defaultdict(lambda: [0, 0.0, ''])
        progetti = []
        for cup, parti in cups.items():
            quota = sum(r['tot'] * q for r, q in parti)
            v += quota
            pn += sum(r['pnrr'] * q for r, q in parti)
            ue += sum(r['ue'] * q for r, q in parti)
            principale = max(parti, key=lambda x: x[0]['tot'])[0]
            for r, q in parti:
                temi[r['missione']][1] += r['tot'] * q
            temi[principale['missione']][0] += 1
            concluso = all(r['stato'] == 'c' for r, _ in parti)
            stato = 'c' if concluso else next((s for s in ('i', 'a', 'x') if any(r['stato'] == s for r, _ in parti)), 'x')
            stati[stato][0] += 1
            stati[stato][1] += quota
            fp = max((r['fp'] for r, _ in parti), default='')
            if not concluso:
                if fp:
                    scad[fp][0] += 1
                    scad[fp][1] += quota
                else:
                    senza_data += 1
            a = att[principale['cf'] or principale['att']]
            a[0] += 1
            a[1] += quota
            a[2] = principale['att']
            progetti.append({
                'cup': cup, 'titolo': principale['titolo'], 'tot': sum(r['tot'] for r, _ in parti), 'quota': quota,
                'pnrr': sum(r['pnrr'] for r, _ in parti), 'ue': sum(r['ue'] for r, _ in parti),
                'missione': principale['missione'], 'misura': principale['misura'], 'stato': stato, 'att': principale['att'],
                'ip': min((r['ip'] for r, _ in parti if r['ip']), default=''), 'ie': min((r['ie'] for r, _ in parti if r['ie']), default=''),
                'fp': fp, 'fe': max((r['fe'] for r, _ in parti), default='') if concluso else '',
                'fase': principale['fase'], 'nc': len(ncomuni[cup]),
            })
        progetti.sort(key=lambda p: (-p['quota'], p['cup']))
        att_ord = sorted(att.values(), key=lambda a: -a[1])
        schede[istat] = {
            'n': n, 'v': round(v), 'pnrr': round(pn), 'ue': round(ue),
            'multi': sum(1 for cup in cups if len(ncomuni[cup]) > 1),
            'temi': sorted([[m, t[0], round(t[1])] for m, t in temi.items()], key=lambda x: -x[2]),
            'stati': {s: [t[0], round(t[1])] for s, t in stati.items()},
            'scad': sorted([[d, t[0], round(t[1])] for d, t in scad.items()]),
            'senza_data': senza_data,
            'att': [[a[2], a[0], round(a[1])] for a in att_ord[:MAX_ATTUATORI]],
            'att_altri': [sum(a[0] for a in att_ord[MAX_ATTUATORI:]), round(sum(a[1] for a in att_ord[MAX_ATTUATORI:]))],
            'top': [[p['cup'], p['titolo'], round(p['tot']), round(p['quota']), round(p['pnrr']), round(p['ue']), p['missione'], p['misura'], p['stato'],
                     p['att'], p['ip'], p['ie'], p['fp'], p['fe'], p['fase'], p['nc']] for p in progetti[:MAX_TOP]],
        }

    # Mediane per abitante nella stessa fascia (anche i Comuni senza progetti contano, con zero)
    gruppi = defaultdict(list)
    for istat, c in comuni.items():
        if c['pop']:
            sc = schede.get(istat, {})
            gruppi[fascia(c['pop'])].append((sc.get('pnrr', 0) + sc.get('ue', 0)) / c['pop'])  # fondi europei per abitante
    fasce = {f: {'comuni': len(x), 'mediana_pc': round(median(x)), 'con_progetti': sum(1 for y in x if y > 0)} for f, x in gruppi.items()}

    os.makedirs(os.path.join(USCITA, 'p'), exist_ok=True)
    for vecchio in os.listdir(os.path.join(USCITA, 'p')):
        os.remove(os.path.join(USCITA, 'p', vecchio))
    per_prov = defaultdict(dict)
    for istat, c in comuni.items():
        s = schede.get(istat)
        if s:
            per_prov[c['sigla']][istat] = s
    for sigla, d in per_prov.items():
        with open(os.path.join(USCITA, 'p', f'{sigla}.json'), 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
    elenco = sorted([[c['istat'], c['nome'], c['sigla'], c['regione'], c['pop'] or 0, schede.get(i, {}).get('n', 0), schede.get(i, {}).get('v', 0),
                      schede.get(i, {}).get('pnrr', 0) + schede.get(i, {}).get('ue', 0)] for i, c in comuni.items()], key=lambda x: x[1])
    indice = {
        'aggiornato': date.today().isoformat(),
        'estrazione': estr,
        'versione': VERSIONE,
        'campi': ['istat', 'nome', 'sigla', 'regione', 'pop', 'n', 'valore', 'fondi_ue'],
        'campi_top': ['cup', 'titolo', 'tot', 'quota', 'pnrr', 'ue', 'missione', 'misura', 'stato', 'attuatore', 'inizio_prevista', 'inizio_effettiva', 'fine_prevista', 'fine_effettiva', 'fase', 'n_comuni'],
        'fasce': fasce,
        'misure': {k: v for k, v in sorted(MISURE.items())},
        'fasi': FASI,
        'comuni': elenco,
    }
    with open(os.path.join(USCITA, 'comuni.json'), 'w', encoding='utf-8') as f:
        json.dump(indice, f, ensure_ascii=False, separators=(',', ':'))

    tot_v = sum(s['v'] for s in schede.values())
    print(f'righe progetto usate: {len(righe)}; scartate: {dict(scartate)}; estrazione {estr}')
    print(f'Comuni con progetti: {len(schede)} su {len(comuni)}; valore attribuito ai Comuni: {tot_v / 1e9:.1f} miliardi')
    print(f'codici non trovati: {sum(non_trovati.values())} righe, {len(non_trovati)} codici', non_trovati.most_common(10))
    peso = sum(os.path.getsize(os.path.join(USCITA, 'p', x)) for x in os.listdir(os.path.join(USCITA, 'p')))
    print(f'p/: {len(per_prov)} file, {peso / 1e6:.1f} MB; comuni.json {os.path.getsize(os.path.join(USCITA, "comuni.json")) / 1e6:.2f} MB')


if __name__ == '__main__':
    main()
