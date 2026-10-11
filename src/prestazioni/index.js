// Elenco delle prestazioni valutate da Mi spetta. Per aggiungerne una:
// scrivi la scheda in uno dei file qui accanto e aggiungila a questo elenco.

import { assegnoInclusione, supportoFormazioneLavoro, cartaAcquisti } from './reddito.js';
import { assegnoSociale, quattordicesima, esoneroCanoneTv } from './anziani.js';
import { bonusSocialeBollette, contributoLuce25000, bonusTari, detrazioneAffitto, detrazioneAffittoGiovani } from './casa.js';
import { esenzioneTicket, bonusPsicologo, trattamentoIntegrativo, cuneoFiscale, naspi } from './salute-lavoro.js';
import * as famiglia from './famiglia.js';

export const PRESTAZIONI = [
  ...Object.values(famiglia),
  assegnoInclusione,
  supportoFormazioneLavoro,
  cartaAcquisti,
  assegnoSociale,
  quattordicesima,
  esoneroCanoneTv,
  bonusSocialeBollette,
  contributoLuce25000,
  bonusTari,
  detrazioneAffitto,
  detrazioneAffittoGiovani,
  esenzioneTicket,
  bonusPsicologo,
  trattamentoIntegrativo,
  cuneoFiscale,
  naspi,
];
