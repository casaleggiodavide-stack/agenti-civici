// Regole di «La visita nei tempi»: i tempi massimi delle classi di priorità e il percorso
// di tutela. Piano nazionale di governo delle liste d'attesa 2026-2028 (DM Salute 26/6/2026,
// GU SO n. 32 del 24/8/2026) e decreto-legge 73/2024, art. 3, nel testo vigente al 25/10/2026.

import { data, iso, oggi as oggiDi, giorniTra, aggiungiGiorni, festivo } from './comune/date.js';

export const VERIFICATO = '2026-10-25';
const PNGLA = 'https://www.gazzettaufficiale.it/eli/gu/2026/08/24/195/so/32/sg/pdf';
export const FONTI = {
  pngla: { titolo: 'Piano nazionale di governo delle liste d\'attesa 2026-2028 (DM Salute 26/6/2026, Gazzetta Ufficiale, supplemento ordinario n. 32 del 24/8/2026)', url: PNGLA },
  dl73: { titolo: 'Decreto-legge 73/2024, art. 3: prestazioni nei tempi senza costi in più oltre al ticket, disdetta e agende', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2024-06-07;73~art3' },
  dlgs124: { titolo: 'D.lgs. 124/1998, art. 3, comma 13: in mancanza di regole regionali, intramoenia pagando solo il ticket', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1998-04-29;124~art3' },
  agenas: { titolo: 'Agenas: monitoraggio delle liste d\'attesa', url: 'https://www.agenas.gov.it/aree-tematiche/comunicazione/primo-piano/2816-online-il-bollettino-trimestrale-agenas-sul-monitoraggio-delle-liste-di-attesa' },
};

/** Tempo massimo in giorni (assunzione: giorni di calendario, salvo diverse regole regionali). */
export function giorniMassimi(classe, tipo) {
  return { U: 3, B: 10, D: tipo === 'esame' ? 60 : 30, P: 120 }[classe] ?? null;
}
/** Entro quando l'ASL deve richiamare chi è in prelista. */
export function richiamo(classe, tipo) {
  return { B: 5, D: tipo === 'esame' ? 15 : 10, P: 30 }[classe] ?? null;
}
/** L'ultimo giorno utile per disdire: due giorni lavorativi prima dell'appuntamento. */
export function ultimaDisdetta(appuntamento) {
  let d = data(appuntamento);
  let lavorativi = 0;
  while (lavorativi < 2) {
    d = aggiungiGiorni(d, -1);
    if (!festivo(d) && d.getUTCDay() !== 6) lavorativi += 1;
  }
  return d;
}

const lungo = (d) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function valuta(r, opz = {}) {
  const oggi = oggiDi(opz.oggi);
  const scadenze = [];
  const voci = [];
  const passi = [];
  const fonti = [FONTI.pngla, FONTI.dl73];
  let documento = null;
  const urgente = r.sintomi === true;
  const scad = (d, titolo, testo) => d && scadenze.push({ data: iso(d), titolo, testo, scaduta: d < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, d)) });
  const esito = (verdetto) => ({ verdetto, urgente: urgente || r.classe === 'U', voci, scadenze: scadenze.sort((a, b) => a.data.localeCompare(b.data)), passi, fonti, documento });

  if (urgente) voci.push({ esito: 'no', titolo: 'Prima di tutto, la salute', spiegazione: 'Se i sintomi peggiorano chiama il tuo medico o la guardia medica; nei casi gravi il 112 o il 118. La lettera all\'ASL può aspettare.' });
  if (!r.accesso) return esito({ tono: 'dato', titolo: 'È un primo accesso?', testo: 'I tempi massimi garantiti valgono per la prima visita o il primo esame per un problema.' });
  if (r.accesso === 'successivo') {
    passi.push({ titolo: 'Chiedi al medico o allo specialista', testo: 'Controlli ed esami di verifica si prenotano nelle agende dedicate ai percorsi di cura: la data la fissa lo specialista che ti segue, oppure il medico la indica sulla ricetta.' });
    return esito({ tono: 'no', titolo: 'Per i controlli non c\'è un tempo massimo garantito', testo: 'Le classi U, B, D e P valgono solo per i primi accessi. Per i controlli conta l\'indicazione dello specialista, nelle agende dedicate ai percorsi di cura.' });
  }
  if (!r.classe) return esito({ tono: 'dato', titolo: 'Quale classe c\'è sulla ricetta?', testo: 'U, B, D o P: da questa lettera dipende il tempo massimo.' });
  if (r.classe === 'nessuna') {
    passi.push({ titolo: 'Torna dal medico', testo: 'Chiedi di indicare sulla ricetta la classe di priorità: è il medico a stabilire entro quando la prestazione serve.' });
    return esito({ tono: 'dato', titolo: 'Senza classe di priorità non c\'è un termine da far valere', testo: 'Chiedi al medico di scriverla sulla ricetta: con la classe, il tempo massimo diventa un diritto.' });
  }
  if (r.classe === 'D' && !r.tipo) return esito({ tono: 'dato', titolo: 'Visita o esame?', testo: 'Per la classe D il tempo massimo è 30 giorni per le visite e 60 per gli esami.' });
  if (r.pagato === true) {
    passi.push({ titolo: 'La prossima volta, prima di pagare', testo: 'Quando il CUP non ti dà una data nei tempi, chiedi subito all\'ASL di attivare il percorso di tutela, con la lettera di questa pagina: devono trovarti loro un posto, al costo del ticket.' });
    return esito({ tono: 'no', titolo: 'Il rimborso dopo una visita privata non è previsto', testo: 'Il Piano nazionale esclude il rimborso di visite già pagate privatamente o prenotate da sé in libera professione: la richiesta va fatta prima, all\'ASL.' });
  }
  if (r.rifiutato === true) {
    return esito({ tono: 'no', titolo: 'Hai scelto un\'altra struttura: la garanzia non vale più', testo: 'Chi rifiuta la prima data proposta nella propria zona per prenotare altrove esce dal sistema di garanzia dei tempi. Se la prima data era già oltre il termine, chiedi all\'ASL il percorso di tutela prima di rifiutarla.' });
  }

  const giorni = giorniMassimi(r.classe, r.tipo);
  const contatto = data(r.data_contatto);
  if (!contatto) {
    voci.push({ esito: 'dato', titolo: 'Il primo contatto con il CUP', spiegazione: 'Il tempo massimo si conta da quel giorno.', dato: 'data_contatto' });
    return esito({ tono: 'dato', titolo: `Classe ${r.classe}: entro ${r.classe === 'U' ? '72 ore' : `${giorni} giorni`}`, testo: 'Indica il giorno del primo contatto con il CUP e calcolo il termine.' });
  }
  const termine = aggiungiGiorni(contatto, giorni);
  voci.push({ esito: 'si', titolo: `Termine massimo: ${lungo(termine)}`, spiegazione: `Classe ${r.classe}${r.classe === 'D' ? (r.tipo === 'esame' ? ', esame' : ', visita') : ''}: ${r.classe === 'U' ? '72 ore' : `${giorni} giorni`} dal primo contatto con il CUP. Contiamo i giorni di calendario; il piano della tua Regione può precisarlo.` });
  scad(termine, 'Tempo massimo della tua classe', 'Entro questa data la prestazione va garantita, nella tua zona, al costo del solo ticket.');

  if (r.proposta === 'prelista' && r.classe !== 'U') {
    const entro = aggiungiGiorni(contatto, richiamo(r.classe, r.tipo));
    voci.push({ esito: entro < oggi ? 'no' : 'forse', titolo: `Devono richiamarti entro il ${lungo(entro)}`, spiegazione: 'Chi è messo in lista senza data va registrato al primo contatto e richiamato entro 5 giorni (B), 10 (visite D), 15 (esami D) o 30 (P).' });
    scad(entro, 'Richiamo dalla lista d\'attesa', 'Se non ti hanno richiamato con una data, manda la lettera all\'ASL.');
  }
  if (r.classe === 'U') voci.push({ esito: 'forse', titolo: 'Per la classe U niente liste', spiegazione: 'La prestazione urgente va data entro 72 ore: chiedi al CUP il percorso per le urgenze o torna dal medico.' });
  if (r.ambito === 'lontano') voci.push({ esito: 'forse', titolo: 'La data è lontana da casa', spiegazione: 'I tempi vanno garantiti nell\'ambito della tua zona. Prima di rifiutare, chiedi al CUP se c\'è una data nei tempi più vicina: rifiutando la prima proposta per scegliere un\'altra struttura si perde la garanzia.' });

  const proposta = data(r.data_proposta);
  const fuori = (r.proposta === 'data' && proposta && proposta > termine) || r.proposta === 'niente' || (r.proposta === 'prelista' && aggiungiGiorni(contatto, richiamo(r.classe, r.tipo) || 0) < oggi) || (r.proposta === 'prelista' && termine < oggi);
  if (r.proposta === 'data' && proposta) {
    const ultima = ultimaDisdetta(proposta);
    scad(ultima, 'Ultimo giorno per disdire', `Se non puoi andare all'appuntamento del ${lungo(proposta)}, disdici almeno due giorni lavorativi prima: chi non si presenta senza disdetta paga il ticket anche se esente.`);
  }
  if (!r.proposta) return esito({ tono: 'dato', titolo: `Termine: ${lungo(termine)}`, testo: 'Che cosa ti ha proposto il CUP? Una data, una lista d\'attesa o niente.' });

  if (fuori) {
    documento = { tipo: 'tutela', termine: iso(termine), ritardo: proposta ? giorniTra(termine, proposta) : null };
    fonti.push(FONTI.dlgs124);
    if (proposta) voci.push({ esito: 'no', titolo: `Data proposta oltre il termine di ${giorniTra(termine, proposta)} giorni`, spiegazione: `Ti hanno proposto il ${lungo(proposta)}: il termine della tua classe è il ${lungo(termine)}.` });
    scad(aggiungiGiorni(oggi > termine ? oggi : termine, 7), 'Se non rispondono, sollecita', 'Promemoria, non un termine di legge: senza risposta manda un reclamo all\'URP e al difensore civico regionale con Reclami alla PA.');
    passi.push({ titolo: 'Non rinunciare e non pagare il privato', testo: 'Puoi accettare intanto la data proposta, per non perdere il posto, e mandare subito la lettera all\'ASL: devono trovarti una data nei tempi, in ospedale, in libera professione o in una struttura accreditata, senza costi oltre al ticket.' });
    passi.push({ titolo: 'Manda la lettera dalla tua PEC o email', testo: 'All\'ASL della tua residenza, con la ricetta e la prova della prenotazione (il foglio o l\'SMS del CUP).' });
    passi.push({ titolo: 'Se non rispondono', testo: 'Reclamo all\'URP e al difensore civico regionale: lo prepari con Reclami alla PA.' });
    return esito({ tono: 'si', titolo: 'Hai diritto alla prestazione nei tempi', testo: `Il termine della tua classe è il ${lungo(termine)}. L'ASL deve attivare il percorso di tutela e trovarti una data entro quel giorno, pagando al massimo il ticket. La lettera è pronta.` });
  }
  return esito({ tono: 'forse', titolo: r.proposta === 'data' ? 'La data proposta è nei tempi' : `Aspetta la chiamata: termine ${lungo(termine)}`, testo: r.proposta === 'data' ? `Il termine era il ${lungo(termine)}: la data proposta lo rispetta. Ricordati di disdire per tempo se non puoi andare.` : 'Ti ricordiamo noi le date: se passano senza una chiamata, qui trovi la lettera all\'ASL.' });
}
