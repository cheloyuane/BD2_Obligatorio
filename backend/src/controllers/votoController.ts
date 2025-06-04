import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface VotoRequest {
  partidoId?: number;
  listaId?: number;
  tipoVoto: 'comun' | 'anulado' | 'observado';
}

interface CustomRequest extends Request {
  user?: {
    id: string;
    tipo: string;
  };
}

export const emitirVoto = async (req: CustomRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const { partidoId, listaId, tipoVoto } = req.body as VotoRequest;
    const ciudadanoId = req.user?.id;

    if (!ciudadanoId) {
      return res.status(401).json({ mensaje: 'No autorizado' });
    }

    // Verificar si el ciudadano ya votó
    const [yaVoto] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Sufraga WHERE FK_Ciudadano_CI = ?',
      [ciudadanoId]
    );

    if (yaVoto.length > 0) {
      return res.status(400).json({ mensaje: 'Ya ha emitido su voto' });
    }

    // Obtener el circuito y elección actual
    const [circuitoEleccion] = await connection.query<RowDataPacket[]>(
      `SELECT ce.FK_Circuito_ID, ce.FK_Eleccion_ID 
       FROM Circuito_en_Eleccion ce
       JOIN Eleccion e ON ce.FK_Eleccion_ID = e.ID
       LIMIT 1`
    );

    if (circuitoEleccion.length === 0) {
      return res.status(400).json({ mensaje: 'No hay elecciones activas en este momento' });
    }

    const { FK_Circuito_ID, FK_Eleccion_ID } = circuitoEleccion[0];

    // Registrar el sufragio
    await connection.query(
      'INSERT INTO Sufraga (FK_Circuito_en_Eleccion_Eleccion_ID, FK_Circuito_en_Eleccion_Circuito_ID, FK_Ciudadano_CI, voto) VALUES (?, ?, ?, ?)',
      [FK_Eleccion_ID, FK_Circuito_ID, ciudadanoId, true]
    );

    // Registrar el voto
    const [resultVoto] = await connection.query<ResultSetHeader>(
      'INSERT INTO Voto (fecha_hora, FK_Circuito_en_Eleccion_Eleccion_ID, FK_Circuito_en_Eleccion_Circuito_ID) VALUES (NOW(), ?, ?)',
      [FK_Eleccion_ID, FK_Circuito_ID]
    );
    const votoId = resultVoto.insertId;

    // Registrar el tipo de voto
    if (tipoVoto === 'comun' && partidoId && listaId) {
      await connection.query(
        'INSERT INTO Comun (FK_Voto_ID, FK_Lista_ID, FK_Partido_politico_ID) VALUES (?, ?, ?)',
        [votoId, listaId, partidoId]
      );
    } else if (tipoVoto === 'anulado') {
      await connection.query(
        'INSERT INTO Anulado (FK_Voto_ID) VALUES (?)',
        [votoId]
      );
    } else if (tipoVoto === 'observado') {
      await connection.query(
        'INSERT INTO Observado (FK_Voto_ID) VALUES (?)',
        [votoId]
      );
    }

    res.json({ 
      mensaje: 'Voto emitido exitosamente',
      esObservado: tipoVoto === 'observado'
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
    const { circuitoId } = req.params;

    // Verificar si el circuito está cerrado
    const [circuitos] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM circuitos WHERE id = ? AND estado = "cerrado"',
      [circuitoId]
    );

    if (circuitos.length === 0) {
      res.status(400).json({ mensaje: 'El circuito aún no ha cerrado' });
      return;
    }

    // Obtener resultados por lista
    const [resultados] = await pool.query<RowDataPacket[]>(`
      SELECT 
        l.numero as lista,
        p.nombre as partido,
        COUNT(v.id) as votos,
        (COUNT(v.id) * 100.0 / (SELECT COUNT(*) FROM votos WHERE circuito_id = ?)) as porcentaje
      FROM votos v
      JOIN listas l ON v.lista_id = l.id
      JOIN partidos p ON l.partido_id = p.id
      WHERE v.circuito_id = ?
      GROUP BY l.id, p.id
      ORDER BY votos DESC
    `, [circuitoId, circuitoId]);

    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

//comment
export const ejemploVoto = (req: Request, res: Response) => {
  res.json({ mensaje: 'Controlador de voto funcionando' });  
}; 