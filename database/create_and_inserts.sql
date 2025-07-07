-- CREACION DE LAS TABLAS

-- 1. Tabla Departamento
CREATE TABLE `Departamento` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Tabla Zona
CREATE TABLE `Zona` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `FK_Departamento_ID` INT NOT NULL,
    FOREIGN KEY (`FK_Departamento_ID`) REFERENCES `Departamento`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- 3. Tabla Establecimiento
CREATE TABLE `Establecimiento` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `tipo` VARCHAR(100),
    `direccion` VARCHAR(255),
    `FK_Zona_ID` INT NOT NULL,
    FOREIGN KEY (`FK_Zona_ID`) REFERENCES `Zona`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- 4. Tabla Partido_politico
CREATE TABLE `Partido_politico` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL UNIQUE,
    `direccion_sede` VARCHAR(255),
    `presidente` VARCHAR(255),
    `vicepresidente` VARCHAR(255)
);

-- 5. Tabla Lista
CREATE TABLE `Lista` (
    `ID` INT NOT NULL,
    `FK_Partido_politico_ID` INT NOT NULL,
    `numero` INT NOT NULL,
    `integrantes` TEXT,
    `organo` VARCHAR(100),
    `orden` INT,
    `imagen_url` VARCHAR(255),
    PRIMARY KEY (`ID`, `FK_Partido_politico_ID`),
    FOREIGN KEY (`FK_Partido_politico_ID`) REFERENCES `Partido_politico`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- 6. Tabla Ciudadano
CREATE TABLE `Ciudadano` (
    `CC` VARCHAR(20) PRIMARY KEY, -- Credencial Cívica (PK)
    `nombre` VARCHAR(255) NOT NULL,
    `CI` VARCHAR(20) UNIQUE, -- Cédula de Identidad (atributo, no PK)
    `Fecha_nacimiento` DATE
);

-- 7. Tabla Miembro_de_Mesa (Superclase para Secretario, Vocal, Presidente de Mesa)
CREATE TABLE `Miembro_de_Mesa` (
    `FK_Ciudadano_CC` VARCHAR(20) PRIMARY KEY,
    `organismo` VARCHAR(100),
    FOREIGN KEY (`FK_Ciudadano_CC`) REFERENCES `Ciudadano`(`CC`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 8. Tabla Presidente (Subclase de Miembro_de_Mesa)
CREATE TABLE `Presidente` (
    `FK_Ciudadano_CC` VARCHAR(20) PRIMARY KEY,
    `ID_presidente` INT UNIQUE NOT NULL AUTO_INCREMENT, -- ID_presidente como auto_increment para su tabla
    FOREIGN KEY (`FK_Ciudadano_CC`) REFERENCES `Miembro_de_Mesa`(`FK_Ciudadano_CC`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 9. Tabla Policía
CREATE TABLE `Policia` (
    `FK_Ciudadano_CC` VARCHAR(20) PRIMARY KEY,
    `comisaria` VARCHAR(255),
    `FK_Establecimiento_ID` INT,
    FOREIGN KEY (`FK_Ciudadano_CC`) REFERENCES `Ciudadano`(`CC`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Establecimiento_ID`) REFERENCES `Establecimiento`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- 10. Tabla Mesa
CREATE TABLE `Mesa` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `FK_Secretario_CC` VARCHAR(20) UNIQUE,
    `FK_Vocal_CC` VARCHAR(20) UNIQUE,
    `FK_Presidente_CC` VARCHAR(20) UNIQUE,
    FOREIGN KEY (`FK_Secretario_CC`) REFERENCES `Miembro_de_Mesa`(`FK_Ciudadano_CC`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Vocal_CC`) REFERENCES `Miembro_de_Mesa`(`FK_Ciudadano_CC`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Presidente_CC`) REFERENCES `Presidente`(`FK_Ciudadano_CC`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 11. Tabla Elección
CREATE TABLE `Eleccion` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `Fecha_inicio` DATETIME NOT NULL,
    `Fecha_fin` DATETIME NOT NULL
);

-- 12. Tabla Circuito (Clave primaria compuesta: ID, FK_establecimiento_ID, FK_Eleccion_ID)
CREATE TABLE `Circuito` (
    `ID` INT NOT NULL,
    `FK_establecimiento_ID` INT NOT NULL,
    `FK_Eleccion_ID` INT NOT NULL,
    `es_accesible` BOOLEAN,
    `FK_Mesa_ID` INT,
    PRIMARY KEY (`ID`, `FK_establecimiento_ID`, `FK_Eleccion_ID`),
    FOREIGN KEY (`FK_establecimiento_ID`) REFERENCES `Establecimiento`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Eleccion_ID`) REFERENCES `Eleccion`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Mesa_ID`) REFERENCES `Mesa`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE
);


-- 13. Tabla Voto
CREATE TABLE `Voto` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `FK_Circuito_ID` INT NOT NULL,
    `FK_Establecimiento_ID` INT NOT NULL,
    `FK_Eleccion_ID` INT NOT NULL,
    `tipo_voto` ENUM('comun', 'blanco', 'anulado') NOT NULL,
    `es_observado` BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`) REFERENCES `Circuito`(`ID`, `FK_establecimiento_ID`, `FK_Eleccion_ID`) ON DELETE NO ACTION ON UPDATE CASCADE
);


-- 14. Tabla Sufraga
CREATE TABLE `Sufraga` (
    `FK_Circuito_ID` INT NOT NULL,
    `FK_Establecimiento_ID` INT NOT NULL,
    `FK_Eleccion_ID` INT NOT NULL,
    `FK_Ciudadano_CC` VARCHAR(20) NOT NULL,
    `fecha_hora` DATETIME NOT NULL,
    PRIMARY KEY (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`, `FK_Ciudadano_CC`),
    FOREIGN KEY (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`) REFERENCES `Circuito`(`ID`, `FK_establecimiento_ID`, `FK_Eleccion_ID`) ON DELETE NO ACTION ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Ciudadano_CC`) REFERENCES `Ciudadano`(`CC`) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- 15. Tabla Candidato
CREATE TABLE `Candidato` (
    `FK_Ciudadano_CC` VARCHAR(20) PRIMARY KEY,
    `id_candidato` INT NOT NULL,
    `FK_Lista_ID` INT,
    `FK_Partido_politico_ID` INT,
    FOREIGN KEY (`FK_Ciudadano_CC`) REFERENCES `Ciudadano`(`CC`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Lista_ID`, `FK_Partido_politico_ID`) REFERENCES `Lista`(`ID`, `FK_Partido_politico_ID`) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- 16. Tabla Comun
CREATE TABLE `Comun` (
    `FK_Voto_ID` INT PRIMARY KEY,
    `FK_Lista_ID` INT NOT NULL,
    `FK_Partido_politico_ID` INT NOT NULL,
    FOREIGN KEY (`FK_Voto_ID`) REFERENCES `Voto`(`ID`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Lista_ID`, `FK_Partido_politico_ID`) REFERENCES `Lista`(`ID`, `FK_Partido_politico_ID`) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- 17. Tabla Participa_en
CREATE TABLE `Participa_en` (
    `FK_Candidato_CC` VARCHAR(20) NOT NULL,
    `FK_Eleccion_ID` INT NOT NULL,
    PRIMARY KEY (`FK_Candidato_CC`, `FK_Eleccion_ID`),
    FOREIGN KEY (`FK_Candidato_CC`) REFERENCES `Candidato`(`FK_Ciudadano_CC`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Eleccion_ID`) REFERENCES `Eleccion`(`ID`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 18. Tabla abre_circuito
CREATE TABLE `abre_circuito` (
    `Fecha` DATETIME NOT NULL,
    `FK_Circuito_ID` INT NOT NULL,
    `FK_Establecimiento_ID` INT NOT NULL, -- Parte de la PK compuesta de Circuito
    `FK_Eleccion_ID` INT NOT NULL,     -- Parte de la PK compuesta de Circuito
    `FK_Presidente_CC` VARCHAR(20) NOT NULL,
    PRIMARY KEY (`Fecha`, `FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`),
    FOREIGN KEY (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`) REFERENCES `Circuito`(`ID`, `FK_establecimiento_ID`, `FK_Eleccion_ID`) ON DELETE NO ACTION ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Presidente_CC`) REFERENCES `Presidente`(`FK_Ciudadano_CC`) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- 19. Tabla es_asignado
CREATE TABLE `es_asignado` (
    `FK_Ciudadano_CC` VARCHAR(20) NOT NULL,
    `FK_Circuito_ID` INT NOT NULL,
    `FK_Establecimiento_ID` INT NOT NULL, -- Parte de la PK compuesta de Circuito
    `FK_Eleccion_ID` INT NOT NULL,     -- Parte de la PK compuesta de Circuito
    `fecha_hora` DATETIME NOT NULL,
    PRIMARY KEY (`FK_Ciudadano_CC`, `FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`),
    FOREIGN KEY (`FK_Ciudadano_CC`) REFERENCES `Ciudadano`(`CC`) ON DELETE NO ACTION ON UPDATE CASCADE,
    FOREIGN KEY (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`) REFERENCES `Circuito`(`ID`, `FK_establecimiento_ID`, `FK_Eleccion_ID`) ON DELETE NO ACTION ON UPDATE CASCADE
);

------------------------------------------------------------------
-- INSERTS

-- 1. Departamento
INSERT INTO departamentos (id, nombre) VALUES
(3, 'Artigas'),
(4, 'Cerro Largo'),
(5, 'Colonia'),
(6, 'Durazno'),
(7, 'Flores'),
(8, 'Florida'),
(9, 'Lavalleja'),
(10, 'Maldonado'),
(11, 'Paysandú'),
(12, 'Río Negro'),
(13, 'Rivera'),
(14, 'Rocha'),
(15, 'Salto'),
(16, 'San José'),
(17, 'Soriano'),
(18, 'Tacuarembó'),
(19, 'Treinta y Tres');

-- 2. Zona
INSERT INTO `Zona` (`ID`, `nombre`, `FK_Departamento_ID`) VALUES
(1, 'Centro', 1),
(2, 'Ciudad de la Costa', 2), 
-- Artigas (3)
(3, 'Bella Unión', 3),
(4, 'Artigas Centro', 3),
(5, 'Tomás Gomensoro', 3),

-- Cerro Largo (4)
(6, 'Melo Centro', 4),
(7, 'Rio Branco', 4),
(8, 'Fraile Muerto', 4),

-- Colonia (5)
(9, 'Colonia del Sacramento', 5),
(10, 'Juan Lacaze', 5),
(11, 'Nueva Helvecia', 5),

-- Durazno (6)
(12, 'Durazno Centro', 6),
(13, 'Sarandí del Yí', 6),
(14, 'Cerro Chato', 6),

-- Flores (7)
(15, 'Trinidad Norte', 7),
(16, 'Trinidad Sur', 7),

-- Florida (8)
(17, 'Florida Centro', 8),
(18, 'Sarandí Grande', 8),
(19, 'Casupá', 8),

-- Lavalleja (9)
(20, 'Minas Centro', 9),
(21, 'José Pedro Varela', 9),
(22, 'Solís de Mataojo', 9),

-- Maldonado (10)
(23, 'Maldonado Centro', 10),
(24, 'Punta del Este', 10),
(25, 'San Carlos', 10),

-- Paysandú (11)
(26, 'Paysandú Centro', 11),
(27, 'Guichón', 11),
(28, 'Porvenir', 11),

-- Río Negro (12)
(29, 'Fray Bentos', 12),
(30, 'Young', 12),
(31, 'Nuevo Berlín', 12),

-- Rivera (13)
(32, 'Rivera Centro', 13),
(33, 'Tranqueras', 13),
(34, 'Vichadero', 13),

-- Rocha (14)
(35, 'Rocha Centro', 14),
(36, 'Chuy', 14),
(37, 'La Paloma', 14),

-- Salto (15)
(38, 'Salto Centro', 15),
(39, 'Constitución', 15),
(40, 'Bella Vista', 15),

-- San José (16)
(41, 'San José de Mayo', 16),
(42, 'Libertad', 16),
(43, 'Ciudad del Plata', 16),

-- Soriano (17)
(44, 'Mercedes Centro', 17),
(45, 'Dolores', 17),
(46, 'Cardona', 17),

-- Tacuarembó (18)
(47, 'Tacuarembó Centro', 18),
(48, 'Paso de los Toros', 18),
(49, 'San Gregorio de Polanco', 18),

-- Treinta y Tres (19)
(50, 'Treinta y Tres Centro', 19),
(51, 'Vergara', 19),
(52, 'Santa Clara de Olimar', 19);

-- 3. Establecimiento
INSERT INTO `Establecimiento` (`ID`, `nombre`, `tipo`, `direccion`, `FK_Zona_ID`) VALUES
(1, 'Escuela Nro. 1', 'Escuela', 'Calle Ficticia 123', 1),
(2, 'Liceo Nro. 2', 'Liceo', 'Avenida Imaginaria 456', 2),
(3, 'Escuela Nro. 3', 'Escuela', 'Calle Artigas 101', 3),
(4, 'Liceo Bella Unión', 'Liceo', 'Av. Uruguay 202', 3),
(5, 'Escuela Central', 'Escuela', 'Calle Rivera 123', 4),
(6, 'UTU Artigas', 'UTU', 'Av. 25 de Agosto 456', 4),
(7, 'Escuela Tomás G.', 'Escuela', 'Calle Flores 111', 5),
(8, 'Liceo Gomensoro', 'Liceo', 'Camino Escolar 22', 5),
(9, 'Escuela Melo Norte', 'Escuela', 'Calle Sarandí 300', 6),
(10, 'Liceo Melo', 'Liceo', 'Av. Aparicio Saravia 150', 6),
(11, 'Escuela Río Branco', 'Escuela', 'Calle Frontera 55', 7),
(12, 'Liceo de la Frontera', 'Liceo', 'Av. Brasil 100', 7),
(13, 'Escuela Nro. 8', 'Escuela', 'Calle Libertad 123', 8),
(14, 'UTU Fraile Muerto', 'UTU', 'Camino Rural 234', 8),
(15, 'Escuela Nro. 9', 'Escuela', 'Av. General Flores 100', 9),
(16, 'Liceo Departamental', 'Liceo', 'Calle del Colegio 45', 9),
(17, 'Escuela Juan Lacaze', 'Escuela', 'Calle Principal 33', 10),
(18, 'UTU Juan Lacaze', 'UTU', 'Ruta 1 km 150', 10),
(19, 'Colegio Suizo', 'Colegio', 'Av. Colonia Suiza 66', 11),
(20, 'Escuela Nro. 11', 'Escuela', 'Calle de los Álamos 78', 11),
(21, 'Escuela Durazno Centro', 'Escuela', 'Av. Churchill 111', 12),
(22, 'Liceo Nro. 1 Durazno', 'Liceo', 'Calle Lavalleja 212', 12),
(23, 'Escuela Sarandí del Yí', 'Escuela', 'Calle Artigas 97', 13),
(24, 'Liceo Sarandí del Yí', 'Liceo', 'Ruta 6 km 200', 13),
(25, 'Escuela Cerro Chato', 'Escuela', 'Calle Central 100', 14),
(26, 'UTU Cerro Chato', 'UTU', 'Calle Educativa 12', 14),
(27, 'Escuela Nro. 15', 'Escuela', 'Calle Flores 77', 15),
(28, 'Liceo Trinidad Norte', 'Liceo', 'Av. Independencia 300', 15),
(29, 'Escuela Sur', 'Escuela', 'Calle Paso de los Toros 89', 16),
(30, 'UTU Trinidad Sur', 'UTU', 'Camino a la Laguna 10', 16),
(31, 'Escuela Florida Centro', 'Escuela', 'Av. Artigas 400', 17),
(32, 'Liceo Florida', 'Liceo', 'Calle Rivera 209', 17),
(33, 'Escuela Sarandí Grande', 'Escuela', 'Ruta 5 km 123', 18),
(34, 'UTU Sarandí Grande', 'UTU', 'Calle Principal 19', 18),
(35, 'Escuela Casupá', 'Escuela', 'Camino de las Tropas 44', 19),
(36, 'Liceo Casupá', 'Liceo', 'Calle 18 de Julio 56', 19),
(37, 'Escuela Minas Centro', 'Escuela', 'Calle 25 de Mayo 101', 20),
(38, 'Liceo Nro. 2 Minas', 'Liceo', 'Av. Varela 199', 20),
(39, 'Escuela José Pedro Varela', 'Escuela', 'Calle Lavalleja 88', 21),
(40, 'UTU J. P. Varela', 'UTU', 'Camino de la Educación 31', 21),
(41, 'Escuela Solís de Mataojo', 'Escuela', 'Calle de la Plaza 101', 22),
(42, 'Liceo Solís', 'Liceo', 'Ruta 8 km 104', 22),
(43, 'Escuela Nro. 23', 'Escuela', 'Av. Joaquín de Viana 220', 23),
(44, 'Liceo Maldonado Centro', 'Liceo', 'Calle Sarandí 102', 23),
(45, 'Escuela Punta del Este', 'Escuela', 'Av. Gorlero 300', 24),
(46, 'Liceo Punta del Este', 'Liceo', 'Calle Francia 50', 24),
(47, 'Escuela San Carlos', 'Escuela', 'Calle Leonardo Olivera 90', 25),
(48, 'UTU San Carlos', 'UTU', 'Ruta 39 km 4', 25),
(49, 'Escuela Paysandú Centro', 'Escuela', 'Av. 18 de Julio 110', 26),
(50, 'Liceo Nro. 1 Paysandú', 'Liceo', 'Calle Florida 88', 26),
(51, 'Escuela Guichón', 'Escuela', 'Calle Independencia 67', 27),
(52, 'Liceo Guichón', 'Liceo', 'Camino Vecinal 101', 27),
(53, 'Escuela Porvenir', 'Escuela', 'Calle del Porvenir 12', 28),
(54, 'UTU Porvenir', 'UTU', 'Camino Rural 33', 28),
(55, 'Escuela Fray Bentos', 'Escuela', 'Calle Zorrilla de San Martín 42', 29),
(56, 'Liceo Fray Bentos', 'Liceo', 'Av. 33 Orientales 134', 29),
(57, 'Escuela Young Norte', 'Escuela', 'Calle Independencia 200', 30),
(58, 'Liceo Young', 'Liceo', 'Ruta 3 km 306', 30),
(59, 'Escuela Nuevo Berlín', 'Escuela', 'Calle Uruguay 77', 31),
(60, 'UTU Nuevo Berlín', 'UTU', 'Calle Agraciada 101', 31),
(61, 'Escuela Rivera Centro', 'Escuela', 'Av. Sarandí 1000', 32),
(62, 'Liceo Nro. 1 Rivera', 'Liceo', 'Calle Agraciada 305', 32),
(63, 'Escuela Tranqueras', 'Escuela', 'Ruta 30 km 101', 33),
(64, 'Liceo Tranqueras', 'Liceo', 'Calle Rivera 78', 33),
(65, 'Escuela Vichadero', 'Escuela', 'Calle Artigas 88', 34),
(66, 'UTU Vichadero', 'UTU', 'Camino Rural 45', 34),
(67, 'Escuela Rocha Centro', 'Escuela', 'Av. 25 de Mayo 102', 35),
(68, 'Liceo Rocha', 'Liceo', 'Calle Treinta y Tres 55', 35),
(69, 'Escuela Chuy', 'Escuela', 'Av. Brasil 45', 36),
(70, 'Liceo Chuy', 'Liceo', 'Calle Internacional 99', 36),
(71, 'Escuela La Paloma', 'Escuela', 'Calle del Faro 14', 37),
(72, 'UTU La Paloma', 'UTU', 'Camino Costero 60', 37),
(73, 'Escuela Salto Centro', 'Escuela', 'Av. Uruguay 300', 38),
(74, 'Liceo Nro. 1 Salto', 'Liceo', 'Calle Larrañaga 87', 38),
(75, 'Escuela Constitución', 'Escuela', 'Calle Constitución 55', 39),
(76, 'Liceo Constitución', 'Liceo', 'Camino Escolar 78', 39),
(77, 'Escuela Bella Vista', 'Escuela', 'Calle de la Paz 12', 40),
(78, 'UTU Bella Vista', 'UTU', 'Calle 33 Orientales 45', 40),
(79, 'Escuela San José Centro', 'Escuela', 'Calle Asamblea 112', 41),
(80, 'Liceo Departamental San José', 'Liceo', 'Av. Manuel D. Rodríguez 302', 41),
(81, 'Escuela Libertad', 'Escuela', 'Calle Principal 50', 42),
(82, 'Liceo Libertad', 'Liceo', 'Av. 18 de Julio 89', 42),
(83, 'Escuela Ciudad del Plata', 'Escuela', 'Ruta 1 km 25', 43),
(84, 'Liceo Ciudad del Plata', 'Liceo', 'Calle Uruguay 100', 43),
(85, 'Escuela Mercedes Centro', 'Escuela', 'Av. Artigas 123', 44),
(86, 'Liceo Mercedes', 'Liceo', 'Calle 25 de Mayo 45', 44),
(87, 'Escuela Dolores', 'Escuela', 'Calle Rivera 78', 45),
(88, 'Liceo Dolores', 'Liceo', 'Av. Uruguay 150', 45),
(89, 'Escuela Cardona', 'Escuela', 'Calle San Martín 100', 46),
(90, 'Liceo Cardona', 'Liceo', 'Calle 18 de Julio 55', 46),
(91, 'Escuela Tacuarembó Centro', 'Escuela', 'Av. 19 de Abril 200', 47),
(92, 'Liceo Tacuarembó', 'Liceo', 'Calle Artigas 100', 47),
(93, 'Escuela Paso de los Toros', 'Escuela', 'Calle Central 45', 48),
(94, 'Liceo Paso de los Toros', 'Liceo', 'Av. Uruguay 80', 48),
(95, 'Escuela San Gregorio', 'Escuela', 'Calle Libertad 90', 49),
(96, 'Liceo San Gregorio', 'Liceo', 'Ruta 43 km 12', 49),
(97, 'Escuela Treinta y Tres', 'Escuela', 'Av. Batlle y Ordóñez 250', 50),
(98, 'Liceo Treinta y Tres', 'Liceo', 'Calle Artigas 130', 50),
(99, 'Escuela Vergara', 'Escuela', 'Calle 25 de Mayo 80', 51),
(100, 'Liceo Vergara', 'Liceo', 'Av. José Pedro Varela 55', 51),
(101, 'Escuela Santa Clara', 'Escuela', 'Calle Uruguay 78', 52),
(102, 'Liceo Santa Clara', 'Liceo', 'Calle Independencia 95', 52);

-- 4. Partido_politico
INSERT INTO `Partido_politico` (`ID`, `nombre`, `direccion_sede`, `presidente`, `vicepresidente`) VALUES
(101, 'Partido Rojo', 'Calle Roja 1', 'Juan Pérez', 'Ana Gómez'),
(102, 'Partido Azul', 'Avenida Azul 2', 'María Rodríguez', 'Carlos Blanco'),
(103, 'PArtido Naranja', 'Cutsa 174', 'Payso Pildorita', 'Ruben Rada');

-- 5. Lista
INSERT INTO `Lista` (`ID`, `FK_Partido_politico_ID`, `numero`, `integrantes`, `organo`, `orden`, `imagen`) VALUES
(1, 101, 2, 'Integrante 1, Integrante 2', 'Nacional', 1, '/images/listas/Lista 02.png'),
(2, 101, 4, 'Integrante 3, Integrante 4', 'Nacional', 2, '/images/listas/Lista 04.png'),
(3, 102, 1, 'Integrante 5, Integrante 6', 'Nacional', 1, '/images/listas/Lista 1.jpg'),
(4, 102, 42, 'Integrante 3, Integrante 7', 'Nacional', 3, '/images/listas/Lista 42.png'),
(5, 103, 20, 'Integrante 2, Integrante 3', 'Nacional', 1, '/images/listas/Lista 20.png');

-- 6. Ciudadano
INSERT INTO `Ciudadano` (`CC`, `nombre`, `CI`, `Fecha_nacimiento`) VALUES
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
('CC200', 'María Fernández', '7654321-0', '1987-04-22'),
('CC201', 'Juan Martínez', '8765432-1', '1990-08-15'),
('CC202', 'Ana Gómez', '9876543-2', '1985-02-10'),
('CC203', 'Luis Rodríguez', '1237894-3', '1978-11-05'),
('CC204', 'Carla Díaz', '2345678-4', '1995-06-20'),
('CC205', 'Miguel Torres', '3456789-5', '1980-12-30'),
('CC206', 'Lucía Sánchez', '4567890-6', '1992-09-18'),
('CC207', 'Pablo Herrera', '5678901-7', '1983-01-25'),
('CC208', 'Sofía Castro', '6789012-8', '1996-03-14'),
('CC209', 'Diego Ramírez', '7890123-9', '1988-07-02'),
('CC210', 'Valentina Morales', '8901234-0', '1991-10-11'),
('CC211', 'Carlos Jiménez', '9012345-1', '1975-05-29'),
('CC212', 'Natalia Mendoza', '0123456-2', '1984-12-16'),
('CC213', 'Andrés Flores', '1234567-3', '1979-09-09'),
('CC214', 'Elena Rojas', '2345678-4', '1993-04-03'),
('CC215', 'Fernando Vargas', '3456789-5', '1986-08-21'),
('CC216', 'Gabriela Ortiz', '4567890-6', '1990-11-30'),
('CC217', 'Javier Castillo', '5678901-7', '1982-02-27'),
('CC218', 'Paula Reyes', '6789012-8', '1989-06-19'),
('CC219', 'Ricardo Jiménez', '7890123-9', '1977-03-05'),
('CC220', 'Lorena Silva', '8901234-0', '1994-07-24'),
('CC221', 'Sergio Castro', '9012345-1', '1981-10-09'),
('CC222', 'Marta Guzmán', '0123456-2', '1995-01-13'),
('CC223', 'Alberto Vega', '1234567-3', '1983-05-06'),
('CC224', 'Claudia Soto', '2345678-4', '1987-12-22'),
('CC225', 'Jorge Rivas', '3456789-5', '1976-08-17'),
('CC226', 'Monica Herrera', '4567890-6', '1992-04-10'),
('CC227', 'Ricardo López', '5678901-7', '1985-09-28'),
('CC228', 'Patricia Morales', '6789012-8', '1990-11-11'),
('CC229', 'Mario Jiménez', '7890123-9', '1978-02-14'),
('CC230', 'Verónica Cruz', '8901234-0', '1993-06-01'),
('CC231', 'Oscar Navarro', '9012345-1', '1984-03-27'),
('CC232', 'Rosa Castillo', '0123456-2', '1991-07-19'),
('CC233', 'Eduardo Vargas', '1234567-3', '1979-10-31'),
('CC234', 'Liliana Flores', '2345678-4', '1986-01-08'),
('CC235', 'Andrés Jiménez', '3456789-5', '1990-05-15'),
('CC236', 'Carmen Ortiz', '4567890-6', '1983-09-22'),
('CC237', 'Felipe Herrera', '5678901-7', '1987-11-29'),
('CC238', 'Sandra Reyes', '6789012-8', '1992-03-16'),
('CC239', 'Juan Pablo Silva', '7890123-9', '1988-07-07'),
('CC240', 'Marta Gómez', '8901234-0', '1991-12-23'),
('CC241', 'Ricardo Ramos', '9012345-1', '1975-06-12'),
('CC242', 'María Elena Ortiz', '0123456-2', '1984-10-04'),
('CC243', 'Javier Morales', '1234567-3', '1977-03-19'),
('CC244', 'Patricia Castro', '2345678-4', '1993-08-25'),
('CC245', 'Carlos Rivas', '3456789-5', '1985-11-02'),
('CC246', 'Sofía López', '4567890-6', '1990-01-27'),
('CC247', 'Miguel Ángel Pérez', '5678901-7', '1982-05-20'),
('CC248', 'Laura González', '6789012-8', '1987-09-11'),
('CC249', 'Juan Carlos Díaz', '7890123-9', '1991-02-18'),
('CC250', 'Verónica Martínez', '8901234-0', '1983-07-08'),
('CC666', 'Los TussiWarrior', '6664206-9', '2000-02-29'),
('CC875', 'El Maestruli', '1542874-7', '1970-01-13'),
('CC900', 'Payaso Pildorita', '2245528-5', '1975-07-15'),
('CC901', 'Hasbulla', '1221548-7', '1991-07-18'),
('CC902', 'El Colorado De Don Omar', '4584842-1', '1975-11-24');

-- 7. Miembro_de_Mesa
INSERT INTO `Miembro_de_Mesa` (`FK_Ciudadano_CC`, `organismo`) VALUES
('CC001', 'Ministerio de Salud Pública (MSP)'),
('CC002', 'Administración Nacional de Educación Pública (ANEP)'),
('CC003', 'Organismo Electoral'),
('CC004', 'Organismo Electoral'),
('CC005', 'Organismo Electoral'),
('CC101', 'Corte Electoral'),
('CC102', 'Corte Electoral'),
('CC103', 'Corte Electoral'),
('CC104', 'Corte Electoral'),
('CC105', 'Corte Electoral'),
('CC200', 'Ministerio del Interior'),
('CC201', 'Administración Nacional de Educación Pública (ANEP)'),
('CC202', 'Administración de los Servicios de Salud del Estado (ASSE)'),
('CC203', 'Banco de Previsión Social (BPS)'),
('CC204', 'Dirección Nacional de Identificación Civil'),
('CC205', 'Ministerio de Desarrollo Social (MIDES)'),
('CC206', 'Ministerio de Transporte y Obras Públicas (MTOP)'),
('CC207', 'Ministerio de Ganadería, Agricultura y Pesca (MGAP)'),
('CC208', 'Ministerio de Economía y Finanzas (MEF)'),
('CC209', 'Intendencia de Montevideo'),
('CC210', 'Ministerio de Educación y Cultura (MEC)'),
('CC211', 'Ministerio de Industria, Energía y Minería (MIEM)'),
('CC212', 'Ministerio de Salud Pública (MSP)'),
('CC213', 'Dirección General de Registro Civil'),
('CC214', 'Ministerio de Trabajo y Seguridad Social (MTSS)'),
('CC215', 'UTE (Administración Nacional de Usinas y Transmisiones Eléctricas)'),
('CC216', 'OSE (Obras Sanitarias del Estado)'),
('CC217', 'Ministerio de Defensa Nacional'),
('CC218', 'Dirección General Impositiva (DGI)'),
('CC219', 'Banco Central del Uruguay (BCU)'),
('CC220', 'Instituto Nacional de Estadística (INE)'),
('CC221', 'Instituto Nacional de Colonización'),
('CC222', 'Dirección Nacional de Aduanas'),
('CC223', 'Junta Nacional de Drogas'),
('CC224', 'Instituto del Niño y Adolescente del Uruguay (INAU)'),
('CC225', 'Fiscalía General de la Nación'),
('CC226', 'Unidad Reguladora de Servicios de Comunicaciones (URSEC)'),
('CC227', 'Ministerio de Turismo'),
('CC228', 'Tribunal de Cuentas'),
('CC229', 'Parlamento del Uruguay'),
('CC230', 'Intendencia de Canelones'),
('CC231', 'Ministerio de Ganadería, Agricultura y Pesca (MGAP)'),
('CC232', 'Ministerio de Economía y Finanzas (MEF)'),
('CC233', 'Ministerio de Transporte y Obras Públicas (MTOP)'),
('CC234', 'Ministerio de Educación y Cultura (MEC)'),
('CC235', 'Ministerio de Salud Pública (MSP)'),
('CC236', 'Administración Nacional de Educación Pública (ANEP)'),
('CC237', 'Banco de Previsión Social (BPS)'),
('CC238', 'Dirección Nacional de Identificación Civil'),
('CC239', 'Ministerio de Desarrollo Social (MIDES)'),
('CC240', 'Intendencia de Montevideo'),
('CC241', 'Ministerio de Industria, Energía y Minería (MIEM)'),
('CC242', 'Dirección General de Registro Civil'),
('CC243', 'Ministerio de Trabajo y Seguridad Social (MTSS)'),
('CC244', 'Administración de los Servicios de Salud del Estado (ASSE)'),
('CC245', 'Ministerio del Interior'),
('CC246', 'Unidad Reguladora de Servicios de Comunicaciones (URSEC)'),
('CC247', 'Instituto Nacional de Estadística (INE)'),
('CC248', 'Tribunal de Cuentas'),
('CC249', 'Ministerio de Turismo'),
('CC250', 'Fiscalía General de la Nación');

-- 8. Presidente
INSERT INTO `Presidente` (`FK_Ciudadano_CC`, `ID_presidente`) VALUES
('CC004', 1),
('CC101', 101),
('CC102', 102),
('CC103', 103),
('CC104', 104),
('CC105', 105),
('CC200', 109),
('CC201', 110),
('CC202', 111),
('CC203', 112),
('CC204', 113),
('CC205', 114),
('CC231', 119),
('CC234', 120),
('CC237', 121),
('CC005', 122),
('CC240', 123),
('CC243', 124),
('CC246', 125);

-- 9. Policía
INSERT INTO `Policia` (`FK_Ciudadano_CC`, `comisaria`, `FK_Establecimiento_ID`) VALUES
('CC005', 'Comisaria 1', 1);

-- 10. Mesa
INSERT INTO `Mesa` (`ID`, `FK_Secretario_CC`, `FK_Vocal_CC`, `FK_Presidente_CC`) VALUES
(1, 'CC003', 'CC230', 'CC004'),
(101, 'CC229', 'CC228', 'CC101'),
(102, 'CC227', 'CC226', 'CC102'),
(103, 'CC225', 'CC224', 'CC103'),
(104, 'CC223', 'CC222', 'CC104'),
(105, 'CC221', 'CC220', 'CC105'),
(114, 'CC206', 'CC207', 'CC200'),
(115, 'CC208', 'CC209', 'CC201'),
(116, 'CC210', 'CC211', 'CC202'),
(117, 'CC212', 'CC213', 'CC203'),
(118, 'CC214', 'CC215', 'CC204'),
(119, 'CC216', 'CC217', 'CC205'),
(123, 'CC218', 'CC219', 'CC231'),
(124, 'CC232', 'CC233', 'CC234'),
(125, 'CC235', 'CC236', 'CC237'),
(127, 'CC001', 'CC002', 'CC005'),
(128, 'CC238', 'CC239', 'CC240'),
(129, 'CC241', 'CC242', 'CC243'),
(130, 'CC244', 'CC245', 'CC246');

-- 11. Elección
INSERT INTO `Eleccion` (`ID`, `Fecha_inicio`, `Fecha_fin`) VALUES
(1, '2023-10-26 09:00:00', '2023-10-26 18:00:00');

-- 12. Circuito
INSERT INTO `Circuito` (`ID`, `FK_establecimiento_ID`, `FK_Eleccion_ID`, `es_accesible`, `FK_Mesa_ID`) VALUES
(2, 2, 1, 0, NULL, 'cerrado'),
(16, 1, 1, 1, 1, 'cerrado'),
(17, 2, 1, 0, 101, 'cerrado'),
(3, 3, 1, 1, 102, 'cerrado'),
(4, 4, 1, 0, 103, 'cerrado'),
(5, 5, 1, 1, 104, 'cerrado'),
(105, 1, 1, 1, 105, 'cerrado'),
(7, 7, 1, 1, 114, 'cerrado'),
(8, 8, 1, 0, 115, 'cerrado'),
(9, 9, 1, 1, 116, 'cerrado'),
(10, 10, 1, 0, 117, 'cerrado'),
(11, 11, 1, 1, 118, 'cerrado'),
(12, 12, 1, 0, 119, 'cerrado'),
(13, 13, 1, 1, 123, 'cerrado'),
(14, 14, 1, 0, 124, 'cerrado'),
(15, 15, 1, 1, 125, 'cerrado'),
(18, 18, 1, 0, 127, 'cerrado'),
(19, 19, 1, 1, 128, 'cerrado'),
(129, 29, 1, 1, 129, 'cerrado'),
(20, 20, 1, 0, 130, 'cerrado');

-- 13. Voto (Se insertan los votos directamente, sin depender de Sufraga)
-- Voto común
INSERT INTO `Voto` (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`, `tipo_voto`, `es_observado`) VALUES
(1, 1, 1, 'comun', FALSE);
SET @voto_comun_id = LAST_INSERT_ID();

-- Voto blanco
INSERT INTO `Voto` (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`, `tipo_voto`, `es_observado`) VALUES
(1, 1, 1, 'blanco', FALSE);
SET @voto_blanco_id = LAST_INSERT_ID();

-- Voto anulado
INSERT INTO `Voto` (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`, `tipo_voto`, `es_observado`) VALUES
(1, 1, 1, 'anulado', FALSE);
SET @voto_anulado_id = LAST_INSERT_ID();

-- Voto común y observado (sufraga en un circuito diferente al asignado)
INSERT INTO `Voto` (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`, `tipo_voto`, `es_observado`) VALUES
(1, 1, 1, 'comun', TRUE);
SET @voto_observado_comun_id = LAST_INSERT_ID();


-- 14. Sufraga
INSERT INTO `Sufraga` (`FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`, `FK_Ciudadano_CC`, `fecha_hora`) VALUES
(1, 1, 1, 'CC001', NOW()),
(1, 1, 1, 'CC002', NOW());

-- 15. Candidato
INSERT INTO `Candidato` (`FK_Ciudadano_CC`, `id_candidato`, `FK_Lista_ID`, `FK_Partido_politico_ID`) VALUES
('CC666', 1, 4, 102),
('CC875', 2, 3, 102),
('CC900', 3, 5, 103),
('CC901', 4, 1, 101),
('CC902', 5, 2, 101);

-- 16. Comun (solo para votos de tipo 'comun')
INSERT INTO `Comun` (`FK_Voto_ID`, `FK_Lista_ID`, `FK_Partido_politico_ID`) VALUES
(@voto_comun_id, 1, 101),
(@voto_observado_comun_id, 1, 101); -- El voto observado también cuenta como comun

-- 17. Participa_en
INSERT INTO `Participa_en` (`FK_Candidato_CC`, `FK_Eleccion_ID`) VALUES
('CC001', 1);

-- 18. abre_circuito
INSERT INTO `abre_circuito` (`Fecha`, `FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`, `FK_Presidente_CC`) VALUES
(NOW(), 1, 1, 1, 'CC004');

-- 19. es_asignado (Para probar la lógica de 'Observado')
INSERT INTO `es_asignado` (`FK_Ciudadano_CC`, `FK_Circuito_ID`, `FK_Establecimiento_ID`, `FK_Eleccion_ID`, `fecha_hora`) VALUES
('CC002', 2, 2, 1, '2025-06-08 17:28:22'),
('CC200', 11, 11, 1, '2025-07-06 22:10:33'),
('CC202', 13, 13, 1, '2025-06-15 10:45:00'),
('CC203', 14, 14, 1, '2025-06-16 12:00:00'),
('CC204', 15, 15, 1, '2025-06-17 09:30:00'),
('CC205', 16, 1, 1, '2025-06-18 14:20:00'),
('CC206', 17, 2, 1, '2025-06-19 16:15:00'),
('CC208', 2, 2, 1, '2025-06-21 13:50:00'),
('CC209', 3, 3, 1, '2025-06-22 15:30:00'),
('CC210', 4, 4, 1, '2025-06-23 17:45:00'),
('CC211', 5, 5, 1, '2025-06-24 09:05:00'),
('CC213', 7, 7, 1, '2025-06-26 14:40:00'),
('CC214', 8, 8, 1, '2025-06-27 18:00:00'),
('CC215', 9, 9, 1, '2025-06-28 11:15:00'),
('CC216', 10, 10, 1, '2025-06-29 16:45:00'),
('CC217', 11, 11, 1, '2025-06-30 10:25:00'),
('CC218', 12, 12, 1, '2025-07-01 14:50:00'),
('CC219', 13, 13, 1, '2025-07-02 09:10:00'),
('CC220', 14, 14, 1, '2025-07-03 13:20:00'),
('CC221', 15, 15, 1, '2025-07-04 15:35:00'),
('CC222', 16, 1, 1, '2025-07-05 17:55:00'),
('CC223', 17, 2, 1, '2025-07-06 10:40:00'),
('CC225', 2, 2, 1, '2025-07-08 14:00:00'),
('CC226', 3, 3, 1, '2025-07-09 16:30:00'),
('CC227', 4, 4, 1, '2025-07-10 18:10:00'),
('CC228', 5, 5, 1, '2025-07-11 20:20:00'),
('CC230', 7, 7, 1, '2025-07-13 11:40:00'),
('CC231', 8, 8, 1, '2025-07-14 14:05:00'),
('CC232', 9, 9, 1, '2025-07-15 16:25:00'),
('CC233', 10, 10, 1, '2025-07-16 18:45:00'),
('CC239', 7, 7, 1, '2025-07-06 20:04:00'),
('CC240', 8, 8, 1, '2025-07-06 20:05:00'),
('CC241', 9, 9, 1, '2025-07-06 20:06:00'),
('CC242', 10, 10, 1, '2025-07-06 20:07:00'),
('CC243', 11, 11, 1, '2025-07-06 20:08:00'),
('CC244', 12, 12, 1, '2025-07-06 20:09:00'),
('CC246', 14, 14, 1, '2025-07-06 20:11:00'),
('CC247', 15, 15, 1, '2025-07-06 20:12:00'),
('CC248', 16, 1, 1, '2025-07-06 20:13:00'),
('CC249', 17, 2, 1, '2025-07-06 20:14:00'),
('CC250', 105, 1, 1, '2025-07-06 20:15:00'),
('CC666', 15, 15, 1, '2025-07-06 23:57:41');