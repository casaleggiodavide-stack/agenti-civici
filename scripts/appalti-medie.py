"""Red flag sugli appalti: le medie di riferimento per gli affidamenti diretti.
Per ogni tipo di ente (lo stesso «gruppo» degli enti simili) calcola la media nazionale e quella
di ogni Regione della quota di valore (e di procedure) andata in affidamenti diretti, più la media
di tutti gli enti. Legge le schede già pronte in appalti/dati/p/ e scrive appalti/dati/medie.json.
Uso: python3 -I scripts/appalti-medie.py   (lo lancia anche scripts/appalti-anac.py alla fine)
"""
import glob
import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATI = os.path.join(REPO, 'appalti', 'dati')
MINIMO = 5  # sotto questo numero di enti la media non si mostra

REGIONI = {
    'Piemonte': 'AL AT BI CN NO TO VB VC', "Valle d'Aosta": 'AO', 'Lombardia': 'BG BS CO CR LC LO MB MI MN PV SO VA',
    'Trentino-Alto Adige': 'BZ TN', 'Veneto': 'BL PD RO TV VE VI VR', 'Friuli-Venezia Giulia': 'GO PN TS UD',
    'Liguria': 'GE IM SP SV', 'Emilia-Romagna': 'BO FC FE FO MO PC PR RA RE RN', 'Toscana': 'AR FI GR LI LU MS PI PO PT SI',
    'Umbria': 'PG TR', 'Marche': 'AN AP FM MC PS PU', 'Lazio': 'FR LT RI RM VT', 'Abruzzo': 'AQ CH PE TE', 'Molise': 'CB IS',
    'Campania': 'AV BN CE NA SA', 'Puglia': 'BA BR BT FG LE TA', 'Basilicata': 'MT PZ', 'Calabria': 'CS CZ KR RC VV',
    'Sicilia': 'AG CL CT EN ME PA RG SR TP', 'Sardegna': 'CA CI NU OG OR OT SS SU VS',
}
PROV_REGIONE = {p: r for r, ps in REGIONI.items() for p in ps.split()}


def media(lista):
    if len(lista) < MINIMO:
        return None
    return [round(sum(x[0] for x in lista) / len(lista), 1), round(sum(x[1] for x in lista) / len(lista), 1), len(lista)]


def main():
    conf = json.load(open(os.path.join(DATI, 'confronto.json'), encoding='utf-8'))
    naz, reg = {}, {}
    for f in sorted(glob.glob(os.path.join(DATI, 'p', '*.json'))):
        with open(f, encoding='utf-8') as fh:
            schede = json.load(fh)
        for s in schede.values():
            v = (s.get('ind') or {}).get('senza_gara')
            if not v or v.get('quota') is None:
                continue
            x = (v['quota'], v.get('quota_n', v['quota']))
            g = s.get('gruppo') or 'Altri enti'
            r = PROV_REGIONE.get(s.get('prov'))
            for chiave in (g, '_tutti'):
                naz.setdefault(chiave, []).append(x)
                if r:
                    reg.setdefault(r, {}).setdefault(chiave, []).append(x)
    uscita = {
        'anno': conf['anno'], 'aggiornato': conf['aggiornato'], 'fonte': conf['fonte'], 'licenza': conf['licenza'],
        'indicatore': 'senza_gara', 'minimo_enti': MINIMO,
        'spiegazione': 'Media semplice, tra gli enti con almeno 5 procedure, della quota del valore (e delle procedure) andata in affidamenti diretti; ogni ente pesa uno.',
        'nazionale': {k: m for k, l in sorted(naz.items()) if (m := media(l))},
        'regioni': {r: {k: m for k, l in sorted(d.items()) if (m := media(l))} for r, d in sorted(reg.items())},
        'prov_regione': PROV_REGIONE,
    }
    with open(os.path.join(DATI, 'medie.json'), 'w', encoding='utf-8') as fh:
        json.dump(uscita, fh, ensure_ascii=False, separators=(',', ':'))
    print('medie scritte:', len(uscita['nazionale']), 'tipi di ente,', len(uscita['regioni']), 'Regioni;',
          'tutti gli enti in Italia:', uscita['nazionale']['_tutti'])


if __name__ == '__main__':
    main()
