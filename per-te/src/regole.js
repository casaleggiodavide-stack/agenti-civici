// «Per te»: la scheda che cresce con le risposte. Dal Comune e da poche domande a fasce,
// un riquadro per ogni strumento con il dato che conta, il confronto e il passo da fare.
// Funzioni pure: i dati arrivano dall'interfaccia (per-te/dati, prefetture, difensori civici, motore di Mi spetta).

import { livello } from '../../appalti/src/indicatori.js';

export const VERIFICATO = '2026-11-05';

export const normalizza = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// ---------- le domande ----------

export const FASCE_ETA = [
  ['18-29', 'da 18 a 29', 18, 29], ['30-59', 'da 30 a 59', 30, 59], ['60-64', 'da 60 a 64', 60, 64],
  ['65-69', 'da 65 a 69', 65, 69], ['70-79', 'da 70 a 79', 70, 79], ['80+', '80 o più', 80, 90],
];

/** Fasce ISEE, con le soglie più usate dagli aiuti (9.530 bonus sociale, 15.000, 25.000, 40.000). */
export const FASCE_ISEE = [
  ['nd', 'Non lo so o non ce l\'ho', null, null],
  ['9530', 'fino a 9.530 €', 0, 9530],
  ['15000', 'da 9.531 a 15.000 €', 9531, 15000],
  ['25000', 'da 15.001 a 25.000 €', 15001, 25000],
  ['40000', 'da 25.001 a 40.000 €', 25001, 40000],
  ['oltre', 'oltre 40.000 €', 40001, 80000],
];

export const DOMANDE = [
  { id: 'comune', titolo: 'Dove abiti?', perche: 'Con il Comune trovo chi raccoglie i rifiuti, la Prefettura per le multe, il difensore civico, i conti e gli appalti del Comune e gli aiuti della tua Regione.' },
  { id: 'famiglia', titolo: 'Chi vive in casa con te?', perche: 'Gli aiuti dipendono da chi c\'è nello stato di famiglia: figli, persone anziane, persone con disabilità. Chiedo solo fasce d\'età, mai date o nomi.' },
  { id: 'isee', titolo: 'Più o meno, quanto è il tuo ISEE?', perche: 'Molti aiuti hanno una soglia ISEE. Basta la fascia: con quella separo gli aiuti probabili da quelli che non ti riguardano.' },
];

/** La prossima domanda senza risposta (anche «saltata» conta come risposta). */
export function prossima(p) {
  if (!p.istat) return 'comune';
  if (p.famiglia === undefined) return 'famiglia';
  if (p.isee === undefined) return 'isee';
  return null;
}

// ---------- il territorio ----------

/** Da Regione e sigla all'identificativo delle misure regionali di Mi spetta. */
export function regioneId(regione, sigla) {
  if (/trentino/i.test(regione || '')) return sigla === 'BZ' ? 'bolzano' : 'trento';
  return normalizza(regione).replace(/ /g, '_') || null;
}

/** Il nome della Regione come lo usano i difensori civici (le Province autonome sono a parte). */
export function regioneDifensore(regione, sigla) {
  if (/trentino/i.test(regione || '')) return sigla === 'BZ' ? 'Provincia autonoma di Bolzano' : 'Provincia autonoma di Trento';
  return regione;
}

// Le vecchie province sarde dell'elenco ARERA e la Prefettura che le copre.
const PREFETTURA_SARDA = { VS: 'CA', SU: 'CA', OT: 'SS', OG: 'NU' };

export function prefettura(prefetture, sigla) {
  if (sigla === 'AO') return { nome: 'Presidente della Regione Valle d\'Aosta, struttura Sanzioni amministrative (funzioni prefettizie)', pec: 'sanzioni_amministrative@pec.regione.vda.it' };
  const p = prefetture.find((x) => x.sigla === (PREFETTURA_SARDA[sigla] || sigla));
  return p ? { nome: p.nome, pec: p.pec } : null;
}

/** Prepara l'elenco per la ricerca: [istat, nome, sigla] e la Regione per sigla. */
export function indicizza(dati) {
  return { ...dati, righe: dati.comuni.map(([istat, nome, sigla]) => ({ istat, nome, sigla, regione: dati.regioni[sigla] || '', n: normalizza(nome) })) };
}

// ---------- gli aiuti, con il motore di Mi spetta ----------

const mesiFa = (oggi, mesi) => {
  const d = new Date(oggi.getFullYear(), oggi.getMonth() - mesi, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Età dei figli agli estremi della fascia, in mesi: sotto i 3 anni, da 3 a 17, da 18 a 20.
const FIGLI = { piccoli: [2, 34], minori: [36, 214], grandi: [216, 250] };

/**
 * Le risposte per Mi spetta a un estremo delle fasce («basso» o «alto»): età, età dei figli e ISEE.
 * Le altre domande di Mi spetta restano senza risposta e il motore lo dice.
 */
export function risposteMiSpetta(p, estremo, oggi = new Date()) {
  const k = estremo === 'alto' ? 1 : 0;
  const f = p.famiglia && typeof p.famiglia === 'object' ? p.famiglia : null;
  const r = { regione: regioneId(p.regione, p.sigla) };
  if (f) {
    const eta = FASCE_ETA.find((x) => x[0] === f.eta);
    if (eta) r.eta = eta[2 + k];
    r.coniuge = f.partner === true ? true : f.partner === false ? false : undefined;
    if (r.coniuge && eta) r.coniuge_eta = eta[2 + k];
    r.figli = Object.entries(FIGLI).flatMap(([chi, mesi]) => Array.from({ length: Math.max(0, Math.min(10, Number(f.figli?.[chi]) || 0)) }, () => ({ nascita: mesiFa(oggi, mesi[k]) })));
    r.altri_adulti = Math.max(0, Math.min(10, Number(f.altri) || 0));
    if (r.altri_adulti) r.over60_altri = f.altri60 === true;
    if (f.disabile === true || f.disabile === false) r.disabile_nucleo = f.disabile;
  }
  const isee = FASCE_ISEE.find((x) => x[0] === p.isee);
  if (isee && isee[2] !== null) r.isee = isee[2 + k];
  return r;
}

// Dati che le domande di «Per te» non chiedono. I «comuni» valgono per quasi tutti e si scrivono accanto
// all'aiuto («vale se…»); quelli «da confermare» (redditi, risparmi, ISEE se non lo sai) lo rendono solo possibile.
const COMUNI = new Set(['cittadinanza', 'anni_residenza', 'anni_residenza_regione', 'utenze_intestate', 'sei_madre']);
const DA_CONFERMARE = new Set([...COMUNI, 'isee', 'icef', 'reddito_personale', 'reddito_coniuge', 'reddito_familiare', 'patrimonio_mobiliare', 'altri_immobili']);
const positivo = (e) => e === 'spetta' || e === 'probabile';

/** Come esce un aiuto a un estremo: «si», «comuni» (manca solo un dato comune), «conferma», «no», «altro». */
function stato(r) {
  if (positivo(r.esito)) return 'si';
  if (r.esito === 'manca_dato' && r.mancano.length && r.mancano.length <= 3) {
    if (r.mancano.every((d) => COMUNI.has(d))) return 'comuni';
    if (r.mancano.every((d) => DA_CONFERMARE.has(d))) return 'conferma';
  }
  return r.esito === 'non_spetta' ? 'no' : 'altro';
}
const aperti = (r) => r.requisiti.filter((q) => q.ok === null || q.ok === undefined).map((q) => q.testo);

function importo(a, b) {
  const v = (r) => (r?.importo && !r.importo.nonSommare ? (r.importo.annuo ? [r.importo.annuo, 'l\'anno'] : r.importo.unaTantum ? [r.importo.unaTantum, 'una tantum'] : null) : null);
  const valori = [v(a), v(b)].filter(Boolean);
  if (!valori.length) return a?.importo?.breve || b?.importo?.breve || '';
  const n = valori.map((z) => z[0]);
  const lo = Math.min(...n), hi = Math.max(...n);
  const eu0 = (x) => `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' }).format(x)} €`;
  return Math.round(lo) !== Math.round(hi) ? `da ${eu0(lo)} a ${eu0(hi)} ${valori[0][1]}` : `${eu0(lo)} ${valori[0][1]}`;
}

/** Quante misure nazionali e della Regione guarda Mi spetta. */
export function conta(prestazioni, regione) {
  return { nazionali: prestazioni.filter((x) => !x.regione).length, regionali: prestazioni.filter((x) => x.regione && x.regione === regione).length };
}

/**
 * Gli aiuti per il profilo, valutati con il motore di Mi spetta ai due estremi delle fasce.
 * Probabile: spetta a tutti e due gli estremi. Possibile: spetta a uno solo, oppure manca soltanto un dato da confermare.
 * valuta: la funzione del motore di Mi spetta.
 */
export function aiuti(valuta, p, oggi = new Date()) {
  const A = valuta(risposteMiSpetta(p, 'basso', oggi), { oggi });
  const B = valuta(risposteMiSpetta(p, 'alto', oggi), { oggi });
  const perId = new Map(B.risultati.map((r) => [r.id, r]));
  const probabili = [], possibili = [];
  for (const a of A.risultati) {
    const b = perId.get(a.id);
    if (!b) continue;
    const base = { id: a.id, nome: a.nome, ente: a.ente, regione: a.regione, categoria: a.categoria, sintesi: a.sintesi, automatica: a.automatica, finestra: a.finestra, come: a.come, importo: importo(a, b) };
    const sa = stato(a), sb = stato(b);
    const coppia = [sa, sb];
    const condizioni = [...new Set([...aperti(a), ...aperti(b)])];
    const dipendeIsee = [a, b].some((r) => r.mancano.includes('isee'));
    if (coppia.every((x) => x === 'si' || x === 'comuni')) probabili.push({ ...base, condizioni });
    else if (coppia.every((x) => x === 'si' || x === 'comuni' || x === 'conferma')) possibili.push({ ...base, condizioni, dipendeIsee });
    else if (coppia.includes('no') && coppia.some((x) => x === 'si' || x === 'comuni' || x === 'conferma')) {
      possibili.push({ ...base, condizioni: ['dipende dall\'età o dall\'ISEE esatti, a cavallo della soglia', ...condizioni], dipendeIsee });
    }
  }
  const valore = (x) => (/(\d[\d.]*) €/.exec(x.importo) ? Number(/(\d[\d.]*) €/.exec(x.importo)[1].replace(/\./g, '')) : 0);
  probabili.sort((x, y) => valore(y) - valore(x));
  return { probabili, possibili };
}

/** Le domande ancora aperte vicine: chiudono entro 120 giorni. */
export function scadenze(elenco, oggi = new Date()) {
  const limite = new Date(oggi.getTime() + 120 * 864e5);
  return elenco.filter((x) => x.finestra?.a && new Date(x.finestra.a + 'T23:59:59') >= oggi && new Date(x.finestra.a) <= limite)
    .sort((x, y) => x.finestra.a.localeCompare(y.finestra.a));
}

// ---------- i riquadri ----------

export const GRUPPI = [
  ['scadenze', 'Scadenze vicine'],
  ['soldi', 'Soldi che puoi ricevere'],
  ['diritti', 'Diritti e contatti utili'],
  ['comune', 'Come va il tuo Comune'],
];

/** Prima lettera minuscola, tranne le sigle (ISEE, UE). */
const minuscola = (t) => (/^[A-Z]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));
const eu = (n) => `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' }).format(n)} €`;
const pc = (n) => `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(n)}%`;
const data = (s) => new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
const strumento = (nome, ancora = '', testo = '') => ({ strumento: nome, ancora, testo });
const esterno = (href, testo) => ({ href, testo });

function rifiuti(c, x) {
  if (!x.r?.length) {
    return { id: 'rifiuti', gruppo: 'diritti', etichetta: 'Rifiuti', titolo: 'Chi raccoglie i rifiuti a ' + c.nome, testo: 'Il gestore, il telefono e la pagina del calendario, con i diritti di chi paga la TARI.', azioni: [strumento('raccolta', `istat=${c.istat}`, 'Trova il gestore')] };
  }
  const nomi = x.r.map((g) => g[0]);
  const cal = x.r.find((g) => g[2]);
  const tel = x.r.find((g) => g[1]);
  return {
    id: 'rifiuti', gruppo: 'diritti', etichetta: 'Rifiuti',
    titolo: `Raccoglie ${nomi.length > 1 ? `${nomi.slice(0, -1).join(', ')} e ${nomi.at(-1)}` : nomi[0]}`,
    testo: 'Il gestore deve avere un numero verde gratuito, pubblicare il calendario e ritirare a casa gli ingombranti almeno una volta al mese senza farti pagare, salvo le deroghe dell\'Ente (ARERA, TQRIF e TITR).',
    azioni: [cal ? esterno(cal[2], cal[3] ? 'Il calendario' : 'La raccolta sul sito del gestore') : null, tel ? { tel: tel[1], testo: tel[1] } : null, strumento('raccolta', `istat=${c.istat}`, 'Tutto sulla raccolta')].filter(Boolean),
    fonte: 'ARERA, Ricerca operatori',
  };
}

function bilancio(c, b) {
  const g = b.tempestivita === null || b.tempestivita === undefined || (b.tempestivita >= -60 && b.tempestivita <= 730) ? b.tempestivita : null; // fuori da questi limiti è un errore del rendiconto
  const righe = [];
  if (b.debito_pc !== null && b.debito_pc !== undefined) righe.push(`Debito per mutui e prestiti: ${eu(b.debito_pc)} per abitante${b.med?.debito_pc ? ` (nei Comuni ${b.fascia} la mediana è ${eu(b.med.debito_pc)})` : ''}.`);
  if (b.riscossione !== null && b.riscossione !== undefined) righe.push(`Incassa nell'anno ${pc(b.riscossione)} di tributi, multe e rette accertati${b.med?.riscossione ? ` (mediana ${pc(b.med.riscossione)})` : ''}.`);
  if (b.deficitario) righe.push('Secondo i parametri del Ministero dell\'Interno è in deficit strutturale.');
  else if (b.parametri) righe.push(`${b.parametri} ${b.parametri === 1 ? 'parametro' : 'parametri'} di deficit su 8 fuori soglia: si è in deficit strutturale da 4 in su.`);
  const titolo = g === null || g === undefined ? `Il rendiconto ${b.anno} del Comune`
    : g <= 0 ? `Paga i fornitori in tempo${g < 0 ? `, in media ${Math.round(-g)} giorni prima` : ''}` : `Paga i fornitori in ritardo: in media ${Math.round(g)} giorni dopo la scadenza`;
  return {
    id: 'bilancio', gruppo: 'comune', etichetta: `Bilancio ${b.anno}`, titolo, testo: righe.join(' '),
    tono: b.deficitario ? 'no' : g > 30 ? 'forse' : null,
    azioni: [strumento('bilancio-comune', `istat=${b.istat}`, 'Apri il bilancio')],
    fonte: `Ragioneria Generale dello Stato, OpenBDAP, rendiconto ${b.anno}`,
  };
}

const NOMI_IND = { senza_gara: 'spesa senza gara', un_offerente: 'gare con una sola offerta', primo_fornitore: 'peso del primo fornitore' };

function appalti(a) {
  const segnali = Object.keys(NOMI_IND).filter((k) => ['alto', 'medio'].includes(livello(k, a[k])));
  const sg = a.senza_gara, uo = a.un_offerente;
  const righe = [];
  if (sg) righe.push(`Senza gara il ${pc(sg.quota)} del valore${sg.quota_n !== undefined ? ` (${pc(sg.quota_n)} degli atti)` : ''}; nei Comuni simili la mediana è ${pc(sg.mediana)}.`);
  if (uo && uo.base >= 5) righe.push(`Gare con una sola offerta: ${uo.n} su ${uo.base} (mediana ${pc(uo.mediana)}).`);
  return {
    id: 'appalti', gruppo: 'comune', etichetta: `Appalti ${a.anno || ''}`.trim(),
    titolo: segnali.length ? `${segnali.length === 1 ? 'Un segnale' : `${segnali.length} segnali`} da guardare: ${segnali.map((k) => NOMI_IND[k]).join(', ')}` : `${new Intl.NumberFormat('it-IT').format(a.n)} procedure, nessun segnale`,
    testo: righe.join(' ') + (segnali.length ? ' Un segnale non è un illecito: dice dove chiedere gli atti.' : ''),
    tono: segnali.length ? 'forse' : null,
    azioni: [strumento('appalti', `cf=${a.cf}`, 'Vedi gli appalti')],
    fonte: 'ANAC, Banca dati nazionale dei contratti pubblici',
  };
}

/** Il difensore civico della Regione (o della Provincia autonoma), con i nomi scritti in modi diversi. */
export function trovaDifensore(difensori, regione, sigla) {
  const elenco = Array.isArray(difensori) ? difensori.map((d) => [d.regione, d]) : Object.entries(difensori || {});
  const cercato = /trentino/i.test(regione || '') ? (sigla === 'BZ' ? 'bolzano' : 'trento') : normalizza(regione);
  const hit = elenco.find(([k, d]) => [k, d.regione].some((n) => normalizza(n) === cercato || normalizza(n).endsWith(` ${cercato}`)));
  return hit ? hit[1] : null;
}

function difensoreCivico(c, difensori) {
  const nome = regioneDifensore(c.regione, c.sigla);
  const d = trovaDifensore(difensori, c.regione, c.sigla);
  if (!d || !d.esiste) {
    return { id: 'difensore', gruppo: 'diritti', etichetta: 'Uffici che non rispondono', titolo: `${nome}: difensore civico regionale non in carica`, testo: 'Se un ufficio pubblico non risponde, il sollecito e il titolare del potere sostitutivo restano. Reclami alla PA ti dice il passo giusto.', azioni: [strumento('reclami-pa', '', 'Scrivi un reclamo')] };
  }
  return {
    id: 'difensore', gruppo: 'diritti', etichetta: 'Uffici che non rispondono', titolo: `Il difensore civico ${/^Provincia/.test(nome) ? 'della ' + nome : `regionale (${nome})`}`,
    testo: `Gratis, se un ufficio pubblico non risponde o ti nega un atto.${d.comuni === false ? ' Verso i Comuni interviene solo se c\'è una convenzione.' : ''}${d.pec ? ` PEC: ${d.pec}.` : ''}`,
    azioni: [d.url ? esterno(d.url, 'Il sito') : null, strumento('reclami-pa', '', 'Scrivi un reclamo')].filter(Boolean),
    fonte: 'Siti dei Consigli regionali',
  };
}

function multe(c, pref) {
  if (!pref) return null;
  return {
    id: 'multe', gruppo: 'diritti', etichetta: 'Multe', titolo: pref.nome,
    testo: `Il ricorso al Prefetto contro una multa si può mandare qui, entro 60 giorni dalla notifica. PEC: ${pref.pec}.`,
    azioni: [strumento('faccio-ricorso', '', 'Controlla una multa')],
    fonte: 'IndicePA; Codice della strada, art. 203',
  };
}

function atti(c, x) {
  if (!x.pec) return null;
  return {
    id: 'atti', gruppo: 'diritti', etichetta: 'Chiedere un documento', titolo: 'La PEC del Comune', testo: `${x.pec}. Con una richiesta di accesso il Comune deve risponderti entro 30 giorni.`,
    azioni: [strumento('chiedo-gli-atti', '', 'Chiedi un documento'), x.sito ? esterno(x.sito, 'Il sito del Comune') : null].filter(Boolean),
    fonte: 'IndicePA; d.lgs. 33/2013, art. 5',
  };
}

function riquadriAiuti(c, p, ai, conteggio) {
  const regione = regioneDifensore(c.regione, c.sigla);
  if (!ai) {
    return [{ id: 'aiuti-anteprima', gruppo: 'soldi', etichetta: 'Aiuti', titolo: `${conteggio.nazionali} aiuti nazionali e ${conteggio.regionali} ${articoloRegione(regione)} da controllare`, testo: 'Con la prossima domanda vedo quali fanno per la tua famiglia.', azioni: [{ domanda: 'famiglia', testo: 'Rispondi alla prossima domanda' }] }];
  }
  const out = ai.probabili.slice(0, 6).map((a) => ({
    id: `aiuto-${a.id}`, gruppo: 'soldi', etichetta: a.regione ? `Aiuto ${articoloRegione(regione)}` : 'Aiuto nazionale',
    titolo: `${a.nome}: probabile`, testo: `${a.importo ? `${a.importo[0].toUpperCase()}${a.importo.slice(1)}. ` : ''}${a.automatica ? 'Arriva da solo, senza domanda. ' : ''}${a.sintesi}${a.condizioni.length ? ` Vale se: ${a.condizioni.map(minuscola).join('; ')}.` : ''}`,
    tono: 'si', azioni: [strumento('mi-spetta', '', 'Controlla i requisiti')], fonte: a.ente,
  }));
  if (ai.possibili.length) {
    out.push({
      id: 'aiuti-possibili', gruppo: 'soldi', etichetta: 'Da confermare',
      titolo: `${ai.possibili.length} ${ai.possibili.length === 1 ? 'aiuto possibile' : 'aiuti possibili'}`,
      testo: ai.possibili.slice(0, 5).map((a) => `${a.nome} (${a.condizioni.slice(0, 2).map(minuscola).join('; ')})`).join('. ') + (ai.possibili.length > 5 ? `. E altri ${ai.possibili.length - 5}.` : '.'),
      azioni: [strumento('mi-spetta', '', 'Rispondi alle altre domande in Mi spetta')],
    });
  }
  if (!out.length) {
    out.push({ id: 'aiuti-nessuno', gruppo: 'soldi', etichetta: 'Aiuti', titolo: 'Con queste risposte nessun aiuto probabile', testo: 'Mi spetta fa altre domande (lavoro, casa, redditi) che possono cambiare il quadro.', azioni: [strumento('mi-spetta', '', 'Apri Mi spetta')] });
  }
  for (const a of scadenze([...ai.probabili, ...ai.possibili])) {
    out.push({ id: `scadenza-${a.id}`, gruppo: 'scadenze', etichetta: 'Scadenza', titolo: `${a.nome}: domanda entro il ${data(a.finestra.a)}`, testo: a.finestra.testo || '', tono: 'forse', azioni: [a.come?.link ? esterno(a.come.link, 'Come fare la domanda') : strumento('mi-spetta', '', 'Apri Mi spetta')], scadenza: { titolo: `Domanda: ${a.nome}`, data: a.finestra.a } });
  }
  return out;
}

const MASCHILI = new Set(['Veneto', 'Lazio', 'Piemonte', 'Molise', 'Friuli Venezia Giulia', 'Trentino-Alto Adige']);
/** «del Veneto», «della Lombardia», «dell'Umbria», «delle Marche», «della Provincia autonoma di Trento». */
export const articoloRegione = (r) => (/^[AEIOU]/.test(r) ? `dell'${r}` : r === 'Marche' ? `delle ${r}` : MASCHILI.has(r) ? `del ${r}` : `della ${r}`);

/**
 * Tutti i riquadri della scheda, nell'ordine in cui si mostrano.
 * t: { comune: {istat, nome, sigla, regione}, x: la sintesi del Comune, prefetture, difensori, conteggio: {nazionali, regionali} }
 * ai: il risultato di aiuti(), o null se la domanda sulla famiglia non ha risposta.
 */
export function riquadri(t, p, ai) {
  const c = t.comune, x = t.x || {};
  const tutti = [
    ...(p.famiglia === 'saltata' ? [] : riquadriAiuti(c, p, p.famiglia === undefined ? null : ai, t.conteggio)),
    rifiuti(c, x),
    multe(c, prefettura(t.prefetture, c.sigla)),
    difensoreCivico(c, t.difensori),
    atti(c, x),
    x.b ? bilancio(c, x.b) : null,
    x.a ? appalti(x.a) : null,
  ].filter(Boolean);
  const ordine = GRUPPI.map(([g]) => g);
  return tutti.map((r, i) => ({ ...r, i })).sort((a, b) => ordine.indexOf(a.gruppo) - ordine.indexOf(b.gruppo) || a.i - b.i).map(({ i, ...r }) => r);
}

/** Cosa aggiunge la prossima domanda, prima di vederla. Il numero viene dal motore, non è una promessa. */
export function anteprima(p, ai, conteggio) {
  const q = prossima(p);
  if (q === 'famiglia') return `Con la prossima domanda: quali dei ${conteggio.nazionali + conteggio.regionali} aiuti nazionali e della tua Regione fanno per la tua famiglia.`;
  if (q === 'isee') {
    const n = ai ? ai.possibili.filter((a) => a.dipendeIsee).length : 0;
    return n ? `Con la prossima domanda: ${n} ${n === 1 ? 'aiuto dipende' : 'aiuti dipendono'} dall'ISEE, e capisco se sono probabili.` : 'Con la prossima domanda: gli aiuti legati all\'ISEE, dal bonus sociale per le bollette in giù.';
  }
  return '';
}

/** Un'impronta del riquadro, per dire «nuovo» o «cambiato» alla visita successiva. */
export const firma = (r) => `${r.titolo}|${r.testo}`;

/** Il testo della scheda, per l'assistente e il server MCP. */
export function testo(c, elenco) {
  const righe = [`${c.nome} (${c.sigla}), ${c.regione}.`];
  for (const [g, nome] of GRUPPI) {
    const qui = elenco.filter((r) => r.gruppo === g);
    if (!qui.length) continue;
    righe.push(`\n${nome}:`);
    for (const r of qui) righe.push(`- ${r.etichetta}: ${r.titolo}. ${r.testo}${r.fonte ? ` (Fonte: ${r.fonte})` : ''}`);
  }
  return righe.join('\n');
}
