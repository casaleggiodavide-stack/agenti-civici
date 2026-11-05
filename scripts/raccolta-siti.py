#!/usr/bin/env python3
"""Sul sito di ogni gestore della raccolta (dall'elenco operatori ARERA), la pagina dove sta il calendario.

Per ogni sito: legge il robots.txt (regole per tutti e per gli agenti di Anthropic: se uno vieta, si salta),
apre la pagina iniziale e cerca i collegamenti a calendari e raccolta differenziata; tiene i migliori.
È un aiuto: nello strumento il collegamento compare come «trovato in automatico» e si può segnalare se è sbagliato.
Risultati in ~/dati-civici/raccolta/siti.json (riprende da dove si era fermato).

Uso: python3 -I scripts/raccolta-siti.py
"""
import html
import json
import os
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

DATI = os.path.expanduser('~/dati-civici/raccolta')
USCITA = os.path.join(DATI, 'siti.json')
UA = 'PolpoCivico/1.0 (+https://casaleggiodavide-stack.github.io/agenti-civici/)'
AGENTI = ['polpocivico', 'claudebot', 'anthropic-ai', 'claude-web', 'claude-user', 'claude-searchbot']

PAROLE = [(r'calendari', 6), (r'eco-?calendario', 8), (r'porta[- _]?a[- _]?porta', 4), (r'giorni[- _]di[- _]raccolta', 6), (r'quando[- _]passa', 6),
          (r'raccolta[- _]differenziata', 3), (r'raccolta', 2), (r'differenziata', 2), (r'dove[- _]lo[- _]butto|rifiutologo|dizionario', 1),
          (r'comuni[- _]serviti|i[- _]comuni|il[- _]tuo[- _]comune|seleziona[- _]il[- _]comune', 3), (r'servizi', 1)]
NO = re.compile(r'facebook|instagram|twitter|linkedin|youtube|whatsapp|mailto:|tel:|privacy|cookie|login|area-?riservata|lavora|gare|bandi|appalti|trasparen|fornitor', re.I)


def leggi(url, limite=1_500_000):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,*/*'})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.status, r.geturl(), r.read(limite).decode(r.headers.get_content_charset() or 'utf-8', 'replace')


def regole_robots(testo):
    """Gruppi del robots.txt: {agente: [(consenti, schema)]}."""
    gruppi, agenti, in_regole = {}, [], False
    for riga in testo.splitlines():
        riga = riga.split('#', 1)[0].strip()
        if ':' not in riga:
            continue
        k, v = [x.strip() for x in riga.split(':', 1)]
        k = k.lower()
        if k == 'user-agent':
            if in_regole:
                agenti, in_regole = [], False
            agenti.append(v.lower())
            gruppi.setdefault(v.lower(), [])
        elif k in ('allow', 'disallow') and agenti:
            in_regole = True
            for a in agenti:
                gruppi[a].append((k == 'allow', v))
    return gruppi


def consentito(gruppi, percorso):
    def esito(regole):
        migliore = None
        for consenti, schema in regole:
            if not schema:
                continue  # «Disallow:» vuoto non vieta niente
            rx = '^' + re.escape(schema).replace(r'\*', '.*').replace(r'\$', '$') if schema.endswith('$') else '^' + re.escape(schema).replace(r'\*', '.*')
            if re.match(rx, percorso):
                lung = len(schema)
                if not migliore or lung > migliore[0] or (lung == migliore[0] and consenti):
                    migliore = (lung, consenti)
        return True if not migliore else migliore[1]
    for agente in AGENTI:
        propri = [g for nome, g in gruppi.items() if nome != '*' and nome in agente or agente in nome]
        regole = [r for g in propri for r in g] if propri else gruppi.get('*', [])
        if not esito(regole):
            return False
    return True


def esamina(sito):
    if not re.match(r'https?://', sito or ''):
        sito = 'http://' + (sito or '').strip()
    p = urllib.parse.urlsplit(sito)
    base = f'{p.scheme}://{p.netloc}'
    r = {'sito': sito, 'letto': time.strftime('%Y-%m-%d')}
    try:
        try:
            stato, _, robots = leggi(base + '/robots.txt', 300_000)
            gruppi = regole_robots(robots) if stato == 200 else {}
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                return {**r, 'esito': 'robots.txt non leggibile (accesso negato): saltato'}
            gruppi = {}
        if not consentito(gruppi, p.path or '/'):
            return {**r, 'esito': 'vietato dal robots.txt'}
        time.sleep(1.5)
        stato, finale, pagina = leggi(sito)
        if re.search(r'captcha|cf-chl|cf_chl', pagina[:20000], re.I):
            return {**r, 'esito': 'protezione anti-bot: saltato'}
        candidati = {}
        for href, testo in re.findall(r'<a\b[^>]*href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', pagina, re.S | re.I):
            testo = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', testo))).strip()
            url = urllib.parse.urljoin(finale, html.unescape(href.strip()))
            if not url.startswith('http') or NO.search(url) or NO.search(testo):
                continue
            chiave = f'{testo} {urllib.parse.unquote(urllib.parse.urlsplit(url).path)}'.lower()
            punti = sum(peso for schema, peso in PAROLE if re.search(schema, chiave))
            if urllib.parse.urlsplit(url).netloc != urllib.parse.urlsplit(finale).netloc:
                punti -= 2
            if url.lower().endswith('.pdf'):
                punti -= 1  # un PDF dell'anno cambia indirizzo ogni anno: meglio la pagina che lo contiene
            if punti >= 3:
                candidati[url] = max(candidati.get(url, (0, ''))[0], punti), testo[:90]
        migliori = sorted(candidati.items(), key=lambda x: -x[1][0])[:3]
        migliori = [{'url': u, 'testo': t, 'punti': s} for u, (s, t) in migliori if consentito(gruppi, urllib.parse.urlsplit(u).path or '/') or urllib.parse.urlsplit(u).netloc != p.netloc]
        return {**r, 'esito': 'letto', 'finale': finale, 'candidati': migliori}
    except Exception as e:
        return {**r, 'esito': f'non raggiungibile ({type(e).__name__})'}


def main():
    import openpyxl
    wb = openpyxl.load_workbook(os.path.join(DATI, 'operatori-arera.xlsx'), read_only=True)
    righe = wb.active.iter_rows(values_only=True)
    testa = next(righe)
    siti = {}
    for riga in righe:
        d = dict(zip(testa, riga))
        if 'Raccolta e trasporto dei rifiuti urbani' in (d['Settori Attività'] or '') and d['Sito Internet']:
            siti[str(d['Partita IVA'])] = d['Sito Internet'].strip()
    fatti = json.load(open(USCITA, encoding='utf-8')) if os.path.exists(USCITA) else {}
    # si rifanno anche i siti non raggiunti la volta prima (la rete può cadere)
    da_fare = [(piva, s) for piva, s in siti.items() if piva not in fatti or fatti[piva]['esito'].startswith('non raggiungibile')]
    print(f'{len(siti)} siti, {len(da_fare)} da leggere', flush=True)
    with ThreadPoolExecutor(6) as pool:  # siti diversi in parallelo, ognuno con poche richieste lente
        for k, (piva, ris) in enumerate(zip([p for p, _ in da_fare], pool.map(lambda x: esamina(x[1]), da_fare))):
            fatti[piva] = ris
            if k % 25 == 0:
                json.dump(fatti, open(USCITA, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
                print(k, ris['sito'], ris['esito'], (ris.get('candidati') or [{}])[0].get('url', ''), flush=True)
    json.dump(fatti, open(USCITA, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    esiti = {}
    for v in fatti.values():
        esiti[v['esito'].split(' (')[0]] = esiti.get(v['esito'].split(' (')[0], 0) + 1
    print('fatto:', esiti, 'con candidati:', sum(1 for v in fatti.values() if v.get('candidati')), flush=True)


if __name__ == '__main__':
    main()
