// Interfaccia di «Faccio ricorso?». Tutto gira nel browser.

import { $, $$, esc, eur, copia, stampa, mailto, testoDa, vaiAllaDomanda } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { data } from '../src/comune/date.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { valuta } from '../src/regole.js';
import { ricorsoPrefetto, ricorsoGiudiceDiPace, oggettoEmail } from '../src/documento.js';
import { montaFoto } from '../src/comune/foto.js';

const ESEMPI = {
  tardiva: {
    gia_pagato: false, gia_ricorso: false, tipo: 'semaforo', data_violazione: '2026-05-04', modo: 'posta', data_notifica: '2026-09-22', data_spedizione: '2026-08-21',
    estero: false, noleggio: false, veicolo_tuo: true, dati_corretti: true, importo: 182.4, spese: 15.4, punti: 6, sospensione: false,
    provincia: 'TO', comune: 'Torino', organo: 'Polizia locale di Torino', numero_verbale: 'V/2026/118422', targa: 'GH 412 KL', invio_prefetto: 'diretto',
  },
  autovelox: {
    gia_pagato: false, gia_ricorso: false, tipo: 'velocita', data_violazione: '2026-06-18', modo: 'send', data_notifica: '2026-09-14',
    estero: false, noleggio: false, veicolo_tuo: true, dati_corretti: true, importo: 187.3, spese: 14.3, massimo: 694, punti: 3, sospensione: false,
    strumento: 'approvato', taratura: '2025-11-03', vel_rilevata: 98, vel_contestata: 93, cartello: true, stessa_ora: false,
    provincia: 'BS', comune: 'Rovato', organo: 'Polizia locale di Rovato', numero_verbale: '2026/4471/V', targa: 'FX 903 RT',
  },
  strisce: {
    gia_pagato: false, gia_ricorso: false, tipo: 'strisce_blu', data_violazione: '2026-09-20', modo: 'posta', data_notifica: '2026-10-05',
    estero: false, noleggio: false, veicolo_tuo: true, dati_corretti: true, importo: 57.3, spese: 15.3, punti: 0, sospensione: false,
    ticket: true, minuti_pagati: 60, minuti_oltre: 5, provincia: 'BO', comune: 'Bologna', organo: 'Polizia locale di Bologna', numero_verbale: 'S-2026-339120', targa: 'EZ 551 PA', invio_prefetto: 'organo',
  },
  semaforo: {
    gia_pagato: false, gia_ricorso: false, tipo: 'semaforo', data_violazione: '2026-09-03', modo: 'posta', data_notifica: '2026-10-08',
    estero: false, noleggio: false, veicolo_tuo: true, dati_corretti: true, importo: 182.4, spese: 15.4, massimo: 694, punti: 6, sospensione: false,
    provincia: 'RM', comune: 'Roma', organo: 'Polizia di Roma Capitale', numero_verbale: '0918-2026', targa: 'GA 120 ZZ',
  },
};

const NOMI_DATI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
let documentoAttivo = null;

const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'faccio-ricorso-v1', alCambio: disegna });

function segno(m) {
  if (m.esito === 'vizio') return ['c-vizio', '✓', m.forza === 'forte' ? '<span class="pill p-si">motivo forte</span>' : '<span class="pill p-forse">motivo discusso</span>'];
  if (m.esito === 'da_provare') return ['c-vizio', '?', '<span class="pill p-forse">da provare</span>'];
  if (m.esito === 'dato') return ['c-nd', '?', '<span class="pill p-dato">serve un dato</span>'];
  return ['c-no', '–', ''];
}

function pannelloMotivi(v) {
  if (!v.motivi.length) return '';
  const ordine = { vizio: 0, da_provare: 1, dato: 2, nessuno: 3 };
  const lista = [...v.motivi].sort((a, b) => ordine[a.esito] - ordine[b.esito]);
  return `<section class="pannello" aria-labelledby="t-motivi">
    <div class="occhiello">Controlli sul verbale</div>
    <h2 id="t-motivi">Cosa abbiamo verificato</h2>
    <ul class="controlli">${lista.map((m) => {
      const [c, s, pill] = segno(m);
      return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(m.titolo)}</b> ${pill}<small>${esc(m.spiegazione)}${m.dato ? ` <button type="button" class="vai-a" data-vai="${m.dato}">Rispondi: ${esc(NOMI_DATI[m.dato] || m.dato)}</button>` : ''}</small></div></li>`;
    }).join('')}</ul>
  </section>`;
}

function pannelloScadenze(v, r) {
  if (!v.scadenze.length) return '';
  return `<section class="pannello" aria-labelledby="t-scad">
    <div class="occhiello">Calcolate dalla data di notifica</div>
    <h2 id="t-scad">Le scadenze</h2>
    <ul class="scadenze">${v.scadenze.map((s) => {
      const d = data(s.data);
      const cls = s.scaduta ? 'scaduta' : s.giorniMancanti <= 5 ? 'vicina' : '';
      const quando = s.scaduta ? 'scaduta' : s.giorniMancanti === 0 ? 'oggi' : `tra ${s.giorniMancanti} giorni`;
      const promemoria = s.scaduta ? '' : pulsantiCalendario({
        titolo: `${s.titolo}${r.numero_verbale ? ', verbale ' + r.numero_verbale : ''}`,
        data: s.data,
        descrizione: `${s.testo}${v.destinatari.prefetto && s.id === 'prefetto' ? ` PEC: ${v.destinatari.prefetto.pec}.` : ''} Promemoria creato con Faccio ricorso?: verifica sempre le date sul verbale.`,
      }, { conIcs: !incorporata() });
      return `<li class="${cls}"><span class="quando">${esc(d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' }))}<small>${quando}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${promemoria}</span></li>`;
    }).join('')}</ul>
  </section>`;
}

function pannelloCosti(v) {
  if (!v.costi) return `<section class="pannello"><div class="occhiello">Quanto rischi</div><h2>Costi a confronto</h2><p>Indica l'importo da pagare entro 60 giorni per confrontare le strade.</p></section>`;
  return `<section class="pannello" aria-labelledby="t-costi">
    <div class="occhiello">Quanto rischi</div>
    <h2 id="t-costi">Costi a confronto</h2>
    <div class="scorri"><table class="confronto">
      <thead><tr><th>Strada</th><th style="text-align:right">Costo subito</th><th style="text-align:right">Se perdi</th></tr></thead>
      <tbody>${v.costi.righe.map((c) => `<tr><td><b>${esc(c.strada)}</b><br><small style="color:var(--inchiostro-3)">${esc(c.nota)}</small></td><td class="euro-c">${eur(c.costo)}</td><td class="euro-c">${c.seRespinto === undefined ? '' : c.seRespinto === null ? 'tra minimo e massimo' : (c.id === 'gdp' ? 'fino a ' : 'almeno ') + eur(c.seRespinto)}</td></tr>`).join('')}</tbody>
    </table></div>
  </section>`;
}

function pannelloDocumento(r, v) {
  if (!r.tipo) return '';
  if (v.verdetto.tono === 'no' && /pagato|scaduti/.test(v.verdetto.titolo)) return '';
  if (v.verdetto.tono === 'neutro') return '';
  const strada = documentoAttivo || v.verdetto.strada || 'prefetto';
  const html = strada === 'gdp' ? ricorsoGiudiceDiPace(r, v) : ricorsoPrefetto(r, v);
  const p = v.destinatari.prefetto;
  const viaOrgano = r.invio_prefetto === 'organo';
  const pecInvio = strada === 'prefetto' ? (viaOrgano ? r.pec_organo : p?.pec) : null;
  const istruzioni = strada === 'gdp'
    ? [
      `<b>Paga</b> con pagoPA ${v.costi ? eur(v.costi.cu) : 'il contributo unificato'} di contributo unificato e 27 € di anticipazioni forfettarie: non servono più le marche da bollo.`,
      '<b>Deposita</b> il ricorso firmato, con le ricevute e gli allegati, nella cancelleria del Giudice di Pace del luogo della violazione, a mano o per raccomandata. Non via PEC né email: per chi non ha un avvocato non sono valide.',
      '<b>Vai all\'udienza</b> che ti verrà comunicata: se non ti presenti, il verbale viene convalidato.',
      'Il servizio online gdp.giustizia.it del Ministero aiuta a compilare, ma non sostituisce il deposito.',
    ]
    : [
      pecInvio
        ? `<b>Invia</b> il ricorso firmato dalla tua PEC a <b>${esc(pecInvio)}</b>${viaOrgano ? ' (ufficio che ha fatto il verbale)' : ''}, oppure con raccomandata con ricevuta di ritorno${p && !viaOrgano ? ` a ${esc(p.indirizzo)}` : ''}. L'email ordinaria non è accettata.`
        : '<b>Invia</b> il ricorso firmato per PEC o raccomandata con ricevuta di ritorno, alla Prefettura del luogo della violazione o all\'ufficio che ha fatto il verbale. Scegli la provincia per avere l\'indirizzo.',
      'Firma: con la PEC basta il documento firmato a mano e scansionato, più la copia di un documento d\'identità; oppure la firma digitale.',
      'Se il Prefetto non decide entro 180 giorni (210 se lo hai mandato direttamente alla Prefettura), il ricorso si intende accolto. Puoi seguire la pratica su sana.interno.it.',
    ];
  return `<section class="pannello" aria-labelledby="t-doc">
    <div class="occhiello">Il documento</div>
    <h2 id="t-doc">Il ricorso, pronto da completare</h2>
    <div class="si-no" role="tablist" aria-label="Destinatario del ricorso" style="margin:8px 0 14px">
      <label><input type="radio" name="doc" value="prefetto" ${strada === 'prefetto' ? 'checked' : ''}> Al Prefetto${v.verdetto.strada === 'prefetto' ? ' (consigliato)' : ''}</label>
      <label><input type="radio" name="doc" value="gdp" ${strada === 'gdp' ? 'checked' : ''}> Al Giudice di Pace${v.verdetto.strada === 'gdp' ? ' (consigliato)' : ''}</label>
    </div>
    <div class="foglio" id="foglio">${html}</div>
    <div class="azioni-doc">
      <button type="button" class="btn btn-primario" id="copia">Copia il testo</button>
      <button type="button" class="btn" id="stampa">Stampa o salva in PDF</button>
      ${pecInvio ? `<a class="btn" href="${esc(mailto(pecInvio, oggettoEmail(r), testoDa(html)))}">Apri nel programma di posta</a>` : ''}
      <span class="esito-copia" id="esito-copia" role="status"></span>
    </div>
    <h2 style="margin-top:18px;font-size:var(--s1)">Come inviarlo</h2>
    <ol class="passi">${istruzioni.map((i) => `<li>${i}</li>`).join('')}</ol>
  </section>`;
}

function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  const v = valuta(r);
  const toni = { si: 'si', forse: 'forse', no: 'no', dato: 'dato', neutro: 'neutro' };
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${toni[v.verdetto.tono]}">
      <div class="occhiello">${r.tipo ? 'Il nostro controllo' : 'Rispondi a quello che sai'}</div>
      <p class="titolo">${esc(v.verdetto.titolo)}</p>
      <p>${esc(v.verdetto.testo)}</p>
    </section>
    ${pannelloMotivi(v)}
    ${pannelloScadenze(v, r)}
    ${v.verdetto.tono === 'neutro' ? '' : pannelloCosti(v)}
    ${pannelloDocumento(r, v)}
    <section class="pannello"><div class="occhiello">Fonti, verificate l'11 ottobre 2026</div><ul class="fonti">${v.fonti.concat(...v.motivi.flatMap((m) => m.fonti)).filter((f, i, a) => a.findIndex((x) => x.url === f.url) === i).map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a></li>`).join('')}</ul></section>`;

  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => vaiAllaDomanda(b.dataset.vai)));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  $$('input[name="doc"]').forEach((i) => i.addEventListener('change', () => { documentoAttivo = i.value; disegna(modulo.risposte, { esempio: modulo.esempio }); }));
  $('#copia')?.addEventListener('click', () => copia(testoDa($('#foglio').innerHTML), $('#esito-copia')));
  $('#stampa')?.addEventListener('click', () => stampa($('#foglio').innerHTML));
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => { documentoAttivo = null; modulo.imposta(ESEMPI[b.dataset.esempio], { esempio: true }); }));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => modulo.azzera());
modulo.aggiorna();
montaFoto({
  contenitore: $('#foto'), strumento: 'Faccio ricorso?', domande: DOMANDE, oggi: new Date().toISOString().slice(0, 10),
  cosa: 'la prima pagina del verbale della multa',
  note: 'Il campo modo indica come è arrivato il verbale. data_notifica è la data in cui la persona lo ha ricevuto (ricevuta, avviso di giacenza o PEC): se sul verbale c\'è solo la data di spedizione, mettila in data_spedizione.',
  alRisultato: (r) => modulo.imposta({ ...modulo.risposte, ...r }),
});
