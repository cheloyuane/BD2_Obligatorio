-- Datos de prueba para presidentes de mesa (Personajes famosos)

-- Insertar ciudadanos que serán presidentes (usando CC diferentes)
INSERT INTO Ciudadano (CC, nombre, CI, Fecha_nacimiento) VALUES
('CC001', 'Leticia Mármol', '1234567-8', '1985-01-15'),
('CC002', 'Pedro Gómez', '8765432-1', '1970-05-20'),
('CC003', 'Sofía Loren', '1122334-4', '1992-11-30'),
('CC004', 'Carlos Perez', '9988776-6', '1965-03-10'),
('CC005', 'Mariano Sosa', '5544332-2', '1980-07-25'),
('CC101', 'Albert Einstein', '1111111-1', '1879-03-14'),
('CC102', 'Marie Curie', '2222222-2', '1867-11-07'),
('CC103', 'Leonardo da Vinci', '3333333-3', '1452-04-15'),
('CC104', 'Ada Lovelace', '4444444-4', '1815-12-10'),
('CC105', 'Nikola Tesla', '5555555-5', '1856-07-10'),
('CC666', 'Los TussiWarrior', '6664206-9', '2000-02-29'),
('CC875', 'El Maestruli', '1542874-7', '1970-01-13'),
('CC900', 'Payaso Pildorita', '2245528-5', '1975-07-15'),
('CC901', 'Hasbulla', '1221548-7', '1991-07-18'),
('CC902', 'El Colorado De Don Omar', '4584842-1', '1975-11-24');


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

--insertar algunos candidatos para las votaciones--
INSERT INTO Candidato (FK_Ciudadano_CC, id_candidato, FK_Lista_ID, FK_Partido_politico_ID) VALUES
('CC666', 1, 4, 102),
('CC875', 2, 3, 102),
('CC900', 3, 5, 103),
('CC901', 4, 1, 101),
('CC902', 5, 2, 101);


--Insertar listas para las votaciones--
INSERT INTO Lista (ID, FK_Partido_politico_ID, numero, integrantes, organo, orden, imagen_url)VALUES
(1, 101, 2, 'Integrante 1, Integrante 2', 'Nacional', 1, '/images/listas/Lista 02.png'),
(2, 101, 4, 'Integrante 3, Integrante 4', 'Nacional', 2, '/images/listas/Lista 04.png'),
(3, 102, 1, 'Integrante 5, Integrante 6', 'Nacional', 1, '/images/listas/Lista 1.jpg'),
(4, 102, 42, 'Integrante 3, Integrante 7', 'Nacional', 3, '/images/listas/Lista 42.png'),
(5, 103, 20, 'Integrante 2, Integrante 3', 'Nacional', 1, '/images/listas/Lista 20.png');




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

