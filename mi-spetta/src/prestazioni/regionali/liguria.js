// Liguria: misure regionali verificate il 25/10/2026. Il sito della Regione
// vieta tutto nel robots.txt: le regole vengono da ALiSEO e FILSE, enti della Regione.
// Esclusa la borsa universitaria ALiSEO (dipende dall'ateneo).

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

const FILSE = 'https://www.filse.it/it/bandi-attivi-nascosto/publiccompetition/355:bonus-badanti-edizione-2026-prestazioni-integrate-per-la-gravissima-disabilita-edizione-2026-e-bonus-baby-sitter-edizione-2026.html';
const DGR345 = { titolo: 'Regione Liguria, DGR n. 345 del 6/8/2026 (su FILSE)', url: 'https://www.filse.it/components/com_publiccompetitions/includes/download.php?id=3099:deliberazione-della-giunta-regionale-n-345-del-6-agosto-2026.pdf' };

export const liguriaBorseScuola = {
  id: 'liguria_borse_scuola',
  regione: 'liguria',
  nome: 'Borse di studio per rette e libri di testo (Liguria)',
  ente: 'Regione Liguria, tramite ALiSEO e i Comuni',
  categoria: 'famiglia',
  sintesi: 'Rimborso fino al 60% delle spese per rette o contributi di frequenza e per i libri di testo, con ISEE fino a 50.000 € (ridotto per figli e disabilità).',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 6, 20, 'Un figlio a scuola (primaria, secondaria o IeFP)'), iseeEntro(s, 50000, 'ISEE fino a 50.000 € (si tolgono 3.000 € con un altro figlio a carico, 7.000 € con due, 4.000 € per ogni persona con disabilità)')],
      probabile: true,
      importo: { breve: 'fino a 1.300 €', testo: 'Rimborso del 60% della spesa con ISEE sotto 30.000 €, 55% fino a 40.000 €, 50% fino a 50.000 €. Tetti: rette 600 € primaria, 800 € media, 1.100 € superiore; libri 800 e 1.100 €; in tutto non oltre 1.300 €.', nonSommare: true },
    };
  },
  finestra: { a: '2026-11-30', testo: 'Domande fino alle 12 del 30 novembre 2026, per le rette del 2025-2026 e i libri del 2026-2027.' },
  come: { testo: 'Rette: online sullo Sportello scolastico ALiSEO con SPID o CIE. Libri: sui portali dei Comuni a Genova, Savona e La Spezia, altrove con il modulo alla segreteria della scuola.', link: 'https://www.aliseo.liguria.it/benefici-economici-scolastici/borsa-di-studio-scolastica/bando-per-iscrizione-e-frequenza/' },
  fonti: [{ titolo: 'ALiSEO, Modalità operative borse di studio L.R. 15/2006 (2026)', url: 'https://www.aliseo.liguria.it/modalita-operative-borse-di-studio-l-r-iscrizione-e-frequenza-scolastica-a-s-2025-2026-libri-di-testo-a-s-2026-2027/' }],
  verificato: VERIFICATO_REGIONI,
};

export const liguriaBabySitter = {
  id: 'liguria_bonus_baby_sitter',
  regione: 'liguria',
  nome: 'Bonus baby sitter da 350 € al mese (Liguria)',
  ente: 'Regione Liguria, tramite FILSE',
  categoria: 'famiglia',
  sintesi: '350 € al mese per assumere regolarmente una baby sitter, per genitori che lavorano o cercano lavoro, con figli fino a 15 anni e ISEE fino a 35.000 €.',
  valuta(s) {
    const lavoro = s.lavoro === null ? null : !['pensionato', 'casa', 'altro'].includes(s.lavoro);
    return {
      requisiti: [figlioTra(s, 0, 15, 'Un figlio fino a 15 anni (18 se con disabilità)'), iseeEntro(s, 35000, 'ISEE fino a 35.000 €'), req('Lavori o cerchi lavoro', lavoro, 'lavoro')],
      importo: { breve: '350 € al mese', testo: '350 € al mese a rimborso, per fino a 12 mensilità di spese tra il 2026 e il 2027. Un solo bonus per famiglia.', nonSommare: true },
    };
  },
  finestra: { a: '2026-10-15', testo: 'La sesta edizione ha raccolto le domande dal 1° settembre al 15 ottobre 2026. La misura si ripete ogni anno.' },
  come: { testo: 'Online con SPID o CIE su Bandi on line di FILSE. Infobandi 800 940 708.', link: FILSE },
  fonti: [{ titolo: 'FILSE, Bonus badanti, gravissima disabilità e baby sitter edizione 2026', url: FILSE }, DGR345],
  verificato: VERIFICATO_REGIONI,
};

export const liguriaBadanti = {
  id: 'liguria_bonus_badanti',
  regione: 'liguria',
  nome: 'Bonus assistenti familiari da 600 € al mese (Liguria)',
  ente: 'Regione Liguria, tramite FILSE',
  categoria: 'anziani',
  sintesi: '600 € al mese per assumere una badante per una persona con invalidità al 100%, con legge 104 o con più di 95 anni, e ISEE sociosanitario fino a 35.000 €.',
  valuta(s) {
    return {
      requisiti: [req('Nel nucleo c\'è una persona con invalidità al 100%, con legge 104 o con più di 95 anni', s.disabileNucleo, 'disabile_nucleo'), iseeEntro(s, 35000, 'ISEE sociosanitario fino a 35.000 €')],
      probabile: true,
      importo: { breve: '600 € al mese', testo: '600 € al mese a rimborso (250 € per chi riceve il Fondo grave disabilità), fino a 12 mensilità. Per la gravissima disabilità fino a 1.200 € al mese.', nonSommare: true },
    };
  },
  finestra: { a: '2026-10-15', testo: 'La settima edizione ha raccolto le domande dal 1° settembre al 15 ottobre 2026. La misura si ripete ogni anno.' },
  come: { testo: 'Online con SPID o CIE su Bandi on line di FILSE, allegando il verbale INPS.', link: FILSE },
  fonti: [{ titolo: 'FILSE, Bonus badanti, gravissima disabilità e baby sitter edizione 2026', url: FILSE }, DGR345],
  verificato: VERIFICATO_REGIONI,
};
