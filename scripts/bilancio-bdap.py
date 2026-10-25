#!/usr/bin/env python3
"""Il bilancio del mio Comune: dai rendiconti BDAP alle schede per Comune.

Legge i CSV estratti in ~/dati-civici/bdap/<anno>/ dagli zip OpenBDAP
«Rendiconto - Schemi di bilancio» e «Rendiconto - Piano degli indicatori»
(Ragioneria Generale dello Stato, openbdap.rgs.mef.gov.it), la popolazione
ISTAT al 1° gennaio (~/dati-civici/istat/POSAS_2025_it_Comuni.csv) e, per le
sigle delle province, l'anagrafe ANAC delle stazioni appaltanti.

Scrive in bilancio-comune/dati/:
  comuni.json        elenco per la ricerca (anche per il collegamento con gli appalti)
  p/<SIGLA>.json     le schede, una per provincia
  confronto.json     mediane dei Comuni della stessa fascia di abitanti

Per ogni Comune usa il rendiconto più recente (2025); se manca, il 2024.
Uso: python3 -I scripts/bilancio-bdap.py
"""
import csv
import io
import json
import os
import re
import sys
import zipfile
from collections import defaultdict
from datetime import date

csv.field_size_limit(10**9)
QUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(QUI)
GREZZI = os.path.expanduser('~/dati-civici')
USCITA = os.path.join(REPO, 'bilancio-comune', 'dati')
ANNI = (2025, 2024)

# Programmi che interessano a chi vive nel Comune (d.lgs. 118/2011, allegato 14)
PROGRAMMI = {
    '0301': 'Polizia locale',
    '0401': "Scuola dell'infanzia",
    '0402': 'Scuole elementari e medie',
    '0406': 'Mensa e trasporto scolastico',
    '0502': 'Cultura e biblioteche',
    '0601': 'Sport e tempo libero',
    '0902': 'Verde pubblico e ambiente',
    '0903': 'Rifiuti',
    '0904': 'Acqua e fognature',
    '1002': 'Trasporto pubblico locale',
    '1005': 'Strade e illuminazione',
    '1201': 'Asili nido, infanzia e minori',
    '1202': 'Disabilità',
    '1203': 'Anziani',
    '1204': 'Esclusione sociale e povertà',
    '1206': 'Casa',
    '1209': 'Cimiteri',
}
ESCLUSE = {'99', '60'}  # partite di giro e anticipazioni di tesoreria: non sono spesa per servizi

PDI = {  # indicatori sintetici del Piano degli indicatori (DM 22/12/2015, allegato 1-a)
    '01/01': 'rigidita', '04/04': 'personale_pc', '07/04': 'investimenti_pc', '09/05': 'tempestivita',
    '10/04': 'debito_pc', '02/08': 'incassi_propri',
}


def apri(anno, frammento):
    cartella = os.path.join(GREZZI, 'bdap', str(anno))
    if not os.path.isdir(cartella):
        return None
    for n in sorted(os.listdir(cartella)):
        if frammento in n and n.endswith('.csv'):
            return os.path.join(cartella, n)
    return None


def codifica(percorso):
    """I CSV di OpenBDAP sono a volte UTF-8, a volte Latin-1."""
    with open(percorso, 'rb') as f:
        campione = f.read(1 << 20)
    try:
        campione.decode('utf-8')
        return 'utf-8-sig'
    except UnicodeDecodeError as e:
        return 'utf-8-sig' if e.start > len(campione) - 4 else 'cp1252'


def righe(percorso):
    with open(percorso, encoding=codifica(percorso), errors='replace', newline='') as f:
        for r in csv.DictReader(f, delimiter=';'):
            if r.get('Codice Tipologia Soggetto') == 'ELCOMU':
                yield r


def col(r, *prefissi):
    """Valore della prima colonna il cui nome, senza spazi doppi, comincia con uno dei prefissi."""
    for k, v in r.items():
        if k is None:
            continue
        kk = re.sub(r'\s+', ' ', k).strip().lower()
        for p in prefissi:
            if kk.startswith(p.lower()):
                return v
    return None


def num(s):
    try:
        return float(str(s).replace(',', '.'))
    except (TypeError, ValueError):
        return 0.0


def istat(r):
    p, c = (r.get('Codice Provincia') or '').zfill(3), (r.get('Codice Comune') or '').zfill(3)
    return p + c


def titolo(t):
    t = re.sub(r'\s+', ' ', (t or '').strip())
    t = re.sub(r'^COMUNE DI ', '', t, flags=re.I)
    if t.isupper():
        piccole = {'di', 'del', 'della', 'dei', 'e', 'in', 'sul', 'sulla', 'al', 'a', 'de', 'da', 'delle', 'nel', 'con', 'sopra', 'sotto'}
        t = ' '.join(p if (i and p in piccole) else p[:1].upper() + p[1:] for i, p in enumerate(t.lower().split(' ')))
        t = re.sub(r"([A-Za-z]')([a-z])", lambda m: m.group(1) + m.group(2).upper(), t)
        t = re.sub(r'-([a-z])', lambda m: '-' + m.group(1).upper(), t)
    return t


def fascia(pop):
    for limite, nome in ((1000, 'meno di 1.000'), (2000, 'da 1.000 a 2.000'), (5000, 'da 2.000 a 5.000'), (10000, 'da 5.000 a 10.000'),
                         (20000, 'da 10.000 a 20.000'), (60000, 'da 20.000 a 60.000'), (100000, 'da 60.000 a 100.000'), (250000, 'da 100.000 a 250.000')):
        if pop < limite:
            return nome + ' abitanti'
    return 'oltre 250.000 abitanti'


def popolazione():
    p = os.path.join(GREZZI, 'istat', 'POSAS_2025_it_Comuni.csv')
    pop = {}
    with open(p, encoding='utf-8-sig') as f:
        next(f)
        for r in csv.DictReader(f, delimiter=';'):
            if r['Età'] == '999':
                pop[r['Codice comune']] = int(r['Totale'])
                pop['nome:' + chiave_nome(r['Comune'])] = int(r['Totale'])
    return pop


def chiave_nome(t):
    return re.sub(r'[^a-z]', '', (t or '').lower().replace('à', 'a').replace('è', 'e').replace('é', 'e').replace('ì', 'i').replace('ò', 'o').replace('ù', 'u'))


def sigle_province():
    """Codice ISTAT della provincia → sigla, dall'anagrafe ANAC (citta_codice e provincia_codice)."""
    sig = {}
    z = os.path.join(GREZZI, 'anac', 'stazioni.zip')
    if not os.path.exists(z):
        return sig
    with zipfile.ZipFile(z) as zz:
        for n in zz.namelist():
            with zz.open(n) as f:
                for r in csv.DictReader(io.TextIOWrapper(f, encoding='utf-8-sig', errors='replace'), delimiter=';'):
                    c, s = (r.get('citta_codice') or ''), (r.get('provincia_codice') or '').replace('IT-', '')
                    if len(c) == 6 and re.fullmatch(r'[A-Z]{2}', s):
                        sig.setdefault(c[:3], defaultdict(int))[s] += 1
    return {k: max(v, key=v.get) for k, v in sig.items()}


def leggi_anno(anno):
    """Schede grezze di tutti i Comuni per un anno di rendiconto."""
    c = {}

    def scheda(r):
        k = istat(r)
        s = c.get(k)
        if s is None:
            s = c[k] = {'istat': k, 'cf': (r.get('CF Soggetto') or '').strip(), 'nome': titolo(r.get('Denominazione Soggetto')),
                        'regione': titolo(r.get('Descrizione Regione')), 'provincia': titolo(r.get('Descrizione Provincia')),
                        'prov_istat': (r.get('Codice Provincia') or '').zfill(3), 'anno': anno, 'cessato': bool((r.get('Data Cessazione Soggetto') or '').strip()),
                        'missioni': defaultdict(lambda: [0.0, 0.0]), 'programmi': defaultdict(float), 'titoli_spesa': defaultdict(float),
                        'entrate': {}, 'risultato': {}, 'parametri': [], 'deficitario': None, 'pdi': {}, 'tipologie': {}}
        return s

    p = apri(anno, 'SDB Spese.csv')
    if not p:
        return c
    for r in righe(p):
        s = scheda(r)
        m = (col(r, 'Codice Missione') or '').zfill(2)
        pr = (col(r, 'Codice Programma') or '').zfill(2)
        t = (col(r, 'Codice Titolo') or '').zfill(2)
        imp, pag = num(col(r, 'Impegni')), num(col(r, 'Tot. Pag'))
        s['missioni'][m][0] += imp
        s['missioni'][m][1] += pag
        if m not in ESCLUSE:
            s['titoli_spesa'][t] += imp
            codice = m + pr[-2:]
            if codice in PROGRAMMI:
                s['programmi'][codice] += imp

    p = apri(anno, 'Entrate Riepilogo Titoli.csv')
    for r in righe(p) if p else []:
        s = scheda(r)
        t = (col(r, 'Codice Titolo') or '').zfill(2)
        s['entrate'][t] = {'accertati': num(col(r, 'Accertamenti')), 'riscossi_comp': num(col(r, 'Riscossioni in C/Competenza')),
                           'riscossi_tot': num(col(r, 'Totale Riscossioni')), 'residui_iniziali': num(col(r, 'Residui Attivi Iniziali')),
                           'residui_fine': num(col(r, 'Totale Residui Attivi da Riportare'))}

    p = apri(anno, 'SDB Entrate.csv')
    for r in righe(p) if p else []:
        s = scheda(r)
        if (col(r, 'Codice Titolo') or '').zfill(2) != '01':
            continue
        tip = (col(r, 'Cod Tipologia') or '').zfill(4)
        if tip in ('0101', '0104', '0301', '0302'):  # imposte e tasse, compartecipazioni, fondi perequativi
            s['tipologie'][tip] = s['tipologie'].get(tip, 0.0) + num(col(r, 'Accert. in CC'))

    p = apri(anno, 'Allegato A Risultato')
    voci = {'0507': 'totale', '0502': 'libera', '0500': 'accantonata', '0503': 'vincolata', '0501': 'investimenti', '0491': 'fcde', '0495': 'cassa', '0505': 'residui_passivi', '0504': 'residui_attivi'}
    for r in righe(p) if p else []:
        v = (col(r, 'Cod Voce') or '').zfill(4)
        if v in voci:
            scheda(r)['risultato'][voci[v]] = num(col(r, 'Totale di Gestione'))

    p = apri(anno, 'Allegato l Parametri')
    for r in righe(p) if p else []:
        s = scheda(r)
        cod = (col(r, 'Codice Parametro') or '').zfill(4)
        si = (col(r, 'Valore Parametro') or '').strip().upper() == 'SI'
        if cod == '0010':
            s['deficitario'] = si
        elif si:
            s['parametri'].append(re.sub(r'\s+', ' ', col(r, 'Parametro Deficitario') or '').strip())

    p = apri(anno, 'Sintetici')
    for r in righe(p) if p else []:
        # il numero dell'indicatore («10.4») sta all'inizio della descrizione
        m = re.match(r'\s*(\d+)\.(\d+)', col(r, 'Descrizione Indicatore Sintetico') or '')
        if not m:
            continue
        k = f'{int(m.group(1)):02d}/{int(m.group(2)):02d}'
        if k in PDI:
            scheda(r)['pdi'][PDI[k]] = num(col(r, 'Indicatore Tutte Le Missioni'))
    return c


def compatta(s, pop):
    """Dalla scheda grezza alla scheda pubblicata (importi arrotondati all'euro)."""
    spesa = {m: [round(v[0]), round(v[1])] for m, v in s['missioni'].items() if m not in ESCLUSE and (v[0] or v[1])}
    tot = sum(v[0] for m, v in spesa.items())
    ent = s['entrate']
    proprie = sum(ent.get(t, {}).get('accertati', 0) for t in ('01', '03'))
    risc = sum(ent.get(t, {}).get('riscossi_comp', 0) for t in ('01', '03'))
    out = {
        'istat': s['istat'], 'cf': s['cf'], 'nome': s['nome'], 'provincia': s['provincia'], 'regione': s['regione'],
        'anno': s['anno'], 'pop': pop, 'fascia': fascia(pop) if pop else None,
        'spesa': spesa, 'spesa_tot': round(tot),
        'correnti': round(s['titoli_spesa'].get('01', 0)), 'investimenti': round(s['titoli_spesa'].get('02', 0)),
        'rate_mutui': round(s['titoli_spesa'].get('04', 0)),
        'programmi': {k: round(v) for k, v in s['programmi'].items() if v},
        'entrate': {t: round(v['accertati']) for t, v in ent.items() if t not in ('07', '09') and v['accertati']},
        'riscossione': round(100 * risc / proprie, 1) if proprie > 0 else None,
        'tributi': {k: round(v) for k, v in s['tipologie'].items() if v},
        'risultato': {k: round(v) for k, v in s['risultato'].items()},
        'deficitario': s['deficitario'],
        'parametri': s['parametri'],
        'pdi': {k: round(v, 2) for k, v in s['pdi'].items()},
    }
    return out


def mediana(v):
    v = sorted(x for x in v if x is not None)
    if not v:
        return None
    n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2


def main():
    os.makedirs(os.path.join(USCITA, 'p'), exist_ok=True)
    pop = popolazione()
    sigle = sigle_province()
    schede = {}
    for anno in ANNI:
        for k, s in leggi_anno(anno).items():
            if k in schede or s['cessato'] or not s['missioni']:
                continue
            # in Sardegna le province sono cambiate nel 2025: se il codice non c'è, cerco per nome
            p = pop.get(k) or (pop.get('nome:' + chiave_nome(s['nome'])) if s['regione'] == 'Sardegna' else None)
            schede[k] = compatta(s, p)
        print(anno, len(schede), file=sys.stderr)

    # Confronto: mediane pro capite nella stessa fascia di abitanti
    gruppi = defaultdict(list)
    for s in schede.values():
        if s['pop']:
            gruppi[s['fascia']].append(s)
    confronto = {}
    for g, lista in gruppi.items():
        pc = lambda f: mediana([f(s) / s['pop'] for s in lista if s['pop']])
        missioni = {m: round(pc(lambda s, m=m: s['spesa'].get(m, [0])[0])) for m in {m for s in lista for m in s['spesa']}}
        confronto[g] = {
            'comuni': len(lista),
            'spesa_pc': round(pc(lambda s: s['spesa_tot'])),
            'investimenti_pc': round(pc(lambda s: s['investimenti'])),
            'missioni_pc': {m: v for m, v in missioni.items() if v},
            'programmi_pc': {p: round(pc(lambda s, p=p: s['programmi'].get(p, 0))) for p in PROGRAMMI},
            'entrate_pc': {t: round(pc(lambda s, t=t: s['entrate'].get(t, 0))) for t in ('01', '02', '03', '04', '06')},
            'riscossione': mediana([s['riscossione'] for s in lista]),
            'pdi': {k: mediana([s['pdi'].get(k) for s in lista]) for k in PDI.values()},
            'libera_pc': round(mediana([s['risultato'].get('libera', 0) / s['pop'] for s in lista if s['pop']])),
            'deficitari': sum(1 for s in lista if s['deficitario']),
        }

    per_prov = defaultdict(dict)
    elenco = []
    for k, s in schede.items():
        sig = sigle.get(k[:3], 'P' + k[:3])
        s['sigla'] = sig
        per_prov[sig][k] = s
        elenco.append({'istat': k, 'cf': s['cf'], 'nome': s['nome'], 'sigla': sig, 'pop': s['pop'], 'anno': s['anno']})
    elenco.sort(key=lambda x: x['nome'])
    meta = {
        'aggiornato': date.today().isoformat(),
        'fonte': 'Ragioneria Generale dello Stato, OpenBDAP: rendiconti dei Comuni (schemi di bilancio e piano degli indicatori); ISTAT, popolazione residente al 1° gennaio 2025 (CC BY 4.0)',
        'anni': list(ANNI),
        'comuni': len(schede),
    }
    scrivi('comuni.json', {**meta, 'comuni': elenco})
    scrivi('confronto.json', {**meta, 'programmi': PROGRAMMI, 'fasce': confronto})
    for sig, d in per_prov.items():
        scrivi(os.path.join('p', sig + '.json'), d)
    print(len(schede), 'Comuni,', len(per_prov), 'province', file=sys.stderr)


def scrivi(rel, dati):
    with open(os.path.join(USCITA, rel), 'w', encoding='utf-8') as f:
        json.dump(dati, f, ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    main()
