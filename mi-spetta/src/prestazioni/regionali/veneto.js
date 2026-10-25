// Veneto: misure regionali verificate il 25/10/2026. Parte del sito regionale
// (/documents/) è vietata dal robots.txt: le regole vengono dal BUR e dai portali dedicati.

import { VERIFICATO_REGIONI, req, iseeEntro, figlioTra } from '../_comuni.js';

export const venetoIcd = {
  id: 'veneto_icd',
  regione: 'veneto',
  nome: 'Impegnativa di cura domiciliare, ICD (Veneto)',
  ente: 'Regione Veneto, tramite le AULSS',
  categoria: 'anziani',
  sintesi: 'Contributo mensile da 120 a 800 € per assistere a casa una persona non autosufficiente, anziana o con disabilità, secondo il bisogno e l\'ISEE socio-sanitario.',
  valuta(s) {
    return {
      requisiti: [
        req('Nel nucleo c\'è una persona non autosufficiente assistita a casa', s.disabileNucleo, 'disabile_nucleo'),
        iseeEntro(s, 59999.99, 'ISEE socio-sanitario sotto 16.700 € per il basso bisogno, 40.000 € per l\'elevato bisogno, 60.000 € per la dipendenza vitale'),
      ],
      probabile: true,
      importo: { breve: 'da 120 a 800 € al mese', testo: 'Basso bisogno 120 € al mese; elevato bisogno e demenze con disturbi del comportamento 400 €; dipendenza vitale con assistenza 24 ore 800 €. Si accede scorrendo una graduatoria che pesa gravità e ISEE.', nonSommare: true },
    };
  },
  finestra: { testo: 'Si può chiedere in ogni momento; il contributo si rinnova di anno in anno.' },
  come: { testo: 'Ai servizi sociali del Comune, al Distretto socio-sanitario o sul sito dell\'AULSS di residenza.', link: 'https://salute.regione.veneto.it/assistenza-sociosanitaria-/anziani-non-autosufficienti/domiciliarit%C3%A0-%28icd%29---impegnative-di-cura-domiciliari' },
  fonti: [{ titolo: 'Regione Veneto, Portale della Salute: Domiciliarità (ICD), aggiornata il 14/5/2026', url: 'https://salute.regione.veneto.it/assistenza-sociosanitaria-/anziani-non-autosufficienti/domiciliarit%C3%A0-%28icd%29---impegnative-di-cura-domiciliari' }],
  verificato: VERIFICATO_REGIONI,
};

export const venetoBuonoLibri = {
  id: 'veneto_buono_libri',
  regione: 'veneto',
  nome: 'Buono libri (Veneto)',
  ente: 'Regione Veneto, tramite i Comuni',
  categoria: 'famiglia',
  sintesi: 'Rimborso fino a 200 € per i libri di testo degli studenti di scuola media, superiore, formazione professionale o istruzione parentale con ISEE fino a 15.748,78 €.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 10, 20, 'Un figlio iscritto alla scuola media o superiore'), iseeEntro(s, 15748.78, 'ISEE fino a 15.748,78 €')],
      probabile: true,
      importo: { breve: 'fino a 200 €', testo: 'Fino a 200 € con ISEE fino a 10.632,94 €, fino a 150 € oltre, mai più della spesa.', unaTantum: 150 },
    };
  },
  finestra: { a: '2026-10-09', testo: 'Per il 2026-2027 le domande si sono chiuse il 9 ottobre 2026; gli esiti dal 21 dicembre. Il bando si ripete ogni anno tra settembre e ottobre.' },
  come: { testo: 'Online con SPID, CIE o CNS sul portale regionale Buono Libri.', link: 'https://libritesto.regione.veneto.it/' },
  fonti: [{ titolo: 'Regione Veneto, Portale Buono Libri 2026-2027 (DGR 888 del 19/8/2026)', url: 'https://libritesto.regione.veneto.it/' }],
  verificato: VERIFICATO_REGIONI,
};

export const venetoVoucherInfanzia = {
  id: 'veneto_voucher_prima_infanzia',
  regione: 'veneto',
  nome: 'Voucher prima infanzia (Veneto, Fattore Famiglia)',
  ente: 'Regione Veneto, tramite gli Ambiti sociali',
  categoria: 'famiglia',
  sintesi: 'Voucher una tantum da 900 a 1.500 € per ogni bambino che frequenta un nido o un servizio 0-3 anni, per famiglie con ISEE fino a 22.000 €.',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 0, 4, 'Un figlio che ha frequentato un nido o un servizio 0-3 anni per almeno due mesi'), iseeEntro(s, 22000, 'ISEE ordinario fino a 22.000 €')],
      probabile: true,
      importo: { breve: 'da 900 a 1.500 €', testo: 'Da 1.500 € a 900 € secondo l\'ISEE ricalcolato con il Fattore Famiglia, che pesa figli, un solo genitore, disabilità e perdita del lavoro. Graduatoria fino a esaurimento dei fondi.', unaTantum: 900 },
    };
  },
  finestra: { a: '2026-05-15', testo: 'L\'edizione 2025 ha raccolto le domande dal 1° aprile al 15 maggio 2026. La misura si ripete dal 2021: la nuova delibera è attesa in autunno 2026, con domande in primavera 2027.' },
  come: { testo: 'Domanda all\'Ambito territoriale sociale tramite il Comune di residenza, secondo l\'avviso locale.', link: 'https://www.regione.veneto.it/web/rete-degli-urp-del-veneto/famiglia' },
  fonti: [{ titolo: 'BUR Veneto, DGR n. 1054 dell\'8/9/2025: Voucher prima infanzia', url: 'https://bur.regione.veneto.it/BurvServices/pubblica/DettaglioDgr.aspx?id=564664' }],
  verificato: VERIFICATO_REGIONI,
};

export const venetoBuonoScuola = {
  id: 'veneto_buono_scuola',
  regione: 'veneto',
  nome: 'Buono scuola per le rette (Veneto)',
  ente: 'Regione Veneto',
  categoria: 'famiglia',
  sintesi: 'Contributo sulle rette di iscrizione e frequenza (almeno 200 € di spesa) di primaria, secondaria e formazione professionale, con ISEE fino a 40.000 € (60.000 € con disabilità).',
  valuta(s) {
    return {
      requisiti: [figlioTra(s, 6, 20, 'Un figlio iscritto a una scuola che chiede una retta (es. paritaria)'), iseeEntro(s, 40000, 'ISEE fino a 40.000 € (60.000 € per studenti con disabilità)')],
      probabile: true,
      importo: { breve: 'fino a 1.950 €', testo: 'Con ISEE fino a 15.000 €: fino a 900 € primaria, 1.350 € media, 1.950 € superiore; fino a 30.000 €: 390/780/1.150 €; fino a 40.000 €: 310/540/780 €.', nonSommare: true },
      note: ['Conta solo se paghi una retta di almeno 200 € l\'anno: mensa, trasporti e libri esclusi.'],
    };
  },
  finestra: { a: '2026-06-30', testo: 'L\'edizione 2025-2026 si è chiusa il 30 giugno 2026. La prossima è attesa tra maggio e giugno 2027.' },
  come: { testo: 'Online con SPID o CIE sul portale Buono Scuola; la scuola conferma la spesa.', link: 'https://buonoscuola.regione.veneto.it/' },
  fonti: [{ titolo: 'BUR Veneto, DGR n. 409 del 19/5/2026: Buono scuola 2025-2026', url: 'https://bur.regione.veneto.it/BurvServices/pubblica/DettaglioDgr.aspx?id=583353' }],
  verificato: VERIFICATO_REGIONI,
};
