// Le domande di «Faccio ricorso?». Tutte facoltative: una risposta mancante
// diventa «serve un dato», mai un'ipotesi.

import { PREFETTURE } from './dati/prefetture.js';

export const SEZIONI = [
  { id: 'verbale', titolo: 'Il verbale' },
  { id: 'importi', titolo: 'Importi e patente' },
  { id: 'velocita', titolo: 'Autovelox e tutor' },
  { id: 'ztl', titolo: 'ZTL e corsie riservate' },
  { id: 'strisce', titolo: 'Strisce blu' },
  { id: 'dove', titolo: 'Dove e chi', aiuto: 'Servono per sapere a chi mandare il ricorso e per compilarlo.' },
  { id: 'tuoi', titolo: 'I tuoi dati per il ricorso', aiuto: 'Restano su questo dispositivo e servono solo a riempire il documento. Puoi anche lasciarli vuoti e scriverli a mano.' },
];

export const TIPI = [
  ['velocita', 'Eccesso di velocità rilevato da autovelox o tutor'],
  ['semaforo', 'Semaforo rosso rilevato da telecamera'],
  ['ztl', 'Accesso in ZTL, area pedonale o corsia riservata'],
  ['strisce_blu', 'Sosta sulle strisce blu'],
  ['sosta', 'Altra sosta vietata'],
  ['altro', 'Altra violazione (cellulare, cinture, sorpasso, revisione…)'],
];

export const MODI = [
  ['immediata', 'Mi hanno fermato e consegnato il verbale sul posto'],
  ['posta', 'Per posta, con raccomandata o tramite un messo'],
  ['pec', 'Alla mia PEC'],
  ['send', 'Con SEND o sull\'app IO'],
  ['portale', 'Sul portale della Polizia di Stato'],
];

const tipo = (r, ...t) => t.includes(r.tipo);
const notificato = (r) => r.modo && r.modo !== 'immediata';

export const DOMANDE = [
  { id: 'gia_pagato', sezione: 'verbale', tipo: 'si_no', etichetta: 'Hai già pagato la multa?', aiuto: 'Pagare chiude la questione: dopo non si può più fare ricorso.' },
  { id: 'gia_ricorso', sezione: 'verbale', tipo: 'si_no', etichetta: 'Hai già presentato un ricorso o chiesto di pagare a rate?', aiuto: 'Il ricorso al Prefetto e quello al Giudice di Pace sono alternativi. Chiedere la rateizzazione equivale a rinunciare al ricorso.' },
  { id: 'tipo', sezione: 'verbale', tipo: 'scelta', etichetta: 'Per cosa è la multa?', opzioni: TIPI },
  { id: 'data_violazione', sezione: 'verbale', tipo: 'data', etichetta: 'Data della violazione', aiuto: 'È scritta sul verbale, di solito in alto.' },
  { id: 'modo', sezione: 'verbale', tipo: 'scelta', etichetta: 'Come ti è arrivato il verbale?', opzioni: MODI },
  {
    id: 'data_notifica', sezione: 'verbale', tipo: 'data', etichetta: 'In che giorno lo hai ricevuto?', visibile: notificato,
    aiuto: 'Posta: il giorno della consegna o del ritiro in ufficio postale; se non lo hai ritirato, 10 giorni dopo l\'avviso di giacenza. PEC: il giorno della ricevuta di consegna. SEND o app IO: il giorno in cui lo hai aperto, oppure 7 giorni dopo l\'avviso arrivato via PEC se viene prima. In caso di dubbio, metti la data più vecchia.',
  },
  {
    id: 'data_spedizione', sezione: 'verbale', tipo: 'data', etichetta: 'Data di spedizione o di messa a disposizione, se la conosci',
    aiuto: 'Conta per i 90 giorni: la data in cui l\'ente ha spedito il verbale o lo ha caricato su SEND. Per la posta è sulla busta o sull\'avviso di ricevimento.',
    visibile: (r) => notificato(r),
  },
  { id: 'estero', sezione: 'verbale', tipo: 'si_no', etichetta: 'Sei residente all\'estero?' },
  {
    id: 'noleggio', sezione: 'verbale', tipo: 'si_no', etichetta: 'Il veicolo è a noleggio, in leasing, o la multa è arrivata dopo che un\'altra persona ha indicato te come conducente?',
    aiuto: 'In questi casi i 90 giorni decorrono da quando l\'ente ha avuto i tuoi dati, non dalla violazione.', visibile: notificato,
  },
  { id: 'veicolo_tuo', sezione: 'verbale', tipo: 'si_no', etichetta: 'Alla data della violazione il veicolo era tuo, o lo guidavi tu?', aiuto: 'Rispondi no se lo avevi già venduto, se era stato rubato o se non lo hai mai avuto.' },
  { id: 'dati_corretti', sezione: 'verbale', tipo: 'si_no', etichetta: 'Targa, marca e modello scritti sul verbale sono quelli del tuo veicolo?' },
  {
    id: 'motivo_indicato', sezione: 'verbale', tipo: 'si_no', nonSo: true, etichetta: 'Il verbale spiega perché non ti hanno fermato sul momento?',
    aiuto: 'Cerca una frase come «non contestata immediatamente perché…».', visibile: (r) => notificato(r) && tipo(r, 'altro'),
  },

  { id: 'importo', sezione: 'importi', tipo: 'euro', etichetta: 'Importo da pagare entro 60 giorni', aiuto: 'La cifra intera senza lo sconto del 30%, comprese le spese di notifica.' },
  { id: 'spese', sezione: 'importi', tipo: 'euro', etichetta: 'Di cui spese di notifica e procedimento', aiuto: 'Se il verbale le indica a parte. Se non le trovi, lascia vuoto.' },
  { id: 'massimo', sezione: 'importi', tipo: 'euro', etichetta: 'Sanzione massima prevista, se il verbale la indica', aiuto: 'Serve a capire quanto rischi davanti al Giudice di Pace. Se non c\'è, lascia vuoto.' },
  { id: 'punti', sezione: 'importi', tipo: 'numero', etichetta: 'Punti della patente da togliere', segnaposto: '0' },
  { id: 'sospensione', sezione: 'importi', tipo: 'si_no', etichetta: 'Il verbale prevede la sospensione della patente o la confisca del veicolo?' },

  {
    id: 'strumento', sezione: 'velocita', tipo: 'scelta', etichetta: 'Cosa dice il verbale sull\'apparecchio?', visibile: (r) => tipo(r, 'velocita'),
    aiuto: 'Cerca il nome dell\'apparecchio e il decreto citato accanto.',
    opzioni: [
      ['omologato', 'Che è «omologato», con gli estremi del decreto di omologazione'],
      ['approvato', 'Che è «approvato», senza parlare di omologazione'],
      ['non_indicato', 'Non dice nulla né di approvazione né di omologazione'],
      ['non_so', 'Non lo so'],
    ],
  },
  { id: 'taratura', sezione: 'velocita', tipo: 'data', etichetta: 'Data dell\'ultima taratura scritta sul verbale', aiuto: 'Se il verbale non la indica, lascia vuoto e rispondi alla domanda dopo.', visibile: (r) => tipo(r, 'velocita') },
  { id: 'taratura_indicata', sezione: 'velocita', tipo: 'si_no', etichetta: 'Il verbale cita la verifica di taratura?', visibile: (r) => tipo(r, 'velocita') && !r.taratura },
  { id: 'vel_rilevata', sezione: 'velocita', tipo: 'numero', etichetta: 'Velocità rilevata (km/h)', visibile: (r) => tipo(r, 'velocita') },
  { id: 'vel_contestata', sezione: 'velocita', tipo: 'numero', etichetta: 'Velocità contestata, dopo la tolleranza (km/h)', visibile: (r) => tipo(r, 'velocita') },
  { id: 'cartello', sezione: 'velocita', tipo: 'si_no', nonSo: true, etichetta: 'Prima dell\'apparecchio c\'era un cartello di preavviso ben visibile?', visibile: (r) => tipo(r, 'velocita') },
  { id: 'stessa_ora', sezione: 'velocita', tipo: 'si_no', etichetta: 'Hai altre multe per velocità dello stesso ente, prese entro un\'ora da questa?', visibile: (r) => tipo(r, 'velocita') },

  { id: 'piu_accessi', sezione: 'ztl', tipo: 'si_no', etichetta: 'Hai più multe per accessi nella stessa ZTL o area pedonale nello stesso giorno?', visibile: (r) => tipo(r, 'ztl') },
  { id: 'permesso', sezione: 'ztl', tipo: 'si_no', etichetta: 'Avevi un permesso valido per entrare (residente, disabile, carico e scarico)?', visibile: (r) => tipo(r, 'ztl') },

  { id: 'ticket', sezione: 'strisce', tipo: 'si_no', etichetta: 'Avevi pagato il parcheggio?', visibile: (r) => tipo(r, 'strisce_blu') },
  { id: 'minuti_pagati', sezione: 'strisce', tipo: 'numero', etichetta: 'Quanti minuti avevi pagato?', visibile: (r) => tipo(r, 'strisce_blu') && r.ticket === true },
  { id: 'minuti_oltre', sezione: 'strisce', tipo: 'numero', etichetta: 'Di quanti minuti eri oltre l\'orario pagato, secondo il verbale?', visibile: (r) => tipo(r, 'strisce_blu') && r.ticket === true },

  {
    id: 'provincia', sezione: 'dove', tipo: 'elenco', etichetta: 'Provincia in cui è avvenuta la violazione',
    aiuto: 'In Sardegna valgono le quattro province storiche: Cagliari, Sassari, Nuoro, Oristano.',
    opzioni: [...PREFETTURE.map((p) => [p.sigla, `${p.citta} (${p.sigla})`]), ['AO', 'Aosta (AO)']].sort((a, b) => a[1].localeCompare(b[1], 'it')),
  },
  { id: 'comune', sezione: 'dove', tipo: 'testo', etichetta: 'Comune della violazione', segnaposto: 'es. Milano' },
  { id: 'organo', sezione: 'dove', tipo: 'testo', etichetta: 'Chi ha fatto il verbale', segnaposto: 'es. Polizia locale di Milano' },
  { id: 'pec_organo', sezione: 'dove', tipo: 'testo', etichetta: 'PEC dell\'ufficio che ha fatto il verbale, se è indicata', aiuto: 'Di solito è scritta sul verbale o sul sito del Comune.' },
  { id: 'numero_verbale', sezione: 'dove', tipo: 'testo', etichetta: 'Numero del verbale' },
  { id: 'targa', sezione: 'dove', tipo: 'testo', etichetta: 'Targa del veicolo' },

  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome' },
  { id: 'nascita', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo e data di nascita', segnaposto: 'es. Torino, 3 marzo 1980' },
  { id: 'residenza', sezione: 'tuoi', tipo: 'testo', etichetta: 'Indirizzo di residenza' },
  { id: 'codice_fiscale', sezione: 'tuoi', tipo: 'testo', etichetta: 'Codice fiscale' },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'PEC o email per le comunicazioni' },
  { id: 'comune_firma', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo in cui firmi', segnaposto: 'es. Milano' },
  {
    id: 'invio_prefetto', sezione: 'tuoi', tipo: 'scelta', etichetta: 'Se ricorri al Prefetto, a chi lo mandi?',
    aiuto: 'Vanno bene entrambi. Mandarlo direttamente alla Prefettura allunga di 30 giorni i tempi della decisione.',
    opzioni: [['diretto', 'Direttamente alla Prefettura'], ['organo', 'All\'ufficio che ha fatto il verbale, che lo inoltra al Prefetto']],
  },
  { id: 'audizione', sezione: 'tuoi', tipo: 'si_no', etichetta: 'Se ricorri al Prefetto, vuoi chiedere di essere ascoltato di persona?', aiuto: 'Puoi spiegare le tue ragioni a voce. La richiesta sospende il termine per la decisione fino al giorno dell\'audizione.' },
];
