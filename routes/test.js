var express = require('express');
var router = express.Router();
var User = require('../models/user');
// var User = require('../models/test-user');

router.get('/', function(req, res) {
  var answer1 = new User.AnswerSchema({
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
  });
});

router.get('post', function(req, res) {
  if(req.user)
  {
	res.render('community-post');
  }else{
	res.redirect('login');
  }
});

router.post('post', function(req, res) {
  // var question = req.body.question;
});

module.exports = router;
