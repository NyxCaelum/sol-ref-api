module.exports = app => {

    const Refacciones = app.controllers.refacciones;
    const { verificarToken } = app.middlewares.auth;

    app.post('/refaccion/nueva', [verificarToken], Refacciones.NuevasRefacciones);
    app.patch('/refaccion/actualizar', [verificarToken], Refacciones.ActualizarInformacionRefaccion);
    app.get('/refaccion/todas', Refacciones.TodasLasRefacciones);
    app.get('/refaccion', [verificarToken], Refacciones.BuscarClave);
    
}