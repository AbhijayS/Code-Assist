var express = require('express');
var bodyParser = require('body-parser');
var app     = express();

//Note that in version 4 of express, express.bodyParser() was
//deprecated in favor of a separate 'body-parser' module.
app.use(bodyParser.urlencoded({ extended: true }));

//app.use(express.bodyParser());

app.post('/submit', function(req, res) {
  console.log('You sent the name "' + req.body.name);
  res.send('You sent the name "' + req.body.name + '".');
});

app.listen(8080, function() {
  console.log('Server running at http://127.0.0.1:8080/');
});
