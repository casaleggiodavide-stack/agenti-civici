// Regole di «Chiedo gli atti»: sceglie il tipo di accesso, controlla la
// richiesta, calcola le scadenze e indica il passo successivo se l'ente tace
// o rifiuta. Fonti: d.lgs. 33/2013 (artt. 2-bis, 5, 5-bis), L. 241/1990
// (artt. 22-25), DPR 184/2006, CAD art. 65, c.p.a. artt. 23 e 116, DPR 115/2002
// art. 13, d.lgs. 195/2005 art. 3, delibera ANAC 1309/2016, circolari della
// Funzione pubblica 2/2017 e 1/2019. Testi vigenti verificati all'11/10/2026.

import { data, iso, oggi as oggiCal, giorniTra, scadenza, scrittaBreve } from './comune/date.js';
import { REGIONE_DI, SENZA_DIFENSORE, DIFENSORE_INCERTO, LOCALI, STATALI } from './dati/territorio.js';

export const VERIFICATO = '2026-10-11';
const N = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:';
export const FONTI = {
  art5: { titolo: 'D.lgs. 33/2013, art. 5 (accesso civico semplice e generalizzato)', url: N + 'decreto.legislativo:2013-03-14;33~art5' },
  art5bis: { titolo: 'D.lgs. 33/2013, art. 5-bis (limiti ed eccezioni)', url: N + 'decreto.legislativo:2013-03-14;33~art5bis' },
  l241: { titolo: 'Legge 241/1990, art. 25 (accesso ai documenti amministrativi)', url: N + 'legge:1990-08-07;241~art25' },
  l241_2: { titolo: 'Legge 241/1990, art. 2 (potere sostitutivo)', url: N + 'legge:1990-08-07;241~art2' },
  cad65: { titolo: 'CAD, art. 65 (istanze telematiche valide)', url: N + 'decreto.legislativo:2005-03-07;82~art65' },
  amb: { titolo: 'D.lgs. 195/2005, art. 3 (informazioni ambientali)', url: N + 'decreto.legislativo:2005-08-19;195~art3' },
  cpa: { titolo: 'Codice del processo amministrativo, art. 116 (ricorso sull\'accesso)', url: N + 'decreto.legislativo:2010-07-02;104' },
  anac: { titolo: 'ANAC, delibera 1309/2016: linee guida sull\'accesso civico', url: 'https://www.anticorruzione.it/documents/91439/117ffbe5-ba63-cecc-6e9f-5424871583f8' },
  anacModuli: { titolo: 'ANAC, accesso civico e moduli', url: 'https://www.anticorruzione.it/-/accesso-civico-e-accesso-civico-generalizzato' },
  circ2: { titolo: 'Funzione pubblica, circolare 2/2017 sull\'accesso generalizzato', url: 'https://docs.italia.it/italia/funzione-pubblica/foia-circolare2-docs/it/stabile/_docs/modalita.html' },
};

export const TIPI = {
  generalizzato: { id: 'generalizzato', nome: 'Accesso civico generalizzato (FOIA)', norma: 'art. 5, comma 2, del d.lgs. 33/2013', breve: 'Chiunque può chiedere documenti e dati dell\'ente, senza spiegare perché.' },
  semplice: { id: 'semplice', nome: 'Accesso civico semplice', norma: 'art. 5, comma 1, del d.lgs. 33/2013', breve: 'Chiedi all\'ente di pubblicare sul sito quello che era obbligato a pubblicare.' },
  documentale: { id: 'documentale', nome: 'Accesso ai documenti amministrativi', norma: 'artt. 22 e seguenti della legge 241/1990', breve: 'Per i documenti che ti riguardano personalmente: devi spiegare il tuo interesse, ma puoi ottenere anche dati che col FOIA sarebbero negati.' },
};

function sceltaTipo(r) {
  if (r.da_pubblicare === 'si') return { ...TIPI.semplice, perche: 'Hai indicato che l\'ente doveva già pubblicarli: con l\'accesso civico semplice gli chiedi di metterli online e di mandarti il link. Non devi motivare e non ci sono controinteressati.' };
  if (r.riguarda_te === true && r.dati_personali === true) {
    return { ...TIPI.documentale, perche: 'I documenti ti riguardano e contengono dati personali di altri: con il FOIA quei dati verrebbero quasi certamente negati, con l\'accesso documentale puoi averli se dimostri un interesse concreto.', alternativa: 'generalizzato' };
  }
  if (r.riguarda_te === true) {
    return { ...TIPI.generalizzato, perche: 'Ti riguardano ma non contengono dati personali di altri: il FOIA è più semplice perché non devi motivare. Se venisse negato, puoi ripiegare sull\'accesso documentale.', alternativa: 'documentale' };
  }
  return { ...TIPI.generalizzato, perche: 'È lo strumento per chiedere qualsiasi documento o dato dell\'ente, senza dover spiegare perché.' };
}

function controlliRichiesta(r, tipo) {
  const out = [];
  const t = (r.cosa || '').trim();
  if (!t) return [{ livello: 'dato', testo: 'Scrivi quali documenti o dati vuoi.', dato: 'cosa' }];
  if (t.length < 40) out.push({ livello: 'attenzione', testo: 'La richiesta è molto breve: aggiungi argomento, tipo di documento e periodo. Una richiesta vaga può essere dichiarata inammissibile.' });
  if (/\b(tutt[aei]|qualsiasi|ogni|qualunque)\b[^.]{0,40}\b(document|atti|dati|carte|informazion)/i.test(t)) {
    out.push({ livello: 'attenzione', testo: 'Chiedere «tutti i documenti» espone al rifiuto per richiesta generica o troppo onerosa. Indica documenti precisi.' });
  }
  if (/\b(perch[eé]|spiegazion|chiariment|motivazion|giustific)/i.test(t)) {
    out.push({ livello: 'attenzione', testo: 'L\'accesso dà documenti e dati, non spiegazioni. Invece di chiedere «perché», chiedi il documento che contiene la decisione e la sua motivazione.' });
  }
  if (!r.periodo && !/\b(19|20)\d{2}\b/.test(t)) out.push({ livello: 'attenzione', testo: 'Indica il periodo (per esempio «dal 2024 a oggi»): rende la richiesta precisa e più difficile da respingere.' });
  if (r.dati_personali === true && tipo.id === 'generalizzato') out.push({ livello: 'ok', testo: 'Nella richiesta chiediamo l\'oscuramento dei dati personali: così l\'ente non può negare tutto per tutelare la privacy.' });
  if (r.formato === 'aperto') out.push({ livello: 'ok', testo: 'Chiediamo i dati in formato aperto. Per i documenti da pubblicare è un obbligo; per gli altri l\'ente lo concede se può farlo senza fatica.' });
  if (r.ambiente === true) out.push({ livello: 'ok', testo: 'Citiamo anche la legge sulle informazioni ambientali, che dà diritto al formato richiesto e limita le eccezioni.' });
  if (!out.some((x) => x.livello === 'attenzione')) out.unshift({ livello: 'ok', testo: 'La richiesta è precisa: indica documenti e periodo.' });
  return out;
}

function invio(r) {
  const passi = {
    pec: ['Invia la richiesta dalla tua PEC personale alla PEC dell\'ente: vale come firma e non serve allegare il documento.', 'Conserva la ricevuta di consegna: da quella data partono i 30 giorni.'],
    email: ['Firma la richiesta (anche a mano, poi scansionala) e inviala per email all\'indirizzo dell\'ente.', 'Allega la copia di un documento d\'identità: con l\'email ordinaria è necessaria e sufficiente.', 'Conserva l\'email inviata: la data di invio vale come data di presentazione.'],
    firma: ['Firma il documento con la firma digitale e invialo all\'ente per PEC o email.', 'Non serve allegare il documento d\'identità.'],
    modulo: ['Entra nel servizio online dell\'ente con SPID o CIE e copia il testo nel modulo.', 'Usare il testo di questo strumento invece del modulo dell\'ente non rende la richiesta inammissibile.'],
  };
  return { canale: r.canale || null, passi: passi[r.canale] || ['Scegli come inviarla: PEC personale, email con documento d\'identità, firma digitale o modulo online con SPID o CIE. Sono tutte valide per l\'art. 65 del CAD.'] };
}

function infoEnte(ente) {
  if (!ente) return null;
  const regione = REGIONE_DI[ente.prov] || null;
  const locale = LOCALI.has(ente.cat);
  const statale = STATALI.has(ente.cat);
  let difensore = null;
  if (locale && regione) {
    difensore = SENZA_DIFENSORE.has(regione) ? 'assente' : DIFENSORE_INCERTO.has(regione) ? 'incerto' : 'presente';
  }
  return { ...ente, regione, locale, statale, difensore };
}

const voce = (id, d, titolo, testo, oggi, extra = {}) => ({ id, data: d ? iso(d) : null, titolo, testo, scaduta: d ? d < oggi : false, giorniMancanti: d ? giorniTra(oggi, d) : null, ...extra });
const tar = (base, oggi, dopo) => {
  const prudente = scadenza(base, 30);
  const legale = scadenza(base, 30, { feriale: true, slitta: true, sabato: true });
  return voce('tar', prudente, 'Ricorso al TAR', `Entro 30 giorni ${dopo}. Non serve l'avvocato in primo grado; il contributo unificato è di 300 €. Il ricorso va notificato all'ente e ad almeno un controinteressato.${iso(legale) !== iso(prudente) ? ` Con la sospensione di agosto e i festivi il termine di legge sarebbe il ${scrittaBreve(legale)}, ma conviene non contarci.` : ''}`, oggi, { legale: iso(legale) });
};

/**
 * Valuta una richiesta di accesso.
 * @param {object} r risposte, con r.ente = { nome, cat, comune, prov, pec, sito } se scelto
 */
export function valuta(r, opz = {}) {
  const oggi = opz.oggi ? data(opz.oggi) : oggiCal();
  const tipo = sceltaTipo(r);
  const ente = infoEnte(r.ente);
  const controlli = controlliRichiesta(r, tipo);
  const fonti = [FONTI.art5, FONTI.art5bis, FONTI.cad65, FONTI.anac, FONTI.circ2, FONTI.cpa];
  if (tipo.id === 'documentale') fonti.splice(0, 2, FONTI.l241);
  if (tipo.id === 'semplice') fonti.push(FONTI.l241_2, FONTI.anacModuli);
  if (r.ambiente === true) fonti.push(FONTI.amb);

  const destinatario = tipo.id === 'semplice'
    ? 'Responsabile della prevenzione della corruzione e della trasparenza (RPCT)'
    : r.ufficio || (tipo.id === 'documentale' ? 'Ufficio competente, tramite l\'Ufficio relazioni con il pubblico' : 'Ufficio che detiene i dati, tramite l\'Ufficio relazioni con il pubblico');

  const scadenze = [];
  const passi = [];
  let fase;
  const inviata = data(r.data_invio);
  const termine = 30;

  if (!inviata) {
    const pronta = r.cosa && r.ente;
    fase = pronta
      ? { id: 'da_inviare', tono: 'si', titolo: 'La richiesta è pronta da inviare', testo: `${tipo.nome}: ${tipo.breve} Controlla il testo, completa i campi evidenziati e inviala. Poi indica qui la data di invio per avere le scadenze.` }
      : { id: 'bozza', tono: 'dato', titolo: 'Comincia dalla richiesta', testo: !r.cosa ? 'Scrivi quali documenti o dati vuoi.' : 'Scegli l\'ente a cui chiederli.' };
  } else {
    // Il termine di 30 giorni resta sospeso finché i controinteressati possono opporsi (fino a 10 giorni).
    const extra = r.controinteressati === true ? 10 : 0;
    const risposta30 = scadenza(inviata, termine + extra);
    scadenze.push(voce('risposta', risposta30, 'Risposta dell\'ente', `30 giorni dalla ricezione${extra ? ', più fino a 10 giorni per le opposizioni dei controinteressati' : ''}. L'ente deve rispondere con un provvedimento espresso e motivato.${r.ambiente === true ? ' Per le informazioni ambientali complesse può prorogare a 60 giorni, avvisandoti entro i primi 30.' : ''}`, oggi));
    const negativa = ['parziale', 'respinta', 'inammissibile', 'differita'].includes(r.risposta);
    const dataRisposta = data(r.data_risposta);
    const riesame = data(r.data_riesame);

    if (r.risposta === 'accolta') {
      fase = { id: 'accolta', tono: 'si', titolo: 'Richiesta accolta', testo: 'Bene. Se i documenti sono incompleti rispetto a quanto chiesto, la risposta vale come accoglimento parziale: puoi chiedere il riesame per la parte mancante.' };
    } else if (riesame && tipo.id !== 'documentale') {
      const giorniRiesame = r.dati_personali === true ? 30 : 20;
      const decisione = scadenza(riesame, giorniRiesame);
      scadenze.push(voce('riesame_esito', decisione, 'Decisione sul riesame', `Il responsabile della trasparenza deve decidere entro ${giorniRiesame} giorni${giorniRiesame === 30 ? ', perché deve sentire il Garante per la privacy' : ''}.`, oggi));
      if (r.esito_riesame === 'accolto') fase = { id: 'accolta', tono: 'si', titolo: 'Riesame accolto', testo: 'L\'ente deve ora darti i documenti. Se non lo fa, puoi segnalarlo e ricorrere al TAR.' };
      else if (r.esito_riesame === 'respinto' && data(r.data_esito_riesame)) {
        scadenze.push(tar(data(r.data_esito_riesame), oggi, 'dalla decisione sul riesame'));
        fase = { id: 'tar', tono: 'forse', titolo: 'Riesame respinto: resta il TAR', testo: 'Puoi ricorrere al Tribunale amministrativo regionale da solo, senza avvocato, pagando 300 € di contributo unificato. Valuta se ne vale la pena, o se una nuova richiesta più precisa può ottenere lo stesso risultato gratis.' };
      } else if (oggi > decisione) {
        scadenze.push(tar(decisione, oggi, 'dalla scadenza del termine per il riesame'));
        fase = { id: 'tar', tono: 'forse', titolo: 'Il riesame è senza risposta: resta il TAR', testo: 'Il responsabile della trasparenza non ha deciso in tempo. Puoi ricorrere al TAR senza avvocato, con 300 € di contributo unificato.' };
      } else fase = { id: 'attesa_riesame', tono: 'neutro', titolo: 'In attesa del riesame', testo: `Il responsabile della trasparenza deve decidere entro il ${scrittaBreve(decisione)}.` };
    } else if (negativa && dataRisposta) {
      if (tipo.id === 'documentale') {
        scadenze.push(tar(dataRisposta, oggi, 'dal rifiuto'));
        passi.push('ricorso');
        fase = { id: 'rifiuto', tono: 'forse', titolo: 'Rifiuto: puoi ricorrere', testo: `Entro 30 giorni puoi ricorrere ${ente?.locale ? 'al difensore civico, gratis, oppure ' : ente?.statale ? 'alla Commissione per l\'accesso ai documenti amministrativi, gratis, oppure ' : ''}al TAR.` };
      } else {
        scadenze.push(voce('riesame', scadenza(dataRisposta, 30), 'Chiedere il riesame', 'La legge non fissa un termine, ma la Funzione pubblica indica 30 giorni dalla risposta: dopo, il riesame può essere considerato tardivo. È gratis.', oggi));
        if (ente?.locale && ente.difensore !== 'assente') scadenze.push(voce('difensore', scadenza(dataRisposta, 30), 'In alternativa: difensore civico', 'Per Regioni ed enti locali puoi rivolgerti al difensore civico regionale, gratis. Decide in 30 giorni.', oggi));
        scadenze.push(tar(dataRisposta, oggi, 'dalla risposta, se vuoi andare subito al TAR'));
        passi.push('riesame');
        if (ente?.locale && ente.difensore !== 'assente') passi.push('difensore');
        fase = r.risposta === 'inammissibile'
          ? { id: 'rifiuto', tono: 'forse', titolo: 'Richiesta ritenuta generica o troppo onerosa', testo: 'Prima di dichiararla inammissibile l\'ente doveva invitarti a precisarla. Hai due strade gratuite: chiedere il riesame, oppure presentare una nuova richiesta più precisa.' }
          : { id: 'rifiuto', tono: 'forse', titolo: r.risposta === 'parziale' ? 'Accolta solo in parte: chiedi il riesame' : r.risposta === 'differita' ? 'Accesso rinviato: verifica la motivazione' : 'Rifiuto: chiedi il riesame', testo: 'Il riesame al responsabile della trasparenza è gratuito e va deciso in 20 giorni. Il rifiuto deve indicare quale eccezione dell\'art. 5-bis si applica e quale danno concreto eviterebbe: motivazioni generiche non bastano.' };
      }
    } else if (oggi > risposta30) {
      if (tipo.id === 'documentale') {
        const silenzio = risposta30;
        scadenze.push(tar(silenzio, oggi, 'dalla formazione del silenzio-rigetto'));
        passi.push('ricorso');
        fase = { id: 'silenzio', tono: 'forse', titolo: 'Nessuna risposta: vale come rifiuto', testo: `Per l'accesso documentale, dopo 30 giorni il silenzio equivale a un rifiuto. Entro altri 30 giorni puoi ricorrere ${ente?.locale ? 'al difensore civico, gratis, oppure ' : ente?.statale ? 'alla Commissione per l\'accesso ai documenti amministrativi, gratis, oppure ' : ''}al TAR.` };
      } else {
        scadenze.push(voce('riesame', scadenza(risposta30, 30), 'Chiedere il riesame', 'L\'ente non ha risposto in tempo. Chiedi il riesame al responsabile della trasparenza: è gratis e deve decidere in 20 giorni. Il termine indicato è prudente.', oggi));
        if (tipo.id === 'semplice') {
          scadenze.push(voce('sostitutivo', null, 'In alternativa: potere sostitutivo e ANAC', 'Puoi chiedere al titolare del potere sostitutivo dell\'ente di provvedere entro 15 giorni, e segnalare l\'omessa pubblicazione ad ANAC, che può ordinarla.', oggi));
          passi.push('sostitutivo');
        }
        passi.push('riesame');
        fase = { id: 'silenzio', tono: 'forse', titolo: 'L\'ente non ha risposto in 30 giorni', testo: 'Il silenzio non vale come rifiuto: l\'ente era obbligato a decidere. Il passo successivo è il riesame, gratuito.' };
      }
    } else {
      fase = { id: 'attesa', tono: 'neutro', titolo: 'In attesa di risposta', testo: `L'ente deve rispondere entro il ${scrittaBreve(risposta30)}: mancano ${giorniTra(oggi, risposta30)} giorni.` };
    }
  }

  return {
    oggi: iso(oggi),
    tipo,
    ente,
    destinatario,
    controlli,
    invio: invio(r),
    fase,
    scadenze: scadenze.sort((a, b) => (a.data || '9').localeCompare(b.data || '9')),
    passi,
    fonti,
  };
}
