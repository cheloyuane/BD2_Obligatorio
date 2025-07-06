"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const votoRoutes_1 = __importDefault(require("./votoRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const router = (0, express_1.Router)();
// Aquí se importarán y usarán las rutas de los diferentes módulos
// Ejemplo:
// import votoRoutes from './votoRoutes';
// router.use('/votos', votoRoutes);
router.use('/auth', authRoutes_1.default);
router.use('/votos', votoRoutes_1.default);
router.use('/admin', adminRoutes_1.default);
router.get('/', (req, res) => {
    res.send('API del Sistema de Votación Electrónica');
});
exports.default = router;
