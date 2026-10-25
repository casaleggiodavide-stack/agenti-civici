// Interfaccia di «Si è rotto o ci ho ripensato». Tutto gira nel browser:
// i dati personali non lasciano il dispositivo.

import { $, $$, esc, copia, stampa, mailto, testoDa, vaiAllaDomanda } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { montaFoto } from '../src/comune/foto.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { valuta, VERIFICATO } from '../src/regole.js';
import { lettera, oggetto, destinatario } from '../src/documento.js';

const ESEMPI = {
  lavatrice: { caso: 'difetto', cosa_comprato: 'Lavatrice', venditore: 'professionista', dove: 'negozio', tipo: 'bene', data_contratto: '2025-03-08', data_consegna: '2025-03-10', categoria: 'lavatrice', data_difetto: '2026-10-20', descrizione: 'la centrifuga non parte e compare un codice di errore', rimedio: 'riparazione', gia_riparato: false },
  scarpe: { caso: 'ripensamento', cosa_comprato: 'Scarpe da corsa', venditore: 'professionista', dove: 'distanza', tipo: 'bene', data_contratto: '2026-10-18', data_consegna: '2026-10-20', informato: true, eccezione: 'nessuna', funzione: true },
  palestra: { caso: 'ripensamento', cosa_comprato: 'Abbonamento annuale a una palestra', venditore: 'professionista', dove: 'distanza', tipo: 'servizio', data_contratto: '2026-10-15', informato: 'non_so', eccezione: 'nessuna', funzione: false },
  rimborso: { caso: 'rimborso', cosa_comprato: 'Giacca', venditore: 'professionista', dove: 'distanza', tipo: 'bene', data_contratto: '2026-09-10', data_recesso: '2026-09-20', data_reso: '2026-09-21' },
};

const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'garanzia-v1', alCambio: disegna });

const SEGNI = { si: ['c-si', '✓'], forse: ['c-att', '!'], dato: ['c-nd', '?'], no: ['c-no', '–'] };
const NOMI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const TITOLI_DOC = { denuncia: 'La denuncia del difetto', riduzione: 'La richiesta di sconto o restituzione', fabbricante: 'La richiesta al fabbricante', recesso: 'La dichiarazione di recesso', diffida: 'La diffida al rimborso' };

function pannelloDocumento(r, v) {
  if (!v.documento) return '';
  const html = lettera(r, v);
  const a = destinatario(r, v);
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">Il documento</div>
    <h2 id="t-doc">${esc(TITOLI_DOC[v.documento.tipo])}, pronta da completare</h2>
    <p style="margin:0 0 10px">Mandala per email, PEC o raccomandata${a ? ` a <b>${esc(a)}</b>` : ''} e conserva la ricevuta. I campi gialli sono da completare.</p>
    <div class="foglio" id="foglio">${html}</div>
    <div class="azioni-doc">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      <a class="btn" href="${esc(mailto((r.venditore_nome || '').match(/[\w.+-]+@[\w.-]+/)?.[0] || '', oggetto(r, v), testoDa(html)))}">Apri nel programma di posta</a>
      <span class="esito-copia" id="esito-copia" role="status"></span>
    </div>
  </section>`;
}

function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  const v = valuta(r);
  const verificato = new Date(VERIFICATO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${v.verdetto.tono}">
      <div class="occhiello">${r.caso ? 'Il tuo diritto' : 'Inizia da qui'}</div>
      <p class="titolo">${esc(v.verdetto.titolo)}</p>
      <p>${esc(v.verdetto.testo)}</p>
    </section>
    ${v.voci.length ? `<section class="pannello" aria-labelledby="t-voci"><div class="occhiello">Il nostro controllo</div><h2 id="t-voci">Cosa abbiamo verificato</h2>
      <ul class="controlli">${v.voci.map((m) => { const [c, s] = SEGNI[m.esito] || SEGNI.dato; return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(m.titolo)}</b><small>${esc(m.spiegazione)}${m.dato && NOMI[m.dato] ? ` <button type="button" class="vai-a" data-vai="${m.dato}">Rispondi: ${esc(NOMI[m.dato])}</button>` : ''}</small></div></li>`; }).join('')}</ul></section>` : ''}
    ${v.scadenze.length ? `<section class="pannello" aria-labelledby="t-scad"><div class="occhiello">Calcolate dalle date che hai indicato</div><h2 id="t-scad">Le scadenze</h2>
      <ul class="scadenze">${v.scadenze.map((s) => `<li class="${s.scaduta ? 'scaduta' : s.giorniMancanti <= 5 ? 'vicina' : ''}"><span class="quando">${esc(data(s.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}<small>${s.scaduta ? 'passata' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con Si è rotto o ci ho ripensato: verifica sempre le date.` }, { conIcs: !incorporata() })}</span></li>`).join('')}</ul></section>` : ''}
    ${pannelloDocumento(r, v)}
    ${v.passi.length ? `<section class="pannello"><div class="occhiello">Come si procede</div><h2>I passi</h2><ol class="passi">${v.passi.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)}</li>`).join('')}</ol></section>` : ''}
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
  contenitore: $('#foto'), strumento: 'Si è rotto o ci ho ripensato', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'lo scontrino, la fattura o l\'email di conferma dell\'ordine',
  note: 'Leggi solo che cosa è stato comprato, il venditore, le date di acquisto e di consegna e il numero d\'ordine. Non trascrivere dati personali né dati di pagamento.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
