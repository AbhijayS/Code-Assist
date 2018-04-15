var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/testing-code');
var db = mongoose.connection;

var CommunitySchema = new Schema ({
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'PostSchema'
  }]
});

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

var CommunitySchema = mongoose.model('CommunitySchema', CommunitySchema);
var PostSchema = mongoose.model('PostSchema', PostSchema);
var AnswerSchema = mongoose.model('AnswerSchema', AnswerSchema);

module.exports = {
  CommunitySchema: CommunitySchema,
  PostSchema: PostSchema,
  AnswerSchema: AnswerSchema
}

var newPost = new PostSchema({
    question: "What?",
    answers:[]
});

newPost.save(function(err) {
  if(err) throw err;
  console.log('Temp post created');
})
