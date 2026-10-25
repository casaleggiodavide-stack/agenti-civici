// Campania: misure regionali verificate il 25/10/2026. Esclusa la borsa ADISURC (dipende dall'ateneo).
// Il sito di UnicoCampania vieta tutto nel robots.txt: date e modulo non verificati lì.

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

export const campaniaStudentiTpl = {
  id: 'campania_abbonamento_studenti',
  regione: 'campania',
  nome: 'Abbonamento gratuito a bus e treni per gli studenti (Campania)',
  ente: 'Regione Campania',
  categoria: 'famiglia',
  sintesi: 'Abbonamento annuale gratis sui mezzi pubblici regionali per il tragitto casa-scuola o casa-università, per gli studenti da 11 a 26 anni con ISEE fino a 35.000 €.',
  valuta(s) {
    const tu = s.eta !== null && s.eta >= 11 && s.eta <= 26 && s.lavoro === 'studente';
    const figlio = s.figli.some((f) => f.anni !== null && f.anni >= 11 && f.anni <= 26);
    return {
      requisiti: [req('Tu o un figlio studiate e avete tra 11 e 26 anni', tu || figlio ? true : s.figliRisposta && s.eta !== null ? false : null, 'figli'), iseeEntro(s, 35000, 'ISEE fino a 35.000 €')],
      probabile: true,
      importo: { breve: 'abbonamento annuale gratis', testo: 'Abbonamento annuale gratuito sul trasporto pubblico regionale, solo per il percorso casa-scuola o casa-università.', nonSommare: true },
    };
  },
  finestra: { testo: 'Programma confermato per il 2026-2027 (DGR 383 del 16/7/2026); si chiede sulla piattaforma di UnicoCampania.' },
  come: { testo: 'Richiesta sulla piattaforma del Consorzio UnicoCampania creando una tessera digitale (per i minori la registra un genitore).', link: 'https://www.regione.campania.it/regione-informa/notizie/trasporto-gratuito-studenti-confermato-programma-l-anno-scolastico-accademico-2026-2027' },
  fonti: [{ titolo: 'Regione Campania, Trasporto gratuito per gli studenti: confermato il programma 2026-2027', url: 'https://www.regione.campania.it/regione-informa/notizie/trasporto-gratuito-studenti-confermato-programma-l-anno-scolastico-accademico-2026-2027' }],
  verificato: VERIFICATO_REGIONI,
};

export const campaniaVoucherNidi = {
  id: 'campania_voucher_nidi',
  regione: 'campania',
  nome: 'Voucher per il nido fino a 3.000 € (Campania)',
  ente: 'Regione Campania',
  categoria: 'famiglia',
  sintesi: 'Rimborso della retta del nido, al netto del Bonus nido INPS, fino a 3.000 € l\'anno con ISEE fino a 15.000 €, fino a 1.500 € con ISEE fino a 45.000 €.',
  valuta(s) {
    const tetto = s.isee === null ? null : s.isee <= 15000 ? 3000 : s.isee <= 30000 ? 2500 : 1500;
    return {
      requisiti: [figlioTra(s, 0, 3, 'Un figlio tra 0 e 36 mesi iscritto a un nido autorizzato'), iseeEntro(s, 45000, 'ISEE minorenni fino a 45.000 €')],
      probabile: true,
      importo: { breve: tetto ? `fino a ${tetto.toLocaleString('it-IT')} € l'anno` : 'fino a 3.000 € l\'anno', testo: 'Fino a 3.000 € l\'anno con ISEE fino a 15.000 €, 2.500 € fino a 30.000 €, 1.500 € fino a 45.000 €; mai oltre la retta pagata meno il Bonus nido INPS.', nonSommare: true },
    };
  },
  finestra: { a: '2026-04-23', testo: 'L\'avviso 2025-2026 ha raccolto le domande dal 9 marzo al 23 aprile 2026. Per il 2026-2027 non risulta ancora un avviso.' },
  come: { testo: 'Servizio digitale VoucherAsili della Regione, con SPID o CIE.', link: 'https://servizi-digitali.regione.campania.it/VoucherAsili' },
  fonti: [{ titolo: 'FSE Campania, Voucher per l\'accesso ai nidi 2025-2026 (DD n. 44 del 27/2/2026)', url: 'https://fse.regione.campania.it/voucher-per-laccesso-ai-nidi-anno-2025-2026-avviso/' }],
  verificato: VERIFICATO_REGIONI,
};
