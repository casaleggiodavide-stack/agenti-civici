// Controlla che le fonti e i link ai servizi rispondano. Uso: node scripts/controlla-link.mjs
import { PRESTAZIONI } from '../src/prestazioni/index.js';

const urls = new Map();
for (const p of PRESTAZIONI) {
  for (const f of p.fonti) urls.set(f.url, p.id);
  if (p.come?.link) urls.set(p.come.link, p.id);
}
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
let rotti = 0;
await Promise.all([...urls].map(async ([url, id]) => {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(25000) });
    const ok = r.status < 400;
    if (!ok) rotti++;
    console.log(ok ? 'OK ' : 'NO ', r.status, id.padEnd(28), url, r.redirected ? '-> ' + r.url : '');
  } catch (e) {
    rotti++;
    console.log('ERR', '---', id.padEnd(28), url, e.cause?.code || e.message);
  }
}));
console.log(`\n${urls.size} link, ${rotti} da sistemare`);
process.exitCode = rotti ? 1 : 0;
