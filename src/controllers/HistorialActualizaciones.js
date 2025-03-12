const moment = require("moment");

module.exports = (app) => {

    const Solicitud = app.database.models.Solicitud;
    const HistorialActualizaciones = app.database.models.HistorialActualizaciones;

    app.AgregarCambio = async (req, res) => {

        const cambio = req.body;

        Object.defineProperty(cambio, "fecha_actualizacion", {
            value: moment().format('YYYY-MM-DD HH:mm'),
            writable: true,
            enumerable: true,
            configurable: true
          });

        const estatusSolicitud = await Solicitud.findByPk(
            cambio.id_solicitud,
            {
                attributes: ['entregado']
            });

        if(estatusSolicitud.entregado == false && cambio.numero_pedido != null){
            await Solicitud.update(
                {entregado: 1},
                {
                    where:{id_solicitud: cambio.id_solicitud}
                }
            );
        } else {
            console.log("No entró en el if");
        }
                
        try {
            const crearCambio = await HistorialActualizaciones.create(cambio);

            return res.json({
                OK: true,
                result: crearCambio
            });
        } catch (error) {
            console.error("Error al crear cambio:", error);
            return res.json(error);
        }
    }

    app.HistorialCambios = async (req, res) => {

        const id_solicitud = req.params.id_solicitud

        try {

            const response = await HistorialActualizaciones.findAll({
                attributes: [
                    'fecha_actualizacion',
                    'numero_pedido',
                    'orden_compra',
                    'fecha_oc',
                    'estatus',
                    'fecha_compromiso_1',
                    'fecha_compromiso_2',
                    'fecha_compromiso_3',
                ],
                where: {
                    id_solicitud: id_solicitud
                },
                order: [['fecha_actualizacion', 'DESC']],
            });

            return res.json({
                OK: true,
                result: response
            });
            
        } catch (err) {
            return res.json(error);
        }

    }

  return app;
};