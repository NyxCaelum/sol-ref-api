module.exports = (sequelize, DataType) => {

    const RefaccionSolicitada = sequelize.define('Refaccion_solicitada', {
        id_refaccion_solicitada: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        id_solicitud: {
            type: DataType.INTEGER,
            allowNull: false,
        },
        estatus: {
            type: DataType.STRING(125),
            allowNull: true,
        },
        cantidad: {
            type: DataType.INTEGER,
            allowNull: false,
        },
        id_refaccion: {
            type: DataType.INTEGER,
            allowNull: false,
        },
        core: {
            type: DataType.INTEGER,
            allowNull: true,
        },
        fecha_compromiso_envio_ac: {
            type: DataType.DATE,
            allowNull: true,
        },
        fecha_entrega: {
            type: DataType.DATE,
            allowNull: true,
        },
        fecha_salida_mtto: {
            type: DataType.DATE,
            allowNull: true,
        },
        informacion_adicional_solicitada: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        informacion_adicional_otorgada: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        documento_adicional_otorgado1: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        documento_adicional_otorgado2: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        evidencia_core: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        evidencia_tarjeta_roja: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        evidencia_ausencia_core: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        evidencia_reporte_danos: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        numero_pedido: {
            type: DataType.STRING(45),
            allowNull: true,
        },
        evidencia_refaccion_entregado: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        evidencia_numeroParte_entregado: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        causa_de_devolucion: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        causa_de_cancelar: {
            type: DataType.STRING(255),
            allowNull: true,
        },
        comentario_rechazo_refaccion: {
            type: DataType.STRING(255),
            allowNull: true,
        }
    }, {
        tableName: 'refaccion_solicitada',
        timestamps: false,
    });

    RefaccionSolicitada.associate = (models) => {
        RefaccionSolicitada.belongsTo(models.Solicitud, {
            foreignKey: 'id_solicitud',
            as: 'solicitud'
        });
        RefaccionSolicitada.belongsTo(models.Refacciones, {
            foreignKey: 'id_refaccion',
            as: 'refaccion'
        });
        RefaccionSolicitada.hasOne(models.Compras_actualizacion, {
            foreignKey: 'id_refaccion_solicitada',
            as: 'comprasActualizacion'
        });
        RefaccionSolicitada.hasMany(models.Cambio_estatus_refaccion, {
            foreignKey: 'id_refaccion_solicitada',
            as: 'cambiosEstatus'
        });
    };

    return RefaccionSolicitada;
}

