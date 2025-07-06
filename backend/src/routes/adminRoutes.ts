import express from 'express';
import { 
  getPresidenteInfo, 
  getEleccionActiva, 
  configurarCircuito, 
  abrirUrna, 
  cerrarUrna, 
  getResultadosCircuito, 
  getEstadoCircuito,
} from '../controllers/adminController';
import { verificarToken, esMesa } from '../middlewares/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación de presidente de mesa
router.use(verificarToken);
router.use(esMesa);

// Obtener información del presidente y su circuito
router.get('/presidente-info', getPresidenteInfo);

// Obtener elección activa
router.get('/eleccion-activa', getEleccionActiva);

// Configurar circuito para el presidente
router.post('/configurar-circuito', configurarCircuito);

// Control de urna
router.post('/abrir-urna', abrirUrna);
router.post('/cerrar-urna', cerrarUrna);

// Obtener estado del circuito
router.get('/estado-circuito', getEstadoCircuito);

// Obtener resultados del circuito
router.get('/resultados', getResultadosCircuito);

export default router; 