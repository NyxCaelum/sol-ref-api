const moment = require('moment');

module.exports = app => {

    const comprasActualizacion = app.database.models.Compras_actualizacion;
    const CambioEstatusRefaccion = app.database.models.Cambio_estatus_refaccion;
    const refaccionSolicitada = app.database.models.Refaccion_solicitada;

    app.actualizacionCompras = async (req, res) => {
        const t = await app.database.sequelize.transaction();
        try {
          const data = { ...req.body.data };
          const { pasarARecepcion, pasarAEntregaDirecta } = req.body;
      
          let registro = await comprasActualizacion.findOne({
            where: { id_refaccion_solicitada: data.id_refaccion_solicitada },
            transaction: t,
          });
      
          if (data.autorizacion_compras) {
            if (!registro || registro.fecha_autorizacion_compras === null) {
              data.fecha_autorizacion_compras = moment().format('YYYY-MM-DD HH:mm:ss');
            }
          }
          if (data.autorizacion_ci) {
            if (!registro || registro.fecha_autorizacion_ci === null) {
              data.fecha_autorizacion_ci = moment().format('YYYY-MM-DD HH:mm:ss');
            }
          }
          if (data.orden_compra) {
            if (!registro || registro.orden_compra === null) {
              data.fecha_oc = moment().format('YYYY-MM-DD HH:mm:ss');
            }
          }
      
          if (registro) {
            await comprasActualizacion.update(data, {
              where: { id_compras_actualizacion: data.id_compras_actualizacion },
              transaction: t,
            });
          } else {
            registro = await comprasActualizacion.create(data, { transaction: t });
          }
      
          if (pasarARecepcion) {
            await refaccionSolicitada.update(
              { estatus: 'pte_recepcion_ac' },
              {
                where: { id_refaccion_solicitada: data.id_refaccion_solicitada },
                transaction: t,
              }
            );
            await CambioEstatusRefaccion.create({
              id_refaccion_solicitada: data.id_refaccion_solicitada,
              estatus: 'pte_recepcion_ac',
              fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
            }, { transaction: t });
          }
      
          if (pasarAEntregaDirecta) {
            await refaccionSolicitada.update(
              { estatus: 'por_recibir_ai' },
              {
                where: { id_refaccion_solicitada: data.id_refaccion_solicitada },
                transaction: t,
              }
            );
            await CambioEstatusRefaccion.create({
              id_refaccion_solicitada: data.id_refaccion_solicitada,
              estatus: 'por_recibir_ai',
              fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
            }, { transaction: t });
          }
      
          await t.commit();
          return res.json({ OK: true, result: registro });
        } catch (error) {
          await t.rollback();
          console.error('Error en actualizacionCompras:', error);
          return res.status(500).json({ OK: false, error: error.message });
        }
      };

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