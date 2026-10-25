// Piemonte: misure regionali verificate il 25/10/2026.
// Escluse: borse EDISU (sito vietato agli agenti Anthropic dal robots.txt; dipendono dall'ateneo).

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

export const piemonteDomiciliarita = {
  id: 'piemonte_buono_domiciliarita',
  regione: 'piemonte',
  nome: 'Scelta sociale: Buono domiciliarità da 700 € al mese (Piemonte)',
  ente: 'Regione Piemonte',
  categoria: 'anziani',
  sintesi: '700 € al mese per 12 mesi, estendibili a 24, per pagare un\'assistente familiare a una persona non autosufficiente di almeno 65 anni o con disabilità.',
  valuta(s) {
    return {
      requisiti: [
        req('Nel nucleo c\'è una persona non autosufficiente (65 anni o più) o con disabilità', s.disabileNucleo, 'disabile_nucleo'),
        iseeEntro(s, 40000, 'ISEE ordinario o sociosanitario fino a 40.000 €'),
      ],
      probabile: true,
      importo: { breve: '700 € al mese', testo: '700 € al mese per 12 mesi, estendibili a 24, da rendicontare ogni trimestre. Graduatoria per punteggio sociale, poi ISEE, poi ordine di arrivo.', nonSommare: true },
      note: ['Servono una valutazione UVG o UMVD (punteggio sanitario almeno 5, sociale almeno 7) e un\'assistente familiare già assunta per almeno 16 ore a settimana.', 'Non si somma con la Prestazione universale INPS, gli assegni di cura regionali, il fondo caregiver e Home Care Premium.'],
    };
  },
  finestra: { a: '2026-11-02', testo: 'Domande fino alle 23.59 del 2 novembre 2026.' },
  come: { testo: 'Online con SPID, CIE o CNS su Piemonte Tu (anche da sceltasociale.it), allegando il verbale UVG o UMVD. La presenta un familiare, il tutore o un delegato.', link: 'https://www.regione.piemonte.it/web/node/22851' },
  fonti: [
    { titolo: 'Regione Piemonte, Scelta sociale: Buono per la domiciliarità 2026-2027', url: 'https://www.regione.piemonte.it/web/node/22851' },
    { titolo: 'Avviso Buono Domiciliarità 2026, Allegato 1 alla D.D. n. 1285 del 4/8/2026', url: 'https://bandi.regione.piemonte.it/system/files/All.1_AVVISO_DOM_2026.pdf' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const piemonteVoucherScuola = {
  id: 'piemonte_voucher_scuola',
  regione: 'piemonte',
  nome: 'Voucher scuola per libri, materiale e trasporti (Piemonte)',
  ente: 'Regione Piemonte',
  categoria: 'famiglia',
  sintesi: 'Voucher per libri, materiale didattico, PC e trasporti degli studenti fino a 21 anni con ISEE fino a 15.748,78 € (voucher B); per le rette delle paritarie fino a 30.000 € (voucher A).',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 6, 21, 'Un figlio a scuola (primaria, secondaria o IeFP), con meno di 21 anni'), iseeEntro(s, 15748.78, 'ISEE fino a 15.748,78 € (30.000 € per il voucher rette delle paritarie)')],
      probabile: true,
      importo: { breve: 'da 50 a 500 € (rette fino a 2.150 €)', testo: 'Voucher B: con ISEE fino a 4.000 € 150 € primaria, 300 € media, 500 € superiore; fino a 9.000 € 100/200/300 €; fino a 15.748,78 € 50/100/200 €. Voucher A per le rette delle paritarie da 950 a 2.150 €. Graduatoria per ISEE crescente.', unaTantum: 100 },
    };
  },
  finestra: { a: '2026-07-16', testo: 'Per il 2026-2027 le domande si sono chiuse il 16 luglio 2026. Il bando torna ogni anno a giugno-luglio.' },
  come: { testo: 'Online con SPID, CIE o CNS dai servizi della Regione Piemonte. L\'ISEE lo prende la Regione dall\'INPS. Numero verde 800 333 444.', link: 'https://www.regione.piemonte.it/web/temi/istruzione-formazione-lavoro/istruzione/voucher-scuola/voucher-scuola-2026-2027' },
  fonti: [
    { titolo: 'Regione Piemonte, Voucher scuola 2026-2027', url: 'https://www.regione.piemonte.it/web/temi/istruzione-formazione-lavoro/istruzione/voucher-scuola/voucher-scuola-2026-2027' },
    { titolo: 'Regione Piemonte, Tabella importi voucher B 2026-2027', url: 'https://www.regione.piemonte.it/web/media/57367/download' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const piemonteVesta = {
  id: 'piemonte_vesta',
  regione: 'piemonte',
  nome: 'Buono Vesta per i servizi 0-6 anni (Piemonte)',
  ente: 'Regione Piemonte',
  categoria: 'famiglia',
  sintesi: 'Rimborso da 800 a 1.200 € per figlio fino a 6 anni per nido, scuola dell\'infanzia, centri estivi, baby-sitter, sport e attività educative.',
  valuta(s) {
    const importo = s.isee === null ? null : s.isee <= 10000 ? 1200 : s.isee <= 30000 ? 1000 : 800;
    return {
      requisiti: [figlioTra(s, 0, 7, 'Un figlio nato dal 2020 in poi'), iseeEntro(s, 40000, 'ISEE fino a 40.000 €')],
      importo: { breve: importo ? `${importo} € per figlio` : 'da 800 a 1.200 € per figlio', testo: 'Rimborso delle spese sostenute in 12 mesi: 1.200 € con ISEE fino a 10.000 €, 1.000 € fino a 30.000 €, 800 € fino a 40.000 €; 1.200 € per un figlio con disabilità.', unaTantum: importo || 0 },
    };
  },
  finestra: { a: '2026-04-22', testo: 'Il click day 2026 è stato il 21 aprile. La misura è finanziata dal FSE+ 2025-2027: una nuova edizione nel 2027 è possibile ma non ancora annunciata.' },
  come: { testo: 'Online su vestapiemonte.it con SPID, CIE o CNS, una domanda per figlio.', link: 'https://www.regione.piemonte.it/web/node/22243' },
  fonti: [
    { titolo: 'Regione Piemonte, Vesta 2026: il click day il 21 aprile', url: 'https://www.regione.piemonte.it/web/node/22243' },
    { titolo: 'D.D. n. 489 del 9/4/2026, Avviso Buono Vesta 2 (BU 15/2026)', url: 'https://www.regione.piemonte.it/governo/bollettino/abbonati/2026/15/attach/dda2200000489_11300.pdf' },
  ],
  verificato: VERIFICATO_REGIONI,
};
