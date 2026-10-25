// Gli strumenti dell'assistente civico: funzioni della pagina che l'assistente AI può
// chiamare. Ognuna usa uno dei motori di regole degli agenti civici, quindi
// numeri, soglie, termini e indirizzi vengono sempre dalle regole verificate,
// mai dalla memoria del modello. I risultati sono piccoli e in dati semplici.
//
// L'interfaccia passa le funzioni per mostrare risultati, documenti e
// promemoria nel pannello: così lo stesso codice si prova anche in Node.

import { valuta as valutaPrestazioni } from '../../mi-spetta/src/motore.js';
import { DOMANDE as D_SPETTA, CONDIZIONI_18_21 } from '../../mi-spetta/src/situazione.js';
import { valuta as valutaMulta } from '../../faccio-ricorso/src/regole.js';
import { DOMANDE as D_MULTA } from '../../faccio-ricorso/src/domande.js';
import { ricorsoPrefetto, ricorsoGiudiceDiPace, oggettoEmail } from '../../faccio-ricorso/src/documento.js';
import { valuta as valutaAccesso } from '../../chiedo-gli-atti/src/regole.js';
import { DOMANDE as D_ATTI } from '../../chiedo-gli-atti/src/domande.js';
import { richiesta, riesame, ricorso, sostitutivo, OGGETTI } from '../../chiedo-gli-atti/src/documenti.js';
import { caricaEnti, cerca } from '../../chiedo-gli-atti/src/enti.js';
import { data as dataCal } from './comune/date.js';
import { valuta as valutaReclamo } from '../../mi-rimborsano/src/regole.js';
import { DOMANDE as D_RECLAMI } from '../../mi-rimborsano/src/domande.js';
import { lettera, oggetto as oggettoReclamo } from '../../mi-rimborsano/src/documento.js';

import { normalizza as normalizzaCampi, dizionario as dizionarioCampi } from './comune/campi.js';

/** Pulisce le risposte che l'assistente AI passa a uno strumento (vedi comune/campi.js). */
export function normalizza(domande, grezze, extra = {}) {
  return normalizzaCampi(domande, grezze, { extra, condizioniFigli: CONDIZIONI_18_21 });
}

/** Dizionario dei campi di uno strumento, compatto, per le istruzioni. */
export function dizionario(domande) {
  return dizionarioCampi(domande, { condizioniFigli: CONDIZIONI_18_21 });
}

const fonte = (f) => f && { titolo: f.titolo, url: f.url };

/**
 * Crea gli strumenti da passare a sample({tools}).
 * @param {object} ui { mostraRisultato(tipo, dati), mostraDocumento({titolo, html, oggetto, pec}), mostraPromemoria({titolo, data, descrizione}), progresso(testo), oggi? }
 */
export function creaStrumenti(ui) {
  const opz = ui.oggi ? { oggi: ui.oggi } : {};
  let indice = null;
  const enti = async () => (indice ||= await caricaEnti());
  const trovaEnte = async (nome) => (nome ? cerca(await enti(), String(nome), 1)[0] || null : null);
  const schemaRisposte = (descr) => ({ type: 'object', properties: { risposte: { type: 'object', description: descr } }, required: ['risposte'] });

  return [
    {
      name: 'valuta_prestazioni',
      description: 'Mi spetta: calcola a quali bonus e prestazioni pubbliche nazionali italiane ha diritto la persona (INPS, Comuni, ARERA, fisco, sanità), con importo, dati mancanti e fonte. Usa i campi del dizionario «Mi spetta». Restituisce l\'elenco delle prestazioni per esito.',
      inputSchema: schemaRisposte('Risposte con i campi del dizionario Mi spetta; tutte facoltative, metti solo quelle note.'),
      execute(input) {
        ui.progresso?.('Calcolo le prestazioni con Mi spetta…');
        const { risposte, avvisi } = normalizza(D_SPETTA, input.risposte);
        const v = valutaPrestazioni(risposte, opz);
        ui.mostraRisultato?.('prestazioni', v);
        const breve = (r) => ({ nome: r.nome, ente: r.ente, esito: r.etichetta, importo: r.importo?.testo || r.importo?.breve || null, mancano: r.mancano, come: r.come?.testo, link: r.come?.link, fonte: fonte(r.fonti[0]), note: r.note.slice(0, 2) });
        return {
          oggi: v.oggi,
          totale_annuo_stimato_euro: v.totaleAnnuoStimato,
          spettano: v.risultati.filter((r) => r.esito === 'spetta' || r.esito === 'probabile').map(breve),
          serve_un_dato: v.risultati.filter((r) => r.esito === 'manca_dato').map((r) => ({ nome: r.nome, mancano: r.mancano })),
          domanda_chiusa: v.risultati.filter((r) => r.esito === 'chiusa').map((r) => r.nome),
          non_spettano: v.risultati.filter((r) => r.esito === 'non_spetta').length,
          avvisi,
        };
      },
    },
    {
      name: 'valuta_multa',
      description: 'Faccio ricorso?: controlla una multa stradale italiana. Restituisce verdetto, motivi oggettivi trovati o mancanti, scadenze calcolate, confronto dei costi tra pagare, Prefetto e Giudice di Pace, Prefettura competente con PEC. Usa i campi del dizionario «Multe».',
      inputSchema: schemaRisposte('Risposte con i campi del dizionario Multe; metti solo quelle note.'),
      execute(input) {
        ui.progresso?.('Controllo la multa con Faccio ricorso?…');
        const { risposte, avvisi } = normalizza(D_MULTA, input.risposte);
        const v = valutaMulta(risposte, opz);
        ui.mostraRisultato?.('multa', { ...v, risposte });
        return {
          verdetto: v.verdetto,
          motivi: v.motivi.map((m) => ({ titolo: m.titolo, esito: m.esito, forza: m.forza, spiegazione: m.spiegazione, dato_mancante: m.dato })),
          scadenze: v.scadenze.map((s) => ({ titolo: s.titolo, data: s.data, scaduta: s.scaduta, giorni_mancanti: s.giorniMancanti, nota: s.testo })),
          costi: v.costi?.righe.map((c) => ({ strada: c.strada, costo_subito: c.costo, se_respinto: c.seRespinto ?? null, nota: c.nota })) || null,
          prefettura: v.destinatari.prefetto,
          fonti: v.fonti.slice(0, 4).map(fonte),
          avvisi,
        };
      },
    },
    {
      name: 'mostra_ricorso',
      description: 'Prepara il ricorso contro la multa e lo mostra nel pannello accanto alla chat, dove la persona completa i suoi dati e lo copia o stampa. Usa le stesse risposte di valuta_multa. destinatario: prefetto oppure gdp (Giudice di Pace). Restituisce solo una conferma.',
      inputSchema: { type: 'object', properties: { risposte: { type: 'object' }, destinatario: { type: 'string', enum: ['prefetto', 'gdp'] } }, required: ['risposte', 'destinatario'] },
      execute(input) {
        const { risposte, avvisi } = normalizza(D_MULTA, input.risposte);
        const v = valutaMulta(risposte, opz);
        const gdp = input.destinatario === 'gdp';
        const genera = (personali = {}) => (gdp ? ricorsoGiudiceDiPace : ricorsoPrefetto)({ ...risposte, ...personali, comune_firma: personali.luogo || personali.comune_firma }, v);
        ui.mostraDocumento?.({ titolo: gdp ? 'Ricorso al Giudice di Pace' : 'Ricorso al Prefetto', html: genera(), genera, oggetto: oggettoEmail(risposte), pec: gdp ? null : (risposte.invio_prefetto === 'organo' ? risposte.pec_organo : v.destinatari.prefetto?.pec) });
        return { mostrato: true, note: 'I dati personali e i campi evidenziati si completano nel pannello.', avvisi };
      },
    },
    {
      name: 'cerca_ente',
      description: 'Cerca un ente pubblico italiano nell\'Indice delle pubbliche amministrazioni: Comuni, Regioni, ASL, Ministeri, scuole, università, società pubbliche. Accetta sigle come ASL, INPS, ARPA. Restituisce fino a 5 enti con categoria, comune e PEC.',
      inputSchema: { type: 'object', properties: { testo: { type: 'string', description: 'Nome o parte del nome, es. «Comune di Lecce»' } }, required: ['testo'] },
      async execute(input) {
        ui.progresso?.('Cerco l\'ente nell\'Indice delle pubbliche amministrazioni…');
        return cerca(await enti(), String(input.testo || ''), 5);
      },
    },
    {
      name: 'valuta_accesso',
      description: 'Chiedo gli atti: per una richiesta di documenti o dati a un ente pubblico sceglie il tipo di accesso (FOIA, semplice, documentale), controlla se la richiesta è precisa, calcola scadenze e passi successivi se l\'ente tace o rifiuta. Usa i campi del dizionario «Accesso agli atti» e il nome dell\'ente.',
      inputSchema: { type: 'object', properties: { risposte: { type: 'object' }, ente_nome: { type: 'string' } }, required: ['risposte'] },
      async execute(input) {
        ui.progresso?.('Preparo l\'accesso agli atti con Chiedo gli atti…');
        const { risposte, avvisi } = normalizza(D_ATTI, input.risposte);
        risposte.ente = await trovaEnte(input.ente_nome);
        if (input.ente_nome && !risposte.ente) avvisi.push('ente non trovato: usa cerca_ente');
        const v = valutaAccesso(risposte, opz);
        ui.mostraRisultato?.('accesso', { ...v, risposte });
        return {
          tipo: { nome: v.tipo.nome, norma: v.tipo.norma, perche: v.tipo.perche },
          ente: v.ente && { nome: v.ente.nome, pec: v.ente.pec, regione: v.ente.regione },
          destinatario: v.destinatario,
          controlli_richiesta: v.controlli,
          fase: v.fase,
          scadenze: v.scadenze.map((s) => ({ titolo: s.titolo, data: s.data, scaduta: s.scaduta, nota: s.testo })),
          documenti_disponibili: ['richiesta', ...v.passi],
          come_inviare: v.invio.passi,
          avvisi,
        };
      },
    },
    {
      name: 'mostra_documento_accesso',
      description: 'Mostra nel pannello il documento per l\'accesso agli atti, pronto da completare e inviare: richiesta, riesame, ricorso (al difensore civico o alla Commissione) o sostitutivo. Usa le stesse risposte ed ente di valuta_accesso. Restituisce solo una conferma.',
      inputSchema: { type: 'object', properties: { risposte: { type: 'object' }, ente_nome: { type: 'string' }, documento: { type: 'string', enum: ['richiesta', 'riesame', 'ricorso', 'sostitutivo'] } }, required: ['risposte', 'documento'] },
      async execute(input) {
        const { risposte, avvisi } = normalizza(D_ATTI, input.risposte);
        risposte.ente = await trovaEnte(input.ente_nome);
        const v = valutaAccesso(risposte, opz);
        const tipo = ['richiesta', 'riesame', 'ricorso', 'sostitutivo'].includes(input.documento) ? input.documento : 'richiesta';
        const genera = (personali = {}) => ({ richiesta, riesame, ricorso, sostitutivo })[tipo]({ ...risposte, ...personali }, v);
        ui.mostraDocumento?.({ titolo: OGGETTI[tipo](v), html: genera(), genera, oggetto: OGGETTI[tipo](v), pec: tipo === 'ricorso' ? null : v.ente?.pec });
        return { mostrato: true, documento: tipo, note: 'I dati personali e i campi evidenziati si completano nel pannello.', avvisi };
      },
    },
    {
      name: 'valuta_reclamo',
      description: 'Mi rimborsano?: dice se spetta un rimborso, un indennizzo o una compensazione per volo in ritardo o cancellato, bagaglio, treno, bolletta (anche prescrizione di due anni), telefono e internet, addebito bancario non autorizzato; con importo, termini, passi (reclamo, autorità, conciliazione) e fonti. Usa i campi del dizionario «Reclami»: il campo caso è obbligatorio.',
      inputSchema: schemaRisposte('Risposte con i campi del dizionario Reclami; caso obbligatorio, gli altri solo se noti.'),
      execute(input) {
        ui.progresso?.('Controllo il caso con Mi rimborsano?…');
        const { risposte, avvisi } = normalizza(D_RECLAMI, input.risposte);
        const v = valutaReclamo(risposte, opz);
        ui.mostraRisultato?.('reclamo', { ...v, risposte });
        return {
          verdetto: v.verdetto, importo: v.importo,
          controlli: v.voci.map((x) => ({ titolo: x.titolo, esito: x.esito, spiegazione: x.spiegazione, manca: x.dato, fonte: fonte(x.fonti[0]) })),
          scadenze: v.scadenze.map((x) => ({ data: x.data, titolo: x.titolo, testo: x.testo, passata: x.scaduta })),
          passi: v.passi.map((x) => ({ titolo: x.titolo, testo: x.testo, link: x.link })),
          lettera_disponibile: Boolean(v.documento), avvisi,
        };
      },
    },
    {
      name: 'mostra_lettera_reclamo',
      description: 'Mostra nel pannello la lettera di reclamo e messa in mora (o di eccezione di prescrizione per le bollette) preparata da Mi rimborsano?, da completare con i dati personali nel pannello. Usalo dopo valuta_reclamo, se lettera_disponibile è vero. Restituisce una conferma.',
      inputSchema: schemaRisposte('Le stesse risposte passate a valuta_reclamo.'),
      execute(input) {
        const { risposte } = normalizza(D_RECLAMI, input.risposte);
        const v = valutaReclamo(risposte, opz);
        if (!v.documento) return { mostrato: false, motivo: 'Per questo caso non c\'è una lettera da preparare: ' + v.verdetto.titolo };
        const genera = (p = {}) => lettera({ ...risposte, nome: p.nome, indirizzo: p.residenza, recapito: p.recapito, iban: p.iban, riferimento: p.riferimento, luogo: p.luogo }, v);
        ui.mostraDocumento?.({ titolo: 'Lettera di reclamo', html: genera(), genera, oggetto: oggettoReclamo(v.documento), pec: null });
        return { mostrato: true, destinatario: v.documento.destinatario };
      },
    },
    {
      name: 'promemoria',
      description: 'Mostra alla persona i pulsanti per aggiungere una scadenza al suo calendario (Google, Outlook). Usalo per le scadenze restituite dagli altri strumenti, con la loro data esatta. Restituisce una conferma.',
      inputSchema: { type: 'object', properties: { titolo: { type: 'string' }, data: { type: 'string', description: 'AAAA-MM-GG, presa da un risultato di uno strumento' }, descrizione: { type: 'string' } }, required: ['titolo', 'data'] },
      execute(input) {
        if (!dataCal(String(input.data || ''))) throw new Error('data non valida: usa AAAA-MM-GG da un risultato');
        ui.mostraPromemoria?.({ titolo: String(input.titolo).slice(0, 150), data: String(input.data).slice(0, 10), descrizione: String(input.descrizione || '').slice(0, 600) });
        return { mostrato: true };
      },
    },
  ];
}

export const DIZIONARI = {
  'Mi spetta': () => dizionario(D_SPETTA),
  Multe: () => dizionario(D_MULTA),
  'Accesso agli atti': () => dizionario(D_ATTI),
  Reclami: () => dizionario(D_RECLAMI),
};
