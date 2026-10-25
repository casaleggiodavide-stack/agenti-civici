// Regole di «È una truffa?»: il semaforo (mai «sicuro») e cosa fare subito, con le
// scadenze per contestare alla banca e per la querela. Testi vigenti al 25/10/2026.

import { data, iso, oggi as oggiDi, giorniTra, aggiungiGiorni } from './comune/date.js';
import { analizza } from './segnali.js';

export const VERIFICATO = '2026-10-25';
const N = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:';
export const FONTI = {
  consob: { titolo: 'CONSOB, «Occhio alle truffe!»: come riconoscere l\'abusivismo finanziario e verificare chi è autorizzato', url: 'https://www.consob.it/web/area-pubblica/occhio-alle-truffe' },
  tuf: { titolo: 'Testo unico della finanza, art. 7-octies: l\'oscuramento dei siti degli abusivi', url: `${N}decreto.legislativo:1998-02-24;58~art7octies` },
  vop: { titolo: 'Banca d\'Italia: la verifica del beneficiario (nome e IBAN) nei bonifici', url: 'https://www.bancaditalia.it/media/notizia/la-banca-d-italia-fornisce-informazioni-sulla-verifica-del-beneficiario-vop-per-i-bonifici-ordinari-e-istantanei' },
  art9: { titolo: 'D.lgs. 11/2010, art. 9: contestare l\'operazione non autorizzata entro 13 mesi', url: `${N}decreto.legislativo:2010-01-27;11~art9` },
  art11: { titolo: 'D.lgs. 11/2010, art. 11: rimborso entro la giornata operativa successiva', url: `${N}decreto.legislativo:2010-01-27;11~art11` },
  art12: { titolo: 'D.lgs. 11/2010, art. 12: al massimo 50 euro a tuo carico, salvo colpa grave', url: `${N}decreto.legislativo:2010-01-27;11~art12` },
  cp640: { titolo: 'Codice penale, art. 640: la truffa', url: `${N}regio.decreto:1930-10-19;1398:1~art640` },
  cp124: { titolo: 'Codice penale, art. 124: tre mesi per la querela', url: `${N}regio.decreto:1930-10-19;1398:1~art124` },
  postale: { titolo: 'Polizia Postale: segnalazioni e denunce online', url: 'https://www.commissariatodips.it/' },
};

const lungo = (d) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const CHI = { banca: 'la banca o Poste', corriere: 'un corriere', pa: 'un ente pubblico', polizia: 'le forze dell\'ordine', familiare: 'un familiare o un amico', investimento: 'una piattaforma di investimento', venditore: 'un venditore o un acquirente' };

export function valuta(r, opz = {}) {
  const oggi = oggiDi(opz.oggi);
  const scadenze = [];
  const azioni = [];
  const fonti = [];
  const usa = (...k) => k.forEach((x) => { if (!fonti.includes(FONTI[x])) fonti.push(FONTI[x]); });
  const scad = (d, titolo, testo) => d && scadenze.push({ data: iso(d), titolo, testo, scaduta: d < oggi, giorniMancanti: Math.max(0, giorniTra(oggi, d)) });
  const { segnali, domini } = analizza(r.testo || '', opz);
  const da = (id, forza, titolo, testo) => { if (!segnali.some((s) => s.id === id)) segnali.push({ id, forza, titolo, testo }); };

  // Le risposte della persona valgono quanto il testo
  if (r.chiede_codici === true) da('codici', 'forte', 'Ti chiedono codici o password', 'Banche, Poste ed enti non chiedono mai codici, PIN, password o il codice arrivato per SMS.');
  if (r.chiede_soldi === true && ['banca', 'polizia'].includes(r.chi)) da('conto', 'forte', `Dice di essere ${CHI[r.chi]} e ti chiede soldi`, 'La banca e le forze dell\'ordine non chiedono mai di fare bonifici o spostare soldi per proteggerli.');
  if (r.chiede_soldi === true && r.chi === 'familiare') da('familiare', 'forte', 'Un familiare che chiede soldi con urgenza', 'Prima di pagare, chiamalo al numero che conosci o fagli una domanda che solo lui sa.');
  if (r.chiede_app === true) da('remoto', 'forte', 'Ti chiedono di installare un\'app', 'Le app di controllo remoto, o scaricate da un link, danno a chi le manda il controllo del telefono.');
  if (r.chi === 'investimento') { usa('consob', 'tuf'); da('investimento', 'verifica', 'Un investimento proposto da chi non conosci', 'Verifica che sia autorizzato, sul sito della CONSOB o della Banca d\'Italia, prima di versare qualsiasi somma.'); }
  if (r.canale === 'telefono') da('telefono', 'verifica', 'Un numero italiano sullo schermo non prova niente', 'Dal 2025 gli operatori bloccano le chiamate dall\'estero con numero italiano falsificato, ma non quelle nazionali: chi chiama può mostrare il numero della tua banca. Riattacca e richiama tu dal numero sul retro della carta.');
  if (segnali.some((s) => s.id.startsWith('consob'))) usa('consob', 'tuf');

  const forti = segnali.filter((s) => s.forza === 'forte');
  const livello = forti.length ? 'forte' : segnali.length ? 'verifica' : (r.testo || r.chi) ? 'nessuno' : null;

  // Cosa fare subito
  const fatto = r.fatto || 'niente';
  if (fatto === 'niente') {
    azioni.push(r.canale === 'telefono' ? 'Riattacca. Non dare dati, codici o conferme a chi ti ha chiamato, anche se sa già il tuo nome o il numero della carta.' : 'Non cliccare il link e non rispondere.');
    azioni.push('Se vuoi controllare, apri tu l\'app ufficiale o digita a mano il sito, oppure chiama il numero sul retro della carta o sul sito ufficiale.');
    if (r.canale === 'sms' || r.canale === 'email') azioni.push('Puoi segnalare il messaggio alla Polizia Postale e poi cancellarlo.');
  }
  if (fatto === 'cliccato') azioni.push('Chiudi la pagina senza inserire niente. Se ha scaricato un file o un\'app, non aprirli e cancellali.');
  if (['dati', 'codici', 'pagato'].includes(fatto)) {
    azioni.push('Chiama subito la banca dal numero sul retro della carta o dall\'app ufficiale, e chiedi di bloccare carta e accessi.');
    azioni.push('Cambia le password che hai scritto, a partire da email e banca, e attiva la verifica in due passaggi.');
    if (fatto === 'codici') azioni.push('Se hai dato un codice arrivato per SMS o confermato un\'operazione dall\'app, dillo alla banca: è il momento in cui possono ancora fermarla.');
  }
  if (r.chi === 'familiare' || segnali.some((s) => s.id === 'familiare')) azioni.push('Avvisa gli altri familiari: chi ha il tuo numero o quello di un parente potrebbe riprovarci con loro.');

  if (fatto === 'pagato') {
    usa('art9', 'art11', 'art12', 'cp640', 'cp124', 'postale');
    const addebito = data(r.data_addebito);
    const scoperta = data(r.data_scoperta) || oggi;
    if (['carta', 'prelievo'].includes(r.come) || r.autorizzato === false) {
      if (addebito) scad(piuMesi13(addebito), 'Ultimo giorno per contestare alla banca', 'Il termine massimo per contestare un\'operazione che non hai autorizzato: ma va fatto subito, non aspettare.');
      azioni.push('Contesta per iscritto l\'operazione alla banca: se non l\'hai autorizzata tu, deve rimborsarti entro la fine della giornata lavorativa successiva, salvo un motivato sospetto di frode. A tuo carico al massimo 50 euro, se non c\'è colpa grave. La lettera la trovi in Mi rimborsano?');
    } else if (['bonifico', 'istantaneo'].includes(r.come)) {
      usa('vop');
      azioni.push('Se il bonifico l\'hai fatto tu perché ingannato, per la legge è un\'operazione autorizzata: il rimborso non è automatico. Chiama subito la banca: prima chiami, più sono le possibilità di fermarlo o recuperarlo.');
      azioni.push('Dal 9 ottobre 2025 la banca controlla che nome e IBAN del beneficiario corrispondano: se ti aveva avvisato di una mancata corrispondenza, segnalalo.');
    } else if (['ricarica', 'cripto', 'buono'].includes(r.come)) {
      azioni.push('Ricariche, buoni regalo e criptovalute sono difficilissimi da recuperare: avvisa subito l\'emittente (la banca della carta prepagata, il negozio del buono, la piattaforma di cambio) e conserva ricevute e messaggi.');
    }
    azioni.push('Fai denuncia alla Polizia Postale o a qualsiasi ufficio di polizia o dei carabinieri, portando screenshot, numeri, link e ricevute: serve anche alla banca.');
    scad(aggiungiGiorni(scoperta, 90), 'Termine per la querela (circa)', 'La truffa si punisce su querela, da presentare entro tre mesi da quando hai scoperto il fatto. Calcoliamo 90 giorni: non aspettare l\'ultimo giorno.');
  }
  if (segnali.some((s) => s.id.startsWith('consob')) || r.chi === 'investimento') azioni.push('Segnala il sito alla CONSOB dalla pagina «Occhio alle truffe!».');

  let verdetto;
  if (!livello) verdetto = { tono: 'dato', titolo: 'Incolla il messaggio o raccontalo', testo: 'Testo, link, chi dice di essere e cosa ti chiede: guardiamo i segnali di truffa. Il testo resta su questo dispositivo.' };
  else if (livello === 'forte') verdetto = { tono: 'no', titolo: forti.length > 1 ? `${forti.length} segnali forti di truffa` : 'Un segnale forte di truffa', testo: 'Fermati: non cliccare, non pagare, non dare codici. Se vuoi verificare, usa solo i canali ufficiali che trovi tu.' };
  else if (livello === 'verifica') verdetto = { tono: 'forse', titolo: 'Ci sono segnali da verificare', testo: 'Niente di certo, ma abbastanza per non usare i link o i numeri del messaggio. Verifica dal canale ufficiale prima di fare qualsiasi cosa.' };
  else verdetto = { tono: 'neutro', titolo: 'Non abbiamo trovato segnali noti', testo: 'Non vuol dire che sia sicuro: le truffe cambiano di continuo. Anche in questo caso, apri l\'app o il sito ufficiale digitandolo tu, senza usare i link del messaggio.' };
  return { verdetto, livello, segnali: segnali.sort((a, b) => (a.forza === b.forza ? 0 : a.forza === 'forte' ? -1 : 1)), domini, azioni, scadenze: scadenze.sort((a, b) => a.data.localeCompare(b.data)), fonti: [FONTI.consob, ...fonti.filter((f) => f !== FONTI.consob)] };
}

/** 13 mesi dopo la data dell'addebito. */
function piuMesi13(d) {
  const x = new Date(d);
  const g = x.getUTCDate();
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + 13);
  const ultimo = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0, 12)).getUTCDate();
  x.setUTCDate(Math.min(g, ultimo));
  return x;
}
