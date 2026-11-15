// Le domande di «Quanto risparmi in bolletta?». Il Comune si sceglie con una ricerca a parte
// (serve per la zona delle offerte e, per il gas, per l'ambito tariffario e le imposte).
// Tutti i dati restano nel browser: nell'indirizzo della pagina va al massimo il codice ISTAT del Comune.

export const SEZIONI = [
  { id: 'cosa', titolo: 'Cosa vuoi confrontare' },
  { id: 'dove', titolo: 'Dove arriva la fornitura', aiuto: 'Il Comune decide quali offerte valgono lì e, per il gas, le tariffe di rete e le imposte.' },
  { id: 'luce', titolo: 'La luce', aiuto: 'Prendi l\'ultima bolletta della luce: i dati sono nella prima o nella seconda pagina.' },
  { id: 'gas', titolo: 'Il gas', aiuto: 'Prendi l\'ultima bolletta del gas: i dati sono nella prima o nella seconda pagina.' },
  { id: 'oggi', titolo: 'Quanto paghi oggi', aiuto: 'Serve per dirti quanto risparmieresti. Se non lo sai, mostriamo comunque le offerte più convenienti.' },
  { id: 'preferenze', titolo: 'Che offerte vuoi vedere' },
];

const luce = (r) => r.fornitura === 'luce' || r.fornitura === 'entrambe';
const gas = (r) => r.fornitura === 'gas' || r.fornitura === 'entrambe';

export const DOMANDE = [
  { id: 'fornitura', sezione: 'cosa', tipo: 'scelta', etichetta: 'Quale bolletta?', opzioni: [['luce', 'Luce'], ['gas', 'Gas'], ['entrambe', 'Luce e gas']] },

  { id: 'ex_casmez', sezione: 'dove', tipo: 'si_no', nonSo: true, etichetta: 'Il tuo Comune era nei territori dell\'ex Cassa per il Mezzogiorno?',
    aiuto: 'Conta solo per l\'accisa sul gas. In questa provincia ne fa parte solo una zona: lo trovi nella bolletta del gas, alla voce delle imposte. Se non lo sai, ti mostriamo il margine.',
    visibile: (r) => gas(r) && r._inParte === true },

  { id: 'consumo_luce', sezione: 'luce', tipo: 'numero', etichetta: 'Consumo annuo di luce, in kWh', segnaposto: 'es. 2700', visibile: luce,
    aiuto: 'In bolletta si chiama «consumo annuo» (gli ultimi 12 mesi). Una famiglia di 3-4 persone consuma di solito 2.000-3.000 kWh.' },
  { id: 'potenza', sezione: 'luce', tipo: 'scelta', etichetta: 'Potenza impegnata', visibile: luce,
    aiuto: 'È scritta in bolletta, di solito vicino al codice POD. Nelle case è quasi sempre 3 kW.',
    opzioni: [['3', '3 kW'], ['4.5', '4,5 kW'], ['6', '6 kW'], ['altra', 'Un altro valore']] },
  { id: 'potenza_altra', sezione: 'luce', tipo: 'numero', passo: '0.5', etichetta: 'Potenza impegnata, in kW', segnaposto: 'es. 4', visibile: (r) => luce(r) && r.potenza === 'altra' },
  { id: 'residente', sezione: 'luce', tipo: 'si_no', etichetta: 'Hai la residenza in questa casa?', visibile: luce,
    aiuto: 'In bolletta c\'è scritto «cliente domestico residente» o «non residente». Cambia gli oneri e le accise.' },

  { id: 'consumo_gas', sezione: 'gas', tipo: 'numero', etichetta: 'Consumo annuo di gas, in Smc (metri cubi)', segnaposto: 'es. 1400', visibile: gas,
    aiuto: 'In bolletta si chiama «consumo annuo». Con il riscaldamento autonomo una famiglia consuma di solito 1.000-1.500 Smc.' },
  { id: 'riscaldamento', sezione: 'gas', tipo: 'si_no', etichetta: 'Usi il gas anche per riscaldare la casa?', visibile: gas,
    aiuto: 'Serve solo a distribuire il consumo nei mesi dell\'anno, come fa il Portale Offerte.' },

  { id: 'come_paghi', sezione: 'oggi', tipo: 'scelta', etichetta: 'Cosa trovi nella tua bolletta?', opzioni: [
    ['spesa', 'La spesa annua (in bolletta: «spesa annua sostenuta» o «spesa negli ultimi 12 mesi»)'],
    ['prezzo', 'Il prezzo dell\'energia o del gas e la quota fissa'],
    ['non_so', 'Non lo so'],
  ] },
  { id: 'spesa_luce', sezione: 'oggi', tipo: 'euro', etichetta: 'Spesa annua per la luce, in euro', visibile: (r) => luce(r) && r.come_paghi === 'spesa' },
  { id: 'prezzo_luce', sezione: 'oggi', tipo: 'numero', passo: '0.0001', etichetta: 'Prezzo della luce, in euro per kWh (IVA esclusa)', segnaposto: 'es. 0.1450', visibile: (r) => luce(r) && r.come_paghi === 'prezzo',
    aiuto: 'Nella scheda sintetica o nel dettaglio della bolletta: il prezzo della componente energia. Se hai un\'offerta variabile, somma l\'indice del mese e lo spread.' },
  { id: 'fissa_luce', sezione: 'oggi', tipo: 'euro', etichetta: 'Quota fissa di vendita della luce, in euro al mese', segnaposto: 'es. 10,00', visibile: (r) => luce(r) && r.come_paghi === 'prezzo' },
  { id: 'spesa_gas', sezione: 'oggi', tipo: 'euro', etichetta: 'Spesa annua per il gas, in euro', visibile: (r) => gas(r) && r.come_paghi === 'spesa' },
  { id: 'prezzo_gas', sezione: 'oggi', tipo: 'numero', passo: '0.0001', etichetta: 'Prezzo del gas, in euro per Smc (IVA esclusa)', segnaposto: 'es. 0.9800', visibile: (r) => gas(r) && r.come_paghi === 'prezzo' },
  { id: 'fissa_gas', sezione: 'oggi', tipo: 'euro', etichetta: 'Quota fissa di vendita del gas, in euro al mese', segnaposto: 'es. 10,00', visibile: (r) => gas(r) && r.come_paghi === 'prezzo' },

  { id: 'tipo_prezzo', sezione: 'preferenze', tipo: 'scelta', etichetta: 'Che prezzo preferisci?', opzioni: [['tutte', 'Fammi vedere tutte'], ['F', 'Fisso: so già quanto pago'], ['V', 'Variabile: segue il mercato']] },
];

/** Dalle risposte al profilo di una fornitura, per la funzione confronta(). */
export function profiloDa(r, fornitura, comune) {
  const l = fornitura === 'luce';
  const potenza = r.potenza === 'altra' ? Number(r.potenza_altra) : r.potenza ? Number(r.potenza) : undefined;
  const attuale = {};
  if (r.come_paghi === 'spesa' && r[`spesa_${fornitura}`] > 0) attuale.spesa = r[`spesa_${fornitura}`];
  if (r.come_paghi === 'prezzo' && r[`prezzo_${fornitura}`] > 0) { attuale.prezzo = r[`prezzo_${fornitura}`]; attuale.quotaFissa = r[`fissa_${fornitura}`] || 0; }
  return {
    fornitura,
    consumo: l ? r.consumo_luce : r.consumo_gas,
    potenza: l ? potenza : undefined,
    residente: l ? (typeof r.residente === 'boolean' ? r.residente : undefined) : undefined,
    riscaldamento: l ? undefined : r.riscaldamento !== false,
    regione: comune?.regione,
    comune: comune?.istat,
    exCasMez: r.ex_casmez === true ? true : r.ex_casmez === false ? false : undefined,
    attuale,
  };
}
