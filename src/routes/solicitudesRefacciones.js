module.exports = app => {

    const SolicitudesRefacciones = app.controllers.solicitudesRefacciones;
    const { verificarToken } = app.middlewares.auth;

    app.get('/solicitudes/:base/:proceso', SolicitudesRefacciones.SolicitudesPte);
    app.get('/conteorefacciones/:id_base', SolicitudesRefacciones.conteoRefaccionesPorProceso);

    app.get('/solicitudes/reporte', SolicitudesRefacciones.ReporteRefaccionesPendientes);
    
    app.get('/solicitudes/exportarRefaccionesPendientes', SolicitudesRefacciones.ExportarRefacciones);
    app.get('/solicitudes/TiemposEnProceso/:fechaInicio/:fechaFin', SolicitudesRefacciones.TiemposEnProceso);
    app.get('/solicitudes/grafica/refacciones-pendientes', SolicitudesRefacciones.RefaccionesPendientesGrafica);

    app.get('/analitica/tiemposporprocesos/:base/:fecha_inicio/:fecha_fin', SolicitudesRefacciones.datasetTiemposPorProceso);

    app.post('/solicitudes/nueva', [verificarToken], SolicitudesRefacciones.NuevaSolicitud);  
    app.post('/almaceninterno/confirmarrecepcion', [verificarToken], SolicitudesRefacciones.confirmarRecepcion);
    app.post('/solicitudes/cancelar/:id_refaccion_solicitada', SolicitudesRefacciones.cancelarSolicitudDeRefaccion);
    
    app.patch('/solicitudes/actualizarsolicitud', [verificarToken], SolicitudesRefacciones.ActualizarSolicitud);
    app.patch('/solicitudes/actualizarValidarSolicitud', [verificarToken], SolicitudesRefacciones.ActualizarValidarSolicitud);
    app.patch('/almacencentral/recepcionenvio', [verificarToken], SolicitudesRefacciones.cambiarEstatusAlmacenCentral);
    app.patch('/solicitudes/validaracnuevamente', SolicitudesRefacciones.pasarRefaccionValidarAC);

    app.patch('/solicitudes/recepcionai', [verificarToken], SolicitudesRefacciones.confirmarRecepcionAI);
    app.patch('/solicitudes/confirmarfacent', [verificarToken], SolicitudesRefacciones.confirmarFacturaEntradaAI);
    app.patch('/solicitudes/confirmarsalmtto', [verificarToken], SolicitudesRefacciones.confirmarSalidaMtto);
    
    app.delete('/solicitudes/eliminar/:id_solicitud', [verificarToken], SolicitudesRefacciones.eliminarSolicitud);
    // app.get('/numero_eco/obtener', SolicitudesRefacciones.ObtenerNumEconomico);
}