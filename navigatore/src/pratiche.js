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
 }
];
