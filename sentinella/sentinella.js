// Sentinella delle regole: rilegge le fonti ufficiali su cui poggiano le regole
// dei tre strumenti e segnala quando qualcosa cambia. Le funzioni qui sono pure
// (testabili senza rete); la lettura dal web è in scripts/sentinella.mjs.
//
// Cosa segnala:
// - pagine di fonte cambiate, con gli importi in euro comparsi o spariti;
// - link rotti o non più leggibili;
// - nuove circolari e messaggi (INPS, Gazzetta Ufficiale) con parole chiave;
// - regole verificate da troppo tempo e revisioni annuali in arrivo.

import { createHash } from 'node:crypto';
import { PRESTAZIONI } from '../mi-spetta/src/prestazioni/index.js';
import { FONTI as FONTI_MULTE, VERIFICATO as VER_MULTE } from '../faccio-ricorso/src/regole.js';
import { FONTI as FONTI_ATTI, VERIFICATO as VER_ATTI } from '../chiedo-gli-atti/src/regole.js';

export const AGENTE = 'AgentiCivici-Sentinella/1.0 (controllo settimanale delle fonti normative; rispetta robots.txt)';
// Ci fermiamo davanti a un divieto rivolto a uno qualsiasi di questi agenti,
// anche se il divieto riguarda solo gli agenti di Anthropic.
export const AGENTI_ROBOTS = ['agenticivici-sentinella', 'claudebot', 'claude-user', 'claude-searchbot', 'anthropic-ai'];

// Il feed della Gazzetta ha solo l'ultimo numero: va letto ogni giorno
// (npm run sentinella -- --solo-feed); quello INPS copre circa tre mesi.
export const FEED = [
  { id: 'inps-messaggi', nome: 'INPS, circolari e messaggi', url: 'https://www.inps.it/it/it.rss.messaggi.xml' },
  { id: 'gu-serie-generale', nome: 'Gazzetta Ufficiale, serie generale', url: 'https://www.gazzettaufficiale.it/rss/SG' },
];

// Le parole che fanno pensare a una regola dei nostri strumenti. Corte e
// specifiche: meglio qualche segnalazione in più che una circolare persa.
export const PAROLE_CHIAVE = [
  ['Mi spetta', ['assegno unico', 'assegno di inclusione', 'supporto per la formazione', 'isee', 'assegno sociale', 'quattordicesima', 'rivalutazione', 'bonus nuovi nati', 'bonus asilo', 'bonus sociale', 'bonus psicologo', 'carta dedicata', 'social card', 'carta acquisti', 'pensione minima', 'maggiorazione sociale', 'esenzione', 'canone rai', 'canone tv', 'detrazione', 'congedo parentale', 'naspi', 'disoccupazione', 'invalidità', 'accompagnamento', 'assegno di maternità']],
  ['Faccio ricorso?', ['codice della strada', 'sanzioni amministrative pecuniarie', 'autovelox', 'misuratori di velocità', 'rilevamento della velocità', 'contributo unificato', 'giudice di pace', 'notificazione', 'zone a traffico limitato', 'patente a punti']],
  ['Chiedo gli atti', ['accesso civico', 'accesso generalizzato', 'accesso ai documenti', 'trasparenza', 'decreto legislativo 14 marzo 2013, n. 33', 'legge 7 agosto 1990, n. 241', 'difensore civico', 'amministrazione digitale']],
];

const giorno = (d) => d.toISOString().slice(0, 10);
const giorniTra = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

/** Tutte le fonti citate dagli strumenti, una volta sola, con chi le usa. */
export function raccogliFonti() {
  const m = new Map();
  const metti = (url, titolo, strumento, regola, verificato) => {
    if (!url) return;
    const x = m.get(url) || { url, titolo, usi: [], verificato };
    if (!x.usi.includes(`${strumento}: ${regola}`)) x.usi.push(`${strumento}: ${regola}`);
    if (verificato && (!x.verificato || verificato < x.verificato)) x.verificato = verificato;
    m.set(url, x);
  };
  for (const p of PRESTAZIONI) {
    for (const f of p.fonti || []) metti(f.url, f.titolo, 'Mi spetta', p.nome, p.verificato);
    if (p.come?.link) metti(p.come.link, `Come chiedere: ${p.nome}`, 'Mi spetta', p.nome, p.verificato);
  }
  for (const f of Object.values(FONTI_MULTE)) metti(f.url, f.titolo, 'Faccio ricorso?', 'regole', VER_MULTE);
  for (const f of Object.values(FONTI_ATTI)) metti(f.url, f.titolo, 'Chiedo gli atti', 'regole', VER_ATTI);
  return [...m.values()];
}

// ---------- robots.txt ----------

/** Legge un robots.txt in gruppi {agenti, regole:[{tipo, percorso}]}. */
export function leggiRobots(testo) {
  const gruppi = [];
  let corrente = null;
  let ultimoAgente = false;
  for (const grezza of String(testo || '').split(/\r?\n/)) {
    const riga = grezza.replace(/#.*/, '').trim();
    const m = riga.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const campo = m[1].toLowerCase();
    const valore = m[2].trim();
    if (campo === 'user-agent') {
      if (!corrente || !ultimoAgente) { corrente = { agenti: [], regole: [] }; gruppi.push(corrente); }
      corrente.agenti.push(valore.toLowerCase());
      ultimoAgente = true;
    } else if (campo === 'allow' || campo === 'disallow') {
      ultimoAgente = false;
      if (corrente) corrente.regole.push({ tipo: campo, percorso: valore });
    } else {
      ultimoAgente = false;
    }
  }
  return gruppi;
}

function corrisponde(percorso, regola) {
  if (!regola) return false;
  const esatto = regola.endsWith('$');
  const corpo = (esatto ? regola.slice(0, -1) : regola).split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp('^' + corpo + (esatto ? '$' : '')).test(percorso);
}

/** Vale per un agente: il gruppo che lo nomina, altrimenti quello «*». Vince la regola più lunga; a parità, Allow. */
function consentitoPer(gruppi, agente, percorso) {
  let gruppo = gruppi.filter((g) => g.agenti.some((a) => a !== '*' && agente.includes(a)));
  if (!gruppo.length) gruppo = gruppi.filter((g) => g.agenti.includes('*'));
  const regole = gruppo.flatMap((g) => g.regole).filter((r) => r.percorso !== '' || r.tipo === 'allow');
  let migliore = null;
  for (const r of regole) {
    if (!corrisponde(percorso, r.percorso)) continue;
    if (!migliore || r.percorso.length > migliore.percorso.length || (r.percorso.length === migliore.percorso.length && r.tipo === 'allow')) migliore = r;
  }
  return !migliore || migliore.tipo === 'allow';
}

/** Consentito solo se nessuno degli agenti che rispettiamo trova un divieto. */
export function robotsConsente(testoRobots, url, agenti = AGENTI_ROBOTS) {
  const u = new URL(url);
  const percorso = u.pathname + u.search;
  const gruppi = leggiRobots(testoRobots);
  return agenti.every((a) => consentitoPer(gruppi, a, percorso));
}

// ---------- contenuto delle pagine ----------

const ENTITA = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', euro: '€', egrave: 'è', eacute: 'é', agrave: 'à', ograve: 'ò', ugrave: 'ù', igrave: 'ì' };

/** Il testo visibile di una pagina, senza script, stili, menu e spazi superflui. */
export function testoVisibile(html) {
  let t = String(html || '');
  const corpo = t.match(/<main[\s\S]*?<\/main>/i) || t.match(/<article[\s\S]*?<\/article>/i);
  if (corpo) t = corpo[0];
  return t
    .replace(/<(script|style|noscript|svg|nav|header|footer|form|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&([a-z]+);/gi, (x, n) => ENTITA[n.toLowerCase()] ?? x)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Gli importi in euro citati nel testo, normalizzati (es. «1.234,56 €» → «1234.56»). */
export function importi(testo) {
  const trovati = new Set();
  const re = /(?:€\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?))|(?:(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:€|euro\b))/gi;
  for (const m of String(testo).matchAll(re)) {
    const n = (m[1] || m[2]).replace(/\./g, '').replace(',', '.');
    trovati.add(String(Number(n)));
  }
  return [...trovati].sort((a, b) => a - b);
}

// Pagine che rispondono «200» ma non mostrano la fonte: errori temporanei e
// controlli anti-bot. Non si aggirano: si segnalano per un controllo a mano.
const NON_LEGGIBILE = /enable cookies|browser validation|verify you are human|captcha|access denied|request rejected|non è momentaneamente disponibile|pagina non trovata|page not found|servizio non disponibile/i;

/** Perché un testo non è la fonte attesa, oppure null se sembra a posto. */
export function nonLeggibile(testo) {
  const t = String(testo || '');
  if (t.length < 1500 && NON_LEGGIBILE.test(t)) return t.slice(0, 120);
  return null;
}

export const impronta = (testo) => createHash('sha256').update(testo).digest('hex').slice(0, 16);

/**
 * Le parole di un testo come impronte brevi: bastano a misurare quanto cambia
 * una pagina senza conservarne il testo (lo stato è pubblico su GitHub).
 */
export const parole = (testo) => [...new Set(String(testo).split(' ').filter(Boolean).map((w) => createHash('sha256').update(w).digest('hex').slice(0, 6)))].sort();

/** Quanto è cambiato un testo, in parole: 0 identico, 1 tutto diverso. Accetta testi o elenchi di parole. */
export function quotaCambiata(prima, dopo) {
  const a = new Set(Array.isArray(prima) ? prima : String(prima).split(' '));
  const b = new Set(Array.isArray(dopo) ? dopo : String(dopo).split(' '));
  const uniti = new Set([...a, ...b]);
  if (!uniti.size) return 0;
  let comuni = 0;
  for (const w of a) if (b.has(w)) comuni++;
  return 1 - comuni / uniti.size;
}

/** Confronta la lettura di oggi con quella precedente di una fonte. */
export function confronta(prima, ora) {
  if (!ora.ok) return { esito: ora.bloccata ? 'bloccata' : ora.illeggibile ? 'illeggibile' : 'rotta', dettaglio: ora.errore || `HTTP ${ora.stato}` };
  if (!prima?.impronta) return { esito: 'nuova' };
  if (prima.impronta === ora.impronta) return { esito: 'uguale' };
  const comparsi = (ora.importi || []).filter((x) => !(prima.importi || []).includes(x));
  const spariti = (prima.importi || []).filter((x) => !(ora.importi || []).includes(x));
  const pa = prima.parole || (prima.testo ? parole(prima.testo) : null);
  const pb = ora.parole || (ora.testo ? parole(ora.testo) : null);
  const quota = pa?.length && pb?.length ? quotaCambiata(pa, pb) : null;
  // Sotto il 2% di parole diverse e senza importi toccati è quasi sempre una data o un contatore.
  const minore = quota !== null && quota < 0.02 && !comparsi.length && !spariti.length;
  return { esito: minore ? 'ritocco' : 'cambiata', quota, comparsi, spariti };
}

// ---------- feed RSS ----------

/** Le voci di un feed RSS o Atom: {id, titolo, link, data, testo}. */
export function vociFeed(xml) {
  const voci = [];
  const pulisci = (s) => testoVisibile(String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'));
  for (const m of String(xml).matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)) {
    const v = m[0];
    const campo = (nome) => (v.match(new RegExp(`<${nome}\\b[^>]*>([\\s\\S]*?)</${nome}>`, 'i')) || [])[1];
    const link = campo('link') || (v.match(/<link\b[^>]*href="([^"]+)"/i) || [])[1];
    const titolo = pulisci(campo('title'));
    voci.push({
      id: pulisci(campo('guid') || campo('id') || link || titolo),
      titolo,
      link: pulisci(link),
      data: pulisci(campo('pubDate') || campo('updated') || campo('dc:date')),
      testo: pulisci(campo('description') || campo('content:encoded') || campo('summary')).slice(0, 400),
    });
  }
  return voci;
}

/** Per quali strumenti una voce di feed è interessante, e per quali parole. */
export function pertinenza(voce, parole = PAROLE_CHIAVE) {
  const t = `${voce.titolo} ${voce.testo}`.toLowerCase();
  const esito = [];
  for (const [strumento, elenco] of parole) {
    const trovate = elenco.filter((p) => t.includes(p));
    if (trovate.length) esito.push({ strumento, parole: trovate });
  }
  return esito;
}

// ---------- revisioni a calendario ----------

/**
 * Cosa va ricontrollato a prescindere dalle pagine: regole verificate da
 * troppo tempo e scadenze ricorrenti dell'anno (rivalutazioni, nuove tabelle).
 */
export function revisioni(oggi, { verificati = { 'Mi spetta': PRESTAZIONI.map((p) => p.verificato).filter(Boolean).sort()[0], 'Faccio ricorso?': VER_MULTE, 'Chiedo gli atti': VER_ATTI }, maxGiorni = 120 } = {}) {
  const d = new Date(oggi + 'T00:00:00Z');
  const anno = d.getUTCFullYear();
  const mese = d.getUTCMonth() + 1;
  const elenco = [];
  for (const [strumento, v] of Object.entries(verificati)) {
    const g = giorniTra(v, oggi);
    if (g > maxGiorni) elenco.push({ strumento, urgenza: 'alta', titolo: `Regole verificate l'ultima volta ${g} giorni fa (${v})`, cosa: 'Rileggere le fonti e aggiornare la data VERIFICATO.' });
  }
  // L'anno delle regole di Mi spetta è nel nome della tabella AUU e nelle soglie.
  const annoRegole = Number(String(verificati['Mi spetta'] || '').slice(0, 4)) || anno;
  if (anno > annoRegole || (mese === 12 && anno === annoRegole)) {
    const prossimo = anno > annoRegole ? anno : anno + 1;
    elenco.push(
      { strumento: 'Mi spetta', urgenza: anno > annoRegole ? 'alta' : 'media', titolo: `Rivalutazione ${prossimo}: pensioni minime, assegno sociale, maggiorazioni`, cosa: `Circolare INPS di rinnovo delle pensioni per il ${prossimo} (di solito a gennaio): aggiornare importi e limiti di reddito.` },
      { strumento: 'Mi spetta', urgenza: anno > annoRegole ? 'alta' : 'media', titolo: `Assegno unico ${prossimo}: nuova tabella degli importi per fascia ISEE`, cosa: `Circolare INPS di gennaio-febbraio ${prossimo}: sostituire src/dati/auu-${annoRegole}.js.` },
      { strumento: 'Mi spetta', urgenza: 'media', titolo: `Soglie ${prossimo} di bonus sociale, ADI e detrazioni`, cosa: 'ARERA (bonus sociale), INPS (ADI e SFL), legge di bilancio (detrazioni).' },
    );
  }
  if (mese === 12 || mese === 1) {
    elenco.push({ strumento: 'Faccio ricorso?', urgenza: 'media', titolo: 'Aggiornamento biennale delle sanzioni del Codice della Strada', cosa: 'Verificare se è uscito il decreto di adeguamento ISTAT (art. 195, comma 3) e aggiornare gli importi di esempio.' });
  }
  return elenco;
}

/** Il rapporto della settimana, in Markdown semplice. */
export function rapporto({ oggi, fonti, feed, revisioni: rev, letteIl }) {
  const per = (e) => fonti.filter((f) => f.confronto.esito === e);
  const righe = [`# Sentinella delle regole, ${oggi}`, ''];
  const cambiate = per('cambiata');
  const problemi = [...per('rotta'), ...per('bloccata'), ...per('illeggibile')];
  const rotte = problemi.filter((f) => !f.confronto.ripetuto);
  const ancora = problemi.filter((f) => f.confronto.ripetuto);
  const nuoveVoci = feed.flatMap((f) => f.nuove.map((v) => ({ ...v, feed: f.nome })));
  righe.push(`Fonti controllate: ${fonti.length}. Cambiate: ${cambiate.length}. Da sistemare: ${rotte.length}${ancora.length ? ` (più ${ancora.length} già segnalate)` : ''}. Novità nei feed: ${nuoveVoci.length}. Revisioni: ${rev.length}.`, '');
  if (cambiate.length) {
    righe.push('## Fonti cambiate', '');
    for (const f of cambiate) {
      const c = f.confronto;
      righe.push(`- **${f.titolo}** (${Math.round((c.quota ?? 1) * 100)}% di parole diverse)${c.comparsi?.length ? `. Importi nuovi: ${c.comparsi.join(', ')} €` : ''}${c.spariti?.length ? `. Importi spariti: ${c.spariti.join(', ')} €` : ''}`);
      righe.push(`  ${f.url}`, `  Usata da: ${f.usi.join('; ')}`);
    }
    righe.push('');
  }
  if (rotte.length) {
    righe.push('## Fonti da sistemare', '');
    const perche = (c) => (c.esito === 'bloccata' ? 'vietata da robots.txt: controllare a mano' : c.esito === 'illeggibile' ? `la pagina mostra «${c.dettaglio}»: controllare a mano` : c.dettaglio);
    for (const f of rotte) righe.push(`- **${f.titolo}**: ${perche(f.confronto)}`, `  ${f.url}`, `  Usata da: ${f.usi.join('; ')}`);
    righe.push('');
  }
  if (ancora.length) {
    righe.push('## Ancora da controllare a mano (già segnalate)', '');
    for (const f of ancora) righe.push(`- ${f.titolo}: ${f.confronto.esito === 'illeggibile' ? 'pagina non leggibile in automatico' : f.confronto.dettaglio}. ${f.url}`);
    righe.push('');
  }
  if (nuoveVoci.length) {
    righe.push('## Nuove circolari e atti da guardare', '');
    for (const v of nuoveVoci) righe.push(`- ${v.feed}: **${v.titolo}** (${v.pertinenza.map((p) => `${p.strumento}: ${p.parole.join(', ')}`).join('; ')})`, ...(v.testo ? [`  ${v.testo.slice(0, 240)}`] : []), `  ${v.link}`);
    righe.push('');
  }
  if (rev.length) {
    righe.push('## Revisioni a calendario', '');
    for (const r of rev) righe.push(`- [${r.urgenza}] ${r.strumento}: **${r.titolo}**. ${r.cosa}`);
    righe.push('');
  }
  const ferme = feed.filter((f) => !f.ok);
  if (ferme.length) righe.push('## Feed non letti', '', ...ferme.map((f) => `- ${f.nome}: ${f.errore}`), '');
  righe.push(`Letto il ${letteIl || oggi}. Le pagine marcate «ritocco» (meno del 2% di parole diverse, nessun importo toccato) non sono elencate.`);
  return righe.join('\n');
}

export { giorno };
