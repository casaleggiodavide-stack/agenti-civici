// Schede delle pratiche verificate sulle fonti ufficiali. File generato da scripts/navigatore-schede.py:
// non modificarlo a mano, modifica navigatore/dati/schede-*.json e rigeneralo.

export const VERIFICATO = '2026-10-25';

export const CATEGORIE = {
  "anagrafe": {
    "nome": "Residenza, documenti e identità digitale"
  },
  "famiglia": {
    "nome": "Nascite, matrimoni, separazioni e lutti"
  },
  "stranieri": {
    "nome": "Stranieri e cittadinanza"
  },
  "salute": {
    "nome": "Salute e disabilità"
  },
  "scuola": {
    "nome": "Scuola e figli piccoli"
  },
  "lavoro": {
    "nome": "Lavoro, disoccupazione e pensione"
  },
  "fisco": {
    "nome": "Tasse, ISEE e pagamenti"
  },
  "auto": {
    "nome": "Auto e patente"
  },
  "casa": {
    "nome": "Casa, affitto e utenze"
  }
};

export const COLLEGATI = {
  'mi-spetta': { strumento: 'mi-spetta', testo: 'Controlla a quali bonus hai diritto con Mi spetta' },
  'mi-rimborsano': { strumento: 'mi-rimborsano', testo: 'Bolletta sbagliata? Prova Mi rimborsano?' },
  'chiedo-gli-atti': { strumento: 'chiedo-gli-atti', testo: 'Chiedi i documenti con Chiedo gli atti' },
};

export const PRATICHE = [
 {
  "id": "cambio-residenza",
  "titolo": "Cambiare residenza (nello stesso Comune, da un altro Comune o rientrando dall'estero)",
  "categoria": "anagrafe",
  "sinonimi": [
   "cambio di residenza",
   "trasferire la residenza",
   "cambio indirizzo anagrafe",
   "residenza online ANPR",
   "mi sono trasferito in un altro comune",
   "nuova residenza",
   "cambio casa stesso comune",
   "dichiarazione di residenza"
  ],
  "chi": "Chi è iscritto all'Anagrafe nazionale (ANPR) e cambia abitazione nello stesso Comune, si trasferisce in un altro Comune o rientra dall'estero (cittadini italiani iscritti AIRE). La dichiarazione può riguardare anche i familiari che si trasferiscono con il dichiarante.",
  "dove": "Ufficio anagrafe del Comune della nuova residenza (di persona o con i canali del Comune), oppure online sul portale ANPR.",
  "online": {
   "stato": "si",
   "url": "https://www.anagrafenazionale.interno.it/servizi-al-cittadino/",
   "note": "Accesso con SPID, CIE, CNS o eIDAS; servizio gratuito."
  },
  "passi": [
   "Entra nei servizi ANPR con SPID, CIE o CNS e scegli «Cambio di residenza».",
   "Indica se vai in una casa nuova («Nuova residenza») o in una famiglia che vive già lì («Residenza in famiglia esistente»).",
   "Seleziona i familiari che si trasferiscono con te.",
   "Inserisci il nuovo indirizzo, a che titolo occupi la casa (proprietà, affitto…) e i contatti.",
   "Allega i documenti, controlla il riepilogo e invia. Se ci sono altri maggiorenni coinvolti, devono confermare dalla loro area riservata.",
   "Segui lo stato in «Le tue richieste» (notifiche anche via email e app IO) e attendi l'esito dell'accertamento del Comune."
  ],
  "documenti": [
   "Casa di proprietà: estremi catastali",
   "Casa in affitto: estremi del contratto e carta d'identità del proprietario",
   "Cittadini extra UE: permesso di soggiorno (obbligatorio)",
   "Ogni altro documento utile a dimostrare il titolo di occupazione"
  ],
  "costo": "Gratuito.",
  "tempi": "Il Comune registra la dichiarazione entro 2 giorni lavorativi dal ricevimento; segue un accertamento di massimo 45 giorni. Se entro 45 giorni il Comune non comunica motivi ostativi, la dichiarazione si considera conforme (silenzio-assenso). Gli effetti decorrono dalla data della dichiarazione.",
  "scadenze": "La dichiarazione va resa entro 20 giorni dal trasferimento (art. 5 d.l. 5/2012).",
  "attenzione": [
   "Il servizio ANPR è gratuito: diffida di siti o intermediari che chiedono soldi per «fare la residenza online».",
   "Le false dichiarazioni sono reato (artt. 75-76 d.P.R. 445/2000) e in caso di accertamento negativo si torna alla situazione precedente.",
   "Il cambio di residenza non aggiorna da solo tutto: TARI, utenze e altri servizi vanno verificati con il Comune e i gestori.",
   "I tempi reali possono variare da caso a caso (lo dice la stessa pagina ANPR)."
  ],
  "norme": [
   {
    "titolo": "D.l. 9 febbraio 2012, n. 5, art. 5 (cambio di residenza in tempo reale)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2012-02-09;5~art5"
   },
   {
    "titolo": "D.P.R. 30 maggio 1989, n. 223 (regolamento anagrafico)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:1989-05-30;223"
   }
  ],
  "fonti": [
   {
    "titolo": "ANPR – Cambio di residenza",
    "url": "https://www.anagrafenazionale.interno.it/area-cittadino/cambio-di-residenza/"
   },
   {
    "titolo": "Normattiva – d.l. 5/2012 art. 5",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2012-02-09;5~art5"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "carta-identita-elettronica",
  "titolo": "Carta d'identità elettronica (CIE): primo rilascio e rinnovo",
  "categoria": "anagrafe",
  "sinonimi": [
   "fare la carta d'identità",
   "rinnovo carta d'identità",
   "carta d'identità scaduta",
   "CIE",
   "carta d'identità cartacea non vale più",
   "appuntamento carta d'identità",
   "quanto costa la carta d'identità",
   "duplicato carta d'identità smarrita"
  ],
  "chi": "Cittadini italiani residenti o domiciliati in Italia (anche minori, dalla nascita); gli iscritti AIRE la chiedono al Consolato.",
  "dove": "Ufficio anagrafe/servizi demografici del Comune di residenza o dimora; all'estero il Consolato.",
  "online": {
   "stato": "parziale",
   "url": "https://www.prenotazionicie.interno.gov.it/cittadino/n/sc/wizardAppuntamentoCittadino/sceltaComune/",
   "note": "Online solo la prenotazione (Agenda CIE, nei Comuni aderenti) e il caricamento della foto; la richiesta si fa di persona allo sportello."
  },
  "passi": [
   "Prenota l'appuntamento con Agenda CIE o secondo le regole del tuo Comune.",
   "Allo sportello verifica i dati anagrafici con l'operatore.",
   "Scegli se ricevere la carta a casa o ritirarla in Comune ed eventualmente indica un delegato.",
   "Lascia foto e impronte digitali; puoi esprimere il consenso o il diniego alla donazione degli organi (facoltativo).",
   "Firma il riepilogo e conserva il modulo con la prima parte di PIN/PUK.",
   "Ricevi la carta (consegna prevista entro 6 giorni lavorativi)."
  ],
  "documenti": [
   "Fototessera recente, formato passaporto (o foto digitale caricata su Agenda CIE)",
   "Codice fiscale o tessera sanitaria (consigliati)",
   "Vecchio documento da restituire (rinnovo o deterioramento)",
   "Primo rilascio: un altro documento valido o, in mancanza, due testimoni",
   "Furto o smarrimento: la pagina ministeriale non indica la denuncia; chiedi al Comune"
  ],
  "costo": "16,79 € più i diritti fissi e di segreteria del Comune, dove previsti (variano da Comune a Comune).",
  "tempi": "Consegna entro 6 giorni lavorativi dalla richiesta. Validità: 10 anni per i maggiorenni (9 anni più i giorni fino al compleanno), 5 anni tra 3 e 18 anni, 3 anni sotto i 3 anni; 12 mesi per chi temporaneamente non può lasciare le impronte.",
  "scadenze": "Il rinnovo si può chiedere da 180 giorni prima della scadenza (le carte cartacee anche prima). Dal 3 agosto 2026 la carta cartacea non è più valida: con il d.l. 108/2026 (convertito dalla l. 142/2026) resta usabile fino al 31 gennaio 2027 solo per rapporti con PA, sanità, posta, banche e uffici postali, e fino alla scadenza originaria nei contratti stipulati entro il 3 agosto 2026; NON vale più per l'espatrio.",
  "attenzione": [
   "La carta cartacea non serve più per viaggiare all'estero, anche se riporta una scadenza successiva.",
   "Nei casi urgenti, fino al 31 dicembre 2027, il sindaco può rilasciare un documento provvisorio (massimo 6 mesi, non rinnovabile, valido per l'espatrio ma non accettato da tutti gli Stati).",
   "I diritti comunali cambiano da Comune a Comune: controlla l'importo sul sito del tuo Comune.",
   "Conserva la prima metà di PIN e PUK consegnata allo sportello: serve per usare la CIE online (CieID)."
  ],
  "norme": [
   {
    "titolo": "D.l. 31 gennaio 2005, n. 7, art. 7-vicies ter (documenti in formato elettronico)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2005-01-31;7~art7viciester"
   },
   {
    "titolo": "D.l. 26 giugno 2026, n. 108, art. 11 (efficacia della carta cartacea), conv. l. 4 agosto 2026, n. 142",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2026-06-26;108~art11"
   }
  ],
  "fonti": [
   {
    "titolo": "Ministero dell'Interno – CIE: rilascio e rinnovo in Italia",
    "url": "https://www.cartaidentita.interno.gov.it/richiedi/rilascio-e-rinnovo-in-italia/"
   },
   {
    "titolo": "Prefettura di Bolzano – Disposizioni urgenti per garantire l'efficacia del documento di identità",
    "url": "https://prefettura.interno.gov.it/it/prefetture/bolzano/notizie/disposizioni-urgenti-garantire-lefficacia-documento-identita"
   },
   {
    "titolo": "Normattiva – d.l. 108/2026 art. 11",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2026-06-26;108~art11"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "carta-identita-minori-espatrio",
  "titolo": "Carta d'identità per minori e assenso per l'espatrio",
  "categoria": "anagrafe",
  "sinonimi": [
   "carta d'identità neonato",
   "carta d'identità bambino",
   "assenso espatrio minore",
   "carta d'identità valida per l'espatrio minori",
   "bambino viaggio all'estero documenti",
   "dichiarazione di accompagnamento",
   "minore viaggia con nonni",
   "nomi dei genitori sulla carta d'identità"
  ],
  "chi": "Minori cittadini italiani, dalla nascita, con i genitori o chi esercita la responsabilità genitoriale.",
  "dove": "Comune di residenza (carta d'identità); Questura o Commissariato per la dichiarazione di accompagnamento dei minori di 14 anni.",
  "online": {
   "stato": "parziale",
   "url": "https://www.prenotazionicie.interno.gov.it/cittadino/n/sc/wizardAppuntamentoCittadino/sceltaComune/",
   "note": "Prenotazione online (Agenda CIE) nei Comuni aderenti; la richiesta si fa allo sportello con il minore."
  },
  "passi": [
   "Prenota l'appuntamento in Comune e porta il minore.",
   "Per avere la carta valida per l'espatrio presentatevi entrambi i genitori (o con l'assenso dell'altro genitore secondo le modalità indicate dal Comune; in mancanza, autorizzazione del giudice tutelare).",
   "Dai 12 anni il minore lascia due impronte e firma la carta.",
   "Sotto i 14 anni puoi chiedere che sul retro siano indicati i nomi dei genitori.",
   "Se il minore di 14 anni viaggia all'estero senza un genitore, chiedi per tempo in Questura la dichiarazione di accompagnamento (vale per un viaggio, al massimo 6 mesi)."
  ],
  "documenti": [
   "Fototessera del minore",
   "Codice fiscale/tessera sanitaria del minore",
   "Documenti dei genitori",
   "Assenso del genitore assente con copia del suo documento, se richiesto"
  ],
  "costo": "Come per gli adulti: 16,79 € più i diritti fissi e di segreteria del Comune (variabili).",
  "tempi": "Consegna della CIE entro 6 giorni lavorativi. Validità: 3 anni sotto i 3 anni, 5 anni dai 3 ai 18 anni.",
  "scadenze": "I minori di 14 anni possono espatriare solo accompagnati da un genitore (o tutore) oppure con la dichiarazione di accompagnamento; per i viaggi in Italia la dichiarazione non si rilascia. La Polizia di frontiera non la rilascia: va chiesta prima.",
  "attenzione": [
   "Le vecchie carte cartacee dei minori non valgono più per l'espatrio dal 3 agosto 2026.",
   "Se i nomi dei genitori non sono sulla carta, il genitore che accompagna il figlio all'estero deve poter dimostrare la parentela (certificato o estratto di nascita).",
   "Le compagnie aeree hanno regole proprie per i minori non accompagnati.",
   "Alcuni Paesi non accettano la carta d'identità: verifica i documenti richiesti dal Paese di destinazione."
  ],
  "norme": [
   {
    "titolo": "Legge 21 novembre 1967, n. 1185, art. 3 (assenso dei genitori)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1967-11-21;1185~art3"
   },
   {
    "titolo": "Legge 21 novembre 1967, n. 1185, art. 14 (minori di 14 anni)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1967-11-21;1185~art14"
   }
  ],
  "fonti": [
   {
    "titolo": "Ministero dell'Interno – CIE: rilascio e rinnovo minorenni",
    "url": "https://www.cartaidentita.interno.gov.it/richiedi/rilascio-e-rinnovo-minorenni/"
   },
   {
    "titolo": "Polizia di Stato – Passaporto per i minori e espatrio (agg. 18/02/2026)",
    "url": "https://www.poliziadistato.it/articolo/passaporto-per-i-minori-e-espatrio"
   },
   {
    "titolo": "Normattiva – l. 1185/1967 art. 3",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1967-11-21;1185~art3"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "codice-fiscale",
  "titolo": "Codice fiscale: richiederlo o avere il duplicato della tessera",
  "categoria": "anagrafe",
  "sinonimi": [
   "chiedere il codice fiscale",
   "codice fiscale neonato",
   "codice fiscale stranieri",
   "duplicato tessera sanitaria",
   "ho perso la tessera sanitaria",
   "tesserino codice fiscale",
   "certificato di attribuzione codice fiscale",
   "tessera sanitaria rubata"
  ],
  "chi": "Chi non ha ancora un codice fiscale; chi ha perso o rovinato la tessera sanitaria o il tesserino.",
  "dove": "Neonati: il Comune all'iscrizione in anagrafe. Stranieri: Sportello unico immigrazione o Questura. Italiani all'estero: consolato. Tutti gli altri: qualsiasi ufficio dell'Agenzia delle Entrate. Duplicato tessera sanitaria: area riservata Agenzia Entrate, ASL o ufficio dell'Agenzia.",
  "online": {
   "stato": "parziale",
   "url": "https://www.agenziaentrate.gov.it/portale/richiesta-del-duplicato-della-tessera-sanitaria",
   "note": null
  },
  "passi": [
   "Per un nuovo codice: compila e firma il modello AA4/8.",
   "Invialo via PEC all'ufficio con copia del documento (non serve se firmi digitalmente) oppure portalo in ufficio su appuntamento.",
   "Ricevi il certificato di attribuzione: vale finché non arriva a casa la tessera sanitaria o il tesserino.",
   "Per il duplicato della tessera: entra nell'area riservata con SPID, CIE o CNS e indica il motivo (furto/smarrimento, sostituzione tecnica, mancato recapito).",
   "La nuova tessera arriva al domicilio fiscale o a un altro indirizzo indicato."
  ],
  "documenti": [
   "modello AA4/8",
   "documento d'identità valido (cittadini italiani o UE)",
   "extra UE: passaporto valido (con visto se richiesto) o attestazione consolare con foto o permesso di soggiorno o carta d'identità del comune",
   "per minori: documento del genitore",
   "neonati in casi urgenti: atto di nascita o dichiarazione di nascita"
  ],
  "costo": null,
  "tempi": null,
  "scadenze": "Nessuna scadenza di legge per la richiesta.",
  "attenzione": [
   "L'unico codice fiscale valido è quello rilasciato dall'Agenzia: i codici calcolati da siti e app non valgono.",
   "Chi non è iscritto al Servizio sanitario nazionale riceve il tesserino del codice fiscale, non la tessera sanitaria.",
   "Per il duplicato del solo tesserino esiste un servizio online senza autenticazione; per la tessera sanitaria serve l'area riservata.",
   "Online puoi anche stampare una copia della tessera in corso di validità."
  ],
  "norme": [
   {
    "titolo": "DPR 29 settembre 1973, n. 605 (dal 1/1/2027 confluisce nel d.lgs. 141/2026)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1973-09-29;605~art1!vig=2026-10-25"
   }
  ],
  "fonti": [
   {
    "titolo": "Agenzia Entrate - Il Codice Fiscale (cittadini)",
    "url": "https://www.agenziaentrate.gov.it/portale/codice-fiscale-e-tessera-sanitaria/che-cos-cittadini"
   },
   {
    "titolo": "Agenzia Entrate - Richiesta di riemissione della Tessera Sanitaria",
    "url": "https://www.agenziaentrate.gov.it/portale/richiesta-del-duplicato-della-tessera-sanitaria"
   },
   {
    "titolo": "Agenzia Entrate - Carta dei servizi: codice fiscale e tessera sanitaria",
    "url": "https://www.agenziaentrate.gov.it/portale/agenzia/amministrazione-trasparente/servizi-erogati/carta-servizi/i-nostri-servizi/area-identificazione-del-contribuente/codice-fiscale-e-tessera-sanitaria"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "spid-e-cie-id",
  "titolo": "Ottenere lo SPID (o usare la CIE con l'app CieID)",
  "categoria": "anagrafe",
  "sinonimi": [
   "come fare lo SPID",
   "SPID gratis",
   "identità digitale",
   "attivare SPID",
   "SPID Poste",
   "entrare con CIE",
   "CieID",
   "credenziali per i siti della PA",
   "SPID per anziani"
  ],
  "chi": "SPID: maggiorenni con documento di riconoscimento italiano valido (carta d'identità, patente o passaporto), tessera sanitaria o codice fiscale, email e cellulare. Il permesso di soggiorno non è valido per richiederlo. CieID: chi ha una CIE con PIN.",
  "dove": "Presso uno dei gestori di identità (identity provider) accreditati da AgID: online o di persona (uffici dei gestori, punti di riconoscimento, PA abilitate).",
  "online": {
   "stato": "si",
   "url": "https://www.spid.gov.it/cos-e-spid/come-attivare-spid/",
   "note": "Riconoscimento via webcam, audio-video con bonifico, o con CIE/CNS/firma digitale; app CieID: https://www.cartaidentita.interno.gov.it/info-utili/cie-id/"
  },
  "passi": [
   "Prepara documento valido, tessera sanitaria, email e numero di cellulare.",
   "Scegli un gestore dall'elenco ufficiale su spid.gov.it confrontando modalità e costi.",
   "Registrati sul sito del gestore e scegli come farti riconoscere (di persona, webcam, CIE/CNS/firma digitale).",
   "Completa il riconoscimento e attiva le credenziali (spesso con l'app del gestore).",
   "In alternativa allo SPID: scarica l'app CieID, registra la CIE con il PIN di 8 cifre (metà allo sportello, metà con la carta) e usa «Entra con CIE»."
  ],
  "documenti": [
   "Documento di riconoscimento italiano valido",
   "Tessera sanitaria o tesserino del codice fiscale",
   "Indirizzo email e numero di cellulare",
   "Per CieID: CIE 3.0, PIN, smartphone con NFC (Android 6+ o iOS 13+)"
  ],
  "costo": "Usare SPID per i servizi online è gratuito; farsi identificare presso una PA è gratuito. I costi di attivazione dipendono dal gestore e dalla modalità: alcuni gratis (es. riconoscimento con CIE/CNS/firma digitale presso vari gestori; di persona con Lepida ID), altri a pagamento (es. webcam TIM ID 19,90 € + IVA = 24,28 €, Lepida ID webcam 15,00 € + IVA). La pagina ufficiale non indica canoni di rinnovo, salvo TIM ID per le imprese (36 € + IVA l'anno).",
  "tempi": null,
  "scadenze": "Nessuna scadenza di legge per il cittadino. Gli iscritti AIRE devono scegliere modalità online contrassegnate per l'estero.",
  "attenzione": [
   "Scegli il gestore solo dall'elenco su spid.gov.it: esistono siti che si fanno pagare per «aiutare» ad attivare SPID.",
   "Costi e canoni dei gestori possono cambiare: verifica sul sito del gestore prima di attivare.",
   "Chi ha la CIE con PIN può già accedere ai servizi pubblici senza SPID."
  ],
  "norme": [
   {
    "titolo": "D.lgs. 7 marzo 2005, n. 82 (CAD), art. 64",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-03-07;82~art64"
   }
  ],
  "fonti": [
   {
    "titolo": "SPID – Come attivare SPID",
    "url": "https://www.spid.gov.it/cos-e-spid/come-attivare-spid/"
   },
   {
    "titolo": "SPID – Come scegliere tra i gestori di identità digitale",
    "url": "https://www.spid.gov.it/cos-e-spid/come-scegliere-tra-gli-idp/"
   },
   {
    "titolo": "Ministero dell'Interno – App CieID",
    "url": "https://www.cartaidentita.interno.gov.it/info-utili/cie-id/"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "passaporto",
  "titolo": "Passaporto: primo rilascio e rinnovo",
  "categoria": "anagrafe",
  "sinonimi": [
   "fare il passaporto",
   "rinnovare il passaporto",
   "passaporto scaduto",
   "agenda passaporto",
   "appuntamento questura passaporto",
   "quanto costa il passaporto",
   "passaporto urgente",
   "passaporto per bambini"
  ],
  "chi": "Cittadini italiani; per i minori serve l'assenso di entrambi i genitori (o del giudice tutelare).",
  "dove": "Ufficio passaporti della Questura o del Commissariato di P.S.; all'estero, ambasciate e consolati.",
  "online": {
   "stato": "parziale",
   "url": "https://passaportonline.poliziadistato.it/",
   "note": "Online solo la prenotazione dell'appuntamento (Agenda passaporto) con SPID o CIE; per urgenze documentate ci si può rivolgere direttamente alla Questura."
  },
  "passi": [
   "Prenota su Agenda passaporto con SPID o CIE.",
   "Paga 42,70 € (Poste o prestatori aderenti alla piattaforma di incasso dello Stato; dalla prenotazione dal 27 ottobre 2026 si può generare un avviso PagoPA) e compra il contrassegno amministrativo da 73,50 € (tabaccheria/rivendita valori bollati).",
   "Presentati all'appuntamento con modulo, documento, foto e ricevute; si rilevano le impronte (dai 12 anni).",
   "Attendi l'email che il passaporto è pronto.",
   "Ritiralo in ufficio (anche tramite delegato maggiorenne) o scegli «Passaporto a domicilio» con Poste (9,88 € al postino)."
  ],
  "documenti": [
   "Modulo di richiesta (ricevuto via email dopo la prenotazione o stampato)",
   "Documento di riconoscimento valido e fotocopia",
   "1 fototessera 35x45 mm, sfondo bianco",
   "Ricevuta del versamento di 42,70 €",
   "Contrassegno amministrativo da 73,50 €",
   "Vecchio passaporto (o denuncia in caso di furto/smarrimento)",
   "Minori: assenso di entrambi i genitori (modulo firmato + copia documento del genitore assente)"
  ],
  "costo": "42,70 € (versamento per il passaporto ordinario) + 73,50 € (contrassegno amministrativo) = 116,20 €; consegna a domicilio facoltativa 9,88 €.",
  "tempi": null,
  "scadenze": "Validità: 10 anni per i maggiorenni; 3 anni sotto i 3 anni; 5 anni tra 3 e 18 anni. Se non ritirato entro un anno, il passaporto viene distrutto.",
  "attenzione": [
   "L'importo è 42,70 €, non più 42,50 €: molte pagine (anche di singole Questure) sono vecchie.",
   "Dal 1° dicembre 2025 il bollettino postale non è più accettato.",
   "Non pagare siti privati per «prenotare il passaporto»: la prenotazione ufficiale è gratuita su passaportonline.poliziadistato.it.",
   "Per il passaporto del figlio minore serve l'assenso di entrambi i genitori; senza, l'autorizzazione del giudice tutelare."
  ],
  "norme": [
   {
    "titolo": "Legge 21 novembre 1967, n. 1185 (passaporti), art. 3",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1967-11-21;1185~art3"
   }
  ],
  "fonti": [
   {
    "titolo": "Polizia di Stato – Il rilascio del passaporto (modificato il 22/10/2026)",
    "url": "https://www.poliziadistato.it/articolo/il-rilascio"
   },
   {
    "titolo": "Polizia di Stato – Passaporto per i minori e espatrio",
    "url": "https://www.poliziadistato.it/articolo/passaporto-per-i-minori-e-espatrio"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "certificati-anagrafici-online",
  "titolo": "Scaricare certificati anagrafici online (ANPR)",
  "categoria": "anagrafe",
  "sinonimi": [
   "certificato di residenza online",
   "stato di famiglia online",
   "certificato anagrafico gratis",
   "certificato di nascita online",
   "scaricare certificati ANPR",
   "certificato contestuale",
   "bollo certificato anagrafico",
   "estratto di nascita online"
  ],
  "chi": "Chi è iscritto in ANPR, per sé o per un componente della propria famiglia anagrafica (i certificati elettorali solo per sé).",
  "dove": "Online su ANPR; certificati storici e di morte allo sportello anagrafe del Comune di residenza o di iscrizione AIRE.",
  "online": {
   "stato": "si",
   "url": "https://www.anagrafenazionale.interno.it/servizi-al-cittadino/",
   "note": "Accesso con SPID, CIE, CNS o eIDAS."
  },
  "passi": [
   "Entra in ANPR e scegli «Certificati ed estratti».",
   "Scegli l'intestatario, il tipo di certificato e l'uso (che determina bollo o esenzione).",
   "Controlla l'anteprima.",
   "Se dovuto, paga il bollo: il sistema ti porta al portale dei pagamenti.",
   "Scarica il PDF o fattelo inviare per email o al domicilio digitale."
  ],
  "documenti": [
   "Identità digitale (SPID, CIE o CNS)",
   "Per gli estratti di stato civile: una motivazione concreta"
  ],
  "costo": "Certificati anagrafici: gratuiti solo se l'uso rientra nelle esenzioni di legge, altrimenti imposta di bollo di 16 €. Certificati elettorali: gratuiti per uso elettorale, referendario o di iniziativa popolare, altrimenti 16 €. Certificati ed estratti di stato civile: gratuiti.",
  "tempi": "Certificati anagrafici, elettorali e di stato civile: subito. Estratti di stato civile: non immediati, li lavora il Comune che ha formato l'atto. Validità: 3 mesi i certificati anagrafici, 6 mesi quelli elettorali e di stato civile.",
  "scadenze": "Con la Pubblica Amministrazione non servono certificati: si usa l'autocertificazione; i certificati valgono nei rapporti tra privati.",
  "attenzione": [
   "Non è vero che i certificati online sono sempre gratis: senza un motivo di esenzione si paga il bollo da 16 €.",
   "Per uffici pubblici, scuole e gestori di servizi pubblici basta l'autocertificazione.",
   "Gli estratti di stato civile con motivazione generica possono essere rifiutati.",
   "I certificati di stato civile online esistono solo per atti formati digitalmente (Comuni aderenti all'ANSC)."
  ],
  "norme": [
   {
    "titolo": "D.P.R. 30 maggio 1989, n. 223 (regolamento anagrafico)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:1989-05-30;223"
   },
   {
    "titolo": "D.P.R. 26 ottobre 1972, n. 642 (imposta di bollo)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:1972-10-26;642"
   }
  ],
  "fonti": [
   {
    "titolo": "ANPR – Certificati ed estratti",
    "url": "https://www.anagrafenazionale.interno.it/area-cittadino/certificati/"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "iscrizione-aire",
  "titolo": "Trasferirsi all'estero: iscrizione all'AIRE",
  "categoria": "anagrafe",
  "sinonimi": [
   "iscrizione AIRE",
   "mi trasferisco all'estero",
   "residenza all'estero",
   "Fast It",
   "anagrafe italiani residenti all'estero",
   "sanzione mancata iscrizione AIRE",
   "cambio indirizzo all'estero consolato",
   "cancellazione residenza italiana"
  ],
  "chi": "Cittadini italiani che si trasferiscono all'estero per più di 12 mesi, e quelli che già vivono all'estero (nati lì o diventati cittadini dopo). Non devono iscriversi, tra gli altri, chi va all'estero per meno di un anno, i lavoratori stagionali e alcune categorie di dipendenti pubblici e militari in servizio all'estero.",
  "dove": "Ufficio consolare competente per il luogo di residenza all'estero (la pratica arriva poi al Comune italiano).",
  "online": {
   "stato": "si",
   "url": "https://serviziconsolari.esteri.it/",
   "note": "Portale FAST IT del Ministero degli Esteri; creare l'account non basta, la domanda va completata con gli allegati."
  },
  "passi": [
   "Registrati sul portale FAST IT.",
   "Compila la domanda di iscrizione AIRE indicando i familiari con cittadinanza italiana.",
   "Allega la documentazione che prova la residenza nella circoscrizione consolare e il documento d'identità.",
   "Invia entro 90 giorni dall'arrivo all'estero.",
   "Segui lo stato della pratica sul portale; il Consolato la trasmette al Comune."
  ],
  "documenti": [
   "Documento d'identità/passaporto",
   "Prova della residenza nella circoscrizione consolare (secondo le istruzioni del Consolato)",
   "Dati dei familiari con cittadinanza italiana"
  ],
  "costo": null,
  "tempi": null,
  "scadenze": "Dichiarazione entro 90 giorni dal trasferimento all'estero; anche i cambi di indirizzo all'estero vanno dichiarati entro 90 giorni. Dal 1° gennaio 2024 chi non si iscrive rischia una sanzione da 200 a 1.000 € per ogni anno di mancata iscrizione (l. 213/2023), irrogata dal Comune.",
  "attenzione": [
   "Creare l'account FAST IT non equivale a iscriversi.",
   "Dati diversi dal passaporto o allegati mancanti portano al rifiuto della domanda.",
   "Le istruzioni pratiche (documenti accettati come prova di residenza) cambiano da Consolato a Consolato."
  ],
  "norme": [
   {
    "titolo": "Legge 27 ottobre 1988, n. 470, art. 6",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1988-10-27;470~art6"
   }
  ],
  "fonti": [
   {
    "titolo": "Consolato Generale d'Italia a Madrid – Chi si deve iscrivere all'AIRE",
    "url": "https://consmadrid.esteri.it/it/servizi-consolari-e-visti/servizi-per-il-cittadino-italiano/anagrafe-degli-italiani-residenti-allestero-aire/chi-si-deve-iscrivere-alla-i-r-e-e-chi-no-e-obbligatorio/"
   },
   {
    "titolo": "Normattiva – l. 470/1988 art. 6",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1988-10-27;470~art6"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "assegno-unico",
  "titolo": "Assegno unico universale per i figli: domanda e rinnovo",
  "categoria": "famiglia",
  "sinonimi": [
   "assegno unico",
   "auu inps",
   "rinnovo assegno unico",
   "assegno unico 2026",
   "assegno figli inps",
   "assegno unico importo minimo",
   "domanda assegno unico neonato",
   "assegno unico arretrati"
  ],
  "chi": "Famiglie con figli a carico: minorenni (dal settimo mese di gravidanza), maggiorenni fino a 21 anni con reddito sotto 8.000 euro che studiano, fanno tirocinio o lavorano, sono disoccupati iscritti o fanno servizio civile; figli con disabilità senza limiti di età. Requisiti di cittadinanza/soggiorno, IRPEF e residenza o lavoro in Italia.",
  "dove": "INPS.",
  "online": {
   "stato": "si",
   "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-unico-e-universale-per-i-figli-a-carico-55984.assegno-unico-e-universale-per-i-figli-a-carico.html",
   "note": null
  },
  "passi": [
   "Se hai già una domanda 'accolta' non serve una nuova domanda: l'assegno continua d'ufficio (salvo domanda decaduta, revocata o respinta).",
   "Altrimenti presenta la domanda online sul sito o app INPS, al Contact center (803 164 / 06 164 164) o tramite patronato.",
   "Ogni anno presenta una nuova DSU per avere l'ISEE aggiornato (vedi scheda ISEE).",
   "Comunica le variazioni, ad esempio la nascita di un altro figlio."
  ],
  "documenti": [
   "SPID, CIE o CNS",
   "dati dei figli",
   "IBAN",
   "ISEE valido (facoltativo, ma senza ISEE si prende l'importo minimo)"
  ],
  "costo": "Domanda gratuita. Importi 2026 per figlio minore: da 203,8 euro (ISEE fino a 17.468,51 euro) a 58,3 euro (senza ISEE o con ISEE pari o superiore a 46.582,71 euro), più eventuali maggiorazioni (circolare INPS n. 7 del 30/01/2026).",
  "tempi": "Domande dal 1° marzo al 30 giugno: arretrati da marzo. Domande dopo il 30 giugno: dal mese successivo alla presentazione.",
  "scadenze": "Senza ISEE valido da marzo si riceve l'importo minimo. DSU presentata entro il 30 giugno: diritto agli arretrati da marzo (per il 2026 il termine è scaduto).",
  "attenzione": [
   "Rinnovare la domanda non serve, rinnovare l'ISEE sì: è l'errore più comune.",
   "Dal 2026 per l'assegno si usa l'ISEE per specifiche prestazioni familiari: gennaio e febbraio 2026 sono stati calcolati con l'ISEE valido al 31/12/2025.",
   "Per i lavoratori non residenti l'importo è proporzionato alla durata del lavoro in Italia."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 29 dicembre 2021, n. 230",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2021-12-29;230"
   }
  ],
  "fonti": [
   {
    "titolo": "INPS - Assegno unico e universale per i figli a carico (scheda)",
    "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-unico-e-universale-per-i-figli-a-carico-55984.assegno-unico-e-universale-per-i-figli-a-carico.html"
   },
   {
    "titolo": "INPS - Assegno unico 2026: presentazione domanda e aggiornamento importi",
    "url": "https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.assegno-unico-2026-presentazione-domanda-e-aggiornamento-importi.html"
   }
  ],
  "collegati": [
   "mi-spetta"
  ],
  "verificato": "2026-10-25"
 },
 {
  "id": "unione-civile",
  "titolo": "Costituire un'unione civile",
  "categoria": "famiglia",
  "sinonimi": [
   "unione civile",
   "unione civile stesso sesso",
   "unirsi civilmente",
   "legge Cirinnà",
   "documenti unione civile",
   "unione civile in comune",
   "registrare unione civile",
   "coppie omosessuali comune"
  ],
  "chi": "Due persone maggiorenni dello stesso sesso, senza cause impeditive (matrimonio o unione già in essere, interdizione, parentela stretta, condanne per omicidio verso il coniuge/unito dell'altro).",
  "dove": "Ufficio di stato civile del Comune scelto dalle parti.",
  "online": {
   "stato": "no",
   "url": null,
   "note": "Modalità di prenotazione variabili per Comune."
  },
  "passi": [
   "Presentate la richiesta all'ufficio di stato civile del Comune scelto (anche tramite persona con incarico speciale) dichiarando i vostri dati e l'assenza di impedimenti.",
   "L'ufficiale redige e firma con voi il processo verbale.",
   "Il Comune fa le verifiche entro 30 giorni e vi comunica l'esito.",
   "Costituite l'unione con una dichiarazione davanti all'ufficiale e a due testimoni.",
   "Fatelo entro 180 giorni dal termine delle verifiche: dopo, richiesta e verifiche decadono."
  ],
  "documenti": [
   "Documenti d'identità delle parti",
   "Dichiarazione di nome, cognome, data e luogo di nascita, cittadinanza e residenza",
   "Dati di due testimoni maggiorenni",
   "Cittadini stranieri: documenti richiesti dall'ufficio (variano)"
  ],
  "costo": null,
  "tempi": "Verifiche entro 30 giorni dal verbale; costituzione entro 180 giorni dalla fine delle verifiche.",
  "scadenze": "Se l'unione non si costituisce entro 180 giorni, la richiesta va ripresentata.",
  "attenzione": [
   "Per l'unione civile non ci sono le pubblicazioni del matrimonio: ci sono il verbale e le verifiche di 30 giorni.",
   "Diritti e costi della sala li decide il Comune."
  ],
  "norme": [
   {
    "titolo": "Legge 20 maggio 2016, n. 76, art. 1",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2016-05-20;76~art1"
   },
   {
    "titolo": "D.P.R. 396/2000, art. 70-bis (richiesta)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:2000-11-03;396~art70bis"
   },
   {
    "titolo": "D.P.R. 396/2000, art. 70-ter (verifiche)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:2000-11-03;396~art70ter"
   }
  ],
  "fonti": [
   {
    "titolo": "Normattiva – l. 76/2016 art. 1",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2016-05-20;76~art1"
   },
   {
    "titolo": "Normattiva – d.P.R. 396/2000 artt. 70-bis e 70-ter",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:2000-11-03;396~art70ter"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "dichiarazione-nascita",
  "titolo": "Dichiarare la nascita di un figlio e iscriverlo all'anagrafe",
  "categoria": "famiglia",
  "sinonimi": [
   "registrare un neonato",
   "dichiarazione di nascita",
   "atto di nascita",
   "iscrizione anagrafe neonato",
   "entro quanti giorni dichiarare la nascita",
   "riconoscimento figlio in ospedale",
   "nascita in ospedale comune",
   "dare il nome al bambino"
  ],
  "chi": "Uno dei genitori, un procuratore speciale, oppure il medico, l'ostetrica o altra persona che ha assistito al parto (rispettando l'eventuale volontà della madre di non essere nominata).",
  "dove": "Direzione sanitaria dell'ospedale o casa di cura dove è avvenuto il parto, oppure ufficio di stato civile del Comune di nascita o del Comune di residenza dei genitori (se risiedono in Comuni diversi, salvo accordo, quello della madre).",
  "online": {
   "stato": "no",
   "url": null,
   "note": "Non risulta un servizio nazionale online per la dichiarazione."
  },
  "passi": [
   "Fatti rilasciare l'attestazione di nascita dall'ospedale/ostetrica.",
   "Entro 3 giorni: dichiara la nascita alla direzione sanitaria dell'ospedale, che trasmette tutto al Comune; oppure entro 10 giorni vai all'ufficio di stato civile del Comune di nascita o di residenza.",
   "L'ufficiale di stato civile forma l'atto di nascita (nome, riconoscimento).",
   "Il Comune di residenza iscrive il neonato in anagrafe nella famiglia dei genitori.",
   "Dopo la nascita valuta le domande INPS per i figli (assegno unico, bonus) sul portale INPS."
  ],
  "documenti": [
   "Attestazione di avvenuta nascita (dati della puerpera, luogo, giorno, ora, sesso del bambino); se il parto non è assistito, dichiarazione sostitutiva",
   "Documento di identità del dichiarante (o dei genitori)"
  ],
  "costo": null,
  "tempi": "La direzione sanitaria trasmette la documentazione all'ufficiale di stato civile entro 10 giorni.",
  "scadenze": "Entro 3 giorni dalla nascita presso la direzione sanitaria; entro 10 giorni presso il Comune di nascita o di residenza.",
  "attenzione": [
   "I termini sono brevi: 3 giorni per farla in ospedale, 10 giorni per farla in Comune.",
   "Se i genitori risiedono in Comuni diversi, salvo diverso accordo, la si fa nel Comune di residenza della madre.",
   "Le regole pratiche (appuntamenti, documenti aggiuntivi) cambiano da Comune a Comune."
  ],
  "norme": [
   {
    "titolo": "D.P.R. 3 novembre 2000, n. 396 (stato civile), art. 30",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:2000-11-03;396~art30"
   }
  ],
  "fonti": [
   {
    "titolo": "Normattiva – d.P.R. 396/2000 art. 30 (dichiarazione di nascita)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:2000-11-03;396~art30"
   }
  ],
  "collegati": [
   "mi-spetta"
  ],
  "verificato": "2026-10-25"
 },
 {
  "id": "decesso-cosa-fare",
  "titolo": "Dopo un decesso: dichiarazione di morte e prime comunicazioni",
  "categoria": "famiglia",
  "sinonimi": [
   "è morto un familiare cosa fare",
   "dichiarazione di morte",
   "denuncia di morte",
   "certificato di morte",
   "pratiche dopo un decesso",
   "pensione di reversibilità",
   "comunicare il decesso all'INPS",
   "morte in ospedale"
  ],
  "chi": "Un congiunto, un convivente, un loro delegato (spesso l'impresa funebre) o, in mancanza, una persona informata; se la morte avviene in ospedale o struttura, il direttore deve inviare l'avviso al Comune.",
  "dove": "Ufficio di stato civile del Comune dove è avvenuto il decesso; per la pensione ai superstiti, INPS.",
  "online": {
   "stato": "parziale",
   "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.pensione-ai-superstiti-indiretta-e-di-reversibilit--50605.pensione-ai-superstiti-indiretta-e-di-reversibilit-.html",
   "note": "La dichiarazione di morte può essere inviata anche in formato digitale via PEC; la domanda di pensione ai superstiti si fa online all'INPS. I certificati di morte non si scaricano da ANPR: vanno chiesti allo sportello."
  },
  "passi": [
   "Entro 24 ore dal decesso fai (o fai fare dall'impresa funebre) la dichiarazione di morte allo stato civile del Comune; in ospedale provvede la struttura.",
   "Chiedi al Comune i certificati di morte che ti servono (non sono disponibili online su ANPR).",
   "Se il defunto era pensionato o lavoratore, valuta la pensione ai superstiti: domanda online all'INPS, contact center 803 164 (fisso) / 06 164 164 (mobile) o patronato.",
   "Entro 12 mesi presenta la dichiarazione di successione se dovuta (vedi scheda dedicata).",
   "Avvisa banche, assicurazioni e gestori di utenze per chiudere o volturare i contratti."
  ],
  "documenti": [
   "Documento del defunto e del dichiarante",
   "Avviso/certificato del medico (in ospedale lo trasmette la struttura)",
   "Per l'INPS: dati del defunto e dei superstiti"
  ],
  "costo": null,
  "tempi": "La pensione ai superstiti decorre dal primo giorno del mese successivo al decesso.",
  "scadenze": "Dichiarazione di morte entro 24 ore dal decesso; dichiarazione di successione entro 12 mesi (se dovuta).",
  "attenzione": [
   "Chi si risposa perde la pensione di reversibilità ma ha diritto a un assegno una tantum pari a due annualità (INPS).",
   "Diffida di chi chiede soldi per «sbloccare» pratiche INPS: la domanda è gratuita, anche tramite patronato.",
   "Trasporto e sepoltura hanno regole e tariffe comunali/regionali."
  ],
  "norme": [
   {
    "titolo": "D.P.R. 3 novembre 2000, n. 396, art. 72 (dichiarazione di morte)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:2000-11-03;396~art72"
   }
  ],
  "fonti": [
   {
    "titolo": "Normattiva – d.P.R. 396/2000 art. 72",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:2000-11-03;396~art72"
   },
   {
    "titolo": "INPS – Pensione ai superstiti indiretta e di reversibilità (agg. 12/06/2026)",
    "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.pensione-ai-superstiti-indiretta-e-di-reversibilit--50605.pensione-ai-superstiti-indiretta-e-di-reversibilit-.html"
   },
   {
    "titolo": "ANPR – Certificati ed estratti (certificati di morte non disponibili online)",
    "url": "https://www.anagrafenazionale.interno.it/area-cittadino/certificati/"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "separazione-divorzio-comune",
  "titolo": "Separazione o divorzio davanti al sindaco (in Comune)",
  "categoria": "famiglia",
  "sinonimi": [
   "separazione in comune",
   "divorzio in comune",
   "divorzio breve comune",
   "separazione senza avvocato",
   "separazione consensuale ufficiale di stato civile",
   "art 12 decreto 132/2014",
   "modifica condizioni divorzio comune",
   "quanto costa separarsi in comune"
  ],
  "chi": "Coniugi d'accordo, SENZA figli minori, figli maggiorenni incapaci, con handicap grave o economicamente non autosufficienti. L'accordo non può contenere trasferimenti di beni. Per il divorzio serve una separazione già durata almeno 6 mesi (consensuale o in Comune) o 12 mesi (giudiziale).",
  "dove": "Ufficiale dello stato civile del Comune di residenza di uno dei coniugi o del Comune dove è iscritto o trascritto l'atto di matrimonio.",
  "online": {
   "stato": "no",
   "url": null,
   "note": "Le dichiarazioni si rendono personalmente davanti all'ufficiale; prenotazione secondo le regole del Comune."
  },
  "passi": [
   "Verificate di avere i requisiti (niente figli minori o non autosufficienti, niente trasferimenti patrimoniali).",
   "Prendete appuntamento con l'ufficio di stato civile competente.",
   "Ognuno dichiara personalmente di volersi separare/divorziare alle condizioni concordate (avvocato facoltativo); l'atto si firma subito.",
   "L'ufficiale vi convoca non prima di 30 giorni per la conferma dell'accordo.",
   "Presentatevi alla conferma: se uno non si presenta, l'accordo non è confermato."
  ],
  "documenti": [
   "Documenti d'identità dei coniugi",
   "Dati dell'atto di matrimonio",
   "Per il divorzio: estremi della separazione e data da cui decorre"
  ],
  "costo": "Diritto fisso fissato dal Comune, non superiore all'imposta fissa di bollo prevista per le pubblicazioni di matrimonio (l. 604/1962, tab. D, punto 11-bis). L'importo di quel bollo non è stato verificato in questa sessione.",
  "tempi": "Conferma davanti all'ufficiale non prima di 30 giorni dalle dichiarazioni. Il divorzio si può chiedere dopo 6 mesi dalla data dell'accordo di separazione in Comune.",
  "scadenze": "La mancata comparizione alla conferma equivale a mancata conferma dell'accordo.",
  "attenzione": [
   "Con figli minori o non autosufficienti la via del Comune NON è possibile: servono tribunale o negoziazione assistita con avvocati.",
   "Nell'accordo in Comune non si possono trasferire case o altri beni.",
   "L'avvocato è facoltativo: nessuno può imporvelo per questa procedura."
  ],
  "norme": [
   {
    "titolo": "D.l. 12 settembre 2014, n. 132, art. 12",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2014-09-12;132~art12"
   },
   {
    "titolo": "Legge 1 dicembre 1970, n. 898, art. 3 (termini per il divorzio)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1970-12-01;898~art3"
   }
  ],
  "fonti": [
   {
    "titolo": "Normattiva – d.l. 132/2014 art. 12",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2014-09-12;132~art12"
   },
   {
    "titolo": "Normattiva – l. 898/1970 art. 3",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1970-12-01;898~art3"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "matrimonio-civile",
  "titolo": "Sposarsi in Comune: pubblicazioni e matrimonio civile",
  "categoria": "famiglia",
  "sinonimi": [
   "matrimonio civile",
   "pubblicazioni di matrimonio",
   "sposarsi in comune",
   "documenti per sposarsi",
   "quanto tempo prima le pubblicazioni",
   "matrimonio con straniero",
   "nulla osta matrimonio",
   "rito civile"
  ],
  "chi": "Due persone che vogliono sposarsi con rito civile e non hanno impedimenti di legge (età, vincoli precedenti, parentela…).",
  "dove": "Ufficio di stato civile del Comune di residenza di uno dei due (richiesta delle pubblicazioni); celebrazione davanti all'ufficiale di stato civile nella casa comunale o nei luoghi indicati dal Comune.",
  "online": {
   "stato": "no",
   "url": null,
   "note": "Alcuni Comuni accettano la richiesta via email/PEC o prenotazione online: varia per Comune."
  },
  "passi": [
   "Chiedi all'ufficio di stato civile la pubblicazione del matrimonio (spesso su appuntamento).",
   "Il Comune verifica i documenti e pubblica l'atto per almeno 8 giorni (oggi all'albo online).",
   "Dal quarto giorno dopo la fine della pubblicazione puoi celebrare.",
   "Concorda data e luogo con il Comune e presentati con due testimoni.",
   "Celebra entro 180 giorni: dopo, la pubblicazione si considera non avvenuta e va rifatta."
  ],
  "documenti": [
   "Documenti d'identità dei nubendi",
   "Cittadini stranieri: nulla osta o documenti richiesti dall'ufficio (variano per nazionalità)",
   "Documenti dei testimoni al momento della celebrazione"
  ],
  "costo": "Imposta di bollo sulla pubblicazione ed eventuali tariffe comunali per la celebrazione in sale o luoghi particolari: variano per Comune; importi non verificati in questa sessione.",
  "tempi": "Pubblicazione di almeno 8 giorni; celebrazione non prima del quarto giorno dopo la pubblicazione ed entro 180 giorni.",
  "scadenze": "Se il matrimonio non si celebra entro 180 giorni dalla pubblicazione, questa decade.",
  "attenzione": [
   "Muoviti per tempo: dopo la richiesta servono almeno 8 giorni di pubblicazione e altri 4 giorni prima di poter celebrare, più i tempi di controllo del Comune.",
   "Per chi è straniero i documenti esteri possono richiedere legalizzazione e traduzione: chiedi prima all'ufficio.",
   "Le tariffe per sposarsi in location comunali sono decise dal singolo Comune."
  ],
  "norme": [
   {
    "titolo": "Codice civile, art. 99 (termine per la celebrazione)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art99"
   },
   {
    "titolo": "D.P.R. 3 novembre 2000, n. 396, art. 55 (durata della pubblicazione)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:2000-11-03;396~art55"
   }
  ],
  "fonti": [
   {
    "titolo": "Normattiva – Codice civile art. 99",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art99"
   },
   {
    "titolo": "Normattiva – d.P.R. 396/2000 art. 55",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.repubblica:decreto:2000-11-03;396~art55"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "cittadinanza-per-residenza",
  "titolo": "Chiedere la cittadinanza italiana per residenza",
  "categoria": "stranieri",
  "sinonimi": [
   "cittadinanza italiana per residenza",
   "domanda di cittadinanza",
   "dopo 10 anni in Italia",
   "cittadinanza online ministero interno",
   "contributo 250 euro cittadinanza",
   "B1 italiano cittadinanza",
   "tempi cittadinanza",
   "giuramento cittadinanza"
  ],
  "chi": "Stranieri con residenza legale in Italia da almeno: 10 anni (regola generale, extra UE); 4 anni (cittadini UE); 5 anni (apolidi; maggiorenni adottati da italiani dopo l'adozione); 3 anni (nati in Italia); 2 anni (figli/nipoti di cittadini per nascita); 5 anni di servizio per lo Stato. Servono anche redditi sufficienti, assenza di precedenti penali e di motivi ostativi per la sicurezza, e conoscenza dell'italiano non inferiore al B1.",
  "dove": "Domanda online al Ministero dell'Interno; istruttoria della Prefettura della provincia di residenza.",
  "online": {
   "stato": "si",
   "url": "https://portaleserviziapp.dlci.interno.it/AliCittadinanza/ali/home.htm",
   "note": "Al controllo del 25/10/2026 il portale rispondeva «Il servizio è momentaneamente non disponibile»."
  },
  "passi": [
   "Verifica di avere gli anni di residenza legale e gli altri requisiti.",
   "Procurati atto di nascita e certificato penale del Paese d'origine, legalizzati e tradotti, e il titolo che attesta l'italiano B1.",
   "Paga il contributo di 250 € e il bollo da 16 € (anche con PagoPA dal portale).",
   "Compila e invia la domanda online allegando i documenti.",
   "Rispondi alle convocazioni della Prefettura.",
   "Dopo il decreto, presta giuramento in Comune entro 6 mesi dalla notifica."
  ],
  "documenti": [
   "Permesso di soggiorno (extra UE) o attestazione di soggiorno permanente (UE)",
   "Documento d'identità, passaporto estero, codice fiscale",
   "Atto di nascita legalizzato e tradotto",
   "Certificato penale del Paese d'origine legalizzato e tradotto",
   "Titolo di studio o certificazione di lingua italiana (B1)",
   "Dichiarazioni dei redditi degli ultimi 3 anni",
   "Ricevuta del contributo di 250 € e marca da bollo da 16 €"
  ],
  "costo": "Contributo 250 € + marca da bollo 16 € = 266 €, più i costi di legalizzazione e traduzione dei documenti esteri.",
  "tempi": "24 mesi dalla domanda, prorogabili fino a 36 (per domande dal 20 dicembre 2020).",
  "scadenze": "Giuramento entro 6 mesi dalla notifica del decreto, altrimenti il decreto non ha effetto (esonero per grave disabilità accertata).",
  "attenzione": [
   "Non esistono «corsie veloci» a pagamento: la domanda si presenta solo sul portale del Ministero.",
   "I dati nella domanda devono coincidere con quelli dell'atto di nascita tradotto e del documento.",
   "Dal 2025 è esonerato dalla prova di lingua chi ha gravi limitazioni certificate da struttura sanitaria pubblica (Corte cost. 25/2025).",
   "Il d.l. 36/2025 (l. 74/2025) ha cambiato le regole sulla cittadinanza per discendenza: verifica il tuo caso."
  ],
  "norme": [
   {
    "titolo": "Legge 5 febbraio 1992, n. 91 (cittadinanza), artt. 9, 9.1, 9-bis, 9-ter, 10",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1992-02-05;91"
   },
   {
    "titolo": "L. 91/1992 art. 9-bis (contributo 250 €)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1992-02-05;91~art9bis"
   },
   {
    "titolo": "L. 91/1992 art. 9-ter (tempi)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1992-02-05;91~art9ter"
   }
  ],
  "fonti": [
   {
    "titolo": "Ministero dell'Interno – Cittadinanza",
    "url": "https://www.interno.gov.it/it/temi/cittadinanza-e-altri-diritti-civili/cittadinanza"
   },
   {
    "titolo": "Dipartimento Libertà civili e Immigrazione – Concessione della cittadinanza per residenza (art. 9)",
    "url": "https://libertaciviliimmigrazione.dlci.interno.gov.it/temi/concessione-della-cittadinanza-italiana-residenza-sul-territorio-italiano-ai-sensi-dellart-9"
   },
   {
    "titolo": "Prefettura di Potenza – Documenti necessari (cittadinanza per residenza), agg. 14/04/2026",
    "url": "https://prefettura.interno.gov.it/it/prefetture/potenza/documenti-necessari-cittadinanza-residenza"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "permesso-di-soggiorno",
  "titolo": "Permesso di soggiorno: primo rilascio e rinnovo",
  "categoria": "stranieri",
  "sinonimi": [
   "permesso di soggiorno",
   "rinnovo permesso di soggiorno",
   "kit postale",
   "quanto costa il permesso di soggiorno",
   "permesso scaduto",
   "sportello amico",
   "ricevuta poste permesso",
   "stato del permesso di soggiorno"
  ],
  "chi": "Cittadini extra UE entrati regolarmente in Italia per soggiorni oltre i brevi periodi, e chi deve rinnovare o convertire il permesso.",
  "dove": "Per molti tipi di permesso: kit postale da consegnare negli uffici postali «Sportello Amico» (anche con aiuto di Comuni e Patronati; per ricongiungimento e lavoro subordinato lo Sportello Unico in Prefettura). Per gli altri tipi: direttamente la Questura.",
  "online": {
   "stato": "parziale",
   "url": "https://www.portaleimmigrazione.it/",
   "note": "Il Portale Immigrazione informa su kit e costi; la domanda si consegna fisicamente all'ufficio postale o in Questura."
  },
  "passi": [
   "Ritira il kit (busta con striscia gialla, moduli, istruzioni) all'ufficio postale.",
   "Compila i moduli e prepara le copie dei documenti richiesti per il tuo tipo di permesso.",
   "Paga il bollettino (30,46 € + contributo) e applica la marca da bollo da 16 €.",
   "Consegna la busta aperta allo Sportello Amico e paga 30 € di spedizione; conserva la ricevuta.",
   "Presentati in Questura alla data della convocazione con le foto per le impronte.",
   "Ritira il permesso elettronico quando è pronto."
  ],
  "documenti": [
   "Moduli del kit compilati",
   "Passaporto (copia) e visto o permesso in scadenza",
   "Documenti specifici per il motivo del soggiorno (lavoro, famiglia, studio…)",
   "Marca da bollo da 16 €",
   "Ricevuta del bollettino",
   "Fotografie (per la convocazione in Questura)"
  ],
  "costo": "Marca da bollo 16 € + 30,46 € per il permesso elettronico (se durata oltre 90 giorni) + contributo 40 € (durata oltre 3 mesi fino a 1 anno), 50 € (oltre 1 fino a 2 anni) o 100 € (UE lungo periodo, dirigenti e lavoratori specializzati) + 30 € spese postali. Totale tipico: 116,46 € (fino a 1 anno), 126,46 € (1-2 anni), 176,46 € (lungo periodo). Aggiornamento, conversione o duplicato: bollettino da 30,46 €.",
  "tempi": "Per legge il permesso è rilasciato, rinnovato o convertito entro 90 giorni dalla domanda.",
  "scadenze": "Primo rilascio: domanda entro 8 giorni lavorativi dall'ingresso in Italia. Rinnovo: almeno 90 giorni prima della scadenza (testo vigente dell'art. 5 d.lgs. 286/1998).",
  "attenzione": [
   "Il termine per il rinnovo è ora di almeno 90 giorni prima della scadenza: molte guide riportano ancora 60 giorni.",
   "La ricevuta di Poste sostituisce il vecchio «cedolino»: conservala, con il permesso scaduto o il visto serve anche per rientrare nel Paese d'origine.",
   "Il kit è gratuito: nessuno può fartelo pagare. Diffida di agenzie che chiedono soldi per «velocizzare» la pratica.",
   "Sulla pagina del Portale Immigrazione ci sono due refusi nei totali (30,36 € e 70,46 € al posto di 80,46 €): fai riferimento alle singole voci."
  ],
  "norme": [
   {
    "titolo": "D.lgs. 25 luglio 1998, n. 286 (Testo unico immigrazione), art. 5",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1998-07-25;286~art5"
   }
  ],
  "fonti": [
   {
    "titolo": "Polizia di Stato – Permesso di soggiorno: come, dove e quanto costa",
    "url": "https://www.poliziadistato.it/articolo/come-dove-e-quanto-costa"
   },
   {
    "titolo": "Portale Immigrazione – Tabelle costi",
    "url": "https://www.portaleimmigrazione.it/ITA/tabelleCosti.html"
   },
   {
    "titolo": "Normattiva – d.lgs. 286/1998 art. 5",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1998-07-25;286~art5"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "contrassegno-disabili-cude",
  "titolo": "Contrassegno disabili per il parcheggio (CUDE)",
  "categoria": "salute",
  "sinonimi": [
   "contrassegno disabili",
   "cude",
   "pass invalidi",
   "parcheggio disabili",
   "rinnovo contrassegno disabili",
   "permesso ztl disabili",
   "tagliando invalidi",
   "piattaforma cude targhe"
  ],
  "chi": "Persone con capacità di deambulazione impedita o sensibilmente ridotta (anche temporanea, per infortunio o malattia).",
  "dove": "Comune di residenza (domanda al sindaco); certificazione dell'ufficio medico-legale dell'ASL. Registrazione delle targhe per le ZTL: Piattaforma CUDE del Ministero delle infrastrutture e dei trasporti.",
  "online": {
   "stato": "parziale",
   "url": "https://www.ilportaledellautomobilista.it/web/portale-automobilista/piattaforma-cude",
   "note": null
  },
  "passi": [
   "Fatti rilasciare dall'ufficio medico-legale dell'ASL la certificazione che accerta la ridotta capacità di deambulazione.",
   "Presenta la domanda al Comune di residenza con la certificazione (modalità e moduli del tuo Comune).",
   "Ritira il contrassegno: è personale e vale in tutta Italia, su qualsiasi veicolo che ti trasporta.",
   "Se il tuo Comune aderisce, associa le targhe dei veicoli che usi nella Piattaforma CUDE (area riservata del Portale dell'automobilista) per entrare nelle ZTL di altri Comuni senza avvisarli.",
   "Alla scadenza rinnova con il certificato del medico curante."
  ],
  "documenti": [
   "domanda al Comune",
   "certificazione dell'ufficio medico-legale ASL",
   "per il rinnovo: certificato del medico curante",
   "per la piattaforma: codice univoco del CUDE rilasciato dal Comune e SPID/CIE"
  ],
  "costo": null,
  "tempi": null,
  "scadenze": "Validità 5 anni; rinnovo con certificato del medico curante. Contrassegno temporaneo per la durata indicata nella certificazione (rinnovo con nuova certificazione ASL). Va esposto in originale nella parte anteriore del veicolo.",
  "attenzione": [
   "Il contrassegno è personale: usarlo senza la persona a bordo è un illecito.",
   "Non tutti i Comuni aderiscono alla Piattaforma CUDE: verifica nell'elenco dei Comuni aderenti.",
   "Il Comune può assegnare uno stallo personale gratuito in casi particolari e può prevedere la sosta gratuita sulle strisce blu se gli stalli riservati sono occupati.",
   "Costi (bolli, diritti) e tempi di rilascio variano da Comune a Comune."
  ],
  "norme": [
   {
    "titolo": "DPR 16 dicembre 1992, n. 495, art. 381; DM 5 luglio 2021 (piattaforma unica nazionale)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1992-12-16;495~art381"
   }
  ],
  "fonti": [
   {
    "titolo": "Normattiva - DPR 495/1992, art. 381",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1992-12-16;495~art381"
   },
   {
    "titolo": "Portale dell'automobilista - Piattaforma CUDE",
    "url": "https://www.ilportaledellautomobilista.it/web/portale-automobilista/piattaforma-cude"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "esenzione-ticket-reddito",
  "titolo": "Esenzione dal ticket per reddito",
  "categoria": "salute",
  "sinonimi": [
   "esenzione ticket reddito",
   "non pagare il ticket",
   "codice esenzione E01",
   "esenzione disoccupati",
   "esenzione over 65",
   "esenzione pensione sociale",
   "autocertificazione esenzione ticket",
   "ticket sanitario esente"
  ],
  "chi": "Per legge (l. 537/1993, art. 8, c. 16): bambini sotto i 6 anni e persone sopra i 65 in un nucleo con reddito complessivo dell'anno precedente fino a 36.151,98 €; titolari di pensione sociale e familiari a carico; disoccupati e familiari a carico, e titolari di pensione al minimo over 60 e familiari a carico, con reddito del nucleo sotto 8.263,31 € (11.362,05 € con il coniuge, +516,46 € per ogni figlio a carico).",
  "dove": "Medico prescrittore e ASL di residenza; i controlli sono fatti con il Sistema Tessera Sanitaria del MEF.",
  "online": {
   "stato": "parziale",
   "url": "https://sistemats1.sanita.finanze.it/portale/esenzioni-da-reddito-cittadini",
   "note": "Pagina MEF indicata dal Ministero della Salute, ma non leggibile in questa sessione (Access Denied)."
  },
  "passi": [
   "Verifica se rientri in una delle categorie e soglie di reddito.",
   "Chiedi al tuo medico se l'esenzione risulta già negli elenchi del Sistema Tessera Sanitaria.",
   "Se non risulti o la tua situazione è cambiata (es. disoccupazione), rivolgiti alla ASL per l'autocertificazione e l'attestato.",
   "Comunica alla ASL quando perdi i requisiti."
  ],
  "documenti": [
   "Tessera sanitaria",
   "Dati sul reddito del nucleo familiare dell'anno precedente",
   "Per i disoccupati: documentazione dello stato di disoccupazione (secondo ASL)"
  ],
  "costo": "Gratuito.",
  "tempi": null,
  "scadenze": "Il reddito di riferimento è quello dell'anno precedente: i requisiti vanno verificati ogni anno.",
  "attenzione": [
   "Dichiarare un'esenzione senza averne diritto comporta controlli incrociati con i dati fiscali e il recupero delle somme più sanzioni.",
   "Le Regioni possono avere esenzioni aggiuntive o ticket diversi: controlla le regole della tua Regione.",
   "Le soglie in euro sono la conversione degli importi in lire della legge (70, 16 e 22 milioni, 1 milione per figlio)."
  ],
  "norme": [
   {
    "titolo": "Legge 24 dicembre 1993, n. 537, art. 8, comma 16",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1993-12-24;537~art8"
   }
  ],
  "fonti": [
   {
    "titolo": "Ministero della Salute – Esenzioni per reddito",
    "url": "https://www.salute.gov.it/new/it/tema/esenzioni-dal-ticket/esenzioni-reddito/"
   },
   {
    "titolo": "Ministero della Salute – Ticket ed esenzioni (agg. 05/10/2026)",
    "url": "https://www.salute.gov.it/new/it/tema/esenzioni-dal-ticket/ticket-ed-esenzioni/"
   },
   {
    "titolo": "Normattiva – l. 537/1993 art. 8",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1993-12-24;537~art8"
   }
  ],
  "collegati": [
   "mi-spetta"
  ],
  "verificato": "2026-10-25"
 },
 {
  "id": "invalidita-civile-legge-104",
  "titolo": "Richiedere invalidità civile e Legge 104",
  "categoria": "salute",
  "sinonimi": [
   "domanda invalidità civile",
   "legge 104 come si fa",
   "certificato medico introduttivo",
   "riconoscimento handicap",
   "visita commissione invalidità",
   "aggravamento invalidità",
   "valutazione di base",
   "riforma disabilità 2026"
  ],
  "chi": "Cittadini italiani e UE residenti, cittadini extra UE con permesso di soggiorno di almeno un anno, per invalidità civile, cecità, sordità, disabilità (L. 104/1992) e collocamento mirato (L. 68/1999).",
  "dove": "INPS (con commissioni ASL/INPS o Unità di valutazione di base); medico certificatore abilitato.",
  "online": {
   "stato": "si",
   "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.domanda-invalidita-civile-e-accertamento-sanitario-50004.accertamento-sanitario.html",
   "note": null
  },
  "passi": [
   "Vai da un medico certificatore abilitato: compila e invia online a INPS il certificato medico introduttivo e ti dà la ricevuta con il numero.",
   "Nelle 60 province della sperimentazione (d.lgs. 62/2024) il certificato basta: è già la domanda di valutazione di base.",
   "Nelle altre province, fino al 31/12/2026: presenta la domanda online a INPS (SPID, CIE o CNS) o tramite patronato o associazione (ANMIC, ENS, UIC, ANFFAS) entro 90 giorni, indicando il numero del certificato.",
   "Vai alla visita con documento e documentazione medica (puoi portare un medico di fiducia); se non puoi spostarti il medico chiede la visita a domicilio almeno 5 giorni prima.",
   "Ricevi il verbale (versione completa e versione con il solo giudizio finale)."
  ],
  "documenti": [
   "certificato medico introduttivo (numero della ricevuta)",
   "SPID, CIE o CNS (per i minori le credenziali del minore)",
   "documento d'identità",
   "documentazione sanitaria"
  ],
  "costo": "Domanda INPS gratuita. Costo del certificato del medico non indicato dalla fonte (null).",
  "tempi": "Nelle Regioni con convenzione: conclusione entro 120 giorni dalla domanda completa; altrove 45 giorni da quando INPS riceve il verbale ASL.",
  "scadenze": "Certificato valido 90 giorni per abbinarlo alla domanda (procedura ordinaria). Ricorso in tribunale entro 6 mesi dalla comunicazione del provvedimento (art. 42, c. 3, d.l. 269/2003). Dal 1° gennaio 2027 la riforma è prevista a pieno regime in tutta Italia.",
  "attenzione": [
   "La procedura dipende dalla provincia di residenza: chiedi al medico se sei in una provincia della sperimentazione.",
   "Fuori sperimentazione, se lasci passare 90 giorni il certificato scade e va rifatto.",
   "Se salti la visita sei convocato una seconda volta; un'altra assenza equivale a rinuncia.",
   "Non puoi presentare una nuova domanda per la stessa prestazione con una pratica aperta, salvo aggravamento.",
   "Province della prima e seconda fase: Brescia, Catanzaro, Firenze, Forlì-Cesena, Frosinone, Perugia, Salerno, Sassari, Trieste; Alessandria, Aosta, Genova, Isernia, Lecce, Macerata, Matera, Palermo, Teramo, Trento, Vicenza; dal 1/3/2026 altre 40 (elenco nella notizia INPS)."
  ],
  "norme": [
   {
    "titolo": "Legge 5 febbraio 1992, n. 104, art. 4 (come riformato dal d.lgs. 3 maggio 2024, n. 62); D.L. 19 febbraio 2026, n. 19, art. 7 (terza fase)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1992-02-05;104~art4"
   }
  ],
  "fonti": [
   {
    "titolo": "INPS - Domanda invalidità civile e accertamento sanitario",
    "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.domanda-invalidita-civile-e-accertamento-sanitario-50004.accertamento-sanitario.html"
   },
   {
    "titolo": "INPS - Certificato medico introduttivo - Invalidità civile",
    "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.certificato-medico-introduttivo---invalidit--civile.html"
   },
   {
    "titolo": "INPS - Avviata la terza fase sperimentale della riforma della disabilità",
    "url": "https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.03.avviata-la-terza-fase-sperimentale-della-riforma-della-disabilit.html"
   }
  ],
  "collegati": [
   "mi-spetta"
  ],
  "verificato": "2026-10-25"
 },
 {
  "id": "medico-di-base",
  "titolo": "Scegliere o cambiare il medico di base (o il pediatra)",
  "categoria": "salute",
  "sinonimi": [
   "cambiare medico di base",
   "scelta del medico di famiglia",
   "revoca medico",
   "medico di medicina generale",
   "iscrizione al servizio sanitario",
   "pediatra di libera scelta",
   "medico per domiciliati",
   "cambio medico online"
  ],
  "chi": "Gli iscritti al Servizio sanitario nazionale, nell'ASL di residenza (gli iscritti AIRE residenti fuori da UE/AELS presso l'ASL che tiene le loro schede o quella del domicilio di soggiorno).",
  "dove": "Azienda sanitaria locale (ASL/ATS/AUSL) di residenza: sportello scelta e revoca o servizi online regionali.",
  "online": {
   "stato": "parziale",
   "url": null,
   "note": "Varia per Regione: molte Regioni offrono la scelta/revoca online sui propri portali sanitari; non esiste un servizio nazionale unico."
  },
  "passi": [
   "Controlla sul sito della tua ASL o Regione l'elenco dei medici con posti disponibili nel tuo ambito.",
   "Scegli il medico (o il pediatra per i bambini).",
   "Fai la scelta online sul portale regionale o allo sportello ASL; la scelta del nuovo medico revoca il precedente.",
   "Conserva la ricevuta con nome e recapiti del medico."
  ],
  "documenti": [
   "Tessera sanitaria / codice fiscale",
   "Documento d'identità",
   "Eventuale documentazione richiesta dall'ASL (es. per domicilio sanitario)"
  ],
  "costo": "Le prestazioni del medico di medicina generale e del pediatra di libera scelta non prevedono ticket.",
  "tempi": null,
  "scadenze": "Ogni medico assiste di norma al massimo 1.500 adulti (oltre 13 anni) e ogni pediatra 800 bambini (0-13 anni), salvo eccezioni: se il medico scelto è al massimale, va scelto un altro.",
  "attenzione": [
   "La procedura cambia da Regione a Regione: usa il portale ufficiale della tua ASL/Regione.",
   "Il cambio di residenza in un'altra ASL comporta di solito una nuova scelta del medico."
  ],
  "norme": [
   {
    "titolo": "Legge 23 dicembre 1978, n. 833, art. 19 (libera scelta del medico)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1978-12-23;833~art19"
   }
  ],
  "fonti": [
   {
    "titolo": "Ministero della Salute – Assistenza sanitaria distrettuale (massimali MMG/PLS)",
    "url": "https://www.salute.gov.it/new/it/tema/statistiche-sanitarie/assistenza-sanitaria-distrettuale/"
   },
   {
    "titolo": "Ministero della Salute – Ticket ed esenzioni",
    "url": "https://www.salute.gov.it/new/it/tema/esenzioni-dal-ticket/ticket-ed-esenzioni/"
   },
   {
    "titolo": "Normattiva – l. 833/1978 art. 19",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1978-12-23;833~art19"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "tessera-sanitaria-e-fse",
  "titolo": "Tessera sanitaria e Fascicolo sanitario elettronico (FSE)",
  "categoria": "salute",
  "sinonimi": [
   "tessera sanitaria scaduta",
   "rinnovo tessera sanitaria",
   "duplicato tessera sanitaria",
   "fascicolo sanitario elettronico",
   "vedere i referti online",
   "consenso fascicolo sanitario",
   "FSE 2.0",
   "tessera sanitaria smarrita"
  ],
  "chi": "Tutti gli iscritti al Servizio sanitario nazionale.",
  "dove": "Tessera sanitaria: Agenzia delle Entrate (canali ufficiali). FSE: portale nazionale o portale della propria Regione/Provincia autonoma di assistenza.",
  "online": {
   "stato": "si",
   "url": "https://www.fascicolosanitario.gov.it/",
   "note": "Accesso al FSE secondo le modalità della Regione di assistenza; richieste sulla tessera solo tramite i canali ufficiali come il sito dell'Agenzia delle Entrate."
  },
  "passi": [
   "Tessera: se non l'hai persa e non ti è stata rubata, non devi fare nulla: alla scadenza la nuova arriva a casa da sola.",
   "In caso di smarrimento o furto chiedi il duplicato solo sui canali ufficiali (sito dell'Agenzia delle Entrate).",
   "FSE: entra dal portale nazionale o da quello della tua Regione con le credenziali previste dalla Regione.",
   "Nel FSE consulta referti, prescrizioni, vaccinazioni e decidi a chi consentire la consultazione da parte dei professionisti sanitari."
  ],
  "documenti": [
   "Codice fiscale / dati anagrafici",
   "Identità digitale per il FSE (secondo le modalità regionali)"
  ],
  "costo": null,
  "tempi": "La tessera sanitaria vale 6 anni e viene rinnovata e spedita automaticamente alla scadenza.",
  "scadenze": "Nessun obbligo di richiedere il rinnovo della tessera, salvo smarrimento o furto.",
  "attenzione": [
   "Il Ministero della Salute non invia email con link per rinnovare la tessera: sono truffe (phishing). Non cliccare e cancella il messaggio.",
   "Circolano anche false email per «mantenere attivo» il Fascicolo sanitario elettronico (allerta del Ministero, luglio 2025).",
   "Nel FSE i dati sono sempre consultabili da te e da chi li ha prodotti; per gli altri professionisti conta il consenso alla consultazione."
  ],
  "norme": [
   {
    "titolo": "D.l. 18 ottobre 2012, n. 179, art. 12 (Fascicolo sanitario elettronico)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2012-10-18;179~art12"
   }
  ],
  "fonti": [
   {
    "titolo": "Ministero della Salute – Attenzione a false email sul rinnovo della tessera sanitaria (12/01/2026)",
    "url": "https://www.salute.gov.it/new/it/news-e-media/notizie/attenzione-false-email-sul-rinnovo-della-tessera-sanitaria-tentativo-di-truffa/"
   },
   {
    "titolo": "Ministero della Salute – FSE 2.0, in GU il decreto attuativo",
    "url": "https://www.salute.gov.it/new/it/news-e-media/notizie/fascicolo-sanitario-elettronico-20-gu-il-decreto-attuativo/"
   },
   {
    "titolo": "Normattiva – d.l. 179/2012 art. 12",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2012-10-18;179~art12"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "asilo-nido-e-bonus-nido",
  "titolo": "Asilo nido: iscrizione e bonus nido INPS",
  "categoria": "scuola",
  "sinonimi": [
   "iscrizione asilo nido",
   "bonus nido",
   "bonus asilo nido 2026",
   "contributo retta nido INPS",
   "nido comunale graduatoria",
   "rimborso retta asilo",
   "bonus nido ISEE",
   "supporto domiciliare bambini malattie croniche"
  ],
  "chi": "Iscrizione al nido: genitori di bambini sotto i 3 anni, secondo i bandi del Comune o della struttura. Bonus INPS: il genitore che paga la retta di un nido pubblico o privato autorizzato (o, per bambini con gravi patologie croniche certificate, di un supporto a casa).",
  "dove": "Iscrizione: Comune o struttura (regole e graduatorie locali). Bonus: INPS online o tramite patronato.",
  "online": {
   "stato": "parziale",
   "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.bonus-asilo-nido-e-forme-di-supporto-presso-la-propria-abitazione-51105.bonus-asilo-nido-e-forme-di-supporto-presso-la-propria-abitazione.html",
   "note": "Bonus: online sul portale INPS («Utilizza il servizio») o tramite patronato. Iscrizione al nido: dipende dal Comune."
  },
  "passi": [
   "Iscrivi il bambino al nido seguendo il bando del tuo Comune o le regole della struttura privata autorizzata.",
   "Fai l'ISEE minorenni per avere l'importo pieno del bonus.",
   "Presenta la domanda di bonus all'INPS (una per ogni figlio) indicando le mensilità e i dati dell'autorizzazione della struttura.",
   "Ogni mese allega fattura o ricevuta della retta e la prova di pagamento tracciabile.",
   "Ogni anno aggiorna le mensilità richieste (la domanda vale fino ad agosto dell'anno in cui il bambino compie 3 anni)."
  ],
  "documenti": [
   "ISEE minorenni valido",
   "Dati del titolo autorizzativo della struttura",
   "Fatture o ricevute delle rette e prova di pagamento tracciabile",
   "Per il supporto a casa: certificazione medica"
  ],
  "costo": "Bonus (non un costo): nati dal 1/1/2024 fino a 3.600 €/anno con ISEE minorenni fino a 40.000 €, altrimenti 1.500 €; nati prima del 2024: 3.000 € con ISEE fino a 25.000,99 €, 2.500 € da 25.001 a 40.000 €, 1.500 € negli altri casi. Massimo 11 mensilità l'anno, mai oltre la retta pagata. Le rette dei nidi le decidono Comuni e strutture.",
  "tempi": "Termine ordinario di 30 giorni (l. 241/1990) dalla completezza della documentazione; per le mensilità successive dalla data in cui alleghi la spesa.",
  "scadenze": "Servizio 2026 aperto con messaggio INPS n. 1136 del 31/3/2026. Dal 1° luglio 2026 i Comuni comunicano all'INPS le strutture autorizzate (prima applicazione entro il 1° settembre 2026).",
  "attenzione": [
   "Se la struttura non è autorizzata, il bonus non spetta: chiedi alla struttura gli estremi dell'autorizzazione.",
   "Il bonus non si cumula con la detrazione fiscale per le rette del nido.",
   "Senza ISEE ricevi solo l'importo minimo.",
   "La notizia INPS di luglio 2026 riassume gli importi in modo diverso dalla scheda (3.000 €, fino a 3.600 € per i nuovi nati con un altro figlio sotto i 10 anni): fa fede la scheda di servizio e la circolare INPS n. 29 del 27/3/2026."
  ],
  "norme": [
   {
    "titolo": "Legge 11 dicembre 2016, n. 232, art. 1, comma 355",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2016-12-11;232~art1-com355"
   },
   {
    "titolo": "D.lgs. 13 aprile 2017, n. 65, art. 2",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2017-04-13;65~art2"
   }
  ],
  "fonti": [
   {
    "titolo": "INPS – Bonus asilo nido e forme di supporto presso la propria abitazione (agg. 28/05/2026)",
    "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.bonus-asilo-nido-e-forme-di-supporto-presso-la-propria-abitazione-51105.bonus-asilo-nido-e-forme-di-supporto-presso-la-propria-abitazione.html"
   },
   {
    "titolo": "INPS – Bonus nido 2026: nuove semplificazioni con il Decreto lavoro (10/07/2026)",
    "url": "https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.07.bonus-nido-2026-nuove-semplificazioni-con-il-decreto-lavoro.html"
   }
  ],
  "collegati": [
   "mi-spetta"
  ],
  "verificato": "2026-10-25"
 },
 {
  "id": "iscrizione-scuola",
  "titolo": "Iscrivere un figlio a scuola (primaria e secondaria)",
  "categoria": "scuola",
  "sinonimi": [
   "iscrizioni scolastiche",
   "iscrizione prima elementare",
   "iscrizione scuola media",
   "iscrizione scuola superiore",
   "piattaforma Unica iscrizioni",
   "iscrizioni online scuola",
   "anticipo scuola primaria",
   "quando si fanno le iscrizioni"
  ],
  "chi": "Genitori o tutori dei bambini che devono iscriversi alla prima classe di primaria, secondaria di primo e secondo grado (e percorsi IeFP regionali aderenti). Alla primaria vanno iscritti i bambini che compiono 6 anni entro il 31 dicembre; possono essere iscritti in anticipo quelli che li compiono entro il 30 aprile dell'anno successivo.",
  "dove": "Online sulla piattaforma Unica del Ministero dell'Istruzione e del Merito; per la scuola dell'infanzia domanda cartacea alla scuola.",
  "online": {
   "stato": "si",
   "url": "https://unica.istruzione.gov.it/it/orientamento/iscrizioni",
   "note": "Accesso con SPID, CIE, CNS o eIDAS. Escluse dal canale online, tra l'altro, le sezioni di scuola dell'infanzia e i percorsi per adulti."
  },
  "passi": [
   "Cerca e confronta le scuole su Unica («Scuola in Chiaro»).",
   "Accedi a Unica con SPID, CIE, CNS o eIDAS nel periodo delle iscrizioni.",
   "Compila la domanda: puoi indicare fino a tre scuole in ordine di preferenza.",
   "Invia la domanda entro la scadenza e segui gli aggiornamenti (email, app IO).",
   "Se la prima scuola ha più domande che posti, si applicano i criteri di precedenza decisi dal Consiglio d'istituto e la domanda passa alla scuola successiva."
  ],
  "documenti": [
   "Codice fiscale e dati anagrafici del figlio e dei genitori",
   "Identità digitale del genitore"
  ],
  "costo": "La domanda di iscrizione online è senza costi (nessun costo indicato dalle fonti).",
  "tempi": "Per l'a.s. 2026/27 le domande si sono presentate dalle 8:00 del 13 gennaio 2026 alle 20:00 del 14 febbraio 2026 (nota MIM n. 100847 del 17/12/2025). Di norma il periodo è tra gennaio e febbraio.",
  "scadenze": "Le date per l'a.s. 2027/28 non sono state trovate nelle fonti lette: vanno controllate sulla nota ministeriale annuale.",
  "attenzione": [
   "L'iscrizione è gratuita e si fa solo sulla piattaforma ministeriale Unica.",
   "L'ordine di invio non dà precedenza se la scuola ha criteri deliberati: leggi i criteri pubblicati dalla scuola.",
   "La scuola dell'infanzia si chiede con domanda cartacea alla scuola.",
   "Le date cambiano ogni anno: controlla la nota del Ministero (di solito pubblicata a dicembre)."
  ],
  "norme": [
   {
    "titolo": "D.l. 6 luglio 2012, n. 95, art. 7, comma 28 (iscrizioni esclusivamente online)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2012-07-06;95~art7"
   }
  ],
  "fonti": [
   {
    "titolo": "MIM – Iscrizione scuola, anticipi, iscritti in esubero",
    "url": "https://www.mim.gov.it/en/iscrizione-scuola-anticipi-iscritti-in-esubero"
   },
   {
    "titolo": "MIM (USR Marche) – Iscrizioni a.s. 2026/27: dal 13 gennaio al 14 febbraio 2026",
    "url": "https://www.mim.gov.it/en/web/miur-usr-marche/-/iscrizioni-anno-scolastico-2026-27-le-domande-potranno-essere-inoltrate-dalle-ore-8-00-del-13-gennaio-2026-alle-ore-20-00-del-14-febbraio-2026-"
   },
   {
    "titolo": "Normattiva – d.l. 95/2012 art. 7",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2012-07-06;95~art7"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "dimissioni-online",
  "titolo": "Dimissioni volontarie online",
  "categoria": "lavoro",
  "sinonimi": [
   "dare le dimissioni",
   "dimissioni online",
   "modulo dimissioni ministero",
   "revocare le dimissioni",
   "dimissioni telematiche",
   "risoluzione consensuale",
   "dimissioni in maternità",
   "dimissioni per giusta causa"
  ],
  "chi": "Lavoratori dipendenti del settore privato che si dimettono o firmano una risoluzione consensuale. Non si applica a lavoro domestico, pubblico impiego, dimissioni in sedi protette (art. 2113 c.c.) o davanti alle commissioni di certificazione.",
  "dove": "Procedura telematica del Ministero del Lavoro; in alternativa patronati, sindacati, consulenti del lavoro, sedi dell'Ispettorato del lavoro, enti bilaterali, commissioni di certificazione. Lavoratrici madri e padri (figli fino a 3 anni): convalida presso l'Ispettorato territoriale del lavoro.",
  "online": {
   "stato": "si",
   "url": null,
   "note": null
  },
  "passi": [
   "Accedi alla procedura telematica del Ministero del Lavoro (o rivolgiti a un intermediario abilitato).",
   "Compila il modulo ministeriale con i dati del rapporto e la data di decorrenza.",
   "Il modulo viene inviato al datore di lavoro e all'ufficio territoriale competente.",
   "Se cambi idea, puoi revocare con la stessa procedura entro 7 giorni dall'invio.",
   "In gravidanza o con figli fino a 3 anni: chiedi la convalida all'Ispettorato territoriale (anche con colloquio online, modulo INL 12)."
  ],
  "documenti": [
   "identità digitale per la procedura online (modalità di accesso non verificate, vedi note)",
   "dati del datore di lavoro e del rapporto"
  ],
  "costo": "Gratuito se fatto da soli; eventuali costi degli intermediari non indicati dalla fonte (null).",
  "tempi": null,
  "scadenze": "Dimissioni non fatte con il modulo telematico sono inefficaci. Revoca entro 7 giorni. Assenza ingiustificata oltre il termine del CCNL o, in mancanza, oltre 15 giorni: il datore lo comunica all'Ispettorato e il rapporto si considera risolto per volontà del lavoratore.",
  "attenzione": [
   "Le dimissioni volontarie in genere fanno perdere la NASpI; quelle per giusta causa no.",
   "Chi altera i moduli rischia una sanzione da 5.000 a 30.000 euro.",
   "Controlla nel tuo contratto collettivo il preavviso da rispettare.",
   "Restare assente senza dimettersi può portare alla risoluzione 'per fatti concludenti'."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 14 settembre 2015, n. 151, art. 26 (comma 7-bis per l'assenza ingiustificata)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2015-09-14;151~art26"
   }
  ],
  "fonti": [
   {
    "titolo": "Normattiva - D.Lgs. 151/2015, art. 26",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2015-09-14;151~art26"
   },
   {
    "titolo": "Ispettorato Nazionale del Lavoro - Servizi e modulistica per i lavoratori",
    "url": "https://www.ispettorato.gov.it/servizi-e-modulistica/per-i-lavoratori/"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "naspi-disoccupazione",
  "titolo": "Domanda di disoccupazione NASpI",
  "categoria": "lavoro",
  "sinonimi": [
   "naspi",
   "disoccupazione inps",
   "domanda disoccupazione",
   "ho perso il lavoro",
   "licenziato cosa fare",
   "indennità di disoccupazione",
   "naspi dimissioni",
   "68 giorni naspi",
   "importo naspi 2026"
  ],
  "chi": "Lavoratori dipendenti che hanno perso il lavoro involontariamente (anche apprendisti, soci di cooperativa subordinati, tempo determinato PA). Spetta anche con dimissioni per giusta causa e risoluzione consensuale nella procedura di conciliazione. Esclusi: dipendenti a tempo indeterminato della PA, operai agricoli a tempo determinato, chi ha i requisiti per la pensione di vecchiaia o anticipata.",
  "dove": "INPS.",
  "online": {
   "stato": "si",
   "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.50593.naspi-indennit-mensile-di-disoccupazione.html",
   "note": null
  },
  "passi": [
   "Dopo la fine del rapporto di lavoro, entra nel servizio INPS 'NASpI: invio domanda' (o rivolgiti a un patronato o al Contact center).",
   "Compila la domanda: vale anche come dichiarazione di immediata disponibilità (DID).",
   "Indica l'IBAN di un conto o libretto intestato o cointestato a te.",
   "Entro 15 giorni stipula il patto di servizio personalizzato con il Centro per l'impiego.",
   "Comunica a INPS eventuali nuovi lavori e il reddito presunto entro un mese."
  ],
  "documenti": [
   "SPID, CIE o CNS",
   "dati del rapporto di lavoro cessato",
   "IBAN"
  ],
  "costo": "Domanda gratuita. Importo 2026: 75% della retribuzione media mensile se pari o inferiore a 1.456,72 euro, più il 25% della parte eccedente; massimo 1.584,70 euro al mese (circolare INPS n. 4 del 28/01/2026). Dal sesto mese si riduce del 3% al mese (dall'ottavo se hai almeno 55 anni).",
  "tempi": "Decorre dall'ottavo giorno dopo la cessazione se la domanda è presentata entro l'ottavo giorno, altrimenti dal giorno dopo la domanda. Durata: metà delle settimane contributive degli ultimi 4 anni.",
  "scadenze": "Domanda entro 68 giorni dalla cessazione, a pena di decadenza. Requisito: almeno 13 settimane di contributi nei 4 anni precedenti. Il requisito delle 30 giornate di lavoro effettivo non si applica più dal 1° gennaio 2022.",
  "attenzione": [
   "Non si può presentare prima della fine del rapporto di lavoro.",
   "Dal 2025: se nei 12 mesi prima hai lasciato con dimissioni volontarie un lavoro a tempo indeterminato, servono almeno 13 settimane di contributi dopo quelle dimissioni.",
   "La scheda INPS riporta ancora gli importi 2023: per il 2026 valgono quelli della circolare n. 4/2026.",
   "Si perde la NASpI se non partecipi senza giustificato motivo alle iniziative del Centro per l'impiego."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 4 marzo 2015, n. 22, artt. 3 e 6",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2015-03-04;22~art6"
   }
  ],
  "fonti": [
   {
    "titolo": "INPS - NASpI: indennità mensile di disoccupazione",
    "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.50593.naspi-indennit-mensile-di-disoccupazione.html"
   },
   {
    "titolo": "INPS - Circolare n. 4 del 28/01/2026 (importi 2026)",
    "url": "https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/01/Circolare_15147/Allegati/16539_Circolare-numero-4-del-28-01-2026.pdf"
   },
   {
    "titolo": "Normattiva - D.Lgs. 22/2015, art. 3",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2015-03-04;22~art3"
   }
  ],
  "collegati": [
   "mi-spetta"
  ],
  "verificato": "2026-10-25"
 },
 {
  "id": "pensione-vecchiaia",
  "titolo": "Domanda di pensione di vecchiaia",
  "categoria": "lavoro",
  "sinonimi": [
   "pensione di vecchiaia",
   "quando vado in pensione",
   "pensione a 67 anni",
   "requisiti pensione 2026",
   "domanda pensione inps",
   "pensione 2027 67 anni e 1 mese",
   "20 anni di contributi",
   "pensione contributivo puro"
  ],
  "chi": "Lavoratori dipendenti e autonomi iscritti all'AGO, alla Gestione separata e ai fondi esclusivi o sostitutivi che hanno i requisiti di età e contributi.",
  "dove": "INPS.",
  "online": {
   "stato": "si",
   "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.pensione-di-vecchiaia.html",
   "note": null
  },
  "passi": [
   "Verifica età e contributi nel tuo estratto conto INPS.",
   "Presenta la domanda online sul sito INPS con SPID, CIE o CNS, oppure tramite Contact center (803 164 da fisso, 06 164 164 da cellulare) o patronato.",
   "Se sei dipendente, il rapporto di lavoro deve cessare (il lavoro autonomo può continuare).",
   "Attendi la decisione: termine ordinario 30 giorni (legge 241/1990), salvo termini più lunghi previsti dal regolamento INPS."
  ],
  "documenti": [
   "SPID, CIE o CNS",
   "dati anagrafici e IBAN per il pagamento"
  ],
  "costo": "Domanda gratuita.",
  "tempi": "Termine ordinario 30 giorni. Decorrenza (AGO e Gestione separata): primo giorno del mese successivo alla maturazione dei requisiti o, a richiesta, del mese successivo alla domanda. Scuola: 1° settembre.",
  "scadenze": "Requisiti 2026: 67 anni di età e almeno 20 anni di contributi (per i contributivi puri la pensione deve essere almeno pari all'assegno sociale, oppure 71 anni con 5 anni di contribuzione effettiva). 2027: 67 anni e 1 mese; 2028: 67 anni e 3 mesi (circolare INPS n. 28 del 16/03/2026).",
  "attenzione": [
   "Dal 2027 l'età sale di 1 mese e nel 2028 di 3 mesi: chi compie 67 anni a fine 2026 o nel 2027 verifichi la data esatta.",
   "Per il contributivo puro con 20 anni conta anche l'importo minimo (assegno sociale).",
   "Esistono regole diverse per lavori gravosi, invalidi almeno all'80% e alcune categorie con 15 anni di contributi.",
   "Il dipendente che non cessa il rapporto non riceve la pensione di vecchiaia."
  ],
  "norme": [
   {
    "titolo": "D.L. 6 dicembre 2011, n. 201, art. 24; legge 30 dicembre 2025, n. 199 (bilancio 2026) per l'adeguamento graduale",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2011-12-06;201~art24!vig=2026-10-25"
   }
  ],
  "fonti": [
   {
    "titolo": "INPS - Pensione di vecchiaia (scheda)",
    "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.pensione-di-vecchiaia.html"
   },
   {
    "titolo": "INPS - Pensioni: requisiti aggiornati per il 2027 e il 2028",
    "url": "https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.03.pensioni-requisiti-aggiornati-per-il-2027-e-il-2028.html"
   }
  ],
  "collegati": [
   "mi-spetta"
  ],
  "verificato": "2026-10-25"
 },
 {
  "id": "did-centro-impiego",
  "titolo": "Iscriversi al Centro per l'impiego e dare la DID",
  "categoria": "lavoro",
  "sinonimi": [
   "iscrizione centro per l'impiego",
   "did online",
   "dichiarazione immediata disponibilità",
   "stato di disoccupazione",
   "siisl",
   "patto di servizio",
   "iscrizione disoccupazione",
   "collocamento"
  ],
  "chi": "Persone senza lavoro (o già licenziate, durante il preavviso) che vogliono lo stato di disoccupazione e accedere alle politiche attive.",
  "dove": "Sistema informativo unitario delle politiche del lavoro (piattaforma SIISL o portali regionali, a seconda della Regione) e Centro per l'impiego competente.",
  "online": {
   "stato": "si",
   "url": null,
   "note": null
  },
  "passi": [
   "Rilascia la DID online: se chiedi NASpI o DIS-COLL la domanda INPS vale già come DID.",
   "Registrati sulla piattaforma indicata (SIISL o portale della tua Regione), carica il CV e firma il Patto di attivazione digitale se richiesto.",
   "Entro 30 giorni dalla DID contatta il Centro per l'impiego, secondo le sue modalità.",
   "Firma il patto di servizio personalizzato (profilo, attività di ricerca, frequenza dei contatti)."
  ],
  "documenti": [
   "identità digitale (SPID/CIE) per i servizi online",
   "documento d'identità",
   "CV"
  ],
  "costo": "Gratuito.",
  "tempi": "Contatto con il CPI entro 30 giorni dalla DID; altrimenti convocazione d'ufficio.",
  "scadenze": "Per i percettori NASpI: patto di servizio entro 15 giorni dalla domanda. Lo stato di disoccupazione è sospeso per lavori subordinati fino a 6 mesi.",
  "attenzione": [
   "La procedura cambia da Regione a Regione: verifica sul sito del tuo Centro per l'impiego.",
   "Malfunzionamenti di CV e Patto di attivazione digitale su SIISL non bloccano i pagamenti NASpI se hai i requisiti.",
   "Se hai un patto valido ma senza DID, devi inserire una nuova DID al Centro per l'impiego.",
   "Le sanzioni scattano se non partecipi alle attività proposte dal CPI."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 14 settembre 2015, n. 150, artt. 19 e 20",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2015-09-14;150~art19"
   }
  ],
  "fonti": [
   {
    "titolo": "Normattiva - D.Lgs. 150/2015, art. 20 (patto di servizio)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2015-09-14;150~art20"
   },
   {
    "titolo": "INPS - Piattaforma SIISL, NASpI e DIS-COLL: chiarimenti per gli utenti",
    "url": "https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.07.piattaforma-siisl-naspi-e-dis-coll-chiarimenti-per-gli-utenti.html"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "730-precompilato",
  "titolo": "Dichiarazione dei redditi: 730 precompilato",
  "categoria": "fisco",
  "sinonimi": [
   "730 precompilato",
   "fare il 730 da solo",
   "dichiarazione dei redditi online",
   "730 2027",
   "scadenza 730",
   "730 senza sostituto",
   "modello redditi precompilato",
   "rimborso irpef 730",
   "730 integrativo"
  ],
  "chi": "Nel 2026 (redditi 2025): lavoratori dipendenti e assimilati, pensionati, chi ha redditi di terreni e fabbricati, di capitale, di lavoro autonomo senza partita IVA, alcuni redditi diversi e a tassazione separata. Anche senza sostituto d'imposta. Chi non era residente in Italia nel 2025 e/o 2026 deve usare il modello Redditi PF.",
  "dove": "Agenzia delle Entrate (area riservata, applicazione web precompilata). In alternativa: sostituto d'imposta che presta assistenza, CAF o professionista abilitato.",
  "online": {
   "stato": "si",
   "url": "https://infoprecompilata.agenziaentrate.gov.it/portale/accedi-precompilata",
   "note": null
  },
  "passi": [
   "Entra nell'area riservata con SPID, CIE, CNS o credenziali Fisconline/Entratel (anche come tutore, genitore, persona di fiducia o erede).",
   "Apri il 730 precompilato e il foglio riepilogativo; puoi usare la modalità semplificata.",
   "Indica, se vuoi, il sostituto d'imposta che farà il conguaglio e compila la scheda 8, 5 e 2 per mille.",
   "Controlla i dati; se mancano spese detraibili o redditi, aggiungili (si genera un nuovo 730-3).",
   "Invia la dichiarazione e conserva la ricevuta con il protocollo nell'area riservata."
  ],
  "documenti": [
   "SPID, CIE, CNS o credenziali Fisconline/Entratel",
   "documenti delle spese da aggiungere o correggere",
   "IBAN per il rimborso se non c'è sostituto d'imposta"
  ],
  "costo": "Gratuito se presentato direttamente online all'Agenzia. CAF e professionisti: importo non regolato dalla fonte (null).",
  "tempi": "Rimborsi tramite busta paga/pensione o accredito sul conto: tempi non indicati dalla fonte letta (null).",
  "scadenze": "2026: consultazione dal 30 aprile, invio dal 14 maggio al 30 settembre 2026 (scaduto). Redditi PF precompilato: invio dal 27 maggio al 2 novembre 2026. 730 integrativo tipo 2 via precompilata fino al 10 novembre 2026; dal 10 novembre 2026 al 1° febbraio 2027 Redditi 'tardivo'. 2027: calendario operativo non ancora pubblicato; per norma la precompilata è messa a disposizione entro il 30 aprile e si invia entro il 30 settembre (artt. 66 e 68 del testo unico adempimenti e accertamento, d.lgs. 141/2026).",
  "attenzione": [
   "Se accetti il 730 senza modifiche non ci sono controlli documentali sugli oneri comunicati da terzi; se modifichi, i controlli riguardano le voci cambiate.",
   "La detrazione al 19% richiede di regola pagamenti tracciabili (salvo farmaci, dispositivi medici e prestazioni di strutture pubbliche o accreditate).",
   "Con più di quattro immobili in locazione breve non si può usare il 730 (serve Redditi PF).",
   "Per redditi sopra 75.000 euro la procedura applica automaticamente il nuovo limite alle spese detraibili.",
   "Il servizio web è solo in italiano."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 5 agosto 2026, n. 141 (Testo unico adempimenti e accertamento), allegato, artt. 66 e 68; fino al 31/12/2026 art. 1 d.lgs. 175/2014",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2026-08-05;141:1~art68"
   }
  ],
  "fonti": [
   {
    "titolo": "Agenzia Entrate - La dichiarazione precompilata 2026",
    "url": "https://www.agenziaentrate.gov.it/portale/la-dichiarazione-precompilata-20261"
   },
   {
    "titolo": "Agenzia Entrate - La presentazione e le operazioni successive",
    "url": "https://www.agenziaentrate.gov.it/portale/la-presentazione-e-le-operazioni-successive4"
   },
   {
    "titolo": "Agenzia Entrate - 730/2026 Chi può presentare il 730",
    "url": "https://www.agenziaentrate.gov.it/portale/730-2026/chi-puo-presentare-il-730"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "isee-dsu",
  "titolo": "Ottenere l'ISEE (DSU precompilata online o al CAF)",
  "categoria": "fisco",
  "sinonimi": [
   "fare l'isee",
   "isee precompilato",
   "dsu online",
   "rinnovare l'isee",
   "isee corrente",
   "attestazione isee",
   "isee al caf",
   "dichiarazione sostitutiva unica",
   "isee scaduto"
  ],
  "chi": "Il dichiarante del nucleo familiare. Nella DSU precompilata i componenti maggiorenni autorizzano la precompilazione con SPID, CIE o CNS.",
  "dove": "INPS (Portale unico ISEE, app INPS Mobile) oppure CAF convenzionato con INPS.",
  "online": {
   "stato": "si",
   "url": "https://servizi2.inps.it/servizi/PortaleUnicoIsee",
   "note": null
  },
  "passi": [
   "Decidi se fare da solo sul Portale unico ISEE (con SPID, CIE o CNS) o farti aiutare da un CAF.",
   "Online: scegli la DSU precompilata; i componenti maggiorenni del nucleo autorizzano l'uso dei dati di Agenzia delle Entrate e INPS.",
   "In alternativa alla precompilazione fornisci gli elementi di riscontro (un dato di reddito e uno di patrimonio mobiliare per ogni maggiorenne, riferiti al secondo anno prima della DSU).",
   "Controlla, completa e invia la DSU.",
   "Scarica l'attestazione ISEE dal portale (o ritirala dall'ente/CAF che ha ricevuto la DSU)."
  ],
  "documenti": [
   "SPID, CIE o CNS (per l'online)",
   "dati dei componenti del nucleo familiare",
   "se non usi la precompilazione: un dato di reddito e uno di patrimonio mobiliare per ogni maggiorenne",
   "al CAF: documento d'identità e mandato al CAF"
  ],
  "costo": "Gratuito online. Al CAF: assistenza gratuita in base alla convenzione con INPS (fonte: INPS, notizia Osservatorio DSU/ISEE febbraio 2026).",
  "tempi": "Attestazione disponibile entro 10 giorni lavorativi dalla ricezione della DSU (scheda INPS Portale unico ISEE).",
  "scadenze": "L'ISEE vale fino al 31 dicembre dell'anno di presentazione della DSU. ISEE corrente: 6 mesi se si aggiornano solo i redditi (da aggiornare entro 2 mesi da variazioni occupazionali o dei trattamenti), fino al 31 dicembre se si aggiornano i patrimoni.",
  "attenzione": [
   "Ogni anno dal 1° gennaio serve una nuova DSU: l'ISEE dell'anno prima non vale più.",
   "Esistono ISEE diversi (minorenni con genitori non coniugati, università, socio-sanitario, residenze): chiedi quello giusto per la prestazione.",
   "Se la tua situazione è peggiorata (lavoro perso, redditi calati) valuta l'ISEE corrente, che però ha durata limitata.",
   "Dal 2026 per alcune prestazioni familiari (tra cui l'Assegno unico) si usa un ISEE specifico: vedi la scheda Assegno unico."
  ],
  "norme": [
   {
    "titolo": "DPCM 5 dicembre 2013, n. 159, art. 10 (DSU)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:presidente.consiglio.ministri:decreto:2013-12-05;159~art10"
   }
  ],
  "fonti": [
   {
    "titolo": "INPS - Portale unico ISEE (scheda servizio)",
    "url": "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.Portale-unico-ISEE.html"
   },
   {
    "titolo": "INPS - Osservatorio su DSU e ISEE: i dati 2016-2025",
    "url": "https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.osservatorio-su-dsu-e-isee-i-dati-2016-2025.html"
   }
  ],
  "collegati": [
   "mi-spetta"
  ],
  "verificato": "2026-10-25"
 },
 {
  "id": "pagare-pagopa-f24",
  "titolo": "Pagare un avviso pagoPA o un modello F24 online",
  "categoria": "fisco",
  "sinonimi": [
   "pagare avviso pagopa",
   "pagare multa pagopa",
   "codice avviso pagopa",
   "pagare f24 online",
   "f24 web",
   "f24 home banking",
   "pagare tasse online",
   "pagare con app io"
  ],
  "chi": "Chiunque debba pagare un avviso pagoPA di una pubblica amministrazione o versare imposte con F24. Il pagamento telematico dell'F24 è obbligatorio per i titolari di partita IVA, per gli F24 con compensazioni di crediti e per gli F24 a saldo zero.",
  "dove": "pagoPA: app IO, sito dell'ente creditore, checkout pagoPA, home banking, app di pagamento, banche, ATM, uffici postali, esercenti convenzionati. F24: servizi F24 web/F24 online dell'Agenzia delle Entrate, home banking, oppure (solo non titolari di partita IVA senza compensazioni) banca, posta o sportello Agenzia Entrate-Riscossione.",
  "online": {
   "stato": "si",
   "url": "https://checkout.pagopa.it/",
   "note": null
  },
  "passi": [
   "pagoPA: tieni a portata di mano l'avviso (codice avviso o QR code).",
   "Scegli il canale: app IO, checkout pagoPA, sito dell'ente o home banking (voce pagoPA).",
   "Prima di confermare, controlla la commissione del gestore (PSP) e cambialo se ne trovi uno più conveniente.",
   "Conserva la ricevuta (in app IO resta archiviata).",
   "F24: entra nei servizi telematici dell'Agenzia con SPID, CIE o CNS, compila l'F24 web e scegli la data di addebito sul tuo conto."
  ],
  "documenti": [
   "avviso pagoPA con codice avviso o QR code",
   "per F24 web: SPID, CIE o CNS e un conto presso banca o Poste convenzionate",
   "codici tributo e importi dell'F24"
  ],
  "costo": "pagoPA: commissione variabile secondo il PSP scelto (simulatore costi su pagopa.gov.it). F24 web: servizio gratuito, nessuna commissione dell'Agenzia.",
  "tempi": "F24 web: l'addebito avviene alla data di scadenza indicata, anche se l'F24 è inviato prima.",
  "scadenze": "Le scadenze sono quelle del tributo o dell'avviso. Un F24 telematico inviato per errore si può annullare fino al terzultimo giorno lavorativo prima della data di versamento.",
  "attenzione": [
   "F24 web non accetta carte di credito: addebita il conto corrente.",
   "Con crediti in compensazione o saldo zero l'F24 cartaceo non è ammesso.",
   "Sui canali pagoPA la commissione cambia da gestore a gestore: confrontala prima di pagare."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 7 marzo 2005, n. 82 (CAD), art. 5 (pagamenti elettronici tramite pagoPA)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-03-07;82~art5"
   }
  ],
  "fonti": [
   {
    "titolo": "pagoPA - Dove pagare",
    "url": "https://www.pagopa.gov.it/it/cittadini/dove-pagare/"
   },
   {
    "titolo": "Agenzia Entrate - F24: come effettuare i versamenti (cittadini)",
    "url": "https://www.agenziaentrate.gov.it/portale/schede/pagamenti/f24/come-effettuare-versamenti-f24-cittadini"
   },
   {
    "titolo": "Agenzia Entrate - F24: compilazione e invio via web (cittadini)",
    "url": "https://www.agenziaentrate.gov.it/portale/web/guest/schede/pagamenti/f24/compilazione-invio-f24-via-web-cittadini"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "rateizzare-cartella-ader",
  "titolo": "Rateizzare una cartella dell'Agenzia delle Entrate-Riscossione",
  "categoria": "fisco",
  "sinonimi": [
   "rateizzare cartella esattoriale",
   "rate cartella equitalia",
   "rateizza adesso",
   "piano di rateizzazione ader",
   "dilazione cartelle",
   "quante rate cartella",
   "decadenza rateizzazione",
   "prorogare rateizzazione"
  ],
  "chi": "Chi ha cartelle o avvisi affidati all'Agenzia delle Entrate-Riscossione e si trova in temporanea difficoltà economica.",
  "dove": "Agenzia delle Entrate-Riscossione (area riservata, app Equiclick, PEC, sportelli).",
  "online": {
   "stato": "si",
   "url": "https://www.agenziaentrateriscossione.gov.it/it/cittadini/Rateizzazione/istanze-a-semplice-richiesta/",
   "note": null
  },
  "passi": [
   "Entra nell'area riservata di AdER con SPID, CIE o CNS e apri il servizio 'Rateizza adesso'.",
   "Scegli quali cartelle/avvisi rateizzare e il numero di rate.",
   "Per importi fino a 120.000 euro dichiara la temporanea difficoltà economica (senza documenti) se chiedi fino a 84 rate (domande 2025-2026).",
   "Per più rate o importi oltre 120.000 euro documenta la difficoltà con i modelli previsti (ISEE per persone fisiche) e invia via PEC o allo sportello.",
   "Ricevi il piano e i moduli di pagamento (o attiva l'addebito SDD) e paga la prima rata."
  ],
  "documenti": [
   "SPID, CIE o CNS (online)",
   "in alternativa modello RS via PEC",
   "per richieste documentate: ISEE (persone fisiche e ditte individuali in regime semplificato) e modelli di documentazione"
  ],
  "costo": "Rata minima 50 euro. Sulle rate si pagano gli interessi di dilazione (tasso non indicato nelle pagine lette).",
  "tempi": "Online, se ci sono i requisiti, il piano è disponibile subito.",
  "scadenze": "Rate mensili. Domande 2025-2026: fino a 84 rate su semplice richiesta (fino a 120.000 euro); 2027-2028: fino a 96; dal 2029: fino a 108. Con documentazione fino a 120 rate. Si decade se non si pagano 8 rate, anche non consecutive: il residuo diventa esigibile in un'unica soluzione e non è più rateizzabile.",
  "attenzione": [
   "La soglia di 120.000 euro si calcola su ogni singola richiesta.",
   "Dalla presentazione della domanda non si possono iscrivere nuovi fermi e ipoteche né avviare nuove esecuzioni (restano quelli già iscritti).",
   "Chi ha già un piano non decaduto può chiederne una sola proroga se la situazione peggiora, invece di aprirne uno nuovo.",
   "Le somme oggetto di verifica prima dell'accoglimento non sono rateizzabili."
  ],
  "norme": [
   {
    "titolo": "Art. 19 DPR 602/1973 (fino al 31/12/2026); dal 1/1/2027 art. 105 del Testo unico versamenti e riscossione, d.lgs. 24 marzo 2025, n. 33",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2025-03-24;33:1~art105"
   }
  ],
  "fonti": [
   {
    "titolo": "AdER - Istanze a semplice richiesta",
    "url": "https://www.agenziaentrateriscossione.gov.it/it/cittadini/Rateizzazione/istanze-a-semplice-richiesta/"
   },
   {
    "titolo": "AdER - La rateizzazione dal 1° gennaio 2025",
    "url": "https://www.agenziaentrateriscossione.gov.it/it/cittadini/Rateizzazione/la-rateizzazione/"
   },
   {
    "titolo": "Normattiva - D.Lgs. 33/2025, allegato, art. 105",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2025-03-24;33:1~art105"
   }
  ],
  "collegati": [
   "chiedo-gli-atti"
  ],
  "verificato": "2026-10-25"
 },
 {
  "id": "bollo-auto",
  "titolo": "Bollo auto: pagamento ed esenzioni",
  "categoria": "auto",
  "sinonimi": [
   "pagare il bollo auto",
   "bollo auto online",
   "calcolo bollo",
   "esenzione bollo disabili",
   "bollo auto storiche",
   "bollo scaduto",
   "tassa automobilistica",
   "bollo auto 30 anni"
  ],
  "chi": "Il proprietario del veicolo iscritto al PRA. La tassa è regionale: regole, termini e agevolazioni dipendono dalla Regione di residenza.",
  "dove": "Regione di residenza (spesso tramite ACI); in Friuli-Venezia Giulia e Sardegna l'Agenzia delle Entrate. Pagamento con pagoPA (BolloNet ACI per le Regioni abilitate, siti regionali, delegazioni ACI, banche, Poste, tabaccai).",
  "online": {
   "stato": "si",
   "url": "https://www.aci.it/servizi/pagamento-bollo-on-line/",
   "note": null
  },
  "passi": [
   "Calcola l'importo con il servizio ACI di calcolo bollo o sul sito della tua Regione.",
   "Paga online con BolloNet (se la tua Regione è abilitata) accedendo con SPID o CIE, oppure sui canali pagoPA.",
   "Scegli il prestatore di pagamento: la commissione dipende da lui.",
   "Per l'esenzione disabili presenta la domanda all'ufficio tributi della Regione (FVG e Sardegna: Agenzia delle Entrate), solo il primo anno."
  ],
  "documenti": [
   "targa e tipo di veicolo",
   "SPID o CIE per BolloNet",
   "per l'esenzione disabili: verbale della commissione e documenti richiesti dalla Regione"
  ],
  "costo": "Importo variabile per Regione, potenza e classe ambientale. Commissione variabile secondo il PSP pagoPA.",
  "tempi": "Esenzione disabili: documenti entro 90 giorni dalla scadenza del termine di pagamento; poi vale anche negli anni successivi.",
  "scadenze": "Termini di pagamento fissati dalla Regione (null: non verificati su fonte regionale). Esenzione per un solo veicolo per disabile, entro 2.000 cc benzina/ibrido benzina, 2.800 cc diesel/ibrido diesel, 150 kW elettrico; veicolo intestato al disabile o al familiare che lo ha fiscalmente a carico. Esenzione per veicoli con oltre 30 anni non usati per attività professionali; riduzione del 50% per veicoli di 20-29 anni con certificato di rilevanza storica annotato.",
  "attenzione": [
   "Le Regioni possono prevedere esenzioni o sconti in più (ad esempio per domiciliazione): controlla il sito della tua Regione.",
   "Se vendi l'auto esente devi comunicarlo all'ufficio che ha concesso l'esenzione.",
   "Per l'esenzione non serve esporre contrassegni sull'auto.",
   "Le esenzioni bollo e IPT hanno requisiti diversi da IVA 4% e detrazione IRPEF."
  ],
  "norme": [
   {
    "titolo": "Legge 27 dicembre 1997, n. 449, art. 8, comma 7 (esenzione disabili); legge 21 novembre 2000, n. 342, art. 63 (veicoli storici)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1997-12-27;449~art8!vig=2026-10-25"
   }
  ],
  "fonti": [
   {
    "titolo": "ACI - Pagamento bollo on line",
    "url": "https://www.aci.it/servizi/pagamento-bollo-on-line/"
   },
   {
    "titolo": "Agenzia Entrate - L'esenzione permanente dal pagamento del bollo",
    "url": "https://www.agenziaentrate.gov.it/portale/web/guest/esenzione-permanente-dal-pagamento-del-bollo"
   },
   {
    "titolo": "Normattiva - Legge 342/2000, art. 63",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2000-11-21;342~art63"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "cambio-residenza-patente-libretto",
  "titolo": "Cambio di residenza su patente e libretto (automatico)",
  "categoria": "auto",
  "sinonimi": [
   "cambio residenza patente",
   "cambio residenza libretto",
   "aggiornare indirizzo patente",
   "adesivo cambio residenza",
   "tagliando residenza",
   "residenza documento unico",
   "trasloco patente",
   "residenza carta di circolazione"
  ],
  "chi": "Chi cambia Comune di residenza o abitazione nello stesso Comune ed è titolare di patente e/o veicoli.",
  "dove": "Comune (all'iscrizione anagrafica o cambio di abitazione) che comunica al Ministero delle infrastrutture e dei trasporti.",
  "online": {
   "stato": "parziale",
   "url": "https://www.ilportaledellautomobilista.it/web/portale-automobilista/home",
   "note": null
  },
  "passi": [
   "Quando chiedi la residenza o il cambio di abitazione, compila al Comune il modulo per l'aggiornamento dei dati di patente e veicoli.",
   "Il Comune trasmette la variazione al Ministero (per la patente entro un mese dalla registrazione anagrafica).",
   "Il Ministero aggiorna gli archivi: non arriva nessun adesivo.",
   "Controlla l'indirizzo nell'area riservata del Portale dell'automobilista con SPID o CIE."
  ],
  "documenti": [
   "modulo comunale per la richiesta di aggiornamento"
  ],
  "costo": "Nessun costo indicato dalla fonte (null).",
  "tempi": "Il Comune comunica entro un mese dalla registrazione della variazione anagrafica (art. 116, c. 13 CdS).",
  "scadenze": "Nessun adempimento ulteriore se l'aggiornamento è andato a buon fine.",
  "attenzione": [
   "Dal 2/3/2013 per la patente e dal 1/10/2020 per la carta di circolazione non viene più spedito l'adesivo: non va atteso.",
   "Se l'indirizzo non risulta aggiornato: email uco.dgmot@servizidt.it o numero verde 800 232323 (da cellulare 06 45775927), tasti 1, 4, 2."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 30 aprile 1992, n. 285, art. 116, comma 13 (patente) e art. 94, comma 2 (carta di circolazione)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art116"
   }
  ],
  "fonti": [
   {
    "titolo": "MIT - Cambio di residenza sulla patente di guida",
    "url": "https://www.mit.gov.it/cambio-di-residenza-sulla-patente-di-guida"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "passaggio-proprieta-auto",
  "titolo": "Passaggio di proprietà di un'auto o moto usata",
  "categoria": "auto",
  "sinonimi": [
   "passaggio di proprietà",
   "trapasso auto",
   "vendere l'auto",
   "comprare auto usata",
   "costo passaggio di proprietà",
   "atto di vendita auto",
   "documento unico",
   "ipt passaggio",
   "sta aci"
  ],
  "chi": "Venditore (firma autenticata dell'atto) e acquirente (obbligato a trascrivere e a pagare l'IPT).",
  "dove": "Qualsiasi Sportello telematico dell'automobilista (STA): uffici ACI-PRA, Motorizzazione, delegazioni ACI e agenzie di pratiche auto, anche in altra provincia. Autentica anche presso Comuni o notai.",
  "online": {
   "stato": "no",
   "url": null,
   "note": null
  },
  "passi": [
   "Prima di comprare verifica gratis online su aci.it fermi, ipoteche e altri vincoli sul veicolo.",
   "Venditore e acquirente vanno a uno STA con documenti e Documento Unico (o carta di circolazione e certificato di proprietà).",
   "Il venditore firma l'atto di vendita (in forma digitale allo STA) e la firma viene autenticata.",
   "Si pagano IPT, emolumenti ACI, bolli e diritti.",
   "Viene rilasciato il nuovo Documento Unico intestato all'acquirente (allo STA di ACI-PRA o Motorizzazione la trascrizione è contestuale)."
  ],
  "documenti": [
   "documento d'identità valido del venditore",
   "Documento Unico oppure carta di circolazione + certificato di proprietà",
   "in caso di smarrimento: denuncia o dichiarazione sostitutiva"
  ],
  "costo": "IPT variabile secondo tipo di veicolo, kW e provincia di residenza dell'acquirente; emolumenti ACI 27,00 euro; imposta di bollo 32,00 euro per l'istanza unificata + 16 euro per il rilascio del Documento Unico (come riportato da ACI); diritti 10,20 euro; bollo 16 euro per l'atto digitale allo STA; più costi dei versamenti postali e dell'eventuale agenzia. Autentica gratuita negli STA di ACI-PRA e Motorizzazione. Motocicli (non ultratrentennali) esenti da IPT.",
  "tempi": "Allo STA di ACI-PRA o Motorizzazione la trascrizione è immediata.",
  "scadenze": "Trascrizione entro 60 giorni dall'autentica della firma. Oltre: sanzione e interessi sull'IPT. Il Codice della strada prevede sanzioni da 727 a 3.629 euro per chi non osserva l'art. 94 e da 363 a 1.813 euro per chi circola senza aggiornamento.",
  "attenzione": [
   "Il fermo amministrativo resta sul veicolo anche dopo la vendita, fino al pagamento del debito.",
   "Un veicolo con fermo non può circolare.",
   "L'IPT si paga alla provincia di residenza dell'acquirente: usa il calcolatore ACI o chiedi allo STA l'importo esatto.",
   "Se l'atto è firmato da notaio o Comune serve poi comunque la trascrizione entro 60 giorni."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 30 aprile 1992, n. 285, art. 94",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art94"
   }
  ],
  "fonti": [
   {
    "titolo": "ACI - Passaggio di proprietà e Documento Unico",
    "url": "https://www.aci.it/servizi/devo-vendere-la-mia-auto-cosa-devo-fare/"
   },
   {
    "titolo": "ACI - Costi del passaggio di proprietà",
    "url": "https://www.aci.it/servizi/costi-del-passaggio-di-proprieta/"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "rinnovo-patente",
  "titolo": "Rinnovare la patente di guida",
  "categoria": "auto",
  "sinonimi": [
   "rinnovo patente",
   "patente scaduta",
   "visita medica patente",
   "costo rinnovo patente",
   "quando scade la patente",
   "nuova patente per posta",
   "rinnovo patente commissione medica",
   "patente scade al compleanno"
  ],
  "chi": "Titolari di patente in scadenza. Scadenze per AM, A1, A2, A, B1, B, BE: ogni 10 anni fino a 50 anni, ogni 5 fino a 70, ogni 3 fino a 80, ogni 2 dopo gli 80. C e D: scadenze più brevi (C dopo i 65 anni in Commissione medica locale).",
  "dove": "Medico abilitato (medico certificatore) oppure Commissione medica locale; Ministero delle infrastrutture e dei trasporti - Motorizzazione.",
  "online": {
   "stato": "parziale",
   "url": "https://www.ilportaledellautomobilista.it/web/portale-automobilista/pagamenti-pagopa",
   "note": null
  },
  "passi": [
   "Paga con pagoPA la tariffa N004 (diritti 10,20 euro + bollo 16,00 euro) dal Portale dell'automobilista con SPID o CIE.",
   "Prenota la visita da un medico abilitato (o in Commissione medica locale se previsto).",
   "Porta una foto tessera recente e le ricevute di pagamento.",
   "Il medico trasmette online certificato, foto, firma e pagamenti e ti dà una ricevuta di conferma valida per guidare in Italia fino all'arrivo della nuova patente.",
   "La nuova patente arriva per posta assicurata all'indirizzo indicato; paghi 7,32 euro al postino (o all'ufficio postale in caso di giacenza, entro 60 giorni)."
  ],
  "documenti": [
   "patente da rinnovare",
   "documento d'identità",
   "una foto recente formato tessera",
   "ricevuta pagoPA tariffa N004",
   "ricevuta di pagamento della visita medica"
  ],
  "costo": "Diritti 10,20 euro + bollo 16,00 euro (tariffa N004, pagoPA) + recapito 7,32 euro (6,00 + IVA) + visita medica a tariffa variabile secondo la struttura. Tariffe diverse per Sicilia, Valle d'Aosta, Trentino-Alto Adige e Friuli-Venezia Giulia.",
  "tempi": "Ricevuta immediata dopo visita con esito positivo; patente inviata per posta (tempi non indicati).",
  "scadenze": "AM, A, B e BE scadono il giorno del compleanno. Se rinnovi dopo la scadenza, la nuova validità parte comunque dalla vecchia scadenza (perdi i giorni trascorsi).",
  "attenzione": [
   "La ricevuta del medico vale solo in Italia: per guidare all'estero aspetta la nuova patente.",
   "La patente non ritirata entro 60 giorni di giacenza viene distrutta.",
   "Se la CML non ti dà la visita prima della scadenza puoi chiedere un permesso provvisorio di guida.",
   "In alcuni casi dopo la visita serve completare la pratica in un ufficio della Motorizzazione."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 30 aprile 1992, n. 285 (Codice della strada), art. 126",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art126"
   }
  ],
  "fonti": [
   {
    "titolo": "MIT - Rinnovo patente",
    "url": "https://www.mit.gov.it/node/180"
   },
   {
    "titolo": "Portale dell'automobilista - Recapito al cittadino del duplicato della patente",
    "url": "https://www.ilportaledellautomobilista.it/web/portale-automobilista/recapito_duplicato_patente_cittadino"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "bonus-ristrutturazione-2026",
  "titolo": "Bonus ristrutturazione casa 2026 (detrazione) e comunicazione ENEA",
  "categoria": "casa",
  "sinonimi": [
   "bonus ristrutturazione 2026",
   "detrazione 50 ristrutturazione",
   "bonus casa 36",
   "bonifico parlante",
   "comunicazione enea",
   "detrazione lavori casa",
   "bonus ristrutturazione 2027",
   "ristrutturazione abitazione principale"
  ],
  "chi": "Chi sostiene le spese di recupero edilizio su abitazioni e pertinenze: proprietari, titolari di diritti reali, ma anche inquilini, comodatari e familiari conviventi (questi ultimi solo con l'aliquota base).",
  "dove": "Detrazione nella dichiarazione dei redditi (Agenzia delle Entrate); comunicazione all'ENEA per gli interventi con risparmio energetico o fonti rinnovabili.",
  "online": {
   "stato": "parziale",
   "url": "https://bonusfiscali.enea.it/",
   "note": null
  },
  "passi": [
   "Verifica se i lavori rientrano nella detrazione e se, prima di iniziare, serve la comunicazione all'ASL.",
   "Paga con bonifico 'parlante' (causale, codice fiscale di chi detrae, partita IVA o codice fiscale di chi riceve).",
   "Conserva fatture, ricevute dei bonifici, titoli edilizi o dichiarazione sostitutiva con la data di inizio lavori.",
   "Se i lavori comportano risparmio energetico, invia la scheda all'ENEA entro 90 giorni dalla fine lavori su bonusfiscali.enea.it (accesso con SPID o CIE).",
   "Indica le spese nella dichiarazione dei redditi: la detrazione si ripartisce in 10 quote annuali."
  ],
  "documenti": [
   "fatture intestate a chi detrae",
   "ricevute dei bonifici parlanti",
   "titoli abilitativi o dichiarazione sostitutiva con data inizio lavori",
   "eventuale comunicazione ASL",
   "per condomini: delibera e tabella millesimale",
   "per detentori: consenso del proprietario",
   "ricevuta trasmissione ENEA"
  ],
  "costo": "Spese 2026: detrazione 50% per l'abitazione principale (spesa pagata da proprietario o titolare di diritto reale), 36% negli altri casi, limite 96.000 euro per unità. Spese 2027: 36% abitazione principale, 30% altri casi, limite 96.000 euro. 2028-2033: 30% con limite 48.000 euro. Comunicazione ENEA gratuita.",
  "tempi": "Detrazione in 10 rate annuali.",
  "scadenze": "Comunicazione ENEA entro 90 giorni solari dalla fine lavori (per i lavori conclusi tra il 1/1/2026 e il 22/1/2026 i 90 giorni decorrono dal 22/1/2026). Sconto in fattura e cessione del credito non più possibili dal 17/2/2023, salvo eccezioni per alcune aree terremotate.",
  "attenzione": [
   "Il 50% spetta solo a proprietari o titolari di diritti reali sull'abitazione principale; inquilini e familiari conviventi hanno il 36%.",
   "Contano le date dei pagamenti: le spese pagate nel 2027 hanno aliquote più basse.",
   "Escluse le caldaie uniche alimentate a combustibili fossili.",
   "Con redditi oltre 75.000 euro c'è un tetto complessivo alle detrazioni (art. 16-ter TUIR)."
  ],
  "norme": [
   {
    "titolo": "DPR 22 dicembre 1986, n. 917 (TUIR), art. 16-bis e D.L. 4 giugno 2013, n. 63, art. 16 (modificato dalla legge 199/2025); dal 1/1/2027 confluiscono nel d.lgs. 19 giugno 2026, n. 117",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art16bis!vig=2026-10-25"
   }
  ],
  "fonti": [
   {
    "titolo": "Agenzia Entrate - La misura della detrazione e i limiti di detraibilità",
    "url": "https://www.agenziaentrate.gov.it/portale/la-misura-della-detrazione-limiti-detraibilita"
   },
   {
    "titolo": "Agenzia Entrate - Ristrutturazioni edilizie: che cos'è",
    "url": "https://www.agenziaentrate.gov.it/portale/schede/agevolazioni/detrristredil36/schinfodetrristredil36"
   },
   {
    "titolo": "ENEA - Online il portale per l'invio dati 2026",
    "url": "https://www.efficienzaenergetica.enea.it/vi-segnaliamo/fisco-detrazioni-efficienza-energetica-online-portale-enea-per-invio-dati-2026.html"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "comunicazione-ospitalita-cessione-fabbricato",
  "titolo": "Comunicazione di ospitalità a stranieri e cessione di fabbricato",
  "categoria": "casa",
  "sinonimi": [
   "comunicazione ospitalità",
   "dichiarazione di ospitalità straniero",
   "cessione di fabbricato",
   "ospitare un parente straniero",
   "affittare a stranieri questura",
   "48 ore questura",
   "modulo cessione fabbricato",
   "denuncia ospitalità"
  ],
  "chi": "Ospitalità: chiunque dà alloggio od ospita uno straniero (extra UE) o apolide, anche se parente, o gli cede un immobile, a qualsiasi titolo e per qualsiasi durata. Cessione di fabbricato: chi cede la proprietà o l'uso esclusivo di un fabbricato per più di un mese.",
  "dove": "Autorità locale di pubblica sicurezza: Questura o Commissariato competente per il luogo dell'immobile.",
  "online": {
   "stato": "parziale",
   "url": null,
   "note": null
  },
  "passi": [
   "Scarica il modulo della Questura competente (ospitalità o cessione di fabbricato).",
   "Indica i tuoi dati, quelli della persona ospitata, gli estremi del passaporto o documento, l'indirizzo esatto dell'immobile e il titolo (ospitalità, locazione, comodato...).",
   "Allega copie dei documenti richiesti (identità di entrambi, titolo sull'immobile).",
   "Invia entro 48 ore: di persona, con raccomandata A/R o, dove la Questura lo prevede, via PEC.",
   "Conserva la ricevuta (o le ricevute PEC di accettazione e consegna)."
  ],
  "documenti": [
   "modulo della Questura",
   "documento d'identità dell'ospitante",
   "passaporto o documento dell'ospitato",
   "titolo sull'immobile (es. contratto di proprietà o locazione)"
  ],
  "costo": "Gratuito (nessun costo indicato dalle fonti).",
  "tempi": "Entro 48 ore dalla consegna dell'immobile o dall'inizio dell'ospitalità.",
  "scadenze": "48 ore. Sanzione per mancata comunicazione di ospitalità: da 500 a 3.500 euro (art. 7, c. 2-bis, d.lgs. 286/1998). Per la cessione di fabbricato l'art. 12 d.l. 59/1978 prevede una sanzione da 200.000 a 3.000.000 di lire (circa 103-1.549 euro).",
  "attenzione": [
   "L'ospitalità a stranieri extra UE va sempre comunicata, anche per un solo giorno e anche ai parenti.",
   "La registrazione all'Agenzia delle Entrate di un contratto di locazione o comodato assorbe la cessione di fabbricato, ma non la comunicazione di ospitalità per lo straniero.",
   "B&B, affittacamere e case vacanza comunicano gli ospiti solo online con 'Alloggiati Web'.",
   "Le modalità (PEC, sportello, orari) cambiano da Questura a Questura; l'email ordinaria di solito non è accettata.",
   "Il termine di 48 ore decorre dalla disponibilità effettiva dell'immobile, non dalla firma del contratto (indicazione della Questura di Prato)."
  ],
  "norme": [
   {
    "titolo": "D.Lgs. 25 luglio 1998, n. 286, art. 7; D.L. 21 marzo 1978, n. 59, art. 12; D.L. 20 giugno 2012, n. 79, art. 2 (assorbimento con la registrazione)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1998-07-25;286~art7"
   }
  ],
  "fonti": [
   {
    "titolo": "Polizia di Stato - Ospitalità a cittadini extracomunitari",
    "url": "https://www.poliziadistato.it/articolo/125a93e344e6c73863395263"
   },
   {
    "titolo": "Polizia di Stato - Cessione di fabbricato",
    "url": "https://www.poliziadistato.it/articolo/cessione-di-fabbricato"
   },
   {
    "titolo": "Questura di Prato - Cessione fabbricato e comunicazione di ospitalità",
    "url": "https://questure.poliziadistato.it/it/Prato/articolo/802604357908251c410909678"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "dichiarazione-successione",
  "titolo": "Dichiarazione di successione",
  "categoria": "casa",
  "sinonimi": [
   "fare la successione",
   "dichiarazione di successione online",
   "successione entro un anno",
   "eredità cosa fare",
   "tasse di successione",
   "voltura catastale eredità",
   "successione senza notaio",
   "quando non serve la successione"
  ],
  "chi": "Eredi, chiamati all'eredità, legatari (o loro rappresentanti legali), curatori ed esecutori testamentari.",
  "dove": "Agenzia delle Entrate (ufficio competente).",
  "online": {
   "stato": "no",
   "url": null,
   "note": "Non verificato: il sito agenziaentrate.gov.it risponde «Access Denied» sia al recupero automatico sia al browser integrato."
  },
  "passi": [
   "Raccogli i dati del defunto, degli eredi e dei beni (immobili, conti, titoli).",
   "Verifica se la dichiarazione è dovuta (ci sono casi di esonero).",
   "Presenta la dichiarazione all'Agenzia delle Entrate entro 12 mesi dall'apertura della successione (di norma la data del decesso).",
   "Fino alla scadenza puoi modificarla.",
   "Paga le imposte dovute (ipotecarie, catastali, eventuale imposta di successione)."
  ],
  "documenti": [],
  "costo": "Dipende dal valore e dal tipo dei beni e dal grado di parentela: non verificato in questa sessione.",
  "tempi": null,
  "scadenze": "Entro 12 mesi dalla data di apertura della successione (con termini diversi in casi particolari: nomina del rappresentante legale, rinuncia di altri eredi, inventario…).",
  "attenzione": [
   "Dal 1° gennaio 2027 l'art. 31 del TU 346/1990 è abrogato dal d.lgs. 123/2025 (come modificato dal d.l. 200/2025): la scheda andrà aggiornata con il nuovo articolo.",
   "Diffida dei siti che vendono «moduli di successione»: la modulistica ufficiale è dell'Agenzia delle Entrate.",
   "Presentare all'ufficio sbagliato non è un problema: vale dal giorno in cui arriva all'ufficio competente."
  ],
  "norme": [
   {
    "titolo": "D.lgs. 31 ottobre 1990, n. 346 (TU successioni), art. 31 – testo vigente fino al 31/12/2026",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1990-10-31;346:1~art31"
   },
   {
    "titolo": "D.lgs. 1 agosto 2025, n. 123 (Testo unico registro e altri tributi indiretti), che dal 1/1/2027 sostituisce il TU 346/1990",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2025-08-01;123"
   }
  ],
  "fonti": [
   {
    "titolo": "Normattiva – TU 346/1990 art. 31 (versione vigente al 25/10/2026)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1990-10-31;346:1~art31!vig=2026-10-25"
   },
   {
    "titolo": "Normattiva – d.lgs. 123/2025",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2025-08-01;123"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "registrazione-contratto-affitto",
  "titolo": "Registrare un contratto d'affitto (modello RLI)",
  "categoria": "casa",
  "sinonimi": [
   "registrare contratto affitto",
   "registrazione contratto locazione",
   "rli online",
   "cedolare secca",
   "imposta di registro affitto",
   "quanto costa registrare l'affitto",
   "proroga contratto affitto",
   "risoluzione contratto affitto"
  ],
  "chi": "Locatore o conduttore (rispondono in solido delle imposte). Obbligatoria per tutti i contratti di locazione, tranne quelli abitativi che non superano complessivamente 30 giorni nell'anno con lo stesso inquilino.",
  "dove": "Agenzia delle Entrate: servizio RLI web, ufficio (su appuntamento) o intermediario abilitato (CAF, professionisti, associazioni).",
  "online": {
   "stato": "si",
   "url": "https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/registrazione-di-un-nuovo-contratto/compilazione-e-invio-via-web-regime-ordinario",
   "note": null
  },
  "passi": [
   "Firma il contratto con la clausola sull'APE ricevuto dall'inquilino.",
   "Scegli tra regime ordinario e cedolare secca (ogni locatore sceglie per sé).",
   "Compila il modello RLI nei servizi online dell'Agenzia (o fallo fare a un intermediario).",
   "Paga imposta di registro e bollo con addebito sul conto (non dovute con cedolare secca).",
   "Conserva la ricevuta di registrazione e comunica proroghe, cessioni e risoluzioni con RLI entro 30 giorni."
  ],
  "documenti": [
   "contratto firmato",
   "codici fiscali delle parti",
   "dati catastali dell'immobile",
   "APE (copia allegata se non si tratta di singola unità)",
   "IBAN per l'addebito"
  ],
  "costo": "Regime ordinario (abitativo): imposta di registro 2% del canone annuo (minimo 67 euro per la prima annualità), base ridotta del 30% per canone concordato in comuni ad alta tensione abitativa; imposta di bollo 16 euro ogni 4 facciate o 100 righe per copia. Cedolare secca: niente registro e bollo, imposta sostitutiva 21% del canone annuo (10% per canone concordato). Servizio RLI web gratuito.",
  "tempi": "Registrazione immediata online.",
  "scadenze": "Entro 30 giorni dalla stipula o dalla decorrenza, se anteriore. Pagamento annualità successive, proroghe e risoluzioni entro 30 giorni. Telematico obbligatorio per agenti immobiliari e per chi possiede almeno 10 immobili.",
  "attenzione": [
   "Con la cedolare secca il locatore rinuncia ad aggiornare il canone (anche ISTAT) per tutta la durata dell'opzione.",
   "Cedolare secca solo per locatori persone fisiche e inquilini che non agiscono come impresa o professionisti; esclusa la sublocazione.",
   "Locazioni brevi: dal 2026 cedolare solo se non più di due appartamenti (21% per uno, 26% dal secondo).",
   "Il deposito cauzionale versato dall'inquilino non paga imposta di registro.",
   "La registrazione del contratto assorbe la comunicazione di cessione di fabbricato alla Questura, ma non quella di ospitalità per inquilini extra UE."
  ],
  "norme": [
   {
    "titolo": "DPR 26 aprile 1986, n. 131, art. 17 (fino al 31/12/2026; poi d.lgs. 1 agosto 2025, n. 123); D.Lgs. 14 marzo 2011, n. 23, art. 3 (cedolare secca; dal 1/1/2027 d.lgs. 19 giugno 2026, n. 117)",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2011-03-14;23~art3!vig=2026-10-25"
   }
  ],
  "fonti": [
   {
    "titolo": "Agenzia Entrate - Contratto di locazione o affitto di beni immobili (RLI)",
    "url": "https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/registrazione-di-un-nuovo-contratto/schedainfo-regime-ordinario"
   },
   {
    "titolo": "Agenzia Entrate - Registrazione di un nuovo contratto: quanto si paga (cittadini)",
    "url": "https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/registrazione-di-un-nuovo-contratto/quanto-si-paga-regime-ordinario-cittadini"
   },
   {
    "titolo": "Agenzia Entrate - Cedolare secca",
    "url": "https://www.agenziaentrate.gov.it/portale/aree-tematiche/casa/affitto/cedolare-secca"
   }
  ],
  "collegati": [],
  "verificato": "2026-10-25"
 },
 {
  "id": "voltura-luce-gas",
  "titolo": "Voltura delle utenze luce e gas",
  "categoria": "casa",
  "sinonimi": [
   "voltura luce",
   "voltura gas",
   "cambio intestatario bolletta",
   "subentro contatore",
   "voltura per decesso",
   "costo voltura enel",
   "intestare le utenze",
   "trasloco utenze",
   "portale offerte"
  ],
  "chi": "Chi entra in un immobile con fornitura attiva intestata a un'altra persona (voltura) o con contatore disattivato (subentro). Deve avere un titolo sull'immobile (proprietà, possesso o detenzione), anche autocertificato.",
  "dove": "Il venditore che già serve l'immobile (voltura) o il venditore scelto (subentro). Per confrontare le offerte: Portale Offerte di ARERA-Acquirente Unico.",
  "online": {
   "stato": "parziale",
   "url": "https://www.ilportaleofferte.it/portaleOfferte/",
   "note": null
  },
  "passi": [
   "Scopri chi è il venditore attuale (se non lo sai: servizio Smart Info dello Sportello per il consumatore, gratuito).",
   "Chiedi la voltura al venditore con le modalità che indica, fornendo il titolo sull'immobile e i dati della fornitura.",
   "Se vuoi un'altra offerta, confrontale sul Portale Offerte prima o dopo la voltura.",
   "Il venditore accetta entro 2 giorni lavorativi e comunica la cessazione al precedente intestatario; la registrazione richiede altri 2 giorni lavorativi."
  ],
  "documenti": [
   "documento d'identità e codice fiscale",
   "titolo sull'immobile o autocertificazione",
   "codice POD (luce) o PDR (gas) e lettura del contatore",
   "eventuale autocertificazione di estraneità al debito del precedente intestatario"
  ],
  "costo": "Mercato libero: dipende dal contratto. Luce in Maggior tutela o tutele graduali e gas in tutela della vulnerabilità: 23 euro di oneri amministrativi del venditore. Luce: nessun contributo ai distributori. Gas: per la voltura contributo del distributore da prezziario; per il subentro 30 euro (contatori fino a G6) + eventuale verifica di sicurezza 47 euro + imposte. Possibili imposta di bollo e deposito cauzionale.",
  "tempi": "Voltura di norma in 4 giorni lavorativi.",
  "scadenze": "Nessun termine di legge per il cittadino indicato dalla fonte.",
  "attenzione": [
   "Il venditore non può addebitarti i debiti del vecchio intestatario, salvo che tu non sia estraneo (es. erede o convivente).",
   "Senza titolo sull'immobile non si possono allacciare utenze.",
   "Nel mercato libero chiedi per iscritto i costi della voltura prima di firmare."
  ],
  "norme": [
   {
    "titolo": "D.L. 28 marzo 2014, n. 47, art. 5 (titolo sull'immobile); delibera ARERA 102/2016/R/com",
    "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2014-03-28;47~art5"
   }
  ],
  "fonti": [
   {
    "titolo": "ARERA - Quanto costa effettuare una voltura o un subentro? (elettricità)",
    "url": "https://www.arera.it/atlante-per-il-consumatore/elettricita/il-contratto/voltura-e-subentro/quanto-costa-effettuare-una-voltura-o-un-subentro"
   },
   {
    "titolo": "ARERA - Quanto costa effettuare una voltura o un subentro? (gas)",
    "url": "https://www.arera.it/atlante-per-il-consumatore/gas/il-contratto/voltura-e-subentro/quanto-costa-effettuare-una-voltura-o-un-subentro"
   },
   {
    "titolo": "ARERA - Quanto tempo occorre per ottenere la voltura?",
    "url": "https://www.arera.it/atlante-per-il-consumatore/gas/il-contratto/voltura-e-subentro/quanto-tempo-occorre-per-ottenere-la-voltura"
   }
  ],
  "collegati": [
   "mi-rimborsano"
  ],
  "verificato": "2026-10-25"
 }
];
