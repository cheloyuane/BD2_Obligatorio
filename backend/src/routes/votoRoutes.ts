import { Router, RequestHandler } from 'express';
import { emitirVoto, obtenerResultadosCircuito, obtenerCircuitoActual, diagnosticarDatos } from '../controllers/votoController';
import { verificarToken, esVotante, esMesa } from '../middlewares/authMiddleware';

const router = Router();

// Ruta de diagnóstico 
router.get('/diagnostico', diagnosticarDatos as RequestHandler);



// Solo votantes pueden emitir votos
router.post('/', 
  verificarToken as RequestHandler,
  esVotante as RequestHandler,
  emitirVoto as RequestHandler
);

// Obtener información del circuito actual
router.get('/circuito-actual',
  verificarToken as RequestHandler,
  esVotante as RequestHandler,
  obtenerCircuitoActual as RequestHandler
);

// Solo miembros de mesa pueden ver resultados
router.get('/resultados/:circuitoId/:establecimientoId/:eleccionId',
  verificarToken as RequestHandler,
  esMesa as RequestHandler,
  obtenerResultadosCircuito as RequestHandler
);

export default router; 