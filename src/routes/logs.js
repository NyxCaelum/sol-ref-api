module.exports = app => {
    
    const { verificarToken } = app.middlewares.auth;
    const LOG = app.controllers.logs;   
    
    app.post('/addLog', [verificarToken], LOG.addLog);
}