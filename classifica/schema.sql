-- La classifica condivisa dei giochi del Polpo civico. Niente indirizzi IP, niente email:
-- solo un codice casuale del giocatore (creato nel suo browser), un nome inventato, la regione se scelta, i punti.
CREATE TABLE IF NOT EXISTS giornate (
  gioco TEXT NOT NULL, giorno TEXT NOT NULL, giocatore TEXT NOT NULL,
  nome TEXT NOT NULL, regione TEXT NOT NULL DEFAULT '', punti INTEGER NOT NULL, quando TEXT NOT NULL,
  PRIMARY KEY (gioco, giorno, giocatore)
);
CREATE TABLE IF NOT EXISTS migliori (
  gioco TEXT NOT NULL, giocatore TEXT NOT NULL,
  nome TEXT NOT NULL, regione TEXT NOT NULL DEFAULT '', punti INTEGER NOT NULL, quando TEXT NOT NULL,
  PRIMARY KEY (gioco, giocatore)
);
CREATE INDEX IF NOT EXISTS giornate_classifica ON giornate (gioco, giorno, punti DESC);
CREATE INDEX IF NOT EXISTS migliori_classifica ON migliori (gioco, punti DESC);
CREATE INDEX IF NOT EXISTS giornate_giocatore ON giornate (giocatore);
CREATE INDEX IF NOT EXISTS migliori_giocatore ON migliori (giocatore);
