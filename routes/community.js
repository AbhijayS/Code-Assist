var fs = require('fs');
var express = require('express');
var router = express.Router();
var User = require('../models/user');
var moment = require('moment');
var upload = require('../database').upload;
var mongoose = require('mongoose');
var handlebars = require('handlebars');
const sgMail = require('@sendgrid/mail');
const escapeRegex = require('escape-string-regexp');
const Trello = require("trello");
const io = require('../app').io;

var trello = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOKEN);
var emailTemplate = handlebars.compile(fs.readFileSync('./views/email.handlebars', 'utf8'));
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var postLimit = 10; // how many posts to show user at a time

// var User = require('../models/test-user');

router.get('/', function(req, res) {
	 User.CommunitySchema.findOne({}).populate({
		 path: 'posts',
		 options: {sort: {'timestamp': -1},limit: postLimit},
		 populate: {path: 'author'}
	 }).exec(function(err, community) {
		 if(err) throw err;
		 if(community) {
			 var posts = community.posts;

			 addDescriptionPreviews(posts);
			 addLikedProperty(posts, req.user);
			 addIsOwner(posts, req.user);

			 var morePosts = false;
			 if (posts.length > 0) {
				 User.CommunitySchema.findOne({}).populate({
					 path: 'posts',
					 match: {timestamp: {$lt: posts[posts.length-1].timestamp}},
					 populate: 'author'
				 }).exec(function(err, communityRemainingPosts) {
					 var count =  communityRemainingPosts.posts.length;
					 if (count > 0)
					 morePosts = true;

					 res.render('community', {layout: 'dashboard-layout', posts: posts, morePosts: morePosts});
				 });

			 } else {
				 res.render('community', {layout: 'dashboard-layout', posts: posts, morePosts: false});
			 }
		 }
	});

});

function addDescriptionPreviews(posts) {
  for (var i = 0; i < posts.length; i++) {
    var descriptionObj = JSON.parse(posts[i].description);
    var descriptionPreview = descriptionObj.filter(op => typeof op.insert === 'string').map(op => op.insert).join('').trim();
    if (descriptionPreview.length < 200)
      descriptionPreview = descriptionPreview.substring(0, 200)
    else
      descriptionPreview = descriptionPreview.substring(0, 200) + "...";
    posts[i].descriptionPreview = descriptionPreview;
  }
}

function addLikedProperty(posts, reqUser) {
	if (reqUser) {
		for (var i = 0; i < posts.length; i++) {
			var userLikedPost = posts[i].userLikes.some(function(userID) {
				return userID.equals(reqUser._id);
			});
			if (userLikedPost)
				posts[i].liked = true;
		}
	}
}

function addIsOwner(posts, reqUser) {
	if (reqUser) {
		for (var i = 0; i < posts.length; i++) {
			if (posts[i].author._id.equals(reqUser._id)) {
				posts[i].isOwner = true;
			}
		}
	}
}

router.post('/morePosts', function(req, res) {
  var lastPostID = req.body.lastPostID;
  var prog_lang = req.body.filter_opt;
  var search = req.body.search;
  var searchMatch = {};
  console.log("Getting more posts");
  console.log("filter_opt: " + prog_lang);

  if (!lastPostID)
    return false;

  if (search) {
    searchMatch = {
      $or: [
        {question: new RegExp(escapeRegex(search), 'i')},
        {description: new RegExp(escapeRegex(search), 'i')}
      ]
    }
  }


  if (!prog_lang || prog_lang == "Remove Filter")
    prog_lang = {$exists: true}; // will match any language

  if(req.user) {
    // get last post from database
    User.PostSchema.findOne({_id: lastPostID}, function(err, lastPost) {
      User.CommunitySchema.findOne({}).populate({
        path: 'posts',
        match: {$and: [
          {prog_lang: prog_lang, timestamp: {$lt: lastPost.timestamp}},
          searchMatch
        ]},
        options: {sort: {'timestamp': -1}, limit: postLimit},
        select: '_id timestamp author question description prog_lang answers likeCount userLikes',
				populate: {path: 'author', select: 'qualities.rank username pic'}
      }).lean().exec(function(err, community) {
        var postsToAdd = community.posts;

        addDescriptionPreviews(postsToAdd);
				addLikedProperty(postsToAdd, req.user);
				addIsOwner(postsToAdd, req.user);

        if (postsToAdd.length > 0) {
          User.CommunitySchema.findOne({}).populate({
            path: 'posts',
            match: {$and: [
              {prog_lang: prog_lang, timestamp: {$lt: postsToAdd[postsToAdd.length-1].timestamp}},
              searchMatch
            ]},
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
    res.render('community-post', {layout: 'dashboard-layout', email: req.user.email});
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
  gfs.collection('uploads').findOne({_id: fileID}, (err, file) => {
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
	var data = {
		auth: false
		// url
		// questionInvalid
	};

	if(req.user) {
		var question = req.body.question;
		var description = req.body.description;
		var author = req.user;
		var prog_lang = req.body.programming;
		var authorid=req.user._id;
		var questionInvalid = false;
		var descriptionInvalid = false;

		if (question.trim().split(' ').length < 2 || question.length>150) {
			data.questionInvalid = true;
			res.send(data);
		}else{
			User.CommunitySchema.findOne({}, function(err, community) {
				var newPost = new User.PostSchema();
				newPost.question = question;
				newPost.description = description;
				newPost.author = author;
				newPost.authorid=authorid;
				newPost.prog_lang = prog_lang;

				for (var i = 0; i < req.files.length; i++) {
					var newFileRef = new User.FileRefSchema();
					newFileRef.name = req.files[i].filename;
					newFileRef.fileID = req.files[i].id;
					newFileRef.save(function(err) {
						if(err) throw err;
						// saved
					});
					newPost.files.push(newFileRef);
				}

				newPost.save(function(err) {
					if(err) throw err;
					// saved
				});

				community.posts.push(newPost);
				req.user.posts.push(newPost);

				req.user.qualities.assists += 15;
				User.updateRank(req.user);

				community.save(function(err) {
					if(err) throw err;
					// saved
					data.auth = true;
					data.url = "/community/" + newPost._id;
					res.send(data);
				});

				req.user.save(function(err) {
					if(err) throw err;
				});
				console.log("Sending to trello ...");
				var cardTitle = '['+newPost.prog_lang+'] '+newPost.author.username+' - '+newPost.question;
				var cardDescription = 'https://codeassist.org/community/'+newPost.id;
				trello.addCard(cardTitle, cardDescription, process.env.TRELLO_TODO_LIST,
			    function (error, trelloCard) {
			        if (error) {
			            console.log('Could not add card:', error);
			        }
			        else {
			            console.log('Added card:', trelloCard);
			        }
			    });
			});
		}

	}else{
		req.flash('origin');
		req.flash('origin', '/community/post');
		data.url = '/login';
		res.send(data);
	}
});

router.get('/:id', function(req, res) {
  var postID = req.params.id;
  User.PostSchema.findOne({_id: postID}).populate([{
		path: 'answers',
		options: {sort: {'timestamp': 1}},
		populate: {path: 'author'}},
		{path: 'files'}, {path: 'author'}])
		.exec(function(err, post) {
		if(post) {
			if (req.user) {
				for (var i = 0; i < post.answers.length; i++) {
					//make sure the rendered page knows which answers were made by the current user
					//console.log("Userid="+post.answers[i].author._id.equals(req.user._id));
					if(post.answers[i].author._id.equals(req.user._id)){
					//	console.log("Userid="+post.answers[i].author._id);
						post.answers[i].isowner=true;
					}

					var userLikedAnswer = post.answers[i].userLikes.some(function(userID) {
						return userID.equals(req.user._id);
					});

					if (userLikedAnswer)
					post.answers[i].liked = true;
				}

				var userLikedPost = post.userLikes.some(function(userID) {
					return userID.equals(req.user._id);
				});
				if (userLikedPost)
				post.liked = true;
			}

			var today = moment(Date.now());
			var description = JSON.parse(post.description);
			if(description.length == 0 || description[0].insert.trim() == "") {
				description = null;
			}else{
				description = post.description;
			}

			if (req.user && req.user.id==post.author.id) {
				res.render('community-view-post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer'), date: today, description: description, isowner: true, username: req.user.username, userid:req.user._id});
			} else if (req.user) {
				res.render('community-view-post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer'), date: today, description: description, username: req.user.username,userid:req.user._id});
			} else {
				res.render('community-view-post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer'), date: today, description: description});
			}
		}else{
			res.redirect('/community');
		}
	});
});

router.post('/like', function(req, res) {
  var id = req.body.id;
  var type = req.body.type;
  var postID = req.body.postID;

  if(req.user) {
    if (type == "post") {
      User.PostSchema.findOne({_id: id}).populate({path: 'author'}).exec(function(err, post) {
        var index = post.userLikes.indexOf(req.user._id);
        if (index == -1) {
          post.userLikes.push(req.user);
          post.likeCount++;

					if(post.author.id != req.user.id) {
						post.author.qualities.assists += 5;
						User.updateRank(post.author);
					}
        } else {
          post.userLikes.splice(index, 1);
          post.likeCount--;

					if(post.author.id != req.user.id) {
						post.author.qualities.assists -= 5;
				    User.updateRank(post.author);
					}
        }

        post.save(function(err) {
          if(err) throw err;
        });

        res.end();
      });
    } else if (type == "answer") {
      User.AnswerSchema.findOne({_id: id}, function(err, answer) {
        var index = answer.userLikes.indexOf(req.user._id);
        if (index == -1) {
          answer.userLikes.push(req.user);
          answer.likeCount++;
        } else {
          answer.userLikes.splice(index, 1);
          answer.likeCount--;
        }
        answer.save(function(err) {
          if(err) throw err;
        });

        res.end();
      });
    }
  } else {
    req.flash('origin');
    req.flash('origin', '/community/' + postID);
    res.send({url: '/login'})
  }
});

router.post('/flag-post', function(req, res) {
	var postID = req.body.postID;
	var data = {
		auth: false
	};

	User.PostSchema.findOne({_id: postID}, function(err, post) {
		if(err) throw err;
		var today = moment(Date.now());
		if(post) {
			var timestamp = moment(post.timestamp);
			const output = `
				<p>Hi Code Assist,</p>
				<p>Someone in the community recently <strong>Flagged</strong> a post with the following details on ${today.format("dddd, MMM D YYYY, h:mm A")}</p>
				<h1>Post Details</h1>
				<hr>

				<ul>
					<li>Author: ${post.author.username}</li>
					<li>Question: ${post.question}</li>
					<li>Description: ${post.description}</li>
					<li>Date Posted: ${timestamp.format('MMM D')}</li>
				</ul>

				<h1>Flag Details</h1>
				<hr>

				<ul>
					<li>Flag Description: ${req.body.postDescription}</li>
					<li>Link to the <a href="https://codeassist.org/community/${postID}">Flagged Post</a></li>
				</ul>
			`;
			const msg = {
				to: process.env.SENDER_EMAIL,
				from: `Code Assist <${process.env.SENDER_EMAIL}>`,
				subject: 'Flagged Post',
				html: output
			};

			sgMail.send(msg);
			console.log('============================================');
			console.log("Flagged Post");
			console.log("Sending Email to Code Assist ... ");
			console.log('============================================');
			data.auth = true;
			res.send(data)
		}
	});
});

//Serverside Delete post handling
router.post('/:id/delete', function(req, res){
  User.PostSchema.findOneAndRemove({_id: req.params.id}, function(err, user) {
		res.send('/community');
	});
});

//Serverside Delete Answer Handling
router.post('/:id/deleteanswer', function(req, res){
	//console.log("attempting to delete "+req.params.id);
	User.AnswerSchema.findOne({_id:req.params.id},function(err,answer){
		if(answer){
		//	console.log(answer.author);
			if(answer.author.equals(req.user._id)){
				User.AnswerSchema.findOneAndRemove({_id: req.params.id}, function(err, user) {
				});
			}
		}
	});

});

router.post('/:id/answer', function(req, res){
  var postID = req.params.id;
  var message = req.body.answer;

	if (message == '[{"insert":"\\n"}]') {
		console.log("invalid answer");
		res.end();
		return false;
	}

  if(req.user)
  {
    User.PostSchema.findOne({_id: postID}).populate(['answers', 'author']).exec(function(err, post) {

      var newAnswer = new User.AnswerSchema();
      newAnswer.answer = message;
      newAnswer.author = req.user;
      newAnswer.save(function(err) {
        if(err) throw err;
        // saved
      });

			// make sure the person isn't cheating the system
			if(req.user.id != post.author.id) {
				req.user.qualities.assists += 10;
				User.updateRank(req.user);
			}

			post.answers.push(newAnswer);
      post.save(function(err) {
        if(err) throw err;
      });

			User.UserSchema.findOne({_id: post.author._id}, function(err, user) {
				Notify(post.author._id, {
					message: `<strong>${req.user.username}</strong> responded to your question titled "<em>${post.question}</em>"`,
					link: "/community/" + postID
				});

				var newTimestamp = moment(newAnswer.timestamp);
				const text = `
					<p><a href="http://codeassist.org/users/profile/${req.user._id}">${req.user.username}</a> has recently replied to your question titled, <em>${post.question}</em>.</p>
				`
				const msg = {
					to: user.email,
					from: `Code Assist <${process.env.SENDER_EMAIL}>`,
					subject: 'New Answer to Community Post',
					html: emailTemplate({
						username: post.author.username,
						rawHTML: true,
						text: text,
						btnText: "View Answer",
						btnLink: "https://codeassist.org/community/" + postID
					})
				};

				// sgMail.send(msg);
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
  var search = req.body.search;
  var prog_lang = req.body.filter_opt;
  if (!prog_lang || prog_lang == "Remove Filter")
    prog_lang = {$exists: true}; // will match any language

	//console.log("Someone Is Searching for "+req.body.search);
	// var postreturnarray=new Array();
	// var wordarray= req.body.search.split(" ");
  User.CommunitySchema.findOne({}).populate({
    path: 'posts',
    match: {$and: [
      {prog_lang: prog_lang},
      {
        $or: [
          {question: new RegExp(escapeRegex(search), 'i')},
          {description: new RegExp(escapeRegex(search), 'i')}
        ]
      }
    ]},
    options: {sort: {'timestamp': -1}, limit: postLimit},
    select: '_id timestamp author question description prog_lang answers likeCount userLikes',
		populate: {path: 'author', select: 'qualities.rank username pic'}
  }).lean().exec(function(err, community) {
		if (err) console.log(err);

    var postsToAdd = community.posts;

    addDescriptionPreviews(postsToAdd);
		addLikedProperty(postsToAdd, req.user);
		addIsOwner(postsToAdd, req.user);

    if (postsToAdd.length > 0) {
      User.CommunitySchema.findOne({}).populate({
        path: 'posts',
        match: {$and: [
          {prog_lang: prog_lang, timestamp: {$lt: postsToAdd[postsToAdd.length-1].timestamp}},
          {
            $or: [
              {question: new RegExp(escapeRegex(search), 'i')},
              {description: new RegExp(escapeRegex(search), 'i')}
            ]
          }
        ]},
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

/*    for(var k=0;k<posts.length;k++){
      for(var o=0;o<wordarray.length;o++){
        if(posts[k].question.indexOf(wordarray[o])!=-1||posts[k].description.indexOf(wordarray[o])!=-1){
        //  console.log("found one "+posts[k]);
          postreturnarray.push(posts[k]);
          break;
        }
      }
    }*/
    // res.send(community.posts);
	  // console.log("return="+postreturnarray);
		// res.send(postreturnarray);
	});

});

router.post('/filter', function(req, res) {
  var option = req.body.filter_opt;
  var search = req.body.search;
  var searchMatch = {};
  // console.log("Made filter request: " + option);

  if (!option || option == "Remove Filter")
    option = {$exists: true}; // will match any language

  if (search) {
    searchMatch = {
      $or: [
        {question: new RegExp(escapeRegex(search), 'i')},
        {description: new RegExp(escapeRegex(search), 'i')}
      ]
    }
  }

  User.CommunitySchema.findOne({}).populate({
    path: 'posts',
    match: {$and: [
      {prog_lang: option},
      searchMatch
    ]},
    options: {sort: {'timestamp': -1}, limit: postLimit},
    select: '_id timestamp author question description prog_lang answers likeCount userLikes',
		populate: {path: 'author', select: 'qualities.rank username pic'}
  }).lean().exec(function(err, community) {
    var postsToAdd = community.posts;

    addDescriptionPreviews(postsToAdd);
		addLikedProperty(postsToAdd, req.user);
		addIsOwner(postsToAdd, req.user);

    if (postsToAdd.length > 0) {
      User.CommunitySchema.findOne({}).populate({
        path: 'posts',
        match: {$and: [
          {prog_lang: option, timestamp: {$lt: postsToAdd[postsToAdd.length-1].timestamp}},
          searchMatch
        ]}
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

router.get('/post/edit/:id', function(req, res) {
	var postID = req.params.id;
	if(req.user) {
		User.UserSchema.findOne({_id: req.user._id}).populate("posts").exec(function(err, user) {
			if(err) throw err;
			var allPosts = user.posts;
			var found = false;
			for(var i = 0; i < allPosts.length; i++) {
				if(allPosts[i]._id == postID) {
					// found - do stuff
					found = true;
					break;
				}
			}

			if(found) {
				User.PostSchema.findOne({_id: postID}).populate("files").exec(function(err, post) {
					if(post) {
						res.render('community-edit-post', {layout: 'dashboard-layout', post: post});
					}else{
						res.redirect('/community/' + postID);
					}
				});
			}else{
				res.redirect('/community/' + postID);
			}
		});
	}else{
		req.flash('origin');
		req.flash('origin', '/community/post/edit/'+postID);
		res.send('/login');
	}
});

router.post('/post/edit/:id', upload.array('file'), function(req, res) {
	var postID = req.params.id;
	var data = {
		auth: false
		// url
		// questionInvalid
	};

	if(req.user) {
		var question = req.body.question;
		var description = req.body.description;
		var author = req.user;
		var prog_lang = req.body.programming;
		var authorid = req.user._id;
		var removedFileIds = req.body.removedFileIds;
		// console.log("removedFileIds:", removedFileIds);

		if (question.trim().split(' ').length < 2 || question.length>150) {
			data.questionInvalid = true;
			res.send(data);
		}else{
			User.UserSchema.findOne({_id: req.user._id}).populate('posts').exec(function(err, user) {
				if(err) throw err;
				var found = false;
				var allPosts = user.posts;
				for(var i = 0; i < allPosts.length; i++) {
					// console.log(allPosts[i]._id);
					if(allPosts[i]._id == postID)
						found = true;
				}

				if(found) {
					User.PostSchema.findOne({_id: postID}).populate('files').exec(function(err, post) {
						if(err) throw err;
						post.question = question;
						post.description = description;
						post.prog_lang = prog_lang;

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
							post.files.push(newFileRef);
						}

						if (removedFileIds) {
							// in case only one file needs to be removed
							if (!Array.isArray(removedFileIds)) {
								removedFileIds = [removedFileIds];
							}


							for (var i = 0; i < removedFileIds.length; i++) {
								post.files.pull({_id: removedFileIds[i]});
								User.FileRefSchema.findOneAndRemove({_id: removedFileIds[i]}, function(err, fileRef) {
									gfs.files.remove({_id: fileRef.fileID});
								});
							}
						}

						post.status.edited = true;
						post.timestamp=Date.now();

						post.save(function(err) {
							if(err) throw err;
							data.auth = true;
							data.url = '/community/' + postID;
							console.log(data);
							res.send(data);
						});
					});
				}else{
					data.auth = false;
					res.send(data);
				}
			});
		}
	}else{
		req.flash('origin');
		req.flash('origin', '/community/post/edit/'+postID);
		data.url = '/login';
		res.send(data);
	}
});

router.post('/:id/answers/edit/:answerid', function(req, res) {
  var postID = req.params.id;
	var answerID = req.params.answerid;
	var newAnswer = req.body.answer;

	if(req.user) {
		User.AnswerSchema.findOne({_id: answerID}).populate('author').exec(function(err, foundAnswer) {
			if(err) throw err;
			if(foundAnswer) {
				if(foundAnswer.author.id === req.user.id) {
					foundAnswer.answer = newAnswer;
					foundAnswer.status.edited = true;
					foundAnswer.timestamp=Date.now();
					foundAnswer.save(function(err) {
						if(err) throw err;
						console.log("Answer Updated");
						res.send({auth: true});
					});
				}
			}else{
				res.send({auth: false, url: '/community/'+postID});
			}
		});
	}else{
		req.flash('origin');
    req.flash('origin', '/community/'+postID);
    res.send({url: '/login'});
	}
});

function Notify(userid, data){
  this.nnsp=io.of("/Notify"+userid);
  User.UserSchema.findOne({_id:userid},function(err,user){
    if(user){
			// console.log("nsp", "/Notify"+userid);
			var newNotif = new User.NotificationSchema(data);
			newNotif.save(function(err) {
				if(err) throw err;
			});
			user.notifications.unshift(newNotif);
			user.unread_notifications = true;

			this.nnsp.emit('notify', data);

			// removes any notifications after 5
			user.notifications.splice(5);

			user.save(function(err) {
				if(err) throw err;
			});
    }
  });
}

module.exports = router;
