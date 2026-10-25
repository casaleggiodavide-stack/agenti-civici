// Copia di comune/calendario.js: non modificare qui, usa npm run sincronizza.
// Promemoria delle scadenze: ogni termine calcolato dagli agenti civici
// diventa un evento di calendario. Tre forme:
//   - link a Google Calendar e a Outlook (funzionano ovunque, anche nelle
//     pagine pubblicate su claude.ai dove i file .ics non si possono salvare);
//   - file .ics con avviso qualche giorno prima (per il sito pubblico).
// Gli eventi sono «tutto il giorno», nel giorno di scadenza.

import { data, iso, aggiungiGiorni } from './date.js';

const compatta = (d) => iso(d).replaceAll('-', '');

/**
 * @param {{titolo: string, data: string, descrizione?: string, anticipo?: number}} p
 *   data 'AAAA-MM-GG'; anticipo = giorni di preavviso per l'avviso dell'.ics (default 3)
 */
export function evento(p) {
  const giorno = data(p.data);
  if (!giorno) throw new Error('Data non valida: ' + p.data);
  return { titolo: String(p.titolo).slice(0, 200), giorno, descrizione: String(p.descrizione || '').slice(0, 1500), anticipo: p.anticipo ?? 3 };
}

export function linkGoogle(p) {
  const e = evento(p);
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.titolo,
    dates: `${compatta(e.giorno)}/${compatta(aggiungiGiorni(e.giorno, 1))}`,
    details: e.descrizione,
  });
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}

export function linkOutlook(p) {
  const e = evento(p);
  const q = new URLSearchParams({
    subject: e.titolo,
    startdt: iso(e.giorno),
    enddt: iso(aggiungiGiorni(e.giorno, 1)),
    allday: 'true',
    body: e.descrizione,
  });
  return 'https://outlook.live.com/calendar/0/action/compose?' + q.toString();
}

/** Testo da scrivere in un campo .ics: virgole, punti e virgola, a capo protetti. */
const icsTesto = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Righe .ics piegate a 75 ottetti come chiede la RFC 5545. */
function piega(riga) {
  const out = [];
  let resto = riga;
  const enc = new TextEncoder();
  while (enc.encode(resto).length > 75) {
    let n = 75;
    while (enc.encode(resto.slice(0, n)).length > 75) n--;
    out.push(resto.slice(0, n));
    resto = ' ' + resto.slice(n);
  }
  out.push(resto);
  return out.join('\r\n');
}

/** Un calendario .ics con uno o più eventi. `adesso` serve solo a DTSTAMP (test). */
export function ics(eventi, adesso = new Date()) {
  const stamp = adesso.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const righe = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Agenti civici//Promemoria//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  (Array.isArray(eventi) ? eventi : [eventi]).forEach((p, i) => {
    const e = evento(p);
    righe.push(
      'BEGIN:VEVENT',
      `UID:${compatta(e.giorno)}-${i}-${Math.abs(hash(e.titolo))}@agenti-civici`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compatta(e.giorno)}`,
      `DTEND;VALUE=DATE:${compatta(aggiungiGiorni(e.giorno, 1))}`,
      `SUMMARY:${icsTesto(e.titolo)}`,
      `DESCRIPTION:${icsTesto(e.descrizione)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsTesto(e.titolo)}`, `TRIGGER:-P${e.anticipo}D`, 'END:VALARM',
      'END:VEVENT',
    );
  });
  righe.push('END:VCALENDAR');
  return righe.map(piega).join('\r\n') + '\r\n';
}

function hash(s) {
  let h = 0;
  for (const c of s) h = (Math.imul(h, 31) + c.codePointAt(0)) | 0;
  return h;
}

/** HTML dei pulsanti «aggiungi al calendario» per una scadenza. `conIcs` solo fuori da claude.ai. */
export function pulsantiCalendario(p, { conIcs = false } = {}) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const etichetta = esc(p.titolo);
  return `<span class="calendario" role="group" aria-label="Aggiungi al calendario: ${etichetta}">`
    + `<a href="${esc(linkGoogle(p))}" target="_blank" rel="noopener">Google Calendar</a>`
    + `<a href="${esc(linkOutlook(p))}" target="_blank" rel="noopener">Outlook</a>`
    + (conIcs ? `<button type="button" class="link" data-ics='${esc(JSON.stringify(p))}'>File .ics</button>` : '')
    + '</span>';
}

/** Fuori da claude.ai: scarica un .ics creato nel browser. */
export function scaricaIcs(p) {
  const blob = new Blob([ics(p)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (p.titolo || 'scadenza').replace(/[^\p{L}\p{N} _-]+/gu, '').slice(0, 60).trim() + '.ics';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/** Siamo dentro una pagina pubblicata su claude.ai (dove i download diretti sono bloccati)? */
export const dentroClaude = () => typeof window !== 'undefined' && window.parent !== window;
