// I segnali di truffa in un messaggio: regole scritte, controllabili, senza AI.
// Il risultato non dice mai «è sicuro»: elenca i segnali trovati e quelli che non si possono verificare.

import CONSOB from '../dati/consob.js';

// Domini ufficiali dei marchi più imitati (elenco curato a mano, da ampliare).
export const MARCHI = [
  { nome: 'Poste Italiane', parole: ['poste', 'postepay', 'bancoposta', 'posteitaliane'], domini: ['poste.it', 'posteitaliane.it', 'postepay.it'] },
  { nome: 'INPS', parole: ['inps'], domini: ['inps.it'] },
  { nome: 'Agenzia delle Entrate', parole: ['agenziaentrate', 'agenzia-entrate', 'agenziaentrateriscossione', 'riscossione'], domini: ['agenziaentrate.gov.it', 'agenziaentrateriscossione.gov.it', 'agenziaentrate.it'] },
  { nome: 'pagoPA', parole: ['pagopa'], domini: ['pagopa.gov.it', 'pagopa.it'] },
  { nome: 'App IO', parole: ['ioapp', 'app-io'], domini: ['io.italia.it', 'italia.it'] },
  { nome: 'Polizia di Stato', parole: ['polizia', 'poliziadistato', 'poliziapostale'], domini: ['poliziadistato.it', 'commissariatodips.it'] },
  { nome: 'Carabinieri', parole: ['carabinieri'], domini: ['carabinieri.it'] },
  { nome: 'Intesa Sanpaolo', parole: ['intesa', 'sanpaolo'], domini: ['intesasanpaolo.com', 'intesasanpaolo.it'] },
  { nome: 'UniCredit', parole: ['unicredit'], domini: ['unicredit.it', 'unicredit.eu'] },
  { nome: 'BNL', parole: ['bnl'], domini: ['bnl.it'] },
  { nome: 'BPER', parole: ['bper'], domini: ['bper.it'] },
  { nome: 'Banco BPM', parole: ['bancobpm', 'bpm'], domini: ['bancobpm.it'] },
  { nome: 'Banca Mediolanum', parole: ['mediolanum'], domini: ['bancamediolanum.it'] },
  { nome: 'Fineco', parole: ['fineco'], domini: ['finecobank.com', 'fineco.it'] },
  { nome: 'Crédit Agricole', parole: ['creditagricole', 'credit-agricole'], domini: ['credit-agricole.it'] },
  { nome: 'Monte dei Paschi', parole: ['montepaschi', 'mps'], domini: ['mps.it'] },
  { nome: 'ING', parole: ['ingdirect', 'ing-it'], domini: ['ing.it'] },
  { nome: 'Nexi', parole: ['nexi'], domini: ['nexi.it'] },
  { nome: 'PayPal', parole: ['paypal'], domini: ['paypal.com', 'paypal.it'] },
  { nome: 'Amazon', parole: ['amazon', 'amzn'], domini: ['amazon.it', 'amazon.com', 'amazon.eu'] },
  { nome: 'DHL', parole: ['dhl'], domini: ['dhl.it', 'dhl.com'] },
  { nome: 'BRT', parole: ['brt', 'bartolini'], domini: ['brt.it'] },
  { nome: 'GLS', parole: ['gls'], domini: ['gls-italy.com', 'gls-group.com'] },
  { nome: 'SDA', parole: ['sda'], domini: ['sda.it'] },
  { nome: 'UPS', parole: ['ups'], domini: ['ups.com'] },
  { nome: 'Enel', parole: ['enel'], domini: ['enel.it', 'enel.com'] },
  { nome: 'Telepass', parole: ['telepass'], domini: ['telepass.com'] },
  { nome: 'Autostrade', parole: ['autostrade'], domini: ['autostrade.it'] },
  { nome: 'Netflix', parole: ['netflix'], domini: ['netflix.com'] },
  { nome: 'Apple', parole: ['apple', 'icloud'], domini: ['apple.com', 'icloud.com'] },
  { nome: 'Microsoft', parole: ['microsoft', 'outlook', 'office365'], domini: ['microsoft.com', 'live.com', 'office.com', 'outlook.com'] },
];

const ACCORCIATORI = ['bit.ly', 'tinyurl.com', 't.ly', 'cutt.ly', 'rb.gy', 'is.gd', 'shorturl.at', 'tiny.cc', 'ow.ly', 'goo.gl', 'qrco.de', 'linktr.ee'];
const SECONDO_LIVELLO = /\.(gov|edu|co|com|net|org)\.[a-z]{2}$/;

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Il dominio registrato: le ultime due parti (tre per gov.it, co.uk e simili). */
export function registrato(host) {
  const h = host.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  const parti = h.split('.');
  return parti.slice(SECONDO_LIVELLO.test(h) ? -3 : -2).join('.');
}

/** Tutti i domini che compaiono nel testo, con o senza http. */
export function domini(testo) {
  const visti = new Set();
  for (const m of String(testo || '').matchAll(/(?:https?:\/\/)?((?:[a-z0-9¡-￿-]+\.)+(?:[a-z]{2,24}|xn--[a-z0-9-]+))(?=[\/\s:?#)\]>"',;]|$)/gi)) {
    const h = m[1].toLowerCase();
    if (/^\d+(\.\d+)*$/.test(h.replace(/\.[a-z]+$/, '')) && !/\d+\.\d+\.\d+\.\d+/.test(h)) continue;
    if (/\.(jpg|png|pdf|js|php|html?)$/.test(h)) continue;
    visti.add(h.replace(/^www\./, ''));
  }
  for (const m of String(testo || '').matchAll(/https?:\/\/(\d{1,3}(?:\.\d{1,3}){3})/g)) visti.add(m[1]);
  return [...visti];
}

/** I domini dei siti delle pubbliche amministrazioni (IndicePA, categorie L e C: niente società di servizi). */
export function sitiPubblici(indice) {
  const s = new Set();
  for (const e of indice?.righe || indice?.enti || []) {
    const sito = Array.isArray(e) ? e[5] : e.sito;
    const cat = Array.isArray(e) ? e[1] : e.cat;
    if (sito && /^[LC]/.test(cat || '')) s.add(registrato(String(sito).replace(/^https?:\/\//, '').split('/')[0]));
  }
  return s;
}

const REGOLE_TESTO = [
  { id: 'codici', forza: 'forte', re: /\b(otp|pin|password|passw|credenziali|codice (di |del )?(sicurezza|conferma|accesso|verifica|autorizzazione|dispositivo)|codice (che )?(hai |ti e )?(ricevuto|arrivato)|codice via sms)\b/, titolo: 'Ti chiedono codici o password', testo: 'Banche, Poste ed enti non chiedono mai codici, PIN, password o il codice arrivato per SMS: chi te li chiede vuole entrare nel tuo conto.' },
  { id: 'conto', forza: 'forte', re: /conto (di )?(sicurezza|sicuro|protetto|di tutela|temporaneo)|(spostare|trasferire|mettere al sicuro) (i |i tuoi |tutti i )?(soldi|risparmi|fondi|denaro)/, titolo: 'Ti chiedono di spostare i soldi «al sicuro»', testo: 'Nessuna banca chiede di spostare i risparmi su un «conto di sicurezza»: è la truffa del finto operatore antifrode.' },
  { id: 'remoto', forza: 'forte', re: /anydesk|teamviewer|quick ?support|rustdesk|accesso remoto|\.apk\b|scarica (questa |l')?app (dal link|da qui)|installa (questa |l')?app/, titolo: 'Ti chiedono di installare un\'app o dare accesso al telefono', testo: 'Le app di controllo remoto, o scaricate da un link fuori dagli store, permettono a chi le manda di vedere e usare il tuo telefono.' },
  { id: 'familiare', forza: 'forte', re: /ciao (mamma|mamy|mami|papa|pa|nonna|nonno|zia|zio)\b|ho cambiato (numero|telefono)|(questo e il|e il mio) nuovo numero|il mio telefono (si e rotto|e rotto|e caduto)|salva (questo|il mio nuovo) numero/, titolo: 'Un familiare con un «nuovo numero»', testo: 'È la truffa più diffusa su WhatsApp: prima il nuovo numero, poi un bonifico urgente. Chiama il familiare al numero vecchio, o fagli una domanda che solo lui sa.' },
  { id: 'ricarica', forza: 'forte', re: /gift ?card|carta regalo|buono (amazon|google play|apple|steam)|paysafecard|ricarica (postepay|la carta|una carta)|codice della ricarica|pagare in (bitcoin|cripto|usdt)/, titolo: 'Pagamento con ricariche, buoni regalo o cripto', testo: 'Chi chiede di pagare con buoni regalo, ricariche o criptovalute sceglie mezzi che non si possono annullare né rintracciare.' },
  { id: 'urgenza', forza: 'verifica', re: /entro (24|48|12) ?ore|immediatamente|ultimo avviso|ultimo sollecito|(sara|verra|e stat[oa]) (bloccat|sospes|chius|disattivat|limitat)|scade oggi|scadra oggi|urgente|subito|azione richiesta|evita (la )?(maggiorazione|sospensione|chiusura)/, titolo: 'Urgenza e minacce', testo: 'Fretta e minacce (conto bloccato, multa maggiorata, pacco restituito) servono a non farti pensare. Prenditi tempo e verifica.' },
  { id: 'pacco', forza: 'verifica', re: /pacco|spedizion|giacenza|riconsegna|consegna (non riuscita|fallita|sospesa)|corriere|indirizzo (incompleto|errato)/, titolo: 'Un pacco da sbloccare', testo: 'I corrieri non chiedono piccoli pagamenti via SMS per riconsegnare un pacco: controlla dal sito o dall\'app ufficiale, con il numero di spedizione.' },
  { id: 'piccola', forza: 'verifica', re: /(€|eur|euro)\s?[0-4][,.]\d{2}\b|\b[0-4][,.]\d{2}\s?(€|eur|euro)/, titolo: 'Una piccola somma da pagare', testo: 'La richiesta di pochi euro serve a farti inserire i dati della carta su un sito falso.' },
  { id: 'investimento', forza: 'verifica', re: /investiment|rendiment|guadagn|trading|cripto|bitcoin|broker|interessi garantiti|raddoppi|piattaforma (di|per) (investimento|trading)|segnali di borsa|gruppo (whatsapp|telegram) (di|per) investi/, titolo: 'Un investimento con guadagni promessi', testo: 'Prima di investire verifica che chi offre il servizio sia autorizzato, sul sito della CONSOB o della Banca d\'Italia. Guadagni facili e garantiti sono il primo segnale di abusivismo.' },
  { id: 'premio', forza: 'verifica', re: /hai vinto|sei (stato|stata) (selezionat|estratt)|vincitore|premio|regalo|ti spetta un rimborso|rimborso (fiscale|irpef|in attesa|da riscuotere)|bonus (in attesa|da riscuotere)/, titolo: 'Un premio o un rimborso a sorpresa', testo: 'Premi, rimborsi fiscali o bonus da riscuotere con un link sono una delle esche più usate.' },
  { id: 'pa', forza: 'verifica', re: /multa|sanzione|verbale|cartella (esattoriale)?|pagamento in sospeso|bollo auto|tassa (non pagata|arretrata)|agenzia delle entrate|inps|pagopa|ministero/, titolo: 'Dice di essere un ente pubblico', testo: 'Gli enti pubblici mandano gli avvisi di pagamento con pagoPA, sull\'app IO o per posta. Verifica digitando a mano il sito ufficiale o aprendo l\'app IO, mai dal link.' },
];

/**
 * Analizza un messaggio. opz: { siti (Set di domini di enti pubblici da IndicePA), consob (mappa dominio → comunicato) }.
 * Restituisce { segnali: [{forza, titolo, testo, fonte?}], domini: [{host, nota}] }.
 */
export function analizza(testo, opz = {}) {
  const t = norm(testo);
  const segnali = [];
  const visti = new Set();
  const aggiungi = (s) => { if (!visti.has(s.id)) { visti.add(s.id); segnali.push(s); } };
  for (const r of REGOLE_TESTO) if (r.re.test(t)) aggiungi({ id: r.id, forza: r.forza, titolo: r.titolo, testo: r.testo });
  const consob = opz.consob || CONSOB.dominio;
  const siti = opz.siti || new Set();
  const elenco = [];
  for (const host of domini(testo)) {
    const reg = registrato(host);
    const voce = { host, registrato: reg, nota: '' };
    if (consob[host] || consob[reg]) {
      voce.nota = 'oscurato dalla CONSOB';
      aggiungi({ id: `consob-${reg}`, forza: 'forte', titolo: `${reg} è un sito oscurato dalla CONSOB`, testo: 'La CONSOB ha ordinato di oscurarlo perché offriva investimenti senza autorizzazione: è una truffa conclamata. Non versare soldi e segnalalo.', fonte: consob[host] || consob[reg] });
    } else if (/^\d+(\.\d+){3}$/.test(host)) {
      voce.nota = 'indirizzo numerico';
      aggiungi({ id: 'ip', forza: 'forte', titolo: 'Il link è un indirizzo numerico', testo: 'I siti veri usano un nome, non una serie di numeri.' });
    } else if (host.includes('xn--')) {
      voce.nota = 'caratteri camuffati';
      aggiungi({ id: 'punycode', forza: 'forte', titolo: 'Il link usa caratteri camuffati', testo: 'Il nome del sito contiene lettere di altri alfabeti che sembrano uguali alle nostre: è un trucco per imitare un sito vero.' });
    } else if (ACCORCIATORI.includes(reg)) {
      voce.nota = 'link accorciato';
      aggiungi({ id: 'corto', forza: 'verifica', titolo: 'Un link accorciato', testo: 'Il link nasconde il sito vero di destinazione. Banche ed enti non mandano link accorciati per pagamenti o accessi.' });
    } else {
      const marchio = MARCHI.find((m) => m.domini.some((d) => reg === d || host.endsWith(`.${d}`)));
      const imitato = MARCHI.find((m) => !m.domini.some((d) => reg === d || host.endsWith(`.${d}`)) && m.parole.some((p) => norm(host).split(/[.-]/).some((x) => x === p || (p.length >= 5 && x.includes(p)))));
      if (marchio) voce.nota = `dominio ufficiale di ${marchio.nome}`;
      else if (imitato) {
        voce.nota = `imita ${imitato.nome}`;
        aggiungi({ id: `imita-${reg}`, forza: 'forte', titolo: `${host} imita ${imitato.nome}`, testo: `Il nome ricorda ${imitato.nome}, ma il sito ufficiale è ${imitato.domini[0]}. È il trucco tipico dei siti falsi.` });
      } else if (reg.endsWith('.gov.it') || siti.has(reg)) voce.nota = 'sito registrato di un ente pubblico';
      else if (/agenzia delle entrate|inps|pagopa|ministero|comune di|polizia|carabinieri|tribunale|prefettura/.test(t)) {
        voce.nota = 'non è il sito di un ente pubblico';
        aggiungi({ id: `nonpa-${reg}`, forza: 'forte', titolo: `${reg} non è il sito di un ente pubblico`, testo: 'Il messaggio parla a nome di un ente pubblico, ma il link non porta a un sito registrato nell\'Indice delle pubbliche amministrazioni.' });
      }
    }
    elenco.push(voce);
  }
  return { segnali: segnali.sort((a, b) => (a.forza === b.forza ? 0 : a.forza === 'forte' ? -1 : 1)), domini: elenco };
}

/** Toglie dal testo i dati personali prima di mandarlo all'assistente AI. */
export function maschera(testo) {
  return String(testo || '')
    .replace(/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]){11,30}\b/gi, (m) => (/^IT|^[A-Z]{2}\d{2}/i.test(m) && m.replace(/\s/g, '').length >= 15 ? '[IBAN]' : m))
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[numero di carta]')
    .replace(/\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi, '[codice fiscale]')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/(?:\+39[\s.]?)?\b3\d{2}[\s.-]?\d{3}[\s.-]?\d{3,4}\b/g, '[telefono]')
    .replace(/\b0\d{1,3}[\s.-]?\d{5,8}\b/g, '[telefono]')
    .replace(/\b\d{5,8}\b/g, '[codice]');
}
