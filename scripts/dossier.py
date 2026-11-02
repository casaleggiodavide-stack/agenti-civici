#!/usr/bin/env python3
"""Il Polpo legge per te: la cornice comune dei dossier che leggono migliaia di documenti pubblici.

Ogni dossier sta in legge/<nome>/ con index.html e dati/; lo scrive il suo script (scripts/legge-<nome>.py)
chiamando pagina() di questo modulo. Lanciato da solo, questo script scrive la pagina d'ingresso legge/index.html.

Regole per tutti i dossier:
  - ogni affermazione della sintesi ha il rimando al documento da cui viene (cit());
  - si mettono i fatti uno accanto all'altro: nessuna classifica di partiti o persone, nessun giudizio politico;
  - un indicatore non è un illecito;
  - la sintesi è fatta con un assistente AI e controllata a campione: lo si dice nel riquadro del metodo;
  - si rispettano i robots.txt e i limiti dei siti; i dati grezzi stanno in ~/dati-civici, fuori dal repository.

Uso: python3 -I scripts/dossier.py
"""
import html
import importlib.util
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _carica(nome, file):
    spec = importlib.util.spec_from_file_location(nome, os.path.join(REPO, 'scripts', file))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


_storie = _carica('storie', 'storie.py')
casa = _storie.casa
it, euro, barre, tabella, JS_ORDINA = _storie.it, _storie.euro, _storie.barre, _storie.tabella, _storie.JS_ORDINA
esc = lambda t: html.escape(str(t), quote=True)

# I quattro dossier, nell'ordine della pagina d'ingresso: cartella, titolo, sommario, braccio del Polpo (0-7)
DOSSIER = [
    ('manovra', 'La manovra letta dal Polpo', 'Circa 26 miliardi nel 2027: 31 misure lette una per una, con quanto valgono e la fonte. Poi le audizioni e gli emendamenti, appena escono.', 4),
    ('interrogazioni', 'Le domande senza risposta', '25.821 interrogazioni di questa legislatura: tolto il question time, il Governo ha risposto a meno di una su quattro. Ministero per Ministero, tema per tema.', 4),
    ('antitrust', 'Le trappole sanzionate', 'Circa 167 milioni di multe dal 2024 e quindici trucchi che tornano sempre: come riconoscerli, prima del Black Friday.', 3),
    ('accessi', 'Cosa chiedono gli italiani alla PA', '9.821 richieste a 17 enti: il 39% delle richieste FOIA è respinto o accolto solo in parte. Cosa si chiede e perché si dice no.', 1),
]

CSS = _storie.CSS_PAGINA + '''
  .dossier { max-width: 820px; margin: 0 auto; }
  .dossier > section { margin-top: 48px; padding-top: 26px; border-top: 2px solid var(--inchiostro); }
  .dossier h2 { font-size: clamp(26px, 3.8vw, 38px); line-height: 1.08; margin: 6px 0 12px; }
  .dossier h3 { font-size: var(--s2); margin: 24px 0 8px; }
  .dossier p, .dossier li { color: var(--inchiostro-2); }
  .dossier .lista { padding-left: 18px; display: grid; gap: 8px; }
  .cit { font-family: var(--cifre); font-size: 11px; vertical-align: super; line-height: 0; margin-left: 2px; text-decoration: none; color: var(--accento); }
  .cit:hover { text-decoration: underline; }
  .metodo { margin-top: 18px; padding: 16px 18px; background: var(--carta); border: 1px solid var(--riga); border-radius: 4px; font-size: var(--s0); color: var(--inchiostro-2); }
  .metodo b { color: var(--inchiostro); }
  .in-arrivo { padding: 14px 16px; border: 1px dashed var(--inchiostro-3); border-radius: 4px; color: var(--inchiostro-2); font-size: var(--s0); }
  .fonti-dossier { font-size: var(--s-1); color: var(--inchiostro-3); padding-left: 22px; display: grid; gap: 4px; }
  .fonti-dossier a { color: var(--inchiostro-2); overflow-wrap: anywhere; }
  .schede-legge { list-style: none; padding: 0; margin: 26px 0 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 14px; }
  .schede-legge a { display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 14px; padding: 18px; background: var(--carta); border: 1px solid var(--riga); border-radius: 4px; text-decoration: none; color: inherit; height: 100%; }
  .schede-legge a:hover { border-color: var(--accento); }
  .schede-legge b { display: block; font-family: var(--titoli); font-size: 21px; letter-spacing: -0.02em; color: var(--inchiostro); margin-bottom: 6px; }
  .schede-legge span { font-size: var(--s0); color: var(--inchiostro-2); }
'''


def cit(n, url, titolo=''):
    """Rimando numerato a un documento: <sup>[n]</sup> cliccabile."""
    t = f' title="{esc(titolo)}"' if titolo else ''
    return f'<a class="cit" href="{esc(url)}" target="_blank" rel="noopener"{t}>[{n}]</a>'


def fonti(elenco):
    """elenco: [(titolo, url)] nell'ordine dei numeri usati in cit()."""
    return '<ol class="fonti-dossier">' + ''.join(f'<li><a href="{esc(u)}" target="_blank" rel="noopener">{esc(t)}</a></li>' for t, u in elenco) + '</ol>'


def metodo(letti, come, limiti, aggiornato):
    return (f'<div class="metodo"><p><b>Cosa abbiamo letto.</b> {letti}</p><p><b>Come.</b> {come} La sintesi è fatta con un assistente AI: '
            'ogni affermazione rimanda al documento da cui viene e una parte è controllata a mano. Se trovi un errore, '
            '<a href="https://github.com/casaleggiodavide-stack/agenti-civici/issues/new" target="_blank" rel="noopener">segnalalo</a>.</p>'
            f'<p><b>Limiti.</b> {limiti}</p><p><b>Aggiornato al</b> {esc(aggiornato)}.</p></div>')


def pagina(prof, titolo, descrizione, occhiello, h1, intro, corpo, braccio=None, css_extra=''):
    """Pagina completa. prof = percorso fino alla radice del sito ('../../' per legge/<nome>/)."""
    logo = casa.polpo_mini(braccio, classe='logo-polpo')
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
<style>{CSS}{css_extra}</style>
</head>
<body>
<div class="max">
  <div class="banda-sostieni"><span><a href="{prof}">← Il Polpo civico</a>{'' if prof == '../' else f' · <a href="{prof}legge/">Il Polpo legge per te</a>'}</span><span>Promosso dall'<a href="https://www.gianrobertocasaleggio.com/" target="_blank" rel="noopener">Associazione Gianroberto Casaleggio</a></span></div>
  <header class="storie-testa">
    {logo}
    <div>
      <div class="occhiello">{esc(occhiello)}</div>
      <h1>{esc(h1)}</h1>
      <p>{intro}</p>
    </div>
  </header>
  <main class="dossier">
{corpo}
  </main>
</div>
{JS_ORDINA}
</body>
</html>
'''


def ingresso():
    schede = ''.join(f'<li><a href="{d}/">{casa.polpo_mini(b, classe="st-polpo")}<div><b>{esc(t)}</b><span>{esc(s)}</span></div></a></li>' for d, t, s, b in DOSSIER)
    corpo = f'''    <ul class="schede-legge">{schede}</ul>
    <section><h2>Perché</h2>
      <p>Le istituzioni pubblicano ogni anno migliaia di documenti che quasi nessuno legge per intero: memorie, emendamenti, interrogazioni, provvedimenti, registri. Il Polpo li legge tutti e ne fa una sintesi in cui ogni frase rimanda al documento originale. Non sostituisce la lettura: la rende possibile.</p>
      <p>Regole: solo documenti pubblici e scaricabili; nessuna classifica di partiti o persone; un indicatore non è un illecito; il metodo e i limiti sono scritti in ogni dossier.</p></section>'''
    return pagina('../', 'Il Polpo legge per te', 'Il Polpo civico legge migliaia di documenti pubblici e ne fa una sintesi con le fonti: la manovra, le interrogazioni, l\'Antitrust, le richieste di accesso.',
                  'Il Polpo civico · sintesi dai documenti pubblici', 'Il Polpo legge per te',
                  'Quattro dossier su documenti pubblici che nessuno legge per intero, con ogni affermazione collegata alla fonte.', corpo)


if __name__ == '__main__':
    os.makedirs(os.path.join(REPO, 'legge'), exist_ok=True)
    open(os.path.join(REPO, 'legge', 'index.html'), 'w', encoding='utf-8').write(ingresso())
    print('legge/index.html scritta')
