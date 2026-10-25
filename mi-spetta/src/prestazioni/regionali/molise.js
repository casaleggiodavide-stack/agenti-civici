// Molise: misure regionali verificate il 25/10/2026. Esclusa la borsa ESU (dipende dall'ateneo).

import { VERIFICATO_REGIONI, req, iseeEntro } from '../_comuni.js';

const M = 'https://www.regione.molise.it/flex/cm/pages';

export const moliseTiMuovi = {
  id: 'molise_ti_muovi',
  regione: 'molise',
  nome: 'Ti Muovi: abbonamento extraurbano rimborsato agli studenti (Molise)',
  ente: 'Regione Molise',
  categoria: 'famiglia',
  sintesi: 'Rimborso dal 25% al 100% dell\'abbonamento a bus e treni extraurbani per gli studenti residenti in Molise tra 11 e 26 anni, in base all\'ISEE.',
  valuta(s) {
    const tu = s.eta !== null && s.eta >= 11 && s.eta <= 26;
    const figlio = s.figli.some((f) => f.anni !== null && f.anni >= 11 && f.anni <= 26);
    const studente = req('Tu o un figlio studiate e avete tra 11 e 26 anni', tu || figlio ? true : s.eta === null || !s.figliRisposta ? null : false, s.eta === null ? 'eta' : 'figli');
    const quota = s.isee === null ? null : s.isee <= 10140 ? 100 : s.isee <= 24000 ? 75 : s.isee <= 30000 ? 50 : 25;
    return {
      requisiti: [studente, iseeEntro(s, 37000, 'ISEE fino a 37.000 €')],
      probabile: true,
      importo: { breve: quota ? `${quota}% dell'abbonamento` : 'dal 25% al 100% dell\'abbonamento', testo: 'Rimborso del 100% con ISEE fino a 10.140 €, 75% fino a 24.000 €, 50% fino a 30.000 €, 25% fino a 37.000 €. Vale per l\'abbonamento extraurbano casa-scuola o casa-università, non per quelli urbani. Si versano 15 € l\'anno non rimborsabili.', nonSommare: true },
      note: ['Esclusi gli iscritti a università telematiche e ai corsi degli enti di formazione professionale.'],
    };
  },
  finestra: { a: '2026-10-31', testo: 'Per l\'anno 2026-2027 le domande si presentano entro il 31 ottobre 2026.' },
  come: { testo: 'Domanda sulla piattaforma regionale con SPID, CIE o CNS (per i minorenni la fa il genitore), poi il pagamento PagoPA di 15 € e l\'acquisto dell\'abbonamento intestato allo studente.', link: `${M}/ServeBLOB.php/L/IT/IDPagina/22409` },
  fonti: [{ titolo: 'Regione Molise, Ti Muovi: agevolazione per gli studenti sul TPL extraurbano', url: `${M}/ServeBLOB.php/L/IT/IDPagina/22409` }],
  verificato: VERIFICATO_REGIONI,
};

export const moliseBonusLibri = {
  id: 'molise_bonus_libri',
  regione: 'molise',
  nome: 'Bonus libri di testo (Molise)',
  ente: 'Regione Molise, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: 'Contributo fino a 300 € per i libri di testo degli studenti di scuola media e superiore con ISEE fino a 15.748,78 €.',
  valuta(s) {
    const figlio = !s.figliRisposta ? null : s.figli.some((f) => f.anni !== null && f.anni >= 10 && f.anni < 20) ? true : s.figli.every((f) => f.anni !== null) ? false : null;
    const fascia = s.isee === null ? null : s.isee <= 10632.94 ? '300 € (medie e primo biennio) o 250 €' : s.isee <= 13800 ? '240 € o 190 €' : '180 € o 130 €';
    return {
      requisiti: [req('Un figlio iscritto alla scuola media o superiore', figlio, 'figli'), iseeEntro(s, 15748.78, 'ISEE fino a 15.748,78 €')],
      probabile: true,
      importo: { breve: fascia ? `fino a ${fascia.split(' ')[0]} €` : 'fino a 300 €', testo: `Con il tuo ISEE: ${fascia || 'da 130 a 300 € secondo l\'ISEE e la classe'}. Sono importi massimi, che si riducono se i fondi non bastano. Non servono le prove di spesa.`, unaTantum: s.isee === null ? 0 : s.isee <= 10632.94 ? 250 : s.isee <= 13800 ? 190 : 130 },
    };
  },
  finestra: { a: '2026-10-15', testo: 'Per il 2026-2027 le scadenze le hanno fissate i Comuni, tutte prima del 15 ottobre 2026. La misura si ripete ogni anno: la prossima delibera è attesa verso settembre 2027.' },
  come: { testo: 'Domanda solo al Comune di residenza dello studente, sul modello regionale, secondo il bando comunale.', link: `${M}/ServeBLOB.php/L/IT/IDPagina/22421` },
  fonti: [{ titolo: 'Regione Molise, Bonus libri di testo 2026-2027 (DGR n. 331 del 16/9/2026)', url: `${M}/ServeBLOB.php/L/IT/IDPagina/22421` }],
  verificato: VERIFICATO_REGIONI,
};
