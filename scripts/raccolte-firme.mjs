// Raccolte firme in corso: legge l'elenco pubblico della piattaforma del Ministero
// della Giustizia (nessun accesso, una sola richiesta) e salva:
//   raccolte-firme/dati/raccolte.js   le raccolte, campi essenziali
//   raccolte-firme/dati/serie.json     firme online per raccolta e per giorno (si allunga a ogni lettura)
// Uso: node scripts/raccolte-firme.mjs   (una volta al giorno basta: la piattaforma aggiorna la cache ogni 5 minuti)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const URL_ELENCO = 'https://firmereferendum.giustizia.it/referendum/api-portal/iniziativa/public';
const radice = new URL('../raccolte-firme/dati/', import.meta.url);
const oggi = new Date().toISOString().slice(0, 10);

const r = await fetch(URL_ELENCO, { headers: { Accept: 'application/json', 'User-Agent': 'agenti-civici/1.0 (+https://casaleggiodavide-stack.github.io/agenti-civici/)' } });
if (!r.ok) throw new Error(`piattaforma: HTTP ${r.status}`);
const { content } = await r.json();
if (!Array.isArray(content) || !content.length) throw new Error('piattaforma: elenco vuoto');

const data = (s) => (s && !s.startsWith('9999') ? s.slice(0, 10) : null);
const pulisci = (t) => String(t || '').replace(/\s+/g, ' ').trim();
const raccolte = content.map((x) => ({
  id: x.id,
  titolo: pulisci(x.titolo),
  breve: pulisci(x.descrizioneBreve).slice(0, 320),
  tipo: x.idDecTipoIniziativa?.id === 1 ? 'referendum' : x.idDecTipoIniziativa?.id === 4 ? 'legge' : 'altro',
  stato: x.idDecStatoIniziativa?.nome || null,
  firme: Number(x.sostenitori) || 0,
  quorum: Number(x.quorum) || null,
  inizio: data(x.dataInizioRaccolta),
  fine: data(x.dataFineRaccolta),
  gazzetta: data(x.dataGazzetta),
  sito: /^https?:\/\//.test(x.sito || '') ? x.sito : null,
})).sort((a, b) => (a.fine || '9999').localeCompare(b.fine || '9999'));

const pSerie = new URL('serie.json', radice);
const serie = existsSync(pSerie) ? JSON.parse(readFileSync(pSerie, 'utf8')) : {};
for (const x of raccolte) {
  const s = (serie[x.id] ||= []);
  const ultima = s[s.length - 1];
  if (ultima && ultima[0] === oggi) ultima[1] = x.firme;
  else if (!ultima || ultima[1] !== x.firme || x.stato === 'IN RACCOLTA FIRME') s.push([oggi, x.firme]);
}
writeFileSync(pSerie, JSON.stringify(serie));
writeFileSync(new URL('raccolte.js', radice), `// Generato da scripts/raccolte-firme.mjs il ${oggi} dalla piattaforma pubblica del Ministero della Giustizia (riuso non commerciale con citazione della fonte).\nexport const LETTO = '${oggi}';\nexport const SERIE = ${JSON.stringify(serie)};\nexport default ${JSON.stringify(raccolte, null, 1)};\n`);
console.log(`${raccolte.length} raccolte, lette il ${oggi}`);
