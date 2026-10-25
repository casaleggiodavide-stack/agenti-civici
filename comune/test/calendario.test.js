import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linkGoogle, linkOutlook, ics } from '../calendario.js';

const P = { titolo: 'Ricorso al Prefetto, verbale n. 12', data: '2026-11-02', descrizione: 'PEC: protocollo.prefto@pec.interno.it; ultimo giorno, meglio prima.' };

test('Google Calendar: evento di tutto il giorno nel giorno di scadenza', () => {
  const u = new URL(linkGoogle(P));
  assert.equal(u.hostname, 'calendar.google.com');
  assert.equal(u.searchParams.get('dates'), '20261102/20261103');
  assert.equal(u.searchParams.get('text'), P.titolo);
});

test('Outlook: data di inizio e fine, tutto il giorno', () => {
  const u = new URL(linkOutlook(P));
  assert.equal(u.searchParams.get('startdt'), '2026-11-02');
  assert.equal(u.searchParams.get('enddt'), '2026-11-03');
  assert.equal(u.searchParams.get('allday'), 'true');
});

test('.ics valido: date, avviso 3 giorni prima, caratteri protetti, righe piegate', () => {
  const t = ics({ ...P, descrizione: P.descrizione.repeat(4) }, new Date('2026-10-25T10:00:00Z'));
  assert.match(t, /^BEGIN:VCALENDAR\r\n/);
  assert.match(t, /DTSTART;VALUE=DATE:20261102\r\n/);
  assert.match(t, /DTEND;VALUE=DATE:20261103\r\n/);
  assert.match(t, /TRIGGER:-P3D/);
  assert.match(t, /SUMMARY:Ricorso al Prefetto\\, verbale n. 12/);
  assert.ok(t.split('\r\n').every((r) => new TextEncoder().encode(r).length <= 75));
  assert.match(t, /END:VCALENDAR\r\n$/);
});

test('data non valida: errore chiaro', () => {
  assert.throws(() => linkGoogle({ titolo: 'x', data: '2026-13' }), /Data non valida/);
});
