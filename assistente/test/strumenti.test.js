// Gli strumenti dell'assistente provati come li chiamerebbe Claude.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creaStrumenti, normalizza } from '../src/strumenti.js';
import { istruzioni } from '../src/istruzioni.js';
import { DOMANDE as D_MULTA } from '../../faccio-ricorso/src/domande.js';

function banco() {
  const visto = { risultati: [], documenti: [], promemoria: [], progresso: [] };
  const strumenti = creaStrumenti({
    oggi: '2026-10-25',
    mostraRisultato: (tipo, dati) => visto.risultati.push({ tipo, dati }),
    mostraDocumento: (d) => visto.documenti.push(d),
    mostraPromemoria: (p) => visto.promemoria.push(p),
    progresso: (t) => visto.progresso.push(t),
  });
  const t = Object.fromEntries(strumenti.map((s) => [s.name, s]));
  return { t, visto, strumenti };
}

test('nove strumenti, nomi e schemi entro i limiti della piattaforma', () => {
  const { strumenti } = banco();
  assert.equal(strumenti.length, 9);
  for (const s of strumenti) {
    assert.match(s.name, /^[A-Za-z0-9_-]{1,128}$/);
    assert.ok(new TextEncoder().encode(s.description).length <= 1024, s.name);
    assert.ok(JSON.stringify(s.inputSchema).length <= 4096, s.name);
    assert.equal(s.inputSchema.type, 'object');
  }
});

test('istruzioni: regole chiave e dizionari dei tre strumenti', () => {
  const t = istruzioni('2026-10-25');
  assert.match(t, /SOLO dai risultati degli strumenti/);
  assert.match(t, /codice fiscale/);
  assert.match(t, /- isee \(numero in euro\)/);
  assert.match(t, /- data_violazione \(AAAA-MM-GG\)/);
  assert.match(t, /- da_pubblicare \(si\|no\|non_so\)/);
  assert.doesNotMatch(t, /- codice_fiscale/);
  assert.ok(new TextEncoder().encode(t).length < 20000);
});

test('normalizza: converte i tipi, scarta valori non validi e dati personali, e lo dice', () => {
  const { risposte, avvisi } = normalizza(D_MULTA, { importo: '182,40', gia_pagato: 'no', tipo: 'velocita', modo: 'piccione', codice_fiscale: 'RSSMRA80A01H501U', data_violazione: '2026-06-10', inventato: 3 });
  assert.equal(risposte.importo, 182.4);
  assert.equal(risposte.gia_pagato, false);
  assert.equal(risposte.tipo, 'velocita');
  assert.equal(risposte.modo, undefined);
  assert.equal(risposte.codice_fiscale, undefined);
  assert.ok(avvisi.some((a) => a.startsWith('modo:')));
  assert.ok(avvisi.some((a) => a.startsWith('codice_fiscale:')));
  assert.ok(avvisi.some((a) => a.startsWith('inventato:')));
});

test('valuta_prestazioni: pensionata sola, risultati e pannello', () => {
  const { t, visto } = banco();
  const r = t.valuta_prestazioni.execute({ risposte: { eta: 78, cittadinanza: 'italiana', anni_residenza: 78, coniuge: false, figli: [], altri_adulti: 0, isee: '8.200', reddito_personale: 7600, reddito_familiare: 7600, patrimonio_mobiliare: 5000, altri_immobili: 0, lavoro: 'pensionato', anni_contributi: 17, pensione_tipo: 'minima', casa: 'proprieta', utenze_intestate: true } });
  assert.ok(r.spettano.some((p) => p.nome.startsWith('Quattordicesima')));
  assert.ok(r.spettano.every((p) => p.fonte && p.fonte.url.startsWith('https://')));
  assert.equal(visto.risultati[0].tipo, 'prestazioni');
  assert.ok(JSON.stringify(r).length < 32000);
});

test('valuta_multa e mostra_ricorso: notifica tardiva, ricorso al Prefetto nel pannello', () => {
  const { t, visto } = banco();
  const risposte = { tipo: 'semaforo', data_violazione: '2026-04-02', modo: 'posta', data_notifica: '2026-09-20', data_spedizione: '2026-07-10', veicolo_tuo: true, provincia: 'TO', importo: 182.4, spese: 15.4 };
  const r = t.valuta_multa.execute({ risposte });
  assert.equal(r.verdetto.tono, 'si');
  assert.equal(r.prefettura.pec, 'protocollo.prefto@pec.interno.it');
  const d = t.mostra_ricorso.execute({ risposte, destinatario: 'prefetto' });
  assert.equal(d.mostrato, true);
  assert.match(visto.documenti[0].html, /art\. 201, comma 5/);
  assert.equal(visto.documenti[0].pec, 'protocollo.prefto@pec.interno.it');
});

test('cerca_ente e valuta_accesso: Comune di Lecce, FOIA, documento nel pannello', async () => {
  const { t, visto } = banco();
  const enti = await t.cerca_ente.execute({ testo: 'comune di lecce' });
  assert.equal(enti[0].nome, 'Comune di Lecce');
  const risposte = { cosa: 'Elenco degli incarichi di consulenza affidati nel 2025 con importo e affidatario', da_pubblicare: 'no', riguarda_te: false, formato: 'aperto', canale: 'pec' };
  const r = await t.valuta_accesso.execute({ risposte, ente_nome: 'Comune di Lecce' });
  assert.match(r.tipo.nome, /generalizzato/);
  assert.equal(r.ente.regione, 'Puglia');
  await t.mostra_documento_accesso.execute({ risposte, ente_nome: 'Comune di Lecce', documento: 'richiesta' });
  assert.match(visto.documenti[0].html, /art\. 5, comma 2/);
});

test('promemoria: data valida mostrata, data inventata rifiutata con errore leggibile', () => {
  const { t, visto } = banco();
  t.promemoria.execute({ titolo: 'Ricorso al Prefetto', data: '2026-11-19' });
  assert.equal(visto.promemoria[0].data, '2026-11-19');
  assert.throws(() => t.promemoria.execute({ titolo: 'x', data: 'entro fine mese' }), /data non valida/);
});

test('valuta_reclamo e mostra_lettera_reclamo: volo Catania-Parigi, 400 €, IBAN mai dalla chat', () => {
  const { t, visto } = banco();
  const risposte = { caso: 'volo', volo_tipo: 'ritardo', data_volo: '2026-09-12', da: 'CTA', a: 'CDG', ritardo_ore: '4', causa_volo: 'guasto', iban: 'IT60X0542811101000000123456' };
  const r = t.valuta_reclamo.execute({ risposte });
  assert.equal(r.importo.valore, 400);
  assert.ok(r.avvisi.some((a) => a.startsWith('iban:')));
  assert.equal(r.lettera_disponibile, true);
  const d = t.mostra_lettera_reclamo.execute({ risposte });
  assert.equal(d.mostrato, true);
  assert.doesNotMatch(visto.documenti[0].html, /IT60X054/);
  assert.match(visto.documenti[0].genera({ nome: 'Maria Prova', iban: 'IT00TEST' }), /Maria Prova[\s\S]*IT00TEST/);
});
