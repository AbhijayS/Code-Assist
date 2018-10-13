var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var session = require('cookie-session');
var yes_https = require('yes-https');
// var quill = require('quill');
// var toSlash = require('express-to-slash');

// Init App
var app = express();

// Set Port
app.set('port', (process.env.PORT || 8080));
console.log("Server PORT=" + app.get('port'));

var server = app.listen(app.get('port'), function(){
  // console.log('Server started on port '+app.get('port'));
});

// socket.io initialized to be used in projects.js, index.js
var socket = require('socket.io');
var io = socket(server);

module.exports.io = io;
var routes = require('./routes/index');
var com = require('./routes/community');
var men = require('./routes/mentor');
var projects = require('./routes/projects');

app.use(yes_https());

// Create App Instance
var hbs = exphbs({
	defaultLayout: 'layout'
});
// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs);
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// // Express Session
// app.use(session({
//     secret: 'secret',
//     saveUninitialized: true,
//     resave: true
// }));

app.use(session({
	secret: 'secret'
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

app.use(require('connect-flash')());

// Global Vars
app.use(function (req, res, next) {
  // res.locals.success_msg = req.flash('success_msg');
  // res.locals.error_msg = req.flash('error_msg');
  // res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
	res.locals.env = process.env || null;

  next();
});


app.use('/', routes);
// app.use('/users', users);
app.use('/community', com);
// app.use('/mentor', men);

app.use('/projects', projects);
// app.use('/projects/', toSlash('/projects/'));

app.use(function(req, res, next){
  res.status(404).render('_404.handlebars', {layout: 'dashboard-layout'});
});
