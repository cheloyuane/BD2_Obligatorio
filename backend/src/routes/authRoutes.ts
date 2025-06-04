import { Router } from 'express';
import { loginVotante, loginPresidente } from '../controllers/authController';

const router = Router();

// Rutas de autenticación
router.post('/votante', loginVotante);
router.post('/presidente', loginPresidente);

export default router; 