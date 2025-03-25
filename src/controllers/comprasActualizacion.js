const moment = require('moment');

module.exports = app => {

    const comprasActualizacion = app.database.models.Compras_actualizacion;
    const CambioEstatusRefaccion = app.database.models.Cambio_estatus_refaccion;
    const refaccionSolicitada = app.database.models.Refaccion_solicitada;

    app.actualizacionCompras = async (req, res) => {
        let data = req.body.data;
        const pasarAPorRecepcion = req.body.pasarARecepcion;
        
        if(data.autorizacion_compras){
            data.fecha_autorizacion_compras =  moment().format('YYYY-MM-DD HH:mm:ss')
        }
        
        if(data.autorizacion_ci){
            data.autorizacion_ci = moment().format('YYYY-MM-DD HH:mm:ss')
        }

        try {
            const actualizacion = await comprasActualizacion.upsert(data, {
                returning: true,
                conflictFields: ['id_compras_actualizacion']
            });
            
            if(pasarAPorRecepcion){
                await refaccionSolicitada.update(
                    {
                        estatus: 'pte_recepcion_ac'
                    },
                    {
                        where: {
                            id_refaccion_solicitada: data.id_refaccion_solicitada
                        }
                    }
                )
                await CambioEstatusRefaccion.create({
                  id_refaccion_solicitada: data.id_refaccion_solicitada,
                  estatus: 'pte_recepcion_ac',
                  fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
                });
            }
            
            return res.json({
                OK: true,
                msg: actualizacion
            });
        } catch (error) {
            console.error('Error en ActualizarSolicitud:', error);
            return res.json(error);
        }
    }

    return app;
}