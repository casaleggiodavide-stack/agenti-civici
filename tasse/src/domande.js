// Le domande di «Dove finiscono le mie tasse». Il Comune si sceglie con una ricerca a parte
// (elenco dei Comuni con il codice ISTAT); qui ci sono le altre.

export const SEZIONI = [
  { id: 'comune', titolo: 'Il tuo Comune', aiuto: 'Quello in cui avevi la residenza (il domicilio fiscale) al 1° gennaio: decide le addizionali regionale e comunale.' },
  { id: 'tasse', titolo: 'Le tue tasse' },
];

const stima = (r) => r.modo !== 'dichiarazione';
const dichiarazione = (r) => r.modo === 'dichiarazione';

export const DOMANDE = [
  {
    id: 'modo', sezione: 'tasse', tipo: 'scelta', etichetta: 'Come vuoi partire?',
    opzioni: [['stima', 'Dal reddito: stimiamo noi IRPEF e addizionali'], ['dichiarazione', 'Dalla Certificazione Unica o dal 730: scrivo le cifre']],
  },
  {
    id: 'tipo', sezione: 'tasse', tipo: 'scelta', etichetta: 'Che reddito hai?', visibile: stima,
    aiuto: 'Il calcolo vale per chi ha un solo tipo di reddito per tutto l\'anno.',
    opzioni: [['dipendente', 'Lavoro dipendente'], ['pensionato', 'Pensione'], ['autonomo', 'Lavoro autonomo o d\'impresa']],
  },
  {
    id: 'forfettario', sezione: 'tasse', tipo: 'scelta', etichetta: 'Sei nel regime forfettario (partita IVA con imposta sostitutiva)?', visibile: (r) => stima(r) && r.tipo === 'autonomo',
    opzioni: [['0', 'No, regime ordinario'], ['15', 'Sì, al 15%'], ['5', 'Sì, al 5% (primi cinque anni di attività)']],
  },
  {
    id: 'reddito', sezione: 'tasse', tipo: 'euro', etichetta: 'Reddito imponibile dell\'anno', segnaposto: 'es. 28.000',
    aiuto: 'È il reddito su cui si calcola l\'IRPEF. Dipendente: lo stipendio lordo meno i contributi (nella Certificazione Unica, la voce dei redditi di lavoro dipendente). Pensione: la pensione lorda. Autonomo: ricavi meno costi e contributi; nel forfettario, il reddito forfettario.',
    visibile: stima,
  },
  { id: 'irpef', sezione: 'tasse', tipo: 'euro', etichetta: 'IRPEF netta (o ritenute IRPEF)', aiuto: 'Nella Certificazione Unica è la voce «Ritenute IRPEF»; nel 730 l\'«IRPEF netta» del prospetto di liquidazione.', segnaposto: 'es. 3.465,00', visibile: dichiarazione },
  { id: 'add_reg', sezione: 'tasse', tipo: 'euro', etichetta: 'Addizionale regionale', aiuto: 'Nella Certificazione Unica è la voce «Addizionale regionale all\'IRPEF». Se la lasci vuota e scrivi il reddito, la stimiamo noi.', visibile: dichiarazione },
  { id: 'add_com', sezione: 'tasse', tipo: 'euro', etichetta: 'Addizionale comunale', aiuto: 'Nella Certificazione Unica, la voce «Addizionale comunale all\'IRPEF» dell\'anno (saldo più acconto, senza l\'acconto dell\'anno dopo). Se la lasci vuota e scrivi il reddito, la stimiamo noi.', visibile: dichiarazione },
  { id: 'reddito_d', sezione: 'tasse', tipo: 'euro', etichetta: 'Reddito imponibile, se vuoi stimare le addizionali che mancano', visibile: (r) => dichiarazione(r) && (r.add_reg === undefined || r.add_com === undefined) },
  {
    id: 'aliquota_comunale', sezione: 'tasse', tipo: 'numero', passo: '0.01', etichetta: 'Aliquota dell\'addizionale comunale, in percentuale',
    aiuto: 'Per il tuo Comune le aliquote pubblicate non si leggono in automatico: la trovi nella delibera, sul sito del Dipartimento delle Finanze (link qui accanto). Esempio: 0,8.',
    visibile: (r) => r._serve_aliquota === true,
  },
];

/** Dalle risposte del questionario al contribuente di doveVanno. */
export function contribuente(r) {
  if (r.modo === 'dichiarazione') {
    return { modo: 'dichiarazione', irpef: r.irpef, addRegionale: r.add_reg, addComunale: r.add_com, reddito: r.reddito_d, aliquotaComunale: r.aliquota_comunale };
  }
  return { modo: 'stima', tipo: r.tipo, reddito: r.reddito, forfettario: r.tipo === 'autonomo' ? Number(r.forfettario || 0) : 0, aliquotaComunale: r.aliquota_comunale };
}
