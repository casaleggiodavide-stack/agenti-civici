// Interfaccia di «Chiedo gli atti». Tutto gira nel browser.

import { $, $$, esc, copia, stampa, mailto, testoDa, vaiAllaDomanda, archivio } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, dentroClaude } from '../src/comune/calendario.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { valuta } from '../src/regole.js';
import { richiesta, riesame, ricorso, sostitutivo, OGGETTI } from '../src/documenti.js';
import { caricaEnti, cerca } from '../src/enti.js';
import { montaFoto } from '../src/comune/foto.js';

// Enti reali dall'elenco IndicePA, usati negli esempi.
const ENTI = {
  bologna: { nome: 'Comune di Bologna', cat: 'L6', categoria: 'Comuni e loro Consorzi e Associazioni', comune: 'Bologna', prov: 'BO', pec: 'ProtocolloGenerale@pec.comune.bologna.it', sito: 'www.comune.bologna.it' },
  napoli: { nome: 'Comune di Napoli', cat: 'L6', categoria: 'Comuni e loro Consorzi e Associazioni', comune: 'Napoli', prov: 'NA', pec: 'protocollo@pec.comune.napoli.it', sito: 'www.comune.napoli.it' },
  palermo: { nome: 'Comune di Palermo', cat: 'L6', categoria: 'Comuni e loro Consorzi e Associazioni', comune: 'Palermo', prov: 'PA', pec: 'protocollo@cert.comune.palermo.it', sito: 'www.comune.palermo.it' },
  torino: { nome: 'Comune di Torino', cat: 'L6', categoria: 'Comuni e loro Consorzi e Associazioni', comune: 'Torino', prov: 'TO', pec: 'protocollogenerale@cert.comune.torino.it', sito: 'www.comune.torino.it' },
};
const ESEMPI = {
  consulenze: {
    cosa: 'Chiedo l\'elenco degli incarichi di consulenza e collaborazione affidati dal Comune, con oggetto, importo, affidatario e modalità di affidamento.', periodo: 'dal 1° gennaio 2025 a oggi',
    da_pubblicare: 'no', riguarda_te: false, dati_personali: false, ambiente: false, formato: 'aperto', ente: ENTI.bologna, canale: 'pec', luogo: 'Bologna',
  },
  mense: {
    cosa: 'Chiedo copia dei verbali delle ispezioni igienico-sanitarie svolte nelle mense delle scuole comunali e delle eventuali contestazioni al gestore del servizio.', periodo: 'anno scolastico 2025/2026',
    da_pubblicare: 'no', riguarda_te: false, dati_personali: true, ambiente: false, formato: 'pdf', ente: ENTI.napoli, canale: 'email', luogo: 'Napoli',
  },
  silenzio: {
    cosa: 'Chiedo i dati sulle rilevazioni della qualità dell\'aria delle centraline comunali e i provvedimenti di limitazione del traffico adottati.', periodo: '2025 e 2026',
    da_pubblicare: 'no', riguarda_te: false, dati_personali: false, ambiente: true, formato: 'aperto', ente: ENTI.palermo, canale: 'pec', luogo: 'Palermo',
    data_invio: '2026-08-20', controinteressati: false, risposta: 'nessuna',
  },
  pratica: {
    cosa: 'Chiedo di prendere visione e copia della pratica edilizia relativa ai lavori di sopraelevazione dell\'edificio confinante con la mia abitazione, compresi progetto, titolo edilizio e relazioni tecniche.', periodo: 'pratica presentata nel 2026',
    da_pubblicare: 'no', riguarda_te: true, dati_personali: true, ambiente: false, formato: 'pdf', ente: ENTI.torino, canale: 'email', luogo: 'Torino',
    interesse: 'Sono proprietario dell\'appartamento confinante: i lavori riducono luce e distanze della mia abitazione e devo verificarne la conformità per tutelare i miei diritti.',
  },
};

const NOMI_DATI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
const elenco = archivio('chiedo-gli-atti-richieste-v1');
let documentoAttivo = null;

const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'chiedo-gli-atti-v1', alCambio: disegna });

// ---------- Ricerca dell'ente ----------

const box = document.createElement('div');
box.className = 'domanda cerca-ente';
box.id = 'd-ente';
box.innerHTML = `
  <label for="cerca-ente">Ente a cui chiedere</label>
  <input type="text" id="cerca-ente" placeholder="es. Comune di Lecce, ASL Roma 1, Ministero della Salute" autocomplete="off" aria-controls="risultati-enti">
  <ul class="risultati-enti" id="risultati-enti" hidden></ul>
  <div id="ente-scelto"></div>`;
$('#s-ente h2').after(box);

let attesa;
$('#cerca-ente').addEventListener('focus', () => { caricaEnti().catch(() => {}); });
$('#cerca-ente').addEventListener('input', (e) => {
  clearTimeout(attesa);
  const q = e.target.value;
  attesa = setTimeout(async () => {
    const lista = $('#risultati-enti');
    if (q.trim().length < 3) { lista.hidden = true; return; }
    lista.hidden = false;
    lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco degli enti…</button></li>';
    try {
      const indice = await caricaEnti();
      const trovati = cerca(indice, q, 8);
      lista.innerHTML = trovati.length
        ? trovati.map((t, i) => `<li><button type="button" data-ente="${i}">${esc(t.nome)}<small>${esc([t.comune && `${t.comune} (${t.prov})`, t.categoria].filter(Boolean).join(' · '))}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessun ente trovato: prova con meno parole.</button></li>';
      $$('[data-ente]', lista).forEach((b) => b.addEventListener('click', () => {
        modulo.risposte.ente = trovati[Number(b.dataset.ente)];
        lista.hidden = true;
        $('#cerca-ente').value = '';
        modulo.aggiorna();
      }));
    } catch {
      lista.innerHTML = '<li><button type="button" disabled>Non riesco a caricare l\'elenco degli enti. Riprova tra poco.</button></li>';
    }
  }, 150);
});

function disegnaEnte(e) {
  $('#ente-scelto').innerHTML = e
    ? `<div class="ente-scelto"><b>${esc(e.nome)}</b><span>${esc([e.comune && `${e.comune} (${e.prov})`, e.categoria].filter(Boolean).join(' · '))}</span><span>PEC: ${esc(e.pec)}</span>${e.sito ? `<span>Sito: <a href="https://${esc(e.sito)}" target="_blank" rel="noopener">${esc(e.sito)}</a></span>` : ''}<span><button type="button" class="link" id="togli-ente">Cambia ente</button></span></div>`
    : '';
  $('#togli-ente')?.addEventListener('click', () => { delete modulo.risposte.ente; modulo.aggiorna(); $('#cerca-ente').focus(); });
}

// ---------- Esito ----------

function pannelloControlli(v) {
  const segni = { ok: ['c-si', '✓'], attenzione: ['c-att', '!'], dato: ['c-nd', '?'] };
  return `<section class="pannello" aria-labelledby="t-contr">
    <div class="occhiello">${esc(v.tipo.norma)}</div>
    <h2 id="t-contr">${esc(v.tipo.nome)}</h2>
    <p>${esc(v.tipo.perche)}</p>
    ${v.tipo.alternativa ? '<p>Se questa strada non funziona, puoi provare l\'altra: le due richieste non si escludono.</p>' : ''}
    <ul class="controlli">${v.controlli.map((c) => { const [cl, s] = segni[c.livello]; return `<li class="${cl}"><span class="segno" aria-hidden="true">${s}</span><div>${esc(c.testo)}${c.dato ? ` <button type="button" class="vai-a" data-vai="${c.dato}">Rispondi: ${esc(NOMI_DATI[c.dato])}</button>` : ''}</div></li>`; }).join('')}</ul>
  </section>`;
}

function pannelloScadenze(v) {
  if (!v.scadenze.length) return '';
  return `<section class="pannello" aria-labelledby="t-scad">
    <div class="occhiello">Calcolate dalla data di invio</div>
    <h2 id="t-scad">Le scadenze</h2>
    <ul class="scadenze">${v.scadenze.map((s) => {
      if (!s.data) return `<li><span class="quando">—</span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span></span></li>`;
      const cls = s.scaduta ? 'scaduta' : s.giorniMancanti <= 5 ? 'vicina' : '';
      const quando = s.scaduta ? 'passata' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`;
      const promemoria = s.scaduta ? '' : pulsantiCalendario({
        titolo: `${s.titolo}${v.ente ? ': ' + v.ente.nome : ''}`,
        data: s.data,
        descrizione: `${s.testo}${v.ente?.pec ? ` PEC dell'ente: ${v.ente.pec}.` : ''} Promemoria creato con Chiedo gli atti.`,
      }, { conIcs: !dentroClaude() });
      return `<li class="${cls}"><span class="quando">${esc(data(s.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' }))}<small>${quando}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${promemoria}</span></li>`;
    }).join('')}</ul>
  </section>`;
}

function documentiDisponibili(v) {
  const d = [['richiesta', 'Richiesta']];
  if (v.passi.includes('riesame') || ['tar', 'attesa_riesame'].includes(v.fase.id)) d.push(['riesame', 'Riesame']);
  if (v.passi.includes('difensore') || v.passi.includes('ricorso')) d.push(['ricorso', v.tipo.id === 'documentale' && v.ente?.statale ? 'Ricorso alla Commissione' : 'Ricorso al difensore civico']);
  if (v.passi.includes('sostitutivo')) d.push(['sostitutivo', 'Potere sostitutivo']);
  return d;
}

function pannelloDocumento(r, v) {
  if (!r.cosa && !r.ente) return '';
  const disp = documentiDisponibili(v);
  const scelta = disp.some(([id]) => id === documentoAttivo) ? documentoAttivo : disp[disp.length - 1][0];
  const html = { richiesta, riesame, ricorso, sostitutivo }[scelta](r, v);
  const oggetto = OGGETTI[scelta](v);
  const pec = scelta === 'ricorso' ? null : v.ente?.pec;
  const passi = scelta === 'richiesta' ? v.invio.passi : [
    pec ? `Invialo dalla tua PEC o email all'indirizzo dell'ente, <b>${esc(pec)}</b>, indicando nell'oggetto «${esc(oggetto)}».` : 'Invialo per PEC o raccomandata, e mandane copia all\'ente.',
    'Allega la richiesta originale, l\'eventuale risposta e, se usi l\'email ordinaria, un documento d\'identità.',
  ];
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">Il documento</div>
    <h2 id="t-doc">Pronto da completare e inviare</h2>
    ${disp.length > 1 ? `<div class="si-no" role="tablist" aria-label="Documento" style="margin:8px 0 14px">${disp.map(([id, t]) => `<label><input type="radio" name="doc" value="${id}" ${id === scelta ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div>` : ''}
    <div class="foglio" id="foglio">${html}</div>
    <div class="azioni-doc">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      ${pec ? `<a class="btn" href="${esc(mailto(pec, oggetto, testoDa(html)))}">Apri nel programma di posta</a>` : ''}
      <span class="esito-copia" id="esito-copia" role="status"></span>
    </div>
    <h2 style="margin-top:18px;font-size:var(--s1)">Come inviarlo</h2>
    <ol class="passi">${passi.map((p) => `<li>${p}</li>`).join('')}</ol>
    ${v.ente?.sito && scelta === 'richiesta' ? `<p>Prima di inviare, controlla la sezione «Amministrazione trasparente» sul <a href="https://${esc(v.ente.sito)}" target="_blank" rel="noopener">sito dell'ente</a>: i documenti potrebbero essere già pubblicati, e spesso c'è un modulo online o un indirizzo dedicato all'accesso civico.</p>` : ''}
  </section>`;
}

function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  disegnaEnte(r.ente);
  const v = valuta(r);
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${v.fase.tono}">
      <div class="occhiello">${v.ente ? esc(v.ente.nome) : 'Rispondi a quello che sai'}</div>
      <p class="titolo">${esc(v.fase.titolo)}</p>
      <p>${esc(v.fase.testo)}</p>
    </section>
    ${pannelloControlli(v)}
    ${pannelloScadenze(v)}
    ${pannelloDocumento(r, v)}
    <section class="pannello"><div class="occhiello">Fonti, verificate l'11 ottobre 2026</div><ul class="fonti">${v.fonti.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a></li>`).join('')}</ul></section>`;
  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => vaiAllaDomanda(b.dataset.vai)));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  $$('input[name="doc"]').forEach((i) => i.addEventListener('change', () => { documentoAttivo = i.value; disegna(modulo.risposte, { esempio: modulo.esempio }); }));
  $('#copia')?.addEventListener('click', () => copia(testoDa($('#foglio').innerHTML), $('#esito-copia')));
  $('#stampa')?.addEventListener('click', () => stampa($('#foglio').innerHTML));
  disegnaArchivio(r, stato);
}

// ---------- Le mie richieste ----------

function disegnaArchivio(r, stato) {
  const lista = elenco.leggi([]);
  const puoSalvare = !stato.esempio && (r.cosa || r.ente);
  $('#archivio').innerHTML = `
    <div class="occhiello">Salvate su questo dispositivo</div>
    <h2 id="t-archivio" style="font-size:var(--s2);margin:4px 0">Le mie richieste</h2>
    ${lista.length ? `<ul>${lista.map((x) => {
      const fase = valuta(x.risposte).fase;
      return `<li><b>${esc(x.titolo)}</b> <span class="pill p-${fase.tono === 'si' ? 'si' : fase.tono === 'forse' ? 'forse' : fase.tono === 'dato' ? 'dato' : 'neutro'}">${esc(fase.titolo)}</span> <button type="button" class="link" data-apri="${x.id}">Apri</button> <button type="button" class="link" data-elimina="${x.id}">Elimina</button></li>`;
    }).join('')}</ul>` : '<p class="aiuto">Puoi seguire più richieste: salva quella che stai preparando e iniziane un\'altra. Restano solo su questo dispositivo.</p>'}
    <div class="azioni-doc">
      ${puoSalvare ? '<button type="button" class="btn" id="salva-richiesta">Salva questa richiesta</button>' : ''}
      <button type="button" class="btn" id="nuova-richiesta">Inizia una nuova richiesta</button>
    </div>`;
  $('#salva-richiesta')?.addEventListener('click', () => {
    const titolo = `${r.ente ? r.ente.nome : 'Ente da scegliere'}: ${(r.cosa || 'richiesta').slice(0, 60)}${(r.cosa || '').length > 60 ? '…' : ''}`;
    const id = r._id || `r${Date.now()}`;
    const altre = lista.filter((x) => x.id !== id);
    modulo.risposte._id = id;
    elenco.scrivi([{ id, titolo, risposte: structuredClone(modulo.risposte) }, ...altre]);
    disegnaArchivio(modulo.risposte, { esempio: false });
  });
  $('#nuova-richiesta').addEventListener('click', () => { documentoAttivo = null; modulo.imposta({}); });
  $$('[data-apri]').forEach((b) => b.addEventListener('click', () => {
    const x = elenco.leggi([]).find((y) => y.id === b.dataset.apri);
    if (x) { documentoAttivo = null; modulo.imposta({ ...x.risposte, _id: x.id }); window.scrollTo({ top: 0 }); }
  }));
  $$('[data-elimina]').forEach((b) => b.addEventListener('click', () => {
    elenco.scrivi(elenco.leggi([]).filter((y) => y.id !== b.dataset.elimina));
    disegnaArchivio(modulo.risposte, { esempio: modulo.esempio });
  }));
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => { documentoAttivo = null; modulo.imposta(ESEMPI[b.dataset.esempio], { esempio: true }); }));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => { elenco.cancella(); modulo.azzera(); });
modulo.aggiorna();

montaFoto({
  contenitore: $('#foto'), strumento: 'Chiedo gli atti', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'la risposta dell\'ente, la ricevuta di invio della richiesta o la richiesta stessa',
  note: 'Dalle ricevute PEC si legge la data di invio; dalle risposte dell\'ente la data e l\'esito. Il nome dell\'ente scrivilo nel campo che lo riguarda solo se il dizionario lo prevede.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
