const jwt = require('jsonwebtoken');


module.exports = app => {

   app.verificarToken = (req, res, next) => {
        let token = req.cookies.token || req.get('token');
        
    
        jwt.verify(token, app.libs.config.SEED_TOKEN, { ignoreExpiration: true},(err, decode) => {
    
            if(err){
                return res.status(401).json({
                    OK: false,
                    msg: 'Token no valido'
                });
            }
        
            req.usuario = decode.usuario;
    
            next();
    
        })
    }

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



