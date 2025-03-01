module.exports = (sequelize, DataType) => {
    const ADMLOGS = sequelize.define('ADMLOGS',{
        id_admlog:{
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre_tabla:{
            type: DataType.STRING,
            allowNull: false
        },
        nombre_objeto:{
            type: DataType.STRING,
            allowNull: false
        },
        id_objeto:{
            type: DataType.STRING,
            allowNull: false
        },
        tipo_transaccion:{
            type: DataType.STRING,
            allowNull: false
        },
        descripcion:{
            type: DataType.STRING,
            allowNull: false
        },
        nombre:{
            type: DataType.STRING,
            allowNull: false
        },
        usuario:{
            type: DataType.STRING,
            allowNull: false
        },
        publicIP:{
            type: DataType.STRING,
            allowNull: false
        },
        privateIP:{
            type: DataType.STRING,
            allowNull: false
        },
        navegator:{
            type: DataType.STRING,
            allowNull: false
        },
        fecha_creacion:{
            type: DataType.STRING,
            allowNull: false
        },
    }, 
    {
        tableName: 'adm_log',        
        timestamps: false
    });

    return ADMLOGS;
}