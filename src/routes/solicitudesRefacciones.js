module.exports = app => {

    const SolicitudesRefacciones = app.controllers.solicitudesRefacciones;

    app.get('/solicitudes/:base', SolicitudesRefacciones.SolicitudesPte);

    app.post('/solicitudes/nueva', SolicitudesRefacciones.NuevaSolicitud);

    app.patch('/solicitudes/actualizarsolicitud', SolicitudesRefacciones.ActualizarSolicitud);
    
    // app.patch('/asignacion/actualizar', AsignacionCarriles.editarAsigCarr);

}