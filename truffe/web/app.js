// Interfaccia di «È una truffa?». L'analisi gira nel browser con regole scritte; il secondo
// parere dell'assistente AI, solo dove disponibile, riceve il testo senza dati personali.

import { $, $$, esc } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { montaFoto } from '../src/comune/foto.js';
import { caricaEnti } from '../../chiedo-gli-atti/src/enti.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { valuta, VERIFICATO } from '../src/regole.js';
import { sitiPubblici, maschera } from '../src/segnali.js';
import CONSOB from '../dati/consob.js';

const ESEMPI = {
  pacco: { canale: 'sms', testo: 'Il tuo pacco è in giacenza, paga 1,99 € per la riconsegna su poste-consegna-it.info', chi: 'corriere', chiede_codici: false, chiede_soldi: true, chiede_app: false, fatto: 'niente' },
  antifrode: { canale: 'telefono', testo: 'Mi chiama il «servizio antifrode» della banca: c\'è un accesso sospetto, devo spostare i risparmi su un conto di sicurezza con un bonifico istantaneo.', chi: 'banca', chiede_codici: false, chiede_soldi: true, chiede_app: false, fatto: 'niente' },
  mamma: { canale: 'chat', testo: 'Ciao mamma, ho cambiato numero, salvalo. Mi fai un bonifico urgente? Poi ti spiego.', chi: 'familiare', chiede_soldi: true, fatto: 'niente' },
  trading: { canale: 'social', testo: 'Guadagni garantiti del 30% al mese con il nostro gruppo di trading: registrati su https://rocketprobit.com', chi: 'investimento', chiede_soldi: true, fatto: 'niente' },
};

let siti = new Set();
caricaEnti().then((idx) => { siti = sitiPubblici({ enti: idx.righe.map((e) => [e.nome, e.cat, e.comune, e.prov, e.pec, e.sito]) }); modulo.aggiorna(); }).catch(() => {});
const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'truffe-v1', alCambio: disegna });

const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;
const LUCE = { forte: ['no', 'Fermati'], verifica: ['forse', 'Verifica'], nessuno: ['neutro', 'Nessun segnale noto'] };

let parere = null; // { per: testo, html }

function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  const v = valuta(r, { siti });
  const verificato = new Date(VERIFICATO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const [tono] = LUCE[v.livello] || ['dato'];
  $('#esito').innerHTML = `
    <section class="pannello verdetto semaforo" data-tono="${v.verdetto.tono === 'neutro' ? 'dato' : v.verdetto.tono}">
      <div class="occhiello">${v.livello ? `Semaforo: ${esc(LUCE[v.livello][1])}` : 'Inizia da qui'}</div>
      <p class="titolo">${esc(v.verdetto.titolo)}</p>
      <p>${esc(v.verdetto.testo)}</p>
    </section>
    ${v.segnali.length ? `<section class="pannello" aria-labelledby="t-segnali"><div class="occhiello">Che cosa abbiamo trovato</div><h2 id="t-segnali">I segnali</h2>
      <ul class="controlli">${v.segnali.map((s) => `<li class="${s.forza === 'forte' ? 'c-no' : 'c-att'}"><span class="segno" aria-hidden="true">${s.forza === 'forte' ? '!' : '?'}</span><div><b>${esc(s.titolo)}</b><small>${esc(s.testo)}${s.fonte ? ` <a href="${esc(s.fonte)}" target="_blank" rel="noopener">Comunicato CONSOB</a>` : ''}</small></div></li>`).join('')}</ul></section>` : ''}
    ${v.domini.length ? `<section class="pannello"><div class="occhiello">Letti, non aperti</div><h2>I link nel messaggio</h2><ul class="domini">${v.domini.map((d) => `<li><code>${esc(d.host)}</code><span>${esc(d.nota || 'nessuna informazione: non è tra i siti ufficiali che conosciamo')}</span></li>`).join('')}</ul></section>` : ''}
    <div id="parere"></div>
    ${v.azioni.length && v.livello ? `<section class="pannello" aria-labelledby="t-azioni"><div class="occhiello">Adesso</div><h2 id="t-azioni">Cosa fare subito</h2><ol class="passi">${v.azioni.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>
      ${r.fatto === 'pagato' && ['carta'].includes(r.come) ? `<p class="azioni-doc"><a class="btn btn-primario" href="${esc(altroStrumento('mi-rimborsano'))}">Prepara la contestazione con Mi rimborsano?</a></p>` : ''}
      <p class="azioni-doc"><a class="btn" href="https://www.commissariatodips.it/" target="_blank" rel="noopener">Polizia Postale</a>${v.segnali.some((s) => s.id.startsWith('consob')) || r.chi === 'investimento' ? ' <a class="btn" href="https://www.consob.it/web/area-pubblica/occhio-alle-truffe" target="_blank" rel="noopener">CONSOB, Occhio alle truffe</a>' : ''}</p></section>` : ''}
    ${v.scadenze.length ? `<section class="pannello" aria-labelledby="t-scad"><div class="occhiello">Calcolate dalle date che hai indicato</div><h2 id="t-scad">Le scadenze</h2>
      <ul class="scadenze">${v.scadenze.map((s) => `<li class="${s.scaduta ? 'scaduta' : s.giorniMancanti <= 5 ? 'vicina' : ''}"><span class="quando">${esc(data(s.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}<small>${s.scaduta ? 'passata' : `tra ${s.giorniMancanti} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con È una truffa?` }, { conIcs: !incorporata() })}</span></li>`).join('')}</ul></section>` : ''}
    <section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${v.fonti.map((f) => `<li>${fonte(f)}</li>`).join('')}</ul>
      <p class="aiuto" style="margin-top:8px">Siti oscurati dalla CONSOB: ${Object.keys(CONSOB.dominio).length} domini dai comunicati letti il ${esc(new Date(CONSOB.letto).toLocaleDateString('it-IT'))}${CONSOB.totale ? `, su ${CONSOB.totale.toLocaleString('it-IT', { useGrouping: 'always' })} oscurati in tutto dal 2019` : ''}. Un sito che non è nell'elenco non è per questo autorizzato.</p></section>`;
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  montaParere(r, v);
}

// ---------- Il secondo parere dell'assistente AI (solo dove la pagina può usarlo) ----------

let sample = null;
(async () => {
  try { sample = window.claude?.use ? await window.claude.use('sample') : null; } catch { sample = null; }
  modulo.aggiorna();
})();

function montaParere(r, v) {
  const box = $('#parere');
  if (!box || !sample || !r.testo || r.testo.trim().length < 15) return;
  const testo = maschera(r.testo);
  if (parere?.per === testo) { box.innerHTML = parere.html; return; }
  box.innerHTML = `<section class="pannello"><div class="occhiello">Facoltativo</div><h2>Un secondo parere</h2>
    <p class="aiuto" style="margin:0 0 8px">L'assistente AI legge il testo, senza i dati personali che abbiamo tolto (IBAN, carte, telefoni, email, codici), e cerca segnali che le regole non vedono. Non apre i link e non dice mai che è sicuro.</p>
    <details style="margin:0 0 10px"><summary>Che cosa riceve</summary><pre class="inviato">${esc(testo)}</pre></details>
    <button type="button" class="btn" id="chiedi-parere">Chiedi un secondo parere</button> <span id="stato-parere" role="status" class="aiuto"></span></section>`;
  $('#chiedi-parere').addEventListener('click', async () => {
    $('#chiedi-parere').disabled = true;
    $('#stato-parere').textContent = 'Sto leggendo…';
    try {
      const out = await sample.json(`Sei l'analista di «È una truffa?», uno strumento civico italiano che aiuta a riconoscere i tentativi di truffa. Analizza il messaggio qui sotto, ricevuto via ${r.canale || 'canale non indicato'}${r.chi ? `, che dice di venire da: ${r.chi}` : ''}. I dati personali sono già stati sostituiti da segnaposto tra parentesi quadre.

Le regole automatiche hanno già trovato: ${v.segnali.map((s) => s.titolo).join('; ') || 'nessun segnale'}.

Cerca altri segnali concreti di truffa o di manipolazione (tono, richieste, incoerenze, mittente, link) e spiegali in italiano semplice. Non dire mai che il messaggio è sicuro o affidabile: al massimo che non vedi segnali. Non inventare fatti sul mittente. Non aprire né visitare link.

Rispondi solo con JSON: {"giudizio": "forte" | "verifica" | "nessuno", "segnali": [{"titolo": "...", "spiegazione": "..."}], "consiglio": "una frase"}

MESSAGGIO:
${testo}`, { modelTier: 'quick' });
      const segn = Array.isArray(out?.segnali) ? out.segnali.slice(0, 6) : [];
      const html = `<section class="pannello parere" data-tono="${out?.giudizio === 'forte' ? 'no' : out?.giudizio === 'verifica' ? 'forse' : 'dato'}"><div class="occhiello">Secondo parere dell'assistente AI</div>
        ${segn.length ? `<ul class="controlli">${segn.map((s) => `<li class="c-att"><span class="segno" aria-hidden="true">?</span><div><b>${esc(s.titolo)}</b><small>${esc(s.spiegazione)}</small></div></li>`).join('')}</ul>` : '<p>Non ha trovato altri segnali. Non vuol dire che sia sicuro.</p>'}
        ${out?.consiglio ? `<p><b>Consiglio:</b> ${esc(out.consiglio)}</p>` : ''}<p class="aiuto">Un modello di intelligenza artificiale può sbagliare: conta di più il semaforo delle regole qui sopra e, sempre, la verifica dal canale ufficiale.</p></section>`;
      parere = { per: testo, html };
      $('#parere').innerHTML = html;
    } catch (e) {
      $('#stato-parere').textContent = e?.code === 'not_granted' ? 'Serve il permesso a usare l\'assistente AI da questa pagina.' : e?.code === 'rate_limited' ? 'Troppe richieste: riprova tra qualche minuto.' : 'Non è arrivata una risposta: riprova.';
      $('#chiedi-parere').disabled = false;
    }
  });
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => modulo.imposta(ESEMPI[b.dataset.esempio], { esempio: true })));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => { parere = null; modulo.azzera(); });
modulo.aggiorna();
montaFoto({
  contenitore: $('#foto'), strumento: 'È una truffa?', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'lo screenshot di un SMS, di una email, di una chat o di un sito',
  note: 'Trascrivi nel campo «testo» il testo del messaggio e i link esattamente come sono scritti. Al posto di nomi di persone, numeri di telefono, IBAN, numeri di carta e codici scrivi [nome], [telefono], [IBAN], [carta], [codice]. Indica anche il canale, se si capisce.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
