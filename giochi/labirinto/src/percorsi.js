// Generato da scripts/giochi-labirinto-dati.py da giochi/labirinto/dati/percorsi: non modificare a mano.
// Ogni bivio: la regola, la norma con l'articolo e il link dello strumento del sito (strumento), e dove sta nel repository (rif).
export default [
 {
  "id": "buca",
  "titolo": "La buca sotto casa",
  "pratica": "Nella tua via, in centro città, c'è una buca profonda che si allarga. Vuoi farla riparare: a chi scrivere, come, cosa allegare e cosa fare se nessuno risponde.",
  "strumento": "segnalazioni",
  "livello": 1,
  "bivi": [
   {
    "tipo": "ufficio",
    "domanda": "La buca è in una via del centro abitato, tra i cartelli di inizio e fine città. Di chi è la strada?",
    "scelte": [
     {
      "testo": "Della Provincia",
      "giusta": false,
      "giorni": 15,
      "perche": "La Provincia ha le strade provinciali, con la sigla SP. Una via dentro il centro abitato è del Comune."
     },
     {
      "testo": "Del Comune",
      "giusta": true
     },
     {
      "testo": "Dell'ANAS",
      "giusta": false,
      "giorni": 15,
      "perche": "L'ANAS gestisce le strade statali, con la sigla SS. Una via dentro il centro abitato è del Comune."
     }
    ],
    "spiega": "Dentro il centro abitato la strada è del Comune, salvo i tratti di strade statali, regionali o provinciali nei centri fino a 10.000 abitanti. Nel dubbio scrivi al Comune: deve inoltrare.",
    "fonte": {
     "norma": "Codice della strada, art. 2, comma 7",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art2"
    },
    "rif": "segnalazioni/dati/fonti.json:39"
   },
   {
    "tipo": "documento",
    "domanda": "Prima di scrivere: cosa prepari da allegare alla segnalazione?",
    "scelte": [
     {
      "testo": "Niente: il nome della via basta",
      "giusta": false,
      "giorni": 5,
      "perche": "Senza un punto preciso la segnalazione rischia di restare ferma. Servono indirizzo o coordinate, e le foto."
     },
     {
      "testo": "Solo una descrizione, senza foto",
      "giusta": false,
      "giorni": 5,
      "perche": "Una foto da vicino e una da lontano, con un riferimento riconoscibile, valgono più di molte parole."
     },
     {
      "testo": "Foto da vicino e da lontano, con indirizzo o posizione",
      "giusta": true
     }
    ],
    "spiega": "Allega foto con la data e un riferimento riconoscibile (civico, cartello, palo), più l'indirizzo o le coordinate. La segnalazione prova anche che l'ente sapeva del pericolo.",
    "fonte": {
     "norma": "Codice civile, art. 2051",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art2051"
    },
    "rif": "segnalazioni/dati/fonti.json:73"
   },
   {
    "tipo": "lettera",
    "domanda": "Come mandi la segnalazione al Comune?",
    "scelte": [
     {
      "testo": "Con una telefonata all'ufficio tecnico",
      "giusta": false,
      "giorni": 10,
      "perche": "Una telefonata non lascia traccia. La PEC prova l'invio e la consegna, e poi chiedi la ricevuta con il protocollo."
     },
     {
      "testo": "Dalla tua PEC, chiedendo il numero di protocollo",
      "giusta": true
     },
     {
      "testo": "Con una lettera senza firma, per non esporti",
      "giusta": false,
      "giorni": 10,
      "perche": "Una segnalazione firmata vale di più di una anonima, e ti serve un recapito per avere risposta."
     }
    ],
    "spiega": "La PEC (posta elettronica certificata) prova invio e consegna; senza PEC usa l'email e conserva la ricevuta. Per ogni segnalazione hai diritto a una ricevuta con il protocollo.",
    "fonte": {
     "norma": "L. 241/1990, art. 18-bis",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art18bis"
    },
    "rif": "segnalazioni/src/regole.js:146"
   },
   {
    "tipo": "termine",
    "domanda": "Hai mandato la PEC. La legge dà al Comune un termine fisso per rispondere alla tua segnalazione?",
    "scelte": [
     {
      "testo": "Sì: 30 giorni, sempre, come per ogni domanda",
      "giusta": false,
      "giorni": 30,
      "perche": "I 30 giorni valgono per i procedimenti che nascono da un'istanza. Una segnalazione non apre sempre un procedimento con obbligo di risposta."
     },
     {
      "testo": "No, e quindi non puoi chiedere più nulla",
      "giusta": false,
      "giorni": 60,
      "perche": "Riparare resta un dovere dell'ente proprietario della strada: dopo circa 30 giorni senza novità puoi sollecitare."
     },
     {
      "testo": "No: dopo circa 30 giorni senza novità mandi un sollecito",
      "giusta": true
     }
    ],
    "spiega": "Una segnalazione non apre sempre un procedimento con risposta obbligatoria entro 30 giorni. Dopo circa 30 giorni senza novità sollecita: non è un termine di legge, è un tempo ragionevole.",
    "fonte": {
     "norma": "L. 241/1990, art. 2",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
    },
    "rif": "segnalazioni/dati/fonti.json:1095"
   },
   {
    "tipo": "diritto",
    "domanda": "Anche il sollecito resta senza risposta e la buca è sempre lì. Cosa puoi fare ancora?",
    "scelte": [
     {
      "testo": "Chiedere gli atti della pratica e scrivere al difensore civico",
      "giusta": true
     },
     {
      "testo": "Niente: era solo una segnalazione",
      "giusta": false,
      "giorni": 60,
      "perche": "Riparare la strada è un compito dell'ente proprietario. Puoi ancora chiedere gli atti e rivolgerti al difensore civico."
     },
     {
      "testo": "Chiamare il 112 per sapere quando faranno i lavori",
      "giusta": false,
      "giorni": 15,
      "perche": "Il 112 è per i pericoli immediati, non per sapere i tempi: quelli li chiedi con l'accesso agli atti."
     }
    ],
    "spiega": "La manutenzione è compito dell'ente proprietario. Chiedi gli atti (stato della pratica, interventi previsti) e scrivi al difensore civico; se il pericolo è serio, esposto a polizia locale o carabinieri.",
    "fonte": {
     "norma": "Codice della strada, art. 14",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art14"
    },
    "rif": "segnalazioni/src/regole.js:163"
   }
  ]
 },
 {
  "id": "garanzia",
  "titolo": "La lavatrice che si blocca",
  "pratica": "Hai comprato online una lavatrice e dopo 8 mesi si blocca. In più, le scarpe arrivate ieri dallo stesso negozio online non ti piacciono più.",
  "strumento": "garanzia",
  "livello": 1,
  "bivi": [
   {
    "tipo": "ufficio",
    "domanda": "La lavatrice non parte più. A chi chiedi di sistemarla in garanzia?",
    "scelte": [
     {
      "testo": "Al produttore, la marca scritta sulla lavatrice",
      "giusta": false,
      "giorni": 15,
      "perche": "La garanzia legale è del venditore, anche se ti rimanda all'assistenza della marca."
     },
     {
      "testo": "Al venditore che te l'ha venduta",
      "giusta": true
     },
     {
      "testo": "All'Autorità garante della concorrenza e del mercato",
      "giusta": false,
      "giorni": 15,
      "perche": "All'Autorità si segnala il venditore che nega la garanzia legale. Prima si scrive al venditore."
     }
    ],
    "spiega": "Dei difetti risponde il venditore, non il produttore. Scrivigli per email, PEC o raccomandata, allega lo scontrino o la conferma dell'ordine e tieni la ricevuta.",
    "fonte": {
     "norma": "Codice del consumo, art. 133",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art133"
    },
    "rif": "garanzia/src/regole.js:99"
   },
   {
    "tipo": "termine",
    "domanda": "L'hai ricevuta 8 mesi fa. Di quali difetti risponde il venditore?",
    "scelte": [
     {
      "testo": "Di quelli comparsi entro due anni dalla consegna",
      "giusta": true
     },
     {
      "testo": "Solo di quelli del primo anno dall'acquisto",
      "giusta": false,
      "giorni": 30,
      "perche": "Per un oggetto nuovo la garanzia dura due anni. Un anno vale solo per l'usato, e solo se il contratto lo scrive."
     },
     {
      "testo": "Di quelli comparsi entro due anni dall'ordine",
      "giusta": false,
      "giorni": 30,
      "perche": "Conta la consegna, non l'ordine: i due anni partono dal giorno in cui l'hai ricevuta."
     }
    ],
    "spiega": "Il venditore risponde dei difetti comparsi entro due anni dalla consegna. Per far valere la garanzia hai 26 mesi dalla consegna; una lettera scritta interrompe il termine.",
    "fonte": {
     "norma": "Codice del consumo, art. 133",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art133"
    },
    "rif": "garanzia/src/regole.js:76"
   },
   {
    "tipo": "diritto",
    "domanda": "Il venditore dice che tocca a te provare che il difetto c'era già alla consegna. Ha ragione?",
    "scelte": [
     {
      "testo": "Sì: senza una perizia non ti spetta niente",
      "giusta": false,
      "giorni": 30,
      "perche": "La prova tocca a te solo se il difetto compare dopo un anno dalla consegna. Il tuo è comparso dopo 8 mesi."
     },
     {
      "testo": "No: nel primo anno si presume che ci fosse già",
      "giusta": true
     }
    ],
    "spiega": "Un difetto comparso entro un anno dalla consegna si presume presente fin dall'inizio: è il venditore a dover dimostrare il contrario.",
    "fonte": {
     "norma": "Codice del consumo, art. 135",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art135"
    },
    "rif": "garanzia/src/regole.js:85"
   },
   {
    "tipo": "diritto",
    "domanda": "Che cosa chiedi per primo al venditore?",
    "scelte": [
     {
      "testo": "Subito la restituzione dei soldi",
      "giusta": false,
      "giorni": 30,
      "perche": "Prima vengono riparazione o sostituzione. Sconto o restituzione solo se non arrivano in tempi ragionevoli, il difetto torna o è grave."
     },
     {
      "testo": "La riparazione, pagando tu il pezzo",
      "giusta": false,
      "giorni": 60,
      "perche": "In garanzia riparazione e sostituzione sono gratuite: non devi pagare niente."
     },
     {
      "testo": "Riparazione o sostituzione, gratis",
      "giusta": true
     }
    ],
    "spiega": "Prima riparazione o sostituzione, gratis e in tempi ragionevoli. Se non arrivano o il difetto si ripresenta, chiedi uno sconto o la restituzione; per un difetto lieve, la restituzione no.",
    "fonte": {
     "norma": "Codice del consumo, art. 135-bis",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art135bis"
    },
    "rif": "garanzia/src/regole.js:94"
   },
   {
    "tipo": "termine",
    "domanda": "Le scarpe comprate online ti sono arrivate ieri e non le vuoi più. Entro quando puoi ripensarci?",
    "scelte": [
     {
      "testo": "Entro 14 giorni dall'ordine",
      "giusta": false,
      "giorni": 30,
      "perche": "Per un oggetto i 14 giorni partono dalla consegna, non dall'ordine."
     },
     {
      "testo": "Non puoi: le scarpe non sono difettose",
      "giusta": false,
      "giorni": 60,
      "perche": "Per gli acquisti online il ripensamento non richiede un difetto né un motivo: hai 14 giorni."
     },
     {
      "testo": "Entro 14 giorni dalla consegna, senza dare un motivo",
      "giusta": true
     }
    ],
    "spiega": "Online hai 14 giorni dalla consegna per recedere, senza motivo e senza penali: usa il pulsante «recedere dal contratto qui» o scrivi per email o PEC. Il rimborso va fatto entro 14 giorni.",
    "fonte": {
     "norma": "Codice del consumo, art. 52",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art52"
    },
    "rif": "garanzia/src/regole.js:128"
   }
  ]
 },
 {
  "id": "residenza",
  "titolo": "Casa nuova, residenza nuova",
  "pratica": "Vai in affitto in un altro Comune. Devi spostare la residenza e poi ti servirà un certificato di residenza da dare a un privato.",
  "strumento": "navigatore",
  "livello": 1,
  "bivi": [
   {
    "tipo": "ufficio",
    "domanda": "Dove fai la dichiarazione di residenza?",
    "scelte": [
     {
      "testo": "All'anagrafe del Comune che lasci",
      "giusta": false,
      "giorni": 15,
      "perche": "La dichiarazione va al Comune della nuova residenza: è lui che poi fa l'accertamento."
     },
     {
      "testo": "All'Agenzia delle Entrate",
      "giusta": false,
      "giorni": 15,
      "perche": "La residenza è una pratica dell'anagrafe: si fa al Comune della nuova casa o online."
     },
     {
      "testo": "All'anagrafe del nuovo Comune, o online sull'Anagrafe nazionale (ANPR)",
      "giusta": true
     }
    ],
    "spiega": "Ti rivolgi all'ufficio anagrafe del Comune della nuova residenza, di persona o con i suoi canali, oppure online sul portale ANPR con la tua identità digitale. Il servizio è gratuito.",
    "fonte": {
     "norma": "ANPR – Cambio di residenza",
     "url": "https://www.anagrafenazionale.interno.it/area-cittadino/cambio-di-residenza/"
    },
    "rif": "navigatore/dati/schede-anagrafe-famiglia.json:18"
   },
   {
    "tipo": "termine",
    "domanda": "Hai traslocato. Entro quanto devi dichiarare la nuova residenza?",
    "scelte": [
     {
      "testo": "Entro 20 giorni dal trasferimento",
      "giusta": true
     },
     {
      "testo": "Entro 90 giorni, con calma",
      "giusta": false,
      "giorni": 30,
      "perche": "Il termine è più breve: la dichiarazione va resa entro 20 giorni dal trasferimento."
     },
     {
      "testo": "Quando vuoi: non c'è un termine",
      "giusta": false,
      "giorni": 30,
      "perche": "Il termine c'è: la dichiarazione va resa entro 20 giorni dal trasferimento."
     }
    ],
    "spiega": "La dichiarazione va resa entro 20 giorni dal trasferimento. Gli effetti partono dalla data in cui la presenti.",
    "fonte": {
     "norma": "D.l. 5/2012, art. 5",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2012-02-09;5~art5"
    },
    "rif": "navigatore/dati/schede-anagrafe-famiglia.json:44"
   },
   {
    "tipo": "documento",
    "domanda": "Vivi in affitto. Che cosa ti serve per la dichiarazione?",
    "scelte": [
     {
      "testo": "Una marca da bollo da 16 €",
      "giusta": false,
      "giorni": 5,
      "perche": "Il cambio di residenza è gratuito, anche online: diffida di chi chiede soldi per farlo."
     },
     {
      "testo": "Estremi del contratto e carta d'identità del proprietario",
      "giusta": true
     },
     {
      "testo": "Il certificato di residenza del vecchio Comune",
      "giusta": false,
      "giorni": 5,
      "perche": "Non serve: per l'affitto bastano gli estremi del contratto e la carta d'identità del proprietario."
     }
    ],
    "spiega": "Chi è in affitto indica gli estremi del contratto e la carta d'identità del proprietario; chi è proprietario, gli estremi catastali. La pratica è gratuita.",
    "fonte": {
     "norma": "ANPR – Cambio di residenza",
     "url": "https://www.anagrafenazionale.interno.it/area-cittadino/cambio-di-residenza/"
    },
    "rif": "navigatore/dati/schede-anagrafe-famiglia.json:34"
   },
   {
    "tipo": "termine",
    "domanda": "Hai presentato la dichiarazione. Entro quanto il Comune fa gli accertamenti?",
    "scelte": [
     {
      "testo": "Entro 2 giorni lavorativi, e lì finisce tutto",
      "giusta": false,
      "giorni": 30,
      "perche": "In 2 giorni lavorativi il Comune registra la dichiarazione; poi ha fino a 45 giorni per l'accertamento."
     },
     {
      "testo": "Non c'è limite: finché non controllano non sei residente",
      "giusta": false,
      "giorni": 30,
      "perche": "Gli effetti partono dalla data della dichiarazione, e se in 45 giorni il Comune non segnala problemi vale il silenzio-assenso."
     },
     {
      "testo": "Entro 45 giorni; se tace, la dichiarazione vale",
      "giusta": true
     }
    ],
    "spiega": "Il Comune registra la dichiarazione entro 2 giorni lavorativi e ha 45 giorni per l'accertamento. Se tace, vale il silenzio-assenso; gli effetti partono dalla data della dichiarazione.",
    "fonte": {
     "norma": "ANPR – Cambio di residenza",
     "url": "https://www.anagrafenazionale.interno.it/area-cittadino/cambio-di-residenza/"
    },
    "rif": "navigatore/dati/schede-anagrafe-famiglia.json:43"
   },
   {
    "tipo": "ufficio",
    "domanda": "Ora ti serve un certificato di residenza da dare a un privato. Dove lo prendi, e quanto costa?",
    "scelte": [
     {
      "testo": "Allo sportello del vecchio Comune, gratis",
      "giusta": false,
      "giorni": 15,
      "perche": "Lo scarichi tu da ANPR, dove risulti iscritto. Ed è gratis solo se l'uso rientra nelle esenzioni di legge."
     },
     {
      "testo": "Lo scarichi da ANPR: bollo da 16 €, se non hai un'esenzione",
      "giusta": true
     },
     {
      "testo": "Lo scarichi da ANPR, ed è sempre gratis",
      "giusta": false,
      "giorni": 10,
      "perche": "Non è vero che online è sempre gratis: senza un motivo di esenzione si paga il bollo da 16 €."
     }
    ],
    "spiega": "Su ANPR scarichi subito il certificato, che vale 3 mesi: gratis solo per gli usi esenti, se no bollo da 16 €. Per uffici pubblici, scuole e gestori di servizi pubblici basta l'autocertificazione.",
    "fonte": {
     "norma": "ANPR – Certificati ed estratti",
     "url": "https://www.anagrafenazionale.interno.it/area-cittadino/certificati/"
    },
    "rif": "navigatore/dati/schede-anagrafe-famiglia.json:319"
   }
  ]
 },
 {
  "id": "bonus",
  "titolo": "L'assegno per i figli",
  "pratica": "Hai due figli piccoli e vuoi l'Assegno unico. Non hai mai fatto l'ISEE e non sai da dove cominciare.",
  "strumento": "mi-spetta",
  "livello": 1,
  "bivi": [
   {
    "tipo": "ufficio",
    "domanda": "A chi chiedi l'Assegno unico per i figli?",
    "scelte": [
     {
      "testo": "All'ufficio servizi sociali del Comune",
      "giusta": false,
      "giorni": 15,
      "perche": "Al Comune si chiede l'assegno di maternità dei Comuni, che è un'altra cosa. L'Assegno unico lo paga l'INPS."
     },
     {
      "testo": "All'INPS",
      "giusta": true
     },
     {
      "testo": "All'Agenzia delle Entrate, nel 730",
      "giusta": false,
      "giorni": 15,
      "perche": "Nel 730 metti la detrazione per i figli dai 21 ai 29 anni. L'Assegno unico è un assegno mensile dell'INPS."
     }
    ],
    "spiega": "L'Assegno unico è un assegno mensile dell'INPS per ogni figlio fino a 21 anni, senza limiti di età se il figlio ha una disabilità.",
    "fonte": {
     "norma": "INPS, circolare n. 7 del 30/1/2026 sull'Assegno unico 2026",
     "url": "https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/01/Circolare_15152/Allegati/16548_Circolare-numero-7-del-30-01-2026.pdf"
    },
    "rif": "mi-spetta/src/prestazioni/famiglia.js:40"
   },
   {
    "tipo": "documento",
    "domanda": "Cosa fai prima della domanda, per avere l'importo che ti spetta davvero?",
    "scelte": [
     {
      "testo": "Niente: l'ISEE lo calcola l'INPS da sola",
      "giusta": false,
      "giorni": 5,
      "perche": "L'ISEE non arriva da solo: prima presenti la DSU, la dichiarazione per l'ISEE, online all'INPS o gratis al CAF."
     },
     {
      "testo": "Porti il 730 dell'anno scorso",
      "giusta": false,
      "giorni": 5,
      "perche": "Per l'importo dell'Assegno unico conta l'ISEE, non il 730. L'ISEE si ottiene presentando la DSU."
     },
     {
      "testo": "Fai la DSU per l'ISEE, online all'INPS o gratis al CAF",
      "giusta": true
     }
    ],
    "spiega": "Prima fai la DSU (la dichiarazione per l'ISEE), online all'INPS o gratis in un CAF. Con l'ISEE l'INPS calcola l'assegno con la sua tabella 2026.",
    "fonte": {
     "norma": "INPS, scheda Assegno unico e universale per i figli a carico",
     "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-unico-e-universale-per-i-figli-a-carico-55984.assegno-unico-e-universale-per-i-figli-a-carico.html"
    },
    "rif": "mi-spetta/src/prestazioni/famiglia.js:88"
   },
   {
    "tipo": "diritto",
    "domanda": "L'ISEE non è ancora pronto. Se fai la domanda adesso, cosa succede?",
    "scelte": [
     {
      "testo": "Ti spetta comunque il minimo: 58,30 € al mese per figlio minorenne",
      "giusta": true
     },
     {
      "testo": "Non ti spetta niente finché non hai l'ISEE",
      "giusta": false,
      "giorni": 60,
      "perche": "L'Assegno unico spetta a tutti: senza ISEE prendi il minimo, con l'ISEE di più."
     },
     {
      "testo": "Prendi il massimo, 203,80 € al mese per figlio",
      "giusta": false,
      "giorni": 5,
      "perche": "Senza ISEE l'INPS paga il minimo, 58,30 € per figlio minorenne. Fino a 203,80 € si arriva solo con l'ISEE, nelle fasce più basse."
     }
    ],
    "spiega": "Senza ISEE l'assegno spetta lo stesso, al minimo. Con l'ISEE potresti avere fino a 203,80 € al mese per ogni figlio minorenne.",
    "fonte": {
     "norma": "INPS, tabella degli importi 2026 (allegato 1 alla circolare 7/2026)",
     "url": "https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/01/Circolare_15152/Allegati/16549_Circolare-numero-7-del-30-01-2026_Allegato-n-1.pdf"
    },
    "rif": "mi-spetta/src/prestazioni/famiglia.js:67"
   },
   {
    "tipo": "lettera",
    "domanda": "Hai fatto la DSU. Come presenti la domanda di Assegno unico?",
    "scelte": [
     {
      "testo": "Con una raccomandata alla sede INPS della tua città",
      "giusta": false,
      "giorni": 10,
      "perche": "La domanda si presenta in tre modi: sul sito inps.it, al contact center 803 164 o con un patronato."
     },
     {
      "testo": "Online su inps.it, al contact center 803 164 o con un patronato",
      "giusta": true
     }
    ],
    "spiega": "La domanda si fa una volta all'INPS, con l'IBAN per i pagamenti, e continua negli anni seguenti: poi comunichi solo i cambiamenti, come la nascita di un altro figlio.",
    "fonte": {
     "norma": "INPS, scheda Assegno unico e universale per i figli a carico",
     "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-unico-e-universale-per-i-figli-a-carico-55984.assegno-unico-e-universale-per-i-figli-a-carico.html"
    },
    "rif": "mi-spetta/src/prestazioni/famiglia.js:87"
   },
   {
    "tipo": "termine",
    "domanda": "L'anno dopo l'assegno continua. Entro quando rinnovi l'ISEE per non perdere gli arretrati?",
    "scelte": [
     {
      "testo": "Non serve: l'ISEE vale per sempre",
      "giusta": false,
      "giorni": 30,
      "perche": "L'ISEE va rinnovato ogni anno. È la domanda di Assegno unico che continua da sola, non l'ISEE."
     },
     {
      "testo": "Entro il 31 dicembre",
      "giusta": false,
      "giorni": 30,
      "perche": "Per non perdere gli arretrati dell'Assegno unico la data è il 30 giugno di ogni anno."
     },
     {
      "testo": "Entro il 30 giugno",
      "giusta": true
     }
    ],
    "spiega": "La domanda resta valida, ma l'ISEE si rifà ogni anno: rinnovalo entro il 30 giugno per non perdere gli arretrati.",
    "fonte": {
     "norma": "INPS, scheda Assegno unico e universale per i figli a carico",
     "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-unico-e-universale-per-i-figli-a-carico-55984.assegno-unico-e-universale-per-i-figli-a-carico.html"
    },
    "rif": "mi-spetta/src/prestazioni/famiglia.js:87"
   }
  ]
 },
 {
  "id": "multa",
  "titolo": "La multa arrivata a casa",
  "pratica": "Ti arriva per posta un verbale per eccesso di velocità preso dall'autovelox. Sulla busta, la spedizione risulta 120 giorni dopo il fatto.",
  "strumento": "faccio-ricorso",
  "livello": 2,
  "bivi": [
   {
    "tipo": "termine",
    "domanda": "Vivi in Italia e il verbale è stato spedito 120 giorni dopo l'infrazione. È in regola?",
    "scelte": [
     {
      "testo": "Sì: l'ente ha 360 giorni per spedirlo",
      "giusta": false,
      "giorni": 30,
      "perche": "I 360 giorni valgono solo per chi risiede all'estero. Per chi vive in Italia sono 90."
     },
     {
      "testo": "No: andava spedito entro 90 giorni dalla violazione",
      "giusta": true
     },
     {
      "testo": "Sì: si contano solo i giorni lavorativi, e sono meno di 90",
      "giusta": false,
      "giorni": 30,
      "perche": "Si contano i giorni di calendario, sabati e festivi compresi: 120 giorni sono oltre il limite."
     }
    ],
    "spiega": "Il verbale va spedito entro 90 giorni dalla violazione (360 per chi vive all'estero). Conta la data di spedizione: oltre il termine, l'obbligo di pagare si estingue.",
    "fonte": {
     "norma": "Codice della Strada, art. 201, commi 1 e 5",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art201"
    },
    "rif": "faccio-ricorso/src/regole.js:42"
   },
   {
    "tipo": "diritto",
    "domanda": "Vuoi contestare il verbale. Intanto ti conviene pagare con lo sconto del 30% entro 5 giorni?",
    "scelte": [
     {
      "testo": "Sì: paghi meno, e col ricorso poi riavrai i soldi",
      "giusta": false,
      "giorni": 60,
      "perche": "Il pagamento chiude la questione: dopo, il ricorso non è più possibile."
     },
     {
      "testo": "Meglio chiedere di pagare a rate, così non perdi il ricorso",
      "giusta": false,
      "giorni": 60,
      "perche": "Chiedere le rate vuol dire rinunciare al ricorso."
     },
     {
      "testo": "No: se paghi, non puoi più fare ricorso",
      "giusta": true
     }
    ],
    "spiega": "Lo sconto del 30% conviene solo se decidi di non fare ricorso. Pagare, anche con lo sconto, o chiedere le rate chiude la contestazione.",
    "fonte": {
     "norma": "Codice della Strada, art. 202",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art202"
    },
    "rif": "faccio-ricorso/src/regole.js:250"
   },
   {
    "tipo": "ufficio",
    "domanda": "Il tuo motivo è oggettivo: la notifica tardiva. A chi fai ricorso, spendendo meno?",
    "scelte": [
     {
      "testo": "Al Prefetto: il ricorso è gratis",
      "giusta": true
     },
     {
      "testo": "Al Giudice di pace: è gratis anche lì",
      "giusta": false,
      "giorni": 15,
      "perche": "Dal Giudice di pace paghi il contributo unificato, 43 € per multe fino a 1.100 €, più 27 € di anticipazioni."
     },
     {
      "testo": "A tutti e due, per avere due possibilità",
      "giusta": false,
      "giorni": 15,
      "perche": "Il ricorso al Prefetto e quello al Giudice di pace sono alternativi: ne scegli uno."
     }
    ],
    "spiega": "Il ricorso al Prefetto è gratuito e, se non decide entro 180 giorni, si intende accolto. Se lo respinge, paghi almeno il doppio della sanzione minima, più le spese.",
    "fonte": {
     "norma": "Codice della Strada, art. 203",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art203"
    },
    "rif": "faccio-ricorso/src/regole.js:252"
   },
   {
    "tipo": "termine",
    "domanda": "Quanto tempo hai per mandare il ricorso al Prefetto?",
    "scelte": [
     {
      "testo": "30 giorni dalla notifica",
      "giusta": false,
      "giorni": 30,
      "perche": "30 giorni è il termine per il Giudice di pace. Per il Prefetto i giorni sono 60."
     },
     {
      "testo": "60 giorni dalla notifica, più tutto agosto",
      "giusta": false,
      "giorni": 30,
      "perche": "Per il Prefetto non ci sono proroghe per agosto o per i festivi: il sessantesimo giorno è l'ultimo."
     },
     {
      "testo": "60 giorni dalla notifica, senza proroghe",
      "giusta": true
     }
    ],
    "spiega": "Il ricorso al Prefetto va mandato entro 60 giorni dalla notifica. La sospensione di agosto e i festivi non allungano il termine.",
    "fonte": {
     "norma": "Codice della Strada, art. 203",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art203"
    },
    "rif": "faccio-ricorso/src/regole.js:272"
   },
   {
    "tipo": "documento",
    "domanda": "Cosa alleghi al ricorso per provare che il verbale è partito tardi?",
    "scelte": [
     {
      "testo": "La carta di circolazione del veicolo",
      "giusta": false,
      "giorni": 5,
      "perche": "La carta di circolazione serve quando i dati del veicolo sono sbagliati. Per la notifica tardiva serve la data di spedizione."
     },
     {
      "testo": "La busta o l'avviso di ricevimento con la data di spedizione",
      "giusta": true
     },
     {
      "testo": "Basta la copia del verbale",
      "giusta": false,
      "giorni": 5,
      "perche": "Oltre al verbale e a un documento d'identità serve la prova della data: la busta o l'avviso di ricevimento."
     }
    ],
    "spiega": "Al ricorso alleghi la copia del verbale, un documento d'identità e la busta o l'avviso con la data di spedizione (o la ricevuta, se è arrivato via PEC).",
    "fonte": {
     "norma": "Codice della Strada, art. 201, comma 1",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art201"
    },
    "rif": "faccio-ricorso/src/documento.js:20"
   },
   {
    "tipo": "termine",
    "domanda": "Il verbale toglie anche punti dalla patente. Entro quando comunichi chi era alla guida?",
    "scelte": [
     {
      "testo": "Entro 5 giorni, come per lo sconto",
      "giusta": false,
      "giorni": 30,
      "perche": "I 5 giorni valgono solo per lo sconto del 30%. Per dire chi guidava hai 60 giorni dalla notifica."
     },
     {
      "testo": "Entro 60 giorni dalla notifica",
      "giusta": true
     },
     {
      "testo": "Non serve: i punti li perde chi ha l'auto intestata",
      "giusta": false,
      "giorni": 30,
      "perche": "La comunicazione serve proprio a togliere i punti alla persona giusta. Va fatta entro 60 giorni dalla notifica."
     }
    ],
    "spiega": "Comunica chi guidava entro 60 giorni. Se fai ricorso, scrivilo anche lì: per la Cassazione il ricorso pendente giustifica la mancata comunicazione, ma non tutti i giudici concordano.",
    "fonte": {
     "norma": "Codice della Strada, art. 126-bis, comma 2",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art126bis"
    },
    "rif": "faccio-ricorso/src/regole.js:274"
   }
  ]
 },
 {
  "id": "volo",
  "titolo": "Il volo in ritardo",
  "pratica": "Il tuo volo da un aeroporto italiano a una città europea a circa 2.000 km arriva con 4 ore e mezza di ritardo. Vuoi capire cosa ti spetta.",
  "strumento": "mi-rimborsano",
  "livello": 2,
  "bivi": [
   {
    "tipo": "diritto",
    "domanda": "Sei arrivato a destinazione con 4 ore e mezza di ritardo. Ti spetta una compensazione in denaro?",
    "scelte": [
     {
      "testo": "No: spetta solo se il volo viene cancellato",
      "giusta": false,
      "giorni": 60,
      "perche": "Per la Corte di giustizia (sentenza Sturgeon) un ritardo all'arrivo di 3 ore o più dà diritto alla compensazione come una cancellazione."
     },
     {
      "testo": "Sì: spetta con 3 ore o più di ritardo all'arrivo",
      "giusta": true
     },
     {
      "testo": "Sì, ma solo da 5 ore di ritardo in su",
      "giusta": false,
      "giorni": 60,
      "perche": "Le 5 ore servono per rinunciare al viaggio e avere il rimborso del biglietto. Per la compensazione bastano 3 ore."
     }
    ],
    "spiega": "Conta il ritardo all'arrivo alla destinazione finale, quando si apre il portellone, non quando l'aereo atterra.",
    "fonte": {
     "norma": "Corte di giustizia UE, sentenza Sturgeon (C-402/07)",
     "url": "https://publications.europa.eu/resource/celex/62007CJ0402"
    },
    "rif": "mi-rimborsano/src/regole.js:106"
   },
   {
    "tipo": "diritto",
    "domanda": "Il volo era dentro l'Europa, di circa 2.000 km in linea d'aria. Quanto chiedi a passeggero?",
    "scelte": [
     {
      "testo": "250 €",
      "giusta": false,
      "giorni": 10,
      "perche": "250 € valgono per i voli fino a 1.500 km. Per una tratta europea oltre 1.500 km sono 400 €."
     },
     {
      "testo": "Il prezzo del biglietto",
      "giusta": false,
      "giorni": 10,
      "perche": "La compensazione è una cifra fissa che dipende dalla distanza. Il rimborso del biglietto è un'altra cosa, per chi rinuncia al viaggio."
     },
     {
      "testo": "400 €",
      "giusta": true
     }
    ],
    "spiega": "La compensazione va da 250 € a 600 € secondo la distanza in linea d'aria. Si paga in denaro, non in buoni, se non sei d'accordo diversamente.",
    "fonte": {
     "norma": "Regolamento (CE) 261/2004, art. 7",
     "url": "https://publications.europa.eu/resource/celex/32004R0261"
    },
    "rif": "mi-rimborsano/src/regole.js:59"
   },
   {
    "tipo": "diritto",
    "domanda": "La compagnia dice che il ritardo è dovuto a un guasto tecnico dell'aereo. Perdi la compensazione?",
    "scelte": [
     {
      "testo": "No: i guasti rientrano nella normale attività della compagnia",
      "giusta": true
     },
     {
      "testo": "Sì: un guasto è una circostanza eccezionale",
      "giusta": false,
      "giorni": 60,
      "perche": "Per la Corte di giustizia i problemi tecnici fanno parte della normale attività della compagnia: la compensazione è dovuta."
     },
     {
      "testo": "Sì, a meno che tu non provi che il guasto non c'era",
      "giusta": false,
      "giorni": 30,
      "perche": "La prova tocca alla compagnia: è lei che deve dimostrare una circostanza eccezionale e di aver fatto il possibile per evitarla."
     }
    ],
    "spiega": "Possono escludere la compensazione maltempo, decisioni del controllo del traffico aereo, scioperi esterni e rischi per la sicurezza, se la compagnia li prova. Pasti, bevande e albergo spettano comunque.",
    "fonte": {
     "norma": "Regolamento (CE) 261/2004, art. 5, par. 3",
     "url": "https://publications.europa.eu/resource/celex/32004R0261"
    },
    "rif": "mi-rimborsano/src/regole.js:137"
   },
   {
    "tipo": "ufficio",
    "domanda": "A chi chiedi la compensazione, e come?",
    "scelte": [
     {
      "testo": "A voce, al banco della compagnia in aeroporto",
      "giusta": false,
      "giorni": 10,
      "perche": "Va chiesta per iscritto, con il modulo online della compagnia o via PEC, e conservando la ricevuta."
     },
     {
      "testo": "Alla società che gestisce l'aeroporto",
      "giusta": false,
      "giorni": 15,
      "perche": "La compensazione la deve la compagnia che ha operato il volo: è a lei che va la richiesta scritta."
     },
     {
      "testo": "Per iscritto alla compagnia che ha operato il volo",
      "giusta": true
     }
    ],
    "spiega": "Scrivi alla compagnia che ha operato il volo, con il suo modulo online o via PEC, allegando biglietto e carta d'imbarco. Conta chi opera il volo, anche se il biglietto è di un'altra compagnia.",
    "fonte": {
     "norma": "ENAC, Modalità di reclamo per negato imbarco, cancellazione e ritardo",
     "url": "https://www.enac.gov.it/passeggeri/diritti-dei-passeggeri/modalita-di-reclamo-per-negato-imbarco-cancellazione-ritardo/"
    },
    "rif": "mi-rimborsano/src/regole.js:177"
   },
   {
    "tipo": "termine",
    "domanda": "Entro quando conviene mandare il reclamo scritto alla compagnia?",
    "scelte": [
     {
      "testo": "Con calma: hai 2 anni, come dice la Convenzione di Montreal",
      "giusta": false,
      "giorni": 30,
      "perche": "La Cassazione (ordinanza 4427/2024) ha escluso i 2 anni di Montreal per la compensazione, senza dire quale termine valga."
     },
     {
      "testo": "Subito, e comunque entro 6 mesi dal volo",
      "giusta": true
     },
     {
      "testo": "Non c'è fretta: hai sempre 10 anni",
      "giusta": false,
      "giorni": 30,
      "perche": "La legge non fissa un termine chiaro e i giudici non sono d'accordo. Alcune compagnie rifiutano i reclami oltre 6 mesi."
     }
    ],
    "spiega": "La legge non fissa un termine chiaro: l'ENAC consiglia di reclamare entro 6 mesi. Scrivi con PEC o raccomandata, così hai la prova della data.",
    "fonte": {
     "norma": "ENAC, Modalità di reclamo per negato imbarco, cancellazione e ritardo",
     "url": "https://www.enac.gov.it/passeggeri/diritti-dei-passeggeri/modalita-di-reclamo-per-negato-imbarco-cancellazione-ritardo/"
    },
    "rif": "mi-rimborsano/src/regole.js:154"
   },
   {
    "tipo": "ufficio",
    "domanda": "Sono passati 30 giorni dal reclamo e la compagnia non risponde. Cosa fai per avere i soldi?",
    "scelte": [
     {
      "testo": "Fai subito causa al Giudice di pace",
      "giusta": false,
      "giorni": 10,
      "perche": "Prima del giudice la conciliazione è obbligatoria. Si chiede gratis su ConciliaWeb dell'Autorità dei trasporti o alla Camera di commercio."
     },
     {
      "testo": "Chiedi la conciliazione gratuita all'Autorità dei trasporti",
      "giusta": true
     },
     {
      "testo": "Reclami all'ENAC e aspetti che ti paghi",
      "giusta": false,
      "giorni": 15,
      "perche": "L'ENAC è gratis e sanziona la compagnia, ma non ti paga. E la segnalazione si fa dopo 6 settimane senza risposta."
     }
    ],
    "spiega": "Dopo 30 giorni senza risposta, o subito dopo un rifiuto, chiedi la conciliazione gratuita su ConciliaWeb, entro un anno dal reclamo. Serve prima di andare dal giudice.",
    "fonte": {
     "norma": "Autorità di regolazione dei trasporti, delibera 21/2023, allegato A",
     "url": "https://www.autorita-trasporti.it/wp-content/uploads/2023/02/All.-A-delibera-n.-21_2023_signed.pdf"
    },
    "rif": "mi-rimborsano/src/regole.js:161"
   }
  ]
 },
 {
  "id": "disdetta",
  "titolo": "Internet di casa da disdire",
  "pratica": "Hai internet a casa con un gestore telefonico: firmato online a febbraio 2024, vincolo di 24 mesi, poi rinnovato da solo. Vuoi chiudere il contratto.",
  "strumento": "disdette",
  "livello": 2,
  "bivi": [
   {
    "tipo": "termine",
    "domanda": "Prima del rinnovo automatico, quanto prima doveva avvisarti il gestore che il vincolo stava finendo?",
    "scelte": [
     {
      "testo": "Almeno 30 giorni prima, come per la palestra",
      "giusta": false,
      "giorni": 30,
      "perche": "Per telefono e internet la legge chiede di più: almeno 2 mesi prima, con le istruzioni per disdire."
     },
     {
      "testo": "Almeno 2 mesi prima, spiegandoti come disdire",
      "giusta": true
     },
     {
      "testo": "Non deve avvisarti: il rinnovo è scritto nel contratto",
      "giusta": false,
      "giorni": 30,
      "perche": "L'avviso è un obbligo del gestore: almeno 2 mesi prima del rinnovo, per email, lettera o SMS, con le modalità di disdetta."
     }
    ],
    "spiega": "Almeno 2 mesi prima del rinnovo il gestore deve avvisarti della fine del vincolo e di come disdire. Dopo il rinnovo puoi recedere quando vuoi, con un mese di preavviso al massimo.",
    "fonte": {
     "norma": "D.lgs. 259/2003, art. 98-septiesdecies, comma 4",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2003-08-01;259~art98septiesdecies"
    },
    "rif": "disdette/dati/fonti.json:37"
   },
   {
    "tipo": "diritto",
    "domanda": "Il contratto si è rinnovato da solo. Puoi recedere adesso o devi aspettare la prossima scadenza?",
    "scelte": [
     {
      "testo": "Devo aspettare: il rinnovo mi lega per altri 24 mesi",
      "giusta": false,
      "giorni": 60,
      "perche": "Il rinnovo non crea un nuovo vincolo: dopo il rinnovo automatico puoi recedere in qualsiasi momento."
     },
     {
      "testo": "Solo se dimostro che internet va peggio del promesso",
      "giusta": false,
      "giorni": 60,
      "perche": "Quella è una strada per uscire gratis prima del tempo. Per recedere non devi dare nessun motivo."
     },
     {
      "testo": "Posso recedere adesso, in qualsiasi momento",
      "giusta": true
     }
    ],
    "spiega": "Con telefono e internet puoi recedere o passare a un altro gestore in ogni momento, senza vincoli di tempo. Le clausole contrarie sono nulle.",
    "fonte": {
     "norma": "D.l. 7/2007, convertito dalla legge 40/2007, art. 1, comma 3",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2007-01-31;7~art1"
    },
    "rif": "disdette/dati/fonti.json:7"
   },
   {
    "tipo": "diritto",
    "domanda": "Il contratto è di febbraio 2024 e i 24 mesi sono passati. Cosa può chiederti il gestore per uscire?",
    "scelte": [
     {
      "testo": "Solo il canone del mese di preavviso e le rate che restano",
      "giusta": true
     },
     {
      "testo": "La penale per l'uscita anticipata",
      "giusta": false,
      "giorni": 30,
      "perche": "Per i contratti firmati dal 3 gennaio 2024, dopo il ventiquattresimo mese niente penali né costi di disattivazione."
     },
     {
      "testo": "Indietro gli sconti della promozione",
      "giusta": false,
      "giorni": 30,
      "perche": "La promozione è finita: non resta una durata su cui calcolare gli sconti da restituire."
     }
    ],
    "spiega": "Firmato dopo il 3 gennaio 2024 e passati i 24 mesi, esci senza penali né costi di disattivazione. Restano il canone del mese di preavviso ed eventuali rate di modem o telefono.",
    "fonte": {
     "norma": "Delibera AGCOM 307/23/CONS, allegato B, art. 5, comma 5",
     "url": "https://www.agcom.it/provvedimenti/delibera-307-23-cons"
    },
    "rif": "disdette/dati/fonti.json:85"
   },
   {
    "tipo": "lettera",
    "domanda": "Avevi attivato internet online. Come puoi mandare il recesso?",
    "scelte": [
     {
      "testo": "Solo con raccomandata alla sede legale",
      "giusta": false,
      "giorni": 10,
      "perche": "La raccomandata va bene, ma non è l'unica via: puoi recedere come hai attivato, e sempre anche online."
     },
     {
      "testo": "Solo di persona, in un negozio del gestore",
      "giusta": false,
      "giorni": 10,
      "perche": "Il negozio vale se hai firmato lì. Il recesso si fa con le stesse forme dell'attivazione e sempre anche online."
     },
     {
      "testo": "Online dall'area clienti, oppure con PEC o raccomandata",
      "giusta": true
     }
    ],
    "spiega": "Il recesso dev'essere semplice: con le stesse forme usate per attivare e, in ogni caso, anche per via telematica. PEC (posta elettronica certificata) o raccomandata danno la prova più solida della data.",
    "fonte": {
     "norma": "D.l. 7/2007, art. 1, comma 3-bis",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2007-01-31;7~art1"
    },
    "rif": "disdette/dati/fonti.json:14"
   },
   {
    "tipo": "termine",
    "domanda": "Le condizioni del gestore chiedono 45 giorni di preavviso. Quanto può durare al massimo?",
    "scelte": [
     {
      "testo": "45 giorni: li ho accettati firmando",
      "giusta": false,
      "giorni": 30,
      "perche": "Le clausole con un preavviso più lungo di 30 giorni sono nulle, anche se le hai firmate."
     },
     {
      "testo": "30 giorni da quando il gestore riceve la disdetta",
      "giusta": true
     },
     {
      "testo": "60 giorni, come per le modifiche del contratto",
      "giusta": false,
      "giorni": 30,
      "perche": "I 60 giorni sono il tempo per uscire gratis dopo una modifica delle condizioni, non il preavviso."
     }
    ],
    "spiega": "Il preavviso non può superare 30 giorni da quando il gestore riceve la richiesta, e in quel tempo deve completare la disattivazione. Paghi il servizio fino a quel giorno.",
    "fonte": {
     "norma": "Delibera AGCOM 487/18/CONS, allegato A, punti 9-11",
     "url": "https://www.agcom.it/sites/default/files/migration/attachment/Allegato%2030-10-2018.pdf"
    },
    "rif": "disdette/dati/fonti.json:58"
   },
   {
    "tipo": "ufficio",
    "domanda": "La linea è chiusa, ma il gestore continua ad addebitarti il canone. Il reclamo non è servito. Dove vai?",
    "scelte": [
     {
      "testo": "Dal giudice di pace, subito",
      "giusta": false,
      "giorni": 15,
      "perche": "Prima del giudice serve il tentativo di conciliazione: per telefono, internet e pay TV è gratuito e obbligatorio."
     },
     {
      "testo": "Alla conciliazione gratuita online, su ConciliaWeb",
      "giusta": true
     },
     {
      "testo": "Al Servizio Conciliazione dell'autorità per l'energia",
      "giusta": false,
      "giorni": 15,
      "perche": "Quel servizio è per luce e gas. Per telefono e internet la conciliazione si fa su ConciliaWeb."
     }
    ],
    "spiega": "Dopo la chiusura non possono addebitarti nulla e devono stornare o rimborsare subito. Se il reclamo non basta, c'è ConciliaWeb dell'Autorità per le comunicazioni: online e gratis.",
    "fonte": {
     "norma": "AGCOM, contenzioso tra utenti e operatori (ConciliaWeb, delibera 203/18/CONS)",
     "url": "https://www.agcom.it/agcom-per-te/i-miei-diritti/contenzioso-tra-utenti-e-operatori"
    },
    "rif": "disdette/dati/fonti.json:97"
   }
  ]
 },
 {
  "id": "atti",
  "titolo": "I documenti che il Comune non dà",
  "pratica": "Vuoi vedere i documenti dell'appalto per rifare la piazza del tuo quartiere. Non riguardano una tua pratica. Il Comune prima tace, poi dice di no.",
  "strumento": "chiedo-gli-atti",
  "livello": 2,
  "bivi": [
   {
    "tipo": "diritto",
    "domanda": "Quei documenti non riguardano una tua pratica. Quale accesso chiedi?",
    "scelte": [
     {
      "testo": "Accesso documentale: spiego il mio interesse personale",
      "giusta": false,
      "giorni": 30,
      "perche": "Serve per i documenti che ti riguardano e chiede un interesse diretto, concreto e attuale. Qui non ce l'hai, e non ti serve."
     },
     {
      "testo": "Accesso civico generalizzato: chiunque, senza motivare",
      "giusta": true
     },
     {
      "testo": "Nessuno: solo i consiglieri comunali possono vederli",
      "giusta": false,
      "giorni": 60,
      "perche": "Con l'accesso civico generalizzato chiunque può chiedere documenti e dati dell'ente, senza spiegare perché."
     }
    ],
    "spiega": "L'accesso civico generalizzato (detto anche FOIA) è per tutti e non va motivato. L'accesso documentale della legge 241/1990 serve quando i documenti ti riguardano e dimostri il tuo interesse.",
    "fonte": {
     "norma": "D.lgs. 33/2013, art. 5, comma 2",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2013-03-14;33~art5"
    },
    "rif": "chiedo-gli-atti/src/regole.js:27"
   },
   {
    "tipo": "ufficio",
    "domanda": "A chi indirizzi la richiesta?",
    "scelte": [
     {
      "testo": "Al difensore civico regionale",
      "giusta": false,
      "giorni": 15,
      "perche": "Il difensore civico arriva dopo, contro un rifiuto. La richiesta va prima al Comune che ha i documenti."
     },
     {
      "testo": "Al responsabile della trasparenza del Comune",
      "giusta": false,
      "giorni": 15,
      "perche": "Lui riceve l'accesso per i documenti che andavano pubblicati, e poi il riesame. La richiesta va all'ufficio che ha i dati."
     },
     {
      "testo": "All'ufficio che ha i dati, tramite l'Ufficio relazioni con il pubblico",
      "giusta": true
     }
    ],
    "spiega": "La richiesta va all'ufficio del Comune che detiene i documenti, anche passando dall'Ufficio relazioni con il pubblico. Il responsabile della trasparenza entra in gioco con il riesame.",
    "fonte": {
     "norma": "D.lgs. 33/2013, art. 5",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2013-03-14;33~art5"
    },
    "rif": "chiedo-gli-atti/src/regole.js:107"
   },
   {
    "tipo": "lettera",
    "domanda": "La mandi dalla tua PEC (posta elettronica certificata) personale. Cosa devi aggiungere perché sia valida?",
    "scelte": [
     {
      "testo": "Niente: dalla mia PEC personale vale già come firmata",
      "giusta": true
     },
     {
      "testo": "La copia del documento d'identità",
      "giusta": false,
      "giorni": 5,
      "perche": "Serve se scrivi da un'email normale. Dalla tua PEC personale la richiesta vale già come firmata."
     },
     {
      "testo": "Una raccomandata di conferma",
      "giusta": false,
      "giorni": 10,
      "perche": "PEC personale, email con documento d'identità, firma digitale o modulo online dell'ente: sono tutte valide da sole."
     }
    ],
    "spiega": "La PEC personale vale come firma. Conserva la ricevuta di consegna: da quella data partono i 30 giorni per la risposta.",
    "fonte": {
     "norma": "Codice dell'amministrazione digitale (d.lgs. 82/2005), art. 65",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-03-07;82~art65"
    },
    "rif": "chiedo-gli-atti/src/regole.js:64"
   },
   {
    "tipo": "termine",
    "domanda": "Il Comune tace. Quanto tempo aveva per risponderti, e cosa vale il suo silenzio?",
    "scelte": [
     {
      "testo": "60 giorni, se ci sono altre persone coinvolte",
      "giusta": false,
      "giorni": 30,
      "perche": "Se il Comune avvisa altre persone interessate, il termine resta sospeso al massimo 10 giorni per le loro opposizioni."
     },
     {
      "testo": "30 giorni: dopo, il silenzio vale come rifiuto definitivo",
      "giusta": false,
      "giorni": 60,
      "perche": "Il silenzio-rifiuto vale per l'accesso documentale. Qui il Comune era obbligato a decidere: il passo dopo è il riesame, gratis."
     },
     {
      "testo": "30 giorni dalla ricezione: poi chiedo il riesame",
      "giusta": true
     }
    ],
    "spiega": "Il Comune deve rispondere con un atto espresso e motivato entro 30 giorni dalla ricezione, più fino a 10 se avvisa altri interessati. Il silenzio non vale come rifiuto: chiedi il riesame.",
    "fonte": {
     "norma": "D.lgs. 33/2013, art. 5, comma 6",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2013-03-14;33~art5"
    },
    "rif": "chiedo-gli-atti/src/regole.js:122"
   },
   {
    "tipo": "diritto",
    "domanda": "Poi arriva la risposta: «negato per motivi di riservatezza», e niente altro. Cosa fai?",
    "scelte": [
     {
      "testo": "Lo accetto: un no motivato non si contesta",
      "giusta": false,
      "giorni": 60,
      "perche": "Il rifiuto deve dire quale eccezione di legge si applica e quale danno concreto eviterebbe: le motivazioni generiche non bastano."
     },
     {
      "testo": "Chiedo il riesame o vado dal difensore civico regionale: è gratis",
      "giusta": true
     },
     {
      "testo": "Chiedo il riesame all'ufficio che ha detto no",
      "giusta": false,
      "giorni": 15,
      "perche": "Il riesame si chiede al responsabile della prevenzione della corruzione e della trasparenza del Comune, non all'ufficio."
     }
    ],
    "spiega": "Muoviti entro 30 giorni dalla risposta, come indica la Funzione pubblica. Il riesame va deciso in 20 giorni; per Comuni e Regioni c'è anche il difensore civico regionale, dove è in carica.",
    "fonte": {
     "norma": "D.lgs. 33/2013, art. 5, commi 7 e 8",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2013-03-14;33~art5"
    },
    "rif": "chiedo-gli-atti/src/regole.js:149"
   },
   {
    "tipo": "termine",
    "domanda": "Il riesame conferma il no. Entro quando puoi ricorrere al TAR (tribunale amministrativo regionale), e come?",
    "scelte": [
     {
      "testo": "Entro 60 giorni dalla decisione",
      "giusta": false,
      "giorni": 30,
      "perche": "Sull'accesso il ricorso al TAR va fatto entro 30 giorni dalla decisione sul riesame."
     },
     {
      "testo": "Entro 30 giorni, ma solo con un avvocato",
      "giusta": false,
      "giorni": 10,
      "perche": "In primo grado non serve l'avvocato: paghi 300 € di contributo unificato e lo notifichi al Comune e ad almeno un controinteressato."
     },
     {
      "testo": "Entro 30 giorni, anche senza avvocato, con 300 € di contributo",
      "giusta": true
     }
    ],
    "spiega": "Hai 30 giorni dalla decisione sul riesame. Non contare sulla sospensione di agosto. Prima valuta se una nuova richiesta, più precisa, può darti gli stessi documenti gratis.",
    "fonte": {
     "norma": "Codice del processo amministrativo, art. 116",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2010-07-02;104"
    },
    "rif": "chiedo-gli-atti/src/regole.js:88"
   }
  ]
 },
 {
  "id": "visita",
  "titolo": "La visita fuori tempo",
  "pratica": "Il medico ti prescrive una prima visita cardiologica. Il centro di prenotazione (CUP) ti dà una data lontanissima. Vuoi farla nei tempi, senza pagare di più.",
  "strumento": "liste-attesa",
  "livello": 3,
  "bivi": [
   {
    "tipo": "documento",
    "domanda": "Dove trovi entro quando ti spetta la visita?",
    "scelte": [
     {
      "testo": "Sul foglio di prenotazione del CUP",
      "giusta": false,
      "giorni": 5,
      "perche": "Il CUP ti dà una data, ma il tempo massimo dipende dalla classe che il medico scrive sulla ricetta."
     },
     {
      "testo": "Nella lettera di priorità sulla ricetta: U, B, D o P",
      "giusta": true
     },
     {
      "testo": "Da nessuna parte: senza urgenza non c'è un tempo massimo",
      "giusta": false,
      "giorni": 60,
      "perche": "Ogni classe ha un tempo massimo: anche la P, programmata, ha 120 giorni. Se la classe manca, chiedila al medico."
     }
    ],
    "spiega": "La classe è sulla ricetta, in alto accanto al codice: U entro 72 ore, B 10 giorni, D 30 o 60, P 120. Vale per la prima visita o il primo esame, non per i controlli.",
    "fonte": {
     "norma": "Piano nazionale di governo delle liste d'attesa 2026-2028 (DM Salute 26/6/2026)",
     "url": "https://www.gazzettaufficiale.it/eli/gu/2026/08/24/195/so/32/sg/pdf"
    },
    "rif": "liste-attesa/src/domande.js:21"
   },
   {
    "tipo": "termine",
    "domanda": "Sulla ricetta c'è D, per una prima visita. Quanti giorni al massimo?",
    "scelte": [
     {
      "testo": "60 giorni",
      "giusta": false,
      "giorni": 30,
      "perche": "60 giorni valgono per gli esami in classe D, come un'ecografia. Per le visite sono 30."
     },
     {
      "testo": "10 giorni",
      "giusta": false,
      "giorni": 30,
      "perche": "10 giorni sono della classe B, breve. La D, differibile, per le visite ne ha 30."
     },
     {
      "testo": "30 giorni",
      "giusta": true
     }
    ],
    "spiega": "Classe D, differibile: 30 giorni per le visite, 60 per gli esami. La stessa lettera dà un termine diverso a seconda di cosa ti hanno prescritto.",
    "fonte": {
     "norma": "Piano nazionale di governo delle liste d'attesa 2026-2028 (DM Salute 26/6/2026)",
     "url": "https://www.gazzettaufficiale.it/eli/gu/2026/08/24/195/so/32/sg/pdf"
    },
    "rif": "liste-attesa/src/regole.js:18"
   },
   {
    "tipo": "termine",
    "domanda": "Da quando si contano i 30 giorni?",
    "scelte": [
     {
      "testo": "Dalla data scritta sulla ricetta",
      "giusta": false,
      "giorni": 30,
      "perche": "Il tempo massimo non parte dalla ricetta: parte dal giorno in cui contatti per la prima volta il CUP."
     },
     {
      "testo": "Dal primo contatto con il CUP",
      "giusta": true
     },
     {
      "testo": "Dal giorno in cui il CUP ti richiama con una data",
      "giusta": false,
      "giorni": 30,
      "perche": "Il conteggio non aspetta il richiamo: parte dal tuo primo contatto con il CUP."
     }
    ],
    "spiega": "Conta il giorno della prima telefonata o del primo passaggio al CUP: segnalo. Si contano i giorni di calendario, salvo regole diverse del piano della tua Regione.",
    "fonte": {
     "norma": "Piano nazionale di governo delle liste d'attesa 2026-2028 (DM Salute 26/6/2026)",
     "url": "https://www.gazzettaufficiale.it/eli/gu/2026/08/24/195/so/32/sg/pdf"
    },
    "rif": "liste-attesa/src/domande.js:30"
   },
   {
    "tipo": "termine",
    "domanda": "Il CUP non ha date: ti mette in lista e ti richiamerà. Per una visita in classe D, entro quando deve chiamarti?",
    "scelte": [
     {
      "testo": "Entro 10 giorni dal primo contatto",
      "giusta": true
     },
     {
      "testo": "Entro 15 giorni dal primo contatto",
      "giusta": false,
      "giorni": 30,
      "perche": "15 giorni valgono per gli esami in classe D. Per le visite in classe D il richiamo va fatto entro 10."
     },
     {
      "testo": "Basta che ti chiami entro i 30 giorni",
      "giusta": false,
      "giorni": 30,
      "perche": "Il richiamo ha un termine suo, più corto del tempo massimo: per le visite in classe D, 10 giorni dal primo contatto."
     }
    ],
    "spiega": "Chi va in lista senza data va registrato al primo contatto e richiamato entro 5 giorni (B), 10 (visite D), 15 (esami D) o 30 (P). Se non succede, scrivi all'Azienda sanitaria (ASL).",
    "fonte": {
     "norma": "Piano nazionale di governo delle liste d'attesa 2026-2028 (DM Salute 26/6/2026)",
     "url": "https://www.gazzettaufficiale.it/eli/gu/2026/08/24/195/so/32/sg/pdf"
    },
    "rif": "liste-attesa/src/regole.js:22"
   },
   {
    "tipo": "diritto",
    "domanda": "Ti richiamano con una data di tre mesi dopo, ben oltre il termine. Cosa fai?",
    "scelte": [
     {
      "testo": "Rifiuto e prenoto in un'altra struttura",
      "giusta": false,
      "giorni": 60,
      "perche": "Chi rifiuta la prima data nella sua zona per prenotare altrove perde la garanzia dei tempi. Prima chiedi la tutela all'ASL."
     },
     {
      "testo": "Accetto intanto la data e scrivo subito all'ASL",
      "giusta": true
     },
     {
      "testo": "Faccio la visita privata e poi chiedo il rimborso",
      "giusta": false,
      "giorni": 60,
      "perche": "Il Piano nazionale esclude il rimborso di visite già pagate privatamente: la richiesta va fatta prima, all'ASL."
     }
    ],
    "spiega": "Accettando la data tieni il posto e non perdi nulla. Intanto chiedi all'ASL il percorso di tutela: una data nei tempi, senza costi oltre al ticket.",
    "fonte": {
     "norma": "Piano nazionale di governo delle liste d'attesa 2026-2028 (DM Salute 26/6/2026)",
     "url": "https://www.gazzettaufficiale.it/eli/gu/2026/08/24/195/so/32/sg/pdf"
    },
    "rif": "liste-attesa/src/regole.js:99"
   },
   {
    "tipo": "ufficio",
    "domanda": "A chi mandi la lettera per chiedere il percorso di tutela?",
    "scelte": [
     {
      "testo": "Al CUP che ti ha dato la data",
      "giusta": false,
      "giorni": 15,
      "perche": "Il CUP prenota. I tempi deve garantirli l'Azienda sanitaria della tua residenza: scrivi a lei."
     },
     {
      "testo": "Al medico che ha scritto la ricetta",
      "giusta": false,
      "giorni": 15,
      "perche": "Il medico stabilisce la classe. I tempi li deve garantire l'Azienda sanitaria della tua residenza."
     },
     {
      "testo": "All'Azienda sanitaria (ASL) della mia residenza",
      "giusta": true
     }
    ],
    "spiega": "Scrivi all'ASL della tua residenza, alla Direzione generale e all'Ufficio relazioni con il pubblico, dalla tua PEC o email. Allega la ricetta e la prova della prenotazione.",
    "fonte": {
     "norma": "Piano nazionale di governo delle liste d'attesa 2026-2028 (DM Salute 26/6/2026)",
     "url": "https://www.gazzettaufficiale.it/eli/gu/2026/08/24/195/so/32/sg/pdf"
    },
    "rif": "liste-attesa/src/domande.js:7"
   },
   {
    "tipo": "lettera",
    "domanda": "Che cosa chiedi nella lettera all'ASL?",
    "scelte": [
     {
      "testo": "Di essere spostato in cima alla lista del CUP",
      "giusta": false,
      "giorni": 10,
      "perche": "Non chiedi un posto in lista: chiedi la visita entro il termine, anche in libera professione o in strutture accreditate."
     },
     {
      "testo": "La visita in libera professione, pagando la tariffa del medico",
      "giusta": false,
      "giorni": 30,
      "perche": "Anche in libera professione in ospedale (intramoenia) paghi al massimo il ticket: il resto non tocca a te."
     },
     {
      "testo": "La visita nei tempi, anche in libera professione o accreditata, col ticket",
      "giusta": true
     }
    ],
    "spiega": "L'ASL deve darti la visita entro il termine, anche in libera professione in ospedale, con prestazioni aggiuntive o in strutture private accreditate, senza costi oltre al ticket.",
    "fonte": {
     "norma": "D.l. 73/2024, art. 3, commi 10 e 10-bis",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2024-06-07;73~art3"
    },
    "rif": "liste-attesa/src/documento.js:25"
   },
   {
    "tipo": "termine",
    "domanda": "L'ASL ti fissa la visita nei tempi, di lunedì, ma non puoi andare. Settimana senza festivi: entro quando disdici?",
    "scelte": [
     {
      "testo": "Entro sabato: due giorni prima",
      "giusta": false,
      "giorni": 30,
      "perche": "Contano due giorni lavorativi: sabato, domenica e festivi non valgono. Per un lunedì, entro giovedì."
     },
     {
      "testo": "Basta non presentarsi, se sono esente dal ticket",
      "giusta": false,
      "giorni": 30,
      "perche": "Chi non si presenta senza aver disdetto paga il ticket anche se è esente."
     },
     {
      "testo": "Entro giovedì: due giorni lavorativi prima",
      "giusta": true
     }
    ],
    "spiega": "Disdici almeno due giorni lavorativi prima dell'appuntamento: sabato e festivi non contano. Se non ti presenti senza disdetta, paghi il ticket anche se sei esente.",
    "fonte": {
     "norma": "D.l. 73/2024, art. 3",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2024-06-07;73~art3"
    },
    "rif": "liste-attesa/src/regole.js:90"
   }
  ]
 },
 {
  "id": "ferma",
  "titolo": "La pratica ferma in Comune",
  "pratica": "Hai chiesto al Comune l'autorizzazione per aprire un negozio. Sono passati mesi e nessuno risponde. Vuoi far chiudere la pratica.",
  "strumento": "reclami-pa",
  "livello": 3,
  "bivi": [
   {
    "tipo": "termine",
    "domanda": "Nessuna legge o regolamento fissa un termine per la tua pratica. Entro quanto deve decidere il Comune?",
    "scelte": [
     {
      "testo": "Entro 90 giorni: è il termine normale degli uffici pubblici",
      "giusta": false,
      "giorni": 30,
      "perche": "90 giorni è il tetto dei termini che lo Stato e gli enti nazionali possono fissare. Se nessuno fissa un termine diverso, sono 30."
     },
     {
      "testo": "Entro 30 giorni",
      "giusta": true
     },
     {
      "testo": "Non c'è una scadenza: decide quando può",
      "giusta": false,
      "giorni": 60,
      "perche": "La scadenza c'è sempre: se nessuna legge o regolamento ne fissa una diversa, l'ufficio deve chiudere la pratica entro 30 giorni."
     }
    ],
    "spiega": "Se nessuna legge o regolamento fissa un termine diverso, l'ufficio deve chiudere la pratica con un provvedimento espresso entro 30 giorni.",
    "fonte": {
     "norma": "L. 241/1990, art. 2, commi 1-2",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
    },
    "rif": "reclami-pa/dati/fonti.json:6"
   },
   {
    "tipo": "termine",
    "domanda": "Da quando partono i 30 giorni, e come si contano?",
    "scelte": [
     {
      "testo": "Dal giorno in cui hai firmato la domanda, solo giorni lavorativi",
      "giusta": false,
      "giorni": 30,
      "perche": "Non conta la firma ma il giorno in cui l'ente riceve la domanda. E i giorni sono di calendario, non lavorativi."
     },
     {
      "testo": "Dalla comunicazione di avvio che ti manda l'ufficio",
      "giusta": false,
      "giorni": 30,
      "perche": "Per una domanda presentata da te il termine parte da quando l'ente la riceve, non dalla comunicazione di avvio."
     },
     {
      "testo": "Da quando l'ente riceve la domanda, giorni di calendario",
      "giusta": true
     }
    ],
    "spiega": "Il termine decorre dal ricevimento della domanda e si conta in giorni di calendario. La ricevuta, o quella della PEC, prova la data.",
    "fonte": {
     "norma": "L. 241/1990, art. 2, comma 6",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
    },
    "rif": "reclami-pa/dati/fonti.json:12"
   },
   {
    "tipo": "termine",
    "domanda": "L'ufficio ti chiede un certificato che non ha e tu lo mandi dopo 20 giorni. Che succede al termine?",
    "scelte": [
     {
      "testo": "Riparte da zero quando mandi il certificato",
      "giusta": false,
      "giorni": 30,
      "perche": "Non riparte da capo: resta sospeso per i giorni dell'attesa, una sola volta e al massimo per 30 giorni."
     },
     {
      "testo": "Si allunga dei 20 giorni dell'attesa",
      "giusta": true
     },
     {
      "testo": "L'ufficio può fermarlo a ogni nuova richiesta",
      "giusta": false,
      "giorni": 30,
      "perche": "La sospensione vale una sola volta, per massimo 30 giorni, e solo per documenti che l'ufficio non ha e non può avere da altri uffici pubblici."
     }
    ],
    "spiega": "Il termine si può sospendere una sola volta, per massimo 30 giorni, per chiedere documenti che l'ufficio non ha già: alla scadenza si aggiungono i giorni dell'attesa.",
    "fonte": {
     "norma": "L. 241/1990, art. 2, comma 7",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
    },
    "rif": "reclami-pa/dati/fonti.json:35"
   },
   {
    "tipo": "ufficio",
    "domanda": "Il termine è scaduto senza risposta. Chi deve chiudere la pratica al posto dell'ufficio fermo?",
    "scelte": [
     {
      "testo": "Il difensore civico: decide lui la pratica",
      "giusta": false,
      "giorni": 15,
      "perche": "Il difensore civico interviene presso l'ente per farla chiudere, ma non decide la pratica. Prima si chiede al titolare del potere sostitutivo."
     },
     {
      "testo": "Il titolare del potere sostitutivo del Comune",
      "giusta": true
     },
     {
      "testo": "L'Ufficio relazioni con il pubblico (URP)",
      "giusta": false,
      "giorni": 15,
      "perche": "L'URP informa sullo stato delle pratiche e raccoglie i reclami, ma non decide al posto dell'ufficio."
     }
    ],
    "spiega": "Ogni ente deve nominarlo e pubblicarne il nome sul sito, di solito in «Amministrazione trasparente». Se manca, tocca al dirigente generale. Chiedi anche il nome del responsabile del procedimento.",
    "fonte": {
     "norma": "L. 241/1990, art. 2, comma 9-bis",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
    },
    "rif": "reclami-pa/dati/fonti.json:55"
   },
   {
    "tipo": "termine",
    "domanda": "La pratica riguarda l'avvio di un'impresa, quindi c'è l'indennizzo da ritardo. Entro quando chiedi l'intervento del titolare?",
    "scelte": [
     {
      "testo": "Entro 20 giorni dalla scadenza del termine",
      "giusta": true
     },
     {
      "testo": "Entro un anno, come per il ricorso al giudice",
      "giusta": false,
      "giorni": 60,
      "perche": "Per l'indennizzo i giorni sono 20 dalla scadenza del termine, e sono perentori: passati quelli, l'indennizzo non si può più chiedere."
     },
     {
      "testo": "Quando vuoi, finché la pratica resta ferma",
      "giusta": false,
      "giorni": 60,
      "perche": "Il limite c'è: 20 giorni perentori dalla scadenza del termine del procedimento. Dopo, l'indennizzo non si può più chiedere."
     }
    ],
    "spiega": "L'indennizzo è di 30 euro per ogni giorno di ritardo, fino a 2.000 euro, solo per pratiche su domanda che riguardano un'impresa. Va chiesto al titolare entro 20 giorni.",
    "fonte": {
     "norma": "D.l. 69/2013, art. 28, commi 1 e 2",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2013-06-21;69~art28"
    },
    "rif": "reclami-pa/dati/fonti.json:146"
   },
   {
    "tipo": "termine",
    "domanda": "Il termine originario era di 30 giorni. Quanto tempo ha il titolare del potere sostitutivo per chiudere la pratica?",
    "scelte": [
     {
      "testo": "Altri 30 giorni",
      "giusta": false,
      "giorni": 30,
      "perche": "Non ha di nuovo tutto il termine: ha la metà del termine originario, quindi 15 giorni."
     },
     {
      "testo": "10 giorni",
      "giusta": false,
      "giorni": 30,
      "perche": "Dieci giorni sono quelli per rispondere a un preavviso di rigetto. Il titolare ha la metà del termine originario: 15 giorni su 30."
     },
     {
      "testo": "15 giorni, la metà del termine originario",
      "giusta": true
     }
    ],
    "spiega": "Il titolare del potere sostitutivo deve concludere entro la metà del termine originario, con gli uffici interni o nominando un commissario.",
    "fonte": {
     "norma": "L. 241/1990, art. 2, comma 9-ter",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1990-08-07;241~art2"
    },
    "rif": "reclami-pa/dati/fonti.json:65"
   },
   {
    "tipo": "ufficio",
    "domanda": "Anche il titolare del potere sostitutivo tace. A chi mandi l'istanza per avere aiuto?",
    "scelte": [
     {
      "testo": "Al difensore civico del Comune",
      "giusta": false,
      "giorni": 15,
      "perche": "Il difensore civico comunale è stato soppresso. I Comuni possono affidarne le funzioni, con una convenzione, a un altro difensore civico."
     },
     {
      "testo": "Al Difensore civico per il digitale",
      "giusta": false,
      "giorni": 15,
      "perche": "Quello presso l'Agenzia per l'Italia digitale (AgID) segue servizi online, identità digitale e pagamenti, non le pratiche ferme."
     },
     {
      "testo": "Al difensore civico regionale, se copre il tuo Comune",
      "giusta": true
     }
    ],
    "spiega": "Il difensore civico interviene presso l'ente per far chiudere la pratica. Per i Comuni serve una convenzione: controlla sul sito del difensore della tua regione. Scrivi per PEC.",
    "fonte": {
     "norma": "L. 191/2009, art. 2, comma 186, lett. a)",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2009-12-23;191~art2-com186"
    },
    "rif": "reclami-pa/dati/fonti.json:216"
   },
   {
    "tipo": "termine",
    "domanda": "Vuoi chiedere al TAR (tribunale amministrativo regionale) di obbligare il Comune a decidere. Entro quando?",
    "scelte": [
     {
      "testo": "Entro 30 giorni dalla scadenza del termine",
      "giusta": false,
      "giorni": 30,
      "perche": "I 30 giorni valgono per l'accesso agli atti negato. Contro il silenzio hai tempo finché dura, e comunque entro un anno dalla scadenza."
     },
     {
      "testo": "Finché dura il silenzio, e al massimo un anno dalla scadenza",
      "giusta": true
     },
     {
      "testo": "Entro un anno, anche da solo senza avvocato",
      "giusta": false,
      "giorni": 10,
      "perche": "Contro il silenzio serve un avvocato: da soli si può solo per l'accesso agli atti e pochi altri casi. Il contributo unificato è di 300 euro."
     }
    ],
    "spiega": "Il ricorso contro il silenzio si presenta finché dura l'inerzia e comunque entro un anno dalla scadenza del termine, contato per data. Dopo, puoi ripresentare la domanda.",
    "fonte": {
     "norma": "Cod. proc. amm., art. 31, commi 1-3",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2010-07-02;104:2~art31"
    },
    "rif": "reclami-pa/dati/fonti.json:96"
   }
  ]
 },
 {
  "id": "deposito",
  "titolo": "Il deposito che non torna",
  "pratica": "Hai un contratto 4+4 e ti trasferiscono per lavoro. Lasci la casa prima della scadenza, ma il proprietario non ti restituisce il deposito cauzionale.",
  "strumento": "affitto",
  "livello": 3,
  "bivi": [
   {
    "tipo": "diritto",
    "domanda": "Il contratto non ha la clausola di recesso. Con il trasferimento di lavoro, puoi andartene prima della scadenza?",
    "scelte": [
     {
      "testo": "No: devi aspettare la fine dei quattro anni",
      "giusta": false,
      "giorni": 60,
      "perche": "Con gravi motivi l'inquilino può lasciare la casa in qualsiasi momento, anche se il contratto non lo prevede."
     },
     {
      "testo": "Sì, per gravi motivi, con sei mesi di preavviso",
      "giusta": true
     },
     {
      "testo": "Sì, con un mese di preavviso",
      "giusta": false,
      "giorni": 30,
      "perche": "Per i gravi motivi il preavviso è di sei mesi, e fino ad allora paghi il canone."
     }
    ],
    "spiega": "Con gravi motivi l'inquilino può recedere in qualsiasi momento, con sei mesi di preavviso. Nella lettera scrivi fatti concreti, nati dopo la firma, come il trasferimento.",
    "fonte": {
     "norma": "L. 431/1998, art. 3, comma 6",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1998-12-09;431~art3"
    },
    "rif": "affitto/dati/fonti.json:151"
   },
   {
    "tipo": "termine",
    "domanda": "Da quando si contano i sei mesi di preavviso?",
    "scelte": [
     {
      "testo": "Dal giorno in cui spedisci la lettera",
      "giusta": false,
      "giorni": 30,
      "perche": "Conta il giorno in cui il proprietario la riceve, non quello della spedizione: mandala qualche giorno prima e conserva la ricevuta."
     },
     {
      "testo": "Dal primo giorno del mese successivo",
      "giusta": false,
      "giorni": 30,
      "perche": "Non si aspetta il mese dopo: i sei mesi partono dal giorno in cui il proprietario riceve la lettera."
     },
     {
      "testo": "Dal giorno in cui il proprietario riceve la lettera",
      "giusta": true
     }
    ],
    "spiega": "Il preavviso parte dalla ricezione della lettera. Mandala con raccomandata con ricevuta di ritorno: la ricevuta prova la data che conta.",
    "fonte": {
     "norma": "L. 431/1998, art. 3, comma 6",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1998-12-09;431~art3"
    },
    "rif": "affitto/src/regole.js:287"
   },
   {
    "tipo": "ufficio",
    "domanda": "Il contratto finisce prima della scadenza. A chi va comunicata la fine del contratto?",
    "scelte": [
     {
      "testo": "All'ufficio anagrafe del Comune, quando cambi residenza",
      "giusta": false,
      "giorni": 15,
      "perche": "La fine anticipata del contratto va comunicata all'ufficio dell'Agenzia delle Entrate dove il contratto è registrato."
     },
     {
      "testo": "A nessuno: il contratto finisce da solo",
      "giusta": false,
      "giorni": 10,
      "perche": "Quando il contratto finisce prima della scadenza, la risoluzione va comunicata entro trenta giorni all'Agenzia delle Entrate."
     },
     {
      "testo": "All'Agenzia delle Entrate dove è registrato, entro 30 giorni",
      "giusta": true
     }
    ],
    "spiega": "Se il contratto finisce prima della scadenza, la risoluzione va comunicata entro trenta giorni all'ufficio dell'Agenzia delle Entrate dove è registrato. Decidete voi chi lo fa.",
    "fonte": {
     "norma": "D.P.R. 131/1986, art. 17, comma 1",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:1986-04-26;131~art17"
    },
    "rif": "affitto/dati/fonti.json:189"
   },
   {
    "tipo": "documento",
    "domanda": "Il giorno della riconsegna delle chiavi, che cosa prepari?",
    "scelte": [
     {
      "testo": "Un verbale firmato da entrambi, con foto datate e contatori",
      "giusta": true
     },
     {
      "testo": "Niente: basta restituire le chiavi",
      "giusta": false,
      "giorni": 5,
      "perche": "Serve un verbale di riconsegna: stato della casa, foto con data, letture dei contatori e numero di chiavi."
     },
     {
      "testo": "Un verbale scritto solo da te, senza la firma del proprietario",
      "giusta": false,
      "giorni": 5,
      "perche": "Il verbale di riconsegna va firmato da tutti e due: tu e il proprietario."
     }
    ],
    "spiega": "Alla riconsegna fai un verbale: stato della casa, foto con data, letture dei contatori, numero di chiavi, firmato da entrambi. Ti serve anche per discutere eventuali trattenute.",
    "fonte": {
     "norma": "Codice civile, art. 1590",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art1590"
    },
    "rif": "affitto/src/regole.js:404"
   },
   {
    "tipo": "termine",
    "domanda": "Hai riconsegnato le chiavi. Entro quanti giorni il proprietario deve restituirti il deposito?",
    "scelte": [
     {
      "testo": "Entro 30 giorni dalla riconsegna",
      "giusta": false,
      "giorni": 30,
      "perche": "La legge non fissa un numero di giorni: il deposito va restituito alla riconsegna, salvo le somme trattenute e documentate."
     },
     {
      "testo": "La legge non fissa giorni: va reso alla riconsegna",
      "giusta": true
     },
     {
      "testo": "Entro sei mesi, il tempo di fare i conti",
      "giusta": false,
      "giorni": 30,
      "perche": "Nessuna legge dà sei mesi al proprietario: il deposito va restituito alla riconsegna della casa."
     }
    ],
    "spiega": "Il deposito garantisce gli obblighi fino alla fine del contratto: va restituito alla riconsegna, salvo le somme documentate per danni oltre il normale uso o canoni e spese non pagati.",
    "fonte": {
     "norma": "L. 392/1978, art. 11",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1978-07-27;392~art11"
    },
    "rif": "affitto/src/regole.js:398"
   },
   {
    "tipo": "termine",
    "domanda": "Il deposito l'hai versato alla firma, tre anni fa, e non hai mai avuto interessi. Da quando si contano?",
    "scelte": [
     {
      "testo": "Dal versamento, con il tasso legale di ogni anno",
      "giusta": true
     },
     {
      "testo": "Solo dal giorno della riconsegna",
      "giusta": false,
      "giorni": 30,
      "perche": "Gli interessi maturano da quando hai versato il deposito: il proprietario doveva pagarteli alla fine di ogni anno."
     },
     {
      "testo": "Dal versamento, con il tasso di quest'anno per tutto il periodo",
      "giusta": false,
      "giorni": 30,
      "perche": "Il tasso legale lo fissa ogni anno un decreto del Ministero dell'economia: per ogni anno si usa il suo tasso."
     }
    ],
    "spiega": "Il deposito produce interessi legali, da pagare all'inquilino alla fine di ogni anno. Se non li hai avuti, si contano dal versamento alla riconsegna, anno per anno.",
    "fonte": {
     "norma": "L. 392/1978, art. 11",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1978-07-27;392~art11"
    },
    "rif": "affitto/dati/fonti.json:246"
   },
   {
    "tipo": "diritto",
    "domanda": "Il proprietario trattiene 400 euro per ridipingere pareti ingiallite dagli anni. Può farlo?",
    "scelte": [
     {
      "testo": "Sì: ridipingere tocca sempre all'inquilino",
      "giusta": false,
      "giorni": 30,
      "perche": "Il normale uso e la vecchiaia della casa non si pagano. Si possono trattenere solo danni oltre il normale uso, documentati."
     },
     {
      "testo": "No: si trattengono solo danni oltre il normale uso, documentati",
      "giusta": true
     }
    ],
    "spiega": "Riconsegni la casa come l'hai ricevuta, salvo l'usura del normale uso; della vecchiaia non rispondi. Chiedi per iscritto il dettaglio delle voci, con fatture o preventivi.",
    "fonte": {
     "norma": "Codice civile, art. 1590",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art1590"
    },
    "rif": "affitto/dati/fonti.json:270"
   },
   {
    "tipo": "lettera",
    "domanda": "Il proprietario non risponde. Come chiedi il deposito con gli interessi?",
    "scelte": [
     {
      "testo": "Con una telefonata o un messaggio",
      "giusta": false,
      "giorni": 10,
      "perche": "Serve una lettera scritta, con raccomandata con ricevuta di ritorno: deposito, interessi, eventuali trattenute e IBAN."
     },
     {
      "testo": "Un'email generica, senza importi",
      "giusta": false,
      "giorni": 10,
      "perche": "La lettera va per raccomandata con ricevuta di ritorno e deve contenere il conto: deposito più interessi legali, meno le trattenute."
     },
     {
      "testo": "Raccomandata con ricevuta di ritorno: importo, interessi, IBAN",
      "giusta": true
     }
    ],
    "spiega": "La lettera chiede il deposito con gli interessi legali di ogni anno e indica il conto su cui pagare. Se non pagano, rivolgiti a un sindacato degli inquilini o a un avvocato.",
    "fonte": {
     "norma": "L. 392/1978, art. 11",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1978-07-27;392~art11"
    },
    "rif": "affitto/src/documento.js:67"
   }
  ]
 },
 {
  "id": "delibera",
  "titolo": "La delibera da contestare",
  "pratica": "L'avviso dell'assemblea di condominio ti è arrivato tardi e non sei andato. Poi ricevi il verbale: c'è una delibera che vuoi contestare.",
  "strumento": "condominio",
  "livello": 3,
  "bivi": [
   {
    "tipo": "termine",
    "domanda": "L'avviso di convocazione ti è arrivato 3 giorni prima della riunione. È in regola?",
    "scelte": [
     {
      "testo": "Sì, basta che arrivi prima della riunione",
      "giusta": false,
      "giorni": 30,
      "perche": "L'avviso deve arrivare almeno cinque giorni prima della prima convocazione. Con tre giorni la delibera è annullabile."
     },
     {
      "testo": "Sì, se era appeso in bacheca da una settimana",
      "giusta": false,
      "giorni": 10,
      "perche": "La bacheca non basta: l'avviso va mandato con raccomandata, PEC (posta elettronica certificata), fax o consegnato a mano."
     },
     {
      "testo": "No: doveva arrivare almeno 5 giorni prima",
      "giusta": true
     }
    ],
    "spiega": "L'avviso, con ordine del giorno, luogo e ora, deve arrivare almeno 5 giorni prima della prima convocazione. Se è tardivo, chi non è stato convocato bene può chiedere l'annullamento.",
    "fonte": {
     "norma": "Disposizioni di attuazione del codice civile, art. 66, comma 3",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-30;318~art66"
    },
    "rif": "condominio/dati/fonti.json:60"
   },
   {
    "tipo": "diritto",
    "domanda": "In seconda convocazione è stato nominato l'amministratore: sì della maggioranza dei presenti, ma 400 millesimi su 1000. Basta?",
    "scelte": [
     {
      "testo": "Sì: in seconda convocazione basta un terzo del valore",
      "giusta": false,
      "giorni": 15,
      "perche": "Un terzo basta per le decisioni ordinarie. Per nominare o revocare l'amministratore serve sempre almeno la metà del valore."
     },
     {
      "testo": "No: serve almeno la metà del valore, 500 millesimi",
      "giusta": true
     },
     {
      "testo": "Sì: contano solo le persone, non i millesimi",
      "giusta": false,
      "giorni": 15,
      "perche": "Contano tutte e due: la maggioranza dei presenti e i millesimi richiesti, qui almeno la metà del valore dell'edificio."
     }
    ],
    "spiega": "Nomina e revoca dell'amministratore vanno sempre approvate dalla maggioranza dei presenti con almeno la metà del valore dell'edificio, anche in seconda convocazione.",
    "fonte": {
     "norma": "Codice civile, art. 1136, comma 4",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262~art1136"
    },
    "rif": "condominio/dati/fonti.json:37"
   },
   {
    "tipo": "termine",
    "domanda": "Tu eri assente. Da quando partono i tuoi 30 giorni per impugnare la delibera?",
    "scelte": [
     {
      "testo": "Dal giorno dell'assemblea",
      "giusta": false,
      "giorni": 30,
      "perche": "Dal giorno dell'assemblea partono per chi era presente e ha votato contro o si è astenuto. Per gli assenti, dalla comunicazione."
     },
     {
      "testo": "Da quando ti arriva il verbale con la delibera",
      "giusta": true
     },
     {
      "testo": "Da quando l'amministratore esegue la delibera",
      "giusta": false,
      "giorni": 30,
      "perche": "L'esecuzione non c'entra: per chi era assente i 30 giorni partono da quando riceve la comunicazione della delibera."
     }
    ],
    "spiega": "Per gli assenti i 30 giorni partono da quando ricevono la comunicazione della delibera. Se il verbale non ti è arrivato, il termine non è partito: chiedilo all'amministratore.",
    "fonte": {
     "norma": "Codice civile, art. 1137, comma 2",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262~art1137"
    },
    "rif": "condominio/dati/fonti.json:82"
   },
   {
    "tipo": "termine",
    "domanda": "Il verbale ti arriva il 20 luglio. Come si contano i 30 giorni?",
    "scelte": [
     {
      "testo": "Tutti i giorni di calendario, agosto compreso",
      "giusta": false,
      "giorni": 30,
      "perche": "Dal 1° al 31 agosto i 30 giorni si fermano e riprendono il 1° settembre."
     },
     {
      "testo": "Giorni di calendario, ma agosto non si conta",
      "giusta": true
     },
     {
      "testo": "Solo i giorni lavorativi",
      "giusta": false,
      "giorni": 30,
      "perche": "Si contano tutti i giorni, festivi compresi; solo agosto si salta. Se l'ultimo giorno è festivo, si passa al primo giorno non festivo."
     }
    ],
    "spiega": "Il giorno in cui arriva il verbale non si conta. Dal 1° al 31 agosto il termine si ferma e riprende a settembre; se l'ultimo giorno è festivo, slitta al primo non festivo.",
    "fonte": {
     "norma": "L. 742/1969, art. 1, e Corte costituzionale, sentenza 49/1990",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1969-10-07;742~art1"
    },
    "rif": "condominio/dati/fonti.json:94"
   },
   {
    "tipo": "lettera",
    "domanda": "Che cosa ferma davvero i 30 giorni?",
    "scelte": [
     {
      "testo": "Una lettera di contestazione all'amministratore",
      "giusta": false,
      "giorni": 60,
      "perche": "La lettera è utile per chiedere il riesame, ma da sola non ferma il termine. Passati i 30 giorni, la delibera annullabile resta valida."
     },
     {
      "testo": "Chiedere al giudice di sospendere la delibera",
      "giusta": false,
      "giorni": 60,
      "perche": "La richiesta di sospensione fatta prima della causa non ferma i 30 giorni. Serve la domanda di mediazione."
     },
     {
      "testo": "La domanda di mediazione, quando arriva al condominio",
      "giusta": true
     }
    ],
    "spiega": "La domanda di mediazione ferma il termine, una sola volta, dal momento in cui la comunicazione arriva al condominio, cioè all'amministratore. Puoi mandarla anche tu, oltre all'organismo.",
    "fonte": {
     "norma": "D.lgs. 28/2010, art. 8, comma 2",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2010-03-04;28~art8"
    },
    "rif": "condominio/dati/fonti.json:128"
   },
   {
    "tipo": "ufficio",
    "domanda": "Dove depositi la domanda di mediazione?",
    "scelte": [
     {
      "testo": "In tribunale, direttamente: si fa prima",
      "giusta": false,
      "giorni": 15,
      "perche": "Per le liti di condominio la mediazione è obbligatoria: senza, la causa è improcedibile."
     },
     {
      "testo": "Presso un organismo di mediazione dove si trova il condominio",
      "giusta": true
     },
     {
      "testo": "Presso un organismo della città dove abiti tu",
      "giusta": false,
      "giorni": 15,
      "perche": "L'organismo va scelto nel luogo del giudice competente, cioè dove si trova il condominio, non dove abiti tu."
     }
    ],
    "spiega": "La domanda indica parti, oggetto e ragioni, con l'assistenza di un avvocato. Il primo incontro è tra 20 e 40 giorni dal deposito; la mediazione dura al massimo sei mesi, prorogabili.",
    "fonte": {
     "norma": "D.lgs. 28/2010, artt. 4, 6 e 8",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2010-03-04;28~art8"
    },
    "rif": "condominio/dati/fonti.json:139"
   },
   {
    "tipo": "termine",
    "domanda": "La mediazione finisce senza accordo. Entro quando devi iniziare la causa?",
    "scelte": [
     {
      "testo": "Entro 30 giorni dal deposito del verbale della mediazione",
      "giusta": true
     },
     {
      "testo": "Entro i 30 giorni che restavano dal verbale dell'assemblea",
      "giusta": false,
      "giorni": 30,
      "perche": "Il termine riparte da capo: hai altri 30 giorni dal deposito del verbale conclusivo presso l'organismo di mediazione."
     },
     {
      "testo": "Quando vuoi: con la mediazione il termine non c'è più",
      "giusta": false,
      "giorni": 60,
      "perche": "Il termine c'è: 30 giorni dal deposito del verbale conclusivo. Passati quelli, la delibera annullabile resta valida."
     }
    ],
    "spiega": "Se la mediazione finisce senza accordo, la causa va iniziata entro un nuovo termine di 30 giorni dal deposito del verbale conclusivo presso l'organismo. Serve un avvocato.",
    "fonte": {
     "norma": "D.lgs. 28/2010, art. 11, comma 4-bis",
     "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2010-03-04;28~art11"
    },
    "rif": "condominio/dati/fonti.json:133"
   },
   {
    "tipo": "diritto",
    "domanda": "Una delibera di due mesi fa cambia per sempre, a maggioranza, i criteri per dividere le spese. Puoi ancora contestarla?",
    "scelte": [
     {
      "testo": "No: dopo 30 giorni ogni delibera resta valida",
      "giusta": false,
      "giorni": 60,
      "perche": "I 30 giorni valgono per le delibere annullabili. Cambiare a maggioranza i criteri di ripartizione delle spese è un caso di nullità."
     },
     {
      "testo": "Sì, ma solo se avevi votato contro",
      "giusta": false,
      "giorni": 15,
      "perche": "La nullità può farla valere chiunque ne abbia interesse, non solo chi ha votato contro."
     },
     {
      "testo": "Sì: è un caso di nullità, senza il limite dei 30 giorni",
      "giusta": true
     }
    ],
    "spiega": "Sono nulle le delibere con oggetto impossibile o illecito, fuori dai poteri dell'assemblea, o che cambiano a maggioranza i criteri di riparto. Decide il giudice, e prima serve la mediazione.",
    "fonte": {
     "norma": "Cassazione, Sezioni Unite civili, sentenza 9839/2021",
     "url": "https://www.cortedicassazione.it/corte-di-cassazione/it/det_civile_sezioni_unite.page?contentId=SZC25488"
    },
    "rif": "condominio/dati/fonti.json:106"
   }
  ]
 }
];
