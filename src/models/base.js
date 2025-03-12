
module.exports = (sequelize, DataType) => {
    const base = sequelize.define('Base', {
        id_base:{
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        base: {
            type: DataType.STRING,
            allowNull: false
        }
    },{
        tableName: 'base',
        timestamps: false
    });
    
    return base;
}