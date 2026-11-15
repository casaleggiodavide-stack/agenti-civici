// Quando vado in pensione?: requisiti 2026-2028, finestre, uscite già maturate, misure scadute.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { datePensione, testo, adeguamenti, durata, perAnno, normalizza } from '../src/regole.js';
import FONTI from '../src/dati/fonti.js';

const OGGI = '2026-11-15';
const base = { sesso: 'uomo', mesi_anno: 12, prima_1996: true, gestione: 'privato', lavoro: 'no', precoce: false, invalidita74: false, caregiver: false, disoccupato: 'no', figli: 0 };
const uscita = (p, id, oggi = OGGI) => datePensione({ ...base, ...p }, oggi).uscite.find((u) => u.id === id);

test('vecchiaia: 67 anni nel 2026, 67 e 1 mese nel 2027, con 20 anni di contributi', () => {
  // Compie 67 anni a dicembre 2026: requisito del 2026, pensione dal 1° gennaio 2027.
  const dic = uscita({ nascita_mese: 12, nascita_anno: 1959, contributi_anni: 20, mesi_anno: 0 }, 'vecchiaia');
  assert.equal(dic.esito, 'si');
  assert.equal(dic.maturazione, '2026-12');
  assert.equal(dic.decorrenza, '2027-01-01');
  // Compie 67 anni a gennaio 2027: serve un mese in più, quindi febbraio, pensione dal 1° marzo.
  const gen = uscita({ nascita_mese: 1, nascita_anno: 1960, contributi_anni: 20, mesi_anno: 0 }, 'vecchiaia');
  assert.equal(gen.maturazione, '2027-02');
  assert.equal(gen.decorrenza, '2027-03-01');
  assert.match(gen.requisiti[0].testo, /67 anni e 1 mese/);
});

test('anticipata uomo: 42 anni e 11 mesi nel 2027, poi 3 mesi di finestra', () => {
  const u = uscita({ nascita_mese: 5, nascita_anno: 1965, contributi_anni: 42, contributi_mesi: 8 }, 'anticipata');
  // dicembre 2026: 42a9m; gennaio 2027: 42a10m ma ne servono 42a11m; febbraio 2027 sì.
  assert.equal(u.maturazione, '2027-02');
  assert.equal(u.finestra, 3);
  assert.equal(u.decorrenza, '2027-06-01');
});

test('anticipata donna: 41 anni e 10 mesi nel 2026; per le casse degli enti locali la finestra è più lunga', () => {
  const p = { sesso: 'donna', nascita_mese: 2, nascita_anno: 1966, contributi_anni: 41, contributi_mesi: 9 };
  const privata = uscita(p, 'anticipata');
  assert.equal(privata.maturazione, '2026-12');
  assert.equal(privata.decorrenza, '2027-04-01');
  const cpdel = uscita({ ...p, gestione: 'pubblico_locale' }, 'anticipata');
  assert.equal(cpdel.finestra, 5); // maturati nel 2026
  assert.equal(cpdel.decorrenza, '2027-06-01');
});

test('finestre mobili: CPDEL 7 mesi se i requisiti maturano nel 2027, 9 dal 2028', () => {
  const nel2027 = uscita({ sesso: 'donna', nascita_mese: 2, nascita_anno: 1968, contributi_anni: 40, contributi_mesi: 10, gestione: 'pubblico_locale' }, 'anticipata');
  assert.equal(nel2027.maturazione, '2027-12'); // 41a11m nel 2027
  assert.equal(nel2027.finestra, 7);
  assert.equal(nel2027.decorrenza, '2028-08-01');
  const nel2028 = uscita({ sesso: 'donna', nascita_mese: 2, nascita_anno: 1968, contributi_anni: 40, contributi_mesi: 0, gestione: 'pubblico_locale' }, 'anticipata');
  assert.equal(nel2028.finestra, 9);
  assert.equal(perAnno(FONTI.requisiti.anticipata_finestra_cpdel, 2030), 9);
});

test('contributivo puro: anticipata a 64 anni con 20 di contributi, ma serve un dato sull\'importo', () => {
  const gia = uscita({ sesso: 'donna', figli: 1, nascita_mese: 6, nascita_anno: 1962, contributi_anni: 22, prima_1996: false, gestione: 'separata' }, 'contributiva');
  assert.equal(gia.esito, 'dato');
  assert.equal(gia.gia, true);
  assert.equal(gia.decorrenza, '2026-12-01');
  assert.ok(gia.requisiti.some((r) => /2,8 volte/.test(r.testo) && r.esito === 'dato'));
  // Compie 64 anni a febbraio 2027: nel 2027 ne servono 64 e 1 mese (marzo), poi 3 mesi di finestra.
  const dopo = uscita({ nascita_mese: 2, nascita_anno: 1963, contributi_anni: 25, prima_1996: false }, 'contributiva');
  assert.equal(dopo.maturazione, '2027-03');
  assert.equal(dopo.decorrenza, '2027-07-01');
  // Con contributi prima del 1996 non vale; vale invece la vecchiaia ordinaria.
  assert.equal(uscita({ nascita_mese: 2, nascita_anno: 1963, contributi_anni: 25 }, 'contributiva').esito, 'no');
  assert.equal(uscita({ nascita_mese: 2, nascita_anno: 1963, contributi_anni: 25 }, 'vecchiaia71').esito, 'no');
});

test('precoci: 41 anni e 1 mese nel 2027; per i gravosi resta 41 anni', () => {
  const p = { nascita_mese: 5, nascita_anno: 1967, contributi_anni: 40, contributi_mesi: 10, precoce: true };
  const caregiver = uscita({ ...p, caregiver: true }, 'precoci');
  assert.equal(caregiver.esito, 'si');
  assert.equal(caregiver.maturazione, '2027-02');
  assert.equal(caregiver.decorrenza, '2027-06-01');
  assert.ok(caregiver.scadenze.some((s) => s.data === '2027-03-31'));
  const gravoso = uscita({ ...p, lavoro: 'gravoso_7_10' }, 'precoci');
  assert.equal(gravoso.maturazione, '2027-01');
  assert.equal(gravoso.decorrenza, '2027-05-01');
  // Disoccupazione: vale dopo un licenziamento, non dopo un contratto a termine.
  assert.equal(uscita({ ...p, disoccupato: 'naspi_finita_3', fine_termine: false }, 'precoci').esito, 'si');
  assert.equal(uscita({ ...p, disoccupato: 'naspi_finita_3', fine_termine: true }, 'precoci').esito, 'no');
  assert.equal(uscita({ ...p, disoccupato: 'naspi_finita_3' }, 'precoci').esito, 'dato');
  // Senza condizione, o senza contributi prima del 1996, niente quota 41.
  assert.equal(uscita(p, 'precoci').esito, 'no');
  assert.equal(uscita({ ...p, caregiver: true, prima_1996: false }, 'precoci').esito, 'no');
});

test('persona che ha già i requisiti: pensione dal mese dopo la domanda', () => {
  const e = datePensione({ ...base, nascita_mese: 4, nascita_anno: 1958, contributi_anni: 30 }, OGGI);
  assert.equal(e.prima.id, 'vecchiaia');
  assert.equal(e.prima.gia, true);
  assert.equal(e.prima.decorrenza, '2026-12-01');
  assert.ok(e.scadenze.some((s) => s.data === '2026-11-30' && /Domanda di pensione/.test(s.titolo)));
});

test('contributi insufficienti: niente vecchiaia se non si arriva a 20 anni', () => {
  const u = uscita({ nascita_mese: 4, nascita_anno: 1958, contributi_anni: 12, mesi_anno: 0 }, 'vecchiaia');
  assert.equal(u.esito, 'no');
  assert.match(u.manca.join(' '), /8 anni di contributi/);
  const e = datePensione({ ...base, nascita_mese: 4, nascita_anno: 1958, contributi_anni: 12, mesi_anno: 0 }, OGGI);
  assert.equal(e.prima, null);
  assert.match(testo(e), /non trovo una data/);
});

test('adeguamento alla speranza di vita: 67 anni e 3 mesi dal 2028, dal 2029 previsione', () => {
  const u = uscita({ nascita_mese: 1, nascita_anno: 1961, contributi_anni: 30 }, 'vecchiaia');
  assert.equal(u.maturazione, '2028-04');
  assert.equal(u.decorrenza, '2028-05-01');
  assert.equal(u.previsione, false);
  const tardi = uscita({ nascita_mese: 1, nascita_anno: 1963, contributi_anni: 30 }, 'vecchiaia');
  assert.equal(tardi.previsione, true);
  assert.equal(tardi.maturazione, '2030-04');
  const tab = adeguamenti();
  assert.deepEqual(tab.map((x) => x.vecchiaia), ['67 anni', '67 anni e 1 mese', '67 anni e 3 mesi', '67 anni e 3 mesi']);
  assert.equal(tab[2].anticipata_uomini, '43 anni e 1 mese');
  assert.equal(tab[3].previsione, true);
});

test('gravosi da 7 anni su 10: vecchiaia a 66 anni e 7 mesi con 30 anni di contributi', () => {
  const p = { nascita_mese: 3, nascita_anno: 1961, gestione: 'privato', lavoro: 'gravoso_7_10' };
  const con30 = uscita({ ...p, contributi_anni: 31 }, 'vecchiaia');
  assert.equal(con30.maturazione, '2027-10'); // 66a7m a ottobre 2027
  const con20 = uscita({ ...p, contributi_anni: 20, mesi_anno: 0 }, 'vecchiaia');
  assert.equal(con20.maturazione, '2028-06'); // senza 30 anni vale il requisito ordinario (67a3m)
});

test('APE sociale: requisiti entro il 31 dicembre 2026, domanda entro il 30 novembre', () => {
  const p = { sesso: 'donna', figli: 2, nascita_mese: 4, nascita_anno: 1963, contributi_anni: 29, mesi_anno: 0, caregiver: true };
  const si = uscita(p, 'ape');
  assert.equal(si.esito, 'si');
  assert.equal(si.decorrenza, '2026-12-01');
  assert.ok(si.scadenze.some((s) => s.data === '2026-11-30'));
  assert.match(si.requisiti.find((r) => /Contributi/.test(r.testo)).testo, /28 anni/);
  // Chi compie 63 anni e 5 mesi nel 2027 resta fuori, salvo proroga.
  assert.equal(uscita({ ...p, nascita_anno: 1964 }, 'ape').esito, 'no');
  // Un uomo con 29 anni di contributi non arriva ai 30.
  assert.equal(uscita({ ...p, sesso: 'uomo' }, 'ape').esito, 'no');
});

test('Opzione donna e Quota 103: solo per chi aveva i requisiti alla scadenza', () => {
  const od = uscita({ sesso: 'donna', nascita_mese: 3, nascita_anno: 1963, contributi_anni: 38, caregiver: true }, 'opzione_donna');
  assert.equal(od.esito, 'si');
  assert.equal(od.decorrenza, '2026-12-01');
  assert.equal(uscita({ sesso: 'donna', nascita_mese: 3, nascita_anno: 1966, contributi_anni: 38, caregiver: true }, 'opzione_donna').esito, 'no');
  const q = uscita({ nascita_mese: 1, nascita_anno: 1962, contributi_anni: 44 }, 'quota');
  assert.equal(q.esito, 'si');
  assert.match(q.nome, /Quota 103/);
  // 41 anni e 3 mesi oggi: a fine 2025 potevano essere più o meno di 41 anni. Serve l'estratto conto.
  assert.equal(uscita({ nascita_mese: 1, nascita_anno: 1962, contributi_anni: 41, contributi_mesi: 3 }, 'quota').esito, 'dato');
  assert.equal(uscita({ nascita_mese: 1, nascita_anno: 1962, contributi_anni: 39 }, 'quota').esito, 'no');
});

test('usuranti: 61 anni e 7 mesi, 35 di contributi e quota 97,6; domanda tardiva sposta la data', () => {
  const u = uscita({ nascita_mese: 1, nascita_anno: 1965, contributi_anni: 36, lavoro: 'usurante' }, 'usuranti');
  assert.equal(u.esito, 'si');
  assert.equal(u.gia, true);
  assert.ok(u.decorrenza > '2026-12-01');
  const futuro = uscita({ nascita_mese: 6, nascita_anno: 1967, contributi_anni: 35, lavoro: 'usurante' }, 'usuranti');
  assert.equal(futuro.esito, 'si');
  assert.ok(futuro.scadenze.some((s) => /1° maggio|usurante/.test(s.titolo + s.testo)));
  assert.equal(uscita({ nascita_mese: 6, nascita_anno: 1967, contributi_anni: 35 }, 'usuranti').esito, 'no');
});

test('dati mancanti: «serve un dato», non un\'ipotesi', () => {
  const senzaMesi = uscita({ nascita_mese: 5, nascita_anno: 1965, contributi_anni: 40, mesi_anno: undefined }, 'anticipata');
  assert.equal(senzaMesi.esito, 'dato');
  assert.equal(senzaMesi.decorrenza, null);
  const senzaSesso = uscita({ nascita_mese: 5, nascita_anno: 1965, contributi_anni: 40, sesso: undefined }, 'anticipata');
  assert.equal(senzaSesso.esito, 'dato');
  const vuoto = datePensione({}, OGGI);
  assert.deepEqual(vuoto.uscite, []);
  assert.ok(vuoto.mancanti.includes('nascita'));
  assert.equal(normalizza({ prima_1996: 'non_so' }).prima_1996, null);
});

test('testo(esito): riassunto leggibile con requisiti, scadenze, avvertenze e fonti', () => {
  const t = testo(datePensione({ ...base, nascita_mese: 12, nascita_anno: 1959, contributi_anni: 25 }, OGGI));
  assert.match(t, /Prima uscita possibile: Pensione di vecchiaia, dal 1° gennaio 2027/);
  assert.match(t, /La mia pensione futura/);
  assert.match(t, /normattiva\.it/);
  assert.equal(durata(514), '42 anni e 10 mesi');
});

test('dati preparati: ogni fonte ha un URL ufficiale e le tabelle per anno crescono', () => {
  const json = JSON.parse(readFileSync(new URL('../dati/fonti.json', import.meta.url), 'utf8'));
  assert.equal(json.verificato_il, FONTI.verificato);
  for (const [k, f] of Object.entries(FONTI.fonti)) assert.match(f.url, /^https:\/\/www\.(normattiva|inps|gazzettaufficiale)\.it\//, k);
  for (const k of ['vecchiaia_eta', 'anticipata_uomini', 'anticipata_donne', 'contributiva_eta', 'precoci_contributi', 'vecchiaia71_eta']) {
    const v = FONTI.requisiti[k].map(([, x]) => x);
    assert.deepEqual([...v].sort((a, b) => a - b), v, k);
    assert.equal(perAnno(FONTI.requisiti[k], 2028) - perAnno(FONTI.requisiti[k], 2026), 3, k);
  }
  assert.equal(FONTI.valori.assegno_sociale_2026, 546.24);
});
