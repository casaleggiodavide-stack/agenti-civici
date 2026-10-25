// Copia di comune/modulo.js: non modificare qui, usa npm run sincronizza.
// Costruttore di questionari: dalle definizioni delle domande al modulo HTML,
// con domande che compaiono solo quando servono e risposte salvate sul dispositivo.
//
// Tipi di domanda: numero, euro, data, testo, area, si_no, scelta.
// Ogni domanda: { id, sezione, tipo, etichetta, aiuto?, opzioni?, visibile?(r), segnaposto? }

import { $, esc, numero, archivio } from './interfaccia.js';

function campo(d) {
  const id = 'q-' + d.id;
  const aiuto = d.aiuto ? `<p class="aiuto" id="${id}-aiuto">${esc(d.aiuto)}</p>` : '';
  const desc = d.aiuto ? ` aria-describedby="${id}-aiuto"` : '';
  const ph = d.segnaposto ? ` placeholder="${esc(d.segnaposto)}"` : '';
  switch (d.tipo) {
    case 'numero':
      return `<label for="${id}">${esc(d.etichetta)}</label>${aiuto}<input type="number" inputmode="numeric" id="${id}" name="${d.id}" style="max-width:140px"${desc}${ph}>`;
    case 'euro':
      return `<label for="${id}">${esc(d.etichetta)}</label>${aiuto}<div class="euro"><input type="text" inputmode="decimal" id="${id}" name="${d.id}"${desc}${ph || ' placeholder="es. 173,00"'}></div>`;
    case 'data':
      return `<label for="${id}">${esc(d.etichetta)}</label>${aiuto}<input type="date" id="${id}" name="${d.id}"${desc}>`;
    case 'testo':
      return `<label for="${id}">${esc(d.etichetta)}</label>${aiuto}<input type="text" id="${id}" name="${d.id}" autocomplete="off"${desc}${ph}>`;
    case 'area':
      return `<label for="${id}">${esc(d.etichetta)}</label>${aiuto}<textarea id="${id}" name="${d.id}"${desc}${ph}></textarea>`;
    case 'si_no':
      return `<span class="etichetta" id="${id}-et">${esc(d.etichetta)}</span>${aiuto}
        <div class="si-no" role="radiogroup" aria-labelledby="${id}-et">
          <label><input type="radio" id="${id}-si" name="${d.id}" value="si"> Sì</label>
          <label><input type="radio" id="${id}-no" name="${d.id}" value="no"> No</label>
          ${d.nonSo ? `<label><input type="radio" id="${id}-ns" name="${d.id}" value="ns"> Non so</label>` : ''}
        </div>`;
    case 'scelta':
      return `<span class="etichetta" id="${id}-et">${esc(d.etichetta)}</span>${aiuto}
        <div class="scelte" role="radiogroup" aria-labelledby="${id}-et">
          ${d.opzioni.map(([v, t], i) => `<label><input type="radio" id="${id}-${i}" name="${d.id}" value="${esc(v)}"> ${esc(t)}</label>`).join('')}
        </div>`;
    case 'elenco':
      return `<label for="${id}">${esc(d.etichetta)}</label>${aiuto}<select id="${id}" name="${d.id}"${desc}><option value="">Scegli…</option>${d.opzioni.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select>`;
    default:
      return '';
  }
}

/**
 * Crea il questionario dentro un <form>.
 * @returns {{ risposte: object, imposta(r): void, azzera(): void }}
 */
export function creaModulo({ form, sezioni, domande, chiave, alCambio }) {
  const memoria = archivio(chiave);
  const stato = { risposte: memoria.leggi({}), esempio: false };

  form.innerHTML = sezioni.map((s, i) => `
    <section class="sezione" id="s-${s.id}" aria-labelledby="t-${s.id}">
      <h2 id="t-${s.id}"><span class="n">${i + 1} di ${sezioni.length}</span>${esc(s.titolo)}</h2>
      ${s.aiuto ? `<p class="aiuto" style="margin:-4px 0 8px">${esc(s.aiuto)}</p>` : ''}
      ${domande.filter((d) => d.sezione === s.id).map((d) => `<div class="domanda" id="d-${d.id}">${campo(d)}</div>`).join('')}
    </section>`).join('');

  function leggi(ev) {
    const t = ev.target;
    const d = domande.find((x) => x.id === t.name);
    if (!d) return;
    const r = stato.risposte;
    if (d.tipo === 'numero') r[d.id] = t.value === '' ? undefined : Number(t.value);
    else if (d.tipo === 'euro') r[d.id] = numero(t.value);
    else if (d.tipo === 'si_no') r[d.id] = t.value === 'si' ? true : t.value === 'no' ? false : 'non_so';
    else r[d.id] = t.value === '' ? undefined : t.value;
    stato.esempio = false;
    aggiorna();
  }

  function visibilita() {
    for (const d of domande) {
      const vis = !d.visibile || d.visibile(stato.risposte);
      $('#d-' + d.id, form).hidden = !vis;
      if (!vis && stato.risposte[d.id] !== undefined) delete stato.risposte[d.id];
    }
    // Una sezione senza domande visibili sparisce.
    for (const s of sezioni) {
      const sue = domande.filter((d) => d.sezione === s.id);
      const el = $('#s-' + s.id, form);
      if (el) el.hidden = sue.length > 0 && sue.every((d) => d.visibile && !d.visibile(stato.risposte));
    }
    // Numerazione solo delle sezioni visibili.
    const visibili = sezioni.filter((s) => !$('#s-' + s.id, form)?.hidden);
    visibili.forEach((s, i) => { const n = $('#t-' + s.id + ' .n', form); if (n) n.textContent = `${i + 1} di ${visibili.length}`; });
  }

  function riempi() {
    const r = stato.risposte;
    for (const d of domande) {
      const v = r[d.id];
      const id = 'q-' + d.id;
      if (d.tipo === 'si_no') {
        $('#' + id + '-si', form).checked = v === true;
        $('#' + id + '-no', form).checked = v === false;
        const ns = $('#' + id + '-ns', form);
        if (ns) ns.checked = v === 'non_so';
      } else if (d.tipo === 'scelta') {
        d.opzioni.forEach(([val], i) => { $('#' + id + '-' + i, form).checked = v === val; });
      } else if (d.tipo === 'euro') {
        $('#' + id, form).value = v === undefined || v === null ? '' : Number(v).toLocaleString('it-IT', { maximumFractionDigits: 2 });
      } else {
        $('#' + id, form).value = v ?? '';
      }
    }
  }

  function aggiorna() {
    visibilita();
    if (!stato.esempio) memoria.scrivi(stato.risposte);
    alCambio(stato.risposte, stato);
  }

  form.addEventListener('input', leggi);
  form.addEventListener('change', leggi);
  riempi();

  return {
    get risposte() { return stato.risposte; },
    get esempio() { return stato.esempio; },
    imposta(r, { esempio = false } = {}) {
      stato.risposte = structuredClone(r);
      stato.esempio = esempio;
      riempi();
      aggiorna();
    },
    ricarica() {
      stato.risposte = memoria.leggi({});
      stato.esempio = false;
      riempi();
      aggiorna();
    },
    azzera() {
      memoria.cancella();
      stato.risposte = {};
      stato.esempio = false;
      riempi();
      aggiorna();
    },
    aggiorna,
  };
}
