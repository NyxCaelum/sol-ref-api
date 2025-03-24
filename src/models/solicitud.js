module.exports = (sequelize, DataType) => {

    const Solicitud = sequelize.define('Solicitud', {
        id_solicitud: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        id_base: {
            type: DataType.INTEGER,
            allowNull: false,
        },
        fecha_inicio_solicitud: {
            type: DataType.DATE,
            allowNull: false,
        },
        fecha_solicitud_completa: {
            type: DataType.DATE,
            allowNull: true,
        },
        ot: {
            type: DataType.STRING(10),
            allowNull: false,
        },
        unidad: {
            type: DataType.STRING(20),
            allowNull: true,
        },  
        carril: {
            type: DataType.STRING(25),
            allowNull: true,
        },
        estado: {
            type: DataType.INTEGER,
            allowNull: true
        },
        comentario_rechazo_solicitud: {
            type: DataType.STRING(255),
            allowNull: true
        },
        evidencia_advan: {
            type: DataType.STRING,
            allowNull: true,
        },
        evidencia_vale_diagnostico: {
            type: DataType.STRING,
            allowNull: true,
        },
        evidencia_vale_almacen: {
            type: DataType.STRING,
            allowNull: true,
        },
        evidencia_autorizacion_jefatura: {
            type: DataType.STRING,
            allowNull: true,
        },
        evidencia_autorizacion_gerencia: {
            type: DataType.STRING,
            allowNull: true,
        },
        evidencia_autorizacion_CI: {
            type: DataType.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'solicitud',
        timestamps: false,
    });

    Solicitud.associate = (models) => {
        Solicitud.hasMany(models.Refaccion_solicitada, {
            foreignKey: 'id_solicitud',
            as: 'refaccionesSolicitadas'
        });
        Solicitud.belongsTo(models.Base, {
            foreignKey: 'id_base',
            as: 'base'
        });
    };

    return Solicitud;
}

