
module.exports = (sequelize, DataType) => {
    const Permisos_Nivel_2 = sequelize.define('Permisos_Nivel_2', {
        id_permiso_nivel_2:{
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
        id_permiso_nivel_1: {
            type: DataType.INTEGER,
            allowNull: false     
        }
    },{
        tableName: 'permisos_nivel_2',
        timestamps: false
    });

    Permisos_Nivel_2.associate = (models) => {

        Permisos_Nivel_2.belongsToMany(models.Permisos_Nivel_1, {       
            as: 'PermisosNivel2',
            through: {
                model: models.Modulo_Permisos_Role
            }, 
            foreignKey: 'id_permiso_nivel_2',
            sourceKey: 'id_permiso_nivel_2'
        });

        Permisos_Nivel_2.belongsTo(models.Permisos_Nivel_1, {       
            foreignKey: 'id_permiso_nivel_1',
            sourceKey: 'id_permiso_nivel_1'
        });

    }
    

    return Permisos_Nivel_2;
}