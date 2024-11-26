const EventosService = require('./eventos');
const moment = require('moment-timezone');

class BingoService {
    constructor() {
        console.log('Inicializando BingoService...');
        this.numbers = Array.from({ length: 75 }, (_, i) => i + 1);
        this.usedNumbers = [];
        this.currentInterval = null;
        this.isRunning = false;
        this.startTime = null;
        this.formatoEvento = null;
        this.intervaloSegundos = 20;
        this.pool = null;
        this.nextNumberTimeout = null;
    }

    setPool(pool) {
        this.pool = pool;
        console.log('Pool MySQL configurado en BingoService');
    }

    setIntervalo(segundos) {
        if (typeof segundos === 'number' && segundos > 0) {
            this.intervaloSegundos = segundos;
            console.log(`Intervalo de bingo actualizado a ${segundos} segundos`);
        }
    }

    shuffle() {
        for (let i = this.numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.numbers[i], this.numbers[j]] = [this.numbers[j], this.numbers[i]];
        }
    }

    getNextNumber() {
        if (this.numbers.length === 0) {
            console.log('❌ No hay más números disponibles');
            this.stop();
            return null;
        }
        const number = this.numbers.pop();
        this.usedNumbers.push(number);
        return number;
    }

    async emitirNumero(numero, secuencia, fecha) {
        try {
            const nombreEvento = this.formatoEvento || 'Bingo_error';
            const mensaje = {
                num: numero,
                sec: secuencia,
                hora: moment(fecha).format('HH:mm:ss')
            };

            await EventosService.emitirEvento(
                'Bingo',
                nombreEvento,
                fecha,
                mensaje
            );
        } catch (error) {
            console.error('Error al emitir número:', error);
        }
    }

    async start(fechaInicio = new Date()) {
        if (this.isRunning) {
            console.log('El bingo ya está en curso');
            return;
        }
    
        this.startTime = fechaInicio;
        this.formatoEvento = `Bingo_${moment(fechaInicio).format('YYYYMMDD_HHmm')}`;
        
    
        console.log('\n=== NUEVO BINGO INICIADO ===');
        console.log('Formato de evento:', this.formatoEvento);
        console.log(`Intervalo configurado: ${this.intervaloSegundos} segundos`);
    
        this.numbers = Array.from({ length: 75 }, (_, i) => i + 1);
        this.usedNumbers = [];
        this.shuffle();
        this.isRunning = true;

        // Programar el primer número
        this.scheduleNextNumber();
    }

    async scheduleNextNumber() {
        if (!this.isRunning) return;

        const number = this.getNextNumber();
        if (!number) {
            await this.stop();
            return;
        }

        console.log(`\n🎲 Número ${number} (${this.usedNumbers.length}/75)`);
        console.log(`Números usados: ${this.usedNumbers.join(', ')}`);
        console.log(`Próximo número en ${this.intervaloSegundos} segundos`);
        
        try {
            await this.emitirNumero(number, this.usedNumbers.length, new Date());
        } catch (error) {
            console.error('Error al emitir número:', error);
        }

        // Programar el siguiente número
        this.nextNumberTimeout = setTimeout(() => {
            this.scheduleNextNumber();
        }, this.intervaloSegundos * 1000);
    }

    async stop() {
        if (this.nextNumberTimeout) {
            clearTimeout(this.nextNumberTimeout);
            this.nextNumberTimeout = null;
        }

        if (this.isRunning) {
            // Guardar en la base de datos
            if (this.pool && this.formatoEvento && this.usedNumbers.length > 0) {
                try {
                    const numerosStr = this.usedNumbers.join(',');
                    await this.pool.execute(
                        'INSERT INTO bingo_bingos (evento, numeros) VALUES (?, ?)',
                        [this.formatoEvento, numerosStr]
                    );
                    console.log('✅ Bingo guardado en base de datos:', this.formatoEvento);
                } catch (error) {
                    console.error('❌ Error al guardar bingo en base de datos:', error);
                }
            }

            this.isRunning = false;
            this.startTime = null;
            this.formatoEvento = null;
            
            console.log('\n=== BINGO FINALIZADO ===');
            console.log(`Total números generados: ${this.usedNumbers.length}`);
            console.log(`Números utilizados: ${this.usedNumbers.join(', ')}`);
        }
    }
}


const bingoService = new BingoService();
console.log('BingoService creado y exportado');
module.exports = bingoService;