var mongoose = require('mongoose');

// File Upload Dependencies>>
var multer = require('multer');
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
var methodOverride = require('method-override');
var crypto = require('crypto');
var path = require('path');
require('dotenv').config();

//Database Connection

// ***** USE DB_HOST when deploying *****
var database = process.env.DB_HOST_TEST;
console.log("Using LOCAL Database");
// **************************************

// var database = process.env.DB_HOST;
// console.log("Using REMOTE Database");

mongoose.connect(database);
var conn = mongoose.connection;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
  // gfs.collection('profilePics');
});

var storage = new GridFsStorage({
  url: database,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        // const filename = buf.toString('hex') + path.extname(file.originalname);
        const filename = file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

var profilePicStorage = new GridFsStorage({
  url: database,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        // const filename = buf.toString('hex') + path.extname(file.originalname);
        const filename = file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: 'profilePics'
        };
        resolve(fileInfo);
      });
    });
  }
});

var upload = multer({storage});
var profilePicUpload = multer({
  storage: profilePicStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname).toLowerCase();
    if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      // return callback(new Error('Only images are allowed'));
      return callback(null, false);
    }
    callback(null, true)
  },
});

module.exports.upload = upload;
module.exports.profilePicUpload = profilePicUpload;