// Le regole di «Mi rimborsano?»: voli, bagagli, treni, bollette, telefonia e
// banche. Ogni regola ha la sua fonte, verificata il 25 ottobre 2026. Il motore
// non inventa: se un dato manca lo dice, se una norma è incerta lo scrive.

import { data, iso, oggi as oggiCal, aggiungiGiorni, giorniTra, scrittaBreve } from './comune/date.js';
import { PER_CODICE, distanzaKm } from './dati/aeroporti.js';

export const VERIFICATO = '2026-10-25';
const N = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:';
const C = 'https://publications.europa.eu/resource/celex/';

export const FONTI = {
  reg261: { titolo: 'Regolamento (CE) 261/2004 sui diritti dei passeggeri aerei', url: `${C}32004R0261` },
  sturgeon: { titolo: 'Corte di giustizia UE, sentenza Sturgeon (C-402/07): ritardo di 3 ore', url: `${C}62007CJ0402` },
  airhelp: { titolo: 'Corte di giustizia UE, C-28/20: lo sciopero del personale non è una circostanza eccezionale', url: `${C}62020CJ0028` },
  riforma: { titolo: 'Regolamento (UE) 2026/2202 che modifica il 261/2004 (si applica dal 23/10/2027)', url: `${C}32026R2202` },
  enac: { titolo: 'ENAC, Modalità di reclamo per negato imbarco, cancellazione e ritardo', url: 'https://www.enac.gov.it/passeggeri/diritti-dei-passeggeri/modalita-di-reclamo-per-negato-imbarco-cancellazione-ritardo/' },
  cass4427: { titolo: 'Cassazione, ord. 4427/2024: alla compensazione non si applica il termine di Montreal', url: 'https://www.dirittodeitrasporti.it/app/uploads/2025/04/16_Fogliani-_GIUR.pdf' },
  art21: { titolo: 'ART, delibera 21/2023: conciliazione obbligatoria per i trasporti', url: 'https://www.autorita-trasporti.it/wp-content/uploads/2023/02/All.-A-delibera-n.-21_2023_signed.pdf' },
  montreal: { titolo: 'Convenzione di Montreal 1999, artt. 22, 31 e 35', url: `${C}22001A0718%2801%29` },
  icao2024: { titolo: 'ICAO, limiti di responsabilità rivisti dal 28/12/2024 (1.519 DSP)', url: 'https://www.icao.int/sites/default/files/secretariat/legal/LEB%20Treaty%20Collection%20Documents/2024_Revised_Limits_of_Liability_Under_the_Montreal_Convention_of_1999_en.pdf' },
  enacBagagli: { titolo: 'ENAC, Mancata riconsegna del bagaglio', url: 'https://www.enac.gov.it/passeggeri/bagagli/mancata-riconsegna/' },
  reg782: { titolo: 'Regolamento (UE) 2021/782 sui diritti dei passeggeri ferroviari', url: `${C}32021R0782` },
  artSite: { titolo: 'ART, reclami sul trasporto ferroviario (SiTe)', url: 'https://www.autorita-trasporti.it/site/' },
  l205: { titolo: 'Legge 205/2017, art. 1, commi 4-10: prescrizione biennale delle bollette', url: `${N}legge:2017-12-27;205` },
  areraPrescr: { titolo: 'ARERA, Come non pagare gli importi fatturati con eccessivo ritardo', url: 'https://www.arera.it/atlante-per-il-consumatore/elettricita/la-bolletta/invio-e-pagamento/cosa-occorre-fare-per-non-pagare-gli-importi-fatturati-con-eccessivo-ritardo' },
  tiqv: { titolo: 'ARERA, TIQV in vigore dal 1° gennaio 2026: tempi di risposta e indennizzi', url: 'https://www.arera.it/fileadmin/allegati/docs/16/TIQV_Allegato_A_in_vigore_dal_1_gennaio_2026.pdf' },
  conciliazioneArera: { titolo: 'Sportello per il consumatore ARERA, Servizio Conciliazione', url: 'https://www.sportelloperilconsumatore.it/lo-sportello/i-servizi/servizio-conciliazione' },
  rateArera: { titolo: 'ARERA, In quali casi la bolletta può essere pagata a rate', url: 'https://www.arera.it/atlante-per-il-consumatore/elettricita/la-bolletta/invio-e-pagamento/in-quali-casi-la-bolletta-puo-essere-pagata-a-rate' },
  agcomIndennizzi: { titolo: 'AGCOM, Regolamento indennizzi (delibera 347/18/CONS, allegato A)', url: 'https://www.agcom.it/sites/default/files/migration/attachment/Allegato%206-8-2018_0.pdf' },
  agcomProcedure: { titolo: 'AGCOM, Regolamento sulle procedure di risoluzione delle controversie', url: 'https://www.agcom.it/sites/default/files/migration/attachment/Allegato%2026-10-2022_0.pdf' },
  agcom45: { titolo: 'AGCOM, delibera 179/03/CSP: risposta ai reclami entro 45 giorni', url: 'https://www.agcom.it/sites/default/files/migration/attachment/Allegato%2024-07-2003.pdf' },
  bersani: { titolo: 'DL 7/2007, art. 1: recesso e cambio operatore', url: `${N}decreto.legge:2007-01-31;7` },
  dlgs11art9: { titolo: 'D.lgs. 11/2010, art. 9: segnalazione entro 13 mesi', url: `${N}decreto.legislativo:2010-01-27;11~art9` },
  dlgs11art11: { titolo: 'D.lgs. 11/2010, art. 11: rimborso entro la giornata operativa successiva', url: `${N}decreto.legislativo:2010-01-27;11~art11` },
  dlgs11art12: { titolo: 'D.lgs. 11/2010, art. 12: franchigia di 50 € e colpa grave', url: `${N}decreto.legislativo:2010-01-27;11~art12` },
  bdiReclami: { titolo: 'Banca d\'Italia, Disposizioni di trasparenza: tempi di risposta ai reclami', url: 'https://www.bancaditalia.it/compiti/vigilanza/normativa/archivio-norme/disposizioni/trasparenza_operazioni/2025.02.13/SMDD-Disposizioni-di-trasparenza.pdf' },
  abf: { titolo: 'Arbitro Bancario Finanziario, l\'ABF in parole semplici', url: 'https://www.arbitrobancariofinanziario.it/presentare-ricorso/guide-e-moduli/abf-in-parole-semplici.pdf?force_download=1' },
  cc1219: { titolo: 'Codice civile, art. 1219: costituzione in mora', url: `${N}regio.decreto:1942-03-16;262~art1219` },
  cc2943: { titolo: 'Codice civile, art. 2943: interruzione della prescrizione', url: `${N}regio.decreto:1942-03-16;262~art2943` },
};

const RIFORMA_DAL = '2027-10-23';
const eur = (n) => `${n.toLocaleString('it-IT', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;
const mesiDopo = (d, m) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + m); return x; };
const voce = (titolo, esito, spiegazione, fonti = [], dato = null) => ({ titolo, esito, spiegazione, fonti, dato });

function scadenze(lista, oggi) {
  return lista.filter((s) => s.data).map((s) => {
    const d = typeof s.data === 'string' ? data(s.data) : s.data;
    const g = giorniTra(oggi, d);
    return { ...s, data: iso(d), scaduta: g < 0, giorniMancanti: g };
  }).sort((a, b) => a.data.localeCompare(b.data));
}

// ---------- Voli ----------

/** Fascia della compensazione (art. 7.1): importo, soglia di riprotezione per la riduzione del 50% (art. 7.2). */
export function fasciaVolo(km, intraUe) {
  if (km <= 1500) return { importo: 250, oreRiduzione: 2, nome: 'fino a 1.500 km' };
  if (intraUe || km <= 3500) return { importo: 400, oreRiduzione: 3, nome: intraUe && km > 3500 ? 'tratta europea oltre 1.500 km' : 'tra 1.500 e 3.500 km' };
  return { importo: 600, oreRiduzione: 4, nome: 'oltre 3.500 km' };
}

const ECCEZIONALI = { meteo: true, atc: true, sciopero_esterno: true, sicurezza: true };

function volo(r, oggi) {
  const voci = [];
  const fonti = [FONTI.reg261, FONTI.enac];
  const dataVolo = r.data_volo ? data(r.data_volo) : null;
  const riforma = r.data_volo && r.data_volo >= RIFORMA_DAL;
  if (riforma) fonti.push(FONTI.riforma);

  // Ambito di applicazione (art. 3)
  const pDa = PER_CODICE[r.da];
  const pA = PER_CODICE[r.a];
  const daUe = pDa ? pDa.ue : r.da === 'altro' ? (r.partenza_ue === true ? true : r.partenza_ue === false ? false : null) : null;
  const aUe = pA ? pA.ue : r.a === 'altro' ? (r.arrivo_ue === true ? true : r.arrivo_ue === false ? false : null) : null;
  let applica = null;
  if (daUe === true) applica = true;
  else if (daUe === false) applica = aUe === false ? false : aUe === true ? (r.vettore_ue === true ? true : r.vettore_ue === false ? false : null) : null;
  if (applica === false) {
    voci.push(voce('Si applica il regolamento europeo?', 'no', 'Il volo parte da fuori Europa e non lo opera una compagnia europea (o non arriva in Europa): il regolamento 261/2004 non si applica. Valgono le regole del Paese di partenza e la Convenzione di Montreal per i danni provati.', [FONTI.reg261]));
    return { voci, fonti, verdetto: { tono: 'no', titolo: 'Questo volo non rientra nelle regole europee', testo: 'Il regolamento 261/2004 vale per i voli che partono dall\'Europa, e per quelli che arrivano in Europa solo se la compagnia è europea. Puoi comunque reclamare alla compagnia secondo le sue condizioni.' }, importo: null, scadenze: [], passi: [], documento: null };
  }
  if (applica === null) voci.push(voce('Si applica il regolamento europeo?', 'dato', 'Serve sapere da dove parte il volo e, se parte da fuori Europa, se la compagnia che lo opera è europea.', [FONTI.reg261], r.da ? 'vettore_ue' : 'da'));
  else voci.push(voce('Si applica il regolamento europeo', 'si', daUe ? 'Il volo parte da un aeroporto europeo: il regolamento vale con qualsiasi compagnia.' : 'Il volo arriva in Europa ed è operato da una compagnia europea.', [FONTI.reg261]));

  // Distanza e fascia
  let km = pDa && pA ? distanzaKm(r.da, r.a) : null;
  if (km === null && typeof r.distanza_km === 'number') km = r.distanza_km;
  const intraUe = daUe === true && aUe === true;
  const fascia = km !== null ? fasciaVolo(km, intraUe) : null;
  if (fascia) {
    const vicino = Math.abs(km - 1500) <= 40 || Math.abs(km - 3500) <= 40;
    voci.push(voce(`Distanza: circa ${km.toLocaleString('it-IT')} km`, vicino ? 'forse' : 'si', `Fascia ${fascia.nome}: compensazione di ${eur(fascia.importo)} a passeggero (art. 7). La distanza è in linea d'aria tra partenza e destinazione finale.${vicino ? ' Sei vicino al limite di una fascia: la compagnia potrebbe calcolare una distanza leggermente diversa.' : ''}`, [FONTI.reg261]));
  } else voci.push(voce('Distanza del volo', 'dato', 'Indica gli aeroporti di partenza e di destinazione finale per sapere quanto spetta.', [FONTI.reg261], 'da'));

  // Il fatto: ritardo, cancellazione o negato imbarco
  let diritto = null;
  let riduzione = false;
  const soglia = riforma ? 'più di 3 ore' : '3 ore o più';
  if (r.volo_tipo === 'ritardo') {
    if (typeof r.ritardo_ore !== 'number') voci.push(voce('Ritardo all\'arrivo', 'dato', `La compensazione spetta con un ritardo all'arrivo di ${soglia}.`, [FONTI.sturgeon], 'ritardo_ore'));
    else {
      diritto = riforma ? r.ritardo_ore > 3 : r.ritardo_ore >= 3;
      voci.push(voce(`Ritardo all'arrivo: ${r.ritardo_ore.toLocaleString('it-IT')} ore`, diritto ? 'si' : 'no', diritto ? `Oltre la soglia di ${soglia} all'arrivo alla destinazione finale: spetta la compensazione come per una cancellazione (Corte di giustizia, Sturgeon).` : `Sotto la soglia di ${soglia}: niente compensazione. Restano i pasti e le bevande, e l'albergo se serviva passare la notte.`, [FONTI.sturgeon]));
      if (riforma && diritto && fascia?.importo === 600 && r.ritardo_ore <= 4) riduzione = true;
    }
  } else if (r.volo_tipo === 'cancellazione') {
    const g = r.preavviso_giorni;
    if (typeof g !== 'number') voci.push(voce('Preavviso della cancellazione', 'dato', 'Con un preavviso di almeno 14 giorni la compensazione non spetta; con meno, dipende dal volo alternativo offerto.', [FONTI.reg261], 'preavviso_giorni'));
    else if (g >= 14) { diritto = false; voci.push(voce(`Avvisato ${g} giorni prima`, 'no', 'Con almeno 14 giorni di preavviso la compensazione non spetta. Hai comunque diritto a scegliere tra il rimborso del biglietto entro 7 giorni e un volo alternativo.', [FONTI.reg261])); } else if (r.alternativa === false) { diritto = true; voci.push(voce(`Avvisato ${g} giorni prima, senza alternativa`, 'si', 'Meno di 14 giorni di preavviso e nessun volo alternativo: spetta la compensazione, oltre al rimborso o a un altro volo.', [FONTI.reg261])); } else if (r.alternativa === true) {
      const ant = r.alt_anticipo_ore;
      const rit = r.alt_ritardo_ore;
      if (typeof ant !== 'number' || typeof rit !== 'number') voci.push(voce('Il volo alternativo', 'dato', 'Servono gli orari del volo alternativo: quanto prima partiva e con quanto ritardo arrivava.', [FONTI.reg261], typeof ant !== 'number' ? 'alt_anticipo_ore' : 'alt_ritardo_ore'));
      else {
        const esclusa = g >= 7 ? ant <= 2 && rit < 4 : ant <= 1 && rit < 2;
        diritto = !esclusa;
        voci.push(voce('Il volo alternativo', esclusa ? 'no' : 'si', esclusa ? `Con ${g >= 7 ? 'da 7 a 13' : 'meno di 7'} giorni di preavviso, l'alternativa partiva al massimo ${g >= 7 ? 2 : 1} ore prima e arrivava con meno di ${g >= 7 ? 4 : 2} ore di ritardo: la compensazione non spetta.` : `L'alternativa non rispettava i limiti dell'art. 5 (${g >= 7 ? 'partenza al massimo 2 ore prima e arrivo entro 4 ore' : 'partenza al massimo 1 ora prima e arrivo entro 2 ore'}): spetta la compensazione.`, [FONTI.reg261]));
        if (diritto && fascia && rit <= fascia.oreRiduzione) riduzione = true;
      }
    } else voci.push(voce('Ti hanno offerto un volo alternativo?', 'dato', 'Con meno di 14 giorni di preavviso la compensazione dipende dagli orari dell\'alternativa.', [FONTI.reg261], 'alternativa'));
  } else if (r.volo_tipo === 'negato_imbarco') {
    diritto = true;
    voci.push(voce('Imbarco negato contro la tua volontà', 'si', 'La compensazione va pagata subito, senza eccezioni per circostanze eccezionali, salvo motivi di salute, sicurezza o documenti di viaggio inadeguati.', [FONTI.reg261]));
    if (fascia && typeof r.alt_ritardo_ore === 'number' && r.alt_ritardo_ore <= fascia.oreRiduzione) riduzione = true;
  } else voci.push(voce('Che cosa è successo al volo', 'dato', 'Scegli tra ritardo, cancellazione e imbarco negato.', [], 'volo_tipo'));

  // Circostanze eccezionali (art. 5.3)
  let causa = null;
  if (diritto && r.volo_tipo !== 'negato_imbarco') {
    if (!r.causa_volo) causa = voce('Il motivo dato dalla compagnia', 'dato', 'Conta per capire se la compagnia può invocare una circostanza eccezionale.', [FONTI.reg261], 'causa_volo');
    else if (ECCEZIONALI[r.causa_volo]) causa = voce('Il motivo può essere una circostanza eccezionale', 'forse', 'Maltempo, decisioni del controllo del traffico aereo, scioperi esterni e rischi per la sicurezza possono escludere la compensazione, ma la compagnia deve provarlo e dimostrare di aver fatto il possibile. Chiedi per iscritto la prova. Pasti, bevande e albergo spettano comunque.', [FONTI.reg261]);
    else if (r.causa_volo === 'ritardo_precedente') causa = voce('Il ritardo dell\'aereo sul volo precedente', 'si', 'Di regola non è una circostanza eccezionale; lo è solo se il volo precedente era stato colpito a sua volta da un evento eccezionale, che la compagnia deve provare.', [FONTI.reg261]);
    else if (r.causa_volo === 'non_detta') causa = voce('Nessun motivo comunicato', 'si', 'Tocca alla compagnia provare una circostanza eccezionale: senza prova la compensazione è dovuta.', [FONTI.reg261]);
    else causa = voce(r.causa_volo === 'guasto' ? 'Un guasto tecnico non è una circostanza eccezionale' : 'Lo sciopero del personale della compagnia non è una circostanza eccezionale', 'si', r.causa_volo === 'guasto' ? 'Per la Corte di giustizia i problemi tecnici rientrano nella normale attività della compagnia: la compensazione è dovuta.' : 'Per la Corte di giustizia (C-28/20) lo sciopero indetto dal sindacato del personale della compagnia non la esonera.', [r.causa_volo === 'guasto' ? FONTI.sturgeon : FONTI.airhelp]);
    voci.push(causa);
  }

  // Importo
  let importo = null;
  if (diritto && fascia) {
    const valore = riduzione ? fascia.importo / 2 : fascia.importo;
    importo = { valore, testo: `${eur(valore)} a passeggero${riduzione ? `, cioè metà dei ${eur(fascia.importo)}: la compagnia può ridurre del 50% se ti ha riportato a destinazione entro ${riforma && r.volo_tipo === 'ritardo' ? '4' : fascia.oreRiduzione} ore dall'orario previsto` : ''}. In denaro, non in buoni, se non sei d'accordo diversamente.` };
  }
  if (r.volo_tipo === 'ritardo' && typeof r.ritardo_ore === 'number' && r.ritardo_ore >= 5) voci.push(voce('Puoi chiedere il rimborso del biglietto', 'si', `Con almeno 5 ore di ritardo puoi rinunciare al viaggio e avere il rimborso del biglietto${r.prezzo_volo ? ` (${eur(r.prezzo_volo)})` : ''} entro 7 giorni.`, [FONTI.reg261]));

  // Termini
  const lista = [];
  let tono = diritto === false ? 'no' : diritto && causa?.esito === 'forse' ? 'forse' : diritto ? 'si' : 'dato';
  if (dataVolo) {
    if (riforma) lista.push({ id: 'richiesta', data: mesiDopo(dataVolo, 9), titolo: 'Chiedere la compensazione alla compagnia', testo: 'Con le nuove regole europee la richiesta va presentata entro 9 mesi dal volo; la compagnia risponde entro 30 giorni.' });
    else lista.push({ id: 'prudente', data: mesiDopo(dataVolo, 6), titolo: 'Reclamare per scritto, per prudenza', testo: 'La legge non fissa un termine chiaro e i giudici non sono d\'accordo (da 6 mesi a 10 anni). L\'ENAC consiglia di reclamare entro 6 mesi: alcune compagnie rifiutano i reclami più tardivi.' });
    const mesi = (oggi - dataVolo) / (30.44 * 86400000);
    if (!riforma && mesi > 24) { voci.push(voce('Il volo è di più di due anni fa', 'forse', 'Il termine per chiedere la compensazione in Italia è incerto: la Cassazione ha escluso i 2 anni di Montreal ma non ha detto quale termine valga. Un reclamo così tardivo rischia di essere respinto: valuta con un\'associazione di consumatori.', [FONTI.cass4427])); if (tono === 'si') tono = 'forse'; } else if (!riforma && mesi > 6) voci.push(voce('Sono passati più di 6 mesi dal volo', 'forse', 'Puoi ancora reclamare, ma alcune compagnie rifiutano i reclami oltre 6 mesi e alcuni giudici applicano un termine breve. Scrivi subito, con PEC o raccomandata.', [FONTI.cass4427, FONTI.enac]));
  }
  if (r.gia_reclamato && r.data_reclamo && r.risposta !== 'positiva') {
    const dr = data(r.data_reclamo);
    lista.push({ id: 'enac', data: aggiungiGiorni(dr, 42), titolo: 'Segnalare all\'ENAC', testo: 'Dopo 6 settimane senza risposta, o con una risposta non conforme, puoi fare reclamo all\'ENAC: è gratis e serve a sanzionare la compagnia, non a farti pagare.' });
    lista.push({ id: 'conciliazione', data: aggiungiGiorni(dr, 30), titolo: 'Chiedere la conciliazione', testo: 'Dopo 30 giorni dal reclamo senza risposta (o subito dopo un rifiuto) puoi chiedere la conciliazione gratuita su ConciliaWeb dell\'ART o a un organismo ADR, entro un anno dal reclamo. Serve prima di andare dal giudice.' });
    lista.push({ id: 'conciliazione_fine', data: mesiDopo(dr, 12), titolo: 'Ultimo giorno per la conciliazione', testo: 'La domanda di conciliazione va presentata entro un anno dal reclamo.' });
  }

  const titoli = { si: importo ? `Ti spettano ${eur(importo.valore)} di compensazione` : 'Hai diritto alla compensazione', forse: importo ? `Potrebbero spettarti ${eur(importo.valore)}` : 'Potresti avere diritto alla compensazione', no: 'La compensazione non spetta', dato: 'Servono ancora alcune risposte' };
  const testi = {
    si: 'Chiedila per iscritto alla compagnia che ha operato il volo, allegando biglietto e carta d\'imbarco. Qui sotto trovi la lettera pronta.',
    forse: 'La compagnia potrebbe opporre una circostanza eccezionale o un termine scaduto: chiedi comunque per iscritto, e chiedi le prove del motivo.',
    no: 'Restano gli altri diritti: pasti, bevande e albergo se l\'attesa è lunga, rimborso o volo alternativo in caso di cancellazione.',
    dato: 'Rispondi alle domande sul volo: tipo di problema, aeroporti e orari.',
  };
  return { voci, fonti, verdetto: { tono, titolo: titoli[tono], testo: testi[tono] }, importo, scadenze: lista, passi: passiTrasporti('volo'), documento: tono === 'no' || tono === 'dato' ? null : { tipo: 'compensazione_volo', destinatario: r.compagnia || 'la compagnia aerea' } };
}

function passiTrasporti(tipo) {
  const p = [
    { titolo: 'Reclamo scritto all\'azienda', testo: tipo === 'treno' ? 'Con il modulo dell\'impresa o il modulo europeo, entro 3 mesi dal viaggio: deve rispondere entro un mese.' : 'Alla compagnia che ha operato il volo, con il suo modulo online o via PEC. Conserva la ricevuta.', link: tipo === 'treno' ? 'https://europa.eu/youreurope/citizens/travel/passenger-rights/rail/index_it.htm' : FONTI.enac.url },
    tipo === 'treno'
      ? { titolo: 'Reclamo all\'Autorità dei trasporti (ART)', testo: 'Dopo 30 giorni senza risposta o con una risposta insoddisfacente, sul portale SiTe con SPID o CIE. L\'ART sanziona, non paga.', link: FONTI.artSite.url }
      : { titolo: 'Segnalazione all\'ENAC', testo: 'Dopo 6 settimane senza risposta o con una risposta non conforme. Gratis, online. L\'ENAC sanziona, non paga.', link: 'https://carta-diritti.enac.gov.it/it/complaint/create-261' },
    { titolo: 'Conciliazione gratuita', testo: 'Su ConciliaWeb dell\'ART, con SPID o CIE, oppure con un organismo ADR o la Camera di commercio, entro un anno dal reclamo. È obbligatoria prima di andare dal giudice.', link: 'https://www.autorita-trasporti.it/servizio-conciliazioni-art/' },
    { titolo: 'Giudice di pace', testo: 'Se la conciliazione fallisce. Per le cause con l\'estero fino a 5.000 € c\'è il procedimento europeo per le controversie di modesta entità.', link: `${C}32015R2421` },
  ];
  return p;
}

// ---------- Bagagli ----------

function bagaglio(r, oggi) {
  const voci = [];
  const fonti = [FONTI.montreal, FONTI.icao2024, FONTI.enacBagagli];
  const lista = [];
  if (r.pir === false) voci.push(voce('Non hai compilato il PIR', 'forse', 'Il modulo PIR all\'ufficio bagagli dell\'aeroporto è la prova più semplice. Senza, fai subito un reclamo scritto alla compagnia con le prove che hai (talloncino del bagaglio, foto, carta d\'imbarco).', [FONTI.enacBagagli]));
  else if (r.pir === true) voci.push(voce('Hai il PIR', 'si', 'Allegalo al reclamo insieme al talloncino del bagaglio e alla carta d\'imbarco.', [FONTI.enacBagagli]));
  const dRic = r.data_bagaglio ? data(r.data_bagaglio) : null;
  const dArr = r.data_arrivo_volo ? data(r.data_arrivo_volo) : null;
  if (r.bagaglio_tipo === 'danneggiato' || r.bagaglio_tipo === 'ritardo') {
    const giorni = r.bagaglio_tipo === 'danneggiato' ? 7 : 21;
    if (dRic) lista.push({ id: 'reclamo', data: aggiungiGiorni(dRic, giorni), titolo: `Reclamo scritto alla compagnia (${giorni} giorni)`, testo: `Per un bagaglio ${r.bagaglio_tipo === 'danneggiato' ? 'danneggiato il reclamo va fatto entro 7 giorni dalla riconsegna' : 'in ritardo il reclamo va fatto entro 21 giorni da quando ti è stato consegnato'}: dopo, l'azione si perde.` });
    else voci.push(voce('Quando hai ricevuto il bagaglio', 'dato', 'Da quella data partono i termini per il reclamo.', [FONTI.montreal], 'data_bagaglio'));
  } else if (r.bagaglio_tipo === 'smarrito' && dArr) {
    const perso = aggiungiGiorni(dArr, 21);
    lista.push({ id: 'smarrito', data: perso, titolo: 'Il bagaglio si considera perso', testo: 'Se non arriva entro 21 giorni dall\'arrivo del volo, si considera smarrito e puoi chiedere il risarcimento del valore.' });
  }
  if (dArr) lista.push({ id: 'azione', data: mesiDopo(dArr, 24), titolo: 'Termine per agire in giudizio', testo: 'L\'azione per i danni al bagaglio si prescrive in 2 anni dall\'arrivo (Convenzione di Montreal, art. 35).' });
  const scad = scadenze(lista, oggi);
  const reclamoScaduto = scad.find((s) => s.id === 'reclamo')?.scaduta;
  voci.push(voce('Quanto si può chiedere', 'si', 'La compagnia risponde fino a 1.519 diritti speciali di prelievo (DSP) per passeggero, dal 28 dicembre 2024: il valore in euro cambia ogni giorno. Servono prove del danno o delle spese (scontrini per i beni di prima necessità comprati nell\'attesa).', [FONTI.icao2024]));
  let tono = r.bagaglio_tipo ? (reclamoScaduto ? 'no' : 'si') : 'dato';
  const verdetto = !r.bagaglio_tipo
    ? { tono, titolo: 'Che cosa è successo al bagaglio?', testo: 'Scegli tra danneggiato, in ritardo e non arrivato.' }
    : reclamoScaduto
      ? { tono, titolo: 'Il termine per il reclamo è scaduto', testo: 'Per la Convenzione di Montreal, senza il reclamo nei 7 o 21 giorni l\'azione si estingue, salvo frode della compagnia. Puoi comunque scrivere: alcune compagnie rispondono anche dopo.' }
      : { tono, titolo: 'Puoi chiedere il risarcimento alla compagnia', testo: 'Manda subito il reclamo scritto con PIR, talloncino, carta d\'imbarco, foto e ricevute: qui sotto c\'è la lettera pronta.' };
  return { voci, fonti, verdetto, importo: typeof r.spese_bagaglio === 'number' && !reclamoScaduto ? { valore: r.spese_bagaglio, testo: `${eur(r.spese_bagaglio)} richiesti, da documentare, entro il limite di 1.519 DSP.` } : null, scadenze: lista, passi: passiTrasporti('volo').slice(0, 1).concat(passiTrasporti('volo').slice(3)), documento: tono === 'si' ? { tipo: 'bagaglio', destinatario: r.compagnia || 'la compagnia aerea' } : null };
}

// ---------- Treni ----------

function treno(r, oggi) {
  const voci = [];
  const fonti = [FONTI.reg782, FONTI.artSite, FONTI.art21];
  const lista = [];
  const forzaMaggiore = r.causa_treno === 'terzi' || r.causa_treno === 'meteo';
  let quota = null;
  if (r.soppresso === true) voci.push(voce('Treno soppresso', 'si', 'Puoi scegliere tra il rimborso del biglietto entro 30 giorni e un treno alternativo. Se l\'impresa non ti offre un\'alternativa entro 100 minuti, puoi organizzarti con altri mezzi pubblici e farti rimborsare.', [FONTI.reg782]));
  if (typeof r.ritardo_minuti !== 'number') voci.push(voce('Ritardo all\'arrivo', 'dato', 'L\'indennizzo è del 25% del biglietto da 60 a 119 minuti di ritardo, del 50% da 120 minuti.', [FONTI.reg782], 'ritardo_minuti'));
  else {
    quota = r.ritardo_minuti >= 120 ? 0.5 : r.ritardo_minuti >= 60 ? 0.25 : 0;
    voci.push(voce(`Ritardo all'arrivo: ${r.ritardo_minuti} minuti`, quota ? 'si' : 'no', quota ? `Spetta il ${quota * 100}% del prezzo del biglietto (art. 19), pagato entro un mese, in denaro se lo chiedi.` : 'Sotto i 60 minuti non spetta l\'indennizzo per il singolo viaggio.', [FONTI.reg782]));
    if (r.ritardo_minuti >= 60) voci.push(voce('Assistenza', 'si', 'Con 60 minuti di ritardo o più spettano pasti e bevande, e l\'albergo se serve.', [FONTI.reg782]));
  }
  if (quota && r.causa_treno) voci.push(forzaMaggiore
    ? voce('Il motivo può escludere l\'indennizzo', 'forse', 'Maltempo estremo, calamità, persone sui binari, furti di cavi o interventi della polizia sono cause esterne: l\'impresa può non pagare l\'indennizzo, se lo prova. Rimborso, alternativa e assistenza restano dovuti.', [FONTI.reg782])
    : voce('Il motivo non esclude l\'indennizzo', 'si', 'Scioperi del personale, guasti ai treni o alla linea e problemi di altre imprese non sono forza maggiore.', [FONTI.reg782]));
  if (r.abbonato === true) voci.push(voce('Sei abbonato', 'si', 'Anche gli abbonati hanno diritto all\'indennizzo. Sui treni regionali, se in un mese almeno il 10% dei treni della tua tratta ha più di 15 minuti di ritardo o è soppresso, spetta almeno il 10% dell\'abbonamento mensile: controlla la carta dei servizi.', [{ titolo: 'ART, delibera 71/2024 sugli indennizzi agli abbonati', url: 'https://www.autorita-trasporti.it/wp-content/uploads/2024/05/Delibera-n.-71_2024_signed.pdf' }]));
  let importo = null;
  if (quota && typeof r.prezzo_treno === 'number') {
    const v = Math.round(r.prezzo_treno * quota * 100) / 100;
    importo = { valore: v, testo: `${eur(v)}, il ${quota * 100}% di ${eur(r.prezzo_treno)}.${v < 4 ? ' Sotto i 4 € l\'impresa può non pagare.' : ''}` };
  } else if (quota) voci.push(voce('Prezzo del biglietto', 'dato', 'Serve per calcolare l\'indennizzo.', [], 'prezzo_treno'));
  if (r.data_treno) lista.push({ id: 'reclamo', data: mesiDopo(data(r.data_treno), 3), titolo: 'Reclamo all\'impresa ferroviaria', testo: 'Il reclamo va presentato entro 3 mesi dal viaggio; l\'impresa risponde entro un mese.' });
  if (r.gia_reclamato && r.data_reclamo && r.risposta !== 'positiva') {
    const dr = data(r.data_reclamo);
    lista.push({ id: 'art', data: aggiungiGiorni(dr, 30), titolo: 'Reclamo all\'ART o conciliazione', testo: 'Dopo 30 giorni senza risposta puoi reclamare all\'ART sul portale SiTe e chiedere la conciliazione gratuita, entro un anno dal reclamo.' });
  }
  const tono = !quota && r.soppresso !== true ? (typeof r.ritardo_minuti === 'number' ? 'no' : 'dato') : forzaMaggiore && quota ? 'forse' : 'si';
  const titolo = { si: importo ? `Ti spetta un indennizzo di ${eur(importo.valore)}` : r.soppresso && !quota ? 'Hai diritto al rimborso o a un treno alternativo' : 'Hai diritto all\'indennizzo', forse: 'L\'indennizzo potrebbe non spettare', no: 'L\'indennizzo per questo viaggio non spetta', dato: 'Servono ancora alcune risposte' }[tono];
  const testo = { si: 'Chiedilo all\'impresa con il suo modulo o con la lettera qui sotto, entro 3 mesi dal viaggio.', forse: 'Chiedilo comunque: tocca all\'impresa provare la causa esterna.', no: r.abbonato ? 'Da abbonato controlla gli indennizzi mensili per i ritardi ripetuti nella carta dei servizi.' : 'Sotto i 60 minuti non c\'è indennizzo per il singolo viaggio.', dato: 'Indica il ritardo all\'arrivo e il prezzo del biglietto.' }[tono];
  return { voci, fonti, verdetto: { tono, titolo, testo }, importo, scadenze: lista, passi: passiTrasporti('treno'), documento: tono === 'si' || tono === 'forse' ? { tipo: 'treno', destinatario: r.impresa || 'l\'impresa ferroviaria' } : null };
}

// ---------- Bollette ----------

const DECORRENZA = { luce: '2018-03-01', gas: '2019-01-01', acqua: '2020-01-01' };
const NOMI_SERVIZIO = { luce: 'luce', gas: 'gas', acqua: 'acqua', rifiuti: 'rifiuti' };

function bolletta(r, oggi) {
  const voci = [];
  const fonti = [FONTI.l205, FONTI.areraPrescr, FONTI.tiqv, FONTI.conciliazioneArera];
  const lista = [];
  let prescrizione = null;
  if (r.problema_bolletta === 'vecchia') {
    if (r.servizio === 'rifiuti') voci.push(voce('La prescrizione di due anni non vale per la TARI', 'no', 'La tassa sui rifiuti segue le regole dei tributi locali, con termini più lunghi. Puoi comunque reclamare al gestore per errori di calcolo.', [FONTI.l205]));
    else if (r.domestico === false) voci.push(voce('La prescrizione di due anni vale per case, microimprese e professionisti', 'no', 'Le imprese più grandi restano con la prescrizione ordinaria.', [FONTI.l205]));
    else if (!r.servizio || !r.scadenza_bolletta || !r.consumi_dal) voci.push(voce('Consumi più vecchi di due anni', 'dato', 'Servono il servizio, la scadenza della bolletta e la data di inizio dei consumi fatturati.', [FONTI.l205], !r.servizio ? 'servizio' : !r.scadenza_bolletta ? 'scadenza_bolletta' : 'consumi_dal'));
    else {
      const limite = new Date(data(r.scadenza_bolletta));
      limite.setUTCFullYear(limite.getUTCFullYear() - 2);
      const vale = r.scadenza_bolletta >= DECORRENZA[r.servizio];
      prescrizione = vale && data(r.consumi_dal) < limite;
      voci.push(voce(prescrizione ? 'Ci sono consumi prescritti' : 'Nessun consumo più vecchio di due anni', prescrizione ? 'si' : 'no', prescrizione
        ? `La bolletta scade il ${scrittaBreve(data(r.scadenza_bolletta))}: i consumi precedenti al ${scrittaBreve(limite)} sono più vecchi di due anni e non li devi pagare, anche se la lettura mancata dipendeva da te. Ma la prescrizione non scatta da sola: devi dichiararla per iscritto al venditore (c'è la lettera pronta qui sotto, oppure il modulo allegato alla bolletta).`
        : vale ? 'I consumi fatturati rientrano negli ultimi due anni rispetto alla scadenza della bolletta: la prescrizione breve non si applica.' : `La prescrizione di due anni vale per le bollette ${NOMI_SERVIZIO[r.servizio]} con scadenza dal ${scrittaBreve(data(DECORRENZA[r.servizio]))}.`, [FONTI.l205, FONTI.areraPrescr]));
    }
  }
  if (r.problema_bolletta === 'doppia') voci.push(voce('Doppia fatturazione', 'si', 'Il venditore deve rimborsarti entro 15 giorni dal reclamo. Se la doppia fattura nasce da un cambio di fornitore, puoi usare anche lo SMART Help dello Sportello per il consumatore ARERA.', [FONTI.tiqv]));
  if (r.problema_bolletta === 'errata') voci.push(voce('Importi sbagliati', 'si', 'Fai reclamo scritto: il venditore deve rispondere entro 30 giorni e accreditare la rettifica entro 60 giorni (90 con fatturazione ogni quattro mesi).', [FONTI.tiqv]));
  const acquaRifiuti = r.servizio === 'acqua' || r.servizio === 'rifiuti';
  if (typeof r.importo_bolletta === 'number' && r.importo_bolletta > 50 && r.scadenza_bolletta && r.servizio !== 'rifiuti') {
    lista.push({ id: 'rate', data: aggiungiGiorni(data(r.scadenza_bolletta), 10), titolo: 'Chiedere di pagare a rate', testo: 'Per le bollette sopra 50 € con conguagli anomali o fatturazione in ritardo si possono chiedere le rate entro 10 giorni dalla scadenza, con interessi al tasso BCE.' });
  }
  if (r.gia_reclamato && r.data_reclamo) {
    const dr = data(r.data_reclamo);
    const giorniRisposta = acquaRifiuti ? 42 : 30;
    lista.push({ id: 'risposta', data: aggiungiGiorni(dr, giorniRisposta), titolo: 'Risposta al reclamo', testo: acquaRifiuti ? 'Il gestore deve rispondere entro 30 giorni lavorativi.' : 'Il venditore deve rispondere entro 30 giorni. Se tarda, ti spetta in bolletta un indennizzo automatico di 30 €, che sale a 60 e 90 € se il ritardo raddoppia o triplica.' });
    if (r.risposta !== 'positiva') lista.push({ id: 'conciliazione', data: r.risposta === 'negativa' ? dr : aggiungiGiorni(dr, r.servizio === 'acqua' ? 50 : r.servizio === 'rifiuti' ? 60 : 40), titolo: 'Chiedere la conciliazione ARERA', testo: 'Gratuita e online con SPID o CIE. Si può chiedere subito dopo una risposta insoddisfacente, o senza risposta dopo 40 giorni (luce e gas), 50 (acqua) o 60 (rifiuti). Serve prima di andare dal giudice.' });
    if (r.risposta === 'no' && !acquaRifiuti && giorniTra(dr, oggi) > 30) voci.push(voce('Indennizzo automatico per la risposta in ritardo', 'si', `Sono passati ${giorniTra(dr, oggi)} giorni dal reclamo: ti spetta in bolletta un indennizzo di ${giorniTra(dr, oggi) > 90 ? '90' : giorniTra(dr, oggi) > 60 ? '60' : '30'} €.`, [FONTI.tiqv]));
  }
  const tono = prescrizione ? 'si' : ['doppia', 'errata'].includes(r.problema_bolletta) ? 'si' : prescrizione === false || (r.problema_bolletta === 'vecchia' && voci.some((v) => v.esito === 'no')) ? 'no' : r.problema_bolletta ? 'forse' : 'dato';
  const titolo = prescrizione ? 'Puoi non pagare i consumi più vecchi di due anni' : tono === 'si' ? 'Hai diritto alla rettifica' : tono === 'no' ? 'La prescrizione breve non si applica' : tono === 'forse' ? 'Puoi fare reclamo' : 'Che problema hai con la bolletta?';
  const testo = prescrizione ? 'Manda la lettera di eccezione di prescrizione al venditore e paga solo la parte non prescritta. Se paghi tutto, non potrai riavere quanto versato.' : tono === 'dato' ? 'Scegli il servizio e il problema.' : 'Manda un reclamo scritto ai recapiti indicati in bolletta, con il codice POD o PDR. Se la risposta non arriva o non ti soddisfa, c\'è la conciliazione gratuita ARERA.';
  return { voci, fonti: r.servizio === 'acqua' || r.servizio === 'rifiuti' ? fonti : fonti.concat(FONTI.rateArera), verdetto: { tono, titolo, testo }, importo: null, scadenze: lista, passi: [
    { titolo: 'Reclamo scritto al venditore o gestore', testo: 'Ai recapiti indicati in bolletta, con codice cliente e POD o PDR. Meglio PEC o raccomandata.', link: FONTI.tiqv.url },
    { titolo: 'Conciliazione ARERA gratuita', testo: 'Online, con SPID o CIE, se la risposta manca o non soddisfa.', link: FONTI.conciliazioneArera.url },
    { titolo: 'SMART Help', testo: 'Per bonus sociali, doppia fatturazione dopo un cambio fornitore e indennizzi non pagati.', link: 'https://www.sportelloperilconsumatore.it/luce-e-gas/faq' },
  ], documento: tono === 'si' || tono === 'forse' ? { tipo: prescrizione ? 'prescrizione' : 'reclamo_bolletta', destinatario: r.fornitore || 'il venditore' } : null };
}

// ---------- Telefono e internet ----------

const TARIFFE_TLC = { interruzione: 6, malfunzionamento: 3, attivazione: 7.5, sospensione: 7.5, non_richiesti: 5, portabilita: 1.5 };

function telefono(r, oggi) {
  const voci = [];
  const fonti = [FONTI.agcomIndennizzi, FONTI.agcomProcedure, FONTI.agcom45];
  const lista = [];
  let importo = null;
  const inizio = r.data_inizio ? data(r.data_inizio) : null;
  const fine = r.risolto === true && r.data_fine ? data(r.data_fine) : r.risolto === false ? oggi : null;
  if (r.disservizio === 'costi_recesso') {
    voci.push(voce('Recesso e cambio operatore', 'si', 'Puoi disdire o cambiare operatore con un preavviso di massimo 30 giorni. I costi di uscita devono corrispondere ai costi reali e al valore del contratto, ed essere stati dichiarati prima. Dopo il rinnovo automatico si recede senza penali; se l\'operatore cambia il contratto puoi recedere gratis entro 60 giorni.', [FONTI.bersani]));
  } else if (r.disservizio && inizio && fine) {
    const giorni = Math.max(0, giorniTra(inizio, fine));
    let tariffa = TARIFFE_TLC[r.disservizio];
    if (r.fibra === true && ['interruzione', 'malfunzionamento', 'attivazione'].includes(r.disservizio)) tariffa *= 4 / 3;
    if (r.affari === true) tariffa *= 2;
    const valore = Math.round(giorni * tariffa * 100) / 100;
    importo = { valore, testo: `${giorni} giorni per ${eur(Math.round(tariffa * 100) / 100)} al giorno = ${eur(valore)}${r.fibra ? ', con l\'aumento di un terzo per la banda ultralarga' : ''}${r.affari ? ', raddoppiato per l\'utenza affari' : ''}. ${r.disservizio === 'non_richiesti' ? 'In più lo storno di tutti gli addebiti.' : r.disservizio === 'portabilita' ? 'Se il ritardo riguarda solo la portabilità del numero, gli euro al giorno sono 5.' : ''}` };
    voci.push(voce('Indennizzo previsto dal regolamento AGCOM', 'si', `Per questo disservizio il regolamento indennizzi prevede ${eur(TARIFFE_TLC[r.disservizio])} al giorno. ${['attivazione', 'sospensione'].includes(r.disservizio) ? 'Dovrebbe arrivare in automatico nella prima fattura utile, 45 giorni dopo la soluzione.' : 'Va chiesto con il reclamo.'}`, [FONTI.agcomIndennizzi]));
  } else if (r.disservizio) voci.push(voce('Durata del disservizio', 'dato', 'Servono la data di inizio e, se è risolto, la data di fine.', [FONTI.agcomIndennizzi], !inizio ? 'data_inizio' : 'risolto'));
  if (inizio && r.disservizio !== 'costi_recesso') {
    const limite = mesiDopo(inizio, 3);
    lista.push({ id: 'segnalazione', data: limite, titolo: 'Segnalare il disservizio all\'operatore', testo: 'Gli indennizzi si perdono se il problema non è segnalato entro 3 mesi da quando lo conosci. Resta il rimborso delle somme non dovute.' });
    const reclamo = r.gia_reclamato && r.data_reclamo ? data(r.data_reclamo) : null;
    if ((reclamo && reclamo > limite) || (!reclamo && oggi > limite)) voci.push(voce('Segnalazione oltre i 3 mesi', 'no', 'Il disservizio non è stato segnalato entro 3 mesi: gli indennizzi sono esclusi, ma puoi ancora chiedere il rimborso di quanto pagato per un servizio che non hai avuto.', [FONTI.agcomIndennizzi]));
  }
  if (r.gia_reclamato && r.data_reclamo && r.risposta !== 'positiva') {
    const dr = data(r.data_reclamo);
    lista.push({ id: 'risposta', data: aggiungiGiorni(dr, 45), titolo: 'Risposta al reclamo', testo: 'L\'operatore deve rispondere entro 45 giorni (o meno, se la carta dei servizi lo prevede).' });
    const ritardo = giorniTra(aggiungiGiorni(dr, 45), oggi);
    if (r.risposta === 'no' && ritardo > 0) voci.push(voce('Indennizzo per la mancata risposta al reclamo', 'si', `${eur(Math.min(300, ritardo * 2.5))}: 2,50 € per ogni giorno di ritardo dopo i 45 giorni, fino a 300 €.`, [FONTI.agcomIndennizzi]));
    lista.push({ id: 'conciliaweb', data: dr, titolo: 'Conciliazione su ConciliaWeb', testo: 'Gratuita, con SPID o CIE. Obbligatoria prima del giudice: dopo 30 giorni dalla domanda si può comunque andare in tribunale. Se la linea è sospesa, chiedi insieme la riattivazione con il modulo GU5.' });
  }
  const escluso = voci.some((v) => v.titolo === 'Segnalazione oltre i 3 mesi');
  const tono = !r.disservizio ? 'dato' : escluso ? 'forse' : importo || r.disservizio === 'costi_recesso' ? 'si' : 'dato';
  const titolo = { si: importo ? `Ti spettano circa ${eur(importo.valore)} di indennizzo` : 'Puoi contestare i costi', forse: 'Gli indennizzi sono a rischio, il rimborso no', dato: 'Servono ancora alcune risposte' }[tono];
  const testo = { si: 'Chiedili con un reclamo scritto all\'operatore. Se non risponde o rifiuta, la conciliazione su ConciliaWeb è gratuita.', forse: 'Il ritardo nella segnalazione fa perdere gli indennizzi, ma non il diritto a riavere quanto pagato in più.', dato: 'Indica il tipo di disservizio e le date.' }[tono];
  return { voci, fonti: r.disservizio === 'costi_recesso' ? fonti.concat(FONTI.bersani) : fonti, verdetto: { tono, titolo, testo }, importo, scadenze: lista, passi: [
    { titolo: 'Reclamo all\'operatore', testo: 'Per iscritto o PEC, oppure al servizio clienti conservando il codice del reclamo.', link: FONTI.agcom45.url },
    { titolo: 'Conciliazione su ConciliaWeb', testo: 'Gratuita, con SPID o CIE. Con la linea sospesa, chiedi anche il provvedimento GU5.', link: 'https://www.agcom.it/agcom-per-te/i-miei-diritti/contenzioso-tra-utenti-e-operatori' },
    { titolo: 'Definizione GU14', testo: 'Se la conciliazione fallisce, entro 3 mesi: il Corecom o l\'AGCOM decide su rimborsi e indennizzi entro 180 giorni.', link: FONTI.agcomProcedure.url },
  ], documento: tono === 'si' || tono === 'forse' ? { tipo: 'telefono', destinatario: r.operatore || 'l\'operatore' } : null };
}

// ---------- Banche ----------

function banca(r, oggi) {
  const voci = [];
  const fonti = [FONTI.bdiReclami, FONTI.abf];
  const lista = [];
  let tono = 'dato';
  let importo = null;
  if (r.banca_tipo === 'non_autorizzata') {
    fonti.unshift(FONTI.dlgs11art9, FONTI.dlgs11art11, FONTI.dlgs11art12);
    if (r.data_addebito) {
      const limite = mesiDopo(data(r.data_addebito), 13);
      lista.push({ id: 'tredici', data: limite, titolo: 'Ultimo giorno per contestare l\'operazione', testo: 'Va segnalata alla banca subito, e comunque entro 13 mesi dall\'addebito.' });
      if (oggi > limite) voci.push(voce('Sono passati più di 13 mesi', 'no', 'Il termine per contestare un\'operazione non autorizzata è scaduto.', [FONTI.dlgs11art9]));
    }
    voci.push(voce('Rimborso entro il giorno lavorativo successivo', 'si', 'Per un\'operazione che non hai autorizzato la banca deve rimborsarti subito, al più tardi entro la fine della giornata operativa successiva alla segnalazione. Tocca alla banca provare che l\'operazione era autenticata e che c\'è stata frode o colpa grave tua: il solo uso della carta o dell\'app non basta.', [FONTI.dlgs11art11]));
    const franchigia = r.bloccato === true ? 0 : 50;
    voci.push(voce(franchigia ? 'Al massimo 50 € restano a tuo carico' : 'Nessuna franchigia', 'si', franchigia ? 'Per l\'uso di una carta rubata o smarrita la franchigia massima è 50 €; non paghi nulla se la banca non ha chiesto l\'autenticazione forte o se il furto non era percepibile.' : 'Le operazioni dopo la richiesta di blocco sono interamente a carico della banca.', [FONTI.dlgs11art12]));
    if (r.codici_dati === true) voci.push(voce('Hai dato codici o conferme', 'forse', 'La banca potrebbe parlare di colpa grave, che però deve provare. Gli arbitri valutano caso per caso, per esempio quanto era credibile la truffa (finto operatore della banca, numero falsificato). Vale la pena reclamare.', [FONTI.dlgs11art12]));
    if (typeof r.importo_banca === 'number') importo = { valore: Math.max(0, r.importo_banca - franchigia), testo: `${eur(Math.max(0, r.importo_banca - franchigia))}: l'importo addebitato${franchigia ? ' meno la franchigia massima di 50 €' : ''}.` };
    tono = voci.some((v) => v.esito === 'no') ? 'no' : r.codici_dati === true ? 'forse' : 'si';
  } else if (r.banca_tipo === 'altro') {
    voci.push(voce('Reclamo alla banca', 'si', 'La banca deve rispondere entro 60 giorni. Poi puoi rivolgerti all\'Arbitro Bancario Finanziario.', [FONTI.bdiReclami]));
    tono = 'forse';
  }
  if (r.gia_reclamato && r.data_reclamo && r.risposta !== 'positiva') {
    const dr = data(r.data_reclamo);
    lista.push({ id: 'risposta', data: r.banca_tipo === 'non_autorizzata' ? aggiungiGiorni(dr, 21) : aggiungiGiorni(dr, 60), titolo: 'Risposta della banca', testo: r.banca_tipo === 'non_autorizzata' ? 'Per i servizi di pagamento la banca risponde entro 15 giornate lavorative (35 in casi eccezionali, con una risposta provvisoria).' : 'La banca deve rispondere entro 60 giorni.' });
    lista.push({ id: 'abf', data: mesiDopo(dr, 12), titolo: 'Ultimo giorno per il ricorso all\'ABF', testo: 'Il ricorso all\'Arbitro Bancario Finanziario costa 20 €, rimborsati se vinci anche solo in parte, e va presentato entro 12 mesi dal reclamo. Decide entro 90 giorni; vale fino a 200.000 €.' });
  }
  const titolo = { si: importo ? `La banca deve rimborsarti ${eur(importo.valore)}` : 'La banca deve rimborsarti', forse: 'Fai reclamo: puoi ottenere il rimborso', no: 'Il termine per contestare è scaduto', dato: 'Qual è il problema con la banca?' }[tono];
  const testo = { si: 'Chiedi subito il blocco dello strumento, se non l\'hai fatto, e manda il reclamo scritto all\'ufficio reclami: qui sotto c\'è la lettera pronta. Denuncia anche la frode alle forze dell\'ordine.', forse: 'Manda il reclamo scritto all\'ufficio reclami. Se la risposta non arriva o non ti soddisfa, c\'è l\'Arbitro Bancario Finanziario.', no: 'Puoi ancora scrivere alla banca, ma la legge non la obbliga più a rimborsarti.', dato: 'Scegli il tipo di problema.' }[tono];
  return { voci, fonti, verdetto: { tono, titolo, testo }, importo, scadenze: lista, passi: [
    { titolo: 'Blocco e segnalazione', testo: 'Per le operazioni non autorizzate: blocco immediato e segnalazione alla banca, poi denuncia.', link: FONTI.dlgs11art11.url },
    { titolo: 'Reclamo all\'ufficio reclami', testo: 'Per PEC o raccomandata.', link: FONTI.bdiReclami.url },
    { titolo: 'Arbitro Bancario Finanziario', testo: 'Sul portale ABF, 20 € rimborsati se vinci, entro 12 mesi dal reclamo. Per gli investimenti c\'è l\'Arbitro per le controversie finanziarie della Consob, gratuito.', link: 'https://www.arbitrobancariofinanziario.it/presentare-ricorso/index.html' },
  ], documento: tono === 'si' || tono === 'forse' ? { tipo: 'banca', destinatario: r.banca || 'la banca' } : null };
}

const CASI_FN = { volo, bagaglio, treno, bolletta, telefono, banca };

/**
 * Valuta un caso.
 * @param {object} r risposte del questionario
 * @param {object} [opz] { oggi: 'AAAA-MM-GG' }
 */
export function valuta(r, opz = {}) {
  const oggi = opz.oggi ? data(opz.oggi) : oggiCal();
  if (!CASI_FN[r.caso]) {
    return { oggi: iso(oggi), caso: null, verdetto: { tono: 'dato', titolo: 'Che cosa è successo?', testo: 'Scegli il tuo caso: volo, bagaglio, treno, bolletta, telefono o banca.' }, voci: [], importo: null, scadenze: [], passi: [], fonti: [], documento: null };
  }
  const v = CASI_FN[r.caso](r, oggi);
  const fonti = [...v.fonti, ...v.voci.flatMap((x) => x.fonti), FONTI.cc1219, FONTI.cc2943].filter((f, i, a) => f && a.findIndex((x) => x.url === f.url) === i);
  return { oggi: iso(oggi), caso: r.caso, ...v, scadenze: scadenze(v.scadenze, oggi), fonti };
}
