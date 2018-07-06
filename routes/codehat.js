var express = require('express');
var path = require('path');
var async = require('async');
var router = express.Router({'strict' : true});
var User = require('../models/user');
var server = require('../app').server;
var upload = require('../database').upload;
var uniqid = require('uniqid');
var zip = new require('node-zip')();

var socket = require('socket.io');
var io = socket(server);

var currentProjects = [];

var javaStarter = `public class Main {
	public static void main(String[] args) {

	}
}`;

function projectActive(id) {
	for (let i = 0; i < currentProjects.length; i++) {
		if (currentProjects[i].id == id)
			return true;
	}
	return false;
}

router.get('/', function(req, res){
	res.render('codehat', {layout: 'dashboard-layout'});
});

router.post('/', function(req, res){
	if(req.user){
		var newProject = new User.ProjectSchema();
		newProject.ownerid = req.user._id;

		newProject.save(function(err) {
		  if(err) throw err;
		  console.log('new codehat project saved');
		});
		res.redirect("/codehat/" + newProject._id);
	} else {
		req.flash('origin');
		req.flash('origin', '/codehat');
		res.redirect("/login");
	}
});

router.get('/:id/', function(req, res) {
	var projectID = req.params.id;
	User.ProjectSchema.findOne({_id: projectID}).exec(function(err, project) {
		if (project) {
			var useraccesslevel=0;
			if(req.user){
				var accessedusers=project.userIdsWithAccess;
				for(var counter1=0;counter1<accessedusers.length;counter1++){
					if(accessedusers[counter1]==req.user._id){
						useraccesslevel=1;
					}
					console.log(accessedusers[counter1]);

				}
				console.log(accessedusers);

				if(project.ownerid==req.user._id){
					useraccesslevel=2;
				}
				console.log("user connecting to codehat project with access level "+useraccesslevel);
				
				if (!projectActive(projectID)){
					// currentProjects.push(new Project(project._id, project.files));
					currentProjects.push(new Project(project._id));
				}
			}
			res.render('codehat-project', {layout: false, namespace: '/' + projectID, clearance:useraccesslevel, project: project});
		} else {
			res.send("Invalid project");
		}
	});
});

// for file downloading
router.get('/:id/file/:fileIndex', function(req, res) {
	var projectID = req.params.id;
	var fileIndex = req.params.fileIndex;

	User.ProjectSchema.findOne({_id: projectID}, function(err, project) {
		if (project.fileNames[fileIndex]) {
			var file = "./codehat_files/" + projectID + "/" + project.fileNames[fileIndex];

			var projectObject = getCurrentProject(projectID);
			if (projectObject && fs.existsSync(file)) {
				fs.writeFile(file, projectObject.files[fileIndex].text, function(err) {
					if (err)
						console.log(err);

					res.download(file);
				});			
			} else {
				res.end();
			}
		} else {
			res.end();
		}
	});
});

router.get('/:id/downloadAll', function(req, res) {
	var projectID = req.params.id;
	var projectDir = "./codehat_files/" + projectID + "/";

	User.ProjectSchema.findOne({_id: projectID}, function(err, project) {
		async.each(project.fileNames, function(fileName, callback) {
			if (fs.existsSync(projectDir + fileName)) {
				fs.readFile(projectDir + fileName, {encoding: 'utf-8'}, function(err, text) {
					if (err) {
						console.log(err);
					}

					zip.file(fileName, text);
					callback();	
				});
			}
		}, function() {
			var data = zip.generate({base64: false, compression:'DEFLATE'});
			res.set('Content-Disposition', 'attachment; filename="Project_Files.zip"');
			res.end(data, 'binary')	;
		});
	});

});

// to make html sources accessible
router.get('/:id/:fileName', function(req, res) {
	var projectID = req.params.id;
	var fileName = req.params.fileName;

	var file = "./codehat_files/" + projectID + "/" + fileName;
	if (fs.existsSync(file)) {
		res.download(file);
	} else {
		res.end();
	}
});

var child_process = require('child_process');
var exec = child_process.exec;
var spawn = child_process.spawn;
var fs = require('fs');
// var folderPath = "./codehat_files/";

function File(fileName, text, untitledName) {
	this.fileName = fileName;
	this.untitledName = untitledName;
	this.htmlPreviewCode;
	this.text = text;
	this.cursors = {};
	this.selections = {};
	this.saveTimeout;
}

function saveAllFiles(folderPath, files) {
	async.each(files, function(file, callback) {
		if (file.fileName) {
			fs.writeFile(folderPath + file.fileName, file.text, function(err) {
				if (err) {
					console.log(err);
				}

				callback();
			});
		} else {
			callback();
		}
	}, function (err) {
		if (err) {
			console.log('A file failed to save');
		} else {
			console.log('All files have been saved successfully');
		}
	});
}

function getCurrentProject(id) {
	for (var i = 0; i < currentProjects.length; i++) {
		if (currentProjects[i].id == id)
			return currentProjects[i];
	}
}

function Project(id) {
	var self = this;
	this.id = id;
	this.folderPath = "./codehat_files/" + id + "/";

	this.files = [];

	this.addUntitledFile = function() {
		if (!fs.existsSync(self.folderPath + "untitled_files")) {
			fs.mkdirSync(self.folderPath + "untitled_files");
		}

		var untitledName = "untitled_" + uniqid() + ".txt";
		self.files.push(new File("", "", untitledName));
		fs.writeFile(self.folderPath + "untitled_files/" + untitledName, "", function(err) {
			if (err)
				console.log(err);
		});

		// add untitled file to file namelist in database
		User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
			project.fileNames.push(untitledName);
			project.save(function(err) {
				if (err) console.log(err);
			});
		});
	};

	if (fs.existsSync(this.folderPath)) {
		// get array of fileNames from database
		User.ProjectSchema.findOne({_id: self.id}, {'fileNames': true}).exec(function(err, project) {
			var fileNames = project.fileNames;

			// add existing files to project
			async.eachSeries(fileNames, function(filename, callback) {
				// if file has a name
				if (fs.existsSync(self.folderPath + filename)) {
					fs.readFile(self.folderPath + filename, {encoding: 'utf-8'}, function(err, text){
						if (err) {
							console.log(err);
						}
						self.files.push(new File(filename, text));
						callback();
					});
				} else if (fs.existsSync(self.folderPath + "untitled_files/" + filename)) {
					// add untitled file to project
					fs.readFile(self.folderPath + "untitled_files/" + filename, {encoding: 'utf-8'}, function(err, text){
						if (err) {
							console.log(err);
						}
						self.files.push(new File("", text, filename));
						callback();
					});
				}
			});

		});

	} else {
		// create folder for project if it doesn't exist yet
		fs.mkdirSync(this.folderPath);
		self.addUntitledFile();
	}
	
	this.outputError = false;
	this.output = "";

	this.runner;

	// nsp is the socket.io namespace
	this.nsp = io.of('/'+this.id)

	this.nsp.on('connection', function connection(socket) {
		console.log("new codehat connection");
		socket.emit("socketID", socket.id);
		socket.emit("files", self.files);

		if (self.outputError) {
			socket.emit("outputError", self.output);
		} else {
			socket.emit("output", self.output);
		}

		socket.on("updateFile", function(text, fileIndex) {
			var file = self.files[fileIndex];
			file.text = text;

			if (file.saveTimeout)
				clearTimeout(file.saveTimeout);

			file.saveTimeout = setTimeout(function() {
				if (file.fileName) {
					console.log("saving")
					fs.writeFile(self.folderPath + file.fileName, text, function(err) {
						if (err)
							console.log(err);
					});		
				} else {
					fs.writeFile(self.folderPath + "untitled_files/" + file.untitledName, text, function(err) {
						if (err)
							console.log(err);
					});	
				}
			}, 1000);
		});

		socket.on("fileChange", function(event, sessionIndex) { // emits changes to everyone
			socket.broadcast.emit("fileChange", event, sessionIndex);
		});

		socket.on("fileRenamed", function(newFileName, fileIndex) {
			var oldFileName = self.files[fileIndex].fileName;

			if (oldFileName && fs.existsSync(self.folderPath + oldFileName)) {

				if (newFileName) {
					// rename existing file
					fs.rename(self.folderPath + oldFileName, self.folderPath + newFileName, function(err) {
						if (err)
							console.log(err);
					});	

					// rename file in database
					User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
						var index = project.fileNames.indexOf(oldFileName);
						if (index != -1) {
							project.fileNames[index] = newFileName;
							project.markModified("fileNames");
							project.save(function(err) {
								if (err) console.log(err);
							});
						}
					});
				} else {
					// move file from main folder to untitled folder

					// recreates untitled_files folder just in case
					if (!fs.existsSync(self.folderPath + "untitled_files")) {
						fs.mkdirSync(self.folderPath + "untitled_files");
					}

					// get untitled file name
					var untitledName = "untitled_" + uniqid() + ".txt";
					self.files[fileIndex].untitledName = untitledName;

					fs.rename(self.folderPath + oldFileName, self.folderPath + "untitled_files/" + untitledName, function(err) {
						if (err)
							console.log(err);
					});

					// update database file name
					User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
						var index = project.fileNames.indexOf(oldFileName);
						if (index != -1) {
							project.fileNames[index] = untitledName;
							project.markModified("fileNames");

							project.save(function(err) {
								if (err) console.log(err);
							});
						}
					});

				}

			} else if (newFileName) {
				var untitledName = self.files[fileIndex].untitledName;
				// move file from untitled folder to main folder
				fs.rename(self.folderPath + "untitled_files/" + untitledName, self.folderPath + newFileName, function(err) {
					if (err)
						console.log(err);
				});

				User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
					var index = project.fileNames.indexOf(untitledName);
					if (index != -1) {
						project.fileNames[index] = newFileName;
						project.markModified("fileNames");

						project.save(function(err) {
							if (err) console.log(err);
						});
					}
				});
				self.files[fileIndex].untitledName = null;
			}

			self.files[fileIndex].fileName = newFileName;
			socket.broadcast.emit("renameFile", newFileName, fileIndex);
		});

		socket.on("fileAdded", function(fileName, text) {

			socket.broadcast.emit("addFile", fileName, text);

			if (fileName) {
				self.files.push(new File(fileName, text));
				fs.writeFile(self.folderPath + fileName, text, function(err) {
					if (err)
						console.log(err);
				});

				User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
					project.fileNames.push(fileName);
					project.save(function(err) {
						if (err) console.log(err);
					});
				});
			} else {
				// if untitled file is added
				self.addUntitledFile();
			}

		});

		socket.on("deleteFile", function(fileIndex) {
			// Delete File from system
			if (self.files[fileIndex].fileName) {
				var fileName = self.files[fileIndex].fileName;

				var filePath = self.folderPath + fileName;
				if (fs.existsSync(filePath)) {
					fs.unlink(filePath, function(error) {
						if (error) {
							console.log(error);
						}
					});		
				}

				if (path.extname(fileName) == ".java") {
					// also delete class file if it exists
					var classFilePath = self.folderPath + path.parse(fileName).name + ".class";
					if (fs.existsSync(classFilePath)) {
						fs.unlink(classFilePath, function(error) {
							if (error) {
								console.log(error);
							}
						});
					}	
				}

				// delete file Name from database
				User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
					var index = project.fileNames.indexOf(fileName);
					if (index != -1) {
						project.fileNames.splice(index, 1);
					}

					project.save(function(err) {
						if (err) console.log(err);
					});
				});
			} else {
				// delete untitled file
				var untitledName = self.files[fileIndex].untitledName;

				var filePath = self.folderPath + "untitled_files/" + untitledName;
				if (fs.existsSync(filePath)) {
					fs.unlink(filePath, function(error) {
						if (error) {
							console.log(error);
						}
					});		
				}

				// delete file Name from database
				User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
					var index = project.fileNames.indexOf(untitledName);
					if (index != -1) {
						project.fileNames.splice(index, 1);
					}

					project.save(function(err) {
						if (err) console.log(err);
					});
				});
			}

			self.files.splice(fileIndex, 1);
			socket.broadcast.emit("deleteFile", fileIndex);
		});

		socket.on("cursorChange", function(position, fileIndex) { // emits cursor changes
			// console.log(fileIndex);
			self.files[fileIndex].cursors[socket.id] = position;
			self.nsp.emit("cursors", self.files[fileIndex].cursors, fileIndex);
		});

		socket.on("selectionChange", function(range, fileIndex) { // emits cursor changes
			self.files[fileIndex].selections[socket.id] = range;
			self.nsp.emit("selections", self.files[fileIndex].selections, fileIndex);
		});

		socket.on("disconnect", function() {
			for (var i = 0; i < self.files.length; i++) {
				delete self.files[i].cursors[socket.id];
				delete self.files[i].selections[socket.id];	
			}

			self.nsp.emit("deleteCursors", socket.id);
			self.nsp.emit("deleteSelections", socket.id);
			// console.log(self.cursors);
		});

		socket.on("programInput", function(text) {
			if (self.runner) {
				self.runner.stdin.write(text+"\n");
				// runner.stdin.end();
			}
		});

		socket.on("run", function(fileIndex) {
			var file = self.files[fileIndex];
			var fileExt = path.extname(file.fileName);

			if (!file) {
				self.nsp.emit("outputError", "No file selected");
				self.nsp.emit("runFinished");
				return false;
			}

			if (!file.fileName) {
				self.nsp.emit("outputError", "Please enter a file name");
				self.nsp.emit("runFinished");
				return false;
			}

			if (fileExt == ".html") {
				socket.broadcast.emit("programRunning", fileIndex);
				file.htmlPreviewCode = file.text;
				self.nsp.emit("runFinished");
				return false;
			}

			if (fileExt != ".java" && fileExt != ".py" && fileExt != ".cpp") {
				self.nsp.emit("outputError", "Currently only .java, .py, and .cpp files are able to be compiled/run");
				self.nsp.emit("runFinished");
				return false;
			}

			if (!fs.existsSync(self.folderPath)) {
				fs.mkdirSync(self.folderPath);
			}

			self.output = "";
			self.outputError = false;
			socket.broadcast.emit("programRunning", fileIndex);
			// console.log("Saving")
			saveAllFiles(self.folderPath, self.files);

			// console.log("Compiling");
			switch(fileExt) {
				case '.java':
					exec('javac "' + file.fileName, {cwd: self.folderPath}, function(error, stdout, stderr) {

						if (error) {
							console.log("Codehat - Compile Error Given");
							console.log(stderr.replace(/\n$/, "")); //regex gets rid of newline character

							self.output = stderr;
							self.outputError = true;

							self.nsp.emit("outputError", stderr);
							self.nsp.emit("runFinished");
							return false; //breaks out of function
						}


						// console.log("Running");
						// console.log("-------");

						// file name without file extension
						var fileNameNoExt = path.parse(file.fileName).name;
						self.runner = spawn('java', [fileNameNoExt], {cwd: self.folderPath});
						self.nsp.emit("readyForInput");

						self.runner.stdout.on('data', function(data) {
							self.output += data;
							self.nsp.emit("output", data.toString());
							process.stdout.write(data);
						});

						self.runner.stderr.on('data', function(data) {
							self.output += data;
							self.nsp.emit("outputError", data.toString());
							self.outputError = true;
							process.stdout.write(data);
						});

						self.runner.on('exit', function() {
							self.nsp.emit("runFinished");
							// console.log('Run Finished');
						});
					});
					break;
				case ".py":
					self.runner = spawn('python', [file.fileName], {cwd: self.folderPath});
					self.nsp.emit("readyForInput");

					self.runner.stdout.on('data', function(data) {
						self.output += data;
						self.nsp.emit("output", data.toString());
						process.stdout.write(data);
					});

					self.runner.stderr.on('data', function(data) {
						self.output += data;
						self.nsp.emit("outputError", data.toString());
						self.outputError = true;
						process.stdout.write(data);
					});

					self.runner.on('exit', function() {
						self.nsp.emit("runFinished");
						// console.log('Run Finished');
					});
					break;
				case ".cpp":
					exec('g++ "' + file.fileName, {cwd: self.folderPath}, function(error, stdout, stderr) {

						if (error) {
							console.log("Codehat - Compile Error Given");
							console.log(stderr.replace(/\n$/, "")); //regex gets rid of newline character

							self.output = stderr;
							self.outputError = true;

							self.nsp.emit("outputError", stderr);
							self.nsp.emit("runFinished");
							return false; //breaks out of function
						}

						// file name without file extension
						self.runner = spawn('a.exe', {cwd: self.folderPath});
						self.nsp.emit("readyForInput");

						self.runner.stdout.on('data', function(data) {
							self.output += data;
							self.nsp.emit("output", data.toString()+"\n");
							console.log(data.toString());
						});

						self.runner.stderr.on('data', function(data) {
							self.output += data;
							self.nsp.emit("outputError", data.toString()+"\n");
							self.outputError = true;
							console.log(data.toString());
						});

						self.runner.on('exit', function() {
							self.nsp.emit("runFinished");
							// console.log('Run Finished');
						});
					});
					break;
			}

		});
	});

}

module.exports = router;