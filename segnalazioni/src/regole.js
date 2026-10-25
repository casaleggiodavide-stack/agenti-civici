// Regole di «Segnalazioni urbane indipendenti»: chi è competente, a chi scrivere,
// cosa chiedere e quando sollecitare. Ogni passaggio cita la sua fonte.

import FONTI from './dati/fonti.js';
import { data, iso, aggiungiGiorni, oggi as oggiDi, giorniTra } from './comune/date.js';
import { STRADALI } from './domande.js';

export const VERIFICATO = FONTI.verificato;
export const CATEGORIE = Object.fromEntries(FONTI.categorie.map((c) => [c.id, c]));
const N = FONTI.norme;
const norma = (id) => N[id] && { titolo: N[id].titolo, url: N[id].url };
const ANAS = FONTI.anas;

const L241 = { titolo: 'L. 241/1990, art. 18-bis: ricevuta e protocollo di ogni istanza o segnalazione', url: N.l241_18bis?.url };
export const SOLLECITO_DOPO = 30; // giorni: promemoria, non un termine di legge

// Regione di ogni sigla di provincia (uguale a chiedo-gli-atti/src/dati/territorio.js)
const R = {
  Piemonte: 'AL AT BI CN NO TO VB VC', "Valle d'Aosta": 'AO', Lombardia: 'BG BS CO CR LC LO MB MI MN PV SO VA', 'Trentino-Alto Adige': 'BZ TN',
  Veneto: 'BL PD RO TV VE VI VR', 'Friuli-Venezia Giulia': 'GO PN TS UD', Liguria: 'GE IM SP SV', 'Emilia-Romagna': 'BO FC FE MO PC PR RA RE RN',
  Toscana: 'AR FI GR LI LU MS PI PO PT SI', Umbria: 'PG TR', Marche: 'AN AP FM MC PU', Lazio: 'FR LT RI RM VT', Abruzzo: 'AQ CH PE TE', Molise: 'CB IS',
  Campania: 'AV BN CE NA SA', Puglia: 'BA BR BT FG LE TA', Basilicata: 'MT PZ', Calabria: 'CS CZ KR RC VV', Sicilia: 'AG CL CT EN ME PA RG SR TP',
  Sardegna: 'CA CI NU OG OR OT SS SU VS',
};
export const REGIONE_DI = Object.fromEntries(Object.entries(R).flatMap(([reg, s]) => s.split(' ').map((x) => [x, reg])));
const SLUG_ANAS = { "Valle d'Aosta": 'aosta', 'Emilia-Romagna': 'emiliaromagna', 'Friuli-Venezia Giulia': 'friuliveneziagiulia' };

/** PEC della struttura territoriale ANAS della regione, se è nell'elenco ufficiale. */
export function pecAnas(regione) {
  if (!regione) return null;
  const slug = SLUG_ANAS[regione] || regione.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
  return ANAS.pec_elencate.find((p) => p.startsWith(`anas.${slug}@`)) || null;
}

/** Ente dell'Indice PA per categoria e provincia (Provincia o Città metropolitana, ASL, ARPA). */
export function cercaEnte(enti, { categorie, prov, regione, nome }) {
  if (!enti) return [];
  return enti.filter((e) => categorie.includes(e.cat)
    && (!prov || e.prov === prov)
    && (!regione || REGIONE_DI[e.prov] === regione)
    && (!nome || nome.test(e.nome)));
}

const ente = (e, ruolo, perche) => e && { ruolo, nome: e.nome, pec: e.pec, sito: e.sito, perche };
const senzaPec = (nome, ruolo, perche, dove) => ({ ruolo, nome, pec: null, perche, dove });

/**
 * Valuta una segnalazione.
 * @param r risposte del questionario; r.ente è il Comune scelto da IndicePA ({nome, prov, pec, sito, cat})
 * @param opz { enti: righe indicizzate di IndicePA per trovare Provincia, ASL e ARPA; oggi }
 */
export function valuta(r, opz = {}) {
  const oggi = oggiDi(opz.oggi);
  const c = CATEGORIE[r.categoria];
  const comune = r.ente || null;
  const prov = comune?.prov;
  const regione = REGIONE_DI[prov];
  const voci = [];
  const passi = [];
  const destinatari = [];
  const telefoni = [];
  const fonti = [];

  if (!c) {
    return {
      verdetto: { tono: 'dato', titolo: 'Scegli il tipo di problema', testo: 'Dal tipo di problema dipende chi deve intervenire: il Comune, la Provincia, l\'ANAS, il gestore dell\'acqua o dei rifiuti, l\'ARPA o l\'ASL.' },
      voci, passi, destinatari, telefoni, scadenze: [], documento: null, fonti: [], categoria: null,
    };
  }

  // 1. pericolo: prima il telefono
  if (r.pericolo === true) {
    telefoni.push({ numero: '112', chi: 'Numero unico di emergenza', quando: c.urgenza });
    if (r.strada === 'statale') telefoni.push({ numero: '800 841 148', chi: 'Pronto ANAS, tutti i giorni a qualsiasi ora', quando: 'Sulle strade statali, per pericoli e ostacoli: ANAS avverte che PEC ed email non sono lette in tempo reale.' });
    fonti.push({ titolo: 'Numero unico di emergenza 112', url: 'https://112.gov.it/' });
  }

  // 2. chi è competente
  const strada = STRADALI.has(c.id) ? (r.strada || null) : null;
  const provincia = () => cercaEnte(opz.enti, { categorie: ['L5', 'L45'], prov })[0];
  if (strada === 'statale') {
    const pec = pecAnas(regione);
    destinatari.push({ ruolo: 'principale', nome: `ANAS, struttura territoriale${regione ? ` ${regione}` : ''}`, pec: pec || ANAS.pec_servizio_clienti, perche: 'ANAS gestisce le strade statali (SS) come ente proprietario: tocca a lei la manutenzione e la segnaletica.', dove: ANAS.pec_strutture_territoriali_url });
    if (comune) destinatari.push(ente(comune, 'copia', 'Per conoscenza alla polizia locale, che può verificare il pericolo e segnalarlo.'));
    fonti.push(norma('cds_14'), { titolo: 'ANAS, indirizzi PEC delle strutture territoriali', url: ANAS.pec_strutture_territoriali_url });
  } else if (strada === 'provinciale') {
    const p = provincia();
    destinatari.push(p ? ente(p, 'principale', 'Le strade provinciali (SP) sono della Provincia o della Città metropolitana, che ne cura manutenzione e segnaletica.') : senzaPec('Provincia o Città metropolitana', 'principale', 'Le strade provinciali (SP) sono della Provincia o della Città metropolitana.', 'Cerca la PEC nel sito della Provincia o su IndicePA.'));
    if (comune) destinatari.push(ente(comune, 'copia', 'Per conoscenza al Comune e alla polizia locale.'));
    fonti.push(norma('cds_14'), norma('l56_2014_1'));
  } else if (strada === 'autostrada') {
    destinatari.push(senzaPec('Società concessionaria dell\'autostrada', 'principale', 'Sulle autostrade a pedaggio interviene il concessionario: il numero di assistenza è sui cartelli e sul biglietto.', 'Per i pericoli in autostrada chiama il 112 o il numero del concessionario indicato sui cartelli.'));
    fonti.push(norma('cds_14'));
  } else if (c.id === 'scarichi_odori' || (c.id === 'rumore')) {
    const arpa = cercaEnte(opz.enti, { categorie: ['L2'], regione, nome: /protezione|ambient/i })[0];
    if (c.id === 'scarichi_odori') {
      destinatari.push(arpa ? ente(arpa, 'principale', 'L\'agenzia regionale per l\'ambiente controlla scarichi, emissioni e inquinamento.') : senzaPec(`Agenzia per l'ambiente${regione ? ` (${regione})` : ''}`, 'principale', 'L\'agenzia regionale o provinciale per l\'ambiente controlla scarichi ed emissioni.', 'Nelle province autonome di Trento e Bolzano è l\'APPA: cerca la PEC sul suo sito.'));
      if (comune) destinatari.push(ente(comune, 'copia', 'Al Comune e alla polizia locale, che possono intervenire subito e ordinare la cessazione.'));
      fonti.push(norma('l132_2016_3'));
    } else {
      if (comune) destinatari.push(ente(comune, 'principale', 'Il Comune, con la polizia locale e l\'ufficio ambiente, controlla il rumore e può chiedere le misure all\'agenzia per l\'ambiente.'));
      if (arpa) destinatari.push(ente(arpa, 'copia', 'L\'agenzia per l\'ambiente fa le misure del rumore su richiesta del Comune.'));
      fonti.push(norma('l447_1995'), norma('cp_659'));
    }
  } else if (c.id === 'amianto' || c.id === 'animali') {
    const asl = cercaEnte(opz.enti, { categorie: ['L7'], prov });
    const perche = c.id === 'amianto' ? 'Il dipartimento di prevenzione dell\'ASL valuta il rischio dell\'amianto e può ordinare la bonifica.' : 'I servizi veterinari dell\'ASL intervengono per animali vaganti, feriti o morti.';
    if (asl.length === 1) destinatari.push(ente(asl[0], 'principale', perche));
    else destinatari.push(senzaPec('ASL competente', 'principale', perche, asl.length ? `In provincia ci sono più ASL: ${asl.map((a) => a.nome).join('; ')}. Scegli quella del tuo territorio.` : 'Cerca la PEC dell\'ASL sul suo sito.'));
    if (comune) destinatari.push(ente(comune, 'copia', 'Al Comune, che ha poteri di ordinanza per igiene e salute.'));
    fonti.push(c.id === 'amianto' ? norma('l257_1992') : norma('l281_1991_2'), norma('dlgs_502_1992_7ter'));
  } else if (c.id === 'perdita_acqua') {
    destinatari.push(senzaPec('Gestore del servizio idrico', 'principale', 'Le perdite e i guasti di rete e fognatura li ripara il gestore del servizio idrico.', 'Il numero di pronto intervento, attivo a ogni ora, è sulla bolletta dell\'acqua. Per le situazioni pericolose il tecnico deve arrivare entro poche ore.'));
    if (comune) destinatari.push(ente(comune, 'copia', 'Al Comune, per conoscenza e per l\'eventuale danno alla strada.'));
    telefoni.push({ numero: 'Pronto intervento del gestore', chi: 'Numero indicato in bolletta', quando: 'Per perdite abbondanti, acqua potabile alterata o fogne che traboccano chiama subito.' });
    fonti.push(norma('tua_147'));
  } else if (c.id === 'edificio_pubblico_degrado' && r.scuola_superiore === true) {
    const p = provincia();
    destinatari.push(p ? ente(p, 'principale', 'Gli edifici delle scuole superiori sono della Provincia o della Città metropolitana.') : senzaPec('Provincia o Città metropolitana', 'principale', 'Gli edifici delle scuole superiori sono della Provincia o della Città metropolitana.', 'Cerca la PEC su IndicePA.'));
    if (comune) destinatari.push(ente(comune, 'copia', 'Al Comune, per conoscenza.'));
    fonti.push(norma('l23_1996_3'));
  } else {
    if (comune) destinatari.push(ente(comune, 'principale', perchéComune(c.id, strada)));
    else destinatari.push(senzaPec('Il Comune', 'principale', perchéComune(c.id, strada), 'Scegli il Comune qui sopra per avere la PEC.'));
    if (['rifiuti_abbandonati', 'cassonetti_pieni'].includes(c.id)) {
      destinatari.push(senzaPec('Gestore della raccolta rifiuti', 'copia', 'Il gestore del servizio rifiuti raccoglie i rifiuti urbani, anche quelli abbandonati su strada pubblica.', 'I recapiti del gestore sono sull\'avviso di pagamento della TARI.'));
      fonti.push(norma('tua_192'), norma('tua_198'), norma('tua_183'));
    }
    if (c.id === 'veicolo_abbandonato') fonti.push(norma('dm_460_1999'), norma('dlgs_209_3'));
    if (c.id === 'barriere_architettoniche') fonti.push(norma('l41_1986_32'), norma('l104_1992_24'), norma('dpr_503_1996'));
    if (c.id === 'segnaletica') fonti.push(norma('cds_37'));
    if (strada === 'regionale') voci.push({ esito: 'forse', titolo: 'Strada regionale', spiegazione: 'Le strade regionali esistono solo in alcune Regioni e spesso le gestisce la Provincia o una società regionale. Scriviamo al Comune chiedendo di inoltrare all\'ente competente: la legge lo prevede.' });
    if (STRADALI.has(c.id)) fonti.push(norma('cds_14'), norma('cds_2'));
  }

  // 3. controlli sulla segnalazione
  voci.push({ esito: 'si', titolo: c.nome.replace(/\s*\(categoria aggiuntiva[^)]*\)/, ''), spiegazione: `Di solito interviene: ${[...new Set(c.chi.map((x) => x.ente.split(/ [-–(]/)[0].trim()))].slice(0, 4).join(', ')}.` });
  if (!comune) voci.push({ esito: 'dato', titolo: 'Manca il Comune', spiegazione: 'Serve per la PEC e per trovare la Provincia, l\'ASL o l\'agenzia per l\'ambiente.', dato: 'ente' });
  if (!r.luogo && !r.coordinate) voci.push({ esito: 'dato', titolo: 'Manca il punto preciso', spiegazione: 'Senza indirizzo o coordinate la segnalazione rischia di restare ferma.', dato: 'luogo' });
  if (!r.descrizione) voci.push({ esito: 'dato', titolo: 'Manca la descrizione', spiegazione: 'Poche righe con i fatti: cosa, dove, quanto è grande, da quando.', dato: 'descrizione' });
  if (!r.foto) voci.push({ esito: 'forse', titolo: 'Nessuna foto', spiegazione: 'Una foto da vicino e una da lontano, con un riferimento riconoscibile, valgono più di molte parole.', dato: 'foto' });
  if (STRADALI.has(c.id) && !r.strada) voci.push({ esito: 'dato', titolo: 'Di chi è la strada?', spiegazione: FONTI.strade.regola, dato: 'strada' });

  // 4. passi
  if (r.pericolo === true) passi.push({ titolo: 'Prima chiama', testo: 'C\'è un pericolo immediato: chiama il 112 e solo dopo manda la segnalazione scritta, che serve a lasciare traccia.' });
  passi.push({ titolo: 'Manda la segnalazione dalla tua PEC', testo: 'La PEC dà una prova di invio e di consegna. Se non hai la PEC usa l\'email, conservando la ricevuta, o il protocollo del Comune. Allega le foto.' });
  passi.push({ titolo: 'Chiedi il numero di protocollo', testo: 'Ogni segnalazione o istanza ha diritto a una ricevuta con il numero di protocollo: se non arriva, chiedila.' });
  passi.push({ titolo: 'Segna la data e controlla', testo: `Se dopo circa ${SOLLECITO_DOPO} giorni non è cambiato niente, manda un sollecito. Non è un termine di legge, ma un tempo ragionevole per chiedere conto.` });
  fonti.push(L241);

  // 5. dopo l'invio
  const scadenze = [];
  let documento = { tipo: 'segnalazione' };
  if (r.data_invio) {
    const inviata = data(r.data_invio);
    const sollecito = aggiungiGiorni(inviata, SOLLECITO_DOPO);
    if (r.risposta !== 'risolto') {
      scadenze.push({ data: iso(sollecito), titolo: 'Sollecito della segnalazione', testo: 'Se il problema c\'è ancora e nessuno ha risposto, manda il sollecito che trovi qui.', scaduta: sollecito < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, sollecito)) });
    }
    if (['nessuna', 'presa'].includes(r.risposta) && sollecito <= oggi) documento = { tipo: 'sollecito' };
    if (r.risposta === 'inoltrata') passi.push({ titolo: 'Se ti dicono che non è di loro competenza', testo: 'Chiedi a chi spetta, e ricorda che un ufficio che riceve una segnalazione non sua deve inoltrarla all\'ufficio competente.' });
    if (['nessuna', 'presa'].includes(r.risposta)) {
      passi.push({ titolo: 'Se il sollecito non basta', testo: 'Puoi chiedere gli atti (lo stato della pratica, gli interventi programmati) con Chiedo gli atti, e rivolgerti al difensore civico. Se il pericolo è serio e nessuno interviene, puoi fare un esposto alla polizia locale o ai carabinieri.' });
    }
  }

  const tono = r.pericolo === true ? 'no' : voci.some((v) => v.esito === 'dato') ? 'dato' : 'si';
  const principale = destinatari.find((d) => d.ruolo === 'principale');
  const verdetto = {
    tono,
    titolo: r.risposta === 'risolto' ? 'Risolto: bene così' : r.pericolo === true ? 'Prima chiama il 112, poi scrivi' : principale ? `Scrivi a: ${principale.nome}` : 'Scegli il Comune',
    testo: r.risposta === 'risolto' ? 'Conserva la PEC e l\'eventuale risposta: servono se il problema si ripresenta.' : principale?.perche || '',
  };

  return {
    categoria: c, verdetto, voci, passi, destinatari: destinatari.filter(Boolean), telefoni, scadenze,
    documento: r.risposta === 'risolto' ? null : documento,
    cosaChiedere: c.cosa_chiedere || [],
    norme: (c.norme || []).filter((n) => n?.url),
    fonti: [...new Map([...fonti, ...(c.norme || [])].filter((f) => f?.url).map((f) => [f.url, f])).values()],
    istanza: FONTI.istanza,
  };
}

function perchéComune(id, strada) {
  if (['buca', 'marciapiede', 'lampione_spento', 'segnaletica', 'alberi_verde'].includes(id)) {
    return strada === 'regionale' || strada === 'non_so' || !strada
      ? 'Nel centro abitato le strade, i marciapiedi, l\'illuminazione e il verde sono quasi sempre del Comune. Se non lo fossero, il Comune deve inoltrare all\'ente competente.'
      : 'Il Comune è l\'ente proprietario delle strade comunali e di quelle urbane: tocca a lui la manutenzione.';
  }
  return {
    rifiuti_abbandonati: 'Il Comune deve far rimuovere i rifiuti abbandonati su aree pubbliche, tramite il gestore della raccolta, e cercare il responsabile.',
    cassonetti_pieni: 'Il Comune organizza la raccolta dei rifiuti e controlla il gestore del servizio.',
    veicolo_abbandonato: 'La polizia locale accerta l\'abbandono, cerca il proprietario e dispone la rimozione.',
    barriere_architettoniche: 'Il Comune deve eliminare le barriere negli spazi pubblici e avere un piano per farlo (PEBA).',
    edificio_pubblico_degrado: 'Gli edifici comunali, comprese scuole dell\'infanzia, elementari e medie, sono del Comune.',
    animali: 'Il Comune e i servizi veterinari dell\'ASL intervengono per gli animali vaganti o feriti.',
  }[id] || 'Il Comune è il primo ente a cui rivolgersi: se non è competente, deve inoltrare.';
}
