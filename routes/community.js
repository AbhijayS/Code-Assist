var express = require('express');
var router = express.Router();
var User = require('../models/user');
var moment = require('moment');

var upload = require('../database').upload;
var mongoose = require('mongoose');
require('dotenv').config();

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var postLimit = 10; // how many posts to show user at a time

// var User = require('../models/test-user');

router.get('/', function(req, res) {
	 User.CommunitySchema.findOne({}).populate({path: 'posts', options: {sort: {'timestamp': -1}, limit: postLimit}}).exec(function(err, community) {
    var posts = community.posts;

    var morePosts = false;
    if (posts.length > 0) {
      User.CommunitySchema.findOne({}).populate({
        path: 'posts',
        match: {timestamp: {$lt: posts[posts.length-1].timestamp}},
      }).exec(function(err, communityRemainingPosts) {
        var count =  communityRemainingPosts.posts.length;
        if (count > 0)
          morePosts = true;

        res.render('community', {layout: 'dashboard-layout', posts: posts, morePosts: morePosts});
      });

    } else {
      res.render('community', {layout: 'dashboard-layout', posts: posts, morePosts: false});
    }
	});

});

router.post('/morePosts', function(req, res) {
  var lastPostID = req.body.lastPostID;
  var prog_lang = req.body.filter_opt;
  console.log("Getting more posts");
  console.log("filter_opt: " + prog_lang);

  if (!lastPostID)
    return false;

  if (!prog_lang || prog_lang == "Remove Filter")
    prog_lang = {$exists: true}; // will match any language

  if(req.user) {
    // get last post from database
    User.PostSchema.findOne({_id: lastPostID}, function(err, lastPost) {
      User.CommunitySchema.findOne({}).populate({
        path: 'posts',
        match: {prog_lang: prog_lang, timestamp: {$lt: lastPost.timestamp}},
        options: {sort: {'timestamp': -1}, limit: postLimit},
        select: '_id timestamp author question description prog_lang answers'
      }).exec(function(err, community) {
        var postsToAdd = community.posts;

        if (postsToAdd.length > 0) {
          User.CommunitySchema.findOne({}).populate({
            path: 'posts',
            match: {prog_lang: prog_lang, timestamp: {$lt: postsToAdd[postsToAdd.length-1].timestamp}},
          }).exec(function(err, communityRemainingPosts) {
            var count = communityRemainingPosts.posts.length;

            res.send({
              postsToAdd: postsToAdd,
              morePostsAvailable: count > 0
            });
          });

        } else {
          res.send({
            postsToAdd: [],
            morePostsAvailable: false
          });
        }
      });
    });
  } else {
    req.flash('origin');
    req.flash('origin', '/community');
    res.redirect('/login');
  }
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

router.post('/post', upload.array('file'), function(req, res) {
  var question = req.body.question;
  var description = req.body.description;
  var author = req.user.username;
	var prog_lang = req.body.programming;
  var authorid=req.user._id;
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

  User.CommunitySchema.findOne({}, function(err, community) {
    var newPost = new User.PostSchema();
    newPost.question = question;
    newPost.description = description;
    newPost.author = author;
		newPost.authorid=authorid;
		newPost.prog_lang = prog_lang;

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
      newPost.files.push(newFileRef);
    }

		console.log("Programming Language: " + newPost.prog_lang);

    newPost.save(function(err) {
      if(err) throw err;
      console.log('new post saved');
    });

    community.posts.push(newPost);
    req.user.posts.push(newPost);

    community.save(function(err) {
      if(err) throw err;
      console.log("Post Saved");
      // console.log(community);
      // console.log('-----------------------------');
      // console.log('');
      var data = {
        questionInvalid: questionInvalid,
        descriptionInvalid: descriptionInvalid,
        url: "/community/" + newPost._id
      }
      res.send(data);

    });

    req.user.save(function(err) {
      if(err) throw err;
    });
  });
});

router.get('/:id', function(req, res) {
  var postID = req.params.id;
  User.PostSchema.findOne({_id: postID}).populate(['answers', 'files']).exec(function(err, post) {

    var allAnswers = post.answers;
    allAnswers.sort(function(date1,date2){
      if (date1 > date2) return -1;
      if (date1 < date2) return 1;
      return 0;
    });

    var today = moment(Date.now());
    var description = post.description;
		if(req.user && req.user._id==post.authorid){
			res.render('post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer'), date: today, description: description, isowner: true});
		}else{
		    res.render('post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer'), date: today, description: description});
		}
	});
});

//Serverside Delete post handling
router.post('/:id/delete', function(req, res){
  User.PostSchema.findOneAndRemove({_id: req.params.id}, function(err, user) {
		res.send('/community');
	});
});

router.post('/:id/answer', function(req, res){
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

			User.UserSchema.findOne({username: post.author}, function(err, user) {
				var newTimestamp = moment(newAnswer.timestamp);
				const output = `
					<p>Hi ${post.author},</p>
					<p>The Community has recently replied to your question:</p>
					<h2>New Answer Details</h2>
					<hr>

					<h3>Link to the <a href="https://codeassist.club/community/${postID}">Answer</a></h3>

					<h3>Contact details</h3>
					<ul>
						<li>Date Replied: ${newTimestamp.format('MMM D')}</li>
						<li>User's Name: ${author}</li>
					</ul>
				`;
				const msg = {
					to: user.email,
					from: `Code Assist <${process.env.SENDER_EMAIL}>`,
					subject: 'New Answer to Community Post',
					html: output
				};

				sgMail.send(msg);
				console.log('============================================');
				console.log("Sending Email to User ... ");
				console.log("User's Username: " + user.username);
				console.log("Redirecting to: Specific community post page from: Specific community post page");
				console.log('============================================');

			});
      res.send("/community/" + postID + "/");
    });
  }else{
    req.flash('origin');
    req.flash('saved_answer');

    req.flash('origin', '/community/'+postID);
    req.flash('saved_answer', message);
    res.send('/login');
  }
});

//search functions
router.post('/Search',function(req,res){
	//console.log("Someone Is Searching for "+req.body.search);
	var postreturnarray=new Array();
	var wordarray= req.body.search.split(" ");
		User.CommunitySchema.findOne({}).populate("posts").exec(function(err,thecommunity){
			var posts=thecommunity.posts;
				for(var k=0;k<posts.length;k++){
					for(var o=0;o<wordarray.length;o++){
						if(posts[k].question.indexOf(wordarray[o])!=-1||posts[k].description.indexOf(wordarray[o])!=-1){
						//	console.log("found one "+posts[k]);
							postreturnarray.push(posts[k]);
							k++;
							o=wordarray.length;
							}
					}
			}
			if(err){
				console.log(err);
			}
		//	console.log("return="+postreturnarray);
			res.send(postreturnarray);
			return postreturnarray;
		});

});

router.post('/filter', function(req, res) {
  var option = req.body.filter_opt;
  // console.log("Made filter request: " + option);

  if (!option || option == "Remove Filter")
    option = {$exists: true}; // will match any language

  User.CommunitySchema.findOne({}).populate({
    path: 'posts',
    match: {prog_lang: option},
    options: {sort: {'timestamp': -1}, limit: postLimit},
    select: '_id timestamp author question description prog_lang answers'
  }).exec(function(err, community) {
    var postsToAdd = community.posts;

    if (postsToAdd.length > 0) {
      User.CommunitySchema.findOne({}).populate({
        path: 'posts',
        match: {prog_lang: option, timestamp: {$lt: postsToAdd[postsToAdd.length-1].timestamp}},
      }).exec(function(err, communityRemainingPosts) {
        var count = communityRemainingPosts.posts.length;

        res.send({
          postsToAdd: postsToAdd,
          morePostsAvailable: count > 0
        });
      });

    } else {
      res.send({
        postsToAdd: [],
        morePostsAvailable: false
      });
    }
  });

});
module.exports = router;
