// Le domande di «Si è rotto o ci ho ripensato»: garanzia del venditore, obbligo di
// riparazione del fabbricante, diritto di recesso e rimborso.

export const SEZIONI = [
  { id: 'cosa', titolo: 'Che cosa è successo' },
  { id: 'acquisto', titolo: 'L\'acquisto', aiuto: 'Le date decidono quali regole valgono: guarda lo scontrino, la fattura o l\'email di conferma dell\'ordine.' },
  { id: 'difetto', titolo: 'Il difetto' },
  { id: 'recesso', titolo: 'Il ripensamento' },
  { id: 'tuoi', titolo: 'I dati per la lettera', aiuto: 'Restano su questo dispositivo e servono solo a riempire il documento.' },
];

const difetto = (r) => r.caso === 'difetto';
const recesso = (r) => r.caso === 'ripensamento' || r.caso === 'rimborso';
const professionista = (r) => r.venditore !== 'privato';
const bene = (r) => r.tipo !== 'servizio' && r.tipo !== 'digitale';

export const CATEGORIE_RIPARAZIONE = [
  ['lavatrice', 'Lavatrice o lavasciuga'],
  ['lavastoviglie', 'Lavastoviglie'],
  ['frigorifero', 'Frigorifero o congelatore'],
  ['asciugatrice', 'Asciugatrice'],
  ['aspirapolvere', 'Aspirapolvere'],
  ['telefono', 'Smartphone, cellulare, telefono cordless o tablet'],
  ['schermo', 'Televisore, monitor o altro schermo'],
  ['batteria', 'Batteria di bicicletta o monopattino elettrico'],
  ['server', 'Server o dispositivo di archiviazione dati'],
  ['saldatrice', 'Saldatrice'],
  ['altro', 'Altro oggetto'],
];

export const DOMANDE = [
  {
    id: 'caso', sezione: 'cosa', tipo: 'scelta', etichetta: 'Che cosa ti serve?',
    opzioni: [
      ['difetto', 'Si è rotto o non funziona come dovrebbe'],
      ['ripensamento', 'Ci ho ripensato: voglio restituirlo o annullare il contratto'],
      ['rimborso', 'Ho già esercitato il recesso, ma non mi hanno rimborsato'],
    ],
  },
  { id: 'cosa_comprato', sezione: 'cosa', tipo: 'testo', etichetta: 'Che cosa hai comprato?', segnaposto: 'es. lavatrice Marca Modello, scarpe da corsa, abbonamento a una palestra' },
  {
    id: 'venditore', sezione: 'acquisto', tipo: 'scelta', etichetta: 'Da chi l\'hai comprato?',
    opzioni: [['professionista', 'Da un negozio, un sito o un\'azienda'], ['privato', 'Da un privato, per esempio con un annuncio tra persone']],
  },
  {
    id: 'dove', sezione: 'acquisto', tipo: 'scelta', etichetta: 'Dove hai fatto il contratto?', visibile: professionista,
    opzioni: [
      ['negozio', 'In negozio'],
      ['distanza', 'Online, per telefono o per posta'],
      ['fuori', 'Fuori dal negozio: in una fiera, a un banchetto, in un ufficio del venditore'],
      ['visita', 'A casa mia durante una visita non richiesta, o in un\'escursione organizzata dal venditore'],
    ],
  },
  {
    id: 'tipo', sezione: 'acquisto', tipo: 'scelta', etichetta: 'Che cosa è?', visibile: professionista,
    opzioni: [['bene', 'Un oggetto'], ['digitale', 'Un contenuto o un servizio digitale (app, film, abbonamento online)'], ['servizio', 'Un servizio (palestra, corso, lavori, contratto di fornitura)']],
  },
  { id: 'data_contratto', sezione: 'acquisto', tipo: 'data', etichetta: 'In che giorno hai fatto l\'acquisto o firmato il contratto?', visibile: professionista },
  { id: 'data_consegna', sezione: 'acquisto', tipo: 'data', etichetta: 'In che giorno l\'hai ricevuto?', aiuto: 'Per la garanzia e per il recesso conta la consegna, non l\'ordine.', visibile: (r) => professionista(r) && bene(r) },
  { id: 'usato', sezione: 'acquisto', tipo: 'si_no', etichetta: 'Era usato o ricondizionato?', visibile: (r) => professionista(r) && bene(r) && difetto(r) },
  { id: 'garanzia_ridotta', sezione: 'acquisto', tipo: 'si_no', nonSo: true, etichetta: 'Il contratto riduce la garanzia a un anno?', aiuto: 'Per l\'usato il venditore può ridurla, ma non sotto un anno, e deve scriverlo nel contratto.', visibile: (r) => professionista(r) && difetto(r) && r.usato === true },
  { id: 'venditore_nome', sezione: 'acquisto', tipo: 'testo', etichetta: 'Nome del venditore e indirizzo email o PEC', segnaposto: 'es. Elettrodomestici Rossi srl, assistenza@esempio.it', visibile: professionista },

  { id: 'categoria', sezione: 'difetto', tipo: 'elenco', etichetta: 'Di che oggetto si tratta?', aiuto: 'Per alcuni oggetti il fabbricante deve ripararli anche quando la garanzia del venditore è finita.', opzioni: CATEGORIE_RIPARAZIONE, visibile: (r) => professionista(r) && difetto(r) && bene(r) },
  { id: 'data_difetto', sezione: 'difetto', tipo: 'data', etichetta: 'Quando è comparso il difetto?', visibile: (r) => professionista(r) && difetto(r) },
  { id: 'descrizione', sezione: 'difetto', tipo: 'area', etichetta: 'Descrivi il difetto', segnaposto: 'es. la centrifuga non parte e compare l\'errore E21', visibile: (r) => professionista(r) && difetto(r) },
  {
    id: 'rimedio', sezione: 'difetto', tipo: 'scelta', etichetta: 'Che cosa preferisci?', visibile: (r) => professionista(r) && difetto(r),
    opzioni: [['riparazione', 'Che lo riparino'], ['sostituzione', 'Che lo sostituiscano'], ['riduzione', 'Uno sconto sul prezzo'], ['risoluzione', 'Restituirlo e riavere i soldi']],
  },
  { id: 'gia_riparato', sezione: 'difetto', tipo: 'si_no', etichetta: 'Hai già chiesto la riparazione o la sostituzione, senza risultato, o il difetto è tornato?', visibile: (r) => professionista(r) && difetto(r) },
  { id: 'grave', sezione: 'difetto', tipo: 'si_no', etichetta: 'Il difetto è grave, tanto da renderlo inutilizzabile o pericoloso?', visibile: (r) => professionista(r) && difetto(r) && ['riduzione', 'risoluzione'].includes(r.rimedio) },

  { id: 'informato', sezione: 'recesso', tipo: 'si_no', nonSo: true, etichetta: 'Ti hanno informato per iscritto del diritto di recesso?', aiuto: 'Di solito è nelle condizioni di vendita o nell\'email di conferma, con il modulo tipo di recesso.', visibile: (r) => professionista(r) && r.caso === 'ripensamento' && r.dove && r.dove !== 'negozio' },
  {
    id: 'eccezione', sezione: 'recesso', tipo: 'scelta', etichetta: 'È uno di questi casi?', visibile: (r) => professionista(r) && r.caso === 'ripensamento' && r.dove && r.dove !== 'negozio',
    opzioni: [
      ['nessuna', 'No, nessuno di questi'],
      ['misura', 'Fatto su misura o personalizzato per me'],
      ['deperibile', 'Deperibile: cibo, fiori, prodotti che scadono presto'],
      ['sigillato', 'Sigillato per igiene o salute, e l\'ho aperto'],
      ['data', 'Biglietto o servizio per il tempo libero in una data precisa (concerto, hotel, noleggio auto, ristorante)'],
      ['eseguito', 'Un servizio già eseguito del tutto, che avevo chiesto di iniziare subito'],
      ['scaricato', 'Un contenuto digitale già scaricato o visto, che avevo chiesto di avere subito'],
    ],
  },
  { id: 'funzione', sezione: 'recesso', tipo: 'si_no', nonSo: true, etichetta: 'Sul sito c\'era il pulsante «recedere dal contratto qui»?', aiuto: 'Dal 19 giugno 2026 i siti devono avere una funzione per recedere facilmente, ben visibile.', visibile: (r) => professionista(r) && r.caso === 'ripensamento' && r.dove === 'distanza' && (r.data_contratto || '') >= '2026-06-19' },
  { id: 'data_recesso', sezione: 'recesso', tipo: 'data', etichetta: 'In che giorno hai comunicato il recesso?', visibile: (r) => professionista(r) && r.caso === 'rimborso' },
  { id: 'data_reso', sezione: 'recesso', tipo: 'data', etichetta: 'In che giorno hai spedito o riconsegnato l\'oggetto?', aiuto: 'Il venditore può aspettare di riceverlo, o la prova della spedizione, prima di rimborsare.', visibile: (r) => professionista(r) && r.caso === 'rimborso' && bene(r) },
  { id: 'ordine', sezione: 'recesso', tipo: 'testo', etichetta: 'Numero d\'ordine o di contratto, se c\'è', visibile: (r) => professionista(r) && recesso(r) },

  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome' },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'Indirizzo email o PEC per la risposta' },
  { id: 'indirizzo', sezione: 'tuoi', tipo: 'testo', etichetta: 'Indirizzo di casa, se la lettera va per raccomandata' },
  { id: 'comune_firma', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo in cui firmi', segnaposto: 'es. Torino' },
];
