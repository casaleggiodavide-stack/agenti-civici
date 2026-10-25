// Regole di «Reclami alla PA e difensore civico»: quale passo fare, verso chi,
// entro quando. Ogni regola cita la sua fonte (reclami-pa/dati/fonti.json).

import FONTI from './dati/fonti.js';
import { data, iso, scadenza, oggi as oggiDi, giorniTra } from './comune/date.js';

export const VERIFICATO = FONTI.verificato;
const R = FONTI.regole;
const fonte = (id) => R[id]?.norma && { titolo: R[id].norma.titolo, url: R[id].norma.url };
const GARANTE_PRIVACY = FONTI.garanti.find((g) => /dati personali/i.test(g.nome));

// Regione di ogni sigla di provincia; Trento e Bolzano hanno un difensore ciascuna
const REG = {
  Piemonte: 'AL AT BI CN NO TO VB VC', "Valle d'Aosta": 'AO', Lombardia: 'BG BS CO CR LC LO MB MI MN PV SO VA', Bolzano: 'BZ', Trento: 'TN',
  Veneto: 'BL PD RO TV VE VI VR', 'Friuli-Venezia Giulia': 'GO PN TS UD', Liguria: 'GE IM SP SV', 'Emilia-Romagna': 'BO FC FE MO PC PR RA RE RN',
  Toscana: 'AR FI GR LI LU MS PI PO PT SI', Umbria: 'PG TR', Marche: 'AN AP FM MC PU', Lazio: 'FR LT RI RM VT', Abruzzo: 'AQ CH PE TE', Molise: 'CB IS',
  Campania: 'AV BN CE NA SA', Puglia: 'BA BR BT FG LE TA', Basilicata: 'MT PZ', Calabria: 'CS CZ KR RC VV', Sicilia: 'AG CL CT EN ME PA RG SR TP',
  Sardegna: 'CA CI NU OG OR OT SS SU VS',
};
export const TERRITORIO_DI = Object.fromEntries(Object.entries(REG).flatMap(([reg, s]) => s.split(' ').map((x) => [x, reg])));

// Enti nazionali: il difensore civico regionale non è competente (Ministeri, INPS, Agenzie…)
const NAZIONALI = /ministero|inps|inail|agenzia delle entrate|agenzia delle dogane|agenzia del demanio|presidenza del consiglio|aci\b|automobile club d'italia|istituto nazionale|motorizzazione|prefettura|questura/i;

/** Il difensore civico del territorio, con lo stato dei dati. */
export function difensore(prov) {
  const t = TERRITORIO_DI[prov];
  const d = t ? FONTI.difensori[t] : null;
  if (!d) return { territorio: t || null, stato: 'sconosciuto' };
  if (!d.esiste) return { territorio: t, stato: 'assente', ...d };
  if (/vacante/i.test(d.note || '')) return { territorio: t, stato: 'vacante', ...d };
  if (!d.pec && !d.url) return { territorio: t, stato: 'non_verificato', ...d };
  return { territorio: t, stato: 'attivo', ...d };
}

const giorno = (d) => (d ? iso(d) : null);
const dopo = (inizio, n) => scadenza(inizio, n, { slitta: true });
const lungo = (d) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const annoDopo = (d) => { const x = new Date(d); x.setUTCFullYear(x.getUTCFullYear() + 1); return x; };

/**
 * @param r risposte; r.ente = ente da IndicePA {nome, cat, comune, prov, pec, sito}
 * @param opz { oggi }
 */
export function valuta(r, opz = {}) {
  const oggi = oggiDi(opz.oggi);
  const ente = r.ente || null;
  const nazionale = ente ? NAZIONALI.test(ente.nome) : false;
  const dc = ente && !nazionale ? difensore(ente.prov) : null;
  const scadenze = [];
  const passi = [];
  const voci = [];
  const fonti = [];
  let documento = null;
  let verdetto;
  const scad = (d, titolo, testo) => d && scadenze.push({ data: iso(d), titolo, testo, scaduta: d < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, d)) });

  if (!r.problema) {
    return { verdetto: { tono: 'dato', titolo: 'Scegli il problema', testo: 'Dal tipo di problema dipende il passo giusto: un sollecito, la richiesta al titolare del potere sostitutivo, il difensore civico, un\'autorità di garanzia o il giudice.' }, scadenze, passi, voci, fonti, documento, difensore: dc };
  }
  if (!ente) voci.push({ esito: 'dato', titolo: 'Manca l\'ente', spiegazione: 'Serve per la PEC e per sapere quale difensore civico è competente.', dato: 'ente' });

  // ---------- pratica ferma ----------
  if (r.problema === 'ritardo') {
    const termine = Number(r.termine) > 0 ? Number(r.termine) : R.termine_default_30.giorni;
    const sosp = Math.min(Number(r.sospensione) || 0, R.sospensione_30.giorni);
    const fine = r.data_domanda ? dopo(r.data_domanda, termine + sosp) : null;
    fonti.push(fonte('termine_default_30'), fonte('potere_sostitutivo_chi'), fonte('potere_sostitutivo_termine'), fonte('ricorso_silenzio_termine'));
    if (!r.data_domanda) voci.push({ esito: 'dato', titolo: 'Manca la data della domanda', spiegazione: 'Il termine per rispondere decorre da quando l\'ente l\'ha ricevuta.', dato: 'data_domanda' });
    if (!r.termine) voci.push({ esito: 'forse', titolo: `Termine: usiamo ${termine} giorni`, spiegazione: R.termine_default_30.testo + ' Se il regolamento dell\'ente o la pagina del procedimento indicano un termine diverso, scrivilo: cambia tutte le date.', dato: 'termine' });
    if (fine && fine >= oggi) {
      verdetto = { tono: 'forse', titolo: `L'ufficio ha tempo fino al ${lungo(fine)}`, testo: 'Il termine per concludere non è ancora scaduto. Puoi chiedere all\'URP lo stato della pratica e il nome del responsabile; dopo la scadenza potrai chiedere l\'intervento del titolare del potere sostitutivo.' };
      scad(fine, 'Scade il termine per concludere la pratica', 'Se l\'ufficio non ha deciso, il giorno dopo puoi chiedere l\'intervento del titolare del potere sostitutivo.');
      documento = { tipo: 'reclamo', variante: 'sollecito' };
    } else if (fine) {
      const giorniRitardo = giorniTra(fine, oggi);
      verdetto = { tono: 'si', titolo: `Il termine è scaduto il ${lungo(fine)}: chiedi l'intervento del titolare del potere sostitutivo`, testo: `${R.potere_sostitutivo_chi.testo} ${R.potere_sostitutivo_termine.testo}` };
      documento = { tipo: 'sostitutivo', termine, giorniRitardo, fine: iso(fine) };
      scad(annoDopo(fine), 'Ultimo giorno per il ricorso al TAR contro il silenzio', `${R.ricorso_silenzio_termine.testo} Serve un avvocato; contributo unificato: ${(R.contributo_unificato_silenzio.testo.match(/\d+ euro/) || ['300 euro'])[0]}.`);
      if (r.impresa === true) {
        fonti.push(fonte('indennizzo_ritardo_importi'), fonte('indennizzo_attivazione_20'));
        const limite = dopo(iso(fine), R.indennizzo_attivazione_20.giorni);
        scad(limite, 'Ultimo giorno per chiedere l\'indennizzo da ritardo', R.indennizzo_attivazione_20.testo);
        const importo = Math.min(2000, 30 * Math.max(0, giorniRitardo));
        voci.push({ esito: limite >= oggi ? 'si' : 'no', titolo: limite >= oggi ? `Indennizzo da ritardo: fino a ${importo.toLocaleString('it-IT')} euro finora` : 'Indennizzo da ritardo: il termine di 20 giorni è passato', spiegazione: `${R.indennizzo_ritardo_importi.testo} Vale solo per i procedimenti su domanda che riguardano l'avvio o l'esercizio di un'attività d'impresa. ${R.indennizzo_attivazione_20.testo}` });
        documento.indennizzo = limite >= oggi;
      }
      if (r.passo === 'sostitutivo' && r.data_invio) {
        const meta = Math.ceil(termine / 2);
        const s = dopo(r.data_invio, meta);
        scad(s, 'Il titolare del potere sostitutivo deve concludere', `Ha la metà del termine originario: ${meta} giorni.`);
        if (s < oggi && r.risposta !== 'risolto') documento = { tipo: 'difensore', motivo: 'ritardo' };
      }
    }
    passi.push({ titolo: 'Trova il titolare del potere sostitutivo', testo: 'Il nome deve essere pubblicato sul sito dell\'ente, raggiungibile dalla home page, di solito in «Amministrazione trasparente». Se non c\'è, il potere spetta al dirigente generale, poi al dirigente dell\'ufficio, poi al funzionario più alto in grado.' });
  }

  // ---------- preavviso di rigetto ----------
  if (r.problema === 'preavviso') {
    fonti.push(fonte('preavviso_rigetto'));
    const lim = r.data_preavviso ? dopo(r.data_preavviso, R.preavviso_rigetto.giorni) : null;
    verdetto = { tono: lim && lim < oggi ? 'no' : 'si', titolo: lim ? (lim < oggi ? 'I 10 giorni per le osservazioni sono passati' : `Hai tempo fino al ${lungo(lim)} per le osservazioni`) : 'Hai 10 giorni per mandare osservazioni', testo: R.preavviso_rigetto.testo };
    scad(lim, 'Ultimo giorno per le osservazioni al preavviso di rigetto', 'Manda per PEC osservazioni scritte ed eventuali documenti.');
    if (!r.data_preavviso) voci.push({ esito: 'dato', titolo: 'Manca la data della comunicazione', spiegazione: 'I 10 giorni decorrono da quando l\'hai ricevuta.', dato: 'data_preavviso' });
    documento = { tipo: 'osservazioni' };
    passi.push({ titolo: 'Se poi la domanda viene respinta', testo: 'Contro il provvedimento di rigetto si può ricorrere al giudice amministrativo con un avvocato: i termini sono brevi, quindi muoviti subito. Il difensore civico può aiutarti a chiedere un riesame.' });
  }

  // ---------- disservizio ----------
  if (r.problema === 'disservizio') {
    fonti.push(fonte('urp'), fonte('carte_servizi'));
    verdetto = { tono: 'si', titolo: 'Fai un reclamo scritto all\'ufficio o all\'URP', testo: `${R.urp.testo} Nessuna legge fissa un termine unico per la risposta: lo indica la carta dei servizi dell'ente. Se non rispondono o la risposta non basta, rivolgiti al difensore civico.` };
    documento = { tipo: 'reclamo' };
    if (r.passo === 'reclamo' && r.data_invio && r.risposta !== 'risolto') {
      scad(dopo(r.data_invio, 30), 'Controlla se il reclamo ha avuto risposta', 'Se no, o se la risposta non risolve, manda l\'istanza al difensore civico.');
      if (dopo(r.data_invio, 30) < oggi || r.risposta === 'parziale') documento = { tipo: 'difensore', motivo: 'disservizio' };
    }
  }

  // ---------- sanità ----------
  if (r.problema === 'sanita') {
    fonti.push(fonte('reclamo_sanitario_15'), fonte('garante_salute'));
    const lim = r.data_fatto ? dopo(r.data_fatto, R.reclamo_sanitario_15.giorni) : null;
    verdetto = { tono: lim && lim < oggi ? 'forse' : 'si', titolo: 'Reclamo al direttore generale dell\'ASL o dell\'ospedale, tramite l\'URP', testo: R.reclamo_sanitario_15.testo };
    scad(lim, 'Ultimo giorno per il reclamo sanitario', 'Entro 15 giorni da quando hai saputo dell\'atto o del comportamento.');
    if (lim && lim < oggi) voci.push({ esito: 'forse', titolo: 'Sono passati più di 15 giorni', spiegazione: 'Il reclamo si può mandare lo stesso: i 15 giorni non tolgono il diritto di rivolgersi al giudice, e il difensore civico può intervenire.' });
    documento = { tipo: 'reclamo', variante: 'sanita' };
  }

  // ---------- digitale ----------
  if (r.problema === 'digitale') {
    fonti.push(fonte('difensore_civico_digitale'));
    verdetto = { tono: 'si', titolo: 'Segnala al Difensore civico per il digitale (AgID)', testo: `${R.difensore_civico_digitale.testo} Prima conviene scrivere all'ente: la segnalazione è più forte se dimostri di averlo già avvisato.` };
    documento = { tipo: 'reclamo', variante: 'digitale' };
    voci.push({ esito: 'forse', titolo: 'Il modulo di AgID', spiegazione: 'La segnalazione si fa dall\'area «Difensore civico per il digitale» del sito di AgID. Il 25 ottobre 2026 il sito era in manutenzione: verifica l\'indirizzo del modulo prima di scrivere. La legge non fissa più un termine di risposta.' });
  }

  // ---------- privacy ----------
  if (r.problema === 'privacy' && GARANTE_PRIVACY) {
    fonti.push({ titolo: 'Garante privacy, come presentare un reclamo', url: GARANTE_PRIVACY.url });
    verdetto = { tono: 'si', titolo: 'Prima scrivi al responsabile della protezione dei dati dell\'ente, poi al Garante privacy', testo: `${GARANTE_PRIVACY.cosa} ${GARANTE_PRIVACY.termini || ''}`.trim() };
    passi.push({ titolo: 'Il reclamo al Garante', testo: `Gratuito, solo via PEC a ${GARANTE_PRIVACY.pec}, raccomandata o a mano, con firma digitale o autografa e copia del documento.` });
    documento = { tipo: 'reclamo', variante: 'privacy' };
  }

  // ---------- accesso negato ----------
  if (r.problema === 'accesso') {
    fonti.push(fonte('accesso_riesame_difensore'));
    verdetto = { tono: 'si', titolo: 'Per l\'accesso negato usa Chiedo gli atti', testo: R.accesso_riesame_difensore.testo };
    documento = null;
  }

  // ---------- il difensore civico ----------
  if (nazionale) {
    voci.push({ esito: 'forse', titolo: 'Ente nazionale', spiegazione: 'Il difensore civico regionale interviene verso Regione, enti locali e, con convenzione, Comuni; per gli uffici dello Stato e gli enti nazionali come INPS o Agenzia delle Entrate restano l\'URP, il titolare del potere sostitutivo e il giudice.' });
  } else if (dc) {
    const testo = {
      attivo: `${dc.ufficio || 'Difensore civico'}${dc.pec ? `, PEC ${dc.pec}` : ''}. ${R.difensore_comunale_soppresso.testo}`,
      vacante: `L'ufficio esiste ma la carica è vacante: ${dc.note?.split('.')[0] || ''}. Le istanze si possono mandare lo stesso, ma i tempi possono essere lunghi.`,
      assente: `In ${dc.territorio} non c'è un difensore civico regionale in carica. Restano l'URP, il titolare del potere sostitutivo e il giudice.`,
      non_verificato: `In ${dc.territorio} il difensore civico ${dc.esiste ? 'esiste' : 'potrebbe esistere'}, ma il 25 ottobre 2026 non siamo riusciti a verificarne i contatti sul sito ufficiale: cercali sul sito del Consiglio regionale.`,
      sconosciuto: 'Non sappiamo quale difensore civico è competente: scegli l\'ente.',
    }[dc.stato];
    voci.push({ esito: dc.stato === 'attivo' ? 'si' : 'forse', titolo: `Difensore civico: ${dc.territorio || 'territorio da scegliere'}`, spiegazione: testo });
    fonti.push(fonte('difensore_comunale_soppresso'));
    if (dc.url) fonti.push({ titolo: `Difensore civico ${dc.territorio}`, url: dc.url });
  }

  // ---------- rinvii ----------
  passi.push({ titolo: 'Manda tutto per PEC dalla tua casella', testo: 'La PEC prova la data di invio e di consegna. Conserva le ricevute: servono per i passi successivi.' });
  if (['disservizio', 'ritardo'].includes(r.problema)) passi.push({ titolo: 'Se sospetti uno spreco di soldi pubblici', testo: `${R.esposto_corte_conti.testo}` , link: R.esposto_corte_conti.norma.url });

  if (r.risposta === 'risolto') {
    verdetto = { tono: 'si', titolo: 'Risolto: bene così', testo: 'Conserva la corrispondenza e le ricevute delle PEC.' };
    documento = null;
  }
  const tono = voci.some((x) => x.esito === 'dato') && verdetto?.tono === 'si' ? 'dato' : verdetto?.tono;
  return { verdetto: { ...verdetto, tono }, scadenze, passi, voci, fonti: [...new Map(fonti.filter((f) => f?.url).map((f) => [f.titolo, f])).values()], documento, difensore: dc, nazionale };
}
