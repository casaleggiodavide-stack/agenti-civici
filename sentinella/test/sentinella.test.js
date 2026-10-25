// La Sentinella senza rete: robots.txt, testo delle pagine, confronto, feed, revisioni.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  raccogliFonti, robotsConsente, testoVisibile, importi, impronta, confronta, nonLeggibile,
  vociFeed, pertinenza, revisioni, rapporto,
} from '../sentinella.js';

test('raccogliFonti: tutte le fonti dei tre strumenti, senza doppioni, con chi le usa', () => {
  const f = raccogliFonti();
  assert.ok(f.length > 40, `trovate ${f.length}`);
  assert.equal(new Set(f.map((x) => x.url)).size, f.length);
  assert.ok(f.every((x) => /^https:\/\//.test(x.url) && x.usi.length));
  assert.ok(f.some((x) => x.usi.some((u) => u.startsWith('Faccio ricorso?'))));
  assert.ok(f.some((x) => x.usi.some((u) => u.startsWith('Chiedo gli atti'))));
  assert.ok(f.some((x) => x.url.includes('art201')));
});

test('robots.txt: rispetta i divieti generali e quelli rivolti solo agli agenti di Anthropic', () => {
  const r = 'User-agent: *\nDisallow: /privato/\nAllow: /privato/pubblico\n\nUser-agent: Googlebot\nDisallow: /';
  assert.equal(robotsConsente(r, 'https://x.it/pagina'), true);
  assert.equal(robotsConsente(r, 'https://x.it/privato/a'), false);
  assert.equal(robotsConsente(r, 'https://x.it/privato/pubblico/b'), true);
  // Un divieto solo per ClaudeBot ferma anche noi.
  assert.equal(robotsConsente('User-agent: ClaudeBot\nDisallow: /', 'https://x.it/'), false);
  assert.equal(robotsConsente('User-agent: anthropic-ai\nUser-agent: GPTBot\nDisallow: /norme', 'https://x.it/norme/1'), false);
  // Gruppi con più agenti, «Disallow:» vuoto, caratteri jolly e fine riga.
  assert.equal(robotsConsente('User-agent: *\nDisallow:', 'https://x.it/a'), true);
  assert.equal(robotsConsente('User-agent: *\nDisallow: /*.pdf$', 'https://x.it/a/b.pdf'), false);
  assert.equal(robotsConsente('User-agent: *\nDisallow: /*.pdf$', 'https://x.it/a/b.pdf?x=1'), true);
  assert.equal(robotsConsente('User-agent: *\nDisallow: /cerca?', 'https://x.it/cerca?q=1'), false);
  assert.equal(robotsConsente('', 'https://x.it/'), true);
});

test('testoVisibile e importi: solo il contenuto, importi normalizzati', () => {
  const html = '<html><head><style>p{}</style><script>var x=1</script></head><body><nav>Menu</nav><main><h1>Assegno sociale</h1><p>Importo 2026: 546,24&nbsp;&euro; al mese, limite 7.101,12 euro. Totale € 1.500.</p></main><footer>Contatti</footer></body></html>';
  const t = testoVisibile(html);
  assert.equal(t, 'Assegno sociale Importo 2026: 546,24 € al mese, limite 7.101,12 euro. Totale € 1.500.');
  assert.deepEqual(importi(t), ['546.24', '1500', '7101.12']);
  assert.equal(impronta(t), impronta(t));
  assert.notEqual(impronta(t), impronta(t + ' '));
});

test('confronta: nuova, uguale, ritocco, cambiata con importi, rotta e bloccata', () => {
  const testo = Array.from({ length: 200 }, (_, i) => `parola${i}`).join(' ');
  const prima = { impronta: 'a', importi: ['546.24'], testo };
  assert.equal(confronta(undefined, { ok: true, impronta: 'a' }).esito, 'nuova');
  assert.equal(confronta(prima, { ok: true, impronta: 'a' }).esito, 'uguale');
  assert.equal(confronta(prima, { ok: true, impronta: 'b', importi: ['546.24'], testo: testo + ' aggiornato' }).esito, 'ritocco');
  const c = confronta(prima, { ok: true, impronta: 'c', importi: ['550.10'], testo: testo + ' aggiornato' });
  assert.equal(c.esito, 'cambiata');
  assert.deepEqual(c.comparsi, ['550.10']);
  assert.deepEqual(c.spariti, ['546.24']);
  assert.equal(confronta(prima, { ok: false, stato: 404 }).esito, 'rotta');
  assert.equal(confronta(prima, { ok: false, bloccata: true }).esito, 'bloccata');
  assert.equal(confronta(prima, { ok: false, illeggibile: true, errore: 'x' }).esito, 'illeggibile');
});

test('nonLeggibile: pagine di errore e controlli anti-bot riconosciuti, fonti vere no', () => {
  assert.ok(nonLeggibile('Please enable cookies This website uses a security service. Browser Validation Page'));
  assert.ok(nonLeggibile('La pagina richiesta non è momentaneamente disponibile! Si prega di riprovare più tardi'));
  assert.equal(nonLeggibile('Assegno sociale. ' + 'Requisiti e importi per il 2026. '.repeat(80) + 'pagina non trovata'), null);
  assert.equal(nonLeggibile('Bonus sociali: informazioni per accedere ai bonus.'), null);
});

test('feed: voci RSS e Atom, pertinenza per strumento', () => {
  const rss = `<rss><channel><item><title><![CDATA[Messaggio n. 3001: Assegno unico, rivalutazione degli importi 2027]]></title><link>https://www.inps.it/m/3001</link><guid>m3001</guid><pubDate>Mon, 18 Jan 2027 10:00:00 GMT</pubDate><description>Importi e soglie ISEE</description></item><item><title>Convegno sulla previdenza</title><link>https://www.inps.it/c</link></item></channel></rss>`;
  const v = vociFeed(rss);
  assert.equal(v.length, 2);
  assert.equal(v[0].id, 'm3001');
  assert.equal(v[0].link, 'https://www.inps.it/m/3001');
  const p = pertinenza(v[0]);
  assert.equal(p[0].strumento, 'Mi spetta');
  assert.ok(p[0].parole.includes('assegno unico') && p[0].parole.includes('isee'));
  assert.deepEqual(pertinenza(v[1]), []);
  const gu = vociFeed('<rss><channel><item><title>DECRETO 16 ottobre 2026</title><link>https://gu.it/2</link><content:encoded>Modifiche   al codice della\nstrada in materia di sanzioni</content:encoded></item></channel></rss>');
  assert.equal(gu[0].testo, 'Modifiche al codice della strada in materia di sanzioni');
  assert.equal(pertinenza(gu[0])[0].strumento, 'Faccio ricorso?');
  const atom = '<feed><entry><title>Decreto sui misuratori di velocità</title><link href="https://gu.it/1"/><id>gu1</id></entry></feed>';
  const a = vociFeed(atom);
  assert.equal(a[0].link, 'https://gu.it/1');
  assert.equal(pertinenza(a[0])[0].strumento, 'Faccio ricorso?');
});

test('revisioni: regole vecchie e rivalutazione di gennaio', () => {
  const verificati = { 'Mi spetta': '2026-10-11', 'Faccio ricorso?': '2026-10-11', 'Chiedo gli atti': '2026-10-11' };
  assert.deepEqual(revisioni('2026-10-25', { verificati }), []);
  const dic = revisioni('2026-12-10', { verificati });
  assert.ok(dic.some((r) => /Rivalutazione 2027/.test(r.titolo) && r.urgenza === 'media'));
  const gen = revisioni('2027-01-20', { verificati });
  assert.ok(gen.some((r) => /Assegno unico 2027/.test(r.titolo) && r.urgenza === 'alta'));
  assert.ok(gen.some((r) => /sanzioni del Codice della Strada/.test(r.titolo)));
  const vecchie = revisioni('2027-03-01', { verificati });
  assert.ok(vecchie.some((r) => r.strumento === 'Chiedo gli atti' && /141 giorni/.test(r.titolo)));
});

test('rapporto: elenca cambiate, rotte e novità, non i ritocchi', () => {
  const t = rapporto({
    oggi: '2027-01-20',
    fonti: [
      { titolo: 'INPS, assegno sociale', url: 'https://inps.it/as', usi: ['Mi spetta: Assegno sociale'], confronto: { esito: 'cambiata', quota: 0.12, comparsi: ['550.1'], spariti: ['546.24'] } },
      { titolo: 'Pagina ritoccata', url: 'https://x.it', usi: ['Mi spetta: X'], confronto: { esito: 'ritocco' } },
      { titolo: 'Pagina sparita', url: 'https://y.it', usi: ['Faccio ricorso?: regole'], confronto: { esito: 'rotta', dettaglio: 'HTTP 404' } },
      { titolo: 'Pagina anti-bot', url: 'https://z.it', usi: ['Mi spetta: Z'], confronto: { esito: 'illeggibile', dettaglio: 'x', ripetuto: true } },
    ],
    feed: [{ nome: 'INPS', ok: true, nuove: [{ titolo: 'Messaggio 3001', link: 'https://inps.it/m', pertinenza: [{ strumento: 'Mi spetta', parole: ['assegno unico'] }] }] }],
    revisioni: [],
  });
  assert.match(t, /Importi nuovi: 550\.1 €/);
  assert.match(t, /HTTP 404/);
  assert.match(t, /Messaggio 3001/);
  assert.doesNotMatch(t, /Pagina ritoccata/);
  assert.match(t, /## Ancora da controllare a mano[\s\S]*Pagina anti-bot/);
  assert.match(t, /Da sistemare: 1 \(più 1 già segnalate\)/);
});
