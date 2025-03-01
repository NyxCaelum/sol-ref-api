module.exports = app => {

    const LOGS = app.database.models.ADMLOGS;

    app.addLog = (req, res) => {
        let log = new LOGS({ 
            nombre_tabla: req.body.nombre_tabla,
            nombre_objeto: req.body.nombre_objeto,
            id_objeto: req.body.id_objeto,
            tipo_transaccion: req.body.tipo_transaccion,
            descripcion: req.body.descripcion,
            nombre: req.body.nombre,
            usuario: req.body.usuario,
            publicIP: req.body.publicIP,
            privateIP: req.body.privateIP,
            navegator: req.body.navegator,
            fecha_creacion: req.body.fecha_creacion
        });        

        //poner mac id del disposituvo
    
        LOGS.create(log.dataValues, {
            fields: ['nombre_tabla', 'nombre_objeto', 'id_objeto', 'tipo_transaccion', 'descripcion', 'nombre', 'usuario', 'publicIP', 'privateIP', 'navegator', 'fecha_creacion']
        })
        .then(result => {                       
            res.json({
                OK: true,
                Log: result
            });
        })
        .catch(err => {            
            res.status(412).json({
                OK: false,
                msg: err
            });
        });        
    }

    return app;
}