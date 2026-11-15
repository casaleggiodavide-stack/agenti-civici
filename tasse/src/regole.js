// Dove finiscono le mie tasse: stima dell'IRPEF 2026 e delle addizionali, poi come si dividono
// 100 euro di spesa pubblica per funzione (COFOG) e 100 euro di spesa del tuo Comune.
// Regole scritte come codice, con la norma accanto; niente DOM. I dati li prepara scripts/tasse-dati.py.

export const VERIFICATO = '2026-11-15';
export const ANNO_IMPOSTA = 2026;

const NA = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:';
// Tutte le norme verificate su Normattiva il 15/11/2026, nella versione in vigore per l'anno d'imposta 2026.
export const FONTI = {
  scaglioni: { titolo: 'TUIR (DPR 917/1986), art. 11, comma 1: scaglioni e aliquote IRPEF (33% nel secondo scaglione dal 2026)', url: `${NA}decreto.presidente.repubblica:1986-12-22;917~art11!vig=2026-06-30` },
  detrazioni: { titolo: 'TUIR, art. 13: detrazioni per lavoro dipendente (commi 1 e 1.1), pensione (commi 3 e 3-bis), lavoro autonomo (commi 5 e 5-ter), quattro decimali (comma 6)', url: `${NA}decreto.presidente.repubblica:1986-12-22;917~art13!vig=2026-06-30` },
  bilancio2026: { titolo: 'Legge 30 dicembre 2025, n. 199 (bilancio 2026), art. 1, comma 3: seconda aliquota dal 35% al 33%; comma 4: taglio di 440 euro delle detrazioni per oneri sopra 200.000 euro di reddito', url: `${NA}legge:2025-12-30;199~art1!vig=2026-06-30` },
  cuneo: { titolo: 'Legge 30 dicembre 2024, n. 207, art. 1, commi 4-9: somma esente fino a 20.000 euro e ulteriore detrazione da 20.000 a 40.000 euro per i dipendenti', url: `${NA}legge:2024-12-30;207~art1!vig=2026-06-30` },
  integrativo: { titolo: 'D.L. 5 febbraio 2020, n. 3, art. 1: trattamento integrativo di 1.200 euro', url: `${NA}decreto.legge:2020-02-05;3~art1!vig=2026-06-30` },
  forfettario: { titolo: 'Legge 23 dicembre 2014, n. 190, art. 1, commi 64 e 65: imposta sostitutiva del regime forfettario (15%, 5% per i primi cinque anni)', url: `${NA}legge:2014-12-23;190~art1!vig=2026-06-30` },
  regionale: { titolo: 'D.lgs. 446/1997, art. 50: addizionale regionale, dovuta solo se è dovuta l\'IRPEF', url: `${NA}decreto.legislativo:1997-12-15;446~art50` },
  comunale: { titolo: 'D.lgs. 360/1998, art. 1, commi 3-bis e 4: addizionale comunale, soglia di esenzione, dovuta solo se è dovuta l\'IRPEF', url: `${NA}decreto.legislativo:1998-09-28;360~art1` },
  proroga: { titolo: 'Legge 296/2006, art. 1, comma 169: senza nuova delibera restano le aliquote dell\'anno prima', url: `${NA}legge:2006-12-27;296~art1-com169` },
  aliquote_comunali: { titolo: 'Dipartimento delle Finanze, addizionale comunale all\'IRPEF: elenchi generali delle aliquote', url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/download/tabella.htm' },
  aliquote_regionali: { titolo: 'Dipartimento delle Finanze, addizionale regionale all\'IRPEF: elenchi generali delle aliquote', url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/download/tabella.htm' },
  cofog: { titolo: 'Eurostat, spesa delle Amministrazioni pubbliche per funzione (COFOG), tabella gov_10a_exp: dati dell\'Italia trasmessi dall\'ISTAT, licenza CC BY 4.0', url: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp/default/table?lang=it' },
  conti: { titolo: 'Eurostat, entrate, uscite e indebitamento delle Amministrazioni pubbliche, tabella gov_10a_main, CC BY 4.0', url: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10a_main/default/table?lang=it' },
  istat_cofog: { titolo: 'ISTAT, la spesa delle Amministrazioni pubbliche per funzione (scheda e metodo)', url: 'https://www.istat.it/scheda-qualita/spese-della-pubblica-amministrazione-per-funzione/' },
  bilancio_comune: { titolo: 'OpenBDAP, Ragioneria Generale dello Stato: rendiconti dei Comuni (come in «Il bilancio del mio Comune»)', url: 'https://openbdap.rgs.mef.gov.it/it/FET/Analizza' },
  testo_unico: { titolo: 'D.lgs. 19 giugno 2026, n. 117: nuovo Testo unico delle imposte sui redditi, che sostituisce il TUIR dal 1° gennaio 2027', url: `${NA}decreto.legislativo:2026-06-19;117` },
};

export const IRPEF = [[28000, 23], [50000, 33], [null, 43]]; // TUIR art. 11, c. 1, in vigore dal 1/1/2026

/** Le missioni della spesa dei Comuni (d.lgs. 118/2011), con i nomi di «Il bilancio del mio Comune». */
export const MISSIONI = {
  '01': 'Uffici e amministrazione', '02': 'Giustizia', '03': 'Polizia locale e sicurezza', '04': 'Scuola', '05': 'Cultura',
  '06': 'Sport e giovani', '07': 'Turismo', '08': 'Urbanistica e case', '09': 'Ambiente, rifiuti e acqua', '10': 'Strade e trasporti',
  '11': 'Protezione civile', '12': 'Servizi sociali e famiglie', '13': 'Sanità', '14': 'Commercio e sviluppo economico',
  '15': 'Lavoro e formazione', '16': 'Agricoltura e pesca', '17': 'Energia', '18': 'Rapporti con altri enti',
  '19': 'Relazioni internazionali', '20': 'Fondi e accantonamenti', '50': 'Debiti: interessi e rate dei mutui',
};

export const TIPI = { dipendente: 'lavoro dipendente', pensionato: 'pensione', autonomo: 'lavoro autonomo o d\'impresa' };

const cent = (n) => Math.round(n * 100) / 100;
/** TUIR art. 13, c. 6: i rapporti si prendono con le prime quattro cifre decimali. */
const quattro = (x) => (x > 0 ? Math.floor(x * 10000 + 1e-9) / 10000 : 0);

/** Imposta lorda: aliquote per scaglioni sul reddito (TUIR art. 11). */
export function perScaglioni(reddito, scaglioni) {
  let resto = Math.max(0, reddito), da = 0, imposta = 0;
  for (const [fino, aliquota] of scaglioni) {
    const tetto = fino === null ? Infinity : fino;
    const parte = Math.min(resto, tetto - da);
    if (parte <= 0) break;
    imposta += (parte * aliquota) / 100;
    resto -= parte;
    da = tetto;
  }
  return cent(imposta);
}

/** Detrazione per tipo di reddito, per un anno intero (TUIR art. 13). */
export function detrazioneLavoro(tipo, r) {
  let d = 0;
  if (tipo === 'dipendente') {
    if (r <= 15000) d = 1955;
    else if (r <= 28000) d = 1910 + 1190 * quattro((28000 - r) / 13000);
    else if (r <= 50000) d = 1910 * quattro((50000 - r) / 22000);
    if (r > 25000 && r <= 35000) d += 65; // c. 1.1
  } else if (tipo === 'pensionato') {
    if (r <= 8500) d = 1955;
    else if (r <= 28000) d = 700 + 1255 * quattro((28000 - r) / 19500);
    else if (r <= 50000) d = 700 * quattro((50000 - r) / 22000);
    if (r > 25000 && r <= 29000) d += 50; // c. 3-bis
  } else if (tipo === 'autonomo') {
    if (r <= 5500) d = 1265;
    else if (r <= 28000) d = 500 + 765 * quattro((28000 - r) / 22500);
    else if (r <= 50000) d = 500 * quattro((50000 - r) / 22000);
    if (r > 11000 && r <= 17000) d += 50; // c. 5-ter
  }
  return cent(d);
}

/** Ulteriore detrazione per i dipendenti tra 20.000 e 40.000 euro (L. 207/2024, art. 1, c. 6). */
export function ulterioreDetrazione(r) {
  if (r <= 20000 || r > 40000) return 0;
  if (r <= 32000) return 1000;
  return cent((1000 * (40000 - r)) / 8000);
}

/** Somma che non concorre al reddito per i dipendenti fino a 20.000 euro (L. 207/2024, art. 1, c. 4). */
export function sommaEsente(r) {
  if (r <= 0 || r > 20000) return 0;
  const p = r <= 8500 ? 7.1 : r <= 15000 ? 5.3 : 4.8;
  return cent((r * p) / 100);
}

/** Stima dell'IRPEF dell'anno per chi ha un solo tipo di reddito per tutto l'anno. */
export function stimaIrpef(tipo, reddito) {
  const r = Math.max(0, Number(reddito) || 0);
  const lorda = perScaglioni(r, IRPEF);
  const detrazioni = [];
  const base = detrazioneLavoro(tipo, r);
  if (base) detrazioni.push({ nome: `Detrazione per ${TIPI[tipo]}`, euro: base, fonte: FONTI.detrazioni });
  if (tipo === 'dipendente') {
    const u = ulterioreDetrazione(r);
    if (u) detrazioni.push({ nome: 'Ulteriore detrazione per i dipendenti (taglio del cuneo)', euro: u, fonte: FONTI.cuneo });
  }
  const tot = detrazioni.reduce((a, d) => a + d.euro, 0);
  const netta = cent(Math.max(0, lorda - tot));
  const bonus = [];
  const note = [];
  if (tipo === 'dipendente') {
    const s = sommaEsente(r);
    if (s) bonus.push({ nome: 'Somma esente in busta paga (taglio del cuneo)', euro: s, fonte: FONTI.cuneo });
    if (r <= 15000 && lorda > base - 75) bonus.push({ nome: 'Trattamento integrativo', euro: 1200, fonte: FONTI.integrativo });
    else if (r > 15000 && r <= 28000) note.push('Il trattamento integrativo può spettare anche tra 15.000 e 28.000 euro se hai altre detrazioni (figli, interessi del mutuo, spese edilizie) che superano l\'imposta: qui non lo calcoliamo.');
  }
  if (r > 200000) note.push('Sopra 200.000 euro di reddito le detrazioni per oneri (spese al 19%, erogazioni ai partiti, polizze calamità) si riducono di 440 euro: qui non contiamo oneri, quindi non cambia la stima.');
  return { tipo, reddito: r, lorda, detrazioni, netta, bonus, note };
}

/** Addizionale regionale 2026: regola del Dipartimento delle Finanze per la tua Regione. */
export function addizionaleRegionale(regola, reddito, irpefNetta) {
  if (!regola) return { stato: 'serve', euro: null, note: ['Manca la regola della Regione: scrivi l\'importo dalla busta paga o dalla dichiarazione.'] };
  const note = [];
  if (regola.non_calcolate) note.push(`Non calcolata: ${regola.non_calcolate}.`);
  if (!(irpefNetta > 0)) return { stato: 'zero', euro: 0, perche: 'Non si paga perché l\'IRPEF netta è zero.', note };
  const r = reddito;
  if (regola.esenzione && r <= regola.esenzione) return { stato: 'zero', euro: 0, perche: `Esente fino a ${it(regola.esenzione)} euro di reddito.`, note };
  let euro;
  if (regola.intero_fino && r <= regola.intero_fino[0]) euro = (r * regola.intero_fino[1]) / 100;
  else euro = perScaglioni(r, regola.scaglioni);
  for (const d of regola.detrazioni || []) if (r > d.da && r <= d.a) euro -= d.euro;
  if (regola.lineare && r > regola.lineare.da) euro -= Math.min(regola.lineare.max, (regola.lineare.euro * (r - regola.lineare.da)) / regola.lineare.base);
  return { stato: 'ok', euro: cent(Math.max(0, euro)), note };
}

/** Addizionale comunale: aliquota unica o per scaglioni, soglia di esenzione sotto la quale non si paga niente. */
export function addizionaleComunale(regola, reddito, irpefNetta) {
  if (!regola) return { stato: 'serve', euro: null, note: ['Il Dipartimento delle Finanze non ha una riga per questo Comune: scrivi l\'aliquota o l\'importo.'] };
  const note = [];
  if (regola.nessuna) return { stato: 'zero', euro: 0, perche: 'Il Comune non applica l\'addizionale.', note };
  if (regola.da_verificare) return { stato: 'serve', euro: null, note: [`Le aliquote pubblicate per questo Comune non sono leggibili in automatico (${(regola.dubbi || []).join('; ')}): scrivi l'aliquota dalla delibera.`] };
  if (regola.prorogata) note.push(`Il Comune non ha ancora pubblicato una delibera per il ${ANNO_IMPOSTA}: valgono le aliquote del ${regola.anno}.`);
  if (regola.particolari?.length) note.push(`Ci sono esenzioni per categorie particolari che qui non contiamo: ${regola.particolari.join('; ')}.`);
  if (regola.forma_libera) note.push('La delibera è stata pubblicata come testo libero: le aliquote le abbiamo lette dalla descrizione, controllale.');
  if (!(irpefNetta > 0)) return { stato: 'zero', euro: 0, perche: 'Non si paga perché l\'IRPEF netta è zero.', note };
  if (regola.esenzione && reddito <= regola.esenzione) return { stato: 'zero', euro: 0, perche: `Esente fino a ${it(regola.esenzione)} euro di reddito.`, note };
  return { stato: 'ok', euro: perScaglioni(reddito, regola.scaglioni), note };
}

/**
 * Divide un totale in parti proporzionali ai pesi, arrotondate a «passo», che sommano esattamente al totale
 * (metodo dei resti più grandi).
 */
export function ripartisci(totale, pesi, passo = 1) {
  const somma = pesi.reduce((a, b) => a + b, 0);
  const unita = Math.round(totale / passo);
  if (!somma || !unita) return pesi.map(() => 0);
  const esatti = pesi.map((p) => (p / somma) * unita);
  const parti = esatti.map(Math.floor);
  let manca = unita - parti.reduce((a, b) => a + b, 0);
  const ordine = esatti.map((e, i) => [e - Math.floor(e), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; manca > 0; k = (k + 1) % ordine.length, manca--) parti[ordine[k][1]]++;
  return parti.map((p) => Math.round(p * passo * 1e6) / 1e6);
}

/** 100 euro di spesa pubblica per funzione, per l'Italia e per la media dell'Unione europea. */
export function quoteFunzioni(cofog) {
  const it = cofog.paesi.italia, ue = cofog.paesi.ue;
  const chiavi = cofog.voci.map((v) => v.chiave);
  const su100 = ripartisci(100, chiavi.map((k) => it.milioni[k]), 0.1);
  const su100ue = ue ? ripartisci(100, chiavi.map((k) => ue.milioni[k]), 0.1) : null;
  return cofog.voci.map((v, i) => ({ chiave: v.chiave, nome: v.nome, dentro: v.dentro, milioni: it.milioni[v.chiave], su100: su100[i], ue: su100ue ? su100ue[i] : null }))
    .sort((a, b) => b.milioni - a.milioni);
}

/** Quanta spesa è coperta a debito nell'anno: indebitamento netto diviso per le uscite totali. */
export function quotaDebito(cofog, paese = 'italia', anno = cofog.anno) {
  const c = cofog.conti?.[paese]?.[String(anno)];
  if (!c || !c.uscite) return null;
  const debito = Math.max(0, -c.indebitamento);
  return { anno: Number(anno), uscite: c.uscite, entrate: c.entrate, indebitamento: c.indebitamento, su100: Math.round((1000 * debito) / c.uscite) / 10 };
}

/** 100 euro di spesa del Comune per missione, con la spesa per abitante e quella tipica dei Comuni simili. */
export function quoteComune(bil, simili) {
  if (!bil?.tot || !bil.missioni) return null;
  const voci = Object.entries(bil.missioni).filter(([m, v]) => v > 0 && MISSIONI[m]);
  const su100 = ripartisci(100, voci.map(([, v]) => v), 0.1);
  return voci.map(([m, v], i) => ({ missione: m, nome: MISSIONI[m], euro: v, su100: su100[i], pc: bil.pop ? v / bil.pop : null, pcSimili: simili?.missioni_pc?.[m] ?? null }))
    .sort((a, b) => b.euro - a.euro);
}

/**
 * Funzione principale (anche per il server MCP).
 * @param contribuente {{ modo?: 'stima'|'dichiarazione', tipo?: 'dipendente'|'pensionato'|'autonomo', reddito?: number,
 *   forfettario?: 0|5|15, irpef?: number, addRegionale?: number, addComunale?: number, aliquotaComunale?: number }}
 *   modo «stima»: dal reddito imponibile annuo (un solo tipo di reddito per tutto l'anno);
 *   modo «dichiarazione»: l'IRPEF netta e le addizionali lette dalla Certificazione Unica o dal 730.
 * @param cofog lo «stato.cofog» preparato da scripts/tasse-dati.py
 * @param comune {{ nome, sigla, regione, regionale?: regola, add?: regola comunale, bil?: spesa per missione, simili?: mediane }} oppure null
 */
export function doveVanno(contribuente, cofog, comune = null) {
  const c = contribuente || {};
  const modo = c.modo === 'dichiarazione' ? 'dichiarazione' : 'stima';
  const servono = [];
  const avvisi = [];
  let irpef = null, regionale = null, comunale = null, sostitutiva = null;
  const reddito = Number(c.reddito) > 0 ? Number(c.reddito) : null;

  if (modo === 'stima') {
    if (!TIPI[c.tipo]) servono.push('il tipo di reddito (lavoro dipendente, pensione o lavoro autonomo)');
    if (reddito === null) servono.push('il reddito imponibile annuo');
  } else if (!(Number(c.irpef) >= 0) || c.irpef === null || c.irpef === undefined || c.irpef === '') {
    servono.push('l\'IRPEF netta della Certificazione Unica o del 730');
  }
  if (servono.length) return { anno: ANNO_IMPOSTA, modo, servono, avvisi };

  if (modo === 'stima' && c.tipo === 'autonomo' && [5, 15].includes(Number(c.forfettario))) {
    const al = Number(c.forfettario);
    sostitutiva = { aliquota: al, euro: cent((reddito * al) / 100), fonte: FONTI.forfettario };
    avvisi.push('Nel regime forfettario l\'imposta sostitutiva prende il posto di IRPEF e addizionali regionali e comunali: al Comune non va una quota diretta.');
  } else if (modo === 'stima') {
    irpef = stimaIrpef(c.tipo, reddito);
  } else {
    irpef = { netta: cent(Number(c.irpef)), dichiarata: true, detrazioni: [], bonus: [], note: [] };
  }

  if (!sostitutiva) {
    const netta = irpef.netta;
    if (modo === 'dichiarazione' && Number(c.addRegionale) >= 0 && c.addRegionale !== undefined && c.addRegionale !== null && c.addRegionale !== '') regionale = { stato: 'ok', euro: cent(Number(c.addRegionale)), dichiarata: true, note: [] };
    else if (reddito !== null) regionale = addizionaleRegionale(comune?.regionale, reddito, netta);
    else regionale = { stato: 'serve', euro: null, note: ['Scrivi l\'addizionale regionale dalla Certificazione Unica o dal 730, oppure il reddito per stimarla.'] };

    if (modo === 'dichiarazione' && Number(c.addComunale) >= 0 && c.addComunale !== undefined && c.addComunale !== null && c.addComunale !== '') comunale = { stato: 'ok', euro: cent(Number(c.addComunale)), dichiarata: true, note: [] };
    else if (reddito !== null && Number(c.aliquotaComunale) >= 0 && c.aliquotaComunale !== undefined && c.aliquotaComunale !== null && c.aliquotaComunale !== '') comunale = addizionaleComunale({ scaglioni: [[null, Number(c.aliquotaComunale)]] }, reddito, netta);
    else if (reddito !== null && comune) comunale = addizionaleComunale(comune.add, reddito, netta);
    else comunale = { stato: 'serve', euro: null, note: [comune ? 'Scrivi l\'addizionale comunale dalla Certificazione Unica o dal 730, oppure il reddito per stimarla.' : 'Scegli il Comune per calcolare l\'addizionale comunale.'] };
  }

  const allo_stato = sostitutiva ? sostitutiva.euro : cent(irpef.netta + (regionale?.euro || 0));
  const al_comune = comunale?.euro || 0;
  const totale = cent(allo_stato + al_comune);

  const funzioni = quoteFunzioni(cofog);
  const euroFunzioni = ripartisci(Math.round(allo_stato), funzioni.map((f) => f.su100));
  funzioni.forEach((f, i) => { f.euro = euroFunzioni[i]; });
  const pens = cofog.paesi.italia.dettagli_milioni?.pensioni;
  const pensioni = pens ? { su100: Math.round((1000 * pens) / cofog.paesi.italia.totale_milioni) / 10, nome: cofog.dettagli?.pensioni } : null;

  const debito = quotaDebito(cofog, 'italia');
  const debitoUe = quotaDebito(cofog, 'ue');

  let spesaComune = null;
  if (comune) {
    const righe = quoteComune(comune.bil, comune.simili);
    if (righe) {
      const euro = ripartisci(Math.round(al_comune), righe.map((r) => r.su100));
      righe.forEach((r, i) => { r.tuoi = euro[i]; });
      spesaComune = { nome: comune.nome, anno: comune.bil.anno, tot: comune.bil.tot, pop: comune.bil.pop, fascia: comune.bil.fascia, righe };
    } else {
      avvisi.push(`Per ${comune.nome} non c'è un rendiconto utilizzabile nella banca dati OpenBDAP: non sappiamo dire come spende 100 euro.`);
    }
  }

  const bonus = irpef?.bonus?.reduce((a, b) => a + b.euro, 0) || 0;
  return {
    anno: ANNO_IMPOSTA, modo, servono, avvisi,
    tipo: c.tipo || null, reddito,
    irpef, sostitutiva, regionale, comunale,
    allo_stato, al_comune, totale, bonus: cent(bonus), saldo: cent(totale - bonus),
    funzioni, anno_spesa: cofog.anno, pensioni, debito, debitoUe,
    comune: comune ? { nome: comune.nome, sigla: comune.sigla, regione: comune.regione } : null,
    spesaComune,
  };
}

const it = (n, cifre = 0) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: cifre, maximumFractionDigits: cifre, useGrouping: 'always' }).format(n);
const eu = (n) => `${it(n, Math.abs(n - Math.round(n)) < 0.005 ? 0 : 2)} euro`;

/** L'esito in testo semplice, per l'assistente e il server MCP. */
export function testo(e) {
  if (e.servono?.length) return `Per fare il conto serve: ${e.servono.join('; ')}.`;
  const r = [];
  if (e.sostitutiva) {
    r.push(`Regime forfettario: imposta sostitutiva del ${e.sostitutiva.aliquota}% su ${eu(e.reddito)} = ${eu(e.sostitutiva.euro)} (L. 190/2014, art. 1, commi 64-65).`);
  } else if (e.irpef.dichiarata) {
    r.push(`IRPEF netta dichiarata: ${eu(e.irpef.netta)}.`);
  } else {
    r.push(`Stima IRPEF ${e.anno} per ${TIPI[e.tipo]} con reddito imponibile di ${eu(e.reddito)}: imposta lorda ${eu(e.irpef.lorda)}${e.irpef.detrazioni.map((d) => `, meno ${d.nome.toLowerCase()} ${eu(d.euro)}`).join('')}; IRPEF netta ${eu(e.irpef.netta)}.`);
    for (const b of e.irpef.bonus) r.push(`In più ricevi: ${b.nome.toLowerCase()}, ${eu(b.euro)} (non è un'imposta, è una somma che lo Stato ti paga).`);
    r.push(...e.irpef.note);
  }
  const add = (nome, a) => {
    if (!a) return;
    if (a.stato === 'serve') r.push(`Addizionale ${nome}: serve un dato. ${a.note.join(' ')}`);
    else r.push(`Addizionale ${nome}: ${eu(a.euro)}${a.perche ? ` (${a.perche})` : ''}.${a.note?.length ? ` ${a.note.join(' ')}` : ''}`);
  };
  add('regionale', e.regionale);
  add('comunale', e.comunale);
  r.push(`Totale: ${eu(e.totale)}; a Stato e Regione ${eu(e.allo_stato)}, al Comune ${eu(e.al_comune)}.`);
  if (e.bonus) r.push(`Tolto quello che ricevi in busta paga (${eu(e.bonus)}), il saldo è ${eu(e.saldo)}.`);
  r.push(`Come si dividono 100 euro di spesa pubblica in Italia (${e.anno_spesa}, Eurostat su dati ISTAT, funzioni COFOG), e quanto vale per le tue ${eu(Math.round(e.allo_stato))} a Stato e Regione:`);
  for (const f of e.funzioni) r.push(`- ${f.nome}: ${it(f.su100, 1)} euro su 100${f.ue !== null ? ` (media UE ${it(f.ue, 1)})` : ''}, circa ${eu(f.euro)} delle tue.`);
  if (e.pensioni) r.push(`Le pensioni di vecchiaia e ai superstiti da sole valgono ${it(e.pensioni.su100, 1)} euro su 100.`);
  r.push('Le tasse non sono destinate a una spesa precisa: entrano tutte nello stesso bilancio, insieme ai contributi sociali, che pagano gran parte delle pensioni. Le quote valgono per il totale della spesa.');
  if (e.debito) r.push(`Nel ${e.debito.anno} la spesa pubblica ha superato le entrate: ${it(e.debito.su100, 1)} euro ogni 100 spesi sono stati presi a prestito (deficit)${e.debitoUe ? `; nella media UE ${it(e.debitoUe.su100, 1)}` : ''}.`);
  if (e.spesaComune) {
    const s = e.spesaComune;
    r.push(`Come spende 100 euro il Comune di ${s.nome} (rendiconto ${s.anno}, OpenBDAP)${e.al_comune ? ` e dove vanno le tue ${eu(Math.round(e.al_comune))} di addizionale comunale` : ''}:`);
    for (const x of s.righe.filter((x) => x.su100 >= 1)) r.push(`- ${x.nome}: ${it(x.su100, 1)} euro su 100${e.al_comune ? `, circa ${eu(x.tuoi)} delle tue` : ''}.`);
  }
  r.push(...e.avvisi);
  r.push('Stima informativa con le regole del 2026 (TUIR artt. 11 e 13, legge 199/2025, legge 207/2024): non sostituisce la dichiarazione dei redditi né il CAF.');
  return r.join('\n');
}

/** Mette insieme i dati del Comune per doveVanno: riga dell'elenco [istat, nome, sigla, regione] e scheda della provincia. */
export function preparaComune(stato, riga, scheda) {
  if (!riga) return null;
  const [istat, nome, sigla, regione] = riga;
  const bil = scheda?.bil || null;
  return { istat, nome, sigla, regione, regionale: stato.regioni?.[regione] || null, add: scheda?.add || null, bil, simili: bil?.fascia ? stato.bilancio_comuni?.fasce?.[bil.fascia] || null : null };
}
