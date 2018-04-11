var express = require('express');
var router = express.Router();
var path = require('path');
var User = require('../models/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var nodemailer = require('nodemailer');

// Get Homepage
router.get('/', function(req, res){
	console.log("Homepage: ");
	console.log(req.isAuthenticated());
	res.render('index', {layout: 'layout'});
});

// Login
router.get('/login', function(req, res){
	if(req.user) {
		res.redirect('/');
		// console.log('User exists');
	}else{
		var username = req.flash('username');
		if(username == '') {
			res.render('login', {layout: false});
		}else{
			User.getUserByUsername(username, function(err, user) {
				if(err) throw err;
				if(user) {
					// console.log('User exists');
					req.flash('user-existed', true);
					res.render('login', {layout: false, username: username});
				}else {
					// console.log("Doesn't exist");
					req.flash('username', username);
					res.redirect('/register');
				}
			});
		}
	}
});

// Register
router.get('/register', function(req, res){
	if(req.user) {
		res.redirect('/');
	}else{
		res.render('register', {layout: false, username: req.flash('username')});
	}
});

router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
});

router.get('/dashboard', function(req, res) {
	if(req.user)
	{
		res.render('dashboard', {layout: 'dashboard-layout'});
	}else{
		res.redirect('login');
	}
});

router.post('/dashboard', function(req, res) {
	if(req.user) {
		res.render('dashboard', {layout: 'dashboard-layout'});
	}else {
		// console.log(req.body.username);
		req.flash('username', req.body.username);
		res.redirect('/login');
	}
});

// Register User
router.post('/register', function(req, res){
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	// var CS_Class = req.body.CS_class;
	//
	// req.checkBody('username', 'Username is required').len(3);
	// req.checkBody('email', 'Email is required').notEmpty();
	// req.checkBody('email', 'Email is invalid').isEmail();
	// req.checkBody('password', 'Password must be at least 6 characters long').len(6);
	// req.checkBody('password', 'Password can\'t be longer than 128 characters').not().len(128);
	// req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	//
	var newUser = new User({
		username: username,
		email: email,
		password: password,
	});

	User.getUserByUsername(username, function(err, user) {
		console.log(user);
		if (user) {
			console.log("user exists")
			res.render("register", )
		} else {
			console.log("new user created")
			User.createUser(newUser, function(err, user){
				if(err) throw err;
				console.log('--------------------------------------------');
				console.log('User Created ->')
				console.log(user);
				console.log('');
				console.log('--------------------------------------------');
				// req.user = true;
			});
			console.log("Registered: " + req.user);
			req.flash('user-created', true);
			req.flash('username', username);
			res.redirect('/login');
			// console.log(req.user);
		}
	});
});

passport.use(new LocalStrategy(
  function(username, password, done) {
		User.getUserByUsername(username, function(err, user) {
			if(err) throw err;
			if(!user) {
				return done(null, false, {message: 'Unknown user'});
			}

			User.comparePassword(password, user.password, function(err, isMatch) {
				if(err) throw err;
				if(isMatch) {
					return done(null, user);
				}else{
					return done(null, false, {message: 'Invalid password'});
				}
			});
		});
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
 	passport.authenticate('local', {failureRedirect: '/login'}),
	function(req, res) {
		// console.log(req.body.username);
		if(req.flash('user-existed'))
		{
			res.redirect('dashboard');
		}else{
			res.redirect('/');
		}
});

router.get('/dashboard/mentor', function(req, res) {
	res.render('mentor', {layout: 'dashboard-layout'});
});

router.get('/dashboard/faq', function(req, res) {
	res.render('mentor');
});

router.get('/dashboard/community', function(req, res) {
	res.render('mentor');
});

router.post('/dashboard/send', function(req, res) {
	// console.log(req.body);
	const output = `
		<p>A user has sent a request</p>
		<h3>Contact Details<h2>
		<ul>
			<li>Email: ${req.body.email}</li>
		</ul>
		<h3>Message</h3>
		${req.body.text}
	`;

	// create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
			service: 'gmail',
      auth: {
          user: '', // generated ethereal user
          pass:  ''// generated ethereal password
      },
			tls:{
				rejectUnauthorized:false // if running with localhost
			}
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"Code-Assist.club" <email@a.com>', // sender address
      to: '',// list of receivers
      subject: 'Code-Assist Email', // Subject line
      text: 'This message is directly being sent from code-assist', // plain text body
      html: output // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
			res.render('mentor', {layout: 'dashboard-layout',msg: 'Notification has been sent to the mentors'});

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  });

});

module.exports = router;
