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
exports.obtenerEstadoCircuito = exports.ejemploVoto = exports.diagnosticarDatos = exports.obtenerCircuitoActual = exports.obtenerResultadosCircuito = exports.emitirVoto = void 0;
const database_1 = __importDefault(require("../config/database"));
const emitirVoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const connection = yield database_1.default.getConnection();
    try {
        const { partidoId, listaId, tipoVoto } = req.body;
        const ciudadanoCC = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!ciudadanoCC) {
            return res.status(401).json({ mensaje: 'No autorizado' });
        }
        // Verificar si el ciudadano ya votó
        const [yaVoto] = yield connection.query('SELECT * FROM Sufraga WHERE FK_Ciudadano_CC = ?', [ciudadanoCC]);
        if (yaVoto.length > 0) {
            return res.status(400).json({ mensaje: 'Ya ha emitido su voto' });
        }
        // Obtener el circuito y eleccion actual
        const [circuitoEleccion] = yield connection.query(`SELECT c.ID as FK_Circuito_ID, c.FK_establecimiento_ID, c.FK_Eleccion_ID 
       FROM Circuito c
       JOIN Eleccion e ON c.FK_Eleccion_ID = e.ID
       WHERE e.Fecha_inicio <= NOW() AND e.Fecha_fin >= NOW()
       LIMIT 1`);
        if (circuitoEleccion.length === 0) {
            return res.status(400).json({ mensaje: 'No hay elecciones activas en este momento' });
        }
        const { FK_Circuito_ID, FK_establecimiento_ID, FK_Eleccion_ID } = circuitoEleccion[0];
        // Verificar el estado del circuito antes de permitir el voto
        const [estadoCircuito] = yield connection.query('SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', [FK_Circuito_ID, FK_establecimiento_ID, FK_Eleccion_ID]);
        if (estadoCircuito.length === 0) {
            return res.status(400).json({ mensaje: 'Circuito no encontrado' });
        }
        if (estadoCircuito[0].estado === 'cerrado') {
            return res.status(400).json({ mensaje: 'La urna está cerrada. No se pueden emitir votos en este momento.' });
        }
        // Verificar el circuito asignado al ciudadano para el voto Observado
        const [asignacionCiudadano] = yield connection.query('SELECT FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID FROM es_asignado WHERE FK_Ciudadano_CC = ?', [ciudadanoCC]);
        let esObservado = false;
        if (asignacionCiudadano.length > 0 &&
            (asignacionCiudadano[0].FK_Circuito_ID !== FK_Circuito_ID ||
                asignacionCiudadano[0].FK_Establecimiento_ID !== FK_establecimiento_ID ||
                asignacionCiudadano[0].FK_Eleccion_ID !== FK_Eleccion_ID)) {
            esObservado = true;
        }
        // Registrar el sufragio
        yield connection.query('INSERT INTO Sufraga (FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, FK_Ciudadano_CC, fecha_hora) VALUES (?, ?, ?, ?, NOW())', [FK_Circuito_ID, FK_establecimiento_ID, FK_Eleccion_ID, ciudadanoCC]);
        // Registrar el voto en la tabla Voto con el tipo_voto y es_observado
        const [resultVoto] = yield connection.query('INSERT INTO Voto (FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, tipo_voto, es_observado) VALUES (?, ?, ?, ?, ?)', [FK_Circuito_ID, FK_establecimiento_ID, FK_Eleccion_ID, tipoVoto, esObservado]);
        const votoId = resultVoto.insertId;
        // Registrar el tipo de voto específico
        if (tipoVoto === 'comun' && partidoId && listaId) {
            yield connection.query('INSERT INTO Comun (FK_Voto_ID, FK_Lista_ID, FK_Partido_politico_ID) VALUES (?, ?, ?)', [votoId, listaId, partidoId]);
        }
        // Para 'blanco' y 'anulado' no se necesita insertar en tablas separadas, ya están registrados en Voto
        res.json({
            mensaje: 'Voto emitido exitosamente',
            esObservado: esObservado
        });
    }
    catch (error) {
        console.error('Error al emitir voto:', error);
        res.status(500).json({ mensaje: 'Error al emitir el voto' });
    }
    finally {
        connection.release();
    }
});
exports.emitirVoto = emitirVoto;
const obtenerResultadosCircuito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { circuitoId, establecimientoId, eleccionId } = req.params;
        // Obtener la información completa del circuito
        const [circuitoInfo] = yield database_1.default.query('SELECT ID, FK_establecimiento_ID, FK_Eleccion_ID FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', [circuitoId, establecimientoId, eleccionId]);
        if (circuitoInfo.length === 0) {
            res.status(404).json({ mensaje: 'Circuito no encontrado' });
            return;
        }
        // Obtener resultados por lista (solo votos comunes)
        const [resultadosComunes] = yield database_1.default.query(`
      SELECT 
        L.numero as lista_numero,
        PP.nombre as partido_nombre,
        COUNT(V.ID) as votos
      FROM Voto V
      JOIN Comun C ON V.ID = C.FK_Voto_ID
      JOIN Lista L ON C.FK_Lista_ID = L.ID AND C.FK_Partido_politico_ID = L.FK_Partido_politico_ID
      JOIN Partido_politico PP ON C.FK_Partido_politico_ID = PP.ID
      WHERE V.FK_Circuito_ID = ? 
        AND V.FK_Establecimiento_ID = ?
        AND V.FK_Eleccion_ID = ? 
        AND V.tipo_voto = 'comun'
      GROUP BY L.ID, L.FK_Partido_politico_ID, PP.ID
      ORDER BY votos DESC
    `, [circuitoId, establecimientoId, eleccionId]);
        // Obtener total de votos (comunes, blancos y anulados)
        const [totalVotosResult] = yield database_1.default.query('SELECT COUNT(ID) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ?', [circuitoId, establecimientoId, eleccionId]);
        const totalVotos = totalVotosResult[0].total;
        // Obtener votos en blanco
        const [votosBlancoResult] = yield database_1.default.query('SELECT COUNT(ID) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ? AND tipo_voto = "blanco"', [circuitoId, establecimientoId, eleccionId]);
        const votosBlanco = votosBlancoResult[0].total;
        // Obtener votos anulados
        const [votosAnuladosResult] = yield database_1.default.query('SELECT COUNT(ID) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ? AND tipo_voto = "anulado"', [circuitoId, establecimientoId, eleccionId]);
        const votosAnulados = votosAnuladosResult[0].total;
        // Obtener votos observados
        const [votosObservadosResult] = yield database_1.default.query('SELECT COUNT(ID) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ? AND es_observado = TRUE', [circuitoId, establecimientoId, eleccionId]);
        const votosObservados = votosObservadosResult[0].total;
        res.json({
            resultadosComunes,
            totalVotos,
            votosBlanco,
            votosAnulados,
            votosObservados
        });
    }
    catch (error) {
        console.error('Error al obtener resultados:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});
exports.obtenerResultadosCircuito = obtenerResultadosCircuito;
const obtenerCircuitoActual = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const ciudadanoCC = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log('Obteniendo circuito actual para ciudadano:', ciudadanoCC);
        if (!ciudadanoCC) {
            res.status(401).json({ mensaje: 'No autorizado' });
            return;
        }
        // Obtener el circuito actual donde está votando
        const [circuitoActual] = yield database_1.default.query(`SELECT 
        c.ID as circuito_id,
        c.FK_establecimiento_ID,
        c.FK_Eleccion_ID,
        c.estado as estado_circuito,
        e.nombre as establecimiento_nombre,
        e.tipo as establecimiento_tipo,
        e.direccion as establecimiento_direccion
       FROM Circuito c
       JOIN Establecimiento e ON c.FK_establecimiento_ID = e.ID
       WHERE c.FK_Eleccion_ID = 1
       LIMIT 1`);
        console.log('Resultado de circuito actual:', circuitoActual);
        if (circuitoActual.length === 0) {
            console.log('No se encontró circuito activo');
            res.status(404).json({ mensaje: 'No hay elecciones activas en este momento' });
            return;
        }
        // Verificar si el ciudadano está asignado a algún circuito
        const [asignacion] = yield database_1.default.query('SELECT * FROM es_asignado WHERE FK_Ciudadano_CC = ?', [ciudadanoCC]);
        // Si no está asignado, asignarlo automáticamente al primer circuito disponible
        if (asignacion.length === 0) {
            console.log('Ciudadano no asignado, asignando automáticamente...');
            yield database_1.default.query('INSERT INTO es_asignado (FK_Ciudadano_CC, FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, fecha_hora) VALUES (?, ?, ?, ?, NOW())', [ciudadanoCC, circuitoActual[0].circuito_id, circuitoActual[0].FK_establecimiento_ID, circuitoActual[0].FK_Eleccion_ID]);
        }
        const response = {
            id: circuitoActual[0].circuito_id,
            estado: circuitoActual[0].estado_circuito || 'cerrado',
            urnaAbierta: circuitoActual[0].estado_circuito === 'abierto',
            establecimiento: {
                nombre: circuitoActual[0].establecimiento_nombre,
                tipo: circuitoActual[0].establecimiento_tipo,
                direccion: circuitoActual[0].establecimiento_direccion
            }
        };
        console.log('Enviando respuesta:', response);
        res.json(response);
    }
    catch (error) {
        console.error('Error al obtener circuito actual:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});
exports.obtenerCircuitoActual = obtenerCircuitoActual;
const diagnosticarDatos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('=== DIAGNÓSTICO DE DATOS ===');
        // Verificar datos en Eleccion
        const [elecciones] = yield database_1.default.query('SELECT * FROM Eleccion');
        console.log('Elecciones:', elecciones);
        // Verificar datos en Circuito
        const [circuitos] = yield database_1.default.query('SELECT * FROM Circuito');
        console.log('Circuitos:', circuitos);
        // Verificar datos en Establecimiento
        const [establecimientos] = yield database_1.default.query('SELECT * FROM Establecimiento');
        console.log('Establecimientos:', establecimientos);
        // Verificar datos en es_asignado
        const [asignaciones] = yield database_1.default.query('SELECT * FROM es_asignado');
        console.log('Asignaciones:', asignaciones);
        res.json({
            elecciones: elecciones.length,
            circuitos: circuitos.length,
            establecimientos: establecimientos.length,
            asignaciones: asignaciones.length,
            datos: {
                elecciones,
                circuitos,
                establecimientos,
                asignaciones
            }
        });
    }
    catch (error) {
        console.error('Error en diagnóstico:', error);
        res.status(500).json({ mensaje: 'Error en diagnóstico' });
    }
});
exports.diagnosticarDatos = diagnosticarDatos;
const ejemploVoto = (req, res) => {
    res.json({ mensaje: 'Controlador de voto funcionando' });
};
exports.ejemploVoto = ejemploVoto;
const obtenerEstadoCircuito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { circuitoId } = req.params;
        // Obtener el estado del circuito
        const [circuito] = yield database_1.default.query('SELECT estado FROM Circuito WHERE ID = ?', [circuitoId]);
        if (circuito.length === 0) {
            res.status(404).json({ mensaje: 'Circuito no encontrado' });
            return;
        }
        const circuitoAbierto = circuito[0].estado === 'abierto';
        res.json({
            circuitoAbierto,
            estado: circuito[0].estado
        });
    }
    catch (error) {
        console.error('Error al obtener estado del circuito:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});
exports.obtenerEstadoCircuito = obtenerEstadoCircuito;
