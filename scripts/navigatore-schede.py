#!/usr/bin/env python3
"""Navigatore dei servizi: dalle schede verificate (navigatore/dati/schede-*.json) al modulo
navigatore/src/pratiche.js usato dalla pagina, dall'Assistente e dal server MCP.
Le schede sono scritte a mano o da ricerche sulle sole fonti ufficiali; qui si normalizzano.
Uso: python3 -I scripts/navigatore-schede.py
"""
import glob, json, os, re

QUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(QUI)
CARTELLA = os.path.join(REPO, 'navigatore')

CATEGORIE = {
    'anagrafe': 'Residenza, documenti e identità digitale',
    'famiglia': 'Nascite, matrimoni, separazioni e lutti',
    'stranieri': 'Stranieri e cittadinanza',
    'salute': 'Salute e disabilità',
    'scuola': 'Scuola e figli piccoli',
    'lavoro': 'Lavoro, disoccupazione e pensione',
    'fisco': 'Tasse, ISEE e pagamenti',
    'auto': 'Auto e patente',
    'casa': 'Casa, affitto e utenze',
}
REGOLE = [  # (parola nell'id, categoria)
    ('residenza-patente', 'auto'), ('patente', 'auto'), ('auto', 'auto'), ('bollo', 'auto'), ('proprieta', 'auto'), ('veicol', 'auto'),
    ('cittadinanza', 'stranieri'), ('soggiorno', 'stranieri'), ('ospitalita', 'casa'), ('cessione', 'casa'),
    ('residenza', 'anagrafe'), ('identita', 'anagrafe'), ('passaporto', 'anagrafe'), ('spid', 'anagrafe'), ('certificat', 'anagrafe'), ('aire', 'anagrafe'), ('codice-fiscale', 'anagrafe'),
    ('nascita', 'famiglia'), ('matrimonio', 'famiglia'), ('unione', 'famiglia'), ('decesso', 'famiglia'), ('successione', 'famiglia'), ('divorzio', 'famiglia'), ('assegno-unico', 'famiglia'),
    ('medico', 'salute'), ('sanitari', 'salute'), ('ticket', 'salute'), ('invalidita', 'salute'), ('104', 'salute'), ('contrassegno', 'salute'), ('cude', 'salute'),
    ('scuola', 'scuola'), ('nido', 'scuola'),
    ('naspi', 'lavoro'), ('disoccupazione', 'lavoro'), ('pensione', 'lavoro'), ('dimissioni', 'lavoro'), ('impiego', 'lavoro'), ('did', 'lavoro'),
    ('isee', 'fisco'), ('730', 'fisco'), ('redditi', 'fisco'), ('pagopa', 'fisco'), ('f24', 'fisco'), ('rateizz', 'fisco'), ('cartell', 'fisco'),
    ('affitto', 'casa'), ('locazione', 'casa'), ('ristruttur', 'casa'), ('bonus-casa', 'casa'), ('voltura', 'casa'), ('utenze', 'casa'),
]
# collegamenti con gli altri agenti civici: id pratica (o parte) -> chiavi di COLLEGATI
COLLEGA = {'isee': ['mi-spetta'], 'nido': ['mi-spetta'], 'assegno-unico': ['mi-spetta'], 'nascita': ['mi-spetta'], 'ticket': ['mi-spetta'],
           'naspi': ['mi-spetta'], 'invalidita': ['mi-spetta'], 'pensione': ['mi-spetta'], 'voltura': ['mi-rimborsano'], 'cartell': ['chiedo-gli-atti']}
ONLINE = {'sì': 'si', 'si': 'si', 'yes': 'si', 'parziale': 'parziale', 'no': 'no'}


def categoria(pid):
    for k, c in REGOLE:
        if k in pid:
            return c
    return 'anagrafe'


def lista(x):
    if x is None:
        return []
    if isinstance(x, list):
        return [str(v).strip() for v in x if v]
    return [str(x).strip()]


def testo(x):
    if x is None:
        return None
    if isinstance(x, dict):
        return x.get('testo')
    if isinstance(x, list):
        return ' '.join(str(v) for v in x)
    return str(x)


def https(f):
    return isinstance(f, dict) and str(f.get('url', '')).startswith('https://')


def main():
    pratiche, verificati = [], set()
    for p in sorted(glob.glob(os.path.join(CARTELLA, 'dati', 'schede-*.json'))):
        d = json.load(open(p, encoding='utf-8'))
        verificati.add(d.get('verificato_il'))
        for s in d['pratiche']:
            on = s.get('online') or {}
            stato = ONLINE.get(str(on.get('stato') or '').lower(), 'parziale' if on.get('url') else 'no')
            fonti = [f for f in s.get('fonti', []) if https(f)]
            norme = [f for f in (s.get('norma') if isinstance(s.get('norma'), list) else [s.get('norma')] if s.get('norma') else []) if https(f)]
            if not fonti:
                raise SystemExit(f"scheda senza fonte https: {s['id']}")
            pid = s['id']
            pratiche.append({
                'id': pid,
                'titolo': s['titolo'],
                'categoria': s.get('categoria') or categoria(pid),
                'sinonimi': lista(s.get('sinonimi')),
                'chi': testo(s.get('chi')),
                'dove': testo(s.get('dove')),
                'online': {'stato': stato, 'url': on.get('url') if str(on.get('url') or '').startswith('https://') else None, 'note': on.get('note')},
                'passi': lista(s.get('passi')),
                'documenti': lista(s.get('documenti')),
                'costo': testo(s.get('costo')),
                'tempi': testo(s.get('tempi')),
                'scadenze': testo(s.get('scadenze_obblighi') or s.get('scadenze')),
                'attenzione': lista(s.get('attenzione')),
                'norme': norme,
                'fonti': fonti,
                'collegati': sorted({c for k, cs in COLLEGA.items() if k in pid for c in cs}),
                'verificato': s.get('verificato_il') or d.get('verificato_il'),
            })
    pratiche.sort(key=lambda p: (list(CATEGORIE).index(p['categoria']), p['titolo']))
    js = ('// Schede delle pratiche verificate sulle fonti ufficiali. File generato da scripts/navigatore-schede.py:\n'
          '// non modificarlo a mano, modifica navigatore/dati/schede-*.json e rigeneralo.\n\n'
          f"export const VERIFICATO = '{max(v for v in verificati if v)}';\n\n"
          f"export const CATEGORIE = {json.dumps({k: {'nome': v} for k, v in CATEGORIE.items()}, ensure_ascii=False, indent=2)};\n\n"
          "export const COLLEGATI = {\n"
          "  'mi-spetta': { strumento: 'mi-spetta', testo: 'Controlla a quali bonus hai diritto con Mi spetta' },\n"
          "  'mi-rimborsano': { strumento: 'mi-rimborsano', testo: 'Bolletta sbagliata? Prova Mi rimborsano?' },\n"
          "  'chiedo-gli-atti': { strumento: 'chiedo-gli-atti', testo: 'Chiedi i documenti con Chiedo gli atti' },\n"
          "};\n\n"
          f"export const PRATICHE = {json.dumps(pratiche, ensure_ascii=False, indent=1)};\n")
    open(os.path.join(CARTELLA, 'src', 'pratiche.js'), 'w', encoding='utf-8').write(js)
    print(len(pratiche), 'pratiche')


if __name__ == '__main__':
    main()
