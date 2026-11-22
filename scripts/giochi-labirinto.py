#!/usr/bin/env python3
"""Il filo del labirinto: scrive la pagina giochi/labirinto/index.html.

Usa la cornice e lo stile dei giochi di scripts/giochi.py (senza modificarlo) e la tabella ordinabile di
scripts/storie.py. I percorsi stanno in giochi/labirinto/src/percorsi.js, preparato da
scripts/giochi-labirinto-dati.py: qui ne fa la tabella «Le regole del gioco», con la norma e il link di ogni bivio.

Uso: python3 -I scripts/giochi-labirinto.py
"""
import importlib.util
import json
import os
import sys

sys.dont_write_bytecode = True  # importare giochi.py non deve lasciare file in scripts/__pycache__
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location('giochi', os.path.join(REPO, 'scripts', 'giochi.py'))
_giochi = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_giochi)
cornice, tabella, esc, casa = _giochi.cornice, _giochi.tabella, _giochi.esc, _giochi.casa

CARTELLA = os.path.join(REPO, 'giochi', 'labirinto')
TITOLO = 'Il filo del labirinto'
BRACCIO = 2  # Trova la strada
STRUMENTI = {
    'segnalazioni': 'Segnalazioni urbane', 'garanzia': 'Si è rotto o ci ho ripensato', 'navigatore': 'Navigatore dei servizi', 'mi-spetta': 'Mi spetta',
    'faccio-ricorso': 'Faccio ricorso?', 'mi-rimborsano': 'Mi rimborsano?', 'disdette': 'Disdici un abbonamento', 'chiedo-gli-atti': 'Chiedo gli atti',
    'liste-attesa': 'La visita nei tempi', 'reclami-pa': 'Reclami alla PA', 'affitto': 'Affitto: i tuoi diritti', 'condominio': 'Condominio: i tuoi diritti',
}
TIPI = {'ufficio': 'A chi rivolgersi', 'termine': 'Il termine', 'lettera': 'Come scrivere', 'documento': 'Cosa portare', 'diritto': 'Cosa ti spetta'}

CSS = '''<style>
  .palco-lab { padding: 14px; }
  .lab-tavolo { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 18px; align-items: start; }
  .lab-tavolo[hidden] { display: none; }
  .lab-pianta { position: relative; }
  .lab-pratica { margin: 0 0 8px; font-size: 14px; color: var(--inchiostro-2); }
  .lab-pratica b { color: var(--inchiostro); font-family: var(--titoli); font-size: 17px; display: block; }
  #mappa { display: block; width: 100%; height: auto; max-height: 64vh; color: var(--inchiostro); }
  #mappa .muro { stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; fill: none; }
  #mappa .bordo { stroke: currentColor; stroke-width: 3.2; fill: none; stroke-linecap: round; }
  #mappa .pieno { fill: url(#retino); }
  #mappa .bocca { fill: color-mix(in srgb, var(--forse) 16%, transparent); }
  #mappa .filo { stroke: var(--accento); stroke-width: 3.4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  #mappa .vicolo { stroke: var(--accento); stroke-width: 2.2; fill: none; stroke-dasharray: 3 5; stroke-linecap: round; opacity: .7; }
  #mappa .croce { stroke: var(--accento); stroke-width: 2.6; stroke-linecap: round; }
  #mappa .costo { font-family: var(--cifre); font-size: 10px; font-weight: 700; fill: var(--accento); paint-order: stroke; stroke: var(--fondo); stroke-width: 3px; stroke-linejoin: round; }
  #mappa .lettera circle { fill: var(--fondo); stroke: var(--forse); stroke-width: 2; }
  #mappa .lettera text { font-family: var(--cifre); font-size: 13px; font-weight: 700; fill: var(--inchiostro); text-anchor: middle; dominant-baseline: central; pointer-events: none; }
  #mappa .lettera { cursor: pointer; }
  #mappa .lettera:hover circle { fill: var(--forse); }
  #mappa .nodo { fill: var(--accento); }
  #mappa .porta { stroke: var(--si); stroke-width: 3; fill: none; stroke-linecap: round; }
  #mappa .polpo-testa { fill: var(--accento); }
  #mappa .polpo-occhiali { fill: var(--fondo); stroke: var(--inchiostro); stroke-width: 1.4; }
  #mappa .polpo-braccia { stroke: var(--accento); stroke-width: 2.4; fill: none; stroke-linecap: round; }
  #mappa .urto { animation: urto .35s ease; }
  @keyframes urto { 30% { transform: translate(var(--ux), var(--uy)); } }
  .lab-bivio .spiega-et { margin: 0 0 4px; }
  #domanda { font-size: clamp(19px, 2.6vw, 24px); line-height: 1.2; margin: 0 0 12px; }
  .lab-scelte { display: grid; gap: 8px; }
  .lab-scelta { all: unset; box-sizing: border-box; cursor: pointer; display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 10px; align-items: center; padding: 10px 12px; border: 1.5px solid var(--riga); border-radius: 10px; background: var(--carta); color: var(--inchiostro); font-size: var(--s0); line-height: 1.3; }
  .lab-scelta:hover:not([disabled]) { border-color: var(--forse); }
  .lab-scelta:focus-visible { outline: 3px solid var(--accento); outline-offset: 2px; }
  .lab-scelta .l { display: grid; place-items: center; width: 28px; height: 28px; border: 2px solid var(--forse); border-radius: 50%; font-family: var(--cifre); font-weight: 700; font-size: 13px; }
  .lab-scelta[disabled] { cursor: default; }
  .lab-scelta.vicolo { border-color: var(--accento); color: var(--inchiostro-3); }
  .lab-scelta.vicolo .t { text-decoration: line-through; text-decoration-color: var(--accento); }
  .lab-scelta.vicolo .l { border-color: var(--accento); color: var(--accento); }
  .lab-scelta.giusta { border-color: var(--si); }
  .lab-scelta.giusta .l { border-color: var(--si); background: var(--si); color: var(--fondo); }
  .lab-scelta small { display: block; font-family: var(--cifre); font-size: 11.5px; color: var(--accento); text-decoration: none; }
  .lab-bivio .spiega { margin-top: 12px; }
  #spiega-fonte a { overflow-wrap: anywhere; }
  .lab-percorsi { list-style: none; padding: 0 !important; margin: 10px 0 0; display: grid !important; grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr)); gap: 6px !important; }
  .lab-percorsi button { all: unset; box-sizing: border-box; cursor: pointer; display: block; width: 100%; padding: 7px 10px; border: 1px solid var(--riga); border-radius: 8px; font-size: 14px; color: var(--inchiostro); }
  .lab-percorsi button:hover { border-color: var(--forse); }
  .lab-percorsi button:focus-visible { outline: 3px solid var(--accento); }
  .lab-percorsi small { display: block; font-family: var(--cifre); font-size: 11px; color: var(--inchiostro-3); }
  .lab-percorsi .fatto small { color: var(--si); }
  details.lab-scegli { margin: 10px 0 0; }
  details.lab-scegli summary { cursor: pointer; color: var(--inchiostro-2); font-family: var(--cifre); font-size: 12.5px; letter-spacing: .04em; }
  .lab-oggi { font-size: 14px !important; margin: 8px 0 0; }
  .davvero { display: grid; gap: 6px; margin: 14px 0; padding: 14px 16px; border: 2px solid var(--accento); border-radius: 10px; }
  .davvero p { margin: 0; }
  .davvero .btn { justify-self: start; margin: 4px 0 0 !important; }
  #fine-regole li { font-size: 14px; }
  #fine-regole li b { color: var(--inchiostro); }
  #fine-regole .si { color: var(--si); } #fine-regole .no { color: var(--accento); }
  details.tutte-regole summary { cursor: pointer; font-family: var(--cifre); font-size: 13px; color: var(--inchiostro-2); margin: 8px 0; }
  @media (max-width: 760px) { .lab-tavolo { grid-template-columns: minmax(0, 1fr); gap: 10px; } #mappa { max-height: 40vh; } .lab-pratica { font-size: 13px; } .lab-pratica b { font-size: 16px; } .palco-lab { padding: 10px; } }
  @media (prefers-reduced-motion: reduce) { #mappa .urto { animation: none; } }
</style>'''


def leggi_percorsi():
    testo = open(os.path.join(CARTELLA, 'src', 'percorsi.js'), encoding='utf-8').read()
    return json.loads(testo[testo.index('export default ') + len('export default '):].rstrip().rstrip(';'))


def main():
    percorsi = leggi_percorsi()
    righe = []
    for n, p in enumerate(percorsi, 1):
        for k, b in enumerate(p['bivi'], 1):
            giusta = next(s['testo'] for s in b['scelte'] if s['giusta'])
            righe.append([
                (f'{esc(p["titolo"])}<br><small>livello {p["livello"]}</small>', f'{n:02d}{k}'),
                (str(k), k),
                (esc(TIPI[b['tipo']]), TIPI[b['tipo']]),
                (f'{esc(b["domanda"])}<br><b>{esc(giusta)}</b>', b['domanda']),
                (esc(b['spiega']), b['spiega']),
                (f'<a href="{esc(b["fonte"]["url"])}" target="_blank" rel="noopener">{esc(b["fonte"]["norma"])}</a>', b['fonte']['norma']),
                (f'<a href="../../{esc(p["strumento"])}/">{esc(STRUMENTI[p["strumento"]])}</a>', STRUMENTI[p['strumento']]),
            ])
    regole = tabella('t-bivi', [('Percorso', 't'), ('Bivio', 'n'), ('Tipo', 't'), ('Il bivio e la strada giusta', 't'), ('La regola', 't'), ('Norma e fonte', 't'), ('Lo strumento', 't')], righe)
    nb = sum(len(p['bivi']) for p in percorsi)
    strumenti = ', '.join(f'<a href="../../{esc(s)}/">{esc(STRUMENTI[s])}</a>' for s in dict.fromkeys(p['strumento'] for p in percorsi))
    corpo = f'''{CSS}
  <section class="gioco" aria-labelledby="t-gioco">
    <h2 id="t-gioco" class="sr-only">Il gioco</h2>
    <div class="barra-gioco"><span>Punti <b id="punti">0</b></span><span>Giorni persi <b id="giorni">0</b></span><span>Bivio <b id="numero">1 / 5</b></span><span id="serie"></span><button type="button" class="suono" id="suono" aria-pressed="true">🔊 Suono</button></div>
    <p class="esito" id="esito" aria-live="polite"></p>
    <div class="palco palco-truffa palco-lab">
      <div class="lab-tavolo" hidden>
        <div class="lab-pianta">
          <p class="lab-pratica" id="pratica"></p>
          <svg id="mappa" role="img" aria-label="Il labirinto"></svg>
        </div>
        <div class="lab-bivio">
          <p class="spiega-et" id="bivio-tipo"></p>
          <h3 id="domanda" tabindex="-1"></h3>
          <div class="lab-scelte" id="scelte" role="group" aria-labelledby="domanda"></div>
          <div class="spiega" id="spiega" hidden aria-live="polite">
            <p id="spiega-titolo"></p>
            <p id="spiega-perche"></p>
            <p id="spiega-fonte"></p>
            <button type="button" class="btn btn-primario" id="avanti" hidden>Avanti</button>
          </div>
        </div>
      </div>
      <div class="velo" id="apertura"><div class="velo-box">
        <h2>{esc(TITOLO)}</h2>
        <p>Hai una pratica da chiudere e il Polpo ti accompagna nel labirinto della burocrazia, con il filo rosso in mano.</p>
        <ol>
          <li>A ogni <b>bivio</b> scegli la strada: l'ufficio giusto, il termine giusto, la lettera giusta, cosa portare. Tocca la scelta, o la lettera nel labirinto, o premi <b>A</b>, <b>B</b>, <b>C</b>.</li>
          <li>La <b>strada giusta</b> avanza e srotola il filo. Quella sbagliata è un <b>vicolo cieco</b>: costa giorni, e il Polpo ti spiega perché, con la norma.</li>
          <li>Esci con <b>meno giorni persi</b> possibile: 100 punti a bivio, 3 in meno per ogni giorno perso, 20 in più dal terzo bivio giusto di fila e 150 se esci senza vicoli ciechi.</li>
          <li>Si comincia con pratiche brevi e scelte nette; poi arrivano i <b>termini che cambiano</b>: giorni lavorativi o di calendario, da quando si contano, agosto che non conta.</li>
        </ol>
        <div class="scelta-partita"><button type="button" class="btn btn-primario" id="gioca">Gioca</button><button type="button" class="btn" id="gioca-giorno">Sfida del giorno</button><small>La sfida del giorno è lo stesso labirinto per tutti, oggi: confrontati con chi vuoi.</small></div>
        <p class="vicino lab-oggi" id="oggi"></p>
        <div id="premi"></div>
        <p class="vicino" id="in-testa" hidden></p>
        <details class="lab-scegli"><summary>Scegli il percorso: {len(percorsi)} pratiche</summary><ul class="lab-percorsi" id="percorsi"></ul></details>
      </div></div>
      <div class="velo" id="fine" hidden><div class="velo-box" role="dialog" aria-labelledby="t-fine">
        <h2 id="t-fine">Fuori dal labirinto</h2>
        <p><span id="fine-punti">0</span> <span id="fine-dettaglio"></span></p>
        <div id="fine-premi"></div>
        <div class="davvero"><p><b>Ora fallo per davvero.</b> <span id="davvero-testo"></span></p><a class="btn btn-primario" id="davvero" href="../../">Apri lo strumento</a></div>
        <div id="fine-classifica" class="classifica" hidden></div>
        <p><b>Le regole che hai incontrato</b></p>
        <ul id="fine-regole"></ul>
        <button type="button" class="btn btn-primario" id="rigioca">Prossimo percorso</button><button type="button" class="btn" id="ripeti">Rifai questo</button><button type="button" class="btn" id="condividi">Sfida un amico</button>
      </div></div>
    </div>
  </section>

  <section class="regole-gioco" aria-labelledby="t-regole">
    <div class="occhiello">Le regole del gioco</div>
    <h2 id="t-regole">{len(percorsi)} pratiche, {nb} bivi, ognuno con la sua norma</h2>
    <p>Ogni bivio viene dalle regole di uno strumento del sito, con la stessa norma e lo stesso link: {strumenti}. I giorni persi nei vicoli ciechi sono un punteggio del gioco, non tempi di legge: nella realtà un termine perso può far perdere il diritto.</p>
    <details class="tutte-regole"><summary>Mostra tutti i bivi con le risposte (svela il gioco)</summary>
    {regole}
    </details>
    <p class="nota">Tocca i titoli delle colonne per ordinare. Le regole sono quelle verificate negli strumenti; per il tuo caso vale lo strumento, che fa i conti con le tue date.</p>
  </section>'''
    pagina = cornice('../../', TITOLO, 'Gioco della burocrazia: esci dal labirinto di una pratica scegliendo a ogni bivio l\'ufficio, il termine e la lettera giusti. Ogni regola con la norma e il link.',
                     'Gioca con il Polpo · braccio 3, Trova la strada', TITOLO,
                     'Una pratica da chiudere, un labirinto di bivi e il filo rosso del Polpo. Ogni strada sbagliata costa giorni: esci prima che puoi.',
                     corpo, braccio=BRACCIO, script='<script type="module" src="web/gioco.js"></script>')
    open(os.path.join(CARTELLA, 'index.html'), 'w', encoding='utf-8').write(pagina)
    print(f'{TITOLO}: {len(percorsi)} percorsi, {nb} bivi')


if __name__ == '__main__':
    main()
