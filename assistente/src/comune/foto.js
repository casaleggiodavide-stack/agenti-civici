// Copia di comune/foto.js: non modificare qui, usa npm run sincronizza.
// Compila da una foto: la persona fotografa il documento (verbale, bolletta,
// carta d'imbarco, attestazione ISEE…) e Claude, con l'account di chi usa la
// pagina, ne legge i dati che servono al questionario. Funziona solo dentro
// claude.ai (capacità «sample» con immagini); altrove il riquadro non appare.
// I dati della persona (nome, codice fiscale, indirizzo, IBAN) non vengono
// trascritti, e ogni campo letto va ricontrollato: decide il documento.

import { esc } from './interfaccia.js';
import { normalizza, dizionario, PERSONALI_FOTO } from './campi.js';

const ERRORI = {
  not_granted: 'Per leggere la foto serve il permesso a usare Claude da questa pagina.',
  sampling_disabled: 'Claude non è disponibile per questo account.',
  images_unavailable: 'Questa vista non può mandare immagini a Claude.',
  rate_limited: 'Troppe richieste o limite di utilizzo raggiunto: riprova tra qualche minuto.',
  session_expired: 'La sessione è scaduta: accedi di nuovo a Claude e riprova.',
  image_rejected: 'L\'immagine non è stata accettata: prova con una foto JPEG o PNG più piccola.',
  invalid_json: 'Non sono riuscito a leggere il documento: prova con una foto più nitida, dritta e ben illuminata.',
  refused: 'La foto non è stata letta. Prova con un\'altra foto del documento.',
  empty_completion: 'Non è arrivata una risposta: riprova.',
  upstream_error: 'Si è interrotta la connessione con Claude: riprova.',
  formato: 'Questo formato di foto non si apre qui: prova con una foto JPEG o PNG (sull\'iPhone: Impostazioni, Fotocamera, Formati, Più compatibile).',
};

/** Il lettore di foto di questa vista, oppure null se qui non si può. */
export async function lettore() {
  try {
    if (typeof window === 'undefined' || !window.claude?.use) return null;
    const sample = await window.claude.use('sample');
    if (!sample) return null;
    const limiti = await sample.limits().catch(() => null);
    return limiti?.images ? { sample, immagini: limiti.images } : null;
  } catch { return null; }
}

/** Converte in JPEG le foto di un formato non accettato (per esempio HEIC) o troppo pesanti. */
export async function preparaImmagine(file, immagini) {
  const tipi = immagini.mediaTypes || [];
  if (tipi.includes(file.type) && file.size <= immagini.maxInputBytes) return file;
  const bitmap = await createImageBitmap(file);
  const scala = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const tela = document.createElement('canvas');
  tela.width = Math.round(bitmap.width * scala);
  tela.height = Math.round(bitmap.height * scala);
  tela.getContext('2d').drawImage(bitmap, 0, 0, tela.width, tela.height);
  return new Promise((ok, no) => tela.toBlob((b) => (b ? ok(b) : no(new Error('conversione non riuscita'))), 'image/jpeg', 0.85));
}

/** Il testo per Claude: cosa c'è nella foto, quali campi leggere, in che forma rispondere. */
export function istruzioniLettura({ strumento, cosa, domande, oggi, condizioniFigli, note = '' }) {
  return `Sei il lettore di documenti di «${strumento}», uno strumento civico italiano. Nella foto c'è ${cosa}. Oggi è il ${oggi}.

Estrai SOLO i campi del dizionario qui sotto che sono scritti chiaramente nel documento. Non dedurre e non indovinare: se un dato non è scritto o non si legge bene, non metterlo, e se vuoi segnalalo nei dubbi. Non trascrivere mai nome, cognome, codice fiscale, data di nascita, indirizzo, email, telefono o IBAN della persona. Le date vanno in AAAA-MM-GG, gli importi come numeri (182.4). Per le scelte usa esattamente uno dei valori ammessi.${note ? `\n${note}` : ''}

Rispondi solo con un oggetto JSON in questa forma:
{"documento": "che documento è, in poche parole", "leggibile": true, "risposte": {"campo": valore}, "dubbi": ["campo: perché non è sicuro"]}

DIZIONARIO DEI CAMPI
${dizionario(domande, { condizioniFigli, personali: PERSONALI_FOTO })}`;
}

/** Legge una foto e restituisce i campi controllati. Lancia l'errore della piattaforma {code}. */
export async function leggiFoto({ lettore: l, file, strumento, cosa, domande, oggi, condizioniFigli = [], note, signal }) {
  let immagine;
  try { immagine = await preparaImmagine(file, l.immagini); } catch { throw { code: 'formato' }; }
  const risposta = await l.sample.json(istruzioniLettura({ strumento, cosa, domande, oggi, condizioniFigli, note }), { images: [immagine], modelTier: 'default', signal });
  const { risposte, avvisi } = normalizza(domande, risposta?.risposte || {}, { condizioniFigli, personali: PERSONALI_FOTO });
  return {
    documento: String(risposta?.documento || '').slice(0, 120),
    leggibile: risposta?.leggibile !== false,
    risposte,
    dubbi: (Array.isArray(risposta?.dubbi) ? risposta.dubbi : []).map((x) => String(x).slice(0, 200)).slice(0, 8),
    avvisi,
  };
}

/**
 * Mette nel contenitore il riquadro «Compila da una foto». Se la vista non
 * può mandare immagini a Claude, il contenitore resta nascosto.
 * @param {object} p { contenitore, strumento, cosa, domande, oggi, condizioniFigli, note, alRisultato(risposte) }
 */
export async function montaFoto(p) {
  const box = p.contenitore;
  if (!box) return;
  box.hidden = true;
  const l = await lettore();
  if (!l) return;
  box.hidden = false;
  box.classList.add('foto');
  box.innerHTML = `
    <div><b>Compila da una foto</b>
    <p>Fotografa ${esc(p.cosa)}: Claude legge i dati e riempie le domande. La foto passa da Claude con il tuo account e non viene salvata qui. Nome, codice fiscale e indirizzo non vengono trascritti: se preferisci, coprili prima di scattare.</p></div>
    <label class="btn btn-primario foto-scegli">Scegli o scatta una foto<input type="file" accept="${esc((l.immagini.mediaTypes || ['image/jpeg', 'image/png']).join(',') + ',image/heic,image/heif')}" hidden></label>
    <p class="foto-esito" role="status" aria-live="polite"></p>`;
  const input = box.querySelector('input[type=file]');
  const esito = box.querySelector('.foto-esito');
  const etichette = Object.fromEntries(p.domande.map((d) => [d.id, d.etichetta.replace(/\?$/, '')]));
  let ctl = null;
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    ctl?.abort();
    ctl = new AbortController();
    esito.className = 'foto-esito';
    esito.textContent = 'Sto leggendo il documento…';
    try {
      const r = await leggiFoto({ ...p, lettore: l, file, signal: ctl.signal });
      const campi = Object.keys(r.risposte);
      if (!campi.length) {
        esito.classList.add('foto-vuoto');
        esito.textContent = r.leggibile ? `Ho riconosciuto ${r.documento || 'il documento'}, ma non ho trovato dati per queste domande.` : 'Il documento non si legge bene: prova con una foto più nitida, dritta e ben illuminata.';
        return;
      }
      p.alRisultato(r.risposte);
      esito.innerHTML = `<b>${esc(r.documento ? r.documento.charAt(0).toUpperCase() + r.documento.slice(1) : 'Documento letto')}: ho compilato ${campi.length} ${campi.length === 1 ? 'campo' : 'campi'}.</b> ${esc(campi.map((c) => etichette[c] || c).join('; '))}. <b>Controllali uno per uno</b>: fa fede il documento, non la lettura automatica.${r.dubbi.length ? `<br>Da verificare: ${esc(r.dubbi.map((d) => d.replace(/^\s*([a-z_]+)\s*:/, (m, k) => `${etichette[k] || k}:`)).join('; '))}.` : ''}`;
    } catch (e) {
      if (e?.code === 'cancelled') return;
      esito.classList.add('foto-errore');
      esito.textContent = ERRORI[e?.code] || ERRORI.upstream_error;
      if (['not_granted', 'sampling_disabled', 'images_unavailable', 'capability_disabled', 'not_declared'].includes(e?.code)) input.closest('label').hidden = true;
    }
  });
}
