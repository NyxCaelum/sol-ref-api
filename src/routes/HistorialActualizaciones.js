module.exports = app => {

    const HistorialActualizaciones = app.controllers.HistorialActualizaciones;


    app.get('/solicitudes/cambios/:id_solicitud', HistorialActualizaciones.HistorialCambios);

    app.post('/solicitudes/cambios', HistorialActualizaciones.AgregarCambio);
}