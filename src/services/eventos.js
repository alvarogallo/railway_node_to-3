require('dotenv').config();
const moment = require('moment-timezone');
const fetch = require('node-fetch');

const TIMEZONE = 'America/Bogota';
moment.tz.setDefault(TIMEZONE);



class EventosService {
    constructor() {
        let baseUrl = process.env.SOCKET_URL_V2;
        if (!baseUrl.startsWith('https://')) {
            baseUrl = 'https://' + baseUrl;
        }
        this.socketUrl = `${baseUrl}/enviar-mensaje`;
        this.socketCanal = process.env.SOCKET_CANAL_V2;
        this.socketToken = process.env.SOCKET_TOKEN_V2;
    
        console.log('\n=== Socket Config ===');
        console.log('URL:', this.socketUrl);
        console.log('Canal:', this.socketCanal);
        console.log('Token:', this.socketToken);
        console.log('===================\n');
    }

    async emitirEvento(tipo, nombreEvento, fecha, mensaje = null) {
        try {
            const fechaFormateada = this.formatearFecha(fecha);
            
            const data = {
                canal: this.socketCanal,
                token: this.socketToken,
                evento: nombreEvento,
                mensaje: mensaje || {
                    fecha_bingo: fechaFormateada,
                    timestamp: moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                    zonaHoraria: TIMEZONE
                }
            };

            console.log('Enviando evento:', {
                evento: nombreEvento,
                mensaje: data.mensaje
            });

            const response = await fetch(this.socketUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (response.ok) {
                console.log('✅ Evento enviado:', nombreEvento);
                return true;
            } else {
                throw new Error(`Error: ${responseData.mensaje || 'Error desconocido'}`);
            }

        } catch (error) {
            console.error('❌ Error al emitir evento:', error.message);
            return false;
        }
    }

    formatearFecha(fecha) {
        return moment(fecha).tz(TIMEZONE).format('YYYY-MM-DD_HH:mm');
    }
}

module.exports = new EventosService();