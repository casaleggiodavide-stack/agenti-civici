// La classifica condivisa su Cloudflare Workers, con il database D1 «polpo-classifica».
// Si pubblica con .github/workflows/classifica.yml (vedi docs/classifica.md).
import { crea, INTESTAZIONI, origine } from './src/api.js';

let gestisci = null;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const intestazioni = { ...INTESTAZIONI, 'access-control-allow-origin': origine(request.headers.get('origin'), env.ORIGINI), vary: 'origin' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: intestazioni });
    if (!gestisci) {
      gestisci = crea({ db: {
        esegui: (sql, p = []) => env.DB.prepare(sql).bind(...p).run(),
        tutte: async (sql, p = []) => (await env.DB.prepare(sql).bind(...p).all()).results,
      } });
    }
    try {
      const [stato, corpo] = await gestisci({ metodo: request.method, percorso: url.pathname, query: url.searchParams,
        corpo: request.method === 'POST' ? await request.text() : '', ip: request.headers.get('cf-connecting-ip') || '' });
      return new Response(JSON.stringify(corpo), { status: stato, headers: intestazioni });
    } catch {
      return new Response(JSON.stringify({ errore: 'errore del servizio' }), { status: 500, headers: intestazioni });
    }
  },
};
