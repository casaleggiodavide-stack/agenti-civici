// Emilia-Romagna: misure regionali verificate il 25/10/2026.

import { VERIFICATO_REGIONI, eur, req, iseeEntro, figlioTra } from '../_comuni.js';

export const erSaltaSu = {
  id: 'er_salta_su',
  regione: 'emilia_romagna',
  nome: 'Salta su!: abbonamento bus e treno casa-scuola gratis (Emilia-Romagna)',
  ente: 'Regione Emilia-Romagna',
  categoria: 'famiglia',
  sintesi: 'Abbonamento annuale gratuito a bus e treni regionali per il tragitto casa-scuola: senza ISEE per elementari e medie, con ISEE fino a 30.000 € e 15 € di quota per superiori e IeFP.',
  valuta(s) {
    const noti = s.figli.filter((f) => f.anni !== null);
    const piccoli = noti.some((f) => f.anni >= 5 && f.anni < 14);
    const grandi = noti.some((f) => f.anni >= 14 && f.anni <= 20);
    const figlio = figlioTra(s, 5, 21, 'Un figlio a scuola (elementari, medie, superiori o IeFP), nato tra il 2006 e il 2020');
    const isee = piccoli ? null : grandi ? iseeEntro(s, 30000, 'Per superiori e IeFP: ISEE fino a 30.000 €') : null;
    return {
      requisiti: [figlio, isee],
      importo: { breve: 'abbonamento annuale gratis', testo: `Abbonamento personale dal 1° settembre 2026 al 31 agosto 2027 sul percorso casa-scuola, anche con più aziende. Nelle 13 città con servizio urbano vale anche nel tempo libero. ${grandi ? 'Per superiori e IeFP si pagano 15 € di quota. ' : ''}La Regione stima un risparmio tra 300 e 600 € a figlio.`, annuo: 300 },
      note: ['Le primarie residenti in 16 città ricevono la tessera a casa senza domanda.'],
    };
  },
  finestra: { a: '2026-12-18', testo: 'Domande per l\'anno scolastico 2026-2027 fino alle 14 del 18 dicembre 2026. La misura è confermata anche per il 2027-2028.' },
  come: { testo: 'Online sulla piattaforma regionale con SPID o CIE di un genitore. Servono fototessera e numero della tessera Mi Muovo (o app Roger per il treno). Numero verde 800 388988.', link: 'https://mobilita.regione.emilia-romagna.it/saltasu/come-fare-la-richiesta-di-abbonamento-salta-su' },
  fonti: [
    { titolo: 'Regione Emilia-Romagna, Salta su!', url: 'https://mobilita.regione.emilia-romagna.it/saltasu' },
    { titolo: 'Salta su!, iscritti alle scuole superiori e IeFP', url: 'https://mobilita.regione.emilia-romagna.it/saltasu/scuole-superiori' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const erLibriTesto = {
  id: 'er_libri_testo',
  regione: 'emilia_romagna',
  nome: 'Contributo libri di testo e borse di studio ER.GO (Emilia-Romagna)',
  ente: 'Regione Emilia-Romagna, con Comuni e Province',
  categoria: 'famiglia',
  sintesi: 'Contributo in denaro, senza rendiconto, per gli studenti di medie e superiori con ISEE fino a 15.748,78 €; con la stessa domanda le borse di studio regionali e statali.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 10, 21, 'Un figlio iscritto alla scuola media o superiore'), iseeEntro(s, 15748.78, 'ISEE minorenni fino a 15.748,78 €')],
      importo: { breve: 'circa 113-177 € più eventuale borsa', testo: `Gli importi 2026-2027 si fissano dopo l'istruttoria; nel 2025-2026 erano ${eur(177)} (ISEE fino a 10.632,94 €) e ${eur(113)} sopra. Borse regionali 200-250 € per il primo biennio, borsa statale 229,40 € per il triennio.`, unaTantum: 113 },
    };
  },
  finestra: { a: '2026-10-23', testo: 'Per il 2026-2027 le domande si sono chiuse il 23 ottobre 2026. La prossima finestra è attesa a settembre-ottobre 2027.' },
  come: { testo: 'Online su ER.GO Scuola con SPID, CIE o CNS, anche con l\'aiuto dei CAF convenzionati.', link: 'https://scuola.regione.emilia-romagna.it/novita/notizie/2026/benefici-scolastici-domande-4-settembre-23-ottobre' },
  fonti: [
    { titolo: 'Regione Emilia-Romagna, Borse di studio e contributi libri: domande dal 4 settembre al 23 ottobre 2026 (DGR 1229/2026)', url: 'https://scuola.regione.emilia-romagna.it/novita/notizie/2026/benefici-scolastici-domande-4-settembre-23-ottobre' },
    { titolo: 'Regione Emilia-Romagna, Contributi libri 2025-2026: definiti gli importi', url: 'https://scuola.regione.emilia-romagna.it/novita/notizie/2026/contributi-libri-regione-25-26-definiti-importi' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const erFondoAffitto = {
  id: 'er_fondo_affitto',
  regione: 'emilia_romagna',
  nome: 'Fondo affitto (Emilia-Romagna)',
  ente: 'Regione Emilia-Romagna, con i Comuni',
  categoria: 'casa',
  sintesi: 'Dal 20 al 25% dell\'affitto annuo, fino a 2.000 €, per gli inquilini con ISEE fino a 8.000 € quando l\'affitto pesa almeno il 25% sul reddito.',
  valuta(s) {
    const affitto = req('Vivi in affitto con contratto registrato', s.casa === null ? null : s.casa === 'affitto' && s.contrattoRegistrato !== false ? (s.contrattoRegistrato === null ? null : true) : false, s.casa === 'affitto' ? 'contratto_registrato' : 'casa');
    const stima = s.canoneAnnuo ? Math.min(2000, Math.round(s.canoneAnnuo * 0.25)) : null;
    return {
      requisiti: [affitto, iseeEntro(s, 8000, 'ISEE fino a 8.000 €')],
      probabile: true,
      importo: { breve: stima ? `fino a ${eur(stima)}` : 'fino a 2.000 €', testo: '20% dell\'affitto annuo (massimo 1.500 €) se l\'affitto pesa tra il 25% e il 40% del reddito ISR; 25% (massimo 2.000 €) oltre il 40%. Graduatoria per distretto fino a esaurimento fondi.', annuo: stima || 0 },
      note: ['Esclusi gli assegnatari di case popolari. I residenti a Bologna scorrono la graduatoria comunale 2025.'],
    };
  },
  finestra: { a: '2026-10-20', testo: 'Il bando 2026 si è chiuso il 20 ottobre 2026; il bando si ripete ogni anno, il prossimo è atteso a settembre-ottobre 2027.' },
  come: { testo: 'Online sulla piattaforma regionale con SPID, CIE o CNS, oppure al Comune o alle organizzazioni convenzionate.', link: 'https://territorio.regione.emilia-romagna.it/politiche-abitative/bandi/2026/bando-fondo-affitto-2026' },
  fonti: [{ titolo: 'Regione Emilia-Romagna, Bando Fondo affitto 2026 (DGR 758/2026)', url: 'https://territorio.regione.emilia-romagna.it/politiche-abitative/bandi/2026/bando-fondo-affitto-2026' }],
  verificato: VERIFICATO_REGIONI,
};

export const erNidi = {
  id: 'er_nidi_rette',
  regione: 'emilia_romagna',
  nome: 'Rette del nido ridotte o azzerate (Emilia-Romagna)',
  ente: 'Regione Emilia-Romagna, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: 'Retta del nido gratis con ISEE fino a 40.000 € nei Comuni montani e nelle aree interne del Ferrarese; ridotta con ISEE fino a 26.000 € negli altri Comuni che aderiscono.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 0, 3, 'Un figlio tra 0 e 3 anni iscritto a un nido pubblico o convenzionato'), iseeEntro(s, 40000, 'ISEE minorenni fino a 40.000 € nei Comuni montani, fino a 26.000 € altrove')],
      probabile: true,
      importo: { breve: 'retta azzerata o ridotta', testo: 'Nei Comuni montani e nelle aree interne del Ferrarese la retta è azzerata con ISEE fino a 40.000 €. Negli altri Comuni aderenti lo sconto lo decide il Comune, con ISEE fino a 26.000 €. Vale da settembre 2026 a giugno 2027.', nonSommare: true },
      note: [s.isee !== null && s.isee > 26000 ? 'Con il tuo ISEE lo sconto vale solo nei Comuni montani e nelle aree interne del Ferrarese.' : 'Lo sconto si applica solo se il Comune del nido ha aderito.'],
    };
  },
  finestra: { testo: 'Non c\'è una domanda regionale: lo sconto si applica alla retta del nido per l\'anno 2026-2027 nei Comuni aderenti.' },
  come: { testo: 'Chiedi all\'ufficio scuola del Comune in cui si trova il nido: applica la riduzione con l\'ISEE al momento dell\'iscrizione o del calcolo della retta.', link: 'https://sociale.regione.emilia-romagna.it/nidi-e-scuole-dellinfanzia/servizi-educativi/progetti/abbattimento-costi-rette-ampliamento-posti-disponibili' },
  fonti: [{ titolo: 'BURERT n. 136 dell\'1/6/2026, DGR 811/2026: riduzione delle rette dei servizi 0-3, anno 2026-2027', url: 'https://bur.regione.emilia-romagna.it/area-bollettini/n-136-del-01-06-2026-parte-seconda/approvazione-misure-di-sostegno-alla-fruizione-dei-servizi-educativi-per-linfanzia-del-sistema-integrato-bambini-in-eta-0-3-anni-misure-per-lampliamento-dellofferta-e-per-la-riduzione-degli-oneri-a-carico-delle-famiglie-anno-educativo-2026-2027-pr-fse' }],
  verificato: VERIFICATO_REGIONI,
};
