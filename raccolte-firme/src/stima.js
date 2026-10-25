// Raccolte firme in corso: a che punto è ogni raccolta e quanto è probabile che
// arrivi all'obiettivo. Il metodo è dichiarato e semplice: niente modelli opachi.

export const VERIFICATO = '2026-10-25';
const R = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:';
export const FONTI = {
  piattaforma: { titolo: 'Piattaforma pubblica per la raccolta delle firme (Ministero della Giustizia)', url: 'https://firmereferendum.giustizia.it/referendum/open' },
  art71: { titolo: 'Costituzione, art. 71: 50.000 firme per una proposta di legge di iniziativa popolare', url: `${R}costituzione:1947-12-27~art71` },
  art75: { titolo: 'Costituzione, art. 75: 500.000 firme per un referendum abrogativo', url: `${R}costituzione:1947-12-27~art75` },
  l352_28: { titolo: 'L. 352/1970, art. 28: deposito del referendum entro 3 mesi', url: `${R}legge:1970-05-25;352~art28` },
  l352_32: { titolo: 'L. 352/1970, art. 32: deposito dei referendum dal 1° gennaio al 30 settembre', url: `${R}legge:1970-05-25;352~art32` },
  l352_49: { titolo: 'L. 352/1970, art. 49: per le proposte di legge valgono le firme degli ultimi 6 mesi', url: `${R}legge:1970-05-25;352~art49` },
  l178: { titolo: 'L. 178/2020, art. 1, commi 341-344: la piattaforma pubblica', url: `${R}legge:2020-12-30;178~art1-com341` },
};

const GIORNO = 86400000;
const giorni = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / GIORNO);
export const dettaglio = (id) => `https://firmereferendum.giustizia.it/referendum/open/dettaglio-open/${id}`;

/** Ritmo degli ultimi giorni dalla serie salvata ogni giorno, se ci sono almeno 3 giorni. */
function ritmoRecente(serie, oggi) {
  if (!serie || serie.length < 2) return null;
  const ultimi = serie.filter(([d]) => giorni(d, oggi) <= 14);
  if (ultimi.length < 2) return null;
  const [d0, n0] = ultimi[0];
  const [d1, n1] = ultimi[ultimi.length - 1];
  const g = giorni(d0, d1);
  return g >= 3 ? Math.max(0, (n1 - n0) / g) : null;
}

/**
 * Lo stato di una raccolta e la stima. Livelli: raggiunto, probabile, in_bilico, difficile,
 * molto_difficile, senza_scadenza, conclusa.
 * Il ritmo delle raccolte di solito rallenta dopo le prime settimane: per questo si considera
 * «probabile» solo quando basta meno della metà del ritmo tenuto finora.
 */
export function stima(x, { oggi, serie } = {}) {
  const fine = x.fine;
  const attiva = (x.stato === 'IN RACCOLTA FIRME') && (!fine || fine >= oggi);
  const passati = x.inizio ? Math.max(1, giorni(x.inizio, oggi)) : null;
  const mancanti = fine ? Math.max(0, giorni(oggi, fine)) : null;
  const quota = x.quorum ? Math.min(100, (100 * x.firme) / x.quorum) : null;
  const medio = passati ? x.firme / passati : null;
  const recente = ritmoRecente(serie, oggi);
  const ritmo = recente ?? medio;
  const mancano = x.quorum ? Math.max(0, x.quorum - x.firme) : null;
  const servono = mancanti ? mancano / mancanti : null;
  const out = { attiva, passati, mancanti, quota, medio, recente, ritmo, mancano, servono, proiezione: null, livello: null };

  if (x.quorum && x.firme >= x.quorum) out.livello = 'raggiunto';
  else if (!attiva) out.livello = 'conclusa';
  else if (!fine) out.livello = 'senza_scadenza';
  else if (mancanti === 0) out.livello = mancano > 0 ? 'molto_difficile' : 'raggiunto';
  else {
    out.proiezione = Math.round(x.firme + (ritmo || 0) * mancanti);
    const rapporto = ritmo > 0 ? servono / ritmo : Infinity;
    out.rapporto = rapporto;
    out.livello = rapporto <= 0.5 ? 'probabile' : rapporto <= 1.2 ? 'in_bilico' : rapporto <= 3 ? 'difficile' : 'molto_difficile';
  }
  return out;
}

export const LIVELLI = {
  raggiunto: ['Obiettivo raggiunto online', 'si'],
  probabile: ['Probabile', 'si'],
  in_bilico: ['In bilico', 'forse'],
  difficile: ['Difficile', 'no'],
  molto_difficile: ['Molto difficile', 'no'],
  senza_scadenza: ['Senza scadenza indicata', 'neutro'],
  conclusa: ['Conclusa', 'neutro'],
};

/** Quante raccolte concluse hanno superato l'obiettivo con le sole firme online. */
export function storico(raccolte, oggi) {
  const concluse = raccolte.filter((x) => !stima(x, { oggi }).attiva);
  const per = (tipo) => {
    const c = concluse.filter((x) => x.tipo === tipo);
    return { totale: c.length, riuscite: c.filter((x) => x.quorum && x.firme >= x.quorum).length };
  };
  return { legge: per('legge'), referendum: per('referendum') };
}
