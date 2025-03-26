module.exports = app => {

    const Refacciones = app.controllers.refacciones;
    const { verificarToken } = app.middlewares.auth;

    app.post('/refaccion/nueva', [verificarToken], Refacciones.NuevasRefacciones);
    app.get('/refaccion', [verificarToken], Refacciones.BuscarClave);
    
}