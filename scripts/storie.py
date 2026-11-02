#!/usr/bin/env python3
"""Le storie del Polpo: la pagina editoriale (storie/index.html) e la striscia dei titoli nella pagina d'ingresso.

Le storie sono datate: i numeri sono quelli letti il giorno dell'uscita e restano fermi anche quando
i dati degli strumenti si aggiornano. Le tabelle vengono da storie/dati.json, una fotografia dei dati
di quel giorno (ANAC 2025 per gli appalti, BDAP 2025 per i bilanci).

Regole di redazione: un indicatore non è un illecito; si scrive «senza gara», mai «irregolare»;
nessun nome di persona; metodo e fonte sotto ogni storia; gli enti possono chiedere di pubblicare
la loro spiegazione.

Uso: python3 -I scripts/storie.py
"""
import html
import importlib.util
import json
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location('casa', os.path.join(REPO, 'scripts', 'casa-polpo.py'))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)

DATI = json.load(open(os.path.join(REPO, 'storie', 'dati.json'), encoding='utf-8'))
CONTATTO = 'https://github.com/casaleggiodavide-stack/agenti-civici/issues/new?title=Storie%20del%20Polpo%3A%20'


def it(n, dec=0):
    """Numero all'italiana: 1.234,5"""
    s = f'{n:,.{dec}f}'
    return s.replace(',', '§').replace('.', ',').replace('§', '.')


def euro(v):
    if v >= 1e9:
        return it(v / 1e9, 1) + ' mld'
    if v >= 1e6:
        return it(v / 1e6, 0 if v >= 1e8 else 1) + ' mln'
    return it(v / 1e3, 0) + ' mila'


def barre(righe, massimo=None, unita='', evidenzia=None, chiave='barre'):
    """Barre orizzontali in CSS: [(etichetta, valore, testo)]"""
    m = massimo or max(v for _, v, _ in righe)
    out = []
    for i, (et, v, t) in enumerate(righe):
        cl = ' acceso' if evidenzia and evidenzia(i, et, v) else ''
        out.append(f'<div class="riga{cl}"><span class="et">{et}</span><span class="traccia"><span class="pieno" style="width:{100 * v / m:.1f}%"></span></span><span class="val">{t}{unita}</span></div>')
    return f'<div class="{chiave}">' + ''.join(out) + '</div>'


def tabella(id_, colonne, righe, ordina=None):
    """Tabella ordinabile: colonne = [(titolo, tipo)] con tipo 't' testo o 'n' numero; righe = [[(mostrato, valore)]]"""
    th = ''.join(f'<th scope="col" data-k="{i}" data-tipo="{t}"{" aria-sort=\"descending\"" if ordina == i else ""}><button type="button">{c}</button></th>'
                 for i, (c, t) in enumerate(colonne))
    tr = ''.join('<tr>' + ''.join(f'<td{" class=\"n\"" if colonne[i][1] == "n" else ""} data-v="{html.escape(str(v))}">{m}</td>' for i, (m, v) in enumerate(r)) + '</tr>' for r in righe)
    return f'<div class="scorri"><table class="ordinabile" id="{id_}"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'


# ---------------------------------------------------------------- i blocchi con i dati

def fasce():
    righe = [(g.replace(' abitanti', ''), 100 * k / n, f'{round(100 * k / n)}% · {it(k)} su {it(n)}') for g, n, k in DATI['fasce']]
    return barre(righe, 100)


def citta_appalti():
    righe = [[(c, c), (it(p), p), (it(n), n), (euro(v), v), (it(qn, 1) + '%', qn), (it(qv, 1) + '%', qv)] for c, p, n, v, qn, qv in DATI['citta_appalti']]
    return tabella('t-citta', [('Città', 't'), ('Abitanti', 'n'), ('Procedure', 'n'), ('Valore', 'n'), ('Senza gara, per numero', 'n'), ('Senza gara, per valore', 'n')], righe, 5)


def soglia():
    righe = [(f'{round(100 * q)}-{round(100 * q) + 5}%', n, it(n)) for q, n in DATI['soglia']]
    return barre(righe, evidenzia=lambda i, et, v: et == '95-100%', chiave='barre soglia')


def regioni():
    med = DATI['mediana_riscossione']
    righe = [(r, v, it(v, 1)) for r, v, _ in DATI['regioni_riscossione']]
    return barre(righe, 100, evidenzia=lambda i, et, v: v < med)


def citta_riscossione():
    righe = [[(c, c), (r, r), (it(p), p), (it(v, 1), v)] for c, p, v, r in DATI['citta_riscossione']]
    return tabella('t-risc', [('Città', 't'), ('Regione', 't'), ('Abitanti', 'n'), ('Euro incassati su 100', 'n')], righe)


# ---------------------------------------------------------------- le storie
# braccio: indice in casa.BRACCIA (0-7); strumento: cartella dello strumento da provare

STORIE = [
    dict(
        slug='un-comune-su-quattro', braccio=5, strumento=('appalti', 'Cerca il tuo Comune'),
        titolo='In un Comune su quattro quasi tutto si compra senza gara',
        breve='In un Comune su quattro quasi tutto si compra senza gara',
        sommario='Nel 2025 1.971 Comuni hanno affidato senza gara almeno nove euro su dieci dei loro acquisti; 1.437 tutto. Sono quasi solo Comuni piccoli, e la legge in molti casi lo consente. Il confronto con i Comuni simili dice dove guardare.',
        corpo=lambda: f'''
<p>Nei dati aperti dell'Autorità nazionale anticorruzione ci sono tutti i contratti pubblici avviati nel 2025. Il Polpo li ha letti ente per ente: per 7.495 Comuni le procedure bastano per fare un conto. In 1.971 di questi, uno su quattro, almeno il 90% del valore è passato senza gara. In 1.437 la quota è del 100%: nemmeno una gara in tutto l'anno.</p>
<p>Non è per forza un problema. Il codice dei contratti pubblici del 2023 permette di affidare direttamente i lavori fino a 150.000 euro e i servizi e le forniture fino a 140.000. Un Comune di mille abitanti che compra la carta, ripara il tetto della scuola e rinnova il programma dell'anagrafe può passare un anno intero senza superare quelle cifre. Infatti il fenomeno si concentra nei Comuni più piccoli e sparisce sopra i 60.000 abitanti.</p>
<figure class="dato"><figcaption>Comuni che hanno affidato senza gara almeno il 90% del valore, per numero di abitanti</figcaption>{fasce()}</figure>
<p>Il numero diventa interessante quando un Comune si discosta dai suoi simili. Per questo la scheda del Polpo non dice mai «troppo» in assoluto: mette ogni Comune accanto a quelli della stessa fascia, alla media della sua Regione e ai Comuni con lo stesso numero di abitanti.</p>
<p>Senza gara non vuol dire illecito: vuol dire che l'impresa è stata scelta dall'ente, senza una competizione aperta. Il perché si legge negli atti, e il Polpo prepara la richiesta per averli.</p>''',
        metodo='Quota del valore a base d\'asta delle procedure senza gara (affidamenti diretti e procedure negoziate senza bando) sul totale delle procedure avviate dal Comune nel 2025; Comuni con almeno 5 procedure. Gli affidamenti senza gara oltre i 5 milioni sono contati ma esclusi dai valori in euro (vedi «Il Comune che affida 5 miliardi senza gara»).',
        fonte='ANAC, Banca dati nazionale dei contratti pubblici, dati aperti 2025 (CC BY-SA 4.0)',
    ),
    dict(
        slug='cinque-miliardi', braccio=5, strumento=('appalti', 'Guarda le schede degli enti'),
        titolo='Il Comune che affida 5 miliardi senza gara (e perché non è vero)',
        breve='Il Comune che affida 5 miliardi senza gara (e perché non è vero)',
        sommario='Nei dati pubblici sugli appalti ci sono 2.938 affidamenti senza gara da oltre 5 milioni l\'uno, alcuni da miliardi. Con ogni probabilità sono errori di registrazione, ma bastano a stravolgere le classifiche: Palermo passava dal 6% al 91%.',
        corpo=lambda: '''
<p>Un Comune di circa 1.500 abitanti in provincia di Rovigo risulta aver affidato senza gara un servizio di pulizia da 5,2 miliardi di euro. Un Comune in provincia di Como, il gas per gli edifici comunali: un miliardo. Palermo, due affidamenti da 2,7 miliardi ciascuno allo stesso fornitore, uno per gli impianti di videosorveglianza.</p>
<p>Sono cifre impossibili. La legge consente l'affidamento diretto fino a 140.000 euro per servizi e forniture e fino a 150.000 per i lavori. Gli oggetti di questi contratti (energia, gas, carburante, buoni pasto, pulizie) fanno pensare che nel campo dell'importo sia finito il valore dell'intera convenzione nazionale a cui il Comune ha aderito, non quello del suo contratto, che vale una frazione minima.</p>
<figure class="dato numeri"><div><b>2.938</b><span>affidamenti senza gara oltre i 5 milioni nei dati ANAC 2025</span></div><div><b>675</b><span>enti coinvolti, di cui 94 Comuni</span></div><div><b>91% → 6%</b><span>il valore senza gara di Palermo prima e dopo la correzione</span></div></figure>
<p>Chi usa questi dati senza controllarli rischia di raccontare scandali che non esistono. Anche il Polpo, fino a oggi, mostrava Palermo con il 90,8% del valore affidato senza gara: tolti i due contratti impossibili, la quota è del 6,3%, fra le più basse delle grandi città.</p>
<p>Da oggi il Polpo conta queste procedure fra quelle dell'ente ma le tiene fuori da tutti i calcoli in euro, e lo scrive nella scheda. Il dato lo può correggere solo l'ente che l'ha inserito nella banca dati.</p>''',
        metodo='Procedure senza gara con importo a base d\'asta di almeno 5 milioni di euro: oltre 33 volte il limite dell\'affidamento diretto. Contate nel numero delle procedure, escluse dai valori in euro e dalla quota del primo fornitore.',
        fonte='ANAC, Banca dati nazionale dei contratti pubblici, dati aperti 2025 (CC BY-SA 4.0)',
    ),
    dict(
        slug='appena-sotto-la-soglia', braccio=5, strumento=('appalti', 'Guarda il tuo Comune'),
        titolo='Appena sotto la soglia: 21.330 affidamenti nell\'ultimo 5% prima della gara',
        breve='21.330 affidamenti appena sotto la soglia della gara',
        sommario='Gli affidamenti diretti del 2025 si ammassano appena sotto i 140.000 euro (150.000 per i lavori), il limite oltre il quale serve una gara: più del doppio di quelli della fascia precedente, otto volte quelli appena sopra.',
        corpo=lambda: f'''
<p>Se gli importi degli affidamenti diretti fossero distribuiti senza pensare alla soglia, ogni fascia di valore conterrebbe più o meno gli stessi contratti di quella vicina. Non va così. Fra il 90 e il 95% della soglia ci sono 9.224 affidamenti; fra il 95 e il 100% ce ne sono 21.330. Appena sopra la soglia, dove serve una gara, scendono a 2.465.</p>
<figure class="dato"><figcaption>Affidamenti senza gara del 2025 per importo, in percentuale della soglia oltre la quale serve una gara</figcaption>{soglia()}<p class="nota">La barra rossa è l'ultimo 5% prima della soglia. Su 1.223.653 affidamenti senza gara di lavori, servizi e forniture.</p></figure>
<p>C'è una spiegazione innocente: molti enti fissano il valore di un contratto al massimo consentito, per avere margine, anche se poi spendono meno. E c'è quella che preoccupa: un contratto tagliato su misura per restare sotto il limite. I dati non bastano a distinguerle. Gli atti sì: la determina che motiva l'affidamento, il preventivo, le fatture.</p>
<p>Nella scheda di ogni ente il Polpo mostra quanti dei suoi affidamenti cadono in quell'ultimo 5%, li confronta con gli enti simili e prepara la richiesta di accesso agli atti.</p>''',
        metodo='Importo a base d\'asta degli affidamenti senza gara diviso per la soglia dell\'affidamento diretto (140.000 euro per servizi e forniture, 150.000 per i lavori, d.lgs. 36/2023, art. 50), in fasce del 5%.',
        fonte='ANAC, Banca dati nazionale dei contratti pubblici, dati aperti 2025 (CC BY-SA 4.0)',
    ),
    dict(
        slug='un-affidamento-alla-volta', braccio=5, strumento=('appalti', 'Guarda il tuo Comune'),
        titolo='Un affidamento alla volta: 26.978 casi in cui la somma supera la soglia',
        breve='Un affidamento alla volta: 26.978 somme oltre la soglia',
        sommario='In 5.194 enti lo stesso fornitore ha ricevuto più affidamenti diretti, ciascuno sotto il limite, che sommati lo superano. Spesso sono acquisti diversi e legittimi; a volte è un contratto spezzato in parti.',
        corpo=lambda: '''
<p>La legge lo dice chiaro: un appalto non può essere diviso in parti per evitare le regole delle gare (d.lgs. 36/2023, art. 14). Ma da fuori non si vede. Si vede solo che lo stesso ente, nello stesso anno, ha affidato direttamente allo stesso fornitore più contratti, ognuno sotto la soglia.</p>
<p>Nei dati del 2025 il Polpo ha trovato 26.978 casi in cui la somma di questi affidamenti supera la soglia della gara: 140.000 euro per servizi e forniture, 150.000 per i lavori. Riguardano 5.194 enti.</p>
<figure class="dato numeri"><div><b>26.978</b><span>coppie ente-fornitore con affidamenti diretti che sommati superano la soglia</span></div><div><b>5.194</b><span>enti in cui succede almeno una volta</span></div></figure>
<p>Molti casi hanno una ragione semplice: la manutenzione delle strade in primavera e quella dell'illuminazione in autunno sono lavori diversi, anche se li fa la stessa impresa. Altri meritano una domanda. Nella scheda dell'ente trovi i fornitori in questa situazione (le persone fisiche non sono mostrate) e la richiesta di accesso già pronta.</p>
<p>Un segnale non è un illecito. Prima di scriverne, un giornalista dovrebbe leggere le determine e chiedere all'ente.</p>''',
        metodo='Per ogni ente e fornitore, somma degli affidamenti senza gara del 2025 sotto la soglia, separando i lavori da servizi e forniture; casi con almeno due affidamenti e somma pari o superiore alla soglia. Enti con almeno 5 procedure.',
        fonte='ANAC, dati aperti 2025: CIG, aggiudicazioni, aggiudicatari (CC BY-SA 4.0)',
    ),
    dict(
        slug='grandi-citta', braccio=5, strumento=('appalti', 'Confronta le città'),
        titolo='Nelle grandi città otto atti su dieci sono senza gara. Ma i soldi passano dalle gare',
        breve='Grandi città: otto atti su dieci senza gara, ma i soldi passano dalle gare',
        sommario='Nei 26 Comuni sopra i 150.000 abitanti gli affidamenti senza gara sono la grande maggioranza delle procedure: dal 65% di Torino al 92% di Modena. In valore, però, pesano molto meno: in 17 città su 26 sotto un quinto.',
        corpo=lambda: f'''
<p>Una grande città fa centinaia di piccoli acquisti e qualche grande appalto. I piccoli passano quasi tutti senza gara, come la legge consente; i grandi passano per un bando. Così, contando le procedure, 22 città su 26 affidano senza gara più di tre volte su quattro. Contando gli euro, in 17 città su 26 la quota resta sotto il 20%.</p>
{citta_appalti()}
<p class="nota">Tocca i titoli delle colonne per ordinare.</p>
<p>Per valore, in cima ci sono Trieste (45%), Reggio Calabria (44%) e Livorno (41%). Sono tre delle cinque città con il valore di appalti più basso del gruppo nel 2025, dove poche procedure spostano molto: a Trieste, per esempio, pesa l'energia elettrica comprata aderendo a una convenzione nazionale, che nei dati figura come affidamento diretto. In fondo ci sono Venezia (0,9%), Palermo (6,3%), Milano e Messina (7,3%). A Venezia il conto è dominato da due concessioni per la gestione di un impianto sportivo, che valgono insieme oltre due miliardi su tutta la loro durata.</p>
<p>Questi numeri riguardano solo le procedure avviate dal Comune. Le grandi città comprano anche attraverso società partecipate e centrali di committenza, che hanno una scheda a parte.</p>''',
        metodo='Procedure avviate nel 2025 dal Comune come stazione appaltante. Senza gara: affidamenti diretti e procedure negoziate senza bando. Valore a base d\'asta; esclusi dai valori gli affidamenti senza gara oltre i 5 milioni.',
        fonte='ANAC, Banca dati nazionale dei contratti pubblici, dati aperti 2025 (CC BY-SA 4.0)',
    ),
    dict(
        slug='su-cento-euro', braccio=4, strumento=('bilancio-comune', 'Guarda il bilancio del tuo Comune'),
        titolo='Su 100 euro di tasse e multe, Reggio Calabria ne incassa 58. Bologna 86',
        breve='Su 100 euro di tasse e multe, Reggio Calabria ne incassa 58. Bologna 86',
        sommario='Quanto riescono a incassare i Comuni di ciò che è loro dovuto nell\'anno? Nei rendiconti 2025 la mediana italiana è 82 euro su 100. Fra le Regioni si va da 63 a 90, fra le grandi città da 58 a 86.',
        corpo=lambda: f'''
<p>Ogni anno un Comune accerta quello che gli spetta: l'IMU, la tassa sui rifiuti, le multe, le rette della mensa e dell'asilo. Poi deve incassarlo. Il Polpo ha messo a confronto i due numeri nei rendiconti 2025 di 7.808 Comuni: su 100 euro dovuti, quanti entrano davvero in cassa entro l'anno.</p>
<figure class="dato"><figcaption>Euro incassati nell'anno su 100 di tributi ed entrate proprie, mediana dei Comuni di ogni Regione (Italia: {it(DATI["mediana_riscossione"], 1)})</figcaption>{regioni()}<p class="nota">In rosso le Regioni sotto la mediana italiana.</p></figure>
<p>Fra le città con più di 150.000 abitanti il divario è più forte. Reggio Calabria incassa 58,3 euro su 100, Napoli 59,7, Catania 61,9, Palermo 62,2. In cima Bologna con 85,7, Parma con 85,5, Reggio Emilia e Genova con 84,9.</p>
{citta_riscossione()}
<p>Perché conta: quello che non si incassa va coperto. La legge obbliga i Comuni ad accantonare un fondo per i crediti che probabilmente non riscuoteranno, e quei soldi non possono essere spesi per i servizi. Detto in breve: chi paga copre anche chi non paga.</p>
<p>Attenzione a leggerlo come «evasione»: una parte di ciò che non si incassa nell'anno arriva negli anni dopo, e l'indicatore misura anche la rapidità degli uffici e la situazione economica di chi deve pagare.</p>''',
        metodo='Riscossioni in conto competenza dei titoli 1 (tributi) e 3 (entrate extratributarie: multe, rette, canoni) divise per gli accertamenti degli stessi titoli, rendiconto 2025. Mediana dei Comuni per Regione.',
        fonte='Ragioneria generale dello Stato, OpenBDAP, rendiconti dei Comuni 2025',
    ),
    dict(
        slug='comuni-in-deficit', braccio=4, strumento=('bilancio-comune', 'Guarda il bilancio del tuo Comune'),
        titolo='97 Comuni in deficit strutturale: 88 sono in Campania, Calabria e Sicilia',
        breve='97 Comuni in deficit strutturale: 88 in Campania, Calabria e Sicilia',
        sommario='Secondo i parametri del Ministero dell\'Interno, 97 Comuni risultano strutturalmente deficitari nei rendiconti 2025. E 895 Comuni chiudono l\'anno con la parte disponibile del risultato in negativo: un disavanzo da coprire negli anni a venire.',
        corpo=lambda: '''
<p>Ogni anno, con il rendiconto, i Comuni compilano una tabella di parametri fissati dal Ministero dell'Interno: quanto pesano le spese fisse, quanto riescono a incassare, quanto debito hanno, se hanno debiti fuori bilancio o un disavanzo. Se almeno la metà è fuori posto, il Comune è «strutturalmente deficitario».</p>
<figure class="dato numeri"><div><b>34</b><span>in Campania</span></div><div><b>30</b><span>in Calabria</span></div><div><b>24</b><span>in Sicilia</span></div><div><b>9</b><span>nel resto d'Italia: Lazio 4, Molise 2, Puglia 2, Abruzzo 1</span></div></figure>
<p>Non è un'etichetta: per legge (art. 243 del Testo unico degli enti locali) questi Comuni sono sottoposti a controlli centrali sulle assunzioni e devono coprire con le tariffe una quota minima del costo di alcuni servizi, come le mense e gli asili. Per chi ci vive vuol dire spesso servizi più cari o più ridotti.</p>
<p>C'è poi un segnale più largo. 895 Comuni chiudono il rendiconto con la parte disponibile del risultato in negativo: hanno un disavanzo da ripianare, cioè risorse degli anni futuri già impegnate per coprire il passato.</p>
<p>Il Polpo mostra per ogni Comune quali parametri sono fuori posto e come si confronta con i Comuni simili. I parametri sono quelli dichiarati dai Comuni stessi alla banca dati dello Stato.</p>''',
        metodo='Condizione di ente strutturalmente deficitario come risulta dalla tabella dei parametri obiettivo del rendiconto 2025, e parte disponibile del risultato di amministrazione dello stesso rendiconto.',
        fonte='Ragioneria generale dello Stato, OpenBDAP, rendiconti dei Comuni 2025',
    ),
    dict(
        slug='volo-in-ritardo', braccio=0, strumento=('mi-rimborsano', 'Calcola il tuo rimborso'),
        titolo='Volo in ritardo: fino a 600 euro, senza regalarne un terzo',
        breve='Volo in ritardo: fino a 600 euro, senza regalarne un terzo',
        sommario='Per un ritardo di oltre tre ore all\'arrivo il regolamento europeo prevede 250, 400 o 600 euro. Le società che fanno la richiesta per te trattengono in genere tra il 20 e il 35%. La lettera si può scrivere da soli, gratis.',
        corpo=lambda: '''
<p>Il regolamento europeo sui diritti dei passeggeri aerei (n. 261 del 2004) vale per tutti i voli in partenza da un aeroporto dell'Unione, con qualunque compagnia, e per quelli in arrivo nell'Unione con una compagnia europea. Se arrivi con più di tre ore di ritardo, o il volo è cancellato con poco preavviso, hai diritto a una compensazione fissa.</p>
<figure class="dato numeri"><div><b>250 €</b><span>voli fino a 1.500 km</span></div><div><b>400 €</b><span>da 1.500 a 3.500 km, e tutti i voli dentro l'Unione oltre i 1.500 km</span></div><div><b>600 €</b><span>oltre 3.500 km</span></div></figure>
<p>La compagnia non paga se dimostra circostanze eccezionali, come il maltempo o lo sciopero dei controllori di volo. Lo sciopero del suo stesso personale, invece, non la esonera.</p>
<p>Molti passeggeri si rivolgono a società specializzate, che chiedono il rimborso al posto loro e trattengono in genere tra il 20 e il 35% della somma. Servono quando la compagnia non risponde e si arriva a una causa. Per cominciare basta una lettera: il Polpo calcola quanto ti spetta e la scrive con te. Vale anche per i treni, con regole diverse.</p>''',
        metodo='Importi e condizioni dal regolamento (CE) n. 261/2004, artt. 5-7, e dalla giurisprudenza della Corte di giustizia dell\'Unione europea sul ritardo all\'arrivo. Commissioni dalle condizioni pubblicate dalle principali società del settore, ottobre 2026.',
        fonte='Regolamento (CE) n. 261/2004; Corte di giustizia UE',
    ),
    dict(
        slug='visita-tra-un-anno', braccio=2, strumento=('liste-attesa', 'Prepara la richiesta'),
        titolo='Visita fra un anno? Ci sono tempi massimi, e un modo per farli rispettare',
        breve='Visita fra un anno? Ci sono tempi massimi, e un modo per farli rispettare',
        sommario='Sulla ricetta il medico scrive una lettera: U, B, D o P. Ognuna ha un tempo massimo, da 3 a 120 giorni. Se l\'ASL non lo rispetta, puoi chiedere la prestazione in libera professione pagando solo il ticket.',
        corpo=lambda: '''
<p>Quasi nessuno lo guarda, ma sulla ricetta c'è un codice di priorità. Il medico lo sceglie in base all'urgenza, e il piano nazionale per le liste d'attesa fissa per ognuno un tempo massimo per la prima visita o il primo esame.</p>
<figure class="dato numeri"><div><b>3 giorni</b><span>U, urgente</span></div><div><b>10 giorni</b><span>B, breve</span></div><div><b>30 / 60 giorni</b><span>D, differibile: visite / esami</span></div><div><b>120 giorni</b><span>P, programmata</span></div></figure>
<p>Se al CUP ti danno una data oltre quel limite, la legge prevede una strada: chiedere all'ASL di farti avere la prestazione entro i tempi, anche in libera professione dentro l'ospedale, pagando solo il ticket (d.lgs. 124/1998, art. 3, comma 13). Ogni Regione ha il suo percorso e i suoi moduli.</p>
<p>Il Polpo ti dice qual è il tuo tempo massimo, ti spiega il percorso della tua Regione e scrive con te la richiesta.</p>
<p>I tempi valgono per i primi accessi, non per i controlli successivi, che il medico programma a parte.</p>''',
        metodo='Classi di priorità e tempi massimi dal Piano nazionale di governo delle liste d\'attesa; diritto alla prestazione in libera professione dal d.lgs. 124/1998, art. 3, comma 13.',
        fonte='Ministero della Salute, Piano nazionale di governo delle liste d\'attesa; d.lgs. 124/1998',
    ),
    dict(
        slug='black-friday', braccio=3, strumento=('garanzia', 'Controlla i tuoi diritti'),
        titolo='Black Friday: 14 giorni per ripensarci online, 2 anni di garanzia ovunque',
        breve='Black Friday: 14 giorni per ripensarci online, 2 anni di garanzia ovunque',
        sommario='Il 27 novembre si compra molto, e in fretta. Due diritti da ricordare: il recesso di 14 giorni per gli acquisti online, senza dare spiegazioni, e la garanzia legale di 2 anni, anche in negozio.',
        corpo=lambda: '''
<p>Per gli acquisti online, per telefono o fuori dai negozi il Codice del consumo dà 14 giorni per cambiare idea, senza dire perché. Si contano dalla consegna. Il venditore deve restituire quello che hai pagato, compresa la spedizione standard. Le eccezioni sono poche: i prodotti fatti su misura, quelli che deperiscono, quelli sigillati per igiene una volta aperti, i contenuti digitali già scaricati.</p>
<p>In negozio il recesso non c'è: il cambio è una cortesia del venditore, che può fissare le sue regole.</p>
<figure class="dato numeri"><div><b>14 giorni</b><span>per recedere da un acquisto online, dalla consegna</span></div><div><b>2 anni</b><span>di garanzia legale, online e in negozio</span></div></figure>
<p>La garanzia legale invece vale ovunque, per due anni, e la dà il venditore, non il produttore. Se il prodotto si rompe o non funziona come promesso, hai diritto alla riparazione o alla sostituzione gratuita; se non è possibile, a uno sconto o alla restituzione dei soldi. La garanzia «commerciale» del produttore si aggiunge, non la sostituisce.</p>
<p>Il Polpo ti dice quale diritto vale nel tuo caso e prepara la lettera al venditore.</p>''',
        metodo='Diritto di recesso: Codice del consumo (d.lgs. 206/2005), artt. 52-59. Garanzia legale di conformità: artt. 128-135-septies.',
        fonte='Codice del consumo, d.lgs. 206/2005',
    ),
    dict(
        slug='pacco-in-giacenza', braccio=3, strumento=('truffe', 'Controlla un messaggio'),
        titolo='Il pacco in giacenza non esiste',
        breve='Il pacco in giacenza non esiste',
        sommario='Sotto le feste tornano gli SMS del finto corriere: un link, una piccola cifra da pagare, i dati della carta. Riconoscerli richiede dieci secondi. E sui falsi investimenti la CONSOB ha già oscurato 1.848 siti.',
        corpo=lambda: '''
<p>«Il tuo pacco è in giacenza, paga 1,99 euro per la nuova consegna». Il messaggio arriva quando aspetti davvero un pacco, ed è proprio questo il trucco. Il link porta a una pagina identica a quella del corriere, che chiede i dati della carta: da lì partono addebiti ben più alti.</p>
<p>I segnali sono sempre gli stessi: l'indirizzo del sito non è quello del corriere, c'è fretta («entro 24 ore»), si chiede un pagamento piccolo con un link. Un corriere non ti chiede di pagare con un link in un SMS. Se hai un dubbio, apri tu il sito ufficiale scrivendo l'indirizzo e cerca il numero di spedizione.</p>
<figure class="dato numeri"><div><b>1.848</b><span>siti di investimenti abusivi oscurati dalla CONSOB dal 2019</span></div></figure>
<p>Lo stesso vale per i falsi investimenti, che promettono guadagni sicuri con le criptovalute o il trading: la CONSOB ne fa oscurare decine ogni settimana, ma ne nascono di nuovi.</p>
<p>Il Polpo legge il messaggio che hai ricevuto, controlla l'indirizzo nell'elenco dei siti oscurati e ti dice quali segnali ci sono. Non dice mai «sicuro»: dice cosa guardare.</p>''',
        metodo='Segnali tipici delle truffe via SMS ed email; numero dei siti oscurati come dichiarato dalla CONSOB nel comunicato più recente letto il 25 ottobre 2026.',
        fonte='CONSOB, comunicati sull\'oscuramento dei siti abusivi',
    ),
]


# ---------------------------------------------------------------- dai dossier di «Il Polpo legge per te» (2 novembre 2026)

MINISTERI = [  # ministero, interrogazioni scritte, % con risposta, tutti gli atti, % con risposta (dati aperti Camera, XIX legislatura)
    ('Interno', 2197, 7.2, 3091, 10.6), ('Infrastrutture e trasporti', 1311, 16.5, 2501, 23.7), ('Giustizia', 1429, 77.0, 2037, 66.1),
    ('Salute', 1143, 1.5, 2007, 9.8), ('Ambiente e sicurezza energetica', 1120, 5.7, 1916, 13.0), ('Lavoro e politiche sociali', 781, 3.3, 1431, 14.2),
    ('Economia e finanze', 623, 1.4, 1376, 8.9), ('Imprese e made in Italy', 759, 19.4, 1370, 24.9), ('Istruzione e merito', 705, 13.5, 1139, 16.2),
    ('Esteri e cooperazione internazionale', 545, 80.4, 1007, 58.1), ('Cultura', 486, 4.5, 813, 10.6), ('Agricoltura e sovranità alimentare', 310, 2.3, 730, 22.6),
    ('Difesa', 294, 26.2, 436, 26.8), ('Università e ricerca', 255, 11.0, 428, 14.5), ('Presidenza del Consiglio', 196, 16.8, 361, 24.1),
]
FOIA_ENTI = [  # ente, richieste FOIA con esito 2024-2025, respinte o accolte in parte, %, % risposte oltre 30 giorni (registri degli accessi)
    ('INPS', 161, 137, 85.1, 28.3), ('Ministero della Difesa', 219, 135, 61.6, 29.2), ('Antitrust', 11, 6, 54.5, 36.4), ('Consob', 12, 6, 50.0, 0.0),
    ("Ministero dell'Università", 66, 31, 47.0, 44.8), ("Ministero dell'Agricoltura", 36, 16, 44.4, 37.5), ('Ministero della Giustizia', 313, 135, 43.1, 17.9),
    ('Presidenza del Consiglio', 405, 149, 36.8, 12.4), ("Ministero dell'Economia", 99, 34, 34.3, 22.5), ('Ministero delle Infrastrutture', 252, 84, 33.3, 15.3),
    ('Ministero delle Imprese', 147, 46, 31.3, 16.8), ('Regione Emilia-Romagna', 130, 37, 28.5, 8.5), ('ANAC', 26, 7, 26.9, 37.5),
    ('Ministero della Cultura', 70, 13, 18.6, 23.0), ('Regione Lazio', 254, 46, 18.1, 24.9), ('Istat', 21, 3, 14.3, 5.0), ('Comune di Firenze', 82, 8, 9.8, 16.5),
]
TRAPPOLE_EURO = [  # trappola, milioni di euro di multe, decisioni (una decisione può contenere più trappole)
    ('Il prezzo che cresce alla cassa', 65.8, 22), ('Le clausole scritte a senso unico', 40.7, 20), ('I tuoi dati e il tuo account come merce', 34.2, 11),
    ('La promessa che il prodotto non mantiene', 29.5, 28), ('Dopo il pagamento, i diritti negati', 29.2, 24), ('Ragazzi e persone fragili nel mirino', 27.0, 5),
    ("L'abbonamento da cui non si esce", 23.4, 9), ('La casella già spuntata', 19.0, 3), ('Il servizio che non hai chiesto', 16.7, 10), ('Il conto alla rovescia che riparte', 15.0, 4),
]
MANOVRA_IMPIEGHI = [  # interventi 2027 in % del PIL (DPB 2027, tabella I.6-1)
    ('Famiglia e spesa sociale', 0.21), ('Difesa', 0.19), ('Sostegno alle imprese', 0.14), ('Infrastrutture', 0.13), ('Sanità', 0.10),
    ('Misure fiscali', 0.09), ('Fondo sentenze', 0.08), ('Altri interventi', 0.03), ('Enti territoriali', 0.01),
]


def tab_ministeri():
    righe = [[(m, m), (it(s), s), (it(q, 1) + '%', q), (it(a), a), (it(qa, 1) + '%', qa)] for m, s, q, a, qa in MINISTERI]
    return tabella('t-ministeri', [('Ministero', 't'), ('Interrogazioni scritte', 'n'), ('Con risposta', 'n'), ('Tutti gli atti', 'n'), ('Con risposta, tutti', 'n')], righe, 2)


def tab_foia():
    righe = [[(e, e), (it(n), n), (it(k), k), (it(q, 1) + '%', q), (it(o, 1) + '%', o)] for e, n, k, q, o in FOIA_ENTI]
    return tabella('t-foia', [('Ente', 't'), ('FOIA con esito', 'n'), ('Respinte o in parte', 'n'), ('Quota', 'n'), ('Risposta oltre 30 giorni', 'n')], righe, 3)


STORIE += [
    dict(
        slug='una-domanda-su-quattro', braccio=5, data='2 novembre 2026', foto='reclami-pa', strumento=('legge/interrogazioni', 'Leggi il dossier'),
        titolo='Il Parlamento chiede, il Governo risponde una volta su quattro',
        breve='Il Governo risponde a una domanda del Parlamento su quattro',
        sommario='In questa legislatura deputati e senatori hanno presentato 25.821 interrogazioni e interpellanze. Tolto il question time, ha avuto risposta il 22,9%. Più di 10.000 aspettano da oltre un anno.',
        corpo=lambda: f"""
<p>L'interrogazione è lo strumento con cui un parlamentare chiede al Governo conto di un fatto: una fabbrica che chiude, un ospedale senza medici, una strada ferma da anni. Il Ministero competente dovrebbe rispondere. I dati aperti della Camera, che registrano anche gli atti del Senato, dicono quante volte succede.</p>
<figure class="dato numeri"><div><b>22.128</b><span>interrogazioni e interpellanze dal 13 ottobre 2022, senza il question time</span></div><div><b>22,9%</b><span>con una risposta del Governo (5.074)</span></div><div><b>15.460</b><span>ancora in attesa, 10.453 da più di un anno</span></div></figure>
<p>Per le interrogazioni a risposta scritta il regolamento della Camera (art. 134) dà al Governo 20 giorni. Succede nello 0,7% dei casi: 83 su 12.744. Quando la risposta arriva, la metà arriva dopo 90 giorni o più.</p>
<p>Dove c'è un appuntamento fisso, le risposte arrivano: il question time in Aula ha risposta quasi sempre, le interpellanze urgenti nel 90% dei casi. È la domanda scritta, quella senza data, che resta senza risposta.</p>
<p>Il confronto è tra Ministeri e temi, non tra partiti o parlamentari. I dati aperti dicono se e quando è arrivata una risposta, non che cosa dice.</p>""",
        metodo='Atti di sindacato ispettivo della XIX legislatura (Camera e Senato) dall\'endpoint dei dati aperti della Camera; risposta = data di risposta registrata, verificata a campione sulle schede ufficiali. Esclusi dal calcolo principale il question time in Aula e in commissione.',
        fonte='Camera dei deputati, dati aperti (dati.camera.it), letti il 2 novembre 2026',
    ),
    dict(
        slug='ministero-per-ministero', braccio=5, data='2 novembre 2026', strumento=('legge/interrogazioni', 'Tutti i Ministeri'),
        titolo='Esteri risponde all\'80%, Salute all\'1,5%: le domande del Parlamento Ministero per Ministero',
        breve='Esteri 80%, Salute 1,5%: le risposte Ministero per Ministero',
        sommario='Sulle interrogazioni a risposta scritta le differenze tra Ministeri sono enormi: Esteri risponde all\'80,4%, Giustizia al 77%. Salute all\'1,5% (17 su 1.143), Economia all\'1,4% (9 su 623). L\'Interno, il più interrogato, al 7,2%.',
        corpo=lambda: f"""
<p>Ogni interrogazione è indirizzata al Ministero che deve rispondere. Messi uno accanto all'altro, i Ministeri si comportano in modi molto diversi, anche a parità di domande ricevute.</p>
{tab_ministeri()}
<p class="nota">Tocca i titoli delle colonne per ordinare. Interrogazioni scritte: quelle che chiedono una risposta per iscritto. Tutti gli atti: anche orali, in commissione, interpellanze e question time.</p>
<p>Salute ed Economia rispondono di più quando c'è un appuntamento in Aula o in commissione: contando tutti gli atti salgono al 9,8% e all'8,9%. Sulle domande scritte, invece, quasi mai. I temi su cui si interroga di più sono trasporti e grandi opere (2.857 atti), sicurezza (2.631) e ambiente ed energia (2.466).</p>""",
        metodo='Ogni atto è attribuito al Ministero delegato a rispondere più di recente; i Ministeri rinominati sono uniti sotto il nome di oggi. Temi assegnati con parole chiave controllate a mano su un campione.',
        fonte='Camera dei deputati, dati aperti (dati.camera.it), letti il 2 novembre 2026',
    ),
    dict(
        slug='198-milioni-di-multe', braccio=3, data='2 novembre 2026', foto='garanzia', strumento=('legge/antitrust', 'Le quindici trappole'),
        titolo='198 milioni di multe in tre anni: i trucchi che l\'Antitrust punisce di più',
        breve='198 milioni di multe: i trucchi che l\'Antitrust punisce di più',
        sommario='Dal 2024 l\'Antitrust ha chiuso 157 procedimenti sui consumatori, 94 con una multa. Il trucco costato di più alle imprese è il prezzo che cresce alla cassa: 65,8 milioni in 22 decisioni.',
        corpo=lambda: f"""
<p>Abbiamo letto tutti i bollettini settimanali dell'Autorità garante della concorrenza e del mercato dal 2024 a oggi: 157 decisioni finali a tutela dei consumatori, per 198 milioni di euro. Le multe del 2024 e del 2025 coincidono al centesimo con i conti ufficiali dell'Autorità.</p>
<figure class="dato"><figcaption>Milioni di euro di multe per tipo di trappola, 2024-2026 (una decisione può riguardarne più d'una)</figcaption>{barre([(t, m, it(m, 1) + ' mln') for t, m, _ in TRAPPOLE_EURO])}</figure>
<p>La multa più alta riguarda i biglietti del Colosseo: 19,9 milioni a CoopCulture e a sei operatori turistici, perché i biglietti a prezzo base sparivano e ricomparivano abbinati a visite guidate. Seguono gli autonoleggi che addebitavano una tariffa fissa su ogni multa (18,4 milioni a sei società e altri 8 a Sicily by Car), eDreams per l'abbonamento Prime, Amazon per l'acquisto periodico già selezionato.</p>
<p>Le decisioni si possono impugnare: dal 2024 l'Autorità ha dovuto ricalcolare 7 multe e ritirarne 3 dopo sentenze del Consiglio di Stato. Nel dossier ci sono tutte le multe, con il link al bollettino.</p>""",
        metodo='Provvedimenti finali PS, CV, IP e PV letti nei bollettini settimanali AGCM 2024-2026 (fino al n. 41/2026); sanzione dal dispositivo; trappole assegnate da noi leggendo ogni decisione.',
        fonte='Autorità garante della concorrenza e del mercato, bollettini settimanali e dati aperti',
    ),
    dict(
        slug='bollette-di-due-anni-fa', braccio=0, data='2 novembre 2026', strumento=('mi-rimborsano', 'Controlla la tua bolletta'),
        titolo='Bolletta con consumi di più di due anni fa? Non si paga',
        breve='Consumi di più di due anni fa in bolletta? Non si pagano',
        sommario='Per luce, gas e acqua i consumi più vecchi di due anni vanno in prescrizione. Enel Energia e Servizio Elettrico Nazionale sono stati multati per 7,5 milioni per averli chiesti lo stesso e respinto i reclami.',
        corpo=lambda: """
<p>Dal 2018 per l'elettricità, dal 2019 per il gas e dal 2020 per l'acqua, la legge (n. 205 del 2017) stabilisce che i consumi fatturati con più di due anni di ritardo non si pagano, se il ritardo non dipende da te. Basta chiedere la prescrizione al fornitore, per iscritto.</p>
<figure class="dato numeri"><div><b>2 anni</b><span>oltre i quali i consumi di luce, gas e acqua fatturati in ritardo vanno in prescrizione</span></div><div><b>7,5 milioni</b><span>di multa a Enel Energia (4) e Servizio Elettrico Nazionale (3,5), febbraio 2026</span></div></figure>
<p>Secondo l'Antitrust, le due società chiedevano il pagamento di consumi vecchi e respingevano senza motivo le richieste di prescrizione dei clienti. Non è l'unico caso: il «dopo vendita» negato, cioè diritti che esistono ma vengono rifiutati, compare in 24 decisioni dal 2024.</p>
<p>Il Polpo ti aiuta a capire se una bolletta di conguaglio è prescritta e prepara la lettera al fornitore.</p>""",
        metodo='Prescrizione biennale: legge 205/2017, art. 1, commi 4-10. Caso: provvedimento AGCM PS11564B del 19 febbraio 2026, bollettino 10/2026.',
        fonte='Legge 205/2017; Autorità garante della concorrenza e del mercato, bollettino 10/2026',
    ),
    dict(
        slug='foia-quattro-su-dieci', braccio=1, data='2 novembre 2026', foto='chiedo-gli-atti', strumento=('legge/accessi', 'Leggi il dossier'),
        titolo='Chiedi un documento allo Stato: quattro volte su dieci ti dicono no',
        breve='FOIA: quattro richieste su dieci respinte o accolte a metà',
        sommario='Nei registri di 17 enti pubblici, il 38,8% delle richieste di accesso civico generalizzato (il FOIA italiano) del 2024-2025 è stato respinto o accolto solo in parte. All\'INPS l\'85%, al Comune di Firenze il 10%.',
        corpo=lambda: f"""
<p>Dal 2016 chiunque può chiedere a un ente pubblico documenti e dati, senza spiegare perché: è l'accesso civico generalizzato. Gli enti dovrebbero tenere un registro delle richieste e del loro esito. Abbiamo letto quelli di 17 enti: 9.821 richieste in tutto.</p>
<figure class="dato numeri"><div><b>38,8%</b><span>delle richieste FOIA 2024-2025 respinte o accolte in parte (893 su 2.304)</span></div><div><b>19,7%</b><span>con risposta dopo i 30 giorni previsti dalla legge</span></div><div><b>291</b><span>dinieghi su 1.115 senza motivo scritto nel registro</span></div></figure>
{tab_foia()}
<p class="nota">Tocca i titoli delle colonne per ordinare.</p>
<p>Le differenze dipendono anche da cosa si chiede: all'INPS molte richieste riguardano pratiche personali, che il FOIA non copre. Un diniego può essere legittimo. Ma il Ministero dell'Interno non pubblica proprio il registro, e altri enti non si lasciano leggere: per loro abbiamo preparato una richiesta del registro stesso.</p>""",
        metodo='Registri degli accessi 2024-2026 pubblicati in Amministrazione trasparente da 17 enti; esiti normalizzati; quote sulle sole richieste con esito scritto. I dati personali eventualmente presenti negli oggetti sono stati scartati.',
        fonte='Registri degli accessi di 17 amministrazioni, letti il 2 novembre 2026',
    ),
    dict(
        slug='manovra-in-31-misure', braccio=4, data='2 novembre 2026', foto='bilancio-comune', strumento=('legge/manovra', 'Le 31 misure'),
        titolo='La manovra in 31 misure: dove vanno i 26 miliardi del 2027',
        breve='La manovra in 31 misure: dove vanno i 26 miliardi',
        sommario='La legge di bilancio 2027 vale circa 26 miliardi. Le voci più grandi sono famiglia e spesa sociale e difesa; la copertura più grande è a carico del settore finanziario. Il deficit programmato è al 3,4% del PIL.',
        corpo=lambda: f"""
<p>Il Consiglio dei ministri ha approvato la manovra il 28 ottobre; il testo non è ancora arrivato in Parlamento. Nel frattempo il Governo ha mandato a Bruxelles il documento programmatico di bilancio, con la tabella di dove vanno i soldi.</p>
<figure class="dato"><figcaption>Interventi della manovra nel 2027, in percentuale del PIL</figcaption>{barre([(v, x, it(x, 2) + '%') for v, x in MANOVRA_IMPIEGHI])}<p class="nota">Gli interventi valgono lo 0,98% del PIL, le coperture lo 0,43%: la manovra peggiora il deficit dello 0,54%, che sale al 3,4% contro il 2,9% senza manovra.</p></figure>
<p>Tra le misure: l'aliquota IRPEF del 33% si estende fino a 55.000 euro di reddito; il regime forfettario sale da 85.000 a 100.000 euro; la cedolare secca sugli affitti a canone concordato scende al 5% (1% per gli inquilini fino a 35 anni); il Fondo sanitario cresce di 3,4 miliardi; un buono di 300 euro per chi ha più di 75 anni e una pensione fino a 28.000 euro.</p>
<p>Il dossier del Polpo segue la manovra fino al voto: il testo, le audizioni dal 5 novembre, gli emendamenti, cosa entra davvero.</p>""",
        metodo='Misure dal comunicato del Consiglio dei ministri n. 195; tabella degli interventi e delle coperture dal Documento programmatico di bilancio 2027 (tabella I.6-1); saldi dal DPFP 2026.',
        fonte='Governo, comunicato n. 195 del 28 ottobre 2026; Documento programmatico di bilancio 2027; DPFP 2026',
    ),
]

# l'ordine della pagina: prima la storia d'apertura, poi alternando conti pubblici e servizio
ORDINE = ['una-domanda-su-quattro', '198-milioni-di-multe', 'foia-quattro-su-dieci', 'manovra-in-31-misure', 'ministero-per-ministero', 'bollette-di-due-anni-fa',
          'cinque-miliardi', 'appena-sotto-la-soglia', 'volo-in-ritardo', 'su-cento-euro', 'black-friday', 'un-comune-su-quattro',
          'visita-tra-un-anno', 'comuni-in-deficit', 'pacco-in-giacenza', 'un-affidamento-alla-volta', 'grandi-citta']
DATA = '31 ottobre 2026'


def storia(x, apertura=False):
    b = casa.BRACCIA[x['braccio']]
    dir_, cta = x['strumento']
    foto = x.get('foto', dir_)
    srcset = ', '.join(f'../{foto}/web/foto-{w}.webp {w}w' for w in (480, 800, 1024, 1344))
    figura = (f'<picture><source type="image/webp" srcset="{srcset}" sizes="(max-width: 1300px) calc(100vw - 48px), 1240px">'
              f'<img class="apertura-foto" src="../{foto}/web/foto.jpg" alt="" width="1344" height="752" loading="lazy" decoding="async"></picture>') if apertura else ''
    return f'''<article class="storia{' apertura' if apertura else ''}" id="{x['slug']}" aria-labelledby="h-{x['slug']}">
  {figura}<div class="st-testa">{casa.polpo_mini(x['braccio'], classe='st-polpo')}<div><div class="occhiello">Braccio {x['braccio'] + 1} · {b[1]}</div><div class="st-data">{x.get('data', DATA)}</div></div></div>
  <h2 id="h-{x['slug']}">{x['titolo']}</h2>
  <p class="sommario">{x['sommario']}</p>
  <div class="st-corpo">{x['corpo']().strip()}</div>
  <p class="st-cta"><a class="btn btn-primario" href="../{dir_}/">{cta}</a> <a class="st-link" href="#{x['slug']}">Link a questa storia</a></p>
  <details class="st-metodo"><summary>Fonte e metodo</summary><p><b>Fonte.</b> {x['fonte']}. Calcoli del Polpo civico.</p><p><b>Metodo.</b> {x['metodo']}</p></details>
</article>'''


CSS_PAGINA = '''
  .storie-testa { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 20px; align-items: center; margin: 28px 0 8px; }
  .storie-testa .logo-polpo { width: 110px; height: 110px; }
  .storie-testa h1 { margin: 0; font-size: var(--s4); line-height: 1; }
  .storie-testa p { margin: 8px 0 0; color: var(--inchiostro-2); max-width: 62ch; }
  .indice { list-style: none; padding: 0; margin: 26px 0 8px; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap: 0 28px; border-top: 1px solid var(--riga); }
  .indice li { border-bottom: 1px solid var(--riga); }
  .indice a { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 12px; align-items: center; padding: 12px 0; color: var(--inchiostro); text-decoration: none; font-weight: 600; line-height: 1.3; }
  .indice a:hover { color: var(--accento); }
  .indice .st-polpo { width: 34px; height: 34px; }
  .regole { margin: 18px 0 0; font-size: var(--s0); color: var(--inchiostro-3); max-width: 80ch; }
  .storia { max-width: 760px; margin: 64px auto 0; padding-top: 30px; border-top: 2px solid var(--inchiostro); scroll-margin-top: 20px; }
  .storia.apertura { max-width: none; }
  .storia.apertura > :not(.apertura-foto) { max-width: 760px; margin-inline: auto; }
  .apertura-foto { display: block; width: 100%; height: auto; aspect-ratio: 1344 / 752; object-fit: cover; border-radius: 4px; margin-bottom: 22px; }
  .st-testa { display: flex; gap: 12px; align-items: center; }
  .st-polpo { width: 46px; height: 46px; flex: none; overflow: visible; }
  .st-data { font-family: var(--cifre); font-size: 12px; color: var(--inchiostro-3); }
  .storia h2 { font-size: clamp(28px, 4.2vw, 44px); line-height: 1.05; margin: 14px 0 12px; }
  .sommario { font-size: var(--s2); line-height: 1.45; color: var(--inchiostro); margin: 0 0 18px; }
  .st-corpo p { margin: 0 0 14px; color: var(--inchiostro-2); }
  .st-corpo .nota, .dato .nota { font-size: var(--s-1); color: var(--inchiostro-3); margin: 8px 0 0; }
  .st-corpo > .nota { margin-bottom: 14px; }
  .dato { margin: 22px 0; padding: 18px; background: var(--carta); border: 1px solid var(--riga); border-radius: 4px; }
  .dato figcaption { font-family: var(--cifre); font-size: 12px; letter-spacing: .04em; color: var(--inchiostro-3); margin-bottom: 12px; }
  .dato.numeri { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
  .dato.numeri b { display: block; font-family: var(--titoli); font-size: clamp(26px, 3.6vw, 36px); line-height: 1; letter-spacing: -0.03em; color: var(--accento); }
  .dato.numeri span { display: block; margin-top: 6px; font-size: var(--s0); color: var(--inchiostro-2); }
  .barre { display: grid; gap: 6px; }
  .barre .riga { display: grid; grid-template-columns: minmax(96px, 30%) minmax(0, 1fr) auto; gap: 10px; align-items: center; font-size: var(--s0); }
  .barre .et { color: var(--inchiostro-2); }
  .barre .traccia { height: 12px; background: var(--riga-tenue); border-radius: 2px; overflow: hidden; }
  .barre .pieno { display: block; height: 100%; background: var(--inchiostro-3); }
  .barre .acceso .pieno { background: var(--accento); }
  .barre .acceso .et, .barre .acceso .val { color: var(--inchiostro); font-weight: 600; }
  .barre .val { font-family: var(--cifre); font-size: 12.5px; color: var(--inchiostro-2); min-width: 6ch; text-align: right; }
  .soglia .riga { grid-template-columns: 70px minmax(0, 1fr) auto; }
  .st-corpo .scorri { margin: 18px 0 6px; overflow-x: auto; }
  .ordinabile { width: 100%; border-collapse: collapse; font-size: var(--s0); }
  .ordinabile th { text-align: left; border-bottom: 1px solid var(--inchiostro-3); padding: 0; white-space: nowrap; }
  .ordinabile th button { all: unset; cursor: pointer; display: block; padding: 8px 10px 8px 0; font-family: var(--cifre); font-size: 11.5px; letter-spacing: .04em; color: var(--inchiostro-3); }
  .ordinabile th button:focus-visible { outline: 2px solid var(--accento); }
  .ordinabile th[aria-sort] button { color: var(--inchiostro); }
  .ordinabile th[aria-sort="descending"] button::after { content: " ↓"; color: var(--accento); }
  .ordinabile th[aria-sort="ascending"] button::after { content: " ↑"; color: var(--accento); }
  .ordinabile td { padding: 7px 10px 7px 0; border-bottom: 1px solid var(--riga-tenue); color: var(--inchiostro-2); }
  .ordinabile td.n, .ordinabile th[data-tipo="n"] button { text-align: right; font-family: var(--cifre); }
  .ordinabile td:first-child { color: var(--inchiostro); font-weight: 600; }
  .st-cta { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; margin: 22px 0 0; }
  .st-link { font-family: var(--cifre); font-size: 12px; color: var(--inchiostro-3); }
  .st-metodo { margin-top: 16px; font-size: var(--s0); color: var(--inchiostro-3); border-top: 1px solid var(--riga); padding-top: 10px; }
  .st-metodo summary { cursor: pointer; padding: 8px 0; font-family: var(--cifre); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; }
  .st-metodo p { margin: 8px 0 0; }
  .replica { max-width: 760px; margin: 64px auto 0; padding: 20px; background: var(--carta); border: 1px solid var(--riga); border-radius: 4px; font-size: var(--s0); color: var(--inchiostro-2); }
  .replica h2 { font-size: var(--s2); margin: 0 0 6px; color: var(--inchiostro); }
  @media (max-width: 560px) {
    .storie-testa { grid-template-columns: minmax(0, 1fr); }
    .storie-testa .logo-polpo { width: 80px; height: 80px; }
    .barre .riga { grid-template-columns: minmax(0, 1fr) auto; }
    .barre .traccia { grid-column: 1 / -1; grid-row: 2; }
    .soglia .riga { grid-template-columns: minmax(0, 1fr) auto; }
  }
'''

JS_ORDINA = '''<script>
/* Tabelle ordinabili: un clic sul titolo ordina, un secondo clic inverte. */
document.querySelectorAll('table.ordinabile').forEach((t) => {
  const corpo = t.tBodies[0];
  t.querySelectorAll('th button').forEach((b) => b.addEventListener('click', () => {
    const th = b.parentElement, k = +th.dataset.k, num = th.dataset.tipo === 'n';
    const verso = th.getAttribute('aria-sort') === 'descending' ? 1 : th.getAttribute('aria-sort') === 'ascending' ? -1 : (num ? -1 : 1);
    t.querySelectorAll('th').forEach((x) => x.removeAttribute('aria-sort'));
    th.setAttribute('aria-sort', verso < 0 ? 'descending' : 'ascending');
    const righe = [...corpo.rows].sort((a, c) => {
      const x = a.cells[k].dataset.v, y = c.cells[k].dataset.v;
      return (num ? x - y : x.localeCompare(y, 'it')) * verso;
    });
    righe.forEach((r) => corpo.appendChild(r));
  }));
});
</script>'''


def pagina():
    per = {x['slug']: x for x in STORIE}
    ordinate = [per[s] for s in ORDINE]
    indice = ''.join(f'<li><a href="#{x["slug"]}">{casa.polpo_mini(x["braccio"], classe="st-polpo")}<span>{x["breve"]}</span></a></li>' for x in ordinate)
    storie = '\n'.join(storia(x, i == 0) for i, x in enumerate(ordinate))
    return f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Le storie del Polpo · Il Polpo civico</title>
<meta name="description" content="Le storie che il Polpo civico trova nei dati pubblici: appalti senza gara, bilanci dei Comuni, diritti dei consumatori. Con i numeri, la fonte e il metodo.">
<!--icone--><link rel="icon" href="../comune/icona-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="../comune/marchio.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../comune/icona-180.png"><!--/icone-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Atkinson+Hyperlegible+Next:wght@400;600;800&family=Atkinson+Hyperlegible+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="../comune/stile.css">
<style>{CSS_PAGINA}</style>
</head>
<body>
<div class="max">
  <div class="banda-sostieni"><span><a href="../">← Il Polpo civico</a></span><span>Promosso dall'<a href="https://www.gianrobertocasaleggio.com/" target="_blank" rel="noopener">Associazione Gianroberto Casaleggio</a></span></div>
  <header class="storie-testa">
    {casa.polpo_mini(None, classe='logo-polpo')}
    <div>
      <div class="occhiello">Il Polpo civico · storie dai dati</div>
      <h1>Le storie del Polpo</h1>
      <p>Quello che il Polpo trova nei dati pubblici mentre fa il suo lavoro: appalti, bilanci dei Comuni, diritti di chi compra e viaggia. Ogni numero ha la fonte e il metodo, e lo strumento per guardare il tuo caso.</p>
    </div>
  </header>
  <ol class="indice">{indice}</ol>
  <p class="regole"><b>Come scriviamo.</b> Un indicatore non è un illecito: diciamo «senza gara», mai «irregolare». Non facciamo nomi di persone. I numeri sono quelli letti alla data di ogni storia; i dati degli strumenti si aggiornano, le storie no.</p>
{storie}
  <aside class="replica" aria-labelledby="t-replica">
    <h2 id="t-replica">Sei un ente citato in queste storie?</h2>
    <p>Se un numero non torna o c'è una spiegazione che i dati non mostrano, scrivici: pubblichiamo la risposta accanto alla storia e correggiamo gli errori. <a href="{CONTATTO}" target="_blank" rel="noopener">Scrivi alla redazione</a></p>
  </aside>
</div>
{JS_ORDINA}
</body>
</html>
'''


# ---------------------------------------------------------------- la striscia dei titoli nella pagina d'ingresso

CSS_STRISCIA = '''/*notizie*/
  .notizie { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; border-bottom: 1px solid var(--riga); padding-block: 7px; font-size: var(--s0); }
  .notizie-et { font-family: var(--cifre); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--accento); text-decoration: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; }
  .notizie-et::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--accento); }
  .notizie-vetro { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent); }
  .notizie-nastro { display: flex; width: max-content; animation: nastro var(--durata, 90s) linear infinite; }
  .notizie-nastro ul { display: flex; margin: 0; padding: 0; list-style: none; }
  .notizie-nastro li { white-space: nowrap; padding-right: 34px; position: relative; }
  .notizie-nastro li::after { content: "●"; position: absolute; right: 13px; top: 50%; transform: translateY(-50%); font-size: 6px; color: var(--inchiostro-3); }
  .notizie-nastro a { color: var(--inchiostro-2); text-decoration: none; }
  .notizie-nastro a:hover, .notizie-nastro a:focus-visible { color: var(--inchiostro); text-decoration: underline; text-decoration-color: var(--accento); }
  .notizie:hover .notizie-nastro, .notizie:focus-within .notizie-nastro, .notizie.ferma .notizie-nastro { animation-play-state: paused; }
  .notizie-ferma { all: unset; cursor: pointer; font-family: var(--cifre); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--inchiostro-3); padding: 10px 6px; margin-block: -6px; }
  .notizie-ferma:focus-visible { outline: 2px solid var(--accento); }
  @keyframes nastro { to { transform: translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) {
    .notizie-nastro { animation: none; }
    .notizie-vetro { overflow-x: auto; mask-image: none; -webkit-mask-image: none; }
    .notizie-nastro ul[aria-hidden] { display: none; }
    .notizie-ferma { display: none; }
  }
  @media (max-width: 560px) { .notizie { grid-template-columns: minmax(0, 1fr) auto; } .notizie-et { grid-column: 1 / -1; } }
/*/notizie*/'''


def striscia():
    per = {x['slug']: x for x in STORIE}
    voci = ''.join(f'<li><a href="storie/#{s}">{per[s]["breve"]}</a></li>' for s in ORDINE)
    copia = re.sub(r'<a ', '<a tabindex="-1" ', voci)
    return f'''<!--notizie--><section class="notizie" aria-label="Le storie del Polpo">
    <a class="notizie-et" href="storie/">Le storie del Polpo</a>
    <div class="notizie-vetro"><div class="notizie-nastro" style="--durata:{len(ORDINE) * 9}s"><ul>{voci}</ul><ul aria-hidden="true">{copia}</ul></div></div>
    <button type="button" class="notizie-ferma" aria-pressed="false">Ferma</button>
    <script>(() => {{ const n = document.currentScript.parentElement, b = n.querySelector('.notizie-ferma');
      b.addEventListener('click', () => {{ const f = n.classList.toggle('ferma'); b.setAttribute('aria-pressed', f); b.textContent = f ? 'Scorri' : 'Ferma'; }}); }})();</script>
  </section><!--/notizie-->'''


def casa_con_striscia():
    p = os.path.join(REPO, 'index.html')
    s = open(p, encoding='utf-8').read()
    blocco = striscia()
    if '<!--notizie-->' in s:
        s = re.sub(r'<!--notizie-->.*?<!--/notizie-->', lambda m: blocco, s, count=1, flags=re.S)
    else:
        s = s.replace('<!--/banda-->\n', '<!--/banda-->\n  ' + blocco + '\n', 1)
    if '/*notizie*/' in s:
        s = re.sub(r'/\*notizie\*/.*?/\*/notizie\*/', lambda m: CSS_STRISCIA, s, count=1, flags=re.S)
    else:
        s = s.replace('/*/casa*/\n', '/*/casa*/\n' + CSS_STRISCIA + '\n', 1)
    open(p, 'w', encoding='utf-8').write(s)


def main():
    open(os.path.join(REPO, 'storie', 'index.html'), 'w', encoding='utf-8').write(pagina())
    casa_con_striscia()
    print(f'{len(STORIE)} storie scritte, striscia nella pagina d\'ingresso')


if __name__ == '__main__':
    main()
