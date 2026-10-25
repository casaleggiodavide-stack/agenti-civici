// Prepara come Artifact uno strumento che importa codice di altri strumenti
// (es. l'Indice PA di Chiedo gli atti): la pubblicazione conserva i percorsi del repo.
// Uso: node scripts/prepara-artifact-repo.mjs <strumento> <cartella-destinazione> '<json link>' <altre cartelle…>
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const [strumento, dest, linkJson = '{}', ...altre] = process.argv.slice(2);
const link = JSON.parse(linkJson);
const radice = fileURLToPath(new URL('../', import.meta.url));
const cartelle = [`${strumento}/src`, `${strumento}/web`, ...(existsSync(join(radice, strumento, 'dati')) ? [] : []), ...altre];
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const d of cartelle) cpSync(join(radice, d), join(dest, d), { recursive: true, filter: (p) => !/\/test\/|\.test\.js$/.test(p) });
let html = readFileSync(join(radice, strumento, 'index.html'), 'utf8');
const stile = (html.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
const intest = html.match(/<head>([\s\S]*?)<\/head>/)[1].split('\n').filter((r) => /<title>|<link /.test(r)).join('\n').replaceAll('href="src/', `href="${strumento}/src/`);
let body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replace('src="web/app.js"', `src="${strumento}/web/app.js"`);
body = body.replaceAll(`href="../${strumento}/"`, 'href="#"');
for (const [nome, url] of Object.entries(link)) body = body.replaceAll(`href="../${nome}/"`, `href="${url}" target="_top"`);
writeFileSync(join(dest, `${strumento}.html`), `${intest}\n${stile}\n${body}`);
const file = [];
const giro = (d) => readdirSync(d).forEach((n) => { const p = join(d, n); statSync(p).isDirectory() ? giro(p) : file.push(relative(dest, p)); });
cartelle.forEach((d) => giro(join(dest, d)));
writeFileSync(join(dest, 'files.json'), JSON.stringify(Object.fromEntries(file.map((f) => [f, f]))));
console.log(`${dest}/${strumento}.html pronto, ${file.length} file`);
