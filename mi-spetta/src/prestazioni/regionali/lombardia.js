// Lombardia: misure regionali verificate il 25/10/2026.

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

const DOTE = 'https://www.regione.lombardia.it/istruzione-formazione-e-lavoro/dote-scuola/dote-scuola-2026';

export const lombardiaMisuraSostegno = {
  id: 'lombardia_misura_sostegno',
  regione: 'lombardia',
  nome: 'Misura Sostegno per non autosufficienti a casa (Lombardia)',
  ente: 'Regione Lombardia, tramite ASST e Ambiti sociali',
  categoria: 'anziani',
  sintesi: 'Contributo mensile da 100 a 1.300 € per chi assiste a casa un anziano non autosufficiente o una persona con disabilità grave o gravissima.',
  valuta(s) {
    return {
      requisiti: [
        req('Nel nucleo c\'è una persona con indennità di accompagnamento o disabilità grave (legge 104, art. 3, comma 3)', s.disabileNucleo, 'disabile_nucleo'),
        iseeEntro(s, 50000, 'ISEE sociosanitario fino a 25.000 € per i gravi, 50.000 € per i gravissimi (per i minori 40.000 e 65.000 €)'),
      ],
      probabile: true,
      importo: { breve: 'da 100 a 1.300 € al mese', testo: 'Gravissimi: 565 € al mese con un caregiver familiare, da 900 a 1.300 € con personale assunto. Gravi: 100 € al mese con caregiver, fino a 800 € con personale assunto. Fino a esaurimento delle risorse.', nonSommare: true },
      note: ['Non si somma con il ricovero in RSA, i centri diurni di 18 ore o più, Home Care Premium e la Prestazione universale INPS.'],
    };
  },
  finestra: { a: '2026-10-31', testo: 'Per i gravissimi il primo accesso del 2026 si chiede all\'ASST entro il 31 ottobre 2026; dal 2027 la finestra va dal 1° marzo al 31 ottobre. I gravi seguono le scadenze del proprio Ambito.' },
  come: { testo: 'Domanda di valutazione all\'ASST (gravissimi) o all\'Ambito territoriale sociale (gravi). Chi è già in carico non la ripresenta.', link: 'https://www.regione.lombardia.it/politiche-sociali-e-abitative/disabilita/politiche-e-misure-per-la-disabilita/sostegno-per-la-disabilit--gravissima-misura-sostegno' },
  fonti: [{ titolo: 'Regione Lombardia, Misura Sostegno (DGR 6320 del 15/6/2026, programma FNA 2025-2027)', url: 'https://www.regione.lombardia.it/politiche-sociali-e-abitative/disabilita/politiche-e-misure-per-la-disabilita/sostegno-per-la-disabilit--gravissima-misura-sostegno' }],
  verificato: VERIFICATO_REGIONI,
};

export const lombardiaIvola = {
  id: 'lombardia_ivola',
  regione: 'lombardia',
  nome: 'Io viaggio ovunque in Lombardia agevolata (IVOLA)',
  ente: 'Regione Lombardia',
  categoria: 'anziani',
  sintesi: 'Abbonamento annuale su tutti i mezzi pubblici lombardi a 10, 80 o 699 € per invalidi e per chi ha più di 65 anni.',
  valuta(s) {
    const over = s.eta === null ? null : s.eta > 65;
    const fascia = over && s.isee !== null && s.isee <= 12500 ? '80 €' : over ? '699 €' : null;
    return {
      requisiti: [req('Più di 65 anni (o un\'invalidità riconosciuta)', over, 'eta')],
      importo: { breve: fascia ? `abbonamento annuale a ${fascia}` : 'abbonamento annuale da 10, 80 o 699 €', testo: 'Over 65 con ISEE fino a 12.500 €: 80 € l\'anno; over 65 senza limite di ISEE: 699 €. Invalidi al 100%, ciechi e sordi: 10 €; invalidi dal 67% con ISEE fino a 16.500 €: 80 €. Vale su bus, tram, metro e treni regionali in seconda classe.', nonSommare: true },
      note: ['Le fasce cambieranno con la DGR 5471/2025, attesa nella seconda metà del 2026.'],
    };
  },
  finestra: { testo: 'Si può chiedere in ogni momento; la Regione risponde entro 40 giorni.' },
  come: { testo: 'Online su ioviaggioagevolata.servizirl.it, oppure con domanda cartacea allo SpazioRegione. Numero verde 800 318 318.', link: 'https://www.regione.lombardia.it/infrastrutture-trasporti-e-mobilita/trasporto-pubblico/biglietti-e-agevolazioni/io-viaggio-ovunque-in-lombardia' },
  fonti: [{ titolo: 'Regione Lombardia, IVOLA (aggiornata l\'1/10/2026)', url: 'https://www.regione.lombardia.it/infrastrutture-trasporti-e-mobilita/trasporto-pubblico/biglietti-e-agevolazioni/io-viaggio-ovunque-in-lombardia' }],
  verificato: VERIFICATO_REGIONI,
};

export const lombardiaDoteMateriale = {
  id: 'lombardia_dote_materiale',
  regione: 'lombardia',
  nome: 'Dote scuola: materiale didattico (Lombardia)',
  ente: 'Regione Lombardia',
  categoria: 'famiglia',
  sintesi: 'Buono digitale da 150 a 500 € per libri, dispositivi e strumenti didattici degli studenti di medie, superiori e IeFP con ISEE fino a 15.748,78 €.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 10, 22, 'Un figlio iscritto alla scuola media, superiore o IeFP, fino a 21 anni'), iseeEntro(s, 15748.78, 'ISEE fino a 15.748,78 €')],
      importo: { breve: 'da 150 a 500 €', testo: 'Buono digitale di importo uguale per tutti, tra 150 e 500 €, secondo fondi e domande. Con la stessa domanda si concorre alla borsa di studio statale per le superiori.', unaTantum: 150 },
    };
  },
  finestra: { a: '2026-05-07', testo: 'Per il 2026-2027 le domande si sono chiuse il 7 maggio 2026. Il prossimo avviso è atteso in primavera 2027.' },
  come: { testo: 'Online su Bandi e Servizi della Regione con SPID, CIE o CNS.', link: DOTE },
  fonti: [{ titolo: 'Regione Lombardia, Dote Scuola 2026-2027', url: DOTE }],
  verificato: VERIFICATO_REGIONI,
};

export const lombardiaBuonoScuola = {
  id: 'lombardia_buono_scuola',
  regione: 'lombardia',
  nome: 'Dote scuola: buono per le rette (Lombardia)',
  ente: 'Regione Lombardia',
  categoria: 'famiglia',
  sintesi: 'Contributo da 300 a 2.000 € per la retta delle scuole primarie e secondarie che la chiedono, con ISEE fino a 40.000 €.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 6, 22, 'Un figlio iscritto a una scuola che chiede una retta (es. paritaria)'), iseeEntro(s, 40000, 'ISEE fino a 40.000 €')],
      probabile: true,
      importo: { breve: 'da 300 a 2.000 €', testo: 'ISEE fino a 8.000 €: 700 € primaria, 1.600 € media, 2.000 € superiore; fino a 16.000 €: 600/1.300/1.600 €; fino a 28.000 €: 450/1.100/1.400 €; fino a 40.000 €: 300/1.000/1.300 €.', nonSommare: true },
      note: ['Conta solo se la scuola chiede una retta.'],
    };
  },
  finestra: { testo: 'Per il 2026-2027 l\'apertura è prevista a novembre 2026; le date non sono ancora pubblicate.' },
  come: { testo: 'Online su Bandi e Servizi della Regione con SPID, CIE o CNS. Informazioni: dotescuola@regione.lombardia.it, 800 318 318.', link: DOTE },
  fonti: [
    { titolo: 'Regione Lombardia, Dote Scuola 2026-2027', url: DOTE },
    { titolo: 'Regione Lombardia, Allegato A alla DGR 3970/2025 (Buono scuola 2026-2027)', url: 'https://www.regione.lombardia.it/content/dam/rl/canali-tematici-servizi/03-istruzione-formazione-e-lavoro/02-dote-scuola/red-dote-scuola-2026/allegati/Allegato_A_alla_D.g.r._3970_2025.pdf' },
  ],
  verificato: VERIFICATO_REGIONI,
};
