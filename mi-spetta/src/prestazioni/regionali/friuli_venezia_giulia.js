// Friuli Venezia Giulia: misure regionali verificate il 25/10/2026.

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra, residenzaRegioneAlmeno } from '../_comuni.js';

const FVG = 'https://www.regione.fvg.it/rafvg/cms/RAFVG/famiglia-casa/politiche-famiglia';
const residenza = (s) => residenzaRegioneAlmeno(s, 1, 'Friuli Venezia Giulia');

export const fvgDoteFamiglia = {
  id: 'fvg_dote_famiglia',
  regione: 'friuli_venezia_giulia',
  nome: 'Dote famiglia (Friuli Venezia Giulia)',
  ente: 'Regione Friuli Venezia Giulia, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: 'Rimborso di 500 € per ogni figlio minorenne, più 100 € forfettari a figlio, per sport, doposcuola, centri estivi, corsi, cultura e gite pagati in regione nel 2026.',
  valuta(s) {
    const minori = s.minori.length;
    return {
      requisiti: [figlioTra(s, 0, 18, 'Almeno un figlio minorenne'), residenza(s), iseeEntro(s, 35000, 'ISEE minorenni fino a 35.000 €')],
      importo: { breve: minori ? `fino a ${minori * 600} €` : '600 € per figlio', testo: '500 € per figlio minorenne a rimborso delle spese documentate, più 100 € a figlio senza giustificativi. Serve la Carta famiglia, che si può chiedere insieme.', annuo: minori * 600 },
      note: ['Non si somma con l\'abbattimento delle rette del nido.'],
    };
  },
  finestra: { a: '2026-12-31', testo: 'Una domanda all\'anno, entro il 31 dicembre 2026, per le spese dal 1° gennaio al 31 dicembre 2026.' },
  come: { testo: 'Online con SPID, CIE o CRS sul portale Carta famiglia.', link: `${FVG}/FOGLIA49/` },
  fonti: [{ titolo: 'Regione FVG, Dote famiglia (Delibera n. 208/2026)', url: `${FVG}/FOGLIA49/` }],
  verificato: VERIFICATO_REGIONI,
};

export const fvgMaternita = {
  id: 'fvg_sostegno_maternita',
  regione: 'friuli_venezia_giulia',
  nome: 'Sostegno alla maternità: 250 € al mese per un anno (Friuli Venezia Giulia)',
  ente: 'Regione Friuli Venezia Giulia',
  categoria: 'famiglia',
  sintesi: '250 € al mese per 12 mesi (500 € se la madre ha meno di 30 anni) per ogni figlio nato o adottato dal 2026, se la madre lavora, studia o cerca lavoro.',
  valuta(s) {
    const lavoro = s.lavoro === null ? null : s.lavoro !== 'pensionato' && s.lavoro !== 'casa' && s.lavoro !== 'altro';
    const giovane = s.eta !== null && s.eta < 30;
    return {
      requisiti: [
        req('Sei la madre', s.seiMadre, 'sei_madre'),
        figlioTra(s, 0, 1, 'Un figlio nato o adottato dal 1° gennaio 2026'),
        residenza(s),
        iseeEntro(s, 35000, 'ISEE fino a 35.000 €'),
        req('Lavori, studi o sei iscritta al Centro per l\'impiego', lavoro, 'lavoro'),
      ],
      importo: { breve: giovane ? '500 € al mese per 12 mesi' : '250 € al mese per 12 mesi', testo: `${giovane ? '500' : '250'} € al mese per 12 mesi, cioè ${giovane ? '6.000' : '3.000'} €. I 500 € spettano alle madri con meno di 30 anni alla nascita nel 2026 e 2027.`, annuo: giovane ? 6000 : 3000 },
      note: ['Serve la Carta famiglia.', 'È un sussidio assistenziale: per l\'ADI potrebbe contare come reddito.'],
    };
  },
  finestra: { testo: 'Domanda entro 12 mesi dalla nascita o dall\'adozione.' },
  come: { testo: 'Online con SPID, CIE o CNS sull\'applicativo della Carta famiglia.', link: `${FVG}/FOGLIA69/` },
  fonti: [{ titolo: 'Regione FVG, Sostegno alla maternità (aggiornata il 26/6/2026)', url: `${FVG}/FOGLIA69/` }],
  verificato: VERIFICATO_REGIONI,
};

export const fvgRetteNidi = {
  id: 'fvg_rette_nidi',
  regione: 'friuli_venezia_giulia',
  nome: 'Abbattimento delle rette del nido (Friuli Venezia Giulia)',
  ente: 'Regione Friuli Venezia Giulia, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: 'Sconto diretto sulla retta del nido fino a 310 € al mese, 510 € con due o più figli, per famiglie con ISEE fino a 50.000 €.',
  valuta(s) {
    const due = s.minori.length >= 2;
    return {
      requisiti: [figlioTra(s, 0, 3, 'Un figlio tra 3 e 36 mesi iscritto a un nido o servizio accreditato'), residenza(s), iseeEntro(s, 50000, 'ISEE fino a 50.000 €')],
      probabile: true,
      importo: { breve: due ? 'fino a 510 € al mese' : 'fino a 310 € al mese', testo: 'A tempo pieno 310 € al mese con un figlio minore, 510 € con due o più; a tempo parziale 155 o 255 €. Mai oltre la retta.', nonSommare: true },
      note: ['Le domande arrivate dopo il 31 maggio 2026 vanno in lista d\'attesa in ordine cronologico.'],
    };
  },
  finestra: { a: '2027-07-23', testo: 'Domande fino al 23 luglio 2027, in lista d\'attesa secondo le risorse.' },
  come: { testo: 'Online con SPID, CIE o CRS su Istanze OnLine della Regione, una domanda per figlio.', link: `${FVG}/FOGLIA68/` },
  fonti: [{ titolo: 'Regione FVG, Abbattimento rette a.e. 2026-2027 (DGR 1008 del 10/7/2026)', url: `${FVG}/FOGLIA68/` }],
  verificato: VERIFICATO_REGIONI,
};

export const fvgFap = {
  id: 'fvg_fap',
  regione: 'friuli_venezia_giulia',
  nome: 'Fondo per l\'autonomia possibile, FAP (Friuli Venezia Giulia)',
  ente: 'Regione Friuli Venezia Giulia, tramite gli Ambiti sociali',
  categoria: 'anziani',
  sintesi: 'Contributi annuali per tenere a casa le persone non autosufficienti: assegno per l\'autonomia, contributo per la badante, vita indipendente, gravissime disabilità.',
  valuta(s) {
    return {
      requisiti: [req('Nel nucleo c\'è una persona non autosufficiente assistita a casa', s.disabileNucleo, 'disabile_nucleo'), iseeEntro(s, 60000, 'ISEE fino a 30.000 € per assegno e badante, fino a 60.000 € per gravissime disabilità e vita indipendente')],
      probabile: true,
      importo: { breve: 'da 1.620 a 24.000 € l\'anno', testo: 'Assegno per l\'autonomia da 1.620 a 6.204 €; contributo per la badante da 2.892 a 12.000 €; vita indipendente e gravissime disabilità fino a 24.000 €. Decide l\'Ambito con un progetto personalizzato.', nonSommare: true },
    };
  },
  finestra: { testo: 'Nessun bando: il bisogno si segnala in ogni momento al Servizio sociale dei Comuni o al distretto.' },
  come: { testo: 'Rivolgiti al Servizio sociale dei Comuni o al distretto sanitario: valutano il caso e definiscono il progetto.', link: 'https://www.regione.fvg.it/rafvg/cms/RAFVG/salute-sociale/interventi-socio-sanitari/FOGLIA30' },
  fonti: [{ titolo: 'Regione FVG, Fondo per l\'autonomia possibile (aggiornata il 16/6/2026)', url: 'https://www.regione.fvg.it/rafvg/cms/RAFVG/salute-sociale/interventi-socio-sanitari/FOGLIA30' }],
  verificato: VERIFICATO_REGIONI,
};
