// La lettera di «La visita nei tempi»: richiesta all'ASL di attivare il percorso di tutela.

import { esc } from './comune/interfaccia.js';
import { data } from './comune/date.js';

const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const v = (x, t) => (x === undefined || x === null || x === '' ? vuoto(t) : esc(String(x)));
const giorno = (s, t) => (s ? esc(data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })) : vuoto(t));
const CLASSI = { U: 'U (urgente, 72 ore)', B: 'B (breve, 10 giorni)', D: 'D (differibile)', P: 'P (programmata, 120 giorni)' };

export const oggetto = (r) => `Richiesta di attivazione del percorso di tutela per il rispetto dei tempi massimi di attesa${r.prestazione ? ` - ${r.prestazione}` : ''}`;
export const destinatario = (r) => ({ nome: r.ente ? `${r.ente.nome}, alla Direzione generale e all'Ufficio relazioni con il pubblico` : null, pec: r.ente?.pec || null });

export function lettera(r, val) {
  const d = val.documento || {};
  const a = destinatario(r);
  const proposta = r.proposta === 'data' ? `il CUP mi ha proposto come prima data disponibile il ${giorno(r.data_proposta, 'data proposta')}${r.ambito === 'lontano' ? ', in una struttura lontana dalla mia zona' : ''}` : r.proposta === 'prelista' ? 'il CUP non mi ha dato una data, inserendomi in una lista d\'attesa, e non sono stato richiamato nei tempi previsti' : 'il CUP non mi ha proposto alcuna data';
  return `<p class="destra">Spett.le ${a.nome ? esc(a.nome) : vuoto('Azienda sanitaria di residenza')}<br>PEC: ${a.pec ? esc(a.pec) : vuoto('indirizzo PEC')}</p>
    <p class="oggetto">Oggetto: ${esc(oggetto(r))}</p>
    <p>Il sottoscritto ${v(r.nome, 'nome e cognome')}, residente nel territorio di codesta Azienda, recapito ${v(r.recapito, 'PEC o email')}${r.telefono ? `, telefono ${esc(r.telefono)}` : ''},</p>
    <p>premesso di avere una prescrizione per ${v(r.prestazione, 'prestazione')}${r.ricetta_n ? ` (ricetta n. ${esc(r.ricetta_n)})` : ''}, primo accesso, con classe di priorità ${esc(CLASSI[r.classe] || r.classe)};</p>
    <p>che il ${giorno(r.data_contatto, 'data del primo contatto')} ho contattato il centro unico di prenotazione e ${proposta};</p>
    <p>che il tempo massimo previsto per la mia classe di priorità scade il ${giorno(d.termine)}, secondo il Piano nazionale di governo delle liste d'attesa 2026-2028 (DM Salute 26 giugno 2026);</p>
    <p>CHIEDE</p>
    <p>l'attivazione del percorso di tutela, con l'erogazione della prestazione entro il tempo massimo, anche in attività libero-professionale intramuraria, con prestazioni aggiuntive o presso strutture private accreditate, senza oneri a mio carico oltre all'eventuale quota di partecipazione alla spesa, come prevede l'art. 3, commi 10 e 10-bis, del decreto-legge 73/2024, convertito dalla legge 107/2024.</p>
    <p>Chiedo di essere contattato al recapito indicato con la data e il luogo dell'appuntamento. Allego la prescrizione e la prova della prenotazione.</p>
    <p>${v(r.comune_firma, 'luogo')}, ${vuoto('data')}</p><p class="destra">${v(r.nome, 'nome e cognome')}<br>${vuoto('firma')}</p>`;
}
