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
    }, {
        tableName: 'refacciones',
        timestamps: false,
    });

    return Refacciones;
}

