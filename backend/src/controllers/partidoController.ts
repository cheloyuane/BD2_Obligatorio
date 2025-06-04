import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface PartidoRow extends RowDataPacket {
  ID: number;
  nombre: string;
}

export const obtenerPartidos = async (req: Request, res: Response): Promise<void> => {
  try {
    const [partidos] = await pool.query<PartidoRow[]>(
      'SELECT ID, nombre FROM Partido_politico'
    );

    res.json(partidos);
  } catch (error) {
    console.error('Error al obtener partidos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los partidos políticos' });
  }
}; 