#!/usr/bin/env python3
"""Red flag sugli appalti: dai dati aperti ANAC alle schede per stazione appaltante.

Legge i file grezzi scaricati in ~/dati-civici/anac (fuori dal repo, sono gigabyte):
  cig2025_MM.zip       bandi e affidamenti pubblicati nel 2025 (dataset cig-2025)
  aggiudicazioni.zip   aggiudicazioni (FULL)
  aggiudicatari.zip    aggiudicatari (FULL)
  partecipanti.zip     offerenti (FULL)
  varianti.zip         varianti (FULL)
  stazioni.zip         anagrafe delle stazioni appaltanti
e, se c'è, bilancio-comune/dati/comuni.json per riconoscere i Comuni e la loro popolazione.

Scrive in appalti/dati/:
  indice.json          elenco degli enti per la ricerca
  p/<gruppo>.json      le schede, divise per provincia
  confronto.json       i percentili degli enti simili, per capire le soglie

Licenza dei dati ANAC: CC BY-SA 4.0. I dati derivati restano CC BY-SA 4.0.

Uso: python3 -I scripts/appalti-anac.py [--grezzi ~/dati-civici/anac]
"""
import csv
import io
import json
import math
import os
import re
import sys
import zipfile
from collections import defaultdict
from datetime import date

csv.field_size_limit(10**9)

QUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(QUI)
GREZZI = os.path.expanduser(sys.argv[sys.argv.index('--grezzi') + 1] if '--grezzi' in sys.argv else '~/dati-civici/anac')
USCITA = os.path.join(REPO, 'appalti', 'dati')
ANNO = 2025

# Procedure: con bando (chiunque può partecipare), su invito (l'ente sceglie chi invitare), senza gara.
# Codici dal vocabolario ANAC bandi-cig-tipo-scelta-contraente.
CON_BANDO = {'1', '2', '3', '5', '9', '22', '23', '30', '36', '38', '114', '7', '10', '11', '28', '99'}
SU_INVITO = {'4', '6', '15', '34'}
SENZA_GARA = {'24', '27', '18', '12', '37', '40', '32', '8', '13'}
IN_HOUSE = {'25', '26'}  # a società controllate dall'ente: lecito, ma va mostrato a parte
APERTA = {'1', '9'}

# Soglie europee dal 1° gennaio 2026 (Reg. delegato UE 2025/2152): sopra queste il termine minimo
# per le offerte nella procedura aperta è 30 giorni (d.lgs. 36/2023, art. 71). Sotto soglia la legge
# lascia più margine, quindi lì l'indicatore non si calcola.
SOGLIA_UE = {'LAVORI': 5404000, 'SERVIZI': 216000, 'FORNITURE': 216000}

# Soglie dell'affidamento diretto (d.lgs. 36/2023, art. 50, c. 1, lett. a e b).
SOGLIA = {'LAVORI': 150000, 'SERVIZI': 140000, 'FORNITURE': 140000}
VICINO_SOGLIA = 0.95  # «appena sotto»: dal 95% della soglia in su

MINIMO_BASE = 5  # sotto questo numero di casi un indicatore non si calcola
RUOLI_NON_OFFERENTI = ('MANDANTE', 'AUSILIARIA', 'CONSORZIAT', 'PROGETTISTA')


def leggi(nome_zip):
    """Righe di tutti i CSV dentro uno zip, come dizionari."""
    with zipfile.ZipFile(os.path.join(GREZZI, nome_zip)) as z:
        for nome in z.namelist():
            if not nome.lower().endswith('.csv'):
                continue
            with z.open(nome) as f:
                testo = io.TextIOWrapper(f, encoding='utf-8-sig', errors='replace', newline='')
                for riga in csv.DictReader(testo, delimiter=';'):
                    yield riga


def num(s):
    try:
        v = float(str(s).replace(',', '.'))
        return v if math.isfinite(v) else None
    except (TypeError, ValueError):
        return None


def giorno(s):
    s = (s or '')[:10]
    try:
        return date.fromisoformat(s)
    except ValueError:
        return None


def nome_procedura(t):
    t = (t or '').strip()
    if not t or t.upper().startswith('ND') or t.upper() == 'NON CLASSIFICATO':
        return 'Procedura non indicata'
    return t.capitalize()


def persona_fisica(cf):
    """Un codice fiscale di 16 caratteri è di una persona: il nome non si pubblica."""
    return bool(re.fullmatch(r'[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]', (cf or '').strip().upper()))


def nome_fornitore(cf, denominazione):
    if persona_fisica(cf):
        return 'Persona fisica (professionista o ditta individuale)'
    return re.sub(r'\s+', ' ', (denominazione or '').strip()) or 'Fornitore senza nome'


def ripara(t):
    """Testi passati due volte per la codifica sbagliata («Ã¨» al posto di «è»)."""
    for _ in range(2):
        if not re.search('[ÃÂâ][\x80-\xbf€™œ¢]', t):
            break
        try:
            t = t.encode('cp1252').decode('utf-8')
        except UnicodeError:
            break
    return re.sub('[ÃÂãâ¢€™]{2,}', "'", t)


def corto(t, n=110):
    t = ripara(re.sub(r'\s+', ' ', (t or '').strip()))
    return t if len(t) <= n else t[: n - 1].rstrip() + '…'


def percentile(valori, x):
    """Quota degli enti simili con un valore minore o uguale a x (0-100)."""
    if not valori:
        return None
    sotto = sum(1 for v in valori if v <= x)
    return round(100 * sotto / len(valori))


def fascia(pop):
    if pop is None:
        return None
    for limite, nome in ((2000, 'meno di 2.000 abitanti'), (5000, 'da 2.000 a 5.000 abitanti'), (20000, 'da 5.000 a 20.000 abitanti'),
                         (60000, 'da 20.000 a 60.000 abitanti')):
        if pop < limite:
            return nome
    return 'oltre 60.000 abitanti'


def main():
    os.makedirs(os.path.join(USCITA, 'p'), exist_ok=True)

    # Comuni riconosciuti dal bilancio (codice fiscale → ISTAT, popolazione)
    comuni = {}
    p_comuni = os.path.join(REPO, 'bilancio-comune', 'dati', 'comuni.json')
    if os.path.exists(p_comuni):
        for c in json.load(open(p_comuni, encoding='utf-8'))['comuni']:
            if c.get('cf'):
                comuni[c['cf']] = c

    # 1. Bandi e affidamenti del 2025
    lotti = {}
    for m in range(1, 13):
        nome = f'cig{ANNO}_{m:02d}.zip'
        if not os.path.exists(os.path.join(GREZZI, nome)):
            print('manca', nome, file=sys.stderr)
            continue
        for r in leggi(nome):
            cig = r['cig']
            if r.get('flag_prevalente') not in ('1', '1.0', '') and cig in lotti:
                continue
            if (r.get('stato') or '').upper().startswith('CANCELL'):
                continue
            if r.get('settore', '').upper().startswith('SETTORI SPECIALI'):
                pass  # inclusi: i settori speciali hanno regole proprie, ma sono comunque appalti pubblici
            cod = (r.get('cod_tipo_scelta_contraente') or '').split('.')[0]
            lotti[cig] = [
                r.get('cf_amministrazione_appaltante', '').strip().upper(),  # 0 ente
                corto(r.get('oggetto_lotto') or r.get('oggetto_gara')),       # 1 oggetto
                num(r.get('importo_lotto')) or 0.0,                           # 2 importo a base
                (r.get('oggetto_principale_contratto') or '').upper(),        # 3 tipo
                cod,                                                          # 4 procedura
                r.get('data_pubblicazione', '')[:10],                         # 5
                r.get('data_scadenza_offerta', '')[:10],                      # 6
                (r.get('FLAG_URGENZA') or '').split('.')[0] == '1',           # 7 urgenza
                (r.get('CF_SA_DELEGANTE') or '').strip().upper(),             # 8 delegante
                r.get('denominazione_amministrazione_appaltante', ''),        # 9
                None, None, None, None, None, None, None,                     # 10-16 aggiudicazione
                None,                                                         # 17 fornitore (cf, nome)
                False,                                                        # 18 varianti
                nome_procedura(r.get('tipo_scelta_contraente')),               # 19 nome procedura
            ]
        print(nome, len(lotti), file=sys.stderr)

    # 2. Aggiudicazioni: tengo l'ultima per CIG
    for r in leggi('aggiudicazioni.zip'):
        L = lotti.get(r.get('cig'))
        if L is None or (r.get('cod_esito') or '').split('.')[0] != '1':  # solo le gare davvero aggiudicate
            continue
        d = r.get('data_aggiudicazione_definitiva', '')[:10]
        if L[10] is not None and (L[16] or '') > d:
            continue
        L[10] = r.get('id_aggiudicazione')
        L[11] = num(r.get('importo_aggiudicazione'))
        rib = num(r.get('ribasso_aggiudicazione'))
        L[12] = rib if rib is not None and 0 <= rib <= 100 else None
        L[13] = num(r.get('num_imprese_offerenti'))
        L[14] = num(r.get('numero_offerte_ammesse'))
        L[15] = num(r.get('numero_offerte_escluse'))
        L[16] = d
    print('aggiudicazioni lette', file=sys.stderr)

    # 3. Aggiudicatari dell'aggiudicazione tenuta: la capogruppo o l'impresa singola
    for r in leggi('aggiudicatari.zip'):
        L = lotti.get(r.get('cig'))
        if L is None or (L[10] and r.get('id_aggiudicazione') and r['id_aggiudicazione'] != L[10]):
            continue
        ruolo = (r.get('ruolo') or '').upper()
        if any(x in ruolo for x in RUOLI_NON_OFFERENTI):
            continue
        if L[17] is None or 'MANDATARIA' in ruolo:
            cf = (r.get('codice_fiscale') or '').strip().upper()
            L[17] = (cf, nome_fornitore(cf, r.get('denominazione')))
    print('aggiudicatari letti', file=sys.stderr)

    # 4. Offerenti, solo dove ANAC non dà il numero
    serve = {c for c, L in lotti.items() if L[13] is None and (L[4] in CON_BANDO or L[4] in SU_INVITO)}
    offerenti = defaultdict(set)
    if os.path.exists(os.path.join(GREZZI, 'partecipanti.zip')):
        for r in leggi('partecipanti.zip'):
            c = r.get('cig')
            if c not in serve:
                continue
            ruolo = (r.get('ruolo') or '').upper()
            if any(x in ruolo for x in RUOLI_NON_OFFERENTI):
                continue
            offerenti[c].add((r.get('codice_fiscale') or '').strip().upper())
        for c, s in offerenti.items():
            lotti[c][13] = float(len(s))
    print('partecipanti letti', len(offerenti), file=sys.stderr)

    # 5. Varianti
    for r in leggi('varianti.zip'):
        L = lotti.get(r.get('cig'))
        if L is not None:
            L[18] = True

    # 6. Anagrafe delle stazioni appaltanti
    anagrafe = {}
    for r in leggi('stazioni.zip'):
        cf = (r.get('codice_fiscale') or '').strip().upper()
        if cf:
            anagrafe[cf] = r

    # 7. Indicatori per ente
    per_ente = defaultdict(list)
    per_conto = defaultdict(lambda: [0, 0.0])
    for cig, L in lotti.items():
        if L[0]:
            per_ente[L[0]].append((cig, L))
        if L[8] and L[8] != L[0]:
            per_conto[L[8]][0] += 1
            per_conto[L[8]][1] += L[2]

    schede = {}
    for cf, righe in per_ente.items():
        if len(righe) < 5:
            continue
        a = anagrafe.get(cf, {})
        com = comuni.get(cf)
        s = {
            'cf': cf,
            'nome': titolo(com['nome'] if com else a.get('denominazione') or righe[0][1][9]),
            'comune': titolo(a.get('citta_nome') or (com or {}).get('nome', '')),
            'prov': (a.get('provincia_codice') or '').replace('IT-', '') or (com or {}).get('sigla', ''),
            'natura': (a.get('natura_giuridica_descrizione') or '').capitalize(),
            'gruppo': ('Comuni ' + fascia(com['pop'])) if com and com.get('pop') else ('Comuni' if com else (a.get('natura_giuridica_descrizione') or 'Altri enti').capitalize()),
            'istat': (com or {}).get('istat'),
            'pop': (com or {}).get('pop'),
            'n': len(righe),
            'v': round(sum(L[2] for _, L in righe)),
        }
        proc = {'con_bando': [0, 0.0], 'su_invito': [0, 0.0], 'senza_gara': [0, 0.0], 'in_house': [0, 0.0], 'altro': [0, 0.0]}
        for _, L in righe:
            k = 'con_bando' if L[4] in CON_BANDO else 'su_invito' if L[4] in SU_INVITO else 'senza_gara' if L[4] in SENZA_GARA else 'in_house' if L[4] in IN_HOUSE else 'altro'
            proc[k][0] += 1
            proc[k][1] += L[2]
        s['proc'] = {k: [n, round(v)] for k, (n, v) in proc.items()}
        ind, esempi = {}, {}

        # R013 · senza gara, per valore
        if s['v'] > 0 and s['n'] >= MINIMO_BASE:
            ind['senza_gara'] = {'base': s['n'], 'n': proc['senza_gara'][0], 'quota': round(100 * proc['senza_gara'][1] / s['v'], 1),
                                 'quota_n': round(100 * proc['senza_gara'][0] / s['n'], 1)}

        # R018 · un solo offerente nelle gare con bando o su invito
        gare = [(c, L) for c, L in righe if (L[4] in CON_BANDO or L[4] in SU_INVITO) and L[13] is not None and L[13] >= 1]
        uno = [(c, L) for c, L in gare if L[13] == 1]
        if len(gare) >= MINIMO_BASE:
            ind['un_offerente'] = {'base': len(gare), 'n': len(uno), 'quota': round(100 * len(uno) / len(gare), 1)}
        esempi['un_offerente'] = lotto_breve(sorted(uno, key=lambda x: -x[1][2])[:6])

        # R003 · tempi sotto il minimo di legge nelle procedure aperte
        aperte, brevi = [], []
        for c, L in righe:
            if L[4] not in APERTA or L[2] < SOGLIA_UE.get(L[3], 10**12):
                continue
            p, sc = giorno(L[5]), giorno(L[6])
            if not p or not sc or sc <= p:
                continue
            gg = (sc - p).days
            aperte.append(gg)
            if gg < (15 if L[7] else 30):
                brevi.append((c, L, gg))
        if aperte:
            ind['tempi_brevi'] = {'base': len(aperte), 'n': len(brevi), 'quota': round(100 * len(brevi) / len(aperte), 1),
                                  'mediana_giorni': sorted(aperte)[len(aperte) // 2]}
        esempi['tempi_brevi'] = lotto_breve([(c, L) for c, L, _ in sorted(brevi, key=lambda x: -x[1][2])[:6]], giorni={c: g for c, _, g in brevi})

        # R040 · concentrazione sul primo fornitore (valore aggiudicato)
        forn = defaultdict(lambda: [0, 0.0, ''])
        for c, L in righe:
            if L[17] and L[17][0]:
                imp = L[11] if L[11] is not None and L[11] > 0 else L[2]
                f = forn[L[17][0]]
                f[0] += 1
                f[1] += imp
                f[2] = L[17][1]
        tot_forn = sum(f[1] for f in forn.values())
        if tot_forn > 0 and sum(f[0] for f in forn.values()) >= MINIMO_BASE:
            top = sorted(forn.values(), key=lambda f: -f[1])
            quote = [f[1] / tot_forn for f in top]
            ind['primo_fornitore'] = {'base': sum(f[0] for f in top), 'fornitori': len(top), 'quota': round(100 * quote[0], 1),
                                      'hhi': round(10000 * sum(q * q for q in quote))}
            s['fornitori'] = [{'nome': f[2], 'n': f[0], 'v': round(f[1]), 'quota': round(100 * f[1] / tot_forn, 1)} for f in top[:8]]

        # R011 · affidamenti diretti appena sotto la soglia
        diretti = [(c, L) for c, L in righe if L[4] in SENZA_GARA and L[3] in SOGLIA]
        vicini = [(c, L) for c, L in diretti if VICINO_SOGLIA * SOGLIA[L[3]] <= L[2] < SOGLIA[L[3]]]
        if len(diretti) >= MINIMO_BASE:
            ind['sotto_soglia'] = {'base': len(diretti), 'n': len(vicini), 'quota': round(100 * len(vicini) / len(diretti), 1)}
        esempi['sotto_soglia'] = lotto_breve(sorted(vicini, key=lambda x: -x[1][2])[:6])

        # R055 · stesso fornitore, più affidamenti diretti che insieme superano la soglia
        cumuli = defaultdict(list)
        for c, L in diretti:
            if L[17] and L[17][0] and L[2] < SOGLIA[L[3]]:
                cumuli[(L[17][0], 'LAVORI' if L[3] == 'LAVORI' else 'SF')].append((c, L))
        oltre = []
        for (fcf, tipo), lista in cumuli.items():
            somma = sum(L[2] for _, L in lista)
            soglia = SOGLIA['LAVORI'] if tipo == 'LAVORI' else SOGLIA['SERVIZI']
            if len(lista) >= 2 and somma >= soglia:
                oltre.append({'fornitore': lista[0][1][17][1], 'n': len(lista), 'v': round(somma), 'soglia': soglia,
                              'tipo': 'lavori' if tipo == 'LAVORI' else 'servizi e forniture'})
        if len(diretti) >= MINIMO_BASE:
            ind['cumulo'] = {'base': len({k for k in cumuli}), 'n': len(oltre)}
        esempi['cumulo'] = sorted(oltre, key=lambda x: -x['v'])[:6]

        # R035 · una sola offerta ammessa e almeno una esclusa
        con_ammesse = [(c, L) for c, L in gare if L[14] is not None and L[15] is not None and L[14] + L[15] >= 2]
        esclusi = [(c, L) for c, L in con_ammesse if L[14] == 1 and L[15] >= 1]
        if len(con_ammesse) >= MINIMO_BASE:
            ind['esclusi'] = {'base': len(con_ammesse), 'n': len(esclusi), 'quota': round(100 * len(esclusi) / len(con_ammesse), 1)}
        esempi['esclusi'] = lotto_breve(sorted(esclusi, key=lambda x: -x[1][2])[:6])

        s['ind'] = ind
        s['esempi'] = {k: v for k, v in esempi.items() if v}
        pc = per_conto.get(cf)
        if pc:
            s['per_conto'] = [pc[0], round(pc[1])]
        s['piu_grandi'] = lotto_breve(sorted(righe, key=lambda x: -x[1][2])[:5])
        schede[cf] = s

    # 8. Confronto con gli enti simili: percentile di ogni indicatore nel gruppo
    gruppi = defaultdict(lambda: defaultdict(list))
    for s in schede.values():
        for k, v in s['ind'].items():
            if k in ('cumulo',):
                continue
            gruppi[s['gruppo']][k].append(v['quota'] if k != 'primo_fornitore' else v['quota'])
    confronto = {}
    for g, per_ind in gruppi.items():
        confronto[g] = {}
        for k, vals in per_ind.items():
            vals.sort()
            if len(vals) >= 20:
                confronto[g][k] = {'enti': len(vals), 'mediana': vals[len(vals) // 2], 'p75': vals[int(len(vals) * 0.75)], 'p90': vals[int(len(vals) * 0.9)]}
    for s in schede.values():
        for k, v in s['ind'].items():
            vals = gruppi[s['gruppo']].get(k)
            if k != 'cumulo' and vals and len(vals) >= 20:
                v['pct'] = percentile(vals, v['quota'])
                v['mediana'] = confronto[s['gruppo']][k]['mediana']

    # 9. Scrittura: indice e schede per provincia
    per_prov = defaultdict(dict)
    indice = []
    for cf, s in schede.items():
        g = (s['prov'] or 'XX').upper()
        if not re.fullmatch(r'[A-Z]{2}', g):
            g = 'XX'
        per_prov[g][cf] = s
        indice.append([s['nome'], cf, s['comune'], s['prov'], g, s['n'], 1 if s.get('istat') else 0])
    indice.sort(key=lambda x: (-x[6], x[0]))
    meta = {
        'anno': ANNO,
        'aggiornato': date.today().isoformat(),
        'fonte': 'ANAC, Banca dati nazionale dei contratti pubblici, dati aperti (CC BY-SA 4.0): cig-2025, aggiudicazioni, aggiudicatari, partecipanti, varianti, stazioni appaltanti',
        'licenza': 'CC BY-SA 4.0',
        'lotti': len(lotti),
        'enti': len(schede),
    }
    scrivi('indice.json', {**meta, 'colonne': ['nome', 'cf', 'comune', 'prov', 'file', 'lotti', 'comune_bdap'], 'enti': indice})
    scrivi('confronto.json', {**meta, 'gruppi': confronto})
    for g, d in per_prov.items():
        scrivi(os.path.join('p', g + '.json'), d)
    print(f"{len(lotti)} lotti, {len(schede)} enti, {len(per_prov)} file", file=sys.stderr)


def titolo(t):
    t = re.sub(r'\s+', ' ', (t or '').strip())
    if t.isupper():
        piccole = {'di', 'del', 'della', 'dei', 'degli', 'delle', 'e', 'in', 'per', 'al', 'alla', 'a', 'da', 'sul', 'sulla', 'dello', "d'", 'con'}
        parole = t.lower().split(' ')
        t = ' '.join(p if (i and p in piccole) else p[:1].upper() + p[1:] for i, p in enumerate(parole))
        t = re.sub(r"([A-Za-z]')([a-z])", lambda m: m.group(1) + m.group(2).upper(), t)
    return t


def lotto_breve(lista, giorni=None):
    out = []
    for c, L in lista:
        x = {'cig': c, 'oggetto': L[1], 'importo': round(L[2]), 'tipo': L[3].lower(), 'procedura': L[19], 'data': L[5]}
        if L[13] is not None:
            x['offerenti'] = int(L[13])
        if L[11] is not None:
            x['aggiudicato'] = round(L[11])
        if L[17]:
            x['fornitore'] = L[17][1]
        if giorni and c in giorni:
            x['giorni'] = giorni[c]
        out.append(x)
    return out


def scrivi(rel, dati):
    with open(os.path.join(USCITA, rel), 'w', encoding='utf-8') as f:
        json.dump(dati, f, ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    main()
