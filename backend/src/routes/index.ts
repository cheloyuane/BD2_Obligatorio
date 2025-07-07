import { Router } from 'express';
import votoRoutes from './votoRoutes';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import { getDepartamentos, getCircuitosPorDepartamento } from '../controllers/adminController';

const router = Router();

// Aquí se importarán y usarán las rutas de los diferentes módulos
// Ejemplo:
// import votoRoutes from './votoRoutes';
// router.use('/votos', votoRoutes);

// Rutas públicas para departamentos y circuitos
router.get('/departamentos', getDepartamentos);
router.get('/circuitos/:departamentoId', getCircuitosPorDepartamento);

router.use('/auth', authRoutes);
router.use('/votos', votoRoutes);
router.use('/admin', adminRoutes);

router.get('/', (req, res) => {
  res.send('API del Sistema de Votación Electrónica');
});

export default router; 