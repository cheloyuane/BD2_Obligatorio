"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación de presidente de mesa
router.use(authMiddleware_1.verificarToken);
router.use(authMiddleware_1.esMesa);
// Obtener información del presidente y su circuito
router.get('/presidente-info', adminController_1.getPresidenteInfo);
// Obtener elección activa
router.get('/eleccion-activa', adminController_1.getEleccionActiva);
// Configurar circuito para el presidente
router.post('/configurar-circuito', adminController_1.configurarCircuito);
// Control de urna
router.post('/abrir-urna', adminController_1.abrirUrna);
router.post('/cerrar-urna', adminController_1.cerrarUrna);
// Obtener estado del circuito
router.get('/estado-circuito', adminController_1.getEstadoCircuito);
// Obtener resultados del circuito
router.get('/resultados', adminController_1.getResultadosCircuito);
exports.default = router;
