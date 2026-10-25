// Sicilia: misure regionali verificate il 25/10/2026.

import { VERIFICATO_REGIONI, req, iseeEntro, residenzaRegioneAlmeno } from '../_comuni.js';

export const siciliaBonusFiglio = {
  id: 'sicilia_bonus_figlio',
  regione: 'sicilia',
  nome: 'Bonus figlio da 1.000 € (Sicilia)',
  ente: 'Regione Siciliana, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: '1.000 € una tantum per ogni figlio nato o adottato tra ottobre 2025 e settembre 2026, per le famiglie con ISEE fino a 10.000 €.',
  valuta(s) {
    const nato = !s.figliRisposta ? null : s.figli.some((f) => f.nascita && f.nascita >= '2025-10' && f.nascita <= '2026-09');
    const cittadinanza = s.cittadinanza === null ? null : s.cittadinanza === 'italiana' || s.cittadinanza === 'ue';
    return {
      requisiti: [req('Un figlio nato o adottato tra ottobre 2025 e settembre 2026', nato, 'figli'), iseeEntro(s, 10000, 'ISEE fino a 10.000 €'), req('Cittadinanza italiana o di un Paese UE', cittadinanza, 'cittadinanza')],
      importo: { breve: '1.000 € a figlio', testo: '1.000 € per ogni nuovo nato, con graduatoria regionale nei limiti dei fondi; paga il Comune.', unaTantum: 1000 },
      note: ['La domanda va fatta entro 45 giorni dalla nascita o dall\'adozione.', 'I nati da ottobre a dicembre 2026 rientrano nell\'avviso 2027.'],
    };
  },
  finestra: { a: '2026-11-20', testo: 'Domanda al Comune entro 45 giorni dalla nascita; per i nati da aprile a settembre 2026 i Comuni trasmettono entro il 20 novembre 2026.' },
  come: { testo: 'All\'ufficio servizi sociali del Comune di residenza, sul modello regionale.', link: 'https://www.regione.sicilia.it/la-regione-informa/bonus-bebe-2026-regione-mille-euro-nuovi-nati-pubblicato-bando' },
  fonti: [{ titolo: 'Regione Siciliana, Bonus bebè 2026: mille euro per i nuovi nati (DSG 535-S8 del 19/2/2026)', url: 'https://www.regione.sicilia.it/la-regione-informa/bonus-bebe-2026-regione-mille-euro-nuovi-nati-pubblicato-bando' }],
  verificato: VERIFICATO_REGIONI,
};

export const siciliaAffitto = {
  id: 'sicilia_contributo_affitto',
  regione: 'sicilia',
  nome: 'Contributo affitto da 3.000 € per le famiglie di almeno 3 persone (Sicilia)',
  ente: 'Regione Siciliana, tramite i Comuni',
  categoria: 'casa',
  sintesi: '3.000 € l\'anno, più 200 € per ogni figlio oltre il primo, alle famiglie di almeno tre persone in affitto con ISEE fino a 10.000 €.',
  valuta(s) {
    const affitto = req('Vivi in affitto con contratto registrato', s.casa === null ? null : s.casa !== 'affitto' ? false : s.contrattoRegistrato, s.casa === 'affitto' ? 'contratto_registrato' : 'casa');
    const importo = 3000 + Math.max(0, s.nFigli - 1) * 200;
    return {
      requisiti: [affitto, req('Famiglia di almeno 3 persone', s.componenti >= 3 ? true : s.figliRisposta ? false : null, 'figli'), iseeEntro(s, 10000, 'ISEE fino a 10.000 €'), residenzaRegioneAlmeno(s, 2, 'Sicilia')],
      importo: { breve: `${importo.toLocaleString('it-IT')} € l'anno`, testo: '3.000 € l\'anno più 200 € per ogni figlio oltre il primo; graduatoria regionale per ISEE crescente. Non è reddito e si somma ad altri aiuti simili.', annuo: importo },
    };
  },
  finestra: { a: '2026-09-25', testo: 'Per il 2026 i Comuni hanno trasmesso le domande entro il 25 settembre. Non è ancora noto se la misura sarà rifinanziata per il 2027.' },
  come: { testo: 'All\'ufficio servizi sociali del Comune di residenza, con il modello regionale.', link: 'https://www.regione.sicilia.it/istituzioni/servizi-informativi/decreti-e-direttive/approvazione-avviso-pubblico-relativo-ai-criteri-alle-procedure-presentazione-istanze-contributo-l-accesso-alle-abitazioni-locazione-cui-alla-lr' },
  fonti: [{ titolo: 'Regione Siciliana, DDG 1100 dell\'1/4/2026: avviso contributo affitto (art. 57 L.R. 1/2026)', url: 'https://www.regione.sicilia.it/istituzioni/servizi-informativi/decreti-e-direttive/approvazione-avviso-pubblico-relativo-ai-criteri-alle-procedure-presentazione-istanze-contributo-l-accesso-alle-abitazioni-locazione-cui-alla-lr' }],
  verificato: VERIFICATO_REGIONI,
};

export const siciliaDisabiliGravissimi = {
  id: 'sicilia_disabilita_gravissima',
  regione: 'sicilia',
  nome: 'Contributo mensile per la disabilità gravissima (Sicilia)',
  ente: 'Regione Siciliana, tramite le ASP',
  categoria: 'salute',
  sintesi: 'Contributo economico mensile alle persone riconosciute con disabilità gravissima dalla propria ASP.',
  valuta(s) {
    return {
      requisiti: [req('Nel nucleo c\'è una persona con disabilità gravissima', s.disabileNucleo, 'disabile_nucleo')],
      probabile: true,
      importo: { breve: 'contributo mensile', testo: 'La Regione trasferisce ogni mese i fondi alle ASP per le persone censite (oltre 16.000 nel 2026); l\'importo per persona non è indicato nei comunicati regionali.', nonSommare: true },
    };
  },
  finestra: { testo: 'Misura continua: si accede con la valutazione dell\'ASP, con gli arretrati.' },
  come: { testo: 'Chiedi la valutazione al distretto dell\'ASP di residenza.', link: 'https://regione.sicilia.it/la-regione-informa/politiche-sociali-40-milioni-persone-disabilita-gravissima' },
  fonti: [{ titolo: 'Regione Siciliana, 40 milioni per le persone con disabilità gravissima (13/10/2026)', url: 'https://regione.sicilia.it/la-regione-informa/politiche-sociali-40-milioni-persone-disabilita-gravissima' }],
  verificato: VERIFICATO_REGIONI,
};
