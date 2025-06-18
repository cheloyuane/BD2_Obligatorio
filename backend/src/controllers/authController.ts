import { Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface CiudadanoRow extends RowDataPacket {
  CC: string;
  nombre: string;
  Fecha_nacimiento: Date;
}

interface PresidenteRow extends RowDataPacket {
  CC: string;
  ID_presidente: number;
  nombre: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

export const loginVotante: RequestHandler = async (req, res, next) => {
  try {
    const { credencial } = req.body;
    console.log('Intento de login con credencial:', credencial);

    // Buscar al ciudadano por su credencial cívica
    const [ciudadanos] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM Ciudadano WHERE CC = ?',
      [credencial]
    );

    console.log('Resultado de la búsqueda:', ciudadanos);

    if (ciudadanos.length === 0) {
      console.log('No se encontró ciudadano con la credencial:', credencial);
      res.status(401).json({ mensaje: 'Credencial inválida' });
      return;
    }

    const ciudadano = ciudadanos[0];
    console.log('Ciudadano encontrado:', ciudadano);

    // Verificar si ya votó
    const [votos] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM Sufraga WHERE FK_Ciudadano_CC = ?',
      [ciudadano.CC]
    );

    if (votos.length > 0) {
      console.log('El ciudadano ya votó');
      res.status(400).json({ mensaje: 'Ya ha emitido su voto' });
      return;
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: ciudadano.CC,
        tipo: 'votante',
        nombre: ciudadano.nombre
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Token generado exitosamente');

    res.json({
      token,
      ciudadano: {
        cc: ciudadano.CC,
        nombre: ciudadano.nombre
      }
    });

  } catch (error) {
    console.error('Error en loginVotante:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

export const loginPresidente: RequestHandler = async (req, res, next) => {
  try {
    const { credencial } = req.body;
    console.log('Intento de login de presidente con credencial:', credencial);

    // Buscar al presidente por su credencial cívica
    const [presidentes] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, m.ID as mesa_id
       FROM Presidente p
       JOIN Mesa m ON p.FK_Mesa = m.ID
       JOIN Ciudadano ci ON p.FK_Ciudadano_CC = ci.CC
       WHERE ci.CC = ?`,
      [credencial]
    );

    console.log('Resultado de la búsqueda de presidente:', presidentes);

    if (presidentes.length === 0) {
      console.log('No se encontró presidente con la credencial:', credencial);
      res.status(401).json({ mensaje: 'Credencial inválida' });
      return;
    }

    const presidente = presidentes[0];
    console.log('Presidente encontrado:', presidente);

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: presidente.FK_Ciudadano_CC,
        tipo: 'presidente',
        mesa: presidente.mesa_id
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Token generado exitosamente para presidente');

    res.json({
      token,
      presidente: {
        cc: presidente.FK_Ciudadano_CC,
        mesa: presidente.mesa_id
      }
    });

  } catch (error) {
    console.error('Error en loginPresidente:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}; 