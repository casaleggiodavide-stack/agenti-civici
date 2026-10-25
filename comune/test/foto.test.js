// Lettura da foto senza browser: istruzioni e controllo dei campi letti.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { istruzioniLettura, leggiFoto } from '../foto.js';
import { DOMANDE as D_MULTA } from '../../faccio-ricorso/src/domande.js';

test('istruzioni: niente dati personali nel dizionario, formato JSON richiesto', () => {
  const t = istruzioniLettura({ strumento: 'Faccio ricorso?', cosa: 'il verbale', domande: D_MULTA, oggi: '2026-10-25' });
  assert.match(t, /- data_violazione \(AAAA-MM-GG\)/);
  assert.match(t, /- numero_verbale/);
  assert.doesNotMatch(t, /- codice_fiscale/);
  assert.doesNotMatch(t, /- nome \(/);
  assert.match(t, /"risposte"/);
});

test('leggiFoto: tiene i campi validi, scarta dati personali e valori inventati', async () => {
  let ricevuto = null;
  const finto = {
    immagini: { maxCount: 1, maxInputBytes: 5e6, mediaTypes: ['image/jpeg', 'image/png'] },
    sample: { json: async (testo, opz) => { ricevuto = opz; return { documento: 'verbale della Polizia locale', leggibile: true, risposte: { tipo: 'semaforo', data_violazione: '2026-04-02', importo: '182,40', provincia: 'TO', numero_verbale: 'V/2026/118422', codice_fiscale: 'RSSMRA80A01H501U', nome: 'Mario Rossi', modo: 'piccione' }, dubbi: ['data_notifica: timbro poco leggibile'] }; } },
  };
  const file = { type: 'image/jpeg', size: 1000 };
  const r = await leggiFoto({ lettore: finto, file, strumento: 'Faccio ricorso?', cosa: 'il verbale', domande: D_MULTA, oggi: '2026-10-25' });
  assert.equal(ricevuto.images[0], file);
  assert.equal(r.risposte.importo, 182.4);
  assert.equal(r.risposte.numero_verbale, 'V/2026/118422');
  assert.equal(r.risposte.codice_fiscale, undefined);
  assert.equal(r.risposte.nome, undefined);
  assert.equal(r.risposte.modo, undefined);
  assert.ok(r.avvisi.some((a) => a.startsWith('codice_fiscale:')));
  assert.equal(r.dubbi.length, 1);
});
