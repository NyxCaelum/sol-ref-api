module.exports = (sequelize, DataType) => {
    const CambioEstatusRefaccion = sequelize.define('Cambio_estatus_refaccion', {
        id_cambio:{
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_refaccion_solicitada: {
            type: DataType.STRING,
            allowNull: false
        },
        estatus: {
            type: DataType.STRING,
            allowNull: false
        },
        fecha_cambio: {
            type: DataType.DATE,
            allowNull: false
        }
    },{
        tableName: 'cambio_estatus_refaccion',
        timestamps: false
    });
    
    CambioEstatusRefaccion.associate = (models) => {
        CambioEstatusRefaccion.belongsTo(models.Refaccion_solicitada, {
            foreignKey: 'id_refaccion_solicitada',
            as: 'refaccionSolicitada'
        });
    };
    
    return CambioEstatusRefaccion;
}