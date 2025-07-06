"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const partidoController_1 = require("../controllers/partidoController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Ruta para obtener todos los partidos políticos
router.get('/', authMiddleware_1.verificarToken, partidoController_1.obtenerPartidos);
exports.default = router;
