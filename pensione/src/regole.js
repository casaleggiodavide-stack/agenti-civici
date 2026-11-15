// Regole di «Quando vado in pensione?»: per ogni uscita che la legge prevede oggi,
// la prima data possibile, i requisiti con sì/no/serve un dato e cosa manca.
// Niente DOM: le stesse funzioni servono alla pagina, ai test e al server MCP.
// Ogni numero viene da pensione/dati/fonti.json (verificato il giorno in VERIFICATO).
//
// Si lavora a mesi: età e contributi in mesi, date al primo giorno del mese.
// Mese e anno di nascita bastano: chi compie gli anni in un certo mese matura
// il requisito di età in quel mese, e la pensione decorre dal mese dopo.

import FONTI from './dati/fonti.js';

export const VERIFICATO = FONTI.verificato;
export const FONTI_NORME = FONTI.fonti;
const R = FONTI.requisiti;
const V = FONTI.valori;

/** Ultimo anno con requisiti fissati da norme in vigore; dopo si usano gli stessi valori ma come previsione. */
export const ULTIMO_ANNO_NOTO = 2028;
const MAX_ANNI_AVANTI = 50;

// ---------- mesi e date ----------

/** Indice assoluto del mese: anno * 12 + (mese - 1). */
export const mese = (anno, m) => anno * 12 + (m - 1);
const annoDi = (i) => Math.floor(i / 12);
const meseDi = (i) => (i % 12) + 1;
const due = (n) => String(n).padStart(2, '0');
const primoGiorno = (i) => `${annoDi(i)}-${due(meseDi(i))}-01`;
const ultimoGiorno = (i) => { const d = new Date(Date.UTC(annoDi(i), meseDi(i), 0)); return d.toISOString().slice(0, 10); };
const meseIso = (i) => `${annoDi(i)}-${due(meseDi(i))}`;
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const scritto = (i) => `${MESI[meseDi(i) - 1]} ${annoDi(i)}`;
const scrittoData = (iso) => { if (!iso) return ''; const [a, m, g] = iso.split('-').map(Number); return `${g === 1 ? '1°' : g} ${MESI[m - 1]} ${a}`; };
export { scrittoData };

/** «42 anni e 10 mesi» da un numero di mesi. */
export function durata(mesi) {
  const m = Math.max(0, Math.round(mesi));
  const a = Math.floor(m / 12), r = m % 12;
  const pa = a === 1 ? '1 anno' : `${a} anni`;
  if (!r) return pa;
  const pm = r === 1 ? '1 mese' : `${r} mesi`;
  return a ? `${pa} e ${pm}` : pm;
}

/** Valore di una tabella [[anno, valore], ...] per un anno. */
export function perAnno(tab, anno) {
  if (!Array.isArray(tab)) return tab;
  let v = tab[0][1];
  for (const [a, x] of tab) if (anno >= a) v = x;
  return v;
}

const oggiIdx = (oggi) => {
  const d = oggi ? new Date(oggi) : new Date();
  return mese(d.getUTCFullYear(), d.getUTCMonth() + 1);
};
const isoDi = (oggi) => (oggi ? new Date(oggi) : new Date()).toISOString().slice(0, 10);

// ---------- la persona ----------

export const GESTIONI = {
  privato: 'Dipendente privato',
  pubblico_stato: 'Dipendente pubblico dello Stato (ministeri, agenzie, enti statali)',
  scuola: 'Personale della scuola statale',
  pubblico_locale: 'Dipendente di enti locali o sanità pubblica (casse CPDEL, CPS, CPI, CPUG)',
  autonomo: 'Artigiano, commerciante o coltivatore diretto',
  separata: 'Gestione separata (collaboratori, professionisti senza cassa)',
};
const DIPENDENTI = new Set(['privato', 'pubblico_stato', 'scuola', 'pubblico_locale']);
const GRAVOSI = new Set(['gravoso_7_10', 'gravoso_6_7']);
const USURANTI = new Set(['usurante', 'notturno_72_77', 'notturno_64_71']);

const num = (x) => (x === undefined || x === null || x === '' || Number.isNaN(Number(x)) ? null : Number(x));
const bool = (x) => (x === true || x === 'si' ? true : x === false || x === 'no' ? false : null);

/** Pulisce le risposte: numeri, sì/no, valori ammessi. */
export function normalizza(p = {}) {
  const anni = num(p.contributi_anni), mesi = num(p.contributi_mesi);
  const figli = num(p.figli);
  return {
    nascita_anno: num(p.nascita_anno),
    nascita_mese: num(p.nascita_mese),
    sesso: ['donna', 'uomo'].includes(p.sesso) ? p.sesso : null,
    contributi: anni === null && mesi === null ? null : Math.max(0, (anni || 0) * 12 + (mesi || 0)),
    mesi_anno: num(p.mesi_anno) === null ? null : Math.min(12, Math.max(0, num(p.mesi_anno))),
    prima_1996: bool(p.prima_1996),
    gestione: GESTIONI[p.gestione] ? p.gestione : null,
    precoce: bool(p.precoce),
    lavoro: GRAVOSI.has(p.lavoro) || USURANTI.has(p.lavoro) || p.lavoro === 'no' ? p.lavoro : null,
    invalidita74: bool(p.invalidita74),
    caregiver: bool(p.caregiver),
    disoccupato: ['no', 'naspi_finita_3', 'naspi_finita', 'naspi_in_corso'].includes(p.disoccupato) ? p.disoccupato : null,
    fine_termine: bool(p.fine_termine),
    figli: figli === null ? null : Math.max(0, Math.floor(figli)),
  };
}

// ---------- il calcolo di base ----------

/**
 * Primo mese, da oggi in avanti, in cui età e contributi bastano.
 * etaReq(anno) e contrReq(anno) danno i mesi richiesti nell'anno (null = nessun requisito).
 * Se non sappiamo quanti contributi verserai (mesi_anno mancante) contiamo solo quelli
 * che hai già: vale come «al più tardi» solo se i contributi bastano già oggi.
 */
function trova(ctx, etaReq, contrReq, limite) {
  const { B, M0, C0, rate } = ctx;
  const fine = limite ?? M0 + MAX_ANNI_AVANTI * 12;
  for (let M = M0; M <= fine; M += 1) {
    const anno = annoDi(M);
    const e = etaReq ? etaReq(anno, M) : null;
    const c = contrReq ? contrReq(anno, M) : null;
    if (e !== null && M - B < e) continue;
    if (c !== null) {
      if (C0 === null) return { stato: 'dato', manca: 'contributi' };
      const cM = M === M0 ? C0 : C0 + Math.floor(((rate ?? 0) * (M - M0)) / 12);
      if (cM < c) continue;
      if (rate === null && M > M0 && C0 < c) return { stato: 'dato', manca: 'mesi_anno' };
    }
    return { stato: 'ok', M, gia: M === M0 };
  }
  // Senza i mesi futuri: «serve un dato» solo se entro il limite l'età arriverebbe.
  if (rate === null && contrReq && C0 !== null && (!etaReq || fine - B >= etaReq(annoDi(fine), fine))) return { stato: 'dato', manca: 'mesi_anno' };
  return { stato: 'mai' };
}

/** Mese più tardo in cui, se ha già i requisiti, la persona li ha maturati (per contare la finestra). */
function maturazioneGia(ctx, etaRichiesta, contrRichiesti) {
  const daEta = etaRichiesta !== null ? ctx.B + etaRichiesta : -Infinity;
  // I contributi crescono al massimo di un mese al mese: chi ne ha C0 >= richiesti li aveva già (C0 - richiesti) mesi fa.
  const daContr = contrRichiesti !== null ? ctx.M0 - (ctx.C0 - contrRichiesti) : -Infinity;
  return Math.min(ctx.M0, Math.max(daEta, daContr));
}

/** Decorrenza: primo giorno del mese dopo la maturazione e la finestra; mai prima del mese prossimo. Scuola: 1° settembre. */
function decorrenza(ctx, Mmat, finestra) {
  if (ctx.p.gestione === 'scuola') {
    // Art. 59, c. 9, L. 449/1997: cessazione dal 1° settembre se il requisito matura entro il 31 dicembre.
    let s = mese(annoDi(Mmat), 9);
    while (s < ctx.M0 + 1) s += 12;
    return s;
  }
  return Math.max(ctx.M0 + 1, Mmat + 1 + finestra);
}

const finestraAnticipata = (ctx, anno) => (ctx.p.gestione === 'pubblico_locale' ? perAnno(R.anticipata_finestra_cpdel, anno) : perAnno(R.anticipata_finestra, anno));

/** Età e contributi a una data passata: limiti certi senza conoscere la storia (al più 1 mese di contributi al mese). */
function allaData(ctx, Mcut) {
  const eta = Mcut - ctx.B;
  const trascorsi = Math.max(0, ctx.M0 - Mcut);
  return { eta, contrMin: ctx.C0 === null ? null : Math.max(0, ctx.C0 - trascorsi), contrMax: ctx.C0 };
}

const req = (testo, esito, nota) => ({ testo, esito, ...(nota ? { nota } : {}) });

function nuovaUscita(id, nome, breve, fonti) {
  return { id, nome, breve, esito: 'no', maturazione: null, decorrenza: null, gia: false, previsione: false, finestra: 0, requisiti: [], manca: [], note: [], fonti, scadenze: [] };
}

function chiudi(u, ctx, r, finestra, extra = {}) {
  if (r.stato === 'ok') {
    let Mmat = r.M;
    if (r.gia && extra.etaGia !== undefined) Mmat = maturazioneGia(ctx, extra.etaGia, extra.contrGia);
    const d = decorrenza(ctx, Mmat, finestra);
    u.maturazione = r.gia ? null : meseIso(r.M);
    u.decorrenza = primoGiorno(d);
    u.gia = r.gia;
    u.finestra = finestra;
    u.previsione = annoDi(r.M) > ULTIMO_ANNO_NOTO;
    if (u.esito !== 'dato') u.esito = 'si';
    if (u.previsione) u.note.push(`I requisiti dal ${ULTIMO_ANNO_NOTO + 1} saranno adeguati di nuovo alla speranza di vita con un decreto che non c'è ancora: la data può spostarsi in avanti di qualche mese.`);
    if (r.gia) u.note.push(finestra && ctx.p.gestione !== 'scuola'
      ? `Hai già i requisiti. Se li hai maturati da poco, la pensione parte dopo la finestra di ${durata(finestra)}; altrimenti dal mese dopo la domanda. Qui c'è la data più tarda possibile: con l'estratto conto puoi trovare quella esatta.`
      : 'Hai già i requisiti: la pensione può partire dal primo giorno del mese dopo la domanda.');
  } else if (r.stato === 'dato') {
    u.esito = 'dato';
    if (r.manca === 'mesi_anno') u.manca.push('Quanti mesi di contributi verserai ogni anno: senza questo dato non posso calcolare quando arrivi ai contributi richiesti.');
    if (r.manca === 'contributi') u.manca.push('Quanti anni e mesi di contributi hai già.');
  } else {
    u.esito = 'no';
  }
  return u;
}

/** Cosa manca oggi, in parole: età e contributi. */
function mancaOggi(ctx, eta, contr) {
  const out = [];
  if (eta !== null && ctx.M0 - ctx.B < eta) out.push(`${durata(eta - (ctx.M0 - ctx.B))} di età`);
  if (contr !== null && ctx.C0 !== null && ctx.C0 < contr) out.push(`${durata(contr - ctx.C0)} di contributi`);
  return out.length ? `Oggi ti mancano ${out.join(' e ')}.` : '';
}

// ---------- le uscite ----------

function vecchiaia(ctx) {
  const { p } = ctx;
  const u = nuovaUscita('vecchiaia', 'Pensione di vecchiaia', 'La pensione ordinaria: un\'età minima e 20 anni di contributi.', ['dl201_art24', 'inps_circ_28_2026', 'l199_2025', 'dd_2025_12_19', 'inps_vecchiaia']);
  const eta = (anno) => perAnno(R.vecchiaia_eta, anno);
  const anno0 = annoDi(ctx.M0);
  // Gravosi da 7 anni su 10 e usuranti con 30 anni di contributi: 66 anni e 7 mesi; gravosi da 6 su 7: 67 anni (L. 199/2025, c. 186-187; circ. INPS 28/2026, § 3.1).
  const gravosa = p.lavoro && p.lavoro !== 'no' && DIPENDENTI.has(p.gestione ?? 'privato');
  const etaGravosi = p.lavoro === 'gravoso_6_7' ? perAnno(R.vecchiaia_gravosi_6su7_eta, anno0) : perAnno(R.vecchiaia_gravosi_7su10_eta, anno0);
  const ordinaria = trova(ctx, eta, () => R.vecchiaia_contributi);
  const ridotta = gravosa ? trova(ctx, (a) => (a <= ULTIMO_ANNO_NOTO ? etaGravosi : eta(a)), () => R.gravosi_contributi) : null;
  const usaRidotta = ridotta?.stato === 'ok' && (ordinaria.stato !== 'ok' || ridotta.M < ordinaria.M);
  const r = usaRidotta ? ridotta : ordinaria;
  const annoR = r.stato === 'ok' ? annoDi(r.M) : anno0;
  const etaR = usaRidotta ? etaGravosi : eta(annoR);
  const contrR = usaRidotta ? R.gravosi_contributi : R.vecchiaia_contributi;
  u.requisiti.push(req(`Età: ${durata(etaR)}${r.stato === 'ok' ? ` (requisito del ${annoR})` : ''}`, r.stato === 'ok' ? 'si' : ctx.M0 - ctx.B >= etaR ? 'si' : 'no', usaRidotta ? 'Requisito ridotto per lavori gravosi o usuranti, con almeno 30 anni di contributi.' : null));
  u.requisiti.push(req(`Contributi: almeno ${durata(contrR)}`, ctx.C0 === null ? 'dato' : r.stato === 'ok' || ctx.C0 >= contrR ? 'si' : r.stato === 'dato' ? 'dato' : 'no'));
  if (p.prima_1996 === false) {
    u.requisiti.push(req(`Importo: almeno pari all'assegno sociale (nel 2026 ${eur(V.assegno_sociale_2026)} al mese)`, 'dato', 'Vale per chi ha il primo contributo dopo il 1995. L\'importo non lo calcolo: controllalo con «La mia pensione futura» dell\'INPS. Se non basta, c\'è la vecchiaia a 71 anni.'));
    u.esito = 'dato';
  } else if (p.prima_1996 === null) {
    u.requisiti.push(req('Primo contributo prima o dopo il 1996', 'dato', 'Chi ha cominciato a versare dopo il 1995 deve avere anche un importo almeno pari all\'assegno sociale.'));
    u.esito = 'dato';
  }
  if (DIPENDENTI.has(p.gestione)) u.requisiti.push(req('Fine del rapporto di lavoro dipendente', 'dato', 'Serve per ricevere la pensione; un\'attività autonoma può continuare.'));
  chiudi(u, ctx, r, 0, { etaGia: etaR, contrGia: contrR });
  if (u.esito === 'no') u.manca.push(mancaOggi(ctx, etaR, contrR) || 'Con i contributi che versi non arrivi ai 20 anni.');
  if (gravosa && !usaRidotta) u.note.push('Per i lavori gravosi o usuranti l\'età è più bassa (66 anni e 7 mesi) solo con almeno 30 anni di contributi.');
  return u;
}

function vecchiaia71(ctx) {
  const u = nuovaUscita('vecchiaia71', 'Pensione di vecchiaia a 71 anni (contributivo)', 'Per chi ha il primo contributo dopo il 1995: bastano 5 anni di contributi effettivi, senza soglia di importo.', ['dl201_art24', 'inps_circ_28_2026']);
  if (ctx.p.prima_1996 !== false) {
    u.requisiti.push(req('Primo contributo dopo il 1995', ctx.p.prima_1996 === null ? 'dato' : 'no'));
    u.esito = ctx.p.prima_1996 === null ? 'dato' : 'no';
    if (ctx.p.prima_1996) u.manca.push('Vale solo per chi non ha contributi prima del 1996.');
    return u;
  }
  const eta = (anno) => perAnno(R.vecchiaia71_eta, anno);
  const r = trova(ctx, eta, () => R.vecchiaia71_contributi);
  const annoR = r.stato === 'ok' ? annoDi(r.M) : annoDi(ctx.M0);
  u.requisiti.push(req('Primo contributo dopo il 1995', 'si'));
  u.requisiti.push(req(`Età: ${durata(eta(annoR))}`, r.stato === 'ok' ? 'si' : 'no'));
  u.requisiti.push(req(`Contributi effettivi: almeno ${durata(R.vecchiaia71_contributi)}`, ctx.C0 === null ? 'dato' : ctx.C0 >= R.vecchiaia71_contributi || r.stato === 'ok' ? 'si' : 'no', 'Contano i contributi effettivi, non quelli figurativi (malattia, disoccupazione).'));
  chiudi(u, ctx, r, 0, { etaGia: eta(annoR), contrGia: R.vecchiaia71_contributi });
  if (u.esito === 'no') u.manca.push(mancaOggi(ctx, eta(annoR), R.vecchiaia71_contributi));
  return u;
}

function anticipata(ctx) {
  const { p } = ctx;
  const u = nuovaUscita('anticipata', 'Pensione anticipata ordinaria', 'A qualunque età, con i contributi richiesti: 42 anni e 10 mesi gli uomini, 41 anni e 10 mesi le donne nel 2026.', ['dl201_art24', 'inps_circ_28_2026', 'l199_2025', 'dd_2025_12_19']);
  if (!p.sesso) {
    u.esito = 'dato';
    u.requisiti.push(req('Sesso', 'dato', 'Uomini e donne hanno requisiti diversi.'));
    u.manca.push('Se sei uomo o donna.');
    return u;
  }
  const donna = p.sesso === 'donna';
  // Gravosi (7 su 10 o 6 su 7) e usuranti del d.lgs. 67/2011, dipendenti: requisito fermo nel 2027-2028 (sopra i 30 anni di contributi richiesti).
  const gravoso = Boolean(p.lavoro && p.lavoro !== 'no' && DIPENDENTI.has(p.gestione ?? 'privato'));
  const base = (anno) => perAnno(donna ? R.anticipata_donne : R.anticipata_uomini, anno);
  const fermo = (anno) => perAnno(donna ? R.anticipata_gravosi_donne : R.anticipata_gravosi_uomini, anno);
  // L. 199/2025, c. 186-187: per gravosi e usuranti con almeno 30 anni di contributi il requisito resta quello del 2026 per il 2027-2028.
  const contr = (anno) => (gravoso && anno <= ULTIMO_ANNO_NOTO ? Math.min(base(anno), fermo(anno)) : base(anno));
  const r = trova(ctx, null, contr);
  const annoR = r.stato === 'ok' ? annoDi(r.M) : annoDi(ctx.M0);
  const finestra = finestraAnticipata(ctx, annoR);
  u.requisiti.push(req(`Contributi: ${durata(contr(annoR))} (${donna ? 'donne' : 'uomini'}, requisito del ${annoR})`, ctx.C0 === null ? 'dato' : r.stato === 'ok' ? 'si' : r.stato === 'dato' ? 'dato' : 'no', 'Valgono tutti i contributi, anche figurativi, con i limiti fissati dalla legge per malattia e disoccupazione.'));
  u.requisiti.push(req(`Finestra: la pensione parte ${durata(finestra)} dopo aver raggiunto i contributi`, 'si', p.gestione === 'pubblico_locale' ? 'Per le casse CPDEL, CPS, CPI e CPUG la finestra cresce: 5 mesi nel 2026, 7 nel 2027, 9 dal 2028.' : null));
  if (!p.gestione) u.requisiti.push(req('Gestione', 'dato', 'Per i dipendenti di enti locali e sanità la finestra è più lunga.'));
  chiudi(u, ctx, r, finestra, { etaGia: null, contrGia: contr(annoR) });
  if (!p.gestione && u.esito === 'si') u.esito = 'dato';
  if (u.esito === 'no') u.manca.push(mancaOggi(ctx, null, contr(annoR)) || 'Con i contributi che versi non arrivi al requisito.');
  if (gravoso) u.note.push('Per gravosi e usuranti con almeno 30 anni di contributi il requisito non aumenta nel 2027 e nel 2028.');
  return u;
}

function soglia(p, anno) {
  if (p.sesso === 'donna' && (p.figli ?? 0) >= 2) return R.contributiva_soglia_donna_2figli;
  if (p.sesso === 'donna' && (p.figli ?? 0) === 1) return R.contributiva_soglia_donna_1figlio;
  return perAnno(R.contributiva_soglia, anno);
}

function contributiva(ctx) {
  const { p } = ctx;
  const u = nuovaUscita('contributiva', 'Pensione anticipata contributiva', 'Per chi ha il primo contributo dopo il 1995: 64 anni e 20 anni di contributi effettivi, se la pensione è abbastanza alta.', ['dl201_art24', 'inps_circ_28_2026', 'l199_2025', 'inps_circ_19_2026', 'inps_assegno_sociale']);
  if (p.prima_1996 !== false) {
    u.requisiti.push(req('Primo contributo dopo il 1995', p.prima_1996 === null ? 'dato' : 'no'));
    u.esito = p.prima_1996 === null ? 'dato' : 'no';
    if (p.prima_1996) u.manca.push('Vale solo per chi non ha contributi prima del 1996 (sistema contributivo puro).');
    else u.manca.push('Se hai contributi prima del 1996.');
    return u;
  }
  const eta = (anno) => perAnno(R.contributiva_eta, anno);
  const contr = (anno) => perAnno(R.contributiva_contributi, anno);
  const r = trova(ctx, eta, contr);
  const annoR = r.stato === 'ok' ? annoDi(r.M) : annoDi(ctx.M0);
  const s = soglia(p, annoR);
  u.requisiti.push(req('Primo contributo dopo il 1995', 'si'));
  u.requisiti.push(req(`Età: ${durata(eta(annoR))}`, r.stato === 'ok' || ctx.M0 - ctx.B >= eta(annoR) ? 'si' : 'no'));
  u.requisiti.push(req(`Contributi effettivi: ${durata(contr(annoR))}`, ctx.C0 === null ? 'dato' : r.stato === 'ok' || ctx.C0 >= contr(annoR) ? 'si' : r.stato === 'dato' ? 'dato' : 'no'));
  const esempio = annoR <= 2026 ? ` (nel 2026 almeno ${eur(Math.round(s * V.assegno_sociale_2026 * 100) / 100)} al mese)` : '';
  u.requisiti.push(req(`Importo della prima rata: almeno ${String(s).replace('.', ',')} volte l'assegno sociale${esempio}`, 'dato', `L'importo non lo calcolo: verificalo con «La mia pensione futura». ${p.sesso === 'donna' ? 'Per le donne la soglia scende a 2,8 volte con un figlio e a 2,6 con due o più.' : ''} Dal 2030 la soglia generale sale a 3,2 volte. La previdenza complementare non conta più per raggiungerla (legge 199/2025, comma 195).`.trim()));
  u.requisiti.push(req('Fine del rapporto di lavoro', 'dato', 'La legge la chiede per questa uscita.'));
  u.esito = 'dato';
  chiudi(u, ctx, r, R.contributiva_finestra, { etaGia: eta(annoR), contrGia: contr(annoR) });
  if (u.esito === 'no') u.manca.push(mancaOggi(ctx, eta(annoR), contr(annoR)) || 'Con i contributi che versi non arrivi al requisito.');
  u.note.push('Fino all\'età della vecchiaia l\'importo lordo non può superare 5 volte il trattamento minimo.');
  return u;
}

/** Quali condizioni dei precoci e dell'APE sociale hai (lettere a-d). */
function condizioni(p, { naspiDaTre }) {
  const out = [];
  if (p.disoccupato === 'naspi_finita_3' || (!naspiDaTre && p.disoccupato === 'naspi_finita')) out.push('disoccupazione');
  if (p.caregiver) out.push('assistenza a un familiare con disabilità grave');
  if (p.invalidita74) out.push('invalidità almeno al 74%');
  if (GRAVOSI.has(p.lavoro) && DIPENDENTI.has(p.gestione ?? 'privato')) out.push('lavoro gravoso');
  return out;
}

function precoci(ctx) {
  const { p } = ctx;
  const u = nuovaUscita('precoci', 'Lavoratori precoci (quota 41)', 'Con 41 anni di contributi a qualunque età, per chi ha lavorato almeno 12 mesi prima dei 19 anni e si trova in una situazione di bisogno.', ['l232_2016', 'dl4_2019_art17', 'inps_circ_28_2026', 'l199_2025', 'inps_precoci']);
  let dato = false;
  if (p.prima_1996 === false) {
    u.requisiti.push(req('Contributi prima del 1996', 'no'));
    u.manca.push('La legge 232/2016 la riserva a chi ha contributi prima del 1996.');
    return u;
  }
  u.requisiti.push(req('Contributi prima del 1996', p.prima_1996 ? 'si' : 'dato'));
  if (p.prima_1996 === null) dato = true;
  u.requisiti.push(req('Almeno 12 mesi di contributi da lavoro effettivo prima dei 19 anni', p.precoce === true ? 'si' : p.precoce === false ? 'no' : 'dato'));
  if (p.precoce === false) { u.manca.push('Servono 12 mesi di lavoro prima dei 19 anni.'); return u; }
  if (p.precoce === null) dato = true;
  const usurante = USURANTI.has(p.lavoro) && DIPENDENTI.has(p.gestione ?? 'privato');
  let cond = condizioni(p, { naspiDaTre: true });
  // Per i precoci la disoccupazione vale dopo licenziamento, dimissioni per giusta causa o risoluzione consensuale, non dopo un contratto a termine.
  let disoccDubbia = false;
  if (cond.includes('disoccupazione') && p.fine_termine !== false) {
    cond = cond.filter((c) => c !== 'disoccupazione');
    disoccDubbia = p.fine_termine === null;
  }
  if (usurante) cond.push('lavoro usurante');
  const lettD = cond.includes('lavoro gravoso') || cond.includes('lavoro usurante');
  if (cond.length) u.requisiti.push(req(`Condizione: ${cond.join(', ')}`, 'si'));
  else if (p.disoccupato === 'naspi_finita') { u.requisiti.push(req('Disoccupazione: la NASpI deve essere finita da almeno 3 mesi', 'dato')); dato = true; }
  else if (disoccDubbia) { u.requisiti.push(req('Disoccupazione dopo licenziamento, dimissioni per giusta causa o risoluzione consensuale', 'dato', 'Non vale se il lavoro è finito per la scadenza di un contratto a termine.')); dato = true; }
  else {
    const ignote = [p.disoccupato, p.caregiver, p.invalidita74, p.lavoro].some((x) => x === null);
    u.requisiti.push(req('Una condizione tra disoccupazione, assistenza a un familiare disabile, invalidità almeno al 74%, lavoro gravoso o usurante', ignote ? 'dato' : 'no'));
    if (!ignote) { u.manca.push('Non hai indicato nessuna delle condizioni richieste.'); return u; }
    dato = true;
  }
  // L. 199/2025, c. 188: per gravosi e usuranti (lettera d) il requisito resta 41 anni fino al 2028.
  const contr = (anno) => (lettD && anno <= ULTIMO_ANNO_NOTO ? perAnno(R.precoci_gravosi_contributi, anno) : perAnno(R.precoci_contributi, anno));
  const r = trova(ctx, null, contr);
  const annoR = r.stato === 'ok' ? annoDi(r.M) : annoDi(ctx.M0);
  const finestra = finestraAnticipata(ctx, annoR);
  u.requisiti.push(req(`Contributi: ${durata(contr(annoR))} (requisito del ${annoR})`, ctx.C0 === null ? 'dato' : r.stato === 'ok' ? 'si' : r.stato === 'dato' ? 'dato' : 'no'));
  u.requisiti.push(req(`Finestra: ${durata(finestra)}`, 'si'));
  if (dato) u.esito = 'dato';
  chiudi(u, ctx, r, finestra, { etaGia: null, contrGia: contr(annoR) });
  if (dato && u.esito === 'si') u.esito = 'dato';
  if (u.esito === 'no') u.manca.push(mancaOggi(ctx, null, contr(annoR)) || 'Con i contributi che versi non arrivi al requisito.');
  // Domanda di riconoscimento delle condizioni: 31 marzo, 15 luglio, 30 novembre dell'anno in cui maturi i requisiti.
  if (u.esito !== 'no' && r.stato === 'ok') {
    const anno = Math.max(annoR, annoDi(ctx.M0));
    const date = V.precoci_domande.map((md) => `${anno}-${md}`).filter((d) => d >= ctx.oggi);
    const prossima = date[0] || `${anno + 1}-${V.precoci_domande[0]}`;
    u.scadenze.push({ data: prossima, titolo: 'Domanda all\'INPS per il riconoscimento di lavoratore precoce', testo: 'Prima della domanda di pensione serve il riconoscimento delle condizioni. Scadenze: 31 marzo, 15 luglio, 30 novembre; dopo il 31 marzo la domanda è accolta solo se restano fondi.' });
  }
  u.note.push('Non è cumulabile con redditi da lavoro per i mesi di anticipo rispetto alla pensione ordinaria.');
  return u;
}

function apeSociale(ctx) {
  const { p } = ctx;
  const u = nuovaUscita('ape', 'APE sociale', 'Un\'indennità ponte fino alla vecchiaia (al massimo 1.500 euro al mese), da 63 anni e 5 mesi, per chi è in difficoltà. Misura sperimentale: vale per chi ha i requisiti entro il 31 dicembre 2026.', ['l199_2025', 'l232_2016', 'inps_circ_19_2026', 'inps_ape']);
  u.sperimentale = true;
  const Mfine = mese(2026, 12);
  if (ctx.M0 > Mfine) { u.manca.push('La misura valeva fino al 31 dicembre 2026: controlla se è stata prorogata.'); return u; }
  const cond = condizioni(p, { naspiDaTre: false });
  const gravoso = cond.includes('lavoro gravoso');
  const altre = cond.filter((c) => c !== 'lavoro gravoso');
  const riduzione = p.sesso === 'donna' ? Math.min(2, p.figli ?? 0) * 12 : 0;
  // Con una condizione tra a)-c) bastano 30 anni; per i soli gravosi 36 (32 per alcuni edili e ceramisti).
  const contrBase = altre.length ? R.ape_contributi : R.ape_contributi_gravosi;
  const contrReq = contrBase - riduzione;
  let dato = false;
  if (cond.length) u.requisiti.push(req(`Condizione: ${cond.join(', ')}`, 'si', cond.includes('disoccupazione') && p.fine_termine === true ? 'Dopo un contratto a termine servono almeno 18 mesi di lavoro dipendente nei 36 mesi prima della fine.' : null));
  else if (p.disoccupato === 'naspi_in_corso') { u.requisiti.push(req('Disoccupazione: la NASpI deve essere finita', 'no')); u.manca.push('Puoi chiederla quando la NASpI è finita, entro il 2026.'); }
  else {
    const ignote = [p.disoccupato, p.caregiver, p.invalidita74, p.lavoro].some((x) => x === null);
    u.requisiti.push(req('Una condizione tra disoccupazione con NASpI finita, assistenza a un familiare disabile, invalidità almeno al 74%, lavoro gravoso', ignote ? 'dato' : 'no'));
    if (!ignote) { u.manca.push('Non hai indicato nessuna delle condizioni richieste.'); return u; }
    dato = true;
  }
  if (!cond.length && p.disoccupato === 'naspi_in_corso') return u;
  const r = trova(ctx, () => R.ape_eta, () => contrReq, Mfine);
  u.requisiti.push(req(`Età: ${durata(R.ape_eta)} entro il 31 dicembre 2026`, Mfine - ctx.B >= R.ape_eta ? 'si' : 'no'));
  u.requisiti.push(req(`Contributi: ${durata(contrReq)} entro il 31 dicembre 2026${riduzione ? ` (12 mesi in meno per ogni figlio, al massimo 2 anni)` : ''}`, ctx.C0 === null ? 'dato' : r.stato === 'ok' ? 'si' : r.stato === 'dato' ? 'dato' : 'no', gravoso && !altre.length ? 'Per i lavori gravosi servono 36 anni (32 per alcuni operai edili e ceramisti).' : null));
  u.requisiti.push(req('Smettere di lavorare e non avere già una pensione diretta', 'dato', 'Non è cumulabile con redditi da lavoro, salvo lavoro autonomo occasionale fino a 5.000 euro lordi l\'anno (legge 199/2025, comma 163).'));
  if (dato) u.esito = 'dato';
  if (r.stato === 'ok') {
    u.maturazione = r.gia ? null : meseIso(r.M);
    u.gia = r.gia;
    u.decorrenza = primoGiorno(Math.max(ctx.M0 + 1, r.M + 1));
    if (!dato) u.esito = 'si';
    u.note.push('L\'indennità parte dal primo giorno del mese dopo la domanda di APE, dopo il riconoscimento delle condizioni. Dura fino all\'età della vecchiaia.');
    const domanda = V.ape_domande_2026.find((d) => d >= ctx.oggi);
    if (domanda) u.scadenze.push({ data: domanda, titolo: 'Ultimo giorno per chiedere all\'INPS il riconoscimento dell\'APE sociale', testo: domanda.endsWith('11-30') ? 'È l\'ultima finestra del 2026: la domanda è accolta solo se restano fondi.' : 'Le finestre del 2026: 31 marzo, 15 luglio, 30 novembre.' });
    else u.note.push('Le domande di riconoscimento per il 2026 sono chiuse.');
  } else if (r.stato === 'dato') {
    u.esito = 'dato';
    u.manca.push(r.manca === 'mesi_anno' ? 'Quanti mesi di contributi verserai fino a dicembre.' : 'Quanti anni e mesi di contributi hai già.');
  } else {
    u.esito = 'no';
    u.manca.push(`Entro il 31 dicembre 2026 non arrivi ai requisiti. ${mancaOggi(ctx, R.ape_eta, contrReq)}`.trim());
  }
  return u;
}

function opzioneDonna(ctx) {
  const { p } = ctx;
  const u = nuovaUscita('opzione_donna', 'Opzione donna', 'Per le lavoratrici che al 31 dicembre 2024 avevano 35 anni di contributi e 61 anni (meno uno per figlio, fino a due), in una situazione di bisogno. Calcolo tutto contributivo: l\'importo è più basso.', ['dl4_2019_art16', 'inps_circ_19_2026', 'dl78_2010_art12']);
  u.sperimentale = true;
  if (p.sesso === 'uomo') { u.manca.push('È riservata alle donne.'); u.requisiti.push(req('Donna', 'no')); return u; }
  if (!p.sesso) { u.esito = 'dato'; u.requisiti.push(req('Donna', 'dato')); return u; }
  const Mcut = mese(2024, 12);
  const licenziata = Boolean(p.disoccupato && p.disoccupato !== 'no' && p.fine_termine !== true);
  const a = allaData(ctx, Mcut);
  let dato = false;
  const condSi = p.caregiver || p.invalidita74;
  if (condSi) u.requisiti.push(req(`Condizione: ${[p.caregiver && 'assistenza a un familiare con disabilità grave', p.invalidita74 && 'invalidità almeno al 74%'].filter(Boolean).join(', ')}`, 'si'));
  else if (licenziata) { u.requisiti.push(req('Condizione: licenziata, o dipendente di un\'impresa con tavolo di crisi al Ministero', 'dato', 'Vale per il licenziamento, non per dimissioni o fine del contratto.')); dato = true; }
  else {
    const ignote = [p.caregiver, p.invalidita74, p.disoccupato].some((x) => x === null);
    u.requisiti.push(req('Una condizione: caregiver, invalidità almeno al 74%, licenziata o in un\'impresa in crisi', ignote ? 'dato' : 'no'));
    if (!ignote) { u.manca.push('Non hai indicato nessuna delle condizioni richieste.'); return u; }
    dato = true;
  }
  // 61 anni, uno in meno per figlio fino a due; per le licenziate la riduzione di due anni vale sempre.
  const etaFigli = R.opzione_donna_eta - Math.min(2, p.figli ?? 0) * 12;
  const etaMin = R.opzione_donna_eta - 24;
  let etaEsito = 'no';
  if (a.eta >= etaFigli) etaEsito = 'si';
  else if (a.eta >= etaMin && (licenziata || p.figli === null)) etaEsito = 'dato';
  u.requisiti.push(req(`Età al 31 dicembre 2024: almeno ${durata(etaFigli)}`, etaEsito, etaEsito === 'dato' ? (licenziata ? 'Per le licenziate basta avere 59 anni.' : 'Con figli il requisito scende di un anno per figlio, fino a due: indica quanti figli hai.') : (etaFigli < R.opzione_donna_eta ? 'Un anno in meno per ogni figlio, fino a due.' : null)));
  let contrEsito = 'dato';
  if (a.contrMax !== null) contrEsito = a.contrMax < R.opzione_donna_contributi ? 'no' : a.contrMin >= R.opzione_donna_contributi ? 'si' : 'dato';
  u.requisiti.push(req(`Contributi al 31 dicembre 2024: almeno ${durata(R.opzione_donna_contributi)}`, contrEsito, contrEsito === 'dato' ? 'Dai contributi di oggi non posso sapere quanti ne avevi a fine 2024: controlla l\'estratto conto.' : null));
  if (etaEsito === 'no') { u.manca.push('Al 31 dicembre 2024 non avevi l\'età richiesta: la misura non è stata prorogata.'); u.esito = 'no'; return u; }
  if (contrEsito === 'no') { u.manca.push('Al 31 dicembre 2024 non avevi 35 anni di contributi: la misura non è stata prorogata.'); u.esito = 'no'; return u; }
  if (contrEsito === 'dato' || etaEsito === 'dato') dato = true;
  const autonoma = p.gestione === 'autonomo' || p.gestione === 'separata';
  const finestra = autonoma ? R.opzione_donna_finestra_autonome : R.opzione_donna_finestra_dipendenti;
  u.requisiti.push(req(`Finestra: ${finestra} mesi dalla maturazione dei requisiti`, 'si'));
  u.esito = dato ? 'dato' : 'si';
  u.gia = true;
  u.finestra = finestra;
  u.decorrenza = primoGiorno(decorrenza(ctx, Mcut, finestra));
  u.note.push('Il diritto maturato entro il 2024 resta: puoi chiederla anche adesso. L\'importo è calcolato tutto con il sistema contributivo.');
  return u;
}

function quote(ctx) {
  const { p } = ctx;
  const u = nuovaUscita('quota', 'Quota 103 (e Quote 100 e 102)', 'Uscite sperimentali non prorogate: valgono solo per chi ha maturato i requisiti entro la loro scadenza. Quota 103: 62 anni e 41 di contributi entro il 31 dicembre 2025, con calcolo contributivo.', ['inps_q103', 'inps_circ_19_2026', 'dl4_2019_art14']);
  u.sperimentale = true;
  const pubblico = p.gestione && DIPENDENTI.has(p.gestione) && p.gestione !== 'privato';
  const prove = [
    { nome: 'Quota 103', cut: mese(2025, 12), eta: R.quota103_eta, contr: R.quota103_contributi, finestra: pubblico ? R.quota103_finestra_2024[1] : R.quota103_finestra_2024[0] },
    { nome: 'Quota 102', cut: mese(2022, 12), eta: R.quota102_eta, contr: R.quota100_contributi, finestra: pubblico ? R.quota100_finestra[1] : R.quota100_finestra[0] },
    { nome: 'Quota 100', cut: mese(2021, 12), eta: R.quota100_eta, contr: R.quota100_contributi, finestra: pubblico ? R.quota100_finestra[1] : R.quota100_finestra[0] },
  ];
  let migliore = null;
  for (const q of prove) {
    const a = allaData(ctx, q.cut);
    const etaOk = a.eta >= q.eta;
    const c = a.contrMax === null ? 'dato' : a.contrMax < q.contr ? 'no' : a.contrMin >= q.contr ? 'si' : 'dato';
    q.esito = !etaOk || c === 'no' ? 'no' : c;
    q.etaOk = etaOk; q.c = c;
    if (!migliore && q.esito === 'si') migliore = q;
  }
  const q103 = prove[0];
  migliore ||= prove.find((q) => q.esito === 'dato');
  const ref = migliore || q103;
  const fine = scrittoData(ultimoGiorno(ref.cut));
  u.nome = migliore ? `${migliore.nome} (requisiti già maturati)` : u.nome;
  u.requisiti.push(req(`Età al ${fine}: almeno ${durata(ref.eta)}`, ref.etaOk ? 'si' : 'no'));
  u.requisiti.push(req(`Contributi al ${fine}: almeno ${durata(ref.contr)}`, ref.c, ref.c === 'dato' ? 'Dai contributi di oggi non posso sapere quanti ne avevi allora: controlla l\'estratto conto.' : null));
  if (!migliore) { u.manca.push('Non hai maturato i requisiti entro le scadenze: queste uscite non sono state prorogate dalla legge di bilancio 2026.'); return u; }
  u.requisiti.push(req(`Finestra: ${migliore.finestra} mesi`, 'si'));
  u.esito = migliore.esito;
  u.gia = true;
  u.finestra = migliore.finestra;
  u.decorrenza = primoGiorno(decorrenza(ctx, migliore.cut, migliore.finestra));
  u.note.push('Il diritto maturato resta: puoi chiederla anche adesso. Fino all\'età della vecchiaia non è cumulabile con redditi da lavoro, salvo lavoro autonomo occasionale fino a 5.000 euro lordi l\'anno.');
  if (migliore.nome === 'Quota 103') u.note.push('Con Quota 103 la pensione è calcolata tutta con il sistema contributivo e, fino alla vecchiaia, non supera 4 volte il trattamento minimo.');
  if (pubblico) u.note.push('Per i dipendenti pubblici la domanda di cessazione va presentata con il preavviso previsto: verificalo con il tuo ufficio del personale.');
  return u;
}

function usuranti(ctx) {
  const { p } = ctx;
  const u = nuovaUscita('usuranti', 'Lavori usuranti', 'Per chi ha fatto lavori usuranti o notturni per almeno 7 anni negli ultimi 10 (o metà della vita lavorativa): età più bassa e «quota» tra età e contributi, senza finestra.', ['dlgs67_2011', 'l232_2016', 'inps_circ_28_2026', 'l199_2025', 'inps_usuranti']);
  if (!USURANTI.has(p.lavoro)) {
    u.requisiti.push(req('Lavoro usurante o notturno', p.lavoro === null ? 'dato' : 'no'));
    u.esito = p.lavoro === null ? 'dato' : 'no';
    if (p.lavoro !== null) u.manca.push('Vale solo per lavori usuranti, notturni, alla catena o autisti del trasporto pubblico.');
    return u;
  }
  const autonomo = p.gestione === 'autonomo' || p.gestione === 'separata';
  const [eta, quota] = R.usuranti[p.lavoro][autonomo ? 'autonomo' : 'dipendente'];
  const quotaMesi = Math.ceil(quota * 12);
  const contrMin = R.usuranti_contributi;
  // La quota è età + contributi: con l'età fissata, i contributi devono valere almeno quota - età.
  const contr = (anno, M) => Math.max(contrMin, quotaMesi - (M - ctx.B));
  const r = trova(ctx, () => eta, contr);
  u.requisiti.push(req('Lavoro usurante o notturno per almeno 7 anni negli ultimi 10, o per metà della vita lavorativa', 'si'));
  u.requisiti.push(req(`Età: almeno ${durata(eta)}`, r.stato === 'ok' || ctx.M0 - ctx.B >= eta ? 'si' : 'no'));
  u.requisiti.push(req(`Contributi: almeno ${durata(contrMin)}`, ctx.C0 === null ? 'dato' : r.stato === 'ok' || ctx.C0 >= contrMin ? 'si' : r.stato === 'dato' ? 'dato' : 'no'));
  u.requisiti.push(req(`Quota (età + contributi): ${String(quota).replace('.', ',')}`, r.stato === 'ok' ? 'si' : ctx.C0 === null ? 'dato' : 'no'));
  chiudi(u, ctx, r, 0, { etaGia: eta, contrGia: Math.max(contrMin, quotaMesi - eta) });
  if (r.stato === 'ok' && annoDi(r.M) > R.usuranti_validi_fino) {
    u.previsione = true;
    u.note.push(`I requisiti degli usuranti sono fermi fino al ${R.usuranti_validi_fino}; dopo dipendono dalle prossime norme.`);
  }
  if (u.esito === 'no') u.manca.push(mancaOggi(ctx, eta, contrMin) || 'Con i contributi che versi non arrivi alla quota.');
  if (r.stato === 'ok') {
    const annoMat = Math.max(annoDi(r.M), annoDi(ctx.M0));
    const termine = `${annoMat - 1}-${V.usuranti_domanda}`;
    if (termine >= ctx.oggi) u.scadenze.push({ data: termine, titolo: 'Domanda all\'INPS per il riconoscimento del lavoro usurante', testo: `Va presentata entro il 1° maggio dell'anno prima di quello in cui maturi i requisiti (${annoMat}).` });
    else {
      u.note.push(`La domanda di riconoscimento andava presentata entro il ${scrittoData(termine)}: se la presenti ora, la pensione parte da 1 a 3 mesi più tardi a seconda del ritardo.`);
      const ritardo = (ctx.M0 - mese(annoMat - 1, 5));
      const slitta = ritardo <= 1 ? 1 : ritardo <= 3 ? 2 : 3;
      const [a, m] = u.decorrenza.split('-').map(Number);
      u.decorrenza = primoGiorno(mese(a, m) + slitta);
    }
  }
  return u;
}

const eur = (n) => `${Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} euro`;

// ---------- l'esito ----------

/** I dati che mancano per cominciare. */
export function mancanti(p) {
  const m = [];
  if (!p.nascita_anno || !p.nascita_mese) m.push('nascita');
  if (p.contributi === null) m.push('contributi');
  if (p.mesi_anno === null) m.push('mesi_anno');
  if (!p.sesso) m.push('sesso');
  if (p.prima_1996 === null) m.push('prima_1996');
  if (!p.gestione) m.push('gestione');
  return m;
}

/** Tabella degli adeguamenti alla speranza di vita, per anno. */
export function adeguamenti() {
  return [2026, 2027, 2028, 2029].map((anno) => ({
    anno,
    previsione: anno > ULTIMO_ANNO_NOTO,
    vecchiaia: durata(perAnno(R.vecchiaia_eta, anno)),
    anticipata_uomini: durata(perAnno(R.anticipata_uomini, anno)),
    anticipata_donne: durata(perAnno(R.anticipata_donne, anno)),
    contributiva: `${durata(perAnno(R.contributiva_eta, anno))} e ${durata(perAnno(R.contributiva_contributi, anno))}`,
    precoci: durata(perAnno(R.precoci_contributi, anno)),
  }));
}

const ORDINE = { si: 0, dato: 1, no: 2 };

/**
 * Funzione principale: le date di pensione possibili.
 * @param persona { nascita_mese, nascita_anno, sesso: 'donna'|'uomo', contributi_anni, contributi_mesi,
 *   mesi_anno (0-12), prima_1996 (bool), gestione (chiave di GESTIONI), precoce (bool),
 *   lavoro ('no'|'gravoso_7_10'|'gravoso_6_7'|'usurante'|'notturno_72_77'|'notturno_64_71'),
 *   invalidita74 (bool), caregiver (bool), disoccupato ('no'|'naspi_finita_3'|'naspi_finita'|'naspi_in_corso'), figli (n) }
 * @param oggi data 'AAAA-MM-GG' (facoltativa)
 * @returns { uscite[], prima, scadenze[], avvertenze[], mancanti[], adeguamenti[], fonti[], verificato }
 */
export function datePensione(persona = {}, oggi) {
  const p = normalizza(persona);
  const M0 = oggiIdx(oggi);
  const oggiIso = isoDi(oggi);
  const manca = mancanti(p);
  const avvertenze = [
    'L\'importo della pensione non lo calcolo: per una stima usa «La mia pensione futura» sul sito dell\'INPS, con SPID o CIE.',
    'APE sociale è una misura sperimentale che vale solo fino al 31 dicembre 2026, salvo proroga. Opzione donna e Quota 103 non sono state prorogate: valgono solo per chi aveva già i requisiti.',
    'La legge di bilancio 2027 è in discussione in Parlamento e potrebbe cambiare queste regole: qui ci sono solo le norme in vigore.',
    'Le date sono calcolate al mese, con i contributi che dichiari. Il conto esatto lo fa l\'INPS sull\'estratto conto contributivo: prima di decidere, fallo controllare a un patronato (gratis).',
  ];
  const base = { verificato: VERIFICATO, oggi: oggiIso, avvertenze, adeguamenti: adeguamenti(), mancanti: manca, persona: p };
  if (manca.includes('nascita')) return { ...base, uscite: [], prima: null, scadenze: [], fonti: [] };
  const B = mese(p.nascita_anno, p.nascita_mese);
  if (B > M0 || M0 - B < 14 * 12) return { ...base, mancanti: ['nascita'], uscite: [], prima: null, scadenze: [], fonti: [], errore: 'La data di nascita non sembra giusta.' };
  const ctx = { p, B, M0, C0: p.contributi, rate: p.mesi_anno, oggi: oggiIso };
  const uscite = [vecchiaia(ctx), vecchiaia71(ctx), anticipata(ctx), contributiva(ctx), precoci(ctx), apeSociale(ctx), opzioneDonna(ctx), quote(ctx), usuranti(ctx)]
    .map((u) => ({ ...u, manca: u.manca.filter(Boolean) }));
  // Le uscite che non riguardano la persona per categoria (contributivo/misto) restano in fondo.
  uscite.sort((a, b) => (ORDINE[a.esito] - ORDINE[b.esito]) || ((a.decorrenza || '9999') < (b.decorrenza || '9999') ? -1 : (a.decorrenza || '9999') > (b.decorrenza || '9999') ? 1 : 0));
  const prima = uscite.find((u) => u.esito === 'si' && u.decorrenza) || null;
  const primaForse = uscite.filter((u) => u.esito !== 'no' && u.decorrenza).sort((a, b) => (a.decorrenza < b.decorrenza ? -1 : 1))[0] || null;

  const scadenze = [];
  for (const u of uscite) for (const s of u.scadenze) scadenze.push({ ...s, uscita: u.id });
  const candidata = prima || primaForse;
  if (candidata && candidata.id !== 'ape') {
    const Md = mese(...candidata.decorrenza.split('-').slice(0, 2).map(Number));
    const entro = ultimoGiorno(Md - 1);
    if (entro >= oggiIso) scadenze.push({ data: entro, titolo: `Domanda di pensione (${candidata.nome})`, testo: `Per partire dal ${scrittoData(candidata.decorrenza)} la domanda deve arrivare all'INPS prima: se arriva dopo, la pensione parte dal mese successivo alla domanda. I dipendenti devono anche dare le dimissioni con il preavviso del contratto.`, uscita: candidata.id });
    const controllo = ultimoGiorno(Md - 13);
    if (controllo > oggiIso) scadenze.push({ data: controllo, titolo: 'Controlla l\'estratto conto contributivo', testo: 'Un anno prima della data, verifica che tutti i contributi siano registrati: se manca qualcosa, chiedi la correzione all\'INPS.', uscita: candidata.id });
  }
  scadenze.sort((a, b) => (a.data < b.data ? -1 : 1));
  const chiavi = [...new Set(uscite.filter((u) => u.esito !== 'no').flatMap((u) => u.fonti).concat(['inps_pensione_futura', 'inps_posizione']))];
  const fonti = chiavi.map((k) => ({ chiave: k, ...FONTI.fonti[k] })).filter((f) => f.url);
  return { ...base, uscite, prima, primaForse, scadenze, fonti };
}

// ---------- in testo semplice (server MCP) ----------

const SEGNO = { si: 'sì', no: 'no', dato: 'serve un dato' };

/** L'esito in testo semplice, per un assistente AI o per la stampa. */
export function testo(esito) {
  if (!esito) return '';
  const righe = [];
  if (esito.errore) righe.push(esito.errore);
  if (!esito.uscite?.length) {
    righe.push('Per calcolare le date servono almeno mese e anno di nascita e i contributi già versati.');
    return righe.join('\n');
  }
  const c = esito.prima || esito.primaForse;
  if (esito.prima) righe.push(`Prima uscita possibile: ${esito.prima.nome}, dal ${scrittoData(esito.prima.decorrenza)}.`);
  else if (c) righe.push(`Prima uscita possibile, se confermi i dati che mancano: ${c.nome}, dal ${scrittoData(c.decorrenza)}.`);
  if (esito.prima && esito.primaForse && esito.primaForse.decorrenza < esito.prima.decorrenza) righe.push(`Forse prima: ${esito.primaForse.nome}, dal ${scrittoData(esito.primaForse.decorrenza)}, se confermi i requisiti segnati «serve un dato».`);
  else righe.push('Con i dati indicati non trovo una data di pensione.');
  righe.push(`Regole verificate il ${scrittoData(esito.verificato)}.`);
  for (const u of esito.uscite) {
    righe.push('');
    const quando = u.decorrenza ? ` dal ${scrittoData(u.decorrenza)}${u.previsione ? ' (previsione)' : ''}` : '';
    righe.push(`${u.nome}: ${SEGNO[u.esito]}${quando}`);
    if (u.maturazione) righe.push(`  Requisiti maturati: ${scritto(mese(...u.maturazione.split('-').map(Number)))}${u.finestra ? `, poi finestra di ${durata(u.finestra)}` : ''}.`);
    for (const r of u.requisiti) righe.push(`  - ${r.testo}: ${SEGNO[r.esito]}${r.nota ? ` (${r.nota})` : ''}`);
    for (const m of u.manca) righe.push(`  Manca: ${m}`);
    for (const n of u.note) righe.push(`  Nota: ${n}`);
  }
  if (esito.scadenze?.length) {
    righe.push('', 'Scadenze:');
    for (const s of esito.scadenze) righe.push(`- ${scrittoData(s.data)}: ${s.titolo}. ${s.testo}`);
  }
  righe.push('', 'Avvertenze:');
  for (const a of esito.avvertenze) righe.push(`- ${a}`);
  if (esito.fonti?.length) {
    righe.push('', 'Fonti:');
    for (const f of esito.fonti) righe.push(`- ${f.titolo}: ${f.url}`);
  }
  return righe.join('\n');
}
