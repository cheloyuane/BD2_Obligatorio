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

    const [rows] = await pool.execute(query, [presidenteId]);
    const presidente = (rows as any[])[0];

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
    console.log('Respuesta presidente-info:', response);
    res.json(response);
  } catch (error: any) {
    console.error('Error en getPresidenteInfo:', error, error?.sqlMessage || '');
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
    console.error('Error en getEleccionActiva:', error, error?.sqlMessage || '');
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
    console.error('Error en configurarCircuito:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Abrir urna - cambiar estado del circuito a 'abierto'
export const abrirUrna = async (req: Request, res: Response) => {
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

    if (estadoActual === 'abierto') {
      return res.status(400).json({ mensaje: 'La urna ya está abierta' });
    }

    // Actualizar estado a 'abierto'
    await pool.execute(
      'UPDATE Circuito SET estado = "abierto" WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', 
      [circuitoId, establecimientoId, eleccionId]
    );

    res.json({ mensaje: 'Urna abierta: ahora se aceptan votos' });
  } catch (error) {
    console.error('Error en abrirUrna:', error);
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
    console.error('Error en cerrarUrna:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener resultados del circuito (solo cuando está cerrado)
export const getResultadosCircuito = async (req: Request, res: Response) => {
  try {
    console.log('Iniciando getResultadosCircuito...');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const presidenteId = decoded.presidenteId;
    console.log('Presidente ID:', presidenteId);

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
    console.log('Circuito ID:', circuitoId, 'Establecimiento ID:', establecimientoId, 'Elección ID:', eleccionId);

    // Verificar estado del circuito
    const [estadoRows] = await pool.execute(
      'SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?', 
      [circuitoId, establecimientoId, eleccionId]
    );
    const estado = (estadoRows as any[])[0]?.estado;
    console.log('Estado del circuito:', estado);

    if (estado === 'abierto') {
      return res.status(400).json({ mensaje: 'No se pueden ver resultados mientras la urna está abierta' });
    }

    // Verificar que hay votos en el circuito
    const votosQuery = 'SELECT COUNT(*) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ?';
    const [votosRows] = await pool.execute(votosQuery, [circuitoId, establecimientoId, eleccionId]);
    const totalVotos = (votosRows as any[])[0].total;
    console.log('Total de votos:', totalVotos);

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

    const [conteosRows] = await pool.execute(conteosQuery, [circuitoId, establecimientoId, eleccionId]);
    console.log('Conteos por tipo:', conteosRows);

    // Formatear conteos especiales
    const conteos = (conteosRows as any[]).reduce((acc, row) => {
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
    const [observadosRows] = await pool.execute(observadosQuery, [circuitoId, establecimientoId, eleccionId]);
    const votosObservados = (observadosRows as any[])[0].cantidad;

    // Calcular porcentajes
    const votosComunes = (resultadosRows as any[]).reduce((sum: number, row: any) => sum + row.votos, 0);
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
      resultadosPorLista: (resultadosRows as any[]).map((row: any) => ({
        ...row,
        porcentaje: totalVotos > 0 ? ((row.votos / totalVotos) * 100).toFixed(2) : '0.00'
      })),
      porcentajes: {
        comunes: totalVotos > 0 ? ((votosComunes / totalVotos) * 100).toFixed(2) : '0.00',
        blanco: totalVotos > 0 ? ((votosBlanco / totalVotos) * 100).toFixed(2) : '0.00',
        anulados: totalVotos > 0 ? ((votosAnulados / totalVotos) * 100).toFixed(2) : '0.00',
        observados: totalVotos > 0 ? ((votosObservados / totalVotos) * 100).toFixed(2) : '0.00'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error en getResultadosCircuito:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
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
    console.error('Error en getEstadoCircuito:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}; 