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



  

 

    isConnected() {
        return this.isConnected;
    }
}

module.exports = MySQLService;