const fs = require('fs');
const path = require('path');

const moment = require('moment');


module.exports = app => {

    const comprasActualizacion = app.database.models.Compras_actualizacion;
    const CambioEstatusRefaccion = app.database.models.Cambio_estatus_refaccion;
    const refaccionSolicitada = app.database.models.Refaccion_solicitada;
    const Solicitud = app.database.models.Solicitud;

    function saveBase64FileDocumentosAdicionales(base64Data, id, numDoc) {
    
      const documentosPath = path.join(__dirname, '../../evidencias/adicionales');
    
      if (!fs.existsSync(documentosPath)) {
        fs.mkdirSync(documentosPath, { recursive: true });
      }
    
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Formato base64 inválido');
      }
    
      const DateFormated = moment().format('DD.MM.YYYY_hh.mm');
    
      const mimeType = matches[1];
      const extension = mimeType.split('/')[1];
    
      const buffer = Buffer.from(matches[2], 'base64');
      let filename = `${id}_${numDoc}_${DateFormated}.${extension}`;
      
      const filePath = path.join(documentosPath, filename);
      fs.writeFileSync(filePath, buffer);
      return filename;
    }

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

          const tipo_entrega = pasarARecepcion ? 1 : 2;

          await refaccionSolicitada.update(
            {
              estatus: 'pte_recepcion_ac',
              tipo_entrega: tipo_entrega
            },
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
        const id_solicitud = req.body.id_solicitud;

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

            await Solicitud.update(
              {
                estado: 0
              },
              {
                where:{
                    id_solicitud: id_solicitud
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
        const id_solicitud = req.body.id_solicitud;
        let documento_adicional_otorgado1 = req.body.documento_adicional_otorgado1;
        let documento_adicional_otorgado2 = req.body.documento_adicional_otorgado2;

        try {

          if(documento_adicional_otorgado1){
            documento_adicional_otorgado1 = saveBase64FileDocumentosAdicionales(documento_adicional_otorgado1, id_refaccion_solicitada, 1);
          }

          if(documento_adicional_otorgado2){
            documento_adicional_otorgado2 = saveBase64FileDocumentosAdicionales(documento_adicional_otorgado2, id_refaccion_solicitada, 2);
          }

          const solicitudActualizada = await refaccionSolicitada.update(
              {
                  informacion_adicional_otorgada: informacionOtorgada,
                  documento_adicional_otorgado1: documento_adicional_otorgado1,
                  documento_adicional_otorgado2: documento_adicional_otorgado2,
                  estatus: 'en_proceso_compras'
              },
              {
                  where:{
                      id_refaccion_solicitada: id_refaccion_solicitada
                  }
              }
          );

          await Solicitud.update(
            {
              estado: 5
            },
            {
              where:{
                  id_solicitud: id_solicitud
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