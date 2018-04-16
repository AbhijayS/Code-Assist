var express = require('express');
var router = express.Router();
var User = require('../models/user');

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
      }
      res.redirect('/mentor/history');
    });
  }
});

router.get('/history', function(req, res) {
  if(req.user) {
    User.UserSchema.findOne({_id: req.user._id}).populate('private_posts').exec(function(err, user) {
      res.render('mentor-history', {layout: 'dashboard-layout', posts: user.private_posts})
    });
  }else{
    req.flash('origin');
    req.flash('origin', '/mentor/history');
    res.redirect('../login');
  }
});
module.exports = router;
