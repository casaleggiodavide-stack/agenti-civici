// Interfaccia di «Affitto: i tuoi diritti». Tutto gira nel browser:
// nomi, indirizzi e importi non lasciano il dispositivo e non finiscono nell'indirizzo della pagina.

import { $, $$, esc, eur, copia, stampa, mailto, testoDa, vaiAllaDomanda } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { montaFoto } from '../src/comune/foto.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { valutaAffitto, daRisposte, testo, VERIFICATO, TIPI } from '../src/regole.js';
import { lettera, oggetto } from '../src/documento.js';

const oggi = new Date().toISOString().slice(0, 10);
const ESEMPI = {
  recesso: { ruolo: 'inquilino', situazione: 'recesso', tipo_contratto: 'libero', inizio: '2024-02-01', registrato: 'si', cedolare: false, canone: 750, deposito: 1500, spese: 'a_parte', motivo_recesso: 'gravi', clausola_recesso: false, motivi_testo: 'trasferimento della sede di lavoro in un\'altra regione, comunicato dal datore di lavoro il 3 novembre 2026', data_uscita: '2027-06-30' },
  disdetta: { ruolo: 'inquilino', situazione: 'disdetta', tipo_contratto: 'libero', inizio: '2023-05-01', registrato: 'si', cedolare: true, canone: 820, deposito: 2460, spese: 'a_parte', data_disdetta: '2026-10-20', motivo_disdetta: 'nessuno' },
  deposito: { ruolo: 'inquilino', situazione: 'deposito', tipo_contratto: 'concordato', inizio: '2018-09-01', registrato: 'si', cedolare: false, canone: 600, deposito: 1800, spese: 'a_parte', data_riconsegna: '2026-10-31', trattenuta: 300, motivo_trattenuta: 'tinteggiatura delle pareti' },
  aumento: { ruolo: 'inquilino', situazione: 'aumento', tipo_contratto: 'libero', inizio: '2022-03-01', registrato: 'si', cedolare: true, canone: 800, deposito: 1600, spese: 'a_parte', canone_richiesto: 815 },
  sfratto: { ruolo: 'inquilino', situazione: 'morosita', tipo_contratto: 'libero', inizio: '2021-10-01', registrato: 'si', cedolare: false, canone: 700, deposito: 1400, spese: 'a_parte', data_prima_rata: '2026-09-05', rate_non_pagate: 3, data_notifica: '2026-11-10', data_udienza: '2026-12-10', sanatorie: 0, difficolta: true },
  proprietario: { ruolo: 'proprietario', situazione: 'disdetta', tipo_contratto: 'libero', inizio: '2023-07-01', registrato: 'si', cedolare: true, canone: 900, deposito: 2700, spese: 'a_parte', motivo_disdetta: 'uso_proprio' },
};

const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'affitto-v1', alCambio: disegna });

const SEGNI = { si: ['c-si', '✓'], forse: ['c-att', '!'], dato: ['c-nd', '?'], no: ['c-no', '–'] };
const NOMI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const altroStrumento = (nome) => $(`.famiglia a[data-strumento="${nome}"]`)?.getAttribute('href') || `../${nome}/`;
const breve = (s) => data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const lunga = (s) => data(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// ---------- tabella ordinabile ----------
let ordine = { col: 'anno', giu: false };
function tabella(t) {
  if (!t?.righe?.length) return '';
  const righe = [...t.righe].sort((a, b) => {
    const x = a[ordine.col], y = b[ordine.col];
    const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
    return ordine.giu ? -r : r;
  });
  const cella = (r, [k, , n]) => {
    let v = r[k];
    if (k === 'tasso') v = `${String(v).replace('.', ',')}`;
    else if (k === 'interessi') v = eur(v);
    else if (k === 'dal' || k === 'al') v = breve(v);
    else if (k === 'decreto') v = `${r.decreto}, ${r.gazzetta}`;
    return `<td${n ? ' class="num"' : ''}>${esc(v)}</td>`;
  };
  return `<div class="scorri-x"><table class="tab-interessi">
    <thead><tr>${t.colonne.map(([k, nome, n]) => `<th${n ? ' class="num"' : ''} aria-sort="${ordine.col === k ? (ordine.giu ? 'descending' : 'ascending') : 'none'}"><button type="button" class="ordina" data-ordina="${k}">${esc(nome)}</button></th>`).join('')}</tr></thead>
    <tbody>${righe.map((r) => `<tr>${t.colonne.map((c) => cella(r, c)).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

// ---------- i numeri principali ----------
function numeri(e) {
  const c = e.calcoli || {};
  const n = [];
  if (c.prossimaScadenza) n.push(['Prossima scadenza', lunga(c.prossimaScadenza.data), c.prossimaScadenza.nome]);
  if (c.dataUscita) n.push(['Fine del preavviso', lunga(c.dataUscita), `${c.preavvisoMesi} mesi dalla ricezione`]);
  if (c.ultimoGiornoInvio) n.push(['La lettera deve arrivare entro', lunga(c.ultimoGiornoInvio), 'per uscire nella data che vuoi']);
  if (c.ultimoGiornoDisdetta) n.push(['Disdetta da ricevere entro', lunga(c.ultimoGiornoDisdetta), c.scadenza ? `per la ${c.scadenza.nome}` : '']);
  if (c.totale !== undefined) n.push(['Da restituire', eur(c.totale), `deposito ${eur(c.deposito)} + interessi ${eur(c.interessi)}${c.trattenuta ? ` − ${eur(c.trattenuta)}` : ''}`]);
  if (c.nuovoCanone && e.situazione === 'aumento') n.push(['Canone massimo', eur(c.nuovoCanone), c.aumentoMensile ? `+${eur(c.aumentoMensile)} al mese` : 'nessun aumento']);
  if (c.daVersare) n.push([e.ruolo === 'proprietario' ? 'Dovuto finora (stima)' : 'Per sanare (stima)', eur(c.daVersare), `${c.rateScadute} canoni e ${eur(c.interessiStimati)} di interessi al ${breve(c.alla)}, più le spese del processo`]);
  if (c.fineTermineGrazia && c.sanatoriaPossibile) n.push(['Termine di grazia, al massimo', lunga(c.fineTermineGrazia), `${c.giorniGrazia} giorni dall'udienza, se il giudice lo concede`]);
  if (c.differenzaMensile) n.push(['Pagato in più ogni mese', eur(c.differenzaMensile), c.differenzaTotale ? `circa ${eur(c.differenzaTotale)} finora` : '']);
  if (c.risarcimentoMinimo) n.push(['Risarcimento minimo se il motivo è falso', eur(c.risarcimentoMinimo), '36 mensilità']);
  if (c.sogliaRiduzione) n.push(['Soglia per la riduzione del canone', `${c.sogliaRiduzione} giorni`, 'un sesto della durata, e almeno 20 giorni']);
  if (!n.length) return '';
  return `<section class="pannello"><div class="occhiello">I conti</div><dl class="numeri">${n.map(([a, b, d]) => `<div><dt>${esc(a)}</dt><dd><b>${esc(b)}</b>${d ? `<small>${esc(d)}</small>` : ''}</dd></div>`).join('')}</dl></section>`;
}

function pannelloDocumento(r, c, e) {
  if (!e.documento) return '';
  const html = lettera(r, c, e);
  if (!html) return '';
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">La lettera</div>
    <h2 id="t-doc">${esc(oggetto(r, e).split(' - ')[0])}</h2>
    <p style="margin:0 0 10px">Pronta da completare e firmare. I campi gialli sono da riempire. Mandala con raccomandata con ricevuta di ritorno e conserva la ricevuta.</p>
    <div class="foglio" id="foglio">${html}</div>
    <div class="azioni-doc">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      <a class="btn" href="${esc(mailto('', oggetto(r, e), testoDa(html)))}">Apri nel programma di posta</a>
      <span class="esito-copia" id="esito-copia" role="status"></span>
    </div>
  </section>`;
}

let ultimo = null;
function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  const { situazione, contratto } = daRisposte(r);
  const e = valutaAffitto(situazione, contratto);
  ultimo = e;
  const verificato = lunga(VERIFICATO);
  const link = (x) => `<li><a href="${esc(altroStrumento(x.strumento))}">${esc(x.titolo)}</a>: ${esc(x.testo)}</li>`;
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${e.verdetto.tono}">
      <div class="occhiello">${r.situazione ? `${esc(r.ruolo === 'proprietario' ? 'Per chi affitta' : 'Per chi è in affitto')}${contratto.tipo ? ` · contratto ${esc(TIPI[contratto.tipo])}` : ''}` : 'Inizia da qui'}</div>
      <p class="titolo">${esc(e.verdetto.titolo)}</p>
      <p>${esc(e.verdetto.testo)}</p>
    </section>
    ${numeri(e)}
    ${e.voci.length ? `<section class="pannello" aria-labelledby="t-voci"><div class="occhiello">Il nostro controllo</div><h2 id="t-voci">Cosa abbiamo verificato</h2>
      <ul class="controlli">${e.voci.map((m) => { const [c, s] = SEGNI[m.esito] || SEGNI.dato; return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(m.titolo)}</b><small>${esc(m.spiegazione)}${m.dato && NOMI[m.dato] ? ` <button type="button" class="vai-a" data-vai="${m.dato}">Rispondi: ${esc(NOMI[m.dato])}</button>` : ''}</small></div></li>`; }).join('')}</ul></section>` : ''}
    ${e.tabella ? `<section class="pannello" aria-labelledby="t-tab"><div class="occhiello">Calcolati con i tassi dei decreti del Ministero dell'economia</div><h2 id="t-tab">${esc(e.tabella.titolo)}</h2>${tabella(e.tabella)}</section>` : ''}
    ${e.scadenze.length ? `<section class="pannello" aria-labelledby="t-scad"><div class="occhiello">Calcolate dalle date che hai indicato</div><h2 id="t-scad">Le scadenze</h2>
      <ul class="scadenze">${e.scadenze.map((s) => `<li class="${s.scaduta ? 'scaduta' : s.giorniMancanti <= 15 ? 'vicina' : ''}"><span class="quando">${esc(breve(s.data))}<small>${s.scaduta ? 'passata' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria calcolato dalle tue risposte: verifica sempre le date sul contratto.` }, { conIcs: !incorporata() })}</span></li>`).join('')}</ul></section>` : ''}
    ${pannelloDocumento(r, contratto, e)}
    ${e.passi.length ? `<section class="pannello"><div class="occhiello">Come si procede</div><h2>I passi</h2><ol class="passi">${e.passi.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)}${p.link ? ` <a href="${esc(p.link)}" target="_blank" rel="noopener">Apri</a>` : ''}</li>`).join('')}</ol></section>` : ''}
    ${e.collegamenti.length ? `<section class="pannello"><div class="occhiello">Negli altri strumenti</div><ul class="collegamenti">${[...new Map(e.collegamenti.map((x) => [x.strumento, x])).values()].map(link).join('')}</ul></section>` : ''}
    ${e.fonti.length ? `<section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${e.fonti.map((f) => `<li>${fonte(f)}</li>`).join('')}</ul>${e.avvertenze.length ? `<p class="nota-fonti">${esc(e.avvertenze.join(' '))}</p>` : ''}
      <p><button type="button" class="link" id="copia-esito">Copia l'esito in testo semplice</button> <span class="esito-copia" id="esito-copia-testo" role="status"></span></p></section>` : ''}`;
  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => vaiAllaDomanda(b.dataset.vai)));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  $$('[data-ordina]').forEach((b) => b.addEventListener('click', () => { ordine = { col: b.dataset.ordina, giu: ordine.col === b.dataset.ordina ? !ordine.giu : false }; disegna(modulo.risposte, { esempio: modulo.esempio }); }));
  $('#copia')?.addEventListener('click', () => copia(testoDa($('#foglio').innerHTML), $('#esito-copia')));
  $('#stampa')?.addEventListener('click', () => stampa($('#foglio').innerHTML));
  $('#copia-esito')?.addEventListener('click', () => copia(testo(ultimo), $('#esito-copia-testo')));
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => modulo.imposta(ESEMPI[b.dataset.esempio], { esempio: true })));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => modulo.azzera());
modulo.aggiorna();
montaFoto({
  contenitore: $('#foto'), strumento: 'Affitto: i tuoi diritti', domande: DOMANDE, oggi,
  cosa: 'la prima pagina del contratto di affitto, la disdetta o la lettera che hai ricevuto',
  note: 'Leggi solo tipo di contratto, date, durata, canone, deposito, cedolare secca e motivo della disdetta. Non trascrivere nomi, indirizzi o codici fiscali.',
  alRisultato: (x) => modulo.imposta({ ...modulo.risposte, ...x }),
});
