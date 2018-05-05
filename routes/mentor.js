var express = require('express');
var router = express.Router();
var User = require('../models/user');
// var nodemailer = require('nodemailer');
require('dotenv').config();

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


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

router.post('/post', function(req, res) {
  if(req.user)
  {
    var question = req.body.question;
    var description = req.body.description;

    var questionInvalid = false;
    var descriptionInvalid = false;

    if (question.length == 0)
      questionInvalid = true;

    if (JSON.parse(description)[0].insert == "\n") {
      descriptionInvalid = true;
    }

    // console.log("description: " + description);
    if (questionInvalid || descriptionInvalid) {
      var data = {
        questionInvalid: questionInvalid,
        descriptionInvalid: descriptionInvalid
      }
      res.send(data);
      return;
    }

    User.UserSchema.find({title: "mentor"}).populate('private_posts').exec(function(err, mentors) {
      // console.log("Post");

      var pPost = new User.PostSchema();
      pPost.author = req.user.username;
      pPost.question = question;
      pPost.description = description;
      pPost.prog_lang = req.body.programming;

      pPost.save(function(err) {
        if(err) throw err;
        // saved
      });
      req.user.private_posts.push(pPost);
      req.user.save(function(err) {
        if(err) throw err;
        console.log("Private post saved");
        // console.log(req.user.private_posts);
        // saved
        var data = {
          questionInvalid: questionInvalid,
          descriptionInvalid: descriptionInvalid,
          url: "/mentor/history/" + pPost._id
        }
        res.send(data);
      });

      // console.log("---------------------------");
      // console.log("List of Mentors:");
      for (var i = 0; i < mentors.length; i++)
      {
        var mentor = mentors[i];
        mentor.private_posts.push(pPost);
        mentor.save(function(err) {
          if(err) throw err;
          // saved
        });
        console.log('============================================');
        console.log("Sending Email ...");
        console.log("User: " + req.user.username);
        console.log(i+1 + ". Mentor Name: " + mentor.username);
        console.log(i+1 + ". Mentor Email: " + mentor.email);
        console.log('============================================');

        const output = `
          <p>Hi ${mentor.username},</p>
          <p>A User recently sent a new request:</p>
          <strong><p>${question}</p></strong>

          <h3>Contact details:</h3>
          <ul>
            <li>Date Replied: ${pPost.timestamp}</li>
            <li>User's Name: ${req.user.username}</li>
            <li>User's Email: ${req.user.email}</li>
            <li>Link: <a href="http://localhost:3000/mentor/history/${pPost._id}">Post</a></li>
          </ul>

          <h3>User Request</h3>
          <p>${description}</p>
        `;

        const msg = {
          to: mentor.email,
          from: process.env.SENDER_EMAIL,
          subject: 'New User Query | ' + question,
          html: output
        };
        sgMail.send(msg);
      }
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
      // console.log("Iterating: " + req.user.private_posts[i]);
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
        res.render('mentor-history-post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer')});
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

router.post('/history/:id/answer', function(req, res) {

  var postID = req.params.id;
  // console.log("Id: " + postID);
  var message = req.body.answer;

  if(req.user)
  {
    // console.log("User exists");
    var author = req.user.username;

    User.PostSchema.findOne({_id: postID}).populate('answers').exec(function(err, post) {
      var newAnswer = new User.AnswerSchema();
      newAnswer.answer = message;
      newAnswer.author = author;

      newAnswer.save(function(err) {
        if(err) throw err;
        // saved
      });

      post.answers.push(newAnswer);
      post.save(function(err) {
        if(err) throw err;
        // console.log("Answer saved");
      });

      if(req.user.title == 'mentor')
      {
        const output = `
          <p>Hi ${author},</p>
          <p>A Mentor has recently replied to your question:</p>
          <p>${post.question}</p>

          <h3>Contact details:</h3>
          <ul>
            <li>Date Replied: ${newAnswer.timestamp}</li>
            <li>Mentor Name: ${req.user.username}</li>
            <li>Mentor Email: ${req.user.email}</li>
            <li>Link: localhost:3000/mentor/history/${postID}</li>
          </ul>

          <h3>Mentor's Reply</h3>
          <p>${message}</p>
        `;

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
          host: 'mail.privateemail.com',
          port: 465, //
          secure: true, // true for 465, false for other ports
          // service: 'gmail',
          auth: {
              user: 'contact@codeassist.club', // generated ethereal user
              pass: 'codeassistpassword123#abinchris'  // generated ethereal password
          }
        });

        User.UserSchema.findOne({username: post.author}, function(err, user) {

          // setup email data with unicode symbols
          let mailOptions = {
            from: '"Code Assist" <contact@codeassist.club>', // sender address
            to: user.email,
            subject: 'New Mentor Reply | ' + post.question, // Subject line
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

        });

      }else{
        User.UserSchema.find({title: "mentor"}).populate('private_posts').exec(function(err, mentors) {
          for (var i = 0; i < mentors.length; i++)
          {
            const output = `
              <p>Hi ${mentors[i].username},</p>
              <p>A User has recently replied to a post:</p>
              <p>${post.question}</p>

              <h3>Contact details:</h3>
              <ul>
                <li>Date Replied: ${newAnswer.timestamp}</li>
                <li>User's Name: ${req.user.username}</li>
                <li>User's Email: ${req.user.email}</li>
                <li>Link: localhost:3000/mentor/history/${postID}</li>
              </ul>

              <h3>User's Reply</h3>
              <p>${message}</p>
            `;

            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
              host: 'mail.privateemail.com',
              port: 465, //
              secure: true, // true for 465, false for other ports
              // service: 'gmail',
              auth: {
                user: 'contact@codeassist.club', // generated ethereal user
                pass: 'codeassistpassword123#abinchris'  // generated ethereal password
              }
            });

            // setup email data with unicode symbols
            let mailOptions = {
              from: '"Code Assist" <contact@codeassist.club>', // sender address
              to: mentors[i].email, // list of receivers
              subject: 'New User Reply | ' + post.question, // Subject line
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
        });
      }
      res.send('/mentor/history/'+postID);
    });
  }else{
    req.flash('origin');
    req.flash('saved_answer');

    req.flash('origin', '/mentor/history/'+postID);
    req.flash('saved_answer', message);
    res.send('/login');
  }
});

router.post('/history/filter', function(req, res) {
  if(req.user) {
    var option = req.body.filter_opt;
    console.log("Made filter request: " + option);
    if(option == "Remove Filter")
    {
      console.log("Filter Removed");
      User.UserSchema.findOne({}).populate('private_posts').exec(function(err, user) {
        var allPosts = user.private_posts;

        allPosts.sort(function(date1,date2){
          if (date1 > date2) return -1;
          if (date1 < date2) return 1;
          return 0;
        });

        if(err) throw err;
        // console.log(community);
        // console.log(community.posts);
        res.send(allPosts);
      });

    }else{
      User.UserSchema.findOne({}).populate('private_posts').exec(function(err, user) {
        if(err) throw err;
        var allPosts = user.private_posts;

        allPosts.sort(function(date1,date2){
          if (date1 > date2) return -1;
          if (date1 < date2) return 1;
          return 0;
        });

        var sendPosts = [];
        for (var i = 0; i < allPosts.length; i++)
        {
          if(allPosts[i].prog_lang == option)
          {
            console.log("Found same");
            sendPosts.push(allPosts[i]);
          }
        }
        // console.log(community);
        // console.log(community.posts);
        res.send(sendPosts);
      });
    }

  }else{
    req.flash('origin');
    req.flash('origin', '/mentor/history/');
    res.send({url: '/login'});
  }

});
module.exports = router;
