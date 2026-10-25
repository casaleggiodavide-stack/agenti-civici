// Provincia autonoma di Bolzano: misure verificate il 25/10/2026.

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra, residenzaRegioneAlmeno } from '../_comuni.js';

const residenza = (s) => residenzaRegioneAlmeno(s, 5, 'Alto Adige');

export const bolzanoAssegnoFigli = {
  id: 'bolzano_assegno_figli',
  regione: 'bolzano',
  nome: 'Assegno provinciale per i figli (Bolzano)',
  ente: 'Provincia autonoma di Bolzano, ASSE',
  categoria: 'famiglia',
  sintesi: 'Da 60 a 76 € al mese per ogni figlio minorenne (di più con disabilità), per le famiglie con ISEE fino a 46.000 €.',
  valuta(s) {
    const mensile = s.isee === null ? null : s.isee <= 15000 ? 76 : s.isee <= 30000 ? 68 : 60;
    const n = s.minori.length;
    return {
      requisiti: [figlioTra(s, 0, 18, 'Almeno un figlio minorenne'), residenza(s), iseeEntro(s, 46000, 'ISEE per le prestazioni familiari fino a 46.000 €')],
      importo: { breve: mensile ? `${mensile} € al mese per figlio` : 'da 60 a 76 € al mese per figlio', testo: 'ISEE fino a 15.000 €: 76 € al mese per figlio minorenne; fino a 30.000 €: 68 €; fino a 46.000 €: 60 €. Per i figli con disabilità da 131 a 326 €.', annuo: mensile && n ? mensile * 12 * n : 0 },
      note: ['La domanda si rinnova ogni anno tra gennaio e settembre.'],
    };
  },
  finestra: { testo: 'Rinnovo ogni anno dal 1° gennaio al 30 settembre; una domanda fatta dopo decorre dal mese successivo.' },
  come: { testo: 'Tramite i patronati oppure online su myCIVIS, con l\'ISEE dell\'anno in corso.', link: 'https://mycivis.civis.bz.it/it/Services/ServiceDetail/?lid=1039624' },
  fonti: [{ titolo: 'myCIVIS, Assegno provinciale per i figli', url: 'https://mycivis.civis.bz.it/it/Services/ServiceDetail/?lid=1039624' }],
  verificato: VERIFICATO_REGIONI,
};

export const bolzanoAssegnoNucleo = {
  id: 'bolzano_assegno_nucleo',
  regione: 'bolzano',
  nome: 'Assegno provinciale al nucleo familiare: 200 € al mese fino ai 3 anni (Bolzano)',
  ente: 'Provincia autonoma di Bolzano, ASSE',
  categoria: 'famiglia',
  sintesi: '200 € al mese per ogni figlio fino ai 3 anni, senza limiti di reddito.',
  valuta(s) {
    const piccoli = s.figli.filter((f) => f.anni !== null && f.anni < 3).length;
    return {
      requisiti: [figlioTra(s, 0, 3, 'Un figlio con meno di 3 anni'), residenza(s)],
      importo: { breve: '200 € al mese per figlio', testo: '200 € al mese per ogni figlio, fino ai 3 anni (al massimo fino al 43° mese). Non serve l\'ISEE.', annuo: 2400 * (piccoli || 1) },
    };
  },
  finestra: { testo: 'Con domanda entro un anno dalla nascita si hanno gli arretrati; il termine ultimo è a 3 anni dalla nascita. La domanda vale tre anni.' },
  come: { testo: 'Tramite i patronati oppure online su myCIVIS.', link: 'https://mycivis.civis.bz.it/it/Services/ServiceDetail/?lid=1002540' },
  fonti: [{ titolo: 'myCIVIS, Assegno provinciale al nucleo familiare', url: 'https://mycivis.civis.bz.it/it/Services/ServiceDetail/?lid=1002540' }],
  verificato: VERIFICATO_REGIONI,
};

export const bolzanoAssegnoCura = {
  id: 'bolzano_assegno_cura',
  regione: 'bolzano',
  nome: 'Assegno di cura per le persone non autosufficienti (Bolzano)',
  ente: 'Provincia autonoma di Bolzano, ASSE',
  categoria: 'anziani',
  sintesi: 'Da 599 a 1.800 € al mese alle persone non autosufficienti, secondo le ore di assistenza necessarie, senza limiti di reddito.',
  valuta(s) {
    return {
      requisiti: [req('Nel nucleo c\'è una persona che ha bisogno di più di 60 ore di assistenza al mese', s.disabileNucleo, 'disabile_nucleo'), residenza(s)],
      probabile: true,
      importo: { breve: 'da 599 a 1.800 € al mese', testo: 'Livello 1 (60-120 ore di assistenza al mese) 599 €; livello 2 (120-180 ore) 900 €; livello 3 (180-240 ore) 1.350 €; livello 4 (oltre 240 ore) 1.800 €.', nonSommare: true },
      note: ['Non si somma con l\'indennità di accompagnamento INPS.'],
    };
  },
  finestra: { testo: 'Si chiede in ogni momento la valutazione della non autosufficienza; poi l\'assegno arriva in automatico il 25 di ogni mese.' },
  come: { testo: 'Domanda di inquadramento della non autosufficienza su myCIVIS o con un patronato. Informazioni al numero 848 800 277.', link: 'https://mycivis.civis.bz.it/it/Services/ServiceDetail/?id=1221' },
  fonti: [{ titolo: 'myCIVIS, Pagamento dell\'assegno di cura', url: 'https://mycivis.civis.bz.it/it/Services/ServiceDetail/?id=1221' }],
  verificato: VERIFICATO_REGIONI,
};

export const bolzano65Pass = {
  id: 'bolzano_65_pass',
  regione: 'bolzano',
  nome: 'Abbonamento südtirolmobil 65+ (Bolzano)',
  ente: 'Provincia autonoma di Bolzano, STA',
  categoria: 'anziani',
  sintesi: 'Chi risiede in Alto Adige e ha almeno 65 anni viaggia senza limiti su bus e treni regionali fino a Trento pagando una quota annua di 153, 77 o 21 € secondo l\'età.',
  valuta(s) {
    const quota = s.eta === null ? null : s.eta >= 75 ? 21 : s.eta >= 70 ? 77 : 153;
    return {
      requisiti: [req('Almeno 65 anni', s.eta === null ? null : s.eta >= 65, 'eta')],
      importo: { breve: quota ? `${quota} € l'anno` : 'da 21 a 153 € l\'anno', testo: 'Quota annua: 153 € da 65 a 69 anni, 77 € da 70 a 74, 21 € da 75 in su. Esclusi i treni a lunga percorrenza.', nonSommare: true },
    };
  },
  finestra: { testo: 'Si chiede e si rinnova online in ogni momento.' },
  come: { testo: 'Online su myportal.suedtirolmobil.info, con carta di credito o pagoPA.', link: 'https://www.suedtirolmobil.info/en/tickets/ticket-finder/suedtirolmobil-65-pass' },
  fonti: [{ titolo: 'südtirolmobil, 65+ Pass', url: 'https://www.suedtirolmobil.info/en/tickets/ticket-finder/suedtirolmobil-65-pass' }],
  verificato: VERIFICATO_REGIONI,
};
