#!/usr/bin/env python3
"""Più o meno: la pagina del gioco giochi/piu-o-meno/index.html.

Usa la cornice e lo stile di scripts/giochi.py (importato com'è, senza modificarlo) e i dati di
giochi/piu-o-meno/src/contratti.js, preparati da scripts/giochi-piu-o-meno-dati.py dai dati aperti ANAC 2025.
Sotto il gioco: le regole con cui sono stati scelti i contratti e le tabelle ordinabili con le categorie
e con tutti i contratti del mazzo, ognuno con il link alla scheda ufficiale ANAC del suo CIG.

Uso: python3 -I scripts/giochi-piu-o-meno.py
"""
import html
import importlib.util
import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location('giochi', os.path.join(REPO, 'scripts', 'giochi.py'))
_giochi = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_giochi)
cornice, tabella, casa = _giochi.cornice, _giochi.tabella, _giochi.casa
esc = lambda t: html.escape(str(t), quote=True)

CARTELLA = os.path.join(REPO, 'giochi', 'piu-o-meno')
TITOLO = 'Più o meno'
SOMMARIO = 'Due contratti pubblici veri, dalla mensa scolastica alle luminarie: quale è costato di più? Con gli importi ANAC e il link a ogni contratto.'
BRACCIO = 5


def it(n, cifre=0):
    s = f'{n:,.{cifre}f}'
    return s.replace(',', '§').replace('.', ',').replace('§', '.')


def euro(v):
    return it(round(v)) + ' €'


def leggi_dati():
    testo = open(os.path.join(CARTELLA, 'src', 'contratti.js'), encoding='utf-8').read()
    meta = json.loads(testo.split('export const META = ', 1)[1].split(';\n', 1)[0])
    corpo = testo.split('export const CARTE = [\n', 1)[1].split('\n];', 1)[0]
    carte = [json.loads(r.rstrip(',')) for r in corpo.split('\n') if r.strip()]
    return meta, carte


CSS = '''
  .palco-piu { padding: 16px; touch-action: manipulation; }
  .tavolo-piu[hidden] { display: none; }
  .domanda { display: flex; gap: 10px; align-items: center; margin: 0 0 10px; font-family: var(--titoli); font-size: clamp(20px, 3vw, 26px); color: var(--inchiostro); }
  .domanda .logo-polpo { width: 52px; height: 52px; flex: none; overflow: visible; transition: transform .2s; }
  .domanda .logo-polpo.contento { animation: salta .5s ease; }
  .domanda .logo-polpo.triste { animation: scuoti .5s ease; }
  .coppia { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 10px; align-items: stretch; }
  .contro { align-self: center; font-family: var(--cifre); font-size: 12px; letter-spacing: .1em; color: var(--inchiostro-3); }
  .contratto { all: unset; box-sizing: border-box; cursor: pointer; display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 14px 14px 12px; border: 2px solid var(--riga); border-radius: 12px; background: var(--carta); color: var(--inchiostro-2); position: relative; transition: border-color .15s, transform .15s; }
  .contratto:hover:not([aria-disabled="true"]) { border-color: var(--inchiostro-3); transform: translateY(-2px); }
  .contratto:focus-visible { outline: 3px solid var(--accento); outline-offset: 2px; }
  .contratto[aria-disabled="true"] { cursor: default; }
  .contratto.entra { animation: entra .28s ease; }
  .contratto[data-oro="1"] { border-color: var(--forse); box-shadow: 0 0 0 3px color-mix(in srgb, var(--forse) 25%, transparent); }
  .contratto[data-esito="caro"] { border-color: var(--si); }
  .contratto[data-esito="scelto-no"] { border-color: var(--accento); }
  .c-cat { font-family: var(--cifre); font-size: 11.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--inchiostro-3); display: block; }
  .c-testo { display: block; font-size: 16.5px; line-height: 1.35; font-weight: 600; color: var(--inchiostro); overflow-wrap: anywhere; }
  .c-orig { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-size: 12px; line-height: 1.35; color: var(--inchiostro-3); overflow-wrap: anywhere; }
  .c-orig i { font-style: normal; font-family: var(--cifre); font-size: 10.5px; letter-spacing: .04em; }
  .c-ente { display: block; font-size: 14px; color: var(--inchiostro-2); overflow-wrap: anywhere; }
  .c-ente b { color: var(--inchiostro); font-weight: 600; }
  .c-dove { display: block; font-size: 12.5px; color: var(--inchiostro-3); }
  .c-importo { display: block; margin-top: auto; padding-top: 6px; font-family: var(--titoli); font-weight: 800; font-size: clamp(24px, 4vw, 32px); line-height: 1; color: var(--inchiostro); letter-spacing: -0.02em; }
  .c-importo.coperto { color: var(--inchiostro-3); }
  .c-oro { display: inline-block; align-self: flex-start; font-family: var(--cifre); font-size: 11px; letter-spacing: .06em; padding: 2px 8px; border-radius: 999px; background: var(--forse); color: #1d1f24; }
  .c-timbro { position: absolute; top: 10px; right: 10px; font-family: var(--cifre); font-size: 11px; font-weight: 700; letter-spacing: .1em; padding: 3px 8px; border: 2px solid currentColor; border-radius: 6px; transform: rotate(6deg); color: var(--si); }
  .tempo-piu { height: 6px; margin: 12px 0 0; background: var(--riga); border-radius: 3px; overflow: hidden; }
  .tempo-piu i { display: block; height: 100%; width: 100%; background: var(--accento); }
  .tempo-piu[hidden] { display: none; }
  .aiuto-piu { margin: 8px 0 0; font-size: 12.5px; color: var(--inchiostro-3); }
  .spiega-piu { margin-top: 14px; padding: 14px 16px; background: var(--carta); border: 1px solid var(--riga); border-radius: 8px; }
  .spiega-piu[hidden] { display: none; }
  #pm-verdetto { margin: 0 0 4px; font-family: var(--titoli); font-size: 22px; }
  #pm-verdetto[data-tono="si"] { color: var(--si); }
  #pm-verdetto[data-tono="no"] { color: var(--accento); }
  .spiega-piu p, .spiega-piu li { color: var(--inchiostro-2); font-size: 14.5px; line-height: 1.45; }
  #pm-dettagli { list-style: none; padding: 0; margin: 8px 0; display: grid; gap: 8px; }
  #pm-dettagli li { padding: 8px 10px; border: 1px solid var(--riga-tenue, var(--riga)); border-radius: 8px; overflow-wrap: anywhere; }
  #pm-dettagli li b { color: var(--inchiostro); }
  .curiosita { padding: 8px 10px; border: 1px solid var(--forse); border-radius: 8px; color: var(--inchiostro) !important; }
  .spiega-piu .fonte { font-size: 12.5px; color: var(--inchiostro-3); }
  .regole-gioco details { margin-top: 18px; }
  .regole-gioco details summary { cursor: pointer; font-weight: 600; color: var(--inchiostro); }
  .regole-gioco td.n { text-align: right; font-family: var(--cifre); white-space: nowrap; }
  @media (max-width: 620px) {
    .coppia { grid-template-columns: minmax(0, 1fr); }
    .contro { justify-self: center; }
    .c-testo { font-size: 15.5px; }
    .c-importo { font-size: 26px; }
    .palco-piu { padding: 10px; }
  }
  @media (prefers-reduced-motion: reduce) { .contratto, .contratto.entra, .domanda .logo-polpo { animation: none !important; transition: none; } }
'''


def pagina():
    meta, carte = leggi_dati()
    cat = meta['categorie']
    n_carte = len(carte)

    righe_cat = [[(f'{esc(c["emoji"])} {esc(c["nome"])}', c['nome']),
                  (it(sum(1 for x in carte if x[1] == i)), sum(1 for x in carte if x[1] == i)),
                  (it(c['n']), c['n']),
                  (euro(c['mediana']), c['mediana']),
                  (euro(c['min']), c['min']),
                  (euro(c['max']), c['max'])] for i, c in enumerate(cat)]
    t_cat = tabella('t-categorie', [('Categoria', 't'), ('Nel mazzo', 'n'), ('Contratti 2025 letti', 'n'), ('Mediana', 'n'), ('Il meno caro', 'n'), ('Il più caro', 'n')], righe_cat, 2)

    # tutti i contratti: l'intestazione qui, le righe le scrive web/gioco.js dai dati del mazzo quando apri l'elenco
    t_carte = tabella('t-contratti', [('Categoria', 't'), ('Oggetto originale', 't'), ('Ente', 't'), ('Regione', 't'), ('Procedura', 't'), ('Importo aggiudicato', 'n'), ('CIG', 't')], [], 5)

    regole = ''.join(f'<li>{esc(t)} <small>({it(meta["scarti"][k])} contratti esclusi)</small></li>' if meta['scarti'].get(k) else f'<li>{esc(t)}</li>'
                     for k, t in zip(['aggiudicati', 'tetto', 'base', 'minimo', 'scala', 'persone', 'chiari'], meta['regole']))
    f = meta['fonte']
    corpo = f'''  <style>{CSS}</style>
  <section class="gioco" aria-labelledby="t-gioco">
    <h2 id="t-gioco" class="sr-only">Il gioco</h2>
    <div class="barra-gioco"><span>Punti <b id="punti">0</b></span><span>Coppia <b id="numero">1 / 20</b></span><span id="vite" aria-label="3 vite su 3">♥♥♥</span><span id="serie"></span><span id="fase"></span><button type="button" class="suono" id="suono" aria-pressed="true">🔊 Suono</button></div>
    <p class="esito" id="esito" aria-live="polite"></p>
    <div class="palco palco-truffa palco-piu">
      <div class="tavolo-piu" hidden>
        <p class="domanda">{casa.polpo_mini(BRACCIO, classe='logo-polpo')}<span id="pm-domanda">Quale è costato di più?</span></p>
        <div class="coppia" role="group" aria-labelledby="pm-domanda">
          <button type="button" class="contratto" id="pm-s"></button>
          <span class="contro" aria-hidden="true">o</span>
          <button type="button" class="contratto" id="pm-d"></button>
        </div>
        <div class="tempo-piu" id="pm-tempo" aria-hidden="true"><i></i></div>
        <p class="aiuto-piu" id="pm-aiuto">Tocca il contratto che è costato di più. Con la tastiera: freccia sinistra o 1 per il primo, freccia destra o 2 per il secondo.</p>
        <div class="spiega-piu" id="pm-spiega" hidden>
          <p id="pm-verdetto"></p>
          <p id="pm-confronto"></p>
          <ul id="pm-dettagli"></ul>
          <p id="pm-curiosita" class="curiosita" hidden></p>
          <p class="fonte">Importi aggiudicati dichiarati ad ANAC; mediane calcolate sui contratti del 2025 della stessa categoria letti dal gioco. Fonte: <a href="{esc(f["url"])}" target="_blank" rel="noopener">{esc(f["titolo"])}</a>.</p>
          <button type="button" class="btn btn-primario" id="pm-avanti">Avanti</button>
        </div>
      </div>
      <div class="velo" id="apertura"><div class="velo-box">
        <h2>Più o meno</h2>
        <p>Due contratti pubblici veri del 2025, presi dai dati ANAC: la mensa di una scuola, l'asfalto di una strada, le luminarie di Natale. Quale è costato di più?</p>
        <ol>
          <li><b>Tocca il contratto più caro</b> (o usa le frecce della tastiera). Se hai ragione vedi gli importi veri e arriva un contratto nuovo, da confrontare con quello appena svelato.</li>
          <li>Hai <b>tre vite</b> e al massimo <b>venti coppie</b>. Si comincia con importi molto diversi e si finisce con contratti dello stesso ordine di grandezza, con meno tempo per decidere.</li>
          <li><b>Colpo d'occhio</b>: se rispondi giusto in fretta, 5 punti in più. Dalla terza giusta di fila, altri 5. Ogni <b>cinque di fila</b> il Polpo ti ridà una vita persa.</li>
          <li>Ogni tanto arriva un <b>contratto d'oro</b>, con una curiosità vera: se lo indovini vale 25 punti in più.</li>
        </ol>
        <p><small>Dopo ogni risposta: ente, anno, procedura, il CIG con il link alla scheda ufficiale ANAC e il confronto con la mediana della stessa categoria. Il gioco non dice se un prezzo è giusto: confronta fatti.</small></p>
        <div class="scelta-partita"><button type="button" class="btn btn-primario" id="gioca">Gioca</button><button type="button" class="btn" id="gioca-giorno">Sfida del giorno</button><small>La sfida del giorno è la stessa partita per tutti, oggi: confrontati con chi vuoi.</small></div>
        <div id="premi"></div>
        <p class="vicino" id="in-testa" hidden></p>
      </div></div>
      <div class="velo" id="fine" hidden><div class="velo-box" role="dialog" aria-labelledby="t-fine">
        <h2 id="t-fine">Fine della partita</h2>
        <p><span id="fine-punti">0</span> <span id="fine-dettaglio"></span></p>
        <div id="fine-premi"></div>
        <div id="fine-classifica" class="classifica" hidden></div>
        <p><b>Dove hai sbagliato</b></p>
        <ul id="fine-errori"></ul>
        <button type="button" class="btn btn-primario" id="rigioca">Gioca ancora</button><button type="button" class="btn" id="condividi">Sfida un amico</button>
        <p><small>Vuoi guardare gli appalti del tuo Comune? <a href="../../appalti/">Red flag sugli appalti</a>.</small></p>
      </div></div>
    </div>
  </section>

  <section class="regole-gioco" aria-labelledby="t-regole">
    <div class="occhiello">I dati del gioco</div>
    <h2 id="t-regole">{it(n_carte)} contratti veri, con il loro CIG</h2>
    <p>I contratti vengono dalla Banca dati nazionale dei contratti pubblici di ANAC: procedure pubblicate nel 2025 e poi aggiudicate. L'importo è quello <b>aggiudicato</b> dichiarato dall'ente. Ogni CIG porta alla scheda ufficiale ANAC. Sono stati letti {it(meta["letti"])} contratti aggiudicati di {len(cat)} categorie riconoscibili; dopo le regole qui sotto ne restano {it(meta["puliti"])}, da cui vengono le mediane, e il mazzo del gioco ne tiene {it(n_carte)}.</p>
    <ol class="lista">{regole}</ol>
    <p>Un contratto più caro non vuol dire un contratto sbagliato: cambiano la durata, la quantità, le dimensioni del Comune, quello che è compreso. L'oggetto in chiaro è riscritto da regole automatiche (minuscole, senza codici e formule di rito): sotto c'è sempre l'oggetto originale. Il confronto per abitante usa la popolazione ISTAT al 1° gennaio 2025 ed è mostrato solo per i Comuni.</p>
    <h3>Le categorie</h3>
    {t_cat}
    <details id="elenco-contratti"><summary>Tutti i {it(n_carte)} contratti del mazzo, con il link ANAC</summary>
    {t_carte}
    </details>
    <p class="nota">Tocca i titoli delle colonne per ordinare. Dati aggiornati al {esc(meta["aggiornato"])}; licenza dei dati ANAC: CC BY-SA 4.0. Il mazzo è preparato da <code>scripts/giochi-piu-o-meno-dati.py</code>.</p>
  </section>'''
    return cornice('../../', TITOLO, 'Gioco sugli appalti pubblici: due contratti veri del 2025, dalla mensa scolastica alle luminarie, e devi indovinare quale è costato di più. Con importi ANAC, CIG e mediana della categoria.',
                   'Gioca con il Polpo · braccio 6, Controlla gli appalti', TITOLO,
                   'Due contratti pubblici veri: quale è costato di più? Venti coppie, tre vite, e dopo ogni risposta gli importi con il link al contratto.',
                   corpo, braccio=BRACCIO, script='<script type="module" src="web/gioco.js"></script>'), n_carte


if __name__ == '__main__':
    testo, n = pagina()
    open(os.path.join(CARTELLA, 'index.html'), 'w', encoding='utf-8').write(testo)
    print(f'giochi/piu-o-meno/index.html scritto: {n} contratti')
