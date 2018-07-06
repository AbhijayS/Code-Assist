var express = require('express');
var path = require('path');
var async = require('async');
var router = express.Router({'strict' : true});
var User = require('../models/user');
var server = require('../app').server;
var upload = require('../database').upload;

var socket = require('socket.io');
var io = socket(server);

var currentProjects = [];

var javaStarter = `public class Main {
	public static void main(String[] args) {

	}
}`;
//add someone to a project by id
function addToProject(id, user) {
	user.findOne({id:id},function(err, addedproject) {
	if(err) throw err;
});
if(addedproject){
	addedproject.userIdsWithAccess.push(user)
	addedproject.save(function(err) {
		if(err) throw err;
		// saved
	});
}
}
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

		var newProjectFile = new User.ProjectFileSchema();
		newProjectFile.fileName = "";
		newProjectFile.text = "";
		// newProjectFile.text = javaStarter;
		newProjectFile.save(function(err) {
			if(err) throw err;
			// saved
		});
		newProject.files.push(newProjectFile);

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
					// currentProjects.push(new Project(project._id, project.text));
					currentProjects.push(new Project(project._id, project.files));
			   	}
		    }
			res.render('codehat-project', {layout: false, namespace: '/' + projectID, clearance:useraccesslevel});
  		} else {
  			res.send("Invalid project");
  		}
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

function File(fileName, text) {
	this.fileName = fileName;
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

function Project(id, files) {
	var self = this;
	this.id = id;
	this.folderPath = "./codehat_files/" + id + "/";

	// create folder for project if it doesn't exist yet
	if (!fs.existsSync(this.folderPath)) {
		fs.mkdirSync(this.folderPath);
	}

	this.files = [];
	for (var i = 0; i < files.length; i++) {
		this.files.push(new File(files[i].fileName, files[i].text));
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
		socket.on("chat",function(msg){
			//console.log(msg+'  ');
			this.nsp.emit('broadcastchat',msg)
		});
		socket.on("updateFile", function(text, fileIndex) {
			var file = self.files[fileIndex];
			file.text = text;

			if (file.saveTimeout)
				clearTimeout(file.saveTimeout);

			file.saveTimeout = setTimeout(function() {
				console.log("saving")
				// saving file changes to database
				User.ProjectSchema.findOne({_id: self.id}).populate('files').exec(function(err, project) {
					project.files[fileIndex].text = text;

					project.files[fileIndex].save(function (err) {
						if (err) throw err;
					});
				});
			}, 1000);
		});

		socket.on("fileChange", function(event, sessionIndex) { // emits changes to everyone
			socket.broadcast.emit("fileChange", event, sessionIndex);
		});

		socket.on("fileRenamed", function(newFileName, fileIndex) {
			self.files[fileIndex].fileName = newFileName;
			socket.broadcast.emit("renameFile", newFileName, fileIndex);

			// saving new file name to database
			User.ProjectSchema.findOne({_id: self.id}).populate('files').exec(function(err, project) {
				project.files[fileIndex].fileName = newFileName;

				project.files[fileIndex].save(function (err) {
					if (err) throw err;
				});
			});
		});

		socket.on("fileAdded", function(fileName, text) {
			if (fileName && text) {
				self.files.push(new File(fileName, text));
			} else {
				self.files.push(new File());
			}
			socket.broadcast.emit("addFile", fileName, text);

			// adding new file to project in database
			User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
				var newProjectFile = new User.ProjectFileSchema();

				if (fileName && text) {
					newProjectFile.fileName = fileName;
					newProjectFile.text = text;
				}

				newProjectFile.save(function(err) {
					if(err) throw err;
					// saved
				});
				project.files.push(newProjectFile);

				project.save(function(err) {
				  if(err) throw err;
				});
			});
		});

		socket.on("deleteFile", function(fileIndex) {
			// Delete File from system
			if (files[fileIndex].fileName) {
				var filePath = self.folderPath + files[fileIndex].fileName;
				if (fs.existsSync(filePath)) {
					fs.unlink(filePath, function(error) {
						if (error) {
							console.log(error);
						}
					});
				}
				var fileNameNoExt = path.parse(files[fileIndex].fileName).name;
				var classFilePath = self.folderPath + fileNameNoExt + ".class";
				if (path.extname(files[fileIndex].fileName) == ".java" && fs.existsSync(classFilePath)) {
					fs.unlink(classFilePath, function(error) {
						if (error) {
							console.log(error);
						}
					});
				}
			}


			User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
				User.ProjectFileSchema.find({_id: project.files[fileIndex]}).remove(function(error) {
					if (error) {
						console.log(error);
					}

					project.files.splice(fileIndex, 1);

					project.save(function(err) {
					  if(err) throw err;
					});
				});
			});

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

			if (fileExt != ".java" && fileExt != ".py") {
				self.nsp.emit("outputError", "Currently only .java and .py files are able to be compiled/run");
				self.nsp.emit("runFinished");
				return false;
			}

			if (!fs.existsSync(self.folderPath)) {
				fs.mkdirSync(self.folderPath);
			}

			self.output = "";
			self.outputError = false;
			socket.broadcast.emit("programRunning");
			// console.log("Saving")
			saveAllFiles(self.folderPath, self.files);

			// console.log("Compiling");
			switch(fileExt) {
				case '.java':
					exec('javac "' + file.fileName, {cwd: self.folderPath}, function(error, stdout, stderr) {

						if (error) {
							console.log("Codehat - Compile Error Given");
							var BackSlashPath = self.folderPath.replace(/\//g,"\\\\"); //changes forward slashes to double back slashes to be used with regex
							var result = stderr.replace(new RegExp(BackSlashPath, "g"), ""); // takes out file path from error

							console.log(result.replace(/\n$/, "")); //regex gets rid of newline character

							self.output = result;
							self.outputError = true;

							self.nsp.emit("outputError", result);
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
			}

		});
	});

}

module.exports = router;
