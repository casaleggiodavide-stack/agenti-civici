// Misure regionali: una scheda per Regione. Ogni misura ha `regione` e il
// motore la valuta solo per chi risiede lì.

import * as toscana from './toscana.js';
import * as lazio from './lazio.js';
import * as umbria from './umbria.js';
import * as marche from './marche.js';
import * as molise from './molise.js';
import * as emiliaRomagna from './emilia_romagna.js';
import * as bolzano from './bolzano.js';
import * as trento from './trento.js';
import * as friuliVeneziaGiulia from './friuli_venezia_giulia.js';
import * as veneto from './veneto.js';
import * as liguria from './liguria.js';
import * as lombardia from './lombardia.js';
import * as valleDAosta from './valle_d_aosta.js';
import * as piemonte from './piemonte.js';
import * as abruzzo from './abruzzo.js';
import * as sardegna from './sardegna.js';
import * as sicilia from './sicilia.js';
import * as calabria from './calabria.js';
import * as campania from './campania.js';
import * as basilicata from './basilicata.js';
import * as puglia from './puglia.js';

export const REGIONALI = [
  ...Object.values(toscana),
  ...Object.values(lazio),
  ...Object.values(umbria),
  ...Object.values(marche),
  ...Object.values(molise),
  ...Object.values(emiliaRomagna),
  ...Object.values(bolzano),
  ...Object.values(trento),
  ...Object.values(friuliVeneziaGiulia),
  ...Object.values(veneto),
  ...Object.values(liguria),
  ...Object.values(lombardia),
  ...Object.values(valleDAosta),
  ...Object.values(piemonte),
  ...Object.values(abruzzo),
  ...Object.values(sardegna),
  ...Object.values(sicilia),
  ...Object.values(calabria),
  ...Object.values(campania),
  ...Object.values(basilicata),
  ...Object.values(puglia),
];
