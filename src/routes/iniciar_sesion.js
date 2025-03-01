const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

module.exports = app => {
    const Usuario = app.database.models.Usuarios;

    app.post('/auth/login', (req, res) => {
        let body = req.body;                
        Usuario.scope('withPassword').findOne({
            where: {
                nombre_usuario: body.nombre_usuario,
                status: 'A'
            }
        }).then(result => {
            

            if(!result || !bcrypt.compareSync(body.contrasena, result.dataValues.contrasena)){
                return res.status(400).json({
                    OK: false,
                    msg: 'Usuario o contraseña incorrecto'
                });
            }

            delete result.dataValues.contrasena;

            let token = jwt.sign({
                usuario: result.dataValues  
            }, app.libs.config.SEED_TOKEN, {expiresIn: app.libs.config.CADUCIDAD_TOKEN});

            return res.json({
                OK: true,
                usuario: result,
                token
            });           
            

        }).catch(err => {
            return res.status(412).json({
                OK: false,
                msg: err.message
            });
        });

    });

}