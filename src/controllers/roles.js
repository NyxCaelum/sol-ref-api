const _ = require('lodash');

module.exports = app => {

    const Roles = app.database.models.Roles;
    const Modulos = app.database.models.Modulos;
    const Permisos_Nivel_1 = app.database.models.Permisos_Nivel_1;
    const Permisos_Nivel_2 = app.database.models.Permisos_Nivel_2;
    const Modulo_Permisos_Role = app.database.models.Modulo_Permisos_Role;
    const Usuario = app.database.models.Usuarios;
    const sequelize = app.database.sequelize;

    app.ObtenerRoles = (req, res) => {
        
        Roles.findAll()
        .then(roles => {
            res.json({
                OK: true,
                Roles: roles
            })
        })
        .catch(error => {
            res.status(412).json({
                msg: error.message
            });
        });
    }

    app.NameRoles = (req, res) => {
        Roles.findAll({
  
        })
        .then(result => {            
            res.json({
                OK: true,
                Roles: result
            })
        })
        .catch(error => {
            res.status(412).json({
                msg: error.message
            });
        });
    }

    app.ObtenerModulos = (req, res) =>{
        Modulos.findAll({
            include: [{
                model: Permisos_Nivel_1,
                required: false,
                include: [{
                    model:Permisos_Nivel_2,
                    required: false
                }] 
            }]
        })
        .then(modulos => {
            res.json({
                OK: true,
                Modulos: modulos
            })
        })
        .catch(error => {
            res.status(412).json({
                msg: error.message
            });
        });
    } 

    app.ObtenerRolesModulos = (req, res) => {

        Roles.findAll({
            where: {
                id_role: req.params.id_role
            },
            include: [{
                as: 'ModulosPermisos',
                model: Modulos,
                required: true
            }]
        })
        .then(roles =>{
            res.json({
                OK: true,
                Roles: roles
            })
        })
    }

    app.ObtenerRolesPermisos = (req, res) => {

        Roles.findAll({
            where: {
                id_role: req.params.id_role
            },
            include: [{
                as: 'PermisosNivel1',
                model: Permisos_Nivel_1,
                required: false,
                include: [{
                    as: 'PermisosNivel2',
                    model: Permisos_Nivel_2,
                    required: false
                }]
            }]
        })
        .then(roles =>{
            res.json({
                OK: true,
                Roles: roles
            })
        })
    }

    app.AgregarRol = (req, res) => {

    
        sequelize.transaction(async t => {

            role = await Roles.create(new Roles({
                nombre_role: req.body.nombre_role
            }).dataValues);

            await _.forEach(req.body.modulos, (modulo, key) => {

                Modulo_Permisos_Role.create({
                    id_role: role.dataValues.id_role,
                    id_modulo: modulo
                });

            });

        }).then(result => {            
            res.json({
                OK: true
            });            

        }).catch(error => {            
            res.status(402).json({
                OK: false
            });
        }); 

    }

    app.ModificarModulo = (req, res) => {

        sequelize.transaction(async t => {


            let role = await Modulo_Permisos_Role.findAll({
                where: {
                    id_role: req.params.id_role
                }
            });

            let ids_modulos = _.map(_.uniqBy(role, 'id_modulo'), 'id_modulo');

            await _.forEach(req.body.modulos, (id_modulo, keyModule) => {
                
                if((_.includes(ids_modulos, id_modulo)) === false) {

                    Modulo_Permisos_Role.create({
                        id_role: req.params.id_role,
                        id_modulo: id_modulo
                    });
                }
                
            });

            await _.forEach(_.differenceBy(ids_modulos, req.body.modulos), (value, key) => {

                Modulo_Permisos_Role.destroy({
                    where: {
                        id_role: req.params.id_role,
                        id_modulo: value
                    }
                });

            });

        }).then(result => {            
            res.json({
                OK: true
            });            

        }).catch(error => {            
            res.status(402).json({
                OK: false
            });
        }); 
    }

    app.ModificarPermisos = async (req, res) => {

        let role = await Modulo_Permisos_Role.findAll({
            where: {
                id_role: req.params.id_role
            },
            
        });

        let ids_permissions_1_current = [];
        let ids_permissions_2_current = [];

        await _.forEach(role, (value) => {

            if(value.id_permiso_nivel_1 !== null)
                ids_permissions_1_current.push({
                    id_modulo: value.id_modulo,
                    id_permiso_nivel_1: value.id_permiso_nivel_1
                });

            if(value.id_permiso_nivel_2 !== null)
                ids_permissions_2_current.push({
                    id_modulo: value.id_modulo,
                    id_permiso_nivel_1: value.id_permiso_nivel_1,
                    id_permiso_nivel_2: value.id_permiso_nivel_2
                });
        })

        let ids_permissions_selected = await Promise.all(_.map(req.body.permisos, async (value, key) => {

            let split = _.split(value, '-');

            if(split[1] === undefined) {
                
                nivel_1 =  await Permisos_Nivel_1.findAll({
                    where: {
                        nombre_permiso: value
                    },
                    include: [{
                        model:Permisos_Nivel_2,
                        required: false
                    }],
                    
                })

                   
                if(nivel_1.length === 0) {
                    nivel2 = await Permisos_Nivel_2.findAll({
                        where: {
                            nombre_permiso: value
                        },
                        
                    })
                    
                    
                    return nivel2;
                }
                
                if(nivel_1[0].Permisos_Nivel_2s.length > 0) { 
                    return nivel_1[0].Permisos_Nivel_2s;
                }
                
                
                if(nivel_1)
                    return nivel_1    

                
                
            } else if(Number.isSafeInteger(Number(split[1]))) {

                permisos =  await Modulos.findAll({
                    where: {
                        id_modulo: Number(split[1])
                    },
                    include: [{
                        model:Permisos_Nivel_1,
                        required: false,
                        include: [{
                            model:Permisos_Nivel_2,
                            required: false
                        }]
                    }],
                    
                })

                return permisos[0].Permisos_Nivel_1s;

            }

        }));

        //Clear Array
        ids_permissions_selected = await _.map(ids_permissions_selected, (value) => {
            if (value && value.length === 1) { 
                return value[0];
            } else {
                return value;
            }
        });
        
        await _.forEach(ids_permissions_selected, (value1, key) => {
            if(value1 && value1.length > 1) {                    
                ids_permissions_selected = _.concat(ids_permissions_selected, value1);
            } 
        });

        ids_permissions_selected = await _.filter(ids_permissions_selected, (value) => {
            return value && value.length === undefined;
        });
        
        await _.forEach(ids_permissions_selected, (value1, key) => {
            if(value1.Permisos_Nivel_2s) {
                _.forEach(value1.Permisos_Nivel_2s, (value2, key) => {
                    ids_permissions_selected = _.concat(ids_permissions_selected, value2);
                });
            }
        });
        
        let permisos_nivel_1 = await _.filter(ids_permissions_selected, (value) => {
            return value.id_permiso_nivel_2 === undefined;
        });

        if(permisos_nivel_1.length > 0)
            permisos_nivel_1 = await _.map(permisos_nivel_1, (value) => { 
                return {
                    id_modulo: value.id_modulo,
                    id_permiso_nivel_1: value.id_permiso_nivel_1
                } 
            });

        let permisos_nivel_2 = await _.filter(ids_permissions_selected, (value) => {
            return value.id_permiso_nivel_2 !== undefined;
        });

        if(permisos_nivel_2.length > 0)
            permisos_nivel_2 = await Promise.all(_.map(permisos_nivel_2, async (value) => { 

                id_modulo = await Modulos.findAll({
                    include: [{
                        model: Permisos_Nivel_1,
                        where: {
                            id_permiso_nivel_1: value.id_permiso_nivel_1
                        },
                        required: true
                    }]
                });

                return {
                    id_modulo: id_modulo[0].id_modulo,
                    permisos_nivel_1: value.id_permiso_nivel_1,
                    permisos_nivel_2: value.id_permiso_nivel_2
                }  
            })); 
            
        

        await sequelize.transaction(async t => {

            if(permisos_nivel_1.length > 0 ) {

                await permisos_nivel_1.forEach(async (value, keyModule) => {
                
                    if(_.includes(ids_permissions_1_current, value.id_permiso_nivel_1) === false) {
                        await Modulo_Permisos_Role.create({
                            id_role: req.params.id_role,
                            id_modulo: value.id_modulo,
                            id_permiso_nivel_1: value.id_permiso_nivel_1
                        });

                    }
                    
                });

            }
            if(permisos_nivel_2.length > 0) {

                await permisos_nivel_2.forEach(async (value, keyModule) => {
                                    
                    if(_.includes(ids_permissions_2_current, value.permisos_nivel_2) === false) {
                        await Modulo_Permisos_Role.create({
                            id_role: req.params.id_role,
                            id_modulo: value.id_modulo,
                            id_permiso_nivel_1: value.permisos_nivel_1,
                            id_permiso_nivel_2: value.permisos_nivel_2
                        });

                    }
                    
                });

            }
            let rowDelete_current = await _.uniqBy(ids_permissions_1_current, 'id_permiso_nivel_1');
            let rowDelete_news = await _.uniqBy(permisos_nivel_1, 'id_permiso_nivel_1');
            
            _.forEach(_.differenceBy(rowDelete_current, rowDelete_news, 'id_permiso_nivel_1'), async (value, key) => {

                await Modulo_Permisos_Role.destroy({
                where: {
                    id_role: req.params.id_role,
                    id_modulo: value.id_modulo,
                    id_permiso_nivel_1: value.id_permiso_nivel_1
                }});

            });

            rowDelete_current = await _.uniqBy(ids_permissions_2_current, 'id_permiso_nivel_2');
            rowDelete_news = await _.uniqBy(permisos_nivel_2, 'id_permiso_nivel_2');

            await _.forEach(_.differenceBy(rowDelete_current, rowDelete_news, 'id_permiso_nivel_2'), async (value, key) => {

                await Modulo_Permisos_Role.destroy({
                where: {
                    id_role: req.params.id_role,
                    id_modulo: value.id_modulo,
                    id_permiso_nivel_1: value.id_permiso_nivel_1,
                    id_permiso_nivel_2: value.id_permiso_nivel_2
                }});

            });

            await Roles.update({
                nombre_role: req.body.nombre_role
            }, {
                where: {
                    id_role: req.params.id_role
                }
            });


        }).then(result => {            
            res.json({
                OK: true
            });            

        }).catch(error => {            
            res.status(402).json({
                OK: false
            });
        }); 
    }

    app.CountRoleUsuarios = (req, res) => {

        Usuario.findAll({
            where: {
                id_role: req.params.id_role
            }
        }).then(users => {
            res.json({
                OK: true,
                Users: users
            });
        }).catch(err => {
            res.status(412).json({
                OK: false,
                msg: err
            });
        });

    }

    app.EliminarRol = (req, res) => {

        sequelize.transaction(async t => {

            let usuario = await Usuario.findAll({
                where: {
                    id_role: req.params.id_role
                }
            });

            if(usuario.length === 0) {

                await Modulo_Permisos_Role.destroy({
                    where: {
                        id_role: req.params.id_role
                    },
                    transaction: t
                });
    
                await Roles.destroy({
                    where: {
                        id_role: req.params.id_role
                    }, 
                    transaction: t
                });
    
            } else {                
                throw new Error();
            }
            
        }).then(result => {
            res.json({
                OK: true
            });
        }).catch(err => {
            res.status(409).json({
                OK: false
            });
        });


    }

    return app;
}