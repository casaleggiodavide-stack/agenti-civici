// Puglia: misure regionali verificate il 25/10/2026.
// Esclusi: borse ADISU (dipendono dall'ateneo); Reddito di dignità (ultimo avviso nel 2023).

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

export const pugliaBonusTrasporti = {
  id: 'puglia_bonus_trasporti_studenti',
  regione: 'puglia',
  nome: 'Bonus trasporti per gli studenti pendolari (Puglia)',
  ente: 'Regione Puglia',
  categoria: 'famiglia',
  sintesi: 'Sconto del 50% sugli abbonamenti mensili a bus e treni interurbani per gli studenti pendolari di superiori, ITS e università con ISEE fino a 13.000 €.',
  valuta(s) {
    const tu = s.eta !== null && s.eta >= 14 && s.eta <= 30 && s.lavoro === 'studente';
    const figlio = s.figli.some((f) => f.anni !== null && f.anni >= 14 && f.anni <= 26);
    const soglia = s.nFigli >= 3 ? 15748.78 : 13000;
    return {
      requisiti: [req('Tu o un figlio siete studenti pendolari (superiori, ITS, università)', tu || figlio ? true : s.figliRisposta && s.eta !== null ? false : null, 'figli'), iseeEntro(s, soglia, 'ISEE fino a 13.000 € (15.748,78 € con 3 o più figli)')],
      probabile: true,
      importo: { breve: '50% di sconto sugli abbonamenti', testo: 'Sconto del 50% sugli abbonamenti mensili al trasporto interurbano da ottobre 2026 a maggio 2027, fino a esaurimento delle risorse.', nonSommare: true },
    };
  },
  finestra: { a: '2026-10-25', testo: 'Domande dal 15 settembre al 25 ottobre 2026.' },
  come: { testo: 'Online sul portale Studio in Puglia; poi si compra l\'abbonamento scontato con il codice bonus.', link: 'https://www.studioinpuglia.regione.puglia.it/studenti-pendolari' },
  fonti: [{ titolo: 'Regione Puglia, Bonus trasporti studenti 2026-2027 (16/9/2026)', url: 'https://www.regione.puglia.it/web/lavoro-e-formazione/-/bonus-trasporti-studenti-2026-2027' }],
  verificato: VERIFICATO_REGIONI,
};

export const pugliaBuoniNido = {
  id: 'puglia_buoni_educativi_0_3',
  regione: 'puglia',
  nome: 'Buoni educativi per il nido (Puglia)',
  ente: 'Regione Puglia',
  categoria: 'famiglia',
  sintesi: 'Buono che copre la retta dei nidi e dei servizi 0-3 accreditati: la famiglia paga solo una quota fissa secondo l\'ISEE, fino a 75.000 €.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 0, 3, 'Un figlio tra 0 e 3 anni iscritto a un servizio del catalogo regionale'), iseeEntro(s, 75000, 'ISEE fino a 75.000 €')],
      probabile: true,
      importo: { breve: 'retta coperta, meno una quota fissa', testo: 'Il buono vale il costo standard del servizio meno una quota a carico della famiglia che cresce con l\'ISEE. Si somma al Bonus nido INPS solo per la quota a carico della famiglia.', nonSommare: true },
    };
  },
  finestra: { a: '2026-08-28', testo: 'Per l\'anno 2026-2027 le domande si sono chiuse il 28 agosto 2026. L\'avviso è annuale, di solito a luglio.' },
  come: { testo: 'Online sulla piattaforma Studio in Puglia, sezione zerosei.', link: 'https://www.studioinpuglia.regione.puglia.it/zerosei' },
  fonti: [{ titolo: 'Regione Puglia, Buoni educativi 0-3 anni 2026-2027 (30/7/2026)', url: 'https://press.regione.puglia.it/-/buoni-educativi-0-3-anni-pubblicato-l-avviso-rivolto-alle-famiglie-per-l-anno-educativo-2026-2027.-da-oggi-il-via-alla-presentazione-delle-istanze' }],
  verificato: VERIFICATO_REGIONI,
};

export const pugliaBuoniMinori = {
  id: 'puglia_buoni_servizio_minori',
  regione: 'puglia',
  nome: 'Buoni servizio per centri diurni e ludoteche (Puglia)',
  ente: 'Regione Puglia',
  categoria: 'famiglia',
  sintesi: 'Buono che abbassa la retta di centri diurni, ludoteche e centri polivalenti per i ragazzi da 3 a 17 anni, con ISEE minorenni fino a 20.000 €.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 3, 18, 'Un figlio tra 3 e 17 anni'), iseeEntro(s, 20000, 'ISEE minorenni fino a 20.000 €')],
      probabile: true,
      importo: { breve: 'fino a 630 € al mese', testo: 'Massimali: centro diurno da 450 a 630 € al mese, centro polivalente 440 €, ludoteca 13 € al giorno; il contributo varia con l\'ISEE.', nonSommare: true },
    };
  },
  finestra: { a: '2026-07-17', testo: 'Per il 2026-2027 le domande si sono chiuse il 17 luglio 2026.' },
  come: { testo: 'Online sulla piattaforma bandi di PugliaSociale.', link: 'https://www.regione.puglia.it/web/welfare-diritti-e-cittadinanza/-/nuovo-avviso-buoni-servizio-minori.-domande-dal-29-giugno-2026-al-17-luglio-2026' },
  fonti: [{ titolo: 'Regione Puglia, Nuovo avviso Buoni servizio minori (DD 146/620 del 19/6/2026)', url: 'https://www.regione.puglia.it/web/welfare-diritti-e-cittadinanza/-/nuovo-avviso-buoni-servizio-minori.-domande-dal-29-giugno-2026-al-17-luglio-2026' }],
  verificato: VERIFICATO_REGIONI,
};
