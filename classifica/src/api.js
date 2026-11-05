// La classifica condivisa: le regole del servizio, uguali su Cloudflare (worker.js) e su Node (server.js).
//   GET    /classifica/<gioco>?giocatore=<codice>   le classifiche di oggi, di sempre, delle regioni
//   POST   /classifica/<gioco>                      una partita: { giocatore, nome: [c, a, n], regione, seme, giorno, partita }
//   DELETE /classifica/giocatore/<codice>           toglie il giocatore da tutte le classifiche
// db: { esegui(sql, parametri), tutte(sql, parametri) }, entrambe asincrone.
import { punteggio, eRifiutata, GIOCHI } from './verifica.js';
import { nome as nomeDa, regioneValida } from '../../giochi/comune/nomi.js';
import { semeDelGiorno, giornoPrima } from '../../giochi/comune/premi.js';

const QUANTI = 10;
const GIORNI_TENUTI = 60;
const CODICE = /^[a-f0-9]{16,32}$/;

const giorniPrima = (g, n) => { let x = g; for (let i = 0; i < n; i++) x = giornoPrima(x); return x; };

/** Limiti di frequenza tenuti solo in memoria (niente indirizzi salvati). */
function limitatore(max, finestra) {
  const visti = new Map();
  return (chiave, ora) => {
    const v = visti.get(chiave);
    if (!v || ora - v[0] > finestra) { visti.set(chiave, [ora, 1]); if (visti.size > 20000) visti.clear(); return false; }
    v[1] += 1;
    return v[1] > max;
  };
}

export function crea({ db, adesso = () => new Date() }) {
  const troppeLetture = limitatore(120, 60_000), troppiInvii = limitatore(20, 60_000), ultimoInvio = new Map();

  async function classifiche(gioco, giocatore, oggi) {
    const elenco = (righe) => righe.map((r, i) => ({ posizione: i + 1, nome: r.nome, regione: r.regione, punti: r.punti }));
    const [oggiR, sempreR, regioniR] = await Promise.all([
      db.tutte('SELECT nome, regione, punti FROM giornate WHERE gioco = ? AND giorno = ? ORDER BY punti DESC, quando ASC LIMIT ?', [gioco, oggi, QUANTI]),
      db.tutte('SELECT nome, regione, punti FROM migliori WHERE gioco = ? ORDER BY punti DESC, quando ASC LIMIT ?', [gioco, QUANTI]),
      db.tutte(`SELECT regione, COUNT(*) AS giocatori, CAST(ROUND(AVG(m)) AS INTEGER) AS media, MAX(m) AS migliore
        FROM (SELECT giocatore, regione, MAX(punti) AS m FROM giornate WHERE gioco = ? AND giorno >= ? AND regione <> '' GROUP BY giocatore, regione)
        GROUP BY regione HAVING COUNT(*) >= 3 ORDER BY media DESC`, [gioco, giorniPrima(oggi, 6)]),
    ]);
    const r = { giorno: oggi, oggi: elenco(oggiR), sempre: elenco(sempreR), regioni: regioniR.map((x) => ({ ...x })), tu: null };
    if (giocatore) {
      const [mioOggi] = await db.tutte('SELECT punti FROM giornate WHERE gioco = ? AND giorno = ? AND giocatore = ?', [gioco, oggi, giocatore]);
      const [mioSempre] = await db.tutte('SELECT punti FROM migliori WHERE gioco = ? AND giocatore = ?', [gioco, giocatore]);
      const posto = async (tab, extra, p) => (await db.tutte(`SELECT COUNT(*) + 1 AS p FROM ${tab} WHERE gioco = ? ${extra} AND punti > ?`, p))[0].p;
      r.tu = {
        oggi: mioOggi ? { punti: mioOggi.punti, posizione: await posto('giornate', 'AND giorno = ?', [gioco, oggi, mioOggi.punti]) } : null,
        sempre: mioSempre ? { punti: mioSempre.punti, posizione: await posto('migliori', '', [gioco, mioSempre.punti]) } : null,
      };
      const [conti] = await db.tutte('SELECT (SELECT COUNT(*) FROM giornate WHERE gioco = ? AND giorno = ?) AS oggi, (SELECT COUNT(*) FROM migliori WHERE gioco = ?) AS sempre', [gioco, oggi, gioco]);
      r.giocatori = { oggi: conti.oggi, sempre: conti.sempre };
    }
    return r;
  }

  async function invia(gioco, b, ora) {
    if (!b || typeof b !== 'object') return [400, { errore: 'richiesta non valida' }];
    if (!CODICE.test(String(b.giocatore || ''))) return [400, { errore: 'codice giocatore non valido' }];
    const nome = nomeDa(b.nome);
    if (!nome) return [400, { errore: 'nome non valido' }];
    const seme = String(b.seme || '').replace(/[^\w-]/g, '').slice(0, 24);
    if (!seme) return [400, { errore: 'seme mancante' }];
    const prima = ultimoInvio.get(b.giocatore) || 0;
    if (ora - prima < 3000) return [429, { errore: 'una partita alla volta' }];
    let punti;
    try { punti = punteggio(gioco, b.partita, seme); } catch (e) { if (eRifiutata(e)) return [422, { errore: `partita non valida: ${e.message}` }]; throw e; }
    ultimoInvio.set(b.giocatore, ora);
    if (ultimoInvio.size > 50000) ultimoInvio.clear();
    const oggi = semeDelGiorno(adesso()), quando = adesso().toISOString(), regione = regioneValida(b.regione);
    const delGiorno = b.giorno === true && (seme === oggi || seme === giornoPrima(oggi)); // una partita iniziata prima di mezzanotte vale per il suo giorno
    if (delGiorno) {
      await db.esegui(`INSERT INTO giornate (gioco, giorno, giocatore, nome, regione, punti, quando) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (gioco, giorno, giocatore) DO UPDATE SET nome = excluded.nome, regione = excluded.regione,
        quando = CASE WHEN excluded.punti > punti THEN excluded.quando ELSE quando END, punti = MAX(punti, excluded.punti)`, [gioco, seme, b.giocatore, nome, regione, punti, quando]);
    }
    await db.esegui(`INSERT INTO migliori (gioco, giocatore, nome, regione, punti, quando) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (gioco, giocatore) DO UPDATE SET nome = excluded.nome, regione = excluded.regione,
      quando = CASE WHEN excluded.punti > punti THEN excluded.quando ELSE quando END, punti = MAX(punti, excluded.punti)`, [gioco, b.giocatore, nome, regione, punti, quando]);
    // il nome e la regione valgono per tutte le classifiche del giocatore
    await db.esegui('UPDATE giornate SET nome = ?, regione = ? WHERE giocatore = ?', [nome, regione, b.giocatore]);
    await db.esegui('UPDATE migliori SET nome = ?, regione = ? WHERE giocatore = ?', [nome, regione, b.giocatore]);
    if (Math.random() < 0.02) await db.esegui('DELETE FROM giornate WHERE giorno < ?', [giorniPrima(oggi, GIORNI_TENUTI)]);
    return [200, { ok: true, punti, delGiorno, ...(await classifiche(gioco, b.giocatore, delGiorno ? seme : oggi)) }];
  }

  /** richiesta: { metodo, percorso, query: URLSearchParams, corpo (testo), ip } → [stato, corpo] */
  return async function gestisci({ metodo, percorso, query, corpo, ip }) {
    const ora = adesso().getTime();
    if (metodo === 'GET' && percorso === '/salute') return [200, { ok: true }];
    const pezzi = percorso.split('/').filter(Boolean);
    if (pezzi[0] !== 'classifica') return [404, { errore: 'non trovato' }];
    if (metodo === 'DELETE' && pezzi[1] === 'giocatore' && CODICE.test(pezzi[2] || '')) {
      if (troppiInvii(ip, ora)) return [429, { errore: 'troppe richieste' }];
      await db.esegui('DELETE FROM giornate WHERE giocatore = ?', [pezzi[2]]);
      await db.esegui('DELETE FROM migliori WHERE giocatore = ?', [pezzi[2]]);
      return [200, { ok: true }];
    }
    const gioco = pezzi[1];
    if (!GIOCHI.includes(gioco) || pezzi.length !== 2) return [404, { errore: 'gioco sconosciuto' }];
    if (metodo === 'GET') {
      if (troppeLetture(ip, ora)) return [429, { errore: 'troppe richieste' }];
      const g = query.get('giocatore') || '';
      return [200, await classifiche(gioco, CODICE.test(g) ? g : null, semeDelGiorno(adesso()))];
    }
    if (metodo === 'POST') {
      if (troppiInvii(ip, ora)) return [429, { errore: 'troppe richieste' }];
      if ((corpo || '').length > 20000) return [413, { errore: 'troppo grande' }];
      let b;
      try { b = JSON.parse(corpo || ''); } catch { return [400, { errore: 'JSON non valido' }]; }
      return invia(gioco, b, ora);
    }
    return [405, { errore: 'metodo non consentito' }];
  };
}

export const INTESTAZIONI = {
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
  'x-content-type-options': 'nosniff',
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
};

/** L'origine ammessa: il sito, le prove in locale; con ORIGINI vuoto, tutte. */
export function origine(richiesta, consentite) {
  if (!consentite) return '*';
  const elenco = consentite.split(',').map((s) => s.trim());
  if (elenco.includes(richiesta) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(richiesta || '')) return richiesta;
  return elenco[0];
}
