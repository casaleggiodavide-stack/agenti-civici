#!/usr/bin/env python3
"""Affitto: i tuoi diritti. Dalle fonti verificate (affitto/dati/fonti.json) al modulo
affitto/src/dati/fonti.js che usano le regole.

Uso:
  python3 -I scripts/affitto-dati.py             rigenera solo il modulo JS da fonti.json
  python3 -I scripts/affitto-dati.py --verifica  rilegge ogni norma sul sito ufficiale
      (Normattiva con la versione vigente oggi, Gazzetta Ufficiale), controlla che l'estratto
      letterale di ogni regola ci sia ancora, rilegge dall'art. 1284 del codice civile la serie
      dei tassi legali (note di aggiornamento con i decreti del Ministro dell'economia),
      aggiorna verificato_il e tassi_legali in fonti.json, poi rigenera il modulo.

robots.txt letti il 15/11/2026: normattiva.it consente tutto tranne /ricerca/ e /mfr/ricerca/;
gazzettaufficiale.it non ha robots.txt (risponde 404). Una richiesta per volta, pausa di 1,2 s,
User-Agent «PolpoCivico/1.0 (strumenti civici)». Copie dei testi in ~/dati-civici/affitto/verifica/.
Se un estratto non si trova più, lo script si ferma con l'elenco: la norma va riletta a mano.
"""
import datetime
import hashlib
import html
import http.cookiejar
import json
import os
import re
import sys
import time
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTI = os.path.join(REPO, 'affitto', 'dati', 'fonti.json')
USCITA = os.path.join(REPO, 'affitto', 'src', 'dati', 'fonti.js')
CACHE = os.path.expanduser('~/dati-civici/affitto/verifica')
UA = 'PolpoCivico/1.0 (strumenti civici)'
URL_1284 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art1284!vig={oggi}'
MESI = {m: i + 1 for i, m in enumerate('gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre'.split())}


def testo_pulito(s):
    s = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', s, flags=re.S)
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s))
    s = s.replace('’', "'").replace(' ', ' ')
    return re.sub(r'\s+', ' ', s)


def scarica(url, prima=None):
    """Scarica una pagina con una sessione nuova (Normattiva tiene in sessione l'ultimo atto aperto)."""
    os.makedirs(CACHE, exist_ok=True)
    f = os.path.join(CACHE, hashlib.sha1(((prima or '') + url).encode()).hexdigest()[:16] + '.txt')
    apri = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    apri.addheaders = [('User-Agent', UA)]
    for u in ([prima] if prima else []) + [url]:
        with apri.open(u, timeout=60) as r:
            corpo = r.read().decode('utf-8', 'replace')
        time.sleep(1.2)
    t = testo_pulito(corpo)
    with open(f, 'w', encoding='utf-8') as out:
        out.write(url + '\n' + t)
    return t


def tassi_da_1284(t):
    """Dalle note «AGGIORNAMENTO» dell'art. 1284 c.c.: decreto, Gazzetta, misura, decorrenza."""
    righe = []
    patt = re.compile(r"Il Decreto (\d{1,2}) (\w+) (\d{4}) \(in G\.U\. (\d{1,2})/(\d{1,2})/(\d{4}), n\. (\d+)\) ha disposto .{0,80}?\"La misura del saggio degli interessi legali .{0,80}?fissata (?:al|allo|all')\s*([\d,]+)\s*(?:per cento|%) in ragione d'anno, con decorrenza dal (?:1|1°|1o|1º) gennaio (\d{4})")
    for m in patt.finditer(t):
        g, mese, a, gg, mm, aa, n, misura, dec = m.groups()
        righe.append({
            'dal': f'{dec}-01-01',
            'tasso': float(misura.replace(',', '.')),
            'decreto': f'D.M. {int(g)} {mese} {a}',
            'gazzetta': f'GU n. {n} del {int(gg)}/{int(mm)}/{aa}',
        })
    righe.sort(key=lambda r: r['dal'])
    return righe


def verifica(d):
    oggi = datetime.date.today().isoformat()
    mancanti = []
    viste = {}
    for r in d['regole']:
        v = r.get('verifica')
        if not v:
            continue
        url = v['url'].replace('!vig=' + d['verificato_il'], '!vig=' + oggi)
        chiave = (v.get('prima'), url)
        if chiave not in viste:
            print('leggo', url[:110], flush=True)
            viste[chiave] = scarica(url, v.get('prima'))
        if v['estratto'] not in viste[chiave]:
            mancanti.append(f"{r['id']}: «{v['estratto'][:70]}…» non trovato in {url}")
        else:
            v['url'] = url
    t = scarica(URL_1284.format(oggi=oggi))
    tassi = tassi_da_1284(t)
    if len(tassi) < 20:
        mancanti.append(f'tassi legali: lette solo {len(tassi)} righe dall\'art. 1284')
    if mancanti:
        print('\nDA RILEGGERE A MANO:\n' + '\n'.join(mancanti))
        sys.exit(1)
    d['tassi_legali'] = tassi
    d['verificato_il'] = oggi
    with open(FONTI, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(len(viste), 'pagine lette,', len(tassi), 'tassi legali dal', tassi[0]['dal'], 'al', tassi[-1]['dal'])


def costruisci(d):
    if not d.get('tassi_legali'):
        sys.exit('tassi_legali vuoto: lancia prima con --verifica')
    dati = {
        'verificato': d['verificato_il'],
        'avvertenze': d.get('avvertenze', []),
        'regole': {r['id']: {**{k: v for k, v in r.items() if k not in ('id', 'verifica')}} for r in d['regole']},
        'tassi': d['tassi_legali'],
        'tassiFonte': {k: d['tassi_legali_fonte'][k] for k in ('titolo', 'url')},
        'tassiRiscontri': d['tassi_legali_fonte'].get('riscontri_gazzetta', []),
    }
    out = ('// Fonti verificate per «Affitto: i tuoi diritti». File generato da\n'
           '// scripts/affitto-dati.py da affitto/dati/fonti.json: non modificarlo a mano.\n\n'
           f'export default {json.dumps(dati, ensure_ascii=False, indent=1)};\n')
    os.makedirs(os.path.dirname(USCITA), exist_ok=True)
    with open(USCITA, 'w', encoding='utf-8') as f:
        f.write(out)
    print(len(dati['regole']), 'regole,', len(dati['tassi']), 'tassi legali, verificato il', dati['verificato'])


if __name__ == '__main__':
    with open(FONTI, encoding='utf-8') as f:
        fonti = json.load(f)
    if '--verifica' in sys.argv:
        verifica(fonti)
    costruisci(fonti)
