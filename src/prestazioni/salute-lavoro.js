// Salute e lavoro: esenzione ticket per reddito, bonus psicologo, trattamento
// integrativo, taglio del cuneo fiscale, NASpI.

import { VERIFICATO, eur, req, iseeEntro, LAVORO_DIPENDENTE } from './_comuni.js';
import { tutti, almenoUno } from '../logica.js';

export const esenzioneTicket = {
  id: 'esenzione_ticket',
  nome: 'Esenzione dal ticket sanitario per reddito',
  ente: 'Servizio sanitario nazionale, tramite la tua ASL',
  categoria: 'salute',
  sintesi: 'Visite specialistiche ed esami senza ticket per bambini sotto i 6 anni e persone oltre i 65 in famiglie con reddito fino a 36.151,98 €, e per disoccupati e pensionati con redditi bassi.',
  valuta(s) {
    const rf = s.redditoFamiliare;
    const sogliaBassa = 8263.31 + (s.coniuge ? 3098.74 : 0) + 516.46 * s.nFigli;
    const etaE01 = almenoUno(
      s.eta === null ? null : s.eta > 65 || s.eta < 6,
      s.coniuge ? (s.coniugeEta === null ? null : s.coniugeEta > 65) : false,
      s.figliRisposta ? s.figli.some((f) => f.anni !== null && f.anni < 6) : null,
    );
    const e01 = tutti(etaE01, rf === null ? null : rf <= 36151.98);
    const e02 = tutti(s.lavoro === null ? null : s.lavoro === 'disoccupato', rf === null ? null : rf < sogliaBassa);
    const e03 = s.lavoro === null ? null : s.lavoro !== 'pensionato' ? false : s.pensioneTipo === null ? null : s.pensioneTipo === 'sociale';
    const e04 = tutti(
      s.lavoro === null ? null : s.lavoro !== 'pensionato' ? false : s.pensioneTipo === null ? null : s.pensioneTipo === 'minima',
      s.eta === null ? null : s.eta > 60,
      rf === null ? null : rf < sogliaBassa,
    );
    const codici = [e01, e02, e03, e04];
    const esito = codici.includes(true) ? 'spetta' : codici.includes(null) ? 'manca_dato' : 'non_spetta';
    return {
      esito,
      requisiti: [
        req('E01: in famiglia c\'è un bambino sotto i 6 anni o una persona oltre i 65, e il reddito familiare non supera 36.151,98 €', e01, rf === null ? 'reddito_familiare' : 'eta'),
        req(`E02: sei disoccupato iscritto al Centro per l'impiego e il reddito familiare è sotto ${eur(sogliaBassa)}`, e02, s.lavoro === null ? 'lavoro' : 'reddito_familiare'),
        req('E03: ricevi l\'assegno sociale o la pensione sociale', e03, s.lavoro === null ? 'lavoro' : 'pensione_tipo'),
        req(`E04: hai più di 60 anni, una pensione al minimo e un reddito familiare sotto ${eur(sogliaBassa)}`, e04, s.lavoro === null ? 'lavoro' : 'pensione_tipo'),
      ],
      importo: { breve: 'niente ticket', testo: 'Non paghi il ticket su visite specialistiche ed esami diagnostici. L\'esenzione vale anche per i familiari a carico.' },
      note: ['Il reddito che conta è quello dell\'anno precedente; la condizione di disoccupato è quella attuale.', 'Le Regioni possono aggiungere altre esenzioni o cambiare la procedura: verifica con la tua ASL.'],
    };
  },
  come: {
    testo: 'Spesso il medico di famiglia trova già l\'esenzione negli elenchi del Sistema Tessera Sanitaria. Se manca, fai un\'autocertificazione alla tua ASL o in farmacia, secondo la Regione.',
    link: 'https://www.salute.gov.it/portale/esenzioni/dettaglioContenutiEsenzioni.jsp?id=1020&area=esenzioni&menu=vuoto',
    etichettaLink: 'Ministero della Salute, esenzioni per reddito',
  },
  fonti: [
    { titolo: 'Ministero della Salute, Esenzioni per reddito (codici E01-E04, DM 11/12/2009)', url: 'https://www.salute.gov.it/portale/esenzioni/dettaglioContenutiEsenzioni.jsp?id=1020&area=esenzioni&menu=vuoto' },
  ],
  verificato: VERIFICATO,
};

export const bonusPsicologo = {
  id: 'bonus_psicologo',
  nome: 'Bonus psicologo',
  ente: 'INPS, fondi del Ministero della Salute',
  categoria: 'salute',
  sintesi: 'Contributo fino a 50 € a seduta di psicoterapia, fino a 1.500 € secondo l\'ISEE, con graduatoria regionale.',
  valuta(s) {
    const tetto = s.isee === null ? null : s.isee < 15000 ? 1500 : s.isee <= 30000 ? 1000 : s.isee <= 50000 ? 500 : 0;
    return {
      requisiti: [iseeEntro(s, 50000)],
      probabile: true,
      importo: tetto ? { breve: `fino a ${eur(tetto)}`, testo: `Fino a 50 € a seduta, per un massimo di ${eur(tetto)} con il tuo ISEE.` } : { breve: 'fino a 1.500 €', testo: 'Fino a 50 € a seduta: massimo 1.500 € con ISEE sotto 15.000 €, 1.000 € fino a 30.000 €, 500 € fino a 50.000 €.' },
      note: ['I fondi sono pochi e le domande vanno in graduatoria per ISEE crescente: avere i requisiti non garantisce il contributo. Per questo non lo sommiamo al totale.'],
    };
  },
  finestra: { testo: 'La finestra 2026 non risultava ancora annunciata all\'11 ottobre 2026. Nel 2025 le domande si presentavano dal 15 settembre al 14 novembre.' },
  come: { testo: 'Domanda online all\'INPS, servizio «Contributo sessioni psicoterapia», o al contact center 803 164, quando si apre la finestra.', link: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.contributo-per-sostenere-le-spese-relative-a-sessioni-di-psicoterapia-bonus-psicologo.html' },
  fonti: [{ titolo: 'INPS, Contributo per le sessioni di psicoterapia', url: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.contributo-per-sostenere-le-spese-relative-a-sessioni-di-psicoterapia-bonus-psicologo.html' }],
  verificato: VERIFICATO,
};

const ADE_C4 = { titolo: 'Agenzia delle Entrate, circolare n. 4/E del 16/5/2025 sulle novità per il lavoro dipendente', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91' };

export const trattamentoIntegrativo = {
  id: 'trattamento_integrativo',
  nome: 'Trattamento integrativo (ex bonus 100 €)',
  ente: 'Il tuo datore di lavoro, regole dell\'Agenzia delle Entrate',
  categoria: 'lavoro',
  automatica: true,
  sintesi: '100 € al mese in busta paga per i lavoratori dipendenti con reddito fino a 15.000 €, e in parte fino a 28.000 €.',
  valuta(s) {
    const dip = s.lavoro === null ? null : LAVORO_DIPENDENTE.includes(s.lavoro);
    const r = s.redditoPersonale;
    let fascia = null;
    let probabile = false;
    if (r !== null) {
      if (r <= 8100) fascia = false;
      else if (r <= 8600) { fascia = true; probabile = true; }
      else if (r <= 15000) fascia = true;
      else if (r <= 28000) { fascia = true; probabile = true; }
      else fascia = false;
    }
    const pieno = r !== null && r > 8600 && r <= 15000;
    return {
      requisiti: [
        req('Sei un lavoratore dipendente', dip, 'lavoro'),
        req('Reddito sopra la soglia in cui l\'IRPEF è già zero (circa 8.500 €) e fino a 28.000 €', fascia, 'reddito_personale'),
      ],
      probabile,
      importo: pieno ? { annuo: 1200, mensile: 100, testo: '100 € al mese in busta paga, 1.200 € l\'anno.' } : { breve: 'fino a 1.200 €', testo: 'Tra 15.000 e 28.000 € spetta solo se le tue detrazioni (familiari, mutuo, ristrutturazioni) superano l\'imposta: l\'importo è la differenza, fino a 1.200 €.' },
      note: ['Arriva da solo in busta paga. Se non lo vedi, puoi recuperarlo nel 730.', 'Vicino a 8.500 € di reddito il diritto dipende da un calcolo fine sull\'imposta: lo segnaliamo come probabile.'],
    };
  },
  come: { testo: 'Controlla in busta paga la voce «trattamento integrativo». Se manca e pensi di averne diritto, chiedi all\'ufficio del personale o recuperalo nel 730.', link: 'https://infoprecompilata.agenziaentrate.gov.it/', etichettaLink: 'Dichiarazione precompilata' },
  fonti: [ADE_C4],
  verificato: VERIFICATO,
};

export const cuneoFiscale = {
  id: 'cuneo_fiscale',
  nome: 'Taglio del cuneo fiscale in busta paga',
  ente: 'Il tuo datore di lavoro, legge 207/2024',
  categoria: 'lavoro',
  automatica: true,
  sintesi: 'I dipendenti fino a 20.000 € ricevono una somma esente da tasse; tra 20.000 e 40.000 € hanno una detrazione in più fino a 1.000 €.',
  valuta(s) {
    const dip = s.lavoro === null ? null : LAVORO_DIPENDENTE.includes(s.lavoro);
    const r = s.redditoPersonale;
    let annuo = null;
    let testo = '';
    if (r !== null && r <= 20000) {
      const pct = r <= 8500 ? 0.071 : r <= 15000 ? 0.053 : 0.048;
      annuo = Math.round(r * pct);
      testo = `Somma esente da tasse pari al ${String(pct * 100).replace('.', ',')}% del reddito da lavoro: circa ${eur(annuo)} l'anno.`;
    } else if (r !== null && r <= 40000) {
      annuo = r <= 32000 ? 1000 : Math.round((1000 * (40000 - r)) / 8000);
      testo = `Detrazione aggiuntiva di circa ${eur(annuo)} l'anno sull'IRPEF.`;
    }
    return {
      requisiti: [
        req('Sei un lavoratore dipendente (non pensionato)', dip, 'lavoro'),
        req('Reddito complessivo fino a 40.000 €', r === null ? null : r <= 40000, 'reddito_personale'),
      ],
      importo: annuo ? { annuo, mensile: Math.round(annuo / 12), testo } : { breve: 'fino a 1.000 € o più', testo: 'Somma esente del 7,1%, 5,3% o 4,8% del reddito fino a 20.000 €; detrazione fino a 1.000 € tra 20.000 e 40.000 €.' },
      note: ['È già in busta paga: questa scheda serve a controllare che ci sia. Cerca voci come «somma esente L. 207/24» o «ulteriore detrazione».'],
    };
  },
  come: { testo: 'Controlla la busta paga o la Certificazione Unica. Se manca, chiedi all\'ufficio del personale; in ultima istanza si recupera con il 730.', link: ADE_C4.url, etichettaLink: 'Circolare dell\'Agenzia delle Entrate' },
  fonti: [ADE_C4],
  verificato: VERIFICATO,
};

export const naspi = {
  id: 'naspi',
  nome: 'NASpI, indennità di disoccupazione',
  ente: 'INPS',
  categoria: 'lavoro',
  sintesi: 'Indennità mensile per chi ha perso il lavoro dipendente senza volerlo. Va chiesta entro 68 giorni.',
  valuta(s) {
    return {
      requisiti: [
        req('Sei senza lavoro', s.lavoro === null ? null : s.lavoro === 'disoccupato', 'lavoro'),
        req('Hai perso il lavoro non per tua scelta negli ultimi 68 giorni', s.persoLavoro, 'perso_lavoro'),
        req('Hai almeno 13 settimane di contributi negli ultimi 4 anni', s.contributi13, 'contributi_13_settimane'),
      ],
      importo: { breve: 'fino a 1.584,70 € al mese', testo: 'Circa il 75% della retribuzione media, fino a 1.584,70 € lordi al mese nel 2026, per metà delle settimane lavorate negli ultimi 4 anni (massimo 24 mesi).' },
      note: ['La domanda va fatta entro 68 giorni dalla fine del lavoro, altrimenti si perde il diritto.', 'Valgono anche le dimissioni per giusta causa e la risoluzione consensuale in sede protetta.'],
    };
  },
  come: { testo: 'Domanda online all\'INPS con SPID o CIE, oppure tramite patronato, entro 68 giorni.', link: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.50593.naspi-indennit-mensile-di-disoccupazione.html' },
  fonti: [{ titolo: 'INPS, NASpI: indennità mensile di disoccupazione', url: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.50593.naspi-indennit-mensile-di-disoccupazione.html' }],
  verificato: VERIFICATO,
};
