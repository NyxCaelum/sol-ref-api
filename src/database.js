const Sequelize = require('sequelize');
const path = require('path');
const fs = require('fs');

let db = null;

function loadModelsRecursively(sequelize, Sequelize, dir, models) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Si es carpeta, la recorremos recursivamente
            loadModelsRecursively(sequelize, Sequelize, fullPath, models);
        } else if (file.endsWith('.js')) {
            // Solo cargamos archivos JS
            const model = require(fullPath)(sequelize, Sequelize.DataTypes);
            models[model.name] = model;
        }
    });
}

module.exports = app => {
    if (!db) {
        const config = app.libs.config;

        const sequelize = new Sequelize(
            config.database,
            config.username,
            config.password,
            config.options
        );

        db = {
            sequelize,
            Sequelize,
            models: {}
        };

        const modelsDir = path.join(__dirname, 'models');
        loadModelsRecursively(sequelize, Sequelize, modelsDir, db.models);

        // Asociaciones
        Object.keys(db.models).forEach(key => {
            if (db.models[key].associate) {
                db.models[key].associate(db.models);
            }
        });
    }

    return db;
};