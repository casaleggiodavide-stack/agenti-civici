"""Crea la pagina di uno strumento nuovo con la stessa struttura degli altri (barra,
testata, esempi, questionario a sinistra ed esito a destra, piede). Il disegno e il logo
li aggiunge poi scripts/illustrazioni.py, la cornice della foto scripts/cornice-foto.py.
Uso: python3 -I scripts/nuova-pagina.py <cartella> <file json con i testi>
"""
import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cartella, testi = sys.argv[1], json.load(open(sys.argv[2], encoding='utf-8'))
modello = open(os.path.join(REPO, 'reclami-pa', 'index.html'), encoding='utf-8').read()

testa = modello[:modello.index('<style>')]
testa = re.sub(r'<title>.*?</title>', f'<title>{testi["titolo"]}</title>', testa)
testa = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{testi["descrizione"]}">', testa)
nav = re.search(r'  <nav class="famiglia".*?</nav>', modello, re.S).group(0)
nav = nav.replace(' aria-current="page"', '')
if f'data-strumento="{cartella}"' in nav:
    nav = nav.replace(f'data-strumento="{cartella}">', f'data-strumento="{cartella}" aria-current="page">')
stile = '<style>\n  body:has(.foto-testata) .scena-testata { display: none; }\n' + testi.get('stile', '') + '</style>\n'
esempi = ''.join(f'\n    <button type="button" data-esempio="{k}">{t}</button>' for k, t in testi['esempi'])
garanzie = ''.join(f'\n      <li><b>{b}</b> {t}</li>' for b, t in testi['garanzie'])
pagina = f'''{testa}{stile}</head>
<body>
<div class="max">
{nav}

  <header class="testata">
    <div>
      <svg class="icona"></svg>
      <h1>{testi["titolo"]}</h1>
      <p class="promessa">{testi["promessa"]}</p>
    </div>
    <ul class="garanzie">{garanzie}
    </ul>
  </header>
  {testi.get("foto", "")}

  <div class="esempi">
    <span class="esempi-etichetta">Prova con un esempio</span>{esempi}
  </div>
  <div class="avviso" id="avviso-esempio" hidden>
    <span>Stai guardando un esempio, non i tuoi dati.</span>
    <button type="button" id="esci-esempio">Ricomincia con i tuoi dati</button>
  </div>

  <div id="foto" hidden></div>
{testi.get("prima", "")}
  <main class="corpo">
    <div class="colonna">
      {testi.get("prima_modulo", "")}
      <form class="colonna" id="questionario" autocomplete="off" novalidate></form>
    </div>
    <div class="colonna appiccicosa" id="esito" aria-live="polite"></div>
  </main>

  <footer class="piede">
    {"".join(f"<p>{p}</p>" for p in testi["piede"])}
    <p><button type="button" class="link" id="cancella">Cancella le risposte da questo dispositivo</button></p>
  </footer>
</div>
<script type="module" src="web/app.js"></script>
</body>
</html>
'''
os.makedirs(os.path.join(REPO, cartella), exist_ok=True)
open(os.path.join(REPO, cartella, 'index.html'), 'w', encoding='utf-8').write(pagina)
print(cartella, 'pronta')
