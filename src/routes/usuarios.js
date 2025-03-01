module.exports = app => {
    
    const { verificarToken } = app.middlewares.auth;
    const Usuario = app.controllers.usuarios;
    const { UniqueUsuarioInsert, UniqueUsuarioUpdate } = app.middlewares.usuario;

    app.get('/usuario', Usuario.ObtenerUsuarios );

    app.post('/usuario/crear', [UniqueUsuarioInsert], Usuario.CrearUsuario);

    app.put('/usuarioperfil/:id', [verificarToken, UniqueUsuarioUpdate], Usuario.ActualizarUsuarioPerfil);

    app.put('/usuario/:id', [verificarToken, UniqueUsuarioUpdate], Usuario.ActualizarUsuario);

    app.get('/usuario/:id', verificarToken, Usuario.ObtenerUsuarioID);

    app.delete('/usuario/:id', verificarToken , Usuario.EliminarUsuario);

    app.get('/faker/user/:num', Usuario.GenerarUsuarios);

    app.get('/usuarios/count/totales', Usuario.ConsultarUsuarioTotales);

    app.get('/getCountUsers', Usuario.getCountUsers);
}