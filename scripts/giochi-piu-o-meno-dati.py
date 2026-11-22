#!/usr/bin/env python3
"""Più o meno: il mazzo dei contratti pubblici veri per il gioco giochi/piu-o-meno/.

Legge i dati aperti ANAC del 2025 già scaricati per «Red flag sugli appalti» in ~/dati-civici/anac
(cig2025_MM.zip, aggiudicazioni.zip, aggiudicatari.zip, stazioni.zip; vedi scripts/appalti-anac.py) e,
se c'è, bilancio-comune/dati/comuni.json per la popolazione dei Comuni (ISTAT, 1° gennaio 2025).

Tiene solo contratti di cose che tutti riconoscono (la mensa, l'asfalto, l'ambulanza, le luminarie...),
riconosciuti dall'oggetto e dal codice CPV, e scarta con regole dichiarate (REGOLE qui sotto, mostrate
anche nella pagina) gli importi che non sono la spesa di un contratto: accordi quadro e convenzioni,
proroghe, importi aggiudicati più alti della base d'asta o con ribassi impossibili, valori fuori scala.
Niente persone fisiche: si scartano i contratti vinti da una persona (codice fiscale di 16 caratteri)
e gli oggetti che nominano qualcuno («ing.», «dott.», «ditta ...»); il gioco non mostra mai chi ha vinto.

Scrive:
  ~/dati-civici/giochi-piu-o-meno/candidati.json   i contratti letti, prima della scelta (fuori dal repo)
  giochi/piu-o-meno/src/contratti.js               il mazzo del gioco, con le mediane per categoria

Licenza dei dati ANAC: CC BY-SA 4.0; il mazzo resta CC BY-SA 4.0.

Uso: python3 -I scripts/giochi-piu-o-meno-dati.py [--grezzi ~/dati-civici/anac] [--rileggi]
"""
import csv
import html
import io
import json
import math
import os
import random
import re
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import date

csv.field_size_limit(10**9)

QUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(QUI)
GREZZI = os.path.expanduser(sys.argv[sys.argv.index('--grezzi') + 1] if '--grezzi' in sys.argv else '~/dati-civici/anac')
LAVORO = os.path.expanduser('~/dati-civici/giochi-piu-o-meno')
USCITA = os.path.join(REPO, 'giochi', 'piu-o-meno', 'src', 'contratti.js')
ANNO = 2025
PER_CATEGORIA = 24       # al massimo, nel mazzo
MINIMO_CATEGORIA = 12    # una categoria con meno contratti puliti resta fuori
LINK_CIG = 'https://dati.anticorruzione.it/superset/dashboard/dettaglio_cig/?cig={}&standalone=2'

# ---------------------------------------------------------------- categorie
# id, nome, emoji, facile (oggetto familiare: entra nelle prime coppie), tipo ammesso, oggetto (regex), da escludere (regex)
CATEGORIE = [
    ('luminarie', 'Luminarie di Natale', '✨', True, None, r'LUMINARI|ILLUMINAZION[EI] (ARTISTIC[AH]E? )?(NATALIZI|PER IL NATALE|PER LE FESTE)|ADDOBBI? NATALIZI|ALLESTIMENT[OI] NATALIZI|ALBER[OI] DI NATALE', r'MANUTENZIONE DELL.IMPIANTO DI PUBBLICA'),
    ('fuochi', 'Fuochi d\'artificio', '🎆', True, None, r'FUOCHI (D.)?ARTIFICI|FUOCHI PIROTECNICI|SPETTACOL[OI] PIROTECNIC|PIROMUSICAL', None),
    ('mensa', 'Mensa scolastica', '🍝', True, 'SERVIZI', r'REFEZIONE SCOLASTICA|MENSA SCOLASTICA|MENSE SCOLASTICHE|RISTORAZIONE SCOLASTICA', r'DERRATE|AUTOCONTROLLO|HACCP|SERVIZI TECNICI|RICONVERSION|SOFTWARE|INFORMATIZZAT|ATTREZZATUR|ARREDI|LAVORI|LOCALI MENSA|ELETTRODOMESTIC|STOVIGLI|PIATTAFORMA|RISCOSSIONE|PAGAMENT|SANIFICAZIONE|CONTROLL[OI] (DI )?QUALIT|DIETIST|ANALISI'),
    ('asfalto', 'Asfalto delle strade', '🛣️', True, 'LAVORI', r'ASFALT|BITUMA|CONGLOMERATO BITUMINOSO|MANTO STRADALE|PAVIMENTAZION[EI] STRADAL|MANTO ASFALTIC', r'COPERTUR|TETTO|MARCIAPIED|PISTA CICLABIL|ILLUMINAZION'),
    ('ambulanze', 'Ambulanze', '🚑', True, 'FORNITURE', r'(FORNITURA|ACQUISTO|ACQUISIZIONE|NOLEGGIO)\s+(DI\s+|DELLA\s+|DELLE\s+|IN\s+)?((N|NR)\.?\s*\d+\s+|UNA\s+|DUE\s+|TRE\s+|\d+\s+)?(NUOV[AE]\s+)?(AUTO)?AMBULANZ|^(AUTO)?AMBULANZ', r'ATTREZZATUR|MATERIAL|ADESIV|SERIGRAF|CARRELL|STRUTTURA|ACCESSORI PER|MANUTENZIONE|RIPARAZION|PNEUMATIC|RICAMBI|LAVAGGIO|SANIFICAZION|CARROZZERI|BARELL|ELETTROMEDICAL|DEFIBRILLATOR|MONITOR|COPERTURA|PENSILIN|GARAGE|RIMESSA|TETTOI|LAVORI|SEGNALETICA|PELLICOL|RADIO|TABLET|CELLULAR|GPS'),
    ('computer', 'Computer e lavagne digitali per la scuola', '💻', True, 'FORNITURE', r'\bPC\b|PERSONAL COMPUTER|NOTEBOOK|COMPUTER|TABLET|CHROMEBOOK|MONITOR INTERATTIV|PANNELL[OI] INTERATTIV|LAVAGN[AE] (DIGITAL|INTERATTIV|MULTIMEDIAL)|DIGITAL BOARD|\bLIM\b|SCHERM[OI] INTERATTIV|DISPOSITIVI DIGITALI', r'COMPUTERIZZAT|ASSISTENZA|MANUTENZIONE|NOLEGGIO|SOFTWARE|LICENZ|ENDPOINT|ANTIVIRUS|SOPHOS|FIREWALL|SERVER|RETE|CABLAGGIO'),
    ('pulizie', 'Pulizie', '🧽', True, 'SERVIZI', r'SERVIZI[OI]? DI PULIZIA|SERVIZI[OI]? DI PULIZIE|PULIZI[AE] (E SANIFICAZIONE )?(DEI |DEGLI |DELLE |DEL )?(LOCALI|UFFICI|IMMOBILI|SEDI|SEDE|EDIFICI|PLESSI|SCUOL|STABIL|AMBIENTI)', r'STRAD|SPIAGG|CALDAI|CANAL|FOSS|CADITOI|CAMIN|ARENIL|FOGNA|CONDOTT|SPURG|AREE VERDI|VETRATE ESTERNE|FACCIAT|SERBATOI|PANNELLI FOTOVOLTAIC|CISTERN'),
    ('scuolabus', 'Scuolabus e trasporto scolastico', '🚌', True, None, r'TRASPORTO SCOLASTICO|SCUOLABUS|SCUOLA-?BUS', r'MANUTENZIONE|RIPARAZION|PNEUMATIC|RICAMBI|REVISION|SOFTWARE|ASSICURAZION|CARBURANT|TACHIGRAF'),
    ('neve', 'Sgombero neve e sale sulle strade', '❄️', True, None, r'SGOMBERO (DELLA )?NEVE|SGOMBERO NEVE|SPALATURA|SPARGIMENTO (DI )?SALE|SALE (ANTIGELO|STRADALE|DISGELANTE)|CLORURO DI SODIO|SERVIZIO INVERNALE|SERVIZI INVERNALI|SGOMBRO NEVE|ANTIGHIACCIO', None),
    ('giochi', 'Giochi per i parchi', '🛝', True, None, r'AREE? GIOCHI|AREA LUDICA|AREE LUDICHE|PARCO GIOCHI|PARCHI GIOCO|GIOCHI (PER (BAMBINI|ESTERNI|PARCHI|ESTERNO|AREE)|INCLUSIVI|DA ESTERNO)|ATTREZZATURE LUDICHE|GIOCHI INCLUSIVI|STRUTTURE LUDICHE', r'GIOCHI DA TAVOLO|VIDEOGIOC|GIOCHI DIDATTICI'),
    ('defibrillatori', 'Defibrillatori', '❤️', True, 'FORNITURE', r'DEFIBRILLATOR', r'MANUTENZIONE|ELETTROD|PIASTRE|BATTERI|FORMAZIONE|CORS[OI]'),
    ('banchi', 'Banchi e arredi per la scuola', '🪑', True, 'FORNITURE', r'ARREDI SCOLASTICI|ARREDO SCOLASTICO|BANCHI|ARREDI (PER |DELLE |DELLA )(LE )?(SCUOL|AULE|AULA|PLESS|ISTITUT|INFANZIA|NIDO|PRIMARIA|SECONDARIA)|ARREDI DIDATTICI|ARREDI INNOVATIVI', r'BANCHI (FRIGO|ALIMENTAR|DI LAVORO|PROVA|MERCATO)|BANCHINA'),
    ('segnaletica', 'Strisce e cartelli stradali', '🚸', True, None, r'SEGNALETICA (STRADALE )?(ORIZZONTALE|VERTICALE|STRADALE)|SEGNALETICA STRADALE|STRISCE PEDONALI|ATTRAVERSAMENTI PEDONALI', r'SEGNALETICA (INTERNA|DI SICUREZZA|ANTINCENDIO|TURISTICA|MUSEALE)|SAFETY'),
    ('disinfestazione', 'Disinfestazione (zanzare, topi, piccioni)', '🦟', True, 'SERVIZI', r'DISINFESTAZION|DERATTIZZAZION|ZANZAR|LARVICID|ADULTICID|DEBLATTIZZAZION|PROCESSIONARIA', None),
    ('bagnini', 'Bagnini sulle spiagge', '🏖️', True, 'SERVIZI', r'SALVATAGGIO (A MARE|IN MARE|BALNEARE|SULLE SPIAGGE)|ASSISTENZA (AI )?BAGNANTI|SORVEGLIANZA (DELLE )?SPIAGG|SALVAMENTO|BAGNINI|SICUREZZA BALNEARE', r'PISCIN'),
    ('estivi', 'Centri estivi per bambini', '☀️', True, 'SERVIZI', r'CENTR[OI] ESTIV|CENTR[OI] RICREATIV[OI] ESTIV|SOGGIORN[OI] ESTIV|COLONIA ESTIVA|CAMPUS ESTIV|E-?STATE RAGAZZI|ESTATE BAMBINI|GREST', r'TRASPORTO|PASTI|REFEZIONE|MENSA'),
    ('libri', 'Libri per le biblioteche', '📚', True, 'FORNITURE', r'(ACQUISTO|FORNITURA|ACQUISIZIONE) (DI )?(LIBRI|VOLUMI|MATERIALE LIBRARIO|PATRIMONIO LIBRARIO|NOVITA.? EDITORIALI|DOCUMENTI LIBRARI)|INCREMENTO (DEL )?PATRIMONIO LIBRARIO|LIBRI PER LA BIBLIOTECA', r'LIBRI DI TESTO|CEDOLE|CONTABIL|REGISTRI|ELETTRONIC|DIGITAL|PERIODIC|ABBONAMENT|BANCHE DATI|E-?BOOK|CONSERVAZIONE|RESTAURO|RILEGATURA'),
    ('illuminazione', 'Lampioni e illuminazione pubblica', '💡', False, None, r'ILLUMINAZIONE PUBBLICA|PUBBLICA ILLUMINAZIONE|IMPIANT[OI] DI ILLUMINAZIONE STRADALE|CORPI ILLUMINANTI STRADALI|LAMPIONI', r'NATALIZI|LUMINARI|FESTIV'),
    ('verde', 'Taglio dell\'erba e alberi', '🌳', False, 'SERVIZI', r'SFALCIO|DECESPUGLIAMENTO|MANUTENZIONE (ORDINARIA )?(DEL |DELLE AREE A |DELLE AREE )?VERDE|VERDE PUBBLICO|POTATUR|TAGLIO (DELL.)?ERBA|ABBATTIMENTO (DI )?ALBERI|DISERBO', None),
    ('rifiuti', 'Rifiuti e pulizia delle strade', '🗑️', False, 'SERVIZI', r'RACCOLTA (E TRASPORTO )?(DEI |DEI RIFIUTI|RIFIUTI|DIFFERENZIATA)|IGIENE URBANA|RACCOLTA PORTA A PORTA|SPAZZAMENTO', r'CONFERIMENTO|SMALTIMENTO|TRATTAMENTO|RECUPERO|SANITARI|SPECIALI|PERICOLOSI|AMIANTO|CIMITERIAL|ABBANDONAT|CONTENITORI|CASSONETTI|SACCHETTI|BIDONI|MASTELLI|COMPOSTIER|FARMACI|PILE|INGOMBRANTI'),
    ('videosorveglianza', 'Telecamere di videosorveglianza', '📹', False, None, r'VIDEOSORVEGLIANZA|TELECAMER|LETTURA TARGHE|VARCHI ELETTRONICI', r'MANUTENZIONE|ASSISTENZA|CANONE|NOLEGGIO|LICENZ|SOFTWARE'),
    ('fotovoltaico', 'Pannelli solari sugli edifici pubblici', '🔆', False, None, r'FOTOVOLTAIC', r'MANUTENZIONE|PULIZIA|VERIFICA|MONITORAGGIO|PROGETTAZION'),
    ('auto', 'Auto di servizio', '🚓', False, 'FORNITURE', r'AUTOVETTUR|AUTO DI SERVIZIO|VEICOL[OI] (PER LA |DELLA )?POLIZIA (LOCALE|MUNICIPALE)|AUTO ELETTRIC|AUTOVEICOL[OI]', r'MANUTENZIONE|RIPARAZION|PNEUMATIC|RICAMBI|LAVAGGIO|CARBURANT|REVISION|ASSICURAZION|CARROZZERI|NOLEGGIO|ALLESTIMENTO|BATTERI|TAGLIANDO|AMBULANZ|SCUOLABUS'),
    ('divise', 'Divise e vestiario da lavoro', '🦺', False, 'FORNITURE', r'VESTIARIO|DIVISE|UNIFORMI|INDUMENTI (DA LAVORO|PROTETTIVI|DI LAVORO)|ABBIGLIAMENTO (DA LAVORO|TECNICO|ANTINFORTUNISTIC)|CALZATURE (DA LAVORO|ANTINFORTUNISTIC)', r'LAVANDERIA|LAVAGGIO|NOLEGGIO|NOLO'),
    ('buonipasto', 'Buoni pasto per i dipendenti', '🎫', False, 'SERVIZI', r'BUONI PASTO|BUONO PASTO|TICKET RESTAURANT', None),
    ('ascensori', 'Ascensori', '🛗', False, None, r'ASCENSOR|MONTACARICH|ELEVATOR|SERVOSCALA|PIATTAFORMA ELEVATRICE', None),
    ('cimiteri', 'Cimiteri', '🕯️', False, None, r'CIMITER|LOCULI|OSSARI|COLOMBARI', r'RIFIUTI|ILLUMINAZIONE VOTIVA|LAMPADE VOTIVE|SOFTWARE'),
    ('palestre', 'Palestre e campi sportivi', '🏀', False, 'LAVORI', r'PALESTR|CAMPO SPORTIVO|CAMPI SPORTIVI|CAMPO DA CALCIO|PALAZZETTO DELLO SPORT|IMPIANTO SPORTIVO|IMPIANTI SPORTIVI|CAMPO POLIVALENTE', r'SOLLEVAMENTO|FOGNA|DEPURA|ACQUEDOTT'),
    ('vaccini', 'Vaccini', '💉', False, 'FORNITURE', r'VACCIN', r'FRIGORIFER|CONSERVAZIONE|LOGISTICA|TRASPORTO|SIRINGH|AGHI|SOFTWARE|VETERINAR|ANIMAL|BOVIN|SUIN|OVIN|AVICOL|CANI|GATTI|FRIGO|CONGELATOR|CARRELL|POLTRON|BLUE ?TONG|LINGUA BLU|BTV|ZOOTECN|ALLEVAMENT|ZOOPROFILAT'),
    ('cancelleria', 'Carta e cancelleria', '📎', False, 'FORNITURE', r'CANCELLERIA|CARTA (IN RISME|PER FOTOCOPIE|PER STAMPANTI|A4|IN FORMATO A4|PER UFFICIO)|RISME DI CARTA|MATERIALE DI CONSUMO PER UFFICIO', r'TONER|CARTUCCE'),
    ('caldaie', 'Caldaie e riscaldamento', '🔥', False, None, r'CALDAI|CENTRAL[EI] TERMIC|IMPIANT[OI] DI RISCALDAMENTO|POMP[AE] DI CALORE|GASOLIO DA RISCALDAMENTO|GASOLIO PER RISCALDAMENTO|GESTIONE CALORE|SERVIZIO CALORE', r'PULIZIA'),
]
CAT = {c[0]: c for c in CATEGORIE}

# ---------------------------------------------------------------- regole di esclusione (mostrate nella pagina)
REGOLE = [
    ('aggiudicati', 'Solo contratti davvero aggiudicati, con l\'importo di aggiudicazione dichiarato ad ANAC (esito «aggiudicata»): niente gare deserte, annullate o ancora in corso.'),
    ('tetto', 'Fuori gli accordi quadro, le convenzioni, le adesioni, le concessioni, le proroghe, i rinnovi e le modifiche: il loro importo è un tetto massimo o un pezzo di un contratto già esistente, non la spesa di un contratto nuovo.'),
    ('base', 'Fuori gli importi aggiudicati più alti del 10% della base d\'asta o più bassi di un quinto (un ribasso oltre l\'80% è quasi sempre un errore di battitura, per esempio euro al posto di migliaia).'),
    ('minimo', 'Fuori i contratti sotto 1.500 euro (fra i più piccoli ci sono molti importi segnaposto, come 1.000 euro tondi) e quelli senza gara oltre 5 milioni (nei dati, quasi sempre il valore di un\'intera convenzione nazionale; la stessa regola di «Red flag sugli appalti»).'),
    ('scala', 'Fuori i valori fuori scala per la loro categoria: meno di un centesimo o più di cinquanta volte la mediana dei contratti della stessa categoria.'),
    ('persone', 'Fuori i contratti vinti da una persona fisica (codice fiscale di 16 caratteri) e gli oggetti che nominano una persona o una ditta: il gioco non mostra mai chi ha vinto né chi ha firmato.'),
    ('chiari', 'Solo oggetti chiari: niente codici, incarichi di progettazione o collaudo, lotti senza descrizione. Per ogni categoria 24 contratti scelti per varietà di regione, di ente e di importo, più il più caro e il meno caro dell\'anno.'),
]

ESCLUDI_OGGETTO = re.compile(r'ACCORDO QUADRO|ACCORDI QUADRO|CONVENZION|ADESION|PROROG|RINNOV|INTEGRAZION|IMPEGNO|QUINTO D|PROGETTAZION|DIREZIONE (DEI )?LAVORI|COLLAUD|INCARIC|COORDINAMENTO (DELLA )?SICUREZZA|CONSULENZ|VERIFIC|PERIZI|RIMBORS|CONTRIBUT|LIQUIDAZION|SUBENTR|VARIANT|RIPETIZION|ESTENSION|MODIFICA|CONCESSION|SPONSORIZZ|COMODATO|LOCAZIONE|AFFITTO|RIMOZIONE|SMALTIMENTO|STUDIO DI FATTIBILIT|ASSISTENZA TECNICA|REDAZIONE|RILIEV|INDAGIN|RELAZION|SUPPORTO AL RUP|\bRUP\b|PIANO DI SICUREZZA|SOMMA URGENZA|IN DANNO|TRANSAZION|DEBITO FUORI BILANCIO|NOLEGGIO A CALDO|LAVORI COMPLEMENTARI|RESIDUO|SALDO|ACCONTO|ANTICIPAZION|PENALI|RISOLUZION')
PERSONA_OGGETTO = re.compile(r"\b(ING|ARCH|DOTT|DOTT\.SSA|DR|AVV|GEOM|SIG|SIG\.RA|SIGG|RAG|PROF|PER\.? ?IND|P\. ?I|GEOL|AGR|NOTAIO)\b\.?\s+[A-Z]|\bDITTA\b|\bIMPRESA\b|\bS\.?R\.?L\b|\bS\.?P\.?A\b|\bS\.?N\.?C\b|\bS\.?A\.?S\b|\bSOC\b|SOCIET[AÀ]\b|COOPERATIV|OPERATORE ECONOMICO|\bDI [A-Z]+ [A-Z]+ &|\bSIG\b|\bSIGNOR")
CODICI = re.compile(r'\b(?:CIG|CUP|SMART ?CIG|RDO|RDO N|TD N|ODA|TRATTATIVA DIRETTA N)\b\.?\s*[:.]?\s*(?:N\.?\s*)?[A-Z0-9/_\-]{5,}|\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{10}\b')

# Procedure: con bando, su invito, senza gara (stessi codici di scripts/appalti-anac.py).
CON_BANDO = {'1', '2', '3', '5', '9', '22', '23', '30', '36', '38', '114', '7', '10', '11', '28', '99'}
SU_INVITO = {'4', '6', '15', '34'}
SENZA_GARA = {'24', '27', '18', '12', '37', '40', '32', '8', '13'}
IN_HOUSE = {'25', '26'}
PROCEDURE = ['Gara aperta a tutti', 'Gara su invito', 'Affidamento diretto, senza gara', 'Altra procedura']
NON_PLAUSIBILE = 5_000_000

REGIONI = ['Piemonte', 'Valle d\'Aosta', 'Lombardia', 'Trentino-Alto Adige', 'Veneto', 'Friuli Venezia Giulia', 'Liguria', 'Emilia-Romagna',
           'Toscana', 'Umbria', 'Marche', 'Lazio', 'Abruzzo', 'Molise', 'Campania', 'Puglia', 'Basilicata', 'Calabria', 'Sicilia', 'Sardegna']
# codice ISTAT della provincia (prime tre cifre del codice del comune) → regione
_PROV = {
    0: '001 002 003 004 005 006 096 103', 1: '007', 2: '012 013 014 015 016 017 018 019 020 097 098 108', 3: '021 022',
    4: '023 024 025 026 027 028 029', 5: '030 031 032 093', 6: '008 009 010 011', 7: '033 034 035 036 037 038 039 040 099',
    8: '045 046 047 048 049 050 051 052 053 100', 9: '054 055', 10: '041 042 043 044 109', 11: '056 057 058 059 060',
    12: '066 067 068 069', 13: '070 094', 14: '061 062 063 064 065', 15: '071 072 073 074 075 110', 16: '076 077',
    17: '078 079 080 101 102', 18: '081 082 083 084 085 086 087 088 089', 19: '090 091 092 095 104 105 106 107 111',
}
REGIONE_DI = {p: REGIONI[r] for r, ps in _PROV.items() for p in ps.split()}

ENTI = ['Comune', 'Unione di Comuni', 'Scuola', 'Sanità (ASL o ospedale)', 'Regione', 'Provincia o Città metropolitana', 'Università', 'Società pubblica', 'Altro ente pubblico']


def tipo_ente(nome, natura):
    n = nome.upper()
    if re.search(r'\bUNIONE\b|COMUNITA.? MONTANA|UNIONE MONTANA', n): return 1
    if re.match(r"(COMUNE|AMMINISTRAZIONE COMUNALE|CITTA.? DI|MUNICIPIO|COMUNE DI)\b", n) or re.search(r'\bCOMUNE DI\b', n) and not re.search(r'ISTITUTO|SCUOLA', n): return 0
    if re.search(r'CARABINIERI|MILITAR|POLIZIA|GUARDIA DI FINANZA|AERONAUTICA|ESERCITO|MARINA MILITARE|ISTITUTO SUPERIORE DI SANITA|VIGILI DEL FUOCO', n): return 8
    if re.search(r'ISTITUTO COMPRENSIVO|\bLICEO|ISTITUTO (DI ISTRUZIONE|TECNICO|PROFESSIONALE|STATALE|D.ISTRUZIONE|OMNICOMPRENSIVO|MAGISTRALE|D.ARTE)|CIRCOLO DIDATTICO|DIREZIONE DIDATTICA|\bSCUOLA\b|CONVITTO|EDUCANDATO|\bI\.?C\.?\b|\bI\.?I\.?S\.?\b|\bC\.?P\.?I\.?A\b|ISTITUTO ISTRUZIONE|SCUOLA SECONDARIA|ISTITUTO D.ISTRUZIONE|POLO SCOLASTICO|ISTITUTO SUPERIORE', n): return 2
    if re.search(r'SANITARI|\bASL\b|\bASP\b|\bAUSL\b|\bATS\b|\bASST\b|\bULSS\b|OSPEDAL|\bIRCCS\b|AZIENDA ZERO|ESTAR|SORESA|POLICLINICO|\bA\.?O\.?U?\b|AREU|EMERGENZA URGENZA|ARES 118|\bSANITA', n): return 3
    if re.match(r'REGIONE\b|GIUNTA REGIONALE|CONSIGLIO REGIONALE|PROVINCIA AUTONOMA', n): return 4
    if re.match(r'PROVINCIA\b|CITTA.? METROPOLITANA|LIBERO CONSORZIO', n): return 5
    if re.search(r'UNIVERSIT|POLITECNICO', n): return 6
    if re.search(r'S\.?P\.?A\.?$|S\.?R\.?L\.?$|SOCIETA|S\.C\.A\.?R\.?L', n) or 'SOCIET' in (natura or '').upper(): return 7
    return 8


# ---------------------------------------------------------------- testi

def ripara(t):
    """Entità HTML e testi passati due volte per la codifica sbagliata («Ã¨» al posto di «è»)."""
    t = html.unescape(html.unescape(t or ''))
    for _ in range(2):
        if not re.search('[ÃÂâ][\x80-\xbf€™œ¢]', t):
            break
        try:
            t = t.encode('cp1252').decode('utf-8')
        except UnicodeError:
            break
    t = re.sub('[ÃÂãâ¢€™]{2,}', "'", t)
    t = t.replace('’', "'").replace('‘', "'").replace('`', "'").replace('´', "'").replace('–', '-').replace('—', '-').replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', t).strip()


SIGLE = ['ASL', 'ASP', 'AUSL', 'ASST', 'ATS', 'ULSS', 'LED', 'PC', 'LIM', 'DAE', 'PNRR', 'PNC', 'IC', 'IIS', 'ITIS', 'ITC', 'IPSIA', 'CPIA', 'UE', 'ANAS', 'ATI', 'SS', 'SP', 'SR', 'MEPA', 'IVA', 'TPL', 'ERP', 'UTI', 'COVID', 'RSA', 'IPAB', 'CEI', 'UNI', 'HPV', 'MPR', 'FESR', 'FSE', 'POR', 'PON', 'STEM', 'CAM', 'GPP', 'RTI', 'ISEE', 'AEE', 'DPI', 'LIS', 'BLSD', 'NIDO']
PRIMA_NOME = re.compile(r"\b(comune di|comuni di|citta' di|città di|via|viale|piazza|piazzale|corso|largo|località|loc\.|frazione|fraz\.|borgata|contrada|c\.da|quartiere|rione|parco|isola di|lungomare|istituto comprensivo|i\.c\.|liceo|santuario|chiesa di|torrente|fiume|lago di|san|santa|santo|sant')\s+([a-zà-ù'][\wà-ù']*)", re.I)


def semplice(oggetto):
    """L'oggetto riscritto in minuscolo e senza burocratese inutile; l'originale resta sempre visibile."""
    t = ripara(oggetto)
    t = CODICI.sub('', t)
    t = re.sub(r'\b(A\.?\s?S\.?|ANNO SCOLASTICO)\s*(\d{4})\s*[/\-]\s*(\d{2,4})', lambda m: f'anno scolastico {m.group(2)}/{m.group(3)[-2:]}', t, flags=re.I)
    t = re.sub(r'\bAA\.?\s?SS\.?', 'anni scolastici', t, flags=re.I)
    t = re.sub(r"^(DETERMINA(ZIONE)?( A CONTRARRE)?( PER)?|DECISIONE DI CONTRARRE( PER)?|AFFIDAMENTO( DIRETTO)?( AI SENSI [^,]*?,)?( DELL'ESECUZIONE| DELL'APPALTO| DELLA GESTIONE)?( DEL| DELLA| DELLE| DEI| DEGLI| DI| PER IL| PER LA| PER LE| PER I| PER GLI| PER L'| PER| IN)?|"
                 r"PROCEDURA (APERTA|NEGOZIATA)[^,:]*? (PER|DEL|DELLA)( L.AFFIDAMENTO)?( DEL| DELLA| DEI| DELLE| DI)?|GARA (EUROPEA |TELEMATICA )*(A PROCEDURA APERTA )?(PER|DEL)( L.AFFIDAMENTO)?( DEL| DELLA| DEI| DELLE| DI)?|APPALTO( DEL| DELLA| DEI| DI| PER)?|OGGETTO:?)\s+", '', t, flags=re.I)
    t = re.sub(r"^(?:(?:I|IL|LA|LE|GLI|UN|UNA)\s+|L')(?=\w)", '', t, flags=re.I)
    t = re.sub(r'\s*[-–,;:(]*\s*(AI SENSI|EX) (DELL.)?ART(T)?\.?\s*\d+[^.;)]*', '', t, flags=re.I)
    t = re.sub(r'\b(D\.?\s?LGS\.?|DLGS)\s*N?\.?\s*\d+/\d{4}', '', t, flags=re.I)
    t = re.sub(r'\b(MEDIANTE|TRAMITE|SUL|SU) (IL )?(MEPA|MERCATO ELETTRONICO[^,.;]*|PIATTAFORMA [^,.;]*|ORDINE DIRETTO[^,.;]*|TRATTATIVA DIRETTA[^,.;]*)', '', t, flags=re.I)
    t = re.sub(r'\b(SERV\.)', 'servizio', t, flags=re.I)
    t = re.sub(r'\b(FORN\.)', 'fornitura', t, flags=re.I)
    t = re.sub(r'\b(MANUT\.)', 'manutenzione', t, flags=re.I)
    t = re.sub(r'\s+([,.;:])', r'\1', t)
    t = re.sub(r'[\s\-–,;:./]+$', '', t)
    t = re.sub(r'\(\s*\)', '', t)
    t = re.sub(r'\s+', ' ', t).strip(' -,;:.')
    t = t.lower()
    t = PRIMA_NOME.sub(lambda m: m.group(1) + ' ' + m.group(2)[:1].upper() + m.group(2)[1:], t)
    t = re.sub(r"\b(" + '|'.join(s.lower() for s in SIGLE) + r")\b", lambda m: m.group(1).upper(), t)
    t = re.sub(r'\bNIDO\b', 'nido', t)
    t = re.sub(r"\b(san|santa|santo|santi|sant')\s*(?=[A-Z])", lambda m: m.group(0)[:1].upper() + m.group(0)[1:], t)
    t = t[:1].upper() + t[1:]
    return t


def titolo_ente(t):
    t = re.sub(r'(\d)\?', r'\1°', ripara(t))
    piccole = {'di', 'del', 'della', 'delle', 'dei', 'degli', 'e', 'ed', 'in', 'per', 'a', 'al', 'alla', 'da', 'dal', 'dello', 'sul', 'sulla', 'con'}
    parole = []
    for i, p in enumerate(t.lower().split(' ')):
        if p.upper().strip('.,()') in SIGLE or re.fullmatch(r'[a-z]\.([a-z]\.)+', p):
            parole.append(p.upper())
        elif i and p in piccole:
            parole.append(p)
        else:
            parole.append('-'.join(x[:1].upper() + x[1:] for x in p.split('-')))
    t = ' '.join(parole)
    t = re.sub(r"\b([DL])'([a-zà-ù])", lambda m: m.group(1).lower() + "'" + m.group(2).upper(), t)
    t = re.sub(r"\b(Sant|Dell|Nell|All|Sull|Dall)'([a-zà-ù])", lambda m: m.group(1) + "'" + m.group(2).upper(), t)
    t = re.sub(r"(?<=\s)(Dell|Nell|All|Sull|Dall|Dagl|Degl)'", lambda m: m.group(1).lower() + "'", t)
    return t


def persona_fisica(cf):
    return bool(re.fullmatch(r'[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]', (cf or '').strip().upper()))


def num(s):
    try:
        v = float(str(s).replace(',', '.'))
        return v if math.isfinite(v) else None
    except (TypeError, ValueError):
        return None


def leggi(nome_zip):
    with zipfile.ZipFile(os.path.join(GREZZI, nome_zip)) as z:
        for nome in z.namelist():
            if not nome.lower().endswith('.csv'):
                continue
            with z.open(nome) as f:
                testo = io.TextIOWrapper(f, encoding='utf-8-sig', errors='replace', newline='')
                yield from csv.DictReader(testo, delimiter=';')


def categoria(oggetto, cpv, tipo, ente_tipo):
    o = oggetto.upper()
    for cid, _, _, _, tipo_ok, si, no in CATEGORIE:
        if tipo_ok and tipo != tipo_ok:
            continue
        if not re.search(si, o):
            continue
        if no and re.search(no, o):
            continue
        if cid == 'computer' and ente_tipo != 2:
            continue  # computer e lavagne: solo quelli comprati da una scuola
        if cid == 'banchi' and ente_tipo not in (0, 1, 2, 5) :
            continue
        return cid
    return None


# ---------------------------------------------------------------- 1. lettura dei dati grezzi

def rileggi():
    anagrafe = {}
    for r in leggi('stazioni.zip'):
        cf = (r.get('codice_fiscale') or '').strip().upper()
        if cf:
            anagrafe[cf] = (r.get('natura_giuridica_descrizione') or '', (r.get('citta_codice') or '')[:3], r.get('provincia_nome') or '')
    print('stazioni', len(anagrafe), file=sys.stderr)

    lotti = {}
    for m in range(1, 13):
        nome = f'cig{ANNO}_{m:02d}.zip'
        if not os.path.exists(os.path.join(GREZZI, nome)):
            print('manca', nome, file=sys.stderr)
            continue
        for r in leggi(nome):
            cig = (r.get('cig') or '').strip()
            if not cig or cig in lotti:
                continue
            if (r.get('stato') or '').upper().startswith('CANCELL') or (r.get('cig_accordo_quadro') or '').strip():
                continue
            ogg = ripara(r.get('oggetto_lotto') or '')
            gara = ripara(r.get('oggetto_gara') or '')
            if len(ogg) < 12 or re.fullmatch(r'(LOTTO|LOTTO N\.?)\s*\d+.*', ogg, re.I) and len(ogg) < 30:
                ogg = gara if len(gara) >= len(ogg) else ogg
            tipo = (r.get('oggetto_principale_contratto') or '').upper()
            ente = ripara(r.get('denominazione_amministrazione_appaltante') or '')
            cf = (r.get('cf_amministrazione_appaltante') or '').strip().upper()
            natura = anagrafe.get(cf, ('', '', ''))[0]
            et = tipo_ente(ente, natura)
            cat = categoria(ogg, r.get('descrizione_cpv') or '', tipo, et)
            if not cat:
                continue
            cod = (r.get('cod_tipo_scelta_contraente') or '').split('.')[0]
            # dove sta l'ente che compra (anagrafe ANAC); se manca, il luogo del contratto
            prov, prov_nome = anagrafe.get(cf, ('', '', ''))[1:]
            if prov not in REGIONE_DI:
                prov, prov_nome = (r.get('luogo_istat') or '')[:3], r.get('provincia') or ''
            lotti[cig] = {
                'cig': cig, 'cat': cat, 'oggetto': ogg, 'tipo': tipo, 'ente': ente, 'cf': cf, 'et': et,
                'base': num(r.get('importo_lotto')) or 0.0, 'cod': cod,
                'proc_nome': (r.get('tipo_scelta_contraente') or '').capitalize(),
                'prov': prov, 'prov_nome': prov_nome.title(),
                'data': (r.get('data_pubblicazione') or '')[:10],
            }
        print(nome, len(lotti), file=sys.stderr)

    agg = {}
    for r in leggi('aggiudicazioni.zip'):
        c = r.get('cig')
        if c not in lotti:
            continue
        d = (r.get('data_aggiudicazione_definitiva') or '')[:10]
        if c in agg and agg[c]['d'] > d:
            continue
        agg[c] = {'d': d, 'esito': (r.get('cod_esito') or '').split('.')[0], 'imp': num(r.get('importo_aggiudicazione')),
                  'rib': num(r.get('ribasso_aggiudicazione')), 'off': num(r.get('num_imprese_offerenti')), 'id': r.get('id_aggiudicazione')}
    print('aggiudicazioni', len(agg), file=sys.stderr)

    persone = set()
    for r in leggi('aggiudicatari.zip'):
        c = r.get('cig')
        if c in lotti and persona_fisica(r.get('codice_fiscale')):
            persone.add(c)
    print('vinti da persone fisiche', len(persone), file=sys.stderr)

    out = []
    for c, L in lotti.items():
        a = agg.get(c)
        if not a:
            continue
        L.update({'esito': a['esito'], 'imp': a['imp'], 'rib': a['rib'], 'off': a['off'], 'data_agg': a['d'], 'persona': c in persone})
        out.append(L)
    os.makedirs(LAVORO, exist_ok=True)
    json.dump({'letto': date.today().isoformat(), 'contratti': out}, open(os.path.join(LAVORO, 'candidati.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    return out


# ---------------------------------------------------------------- 2. regole e scelta del mazzo

def procedura(cod):
    return 0 if cod in CON_BANDO else 1 if cod in SU_INVITO else 2 if cod in SENZA_GARA else 3


def chiarezza(L, testo):
    """Più alto = oggetto più leggibile."""
    o = L['oggetto']
    s = 0.0
    n = len(testo)
    s -= abs(n - 75) / 25
    s -= 0.6 * len(re.findall(r'\d', o)) ** 0.7
    s -= 3 if re.search(r'\bLOTTO\b', o, re.I) else 0
    s -= 2 if o.count('(') > 1 else 0
    s -= 2 if re.search(r'[/_]{1}[A-Z0-9]{3,}', o) else 0
    s += 1.5 if L['et'] in (0, 2, 3) else 0
    return s


def it(n):
    return f'{n:,}'.replace(',', '.')


def scala_ok(v, mediana):
    return mediana / 100 <= v <= mediana * 50


def main():
    p = os.path.join(LAVORO, 'candidati.json')
    if '--rileggi' in sys.argv or not os.path.exists(p):
        tutti = rileggi()
    else:
        tutti = json.load(open(p, encoding='utf-8'))['contratti']

    comuni = {}
    p_comuni = os.path.join(REPO, 'bilancio-comune', 'dati', 'comuni.json')
    if os.path.exists(p_comuni):
        for c in json.load(open(p_comuni, encoding='utf-8'))['comuni']:
            if c.get('cf') and c.get('pop'):
                comuni[c['cf']] = c

    scarti = Counter()
    puliti = []
    for L in tutti:
        imp, base, o = L['imp'], L['base'], L['oggetto'].upper()
        if L['esito'] != '1' or not imp or imp <= 0:
            scarti['aggiudicati'] += 1; continue
        if ESCLUDI_OGGETTO.search(o):
            scarti['tetto'] += 1; continue
        if base > 0 and (imp > base * 1.10 or imp < base * 0.20):
            scarti['base'] += 1; continue
        if imp < 1500 or (L['cod'] in SENZA_GARA and imp >= NON_PLAUSIBILE):
            scarti['minimo'] += 1; continue
        if L['persona'] or PERSONA_OGGETTO.search(o):
            scarti['persone'] += 1; continue
        if L['prov'] not in REGIONE_DI:
            scarti['chiari'] += 1; continue
        testo = semplice(L['oggetto'])
        if len(testo) < 14 or len(L['oggetto']) > 260 or re.search('[ÃÂ\ufffd]', L['oggetto']):
            scarti['chiari'] += 1; continue
        L['testo'] = testo
        puliti.append(L)

    per_cat = defaultdict(list)
    for L in puliti:
        per_cat[L['cat']].append(L)
    # la scala: fuori i valori sproporzionati rispetto alla mediana della categoria
    statistiche = {}
    for cid, lista in list(per_cat.items()):
        v = sorted(x['imp'] for x in lista)
        med = v[len(v) // 2]
        dentro = [x for x in lista if scala_ok(x['imp'], med)]
        scarti['scala'] += len(lista) - len(dentro)
        per_cat[cid] = dentro
    for cid, lista in per_cat.items():
        v = sorted(x['imp'] for x in lista)
        if not v:
            continue
        n = len(v)
        med = v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2
        statistiche[cid] = {'n': n, 'mediana': round(med), 'min': round(v[0]), 'max': round(v[-1])}

    # la scelta: per categoria, i più chiari, girando fra regioni e fasce di importo
    rnd = random.Random(2025)
    mazzo = []
    for cid, *_ in CATEGORIE:
        lista = per_cat.get(cid, [])
        if len(lista) < MINIMO_CATEGORIA:
            print(f'categoria {cid}: solo {len(lista)} contratti puliti, resta fuori', file=sys.stderr)
            continue
        lista.sort(key=lambda x: x['imp'])
        fasce = 5
        secchi = [lista[k * len(lista) // fasce:(k + 1) * len(lista) // fasce] for k in range(fasce)]
        for s in secchi:
            s.sort(key=lambda x: -chiarezza(x, x['testo']))
        scelti, regioni_viste, enti_visti, testi_visti = [], Counter(), Counter(), set()
        giro = 0
        while len(scelti) < PER_CATEGORIA and any(secchi):
            s = secchi[giro % fasce]
            giro += 1
            if not s:
                continue
            # il primo, fra i più chiari, di una regione e un ente ancora poco visti
            migliori = s[:40]
            migliori.sort(key=lambda x: (regioni_viste[REGIONE_DI[x['prov']]] + 2 * enti_visti[x['cf']], -chiarezza(x, x['testo'])))
            x = migliori[0]
            s.remove(x)
            chiave = x['testo'][:40].lower()
            if chiave in testi_visti:
                continue
            testi_visti.add(chiave)
            regioni_viste[REGIONE_DI[x['prov']]] += 1
            enti_visti[x['cf']] += 1
            scelti.append(x)
        mazzo += scelti

    # curiosità vere per i contratti «d'oro»: record della categoria, in Italia o nella regione, fra i contratti puliti
    per_cat_reg = defaultdict(list)
    for cid, lista in per_cat.items():
        for x in lista:
            per_cat_reg[(cid, REGIONE_DI[x['prov']])].append(x)
    nel_mazzo = {x['cig'] for x in mazzo}
    oro = {}
    for cid, lista in per_cat.items():
        nome = CAT[cid][1]
        st = statistiche.get(cid)
        if not st or not lista:
            continue
        top = max(lista, key=lambda x: x['imp'])
        bot = min(lista, key=lambda x: x['imp'])
        oro[top['cig']] = f'È il più caro del 2025 in tutta Italia fra i {it(st["n"])} contratti di «{nome}» letti dal gioco.'
        oro.setdefault(bot['cig'], f'È il meno caro del 2025 in tutta Italia fra i {it(st["n"])} contratti di «{nome}» letti dal gioco.')
        con_off = [x for x in lista if x['off'] and x['off'] >= 5]
        if con_off:
            o = max(con_off, key=lambda x: x['off'])
            oro.setdefault(o['cig'], f'Record di offerte: {int(o["off"])} imprese in gara, il numero più alto fra i {it(st["n"])} contratti di «{nome}» del 2025 letti dal gioco.')
    for (cid, reg), lista in per_cat_reg.items():
        if len(lista) >= 8:
            top = max(lista, key=lambda x: x['imp'])
            oro.setdefault(top['cig'], f'È il più caro del 2025 in {reg} fra i {it(len(lista))} contratti di «{CAT[cid][1]}» letti dal gioco.')
    # i record nazionali entrano nel mazzo anche se la scelta li aveva lasciati fuori
    for cid, lista in per_cat.items():
        if cid not in {x['cat'] for x in mazzo}:
            continue
        for x in sorted(lista, key=lambda x: -x['imp'])[:1] + sorted(lista, key=lambda x: x['imp'])[:1]:
            if x['cig'] not in nel_mazzo and x['cig'] in oro:
                mazzo.append(x); nel_mazzo.add(x['cig'])

    cat_ids = [c[0] for c in CATEGORIE if c[0] in {x['cat'] for x in mazzo}]
    carte = []
    for x in sorted(mazzo, key=lambda x: (cat_ids.index(x['cat']), x['imp'])):
        reg = REGIONE_DI[x['prov']]
        com = comuni.get(x['cf']) if x['et'] == 0 else None
        carta = [
            x['cig'],                                  # 0 CIG
            cat_ids.index(x['cat']),                   # 1 categoria
            x['testo'],                                # 2 oggetto in chiaro
            ripara(x['oggetto']),                      # 3 oggetto originale
            titolo_ente(x['ente']),                    # 4 ente
            x['et'],                                   # 5 tipo di ente
            x['prov_nome'] or '',                      # 6 provincia
            REGIONI.index(reg),                        # 7 regione
            procedura(x['cod']),                       # 8 procedura
            round(x['imp'], 2),                        # 9 importo aggiudicato
            int(x['off']) if x['off'] and x['off'] > 0 else 0,  # 10 offerte
            int(com['pop']) if com else 0,             # 11 abitanti del Comune (ISTAT)
            oro.get(x['cig'], ''),                     # 12 curiosità d'oro
            int((x.get('data') or '2025')[:4]),        # 13 anno di pubblicazione
        ]
        carte.append(carta)

    meta = {
        'aggiornato': date.today().isoformat(),
        'anno': ANNO,
        'fonte': {'titolo': 'ANAC, Banca dati nazionale dei contratti pubblici: dati aperti 2025 (CC BY-SA 4.0)', 'url': 'https://dati.anticorruzione.it/opendata'},
        'fonte_abitanti': {'titolo': 'ISTAT, popolazione residente al 1° gennaio 2025', 'url': 'https://demo.istat.it/'},
        'link_cig': LINK_CIG.replace('{}', '%CIG%'),
        'colonne': ['cig', 'categoria', 'testo', 'originale', 'ente', 'tipo_ente', 'provincia', 'regione', 'procedura', 'importo', 'offerte', 'abitanti', 'oro', 'anno'],
        'categorie': [{'id': c, 'nome': CAT[c][1], 'emoji': CAT[c][2], 'facile': CAT[c][3], **statistiche[c]} for c in cat_ids],
        'regioni': REGIONI, 'enti': ENTI, 'procedure': PROCEDURE,
        'regole': [t for _, t in REGOLE],
        'scarti': {k: scarti[k] for k, _ in REGOLE},
        'letti': len(tutti), 'puliti': sum(len(v) for v in per_cat.values()),
    }
    os.makedirs(os.path.dirname(USCITA), exist_ok=True)
    with open(USCITA, 'w', encoding='utf-8') as f:
        f.write('// Generato da scripts/giochi-piu-o-meno-dati.py dai dati aperti ANAC 2025 (CC BY-SA 4.0): non modificare a mano.\n')
        f.write('export const META = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
        f.write('export const CARTE = [\n' + ',\n'.join(json.dumps(c, ensure_ascii=False) for c in carte) + '\n];\n')
    print(f'mazzo: {len(carte)} contratti in {len(cat_ids)} categorie (letti {len(tutti)}, puliti {meta["puliti"]}); scarti {dict(scarti)}', file=sys.stderr)
    for c in meta['categorie']:
        print(f"  {c['id']:18} mazzo {sum(1 for x in carte if cat_ids[x[1]] == c['id']):3}  puliti {c['n']:5}  mediana {c['mediana']:>10,}", file=sys.stderr)
    print('regioni', Counter(REGIONI[x[7]] for x in carte).most_common(), file=sys.stderr)
    print('enti', Counter(ENTI[x[5]] for x in carte).most_common(), file=sys.stderr)
    print("d'oro", sum(1 for x in carte if x[12]), file=sys.stderr)


if __name__ == '__main__':
    main()
