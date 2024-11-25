// Archivo: mysqlService.js
class MySQLService {
    constructor(pool) {
        this.pool = pool;
        this.isConnected = !!pool;
    }

    async getParametro(nombre) {
        try {
            if (!this.isConnected) return null;
            const [rows] = await this.pool.query(
                'SELECT valor FROM bingo_parametros WHERE nombre = ?', 
                [nombre]
            );
            return rows.length > 0 ? rows[0].valor : null;
        } catch (error) {
            console.log('Error al obtener parámetro:', error.message);
            return null;
        }
    }

    async registrarConexion(ip, expiresAt) {
        try {
            if (!this.isConnected) return false;
            await this.pool.query(
                'INSERT INTO bingo_conexiones (ip, created_at, expires_at) VALUES (?, NOW(), ?)',
                [ip, expiresAt]
            );
            return true;
        } catch (error) {
            console.error('Error al registrar conexión:', error.message);
            return false;
        }
    }

    async registrarTimeStart(fecha) {
        try {
            if (!this.isConnected) return false;
            await this.pool.query(
                'INSERT INTO bingo_time_starts (fecha) VALUES (?)',
                [fecha]
            );
            return true;
        } catch (error) {
            console.error('Error al registrar time start:', error.message);
            return false;
        }
    }

    async limpiarRegistros() {
        try {
            if (!this.isConnected) return false;
            await this.pool.query('DELETE FROM bingo_conexiones WHERE expires_at < NOW()');
            return true;
        } catch (error) {
            console.error('Error al limpiar registros:', error.message);
            return false;
        }
    }
}

module.exports = MySQLService;