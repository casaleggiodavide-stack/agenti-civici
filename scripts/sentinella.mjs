// Sentinella delle regole: legge le fonti e i feed, confronta con l'ultima
// lettura e scrive sentinella/rapporto.md e sentinella/stato.json.
// Uso: npm run sentinella            (lettura completa)
//      npm run sentinella -- --solo-feed
// Esce con codice 0 anche se trova novità: il rapporto è il risultato.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  AGENTE, FEED, raccogliFonti, robotsConsente, testoVisibile, importi, impronta, parole,
  confronta, nonLeggibile, vociFeed, pertinenza, revisioni, rapporto, giorno,
} from '../sentinella/sentinella.js';

const STATO = fileURLToPath(new URL('../sentinella/stato.json', import.meta.url));
const soloFeed = process.argv.includes('--solo-feed');
// La lettura quotidiana dei soli feed ha un rapporto suo, per non coprire quello settimanale.
const RAPPORTO = fileURLToPath(new URL(soloFeed ? '../sentinella/rapporto-feed.md' : '../sentinella/rapporto.md', import.meta.url));
const oggi = giorno(new Date());
const stato = existsSync(STATO) ? JSON.parse(readFileSync(STATO, 'utf8')) : { fonti: {}, feed: {} };

const attesa = (ms) => new Promise((ok) => setTimeout(ok, ms));
const robotsCache = new Map();
const ultimoPerHost = new Map();

async function scarica(url) {
  // Una richiesta per volta per sito, a distanza di almeno due secondi.
  const host = new URL(url).host;
  const dopo = (ultimoPerHost.get(host) || 0) + 2000 - Date.now();
  if (dopo > 0) await attesa(dopo);
  ultimoPerHost.set(host, Date.now());
  return fetch(url, { redirect: 'follow', headers: { 'user-agent': AGENTE, accept: 'text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8' }, signal: AbortSignal.timeout(30000) });
}

async function robots(url) {
  const { origin } = new URL(url);
  if (!robotsCache.has(origin)) {
    let esito;
    try {
      const r = await scarica(origin + '/robots.txt');
      // Un robots.txt assente vale «tutto consentito»; un errore del server vale «fermati».
      esito = { testo: r.ok ? await r.text() : r.status >= 500 ? 'User-agent: *\nDisallow: /' : '' };
    } catch (e) {
      // Se il sito non risponde non si legge niente, ma non è un divieto: lo diciamo.
      esito = { errore: `sito non raggiungibile (${e.cause?.code || e.name || 'errore di rete'})` };
    }
    robotsCache.set(origin, esito);
  }
  return robotsCache.get(origin);
}

async function leggi(url, { grezzo = false } = {}) {
  const rb = await robots(url);
  if (rb.errore) return { ok: false, errore: rb.errore };
  if (!robotsConsente(rb.testo, url)) return { ok: false, bloccata: true, errore: 'vietato da robots.txt' };
  try {
    const r = await scarica(url);
    // Dopo un reindirizzamento ricontrolliamo robots sul nuovo indirizzo.
    if (r.redirected && !robotsConsente((await robots(r.url)).testo ?? 'User-agent: *\nDisallow: /', r.url)) return { ok: false, bloccata: true, errore: 'vietato da robots.txt dopo il reindirizzamento' };
    if (!r.ok) return { ok: false, stato: r.status, errore: `HTTP ${r.status}` };
    const tipo = r.headers.get('content-type') || '';
    if (/pdf|octet-stream/.test(tipo)) {
      const b = Buffer.from(await r.arrayBuffer());
      return { ok: true, stato: r.status, finale: r.url, impronta: impronta(b.toString('latin1')), importi: [], parole: [] };
    }
    const corpo = await r.text();
    if (grezzo) return { ok: true, stato: r.status, corpo };
    const testo = testoVisibile(corpo);
    const errore = nonLeggibile(testo);
    if (errore) return { ok: false, illeggibile: true, stato: r.status, errore };
    return { ok: true, stato: r.status, finale: r.url, impronta: impronta(testo), importi: importi(testo), parole: parole(testo) };
  } catch (e) {
    return { ok: false, errore: e.cause?.code || e.name || String(e) };
  }
}

const fonti = soloFeed ? [] : raccogliFonti();
console.log(`Sentinella ${oggi}: ${fonti.length} fonti, ${FEED.length} feed`);
for (const f of fonti) {
  const ora = await leggi(f.url);
  const prima = stato.fonti[f.url];
  f.confronto = confronta(prima, ora);
  // Un problema già segnalato la volta scorsa non riapre l'avviso.
  if (!ora.ok && prima?.errore) f.confronto.ripetuto = true;
  console.log(f.confronto.esito.padEnd(9), f.url);
  if (ora.ok) {
    const cambiata = f.confronto.esito === 'cambiata' || f.confronto.esito === 'nuova';
    stato.fonti[f.url] = {
      titolo: f.titolo, impronta: ora.impronta, importi: ora.importi,
      // Solo le impronte delle parole, per misurare quanto cambia la volta dopo.
      parole: ora.parole,
      letta: oggi, cambiata: cambiata ? oggi : prima?.cambiata || oggi,
    };
  } else {
    stato.fonti[f.url] = { ...(prima || { titolo: f.titolo }), errore: f.confronto.dettaglio || f.confronto.esito, provata: oggi };
  }
}

const feed = [];
for (const fd of FEED) {
  const visti = new Set(stato.feed[fd.id]?.visti || []);
  const primaVolta = !stato.feed[fd.id];
  const ora = await leggi(fd.url, { grezzo: true });
  if (!ora.ok) { feed.push({ ...fd, ok: false, errore: ora.errore, nuove: [] }); console.log('feed NO ', fd.url, ora.errore); continue; }
  const voci = vociFeed(ora.corpo);
  const nuove = voci.filter((v) => !visti.has(v.id)).map((v) => ({ ...v, pertinenza: pertinenza(v) })).filter((v) => v.pertinenza.length);
  for (const v of voci) visti.add(v.id);
  stato.feed[fd.id] = { letto: oggi, visti: [...visti].slice(-800) };
  // Alla prima lettura il feed fa da base: niente «novità» su tutto l'archivio.
  feed.push({ ...fd, ok: true, nuove: primaVolta ? [] : nuove, voci: voci.length });
  console.log('feed', String(voci.length).padStart(3), 'voci,', primaVolta ? 'base creata' : `${nuove.length} pertinenti nuove`, fd.url);
}

const rev = soloFeed ? [] : revisioni(oggi);
const testo = rapporto({ oggi, fonti: fonti.length ? fonti : [], feed, revisioni: rev });
writeFileSync(STATO, JSON.stringify(stato, null, 1) + '\n');
writeFileSync(RAPPORTO, testo + '\n');
console.log('\n' + testo.split('\n').slice(0, 3).join('\n'));
console.log(`\nRapporto: ${RAPPORTO}`);
