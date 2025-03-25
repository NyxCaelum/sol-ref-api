module.exports = app => {
    
    const { verificarToken } = app.middlewares.auth;
    const LOG = app.controllers.logs;
    const ComprasActualizacion = app.controllers.comprasActualizacion;

    
    app.post('/compras/actualizacion', ComprasActualizacion.actualizacionCompras);
}