var express = require('express');
var router = express.Router();
var User = require('../models/user');
var moment = require('moment');

// var User = require('../models/test-user');

router.get('/', function(req, res) {
	User.CommunitySchema.findOne({}).populate('posts').exec(function(err, community) {

    var allPosts = community.posts;

    allPosts.sort(function(date1,date2){
      if (date1 > date2) return -1;
      if (date1 < date2) return 1;
      return 0;
    });

    // console.log('---------------------------');
    // console.log('Sorted posts:');
    // console.log(allPosts);
    // console.log('---------------------------');

		res.render('community', {layout: 'dashboard-layout', posts: community.posts});
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
    res.render('community-post', {layout: 'dashboard-layout'});
  }else{
    req.flash('origin');
    req.flash('origin', '/community/post');
    res.redirect('../login');
  }
});


router.get('/:id', function(req, res) {
	var postID = req.params.id;
	// var newAnswer = new User.AnswerSchema({
	// 	answer: "MongoDB"
	// });
	// newAnswer.save(function(err) {
	// 	if(err) throw err;
	// });

	User.PostSchema.findOne({_id: postID}).populate('answers').exec(function(err, post) {

    var allAnswers = post.answers;
    allAnswers.sort(function(date1,date2){
      if (date1 > date2) return -1;
      if (date1 < date2) return 1;
      return 0;
    });

		// console.log(post);
    //
		// post.answers.push(newAnswer);
    //
		// post.save(function(err) {
		// 	if(err) throw err;
		// });
		var today = moment(Date.now());
		// console.log(today.format("MMM"));
		// post.description.stringify = JSON.stringify(post.description);
		var description = post.description;
		console.log('');
		console.log("Type of description: " + typeof description);
		console.log(description);
		res.render('post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer'), date: today, description: description});
	});
});

router.post('/post', function(req, res) {
  var question = req.body.question;
  var description = req.body.description;
  var author = req.user.username;
	var prog_lang = req.body.programming;

  var questionInvalid = false;
  var descriptionInvalid = false;

  if (question.length == 0)
    questionInvalid = true;
  if (description.length == 0)
    descriptionInvalid = true;

  console.log("description: " + description);
  if (questionInvalid || descriptionInvalid) {
    res.render('community-post', {layout: 'dashboard-layout', questionInvalid: questionInvalid, descriptionInvalid: descriptionInvalid, question: question, description: description});
    return;
  }


  User.CommunitySchema.findOne({}, function(err, community) {
    // console.log(community);
    var newPost = new User.PostSchema();
    newPost.question = question;
    newPost.description = description;
    newPost.author = author;
		newPost.prog_lang = prog_lang;

    newPost.save(function(err) {
      if(err) throw err;
      // console.log('new post saved');
    });

    community.posts.push(newPost);
    req.user.posts.push(newPost);

    community.save(function(err) {
      if(err) throw err;
      console.log("Post Saved");
      // console.log(community);
      // console.log('-----------------------------');
      // console.log('');
			console.log('Redirecting to COMMUNITY...');
      // res.redirect('/community');
			res.send(description);
    });

    req.user.save(function(err) {
      if(err) throw err;
    });
  });
});


router.post('/:id/answer', function(req, res) {

  var postID = req.params.id;
  // console.log("Id: " + postID);
  var message = req.body.answer;

  if(req.user)
  {
    // console.log("User exists");
    var author = req.user.username;

    User.PostSchema.findOne({_id: postID}).populate('answers').exec(function(err, post) {
      console.log('');
      console.log("Answering to:");

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
      res.redirect('/community/'+postID);
    });
  }else{
    req.flash('origin');
    req.flash('saved_answer');

    req.flash('origin', '/community/'+postID);
    req.flash('saved_answer', message);
    res.redirect('../../login');
  }
});

module.exports = router;
