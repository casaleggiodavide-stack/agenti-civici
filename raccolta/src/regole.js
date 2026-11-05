// Chi raccoglie i rifiuti?: dal nome del Comune al gestore della raccolta, al suo sito, al telefono e alla
// pagina del calendario; più i diritti di chi paga la TARI, dalle regole dell'Autorità (ARERA).
// I dati (src/dati/raccolta.js) li prepara scripts/raccolta-dati.py dalla «Ricerca operatori» di ARERA.

export const ARERA_TITR = 'https://www.arera.it/fileadmin/allegati/docs/19/444-19titr.pdf';
export const ARERA_TQRIF = 'https://www.arera.it/fileadmin/allegati/docs/22/015-22alla.pdf';

/** I diritti di chi paga la TARI verso chi raccoglie i rifiuti, con l'articolo. */
export const DIRITTI = [
  { titolo: 'Il calendario deve essere pubblico', testo: 'Il gestore deve tenere sul suo sito il calendario e gli orari della raccolta, compresi i centri di raccolta, e riportarli almeno una volta l\'anno nell\'avviso della TARI (o indicare dove trovarli).',
    fonte: 'ARERA, TITR (delibera 444/2019), artt. 3.1 lettera d) e 8.2', url: ARERA_TITR },
  { titolo: 'Se il calendario cambia, 30 giorni di preavviso', testo: 'Le modifiche del calendario del porta a porta e il passaggio a un altro tipo di raccolta vanno comunicati almeno 30 giorni prima.',
    fonte: 'ARERA, TITR, art. 9.1', url: ARERA_TITR },
  { titolo: 'Un numero verde gratuito', testo: 'Da fisso e da cellulare, per chiedere informazioni (giorni e orari della raccolta, cosa va dove), segnalare un disservizio, prenotare un ritiro, far riparare il bidone.',
    fonte: 'ARERA, TQRIF (delibera 15/2022), artt. 20 e 22', url: ARERA_TQRIF },
  { titolo: 'Il ritiro degli ingombranti a casa, senza pagare', testo: 'Almeno un ritiro al mese, a bordo strada, fino a cinque pezzi. Dove ci sono i centri di raccolta l\'Ente può prevedere meno ritiri o un piccolo contributo, ma non per chi ha il bonus sociale per luce, gas o acqua.',
    fonte: 'ARERA, TQRIF, art. 29', url: ARERA_TQRIF },
  { titolo: 'Raccolta saltata o bidone rotto: si segnala', testo: 'Per email, telefono, posta o allo sportello. Il gestore ha un tempo per intervenire (5 giorni lavorativi per i disservizi, 10 per riparare il bidone) e per rispondere per iscritto a un reclamo (30 giorni lavorativi), che vale come standard di qualità nella maggior parte delle gestioni.',
    fonte: 'ARERA, TQRIF, artt. 14, 32, 33, 34 e tabella 1', url: ARERA_TQRIF },
];

export const normalizza = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Prepara l'indice per la ricerca. */
export function indicizza(dati) {
  return {
    ...dati,
    righe: dati.comuni.map(([istat, nome, sigla, regione, gestori, pec, sito]) => ({ istat, nome, sigla, regione, gestori, pec, sito, n: normalizza(nome) })),
  };
}

/** I Comuni che corrispondono a quello che hai scritto: prima chi comincia così, poi chi lo contiene. Accetta «Nome (XX)» o «Nome XX». */
export function cerca(indice, testo, limite = 8) {
  let t = normalizza(testo);
  if (!t) return [];
  let sigla = '';
  const m = t.match(/^(.*?)\s+([a-z]{2})$/);
  if (m && indice.righe.some((r) => r.sigla.toLowerCase() === m[2] && r.n.startsWith(m[1]))) { t = m[1]; sigla = m[2].toUpperCase(); }
  const punti = (r) => (r.n === t ? 3 : r.n.startsWith(t) ? 2 : r.n.includes(` ${t}`) ? 1 : r.n.includes(t) ? 0.5 : -1);
  return indice.righe
    .filter((r) => (!sigla || r.sigla === sigla) && punti(r) >= 0)
    .sort((a, b) => punti(b) - punti(a) || a.n.length - b.n.length || a.n.localeCompare(b.n))
    .slice(0, limite);
}

/** Tutto quello che serve sapere per un Comune. */
export function scheda(indice, riga) {
  const gestori = riga.gestori.map((i) => {
    const [nome, piva, sito, telefono, calendario, inEconomia] = indice.gestori[i];
    return { nome, piva, sito, telefono, calendario, inEconomia: !!inEconomia };
  });
  const anno = new Date().getFullYear();
  return {
    comune: riga.nome, provincia: riga.sigla, regione: riga.regione, istat: riga.istat,
    gestori,
    pecComune: riga.pec, sitoComune: riga.sito ? (riga.sito.startsWith('http') ? riga.sito : `https://${riga.sito}`) : '',
    cercaCalendario: `https://duckduckgo.com/?q=${encodeURIComponent(`calendario raccolta differenziata ${riga.nome} ${anno}`)}`,
    segnala: `https://github.com/casaleggiodavide-stack/agenti-civici/issues/new?title=${encodeURIComponent(`Chi raccoglie i rifiuti: dato da correggere per ${riga.nome} (${riga.sigla})`)}`,
  };
}

/** Il testo della risposta, per l'assistente e il server MCP. */
export function testo(s) {
  const righe = [];
  if (!s.gestori.length) righe.push(`Per ${s.comune} (${s.provincia}) l'elenco di ARERA non indica un gestore della raccolta: chiedi al Comune${s.pecComune ? ` (PEC ${s.pecComune})` : ''}.`);
  for (const g of s.gestori) {
    righe.push(`${s.comune} (${s.provincia}): la raccolta dei rifiuti la fa ${g.nome}${g.inEconomia ? ' (gestione diretta del Comune)' : ''}.`);
    if (g.calendario) righe.push(`Calendario (pagina trovata in automatico sul sito del gestore): ${g.calendario}`);
    if (g.sito) righe.push(`Sito: ${g.sito}`);
    if (g.telefono) righe.push(`Telefono: ${g.telefono}`);
  }
  if (s.pecComune) righe.push(`PEC del Comune (per la TARI e i reclami): ${s.pecComune}`);
  righe.push('Il gestore deve pubblicare calendario e orari sul suo sito e avvisare 30 giorni prima se il calendario del porta a porta cambia (ARERA, TITR artt. 3 e 9); deve avere un numero verde gratuito e ritirare gli ingombranti a casa almeno una volta al mese senza costi (TQRIF artt. 20 e 29, salvo le deroghe dell\'Ente).');
  return righe.join('\n');
}
