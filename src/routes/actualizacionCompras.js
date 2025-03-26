module.exports = app => {
    
    const { verificarToken } = app.middlewares.auth;
    const ComprasActualizacion = app.controllers.comprasActualizacion;

    
    app.post('/compras/actualizacion', [verificarToken], ComprasActualizacion.actualizacionCompras);
}