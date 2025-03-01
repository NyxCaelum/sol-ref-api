module.exports = (sequelize, DataType) => {
    const Modulos = sequelize.define('Modulos', {
        id_modulo:{
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre_modulo: {
            type: DataType.STRING,
            allowNull: false     
        }
    },{
        tableName: 'modulos',
        timestamps: false
    });

    Modulos.associate = (models) => {
        
        Modulos.belongsToMany(models.Roles, {       
            as: 'ModulosPermisos',
            through: {
                model: models.Modulo_Permisos_Role
            }, 
            foreignKey: 'id_modulo',
            sourceKey: 'id_modulo'
        });


        Modulos.hasMany(models.Permisos_Nivel_1, {
            foreignKey: 'id_modulo',
            sourceKey: 'id_modulo'
        });
    }

    return Modulos;
}