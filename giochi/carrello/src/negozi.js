// Il carrello del Black Friday: tre negozi inventati, ognuno con le trappole che l'Antitrust ha davvero
// sanzionato. Ogni trappola rimanda a un caso vero (codice del procedimento e pagina del bollettino AGCM,
// dal dossier legge/antitrust) e alla norma. I domini finiscono in .esempio: non esistono.
//
// Tipi di elemento:
//   info    un'etichetta sulla pagina; se è una trappola va toccata per smascherarla
//   casella un'aggiunta a pagamento; se è già spuntata è una trappola: va tolta prima di pagare
//   scelta  due pulsanti: quello grande è la trappola, quello piccolo la strada giusta
//   costo   una voce del riepilogo che compare solo alla fine: va toccata per smascherarla (si paga comunque)

export const NORME = {
  art17bis: { titolo: 'Codice del consumo, art. 17-bis: lo sconto si calcola sul prezzo più basso degli ultimi 30 giorni', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art17bis' },
  art23: { titolo: 'Codice del consumo, art. 23: le pratiche sempre vietate, come la falsa offerta «solo per poco tempo»', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art23' },
  art65: { titolo: 'Codice del consumo, art. 65: niente caselle già spuntate per i pagamenti in più', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art65' },
  art62: { titolo: 'Codice del consumo, art. 62: vietato far pagare di più per la carta o un altro mezzo di pagamento', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art62' },
  art21: { titolo: 'Codice del consumo, artt. 21 e 22: il prezzo totale va detto fin dall\'inizio', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art22' },
  art52: { titolo: 'Codice del consumo, art. 52: 14 giorni per ripensarci negli acquisti online', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206~art52' },
};

const B = (anno, n, pagina) => `https://www.agcm.it/dotcmsdoc/bollettini/${anno}/${n}-${String(anno).slice(2)}.pdf#page=${pagina}`;

export const CASI = {
  PS12704: { impresa: 'Poltronesofà', euro: 1000000, anno: 2025, pratica: 'sconti «a termine» calcolati su prezzi pieni quasi mai applicati', url: B(2026, 1, 264) },
  PS13027: { impresa: 'Deghi', euro: 2000000, anno: 2026, pratica: 'un conto alla rovescia che, alla scadenza, ripartiva alle stesse condizioni', url: B(2026, 26, 46) },
  PS12585: { impresa: 'Amazon', euro: 10000000, anno: 2024, pratica: '«acquisto periodico» e consegna veloce a pagamento già selezionati', url: B(2024, 17, 18) },
  PS12717: { impresa: 'Interflora Italia', euro: 400000, anno: 2025, pratica: 'costi di consegna non chiari durante l\'acquisto', url: B(2025, 4, 38) },
  PS12853: { impresa: 'eDreams', euro: 9000000, anno: 2026, pratica: 'abbonamento Prime spinto con fretta e scarsità artificiali, versione più cara preselezionata', url: B(2026, 6, 68) },
  PS12727: { impresa: 'Saglietti', euro: 40000, anno: 2024, pratica: 'supplemento di 3 euro per chi pagava con carta e di 8 con PayPal', url: B(2024, 43, 25) },
  PS12898: { impresa: 'Prenotazioni24', euro: 500000, anno: 2025, pratica: 'siti di biglietti per traghetti con commissioni non chiare', url: B(2025, 46, 74) },
  PS12962: { impresa: 'Trustpilot', euro: 4000000, anno: 2026, pratica: 'recensioni non controllate anche quando segnate come «verificate»', url: B(2026, 12, 29) },
  PS12525: { impresa: 'General Logistics Systems (GLS)', euro: 8000000, anno: 2025, pratica: 'un contributo «green» imposto ai clienti', url: B(2025, 5, 28) },
};

// Dal più facile al più difficile: il primo negozio insegna, l'ultimo ha più trappole e meno tempo.
export const NEGOZI = [
  {
    id: 'casa', nome: 'Casa Comoda', dominio: 'casacomoda.esempio', icona: '🛋️',
    regalo: 'Lampada da tavolo «Nordica»', foto: '💡', prezzo: 39.9,
    elementi: [
      { id: 'barrato', tipo: 'info', dove: 'prezzo', testo: 'Prima 89,90 € · oggi −55%', trappola: 'falsi-sconti', caso: 'PS12704', norma: 'art17bis',
        spiega: 'Lo sconto va calcolato sul prezzo più basso degli ultimi 30 giorni. Un «prezzo pieno» mai praticato rende lo sconto finto.' },
      { id: 'timer', tipo: 'info', dove: 'prezzo', testo: 'L\'offerta scade tra 00:59', conto: true, trappola: 'fretta', caso: 'PS13027', norma: 'art23',
        spiega: 'Un conto alla rovescia che riparte da capo serve solo a metterti fretta: l\'offerta non scade davvero.' },
      { id: 'spedizione', tipo: 'info', dove: 'prezzo', testo: 'Spedizione gratuita sopra i 29 €', spiega: 'Un\'informazione chiara sul costo di consegna: nessuna trappola.' },
      { id: 'protezione', tipo: 'casella', testo: 'Protezione acquisto 2 anni', euro: 6.9, spuntata: true, trappola: 'preselezioni', caso: 'PS12585', norma: 'art65',
        spiega: 'Un\'aggiunta a pagamento non può essere già spuntata: devi sceglierla tu. E la garanzia di 2 anni c\'è già per legge.' },
      { id: 'pacchetto', tipo: 'casella', testo: 'Confezione regalo', euro: 2, spuntata: false, spiega: 'Un\'aggiunta che scegli tu, non spuntata: nessuna trappola.' },
      { id: 'gestione', tipo: 'costo', testo: 'Contributo gestione ordine', euro: 2.9, trappola: 'costi-nascosti', caso: 'PS12717', norma: 'art21',
        spiega: 'Un costo che compare solo nel riepilogo finale: il prezzo deve essere quello totale fin dalla prima pagina.' },
    ],
  },
  {
    id: 'tech', nome: 'TecnoBaleno', dominio: 'tecnobaleno.esempio', icona: '🎧',
    regalo: 'Cuffie senza fili «Onda»', prezzo: 59,
    elementi: [
      { id: 'recensioni', tipo: 'info', dove: 'prezzo', testo: '★★★★★ 4,9 · 2.431 recensioni verificate', trappola: 'recensioni', caso: 'PS12962', norma: 'art23',
        spiega: '«Verificate» deve voler dire che chi recensisce ha comprato davvero. Recensioni non controllate spacciate per vere sono vietate.' },
      { id: 'resi', tipo: 'info', dove: 'prezzo', testo: 'Reso gratuito entro 30 giorni', spiega: 'Più dei 14 giorni previsti dalla legge per ripensarci: nessuna trappola.' },
      { id: 'green', tipo: 'casella', testo: 'Contributo spedizione green', euro: 1.5, spuntata: true, trappola: 'non-richiesti', caso: 'PS12525', norma: 'art65',
        spiega: 'Un contributo «verde» aggiunto senza chiederti niente. L\'Antitrust ha multato un corriere per un contributo simile imposto ai clienti.' },
      { id: 'estensione', tipo: 'casella', testo: 'Garanzia estesa 3 anni', euro: 14.9, spuntata: false, spiega: 'Un\'aggiunta facoltativa, non spuntata: decidi tu.' },
      { id: 'consegna', tipo: 'costo', testo: 'Consegna veloce (calcolata al checkout)', euro: 4.9, trappola: 'costi-nascosti', caso: 'PS12717', norma: 'art21',
        spiega: 'Il costo della consegna compare solo alla fine. Va detto chiaramente prima, insieme al prezzo.' },
      { id: 'meno40', tipo: 'info', dove: 'prezzo', testo: 'Black Friday −40% sul prezzo consigliato', trappola: 'falsi-sconti', caso: 'PS12704', norma: 'art17bis',
        spiega: 'Lo sconto va mostrato rispetto al prezzo più basso degli ultimi 30 giorni, non a un «prezzo consigliato» mai praticato.' },
    ],
  },
  {
    id: 'viaggio', nome: 'Viaggi Lampo', dominio: 'viaggilampo.esempio', icona: '⛴️',
    regalo: 'Traghetto per due, andata e ritorno', prezzo: 118,
    elementi: [
      { id: 'scarsita', tipo: 'info', dove: 'prezzo', testo: 'Solo 2 posti a questo prezzo · 17 persone lo stanno guardando', trappola: 'fretta', caso: 'PS12853', norma: 'art23',
        spiega: 'Scarsità e folla inventate servono a farti decidere senza confrontare. L\'Antitrust le ha sanzionate a un sito di viaggi.' },
      { id: 'bagaglio', tipo: 'info', dove: 'prezzo', testo: 'Bagaglio a mano incluso', spiega: 'Un\'informazione utile e chiara: nessuna trappola.' },
      { id: 'premium', tipo: 'scelta', testo: 'Vuoi risparmiare con Premium?', grande: 'Sì, prova Premium gratis', piccolo: 'No, continua senza', euro: 69.99, dopo: '69,99 € all\'anno dopo la prova',
        trappola: 'rinnovi-recesso', caso: 'PS12853', norma: 'art21',
        spiega: 'La «prova gratis» diventa un abbonamento annuale se non disdici in tempo. Il pulsante grande è quello che conviene al sito.' },
      { id: 'assicurazione', tipo: 'casella', testo: 'Assicurazione annullamento', euro: 12.9, spuntata: true, trappola: 'preselezioni', caso: 'PS12585', norma: 'art65',
        spiega: 'L\'assicurazione si aggiunge solo se la scegli tu. Una casella già spuntata per un pagamento in più non è consentita.' },
      { id: 'commissione', tipo: 'costo', testo: 'Commissioni di servizio', euro: 9.5, trappola: 'costi-nascosti', caso: 'PS12898', norma: 'art21',
        spiega: 'Commissioni che spuntano solo alla fine. Il prezzo mostrato all\'inizio deve già comprendere tutto.' },
      { id: 'carta', tipo: 'costo', testo: 'Supplemento pagamento con carta', euro: 3, trappola: 'sovrapprezzo-carta', caso: 'PS12727', norma: 'art62',
        spiega: 'Far pagare di più a chi usa la carta (o PayPal, o il bonifico) è vietato, a qualunque importo.' },
    ],
  },
];
