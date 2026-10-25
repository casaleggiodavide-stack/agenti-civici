// Calabria: misure regionali verificate il 25/10/2026.

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

export const calabriaCasaPerTutti = {
  id: 'calabria_una_casa_per_tutti',
  regione: 'calabria',
  nome: 'Una casa per tutti: contributo affitto fino a 300 € al mese (Calabria)',
  ente: 'Regione Calabria, tramite i Comuni capofila di Ambito',
  categoria: 'casa',
  sintesi: 'Fino a 300 € al mese, massimo 3.600 €, per chi vive in affitto con contratto registrato e ha un ISEE fino a 17.000 €.',
  valuta(s) {
    const affitto = req('Vivi in affitto con contratto registrato', s.casa === null ? null : s.casa !== 'affitto' ? false : s.contrattoRegistrato, s.casa === 'affitto' ? 'contratto_registrato' : 'casa');
    const stima = s.canoneAnnuo ? Math.min(3600, s.canoneAnnuo) : null;
    return {
      requisiti: [affitto, iseeEntro(s, 17000, 'ISEE fino a 17.000 €')],
      probabile: true,
      importo: { breve: 'fino a 300 € al mese', testo: 'Fino a 300 € al mese nel limite dell\'affitto, al massimo 3.600 €; 50 € in più con una persona con disabilità se l\'affitto supera 300 €. Graduatoria per ISEE crescente.', annuo: stima || 0 },
      note: ['Non si somma con la quota affitto dell\'Assegno di inclusione.', 'Ogni Ambito pubblica il proprio avviso con date e fondi.'],
    };
  },
  finestra: { testo: 'Ogni Ambito territoriale sociale pubblica il proprio avviso sul modello regionale di gennaio 2026: controlla il sito del Comune capofila.' },
  come: { testo: 'Domanda al Comune capofila dell\'Ambito territoriale sociale, secondo il suo avviso.', link: 'https://www.regione.calabria.it/wp-content/uploads/2026/02/Format-Avviso-1.pdf', etichettaLink: 'Modello regionale dell\'avviso' },
  fonti: [{ titolo: 'Regione Calabria, Una casa per tutti: modello di avviso per i Comuni capofila (gennaio 2026)', url: 'https://www.regione.calabria.it/wp-content/uploads/2026/02/Format-Avviso-1.pdf' }],
  verificato: VERIFICATO_REGIONI,
};

export const calabriaPassoInPiu = {
  id: 'calabria_un_passo_in_piu',
  regione: 'calabria',
  nome: 'Un passo in più: fino a 10.000 € per donne con tumore e caregiver (Calabria)',
  ente: 'Regione Calabria',
  categoria: 'salute',
  sintesi: 'Contributo una tantum da 8.000 a 10.000 € per spese di cura, assistenza e viaggio delle donne con una patologia oncologica o dei loro caregiver familiari, con ISEE sotto 35.000 €.',
  valuta(s) {
    return {
      requisiti: [req('Sei una donna con una patologia oncologica, o assisti un familiare a carico che ce l\'ha', null), iseeEntro(s, 34999.99, 'ISEE sotto 35.000 €')],
      importo: { breve: 'da 8.000 a 10.000 €', testo: '10.000 € con ISEE fino a 25.000 €, 8.000 € fino a 35.000 €, per spese dal 1° gennaio 2025: mediche non coperte dal servizio sanitario, assistenza, viaggi, vitto e alloggio.', nonSommare: true },
      note: ['Sportello in ordine di arrivo fino a esaurimento dei 2,5 milioni.'],
    };
  },
  finestra: { testo: 'Sportello aperto dal 18 marzo 2026 fino a esaurimento delle risorse.' },
  come: { testo: 'Solo online sul sito dedicato della misura.', link: 'https://calabriaeuropa.regione.calabria.it/pubblicato-lavviso-un-passo-in-piu-sostegno-economico-per-le-donne-con-patologie-oncologiche-e-le-caregiver/' },
  fonti: [{ titolo: 'Calabria Europa, Pubblicato l\'avviso «Un passo in più»', url: 'https://calabriaeuropa.regione.calabria.it/pubblicato-lavviso-un-passo-in-piu-sostegno-economico-per-le-donne-con-patologie-oncologiche-e-le-caregiver/' }],
  verificato: VERIFICATO_REGIONI,
};

export const calabriaSezioniPrimavera = {
  id: 'calabria_sezioni_primavera',
  regione: 'calabria',
  nome: 'Sezioni primavera gratuite per i bambini di 2 anni (Calabria)',
  ente: 'Regione Calabria',
  categoria: 'famiglia',
  sintesi: 'Sezione primavera gratis per i bambini tra 2 e 3 anni con ISEE minorenni fino a 40.000 €: la Regione paga direttamente il gestore.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 2, 3, 'Un figlio tra 2 e 3 anni'), iseeEntro(s, 40000, 'ISEE minorenni fino a 40.000 €')],
      probabile: true,
      importo: { breve: 'servizio gratuito', testo: 'Gratuità del servizio educativo di base nelle sezioni primavera accreditate per gli anni 2026-2029; la Regione paga al gestore fino a 5.346 € per bambino.', nonSommare: true },
    };
  },
  finestra: { testo: 'Avviso in pre-informazione dal 24 settembre 2026: la domanda la presenta il gestore, quando si apre lo sportello.' },
  come: { testo: 'Iscrivi il bambino a una sezione primavera accreditata e chiedi al gestore se aderisce.', link: 'https://calabriaeuropa.regione.calabria.it/servizi-educativi-qualita-sezioni-primavera-calabria/' },
  fonti: [{ titolo: 'Calabria Europa, Servizi educativi per la prima infanzia: avviso in pre-informazione', url: 'https://calabriaeuropa.regione.calabria.it/servizi-educativi-qualita-sezioni-primavera-calabria/' }],
  verificato: VERIFICATO_REGIONI,
};
