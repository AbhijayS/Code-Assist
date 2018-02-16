/*
SOCKET.IO
*/

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const PORT = 8080;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/chat.html');
});

io.on('connection', function(socket){
  console.log('A user connected');

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log('Message: ' + msg);
  });

  socket.on('disconnect', function(){
    console.log('User disconnected');
  });
});

http.listen(PORT, function(){
  console.log('listening on 80');
});

/*

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io');
var bodyParser = require('body-parser');

EXPRESS SERVER
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', function(req, res){
  console.log("Client connected");
  res.sendFile(__dirname + '/index.html');
});

app.post('', function(req, res){
  //res.redirect(303, '/');
  //res.end('End');
  console.log('Message: ' + req.body.msg);
  //io.socket.emit('message', req.body.msg);

})

app.listen(PORT, function() {
  console.log("Server running on port 80")
});
*/
