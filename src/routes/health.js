module.exports = app => {
    const h = app.controllers.healt;
 
    app.get('/healtcore', h.healtcore);

    app.get('/', (req, res) => {
        res.send('API IS WORKING');
    });
}