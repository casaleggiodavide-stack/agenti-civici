// Regole di «Quanto risparmi in bolletta?»: la spesa annua stimata di ogni offerta del mercato libero per la casa,
// ricostruita con la stessa logica del Portale Offerte di ARERA e Acquirente Unico («Regole per il calcolo della spesa
// annua stimata», versione 4.0 del 16/2/2026), con le componenti regolate, le accise e l'IVA vigenti.
// Funzioni pure: nessun accesso alla pagina né alla rete. I dati li prepara scripts/bollette-dati.py.

import PARAMETRI from './dati/parametri.js';

export const VERIFICATO = PARAMETRI.verificato;

const ARERA = 'https://www.arera.it/atlante-per-il-consumatore/';
export const FONTI = {
  regole: { titolo: 'Acquirente Unico, Regole per il calcolo della spesa annua stimata, versione 4.0 (16/2/2026)', url: 'https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/7d0a872b48e8796c84366afedd2ce7ec.pdf' },
  opendata: { titolo: 'Portale Offerte, Open Data: offerte del mercato libero e parametri', url: 'https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page' },
  portale: { titolo: 'Portale Offerte: confronta le offerte (anche con il codice offerta)', url: 'https://www.ilportaleofferte.it/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page' },
  accise_luce: { titolo: 'D.lgs. 504/1995, art. 52, comma 3, lettera e): consumi nelle abitazioni di residenza fino a 3 kW, primi 150 kWh al mese', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1995-10-26;504~art52' },
  accise_gas: { titolo: PARAMETRI.accise_gas.fonte, url: PARAMETRI.accise_gas.url },
  ex_casmez: { titolo: PARAMETRI.ex_casmez.fonte + ' (territori dell\'ex Cassa per il Mezzogiorno)', url: PARAMETRI.ex_casmez.url },
  addizionale: { titolo: PARAMETRI.addizionali_fonte.titolo, url: PARAMETRI.addizionali_fonte.url },
  iva: { titolo: 'DPR 633/1972, tabella A, parte III, n. 103 e n. 127-bis: IVA al 10% per luce e gas per uso domestico (gas: primi 480 mc l\'anno)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1972-10-26;633' },
  ccr: { titolo: PARAMETRI.ccr.fonte, url: PARAMETRI.ccr.url },
  cambio: { titolo: 'ARERA, Atlante: cosa occorre fare per cambiare venditore', url: ARERA + 'gas/il-mercato-dellenergia/il-mercato-libero/cosa-occorre-fare-per-cambiare-venditore' },
  tempi: { titolo: 'ARERA, Atlante: quanto tempo serve per passare al nuovo venditore (Codice di condotta commerciale, art. 12)', url: ARERA + 'gas/il-mercato-dellenergia/il-mercato-libero/quanto-tempo-serve-per-passare-dal-vecchio-al-nuovo-venditore' },
  costo: { titolo: 'ARERA, Atlante: cambiare venditore ha un costo? (delibera 302/2016/R/com, all. A, art. 6)', url: ARERA + 'gas/il-mercato-dellenergia/il-mercato-libero/cambiare-venditore-ha-un-costo' },
  continuita: { titolo: 'ARERA, Atlante: se cambio venditore può interrompersi la fornitura?', url: ARERA + 'gas/il-mercato-dellenergia/il-mercato-libero/se-cambio-venditore-puo-interrompersi-fornitura' },
  recesso: { titolo: 'ARERA, Atlante: cosa è il recesso (delibera 302/2016/R/com; d.lgs. 210/2021, art. 7, comma 5)', url: ARERA + 'elettricita/il-contratto/recesso/cosa-e-il-recesso' },
  procura: { titolo: 'ARERA, Atlante: come avviene il recesso per cambiare venditore', url: ARERA + 'elettricita/il-contratto/recesso/come-avviene-il-recesso-per-cambiare-venditore' },
};

// I passi per cambiare fornitore, con la fonte di ognuno (pagine ARERA lette il 15/11/2026).
export const CAMBIO = [
  { titolo: 'Basta firmare il nuovo contratto', testo: 'Scegli l\'offerta e firmi con il nuovo venditore. È lui ad attivare il cambio e a mandare la disdetta al vecchio venditore per conto tuo: con il contratto gli dai la procura a recedere. Non devi scrivere al vecchio venditore.', fonte: FONTI.procura },
  { titolo: 'Non costa niente', testo: 'Cambiare venditore non ha costi. Possono esserci solo quelli del nuovo contratto: l\'imposta di bollo se dovuta e il deposito cauzionale o un\'altra garanzia, se il contratto li prevede.', fonte: FONTI.costo },
  { titolo: 'La luce e il gas non si interrompono', testo: 'Il cambio non comporta interruzioni né interventi sul contatore o sugli impianti.', fonte: FONTI.continuita },
  { titolo: 'Niente penali, con un\'eccezione da controllare', testo: 'Il recesso si può fare in qualsiasi momento, senza penali né spese di chiusura. Fanno eccezione i contratti della luce a prezzo fisso e a durata determinata: possono prevedere un onere se esci prima della scadenza, ma solo se è scritto nel contratto con l\'importo massimo, approvato e firmato da te, e indicato nella scheda sintetica. Prima di cambiare, guarda la scheda sintetica del tuo contratto attuale.', fonte: FONTI.recesso },
  { titolo: 'I tempi', testo: 'Di norma il cambio parte il primo giorno di un mese: se il nuovo venditore attiva la procedura entro il 10, il cambio decorre dal primo del mese dopo, altrimenti slitta di un mese. Servono di solito da uno a due mesi. La data prevista è scritta nel nuovo contratto.', fonte: FONTI.tempi },
  { titolo: 'Puoi ripensarci', testo: 'Se firmi a distanza (online, al telefono) o fuori dai negozi del venditore hai 14 giorni per ripensarci; 30 giorni se il contratto è nato da una visita a casa non richiesta. Il nuovo venditore aspetta questo termine prima di avviare il cambio, a meno che tu non chieda di partire prima.', fonte: FONTI.tempi },
];

// ---------- etichette ----------

export const TIPI = { F: 'prezzo fisso', V: 'prezzo variabile', M: 'prezzo misto', FLAT: 'a canone' };
export const ATTIVAZIONE = { '01': 'solo online', '02': 'da qualsiasi canale', '03': 'nei punti vendita', '04': 'al telefono', '05': 'tramite agenzia', '99': 'altro' };
export const PAGAMENTO = { '01': 'addebito in conto', '02': 'addebito sul conto postale', '03': 'carta di credito', '04': 'bollettino', '99': 'altro' };
export const CONDIZIONI = { '01': 'Attivazione', '02': 'Disattivazione', '03': 'Recesso', '04': 'Offerta pluriennale', '05': 'Onere per il recesso anticipato', '99': 'Altro' };
const INDICE_DI = { '01': 'PUN', '08': 'PUN', '12': 'PUN', '03': 'PSV', '10': 'PSV', '14': 'PSV', '06': 'PSV', '04': 'Psbil', '11': 'Psbil', '15': 'Psbil' };
const PERIODO_INDICE = { '01': 'trimestrale', '08': 'bimestrale', '12': 'mensile', '03': 'trimestrale', '10': 'bimestrale', '14': 'mensile', '06': 'mensile (CMEM)', '04': 'trimestrale', '11': 'bimestrale', '15': 'mensile' };

// Ripartizione convenzionale dei consumi domestici tra le fasce (Regole del Portale, cap. 3).
export const FASCE_DOMESTICHE = { F1: 0.33, F2: 0.31, F3: 0.36 };

// Scaglioni annui della tariffa di distribuzione gas e della componente UG2 (Regole del Portale, par. 4.1.2).
const SCAGLIONI_GAS = [120, 480, 1560, 5000, 80000, 200000];

const arrot = (x) => Math.round(x * 100) / 100;

/** Somma progressiva per scaglioni: [[limite superiore o null, prezzo], ...]. */
export function progressivo(consumo, scaglioni) {
  let tot = 0, da = 0;
  for (const [a, p] of scaglioni) {
    const fino = a === null || a === undefined ? Infinity : a;
    if (consumo > da) tot += (Math.min(consumo, fino) - da) * p;
    da = fino;
  }
  return tot;
}

// ---------- il profilo ----------

/** Controlla il profilo: cosa manca per calcolare. */
export function mancanti(p) {
  const m = [];
  if (!p || !['luce', 'gas'].includes(p.fornitura)) return ['fornitura'];
  if (!(p.consumo > 0)) m.push('consumo');
  if (!p.regione) m.push('comune');
  if (p.fornitura === 'luce') {
    if (!(p.potenza > 0)) m.push('potenza');
    if (typeof p.residente !== 'boolean') m.push('residente');
  }
  return m;
}

/** Territorio ex Cassa per il Mezzogiorno (accisa gas ridotta): true, false o null se dipende dal Comune. */
export function exCassaMezzogiorno(regione, comune, par = PARAMETRI) {
  const e = par.ex_casmez;
  const prov = comune ? String(comune).slice(0, 3) : null;
  if (e.regioni.includes(regione)) return true;
  if (prov && e.province.includes(prov)) return true;
  if (comune && e.comuni[comune]) return true;
  if (prov && e.province_in_parte.includes(prov)) return null;
  return false;
}

// ---------- le parti regolate, uguali per tutte le offerte ----------

/** Trasporto e gestione del contatore, oneri di sistema e accise per il profilo (senza IVA). */
export function quoteRegolate(p, par = PARAMETRI) {
  const C = p.consumo;
  if (p.fornitura === 'luce') {
    const L = par.luce, P = p.potenza;
    const rete = L.sigma1 + L.sigma2 * P + (L.sigma3 + L.uc3 + L.uc6p_d) * C + L.uc6s_d * P;
    const oneri = p.residente ? (L.asos_dr + L.arim_dr) * C : L.asos_dnr_f + L.arim_dnr_f + (L.asos_dnr_v + L.arim_dnr_v) * C;
    let tassabili = C;
    if (p.residente && P <= 3) {
      // Esenti i primi 150 kWh al mese (1.800 l'anno); oltre 2.640 kWh l'esenzione si riduce fino a sparire.
      if (C <= 1800) tassabili = 0;
      else if (C <= 2640) tassabili = C - 1800;
      else tassabili = C - Math.max(1800 - (C - 2640), 0);
    }
    const aliquota = !p.residente ? L.acc_c_nr : P <= 3 ? L.acc_c_r_l : L.acc_c_r_h;
    return { rete, oneri, accise: aliquota * tassabili, addizionale: 0, kwhTassati: tassabili };
  }
  const G = par.gas;
  const ambito = par.ambiti_gas[p.regione];
  if (!ambito) return null;
  const tau3 = SCAGLIONI_GAS.map((a, i) => [a, G[`tau3_f${i + 1}_a${ambito}`]]);
  const ug2 = SCAGLIONI_GAS.map((a, i) => [a, G[`ug2p_d_f${i + 1}`]]);
  const rete = G[`tau1_cc1_a${ambito}`] + G[`st_a${ambito}`] + G[`vr_a${ambito}`] + progressivo(C, tau3) + (G.qt + G.rs + G.ug1) * C;
  const oneri = G.ug2s + (G.re + G.ug3) * C + progressivo(C, ug2);
  const sud = p.exCasMez ?? exCassaMezzogiorno(p.regione, p.comune, par);
  const accise = progressivo(C, par.accise_gas[sud === true ? 'ex_cassa_mezzogiorno' : 'centro_nord']);
  const acciseSud = progressivo(C, par.accise_gas.ex_cassa_mezzogiorno);
  const add = par.addizionali_gas[p.regione];
  return { rete, oneri, accise, accise_alt: sud === null ? acciseSud : null, addizionale: add ? progressivo(C, add.scaglioni) : 0, ambito, exCasMez: sud };
}

// ---------- le parti dell'offerta ----------

/** Quota del consumo luce che cade in una fascia della componente, per la struttura di fasce dell'offerta. */
function quotaFascia(fascia, struttura) {
  if (!fascia) return 1;
  if (struttura === '01') return fascia === '01' ? 1 : 0;
  const F = FASCE_DOMESTICHE;
  return { '01': F.F1, '02': F.F2, '03': F.F3, '91': F.F2 + F.F3, '92': F.F1 + F.F3, '93': F.F1 + F.F2 }[fascia] ?? 0;
}

/**
 * Prezzo medio dell'anno di una componente per un gruppo di intervalli con la stessa unità e fascia:
 * gli scaglioni scelgono il prezzo in base al consumo annuo, i periodi di validità pesano per mesi,
 * il prezzo senza scaglione né periodo copre il resto (Regole del Portale, «Validità condizioni economiche»).
 */
function prezzoMedio(intervalli, C) {
  const base = intervalli.find((iv) => iv[3] == null && iv[5] == null);
  const scaglione = intervalli.find((iv) => iv[3] != null && C >= iv[3] && (iv[4] == null || C <= iv[4]));
  if (scaglione) return scaglione[2];
  const periodi = intervalli.filter((iv) => iv[5] != null && iv[3] == null);
  if (periodi.length) {
    const mesi = Math.min(12, periodi.reduce((s, iv) => s + iv[5], 0));
    return periodi.reduce((s, iv) => s + iv[2] * iv[5] / 12, 0) + (base ? base[2] : 0) * (12 - mesi) / 12;
  }
  return base ? base[2] : 0;
}

/** Perché un'offerta non si può stimare qui (null se si può). */
export function nonStimabile(of, fornitura) {
  if (!['F', 'V'].includes(of.t)) return 'prezzo misto o a canone';
  if (of.onni) return 'prezzo onnicomprensivo';
  if (fornitura === 'luce' && !['01', '03', '91'].includes(of.f || '01')) return 'fasce orarie particolari';
  if (of.t === 'V') {
    if (!of.idx?.length) return 'manca l\'indice';
    if (of.idx.some((x) => !INDICE_DI[x[0]] || (fornitura === 'luce') !== (INDICE_DI[x[0]] === 'PUN'))) return 'indice non gestito';
  }
  for (const [tipo] of of.disp || []) if (!['09', '10', '11', '12', '13', '14', '99'].includes(tipo)) return 'dispacciamento non pubblicato';
  for (const c of of.cr || []) if (['02', '06', '07'].includes(c)) return 'componente regolata non pubblicata (PPE, QTint o QTpsv)';
  for (const s of of.sc || []) if (s[0] === '04') return 'sconto sul servizio di tutela';
  if (of.t === 'F' && copertura(of, fornitura) < 0.99) return 'prezzo dell\'energia non indicato tra le componenti standard';
  return null;
}

/** Quante volte i prezzi per kWh o Smc dell'offerta coprono il consumo (1 = tutto il consumo ha un prezzo). */
export function copertura(of, fornitura) {
  const struttura = fornitura === 'luce' ? (of.f || '01') : '01';
  let q = 0;
  for (const [macro, , ivs] of of.comp || []) {
    if (macro !== '04' && macro !== '06') continue;
    for (const iv of ivs) if ((iv[0] === '03' || iv[0] === '04') && iv[3] == null && iv[5] == null) q += fornitura === 'luce' ? quotaFascia(iv[1] || null, struttura) : 1;
  }
  return q;
}

// Controlli di coerenza: prezzi oltre dieci volte i valori di mercato (di solito un'unità di misura sbagliata,
// per esempio €/MWh al posto di €/kWh) o sconti più grandi della spesa per la vendita.
export const LIMITI = { luce: 2.5, gas: 10 };
function incoerente(s, C, fornitura) {
  if (s.energia / C > LIMITI[fornitura]) return 'prezzo fuori scala (unità di misura da verificare)';
  if (s.energia + s.commercializzazione + s.dispacciamento + s.unaTantum - s.sconti < 0) return 'sconti più grandi della spesa per la vendita';
  return null;
}

/** L'offerta vale per questo profilo? Zona, residenza, consumo e potenza. */
export function compatibile(of, p) {
  if (of.z) {
    const z = of.z, prov = p.comune ? String(p.comune).slice(0, 3) : null;
    const dentro = (z.r || []).includes(p.regione) || (prov && (z.p || []).includes(prov)) || (p.comune && (z.m || []).includes(p.comune));
    if (!dentro) return 'zona';
  }
  if (p.fornitura === 'luce' && of.r === '01' && p.residente === false) return 'solo residenti';
  if (p.fornitura === 'luce' && of.r === '02' && p.residente === true) return 'solo non residenti';
  if (of.lim) {
    const [cmin, cmax, pmin, pmax] = of.lim;
    if (cmin != null && p.consumo < cmin) return 'consumo';
    if (cmax != null && cmax > 0 && p.consumo > cmax) return 'consumo';
    if (p.fornitura === 'luce' && pmin != null && p.potenza < pmin) return 'potenza';
    if (p.fornitura === 'luce' && pmax != null && pmax > 0 && p.potenza > pmax) return 'potenza';
  }
  return null;
}

/** Quota invernale (ottobre-marzo) del consumo di gas, dal profilo convenzionale del Portale. */
function quotaInverno(riscaldamento, par) {
  const pr = par.profili_gas[riscaldamento === false ? 'cottura' : 'riscaldamento'];
  const tot = pr.reduce((s, x) => s + x, 0);
  return pr.slice(0, 6).reduce((s, x) => s + x, 0) / tot;
}

/**
 * La spesa annua stimata di un'offerta per il profilo, voce per voce.
 * idx: valori degli indici da usare ({PUN, PSV, Psbil}); di default l'ultimo valore pubblicato.
 */
export function spesaOfferta(of, p, par = PARAMETRI, idx = null, reg = null) {
  const C = p.consumo, luce = p.fornitura === 'luce', P = luce ? p.potenza : 0;
  const R = luce ? par.luce : par.gas;
  const lambda = luce ? par.luce.lambda : 0;
  const struttura = luce ? (of.f || '01') : '01';
  const valoreIndice = (nome) => (idx && idx[nome] != null ? idx[nome] : par.indici[nome].valore);
  const v = { energia: 0, commercializzazione: 0, dispacciamento: 0, unaTantum: 0, sconti: 0, scontiDopoIva: 0 };

  // Prezzo indicizzato (offerte variabili): media dell'indice per i coefficienti, più le perdite di rete per la luce.
  let prezzoIndice = 0;
  if (of.t === 'V') {
    for (const [codice, coeff] of of.idx) prezzoIndice += valoreIndice(INDICE_DI[codice]) * (coeff ?? 1) * (1 + lambda);
    v.energia += prezzoIndice * C;
  }
  const energiaPerFascia = {};
  for (const [macro, , intervalli] of of.comp || []) {
    const gruppi = new Map();
    for (const iv of intervalli) {
      const k = `${iv[0]}|${iv[1] || ''}`;
      if (!gruppi.has(k)) gruppi.set(k, []);
      gruppi.get(k).push(iv);
    }
    for (const [k, ivs] of gruppi) {
      const [um, fascia] = k.split('|');
      const prezzo = prezzoMedio(ivs, C);
      let importo;
      if (um === '01') importo = prezzo;                    // €/anno
      else if (um === '02') importo = prezzo * P;           // €/kW l'anno
      else if (um === '03' || um === '04') importo = prezzo * C * (luce ? quotaFascia(fascia || null, struttura) : 1);
      else if (um === '05') { v.unaTantum += prezzo; continue; } // € una volta
      else continue;
      if (macro === '04' || macro === '06') {
        v.energia += importo;
        if (macro === '04' && (um === '03' || um === '04')) energiaPerFascia[fascia || 'tutte'] = (energiaPerFascia[fascia || 'tutte'] || 0) + importo;
      } else if (macro === '05') v.unaTantum += importo;
      else v.commercializzazione += importo;
    }
  }

  // Componenti regolate dichiarate dal venditore.
  const ccr = () => { const q = quotaInverno(p.riscaldamento, par); return (par.ccr.inverno * q + par.ccr.estate * (1 - q)) * par.ccr.pcs; };
  const crValore = {};
  for (const c of of.cr || []) {
    let x = 0;
    if (luce && c === '01') x = R.pcv_c;
    if (!luce && c === '03') x = ccr() * C;
    if (!luce && c === '04') x = R.cpr * C;
    if (!luce && c === '05') x = R.grad * C;
    if (!luce && c === '09') x = R.qvd_f_d;
    if (!luce && c === '10') x = R.qvd_v_d * C;
    crValore[c] = x;
    if (!luce && ['03', '04', '05'].includes(c)) v.energia += x; else v.commercializzazione += x;
  }
  if (luce) {
    for (const [tipo, valore] of of.disp || []) {
      if (tipo === '14') v.dispacciamento += R.cdispd * C;
      if (tipo === '13') v.commercializzazione += R.dispbt_d;
      if (tipo === '10') v.dispacciamento += R.cpty_mrkt_mt * C;
      if (tipo === '09') v.dispacciamento += (R.cpty_mrkt_1 + R.cpty_mrkt_2 + R.cpty_mrkt_3) / 3 * C;
      if (tipo === '11') v.dispacciamento += R.rst * C;
      if (tipo === '12') v.dispacciamento += R.rstg * C;
      if (tipo === '99') v.dispacciamento += (valore || 0) * C;
    }
  }

  // Sconti senza condizioni, validi all'ingresso o entro 12 mesi (come sul Portale).
  for (const [tipologia, um, prezzo, primaIva, mesi, codice, da, a] of of.sc || []) {
    // Uno sconto può valere solo per una parte del consumo annuo (da ... fino a): conta la quota di consumo che ci cade.
    const quota = da != null || a != null ? Math.max(0, Math.min(C, a ?? Infinity) - (da ?? 0)) / C : 1;
    const peso = (mesi != null ? Math.min(12, mesi) / 12 : 1) * (tipologia === '03' ? quota : 1);
    let s = 0;
    const fasciaCodice = { 11: '01', 12: '02', 13: '03', 91: '91', 92: '92', 93: '93' }[codice];
    if (tipologia === '01') s = um === '05' ? prezzo : prezzo * peso;
    else if (tipologia === '02') s = prezzo * P * peso;
    else if (tipologia === '03' && (um === '03' || um === '04')) s = prezzo * C * peso * (fasciaCodice && luce ? quotaFascia(fasciaCodice, struttura === '01' ? '03' : struttura) : 1);
    else if (tipologia === '03' && um === '06') {
      let base;
      if (codice && crValore[codice] != null) base = crValore[codice];
      else if (of.t === 'V') base = (prezzoIndice * C + Object.values(energiaPerFascia).reduce((a, b) => a + b, 0)) * (fasciaCodice && luce ? quotaFascia(fasciaCodice, '03') : 1);
      else base = fasciaCodice ? (energiaPerFascia[fasciaCodice] || 0) : Object.values(energiaPerFascia).reduce((a, b) => a + b, 0);
      s = base * prezzo / 100 * peso;
    }
    if (tipologia === '01' && !primaIva) v.scontiDopoIva += s; else v.sconti += s;
  }

  const q = reg || quoteRegolate(p, par);
  const imponibile = v.energia + v.commercializzazione + v.dispacciamento + v.unaTantum - v.sconti + q.rete + q.oneri + q.accise + q.addizionale;
  let iva;
  if (luce) iva = imponibile * par.luce.iva_c;
  else iva = imponibile * (Math.min(C, 480) * par.gas.iva_f1 + Math.max(C - 480, 0) * par.gas.iva_f3) / C;
  const totale = imponibile + iva - v.scontiDopoIva;
  return { ...v, rete: q.rete, oneri: q.oneri, accise: q.accise, addizionale: q.addizionale, iva, totale };
}

// ---------- la spesa di oggi ----------

/** Quanto paga oggi la persona: la spesa annua scritta in bolletta, o una stima dal prezzo e dalla quota fissa. */
export function spesaAttuale(p, par = PARAMETRI) {
  const a = p.attuale || {};
  if (a.spesa > 0) return { totale: a.spesa, come: 'spesa', testo: 'la spesa annua che hai indicato' };
  if (a.prezzo > 0) {
    const luce = p.fornitura === 'luce';
    const finta = {
      t: 'F', f: '01',
      comp: [['04', 'Prezzo', [[luce ? '03' : '04', luce ? '01' : null, a.prezzo]]], ...(a.quotaFissa > 0 ? [['01', 'Quota fissa', [['01', null, a.quotaFissa * 12]]]] : [])],
      disp: luce ? [['14']] : undefined,
    };
    const s = spesaOfferta(finta, p, par);
    return { ...s, come: 'prezzo', testo: `il tuo prezzo di ${String(a.prezzo).replace('.', ',')} €/${luce ? 'kWh' : 'Smc'}${a.quotaFissa > 0 ? ` e la quota fissa di ${String(a.quotaFissa).replace('.', ',')} € al mese` : ''}, con le stesse componenti regolate e imposte` };
  }
  return null;
}

// ---------- il confronto ----------

/**
 * Confronta le offerte per il profilo.
 * @param profilo { fornitura: 'luce'|'gas', consumo, potenza?, residente?, regione: '12', comune: '058091', riscaldamento?, exCasMez?, attuale?: { spesa?, prezzo?, quotaFissa? }, tipo?: 'F'|'V' }
 * @param offerte il contenuto di dati/luce.json o dati/gas.json ({ venditori, offerte, aggiornato })
 * @param parametri i parametri regolati (src/dati/parametri.js)
 * @returns { stato, manca, elenco (ordinato per spesa), migliori, attuale, risparmio, escluse, regolate, note, fonti }
 */
export function confronta(profilo, offerte, parametri = PARAMETRI) {
  const p = { ...profilo };
  const manca = mancanti(p);
  const base = { fornitura: p.fornitura, aggiornato: offerte?.aggiornato, indici: parametri.indici, fonti: fontiPer(p.fornitura), note: [] };
  if (manca.length) return { ...base, stato: 'dato', manca, elenco: [], escluse: {} };
  if (p.fornitura === 'gas' && !parametri.ambiti_gas[p.regione]) {
    return { ...base, stato: 'fuori', manca: [], elenco: [], escluse: {}, motivo: 'In Sardegna il gas arriva da reti con tariffe proprie, che il Portale Offerte gestisce a parte: per questa zona il calcolo qui non è affidabile. Confronta le offerte sul Portale Offerte.' };
  }
  const reg = quoteRegolate(p, parametri);
  const escluse = { zona: 0, residenza: 0, consumo: 0, potenza: 0, non_stimabili: 0, motivi: {} };
  const elenco = [];
  const idxMin = Object.fromEntries(Object.entries(parametri.indici).map(([k, x]) => [k, x.min12]));
  const idxMax = Object.fromEntries(Object.entries(parametri.indici).map(([k, x]) => [k, x.max12]));
  const regAlt = reg.accise_alt != null ? { ...reg, accise: reg.accise_alt } : null;
  for (const of of offerte.offerte) {
    const c = compatibile(of, p);
    if (c) { escluse[c === 'solo residenti' || c === 'solo non residenti' ? 'residenza' : c] += 1; continue; }
    const ns = nonStimabile(of, p.fornitura);
    if (ns) { escluse.non_stimabili += 1; escluse.motivi[ns] = (escluse.motivi[ns] || 0) + 1; continue; }
    const s = spesaOfferta(of, p, parametri, null, reg);
    const inc = incoerente(s, p.consumo, p.fornitura);
    if (inc) { escluse.non_stimabili += 1; escluse.motivi[inc] = (escluse.motivi[inc] || 0) + 1; continue; }
    const note = [];
    let margine = null;
    if (of.t === 'V') {
      const a = spesaOfferta(of, p, parametri, idxMin, reg).totale, b = spesaOfferta(of, p, parametri, idxMax, reg).totale;
      margine = [arrot(Math.min(a, b)), arrot(Math.max(a, b))];
      note.push('Prezzo variabile: stima con l\'ultimo valore mensile dell\'indice; il Portale usa le quotazioni future, che non sono pubbliche.');
      if (p.fornitura === 'luce' && of.f !== '01') note.push('Per le fasce orarie usiamo il PUN medio di tutte le ore.');
    }
    if (regAlt) {
      const alt = spesaOfferta(of, p, parametri, null, regAlt).totale;
      margine = margine ? [arrot(Math.min(margine[0], alt)), margine[1]] : [arrot(alt), arrot(s.totale)];
    }
    if ((of.comp || []).some(([, , ivs]) => ivs.some((iv) => iv[3] != null || iv[5] != null))) note.push('Alcuni prezzi cambiano con il consumo o con i mesi: stima approssimata.');
    const ven = offerte.venditori[of.v] || [];
    elenco.push({
      codice: of.c, nome: of.n, venditore: ven[0], piva: ven[1], tipo: of.t, durata: of.d, scade: of.fine,
      spesa: arrot(s.totale), voci: Object.fromEntries(Object.entries(s).map(([k, x]) => [k, arrot(x)])),
      stima: of.t === 'V' || regAlt != null || note.length > 0, margine, note,
      indice: of.t === 'V' ? of.idx.map(([k]) => `${INDICE_DI[k]} ${PERIODO_INDICE[k]}`).join(' + ') : null,
      onereRecesso: (of.cond || []).some((x) => x[0] === '05'),
      condizioni: (of.cond || []).map(([tip, lim, testo]) => ({ tipo: CONDIZIONI[tip] || 'Altro', limitante: lim, testo })),
      scontiCondizionati: of.scc || [], opzionali: of.opz || [], servizi: of.serv || [], garanzie: of.gar || null,
      attivazione: (of.att || []).map((x) => ATTIVAZIONE[x] || x), pagamento: (of.pag || []).map((x) => PAGAMENTO[x] || x),
      url: of.url ? (/^https?:\/\//i.test(of.url) ? of.url : 'https://' + of.url) : null, telefono: of.tel || null,
    });
  }
  elenco.sort((a, b) => a.spesa - b.spesa || a.nome.localeCompare(b.nome));
  const attuale = spesaAttuale(p, parametri);
  const migliori = { F: elenco.find((x) => x.tipo === 'F') || null, V: elenco.find((x) => x.tipo === 'V') || null };
  const risparmio = attuale ? {
    F: migliori.F ? arrot(attuale.totale - migliori.F.spesa) : null,
    V: migliori.V ? arrot(attuale.totale - migliori.V.spesa) : null,
  } : null;
  const note = [];
  if (p.fornitura === 'gas') {
    const add = parametri.addizionali_gas[p.regione];
    if (add && !add.ufficiale) note.push(`Addizionale regionale (${add.nome}): valore preso da una fonte non ufficiale, da verificare in bolletta.`);
    if (add?.nota) note.push(`Addizionale regionale (${add.nome}): ${add.nota}.`);
    if (reg.exCasMez === null) note.push('Il tuo Comune potrebbe essere nei territori dell\'ex Cassa per il Mezzogiorno, dove l\'accisa sul gas è più bassa: la spesa può essere un po\' minore (lo indichiamo nel margine).');
  }
  return {
    ...base, stato: 'ok', manca: [], elenco, migliori, attuale, risparmio, escluse, note,
    regolate: { rete: arrot(reg.rete), oneri: arrot(reg.oneri), accise: arrot(reg.accise), addizionale: arrot(reg.addizionale), ambito: reg.ambito ? parametri.nomi_ambiti[reg.ambito] : null, kwhTassati: reg.kwhTassati },
    profilo: p,
  };
}

function fontiPer(fornitura) {
  const f = [FONTI.opendata, FONTI.regole, FONTI.portale, FONTI.iva];
  if (fornitura === 'luce') f.push(FONTI.accise_luce);
  if (fornitura === 'gas') f.push(FONTI.accise_gas, FONTI.ex_casmez, FONTI.addizionale, FONTI.ccr);
  return f;
}

// ---------- in testo semplice (per il server MCP) ----------

const interi = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' });
const euro = (n) => (n == null ? '' : `${interi.format(n)} €`);
const meseLungo = (m) => { const [a, mm] = m.split('-').map(Number); return new Date(Date.UTC(a, mm - 1, 15)).toLocaleDateString('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' }); };

/** L'esito del confronto in testo semplice. */
export function testo(esito, quante = 3) {
  if (!esito) return '';
  const cosa = esito.fornitura === 'gas' ? 'il gas' : 'la luce';
  if (esito.stato === 'dato') return `Per confrontare le offerte per ${cosa} serve: ${esito.manca.join(', ')}.`;
  if (esito.stato === 'fuori') return esito.motivo;
  const r = [];
  r.push(`Offerte del mercato libero per ${cosa} di casa, dati del Portale Offerte del ${new Date(esito.aggiornato).toLocaleDateString('it-IT')}: ${esito.elenco.length} stimate per il tuo profilo.`);
  if (esito.attuale) r.push(`Oggi paghi circa ${euro(esito.attuale.totale)} l'anno (${esito.attuale.testo}).`);
  for (const [t, nome] of [['F', 'a prezzo fisso'], ['V', 'a prezzo variabile']]) {
    const lista = esito.elenco.filter((x) => x.tipo === t).slice(0, quante);
    if (!lista.length) continue;
    r.push(`Le più convenienti ${nome}:`);
    for (const x of lista) {
      const diff = esito.attuale ? esito.attuale.totale - x.spesa : null;
      r.push(`- ${x.venditore}, «${x.nome}» (codice ${x.codice}): ${euro(x.spesa)} l'anno${x.margine ? ` (stima, tra ${euro(x.margine[0])} e ${euro(x.margine[1])})` : ''}${diff != null ? `, ${diff >= 0 ? 'risparmi' : 'spendi in più'} ${euro(Math.abs(diff))}` : ''}${x.durata > 0 ? `; condizioni economiche per ${x.durata} mesi` : ''}${x.onereRecesso ? '; prevede un onere se recedi prima' : ''}.`);
    }
  }
  const i = esito.fornitura === 'gas' ? esito.indici.PSV : esito.indici.PUN;
  r.push(`Le variabili sono stimate con ${esito.fornitura === 'gas' ? 'il PSV' : 'il PUN'} di ${meseLungo(i.mese)} (${String(i.valore).replace('.', ',')} ${i.unita}); il Portale usa le quotazioni future: verifica lì la stima con il codice offerta.`);
  r.push('Cambiare venditore è gratis, la fornitura non si interrompe e il nuovo venditore fa la disdetta per te; attenzione solo agli eventuali oneri di recesso anticipato dei contratti luce a prezzo fisso.');
  for (const n of esito.note) r.push(n);
  return r.join('\n');
}
