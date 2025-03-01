//variables de entorno
module.exports = {
    database: process.env.DATABASE || 'solicitud_refacciones',
    username: process.env.USER_DATABASE || 'dev',
    password: process.env.PASSWORD_DATABASE || 'Develop123',   
    options:{        
        host: process.env.HOST_DATABASE ||'localhost',
        dialect: process.env.DIALECT || 'mysql',
        port: process.env.PORT_DATABASE || '3306',
        dialectOptions: {
            dateStrings: true,
            typeCast: true
        },
        timezone: '-07:00',
        pool: {
            max: 20,
            idle: 30000
        }
    },
    SEED_TOKEN: process.env.SEED_TOKEN || 'MTTOTLEA',
    CADUCIDAD_TOKEN: process.env.CADUCIDAD_TOKEN || '48h',
    correoOpciones: {
        correo_electronico: process.env.EMAIL || 'test@gmail.com',
        contrasena_correo: process.env.PASSWORD_EMAIL || 'test1',
        servicio: process.env.SERVICE_EMAIL ||'Hotmail'
    }
    
};