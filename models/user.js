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
		}
});

// var CommunitySchema = new Schema ({
//   posts: [{
//     type: Schema.Types.ObjectId,
//     ref: 'PostSchema'
//   }]
// });

var PostSchema = new Schema ({
  question: String,
  answers: [{
    type: Schema.Types.ObjectId,
    ref: 'AnswerSchema'
  }]
});

var AnswerSchema = new Schema ({
  answer: String
  // ...
});

// var Thread = mongoose.model('Thread', ThreadSchema);
// var CommunitySchema = mongoose.model('CommunitySchema', CommunitySchema);
var PostSchema = mongoose.model('PostSchema', PostSchema);
var AnswerSchema = mongoose.model('AnswerSchema', AnswerSchema);
var User = mongoose.model('User', UserSchema);

module.exports = {
  // CommunitySchema: CommunitySchema,
  PostSchema: PostSchema,
  AnswerSchema: AnswerSchema,
	User: User
}

PostSchema.find({}, function(err, post) {
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

});

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
