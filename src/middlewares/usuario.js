module.exports = app => {
    
    const Usuario = app.database.models.Usuarios;
    const Sequelize = app.database.Sequelize;
    const Op = Sequelize.Op;

    app.UniqueUsuarioInsert = async (req, res, next) => {    
        
        let usuario = await Usuario.findOne({ 
            where: Sequelize.and({
                status: 'A'
            }, 
            Sequelize.or({
                nombre_usuario: req.body.nombre_usuario
            }))
        });

        if(usuario) {
            return res.status(422).json({
                OK: false,
                msg: {
                    error: {
                        fields:{
                            nombre_usuario: req.body.nombre_usuario
                        }
                    }
                }
            });
        }        

        next();
    }

    app.UniqueUsuarioUpdate = async (req, res, next) => {    
        
        let usuario = await Usuario.findOne({ 
            where: Sequelize.and({
                status: 'A',
                id_usuario: {
                    [Op.ne]: req.params.id
                }
            }, 
            Sequelize.or({
                nombre_usuario: req.body.nombre_usuario
            }))
        });

        if(usuario) {
            return res.status(422).json({
                OK: false,
                msg: {
                    error: {
                        fields:{
                            nombre_usuario: req.body.nombre_usuario
                        }
                    }
                }
            });
        }        

        next();
    }


    return app;
}