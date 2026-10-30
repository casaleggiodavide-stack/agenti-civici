// Prepara lo Scrivano civico per la pubblicazione come Artifact. A differenza
// degli altri strumenti importa i motori di regole di tutti e tre, quindi la
// pubblicazione conserva i percorsi del repository (assistente/, mi-spetta/src…).
// Uso: node scripts/prepara-assistente.mjs <cartella-destinazione> '<json link>'
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const [dest, linkJson = '{}'] = process.argv.slice(2);
const link = JSON.parse(linkJson);
const radice = fileURLToPath(new URL('../', import.meta.url));
const CARTELLE = ['assistente/src', 'assistente/web', 'mi-spetta/src', 'faccio-ricorso/src', 'chiedo-gli-atti/src', 'mi-rimborsano/src', 'navigatore/src'];

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const d of CARTELLE) cpSync(join(radice, d), join(dest, d), { recursive: true, filter: (p) => !/\/test\/|\.test\.js$/.test(p) });

let html = readFileSync(join(radice, 'assistente/index.html'), 'utf8');
const stile = (html.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
const intest = html.match(/<head>([\s\S]*?)<\/head>/)[1].split('\n').filter((r) => /<title>|<link /.test(r)).join('\n')
  .replaceAll('href="src/', 'href="assistente/src/');
let body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replaceAll('src="web/', 'src="assistente/web/');
body = body.replaceAll('href="../assistente/"', 'href="#"');
for (const [nome, url] of Object.entries(link)) body = body.replaceAll(`href="../${nome}/"`, `href="${url}" target="_top"`);
// la pagina d'ingresso (e le braccia del Polpo) stanno sul sito pubblico
body = body.replaceAll('href="../#', 'target="_top" href="https://casaleggiodavide-stack.github.io/agenti-civici/#').replaceAll('href="../"', 'href="https://casaleggiodavide-stack.github.io/agenti-civici/" target="_top"');
writeFileSync(join(dest, 'assistente.html'), `${intest}\n${stile}\n${body}`);

const file = [];
const giro = (d) => readdirSync(d).forEach((n) => { const p = join(d, n); statSync(p).isDirectory() ? giro(p) : file.push(relative(dest, p)); });
CARTELLE.forEach((d) => giro(join(dest, d)));
writeFileSync(join(dest, 'files.json'), JSON.stringify(Object.fromEntries(file.map((f) => [f, join(dest, f)])), null, 1));
console.log(`${dest}/assistente.html pronto, ${file.length} file di supporto`);
