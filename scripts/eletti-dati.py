#!/usr/bin/env python3
"""I dati di «Chi ti rappresenta»: per ogni Comune chi lo amministra e chi lo rappresenta a ogni livello.

Fonti (tutte ufficiali e aperte; i file grezzi stanno in ~/dati-civici/eletti, fuori dal repository):
- Ministero dell'Interno, DAIT, Anagrafe degli amministratori locali e regionali in carica (CSV per livello:
  ammcom, ammprov, ammmetropolitani, ammreg, organistraordinariincarica):
  https://dait.interno.gov.it/elezioni/open-data/amministratori-locali-in-carica
- Ministero dell'Interno, Eligendo: Comuni per collegio uninominale e plurinominale di Camera e Senato
  (d.lgs. 177/2020): elenco-collegi-comuni-camera.csv, elenco-collegi-comuni-senato.csv;
  elezioni europee del 9/6/2024 (candidati e seggi per circoscrizione): europee-20240609.zip
- Camera dei deputati, dati.camera.it (SPARQL), deputati in carica della XIX legislatura, CC BY 4.0
- Senato della Repubblica, dati aperti (dump «composizione» della XIX legislatura pubblicato sul repository
  ufficiale github.com/SenatoDellaRepubblica/OpenData; dati.senato.it non rispondeva il 15/11/2026), CC BY 3.0 IT
- Parlamento europeo, data.europarl.europa.eu (API v2), eurodeputati in carica eletti in Italia
- IndicePA (copia in chiedo-gli-atti/src/dati/enti.js, CC BY 4.0) per PEC e siti degli enti
- Elenco dei Comuni con codice ISTAT: ~/dati-civici/raccolta/arera-comuni.json

Si scrivono SOLO: nome, carica, incarico, date, link ufficiali (lista e gruppo no, per neutralità: scelta del 15/11/2026). Niente data e luogo di nascita,
titolo di studio, professione (presenti nella fonte ma non servono: si usano solo per distinguere gli omonimi).

Scrive eletti/dati/comuni.json, eletti/dati/nazionale.json, eletti/dati/p/<SIGLA>.json.
Uso:
  python3 -I scripts/eletti-dati.py            # usa i file già scaricati
  python3 -I scripts/eletti-dati.py --scarica  # riscarica tutto (una richiesta per volta, pausa di 2 secondi)
"""
import collections
import csv
import io
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GREZZI = os.path.expanduser('~/dati-civici/eletti')
USCITA = os.path.join(REPO, 'eletti', 'dati')
UA = 'PolpoCivico/1.0 (strumenti civici)'
SCARICA = '--scarica' in sys.argv

DAIT = 'https://dait.interno.gov.it/documenti/'
FILE_DAIT = ['ammcom', 'ammprov', 'ammmetropolitani', 'ammreg', 'organistraordinariincarica']
ELIGENDO = 'https://dait.interno.gov.it/documenti/opendata/'
SENATO_DUMP = 'https://raw.githubusercontent.com/SenatoDellaRepubblica/OpenData/main/Leg19/dump-composizione-19.zip'
EP_API = 'https://data.europarl.europa.eu/api/v2/'

REGIONI = {'01': 'Piemonte', '02': "Valle d'Aosta", '03': 'Lombardia', '04': 'Trentino-Alto Adige', '05': 'Veneto',
           '06': 'Friuli-Venezia Giulia', '07': 'Liguria', '08': 'Emilia-Romagna', '09': 'Toscana', '10': 'Umbria',
           '11': 'Marche', '12': 'Lazio', '13': 'Abruzzo', '14': 'Molise', '15': 'Campania', '16': 'Puglia',
           '17': 'Basilicata', '18': 'Calabria', '19': 'Sicilia', '20': 'Sardegna'}
SPECIALI = {'02', '04', '06', '19', '20'}  # Regioni a statuto speciale (Costituzione, art. 116)

# Nomi degli enti regionali come sono scritti in IndicePA (Giunta / Consiglio). Dove il Consiglio non c'è
# nella copia di IndicePA, resta vuoto: la pagina lo dice.
IPA_REGIONE = {
    '01': ('Regione Piemonte', 'Consiglio Regionale del Piemonte'),
    '02': ("Regione Autonoma Valle D'Aosta", "Consiglio Regionale della Valle D'Aosta"),
    '03': ('Regione Lombardia', 'Consiglio Regionale della Lombardia'),
    '04': ('Regione Autonoma Trentino-Alto Adige/Suedtirol', 'Consiglio Regionale della Regione Autonoma Trentino Alto - Adige Sudtirol'),
    '05': ('Regione del Veneto', 'Consiglio Regionale del Veneto'),
    '06': ('Regione Autonoma Friuli-Venezia Giulia', 'Consiglio Regionale Friuli Venezia Giulia'),
    '07': ('Regione Liguria', 'Consiglio Regionale della Liguria'),
    '08': ('Regione Emilia-Romagna', ''),
    '09': ('Regione Toscana', ''),
    '10': ('Regione Umbria', 'Assemblea Legislativa - Regione Umbria'),
    '11': ('Regione Marche', 'Assemblea Legislativa delle Marche'),
    '12': ('Regione Lazio', ''),
    '13': ('Regione Abruzzo', "Consiglio Regionale dell'Abruzzo"),
    '14': ('Regione Molise', 'Consiglio Regionale del Molise'),
    '15': ('Regione Campania', 'Consiglio Regionale della Campania'),
    '16': ('Regione Puglia', 'Consiglio Regionale della Puglia'),
    '17': ('Regione Basilicata', 'Consiglio Regionale Basilicata'),
    '18': ('Regione Calabria', 'Consiglio regionale della Calabria'),
    '19': ('Regione Siciliana', 'Assemblea Regionale Siciliana'),
    '20': ('Regione Autonoma della Sardegna', 'Consiglio Regionale della Sardegna'),
}
IPA_PROVINCIA_AUTONOMA = {'TN': ('Provincia Autonoma di Trento', 'Consiglio della Provincia Autonoma di Trento'),
                          'BZ': ('Provincia Autonoma di Bolzano', 'Consiglio della Provincia Autonoma di Bolzano')}


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '').lower().replace('ß', 'ss'))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', s)).strip()


# Nomi scritti diversamente nelle fonti del Ministero e nell'elenco ISTAT (verificati a mano il 15/11/2026).
ALIAS = {'mojo alcantara': 'moio alcantara', 'montagna sulla strada del vino': 'montagna', 'vallecrosia al mare': 'vallecrosia',
         'murisengo': 'murisengo monferrato', 'tripi': 'tripi abakainon'}


def nome_comune(s):
    """Chiave di confronto dei nomi dei Comuni: «Bolzano/Bozen» e «BOLZANO» coincidono, l'accento finale scritto
    come apostrofo («AGLIE'») pure."""
    s = norm(str(s or '').split('/')[0].replace('_', ' '))
    return ALIAS.get(s, s)


def scarica(url, file, accetta=None):
    percorso = os.path.join(GREZZI, file)
    if os.path.exists(percorso) and not SCARICA:
        return percorso
    os.makedirs(os.path.dirname(percorso), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': UA, **({'Accept': accetta} if accetta else {})})
    with urllib.request.urlopen(req, timeout=600) as r, open(percorso + '.tmp', 'wb') as f:
        while True:
            pezzo = r.read(1 << 20)
            if not pezzo:
                break
            f.write(pezzo)
    os.replace(percorso + '.tmp', percorso)
    time.sleep(2)
    print('scaricato', url, file=sys.stderr)
    return percorso


def data_iso(s):
    m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', s or '')
    if m:
        return f'{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}'
    m = re.match(r'(\d{4})-?(\d{2})-?(\d{2})', s or '')
    return f'{m.group(1)}-{m.group(2)}-{m.group(3)}' if m else ''


PARTICELLE = {'di', 'de', 'del', 'della', 'dei', 'delle', 'da', 'dal', 'dalla', 'lo', 'la', 'le', 'li', 'van', 'von', 'der'}


def bel_nome(s):
    """«LO RUSSO STEFANO» → «Lo Russo Stefano», «D'ANGELO» → «D'Angelo»: stesso formato per tutti."""
    def parola(p):
        p = p.lower()
        return re.sub(r"(^|[-'’])([a-zà-ÿ])", lambda m: m.group(1) + m.group(2).upper(), p)
    return ' '.join(parola(p) for p in str(s or '').split())


def leggi_dait(nome):
    righe = list(csv.reader(open(os.path.join(GREZZI, f'{nome}.csv'), encoding='utf-8', errors='replace'), delimiter=';'))
    agg = re.search(r'(\d{2}/\d{2}/\d{4})', ' '.join(righe[1]))
    testa = righe[2]
    return [dict(zip(testa, r)) for r in righe[3:] if len(r) >= len(testa) - 2], data_iso(agg.group(1)) if agg else ''


LISTA_VUOTA = re.compile(r'^\s*-?\s*lista non pervenuta\s*-?\s*$', re.I)


def persona(r):
    """[nome, carica, incarico, data elezione, data entrata in carica, lista]: solo i campi pubblici dell'incarico."""
    lista = (r.get('lista_appartenenza/collegamento') or '').strip()
    if LISTA_VUOTA.match(lista):
        lista = ''
    return [bel_nome(f"{r.get('cognome', '')} {r.get('nome', '')}"), (r.get('descrizione_carica') or '').strip(),
            (r.get('incarico') or '').strip(), data_iso(r.get('data_elezione')), data_iso(r.get('data_entrata_in_carica')), '']  # lista e gruppo non si pubblicano (scelta di neutralità, 15/11/2026)


# Ordine di presentazione: per carica, poi per cognome. Mai per lista o partito.
PESO_CARICA = [
    (r'^sindaco|^presidente della (regione|provincia)|^commissari|^commissione straordinaria', 0),
    (r'^sub commissario', 1),
    (r'^vicesindaco', 2),
    (r'^assessore', 3),
    (r'^consigliere', 5),
]


def peso(p):
    carica, incarico = p[1].lower(), p[2].lower()
    for rx, w in PESO_CARICA:
        if re.search(rx, carica):
            base = w
            break
    else:
        base = 4
    if base == 3 and incarico.startswith('vice'):
        base = 2.5
    if base == 5 and incarico.startswith('presidente del consiglio'):
        base = 4.5
    return (base, norm(p[0]))


def distingui_omonimi(persone, righe):
    """Se nello stesso ente ci sono due persone con lo stesso nome, si aggiunge l'anno di nascita (solo allora)."""
    nascite = collections.defaultdict(set)  # la stessa persona può comparire due volte (assessore e consigliere)
    for p, r in zip(persone, righe):
        nascite[p[0]].add(r.get('data_nascita') or '')
    for p, r in zip(persone, righe):
        if len(nascite[p[0]]) > 1 and r.get('data_nascita'):
            p[0] += f" (nato/a nel {r['data_nascita'][-4:]})"
    return persone


def ordina(coppie):
    coppie = sorted(coppie, key=lambda c: peso(c[0]))
    persone = distingui_omonimi([c[0] for c in coppie], [c[1] for c in coppie])
    return persone


# ---------------------------------------------------------------- IndicePA

def carica_ipa():
    s = open(os.path.join(REPO, 'chiedo-gli-atti', 'src', 'dati', 'enti.js'), encoding='utf-8').read()
    ipa = json.loads(s[s.index('{'):s.rindex('}') + 1])
    per_nome = {}
    comuni = {}
    for nome, cat, comune, prov, pec, sito, _ in ipa['enti']:
        per_nome[norm(nome)] = (pec, sito, nome, prov)
        if cat == 'L6' and norm(nome).startswith('comune'):
            comuni[(nome_comune(comune), prov)] = (pec, sito)
    return ipa, per_nome, comuni


def sito(s):
    return '' if not s else (s if s.startswith('http') else f'https://{s}')


def nucleo_provincia(s):
    s = nome_comune(s)
    s = re.sub(r'^(provincia autonoma|provincia|citta metropolitana|libero consorzio comunale)( (di|del|dell|della|dello))? ', '', s)
    s = re.sub(r'^(l |la )', '', s)
    return s.replace('caltanisetta', 'caltanissetta').replace('forli cesena', 'forli cesena')


# ---------------------------------------------------------------- Camera

SPARQL_CAMERA = '''PREFIX ocd: <http://dati.camera.it/ocd/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?d ?cognome ?nome ?inizio ?collegio ?uninominale ?tipo ?lista ?dataEl ?scheda ?gruppo WHERE {
?d a ocd:deputato; ocd:rif_leg <http://dati.camera.it/ocd/legislatura.rdf/repubblica_19>; foaf:surname ?cognome; foaf:firstName ?nome; ocd:rif_mandatoCamera ?m.
?m ocd:startDate ?inizio. FILTER NOT EXISTS { ?m ocd:endDate ?fine }
?m ocd:rif_elezione ?e. OPTIONAL { ?e dc:coverage ?collegio } OPTIONAL { ?e dct:spatial ?uninominale } OPTIONAL { ?e ocd:tipoElezione ?tipo }
OPTIONAL { ?e ocd:lista ?lista } OPTIONAL { ?e dc:date ?dataEl }
OPTIONAL { ?d dct:isReferencedBy ?scheda }
OPTIONAL { ?d ocd:aderisce ?a. ?a ocd:rif_gruppoParlamentare ?g. ?g rdfs:label ?gruppo. FILTER NOT EXISTS { ?a ocd:endDate ?gf } }
}'''


def chiave_collegio(s):
    """«TRENTINO-ALTO ADIGE/SÜDTIROL - U01 (TRENTO)» e «TRENTINO-ALTO ADIGE - U01» hanno la stessa chiave."""
    s = norm(str(s or '').split(' (')[0]).replace('sudtirol', '').replace('  ', ' ')
    return re.sub(r'\s+', ' ', s).strip()


def camera():
    url = 'https://dati.camera.it/sparql?' + urllib.parse.urlencode({'query': SPARQL_CAMERA})
    f = scarica(url, 'camera-deputati-in-carica.csv', 'text/csv')
    deputati = {}
    for r in csv.DictReader(open(f, encoding='utf-8')):
        dep = deputati.setdefault(r['d'], {
            'nome': bel_nome(f"{r['cognome']} {r['nome']}"),
            'tipo': 'uninominale' if r['tipo'].startswith('maggioritario') else 'proporzionale' if r['tipo'] == 'proporzionale' else r['tipo'],
            'collegio': (r['uninominale'] if r['tipo'].startswith('maggioritario') else r['collegio']).strip(),
            'plurinominale': r['collegio'].strip(),
            'suppletiva': 'suppletiva' in r['tipo'],
            'lista': '',
            'gruppo': '',
            'elezione': data_iso(r['dataEl']),
            'inizio': data_iso(r['inizio']),
            'scheda': r['scheda'].replace('http://', 'https://'),
        })
        # il gruppo parlamentare non si pubblica (scelta di neutralità)
    return sorted(deputati.values(), key=lambda d: norm(d['nome']))


# ---------------------------------------------------------------- Senato

RDF = '{http://www.w3.org/1999/02/22-rdf-syntax-ns#}'


def senato():
    z = scarica(SENATO_DUMP, 'senato-dump/dump-composizione-19.zip')
    with zipfile.ZipFile(z) as zz:
        nome = [n for n in zz.namelist() if n.endswith('.rdf')][0]
        radice = ET.parse(zz.open(nome)).getroot()
    res = collections.defaultdict(dict)
    for d in radice:
        chi = d.get(RDF + 'about') or ('_:' + (d.get(RDF + 'nodeID') or ''))
        for c in d:
            k = c.tag.split('}')[1]
            v = c.text.strip() if c.text and c.text.strip() else (c.get(RDF + 'resource') or ('_:' + c.get(RDF + 'nodeID', '')))
            res[chi].setdefault(k, []).append(v)
    gruppi = {}
    for chi, v in res.items():
        if chi.startswith('http://dati.senato.it/gruppo/'):
            nomi = [res[n] for n in v.get('denominazione', [])]
            attuale = [n for n in nomi if 'fine' not in n] or nomi
            if attuale:
                gruppi[chi] = attuale[-1].get('titolo', [''])[0]
    senatori = []
    for chi, v in res.items():
        if not chi.startswith('http://dati.senato.it/senatore/') or 'lastName' not in v:
            continue
        m19 = [res[m] for m in v.get('mandato', []) if '/mandato/S_19_' in m]
        m19 = [m for m in m19 if 'fine' not in m]
        if not m19:
            continue
        m = m19[0]
        adesioni = [res[a] for a in v.get('aderisce', [])]
        adesioni = [a for a in adesioni if a.get('legislatura') == ['19'] and 'fine' not in a]
        tipo_el = (m.get('tipoElezione') or [''])[0].lower()
        tipo_m = (m.get('tipoMandato') or [''])[0]
        ident = chi.rsplit('/', 1)[1]
        senatori.append({
            'nome': bel_nome(f"{v['lastName'][0]} {v['firstName'][0]}"),
            'tipo': 'uninominale' if 'uninominale' in tipo_el else 'proporzionale' if 'proporzionale' in tipo_el else ('estero' if 'estere' in tipo_el else 'a vita' if 'vita' in tipo_m else tipo_el),
            'mandato': tipo_m,
            'collegio': (m.get('collegioElezione') or [''])[0],
            'regione': (m.get('regioneElezione') or [''])[0],
            'gruppo': '',
            'inizio': (m.get('inizio') or [''])[0],
            'scheda': f'https://www.senato.it/loc/link.asp?tipodoc=sattsen&leg=19&id={ident}',
        })
    return sorted(senatori, key=lambda d: norm(d['nome']))


# ---------------------------------------------------------------- Parlamento europeo

def leggi_json(url, file):
    return json.load(open(scarica(url, file, 'application/ld+json'), encoding='utf-8'))


def europa(regione_di_nome):
    z = scarica(ELIGENDO + 'europee/europee-20240609.zip', 'europee/europee-20240609.zip')
    cache = os.path.join(GREZZI, 'europee', 'candidati-2024-latin1.json')
    if os.path.exists(cache) and not SCARICA:
        circ = json.load(open(cache, encoding='utf-8'))
    else:
        circ = {}
        with zipfile.ZipFile(z) as zz:
            for c in ['I', 'II', 'III', 'IV', 'V']:
                pref, seggi, regioni, nome = collections.Counter(), {}, set(), ''
                with zz.open(f'Europee_Preferenze_CIRCOSCRIZIONE_{c}_SEZIONI_20240609.csv') as f:
                    r = csv.reader(io.TextIOWrapper(f, encoding='latin-1'), delimiter=';')
                    next(r)
                    for row in r:
                        if len(row) < 13:
                            continue
                        nome = row[0]
                        regioni.add(row[1])
                        try:
                            pref[(row[6], row[9], row[10])] += int(row[12] or 0)
                        except ValueError:
                            pass
                        seggi[row[6]] = int(row[7] or 0)
                circ[c] = {'nome': nome, 'regioni': sorted(regioni), 'seggi': seggi, 'candidati': [[l, co, no] for (l, co, no) in pref]}
        json.dump(circ, open(cache, 'w', encoding='utf-8'), ensure_ascii=False)
    # Le Regioni di ogni circoscrizione dai risultati per Comune (il file delle preferenze non ha la Valle d'Aosta,
    # che vota con le liste ma senza preferenze nello stesso file).
    with zipfile.ZipFile(z) as zz, zz.open('EUROPEE_SCRUTINI&LISTE_ITALIA_LivComune.csv') as f:
        r = csv.reader(io.TextIOWrapper(f, encoding='latin-1'), delimiter=';')
        next(r)
        for row in r:
            c = row[1].split(':')[0].strip() if len(row) > 2 else ''
            if c in circ and row[2] not in circ[c]['regioni']:
                circ[c]['regioni'] = sorted(circ[c]['regioni'] + [row[2]])
    attuali =leggi_json(EP_API + 'meps/show-current?country-of-representation=IT&format=application%2Fld%2Bjson&offset=0&limit=200', 'europa/meps-it.json')['data']
    gruppi_id = {}
    meps = []
    for m in attuali:
        det = leggi_json(EP_API + f"meps/{m['identifier']}?format=application%2Fld%2Bjson", f"europa/mep-{m['identifier']}.json")['data'][0]
        inizio, gruppo = '', ''
        for ms in det.get('hasMembership', []):
            periodo = ms.get('memberDuring') or {}
            if periodo.get('endDate'):
                continue
            if ms.get('role') == 'def/ep-roles/MEMBER_PARLIAMENT' and ms.get('organization') == 'org/ep-10':
                inizio = periodo.get('startDate', '')
            if ms.get('membershipClassification') == 'def/ep-entities/EU_POLITICAL_GROUP' and ms.get('organization'):
                gruppo = ms['organization']
        meps.append({'id': m['identifier'], 'nome': bel_nome(f"{m.get('familyName', '')} {m.get('givenName', '')}"),
                     'cognome': m.get('familyName', ''), 'nomeProprio': m.get('givenName', ''), 'inizio': inizio, 'gruppoId': gruppo,
                     'scheda': f"https://www.europarl.europa.eu/meps/it/{m['identifier']}"})
        if gruppo:
            gruppi_id[gruppo] = None
    for g in gruppi_id:
        d = leggi_json(EP_API + f"corporate-bodies/{g.split('/')[-1]}?format=application%2Fld%2Bjson&language=it", f"europa/gruppo-{g.split('/')[-1]}.json")['data'][0]
        gruppi_id[g] = (d.get('prefLabel') or {}).get('it') or d.get('label', '')

    # Circoscrizione di ogni eurodeputato: dove è stato candidato. Se era candidato in più circoscrizioni,
    # si deduce dai seggi rimasti alla sua lista in ciascuna (dati ufficiali di candidature e seggi);
    # se il dato non basta, la circoscrizione resta vuota («serve un dato»).
    dove = collections.defaultdict(list)  # (cognome, nome) → [(circ, lista)]
    for c, d in circ.items():
        for lista, co, no in d['candidati']:
            dove[(norm(co), norm(no))].append((c, lista))
    for m in meps:
        co, no = norm(m['cognome']), norm(m['nomeProprio'])
        opzioni = dove.get((co, no)) or []
        if not opzioni:  # nome proprio scritto diversamente: basta il cognome se è unico tra i candidati
            simili = [k for k in dove if k[0] == co and (k[1].split()[:1] == no.split()[:1] or len([x for x in dove if x[0] == co]) == 1)]
            opzioni = [o for k in simili for o in dove[k]] if len(simili) == 1 else []
        m['opzioni'] = opzioni
    seggi = {(c, l): n for c, d in circ.items() for l, n in d['seggi'].items()}
    cambiato = True
    while cambiato:
        cambiato = False
        for m in meps:
            if m.get('circ') or not m['opzioni']:
                continue
            occupati = collections.Counter((x['circ'], x['lista']) for x in meps if x.get('circ'))
            libere = [o for o in m['opzioni'] if seggi.get(o, 0) - occupati[o] > 0]
            if len(libere) == 1 or len({o for o in m['opzioni']}) == 1:
                m['circ'], m['lista'] = (libere or m['opzioni'])[0]
                cambiato = True
    uscita = []
    for m in sorted(meps, key=lambda x: norm(x['nome'])):
        uscita.append({'nome': m['nome'], 'circoscrizione': m.get('circ', ''), 'lista': '',
                       'gruppo': '', 'inizio': m['inizio'], 'scheda': m['scheda']})
    circoscrizioni = {}
    for c, d in circ.items():
        nome = d['nome'].split(':', 1)[-1].strip().title().replace('Nord-Occidentale', 'nord-occidentale').replace('Nord-Orientale', 'nord-orientale').replace('Centrale', 'centrale').replace('Meridionale', 'meridionale').replace('Insulare', 'insulare')
        circoscrizioni[c] = {'nome': nome, 'regioni': sorted(regione_di_nome[norm(r)] for r in d['regioni'] if norm(r) in regione_di_nome),
                             'seggi': sum(d['seggi'].values())}
    return circoscrizioni, uscita


# ---------------------------------------------------------------- tutto insieme

def main():
    os.makedirs(GREZZI, exist_ok=True)
    for f in FILE_DAIT:
        scarica(DAIT + f + '.csv', f + '.csv')
    for f in ['elenco-collegi-comuni-camera.csv', 'elenco-collegi-comuni-senato.csv']:
        scarica(ELIGENDO + 'catalogoagid/' + f, f)

    elenco = json.load(open(os.path.expanduser('~/dati-civici/raccolta/arera-comuni.json'), encoding='utf-8'))['elenco']
    ipa, ipa_nome, ipa_comuni = carica_ipa()
    regione_di_nome = {norm(v): k for k, v in REGIONI.items()}
    regione_di_nome.update({'emilia romagna': '08', 'friuli venezia giulia': '06', 'trentino alto adige sudtirol': '04',
                            'trentino alto adige': '04', 'valle d aosta': '02', 'valle d aosta vallee d aoste': '02'})

    # --- i Comuni ISTAT e la chiave per agganciare le altre fonti
    comuni = {}
    per_chiave = collections.defaultdict(list)
    for c in elenco:
        nome = c['comune'].replace('_', ' ')
        pec, s = ipa_comuni.get((nome_comune(nome), c['sigla']), ('', ''))
        comuni[c['istat']] = {'istat': c['istat'], 'nome': nome, 'sigla': c['sigla'], 'regione': c['regione'], 'provincia': c['nome_provincia'],
                              'pec': pec, 'sito': sito(s), 'persone': [], 'commissari': [], 'camera': None, 'senato': None}
        per_chiave[(c['regione'], nome_comune(nome))].append(c['istat'])

    def trova(regione, nome, sigla):
        ids = per_chiave.get((regione, nome_comune(nome))) or []
        if len(ids) > 1:
            ids = [i for i in ids if comuni[i]['sigla'] == sigla] or ids
        return ids[0] if len(ids) == 1 else None

    # --- amministratori comunali
    amm, agg_com = leggi_dait('ammcom')
    non_trovati = collections.Counter()
    gruppi_com = collections.defaultdict(list)
    for r in amm:
        i = trova(r['codice_regione'], r['denominazione_comune'], r['sigla_provincia'])
        if not i:
            non_trovati[(r['denominazione_comune'], r['sigla_provincia'])] += 1
            continue
        gruppi_com[i].append((persona(r), r))
    for i, coppie in gruppi_com.items():
        comuni[i]['persone'] = ordina(coppie)
    straord, agg_str = leggi_dait('organistraordinariincarica')
    for r in straord:
        i = trova(r['codice_regione'], r['denominazione_comune'], r['sigla_provincia'])
        if i:
            p = persona(r)
            comuni[i]['commissari'].append([p[0], p[1], p[4], p[3]])  # nome, carica, in carica dal, elezione precedente
    print(f'Comuni con amministratori: {len(gruppi_com)}; righe non agganciate: {sum(non_trovati.values())} ({len(non_trovati)} Comuni)', file=sys.stderr)
    if non_trovati:
        print('  esempi:', list(non_trovati)[:15], file=sys.stderr)

    # --- collegi di Camera e Senato
    for camera_senato, file in (('camera', 'elenco-collegi-comuni-camera.csv'), ('senato', 'elenco-collegi-comuni-senato.csv')):
        senza = set()
        righe = list(csv.reader(open(os.path.join(GREZZI, file), encoding='utf-8', errors='replace'), delimiter=';'))[1:]
        for circ, pluri, uni, comune, sigla in (r[:5] for r in righe if len(r) >= 5):
            reg = regione_di_nome.get(norm(re.sub(r'\s+\d+$', '', circ)))
            i = trova(reg, comune, sigla) if reg else None
            if not i:
                senza.add((comune, sigla))
                continue
            c = comuni[i].setdefault(camera_senato, None) or {'circoscrizione': circ.title(), 'plurinominale': [], 'uninominale': []}
            if pluri and pluri not in c['plurinominale']:
                c['plurinominale'].append(pluri)
            if uni and uni not in c['uninominale']:
                c['uninominale'].append(uni)
            comuni[i][camera_senato] = c
        print(f'{camera_senato}: righe dei collegi non agganciate a un Comune di oggi: {len(senza)}', list(senza)[:10], file=sys.stderr)

    # --- enti intermedi: Città metropolitane, Province, Province autonome
    prov, agg_prov = leggi_dait('ammprov')
    metro, agg_metro = leggi_dait('ammmetropolitani')
    per_sigla_metro = collections.defaultdict(list)
    for r in metro:
        per_sigla_metro[r['sigla_provincia']].append(r)
    per_nucleo_prov = collections.defaultdict(list)
    for r in prov:
        per_nucleo_prov[nucleo_provincia(r['denominazione_provincia'])].append(r)
    ipa_prov = {}
    for nome, cat, _, s, pec, sit, _ in ipa['enti']:
        if cat in ('L5', 'L45'):
            ipa_prov.setdefault((cat, nucleo_provincia(nome)), (nome, pec, sito(sit)))
    enti = {}
    for sigla, nome_prov, reg in sorted({(c['sigla'], c['provincia'], c['regione']) for c in comuni.values()}):
        nucleo = nucleo_provincia(nome_prov)
        if sigla in per_sigla_metro:
            righe, tipo = per_sigla_metro[sigla], 'citta-metropolitana'
            ipa_e = ipa_prov.get(('L45', nucleo))
        elif sigla in IPA_PROVINCIA_AUTONOMA:
            righe, tipo = per_nucleo_prov.get(nucleo, []), 'provincia-autonoma'
            g, cons = IPA_PROVINCIA_AUTONOMA[sigla]
            ipa_e = ipa_nome.get(norm(g))
            ipa_e = (ipa_e[2], ipa_e[0], sito(ipa_e[1])) if ipa_e else None
        else:
            righe, tipo = per_nucleo_prov.get(nucleo, []), 'provincia'
            ipa_e = ipa_prov.get(('L5', nucleo))
        if ipa_e and ipa_e[0].upper() == ipa_e[0]:
            ipa_e = (bel_nome(ipa_e[0]).replace(' Di ', ' di ').replace(' Del ', ' del ').replace(" Dell'", " dell'"), ipa_e[1], ipa_e[2])
        ente = {'tipo': tipo, 'nome': ipa_e[0] if ipa_e else nome_prov, 'pec': ipa_e[1] if ipa_e else '', 'sito': ipa_e[2] if ipa_e else '',
                'persone': ordina([(persona(r), r) for r in righe])}
        if tipo == 'provincia-autonoma':
            cons = ipa_nome.get(norm(IPA_PROVINCIA_AUTONOMA[sigla][1]))
            ente['consiglio'] = {'nome': cons[2], 'pec': cons[0], 'sito': sito(cons[1])} if cons else None
        if tipo == 'citta-metropolitana' and not ipa_e:
            ente['nome'] = f'Città metropolitana di {nome_prov.replace("Citta metropolitana di ", "")}'
        elif not ipa_e and tipo == 'provincia':
            ente['nome'] = f'Provincia di {nome_prov}'
        if not ente['persone'] and (reg == '06' or not ipa_e):
            ente = None  # nessun ente intermedio nell'Anagrafe (Valle d'Aosta, Friuli-Venezia Giulia): la pagina lo dice
        enti[sigla] = ente
    print('enti intermedi senza amministratori nella fonte:', sorted(s for s, e in enti.items() if not e or not e['persone']), file=sys.stderr)

    # --- Regioni
    reg_righe, agg_reg = leggi_dait('ammreg')
    per_reg = collections.defaultdict(list)
    for r in reg_righe:
        per_reg[r['codice_regione']].append(r)
    regioni = {}
    for cod, nome in REGIONI.items():
        g, cons = IPA_REGIONE[cod]
        gi, ci = ipa_nome.get(norm(g)), ipa_nome.get(norm(cons)) if cons else None
        persone = ordina([(persona(r), r) for r in per_reg.get(cod, [])])
        presidente = next((p for p in persone if p[1].lower().startswith('presidente della regione')), None)
        regioni[cod] = {'nome': nome, 'statutoSpeciale': cod in SPECIALI,
                        'giunta': {'nome': gi[2], 'pec': gi[0], 'sito': sito(gi[1])} if gi else None,
                        'consiglio': {'nome': ci[2], 'pec': ci[0], 'sito': sito(ci[1])} if ci else None,
                        'elezione': presidente[3] if presidente else '',
                        'persone': persone}

    # --- Parlamento
    deputati = camera()
    senatori = senato()
    circoscrizioni, eurodeputati = europa(regione_di_nome)
    for s in senatori:
        s['regioneCodice'] = regione_di_nome.get(norm(s['regione']), '')

    # --- controlli di coerenza (si fermano qui se qualcosa non torna)
    assert len(deputati) >= 380, f'deputati in carica: {len(deputati)}'
    assert len(senatori) >= 190, f'senatori in carica: {len(senatori)}'
    assert len(eurodeputati) == 76, f'eurodeputati: {len(eurodeputati)}'
    assert sum(c['seggi'] for c in circoscrizioni.values()) == 76
    chiavi_dep = {chiave_collegio(d['collegio']) for d in deputati}
    chiavi_com = {chiave_collegio(u) for c in comuni.values() if c['camera'] for u in c['camera']['uninominale']}
    print('collegi uninominali della Camera senza deputato nei dati:', len(chiavi_com - chiavi_dep), sorted(chiavi_com - chiavi_dep)[:10], file=sys.stderr)
    chiavi_sen = {chiave_collegio(s['collegio']) for s in senatori if s['tipo'] == 'uninominale'}
    chiavi_com_s = {chiave_collegio(u) for c in comuni.values() if c['senato'] for u in c['senato']['uninominale']}
    print('collegi uninominali del Senato senza senatore nei dati:', len(chiavi_com_s - chiavi_sen), sorted(chiavi_com_s - chiavi_sen)[:10], file=sys.stderr)
    print('eurodeputati senza circoscrizione:', [m['nome'] for m in eurodeputati if not m['circoscrizione']], file=sys.stderr)

    fonti = {
        'amministratori': {'titolo': "Ministero dell'Interno, Anagrafe degli amministratori locali e regionali", 'url': 'https://dait.interno.gov.it/elezioni/open-data/amministratori-locali-in-carica',
                           'aggiornato': agg_com, 'licenza': 'dati aperti del Ministero dell\'Interno'},
        'collegi': {'titolo': "Ministero dell'Interno, Eligendo: Comuni per collegio di Camera e Senato (d.lgs. 177/2020)", 'url': 'https://elezionistorico.interno.gov.it/eligendo/opendata.php'},
        'camera': {'titolo': 'Camera dei deputati, dati.camera.it: deputati in carica della XIX legislatura', 'url': 'https://dati.camera.it/', 'licenza': 'CC BY 4.0',
                   'letto': time.strftime('%Y-%m-%d', time.localtime(os.path.getmtime(os.path.join(GREZZI, 'camera-deputati-in-carica.csv'))))},
        'senato': {'titolo': 'Senato della Repubblica, dati aperti: composizione della XIX legislatura', 'url': 'https://github.com/SenatoDellaRepubblica/OpenData', 'licenza': 'CC BY 3.0 IT',
                   'aggiornato': '2024-05-08'},
        'europa': {'titolo': 'Parlamento europeo, Open Data Portal: eurodeputati in carica eletti in Italia', 'url': 'https://data.europarl.europa.eu/it/home',
                   'letto': time.strftime('%Y-%m-%d', time.localtime(os.path.getmtime(os.path.join(GREZZI, 'europa', 'meps-it.json'))))},
        'europee2024': {'titolo': "Ministero dell'Interno, Eligendo: elezioni europee del 9 giugno 2024 (candidati e seggi per circoscrizione)", 'url': 'https://elezionistorico.interno.gov.it/eligendo/opendata.php'},
        'ipa': {'titolo': 'Indice dei domicili digitali delle pubbliche amministrazioni (IndicePA)', 'url': 'https://www.indicepa.gov.it/', 'licenza': 'CC BY 4.0', 'aggiornato': ipa.get('aggiornato', '')},
    }

    os.makedirs(os.path.join(USCITA, 'p'), exist_ok=True)
    for vecchio in os.listdir(os.path.join(USCITA, 'p')):
        os.remove(os.path.join(USCITA, 'p', vecchio))
    scrivi = lambda nome, dati: json.dump(dati, open(os.path.join(USCITA, nome), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    ordinati = sorted(comuni.values(), key=lambda c: (nome_comune(c['nome']), c['sigla']))
    scrivi('comuni.json', {'aggiornato': agg_com, 'regioni': REGIONI, 'comuni': [[c['istat'], c['nome'], c['sigla'], c['regione']] for c in ordinati]})
    per_sigla = collections.defaultdict(dict)
    for c in ordinati:
        per_sigla[c['sigla']][c['istat']] = {k: c[k] for k in ('nome', 'pec', 'sito', 'persone', 'commissari', 'camera', 'senato')}
    for sigla, cc in per_sigla.items():
        scrivi(f'p/{sigla}.json', {'sigla': sigla, 'aggiornato': agg_com, 'ente': enti.get(sigla), 'comuni': cc})
    scrivi('nazionale.json', {'aggiornato': agg_com, 'fonti': fonti, 'regioni': regioni,
                              'camera': deputati, 'senato': senatori,
                              'europa': {'circoscrizioni': circoscrizioni, 'deputati': eurodeputati}})
    totale = sum(os.path.getsize(os.path.join(USCITA, 'p', f)) for f in os.listdir(os.path.join(USCITA, 'p')))
    print(f'{len(comuni)} Comuni in {len(per_sigla)} file di provincia ({totale / 1e6:.1f} MB); {len(deputati)} deputati, {len(senatori)} senatori, {len(eurodeputati)} eurodeputati', file=sys.stderr)


if __name__ == '__main__':
    main()
