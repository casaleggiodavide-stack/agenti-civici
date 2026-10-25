// Interfaccia di «Mi rimborsano?». Tutto gira nel browser.

import { $, $$, esc, copia, stampa, mailto, testoDa, vaiAllaDomanda } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, dentroClaude } from '../src/comune/calendario.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { valuta, VERIFICATO } from '../src/regole.js';
import { lettera, oggetto } from '../src/documento.js';
import { montaFoto } from '../src/comune/foto.js';

const ESEMPI = {
  volo: { caso: 'volo', volo_tipo: 'ritardo', data_volo: '2026-09-12', da: 'CTA', a: 'CDG', ritardo_ore: 4, causa_volo: 'guasto', compagnia: 'Compagnia Esempio', numero_volo: 'XX 1234', gia_reclamato: false },
  bolletta: { caso: 'bolletta', servizio: 'gas', domestico: true, problema_bolletta: 'vecchia', scadenza_bolletta: '2026-11-15', consumi_dal: '2023-06-01', importo_bolletta: 1240, fornitore: 'Venditore Esempio', gia_reclamato: false },
  telefono: { caso: 'telefono', disservizio: 'interruzione', data_inizio: '2026-10-01', risolto: true, data_fine: '2026-10-21', fibra: true, affari: false, operatore: 'Operatore Esempio', gia_reclamato: true, data_reclamo: '2026-10-02', risposta: 'no' },
  banca: { caso: 'banca', banca_tipo: 'non_autorizzata', data_addebito: '2026-10-20', importo_banca: 900, bloccato: false, codici_dati: false, banca: 'Banca Esempio', gia_reclamato: false },
};

const NOMI_DATI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'mi-rimborsano-v1', alCambio: disegna });

const SEGNI = { si: ['c-vizio', '✓'], forse: ['c-vizio', '?'], dato: ['c-nd', '?'], no: ['c-no', '–'] };

function pannelloVoci(v) {
  if (!v.voci.length) return '';
  return `<section class="pannello" aria-labelledby="t-voci">
    <div class="occhiello">Controllo delle regole</div>
    <h2 id="t-voci">Cosa abbiamo verificato</h2>
    <ul class="controlli">${v.voci.map((m) => {
      const [c, s] = SEGNI[m.esito];
      const pill = m.esito === 'forse' ? '<span class="pill p-forse">da verificare</span>' : m.esito === 'dato' ? '<span class="pill p-dato">serve un dato</span>' : '';
      return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(m.titolo)}</b> ${pill}<small>${esc(m.spiegazione)}${m.dato ? ` <button type="button" class="vai-a" data-vai="${m.dato}">Rispondi: ${esc(NOMI_DATI[m.dato] || m.dato)}</button>` : ''}</small></div></li>`;
    }).join('')}</ul>
  </section>`;
}

function pannelloScadenze(v) {
  if (!v.scadenze.length) return '';
  return `<section class="pannello" aria-labelledby="t-scad">
    <div class="occhiello">Calcolate dalle date che hai indicato</div>
    <h2 id="t-scad">Le scadenze</h2>
    <ul class="scadenze">${v.scadenze.map((s) => {
      const d = data(s.data);
      const cls = s.scaduta ? 'scaduta' : s.giorniMancanti <= 5 ? 'vicina' : '';
      const quando = s.scaduta ? 'passata' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`;
      const promemoria = s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con Mi rimborsano?: verifica sempre le date.` }, { conIcs: !dentroClaude() });
      return `<li class="${cls}"><span class="quando">${esc(d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}<small>${quando}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${promemoria}</span></li>`;
    }).join('')}</ul>
  </section>`;
}

function pannelloPassi(v) {
  if (!v.passi.length) return '';
  return `<section class="pannello"><div class="occhiello">Come si procede</div><h2>I passi, in ordine</h2>
    <ol class="passi">${v.passi.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)} <a href="${esc(p.link)}" target="_blank" rel="noopener">Dove</a></li>`).join('')}</ol></section>`;
}

function pannelloDocumento(r, v) {
  if (!v.documento) return '';
  const html = lettera(r, v);
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">Il documento</div>
    <h2 id="t-doc">La lettera, pronta da completare</h2>
    <p style="margin:0 0 10px">Mandala per PEC o raccomandata con ricevuta di ritorno, oppure con il modulo online dell'azienda conservando la ricevuta. I campi gialli sono da completare.</p>
    <div class="foglio" id="foglio">${html}</div>
    <div class="azioni-doc">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      <a class="btn" href="${esc(mailto('', oggetto(v.documento), testoDa(html)))}">Apri nel programma di posta</a>
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
      <div class="occhiello">${r.caso ? 'Il nostro controllo' : 'Inizia da qui'}</div>
      <p class="titolo">${esc(v.verdetto.titolo)}</p>
      <p>${esc(v.verdetto.testo)}</p>
      ${v.importo ? `<p style="margin-top:8px"><b>${esc(v.importo.testo)}</b></p>` : ''}
    </section>
    ${pannelloVoci(v)}
    ${pannelloScadenze(v)}
    ${pannelloDocumento(r, v)}
    ${pannelloPassi(v)}
    ${v.fonti.length ? `<section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${v.fonti.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a></li>`).join('')}</ul></section>` : ''}`;
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
  contenitore: $('#foto'), strumento: 'Mi rimborsano?', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'la carta d\'imbarco, il biglietto, il rapporto PIR del bagaglio, la bolletta, la fattura del telefono o l\'estratto conto',
  note: 'Il campo caso va sempre indicato (volo, bagaglio, treno, bolletta, telefono, banca). Gli aeroporti si indicano con il codice IATA. I ritardi non sono quasi mai scritti su questi documenti: non inventarli.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
