// Sigle di provincia e regione di appartenenza, e regioni senza difensore
// civico regionale in carica (fonte secondaria: Coordinamento nazionale dei
// difensori civici, verificata all'11/10/2026; da ricontrollare).

const R = {
  Piemonte: 'AL AT BI CN NO TO VB VC',
  "Valle d'Aosta": 'AO',
  Lombardia: 'BG BS CO CR LC LO MB MI MN PV SO VA',
  'Trentino-Alto Adige': 'BZ TN',
  Veneto: 'BL PD RO TV VE VI VR',
  'Friuli-Venezia Giulia': 'GO PN TS UD',
  Liguria: 'GE IM SP SV',
  'Emilia-Romagna': 'BO FC FE MO PC PR RA RE RN',
  Toscana: 'AR FI GR LI LU MS PI PO PT SI',
  Umbria: 'PG TR',
  Marche: 'AN AP FM MC PU',
  Lazio: 'FR LT RI RM VT',
  Abruzzo: 'AQ CH PE TE',
  Molise: 'CB IS',
  Campania: 'AV BN CE NA SA',
  Puglia: 'BA BR BT FG LE TA',
  Basilicata: 'MT PZ',
  Calabria: 'CS CZ KR RC VV',
  Sicilia: 'AG CL CT EN ME PA RG SR TP',
  Sardegna: 'CA NU OR SS SU',
};

export const REGIONE_DI = Object.fromEntries(Object.entries(R).flatMap(([reg, s]) => s.split(' ').map((x) => [x, reg])));

/** Regioni senza difensore civico regionale in carica, o con situazione incerta. */
export const SENZA_DIFENSORE = new Set(['Sicilia', 'Puglia', 'Calabria']);
export const DIFENSORE_INCERTO = new Set(['Molise', 'Umbria', 'Basilicata', 'Trentino-Alto Adige']);

/** Categorie IndicePA di regioni ed enti locali (art. 5 c. 8 d.lgs. 33/2013: difensore civico). */
export const LOCALI = new Set(['L1', 'L4', 'L5', 'L6', 'L12', 'L18', 'L36', 'L45']);
/** Categorie di amministrazioni statali (accesso documentale: Commissione per l'accesso). */
export const STATALI = new Set(['C1', 'C10', 'C11', 'L46', 'L47']);
