#!/usr/bin/env python3
"""I dati di «Quanto pago di IMU?»: le aliquote IMU deliberate da ogni Comune, lette dai
«prospetti delle aliquote» pubblicati dal Dipartimento delle Finanze (MEF).

Da dove vengono
- Dal 2025 ogni Comune approva le aliquote IMU compilando un prospetto standard nel Portale del
  federalismo fiscale (legge 160/2019, art. 1, commi 756-757; DM 7 luglio 2023 e DM 6 settembre 2024).
  Il prospetto vale solo se pubblicato sul sito del Dipartimento delle Finanze entro il 28 ottobre
  dell'anno (comma 767); se non lo è, si applicano gli atti dell'anno prima.
- Il Dipartimento pubblica, per ogni anno, l'elenco CSV delle delibere (codice catastale, numero e
  data, data di pubblicazione, nome del file, note come «inefficace») e i testi in PDF raccolti in un
  file ZIP per Regione:
  https://www.finanze.gov.it/it/fiscalita/fiscalita-regionale-e-locale/Imposta-municipale-propria-IMU/Regolamenti-e-aliquote-ricerca/elenchi-generali-aggiornati-quotidianamente/
  https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_imu/dati/download.htm?anno=2026
- robots.txt: www1.finanze.gov.it non ne ha (404, quindi nessun divieto); quello di www.finanze.gov.it
  risponde 403 a qualunque client (controllato il 15/11/2026). Si scaricano solo i file messi a
  disposizione per il download, una richiesta per volta con una pausa di 2 secondi.
- Trentino-Alto Adige (IMIS a Trento, IMI a Bolzano: comma 739) e Friuli Venezia Giulia (ILIA, legge
  regionale 17/2022, dal 2023) non hanno l'IMU: i loro file non si scaricano.

Cosa fa
1. scarica in ~/dati-civici/imu/<anno>/ il CSV delle delibere e gli ZIP delle Regioni (salta i file già
   scaricati; con --aggiorna li riscarica);
2. legge ogni prospetto con pdftotext (poppler) e ne estrae le sette aliquote di base e le aliquote
   differenziate (fattispecie, condizioni, aliquota), le esenzioni indicate dal Comune;
3. per ogni Comune sceglie il prospetto efficace dell'anno: l'ultimo pubblicato entro il 28 ottobre,
   o una correzione successiva («errata corrige», «autotutela»), mai quelli segnati «inefficace»;
4. scrive imu/dati/p/<sigla>.json (un file per provincia) e imu/dati/indice.json (elenco Comuni con
   codice catastale, ISTAT, provincia e anni disponibili).

Un'aliquota che il programma non riesce a leggere resta vuota (null): l'interfaccia allora chiede
alla persona di copiarla dal prospetto, con il link. Nessuna aliquota viene stimata o inventata.

Uso: python3 -I scripts/imu-dati.py [--anni 2025,2026] [--aggiorna] [--solo-analisi]
Licenza: atti pubblici (art. 5 legge 633/1941, i testi ufficiali degli atti non sono coperti da diritto d'autore).
"""
import csv
import io
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import zipfile
from datetime import date, datetime

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATI = os.path.expanduser('~/dati-civici/imu')
UA = 'PolpoCivico/1.0 (strumenti civici)'
BASE = 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_imu/dati'
ZIP = 'https://www1.finanze.gov.it/dipartimentopolitichefiscali/fiscalitalocale/tributi_locali/datizip'
REGIONI = ['abruzzo', 'basilicata', 'calabria', 'campania', 'emilia-romagna', 'lazio', 'liguria', 'lombardia', 'marche', 'molise',
           'piemonte', 'puglia', 'sardegna', 'sicilia', 'toscana', 'umbria', 'valledaosta', 'veneto']
# Province senza IMU (comma 739): Trento (IMIS), Bolzano (IMI), Friuli Venezia Giulia (ILIA). Il CSV del
# Dipartimento elenca anche le loro delibere, che qui si scartano.
SENZA_IMU = {'TN', 'BZ', 'GO', 'PN', 'TS', 'UD'}
PAGINA_RICERCA = 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_imu/sceltaregione.htm'


def scarica(url, dove, aggiorna=False):
    if os.path.exists(dove) and not aggiorna:
        return False
    tmp = dove + '.tmp'
    # il server è lento sui file grandi: si legge a pezzi e, se si interrompe, si riprende da dove era arrivato
    for prova in range(12):
        gia = os.path.getsize(tmp) if os.path.exists(tmp) else 0
        intestazioni = {'User-Agent': UA}
        if gia:
            intestazioni['Range'] = f'bytes={gia}-'
        try:
            req = urllib.request.Request(url, headers=intestazioni)
            with urllib.request.urlopen(req, timeout=120) as r:
                riprende = gia and r.status == 206
                with open(tmp, 'ab' if riprende else 'wb') as f:
                    while True:
                        pezzo = r.read(1 << 20)
                        if not pezzo:
                            break
                        f.write(pezzo)
            if dove.endswith('.zip') and not zipfile.is_zipfile(tmp):
                raise OSError('archivio incompleto')
            break
        except urllib.error.HTTPError as e:
            if e.code == 416:  # già tutto scaricato
                break
            raise
        except (OSError, TimeoutError) as e:
            print('riprovo', os.path.basename(dove), e, flush=True)
            time.sleep(5 * (prova + 1))
    else:
        raise RuntimeError(f'non riesco a scaricare {url}')
    n = os.path.getsize(tmp)
    os.replace(tmp, dove)
    print('scaricato', os.path.basename(dove), n, 'byte', flush=True)
    time.sleep(2)
    return True


def scarica_anno(anno, aggiorna):
    cartella = os.path.join(DATI, str(anno))
    os.makedirs(cartella, exist_ok=True)
    scarica(f'{BASE}/download_csv_IMU.php?tipo=D&anno={anno}', os.path.join(cartella, 'delibere.csv'), aggiorna)
    for reg in REGIONI:
        scarica(f'{ZIP}/{anno}/{reg}.zip', os.path.join(cartella, f'{reg}.zip'), aggiorna)
    with open(os.path.join(cartella, 'letto.txt'), 'w') as f:
        f.write(date.today().isoformat() + '\n')


# ---------------- lettura dei prospetti ----------------

def pdf_testo(dati):
    p = subprocess.run(['pdftotext', '-layout', '-enc', 'UTF-8', '-', '-'], input=dati, capture_output=True, timeout=60)
    return p.stdout.decode('utf-8', 'replace')


ALIQ = r'(\d{1,2}(?:,\d{1,4})?)\s?%'
# Le sette voci fisse del prospetto, nell'ordine in cui compaiono
BASE_VOCI = [
    ('abitazione_lusso', r'^\s*Abitazione principale di categoria catastale A/1'),
    ('assimilazione_anziani', r'^\s*Assimilazione all.abitazione principale'),
    ('rurali', r'^\s*Fabbricati rurali ad uso strumentale'),
    ('gruppo_d', r'^\s*Fabbricati appartenenti al gruppo catastale D \(esclusa'),
    ('terreni', r'^\s*Terreni agricoli'),
    ('aree', r'^\s*Aree fabbricabili'),
    ('altri', r'^\s*Altri fabbricati \(fabbricati diversi'),
    ('beni_merce', r'^\s*Fabbricati costruiti e destinati dall.impresa costruttrice alla vendita'),
]


def num(s):
    return round(float(s.replace(',', '.')), 4)


def celle(riga):
    """Le colonne di una riga del prospetto (pdftotext -layout): [(colonna, testo)]."""
    out = []
    for m in re.finditer(r'\S+(?: {1,2}\S+)*', riga):
        t = m.group(0).strip()
        # «Immobili di categoria 0,86%»: l'aliquota attaccata al testo diventa una cella a parte
        mm = re.match(r'^(.*\S)\s(\d{1,2}(?:,\d{1,4})?\s?%)$', t)
        if mm:
            out += [(m.start(), mm.group(1)), (m.start() + len(mm.group(1)) + 1, mm.group(2))]
        else:
            out.append((m.start(), t))
    return out


PERC = re.compile(r'^(\d{1,2}(?:,\d{1,4})?)\s?%$')
CATEGORIA = re.compile(r'^([ABCDEF])/(\d{1,2})\b')
SINISTRA = 24  # le celle che cominciano prima di questa colonna sono la fattispecie


def leggi_prospetto(testo):
    """Dal testo del prospetto: aliquote di base, differenziate, esenzioni. None se non è un prospetto."""
    if 'Prospetto aliquote IMU' not in testo:
        return None
    righe = [r.rstrip() for r in testo.replace('\f', '\n').split('\n')]
    out = {'base': {}, 'diff': [], 'esenzioni': []}
    m = re.search(r'riferito all.anno (\d{4})', testo)
    out['anno'] = int(m.group(1)) if m else None
    m = re.search(r'ID Prospetto (\d+)', testo)
    out['id'] = m.group(1) if m else None
    out['fusione'] = bool(re.search(r'aliquote differenziate nei preesistenti comuni:\s*SI', testo))

    # il corpo comincia dopo l'avvertenza sul comma 764 e finisce a «Elenco esenzioni» o «Precisazioni»
    inizio = next((i for i, r in enumerate(righe) if re.search(r'Comune oggetto di fusione', r)), 0) + 1
    fine = next((i for i, r in enumerate(righe) if re.match(r'^\s*(Elenco esenzioni|Precisazioni|Documento generato)', r)), len(righe))
    voci, cur, vuota = [], None, True
    for r in righe[inizio:fine]:
        if not r.strip():
            vuota = True
            continue
        if re.match(r'^\s*Pagina \d+ di \d+\s*$', r):
            continue
        cc = celle(r)
        if vuota and cc and cc[0][0] < SINISTRA and re.match(r'(Abitazione|Assimilazione|Fabbricati|Terreni|Aree|Altri)', cc[0][1]):
            cur = {'sx': [], 'dx': [], 'aliq': [], 'testo': [], 'righe': []}
            voci.append(cur)
        vuota = False
        if cur is None:
            continue
        cur['righe'].append(r.strip())
        # la colonna delle condizioni: dove comincia la seconda cella della prima riga della voce
        if 'mid' not in cur:
            seconde = [c0 for c0, t0 in cc if c0 >= SINISTRA and not PERC.match(t0)]
            cur['mid'] = seconde[0] if seconde else None
        mid = cur['mid']
        if mid:
            # un testo a sinistra attaccato alle condizioni con un solo spazio («…dai fabbricati - Tipo contratto»): si divide
            diviso = []
            for col, t in cc:
                if col < SINISTRA and col + len(t) > mid:
                    tagli = [i for i, ch in enumerate(t) if ch == ' ' and mid - 4 <= col + i <= mid]
                    if tagli:
                        trattini = [i for i in tagli if t[i + 1:i + 3] == '- ']
                        i = trattini[0] if trattini else tagli[-1]
                        diviso += [(col, t[:i]), (col + i + 1, t[i + 1:])]
                        continue
                diviso.append((col, t))
            cc = diviso
        for col, t in cc:
            if PERC.match(t) and num(PERC.match(t).group(1)) <= 1.2:  # l'aliquota IMU più alta è 1,14%: «80%» è una condizione
                cur['aliq'].append(num(PERC.match(t).group(1)))
            elif col < SINISTRA:
                cur['sx'].append(t)
            else:
                cur['dx'].append(t)
            cur['testo'].append(t)

    for v in voci:
        etichetta = ' '.join(v['sx'])
        tutto = ' '.join(v['testo'])
        chiave = next((k for k, pat in BASE_VOCI if re.match(pat.replace('^\\s*', ''), etichetta)), None)
        # le voci fisse vengono prima; una voce con la stessa etichetta che arriva dopo è un'aliquota differenziata
        if chiave and chiave not in out['base'] and (len(v['aliq']) <= 1) and not any(x.startswith('- ') for x in v['dx']):
            if chiave == 'assimilazione_anziani':
                # «SI»/«NO» in fondo alla prima riga, a volte attaccato al testo
                prima = v['righe'][0] if v.get('righe') else tutto
                m = re.search(r'(?:^|\s)(SI|NO)\s*$', prima) or re.search(r'(?:^|\s)(SI|NO)(?:\s|$)', tutto)
                out['base'][chiave] = (m.group(1) == 'SI') if m else None
            elif v['aliq']:
                out['base'][chiave] = v['aliq'][0]
            elif re.search(r'\bEsent', tutto):
                out['base'][chiave] = 'esente'
            else:
                out['base'][chiave] = None
            continue
        if len(v['aliq']) != 1:
            out.setdefault('illeggibili', []).append(tutto[:300])
            continue
        out['diff'].append({'fattispecie': etichetta, **condizioni(v['dx']), 'aliquota': v['aliq'][0]})

    # esenzioni indicate dal Comune
    i0 = next((i for i, r in enumerate(righe) if re.match(r'^\s*Elenco esenzioni', r)), None)
    if i0 is not None:
        lista, cur = [], ''
        for r in righe[i0 + 1:]:
            if re.match(r'^\s*(Precisazioni|Documento generato)', r):
                break
            s = r.strip()
            if not s or re.match(r'^Pagina \d+ di \d+$', s):
                continue
            if s.startswith('- '):
                if cur:
                    lista.append(cur)
                cur = s[2:]
            elif cur:
                cur += ' ' + s
        if cur:
            lista.append(cur)
        out['esenzioni'] = [re.sub(r'\s+', ' ', x).rstrip(';.') for x in lista]
    return out


def condizioni(righe):
    """Le condizioni di un'aliquota differenziata: elenco di frasi e, se ci sono, le categorie catastali."""
    voci, categorie = [], []
    in_categoria = False
    for t in righe:
        trattino = t.startswith('- ')
        s = t[2:].strip() if trattino else t
        mc = CATEGORIA.match(s)
        if trattino and mc and voci and re.search(r'Categori', voci[-1]):
            categorie.append(f'{mc.group(1)}/{mc.group(2)}')
            in_categoria = True
            continue
        if in_categoria and not trattino and re.match(r'[a-z0-9(]', s):
            continue  # seguito della descrizione della categoria («simili (con fine di lucro)»)
        in_categoria = False
        if trattino or not voci or s.endswith(':'):
            voci.append(s)
        else:
            voci[-1] += ' ' + s
    voci = [re.sub(r'\s+', ' ', v).strip() for v in voci]
    if categorie:
        voci = [f"{v} {', '.join(categorie)}" if re.search(r'Categori', v) and v.endswith(':') else v for v in voci]
    out = {'condizioni': voci}
    if categorie:
        out['categorie'] = categorie
    return out


# ---------------- scelta del prospetto efficace ----------------

def gmA(s):
    try:
        return datetime.strptime(s, '%d/%m/%Y').date()
    except ValueError:
        return None


def efficaci(anno):
    """Per ogni Comune (e per ogni ex Comune nelle fusioni) le righe del CSV che valgono per l'anno."""
    with open(os.path.join(DATI, str(anno), 'delibere.csv'), encoding='latin-1', newline='') as f:
        righe = list(csv.DictReader(f, delimiter=';'))
    limite = date(anno, 10, 28)
    per = {}
    for r in righe:
        note = (r.get('NOTE') or '').upper()
        if 'INEFFICACE' in note:
            continue
        pub = gmA(r['DATA_PUBBLICAZIONE'])
        # dopo il 28 ottobre valgono solo le correzioni di errori e gli atti in autotutela (pagina «Regolamenti e aliquote: ricerca»)
        errata = 'ERRATA CORRIGE' in note or 'AUTOTUTELA' in note
        if not pub or (pub > limite and not errata):
            continue
        chiave = (r['CODICE_CATASTALE'].strip().upper(), (r.get('EX_COMUNE') or '').strip())
        per.setdefault(chiave, []).append({**r, '_pub': pub, '_errata': errata})
    scelti = {}
    for k, lista in per.items():
        # l'ultimo pubblicato; a parità, quello con l'ID più alto
        lista.sort(key=lambda r: (r['_pub'], int(re.match(r'\d+', r['FILE_DELIBERA']).group(0)) if re.match(r'\d+', r['FILE_DELIBERA']) else 0))
        scelti[k] = lista[-1]
    return scelti, righe


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '').lower())
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')


def prepara(anni):
    # l'elenco resta completo (anche Trento, Bolzano e Friuli Venezia Giulia: lì la pagina spiega che l'IMU non c'è)
    comuni = json.load(open(os.path.expanduser('~/dati-civici/raccolta/arera-comuni.json'), encoding='utf-8'))['elenco']
    per_cat = {c['catastale']: c for c in comuni}
    prov = {}
    stat = {}
    indice = {}
    for anno in anni:
        cartella = os.path.join(DATI, str(anno))
        scelti, _ = efficaci(anno)
        servono = {r['FILE_DELIBERA'] for r in scelti.values()}
        testi = {}
        for reg in REGIONI:
            z = os.path.join(cartella, f'{reg}.zip')
            if not os.path.exists(z):
                continue
            with zipfile.ZipFile(z) as zf:
                for n in zf.namelist():
                    base = os.path.basename(n)
                    if base in servono:
                        testi[base] = pdf_testo(zf.read(n))
        s = stat.setdefault(anno, {'comuni': 0, 'letti': 0, 'pdf_mancante': 0, 'non_prospetto': 0, 'senza_codice': 0, 'aliquote_vuote': 0, 'differenziate': 0, 'differenziate_non_lette': 0, 'senza_imu_scartati': 0})
        for (cat, ex), r in sorted(scelti.items()):
            if r['PR'] in SENZA_IMU:
                s['senza_imu_scartati'] += 1
                continue
            c = per_cat.get(cat)
            if not c:
                # codice che l'elenco ARERA non ha (Comune nuovo da fusione, o codice aggiornato come Lonato del
                # Garda M312): vale quello del Dipartimento delle Finanze, che è lo stesso da scrivere nell'F24
                s['senza_codice'] += 1
                print('codice catastale aggiunto dal CSV del Dipartimento:', anno, cat, r['COMUNE'], file=sys.stderr)
                omonimo = next((x for x in comuni if x['sigla'] == r['PR'] and norm(x['comune']) == norm(r['COMUNE'])), None)
                c = {'catastale': cat, 'comune': omonimo['comune'] if omonimo else r['COMUNE'].title().replace("'", "'"), 'sigla': r['PR'],
                     'istat': omonimo['istat'] if omonimo else '', 'sostituisce': omonimo['catastale'] if omonimo else None}
                per_cat[cat] = c
                comuni.append(c)
            s['comuni'] += 1
            t = testi.get(r['FILE_DELIBERA'])
            voce = {'pubblicato': r['_pub'].isoformat(), 'file': r['FILE_DELIBERA'], 'delibera': f"n. {r['NUMERO']} del {r['DATA_DELIBERA']}"}
            if ex:
                voce['ex_comune'] = ex.title()
            if r['_errata']:
                voce['errata'] = True
            if t is None:
                s['pdf_mancante'] += 1
                voce['stato'] = 'pdf_mancante'
            else:
                p = leggi_prospetto(t)
                if p is None:
                    s['non_prospetto'] += 1
                    voce['stato'] = 'non_prospetto'
                else:
                    s['letti'] += 1
                    voce.update({'base': p['base'], 'diff': p['diff'], 'esenzioni': p['esenzioni']})
                    if p.get('id'):
                        voce['id'] = p['id']
                    s['differenziate'] += len(p['diff'])
                    if p.get('illeggibili'):
                        voce['non_letti'] = len(p['illeggibili'])
                        s['differenziate_non_lette'] += len(p['illeggibili'])
                    if any(p['base'].get(k) is None for k, _ in BASE_VOCI if k not in ('assimilazione_anziani', 'beni_merce')):
                        s['aliquote_vuote'] += 1
            d = prov.setdefault(c['sigla'], {}).setdefault(cat, {'nome': c['comune'], 'istat': c['istat'], 'anni': {}})
            d['anni'].setdefault(str(anno), []).append(voce)
            indice.setdefault(cat, set()).add(anno)
    return comuni, prov, stat, indice


def scrivi(anni, comuni, prov, stat, indice):
    uscita = os.path.join(REPO, 'imu', 'dati')
    os.makedirs(os.path.join(uscita, 'p'), exist_ok=True)
    oggi = date.today().isoformat()
    letto = {a: open(os.path.join(DATI, str(a), 'letto.txt')).read().strip() for a in anni if os.path.exists(os.path.join(DATI, str(a), 'letto.txt'))}
    for sigla, dati in sorted(prov.items()):
        with open(os.path.join(uscita, 'p', f'{sigla}.json'), 'w', encoding='utf-8') as f:
            json.dump({'sigla': sigla, 'comuni': dati}, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    # un codice vecchio senza dati, sostituito da quello nuovo dello stesso Comune, esce dall'elenco
    vecchi = {c['sostituisce'] for c in comuni if c.get('sostituisce')}
    elenco = [[c['catastale'], c['comune'], c['sigla'], c['istat'], sorted(indice.get(c['catastale'], []))]
              for c in comuni if not (c['catastale'] in vecchi and not indice.get(c['catastale']))]
    elenco.sort(key=lambda x: norm(x[1]))
    with open(os.path.join(uscita, 'indice.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'aggiornato': oggi, 'letto': letto, 'anni': anni,
            'fonte': 'Dipartimento delle Finanze (MEF), prospetti delle aliquote IMU pubblicati ai sensi dell\'art. 1, commi 757 e 767, della legge 160/2019',
            'url': 'https://www.finanze.gov.it/it/fiscalita/fiscalita-regionale-e-locale/Imposta-municipale-propria-IMU/Regolamenti-e-aliquote-ricerca/',
            'ricerca': PAGINA_RICERCA,
            'licenza': 'atti normativi e amministrativi pubblici, esclusi dal diritto d\'autore (art. 5 legge 633/1941)',
            'robots': 'www1.finanze.gov.it senza robots.txt (404), controllato il 15/11/2026',
            'statistiche': stat,
            'comuni': elenco,
        }, f, ensure_ascii=False, separators=(',', ':'))
    print(json.dumps(stat, indent=1))


def main():
    args = sys.argv[1:]
    anni = [2025, 2026]
    if '--anni' in args:
        anni = [int(x) for x in args[args.index('--anni') + 1].split(',')]
    if '--solo-analisi' not in args:
        for a in anni:
            scarica_anno(a, '--aggiorna' in args)
    comuni, prov, stat, indice = prepara(anni)
    scrivi(anni, comuni, prov, stat, indice)


if __name__ == '__main__':
    main()
