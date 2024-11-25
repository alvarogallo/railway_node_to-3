const express = require('express');
const router = express.Router();

function getClientIP(req) {
    return req.ip || req.connection.remoteAddress || 'unknown';
}

function setupApiRoutes(ambienteTimer) {
    // GET: Inicializar o actualizar ambiente
    router.get('/', (req, res) => {
        const clientIP = getClientIP(req);
        
        if (!ambienteTimer.createdAt) {
            ambienteTimer.initialize(clientIP);
        } else {
            ambienteTimer.addConexion(clientIP);
        }
        
        res.json(ambienteTimer.getStatus());
    });

    // Nueva ruta api_nums  es /api/api_nums
    router.get('/api_nums', (req, res) => {
        const { bingoService } = ambienteTimer;
        if (!bingoService || !bingoService.isRunning) {
            return res.json({
                start_time: null,
                numbers: []
            });
        }

        res.json({
            start_time: moment(bingoService.startTime).format('YYYY-MM-DD HH:mm:ss'),
            numbers: bingoService.usedNumbers.map((num, index) => ({
                sec: index + 1,
                num: num
            }))
        });
    });    

    // GET: Obtener solo los puntos de arranque
    router.get('/time-starts', (req, res) => {
        if (!ambienteTimer.createdAt) {
            res.json({
                error: "Ambiente no inicializado",
                currentTime: new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                timeStarts: []
            });
        } else {
            res.json(ambienteTimer.getTimeStarts());
        }
    });

    // GET: Reiniciar ambiente
    router.get('/reset', (req, res) => {
        //ambienteTimer.reset();
        res.json({ message: 'Ambiente reseteado correctamente, (desabilitada la opcion por seguridad)' });
    });

    return router;
}

module.exports = setupApiRoutes;