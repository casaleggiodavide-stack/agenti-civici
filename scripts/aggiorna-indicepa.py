"""Scarica da IndicePA (licenza CC BY 4.0) gli indirizzi PEC usati dagli strumenti:
- faccio-ricorso/src/dati/prefetture.js: Prefetture e Commissariati del Governo
- chiedo-gli-atti/src/dati/enti.json: tutti gli enti con una PEC
Uso: python3 scripts/aggiorna-indicepa.py   (richiede: pip install openpyxl)
"""
import csv, io, json, pathlib, urllib.request, datetime
import openpyxl

RADICE = pathlib.Path(__file__).resolve().parent.parent
API = 'https://indicepa.gov.it/ipa-dati/api/3/action/package_show?id='
UA = {'User-Agent': 'Mozilla/5.0 agenti-civici'}

def scarica(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        return r.read()

def risorsa(pacchetto, formato):
    d = json.loads(scarica(API + pacchetto))['result']
    return next(r['url'] for r in d['resources'] if r['format'].upper() == formato)

def foglio(pacchetto):
    ws = openpyxl.load_workbook(io.BytesIO(scarica(risorsa(pacchetto, 'XLSX'))), read_only=True).active
    righe = ws.iter_rows(values_only=True)
    intest = next(righe)
    return [dict(zip(intest, r)) for r in righe]

oggi = datetime.date.today().isoformat()
aoo = list(csv.DictReader(io.StringIO(scarica(risorsa('aoo', 'TXT')).decode('utf-8-sig')), delimiter='\t'))

# Prefetture: aree organizzative del Ministero dell'Interno (codice m_it).
pref = []
for r in aoo:
    nome = r['des_aoo'].strip()
    if r['cod_amm'] != 'm_it' or not nome.lower().startswith(('prefettura', 'commissariato del governo')):
        continue
    if 'sezione' in nome.lower():
        continue
    citta = r['Comune'].strip()
    tipo = 'Commissariato del Governo' if nome.lower().startswith('commissariato') else 'Prefettura'
    pref.append({'sigla': r['Provincia'], 'citta': citta, 'nome': f'{tipo} di {citta}', 'pec': r['mail1'].strip(), 'indirizzo': f"{r['Indirizzo'].strip()}, {r['Cap']} {citta}"})
pref.sort(key=lambda p: p['citta'])
js = ('// Prefetture e Commissariati del Governo con PEC, da IndicePA (CC BY 4.0), aggiornato il ' + oggi + '.\n'
      '// Rigenerare con: python3 scripts/aggiorna-indicepa.py\n'
      'export const AGGIORNATO = ' + json.dumps(oggi) + ';\n'
      'export const PREFETTURE = ' + json.dumps(pref, ensure_ascii=False, indent=0).replace('\n', '') + ';\n')
(RADICE / 'faccio-ricorso/src/dati/prefetture.js').write_text(js, encoding='utf-8')
print('prefetture', len(pref))

# Enti con PEC, per l'accesso civico.
cat = {r['Codice_categoria']: r['Nome_categoria'].strip() for r in foglio('categorie-enti')}
luogo = {}
for r in aoo:
    luogo.setdefault(r['cod_amm'], (r['Comune'].strip(), r['Provincia'].strip()))
enti = []
for r in foglio('enti'):
    pec = next((str(r[f'Mail{n}']).strip() for n in range(1, 6) if r.get(f'Mail{n}') and str(r.get(f'Tipo_Mail{n}') or '').lower() == 'pec'), None)
    if not pec:
        continue
    comune, prov = luogo.get(r['Codice_IPA'], ('', ''))
    sito = (r['Sito_istituzionale'] or '').strip().removeprefix('https://').removeprefix('http://').rstrip('/')
    enti.append([r['Denominazione_ente'].strip(), r['Codice_Categoria'], comune, prov, pec, sito])
uscita = {'aggiornato': oggi, 'fonte': 'IndicePA, dataset Enti, CC BY 4.0', 'categorie': cat, 'enti': enti}
(RADICE / 'chiedo-gli-atti/src/dati/enti.json').write_text(json.dumps(uscita, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print('enti', len(enti))
