"""Crediti dell'Associazione Gianroberto Casaleggio e link per sostenere l'iniziativa, su tutte
le pagine: nella barra degli strumenti, nel piede, nella pagina d'ingresso, nell'Atlante e nel
catalogo. Tra marcatori, quindi si può rilanciare. Uso: python3 -I scripts/crediti.py
"""
import glob
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSOCIAZIONE = 'https://www.gianrobertocasaleggio.com/'
DONA = 'https://www.gianrobertocasaleggio.com/donazioni/'
FUORI = 'target="_blank" rel="noopener"'

BARRA = f'<!--sostieni--><a class="sostieni" href="{DONA}" {FUORI}>Sostieni l\'iniziativa</a><!--/sostieni-->'
PIEDE = (f'<!--crediti--><p class="crediti">Il Polpo civico è promosso dall\'<a href="{ASSOCIAZIONE}" {FUORI}>Associazione Gianroberto Casaleggio</a>, '
         f'senza fini di lucro. Gli strumenti sono gratuiti, senza pubblicità e senza tracciamento: vivono grazie a chi li sostiene. '
         f'<a class="sostieni" href="{DONA}" {FUORI}>Sostieni l\'iniziativa</a></p><!--/crediti-->')
CASA = f'''<!--crediti-casa--><section class="crediti-casa" aria-labelledby="t-crediti">
    <div>
      <div class="occhiello">Chi c'è dietro</div>
      <h2 id="t-crediti">Promosso dall'Associazione Gianroberto Casaleggio</h2>
      <p>Il Polpo civico è promosso dall'Associazione Gianroberto Casaleggio, che non ha fini di lucro. Gli strumenti sono gratuiti, aperti, senza pubblicità e senza tracciamento: chiunque può usarli e controllarne le regole. Vivono grazie a chi decide di sostenerli.</p>
    </div>
    <p class="azioni"><a class="btn btn-primario" href="{DONA}" {FUORI}>Sostieni l'iniziativa</a> <a class="btn" href="{ASSOCIAZIONE}" {FUORI}>L'Associazione</a></p>
  </section><!--/crediti-casa-->'''


def metti(s, segno, blocco, dove):
    gia = re.compile(rf'<!--{segno}-->.*?<!--/{segno}-->', re.S)
    if gia.search(s):
        return gia.sub(lambda m: blocco, s, count=1)
    return dove(s, blocco)


def main():
    n = 0
    for p in glob.glob(os.path.join(REPO, '*', 'index.html')):
        s = open(p, encoding='utf-8').read()
        if '<nav class="famiglia"' not in s:
            continue
        s = metti(s, 'sostieni', BARRA, lambda t, b: re.sub(r'(<nav class="famiglia".*?)(\n\s*</nav>)', lambda m: m.group(1) + '\n    ' + b + m.group(2), t, count=1, flags=re.S))
        s = metti(s, 'crediti', PIEDE, lambda t, b: t.replace('<footer class="piede">', '<footer class="piede">\n    ' + b, 1))
        open(p, 'w', encoding='utf-8').write(s)
        n += 1
    p = os.path.join(REPO, 'index.html')
    s = open(p, encoding='utf-8').read()
    banda = (f'<!--banda--><div class="banda-sostieni"><span>Promosso dall\'<a href="{ASSOCIAZIONE}" {FUORI}>Associazione Gianroberto Casaleggio</a></span>'
             f'<a class="sostieni" href="{DONA}" {FUORI}>Sostieni l\'iniziativa</a></div><!--/banda-->')
    s = metti(s, 'banda', banda, lambda t, b: t.replace('<div class="max">', '<div class="max">\n  ' + b, 1))
    s = metti(s, 'crediti-casa', CASA, lambda t, b: t.replace('  <footer class="piede">', '  ' + b + '\n\n  <footer class="piede">', 1))
    s = metti(s, 'crediti', PIEDE, lambda t, b: t.replace('<footer class="piede">', '<footer class="piede">\n    ' + b, 1))
    open(p, 'w', encoding='utf-8').write(s)
    # Atlante e catalogo: hanno un loro piede semplice
    semplice = (f'<!--crediti--><p style="margin:10px 0 0">Il Polpo civico è promosso dall\'<a href="{ASSOCIAZIONE}" {FUORI}>Associazione Gianroberto Casaleggio</a>. '
                f'<a href="{DONA}" {FUORI} style="font-weight:700;color:#C2362B">Sostieni l\'iniziativa</a></p><!--/crediti-->')
    for f in ['mondo/atlante.html', 'mondo/index.html', 'catalogo/sorgente.html']:
        p = os.path.join(REPO, f)
        s = open(p, encoding='utf-8').read()
        s = metti(s, 'crediti', semplice, lambda t, b: re.sub(r'(<footer[^>]*>.*?)(</footer>)', lambda m: m.group(1) + b + m.group(2), t, count=1, flags=re.S))
        open(p, 'w', encoding='utf-8').write(s)
    print(n, 'strumenti con i crediti, più pagina d\'ingresso, Atlante e catalogo')


if __name__ == '__main__':
    main()
