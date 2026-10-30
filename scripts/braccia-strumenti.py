"""Il Polpo negli strumenti: il logo di ogni strumento è il Polpo con il suo braccio in rosso
(anche l'icona del browser, src/logo.svg); in testata il segno del braccio a cui appartiene lo strumento
(«Braccio 02 di 8 del Polpo · Scrive le lettere»), in fondo la fila delle otto braccia con
quello attuale in rosso. I collegamenti portano alla pagina d'ingresso con quel braccio in vista
(../#braccio-N). Le braccia e le icone vengono da scripts/casa-polpo.py.
Uso: python3 -I scripts/braccia-strumenti.py
"""
import importlib.util
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location('casa', os.path.join(REPO, 'scripts', 'casa-polpo.py'))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)
BRACCIA = casa.BRACCIA

DI = {}
for k, (_, _, _, _, strumenti) in enumerate(BRACCIA):
    for _, href in strumenti:
        if not href.startswith('http'):
            DI[href.strip('/')] = k


def icona(k):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="{BRACCIA[k][3]}"/></svg>'


def marchio(s):
    m = re.search(r'<svg class="segno-marchio"[^>]*>.*?</svg>', s, re.S)
    return re.sub(r' width="\d+" height="\d+"', '', m.group(0)) if m else ''


def segno(t, s):
    if t == 'assistente':
        return (f'<!--braccio--><a class="braccio-segno polpo-intero" href="../"><span class="bs-icona">{marchio(s)}</span>'
                f'<span class="bs-testo"><span class="bs-n">Il Polpo in persona</span>usa tutte e otto le braccia</span></a><!--/braccio-->')
    k = DI[t]
    return (f'<!--braccio--><a class="braccio-segno" href="../#braccio-{k + 1}"><span class="bs-icona">{icona(k)}</span>'
            f'<span class="bs-testo"><span class="bs-n">Braccio {k + 1:02d} di 8 del Polpo</span>{BRACCIA[k][1]}</span></a><!--/braccio-->')


def fila(t, s):
    attuale = DI.get(t)
    voci = ''.join(
        f'<li><a class="bp-braccio" href="../#braccio-{k + 1}"{" aria-current=\"true\"" if k == attuale else ""}>{icona(k)}'
        f'<span>{k + 1:02d} · {b[1]}</span></a></li>' for k, b in enumerate(BRACCIA))
    chiedi = '' if t == 'assistente' else '<a class="bp-chiedi" href="../assistente/" data-strumento="assistente">Chiedi al Polpo</a>'
    return (f'<!--braccia--><nav class="braccia-polpo" aria-label="Le otto braccia del Polpo">'
            f'<a class="bp-polpo" href="../">{marchio(s)}<span>Le otto braccia del Polpo</span></a>'
            f'<ol>{voci}</ol>{chiedi}</nav><!--/braccia-->')


def metti(s, nome, blocco, dove):
    if f'<!--{nome}-->' in s:
        return re.sub(rf'<!--{nome}-->.*?<!--/{nome}-->', lambda m: blocco, s, count=1, flags=re.S)
    return dove(s, blocco)


def main():
    n = 0
    for t in sorted(list(DI) + ['assistente']):
        p = os.path.join(REPO, t, 'index.html')
        s = open(p, encoding='utf-8').read()
        def in_testata(s, b):
            if '<!--/logo-->' in s:
                return s.replace('<!--/logo-->', '<!--/logo-->\n      ' + b, 1)
            return re.sub(r'(<img class="logo-alberi"[^>]*>)', lambda m: m.group(1) + '\n      ' + b, s, count=1)
        s = metti(s, 'braccio', segno(t, s), in_testata)
        # il logo dello strumento: il Polpo, con il braccio dello strumento in rosso che indica il titolo
        k = DI.get(t)
        etichetta = 'Il Polpo civico' if k is None else f'Il Polpo civico, braccio {k + 1}: {BRACCIA[k][1]}'
        logo = casa.polpo_mini(k, classe='logo-strumento logo-polpo', etichetta=etichetta)
        s = re.sub(rf'(<!--logo:{re.escape(t)}--><div class="titolo-logo">)<svg class="logo-strumento[^"]*".*?</svg>', lambda m: m.group(1) + logo, s, count=1, flags=re.S)
        if t != 'alberi':
            with open(os.path.join(REPO, t, 'src', 'logo.svg'), 'w', encoding='utf-8') as f:
                f.write(casa.polpo_mini(k, fisso=True))
        s = metti(s, 'braccia', fila(t, s), lambda s, b: s.replace('<footer class="piede">', b + '\n\n  <footer class="piede">', 1))
        assert '<!--braccio-->' in s and '<!--braccia-->' in s, t
        with open(p, 'w', encoding='utf-8') as f:
            f.write(s)
        n += 1
    print(n, 'strumenti con le braccia del Polpo')


if __name__ == '__main__':
    main()
