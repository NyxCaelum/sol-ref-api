module.exports = app => {
    
    const { verificarToken } = app.middlewares.auth;
    const ComprasActualizacion = app.controllers.comprasActualizacion;

    
    app.post('/compras/actualizacion', [verificarToken], ComprasActualizacion.actualizacionCompras);

    app.post('/compras/solicitarinformacionadicional', ComprasActualizacion.solicitarInformacionAdicional);

    app.post('/compras/informacionadicionalotorgada', ComprasActualizacion.informacionAdicionalOtorgada);
}