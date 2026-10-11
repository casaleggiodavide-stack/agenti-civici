// Regole di «Faccio ricorso?»: controlla termini e motivi oggettivi di una
// multa stradale, confronta i costi delle strade possibili e indica a chi
// rivolgersi. Non dà pareri: segnala solo ciò che si verifica dal verbale.
// Fonti: Codice della Strada (d.lgs. 285/1992) e d.lgs. 150/2011 nel testo
// vigente su Normattiva all'11/10/2026, DPR 115/2002, decreti MIT.

import { data, iso, oggi as oggiCal, giorniTra, scadenza, scrittaBreve } from './comune/date.js';
import { PREFETTURE } from './dati/prefetture.js';

export const VERIFICATO = '2026-10-11';
const N = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art';
export const FONTI = {
  art7: { titolo: 'Codice della Strada, art. 7 (sosta a pagamento)', url: N + '7' },
  art142: { titolo: 'Codice della Strada, art. 142 (limiti di velocità)', url: N + '142' },
  art196: { titolo: 'Codice della Strada, art. 196 (chi risponde della multa)', url: N + '196' },
  art198: { titolo: 'Codice della Strada, art. 198 (più violazioni nella stessa ZTL)', url: N + '198' },
  art200: { titolo: 'Codice della Strada, art. 200 (contestazione e verbale)', url: N + '200' },
  art201: { titolo: 'Codice della Strada, art. 201 (notifica)', url: N + '201' },
  art202: { titolo: 'Codice della Strada, art. 202 (pagamento in misura ridotta)', url: N + '202' },
  art203: { titolo: 'Codice della Strada, art. 203 (ricorso al Prefetto)', url: N + '203' },
  art204: { titolo: 'Codice della Strada, art. 204 (decisione del Prefetto)', url: N + '204' },
  art204bis: { titolo: 'Codice della Strada, art. 204-bis (ricorso al Giudice di Pace)', url: N + '204bis' },
  art126bis: { titolo: 'Codice della Strada, art. 126-bis (punti e dati del conducente)', url: N + '126bis' },
  dlgs150: { titolo: 'D.lgs. 150/2011, art. 7 (opposizione al verbale davanti al Giudice di Pace)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2011-09-01;150~art7' },
  dpr115: { titolo: 'DPR 115/2002, art. 13 (contributo unificato)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:2002-05-30;115~art13' },
  dm2026: { titolo: 'Decreto MIT 8/6/2026 sull\'omologazione dei misuratori di velocità (GU n. 159 dell\'11/7/2026)', url: 'https://www.gazzettaufficiale.it/eli/gu/2026/07/11/159/sg/html' },
  send: { titolo: 'DL 76/2020, art. 26 (notifiche tramite SEND e app IO)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2020-07-16;76~art26' },
};

const RIFORMA_2024 = data('2024-12-14'); // L. 177/2024 in vigore
const DM_AUTOVELOX = data('2026-07-12'); // decreto MIT 8/6/2026 in vigore

const maiuscola = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const motivo = (m) => ({ forza: null, preferisciGdp: false, testoRicorso: null, dato: null, fonti: [], ...m });

function motivi(r, s) {
  const out = [];
  const dv = data(r.data_violazione);

  // 1. Notifica oltre i 90 giorni (360 per chi risiede all'estero).
  if (s.notificato) {
    const limite = r.estero === true ? 360 : 90;
    const base = { id: 'notifica_tardiva', titolo: `Notifica entro ${limite} giorni`, fonti: [FONTI.art201, FONTI.send] };
    const rif = data(r.data_spedizione) || null;
    const ricevuto = data(r.data_notifica);
    if (!dv || (!ricevuto && !rif)) {
      out.push(motivo({ ...base, esito: 'dato', spiegazione: 'Servono la data della violazione e quella in cui hai ricevuto il verbale.', dato: !dv ? 'data_violazione' : 'data_notifica' }));
    } else if (r.noleggio === true) {
      out.push(motivo({ ...base, esito: 'nessuno', spiegazione: 'Per i veicoli a noleggio o in leasing, o quando il conducente è stato indicato da altri, i 90 giorni partono da quando l\'ente ha avuto i tuoi dati: dal verbale non si può verificare.' }));
    } else {
      const giorniRif = rif ? giorniTra(dv, rif) : null;
      const giorniRic = ricevuto ? giorniTra(dv, ricevuto) : null;
      if (giorniRif !== null && giorniRif > limite) {
        out.push(motivo({
          ...base, esito: 'vizio', forza: 'forte', problema: `verbale spedito dopo ${giorniRif} giorni`,
          spiegazione: `Il verbale è partito ${giorniRif} giorni dopo la violazione, oltre i ${limite} giorni di legge. In questo caso l'obbligo di pagare si estingue.`,
          testoRicorso: `Il verbale è stato spedito il ${scrittaBreve(rif)}, cioè ${giorniRif} giorni dopo l'accertamento del ${scrittaBreve(dv)}, oltre il termine di ${limite} giorni previsto dall'art. 201, comma 1, del Codice della Strada. Ai sensi dell'art. 201, comma 5, l'obbligo di pagare la somma dovuta per la violazione si è estinto.`,
        }));
      } else if (giorniRic !== null && giorniRic <= limite) {
        out.push(motivo({ ...base, esito: 'nessuno', spiegazione: `Lo hai ricevuto ${giorniRic} giorni dopo la violazione: è nei termini.` }));
      } else if (giorniRif !== null) {
        out.push(motivo({ ...base, esito: 'nessuno', spiegazione: `È partito ${giorniRif} giorni dopo la violazione: conta la data di spedizione, ed è nei termini.` }));
      } else if (r.modo === 'pec') {
        out.push(motivo({
          ...base, esito: 'vizio', forza: 'forte', problema: `verbale notificato dopo ${giorniRic} giorni`,
          spiegazione: `La PEC è arrivata ${giorniRic} giorni dopo la violazione, oltre i ${limite} giorni. Con la PEC spedizione e consegna coincidono.`,
          testoRicorso: `Il verbale è stato notificato a mezzo PEC il ${scrittaBreve(ricevuto)}, cioè ${giorniRic} giorni dopo l'accertamento del ${scrittaBreve(dv)}, oltre il termine di ${limite} giorni previsto dall'art. 201, comma 1, del Codice della Strada. Ai sensi dell'art. 201, comma 5, l'obbligo di pagare si è estinto.`,
        }));
      } else {
        out.push(motivo({
          ...base, esito: 'dato', dato: 'data_spedizione',
          spiegazione: `Lo hai ricevuto ${giorniRic} giorni dopo la violazione. Per i ${limite} giorni conta però la data in cui l'ente lo ha spedito o caricato su SEND: se è anche quella oltre il termine, è un motivo forte.`,
        }));
      }
    }
  }

  // 2. Veicolo non tuo alla data della violazione.
  if (r.veicolo_tuo === false) {
    out.push(motivo({
      id: 'veicolo_non_tuo', titolo: 'Veicolo non tuo alla data della violazione', problema: 'il veicolo non era tuo', esito: 'vizio', forza: 'forte', fonti: [FONTI.art196],
      spiegazione: 'Se il veicolo era già venduto, rubato o mai tuo, non rispondi della multa. Serve un documento che lo provi: atto di vendita, denuncia di furto, visura.',
      testoRicorso: 'Alla data della violazione il veicolo non era nella mia proprietà né nella mia disponibilità [indicare: venduto il … / rubato, denuncia del … presso …], come risulta dal documento allegato. Non sono quindi responsabile della violazione ai sensi dell\'art. 196 del Codice della Strada.',
    }));
  } else if (r.veicolo_tuo === undefined) {
    out.push(motivo({ id: 'veicolo_non_tuo', titolo: 'Veicolo tuo alla data della violazione', esito: 'dato', dato: 'veicolo_tuo', spiegazione: 'Se il veicolo era già venduto o rubato, è un motivo forte.' }));
  }

  // 3. Dati del veicolo sbagliati.
  if (r.dati_corretti === false) {
    out.push(motivo({
      id: 'dati_errati', titolo: 'Dati del veicolo sbagliati', problema: 'dati del veicolo sbagliati', esito: 'vizio', forza: 'forte', fonti: [FONTI.art200],
      spiegazione: 'Il verbale deve identificare con precisione il veicolo. Se targa, marca o modello non sono i tuoi, può riguardare un altro veicolo.',
      testoRicorso: 'Il verbale riporta dati del veicolo che non corrispondono a quello di mia proprietà [indicare: targa / marca / modello riportati e quelli corretti], come risulta dalla carta di circolazione allegata. Il verbale non identifica quindi correttamente il veicolo, come richiede l\'art. 200, comma 2, del Codice della Strada.',
    }));
  }

  // 4. Mancata contestazione immediata senza motivo.
  if (s.notificato && r.tipo === 'altro') {
    const base = { id: 'motivo_contestazione', titolo: 'Motivo della mancata contestazione', fonti: [FONTI.art200, FONTI.art201] };
    if (r.motivo_indicato === false) {
      out.push(motivo({
        ...base, esito: 'vizio', forza: 'forte', problema: 'manca il motivo della mancata contestazione',
        spiegazione: 'Per questa violazione gli agenti dovevano fermarti, se possibile. Se non l\'hanno fatto, il verbale deve spiegare perché.',
        testoRicorso: 'La violazione non mi è stata contestata immediatamente e il verbale non indica i motivi della mancata contestazione, come invece impone l\'art. 201, comma 1, del Codice della Strada. La violazione non rientra nei casi dell\'art. 201, comma 1-bis, in cui la contestazione immediata non è necessaria.',
      }));
    } else if (r.motivo_indicato === true) {
      out.push(motivo({ ...base, esito: 'nessuno', spiegazione: 'Il verbale indica il motivo. Si può contestare solo se il motivo è palesemente falso.' }));
    } else {
      out.push(motivo({ ...base, esito: 'dato', dato: 'motivo_indicato', spiegazione: 'Controlla se il verbale spiega perché non ti hanno fermato.' }));
    }
  }

  // 5-9. Autovelox e tutor.
  if (r.tipo === 'velocita') {
    const dopoDM = dv && dv >= DM_AUTOVELOX;
    const base = { id: 'omologazione', titolo: 'Apparecchio omologato', fonti: [FONTI.art142, FONTI.dm2026] };
    if (r.strumento === 'omologato') {
      out.push(motivo({ ...base, esito: 'nessuno', spiegazione: 'Il verbale indica un apparecchio omologato.' }));
    } else if (r.strumento === 'approvato' || r.strumento === 'non_indicato') {
      if (!dv) out.push(motivo({ ...base, esito: 'dato', dato: 'data_violazione', spiegazione: 'Serve la data: le regole sono cambiate il 12 luglio 2026.' }));
      else if (!dopoDM) {
        out.push(motivo({
          ...base, esito: 'vizio', forza: 'discusso', preferisciGdp: true, problema: 'autovelox non omologato',
          spiegazione: 'Per la Cassazione (ordinanza 10505/2024 e molte successive) un apparecchio solo «approvato» non vale come «omologato» e le sue rilevazioni non sono utilizzabili. Il Ministero dell\'Interno sostiene il contrario e le Prefetture seguono il Ministero: per questo motivo conviene il Giudice di Pace.',
          testoRicorso: r.strumento === 'approvato'
            ? 'L\'apparecchio con cui è stata rilevata la velocità risulta, dallo stesso verbale, soltanto approvato e non omologato, come invece richiede l\'art. 142, comma 6, del Codice della Strada. La Corte di Cassazione (ordinanza n. 10505 del 18 aprile 2024 e successive conformi) ha chiarito che l\'approvazione del prototipo non equivale all\'omologazione e che le rilevazioni effettuate con apparecchi non omologati non possono fondare la sanzione.'
            : 'Il verbale non indica gli estremi dell\'omologazione dell\'apparecchio con cui è stata rilevata la velocità, che l\'art. 142, comma 6, del Codice della Strada richiede. Chiedo che l\'amministrazione produca il decreto di omologazione: la Corte di Cassazione (ordinanza n. 10505/2024 e successive conformi) ha chiarito che la sola approvazione non è sufficiente.',
        }));
      } else {
        out.push(motivo({
          ...base, esito: 'vizio', forza: 'discusso', problema: 'omologazione non indicata nel verbale',
          spiegazione: 'Dal 12 luglio 2026 il decreto MIT considera omologati gli apparecchi conformi ai prototipi del suo allegato, e il verbale deve indicarlo. Se manca, è un vizio formale più debole di quello sulle multe precedenti.',
          testoRicorso: 'Il verbale non indica che l\'apparecchio impiegato è omologato ai sensi dell\'art. 6, comma 1, del decreto del Ministro delle infrastrutture e dei trasporti 8 giugno 2026, applicabile alle violazioni successive al 12 luglio 2026. Chiedo che l\'amministrazione ne dia prova.',
        }));
      }
    } else {
      out.push(motivo({ ...base, esito: 'dato', dato: 'strumento', spiegazione: 'Controlla cosa dice il verbale sull\'apparecchio: approvato o omologato.' }));
    }

    const tbase = { id: 'taratura', titolo: 'Taratura annuale', fonti: [FONTI.art142] };
    const tar = data(r.taratura);
    if (tar && dv) {
      const g = giorniTra(tar, dv);
      if (g > 365) {
        out.push(motivo({
          ...tbase, esito: 'vizio', forza: 'forte', problema: 'taratura di oltre un anno prima',
          spiegazione: `L'ultima taratura indicata risale a ${g} giorni prima della violazione, oltre l'anno. Dopo la sentenza 113/2015 della Corte costituzionale gli apparecchi devono essere verificati periodicamente.`,
          testoRicorso: `Dal verbale risulta che l'ultima verifica di taratura dell'apparecchio risale al ${scrittaBreve(tar)}, oltre un anno prima della violazione del ${scrittaBreve(dv)}. Come affermato dalla Corte costituzionale con la sentenza n. 113 del 2015, i misuratori di velocità devono essere sottoposti a verifiche periodiche di funzionalità e taratura, in assenza delle quali la rilevazione non è attendibile.`,
        }));
      } else out.push(motivo({ ...tbase, esito: 'nessuno', spiegazione: `Taratura di ${g} giorni prima della violazione: entro l'anno.` }));
    } else if (r.taratura_indicata === false) {
      out.push(motivo({
        ...tbase, esito: 'vizio', forza: 'discusso', problema: 'taratura non indicata',
        spiegazione: 'Il verbale non cita la taratura. Spetta all\'amministrazione provare che l\'apparecchio era verificato: nel ricorso lo chiedi espressamente.',
        testoRicorso: 'Il verbale non dà conto della verifica periodica di taratura dell\'apparecchio. Chiedo che l\'amministrazione produca il certificato dell\'ultima taratura, necessaria per l\'attendibilità della rilevazione secondo la sentenza della Corte costituzionale n. 113 del 2015.',
      }));
    } else if (!tar) {
      out.push(motivo({ ...tbase, esito: 'dato', dato: 'taratura', spiegazione: 'Indica la data dell\'ultima taratura, se il verbale la riporta.' }));
    }

    if (r.vel_rilevata && r.vel_contestata) {
      const attesa = r.vel_rilevata - Math.max(5, r.vel_rilevata * 0.05);
      const vbase = { id: 'tolleranza', titolo: 'Tolleranza del 5%', fonti: [FONTI.art142] };
      if (r.vel_contestata > Math.ceil(attesa)) {
        out.push(motivo({
          ...vbase, esito: 'vizio', forza: 'forte', problema: 'tolleranza applicata male',
          spiegazione: `Togliendo la tolleranza (5%, almeno 5 km/h) dai ${r.vel_rilevata} km/h rilevati la velocità contestata doveva essere al massimo ${Math.floor(attesa)} km/h, non ${r.vel_contestata}. L'errore può cambiare la fascia della sanzione.`,
          testoRicorso: `La velocità contestata di ${r.vel_contestata} km/h non tiene conto correttamente della riduzione del 5%, con un minimo di 5 km/h, prevista dall'art. 345, comma 2, del regolamento di esecuzione del Codice della Strada (DPR 495/1992): dalla velocità rilevata di ${r.vel_rilevata} km/h risulta una velocità non superiore a ${Math.floor(attesa)} km/h. Chiedo che la sanzione sia rideterminata di conseguenza.`,
        }));
      } else out.push(motivo({ ...vbase, esito: 'nessuno', spiegazione: 'La tolleranza risulta applicata correttamente.' }));
    }

    const cbase = { id: 'segnalazione', titolo: 'Postazione segnalata', fonti: [FONTI.art142] };
    if (r.cartello === false || r.cartello === 'non_so') {
      out.push(motivo({
        ...cbase, esito: 'da_provare', problema: 'postazione forse non segnalata',
        spiegazione: 'La postazione deve essere segnalata e ben visibile; fuori dai centri abitati il cartello del limite deve essere almeno a 1 km dall\'apparecchio, in città a 200 o 75 metri (decreto MIT 11/4/2024). Va provato: fotografie del tratto o un accesso agli atti per avere il verbale di posizionamento.',
        testoRicorso: 'La postazione di controllo non era preventivamente segnalata e ben visibile come richiede l\'art. 142, comma 6-bis, del Codice della Strada, né rispettava le distanze minime dal segnale di limite stabilite dal decreto del Ministro delle infrastrutture e dei trasporti 11 aprile 2024, come risulta dalla documentazione fotografica allegata. Chiedo comunque che l\'amministrazione produca la documentazione sul posizionamento e sulla segnalazione della postazione.',
      }));
    } else if (r.cartello === true) out.push(motivo({ ...cbase, esito: 'nessuno', spiegazione: 'La postazione era segnalata.' }));

    if (r.stessa_ora === true && dv && dv >= RIFORMA_2024) {
      out.push(motivo({
        id: 'cumulo_velocita', titolo: 'Più multe per velocità nella stessa ora', problema: 'più multe nella stessa ora, ne spetta una', esito: 'vizio', forza: 'forte', fonti: [FONTI.art142],
        spiegazione: 'Dal 14 dicembre 2024 più eccessi di velocità dello stesso ente entro un\'ora si puniscono con una sola sanzione, la più grave aumentata di un terzo, se è più favorevole.',
        testoRicorso: 'Nell\'arco di un\'ora mi sono state contestate dallo stesso ente più violazioni dei limiti di velocità [indicare numeri e date dei verbali]. Chiedo l\'applicazione dell\'art. 142, comma 6-ter, del Codice della Strada: una sola sanzione, la più grave, aumentata fino a un terzo.',
      }));
    }
  }

  // 10. ZTL.
  if (r.tipo === 'ztl') {
    if (r.permesso === true) {
      out.push(motivo({
        id: 'permesso_ztl', titolo: 'Permesso valido', problema: 'avevi il permesso', esito: 'vizio', forza: 'forte', fonti: [FONTI.art7],
        spiegazione: 'Se avevi un\'autorizzazione valida per quel varco, la multa non è dovuta. Allega il permesso.',
        testoRicorso: 'Alla data della violazione ero titolare di un\'autorizzazione valida all\'accesso nella zona a traffico limitato [indicare tipo e numero del permesso], come risulta dal documento allegato.',
      }));
    }
    if (r.piu_accessi === true && dv && dv >= RIFORMA_2024) {
      out.push(motivo({
        id: 'cumulo_ztl', titolo: 'Più accessi nella stessa ZTL nello stesso giorno', problema: 'più accessi nello stesso giorno, ne spetta una', esito: 'vizio', forza: 'forte', fonti: [FONTI.art198],
        spiegazione: 'Dal 14 dicembre 2024 più accessi nella stessa ZTL o area pedonale nello stesso giorno valgono una sola multa.',
        testoRicorso: 'Nello stesso giorno mi sono state contestate più violazioni per l\'accesso alla medesima zona a traffico limitato [indicare numeri dei verbali]. Ai sensi dell\'art. 198, comma 2-bis, del Codice della Strada si applica una sola sanzione per giorno di calendario.',
      }));
    }
  }

  // 11. Strisce blu.
  if (r.tipo === 'strisce_blu' && r.ticket === true && r.minuti_pagati > 0 && r.minuti_oltre >= 0 && dv && dv >= RIFORMA_2024) {
    const q = r.minuti_oltre / r.minuti_pagati;
    const base = { id: 'strisce_blu', titolo: 'Ritardo sul ticket', fonti: [FONTI.art7] };
    if (q <= 0.1) {
      out.push(motivo({
        ...base, esito: 'vizio', forza: 'forte', problema: 'ritardo entro il 10% del tempo pagato',
        spiegazione: `Eri oltre l'orario di ${r.minuti_oltre} minuti su ${r.minuti_pagati} pagati: non più del 10%. Dal 14 dicembre 2024 in questo caso non c'è sanzione.`,
        testoRicorso: `Avevo regolarmente pagato la sosta per ${r.minuti_pagati} minuti e il tempo di sosta oltre l'orario pagato, pari a ${r.minuti_oltre} minuti, non supera il 10% del tempo pagato. Ai sensi dell'art. 7, commi 15 e 15.1, del Codice della Strada, come modificati dalla legge 177/2024, in questo caso la sanzione non si applica.`,
      }));
    } else if (q <= 0.5) {
      out.push(motivo({
        ...base, esito: 'vizio', forza: 'forte', problema: 'sanzione da dimezzare',
        spiegazione: `Eri oltre l'orario di ${r.minuti_oltre} minuti su ${r.minuti_pagati}: tra il 10% e il 50%. Spetta la sanzione ridotta della metà, più la tariffa: controlla che il verbale l'abbia ridotta.`,
        testoRicorso: `Avevo pagato la sosta per ${r.minuti_pagati} minuti e il tempo oltre l'orario pagato, pari a ${r.minuti_oltre} minuti, è compreso tra il 10% e il 50% del tempo pagato. Ai sensi dell'art. 7, commi 15 e 15.1, del Codice della Strada, come modificati dalla legge 177/2024, la sanzione va ridotta della metà: chiedo che sia rideterminata.`,
      }));
    } else out.push(motivo({ ...base, esito: 'nessuno', spiegazione: 'Il ritardo supera il 50% del tempo pagato: si applica la sanzione intera.' }));
  }

  return out;
}

function destinatari(r) {
  let prefetto = null;
  if (r.provincia === 'AO') {
    prefetto = { nome: 'Presidente della Regione Autonoma Valle d\'Aosta, struttura Sanzioni amministrative (funzioni prefettizie)', pec: 'sanzioni_amministrative@pec.regione.vda.it', indirizzo: 'Via Ollietti 3, 11100 Aosta' };
  } else if (r.provincia) {
    const p = PREFETTURE.find((x) => x.sigla === r.provincia);
    if (p) prefetto = { nome: p.nome, pec: p.pec, indirizzo: p.indirizzo };
  }
  return { prefetto, organo: r.organo || null, pecOrgano: r.pec_organo || null, comune: r.comune || null };
}

function costi(r) {
  if (!(r.importo > 0)) return null;
  const spese = r.spese > 0 && r.spese < r.importo ? r.spese : 0;
  const sanzione = r.importo - spese;
  const valore = r.importo;
  const cu = valore <= 1100 ? 43 : valore <= 5200 ? 98 : 237;
  const righe = [];
  if (r.sospensione !== true) righe.push({ id: 'sconto', strada: 'Pagare entro 5 giorni', costo: Math.round((sanzione * 0.7 + spese) * 100) / 100, nota: 'Sconto del 30% sulla sanzione. Dopo non puoi più fare ricorso.' });
  righe.push({ id: 'pagare', strada: 'Pagare entro 60 giorni', costo: r.importo, nota: 'L\'importo intero. Chiude la questione.' });
  righe.push({ id: 'prefetto', strada: 'Ricorso al Prefetto', costo: 0, seRespinto: Math.round((2 * sanzione + spese) * 100) / 100, nota: 'Gratis. Se viene respinto paghi almeno il doppio della sanzione minima, più le spese.' });
  righe.push({
    id: 'gdp', strada: 'Ricorso al Giudice di Pace', costo: cu + 27, seRespinto: r.massimo > sanzione ? r.massimo + spese + cu + 27 : null,
    nota: `${cu} € di contributo unificato e 27 € di anticipazioni, con pagoPA. Se viene respinto, il giudice fissa la sanzione tra il minimo e il massimo: nel caso peggiore il massimo, più le spese e il contributo, oltre a eventuali spese di lite.`,
  });
  if (r.massimo > sanzione) righe.push({ id: 'niente', strada: 'Non pagare e non fare ricorso', costo: Math.round((r.massimo / 2 + spese) * 100) / 100, nota: 'Il verbale diventa esecutivo per metà del massimo, più le spese, e arriva la cartella.' });
  return { sanzione, spese, cu, righe };
}

function scadenzeDi(r, s, oggi) {
  if (!s.dataNotifica) return [];
  const t = s.dataNotifica;
  const lista = [];
  const add = (id, d, titolo, testo, extra = {}) => lista.push({ id, data: iso(d), titolo, testo, scaduta: d < oggi, giorniMancanti: giorniTra(oggi, d), ...extra });
  if (r.sospensione !== true) add('sconto', scadenza(t, 5), 'Pagare con lo sconto del 30%', 'Solo se decidi di non fare ricorso.');
  const gdpLegale = scadenza(t, r.estero === true ? 60 : 30, { feriale: true, slitta: true, sabato: true });
  const gdpPrudente = scadenza(t, r.estero === true ? 60 : 30);
  add('gdp', gdpPrudente, 'Ricorso al Giudice di Pace', iso(gdpLegale) !== iso(gdpPrudente)
    ? `Termine prudente. Per legge, con la sospensione di agosto e i festivi, scadrebbe il ${scrittaBreve(gdpLegale)}: meglio non contarci.`
    : 'Il ricorso va depositato in cancelleria o spedito per posta entro questa data.', { legale: iso(gdpLegale) });
  add('prefetto', scadenza(t, 60), 'Ricorso al Prefetto', 'Nessuna proroga per festivi o agosto: considera questa data come ultima.');
  add('pagare', scadenza(t, 60), 'Pagare senza sconto', 'Se non paghi e non ricorri, dopo questa data la somma sale a metà del massimo.');
  if (r.punti > 0 && r.modo !== 'immediata') add('conducente', scadenza(t, 60), 'Comunicare chi guidava', 'Serve per togliere i punti alla persona giusta. Se fai ricorso, dichiaralo nel ricorso e nella risposta: per la Cassazione il ricorso pendente giustifica la mancata comunicazione, ma non tutti i giudici sono d\'accordo.');
  if (r.importo > 200) add('rate', scadenza(t, 30), 'Chiedere di pagare a rate', 'Possibile con multe oltre 200 € e reddito fino a 10.628,16 € (più 1.032,91 € per ogni familiare convivente). Chiedere le rate vuol dire rinunciare al ricorso.');
  return lista.sort((a, b) => a.data.localeCompare(b.data));
}

/**
 * Valuta una multa.
 * @param {object} r risposte del questionario
 * @param {object} [opz] { oggi: 'AAAA-MM-GG' }
 */
export function valuta(r, opz = {}) {
  const oggi = opz.oggi ? data(opz.oggi) : oggiCal();
  const notificato = Boolean(r.modo && r.modo !== 'immediata');
  const dataNotifica = r.modo === 'immediata' ? data(r.data_violazione) : data(r.data_notifica);
  const s = { notificato, dataNotifica };
  const dest = destinatari(r);
  const scad = scadenzeDi(r, s, oggi);
  const cost = costi(r);
  if (cost && scad.find((x) => x.id === 'sconto')?.scaduta) cost.righe = cost.righe.filter((x) => x.id !== 'sconto');
  const fonti = [FONTI.art202, FONTI.art203, FONTI.art204, FONTI.art204bis, FONTI.dlgs150, FONTI.dpr115];

  if (r.gia_pagato === true) {
    return { oggi: iso(oggi), verdetto: { tono: 'no', titolo: 'Hai già pagato: il ricorso non è più possibile', testo: 'Il pagamento chiude la contestazione (artt. 203 e 204-bis del Codice della Strada). Se pensi che la multa fosse sbagliata, puoi solo chiedere chiarimenti all\'ente.' }, motivi: [], scadenze: [], costi: null, destinatari: dest, fonti };
  }
  if (r.gia_ricorso === true) {
    return {
      oggi: iso(oggi), motivi: [], scadenze: [], costi: null, destinatari: dest, fonti,
      verdetto: { tono: 'neutro', titolo: 'Hai già presentato ricorso o chiesto le rate', testo: 'Il ricorso al Prefetto e quello al Giudice di Pace sono alternativi, e la richiesta di rate equivale a rinunciare al ricorso. Se hai fatto ricorso al Prefetto: deve decidere entro 180 giorni (210 se lo hai mandato direttamente a lui), altrimenti il ricorso si intende accolto. Se arriva un\'ordinanza-ingiunzione, puoi opporti al Giudice di Pace entro 30 giorni dalla notifica. Puoi controllare l\'esito su sana.interno.it.' },
    };
  }

  const m = motivi(r, s);
  const vizi = m.filter((x) => x.esito === 'vizio');
  const forti = vizi.filter((x) => x.forza === 'forte');
  const daProvare = m.filter((x) => x.esito === 'da_provare');
  const mancano = m.filter((x) => x.esito === 'dato');
  const pref = scad.find((x) => x.id === 'prefetto');
  const gdp = scad.find((x) => x.id === 'gdp');
  const prefAperto = pref ? !pref.scaduta : null;
  const gdpAperto = gdp ? !(oggi > data(gdp.legale)) : null;

  let strada = null;
  let perche = '';
  if (prefAperto === false && gdpAperto === false) {
    return {
      oggi: iso(oggi), motivi: m, scadenze: scad, costi: cost, destinatari: dest, fonti,
      verdetto: { tono: 'no', titolo: 'I termini per il ricorso sono scaduti', testo: 'Sono passati più di 60 giorni dalla notifica. Il verbale è diventato definitivo: se arriva una cartella, si può contestare solo per vizi propri della cartella o per prescrizione (5 anni dalla violazione).' },
    };
  }
  if (vizi.some((x) => x.preferisciGdp)) {
    strada = 'gdp';
    perche = 'Il tuo motivo riguarda l\'omologazione dell\'autovelox: le Prefetture seguono il Ministero dell\'Interno, che non lo riconosce, mentre la Cassazione sì. Davanti al Giudice di Pace hai più possibilità.';
  } else if (vizi.length) {
    strada = 'prefetto';
    perche = 'Il ricorso al Prefetto è gratuito e, se non decide entro 180 giorni, il ricorso si intende accolto. Il rischio è pagare almeno il doppio se viene respinto: con un motivo oggettivo e documentato è contenuto.';
  }
  if (strada === 'prefetto' && prefAperto === false) { strada = 'gdp'; perche = 'Il termine per il Prefetto è scaduto: resta il Giudice di Pace.'; }
  if (strada === 'gdp' && gdpAperto === false) { strada = 'prefetto'; perche = 'Il termine per il Giudice di Pace è scaduto: resta il Prefetto, che però tende a respingere questo motivo.'; }

  let verdetto;
  if (forti.length) {
    verdetto = { tono: 'si', titolo: forti.length === 1 ? 'Hai un motivo oggettivo per fare ricorso' : `Hai ${forti.length} motivi oggettivi per fare ricorso`, testo: `${maiuscola(forti.map((x) => x.problema || x.titolo).join('; '))}. ${perche}` };
  } else if (vizi.length || daProvare.length) {
    verdetto = { tono: 'forse', titolo: 'Hai un motivo, ma non è sicuro', testo: `${maiuscola([...vizi, ...daProvare].map((x) => x.problema || x.titolo).join('; '))}: ${vizi.length ? 'è un punto discusso' : 'va provato con documenti o foto'}. ${perche || 'Valuta bene i costi qui sotto prima di decidere.'}` };
  } else if (mancano.length) {
    verdetto = { tono: 'dato', titolo: 'Servono ancora alcune risposte', testo: `Per sapere se hai un motivo: ${mancano.map((x) => x.titolo.toLowerCase()).join(', ')}.` };
  } else if (r.tipo) {
    const sconto = scad.find((x) => x.id === 'sconto');
    verdetto = {
      tono: 'no', titolo: 'Non abbiamo trovato motivi oggettivi',
      testo: `Ricorrere senza un motivo è un rischio: se il Prefetto respinge, paghi almeno il doppio. ${sconto && !sconto.scaduta ? `Se paghi entro il ${scrittaBreve(data(sconto.data))} hai lo sconto del 30%.` : 'Conviene pagare entro 60 giorni.'} Se pensi che i fatti siano andati diversamente da come li descrive il verbale, parlane con un'associazione di consumatori.`,
    };
  } else {
    verdetto = { tono: 'dato', titolo: 'Inizia dal verbale', testo: 'Rispondi alle domande sul verbale: tipo di multa, date e modo in cui ti è arrivata.' };
  }
  verdetto.strada = strada;

  return { oggi: iso(oggi), verdetto, motivi: m, scadenze: scad, costi: cost, destinatari: dest, fonti };
}
