// Le due lettere di «Alberi per il futuro»: al Comune per l'area e il permesso, al vivaio
// pubblico per le piantine. HTML semplice, che diventa testo da copiare in una PEC.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vuoto = (s, segnaposto) => (String(s || '').trim() ? esc(String(s).trim()) : `<span class="da-completare">[${esc(segnaposto)}]</span>`);
const giorno = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
const comuneDi = (d) => d.ente?.nome || 'Comune di [nome del Comune]';

export const oggettoComune = (d) => `Proposta di piantumazione di alberi in area pubblica - richiesta di autorizzazione${d.ente?.nome ? ` - ${d.ente.nome}` : ''}`;
export const oggettoVivaio = (d) => `Richiesta di piantine forestali autoctone per una piantumazione in area pubblica${d.ente?.comune ? ` a ${d.ente.comune}` : ''}`;

function firma(d, oggi) {
  return `<p>${d.ente?.comune ? `${esc(d.ente.comune)}, ` : ''}${giorno(oggi)}</p>
<p>${vuoto(d.referente, 'nome e cognome')}<br>${d.gruppo ? `${esc(d.gruppo)}<br>` : ''}${vuoto(d.contatto, 'telefono o email')}</p>`;
}

export function letteraComune(d, { oggi }) {
  const quanti = Number(d.quanti) > 0 ? `circa ${Number(d.quanti)} alberi` : 'alcuni alberi';
  return `<p><b>Al ${esc(comuneDi(d))}</b><br>Ufficio Verde pubblico / Ambiente${d.ente?.pec ? `<br>PEC: ${esc(d.ente.pec)}` : ''}</p>
<p><b>Oggetto:</b> ${esc(oggettoComune(d))}</p>
<p>${vuoto(d.referente, 'nome e cognome')}${d.gruppo ? `, per ${esc(d.gruppo)},` : ''} propone di mettere a dimora ${quanti} di specie autoctone in un'area pubblica del Comune, in occasione della Giornata nazionale degli alberi (21 novembre, legge 10/2013) o comunque nella stagione di impianto.</p>
<p><b>Area proposta:</b> ${d.area ? esc(d.area) : 'chiediamo al Comune di indicarci un\'area adatta tra quelle destinate al verde pubblico'}.<br>
<b>Data proposta:</b> ${d.data ? giorno(d.data) : 'da concordare con l\'ufficio'}.<br>
<b>Piante:</b> giovani alberi di specie del posto, scelte d'intesa con l'ufficio, chieste al vivaio forestale regionale (la legge 113/1992, art. 2, prevede che la Regione fornisca le piante ai Comuni).</p>
<p>Il gruppo si impegna a mettere a dimora le piante insieme ai cittadini che vorranno partecipare e a curarle per almeno tre anni: annaffiature estive, pulizia dalle erbe, controllo dei tutori e sostituzione degli alberi che non attecchiscono.</p>
<p>Chiediamo quindi:</p>
<ol>
<li>l'autorizzazione a piantare nell'area indicata, o l'indicazione di un'area adatta, con le eventuali prescrizioni (servizi sotterranei, distanze, specie);</li>
<li>se il Comune ha un regolamento per la collaborazione tra cittadini e amministrazione per la cura dei beni comuni, di stipulare un patto di collaborazione, indicando anche le coperture assicurative;</li>
<li>il sostegno del Comune nella richiesta delle piantine al vivaio regionale, se il vivaio le assegna solo agli enti pubblici;</li>
<li>il nome di un referente dell'ufficio con cui concordare i dettagli.</li>
</ol>
<p>Restiamo a disposizione per un sopralluogo.</p>
${firma(d, oggi)}`;
}

export function letteraVivaio(d, { oggi, vivaio }) {
  const quanti = Number(d.quanti) > 0 ? `${Number(d.quanti)} piantine` : 'alcune piantine';
  const nome = vivaio && !/^Nessun/.test(vivaio.nome) ? vivaio.nome : 'Servizio foreste della Regione';
  return `<p><b>Spett.le ${esc(nome)}</b>${vivaio?.email ? `<br>${esc(vivaio.email)}` : ''}</p>
<p><b>Oggetto:</b> ${esc(oggettoVivaio(d))}</p>
<p>${vuoto(d.referente, 'nome e cognome')}${d.gruppo ? `, per ${esc(d.gruppo)},` : ''} chiede l'assegnazione di ${quanti} di specie forestali autoctone per una piantumazione in area pubblica nel ${esc(comuneDi(d))}${d.area ? `, ${esc(d.area)}` : ''}, in occasione della Giornata nazionale degli alberi o comunque nella stagione di impianto.</p>
<p>L'area è pubblica e la piantumazione è autorizzata, o in corso di autorizzazione, dal Comune. L'iniziativa è senza scopo di lucro, aperta ai cittadini e non riceve contributi pubblici per l'acquisto delle piante. Le specie le lasciamo scegliere a voi in base al luogo; il ritiro e il trasporto sono a nostra cura${d.data ? `, con piantumazione prevista il ${giorno(d.data)}` : ''}.</p>
<p>Ci impegniamo a curare le piante per almeno tre anni. Se le piantine possono essere assegnate solo a un ente, vi chiediamo di indicarci la procedura: la domanda la farà il Comune o una scuola che partecipa.</p>
${firma(d, oggi)}`;
}
