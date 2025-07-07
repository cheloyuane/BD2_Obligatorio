"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.esMesa = exports.esVotante = exports.verificarToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const verificarToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({ mensaje: 'No se proporcionó token de autenticación' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
        // Verificar si el usuario existe en la base de datos
        const [rows] = yield database_1.default.query('SELECT CC FROM Ciudadano WHERE CC = ?', [decoded.id]);
        if (Array.isArray(rows) && rows.length === 0) {
            res.status(401).json({ mensaje: 'Usuario no encontrado' });
            return;
        }
        req.user = {
            id: decoded.id,
            tipo: decoded.tipo,
            nombre: decoded.nombre,
            presidenteId: decoded.presidenteId,
            circuitoAsignado: decoded.circuitoAsignado,
            circuitoVotacion: decoded.circuitoVotacion
        };
        next();
    }
    catch (error) {
        console.error('Error en verificarToken:', error);
        res.status(401).json({ mensaje: 'Token inválido' });
    }
});
exports.verificarToken = verificarToken;
const esVotante = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.tipo) !== 'votante') {
        res.status(403).json({ mensaje: 'Acceso denegado' });
        return;
    }
    next();
};
exports.esVotante = esVotante;
const esMesa = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.tipo) !== 'mesa') {
        res.status(403).json({ mensaje: 'Acceso denegado' });
        return;
    }
    next();
};
exports.esMesa = esMesa;
