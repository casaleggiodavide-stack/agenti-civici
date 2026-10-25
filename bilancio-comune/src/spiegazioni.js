// Il bilancio del mio Comune: nomi chiari delle voci, controlli sui conti, fonti.
// Le regole sono scritte qui, non inventate da un modello: ogni controllo cita la sua norma.

export const VERIFICATO = '2026-10-25';

export const FONTI = {
  bdap: { titolo: 'OpenBDAP, Ragioneria Generale dello Stato: rendiconti degli enti territoriali', url: 'https://openbdap.rgs.mef.gov.it/it/FET/Analizza' },
  avanzi: { titolo: 'OpenBDAP, come funzionano gli avanzi degli enti territoriali', url: 'https://openbdap.rgs.mef.gov.it/it/Home/AvanziSpendibiliEntiTerritoriali' },
  istat: { titolo: 'ISTAT, popolazione residente al 1° gennaio 2025', url: 'https://demo.istat.it/app/?i=POS&l=it' },
  missioni: { titolo: 'D.lgs. 118/2011, art. 14: missioni e programmi della spesa', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2011-06-23;118~art14' },
  risultato: { titolo: 'TUEL, art. 187: composizione del risultato di amministrazione', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2000-08-18;267~art187' },
  disavanzo: { titolo: 'TUEL, art. 188: disavanzo di amministrazione', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2000-08-18;267~art188' },
  deficitari: { titolo: 'TUEL, art. 242: enti strutturalmente deficitari', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2000-08-18;267~art242' },
  fcde: { titolo: 'TUEL, art. 167: fondo crediti di dubbia esigibilità', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2000-08-18;267~art167' },
  pagamenti: { titolo: 'D.lgs. 33/2013, art. 33: indicatore di tempestività dei pagamenti', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2013-03-14;33~art33' },
  termini: { titolo: 'D.lgs. 231/2002, art. 4: pagamenti entro 30 giorni (60 in casi particolari)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2002-10-09;231~art4' },
  impegno: { titolo: 'TUEL, art. 183: impegno di spesa', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2000-08-18;267~art183' },
  accertamento: { titolo: 'TUEL, art. 179: accertamento delle entrate', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2000-08-18;267~art179' },
  riequilibrio: { titolo: 'TUEL, art. 243-bis: procedura di riequilibrio finanziario', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2000-08-18;267~art243bis' },
  dissesto: { titolo: 'TUEL, art. 244: dissesto finanziario', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2000-08-18;267~art244' },
  elenco_dissesti: { titolo: 'Ministero dell\'Interno, circolare DAIT n. 52 del 26 maggio 2026: enti dissestati, deficitari e in riequilibrio', url: 'https://dait.interno.gov.it/finanza-locale/circolari/circolare-dait-n52-del-26-maggio-2026' },
};

/** Le missioni della spesa, con un nome che si capisce e cosa ci sta dentro. */
export const MISSIONI = {
  '01': ['Uffici e amministrazione', 'Sindaco e consiglio, segreteria, tributi, anagrafe, ufficio tecnico, personale degli uffici'],
  '02': ['Giustizia', 'Uffici giudiziari e case circondariali, dove il Comune ne ha'],
  '03': ['Polizia locale e sicurezza', 'Vigili urbani, videosorveglianza, sicurezza urbana'],
  '04': ['Scuola', 'Edifici scolastici, mense, trasporto scolastico, diritto allo studio'],
  '05': ['Cultura', 'Biblioteche, musei, teatri, eventi culturali, beni storici'],
  '06': ['Sport e giovani', 'Impianti sportivi, palestre, politiche per i giovani'],
  '07': ['Turismo', 'Promozione turistica, uffici informazioni'],
  '08': ['Urbanistica e case', 'Piano regolatore, edilizia, case popolari'],
  '09': ['Ambiente, rifiuti e acqua', 'Raccolta dei rifiuti, verde pubblico, acquedotto e fognature, difesa del suolo'],
  '10': ['Strade e trasporti', 'Manutenzione delle strade, illuminazione, trasporto pubblico locale'],
  '11': ['Protezione civile', 'Interventi di soccorso e prevenzione delle calamità'],
  '12': ['Servizi sociali e famiglie', 'Asili nido, anziani, disabilità, povertà, casa, cimiteri'],
  '13': ['Sanità', 'Interventi sanitari a carico del Comune (di solito pochi)'],
  '14': ['Commercio e sviluppo economico', 'Mercati, sostegno alle imprese, sportello unico'],
  '15': ['Lavoro e formazione', 'Politiche per il lavoro'],
  '16': ['Agricoltura e pesca', 'Sostegno ad agricoltura, caccia e pesca'],
  '17': ['Energia', 'Fonti rinnovabili, efficienza energetica'],
  '18': ['Rapporti con altri enti', 'Trasferimenti ad altri enti locali'],
  '19': ['Relazioni internazionali', 'Cooperazione e gemellaggi'],
  '20': ['Fondi e accantonamenti', 'Riserve obbligatorie: nel rendiconto di solito non hanno spese'],
  '50': ['Debiti: interessi e rate dei mutui', 'Interessi e restituzione del capitale dei prestiti'],
};

export const ENTRATE = {
  '01': ['Tasse e tributi locali', 'IMU, TARI, addizionale IRPEF, imposta di soggiorno e fondo di solidarietà comunale'],
  '02': ['Soldi da Stato, Regione e Unione europea', 'Trasferimenti per la spesa corrente'],
  '03': ['Entrate proprie non fiscali', 'Multe, rette dei servizi, affitti, canoni, dividendi delle società partecipate'],
  '04': ['Entrate per investimenti', 'Contributi per opere pubbliche, vendite di immobili, oneri di urbanizzazione'],
  '05': ['Rientro di prestiti e partecipazioni', 'Riscossione di crediti e vendita di quote'],
  '06': ['Nuovi prestiti e mutui', 'Debiti nuovi contratti nell\'anno'],
};

export const GLOSSARIO = [
  ['Impegnato', 'Spesa che il Comune si è obbligato a fare nell\'anno: c\'è un contratto o un atto, sa quanto, a chi e quando. Non vuol dire che abbia già pagato.', FONTI.impegno],
  ['Accertato', 'Entrata che il Comune ha diritto di incassare nell\'anno: sa chi deve pagare, quanto ed entro quando. Non vuol dire che l\'abbia incassata.', FONTI.accertamento],
  ['Risultato di amministrazione', 'La fotografia di fine anno: soldi in cassa, più crediti da incassare, meno debiti da pagare e risorse già destinate agli anni successivi. Si divide in parte accantonata, vincolata, destinata agli investimenti e libera.', FONTI.risultato],
  ['Fondo crediti di dubbia esigibilità', 'Riserva obbligatoria per i crediti che probabilmente non verranno mai incassati, come multe e tributi non pagati.', FONTI.fcde],
];

/** Programmi mostrati nella sezione «Servizi che usi» (gli stessi del preparatore dei dati). */
export const SERVIZI = ['1201', '0406', '0903', '1005', '1002', '0301', '0402', '0401', '1203', '1202', '1204', '0502', '0601', '0902', '0904', '1206', '1209'];

const r1 = (n) => Math.round(n * 10) / 10;
const eu = (n) => `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' }).format(Math.round(n))} €`;

/**
 * Controlli sullo stato dei conti. Ogni controllo ha un tono:
 * «si» (tutto bene), «forse» (da guardare), «no» (segnale di difficoltà), «dato» (manca il dato).
 */
export function controlli(s, simili) {
  const out = [];
  const pdi = s.pdi || {};
  const ris = s.risultato || {};
  const sim = simili || {};

  if (s.deficitario === true) {
    out.push({ id: 'deficitario', tono: 'no', titolo: 'Il Comune risulta strutturalmente deficitario',
      testo: `Nel rendiconto ${s.anno} almeno metà dei parametri di allarme fissati dalla legge sono in rosso${s.parametri?.length ? `: ${s.parametri.join('; ')}` : ''}. Comporta controlli centrali sulle assunzioni e sulle tariffe dei servizi.`,
      fonte: FONTI.deficitari });
  } else if (s.deficitario === false) {
    out.push({ id: 'deficitario', tono: s.parametri?.length ? 'forse' : 'si', titolo: s.parametri?.length ? `Non deficitario, ma con ${s.parametri.length === 1 ? 'un parametro' : s.parametri.length + ' parametri'} di allarme in rosso` : 'Nessun parametro di allarme in rosso',
      testo: s.parametri?.length ? `Il Comune non è considerato deficitario, che scatta con almeno metà dei parametri in rosso. Quelli in rosso: ${s.parametri.join('; ')}.` : `Nel rendiconto ${s.anno} nessuno dei parametri che la legge usa per riconoscere un Comune in difficoltà è in rosso.`,
      fonte: FONTI.deficitari });
  } else {
    out.push({ id: 'deficitario', tono: 'dato', titolo: 'Parametri di allarme non trasmessi', testo: 'Il Comune non ha trasmesso la tabella dei parametri di deficitarietà alla banca dati.', fonte: FONTI.deficitari });
  }

  if (ris.libera !== undefined) {
    const pc = s.pop ? ris.libera / s.pop : null;
    if (ris.libera < 0) {
      out.push({ id: 'disavanzo', tono: 'no', titolo: `Disavanzo di ${euroGrandi(-ris.libera)}${pc ? ` (${eu(-pc)} per abitante)` : ''}`,
        testo: 'Tolte le somme già accantonate, vincolate e destinate agli investimenti, il risultato di fine anno è negativo. Il Comune deve ripianare il disavanzo nei bilanci dei prossimi anni, con meno spesa o più entrate.',
        fonte: FONTI.disavanzo });
    } else {
      out.push({ id: 'disavanzo', tono: 'si', titolo: `Avanzo libero di ${euroGrandi(ris.libera)}${pc ? ` (${eu(pc)} per abitante)` : ''}`,
        testo: `La parte libera del risultato di amministrazione è positiva: soldi che il Comune può usare, con le regole del caso, per spese non ricorrenti o investimenti.${sim.libera_pc ? ` Nei Comuni della stessa fascia la mediana è ${eu(sim.libera_pc)} per abitante.` : ''}`,
        fonte: FONTI.avanzi });
    }
  }

  if (pdi.tempestivita !== undefined) {
    const g = pdi.tempestivita;
    out.push({ id: 'pagamenti', tono: g <= 0 ? 'si' : g <= 30 ? 'forse' : 'no',
      titolo: g <= 0 ? `Paga i fornitori in tempo${g < 0 ? ` (in media ${Math.round(-g)} giorni prima della scadenza)` : ''}` : `Paga i fornitori in ritardo: in media ${Math.round(g)} giorni dopo la scadenza`,
      testo: 'È l\'indicatore ufficiale di tempestività dei pagamenti: i giorni medi tra la scadenza delle fatture e il pagamento, pesati sull\'importo. Sotto zero vuol dire che paga prima della scadenza, che per legge è di norma 30 giorni.',
      fonte: FONTI.pagamenti });
  }

  if (s.riscossione !== null && s.riscossione !== undefined) {
    const m = sim.riscossione;
    out.push({ id: 'riscossione', tono: s.riscossione >= 75 ? 'si' : s.riscossione >= 47 ? 'forse' : 'no',
      titolo: `Incassa ${Math.round(s.riscossione)} euro ogni 100 di tributi ed entrate proprie dell'anno`,
      testo: `È la parte di tributi, multe e rette che il Comune ha incassato nello stesso anno in cui le ha accertate.${m ? ` Nei Comuni simili la mediana è ${Math.round(m)}.` : ''} Una riscossione bassa vuol dire molte entrate solo sulla carta, che il Comune deve coprire con un fondo di riserva.`,
      fonte: FONTI.fcde });
  }

  if (pdi.debito_pc !== undefined && s.pop) {
    const m = sim.pdi?.debito_pc;
    out.push({ id: 'debito', tono: m && pdi.debito_pc > 2 * m ? 'forse' : 'si',
      titolo: `Debito per mutui e prestiti: ${eu(pdi.debito_pc)} per abitante`,
      testo: `È il debito di finanziamento a fine anno diviso per i residenti.${m ? ` Nei Comuni della stessa fascia la mediana è ${Math.round(m)} €.` : ''} Avere debiti per costruire scuole o strade è normale; conta che le rate restino sostenibili.`,
      fonte: FONTI.bdap });
  }

  if (pdi.rigidita !== undefined) {
    out.push({ id: 'rigidita', tono: pdi.rigidita > 48 ? 'no' : pdi.rigidita > 40 ? 'forse' : 'si',
      titolo: `${Math.round(pdi.rigidita)} euro ogni 100 di entrate correnti vanno in spese fisse`,
      testo: 'Personale, rate dei mutui e ripiano del disavanzo: spese che il Comune non può ridurre da un anno all\'altro. Sopra 48 è uno dei parametri di allarme della legge.',
      fonte: FONTI.deficitari });
  }
  return out;
}

/** Ripartizione della spesa per missione, ordinata, con la quota su 100 euro. */
export function ripartizione(s, simili) {
  const tot = s.spesa_tot || 0;
  const righe = Object.entries(s.spesa || {})
    .filter(([m, [imp]]) => imp > 0 && MISSIONI[m] && (!s.spesa_tot || imp / s.spesa_tot >= 0.0005))
    .map(([m, [imp, pag]]) => ({
      missione: m, nome: MISSIONI[m][0], dentro: MISSIONI[m][1], impegnato: imp, pagato: pag,
      su100: tot ? r1((100 * imp) / tot) : 0,
      pc: s.pop ? imp / s.pop : null,
      pcSimili: simili?.missioni_pc?.[m] ?? null,
    }))
    .sort((a, b) => b.impegnato - a.impegnato);
  return { tot, righe };
}

export function entrate(s) {
  const tot = Object.values(s.entrate || {}).reduce((a, b) => a + b, 0);
  return {
    tot,
    righe: Object.entries(s.entrate || {}).filter(([t]) => ENTRATE[t]).map(([t, v]) => ({ titolo: t, nome: ENTRATE[t][0], dentro: ENTRATE[t][1], accertato: v, su100: tot ? r1((100 * v) / tot) : 0, pc: s.pop ? v / s.pop : null })).sort((a, b) => b.accertato - a.accertato),
  };
}

export function servizi(s, simili, nomi) {
  return SERVIZI.filter((p) => s.programmi?.[p]).map((p) => ({
    programma: p, nome: nomi?.[p] || p, impegnato: s.programmi[p], pc: s.pop ? s.programmi[p] / s.pop : null, pcSimili: simili?.programmi_pc?.[p] ?? null,
  }));
}

function euroGrandi(n) {
  const a = Math.abs(n);
  const f = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
  if (a >= 1e6) return `${f.format(a / 1e6)} milioni di euro`;
  if (a >= 1e5) return `${Math.round(a / 1000)} mila euro`;
  return `${new Intl.NumberFormat('it-IT', { useGrouping: 'always' }).format(Math.round(a))} euro`;
}
