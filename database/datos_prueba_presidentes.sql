-- Datos de prueba para presidentes de mesa (Personajes famosos)

-- Insertar ciudadanos que serán presidentes (usando CC diferentes)
INSERT INTO Ciudadano (CC, nombre, CI, Fecha_nacimiento) VALUES
('CC101', 'Albert Einstein', '1111111-1', '1879-03-14'),
('CC102', 'Marie Curie', '2222222-2', '1867-11-07'),
('CC103', 'Leonardo da Vinci', '3333333-3', '1452-04-15'),
('CC104', 'Ada Lovelace', '4444444-4', '1815-12-10'),
('CC105', 'Nikola Tesla', '5555555-5', '1856-07-10');

-- Insertar miembros de mesa
INSERT INTO Miembro_de_Mesa (FK_Ciudadano_CC, organismo) VALUES
('CC101', 'Corte Electoral'),
('CC102', 'Corte Electoral'),
('CC103', 'Corte Electoral'),
('CC104', 'Corte Electoral'),
('CC105', 'Corte Electoral');

-- Insertar presidentes (usando ID_presidente diferentes)
INSERT INTO Presidente (FK_Ciudadano_CC, ID_presidente) VALUES
('CC101', 101),
('CC102', 102),
('CC103', 103),
('CC104', 104),
('CC105', 105);

-- Insertar mesas adicionales (usando ID diferentes)
INSERT INTO Mesa (ID, FK_Presidente_CC) VALUES
(101, 'CC101'),
(102, 'CC102'),
(103, 'CC103'),
(104, 'CC104'),
(105, 'CC105');

-- Insertar circuitos adicionales (usando ID diferentes)
INSERT INTO Circuito (ID, FK_establecimiento_ID, FK_Eleccion_ID, es_accesible, FK_Mesa_ID) VALUES
(101, 1, 1, TRUE, 101),
(102, 1, 1, TRUE, 102),
(103, 2, 1, TRUE, 103),
(104, 2, 1, TRUE, 104),
(105, 1, 1, TRUE, 105);

-- Insertar registros en abre_circuito para los presidentes
INSERT INTO abre_circuito (Fecha, FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, FK_Presidente_CC) VALUES
(NOW(), 101, 1, 1, 'CC101'),
(NOW(), 102, 1, 1, 'CC102'),
(NOW(), 103, 2, 1, 'CC103'),
(NOW(), 104, 2, 1, 'CC104'),
(NOW(), 105, 1, 1, 'CC105');

-- Insertar algunos votos de prueba para los nuevos circuitos
INSERT INTO Voto (FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, tipo_voto, es_observado) VALUES
(101, 1, 1, 'comun', FALSE),
(101, 1, 1, 'blanco', FALSE),
(102, 1, 1, 'comun', FALSE),
(102, 1, 1, 'anulado', FALSE),
(103, 2, 1, 'comun', FALSE),
(103, 2, 1, 'comun', FALSE),
(104, 2, 1, 'blanco', FALSE),
(105, 1, 1, 'comun', FALSE);

-- Obtener los IDs de los votos comunes para insertar en Comun
SET @voto_comun_101_id = (SELECT ID FROM Voto WHERE FK_Circuito_ID = 101 AND tipo_voto = 'comun' LIMIT 1);
SET @voto_comun_102_id = (SELECT ID FROM Voto WHERE FK_Circuito_ID = 102 AND tipo_voto = 'comun' LIMIT 1);
SET @voto_comun_103_id = (SELECT ID FROM Voto WHERE FK_Circuito_ID = 103 AND tipo_voto = 'comun' LIMIT 1);
SET @voto_comun_105_id = (SELECT ID FROM Voto WHERE FK_Circuito_ID = 105 AND tipo_voto = 'comun' LIMIT 1);

-- Insertar en Comun para los votos comunes
INSERT INTO Comun (FK_Voto_ID, FK_Lista_ID, FK_Partido_politico_ID) VALUES
(@voto_comun_101_id, 1, 101),
(@voto_comun_102_id, 2, 101),
(@voto_comun_103_id, 3, 102),
(@voto_comun_105_id, 1, 101); 