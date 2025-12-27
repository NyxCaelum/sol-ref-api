require('colors');
const morgan = require('morgan');
const express = require('express');
const cors = require('cors')
const app = express();

const consign = require('consign');
const cookieParser = require('cookie-parser');
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: ["https://as-app-solicitud-de-refacciones-prod.azurewebsites.net", "http://localhost:4200"],
    methods: ["GET", "POST"],
    credentials: true
  }
  // cors:{
  //   origin: "*",
  // }
});

app.use(express.static('./public'));
app.set('port', process.env.PORT || 3009);
app.use(express.urlencoded({extended: true, limit: '100mb', parameter: 500000}));         
app.use(express.json({limit: '100mb'})); 
app.use('/evidencias', express.static('evidencias'));
app.use(cookieParser());
// app.use(cors());
app.use(cors({
  origin: ["https://as-app-solicitud-de-refacciones-prod.azurewebsites.net", "http://localhost:4200"],
  credentials: true
}));

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

// Ruta del archivo de logs
const logPath = path.join(__dirname, 'traffic.log');
 
// Stream al archivo (append)
const logStream = fs.createWriteStream(logPath, { flags: 'a' });
 
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: logStream,
  skip: (req, res) => {
    const len = parseInt(res.getHeader('content-length') || 0);
    return len < 500000; // < 500 KB no se loggea
  }
}));

//Iniciar Server
http.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`.blue);
});