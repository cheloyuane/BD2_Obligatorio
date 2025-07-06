"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const votoController_1 = require("../controllers/votoController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Ruta de diagnóstico (temporal, para desarrollo)
router.get('/diagnostico', votoController_1.diagnosticarDatos);
// Solo votantes pueden emitir votos
router.post('/', authMiddleware_1.verificarToken, authMiddleware_1.esVotante, votoController_1.emitirVoto);
// Obtener información del circuito actual
router.get('/circuito-actual', authMiddleware_1.verificarToken, authMiddleware_1.esVotante, votoController_1.obtenerCircuitoActual);
// Solo miembros de mesa pueden ver resultados
router.get('/resultados/:circuitoId/:establecimientoId/:eleccionId', authMiddleware_1.verificarToken, authMiddleware_1.esMesa, votoController_1.obtenerResultadosCircuito);
exports.default = router;
