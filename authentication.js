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

//tell express what to do when the /about route is requested
app.post('/login', function(req, res){
    res.setHeader('Content-Type', 'application/json');
    console.log("test")
    //mimic a slow network connection
    // setTimeout(function(){

    //     res.send(JSON.stringify({
    //         firstName: req.body.firstName || null,
    //         lastName: req.body.lastName || null
    //     }));

    // }, 1000)

    //debugging output for the terminal
    // console.log('you posted: First Name: ' + req.body.firstName + ', Last Name: ' + req.body.lastName);
});