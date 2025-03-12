module.exports = (sequelize, DataType) => {
    const HistorialActualizaciones = sequelize.define('HistorialActualizaciones', {
        id_actualizaciones: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        id_solicitud: {
            type: DataType.INTEGER,
            allowNull: false,
        },
        fecha_actualizacion: {
            type: DataType.DATE
        },
        numero_pedido: {
            type: DataType.STRING(20),
            allowNull: false,
        },
        causas: {
            type: DataType.STRING(100),
            allowNull: true,
        },
        terminal: {
            type: DataType.STRING(50),
            allowNull: true,
        },
        orden_compra: {
            type: DataType.STRING(20),
            allowNull: true,
        },
        fecha_oc: {
            type: DataType.DATEONLY,
            allowNull: true,
        },
        proveedor: {
            type: DataType.STRING(20),
            allowNull: true,
        },
        comentarios: {
            type: DataType.STRING(200),
            allowNull: true,
        },
        estatus: {
            type: DataType.STRING(50),
            allowNull: true,
        },
        fecha_compromiso_1: {
            type: DataType.DATEONLY,
            allowNull: true,
        },
        fecha_compromiso_2: {
            type: DataType.DATEONLY,
            allowNull: true,
        },
        fecha_compromiso_3: {
            type: DataType.DATEONLY,
            allowNull: true,
        },
    }, {
        tableName: 'historialActualizaciones',
        timestamps: false,
    });

    HistorialActualizaciones.associate = (models) => {  
        HistorialActualizaciones.belongsTo(models.Solicitud, {
            foreignKey: 'id_solicitud',
            sourceKey: 'id_solicitud'
        });
    }

    return HistorialActualizaciones;
}


