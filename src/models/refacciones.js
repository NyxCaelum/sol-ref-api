module.exports = (sequelize, DataType) => {

    const Refacciones = sequelize.define('Refacciones', {
        id_refaccion: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        clave: {
            type: DataType.STRING(25),
            allowNull: false,
        },
        refaccion: {
            type: DataType.STRING(150),
            allowNull: false,
        },
        stock_alm_central: {
            type: DataType.INTEGER,
            allowNull: true,
            default: 1,
        },
        stock_alm_salinas: {
            type: DataType.INTEGER,
            allowNull: true,
            default: 1,
        },
        stock_alm_salamanca: {
            type: DataType.INTEGER,
            allowNull: true,
            default: 1,
        },
        activo: {
            type: DataType.INTEGER,
            allowNull: true,
            default: 1,
        }
    }, {
        tableName: 'refacciones_catalogo',
        timestamps: false,
    });

    Refacciones.associate = (models) => {
        Refacciones.hasMany(models.Refaccion_solicitada, {
            foreignKey: 'id_refaccion',
            as: 'refaccionesSolicitadas'
        });
    };

    return Refacciones;
}

