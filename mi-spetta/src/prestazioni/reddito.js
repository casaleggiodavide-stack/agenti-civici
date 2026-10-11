// Sostegno al reddito: Assegno di inclusione, Supporto formazione e lavoro, Carta acquisti.

import { VERIFICATO, eur, req, cittadinanzaAmmessa, residenzaAlmeno, iseeEntro, scalaADI, sogliaMobiliareADI, soloOver67 } from './_comuni.js';
import { almenoUno } from '../logica.js';

const FONTE_ADI = { titolo: 'INPS, Assegno di inclusione: le novità 2026 (messaggio n. 640 del 23/2/2026)', url: 'https://inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.assegno-di-inclusione-le-novit-2026.html' };
const FONTE_DL48 = { titolo: 'Decreto-legge 48/2023, articolo 2, testo vigente (Normattiva)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2023-05-04;48' };
const FONTE_CAMERA = { titolo: 'Camera dei deputati, Inclusione sociale e lavorativa (aggiornato all\'1/1/2026)', url: 'https://temi.camera.it/leg19/temi/l-assegno-di-inclusione-e-gli-altri-strumenti-di-contrasto-alla-poverta.html' };

export const assegnoInclusione = {
  id: 'assegno_inclusione',
  nome: 'Assegno di inclusione (ADI)',
  ente: 'INPS',
  categoria: 'reddito',
  sintesi: 'Sostegno mensile per famiglie con redditi molto bassi in cui c\'è un minore, una persona con disabilità o una persona con almeno 60 anni. Comprende una quota per l\'affitto.',
  valuta(s) {
    const categoria = almenoUno(
      s.figliRisposta ? s.minori.length > 0 : null,
      s.disabileNucleo,
      s.over60,
    );
    const scala = scalaADI(s);
    const over67 = soloOver67(s);
    const base = over67 === true ? 8190 : 6500;
    const sogliaReddito = base * scala;
    const sogliaAffitto = 10140 * scala;
    let redditoOk = null;
    let probabile = false;
    if (s.redditoFamiliare !== null) {
      if (s.redditoFamiliare < sogliaReddito) redditoOk = true;
      else if (s.casa === 'affitto' && s.redditoFamiliare < sogliaAffitto) { redditoOk = true; probabile = true; }
      else if (s.casa === null) redditoOk = null;
      else redditoOk = false;
    }
    const sogliaMob = sogliaMobiliareADI(s);
    const requisiti = [
      req('Nel nucleo c\'è un minorenne, una persona con disabilità o una persona con almeno 60 anni', categoria, s.figliRisposta ? 'disabile_nucleo' : 'figli'),
      cittadinanzaAmmessa(s),
      residenzaAlmeno(s, 5),
      iseeEntro(s, 10140, 'ISEE fino a 10.140 € (si usa l\'ISEE per prestazioni familiari e inclusione, spesso più basso dell\'ordinario)'),
      req(`Reddito familiare sotto ${eur(Math.round(sogliaReddito))} (soglia di ${eur(base)} per la scala di equivalenza stimata ${scala.toFixed(2).replace('.', ',')})`, redditoOk, 'reddito_familiare'),
      req(`Risparmi della famiglia fino a ${eur(sogliaMob)}`, s.patrimonioMobiliare === null ? null : s.patrimonioMobiliare <= sogliaMob, 'patrimonio_mobiliare'),
      req('Altri immobili oltre la casa in cui vivi fino a 30.000 € di valore IMU', s.altriImmobili === null ? null : s.altriImmobili <= 30000, 'altri_immobili'),
    ];
    let annuo = 0;
    if (s.redditoFamiliare !== null) {
      annuo = Math.max(0, sogliaReddito - s.redditoFamiliare);
      if (s.casa === 'affitto' && s.canoneAnnuo) {
        const maxAffitto = over67 === true || s.disabileNucleo ? 1950 : 3640;
        annuo += Math.min(s.canoneAnnuo, maxAffitto);
      }
      annuo = Math.max(annuo, 480);
    }
    const note = [
      'La scala di equivalenza qui è stimata: conta 1 per te, 0,4 per un partner con almeno 60 anni o con carichi di cura, 0,15 per ciascuno dei primi due minori e 0,10 per gli altri. L\'INPS la calcola sui dati della DSU.',
      'Valgono anche limiti sui veicoli: nessuna auto sopra 1.600 cc o moto sopra 250 cc immatricolata negli ultimi 36 mesi.',
      'Dura 18 mesi e si rinnova per 12. Dal 2026 non c\'è più il mese di sospensione tra un periodo e l\'altro.',
      'Possono chiederlo anche famiglie con un adulto in condizione di svantaggio inserito in un programma di cura dei servizi sociali o sanitari.',
    ];
    if (probabile) note.unshift('Vivi in affitto: la soglia di reddito sale a 10.140 € per la scala di equivalenza. Il testo di legge su questo punto va verificato con l\'INPS.');
    return {
      requisiti,
      probabile,
      importo: s.redditoFamiliare === null ? null : { annuo: Math.round(annuo), mensile: Math.round(annuo / 12), testo: `Stima: integrazione del reddito fino a ${eur(Math.round(sogliaReddito))} l'anno, più la quota per l'affitto fino a ${eur(over67 === true || s.disabileNucleo ? 1950 : 3640)}. Minimo 480 € l'anno.` },
      note,
    };
  },
  come: {
    testo: 'Domanda online all\'INPS con SPID, CIE o CNS, oppure gratis tramite un patronato o un CAF. Dopo la domanda ti iscrivi al SIISL e firmi il patto di attivazione digitale. I soldi arrivano sulla Carta ADI.',
    passi: ['Fai o aggiorna la DSU per l\'ISEE', 'Presenta la domanda di ADI all\'INPS', 'Iscriviti al SIISL e firma il patto di attivazione digitale', 'Vai al primo appuntamento con i servizi sociali entro 120 giorni'],
    documenti: ['ISEE valido', 'Contratto d\'affitto registrato, se sei in affitto', 'Documento d\'identità e codice fiscale'],
    link: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-di-inclusione-adi.html',
  },
  fonti: [FONTE_ADI, FONTE_DL48, FONTE_CAMERA],
  verificato: VERIFICATO,
};

export const supportoFormazioneLavoro = {
  id: 'supporto_formazione_lavoro',
  nome: 'Supporto per la formazione e il lavoro (SFL)',
  ente: 'INPS',
  categoria: 'lavoro',
  sintesi: '500 € al mese per chi ha tra 18 e 59 anni e un ISEE basso, mentre frequenta corsi di formazione, tirocini o progetti di servizio civile.',
  valuta(s) {
    const scala = scalaADI(s);
    const soglia = 6000 * scala;
    const sogliaMob = sogliaMobiliareADI(s);
    const categoriaADI = almenoUno(s.figliRisposta ? s.minori.length > 0 : null, s.disabileNucleo, s.over60);
    return {
      requisiti: [
        req('Età tra 18 e 59 anni', s.eta === null ? null : s.eta >= 18 && s.eta <= 59, 'eta'),
        cittadinanzaAmmessa(s),
        residenzaAlmeno(s, 5),
        iseeEntro(s, 10140),
        req(`Reddito familiare sotto ${eur(Math.round(soglia))} (6.000 € per la scala di equivalenza stimata)`, s.redditoFamiliare === null ? null : s.redditoFamiliare < soglia, 'reddito_familiare'),
        req(`Risparmi della famiglia fino a ${eur(sogliaMob)}`, s.patrimonioMobiliare === null ? null : s.patrimonioMobiliare <= sogliaMob, 'patrimonio_mobiliare'),
        req('Altri immobili fino a 30.000 € di valore IMU', s.altriImmobili === null ? null : s.altriImmobili <= 30000, 'altri_immobili'),
      ],
      probabile: true,
      importo: { annuo: 6000, mensile: 500, nonSommare: true, testo: '500 € al mese per i mesi in cui partecipi a formazione o politiche attive, fino a 12 mesi, prorogabili di altri 12 se a scadenza frequenti un corso.' },
      note: [
        'Si riceve solo partecipando davvero a un corso, un tirocinio o un progetto: per questo lo indichiamo come probabile.',
        categoriaADI === true
          ? 'Nella tua famiglia c\'è chi dà diritto all\'ADI: l\'SFL spetta ai componenti tra 18 e 59 anni non conteggiati nella scala dell\'ADI, e non si somma all\'ADI per le stesse persone.'
          : 'Non si somma all\'ADI per le stesse persone, né alla NASpI nello stesso periodo.',
      ],
    };
  },
  come: {
    testo: 'Domanda online all\'INPS o tramite patronato, poi iscrizione al SIISL dove scegli il corso o il progetto.',
    link: 'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.supporto-per-la-formazione-e-il-lavoro-sfl-.html',
  },
  fonti: [FONTE_CAMERA, FONTE_DL48],
  verificato: VERIFICATO,
};

export const cartaAcquisti = {
  id: 'carta_acquisti',
  nome: 'Carta Acquisti',
  ente: 'MEF e INPS, tramite Poste Italiane',
  categoria: 'reddito',
  sintesi: 'Carta prepagata da 40 € al mese per la spesa e le bollette, per chi ha almeno 65 anni o un figlio sotto i 3 anni e redditi molto bassi.',
  valuta(s) {
    const figlioPiccolo = s.figliRisposta ? s.minori.some((f) => f.anni !== null && f.anni < 3) : null;
    const eta = s.eta === null ? null : s.eta >= 65;
    const sogliaReddito = s.eta !== null && s.eta >= 70 ? 10974.42 : 8230.81;
    return {
      requisiti: [
        req('Hai almeno 65 anni, oppure hai un figlio sotto i 3 anni', almenoUno(eta, figlioPiccolo), 'eta'),
        iseeEntro(s, 8230.81, 'ISEE fino a 8.230,81 €'),
        req(`Redditi percepiti fino a ${eur(sogliaReddito)}`, s.redditoPersonale === null ? null : s.redditoPersonale <= sogliaReddito, 'reddito_personale'),
        req('Risparmi sotto i 15.000 €', s.patrimonioMobiliare === null ? null : s.patrimonioMobiliare < 15000, 'patrimonio_mobiliare'),
        req('Nessun altro immobile oltre alla casa in cui vivi', s.altriImmobili === null ? null : s.altriImmobili === 0, 'altri_immobili'),
      ],
      probabile: true,
      importo: { annuo: 480, mensile: 40, testo: '40 € al mese, accreditati 80 € ogni due mesi sulla carta.' },
      note: [
        'Le soglie 2026 vengono da una comunicazione del MEF riportata da fonti secondarie; la soglia più alta per gli anziani vale dai 70 anni secondo alcune fonti e dai 75 secondo altre. Per questo l\'esito è «probabile».',
        'Ci sono altri limiti: al massimo un\'auto, una sola utenza elettrica domestica.',
      ],
    };
  },
  come: {
    testo: 'Compili il modulo e lo consegni a un ufficio postale. Se la ricevi già, continua in automatico finché hai i requisiti.',
    link: 'https://www.mef.gov.it/focus/Carta-Acquisti/',
    etichettaLink: 'Pagina ufficiale e modulo',
  },
  fonti: [
    { titolo: 'MEF, Carta Acquisti', url: 'https://www.mef.gov.it/focus/Carta-Acquisti/' },
  ],
  verificato: VERIFICATO,
};
