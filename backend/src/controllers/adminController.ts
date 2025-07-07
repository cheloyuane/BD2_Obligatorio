import { Request, Response } from 'express';
import pool from '../config/database';
import jwt from 'jsonwebtoken';

// Obtener información del presidente y su circuito
export const getPresidenteInfo = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const presidenteId = decoded.presidenteId;

    // Nueva consulta: buscar circuito asignado a la mesa donde el presidente es titular
    const query = `
      SELECT 
        p.ID_presidente as presidente_id,
        ci.nombre as presidente_nombre,
        c.ID as circuito_id,
        c.ID as circuito_numero,
        e.ID as establecimiento_id,
        e.nombre as establecimiento_nombre,
        e.tipo as establecimiento_tipo,
        e.direccion as establecimiento_direccion
      FROM Presidente p
      JOIN Ciudadano ci ON p.FK_Ciudadano_CC = ci.CC
      JOIN Mesa m ON m.FK_Presidente_CC = p.FK_Ciudadano_CC
      JOIN Circuito c ON c.FK_Mesa_ID = m.ID
      JOIN Establecimiento e ON c.FK_establecimiento_ID = e.ID
      WHERE p.ID_presidente = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [presidenteId]);
    const presidente = (rows as any[])[0];

    if (!presidente) {
      return res.status(404).json({ mensaje: 'Presidente no encontrado o no tiene circuito asignado' });
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
      const [estadoRows] = await pool.execute(estadoQuery, [presidente.circuito_id]);
      urnaAbierta = (estadoRows as any[])[0]?.estado === 'abierto';
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
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error?.sqlMessage || error?.message });
  }
};

// Obtener elección activa
export const getEleccionActiva = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT ID, Fecha_inicio, Fecha_fin
      FROM Eleccion
      WHERE NOW() BETWEEN Fecha_inicio AND Fecha_fin
      ORDER BY Fecha_inicio DESC
      LIMIT 1
    `;

    const [rows] = await pool.execute(query);
    const eleccion = (rows as any[])[0];

    if (!eleccion) {
      return res.status(404).json({ mensaje: 'No hay elección activa' });
    }

    res.json(eleccion);
  } catch (error: any) {
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error?.sqlMessage || error?.message });
  }
};

// Configurar circuito para el presidente
export const configurarCircuito = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const presidenteId = decoded.presidenteId;
    const { circuitoId, establecimientoId, eleccionId } = req.body;

    if (!circuitoId || !establecimientoId || !eleccionId) {
      return res.status(400).json({ mensaje: 'ID de circuito, establecimiento y elección requeridos' });
    }

    // Verificar que el circuito existe
    const circuitoQuery = 'SELECT ID FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?';
    const [circuitoRows] = await pool.execute(circuitoQuery, [circuitoId, establecimientoId, eleccionId]);
    
    if ((circuitoRows as any[]).length === 0) {
      return res.status(404).json({ mensaje: 'Circuito no encontrado' });
    }

    // Obtener el CC del presidente
    const presidenteQuery = 'SELECT FK_Ciudadano_CC FROM Presidente WHERE ID_presidente = ?';
    const [presidenteRows] = await pool.execute(presidenteQuery, [presidenteId]);
    const presidente = (presidenteRows as any[])[0];

    if (!presidente) {
      return res.status(404).json({ mensaje: 'Presidente no encontrado' });
    }

    // Insertar en abre_circuito
    const insertQuery = 'INSERT INTO abre_circuito (Fecha, FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, FK_Presidente_CC) VALUES (NOW(), ?, ?, ?, ?)';
    await pool.execute(insertQuery, [circuitoId, establecimientoId, eleccionId, presidente.FK_Ciudadano_CC]);

    res.json({ mensaje: 'Circuito configurado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Abrir urna - cambiar estado del circuito a 'abierto'
export const abrirUrna = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const { presidenteId } = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    // Obtener circuito del presidente (usando la relación Mesa → Circuito)
    const [circuitoRows] = await pool.execute(`
      SELECT c.ID as circuito_id, c.FK_establecimiento_ID as establecimiento_id, c.FK_Eleccion_ID as eleccion_id, p.FK_Ciudadano_CC as presidente_cc
      FROM Presidente p
      JOIN Mesa m ON m.FK_Presidente_CC = p.FK_Ciudadano_CC
      JOIN Circuito c ON c.FK_Mesa_ID = m.ID
      WHERE p.ID_presidente = ?
      LIMIT 1
    `, [presidenteId]);
    const circuito = (circuitoRows as any[])[0];

    if (!circuito) {
      return res.status(400).json({ mensaje: 'No tiene circuito asignado' });
    }

    const { circuito_id, establecimiento_id, eleccion_id, presidente_cc } = circuito;

    // Verificar estado actual del circuito
    const [estadoRows] = await pool.execute(
      'SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', 
      [circuito_id, establecimiento_id, eleccion_id]
    );
    const estadoActual = (estadoRows as any[])[0]?.estado;

    if (estadoActual === 'abierto') {
      return res.status(400).json({ mensaje: 'La urna ya está abierta' });
    }

    // Actualizar estado a 'abierto'
    await pool.execute(
      'UPDATE Circuito SET estado = "abierto" WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', 
      [circuito_id, establecimiento_id, eleccion_id]
    );

    // Registrar en abre_circuito
    await pool.execute(
      'INSERT INTO abre_circuito (Fecha, FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, FK_Presidente_CC) VALUES (NOW(), ?, ?, ?, ?)',
      [circuito_id, establecimiento_id, eleccion_id, presidente_cc]
    );

    res.json({ mensaje: 'Urna abierta: ahora se aceptan votos' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Cerrar urna - cambiar estado del circuito a 'cerrado'
export const cerrarUrna = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const { presidenteId } = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    // Obtener circuito del presidente
    const [presidenteRows] = await pool.execute(`
      SELECT ac.FK_Circuito_ID, ac.FK_Establecimiento_ID, ac.FK_Eleccion_ID
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1`, [presidenteId]);
    const presidente = (presidenteRows as any[])[0];

    if (!presidente || !presidente.FK_Circuito_ID) {
      return res.status(400).json({ mensaje: 'Debe configurar un circuito primero' });
    }

    const { FK_Circuito_ID: circuitoId, FK_Establecimiento_ID: establecimientoId, FK_Eleccion_ID: eleccionId } = presidente;

    // Verificar estado actual del circuito
    const [estadoRows] = await pool.execute(
      'SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', 
      [circuitoId, establecimientoId, eleccionId]
    );
    const estadoActual = (estadoRows as any[])[0]?.estado;

    if (estadoActual === 'cerrado') {
      return res.status(400).json({ mensaje: 'La urna ya está cerrada' });
    }

    // Actualizar estado a 'cerrado'
    await pool.execute(
      'UPDATE Circuito SET estado = "cerrado" WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', 
      [circuitoId, establecimientoId, eleccionId]
    );

    res.json({ mensaje: 'Urna cerrada: ya no se aceptan votos' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener resultados del circuito (solo cuando está cerrado)
export const getResultadosCircuito = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const presidenteId = decoded.presidenteId;

    // Obtener circuito del presidente
    const [presidenteRows] = await pool.execute(`
      SELECT ac.FK_Circuito_ID, ac.FK_Establecimiento_ID, ac.FK_Eleccion_ID
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1`, [presidenteId]);
    const presidente = (presidenteRows as any[])[0];

    if (!presidente || !presidente.FK_Circuito_ID) {
      return res.status(400).json({ mensaje: 'Debe configurar un circuito primero' });
    }

    const { FK_Circuito_ID: circuitoId, FK_Establecimiento_ID: establecimientoId, FK_Eleccion_ID: eleccionId } = presidente;

    // Verificar estado del circuito
    const [estadoRows] = await pool.execute(
      'SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', 
      [circuitoId, establecimientoId, eleccionId]
    );
    const estado = (estadoRows as any[])[0]?.estado;

    if (estado === 'abierto') {
      return res.status(400).json({ mensaje: 'No se pueden ver resultados mientras la urna está abierta' });
    }

    // Verificar que hay votos en el circuito
    const votosQuery = 'SELECT COUNT(*) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ?';
    const [votosRows] = await pool.execute(votosQuery, [circuitoId, establecimientoId, eleccionId]);
    const totalVotos = (votosRows as any[])[0].total;

    if (totalVotos === 0) {
      return res.status(400).json({ mensaje: 'No hay votos registrados en este circuito' });
    }

    // Obtener información del establecimiento
    const [establecimientoRows] = await pool.execute(
      'SELECT nombre, tipo, direccion FROM Establecimiento WHERE ID = ?',
      [establecimientoId]
    );
    const establecimiento = (establecimientoRows as any[])[0];

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

    const [resultadosRows] = await pool.execute(resultadosQuery, [circuitoId, establecimientoId, eleccionId]);

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

    const [conteosRows] = await pool.execute(conteosQuery, [circuitoId, establecimientoId, eleccionId]);

    // Formatear conteos especiales
    const conteos = (conteosRows as any[]).reduce((acc, row) => {
      acc[row.tipo_voto] = row.cantidad;
      return acc;
    }, {});

    // Debug paso a paso
    const observadosQuery = `
      SELECT COUNT(*) as cantidad
      FROM Voto
      WHERE FK_Circuito_ID = ? 
        AND FK_Establecimiento_ID = ? 
        AND FK_Eleccion_ID = ?
        AND es_observado = TRUE
    `;
    const [observadosRows] = await pool.execute(observadosQuery, [circuitoId, establecimientoId, eleccionId]);
    const votosObservados = (observadosRows as any[])[0]?.cantidad;

    const votosComunes = (resultadosRows as any[]).reduce((sum: number, row: any) => sum + row.votos, 0);
    const votosBlanco = conteos.blanco || 0;
    const votosAnulados = conteos.anulado || 0;

    // --- NUEVO: Resultados por partido ---
    const resultadosPartidoQuery = `
      SELECT 
        pp.ID as partido_id,
        pp.nombre as partido_nombre,
        COUNT(v.id) as votos
      FROM Partido_politico pp
      JOIN Lista l ON l.FK_Partido_politico_ID = pp.ID
      LEFT JOIN Comun c ON l.ID = c.FK_Lista_ID AND l.FK_Partido_politico_ID = c.FK_Partido_politico_ID
      LEFT JOIN Voto v ON c.FK_Voto_ID = v.ID 
        AND v.FK_Circuito_ID = ? 
        AND v.FK_Establecimiento_ID = ? 
        AND v.FK_Eleccion_ID = ?
        AND v.tipo_voto = 'comun'
      GROUP BY pp.ID, pp.nombre
      HAVING COUNT(v.id) > 0
      ORDER BY votos DESC
    `;
    const [resultadosPartidoRows] = await pool.execute(resultadosPartidoQuery, [circuitoId, establecimientoId, eleccionId]);
    const resultadosPorPartido = [...(resultadosPartidoRows as any[]).map((row: any) => ({
      ...row,
      porcentaje: totalVotos > 0 ? ((row.votos / totalVotos) * 100).toFixed(2) : '0.00'
    }))];
    resultadosPorPartido.push(
      { partido_id: null, partido_nombre: 'Votos en Blanco', votos: votosBlanco, porcentaje: totalVotos > 0 ? ((votosBlanco / totalVotos) * 100).toFixed(2) : '0.00' },
      { partido_id: null, partido_nombre: 'Votos Anulados', votos: votosAnulados, porcentaje: totalVotos > 0 ? ((votosAnulados / totalVotos) * 100).toFixed(2) : '0.00' }
    );
    resultadosPorPartido.sort((a, b) => b.votos - a.votos);

    // --- NUEVO: Resultados por candidato ---
    const resultadosCandidatoQuery = `
      SELECT 
        pp.ID as partido_id,
        pp.nombre as partido_nombre,
        ci.CC as candidato_cc,
        ci.nombre as candidato_nombre,
        COUNT(v.id) as votos
      FROM Partido_politico pp
      JOIN Lista l ON l.FK_Partido_politico_ID = pp.ID
      JOIN Candidato c ON l.ID = c.FK_Lista_ID AND l.FK_Partido_politico_ID = c.FK_Partido_politico_ID
      JOIN Ciudadano ci ON c.FK_Ciudadano_CC = ci.CC
      LEFT JOIN Comun com ON l.ID = com.FK_Lista_ID AND l.FK_Partido_politico_ID = com.FK_Partido_politico_ID
      LEFT JOIN Voto v ON com.FK_Voto_ID = v.ID 
        AND v.FK_Circuito_ID = ? 
        AND v.FK_Establecimiento_ID = ? 
        AND v.FK_Eleccion_ID = ?
        AND v.tipo_voto = 'comun'
      GROUP BY pp.ID, pp.nombre, ci.CC, ci.nombre
      HAVING COUNT(v.id) > 0
      ORDER BY votos DESC
    `;
    const [resultadosCandidatoRows] = await pool.execute(resultadosCandidatoQuery, [circuitoId, establecimientoId, eleccionId]);
    const resultadosPorCandidato = [...(resultadosCandidatoRows as any[]).map((row: any) => ({
      ...row,
      porcentaje: totalVotos > 0 ? ((row.votos / totalVotos) * 100).toFixed(2) : '0.00'
    }))];
    resultadosPorCandidato.push(
      { partido_id: null, partido_nombre: '', candidato_cc: null, candidato_nombre: 'Votos en Blanco', votos: votosBlanco, porcentaje: totalVotos > 0 ? ((votosBlanco / totalVotos) * 100).toFixed(2) : '0.00' },
      { partido_id: null, partido_nombre: '', candidato_cc: null, candidato_nombre: 'Votos Anulados', votos: votosAnulados, porcentaje: totalVotos > 0 ? ((votosAnulados / totalVotos) * 100).toFixed(2) : '0.00' }
    );
    resultadosPorCandidato.sort((a, b) => b.votos - a.votos);

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
      resultadosPorLista: (resultadosRows as any[]).map((row: any) => ({
        ...row,
        porcentaje: totalVotos > 0 ? ((row.votos / totalVotos) * 100).toFixed(2) : '0.00'
      })),
      resultadosPorPartido,
      resultadosPorCandidato,
      porcentajes: {
        comunes: totalVotos > 0 ? ((votosComunes / totalVotos) * 100).toFixed(2) : '0.00',
        blanco: totalVotos > 0 ? ((votosBlanco / totalVotos) * 100).toFixed(2) : '0.00',
        anulados: totalVotos > 0 ? ((votosAnulados / totalVotos) * 100).toFixed(2) : '0.00',
        observados: totalVotos > 0 ? ((votosObservados / totalVotos) * 100).toFixed(2) : '0.00'
      }
    };
    res.json(response);
  } catch (error: any) {
    if (error && error.stack) {
      console.error('Stack:', error.stack);
    }
    res.status(500).json({ mensaje: 'Error interno del servidor', error });
  }
};

// Obtener estado actual del circuito del presidente
export const getEstadoCircuito = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const { presidenteId } = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    // Obtener circuito del presidente
    const [presidenteRows] = await pool.execute(`
      SELECT ac.FK_Circuito_ID, ac.FK_Establecimiento_ID, ac.FK_Eleccion_ID
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1`, [presidenteId]);
    const presidente = (presidenteRows as any[])[0];

    if (!presidente || !presidente.FK_Circuito_ID) {
      return res.status(400).json({ mensaje: 'No tiene circuito configurado' });
    }

    const { FK_Circuito_ID: circuitoId, FK_Establecimiento_ID: establecimientoId, FK_Eleccion_ID: eleccionId } = presidente;

    // Obtener estado del circuito
    const [estadoRows] = await pool.execute(
      'SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', 
      [circuitoId, establecimientoId, eleccionId]
    );
    const estado = (estadoRows as any[])[0]?.estado || 'cerrado';

    res.json({ 
      circuitoId,
      estado,
      urnaAbierta: estado === 'abierto'
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener resultados generales para la Corte Electoral
export const getResultadosGenerales = async (req: Request, res: Response) => {
  try {
    // Obtener elección activa
    const [eleccionRows] = await pool.execute(`
      SELECT ID, Fecha_inicio, Fecha_fin
      FROM Eleccion
      WHERE NOW() BETWEEN Fecha_inicio AND Fecha_fin
      ORDER BY Fecha_inicio DESC
      LIMIT 1
    `);
    const eleccion = (eleccionRows as any[])[0];

    if (!eleccion) {
      return res.status(404).json({ mensaje: 'No hay elección activa' });
    }

    const eleccionId = eleccion.ID;

    // Obtener total de ciudadanos registrados
    const [ciudadanosRows] = await pool.execute('SELECT COUNT(*) as total FROM Ciudadano');
    const totalCiudadanos = (ciudadanosRows as any[])[0].total;

    // Obtener total de votantes
    const [votantesRows] = await pool.execute(`
      SELECT COUNT(DISTINCT FK_Ciudadano_CC) as total
      FROM Sufraga
      WHERE FK_Eleccion_ID = ?
    `, [eleccionId]);
    const totalVotantes = (votantesRows as any[])[0].total;

    // Calcular porcentaje de participación
    const porcentajeParticipacion = totalCiudadanos > 0 ? (totalVotantes / totalCiudadanos) * 100 : 0;

    // Obtener estado de los circuitos
    const [circuitosRows] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN estado = 'abierto' THEN 1 ELSE 0 END), 0) as abiertos,
        COALESCE(SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END), 0) as cerrados
      FROM Circuito
      WHERE FK_Eleccion_ID = ?
    `, [eleccionId]);
    const circuitos = (circuitosRows as any[])[0];
    
    // Convertir a números para asegurar comparaciones correctas
    const circuitosAbiertos = Number(circuitos.abiertos) || 0;
    const circuitosCerrados = Number(circuitos.cerrados) || 0;
    const totalCircuitos = Number(circuitos.total) || 0;
    
    const todosCerrados = circuitosAbiertos === 0 && circuitosCerrados > 0;

    // Si todos los circuitos están cerrados, obtener resultados finales
    let resultadosFinales = null;
    if (todosCerrados) {
      // Obtener resultados por lista con información del candidato
      const [resultadosRows] = await pool.execute(`
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

      const todasLasListas = (resultadosRows as any[]).map((row: any) => ({
        ...row,
        porcentaje: totalVotantes > 0 ? (row.votos / totalVotantes) * 100 : 0
      }));

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
      const [conteosRows] = await pool.execute(`
        SELECT 
          tipo_voto,
          COUNT(*) as cantidad
        FROM Voto
        WHERE FK_Eleccion_ID = ?
        GROUP BY tipo_voto
      `, [eleccionId]);

      const conteos = (conteosRows as any[]).reduce((acc, row) => {
        acc[row.tipo_voto] = row.cantidad;
        return acc;
      }, {});

      // Obtener votos observados
      const [observadosRows] = await pool.execute(`
        SELECT COUNT(*) as cantidad
        FROM Voto
        WHERE FK_Eleccion_ID = ?
          AND es_observado = TRUE
      `, [eleccionId]);
      const votosObservados = (observadosRows as any[])[0].cantidad;

      // Obtener resultados por departamento
      const [resultadosDepartamentoRows] = await pool.execute(`
        SELECT 
          d.ID as departamento_id,
          d.nombre as departamento_nombre,
          COUNT(DISTINCT s.FK_Ciudadano_CC) as total_votantes,
          COUNT(DISTINCT ea.FK_Ciudadano_CC) as total_ciudadanos_asignados,
          ROUND((COUNT(DISTINCT s.FK_Ciudadano_CC) / COUNT(DISTINCT ea.FK_Ciudadano_CC)) * 100, 2) as porcentaje_participacion
        FROM Departamento d
        LEFT JOIN Zona z ON d.ID = z.FK_Departamento_ID
        LEFT JOIN Establecimiento e ON z.ID = e.FK_Zona_ID
        LEFT JOIN Circuito cir ON e.ID = cir.FK_establecimiento_ID AND cir.FK_Eleccion_ID = ?
        LEFT JOIN es_asignado ea ON cir.ID = ea.FK_Circuito_ID 
          AND cir.FK_establecimiento_ID = ea.FK_Establecimiento_ID 
          AND cir.FK_Eleccion_ID = ea.FK_Eleccion_ID
        LEFT JOIN Sufraga s ON cir.ID = s.FK_Circuito_ID 
          AND cir.FK_establecimiento_ID = s.FK_Establecimiento_ID 
          AND cir.FK_Eleccion_ID = s.FK_Eleccion_ID
        GROUP BY d.ID, d.nombre
        ORDER BY d.nombre
      `, [eleccionId]);

      // Obtener resultados por lista por departamento
      const [resultadosListaDepartamentoRows] = await pool.execute(`
        SELECT 
          d.ID as departamento_id,
          d.nombre as departamento_nombre,
          l.ID as lista_id,
          l.numero as lista_numero,
          pp.ID as partido_id,
          pp.nombre as partido_nombre,
          COUNT(v.id) as votos
        FROM Departamento d
        JOIN Zona z ON d.ID = z.FK_Departamento_ID
        JOIN Establecimiento e ON z.ID = e.FK_Zona_ID
        JOIN Circuito cir ON e.ID = cir.FK_establecimiento_ID AND cir.FK_Eleccion_ID = ?
        JOIN Voto v ON cir.ID = v.FK_Circuito_ID 
          AND cir.FK_establecimiento_ID = v.FK_Establecimiento_ID 
          AND cir.FK_Eleccion_ID = v.FK_Eleccion_ID
        JOIN Comun com ON v.ID = com.FK_Voto_ID
        JOIN Lista l ON com.FK_Lista_ID = l.ID AND com.FK_Partido_politico_ID = l.FK_Partido_politico_ID
        JOIN Partido_politico pp ON l.FK_Partido_politico_ID = pp.ID
        WHERE v.tipo_voto = 'comun'
        GROUP BY d.ID, d.nombre, l.ID, l.numero, pp.ID, pp.nombre
        HAVING COUNT(v.id) > 0
        ORDER BY d.nombre, votos DESC
      `, [eleccionId]);

      // Organizar resultados por departamento
      const resultadosPorDepartamento = (resultadosDepartamentoRows as any[]).map(depto => {
        const listasDelDepto = (resultadosListaDepartamentoRows as any[]).filter(
          lista => lista.departamento_id === depto.departamento_id
        );
        
        return {
          ...depto,
          listas: listasDelDepto.map(lista => ({
            ...lista,
            porcentaje: depto.total_votantes > 0 ? ((lista.votos / depto.total_votantes) * 100).toFixed(2) : '0.00'
          }))
        };
      });

      resultadosFinales = {
        candidatoGanador,
        listaGanadora,
        todasLasListas,
        resultadosPorDepartamento,
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

    res.json(response);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener todos los departamentos
export const getDepartamentos = async (req: Request, res: Response) => {
  try {
    console.log('Solicitud para obtener departamentos recibida');
    
    const query = `
      SELECT ID, nombre
      FROM Departamento
      ORDER BY nombre
    `;

    console.log('Ejecutando query:', query);
    const [rows] = await pool.execute(query);
    console.log('Resultado de departamentos:', rows);
    
    res.json(rows);
  } catch (error: any) {
    console.error('Error obteniendo departamentos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error?.sqlMessage || error?.message });
  }
};

// Obtener circuitos por departamento
export const getCircuitosPorDepartamento = async (req: Request, res: Response) => {
  try {
    const { departamentoId } = req.params;
    console.log('Solicitud para obtener circuitos del departamento:', departamentoId);

    const query = `
      SELECT DISTINCT
        c.ID,
        e.nombre as establecimiento_nombre,
        e.tipo as establecimiento_tipo,
        e.direccion as establecimiento_direccion
      FROM Circuito c
      JOIN Establecimiento e ON c.FK_establecimiento_ID = e.ID
      JOIN Zona z ON e.FK_Zona_ID = z.ID
      JOIN Departamento d ON z.FK_Departamento_ID = d.ID
      WHERE d.ID = ?
      ORDER BY c.ID
    `;

    console.log('Ejecutando query:', query, 'con departamentoId:', departamentoId);
    const [rows] = await pool.execute(query, [departamentoId]);
    console.log('Resultado de circuitos:', rows);
    
    res.json(rows);
  } catch (error: any) {
    console.error('Error obteniendo circuitos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error?.sqlMessage || error?.message });
  }
}; 