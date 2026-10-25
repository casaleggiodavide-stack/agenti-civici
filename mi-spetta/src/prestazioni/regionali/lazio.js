// Lazio: misure regionali verificate il 25/10/2026 sugli atti della Regione.
// Esclusa la borsa DiSCo: dipende dall'università frequentata, non dalla residenza.

import { VERIFICATO_REGIONI, eur, req, iseeEntro, figlioTra } from '../_comuni.js';

const R = 'https://www.regione.lazio.it/sites/default/files';

export const lazioAbbonamentiIsee = {
  id: 'lazio_abbonamenti_isee',
  regione: 'lazio',
  nome: 'Sconto ISEE sugli abbonamenti annuali di bus e treni (Lazio)',
  ente: 'Regione Lazio',
  categoria: 'casa',
  sintesi: 'Sconto del 30% sull\'abbonamento annuale Metrebus con ISEE fino a 25.000 €, del 50% con ISEE fino a 15.000 € o per alcune famiglie (un solo genitore, almeno 4 figli, disabilità grave).',
  valuta(s) {
    const meta = s.isee !== null && s.isee <= 15000;
    return {
      requisiti: [iseeEntro(s, 25000, 'ISEE fino a 25.000 €')],
      importo: {
        breve: meta ? '50% di sconto' : 'dal 30% al 50% di sconto',
        testo: `${meta ? 'Con ISEE fino a 15.000 € lo sconto è del 50%.' : 'Sconto del 30%, che sale al 50% con ISEE fino a 15.000 €, per i nuclei con un solo genitore, con almeno 4 figli o con una persona con disabilità grave.'} Sconti in più per il secondo, terzo e quarto abbonamento della stessa famiglia. Esempio: il Metrebus Lazio annuale costa da 130 € (1 zona) a 510 € (6-7 zone).`,
        nonSommare: true,
      },
      note: ['Vale solo per gli abbonamenti annuali.', 'Le richieste si accolgono in ordine di arrivo fino a esaurimento dei fondi 2026.'],
    };
  },
  finestra: { testo: 'Aperta per tutto il 2026, fino a esaurimento dei fondi.' },
  come: { testo: 'Registrati con l\'ISEE sul portale regionale SIRGAT: rilascia un voucher da usare quando compri l\'abbonamento.', link: 'https://agevolazionitariffarietpl.regione.lazio.it/' },
  fonti: [
    { titolo: 'Regione Lazio, Determinazione G02712 del 2/3/2026: agevolazioni tariffarie TPL 2026', url: `${R}/amministrazione-trasparente/criteri-e-modalita/G02712-02032026.pdf` },
    { titolo: 'Regione Lazio, DGR 311/2017, Allegato A (criteri e percentuali)', url: `${R}/documentazione/MOB_DGR_311_13_06_2017_AllegatoA.pdf` },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const lazioOver70 = {
  id: 'lazio_over70_trasporti',
  regione: 'lazio',
  nome: 'Viaggi gratis su Cotral e treni regionali per chi ha 70 anni (Lazio)',
  ente: 'Regione Lazio',
  categoria: 'anziani',
  sintesi: 'Chi risiede nel Lazio e ha almeno 70 anni viaggia gratis sui bus Cotral e sui treni regionali Trenitalia in seconda classe, senza limiti di ISEE.',
  valuta(s) {
    return {
      requisiti: [req('Almeno 70 anni', s.eta === null ? null : s.eta >= 70, 'eta')],
      importo: { breve: 'viaggi gratis', testo: 'Tessera gratuita per bus Cotral e treni regionali in seconda classe. Dall\'autunno 2026 vale anche sulle Unità di rete, con attivazione automatica. Restano esclusi i viaggi dentro Roma su ATAC e Roma TPL.', nonSommare: true },
    };
  },
  finestra: { testo: 'Si può chiedere in ogni momento.' },
  come: { testo: 'Richiesta della tessera sul sito di Cotral, nella sezione agevolazioni.', link: 'https://cotralspa.it/assistenza/agevolazioni/' },
  fonti: [
    { titolo: 'Regione Lazio, Over 70 e studenti under 26 viaggiano gratis sulle Unità di rete (16/10/2026)', url: 'https://www.regione.lazio.it/notizie/trasporti-over-70-e-studenti-under-26-viaggiano-gratis-sulle-unita-di-rete' },
    { titolo: 'Cotral, Agevolazioni', url: 'https://cotralspa.it/assistenza/agevolazioni/' },
  ],
  verificato: VERIFICATO_REGIONI,
};

export const lazioLibriTesto = {
  id: 'lazio_libri_testo',
  regione: 'lazio',
  nome: 'Contributo per libri di testo e dispositivi (Lazio)',
  ente: 'Regione Lazio, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: 'Rimborso delle spese per libri, dizionari, sussidi digitali, notebook o tablet degli studenti di scuola media e superiore con ISEE fino a 15.493,71 €.',
  valuta(s) {
    return {
      requisiti: [
        figlioTra(s, 10, 20, 'Un figlio iscritto alla scuola media o superiore'),
        iseeEntro(s, 15493.71, 'ISEE fino a 15.493,71 €'),
      ],
      probabile: true,
      importo: { breve: 'fino alla spesa sostenuta', testo: 'La Regione divide i fondi tra i Comuni: chi spende meno della quota a testa riceve l\'intera fattura. Servono fatture elettroniche, non scontrini.', nonSommare: true },
    };
  },
  finestra: { a: '2026-09-30', testo: 'Per il 2026-2027 le domande andavano presentate al Comune; i Comuni le hanno trasmesse entro il 30 settembre 2026. Le nuove linee guida sono attese a luglio 2027.' },
  come: { testo: 'Domanda al tuo Comune di residenza con il bando comunale, allegando ISEE e fatture elettroniche.', link: `${R}/documentazione/2026/SCU-DD-G10612-29-07-2026-AllegatoA.pdf`, etichettaLink: 'Linee guida regionali' },
  fonti: [{ titolo: 'Regione Lazio, Determinazione G10612 del 29/7/2026: linee guida ai Comuni, Allegato A', url: `${R}/documentazione/2026/SCU-DD-G10612-29-07-2026-AllegatoA.pdf` }],
  verificato: VERIFICATO_REGIONI,
};

export const lazioFondoAffitto = {
  id: 'lazio_fondo_affitto',
  regione: 'lazio',
  nome: 'Contributo regionale per l\'affitto (Lazio)',
  ente: 'Regione Lazio, tramite i Comuni',
  categoria: 'casa',
  sintesi: 'Fino al 40% dell\'affitto annuo, massimo 2.000 €, per chi ha un ISEE fino a 14.000 € e paga un affitto superiore al 24% del proprio ISEE.',
  valuta(s) {
    const affitto = req('Vivi in affitto in un alloggio privato', s.casa === null ? null : s.casa === 'affitto', 'casa');
    const registrato = s.casa === 'affitto' ? req('Contratto d\'affitto registrato', s.contrattoRegistrato, 'contratto_registrato') : null;
    let incidenza = null;
    if (s.casa === 'affitto') {
      const ok = s.canoneAnnuo === null || s.isee === null ? null : s.isee === 0 || s.canoneAnnuo / s.isee > 0.24;
      incidenza = req('L\'affitto annuo supera il 24% del tuo ISEE', ok, s.canoneAnnuo === null ? 'canone_annuo' : 'isee');
    }
    const stima = s.canoneAnnuo ? Math.min(2000, Math.round(s.canoneAnnuo * 0.4)) : null;
    return {
      requisiti: [affitto, registrato, iseeEntro(s, 14000, 'ISEE fino a 14.000 €'), incidenza],
      importo: { breve: stima ? `fino a ${eur(stima)}` : 'fino a 2.000 €', testo: `Fino al 40% dell'affitto pagato, massimo 2.000 € l'anno${stima ? `: con il tuo affitto, fino a ${eur(stima)}` : ''}. Il Comune può pagare meno se i fondi non bastano.`, annuo: stima || 0 },
      note: ['Non si somma con la quota affitto dell\'Assegno di inclusione: il Comune la scala dal contributo.', 'Nessuno nella famiglia deve avere una casa adeguata nello stesso Comune.'],
    };
  },
  finestra: { a: '2026-04-30', testo: 'I bandi comunali per l\'annualità 2025 sono chiusi. L\'annualità 2026 è attesa con una nuova delibera regionale, di solito a dicembre.' },
  come: { testo: 'Domanda al tuo Comune con il modulo del bando comunale, allegando contratto registrato e ISEE.', link: 'https://regione.lazio.it/cittadini/casa/fondo-di-sostegno-alla-locazione' },
  fonti: [
    { titolo: 'Regione Lazio, Fondo di sostegno alla locazione', url: 'https://regione.lazio.it/cittadini/casa/fondo-di-sostegno-alla-locazione' },
    { titolo: 'Regione Lazio, DGR n. 1296 del 18/12/2025', url: 'https://regione.lazio.it/sites/default/files/documentazione/2026/DGR-1296-18-12-2025.pdf' },
  ],
  verificato: VERIFICATO_REGIONI,
};
