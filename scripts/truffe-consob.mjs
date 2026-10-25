// Copia i domini dei siti oscurati dalla CONSOB (comunicati «Occhio alle truffe!») in
// truffe/dati/consob.js. Rispetta il Crawl-delay di 3 secondi del robots.txt di consob.it.
// Si usano solo i nomi dei domini (fatti), con il comunicato come fonte.
// Uso: node scripts/truffe-consob.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const UA = 'agenti-civici/1.0 (+https://casaleggiodavide-stack.github.io/agenti-civici/)';
const INDICI = ['https://www.consob.it/web/area-pubblica/comunicati-stampa-2026', 'https://www.consob.it/web/area-pubblica/comunicati-stampa-2025'];
const uscita = new URL('../truffe/dati/consob.js', import.meta.url);
const FINTI = /\.(push|createelement|getelementsbytagname|type|async|src|js|php|insertbefore|parentnode|pdf|lgs|html?)$|webanalytics\.italia\.it$/;
const pausa = () => new Promise((r) => setTimeout(r, 3200));
const ESCLUSI = /(^|\.)(consob\.it|liferay\.com|w3\.org|facebook\.com|instagram\.com|linkedin\.com|youtube\.com|twitter\.com|x\.com|perfdrive\.com|google\.[a-z.]+|gstatic\.com|bancaditalia\.it|europa\.eu)$/;

async function leggi(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}
const testo = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const prima = existsSync(uscita) ? (await import(uscita.href)).default : { comunicati: [] };
const visti = new Map(prima.comunicati.map((c) => [c.url, c]));

const pagine = new Set();
for (const indice of INDICI) {
  try {
    const html = await leggi(indice);
    for (const m of html.matchAll(/href="(https:\/\/www\.consob\.it\/web\/(?:area-pubblica|consob)\/w\/(?:comunicato-stampa-del|occhio-alle-truffe)[^"#?]*)"/g)) pagine.add(m[1]);
  } catch (e) { console.error('indice non letto:', e.message); }
  await pausa();
}

for (const url of pagine) {
  if (visti.has(url)) continue;
  try {
    const t = testo(await leggi(url));
    if (!/oscurament/i.test(t)) { visti.set(url, { url, domini: [] }); await pausa(); continue; }
    const pezzo = (t.match(/elenco dei siti[\s\S]*?(?:Sale, così|Sale così|Sono in corso)/i) || [t])[0];
    const domini = [...new Set([...pezzo.matchAll(/(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,24})/gi)].map((m) => m[1].toLowerCase().replace(/^www\./, '')).filter((d) => !ESCLUSI.test(d) && !FINTI.test(d)))];
    const data = (t.match(/Comunicato stampa del (\d{1,2} \w+ 20\d\d)/i) || [])[1] || null;
    const totale = Number((t.match(/sale[^.]{0,20}a (\d[\d.]*) il numero dei siti/i) || [])[1]?.replace('.', '')) || null;
    visti.set(url, { url, data, totale, domini });
    console.log(url, domini.length);
  } catch (e) { console.error('non letto:', e.message); }
  await pausa();
}

const comunicati = [...visti.values()].filter((c) => c.domini?.length);
const totale = Math.max(0, ...comunicati.map((c) => c.totale || 0)) || null;
const dominio = {};
for (const c of comunicati) for (const d of c.domini) dominio[d] ||= c.url;
const oggi = new Date().toISOString().slice(0, 10);
writeFileSync(uscita, `// Generato da scripts/truffe-consob.mjs il ${oggi}: domini dei siti oscurati dalla CONSOB nei comunicati letti.\nexport default ${JSON.stringify({ letto: oggi, totale, comunicati: [...visti.values()], dominio }, null, 1)};\n`);
console.log(`${Object.keys(dominio).length} domini da ${comunicati.length} comunicati; totale CONSOB dichiarato: ${totale}`);
