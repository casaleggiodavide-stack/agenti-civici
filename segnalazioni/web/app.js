// Interfaccia di «Segnalazioni urbane indipendenti». Tutto gira nel browser:
// la posizione, le foto e i dati personali non lasciano il dispositivo.

import { $, $$, esc, copia, stampa, mailto, testoDa, vaiAllaDomanda } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { montaFoto } from '../src/comune/foto.js';
import { caricaEnti, cerca } from '../../chiedo-gli-atti/src/enti.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { valuta, VERIFICATO } from '../src/regole.js';
import { documento, oggetto } from '../src/documento.js';

const ESEMPI = {
  buca: { categoria: 'buca', descrizione: 'Buca profonda circa 15 centimetri e larga un metro sulla corsia verso il centro, piena d\'acqua quando piove. Due scooter sono già caduti.', pericolo: false, foto: 2, luogo: 'Via Esempio, davanti al civico 12', strada: 'urbana', dal: '2026-10-01' },
  rifiuti: { categoria: 'rifiuti_abbandonati', descrizione: 'Cumulo di sacchi, un materasso e calcinacci abbandonati sul ciglio della strada, vicino al canale.', pericolo: false, foto: 3, luogo: 'Strada vicinale Esempio, 300 metri dopo l\'incrocio' },
  statale: { categoria: 'segnaletica', descrizione: 'Il cartello di curva pericolosa è abbattuto e la linea di mezzeria non si vede più.', pericolo: true, foto: 1, luogo: 'Uscita per la frazione Esempio', strada: 'statale', sigla_km: 'SS 16 km 912' },
  barriere: { categoria: 'barriere_architettoniche', descrizione: 'Il marciapiede non ha scivoli agli attraversamenti pedonali: chi usa la sedia a rotelle deve scendere in strada.', pericolo: false, foto: 2, luogo: 'Incrocio tra via Esempio e via Prova' },
};

let indice = null;
const enti = async () => (indice ||= await caricaEnti());
const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'segnalazioni-v1', alCambio: disegna });

// ---------- Il Comune ----------

const box = document.createElement('div');
box.className = 'domanda cerca-ente';
box.id = 'd-ente';
box.innerHTML = `
  <label for="cerca-ente">Comune</label>
  <input type="text" id="cerca-ente" placeholder="es. Lecce, Castelnuovo, Roma" autocomplete="off" aria-controls="risultati-enti">
  <ul class="risultati-enti" id="risultati-enti" hidden></ul>
  <div id="ente-scelto"></div>
  <p><button type="button" class="btn" id="posizione">Usa la mia posizione</button> <span class="aiuto" id="esito-posizione" role="status"></span></p>`;
$('#s-dove h2').after(box);

let attesa;
$('#cerca-ente').addEventListener('focus', () => { enti().catch(() => {}); });
$('#cerca-ente').addEventListener('input', (e) => {
  clearTimeout(attesa);
  const q = e.target.value;
  attesa = setTimeout(async () => {
    const lista = $('#risultati-enti');
    if (q.trim().length < 2) { lista.hidden = true; return; }
    lista.hidden = false;
    lista.innerHTML = '<li><button type="button" disabled>Carico l\'elenco dei Comuni…</button></li>';
    try {
      const trovati = cerca(await enti(), `comune ${q}`, 20).filter((t) => t.cat === 'L6' && /^comune /i.test(t.nome)).slice(0, 8);
      lista.innerHTML = trovati.length
        ? trovati.map((t, i) => `<li><button type="button" data-ente="${i}">${esc(t.nome)}<small>${esc(`${t.comune || ''} (${t.prov || ''})`)}</small></button></li>`).join('')
        : '<li><button type="button" disabled>Nessun Comune trovato: controlla il nome.</button></li>';
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

$('#posizione').addEventListener('click', () => {
  const esito = $('#esito-posizione');
  if (!navigator.geolocation) { esito.textContent = 'Questo browser non dà la posizione: scrivi l\'indirizzo.'; return; }
  esito.textContent = 'Cerco la posizione…';
  navigator.geolocation.getCurrentPosition((p) => {
    const c = `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`;
    modulo.imposta({ ...modulo.risposte, coordinate: c });
    esito.textContent = `Posizione aggiunta (precisione circa ${Math.round(p.coords.accuracy)} metri).`;
  }, () => { esito.textContent = 'Posizione non disponibile: scrivi l\'indirizzo o le coordinate.'; }, { enableHighAccuracy: true, timeout: 15000 });
});

function disegnaEnte(e) {
  $('#ente-scelto').innerHTML = e
    ? `<div class="ente-scelto"><b>${esc(e.nome)}</b><span>${esc(`${e.comune || ''} (${e.prov || ''})`)}</span><span>PEC: ${esc(e.pec)}</span><span><button type="button" class="link" id="togli-ente">Cambia Comune</button></span></div>`
    : '';
  $('#togli-ente')?.addEventListener('click', () => { delete modulo.risposte.ente; modulo.aggiorna(); $('#cerca-ente').focus(); });
}

// ---------- Esito ----------

const SEGNI = { si: ['c-si', '✓'], forse: ['c-att', '!'], dato: ['c-nd', '?'], no: ['c-no', '–'] };
const NOMI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const osm = (c) => { const [la, lo] = String(c).split(',').map((x) => x.trim()); return la && lo ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(la)}&mlon=${encodeURIComponent(lo)}#map=19/${encodeURIComponent(la)}/${encodeURIComponent(lo)}` : null; };
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;

function pannelloDestinatari(v, r) {
  if (!v.destinatari.length && !v.telefoni.length) return '';
  return `<section class="pannello" aria-labelledby="t-dest">
    <div class="occhiello">A chi rivolgersi</div>
    <h2 id="t-dest">Chi deve intervenire</h2>
    ${v.telefoni.length ? `<ul class="telefoni">${v.telefoni.map((t) => `<li><b>${esc(t.numero)}</b> ${esc(t.chi)}<small>${esc(t.quando || '')}</small></li>`).join('')}</ul>` : ''}
    <ul class="destinatari">${v.destinatari.map((d) => `<li><span class="pill ${d.ruolo === 'principale' ? 'p-dato' : 'p-neutro'}">${d.ruolo === 'principale' ? 'a' : 'in copia'}</span> <b>${esc(d.nome)}</b>${d.pec ? `<br><span class="pec">PEC ${esc(d.pec)}</span>` : ''}<small>${esc(d.perche || '')}${d.dove ? ` ${esc(d.dove)}` : ''}</small></li>`).join('')}</ul>
    ${r.coordinate && osm(r.coordinate) ? `<p><a href="${esc(osm(r.coordinate))}" target="_blank" rel="noopener">Controlla il punto sulla mappa</a></p>` : ''}
  </section>`;
}

function pannelloVoci(v) {
  return `<section class="pannello" aria-labelledby="t-voci">
    <div class="occhiello">Prima di inviare</div>
    <h2 id="t-voci">Cosa abbiamo controllato</h2>
    <ul class="controlli">${v.voci.map((m) => {
      const [c, s] = SEGNI[m.esito] || SEGNI.dato;
      return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(m.titolo)}</b><small>${esc(m.spiegazione)}${m.dato && NOMI[m.dato] ? ` <button type="button" class="vai-a" data-vai="${m.dato}">Rispondi: ${esc(NOMI[m.dato])}</button>` : ''}</small></div></li>`;
    }).join('')}</ul>
  </section>`;
}

function pannelloDocumento(r, v) {
  if (!v.documento) return '';
  const html = documento(r, v);
  const pec = v.destinatari.find((d) => d.ruolo === 'principale')?.pec || '';
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">Il documento</div>
    <h2 id="t-doc">${v.documento.tipo === 'sollecito' ? 'Il sollecito' : 'La segnalazione'}, pronta da completare</h2>
    <p style="margin:0 0 10px">Mandala dalla tua PEC${pec ? ` a <b>${esc(pec)}</b>` : ''}, allegando le foto. I campi gialli sono da completare.</p>
    <div class="foglio" id="foglio">${html}</div>
    <div class="azioni-doc">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      <a class="btn" href="${esc(mailto(pec, oggetto(r, v), testoDa(html)))}">Apri nel programma di posta</a>
      <span class="esito-copia" id="esito-copia" role="status"></span>
    </div>
  </section>`;
}

function pannelloScadenze(v) {
  if (!v.scadenze.length) return '';
  return `<section class="pannello" aria-labelledby="t-scad">
    <div class="occhiello">Promemoria</div>
    <h2 id="t-scad">Quando sollecitare</h2>
    <ul class="scadenze">${v.scadenze.map((s) => `<li class="${s.scaduta ? 'scaduta' : ''}"><span class="quando">${esc(data(s.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}<small>${s.scaduta ? 'passata' : `tra ${s.giorniMancanti} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con Segnalazioni urbane indipendenti.` }, { conIcs: !incorporata() })}</span></li>`).join('')}</ul>
    <p><small>Non è un termine di legge: una segnalazione non sempre obbliga l'ente a rispondere entro una data, ma deve essere protocollata e i lavori di manutenzione sono un suo dovere. ${fonte(v.istanza.fonte || { titolo: 'Fonte', url: v.fonti[0]?.url })}</small></p>
  </section>`;
}

function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  disegnaEnte(r.ente);
  const v = valuta(r, { enti: indice?.righe });
  const verificato = new Date(VERIFICATO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${v.verdetto.tono}">
      <div class="occhiello">${r.categoria ? 'Il nostro controllo' : 'Inizia da qui'}</div>
      <p class="titolo">${esc(v.verdetto.titolo)}</p>
      <p>${esc(v.verdetto.testo)}</p>
    </section>
    ${pannelloDestinatari(v, r)}
    ${r.categoria ? pannelloVoci(v) : ''}
    ${pannelloDocumento(r, v)}
    ${pannelloScadenze(v)}
    ${v.passi.length ? `<section class="pannello"><div class="occhiello">Come si procede</div><h2>I passi, in ordine</h2><ol class="passi">${v.passi.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)}</li>`).join('')}</ol>
      ${r.data_invio && ['nessuna', 'presa'].includes(r.risposta) ? `<p class="azioni-doc"><a class="btn" href="${esc(altroStrumento('chiedo-gli-atti'))}">Chiedi gli atti</a></p>` : ''}</section>` : ''}
    ${v.fonti.length ? `<section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${v.fonti.map((f) => `<li>${fonte(f)}</li>`).join('')}</ul></section>` : ''}`;
  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => (b.dataset.vai === 'ente' ? $('#cerca-ente').focus() : vaiAllaDomanda(b.dataset.vai))));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  $('#copia')?.addEventListener('click', () => copia(testoDa($('#foglio').innerHTML), $('#esito-copia')));
  $('#stampa')?.addEventListener('click', () => stampa($('#foglio').innerHTML));
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', async () => {
  const idx = await enti().catch(() => null);
  const lecce = idx ? cerca(idx, 'comune di lecce', 1)[0] : null;
  modulo.imposta({ ...ESEMPI[b.dataset.esempio], ente: lecce || undefined }, { esempio: true });
}));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => modulo.azzera());
// le ricerche di Provincia, ASL e agenzia per l'ambiente usano l'Indice PA: lo carichiamo subito
enti().then(() => modulo.aggiorna()).catch(() => {});
modulo.aggiorna();
montaFoto({
  contenitore: $('#foto'), strumento: 'Segnalazioni urbane indipendenti', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'il problema: la buca, i rifiuti, il lampione, il cartello, la barriera',
  note: 'Dalla foto ricava solo la categoria del problema e una descrizione breve e oggettiva di cosa si vede (dimensioni approssimative, posizione nella strada). Non inventare indirizzi, date o dati personali; non trascrivere targhe di veicoli né volti.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
