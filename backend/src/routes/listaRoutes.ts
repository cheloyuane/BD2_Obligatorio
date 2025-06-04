import { Router, RequestHandler } from 'express';
import { obtenerListas } from '../controllers/listaController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

// Ruta para obtener todas las listas electorales
router.get('/', verificarToken as RequestHandler, obtenerListas as RequestHandler);

export default router; 