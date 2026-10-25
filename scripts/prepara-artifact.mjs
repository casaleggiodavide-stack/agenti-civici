// Prepara uno strumento per la pubblicazione come Artifact: copia src/ e web/,
// toglie <html>/<head>/<body> (li aggiunge la piattaforma) e sostituisce i link
// tra strumenti con gli indirizzi pubblicati.
// Uso: node scripts/prepara-artifact.mjs <strumento> <cartella-destinazione> '<json link>'
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';

const [strumento, dest, linkJson = '{}'] = process.argv.slice(2);
const link = JSON.parse(linkJson);
const radice = new URL('../', import.meta.url);
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const d of ['src', 'web', 'dati']) if (existsSync(new URL(`${strumento}/${d}`, radice))) cpSync(new URL(`${strumento}/${d}`, radice), `${dest}/${d}`, { recursive: true });
let html = readFileSync(new URL(`${strumento}/index.html`, radice), 'utf8');
const stile = (html.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
const intest = html.match(/<head>([\s\S]*?)<\/head>/)[1].split('\n').filter((r) => /<title>|<link /.test(r)).join('\n');
let body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replaceAll(`href="../${strumento}/"`, 'href="#"');
for (const [nome, url] of Object.entries(link)) body = body.replaceAll(`href="../${nome}/"`, `href="${url}" target="_top"`);
writeFileSync(`${dest}/${strumento}.html`, `${intest}\n${stile}\n${body}`);
console.log(`${dest}/${strumento}.html pronto`);
