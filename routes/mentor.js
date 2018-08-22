var express = require('express');
var router = express.Router();
var User = require('../models/user');
var upload = require('../database').upload;
var mongoose = require('mongoose');
var moment = require('moment');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// var nodemailer = require('nodemailer');
require('dotenv').config();
var QuillDeltaToHtmlConverter = require('quill-delta-to-html');

var postLimit = 10; // how many posts to show user at a time

router.get('/', function(req, res) {
  if(req.user) {
    if(req.user.title == 'mentor')
    {
      User.UserSchema.findOne({_id: req.user._id}).populate({
        path: 'private_posts',
        options: {sort: {'timestamp': -1}, limit: postLimit},
        populate: {path: 'assignedMentor', path: 'author'}
      }).exec(function(err, user) {
        var posts = user.private_posts;
        for (var i = 0; i < posts.length; i++) {
          if (posts[i].assignedMentor && posts[i].assignedMentor._id.equals(req.user._id)) {
            posts[i].assignedToSelf = true;
          }
        }

        addDescriptionPreviews(posts);

        // see if show more posts button should be greyed out
        var morePosts = false;
        if (posts.length > 0) {
          User.UserSchema.findOne({_id: req.user._id}).populate({
            path: 'private_posts',
            match: {timestamp: {$lt: posts[posts.length-1].timestamp}},
          }).exec(function(err, userWithRemainingPosts) {
            var count = userWithRemainingPosts.private_posts.length;
            if (count > 0)
              morePosts = true;

            res.render('mentor', {layout: 'dashboard-layout', posts: posts, userIsMentor: true, morePosts: morePosts});
          });
        } else {
          res.render('mentor', {layout: 'dashboard-layout', userIsMentor: true, morePosts: false});
        }
      });
    }else{
      User.UserSchema.findOne({_id: req.user._id}).populate({
        path: 'private_posts',
        options: {sort: {'timestamp': -1}, limit: postLimit},
        populate: {path: 'author'}
      }).exec(function(err, user) {
        var posts = user.private_posts;

        for (var i = 0; i < posts.length; i++) {
          var descriptionObj = JSON.parse(posts[i].description);
          var descriptionPreview = descriptionObj.filter(op => typeof op.insert === 'string').map(op => op.insert).join('').trim();
          if (descriptionPreview.length < 200)
            descriptionPreview = descriptionPreview.substring(0, 200)
          else
            descriptionPreview = descriptionPreview.substring(0, 200) + "...";
          posts[i].descriptionPreview = descriptionPreview;
        }

        var morePosts = false;
        if (posts.length > 0) {
          User.UserSchema.findOne({_id: req.user._id}).populate({
            path: 'private_posts',
            match: {timestamp: {$lt: posts[posts.length-1].timestamp}},
          }).exec(function(err, userWithRemainingPosts) {
            var count = userWithRemainingPosts.private_posts.length;
            if (count > 0)
              morePosts = true;

            res.render('mentor', {layout: 'dashboard-layout', posts: posts, morePosts: morePosts});
          });
        }else{
          res.render('mentor', {layout: 'dashboard-layout', morePosts: false});
        }
      });

    }
  }else{
    req.flash('origin');
    req.flash('origin', '/mentor');
    res.redirect('../../login');
  }
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
      pPost.author = req.user;
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

      req.user.qualities.assists += 15;
  		User.updateRank(req.user);

      req.user.save(function(err) {
        if(err) throw err;
        console.log("Private post saved");
        // console.log(req.user.private_posts);
        // saved
        var data = {
          questionInvalid: questionInvalid,
          descriptionInvalid: descriptionInvalid,
          url: "/mentor/" + pPost._id
        }
        res.send(data);
      });

      // console.log("---------------------------");
      // console.log("List of Mentors:");

      var imageCounter = 0;
      var converter = new QuillDeltaToHtmlConverter(JSON.parse(description), {});

      converter.afterRender(function(groupType, htmlString){
        // console.log(htmlString);
        htmlString = htmlString.replace(/<pre>/g, "<pre style='background-color: #23241f;color: #f8f8f2;overflow: visible;white-space: pre-wrap;margin-bottom: 5px;margin-top: 5px;padding: 5px 10px;border-radius: 3px;'>");

        htmlString = htmlString.replace(/<img([\w\W]+?)>/g, function() {
          return `<img src='http://codeassist.org/mentor/${pPost._id}/image/${imageCounter++}'/>`
        });

        return htmlString;
      });

      var quillHTML = converter.convert();

      for (var i = 0; i < mentors.length; i++)
      {
        var mentor = mentors[i];

        // add post to all mentor's private_posts
        // unless mentor made the post (in which case it's already added)
        if (!req.user._id.equals(mentor._id)) {
          mentor.private_posts.push(pPost);
          mentor.save(function(err) {
            if(err) throw err;
          });
        }

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
          ${quillHTML}

          <h3>Contact details</h3>
          <ul>
            <li>Date Posted: ${pPost.timestamp}</li>
            <li>User's Name: ${req.user.username}</li>
            <li>User's Email: ${req.user.email}</li>
            <li>Link: <a href="https://codeassist.org/mentor/${pPost._id}">Post</a></li>
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

router.get('/post', function(req, res) {
  if(req.user)
  {
    res.render('mentor-post', {layout: 'dashboard-layout', email: req.user.email});;
  }else{
    req.flash('origin');
    req.flash('origin', '/mentor/post');
    res.redirect('../login');
  }
});

router.post('/morePosts', function(req, res) {
  console.log("MORE");
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
      if(req.user.title == 'mentor')
      {
        // User.PostSchema.find({prog_lang: prog_lang, timestamp: {$lt: lastPost.timestamp}}).sort({'timestamp': -1}).limit(postLimit).select('_id timestamp author question description prog_lang answers').populate({path: 'assignedMentor', select: '_id username'}).lean().exec(function(err, postsToAdd) {
        User.UserSchema.findOne({_id: req.user._id}).populate({
          path: 'private_posts',
          match: {prog_lang: prog_lang, timestamp: {$lt: lastPost.timestamp}},
          options: {sort: {'timestamp': -1}, limit: postLimit},
          select: '_id timestamp author question description prog_lang answers',
          populate: [{path: 'assignedMentor', select: '_id username'}, {path: 'author', select: 'qualities.rank username pic'}]
        }).lean().exec(function(err, user) {
          // .lean() converts mongoose objects to normal js objects
          // assignedToSelf is needed in postschema model if .lean() is not used

          var postsToAdd = user.private_posts;

          addDescriptionPreviews(postsToAdd);

          for (var i = 0; i < postsToAdd.length; i++) {
            if (postsToAdd[i].assignedMentor && postsToAdd[i].assignedMentor._id.equals(req.user._id)) {
              postsToAdd[i].assignedToSelf = true;
            }
          }

          if (postsToAdd.length > 0) {
            User.UserSchema.findOne({_id: req.user._id}).populate({
              path: 'private_posts',
              match: {prog_lang: prog_lang, timestamp: {$lt: postsToAdd[postsToAdd.length-1].timestamp}},
            }).exec(function(err, userWithRemainingPosts) {
              var count =  userWithRemainingPosts.private_posts.length;
              res.send({
                postsToAdd: postsToAdd,
                userIsMentor: true,
                morePostsAvailable: count > 0
              });
            });
          } else {
            res.send({
              postsToAdd: [],
              userIsMentor: true,
              morePostsAvailable: false
            });
          }

        });
      } else {
        User.UserSchema.findOne({_id: req.user._id}).populate({
          path: 'private_posts',
          match: {prog_lang: prog_lang, timestamp: {$lt: lastPost.timestamp}},
          options: {sort: {'timestamp': -1}, limit: postLimit},
          select: '_id timestamp author question description prog_lang answers',
          populate: {path: 'author', select: 'qualities.rank username pic'}
        }).exec(function(err, user) {
          var postsToAdd = user.private_posts;

          if (postsToAdd.length > 0) {
            User.UserSchema.findOne({_id: req.user._id}).populate({
              path: 'private_posts',
              match: {prog_lang: prog_lang, timestamp: {$lt: postsToAdd[postsToAdd.length-1].timestamp}},
            }).exec(function(err, userWithRemainingPosts) {
              var count =  userWithRemainingPosts.private_posts.length;

              res.send({
                postsToAdd: postsToAdd,
                userIsMentor: false,
                morePostsAvailable: count > 0
              });
            });

          } else {
            res.send({
              postsToAdd: [],
              userIsMentor: false,
              morePostsAvailable: false
            });
          }
        });
      }
    });
  } else {
    req.flash('origin');
    req.flash('origin', '/mentor');
    res.redirect('../../login');
  }

});

// to get images inside a main post
router.get('/:id/image/:imageIndex', function(req, res) {
  var postID = req.params.id;
  var imageIndex = req.params.imageIndex;

  User.PostSchema.findOne({_id: postID}, function(err, post) {
    var descriptionObj = JSON.parse(post.description);

    var imageCount = 0;
    for (var i = 0; i < descriptionObj.length; i++) {
      if (typeof descriptionObj[i].insert === 'object') {
        for (var type in descriptionObj[i].insert) {
          if (type == "image") {
            if (imageCount == imageIndex) {
              var im = descriptionObj[i].insert.image.split(",")[1];
              var img = new Buffer(im, 'base64');
              res.writeHead(200, {
                 'Content-Type': 'image',
                 'Content-Length': img.length
              });
              res.end(img);
            }
            imageCount++;
          }
        }
      }
    }
  });
});

// to get images inside answers
router.get('/answer/:id/image/:imageIndex', function(req, res) {
  var answerID = req.params.id;
  var imageIndex = req.params.imageIndex;

  User.AnswerSchema.findOne({_id: answerID}, function(err, answer) {
    var answerObj = JSON.parse(answer.answer);

    var imageCount = 0;
    for (var i = 0; i < answerObj.length; i++) {
      if (typeof answerObj[i].insert === 'object') {
        for (var type in answerObj[i].insert) {
          if (type == "image") {
            if (imageCount == imageIndex) {
              var im = answerObj[i].insert.image.split(",")[1];
              var img = new Buffer(im, 'base64');
              res.writeHead(200, {
                 'Content-Type': 'image',
                 'Content-Length': img.length
              });
              res.end(img);
            }
            imageCount++;
          }
        }
      }
    }
  });
});

router.get('/:id', function(req, res) {
  var postID = req.params.id;
  if(req.user)
  {
    if(req.user.title == 'mentor') {
      User.PostSchema.findOne({_id: postID}).populate([{
    		path: 'answers',
    		options: {sort: {'timestamp': 1}},
    		populate: {path: 'author'}}, 'files', {path: 'author'}]).exec(function(err, post) {
          if(post) {
            res.render('mentor-view-post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer')});
          }else{
            req.redirect('/mentor');
          }
      });
    }else{
      User.userHasPrivatePostById(req.user._id, postID, function(found) {
        if(found == true)
        {
          User.PostSchema.findOne({_id: postID}).populate([{
        		path: 'answers',
        		options: {sort: {'timestamp': 1}},
        		populate: {path: 'author'}}, 'files', {path: 'author'}]).exec(function(err, post) {
            var today = moment(Date.now());
            var description = JSON.parse(post.description);
            if(description.length == 0 || description[0].insert.trim() == "") {
              description = null;
            }else{
              description = post.description;
            }
            res.render('mentor-view-post', {layout: 'dashboard-layout', post: post, saved: req.flash('saved_answer'), date: today, description: description, username: req.user.username, isowner: true});
          });
        }else{
          res.redirect('/mentor');
        }
      });
    }
  }else{
    req.flash('origin');
    req.flash('origin', '/mentor/'+postID);
    res.redirect('../../login');
  }

});

router.post('/:id/answer', function(req, res) {

  var postID = req.params.id;
  // console.log("Id: " + postID);
  var message = req.body.answer;
  var author = req.user.username;

  if(req.user)
  {
    if(req.user.title == 'mentor')
    {
      User.PostSchema.findOne({_id: postID}).populate(['answers', 'assignedMentor']).exec(function(err, post) {
        // set assignedMentor in database
        if (!post.assignedMentor) {
          post.assignedMentor = req.user;
        }

        if(err) throw err;
        var newAnswer = new User.AnswerSchema();
        newAnswer.answer = message;
        newAnswer.author = req.user;

        newAnswer.save(function(err) {
          if(err) throw err;
          // saved
        });

        req.user.qualities.assists += 10;
				User.updateRank(req.user);

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

          <h3>Link to the <a href="https://codeassist.org/mentor/${postID}">Answer</a></h3>

          <h3>Contact details</h3>
          <ul>
            <li>Date Replied: ${newAnswer.timestamp}</li>
            <li>Mentor Name: ${author}</li>
            <li>Mentor Email: ${req.user.email}</li>
            <li><a href="https://codeassist.org/team">About the Mentors</a></li>
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
          res.send('/mentor/'+postID);
        });
      });
    }else{
      User.userHasPrivatePostById(req.user._id, postID, function(found) {
        if(found == true)
        {
          User.PostSchema.findOne({_id: postID}).populate(['answers', 'assignedMentor']).exec(function(err, post) {
            if(err) throw err;
            var newAnswer = new User.AnswerSchema();
            newAnswer.answer = message;
            newAnswer.author = req.user;

            newAnswer.save(function(err) {
              if(err) throw err;
              // saved
            });

            post.answers.push(newAnswer);
            post.save(function(err) {
              if(err) throw err;
              // console.log("Answer saved");
            });

            var imageCounter = 0;
            var converter = new QuillDeltaToHtmlConverter(JSON.parse(message), {});

            converter.afterRender(function(groupType, htmlString){
              // console.log(htmlString);
              htmlString = htmlString.replace(/<pre>/g, "<pre style='background-color: #23241f;color: #f8f8f2;overflow: visible;white-space: pre-wrap;margin-bottom: 5px;margin-top: 5px;padding: 5px 10px;border-radius: 3px;'>");

              htmlString = htmlString.replace(/<img([\w\W]+?)>/g, function() {
                return `<img src='http://codeassist.org/mentor/answer/${newAnswer._id}/image/${imageCounter++}'/>`
              });

              return htmlString;
            });

            var quillHTML = converter.convert();

            if (post.assignedMentor) {
              const output = `
                <p>Hi ${post.assignedMentor.username},</p>
                <p>A User recently replied to a private post</p>
                <h2>Reply Details<h2>
                <hr>

                <h3>Answer</h3>
                ${quillHTML}

                <h3>Contact details</h3>
                <ul>
                  <li>Date Posted: ${newAnswer.timestamp}</li>
                  <li>User's Name: ${author}</li>
                  <li>User's Email: ${req.user.email}</li>
                  <li>Link: <a href="https://codeassist.org/mentor/${postID}">Post</a></li>
                </ul>
              `;

              const msg = {
                to: post.assignedMentor.email,
                from: `Code Assist <${process.env.SENDER_EMAIL}>`,
                subject: 'New User Reply to Private Post',
                html: output
              };
              sgMail.send(msg);
              console.log('============================================');
              console.log("Sending Email to Assigned Mentor ... ");
              console.log("Mentor's Username: " + post.assignedMentor.username);
              console.log("Redirecting to: Specific Private post page from: Specific Private post page");
              console.log('============================================');
              res.send('/mentor/'+postID);
            } else {
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
                    ${quillHTML}

                    <h3>Contact details</h3>
                    <ul>
                      <li>Date Posted: ${newAnswer.timestamp}</li>
                      <li>User's Name: ${author}</li>
                      <li>User's Email: ${req.user.email}</li>
                      <li>Link: <a href="https://codeassist.org/mentor/${postID}">Post</a></li>
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
                res.send('/mentor/'+postID);
              });
            }

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

    req.flash('origin', '/mentor/'+postID);
    req.flash('saved_answer', message);
    res.send('/login');
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

router.get('/post/edit/:id', function(req, res) {
  var postID = req.params.id;
  if(req.user) {
    User.UserSchema.findOne({_id: req.user._id}).populate("private_posts").exec(function(err, user) {
      if(err) throw err;
      var allPosts = user.private_posts;
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
            res.render('mentor-edit-post', {layout: 'dashboard-layout', post: post});
          }else{
            res.redirect('/mentor/' + postID);
          }
        });
      }else{
        res.redirect('/mentor/' + postID);
      }
    });
  }else{
    req.flash('origin');
    req.flash('origin', '/mentor/post/edit/'+postID);
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
		var author = req.user.username;
		var prog_lang = req.body.programming;
		var authorid = req.user._id;
    var removedFileIds = req.body.removedFileIds;

		if (question.trim().split(' ').length < 3) {
			data.questionInvalid = true;
			res.send(data);
		}else{
			User.UserSchema.findOne({_id: req.user._id}).populate('private_posts').exec(function(err, user) {
				if(err) throw err;
				var found = false;
				var allPosts = user.private_posts;
				for(var i = 0; i < allPosts.length; i++) {
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
								console.log("removing file: " + removedFileIds[i])
								post.files.pull({_id: removedFileIds[i]});
								User.FileRefSchema.findOneAndRemove({_id: removedFileIds[i]}, function(err, fileRef) {
									gfs.files.remove({_id: fileRef.fileID});
								});
							}
						}

						post.status.edited = true;
						post.save(function(err) {
							if(err) throw err;
							data.auth = true;
							data.url = '/mentor/' + postID;
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
		req.flash('origin', '/mentor/post/edit/'+postID);
		data.url = '/login';
		res.send(data);
	}
});

router.post('/filter', function(req, res) {
  if(req.user) {
    if(req.user.title == 'mentor')
      var isMentor = true;

    var option = req.body.filter_opt;
    console.log("Made filter request: " + option);

    if (!option || option == "Remove Filter")
      option = {$exists: true}; // will match any language

    if(req.user.title == 'mentor')
    {
      User.UserSchema.findOne({_id: req.user._id}).populate({
        path: 'private_posts',
        match: {prog_lang: option},
        options: {sort: {'timestamp': -1}, limit: postLimit},
        select: '_id timestamp author question description prog_lang answers',
        populate: [{path: 'assignedMentor', select: '_id username'}, {path: 'author', select: 'qualities.rank username pic'}]
      }).lean().exec(function(err, user) {
        var postsToAdd = user.private_posts;

        addDescriptionPreviews(postsToAdd);

        for (var i = 0; i < postsToAdd.length; i++) {
          if (postsToAdd[i].assignedMentor && postsToAdd[i].assignedMentor._id.equals(req.user._id)) {
            postsToAdd[i].assignedToSelf = true;
          }
        }

        if (postsToAdd.length > 0) {
          User.UserSchema.findOne({_id: req.user._id}).populate({
            path: 'private_posts',
            match: {prog_lang: option, timestamp: {$lt: postsToAdd[postsToAdd.length-1].timestamp}},
          }).exec(function(err, userWithRemainingPosts) {
            var count = userWithRemainingPosts.private_posts.length;
            res.send({
              postsToAdd: postsToAdd,
              userIsMentor: true,
              morePostsAvailable: count > 0
            });
          });
        } else {
          res.send({
            postsToAdd: [],
            userIsMentor: true,
            morePostsAvailable: false
          });
        }

      });
    } else {
      User.UserSchema.findOne({_id: req.user._id}).populate({
        path: 'private_posts',
        match: {prog_lang: option},
        options: {sort: {'timestamp': -1}, limit: postLimit},
        select: '_id timestamp author question description prog_lang answers',
        populate: {path: 'author', select: 'qualities.rank username pic'}
      }).exec(function(err, user) {
        var postsToAdd = user.private_posts;

        if (postsToAdd.length > 0) {
          User.UserSchema.findOne({_id: req.user._id}).populate({
            path: 'private_posts',
            match: {prog_lang: option, timestamp: {$lt: postsToAdd[postsToAdd.length-1].timestamp}},
          }).exec(function(err, userWithRemainingPosts) {
            var count = userWithRemainingPosts.private_posts.length;
            res.send({
              postsToAdd: postsToAdd,
              userIsMentor: false,
              morePostsAvailable: count > 0
            });
          });
        } else {
          res.send({
            postsToAdd: [],
            userIsMentor: false,
            morePostsAvailable: false
          });
        }
      });
    }
  } else {
    req.flash('origin');
    req.flash('origin', '/mentor/');
    res.send({url: '/login'});
  }
});
module.exports = router;
