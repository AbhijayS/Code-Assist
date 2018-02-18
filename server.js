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
const PORT = 80;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static("."));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat.html', function(req, res){
  res.sendFile(__dirname + '/chat.html');
});

app.get('/login.html', function(req, res){
  res.sendFile(__dirname + '/login.html');
});

io.on('connection', function(socket){
  console.log('User connected');

  socket.on("signup", function(user) {
    console.log("Username: " + user.username)
    console.log("Password: " + user.password)
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log('Message: ' + msg);
  });

  socket.on('disconnect', function(){
    console.log('User disconnected');
  });

  socket.on('username', function(data){
    console.log('Username: '+ data);
  })
});

http.listen(PORT, function(){
  console.log('listening on 80');
});
