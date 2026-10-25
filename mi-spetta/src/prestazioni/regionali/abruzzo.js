// Abruzzo: misure regionali verificate il 25/10/2026. Gran parte del sito
// regionale (www2.regione.abruzzo.it) è vietata dal robots.txt: le regole vengono
// dagli atti su trasparenza, BURAT, coesione e dal gestore TUA.
// Esclusa la borsa ADSU (dipende dall'ateneo; ADSU Chieti-Pescara vieta gli agenti Anthropic).

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

export const abruzzoVacanzeStudio = {
  id: 'abruzzo_vacanze_studio',
  regione: 'abruzzo',
  nome: 'Voucher fino a 4.000 € per una vacanza studio all\'estero (Abruzzo, scuole medie)',
  ente: 'Regione Abruzzo, tramite le scuole',
  categoria: 'famiglia',
  sintesi: 'Voucher fino a 4.000 € per una vacanza studio di lingua all\'estero nell\'estate 2027, per gli studenti delle medie senza insufficienze e con ISEE fino a 35.000 €.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 10, 15, 'Un figlio iscritto alla scuola media in Abruzzo, senza insufficienze a giugno 2026'), iseeEntro(s, 35000, 'ISEE fino a 35.000 €')],
      probabile: true,
      importo: { breve: 'fino a 4.000 €', testo: 'Rimborso dei costi reali fino a 4.000 € (corso, viaggio, vitto, alloggio) per un soggiorno di almeno 7 giorni tra giugno e settembre 2027. Graduatoria della scuola per ISEE crescente.', nonSommare: true },
      note: ['La domanda la presenta la scuola: chiedi in segreteria, che può avere un termine interno prima del 3 novembre.'],
    };
  },
  finestra: { a: '2026-11-03', testo: 'Le scuole presentano le richieste dal 15 ottobre al 3 novembre 2026.' },
  come: { testo: 'Manifesta l\'interesse alla segreteria della scuola media: la scuola raccoglie le richieste e fa domanda sullo Sportello digitale della Regione.', link: 'https://coesione.regione.abruzzo.it/sites/coesione.regione.abruzzo.it/files/allegati/1372/2026-07-31/allegato-avviso-vacanze-studio.pdf' },
  fonti: [{ titolo: 'Regione Abruzzo, Avviso voucher per vacanze studio all\'estero (DPG021/189 del 31/7/2026)', url: 'https://coesione.regione.abruzzo.it/sites/coesione.regione.abruzzo.it/files/allegati/1372/2026-07-31/allegato-avviso-vacanze-studio.pdf' }],
  verificato: VERIFICATO_REGIONI,
};

export const abruzzoNatalitaMontagna = {
  id: 'abruzzo_natalita_montagna',
  regione: 'abruzzo',
  nome: 'Assegno di natalità nei piccoli Comuni di montagna (Abruzzo)',
  ente: 'Regione Abruzzo',
  categoria: 'famiglia',
  sintesi: 'Fino a 2.500 € l\'anno per ogni figlio fino ai 3 anni alle famiglie che vivono in un piccolo Comune montano dell\'elenco regionale.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 0, 4, 'Un figlio fino a 3 anni'), req('Vivi in un piccolo Comune montano dell\'elenco regionale', null)],
      importo: { breve: 'fino a 2.500 € l\'anno per figlio', testo: 'Fino a 2.500 € l\'anno per figlio fino ai 3 anni, con priorità per i minori con disabilità grave, le famiglie con un solo genitore e quelle con più figli. Non serve l\'ISEE.', nonSommare: true },
      note: ['L\'elenco dei Comuni (montani sotto i 3.000 abitanti in calo demografico) si aggiorna ogni anno.'],
    };
  },
  finestra: { a: '2026-10-23', testo: 'L\'avviso 2026 (nati nel 2022, 2023 e 2024) si è chiuso il 23 ottobre 2026. La misura si ripete ogni anno dal 2022.' },
  come: { testo: 'Domanda online sullo Sportello digitale della Regione Abruzzo con SPID o CIE.', link: 'https://sportello.regione.abruzzo.it/' },
  fonti: [{ titolo: 'Regione Abruzzo, Criteri e modalità dell\'assegno di natalità (DPG023/96 del 17/7/2025)', url: 'https://trasparenza.regione.abruzzo.it/sovvenzioni-contributi-sussidi-vantaggi-economici/criteri-modalita/avviso-contenente-i-criteri-le' }],
  verificato: VERIFICATO_REGIONI,
};

export const abruzzoTuaIsee = {
  id: 'abruzzo_tua_isee',
  regione: 'abruzzo',
  nome: 'Abbonamenti TUA scontati del 10% (Abruzzo)',
  ente: 'Regione Abruzzo, con TUA',
  categoria: 'casa',
  sintesi: 'Sconto del 10% sugli abbonamenti mensili dei bus extraurbani TUA con ISEE fino a 10.000 €.',
  valuta(s) {
    return {
      requisiti: [iseeEntro(s, 10000, 'ISEE fino a 10.000 €')],
      importo: { breve: '10% di sconto', testo: 'Sconto del 10% sugli abbonamenti mensili. Per il 2026-2027 c\'è anche il 10% per gli studenti di 11-26 anni residenti nei Comuni sotto i 5.000 abitanti o montani delle aree interne.', nonSommare: true },
    };
  },
  finestra: { testo: 'Sempre attivo.' },
  come: { testo: 'Attiva il profilo ISEE sull\'app o sul portale TuaGO, oppure in biglietteria con documento e ISEE. Numero verde 800 14 28 80.', link: 'https://www.tuabruzzo.it/sistema-tariffario/utenti-isee-con-reddito-pari-o-inferiore-a-10-000/55-23.html' },
  fonti: [{ titolo: 'TUA, Agevolazione ISEE sugli abbonamenti mensili', url: 'https://www.tuabruzzo.it/sistema-tariffario/utenti-isee-con-reddito-pari-o-inferiore-a-10-000/55-23.html' }],
  verificato: VERIFICATO_REGIONI,
};
