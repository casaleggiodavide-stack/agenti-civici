// Valle d'Aosta: misure regionali verificate il 25/10/2026.

import { VERIFICATO_REGIONI, eur, req, iseeEntro, figlioTra } from '../_comuni.js';

export const vdaAffitto = {
  id: 'vda_sostegno_affitto',
  regione: 'valle_d_aosta',
  nome: 'Contributo regionale per l\'affitto (Valle d\'Aosta)',
  ente: 'Regione autonoma Valle d\'Aosta',
  categoria: 'casa',
  sintesi: 'Contributo sull\'affitto pagato l\'anno prima, fino a 3.000 €, per gli inquilini con ISEE fino a 12.500 €.',
  valuta(s) {
    const affitto = req('Vivi in affitto con contratto registrato', s.casa === null ? null : s.casa !== 'affitto' ? false : s.contrattoRegistrato, s.casa === 'affitto' ? 'contratto_registrato' : 'casa');
    let incidenza = null;
    if (s.casa === 'affitto' && s.isee !== null && s.canoneAnnuo !== null) {
      const ok = (s.isee <= 7500 && s.canoneAnnuo > 0.1 * s.isee) || (s.isee <= 12500 && s.canoneAnnuo > 0.2 * s.isee);
      incidenza = req('L\'affitto supera il 10% dell\'ISEE (fino a 7.500 €) o il 20% (fino a 12.500 €)', ok, 'canone_annuo');
    }
    return {
      requisiti: [affitto, iseeEntro(s, 12500, 'ISEE fino a 12.500 €'), incidenza],
      importo: { breve: 'fino a 3.000 € l\'anno', testo: `Da 80 a 250 € al mese secondo affitto e ISEE: massimo ${eur(3000)} con ISEE fino a 7.500 €, ${eur(2160)} fino a 12.500 €, mai oltre l'80% dell'affitto.`, annuo: s.isee !== null && s.isee <= 7500 ? 1920 : 1440 },
      note: ['Esclusi gli alloggi popolari e i contratti tra parenti fino al secondo grado.', 'Si scala la detrazione per l\'affitto del 730.'],
    };
  },
  finestra: { a: '2026-02-27', testo: 'Il bando per gli affitti 2025 si è chiuso il 27 febbraio 2026. Per gli affitti 2026 si attende una delibera verso novembre 2026, con domande tra gennaio e febbraio 2027.' },
  come: { testo: 'Online su SISLO (sislo.regione.vda.it) con SPID, CNS o CIE, da soli o con un patronato. Numero verde 800 61 00 61.', link: 'https://www.regione.vda.it/allegato.aspx?pk=122658' },
  fonti: [{ titolo: 'Regione Valle d\'Aosta, Bando sostegno alla locazione 2025 (DGR n. 1496 del 21/11/2025)', url: 'https://www.regione.vda.it/allegato.aspx?pk=122449' }],
  verificato: VERIFICATO_REGIONI,
};

export const vdaBorseScuola = {
  id: 'vda_borse_scuola',
  regione: 'valle_d_aosta',
  nome: 'Borse di studio per le spese scolastiche (Valle d\'Aosta)',
  ente: 'Regione autonoma Valle d\'Aosta',
  categoria: 'famiglia',
  sintesi: 'Borsa di almeno 150 € per gli alunni di primaria, secondaria e IeFP con ISEE fino a 21.052,64 €, fino a 600 € con le spese per PC e abbonamenti.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 6, 20, 'Un figlio a scuola (primaria, secondaria o IeFP)'), iseeEntro(s, 21052.64, 'ISEE fino a 21.052,64 €')],
      probabile: true,
      importo: { breve: 'da 150 a 600 €', testo: '150 € senza giustificativi; con spese documentate per PC, tablet o abbonamenti ai mezzi fino a 400 € (primaria), 500 € (media), 600 € (superiore).', unaTantum: 150 },
    };
  },
  finestra: { a: '2026-09-30', testo: 'Il bando 2025-2026 si è chiuso il 30 settembre 2026. Il prossimo è atteso in primavera-estate 2027.' },
  come: { testo: 'Servizio online sul sito della Regione (Istruzione, Borse di studio) con SPID o CIE.', link: 'https://www.regione.vda.it/allegato.aspx?pk=113162' },
  fonti: [{ titolo: 'Regione Valle d\'Aosta, Bando borse di studio per la spesa delle famiglie a.s. 2025-2026', url: 'https://www.regione.vda.it/allegato.aspx?pk=113162' }],
  verificato: VERIFICATO_REGIONI,
};

export const vdaTrasportiOver65 = {
  id: 'vda_trasporti_over65',
  regione: 'valle_d_aosta',
  nome: 'Bus e treno Aosta-Torino gratis o scontati per chi ha 65 anni (Valle d\'Aosta)',
  ente: 'Regione autonoma Valle d\'Aosta',
  categoria: 'anziani',
  sintesi: 'Autobus regionali e treno Aosta-Torino gratis per i residenti di almeno 65 anni con ISEE fino a 20.000 €, scontati dal 22% al 60% sopra quella soglia.',
  valuta(s) {
    const gratis = s.isee !== null && s.isee <= 20000;
    return {
      requisiti: [req('Almeno 65 anni', s.eta === null ? null : s.eta >= 65, 'eta')],
      importo: { breve: gratis ? 'viaggi gratis' : 'gratis o scontati', testo: 'Gratis con ISEE fino a 20.000 €; sconto del 50% (60% sulle linee urbane di Aosta) fino a 26.000 €; oltre, sconto del 22% (25% sul treno, 30% sulle urbane) senza ISEE.', nonSommare: true },
      note: ['Con invalidità di almeno il 67% o Disability Card si viaggia gratis senza ISEE.'],
    };
  },
  finestra: { testo: 'Si può chiedere in ogni momento.' },
  come: { testo: 'Domanda alla struttura regionale trasporti con il modulo, marca da bollo da 16 €, foto e ISEE se fino a 26.000 €. Si riceve la smart card «Biglietto integrato Valle d\'Aosta».', link: 'https://trasporti.regione.vda.it/agevolazioni-tariffarie/persone-di-eta-pari-o-superiore-a-65-anni-e-persone-con-invalidita-disabilita-accertata-2' },
  fonti: [{ titolo: 'Regione Valle d\'Aosta, Agevolazioni per persone di almeno 65 anni e con invalidità', url: 'https://trasporti.regione.vda.it/agevolazioni-tariffarie/persone-di-eta-pari-o-superiore-a-65-anni-e-persone-con-invalidita-disabilita-accertata-2' }],
  verificato: VERIFICATO_REGIONI,
};
