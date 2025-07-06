const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateListaImages() {
  let connection;
  
  try {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'votacion_db'
    });

    console.log('Conectado a la base de datos');

    // Actualizar las listas existentes con las URLs de las imágenes
    const updates = [
      {
        id: 1,
        partidoId: 101,
        numero: 10,
        imagenUrl: '/src/assets/Lista 1.jpg'
      },
      {
        id: 2,
        partidoId: 101,
        numero: 11,
        imagenUrl: '/src/assets/Lista 02.png'
      },
      {
        id: 3,
        partidoId: 102,
        numero: 20,
        imagenUrl: '/src/assets/Lista 20.png'
      }
    ];

    for (const update of updates) {
      const [result] = await connection.execute(
        'UPDATE Lista SET imagen_url = ? WHERE ID = ? AND FK_Partido_politico_ID = ?',
        [update.imagenUrl, update.id, update.partidoId]
      );
      console.log(`Lista ${update.numero} actualizada: ${result.affectedRows} filas afectadas`);
    }

    // Agregar nuevas listas para usar todas las imágenes disponibles
    const newListas = [
      {
        id: 4,
        partidoId: 101,
        numero: 4,
        integrantes: 'Integrante 7, Integrante 8',
        organo: 'Nacional',
        orden: 3,
        imagenUrl: '/src/assets/Lista 04.png'
      },
      {
        id: 5,
        partidoId: 102,
        numero: 42,
        integrantes: 'Integrante 9, Integrante 10',
        organo: 'Departamental',
        orden: 2,
        imagenUrl: '/src/assets/Lista 42.png'
      }
    ];

    for (const lista of newListas) {
      try {
        const [result] = await connection.execute(
          'INSERT INTO Lista (ID, FK_Partido_politico_ID, numero, integrantes, organo, orden, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [lista.id, lista.partidoId, lista.numero, lista.integrantes, lista.organo, lista.orden, lista.imagenUrl]
        );
        console.log(`Nueva lista ${lista.numero} agregada: ${result.affectedRows} filas afectadas`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`Lista ${lista.numero} ya existe, actualizando imagen...`);
          await connection.execute(
            'UPDATE Lista SET imagen_url = ? WHERE ID = ? AND FK_Partido_politico_ID = ?',
            [lista.imagenUrl, lista.id, lista.partidoId]
          );
        } else {
          throw error;
        }
      }
    }

    // Verificar las actualizaciones
    const [listas] = await connection.execute(
      'SELECT ID, numero, FK_Partido_politico_ID, imagen_url FROM Lista ORDER BY FK_Partido_politico_ID, numero'
    );

    console.log('\n=== LISTAS ACTUALIZADAS ===');
    listas.forEach(lista => {
      console.log(`Lista ${lista.numero} (ID: ${lista.ID}, Partido: ${lista.FK_Partido_politico_ID}): ${lista.imagen_url}`);
    });

    console.log('\n✅ Base de datos actualizada exitosamente');

  } catch (error) {
    console.error('❌ Error actualizando la base de datos:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

updateListaImages(); 