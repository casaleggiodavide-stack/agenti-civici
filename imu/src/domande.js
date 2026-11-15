// I campi di un immobile per «Quanto pago di IMU?» e gli esempi della pagina.
// Servono all'interfaccia (web/app.js) e all'assistente AI per sapere quali dati chiedere.

import { CATEGORIE, USI } from './regole.js';

export const TIPI = [['fabbricato', 'Fabbricato (casa, box, negozio, ufficio, capannone)'], ['terreno', 'Terreno agricolo'], ['area', 'Area fabbricabile']];

/** Ogni campo: { id, tipo, etichetta, aiuto?, opzioni?, visibile?(immobile) } */
export const CAMPI = [
  { id: 'nome', tipo: 'testo', etichetta: 'Come lo chiami', segnaposto: 'es. Casa, Box, Casa al mare' },
  { id: 'tipo', tipo: 'elenco', etichetta: 'Che cos\'è', opzioni: TIPI },
  { id: 'categoria', tipo: 'elenco', etichetta: 'Categoria catastale', aiuto: 'È nella visura catastale e nell\'atto d\'acquisto (es. A/2, C/6).', opzioni: Object.entries(CATEGORIE).map(([k, v]) => [k, `${k} · ${v}`]), visibile: (i) => (i.tipo || 'fabbricato') === 'fabbricato' },
  { id: 'rendita', tipo: 'euro', etichetta: 'Rendita catastale', aiuto: 'Quella non rivalutata, scritta nella visura. Il calcolo la aumenta del 5% e la moltiplica per il coefficiente della categoria.', visibile: (i) => (i.tipo || 'fabbricato') === 'fabbricato' },
  { id: 'reddito_dominicale', tipo: 'euro', etichetta: 'Reddito dominicale', aiuto: 'Nella visura catastale del terreno. Il calcolo lo aumenta del 25% e lo moltiplica per 135.', visibile: (i) => i.tipo === 'terreno' },
  { id: 'valore_venale', tipo: 'euro', etichetta: 'Valore di mercato al 1° gennaio', aiuto: 'Per le aree fabbricabili conta il valore venale. Molti Comuni pubblicano valori di riferimento per zona: chiedili all\'ufficio tributi.', visibile: (i) => i.tipo === 'area' },
  { id: 'uso', tipo: 'elenco', etichetta: 'Come lo usi', opzioni: USI, visibile: (i) => (i.tipo || 'fabbricato') === 'fabbricato' },
  { id: 'comodato_requisiti', tipo: 'si_no', etichetta: 'Il comodato ha tutti i requisiti?', aiuto: 'Contratto registrato; figlio o genitore che ci abita e ha la residenza; tu possiedi in Italia solo questa abitazione, oppure anche quella in cui vivi, nello stesso Comune, dove hai residenza e dimora.', visibile: (i) => i.uso === 'comodato' },
  { id: 'abitanti', tipo: 'numero', etichetta: 'Quanti proprietari ci abitano, te compreso?', aiuto: 'La detrazione di 200 euro si divide tra i proprietari che ci vivono.', visibile: (i) => ['A/1', 'A/8', 'A/9'].includes(i.categoria) && ['abitazione_principale', 'assimilata', 'ricoverato'].includes(i.uso) },
  { id: 'coltivatore', tipo: 'spunta', etichetta: 'Lo possiedo e lo coltivo come coltivatore diretto o IAP iscritto alla previdenza agricola', visibile: (i) => i.tipo === 'terreno' },
  { id: 'storico', tipo: 'spunta', etichetta: 'È un immobile di interesse storico o artistico (vincolo del Codice dei beni culturali)', visibile: (i) => (i.tipo || 'fabbricato') === 'fabbricato' },
  { id: 'inagibile', tipo: 'spunta', etichetta: 'È inagibile o inabitabile e non lo uso (con perizia o dichiarazione di un tecnico)', visibile: (i) => (i.tipo || 'fabbricato') === 'fabbricato' },
  { id: 'quota', tipo: 'numero', etichetta: 'La tua quota di possesso, in percento', aiuto: '100 se è tutto tuo, 50 se è a metà con un\'altra persona. Conta anche l\'usufrutto: paga l\'usufruttuario, non il nudo proprietario.' },
  { id: 'dal', tipo: 'data', etichetta: 'Possesso: dal', aiuto: 'Solo se l\'hai avuto da una data dell\'anno (rogito, successione). Il giorno del rogito conta per chi compra.' },
  { id: 'al', tipo: 'data', etichetta: 'Possesso: fino al', aiuto: 'Solo se l\'hai venduto: il giorno del rogito di vendita. Un mese conta se l\'hai posseduto per più di metà dei giorni.' },
];

/** Gli esempi della pagina: immobili veri come forma, rendite e Comuni di fantasia ma plausibili. */
export const ESEMPI = {
  casa: { anno: 2026, immobili: [
    { nome: 'Casa', comune: 'L219', tipo: 'fabbricato', categoria: 'A/2', rendita: 720.3, uso: 'abitazione_principale', quota: 100 },
    { nome: 'Box', comune: 'L219', tipo: 'fabbricato', categoria: 'C/6', rendita: 98.13, uso: 'pertinenza', quota: 100 },
  ] },
  lusso: { anno: 2026, immobili: [
    { nome: 'Villa', comune: 'F205', tipo: 'fabbricato', categoria: 'A/8', rendita: 3150, uso: 'abitazione_principale', quota: 50, abitanti: 2 },
    { nome: 'Cantina', comune: 'F205', tipo: 'fabbricato', categoria: 'C/2', rendita: 62.5, uso: 'pertinenza', quota: 50 },
  ] },
  seconda: { anno: 2026, immobili: [
    { nome: 'Casa al mare', comune: 'H501', tipo: 'fabbricato', categoria: 'A/3', rendita: 545.06, uso: 'disposizione', quota: 100, dal: '2026-04-16' },
  ] },
  comodato: { anno: 2026, immobili: [
    { nome: 'Casa di mio figlio', comune: 'A944', tipo: 'fabbricato', categoria: 'A/2', rendita: 650, uso: 'comodato', comodato_requisiti: true, quota: 100 },
  ] },
  concordato: { anno: 2026, immobili: [
    { nome: 'Appartamento affittato', comune: 'F839', tipo: 'fabbricato', categoria: 'A/3', rendita: 480, uso: 'concordato', quota: 100 },
  ] },
  negozio: { anno: 2026, immobili: [
    { nome: 'Negozio', comune: 'C351', tipo: 'fabbricato', categoria: 'C/1', rendita: 1850, uso: 'impresa', quota: 100 },
    { nome: 'Capannone', comune: 'C351', tipo: 'fabbricato', categoria: 'D/7', rendita: 6200, uso: 'impresa', quota: 100 },
  ] },
  terreno: { anno: 2026, immobili: [
    { nome: 'Terreno', comune: 'G478', tipo: 'terreno', reddito_dominicale: 210.4, quota: 100 },
    { nome: 'Lotto edificabile', comune: 'G478', tipo: 'area', valore_venale: 85000, quota: 100 },
  ] },
};
