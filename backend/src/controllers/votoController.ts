import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import jwt from 'jsonwebtoken';

interface VotoRequest {
  partidoId?: number;
  listaId?: number;
  tipoVoto: 'comun' | 'anulado' | 'blanco';
}

interface CustomRequest extends Request {
  user?: {
    id: string;
    tipo: string;
    nombre?: string;
    presidenteId?: number;
    circuitoAsignado?: {
      id: number;
      establecimiento: {
        nombre: string;
        tipo: string;
        direccion: string;
      };
    };
    circuitoVotacion?: {
      id: number;
      establecimiento: {
        nombre: string;
        tipo: string;
        direccion: string;
      };
    };
  };
}

export const emitirVoto = async (req: CustomRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const { partidoId, listaId, tipoVoto } = req.body as VotoRequest;
    const ciudadanoCC = req.user?.id;

    if (!ciudadanoCC) {
      return res.status(401).json({ mensaje: 'No autorizado' });
    }

    // Verificar si el ciudadano ya votó
    const [yaVoto] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Sufraga WHERE FK_Ciudadano_CC = ?',
      [ciudadanoCC]
    );

    if (yaVoto.length > 0) {
      return res.status(400).json({ mensaje: 'Ya ha emitido su voto' });
    }

    let circuitoVotacion, establecimientoVotacion, eleccionVotacion;
    let esObservado = false;

    // Si el usuario tiene información del circuito de votación, usarla
    if (req.user?.circuitoVotacion) {
      circuitoVotacion = req.user.circuitoVotacion.id;
      
      // Obtener el ID del establecimiento desde la base de datos
      const [establecimientoInfo] = await connection.query<RowDataPacket[]>(
        'SELECT FK_establecimiento_ID FROM Circuito WHERE ID = ? AND FK_Eleccion_ID = 1',
        [req.user.circuitoVotacion.id]
      );
      
      if (establecimientoInfo.length === 0) {
        return res.status(400).json({ mensaje: 'Circuito no encontrado' });
      }
      
      establecimientoVotacion = establecimientoInfo[0].FK_establecimiento_ID;
      eleccionVotacion = 1; // Asumimos elección 1
      
      // Verificar si es voto observado (vota en circuito diferente al asignado)
      if (req.user.circuitoAsignado && req.user.circuitoAsignado.id !== req.user.circuitoVotacion.id) {
        esObservado = true;
        console.log('Voto observado: vota en circuito diferente al asignado');
      }
    } else {
      // Fallback: obtener el circuito asignado original
      const [asignacion] = await connection.query<RowDataPacket[]>(
        `SELECT 
          ea.FK_Circuito_ID,
          ea.FK_Establecimiento_ID,
          ea.FK_Eleccion_ID
         FROM es_asignado ea
         WHERE ea.FK_Ciudadano_CC = ?
         ORDER BY ea.fecha_hora ASC
         LIMIT 1`,
        [ciudadanoCC]
      );

      if (asignacion.length === 0) {
        return res.status(400).json({ mensaje: 'No está asignado a ningún circuito electoral' });
      }

      circuitoVotacion = asignacion[0].FK_Circuito_ID;
      establecimientoVotacion = asignacion[0].FK_Establecimiento_ID;
      eleccionVotacion = asignacion[0].FK_Eleccion_ID;
    }

    console.log('Circuito de votación:', circuitoVotacion, 'Establecimiento:', establecimientoVotacion, 'Es observado:', esObservado);

    // Verificar el estado del circuito antes de permitir el voto
    const [estadoCircuito] = await connection.query<RowDataPacket[]>(
      'SELECT estado FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?',
      [circuitoVotacion, establecimientoVotacion, eleccionVotacion]
    );

    if (estadoCircuito.length === 0) {
      return res.status(400).json({ mensaje: 'Circuito no encontrado' });
    }

    if (estadoCircuito[0].estado === 'cerrado') {
      return res.status(400).json({ mensaje: 'La urna está cerrada. No se pueden emitir votos en este momento.' });
    }

    // Registrar el sufragio en el circuito donde realmente vota
    await connection.query(
      'INSERT INTO Sufraga (FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, FK_Ciudadano_CC, fecha_hora) VALUES (?, ?, ?, ?, NOW())',
      [circuitoVotacion, establecimientoVotacion, eleccionVotacion, ciudadanoCC]
    );

    // Registrar el voto en la tabla Voto con el tipo_voto y es_observado
    const [resultVoto] = await connection.query<ResultSetHeader>(
      'INSERT INTO Voto (FK_Circuito_ID, FK_Establecimiento_ID, FK_Eleccion_ID, tipo_voto, es_observado) VALUES (?, ?, ?, ?, ?)',
      [circuitoVotacion, establecimientoVotacion, eleccionVotacion, tipoVoto, esObservado]
    );
    const votoId = resultVoto.insertId;

    // Registrar el tipo de voto específico
    if (tipoVoto === 'comun' && partidoId && listaId) {
      await connection.query(
        'INSERT INTO Comun (FK_Voto_ID, FK_Lista_ID, FK_Partido_politico_ID) VALUES (?, ?, ?)',
        [votoId, listaId, partidoId]
      );
    }
    // Para 'blanco' y 'anulado' no se necesita insertar en tablas separadas, ya están registrados en Voto

    res.json({ 
      mensaje: 'Voto emitido exitosamente',
      esObservado: esObservado,
      circuitoVotacion: circuitoVotacion
    });

  } catch (error) {
    console.error('Error al emitir voto:', error);
    res.status(500).json({ mensaje: 'Error al emitir el voto' });
  } finally {
    connection.release();
  }
};

export const obtenerResultadosCircuito = async (req: Request, res: Response): Promise<void> => {
  try {
    const { circuitoId, establecimientoId, eleccionId } = req.params;

    // Obtener la información completa del circuito
    const [circuitoInfo] = await pool.query<RowDataPacket[]>(
      'SELECT ID, FK_establecimiento_ID, FK_Eleccion_ID FROM Circuito WHERE ID = ? AND FK_establecimiento_ID = ? AND FK_Eleccion_ID = ?',
      [circuitoId, establecimientoId, eleccionId]
    );

    if (circuitoInfo.length === 0) {
      res.status(404).json({ mensaje: 'Circuito no encontrado' });
      return;
    }

    // Obtener resultados por lista (solo votos comunes)
    const [resultadosComunes] = await pool.query<RowDataPacket[]>(`
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
    const [totalVotosResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(ID) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ?',
      [circuitoId, establecimientoId, eleccionId]
    );
    const totalVotos = totalVotosResult[0].total;

    // Obtener votos en blanco
    const [votosBlancoResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(ID) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ? AND tipo_voto = "blanco"',
      [circuitoId, establecimientoId, eleccionId]
    );
    const votosBlanco = votosBlancoResult[0].total;

    // Obtener votos anulados
    const [votosAnuladosResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(ID) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ? AND tipo_voto = "anulado"',
      [circuitoId, establecimientoId, eleccionId]
    );
    const votosAnulados = votosAnuladosResult[0].total;

    // Obtener votos observados
    const [votosObservadosResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(ID) as total FROM Voto WHERE FK_Circuito_ID = ? AND FK_Establecimiento_ID = ? AND FK_Eleccion_ID = ? AND es_observado = TRUE',
      [circuitoId, establecimientoId, eleccionId]
    );
    const votosObservados = votosObservadosResult[0].total;

    res.json({
      resultadosComunes,
      totalVotos,
      votosBlanco,
      votosAnulados,
      votosObservados
    });

  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

export const obtenerCircuitoActual = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const ciudadanoCC = req.user?.id;
    console.log('=== OBTENIENDO CIRCUITO ACTUAL ===');
    console.log('Ciudadano CC:', ciudadanoCC);
    console.log('Usuario del token:', req.user);

    if (!ciudadanoCC) {
      res.status(401).json({ mensaje: 'No autorizado' });
      return;
    }

    // Si el usuario tiene información del circuito de votación, usarla
    if (req.user?.circuitoVotacion) {
      console.log('Usando circuito de votación del req.user:', req.user.circuitoVotacion);
      
      // Obtener el estado actual del circuito y el ID del establecimiento desde la base de datos
      const [circuitoInfo] = await pool.query<RowDataPacket[]>(
        'SELECT estado, FK_establecimiento_ID FROM Circuito WHERE ID = ? AND FK_Eleccion_ID = 1',
        [req.user.circuitoVotacion.id]
      );

      if (circuitoInfo.length === 0) {
        res.status(404).json({ mensaje: 'Circuito no encontrado' });
        return;
      }

      const estado = circuitoInfo[0].estado || 'cerrado';
      const establecimientoId = circuitoInfo[0].FK_establecimiento_ID;

      const response = {
        id: req.user.circuitoVotacion.id,
        estado: estado,
        urnaAbierta: estado === 'abierto',
        establecimiento: {
          id: establecimientoId,
          nombre: req.user.circuitoVotacion.establecimiento.nombre,
          tipo: req.user.circuitoVotacion.establecimiento.tipo,
          direccion: req.user.circuitoVotacion.establecimiento.direccion
        }
      };
      
      console.log('Enviando respuesta (desde req.user):', response);
      res.json(response);
      return;
    }

    // Fallback: obtener el circuito específico donde está asignado el ciudadano
    console.log('req.user no tiene información de circuito, consultando base de datos...');
    const [asignacion] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ea.FK_Circuito_ID as circuito_id,
        ea.FK_Establecimiento_ID,
        ea.FK_Eleccion_ID,
        c.estado as estado_circuito,
        e.nombre as establecimiento_nombre,
        e.tipo as establecimiento_tipo,
        e.direccion as establecimiento_direccion
       FROM es_asignado ea
       JOIN Circuito c ON ea.FK_Circuito_ID = c.ID 
         AND ea.FK_Establecimiento_ID = c.FK_establecimiento_ID 
         AND ea.FK_Eleccion_ID = c.FK_Eleccion_ID
       JOIN Establecimiento e ON c.FK_establecimiento_ID = e.ID
       WHERE ea.FK_Ciudadano_CC = ?
       ORDER BY ea.fecha_hora ASC
       LIMIT 1`,
      [ciudadanoCC]
    );
    console.log('Resultado de asignación del ciudadano:', asignacion);

    // Si no está asignado, asignarlo automáticamente al primer circuito disponible
    if (asignacion.length === 0) {
      console.log('Ciudadano no asignado a ningún circuito');
      res.status(400).json({ mensaje: 'No está asignado a ningún circuito electoral. Contacte a la administración.' });
      return;
    }

    // Usar la asignación existente del ciudadano
    const response = {
      id: asignacion[0].circuito_id,
      estado: asignacion[0].estado_circuito || 'cerrado',
      urnaAbierta: asignacion[0].estado_circuito === 'abierto',
      establecimiento: {
        nombre: asignacion[0].establecimiento_nombre,
        tipo: asignacion[0].establecimiento_tipo,
        direccion: asignacion[0].establecimiento_direccion
      }
    };
    console.log('Enviando respuesta (asignación existente):', response);
    res.json(response);

  } catch (error) {
    console.error('Error al obtener circuito actual:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

export const diagnosticarDatos = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== DIAGNÓSTICO DE DATOS ===');
    
    // Verificar datos en Eleccion
    const [elecciones] = await pool.query<RowDataPacket[]>('SELECT * FROM Eleccion');
    console.log('Elecciones:', elecciones);
    
    // Verificar datos en Circuito
    const [circuitos] = await pool.query<RowDataPacket[]>('SELECT * FROM Circuito');
    console.log('Circuitos:', circuitos);
    
    // Verificar datos en Establecimiento
    const [establecimientos] = await pool.query<RowDataPacket[]>('SELECT * FROM Establecimiento');
    console.log('Establecimientos:', establecimientos);
    
    // Verificar datos en es_asignado
    const [asignaciones] = await pool.query<RowDataPacket[]>('SELECT * FROM es_asignado');
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
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    res.status(500).json({ mensaje: 'Error en diagnóstico' });
  }
};

export const ejemploVoto = (req: Request, res: Response) => {
  res.json({ mensaje: 'Controlador de voto funcionando' });  
};

export const obtenerEstadoCircuito = async (req: Request, res: Response): Promise<void> => {
  try {
    const { circuitoId } = req.params;

    // Obtener el estado del circuito
    const [circuito] = await pool.query<RowDataPacket[]>(
      'SELECT estado FROM Circuito WHERE ID = ?',
      [circuitoId]
    );

    if (circuito.length === 0) {
      res.status(404).json({ mensaje: 'Circuito no encontrado' });
      return;
    }

    const circuitoAbierto = circuito[0].estado === 'abierto';

    res.json({ 
      circuitoAbierto,
      estado: circuito[0].estado
    });

  } catch (error) {
    console.error('Error al obtener estado del circuito:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}; 