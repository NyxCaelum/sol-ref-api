
module.exports = (sequelize, DataType) => {
    const Roles = sequelize.define('Roles', {
        id_role:{
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre_role: {
            type: DataType.STRING,
            allowNull: false     
        }
    },{
        tableName: 'roles',
        timestamps: false
    });

    Roles.associate = (models) => {

        Roles.belongsToMany(models.Modulos, {       
            as: 'ModulosPermisos',
            through: {
                model: models.Modulo_Permisos_Role
            }, 
            foreignKey: 'id_role',
            sourceKey: 'id_role'
        });

        Roles.belongsToMany(models.Permisos_Nivel_1, {       
            as: 'PermisosNivel1',
            through: {
                model: models.Modulo_Permisos_Role
            }, 
            foreignKey: 'id_role',
            sourceKey: 'id_role'
        });
        
    }

    return Roles;
}