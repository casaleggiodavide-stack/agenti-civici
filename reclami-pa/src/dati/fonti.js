// Fonti verificate per «Reclami alla PA e difensore civico». File generato da
// scripts/reclami-pa-dati.py da reclami-pa/dati/fonti.json: non modificarlo a mano.

export default {
 "verificato": "2026-10-25",
 "regole": {
  "termine_default_30": {
   "testo": "Se nessuna legge o regolamento fissa un termine diverso, l'ufficio pubblico deve chiudere la pratica con un provvedimento espresso entro 30 giorni.",
   "giorni": 30,
   "norma": {
    "titolo": "L. 241/1990, art. 2, commi 1-2",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
   }
  },
  "termine_fino_90": {
   "testo": "Per le amministrazioni statali un DPCM può fissare termini fino a 90 giorni; gli enti pubblici nazionali li fissano da sé, sempre entro 90 giorni.",
   "giorni": 90,
   "norma": {
    "titolo": "L. 241/1990, art. 2, comma 3",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
   }
  },
  "termine_fino_180": {
   "testo": "Per procedimenti complessi il termine può superare i 90 giorni, ma non i 180 (salvo cittadinanza e immigrazione).",
   "giorni": 180,
   "norma": {
    "titolo": "L. 241/1990, art. 2, comma 4",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
   }
  },
  "sospensione_30": {
   "testo": "Il termine può essere sospeso una sola volta, per massimo 30 giorni, per chiedere informazioni o certificati che l'ufficio non ha già e non può ottenere da altre PA.",
   "giorni": 30,
   "norma": {
    "titolo": "L. 241/1990, art. 2, comma 7",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
   }
  },
  "comunicazione_avvio": {
   "testo": "La comunicazione di avvio deve indicare l'ufficio e il responsabile, il domicilio digitale della PA, la data entro cui il procedimento deve concludersi e i rimedi in caso di inerzia; nelle istanze di parte anche la data di presentazione.",
   "giorni": null,
   "norma": {
    "titolo": "L. 241/1990, art. 8, comma 2",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art8"
   }
  },
  "potere_sostitutivo_chi": {
   "testo": "Ogni PA deve nominare un titolare del potere sostitutivo per i casi di inerzia e pubblicarne il nome sul sito, raggiungibile dalla home page. Se non l'ha nominato, il potere spetta al dirigente generale; in mancanza al dirigente preposto all'ufficio; in mancanza al funzionario di livello più elevato.",
   "giorni": null,
   "norma": {
    "titolo": "L. 241/1990, art. 2, comma 9-bis",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
   }
  },
  "potere_sostitutivo_termine": {
   "testo": "Scaduto il termine, il cittadino può chiedere l'intervento del titolare del potere sostitutivo, che deve chiudere la pratica entro la metà del termine originario (es. 15 giorni se il termine era 30), con le strutture interne o nominando un commissario.",
   "giorni": null,
   "norma": {
    "titolo": "L. 241/1990, art. 2, comma 9-ter",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
   }
  },
  "ritardo_dichiarato": {
   "testo": "Nei provvedimenti rilasciati in ritardo su istanza di parte devono essere indicati il termine di legge e quello effettivamente impiegato.",
   "giorni": null,
   "norma": {
    "titolo": "L. 241/1990, art. 2, comma 9-quinquies",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
   }
  },
  "preavviso_rigetto": {
   "testo": "Prima di respingere una domanda l'ufficio deve comunicare i motivi; il cittadino ha 10 giorni per mandare osservazioni scritte e documenti. La comunicazione sospende i termini, che ripartono dopo 10 giorni dalle osservazioni o dalla scadenza dei 10 giorni.",
   "giorni": 10,
   "norma": {
    "titolo": "L. 241/1990, art. 10-bis",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art10bis"
   }
  },
  "ricorso_silenzio_termine": {
   "testo": "Scaduto il termine senza risposta, chi ha interesse può chiedere al TAR di accertare l'obbligo della PA di provvedere. Il ricorso si può presentare finché dura l'inerzia e comunque entro un anno dalla scadenza del termine; dopo, si può ripresentare la domanda all'ufficio.",
   "giorni": 365,
   "norma": {
    "titolo": "Cod. proc. amm. (d.lgs. 104/2010, all. 1), art. 31, commi 1-3",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2010-07-02;104:2~art31"
   }
  },
  "ricorso_silenzio_rito": {
   "testo": "Il ricorso contro il silenzio si notifica alla PA e ad almeno un controinteressato, anche senza diffida. Si decide in camera di consiglio con termini processuali dimezzati e sentenza semplificata; se accolto, il giudice ordina di provvedere di norma entro 30 giorni e può nominare un commissario ad acta.",
   "giorni": 30,
   "norma": {
    "titolo": "Cod. proc. amm., artt. 117 e 87, comma 2, lett. b) e comma 3",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2010-07-02;104:2~art117"
   }
  },
  "contributo_unificato_silenzio": {
   "testo": "Per il ricorso al TAR contro il silenzio (e per l'accesso) il contributo unificato è di 300 euro; è dimezzato (150 euro) nei ricorsi per l'indennizzo da ritardo previsti dal d.l. 69/2013.",
   "giorni": null,
   "norma": {
    "titolo": "D.P.R. 115/2002, art. 13, comma 6-bis, lett. a)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:2002-05-30;115~art13"
   }
  },
  "risarcimento_ritardo": {
   "testo": "La PA deve risarcire il danno ingiusto causato dal ritardo doloso o colposo nel concludere il procedimento.",
   "giorni": null,
   "norma": {
    "titolo": "L. 241/1990, art. 2-bis, comma 1",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2bis"
   }
  },
  "indennizzo_ritardo_importi": {
   "testo": "Per il solo ritardo spetta un indennizzo di 30 euro per ogni giorno dalla scadenza del termine, fino a un massimo di 2.000 euro.",
   "giorni": null,
   "norma": {
    "titolo": "D.l. 69/2013, art. 28, comma 1",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2013-06-21;69~art28"
   }
  },
  "indennizzo_attivazione_20": {
   "testo": "Per ottenere l'indennizzo bisogna chiedere l'intervento del titolare del potere sostitutivo entro 20 giorni (perentori) dalla scadenza del termine del procedimento.",
   "giorni": 20,
   "norma": {
    "titolo": "D.l. 69/2013, art. 28, comma 2",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2013-06-21;69~art28"
   }
  },
  "indennizzo_ricorso": {
   "testo": "Se il titolare del potere sostitutivo non emana il provvedimento o non paga l'indennizzo, si può ricorrere al TAR con il rito del silenzio (art. 117 cpa) o con il rito di ingiunzione (art. 118); la domanda di indennizzo può essere unita al ricorso sul silenzio.",
   "giorni": null,
   "norma": {
    "titolo": "D.l. 69/2013, art. 28, commi 3-6",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2013-06-21;69~art28"
   }
  },
  "accesso_riesame_difensore": {
   "testo": "Se la PA nega l'accesso ai documenti o non risponde entro 30 giorni (silenzio = rifiuto), entro i successivi 30 giorni si può ricorrere al TAR oppure, per atti di Comuni, Province e Regioni, chiedere il riesame al difensore civico competente (in sua assenza a quello di livello superiore). Per atti dello Stato si va alla Commissione per l'accesso. Difensore o Commissione decidono entro 30 giorni.",
   "giorni": 30,
   "norma": {
    "titolo": "L. 241/1990, art. 25, comma 4",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art25"
   }
  },
  "azione_collettiva_presupposti": {
   "testo": "Gruppi di utenti con interessi omogenei, o associazioni e comitati che li rappresentano, possono agire contro PA e concessionari di servizi pubblici per ripristinare il corretto servizio, se c'è una lesione diretta, concreta e attuale causata da: violazione di termini o mancata adozione di atti amministrativi generali obbligatori; violazione delle carte dei servizi; violazione degli standard di qualità ed economici; violazione dei livelli di qualità per inclusione e accessibilità delle persone con disabilità.",
   "giorni": null,
   "norma": {
    "titolo": "D.lgs. 198/2009, art. 1",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2009-12-20;198~art1"
   }
  },
  "azione_collettiva_diffida": {
   "testo": "Prima del ricorso bisogna notificare (anche via PEC) una diffida all'organo di vertice della PA o del concessionario perché entro 90 giorni faccia gli interventi necessari.",
   "giorni": 90,
   "norma": {
    "titolo": "D.lgs. 198/2009, art. 3, comma 1",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2009-12-20;198~art3"
   }
  },
  "azione_collettiva_ricorso": {
   "testo": "Se dopo i 90 giorni la PA non ha rimediato, o lo ha fatto solo in parte, il ricorso al TAR va proposto entro un anno (termine perentorio) dalla scadenza dei 90 giorni, dimostrando la notifica della diffida e dichiarando che il problema persiste.",
   "giorni": 365,
   "norma": {
    "titolo": "D.lgs. 198/2009, art. 3, comma 2",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2009-12-20;198~art3"
   }
  },
  "difensore_civico_digitale": {
   "testo": "Chiunque può segnalare al Difensore civico per il digitale presso AgID presunte violazioni del Codice dell'amministrazione digitale e delle altre norme sulla digitalizzazione della PA (es. servizi online, domicilio digitale, pagamenti, identità digitale), tramite l'apposita area del sito AgID. Se la segnalazione non è manifestamente infondata, la passa al Direttore generale AgID, che può contestare la violazione, imporre un termine per conformarsi e, per alcuni obblighi, sanzionare da 10.000 a 100.000 euro.",
   "giorni": null,
   "norma": {
    "titolo": "CAD d.lgs. 82/2005, art. 17, comma 1-quater e art. 18-bis",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-03-07;82~art17"
   }
  },
  "difensore_comunale_soppresso": {
   "testo": "Il difensore civico comunale è stato soppresso. I Comuni possono affidarne le funzioni, con una convenzione, al difensore civico della Provincia, che prende il nome di 'difensore civico territoriale'. Nella pratica oggi molti difensori civici regionali e delle Province autonome operano verso i Comuni che hanno firmato una convenzione.",
   "giorni": null,
   "norma": {
    "titolo": "L. 191/2009, art. 2, comma 186, lett. a); TUEL d.lgs. 267/2000, art. 11",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2009-12-23;191~art2-com186"
   }
  },
  "garante_salute": {
   "testo": "Regioni e Province autonome possono affidare al Difensore civico la funzione di garante del diritto alla salute: chiunque riceve prestazioni sanitarie può rivolgersi a lui gratuitamente, direttamente o tramite delegato, per segnalare disfunzioni dell'assistenza sanitaria e sociosanitaria.",
   "giorni": null,
   "norma": {
    "titolo": "L. 24/2017, art. 2, commi 1-3",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2017-03-08;24~art2"
   }
  },
  "reclamo_sanitario_15": {
   "testo": "Contro atti o comportamenti che negano o limitano le prestazioni sanitarie si può presentare reclamo in carta semplice al direttore generale dell'ASL o dell'azienda ospedaliera entro 15 giorni da quando se ne è avuto conoscenza; il direttore decide entro 15 giorni, sentito il direttore sanitario. Possono presentarlo l'interessato, parenti o affini e le associazioni di tutela accreditate.",
   "giorni": 15,
   "norma": {
    "titolo": "D.lgs. 502/1992, art. 14, comma 5",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-12-30;502~art14"
   }
  },
  "urp": {
   "testo": "Ogni PA deve avere un Ufficio relazioni con il pubblico (URP), che informa sullo stato delle pratiche, aiuta a esercitare i diritti di partecipazione e accesso della L. 241/1990 e raccoglie il giudizio degli utenti sulla qualità dei servizi. È il primo canale per un reclamo informale.",
   "giorni": null,
   "norma": {
    "titolo": "L. 150/2000, art. 8; d.lgs. 165/2001, art. 11",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2000-06-07;150~art8"
   }
  },
  "carte_servizi": {
   "testo": "I servizi pubblici nazionali e locali devono essere erogati in modo da migliorare la qualità e tutelare gli utenti, anche con la loro partecipazione alla definizione degli standard. La carta dei servizi dell'ente indica standard, procedura di reclamo ed eventuali rimborsi: la violazione degli obblighi della carta è anche presupposto dell'azione collettiva.",
   "giorni": null,
   "norma": {
    "titolo": "D.lgs. 286/1999, art. 11",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1999-07-30;286~art11"
   }
  },
  "esposto_corte_conti": {
   "testo": "Rinvio: se il disservizio fa sospettare uno spreco di denaro o patrimonio pubblico, qualsiasi cittadino può presentare gratis un esposto scritto e dettagliato alla Procura regionale della Corte dei conti della regione dove è avvenuto il fatto (a mano al protocollo, per posta o per email).",
   "giorni": null,
   "norma": {
    "titolo": "Corte dei conti, pagina 'Esposto alla Procura regionale'",
    "url": "https://www.corteconti.it/Home/ChiSiamo/InformazioniUtili/EspostoProcuraRegionale"
   }
  },
  "segnalazione_anac": {
   "testo": "Rinvio: tutti i cittadini possono segnalare all'ANAC violazioni su appalti pubblici, misure anticorruzione (PTPCT, RPCT), inconferibilità e incompatibilità, conflitti di interesse, codici di comportamento e obblighi di trasparenza, solo tramite il Modulo unico informatizzato.",
   "giorni": null,
   "norma": {
    "titolo": "ANAC, Segnalazioni contratti pubblici e anticorruzione",
    "url": "https://www.anticorruzione.it/-/segnalazioni-contratti-pubblici-e-anticorruzione"
   }
  }
 },
 "difensori": {
  "Abruzzo": {
   "regione": "Abruzzo",
   "esiste": true,
   "ufficio": "Ufficio del Difensore civico regionale, presso il Consiglio regionale dell'Abruzzo",
   "titolare": "Umberto Di Primio",
   "url": "https://www.difensorecivicoabruzzo.it/",
   "pec": "difensore.civico@pec.crabruzzo.it",
   "email": "info@difensorecivicoabruzzo.it",
   "modulo_online": false,
   "sanita": null,
   "comuni": true,
   "note": "L.R. 126/1995. Sedi: L'Aquila, via M. Iacobucci 4; Pescara, piazza Unione 13. Istanze con moduli scaricabili PDF/ODT (intervento generale, riesame accesso documentale, ricorso accesso civico, controinteressati); sul sito c'è solo un form 'Richiedi informazioni'. Interviene verso le PA con sede nel territorio regionale, compresi gli enti locali per l'accesso (art. 25, c. 4 L. 241/1990). Sanità: il sito non la cita espressamente.",
   "verificato_il": "2026-10-25"
  },
  "Basilicata": {
   "regione": "Basilicata",
   "esiste": true,
   "ufficio": "Difensore civico regionale, presso il Consiglio regionale della Basilicata (Potenza)",
   "titolare": "Rocco Fuina (fonte: Coordinamento nazionale)",
   "url": "https://www.consiglio.basilicata.it/",
   "pec": null,
   "email": "difensorecivico@regione.basilicata.it",
   "modulo_online": null,
   "sanita": null,
   "comuni": null,
   "note": "Il sito del Consiglio è un'applicazione JavaScript che legge i contenuti da /consiglio-api, vietato dal robots.txt: pagina ufficiale non leggibile. Nome ed email presi dall'elenco del Coordinamento nazionale dei difensori civici (https://www.coordifesacivicaitalia.it/il-difensore-civico-della-tua-regione/). PEC, modulo, sanità e convenzioni con i Comuni non verificabili: null. L.R. 5/2007 (dai risultati di ricerca).",
   "verificato_il": "2026-10-25"
  },
  "Calabria": {
   "regione": "Calabria",
   "esiste": true,
   "ufficio": "Difensore civico della Regione Calabria, presso il Consiglio regionale (Palazzo Campanella, via Cardinale Portanova, Reggio Calabria)",
   "titolare": null,
   "url": "https://www.consiglioregionale.calabria.it/portale/Istituzione/DifensoreCivico/DifensoreCivico",
   "pec": "difensorecivico@pec.consrc.it",
   "email": "difensorecivico@consrc.it",
   "modulo_online": false,
   "sanita": false,
   "comuni": false,
   "note": "CARICA VACANTE: il 10/11/2025 il Consiglio ha pubblicato un avviso di 'stato di vacanza degli Organi regionali di garanzia'; il Coordinamento nazionale indica la Calabria senza titolare. La procedura per la nuova nomina è in corso (secondo i risultati di ricerca: avviso del 18/12/2025, elenchi definitivi dei candidati approvati il 30/3/2026); nessuna elezione trovata. La pagina ufficiale riporta ancora Ubaldo Comite (in carica dal 20/2/2023): dato superato. L.R. 4/1985: competente su Regione, enti e aziende dipendenti ed enti delegati (solo per funzioni delegate). Per la sanità c'è un Garante regionale della Salute separato (/portale/Istituzione/GaranteSalute/GaranteSalute). Riceve solo su appuntamento.",
   "verificato_il": "2026-10-25"
  },
  "Campania": {
   "regione": "Campania",
   "esiste": true,
   "ufficio": "Ufficio del Difensore civico della Regione Campania, presso il Consiglio regionale (Centro Direzionale Isola F8, Napoli)",
   "titolare": "Prof. Avv. Bruno De Maria",
   "url": "https://www.cr.campania.it/difensore-civico/",
   "pec": "difensore.civico@pec.cr.campania.it",
   "email": "difensore.civico@cr.campania.it",
   "modulo_online": false,
   "sanita": true,
   "comuni": null,
   "note": "L.R. 23/1978; dal 2018 (L.R. 16/2018) anche Garante del diritto alla salute. Competente su Regione ed enti dipendenti; il sito non indica convenzioni con i Comuni. Avviso del 3/8/2026: le istanze via email ordinaria senza documento d'identità valido sono improcedibili. Non interviene se sullo stesso oggetto c'è già un ricorso giurisdizionale o amministrativo.",
   "verificato_il": "2026-10-25"
  },
  "Emilia-Romagna": {
   "regione": "Emilia-Romagna",
   "esiste": true,
   "ufficio": "Difensore civico regionale, presso l'Assemblea legislativa dell'Emilia-Romagna (viale Aldo Moro 50, Bologna)",
   "titolare": "Guido Giusti (eletto il 26/7/2023)",
   "url": "https://www.assemblea.emr.it/difensore-civico",
   "pec": "difensorecivico@postacert.regione.emilia-romagna.it",
   "email": "difensorecivico@regione.emilia-romagna.it",
   "modulo_online": true,
   "sanita": true,
   "comuni": true,
   "note": "L.R. 25/2003. Form online AlDefendo: https://alapps.regione.emilia-romagna.it/AlDefendoWeb/public/difensore-civico (nel form indicare una email non PEC, salvo PEC abilitata a ricevere da caselle ordinarie). Interviene su Regione, Province e Comuni e sui gestori di servizi pubblici (acqua, luce, gas); consultabile anche per sanità e ospedali. Non interviene su magistratura, forze dell'ordine ed esercito.",
   "verificato_il": "2026-10-25"
  },
  "Friuli-Venezia Giulia": {
   "regione": "Friuli Venezia Giulia",
   "esiste": true,
   "ufficio": "Difensore civico regionale, presso il Consiglio regionale del Friuli Venezia Giulia (piazza Oberdan 6, Trieste)",
   "titolare": "Arrigo De Pauli (dal 2019)",
   "url": "https://difensorecivico.regione.fvg.it/",
   "pec": "consiglio@certregione.fvg.it",
   "email": "cr.difensore.civico@regione.fvg.it",
   "modulo_online": true,
   "sanita": true,
   "comuni": true,
   "note": "La PEC è quella generale del Consiglio regionale. Form online: https://difensorecivico.regione.fvg.it/cms/chi-siamo/segnala/ . Svolge anche la funzione di garante della salute e degli utenti ATER. Comuni: solo quelli che hanno firmato una convenzione (pagina 'Convenzioni per attribuzione difesa civica'). La sezione del sito del Consiglio /pagine/difensorecivico/ è vietata dal robots.txt: usato il sito dedicato, consentito.",
   "verificato_il": "2026-10-25"
  },
  "Lazio": {
   "regione": "Lazio",
   "esiste": true,
   "ufficio": "Difensore civico della Regione Lazio, presso il Consiglio regionale (via della Pisana 1301, Roma)",
   "titolare": "Marino Fardelli (presidente del Coordinamento nazionale)",
   "url": "https://difensorecivico.regione.lazio.it/",
   "pec": "difensorecivico@cert.consreglazio.it",
   "email": "difensore.civico@regione.lazio.it",
   "modulo_online": false,
   "sanita": "parziale",
   "comuni": false,
   "note": "L.R. 17/1980. Numero verde 800 866 155. PRE-REQUISITO: prima serve un'istanza scritta all'amministrazione; dopo 30 giorni si può chiedere l'intervento del difensore allegando l'istanza ed eventuale risposta (altrimenti improcedibile). Competente su Consiglio e Giunta regionale, enti subregionali, aziende partecipate, ASL solo per atti soggetti ad approvazione regionale o di competenza regionale, enti con deleghe regionali privi di proprio difensore. Non entra nel merito di terapie e diagnosi. Moduli scaricabili (non c'è un form online). Avviso dell'1/10/2026: istanze da caselle non nominative o senza documento d'identità possono essere archiviate o trattate dopo le altre.",
   "verificato_il": "2026-10-25"
  },
  "Liguria": {
   "regione": "Liguria",
   "esiste": true,
   "ufficio": "Difensore civico regionale della Liguria, presso il Consiglio regionale (Genova)",
   "titolare": "Francesco Cozzi (fonte: Coordinamento nazionale; eletto nel 2023 secondo i risultati di ricerca)",
   "url": null,
   "pec": null,
   "email": null,
   "modulo_online": null,
   "sanita": null,
   "comuni": null,
   "note": "Il sito del Consiglio (www.consiglio.regione.liguria.it) reindirizza a www.regione.liguria.it, il cui robots.txt vieta tutto a 'User-agent: *' (consentiti solo alcuni bot di motori di ricerca): pagine ufficiali non lette. L'elenco del Coordinamento nazionale riporta solo il nome, senza recapiti. URL, PEC, email, modulo e competenze: null, da verificare a mano.",
   "verificato_il": "2026-10-25"
  },
  "Lombardia": {
   "regione": "Lombardia",
   "esiste": true,
   "ufficio": "Difensore regionale della Lombardia, autorità indipendente presso il Consiglio regionale (via Fabio Filzi 22, Milano)",
   "titolare": "Gianalberico De Vecchi (eletto il 29/6/2021 secondo ENO; mandato di 6 anni)",
   "url": "https://www.difensoreregionale.lombardia.it/wps/portal/site/difensore-regionale",
   "pec": "difensore.regionale@pec.consiglio.regione.lombardia.it",
   "email": "difensore.civico@consiglio.regione.lombardia.it",
   "modulo_online": true,
   "sanita": true,
   "comuni": null,
   "note": "L.R. 18/2010, Statuto art. 61. Competente su Regione e sistema regionale (ALER, aziende sanitarie, ARPA, enti parco, consorzi di bonifica) e sui gestori di servizi pubblici regionali (energia, rifiuti, trasporti). È anche Garante della salute, dei detenuti, del contribuente regionale e delle persone con disabilità. Il sito cita un modulo online (visibile solo accettando i cookie analitici). Comuni: non verificato. Email e telefoni da https://www.regione.lombardia.it/diritti-e-tutele/tutela-consumatori-e-utenti/difensore-regionale . Il sito del Consiglio (www.consiglio.regione.lombardia.it) vieta tutto a 'User-agent: *': non letto.",
   "verificato_il": "2026-10-25"
  },
  "Marche": {
   "regione": "Marche",
   "esiste": true,
   "ufficio": "Garante regionale dei diritti della persona (Ombudsman), che svolge anche la difesa civica, presso l'Assemblea legislativa delle Marche (piazza Cavour 23, Ancona)",
   "titolare": "Giancarlo Giulianelli",
   "url": "https://www.garantediritti.marche.it/",
   "pec": "assemblea.marche.garantediritti@emarche.it",
   "email": "garantediritti@regione.marche.it",
   "modulo_online": false,
   "sanita": true,
   "comuni": true,
   "note": "Un unico organo per difesa civica, infanzia, detenuti e antidiscriminazioni. Competente su Regione, enti dipendenti o vigilati, enti e aziende del servizio sanitario regionale; enti locali solo dopo una convenzione. Modulistica scaricabile (accesso agli atti e accesso civico); non trovato un form online per la difesa civica (c'è solo quello per segnalare discriminazioni).",
   "verificato_il": "2026-10-25"
  },
  "Molise": {
   "regione": "Molise",
   "esiste": true,
   "ufficio": "Garante regionale dei diritti della persona, che svolge anche la difesa civica (via Genova 11, Campobasso)",
   "titolare": "Avv. Maria Spadafora (nominata con decreto del Presidente del Consiglio regionale n. 2 del 5/5/2025)",
   "url": "https://garantedeidiritti.regione.molise.it/",
   "pec": "garanteregionaledeidiritti@cert.regione.molise.it",
   "email": "garanteregionaledeidiritti@regione.molise.it",
   "modulo_online": null,
   "sanita": null,
   "comuni": null,
   "note": "Il difensore civico autonomo è stato abolito (L.R. 25/2013, dato ENO 2014). Le funzioni di difesa civica sono del Garante dei diritti della persona (L.R. 17/2015), che si è insediato presso la Giunta regionale dopo la sentenza TAR Molise n. 45/2025. Modulo online, sanità e convenzioni con i Comuni: non verificati.",
   "verificato_il": "2026-10-25"
  },
  "Piemonte": {
   "regione": "Piemonte",
   "esiste": true,
   "ufficio": "Difensore civico della Regione Piemonte, presso il Consiglio regionale (sede via Alfieri 15; uffici piazza Solferino 22, Torino)",
   "titolare": "Avv. Paola Baldovino (riconfermata per un secondo mandato)",
   "url": "https://www.cr.piemonte.it/cms/assemblea/organi-istituzionali/difensore-civico",
   "pec": "difensore.civico@cert.cr.piemonte.it",
   "email": "difensore.civico@cr.piemonte.it",
   "modulo_online": true,
   "sanita": true,
   "comuni": "parziale",
   "note": "Istanze online con la procedura MOON: https://moon.csi.it/moonfobl/accesso/gasp_regione?codice_ente=003&amb=difciv&codice_modulo=INTERVENTO_DIF_CIV (moduli anche per riesame dell'accesso documentale e civico). Interviene su uffici ed enti regionali, amministrazioni periferiche dello Stato e strutture sanitarie e sociosanitarie; verso gli enti locali per ricorsi su accesso e obblighi di pubblicazione. Tel. 011.5757387.",
   "verificato_il": "2026-10-25"
  },
  "Puglia": {
   "regione": "Puglia",
   "esiste": false,
   "ufficio": null,
   "titolare": null,
   "url": null,
   "pec": null,
   "email": null,
   "modulo_online": null,
   "sanita": null,
   "comuni": null,
   "note": "Nessun difensore civico regionale in carica. Il Coordinamento nazionale (lettera del 24/2/2026 alla Regione e al Consiglio, ripresa da ENO) parla di figura 'non istituita'; nessuna nomina trovata dopo quella data. Il sito del Consiglio (www.consiglio.puglia.it) vieta tutto a 'User-agent: *': non letto. Per l'accesso agli atti vale il rinvio dell'art. 25, c. 4 L. 241/1990 al difensore 'di ambito territoriale immediatamente superiore', che però non c'è: usare il TAR. Il servizio di difesa civica che il Coordinamento offriva dal 2013 nelle regioni scoperte risulta solo da un documento parlamentare: non verificato.",
   "verificato_il": "2026-10-25"
  },
  "Sardegna": {
   "regione": "Sardegna",
   "esiste": true,
   "ufficio": "Difensore civico della Regione Sardegna, presso il Consiglio regionale (via Roma 25, Cagliari)",
   "titolare": null,
   "url": null,
   "pec": null,
   "email": null,
   "modulo_online": null,
   "sanita": null,
   "comuni": null,
   "note": "Il sito del Consiglio (consiglio.regione.sardegna.it, alias www.consregsardegna.it) risponde 403 con una pagina di blocco ed errore di certificato TLS: non aggirato, quindi non letto. Titolare contraddittorio: l'elenco del Coordinamento indica Rosanna Mura, mentre un risultato di ricerca sulla relazione 2025 trasmessa alla Camera (31/3/2026) mostra una firma 'Avv. Marco Enrico ...': null. Dagli stessi risultati di ricerca (NON verificati su fonte letta): PEC difensorecivico@pec.crsardegna.it, numero verde 800-060160.",
   "verificato_il": "2026-10-25"
  },
  "Sicilia": {
   "regione": "Sicilia",
   "esiste": false,
   "ufficio": null,
   "titolare": null,
   "url": null,
   "pec": null,
   "email": null,
   "modulo_online": null,
   "sanita": null,
   "comuni": null,
   "note": "La Regione Siciliana non ha mai istituito il difensore civico regionale (Coordinamento nazionale, febbraio 2026; riunione del Coordinamento all'ARS il 9-10/7/2026). Nessuna legge istitutiva trovata a oggi.",
   "verificato_il": "2026-10-25"
  },
  "Toscana": {
   "regione": "Toscana",
   "esiste": true,
   "ufficio": "Difensore civico della Toscana, presso il Consiglio regionale (via Cavour 18, Firenze)",
   "titolare": "Lucia Annibali (Difensora civica dal 1/2/2023)",
   "url": "https://difensorecivicotoscana.it/",
   "pec": "difensorecivicotoscana@postacert.toscana.it",
   "email": "difensorecivico@consiglio.regione.toscana.it",
   "modulo_online": true,
   "sanita": true,
   "comuni": true,
   "note": "L.R. 19/2009. Numero verde 800018488. Richiesta di intervento generica anche via web: https://difensorecivicotoscana.it/istanza ; per il riesame dell'accesso, moduli PDF da inviare via email o PEC. Competente su Regione, Province, Comuni, enti del sistema regionale, concessionari e gestori di servizi pubblici, uffici periferici dello Stato (con esclusioni). Sanità: assistenza, organizzazione e procedimenti; commissioni miste conciliative in sanità.",
   "verificato_il": "2026-10-25"
  },
  "Bolzano": {
   "regione": "Provincia autonoma di Bolzano",
   "esiste": true,
   "ufficio": "Difesa civica della Provincia autonoma di Bolzano (Volksanwaltschaft), presso il Consiglio provinciale (via Cavour 23/c, Bolzano)",
   "titolare": "Veronika Meyer",
   "url": "https://www.difesacivica-bz.org/",
   "pec": "volksanwaltschaft.difesacivica@pec.prov-bz.org",
   "email": "posta@difesacivica.bz.it",
   "modulo_online": true,
   "sanita": null,
   "comuni": true,
   "note": "Modulo reclami online alla pagina Contatti (https://www.difesacivica-bz.org/it/contatti.asp). In altre pagine del sito compare anche l'email post@volksanwaltschaft.bz.it. Si occupa di questioni comunali e provinciali e di mediazione con la PA. Sanità: non verificata. Sito bilingue IT/DE.",
   "verificato_il": "2026-10-25"
  },
  "Trento": {
   "regione": "Provincia autonoma di Trento",
   "esiste": true,
   "ufficio": "Difensore civico della Provincia autonoma di Trento, presso il Consiglio provinciale (Palazzo della Regione, via Gazzoletti 2, Trento)",
   "titolare": "Dott. Sandro Raimondi",
   "url": "https://difensorecivico.consiglio.provincia.tn.it/",
   "pec": "difensore.civico@pec.consiglio.provincia.tn.it",
   "email": "difensore.civico@consiglio.provincia.tn.it",
   "modulo_online": false,
   "sanita": true,
   "comuni": true,
   "note": "Numero verde 800 851026. Comuni: solo gli enti convenzionati (https://difensorecivico.consiglio.provincia.tn.it/p/enti-convenzionati; es. Fai della Paganella ha aderito nel giugno 2026). Aree di intervento comprese salute, assistenza ed enti locali. Moduli scaricabili per accesso documentale e civico; non trovato un form online.",
   "verificato_il": "2026-10-25"
  },
  "Umbria": {
   "regione": "Umbria",
   "esiste": true,
   "ufficio": "Difensore civico regionale, presso l'Assemblea legislativa dell'Umbria (Palazzo Cesaroni, piazza Italia 2, Perugia)",
   "titolare": "Fabrizio Schettini (fonte: Coordinamento nazionale; nome non letto sulla pagina ufficiale)",
   "url": "https://consiglio.regione.umbria.it/organizzazione/enti-e-organismi/difensore-civico",
   "pec": "difensorecivico@pec.alumbria.it",
   "email": "difensorecivico@alumbria.it",
   "modulo_online": true,
   "sanita": null,
   "comuni": null,
   "note": "Form online 'Richiesta intervento Difensore civico': https://consiglio.regione.umbria.it/organizzazione/enti-e-organismi/difensore-civico/contatti . Tel. 075 576 3215; riceve solo su appuntamento. Interviene d'ufficio o su richiesta nei casi di cattiva amministrazione. Sanità e convenzioni con i Comuni: non indicate.",
   "verificato_il": "2026-10-25"
  },
  "Valle d'Aosta": {
   "regione": "Valle d'Aosta",
   "esiste": true,
   "ufficio": "Difensore civico della Valle d'Aosta, presso il Consiglio Valle (via Festaz 46, Aosta)",
   "titolare": "Adele Squillaci (eletta il 12/1/2022; mandato di 5 anni)",
   "url": "https://www.consiglio.vda.it/app/difensorecivico",
   "pec": "difensore.civico@legalmail.it",
   "email": "difensore.civico@consiglio.vda.it",
   "modulo_online": false,
   "sanita": null,
   "comuni": true,
   "note": "L.R. 17/2001. Richiesta scritta e firmata per posta, email, PEC o a mano, anche con il modulo della sezione Modulistica; non serve l'avvocato. Comuni e Unités des Communes: solo quelli convenzionati (elenco PDF sul sito). Svolge anche la funzione di garante delle persone con disabilità. Sanità: non verificata. Tel. 0165 526081/526082.",
   "verificato_il": "2026-10-25"
  },
  "Veneto": {
   "regione": "Veneto",
   "esiste": true,
   "ufficio": "Garante regionale dei diritti della persona, che svolge la difesa civica, presso il Consiglio regionale del Veneto",
   "titolare": "Mario Caramel (riconfermato nel luglio 2024 per tre anni, secondo ENO)",
   "url": null,
   "pec": null,
   "email": null,
   "modulo_online": null,
   "sanita": null,
   "comuni": null,
   "note": "Dal 2013 (L.R. 37/2013, artt. 11 e 19) le funzioni del difensore civico sono passate al Garante regionale dei diritti della persona. Il sito del Consiglio (www.consiglioveneto.it) risponde 403 sia a curl sia al fetch, anche per il robots.txt: non aggirato, non letto. URL, PEC, email e competenze: null, da verificare a mano.",
   "verificato_il": "2026-10-25"
  }
 },
 "garanti": [
  {
   "nome": "Garante per la protezione dei dati personali",
   "cosa": "Reclamo circostanziato su violazioni dei propri dati personali (GDPR artt. 15-22 e Codice privacy); se non ci sono elementi sufficienti, una semplice segnalazione. Prima conviene chiedere al titolare del trattamento (anche alla PA, tramite il suo RPD), che deve rispondere entro un mese.",
   "url": "https://www.garanteprivacy.it/diritti/come-agire-per-tutelare-i-tuoi-dati-personali/reclamo",
   "pec": "protocollo@pec.gpdp.it",
   "email": null,
   "modulo_online": false,
   "termini": "Il Garante decide entro 9 mesi dalla presentazione (12 mesi per motivate esigenze istruttorie) e entro 3 mesi informa sullo stato del procedimento (d.lgs. 196/2003, art. 143, c. 3: https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2003-06-30;196~art143).",
   "note": "Gratuito. Si presenta via PEC (accetta solo PEC), con raccomandata A/R o a mano in piazza Venezia 11, 00187 Roma, in carta libera o con il modello del Garante (https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/4535524). Firma digitale, oppure autografa con copia del documento. Il Garante non liquida risarcimenti (va chiesto al giudice). Il robots.txt vieta i PDF: modello non scaricato.",
   "verificato_il": "2026-10-25"
  },
  {
   "nome": "Garante nazionale dei diritti delle persone private della libertà personale",
   "cosa": "Tutela di detenuti, persone in CPR, in REMS, in TSO e simili; gestisce reclami e segnalazioni.",
   "url": "https://www.garantenazionaleprivatiliberta.it/gnpl/it/contatti.page",
   "pec": "prot.segreteria@cert.garantenpl.it",
   "email": "segreteria@garantenpl.it",
   "modulo_online": false,
   "termini": null,
   "note": "Via di San Francesco di Sales 34, 00165 Roma; tel. 06.8791741. Il sito parla di 'gestione dei reclami e delle segnalazioni' ma non spiega come inviarli: usare PEC o email. Per i detenuti esistono anche Garanti regionali e comunali.",
   "verificato_il": "2026-10-25"
  },
  {
   "nome": "Autorità garante per l'infanzia e l'adolescenza (AGIA)",
   "cosa": "Segnalazioni di violazioni, o rischi di violazione, dei diritti delle persone minori di 18 anni che vivono in Italia; chiunque può segnalare, anche i ragazzi.",
   "url": "https://www.garanteinfanzia.org/segnalazioni/",
   "pec": null,
   "email": "segnalazioni@garanteinfanzia.org",
   "modulo_online": null,
   "termini": null,
   "note": "Le segnalazioni vanno PRIMA al Garante regionale; all'AGIA (segnalazioni@garanteinfanzia.org) solo se nella regione di residenza il Garante regionale non c'è. Non accetta allegati con dati giudiziari. PEC non indicata sulle pagine lette. Indirizzo: via del Tritone 132, 00187 Roma; segreteria@garanteinfanzia.org.",
   "verificato_il": "2026-10-25"
  },
  {
   "nome": "Garanti regionali per l'infanzia e l'adolescenza",
   "cosa": "Solo rinvio: primo destinatario delle segnalazioni sui diritti dei minori nella propria regione.",
   "url": "https://www.garanteinfanzia.org/rete-dei-garanti",
   "pec": null,
   "email": null,
   "modulo_online": null,
   "termini": null,
   "note": "Elenco ufficiale e mappa sul sito AGIA (non letti in dettaglio). In alcune regioni la funzione è unita al difensore civico o al garante dei diritti della persona (es. Marche, Molise).",
   "verificato_il": "2026-10-25"
  }
 ]
};
