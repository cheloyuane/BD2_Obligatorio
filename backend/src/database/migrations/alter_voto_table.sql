ALTER TABLE Voto
ADD COLUMN tipo_voto ENUM('comun', 'anulado', 'observado', 'blanco') NOT NULL DEFAULT 'comun'; 