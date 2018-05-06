var express = require('express');
var router = express.Router();
var User = require('../models/user');
var upload = require('../database').upload;
var mongoose = require('mongoose');
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

router.post('/post', upload.array('file'), function(req, res) {
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
      for (var i = 0; i < req.files.length; i++) {
        // console.log(req.files[i]);

        // new file reference
        var newFileRef = new User.FileRefSchema();
        newFileRef.name = req.files[i].filename;
        newFileRef.fileID = req.files[i].id;
        newFileRef.save(function(err) {
          if(err) throw err;
          // saved
        });
        pPost.files.push(newFileRef);
      }

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
        console.log('============================================');
        console.log("Sending Email ...");
        console.log("User: " + req.user.username);
        console.log(i+1 + ". Mentor Name: " + mentor.username);
        console.log(i+1 + ". Mentor Email: " + mentor.email);
        console.log('============================================');

        const output = `
          <p>Hi ${mentor.username},</p>
          <p>A User recently asked a new question to the mentors.</p>
          <h2>New Question Details<h2>
          <hr>

          <h3>Question</h3>
          <p>${question}</p>
          <h3>Description</h3>
          <strong><p>${description}</p></strong>

          <h3>Contact details</h3>
          <ul>
            <li>Date Posted: ${pPost.timestamp}</li>
            <li>User's Name: ${req.user.username}</li>
            <li>User's Email: ${req.user.email}</li>
            <li>Link: <a href="https://codeassist.club/mentor/history/${pPost._id}">Post</a></li>
          </ul>
        `;

        const msg = {
          to: mentor.email,
          from: `Code Assist <${process.env.SENDER_EMAIL}>`,
          subject: 'New Private Question | ' + question,
          html: output
        };
        sgMail.send(msg);
      }
    });
  }
});

router.get('/file/:fileID', (req, res) => {
  // converts fileID into object id
  // allows for file searching by _id
  var fileID = new mongoose.mongo.ObjectId(req.params.fileID);
  gfs.files.findOne({_id: fileID}, (err, file) => {
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

router.get('/history', function(req, res) {
  if(req.user) {
    if(req.user.title == 'mentor')
    {
      User.PostSchema.find({}, function(err, posts) {
        var allPosts = posts;
        allPosts.sort(function(date1,date2){
          if (date1 > date2) return -1;
          if (date1 < date2) return 1;
          return 0;
        });
        res.render('mentor-history', {layout: 'dashboard-layout', posts: allPosts});
      })
    }else{
      User.UserSchema.findOne({_id: req.user._id}).populate('private_posts').exec(function(err, user) {
        var allPosts = user.private_posts;
        allPosts.sort(function(date1,date2){
          if (date1 > date2) return -1;
          if (date1 < date2) return 1;
          return 0;
        });
        res.render('mentor-history', {layout: 'dashboard-layout', posts: allPosts});
      });
    }
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
    // var found = false;
    // // console.log('-------------------------');
    // // console.log(req.user.private_posts.length);
    // // console.log(req.user.private_posts);
    // // console.log('');
    // // console.log('');
    // for (var i = 0; (i < req.user.private_posts.length); i++)
    // {
    //   // console.log("Iterating: " + req.user.private_posts[i]);
    //   if(req.user.private_posts[i] == postID)
    //   {
    //     found = true;
    //     break;
    //   }
    // }
    if(req.user.title == 'mentor')
    {
      User.PostSchema.findOne({_id: postID}).populate(['answers', 'files']).exec(function(err, post) {
        res.render('mentor-history-post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer')});
      });
    }else{
      User.userHasPrivatePostById(req.user._id, postID, function(found) {
        if(found == true)
        {
          // console.log("Found: " + found);
          User.PostSchema.findOne({_id: postID}).populate(['answers', 'files']).exec(function(err, post) {
            res.render('mentor-history-post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer')});
          });
        }else{
          // console.log("Found: " + found);
          res.render('private-post.handlebars', {layout: 'dashboard-layout'});
        }
      });
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/mentor/history/'+postID);
    res.redirect('../../login');
  }

});

router.post('/history/:id/answer', function(req, res) {

  var postID = req.params.id;
  // console.log("Id: " + postID);
  var message = req.body.answer;
  var author = req.user.username;

  if(req.user)
  {
    if(req.user.title == 'mentor')
    {
      User.PostSchema.findOne({_id: postID}).populate('answers').exec(function(err, post) {
        if(err) throw err;
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

        const output = `
          <p>Hi ${post.author},</p>
          <p>A Mentor has recently replied to your question:</p>
          <h2>New Answer Details</h2>
          <hr>

          <h3>Link to the <a href="https://codeassist.club/mentor/history/${postID}">Answer</a></h3>

          <h3>Contact details</h3>
          <ul>
            <li>Date Replied: ${newAnswer.timestamp}</li>
            <li>Mentor Name: ${author}</li>
            <li>Mentor Email: ${req.user.email}</li>
            <li><a href="https://codeassist.club/team">About the Mentors</a></li>
          </ul>
        `;

        User.UserSchema.findOne({username: post.author}, function(err, user) {
          const msg = {
            to: user.email,
            from: `Code Assist <${process.env.SENDER_EMAIL}>`,
            subject: 'New Mentor Answer to Private Post',
            html: output
          };

          sgMail.send(msg);
          console.log('============================================');
          console.log("Sending Email to User ... ");
          console.log("User's Username: " + author);
          console.log("Redirecting to: Specific Private post page from: Specific Private post page");
          console.log('============================================');
          res.send('/mentor/history/'+postID);
        });
      });
    }else{
      User.userHasPrivatePostById(req.user._id, postID, function(found) {
        if(found == true)
        {
          User.PostSchema.findOne({_id: postID}).populate('answers').exec(function(err, post) {
            if(err) throw err;
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

            User.UserSchema.find({title: 'mentor'}, function(err, mentors) {
              if(err) throw err;
              for(var i = 0; i < mentors.length; i++)
              {
                var mentor = mentors[i];
                const output = `
                  <p>Hi ${mentor.username},</p>
                  <p>A User recently replied to a private post</p>
                  <h2>Reply Details<h2>
                  <hr>

                  <h3>Answer</h3>
                  <p>${message}</p>

                  <h3>Contact details</h3>
                  <ul>
                    <li>Date Posted: ${newAnswer.timestamp}</li>
                    <li>User's Name: ${author}</li>
                    <li>User's Email: ${req.user.email}</li>
                    <li>Link: <a href="https://codeassist.club/mentor/history/${postID}">Post</a></li>
                  </ul>
                `;

                const msg = {
                  to: mentor.email,
                  from: `Code Assist <${process.env.SENDER_EMAIL}>`,
                  subject: 'New User Reply to Private Post',
                  html: output
                };
                sgMail.send(msg);
                console.log('============================================');
                console.log("Sending Email to Mentor ... ");
                console.log("Mentor's Username: " + mentor.username);
                console.log("Redirecting to: Specific Private post page from: Specific Private post page");
                console.log('============================================');
              }
              res.send('/mentor/history/'+postID);
            });
          });
        }else{
          console.log('============================================');
          console.log("Unauthorized Post Request");
          console.log("Redirecting to: Unauthorized Page from: Private post page");
          console.log('============================================');
          res.render('private-post.handlebars', {layout: 'dashboard-layout'});
        }
      });
    }
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
