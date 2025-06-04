import { Router, RequestHandler } from 'express';
import { obtenerPartidos } from '../controllers/partidoController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

// Ruta para obtener todos los partidos políticos
router.get('/', verificarToken as RequestHandler, obtenerPartidos as RequestHandler);

export default router; 