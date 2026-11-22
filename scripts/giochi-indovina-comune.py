#!/usr/bin/env python3
"""Indovina il Comune: la pagina del gioco (giochi/indovina-comune/index.html).

Usa la cornice e lo stile dei giochi di scripts/giochi.py; i dati vengono da giochi/indovina-comune/src/comuni.js
(li prepara scripts/giochi-indovina-comune-dati.py). Scrive solo giochi/indovina-comune/index.html.

Uso: python3 -I -B scripts/giochi-indovina-comune.py
"""
import html
import importlib.util
import json
import os
from collections import Counter

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location('giochi', os.path.join(REPO, 'scripts', 'giochi.py'))
_giochi = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_giochi)
cornice, casa, tabella = _giochi.cornice, _giochi.casa, _giochi.tabella
esc = lambda t: html.escape(str(t), quote=True)
CARTELLA = os.path.join(REPO, 'giochi', 'indovina-comune')

TITOLO = 'Indovina il Comune'
SOMMARIO = 'Ogni giorno un Comune misterioso: sei tentativi e un indizio in più a ogni errore, dai conti del Comune alla provincia.'
BRACCIO = 4  # Legge i conti del Comune


def it(n):
    return f'{n:,}'.replace(',', '.')


def modulo_js(percorso):
    s = open(percorso, encoding='utf-8').read()
    return json.loads(s[s.index('{'):s.rindex('}') + 1])


CSS = '''<style>
  .palco-comune { padding: 16px; }
  .palco-comune .tavolo { grid-template-columns: 64px minmax(0, 1fr); }
  .palco-comune .tavolo .logo-polpo { width: 64px; height: 64px; }
  .ic-livello { margin: 0 0 10px; font-family: var(--cifre); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--inchiostro-3); }
  .ic-indizi { list-style: none; padding: 0; margin: 0 0 14px; display: grid; gap: 8px; }
  .ic-indizio { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 10px; padding: 10px 12px; background: var(--carta); border: 1px solid var(--riga); border-radius: 8px; }
  .ic-indizio b { font-family: var(--titoli); font-size: 17px; color: var(--inchiostro); }
  .ic-indizio p { margin: 2px 0 4px; color: var(--inchiostro-2); font-size: var(--s0); line-height: 1.45; }
  .ic-indizio small { color: var(--inchiostro-3); font-size: 12px; }
  .ic-indizio small a { color: var(--inchiostro-3); }
  .ic-n { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--forse); color: var(--forse); font-family: var(--cifre); font-size: 13px; }
  .ic-coperti { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 14px 0 0; font-size: 13px; color: var(--inchiostro-3); }
  .ic-coperti:empty { display: none; }
  .ic-chip { display: inline-flex; gap: 6px; align-items: center; padding: 3px 10px 3px 4px; border: 1px dashed var(--riga); border-radius: 999px; }
  .ic-chip .ic-n { width: 20px; height: 20px; font-size: 11px; border-color: var(--riga); color: var(--inchiostro-3); }
  .ic-indizio.nuovo { animation: ic-entra .5s ease both; border-color: var(--forse); }
  @keyframes ic-entra { from { transform: translateY(-6px); opacity: 0; } }
  .ic-prova { position: relative; display: grid; gap: 6px; }
  .ic-prova[hidden] { display: none; }
  .ic-prova label { font-size: 14px; color: var(--inchiostro-2); }
  .ic-riga { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
  .ic-riga input { font: inherit; font-size: 17px; padding: 10px 12px; min-width: 0; background: var(--fondo); color: var(--inchiostro); border: 1.5px solid var(--inchiostro-3); border-radius: 10px; }
  .ic-riga input:focus-visible { outline: 3px solid var(--accento); outline-offset: 1px; }
  .ic-sug { list-style: none; margin: 0; padding: 0; border: 1px solid var(--riga); border-radius: 8px; overflow: hidden; background: var(--carta); max-height: 300px; overflow-y: auto; }
  .ic-sug[hidden] { display: none; }
  .ic-sug li { padding: 9px 12px; cursor: pointer; font-size: var(--s0); color: var(--inchiostro); }
  .ic-sug li + li { border-top: 1px solid var(--riga-tenue); }
  .ic-sug li[aria-selected="true"], .ic-sug li:hover { background: var(--accento-tenue); }
  .ic-sug li.vuoto { cursor: default; color: var(--inchiostro-3); }
  .ic-sug small { display: block; color: var(--inchiostro-3); font-size: var(--s-1); }
  #aiuto { margin: 10px 0 0; font-size: 14px; }
  #aiuto:disabled { color: var(--inchiostro-3); cursor: default; text-decoration: none; }
  .ic-tentativi { list-style: none; padding: 0; margin: 14px 0 0; display: grid; gap: 8px; }
  .ic-tentativo { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 10px; padding: 10px 12px; border: 1px solid var(--riga); border-radius: 8px; }
  .ic-tentativo[data-r="stessa"] { border-color: var(--forse); }
  .ic-tentativo[data-r="confinante"] { border-color: color-mix(in srgb, var(--forse) 55%, var(--accento)); }
  .ic-tentativo[data-r="giusto"] { border-color: var(--si); }
  .ic-tentativo b { color: var(--inchiostro); }
  .ic-tentativo small { color: var(--inchiostro-3); }
  .ic-tentativo p { margin: 4px 0 0; display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 14px; color: var(--inchiostro-2); }
  .ic-q { font-size: 18px; line-height: 1.3; text-align: center; }
  .ic-q small { display: block; font-family: var(--cifre); font-size: 11px; color: var(--inchiostro-3); }
  .ic-dir { display: inline-flex; align-items: center; gap: 4px; }
  .ic-freccia { width: 18px; height: 18px; fill: var(--accento); flex: none; }
  #fine-quadrati { font-size: 22px; letter-spacing: 2px; margin: 6px 0; }
  .ic-scheda-testa { margin: 14px 0 6px; color: var(--inchiostro-2) !important; }
  .ic-scheda { width: 100%; border-collapse: collapse; font-size: 14px; }
  .ic-scheda th, .ic-scheda td { text-align: left; padding: 6px 8px 6px 0; border-bottom: 1px solid var(--riga-tenue); color: var(--inchiostro-2); vertical-align: top; }
  .ic-scheda thead th { font-family: var(--cifre); font-size: 11px; letter-spacing: .04em; color: var(--inchiostro-3); border-bottom-color: var(--inchiostro-3); }
  .ic-scheda tbody th { color: var(--inchiostro); font-weight: 600; }
  .ic-scheda td a { color: var(--inchiostro-3); font-size: 12.5px; }
  .ic-link { display: flex; flex-wrap: wrap; gap: 8px; }
  .ic-link .btn { margin: 0 !important; }
  .scelta-livello { border: 0; padding: 0; margin: 12px 0 0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .scelta-livello[hidden] { display: none; }
  .scelta-livello legend { font-size: 14px; color: var(--inchiostro-2); margin-bottom: 6px; padding: 0; }
  .scelta-livello label { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border: 1px solid var(--riga); border-radius: 999px; font-size: 14px; color: var(--inchiostro-2); cursor: pointer; }
  .scelta-livello label:has(input:checked) { border-color: var(--forse); color: var(--inchiostro); }
  .scelta-livello input { accent-color: var(--accento); }
  .scelta-livello input:focus-visible { outline: 2px solid var(--accento); }
  #serie-apertura[hidden] { display: none; }
  @media (max-width: 560px) { .palco-comune { padding: 10px; } .palco-comune .tavolo { grid-template-columns: minmax(0, 1fr); } .palco-comune .tavolo .logo-polpo { width: 48px; height: 48px; } .ic-scheda { font-size: 13px; } }
  @media (prefers-reduced-motion: reduce) { .ic-indizio.nuovo { animation: none; } }
</style>'''


def pagina():
    d = modulo_js(os.path.join(CARTELLA, 'src', 'comuni.js'))
    fonti = d['fonti']
    completi = [r for r in d['comuni'] if len(r) > 7]
    a = lambda k: f'<a href="{esc(fonti[k]["url"])}" target="_blank" rel="noopener">{esc(fonti[k]["titolo"])}</a>'
    capoluoghi = sum(1 for r in completi if r[6])
    grandi = sum(1 for r in completi if not r[6] and r[3] >= 30000)
    diecimila = sum(1 for r in completi if not r[6] and 10000 <= r[3] < 30000)
    medi = sum(1 for r in completi if r[3] >= 10000)

    indizi = [
        ('1', 'Dove e quanto è grande', 'La ripartizione geografica (Nord-ovest, Nord-est, Centro, Sud, Isole) e la fascia di abitanti. Se nel gruppo del giorno ci sono meno di tre Comuni con la stessa fascia nella stessa ripartizione, la fascia si allarga a quelle vicine.', ['istat_elenco', 'istat_pop'], 'ISTAT, abitanti al 1° gennaio 2025'),
        ('2', 'Quanto spende', 'La spesa impegnata nell\'anno per servizi e opere (senza partite di giro), divisa per gli abitanti, accanto alla mediana dei Comuni della stessa fascia di abitanti.', ['bdap'], f'rendiconti {d["anni"]["bilancio"][0]} (o {d["anni"]["bilancio"][1]})'),
        ('3', 'Debiti e incassi', 'Il debito per abitante (Piano degli indicatori, indicatore 10.4) e la quota delle entrate proprie accertate nell\'anno (tributi ed entrate extratributarie) davvero incassata.', ['bdap'], f'rendiconti {d["anni"]["bilancio"][0]}'),
        ('4', 'Appalti e PNRR', 'La quota del valore degli appalti affidata senza gara, e il numero di progetti del PNRR localizzati sul territorio del Comune.', ['anac', 'pnrr'], f'appalti {d["anni"]["appalti"]}, PNRR estrazione del {d["anni"]["pnrr"]}'),
        ('5', 'Rifiuti', 'La spesa per i rifiuti per abitante (programma 09.03 del bilancio) e chi fa la raccolta, con quanti Comuni serve. Nel nome del gestore il gioco copre le parole che svelerebbero il Comune, la provincia o la Regione.', ['bdap', 'arera'], 'ARERA, elenco degli operatori'),
        ('6', 'La provincia', 'La provincia o città metropolitana e la Regione: l\'ultimo indizio, il più preciso.', ['istat_elenco'], 'ISTAT, codici al 2026'),
    ]
    righe_i = [[(n, int(n)), (esc(t), t), (esc(s), s), (' · '.join(a(k) for k in ks), fonti[ks[0]]['titolo']), (esc(q), q)] for n, t, s, ks, q in indizi]
    t_indizi = tabella('t-indizi', [('N.', 'n'), ('Indizio', 't'), ('Che cosa dice', 't'), ('Fonte', 't'), ('Anno', 't')], righe_i)

    per_regione = Counter(d['regioni'][d['province'][r[2]][1]] for r in completi)
    rip = {'Nord-ovest': ['Piemonte', "Valle d'Aosta", 'Liguria', 'Lombardia'], 'Nord-est': ['Trentino-Alto Adige', 'Veneto', 'Friuli-Venezia Giulia', 'Emilia-Romagna'],
           'Centro': ['Toscana', 'Umbria', 'Marche', 'Lazio'], 'Sud': ['Abruzzo', 'Molise', 'Campania', 'Puglia', 'Basilicata', 'Calabria'], 'Isole': ['Sicilia', 'Sardegna']}
    rip_di = {r: k for k, v in rip.items() for r in v}
    conf = d['verifica']['confinanti']
    righe_r = [[(esc(r), r), (esc(rip_di[r]), rip_di[r]), (esc(', '.join(conf[r]) or 'nessuna (è un\'isola)'), len(conf[r])), (it(per_regione[r]), per_regione[r])] for r in d['regioni']]
    t_regioni = tabella('t-regioni', [('Regione', 't'), ('Ripartizione', 't'), ('Regioni confinanti', 'n'), ('Comuni nel gioco', 'n')], righe_r)

    livelli = [
        ('Capoluoghi', 'Sfida del lunedì e del martedì; partita libera', 'i capoluoghi di provincia e di città metropolitana', capoluoghi, '×1'),
        ('Sopra i 30.000', 'Sfida da mercoledì a venerdì', 'i Comuni sopra i 30.000 abitanti che non sono capoluoghi', grandi, '×1,3'),
        ('Da 10.000 a 30.000', 'Sfida del sabato e della domenica', 'i Comuni da 10.000 a 30.000 abitanti che non sono capoluoghi', diecimila, '×1,6'),
        ('Medi', 'Partita libera', 'tutti i Comuni da 10.000 abitanti in su', medi, '×1,3'),
        ('Tutti', 'Partita libera', 'tutti i Comuni con i dati per gli indizi, anche i più piccoli', len(completi), '×2'),
    ]
    righe_l = [[(esc(n), n), (esc(q), q), (esc(c), c), (it(k), k), (esc(p), float(p[1:].replace(',', '.')))] for n, q, c, k, p in livelli]
    t_livelli = tabella('t-livelli', [('Difficoltà', 't'), ('Quando', 't'), ('Comuni', 't'), ('Quanti', 'n'), ('Punti', 'n')], righe_l)

    scelte = ''.join(f'<label><input type="radio" name="livello" value="{k}"{" checked" if k == "capoluoghi" else ""}> {n}</label>'
                     for k, n in (('capoluoghi', 'Capoluoghi'), ('medi', 'Medi'), ('tutti', 'Tutti')))
    corpo = f'''{CSS}
  <section class="gioco" aria-labelledby="t-gioco">
    <h2 id="t-gioco" class="sr-only">Il gioco</h2>
    <div class="barra-gioco"><span>Tentativo <b id="n-tentativo">1 / 6</b></span><span>Indizi <b id="n-indizi">1 / 6</b></span><span>Se indovini ora <b id="vale">0</b></span><span id="serie"></span><button type="button" class="suono" id="suono" aria-pressed="true">🔊 Suono</button></div>
    <p class="esito" id="esito" aria-live="polite"></p>
    <div class="palco palco-truffa palco-comune">
      <div class="tavolo" hidden>
        {casa.polpo_mini(BRACCIO, classe='logo-polpo')}
        <div>
          <p class="ic-livello" id="ic-livello"></p>
          <h3 class="sr-only">Gli indizi</h3>
          <ol class="ic-indizi" id="indizi"></ol>
          <form class="ic-prova" id="prova" autocomplete="off" role="search">
            <label for="campo">Scrivi un Comune e scegli dai suggerimenti</label>
            <div class="ic-riga"><input type="text" id="campo" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggerimenti" placeholder="es. Pavia, Lecce, Bra" enterkeyhint="go" spellcheck="false"><button type="submit" class="btn btn-primario">Prova</button></div>
            <ul class="ic-sug" id="suggerimenti" role="listbox" aria-label="Comuni suggeriti" hidden></ul>
          </form>
          <button type="button" class="link" id="aiuto">Chiedi un indizio in più</button>
          <h3 class="sr-only">I tuoi tentativi</h3>
          <ol class="ic-tentativi" id="tentativi"></ol>
          <p class="ic-coperti" id="coperti"></p>
        </div>
      </div>
      <div class="velo" id="apertura"><div class="velo-box">
        <h2>{TITOLO}</h2>
        <p>Il Polpo ha in mente un Comune italiano. Tu hai sei tentativi per indovinarlo.</p>
        <ol>
          <li>Si parte con un indizio: <b>dove sta e quanto è grande</b>. A ogni tentativo sbagliato se ne apre un altro, dai conti del Comune (spesa, debiti, appalti, PNRR, rifiuti) fino alla <b>provincia</b>, per ultima.</li>
          <li>Per ogni Comune che scrivi il Polpo ti dice se è nella <b>stessa Regione</b> o in una <b>confinante</b>, se il misterioso ha <b>più o meno abitanti</b>, e <b>da che parte</b> e <b>quanto lontano</b> sta.</li>
          <li>Meno tentativi e meno indizi usi, più punti fai. Puoi anche chiedere un indizio senza sprecare un tentativo, ma costa punti.</li>
          <li>La <b>sfida del giorno</b> è la stessa per tutti e si gioca una volta: lunedì e martedì un capoluogo, da mercoledì a venerdì un Comune sopra i 30.000 abitanti, nel fine settimana uno da 10.000 a 30.000.</li>
        </ol>
        <p id="giorno-livello" class="vicino"></p>
        <p id="serie-apertura" class="vicino" hidden></p>
        <fieldset class="scelta-livello" id="scelta-livello"><legend>Partita libera: scegli i Comuni</legend>{scelte}</fieldset>
        <div class="scelta-partita"><button type="button" class="btn btn-primario" id="gioca">Gioca</button><button type="button" class="btn" id="gioca-giorno">Sfida del giorno</button><small>La sfida del giorno è lo stesso Comune per tutti, oggi: confrontati con chi vuoi.</small></div>
        <div id="premi"></div>
        <p class="vicino" id="in-testa" hidden></p>
      </div></div>
      <div class="velo" id="fine" hidden><div class="velo-box" role="dialog" aria-labelledby="t-fine">
        <h2 id="t-fine">Fine della partita</h2>
        <p><span id="fine-punti">0</span> <span id="fine-dettaglio"></span></p>
        <p id="fine-quadrati" aria-hidden="true"></p>
        <div id="fine-premi"></div>
        <div id="fine-classifica" class="classifica" hidden></div>
        <div id="scheda"></div>
        <button type="button" class="btn btn-primario" id="rigioca">Un altro Comune</button><button type="button" class="btn" id="condividi">Sfida un amico</button>
      </div></div>
    </div>
  </section>

  <section class="regole-gioco" aria-labelledby="t-regole">
    <div class="occhiello">I dati del gioco</div>
    <h2 id="t-regole">Sei indizi, tutti dai dati pubblici</h2>
    <p>Il gioco usa gli stessi dati degli strumenti del Polpo: {it(len(d["comuni"]))} Comuni dall'elenco ISTAT, {it(len(completi))} con i numeri per tutti gli indizi. Quando manca un numero, l'indizio lo dice. «Comuni simili» vuol dire stessa fascia di abitanti: la mediana è il valore di mezzo, metà dei Comuni sta sopra e metà sotto. Un numero alto o basso non è un giudizio: dipende da quanti servizi fa il Comune, da quanti turisti ha, da come conta le spese.</p>
    {t_indizi}
    <p class="nota">Tocca i titoli delle colonne per ordinare.</p>
    <h2>Le difficoltà</h2>
    <p>Il Comune del giorno si sceglie dalla data, da un elenco rimescolato una volta per tutte: ogni difficoltà ha i suoi giorni e il suo elenco, che si ricomincia solo quando è finito. Così lo stesso Comune non torna prima di un anno.</p>
    {t_livelli}
    <h2>Regione giusta, confinante o lontana</h2>
    <p>Dopo ogni tentativo il Polpo confronta la Regione del Comune che hai scritto con quella del misterioso. Le Regioni confinanti sono quelle che si toccano via terra, controllate sui confini ISTAT; Sicilia e Sardegna non confinano con nessuno. La freccia e la distanza vanno dal centro del tuo Comune al centro del misterioso, calcolati sui confini ISTAT al 1° gennaio 2026.</p>
    {t_regioni}
    <p class="nota">Fonti: {a("istat_elenco")}; {a("istat_confini")}; {a("istat_pop")}; {a("bdap")}; {a("arera")}; {a("anac")}; {a("pnrr")}. Aggiornato al {esc(d["aggiornato"])}. Vuoi i numeri veri del tuo Comune? <a href="../../per-te/">Per te</a> li mette insieme.</p>
  </section>'''
    return cornice('../../', TITOLO, 'Gioco: indovina il Comune misterioso in sei tentativi, con indizi dai conti dei Comuni (spesa, debiti, appalti, PNRR, rifiuti), dalla provincia e dalla distanza. Ogni giorno una sfida nuova, uguale per tutti.',
                   f'Gioca con il Polpo · braccio {BRACCIO + 1}, {casa.BRACCIA[BRACCIO][1]}', TITOLO,
                   'Un Comune misterioso, sei tentativi, un indizio in più a ogni errore. Tutti i numeri vengono dai conti pubblici dei Comuni.',
                   corpo, braccio=BRACCIO, script='<script type="module" src="web/gioco.js"></script>')


if __name__ == '__main__':
    with open(os.path.join(CARTELLA, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(pagina())
    print('scritto giochi/indovina-comune/index.html')
