// Provincia autonoma di Trento: misure verificate il 25/10/2026. Usano l'ICEF, non l'ISEE.

import { VERIFICATO_REGIONI, req, figlioTra, residenzaRegioneAlmeno } from '../_comuni.js';

const icefEntro = (s, soglia, testo) => req(testo, s.icef === null ? null : s.icef < soglia, 'icef');
const residenza = (s, anni) => residenzaRegioneAlmeno(s, anni, 'Trentino');

export const trentoAup = {
  id: 'trento_assegno_unico_provinciale',
  regione: 'trento',
  nome: 'Assegno unico provinciale, quota figli (Trento)',
  ente: 'Provincia autonoma di Trento',
  categoria: 'famiglia',
  sintesi: 'Assegno provinciale che si aggiunge all\'Assegno unico INPS: la quota per i figli minori spetta con ICEF sotto 0,30; c\'è anche una quota di sostegno al reddito con ICEF sotto 0,165.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 0, 18, 'Almeno un figlio minorenne convivente'), residenza(s, 3), icefEntro(s, 0.30, 'ICEF sotto 0,30')],
      importo: { breve: 'importo secondo l\'ICEF', testo: 'L\'importo dipende dall\'ICEF e la Provincia non lo pubblica in una tabella. Con ICEF sotto 0,165 c\'è anche la quota di sostegno al reddito, non compatibile con l\'Assegno di inclusione.', nonSommare: true },
      note: ['Servono 3 anni di residenza continuativa in Trentino negli ultimi 10.', 'Per il 2026 le quote figli sono prorogate d\'ufficio al 31 dicembre.'],
    };
  },
  finestra: { a: '2027-05-31', testo: 'Il periodo va dal 1° luglio al 30 giugno; la domanda si presenta dal 18 maggio al 31 maggio dell\'anno dopo.' },
  come: { testo: 'Tramite i patronati o gli sportelli periferici della Provincia, gratis.', link: 'https://www.provincia.tn.it/Servizi/Domanda-per-la-concessione-dell-assegno-unico-provinciale' },
  fonti: [{ titolo: 'Provincia di Trento, Domanda per l\'assegno unico provinciale (aggiornata al 15/10/2026)', url: 'https://www.provincia.tn.it/Servizi/Domanda-per-la-concessione-dell-assegno-unico-provinciale' }],
  verificato: VERIFICATO_REGIONI,
};

export const trentoTerzoFiglio = {
  id: 'trento_natalita_terzo_figlio',
  regione: 'trento',
  nome: 'Assegno di natalità per il terzo figlio (Trento)',
  ente: 'Provincia autonoma di Trento',
  categoria: 'famiglia',
  sintesi: 'Assegno mensile alla madre per il terzo figlio nato o adottato dal 2026, fino ai 10 anni del bambino: 400 € al mese con ICEF fino a 0,40, 250 € oltre.',
  valuta(s) {
    const terzo = !s.figliRisposta ? null : s.nFigli >= 3 && s.figli.some((f) => f.anni !== null && f.anni < 1);
    const importo = s.icef !== null && s.icef <= 0.4 ? 400 : 250;
    return {
      requisiti: [req('Sei la madre', s.seiMadre, 'sei_madre'), req('Il terzo figlio (o successivo) è nato o adottato dal 1° gennaio 2026', terzo, 'figli'), residenza(s, 2)],
      importo: { breve: `${importo} € al mese fino ai 10 anni`, testo: `${importo} € al mese per massimo 120 mesi (400 € con ICEF fino a 0,40, esenti IRPEF; 250 € oltre). Dal terzo anno, 200 € al mese in più se la madre lavora almeno 180 giorni l'anno.`, annuo: importo * 12 },
      note: ['La madre deve lavorare o avere almeno 12 mesi di contributi negli ultimi 5 anni.'],
    };
  },
  finestra: { testo: 'Domanda entro 180 giorni dalla nascita; per i nati entro il 30 giugno 2026, entro il 31 dicembre 2026 con arretrati.' },
  come: { testo: 'Online con SPID o CIE sulla piattaforma bandi della Provincia, oppure con un patronato.', link: 'https://www.provincia.tn.it/Servizi/Assegno-di-natalita-per-il-terzo-figlio' },
  fonti: [{ titolo: 'Provincia di Trento, Assegno di natalità per il terzo figlio (aggiornata al 10/9/2026)', url: 'https://www.provincia.tn.it/Servizi/Assegno-di-natalita-per-il-terzo-figlio' }],
  verificato: VERIFICATO_REGIONI,
};

export const trentoBonusNidi = {
  id: 'trento_bonus_nidi',
  regione: 'trento',
  nome: 'Bonus nidi d\'infanzia (Trento)',
  ente: 'Provincia autonoma di Trento',
  categoria: 'famiglia',
  sintesi: 'Rimborso della retta del nido rimasta dopo il Bonus nido INPS: tutta con ICEF Famiglia fino a 0,40, metà fino a 0,70, al massimo 2.500 € l\'anno.',
  valuta(s) {
    const quota = s.icef !== null && s.icef <= 0.4 ? '100%' : '50%';
    return {
      requisiti: [figlioTra(s, 0, 3, 'Un figlio al nido, tra 3 mesi e 3 anni (solo per i primi due figli)'), req('ICEF Famiglia fino a 0,70', s.icef === null ? null : s.icef <= 0.7, 'icef')],
      probabile: true,
      importo: { breve: `${quota} della retta, fino a 2.500 €`, testo: 'Rimborso del 100% della retta residua con ICEF Famiglia fino a 0,40, del 50% fino a 0,70, al massimo 2.500 € per anno solare. Serve aver già chiesto il Bonus nido INPS.', nonSommare: true },
    };
  },
  finestra: { a: '2027-09-30', testo: 'Prima edizione: valgono le spese dal 1° settembre 2026 e le domande si presentano dal 1° aprile al 30 settembre 2027.' },
  come: { testo: 'Online con SPID o CIE sulla piattaforma della Provincia, oppure con un patronato. La fattura deve essere intestata a chi fa domanda.', link: 'https://www.provincia.tn.it/Servizi/Bonus-nidi-d-infanzia' },
  fonti: [{ titolo: 'Provincia di Trento, Bonus nidi d\'infanzia (DGP 1461 del 18/9/2026)', url: 'https://www.provincia.tn.it/Servizi/Bonus-nidi-d-infanzia' }],
  verificato: VERIFICATO_REGIONI,
};

export const trentoAffitto = {
  id: 'trento_contributo_affitto',
  regione: 'trento',
  nome: 'Contributo integrativo all\'affitto sul libero mercato (Trento)',
  ente: 'Provincia autonoma di Trento, tramite Comunità di valle e Comune di Trento',
  categoria: 'casa',
  sintesi: 'Da 40 a 300 € al mese, mai oltre metà dell\'affitto, per chi è in affitto sul libero mercato con ICEF basso.',
  valuta(s) {
    const affitto = req('Vivi in affitto sul libero mercato con contratto registrato', s.casa === null ? null : s.casa !== 'affitto' ? false : s.contrattoRegistrato, s.casa === 'affitto' ? 'contratto_registrato' : 'casa');
    return {
      requisiti: [affitto, residenza(s, 3), req('ICEF per l\'edilizia pubblica fino a 0,21 (soglia del Comune di Trento)', s.icef === null ? null : s.icef <= 0.21, 'icef')],
      probabile: true,
      importo: { breve: 'da 40 a 300 € al mese', testo: 'Da 40 a 300 € al mese, mai oltre il 50% dell\'affitto, per 12 mesi rinnovabili per altri 12. Si scala la quota affitto dell\'Assegno di inclusione.', annuo: 480 },
      note: ['Le Comunità di valle possono applicare soglie diverse da quella del Comune di Trento.'],
    };
  },
  finestra: { a: '2026-02-27', testo: 'La finestra 2026 si è chiusa il 27 febbraio. La prossima è già fissata: dal 15 gennaio al 26 febbraio 2027.' },
  come: { testo: 'Online sulla «Stanza del cittadino» con SPID, CIE o CPS, all\'ente del territorio in cui si trova l\'alloggio.', link: 'https://www.provincia.tn.it/Servizi/Servizi-offerti-da-altri-enti/Contributo-integrativo-alla-locazione-sul-libero-mercato' },
  fonti: [
    { titolo: 'Provincia di Trento, Contributo integrativo alla locazione sul libero mercato', url: 'https://www.provincia.tn.it/Servizi/Servizi-offerti-da-altri-enti/Contributo-integrativo-alla-locazione-sul-libero-mercato' },
    { titolo: 'Comune di Trento, Contributo integrativo al canone di locazione', url: 'https://www.comune.trento.it/Servizi/Contributo-integrativo-al-canone-di-locazione' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const trentoOver70 = {
  id: 'trento_trasporti_over70',
  regione: 'trento',
  nome: 'Mezzi pubblici gratis per chi ha più di 70 anni (Trento)',
  ente: 'Provincia autonoma di Trento',
  categoria: 'anziani',
  sintesi: 'Chi risiede in Trentino, ha più di 70 anni e non lavora viaggia gratis sul trasporto pubblico provinciale; tra 60 e 70 anni ci sono abbonamenti ridotti per reddito.',
  valuta(s) {
    const lavora = s.lavoro !== null && ['dipendente_indeterminato', 'dipendente_determinato', 'autonomo'].includes(s.lavoro);
    return {
      requisiti: [req('Più di 70 anni', s.eta === null ? null : s.eta > 70, 'eta'), req('Non lavori', s.lavoro === null ? null : !lavora, 'lavoro')],
      importo: { breve: 'viaggi gratis', testo: 'Libera circolazione gratuita per 5 anni; la smart card costa 4 €.', nonSommare: true },
    };
  },
  finestra: { testo: 'Si chiede in ogni momento.' },
  come: { testo: 'Smart card con modulo, autodichiarazione e fototessera alle biglietterie di Trentino Trasporti o Trenitalia.', link: 'https://www.provincia.tn.it/Servizi/Abbonamento-trasporto-per-pensionati' },
  fonti: [{ titolo: 'Provincia di Trento, Abbonamento trasporto per pensionati (aggiornata l\'1/7/2026)', url: 'https://www.provincia.tn.it/Servizi/Abbonamento-trasporto-per-pensionati' }],
  verificato: VERIFICATO_REGIONI,
};
