var express = require('express');
var router = express.Router();
var expressValidator = require('express-validator');
router.use(expressValidator());
var bcrypt = require('bcryptjs');
var path = require('path');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
const sgMail = require('@sendgrid/mail');
var QuillDeltaToHtmlConverter = require('quill-delta-to-html');
var mongoose = require('mongoose');
var multer = require('multer');
var uploadNoDest = multer();
var profilePicUpload = require('../database').profilePicUpload;
var request = require('superagent');
var server = require('../app').server;
var socket = require('socket.io');
// var io=socket(server);
var io = require('../app').io;
const nanoid = require('nanoid');

var mailchimpInstance   = process.env.MAILCHIMP_SERVER_INSTANCE,
    listUniqueId        = process.env.MAILCHIMP_LIST,
    mailchimpApiKey     = process.env.MAILCHIMP_API_KEY;

var saltRounds=10;
const safe_chars = 50;

router.get('/plans', function(req, res){
    res.render('plans', {layout: 'dashboard-layout'});
});

// Get current user
router.post('/current-user', function(req, res) {
  if(req.user)
    res.send(req.user);
  else
    res.send(null);
});

// Get Homepage
router.get('/', function(req, res){
    // console.log("Homepage: ");
    // console.log(req.isAuthenticated());
    // console.log('============================================');
    // console.log("User is isAuthenticated: " + req.isAuthenticated());
    var deleted = req.flash('account-deleted');
    // console.log("User Account Deleted: " + deleted);

    if(deleted == 'true')
    {
      console.log("Rendering Deleted Account Page");
      console.log('============================================');
      res.render('account-deleted', {layout: 'dashboard-layout'});
    }else{
      console.log('============================================');
      res.render('index', {layout: 'layout'})

    }
});


// Login
router.get('/login', function(req, res){
  if(req.user) {
    res.redirect('/');
  }else{
    var username = req.flash('username');
    var error = req.flash('error');
    //username = abi
    if(username == '') {
      console.log('============================================');
      console.log("Rendering Login from Login");
      console.log("Username: blank");
      console.log('============================================');
      res.render('login', {layout: 'dashboard-layout', error: error});
    }else{
      User.getUserByUsername(username, function(err, user) {
        if(err) throw err;
        if(user) {
          // console.log('User exists');
          console.log('============================================');
          console.log("Rendering Login from Login");
          console.log("Username exists: " + username);
          console.log('============================================');
          res.render('login', {layout: 'dashboard-layout', username: username, error: error});
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

// Contact feedback form
router.post('/contact', uploadNoDest.array('file'), function(req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var subject = req.body.subject;
  var description = req.body.description;
  var files = req.files;

  console.log("name: " + name);
  console.log("email: " + email);
  console.log("subject: " + subject);
  console.log("description: " + description);

  if (!name || !email || !subject || JSON.parse(description)[0].insert == "\n") {
    res.end();
    return;
  }

  if(req.user && (req.user.title!='mentor')) {
    req.user.qualities.assists += 10;
    User.updateRank(req.user);
  }
  // For generating quill HTML
  var converter = new QuillDeltaToHtmlConverter(JSON.parse(description), {});
  // var imageCounter = 0;

  converter.afterRender(function(groupType, htmlString){
    htmlString = htmlString.replace(/<pre>/g, "<pre style='background-color: #23241f;color: #f8f8f2;overflow: visible;white-space: pre-wrap;margin-bottom: 5px;margin-top: 5px;padding: 5px 10px;border-radius: 3px;'>");

    htmlString = htmlString.replace(/<img([\w\W]+?)>/g, function() {
      return "<strong>[Imaged inserted]</strong>"
      // return `<img src='http://codeassist.org/mentor/history/${pPost._id}/image/${imageCounter++}'/>`
    });

    return htmlString;
  });

  var quillHTML = converter.convert();

  var attachments = [];
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    attachments.push({
      content: Buffer.from(file.buffer).toString('base64'),
      filename: file.originalname,
      type: file.mimetype,
      disposition: 'attachment'
    });
  }

  User.UserSchema.find({title: "mentor"}, function(err, mentors) {
      for (var i = 0; i < mentors.length; i++) {
        var mentor = mentors[i];

        console.log('============================================');
        console.log("Sending Email ...");
        console.log(i+1 + ". Mentor Name: " + mentor.username);
        console.log(i+1 + ". Mentor Email: " + mentor.email);
        console.log('============================================');

        const output = `
          <p>Hi ${mentor.username},</p>
          <p>A user recently left feedback through the contact page.</p>
          <h2>Feedback Details</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr>
          ${quillHTML}
        `;

        const msg = {
          to: mentor.email,
          from: `Code Assist <${process.env.SENDER_EMAIL}>`,
          subject: 'Code Assist Feedback | ' + subject,
          html: output,
          attachments: attachments
        };
        sgMail.send(msg);
      }
  });

  res.send(true);
});

// Register
router.get('/register', function(req, res){
    if(req.user) {
      res.redirect('/');
    }else{
      res.render('register', {layout: 'dashboard-layout', username: req.flash('username')});
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

  const regex = /^[a-z][a-z0-9_\.]{2,24}$/i;
  if(!regex.exec(username))
    var invalidUsername = true;

  req.checkBody('email', 'Email is invalid').isEmail();
  req.checkBody('password', 'Password must be at least 8 characters long').len(8);
  req.checkBody('password', 'Password can\'t be longer than 128 characters').not().len(128);

  var errors = req.validationErrors(true);

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  };

  var newUser = new User.UserSchema({
    username: username,
    email: email,
    password: password,
    title: 'user',
    pic: "https://github.com/identicons/"+ username + ".png",
    profile_url: username + "-" + getRandomInt(2001, 9000)
  });

  try{
    User.getUserByUsername(username, function(err, userWithUsername) {
      User.getUserByEmail(email, function(err, userWithEmail) {
        if (invalidUsername || userWithUsername || userWithEmail || errors) {
          console.log('============================================');
          if (userWithEmail) console.log("Email taken");
          if (userWithUsername) console.log("Username taken");
          console.log("Redirecting to: Register from: Register");
          console.log('============================================');
          res.render('register', {layout: 'dashboard-layout', username: username, email: email, usernameTaken: userWithUsername, emailTaken: userWithEmail, invalidUsername: invalidUsername, invalidEmail: errors.email, invalidPassword: errors.password});
        } else {
          User.createUser(newUser, function(err, user){
            if(err) throw err;
            if(user) {
              // log in user after created
              passport.authenticate('local')(req, res, function () {
                  request
                  .post('https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + listUniqueId + '/members/')
                  .set('Content-Type', 'application/json;charset=utf-8')
                  .set('Authorization', 'Basic ' + new Buffer('any:' + mailchimpApiKey ).toString('base64'))
                  .send({
                    'email_address': email,
                    'status': 'subscribed',
                    'merge_fields': {
                      'FNAME': req.body.firstName,
                      'LNAME': req.body.lastName
                    }
                  }).end(function(err, response) {
                    if (response.status < 300 || (response.status === 400 && response.body.title === "Member Exists")) {
                      // sign up successful
                      res.redirect('/account');
                    } else {
                      // res.send('Sign Up Failed :( Sorry, this is on our end');
                      res.redirect('/login');
                    }
                });
              })
            }
            // console.log(req.user);
          });
        }
      });
    });
  } catch(e){
    console.log('============================================');
    console.log("Register page has invalid characters");
    console.log("Redirecting to: Register from: Register");
    console.log('============================================');
    res.render('register', {layout: 'dashboard-layout', username: username, email: email, invalidChars: true});
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
    console.log("New username:", username);
    const regex = /^[a-z][a-z0-9_\.]{2,24}$/i;
    if(regex.exec(username)) {
      if(username == req.user.username)
      {
        res.send({status: true});
      }else{
        User.UserSchema.findOne({username: username}, function(err, user) {
          if(user)
          {
            res.send({status: false, message: 'Username already exists.'});
          }else{
            req.user.username = username;
            req.user.save(function (err) {
              if (err) throw err;
              // saved!
            });
            res.send({status: true});
          }
        });
      }

    }else{
      res.send({status: false, message: 'Invalid username!'});
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/account');
    res.send({url: '/login'});
  }
});

router.post('/first-name-change', function(req, res) {
  var firstName = req.body.firstName;
  if(req.user) {
    console.log(firstName);
    if(firstName && firstName.length >=1) {
      req.user.first = firstName;
      req.user.save(function (err) {
        if (err) throw err;
        // saved!
      });
      res.send({auth: true});
    }else{
      res.send({auth: false, message: 'Invalid characters.'});
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/account');
    res.send({url: '/login'});
  }
});

router.post('/last-name-change', function(req, res) {
  var lastName = req.body.lastName;
  if(req.user) {
    if(lastName && lastName.length >=1) {
      req.user.last = lastName;
      req.user.save(function (err) {
        if (err) throw err;
        // saved!
      });
      res.send({auth: true});
    }else{
      res.send({auth: false, message: 'Invalid characters!'});
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/account');
    res.send({url: '/login'});
  }
});

router.post('/change-bio', function(req, res) {
  var newBio = req.body.bio;
  if(req.user) {
    if(newBio.length <= 120) {
      if(newBio.length > 0) {
        req.user.bio = newBio;
        req.user.save(function(err) {
          if(err) throw err;
          // saved!
          res.send({auth: true});
        });
      }else{
        res.send({auth: false});
      }
    }else{
      res.send({auth: false, message: "Must be less than 120 characters"})
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/account');
    res.send({auth: false, url: '/login'});
  }
})
router.post('/profile-pic-change', profilePicUpload.single('file'), function(req, res) {
  // console.log("profile pic change");
  // console.log(req.file);
  if(req.user)
  {
    User.UserSchema.findOne({_id: req.user._id}, function(err, user) {
      if (user.pic && user.pic.split("/profilePic/")[1]) {
        var fileID = new mongoose.mongo.ObjectId(user.pic.split("/profilePic/")[1]);
        gfs.exist({_id: fileID, root: 'profilePics'}, function (err, found) {
          if (err) throw err;
          if (found) {
            gfs.remove({_id: fileID, root: 'profilePics'}, function (err) {
              if (err) throw err;
            });
          }
        });
      }

      if (req.file) {
        user.pic = '/profilePic/' + req.file.id;
      } else {
        user.pic = "https://github.com/identicons/"+ user.username + ".png"
      }

      res.send({pic: user.pic});

      user.save(function (err) {
        if (err) throw err;
      });
    });
  }else{
    req.flash('origin');
    req.flash('origin', '/account');
    res.send({url: '/login'});
  }
});

router.get('/profilePic/:fileID', (req, res) => {
  // converts fileID into object id
  // allows for file searching by _id
  var fileID = new mongoose.mongo.ObjectId(req.params.fileID);
  gfs.collection('profilePics').findOne({_id: fileID}, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');

    const readstream = gfs.createReadStream(file.filename);
    readstream.pipe(res);
  });
});

router.post('/email-change', function(req, res) {
  if(req.user)
  {
    var email = req.body.email;
    req.checkBody('email', 'Email is invalid').isEmail();
    var errors = req.validationErrors(true);

    if(errors)
    {
      res.send({status: false, message: "Invalid Email."});
    }else{
      if(email == req.user.email)
      {
        res.send({status: true});
      }else{
        User.UserSchema.findOne({email: email}, function(err, user) {
          if(user)
          {
            // console.log("Email Exists :(");
            res.send({status: false, message: "Email has been taken."});
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

router.post('/delete-account', function(req, res) {
    if(req.user) {
      User.UserSchema.findOne({_id: req.user._id}).remove(function(err) {
        User.PostSchema.find({authorid:req.user._id}).remove(function(err){
          if(err) throw err;
          //console.log("removing users posts");
      });
        if(err) throw err;
        console.log('============================================');
        console.log('User Account Deleted');
        console.log('User is redirected to: Home from: Account');
        console.log('============================================');
        req.flash('account-deleted');
        req.flash('account-deleted', true);
        res.send("/");
      });
    }else {
      console.log('============================================');
      console.log("User is redirected to: Login from: Account");
      console.log("Username: " + req.body.username);
      console.log('============================================');
      req.flash('origin');
      req.flash('origin', '/account');
      res.redirect('/login');
    }
});

router.get('/team', function(req, res) {
  res.render('team', {layout: 'dashboard-layout'})
});

//password forget functions
// router.get('/forgotpass',function(req,res){
//   res.render('forgotpass',{layout:'layout'})
// });
//
// router.post('/resetpass',function(req,res){
//   if(req.body.username){
//   //  console.log(req.body.code+"   "+req.body.username);
//     User.UserSchema.findOne({username:req.body.username},function(err,user){
//       if(req.body.code==user.forgotpasscode){
//         res.send(true);
//       }
//     });
//   }
// });

//where the actual resetting happens
// router.post('/makenewpass',function(req,res){
//   if(req.body.username!="undefined"){
//     console.log(req.body.newpass+" "+req.body.username)
//     res.send("message recieved, making new password");
//       //encryption for the new password
//     User.UserSchema.findOne({username:req.body.username},function(err,user){
//       if(err){
//         console.log(err);
//       }
//       bcrypt.genSalt(saltRounds, function(err, salt) {
//   	     bcrypt.hash(req.body.newpass, salt, function(err, hash) {
//   	        console.log(hash);
//             user.password=hash;
//             user.save(function(err){
//               if(err){
//                 console.log(err);
//               }
//             })
//   	     });
//   	   });
//     });
//   }
// });

router.post('/reset-password',function(req,res){
  var email = req.body.email;
  User.UserSchema.findOne({email: email}, function(err, user) {
    if(err) throw err;

    if(user) {
      if(user.password_reset_attempts < 3) {
        var secret = nanoid(safe_chars);
        user.forgotpass_link = secret;
        user.password_reset_attempts = user.password_reset_attempts + 1;

        user.save(function (err) {
          if (err) throw err;

          var resetLink = "http://codeassist.org/forgot_pass/" + user.id + "/" + secret;
          const output = `
            <p>Hi ${user.username},</p>
            <p>We are sorry to know that you lost your account. Use this link to reset your password: ${resetLink}.</p>
            <p>If you don't recognize this activity, please contact Code Assist at contact@codeassist.org and we will try to help resolve the issue.</p>
          `;

          const msg = {
            to: user.email,
            from: `Code Assist <${process.env.SENDER_EMAIL}>`,
            subject: 'Code Assist Password Recovery Link',
            html: output,
          };
          sgMail.send(msg);
          res.send({auth: true});
        });
      }else{
        res.send({auth: false, message: "Reached maximum password reset attempts"});
      }
    }else{
      res.send({auth: false, message: "Invalid email"});
    }
  });
});

router.get("/forgot_pass/:userid/:secretid", function(req, res) {
  var userID = req.params.userid;
  var secretID = req.params.secretid;

  User.UserSchema.findOne({_id: userID}, function(err, user) {
    if(err) throw err;
    if(user) {
      if(user.forgotpass_link == secretID) {
        if(user.forgotpasslastattempt) {
          User.isLinkValid(user.forgotpasslastattempt, new Date(), 2, function(valid) {
            if(valid) {
              // forgot password link valid
              res.render('login', {layout: 'dashboard-layout', password_recovery: user.username});
            }else{
              // forgot password link not valid
              user.forgotpass_link = "";
              user.password_reset_attempts = 0;
              res.render('login', {layout: 'dashboard-layout', link_expired: true});
            }
          });
        }else{
          user.forgotpasslastattempt = new Date();
          user.save(function (err) {
            if (err) throw err;
            res.render('login', {layout: 'dashboard-layout', password_recovery: user.username});
          });
        }
      }else{
        res.redirect('/login');
      }
    }else{
      // not found
      res.redirect('/');
    }
  });
});

router.post("/forgot_pass/:userid/:secretid", function(req, res) {
  var userID = req.params.userid;
  var secretID = req.params.secretid;

  User.UserSchema.findOne({_id: userID}, function(err, user) {
    if(err) throw err;
    if(user) {
      if(user.forgotpass_link == secretID) {
        // take care of link expiration here later
        var newPass = req.body.newPassword;
        var confirmPass = req.body.confirmPassword;

        if((newPass) && (confirmPass) && (newPass.length >= 8) && (newPass.length <= 128))
        {
          if(newPass == confirmPass) {
            User.createHash(newPass, function(err, hash) {
              if(err) throw err;
              user.password = hash;
              user.save(function (err) {
                if (err) throw err;
                // saved!
                req.body.password = newPass;
                req.body.username = user.username;
                var sendData = {
                  status: true,
                  msg: []
                };
                passport.authenticate('local')(req, res, function () {
                  // console.log("authenticated");
                  sendData.status = true;
                  sendData.msg.push("Password successfully changed");
                  req.flash('account-status');
                  req.flash('account-status', sendData);
                  user.forgotpass_link = "";
                  user.password_reset_attempts = 0;
                  user.forgotpasslastattempt = null;
                  user.save(function (err) {
                    if (err) throw err;
                    res.send({auth: true});
                  });
                });
              });
            });
          }else{
            res.send({auth: false, message: "Passwords don't match"});
          }

        }else{
          res.send({auth: false, message: "Invalid password length"})
        }
      }else{
        res.redirect('/login');
      }
    }else{
      // not found
      res.redirect('/');
    }
  });
});

function Notify(userid,message){
  //console.log("Notify user"+userid);
  this.nnsp=io.of("/Notify"+userid);
  this.nnsp.on('connection',function(socket){
  //  console.log("connected21");
  });

  User.UserSchema.findOne({_id:userid},function(err,user){
    if(user){
      this.nnsp.emit('notify',message);
    }
  });
}
/*
=====================================================
                        BLOG
=====================================================
*/

// router.get('/blog', function(req, res){
//   res.render('blog', {layout: 'blog-layout'});
// })
//
// router.get('/blog/:name', function(req, res){
//   res.render(req.params.name, {layout: 'blog-layout'}, function(err){
//     if(err){
//       res.redirect('/urldoesntexist');
//     }else{
//       res.render(req.params.name, {layout: 'blog-layout'});
//     }
//   });
// });

router.get('/users/profile/:id', function(req, res) {
  var userID = (req.params.id);

  if(req.user) {
    User.UserSchema.findOne({_id: userID}).populate({
      path: 'posts',
      populate: {path: 'answers'}
    }).exec(function(err, user) {
      if(err) throw err;
      if(user) {
        if(user.profile.status == "public") {
          var person = {
            username: user.username,
            bio: user.bio,
            pic: user.pic,
            firstName: user.first,
            lastName: user.last,
            numPosts: user.posts.length,
            qualities: user.qualities
          };
          if(req.user._id == req.params.id) {
            // user viewing himself
            res.render('user-profile', {layout: 'dashboard-layout', profile: person, viewing: true});
          }else{
            // someone viewing user
            res.render('user-profile', {layout: 'dashboard-layout', profile: person});
          }
        }else{
          res.redirect('/');
        }
      }else{
        res.redirect('/');
      }
    })
  }else{
    req.flash('origin');
    req.flash('origin', '/users/profile/'+req.params.id);
    res.redirect('/login');
  }
});

/*
=====================================================
                    DEVELOPERS
=====================================================
*/
router.get('/admin', function(req, res){
  var auth = req.flash('admin-page');
  if(auth[0] == true) {
    res.render('admin', {isAuthorized: true, layout: 'dashboard-layout'});
  }else{
    res.render('admin', {isAuthorized: (req.user) ? ((req.user.title == 'mentor') ? true : false) : false, layout: 'dashboard-layout'});
  }
});

router.post('/admin', function(req, res){
  var password = req.body.password;
  if(process.env.ADMIN_PASSWORD == password){
    req.flash('admin-page');
    req.flash('admin-page', true);
    res.send({auth: true});
  }else{
    res.send({auth: false});
  }
});

router.get('/test', function(req, res) {
  res.render('login-test', {layout: 'dashboard-layout'});
});

router.get('/:userid-:randomNum', function(req, res) {
  console.log("TEst");
  console.log(req.params.userid);
  console.log(req.params.randomNum);
});

module.exports = router;
