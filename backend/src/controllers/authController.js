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
exports.loginPresidente = exports.loginVotante = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';
const loginVotante = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { credencial } = req.body;
        console.log('Intento de login con credencial:', credencial);
        // Buscar al ciudadano por su credencial cívica
        const [ciudadanos] = yield database_1.default.query('SELECT * FROM Ciudadano WHERE CC = ?', [credencial]);
        console.log('Resultado de la búsqueda:', ciudadanos);
        if (ciudadanos.length === 0) {
            console.log('No se encontró ciudadano con la credencial:', credencial);
            res.status(401).json({ mensaje: 'Credencial inválida' });
            return;
        }
        const ciudadano = ciudadanos[0];
        console.log('Ciudadano encontrado:', ciudadano);
        // Verificar si ya votó
        const [votos] = yield database_1.default.query('SELECT * FROM Sufraga WHERE FK_Ciudadano_CC = ?', [ciudadano.CC]);
        if (votos.length > 0) {
            console.log('El ciudadano ya votó');
            res.status(400).json({ mensaje: 'Ya ha emitido su voto' });
            return;
        }
        // Obtener información del circuito asignado al ciudadano
        console.log('Buscando circuito asignado para:', ciudadano.CC);
        const [circuitoAsignado] = yield database_1.default.query(`SELECT 
        ea.FK_Circuito_ID as circuito_id,
        ea.FK_Establecimiento_ID,
        ea.FK_Eleccion_ID,
        e.nombre as establecimiento_nombre,
        e.tipo as establecimiento_tipo,
        e.direccion as establecimiento_direccion
       FROM es_asignado ea
       JOIN Establecimiento e ON ea.FK_Establecimiento_ID = e.ID
       WHERE ea.FK_Ciudadano_CC = ?
       LIMIT 1`, [ciudadano.CC]);
        console.log('Resultado de circuito asignado:', circuitoAsignado);
        // Si no está asignado a ningún circuito, asignarlo automáticamente
        let circuitoInfo = null;
        if (circuitoAsignado.length === 0) {
            console.log('Ciudadano no asignado, buscando circuito disponible...');
            const [circuitoDisponible] = yield database_1.default.query(`SELECT 
          c.ID as circuito_id,
          c.FK_establecimiento_ID,
          c.FK_Eleccion_ID,
          e.nombre as establecimiento_nombre,
          e.tipo as establecimiento_tipo,
          e.direccion as establecimiento_direccion
         FROM Circuito c
         JOIN Establecimiento e ON c.FK_establecimiento_ID = e.ID
         WHERE c.FK_Eleccion_ID = 1
         LIMIT 1`);
            if (circuitoDisponible.length > 0) {
                console.log('Asignando circuito automáticamente...');
                yield database_1.default.query('INSERT INTO es_asignado (FK_Ciudadano_CC, FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, fecha_hora) VALUES (?, ?, ?, ?, NOW())', [ciudadano.CC, circuitoDisponible[0].circuito_id, circuitoDisponible[0].FK_establecimiento_ID, circuitoDisponible[0].FK_Eleccion_ID]);
                circuitoInfo = {
                    id: circuitoDisponible[0].circuito_id,
                    establecimiento: {
                        nombre: circuitoDisponible[0].establecimiento_nombre,
                        tipo: circuitoDisponible[0].establecimiento_tipo,
                        direccion: circuitoDisponible[0].establecimiento_direccion
                    }
                };
                console.log('Circuito asignado automáticamente:', circuitoInfo);
            }
        }
        else {
            circuitoInfo = {
                id: circuitoAsignado[0].circuito_id,
                establecimiento: {
                    nombre: circuitoAsignado[0].establecimiento_nombre,
                    tipo: circuitoAsignado[0].establecimiento_tipo,
                    direccion: circuitoAsignado[0].establecimiento_direccion
                }
            };
        }
        // Generar token JWT
        const token = jsonwebtoken_1.default.sign({
            id: ciudadano.CC,
            tipo: 'votante',
            nombre: ciudadano.nombre
        }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Token generado exitosamente');
        // Preparar la respuesta
        const responseData = {
            token,
            ciudadano: {
                cc: ciudadano.CC,
                nombre: ciudadano.nombre
            },
            circuito: circuitoInfo
        };
        console.log('Respuesta final del login:', responseData);
        res.json(responseData);
    }
    catch (error) {
        console.error('Error en loginVotante:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});
exports.loginVotante = loginVotante;
const loginPresidente = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ci } = req.body;
        console.log('Intento de login de presidente con credencial:', ci);
        // Buscar al presidente por su credencial cívica
        const [presidentes] = yield database_1.default.query(`SELECT p.ID_presidente, p.FK_Ciudadano_CC, ci.nombre
       FROM Presidente p
       JOIN Ciudadano ci ON p.FK_Ciudadano_CC = ci.CC
       WHERE ci.CC = ?`, [ci]);
        console.log('Resultado de la búsqueda de presidente:', presidentes);
        if (presidentes.length === 0) {
            console.log('No se encontró presidente con la credencial:', ci);
            res.status(401).json({ mensaje: 'Credencial inválida' });
            return;
        }
        const presidente = presidentes[0];
        console.log('Presidente encontrado:', presidente);
        // Generar token JWT
        const token = jsonwebtoken_1.default.sign({
            id: presidente.FK_Ciudadano_CC,
            tipo: 'mesa',
            presidenteId: presidente.ID_presidente,
            nombre: presidente.nombre
        }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Token generado exitosamente para presidente');
        res.json({
            token,
            presidente: {
                id: presidente.ID_presidente,
                cc: presidente.FK_Ciudadano_CC,
                nombre: presidente.nombre
            }
        });
    }
    catch (error) {
        console.error('Error en loginPresidente:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});
exports.loginPresidente = loginPresidente;
