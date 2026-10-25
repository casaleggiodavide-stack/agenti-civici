// Marche: misure regionali verificate il 25/10/2026. Le pagine del sito della
// Regione sono dietro un controllo anti-bot: le regole vengono dagli avvisi
// degli Ambiti territoriali sociali e dei Comuni, che citano gli atti regionali.
// Esclusa la borsa ERDIS (dipende dall'ateneo).

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

export const marcheLibriTesto = {
  id: 'marche_libri_testo',
  regione: 'marche',
  nome: 'Libri di testo gratuiti o semigratuiti (Marche)',
  ente: 'Regione Marche, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: 'Rimborso della spesa per i libri di testo degli studenti di scuola media e superiore con ISEE fino a 13.500 €.',
  valuta(s) {
    return {
      requisiti: [
        figlioTra(s, 10, 20, 'Un figlio iscritto alla scuola media o superiore'),
        iseeEntro(s, 13500, 'ISEE fino a 13.500 €'),
      ],
      probabile: true,
      importo: { breve: 'rimborso della spesa per i libri', testo: 'Rimborso della spesa documentata per i libri dell\'anno 2026-2027. Chi ha ISEE fino a 10.632,94 € viene servito per primo, poi chi arriva a 13.500 € con i fondi rimasti.', nonSommare: true },
      note: ['Ogni Comune fissa la propria scadenza: a Fermo, per esempio, il 16 novembre 2026.', 'Conserva scontrini o fatture dei libri.'],
    };
  },
  finestra: { testo: 'Domande aperte nei Comuni dopo il decreto regionale del 5 ottobre 2026; le scadenze cambiano da Comune a Comune (a Fermo il 16 novembre 2026).' },
  come: { testo: 'Domanda al Comune di residenza dello studente con il modulo comunale, allegando scontrini o fatture, l\'elenco dei libri della scuola e l\'IBAN.', link: 'https://www.comune.fermo.it/Novita/Avvisi/FORNITURA-GRATUITA-O-SEMIGRATUITA-DEI-LIBRI-DI-TESTO-A.-S.-2026-27-STUDENTI-DELLA-SCUOLA-SECONDARIA-DI-I-e-II-GRADO', etichettaLink: 'Esempio: l\'avviso del Comune di Fermo' },
  fonti: [{ titolo: 'Comune di Fermo, Avviso libri di testo a.s. 2026-2027 (soglia ISEE regionale)', url: 'https://www.comune.fermo.it/Novita/Avvisi/FORNITURA-GRATUITA-O-SEMIGRATUITA-DEI-LIBRI-DI-TESTO-A.-S.-2026-27-STUDENTI-DELLA-SCUOLA-SECONDARIA-DI-I-e-II-GRADO' }],
  verificato: VERIFICATO_REGIONI,
};

export const marcheAssegnoCura = {
  id: 'marche_assegno_cura',
  regione: 'marche',
  nome: 'Assegno di cura per anziani non autosufficienti (Marche)',
  ente: 'Regione Marche, tramite gli Ambiti territoriali sociali',
  categoria: 'anziani',
  sintesi: '200 € al mese alle famiglie che assistono a casa un anziano di almeno 65 anni con indennità di accompagnamento, da soli o con un\'assistente familiare regolare.',
  valuta(s) {
    return {
      requisiti: [req('Nel nucleo c\'è una persona di almeno 65 anni con invalidità al 100% e indennità di accompagnamento', s.disabileNucleo, 'disabile_nucleo')],
      probabile: true,
      importo: { breve: '200 € al mese', testo: '200 € al mese per 12 mesi, legati al piano di assistenza individuale. Al massimo due assegni per famiglia. Graduatoria per ISEE crescente.', nonSommare: true },
      note: ['Non si somma con l\'assistenza domiciliare SAD, Home Care Premium, i contributi per la disabilità gravissima e il sostegno al caregiver per lo stesso periodo.'],
    };
  },
  finestra: { a: '2026-08-31', testo: 'Ogni Ambito pubblica il proprio avviso: per il 2026 si sono chiusi tra fine agosto e inizio settembre. Il prossimo giro è atteso nell\'estate 2027.' },
  come: { testo: 'Domanda online all\'Ambito territoriale sociale di residenza, sulla piattaforma indicata nell\'avviso.', link: 'https://ancona-api.municipiumapp.it/s3/223/allegati/documenti-pubblici/politiche-sociali/assegno-cura/allegato-sito-avviso-assegno-di-cura-2026-fondi-2025.pdf', etichettaLink: 'Esempio: l\'avviso dell\'Ambito di Ancona' },
  fonti: [
    { titolo: 'Consiglio regionale delle Marche, interrogazione n. 408 del 31/7/2026 sull\'assegno di cura', url: 'https://www.consiglio.marche.it/banche_dati_e_documentazione/atti_di_indirizzo_e_controllo/interrogazioni/pdf/inter408_12.pdf' },
    { titolo: 'ATS 11 Ancona, Avviso assegno di cura 2026', url: 'https://ancona-api.municipiumapp.it/s3/223/allegati/documenti-pubblici/politiche-sociali/assegno-cura/allegato-sito-avviso-assegno-di-cura-2026-fondi-2025.pdf' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const marcheNatalita = {
  id: 'marche_natalita',
  regione: 'marche',
  nome: 'Contributo per i nuovi nati (Marche, legge regionale 8/2025)',
  ente: 'Regione Marche, tramite gli Ambiti territoriali sociali',
  categoria: 'famiglia',
  sintesi: 'Contributo una tantum di 1.000 € (2.000 € con un minore con disabilità grave) alle famiglie con ISEE basso e un figlio nato o adottato nel 2026, dove l\'Ambito ha attivato la misura.',
  valuta(s) {
    return {
      requisiti: [
        figlioTra(s, 0, 1, 'Un figlio nato o adottato nel 2026'),
        iseeEntro(s, 10140, 'ISEE minorenni fino a 10.140 € (soglia dell\'avviso di Fermo)'),
      ],
      probabile: true,
      importo: { breve: '1.000 €', testo: '1.000 € una tantum, 2.000 € se nel nucleo c\'è un minore con disabilità grave. Si somma all\'Assegno unico.', unaTantum: 1000 },
      note: ['Non tutti gli Ambiti attivano questo intervento, e i fondi sono pochi: graduatoria per ISEE crescente.'],
    };
  },
  finestra: { a: '2026-09-27', testo: 'Per il 2026 l\'avviso dell\'Ambito di Fermo si è chiuso il 27 settembre. Ogni Ambito decide se e quando aprire; il prossimo giro è atteso nel 2027.' },
  come: { testo: 'Domanda online all\'Ambito territoriale sociale di residenza, con ISEE minorenni e IBAN.', link: 'https://montegranaro-api.municipiumapp.it/s3/4349/allegati/avviso-pubblico-l-r-8_25-sostegno-alle-famiglie.pdf', etichettaLink: 'Esempio: l\'avviso dell\'Ambito di Fermo' },
  fonti: [
    { titolo: 'ATS XIX (Fermo), Avviso interventi per la famiglia L.R. 8/2025, annualità 2026', url: 'https://montegranaro-api.municipiumapp.it/s3/4349/allegati/avviso-pubblico-l-r-8_25-sostegno-alle-famiglie.pdf' },
    { titolo: 'Assemblea legislativa delle Marche, testo della L.R. 8/2025', url: 'https://www.consiglio.marche.it/banche_dati_e_documentazione/iter_degli_atti/pdl/pdf/d_leg20_11.pdf' },
  ],
  verificato: VERIFICATO_REGIONI,
};
