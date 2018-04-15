var express = require('express');
var router = express.Router();
var User = require('../models/user');
// var User = require('../models/test-user');

router.get('/', function(req, res) {
	User.CommunitySchema.findOne({}).populate('posts').exec(function(err, community) {
		res.render('community', {layout: false, posts: community.posts});
	});

});

/*	var answer1 = new User.AnswerSchema({
	answer: "MongoDB"
	});

	answer1.save(function(err) {
	if(err) throw err;
	});

	User.PostSchema.find({question: "What?"}).populate('answers').exec(function(err, newPost) {
		for (var i = 0; i < newPost.length; i++)
		{
			newPost[i].answers.push(answer1);

			newPost[i].save(function(err) {
			if(err) throw err;
			console.log("New Post Saved:")
			console.log(newPost);
			console.log('-------------------------');
			console.log('');
			});
		}
		User.PostSchema.find({}).populate('answers').exec(function(err, posts) {
			if(err) throw err;
			console.log(posts);
			res.render('community', {layout: false, posts: posts});
		});
	});*/

router.get('/post', function(req, res) {
  if(req.user)
  {
    res.render('community-post', {layout: false});
  }else{
    req.flash('origin', '/community/post');
    res.redirect('../login');
  }
});

router.post('/post', function(req, res) {
  var question = req.body.title;
  var description = req.body.description;

  User.CommunitySchema.findOne({}, function(err, community) {
    console.log(community);
    var newPost = new User.PostSchema();
    newPost.question = question;
    newPost.description = description;

    newPost.save(function(err) {
      if(err) throw err;
      console.log('new post saved');
    });

    community.posts.push(newPost);
    req.user.posts.push(newPost);

    community.save(function(err) {
      if(err) throw err;
      console.log("Post Saved");
      console.log(community);
      console.log('-----------------------------');
      console.log('');
      res.redirect('/community');
    });

    req.user.save(function(err) {
      if(err) throw err;
    });
    
  });
});

router.get('/:id', function(req, res) {
	var postID = req.params.id;

	var newAnswer = new User.AnswerSchema({
		answer: "MongoDB"
	});
	newAnswer.save(function(err) {
		if(err) throw err;
	});

	User.PostSchema.findOne({_id: postID}).populate('answers').exec(function(err, post) {
		console.log(post);

		post.answers.push(newAnswer);

		post.save(function(err) {
			if(err) throw err;
		});

		res.render('post', {layout: false, post: post});
	});
});

module.exports = router;
