// Copia i moduli di comune/ dentro ogni strumento (src/comune/), così ogni
// strumento resta autonomo e pubblicabile da solo. Con --verifica controlla
// soltanto che le copie siano identiche all'originale.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const radice = new URL('../', import.meta.url);
const STRUMENTI = ['faccio-ricorso', 'chiedo-gli-atti'];
const verifica = process.argv.includes('--verifica');
const file = readdirSync(new URL("comune/", radice)).filter((f) => f.endsWith(".js") || f.endsWith(".css"));
let diversi = 0;
for (const s of STRUMENTI) {
  if (!existsSync(new URL(`${s}/`, radice))) continue;
  const dest = new URL(`${s}/src/comune/`, radice);
  mkdirSync(dest, { recursive: true });
  for (const f of file) {
    const intest = f.endsWith('.css') ? '/* Copia di comune/' + f + ': non modificare qui, usa npm run sincronizza. */\n' : '// Copia di comune/' + f + ': non modificare qui, usa npm run sincronizza.\n';
    const testo = intest + readFileSync(new URL(`comune/${f}`, radice), 'utf8');
    const qui = new URL(f, dest);
    const attuale = existsSync(qui) ? readFileSync(qui, 'utf8') : null;
    if (attuale !== testo) {
      diversi++;
      if (!verifica) writeFileSync(qui, testo);
    }
  }
}
if (verifica && diversi) {
  console.error(`${diversi} copie di comune/ non aggiornate: esegui npm run sincronizza`);
  process.exit(1);
}
if (!verifica) console.log('comune/ sincronizzato');
