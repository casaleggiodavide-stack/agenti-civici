// Alberi per il futuro: le edizioni dal 2015, con i numeri dichiarati e la fonte di ognuno.
// Dove una fonte non dà un numero lo diciamo, senza stimarlo.

export const VERIFICATO = '2026-10-25';
const B = 'https://www.ilblogdellestelle.it';
const W = 'https://web.archive.org/web/2019/https://www.ilblogdellestelle.it';

export const TOTALE = {
  alberi: 57000,
  citta: 250,
  testo: 'oltre 57.000 alberi messi a dimora in circa 250 città italiane tra il 2015 e il 2019',
  fonte: { titolo: 'Blog delle Stelle, 24 novembre 2020', url: `${B}/2020/11/alberi-per-il-futuro-2020-la-festa-social-ha-invaso-litalia.html` },
};

export const EDIZIONI = [
  {
    anno: 2015, quando: '8 e 15 novembre a Reggio Emilia, 8 e 12 dicembre a Milano', alberi: 1873, comuni: 2, persone: 'circa 480 volontari',
    racconto: 'Nasce come «Mille alberi in più per Reggio Emilia»: cinque parchi e boschi urbani, poi un bosco di piante autoctone, un prato fiorito e un frutteto all\'ex velodromo di Milano. Alberi pagati dai cittadini, che potevano dedicarli ai propri figli.',
    fonti: [`${B}/2015/10/1000_alberi_in_piu_per_reggio_emilia.html`, `${B}/2015/12/573alberi_nuovi_per_milano.html`],
  },
  {
    anno: 2016, quando: '19 e 20 novembre', alberi: 6000, alberiNota: 'dato dichiarato nel 2020', comuni: null, persone: null,
    racconto: 'Torino, Reggio Emilia, Cavriago, Milano e Mira. A Torino si pianta anche nel giardino di una scuola materna e nel carcere, con i detenuti; a Mira nasce un bosco dedicato alle donne vittime di violenza.',
    fonti: [`${B}/2016/11/mille_alberi_in_ogni_citta_ditalia.html`, `${B}/2020/10/con-alberi-per-il-futuro-continuiamo-a-seminare-speranza.html`],
  },
  {
    anno: 2017, quando: '19 novembre e le settimane successive', alberi: 23661, comuni: 67, persone: 'oltre 5.000 volontari',
    racconto: 'Il salto: 12.000 alberi a Roma, un bosco di mille alberi a Torino, una fascia boscata lungo la tangenziale di Milano. Aderiscono amministrazioni di ogni colore; le piante arrivano dai vivai forestali delle Regioni e dei Carabinieri.',
    fonti: [`${B}/2017/11/23661_nuovi_alberi_per_il_futuro.html`, `${B}/2017/11/12000_nuovi_alberi_per_roma.html`],
  },
  {
    anno: 2018, quando: '17 e 18 novembre', alberi: 10000, alberiNota: 'oltre', comuni: 180, comuniNota: 'più di', persone: null,
    racconto: 'Da Aosta a Pantelleria. Arriva l\'etichetta-ricordo per i bambini, con il loro nome legato all\'albero, e la mappa delle piantumazioni. In aprile la prima Festa di primavera, per curare gli alberi piantati.',
    fonti: [`${W}/2018/11/10_mila_alberi_per_ridare_ossigeno_allitalia_alberiperilfuturo.html`, `${W}/2018/11/alberi_per_il_futuro_un_ricordo_per_i_bambini.html`],
  },
  {
    anno: 2019, quando: '16 e 17 novembre', alberi: 17000, comuni: 185, persone: 'migliaia di cittadini',
    racconto: 'In due giorni, anche sotto la pioggia. A Roccarainola tutte le classi di un istituto comprensivo piantano 20 lecci nel parco della scuola. Prima della giornata, un laboratorio pratico su autorizzazioni e tecniche.',
    fonti: [`${B}/2019/11/alberiperilfuturo-cambiamo-il-paese-un-albero-alla-volta.html`, `${B}/2020/10/con-alberi-per-il-futuro-abbiamo-dato-nuova-vita-al-parco-di-una-scuola.html`],
  },
  {
    anno: 2020, quando: '21 e 22 novembre, in casa per la pandemia', alberi: null, comuni: null, persone: 'migliaia di cittadini',
    racconto: 'Con le restrizioni la festa diventa domestica: un seme, una piantina o un alberello sul balcone o in giardino, condivisi in rete. Dove si poteva, cura e annaffiatura degli alberi delle edizioni precedenti e sostituzione di quelli non attecchiti.',
    fonti: [`${B}/2020/11/alberi-per-il-futuro-2020-la-sfida-domestica-per-sentirci-uniti-a-distanza.html`, `${B}/2020/11/alberi-per-il-futuro-2020-la-festa-social-ha-invaso-litalia.html`],
  },
  {
    anno: 2021, quando: '21 novembre', alberi: null, comuni: 44, comuniNota: 'gruppi in', persone: '44 gruppi',
    racconto: 'Promossa dall\'Associazione Gianroberto Casaleggio: un modulo per chi organizza, un incontro online di formazione e la mappa delle iniziative.',
    fonti: [`${B}/2021/10/torna-alberi-per-il-futuro-liniziativa-voluta-da-gianroberto-casaleggio.html`, `${B}/2021/11/alberi-per-il-futuro-2021-grazie-a-tutti.html`],
  },
  {
    anno: 2022, quando: '19, 20 e 21 novembre', alberi: null, comuni: 21, persone: null,
    racconto: 'Un vademecum con il modulo fac-simile per chiedere l\'autorizzazione al Comune, il kit grafico e un canale per regione per aiutarsi tra organizzatori.',
    fonti: [`${B}/2022/09/alberi-per-il-futuro-2022-come-organizzare-liniziativa-nel-proprio-comune.html`, `${B}/2022/11/alberi-per-il-futuro-2022-grazie-a-tutti.html`],
  },
  {
    anno: 2023, quando: 'dal 18 al 21 novembre', alberi: null, comuni: 28, persone: null,
    racconto: 'Incontro di formazione a settembre, registrazione delle iniziative entro metà novembre, uno o più alberi per ogni gruppo.',
    fonti: [`${B}/2023/09/alberi-per-il-futuro-2023-unisciti-a-noi.html`, `${B}/2023/11/alberi-per-il-futuro-2023-grazie-a-tutti.html`],
  },
];

/** Le foto delle edizioni passate: tutte dagli articoli del Blog delle Stelle. */
export const FOTO = [
  { file: '2015-adotta.jpg', anno: 2015, testo: 'Il banco «Adotta un albero»: scatole decorate e un cartello fatto a mano.' },
  { file: '2016-volontari.jpg', anno: 2016, testo: 'Volontari al lavoro in un parco, in una mattina d\'inverno.' },
  { file: '2016-milano.jpg', anno: 2016, testo: 'Gli alberi piantati a Milano nel 2015, cresciuti nel prato.' },
  { file: '2017-aiuola.jpg', anno: 2017, testo: 'Bambini e genitori con le vanghe in un\'aiuola lungo la strada.' },
  { file: '2017-prato.jpg', anno: 2017, testo: 'Un adulto e un bambino mettono a dimora un alberello con il tubo di protezione.' },
  { file: '2018-ricordo.jpg', anno: 2018, testo: 'L\'etichetta-ricordo con il nome del bambino, legata al tronco.' },
  { file: '2019-primavera.jpg', anno: 2019, testo: 'La Festa di primavera, per curare gli alberi piantati in autunno.' },
  { file: '2020-casa.jpg', anno: 2020, testo: 'L\'edizione in casa: vasi, terriccio e piantine sul balcone.' },
  { file: '2021-grazie.jpg', anno: 2021, testo: 'Il logo composto con le foto delle piantumazioni di tutta Italia.' },
];

/** Somma degli alberi delle edizioni che li hanno contati (2015-2019). */
export function sommaAlberi(edizioni = EDIZIONI) {
  return edizioni.reduce((a, e) => a + (e.alberi || 0), 0);
}

/** Il prossimo 21 novembre (Giornata nazionale degli alberi) a partire da una data ISO. */
export function prossimaGiornata(oggi) {
  const d = new Date(`${oggi}T12:00:00Z`);
  let anno = d.getUTCFullYear();
  if (d > new Date(Date.UTC(anno, 10, 21, 23))) anno += 1;
  const giorno = new Date(Date.UTC(anno, 10, 21, 12));
  return { data: giorno.toISOString().slice(0, 10), giorni: Math.round((giorno - d) / 86400000) };
}
