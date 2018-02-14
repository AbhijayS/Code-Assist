var io = require('socket.io')(app);
var fs = require('fs');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.listen(80, function() {
  console.log("Server running on port 80")
});

//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.post('/login.html', function(req, res){
	res.setHeader('Content-Type', 'application/json');
	console.log(req.body.email)
	console.log(req.body.password)
});