#!/usr/bin/env python3
"""Il Polpo legge per te: «Le trappole sanzionate».

I provvedimenti dell'Autorità garante della concorrenza e del mercato (AGCM) sulle pratiche commerciali
scorrette verso i consumatori (procedimenti PS, Codice del consumo artt. 20-27), sulle clausole vessatorie (CV),
sulle inottemperanze (IP) e su poche altre norme a tutela del consumatore (PV), dal 2024 a oggi: i trucchi
più usati, settore per settore, le sanzioni e il modo per riconoscerli.

Fonti:
  - comunicati stampa e news di www.agcm.it: gli elenchi per anno (…/comunicati-stampa/index?anno=AAAA&limit=0)
    contengono già il testo completo di ogni comunicato, quindi bastano tre richieste per anno;
  - portale open data dati.agcm.it: il dataset «Istruttorie Tutela del Consumatore» (conteggi ufficiali per anno,
    esito e sanzioni). Il portale chiede 10 secondi tra una richiesta e l'altra (Crawl-Delay) e vieta /api/.
  Non si leggono: i testi dei provvedimenti in /dettaglio?tc/ e /dotcmsCustom/tc/ (vietati dal robots.txt per
  tutti gli anni) e i PDF dei bollettini settimanali.

Uso:
  python3 -I -B scripts/legge-antitrust.py --scarica   # aggiorna i grezzi in ~/dati-civici/antitrust/ e rifà tutto
  python3 -I -B scripts/legge-antitrust.py             # rifà derivati e pagina dai grezzi già scaricati

Grezzi:   ~/dati-civici/antitrust/  (robots, html degli elenchi, comunicati.json, csv open data)
Derivati: legge/antitrust/dati/provvedimenti.json è scritto a mano (la lettura dei comunicati: imprese, settore,
          pratica, trappole, sanzione, esito) e qui viene solo letto e controllato contro i grezzi;
          lo script scrive statistiche.json, sintesi.json (le trappole con i rimandi), provvedimenti.csv,
          da_leggere.json (comunicati nuovi non ancora schedati) e legge/antitrust/index.html.
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


# ---------------------------------------------------------------- le trappole (sintesi scritta a mano, rimandi ai casi)
# casi: chiavi dei provvedimenti (primo codice del procedimento, o impresa per i casi senza codice nel comunicato)

GARANZIA, TRUFFE, RECLAMI = '../../garanzia/', '../../truffe/', '../../reclami-pa/'
TRAPPOLE = [
    ('costi-nascosti', 'Il prezzo che cresce alla cassa',
     'Il prezzo esposto è basso; poi, passo dopo passo, si aggiungono commissioni di servizio, costi di consegna, supplementi o tariffe fisse che all\'inizio non erano chiari. A volte il prezzo base semplicemente non si trova, e resta solo il pacchetto più caro (il biglietto con la visita guidata).',
     'Il totale compare solo all\'ultima schermata; spuntano voci come «commissione di servizio», «gestione pratica», «fee»; il prezzo pubblicizzato vale solo a condizioni scritte in piccolo.',
     'Confronta il totale finale, non il prezzo di partenza. Se la commissione non era indicata fin dall\'inizio puoi <a href="{segnala}" target="_blank" rel="noopener">segnalarlo all\'Autorità</a>.',
     ['PS12603', 'CV242', 'PS12974', 'PS12717']),
    ('sovrapprezzo-carta', 'Il sovrapprezzo se paghi con la carta',
     'Il venditore aggiunge qualche euro, o qualche centesimo al litro, se paghi con carta o PayPal. In Italia è vietato: il Codice del consumo (art. 62) non permette di far pagare al cliente lo strumento di pagamento che sceglie.',
     '«+3% con PayPal», «commissione carta», un prezzo alla pompa diverso tra contanti e carta.',
     'Chiedi lo stesso prezzo; fotografa il cartello o lo schermo e <a href="{segnala}" target="_blank" rel="noopener">segnala</a>.',
     ['PS12727', 'IP369', 'La casa della Divisa']),
    ('falsi-sconti', 'Lo sconto su un prezzo mai esistito',
     'Il prezzo «barrato» non è mai stato davvero praticato, oppure il prezzo «in offerta» non è più basso di quello delle settimane prima. Chi annuncia uno sconto deve indicare il prezzo più basso degli ultimi 30 giorni (Codice del consumo, art. 17-bis).',
     'Manca il prezzo più basso dei 30 giorni; lo «sconto» è sempre lì, settimana dopo settimana; il cartellino arriva dalla fabbrica già con due prezzi.',
     'Cerca la riga «prezzo più basso degli ultimi 30 giorni» e confrontala con il prezzo scontato; se manca, <a href="{segnala}" target="_blank" rel="noopener">segnala</a>.',
     ['PS12706', 'PS12804', 'PS12856']),
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
     'Entrare è un clic, uscire un percorso a ostacoli: rinnovo automatico senza preavviso, scadenza per la disdetta taciuta, aumenti annunciati in mail che sembrano pubblicità, disdette ignorate e fatture che continuano.',
     'Il contratto non dice chiaramente come e quando disdire; la disdetta si fa solo al telefono; il servizio clienti prova a «trattenerti».',
     'Segna la data di rinnovo e disdici per iscritto (PEC o raccomandata), conservando la ricevuta. Per i contratti online o fuori dai negozi hai 14 giorni di ripensamento: <a href="' + GARANZIA + '">prepara la lettera</a>.',
     ['PS12879', 'PS12558', 'PS12853']),
    ('non-richiesti', 'Il servizio che non hai chiesto',
     'Ti ritrovi un contratto, un dispositivo o un contributo mai chiesto: forniture di luce e gas attivate senza firma, accessori a pagamento installati sull\'ascensore, il conto spostato in un\'altra banca, un «contributo verde» imposto.',
     'In bolletta o in fattura compare una voce nuova; ti dà il benvenuto un fornitore che non hai scelto.',
     'Non pagare ciò che non hai chiesto: per le forniture non richieste non è dovuto nulla (Codice del consumo, art. 66-quinquies). Contesta per iscritto e <a href="{segnala}" target="_blank" rel="noopener">segnala</a>.',
     ['PS12557', 'PS12789', 'PS12660']),
    ('travestimenti', 'Chi si spaccia per un altro',
     'Il call center dice di chiamare «dall\'Autorità» o dall\'ufficio tecnico del tuo fornitore; il sito ha il nome e la grafica della compagnia di traghetti ma è un rivenditore con le sue commissioni; il modulo sembra un aggiornamento gratuito dei dati dell\'impresa e invece è un contratto.',
     'Chi chiama annuncia rincari o guasti imminenti e ti offre la soluzione; l\'indirizzo del sito non è quello ufficiale; nel modulo c\'è una firma e una cifra in piccolo.',
     'Riaggancia e richiama tu il numero che trovi in bolletta. Per un messaggio o un sito sospetto chiedi al Polpo <a href="' + TRUFFE + '">se è una truffa</a>.',
     ['PS12978', 'PS12898', 'IP367']),
    ('dopo-vendita', 'Dopo il pagamento, il silenzio',
     'Il prodotto arriva in ritardo, incompleto o diverso; l\'assistenza non risponde; il rimborso non arriva; per avere quello che ti spetta servono passaggi inutili, come un\'attestazione da chiedere in stazione o un reclamo entro pochi giorni.',
     'Disponibilità «immediata» su prodotti che non ci sono; tempi strettissimi per i reclami; nessun contatto, solo un modulo.',
     'La garanzia legale dura due anni e il venditore deve riparare, sostituire o rimborsare: <a href="' + GARANZIA + '">il Polpo scrive la richiesta</a>. Per i servizi pubblici, come bus e metro, si comincia dal <a href="' + RECLAMI + '">reclamo all\'ente</a>.',
     ['PS12515', 'PS12580', 'PS13019']),
    ('green-etica', 'Verde ed etico solo a parole',
     '«Impatto zero», «100% green», «circolare», «rispettiamo i lavoratori»: affermazioni generiche o smentite dai fatti, usate per vendere. Qui rientra anche la beneficenza annunciata ma non davvero legata all\'acquisto.',
     'Parole assolute senza numeri né certificazioni; compensazioni presentate come assenza di emissioni; la linea «sostenibile» è una piccola parte del catalogo.',
     'Cerca dati verificabili: quale fase del ciclo di vita, quale certificazione. La direttiva europea 2024/825 vieta i vanti ambientali generici e chiede di applicare le nuove regole dal 27 settembre 2026.',
     ['PS12525', 'PS12793', 'PS12709']),
    ('promesse', 'La promessa che il prodotto non mantiene',
     'Auto «italiane» fatte in Cina, autonomia delle auto elettriche indicata solo in teoria, solari che «si rinforzano» con l\'acqua, tabacco «senza fumo» presentato come innocuo, un «cashback» che in realtà è un investimento, un abbonamento «senza limiti» pieno di limiti.',
     'Superlativi senza prove; la frase forte nello spot e la smentita nel foglietto o nelle condizioni.',
     'Leggi condizioni e foglietto prima di comprare. Se il prodotto non è come promesso è un difetto di conformità: <a href="' + GARANZIA + '">fai valere la garanzia</a>.',
     ['PS12638', 'PS12940', 'PS12985']),
    ('recensioni', 'Recensioni, classifiche e consigli comprati',
     'Recensioni non controllate anche quando sono segnate come «verificate», comparatori pagati dai fornitori che non spiegano come ordinano le offerte, influencer che non dicono di fare pubblicità e gonfiano i follower.',
     'Solo recensioni entusiaste; manca la scritta «pubblicità» o #adv; il comparatore non dice chi lo paga.',
     'Leggi le recensioni negative e le più recenti; chiediti chi paga il comparatore. Ad ottobre 2026 l\'Autorità ha pubblicato le Linee guida sulle recensioni online.',
     ['PS12962', 'PS12578', 'PS12814']),
    ('clausole', 'Le clausole scritte a senso unico',
     'Nel contratto ci sono regole che pesano solo su di te: una tariffa fissa per ogni multa presa con l\'auto a noleggio, il diritto dell\'azienda di cambiare servizio e prezzi quando vuole, limiti al recesso, il tribunale lontano da casa. Dal 2022 l\'Autorità può multare anche le clausole vessatorie.',
     '«La società può modificare in qualsiasi momento…», «penale», «fee amministrativa», un foro competente diverso dalla tua residenza.',
     'Una clausola vessatoria non vale anche se l\'hai firmata: contestala per iscritto. Il giudice competente è quello del luogo in cui vive il consumatore.',
     ['CV242', 'PS12922', 'PS12954']),
    ('dati-account', 'I tuoi dati e il tuo account come merce',
     'Consensi all\'uso dei dati chiesti con spiegazioni incomplete; account o conti bloccati senza preavviso, senza spiegazioni e senza possibilità di replica, a volte con i tuoi soldi dentro.',
     'Il pulsante «accetta tutto» in evidenza e il rifiuto nascosto; nessuna indicazione su come contestare un blocco.',
     'Scegli «personalizza» e limita i consensi. Se il conto è bloccato chiedi per iscritto il motivo e i tempi, poi <a href="{segnala}" target="_blank" rel="noopener">segnala</a>.',
     ['PS12974', 'PS12566', 'PS12714']),
    ('minori', 'Ragazzi e persone fragili nel mirino',
     'Sfide social pericolose rilanciate dall\'algoritmo, snack venduti come «sfida», dispositivi al tabacco presentati come oggetti di design, venditori a domicilio che insistono con le persone anziane.',
     'Pubblicità che punta sull\'emulazione e sulla sfida; avvertenze assenti; acquisti dentro i giochi in monete virtuali che nascondono il prezzo in euro.',
     'Imposta i controlli parentali al livello più protettivo. Ricorda a chi è più fragile che dopo una vendita a domicilio ci sono 14 giorni per ripensarci: <a href="' + GARANZIA + '">ecco come</a>.',
     ['PS12543', 'PS12661', 'PS12524']),
]

# comunicati sui consumatori letti ma senza scheda nel catalogo, con il motivo
LETTI_SENZA_SCHEDA = {
    'PS12483': 'verifica degli impegni accettati nel 2023',
    'PS12615-PS12616-PS12617': 'sanzioni deliberate a fine 2023',
    'Grazie-a-impegni-presi-con-Autorita': 'riepilogo di decisioni del 2023 sull\'energia',
}


def chiave(d):
    n = d['numeri'][0] if d['numeri'] else ''
    return n if n and not n.startswith('(') else d['imprese'][0]


# ---------------------------------------------------------------- derivati

def euro_t(v, nota=None):
    return (f'{nota} ' if nota else '') + _dossier.euro(v).replace(',0 ', ' ')


def derivati():
    cat = json.load(open(os.path.join(DATI, 'provvedimenti.json'), encoding='utf-8'))
    dec = cat['decisioni']
    for d in dec:
        d['chiave'] = chiave(d)
        d['anno'] = int(d['data'][:4])
        d.setdefault('norma', d['numeri'][0][:2] if d['numeri'] and not d['numeri'][0].startswith('(') else 'PS')
    per_chiave = {d['chiave']: d for d in dec}
    assert len(per_chiave) == len(dec), 'chiavi doppie nel catalogo'

    # controllo contro i grezzi: ogni rimando esiste, e cosa resta da leggere
    testi = comunicati_elenco() + news_testi()
    json.dump(testi, open(os.path.join(GREZZI, 'comunicati.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    noti = {t['url'] for t in testi}
    usati = {x['url'] for x in dec + cat['moral_suasion'] + cat['in_corso']}
    mancanti = sorted(usati - noti)
    if mancanti:
        print('ATTENZIONE: rimandi non trovati nei grezzi:', *mancanti, sep='\n  ')
    consumatori = [t for t in testi if re.match(r'(PS|CV|IP|PV)\d', t['titolo']) or re.search(r'surcharge|ristori a consumatori|Moral suasion', t['titolo'])]
    avvii_seguiti = {n for d in dec for n in d['numeri']}
    da_leggere = []
    for t in consumatori:
        if t['url'] in usati or any(k in t['url'] for k in LETTI_SENZA_SCHEDA):
            continue
        codici = set(re.findall(r'(?:PS|CV|IP|PV)\d+', t['titolo']))
        if codici and codici <= avvii_seguiti | {'PS12810', 'PS12811', 'PS12812', 'PS12813', 'PS12977', 'PS12979', 'PS12793', 'PS12805', 'PV27'}:
            continue   # avvio di un procedimento già chiuso nel catalogo
        da_leggere.append({'data': t['data'], 'titolo': t['titolo'], 'url': t['url']})
    json.dump(da_leggere, open(os.path.join(DATI, 'da_leggere.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if da_leggere:
        print(f'{len(da_leggere)} comunicati da leggere e schedare (dati/da_leggere.json)')

    # numeri
    sanz = [d for d in dec if d['euro'] > 0]
    imprese = {i for d in dec for i in d['imprese'] if 'persone fisiche' not in i}
    procedimenti = sum(max(1, len(d['numeri'])) for d in dec)
    per_anno = collections.OrderedDict()
    for d in sorted(dec, key=lambda d: d['data']):
        a = per_anno.setdefault(d['anno'], {'decisioni': 0, 'sanzioni': 0, 'impegni': 0, 'euro': 0})
        a['decisioni'] += 1
        a['euro'] += d['euro']
        a['sanzioni'] += d['euro'] > 0
        a['impegni'] += d['esito'] == 'impegni'
    per_settore = {}
    for d in dec:
        s = per_settore.setdefault(d['settore'], {'decisioni': 0, 'sanzioni': 0, 'euro': 0, 'trappole': collections.Counter()})
        s['decisioni'] += 1
        s['sanzioni'] += d['euro'] > 0
        s['euro'] += d['euro']
        s['trappole'].update(d['trappole'])
    per_trappola = {}
    for t in TRAPPOLE:
        ds = [d for d in dec if t[0] in d['trappole']]
        ms = [m for m in cat['moral_suasion'] if t[0] in m['trappole']]
        per_trappola[t[0]] = {'decisioni': len(ds), 'sanzioni': sum(d['euro'] > 0 for d in ds), 'euro': sum(d['euro'] for d in ds),
                              'moral_suasion': len(ms), 'settori': [s for s, _ in collections.Counter(d['settore'] for d in ds).most_common()]}
    stat = {
        'periodo': [min(d['data'] for d in dec), max(d['data'] for d in dec)],
        'comunicati_letti': len(consumatori),
        'decisioni': len(dec), 'procedimenti': procedimenti, 'imprese': len(imprese),
        'con_sanzione': len(sanz), 'impegni': sum(d['esito'] == 'impegni' for d in dec),
        'inottemperanze': sum(d['esito'] == 'inottemperanza' for d in dec),
        'euro_totale': sum(d['euro'] for d in dec),
        'moral_suasion': len(cat['moral_suasion']), 'in_corso': len(cat['in_corso']),
        'per_anno': per_anno,
        'per_settore': {k: {**v, 'trappole': dict(v['trappole'].most_common())} for k, v in sorted(per_settore.items(), key=lambda x: -x[1]['euro'])},
        'per_trappola': per_trappola,
        'sanzioni_piu_alte': [{k: d.get(k) for k in ('data', 'numeri', 'imprese', 'settore', 'pratica', 'euro', 'euro_nota', 'url', 'tar')}
                              for d in sorted(sanz, key=lambda d: -d['euro'])[:10]],
        'open_data': open_data(),
    }
    json.dump(stat, open(os.path.join(DATI, 'statistiche.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=int)

    sintesi = {'nota': 'Le trappole sono una lettura dei comunicati dell\'AGCM fatta con un assistente AI e controllata a mano. '
                       'Una decisione può ricadere in più trappole: gli euro di una decisione contano per ogni trappola che contiene.',
               'trappole': []}
    for tid, titolo, come, ricon, fare, casi in TRAPPOLE:
        sintesi['trappole'].append({'id': tid, 'titolo': titolo, 'come_funziona': come, 'come_riconoscerla': ricon,
                                    'cosa_fare': re.sub(r'<[^>]+>', '', fare.format(segnala=SEGNALA)), **per_trappola[tid],
                                    'casi': [{'imprese': per_chiave[c]['imprese'], 'numeri': per_chiave[c]['numeri'], 'data': per_chiave[c]['data'],
                                              'esito': per_chiave[c]['esito'], 'euro': per_chiave[c]['euro'], 'url': per_chiave[c]['url']} for c in casi]})
    json.dump(sintesi, open(os.path.join(DATI, 'sintesi.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    with open(os.path.join(DATI, 'provvedimenti.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['data_comunicato', 'numeri', 'imprese', 'settore', 'norma', 'pratica', 'trappole', 'esito', 'sanzione_euro', 'nota_importo', 'ricorso_tar', 'url'])
        for d in sorted(dec, key=lambda d: d['data']):
            w.writerow([d['data'], ' '.join(d['numeri']), '; '.join(d['imprese']), d['settore'], d['norma'], d['pratica'], ' '.join(d['trappole']),
                        d['esito'], d['euro'], d.get('euro_nota', ''), (d.get('tar') or {}).get('testo', ''), d['url']])
    return cat, dec, per_chiave, stat, {t['url']: t for t in testi}


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
  .ordinabile td.pratica { min-width: 240px; }
'''


class Fonti:
    def __init__(self, titoli):
        self.ordine, self.titoli = [], titoli

    def c(self, url, titolo=''):
        if url not in self.ordine:
            self.ordine.append(url)
        t = titolo or self.titoli.get(url, {}).get('titolo', '')
        return _dossier.cit(self.ordine.index(url) + 1, url, t)

    def elenco(self, extra):
        out = []
        for u in self.ordine:
            if u in extra:
                out.append((extra[u], u))
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


def pagina(cat, dec, per_chiave, stat, titoli):
    F = Fonti(titoli)
    od = stat['open_data']
    url_od = od['fonte']['dataset']
    extra = {url_od: 'AGCM, portale open data: Istruttorie Tutela del Consumatore (CSV, licenza CC BY 4.0)',
             SEGNALA: 'AGCM, segnalazione online di una pratica scorretta'}
    for d in dec:
        if d.get('tar'):
            testata = next((v for k, v in TESTATE.items() if k in d['tar']['url']), urllib.parse.urlsplit(d['tar']['url']).netloc)
            extra[d['tar']['url']] = f"{testata}, sul ricorso al TAR ({' '.join(d['numeri'])}, {d['imprese'][0]})"
    it = _dossier.it
    pt = stat['per_trappola']
    trap_tit = {t[0]: t[1] for t in TRAPPOLE}
    mx = max(v['decisioni'] for v in pt.values())
    top_n = [k for k in pt if pt[k]['decisioni'] == mx]
    top_e = max(pt, key=lambda k: pt[k]['euro'])
    alte = sorted([d for d in dec if d['euro'] > 0], key=lambda d: -d['euro'])
    s = lambda k: per_chiave[k]
    sett_top = next(iter(stat['per_settore']))
    ristori = [s('PS12743'), s('PS12925'), s('PS12805'), s('PS12689')]
    anni_od = od['per_anno']
    a24, a25 = anni_od.get(2024), anni_od.get(2025)

    breve = [
        f"Abbiamo letto {stat['comunicati_letti']} comunicati e notizie dell'Antitrust sui consumatori, da gennaio 2024 a ottobre 2026. Raccontano "
        f"<b>{stat['decisioni']} decisioni</b> finali su {stat['procedimenti']} procedimenti: {stat['con_sanzione']} con una multa, {stat['impegni']} chiuse con impegni, "
        f"per un totale di <b>circa {euro_t(stat['euro_totale'])} di euro</b> di sanzioni. Coinvolgono {stat['imprese']} società, spesso più d'una per lo stesso gruppo.",
        f"La multa più alta: {euro_t(alte[0]['euro'], alte[0].get('euro_nota'))} per i biglietti del Colosseo introvabili a prezzo base{F.c(alte[0]['url'])}. "
        f"Poi {euro_t(s('CV242')['euro'], 'oltre')} a sei società di autonoleggio per la tariffa fissa sulle multe{F.c(s('CV242')['url'])}, "
        f"{euro_t(s('PS12974')['euro'])} a Revolut{F.c(s('PS12974')['url'])}, 10 mln ciascuno ad Amazon{F.c(s('PS12585')['url'])} e TikTok{F.c(s('PS12543')['url'])}.",
        f"{'Le trappole che tornano più spesso sono ' if len(top_n) > 1 else 'La trappola che torna più spesso è '}{' e '.join('«' + trap_tit[k] + '»' for k in top_n)} ({mx} decisioni{' ciascuna' if len(top_n) > 1 else ''}); quella costata di più alle imprese è «{trap_tit[top_e]}» "
        f"({euro_t(pt[top_e]['euro'])}). Il settore con più euro di sanzioni: {minuscola(sett_top)} ({euro_t(stat['per_settore'][sett_top]['euro'])}).",
        f"Quando un'impresa si impegna a cambiare, spesso paga i clienti: oltre 5 mln da Enel Energia a più di 40.000 clienti{F.c(ristori[0]['url'])}, "
        f"oltre 3 mln da ATAC agli abbonati di Roma{F.c(ristori[1]['url'])}, circa 1,5 mln da Ryanair a chi ha pagato il check-in in aeroporto{F.c(ristori[3]['url'])}.",
    ]
    if a24 and a25:
        breve.append(
            f"I comunicati sono solo una parte. Nei conti ufficiali dell'Autorità le decisioni a tutela dei consumatori sono state {a24['decisioni']} nel 2024 e "
            f"{a25['decisioni']} nel 2025; quelle con sanzione {a24['con_sanzione']} e {a25['con_sanzione']}, per {euro_t(a24['euro'])} e {euro_t(a25['euro'])} di euro{F.c(url_od)}. "
            f"Le decisioni comunicate valgono però la gran parte delle multe: circa il {round(100 * stat['per_anno'][2024]['euro'] / a24['euro'])}% degli euro del 2024 "
            f"e il {round(100 * stat['per_anno'][2025]['euro'] / a25['euro'])}% di quelli del 2025.")
    breve.append(f"Una multa non è una sentenza definitiva: le imprese possono ricorrere al TAR del Lazio. Per Mondo Convenienza il TAR ha confermato la sanzione"
                 f"{F.c(s('PS12515')['tar']['url'])}, per due operatori del Colosseo ha respinto i ricorsi{F.c(s('PS12603')['tar']['url'])}; "
                 f"per gli altri casi l'esito non lo abbiamo verificato.")

    # le trappole
    schede = []
    for tid, titolo, come, ricon, fare, casi in TRAPPOLE:
        p = pt[tid]
        casi_html = ''.join(
            f"<li><a href=\"{esc(s(c)['url'])}\" target=\"_blank\" rel=\"noopener\">{imprese_breve(s(c))}</a> ({s(c)['data'][:4]}): "
            f"{esc(s(c)['pratica'])}. <b>{euro_t(s(c)['euro'], s(c).get('euro_nota')) + ' di sanzione' if s(c)['euro'] else 'Impegni' if s(c)['esito'] == 'impegni' else ''}</b>"
            f"{F.c(s(c)['url'])}</li>" for c in casi)
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
                                  (esc(trap_tit[next(iter(v['trappole']))]), trap_tit[next(iter(v['trappole']))])] for k, v in ps.items()], 3)

    # sanzioni più alte (tutte quelle con multa, ordinabili)
    righe = []
    for d in alte:
        tar = d.get('tar')
        righe.append([(esc(data_it(d['data'])), d['data']), (imprese_breve(d, 3), ', '.join(d['imprese'])), (esc(d['settore']), d['settore']),
                      (esc(d['pratica']), d['pratica']), (euro_t(d['euro'], d.get('euro_nota')), d['euro']),
                      (f'<a href="{esc(tar["url"])}" target="_blank" rel="noopener">{esc(tar["testo"])}</a>' if tar else 'non verificato', tar['testo'] if tar else ''),
                      (f'<a href="{esc(d["url"])}" target="_blank" rel="noopener">{esc(" ".join(d["numeri"]) if d["numeri"] and not d["numeri"][0].startswith("(") else "comunicato")}</a>', d['url'])])
    tab_alte = _dossier.tabella('t-sanzioni', [('Data', 't'), ('Impresa', 't'), ('Settore', 't'), ('Pratica', 't'), ('Sanzione', 'n'), ('Ricorso al TAR', 't'), ('Comunicato', 't')], righe, 4)

    aperti = ''.join(f"<li><b>{esc(', '.join(x['imprese'][:2]))}</b> ({data_it(x['data'])}): {esc(x['pratica'])}{F.c(x['url'])}</li>"
                     for x in sorted(cat['in_corso'], key=lambda x: x['data'], reverse=True))

    bf = [
        f"<b>Guarda il prezzo più basso degli ultimi 30 giorni.</b> Ogni sconto deve indicarlo. Se manca, o se il prezzo «in offerta» non è più basso, è la trappola dello sconto finto, sanzionata per esempio a Tannico{F.c(s('PS12820')['url'])} e Bernabei{F.c(s('PS12804')['url'])}. <a href=\"#falsi-sconti\">Scheda</a>.",
        f"<b>Un timer non è una scadenza.</b> Se il conto alla rovescia riparte, la fretta è finta: Deghi è stata multata per 2 mln proprio così{F.c(s('PS13027')['url'])}. Metti il prodotto nel carrello e riguardalo il giorno dopo. <a href=\"#fretta\">Scheda</a>.",
        f"<b>Conta il totale, non il prezzo di partenza.</b> Consegna, commissioni e «servizi» devono essere chiari dall'inizio; e pagare con carta o PayPal non può costare di più. Schede: <a href=\"#costi-nascosti\">costi nascosti</a> · <a href=\"#sovrapprezzo-carta\">sovrapprezzo sulla carta</a>.",
        f"<b>Togli le spunte che non hai messo tu.</b> Acquisto periodico, abbonamento «Plus», prova gratuita che si rinnova: controlla ogni casella prima di pagare (Amazon{F.c(s('PS12585')['url'])}, eDreams{F.c(s('PS12853')['url'])}). <a href=\"#preselezioni\">Scheda</a>.",
        f"<b>Dopo l'acquisto hai dei diritti, e attenzione ai messaggi.</b> Online hai 14 giorni per ripensarci e due anni di garanzia: <a href=\"{GARANZIA}\">il Polpo prepara la lettera</a>. In questi giorni arrivano anche finti avvisi di pacchi e offerte: <a href=\"{TRUFFE}\">controlla se è una truffa</a>. E se trovi una trappola, <a href=\"{SEGNALA}\" target=\"_blank\" rel=\"noopener\">segnalala all'Antitrust</a> (numero verde 800.166.661).",
    ]

    met = _dossier.metodo(
        f"Gli elenchi annuali dei comunicati stampa e delle news del sito dell'Autorità dal 2024 al 2026 ({stat['comunicati_letti']} testi sui consumatori, letti per intero), "
        f"e il dataset aperto «Istruttorie Tutela del Consumatore» per i conteggi ufficiali di 2024 e 2025{F.c(url_od)}. Abbiamo schedato {stat['decisioni']} decisioni finali, "
        f"{stat['moral_suasion']} interventi informali («moral suasion») e {stat['in_corso']} istruttorie ancora aperte.",
        "Per ogni decisione abbiamo annotato numero del procedimento, data del comunicato, imprese come le nomina l'Autorità, settore, pratica, esito e sanzione; "
        "poi abbiamo raggruppato le pratiche in 15 trappole descritte con parole semplici. Una decisione può stare in più trappole. "
        "Per le multe più alte abbiamo cercato notizie sui ricorsi al TAR.",
        "I comunicati raccontano le decisioni più rilevanti, non tutte: il confronto con i conteggi ufficiali dice quante ne mancano. "
        "Non abbiamo letto i testi integrali dei provvedimenti (il sito ne vieta la lettura automatica) né i bollettini settimanali. "
        "Alcune cifre sono arrotondate dall'Autorità («oltre 18 milioni», «quasi 20 milioni») e le prendiamo così. "
        "I conteggi del 2026 arrivano al 2 novembre e gli open data ufficiali non coprono ancora il 2026. Le persone fisiche coinvolte non sono nominate. "
        "Una sanzione può essere ridotta o annullata dal giudice: l'esito dei ricorsi lo indichiamo solo dove l'abbiamo trovato.",
        data_it(datetime.date.today().isoformat()))

    corpo = f'''    <section id="in-breve"><h2>In breve</h2>
      <ul class="lista">{''.join(f'<li>{b}</li>' for b in breve)}</ul></section>
    <section id="trappole"><h2>Le trappole</h2>
      <p>Quindici trucchi, ricavati dalle decisioni dell'Antitrust. Per ognuno: come funziona, dove si trova, i casi sanzionati, come riconoscerlo e cosa fare.</p>
      <ol class="trappole">{''.join(schede)}</ol></section>
    <section id="settori"><h2>Settore per settore</h2>
      <p>Gli euro di sanzione nelle decisioni comunicate, per settore. Le decisioni chiuse con impegni non hanno multa ma spesso portano rimborsi.</p>
      <figure class="dato"><figcaption>SANZIONI PER SETTORE, 2024-2026</figcaption>{barre}</figure>
      {tab_sett}</section>
    <section id="sanzioni"><h2>Le sanzioni più alte</h2>
      <p>Tutte le decisioni con multa che l'Autorità ha comunicato dal 2024, dalla più alta. Clicca sui titoli per ordinare. Le imprese possono ricorrere al TAR del Lazio e poi al Consiglio di Stato: dove abbiamo trovato l'esito lo riportiamo.</p>
      {tab_alte}
      <h3>Ancora sotto esame</h3>
      <p>Istruttorie aperte di cui non abbiamo trovato la conclusione. L'avvio di un'istruttoria non è una condanna.</p>
      <ul class="lista">{aperti}</ul></section>
    <section id="black-friday"><h2>Prima del Black Friday</h2>
      <p>Il 27 novembre è il giorno degli sconti. Cinque controlli, presi dalle trappole sanzionate.</p>
      <ol class="consigli">{''.join(f'<li><span>{b}</span></li>' for b in bf)}</ol></section>
    <section id="metodo"><h2>Come l'abbiamo letto</h2>{met}</section>
    <section id="fonti"><h2>Fonti</h2>{F.elenco(extra)}</section>'''

    return _dossier.pagina(
        prof='../../', titolo='Le trappole sanzionate',
        descrizione='Le decisioni dell\'Antitrust sulle pratiche commerciali scorrette dal 2024: i trucchi più usati, settore per settore, le multe e come riconoscerli prima del Black Friday.',
        occhiello='Il Polpo legge per te · Antitrust e consumatori',
        h1='Le trappole sanzionate',
        intro=f"L'Antitrust multa le imprese che ingannano i consumatori. Abbiamo letto tutto quello che ha comunicato dal 2024: {stat['decisioni']} decisioni, "
              f"circa {euro_t(stat['euro_totale'])} di euro di sanzioni, quindici trappole che si ripetono. Ecco come riconoscerle.",
        corpo=corpo, braccio=3, css_extra=CSS)


def main():
    if '--scarica' in sys.argv:
        scarica()
    os.makedirs(DATI, exist_ok=True)
    cat, dec, per_chiave, stat, titoli = derivati()
    open(os.path.join(CARTELLA, 'index.html'), 'w', encoding='utf-8').write(pagina(cat, dec, per_chiave, stat, titoli))
    print(f"legge/antitrust/index.html scritta: {stat['decisioni']} decisioni, {stat['con_sanzione']} sanzioni, {_dossier.it(stat['euro_totale'])} euro")


if __name__ == '__main__':
    main()
