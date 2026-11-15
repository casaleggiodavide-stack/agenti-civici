// Le domande di «Quando vado in pensione?». Del giorno di nascita non c'è bisogno:
// mese e anno bastano per i requisiti e il giorno resta tuo.

import { GESTIONI } from './regole.js';

export const SEZIONI = [
  { id: 'tu', titolo: 'Tu', aiuto: 'Le risposte restano su questo dispositivo e non finiscono nell\'indirizzo della pagina.' },
  { id: 'contributi', titolo: 'I tuoi contributi', aiuto: 'Il numero esatto è nell\'estratto conto contributivo dell\'INPS (MyINPS, «Posizione contributiva»).' },
  { id: 'lavoro', titolo: 'Il tuo lavoro' },
  { id: 'situazioni', titolo: 'Situazioni particolari', aiuto: 'Facoltative: servono per le uscite riservate a chi è in difficoltà o fa lavori pesanti.' },
];

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

export const DOMANDE = [
  { id: 'nascita_mese', sezione: 'tu', tipo: 'elenco', etichetta: 'Mese di nascita', opzioni: MESI.map((m, i) => [String(i + 1), m]) },
  { id: 'nascita_anno', sezione: 'tu', tipo: 'numero', etichetta: 'Anno di nascita', segnaposto: 'es. 1962' },
  { id: 'sesso', sezione: 'tu', tipo: 'scelta', etichetta: 'Sesso', aiuto: 'Per la pensione anticipata uomini e donne hanno requisiti diversi; alcune uscite sono solo per le donne.', opzioni: [['donna', 'Donna'], ['uomo', 'Uomo']] },
  { id: 'figli', sezione: 'tu', tipo: 'numero', etichetta: 'Quanti figli hai?', aiuto: 'Per le donne abbassa alcuni requisiti (APE sociale, Opzione donna, soglia dell\'anticipata contributiva).', visibile: (r) => r.sesso === 'donna' },

  { id: 'contributi_anni', sezione: 'contributi', tipo: 'numero', etichetta: 'Anni di contributi già versati', segnaposto: 'es. 35' },
  { id: 'contributi_mesi', sezione: 'contributi', tipo: 'numero', etichetta: 'e mesi', segnaposto: 'da 0 a 11' },
  { id: 'mesi_anno', sezione: 'contributi', tipo: 'numero', etichetta: 'Quanti mesi di contributi versi ogni anno, da qui in avanti?', aiuto: '12 se lavori tutto l\'anno, 6 se lavori metà anno, 0 se hai smesso. Contano anche i contributi figurativi (per esempio la NASpI).', segnaposto: 'es. 12' },
  { id: 'prima_1996', sezione: 'contributi', tipo: 'si_no', nonSo: true, etichetta: 'Hai contributi versati prima del 1° gennaio 1996?', aiuto: 'Decide il sistema di calcolo: con contributi prima del 1996 sei nel sistema misto, senza nel contributivo puro. Alcune uscite valgono solo per l\'uno o per l\'altro.' },

  { id: 'gestione', sezione: 'lavoro', tipo: 'scelta', etichetta: 'Dove versi i contributi?', aiuto: 'Se hai cambiato lavoro, scegli quello di adesso.', opzioni: Object.entries(GESTIONI) },
  {
    id: 'lavoro', sezione: 'lavoro', tipo: 'scelta', etichetta: 'Fai un lavoro gravoso o usurante?',
    aiuto: 'Gravosi sono, per esempio, operai edili, infermieri e ostetriche ospedalieri che lavorano a turni, insegnanti della scuola dell\'infanzia ed educatori di asilo nido, conducenti di mezzi pesanti, facchini, addetti alle pulizie, operatori ecologici, assistenti di persone non autosufficienti: l\'elenco completo è nell\'allegato B della legge 205/2017. Usuranti sono le mansioni del decreto legislativo 67/2011.',
    opzioni: [
      ['no', 'No'],
      ['gravoso_7_10', 'Gravoso, da almeno 7 anni negli ultimi 10'],
      ['gravoso_6_7', 'Gravoso, da almeno 6 anni negli ultimi 7'],
      ['usurante', 'Usurante (cave, gallerie, alte temperature, catena di montaggio, autista di autobus, notturno 78 notti l\'anno o più) da 7 anni negli ultimi 10 o metà della vita lavorativa'],
      ['notturno_72_77', 'Notturno a turni, da 72 a 77 notti l\'anno'],
      ['notturno_64_71', 'Notturno a turni, da 64 a 71 notti l\'anno'],
    ],
  },
  { id: 'precoce', sezione: 'lavoro', tipo: 'si_no', nonSo: true, etichetta: 'Hai almeno 12 mesi di contributi da lavoro prima dei 19 anni?', aiuto: 'Anche non continuativi. Servono per la pensione dei lavoratori precoci (quota 41).' },

  { id: 'invalidita74', sezione: 'situazioni', tipo: 'si_no', etichetta: 'Hai un\'invalidità civile riconosciuta almeno al 74%?' },
  { id: 'caregiver', sezione: 'situazioni', tipo: 'si_no', etichetta: 'Assisti da almeno 6 mesi il coniuge o un parente stretto convivente con disabilità grave (legge 104, articolo 3, comma 3)?', aiuto: 'Vale il coniuge o un parente di primo grado; un parente di secondo grado se i genitori o il coniuge della persona hanno almeno 70 anni, sono malati o mancano.' },
  {
    id: 'disoccupato', sezione: 'situazioni', tipo: 'scelta', etichetta: 'Sei disoccupato dopo un licenziamento, dimissioni per giusta causa, una risoluzione consensuale o la fine di un contratto a termine?',
    opzioni: [['no', 'No'], ['naspi_in_corso', 'Sì, prendo ancora la NASpI'], ['naspi_finita', 'Sì, la NASpI è finita da meno di 3 mesi'], ['naspi_finita_3', 'Sì, la NASpI è finita da almeno 3 mesi']],
  },
  { id: 'fine_termine', sezione: 'situazioni', tipo: 'si_no', etichetta: 'Il lavoro è finito per la scadenza di un contratto a termine?', aiuto: 'Conta per la quota 41 dei precoci, che non vale in questo caso, e per l\'APE sociale, che chiede almeno 18 mesi di lavoro dipendente nei 36 mesi prima.', visibile: (r) => r.disoccupato && r.disoccupato !== 'no' },
];
