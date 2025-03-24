module.exports = (sequelize, DataType) => {
    const ComprasActualizacion = sequelize.define('Compras_actualizacion', {
        id_compras_actualizacion: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        id_refaccion_solicitada: {
            type: DataType.INTEGER,
            allowNull: false,
        },
        orden_compra: {
            type: DataType.STRING(125),
            allowNull: true,
        },
        fecha_actualizacion: {
            type: DataType.DATE,
            allowNull: true,
        },
        fecha_oc: {
            type: DataType.DATE,
            allowNull: true,
        },
        fecha_compromiso: {
            type: DataType.DATE,
            allowNull: true,
        },
        causas_retraso: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        terminal: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        proveedor: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        observaciones: {
            type: DataType.STRING(255),
            allowNull: true,
        },
    }, {
        tableName: 'compras_actualizacion',
        timestamps: false,
    });

    ComprasActualizacion.associate = (models) => {
        ComprasActualizacion.belongsTo(models.Refaccion_solicitada, {
            foreignKey: 'id_refaccion_solicitada',
            as: 'refaccionSolicitada'
        });
    };

    return ComprasActualizacion;
}


