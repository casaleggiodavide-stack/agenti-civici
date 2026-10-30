// Prepara l'estensione per le app desktop compatibili (formato MCPB): una cartella con
// manifest.json, il server MCP e le regole degli strumenti, compressa in
// dist/agenti-civici.mcpb. Si installa con un doppio clic.
// Uso: node scripts/prepara-estensione.mjs
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const radice = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(join(radice, 'package.json'), 'utf8'));
const { TOOLS, INFO } = await import(join(radice, 'mcp/nucleo.js'));
const cartella = join(radice, 'dist/estensione');
const uscita = join(radice, 'dist/agenti-civici.mcpb');

rmSync(cartella, { recursive: true, force: true });
mkdirSync(join(cartella, 'server/mcp'), { recursive: true });
for (const f of ['nucleo.js', 'server.js']) cpSync(join(radice, 'mcp', f), join(cartella, 'server/mcp', f));
for (const t of ['mi-spetta', 'faccio-ricorso', 'chiedo-gli-atti', 'mi-rimborsano', 'bilancio-comune', 'appalti', 'navigatore', 'segnalazioni', 'reclami-pa', 'raccolte-firme', 'garanzia', 'liste-attesa', 'truffe']) {
  cpSync(join(radice, t, 'src'), join(cartella, 'server', t, 'src'), { recursive: true, filter: (p) => !/\/test\/|\.test\.js$|\.css$/.test(p) });
  if (existsSync(join(radice, t, 'dati'))) cpSync(join(radice, t, 'dati'), join(cartella, 'server', t, 'dati'), { recursive: true });
}
mkdirSync(join(cartella, 'server/comune'), { recursive: true });
cpSync(join(radice, 'comune/schede.js'), join(cartella, 'server/comune/schede.js'));
writeFileSync(join(cartella, 'server/package.json'), JSON.stringify({ type: 'module', private: true }, null, 2) + '\n');
if (existsSync(join(radice, 'mcp/icona.png'))) cpSync(join(radice, 'mcp/icona.png'), join(cartella, 'icon.png'));

const manifest = {
  manifest_version: '0.3',
  name: 'agenti-civici',
  display_name: 'Polpo civico',
  version: INFO.version,
  description: 'Bonus e prestazioni, multe, accesso agli atti, reclami e rimborsi, bilanci dei Comuni e appalti: le regole italiane verificate sulle fonti ufficiali, dentro il tuo assistente AI.',
  long_description: 'Il Polpo civico mette a disposizione strumenti aperti al servizio del cittadino. Con questa estensione l\'assistente AI usa le loro regole invece della memoria: a quali bonus e prestazioni nazionali e regionali hai diritto, se conviene fare ricorso a una multa, come chiedere documenti a un ente pubblico, quanto ti spetta per un volo in ritardo, un treno, un bagaglio, una bolletta, un disservizio telefonico o un addebito non autorizzato, come spende il tuo Comune e quali segnali di rischio ci sono nei suoi appalti. Ogni risposta cita la fonte. Non salva dati e non è un parere legale.',
  author: { name: 'Polpo civico', url: 'https://github.com/casaleggiodavide-stack/agenti-civici' },
  repository: { type: 'git', url: 'https://github.com/casaleggiodavide-stack/agenti-civici' },
  homepage: 'https://casaleggiodavide-stack.github.io/agenti-civici/',
  documentation: 'https://github.com/casaleggiodavide-stack/agenti-civici/blob/main/mcp/LEGGIMI.md',
  license: pkg.license,
  keywords: ['civico', 'italia', 'bonus', 'multe', 'foia', 'rimborsi', 'diritti'],
  ...(existsSync(join(cartella, 'icon.png')) ? { icon: 'icon.png' } : {}),
  server: {
    type: 'node',
    entry_point: 'server/mcp/server.js',
    mcp_config: { command: 'node', args: ['${__dirname}/server/mcp/server.js'] },
  },
  tools: TOOLS.map((t) => ({ name: t.name, description: t.description.split('. ')[0] + '.' })),
  compatibility: { platforms: ['darwin', 'win32', 'linux'], runtimes: { node: '>=20.0.0' } },
};
writeFileSync(join(cartella, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

rmSync(uscita, { force: true });
execFileSync('zip', ['-r', '-X', '-q', uscita, '.'], { cwd: cartella });
console.log(`${uscita} pronto (${TOOLS.length} strumenti, versione ${INFO.version})`);
