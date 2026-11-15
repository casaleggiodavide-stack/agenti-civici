// Le domande di «Affitto: i tuoi diritti». Le risposte restano nel browser.

export const SEZIONI = [
  { id: 'chi', titolo: 'Chi sei e cosa succede' },
  { id: 'contratto', titolo: 'Il contratto', aiuto: 'Le risposte sono nel contratto: tipo, data di inizio, canone, deposito.' },
  { id: 'caso', titolo: 'Il tuo caso' },
  { id: 'tuoi', titolo: 'I dati per la lettera', aiuto: 'Restano su questo dispositivo e servono solo a riempire la lettera.' },
];

const sit = (...t) => (r) => t.includes(r.situazione);
const inq = (r) => r.ruolo !== 'proprietario';
const breve = (r) => ['transitorio', 'studenti'].includes(r.tipo_contratto);

export const DOMANDE = [
  { id: 'ruolo', sezione: 'chi', tipo: 'scelta', etichetta: 'Sei', opzioni: [['inquilino', 'Inquilino: sono in affitto'], ['proprietario', 'Proprietario: affitto una casa']] },
  {
    id: 'situazione', sezione: 'chi', tipo: 'scelta', etichetta: 'Che cosa succede?',
    opzioni: [
      ['recesso', 'L\'inquilino vuole andarsene prima della scadenza'],
      ['disdetta', 'Il proprietario vuole riavere la casa o non rinnovare'],
      ['deposito', 'Il deposito cauzionale va restituito'],
      ['aumento', 'Aumento del canone (aggiornamento ISTAT)'],
      ['spese', 'Spese condominiali: chi paga cosa'],
      ['registrazione', 'Contratto non registrato o canone più basso sulla carta'],
      ['morosita', 'Affitto non pagato, sfratto per morosità'],
      ['riparazioni', 'Guasti e riparazioni'],
    ],
  },

  {
    id: 'tipo_contratto', sezione: 'contratto', tipo: 'scelta', etichetta: 'Che contratto è?',
    aiuto: 'Il tipo è scritto nel titolo o nel primo articolo. «Concordato» o «agevolato» vuol dire 3+2.',
    opzioni: [['libero', '4+4 a canone libero'], ['concordato', '3+2 a canone concordato (agevolato)'], ['transitorio', 'Transitorio (fino a 18 mesi)'], ['studenti', 'Per studenti universitari']],
  },
  { id: 'inizio', sezione: 'contratto', tipo: 'data', etichetta: 'Data di inizio del contratto', aiuto: 'La data da cui decorre l\'affitto, scritta nel contratto.' },
  { id: 'durata_anni', sezione: 'contratto', tipo: 'numero', etichetta: 'Durata del primo periodo, in anni, se è diversa', aiuto: 'Lascia vuoto se è 4 anni (4+4) o 3 anni (3+2).', visibile: (r) => ['libero', 'concordato'].includes(r.tipo_contratto) },
  { id: 'durata_mesi', sezione: 'contratto', tipo: 'numero', etichetta: 'Durata in mesi', visibile: breve },
  {
    id: 'registrato', sezione: 'contratto', tipo: 'scelta', etichetta: 'Il contratto è registrato all\'Agenzia delle Entrate?',
    opzioni: [['si', 'Sì'], ['no', 'No'], ['non_so', 'Non lo so'], ['a_voce', 'Non c\'è un contratto scritto']],
  },
  { id: 'cedolare', sezione: 'contratto', tipo: 'si_no', nonSo: true, etichetta: 'Il proprietario ha scelto la cedolare secca?', aiuto: 'Deve averlo comunicato all\'inquilino con una raccomandata. Cambia le regole sull\'aumento del canone.' },
  { id: 'canone', sezione: 'contratto', tipo: 'euro', etichetta: 'Canone mensile (quello che si paga davvero)', segnaposto: 'es. 650,00' },
  { id: 'deposito', sezione: 'contratto', tipo: 'euro', etichetta: 'Deposito cauzionale versato', segnaposto: 'es. 1.300,00' },
  { id: 'spese', sezione: 'contratto', tipo: 'scelta', etichetta: 'Le spese condominiali', opzioni: [['a_parte', 'Si pagano a parte (acconti o conguaglio)'], ['comprese', 'Sono comprese nel canone'], ['non_so', 'Non lo so']] },

  // 1. recesso
  {
    id: 'motivo_recesso', sezione: 'caso', tipo: 'scelta', etichetta: 'Per quale motivo l\'inquilino vuole andarsene?', visibile: sit('recesso'),
    opzioni: [['gravi', 'Gravi motivi sopravvenuti (es. trasferimento di lavoro, salute, famiglia)'], ['clausola', 'Il contratto permette di andarsene con preavviso'], ['nessuno', 'Nessuno di questi: voglio solo cambiare casa']],
  },
  { id: 'clausola_recesso', sezione: 'caso', tipo: 'si_no', nonSo: true, etichetta: 'Il contratto ha una clausola di recesso per l\'inquilino?', aiuto: 'Cerca «recesso» nel contratto.', visibile: sit('recesso') },
  { id: 'preavviso_mesi', sezione: 'caso', tipo: 'numero', etichetta: 'Preavviso scritto nel contratto, in mesi', visibile: (r) => r.situazione === 'recesso' && (r.clausola_recesso === true || breve(r)) },
  { id: 'data_comunicazione', sezione: 'caso', tipo: 'data', etichetta: 'Quando arriva (o è arrivata) la lettera al proprietario?', aiuto: 'Se non l\'hai ancora mandata, lascia vuoto: contiamo da oggi.', visibile: sit('recesso') },
  { id: 'data_uscita', sezione: 'caso', tipo: 'data', etichetta: 'In che data vorresti lasciare la casa?', visibile: (r) => r.situazione === 'recesso' && inq(r) },
  { id: 'motivi_testo', sezione: 'caso', tipo: 'area', etichetta: 'I gravi motivi, in breve', segnaposto: 'es. trasferimento della sede di lavoro a Milano dal 1° marzo 2027', visibile: (r) => r.situazione === 'recesso' && r.motivo_recesso === 'gravi' },

  // 2. disdetta
  { id: 'data_disdetta', sezione: 'caso', tipo: 'data', etichetta: 'Quando l\'inquilino ha ricevuto la disdetta?', aiuto: 'La data della ricevuta della raccomandata o della PEC.', visibile: (r) => r.situazione === 'disdetta' && inq(r) },
  {
    id: 'motivo_disdetta', sezione: 'caso', tipo: 'elenco', etichetta: 'Il motivo della disdetta', visibile: sit('disdetta'),
    opzioni: [
      ['uso_proprio', 'Uso per sé o per i familiari (fino al secondo grado)'], ['vendita', 'Vendita (e il proprietario non ha altre case)'], ['ristrutturazione', 'Ristrutturazione integrale o demolizione'],
      ['edificio_danneggiato', 'Edificio gravemente danneggiato'], ['altro_alloggio', 'L\'inquilino ha un altro alloggio libero nello stesso Comune'], ['non_occupa', 'L\'inquilino non abita la casa'],
      ['ente', 'Proprietario società o ente, con altro alloggio offerto'], ['nessuno', 'Nessun motivo'], ['altro', 'Un altro motivo'],
    ],
  },

  // 3. deposito
  { id: 'data_deposito', sezione: 'caso', tipo: 'data', etichetta: 'Quando è stato versato il deposito?', aiuto: 'Se lasci vuoto usiamo la data di inizio del contratto.', visibile: sit('deposito') },
  { id: 'data_riconsegna', sezione: 'caso', tipo: 'data', etichetta: 'Data di riconsegna delle chiavi', aiuto: 'Se lasci vuoto contiamo gli interessi fino a oggi.', visibile: sit('deposito') },
  { id: 'interessi_pagati_fino', sezione: 'caso', tipo: 'data', etichetta: 'Gli interessi sono già stati pagati fino a una certa data?', aiuto: 'Lascia vuoto se non sono mai stati pagati.', visibile: sit('deposito') },
  { id: 'trattenuta', sezione: 'caso', tipo: 'euro', etichetta: 'Somma trattenuta dal proprietario, se c\'è', visibile: sit('deposito') },
  { id: 'motivo_trattenuta', sezione: 'caso', tipo: 'area', etichetta: 'Per cosa è stata trattenuta?', visibile: (r) => r.situazione === 'deposito' && r.trattenuta > 0 },

  // 4. aumento
  { id: 'clausola_aggiornamento', sezione: 'caso', tipo: 'si_no', nonSo: true, etichetta: 'Il contratto prevede l\'aggiornamento ISTAT?', visibile: (r) => r.situazione === 'aumento' && r.cedolare !== true },
  { id: 'quota_istat', sezione: 'caso', tipo: 'numero', passo: '1', etichetta: 'In che percentuale della variazione ISTAT? (es. 75 o 100)', visibile: (r) => r.situazione === 'aumento' && r.cedolare !== true && r.clausola_aggiornamento === true },
  { id: 'variazione_istat', sezione: 'caso', tipo: 'numero', passo: '0.1', etichetta: 'Variazione ISTAT FOI dei 12 mesi, in %', aiuto: 'La trovi sul servizio Rivaluta dell\'ISTAT (rivaluta.istat.it): mese di aggiornamento e stesso mese dell\'anno prima.', visibile: (r) => r.situazione === 'aumento' && r.cedolare !== true && r.clausola_aggiornamento === true },
  { id: 'canone_richiesto', sezione: 'caso', tipo: 'euro', etichetta: 'Nuovo canone richiesto dal proprietario, se c\'è', visibile: (r) => r.situazione === 'aumento' && inq(r) },

  // 5. spese
  { id: 'importo_spese', sezione: 'caso', tipo: 'euro', etichetta: 'Importo delle spese richieste', visibile: sit('spese') },
  { id: 'data_richiesta_spese', sezione: 'caso', tipo: 'data', etichetta: 'Data della richiesta di pagamento', visibile: sit('spese') },
  { id: 'documenti_spese', sezione: 'caso', tipo: 'si_no', etichetta: 'Hai ricevuto il dettaglio delle spese con i criteri di ripartizione?', visibile: (r) => r.situazione === 'spese' && inq(r) },

  // 6. registrazione
  { id: 'canone_dichiarato', sezione: 'caso', tipo: 'euro', etichetta: 'Canone scritto nel contratto registrato', aiuto: 'Se è uguale a quello pagato davvero, lascia vuoto.', visibile: (r) => r.situazione === 'registrazione' && r.registrato === 'si' },

  // 7. morosità
  { id: 'data_prima_rata', sezione: 'caso', tipo: 'data', etichetta: 'Scadenza della prima rata non pagata', visibile: sit('morosita') },
  { id: 'rate_non_pagate', sezione: 'caso', tipo: 'numero', etichetta: 'Quante mensilità non sono state pagate finora?', visibile: sit('morosita') },
  { id: 'data_notifica', sezione: 'caso', tipo: 'data', etichetta: 'È stato notificato l\'atto di sfratto? In che data?', aiuto: 'Lascia vuoto se non è ancora arrivato.', visibile: sit('morosita') },
  { id: 'data_udienza', sezione: 'caso', tipo: 'data', etichetta: 'Data dell\'udienza indicata nell\'atto', visibile: (r) => r.situazione === 'morosita' && Boolean(r.data_notifica) },
  { id: 'sanatorie', sezione: 'caso', tipo: 'numero', etichetta: 'Quante volte negli ultimi quattro anni la morosità è stata sanata in tribunale?', aiuto: 'Di solito zero.', visibile: (r) => r.situazione === 'morosita' && inq(r) },
  { id: 'difficolta', sezione: 'caso', tipo: 'si_no', etichetta: 'Il ritardo dipende da disoccupazione, malattia o gravi difficoltà arrivate dopo la firma?', visibile: (r) => r.situazione === 'morosita' && inq(r) },

  // 8. riparazioni
  {
    id: 'tipo_guasto', sezione: 'caso', tipo: 'scelta', etichetta: 'Che tipo di guasto è?', visibile: sit('riparazioni'),
    opzioni: [['uso', 'Usura da uso quotidiano (piccola manutenzione)'], ['vecchiaia', 'Vecchiaia dell\'impianto o un evento (infiltrazione, rottura non causata da chi ci abita)'], ['urgente', 'Urgente: non si può aspettare (perdita d\'acqua, niente riscaldamento in inverno)']],
  },
  { id: 'descrizione_guasto', sezione: 'caso', tipo: 'area', etichetta: 'Descrivi il guasto', segnaposto: 'es. dal 3 novembre la caldaia si blocca e non c\'è acqua calda', visibile: sit('riparazioni') },
  { id: 'giorni_lavori', sezione: 'caso', tipo: 'numero', etichetta: 'Quanti giorni durano (o sono durati) i lavori?', visibile: sit('riparazioni') },
  { id: 'inabitabile', sezione: 'caso', tipo: 'si_no', etichetta: 'Durante i lavori la casa è inabitabile?', visibile: (r) => r.situazione === 'riparazioni' && inq(r) },

  // dati per la lettera
  { id: 'nome', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome' },
  { id: 'controparte', sezione: 'tuoi', tipo: 'testo', etichetta: 'Nome e cognome dell\'altra parte', segnaposto: 'il proprietario o l\'inquilino' },
  { id: 'indirizzo', sezione: 'tuoi', tipo: 'testo', etichetta: 'Indirizzo della casa in affitto' },
  { id: 'recapito', sezione: 'tuoi', tipo: 'testo', etichetta: 'Il tuo recapito (indirizzo, email o PEC)' },
  { id: 'comune_firma', sezione: 'tuoi', tipo: 'testo', etichetta: 'Luogo in cui firmi', segnaposto: 'es. Torino' },
];
