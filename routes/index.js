var express = require('express');
var router = express.Router();
var expressValidator = require('express-validator');
router.use(expressValidator());
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
    var error = req.flash('error');

    if(username == '') {
    res.render('login', {layout: false, error: error});
    }else{
    User.getUserByUsername(username, function(err, user) {
    if(err) throw err;
    if(user) {
    // console.log('User exists');
    res.render('login', {layout: false, username: username, error: error});
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
    console.log("User not logged in");
    req.flash('username', req.body.username);
    req.flash('origin', '/dashboard');
    res.redirect('/login');
    }
});

// Register User
router.post('/register', function(req, res){
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    // req.checkBody('email', 'Email is required').notEmpty();
    // var CS_Class = req.body.CS_class;
    req.checkBody('username', 'Username is required').len(3);

    req.checkBody('email', 'Email is invalid').isEmail();
    req.checkBody('password', 'Password must be at least 8 characters long').len(8);
    req.checkBody('password', 'Password can\'t be longer than 128 characters').not().len(128);

    var errors = req.validationErrors(true);

    var newUser = new User.UserSchema({
    username: username,
    email: email,
    password: password,
    });

    console.log("Validation errors: " + errors);

    User.getUserByUsername(username, function(err, userWithUsername) {
    User.getUserByEmail(email, function(err, userWithEmail) {;
    if (userWithUsername || userWithEmail || errors) {
    if (userWithEmail) console.log("Email taken");
    if (userWithUsername) console.log("Username taken");
    res.render('register', {layout: false, username: username, email: email, usernameTaken: userWithUsername, emailTaken: userWithEmail});
    } else {
    User.createUser(newUser, function(err, user){
    if(err) throw err;
    console.log('--------------------------------------------');
    console.log('User Created ->')
    console.log(user);
    console.log('--------------------------------------------');
    console.log('');
    // req.user = true;
    });
    req.flash('user-created', true);
    req.flash('username', username);
    res.redirect('/login');
    // console.log(req.user);
    }
    });
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
 	passport.authenticate('local', {failureRedirect: '/login', failureFlash: 'Invalid login'}),
    function(req, res) {
    // console.log(req.body.username);
    var origin = req.flash('origin');
    if(!origin || origin == '')
    {
      res.redirect('/');
    }else{
      res.redirect(origin);
    }
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
          user: 'clubcodeassist@gmail.com', // generated ethereal user
          pass: 'codeassistpassword123#abinchris'// generated ethereal password
      },
    tls:{
    rejectUnauthorized:false // if running with localhost
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"Code-Assist.club" <code-assist-club.com>', // sender address
      to: '"abhijay.saini@gmail.com", "christopher.smith4202@gmail.com"',// list of receivers
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

router.get('/post', function(req, res) {
    var newPost = new User.PostSchema({
    name: "Abhijay"
    });

});

module.exports = router;