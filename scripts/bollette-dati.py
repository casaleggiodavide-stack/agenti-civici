#!/usr/bin/env python3
"""I dati di «Quanto risparmi in bolletta?»: le offerte del mercato libero per la casa (luce e gas) dagli open data
del Portale Offerte di ARERA e Acquirente Unico, con i parametri regolati che il Portale usa per stimare la spesa annua.

Fonti (lette con User-Agent «PolpoCivico/1.0 (strumenti civici)», una richiesta per volta, pausa di 1,5 secondi):
- Portale Offerte, sezione Open Data: https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page
  robots.txt: assente (risposta 404, nessun divieto), controllato il 15/11/2026. I dati del Portale sono pubblicati
  «in modalità aperta» ai sensi del d.lgs. 33/2013 (testo della pagina Open Data).
  * PO_Offerte_E_MLIBERO_<data>.xml e PO_Offerte_G_MLIBERO_<data>.xml: offerte del mercato libero (aggiornate ogni giorno)
  * PO_Parametri_Mercato_Libero_E/G_<data>.csv: componenti regolate, perdite, IVA e accise luce che il Portale usa
  * Prezzi storici degli indici (PUN, PSV, Psbil...) in CSV
- Regole del calcolo: «Regole per il calcolo della spesa annua stimata» v4.0 del 16/2/2026 (Acquirente Unico) e
  «Funzionamento e Specifiche del Processo di Trasmissione Offerte» v5.0 (siiportale.acquirenteunico.it, robots: nessun divieto).
- Nomi dei venditori: estrazione «Ricerca operatori» di ARERA (www.arera.it, robots: Allow /), licenza CC BY-SA 4.0:
  ~/dati-civici/bollette/operatori-arera.xlsx (stesso file usato da «Chi raccoglie i rifiuti?»).
- Elenco dei Comuni con codice ISTAT: ~/dati-civici/raccolta/arera-comuni.json (campo «elenco»).
- Valori degli indici e imposte non presenti nei file del Portale: tabelle qui sotto, ognuna con fonte e data.

Uso:
  python3 -I scripts/bollette-dati.py --scarica   # scarica i file del giorno in ~/dati-civici/bollette/grezzi, poi prepara
  python3 -I scripts/bollette-dati.py             # usa i file più recenti già scaricati
Scrive: bollette/dati/luce.json, bollette/dati/gas.json, bollette/src/dati/parametri.js, bollette/src/dati/comuni.js.
Da rilanciare almeno una volta alla settimana (le offerte scadono) e a ogni trimestre aggiornare le tabelle manuali.
"""
import csv
import datetime as dt
import glob
import io
import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATI = os.path.expanduser('~/dati-civici/bollette')
GREZZI = os.path.join(DATI, 'grezzi')
OUT = os.path.join(REPO, 'bollette')
UA = {'User-Agent': 'PolpoCivico/1.0 (strumenti civici)'}
PORTALE = 'https://www.ilportaleofferte.it/portaleOfferte'
NS = '{http://www.acquirenteunico.it/schemas/SII_AU/OffertaRetail/01}'

# ---------- tabelle manuali, con fonte (verificate il 15/11/2026) ----------

VERIFICATO = '2026-11-15'

# Valore più recente degli indici usati dalle offerte variabili. Il Portale Offerte usa le quotazioni forward dei
# quattro trimestri, che non sono pubbliche: noi usiamo l'ultimo valore mensile disponibile e mostriamo il margine.
INDICI_RECENTI = {
    'PUN': {'valore': 0.2308, 'mese': '2026-10', 'unita': '€/kWh',
            'fonte': 'ARERA, Bollettino n. 251 del 10/11/2026 dell\'Unità di vigilanza energetica: PUN Index GME, media di ottobre 2026 230,8 €/MWh',
            'url': 'https://www.arera.it/fileadmin/home/slider/bollettino_vigilanza_energetica/Bollettino_vigilanza_energetica_20261110.pdf'},
    'PSV': {'valore': 0.945436, 'mese': '2026-10', 'unita': '€/Smc',
            'fonte': 'ARERA, comunicato del 3/11/2026: CMEM di ottobre 2026 (media mensile del PSV day ahead) 0,945436 €/Smc',
            'url': 'https://www.arera.it/comunicati-stampa/dettaglio/gas-valore-materia-prima-vulnerabilita-ottobre-2026'},
}

# Accise sul gas per usi domestici: d.lgs. 504/1995 (Testo unico accise), allegato I; scaglioni annui progressivi.
ACCISE_GAS = {
    'centro_nord': [[120, 0.044], [480, 0.175], [1560, 0.170], [None, 0.186]],
    'ex_cassa_mezzogiorno': [[120, 0.038], [480, 0.135], [1560, 0.120], [None, 0.150]],
    'fonte': 'D.lgs. 504/1995 (Testo unico accise), allegato I, gas naturale per combustione per usi domestici (dal 2026 «usi domestici», d.lgs. 43/2025; circolare ADM 32/2025)',
    'url': 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1995-10-26;504',
}

# Territori ex Cassa per il Mezzogiorno (DPR 218/1978, art. 1): accisa gas ridotta. Regioni e province intere;
# per le province in cui ne fa parte solo una zona la risposta dipende dal Comune (lo chiediamo alla persona).
EX_CASMEZ = {
    'regioni': ['13', '14', '15', '16', '17', '18', '19', '20'],
    'province': ['059', '060'],  # Latina, Frosinone
    'comuni': {  # isole d'Elba, del Giglio e di Capraia
        '049002': 'Campo nell\'Elba', '049003': 'Capoliveri', '049004': 'Capraia Isola', '049010': 'Marciana', '049011': 'Marciana Marina',
        '049013': 'Porto Azzurro', '049014': 'Portoferraio', '049021': 'Rio', '053012': 'Isola del Giglio',
    },
    'province_in_parte': ['057', '058', '044', '109'],  # Rieti (ex circondario di Cittaducale), Roma (bonifica di Latina), Ascoli Piceno e Fermo (bonifica del Tronto)
    'fonte': 'DPR 6 marzo 1978, n. 218, art. 1',
    'url': 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1978-03-06;218~art1',
}

# Addizionale regionale all'accisa sul gas (d.lgs. 398/1990, art. 9; massimo 0,030987 €/mc dopo la l. 662/1996).
# Solo regioni a statuto ordinario. «ufficiale» = letto su un sito istituzionale; altrimenti fonte secondaria.
ADDIZIONALI_GAS = {
    '01': {'nome': 'Piemonte', 'scaglioni': [[120, 0.022], [None, 0.0258]], 'ufficiale': True,
           'url': 'https://www.regione.piemonte.it/web/temi/tributi/addizionali-regionali/addizionale-regionale-allaccisa-sul-gas-naturale'},
    '03': {'nome': 'Lombardia', 'scaglioni': [[None, 0]], 'ufficiale': False, 'nota': 'non applicata dal 2002 (l.r. 27/2001)',
           'url': 'https://www.enel.it/content/dam/enel-it/documenti-supporto/imposte-su-forniture/imposte-forniture.pdf'},
    '05': {'nome': 'Veneto', 'scaglioni': [[120, 0.007747], [480, 0.023241], [1560, 0.025823], [None, 0.030987]], 'ufficiale': True,
           'url': 'https://www.regione.veneto.it/web/tributi-regionali/quanto-pagare2'},
    '07': {'nome': 'Liguria', 'scaglioni': [[120, 0.022], [None, 0.0258]], 'ufficiale': False,
           'nota': 'nei Comuni in zona climatica E 0,0155 e in zona F 0,0103 €/mc (l.r. 1/1993, art. 5)',
           'url': 'https://www.edizionieuropee.it/law/html/119/li1_06_025.html'},
    '08': {'nome': 'Emilia-Romagna', 'scaglioni': [[120, 0.022], [None, 0.0309874]], 'ufficiale': True,
           'url': 'https://finanze.regione.emilia-romagna.it/tributi-regionali/imposte/arisgam/quanto-come-e-quando-si-paga'},
    '09': {'nome': 'Toscana', 'scaglioni': [[120, 0.022], [None, 0.030987]], 'ufficiale': True,
           'url': 'https://raccoltanormativa.consiglio.regione.toscana.it/articolo?urndoc=urn:nir:regione.toscana:legge:2012-12-27;77&pr=idx,0;artic,8;articparziale,0'},
    '10': {'nome': 'Umbria', 'scaglioni': [[None, 0.005165]], 'ufficiale': True, 'nota': 'minimo di legge',
           'url': 'https://consiglio.regione.umbria.it/node/57338/printable/pdf'},
    '11': {'nome': 'Marche', 'scaglioni': [[120, 0.0155], [480, 0.0181], [1560, 0.0207], [None, 0.0258]], 'ufficiale': True,
           'url': 'https://www.consiglio.marche.it/banche_dati_e_documentazione/leggi/dettaglio.php?arc=vig&idl=1552'},
    '12': {'nome': 'Lazio', 'scaglioni': [[120, 0.022], [None, 0.03099]], 'ufficiale': True,
           'nota': 'nei territori ex Cassa per il Mezzogiorno 0,019 €/mc fino a 120 mc',
           'url': 'https://regione.lazio.it/tributi-regionali/altri-tributi/addizionale-regionale-gas-naturale'},
    '13': {'nome': 'Abruzzo', 'scaglioni': [[120, 0.019], [480, 0.023241], [None, 0.025823]], 'ufficiale': False,
           'nota': 'nei Comuni in zona climatica E ed F 0,01033 €/mc (l.r. 2/2009)',
           'url': 'https://edizionieuropee.it/law/html/101/ab6_02_019.html'},
    '14': {'nome': 'Molise', 'scaglioni': [[120, 0.019], [None, 0.030987]], 'ufficiale': False,
           'url': 'https://www.enel.it/content/dam/enel-it/documenti-supporto/imposte-su-forniture/imposte-forniture.pdf'},
    '15': {'nome': 'Campania', 'scaglioni': [[120, 0.019], [None, 0.031]], 'ufficiale': False,
           'url': 'https://www.enel.it/content/dam/enel-it/documenti-supporto/imposte-su-forniture/imposte-forniture.pdf'},
    '16': {'nome': 'Puglia', 'scaglioni': [[120, 0.019], [None, 0.03098]], 'ufficiale': False,
           'url': 'https://www.enel.it/content/dam/enel-it/documenti-supporto/imposte-su-forniture/imposte-forniture.pdf'},
    '17': {'nome': 'Basilicata', 'scaglioni': [[120, 0.019], [None, 0.0258228]], 'ufficiale': False,
           'url': 'https://edizionieuropee.it/law/html/103/ba6_01_009.html'},
    '18': {'nome': 'Calabria', 'scaglioni': [[120, 0.019], [1560, 0.02582], [None, 0.03099]], 'ufficiale': False,
           'url': 'https://www.consiglioregionale.calabria.it/upload/testicoordinati/2016-44_2018-12-211.pdf'},
}
ADDIZIONALI_FONTE = {'titolo': 'D.lgs. 398/1990, art. 9 (addizionale regionale all\'accisa sul gas naturale)',
                     'url': 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1990-12-21;398~art9'}

# Componente CCR (copertura rischi, servizio di tutela della vulnerabilità gas), usata dalle offerte che la applicano.
CCR = {'inverno': 0.654512, 'estate': 0.707871, 'pcs': 0.03852,
       'fonte': 'ARERA, delibera 161/2026/R/gas, tabella 1 del TIVG: dal 1/10/2026 al 31/3/2027 0,654512 €/GJ; dal 1/4/2027 al 30/9/2027 0,707871 €/GJ',
       'url': 'https://www.arera.it/fileadmin/allegati/docs/26/161-2026-R-gas.pdf'}

# Profili mensili di prelievo del gas (anno termico, ottobre-settembre), in percentuale del consumo annuo:
# appendice delle «Regole per il calcolo della spesa annua stimata» v4.0. C1 zona E = riscaldamento; C2 = cottura e acqua calda.
PROFILI_GAS = {
    'riscaldamento': [5.5194873, 14.8851505, 22.0494524, 24.2610252, 17.5032776, 10.9498316, 4.8317740, 0.0000003, 0.0000003, 0.0000003, 0.0000003, 0.0000003],
    'cottura': [7.2982139, 9.1423084, 12.2074716, 13.4956479, 11.2628566, 11.1005836, 7.5419819, 6.2026357, 5.4659533, 5.1313777, 5.2406872, 5.9102822],
}

# Ambiti tariffari del gas per Regione (codice ISTAT): tabella del paragrafo 4.1.2 delle Regole del Portale.
AMBITI_GAS = {'01': 1, '02': 1, '07': 1, '03': 2, '04': 2, '05': 2, '06': 2, '08': 2, '09': 3, '10': 3, '11': 3,
              '13': 4, '14': 4, '16': 4, '17': 4, '12': 5, '15': 5, '18': 6, '19': 6}
NOMI_AMBITI = {1: 'Nord occidentale', 2: 'Nord orientale', 3: 'Centrale', 4: 'Centro-sud orientale', 5: 'Centro-sud occidentale', 6: 'Meridionale'}
REGIONI = {'01': 'Piemonte', '02': "Valle d'Aosta", '03': 'Lombardia', '04': 'Trentino-Alto Adige', '05': 'Veneto', '06': 'Friuli-Venezia Giulia',
           '07': 'Liguria', '08': 'Emilia-Romagna', '09': 'Toscana', '10': 'Umbria', '11': 'Marche', '12': 'Lazio', '13': 'Abruzzo', '14': 'Molise',
           '15': 'Campania', '16': 'Puglia', '17': 'Basilicata', '18': 'Calabria', '19': 'Sicilia', '20': 'Sardegna'}


# ---------- scaricamento ----------

def leggi(url, tentativi=6):
    for i in range(tentativi):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r:
                return r.read()
        except Exception:
            if i == tentativi - 1:
                raise
            time.sleep(10 * (i + 1))


def scarica():
    os.makedirs(GREZZI, exist_ok=True)
    pagina = leggi(f'{PORTALE}/it/open-data.page').decode('utf-8', 'ignore')
    time.sleep(1.5)
    link = sorted(set(re.findall(r'/portaleOfferte/resources/(?:opendata/csv/(?:offerteML|parametriML)/\d{4}_\d{2}/PO_[A-Za-z_]+_\d{8}\.(?:xml|csv)|cms/documents/[0-9a-f]+\.csv)', pagina)))
    for p in link:
        nome = os.path.basename(p)
        if nome.endswith('.csv') and len(nome) == 36:  # i prezzi storici hanno un nome casuale
            nome = 'prezzi-storici.csv'
        dest = os.path.join(GREZZI, nome)
        if os.path.exists(dest) and nome != 'prezzi-storici.csv':
            continue
        print('scarico', nome, flush=True)
        dati = leggi('https://www.ilportaleofferte.it' + p)
        open(dest, 'wb').write(dati)
        time.sleep(1.5)


def ultimo(modello):
    trovati = sorted(glob.glob(os.path.join(GREZZI, modello)))
    if not trovati:
        sys.exit(f'manca {modello} in {GREZZI}: lancia con --scarica')
    return trovati[-1]


# ---------- parametri e indici ----------

def parametri_csv(percorso):
    return {r['nome_parametro']: float(r['valore']) for r in csv.DictReader(open(percorso, encoding='utf-8'))}


def storico_indici():
    p = os.path.join(GREZZI, 'prezzi-storici.csv')
    if not os.path.exists(p):
        p = next(iter(glob.glob(os.path.join(GREZZI, '[0-9a-f]' * 32 + '.csv'))), None)
    righe = list(csv.reader(io.StringIO(open(p, 'rb').read().decode('latin-1')), delimiter=';'))
    testa = [re.sub(r'\s*\(.*', '', c).strip() for c in righe[0]]
    out = {}
    for r in righe[1:]:
        if not r or not r[0].strip():
            continue
        mese = f'{r[0][:4]}-{r[0][4:6]}'
        for nome, v in zip(testa[1:], r[1:]):
            if v.strip():
                out.setdefault(nome, {})[mese] = float(v.replace(',', '.'))
    return out


def indici(storico):
    """Per ogni indice: valore usato, mese, fonte, minimo e massimo degli ultimi 12 mesi (per il margine)."""
    out = {}
    for nome, unita in (('PUN', '€/kWh'), ('PSV', '€/Smc'), ('Psbil', '€/Smc')):
        serie = dict(storico.get(nome, {}))
        if nome in INDICI_RECENTI:
            serie[INDICI_RECENTI[nome]['mese']] = INDICI_RECENTI[nome]['valore']
        mesi = sorted(serie)[-12:]
        ultimo_mese = mesi[-1]
        rec = INDICI_RECENTI.get(nome)
        out[nome] = {
            'valore': serie[ultimo_mese], 'mese': ultimo_mese, 'unita': unita,
            'min12': min(serie[m] for m in mesi), 'max12': max(serie[m] for m in mesi), 'da': mesi[0],
            'fonte': rec['fonte'] if rec and rec['mese'] == ultimo_mese else f'Portale Offerte, prezzi storici degli indici ({nome}, {ultimo_mese})',
            'url': rec['url'] if rec and rec['mese'] == ultimo_mese else f'{PORTALE}/it/open-data.page',
        }
    # Il Psbil (prezzo di sbilanciamento del gas) arriva un mese dopo il PSV: se è più vecchio, usiamo il PSV
    # dello stesso mese come approssimazione e lo diciamo (nell'ultimo mese con entrambi, la differenza è indicata).
    if out['Psbil']['mese'] < out['PSV']['mese']:
        m = out['Psbil']['mese']
        scarto = storico['Psbil'][m] / storico['PSV'][m] - 1 if m in storico.get('PSV', {}) else None
        out['Psbil'].update({k: out['PSV'][k] for k in ('valore', 'mese', 'fonte', 'url', 'min12', 'max12', 'da')})
        out['Psbil'].update({
                             'approssimato': f'Usiamo il PSV di {out["PSV"]["mese"]}: il Psbil di quel mese non è ancora pubblicato'
                                             + (f' (a {m} il Psbil era {"+" if scarto >= 0 else ""}{scarto * 100:.1f}% rispetto al PSV)'.replace('.', ',') if scarto is not None else '')})
    return out


# ---------- offerte ----------

def t(el, nome):
    v = el.findtext(NS + nome)
    return v.strip() if v else None


def num(s):
    try:
        return float(s)
    except (TypeError, ValueError):
        return None


def mesi_validita(pv, oggi):
    """Quanti dei 12 mesi della stima copre un prezzo con validità limitata (None = tutto l'anno)."""
    if pv is None:
        return None
    if t(pv, 'DURATA'):
        return max(0, min(12, int(t(pv, 'DURATA'))))
    if t(pv, 'VALIDO_FINO'):
        m, a = t(pv, 'VALIDO_FINO').split('/')
        n = (int(a) - oggi.year) * 12 + int(m) - oggi.month + 1
        return max(0, min(12, n))
    if t(pv, 'MESE_VALIDITA'):
        return 1
    return None


def taglia(s, n):
    s = re.sub(r'\s+', ' ', s or '').strip()
    return s if len(s) <= n else s[:n - 1].rstrip() + '…'


def offerte(percorso, mercato, oggi, venditori):
    radice = ET.parse(percorso).getroot()
    elenco, scartate = [], {}

    def scarta(motivo):
        scartate[motivo] = scartate.get(motivo, 0) + 1

    for o in radice.findall(NS + 'offerta'):
        d = o.find(NS + 'DettaglioOfferta')
        if t(d, 'TIPO_CLIENTE') != '01':
            continue  # solo clienti domestici
        if t(d, 'OFFERTA_SINGOLA') != 'SI':
            scarta('solo insieme a un\'offerta dell\'altra fornitura'); continue
        fine = dt.datetime.strptime(t(o.find(NS + 'ValiditaOfferta'), 'DATA_FINE')[:10], '%d/%m/%Y').date()
        if fine < oggi:
            scarta('scaduta'); continue
        piva = t(o.find(NS + 'IdentificativiOfferta'), 'PIVA_UTENTE')
        contatti = d.find(NS + 'Contatti')
        sito = t(contatti, 'URL_SITO_VENDITORE') or ''
        if piva not in venditori:
            venditori[piva] = len(venditori)
        tipo = {'01': 'F', '02': 'V', '03': 'FLAT', '04': 'M'}.get(t(d, 'TIPO_OFFERTA'), '?')
        of = {
            'c': t(o.find(NS + 'IdentificativiOfferta'), 'COD_OFFERTA'),
            'v': venditori[piva],
            'n': taglia(t(d, 'NOME_OFFERTA'), 120),
            't': tipo,
            'd': int(t(d, 'DURATA') or -1),
            'fine': fine.isoformat(),
        }
        if t(d, 'DOMESTICO_RESIDENTE') in ('01', '02'):
            of['r'] = t(d, 'DOMESTICO_RESIDENTE')
        if t(d, 'OFFERTA_ONNICOMPRENSIVA'):
            of['onni'] = t(d, 'OFFERTA_ONNICOMPRENSIVA')
            of['canone'] = num(t(d, 'CONSUMO_CANONE'))
        z = o.find(NS + 'ZoneOfferta')
        if z is not None and len(z):
            zone = {}
            for k, ch in (('REGIONE', 'r'), ('PROVINCIA', 'p'), ('COMUNE', 'm')):
                vals = [x.text.strip().zfill({'r': 2, 'p': 3, 'm': 6}[ch]) for x in z.findall(NS + k) if x.text and x.text.strip()]
                if vals:
                    zone[ch] = sorted(set(vals))
            if zone:
                of['z'] = zone
        car = o.find(NS + 'CaratteristicheOfferta')
        if car is not None:
            lim = [num(t(car, k)) for k in ('CONSUMO_MIN', 'CONSUMO_MAX', 'POTENZA_MIN', 'POTENZA_MAX')]
            if any(x is not None for x in lim):
                of['lim'] = lim
        if mercato == 'E':
            of['f'] = t(o.find(NS + 'TipoPrezzo'), 'TIPOLOGIA_FASCE') if o.find(NS + 'TipoPrezzo') is not None else '01'
        # Componenti del venditore: [macroarea, nome, [[unità, fascia, prezzo, consumo da, consumo a, mesi di validità, tipo prezzo]]].
        # Le componenti opzionali (TIPOLOGIA 02) non entrano nella stima, come sul Portale: ne teniamo il nome.
        comp = []
        for ci in o.findall(NS + 'ComponenteImpresa'):
            if t(ci, 'TIPOLOGIA') != '01':
                continue
            intervalli = [[t(ip, 'UNITA_MISURA'), t(ip, 'FASCIA_COMPONENTE'), num(t(ip, 'PREZZO')), num(t(ip, 'CONSUMO_DA')), num(t(ip, 'CONSUMO_A')),
                           mesi_validita(ip.find(NS + 'PeriodoValidita'), oggi), t(ip, 'TIPO_PREZZO')] for ip in ci.findall(NS + 'IntervalloPrezzi')]
            # gli ultimi campi vuoti si tolgono per risparmiare spazio
            for iv in intervalli:
                while iv and iv[-1] is None:
                    iv.pop()
            comp.append([t(ci, 'MACROAREA'), taglia(t(ci, 'NOME'), 40), intervalli])
        of['comp'] = comp
        opz = sorted({taglia(t(ci, 'NOME'), 60) for ci in o.findall(NS + 'ComponenteImpresa') if t(ci, 'TIPOLOGIA') == '02'})
        if opz:
            of['opz'] = opz
        idx = [[t(x, 'IDX_PREZZO_ENERGIA'), num(t(x, 'COEFFICIENTE')), t(x, 'FASCIA_PREZZO')] for x in o.findall(NS + 'RiferimentiPrezzoEnergia')]
        if idx:
            of['idx'] = idx
        disp = [[t(x, 'TIPO_DISPACCIAMENTO'), num(t(x, 'VALORE_DISP'))] for x in o.findall(NS + 'Dispacciamento')]
        if disp and mercato == 'E':
            of['disp'] = disp
        cr = sorted({x.text.strip() for cr in o.findall(NS + 'ComponentiRegolate') for x in cr.findall(NS + 'CODICE') if x.text})
        if cr:
            of['cr'] = cr
        sc, scc = [], []
        for s in o.findall(NS + 'Sconto'):
            cond = t(s.find(NS + 'Condizione'), 'CONDIZIONE_APPLICAZIONE') if s.find(NS + 'Condizione') is not None else None
            val = t(s, 'VALIDITA')
            mesi = mesi_validita(s.find(NS + 'PeriodoValidita'), oggi)
            for p in s.findall(NS + 'PrezziSconto'):
                # [tipologia, unità, valore, prima dell'IVA, mesi di validità, componente o fascia, consumo da, consumo fino a]
                riga = [t(p, 'TIPOLOGIA'), t(p, 'UNITA_MISURA'), num(t(p, 'PREZZO')), t(s, 'IVA_SCONTO') != '02', mesi, t(s, 'CODICE_COMPONENTE_FASCIA'),
                        num(t(p, 'VALIDO_DA')), num(t(p, 'VALIDO_FINO'))]
                while riga and riga[-1] is None:
                    riga.pop()
                if cond == '00' and val in ('01', '02'):
                    sc.append(riga)
                else:
                    scc.append(taglia(t(s, 'NOME'), 80) + (f' ({taglia(t(s.find(NS + "Condizione"), "DESCRIZIONE_CONDIZIONE"), 140)})' if cond == '99' and s.find(NS + 'Condizione') is not None and t(s.find(NS + 'Condizione'), 'DESCRIZIONE_CONDIZIONE') else f' ({CONDIZIONI_SCONTO.get(cond, "condizionato")})' if cond != '00' else ' (oltre il primo anno)'))
        if sc:
            of['sc'] = sc
        if scc:
            of['scc'] = sorted(set(scc))[:6]
        cond = []
        for cc in o.findall(NS + 'CondizioniContrattuali'):
            tip, limit = t(cc, 'TIPOLOGIA_CONDIZIONE'), t(cc, 'LIMITANTE') == '01'
            if limit or tip in ('04', '05'):
                cond.append([tip, limit, taglia(t(cc, 'DESCRIZIONE'), 400)])
        if cond:
            of['cond'] = cond
        gar = t(d, 'GARANZIE')
        if gar and gar.upper() != 'NO':
            of['gar'] = taglia(gar, 200)
        of['att'] = sorted({x.text for x in d.find(NS + 'ModalitaAttivazione').findall(NS + 'MODALITA')}) if d.find(NS + 'ModalitaAttivazione') is not None else []
        of['pag'] = sorted({t(m, 'MODALITA_PAGAMENTO') for m in o.findall(NS + 'MetodoPagamento')})
        of['url'] = t(contatti, 'URL_OFFERTA') or sito
        of['tel'] = t(contatti, 'TELEFONO')
        servizi = [taglia(t(p, 'NOME'), 60) for p in o.findall(NS + 'ProdottiServiziAggiuntivi') if t(p, 'NOME')]
        if servizi:
            of['serv'] = servizi[:3]
        elenco.append(of)
    return elenco, scartate


CONDIZIONI_SCONTO = {'01': 'con la bolletta elettronica', '02': 'con la gestione online', '03': 'con bolletta elettronica e domiciliazione bancaria'}


def nomi_venditori():
    p = os.path.join(DATI, 'operatori-arera.xlsx')
    if not os.path.exists(p):
        p = os.path.expanduser('~/dati-civici/raccolta/operatori-arera.xlsx')
    if not os.path.exists(p):
        print('attenzione: manca operatori-arera.xlsx, uso il sito del venditore come nome')
        return {}
    import openpyxl
    righe = openpyxl.load_workbook(p, read_only=True).active.iter_rows(values_only=True)
    testa = next(righe)
    i_nome, i_piva = testa.index('Società'), testa.index('Partita IVA')
    return {str(r[i_piva]).strip().zfill(11): str(r[i_nome]).strip() for r in righe if r[i_piva]}


def comuni():
    e = json.load(open(os.path.expanduser('~/dati-civici/raccolta/arera-comuni.json'), encoding='utf-8'))['elenco']
    return sorted([[c['istat'], c['comune'], c['sigla'], c['regione']] for c in e], key=lambda r: r[1])


def main():
    if '--scarica' in sys.argv:
        scarica()
    file_e, file_g = ultimo('PO_Offerte_E_MLIBERO_*.xml'), ultimo('PO_Offerte_G_MLIBERO_*.xml')
    data = re.search(r'(\d{8})\.xml$', file_e).group(1)
    oggi = dt.date(int(data[:4]), int(data[4:6]), int(data[6:]))
    par_e = parametri_csv(ultimo('PO_Parametri_Mercato_Libero_E_*.csv'))
    par_g = parametri_csv(ultimo('PO_Parametri_Mercato_Libero_G_*.csv'))
    operatori = nomi_venditori()

    venditori_e, venditori_g = {}, {}
    luce, scarto_e = offerte(file_e, 'E', oggi, venditori_e)
    gas, scarto_g = offerte(file_g, 'G', oggi, venditori_g)

    def tabella(v):
        out = [None] * len(v)
        for piva, i in v.items():
            out[i] = [operatori.get(piva) or None, piva]
        return out

    os.makedirs(os.path.join(OUT, 'dati'), exist_ok=True)
    os.makedirs(os.path.join(OUT, 'src', 'dati'), exist_ok=True)
    for nome, lista, ven, scarto, file in (('luce', luce, venditori_e, scarto_e, file_e), ('gas', gas, venditori_g, scarto_g, file_g)):
        siti = {}
        for of in lista:
            siti.setdefault(of['v'], of['url'])
        tab = tabella(ven)
        for i, r in enumerate(tab):
            if not r[0]:
                r[0] = re.sub(r'^https?://(www\.)?|/.*$', '', siti.get(i) or '', flags=re.I) or f'P.IVA {r[1]}'
        json.dump({'aggiornato': oggi.isoformat(), 'file': os.path.basename(file), 'venditori': tab, 'scartate': scarto, 'offerte': lista},
                  open(os.path.join(OUT, 'dati', f'{nome}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(nome, len(lista), 'offerte;', len(tab), 'venditori; scartate', scarto)

    storico = storico_indici()
    par = {
        'aggiornato': oggi.isoformat(),
        'verificato': VERIFICATO,
        'luce': par_e,
        'gas': par_g,
        'indici': indici(storico),
        'accise_gas': ACCISE_GAS,
        'ex_casmez': EX_CASMEZ,
        'addizionali_gas': ADDIZIONALI_GAS,
        'addizionali_fonte': ADDIZIONALI_FONTE,
        'ccr': CCR,
        'profili_gas': PROFILI_GAS,
        'ambiti_gas': AMBITI_GAS,
        'nomi_ambiti': NOMI_AMBITI,
        'regioni': REGIONI,
        'fonte_parametri': {'titolo': f'Portale Offerte, parametri del mercato libero del {oggi.strftime("%d/%m/%Y")}', 'url': f'{PORTALE}/it/open-data.page'},
    }
    open(os.path.join(OUT, 'src', 'dati', 'parametri.js'), 'w', encoding='utf-8').write(
        '// Generato da scripts/bollette-dati.py: non modificare a mano.\nexport default ' + json.dumps(par, ensure_ascii=False, indent=1) + ';\n')
    open(os.path.join(OUT, 'src', 'dati', 'comuni.js'), 'w', encoding='utf-8').write(
        '// Generato da scripts/bollette-dati.py: [codice ISTAT, Comune, sigla, codice Regione].\nexport default ' + json.dumps(comuni(), ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('parametri e comuni scritti')


if __name__ == '__main__':
    main()
