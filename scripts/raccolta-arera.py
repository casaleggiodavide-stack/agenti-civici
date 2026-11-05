#!/usr/bin/env python3
"""Chi raccoglie i rifiuti in ogni Comune: la «Ricerca operatori» di ARERA (www.arera.it, robots.txt: Allow /).

Per ogni Comune chiede gli operatori dell'attività «Raccolta e trasporto dei rifiuti urbani» e ne tiene nome e
partita IVA. Lento di proposito (tre richieste alla volta, con una pausa dopo ognuna) e riprende da dove si era fermato:
le risposte stanno in ~/dati-civici/raccolta/arera-comuni.json.
Dati ARERA riusabili con licenza CC BY-SA 4.0 (https://www.arera.it/termini-e-condizioni-uso-del-sito).

Uso: python3 -I scripts/raccolta-arera.py
"""
import html
import json
import os
import re
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

DATI = os.path.expanduser('~/dati-civici/raccolta')
CACHE = os.path.join(DATI, 'arera-comuni.json')
API = 'https://www.arera.it/api/ricercaoperatorirestapi/'
PAGINA = 'https://www.arera.it/area-operatori/ricerca-operatori'
UA = {'User-Agent': 'PolpoCivico/1.0 (+https://casaleggiodavide-stack.github.io/agenti-civici/)'}
PAUSA = 1.0
PARALLELE = 3


def leggi(url, tentativi=4):
    for i in range(tentativi):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return r.read().decode('utf-8', 'ignore')
        except Exception as e:  # rete instabile: si aspetta e si riprova
            if i == tentativi - 1:
                raise
            time.sleep(10 * (i + 1))


def leggi_risultati(url, tentativi=4):
    """Legge la pagina solo fino alla fine dell'elenco dei risultati: il resto non serve (e il server è lento)."""
    for i in range(tentativi):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
                dati = b''
                while True:
                    pezzo = r.read(16384)
                    if not pezzo:
                        break
                    dati += pezzo
                    j = dati.find(b'RicercaOperatori_RisultatiRicerca')
                    if j >= 0 and (dati.find(b'</ul>', j) >= 0 or b'0 risultati trovati' in dati[j:] or len(dati) - j > 60000):
                        break
                return dati.decode('utf-8', 'ignore')
        except Exception:
            if i == tentativi - 1:
                raise
            time.sleep(15 * (i + 1))


def operatori(regione, provincia, comune):
    q = urllib.parse.urlencode({'territorio_ck': 'raccolta_rifiuti_urbani', 'tiporicerca': 'PER_TERRITORIO', 'RA_comuni': '',
                                'cercaPerComuneComboRegione': regione, 'Ricercaoperatori_Province': provincia, 'Ricercaoperatori_Comuni': comune})
    h = leggi_risultati(f'{PAGINA}?{q}')
    i = h.find('RicercaOperatori_RisultatiRicerca')
    if i < 0:
        raise RuntimeError(f'pagina inattesa per {comune}')
    parte = h[i:]
    fine = parte.find('</ul>')
    parte = parte[:fine if fine > 0 else 200000]
    trovati = re.findall(r'OperatorePartitaIva=([0-9A-Za-z]+)">.*?<h3[^>]*>(.*?)</h3>', parte, re.S)
    return [{'piva': p, 'nome': html.unescape(re.sub(r'\s+', ' ', n)).strip()} for p, n in trovati]


def main():
    os.makedirs(DATI, exist_ok=True)
    cache = json.load(open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {'comuni': {}}
    comuni = cache['comuni']
    if not cache.get('elenco'):
        elenco = []
        for r in [f'{i:02d}' for i in range(1, 21)]:
            for p in json.loads(leggi(API + 'provincia/' + r))['data']:
                if p.get('STATO') != 'A' or p.get('DATA_FINE'):
                    continue
                for c in json.loads(leggi(API + 'comune/' + p['CODICE_PROVINCIA']))['data']:
                    if c.get('STATO') != 'A' or c.get('DATA_FINE'):
                        continue  # Comuni soppressi o fusi
                    elenco.append({'regione': r, 'provincia': p['CODICE_PROVINCIA'], 'nome_provincia': p.get('PROVINCIA', ''), 'sigla': p.get('SIGLA', ''),
                                   'istat': c['CODICE_COMUNE'], 'catastale': c.get('CODICE_CATASTALE', ''), 'comune': c['COMUNE']})
                time.sleep(PAUSA / 2)
        cache['elenco'] = elenco
        json.dump(cache, open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False)
    elenco = cache['elenco']
    print(f'{len(elenco)} Comuni, {len(comuni)} già letti', flush=True)
    da_fare = [c for c in elenco if c['istat'] not in comuni]
    blocco = threading.Lock()

    def uno(c):
        try:
            r = operatori(c['regione'], c['provincia'], c['istat'])
        except Exception as e:
            print('errore', c['comune'], e, flush=True)
            return
        with blocco:
            comuni[c['istat']] = r
            if len(comuni) % 50 == 0:
                json.dump(cache, open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False)
                print(len(comuni), c['comune'], r[:1], flush=True)
        time.sleep(PAUSA)

    with ThreadPoolExecutor(PARALLELE) as pool:  # tre richieste alla volta, ognuna seguita da una pausa
        list(pool.map(uno, da_fare))
    cache['letto'] = time.strftime('%Y-%m-%d')
    json.dump(cache, open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False)
    vuoti = sum(1 for v in comuni.values() if not v)
    print(f'fatto: {len(comuni)} Comuni, {vuoti} senza operatore', flush=True)


if __name__ == '__main__':
    main()
