
module.exports = (sequelize, DataType) => {
    const Usuarios = sequelize.define('Usuarios', {
        id_usuario:{
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_base: {
            type: DataType.INTEGER,
            allowNull: false
        },
        id_role: {
            type: DataType.INTEGER,
            allowNull: false
        },
        nombre_empleado: {
            type: DataType.STRING,
            allowNull: false        
        },       
        nombre_usuario: {
            type: DataType.STRING,
            allowNull: false        
        },     
        numero_empleado: {
            type: DataType.STRING,                  
            allowNull: true        
        },
        contrasena: {
            type: DataType.STRING,                  
            allowNull: true        
        },
        status: {
            type: DataType.ENUM,
            values: ['A', 'I'],
            allowNull: true     
        }
    },{
        tableName: 'usuarios',
        defaultScope: {
            attributes: { exclude: ['contrasena'] },
        },
        scopes: {
            withPassword: {
                attributes: { exclude: ['fecha_creacion', 'creado_por', 'fecha_ultima_modificacion', 'fecha_modificacion_por', 'status'] },
            }
        },
        timestamps: false
    });

    

    // Usuarios.associate = (models) => {        
    //     Usuarios.belongsTo(models.Roles, {
    //         foreignKey: 'idRol',
    //         sourceKey: 'idRol'
    //     });
    // }
    

    return Usuarios;
}