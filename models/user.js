require('dotenv').config();
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connection;
const sgMail = require('@sendgrid/mail');
var request = require('superagent');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
var mailchimpInstance   = process.env.MAILCHIMP_SERVER_INSTANCE,
    levelUpListID       = process.env.MAILCHIMP_LEVEL_UP_LIST,
    mailchimpApiKey     = process.env.MAILCHIMP_API_KEY;

// Chat Schema
var ChatSchema = new Schema({
	authorid: String,
	author:String,
	message:String,
	date:String,
	projectid:String,
});

// Notification Schema
var NotificationSchema = new Schema ({
	message: String,
	link: String
});

// User Schema
var UserSchema = new Schema({

		membership: {type: String, default: "free"}, // "free", "premium"
		subscribed: false,
		status: {type: String, default: "new"}, // "new", "using"

		first: String,
		last: String,

		username: {
			type: String,
			index: true
		},

		pic: String,

		profile: {
			status: {type: String, default: "public"}, // "public", private"
			assists_added: {type: Number, default: null}, // assists awarded
      level_up_Email_status: {type: String}
		},

	  email: {
	    type: String
	  },

		password: {
			type: String
		},

		title: {type: String, default: "user"}, // user, mentor, admin

		bio: String,

		e_link: String,

		forgotpasslastattempt:{type:Date},
		forgotpass_link: String, // nanoid module 21-characters
		password_reset_attempts: {type: Number, default: 0}, // max 3 attempts

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
		}],

		qualities: {
			rank: {type: String, default: "bronze"}, // bronze, silver, gold, platinum
			assists: {type: Number, default: 0}
		},

		profile_url: String,

		notifications: [{
			type: Schema.Types.ObjectId,
			ref: 'NotificationSchema'
		}],
		unread_notifications: Boolean
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

// var ProjectFileSchema = new Schema ({
// 	fileName: String,
// 	text: String
// });

//Project Schema
var ProjectSchema = new Schema({
	name: String,
	thumbnail: String,
	date_created: {type: Date, default: Date.now},
	last_modified: {type: Date, default: Date.now},

	owner: {
		type: Schema.Types.ObjectId,
		ref: 'UserSchema'
	},

	usersWithAccess: [{ // Doesn't include owner
		type: Schema.Types.ObjectId,
		ref: 'UserSchema'
	}],

	fileNames: [{
			type: String,
	}],

	chatHistory:[{
	  type: Schema.Types.ObjectId,
	  ref:'ChatSchema'
	}],

	assignedMentor: {
		type: Schema.Types.ObjectId,
		ref: 'UserSchema'
	},

	invitationPending: false,
	mentor_invitation_secret: String,

	status: {type: String, default: "new"} // new, using, unused
});

// Post Schema
var PostSchema = new Schema ({
	author: {
		type: Schema.Types.ObjectId,
		ref: 'UserSchema'
	},
	authorid: String,
	timestamp: {type: Date, default: Date.now},
	question: String,
	description: String,
	prog_lang: String,
	status: {
		edited: false
		// add others in the future
	},
	answers: [{
		type: Schema.Types.ObjectId,
		ref: 'AnswerSchema'
	}],
	files: [{
		type: Schema.Types.ObjectId,
		ref: 'FileRefSchema'
	}],
	assignedMentor: {
		type: Schema.Types.ObjectId,
		ref: 'UserSchema'
	},
	userLikes: [{
		type: Schema.Types.ObjectId,
		ref: 'UserSchema'
	}],
	likeCount: {type: Number, default: 0}
});

var AnswerSchema = new Schema ({
	author: {
		type: Schema.Types.ObjectId,
		ref: 'UserSchema'
	},
	answer: String,
	timestamp: {type: Date, default: Date.now},
	userLikes: [{
		type: Schema.Types.ObjectId,
		ref: 'UserSchema'
	}],
	likeCount: {type: Number, default: 0},

	status: {
		edited: false
		// add others in the future
	}

  // ...
});

var User = mongoose.model('UserSchema', UserSchema);
var CommunitySchema = mongoose.model('CommunitySchema', CommunitySchema);
var PostSchema = mongoose.model('PostSchema', PostSchema);
var AnswerSchema = mongoose.model('AnswerSchema', AnswerSchema);
var FileRefSchema = mongoose.model('FileRefSchema', FileRefSchema);
var ProjectSchema = mongoose.model('ProjectSchema', ProjectSchema);
// var ProjectFileSchema = mongoose.model('ProjectFileSchema', ProjectFileSchema);
var ChatSchema = mongoose.model('ChatSchema', ChatSchema);
var NotificationSchema = mongoose.model('NotificationSchema', NotificationSchema);


module.exports = {
	UserSchema: User,
	CommunitySchema: CommunitySchema,
	PostSchema: PostSchema,
	AnswerSchema: AnswerSchema,
	FileRefSchema: FileRefSchema,
	ProjectSchema: ProjectSchema,
	// ProjectFileSchema: ProjectFileSchema,
	ChatSchema: ChatSchema,
	NotificationSchema: NotificationSchema
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
	// User.findById(id, callback);
	User.findById(id).populate('notifications').exec(callback);
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
};

module.exports.isLinkValid = function(originalDate, compareDate, days, callback) {
	var diff = (((((Math.abs(originalDate-compareDate))/1000)/60)/60)/24);
	if(diff <= days) {
		callback(true);
		return;
	}
	callback(false);
	return;
};

module.exports.updateRank = function(user, oldRank) {
	if(user.qualities.assists < 50) {
		user.qualities.rank = "bronze";
	}else if(user.qualities.assists < 100) {
		user.qualities.rank = "silver";
	}else if(user.qualities.assists < 250) {
		user.qualities.rank = "gold";
	}else{
		user.qualities.rank = "platinum";
	}
	user.save(function(err) {
		if(err) throw err;
		// rank updated!
		if(oldRank != user.qualities.rank) {
			request
			.post('https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + levelUpListID + '/members/')
			.set('Content-Type', 'application/json;charset=utf-8')
			.set('Authorization', 'Basic ' + new Buffer('any:' + mailchimpApiKey ).toString('base64'))
			.send({
				'email_address': user.email,
				'status': 'subscribed',
				'merge_fields': {
					'FNAME': (user.first == null) ? user.username : user.first
				}
			}).end(function(err, response) {
				if (response.status < 300 || (response.status === 400 && response.body.title === "Member Exists")) {
					// sign up successful
					console.log("User successfully subscribed to Mailchimp Level Up Email List");
					user.profile.level_up_Email_status = "silver";
					user.save(function(err) {
						if(err) throw err;
						// saved
					});
				} else {
					console.log("User already subscibed on Mailchimp Level Up Email List - OR - User subscription to Mailchimp Level Up Email List Failed");
				}
			});
		}
	})
};

// ca-database crawler -> makes sure everybody gets emails for leveling up
function checkLevelUps(index) {
	User.find({}, function(err, users) {
		if(err) throw err;
		if(users) {
			if(users[index]) {
				var user = users[index];
				if((user.qualities.assists >= 50) && (user.profile.level_up_Email_status != "silver")) {
					// mailchimp api
					request
					.post('https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + levelUpListID + '/members/')
					.set('Content-Type', 'application/json;charset=utf-8')
					.set('Authorization', 'Basic ' + new Buffer('any:' + mailchimpApiKey ).toString('base64'))
					.send({
						'email_address': user.email,
						'status': 'subscribed',
						'merge_fields': {
							'FNAME': (user.first == null) ? user.username : user.first
						}
					}).end(function(err, response) {
						if (response.status < 300 || (response.status === 400 && response.body.title === "Member Exists")) {
							// sign up successful
							console.log("User successfully subscribed to Mailchimp Level Up Email List");
							user.profile.level_up_Email_status = "silver";
							user.save(function(err) {
								if(err) throw err;
								// saved
							});

						} else {
							console.log("User already subscibed on Mailchimp Level Up Email List - OR - User subscription to Mailchimp Level Up Email List Failed");
						}
					});
				}
				index++;
			}else{
				index = 0;
			}
		}
		setTimeout(function() {checkLevelUps(index);}, 5000);
	});
};
setTimeout(function() {
	checkLevelUps(0);
}, 1000);


module.exports.emailAllMentors = function(subject, msg) {
	var meta = {
		from: `Code Assist <${process.env.SENDER_EMAIL}>`,
		subject: subject,
		html: msg
	};

	User.find({title: "mentor"}, function(err, mentors) {
		console.log("Emailing", mentors.length, "mentors for:", subject);
		for (var i = 0; i < mentors.length; i++) {
			var mentor = mentors[i];
			meta.to = mentor.email;
			sgMail.send(meta);
		}
	});
	return;
};

/*
==============================
Database Utilities
==============================
*/

// UserSchema.methods.addPost = function(ps) {
// 	this.thread
// }
