// Le domande di «La visita nei tempi». L'ASL si sceglie con una ricerca a parte
// (Indice delle pubbliche amministrazioni); qui ci sono le altre.

export const SEZIONI = [
  { id: 'ricetta', titolo: 'La ricetta', aiuto: 'Classe di priorità e tipo di prestazione sono scritti sulla ricetta del medico (in alto, accanto al codice).' },
  { id: 'prenotazione', titolo: 'La prenotazione' },
  { id: 'asl', titolo: 'La tua ASL', aiuto: 'L\'Azienda sanitaria del luogo in cui hai la residenza: è lei che deve garantire i tempi. La PEC viene dall\'Indice ufficiale delle pubbliche amministrazioni.' },
  { id: 'tuoi', titolo: 'I tuoi dati per la lettera', aiuto: 'Restano su questo dispositivo e servono solo a riempire il documento.' },
];

const primo = (r) => r.accesso === 'primo';

export const DOMANDE = [
  { id: 'sintomi', sezione: 'ricetta', tipo: 'si_no', etichetta: 'I sintomi stanno peggiorando, o ti sembra un\'urgenza?', aiuto: 'Se sì, non aspettare una lettera: chiama il tuo medico o la guardia medica; nei casi gravi il 112 o il 118.' },
  {
    id: 'accesso', sezione: 'ricetta', tipo: 'scelta', etichetta: 'È la prima visita o il primo esame per questo problema?',
    opzioni: [['primo', 'Sì, è un primo accesso'], ['successivo', 'No, è un controllo o un esame di verifica']],
  },
  {
    id: 'classe', sezione: 'ricetta', tipo: 'scelta', etichetta: 'Quale classe di priorità c\'è sulla ricetta?', visibile: primo,
    opzioni: [['U', 'U: urgente, entro 72 ore'], ['B', 'B: breve, entro 10 giorni'], ['D', 'D: differibile, entro 30 giorni (visite) o 60 (esami)'], ['P', 'P: programmata, entro 120 giorni'], ['nessuna', 'Non c\'è scritto']],
  },
  {
    id: 'tipo', sezione: 'ricetta', tipo: 'scelta', etichetta: 'È una visita o un esame?', visibile: (r) => primo(r) && r.classe === 'D',
    opzioni: [['visita', 'Una visita specialistica'], ['esame', 'Un esame: ecografia, TAC, risonanza, radiografia…']],
  },
  { id: 'prestazione', sezione: 'ricetta', tipo: 'testo', etichetta: 'Quale prestazione?', segnaposto: 'es. prima visita cardiologica, ecografia dell\'addome' },
  { id: 'ricetta_n', sezione: 'ricetta', tipo: 'testo', etichetta: 'Numero della ricetta (NRE), se vuoi metterlo nella lettera', segnaposto: 'es. 1600A1234567890' },

  { id: 'data_contatto', sezione: 'prenotazione', tipo: 'data', etichetta: 'In che giorno hai chiamato o sei andato al CUP la prima volta?', aiuto: 'Il tempo massimo si conta dal primo contatto con il centro di prenotazione, non dalla data della ricetta.', visibile: primo },
  {
    id: 'proposta', sezione: 'prenotazione', tipo: 'scelta', etichetta: 'Che cosa ti hanno proposto?', visibile: primo,
    opzioni: [['data', 'Una data'], ['prelista', 'Niente data: mi hanno messo in lista d\'attesa e mi richiameranno'], ['niente', 'Niente: agende piene o chiuse, mi hanno detto di richiamare']],
  },
  { id: 'data_proposta', sezione: 'prenotazione', tipo: 'data', etichetta: 'Quale data ti hanno proposto?', visibile: (r) => primo(r) && r.proposta === 'data' },
  {
    id: 'ambito', sezione: 'prenotazione', tipo: 'scelta', etichetta: 'Dove?', visibile: (r) => primo(r) && r.proposta === 'data',
    opzioni: [['vicino', 'In una struttura della mia zona'], ['lontano', 'In una struttura lontana o fuori dalla mia zona']],
  },
  { id: 'rifiutato', sezione: 'prenotazione', tipo: 'si_no', etichetta: 'Hai rifiutato la prima data proposta per scegliere un\'altra struttura?', visibile: primo },
  { id: 'pagato', sezione: 'prenotazione', tipo: 'si_no', etichetta: 'Hai già fatto la visita a pagamento, privatamente, e vuoi il rimborso?', visibile: primo },
  { id: 'esente', sezione: 'prenotazione', tipo: 'si_no', etichetta: 'Sei esente dal ticket?', visibile: primo },

  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome' },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'PEC o email dove ricevere la risposta' },
  { id: 'telefono', sezione: 'tuoi', tipo: 'testo', etichetta: 'Telefono, per essere richiamato con la data' },
  { id: 'comune_firma', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo in cui firmi', segnaposto: 'es. Bari' },
];
