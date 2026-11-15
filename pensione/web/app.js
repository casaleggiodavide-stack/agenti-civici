// Interfaccia di «Quando vado in pensione?». Tutto gira nel browser:
// le risposte restano sul dispositivo e non vanno mai nell'indirizzo della pagina.

import { $, $$, esc } from '../src/comune/interfaccia.js';
import { creaModulo } from '../src/comune/modulo.js';
import { pulsantiCalendario, scaricaIcs, incorporata } from '../src/comune/calendario.js';
import { vaiAllaDomanda } from '../src/comune/interfaccia.js';
import { SEZIONI, DOMANDE } from '../src/domande.js';
import { datePensione, scrittoData, durata, VERIFICATO, FONTI_NORME } from '../src/regole.js';

const ESEMPI = {
  vecchiaia: { nascita_mese: '3', nascita_anno: 1960, sesso: 'uomo', contributi_anni: 28, contributi_mesi: 0, mesi_anno: 12, prima_1996: true, gestione: 'privato', lavoro: 'no', precoce: false, invalidita74: false, caregiver: false, disoccupato: 'no' },
  anticipata: { nascita_mese: '9', nascita_anno: 1966, sesso: 'donna', figli: 2, contributi_anni: 40, contributi_mesi: 6, mesi_anno: 12, prima_1996: true, gestione: 'pubblico_locale', lavoro: 'no', precoce: false, invalidita74: false, caregiver: false, disoccupato: 'no' },
  precoce: { nascita_mese: '5', nascita_anno: 1967, sesso: 'uomo', contributi_anni: 40, contributi_mesi: 2, mesi_anno: 12, prima_1996: true, gestione: 'privato', lavoro: 'gravoso_7_10', precoce: true, invalidita74: false, caregiver: false, disoccupato: 'no' },
  contributivo: { nascita_mese: '6', nascita_anno: 1972, sesso: 'donna', figli: 1, contributi_anni: 24, contributi_mesi: 0, mesi_anno: 12, prima_1996: false, gestione: 'separata', lavoro: 'no', precoce: false, invalidita74: false, caregiver: false, disoccupato: 'no' },
  ape: { nascita_mese: '4', nascita_anno: 1963, sesso: 'donna', figli: 2, contributi_anni: 29, contributi_mesi: 0, mesi_anno: 0, prima_1996: true, gestione: 'privato', lavoro: 'no', precoce: false, invalidita74: false, caregiver: true, disoccupato: 'no' },
};

const modulo = creaModulo({ form: $('#questionario'), sezioni: SEZIONI, domande: DOMANDE, chiave: 'pensione-v1', alCambio: disegna });

const NOMI = Object.fromEntries(DOMANDE.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
NOMI.nascita = 'Mese e anno di nascita';
NOMI.contributi = 'Anni di contributi già versati';
const VAI = { nascita: 'nascita_mese', contributi: 'contributi_anni' };
const SEGNI = { si: ['c-si', '✓'], no: ['c-no', '–'], dato: ['c-nd', '?'] };
const TONO = { si: 'si', dato: 'forse', no: 'neutro' };
const PAROLA = { si: 'Possibile', dato: 'Serve un dato', no: 'Non per te' };
const PILL = { si: 'p-si', dato: 'p-dato', no: 'p-neutro' };
const fonte = (k) => FONTI_NORME[k] && `<a href="${esc(FONTI_NORME[k].url)}" target="_blank" rel="noopener">${esc(FONTI_NORME[k].titolo)}</a>`;
const breve = (iso) => (iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');
const minuscolo = (t) => (/^[A-Z][a-zàèéìòù]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
const giorniA = (iso, oggi) => Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(oggi + 'T12:00:00Z')) / 86400000);

let ultimo = null;
let ordine = { k: 'data', verso: 1 };

function righe(e) {
  const val = (u) => (ordine.k === 'nome' ? u.nome : ordine.k === 'esito' ? { si: 0, dato: 1, no: 2 }[u.esito] : u.decorrenza || '9999');
  return [...e.uscite].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * ordine.verso)
    .map((u) => `<tr><td><a href="#u-${u.id}">${esc(u.nome)}</a></td><td class="n">${u.decorrenza ? esc(breve(u.decorrenza)) + (u.previsione ? ' <small>previsione</small>' : '') : '—'}</td><td><span class="pill ${PILL[u.esito]}">${PAROLA[u.esito]}</span></td></tr>`).join('');
}

function scheda(u) {
  const quando = u.decorrenza
    ? `<p class="quando-uscita"><b>${u.esito === 'dato' ? 'Se confermi i dati: dal ' : 'Dal '}${esc(scrittoData(u.decorrenza))}</b>${u.maturazione ? ` · requisiti maturati a ${esc(new Date(u.maturazione + '-15T12:00:00Z').toLocaleDateString('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' }))}${u.finestra ? `, poi ${esc(durata(u.finestra))} di finestra` : ''}` : ''}${u.previsione ? ' · previsione' : ''}</p>`
    : '';
  return `<section class="pannello parere uscita" id="u-${u.id}" data-tono="${TONO[u.esito]}" aria-labelledby="t-${u.id}">
    <div class="occhiello">${PAROLA[u.esito]}${u.sperimentale ? ' · misura sperimentale' : ''}</div>
    <h2 id="t-${u.id}">${esc(u.nome)}</h2>
    <p>${esc(u.breve)}</p>
    ${quando}
    <ul class="controlli">${u.requisiti.map((r) => { const [c, s] = SEGNI[r.esito]; return `<li class="${c}"><span class="segno" aria-hidden="true">${s}</span><div><b>${esc(r.testo)}</b><span class="sr-only">: ${{ si: 'sì', no: 'no', dato: 'serve un dato' }[r.esito]}</span>${r.nota ? `<small>${esc(r.nota)}</small>` : ''}</div></li>`; }).join('')}</ul>
    ${u.manca.length ? `<p class="manca"><b>Cosa manca.</b> ${esc(u.manca.join(' '))}</p>` : ''}
    ${u.note.length ? `<ul class="note">${u.note.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    <p class="fonti-uscita">${u.fonti.map(fonte).filter(Boolean).join(' · ')}</p>
  </section>`;
}

function disegna(r, stato) {
  $('#avviso-esempio').hidden = !stato.esempio;
  const e = datePensione(r);
  ultimo = e;
  const verificato = scrittoData(VERIFICATO);
  const mancanti = e.mancanti.map((m) => `<button type="button" class="vai-a" data-vai="${VAI[m] || m}">${esc(NOMI[m] || m)}</button>`).join(' ');
  if (!e.uscite.length) {
    $('#esito').innerHTML = `<section class="pannello verdetto" data-tono="neutro"><div class="occhiello">Inizia da qui</div>
      <p class="titolo">${esc(e.errore || 'Dimmi quando sei nato e quanti contributi hai')}</p>
      <p>Con mese e anno di nascita e gli anni di contributi calcolo, per ogni uscita prevista dalla legge, la prima data possibile.</p>
      ${mancanti ? `<p class="mancanti">Rispondi: ${mancanti}</p>` : ''}</section>`;
    collega();
    return;
  }
  const c = e.prima || e.primaForse;
  const tono = e.prima ? 'si' : c ? 'forse' : 'no';
  const titolo = e.prima
    ? `Dal ${scrittoData(e.prima.decorrenza)}: ${minuscolo(e.prima.nome)}`
    : c ? `Forse dal ${scrittoData(c.decorrenza)}: ${minuscolo(c.nome)}` : 'Con questi dati non trovo una data';
  const sotto = e.prima
    ? `È la prima uscita possibile con i dati che hai indicato${e.prima.previsione ? ', ma dipende dai requisiti dal 2029 che non sono ancora fissati' : ''}. Sotto trovi tutte le altre, con i requisiti uno per uno.`
    : c ? 'Per confermarla mi serve ancora qualche risposta: la trovi sotto, uscita per uscita.' : 'Controlla i contributi e i mesi che versi ogni anno.';
  const forse = e.prima && e.primaForse && e.primaForse.decorrenza < e.prima.decorrenza ? e.primaForse : null;
  const dettoForse = forse ? `<p>Forse prima: dal <b>${esc(scrittoData(forse.decorrenza))}</b> con ${esc(minuscolo(forse.nome))}, se confermi ${esc((forse.requisiti.find((x) => x.esito === 'dato')?.testo || 'i dati che mancano').replace(/^./, (x) => x.toLowerCase()))}.</p>` : '';
  const ad = e.adeguamenti;
  $('#esito').innerHTML = `
    <section class="pannello verdetto" data-tono="${tono}">
      <div class="occhiello">La prima data possibile</div>
      <p class="titolo">${esc(titolo)}</p>
      <p>${esc(sotto)}</p>
      ${dettoForse}
      ${mancanti ? `<p class="mancanti">Per un calcolo completo rispondi anche: ${mancanti}</p>` : ''}
    </section>
    <section class="pannello" aria-labelledby="t-tutte"><div class="occhiello">Uscita per uscita</div><h2 id="t-tutte">Tutte le pensioni previste oggi</h2>
      <div class="scorri"><table class="confronto ordinabile" id="tab-uscite"><thead><tr>
        <th scope="col" data-k="nome"><button type="button">Uscita</button></th>
        <th scope="col" data-k="data" aria-sort="ascending"><button type="button">Prima data</button></th>
        <th scope="col" data-k="esito"><button type="button">Esito</button></th>
      </tr></thead><tbody>${righe(e)}</tbody></table></div>
    </section>
    ${e.scadenze.length ? `<section class="pannello" aria-labelledby="t-scad"><div class="occhiello">Da segnare</div><h2 id="t-scad">Le scadenze</h2>
      <ul class="scadenze">${e.scadenze.map((s) => { const g = giorniA(s.data, e.oggi); return `<li class="${g <= 15 ? 'vicina' : ''}"><span class="quando">${esc(breve(s.data))}<small>${g === 0 ? 'oggi' : `tra ${g} giorni`}</small></span><span class="cosa"><b>${esc(s.titolo)}</b><span>${esc(s.testo)}</span>${pulsantiCalendario({ titolo: s.titolo, data: s.data, descrizione: `${s.testo} Promemoria creato con Quando vado in pensione?: verifica sempre le date con l'INPS o un patronato.` }, { conIcs: !incorporata() })}</span></li>`; }).join('')}</ul></section>` : ''}
    ${e.uscite.map(scheda).join('')}
    <section class="pannello" aria-labelledby="t-adeg"><div class="occhiello">Speranza di vita</div><h2 id="t-adeg">Come salgono i requisiti</h2>
      <p>Il decreto del 19 dicembre 2025 alza i requisiti di 3 mesi; la legge di bilancio 2026 ne applica 1 nel 2027 e tutti e 3 dal 2028. Dal 2029 servirà un nuovo decreto: per ora valgono i numeri del 2028.</p>
      <div class="scorri"><table class="confronto"><thead><tr><th scope="col">Anno</th><th scope="col">Vecchiaia</th><th scope="col">Anticipata uomini</th><th scope="col">Anticipata donne</th><th scope="col">Contributiva</th><th scope="col">Precoci</th></tr></thead>
      <tbody>${ad.map((x) => `<tr><td>${x.anno}${x.previsione ? ' e oltre*' : ''}</td><td>${esc(x.vecchiaia)}</td><td>${esc(x.anticipata_uomini)}</td><td>${esc(x.anticipata_donne)}</td><td>${esc(x.contributiva)}</td><td>${esc(x.precoci)}</td></tr>`).join('')}</tbody></table></div>
      <p class="aiuto">* Previsione: il decreto per il 2029-2030 non c'è ancora. Gravosi e usuranti con almeno 30 anni di contributi restano ai requisiti del 2026 fino al 2028.</p>
    </section>
    <section class="pannello attenzione" aria-labelledby="t-avv"><div class="occhiello">Prima di decidere</div><h2 id="t-avv">Avvertenze</h2>
      <ul class="passi">${e.avvertenze.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      <p class="azioni-doc"><a class="btn btn-primario" href="${esc(FONTI_NORME.inps_pensione_futura.url)}" target="_blank" rel="noopener">La mia pensione futura (INPS)</a><a class="btn" href="${esc(FONTI_NORME.inps_posizione.url)}" target="_blank" rel="noopener">Il tuo estratto conto</a></p>
    </section>
    <section class="pannello"><div class="occhiello">Fonti, verificate il ${esc(verificato)}</div><ul class="fonti">${e.fonti.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a></li>`).join('')}</ul></section>`;
  collega();
}

function collega() {
  $$('[data-vai]').forEach((b) => b.addEventListener('click', () => vaiAllaDomanda(b.dataset.vai)));
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => scaricaIcs(JSON.parse(b.dataset.ics))));
  const t = $('#tab-uscite');
  if (!t) return;
  $$('th', t).forEach((th) => { th.removeAttribute('aria-sort'); if (th.dataset.k === ordine.k) th.setAttribute('aria-sort', ordine.verso > 0 ? 'ascending' : 'descending'); });
  $$('th button', t).forEach((b) => b.addEventListener('click', () => {
    const k = b.closest('th').dataset.k;
    ordine = { k, verso: ordine.k === k ? -ordine.verso : 1 };
    $$('th', t).forEach((x) => x.removeAttribute('aria-sort'));
    b.closest('th').setAttribute('aria-sort', ordine.verso > 0 ? 'ascending' : 'descending');
    $('tbody', t).innerHTML = righe(ultimo);
  }));
}

$$('[data-esempio]').forEach((b) => b.addEventListener('click', () => modulo.imposta({ ...ESEMPI[b.dataset.esempio] }, { esempio: true })));
$('#esci-esempio').addEventListener('click', () => modulo.ricarica());
$('#cancella').addEventListener('click', () => modulo.azzera());
modulo.aggiorna();
