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
exports.getResultadosGenerales = exports.getEstadoCircuito = exports.getResultadosCircuito = exports.cerrarUrna = exports.abrirUrna = exports.configurarCircuito = exports.getEleccionActiva = exports.getPresidenteInfo = void 0;
const database_1 = __importDefault(require("../config/database"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Obtener información del presidente y su circuito
const getPresidenteInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        const presidenteId = decoded.presidenteId;
        // Obtener información del presidente y su circuito (usando abre_circuito)
        const query = `
      SELECT 
        p.ID_presidente as presidente_id,
        ci.nombre as presidente_nombre,
        ac.FK_Circuito_ID as circuito_id,
        c.ID as circuito_numero,
        e.ID as establecimiento_id,
        e.nombre as establecimiento_nombre,
        e.tipo as establecimiento_tipo,
        e.direccion as establecimiento_direccion
      FROM Presidente p
      JOIN Ciudadano ci ON p.FK_Ciudadano_CC = ci.CC
      LEFT JOIN abre_circuito ac ON p.FK_Ciudadano_CC = ac.FK_Presidente_CC
      LEFT JOIN Circuito c ON ac.FK_Circuito_ID = c.ID 
        AND ac.FK_Establecimiento_ID = c.FK_establecimiento_ID 
        AND ac.FK_Eleccion_ID = c.FK_Eleccion_ID
      LEFT JOIN Establecimiento e ON c.FK_establecimiento_ID = e.ID
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1
    `;
        const [rows] = yield database_1.default.execute(query, [presidenteId]);
        const presidente = rows[0];
        if (!presidente) {
            console.log('No se encontró presidente para el ID:', presidenteId);
            return res.status(404).json({ mensaje: 'Presidente no encontrado' });
        }
        // Verificar estado del circuito
        let urnaAbierta = false;
        if (presidente.circuito_id) {
            const estadoQuery = `
        SELECT estado
        FROM Circuito
        WHERE ID = ?
        LIMIT 1
      `;
            const [estadoRows] = yield database_1.default.execute(estadoQuery, [presidente.circuito_id]);
            urnaAbierta = ((_b = estadoRows[0]) === null || _b === void 0 ? void 0 : _b.estado) === 'abierto';
        }
        // Formatear respuesta
        const response = {
            presidente: {
                id: presidente.presidente_id,
                nombre: presidente.presidente_nombre
            },
            circuito: presidente.circuito_id ? {
                id: presidente.circuito_id,
                numero: presidente.circuito_numero,
                establecimiento: {
                    id: presidente.establecimiento_id,
                    nombre: presidente.establecimiento_nombre,
                    tipo: presidente.establecimiento_tipo,
                    direccion: presidente.establecimiento_direccion
                }
            } : null,
            urnaAbierta: urnaAbierta
        };
        console.log('Respuesta presidente-info:', response);
        res.json(response);
    }
    catch (error) {
        console.error('Error en getPresidenteInfo:', error, (error === null || error === void 0 ? void 0 : error.sqlMessage) || '');
        res.status(500).json({ mensaje: 'Error interno del servidor', error: (error === null || error === void 0 ? void 0 : error.sqlMessage) || (error === null || error === void 0 ? void 0 : error.message) });
    }
});
exports.getPresidenteInfo = getPresidenteInfo;
// Obtener elección activa
const getEleccionActiva = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT ID, Fecha_inicio, Fecha_fin
      FROM Eleccion
      WHERE NOW() BETWEEN Fecha_inicio AND Fecha_fin
      ORDER BY Fecha_inicio DESC
      LIMIT 1
    `;
        const [rows] = yield database_1.default.execute(query);
        const eleccion = rows[0];
        if (!eleccion) {
            return res.status(404).json({ mensaje: 'No hay elección activa' });
        }
        res.json(eleccion);
    }
    catch (error) {
        console.error('Error en getEleccionActiva:', error, (error === null || error === void 0 ? void 0 : error.sqlMessage) || '');
        res.status(500).json({ mensaje: 'Error interno del servidor', error: (error === null || error === void 0 ? void 0 : error.sqlMessage) || (error === null || error === void 0 ? void 0 : error.message) });
    }
});
exports.getEleccionActiva = getEleccionActiva;
// Configurar circuito para el presidente
const configurarCircuito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        const presidenteId = decoded.presidenteId;
        const { circuitoId, establecimientoId, eleccionId } = req.body;
        if (!circuitoId || !establecimientoId || !eleccionId) {
            return res.status(400).json({ mensaje: 'ID de circuito, establecimiento y elección requeridos' });
        }
        // Verificar que el circuito existe
        const circuitoQuery = 'SELECT ID FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?';
        const [circuitoRows] = yield database_1.default.execute(circuitoQuery, [circuitoId, establecimientoId, eleccionId]);
        if (circuitoRows.length === 0) {
            return res.status(404).json({ mensaje: 'Circuito no encontrado' });
        }
        // Obtener el CC del presidente
        const presidenteQuery = 'SELECT FK_Ciudadano_CC FROM Presidente WHERE ID_presidente = ?';
        const [presidenteRows] = yield database_1.default.execute(presidenteQuery, [presidenteId]);
        const presidente = presidenteRows[0];
        if (!presidente) {
            return res.status(404).json({ mensaje: 'Presidente no encontrado' });
        }
        // Insertar en abre_circuito
        const insertQuery = 'INSERT INTO abre_circuito (Fecha, FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, FK_Presidente_CC) VALUES (NOW(), ?, ?, ?, ?)';
        yield database_1.default.execute(insertQuery, [circuitoId, establecimientoId, eleccionId, presidente.FK_Ciudadano_CC]);
        res.json({ mensaje: 'Circuito configurado correctamente' });
    }
    catch (error) {
        console.error('Error en configurarCircuito:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});
exports.configurarCircuito = configurarCircuito;
// Abrir urna - cambiar estado del circuito a 'abierto'
const abrirUrna = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token)
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        const { presidenteId } = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        // Obtener circuito del presidente
        const [presidenteRows] = yield database_1.default.execute(`
      SELECT ac.FK_Circuito_ID, ac.FK_Establecimiento_ID, ac.FK_Eleccion_ID
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1`, [presidenteId]);
        const presidente = presidenteRows[0];
        if (!presidente || !presidente.FK_Circuito_ID) {
            return res.status(400).json({ mensaje: 'Debe configurar un circuito primero' });
        }
        const { FK_Circuito_ID: circuitoId, FK_Establecimiento_ID: establecimientoId, FK_Eleccion_ID: eleccionId } = presidente;
        // Verificar estado actual del circuito
        const [estadoRows] = yield database_1.default.execute('SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', [circuitoId, establecimientoId, eleccionId]);
        const estadoActual = (_b = estadoRows[0]) === null || _b === void 0 ? void 0 : _b.estado;
        if (estadoActual === 'abierto') {
            return res.status(400).json({ mensaje: 'La urna ya está abierta' });
        }
        // Actualizar estado a 'abierto'
        yield database_1.default.execute('UPDATE Circuito SET estado = "abierto" WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', [circuitoId, establecimientoId, eleccionId]);
        res.json({ mensaje: 'Urna abierta: ahora se aceptan votos' });
    }
    catch (error) {
        console.error('Error en abrirUrna:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});
exports.abrirUrna = abrirUrna;
// Cerrar urna - cambiar estado del circuito a 'cerrado'
const cerrarUrna = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token)
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        const { presidenteId } = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        // Obtener circuito del presidente
        const [presidenteRows] = yield database_1.default.execute(`
      SELECT ac.FK_Circuito_ID, ac.FK_Establecimiento_ID, ac.FK_Eleccion_ID
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1`, [presidenteId]);
        const presidente = presidenteRows[0];
        if (!presidente || !presidente.FK_Circuito_ID) {
            return res.status(400).json({ mensaje: 'Debe configurar un circuito primero' });
        }
        const { FK_Circuito_ID: circuitoId, FK_Establecimiento_ID: establecimientoId, FK_Eleccion_ID: eleccionId } = presidente;
        // Verificar estado actual del circuito
        const [estadoRows] = yield database_1.default.execute('SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', [circuitoId, establecimientoId, eleccionId]);
        const estadoActual = (_b = estadoRows[0]) === null || _b === void 0 ? void 0 : _b.estado;
        if (estadoActual === 'cerrado') {
            return res.status(400).json({ mensaje: 'La urna ya está cerrada' });
        }
        // Actualizar estado a 'cerrado'
        yield database_1.default.execute('UPDATE Circuito SET estado = "cerrado" WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', [circuitoId, establecimientoId, eleccionId]);
        res.json({ mensaje: 'Urna cerrada: ya no se aceptan votos' });
    }
    catch (error) {
        console.error('Error en cerrarUrna:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});
exports.cerrarUrna = cerrarUrna;
// Obtener resultados del circuito (solo cuando está cerrado)
const getResultadosCircuito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('Iniciando getResultadosCircuito...');
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        const presidenteId = decoded.presidenteId;
        console.log('Presidente ID:', presidenteId);
        // Obtener circuito del presidente
        const [presidenteRows] = yield database_1.default.execute(`
      SELECT ac.FK_Circuito_ID, ac.FK_Establecimiento_ID, ac.FK_Eleccion_ID
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1`, [presidenteId]);
        const presidente = presidenteRows[0];
        if (!presidente || !presidente.FK_Circuito_ID) {
            return res.status(400).json({ mensaje: 'Debe configurar un circuito primero' });
        }
        const { FK_Circuito_ID: circuitoId, FK_Establecimiento_ID: establecimientoId, FK_Eleccion_ID: eleccionId } = presidente;
        console.log('Circuito ID:', circuitoId, 'Establecimiento ID:', establecimientoId, 'Elección ID:', eleccionId);
        // Verificar estado del circuito
        const [estadoRows] = yield database_1.default.execute('SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', [circuitoId, establecimientoId, eleccionId]);
        const estado = (_b = estadoRows[0]) === null || _b === void 0 ? void 0 : _b.estado;
        console.log('Estado del circuito:', estado);
        if (estado === 'abierto') {
            return res.status(400).json({ mensaje: 'No se pueden ver resultados mientras la urna está abierta' });
        }
        // Verificar que hay votos en el circuito
        const votosQuery = 'SELECT COUNT(*) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ?';
        const [votosRows] = yield database_1.default.execute(votosQuery, [circuitoId, establecimientoId, eleccionId]);
        const totalVotos = votosRows[0].total;
        console.log('Total de votos:', totalVotos);
        if (totalVotos === 0) {
            return res.status(400).json({ mensaje: 'No hay votos registrados en este circuito' });
        }
        // Obtener información del establecimiento
        const [establecimientoRows] = yield database_1.default.execute('SELECT nombre, tipo, direccion FROM Establecimiento WHERE ID = ?', [establecimientoId]);
        const establecimiento = establecimientoRows[0];
        // Obtener resultados por lista (votos comunes)
        const resultadosQuery = `
      SELECT 
        l.ID as lista_id,
        l.numero as lista_numero,
        pp.ID as partido_id,
        pp.nombre as partido_nombre,
        COUNT(v.id) as votos
      FROM Lista l
      JOIN Partido_politico pp ON l.FK_Partido_politico_ID = pp.ID
      LEFT JOIN Comun c ON l.ID = c.FK_Lista_ID AND l.FK_Partido_politico_ID = c.FK_Partido_politico_ID
      LEFT JOIN Voto v ON c.FK_Voto_ID = v.ID 
        AND v.FK_Circuito_ID = ? 
        AND v.FK_Establecimiento_ID = ? 
        AND v.FK_Eleccion_ID = ?
        AND v.tipo_voto = 'comun'
      GROUP BY l.ID, l.FK_Partido_politico_ID, pp.ID
      HAVING COUNT(v.id) > 0
      ORDER BY votos DESC
    `;
        const [resultadosRows] = yield database_1.default.execute(resultadosQuery, [circuitoId, establecimientoId, eleccionId]);
        console.log('Resultados por lista:', resultadosRows);
        // Obtener conteos por tipo de voto
        const conteosQuery = `
      SELECT 
        tipo_voto,
        COUNT(*) as cantidad
      FROM Voto
      WHERE FK_Circuito_ID = ? 
        AND FK_Establecimiento_ID = ? 
        AND FK_Eleccion_ID = ?
      GROUP BY tipo_voto
    `;
        const [conteosRows] = yield database_1.default.execute(conteosQuery, [circuitoId, establecimientoId, eleccionId]);
        console.log('Conteos por tipo:', conteosRows);
        // Formatear conteos especiales
        const conteos = conteosRows.reduce((acc, row) => {
            acc[row.tipo_voto] = row.cantidad;
            return acc;
        }, {});
        console.log('Conteos formateados:', conteos);
        // Obtener votos observados
        const observadosQuery = `
      SELECT COUNT(*) as cantidad
      FROM Voto
      WHERE FK_Circuito_ID = ? 
        AND FK_Establecimiento_ID = ? 
        AND FK_Eleccion_ID = ?
        AND es_observado = TRUE
    `;
        const [observadosRows] = yield database_1.default.execute(observadosQuery, [circuitoId, establecimientoId, eleccionId]);
        const votosObservados = observadosRows[0].cantidad;
        // Calcular porcentajes
        const votosComunes = resultadosRows.reduce((sum, row) => sum + row.votos, 0);
        const votosBlanco = conteos.blanco || 0;
        const votosAnulados = conteos.anulado || 0;
        const response = {
            circuito: {
                id: circuitoId,
                estado: estado,
                establecimiento: establecimiento
            },
            resumen: {
                totalVotos: totalVotos,
                votosComunes: votosComunes,
                votosBlanco: votosBlanco,
                votosAnulados: votosAnulados,
                votosObservados: votosObservados
            },
            resultadosPorLista: resultadosRows.map((row) => (Object.assign(Object.assign({}, row), { porcentaje: totalVotos > 0 ? ((row.votos / totalVotos) * 100).toFixed(2) : '0.00' }))),
            porcentajes: {
                comunes: totalVotos > 0 ? ((votosComunes / totalVotos) * 100).toFixed(2) : '0.00',
                blanco: totalVotos > 0 ? ((votosBlanco / totalVotos) * 100).toFixed(2) : '0.00',
                anulados: totalVotos > 0 ? ((votosAnulados / totalVotos) * 100).toFixed(2) : '0.00',
                observados: totalVotos > 0 ? ((votosObservados / totalVotos) * 100).toFixed(2) : '0.00'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error en getResultadosCircuito:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});
exports.getResultadosCircuito = getResultadosCircuito;
// Obtener estado actual del circuito del presidente
const getEstadoCircuito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token)
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        const { presidenteId } = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        // Obtener circuito del presidente
        const [presidenteRows] = yield database_1.default.execute(`
      SELECT ac.FK_Circuito_ID, ac.FK_Establecimiento_ID, ac.FK_Eleccion_ID
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1`, [presidenteId]);
        const presidente = presidenteRows[0];
        if (!presidente || !presidente.FK_Circuito_ID) {
            return res.status(400).json({ mensaje: 'No tiene circuito configurado' });
        }
        const { FK_Circuito_ID: circuitoId, FK_Establecimiento_ID: establecimientoId, FK_Eleccion_ID: eleccionId } = presidente;
        // Obtener estado del circuito
        const [estadoRows] = yield database_1.default.execute('SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', [circuitoId, establecimientoId, eleccionId]);
        const estado = ((_b = estadoRows[0]) === null || _b === void 0 ? void 0 : _b.estado) || 'cerrado';
        res.json({
            circuitoId,
            estado,
            urnaAbierta: estado === 'abierto'
        });
    }
    catch (error) {
        console.error('Error en getEstadoCircuito:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});
exports.getEstadoCircuito = getEstadoCircuito;
// Obtener resultados generales para la Corte Electoral
const getResultadosGenerales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Iniciando getResultadosGenerales...');
        // Obtener elección activa
        const [eleccionRows] = yield database_1.default.execute(`
      SELECT ID, Fecha_inicio, Fecha_fin
      FROM Eleccion
      WHERE NOW() BETWEEN Fecha_inicio AND Fecha_fin
      ORDER BY Fecha_inicio DESC
      LIMIT 1
    `);
        const eleccion = eleccionRows[0];
        if (!eleccion) {
            return res.status(404).json({ mensaje: 'No hay elección activa' });
        }
        const eleccionId = eleccion.ID;
        // Obtener total de ciudadanos registrados
        const [ciudadanosRows] = yield database_1.default.execute('SELECT COUNT(*) as total FROM Ciudadano');
        const totalCiudadanos = ciudadanosRows[0].total;
        // Obtener total de votantes
        const [votantesRows] = yield database_1.default.execute(`
      SELECT COUNT(DISTINCT FK_Ciudadano_CC) as total
      FROM Sufraga
      WHERE FK_Eleccion_ID = ?
    `, [eleccionId]);
        const totalVotantes = votantesRows[0].total;
        // Calcular porcentaje de participación
        const porcentajeParticipacion = totalCiudadanos > 0 ? (totalVotantes / totalCiudadanos) * 100 : 0;
        // Obtener estado de los circuitos
        const [circuitosRows] = yield database_1.default.execute(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN estado = 'abierto' THEN 1 ELSE 0 END), 0) as abiertos,
        COALESCE(SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END), 0) as cerrados
      FROM Circuito
      WHERE FK_Eleccion_ID = ?
    `, [eleccionId]);
        const circuitos = circuitosRows[0];
        // Convertir a números para asegurar comparaciones correctas
        const circuitosAbiertos = Number(circuitos.abiertos) || 0;
        const circuitosCerrados = Number(circuitos.cerrados) || 0;
        const totalCircuitos = Number(circuitos.total) || 0;
        console.log('Datos de circuitos:', circuitos);
        console.log('Circuitos abiertos:', circuitosAbiertos, 'tipo:', typeof circuitosAbiertos);
        console.log('Circuitos cerrados:', circuitosCerrados, 'tipo:', typeof circuitosCerrados);
        const todosCerrados = circuitosAbiertos === 0 && circuitosCerrados > 0;
        console.log('Todos cerrados:', todosCerrados);
        // Si todos los circuitos están cerrados, obtener resultados finales
        let resultadosFinales = null;
        if (todosCerrados) {
            // Obtener resultados por lista con información del candidato
            const [resultadosRows] = yield database_1.default.execute(`
        SELECT 
          l.ID as lista_id,
          l.numero as lista_numero,
          pp.ID as partido_id,
          pp.nombre as partido_nombre,
          COUNT(v.id) as votos,
          c.FK_Ciudadano_CC as candidato_cc,
          ci.nombre as candidato_nombre,
          c.id_candidato as candidato_id
        FROM Lista l
        JOIN Partido_politico pp ON l.FK_Partido_politico_ID = pp.ID
        LEFT JOIN Comun com ON l.ID = com.FK_Lista_ID AND l.FK_Partido_politico_ID = com.FK_Partido_politico_ID
        LEFT JOIN Voto v ON com.FK_Voto_ID = v.ID 
          AND v.FK_Eleccion_ID = ?
          AND v.tipo_voto = 'comun'
        LEFT JOIN Candidato c ON l.ID = c.FK_Lista_ID AND l.FK_Partido_politico_ID = c.FK_Partido_politico_ID
        LEFT JOIN Ciudadano ci ON c.FK_Ciudadano_CC = ci.CC
        LEFT JOIN Participa_en pe ON c.FK_Ciudadano_CC = pe.FK_Candidato_CC AND pe.FK_Eleccion_ID = ?
        GROUP BY l.ID, l.FK_Partido_politico_ID, pp.ID, c.FK_Ciudadano_CC, ci.nombre, c.id_candidato
        HAVING COUNT(v.id) > 0
        ORDER BY votos DESC
      `, [eleccionId, eleccionId]);
            const todasLasListas = resultadosRows.map((row) => (Object.assign(Object.assign({}, row), { porcentaje: totalVotantes > 0 ? (row.votos / totalVotantes) * 100 : 0 })));
            // Obtener lista ganadora y candidato ganador
            const listaGanadora = todasLasListas[0] || null;
            const candidatoGanador = listaGanadora ? {
                cc: listaGanadora.candidato_cc,
                nombre: listaGanadora.candidato_nombre,
                id: listaGanadora.candidato_id,
                lista: {
                    id: listaGanadora.lista_id,
                    numero: listaGanadora.lista_numero
                },
                partido: {
                    id: listaGanadora.partido_id,
                    nombre: listaGanadora.partido_nombre
                },
                votos: listaGanadora.votos,
                porcentaje: listaGanadora.porcentaje
            } : null;
            // Obtener conteos por tipo de voto
            const [conteosRows] = yield database_1.default.execute(`
        SELECT 
          tipo_voto,
          COUNT(*) as cantidad
        FROM Voto
        WHERE FK_Eleccion_ID = ?
        GROUP BY tipo_voto
      `, [eleccionId]);
            const conteos = conteosRows.reduce((acc, row) => {
                acc[row.tipo_voto] = row.cantidad;
                return acc;
            }, {});
            // Obtener votos observados
            const [observadosRows] = yield database_1.default.execute(`
        SELECT COUNT(*) as cantidad
        FROM Voto
        WHERE FK_Eleccion_ID = ?
          AND es_observado = TRUE
      `, [eleccionId]);
            const votosObservados = observadosRows[0].cantidad;
            resultadosFinales = {
                candidatoGanador,
                listaGanadora,
                todasLasListas,
                resumen: {
                    totalVotos: totalVotantes,
                    votosBlanco: conteos.blanco || 0,
                    votosAnulados: conteos.anulado || 0,
                    votosObservados: votosObservados
                }
            };
        }
        const response = {
            totalCiudadanos,
            totalVotantes,
            porcentajeParticipacion,
            circuitosAbiertos: circuitosAbiertos,
            circuitosCerrados: circuitosCerrados,
            totalCircuitos: totalCircuitos,
            todosCerrados,
            resultadosFinales
        };
        console.log('Respuesta resultados generales:', response);
        res.json(response);
    }
    catch (error) {
        console.error('Error en getResultadosGenerales:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});
exports.getResultadosGenerales = getResultadosGenerales;
