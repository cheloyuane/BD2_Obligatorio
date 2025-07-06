"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const votoRoutes_1 = __importDefault(require("./routes/votoRoutes"));
const partidoRoutes_1 = __importDefault(require("./routes/partidoRoutes"));
const listaRoutes_1 = __importDefault(require("./routes/listaRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const adminController_1 = require("./controllers/adminController");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Servir archivos estáticos desde la carpeta assets del frontend
app.use('/src/assets', express_1.default.static(path_1.default.join(__dirname, '../../frontend/src/assets')));
// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ mensaje: 'Servidor funcionando correctamente' });
});
// Rutas de la API
app.use('/api/auth', authRoutes_1.default);
app.use('/api/votos', votoRoutes_1.default);
app.use('/api/partidos', partidoRoutes_1.default);
app.use('/api/listas', listaRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Ruta directa para la Corte Electoral
app.get('/api/corte-electoral/resultados-generales', adminController_1.getResultadosGenerales);
// Manejador de errores
app.use((err, req, res, next) => {
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
    console.log('- GET /api/corte-electoral/resultados-generales');
});
