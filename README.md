# BD2 Obligatorio

Sistema de votación electrónica desarrollado como proyecto obligatorio para la materia Base de Datos 2.

## Características

- Sistema de votación electrónica
- Gestión de circuitos electorales
- Registro y conteo de votos
- Diferentes tipos de votos (común, anulado, observado)
- Interfaz de usuario moderna y responsiva

## Tecnologías Utilizadas

- Backend: Node.js con TypeScript
- Base de Datos: MySQL
- Frontend: React con TypeScript
- API REST

## Requisitos

- Node.js
- MySQL
- npm o yarn

## Instalación

1. Clonar el repositorio
```bash
git clone https://github.com/[tu-usuario]/BD2_Obligatorio.git
```

2. Instalar dependencias del backend
```bash
cd backend
npm install
```

3. Instalar dependencias del frontend
```bash
cd frontend
npm install
```

4. Configurar variables de entorno
- Crear archivo `.env` en la carpeta backend basado en `.env.example`

5. Iniciar el servidor de desarrollo
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

## Estructura del Proyecto

```
BD2_Obligatorio/
├── backend/           # Servidor Node.js
├── frontend/          # Aplicación React
└── docs/             # Documentación
``` 