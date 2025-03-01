

module.exports = app => {
    
    const { verificarToken } = app.middlewares.auth;
    const Roles = app.controllers.roles;    

    app.get('/roles', [verificarToken], Roles.ObtenerRoles );
    
    app.get('/roles/:id_role/modulos', [verificarToken], Roles.ObtenerRolesModulos );

    app.get('/roles/:id_role/modulos/permisos', [verificarToken], Roles.ObtenerRolesPermisos );
    
    app.get('/roles/modulos', [verificarToken], Roles.ObtenerModulos );

    app.post('/roles', [verificarToken], Roles.AgregarRol );

    app.put('/roles/:id_role/modulos', [verificarToken], Roles.ModificarModulo );
    
    app.put('/roles/:id_role/modulos/permisos', [verificarToken], Roles.ModificarPermisos );

    app.get('/roles/:id_role/count', [verificarToken], Roles.CountRoleUsuarios );

    app.delete('/roles/:id_role', [verificarToken], Roles.EliminarRol );
    
}