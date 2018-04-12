var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var bcrypt = require('bcryptjs');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/code-assist');
var db = mongoose.connection;


var ThreadSchema = mongoose.Schema({
	question: String,
	answer: String
});

var PostSchema = mongoose.Schema({
	thread: [ThreadSchema]
});

// User Schema
var UserSchema = mongoose.Schema({
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

var Thread = module.exports = mongoose.model('Thread', ThreadSchema);
var Post = module.exports = mongoose.model('Post', PostSchema);
var User = module.exports = mongoose.model('User', UserSchema);

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
// module.exports.getUserByUsername = function(username, callback){
// 	var query = {username: username};
// 	User.findOne(query, callback);
// }
//
// module.exports.getUserById = function(id, callback){
// 	User.findById(id, callback);
// }
//
// module.exports.comparePassword = function(candidatePassword, hash, callback){
// 	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
//     	if(err) throw err;
//     	callback(null, isMatch);
// 	});
// }
