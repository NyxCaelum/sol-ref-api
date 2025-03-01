module.exports = (sequelize, DataType) => {
    
    const Modulo_Permisos_Role = sequelize.define('Modulo_Permisos_Role', {
        id_modulo_permisos_role:{
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_role: {
            type: DataType.INTEGER,
            allowNull: false 
        },
        id_modulo: {
            type: DataType.INTEGER,
            allowNull: false     
        },
        id_permiso_nivel_1: {
            type: DataType.INTEGER,
            allowNull: true     
        },
        id_permiso_nivel_2: {
            type: DataType.INTEGER,
            allowNull: true     
        },
    },{
        tableName: 'modulo_permisos_role',
        timestamps: false
    });


    Modulo_Permisos_Role.associate = (models) => {

        Modulo_Permisos_Role.belongsTo(models.Roles, {       
            foreignKey: 'id_role',
            sourceKey: 'id_role'
        });

        Modulo_Permisos_Role.belongsTo(models.Modulos, {       
            foreignKey: 'id_modulo',
            sourceKey: 'id_modulo',
        });

        Modulo_Permisos_Role.belongsTo(models.Permisos_Nivel_1, {       
            foreignKey: 'id_permiso_nivel_1',
            sourceKey: 'id_permiso_nivel_1'
        });

        Modulo_Permisos_Role.belongsTo(models.Permisos_Nivel_2, {
            foreignKey: 'id_permiso_nivel_2',
            sourceKey: 'id_permiso_nivel_2'
        });
    }
    
    return Modulo_Permisos_Role;
}