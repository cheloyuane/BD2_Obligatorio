import { Router } from 'express';
import votoRoutes from './votoRoutes';
import authRoutes from './authRoutes';

const router = Router();

// Aquí se importarán y usarán las rutas de los diferentes módulos
// Ejemplo:
// import votoRoutes from './votoRoutes';
// router.use('/votos', votoRoutes);

router.use('/auth', authRoutes);
router.use('/votos', votoRoutes);

router.get('/', (req, res) => {
  res.send('API del Sistema de Votación Electrónica');
});

export default router; 