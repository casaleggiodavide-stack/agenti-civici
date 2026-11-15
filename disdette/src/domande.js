// Le domande di «Disdici un abbonamento». I dati della persona (nome, indirizzo,
// codici del contratto) restano sul dispositivo e servono solo a riempire la lettera.

import { CONTRATTI } from './regole.js';

export const SEZIONI = [
  { id: 'contratto', titolo: 'Il contratto' },
  { id: 'durata', titolo: 'Durata e rinnovo', aiuto: 'Le trovi nella sintesi contrattuale, nelle condizioni generali o nel frontespizio della polizza.' },
  { id: 'offerta', titolo: 'Come l\'hai firmato e cosa c\'è dentro' },
  { id: 'tuoi', titolo: 'I tuoi dati per la lettera', aiuto: 'Restano su questo dispositivo e servono solo a riempire la lettera.' },
];

const t = (...tipi) => (r) => tipi.includes(r.tipo);
const tlc = t('telefonia', 'paytv');
const abbonamento = t('servizi', 'digitale');
const CHIUDO = ['chiudo', 'Voglio chiudere il contratto'];
const MODIFICA = ['modifica', 'Hanno cambiato prezzo o condizioni'];
const NON_RICHIESTO = ['non_richiesto', 'Non l\'ho mai chiesto: è stato attivato senza il mio consenso'];

/** Il motivo, da qualunque delle tre domande sia stato scelto. */
export const motivo = (r) => r.motivo_tlc || r.motivo_energia || r.motivo_altro || r.motivo;

/** Dalle risposte del questionario al contratto per valutaDisdetta. */
export const contratto = (r) => ({ ...r, motivo: motivo(r) });

export const DOMANDE = [
  { id: 'tipo', sezione: 'contratto', tipo: 'scelta', etichetta: 'Che contratto vuoi disdire?', opzioni: Object.entries(CONTRATTI) },
  { id: 'con_internet', sezione: 'contratto', tipo: 'si_no', etichetta: 'La pay TV è in un pacchetto con internet o telefono?', aiuto: 'Nel pacchetto valgono le regole più forti del Codice delle comunicazioni elettroniche.', visibile: t('paytv') },
  { id: 'materia', sezione: 'contratto', tipo: 'scelta', etichetta: 'Luce, gas o tutti e due?', opzioni: [['luce', 'Luce'], ['gas', 'Gas'], ['entrambi', 'Luce e gas']], visibile: t('energia') },
  { id: 'fornitore', sezione: 'contratto', tipo: 'testo', etichetta: 'Con chi hai il contratto?', segnaposto: 'es. nome dell\'operatore, della palestra, dell\'assicurazione', visibile: (r) => Boolean(r.tipo) },
  { id: 'motivo_tlc', sezione: 'contratto', tipo: 'scelta', etichetta: 'Perché vuoi disdire?', visibile: tlc, opzioni: [CHIUDO, ['cambio', 'Passo a un altro operatore'], MODIFICA, ['qualita', 'Internet va molto peggio di quanto promesso'], NON_RICHIESTO] },
  { id: 'motivo_energia', sezione: 'contratto', tipo: 'scelta', etichetta: 'Perché vuoi disdire?', visibile: t('energia'), opzioni: [['cambio', 'Passo a un altro venditore'], ['chiudo', 'Chiudo la fornitura (per esempio, lascio la casa)'], MODIFICA, NON_RICHIESTO] },
  { id: 'motivo_altro', sezione: 'contratto', tipo: 'scelta', etichetta: 'Perché vuoi disdire?', visibile: t('servizi', 'digitale', 'polizza'), opzioni: [CHIUDO, MODIFICA, NON_RICHIESTO] },
  { id: 'data_modifica', sezione: 'contratto', tipo: 'data', etichetta: 'Quando ti hanno comunicato la modifica?', aiuto: 'La data della lettera, dell\'SMS o del messaggio in fattura. Per telefono e internet hai 60 giorni da quel giorno.', visibile: (r) => motivo(r) === 'modifica' },
  { id: 'prezzo_fisso', sezione: 'contratto', tipo: 'si_no', nonSo: true, etichetta: 'Il prezzo della luce è fisso?', aiuto: 'Solo la luce a prezzo fisso può avere un onere di recesso anticipato.', visibile: (r) => r.tipo === 'energia' && ['luce', 'entrambi'].includes(r.materia) },

  { id: 'data_firma', sezione: 'durata', tipo: 'data', etichetta: 'Quando hai firmato il contratto?', aiuto: 'Per una polizza: la data di inizio (decorrenza). È nella conferma d\'ordine, nel contratto o nella prima fattura.', visibile: (r) => r.tipo && r.tipo !== 'rc_auto' && r.tipo !== 'energia' },
  { id: 'durata_mesi', sezione: 'durata', tipo: 'numero', etichetta: 'Per quanti mesi ti impegna il contratto?', aiuto: 'Il vincolo o la durata: per esempio 12 o 24. Scrivi 0 se non c\'è una durata minima.', visibile: (r) => r.tipo && !['rc_auto', 'energia'].includes(r.tipo) },
  { id: 'rinnovo', sezione: 'durata', tipo: 'si_no', nonSo: true, etichetta: 'Alla scadenza si rinnova da solo?', aiuto: 'Cerca «tacito rinnovo» o «rinnovo automatico».', visibile: (r) => r.tipo && !['rc_auto', 'energia'].includes(r.tipo) },
  { id: 'data_scadenza', sezione: 'durata', tipo: 'data', etichetta: 'Quando scade il periodo in corso?', aiuto: 'Se non la sai, la calcoliamo dalla data di firma e dalla durata.', visibile: t('servizi', 'digitale', 'rc_auto', 'polizza') },
  { id: 'preavviso_giorni', sezione: 'durata', tipo: 'numero', etichetta: 'Quanti giorni prima della scadenza va mandata la disdetta?', aiuto: 'È scritto nel contratto: per esempio «almeno 30 giorni prima».', visibile: (r) => (abbonamento(r) || r.tipo === 'polizza') && r.rinnovo !== false },
  { id: 'avviso_rinnovo', sezione: 'durata', tipo: 'si_no', nonSo: true, etichetta: 'Ti hanno avvisato del rinnovo almeno 30 giorni prima della scadenza?', aiuto: 'Per iscritto, con SMS o email, indicando entro quando potevi disdire. Se non l\'hanno fatto, dopo il rinnovo puoi uscire senza spese.', visibile: (r) => abbonamento(r) && r.rinnovo === true },

  { id: 'canale', sezione: 'offerta', tipo: 'scelta', etichetta: 'Come l\'hai firmato?', visibile: (r) => r.tipo && !['rc_auto', 'polizza'].includes(r.tipo),
    opzioni: [
      ['online', 'Su un sito o un\'app'],
      ['telefono', 'Al telefono'],
      ['negozio', 'In negozio o nella sede del fornitore'],
      ['fuori', 'Fuori dal negozio: per strada, a uno stand, al lavoro, o a casa su mia richiesta'],
      ['visita', 'A casa mia, durante una visita che non avevo chiesto, o in una gita promozionale'],
    ] },
  { id: 'informato', sezione: 'offerta', tipo: 'si_no', nonSo: true, etichetta: 'Ti hanno informato che avevi 14 giorni per ripensarci?', aiuto: 'Di solito è nella conferma del contratto o nelle condizioni. Se l\'informazione manca, il periodo si allunga di 12 mesi.', visibile: (r) => ['online', 'telefono', 'fuori', 'visita'].includes(r.canale) && !['rc_auto', 'polizza'].includes(r.tipo) },
  { id: 'promo', sezione: 'offerta', tipo: 'si_no', etichetta: 'Era un\'offerta promozionale, con sconti per un periodo?', visibile: tlc },
  { id: 'rate', sezione: 'offerta', tipo: 'si_no', etichetta: 'Stai pagando a rate un telefono, un modem, un decoder o l\'attivazione?', visibile: tlc },
  { id: 'rate_scelta', sezione: 'offerta', tipo: 'scelta', etichetta: 'Come vuoi pagare le rate che restano?', aiuto: 'Decidi tu: l\'operatore non può imporre il pagamento in un\'unica soluzione.', opzioni: [['rate', 'Continuo a pagarle alle scadenze previste'], ['unica', 'Le pago tutte insieme']], visibile: (r) => tlc(r) && r.rate === true },

  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome (dell\'intestatario)' },
  { id: 'indirizzo', sezione: 'tuoi', tipo: 'testo', etichetta: 'Indirizzo di residenza' },
  { id: 'codice_cliente', sezione: 'tuoi', tipo: 'testo', etichetta: 'Codice cliente, numero di contratto o di polizza', aiuto: 'È in fattura, nella conferma o sul frontespizio.' },
  { id: 'numero_linea', sezione: 'tuoi', tipo: 'testo', etichetta: 'Numero di telefono della linea', visibile: t('telefonia') },
  { id: 'codice_fornitura', sezione: 'tuoi', tipo: 'testo', etichetta: 'Codice POD (luce) o PDR (gas)', aiuto: 'È nella prima pagina della bolletta.', visibile: t('energia') },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'Email o PEC per la conferma' },
  { id: 'fornitore_recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'PEC o indirizzo del fornitore', aiuto: 'Quello indicato nel contratto o nella carta dei servizi per le disdette.' },
  { id: 'comune_firma', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo in cui firmi', segnaposto: 'es. Torino' },
];

