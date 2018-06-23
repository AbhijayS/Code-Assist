var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/user');
var server = require('../app').server;

var socket = require('socket.io');
var io = socket(server);

var currentProjects = [];

var starterProgram = `public class Main {
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

		var newProjectFile = new User.ProjectFileSchema();
		newProjectFile.fileName = "Main.java";
		newProjectFile.text = starterProgram;
		newProjectFile.save(function(err) {
			if(err) throw err;
			// saved
		});
		newProject.files.push(newProjectFile);

		newProject.save(function(err) {
		  if(err) throw err;
		  console.log('new codehat project saved');
		});
	}

    res.redirect("/codehat/" + newProject._id);
});

router.get('/:id', function(req, res) {
  	var projectID = req.params.id;
  	User.ProjectSchema.findOne({_id: projectID}).populate('files').exec(function(err, project) {
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

var child_process = require('child_process');
var exec = child_process.exec;
var spawn = child_process.spawn;
var fs = require('fs');
// var filePath = "./codehat_files/";

function File(fileName, text) {
	this.fileName = fileName;
	this.text = text;
	this.cursors = {};
	this.selections = {};
}

function Project(id, files) {
	var self = this;
	this.id = id;
	this.filePath = "./codehat_files/" + id + "/";

	// create folder for project if it doesn't exist yet
	if (!fs.existsSync(this.filePath)) {
		fs.mkdirSync(this.filePath);
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

/*		//saving input text to database
		User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
			if (project) {
				project.text = text;

				project.save(function (err) {
					if (err) throw err;
				});
			}
		});*/

		socket.on("updateFile", function(text, fileIndex) {
			self.files[fileIndex].text = text;

			// saving file changes to database
			User.ProjectSchema.findOne({_id: self.id}).populate('files').exec(function(err, project) {
				project.files[fileIndex].text = text;

				project.files[fileIndex].save(function (err) {
					if (err) throw err;
				});
			});
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

			if (!file.fileName) {
				self.nsp.emit("outputError", "Please enter a file name");
				self.nsp.emit("runFinished");
				return false;
			}

			if (path.extname(file.fileName) != ".java") {
				self.nsp.emit("outputError", "File extension must be .java to run");
				self.nsp.emit("runFinished");
				return false;
			}

			self.output = "";
			self.outputError = false;
			socket.broadcast.emit("programRunning");
			// console.log("Saving")
			fs.writeFile(self.filePath + file.fileName, file.text, function(err) {
				if(err) {
					return console.log(err);
				}

				// console.log("Compiling");
				exec('javac "' + self.filePath + file.fileName, function(error, stdout, stderr) {

					if (error) {
						console.log("Codehat - Compile Error Given");
						var BackSlashPath = self.filePath.replace(/\//g,"\\\\"); //changes forward slashes to double back slashes to be used with regex
						var result = stderr.replace(new RegExp(BackSlashPath, "g"), ""); // takes out file path from error

						console.log(result.replace(/\n$/, "")); //regex gets rid of newline character

						self.output = result;
						self.outputError = true;

						self.nsp.emit("outputError", result);
						self.nsp.emit("runFinished");
						return false; //breaks out of function
					}

					self.nsp.emit("compileFinished");

					// console.log("Running");
					// console.log("-------");

					// file name without file extension
					var fileNameNoExt = path.parse(file.fileName).name;
					self.runner = spawn('java', ['-cp', self.filePath, fileNameNoExt]);

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

			});
		});
	});

}

module.exports = router;