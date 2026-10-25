// È una truffa?: i casi di prova della ricerca del 25/10/2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuta } from '../src/regole.js';
import { analizza, maschera, registrato, domini, sitiPubblici } from '../src/segnali.js';
import DATI from '../../chiedo-gli-atti/src/dati/enti.js';

const OGGI = '2026-10-25';
const siti = sitiPubblici(DATI);
const id = (v) => v.segnali.map((s) => s.id);

test('pacco in giacenza da 1,99 € su un dominio che imita Poste', () => {
  const v = valuta({ canale: 'sms', testo: 'Il tuo pacco è in giacenza, paga 1,99 € per la riconsegna su poste-consegna-it.info', chi: 'corriere' }, { oggi: OGGI, siti });
  assert.equal(v.livello, 'forte');
  assert.ok(id(v).some((x) => x.startsWith('imita-')));
  assert.ok(id(v).includes('piccola'));
  assert.ok(id(v).includes('pacco'));
});

test('falsa sanzione pagoPA su un dominio che non è della PA', () => {
  const v = valuta({ canale: 'sms', testo: 'pagoPA: sanzione non pagata, evita la maggiorazione entro 24 ore: https://avvisi-pagamenti-online.com/p', chi: 'pa' }, { oggi: OGGI, siti });
  assert.equal(v.livello, 'forte');
  assert.ok(id(v).includes('urgenza'));
  assert.ok(id(v).some((x) => x.startsWith('nonpa-') || x.startsWith('imita-')));
});

test('finto antifrode: conto di sicurezza; bonifico già fatto, rimborso non automatico', () => {
  const v = valuta({ canale: 'telefono', testo: 'Il servizio antifrode della banca mi dice di spostare i risparmi su un conto di sicurezza con un bonifico istantaneo', chi: 'banca', chiede_soldi: true, fatto: 'pagato', come: 'istantaneo', data_addebito: '2026-10-24' }, { oggi: OGGI, siti });
  assert.equal(v.livello, 'forte');
  assert.ok(id(v).includes('conto'));
  assert.ok(v.azioni.some((a) => /non è automatico/.test(a)));
});

test('sito oscurato dalla CONSOB', () => {
  const v = valuta({ canale: 'chat', testo: 'Entra nel gruppo e investi su https://rocketprobit.com', chi: 'investimento' }, { oggi: OGGI, siti });
  assert.ok(id(v).includes('consob-rocketprobit.com'));
  assert.ok(v.azioni.some((a) => /CONSOB/.test(a)));
});

test('ciao mamma, nuovo numero', () => {
  const v = valuta({ canale: 'chat', testo: 'Ciao mamma, ho cambiato numero, mi fai un bonifico urgente?' }, { oggi: OGGI, siti });
  assert.ok(id(v).includes('familiare'));
});

test('email della banca senza link: nessun segnale forte, ma mai «sicuro»', () => {
  const v = valuta({ canale: 'email', testo: 'Gentile cliente, le nuove condizioni sono disponibili nell\'area riservata della app.', chi: 'banca' }, { oggi: OGGI, siti });
  assert.notEqual(v.livello, 'forte');
  assert.doesNotMatch(JSON.stringify(v.verdetto), /è sicuro/i);
});

test('addebito con carta del 1/9/2026: contestare entro il 1/10/2027, querela entro 3 mesi', () => {
  const v = valuta({ fatto: 'pagato', come: 'carta', data_addebito: '2026-09-01', data_scoperta: '2026-10-25', testo: 'addebito non riconosciuto' }, { oggi: OGGI, siti });
  assert.equal(v.scadenze.find((s) => /contestare/.test(s.titolo)).data, '2027-10-01');
  assert.equal(v.scadenze.find((s) => /querela/.test(s.titolo)).data, '2027-01-23');
});

test('domini ufficiali e PA riconosciuti, link e dati personali', () => {
  assert.equal(registrato('www.agenziaentrate.gov.it'), 'agenziaentrate.gov.it');
  assert.deepEqual(domini('vai su https://www.poste.it/x e su bit.ly/abc'), ['poste.it', 'bit.ly']);
  assert.equal(analizza('https://www.poste.it/prodotti').segnali.length, 0);
  assert.ok(siti.has('lecce.it'));
  assert.ok(!analizza('https://www.comune.lecce.it/pagare', { siti }).segnali.length);
  const m = maschera('IBAN IT60X0542811101000000123456, carta 4111 1111 1111 1111, tel 333 1234567, codice 482913');
  assert.doesNotMatch(m, /0542811101|4111|1234567|482913/);
});
