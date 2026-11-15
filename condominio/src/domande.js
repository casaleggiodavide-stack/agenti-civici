// Le domande di «Condominio: i tuoi diritti». Compaiono solo quelle che servono
// per la situazione scelta. I dati personali (sezione «tuoi») restano nel browser.

import { CASI, TIPI } from './regole.js';

export const SEZIONI = [
  { id: 'cosa', titolo: 'La situazione' },
  { id: 'fatti', titolo: 'I fatti', aiuto: 'Le date le trovi nel verbale, nella convocazione o nelle ricevute delle PEC.' },
  { id: 'numeri', titolo: 'I numeri', aiuto: 'Millesimi e persone: li trovi nel verbale, nelle tabelle millesimali o nel rendiconto.' },
  { id: 'seguito', titolo: 'Cosa hai già fatto', aiuto: 'Serve per calcolare le scadenze del passo successivo.' },
  { id: 'tuoi', titolo: 'I dati per la lettera', aiuto: 'Restano su questo dispositivo e servono solo a riempire il documento.' },
];

const caso = (...c) => (r) => c.includes(r.caso);
const lettera = (r) => r.caso && r.caso !== 'delibera' && r.caso !== 'spese';

export const DOMANDE = [
  { id: 'caso', sezione: 'cosa', tipo: 'scelta', etichetta: 'Cosa ti serve?', opzioni: CASI },

  // 1. contestare una delibera
  {
    id: 'vizio', sezione: 'fatti', tipo: 'scelta', etichetta: 'Cosa non va nella delibera?', visibile: caso('impugnare'),
    opzioni: [
      ['convocazione', 'Non sono stato convocato, o l\'avviso è arrivato tardi o senza ordine del giorno'],
      ['maggioranza', 'È passata senza la maggioranza richiesta'],
      ['riparto_concreto', 'Mi hanno addebitato una spesa in modo sbagliato'],
      ['regolamento', 'Viola il regolamento di condominio o un\'altra legge'],
      ['criteri_spese', 'Cambia a maggioranza i criteri di ripartizione delle spese, anche per il futuro'],
      ['diritti_individuali', 'Toglie o limita i miei diritti sul mio appartamento o sulle parti comuni'],
      ['fuori_competenza', 'Decide su cose che non spettano all\'assemblea'],
      ['oggetto_illecito', 'Decide qualcosa di vietato o impossibile'],
    ],
  },
  { id: 'voto', sezione: 'fatti', tipo: 'scelta', etichetta: 'Come hai votato?', visibile: caso('impugnare'), opzioni: [['contrario', 'Ero presente e ho votato contro'], ['astenuto', 'Ero presente e mi sono astenuto'], ['assente', 'Ero assente'], ['favorevole', 'Ho votato a favore']] },
  { id: 'data_assemblea', sezione: 'fatti', tipo: 'data', etichetta: 'Data dell\'assemblea', visibile: caso('impugnare') },
  { id: 'data_comunicazione', sezione: 'fatti', tipo: 'data', etichetta: 'Quando ti è arrivato il verbale?', aiuto: 'La data di consegna della raccomandata o della PEC. Se non l\'hai ricevuto, lascia vuoto.', visibile: (r) => r.caso === 'impugnare' && r.voto === 'assente' },

  // 2. maggioranze
  { id: 'tipo', sezione: 'fatti', tipo: 'elenco', etichetta: 'Su cosa ha deciso l\'assemblea?', opzioni: TIPI.map((t) => [t.id, t.etichetta]), visibile: caso('delibera') },
  { id: 'convocazione', sezione: 'fatti', tipo: 'scelta', etichetta: 'In quale convocazione?', aiuto: 'Il verbale lo dice. Spesso la prima va deserta e l\'assemblea vera è la seconda.', opzioni: [['prima', 'Prima convocazione'], ['seconda', 'Seconda convocazione']], visibile: caso('delibera') },
  { id: 'data_prima', sezione: 'fatti', tipo: 'data', etichetta: 'Data fissata per la prima convocazione (facoltativa)', visibile: caso('delibera') },
  { id: 'data_seconda', sezione: 'fatti', tipo: 'data', etichetta: 'Data della seconda convocazione (facoltativa)', visibile: (r) => r.caso === 'delibera' && r.convocazione === 'seconda' },
  { id: 'data_avviso', sezione: 'fatti', tipo: 'data', etichetta: 'Quando ti è arrivato l\'avviso di convocazione? (facoltativa)', visibile: caso('delibera') },
  { id: 'partecipanti', sezione: 'numeri', tipo: 'numero', etichetta: 'Quanti sono i condòmini dell\'edificio?', aiuto: 'Le persone, non gli appartamenti. Più comproprietari di uno stesso appartamento hanno un solo rappresentante.', visibile: (r) => r.caso === 'delibera' || (r.caso === 'assemblea' && r.amministratore_presente === false) },
  { id: 'totale_millesimi', sezione: 'numeri', tipo: 'numero', passo: '0.01', etichetta: 'Millesimi totali dell\'edificio', aiuto: 'Di solito 1000.', segnaposto: '1000', visibile: caso('delibera', 'assemblea', 'spese', 'lavori_urgenti') },
  { id: 'presenti_teste', sezione: 'numeri', tipo: 'numero', etichetta: 'Condòmini presenti, anche per delega', visibile: caso('delibera') },
  { id: 'presenti_millesimi', sezione: 'numeri', tipo: 'numero', passo: '0.01', etichetta: 'Millesimi presenti', visibile: caso('delibera') },
  { id: 'favorevoli_teste', sezione: 'numeri', tipo: 'numero', etichetta: 'Condòmini che hanno votato a favore', visibile: caso('delibera') },
  { id: 'favorevoli_millesimi', sezione: 'numeri', tipo: 'numero', passo: '0.01', etichetta: 'Millesimi che hanno votato a favore', visibile: caso('delibera') },

  // 3. documenti e conti
  { id: 'documenti_cosa', sezione: 'fatti', tipo: 'scelta', etichetta: 'Cosa vuoi vedere?', visibile: caso('documenti'), opzioni: [['giustificativi', 'Fatture e documenti delle spese'], ['registri', 'I registri: verbali, anagrafe, contabilità'], ['conto', 'I movimenti del conto corrente del condominio'], ['attestazione', 'Lo stato dei miei pagamenti e le cause in corso'], ['rendiconto', 'Il rendiconto, che non è stato presentato']] },
  { id: 'anni', sezione: 'fatti', tipo: 'testo', etichetta: 'Di quali anni o gestioni?', segnaposto: 'es. gestione 2025', visibile: caso('documenti') },
  { id: 'data_chiusura_esercizio', sezione: 'fatti', tipo: 'data', etichetta: 'Quando si è chiuso l\'ultimo esercizio?', aiuto: 'Lo trovi nel rendiconto o nel preventivo, per esempio il 31 dicembre.', visibile: (r) => caso('documenti')(r) || (r.caso === 'morosita' && r.ruolo === 'altro') },
  { id: 'rendiconto_convocato', sezione: 'fatti', tipo: 'si_no', etichetta: 'L\'assemblea per il rendiconto è stata convocata?', visibile: (r) => r.caso === 'documenti' && r.documenti_cosa === 'rendiconto' },

  // 4. chiedere un'assemblea
  { id: 'amministratore_presente', sezione: 'fatti', tipo: 'si_no', etichetta: 'C\'è un amministratore?', visibile: caso('assemblea') },
  { id: 'motivo_assemblea', sezione: 'fatti', tipo: 'scelta', etichetta: 'Per cosa la chiedi?', visibile: caso('assemblea'), opzioni: [['generale', 'Un argomento qualsiasi'], ['innovazioni_agevolate', 'Lavori per sicurezza, risparmio energetico, rinnovabili, parcheggi, antenna o fibra'], ['barriere', 'Eliminare barriere architettoniche'], ['ricarica', 'Un punto di ricarica per l\'auto elettrica'], ['irregolarita', 'Revocare l\'amministratore per irregolarità fiscali o per il conto corrente']] },
  { id: 'richiedenti', sezione: 'numeri', tipo: 'numero', etichetta: 'Quanti condòmini firmano la richiesta?', visibile: (r) => r.caso === 'assemblea' && r.amministratore_presente !== false && ['generale', 'ricarica', undefined].includes(r.motivo_assemblea) },
  { id: 'millesimi_richiedenti', sezione: 'numeri', tipo: 'numero', passo: '0.01', etichetta: 'Quanti millesimi avete insieme?', visibile: (r) => r.caso === 'assemblea' && r.amministratore_presente !== false && ['generale', 'ricarica', undefined].includes(r.motivo_assemblea) },
  { id: 'ordine_giorno', sezione: 'fatti', tipo: 'area', etichetta: 'Cosa volete mettere all\'ordine del giorno?', segnaposto: 'es. 1. Rifacimento della facciata: preventivi; 2. Varie', visibile: caso('assemblea') },

  // 5. chi paga
  { id: 'voce_spesa', sezione: 'fatti', tipo: 'scelta', etichetta: 'Che spesa è?', visibile: caso('spese'), opzioni: [['generali', 'Parti comuni di tutto l\'edificio: tetto, facciata, portone, pulizie'], ['gruppo', 'Una scala, un cortile o un impianto che serve solo una parte dell\'edificio'], ['uso', 'Un servizio usato in misura diversa: acqua, riscaldamento'], ['scale_ascensore', 'Scale o ascensore'], ['lastrico', 'Lastrico solare o terrazza di copertura'], ['solaio', 'Solaio o soffitto tra due appartamenti'], ['balcone', 'Balconi'], ['riscaldamento', 'Voglio staccarmi dal riscaldamento centralizzato']] },
  { id: 'importo', sezione: 'numeri', tipo: 'euro', etichetta: 'Importo totale della spesa', visibile: caso('spese', 'lavori_urgenti') },
  { id: 'millesimi', sezione: 'numeri', tipo: 'numero', passo: '0.01', etichetta: 'I tuoi millesimi di proprietà', visibile: (r) => (r.caso === 'spese' && ['generali', 'gruppo', 'lastrico'].includes(r.voce_spesa)) || r.caso === 'lavori_urgenti' },
  { id: 'millesimi_serviti', sezione: 'numeri', tipo: 'numero', passo: '0.01', etichetta: 'Millesimi, insieme, delle unità servite', aiuto: 'Per il lastrico: se copre tutto l\'edificio lascia vuoto.', visibile: (r) => r.caso === 'spese' && ['gruppo', 'lastrico'].includes(r.voce_spesa) },
  { id: 'lastrico_uso', sezione: 'fatti', tipo: 'scelta', etichetta: 'Chi usa il lastrico?', visibile: (r) => r.caso === 'spese' && r.voce_spesa === 'lastrico', opzioni: [['mio', 'Lo uso solo io (o con pochi altri)'], ['altro', 'Lo usa in esclusiva un altro condòmino'], ['comune', 'È di uso comune']] },
  { id: 'utenti_esclusivi', sezione: 'numeri', tipo: 'numero', etichetta: 'Quanti hanno l\'uso esclusivo, te compreso?', visibile: (r) => r.caso === 'spese' && r.lastrico_uso === 'mio' },
  { id: 'millesimi_scale', sezione: 'numeri', tipo: 'numero', passo: '0.01', etichetta: 'I tuoi millesimi nella tabella scale o ascensore', visibile: (r) => r.caso === 'spese' && r.voce_spesa === 'scale_ascensore' },
  { id: 'totale_scale', sezione: 'numeri', tipo: 'numero', passo: '0.01', etichetta: 'Totale della tabella scale o ascensore', segnaposto: '1000', visibile: (r) => r.caso === 'spese' && r.voce_spesa === 'scale_ascensore' },
  { id: 'piano_solaio', sezione: 'fatti', tipo: 'scelta', etichetta: 'Tu stai…', visibile: (r) => r.caso === 'spese' && r.voce_spesa === 'solaio', opzioni: [['sopra', 'Sopra il solaio'], ['sotto', 'Sotto il solaio']] },

  // 6. morosità
  { id: 'ruolo', sezione: 'fatti', tipo: 'scelta', etichetta: 'Chi è in ritardo?', visibile: caso('morosita'), opzioni: [['io', 'Io'], ['altro', 'Un altro condòmino']] },
  { id: 'data_scadenza_rata', sezione: 'fatti', tipo: 'data', etichetta: 'Scadenza della prima rata non pagata', visibile: caso('morosita') },
  { id: 'debito', sezione: 'numeri', tipo: 'euro', etichetta: 'Quanto manca da pagare?', visibile: (r) => r.caso === 'morosita' && r.ruolo === 'io' },
  { id: 'sospeso', sezione: 'fatti', tipo: 'si_no', etichetta: 'Ti hanno già sospeso un servizio?', visibile: (r) => r.caso === 'morosita' && r.ruolo === 'io' },
  { id: 'data_sospensione', sezione: 'fatti', tipo: 'data', etichetta: 'Da quando?', visibile: (r) => r.caso === 'morosita' && r.sospeso === true },

  // 7. amministratore
  { id: 'problema_amministratore', sezione: 'fatti', tipo: 'scelta', etichetta: 'Cosa non va?', visibile: caso('amministratore'), opzioni: [['rendiconto', 'Non presenta il rendiconto o non convoca l\'assemblea'], ['registri', 'Non mostra registri e documenti o non dà l\'attestazione dei pagamenti'], ['conto', 'Non c\'è un conto corrente del condominio o non viene usato'], ['fiscale', 'Irregolarità fiscali (ritenute, dichiarazioni)'], ['confusione', 'Mescola i soldi del condominio con i suoi'], ['delibere', 'Non esegue le delibere o le sentenze'], ['riscossione', 'Non segue le cause contro i morosi'], ['citazione', 'Non ci ha avvisato di una causa contro il condominio'], ['dati', 'Non ha comunicato i suoi dati, dove sono i registri, gli orari'], ['fiducia', 'Nessuna irregolarità precisa: non ci fidiamo più']] },
  { id: 'assemblea_esito', sezione: 'seguito', tipo: 'scelta', etichetta: 'Avete già chiesto un\'assemblea per la revoca?', visibile: caso('amministratore'), opzioni: [['no', 'No'], ['in_attesa', 'Sì, aspettiamo'], ['non_revocato', 'Sì, ma non lo hanno revocato']] },
  { id: 'fatti_amministratore', sezione: 'fatti', tipo: 'area', etichetta: 'Descrivi i fatti, con le date', segnaposto: 'es. il rendiconto 2025 non è stato presentato; abbiamo chiesto l\'assemblea il 3 marzo…', visibile: caso('amministratore') },

  // 8. lavori urgenti
  { id: 'lavoro', sezione: 'fatti', tipo: 'area', etichetta: 'Cosa è successo e cosa hai fatto riparare?', segnaposto: 'es. la notte del 2 novembre si è rotto il tubo comune in cantina; ho chiamato l\'idraulico', visibile: caso('lavori_urgenti') },
  { id: 'data_lavori', sezione: 'fatti', tipo: 'data', etichetta: 'Quando?', visibile: caso('lavori_urgenti') },
  { id: 'urgente', sezione: 'fatti', tipo: 'scelta', etichetta: 'Si poteva aspettare l\'amministratore o l\'assemblea?', visibile: caso('lavori_urgenti'), opzioni: [['si', 'No, era urgente: c\'era un danno in corso o un pericolo'], ['no', 'Sì, si poteva aspettare'], ['non_so', 'Non lo so']] },
  { id: 'autorizzato', sezione: 'fatti', tipo: 'si_no', etichetta: 'L\'amministratore o l\'assemblea ti avevano autorizzato?', visibile: caso('lavori_urgenti') },
  { id: 'avvisato', sezione: 'fatti', tipo: 'si_no', etichetta: 'Hai avvisato l\'amministratore?', visibile: caso('lavori_urgenti') },

  // seguito comune
  { id: 'data_richiesta', sezione: 'seguito', tipo: 'data', etichetta: 'Quando è arrivata la tua richiesta all\'amministratore?', aiuto: 'La data di consegna della PEC o della raccomandata.', visibile: caso('documenti', 'assemblea', 'amministratore') },
  { id: 'risposta', sezione: 'seguito', tipo: 'scelta', etichetta: 'Ti ha risposto?', visibile: (r) => r.caso === 'documenti' && Boolean(r.data_richiesta), opzioni: [['no', 'No'], ['parziale', 'Solo in parte'], ['si', 'Sì, ho i documenti']] },
  { id: 'convocata', sezione: 'seguito', tipo: 'si_no', etichetta: 'L\'amministratore ha convocato l\'assemblea?', visibile: (r) => r.caso === 'assemblea' && Boolean(r.data_richiesta) },
  { id: 'mediazione', sezione: 'seguito', tipo: 'scelta', etichetta: 'La mediazione', visibile: caso('impugnare'), opzioni: [['no', 'Non l\'ho ancora chiesta'], ['depositata', 'L\'ho chiesta, è in corso'], ['senza_accordo', 'È finita senza accordo'], ['accordo', 'È finita con un accordo']] },
  { id: 'data_verbale_mediazione', sezione: 'seguito', tipo: 'data', etichetta: 'Data di deposito del verbale della mediazione', visibile: (r) => r.caso === 'impugnare' && r.mediazione === 'senza_accordo' },

  // dati per la lettera
  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome', visibile: lettera },
  { id: 'indirizzo', sezione: 'tuoi', tipo: 'testo', etichetta: 'Indirizzo del condominio', segnaposto: 'es. via Roma 10, Bari', visibile: lettera },
  { id: 'interno', sezione: 'tuoi', tipo: 'testo', etichetta: 'Scala e interno', segnaposto: 'es. scala B, interno 7', visibile: lettera },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'PEC o email dove ricevere la risposta', visibile: lettera },
  { id: 'amministratore', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome dell\'amministratore', visibile: lettera },
  { id: 'pec_amministratore', sezione: 'tuoi', tipo: 'testo', etichetta: 'PEC o email dell\'amministratore', visibile: lettera },
  { id: 'comune_firma', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo in cui firmi', segnaposto: 'es. Bari', visibile: lettera },
];
