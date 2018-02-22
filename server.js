/*
SOCKET.IO
*/

/*
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const PORT = 80;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(PORT, function(){
  console.log('listening on 80');
});
*/

// Express Server
const PORT = process.env.PORT || 80;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//app.enable('trust proxy');

app.use(express.static("."));

app.use(function(req, res, next) {
  if(req.secure) {
    next();
  } else{
    res.redirect('https://' + req.headers.host + req.url);
  }
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
  console.log('index loaded');
});

app.get('/chat.html', function(req, res){
  res.sendFile(__dirname + '/chat.html');
});

app.get('/login.html', function(req, res){
  res.sendFile(__dirname + '/login.html');
});

io.on('connection', function(socket){
  console.log('User connected');

  socket.on('signup', function(data) {
    console.log("Username: " + data.username);
    console.log("Password: " + data.password);
  });

  socket.on('chat message', function(data){
    io.emit('chat message', data);
    console.log('Message: ' + data);
  });

  socket.on('disconnect', function(){
    console.log('------------------ Session Ended ------------------');
    console.log('---------------------------------------------------')
    console.log('');
  });

});

http.listen(PORT, function(){
  console.log('listening on 80');
});
