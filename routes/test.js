var express = require('express');
var router = express.Router();
var User = require('../models/test-user');

router.get('/test', function(req, res) {
  // var post = new User.CommunitySchema({
  //   post: "Hey"
  // });
  //
  //
  // var post = {
  //   question: "What is COde Assist?",
  //   answers: []
  // };
  //
  // var answer1 = {
  //   answer: "This is how you 'do it' - Shia Lebouf (2)"
  // }
  //
  // post.answers.push(answer1);

  var Answer = new User.AnswerSchema();
  Answer.answer = "This is how you 'do it' - Shia Lebouf (2)"
  console.log(Answer);
  //
  // Answer.save(function(err, Answer) {
  //   if(err)
  //   {
  //     throw err;
  //   }
  //   // saved
  // });

  var Post = new User.PostSchema();
  Post.question = "What is Code Assist?";
  Post.answers.push(Answer);
  console.log(Post);
  //
  // Post.save(function(err, Post) {
  //   if(err)
  //   {
  //     throw err;
  //   }
  //   // saved
  // });
  //

  // User.PostSchema.create(post, function(err, post) {
  //   if(err)
  //   {
  //     throw err;
  //   }
  //   console.log(post);
  // });
  var Community = new User.CommunitySchema();
  Community.posts.push(Post);

  Community.save(function(err, Community) {
    if(err)
    {
      throw err;
    }
    console.log(Community);
    User.CommunitySchema.find({}, function(err, thread) {
      if(err)
      {
        throw err;
      }else{
        console.log("Found->");
        console.log(thread);
        res.render('community', {layout: false, posts: thread});
      }
    });
  });

  // saved
});

router.get('/', function(req, res) {

  var answer1 = new User.AnswerSchema({
    answer: "MongoDB sucks"
  });

  answer1.save(function(err) {
    if(err) throw err;
  });

  var newPost = new User.PostSchema();
  newPost.question = "What?";
  newPost.answers.push(answer1._id);

  newPost.save(function(err, newPost) {
    if(err) throw err;
    console.log("New Post Saved:")
    console.log(newPost);
    console.log('-------------------------');
    console.log('');

    User.PostSchema.find({}).populate('answers').exec(function(err, posts) {
      if(err) throw err;
      console.log(posts);
      res.render('community', {layout: false, posts: posts});
    });
  });

  // answer1.save(function (err) {
  //   if (err) throw err;
  //   var newPost = new User.PostSchema();
  //
  //   newPost.question = "Question";
  //   var arr = newPost.answers;
  //   arr.push(answer1._id);
  //   newPost.answers = arr;
  //
  //   newPost.save(function (err) {
  //     if (err) throw err;
  //     // thats it!
  //   });
  // });
  //
  // User.PostSchema.
  //   find({}).
  //   populate('answer1').
  //   exec(function(err, posts) {
  //     if(err) throw err;
  //     console.log(posts);
  //     console.log(posts[0].answers[0]._id);
  //     console.log(User.getAnswerById(posts[0].answers[0]._id, function(err){
  //       if(err) throw err;
  //     }));
  //     res.send(posts);
  //   });
});
module.exports = router;
