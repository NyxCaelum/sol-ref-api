const Sequelize = require('sequelize');
const path = require('path');
const fs = require('fs');

let db = null;

module.exports = app => {
    
    if (!db) {        
        const config = app.libs.config;

        const sequelize = new Sequelize(config.database, config.username, config.password,
            config.options
        );

        db = {
            sequelize,
            Sequelize,
            models: {}
        };

        const dir = path.join(__dirname, 'models');
        fs.readdirSync(dir).forEach(filename => {
            const modelDir = path.join(dir, filename);
            const model = sequelize.import(modelDir);
            db.models[model.name] = model;
        });

        
        Object.keys(db.models).forEach(key => {            
            if (db.models[key].associate) {                
                db.models[key].associate(db.models);
            }
        });

    }

    return db;
};