// Regole di «Disdici un abbonamento»: se puoi disdire, quando ha effetto, il preavviso,
// cosa possono chiederti e cosa no, entro quando agire e come mandare la disdetta.
// Ogni regola cita la sua fonte (disdette/dati/fonti.json, verificata il 15/11/2026 su
// Normattiva, AGCOM, ARERA, IVASS). Niente DOM: le stesse funzioni servono al server MCP.

import DATI from './dati/fonti.js';
import { data, iso, oggi as oggiDi, giorniTra, aggiungiGiorni } from './comune/date.js';

export const VERIFICATO = DATI.verificato;
const R = DATI.regole;

/** Le fonti: id → { titolo, url, testo }. */
export const FONTI = Object.fromEntries(Object.entries(R).map(([id, r]) => [id, { titolo: r.norma.titolo, url: r.norma.url, testo: r.testo }]));

export const CONTRATTI = {
  telefonia: 'Telefono fisso, cellulare o internet',
  paytv: 'Pay TV',
  servizi: 'Palestra, corsi o altri servizi',
  digitale: 'Abbonamento digitale (streaming, app, software)',
  rc_auto: 'Assicurazione RC auto o moto',
  polizza: 'Altra polizza danni (casa, infortuni, furto…)',
  energia: 'Luce o gas',
};

/** Aggiunge mesi a una data, fermandosi all'ultimo giorno del mese se serve. */
export function piuMesi(d, n) {
  const x = new Date(d);
  const giorno = x.getUTCDate();
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + n);
  const ultimo = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0, 12)).getUTCDate();
  x.setUTCDate(Math.min(giorno, ultimo));
  return x;
}

const lungo = (d) => (d ? d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');
const numeroOk = (x) => x !== undefined && x !== null && x !== '' && Number.isFinite(Number(x));
const DISTANZA = ['online', 'telefono', 'fuori', 'visita'];

/** Il ripensamento di 14 (o 30) giorni del Codice del consumo, se il canale lo prevede. */
export function ripensamento(c, oggiRif) {
  if (!DISTANZA.includes(c.canale)) return null;
  if (['rc_auto', 'polizza'].includes(c.tipo)) return null; // servizi assicurativi: fuori dagli artt. 52 e seguenti (art. 47)
  const firma = data(c.data_firma);
  const oggi = oggiDi(oggiRif);
  const giorni = c.canale === 'visita' ? R.cdc_52_30.giorni : R.cdc_52.giorni;
  if (!firma) return { giorni, fine: null, attivo: null };
  let fine = aggiungiGiorni(firma, giorni);
  const prolungato = c.informato === false;
  if (prolungato) fine = piuMesi(fine, R.cdc_53.mesi);
  return { giorni, fine: iso(fine), attivo: oggi <= fine, prolungato, funzioneOnline: c.canale === 'online' && iso(firma) >= R.cdc_54bis.data };
}

/**
 * Valuta la disdetta di un contratto.
 * @param {object} c il contratto:
 *   tipo: telefonia | paytv | servizi | digitale | rc_auto | polizza | energia
 *   motivo: chiudo | cambio | modifica | qualita | non_richiesto
 *   data_firma, data_scadenza, data_modifica, data_invio ('AAAA-MM-GG')
 *   durata_mesi (0 = senza durata minima), rinnovo (true | false | 'non_so'), preavviso_giorni
 *   promo, rate, con_internet, informato, avviso_rinnovo, prezzo_fisso (true | false | 'non_so')
 *   canale: online | telefono | negozio | fuori | visita;  materia: luce | gas | entrambi
 * @param {{oggi?: string}} opz
 */
export function valutaDisdetta(c = {}, opz = {}) {
  const oggi = oggiDi(opz.oggi);
  const costi = [];
  const scadenze = [];
  const voci = [];
  const come = [];
  const cerca = [];
  const controversie = [];
  const collegamenti = [];
  const usate = [];
  let documento = null;
  let verdetto = null;
  let effetto = null;
  let preavviso = null;
  let puoi = null;

  const usa = (...ids) => ids.forEach((id) => { if (R[id] && !usate.includes(id)) usate.push(id); });
  const costo = (puo, titolo, spiegazione, id) => { usa(id); costi.push({ puo, titolo, spiegazione, fonte: id }); };
  const scad = (d, titolo, testo) => d && scadenze.push({ data: iso(d), titolo, testo, scaduta: d < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, d)) });
  const voce = (esito, titolo, spiegazione, dato) => voci.push({ esito, titolo, spiegazione, ...(dato ? { dato } : {}) });
  const tipo = c.tipo === 'paytv' && c.con_internet === true ? 'telefonia' : c.tipo;
  const firma = data(c.data_firma);
  const invio = data(c.data_invio) && data(c.data_invio) >= oggi ? data(c.data_invio) : oggi;
  const durata = numeroOk(c.durata_mesi) ? Number(c.durata_mesi) : null;
  const rip = CONTRATTI[c.tipo] ? ripensamento(c, opz.oggi) : null;
  const esito = () => {
    const tono = verdetto.tono === 'si' && voci.some((v) => v.esito === 'dato') ? 'dato' : verdetto.tono;
    return {
      tipo: c.tipo || null, etichetta: CONTRATTI[c.tipo] || null,
      verdetto: { ...verdetto, tono }, puoi, effetto, preavviso,
      costi, scadenze: scadenze.sort((a, b) => a.data.localeCompare(b.data)), come, cerca, voci, controversie, collegamenti,
      ripensamento: rip, documento,
      fonti: usate.map((id) => ({ titolo: R[id].norma.titolo, url: R[id].norma.url })),
      verificato: VERIFICATO,
    };
  };

  if (!c.tipo || !CONTRATTI[c.tipo]) {
    verdetto = { tono: 'dato', titolo: 'Scegli il tipo di contratto', testo: 'Telefono e internet, pay TV, palestra, abbonamenti digitali, assicurazioni, luce e gas hanno regole diverse per la disdetta.' };
    return esito();
  }

  // ---------- controversie e collegamenti comuni ----------
  if (['telefonia', 'paytv'].includes(tipo)) {
    usa('conciliaweb');
    controversie.push({ titolo: 'Reclamo all\'operatore', testo: 'Scrivi un reclamo con i dati del contratto e le ricevute: chiedi lo storno degli importi non dovuti.' });
    controversie.push({ titolo: 'Conciliazione su ConciliaWeb, gratuita', testo: R.conciliaweb.testo, link: R.conciliaweb.piattaforma });
  } else if (tipo === 'energia') {
    usa('arera_conciliazione');
    controversie.push({ titolo: 'Reclamo al venditore', testo: 'Ai recapiti indicati in bolletta, con il codice POD (luce) o PDR (gas).' });
    controversie.push({ titolo: 'Servizio Conciliazione ARERA, gratuito', testo: R.arera_conciliazione.testo, link: R.arera_conciliazione.norma.url });
  } else if (['rc_auto', 'polizza'].includes(tipo)) {
    usa('ivass_reclami');
    controversie.push({ titolo: 'Reclamo all\'assicurazione, poi IVASS o Arbitro Assicurativo', testo: R.ivass_reclami.testo, link: R.ivass_reclami.norma.url });
  } else {
    usa('agcm');
    controversie.push({ titolo: 'Reclamo scritto al fornitore', testo: 'Con PEC o raccomandata: conserva le ricevute. Un\'associazione dei consumatori può aiutarti e proporre una conciliazione.' });
    controversie.push({ titolo: 'Segnalazione all\'Autorità garante della concorrenza e del mercato', testo: R.agcm.testo, link: R.agcm.norma.url });
    if (tipo === 'digitale') { usa('eccnet'); controversie.push({ titolo: 'Fornitore in un altro Paese dell\'Unione', testo: R.eccnet.testo, link: R.eccnet.norma.url }); }
  }

  // ---------- attivato senza consenso ----------
  if (c.motivo === 'non_richiesto') {
    puoi = true;
    const tlc = ['telefonia', 'paytv'].includes(tipo);
    if (!['rc_auto', 'polizza'].includes(tipo)) usa('cdc_66quinquies');
    if (tlc) usa('bersani_c3quater');
    verdetto = { tono: 'si', titolo: 'Non devi pagare un servizio che non hai chiesto', testo: `${['rc_auto', 'polizza'].includes(tipo) ? 'Senza la tua firma il contratto non c\'è.' : R.cdc_66quinquies.testo}${tlc ? ' ' + R.bersani_c3quater.testo : ''} Contesta subito per iscritto, chiedi la chiusura e il rimborso di quanto addebitato, e blocca gli addebiti in banca se partono.` };
    costo(false, 'Nessun canone né costo di disattivazione', 'Per un servizio mai chiesto non è dovuto niente, nemmeno per chiuderlo.', ['rc_auto', 'polizza'].includes(tipo) ? 'ivass_reclami' : 'cdc_66quinquies');
    documento = { tipo: 'contestazione', tlc };
    collegamenti.push({ strumento: 'truffe', titolo: 'È una truffa?', testo: 'Se ti hanno chiamato o scritto fingendosi il tuo fornitore, controlla il messaggio e come difenderti.' });
    come.push({ titolo: 'PEC o raccomandata con ricevuta di ritorno', testo: 'Così hai la prova della data. Allega le bollette o gli addebiti contestati.' });
    return esito();
  }

  // ---------- il ripensamento ----------
  if (rip) {
    usa('cdc_52');
    if (c.canale === 'visita') usa('cdc_52_30');
    if (rip.fine === null) voce('dato', 'Manca la data di firma', `Da lì si contano i ${rip.giorni} giorni per ripensarci.`, 'data_firma');
    else if (rip.attivo) {
      puoi = true;
      usa('cdc_54', 'cdc_56', 'cdc_57');
      if (rip.prolungato) usa('cdc_53');
      verdetto = { tono: 'si', titolo: `Puoi ripensarci fino al ${lungo(data(rip.fine))}, senza motivo e senza penali`, testo: `${c.canale === 'visita' ? R.cdc_52_30.testo : R.cdc_52.testo}${rip.prolungato ? ' ' + R.cdc_53.testo : ''} ${R.cdc_56.testo}` };
      scad(data(rip.fine), 'Ultimo giorno per ripensarci', `Manda il recesso entro oggi: conta la data di invio. ${R.cdc_54.testo}`);
      costo(false, 'Penali e costi di recesso', 'Nei giorni del ripensamento non ti possono chiedere penali né spiegazioni.', 'cdc_52');
      costo('forse', 'La parte di servizio già usata', R.cdc_57.testo, 'cdc_57');
      if (rip.funzioneOnline) {
        usa('cdc_54bis');
        come.push({ titolo: 'Il pulsante «recedere dal contratto qui»', testo: R.cdc_54bis.testo });
      }
      if (tipo === 'digitale') { usa('cdc_59'); voce('forse', 'Contenuti digitali', `${R.cdc_59.testo} Per un abbonamento a un servizio (streaming, archivio online) vale invece il pagamento della sola parte usata.`); }
      if (tipo === 'energia') come.push({ titolo: 'Al venditore che ha concluso il contratto', testo: 'Il recesso nei 14 giorni lo mandi tu, anche se la fornitura non è ancora partita.' });
      come.push({ titolo: 'Email, PEC o raccomandata', testo: 'Una dichiarazione esplicita basta: usa la lettera qui sotto e conserva la ricevuta.' });
      documento = { tipo: 'ripensamento', fine: rip.fine };
      if (['telefonia', 'paytv'].includes(tipo) && c.rate) costo(true, 'Il telefono o il decoder comprato a rate, se lo tieni', 'Se restituisci il bene nei termini non lo paghi; se lo tieni, restano le rate.', 'agcom_rate');
      collegamenti.push({ strumento: 'garanzia', titolo: 'Si è rotto o ci ho ripensato', testo: 'Per i 14 giorni sugli oggetti comprati online: restituzione e rimborso.' });
      if (tipo === 'energia') collegamenti.push({ strumento: 'bollette', titolo: 'Confronta le bollette', testo: 'Prima di firmare un altro contratto, confronta le offerte.' });
      cerca.push('L\'email o il documento di conferma del contratto, con la data di conclusione.', 'Le informazioni sul diritto di recesso: se mancano, hai 12 mesi in più.');
      return esito();
    } else {
      voce('no', `I ${rip.giorni} giorni per ripensarci sono finiti il ${lungo(data(rip.fine))}`, 'Restano le regole sulla disdetta di questo contratto, qui sotto.');
      if (c.informato !== false) voce('forse', 'Ti avevano informato del diritto di ripensamento?', `${R.cdc_53.testo} Rispondi alla domanda: se l'informazione mancava, potresti essere ancora in tempo.`, c.informato === undefined ? 'informato' : undefined);
    }
  }

  // ---------- telefono, internet e pay TV ----------
  if (tipo === 'telefonia' || tipo === 'paytv') {
    const ecs = tipo === 'telefonia'; // il Codice delle comunicazioni elettroniche vale per telefono e internet, e per la TV nel pacchetto
    usa('bersani_c3', 'bersani_c3bis', 'agcom_preavviso');
    puoi = true;
    preavviso = { giorni: R.bersani_c3.giorni, testo: 'Al massimo 30 giorni da quando l\'operatore riceve la richiesta: le clausole con un preavviso più lungo sono nulle.' };
    effetto = { data: iso(aggiungiGiorni(invio, R.bersani_c3.giorni)), testo: `Al più tardi 30 giorni dopo che l'operatore riceve la disdetta${data(c.data_invio) ? '' : ' (se la mandi oggi)'}.` };
    const fineVincolo = firma && durata > 0 ? piuMesi(firma, Math.min(durata, R.cce_c1.mesi)) : null;
    const dopoVincolo = fineVincolo ? oggi >= fineVincolo : false;
    const rinnovato = dopoVincolo && c.rinnovo === true;
    if (!firma) voce('dato', 'Manca la data di firma', 'Serve per sapere se sei ancora nel periodo di vincolo.', 'data_firma');
    if (durata === null) voce('dato', 'Manca la durata del vincolo', 'È nella sintesi contrattuale: di solito 12 o 24 mesi, oppure nessun vincolo.', 'durata_mesi');
    if (durata > R.cce_c1.mesi && (ecs || c.promo)) { usa(ecs ? 'cce_c1' : 'bersani_c3ter'); voce('forse', 'Un vincolo oltre 24 mesi non è ammesso', ecs ? R.cce_c1.testo : R.bersani_c3ter.testo); }
    if (ecs && fineVincolo && c.rinnovo === true) {
      usa('cce_c4');
      scad(piuMesi(fineVincolo, -2), 'Entro oggi l\'operatore deve avvisarti della fine del vincolo', 'Su supporto durevole (email, lettera, SMS), con le modalità di disdetta e le tariffe migliori.');
    }

    let gratis = false;
    if (c.motivo === 'modifica') {
      const dm = data(c.data_modifica);
      if (!ecs) {
        usa('cdc_33');
        voce('forse', 'Modifiche della pay TV', `${R.cdc_33.testo} Cerca nel contratto se le modifiche ti danno il diritto di recedere senza costi.`);
      } else if (!dm) voce('dato', 'Manca la data della comunicazione della modifica', 'Hai 60 giorni da quel giorno per uscire gratis.', 'data_modifica');
      else {
        usa('cce_c5', 'cce_c7');
        const lim = aggiungiGiorni(dm, R.cce_c5.giorni);
        scad(lim, 'Ultimo giorno per uscire gratis dopo la modifica', R.cce_c5.testo);
        if (oggi <= lim) {
          gratis = true;
          verdetto = { tono: 'si', titolo: `Puoi uscire senza penali né costi di disattivazione fino al ${lungo(lim)}`, testo: `${R.cce_c5.testo} ${R.cce_c7.testo}` };
          documento = { tipo: 'recesso', variante: 'modifica' };
        } else voce('no', 'I 60 giorni per uscire gratis dopo la modifica sono passati', 'Puoi recedere lo stesso, con le regole ordinarie qui sotto.');
      }
    }
    if (c.motivo === 'qualita' && ecs) {
      usa('cce_c6', 'misurainternet', 'cce_c7');
      gratis = true;
      verdetto = { tono: 'forse', titolo: 'Puoi uscire senza costi se dimostri che la connessione va peggio del promesso', testo: `${R.cce_c6.testo} ${R.misurainternet.testo}` };
      come.push({ titolo: 'Prima la misura ufficiale', testo: 'Fai le misure con il programma di MisuraInternet seguendo la procedura indicata sul sito, poi allega il certificato al recesso.' });
      documento = { tipo: 'recesso', variante: 'qualita' };
    }

    if (gratis) {
      costo(false, 'Penali, costi di disattivazione, restituzione degli sconti', 'In questi casi non è dovuto alcun corrispettivo per l\'uscita anticipata.', c.motivo === 'qualita' ? 'cce_c6' : 'cce_c5');
    } else if (rinnovato) {
      if (ecs && iso(firma) >= R.agcom_24mesi.data) {
        usa('cce_c4', 'agcom_24mesi');
        costo(false, 'Penali e costi di disattivazione', `${R.agcom_24mesi.testo} Restano il canone del mese di preavviso e le eventuali rate.`, 'agcom_24mesi');
        verdetto = { tono: 'si', titolo: 'Il vincolo è finito: puoi uscire quando vuoi, senza penali né costi di disattivazione', testo: R.agcom_24mesi.testo };
      } else if (ecs) {
        usa('cce_c4', 'agcom_24mesi', 'agcom_costi');
        costo('forse', 'Costi di disattivazione', `La legge esclude penali e costi di disattivazione dopo il rinnovo automatico (${R.cce_c4.norma.titolo}); AGCOM applica la regola dei 24 mesi solo ai contratti firmati dal 3 gennaio 2024. Se te li chiedono, contestali citando il comma 4.`, 'cce_c4');
        verdetto = { tono: 'si', titolo: 'Il vincolo è finito: puoi uscire quando vuoi, senza penali', testo: R.cce_c4.testo };
      } else {
        usa('agcom_costi');
        costo('forse', 'Costi di disattivazione', R.agcom_costi.testo, 'agcom_costi');
        verdetto = { tono: 'si', titolo: 'Il vincolo è finito: puoi uscire quando vuoi', testo: R.bersani_c3.testo };
      }
      costo(false, 'Restituzione degli sconti', 'La promozione è finita: non c\'è più una durata residua su cui calcolarli.', 'agcom_sconti');
    } else {
      usa('agcom_costi');
      costo('forse', 'Costi di disattivazione o di passaggio', `Solo se scritti nell'offerta e nel contratto. ${R.agcom_costi.testo}`, 'agcom_costi');
      if (c.promo === true) { usa('bersani_c3ter'); costo('forse', 'Restituzione degli sconti della promozione', `${R.agcom_sconti.testo} ${R.bersani_c3ter.testo}`, 'agcom_sconti'); }
      else if (c.promo === false) costo(false, 'Restituzione di sconti', 'Senza una promozione non ci sono sconti da restituire.', 'agcom_sconti');
      else voce('dato', 'C\'era un\'offerta promozionale?', 'Dalla promozione dipende se possono chiederti indietro una parte degli sconti.', 'promo');
      if (fineVincolo && !dopoVincolo) {
        scad(fineVincolo, 'Finisce il periodo di vincolo', ecs && c.rinnovo === true ? 'Dopo il rinnovo automatico puoi uscire senza penali né costi di disattivazione.' : 'Da qui non ci sono più sconti da restituire.');
        verdetto = { tono: 'forse', titolo: `Puoi recedere quando vuoi, ma fino al ${lungo(fineVincolo)} possono chiederti alcuni costi`, testo: `${R.bersani_c3.testo} I costi devono essere scritti nel contratto mese per mese.` };
      } else verdetto = { tono: 'si', titolo: 'Puoi recedere quando vuoi', testo: R.bersani_c3.testo };
    }
    if (c.rate === true) { usa('agcom_rate'); costo(true, 'Le rate residue di telefono, modem o decoder', `${R.agcom_rate.testo}${ecs && gratis ? ' ' + R.cce_c7.testo : ''}`, 'agcom_rate'); }
    costo(true, 'Il canone fino alla chiusura', 'Paghi il servizio fino alla data in cui il recesso ha effetto.', 'bersani_c3');
    costo(false, 'Costi estranei all\'uscita', R.agcom_estranei.testo, 'agcom_estranei');
    costo(false, 'Addebiti dopo la chiusura', R.agcom_dopo_chiusura.testo, 'agcom_dopo_chiusura');

    if (c.motivo === 'cambio' && !gratis) {
      come.push({ titolo: 'Se cambi operatore', testo: 'Chiedi al nuovo operatore la portabilità del numero o la migrazione della linea con il codice di migrazione: la procedura la avvia lui. Chiedigli se servizi in più (TV, opzioni) vanno disdetti a parte.' });
    } else if (!documento) documento = { tipo: 'recesso', variante: rinnovato ? 'rinnovato' : 'ordinario' };
    come.push({ titolo: 'Online, dall\'area clienti o dal modulo di recesso', testo: R.bersani_c3bis.testo });
    if (c.canale === 'negozio') come.push({ titolo: 'In un negozio dell\'operatore', testo: 'Hai firmato in negozio: puoi recedere anche lì. Fatti dare una ricevuta.' });
    if (c.canale === 'telefono') come.push({ titolo: 'Al servizio clienti', testo: 'Hai attivato al telefono: puoi recedere allo stesso modo. Annota data, ora e numero della pratica.' });
    come.push({ titolo: 'PEC o raccomandata con ricevuta di ritorno', testo: 'All\'indirizzo indicato nel contratto o nella carta dei servizi: è la prova più solida della data.' });
    cerca.push('La sintesi contrattuale: durata del vincolo e costi di uscita indicati mese per mese.', 'La pagina «trasparenza tariffaria» dell\'offerta sul sito dell\'operatore.', 'Se modem o decoder sono comprati a rate, a noleggio o in comodato: in comodato vanno restituiti, chiedi come.');
    if (ecs) cerca.push('L\'avviso di fine vincolo, che deve arrivare almeno 2 mesi prima del rinnovo.');
    return esito();
  }

  // ---------- palestre, servizi e abbonamenti digitali ----------
  if (tipo === 'servizi' || tipo === 'digitale') {
    usa('cdc_33', 'cdc_36', 'cc_1341');
    let scadenza = data(c.data_scadenza);
    if (!scadenza && firma && durata > 0) {
      scadenza = piuMesi(firma, durata);
      if (c.rinnovo === true) while (scadenza <= oggi) scadenza = piuMesi(scadenza, durata);
      voce('forse', `Prossima scadenza calcolata: ${lungo(scadenza)}`, 'Dalla data di firma e dalla durata, supponendo rinnovi della stessa durata. Se nel contratto c\'è un\'altra data, scrivila.', 'data_scadenza');
    }
    const preG = numeroOk(c.preavviso_giorni) ? Number(c.preavviso_giorni) : null;
    const rinnovato = firma && durata > 0 && piuMesi(firma, durata) <= oggi;
    effetto = scadenza ? { data: iso(scadenza), testo: 'Alla scadenza del periodo in corso.' } : null;

    if (c.motivo === 'modifica') {
      verdetto = { tono: 'forse', titolo: 'Hanno cambiato prezzo o condizioni: contesta e chiedi di uscire', testo: `${R.cdc_33.testo} ${R.cdc_36.testo}` };
      puoi = null;
      documento = { tipo: 'recesso', variante: 'modifica_servizi' };
    } else if (c.rinnovo === true && rinnovato && c.avviso_rinnovo === false) {
      usa('cdc_65bis');
      puoi = true;
      verdetto = { tono: 'si', titolo: 'Non ti hanno avvisato del rinnovo: puoi uscire ora, senza spese', testo: R.cdc_65bis.testo };
      effetto = { data: null, testo: 'Dal ricevimento della tua comunicazione: la legge non fissa un preavviso.' };
      if (scadenza) scad(scadenza, 'Fino a oggi puoi recedere senza spese', 'Dopo questa data il diritto dell\'art. 65-bis si chiude con il periodo in corso.');
      costo(false, 'Penali o quote fino alla scadenza', R.cdc_65bis.testo, 'cdc_65bis');
      documento = { tipo: 'recesso', variante: '65bis' };
    } else if (!scadenza && (durata === 0 || durata === null)) {
      verdetto = { tono: 'forse', titolo: 'Puoi disdire con il preavviso scritto nel contratto', testo: durata === 0 ? 'Un abbonamento senza durata minima si chiude con il preavviso indicato nelle condizioni: di solito vale dal periodo di pagamento successivo.' : 'Indica la durata e la scadenza: da lì calcoliamo entro quando mandare la disdetta.' };
      if (durata === null) voce('dato', 'Manca la durata del contratto', 'Scrivi 0 se l\'abbonamento non ha una durata minima (per esempio mensile che si rinnova finché non lo chiudi).', 'durata_mesi');
      puoi = durata === 0 ? true : null;
      documento = { tipo: 'disdetta' };
    } else if (c.rinnovo === false) {
      puoi = true;
      verdetto = { tono: 'si', titolo: `Il contratto finisce da solo il ${lungo(scadenza)}`, testo: 'Senza rinnovo automatico non serve la disdetta. Prima della scadenza puoi uscire solo se il contratto lo prevede: nessuna norma generale dà un recesso anticipato per questi servizi.' };
    } else {
      const lim = scadenza && preG !== null ? aggiungiGiorni(scadenza, -preG) : null;
      if (c.rinnovo !== true) voce('dato', 'C\'è il rinnovo automatico?', 'Cerca nel contratto «tacito rinnovo» o «rinnovo automatico».', 'rinnovo');
      if (preG === null) voce('dato', 'Manca il preavviso per la disdetta', 'È scritto nel contratto: per esempio «disdetta almeno 30 giorni prima della scadenza».', 'preavviso_giorni');
      usa('cdc_65bis');
      if (scadenza) scad(aggiungiGiorni(scadenza, -R.cdc_65bis.giorni), 'Entro oggi deve arrivarti l\'avviso del rinnovo', `${R.cdc_65bis.testo} Se non arriva, conserva la prova: dopo il rinnovo potrai uscire senza spese.`);
      if (lim && lim >= oggi) {
        puoi = true;
        verdetto = { tono: 'si', titolo: `Manda la disdetta entro il ${lungo(lim)}: il contratto finisce il ${lungo(scadenza)}`, testo: 'Così eviti il rinnovo e non paghi altro dopo la scadenza. Un termine di disdetta eccessivamente anticipato rispetto alla scadenza si presume vessatorio (art. 33, lett. i, del Codice del consumo).' };
        scad(lim, 'Ultimo giorno per la disdetta', 'Conta il giorno in cui il fornitore la riceve: con la PEC è immediato, con la raccomandata calcola qualche giorno.');
        documento = { tipo: 'disdetta' };
      } else if (lim) {
        const prossima = durata > 0 ? piuMesi(scadenza, durata) : null;
        puoi = null;
        verdetto = { tono: 'forse', titolo: `Il termine per la disdetta è passato il ${lungo(lim)}: il contratto si rinnova`, testo: `Puoi ancora uscire se: il fornitore non ti ha avvisato del rinnovo 30 giorni prima (art. 65-bis: recesso senza spese fino alla scadenza successiva); la clausola di rinnovo non porta la tua seconda firma (art. 1341 c.c.); il termine di disdetta era eccessivamente anticipato (art. 33, lett. i).` };
        if (c.avviso_rinnovo === undefined) voce('dato', 'Ti hanno avvisato del rinnovo?', 'Se no, dopo il rinnovo puoi recedere quando vuoi senza spese.', 'avviso_rinnovo');
        if (prossima && preG !== null) scad(aggiungiGiorni(prossima, -preG), 'Ultimo giorno per la disdetta del periodo successivo', 'Se non puoi uscire prima, manda almeno la disdetta per la scadenza successiva.');
        effetto = prossima ? { data: iso(prossima), testo: 'Alla scadenza successiva, se mandi la disdetta nei tempi; prima solo nei casi qui sotto.' } : null;
        documento = { tipo: 'disdetta', variante: 'tardiva' };
      } else {
        verdetto = { tono: 'dato', titolo: 'Ci servono la scadenza e il preavviso', testo: 'La disdetta va mandata prima della scadenza, entro il termine scritto nel contratto. Con queste due date calcoliamo il giorno giusto.' };
        documento = { tipo: 'disdetta' };
      }
      cerca.push('La clausola di rinnovo automatico e se l\'hai approvata con una seconda firma (art. 1341 del codice civile).');
    }
    if (documento?.variante !== '65bis') {
    costo('forse', 'Penali per l\'uscita anticipata', 'Solo se previste dal contratto. Una penale manifestamente eccessiva si presume vessatoria ed è nulla (art. 33, lett. f, e art. 36): se non c\'è accordo, decide il giudice.', 'cdc_33');
    costo(true, 'Le quote fino alla scadenza o alla data di chiusura', 'Il servizio del periodo in corso resta dovuto, salvo i casi in cui la legge ti fa uscire senza spese.', 'cdc_33');
    }
    costo(false, 'Quote dopo la fine del contratto', 'Dopo la scadenza o il recesso non ti possono addebitare altro: se succede, revoca l\'autorizzazione all\'addebito e contesta.', 'cdc_36');
    if (tipo === 'digitale') {
      come.push({ titolo: 'Dalle impostazioni dell\'account', testo: 'Cerca «abbonamento» o «gestisci piano». Se paghi tramite lo store dello smartphone, la disdetta si fa dall\'elenco abbonamenti dello store. Salva la schermata o l\'email di conferma.' });
      come.push({ titolo: 'Per iscritto, se la funzione non c\'è o non funziona', testo: 'Email all\'assistenza o PEC, con la lettera qui sotto.' });
      cerca.push('Le condizioni del servizio: durata del periodo, rinnovo, preavviso, rimborsi parziali.');
    } else {
      come.push({ titolo: 'PEC o raccomandata con ricevuta di ritorno', testo: 'All\'indirizzo della sede indicato nel contratto: è la prova della data. Una disdetta solo a voce alla reception non lascia prove.' });
      come.push({ titolo: 'Il modulo del fornitore, se c\'è', testo: 'Fatti dare una copia firmata con la data di consegna.' });
      cerca.push('Durata, termine per la disdetta, penali per l\'uscita anticipata.', 'Se il contratto prevede la sospensione o il recesso per malattia, gravidanza o trasferimento: alcuni lo fanno, va documentato.', 'Le quote una tantum (iscrizione, tessera): di solito non si restituiscono, controlla.');
    }
    return esito();
  }

  // ---------- RC auto ----------
  if (tipo === 'rc_auto') {
    usa('cap_170bis');
    puoi = true;
    const scadenza = data(c.data_scadenza);
    verdetto = { tono: 'si', titolo: 'Non serve nessuna disdetta: la polizza si chiude da sola alla scadenza', testo: R.cap_170bis.testo };
    if (!scadenza) voce('dato', 'Manca la data di scadenza', 'È sul certificato o sul contratto: da lì contiamo l\'avviso e i 15 giorni di copertura.', 'data_scadenza');
    else {
      effetto = { data: iso(scadenza), testo: 'Alla scadenza, senza bisogno di scrivere.' };
      scad(aggiungiGiorni(scadenza, -30), 'Entro oggi l\'assicurazione deve avvisarti della scadenza', 'L\'avviso deve arrivare almeno 30 giorni prima.');
      scad(scadenza, 'Scade la polizza RC auto', 'Prepara la nuova polizza: senza assicurazione il veicolo non può circolare.');
      scad(aggiungiGiorni(scadenza, R.cap_170bis.giorni), 'Ultimo giorno della copertura dopo la scadenza', 'La vecchia polizza copre fino a 15 giorni dopo, ma solo finché non parte la nuova.');
    }
    costo(false, 'Penali o costi per non rinnovare', 'Il tacito rinnovo è vietato: non devi niente per lasciar scadere la polizza.', 'cap_170bis');
    costo(false, 'Il rinnovo automatico delle garanzie accessorie', 'Furto, incendio e le altre garanzie nello stesso contratto, o in un contratto firmato insieme, si chiudono anche loro alla scadenza.', 'cap_170bis');
    come.push({ titolo: 'Non devi scrivere', testo: 'Basta non rinnovare. Se cambi compagnia, la nuova polizza deve partire entro la scadenza o entro i 15 giorni di copertura.' });
    cerca.push('Le garanzie accessorie in un contratto separato, firmato in un altro momento: possono avere regole diverse.', 'Cosa succede se vendi, demolisci o ti rubano il veicolo prima della scadenza: lo dice il contratto.');
    return esito();
  }

  // ---------- altre polizze danni ----------
  if (tipo === 'polizza') {
    usa('cc_1899');
    const pluriennale = durata > 12;
    if (!firma) voce('dato', 'Manca la data di inizio della polizza', 'Da lì si contano le annualità.', 'data_firma');
    if (durata === null) voce('dato', 'Manca la durata della polizza', 'Annuale (12 mesi) o pluriennale: è nel frontespizio.', 'durata_mesi');
    if (pluriennale && firma && iso(firma) < R.cc_1899.data) {
      verdetto = { tono: 'forse', titolo: 'Polizza firmata prima del 15 agosto 2009: valgono regole precedenti', testo: 'La regola del recesso dopo cinque anni vale per i contratti stipulati dopo l\'entrata in vigore della legge 99/2009. Chiedi all\'assicurazione o a un\'associazione dei consumatori quali condizioni si applicano al tuo contratto.' };
    } else if (pluriennale && durata > 60 && firma) {
      const cinque = piuMesi(firma, 60);
      const da = cinque > oggi ? cinque : oggi;
      let anni = 1;
      while (piuMesi(firma, 12 * anni) <= da) anni += 1;
      let fine = piuMesi(firma, 12 * anni);
      if (aggiungiGiorni(fine, -R.cc_1899.giorni) < da) fine = piuMesi(fine, 12);
      const lim = aggiungiGiorni(fine, -R.cc_1899.giorni);
      effetto = { data: iso(fine), testo: 'Dalla fine dell\'annualità in cui mandi il recesso.' };
      preavviso = { giorni: R.cc_1899.giorni, testo: 'Almeno 60 giorni prima della fine dell\'annualità.' };
      if (cinque > oggi) {
        puoi = false;
        verdetto = { tono: 'no', titolo: `Potrai recedere dopo il quinto anno, dal ${lungo(cinque)}`, testo: `${R.cc_1899.testo} Prima, puoi uscire solo nei casi previsti dal contratto.` };
        scad(cinque, 'Da oggi puoi mandare il recesso dalla polizza pluriennale', `Il primo recesso possibile vale dal ${lungo(fine)}, se lo mandi entro il ${lungo(lim)}.`);
      } else {
        puoi = true;
        verdetto = { tono: 'si', titolo: `Puoi recedere: manda la lettera entro il ${lungo(lim)}, la polizza si chiude il ${lungo(fine)}`, testo: R.cc_1899.testo };
        documento = { tipo: 'disdetta', variante: 'polizza_5anni', fine: iso(fine) };
      }
      scad(lim, 'Ultimo giorno per il recesso con effetto a fine annualità', 'Servono 60 giorni di preavviso: conta il giorno in cui l\'assicurazione riceve la lettera.');
      voce('forse', 'Lo sconto della polizza pluriennale', 'La legge collega la polizza di più anni a un premio ridotto rispetto a quella annuale. Alcuni contratti danno più possibilità di uscita: controlla le condizioni.');
    } else if (pluriennale) {
      puoi = false;
      const fine = firma && durata ? piuMesi(firma, durata) : null;
      verdetto = { tono: 'no', titolo: fine ? `La polizza dura fino al ${lungo(fine)}: la legge non dà un recesso annuale` : 'Fino a cinque anni la legge non dà un recesso annuale', testo: 'Il recesso dopo il quinto anno vale solo per le polizze di più di cinque anni. Puoi mandare la disdetta per la scadenza, nei tempi del contratto, ed evitare il rinnovo.' };
      if (fine && numeroOk(c.preavviso_giorni)) scad(aggiungiGiorni(fine, -Number(c.preavviso_giorni)), 'Ultimo giorno per la disdetta alla scadenza', 'Entro il preavviso scritto nel contratto.');
      documento = { tipo: 'disdetta', variante: 'polizza' };
    } else {
      const scadenza = data(c.data_scadenza) || (firma ? (() => { let s = piuMesi(firma, 12); while (s <= oggi) s = piuMesi(s, 12); return s; })() : null);
      const preG = numeroOk(c.preavviso_giorni) ? Number(c.preavviso_giorni) : null;
      if (c.rinnovo === false) {
        puoi = true;
        verdetto = { tono: 'si', titolo: scadenza ? `La polizza finisce da sola il ${lungo(scadenza)}` : 'Senza rinnovo tacito la polizza finisce da sola', testo: 'Non serve la disdetta.' };
      } else {
        if (preG === null) voce('dato', 'Manca il preavviso per la disdetta', 'È scritto nelle condizioni: per esempio «disdetta almeno 30 giorni prima della scadenza».', 'preavviso_giorni');
        const lim = scadenza && preG !== null ? aggiungiGiorni(scadenza, -preG) : null;
        puoi = true;
        verdetto = lim && lim >= oggi
          ? { tono: 'si', titolo: `Manda la disdetta entro il ${lungo(lim)}: la polizza finisce il ${lungo(scadenza)}`, testo: 'Una polizza annuale con tacito rinnovo si chiude con la disdetta nei tempi del contratto. Ogni proroga tacita non può durare più di due anni (art. 1899, secondo comma, del codice civile).' }
          : lim ? { tono: 'forse', titolo: `Il termine per la disdetta è passato il ${lungo(lim)}`, testo: 'La polizza si rinnova per il periodo previsto, che non può superare due anni. Manda la disdetta per la scadenza successiva.' }
            : { tono: 'dato', titolo: 'Ci servono la scadenza e il preavviso', testo: 'La disdetta va mandata prima della scadenza, entro il termine scritto nelle condizioni.' };
        if (lim) scad(lim, 'Ultimo giorno per la disdetta della polizza', 'Conta il giorno in cui l\'assicurazione la riceve.');
        if (scadenza) effetto = { data: iso(scadenza), testo: 'Alla scadenza annuale.' };
        documento = { tipo: 'disdetta', variante: 'polizza' };
      }
    }
    costo(false, 'Penali per il recesso dopo il quinto anno', 'Il recesso previsto dall\'art. 1899 del codice civile non ha costi: paghi il premio fino alla fine dell\'annualità.', 'cc_1899');
    costo(true, 'Il premio dell\'annualità in corso', 'Il recesso o la disdetta valgono dalla fine del periodo.', 'cc_1899');
    come.push({ titolo: 'PEC o raccomandata con ricevuta di ritorno', testo: 'All\'impresa o all\'agenzia indicata nel contratto. Conserva la ricevuta.' });
    cerca.push('La durata e la data di decorrenza nel frontespizio.', 'Il termine di disdetta e il tacito rinnovo nelle condizioni generali.', 'Se il premio pluriennale era scontato rispetto a quello annuale.', 'Le polizze vita e quelle collegate a un mutuo o a un finanziamento hanno regole diverse.');
    return esito();
  }

  // ---------- luce e gas ----------
  if (tipo === 'energia') {
    usa('arera_penali');
    puoi = true;
    collegamenti.push({ strumento: 'bollette', titolo: 'Confronta le bollette', testo: 'Prima di cambiare, confronta le offerte di luce e gas.' });
    const luce = c.materia === 'luce' || c.materia === 'entrambi';
    if (!c.materia) voce('dato', 'Luce, gas o tutti e due?', 'Solo per la luce a prezzo fisso possono esserci oneri di recesso anticipato.', 'materia');
    if (c.motivo === 'cambio' || c.motivo === undefined) {
      usa('arera_cambio');
      verdetto = { tono: 'si', titolo: 'Per cambiare fornitore non devi disdire niente', testo: `${R.arera_cambio.testo} ${R.arera_penali.testo}` };
      effetto = { data: null, testo: 'Dalla data di inizio della nuova fornitura, indicata dal nuovo venditore.' };
      come.push({ titolo: 'Firma il contratto con il nuovo venditore', testo: 'Ti serve il codice POD (luce) o PDR (gas), che trovi in bolletta. La procura a recedere è nel nuovo contratto: nessuna lettera al vecchio venditore.' });
    } else {
      usa('arera_cessazione');
      verdetto = { tono: 'si', titolo: 'Puoi chiudere la fornitura quando vuoi, con preavviso di un mese al massimo', testo: `${R.arera_cessazione.testo} ${R.arera_penali.testo}` };
      preavviso = { mesi: 1, testo: 'Al massimo un mese da quando il venditore riceve il recesso.' };
      effetto = { data: iso(piuMesi(invio, 1)), testo: `Al più tardi un mese dopo che il venditore riceve la comunicazione${data(c.data_invio) ? '' : ' (se la mandi oggi)'}.` };
      come.push({ titolo: 'PEC, raccomandata o il modulo del venditore', testo: 'Ai recapiti indicati in bolletta, con il codice POD o PDR e l\'autolettura del contatore.' });
      documento = { tipo: 'recesso', variante: 'energia' };
    }
    if (luce && c.prezzo_fisso !== false) {
      usa('arera_oneri_luce');
      const decade = c.motivo === 'modifica';
      costo(decade ? false : 'forse', 'Onere di recesso anticipato sulla luce a prezzo fisso', decade ? 'Il venditore ha cambiato le condizioni da solo: l\'eventuale onere di recesso anticipato decade.' : R.arera_oneri_luce.testo, 'arera_oneri_luce');
      if (c.prezzo_fisso === undefined || c.prezzo_fisso === 'non_so') voce('dato', 'Il prezzo della luce è fisso?', 'È scritto nel contratto e nella scheda di confrontabilità.', 'prezzo_fisso');
    }
    costo(false, c.materia === 'gas' ? 'Penali e spese di chiusura' : 'Penali e spese di chiusura (salvo l\'onere sulla luce a prezzo fisso)', R.arera_penali.testo, 'arera_penali');
    costo(true, 'L\'energia consumata fino alla chiusura o al passaggio', 'Arriva nell\'ultima bolletta, il conguaglio.', 'arera_cessazione');
    cerca.push('Il codice POD (luce) o PDR (gas) in bolletta.', 'Se il prezzo è fisso, fino a quando, e se c\'è un onere di recesso anticipato approvato con una firma a parte.');
    return esito();
  }

  verdetto = { tono: 'dato', titolo: 'Tipo di contratto non riconosciuto', testo: 'Scegli uno dei tipi indicati.' };
  return esito();
}

const segno = { si: 'Sì', forse: 'Dipende', no: 'No', dato: 'Serve un dato' };
const giorno = (s) => (s ? lungo(data(s)) : '');

/** L'esito in testo semplice (per il server MCP e per chi copia). */
export function testo(e) {
  if (!e?.verdetto) return '';
  const righe = [`${e.etichetta ? e.etichetta + ': ' : ''}${e.verdetto.titolo}`, e.verdetto.testo];
  if (e.effetto) righe.push(`Quando ha effetto: ${e.effetto.data ? giorno(e.effetto.data) + '. ' : ''}${e.effetto.testo}`);
  if (e.preavviso) righe.push(`Preavviso: ${e.preavviso.testo}`);
  const non = e.costi.filter((x) => x.puo === false);
  const si = e.costi.filter((x) => x.puo === true);
  const forse = e.costi.filter((x) => x.puo === 'forse');
  if (non.length) righe.push('', 'Cosa NON possono chiederti:', ...non.map((x) => `- ${x.titolo}: ${x.spiegazione}`));
  if (forse.length) righe.push('', 'Cosa possono chiederti solo a certe condizioni:', ...forse.map((x) => `- ${x.titolo}: ${x.spiegazione}`));
  if (si.length) righe.push('', 'Cosa possono chiederti:', ...si.map((x) => `- ${x.titolo}: ${x.spiegazione}`));
  if (e.scadenze.length) righe.push('', 'Scadenze:', ...e.scadenze.map((s) => `- ${giorno(s.data)}${s.scaduta ? ' (passata)' : ''}: ${s.titolo}. ${s.testo}`));
  if (e.voci.length) righe.push('', 'Da controllare:', ...e.voci.map((v) => `- [${segno[v.esito] || v.esito}] ${v.titolo}. ${v.spiegazione}`));
  if (e.come.length) righe.push('', 'Come mandare la disdetta:', ...e.come.map((x) => `- ${x.titolo}: ${x.testo}`));
  if (e.cerca.length) righe.push('', 'Cosa cercare nel contratto:', ...e.cerca.map((x) => `- ${x}`));
  if (e.controversie.length) righe.push('', 'Se non va:', ...e.controversie.map((x) => `- ${x.titolo}: ${x.testo}${x.link ? ` (${x.link})` : ''}`));
  if (e.fonti.length) righe.push('', `Fonti verificate il ${giorno(e.verificato)}:`, ...e.fonti.map((f) => `- ${f.titolo}: ${f.url}`));
  righe.push('', 'Informazioni sulle regole, non un parere legale: la lettera la firmi e la mandi tu.');
  return righe.join('\n');
}
