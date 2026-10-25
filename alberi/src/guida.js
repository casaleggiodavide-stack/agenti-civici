// Alberi per il futuro: come si organizza, in qualsiasi anno. Lo spazio dal Comune, gli
// alberi dai vivai pubblici, la messa a dimora e la cura. Ogni regola con la sua fonte.

export const VERIFICATO = '2026-10-25';
const R = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:';

export const FONTI = {
  l10_1: { titolo: 'L. 10/2013, art. 1: il 21 novembre Giornata nazionale degli alberi', url: `${R}stato:legge:2013-01-14;10~art1` },
  l10_6: { titolo: 'L. 10/2013, art. 6: Regioni e Comuni promuovono il verde urbano', url: `${R}stato:legge:2013-01-14;10~art6` },
  l113_1: { titolo: 'L. 113/1992, art. 1: un albero per ogni nuovo nato e piantagioni a carico dei cittadini', url: `${R}stato:legge:1992-01-29;113~art1` },
  l113_2: { titolo: 'L. 113/1992, art. 2: le Regioni forniscono le piante ai Comuni', url: `${R}stato:legge:1992-01-29;113~art2` },
  l113_3bis: { titolo: 'L. 113/1992, art. 3-bis: censimento degli alberi e bilancio arboreo del sindaco', url: `${R}stato:legge:1992-01-29;113~art3bis` },
  cost118: { titolo: 'Costituzione, art. 118: i cittadini che si attivano per l\'interesse generale', url: `${R}stato:costituzione:1947-12-27~art118` },
  labsus: { titolo: 'Labsus: il patto di collaborazione e il regolamento sui beni comuni', url: 'https://www.labsus.org/glossario-dellamministrazione-condivisa/' },
  cc892: { titolo: 'Codice civile, art. 892: distanze degli alberi dal confine', url: `${R}stato:regio.decreto:1942-03-16;262~art892` },
  dpr495: { titolo: 'DPR 495/1992, art. 26: alberi lungo le strade fuori dai centri abitati', url: `${R}presidente.repubblica:decreto:1992-12-16;495~art26` },
  dlgs117: { titolo: 'D.lgs. 117/2017, art. 18: assicurazione dei volontari degli enti del Terzo settore', url: `${R}stato:decreto.legislativo:2017-07-03;117~art18` },
  dlgs230: { titolo: 'D.lgs. 230/2017, art. 6: divieti per le specie esotiche invasive', url: `${R}stato:decreto.legislativo:2017-12-15;230~art6` },
  ailanto: { titolo: 'ISPRA: l\'ailanto, specie invasiva', url: 'https://specieinvasive.isprambiente.it/specie-di-rilevanza-unionale/specie-di-rilevanza-unionale-2/12-ias-ita/106-ailanthus-altissima' },
  abaco: { titolo: 'Regione Emilia-Romagna: l\'abaco degli alberi per la città', url: 'https://ambiente.regione.emilia-romagna.it/it/radiciperilfuturoer/alberi-per-la-citta' },
  lazio: { titolo: 'Regione Lazio: linee guida per la forestazione urbana', url: 'https://progetti.regione.lazio.it/ossigeno/linee-guida-per-la-forestazione-urbana-e-periurbana-nella-regione-lazio/' },
  carabinieri: { titolo: 'Carabinieri: Centro nazionale per la biodiversità forestale di Pieve Santo Stefano', url: 'https://www.carabinieri.it/chi-siamo/oggi/organizzazione/tutela-forestale-ambientale-e-agroalimentare/comando-tutela-biodiversita\'-e-parchi/utcb-e-le-130-riserve-naturali/utb-di-pieve-santo-stefano/centro-nazionale-carabinieri-biodiversit%C3%A0-di-pieve-santo-stefano' },
};

/** Il canale nazionale: i Carabinieri per la biodiversità, per le scuole. */
export const NAZIONALE = {
  nome: 'Per le scuole: i Carabinieri per la biodiversità',
  come: 'Con il programma «Un albero per il futuro» i centri dei Carabinieri per la biodiversità danno piantine di specie autoctone alle scuole che aderiscono, che poi le curano e le geolocalizzano. Se nel gruppo c\'è una scuola, è la strada più semplice: si chiede a unalberoperilfuturo@carabinieri.it. Per cittadini e gruppi non c\'è un canale diretto.',
  email: 'unalberoperilfuturo@carabinieri.it',
  fonte: 'Carabinieri, centro di Pieve Santo Stefano',
  url: FONTI.carabinieri.url,
};

const NESSUNO = 'Non abbiamo trovato una procedura ufficiale per avere piantine dal vivaio regionale. Chiedi al Comune: per legge la Regione fornisce le piante ai Comuni per «un albero per ogni nuovo nato», e l\'ufficio verde di solito sa a chi rivolgersi.';

/** I vivai pubblici per Regione. `gratis` dice a chi le piantine sono gratuite. */
export const VIVAI = {
  Piemonte: { nome: 'Regione Piemonte, vivai forestali di Chiusa di Pesio, Albano Vercellese e Fenestrelle', come: 'Gratis fino a 50 piantine (sotto i 70 cm) per progetti di educazione ambientale di enti pubblici ed enti del Terzo settore, e ai Comuni e alle scuole che aderiscono alla Giornata degli alberi. Per gli altri a pagamento. La domanda si fa online con il servizio ViFo.', quando: 'domande entro il 15 settembre per la consegna d\'autunno, entro il 15 febbraio per la primavera', email: 'vivai@regione.piemonte.it', url: 'https://www.regione.piemonte.it/web/temi/ambiente-territorio/foreste/vivai-operai-forestali/assegnazione-onerosagratuita-piantine', fonte: 'Regione Piemonte, assegnazione delle piantine', soloEnti: true },
  "Valle d'Aosta": { nome: 'Vivaio forestale regionale Abbé Henry, Quart', come: 'Piantine gratis agli enti pubblici per le aree verdi pubbliche (modulo «Forestazione urbana»); il trasporto è a carico di chi le chiede. Cittadini e gruppi passano dal Comune.', quando: null, email: 'risorse_naturali@pec.regione.vda.it', url: 'https://www.regione.vda.it/urp/modulistica_i.aspx', fonte: 'Regione Valle d\'Aosta, modulistica', soloEnti: true },
  Lombardia: { nome: 'ERSAF, vivaio forestale regionale di Curno (Bergamo)', come: 'Gratis una richiesta l\'anno, fino a 50 piantine di un anno e 10 specie, per feste degli alberi e iniziative senza scopo di lucro su terreni pubblici: a enti pubblici, scuole e associazioni senza fini di lucro, dalla loro casella istituzionale. Si scrive insieme a vivaio.forestale@ersaf.lombardia.it ed ersaf@pec.regione.lombardia.it.', quando: 'almeno due settimane prima del ritiro; centri di distribuzione in autunno e in primavera', email: 'vivaio.forestale@ersaf.lombardia.it', url: 'https://www.ersaf.lombardia.it/ottenere-assegnazioni-a-titolo-gratuito/', fonte: 'ERSAF, assegnazioni gratuite', soloEnti: true },
  'Provincia autonoma di Bolzano': { nome: 'Servizio forestale provinciale, cinque vivai forestali', come: 'Giovani piante forestali autoctone. Non si ordina al vivaio: si passa dall\'ispettorato o dalla stazione forestale della zona.', quando: null, email: 'forstverwaltung@provinz.bz.it', url: 'https://forstdienst.provinz.bz.it/de/wald-holz/pflanzensortimente', fonte: 'Provincia di Bolzano, assortimento delle piante (in tedesco)' },
  'Provincia autonoma di Trento': { nome: 'Agenzia provinciale delle foreste demaniali, vivai di Casteller e San Giorgio', come: 'Piante forestali su richiesta motivata a Comuni, scuole ed enti o associazioni con finalità pubbliche, indicando dove, perché, specie e quantità. La gratuità non è indicata.', quando: 'da concordare dopo il primo contatto', email: 'agenzia.forestedemaniali@pec.provincia.tn.it', url: 'https://www.provincia.tn.it/News/Approfondimenti/Attivita-vivaistica-e-del-verde-fuori-foresta', fonte: 'Provincia di Trento, attività vivaistica', soloEnti: true },
  Veneto: { nome: 'Veneto Agricoltura, centro vivaistico di Montecchio Precalcino', come: 'Con la campagna «Alberi per la Pianura Veneta» alberi e arbusti autoctoni gratis: aderisce il Comune, poi i cittadini prenotano dal proprio Comune. Vale per i Comuni della pianura.', quando: 'adesione del Comune entro fine settembre; distribuzione in ottobre-novembre e febbraio-marzo', email: 'info@venetoagricoltura.org', url: 'https://www.regione.veneto.it/article-detail?articleGroupId=10701&articleId=14271198', fonte: 'Regione Veneto, Alberi per la Pianura Veneta', nota: 'Controlla ogni anno che la campagna sia confermata.', soloEnti: true },
  'Friuli Venezia Giulia': { nome: 'Regione FVG, vivai forestali di Tarcento e Maniago', come: 'Piantine forestali gratis agli enti pubblici, a pagamento ai privati, anche per la didattica ambientale. Si manda il modulo al vivaio.', quando: null, email: 'vivaioforestale.pascul@regione.fvg.it', url: 'https://www.regione.fvg.it/rafvg/cms/RAFVG/economia-imprese/agricoltura-foreste/foreste/FOGLIA10/', fonte: 'Regione FVG, vivai forestali', soloEnti: true },
  Liguria: { nome: 'Nessun programma verificato', come: `${NESSUNO} I vivai regionali risultano affidati in gestione a imprese.`, quando: null, email: null, url: null },
  'Emilia-Romagna': { nome: 'Regione Emilia-Romagna, vivai regionali e convenzionati di «Mettiamo radici per il futuro»', come: 'Alberi e arbusti autoctoni gratis anche ai cittadini, oltre che a enti pubblici e associazioni senza scopo di lucro con sede in regione, da piantare in regione su terreni di proprietà o a disposizione. Si va al vivaio della propria provincia o a quello convenzionato più vicino con la dichiarazione d\'impegno.', quando: 'distribuzione da ottobre a primavera (date esatte sulla pagina della campagna)', email: 'mettiamoradici@regione.emilia-romagna.it', url: 'https://ambiente.regione.emilia-romagna.it/it/parchi-natura2000/foreste/distribuzione-di-piantine-dei-vivai-regionali', fonte: 'Regione Emilia-Romagna, distribuzione delle piantine', nota: 'Escluse le piantine per interventi già pagati con soldi pubblici o per compensazioni.' },
  Toscana: { nome: 'Nessun programma verificato', come: `${NESSUNO} La legge forestale toscana prevede la distribuzione gratuita di piante per i rimboschimenti volontari: chiedi al Settore forestale della Regione o all'Unione dei Comuni della tua zona.`, quando: null, email: null, url: null },
  Umbria: { nome: 'Nessun programma verificato', come: `${NESSUNO} In Umbria se ne occupa l'Agenzia forestale regionale.`, quando: null, email: null, url: null },
  Marche: { nome: 'AMAP, vivai forestali di Sant\'Angelo in Vado, Senigallia, Pollenza e Amandola', come: 'Piante forestali di provenienza locale, anche per il verde urbano, a pagamento secondo il listino: non risulta una cessione gratuita. Si manda il modulo del vivaio per email.', quando: 'da autunno a primavera', email: 'vivai@amap.marche.it', url: 'https://amap.marche.it/servizi/vivai-forestali', fonte: 'AMAP, vivai forestali' },
  Lazio: { nome: 'Regione Lazio, progetto Ossigeno', come: 'Alberi, arbusti e messa a dimora a carico della Regione, ma solo con gli avvisi periodici, per enti pubblici, enti del Terzo settore e chi gestisce spazi aperti al pubblico. La cura resta a chi riceve gli alberi.', quando: 'solo quando c\'è un avviso aperto', email: 'ossigeno@regione.lazio.it', url: 'https://progetti.regione.lazio.it/ossigeno/progetto-ossigeno-via-al-quarto-avviso/', fonte: 'Regione Lazio, progetto Ossigeno', soloEnti: true },
  Abruzzo: { nome: 'Regione Abruzzo, vivai forestali di Casoli, Mammarella e Roccaraso', come: 'Per legge i vivai danno gratis ai Comuni le piante per «un albero per ogni nuovo nato» e per la festa dell\'albero; possono chiedere anche cittadini, associazioni e imprese con il modello di concessione.', quando: 'risposta entro 30 giorni lavorativi', email: 'dpd021@regione.abruzzo.it', url: 'https://trasparenza.regione.abruzzo.it/servizi-erogati/carta-servizi/concessione-di-piantine-allevate-nei-vivai-regionali', fonte: 'Regione Abruzzo, concessione di piantine' },
  Molise: { nome: 'Nessun programma verificato', come: `${NESSUNO} La Regione gestisce quattro vivai forestali.`, quando: null, email: null, url: null },
  Campania: { nome: 'Regione Campania, vivai forestali regionali', come: 'Piantine gratis per verde pubblico e rimboschimenti a Comuni, scuole, parchi, associazioni di volontariato e ONLUS; a pagamento per i privati. Si consegna il modulo all\'ufficio regionale della propria provincia.', quando: 'richieste dal 1° aprile al 31 dicembre, ritiro entro il 31 marzo', email: null, url: 'https://agricoltura.regione.campania.it/foreste/vivai_distribuzione.html', fonte: 'Regione Campania, distribuzione delle piantine', soloEnti: true },
  Puglia: { nome: 'ARIF Puglia, vivai forestali provinciali', come: 'Piantine da ecotipi locali gratis agli enti pubblici e a chi organizza iniziative pubbliche per il verde, come la Giornata degli alberi; a pagamento ai privati. Si manda il modello firmato al vivaio della provincia o alla PEC dell\'agenzia.', quando: null, email: 'protocollo@pec.arifpuglia.it', url: 'https://www.arifpuglia.it/attivita/vivai/richiesta-piantine/', fonte: 'ARIF Puglia, richiesta piantine', nota: 'Per alcune specie valgono le restrizioni per la Xylella (allegato B del modello).' },
  Basilicata: { nome: 'Nessun programma verificato', come: `${NESSUNO} In Regione se ne occupa l'Ufficio foreste.`, quando: null, email: null, url: null },
  Calabria: { nome: 'Nessun programma verificato', come: `${NESSUNO} La forestazione è gestita dall'azienda regionale Calabria Verde.`, quando: null, email: null, url: null },
  Sicilia: { nome: 'Regione Siciliana, centro vivaistico regionale', come: 'Produce piante forestali soprattutto per il demanio regionale; la cessione a soggetti pubblici e privati è prevista, ma la pagina non dice se è gratuita. Conviene chiedere prima agli uffici.', quando: null, email: null, url: 'https://www.regione.sicilia.it/istituzioni/regione/strutture-regionali/assessorato-agricoltura-sviluppo-rurale-pesca-mediterranea/dipartimento-sviluppo-rurale-territoriale/centro-vivaistico-regionale', fonte: 'Regione Siciliana, centro vivaistico' },
  Sardegna: { nome: 'Nessun programma verificato', come: `${NESSUNO} I vivai sono gestiti dall'agenzia regionale FoReSTAS.`, quando: null, email: 'direzione.generale@forestas.it', url: null },
};

export const REGIONI = Object.keys(VIVAI).sort((a, b) => a.localeCompare(b, 'it'));

export const PASSI = [
  {
    id: 'gruppo', quando: 'Prima di tutto', titolo: 'Trova chi pianta con te',
    testo: [
      'Bastano poche persone e un referente che tenga i contatti con il Comune. Coinvolgi chi è già attivo nel quartiere: una scuola, una parrocchia, un\'associazione, un comitato.',
      'C\'è anche una ragione pratica: in quasi tutte le Regioni le piantine gratuite vanno a Comuni, scuole ed enti del Terzo settore, non ai singoli cittadini. Una scuola o un\'associazione nel gruppo apre molte porte.',
    ],
  },
  {
    id: 'area', quando: 'Entro settembre', titolo: 'Scegli l\'area e chiedila al Comune', lettera: 'comune',
    testo: [
      'Lo spazio pubblico è del Comune: senza il suo consenso scritto non si pianta. Si scrive all\'ufficio Verde pubblico, o all\'Ambiente; nei grandi Comuni la proposta passa spesso dal Municipio o dal Quartiere.',
      'Se il tuo Comune ha il regolamento per l\'amministrazione condivisa dei beni comuni, chiedi un patto di collaborazione: è l\'accordo scritto in cui Comune e cittadini fissano area, impegni, durata e responsabilità, comprese le assicurazioni. Centinaia di Comuni lo hanno adottato. Altrimenti basta una richiesta di autorizzazione. Molti Comuni hanno anche una procedura per le piantagioni a carico di cittadini e associazioni.',
    ],
    elenco: [
      'Nella lettera indica: area (indirizzo o mappa), quanti alberi, la data, chi pianta, chi li cura e per quanto tempo.',
      'Il Comune controlla i tubi e i cavi sotto terra, le distanze da case e confini (in mancanza di regole locali, 3 metri dal confine privato per un albero ad alto fusto) e la visibilità delle strade (fuori dai centri abitati, almeno 6 metri dal confine stradale).',
      'Non hai un\'area? Chiedi al Comune di indicarne una: molti hanno aree destinate al verde che aspettano solo qualcuno che le pianti.',
    ],
    fonti: ['cost118', 'labsus', 'l113_1', 'cc892', 'dpr495'],
  },
  {
    id: 'alberi', quando: 'Settembre per l\'autunno, febbraio per la fine dell\'inverno', titolo: 'Procurati gli alberi', lettera: 'vivaio',
    testo: [
      'Per legge le Regioni forniscono le piante ai Comuni. Quasi ogni Regione ha vivai forestali pubblici che danno piantine giovani di specie del posto, spesso gratis a Comuni, scuole e associazioni. Le domande hanno scadenze: per piantare a novembre, in diverse Regioni si chiede entro settembre.',
      'Piante giovani e di specie autoctone attecchiscono meglio e costano meno. Le specie le sceglie il vivaio, o l\'ufficio verde, in base al luogo. Mai specie invasive come l\'ailanto: è vietato coltivarle e diffonderle.',
    ],
    fonti: ['l113_2', 'abaco', 'lazio', 'dlgs230', 'ailanto'],
  },
  {
    id: 'piantare', quando: 'Da fine ottobre a marzo, il cuore è il 21 novembre', titolo: 'Il giorno della piantumazione',
    testo: [
      'Si pianta quando gli alberi riposano, dall\'autunno alla fine dell\'inverno, evitando terra gelata o zuppa. Il 21 novembre è la Giornata nazionale degli alberi: per legge, quel giorno anche le scuole mettono a dimora piante autoctone nelle aree indicate dal Comune.',
    ],
    elenco: [
      'Porta vanghe, guanti, annaffiatoi; servono tutori, pacciamatura e, dove passano lepri o decespugliatori, i tubi di protezione.',
      'Buca ampia con la terra smossa. Il colletto, il punto tra fusto e radici, resta a livello del terreno, mai sotto. Radici distese, non piegate.',
      'Pianta il tutore prima dell\'albero, riempi, compatta leggermente con i piedi e bagna subito.',
      'Pacciama intorno alla pianta, con corteccia o cippato, lasciando libero il colletto: trattiene l\'acqua e frena le erbacce.',
      'I bambini sono i benvenuti: un\'etichetta con il loro nome legata all\'albero è un ricordo che dura anni.',
      'Le associazioni del Terzo settore devono assicurare i propri volontari. Per i gruppi informali, chiedi che sia il patto con il Comune a dire chi copre i rischi.',
    ],
    fonti: ['l10_1', 'dlgs117'],
  },
  {
    id: 'cura', quando: 'Per i tre anni successivi', titolo: 'Curali per i primi tre anni',
    testo: [
      'È la parte che decide tutto: un alberello lasciato senz\'acqua d\'estate spesso non arriva al secondo autunno. Mettete per iscritto chi fa cosa.',
    ],
    elenco: [
      'D\'estate, poche annaffiature abbondanti valgono più di tante leggere.',
      'Tieni pulito dalle erbe il cerchio intorno alla pianta per i primi anni.',
      'Controlla che legature e tutori non stringano il fusto.',
      'In autunno sostituisci gli alberi che non hanno attecchito: in primavera si può organizzare una festa per curarli tutti insieme.',
    ],
  },
  {
    id: 'racconta', quando: 'Prima e dopo', titolo: 'Fallo sapere',
    testo: [
      'Annuncia la giornata almeno un mese prima, invitando il quartiere e la stampa locale; dopo pubblica le foto e il numero degli alberi.',
      'Ogni Comune deve censire gli alberi pubblici, e due mesi prima della fine del mandato il sindaco rende noto il bilancio arboreo: quanti alberi c\'erano all\'inizio e quanti alla fine. Puoi chiederlo con Chiedo gli atti, e i tuoi alberi entreranno nel conto.',
    ],
    fonti: ['l113_3bis', 'l10_6'],
  },
];

/** Cosa fare adesso, secondo quanti giorni mancano al prossimo 21 novembre. */
export function faseDi(giorni) {
  if (giorni === 0) return { fase: 'oggi', testo: 'Si pianta! Se non sei riuscito a organizzarti, la stagione per piantare va avanti fino a fine inverno: puoi fare la tua giornata più avanti.' };
  if (giorni <= 20) return { fase: 'ultime', testo: 'Ultime settimane: conferma con il Comune area e data, ritira le piante, annuncia la giornata. Se parti adesso, la stagione per piantare va avanti fino a marzo: puoi puntare alla fine dell\'inverno.' };
  if (giorni <= 52) return { fase: 'ottobre', testo: 'Chi ha già l\'area conferma piante e data. Chi parte adesso scriva subito al Comune: in alcune Regioni la distribuzione delle piantine è aperta da ottobre, e comunque si pianta fino a marzo.' };
  if (giorni <= 82) return { fase: 'settembre', testo: 'È il mese decisivo: scrivi al Comune e chiedi le piante. In diverse Regioni le domande per la consegna d\'autunno scadono il 15 o il 30 settembre.' };
  if (giorni <= 235) return { fase: 'estate', testo: 'È la stagione delle cure: gli alberi piantati negli anni scorsi vanno annaffiati d\'estate. Intanto forma il gruppo e cerca l\'area per novembre.' };
  if (giorni <= 330) return { fase: 'inverno', testo: 'Fino a marzo si pianta ancora: molti vivai consegnano anche a fine inverno (in Piemonte, per esempio, domande entro il 15 febbraio). Poi comincia la stagione delle cure.' };
  return { fase: 'dopo', testo: 'La giornata è appena passata, ma la stagione per piantare continua fino a fine inverno. È anche il momento di sostituire gli alberi non attecchiti e di preparare il prossimo anno.' };
}
