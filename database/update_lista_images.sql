-- Actualizar las listas existentes con las URLs de las imágenes
-- Basado en las imágenes disponibles en frontend/src/assets/

-- Lista 1 (ID: 1, Partido: 101, Número: 10)
UPDATE `Lista` 
SET `imagen_url` = '/src/assets/Lista 1.jpg' 
WHERE `ID` = 1 AND `FK_Partido_politico_ID` = 101;

-- Lista 2 (ID: 2, Partido: 101, Número: 11) 
UPDATE `Lista` 
SET `imagen_url` = '/src/assets/Lista 02.png' 
WHERE `ID` = 2 AND `FK_Partido_politico_ID` = 101;

-- Lista 3 (ID: 3, Partido: 102, Número: 20)
UPDATE `Lista` 
SET `imagen_url` = '/src/assets/Lista 20.png' 
WHERE `ID` = 3 AND `FK_Partido_politico_ID` = 102;

-- Agregar más listas para usar todas las imágenes disponibles
INSERT INTO `Lista` (`ID`, `FK_Partido_politico_ID`, `numero`, `integrantes`, `organo`, `orden`, `imagen_url`) VALUES
(4, 101, 4, 'Integrante 7, Integrante 8', 'Nacional', 3, '/src/assets/Lista 04.png'),
(5, 102, 42, 'Integrante 9, Integrante 10', 'Departamental', 2, '/src/assets/Lista 42.png');

-- Verificar las actualizaciones
SELECT ID, numero, FK_Partido_politico_ID, imagen_url FROM Lista ORDER BY FK_Partido_politico_ID, numero; 