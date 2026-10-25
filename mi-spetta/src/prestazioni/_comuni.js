// Strumenti condivisi dalle schede delle prestazioni.

export const VERIFICATO = '2026-10-11';

const euroInteri = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const euroCentesimi = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
/** Euro all'italiana: 1.200 €, 305,70 €. */
export const eur = (n) => (Math.abs(n - Math.round(n)) < 0.005 ? euroInteri : euroCentesimi).format(n);

/** Un requisito: testo leggibile, esito a tre valori, domanda da cui dipende. */
export const req = (testo, ok, dato) => ({ testo, ok: ok === undefined ? null : ok, dato });

/** Cittadinanza italiana, UE, o extra UE con permesso di lungo periodo o protezione. */
export function cittadinanzaAmmessa(s) {
  if (!s.cittadinanza) return req('Cittadinanza italiana o UE, oppure permesso UE di lungo periodo o protezione internazionale', null, 'cittadinanza');
  return req(
    'Cittadinanza italiana o UE, oppure permesso UE di lungo periodo o protezione internazionale',
    s.cittadinanza !== 'extra_ue_altro',
    'cittadinanza',
  );
}

export function residenzaAlmeno(s, anni) {
  const ok = s.anniResidenza === null ? null : s.anniResidenza >= anni;
  return req(`Residenza in Italia da almeno ${anni} anni`, ok, 'anni_residenza');
}

export function iseeEntro(s, soglia, testo) {
  return req(testo || `ISEE fino a ${eur(soglia)}`, s.isee === null ? null : s.isee <= soglia, 'isee');
}

export function figliNoti(s) {
  return s.figliRisposta ? true : null;
}

/** Il nucleo è fatto solo di persone con 67 anni o più. */
export function soloOver67(s) {
  if (s.eta === null) return null;
  if (s.eta < 67) return false;
  if (s.nFigli > 0 || s.altriAdulti > 0) return false;
  if (s.coniuge === true) return s.coniugeEta === null ? null : s.coniugeEta >= 67;
  return s.coniuge === false ? true : null;
}

/**
 * Scala di equivalenza ADI (DL 48/2023, art. 2 c. 4), stimata con i dati del
 * questionario: non sappiamo chi è il componente disabile, né i carichi di cura
 * esatti, quindi è un'approssimazione dichiarata.
 */
export function scalaADI(s) {
  let scala = 1;
  if (s.coniuge && s.coniugeEta !== null && s.coniugeEta >= 60) scala += 0.4;
  else if (s.coniuge) {
    const caricoCura = s.minori.some((f) => f.anni !== null && f.anni < 3) || s.minori.length >= 3 || s.disabileNucleo === true;
    if (caricoCura) scala += 0.4;
  }
  if (s.altriAdulti > 0 && s.over60 === true && !(s.eta >= 60) && !(s.coniugeEta >= 60)) scala += 0.4;
  const m = s.minori.length;
  scala += Math.min(m, 2) * 0.15 + Math.max(0, m - 2) * 0.1;
  const massimo = s.disabileNucleo ? 2.3 : 2.2;
  return Math.min(scala, massimo);
}

/** Patrimonio mobiliare massimo per ADI e SFL. */
export function sogliaMobiliareADI(s) {
  let soglia = Math.min(6000 + 2000 * (s.componenti - 1), 10000);
  soglia += 1000 * Math.max(0, s.minori.length - 2);
  if (s.disabileNucleo) soglia += 5000;
  return soglia;
}

export const LAVORO_DIPENDENTE = ['dipendente_indeterminato', 'dipendente_determinato'];

// ---------- Misure regionali ----------

/** Data dell'ultima verifica delle misure regionali. */
export const VERIFICATO_REGIONI = '2026-10-25';

/** Residenza nella Regione da almeno n anni (la Regione è già filtrata dal motore). */
export function residenzaRegioneAlmeno(s, anni, nome) {
  const ok = s.anniResidenzaRegione === null ? null : s.anniResidenzaRegione >= anni;
  return req(`Residenza in ${nome} da almeno ${anni} ${anni === 1 ? 'anno' : 'anni'}`, ok, 'anni_residenza_regione');
}

/** Almeno un figlio con età in [da, a) anni; null se i figli non sono stati indicati. */
export function figlioTra(s, da, a, testo) {
  if (!s.figliRisposta) return req(testo, null, 'figli');
  const noti = s.figli.filter((f) => f.anni !== null);
  if (noti.some((f) => f.anni >= da && f.anni < a)) return req(testo, true, 'figli');
  return req(testo, noti.length === s.figli.length ? false : null, 'figli');
}
