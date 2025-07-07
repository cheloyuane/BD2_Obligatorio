import { Router } from 'express';
import votoRoutes from './votoRoutes';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import { getDepartamentos, getCircuitosPorDepartamento } from '../controllers/adminController';

const router = Router();



// Rutas para obtener los departamentos y los circuitos de departamentos, esto se va a usar en Votar.tsx
router.get('/departamentos', getDepartamentos);
router.get('/circuitos/:departamentoId', getCircuitosPorDepartamento);

router.use('/auth', authRoutes);
router.use('/votos', votoRoutes);
router.use('/admin', adminRoutes);

router.get('/', (req, res) => {
  res.send('API del Sistema de Votación Electrónica');
});

export default router; 