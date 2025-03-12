module.exports = (sequelize, DataType) => {

    const Solicitud = sequelize.define('Solicitud', {
        id_solicitud: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        id_refaccion: {
            type: DataType.INTEGER,
            allowNull: false,
        },
        id_base: {
            type: DataType.INTEGER,
            allowNull: false,
        },
        fecha_solicitud: {
            type: DataType.DATEONLY,
            allowNull: false,
        },
        carril: {
            type: DataType.STRING(25),
            allowNull: true,
        },
        unidad: {
            type: DataType.STRING(20),
            allowNull: true,
        },  
        cantidad: {
            type: DataType.FLOAT,
            allowNull: false,
        },
        ot: {
            type: DataType.STRING(10),
            allowNull: false,
        },
        alo_stock: {
            type: DataType.STRING(10),
            allowNull: false,
        },
        core_autorizacion: {
            type: DataType.STRING(15),
            allowNull: false,
        },
        estado: {
            type: DataType.BOOLEAN,
            allowNull: true
        },
        comentarios_rechazo: {
            type: DataType.STRING(100),
            allowNull: true
        },
        fecha_entrega: {
            type: DataType.DATEONLY,
            allowNull: true,
        },
        evidencia_advan: {
            type: DataType.STRING,
            allowNull: true,
        },
        evidencia_autorizaciones: {
            type: DataType.STRING,
            allowNull: true,
        },
        evidencia_core: {
            type: DataType.STRING,
            allowNull: true,
        },
        evidencia_vale: {
            type: DataType.STRING,
            allowNull: true,
        },
        
    }, {
        tableName: 'solicitud',
        timestamps: false,
    });

    Solicitud.associate = (models) => {  
        Solicitud.belongsTo(models.Refacciones, {
            foreignKey: 'id_refaccion',
            sourceKey: 'id_refaccion'
        });
        Solicitud.belongsTo(models.Base, {
            foreignKey: 'id_base',
            sourceKey: 'id_base'
        });
        Solicitud.hasMany(models.HistorialActualizaciones, {
            foreignKey: 'id_solicitud',
            sourceKey: 'id_solicitud'
        });
    }

    return Solicitud;
}

