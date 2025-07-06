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
INSERT INTO `Departamento` (`ID`, `nombre`) VALUES
(1, 'Montevideo'),
(2, 'Canelones');

-- 2. Zona
INSERT INTO `Zona` (`ID`, `nombre`, `FK_Departamento_ID`) VALUES
(1, 'Centro', 1),
(2, 'Ciudad de la Costa', 2);

-- 3. Establecimiento
INSERT INTO `Establecimiento` (`ID`, `nombre`, `tipo`, `direccion`, `FK_Zona_ID`) VALUES
(1, 'Escuela Nro. 1', 'Escuela', 'Calle Ficticia 123', 1),
(2, 'Liceo Nro. 2', 'Liceo', 'Avenida Imaginaria 456', 2);

-- 4. Partido_politico
INSERT INTO `Partido_politico` (`ID`, `nombre`, `direccion_sede`, `presidente`, `vicepresidente`) VALUES
(101, 'Partido Rojo', 'Calle Roja 1', 'Juan Pérez', 'Ana Gómez'),
(102, 'Partido Azul', 'Avenida Azul 2', 'María Rodríguez', 'Carlos Blanco');

-- 5. Lista
INSERT INTO `Lista` (`ID`, `FK_Partido_politico_ID`, `numero`, `integrantes`, `organo`, `orden`) VALUES
(1, 101, 10, 'Integrante 1, Integrante 2', 'Nacional', 1),
(2, 101, 11, 'Integrante 3, Integrante 4', 'Departamental', 2),
(3, 102, 20, 'Integrante 5, Integrante 6', 'Nacional', 1);

-- 6. Ciudadano
INSERT INTO `Ciudadano` (`CC`, `nombre`, `CI`, `Fecha_nacimiento`) VALUES
('CC001', 'Leticia Mármol', '1234567-8', '1985-01-15'),
('CC002', 'Pedro Gómez', '8765432-1', '1970-05-20'),
('CC003', 'Sofía Loren', '1122334-4', '1992-11-30'),
('CC004', 'Carlos Perez', '9988776-6', '1965-03-10'),
('CC005', 'Mariano Sosa', '5544332-2', '1980-07-25');

-- 7. Miembro_de_Mesa
INSERT INTO `Miembro_de_Mesa` (`FK_Ciudadano_CC`, `organismo`) VALUES
('CC003', 'Organismo Electoral'),
('CC004', 'Organismo Electoral');

-- 8. Presidente
INSERT INTO `Presidente` (`FK_Ciudadano_CC`, `ID_presidente`) VALUES
('CC004', 1);

-- 9. Policía
INSERT INTO `Policia` (`FK_Ciudadano_CC`, `comisaria`, `FK_Establecimiento_ID`) VALUES
('CC005', 'Comisaria 1', 1);

-- 10. Mesa
INSERT INTO `Mesa` (`ID`, `FK_Secretario_CC`, `FK_Vocal_CC`, `FK_Presidente_CC`) VALUES
(1, 'CC003', NULL, 'CC004');

-- 11. Elección
INSERT INTO `Eleccion` (`ID`, `Fecha_inicio`, `Fecha_fin`) VALUES
(1, '2023-10-26 09:00:00', '2023-10-26 18:00:00');

-- 12. Circuito
INSERT INTO `Circuito` (`ID`, `FK_establecimiento_ID`, `FK_Eleccion_ID`, `es_accesible`, `FK_Mesa_ID`) VALUES
(1, 1, 1, TRUE, 1),
(2, 2, 1, FALSE, NULL);

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
('CC001', 1, 1, 101);

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
('CC001', 1, 1, 1, NOW()), -- Asignado al mismo circuito donde sufraga (no observado)
('CC002', 2, 2, 1, NOW()); -- Asignado a otro circuito (será observado si sufraga en 1,1,1)

