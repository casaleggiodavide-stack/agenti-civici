// Anziani e pensionati: assegno sociale, quattordicesima, esonero dal canone TV.

import { VERIFICATO, eur, req, cittadinanzaAmmessa, residenzaAlmeno } from './_comuni.js';

const FONTE_AS = { titolo: 'INPS, scheda Assegno sociale (importi e limiti di reddito 2026)', url: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-sociale-50184.assegno-sociale.html' };
const FONTE_14 = { titolo: 'INPS, Quattordicesima 2026: pagamento con la pensione di luglio (messaggio n. 2052 del 19/6/2026)', url: 'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.06.quattordicesima-2026-pagamento-con-la-pensione-di-luglio.html' };

export const assegnoSociale = {
  id: 'assegno_sociale',
  nome: 'Assegno sociale',
  ente: 'INPS',
  categoria: 'anziani',
  sintesi: 'Assegno mensile per chi ha almeno 67 anni e redditi bassi, anche senza aver mai versato contributi.',
  valuta(s) {
    const limiteSingolo = 7101.12;
    const limiteCoppia = 14202.24;
    let redditoOk = null;
    let annuo = null;
    if (s.coniuge === false && s.redditoPersonale !== null) {
      redditoOk = s.redditoPersonale < limiteSingolo;
      annuo = Math.max(0, limiteSingolo - s.redditoPersonale);
    } else if (s.coniuge === true && s.redditoPersonale !== null && s.redditoCoppia !== null) {
      redditoOk = s.redditoPersonale < limiteSingolo && s.redditoCoppia < limiteCoppia;
      annuo = Math.max(0, Math.min(limiteSingolo, limiteCoppia - s.redditoCoppia, limiteSingolo - s.redditoPersonale));
    }
    return {
      requisiti: [
        req('Hai almeno 67 anni', s.eta === null ? null : s.eta >= 67, 'eta'),
        cittadinanzaAmmessa(s),
        residenzaAlmeno(s, 10),
        req(s.coniuge
          ? `Reddito tuo sotto ${eur(limiteSingolo)} e della coppia sotto ${eur(limiteCoppia)}`
          : `Reddito personale sotto ${eur(limiteSingolo)} l'anno`, redditoOk, s.coniuge === null ? 'coniuge' : s.redditoPersonale === null ? 'reddito_personale' : 'reddito_coniuge'),
      ],
      importo: annuo === null ? null : { annuo: Math.round(annuo * 100) / 100, mensile: Math.round((annuo / 13) * 100) / 100, testo: `Fino a 546,24 € al mese per 13 mensilità (${eur(limiteSingolo)} l'anno), ridotto dei redditi che hai già.` },
      note: [
        'Serve la residenza legale e continuativa in Italia da almeno 10 anni. Se vai all\'estero per più di 29 giorni di fila il pagamento si sospende.',
        'Dai 70 anni, con redditi molto bassi, è prevista una maggiorazione che porta l\'importo vicino a 768 € al mese: chiedila insieme all\'assegno.',
      ],
    };
  },
  come: {
    testo: 'Domanda online all\'INPS con SPID o CIE, oppure gratis tramite un patronato.',
    link: FONTE_AS.url,
  },
  fonti: [FONTE_AS],
  verificato: VERIFICATO,
};

function pensioneDaLavoro(s, pensionato) {
  if (pensionato === false) return false;
  if (pensionato === null || s.pensioneTipo === null) return null;
  return s.pensioneTipo !== 'sociale';
}

export const quattordicesima = {
  id: 'quattordicesima',
  nome: 'Quattordicesima per i pensionati',
  ente: 'INPS',
  categoria: 'anziani',
  automatica: true,
  sintesi: 'Somma aggiuntiva pagata a luglio ai pensionati con almeno 64 anni e redditi fino a due volte il trattamento minimo.',
  valuta(s) {
    const pensionato = s.lavoro === null ? null : s.lavoro === 'pensionato';
    let eta = null;
    if (s.eta !== null) eta = s.eta >= 64 ? true : s.eta === 63 ? null : false;
    const fascia1 = 11931.08;
    const fascia2 = 15908.1;
    let annuo = null;
    if (s.redditoPersonale !== null && s.redditoPersonale <= fascia2 && s.anniContributi !== null) {
      const bassa = s.redditoPersonale <= fascia1;
      const c = s.anniContributi;
      annuo = c <= 15 ? (bassa ? 437 : 336) : c <= 25 ? (bassa ? 546 : 420) : (bassa ? 655 : 504);
    }
    return {
      requisiti: [
        req('Ricevi una pensione da lavoro (non l\'assegno sociale)', pensioneDaLavoro(s, pensionato), pensionato === null ? 'lavoro' : 'pensione_tipo'),
        req('Hai almeno 64 anni entro il 31 dicembre 2026', eta, 'eta'),
        req(`Reddito personale fino a ${eur(fascia2)} (due volte il trattamento minimo)`, s.redditoPersonale === null ? null : s.redditoPersonale <= fascia2, 'reddito_personale'),
        annuo === null && s.anniContributi === null ? req('Anni di contributi, per calcolare l\'importo', null, 'anni_contributi') : null,
      ].filter(Boolean),
      importo: annuo === null ? { breve: 'da 336 a 655 €', testo: 'Da 336 a 655 € secondo anni di contributi e reddito.' } : { annuo, testo: `${eur(annuo)} pagati con la pensione di luglio (a dicembre se compi 64 anni dopo luglio). Calcolato con le soglie dei lavoratori dipendenti: per gli autonomi gli scaglioni sono 18 e 28 anni di contributi.` },
      note: ['Arriva da sola. Se hai i requisiti e non l\'hai ricevuta, puoi chiederla online all\'INPS.'],
    };
  },
  come: {
    testo: 'Non serve fare domanda: l\'INPS la paga con la pensione di luglio o di dicembre. Se non è arrivata, chiedila online o tramite patronato.',
    link: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.quattordicesima-50602.quattordicesima.html',
  },
  fonti: [
    FONTE_14,
  ],
  verificato: VERIFICATO,
};

export const esoneroCanoneTv = {
  id: 'esonero_canone_tv',
  nome: 'Esonero dal canone TV per chi ha 75 anni',
  ente: 'Agenzia delle Entrate',
  categoria: 'anziani',
  sintesi: 'Chi ha compiuto 75 anni e ha un reddito, insieme al coniuge, non oltre 8.000 € non paga il canone RAI.',
  valuta(s) {
    // I figli minorenni di solito non hanno redditi; adulti conviventi sì, forse.
    const adultiConviventi = s.altriAdulti > 0 || s.figli.some((f) => f.anni === null || f.anni >= 18);
    const conviventi = !s.figliRisposta ? null : adultiConviventi ? null : true;
    return {
      requisiti: [
        req('Hai compiuto 75 anni', s.eta === null ? null : s.eta >= 75, 'eta'),
        req('Il tuo reddito, sommato a quello del coniuge, non supera 8.000 €', s.redditoCoppia === null ? (s.coniuge === false && s.redditoPersonale !== null ? s.redditoPersonale <= 8000 : null) : s.redditoCoppia <= 8000, s.redditoPersonale === null ? 'reddito_personale' : 'reddito_coniuge'),
        req('Non vivi con altre persone che hanno un reddito proprio (colf e badanti non contano)', conviventi, 'altri_adulti'),
      ],
      importo: { annuo: 90, testo: 'Non paghi il canone: 90 € l\'anno, addebitati di solito nella bolletta della luce.' },
      note: ['Se compi 75 anni tra febbraio e luglio, l\'esonero vale dal secondo semestre.', 'La dichiarazione vale anche per gli anni seguenti finché restano i requisiti. Se hai già pagato, puoi chiedere il rimborso.'],
    };
  },
  come: {
    testo: 'Invii una dichiarazione sostitutiva (quadro I) all\'Agenzia delle Entrate: con raccomandata senza busta a Agenzia delle Entrate, DP I Torino, Ufficio Canone TV, Casella postale 22, 10121 Torino; con PEC firmata a cp22.canonetv@postacertificata.rai.it; oppure a mano in un ufficio dell\'Agenzia.',
    link: 'https://www.agenziaentrate.gov.it/portale/aree-tematiche/canone-tv/casi-di-esonero/ultrasettantacinquenni',
    etichettaLink: 'Modulo e istruzioni',
  },
  fonti: [{ titolo: 'Agenzia delle Entrate, Canone TV: esonero ultrasettantacinquenni', url: 'https://www.agenziaentrate.gov.it/portale/aree-tematiche/canone-tv/casi-di-esonero/ultrasettantacinquenni' }],
  verificato: VERIFICATO,
};
