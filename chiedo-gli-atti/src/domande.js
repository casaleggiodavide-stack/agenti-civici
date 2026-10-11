// Le domande di «Chiedo gli atti». L'ente si sceglie con una ricerca a parte
// (src/enti.js); qui ci sono le altre domande.

export const SEZIONI = [
  { id: 'cosa', titolo: 'Cosa vuoi sapere' },
  { id: 'ente', titolo: 'A quale ente', aiuto: 'Cerca l\'ente per nome: Comune, Regione, ASL, Ministero, scuola, società pubblica. Gli indirizzi PEC vengono dall\'Indice ufficiale delle pubbliche amministrazioni.' },
  { id: 'tuoi', titolo: 'I tuoi dati per la richiesta', aiuto: 'Restano su questo dispositivo e servono solo a riempire il documento. La legge chiede che chi fa la richiesta sia identificabile.' },
  { id: 'seguito', titolo: 'Dopo l\'invio', aiuto: 'Compila questa parte quando hai inviato la richiesta: calcoliamo le scadenze e prepariamo i passi successivi.' },
];

const inviata = (r) => Boolean(r.data_invio);
const negativa = (r) => ['parziale', 'respinta', 'inammissibile'].includes(r.risposta);

export const DOMANDE = [
  {
    id: 'cosa', sezione: 'cosa', tipo: 'area', etichetta: 'Quali documenti o dati vuoi?',
    aiuto: 'Sii preciso: quale documento, su quale argomento, di quale periodo. Per esempio: «l\'elenco delle consulenze affidate nel 2025, con importo e affidatario».',
    segnaposto: 'Chiedo copia di…',
  },
  { id: 'periodo', sezione: 'cosa', tipo: 'testo', etichetta: 'Periodo a cui si riferiscono', segnaposto: 'es. da gennaio 2025 a oggi' },
  {
    id: 'da_pubblicare', sezione: 'cosa', tipo: 'scelta', etichetta: 'L\'ente doveva già pubblicarli sul suo sito?',
    aiuto: 'Nella sezione «Amministrazione trasparente» devono esserci, tra l\'altro: bilanci, compensi e curriculum di dirigenti e politici, consulenze, bandi di gara e contratti, concorsi, tempi di pagamento, regolamenti.',
    opzioni: [['si', 'Sì, dovrebbero essere pubblicati ma non ci sono'], ['no', 'No, non sono tra i documenti da pubblicare'], ['non_so', 'Non lo so']],
  },
  { id: 'riguarda_te', sezione: 'cosa', tipo: 'si_no', etichetta: 'Ti riguardano personalmente, per esempio una tua pratica o un procedimento in cui sei coinvolto?' },
  { id: 'dati_personali', sezione: 'cosa', tipo: 'si_no', etichetta: 'Contengono dati personali di altre persone, come nomi, redditi o salute?', aiuto: 'Non è un ostacolo assoluto: si può chiedere di oscurarli.' },
  { id: 'ambiente', sezione: 'cosa', tipo: 'si_no', etichetta: 'Riguardano l\'ambiente: aria, acqua, rifiuti, rumore, inquinamento, cantieri?', aiuto: 'Per le informazioni ambientali c\'è una legge in più che ti tutela.' },
  {
    id: 'formato', sezione: 'cosa', tipo: 'scelta', etichetta: 'In che formato li vuoi?',
    opzioni: [['aperto', 'Dati in formato aperto e lavorabile (CSV, XLSX, ODS)'], ['pdf', 'Copia dei documenti in PDF'], ['qualsiasi', 'Va bene qualsiasi formato elettronico']],
  },

  { id: 'ufficio', sezione: 'ente', tipo: 'testo', etichetta: 'Ufficio che ha i documenti, se lo sai', segnaposto: 'es. Ufficio Lavori pubblici' },

  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome' },
  { id: 'nascita', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo e data di nascita', segnaposto: 'es. Bari, 12 maggio 1975' },
  { id: 'residenza', sezione: 'tuoi', tipo: 'testo', etichetta: 'Indirizzo di residenza' },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'PEC o email dove ricevere la risposta' },
  { id: 'telefono', sezione: 'tuoi', tipo: 'testo', etichetta: 'Telefono, facoltativo' },
  { id: 'interesse', sezione: 'tuoi', tipo: 'area', etichetta: 'Perché ti servono questi documenti?', aiuto: 'Serve solo per l\'accesso ai documenti che ti riguardano: la legge chiede di spiegare l\'interesse personale e concreto. Per le altre richieste non devi motivare nulla.', visibile: (r) => r.riguarda_te === true },
  {
    id: 'canale', sezione: 'tuoi', tipo: 'scelta', etichetta: 'Come la invierai?',
    opzioni: [
      ['pec', 'Dalla mia PEC personale'],
      ['email', 'Da una email normale, allegando un documento d\'identità'],
      ['firma', 'Con firma digitale'],
      ['modulo', 'Con il modulo online dell\'ente, entrando con SPID o CIE'],
    ],
  },
  { id: 'luogo', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo in cui firmi', segnaposto: 'es. Bari' },

  { id: 'data_invio', sezione: 'seguito', tipo: 'data', etichetta: 'Quando hai inviato la richiesta?' },
  { id: 'controinteressati', sezione: 'seguito', tipo: 'si_no', etichetta: 'L\'ente ti ha scritto di aver avvisato altre persone interessate (controinteressati)?', visibile: inviata },
  { id: 'data_avviso', sezione: 'seguito', tipo: 'data', etichetta: 'In che data li ha avvisati?', visibile: (r) => inviata(r) && r.controinteressati === true },
  {
    id: 'risposta', sezione: 'seguito', tipo: 'scelta', etichetta: 'Cosa ha risposto l\'ente?', visibile: inviata,
    opzioni: [['nessuna', 'Ancora niente'], ['accolta', 'Mi ha dato tutto'], ['parziale', 'Mi ha dato solo una parte'], ['respinta', 'Ha rifiutato'], ['inammissibile', 'Dice che la richiesta è generica o troppo onerosa'], ['differita', 'Ha rinviato a più avanti']],
  },
  { id: 'data_risposta', sezione: 'seguito', tipo: 'data', etichetta: 'In che data ha risposto?', visibile: (r) => inviata(r) && r.risposta && r.risposta !== 'nessuna' },
  { id: 'motivo_rifiuto', sezione: 'seguito', tipo: 'area', etichetta: 'Con quale motivazione?', aiuto: 'Copia la frase della risposta: la riportiamo nel riesame.', visibile: (r) => inviata(r) && (negativa(r) || r.risposta === 'differita') },
  { id: 'data_riesame', sezione: 'seguito', tipo: 'data', etichetta: 'Se hai già chiesto il riesame, in che data?', visibile: (r) => inviata(r) && (negativa(r) || r.risposta === 'nessuna') },
  {
    id: 'esito_riesame', sezione: 'seguito', tipo: 'scelta', etichetta: 'Esito del riesame', visibile: (r) => Boolean(r.data_riesame),
    opzioni: [['nessuno', 'Ancora niente'], ['accolto', 'Accolto'], ['respinto', 'Respinto in tutto o in parte']],
  },
  { id: 'data_esito_riesame', sezione: 'seguito', tipo: 'data', etichetta: 'Data dell\'esito del riesame', visibile: (r) => ['accolto', 'respinto'].includes(r.esito_riesame) },
];
