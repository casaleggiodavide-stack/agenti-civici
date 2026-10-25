// Le domande di «Mi rimborsano?». Tutte facoltative: una risposta mancante
// diventa «serve un dato», mai un'ipotesi.

import { AEROPORTI } from './dati/aeroporti.js';

export const CASI = [
  ['volo', 'Un volo in ritardo, cancellato o con imbarco negato'],
  ['bagaglio', 'Un bagaglio in aereo perso, in ritardo o danneggiato'],
  ['treno', 'Un treno in ritardo o soppresso'],
  ['bolletta', 'Una bolletta di luce, gas, acqua o rifiuti sbagliata o troppo vecchia'],
  ['telefono', 'Un problema con telefono, internet o pay TV'],
  ['banca', 'Un addebito non autorizzato o un problema con la banca'],
];

export const SEZIONI = [
  { id: 'caso', titolo: 'Che cosa è successo' },
  { id: 'volo', titolo: 'Il volo' },
  { id: 'bagaglio', titolo: 'Il bagaglio' },
  { id: 'treno', titolo: 'Il treno' },
  { id: 'bolletta', titolo: 'La bolletta' },
  { id: 'telefono', titolo: 'Il disservizio' },
  { id: 'banca', titolo: 'L\'operazione' },
  { id: 'reclamo', titolo: 'Il reclamo', aiuto: 'Se hai già scritto all\'azienda, i termini partono da lì.' },
  { id: 'tuoi', titolo: 'I tuoi dati per la lettera', aiuto: 'Restano su questo dispositivo e servono solo a riempire il documento. Puoi lasciarli vuoti e scriverli a mano.' },
];

const caso = (...c) => (r) => c.includes(r.caso);
const AERO = [...AEROPORTI].sort((a, b) => a[1].localeCompare(b[1], 'it')).map(([c, n]) => [c, `${n} (${c})`]).concat([['altro', 'Un altro aeroporto']]);

export const CAUSE_VOLO = [
  ['guasto', 'Un guasto o un problema tecnico dell\'aereo'],
  ['sciopero_vettore', 'Uno sciopero del personale della compagnia'],
  ['ritardo_precedente', 'Il ritardo dell\'aereo sul volo precedente'],
  ['meteo', 'Maltempo incompatibile con il volo'],
  ['atc', 'Una decisione del controllo del traffico aereo'],
  ['sciopero_esterno', 'Uno sciopero esterno (controllori di volo, aeroporto)'],
  ['sicurezza', 'Rischi per la sicurezza o instabilità politica'],
  ['non_detta', 'La compagnia non l\'ha detto'],
];

export const DISSERVIZI = [
  ['interruzione', 'Il servizio non funziona per niente'],
  ['malfunzionamento', 'Il servizio funziona male o a intermittenza'],
  ['attivazione', 'Ritardo nell\'attivazione o nel trasloco della linea'],
  ['sospensione', 'Mi hanno sospeso la linea senza motivo o senza preavviso'],
  ['non_richiesti', 'Mi hanno attivato servizi o abbonamenti che non ho chiesto'],
  ['portabilita', 'Ritardo nel passaggio a un altro operatore o nella portabilità del numero'],
  ['costi_recesso', 'Mi chiedono costi per disdire o cambiare operatore'],
];

export const DOMANDE = [
  { id: 'caso', sezione: 'caso', tipo: 'scelta', etichetta: 'Di che cosa si tratta?', opzioni: CASI },

  // Volo
  { id: 'volo_tipo', sezione: 'volo', tipo: 'scelta', etichetta: 'Che cosa è successo al volo?', visibile: caso('volo'), opzioni: [['ritardo', 'È arrivato in ritardo'], ['cancellazione', 'È stato cancellato'], ['negato_imbarco', 'Non mi hanno fatto salire (overbooking o altro)']] },
  { id: 'data_volo', sezione: 'volo', tipo: 'data', etichetta: 'Data del volo', visibile: caso('volo') },
  { id: 'da', sezione: 'volo', tipo: 'elenco', etichetta: 'Aeroporto di partenza', visibile: caso('volo'), opzioni: AERO },
  { id: 'a', sezione: 'volo', tipo: 'elenco', etichetta: 'Destinazione finale', aiuto: 'Con uno scalo conta la destinazione finale della prenotazione, non lo scalo.', visibile: caso('volo'), opzioni: AERO },
  { id: 'distanza_km', sezione: 'volo', tipo: 'numero', etichetta: 'Distanza in linea d\'aria tra i due aeroporti, in km', aiuto: 'Serve solo se un aeroporto non è in elenco.', visibile: (r) => r.caso === 'volo' && (r.da === 'altro' || r.a === 'altro'), min: 0, max: 20000 },
  { id: 'partenza_ue', sezione: 'volo', tipo: 'si_no', etichetta: 'L\'aeroporto di partenza è nell\'Unione europea, in Islanda, Norvegia o Svizzera?', visibile: (r) => r.caso === 'volo' && r.da === 'altro' },
  { id: 'arrivo_ue', sezione: 'volo', tipo: 'si_no', etichetta: 'La destinazione è nell\'Unione europea, in Islanda, Norvegia o Svizzera?', visibile: (r) => r.caso === 'volo' && r.a === 'altro' },
  { id: 'vettore_ue', sezione: 'volo', tipo: 'si_no', nonSo: true, etichetta: 'La compagnia che ha operato il volo è europea?', aiuto: 'Conta chi opera il volo, anche se il biglietto è di un\'altra compagnia. Serve per i voli che partono da fuori Europa.', visibile: caso('volo') },
  { id: 'ritardo_ore', sezione: 'volo', tipo: 'numero', passo: 0.25, etichetta: 'Con quante ore di ritardo sei arrivato alla destinazione finale?', aiuto: 'Conta l\'apertura del portellone, non l\'atterraggio. Per esempio 3,5 per tre ore e mezza.', visibile: (r) => r.caso === 'volo' && r.volo_tipo === 'ritardo', min: 0, max: 72 },
  { id: 'preavviso_giorni', sezione: 'volo', tipo: 'numero', etichetta: 'Quanti giorni prima della partenza ti hanno avvisato della cancellazione?', aiuto: 'Scrivi 0 se l\'hai saputo in aeroporto.', visibile: (r) => r.caso === 'volo' && r.volo_tipo === 'cancellazione', min: 0, max: 365 },
  { id: 'alternativa', sezione: 'volo', tipo: 'si_no', etichetta: 'Ti hanno offerto un volo alternativo?', visibile: (r) => r.caso === 'volo' && r.volo_tipo === 'cancellazione' && r.preavviso_giorni !== undefined && r.preavviso_giorni < 14 },
  { id: 'alt_anticipo_ore', sezione: 'volo', tipo: 'numero', passo: 0.25, etichetta: 'Quante ore prima dell\'orario originale partiva l\'alternativa?', aiuto: 'Scrivi 0 se partiva dopo.', visibile: (r) => r.caso === 'volo' && r.alternativa === true, min: 0, max: 72 },
  { id: 'alt_ritardo_ore', sezione: 'volo', tipo: 'numero', passo: 0.25, etichetta: 'Con quante ore di ritardo rispetto all\'orario originale sei arrivato con l\'alternativa?', visibile: (r) => r.caso === 'volo' && (r.alternativa === true || r.volo_tipo === 'negato_imbarco'), min: 0, max: 72 },
  { id: 'causa_volo', sezione: 'volo', tipo: 'scelta', etichetta: 'Che motivo ha dato la compagnia?', visibile: (r) => r.caso === 'volo' && r.volo_tipo !== 'negato_imbarco', opzioni: CAUSE_VOLO },
  { id: 'prezzo_volo', sezione: 'volo', tipo: 'euro', etichetta: 'Quanto hai pagato il biglietto?', aiuto: 'Serve per il rimborso se hai rinunciato al viaggio.', visibile: caso('volo') },
  { id: 'compagnia', sezione: 'volo', tipo: 'testo', etichetta: 'Compagnia aerea', segnaposto: 'es. ITA Airways', visibile: caso('volo', 'bagaglio') },
  { id: 'numero_volo', sezione: 'volo', tipo: 'testo', etichetta: 'Numero del volo', segnaposto: 'es. AZ 1234', visibile: caso('volo', 'bagaglio') },

  // Bagaglio
  { id: 'bagaglio_tipo', sezione: 'bagaglio', tipo: 'scelta', etichetta: 'Che cosa è successo al bagaglio registrato?', visibile: caso('bagaglio'), opzioni: [['danneggiato', 'È arrivato danneggiato o manomesso'], ['ritardo', 'È arrivato in ritardo'], ['smarrito', 'Non è ancora arrivato']] },
  { id: 'data_arrivo_volo', sezione: 'bagaglio', tipo: 'data', etichetta: 'Data di arrivo del volo', visibile: caso('bagaglio') },
  { id: 'data_bagaglio', sezione: 'bagaglio', tipo: 'data', etichetta: 'Data in cui hai ricevuto il bagaglio', visibile: (r) => r.caso === 'bagaglio' && r.bagaglio_tipo && r.bagaglio_tipo !== 'smarrito' },
  { id: 'pir', sezione: 'bagaglio', tipo: 'si_no', etichetta: 'Hai compilato il modulo PIR all\'ufficio bagagli dell\'aeroporto?', visibile: caso('bagaglio') },
  { id: 'spese_bagaglio', sezione: 'bagaglio', tipo: 'euro', etichetta: 'Quanto chiedi di rimborso (spese, valore del danno)?', visibile: caso('bagaglio') },

  // Treno
  { id: 'data_treno', sezione: 'treno', tipo: 'data', etichetta: 'Data del viaggio', visibile: caso('treno') },
  { id: 'soppresso', sezione: 'treno', tipo: 'si_no', etichetta: 'Il treno è stato soppresso?', visibile: caso('treno') },
  { id: 'ritardo_minuti', sezione: 'treno', tipo: 'numero', etichetta: 'Con quanti minuti di ritardo sei arrivato a destinazione?', visibile: caso('treno'), min: 0, max: 2000 },
  { id: 'prezzo_treno', sezione: 'treno', tipo: 'euro', etichetta: 'Prezzo pagato per il biglietto di quella tratta', visibile: caso('treno') },
  { id: 'causa_treno', sezione: 'treno', tipo: 'scelta', etichetta: 'Che motivo è stato dato?', visibile: caso('treno'), opzioni: [['guasto', 'Guasto al treno o alla linea'], ['sciopero', 'Sciopero del personale'], ['terzi', 'Persone sui binari, furto di cavi, intervento della polizia'], ['meteo', 'Maltempo estremo o calamità naturale'], ['non_detta', 'Nessun motivo o non lo so']] },
  { id: 'abbonato', sezione: 'treno', tipo: 'si_no', etichetta: 'Viaggi con un abbonamento mensile o annuale?', visibile: caso('treno') },
  { id: 'impresa', sezione: 'treno', tipo: 'testo', etichetta: 'Impresa ferroviaria', segnaposto: 'es. Trenitalia, Italo, Trenord', visibile: caso('treno') },

  // Bolletta
  { id: 'servizio', sezione: 'bolletta', tipo: 'scelta', etichetta: 'Di che bolletta si tratta?', visibile: caso('bolletta'), opzioni: [['luce', 'Luce'], ['gas', 'Gas'], ['acqua', 'Acqua'], ['rifiuti', 'Rifiuti (TARI)']] },
  { id: 'domestico', sezione: 'bolletta', tipo: 'si_no', etichetta: 'È un contratto per la casa (o di una microimpresa o un professionista)?', visibile: caso('bolletta') },
  { id: 'problema_bolletta', sezione: 'bolletta', tipo: 'scelta', etichetta: 'Qual è il problema?', visibile: caso('bolletta'), opzioni: [['vecchia', 'Mi fanno pagare consumi di molto tempo fa (conguaglio, maxi-bolletta)'], ['errata', 'Importi o consumi sbagliati'], ['doppia', 'Mi hanno fatturato due volte'], ['altro', 'Altro']] },
  { id: 'scadenza_bolletta', sezione: 'bolletta', tipo: 'data', etichetta: 'Data di scadenza della bolletta', visibile: caso('bolletta') },
  { id: 'consumi_dal', sezione: 'bolletta', tipo: 'data', etichetta: 'Da quando partono i consumi più vecchi fatturati?', aiuto: 'È l\'inizio del periodo indicato in bolletta per i consumi o il conguaglio.', visibile: (r) => r.caso === 'bolletta' && r.problema_bolletta === 'vecchia' },
  { id: 'importo_bolletta', sezione: 'bolletta', tipo: 'euro', etichetta: 'Importo della bolletta', visibile: caso('bolletta') },
  { id: 'fornitore', sezione: 'bolletta', tipo: 'testo', etichetta: 'Venditore o gestore', segnaposto: 'es. il nome che compare in bolletta', visibile: caso('bolletta') },
  { id: 'codice_fornitura', sezione: 'bolletta', tipo: 'testo', etichetta: 'Codice POD (luce), PDR (gas) o codice cliente', visibile: caso('bolletta') },

  // Telefono e internet
  { id: 'disservizio', sezione: 'telefono', tipo: 'scelta', etichetta: 'Che cosa è successo?', visibile: caso('telefono'), opzioni: DISSERVIZI },
  { id: 'data_inizio', sezione: 'telefono', tipo: 'data', etichetta: 'Da quando? (o data entro cui doveva essere attivata la linea)', visibile: caso('telefono') },
  { id: 'risolto', sezione: 'telefono', tipo: 'si_no', etichetta: 'Il problema è stato risolto?', visibile: caso('telefono') },
  { id: 'data_fine', sezione: 'telefono', tipo: 'data', etichetta: 'Quando è stato risolto?', visibile: (r) => r.caso === 'telefono' && r.risolto === true },
  { id: 'fibra', sezione: 'telefono', tipo: 'si_no', etichetta: 'Riguarda internet in fibra o banda ultralarga?', visibile: (r) => r.caso === 'telefono' && ['interruzione', 'malfunzionamento', 'attivazione'].includes(r.disservizio) },
  { id: 'affari', sezione: 'telefono', tipo: 'si_no', etichetta: 'È un contratto «affari» intestato a un\'attività?', visibile: caso('telefono') },
  { id: 'operatore', sezione: 'telefono', tipo: 'testo', etichetta: 'Operatore', visibile: caso('telefono') },
  { id: 'numero_linea', sezione: 'telefono', tipo: 'testo', etichetta: 'Numero della linea o codice cliente', visibile: caso('telefono') },

  // Banca
  { id: 'banca_tipo', sezione: 'banca', tipo: 'scelta', etichetta: 'Qual è il problema?', visibile: caso('banca'), opzioni: [['non_autorizzata', 'Un pagamento o un prelievo che non ho fatto io (frode, phishing, carta rubata)'], ['altro', 'Un altro problema (commissioni, mutuo, conto)']] },
  { id: 'data_addebito', sezione: 'banca', tipo: 'data', etichetta: 'Data dell\'addebito', visibile: caso('banca') },
  { id: 'importo_banca', sezione: 'banca', tipo: 'euro', etichetta: 'Importo', visibile: caso('banca') },
  { id: 'bloccato', sezione: 'banca', tipo: 'si_no', etichetta: 'L\'addebito è avvenuto dopo che avevi chiesto il blocco della carta o del conto?', visibile: (r) => r.caso === 'banca' && r.banca_tipo === 'non_autorizzata' },
  { id: 'codici_dati', sezione: 'banca', tipo: 'si_no', nonSo: true, etichetta: 'Hai dato a qualcuno codici, PIN o conferme dall\'app?', aiuto: 'Rispondi con sincerità: conta per capire se la banca può parlare di colpa grave.', visibile: (r) => r.caso === 'banca' && r.banca_tipo === 'non_autorizzata' },
  { id: 'banca', sezione: 'banca', tipo: 'testo', etichetta: 'Banca o intermediario', visibile: caso('banca') },

  // Reclamo
  { id: 'gia_reclamato', sezione: 'reclamo', tipo: 'si_no', etichetta: 'Hai già mandato un reclamo scritto all\'azienda?', visibile: (r) => Boolean(r.caso) },
  { id: 'data_reclamo', sezione: 'reclamo', tipo: 'data', etichetta: 'Quando lo hai mandato?', visibile: (r) => r.gia_reclamato === true },
  { id: 'risposta', sezione: 'reclamo', tipo: 'scelta', etichetta: 'Ti hanno risposto?', visibile: (r) => r.gia_reclamato === true, opzioni: [['no', 'No'], ['negativa', 'Sì, ma hanno respinto o risposto male'], ['positiva', 'Sì, e hanno accolto']] },

  // Dati per la lettera
  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome', visibile: (r) => Boolean(r.caso) },
  { id: 'indirizzo', sezione: 'tuoi', tipo: 'testo', etichetta: 'Indirizzo', visibile: (r) => Boolean(r.caso) },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'Email o PEC per la risposta', visibile: (r) => Boolean(r.caso) },
  { id: 'riferimento', sezione: 'tuoi', tipo: 'testo', etichetta: 'Codice di prenotazione, numero di pratica o del biglietto', visibile: (r) => ['volo', 'bagaglio', 'treno', 'banca'].includes(r.caso) },
  { id: 'iban', sezione: 'tuoi', tipo: 'testo', etichetta: 'IBAN per il pagamento', visibile: (r) => Boolean(r.caso) },
  { id: 'luogo', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo', segnaposto: 'es. Milano', visibile: (r) => Boolean(r.caso) },
];
