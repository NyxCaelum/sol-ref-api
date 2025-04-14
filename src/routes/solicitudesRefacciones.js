module.exports = app => {

    const SolicitudesRefacciones = app.controllers.solicitudesRefacciones;
    const { verificarToken } = app.middlewares.auth;

    app.get('/solicitudes/:base', SolicitudesRefacciones.SolicitudesPte);

    app.post('/solicitudes/nueva', [verificarToken], SolicitudesRefacciones.NuevaSolicitud);

    app.patch('/solicitudes/actualizarsolicitud', [verificarToken], SolicitudesRefacciones.ActualizarSolicitud);
    
    app.patch('/solicitudes/actualizarValidarSolicitud', [verificarToken], SolicitudesRefacciones.ActualizarValidarSolicitud);
    
    app.patch('/almacencentral/recepcionenvio', [verificarToken], SolicitudesRefacciones.cambiarEstatusAlmacenCentral);

    app.post('/almaceninterno/confirmarrecepcion', [verificarToken], SolicitudesRefacciones.confirmarRecepcion);

    app.delete('/solicitudes/eliminar/:id_solicitud', SolicitudesRefacciones.eliminarSolicitud);

    app.post('/solicitudes/cancelar/:id_refaccion_solicitada', SolicitudesRefacciones.cancelarSolicitudDeRefaccion);

    // app.get('/numero_eco/obtener', SolicitudesRefacciones.ObtenerNumEconomico);
}