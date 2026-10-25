// I documenti di «Segnalazioni urbane indipendenti»: la segnalazione formale e il
// sollecito. I campi mancanti restano evidenziati, da completare.

import { esc } from './comune/interfaccia.js';
import { data, scritta } from './comune/date.js';

const vuoto = (t) => `<span class="campo-vuoto">${esc(t)}</span>`;
const v = (x, t) => (x === undefined || x === null || x === '' ? vuoto(t) : esc(String(x)));
const giorno = (s, t) => (s ? esc(data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })) : vuoto(t));
const nomeCat = (c) => c.nome.replace(/\s*\(categoria aggiuntiva[^)]*\)/, '').toLowerCase();

export function oggetto(r, val) {
  const cosa = val.categoria ? nomeCat(val.categoria) : 'problema nello spazio pubblico';
  const dove = r.luogo || r.ente?.comune || '';
  return val.documento?.tipo === 'sollecito'
    ? `Sollecito: segnalazione di ${cosa}${dove ? ` in ${dove}` : ''} del ${r.data_invio ? scritta(data(r.data_invio)) : '…'}`
    : `Segnalazione di ${cosa}${dove ? ` in ${dove}` : ''}: richiesta di intervento`;
}

function intestazione(val) {
  const dest = val.destinatari.filter((d) => d.ruolo === 'principale');
  const copia = val.destinatari.filter((d) => d.ruolo === 'copia');
  const riga = (d) => `${esc(d.nome)}${d.pec ? `<br>PEC: ${esc(d.pec)}` : `<br>PEC: ${vuoto('indirizzo PEC')}`}`;
  return `<p class="destra">Spett.le ${dest.map(riga).join('<br><br>')}${copia.length ? `<br><br>e, per conoscenza:<br>${copia.map(riga).join('<br>')}` : ''}</p>`;
}

function dove(r) {
  const parti = [r.luogo ? esc(r.luogo) : null, r.ente?.comune ? `nel Comune di ${esc(r.ente.comune)}` : null, r.sigla_km ? `(${esc(r.sigla_km)})` : null].filter(Boolean);
  const punto = parti.length ? parti.join(' ') : vuoto('indirizzo o punto preciso');
  const [la, lo] = String(r.coordinate || '').split(',').map((x) => x.trim());
  const coord = la && lo ? `, coordinate ${esc(la)}, ${esc(lo)} (mappa: https://www.openstreetmap.org/?mlat=${encodeURIComponent(la)}&amp;mlon=${encodeURIComponent(lo)}#map=19/${encodeURIComponent(la)}/${encodeURIComponent(lo)})` : '';
  return punto + coord;
}

export function segnalazione(r, val) {
  const c = val.categoria;
  const norme = (val.norme || []).filter((n) => !/Codice civile|Codice penale/i.test(n.titolo)).slice(0, 2).map((n) => esc(n.titolo)).join('; ');
  const chiedo = (val.cosaChiedere || []).filter((x) => !/protocollo/i.test(x));
  return `${intestazione(val)}
    <p class="oggetto">Oggetto: ${esc(oggetto(r, val))}</p>
    <p>Il sottoscritto ${v(r.nome, 'nome e cognome')}, recapito ${v(r.recapito, 'PEC o email')}${r.telefono ? `, telefono ${esc(r.telefono)}` : ''}, segnala quanto segue.</p>
    <p>In ${dove(r)} è presente ${c ? esc(nomeCat(c)) : vuoto('il problema')}${r.dal ? `, almeno dal ${giorno(r.dal)}` : ''}. ${r.descrizione ? esc(r.descrizione) : vuoto('descrizione dei fatti: cosa, quanto è grande, da quando, per chi è pericoloso')}</p>
    ${r.pericolo === true ? '<p>La situazione costituisce un pericolo immediato per persone e veicoli ed è stata segnalata anche al numero di emergenza 112.</p>' : ''}
    ${r.foto ? `<p>Allego ${esc(String(r.foto))} ${Number(r.foto) === 1 ? 'fotografia' : 'fotografie'} del luogo.</p>` : ''}
    ${norme ? `<p>L'intervento rientra nei compiti dell'ente in indirizzo (${norme}).</p>` : ''}
    <p>Chiedo pertanto:</p>
    <ol>${chiedo.map((x) => `<li>${esc(x.charAt(0).toUpperCase() + x.slice(1))};</li>`).join('')}
      <li>il rilascio di una ricevuta con il numero di protocollo, ai sensi dell'art. 18-bis della legge 241/1990, e, se l'ente in indirizzo non fosse competente, l'inoltro della presente all'ente competente con comunicazione al sottoscritto.</li>
    </ol>
    <p>La presente vale anche a documentare che l'ente è stato informato della situazione alla data di invio.</p>
    <p>${v(r.comune_firma, 'luogo')}, ${vuoto('data')}</p>
    <p class="destra">${v(r.nome, 'nome e cognome')}<br>${vuoto('firma')}</p>`;
}

export function sollecito(r, val) {
  return `${intestazione(val)}
    <p class="oggetto">Oggetto: ${esc(oggetto(r, val))}</p>
    <p>Il sottoscritto ${v(r.nome, 'nome e cognome')}, recapito ${v(r.recapito, 'PEC o email')}, il ${giorno(r.data_invio, 'data di invio')} ha inviato una segnalazione${r.protocollo ? `, protocollo n. ${esc(r.protocollo)},` : ''} relativa a ${val.categoria ? esc(nomeCat(val.categoria)) : 'un problema'} in ${dove(r)}.</p>
    <p>${r.risposta === 'presa' ? 'Pur avendo ricevuto una risposta, a oggi non risulta alcun intervento.' : 'A oggi non ho ricevuto risposta né risulta alcun intervento.'} Il problema è ancora presente.</p>
    <p>Sollecito quindi l'intervento richiesto e chiedo di conoscere il nome del responsabile del procedimento, gli interventi programmati e i tempi previsti.</p>
    <p>In mancanza di riscontro mi riservo di chiedere l'accesso agli atti relativi e di rivolgermi al difensore civico competente.</p>
    <p>${v(r.comune_firma, 'luogo')}, ${vuoto('data')}</p>
    <p class="destra">${v(r.nome, 'nome e cognome')}<br>${vuoto('firma')}</p>`;
}

export const documento = (r, val) => (val.documento?.tipo === 'sollecito' ? sollecito(r, val) : segnalazione(r, val));
