import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

interface JwtPayload {
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
}

declare global {
  namespace Express {
    interface Request {
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
  }
}

export const verificarToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ mensaje: 'No se proporcionó token de autenticación' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta') as JwtPayload;
    
    // Verificar si el usuario existe en la base de datos
    const [rows] = await pool.query(
      'SELECT CC FROM Ciudadano WHERE CC = ?',
      [decoded.id]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      res.status(401).json({ mensaje: 'Usuario no encontrado' });
      return;
    }

    req.user = {
      id: decoded.id,
      tipo: decoded.tipo,
      nombre: decoded.nombre,
      presidenteId: decoded.presidenteId,
      circuitoAsignado: decoded.circuitoAsignado,
      circuitoVotacion: decoded.circuitoVotacion
    };

    next();
  } catch (error) {
    console.error('Error en verificarToken:', error);
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};

export const esVotante = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.tipo !== 'votante') {
    res.status(403).json({ mensaje: 'Acceso denegado' });
    return;
  }
  next();
};

export const esMesa = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.tipo !== 'mesa') {
    res.status(403).json({ mensaje: 'Acceso denegado' });
    return;
  }
  next();
}; 