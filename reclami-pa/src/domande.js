// Le domande di «Reclami alla PA e difensore civico». L'ente si sceglie con una
// ricerca a parte (Indice delle pubbliche amministrazioni); qui ci sono le altre.

export const SEZIONI = [
  { id: 'cosa', titolo: 'Che cosa è successo' },
  { id: 'ente', titolo: 'Con quale ufficio', aiuto: 'Cerca l\'ente per nome: Comune, ASL, INPS, Agenzia delle Entrate, Ministero, Regione, scuola. L\'indirizzo PEC viene dall\'Indice ufficiale delle pubbliche amministrazioni.' },
  { id: 'tuoi', titolo: 'I tuoi dati per la lettera', aiuto: 'Restano su questo dispositivo e servono solo a riempire il documento.' },
  { id: 'seguito', titolo: 'Dopo l\'invio', aiuto: 'Compila questa parte quando hai mandato la lettera: calcoliamo le scadenze del passo successivo.' },
];

const ritardo = (r) => r.problema === 'ritardo';
const inviata = (r) => Boolean(r.data_invio);

export const DOMANDE = [
  {
    id: 'problema', sezione: 'cosa', tipo: 'scelta', etichetta: 'Qual è il problema?',
    opzioni: [
      ['ritardo', 'Ho fatto una domanda e non mi rispondono, o la pratica è ferma'],
      ['preavviso', 'Mi hanno scritto che stanno per respingere la mia domanda'],
      ['disservizio', 'Un servizio fatto male, uno sportello, un comportamento scorretto'],
      ['sanita', 'Mi hanno negato o limitato una prestazione sanitaria'],
      ['digitale', 'Un servizio online della PA non funziona, non accetta SPID o CIE, o non posso pagare con PagoPA'],
      ['privacy', 'Un ente ha usato male i miei dati personali'],
      ['accesso', 'Ho chiesto documenti e me li hanno negati'],
    ],
  },
  { id: 'cosa_chiesto', sezione: 'cosa', tipo: 'area', etichetta: 'Cosa hai chiesto o cosa è successo?', segnaposto: 'es. domanda di contributo per l\'affitto presentata il 3 giugno, protocollo n. …', aiuto: 'Fatti precisi: cosa, quando, a quale ufficio, con quale numero di protocollo.' },
  { id: 'data_domanda', sezione: 'cosa', tipo: 'data', etichetta: 'Quando hai presentato la domanda?', aiuto: 'La data della ricevuta o della PEC. Il termine decorre da quando l\'ente l\'ha ricevuta.', visibile: ritardo },
  { id: 'termine', sezione: 'cosa', tipo: 'numero', etichetta: 'Entro quanti giorni doveva rispondere, se lo sai?', aiuto: 'Spesso è scritto nella ricevuta, nella pagina del procedimento o nel regolamento dell\'ente. Se non c\'è un termine diverso, la legge dice 30 giorni.', visibile: ritardo },
  { id: 'sospensione', sezione: 'cosa', tipo: 'numero', etichetta: 'Ti hanno chiesto documenti in più? Per quanti giorni hai impiegato a mandarli?', aiuto: 'La richiesta di integrazioni sospende il termine una sola volta, al massimo per 30 giorni.', visibile: ritardo },
  { id: 'impresa', sezione: 'cosa', tipo: 'si_no', etichetta: 'La domanda riguarda l\'avvio o l\'esercizio di un\'attività d\'impresa?', aiuto: 'Per esempio un\'autorizzazione per aprire un negozio. Solo in questi casi è previsto un indennizzo per il ritardo.', visibile: ritardo },
  { id: 'data_preavviso', sezione: 'cosa', tipo: 'data', etichetta: 'In che data hai ricevuto la comunicazione dei motivi del rifiuto?', visibile: (r) => r.problema === 'preavviso' },
  { id: 'data_fatto', sezione: 'cosa', tipo: 'data', etichetta: 'Quando è successo, o quando l\'hai saputo?', visibile: (r) => ['disservizio', 'sanita', 'digitale', 'privacy'].includes(r.problema) },

  { id: 'ufficio', sezione: 'ente', tipo: 'testo', etichetta: 'Ufficio, se lo sai', segnaposto: 'es. Servizi sociali, Ufficio tributi, Pronto soccorso' },
  { id: 'protocollo', sezione: 'ente', tipo: 'testo', etichetta: 'Numero di protocollo o di pratica, se ce l\'hai' },

  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome' },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'PEC o email dove ricevere la risposta' },
  { id: 'comune_firma', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo in cui firmi', segnaposto: 'es. Bari' },

  {
    id: 'passo', sezione: 'seguito', tipo: 'scelta', etichetta: 'Cosa hai già mandato?',
    opzioni: [['niente', 'Niente, comincio ora'], ['reclamo', 'Il reclamo o il sollecito all\'ufficio'], ['sostitutivo', 'La richiesta al titolare del potere sostitutivo'], ['difensore', 'L\'istanza al difensore civico']],
  },
  { id: 'data_invio', sezione: 'seguito', tipo: 'data', etichetta: 'In che data l\'hai mandato?', visibile: (r) => r.passo && r.passo !== 'niente' },
  {
    id: 'risposta', sezione: 'seguito', tipo: 'scelta', etichetta: 'Ti hanno risposto?', visibile: inviata,
    opzioni: [['no', 'No'], ['parziale', 'Sì, ma la risposta non risolve'], ['risolto', 'Sì, è risolto']],
  },
];
