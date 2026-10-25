// Copia di comune/campi.js: non modificare qui, usa npm run sincronizza.
// Controllo dei campi che arrivano dall'assistente AI (dalla chat dell'assistente o
// dalla lettura di una foto): tiene solo i campi noti, converte i tipi,
// scarta i valori non validi e i dati personali, e dice cosa ha scartato.

import { data } from './date.js';

/** Dati personali: non passano mai dalla conversazione, si completano a mano. */
export const PERSONALI = new Set(['nome', 'nascita', 'residenza', 'codice_fiscale', 'recapito', 'telefono', 'comune_firma', 'luogo', 'indirizzo', 'iban', 'riferimento', 'codice_fornitura', 'numero_linea']);

/** Dalla foto di un documento si possono leggere i riferimenti (numero del verbale, targa, codice POD), mai i dati della persona. */
export const PERSONALI_FOTO = new Set(['nome', 'nascita', 'residenza', 'codice_fiscale', 'recapito', 'telefono', 'comune_firma', 'luogo', 'indirizzo', 'iban']);

/**
 * @param {Array} domande le domande dello strumento
 * @param {object} grezze i valori proposti
 * @param {object} [opz] { extra: {campo: conversione}, condizioniFigli: [[id, testo]], personali: Set }
 */
export function normalizza(domande, grezze, opz = {}) {
  const { extra = {}, condizioniFigli = [], personali = PERSONALI } = opz;
  const risposte = {};
  const avvisi = [];
  const perId = Object.fromEntries(domande.map((d) => [d.id, d]));
  for (const [k, v] of Object.entries(grezze || {})) {
    if (v === null || v === undefined || v === '') continue;
    if (personali.has(k)) { avvisi.push(`${k}: i dati personali non si trascrivono, si completano a mano`); continue; }
    const d = perId[k];
    if (!d) {
      if (extra[k]) risposte[k] = extra[k](v);
      else avvisi.push(`${k}: campo sconosciuto, ignorato`);
      continue;
    }
    if (d.tipo === 'numero' || d.tipo === 'euro') {
      const n = typeof v === 'number' ? v : Number(String(v).replace(/[€\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
      if (Number.isFinite(n)) risposte[k] = n; else avvisi.push(`${k}: numero non valido (${v})`);
    } else if (d.tipo === 'si_no') {
      const s = String(v).toLowerCase();
      if (v === true || s === 'true' || s === 'si' || s === 'sì') risposte[k] = true;
      else if (v === false || s === 'false' || s === 'no') risposte[k] = false;
      else if (s === 'non_so' && d.nonSo) risposte[k] = 'non_so';
      else avvisi.push(`${k}: usa true o false`);
    } else if (d.tipo === 'scelta' || d.tipo === 'elenco') {
      const ammessi = d.opzioni.map((o) => o[0]);
      if (ammessi.includes(String(v))) risposte[k] = String(v); else avvisi.push(`${k}: valore non ammesso (${v}); ammessi: ${ammessi.length > 40 ? 'vedi elenco' : ammessi.join(', ')}`);
    } else if (d.tipo === 'data') {
      if (data(String(v))) risposte[k] = String(v).slice(0, 10); else avvisi.push(`${k}: data non valida, usa AAAA-MM-GG`);
    } else if (d.tipo === 'figli') {
      if (Array.isArray(v)) {
        risposte[k] = v.filter((f) => f && /^\d{4}-\d{2}/.test(String(f.nascita || ''))).map((f) => ({
          nascita: String(f.nascita).slice(0, 7),
          disabile: f.disabile === true || f.disabile === 'true',
          condizione: condizioniFigli.some((c) => c[0] === f.condizione) ? f.condizione : undefined,
        }));
        if (risposte[k].length !== v.length) avvisi.push('figli: ogni figlio vuole nascita nel formato AAAA-MM');
      } else avvisi.push('figli: serve un elenco di oggetti {nascita: "AAAA-MM"}');
    } else {
      risposte[k] = String(v).slice(0, 2000);
    }
  }
  return { risposte, avvisi };
}

/** Dizionario dei campi di uno strumento, compatto, per le istruzioni all'assistente AI. */
export function dizionario(domande, opz = {}) {
  const { condizioniFigli = [], personali = PERSONALI } = opz;
  return domande.filter((d) => !personali.has(d.id)).map((d) => {
    let tipo = d.tipo === 'euro' ? 'numero in euro' : d.tipo === 'si_no' ? (d.nonSo ? 'true|false|non_so' : 'true|false') : d.tipo === 'data' ? 'AAAA-MM-GG' : d.tipo;
    if (d.tipo === 'scelta' || d.tipo === 'elenco') tipo = d.id === 'provincia' ? 'sigla di provincia (es. MI, RM, NA, AO)' : d.opzioni.length > 40 ? `codice IATA dell'aeroporto (es. FCO, MXP, NAP, CDG, JFK); se non è tra i ${d.opzioni.length - 1} in elenco l'avviso lo dice: allora usa "altro" e indica distanza_km` : d.opzioni.map((o) => o[0]).join('|');
    if (d.tipo === 'figli') tipo = `elenco di {nascita: "AAAA-MM", disabile?: true|false${condizioniFigli.length ? `, condizione?: ${condizioniFigli.map((c) => c[0]).join('|')} (solo 18-21 anni)` : ''}}`;
    return `- ${d.id} (${tipo}): ${d.etichetta}`;
  }).join('\n');
}
