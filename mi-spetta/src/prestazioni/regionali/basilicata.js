// Basilicata: misure regionali verificate il 25/10/2026. Esclusa la borsa ARDSU (dipende dall'ateneo).

import { VERIFICATO_REGIONI, req, iseeEntro } from '../_comuni.js';

export const basilicataBonusGas = {
  id: 'basilicata_bonus_gas',
  regione: 'basilicata',
  nome: 'Bonus gas regionale: materia prima gratis in bolletta (Basilicata)',
  ente: 'Regione Basilicata, con API-Bas',
  categoria: 'casa',
  sintesi: 'La Regione paga in bolletta la componente materia prima del gas per i residenti con contratto domestico sulla casa in cui vivono, senza limiti di ISEE.',
  valuta(s) {
    return {
      requisiti: [req('Hai un contratto gas metano domestico sulla casa in cui risiedi (anche in affitto)', s.utenzeIntestate, 'utenze_intestate')],
      probabile: true,
      importo: { breve: 'materia prima del gas in bolletta', testo: 'Riduzione della componente materia prima (CMEM) sui consumi effettivi; in bolletta compare come «Contributo gas Regione Basilicata legge regionale n. 28/2022». Esclusi GPL e seconde case.', nonSommare: true },
      note: ['Lo applica il venditore aderente. Dal 2025-2026 è chiesta anche una riduzione dei consumi di almeno il 5%.', 'Per chi non l\'aveva mai chiesto, l\'autocertificazione andava presentata entro il 31 dicembre 2025: le regole per il 2026-2027 non sono ancora pubblicate.'],
    };
  },
  finestra: { testo: 'Nessuna domanda annuale: lo applica il venditore. La Regione ha confermato i fondi per il 2026-2028.' },
  come: { testo: 'Tramite la società di vendita aderente; l\'autocertificazione si fa con SPID sul portale bonusgas di API-Bas.', link: 'https://www.regione.basilicata.it/?temi-pgr=autocertificazione-bonus-gas%2Ffaq-bonus-gas' },
  fonti: [
    { titolo: 'Regione Basilicata, Bonus gas: approvato il nuovo disciplinare', url: 'https://www.regione.basilicata.it/bonus-gas-approvato-il-nuovo-disciplinare/' },
    { titolo: 'AGR Basilicata, Assestamento: fondi per il bonus gas (25/9/2026)', url: 'https://agr.regione.basilicata.it/post/assestamento-fondi-per-il-bonus-gas' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const basilicataBonusAcqua = {
  id: 'basilicata_bonus_acqua',
  regione: 'basilicata',
  nome: 'Bonus acqua: 20 metri cubi gratis a persona (Basilicata)',
  ente: 'Regione Basilicata, con Acquedotto Lucano',
  categoria: 'casa',
  sintesi: 'Acqua gratis fino a 20 metri cubi l\'anno per ogni componente della famiglia, con ISEE sotto 30.000 €.',
  valuta(s) {
    return {
      requisiti: [iseeEntro(s, 29999.99, 'ISEE sotto 30.000 €'), req('Hai un\'utenza idrica domestica intestata', s.utenzeIntestate, 'utenze_intestate')],
      importo: { breve: '20 m³ l\'anno gratis a persona', testo: 'Copre quote fisse, acquedotto, fognatura e depurazione fino a 20 metri cubi l\'anno per ogni componente.', nonSommare: true },
    };
  },
  finestra: { testo: 'Confermato dalla manovra 2026-2028; nel 2025 le domande sono partite il 9 aprile. Le date 2026 non sono ancora note.' },
  come: { testo: 'Domanda ad Acquedotto Lucano via WhatsApp (assistente MIA), posta, email o PEC, quando si apre l\'edizione.', link: 'https://www.regione.basilicata.it/presentato-il-bonus-acqua-2025/' },
  fonti: [{ titolo: 'Regione Basilicata, Presentato il Bonus acqua 2025', url: 'https://www.regione.basilicata.it/presentato-il-bonus-acqua-2025/' }],
  verificato: VERIFICATO_REGIONI,
};
