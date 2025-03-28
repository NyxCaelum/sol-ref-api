require('colors');

const express = require('express');
const cors = require('cors')
const app = express();

const consign = require('consign');
const cookieParser = require('cookie-parser');
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    // origin: "http://localhost:4200"
    origin: "http://localhost:4200"
  }
});


app.use(express.static('./public'));
app.set('port', process.env.PORT || 3009);
app.use(express.urlencoded({extended: true, limit: '500mb', parameter: 500000}));         
app.use(express.json({limit: '500mb'}));
app.use('/evidencias', express.static('evidencias'));
app.use(cookieParser());
app.use(cors());


consign({cwd: 'src'})
.include('libs/config.js')
.then('./database.js')    
.then('middlewares')
.then('controllers')
.then('routes')
.into(app); 

io.on('connection', (socket) => {  

  socket.on('recarga', () => {
    socket.broadcast.emit('recarga');
  });
  
});

//Iniciar Server
http.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`.blue);
});