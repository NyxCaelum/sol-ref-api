module.exports = (sequelize, DataType) => {
    const Permisos_Nivel_1 = sequelize.define('Permisos_Nivel_1', {
        id_permiso_nivel_1:{
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre_permiso: {
            type: DataType.STRING,
            allowNull: false     
        },
        descripcion: {
            type: DataType.STRING,
            allowNull: false     
        },
        id_modulo: {
            type: DataType.INTEGER,
            allowNull: false     
        }
    },{
        tableName: 'permisos_nivel_1',
        timestamps: false
    });


    Permisos_Nivel_1.associate = (models) => {

        Permisos_Nivel_1.belongsToMany(models.Roles, {       
            as: 'PermisosNivel1',
            through: {
                model: models.Modulo_Permisos_Role
            }, 
            foreignKey: 'id_permiso_nivel_1',
            sourceKey: 'id_permiso_nivel_1'
        });


        Permisos_Nivel_1.belongsToMany(models.Permisos_Nivel_2, {       
            as: 'PermisosNivel2',
            through: {
                model: models.Modulo_Permisos_Role
            }, 
            foreignKey: 'id_permiso_nivel_1',
            sourceKey: 'id_permiso_nivel_1'
        });

        Permisos_Nivel_1.belongsTo(models.Modulos, {       
            foreignKey: 'id_modulo',
            sourceKey: 'id_modulo'
        });

        Permisos_Nivel_1.hasMany(models.Permisos_Nivel_2, {
            foreignKey: 'id_permiso_nivel_1',
            sourceKey: 'id_permiso_nivel_1'
        });

        
    }

    return Permisos_Nivel_1;
}