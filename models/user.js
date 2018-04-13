// var mongo = require('mongodb');
// var MongoClient = mongo.MongoClient;
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/code-assist');
var db = mongoose.connection;


var ThreadSchema = new Schema({
		question: String,
		answer: String
});

var PostSchema = new Schema({
		name: String
});

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
		threads: [PostSchema]
});

var Thread = mongoose.model('Thread', ThreadSchema);
var Post = mongoose.model('Post', PostSchema);
var User = mongoose.model('User', UserSchema);

module.exports = {
	User: User,
	Post: Post,
	Thread: Thread
}
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
	var query = {username: username};
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
