// Le domande di «Mi spetta» e il calcolo dei dati derivati.
// Ogni domanda è facoltativa: una risposta mancante diventa null e il
// motore la segnala come «dato mancante» invece di indovinarla.

// Regioni e Province autonome: le misure regionali si valutano solo per la propria.
export const REGIONI = [
  ['abruzzo', 'Abruzzo'], ['basilicata', 'Basilicata'], ['calabria', 'Calabria'], ['campania', 'Campania'],
  ['emilia_romagna', 'Emilia-Romagna'], ['friuli_venezia_giulia', 'Friuli Venezia Giulia'], ['lazio', 'Lazio'],
  ['liguria', 'Liguria'], ['lombardia', 'Lombardia'], ['marche', 'Marche'], ['molise', 'Molise'],
  ['bolzano', 'Provincia autonoma di Bolzano'], ['trento', 'Provincia autonoma di Trento'], ['piemonte', 'Piemonte'],
  ['puglia', 'Puglia'], ['sardegna', 'Sardegna'], ['sicilia', 'Sicilia'], ['toscana', 'Toscana'], ['umbria', 'Umbria'],
  ['valle_d_aosta', 'Valle d\'Aosta'], ['veneto', 'Veneto'],
];
export const NOME_REGIONE = Object.fromEntries(REGIONI);

export const SEZIONI = [
  { id: 'tu', titolo: 'Chi sei' },
  { id: 'famiglia', titolo: 'La tua famiglia' },
  { id: 'soldi', titolo: 'ISEE e redditi' },
  { id: 'lavoro', titolo: 'Lavoro e pensione' },
  { id: 'casa', titolo: 'Casa e bollette' },
];

/**
 * Tipi: numero, euro, si_no, scelta, figli.
 * `visibile(r)` decide se mostrare la domanda in base alle altre risposte.
 */
export const DOMANDE = [
  { id: 'eta', sezione: 'tu', tipo: 'numero', etichetta: 'Quanti anni hai?', min: 14, max: 110 },
  {
    id: 'cittadinanza', sezione: 'tu', tipo: 'scelta', etichetta: 'Cittadinanza',
    opzioni: [
      ['italiana', 'Italiana'],
      ['ue', 'Di un altro Paese dell\'Unione europea'],
      ['extra_ue_lungo', 'Extra UE con permesso di soggiorno UE di lungo periodo, protezione internazionale o carta di soggiorno'],
      ['extra_ue_altro', 'Extra UE con un altro permesso di soggiorno'],
    ],
  },
  {
    id: 'regione', sezione: 'tu', tipo: 'scelta', etichetta: 'In quale Regione hai la residenza?',
    aiuto: 'Serve per le misure regionali. Se non la indichi vedi solo quelle nazionali.',
    opzioni: REGIONI,
  },
  {
    id: 'anni_residenza_regione', sezione: 'tu', tipo: 'numero', etichetta: 'Da quanti anni risiedi in questa Regione?',
    visibile: (r) => Boolean(r.regione), min: 0, max: 110,
  },
  {
    id: 'icef', sezione: 'soldi', tipo: 'numero', etichetta: 'Il tuo indicatore ICEF (Provincia di Trento)',
    aiuto: 'Un numero tra 0 e 1, per esempio 0,25. Lo trovi nell\'attestazione ICEF del CAF o del patronato.',
    visibile: (r) => r.regione === 'trento', min: 0, max: 1, passo: 0.01,
  },
  {
    id: 'anni_residenza', sezione: 'tu', tipo: 'numero', etichetta: 'Da quanti anni vivi in Italia senza interruzioni?',
    aiuto: 'Conta gli anni di residenza anagrafica. Se ci sei sempre stato, scrivi la tua età.', min: 0, max: 110,
  },

  { id: 'coniuge', sezione: 'famiglia', tipo: 'si_no', etichetta: 'Vivi con un coniuge, un partner unito civilmente o un convivente nello stesso stato di famiglia?' },
  { id: 'coniuge_eta', sezione: 'famiglia', tipo: 'numero', etichetta: 'Quanti anni ha?', visibile: (r) => r.coniuge === true, min: 14, max: 110 },
  { id: 'figli', sezione: 'famiglia', tipo: 'figli', etichetta: 'Figli nel tuo nucleo familiare', aiuto: 'Aggiungi un figlio per riga con mese e anno di nascita.' },
  {
    id: 'sei_madre', sezione: 'famiglia', tipo: 'si_no', etichetta: 'Sei la madre dei figli che hai indicato?',
    aiuto: 'Serve per le prestazioni riservate alle madri, come il bonus mamme lavoratrici.',
    visibile: (r) => Array.isArray(r.figli) && r.figli.length > 0,
  },
  { id: 'altri_adulti', sezione: 'famiglia', tipo: 'numero', etichetta: 'Altre persone nel tuo stato di famiglia, oltre a te, partner e figli', min: 0, max: 15 },
  { id: 'disabile_nucleo', sezione: 'famiglia', tipo: 'si_no', etichetta: 'Nel nucleo c\'è una persona con disabilità riconosciuta (anche tu)?' },
  { id: 'over60_altri', sezione: 'famiglia', tipo: 'si_no', etichetta: 'Tra le altre persone del nucleo c\'è qualcuno con 60 anni o più?', visibile: (r) => (r.altri_adulti || 0) > 0 },

  {
    id: 'isee', sezione: 'soldi', tipo: 'euro', etichetta: 'Il tuo ISEE in corso di validità',
    aiuto: 'Lo trovi nell\'attestazione ISEE. Se non lo hai, lascia vuoto: ti diciamo dove serve e come ottenerlo gratis.',
  },
  {
    id: 'reddito_personale', sezione: 'soldi', tipo: 'euro', etichetta: 'Il tuo reddito annuo lordo',
    aiuto: 'Il reddito complessivo dell\'ultima dichiarazione o della Certificazione Unica. Scrivi 0 se non hai redditi.',
  },
  { id: 'reddito_coniuge', sezione: 'soldi', tipo: 'euro', etichetta: 'Il reddito annuo lordo del tuo partner', visibile: (r) => r.coniuge === true },
  {
    id: 'reddito_familiare', sezione: 'soldi', tipo: 'euro', etichetta: 'Il reddito annuo lordo di tutta la famiglia',
    aiuto: 'La somma dei redditi di tutti i componenti. Serve per l\'esenzione dai ticket sanitari.',
  },
  {
    id: 'patrimonio_mobiliare', sezione: 'soldi', tipo: 'euro', etichetta: 'Risparmi della famiglia: conti, libretti, titoli',
    aiuto: 'Il patrimonio mobiliare indicato nella DSU. Serve per l\'Assegno di inclusione.',
  },
  {
    id: 'altri_immobili', sezione: 'soldi', tipo: 'euro', etichetta: 'Valore di case o terreni diversi dalla casa in cui vivi',
    aiuto: 'Il valore ai fini IMU indicato nella DSU. Scrivi 0 se non ne hai.',
  },

  {
    id: 'lavoro', sezione: 'lavoro', tipo: 'scelta', etichetta: 'Che lavoro fai oggi?',
    opzioni: [
      ['dipendente_indeterminato', 'Dipendente a tempo indeterminato'],
      ['dipendente_determinato', 'Dipendente a tempo determinato'],
      ['autonomo', 'Lavoratore autonomo o partita IVA'],
      ['disoccupato', 'Senza lavoro'],
      ['pensionato', 'In pensione'],
      ['studente', 'Studente'],
      ['casa', 'Mi occupo della casa o della famiglia'],
      ['altro', 'Altro'],
    ],
  },
  {
    id: 'perso_lavoro', sezione: 'lavoro', tipo: 'si_no', etichetta: 'Hai perso il lavoro negli ultimi 68 giorni non per tua scelta?',
    aiuto: 'Licenziamento, fine del contratto a termine, dimissioni per giusta causa.', visibile: (r) => r.lavoro === 'disoccupato',
  },
  {
    id: 'contributi_13_settimane', sezione: 'lavoro', tipo: 'si_no', etichetta: 'Hai almeno 13 settimane di contributi negli ultimi 4 anni?',
    aiuto: 'Circa tre mesi di lavoro dipendente con contributi versati.', visibile: (r) => r.perso_lavoro === true,
  },
  { id: 'anni_contributi', sezione: 'lavoro', tipo: 'numero', etichetta: 'Quanti anni di contributi hai?', visibile: (r) => r.lavoro === 'pensionato', min: 0, max: 60 },
  {
    id: 'pensione_tipo', sezione: 'lavoro', tipo: 'scelta', etichetta: 'Che pensione ricevi?', visibile: (r) => r.lavoro === 'pensionato',
    opzioni: [
      ['contributiva', 'Pensione da lavoro (vecchiaia, anticipata, superstiti, invalidità)'],
      ['minima', 'Pensione integrata al trattamento minimo'],
      ['sociale', 'Assegno sociale o pensione sociale'],
    ],
  },

  {
    id: 'casa', sezione: 'casa', tipo: 'scelta', etichetta: 'La casa in cui vivi è',
    opzioni: [['affitto', 'In affitto'], ['proprieta', 'Di proprietà'], ['altro', 'In comodato o altro']],
  },
  { id: 'canone_annuo', sezione: 'casa', tipo: 'euro', etichetta: 'Quanto paghi di affitto in un anno?', visibile: (r) => r.casa === 'affitto' },
  { id: 'contratto_registrato', sezione: 'casa', tipo: 'si_no', etichetta: 'Il contratto d\'affitto è registrato?', visibile: (r) => r.casa === 'affitto' },
  {
    id: 'utenze_intestate', sezione: 'casa', tipo: 'si_no', etichetta: 'Le bollette di luce, gas o acqua sono intestate a qualcuno della famiglia?',
    aiuto: 'Anche un condominio con riscaldamento centralizzato conta, per il gas e l\'acqua.',
  },
];

export const CONDIZIONI_18_21 = [
  ['studia', 'Studia (scuola, università, formazione)'],
  ['tirocinio', 'Fa un tirocinio o lavora con reddito sotto 8.000 € l\'anno'],
  ['disoccupato_cpi', 'È disoccupato e iscritto al Centro per l\'impiego'],
  ['servizio_civile', 'Fa il servizio civile universale'],
  ['nessuna', 'Nessuna di queste'],
];

function num(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function bool(v) {
  if (v === true || v === false) return v;
  if (v === 'si' || v === 'true') return true;
  if (v === 'no' || v === 'false') return false;
  return null;
}

/** Età in anni e mesi compiuti a una data, da 'AAAA-MM' o 'AAAA-MM-GG'. */
export function etaDa(nascita, oggi) {
  if (!nascita) return null;
  const [a, m, g] = String(nascita).split('-').map(Number);
  if (!a || !m) return null;
  const giorno = g || 1;
  let mesi = (oggi.getFullYear() - a) * 12 + (oggi.getMonth() + 1 - m);
  if (oggi.getDate() < giorno) mesi -= 1;
  if (mesi < 0) return null;
  return { anni: Math.floor(mesi / 12), mesi, anno: a, mese: m };
}

/** Dalle risposte grezze ai dati che usano le regole. */
export function arricchisci(r, oggi) {
  const regione = REGIONI.some(([id]) => id === r.regione) ? r.regione : null;
  const figli = (Array.isArray(r.figli) ? r.figli : []).map((f) => {
    const e = etaDa(f.nascita, oggi);
    return {
      nascita: f.nascita || null,
      anni: e ? e.anni : null,
      mesi: e ? e.mesi : null,
      annoNascita: e ? e.anno : null,
      disabile: bool(f.disabile) === true,
      condizione: f.condizione || null,
    };
  });

  const coniuge = bool(r.coniuge);
  const eta = num(r.eta);
  const coniugeEta = coniuge ? num(r.coniuge_eta) : null;
  const altriAdulti = num(r.altri_adulti) ?? 0;
  const redditoPersonale = num(r.reddito_personale);
  const redditoConiuge = coniuge === false ? 0 : num(r.reddito_coniuge);
  const anniResidenza = num(r.anni_residenza);

  const over60 = (() => {
    if (eta !== null && eta >= 60) return true;
    if (coniugeEta !== null && coniugeEta >= 60) return true;
    if (bool(r.over60_altri) === true) return true;
    const sconosciuto = eta === null || (coniuge === true && coniugeEta === null) || (altriAdulti > 0 && bool(r.over60_altri) === null);
    return sconosciuto ? null : false;
  })();

  return {
    eta,
    cittadinanza: r.cittadinanza || null,
    anniResidenza,
    regione,
    anniResidenzaRegione: regione ? num(r.anni_residenza_regione) : null,
    icef: regione === 'trento' ? num(r.icef) : null,
    coniuge,
    coniugeEta,
    seiMadre: bool(r.sei_madre),
    altriAdulti,
    disabileNucleo: bool(r.disabile_nucleo),
    over60,
    figli,
    figliRisposta: Array.isArray(r.figli),
    nFigli: figli.length,
    minori: figli.filter((f) => f.anni !== null && f.anni < 18),
    figli18_21: figli.filter((f) => f.anni !== null && f.anni >= 18 && f.anni < 21),
    componenti: 1 + (coniuge ? 1 : 0) + figli.length + altriAdulti,
    isee: num(r.isee),
    redditoPersonale,
    redditoConiuge,
    redditoCoppia: redditoPersonale === null || redditoConiuge === null ? null : redditoPersonale + redditoConiuge,
    redditoFamiliare: num(r.reddito_familiare),
    patrimonioMobiliare: num(r.patrimonio_mobiliare),
    altriImmobili: num(r.altri_immobili),
    lavoro: r.lavoro || null,
    persoLavoro: bool(r.perso_lavoro),
    contributi13: bool(r.contributi_13_settimane),
    anniContributi: num(r.anni_contributi),
    pensioneTipo: r.pensione_tipo || null,
    casa: r.casa || null,
    canoneAnnuo: num(r.canone_annuo),
    contrattoRegistrato: bool(r.contratto_registrato),
    utenzeIntestate: bool(r.utenze_intestate),
  };
}

/** Domande visibili per un insieme di risposte. */
export function domandeVisibili(risposte) {
  return DOMANDE.filter((d) => !d.visibile || d.visibile(risposte));
}
