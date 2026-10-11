// Produce dist/artifact.html: la stessa pagina senza <html>/<head>/<body>,
// per pubblicarla come Artifact (che aggiunge da sé lo scheletro).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const tenere = head.split('\n').filter((r) => /<title>|<link /.test(r)).join('\n');
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist/artifact.html', import.meta.url), tenere + '\n' + body);
console.log('dist/artifact.html scritto');
