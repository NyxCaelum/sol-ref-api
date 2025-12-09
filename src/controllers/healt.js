module.exports = app => {
    app.healtcore = (req, res) => {
        res.json({
            OK: true,
            Healt: 'ok'
        })
    }
 
    return app;
}