"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// Rutas de autenticación
router.post('/votante', authController_1.loginVotante);
router.post('/presidente', authController_1.loginPresidente);
exports.default = router;
