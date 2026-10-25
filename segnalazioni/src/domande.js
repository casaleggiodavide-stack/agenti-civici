// Le domande di «Segnalazioni urbane indipendenti». Il Comune si sceglie con una
// ricerca a parte (Indice delle pubbliche amministrazioni); qui ci sono le altre.

import FONTI from './dati/fonti.js';

export const SEZIONI = [
  { id: 'cosa', titolo: 'Che cosa hai visto' },
  { id: 'dove', titolo: 'Dove', aiuto: 'Cerca il Comune per nome: l\'indirizzo PEC viene dall\'Indice ufficiale delle pubbliche amministrazioni. Più il punto è preciso, più è facile intervenire.' },
  { id: 'tuoi', titolo: 'I tuoi dati per la segnalazione', aiuto: 'Restano su questo dispositivo e servono solo a riempire il documento. Una segnalazione firmata vale di più di una anonima.' },
  { id: 'seguito', titolo: 'Dopo l\'invio', aiuto: 'Compila questa parte quando hai inviato la segnalazione: ti ricordiamo quando sollecitare e prepariamo il sollecito.' },
];

export const STRADALI = new Set(['buca', 'marciapiede', 'lampione_spento', 'segnaletica', 'alberi_verde', 'animali']);
const stradale = (r) => STRADALI.has(r.categoria);
const inviata = (r) => Boolean(r.data_invio);

export const DOMANDE = [
  {
    id: 'categoria', sezione: 'cosa', tipo: 'elenco', etichetta: 'Di che problema si tratta?',
    opzioni: FONTI.categorie.map((c) => [c.id, c.nome.replace(/\s*\(categoria aggiuntiva[^)]*\)/, '')]),
  },
  {
    id: 'descrizione', sezione: 'cosa', tipo: 'area', etichetta: 'Descrivilo in poche righe',
    aiuto: 'Cosa, quanto è grande, da quando c\'è, se è pericoloso e per chi. Fatti, non giudizi: «buca profonda circa 15 cm, larga un metro, sulla corsia verso il centro, da almeno due settimane».',
    segnaposto: 'Segnalo che…',
  },
  { id: 'pericolo', sezione: 'cosa', tipo: 'si_no', etichetta: 'C\'è un pericolo immediato per persone o veicoli?', aiuto: 'Per esempio una voragine al buio, cavi scoperti, un albero che sta per cadere, rifiuti che bruciano, un semaforo spento a un incrocio.' },
  { id: 'dal', sezione: 'cosa', tipo: 'data', etichetta: 'Da quando c\'è, più o meno?' },
  { id: 'foto', sezione: 'cosa', tipo: 'numero', etichetta: 'Quante foto allegherai?', aiuto: 'Le foto sono la prova migliore: scattale da vicino e da lontano, con un riferimento (numero civico, cartello, palo).' },

  { id: 'luogo', sezione: 'dove', tipo: 'testo', etichetta: 'Indirizzo o punto preciso', segnaposto: 'es. via Roma davanti al civico 12, lato mare' },
  { id: 'coordinate', sezione: 'dove', tipo: 'testo', etichetta: 'Coordinate, se le hai', aiuto: 'Puoi usare il pulsante «Usa la mia posizione» qui sopra: la posizione resta sul tuo dispositivo e va solo nel testo della segnalazione.', segnaposto: 'es. 40.3529, 18.1722' },
  {
    id: 'strada', sezione: 'dove', tipo: 'scelta', etichetta: 'Su che tipo di strada?', visibile: stradale,
    aiuto: 'Dentro il centro abitato, tra i cartelli di inizio e fine paese, la strada è quasi sempre del Comune. Fuori guarda i cartelli: SS = statale (ANAS), SP = provinciale, SR = regionale, A su fondo verde = autostrada.',
    opzioni: [['urbana', 'Dentro il centro abitato'], ['comunale', 'Strada comunale fuori dal centro'], ['provinciale', 'Strada provinciale (SP)'], ['statale', 'Strada statale (SS)'], ['regionale', 'Strada regionale (SR)'], ['autostrada', 'Autostrada'], ['non_so', 'Non lo so']],
  },
  { id: 'sigla_km', sezione: 'dove', tipo: 'testo', etichetta: 'Sigla della strada e chilometro', segnaposto: 'es. SP 12 km 4,3', visibile: (r) => stradale(r) && ['provinciale', 'statale', 'regionale', 'autostrada'].includes(r.strada) },
  { id: 'scuola_superiore', sezione: 'dove', tipo: 'si_no', etichetta: 'È una scuola superiore (liceo, istituto tecnico o professionale)?', aiuto: 'Le scuole superiori sono della Provincia o della Città metropolitana; asili, elementari e medie del Comune.', visibile: (r) => r.categoria === 'edificio_pubblico_degrado' },

  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome' },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'PEC o email dove ricevere la risposta' },
  { id: 'telefono', sezione: 'tuoi', tipo: 'testo', etichetta: 'Telefono, facoltativo' },
  { id: 'comune_firma', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo in cui firmi', segnaposto: 'es. Lecce' },

  { id: 'data_invio', sezione: 'seguito', tipo: 'data', etichetta: 'Quando hai inviato la segnalazione?' },
  { id: 'protocollo', sezione: 'seguito', tipo: 'testo', etichetta: 'Numero di protocollo, se te l\'hanno dato', visibile: inviata },
  {
    id: 'risposta', sezione: 'seguito', tipo: 'scelta', etichetta: 'Cosa è successo dopo?', visibile: inviata,
    opzioni: [['nessuna', 'Niente: nessuna risposta e nessun intervento'], ['presa', 'Mi hanno risposto, ma non è stato fatto niente'], ['inoltrata', 'Mi hanno detto che non è di loro competenza'], ['risolto', 'Il problema è stato risolto']],
  },
];
