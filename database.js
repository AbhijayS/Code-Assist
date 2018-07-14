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
// **************************************

mongoose.connect(database);
var conn = mongoose.connection;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
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

var upload = multer({storage});

module.exports.upload = upload;
