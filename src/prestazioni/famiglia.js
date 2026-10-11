// Famiglia e figli: Assegno unico, bonus nido, bonus nuovi nati, assegno di
// maternità dei Comuni, bonus mamme, esonero contributi per madri con 3 figli,
// Carta Dedicata a te, detrazione per figli tra 21 e 29 anni.

import { VERIFICATO, eur, req, iseeEntro, LAVORO_DIPENDENTE } from './_comuni.js';
import { TABELLA_AUU_2026, FONTE_TABELLA_AUU } from '../dati/auu-2026.js';

const NOTA_NUOVO_ISEE = 'Per questa prestazione dal 2026 si usa l\'«ISEE per prestazioni familiari e inclusione», che esclude la prima casa fino a 91.500 € (120.000 € nei capoluoghi delle città metropolitane) e conta di più i figli. Può essere più basso del tuo ISEE ordinario: il risultato reale può essere migliore.';
const FONTE_M102 = { titolo: 'INPS, messaggio n. 102 del 12/1/2026: il nuovo ISEE per prestazioni familiari e inclusione', url: 'https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/01/Circolare_15133/Allegati/16520_Messaggio-numero-102-del-12-01-2026.pdf' };
const CONDIZIONI_OK = ['studia', 'tirocinio', 'disoccupato_cpi', 'servizio_civile'];

function cittadinanzaFamiglia(s) {
  const testo = 'Cittadinanza italiana o UE, oppure permesso di soggiorno idoneo (lungo periodo, lavoro, ricerca, protezione)';
  if (!s.cittadinanza) return req(testo, null, 'cittadinanza');
  return req(testo, s.cittadinanza === 'extra_ue_altro' ? null : true, 'cittadinanza');
}

function rigaAUU(isee) {
  if (isee === null) return TABELLA_AUU_2026[TABELLA_AUU_2026.length - 1];
  return TABELLA_AUU_2026.find((r) => isee <= r[0]);
}

/** Figli che danno diritto all'Assegno unico, con il loro stato. */
function figliAUU(s) {
  return s.figli.map((f) => {
    if (f.anni === null) return { f, ok: null };
    if (f.disabile) return { f, ok: true, tipo: f.anni < 18 ? 'minore' : f.anni < 21 ? 'magg' : 'disabile_adulto' };
    if (f.anni < 18) return { f, ok: true, tipo: 'minore' };
    if (f.anni < 21) {
      if (!f.condizione) return { f, ok: null, tipo: 'magg' };
      return { f, ok: CONDIZIONI_OK.includes(f.condizione), tipo: 'magg' };
    }
    return { f, ok: false };
  });
}

export const assegnoUnico = {
  id: 'assegno_unico',
  nome: 'Assegno unico e universale per i figli',
  ente: 'INPS',
  categoria: 'famiglia',
  sintesi: 'Assegno mensile per ogni figlio fino a 21 anni (senza limiti di età se disabile). Spetta a tutti: con l\'ISEE si prende di più, senza ISEE il minimo.',
  valuta(s) {
    const elenco = figliAUU(s);
    const validi = elenco.filter((x) => x.ok === true);
    const incerti = elenco.filter((x) => x.ok === null);
    const almenoUno = !s.figliRisposta ? null : validi.length > 0 ? true : incerti.length > 0 ? null : false;
    const riga = rigaAUU(s.isee);
    const [, minore, magg, ulteriore, secondo] = riga;
    let mensile = 0;
    for (const { f, tipo } of validi) {
      let base = tipo === 'magg' ? magg : minore;
      if (f.anni !== null && f.anni < 1) base *= 1.5;
      else if (validi.length >= 3 && f.anni >= 1 && f.anni < 3 && (s.isee === null || s.isee <= 46582.71)) base *= 1.5;
      mensile += base;
      if (f.disabile && f.anni < 21) mensile += 99.1;
      if (s.seiMadre && s.eta !== null && s.eta < 21) mensile += 23.3;
    }
    if (validi.length > 2) mensile += ulteriore * (validi.length - 2);
    const dueRedditi = s.coniuge && s.redditoPersonale > 0 && s.redditoConiuge > 0;
    if (dueRedditi && validi.length > 0) mensile += secondo * validi.length;
    if (validi.length >= 4) mensile += 150;
    mensile = Math.round(mensile * 100) / 100;

    const note = [
      s.isee === null
        ? 'Senza ISEE prendi il minimo (58,30 € al mese per figlio minorenne). Con l\'ISEE potresti avere fino a 203,80 €: fai la DSU.'
        : `Con ISEE ${eur(s.isee)} sei nella fascia fino a ${riga[0] === Infinity ? 'oltre 46.582,71 €' : eur(riga[0])} della tabella INPS 2026.`,
      NOTA_NUOVO_ISEE,
      'Comprende le maggiorazioni per figli sotto 1 anno (+50%), per figli tra 1 e 3 anni nelle famiglie con almeno 3 figli, per ogni figlio oltre il secondo e per le famiglie con almeno 4 figli (150 € al mese).',
    ];
    if (dueRedditi) note.push('Abbiamo aggiunto la maggiorazione per due genitori che lavorano, perché avete entrambi un reddito: spetta solo se sono redditi da lavoro.');
    if (validi.some((x) => x.f.disabile)) note.push('Per un figlio con disabilità sotto i 21 anni abbiamo aggiunto la maggiorazione minima (99,10 €). Con disabilità grave o non autosufficienza sale a 110,60 € o 122,30 €.');
    if (incerti.length) note.push('Per i figli tra 18 e 21 anni indica cosa fanno: l\'assegno spetta se studiano, fanno un tirocinio, sono iscritti al Centro per l\'impiego o fanno servizio civile, con un reddito fino a 8.000 €.');

    return {
      requisiti: [
        req('Hai almeno un figlio sotto i 18 anni, tra 18 e 21 anni che studia o cerca lavoro, o con disabilità', almenoUno, 'figli'),
        cittadinanzaFamiglia(s),
        req('Paghi le tasse in Italia e ci vivi o ci lavori', true),
      ],
      importo: validi.length ? { annuo: Math.round(mensile * 12), mensile, testo: `${eur(mensile)} al mese per ${validi.length} ${validi.length === 1 ? 'figlio' : 'figli'}, dalla tabella ufficiale INPS 2026.` } : null,
      note,
    };
  },
  come: {
    testo: 'Una domanda online all\'INPS, poi l\'assegno continua negli anni seguenti: comunichi solo i cambiamenti, come la nascita di un altro figlio. Rinnova l\'ISEE ogni anno entro il 30 giugno per non perdere gli arretrati.',
    passi: ['Fai la DSU per l\'ISEE, online all\'INPS o gratis al CAF', 'Presenta la domanda di Assegno unico su inps.it, al contact center 803 164 o con un patronato', 'Indica l\'IBAN su cui ricevere i pagamenti'],
    link: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-unico-e-universale-per-i-figli-a-carico-55984.assegno-unico-e-universale-per-i-figli-a-carico.html',
  },
  fonti: [
    { titolo: 'INPS, circolare n. 7 del 30/1/2026 sull\'Assegno unico 2026', url: 'https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/01/Circolare_15152/Allegati/16548_Circolare-numero-7-del-30-01-2026.pdf' },
    { titolo: 'INPS, tabella degli importi 2026 (allegato 1 alla circolare 7/2026)', url: FONTE_TABELLA_AUU },
    { titolo: 'INPS, circolare n. 81 del 24/7/2026 (limite di reddito di 8.000 € per i figli maggiorenni)', url: 'https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/07/Circolare_15335/Allegati/16902_Circolare-numero-81-del-24-07-2026.pdf' },
    FONTE_M102,
  ],
  verificato: VERIFICATO,
};

export const bonusNido = {
  id: 'bonus_nido',
  nome: 'Bonus asilo nido',
  ente: 'INPS',
  categoria: 'famiglia',
  sintesi: 'Rimborso della retta dell\'asilo nido, o un aiuto a casa per i bambini con gravi malattie croniche, fino a 3.600 € l\'anno per i bambini sotto i 3 anni.',
  valuta(s) {
    const piccoli = s.figli.filter((f) => f.anni !== null && f.anni < 3);
    const presente = !s.figliRisposta ? null : piccoli.length > 0 ? true : s.figli.some((f) => f.anni === null) ? null : false;
    const importoPer = (f) => {
      if (f.annoNascita >= 2024) return s.isee !== null && s.isee <= 40000 ? 3600 : 1500;
      if (s.isee === null || s.isee > 40000) return 1500;
      return s.isee <= 25000.99 ? 3000 : 2500;
    };
    const annuo = piccoli.reduce((t, f) => t + importoPer(f), 0);
    return {
      requisiti: [
        req('Hai un figlio sotto i 3 anni', presente, 'figli'),
        cittadinanzaFamiglia(s),
      ],
      probabile: true,
      importo: annuo ? { annuo, nonSommare: true, testo: `Fino a ${eur(annuo)} l'anno in rate mensili, mai più della retta che paghi davvero. Per i nati dal 2024 con ISEE fino a 40.000 € sono 3.600 €.` } : null,
      note: ['Spetta se il bambino va a un nido autorizzato o, per gravi malattie croniche, per l\'assistenza a casa. Per questo non lo sommiamo al totale.', 'Non si somma alla detrazione IRPEF per le rette del nido.', NOTA_NUOVO_ISEE],
    };
  },
  finestra: { a: '2026-12-31', testo: 'Domande per il 2026 aperte fino al 31 dicembre 2026. Le ricevute dei pagamenti si caricano entro il 30 aprile 2027.' },
  come: { testo: 'Domanda online all\'INPS, al contact center o con un patronato. Dal 2026 la domanda vale fino ad agosto dell\'anno in cui il bambino compie 3 anni: ogni anno indichi solo i mesi.', link: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.bonus-asilo-nido-e-forme-di-supporto-presso-la-propria-abitazione-51105.bonus-asilo-nido-e-forme-di-supporto-presso-la-propria-abitazione.html' },
  fonti: [{ titolo: 'INPS, circolare n. 29 del 27/3/2026 sul bonus asilo nido', url: 'https://servizi2.inps.it/Servizi/CircMessStd/maestro.ashx?idAllegato=16651&flagOriginale=1' }, FONTE_M102],
  verificato: VERIFICATO,
};

function natiDaPoco(s, oggi, mesiMax) {
  return s.figli.map((f) => {
    if (f.annoNascita === null) return { f, ok: null };
    if (f.annoNascita !== 2026) return { f, ok: false };
    if (f.mesi < mesiMax) return { f, ok: true };
    if (f.mesi === mesiMax) return { f, ok: null };
    return { f, ok: false, scaduto: true };
  });
}

export const bonusNuoviNati = {
  id: 'bonus_nuovi_nati',
  nome: 'Bonus nuovi nati',
  ente: 'INPS',
  categoria: 'famiglia',
  sintesi: '1.000 € una tantum per ogni figlio nato, adottato o in affido preadottivo nel 2026, con ISEE fino a 40.000 €. Va chiesto entro 120 giorni.',
  valuta(s, oggi) {
    const elenco = natiDaPoco(s, oggi, 4);
    const nati2026 = s.figli.filter((f) => f.annoNascita === 2026);
    const inTempo = elenco.filter((x) => x.ok === true);
    const scaduti = elenco.filter((x) => x.scaduto);
    const presente = !s.figliRisposta ? null : nati2026.length === 0 ? (s.figli.some((f) => f.annoNascita === null) ? null : false) : inTempo.length ? true : elenco.some((x) => x.ok === null) ? null : false;
    return {
      requisiti: [
        req('Hai un figlio nato o adottato nel 2026', !s.figliRisposta ? null : nati2026.length > 0 ? true : s.figli.some((f) => f.annoNascita === null) ? null : false, 'figli'),
        nati2026.length ? req('Sei ancora entro 120 giorni dalla nascita o dall\'adozione', presente, 'figli') : null,
        iseeEntro(s, 40000, 'ISEE per prestazioni familiari fino a 40.000 €'),
        cittadinanzaFamiglia(s),
      ].filter(Boolean),
      importo: inTempo.length ? { unaTantum: 1000 * inTempo.length, testo: `${eur(1000 * inTempo.length)} una tantum, non tassati.` } : null,
      note: [
        ...(scaduti.length ? ['Per i figli nati più di 120 giorni fa la domanda non è più possibile.'] : []),
        'Contiamo i giorni per mese di nascita: se sei vicino ai 120 giorni, fai la domanda subito.',
        'I pagamenti seguono l\'ordine delle domande, nei limiti dei fondi.',
        NOTA_NUOVO_ISEE,
      ],
    };
  },
  come: { testo: 'Domanda online all\'INPS, con l\'app INPS mobile, al contact center o con un patronato, entro 120 giorni dalla nascita. Una domanda per ogni figlio, la presenta un solo genitore.', link: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.bonus-nuovi-nati.html' },
  fonti: [{ titolo: 'INPS, scheda Bonus nuovi nati (circolare n. 45 del 10/4/2026)', url: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.bonus-nuovi-nati.html' }, FONTE_M102],
  verificato: VERIFICATO,
};

export const assegnoMaternitaComuni = {
  id: 'assegno_maternita_comuni',
  nome: 'Assegno di maternità dei Comuni',
  ente: 'Il tuo Comune, pagato dall\'INPS',
  categoria: 'famiglia',
  sintesi: '2.065,50 € per le madri che non hanno l\'indennità di maternità dal lavoro, o ne hanno una più bassa, con ISEE fino a 20.668,26 €. Si chiede al Comune entro 6 mesi dal parto.',
  valuta(s, oggi) {
    const elenco = natiDaPoco(s, oggi, 6);
    const inTempo = elenco.filter((x) => x.ok === true);
    const presente = !s.figliRisposta ? null : inTempo.length ? true : elenco.some((x) => x.ok === null) ? null : false;
    let tutela = null;
    if (s.lavoro) {
      if (['casa', 'disoccupato', 'studente', 'altro'].includes(s.lavoro)) tutela = true;
      else if (LAVORO_DIPENDENTE.includes(s.lavoro)) tutela = false;
    }
    return {
      requisiti: [
        req('Sei la madre', s.seiMadre, 'sei_madre'),
        req('Il figlio è nato o è stato adottato negli ultimi 6 mesi', presente, 'figli'),
        iseeEntro(s, 20668.26, 'ISEE ordinario fino a 20.668,26 €'),
        req('Non hai l\'indennità di maternità dal lavoro', tutela, 'lavoro'),
        cittadinanzaFamiglia(s),
      ],
      importo: inTempo.length ? { unaTantum: 2065.5 * inTempo.length, testo: '413,10 € al mese per 5 mesi, 2.065,50 € in tutto per ogni figlio.' } : null,
      note: [
        'Se hai un\'indennità di maternità più bassa di 2.065,50 €, il Comune ti dà la differenza: chiedila anche se lavori come dipendente.',
        'Chi ha almeno 3 mesi di contributi di maternità tra 18 e 9 mesi prima del parto può chiedere invece all\'INPS l\'assegno di maternità dello Stato, 2.543,15 €.',
      ],
    };
  },
  come: { testo: 'Domanda all\'ufficio servizi sociali del tuo Comune di residenza entro 6 mesi dal parto o dall\'ingresso in famiglia del bambino.', link: 'https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/04/Circolare_15242/Allegati/16731_Circolare-numero-47-del-21-04-2026.pdf', etichettaLink: 'Circolare INPS con gli importi 2026' },
  fonti: [{ titolo: 'INPS, circolare n. 47 del 21/4/2026, paragrafo 2 (importi e soglia ISEE 2026)', url: 'https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/04/Circolare_15242/Allegati/16731_Circolare-numero-47-del-21-04-2026.pdf' }],
  verificato: VERIFICATO,
};

export const bonusMamme = {
  id: 'bonus_mamme',
  nome: 'Bonus mamme lavoratrici',
  ente: 'INPS',
  categoria: 'famiglia',
  sintesi: '60 € al mese, fino a 720 € l\'anno, per le madri lavoratrici con almeno due figli e reddito fino a 40.000 €.',
  valuta(s) {
    const lavora = s.lavoro === null ? null : [...LAVORO_DIPENDENTE, 'autonomo'].includes(s.lavoro);
    const n = s.nFigli;
    const piccolo = s.figli.length ? Math.min(...s.figli.map((f) => (f.anni === null ? 99 : f.anni))) : null;
    const etaOk = !s.figliRisposta || piccolo === null ? null : n >= 3 ? piccolo < 18 : piccolo < 10;
    const esonero = s.lavoro === 'dipendente_indeterminato' && n >= 3;
    return {
      requisiti: [
        req('Sei la madre', s.seiMadre, 'sei_madre'),
        req('Lavori come dipendente (non domestica) o autonoma', lavora, 'lavoro'),
        req('Hai almeno 2 figli', !s.figliRisposta ? null : n >= 2, 'figli'),
        req('Il figlio più piccolo ha meno di 10 anni (meno di 18 se hai almeno 3 figli)', etaOk, 'figli'),
        req('Reddito da lavoro fino a 40.000 €', s.redditoPersonale === null ? null : s.redditoPersonale <= 40000, 'reddito_personale'),
        esonero ? req('Non hai già l\'esonero dei contributi per madri con 3 figli a tempo indeterminato', false) : null,
      ].filter(Boolean),
      probabile: true,
      importo: { annuo: 720, mensile: 60, testo: '60 € al mese per ogni mese di lavoro, fino a 720 € l\'anno. Non tassati.' },
      note: ['All\'11 ottobre 2026 l\'INPS non aveva ancora pubblicato le istruzioni per la domanda 2026: le fonti prevedono un pagamento unico a fine anno. Tieni d\'occhio il sito INPS.'],
    };
  },
  come: { testo: 'Serve una domanda all\'INPS, non arriva da solo. Quando apre il servizio la presenti online o con un patronato.', link: 'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.01.vademecum-bonus-mamme.html', etichettaLink: 'Vademecum INPS' },
  fonti: [{ titolo: 'INPS, Vademecum Bonus mamme (27/1/2026)', url: 'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.01.vademecum-bonus-mamme.html' }],
  verificato: VERIFICATO,
};

export const esoneroMadriTreFigli = {
  id: 'esonero_contributi_madri',
  nome: 'Esonero dei contributi per madri con 3 figli',
  ente: 'Il tuo datore di lavoro, regole INPS',
  categoria: 'famiglia',
  automatica: true,
  sintesi: 'Le lavoratrici dipendenti a tempo indeterminato con almeno 3 figli non pagano la loro quota di contributi pensionistici, fino a 3.000 € l\'anno, finché il più piccolo non compie 18 anni.',
  valuta(s) {
    const piccolo = s.figli.length ? Math.min(...s.figli.map((f) => (f.anni === null ? 99 : f.anni))) : null;
    return {
      requisiti: [
        req('Sei la madre', s.seiMadre, 'sei_madre'),
        req('Sei dipendente a tempo indeterminato (non domestica)', s.lavoro === null ? null : s.lavoro === 'dipendente_indeterminato', 'lavoro'),
        req('Hai almeno 3 figli', !s.figliRisposta ? null : s.nFigli >= 3, 'figli'),
        req('Il figlio più piccolo ha meno di 18 anni', piccolo === null ? null : piccolo < 18, 'figli'),
      ],
      importo: { breve: 'fino a 3.000 € l\'anno', testo: 'Più soldi netti in busta paga: la tua quota di contributi pensionistici viene azzerata, fino a 3.000 € l\'anno.' },
      note: ['Previsto per gli anni 2024, 2025 e 2026. Se non lo vedi in busta paga, comunica al datore di lavoro i codici fiscali dei figli.'],
    };
  },
  come: { testo: 'Lo applica il datore di lavoro in busta paga: comunicagli i codici fiscali dei figli, oppure usa l\'apposito servizio INPS.', link: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2023-12-30;213', etichettaLink: 'Legge 213/2023' },
  fonti: [{ titolo: 'Legge 213/2023, articolo 1, comma 180 (Normattiva)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2023-12-30;213' }],
  verificato: VERIFICATO,
};

export const cartaDedicataATe = {
  id: 'carta_dedicata_a_te',
  nome: 'Carta Dedicata a te',
  ente: 'Ministero dell\'Agricoltura, INPS e Comuni',
  categoria: 'famiglia',
  automatica: true,
  sintesi: 'Carta da 500 € per il 2026 e 500 € per il 2027 per comprare alimentari, carburante o abbonamenti, assegnata dai Comuni alle famiglie di almeno 3 persone con ISEE fino a 15.000 €.',
  valuta(s) {
    const ammortizzatori = s.lavoro === 'disoccupato' && s.persoLavoro === true;
    return {
      requisiti: [
        req('Famiglia di almeno 3 persone', s.componenti >= 3 ? true : s.figliRisposta && s.coniuge !== null ? false : null, 'figli'),
        iseeEntro(s, 15000, 'ISEE ordinario fino a 15.000 €'),
        req('Nessuno in famiglia riceve NASpI o cassa integrazione', !ammortizzatori),
      ],
      probabile: true,
      importo: { unaTantum: 500, nonSommare: true, testo: '500 € caricati sulla carta per il 2026, altri 500 € nel 2027.' },
      note: [
        'Le carte sono circa 1,18 milioni e vanno prima alle famiglie con figli più giovani e ISEE più basso: avere i requisiti non basta. Per questo non la sommiamo al totale.',
        'Non conta chi riceve ADI o Carta Acquisti: se te ne spetta una, la carta non arriva.',
      ],
    };
  },
  finestra: { testo: 'Per il 2026 gli elenchi sono già formati: i Comuni li hanno chiusi entro il 13 ottobre 2026. La carta si attiva dal 4 novembre e va usata la prima volta entro il 16 dicembre 2026, altrimenti la quota 2026 si perde.' },
  come: { testo: 'Non si fa domanda: il Comune ti avvisa se sei in elenco e ritiri la carta all\'ufficio postale con la lettera del Comune.', link: 'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.09.carta-dedicata-a-te-modalit-operative-per-il-2026-2027.html', etichettaLink: 'Notizia INPS' },
  fonti: [{ titolo: 'INPS, Carta Dedicata a te: modalità operative 2026-2027 (messaggio n. 2906 del 22/9/2026)', url: 'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.09.carta-dedicata-a-te-modalit-operative-per-il-2026-2027.html' }],
  verificato: VERIFICATO,
};

export const detrazioneFigli = {
  id: 'detrazione_figli_21_29',
  nome: 'Detrazione per figli a carico dai 21 ai 29 anni',
  ente: 'Agenzia delle Entrate, nel 730',
  categoria: 'famiglia',
  sintesi: 'Per i figli dai 21 ai 29 anni (senza limite se disabili) che hanno pochi redditi, i genitori tolgono dall\'IRPEF fino a 950 € l\'anno per figlio.',
  valuta(s) {
    const grandi = s.figli.filter((f) => f.anni !== null && f.anni >= 21 && (f.anni < 30 || f.disabile));
    return {
      requisiti: [
        req('Hai un figlio tra 21 e 29 anni, o un figlio con disabilità oltre i 21', !s.figliRisposta ? null : grandi.length > 0, 'figli'),
      ],
      probabile: true,
      importo: { breve: `fino a ${eur(950 * Math.max(1, grandi.length))}`, testo: 'Fino a 950 € per figlio, meno quanto più alto è il reddito dei genitori. Si divide a metà tra i genitori, o va tutta a chi guadagna di più.' },
      note: ['Il figlio deve avere un reddito fino a 4.000 € se ha fino a 24 anni, fino a 2.840,51 € dai 25 anni. Non lo chiediamo, per questo l\'esito è probabile.'],
    };
  },
  come: { testo: 'La indichi nel 730 o nel modello Redditi, nel prospetto dei familiari a carico, anche con la precompilata.', link: 'https://infoprecompilata.agenziaentrate.gov.it/', etichettaLink: 'Dichiarazione precompilata' },
  fonti: [{ titolo: 'Agenzia delle Entrate, istruzioni al modello 730/2026 (familiari a carico)', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/9764684/730_2026_istruzioni_+agg+28+05+2026.pdf' }],
  verificato: VERIFICATO,
};
