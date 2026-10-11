// Piccoli strumenti condivisi dalle interfacce degli agenti civici.

export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const euroInteri = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const euroCent = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
/** Euro all'italiana: 1.200 €, 121,10 €. */
export const eur = (n) => (n === null || n === undefined ? '' : (Math.abs(n - Math.round(n)) < 0.005 ? euroInteri : euroCent).format(n));

/** Numero da testo all'italiana: «1.234,50» → 1234.5. */
export function numero(t) {
  const s = String(t ?? '').trim();
  if (!s) return undefined;
  const n = Number(s.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/** Archivio locale che non si rompe se il browser lo blocca. */
export function archivio(chiave) {
  return {
    leggi(predefinito) {
      try { const t = localStorage.getItem(chiave); return t ? JSON.parse(t) : predefinito; } catch { return predefinito; }
    },
    scrivi(valore) {
      try { localStorage.setItem(chiave, JSON.stringify(valore)); return true; } catch { return false; }
    },
    cancella() {
      try { localStorage.removeItem(chiave); } catch { /* niente */ }
    },
  };
}

/** Copia negli appunti; se il browser non lo consente, seleziona il testo da copiare a mano. */
export async function copia(testo, avviso) {
  try {
    await navigator.clipboard.writeText(testo);
    if (avviso) { avviso.textContent = 'Copiato.'; setTimeout(() => { avviso.textContent = ''; }, 2500); }
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = testo;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    if (avviso) avviso.textContent = ok ? 'Copiato.' : 'Il browser non permette di copiare: seleziona il testo del documento e copialo a mano.';
    return ok;
  }
}

/** Stampa (o salva in PDF) soltanto il documento indicato. */
export function stampa(htmlDocumento) {
  let box = $('#stampa-solo');
  if (!box) {
    box = document.createElement('div');
    box.id = 'stampa-solo';
    box.className = 'solo-stampa';
    document.body.appendChild(box);
  }
  box.innerHTML = `<div class="foglio">${htmlDocumento}</div>`;
  window.print();
}

/** Link mailto con oggetto e testo (per PEC o email, se il programma di posta è configurato). */
export function mailto(destinatario, oggetto, corpo) {
  return `mailto:${encodeURIComponent(destinatario || '')}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(corpo)}`;
}

/** Da HTML del documento a testo semplice, per copiarlo in una PEC. */
export function testoDa(html) {
  const div = document.createElement('div');
  div.innerHTML = html.replace(/<\/(p|li|ol|ul|div)>/g, '</$1>\n').replace(/<br\s*\/?>/g, '\n').replace(/<li>/g, '<li>• ');
  return div.textContent.replace(/\n{3,}/g, '\n\n').trim();
}

/** Porta in vista una domanda e la evidenzia. */
export function vaiAllaDomanda(id) {
  const el = document.getElementById('d-' + id);
  if (!el) return;
  el.hidden = false;
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  el.classList.remove('evidenzia');
  void el.offsetWidth;
  el.classList.add('evidenzia');
  el.querySelector('input, select, textarea, button')?.focus({ preventScroll: true });
}
