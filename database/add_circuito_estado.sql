-- Agregar columna estado a la tabla Circuito
ALTER TABLE `Circuito` ADD COLUMN `estado` ENUM('abierto', 'cerrado') DEFAULT 'cerrado';

-- Actualizar circuitos existentes para que estén cerrados por defecto
UPDATE `Circuito` SET `estado` = 'cerrado' WHERE `estado` IS NULL; 