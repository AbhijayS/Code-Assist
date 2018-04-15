// var mongo = require('mongodb');
// var MongoClient = mongo.MongoClient;
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/code-assist');
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
		posts: [{
			type: Schema.Types.ObjectId,
			ref: 'PostSchema'
		}]
});

var CommunitySchema = new Schema ({
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'PostSchema'
  }]
});

var PostSchema = new Schema ({
	timestamp: {type: Date, default: Date.now},
	question: String,
	description: String,
  answers: [{
    type: Schema.Types.ObjectId,
    ref: 'AnswerSchema'
  }]
});

var AnswerSchema = new Schema ({
  answer: String
  // ...
});

var User = mongoose.model('UserSchema', UserSchema);
var CommunitySchema = mongoose.model('CommunitySchema', CommunitySchema);
var PostSchema = mongoose.model('PostSchema', PostSchema);
var AnswerSchema = mongoose.model('AnswerSchema', AnswerSchema);

module.exports = {
	UserSchema: User,
	CommunitySchema: CommunitySchema,
	PostSchema: PostSchema,
	AnswerSchema: AnswerSchema
}

CommunitySchema.findOne({}).populate('posts').exec(function(err, community) {
	console.log("community: " + community)
	if (!community) {
		// create new community
		var newCommunity = new CommunitySchema({
			posts: []
		});

		newCommunity.save(function(err) {
			if(err) throw err;
			console.log('Community created');
		});
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
module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        newUser.save(callback);
	    });
	});
}

module.exports.getUserByUsername = function(username, callback) {
	// "i" regex ignores upper/lowercase
	var query = {username: new RegExp(username, 'i')};
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

/*
==============================
Database Utilities
==============================
*/

// UserSchema.methods.addPost = function(ps) {
// 	this.thread
// }
