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

app.use(express.static("."));

var server = app.listen(PORT, function() {
  console.log("Server running on port 80")
});

var socket = require('socket.io');
var io = socket(server);

io.on('connection', function(socket){
  socket.on("signup", function(user) {
    console.log("Username: " + user.username)
    console.log("Password: " + user.password)
  });
});
