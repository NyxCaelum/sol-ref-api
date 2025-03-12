module.exports = app => {

    const Refacciones = app.controllers.refacciones;
    // const AsignacionCarriles = app.controllers.asignacionCarriles;

    app.post('/refaccion/nueva', Refacciones.NuevasRefacciones);
    app.get('/refaccion', Refacciones.BuscarClave);
    
    // app.patch('/asignacion/actualizar', AsignacionCarriles.editarAsigCarr);

    // app.post('/ingreso/nuevo', IngresosUnidades.NuevoIngreso);

}