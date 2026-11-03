#!/usr/bin/env python3
"""Gioca con il Polpo: le pagine dei giochi (giochi/<nome>/index.html) e la pagina d'ingresso giochi/index.html.

Il Polpo differenzia: i rifiuti e le regole stanno in giochi/differenzia/src/rifiuti.json (con la fonte di ogni
voce); questo script ne fa src/rifiuti.js per il browser e la tabella di tutte le regole sotto il gioco.

Uso: python3 -I scripts/giochi.py
"""
import html
import importlib.util
import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location('storie', os.path.join(REPO, 'scripts', 'storie.py'))
_storie = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_storie)
casa, tabella, JS_ORDINA = _storie.casa, _storie.tabella, _storie.JS_ORDINA
esc = lambda t: html.escape(str(t), quote=True)

CONTENITORI = {'carta': 'Carta', 'plastica': 'Plastica', 'vetro': 'Vetro', 'organico': 'Organico', 'indifferenziato': 'Secco (indifferenziato)', 'isola': 'Isola ecologica o raccolta dedicata'}

GIOCHI = [  # cartella, titolo, sommario, braccio
    ('differenzia', 'Il Polpo differenzia', 'I rifiuti cadono: afferrali con un tentacolo e lanciali nel bidone giusto. Sai dove va il cartone della pizza?', 7),
    ('truffa', 'Truffa o no?', 'Arrivano SMS, WhatsApp, email e telefonate: scorri a sinistra se è una truffa, a destra se è affidabile. Poi il perché.', 3),
]

CSS = '''
  .storie-testa { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 20px; align-items: center; margin: 28px 0 8px; }
  .storie-testa .logo-polpo { width: 110px; height: 110px; }
  .storie-testa h1 { margin: 0; font-size: var(--s4); line-height: 1; }
  .storie-testa p { margin: 8px 0 0; color: var(--inchiostro-2); max-width: 62ch; }
  @media (max-width: 560px) { .storie-testa { grid-template-columns: minmax(0, 1fr); } .storie-testa .logo-polpo { width: 80px; height: 80px; } }
  .gioco { max-width: 860px; margin: 18px auto 0; }
  .palco { position: relative; border: 1px solid var(--riga); border-radius: 6px; background: var(--fondo); overflow: hidden; touch-action: none; user-select: none; -webkit-user-select: none; }
  .palco canvas { display: block; width: 100%; outline: none; }
  .palco canvas:focus-visible { box-shadow: inset 0 0 0 3px var(--accento); }
  .barra-gioco { display: flex; gap: 6px 18px; flex-wrap: wrap; align-items: baseline; justify-content: space-between; padding: 6px 2px; font-family: var(--cifre); font-size: 13px; color: var(--inchiostro-2); }
  .barra-gioco b { font-family: var(--titoli); font-size: 22px; color: var(--inchiostro); letter-spacing: -0.02em; }
  #vite { color: var(--accento); font-size: 18px; letter-spacing: 2px; }
  #serie { color: var(--accento); }
  .esito { min-height: 42px; margin: 0 0 8px; font-size: 14px; line-height: 1.35; color: var(--inchiostro-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .esito[data-tono="no"] { color: var(--accento); }
  .esito[data-tono="si"] { color: var(--si); }
  .esito[data-tono="forse"] { color: var(--forse); }
  .velo { position: absolute; inset: 0; display: grid; place-items: center; padding: 18px; background: color-mix(in srgb, var(--fondo) 88%, transparent); overflow-y: auto; }
  .velo[hidden] { display: none; }
  .velo-box { max-width: 520px; text-align: left; }
  .velo-box h2 { font-size: clamp(26px, 4vw, 38px); margin: 0 0 10px; line-height: 1.05; }
  .velo-box p, .velo-box li { color: var(--inchiostro-2); font-size: var(--s0); }
  .velo-box ol, .velo-box ul { padding-left: 18px; display: grid; gap: 6px; }
  .velo-box .btn { margin: 8px 10px 0 0; }
  #fine-punti { font-family: var(--titoli); font-size: clamp(48px, 9vw, 80px); line-height: 1; color: var(--accento); display: block; }
  #fine-errori { max-height: 40vh; overflow-y: auto; }
  .regole-gioco { max-width: 860px; margin: 48px auto 0; padding-top: 24px; border-top: 2px solid var(--inchiostro); }
  .regole-gioco h2 { font-size: clamp(26px, 3.8vw, 38px); margin: 0 0 10px; }
  .regole-gioco p { color: var(--inchiostro-2); }
  .regole-gioco .scorri { overflow-x: auto; }
  .ordinabile { width: 100%; border-collapse: collapse; font-size: var(--s0); }
  .ordinabile th { text-align: left; border-bottom: 1px solid var(--inchiostro-3); padding: 0; white-space: nowrap; }
  .ordinabile th button { all: unset; cursor: pointer; display: block; padding: 8px 10px 8px 0; font-family: var(--cifre); font-size: 11.5px; letter-spacing: .04em; color: var(--inchiostro-3); }
  .ordinabile th button:focus-visible { outline: 2px solid var(--accento); }
  .ordinabile th[aria-sort] button { color: var(--inchiostro); }
  .ordinabile th[aria-sort="descending"] button::after { content: " ↓"; color: var(--accento); }
  .ordinabile th[aria-sort="ascending"] button::after { content: " ↑"; color: var(--accento); }
  .ordinabile td { padding: 7px 10px 7px 0; border-bottom: 1px solid var(--riga-tenue); color: var(--inchiostro-2); vertical-align: top; }
  .ordinabile td:first-child { color: var(--inchiostro); font-weight: 600; }
  .schede-giochi { list-style: none; padding: 0; margin: 26px 0 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 14px; }
  .schede-giochi a { display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 14px; padding: 18px; background: var(--carta); border: 1px solid var(--riga); border-radius: 4px; text-decoration: none; color: var(--inchiostro-2); }
  .schede-giochi a:hover { border-color: var(--accento); }
  .schede-giochi b { display: block; font-family: var(--titoli); font-size: 21px; color: var(--inchiostro); margin-bottom: 6px; }
  .st-polpo { width: 46px; height: 46px; overflow: visible; }
  .regole-gioco ol.lista { padding-left: 20px; display: grid; gap: 8px; color: var(--inchiostro-2); }
  .palco-truffa { padding: 16px; touch-action: auto; }
  .palco-truffa .velo { position: relative; inset: auto; background: none; padding: 6px 0; display: block; }
  .palco-truffa .velo[hidden], .tavolo[hidden] { display: none; }
  .tavolo { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 14px; align-items: start; margin-top: 6px; }
  .tavolo .logo-polpo { width: 76px; height: 76px; overflow: visible; transition: transform .2s; }
  .tavolo .logo-polpo.contento { animation: salta .5s ease; }
  .tavolo .logo-polpo.triste { animation: scuoti .5s ease; }
  @keyframes salta { 40% { transform: translateY(-14px) scale(1.05); } }
  @keyframes scuoti { 20%, 60% { transform: rotate(-9deg); } 40%, 80% { transform: rotate(9deg); } }
  .mazzo { position: relative; }
  .carta { position: relative; background: var(--foglio, #fff); color: var(--foglio-inchiostro, #1d1f24); border-radius: 18px; padding: 16px 18px 22px; box-shadow: 0 18px 40px -20px rgba(0,0,0,.6); touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: grab; outline: none; overflow: hidden; }
  .carta:focus-visible { box-shadow: 0 0 0 3px var(--accento); }
  .carta.entra { animation: entra .28s ease; }
  .carta.esce { transition: transform .35s ease, opacity .35s; }
  .carta.esce.a-sinistra { transform: translateX(-30px) rotate(-3deg); }
  .carta.esce.a-destra { transform: translateX(30px) rotate(3deg); }
  @keyframes entra { from { transform: translateY(18px) scale(.97); opacity: 0; } }
  .carta[data-verso="truffa"] { box-shadow: 0 0 0 3px var(--accento); }
  .carta[data-verso="affidabile"] { box-shadow: 0 0 0 3px var(--si); }
  .carta-testa { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; font-size: 13px; color: #5d6270; margin-bottom: 8px; }
  .carta-icona { font-size: 18px; }
  .carta-canale { font-family: var(--cifre); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
  .carta-mittente { font-weight: 700; color: #1d1f24; overflow-wrap: anywhere; }
  .carta-testo { margin: 0; font-size: 17px; line-height: 1.45; overflow-wrap: anywhere; }
  .carta-tempo { position: absolute; left: 0; right: 0; bottom: 0; height: 5px; background: #e3e1da; }
  .carta-tempo i { display: block; height: 100%; width: 100%; background: var(--accento); }
  .carta-timbro { position: absolute; top: 14px; right: 14px; font-family: var(--cifre); font-weight: 700; font-size: 14px; letter-spacing: .12em; padding: 4px 10px; border: 3px solid currentColor; border-radius: 6px; transform: rotate(8deg); opacity: 0; }
  .carta.esce .carta-timbro { opacity: 1; color: var(--accento); }
  .scelte { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
  .scelte[hidden] { display: none; }
  .scelte .btn { justify-content: center; padding: 14px 10px; font-size: 13px; }
  #no { border-color: var(--accento); color: var(--accento); }
  #si { border-color: var(--si); color: var(--si); }
  .spiega { margin-top: 14px; padding: 16px 18px; background: var(--carta); border: 1px solid var(--riga); border-radius: 8px; }
  .spiega[hidden] { display: none; }
  #spiega-titolo { margin: 0 0 6px; font-family: var(--titoli); font-size: 22px; }
  #spiega-titolo[data-tono="si"] { color: var(--si); }
  #spiega-titolo[data-tono="no"] { color: var(--accento); }
  .spiega p, .spiega li { color: var(--inchiostro-2); font-size: var(--s0); }
  .spiega ul { padding-left: 18px; margin: 4px 0 0; display: grid; gap: 4px; }
  .spiega-et { font-family: var(--cifre); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--inchiostro-3) !important; margin: 10px 0 0; }
  #spiega-fonte { font-size: 13px; margin: 10px 0 0; }
  @media (max-width: 560px) { .tavolo { grid-template-columns: minmax(0, 1fr); } .tavolo .logo-polpo { width: 56px; height: 56px; } .carta-testo { font-size: 16px; } }
'''


def cornice(prof, titolo, descrizione, occhiello, h1, intro, corpo, braccio=None, script=''):
    return f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!--icone--><link rel="icon" href="{prof}comune/icona-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="{prof}comune/marchio.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{prof}comune/icona-180.png"><!--/icone-->
<title>{esc(titolo)} · Il Polpo civico</title>
<meta name="description" content="{esc(descrizione)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Atkinson+Hyperlegible+Next:wght@400;600;800&family=Atkinson+Hyperlegible+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="{prof}comune/stile.css">
<style>{CSS}</style>
</head>
<body>
<div class="max">
  <div class="banda-sostieni"><span><a href="{prof}">← Il Polpo civico</a>{'' if prof == '../' else f' · <a href="{prof}giochi/">Gioca con il Polpo</a>'}</span><span>Promosso dall'<a href="https://www.gianrobertocasaleggio.com/" target="_blank" rel="noopener">Associazione Gianroberto Casaleggio</a></span></div>
  <header class="storie-testa">
    {casa.polpo_mini(braccio, classe='logo-polpo')}
    <div>
      <div class="occhiello">{esc(occhiello)}</div>
      <h1>{esc(h1)}</h1>
      <p>{intro}</p>
    </div>
  </header>
{corpo}
</div>
{JS_ORDINA}
{script}
</body>
</html>
'''


def differenzia():
    cartella = os.path.join(REPO, 'giochi', 'differenzia')
    dati = json.load(open(os.path.join(cartella, 'src', 'rifiuti.json'), encoding='utf-8'))
    with open(os.path.join(cartella, 'src', 'rifiuti.js'), 'w', encoding='utf-8') as f:
        f.write('// Generato da scripts/giochi.py da rifiuti.json: non modificare a mano.\nexport default '
                + json.dumps({'aggiornato': dati['aggiornato'], 'fonti': dati['fonti'], 'rifiuti': dati['rifiuti']}, ensure_ascii=False) + ';\n')
    fonti = dati['fonti']
    righe = [[(f'{r.get("emoji", "")} {esc(r["nome"])}', r['nome']),
              (esc(CONTENITORI[r['contenitore']]) + (' <small>o ' + ', '.join(esc(CONTENITORI[a]) for a in r['alternative']) + '</small>' if r.get('alternative') else ''), CONTENITORI[r['contenitore']]),
              ('sì' if r.get('dipende') else '', 'sì' if r.get('dipende') else ''),
              (esc(r['spiegazione']), r['spiegazione']),
              (f'<a href="{esc(fonti[r["fonte"]]["url"])}" target="_blank" rel="noopener">{esc(fonti[r["fonte"]]["titolo"])}</a>', fonti[r['fonte']]['titolo'])]
             for r in sorted(dati['rifiuti'], key=lambda r: (list(CONTENITORI).index(r['contenitore']), r['nome']))]
    regole = tabella('t-rifiuti', [('Rifiuto', 't'), ('Dove va', 't'), ('Dipende dal Comune', 't'), ('Perché', 't'), ('Fonte', 't')], righe)
    n, dip = len(dati['rifiuti']), sum(1 for r in dati['rifiuti'] if r.get('dipende'))
    corpo = f'''  <section class="gioco" aria-labelledby="t-gioco">
    <h2 id="t-gioco" class="sr-only">Il gioco</h2>
    <div class="barra-gioco" aria-live="off"><span>Punti <b id="punti">0</b></span><span>Tempo <b id="tempo">90</b></span><span id="vite" aria-label="3 vite su 3">♥♥♥</span><span id="serie"></span></div>
    <p class="esito" id="esito" aria-live="polite"></p>
    <div class="palco">
      <canvas id="tela" tabindex="0" aria-label="Campo di gioco: i rifiuti cadono verso sei contenitori. Con la tastiera, le frecce destra e sinistra spostano il Polpo sotto un contenitore, lo spazio lancia lì il rifiuto più in basso; i tasti da 1 a 6 scelgono direttamente il contenitore." role="application"></canvas>
      <div class="velo" id="apertura"><div class="velo-box">
        <h2>Il Polpo differenzia</h2>
        <p>I rifiuti cadono e il Polpo corre sotto di loro. Afferrali: il Polpo li tiene con un tentacolo e li porta nel bidone giusto.</p>
        <ol>
          <li><b>Trascina</b> il rifiuto nel suo bidone, con il mouse o con il dito. Oppure <b>lancialo</b> con uno swipe veloce verso il bidone.</li>
          <li>Hai <b>90 secondi e tre vite</b>: ogni errore ne toglie una. Cinque giusti di fila raddoppiano i punti.</li>
          <li>Alcune regole <b>cambiano da Comune a Comune</b>: il gioco te lo dice.</li>
        </ol>
        <p><small>Con la tastiera: le frecce spostano il Polpo sotto un bidone, lo spazio gli fa lanciare lì il rifiuto più in basso; i tasti da 1 a 6 scelgono il bidone; P mette in pausa.</small></p>
        <button type="button" class="btn btn-primario" id="gioca">Gioca</button>
      </div></div>
      <div class="velo" id="fine" hidden><div class="velo-box" role="dialog" aria-labelledby="t-fine">
        <h2 id="t-fine">Fine della partita</h2>
        <p><span id="fine-punti">0</span> <span id="fine-dettaglio"></span></p>
        <p><b>Dove hai sbagliato</b></p>
        <ul id="fine-errori"></ul>
        <button type="button" class="btn btn-primario" id="rigioca">Gioca ancora</button><button type="button" class="btn" id="condividi">Condividi il risultato</button>
      </div></div>
    </div>
  </section>

  <section class="regole-gioco" aria-labelledby="t-regole">
    <div class="occhiello">Le regole del gioco</div>
    <h2 id="t-regole">Dove va: {n} rifiuti, con la fonte</h2>
    <p>Le regole vengono dai consorzi nazionali del riciclo e dalle indicazioni ufficiali. Per {dip} rifiuti la regola cambia da Comune a Comune: il gioco accetta tutte le risposte possibili, ma a casa vale il calendario del tuo gestore della raccolta.</p>
    {regole}
    <p class="nota">Tocca i titoli delle colonne per ordinare. Aggiornato al {esc(dati["aggiornato"])}. Hai visto un rifiuto abbandonato per strada? <a href="../../segnalazioni/">Segnalalo con il Polpo</a>.</p>
  </section>'''
    pagina = cornice('../../', 'Il Polpo differenzia', 'Gioco della raccolta differenziata: lancia ogni rifiuto nel bidone giusto con il Polpo civico. Con la spiegazione e la fonte di ogni regola.',
                     'Gioca con il Polpo · braccio 8, Si prende cura dei luoghi', 'Il Polpo differenzia',
                     'Novanta secondi per lanciare ogni rifiuto nel bidone giusto. Poi la spiegazione di ogni errore, con la fonte.',
                     corpo, braccio=7, script='<script type="module" src="web/gioco.js"></script>')
    open(os.path.join(cartella, 'index.html'), 'w', encoding='utf-8').write(pagina)
    return n



def truffa():
    cartella = os.path.join(REPO, 'giochi', 'truffa')
    corpo = f'''  <section class="gioco" aria-labelledby="t-gioco">
    <h2 id="t-gioco" class="sr-only">Il gioco</h2>
    <div class="barra-gioco"><span>Punti <b id="punti">0</b></span><span>Messaggio <b id="numero">1 / 15</b></span><span id="vite" aria-label="3 vite su 3">♥♥♥</span></div>
    <p class="esito" id="esito" aria-live="polite"></p>
    <div class="palco palco-truffa">
      <div class="tavolo" hidden>
        {casa.polpo_mini(3, classe='logo-polpo')}
        <div>
          <div class="mazzo"><div class="carta" id="carta" tabindex="0" role="group" aria-roledescription="messaggio"></div></div>
          <div class="scelte" id="scelte" hidden>
            <button type="button" class="btn" id="no">← Truffa</button>
            <button type="button" class="btn" id="si">Affidabile →</button>
          </div>
          <div class="spiega" id="spiega" hidden>
            <p id="spiega-titolo"></p>
            <p id="spiega-perche"></p>
            <div id="spiega-segnali"></div>
            <p id="spiega-fonte"></p>
            <button type="button" class="btn btn-primario" id="avanti">Avanti</button>
          </div>
        </div>
      </div>
      <div class="velo" id="apertura"><div class="velo-box">
        <h2>Truffa o no?</h2>
        <p>Arrivano quindici messaggi: SMS, WhatsApp, email, telefonate, siti. Alcuni sono veri, altri sono truffe copiate da quelle che girano davvero.</p>
        <ol>
          <li><b>Scorri a sinistra</b> se è una truffa, <b>a destra</b> se è affidabile. Oppure usa i pulsanti, o le frecce della tastiera.</li>
          <li>Hai pochi secondi per decidere, come nella vita: i messaggi più difficili arrivano alla fine.</li>
          <li>Dopo ogni risposta il Polpo ti spiega il perché e i segnali da guardare. Tre errori e la partita finisce.</li>
        </ol>
        <button type="button" class="btn btn-primario" id="gioca">Gioca</button>
      </div></div>
      <div class="velo" id="fine" hidden><div class="velo-box" role="dialog" aria-labelledby="t-fine">
        <h2 id="t-fine">Fine della partita</h2>
        <p><span id="fine-punti">0</span> <span id="fine-dettaglio"></span></p>
        <p><b>Dove hai sbagliato</b></p>
        <ul id="fine-errori"></ul>
        <button type="button" class="btn btn-primario" id="rigioca">Gioca ancora</button><button type="button" class="btn" id="condividi">Sfida qualcuno</button>
        <p><small>Hai ricevuto un messaggio sospetto davvero? <a href="../../truffe/">Controllalo con «È una truffa?»</a>.</small></p>
      </div></div>
    </div>
  </section>

  <section class="regole-gioco" aria-labelledby="t-regole">
    <div class="occhiello">Le cinque regole del Polpo</div>
    <h2 id="t-regole">Come si riconosce una truffa</h2>
    <ol class="lista">
      <li><b>Nessuno ti chiede codici.</b> Banche, Poste, enti pubblici e forze dell'ordine non chiedono mai codici, PIN o password, nemmeno quello arrivato per SMS.</li>
      <li><b>La fretta è un segnale.</b> «Entro 24 ore», «conto bloccato», «ultimo avviso»: servono a non farti pensare.</li>
      <li><b>Il link si legge, non si apre.</b> Se il sito non è quello ufficiale (poste.it, inps.it, brt.it…), è falso. Apri tu il sito o l'app.</li>
      <li><b>Pochi euro, grandi danni.</b> 1,99 € per un pacco servono a prendere i dati della carta.</li>
      <li><b>Nel dubbio, richiama.</b> Al numero che conosci, non a quello del messaggio. E se è già successo: blocca la carta e chiama la banca subito.</li>
    </ol>
    <p class="nota">I messaggi del gioco sono inventati ma costruiti sui casi descritti da Polizia Postale, CONSOB e Banca d'Italia; i siti delle truffe non esistono. I segnali vengono dallo strumento <a href="../../truffe/">«È una truffa?»</a>.</p>
  </section>'''
    pagina = cornice('../../', 'Truffa o no?', 'Gioco per riconoscere le truffe: SMS, WhatsApp, email e telefonate da smistare in pochi secondi, con la spiegazione di ogni segnale.',
                     'Gioca con il Polpo · braccio 4, Ti difende', 'Truffa o no?',
                     'Quindici messaggi, pochi secondi per ognuno: truffa o affidabile? Poi il Polpo ti spiega i segnali.',
                     corpo, braccio=3, script='<script type="module" src="web/gioco.js"></script>')
    open(os.path.join(cartella, 'index.html'), 'w', encoding='utf-8').write(pagina)


def ingresso():
    schede = ''.join(f'<li><a href="{d}/">{casa.polpo_mini(b, classe="st-polpo")}<div><b>{esc(t)}</b><span>{esc(s)}</span></div></a></li>' for d, t, s, b in GIOCHI)
    corpo = f'''  <main class="gioco"><ul class="schede-giochi">{schede}</ul>
  <p class="nota" style="margin-top:22px">Giochi brevi per imparare cose che servono. Nessuna registrazione, nessun dato inviato: si gioca nel browser. Ogni regola ha la sua fonte.</p></main>'''
    return cornice('../', 'Gioca con il Polpo', 'I giochi del Polpo civico: imparare giocando la raccolta differenziata e i propri diritti.',
                   'Il Polpo civico · giochi', 'Gioca con il Polpo', 'Partite da un minuto e mezzo per imparare cose che servono, con la fonte di ogni regola.', corpo)


if __name__ == '__main__':
    n = differenzia()
    truffa()
    open(os.path.join(REPO, 'giochi', 'index.html'), 'w', encoding='utf-8').write(ingresso())
    print(f'giochi scritti: Il Polpo differenzia ({n} rifiuti), Truffa o no?')
