var express = require('express');
var router = express.Router();
var path = require('path');
var User = require('../models/user');

// Get Homepage
router.get('/', function(req, res){
	res.render('index', {layout: 'layout'});
});

// Login
router.get('/login', function(req, res){
	res.render('login', {layout: false});
});

// Register
router.get('/register', function(req, res){
	res.render('register', {layout: false});
});

// Register User
router.post('/register', function(req, res){
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	// var CS_Class = req.body.CS_class;

	req.checkBody('username', 'Username is required').len(3);
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is invalid').isEmail();
	req.checkBody('password', 'Password must be at least 6 characters long').len(6);
	req.checkBody('password', 'Password can\'t be longer than 128 characters').not().len(128);
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var newUser = new User({
		username: username,
		email: email,
		password: password,
	});
	User.createUser(newUser, function(err, user){
		if(err) throw err;
		console.log('--------------------------------------------');
		console.log('User Created ->')
		console.log(user);
		console.log('');
		console.log('--------------------------------------------');

	});
	res.redirect('register');
});

module.exports = router;
