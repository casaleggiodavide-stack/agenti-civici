// Interfaccia di «La visita nei tempi». Tutto gira nel browser:
// i dati personali non lasciano il dispositivo.

import { $, $$, esc, copia, stampa, mailto, testoDa, vaiAllaDomanda } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { montaFoto } from '../src/comune/foto.js';
import { caricaEnti, cerca } from '../../chiedo-gli-atti/src/enti.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { valuta, VERIFICATO } from '../src/regole.js';
import { lettera, oggetto, destinatario } from '../src/documento.js';

const ESEMPI = {
  cardio: { accesso: 'primo', classe: 'B', prestazione: 'prima visita cardiologica', data_contatto: '2026-10-12', proposta: 'data', data_proposta: '2027-03-20', ambito: 'vicino', rifiutato: false, pagato: false, ente: 'asl bari' },
  eco: { accesso: 'primo', classe: 'D', tipo: 'esame', prestazione: 'ecografia dell\'addome completo', data_contatto: '2026-10-20', proposta: 'data', data_proposta: '2026-12-15', ambito: 'vicino', rifiutato: false, pagato: false, ente: 'asl lecce' },
  lista: { accesso: 'primo', classe: 'D', tipo: 'visita', prestazione: 'prima visita oculistica', data_contatto: '2026-10-05', proposta: 'prelista', rifiutato: false, pagato: false, ente: 'asl roma 1' },
  controllo: { accesso: 'successivo', prestazione: 'visita cardiologica di controllo' },
};

let indice = null;
const enti = async () => (indice ||= await caricaEnti());
const SANITARIE = ['L7', 'L8'];
const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'liste-attesa-v1', alCambio: disegna });

// ---------- L'ASL ----------

const box = document.createElement('div');
box.className = 'domanda cerca-ente';
box.id = 'd-ente';
box.innerHTML = `
  <label for="cerca-ente">Azienda sanitaria</label>
  <input type="text" id="cerca-ente" placeholder="es. ASL Bari, ASL Roma 1, ATS Milano, il nome della tua città" autocomplete="off" aria-controls="risultati-enti">
  <ul class="risultati-enti" id="risultati-enti" hidden></ul>
  <div id="ente-scelto"></div>`;
$('#s-asl h2').after(box);

let attesa;
$('#cerca-ente').addEventListener('focus', () => { enti().catch(() => {}); });
$('#cerca-ente').addEventListener('input', (e) => {
  clearTimeout(attesa);
  const q = e.target.value;
  attesa = setTimeout(async () => {
    const lista = $('#risultati-enti');
    if (q.trim().length < 2) { lista.hidden = true; return; }
    lista.hidden = false;
    lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco delle aziende sanitarie…</button></li>';
    try {
      const idx = await enti();
      let trovati = cerca(idx, q, 40).filter((t) => SANITARIE.includes(t.cat));
      if (!trovati.length) trovati = cerca(idx, `azienda sanitaria ${q}`, 40).filter((t) => SANITARIE.includes(t.cat));
      trovati = trovati.slice(0, 8);
      lista.innerHTML = trovati.length
        ? trovati.map((t, i) => `<li><button type="button" data-ente="${i}">${esc(t.nome)}<small>${esc(`${t.comune || ''} (${t.prov || ''})`)}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessuna azienda sanitaria trovata: prova con la sigla (ASL, ASP, ATS, USL) o con la città.</button></li>';
      $$('[data-ente]', lista).forEach((b) => b.addEventListener('click', () => {
        modulo.risposte.ente = trovati[Number(b.dataset.ente)];
        lista.hidden = true;
        $('#cerca-ente').value = '';
        modulo.aggiorna();
      }));
    } catch {
      lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco. Riprova tra poco.</button></li>';
    }
  }, 150);
});

function disegnaEnte(e) {
  $('#ente-scelto').innerHTML = e
    ? `<div class="ente-scelto"><b>${esc(e.nome)}</b><span>${esc(`${e.comune || ''} (${e.prov || ''})`)}</span><span>PEC: ${esc(e.pec)}</span><span><button type="button" class="link" id="togli-ente">Cambia azienda</button></span></div>`
    : '';
  $('#togli-ente')?.addEventListener('click', () => { delete modulo.risposte.ente; modulo.aggiorna(); $('#cerca-ente').focus(); });
}

// ---------- Esito ----------

const SEGNI = { si: ['c-si', '✓'], forse: ['c-att', '!'], dato: ['c-nd', '?'], no: ['c-no', '–'] };
const NOMI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;

function pannelloDocumento(r, v) {
  if (!v.documento) return '';
  const html = lettera(r, v);
  const d = destinatario(r);
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">Il documento</div>
    <h2 id="t-doc">La richiesta all'ASL, pronta da completare</h2>
    <p style="margin:0 0 10px">${d.pec ? `Mandala dalla tua PEC a <b>${esc(d.pec)}</b>` : 'Scegli la tua azienda sanitaria qui a sinistra per avere la PEC'}, con la ricetta e la prova della prenotazione. I campi gialli sono da completare.</p>
    <div class="foglio" id="foglio">${html}</div>
    <div class="azioni-doc">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      <a class="btn" href="${esc(mailto(d.pec || '', oggetto(r), testoDa(html)))}">Apri nel programma di posta</a>
      <span class="esito-copia" id="esito-copia" role="status"></span>
    </div>
  </section>`;
}

function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  disegnaEnte(r.ente);
  const v = valuta(r);
  const verificato = new Date(VERIFICATO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#esito').innerHTML = `
    ${v.urgente ? '<section class="pannello urgente"><p class="titolo">Se è urgente, non aspettare</p><p>Sintomi che peggiorano o classe U: chiama il tuo medico o la guardia medica, oppure il CUP per i percorsi urgenti. Nei casi gravi il <b>112</b> o il <b>118</b>.</p></section>' : ''}
    <section class="pannello verdetto" data-tono="${v.verdetto.tono}">
      <div class="occhiello">${r.accesso ? 'I tuoi tempi' : 'Inizia da qui'}</div>
      <p class="titolo">${esc(v.verdetto.titolo)}</p>
      <p>${esc(v.verdetto.testo)}</p>
    </section>
    ${v.voci.length ? `<section class="pannello" aria-labelledby="t-voci"><div class="occhiello">Il nostro controllo</div><h2 id="t-voci">Cosa abbiamo verificato</h2>
      <ul class="controlli">${v.voci.map((m) => { const [c, s] = SEGNI[m.esito] || SEGNI.dato; return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(m.titolo)}</b><small>${esc(m.spiegazione)}${m.dato && NOMI[m.dato] ? ` <button type="button" class="vai-a" data-vai="${m.dato}">Rispondi: ${esc(NOMI[m.dato])}</button>` : ''}</small></div></li>`; }).join('')}</ul></section>` : ''}
    ${v.scadenze.length ? `<section class="pannello" aria-labelledby="t-scad"><div class="occhiello">Calcolate dalle date che hai indicato</div><h2 id="t-scad">Le date</h2>
      <ul class="scadenze">${v.scadenze.map((s) => `<li class="${s.scaduta ? 'scaduta' : s.giorniMancanti <= 5 ? 'vicina' : ''}"><span class="quando">${esc(data(s.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}<small>${s.scaduta ? 'passata' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con La visita nei tempi: verifica sempre le date.` }, { conIcs: !incorporata() })}</span></li>`).join('')}</ul></section>` : ''}
    ${pannelloDocumento(r, v)}
    ${v.passi.length ? `<section class="pannello"><div class="occhiello">Come si procede</div><h2>I passi</h2><ol class="passi">${v.passi.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)}</li>`).join('')}</ol>${v.documento ? `<p class="azioni-doc"><a class="btn" href="${esc(altroStrumento('reclami-pa'))}">Apri Reclami alla PA</a></p>` : ''}</section>` : ''}
    <section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${v.fonti.map((f) => `<li>${fonte(f)}</li>`).join('')}</ul></section>`;
  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => vaiAllaDomanda(b.dataset.vai)));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  $('#copia')?.addEventListener('click', () => copia(testoDa($('#foglio').innerHTML), $('#esito-copia')));
  $('#stampa')?.addEventListener('click', () => stampa($('#foglio').innerHTML));
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', async () => {
  const { ente, ...es } = ESEMPI[b.dataset.esempio];
  const idx = ente ? await enti().catch(() => null) : null;
  modulo.imposta({ ...es, ente: idx ? cerca(idx, ente, 20).find((t) => SANITARIE.includes(t.cat)) : undefined }, { esempio: true });
}));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => modulo.azzera());
modulo.aggiorna();
montaFoto({
  contenitore: $('#foto'), strumento: 'La visita nei tempi', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'la ricetta del medico o il promemoria di prenotazione del CUP',
  note: 'Leggi solo la classe di priorità (U, B, D, P), la prestazione, il numero della ricetta (NRE), la data della prenotazione e la data dell\'appuntamento. Non trascrivere nome, codice fiscale, esenzioni o diagnosi.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
