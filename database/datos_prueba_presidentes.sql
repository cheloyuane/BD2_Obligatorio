


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
(1, 1, 1, 1, 1),          -- ID 1, Escuela Nro. 1 - Mesa 1
(2, 2, 1, 0, 101),        -- ID 2, Liceo Nro. 2 - Mesa 101
(3, 3, 1, 1, 102),        -- ID 3, Escuela Nro. 3 - Mesa 102
(4, 4, 1, 0, 103),        -- ID 4, Liceo Bella Unión - Mesa 103
(5, 5, 1, 1, 104),        -- ID 5, Escuela Central - Mesa 104
(6, 6, 1, 0, 105),        -- ID 6, UTU Artigas - Mesa 105
(7, 7, 1, 1, 114),        -- ID 7, Escuela Tomás G. - Mesa 114
(8, 8, 1, 0, 115),        -- ID 8, Liceo Gomensoro - Mesa 115
(9, 9, 1, 1, 116),        -- ID 9, Escuela Melo Norte - Mesa 116
(10, 10, 1, 0, 117),      -- ID 10, Liceo Melo - Mesa 117
(11, 11, 1, 1, 118),      -- ID 11, Escuela Río Branco - Mesa 118
(12, 12, 1, 0, 119),      -- ID 12, Liceo de la Frontera - Mesa 119
(13, 13, 1, 1, 123),      -- ID 13, Escuela Nro. 8 - Mesa 123
(14, 14, 1, 0, 124),      -- ID 14, UTU Fraile Muerto - Mesa 124
(15, 15, 1, 1, 125);      -- ID 15, Escuela Nro. 9 - Mesa 125

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

