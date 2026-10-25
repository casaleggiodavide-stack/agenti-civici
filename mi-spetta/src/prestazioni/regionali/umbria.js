// Umbria: misure regionali verificate il 25/10/2026.
// Escluse: borsa ADiSU (dipende dall'ateneo); 1.200 € alle madri (avviso 2025 chiuso, nessuna edizione 2026).

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

export const umbriaVaiStudenti = {
  id: 'umbria_vai_studenti',
  regione: 'umbria',
  nome: 'Umbria Vai: abbonamento bus annuale a 70 € per gli studenti',
  ente: 'Regione Umbria, con Busitalia',
  categoria: 'famiglia',
  sintesi: 'Gli studenti di scuola media, superiore e IeFP residenti in Umbria con ISEE fino a 30.000 € pagano 70 € l\'abbonamento annuale su tutte le tratte.',
  valuta(s) {
    return {
      requisiti: [
        figlioTra(s, 10, 20, 'Un figlio iscritto alla scuola media, superiore o a un corso IeFP'),
        iseeEntro(s, 30000, 'ISEE fino a 30.000 €'),
      ],
      probabile: true,
      importo: { breve: 'abbonamento annuale a 70 €', testo: 'Abbonamento annuale scolastico a 70 €, valido fino al 31 agosto 2027 su tutte le tratte urbane ed extraurbane. La differenza la paga la Regione. Un abbonamento per ogni studente.', nonSommare: true },
      note: ['Si compra solo online, non in biglietteria.', 'Non è rimborsabile.'],
    };
  },
  finestra: { a: '2027-05-31', testo: 'Acquisto online dal 27 agosto 2026 al 31 maggio 2027, senza graduatoria.' },
  come: { testo: 'Su TPLWEB di Busitalia: abbonamento annuale scolastico, profilo «Annuale Scolastico Agevolato», con il numero di protocollo dell\'ISEE e una fototessera. Il titolo compare nell\'app SALGO.', link: 'https://www.fsbusitalia.it/it/umbria/abbonamenti-scolastici-annuali-umbria/abbonamento-annuale-scolastico-agevolato.html' },
  fonti: [
    { titolo: 'Busitalia Umbria, Abbonamento annuale scolastico agevolato a 70 €', url: 'https://www.fsbusitalia.it/it/umbria/abbonamenti-scolastici-annuali-umbria/abbonamento-annuale-scolastico-agevolato.html' },
    { titolo: 'Regione Umbria, Agenzia Umbria Notizie del 27/8/2026: a scuola e all\'università con Umbria Vai', url: 'https://www.regione.umbria.it/ufficio-stampa/agenzia-umbria-notizie/-/asset_publisher/lU1Y2yh4H8pu/content/id/26445867' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const umbriaPerTutti = {
  id: 'umbria_per_tutti',
  regione: 'umbria',
  nome: 'Umbria per tutti: contributo per l\'assistenza alla disabilità grave',
  ente: 'Regione Umbria, tramite le USL',
  categoria: 'salute',
  sintesi: '300 € al mese, fino a 1.200 € l\'anno, a chi ha una disabilità grave riconosciuta, per assistenti personali, assistenza a domicilio, affitto per la vita autonoma o ausili.',
  valuta(s) {
    return {
      requisiti: [
        req('Nel nucleo c\'è una persona con disabilità grave (legge 104, art. 3, comma 3)', s.disabileNucleo, 'disabile_nucleo'),
        iseeEntro(s, 50000, 'ISEE sociosanitario fino a 50.000 € (65.000 € per i minorenni)'),
      ],
      probabile: true,
      importo: { breve: '300 € al mese, fino a 1.200 €', testo: '300 € al mese fino a 1.200 € per l\'annualità 2025, per spese di assistenza, affitto per la vita autonoma o ausili.', nonSommare: true },
      note: ['Serve il riconoscimento di disabilità grave, non basta un\'invalidità.'],
    };
  },
  finestra: { a: '2026-03-31', testo: 'L\'avviso per le spese 2025 si è chiuso il 31 marzo 2026. Al 25 ottobre 2026 non risulta un avviso per il 2026.' },
  come: { testo: 'Domanda solo via PEC alla propria USL (Umbria 1 o Umbria 2), agli indirizzi indicati nell\'avviso.', link: 'https://insalute.regione.umbria.it/novita/umbria-per-tutti-prorogato-al-31-marzo-2026-il-termine-per-presentare-domanda-di-contributo-per-lassistenza-alle-persone-con-grave-disabilita/' },
  fonti: [{ titolo: 'Regione Umbria inSalute, Umbria per tutti: termine prorogato al 31 marzo 2026', url: 'https://insalute.regione.umbria.it/novita/umbria-per-tutti-prorogato-al-31-marzo-2026-il-termine-per-presentare-domanda-di-contributo-per-lassistenza-alle-persone-con-grave-disabilita/' }],
  verificato: VERIFICATO_REGIONI,
};
