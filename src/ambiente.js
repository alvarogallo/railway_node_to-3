const MySQLService = require('./services/mysqlService');
const EventosService = require('./services/eventos');
const bingoService = require('./services/bingoService');

class AmbienteTimer {
    constructor() {
        this.conexiones = 0;
        this.createdAt = null;
        this.expiresAt = null;
        this.timer = null;
        this.hoursToLive = 1;
        this.conexionesActivas = new Set();
        this.timeStarts = [];
        this.startTimers = [];
        this.intervalo = 30;
        this.mysqlService = null;
        this.bingoService = bingoService;

        // Verificar que el servicio de bingo se inicializó correctamente
        if (!this.bingoService) {
            console.error('⚠️ Error: bingoService no se inicializó correctamente');
        } else {
            console.log('✅ BingoService inicializado correctamente');
        }
    }

    async setMySQLConnection(pool) {
        this.mysqlService = new MySQLService(pool);
        if (this.bingoService) {
            this.bingoService.setPool(pool); 
            console.log('Pool MySQL configurado en BingoService desde AmbienteTimer');
        }
        if (this.mysqlService.isConnected) {
            await this.loadParameters();
        }
    }

    async loadParameters() {
        try {
            // Cargar intervalo de minutos
            const intervalo = await this.mysqlService.getParametro('intervalo');
            if (intervalo) {
                this.intervalo = parseInt(intervalo);
                console.log(`Intervalo cargado de la base de datos: ${this.intervalo} minutos`);
            }
    
            // Cargar segundos para el bingo
            const segundos = await this.mysqlService.getParametro('segundos');
            if (segundos && this.bingoService) {
                const segundosNum = parseInt(segundos);
                this.bingoService.setIntervalo(segundosNum);
                console.log(`Segundos para bingo cargados de la base de datos: ${segundosNum} segundos`);
            } else {
                console.log('Usando valor por defecto de 20 segundos para el bingo');
            }
        } catch (error) {
            console.log('Error al cargar parámetros:', error.message);
        }
    }

    getLocalDate(date = new Date()) {
        return new Date(date);
    }

    formatDateTime(date) {
        if (!date) return null;
        return date.toLocaleString('es-CO', {
            timeZone: 'America/Bogota'
        });
    }

    formatTimeShort(date) {
        return date.toLocaleTimeString('es-CO', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    async initialize(ip) {
        if (!this.createdAt) {
            this.createdAt = new Date();
            this.conexiones = 1;
            this.conexionesActivas.add(ip);
            this.updateExpirationTime();
            this.calculateTimeStarts();
            this.setTimer();
            
            if (this.mysqlService?.isConnected) {
                await this.mysqlService.registrarConexion(ip, this.expiresAt);
            }
            
            console.log(`Primera conexión desde ${ip}. Ambiente inicializado.`);
        }
    }

    async addConexion(ip) {
        if (!this.conexionesActivas.has(ip)) {
            this.conexiones += 1;
            this.conexionesActivas.add(ip);
            this.updateExpirationTime();
            this.setTimer();

            if (this.mysqlService?.isConnected) {
                await this.mysqlService.registrarConexion(ip, this.expiresAt);
            }

            console.log(`Nueva conexión desde ${ip}. Total conexiones: ${this.conexiones}`);
        } else {
            this.updateExpirationTime();
            this.setTimer();
            console.log(`Conexión existente desde ${ip}. Extendiendo tiempo.`);
        }
    }

    calculateTimeStarts() {
        const now = new Date();
        let nextPoints = [];
    
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const nextIntervalMinutes = Math.ceil(currentMinutes / this.intervalo) * this.intervalo;
    
        const firstPoint = new Date(now);
        firstPoint.setHours(Math.floor(nextIntervalMinutes / 60));
        firstPoint.setMinutes(nextIntervalMinutes % 60);
        firstPoint.setSeconds(0);
        firstPoint.setMilliseconds(0);
    
        const secondPoint = new Date(firstPoint);
        secondPoint.setMinutes(firstPoint.getMinutes() + this.intervalo);
    
        nextPoints = [firstPoint, secondPoint];
    
        this.timeStarts = nextPoints.map(date => {
            const localTime = this.formatTimeShort(date);
            return {
                time: localTime,
                name: date.toISOString().substring(0,10).replace(/-/g, '') + '_' + localTime.replace(':', ''),
                timestamp: date.getTime()
            };
        });

        // Configurar los timers
        this.timeStarts.forEach(point => {
            const timeUntilStart = point.timestamp - now.getTime();
            if (timeUntilStart > 0) {
                const timer = setTimeout(async () => {
                    try {
                        console.log(`=== HORA DE ARRANCAR (${point.time}) ===`);
                        
                        if (!this.bingoService) {
                            console.error('⚠️ Error: bingoService no está disponible');
                            return;
                        }

                        // Leer el parámetro segundos justo antes de iniciar el bingo
                        if (this.mysqlService?.isConnected) {
                            try {
                                const segundos = await this.mysqlService.getParametro('segundos');
                                if (segundos) {
                                    const segundosNum = parseInt(segundos);
                                    this.bingoService.setIntervalo(segundosNum);
                                    console.log(`Segundos actualizados de la BD: ${segundosNum}`);
                                } else {
                                    console.log('Usando valor por defecto: 20 segundos');
                                    this.bingoService.setIntervalo(20);
                                }
                            } catch (error) {
                                console.log('Error al leer segundos, usando valor por defecto:', error.message);
                                this.bingoService.setIntervalo(20);
                            }
                        }

                        if (this.bingoService.isRunning) {
                            console.log('⚠️ Ya hay un bingo en curso');
                        } else {
                            console.log('🎲 Iniciando nuevo bingo...');
                            this.bingoService.start();
                            
                            // Emitir evento de inicio de bingo
                            const fecha_bingo = new Date(point.timestamp);
                            const eventoEmitido = await EventosService.emitirEvento(
                                'Bingo',
                                'Inicia',
                                fecha_bingo
                            );
                            console.log('Resultado emisión:', eventoEmitido ? '✅ Enviado' : '❌ Falló');
                            if (this.mysqlService?.isConnected) {
                                await this.mysqlService.registrarTimeStart(fecha_bingo);
                            }
                        }
                    } catch (error) {
                        console.error('Error al iniciar bingo:', error);
                    }
                }, timeUntilStart);
                this.startTimers.push(timer);
            }
        });

        console.log('Puntos de arranque calculados:', this.timeStarts.map(t => t.time));
    }

    updateExpirationTime() {
        this.expiresAt = new Date(Date.now() + (this.hoursToLive * 60 * 60 * 1000));
        this.calculateTimeStarts();
    }

    setTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.reset();
            console.log('Ambiente reseteado por timeout');
        }, this.hoursToLive * 60 * 60 * 1000);
    }

    async reset() {
        if (this.mysqlService?.isConnected) {
            await this.mysqlService.limpiarRegistros();
        }
        
        // Detener el bingo si está en curso
        if (this.bingoService) {
            this.bingoService.stop();
        }
        
        this.startTimers.forEach(timer => clearTimeout(timer));
        this.startTimers = [];
        this.conexiones = 0;
        this.createdAt = null;
        this.expiresAt = null;
        this.timer = null;
        this.conexionesActivas.clear();
        this.timeStarts = [];
    }

    getStatus() {
        const now = new Date();
        
        // Obtenemos los números del bingo actual si está en curso
        const numerosActuales = this.bingoService ? 
            this.bingoService.usedNumbers.slice(-5) : // Últimos 5 números
            [];
            
        // Calculamos el tiempo restante en formato amigable
        //const timeUntilExpire = this.expiresAt ? 
        //    Math.max(0, Math.floor((this.expiresAt - now) / 1000 / 60)) : 0;
        const proximoTimeStart = this.timeStarts.length > 0 ? this.timeStarts[0] : null;
        const timeUntilNextSeconds = proximoTimeStart ? 
            Math.max(0, Math.floor((proximoTimeStart.timestamp - now.getTime()) / 1000)) : 0;
        
        const minutosRestantes = Math.floor(timeUntilNextSeconds / 60);
        const segundosRestantes = timeUntilNextSeconds % 60;


        return {
            conexiones: this.conexiones,
            createdAt: this.formatDateTime(this.createdAt),
            expiresAt: this.formatDateTime(this.expiresAt),
            tiempoRestante: {
                minutos: minutosRestantes,
                segundos: segundosRestantes,
                formato: `${Math.floor(minutosRestantes/60)}h ${minutosRestantes%60}m ${segundosRestantes}s`,
                totalSegundos: timeUntilNextSeconds
            },
            currentTime: this.formatTimeShort(now),
            timeStarts: this.timeStarts.map(point => ({
                time: point.time,
                name: point.name,
                secondsUntilStart: Math.max(0, Math.round((point.timestamp - now.getTime()) / 1000)),
                minutosRestantes: Math.ceil(Math.max(0, (point.timestamp - now.getTime()) / 1000 / 60))
            })),


            isActive: !!this.timer,
            bingoEnCurso: this.bingoService ? this.bingoService.isRunning : false,
            bingo: {
                totalNumeros: this.bingoService ? this.bingoService.usedNumbers.length : 0,
                ultimosNumeros: numerosActuales,
                numerosFaltantes: this.bingoService ? 
                    75 - this.bingoService.usedNumbers.length : 
                    75,
                porcentajeCompletado: this.bingoService ? 
                    Math.round((this.bingoService.usedNumbers.length / 75) * 100) : 
                    0,
                tiempoInicio: this.bingoService?.startTime ? 
                    this.formatDateTime(this.bingoService.startTime) : 
                    null
            },
            sistema: {
                conexion_mysql: !!this.mysqlService?.isConnected,
                intervalo_minutos: this.intervalo,
                intervalo_segundos: this.bingoService ? this.bingoService.intervaloSegundos : 20,
                memoria_usada: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                uptime_minutos: Math.floor(process.uptime() / 60)
            },
            conexionesActivas: {
                total: this.conexionesActivas.size,
                ips: Array.from(this.conexionesActivas)
            }
        };
    }

    getTimeStarts() {
        const now = new Date();
        return {
            currentTime: this.formatTimeShort(now),
            timeStarts: this.timeStarts.map(point => ({
                time: point.time,
                name: point.name,
                secondsUntilStart: Math.max(0, Math.round((point.timestamp - now.getTime()) / 1000))
            }))
        };
    }
}

module.exports = AmbienteTimer;