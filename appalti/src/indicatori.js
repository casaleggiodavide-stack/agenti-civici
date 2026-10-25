// Red flag sugli appalti: cosa misura ogni indicatore, quando accenderlo e su quale fonte si basa.
// Un segnale non è un illecito: indica una procedura da guardare meglio, chiedendo gli atti.

export const VERIFICATO = '2026-10-25';

export const FONTI = {
  anac: { titolo: 'ANAC, dati aperti della Banca dati nazionale dei contratti pubblici (CC BY-SA 4.0)', url: 'https://dati.anticorruzione.it/opendata' },
  ocp: { titolo: 'Open Contracting Partnership, Red Flags in Public Procurement (2024)', url: 'https://www.open-contracting.org/wp-content/uploads/2024/12/OCP2024-RedFlagProcurement-1.pdf' },
  cardinal: { titolo: 'Cardinal, libreria aperta di indicatori di rischio negli appalti', url: 'https://cardinal.readthedocs.io/en/latest/' },
  anac_indicatori: { titolo: 'ANAC, Indicatori di rischio corruttivo negli appalti', url: 'https://www.anticorruzione.it/documents/91439/39343313/Scheda_INDICATORI_RISCHIO_CORRUTTIVO_APPALTI.pdf/ea4ddb99-bbb1-7000-29cf-280a853bbb0c?t=1658141962383' },
  art50: { titolo: 'D.lgs. 36/2023, art. 50: affidamenti sotto soglia (diretti fino a 140.000 euro per servizi e forniture, 150.000 per lavori)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2023-03-31;36~art50' },
  art14: { titolo: 'D.lgs. 36/2023, art. 14: soglie europee e divieto di frazionare gli appalti', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2023-03-31;36~art14' },
  art71: { titolo: 'D.lgs. 36/2023, art. 71: almeno 30 giorni per le offerte nella procedura aperta', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2023-03-31;36~art71' },
  art49: { titolo: 'D.lgs. 36/2023, art. 49: principio di rotazione degli affidamenti', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2023-03-31;36~art49' },
  inhouse: { titolo: 'D.lgs. 36/2023, art. 7: affidamenti a società in house', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2023-03-31;36~art7' },
  soglie_ue: { titolo: 'Regolamento delegato (UE) 2025/2152: soglie europee dal 1° gennaio 2026', url: 'https://eur-lex.europa.eu/eli/reg_del/2025/2152/oj' },
};

/**
 * Gli indicatori, nell'ordine in cui si mostrano. `quota` è la percentuale calcolata sui dati,
 * `pct` la posizione tra gli enti simili (0-100), `mediana` il valore tipico degli enti simili.
 */
export const INDICATORI = [
  {
    id: 'senza_gara', codice: 'OCP R013 · ANAC 3',
    nome: 'Soldi spesi senza gara',
    misura: (v) => `${fmt(v.quota)} del valore (${v.quota_n !== undefined ? `${fmt(v.quota_n)} delle procedure` : ''}) è andato in affidamenti diretti, senza confronto tra imprese`,
    perche: 'L\'affidamento diretto è lecito sotto le soglie di legge e rende gli acquisti piccoli più rapidi. Ma se diventa la regola anche per somme alte, la concorrenza sparisce e il rischio di favoritismi cresce. Gli affidamenti a società controllate dall\'ente (in house) sono contati a parte.',
    fonti: ['art50', 'ocp', 'anac_indicatori'],
  },
  {
    id: 'un_offerente', codice: 'OCP R018 · ANAC 9',
    nome: 'Gare con una sola offerta',
    misura: (v) => `${fmt(v.quota)} delle gare con il numero di offerte noto (${v.n} su ${v.base}) ha ricevuto una sola offerta`,
    perche: 'Una gara serve a far competere più imprese. Se arriva una sola offerta il prezzo non è messo alla prova: può dipendere da un mercato piccolo, da requisiti troppo stretti o da un bando cucito su misura.',
    fonti: ['cardinal', 'ocp', 'anac_indicatori'],
    esempi: 'un_offerente',
  },
  {
    id: 'primo_fornitore', codice: 'OCP R040 · ANAC 13',
    nome: 'Quanto pesa il primo fornitore',
    misura: (v) => `il primo fornitore ha ricevuto ${fmt(v.quota)} del valore aggiudicato, su ${v.fornitori} fornitori in tutto`,
    perche: 'Quando una sola impresa prende gran parte dei contratti dell\'ente, vale la pena capire perché: può essere una società di servizi dell\'ente stesso, un mercato con pochi operatori o il mancato rispetto della rotazione.',
    fonti: ['ocp', 'art49'],
  },
  {
    id: 'sotto_soglia', codice: 'OCP R011',
    nome: 'Affidamenti diretti appena sotto la soglia',
    misura: (v) => `${v.n} affidamenti diretti su ${v.base} (${fmt(v.quota)}) valgono tra il 95% e il 100% della soglia oltre la quale servirebbe una gara`,
    perche: 'Un importo fissato appena sotto i 140.000 euro (150.000 per i lavori) può essere una coincidenza, oppure il modo di evitare la gara. La legge vieta di dividere un appalto per restare sotto la soglia.',
    fonti: ['art50', 'art14', 'ocp'],
    esempi: 'sotto_soglia',
  },
  {
    id: 'cumulo', codice: 'OCP R055',
    nome: 'Più affidamenti diretti allo stesso fornitore',
    misura: (v) => v.n ? `${v.n} ${v.n === 1 ? 'fornitore ha' : 'fornitori hanno'} ricevuto due o più affidamenti diretti che, sommati, superano la soglia della gara` : 'nessun fornitore ha ricevuto affidamenti diretti che, sommati, superano la soglia',
    perche: 'Ogni affidamento può essere regolare, ma la somma dice che con quel fornitore l\'ente ha speso più di quanto si può affidare senza gara. Va verificato che si tratti di acquisti davvero diversi e che la rotazione sia rispettata.',
    fonti: ['art49', 'art14', 'ocp'],
    esempi: 'cumulo',
  },
  {
    id: 'tempi_brevi', codice: 'Cardinal R003 · ANAC 14',
    nome: 'Tempi stretti per presentare le offerte',
    misura: (v) => `${v.n} procedure aperte sopra la soglia europea su ${v.base} hanno dato meno di 30 giorni per le offerte (15 se urgenti); a metà delle procedure sono stati dati almeno ${v.mediana_giorni} giorni`,
    perche: 'Pochi giorni favoriscono chi sapeva della gara in anticipo. La legge chiede almeno 30 giorni nelle procedure aperte sopra la soglia europea, 15 con preinformazione o urgenza motivata. Attenzione: la data di pubblicazione registrata in ANAC può essere successiva a quella del bando.',
    fonti: ['art71', 'cardinal', 'soglie_ue'],
    esempi: 'tempi_brevi',
  },
  {
    id: 'esclusi', codice: 'Cardinal R035 · ANAC 11',
    nome: 'Una sola offerta ammessa, le altre escluse',
    misura: (v) => `in ${v.n} gare su ${v.base} (${fmt(v.quota)}) è rimasta in gara una sola offerta, quella vincente, e almeno un'altra è stata esclusa`,
    perche: 'Escludere tutte le offerte tranne una può essere corretto, se erano irregolari, ma è anche un modo per scegliere il vincitore. Sono le gare per cui vale la pena leggere il verbale di esclusione.',
    fonti: ['cardinal', 'anac_indicatori'],
    esempi: 'esclusi',
  },
];

const fmt = (n) => `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(n)}%`;

/**
 * Livello del segnale rispetto agli enti simili, come fa ANAC (red flag oltre il 75° percentile).
 * «alto»: oltre il 90% degli enti simili; «medio»: oltre il 75%; «normale»; «pochi»: troppi pochi casi.
 */
export function livello(id, v) {
  if (!v) return 'pochi';
  if (id === 'cumulo') return v.n ? 'basso' : 'normale';
  if (v.pct === undefined || v.pct === null) return v.quota > 0 ? 'nd' : 'normale';
  if (v.quota <= (v.mediana ?? 0)) return 'normale';
  if (v.pct >= 90) return 'alto';
  if (v.pct >= 75) return 'medio';
  return 'normale';
}

export const PAROLE_LIVELLO = {
  alto: ['Molto più alto degli enti simili', 'no'],
  medio: ['Più alto degli enti simili', 'forse'],
  basso: ['Da guardare', 'forse'],
  normale: ['Nella norma', 'si'],
  nd: ['Senza confronto: pochi enti simili', 'neutro'],
  pochi: ['Troppi pochi casi per dirlo', 'neutro'],
};

/** Riepilogo delle procedure, in parole, per la testata della scheda. */
export function procedure(s) {
  const p = s.proc || {};
  const tot = s.v || 1;
  const nomi = { con_bando: 'Gare con bando pubblico', su_invito: 'Gare su invito, senza bando', senza_gara: 'Affidamenti diretti', in_house: 'Affidamenti a società dell\'ente (in house)', altro: 'Adesioni a convenzioni e altre procedure' };
  return Object.entries(nomi).map(([k, nome]) => ({ id: k, nome, n: p[k]?.[0] || 0, v: p[k]?.[1] || 0, quota: (100 * (p[k]?.[1] || 0)) / tot })).filter((x) => x.n);
}

/** Testo pronto per chiedere gli atti di una procedura (accesso civico generalizzato). */
export function richiestaAtti(s, lotto) {
  return `Chiedo, ai sensi dell'art. 5, comma 2, del d.lgs. 33/2013, copia dei seguenti documenti relativi alla procedura CIG ${lotto.cig} («${lotto.oggetto}»): la decisione di contrarre, gli atti di gara o la lettera di invito, i verbali di gara, il provvedimento di aggiudicazione o di affidamento e il contratto.`;
}
