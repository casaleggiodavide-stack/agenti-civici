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
    ('carrello', 'Il carrello del Black Friday', 'Tre negozi online pieni delle trappole che l\'Antitrust ha multato: compra il regalo senza pagare un euro in più.', 3),
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
  .finestra { color-scheme: light; background: var(--foglio, #fff); color: var(--foglio-inchiostro, #1d1f24); border-radius: 12px; overflow: hidden; box-shadow: 0 18px 40px -20px rgba(0,0,0,.6); }
  .finestra-barra { display: flex; gap: 10px; align-items: center; padding: 8px 12px; background: #e3e1da; font-size: 12.5px; color: #5d6270; }
  .pallini i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #c9c5bc; margin-right: 4px; }
  .indirizzo { flex: 1; background: #fff; border-radius: 999px; padding: 3px 12px; font-family: var(--cifre); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .negozio-testa { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #1d1f24; color: #fff; }
  .negozio-testa span { font-family: var(--cifre); font-size: 11px; letter-spacing: .14em; background: #ff4a36; color: #0b0b0a; padding: 3px 8px; border-radius: 4px; }
  .negozio-corpo { padding: 16px; display: grid; gap: 14px; }
  .negozio-corpo h3 { margin: 0; font-size: 20px; color: #1d1f24; }
  .prodotto { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 14px; align-items: start; }
  .foto-prodotto { aspect-ratio: 1; display: grid; place-items: center; font-size: 56px; background: #f4f2ec; border-radius: 10px; }
  .prezzo { font-family: var(--titoli); font-size: 30px; margin: 4px 0 8px; color: #1d1f24; }
  .etichette { display: flex; flex-wrap: wrap; gap: 6px; }
  .etichetta, .voce { all: unset; cursor: pointer; position: relative; font-size: 13.5px; padding: 6px 10px; border: 1.5px dashed #c9c5bc; border-radius: 8px; color: #1d1f24; background: #fff; }
  .etichetta:focus-visible, .voce:focus-visible { outline: 3px solid var(--accento); }
  .etichetta.conto { color: #c2362b; font-weight: 700; }
  .etichetta.vista, .voce.vista { border: 2px solid #ff4a36; background: #fdecea; }
  .etichetta.falso { border-style: solid; border-color: #9aa1ae; opacity: .7; }
  .bollino { position: absolute; top: -9px; right: -6px; font-family: var(--cifre); font-size: 10px; letter-spacing: .06em; background: #ff4a36; color: #0b0b0a; padding: 1px 6px; border-radius: 999px; }
  .opzioni { display: grid; gap: 6px; }
  .opzione { display: flex; gap: 8px; align-items: center; padding: 8px 10px; border: 1px solid #e3e1da; border-radius: 8px; font-size: 14.5px; color: #1d1f24; cursor: pointer; }
  .opzione b { margin-left: auto; font-family: var(--cifre); font-size: 13px; }
  .opzione input { width: 20px; height: 20px; accent-color: #1d1f24; }
  .scelta { padding: 12px; border-radius: 10px; background: #fff4d6; color: #1d1f24; display: grid; gap: 8px; justify-items: start; }
  .scelta p { margin: 0; font-weight: 700; }
  .scelta .grande { all: unset; cursor: pointer; background: #16734a; color: #fff; font-weight: 700; padding: 12px 18px; border-radius: 10px; font-size: 16px; }
  .scelta .piccolo { all: unset; cursor: pointer; color: #5d6270; font-size: 12px; text-decoration: underline; }
  .scelta .grande:focus-visible, .scelta .piccolo:focus-visible { outline: 3px solid var(--accento); }
  .scelta-fatta { margin: 0; font-size: 14px; color: #5d6270; }
  .cassa { justify-self: start; }
  .riepilogo { width: 100%; border-collapse: collapse; font-size: 15px; color: #1d1f24; }
  .riepilogo td { padding: 6px 0; border-bottom: 1px solid #e3e1da; }
  .riepilogo td.n { text-align: right; font-family: var(--cifre); white-space: nowrap; padding-left: 10px; }
  .riepilogo .tot td { font-weight: 800; font-size: 17px; border-bottom: 0; }
  .nota-abb { margin: 0; color: #c2362b; font-size: 13.5px; }
  .azioni-cassa { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; }
  .esito-negozio { margin-top: 6px; }
  .esito-negozio[hidden] { display: none; }
  .esito-negozio h2 { font-size: clamp(24px, 3.6vw, 34px); margin: 0 0 8px; }
  #esito-lista { list-style: none; padding: 0; display: grid; gap: 10px; margin: 14px 0; }
  #esito-lista li { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; padding: 12px; background: var(--carta); border: 1px solid var(--riga); border-radius: 8px; color: var(--inchiostro-2); font-size: var(--s0); }
  #esito-lista li b { color: var(--inchiostro); }
  .segno { font-family: var(--cifre); font-size: 20px; font-weight: 700; text-align: center; }
  #esito-lista li[data-esito="evitata"] .segno, #esito-lista li[data-esito="scoperta"] .segno { color: var(--si); }
  #esito-lista li[data-esito="caduto"] .segno { color: var(--accento); }
  #esito-lista small { color: var(--inchiostro-3); }
  /* premi, sfide e sorprese (giochi/comune/premi.js) */
  .barra-gioco .suono { all: unset; cursor: pointer; font-size: 12px; color: var(--inchiostro-3); padding: 2px 6px; border: 1px solid var(--riga); border-radius: 999px; }
  .barra-gioco .suono:focus-visible { outline: 2px solid var(--accento); }
  #fase { color: var(--forse); }
  #scudo { color: var(--forse); font-size: 16px; }
  #scudo[hidden] { display: none; }
  .scelta-partita { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 12px; }
  .scelta-partita .btn { margin: 0; }
  .scelta-partita small { color: var(--inchiostro-3); flex-basis: 100%; }
  .banner-sfida { padding: 10px 14px; border: 2px solid var(--forse); border-radius: 8px; color: var(--inchiostro) !important; }
  .banner-sfida b { color: var(--forse); font-size: 1.15em; }
  .vicino { font-size: 14px !important; margin: 6px 0; }
  .vicino b { color: var(--inchiostro); }
  .titolo-polpo { font-family: var(--titoli); font-size: clamp(22px, 3.4vw, 30px); color: var(--inchiostro) !important; margin: 6px 0 4px; line-height: 1.1; }
  .sfida-esito { font-weight: 700; margin: 4px 0; }
  .sfida-esito.si { color: var(--si) !important; }
  .sfida-esito.no { color: var(--accento) !important; }
  .medaglie-nuove .medaglia { display: inline-block; margin: 4px 6px 0 0; padding: 4px 10px; border: 1px solid var(--forse); border-radius: 999px; color: var(--inchiostro); font-size: 14px; animation: medaglia .6s ease both; }
  @keyframes medaglia { from { transform: scale(.4) rotate(-12deg); opacity: 0; } 70% { transform: scale(1.12); } }
  details.medaglie { margin: 10px 0 0; font-size: 14px; }
  details.medaglie summary { cursor: pointer; color: var(--inchiostro-2); font-family: var(--cifre); font-size: 12.5px; letter-spacing: .04em; }
  details.medaglie ul { list-style: none; padding: 0; margin: 8px 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(210px, 100%), 1fr)); gap: 6px; }
  details.medaglie li { padding: 6px 10px; border: 1px dashed var(--riga); border-radius: 8px; color: var(--inchiostro-3); filter: grayscale(1); opacity: .7; }
  details.medaglie li.presa { border: 1px solid var(--forse); color: var(--inchiostro); filter: none; opacity: 1; }
  details.medaglie small { display: block; font-size: 12px; color: var(--inchiostro-3); }
  .annuncio-grande { position: absolute; left: 50%; top: 34%; z-index: 5; transform: translate(-50%, -50%); width: max-content; max-width: 92%; text-align: center; pointer-events: none;
    font-family: var(--titoli); font-weight: 800; font-size: clamp(22px, 4.4vw, 40px); line-height: 1.05; color: var(--forse); text-shadow: 0 3px 0 var(--fondo), 0 0 24px var(--fondo);
    animation: annuncio 1.4s ease both; }
  @keyframes annuncio { 0% { transform: translate(-50%, -50%) scale(.6); opacity: 0; } 15% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; } 25% { transform: translate(-50%, -50%) scale(1); } 80% { opacity: 1; } 100% { transform: translate(-50%, -64%); opacity: 0; } }
  .coriandoli { position: fixed; inset: 0; pointer-events: none; z-index: 50; overflow: hidden; }
  .coriandoli i { position: absolute; width: 8px; height: 12px; border-radius: 2px; animation: coriandolo 1.2s cubic-bezier(.2,.7,.4,1) forwards; }
  @keyframes coriandolo { to { transform: translate(var(--dx), calc(var(--dy) + 160px)) rotate(var(--r)); opacity: 0; } }
  .stelle { color: var(--forse); letter-spacing: 2px; }
  .record-gioco { display: block; margin-top: 8px; font-family: var(--cifre); font-size: 12px; color: var(--forse); }
  .classifica { margin: 14px 0 6px; padding: 14px 16px; background: var(--carta); border: 1px solid var(--riga); border-radius: 8px; }
  .titolo-classifica { font-family: var(--titoli); font-size: 22px; color: var(--inchiostro) !important; margin: 0 0 8px; }
  .schede-classifica { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
  .schede-classifica button { all: unset; cursor: pointer; font-family: var(--cifre); font-size: 12px; letter-spacing: .04em; padding: 5px 12px; border: 1px solid var(--riga); border-radius: 999px; color: var(--inchiostro-2); }
  .schede-classifica button[aria-selected="true"] { border-color: var(--forse); color: var(--inchiostro); }
  .schede-classifica button:focus-visible, .link:focus-visible { outline: 2px solid var(--accento); }
  ol.podio { list-style: none; padding: 0 !important; margin: 0; display: grid; gap: 2px !important; }
  ol.podio li { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 8px; align-items: baseline; padding: 6px 8px; border-radius: 6px; }
  ol.podio li:nth-child(-n+3) .pos { color: var(--forse); }
  ol.podio li.mio { background: color-mix(in srgb, var(--forse) 16%, transparent); }
  ol.podio .pos { font-family: var(--cifre); font-size: 13px; color: var(--inchiostro-3); }
  ol.podio .chi { color: var(--inchiostro); overflow-wrap: anywhere; }
  ol.podio small { color: var(--inchiostro-3); font-size: 12px; }
  ol.podio b { font-family: var(--cifre); color: var(--inchiostro); }
  .invito-classifica label { display: grid; gap: 4px; font-size: 14px; color: var(--inchiostro-2); max-width: 320px; }
  .invito-classifica select { font: inherit; font-size: 16px; padding: 6px 8px; background: var(--fondo); color: var(--inchiostro); border: 1px solid var(--riga); border-radius: 6px; }
  .nome-classifica b { color: var(--forse); }
  .link { all: unset; cursor: pointer; color: var(--accento); text-decoration: underline; }
  #in-testa[hidden] { display: none; }
  @media (prefers-reduced-motion: reduce) { .annuncio-grande { animation-duration: 2s; animation-name: annuncio-piano; } @keyframes annuncio-piano { 0%, 100% { opacity: 0; } 10%, 85% { opacity: 1; } } .medaglie-nuove .medaglia { animation: none; } }
  @media (max-width: 560px) { .tavolo { grid-template-columns: minmax(0, 1fr); } .tavolo .logo-polpo { width: 56px; height: 56px; } .carta-testo { font-size: 16px; } .prodotto { grid-template-columns: 76px minmax(0, 1fr); } .foto-prodotto { font-size: 40px; } .prezzo { font-size: 24px; } }
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
    <div class="barra-gioco" aria-live="off"><span>Punti <b id="punti">0</b></span><span>Tempo <b id="tempo">90</b></span><span id="vite" aria-label="3 vite su 3">♥♥♥</span><span id="serie"></span><span id="fase"></span><button type="button" class="suono" id="suono" aria-pressed="true">🔊 Suono</button></div>
    <p class="esito" id="esito" aria-live="polite"></p>
    <div class="palco">
      <canvas id="tela" tabindex="0" aria-label="Campo di gioco: i rifiuti cadono verso sei contenitori. Con la tastiera, le frecce destra e sinistra spostano il Polpo sotto un contenitore, lo spazio lancia lì il rifiuto più in basso; i tasti da 1 a 6 scelgono direttamente il contenitore." role="application"></canvas>
      <div class="velo" id="apertura"><div class="velo-box">
        <h2>Il Polpo differenzia</h2>
        <p>I rifiuti cadono e il Polpo corre sotto di loro. Afferrali: il Polpo li tiene con un tentacolo e li porta nel bidone giusto.</p>
        <ol>
          <li><b>Trascina</b> il rifiuto nel suo bidone, con il mouse o con il dito. Oppure <b>lancialo</b> con uno swipe veloce verso il bidone.</li>
          <li>Hai <b>90 secondi e tre vite</b>: ogni errore ne toglie una. Cinque giusti di fila raddoppiano i punti, dieci li triplicano.</li>
          <li>Si comincia facile, con carta, plastica, vetro e umido; poi <b>si aprono il secco e l'isola ecologica</b> e arrivano i rifiuti che <b>cambiano da Comune a Comune</b>.</li>
          <li>Ogni tanto cade un <b>rifiuto d'oro</b>: se lo metti nel bidone giusto vale il triplo e ti restituisce una vita.</li>
        </ol>
        <p><small>Con la tastiera: le frecce spostano il Polpo sotto un bidone, lo spazio gli fa lanciare lì il rifiuto più in basso; i tasti da 1 a 6 scelgono il bidone; P mette in pausa.</small></p>
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
    <div class="barra-gioco"><span>Punti <b id="punti">0</b></span><span>Messaggio <b id="numero">1 / 15</b></span><span id="vite" aria-label="3 vite su 3">♥♥♥</span><span id="scudo" title="Lo scudo del Polpo para il prossimo errore" hidden>🛡️ scudo</span><span id="serie"></span><button type="button" class="suono" id="suono" aria-pressed="true">🔊 Suono</button></div>
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
          <li>Tre giuste di fila valgono 5 punti in più a risposta. Con <b>cinque di fila</b> il Polpo ti dà uno <b>scudo</b> che para il prossimo errore.</li>
        </ol>
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



def carrello():
    cartella = os.path.join(REPO, 'giochi', 'carrello')
    corpo = f'''  <section class="gioco" aria-labelledby="t-gioco">
    <h2 id="t-gioco" class="sr-only">Il gioco</h2>
    <div class="barra-gioco"><span>Punti <b id="punti">0</b></span><span>Negozio <b id="negozio-n">1 / 3</b></span><span>Tempo <b id="tempo">45</b></span><button type="button" class="suono" id="suono" aria-pressed="true">🔊 Suono</button></div>
    <p class="esito" id="esito" aria-live="polite"></p>
    <div class="palco palco-truffa">
      <div class="tavolo" hidden>
        {casa.polpo_mini(3, classe='logo-polpo')}
        <div class="finestra" id="pagina"></div>
      </div>
      <div class="esito-negozio" id="esito-negozio" hidden>
        <h2 id="esito-titolo"></h2>
        <p id="esito-conto"></p>
        <ul id="esito-lista"></ul>
        <button type="button" class="btn btn-primario" id="prossimo">Prossimo negozio</button>
      </div>
      <div class="velo" id="apertura"><div class="velo-box">
        <h2>Il carrello del Black Friday</h2>
        <p>Devi comprare tre regali in tre negozi online. Ogni negozio nasconde le trappole che l'Antitrust ha davvero sanzionato negli ultimi anni.</p>
        <ol>
          <li><b>Tocca le trappole</b> che vedi: sconti finti, conti alla rovescia, recensioni gonfiate. Attento: toccare un'informazione corretta costa punti.</li>
          <li><b>Togli le caselle già spuntate</b> e <b>rifiuta</b> l'abbonamento che ti offrono a tutti i costi.</li>
          <li><b>Alla cassa</b> controlla il riepilogo: alcuni costi compaiono solo lì. Il primo negozio è il più facile; ogni negozio ha più trappole e meno tempo (45, 40, 35 secondi).</li>
          <li>Ogni negozio vale <b>fino a tre stelle</b>: tutte le trappole senza falsi allarmi fanno il negozio perfetto, con 20 punti in più.</li>
        </ol>
        <div class="scelta-partita"><button type="button" class="btn btn-primario" id="gioca">Gioca</button><button type="button" class="btn" id="gioca-giorno">Sfida del giorno</button><small>La sfida del giorno è la stessa partita per tutti, oggi: confrontati con chi vuoi.</small></div>
        <div id="premi"></div>
        <p class="vicino" id="in-testa" hidden></p>
      </div></div>
      <div class="velo" id="fine" hidden><div class="velo-box" role="dialog" aria-labelledby="t-fine">
        <h2 id="t-fine">Fine dello shopping</h2>
        <p><span id="fine-punti">0</span> <span id="fine-dettaglio"></span></p>
        <div id="fine-premi"></div>
        <div id="fine-classifica" class="classifica" hidden></div>
        <p id="fine-conto"></p>
        <button type="button" class="btn btn-primario" id="rigioca">Gioca ancora</button><button type="button" class="btn" id="condividi">Sfida un amico</button>
        <p><small>Tutte le trappole, con i casi e le multe: <a href="../../legge/antitrust/">Le trappole sanzionate</a>. Hai comprato e vuoi ripensarci? <a href="../../garanzia/">Recesso e garanzia</a>.</small></p>
      </div></div>
    </div>
  </section>

  <section class="regole-gioco" aria-labelledby="t-regole">
    <div class="occhiello">Prima di comprare</div>
    <h2 id="t-regole">Le regole che ti proteggono</h2>
    <ol class="lista">
      <li><b>Lo sconto vero</b> si calcola sul prezzo più basso degli ultimi 30 giorni (Codice del consumo, art. 17-bis).</li>
      <li><b>Niente caselle già spuntate</b> per pagare qualcosa in più: un'aggiunta la scegli tu (art. 65).</li>
      <li><b>Nessun sovrapprezzo</b> per pagare con carta, PayPal o bonifico (art. 62).</li>
      <li><b>Il prezzo è quello totale</b>, detto fin dall'inizio: niente costi che spuntano alla cassa (artt. 21-22).</li>
      <li><b>Online hai 14 giorni per ripensarci</b>, senza dire perché (art. 52), e 2 anni di garanzia legale.</li>
    </ol>
    <p class="nota">I negozi del gioco sono inventati; le trappole e i casi sono veri, dai bollettini dell'Antitrust 2024-2026 letti nel dossier <a href="../../legge/antitrust/">Le trappole sanzionate</a>.</p>
  </section>'''
    pagina = cornice('../../', 'Il carrello del Black Friday', 'Gioco per riconoscere le trappole dei negozi online: sconti finti, caselle già spuntate, costi alla cassa, abbonamenti. Con i casi veri sanzionati dall\'Antitrust.',
                     'Gioca con il Polpo · braccio 4, Ti difende', 'Il carrello del Black Friday',
                     'Tre negozi, tre regali, sempre meno tempo. Le trappole sono quelle che l\'Antitrust ha davvero multato.',
                     corpo, braccio=3, script='<script type="module" src="web/gioco.js"></script>')
    open(os.path.join(cartella, 'index.html'), 'w', encoding='utf-8').write(pagina)


def ingresso():
    schede = ''.join(f'<li><a href="{d}/">{casa.polpo_mini(b, classe="st-polpo")}<div><b>{esc(t)}</b><span>{esc(s)}</span><span class="record-gioco" data-gioco="{d}"></span></div></a></li>' for d, t, s, b in GIOCHI)
    corpo = f'''  <main class="gioco"><ul class="schede-giochi">{schede}</ul>
  <p class="nota" style="margin-top:22px">Giochi brevi per imparare cose che servono. Ogni giorno c'è una sfida nuova, uguale per tutti, e puoi sfidare un amico sulla stessa partita. Nessuna registrazione: record e medaglie restano nel tuo browser. La classifica condivisa è facoltativa e usa un nome inventato, senza dati personali (<a href="https://github.com/casaleggiodavide-stack/agenti-civici/blob/main/docs/classifica.md">come funziona</a>). Ogni regola ha la sua fonte.</p></main>'''
    return cornice('../', 'Gioca con il Polpo', 'I giochi del Polpo civico: imparare giocando la raccolta differenziata e i propri diritti.',
                   'Il Polpo civico · giochi', 'Gioca con il Polpo', 'Partite da un minuto e mezzo per imparare cose che servono, con la fonte di ogni regola.', corpo,
                   script='''<script>
  // il tuo record e le medaglie di ogni gioco, letti dal browser (niente esce da qui)
  document.querySelectorAll('.record-gioco').forEach((el) => {
    try {
      const x = JSON.parse(localStorage.getItem('polpo-gioco-' + el.dataset.gioco) || '{}');
      const r = x.record || +(localStorage.getItem('polpo-' + el.dataset.gioco + '-record') || 0);
      if (r) el.textContent = 'Il tuo record: ' + r + (x.medaglie && x.medaglie.length ? ' · medaglie: ' + x.medaglie.length : '');
    } catch (e) { /* niente */ }
  });
</script>''')


if __name__ == '__main__':
    n = differenzia()
    truffa()
    carrello()
    open(os.path.join(REPO, 'giochi', 'index.html'), 'w', encoding='utf-8').write(ingresso())
    print(f'giochi scritti: Il Polpo differenzia ({n} rifiuti), Truffa o no?, Il carrello del Black Friday')
