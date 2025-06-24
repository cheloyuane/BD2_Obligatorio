import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import votoRoutes from './routes/votoRoutes';
import partidoRoutes from './routes/partidoRoutes';
import listaRoutes from './routes/listaRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({ mensaje: 'Servidor funcionando correctamente' });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/votos', votoRoutes);
app.use('/api/partidos', partidoRoutes);
app.use('/api/listas', listaRoutes);
app.use('/api/admin', adminRoutes);

// Manejador de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log('Rutas disponibles:');
  console.log('- GET /test');
  console.log('- POST /api/auth/votante');
  console.log('- POST /api/auth/mesa');
  console.log('- POST /api/votos');
  console.log('- GET /api/votos/circuito-actual');
  console.log('- GET /api/votos/resultados/:circuitoId/:establecimientoId/:eleccionId');
  console.log('- GET /api/admin/presidente-info');
  console.log('- GET /api/admin/eleccion-activa');
  console.log('- POST /api/admin/configurar-circuito');
  console.log('- POST /api/admin/abrir-urna');
  console.log('- POST /api/admin/cerrar-urna');
}); 