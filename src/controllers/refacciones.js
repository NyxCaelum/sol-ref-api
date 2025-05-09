const { Op } = require("sequelize");

module.exports = (app) => {

    // const Base = app.database.models.Base;
    // const Solicitud = app.database.models.Solicitud;
    // const HistorialActualizaciones = app.database.models.HistorialActualizaciones;
    const Refacciones = app.database.models.Refacciones;
    
    app.NuevasRefacciones = async (req, res) => {
      const refacciones = req.body;

      try {
          const NuevasRefacciones = [];
          for (const refaccion of refacciones) {

            const [nuevaRefaccion, created] = await Refacciones.findOrCreate({
              where: { clave: refaccion.clave },
              defaults: refaccion
            });
            if (created) {
              NuevasRefacciones.push(nuevaRefaccion);
            }
          }
  
          return res.json({
              OK: true,
              result: NuevasRefacciones
          });
      } catch (error) {
          return res.json(error);
      }
    }

    app.TodasLasRefacciones = async (req, res) => {
      try {
        const refacciones = await Refacciones.findAll({
            order: [['id_refaccion', 'ASC']]
        });
        return res.json({
          OK: true,
          result: refacciones
        });
      } catch (error) {
          console.error('Error al obtener todas las refacciones:', error);
          return res.status(500).json({ error: 'Error interno del servidor' });
      }
    }

    app.ActualizarInformacionRefaccion = async (req, res) => {
      const { id_refaccion, clave, refaccion, stock_alm_central, stock_alm_salinas, stock_alm_salamanca } = req.body;

      try {

          const refaccionExistente = await Refacciones.findOne({ where: { clave } });


          if(refaccionExistente && refaccionExistente.id_refaccion !== id_refaccion) {
            return res.json({
              OK: true,
              result: refaccionExistente
          });
          }

          const refaccionActualizada = await Refacciones.update(
              { clave, refaccion, stock_alm_central, stock_alm_salinas, stock_alm_salamanca },
              { where: { id_refaccion } }
          );
          return res.json({
              OK: true,
              result: refaccionActualizada
          });
      } catch (error) {
          console.error('Error al actualizar la refacción:', error);
          return res.status(500).json({ error: 'Error interno del servidor' });
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
