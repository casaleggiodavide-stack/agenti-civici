// Interfaccia di «Condominio: i tuoi diritti». Tutto gira nel browser:
// i dati personali non lasciano il dispositivo e non entrano mai nell'indirizzo della pagina.

import { $, $$, esc, copia, stampa, mailto, testoDa, vaiAllaDomanda } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { montaFoto } from '../src/comune/foto.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { valutaCondominio, VERIFICATO } from '../src/regole.js';
import { lettera, oggetto, destinatario } from '../src/documento.js';

const ESEMPI = {
  impugnare: { caso: 'impugnare', vizio: 'convocazione', voto: 'assente', data_assemblea: '2026-10-20', data_comunicazione: '2026-11-03', mediazione: 'no' },
  maggioranze: { caso: 'delibera', tipo: 'innovazioni', convocazione: 'seconda', partecipanti: 24, totale_millesimi: 1000, presenti_teste: 12, presenti_millesimi: 720, favorevoli_teste: 9, favorevoli_millesimi: 610, data_prima: '2026-10-05', data_seconda: '2026-10-09', data_avviso: '2026-09-28' },
  assemblea: { caso: 'assemblea', amministratore_presente: true, motivo_assemblea: 'generale', richiedenti: 3, millesimi_richiedenti: 190, totale_millesimi: 1000, ordine_giorno: '1. Infiltrazioni dal tetto: preventivi per la riparazione\n2. Varie ed eventuali' },
  lastrico: { caso: 'spese', voce_spesa: 'lastrico', lastrico_uso: 'mio', importo: 9000, millesimi: 85, totale_millesimi: 1000 },
  urgenti: { caso: 'lavori_urgenti', lavoro: 'Di notte si è rotto il tubo dell\'acqua comune in cantina e allagava i locali: ho chiamato un idraulico', data_lavori: '2026-11-02', urgente: 'si', autorizzato: false, avvisato: true, importo: 640, millesimi: 42, totale_millesimi: 1000 },
};

const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'condominio-v1', alCambio: disegna });

const SEGNI = { si: ['c-si', '✓'], forse: ['c-att', '!'], dato: ['c-nd', '?'], no: ['c-no', '–'] };
const NOMI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
const fonte = (f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`;
const num = (n) => (n === null || n === undefined ? '–' : Number(n).toLocaleString('it-IT', { maximumFractionDigits: 2 }));
const TITOLI_DOC = {
  contestazione: 'La contestazione all\'amministratore', documenti: 'La richiesta dei documenti', richiesta_assemblea: 'La richiesta di assemblea',
  avviso_convocazione: 'L\'avviso di convocazione', rateizzazione: 'La richiesta di rateizzazione', morosi: 'La richiesta sulle quote non pagate',
  revoca: 'La richiesta di assemblea per la revoca', rimborso: 'La richiesta di rimborso',
};

function quorum(m) {
  if (!m || (!m.costituita && !m.approvata)) return '';
  const riga = (nome, q) => {
    if (!q) return '';
    const stato = (ok) => (ok === null ? '<span class="q-nd">serve un dato</span>' : ok ? '<span class="q-si">sì</span>' : '<span class="q-no">no</span>');
    return `<tr><th scope="row">${esc(nome)}</th>
      <td>${num(q.teste.ci_sono)} <small>servono ${q.teste.servono ?? '–'}</small></td>
      <td>${num(q.millesimi.ci_sono)} <small>servono ${num(q.millesimi.servono)}</small></td>
      <td>${stato(q.esito)}</td></tr>`;
  };
  return `<section class="pannello" aria-labelledby="t-quorum"><div class="occhiello">${esc(m.tipo?.etichetta || 'Decisione')}${m.convocazione ? `, ${esc(m.convocazione)} convocazione` : ''}</div>
    <h2 id="t-quorum">Il conto dei voti</h2>
    <div class="tabella-quorum"><table>
      <thead><tr><th scope="col"></th><th scope="col">Condòmini</th><th scope="col">Millesimi su ${num(m.totale_millesimi)}</th><th scope="col">Raggiunto</th></tr></thead>
      <tbody>${riga('Presenti (quorum costitutivo)', m.costituita)}${riga('Favorevoli (quorum deliberativo)', m.approvata)}</tbody>
    </table></div>
  </section>`;
}

function conto(c) {
  if (!c?.righe?.length) return '';
  return `<section class="pannello"><div class="occhiello">Il calcolo</div><ul class="conto-righe">${c.righe.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
}

function pannelloDocumento(r, v) {
  if (!v.documento) return '';
  const html = lettera(r, v);
  if (!html) return '';
  const d = destinatario(r, v);
  const titolo = v.documento.tipo === 'documenti' && v.documento.sollecito ? 'Il sollecito per i documenti' : TITOLI_DOC[v.documento.tipo];
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">Il documento</div>
    <h2 id="t-doc">${esc(titolo)}, pronta da completare</h2>
    <p style="margin:0 0 10px">${v.documento.tipo === 'avviso_convocazione' ? 'Mandala a tutti i condòmini con raccomandata, PEC o consegna a mano, almeno cinque giorni prima.' : `Mandala per PEC o raccomandata${d.pec ? ` a <b>${esc(d.pec)}</b>` : ''} e conserva la ricevuta.`} I campi gialli sono da completare.</p>
    ${v.documento.tipo === 'contestazione' ? '<p class="avviso-segnale" style="margin:0 0 10px">Questa lettera non ferma i 30 giorni: per impugnare serve la domanda di mediazione, con un avvocato.</p>' : ''}
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
  const v = valutaCondominio(r);
  const verificato = new Date(VERIFICATO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${esc(v.verdetto.tono)}">
      <div class="occhiello">${r.caso ? 'Cosa dicono le regole' : 'Inizia da qui'}</div>
      <p class="titolo">${esc(v.verdetto.titolo)}</p>
      <p>${esc(v.verdetto.testo)}</p>
    </section>
    ${quorum(v.calcolo)}
    ${v.caso !== 'delibera' ? conto(v.calcolo) : ''}
    ${v.voci.length ? `<section class="pannello" aria-labelledby="t-voci"><div class="occhiello">Il nostro controllo</div><h2 id="t-voci">Cosa abbiamo verificato</h2>
      <ul class="controlli">${v.voci.map((m) => { const [c, s] = SEGNI[m.esito] || SEGNI.dato; return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(m.titolo)}</b><small>${esc(m.spiegazione)}${m.dato && NOMI[m.dato] ? ` <button type="button" class="vai-a" data-vai="${esc(m.dato)}">Rispondi: ${esc(NOMI[m.dato])}</button>` : ''}</small></div></li>`; }).join('')}</ul></section>` : ''}
    ${v.scadenze.length ? `<section class="pannello" aria-labelledby="t-scad"><div class="occhiello">Calcolate dalle date che hai indicato</div><h2 id="t-scad">Le scadenze</h2>
      <ul class="scadenze">${v.scadenze.map((s) => `<li class="${s.scaduta ? 'scaduta' : s.giorniMancanti <= 5 ? 'vicina' : ''}"><span class="quando">${esc(data(s.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}<small>${s.scaduta ? 'passata' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${s.scaduta ? '' : pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con Condominio: i tuoi diritti. Verifica sempre le date.` }, { conIcs: !incorporata() })}</span></li>`).join('')}</ul></section>` : ''}
    ${pannelloDocumento(r, v)}
    ${v.passi.length ? `<section class="pannello"><div class="occhiello">Come si procede</div><h2>I passi</h2><ol class="passi">${v.passi.map((p) => `<li><b>${esc(p.titolo)}</b>. ${esc(p.testo)}</li>`).join('')}</ol></section>` : ''}
    ${v.fonti.length ? `<section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${v.fonti.map((f) => `<li>${fonte(f)}</li>`).join('')}</ul></section>` : ''}`;
  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => vaiAllaDomanda(b.dataset.vai)));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  $('#copia')?.addEventListener('click', () => copia(testoDa($('#foglio').innerHTML), $('#esito-copia')));
  $('#stampa')?.addEventListener('click', () => stampa($('#foglio').innerHTML));
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => modulo.imposta({ ...ESEMPI[b.dataset.esempio] }, { esempio: true })));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => modulo.azzera());
modulo.aggiorna();
montaFoto({
  contenitore: $('#foto'), strumento: 'Condominio: i tuoi diritti', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'il verbale dell\'assemblea, l\'avviso di convocazione o il riparto delle spese',
  note: 'Leggi solo date, tipo di decisione, convocazione, numeri di condòmini e millesimi presenti e favorevoli, importi. Non trascrivere nomi, indirizzi o altri dati personali.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
