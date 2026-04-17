const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


module.exports = app => {

    const Usuario = app.database.models.Usuarios;

    app.verificarToken = async (req, res, next) => {

        let token = req.cookies.token || req.get('token');
        const authHeader = req.headers.authorization;

        // console.log('Token:', token);
        // console.log('Authorization Header:', authHeader);
        if(!token && !authHeader){
            return res.status(401).json({ error: 'Se requiere autenticación' });
        }

        if(authHeader) {
            const base64Credentials = authHeader.split(' ')[1];
            const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
            const [nombre_usuario, contrasena] = decodedCredentials.split(':');

            const user = await Usuario.scope('withPassword').findOne({
                where: {
                    nombre_usuario: nombre_usuario,
                    status: 'A'
                },
                attributes: ['nombre_usuario', 'contrasena']
            });

            if (!user || !bcrypt.compareSync(contrasena, user.dataValues.contrasena)) {
                return res.status(401).json({ error: 'Se requiere autenticación' });
            }
        }

        if(token){
            jwt.verify(token, process.env.SEED_TOKEN || app.libs.config.SEED_TOKEN, { ignoreExpiration: true }, (err, decode) => {
                if(err) {
                    return res.status(401).json({
                        OK: false,
                        msg: 'Token no valido'
                    });
                }
                req.usuario = decode.usuario;
            });
        }

        next();
    }

    // app.verificarUsuario = async (req, res, next) => {
    //     const authHeader = req.headers.authorization;
    //     if (!authHeader) {
    //         res.setHeader('WWW-Authenticate', 'Basic realm="Acceso Restringido"');
    //         return res.status(401).json({ error: 'Se requiere autenticación' });
    //     }

    //     const base64Credentials = authHeader.split(' ')[1];
    //     const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    //     const [nombre_usuario, contrasena] = decodedCredentials.split(':');

    //     const user = await Usuario.scope('withPassword').findOne({
    //         where: {
    //             nombre_usuario: nombre_usuario,
    //             status: 'A'
    //         },
    //         attributes: ['nombre_usuario', 'contrasena']
    //     });

    //     if (!user || !bcrypt.compareSync(contrasena, user.dataValues.contrasena)) {
    //         return res.status(401).json({ error: 'Se requiere autenticación' });
    //     }

    //     next();
    // }

    app.verificarAdmin_Role = (req, res, next) => {        
        
        
        if(req.usuario.role !== 'admin'){
            return res.status(401).json({
                OK: true,
                err:{
                    message: 'Usuario no autorizado'
                }
            });
        }  
            
        
        next();
    
    }

    return app;

}



