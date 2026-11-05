#!/usr/bin/env node
// La classifica condivisa su Node, senza dipendenze (database SQLite di Node).
// Per le prove in locale o per un server con disco permanente:
//   CLASSIFICA_DB=classifica.db PORT=8098 node classifica/server.js
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { crea, INTESTAZIONI, origine } from './src/api.js';

export function apri(percorso = ':memory:') {
  const sql = new DatabaseSync(percorso);
  sql.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  return {
    esegui: async (q, p = []) => sql.prepare(q).run(...p),
    tutte: async (q, p = []) => sql.prepare(q).all(...p).map((r) => ({ ...r })),
  };
}

export function servizio(db, opzioni = {}) {
  const gestisci = crea({ db, ...opzioni });
  return createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const intestazioni = { ...INTESTAZIONI, 'access-control-allow-origin': origine(req.headers.origin, process.env.ORIGINI), vary: 'origin' };
    if (req.method === 'OPTIONS') { res.writeHead(204, intestazioni); res.end(); return; }
    let corpo = '';
    req.setEncoding('utf8');
    req.on('data', (c) => { corpo += c; if (corpo.length > 40000) req.destroy(); });
    req.on('end', async () => {
      try {
        const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
        const [stato, risposta] = await gestisci({ metodo: req.method, percorso: url.pathname, query: url.searchParams, corpo, ip });
        res.writeHead(stato, intestazioni); res.end(JSON.stringify(risposta));
      } catch {
        res.writeHead(500, intestazioni); res.end(JSON.stringify({ errore: 'errore del servizio' }));
      }
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const porta = Number(process.env.PORT || 8098);
  servizio(apri(process.env.CLASSIFICA_DB || 'classifica.db')).listen(porta, () => console.log(`classifica su http://localhost:${porta}`));
}
