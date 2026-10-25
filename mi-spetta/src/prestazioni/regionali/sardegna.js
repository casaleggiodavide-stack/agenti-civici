// Sardegna: misure regionali verificate il 25/10/2026. I testi delle delibere
// (delibere.regione.sardegna.it/api) sono vietati dal robots.txt.

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

export const sardegnaNidiGratis = {
  id: 'sardegna_nidi_gratis',
  regione: 'sardegna',
  nome: 'Nidi gratis: fino a 200 € al mese (Sardegna)',
  ente: 'Regione Sardegna, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: 'Fino a 200 € al mese per bambino per la parte di retta del nido che il Bonus nido INPS non copre, con ISEE fino a 40.000 €.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 0, 3, 'Un figlio sotto i 3 anni iscritto a un servizio educativo autorizzato'), iseeEntro(s, 40000, 'ISEE per le prestazioni familiari fino a 40.000 €')],
      probabile: true,
      importo: { breve: 'fino a 200 € al mese', testo: 'Fino a 200 € al mese per bambino: retta meno Bonus nido INPS e altri contributi. Se i fondi non bastano hanno priorità gli ISEE sotto 30.000 e 25.000 €.', annuo: 2200 },
      note: ['Serve aver chiesto il Bonus nido INPS.'],
    };
  },
  finestra: { a: '2026-09-25', testo: 'Per il 2026 le domande al Comune si sono chiuse a settembre. La misura si ripete ogni anno.' },
  come: { testo: 'Domanda al Comune in cui si trova il nido.', link: 'https://www.regione.sardegna.it/notizie/nidi-gratis-pubblicato-l-avviso-per-i-fabbisogni-comunali-2026-e-il-monitoraggio-dell-intervento-2025-domande-dal-10-settembre' },
  fonti: [{ titolo: 'Regione Sardegna, Nidi gratis: avviso fabbisogni comunali 2026 (14/8/2026)', url: 'https://www.regione.sardegna.it/notizie/nidi-gratis-pubblicato-l-avviso-per-i-fabbisogni-comunali-2026-e-il-monitoraggio-dell-intervento-2025-domande-dal-10-settembre' }],
  verificato: VERIFICATO_REGIONI,
};

export const sardegnaBonusBebe = {
  id: 'sardegna_bonus_bebe_piccoli_comuni',
  regione: 'sardegna',
  nome: 'Bonus bebè anti-spopolamento: 600 € al mese (Sardegna, Comuni fino a 5.000 abitanti)',
  ente: 'Regione Sardegna, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: 'Assegno mensile di 600 € per il primo figlio e 400 € per i successivi, nati o adottati dal 2024, per chi vive in un Comune sardo sotto i 5.000 abitanti.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 0, 3, 'Un figlio nato o adottato dal 2024'), req('Vivi in un Comune sotto i 5.000 abitanti e ti impegni a restarci 5 anni', null)],
      importo: { breve: '600 € al mese (400 € dal secondo figlio)', testo: '600 € al mese per il primo figlio e 400 € per ciascuno dei successivi. Non serve l\'ISEE.', nonSommare: true },
    };
  },
  finestra: { testo: 'I Comuni pubblicano avvisi a sportello.' },
  come: { testo: 'Domanda al Comune di residenza.', link: 'https://www.regione.sardegna.it/argomenti/argomenti-speciali/misure-anti-spopolamento/bonus-bebe' },
  fonti: [{ titolo: 'Regione Sardegna, Bonus bebè (misure anti-spopolamento)', url: 'https://www.regione.sardegna.it/argomenti/argomenti-speciali/misure-anti-spopolamento/bonus-bebe' }],
  verificato: VERIFICATO_REGIONI,
};

export const sardegnaReis = {
  id: 'sardegna_reis',
  regione: 'sardegna',
  nome: 'REIS, reddito di inclusione sociale (Sardegna)',
  ente: 'Regione Sardegna, tramite i Comuni',
  categoria: 'reddito',
  sintesi: 'Sostegno al reddito regionale per 12 mesi, con un progetto di inclusione, per le famiglie con redditi molto bassi che non ricevono l\'Assegno di inclusione.',
  valuta(s) {
    return {
      requisiti: [s.isee !== null && s.isee > 30000 ? req('Redditi molto bassi: componente reddituale dell\'ISEE (ISRE) fino a 6.500 €', false, 'isee') : req('Redditi molto bassi: componente reddituale dell\'ISEE (ISRE) fino a 6.500 €', null), req('Non ricevi l\'Assegno di inclusione', null)],
      probabile: true,
      importo: { breve: 'contributo mensile per 12 mesi', testo: 'Il Comune calcola il budget del nucleo: nel 2026, 70% contributo economico e 30% progetto di inclusione. Se arriva l\'ADI, il REIS si interrompe.', nonSommare: true },
      note: ['Il requisito vero è sull\'ISRE, non sull\'ISEE: chiedi al CAF di leggerlo nella tua attestazione.'],
    };
  },
  finestra: { a: '2026-06-15', testo: 'Per il 2026 (luglio 2026-giugno 2027) i Comuni hanno raccolto le domande entro metà giugno; alcuni potrebbero riaprire i termini.' },
  come: { testo: 'Domanda al Comune di residenza con il suo avviso REIS.', link: 'https://www.regione.sardegna.it/atti-bandi-archivi/atti-amministrativi/tutti-gli-atti/171593391437261' },
  fonti: [
    { titolo: 'Regione Sardegna, REIS e contrasto alle povertà, programmazione 2024-2026', url: 'https://www.regione.sardegna.it/atti-bandi-archivi/atti-amministrativi/tutti-gli-atti/171593391437261' },
    { titolo: 'Regione Sardegna, REIS 2026: sbloccati i fondi (13/10/2026)', url: 'https://www.regione.sardegna.it/notizie/reis-2026-sbloccati-i-fondi-la-regione-garantisce-tutte-le-risorse' },
  ],
  verificato: VERIFICATO_REGIONI,
};
