"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listaController_1 = require("../controllers/listaController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Ruta para obtener todas las listas electorales
router.get('/', authMiddleware_1.verificarToken, listaController_1.obtenerListas);
exports.default = router;
