module.exports = app => {
    const h = app.controllers.healt;
 
    app.get('/healtcore', h.healtcore);
}