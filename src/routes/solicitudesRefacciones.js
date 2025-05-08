module.exports = app => {

    const SolicitudesRefacciones = app.controllers.solicitudesRefacciones;
    const { verificarToken } = app.middlewares.auth;

    app.get('/solicitudes/reporte', SolicitudesRefacciones.ReporteRefaccionesPendientes);
    
    app.get('/solicitudes/exportarRefaccionesPendientes', SolicitudesRefacciones.ExportarRefacciones);

    app.get('/solicitudes/:base', SolicitudesRefacciones.SolicitudesPte);

    app.get('/solicitudes/TiemposEnProceso/:fechaInicio/:fechaFin', SolicitudesRefacciones.TiemposEnProceso);

    app.get('/solicitudes/grafica/refacciones-pendientes', SolicitudesRefacciones.RefaccionesPendientesGrafica);

    app.post('/solicitudes/nueva', [verificarToken], SolicitudesRefacciones.NuevaSolicitud);

    app.patch('/solicitudes/actualizarsolicitud', [verificarToken], SolicitudesRefacciones.ActualizarSolicitud);
    
    app.patch('/solicitudes/actualizarValidarSolicitud', [verificarToken], SolicitudesRefacciones.ActualizarValidarSolicitud);
    
    app.patch('/almacencentral/recepcionenvio', [verificarToken], SolicitudesRefacciones.cambiarEstatusAlmacenCentral);

    app.post('/almaceninterno/confirmarrecepcion', [verificarToken], SolicitudesRefacciones.confirmarRecepcion);

    app.post('/solicitudes/cancelar/:id_refaccion_solicitada', SolicitudesRefacciones.cancelarSolicitudDeRefaccion);
    
    app.delete('/solicitudes/eliminar/:id_solicitud', SolicitudesRefacciones.eliminarSolicitud);
    
    // app.get('/numero_eco/obtener', SolicitudesRefacciones.ObtenerNumEconomico);
}