const path = require('path');
const express = require('express');

function setupWebRoutes(app, pool) {
    // Servir archivos estáticos desde la carpeta public
    app.use(express.static(path.join(__dirname, '../public')));

    // Ruta para crear las tablas si no existen
    app.get('/setup-db', async (req, res) => {
        if (!pool) {
            return res.json({ error: 'No hay conexión a la base de datos' });
        }

        try {
            // Crear tabla parametros si no existe
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS bingo_parametros (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL UNIQUE,
                    valor VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Verificar si existe el parámetro segundos
            const [rows] = await pool.execute('SELECT * FROM bingo_parametros WHERE nombre = ?', ['segundos']);
            if (rows.length === 0) {
                await pool.execute(
                    'INSERT INTO bingo_parametros (nombre, valor) VALUES (?, ?)',
                    ['segundos', '20']
                );
                console.log('Parámetro segundos creado con valor por defecto: 20');
            }

            // Crear tabla bingos si no existe
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS bingo_bingos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    evento VARCHAR(32) NOT NULL,
                    numeros VARCHAR(256) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            res.json({ 
                success: true, 
                message: 'Tablas verificadas/creadas con éxito'
            });

        } catch (error) {
            console.error('Error en setup-db:', error);
            res.status(500).json({ 
                error: 'Error al configurar la base de datos', 
                details: error.message
            });
        }
    });

    // Ruta para verificar la tabla bingos
    app.get('/check-bingos', async (req, res) => {
        if (!pool) {
            return res.json({ error: 'No hay conexión a la base de datos' });
        }

        try {
            const [columns] = await pool.query('SHOW COLUMNS FROM bingos');
            const [data] = await pool.query('SELECT * FROM bingo_bingos ORDER BY id DESC LIMIT 10');
            
            res.json({
                estructura: columns,
                ultimos_registros: data
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al verificar tabla bingos',
                details: error.message 
            });
        }
    });

    // Ruta para obtener la estructura de las tablas
    app.get('/tables-info', async (req, res) => {
        if (!pool) {
            return res.json({ error: 'No hay conexión a la base de datos' });
        }

        try {
            // Primero, obtener todas las tablas
            const [tablas] = await pool.query(`
                SHOW TABLES
            `);
            
            const tableStructure = {};
            
            // Para cada tabla, obtener su estructura
            for (const tabla of tablas) {
                const tableName = tabla[`Tables_in_${process.env.MYSQL_DATABASE}`];
                
                const [columns] = await pool.query(`
                    SHOW COLUMNS FROM ${tableName}
                `);
                
                tableStructure[tableName] = columns.map(column => ({
                    name: column.Field,
                    type: column.Type,
                    nullable: column.Null,
                    key: column.Key,
                    extra: column.Extra
                }));
            }

            console.log('Estructura encontrada:', tableStructure);
            res.json(tableStructure);

        } catch (error) {
            console.error('Error en tables-info:', error);
            res.status(500).json({ 
                error: 'Error al obtener información de las tablas',
                details: error.message 
            });
        }
    });

    // app.get('/recreate-bingos', async (req, res) => {
    //     if (!pool) {
    //         return res.json({ error: 'No hay conexión a la base de datos' });
    //     }

    //     try {
    //         console.log('1. Eliminando tabla bingos...');
    //         await pool.execute('DROP TABLE IF EXISTS bingos');

    //         console.log('2. Creando nueva tabla bingos...');
    //         await pool.execute(`
    //             CREATE TABLE bingos (
    //                 id INT AUTO_INCREMENT PRIMARY KEY,
    //                 evento VARCHAR(50) NOT NULL,
    //                 numeros VARCHAR(256) NOT NULL,
    //                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    //         `);

    //         console.log('3. Tabla bingos recreada exitosamente');
    //         res.json({ 
    //             success: true, 
    //             message: 'Tabla bingos recreada con éxito'
    //         });

    //     } catch (error) {
    //         console.error('Error al recrear tabla bingos:', error);
    //         res.status(500).json({ 
    //             error: 'Error al recrear tabla', 
    //             details: error.message
    //         });
    //     }
    // });

    app.get('/setup-db', async (req, res) => {
        if (!pool) {
            return res.json({ error: 'No hay conexión a la base de datos' });
        }

        try {
            // Crear tabla parametros si no existe
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS bingo_parametros (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL UNIQUE,
                    valor VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Verificar si existe el parámetro segundos
            const [rows] = await pool.execute('SELECT * FROM bingo_parametros WHERE nombre = ?', ['segundos']);
            if (rows.length === 0) {
                await pool.execute(
                    'INSERT INTO bingo_parametros (nombre, valor) VALUES (?, ?)',
                    ['segundos', '20']
                );
                console.log('Parámetro segundos creado con valor por defecto: 20');
            }

            // Eliminar tabla bingos si existe y crear nueva con VARCHAR más largo
            await pool.execute('DROP TABLE IF EXISTS bingo_bingos');
            await pool.execute(`
                CREATE TABLE bingo_bingos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    evento VARCHAR(50) NOT NULL,
                    numeros VARCHAR(256) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            res.json({ 
                success: true, 
                message: 'Tablas verificadas/creadas con éxito'
            });

        } catch (error) {
            console.error('Error en setup-db:', error);
            res.status(500).json({ 
                error: 'Error al configurar la base de datos', 
                details: error.message
            });
        }
    });

    // Ruta adicional para verificar directamente la tabla parametros
    app.get('/check-parametros', async (req, res) => {
        if (!pool) {
            return res.json({ error: 'No hay conexión a la base de datos' });
        }

        try {
            const [columns] = await pool.query('SHOW COLUMNS FROM parametros');
            const [data] = await pool.query('SELECT * FROM parametros');
            
            res.json({
                estructura: columns,
                datos: data
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al verificar tabla parametros',
                details: error.message 
            });
        }
    });
}

module.exports = setupWebRoutes;