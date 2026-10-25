// Toscana: misure regionali verificate il 25/10/2026 sugli atti della Regione.

import { VERIFICATO_REGIONI, eur, req, iseeEntro, figlioTra } from '../_comuni.js';

const ATTO_NIDI = { titolo: 'Regione Toscana, Bando Nidi gratis 2026-2027 rivolto alle famiglie', url: 'https://www.regione.toscana.it/it/-/bando-nidi-gratis-2026-2027-per-i-servizi-educativi-rivolto-alle-famiglie' };
const ATTO_NIDI_A = { titolo: 'Decreto n. 9186 del 27/4/2026, Allegato A (avviso alle famiglie)', url: 'https://www301.regione.toscana.it/bancadati/atti/Contenuto.xml?id=5512222&nomeFile=Decreto+n.9186+del+27-04-2026-+Allegato+A+' };
const ATTO_NIDI_RIAP = { titolo: 'Decreto n. 19629 del 3/9/2026, Allegato A (riapertura)', url: 'https://www301.regione.toscana.it/bancadati/atti/Contenuto.xml?id=5529606&nomeFile=Decreto+n.19629+del+03-09-2026-+Allegato+A+' };

export const toscanaNidiGratis = {
  id: 'toscana_nidi_gratis',
  regione: 'toscana',
  nome: 'Nidi gratis (Toscana)',
  ente: 'Regione Toscana',
  categoria: 'famiglia',
  sintesi: 'Sconto regionale sulla retta del nido per i bambini da 0 a 3 anni residenti in Toscana: insieme al Bonus nido INPS azzera rette fino a 800 € al mese.',
  valuta(s) {
    return {
      requisiti: [
        figlioTra(s, 0, 3, 'Un figlio tra 0 e 3 anni, residente in Toscana'),
        iseeEntro(s, 40000, 'ISEE fino a 40.000 € (ISEE per le prestazioni familiari e l\'inclusione)'),
      ],
      // Serve un posto già assegnato in un nido dell'elenco regionale: non lo chiediamo.
      probabile: true,
      importo: { breve: 'fino a 527,27 € al mese', testo: `Sconto in retta fino a ${eur(527.27)} al mese per 11 mesi, per la parte di retta che il Bonus nido INPS non copre, fino a una retta di 800 €. Con la domanda di ottobre lo sconto parte da dicembre 2026.`, nonSommare: true },
      note: [
        'Serve un posto assegnato in un nido comunale o privato accreditato dell\'elenco regionale.',
        'La domanda la presenta il genitore che ha chiesto il Bonus nido INPS: il bonus INPS viene comunque scalato dalla retta.',
        'Non si somma alla detrazione fiscale delle rette del nido.',
      ],
    };
  },
  finestra: { a: '2026-10-26', testo: 'Riapertura dal 12 al 26 ottobre 2026, fino alle 18. Il prossimo bando è atteso in primavera 2027.' },
  come: { testo: 'Solo online sull\'applicativo regionale con SPID, CIE o CNS, una domanda per ogni figlio. Informazioni: nidigratis@regione.toscana.it.', link: 'https://www.regione.toscana.it/scuola/app-NidiGratis' },
  fonti: [ATTO_NIDI, ATTO_NIDI_A, ATTO_NIDI_RIAP],
  verificato: VERIFICATO_REGIONI,
};

const CLASSI_LIBRI = 'prima media 309 €, seconda e terza media 137 €, prima e terza superiore 348 €, seconda 204 €, quarta e quinta 251 €';

export const toscanaLibriGratis = {
  id: 'toscana_libri_gratis',
  regione: 'toscana',
  nome: 'Libri gratis (Toscana)',
  ente: 'Regione Toscana',
  categoria: 'famiglia',
  sintesi: 'Contributo a importo fisso per i libri di testo degli studenti di scuola media e superiore residenti in Toscana con ISEE fino a 15.800 €.',
  valuta(s) {
    return {
      requisiti: [
        figlioTra(s, 10, 24, 'Un figlio studente di scuola media o superiore, con meno di 24 anni'),
        iseeEntro(s, 15800, 'ISEE fino a 15.800 €'),
      ],
      probabile: true,
      importo: { breve: 'da 137 a 348 € per studente', testo: `Importo fisso per classe: ${CLASSI_LIBRI}. Graduatoria per ISEE crescente fino a esaurimento dei fondi.`, unaTantum: 250 },
      note: ['Il contributo dipende dalla graduatoria e dai fondi stanziati.', 'Non si somma ad altri contributi per i libri di testo.'],
    };
  },
  finestra: { a: '2026-10-22', testo: 'Per l\'anno scolastico 2026-2027 le domande si sono chiuse il 22 ottobre 2026. Il prossimo bando è atteso a maggio-giugno 2027.' },
  come: { testo: 'Solo online sull\'applicativo regionale con SPID, CIE o CNS. Assistenza al numero verde Giovanisì 800 098719.', link: 'https://servizi.toscana.it/RT/librigratis' },
  fonti: [
    { titolo: 'Regione Toscana, Bando Libri gratis a.s. 2026-2027', url: 'https://www.regione.toscana.it/-/bando-libri-gratis-anno-scolastico-2026-2027-contributi-per-l-acquisto-di-libri' },
    { titolo: 'Decreto n. 10526 del 14/5/2026, Allegato A (avviso)', url: 'https://www301.regione.toscana.it/bancadati/atti/Contenuto.xml?id=5514398&nomeFile=Decreto+n.10526+del+14-05-2026-+Allegato+A+' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const toscanaTplIsee = {
  id: 'toscana_tpl_isee',
  regione: 'toscana',
  nome: 'Abbonamenti di bus e treni regionali a tariffa ISEE (Toscana)',
  ente: 'Regione Toscana',
  categoria: 'casa',
  sintesi: 'Con ISEE sotto 36.151,98 € gli abbonamenti mensili e annuali di bus e treni regionali costano circa il 20% in meno.',
  valuta(s) {
    return {
      requisiti: [iseeEntro(s, 36151.97, 'ISEE inferiore a 36.151,98 €')],
      importo: { breve: 'circa il 20% in meno', testo: 'Niente aumento tariffario regionale del 20% sugli abbonamenti mensili e annuali di treni regionali, Pegaso e bus. Il risparmio dipende dalla tratta.', nonSommare: true },
      note: ['Vale solo per gli abbonamenti, non per i biglietti singoli.', 'Il tagliando ISEE-TPL vale fino al 19 marzo dell\'anno successivo.'],
    };
  },
  finestra: { testo: 'Sempre attiva, con un ISEE valido.' },
  come: { testo: 'Scarica il tagliando ISEE-TPL nominativo, uno per ogni componente della famiglia, e mostralo quando compri l\'abbonamento. Aiutano gli URP e i Punti digitali facili.', link: 'https://servizi.toscana.it/tpl/isee-fe/' },
  fonti: [{ titolo: 'Regione Toscana, Abbonamenti ed agevolazioni ISEE', url: 'https://www.regione.toscana.it/abbonamenti-ed-agevolazioni-isee' }],
  verificato: VERIFICATO_REGIONI,
};
