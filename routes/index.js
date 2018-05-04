var express = require('express');
var router = express.Router();
var expressValidator = require('express-validator');
router.use(expressValidator());
var path = require('path');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var nodemailer = require('nodemailer');

// Get Homepage
router.get('/', function(req, res){
    // console.log("Homepage: ");
    // console.log(req.isAuthenticated());
    res.render('index', {layout: 'layout'});
    console.log('============================================');
    console.log("User is isAuthenticated: " + req.isAuthenticated());
    console.log('============================================');
});


// Login
router.get('/login', function(req, res){
  if(req.user) {
    res.redirect('/');
  // console.log('User exists');
  }else{
    var username = req.flash('username');
    var error = req.flash('error');
    //username = abi
    if(username == '') {
      console.log('============================================');
      console.log("Rendering Login from Login");
      console.log("Username: blank");
      console.log('============================================');
      res.render('login', {layout: false, error: error});
    }else{
      User.getUserByUsername(username, function(err, user) {
        if(err) throw err;
        if(user) {
          // console.log('User exists');
          console.log('============================================');
          console.log("Rendering Login from Login");
          console.log("Username exists: " + username);
          console.log('============================================');
          res.render('login', {layout: false, username: username, error: error});
        }else {
          // console.log("Doesn't exist");
          console.log('============================================');
          console.log("Redirecting to: Register from: Login");
          console.log("Username doesn't exist: " + username);
          console.log('============================================');
          req.flash('username', username);
          res.redirect('/register');
        }
      });
    }
  }
});

// Get Contact page
router.get('/contact', function(req, res){
    res.render('contact', {layout: 'dashboard-layout'});
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
    req.flash('origin');
    req.flash('origin', '/dashboard');
    res.redirect('login');
  }
});

router.post('/dashboard', function(req, res) {
    if(req.user) {
      console.log("User is redirected to: Dashboard from: index");
      res.render('dashboard', {layout: 'dashboard-layout'});
    }else {
      // console.log(req.body.username);
      // console.log("User not logged in");
      console.log('============================================');
      console.log("User is redirected to: Login from: Dashboard");
      console.log("Username: " + req.body.username);
      console.log('============================================');
      req.flash('username');
      req.flash('username', req.body.username);
      req.flash('origin');
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
    title: 'user'
  });
  // var check = new RegExp();
  // console.log("Match: " + /^[a-z0-9]+$/.test(username));
  var passwordMatch = req.body.password2 == password;

  try{
    User.getUserByUsername(username, function(err, userWithUsername) {
      User.getUserByEmail(email, function(err, userWithEmail) {
        if (!passwordMatch || userWithUsername || userWithEmail || errors) {
          console.log('============================================');
          if (userWithEmail) console.log("Email taken");
          if (userWithUsername) console.log("Username taken");
          console.log("Redirecting to: Register from: Register");
          console.log('============================================');
          res.render('register', {layout: false, username: username, email: email, usernameTaken: userWithUsername, emailTaken: userWithEmail, notMatch: !passwordMatch});
        } else {
          console.log('============================================');
          console.log("Registering New User");
          console.log("Redirecting to: Login from: Register");
          console.log('============================================');
          User.createUser(newUser, function(err, user){
            if(err) throw err;
            // console.log('--------------------------------------------');
            // console.log('User Created ->')
            // console.log(user);
            // console.log('--------------------------------------------');
            // console.log('');
            // req.user = true;
          });
          req.flash('user-created');
          req.flash('user-created', true);
          req.flash('username');
          req.flash('username', username);
          res.redirect('/login');
          // console.log(req.user);
        }
      });
    });
  } catch(e){
    console.log('============================================');
    console.log("Register page has invalid characters");
    console.log("Redirecting to: Register from: Register");
    console.log('============================================');
    res.render('register', {layout: false, username: username, email: email, invalidChars: true});
  }
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user) {
      if(err) throw err;
      if(!user) {
        return done(null, false);
        // console.log("Unknown user");
      }
      User.comparePassword(password, user.password, function(err, isMatch) {
        if(err) throw err;
        if(isMatch) {
          return done(null, user);
        }else{
          return done(null, false);
          // console.log("Invalid pass");
        }
      });
    });
  }
));

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

router.get('/account', function(req, res) {
  if(req.user) {
    var data = req.flash('account-status');
    if(data[0])
    {
      if(data[0].status == false)
      {
        // console.log("Sending password errors");
        // console.log(data[0].msg);
        res.render('account', {layout: 'dashboard-layout', error: data[0], user: req.user});
      }else{
        // console.log("No errors");
        // console.log(data[0].msg);
        res.render('account', {layout: 'dashboard-layout', success: data[0], user: req.user});
      }

    }else{
      res.render('account', {layout: 'dashboard-layout', user: req.user});
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/account');
    res.redirect('/login');
  }
});

router.post('/username-change', function(req, res) {
  if(req.user)
  {
    var username = req.body.username;
    if(username.length >= 3)
    {
      if(username == req.user.username)
      {
        res.send({status: true});
      }else{
        User.UserSchema.findOne({username: username}, function(err, user) {
          if(user)
          {
            // console.log("Username Exists :(");
            res.send({status: false});
          }else{
            // console.log("Username Doesn't Exist! :)");
            req.user.username = username;
            // console.log(req.user.username);
            req.user.save(function (err) {
              if (err) throw err;
              // saved!
            });
            res.send({status: true});
          }
        });

      }

    }else{
      res.send({status: false});
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/account');
    res.send({url: '/login'});
  }
});

router.post('/email-change', function(req, res) {
  if(req.user)
  {
    var email = req.body.email;
    req.checkBody('email', 'Email is invalid').isEmail();
    var errors = req.validationErrors(true);

    if(errors)
    {
      res.send({status: false});
    }else{
      if(email == req.user.email)
      {
        res.send({status: true});
      }else{
        User.UserSchema.findOne({email: email}, function(err, user) {
          if(user)
          {
            // console.log("Email Exists :(");
            res.send({status: false});
          }else{
            // console.log("Email Doesn't Exist! :)");
            req.user.email = email;
            // console.log(req.user.email);
            req.user.save(function (err) {
              if (err) throw err;
              // saved!
            });
            res.send({status: true});
          }
        });
      }
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/account');
    res.send({url: '/login'});
  }
});

router.post('/password-change', function(req, res) {
  if(req.user)
  {
    var old = req.body.oldPass;
    var newPass = req.body.newPass;
    var conf = req.body.confPass;
    req.checkBody('newPass', 'Password must be at least 8 characters long').len(8);
    req.checkBody('newPass', 'Password can\'t be longer than 128 characters').not().len(128);

    var errors = req.validationErrors(true);
    var sendData = {
      status: true,
      msg: []
    };

    if(errors)
    {
      // console.log("Express validator errors");
      sendData.status = false;
      sendData.msg.push('Invalid Password!');
    }

    if (newPass != conf)
    {
      sendData.status = false;
      sendData.msg.push("Passwords don't match");
    }

    User.comparePassword(old, req.user.password, function(err, match) {
      if(err) throw err;
      if(Boolean(sendData.status) == true)
      {
        if(match == true)
        {
          // console.log("Saving new password");
          User.createHash(newPass, function(err, hash) {
            if(err) throw err;
            req.user.password = hash;
            req.user.save(function (err) {
              if (err) throw err;
              // saved!
            });
          });
          sendData.status = true;
          sendData.msg.push('New password saved!');
        }else{
          sendData.status = false;
          sendData.msg.push('Invalid Password!');
        }
      }
      // console.log("Login status: " + sendData.status);
      // console.log("Msg: " + sendData.msg);
      req.flash('account-status');
      req.flash('account-status', sendData);
      res.redirect('/account');
    });

  }else{
    req.flash('origin');
    req.flash('origin', '/account');
    res.redirect('/login');
  }


});

router.get('/team', function(req, res) {
  res.render('team', {layout: 'dashboard-layout'});
});
/*
=====================================================
                    DEVELOPERS
=====================================================


router.get('/dev', function(req, res) {
  res.render('guinee', {layout: 'test'});
});
*/

module.exports = router;
