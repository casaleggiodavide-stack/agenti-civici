// Casa e bollette: bonus sociali ARERA, contributo luce per ISEE fino a 25.000 €,
// bonus TARI, detrazioni per chi è in affitto.

import { VERIFICATO, eur, req, iseeEntro } from './_comuni.js';

const ARERA_SOGLIA = { titolo: 'ARERA, comunicato del 23/1/2026: soglia ISEE dei bonus sociali a 9.796 €', url: 'https://www.arera.it/comunicati-stampa/dettaglio/bonus-sociali-arera-alza-a-9796-euro-la-soglia-isee-per-laccesso-alle-agevolazioni-per-acqua-luce-gas-e-rifiuti' };
const ARERA_IMPORTI = { titolo: 'ARERA, bonus sociale per disagio economico: a quanto ammontano', url: 'https://arera.it/consumatori/bonus-sociale/bonus-sociale-per-disagio-economico/a-quanto-ammontano' };
const ARERA_115 = { titolo: 'ARERA, comunicato del 19/3/2026: contributo straordinario da 115 €', url: 'https://www.arera.it/comunicati-stampa/dettaglio/bonus-sociale-elettrico-definite-le-modalita-di-erogazione-del-contributo-straordinario-da-115-euro' };
const ARERA_238 = { titolo: 'ARERA, delibera 238/2026/R/eel del 2/7/2026', url: 'https://www.arera.it/fileadmin/allegati/docs/26/238-2026-R-eel.pdf' };
const ARERA_TARI = { titolo: 'ARERA, delibera 355/2025/R/rif: bonus sociale rifiuti', url: 'https://www.arera.it/atti-e-provvedimenti/dettaglio/25/355-25' };
const ADE_GUIDA = { titolo: 'Agenzia delle Entrate, Tutte le agevolazioni della dichiarazione 2026: altre detrazioni (canoni di locazione)', url: 'https://www.agenziaentrate.gov.it/portale/web/guest/agevolazioni' };

const SOGLIA = 9796;
const SOGLIA_4_FIGLI = 20000;

function sogliaBonusSociale(s) {
  if (!s.figliRisposta) return SOGLIA;
  return s.nFigli >= 4 ? SOGLIA_4_FIGLI : SOGLIA;
}

function iseeBonusSociale(s) {
  const soglia = sogliaBonusSociale(s);
  return iseeEntro(s, soglia, s.nFigli >= 4
    ? 'ISEE fino a 20.000 € (famiglie con almeno 4 figli a carico)'
    : 'ISEE fino a 9.796 € (20.000 € con almeno 4 figli a carico)');
}

const intestate = (s) => req('Una bolletta è intestata a un componente della famiglia', s.utenzeIntestate, 'utenze_intestate');

export const bonusSocialeBollette = {
  id: 'bonus_sociale_bollette',
  nome: 'Bonus sociale luce, gas e acqua',
  ente: 'ARERA, con INPS e i gestori',
  categoria: 'casa',
  automatica: true,
  sintesi: 'Sconto automatico sulle bollette di luce, gas e acqua per le famiglie con ISEE basso. Basta avere la DSU per l\'ISEE: non serve altra domanda.',
  valuta(s) {
    const luce = s.componenti <= 2 ? 146 : s.componenti <= 4 ? 186.15 : 204.4;
    return {
      requisiti: [iseeBonusSociale(s), intestate(s)],
      importo: { annuo: luce, testo: `Luce: ${eur(luce)} l'anno per una famiglia di ${s.componenti} ${s.componenti === 1 ? 'persona' : 'persone'}. Gas: sconto che varia per zona climatica e uso. Acqua: 50 litri al giorno a persona gratis.` },
      note: [
        'Il totale indicato conta solo la luce: gas e acqua dipendono dalla zona e dal gestore.',
        'Chi aveva il bonus elettrico al 21 febbraio 2026 riceve in bolletta anche un contributo straordinario una tantum di 115 €.',
        'Il bonus dura 12 mesi dalla DSU: rinnova l\'ISEE ogni anno per non perderlo.',
      ],
    };
  },
  come: {
    testo: 'Presenta la DSU per l\'ISEE, online all\'INPS o gratis in un CAF. Lo sconto arriva in bolletta da solo.',
    link: 'https://www.arera.it/consumatori/bonus-sociale',
    etichettaLink: 'Come funziona, sul sito ARERA',
  },
  fonti: [ARERA_SOGLIA, ARERA_IMPORTI, ARERA_115],
  verificato: VERIFICATO,
};

export const contributoLuce25000 = {
  id: 'contributo_luce_isee_25000',
  nome: 'Sconto luce per ISEE fino a 25.000 €',
  ente: 'Il tuo venditore di energia, regole ARERA',
  categoria: 'casa',
  sintesi: 'Per il 2026 e il 2027 i venditori che aderiscono riconoscono uno sconto sulla bolletta della luce alle famiglie con ISEE fino a 25.000 € che non hanno il bonus sociale.',
  valuta(s) {
    const soglia = sogliaBonusSociale(s);
    const fascia = s.isee === null ? null : s.isee > soglia && s.isee <= 25000;
    return {
      requisiti: [
        req(`ISEE sopra la soglia del bonus sociale e fino a 25.000 €`, fascia, 'isee'),
        intestate(s),
      ],
      probabile: true,
      importo: { breve: 'sconto su un bimestre', testo: 'Lo sconto è pari alla componente prezzo dell\'energia sui consumi del primo bimestre. L\'importo dipende dai consumi e dal venditore.' },
      note: ['Lo sconto è facoltativo per il venditore: chiedi al tuo se aderisce. L\'elenco dei venditori aderenti è pubblicato da ARERA (determina DSME 5/2026 del 2/10/2026).', 'Il requisito sui consumi lo verifichi sulla bolletta: una famiglia media resta sotto queste soglie.'],
    };
  },
  come: {
    testo: 'Chiedi al tuo venditore di luce se aderisce e come presentare l\'ISEE. Se non aderisce, puoi valutare un venditore che lo fa.',
    link: 'https://www.arera.it/fileadmin/allegati/docs/26/238-2026-R-eel.pdf',
    etichettaLink: 'Delibera ARERA 238/2026',
  },
  fonti: [ARERA_238],
  verificato: VERIFICATO,
};

export const bonusTari = {
  id: 'bonus_sociale_tari',
  nome: 'Bonus sociale rifiuti (TARI)',
  ente: 'Il tuo Comune o gestore dei rifiuti, regole ARERA',
  categoria: 'casa',
  automatica: true,
  sintesi: 'Dal 2026 le famiglie con ISEE basso hanno uno sconto automatico del 25% sulla tassa dei rifiuti.',
  valuta(s) {
    return {
      requisiti: [iseeBonusSociale(s), req('La TARI è intestata a un componente della famiglia', s.utenzeIntestate, 'utenze_intestate')],
      importo: { breve: '25% della TARI', testo: 'Il 25% di quello che paghi di TARI, scontato nell\'avviso di pagamento o rimborsato.' },
      note: ['Nel 2026 si applica alla TARI del 2025, con la DSU presentata nel 2025. Uno solo per famiglia.', 'Se non lo vedi nell\'avviso, il gestore lo riconosce con un rimborso diretto o tramite Poste.'],
    };
  },
  come: { testo: 'Non serve domanda: basta la DSU per l\'ISEE. Controlla l\'avviso TARI e, se manca lo sconto, chiedi al Comune o al gestore dei rifiuti.', link: 'https://www.arera.it/atti-e-provvedimenti/dettaglio/25/355-25', etichettaLink: 'Delibera ARERA' },
  fonti: [ARERA_SOGLIA, ARERA_TARI],
  verificato: VERIFICATO,
};

function giovaneInAffitto(s) {
  const eta = s.eta === null ? null : s.eta >= 20 && s.eta < 31;
  const reddito = s.redditoPersonale === null ? null : s.redditoPersonale <= 15493.71;
  const affitto = s.casa === null ? null : s.casa === 'affitto';
  if ([eta, reddito, affitto, s.contrattoRegistrato].includes(false)) return false;
  if ([eta, reddito, affitto, s.contrattoRegistrato].includes(null)) return null;
  return true;
}

export const detrazioneAffitto = {
  id: 'detrazione_affitto',
  nome: 'Detrazione per chi vive in affitto',
  ente: 'Agenzia delle Entrate, nel 730',
  categoria: 'casa',
  sintesi: 'Chi vive in affitto nella casa di residenza può togliere dall\'IRPEF 300 € o 150 € l\'anno, secondo il reddito.',
  valuta(s) {
    const r = s.redditoPersonale;
    const importo = r === null ? null : r <= 15493.71 ? 300 : r <= 30987.41 ? 150 : 0;
    const giovane = giovaneInAffitto(s);
    return {
      requisiti: [
        req('Vivi in affitto nella casa dove hai la residenza', s.casa === null ? null : s.casa === 'affitto', 'casa'),
        req('Il contratto è registrato', s.contrattoRegistrato, 'contratto_registrato'),
        req('Reddito complessivo fino a 30.987,41 €', r === null ? null : r <= 30987.41, 'reddito_personale'),
        giovane === true ? req('Non ti conviene la detrazione per i giovani in affitto, che è più alta e non si somma a questa', false) : null,
      ].filter(Boolean),
      importo: importo ? { annuo: importo, testo: `${eur(importo)} in meno di IRPEF, rapportati ai giorni in cui la casa è stata la tua abitazione principale.` } : null,
      note: ['Con un contratto a canone concordato la detrazione sale a 495,80 € o 247,90 €. Se ti sei trasferito per lavoro, fino a 991,60 €.', 'La detrazione riduce l\'IRPEF che paghi: se l\'imposta è già zero, chiedi al CAF se ti spetta comunque.'],
    };
  },
  come: { testo: 'La indichi nel 730 o nel modello Redditi (rigo E71), anche con la precompilata. Conserva il contratto registrato e le ricevute.', link: 'https://infoprecompilata.agenziaentrate.gov.it/', etichettaLink: 'Dichiarazione precompilata' },
  fonti: [ADE_GUIDA],
  verificato: VERIFICATO,
};

export const detrazioneAffittoGiovani = {
  id: 'detrazione_affitto_giovani',
  nome: 'Detrazione affitto per giovani tra 20 e 31 anni',
  ente: 'Agenzia delle Entrate, nel 730',
  categoria: 'casa',
  sintesi: 'Chi ha tra 20 e 31 anni e prende in affitto una casa diversa da quella dei genitori toglie dall\'IRPEF il 20% del canone, da 991,60 € fino a 2.000 € l\'anno, per i primi quattro anni.',
  valuta(s) {
    const importo = s.canoneAnnuo === null ? null : Math.min(2000, Math.max(991.6, 0.2 * s.canoneAnnuo));
    return {
      requisiti: [
        req('Hai almeno 20 anni e non ancora 31', s.eta === null ? null : s.eta >= 20 && s.eta < 31, 'eta'),
        req('Vivi in affitto, in una casa diversa da quella dei tuoi genitori', s.casa === null ? null : s.casa === 'affitto', 'casa'),
        req('Il contratto è registrato', s.contrattoRegistrato, 'contratto_registrato'),
        req('Reddito complessivo fino a 15.493,71 €', s.redditoPersonale === null ? null : s.redditoPersonale <= 15493.71, 'reddito_personale'),
      ],
      importo: importo === null ? { breve: 'da 991,60 a 2.000 €', testo: 'Il 20% del canone annuo, con un minimo di 991,60 € e un massimo di 2.000 €.' } : { annuo: Math.round(importo * 100) / 100, testo: `Il 20% del canone, cioè ${eur(importo)} l'anno, rapportati ai giorni di residenza.` },
      note: ['Vale per i primi quattro anni dalla firma del contratto.', 'La soglia di reddito è quella della guida ufficiale per la dichiarazione 2026. Alcune fonti secondarie parlano di modifiche con la legge di bilancio 2026: ricontrolla nella prossima precompilata.'],
    };
  },
  come: { testo: 'La indichi nel 730 o nel modello Redditi (rigo E71, codice 4).', link: 'https://infoprecompilata.agenziaentrate.gov.it/', etichettaLink: 'Dichiarazione precompilata' },
  fonti: [ADE_GUIDA],
  verificato: VERIFICATO,
};
