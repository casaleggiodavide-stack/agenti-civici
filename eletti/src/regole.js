// Chi ti rappresenta: dal Comune a chi lo amministra e lo rappresenta, livello per livello, con ruolo e date
// dalla fonte ufficiale (lista e gruppo non si mostrano per nessuno: scelta di neutralità del 15/11/2026). Funzioni pure: i dati li prepara
// scripts/eletti-dati.py (eletti/dati/comuni.json, nazionale.json, p/<sigla>.json).
//
// Neutralità: stesso formato per tutti, ordine per carica e poi per cognome, mai per lista o partito;
// nessun commento, nessuna statistica su presenze o voti; solo nome, ruolo, date, link ufficiali.

export const VERIFICATO = '2026-11-15';

const NORMATTIVA = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:';
/** Le norme citate, verificate su Normattiva ed EUR-Lex il 15/11/2026 (testo vigente). */
export const FONTI = {
  tuel51: { titolo: 'Testo unico degli enti locali (d.lgs. 267/2000), art. 51, comma 1: sindaco e consiglio durano cinque anni', url: `${NORMATTIVA}stato:decreto.legislativo:2000-08-18;267~art51` },
  turno: { titolo: 'Legge 182/1991, art. 1: turno ordinario tra il 15 aprile e il 15 giugno; se il mandato scade nel secondo semestre, si vota nello stesso periodo dell\'anno dopo', url: `${NORMATTIVA}stato:legge:1991-06-07;182~art1` },
  rinnovo: { titolo: 'Legge 182/1991, art. 2: rinnovo per motivi diversi dalla scadenza (entro il 24 febbraio si vota nello stesso anno, altrimenti l\'anno dopo)', url: `${NORMATTIVA}stato:legge:1991-06-07;182~art2` },
  tuel141: { titolo: 'TUEL, art. 141: scioglimento del consiglio e nomina del commissario; il rinnovo coincide con il primo turno elettorale utile', url: `${NORMATTIVA}stato:decreto.legislativo:2000-08-18;267~art141` },
  tuel143: { titolo: 'TUEL, art. 143, comma 10: scioglimento per infiltrazioni, da 12 a 18 mesi, prorogabili fino a 24; si vota nel turno ordinario o in un turno straordinario tra il 15 ottobre e il 15 dicembre', url: `${NORMATTIVA}stato:decreto.legislativo:2000-08-18;267~art143` },
  tuel8: { titolo: 'TUEL, art. 8, comma 3: lo statuto del Comune prevede istanze, petizioni e proposte dei cittadini e il loro esame tempestivo', url: `${NORMATTIVA}stato:decreto.legislativo:2000-08-18;267~art8` },
  tuel43: { titolo: 'TUEL, art. 43, commi 1 e 3: i consiglieri presentano interrogazioni e mozioni; sindaco o assessori rispondono entro 30 giorni', url: `${NORMATTIVA}stato:decreto.legislativo:2000-08-18;267~art43` },
  delrio: { titolo: 'Legge 56/2014, art. 1, commi 19, 25, 58 e 69: sindaco metropolitano, presidente e consiglio della Provincia eletti da sindaci e consiglieri comunali', url: `${NORMATTIVA}stato:legge:2014-04-07;56~art1` },
  regioni: { titolo: 'Legge 165/2004, art. 5: gli organi elettivi delle Regioni durano cinque anni dall\'elezione', url: `${NORMATTIVA}stato:legge:2004-07-02;165~art5` },
  statuto: { titolo: 'Costituzione, art. 123: lo statuto regionale regola l\'iniziativa popolare e il referendum', url: `${NORMATTIVA}stato:costituzione:1947-12-27~art123` },
  camere: { titolo: 'Costituzione, artt. 60 e 61: le Camere durano cinque anni; si vota entro 70 giorni dalla fine', url: `${NORMATTIVA}stato:costituzione:1947-12-27~art60` },
  petizioni: { titolo: 'Costituzione, art. 50: tutti i cittadini possono rivolgere petizioni alle Camere', url: `${NORMATTIVA}stato:costituzione:1947-12-27~art50` },
  iniziativa: { titolo: 'Costituzione, art. 71: proposta di legge di iniziativa popolare con almeno 50.000 firme', url: `${NORMATTIVA}stato:costituzione:1947-12-27~art71` },
  petizioniCamera: { titolo: 'Camera dei deputati: petizioni (Regolamento, art. 109), anche online con SPID o CIE', url: 'https://www.camera.it/leg19/468' },
  europa: { titolo: 'Trattato sull\'Unione europea, art. 14, par. 3: mandato di cinque anni', url: 'https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:12016M014' },
  petizioniUe: { titolo: 'Trattato sul funzionamento dell\'Unione europea, art. 227: diritto di petizione al Parlamento europeo', url: 'https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:12016E227' },
  portaleUe: { titolo: 'Parlamento europeo, portale delle petizioni', url: 'https://www.europarl.europa.eu/petitions/it/home' },
};

/** Prima riunione delle Camere della XIX legislatura (dati.senato.it: inizio dei mandati il 13/10/2022). */
export const LEGISLATURA = { numero: 'XIX', inizio: '2022-10-13' };
/** Elezioni europee del 6-9 giugno 2024: il mandato è di cinque anni (TUE, art. 14). */
export const EUROPEE = { data: '2024-06-09' };

export const normalizza = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// ---------- la ricerca del Comune ----------

/** Prepara l'indice: comuni.json e, quando servono, nazionale.json e i file delle province già caricati. */
export function indicizza(comuni, nazionale = null, province = {}) {
  return {
    aggiornato: comuni.aggiornato, regioni: comuni.regioni, nazionale, province,
    righe: comuni.comuni.map(([istat, nome, sigla, regione]) => ({ istat, nome, sigla, regione, regioneNome: comuni.regioni[regione] || '', n: normalizza(nome) })),
  };
}

/** I Comuni che corrispondono a quello che hai scritto: prima il nome intero, poi chi comincia così, poi chi lo contiene. «Castro LE» distingue gli omonimi. */
export function cerca(indice, testo, limite = 8) {
  let t = normalizza(testo);
  if (!t) return [];
  let sigla = '';
  const m = t.match(/^(.*?)\s+([a-z]{2})$/);
  if (m && indice.righe.some((r) => r.sigla.toLowerCase() === m[2] && r.n.startsWith(m[1]))) { t = m[1]; sigla = m[2].toUpperCase(); }
  const punti = (r) => (r.n === t ? 3 : r.n.startsWith(t) ? 2 : r.n.includes(` ${t}`) ? 1 : r.n.includes(t) ? 0.5 : -1);
  return indice.righe
    .filter((r) => (!sigla || r.sigla === sigla) && punti(r) >= 0)
    .sort((a, b) => punti(b) - punti(a) || a.n.length - b.n.length || a.n.localeCompare(b.n))
    .slice(0, limite);
}

/** La sigla del file di provincia da caricare per un Comune (null se il codice non esiste). */
export function provinciaDi(indice, istat) {
  return indice.righe.find((r) => r.istat === String(istat))?.sigla || null;
}

// ---------- date ----------

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
export const dataLunga = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${Number(m[3])} ${MESI[Number(m[2]) - 1]} ${m[1]}` : '';
};
const meseAnno = (anno, mese) => `${MESI[mese - 1]} ${anno}`;

/**
 * Quando si vota per il Comune, se il dato è certo. Scadenza naturale = elezione + 5 anni (TUEL art. 51);
 * nelle Regioni a statuto ordinario il voto cade nel turno tra il 15 aprile e il 15 giugno di quell'anno se il
 * mandato scade nel primo semestre, dell'anno dopo se scade nel secondo (L. 182/1991, art. 1). Salvo scioglimento.
 * Nelle Regioni a statuto speciale durata e date le stabilisce la legge regionale: si dice solo questo.
 */
export function votoComune(elezione, statutoSpeciale) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(elezione || '');
  if (!m) return { certo: false, testo: 'Serve un dato: la fonte non indica la data dell\'ultima elezione.', fonti: [] };
  if (statutoSpeciale) {
    return { certo: false, elezione, testo: `Ultima elezione: ${dataLunga(elezione)}. Nelle Regioni a statuto speciale durata del mandato e data del voto le stabilisce la legge regionale: guarda il sito della Regione.`, fonti: [] };
  }
  const anno = Number(m[1]) + 5, mese = Number(m[2]);
  const turno = mese <= 6 ? anno : anno + 1;
  return {
    certo: true, elezione, scadenza: `${anno}-${m[2]}`, turno,
    testo: `Scadenza naturale: ${meseAnno(anno, mese)}, cinque anni dall'elezione del ${dataLunga(elezione)}. Si vota nel turno ordinario tra il 15 aprile e il 15 giugno ${turno}, salvo scioglimento anticipato.`,
    fonti: [FONTI.tuel51, FONTI.turno],
  };
}

/** Comune commissariato: cosa dice la legge sul ritorno al voto (senza inventare la data). */
export function votoCommissariato(commissari, statutoSpeciale) {
  const cariche = commissari.map((c) => normalizza(c[1]));
  if (statutoSpeciale) {
    return { certo: false, testo: 'Il Comune è guidato da un commissario. Nelle Regioni a statuto speciale la data del nuovo voto la fissa la Regione secondo la sua legge.', fonti: [] };
  }
  if (cariche.some((c) => c.startsWith('commissione straordinaria'))) {
    return { certo: false, testo: 'Il consiglio è stato sciolto e il Comune è affidato a una commissione straordinaria: è il caso dell\'art. 143 del TUEL. Lo scioglimento dura da 12 a 18 mesi, prorogabili fino a 24; poi si vota nel turno ordinario di primavera o in un turno straordinario tra il 15 ottobre e il 15 dicembre.', fonti: [FONTI.tuel143] };
  }
  return { certo: false, testo: 'Il consiglio è stato sciolto e il Comune è guidato da un commissario. Si vota nel primo turno elettorale utile: nello stesso anno se lo scioglimento è avvenuto entro il 24 febbraio, altrimenti nella primavera dell\'anno dopo.', fonti: [FONTI.tuel141, FONTI.rinnovo] };
}

/** Regione: scadenza naturale cinque anni dopo l'elezione (L. 165/2004, art. 5); statuto speciale a parte. */
export function votoRegione(elezione, statutoSpeciale) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(elezione || '');
  if (!m) return { certo: false, testo: 'Serve un dato: la fonte non indica la data dell\'ultima elezione regionale.', fonti: [] };
  if (statutoSpeciale) return { certo: false, elezione, testo: `Ultima elezione: ${dataLunga(elezione)}. Per le Regioni a statuto speciale durata e data del voto le stabiliscono lo Statuto e la legge regionale.`, fonti: [] };
  return { certo: true, elezione, scadenza: `${Number(m[1]) + 5}-${m[2]}`, testo: `Scadenza naturale: ${meseAnno(Number(m[1]) + 5, Number(m[2]))}, cinque anni dall'elezione del ${dataLunga(elezione)}; si vota entro i sessanta giorni successivi, salvo scioglimento anticipato.`, fonti: [FONTI.regioni] };
}

export function votoParlamento() {
  const [a, mm] = LEGISLATURA.inizio.split('-').map(Number);
  return { certo: true, scadenza: `${a + 5}-${String(mm).padStart(2, '0')}`, testo: `Scadenza naturale della ${LEGISLATURA.numero} legislatura: ${meseAnno(a + 5, mm)}, cinque anni dalla prima riunione delle Camere del ${dataLunga(LEGISLATURA.inizio)}. Si vota entro 70 giorni dalla fine, salvo scioglimento anticipato.`, fonti: [FONTI.camere] };
}

export function votoEuropa() {
  const a = Number(EUROPEE.data.slice(0, 4)) + 5;
  return { certo: true, scadenza: String(a), testo: `Prossime elezioni europee: ${a}, cinque anni dopo quelle del ${dataLunga(EUROPEE.data)}. La data la fissa il Consiglio dell'Unione europea.`, fonti: [FONTI.europa] };
}

// ---------- chi ti rappresenta ----------

const chiaveCollegio = (s) => normalizza(String(s || '').split(' (')[0]).replace(/sudtirol/g, '').replace(/\s+/g, ' ').trim();

/** [nome, carica, incarico, elezione, inCarica, lista] → oggetto con gli stessi campi per tutti. */
const persona = ([nome, carica, incarico, elezione, inCarica, lista]) => ({ nome, ruolo: incarico ? `${carica} · ${incarico}` : carica, elezione: elezione || '', inCarica: inCarica || '', lista: lista || '', gruppo: '', scheda: '' });

const tipoCarica = (c) => {
  const x = normalizza(c);
  if (/^(commissione straordinaria|commissario|sub commissario)/.test(x)) return 'commissari';
  if (/^(sindaco|presidente della (regione|provincia))/.test(x)) return 'vertice';
  if (/^(assessore|vicesindaco)/.test(x)) return 'giunta';
  return 'consiglio';
};

function gruppiDa(righe, nomi) {
  const g = { vertice: [], giunta: [], consiglio: [], commissari: [] };
  for (const r of righe) {
    const t = tipoCarica(r[1]);
    const p = persona(r);
    if (t === 'commissari') p.elezione = ''; // la data nella fonte è quella dell'elezione del consiglio sciolto
    g[t].push(p);
  }
  return Object.entries(nomi).filter(([k]) => g[k].length).map(([k, titolo]) => ({ id: k, titolo, persone: g[k] }));
}

const elezionePiuFrequente = (righe) => {
  const conta = {};
  for (const r of righe) if (r[3] && tipoCarica(r[1]) !== 'commissari') conta[r[3]] = (conta[r[3]] || 0) + 1;
  const vertice = righe.find((r) => tipoCarica(r[1]) === 'vertice' && r[3]);
  return vertice ? vertice[3] : Object.entries(conta).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
};

const enteLink = (e) => (e ? { nome: e.nome, pec: e.pec || '', sito: e.sito || '' } : null);

/**
 * Chi rappresenta chi vive in un Comune, a ogni livello. indice = indicizza(comuni, nazionale, { [sigla]: p/<sigla>.json }).
 * Se manca un file, l'esito lo dice (serveDato) invece di indovinare.
 */
export function rappresentanti(indice, istat) {
  const riga = indice.righe.find((r) => r.istat === String(istat));
  if (!riga) return { errore: `Nessun Comune con codice ISTAT ${istat}.` };
  const prov = indice.province?.[riga.sigla];
  const naz = indice.nazionale;
  const mancano = [!prov && `p/${riga.sigla}.json`, !naz && 'nazionale.json'].filter(Boolean);
  if (mancano.length) return { errore: 'Servono i dati', serveDato: mancano, comune: { istat: riga.istat, nome: riga.nome, sigla: riga.sigla } };
  const c = prov.comuni[riga.istat] || { nome: riga.nome, persone: [], commissari: [], camera: null, senato: null, pec: '', sito: '' };
  const reg = naz.regioni[riga.regione] || {};
  const speciale = !!reg.statutoSpeciale;
  const livelli = [];

  // Comune
  const commissariato = c.commissari.length > 0 || c.persone.some((p) => tipoCarica(p[1]) === 'commissari');
  const gruppiComune = gruppiDa(c.persone, { commissari: 'Gestione commissariale', vertice: 'Sindaco', giunta: 'Giunta', consiglio: 'Consiglio comunale' });
  if (commissariato && !gruppiComune.some((g) => g.id === 'commissari')) {
    gruppiComune.unshift({ id: 'commissari', titolo: 'Gestione commissariale', persone: c.commissari.map(([nome, carica, inCarica]) => ({ nome, ruolo: carica, elezione: '', inCarica, lista: '', gruppo: '', scheda: '' })) });
  }
  livelli.push({
    id: 'comune', titolo: `Comune di ${riga.nome}`, ente: { nome: `Comune di ${riga.nome}`, pec: c.pec || '', sito: c.sito || '' },
    stato: commissariato ? 'commissariato' : gruppiComune.length ? 'ordinario' : 'serve-dato',
    gruppi: gruppiComune,
    voto: commissariato ? votoCommissariato(c.commissari.length ? c.commissari : c.persone.filter((p) => tipoCarica(p[1]) === 'commissari'), speciale) : votoComune(elezionePiuFrequente(c.persone), speciale),
    nota: gruppiComune.length ? '' : 'L\'Anagrafe degli amministratori non riporta persone per questo Comune: guarda il sito del Comune.',
  });

  // Provincia, Città metropolitana o Provincia autonoma
  const e = prov.ente;
  if (e) {
    const titoli = e.tipo === 'citta-metropolitana'
      ? { commissari: 'Gestione commissariale', vertice: 'Sindaco metropolitano', giunta: 'Giunta', consiglio: 'Consiglio metropolitano' }
      : { commissari: 'Gestione commissariale', vertice: e.tipo === 'provincia-autonoma' ? 'Presidente della Provincia autonoma' : 'Presidente della Provincia', giunta: 'Giunta', consiglio: 'Consiglio provinciale' };
    const gruppi = gruppiDa(e.persone, titoli);
    const elez = elezionePiuFrequente(e.persone);
    livelli.push({
      id: 'provincia', tipo: e.tipo, titolo: e.nome, ente: enteLink(e), consiglio: enteLink(e.consiglio),
      stato: gruppi.length ? 'ordinario' : 'serve-dato', gruppi,
      voto: e.tipo === 'provincia-autonoma'
        ? { certo: false, elezione: elez, testo: `${elez ? `Ultima elezione: ${dataLunga(elez)}. ` : ''}Durata e data del voto le stabiliscono lo Statuto speciale e la legge provinciale.`, fonti: [] }
        : speciale
          ? { certo: false, testo: 'Nelle Regioni a statuto speciale come si eleggono e quanto durano gli organi della Provincia o della Città metropolitana lo stabilisce la legge regionale.', fonti: [] }
          : { certo: true, secondoGrado: true, testo: e.tipo === 'citta-metropolitana' ? 'I cittadini non votano direttamente: il sindaco metropolitano è il sindaco del Comune capoluogo e il consiglio metropolitano lo eleggono sindaci e consiglieri comunali.' : 'I cittadini non votano direttamente: presidente e consiglio provinciale li eleggono i sindaci e i consiglieri comunali della provincia.', fonti: [FONTI.delrio] },
      nota: gruppi.length ? '' : 'L\'Anagrafe degli amministratori non riporta persone per questo ente.',
    });
  } else {
    livelli.push({ id: 'provincia', tipo: null, titolo: 'Provincia o Città metropolitana', ente: null, stato: 'serve-dato', gruppi: [], voto: null, nota: 'Per questo territorio l\'Anagrafe del Ministero dell\'Interno non riporta un ente intermedio (Provincia o Città metropolitana).' });
  }

  // Regione
  const gruppiReg = gruppiDa(reg.persone || [], { vertice: 'Presidente della Regione', giunta: 'Giunta regionale', consiglio: 'Consiglio regionale' });
  const mancanoReg = ['vertice', 'giunta', 'consiglio'].filter((k) => !gruppiReg.some((g) => g.id === k));
  livelli.push({
    id: 'regione', titolo: `Regione ${reg.nome || riga.regioneNome}`, ente: enteLink(reg.giunta), consiglio: enteLink(reg.consiglio),
    stato: gruppiReg.length ? 'ordinario' : 'serve-dato', gruppi: gruppiReg,
    voto: votoRegione(reg.elezione, speciale),
    nota: [
      gruppiReg.length && mancanoReg.length ? `L'Anagrafe del Ministero, aggiornata al ${dataLunga(indice.aggiornato)}, non riporta ${mancanoReg.map((k) => ({ vertice: 'il presidente', giunta: 'la giunta', consiglio: 'il consiglio' }[k])).join(' né ')}: guarda il sito della Regione.` : '',
      !gruppiReg.length ? `L'Anagrafe del Ministero, aggiornata al ${dataLunga(indice.aggiornato)}, non riporta gli amministratori di questa Regione: guarda il sito della Regione e del Consiglio regionale.` : '',
      gruppiReg.some((g) => g.id === 'consiglio') ? 'Sono elencati tutti i consiglieri della Regione: la fonte non indica in quale circoscrizione sono stati eletti.' : '',
    ].filter(Boolean).join(' '),
  });

  // Camera
  const voto = votoParlamento();
  const cam = c.camera;
  const gruppiCamera = [];
  if (cam) {
    for (const u of cam.uninominale) {
      const k = chiaveCollegio(u);
      gruppiCamera.push({ id: 'uninominale', titolo: `Collegio uninominale ${u}`, persone: naz.camera.filter((d) => d.tipo === 'uninominale' && chiaveCollegio(d.collegio) === k).map(parlamentare) });
    }
    for (const p of cam.plurinominale) {
      const k = chiaveCollegio(p);
      gruppiCamera.push({ id: 'plurinominale', titolo: `Collegio plurinominale ${p}`, persone: naz.camera.filter((d) => d.tipo === 'proporzionale' && chiaveCollegio(d.collegio) === k).map(parlamentare) });
    }
  }
  livelli.push({
    id: 'camera', titolo: 'Camera dei deputati', ente: { nome: 'Camera dei deputati', pec: '', sito: 'https://www.camera.it/' },
    stato: cam ? 'ordinario' : 'serve-dato', gruppi: gruppiCamera, voto,
    nota: [
      !cam ? 'Serve un dato: il Comune non è negli elenchi dei collegi del 2022 (per esempio perché nato da una fusione dopo quella data).' : '',
      cam && cam.uninominale.length > 1 ? `${riga.nome} è diviso tra ${cam.uninominale.length} collegi uninominali: il tuo dipende dalla sezione elettorale scritta sulla tessera elettorale.` : '',
      gruppiCamera.some((g) => !g.persone.length) ? 'Per un collegio i dati della Camera non indicano un deputato in carica: il seggio può essere vacante o in attesa di subentro.' : '',
    ].filter(Boolean).join(' '),
  });

  // Senato
  const sen = c.senato;
  const gruppiSenato = [];
  if (sen) {
    for (const u of sen.uninominale) {
      const k = chiaveCollegio(u);
      gruppiSenato.push({ id: 'uninominale', titolo: `Collegio uninominale ${u}`, persone: naz.senato.filter((s) => s.tipo === 'uninominale' && chiaveCollegio(s.collegio) === k).map(parlamentare) });
    }
    const prop = naz.senato.filter((s) => s.tipo === 'proporzionale' && s.regioneCodice === riga.regione).map(parlamentare);
    if (prop.length) gruppiSenato.push({ id: 'proporzionale', titolo: `Eletti con il proporzionale in ${reg.nome || riga.regioneNome}`, persone: prop });
  }
  livelli.push({
    id: 'senato', titolo: 'Senato della Repubblica', ente: { nome: 'Senato della Repubblica', pec: '', sito: 'https://www.senato.it/' },
    stato: sen ? 'ordinario' : 'serve-dato', gruppi: gruppiSenato, voto,
    nota: [
      !sen ? 'Serve un dato: il Comune non è negli elenchi dei collegi del 2022.' : '',
      sen && sen.uninominale.length > 1 ? `${riga.nome} è diviso tra ${sen.uninominale.length} collegi uninominali del Senato: il tuo dipende dalla sezione elettorale.` : '',
      `I dati aperti del Senato sono aggiornati all'${dataLunga(naz.fonti?.senato?.aggiornato || '')}: chi è subentrato dopo può mancare. Controlla sulla scheda ufficiale.`,
      'Per i senatori eletti con il proporzionale la fonte indica la Regione, non il collegio plurinominale.',
    ].filter(Boolean).join(' '),
  });

  // Parlamento europeo
  const circ = Object.entries(naz.europa.circoscrizioni).find(([, v]) => v.regioni.includes(riga.regione));
  const meps = circ ? naz.europa.deputati.filter((m) => m.circoscrizione === circ[0]) : [];
  const senzaCirc = naz.europa.deputati.filter((m) => !m.circoscrizione);
  livelli.push({
    id: 'europa', titolo: 'Parlamento europeo', ente: { nome: 'Parlamento europeo', pec: '', sito: 'https://www.europarl.europa.eu/' },
    stato: circ ? 'ordinario' : 'serve-dato',
    gruppi: circ ? [{ id: 'circoscrizione', titolo: `Circoscrizione ${circ[0]} · ${circ[1].nome}`, persone: meps.map(eurodeputato) }] : [],
    voto: votoEuropa(),
    nota: [
      'La circoscrizione di ogni eurodeputato viene dalle candidature del 9 giugno 2024 (Ministero dell\'Interno); per chi era candidato in più circoscrizioni si deduce dai seggi della sua lista.',
      senzaCirc.length ? `Per ${senzaCirc.length === 1 ? 'un eurodeputato' : `${senzaCirc.length} eurodeputati`} i dati non bastano a dire la circoscrizione: ${senzaCirc.map((m) => m.nome).join(', ')}.` : '',
    ].filter(Boolean).join(' '),
  });

  return {
    comune: { istat: riga.istat, nome: riga.nome, sigla: riga.sigla, regione: riga.regione, regioneNome: reg.nome || riga.regioneNome, statutoSpeciale: speciale },
    aggiornato: indice.aggiornato, fonti: naz.fonti, livelli, comeFare: COME_FARE,
  };
}

function parlamentare(d) {
  return { nome: d.nome, ruolo: d.tipo === 'uninominale' ? `Eletto/a nel collegio uninominale${d.suppletiva ? ' (elezione suppletiva)' : ''}` : d.tipo === 'proporzionale' ? 'Eletto/a con il proporzionale' : d.tipo, elezione: d.elezione || '', inCarica: d.inizio || '', lista: d.lista || '', gruppo: d.gruppo || '', scheda: d.scheda || '' };
}
function eurodeputato(m) {
  return { nome: m.nome, ruolo: 'Membro del Parlamento europeo', elezione: EUROPEE.data, inCarica: m.inizio || '', lista: m.lista || '', gruppo: m.gruppo || '', scheda: m.scheda || '' };
}

// ---------- come contattarli e farsi sentire (procedure generali di legge) ----------

export const COME_FARE = [
  { titolo: 'Scrivere a chi ti rappresenta', testo: 'Per il Comune, la Provincia o la Regione usa la PEC dell\'ente (o la sua email) e scrivi nell\'oggetto a chi è rivolta: la lettera passa dal protocollo e resta agli atti. Per deputati, senatori ed eurodeputati i recapiti sono sulla scheda ufficiale.', fonti: [] },
  { titolo: 'Una petizione al Comune', testo: 'Lo statuto di ogni Comune prevede istanze, petizioni e proposte dei cittadini e il loro esame in tempi certi. Quante firme servono e chi risponde lo dice lo statuto: lo trovi sul sito del Comune, in «Amministrazione trasparente» o tra i regolamenti.', fonti: [FONTI.tuel8] },
  { titolo: 'Un\'interrogazione tramite un consigliere', testo: 'Solo un consigliere può presentare un\'interrogazione o una mozione in consiglio. Puoi chiederlo a qualunque consigliere, di maggioranza o di opposizione: decide lui o lei. Il sindaco o l\'assessore rispondono entro 30 giorni; i modi li fissa il regolamento del consiglio.', fonti: [FONTI.tuel43] },
  { titolo: 'In Regione', testo: 'Lo statuto della Regione regola le proposte di legge dei cittadini, le petizioni e i referendum regionali: lo trovi sul sito del Consiglio regionale. Le interrogazioni le presentano i consiglieri regionali.', fonti: [FONTI.statuto] },
  { titolo: 'In Parlamento', testo: 'Chiunque può rivolgere una petizione alla Camera o al Senato; alla Camera si può fare anche online con SPID o CIE. Con 50.000 firme si presenta una proposta di legge di iniziativa popolare. Le interrogazioni parlamentari le presentano solo deputati e senatori.', fonti: [FONTI.petizioni, FONTI.petizioniCamera, FONTI.iniziativa] },
  { titolo: 'Al Parlamento europeo', testo: 'Ogni cittadino dell\'Unione e chi risiede in uno Stato membro può presentare una petizione al Parlamento europeo su materie dell\'Unione che lo riguardano direttamente, anche online.', fonti: [FONTI.petizioniUe, FONTI.portaleUe] },
];

// ---------- testo semplice (per l'assistente e il server MCP) ----------

const riga = (p) => [p.nome, p.ruolo, p.elezione && `eletto/a il ${dataLunga(p.elezione)}`, p.inCarica && `in carica dal ${dataLunga(p.inCarica)}`, p.scheda].filter(Boolean).join(' · ');

export function testo(esito) {
  if (esito.errore) return esito.serveDato ? `Servono i dati: ${esito.serveDato.join(', ')}.` : esito.errore;
  const r = [`Chi rappresenta chi vive a ${esito.comune.nome} (${esito.comune.sigla}), ${esito.comune.regioneNome}. Fonti ufficiali; amministratori locali e regionali aggiornati al ${dataLunga(esito.aggiornato)}.`];
  for (const l of esito.livelli) {
    r.push('', `== ${l.titolo}${l.stato === 'commissariato' ? ' (commissariato)' : ''}`);
    if (l.ente?.pec) r.push(`PEC: ${l.ente.pec}`);
    if (l.ente?.sito) r.push(`Sito: ${l.ente.sito}`);
    if (l.consiglio?.pec) r.push(`PEC del Consiglio: ${l.consiglio.pec}`);
    for (const g of l.gruppi) {
      r.push(`${g.titolo}:`);
      if (!g.persone.length) r.push('  (nessuno nei dati)');
      for (const p of g.persone) r.push(`  - ${riga(p)}`);
    }
    if (l.voto?.testo) r.push(`Quando si vota: ${l.voto.testo}`);
    if (l.nota) r.push(`Nota: ${l.nota}`);
  }
  r.push('', 'Come farti sentire:');
  for (const c of esito.comeFare) r.push(`- ${c.titolo}: ${c.testo}${c.fonti.length ? ` (${c.fonti.map((f) => f.titolo).join('; ')})` : ''}`);
  return r.join('\n');
}
