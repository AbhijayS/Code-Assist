var express = require('express');
var path = require('path');
var async = require('async');
var router = express.Router();
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

/*		var newProjectFile = new User.ProjectFileSchema();
		newProjectFile.fileName = "";
		newProjectFile.text = "";
		// newProjectFile.text = javaStarter;
		newProjectFile.save(function(err) {
			if(err) throw err;
			// saved
		});
		newProject.files.push(newProjectFile);*/

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

router.get('/:id', function(req, res) {
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
			res.render('codehat-project', {layout: false, namespace: '/' + projectID, clearance:useraccesslevel});
		} else {
			res.send("Invalid project");
		}
	});
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

function Project(id) {
	var self = this;
	this.id = id;
	this.folderPath = "./codehat_files/" + id + "/";

/*	// create folder for project if it doesn't exist yet
	if (!fs.existsSync(this.folderPath)) {
		fs.mkdirSync(this.folderPath);
	}
	this.files = [];
	for (var i = 0; i < files.length; i++) {
		this.files.push(new File(files[i].fileName, files[i].text));
	}*/

	this.files = [];

	if (fs.existsSync(this.folderPath)) {
		// get array of fileNames from database
		User.ProjectSchema.findOne({_id: self.id}, {'fileNames': true}).exec(function(err, project) {
			var fileNames = project.fileNames;

			// add existing files to project
			fs.readdir(self.folderPath, function(err, filenames) {
				if (err) {
					console.log(err);
				}
				filenames.forEach(function(filename, index) {
					// if filename is in array
					if (fileNames.indexOf(filename) != -1) {
						fs.readFile(self.folderPath + filename, {encoding: 'utf-8'}, function(err, text){
							if (err) {
								console.log(err);
							}
							self.files.push(new File(filename, text));
						});
					}
				});
			});

		});

	} else {
		// create folder for project if it doesn't exist yet
		fs.mkdirSync(this.folderPath);
		this.files.push(new File("", ""));
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
/*				// saving file changes to database
				User.ProjectSchema.findOne({_id: self.id}).populate('files').exec(function(err, project) {
					project.files[fileIndex].text = text;

					project.files[fileIndex].save(function (err) {
						if (err) throw err;
					});
				});*/

				if (file.fileName) {
					console.log("saving")
					fs.writeFile(self.folderPath + file.fileName, text, function(err) {
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
/*			// saving new file name to database
			User.ProjectSchema.findOne({_id: self.id}).populate('files').exec(function(err, project) {
				project.files[fileIndex].fileName = newFileName;

				project.files[fileIndex].save(function (err) {
					if (err) throw err;
				});
			});*/
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
						}
						project.markModified("fileNames");
						project.save(function(err) {
							if (err) console.log(err);
						});
					});
				} else {
					// delete file because it's now untitled
					fs.unlink(self.folderPath + oldFileName, function(error) {
						if (error) {
							console.log(error);
						}
					});

					// delete file Name from database
					User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
						var index = project.fileNames.indexOf(oldFileName);
						if (index != -1) {
							project.fileNames.splice(index, 1);
						}

						project.save(function(err) {
							if (err) console.log(err);
						});
					});	
				}

			} else if (newFileName) {
				// create file
				fs.writeFile(self.folderPath + newFileName, self.files[fileIndex].text, function(err) {
					if (err)
						console.log(err);
				});

				User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
					project.fileNames.push(newFileName);
					project.save(function(err) {
						if (err) console.log(err);
					});
				});
			}

			self.files[fileIndex].fileName = newFileName;
			socket.broadcast.emit("renameFile", newFileName, fileIndex);
		});

		socket.on("fileAdded", function(fileName, text) {
			self.files.push(new File(fileName, text));

			socket.broadcast.emit("addFile", fileName, text);

			if (fileName) {
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
			}

/*			// adding new file to project in database
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
			});*/
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
			}


/*			User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
				User.ProjectFileSchema.find({_id: project.files[fileIndex]}).remove(function(error) {
					if (error) {
						console.log(error);
					}

					project.files.splice(fileIndex, 1);

					project.save(function(err) {
					  if(err) throw err;
					});	
				});
			});*/

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
			socket.broadcast.emit("programRunning");
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