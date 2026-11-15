// Interfaccia di «Disdici un abbonamento». Tutto gira nel browser:
// nome, indirizzo e codici del contratto non lasciano il dispositivo.

import { $, $$, esc, copia, stampa, mailto, testoDa, vaiAllaDomanda } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data, iso, aggiungiGiorni, oggi } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { montaFoto } from '../src/comune/foto.js';
import { SEZIONI, DOMANDE, contratto } from '../src/domande.js';
import { valutaDisdetta, VERIFICATO } from '../src/regole.js';
import { lettera, oggetto, destinatario } from '../src/documento.js';

const tra = (n) => iso(aggiungiGiorni(oggi(), n));
const ESEMPI = {
  fibra: { tipo: 'telefonia', fornitore: 'Operatore della fibra', motivo_tlc: 'chiudo', data_firma: '2024-03-12', durata_mesi: 24, rinnovo: true, canale: 'negozio', promo: true, rate: true, rate_scelta: 'rate' },
  palestra: { tipo: 'servizi', fornitore: 'Palestra', motivo_altro: 'chiudo', data_firma: '2025-09-01', durata_mesi: 12, rinnovo: true, data_scadenza: '2027-09-01', preavviso_giorni: 60, avviso_rinnovo: false, canale: 'negozio' },
  streaming: { tipo: 'digitale', fornitore: 'Servizio di streaming', motivo_altro: 'chiudo', data_firma: tra(-6), durata_mesi: 12, rinnovo: true, canale: 'online', informato: true },
  polizza: { tipo: 'polizza', fornitore: 'Compagnia di assicurazione', motivo_altro: 'chiudo', data_firma: '2019-03-01', durata_mesi: 120, rinnovo: false },
  luce: { tipo: 'energia', materia: 'luce', prezzo_fisso: true, motivo_energia: 'cambio', canale: 'telefono', informato: true, fornitore: 'Venditore di luce' },
};

const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'disdette-v1', alCambio: disegna });

const SEGNI = { si: ['c-si', '✓'], forse: ['c-att', '!'], dato: ['c-nd', '?'], no: ['c-no', '–'] };
const NOMI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;
const breve = (s) => data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const TITOLI_DOC = { ripensamento: 'Il recesso nei giorni di ripensamento', recesso: 'La lettera di recesso', disdetta: 'La lettera di disdetta', contestazione: 'La contestazione' };

const elenco = (voci, classe, segno) => voci.map((x) => `<li class="${classe}"><span class="segno" aria-hidden="true">${segno}</span><div><b>${esc(x.titolo)}</b><small>${esc(x.spiegazione)}</small></div></li>`).join('');

function pannelloCosti(v) {
  if (!v.costi.length) return '';
  const gruppi = [
    [false, 'Non possono chiederti', 'c-si', '✓'],
    ['forse', 'Solo a certe condizioni', 'c-att', '!'],
    [true, 'Possono chiederti', 'c-nd', '€'],
  ].map(([puo, titolo, classe, segno]) => {
    const voci = v.costi.filter((x) => x.puo === puo);
    return voci.length ? `<h3 class="sottotitolo">${titolo}</h3><ul class="controlli">${elenco(voci, classe, segno)}</ul>` : '';
  }).join('');
  return `<section class="pannello" aria-labelledby="t-costi"><div class="occhiello">Penali, costi, rate, sconti</div><h2 id="t-costi">Cosa possono chiederti e cosa no</h2>${gruppi}</section>`;
}

function pannelloDocumento(r, v) {
  if (!v.documento) return '';
  const html = lettera(r, v);
  const d = destinatario(r, v);
  const email = (d.recapito || '').match(/[\w.+-]+@[\w.-]+/)?.[0] || '';
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">Il documento</div>
    <h2 id="t-doc">${esc(TITOLI_DOC[v.documento.tipo] || 'La lettera')}, pronta da firmare</h2>
    <p style="margin:0 0 10px">Mandala con PEC o raccomandata con ricevuta di ritorno${d.nome ? ` a <b>${esc(d.nome)}</b>` : ''}, oppure dal modulo del fornitore, e conserva la ricevuta. I campi gialli sono da completare.</p>
    <div class="foglio" id="foglio">${html}</div>
    <div class="azioni-doc">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      <a class="btn" href="${esc(mailto(email, oggetto(r, v), testoDa(html)))}">Apri nel programma di posta</a>
      <span class="esito-copia" id="esito-copia" role="status"></span>
    </div>
  </section>`;
}

function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  const c = contratto(r);
  const v = valutaDisdetta(c);
  const verificato = new Date(VERIFICATO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const sintesi = [
    v.effetto ? `<li><b>Quando ha effetto</b> ${v.effetto.data ? esc(breve(v.effetto.data)) + '. ' : ''}${esc(v.effetto.testo)}</li>` : '',
    v.preavviso ? `<li><b>Preavviso</b> ${esc(v.preavviso.testo)}</li>` : '',
  ].join('');
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${v.verdetto.tono}">
      <div class="occhiello">${r.tipo ? esc(v.etichetta) : 'Inizia da qui'}</div>
      <p class="titolo">${esc(v.verdetto.titolo)}</p>
      <p>${esc(v.verdetto.testo)}</p>
      ${sintesi ? `<ul class="sintesi">${sintesi}</ul>` : ''}
    </section>
    ${v.voci.length ? `<section class="pannello" aria-labelledby="t-voci"><div class="occhiello">Il nostro controllo</div><h2 id="t-voci">Cosa abbiamo verificato</h2>
      <ul class="controlli">${v.voci.map((m) => { const [c, s] = SEGNI[m.esito] || SEGNI.dato; return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(m.titolo)}</b><small>${esc(m.spiegazione)}${m.dato && NOMI[m.dato] ? ` <button type="button" class="vai-a" data-vai="${m.dato}">Rispondi: ${esc(NOMI[m.dato])}</button>` : ''}</small></div></li>`; }).join('')}</ul></section>` : ''}
    ${pannelloCosti(v)}
    ${v.scadenze.length ? `<section class="pannello" aria-labelledby="t-scad"><div class="occhiello">Calcolate dalle date che hai indicato</div><h2 id="t-scad">Entro quando agire</h2>
      <ul class="scadenze">${v.scadenze.map((s) => `<li class="${s.scaduta ? 'scaduta' : s.giorniMancanti <= 5 ? 'vicina' : ''}"><span class="quando">${esc(data(s.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}<small>${s.scaduta ? 'passata' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con Disdici un abbonamento: verifica sempre le date sul contratto.` }, { conIcs: !incorporata() })}</span></li>`).join('')}</ul></section>` : ''}
    ${v.come.length ? `<section class="pannello"><div class="occhiello">Come mandarla</div><h2>Come disdire</h2><ol class="passi">${v.come.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)}</li>`).join('')}</ol></section>` : ''}
    ${pannelloDocumento(c, v)}
    ${v.cerca.length ? `<section class="pannello"><div class="occhiello">Dipende dal contratto</div><h2>Cosa cercare nel contratto</h2><ul class="passi">${v.cerca.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
    ${v.controversie.length ? `<section class="pannello"><div class="occhiello">Se il fornitore non collabora</div><h2>Reclamo e conciliazione</h2><ol class="passi">${v.controversie.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)}${p.link ? ` <a href="${esc(p.link)}" target="_blank" rel="noopener">Dove</a>` : ''}</li>`).join('')}</ol></section>` : ''}
    ${v.collegamenti.length ? `<section class="pannello"><div class="occhiello">Altri strumenti</div><ul class="passi">${v.collegamenti.map((l) => `<li><a href="${esc(altroStrumento(l.strumento))}"><b>${esc(l.titolo)}</b></a>. ${esc(l.testo)}</li>`).join('')}</ul></section>` : ''}
    ${v.fonti.length ? `<section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${v.fonti.map((f) => `<li>${fonte(f)}</li>`).join('')}</ul></section>` : ''}`;
  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => vaiAllaDomanda(b.dataset.vai)));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  $('#copia')?.addEventListener('click', () => copia(testoDa($('#foglio').innerHTML), $('#esito-copia')));
  $('#stampa')?.addEventListener('click', () => stampa($('#foglio').innerHTML));
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => modulo.imposta(ESEMPI[b.dataset.esempio], { esempio: true })));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => modulo.azzera());
modulo.aggiorna();
montaFoto({
  contenitore: $('#foto'), strumento: 'Disdici un abbonamento', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'il contratto, la sintesi contrattuale, la conferma d\'ordine o il frontespizio della polizza',
  note: 'Leggi solo tipo di contratto, fornitore, data di firma, durata, rinnovo automatico, scadenza, giorni di preavviso per la disdetta, promozioni e rate. Non trascrivere nome, indirizzo, codice fiscale né dati di pagamento.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
