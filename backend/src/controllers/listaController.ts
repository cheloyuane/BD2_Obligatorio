import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface ListaRow extends RowDataPacket {
  ID: number;
  numero: number;
  integrantes: string;
  FK_Partido_politico_ID: number;
  imagen_url: string;
}

export const obtenerListas = async (req: Request, res: Response): Promise<void> => {
  try {
    const [listas] = await pool.query<ListaRow[]>(
      'SELECT ID, numero, integrantes, FK_Partido_politico_ID, imagen_url FROM Lista'
    );

    res.json(listas);
  } catch (error) {
    console.error('Error al obtener listas:', error);
    res.status(500).json({ mensaje: 'Error al obtener las listas electorales' });
  }
}; 