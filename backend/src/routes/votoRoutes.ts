import { Router, RequestHandler } from 'express';
import { emitirVoto, obtenerResultadosCircuito } from '../controllers/votoController';
import { verificarToken, esVotante, esMesa } from '../middlewares/authMiddleware';

const router = Router();

// Solo votantes pueden emitir votos
router.post('/', 
  verificarToken as RequestHandler,
  esVotante as RequestHandler,
  emitirVoto as RequestHandler
);

// Solo miembros de mesa pueden ver resultados
router.get('/resultados/:circuitoId',
  verificarToken as RequestHandler,
  esMesa as RequestHandler,
  obtenerResultadosCircuito as RequestHandler
);

export default router; 