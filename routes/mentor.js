var express = require('express');
var router = express.Router();
var User = require('../models/user');
var nodemailer = require('nodemailer');

router.get('/', function(req, res) {
  if(req.user)
  {
    res.render('mentor', {layout: 'dashboard-layout', email: req.user.email});;
  }else{
    req.flash('origin');
    req.flash('origin', '/mentor');
    res.redirect('../login');
  }
});

router.post('/send', function(req, res) {
  if(req.user)
  {
    User.UserSchema.find({title: "mentor"}).populate('private_posts').exec(function(err, mentors) {
      // console.log("Post");
      var question = req.body.question;
      var description = req.body.description;

      var pPost = new User.PostSchema();
      pPost.author = req.user.username;
      pPost.question = question;
      pPost.description = description;

      pPost.save(function(err) {
        if(err) throw err;
        // saved
      });
      req.user.private_posts.push(pPost);
      req.user.save(function(err) {
        if(err) throw err;
        console.log("Private post saved: ");
        console.log(req.user.private_posts);
        // saved
      });

      console.log("---------------------------");
      console.log("List of Mentors:");
      for(var i = 0; i < mentors.length; i++)
      {
        var mentor = mentors[i];
        mentor.private_posts.push(pPost);
        mentor.save(function(err) {
          if(err) throw err;
          // saved
        });
        console.log(i+1 + ". Mentor Name: " + mentor.username);
        console.log(mentor.private_posts);
        console.log('');
        console.log('');
        // send an email to each mentor

        const output = `
          <p>You have a new contact request</p>
          <h2>${question}</h2>
          <h3>Contact Details</h3>
          <ul>
            <li>Userame: ${req.user.username}</li>
            <li>Email: ${req.user.email}</li>
          </ul>
          <h3>Message</h3>
          <p>${description}</p>
        `;

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
          host: 'mail.privateemail.com',
          port: 993, //
          secure: false, // true for 465, false for other ports
          // service: 'gmail',
          auth: {
              user: 'clubcodeassist@gmail.com', // generated ethereal user
              pass: 'codeassistpassword123#abinchris'  // generated ethereal password
          },
          
          tls:{
            rejectUnauthorized:false
          }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Code Assist" <clubcodeassist@gmail.com>', // sender address
            to: 'abhijay.saini@gmail.com, christopher.smith4202@gmail.com, contact@codeassist.club', // list of receivers
            subject: 'User Request', // Subject line
            text: 'Hello world?', // plain text body
            html: output // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
          console.log("Sending Email");
          if (error) {
              return console.log(error);
          }
          console.log('Message sent: %s', info.messageId);
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        });
      }
      res.redirect('/mentor/history');
    });
  }
});

router.get('/history', function(req, res) {
  if(req.user) {
    User.UserSchema.findOne({_id: req.user._id}).populate('private_posts').exec(function(err, user) {
      var allPosts = user.private_posts;
      allPosts.sort(function(date1,date2){
        if (date1 > date2) return -1;
        if (date1 < date2) return 1;
        return 0;
      });
      res.render('mentor-history', {layout: 'dashboard-layout', posts: allPosts});
    });
  }else{
    req.flash('origin');
    req.flash('origin', '/mentor/history');
    res.redirect('../../login');
  }
});

router.get('/history/:id', function(req, res) {
  var postID = req.params.id;
  if(req.user)
  {
    var found = false;
    // console.log('-------------------------');
    // console.log(req.user.private_posts.length);
    // console.log(req.user.private_posts);
    // console.log('');
    // console.log('');
    for (var i = 0; (i < req.user.private_posts.length); i++)
    {
      console.log("Iterating: " + req.user.private_posts[i]);
      if(req.user.private_posts[i] == postID)
      {
        found = true;
        break;
      }
    }

    if(found)
    {
      // console.log("Found: " + found);
      User.PostSchema.findOne({_id: postID}).populate('answers').exec(function(err, post) {
        res.render('mentor-history-post', {layout: 'dashboard-layout', post: post});
      });
    }else{
      res.send("You don't have access to this post");
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/mentor/history/'+postID);
    res.redirect('../../login');
  }

  // res.render('mentor-history-post', {layout: 'dashboard-layout', post: post});

});
module.exports = router;
