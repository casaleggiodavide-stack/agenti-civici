// Le domande di «È una truffa?». Il testo del messaggio si incolla in un riquadro a parte.

export const SEZIONI = [
  { id: 'messaggio', titolo: 'Il messaggio', aiuto: 'Incolla il testo con i link così come li hai ricevuti: li leggiamo senza aprirli. Resta su questo dispositivo.' },
  { id: 'richiesta', titolo: 'Che cosa ti chiede' },
  { id: 'fatto', titolo: 'Hai già fatto qualcosa?', aiuto: 'Rispondi con sincerità: serve a dirti cosa fare subito, non a giudicarti. Capita a tutti.' },
];

const pagato = (r) => r.fatto === 'pagato';

export const DOMANDE = [
  {
    id: 'canale', sezione: 'messaggio', tipo: 'scelta', etichetta: 'Da dove arriva?',
    opzioni: [['sms', 'SMS'], ['email', 'Email'], ['chat', 'WhatsApp, Telegram o un\'altra chat'], ['telefono', 'Una telefonata'], ['social', 'Un social o un annuncio'], ['sito', 'Un sito che ho trovato']],
  },
  { id: 'testo', sezione: 'messaggio', tipo: 'area', etichetta: 'Il testo del messaggio, con i link', segnaposto: 'es. Il tuo pacco è in giacenza: paga 1,99 € per la riconsegna su …', aiuto: 'Per una telefonata, racconta cosa ti hanno detto. Puoi togliere nomi e numeri: non servono.' },
  {
    id: 'chi', sezione: 'richiesta', tipo: 'scelta', etichetta: 'Chi dice di essere?',
    opzioni: [['banca', 'La mia banca o Poste'], ['corriere', 'Un corriere o un negozio online'], ['pa', 'Un ente pubblico: INPS, Agenzia delle Entrate, pagoPA, Comune'], ['polizia', 'Polizia, carabinieri, un tribunale'], ['familiare', 'Un familiare o un amico, spesso con un numero nuovo'], ['investimento', 'Una piattaforma di investimento, trading o criptovalute'], ['venditore', 'Chi compra o vende un oggetto in un annuncio'], ['altro', 'Altro o non lo dice']],
  },
  { id: 'chiede_codici', sezione: 'richiesta', tipo: 'si_no', etichetta: 'Ti chiede codici, PIN, password o il codice arrivato per SMS?' },
  { id: 'chiede_soldi', sezione: 'richiesta', tipo: 'si_no', etichetta: 'Ti chiede di pagare, fare un bonifico o spostare soldi?' },
  { id: 'chiede_app', sezione: 'richiesta', tipo: 'si_no', etichetta: 'Ti chiede di installare un\'app o di farti guidare sul telefono o sul computer?' },
  {
    id: 'fatto', sezione: 'fatto', tipo: 'scelta', etichetta: 'Che cosa hai fatto?',
    opzioni: [['niente', 'Niente, per ora'], ['cliccato', 'Ho aperto il link'], ['dati', 'Ho scritto dati o password'], ['codici', 'Ho dato un codice o confermato un\'operazione dall\'app'], ['pagato', 'Ho pagato o mi hanno tolto dei soldi']],
  },
  {
    id: 'come', sezione: 'fatto', tipo: 'scelta', etichetta: 'Come sono usciti i soldi?', visibile: pagato,
    opzioni: [['carta', 'Con la carta, o un addebito che non ho fatto io'], ['bonifico', 'Con un bonifico che ho fatto io'], ['istantaneo', 'Con un bonifico istantaneo che ho fatto io'], ['ricarica', 'Con una ricarica di carta prepagata'], ['buono', 'Con un buono regalo'], ['cripto', 'In criptovalute']],
  },
  { id: 'data_addebito', sezione: 'fatto', tipo: 'data', etichetta: 'In che giorno è avvenuto il pagamento o l\'addebito?', visibile: pagato },
  { id: 'data_scoperta', sezione: 'fatto', tipo: 'data', etichetta: 'In che giorno ti sei accorto della truffa?', visibile: pagato },
  { id: 'importo', sezione: 'fatto', tipo: 'euro', etichetta: 'Quanto?', visibile: pagato },
];
