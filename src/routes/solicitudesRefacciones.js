module.exports = app => {

    const SolicitudesRefacciones = app.controllers.solicitudesRefacciones;
    const { verificarToken } = app.middlewares.auth;

    // Principales
    app.get('/solicitudes/:base/:proceso', SolicitudesRefacciones.SolicitudesPte);
    app.get('/conteorefacciones/:id_base', SolicitudesRefacciones.conteoRefaccionesPorProceso);
    
    // Exportable
    app.get('/solicitudes/exportarRefaccionesPendientes', SolicitudesRefacciones.ExportarRefacciones);
    
    // En modulo de analitica
    app.get('/analitica/tiemposporprocesos/:base/:fecha_inicio/:fecha_fin', SolicitudesRefacciones.datasetTiemposPorProceso);

    app.get('/solicitudes/reporte', SolicitudesRefacciones.ReporteRefaccionesPendientes);
    
    // app.get('/solicitudes/TiemposEnProceso/:fechaInicio/:fechaFin', SolicitudesRefacciones.TiemposEnProceso);
    // app.get('/solicitudes/grafica/refacciones-pendientes', SolicitudesRefacciones.RefaccionesPendientesGrafica);


    app.post('/solicitudes/nueva', [verificarToken], SolicitudesRefacciones.NuevaSolicitud);  
    app.post('/almaceninterno/confirmarrecepcion', [verificarToken], SolicitudesRefacciones.confirmarRecepcion);
    app.post('/solicitudes/cancelar/:id_refaccion_solicitada', SolicitudesRefacciones.cancelarSolicitudDeRefaccion);
    app.post('/solicitudes/ot', SolicitudesRefacciones.refaccionesSolicitudEntrega);
    
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