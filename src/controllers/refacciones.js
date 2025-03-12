const { Op } = require("sequelize");

module.exports = (app) => {

    // const Base = app.database.models.Base;
    // const Solicitud = app.database.models.Solicitud;
    // const HistorialActualizaciones = app.database.models.HistorialActualizaciones;
    const Refacciones = app.database.models.Refacciones;
    
    app.NuevasRefacciones = async (req, res) => {
        const refacciones = req.body;

        try {
            const NuevasRefacciones = await Refacciones.bulkCreate(refacciones);
    
            return res.json({
                OK: true,
                result: NuevasRefacciones
            });
        } catch (error) {
            return res.json(error);
        }
    }

    app.BuscarClave = async (req, res) => {
        try {
            const searchTerm = req.query.search || '';
            const refacciones = await Refacciones.findAll({
              where: {
                clave: {
                  [Op.like]: `%${searchTerm}%`
                }
              }
            });
            res.json(refacciones);
        } catch (error) {
          console.error('Error al buscar refacciones:', error);
          res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    
  return app;
};
