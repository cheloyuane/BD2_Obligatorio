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

    // Verificar si hay votos en el circuito (urna "abierta")
    let urnaAbierta = false;
    if (presidente.circuito_id) {
      const votosQuery = `
        SELECT COUNT(*) as total_votos
        FROM Voto
        WHERE FK_Circuito_ID = ?
        LIMIT 1
      `;
      const [votosRows] = await pool.execute(votosQuery, [presidente.circuito_id]);
      urnaAbierta = (votosRows as any[])[0].total_votos > 0;
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

// Abrir urna (simulado - en realidad solo verifica que no hay votos)
export const abrirUrna = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const presidenteId = decoded.presidenteId;

    // Obtener el circuito del presidente desde abre_circuito
    const presidenteQuery = `
      SELECT ac.FK_Circuito_ID 
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1
    `;
    const [presidenteRows] = await pool.execute(presidenteQuery, [presidenteId]);
    const presidente = (presidenteRows as any[])[0];

    if (!presidente || !presidente.FK_Circuito_ID) {
      return res.status(400).json({ mensaje: 'Debe configurar un circuito primero' });
    }

    const circuitoId = presidente.FK_Circuito_ID;

    // Verificar si ya hay votos en el circuito
    const votosQuery = 'SELECT COUNT(*) as total FROM Voto WHERE FK_Circuito_ID = ?';
    const [votosRows] = await pool.execute(votosQuery, [circuitoId]);
    const totalVotos = (votosRows as any[])[0].total;

    if (totalVotos > 0) {
      return res.status(400).json({ mensaje: 'La urna ya está abierta (hay votos registrados)' });
    }

    res.json({ mensaje: 'Urna lista para recibir votos' });
  } catch (error) {
    console.error('Error en abrirUrna:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Cerrar urna (simulado - en realidad solo verifica que hay votos)
export const cerrarUrna = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const presidenteId = decoded.presidenteId;

    // Obtener el circuito del presidente desde abre_circuito
    const presidenteQuery = `
      SELECT ac.FK_Circuito_ID 
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1
    `;
    const [presidenteRows] = await pool.execute(presidenteQuery, [presidenteId]);
    const presidente = (presidenteRows as any[])[0];

    if (!presidente || !presidente.FK_Circuito_ID) {
      return res.status(400).json({ mensaje: 'Debe configurar un circuito primero' });
    }

    const circuitoId = presidente.FK_Circuito_ID;

    // Verificar si hay votos en el circuito
    const votosQuery = 'SELECT COUNT(*) as total FROM Voto WHERE FK_Circuito_ID = ?';
    const [votosRows] = await pool.execute(votosQuery, [circuitoId]);
    const totalVotos = (votosRows as any[])[0].total;

    if (totalVotos === 0) {
      return res.status(400).json({ mensaje: 'La urna está cerrada (no hay votos registrados)' });
    }

    res.json({ mensaje: 'Urna cerrada - puede proceder con el conteo' });
  } catch (error) {
    console.error('Error en cerrarUrna:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener resultados del circuito
export const getResultadosCircuito = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const presidenteId = decoded.presidenteId;
    const { circuitoId, establecimientoId, eleccionId } = req.params;

    // Verificar que el presidente tiene acceso a este circuito
    const presidenteQuery = `
      SELECT ac.FK_Circuito_ID 
      FROM abre_circuito ac
      JOIN Presidente p ON ac.FK_Presidente_CC = p.FK_Ciudadano_CC
      WHERE p.ID_presidente = ?
      ORDER BY ac.Fecha DESC
      LIMIT 1
    `;
    const [presidenteRows] = await pool.execute(presidenteQuery, [presidenteId]);
    const presidente = (presidenteRows as any[])[0];

    if (!presidente || presidente.FK_Circuito_ID != circuitoId) {
      return res.status(403).json({ mensaje: 'No tiene acceso a este circuito' });
    }

    // Verificar que hay votos en el circuito
    const votosQuery = 'SELECT COUNT(*) as total FROM Voto WHERE FK_Circuito_ID = ?';
    const [votosRows] = await pool.execute(votosQuery, [circuitoId]);
    const totalVotos = (votosRows as any[])[0].total;

    if (totalVotos === 0) {
      return res.status(400).json({ mensaje: 'No hay votos registrados en este circuito' });
    }

    // Obtener resultados por lista
    const resultadosQuery = `
      SELECT 
        l.número as lista_numero,
        pp.nombre as partido_nombre,
        COUNT(v.id) as votos
      FROM Lista l
      JOIN Partido_politico pp ON l.FK_Partido_politico_ID = pp.ID
      LEFT JOIN Comun c ON l.ID = c.FK_Lista_ID AND l.FK_Partido_politico_ID = c.FK_Partido_politico_ID
      LEFT JOIN Voto v ON c.FK_Voto_ID = v.ID
      WHERE v.FK_Circuito_ID = ? 
        AND v.FK_Establecimiento_ID = ? 
        AND v.FK_Eleccion_ID = ?
        AND v.tipo_voto = 'comun'
      GROUP BY l.ID, l.FK_Partido_politico_ID, l.número, pp.nombre
      ORDER BY votos DESC
    `;

    const [resultadosRows] = await pool.execute(resultadosQuery, [circuitoId, establecimientoId, eleccionId]);

    // Obtener conteos especiales
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

    const response = {
      resultadosComunes: resultadosRows,
      totalVotos: totalVotos,
      votosBlanco: conteos.blanco || 0,
      votosAnulados: conteos.anulado || 0,
      votosObservados: 0 // No hay columna es_observado en el esquema original
    };

    res.json(response);
  } catch (error) {
    console.error('Error en getResultadosCircuito:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}; 