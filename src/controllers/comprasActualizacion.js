const moment = require('moment');

module.exports = app => {

    const comprasActualizacion = app.database.models.Compras_actualizacion;
    const CambioEstatusRefaccion = app.database.models.Cambio_estatus_refaccion;
    const refaccionSolicitada = app.database.models.Refaccion_solicitada;

    app.actualizacionCompras = async (req, res) => {
        let data = req.body.data;
        const pasarAPorRecepcion = req.body.pasarARecepcion;
        const pasarAEntregaDirecta = req.body .pasarAEntregaDirecta;
        
        if(data.autorizacion_compras){
            data.fecha_autorizacion_compras =  moment().format('YYYY-MM-DD HH:mm:ss')
        }
        
        if(data.autorizacion_ci){
            data.autorizacion_ci = moment().format('YYYY-MM-DD HH:mm:ss')
        }
        
        try {
            
            if(data.orden_compra){
    
                const check = await comprasActualizacion.findOne({
                    where: {
                        id_compras_actualizacion: data.id_compras_actualizacion
                    }
                })
    
                if(check.orden_compra === null){
                    data.fecha_oc = moment().format('YYYY-MM-DD HH:mm:ss')   
                }
            }

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

            if(pasarAEntregaDirecta){
                await refaccionSolicitada.update(
                    {
                        estatus: 'por_recibir_ai'
                    },
                    {
                        where: {
                            id_refaccion_solicitada: data.id_refaccion_solicitada
                        }
                    }
                )
                await CambioEstatusRefaccion.create({
                  id_refaccion_solicitada: data.id_refaccion_solicitada,
                  estatus: 'por_recibir_ai',
                  fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
                });
            }
            
            return res.json({
                OK: true,
                result: actualizacion
            });
        } catch (error) {
            console.error('Error en ActualizarSolicitud:', error);
            return res.json(error);
        }
    }

    app.solicitarInformacionAdicional = async (req, res) => {

        const informacionSolicitada = req.body.informacion_adicional_solicitada;
        const id_refaccion_solicitada = req.body.id_refaccion_solicitada;

        try {
            const solicitudActualizada = await refaccionSolicitada.update(
                {
                    informacion_adicional_solicitada: informacionSolicitada,
                    estatus: 'informacion_adicional_solicitada'
                },
                {
                    where:{
                        id_refaccion_solicitada: id_refaccion_solicitada
                    }
                }
            );

            await CambioEstatusRefaccion.create({
                id_refaccion_solicitada: id_refaccion_solicitada,
                estatus: 'informacion_adicional_solicitada',
                fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
            });

            return res.json({
                OK: true,
                result: solicitudActualizada
            });
        } catch (error) {
            console.error('Error en solicitarInformacionAdicional:', error);
            return res.json(error);
        }
    }

    app.informacionAdicionalOtorgada = async (req, res) => {

        const informacionOtorgada = req.body.informacion_adicional_otorgada;
        const id_refaccion_solicitada = req.body.id_refaccion_solicitada;

        try {
            const solicitudActualizada = await refaccionSolicitada.update(
                {
                    informacion_adicional_otorgada: informacionOtorgada,
                    estatus: 'en_proceso_compras'
                },
                {
                    where:{
                        id_refaccion_solicitada: id_refaccion_solicitada
                    }
                }
            );

            await CambioEstatusRefaccion.create({
                id_refaccion_solicitada: id_refaccion_solicitada,
                estatus: 'en_proceso_compras',
                fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
            });

            return res.json({
                OK: true,
                result: solicitudActualizada
            });
        } catch (error) {
            console.error('Error en solicitarInformacionAdicional:', error);
            return res.json(error);
        }
    }

    return app;
}