// Interfaccia di «Reclami alla PA e difensore civico». Tutto gira nel browser:
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
  ritardo: { problema: 'ritardo', cosa_chiesto: 'Domanda di contributo per l\'affitto (bando comunale 2026)', data_domanda: '2026-06-03', impresa: false, ufficio: 'Servizi sociali', protocollo: '45210', passo: 'niente', ente: 'comune di lecce' },
  impresa: { problema: 'ritardo', cosa_chiesto: 'Domanda di autorizzazione per l\'occupazione di suolo pubblico per il dehors del mio bar', data_domanda: '2026-09-15', termine: 30, impresa: true, ufficio: 'SUAP', passo: 'niente', ente: 'comune di lecce' },
  sanita: { problema: 'sanita', cosa_chiesto: 'Mi è stata rifiutata la prenotazione di una visita cardiologica con impegnativa urgente (classe U), senza indicarmi un\'alternativa', data_fatto: '2026-10-20', ente: 'asl lecce' },
  digitale: { problema: 'digitale', cosa_chiesto: 'Il servizio online per il certificato di residenza non accetta l\'accesso con la CIE: dopo il login compare un errore', data_fatto: '2026-10-22', ente: 'comune di lecce' },
};

let indice = null;
const enti = async () => (indice ||= await caricaEnti());
const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'reclami-pa-v1', alCambio: disegna });

// ---------- L'ente ----------

const box = document.createElement('div');
box.className = 'domanda cerca-ente';
box.id = 'd-ente';
box.innerHTML = `
  <label for="cerca-ente">Ente</label>
  <input type="text" id="cerca-ente" placeholder="es. Comune di Bari, ASL Roma 1, INPS, Agenzia delle Entrate" autocomplete="off" aria-controls="risultati-enti">
  <ul class="risultati-enti" id="risultati-enti" hidden></ul>
  <div id="ente-scelto"></div>`;
$('#s-ente h2').after(box);

let attesa;
$('#cerca-ente').addEventListener('focus', () => { enti().catch(() => {}); });
$('#cerca-ente').addEventListener('input', (e) => {
  clearTimeout(attesa);
  const q = e.target.value;
  attesa = setTimeout(async () => {
    const lista = $('#risultati-enti');
    if (q.trim().length < 2) { lista.hidden = true; return; }
    lista.hidden = false;
    lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco degli enti…</button></li>';
    try {
      const trovati = cerca(await enti(), q, 8);
      lista.innerHTML = trovati.length
        ? trovati.map((t, i) => `<li><button type="button" data-ente="${i}">${esc(t.nome)}<small>${esc(`${t.comune || ''} (${t.prov || ''})`)}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessun ente trovato: prova con meno parole.</button></li>';
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
    ? `<div class="ente-scelto"><b>${esc(e.nome)}</b><span>${esc(`${e.comune || ''} (${e.prov || ''})`)}</span><span>PEC: ${esc(e.pec)}</span><span><button type="button" class="link" id="togli-ente">Cambia ente</button></span></div>`
    : '';
  $('#togli-ente')?.addEventListener('click', () => { delete modulo.risposte.ente; modulo.aggiorna(); $('#cerca-ente').focus(); });
}

// ---------- Esito ----------

const SEGNI = { si: ['c-si', '✓'], forse: ['c-att', '!'], dato: ['c-nd', '?'], no: ['c-no', '–'] };
const NOMI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;
const TITOLI_DOC = { reclamo: 'Il reclamo', sostitutivo: 'La richiesta al titolare del potere sostitutivo', difensore: 'L\'istanza al difensore civico', osservazioni: 'Le osservazioni al preavviso di rigetto' };

function pannelloDocumento(r, v) {
  if (!v.documento) return '';
  const html = lettera(r, v);
  const d = destinatario(r, v);
  const titolo = v.documento.variante === 'sollecito' ? 'Il sollecito' : TITOLI_DOC[v.documento.tipo];
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">Il documento</div>
    <h2 id="t-doc">${esc(titolo)}, pronta da completare</h2>
    <p style="margin:0 0 10px">Mandala dalla tua PEC${d.pec ? ` a <b>${esc(d.pec)}</b>` : ''}, allegando copia della domanda e delle ricevute. I campi gialli sono da completare.</p>
    <div class="foglio" id="foglio">${html}</div>
    <div class="azioni-doc">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      <a class="btn" href="${esc(mailto(d.pec || '', oggetto(r, v), testoDa(html)))}">Apri nel programma di posta</a>
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
    <section class="pannello verdetto" data-tono="${v.verdetto.tono}">
      <div class="occhiello">${r.problema ? 'Il passo giusto' : 'Inizia da qui'}</div>
      <p class="titolo">${esc(v.verdetto.titolo)}</p>
      <p>${esc(v.verdetto.testo)}</p>
      ${r.problema === 'accesso' ? `<p class="azioni-doc"><a class="btn btn-primario" href="${esc(altroStrumento('chiedo-gli-atti'))}">Apri Chiedo gli atti</a></p>` : ''}
    </section>
    ${v.voci.length ? `<section class="pannello" aria-labelledby="t-voci"><div class="occhiello">Il nostro controllo</div><h2 id="t-voci">Cosa abbiamo verificato</h2>
      <ul class="controlli">${v.voci.map((m) => { const [c, s] = SEGNI[m.esito] || SEGNI.dato; return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(m.titolo)}</b><small>${esc(m.spiegazione)}${m.dato && NOMI[m.dato] ? ` <button type="button" class="vai-a" data-vai="${m.dato}">Rispondi: ${esc(NOMI[m.dato])}</button>` : ''}</small></div></li>`; }).join('')}</ul></section>` : ''}
    ${v.scadenze.length ? `<section class="pannello" aria-labelledby="t-scad"><div class="occhiello">Calcolate dalle date che hai indicato</div><h2 id="t-scad">Le scadenze</h2>
      <ul class="scadenze">${v.scadenze.map((s) => `<li class="${s.scaduta ? 'scaduta' : s.giorniMancanti <= 5 ? 'vicina' : ''}"><span class="quando">${esc(data(s.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}<small>${s.scaduta ? 'passata' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con Reclami alla PA: verifica sempre le date.` }, { conIcs: !incorporata() })}</span></li>`).join('')}</ul></section>` : ''}
    ${pannelloDocumento(r, v)}
    ${v.passi.length ? `<section class="pannello"><div class="occhiello">Come si procede</div><h2>I passi</h2><ol class="passi">${v.passi.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)}${p.link ? ` <a href="${esc(p.link)}" target="_blank" rel="noopener">Dove</a>` : ''}</li>`).join('')}</ol></section>` : ''}
    ${v.fonti.length ? `<section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${v.fonti.map((f) => `<li>${fonte(f)}</li>`).join('')}</ul></section>` : ''}`;
  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => (b.dataset.vai === 'ente' ? $('#cerca-ente').focus() : vaiAllaDomanda(b.dataset.vai))));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  $('#copia')?.addEventListener('click', () => copia(testoDa($('#foglio').innerHTML), $('#esito-copia')));
  $('#stampa')?.addEventListener('click', () => stampa($('#foglio').innerHTML));
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', async () => {
  const { ente, ...es } = ESEMPI[b.dataset.esempio];
  const idx = await enti().catch(() => null);
  modulo.imposta({ ...es, ente: idx ? cerca(idx, ente, 1)[0] : undefined }, { esempio: true });
}));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => modulo.azzera());
modulo.aggiorna();
montaFoto({
  contenitore: $('#foto'), strumento: 'Reclami alla PA', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'la ricevuta della domanda, la lettera dell\'ente o il preavviso di rigetto',
  note: 'Leggi solo date, numero di protocollo, ufficio e oggetto della domanda. Non trascrivere dati personali.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
