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
        ambienteTimer.reset();
        res.json({ message: 'Ambiente reseteado correctamente' });
    });

    return router;
}

module.exports = setupApiRoutes;