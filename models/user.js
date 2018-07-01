// var mongo = require('mongodb');
// var MongoClient = mongo.MongoClient;
require('dotenv').config();
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// mongoose.connect(process.env.DB_HOST);
// mongoose.connect(process.env.DB_HOST_TEST);
var db = mongoose.connection;

// User Schema
var UserSchema = new Schema({
		username: {
			type: String,
			index:true
		},
	  email: {
	    type: String
	  },
		password: {
			type: String
		},

		title: String,

		posts: [{
			type: Schema.Types.ObjectId,
			ref: 'PostSchema'
		}],

		private_posts: [{
			type: Schema.Types.ObjectId,
			ref: 'PostSchema'
		}],

		projectsWithAccess:[{
			type: Schema.Types.ObjectId,
			ref: 'ProjectSchema'
		}]
});

var CommunitySchema = new Schema ({
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'PostSchema'
  }]
});

// File Reference Schema
var FileRefSchema = new Schema ({
	name: String,
	fileID: Schema.Types.ObjectId
});

var ProjectFileSchema = new Schema ({
	fileName: String,
	text: String
});

//Project Schema
var ProjectSchema = new Schema({
	name: String,
	owner: String,
	ownerid: String,

	userIdsWithAccess: [{ // Users other than the owner ==> Level 0: View; Level 1: Edit; Level 2: Owner
		type: String
	}],

	files: [{
	type: Schema.Types.ObjectId,
	ref: 'ProjectFileSchema'
	}],

	chatHistory:[{
		type: String
	}],
	status: String, // new, using, unused, deleted

	// description: String,
	// name: String,
});

// Post Schema
var PostSchema = new Schema ({
	author: String,
	authorid:String,
	timestamp: {type: Date, default: Date.now},
	question: String,
	description: String,
	prog_lang: String,
	answers: [{
		type: Schema.Types.ObjectId,
		ref: 'AnswerSchema'
	}],
	files: [{
		type: Schema.Types.ObjectId,
		ref: 'FileRefSchema'
	}]
});

var AnswerSchema = new Schema ({
	author: String,
  	answer: String,
	timestamp: {type: Date, default: Date.now}
  // ...
});

var User = mongoose.model('UserSchema', UserSchema);
var CommunitySchema = mongoose.model('CommunitySchema', CommunitySchema);
var PostSchema = mongoose.model('PostSchema', PostSchema);
var AnswerSchema = mongoose.model('AnswerSchema', AnswerSchema);
var FileRefSchema = mongoose.model('FileRefSchema', FileRefSchema);
var ProjectSchema = mongoose.model('ProjectSchema', ProjectSchema);
var ProjectFileSchema = mongoose.model('ProjectFileSchema', ProjectFileSchema);

module.exports = {
	UserSchema: User,
	CommunitySchema: CommunitySchema,
	PostSchema: PostSchema,
	AnswerSchema: AnswerSchema,
	FileRefSchema: FileRefSchema,
	ProjectSchema: ProjectSchema,
	ProjectFileSchema: ProjectFileSchema
}

CommunitySchema.findOne({}).populate('posts').exec(function(err, community) {
	if (!community) {
		// create new community
		var newCommunity = new CommunitySchema({
			posts: []
		});

		newCommunity.save(function(err) {
			if(err) throw err;
			console.log('Code Assist Community created');
			console.log('------------------------------------');
		});
	}else{
		console.log("Welcome Again: Code Assist Community");
		console.log('------------------------------------');
	}
// } else {
// 	// add posts to community
// 	if(community.posts.length < 2)
// 	{
// 		var newPost = new PostSchema({
// 			question: "What?",
// 			answers:[]
// 		});
//
// 		newPost.save(function(err) {
// 			if(err) throw err;
// 			console.log('Temp post created');
// 		});
//
// 		community.posts.push(newPost);
//
// 		community.save(function(err) {
// 			if(err) throw err;
// 			console.log('Temp post added to Community');
// 		});
// 	}

});

// For adding to answers to posts

/*PostSchema.find({}, function(err, post) {
	console.log(post);
	if(post.length < 2)
	{
		var newPost = new PostSchema({
			question: "What?",
			answers:[]
		});

		newPost.save(function(err) {
			if(err) throw err;
			console.log('Temp post created');
		});
	}

});*/

// PostSchema.find({}, function(err, post) {
// 	console.log(post);
// 	if(post.length < 2)
// 	{
// 		var newPost = new PostSchema({
// 			question: "What?",
// 			answers:[]
// 		});
//
// 		newPost.save(function(err) {
// 			if(err) throw err;
// 			console.log('Temp post created');
// 		});
// 	}
//
// });

/*
==============================
User Creation
==============================
*/
var saltRounds = 10;
module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(saltRounds, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        newUser.save(callback);
	    });
	});
}

module.exports.getUserByUsername = function(username, callback) {
	// "i" regex ignores upper/lowercase
	var query = {username: username};
	User.findOne(query, callback);
}

module.exports.getUserByUserId = function(_id, callback) {
	// "i" regex ignores upper/lowercase
	var query = {_id: _id};
	User.findOne(query, callback);
}

module.exports.getUserByEmail = function(email, callback) {
	// "i" regex ignores upper/lowercase
	var query = {email: new RegExp(email, 'i')};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback) {
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
		if(err) throw err;
		callback(null, isMatch);
	});
}

module.exports.createHash = function(candidatePassword, callback) {
	bcrypt.hash(candidatePassword, saltRounds, function(err, hash) {
  // Store hash in your password DB.
		if(err) throw err;
		callback(null, hash);
	});
}

module.exports.userHasPrivatePostById = function(userID, postID, callback) {
	User.findOne({_id: userID}).populate('private_posts').exec(function(err, user)
	{
		if(err) throw err;
		if(user)
		{
			var posts = user.private_posts;
			// console.log("# Posts: " + posts.length);
			for (var i = 0; i < posts.length; i++)
			{
				if(posts[i]._id == postID)
				{
					// console.log("True");
					callback(true);
					return;
				}
			}
			// console.log("False");
			callback(false);
			return;

		}else{
			// console.log("False");
			callback(false);
			return;
		}
	});
}
/*
==============================
Database Utilities
==============================
*/

// UserSchema.methods.addPost = function(ps) {
// 	this.thread
// }
