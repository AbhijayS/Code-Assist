var express = require('express');
var router = express.Router();
var User = require('../models/user');
var server = require('../app').server;

var socket = require('socket.io');
var io = socket(server);

var currentProjects = [];

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
		newProject.ownerid=req.user._id;
		newProject.text = `public class Main {
	public static void main(String[] args) {

	}
}`
	}
	newProject.save(function(err) {
      if(err) throw err;
      console.log('new codehat project saved');
    });

    res.redirect("/codehat/" + newProject._id);
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
					currentProjects.push(new Project(project._id, project.text));
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

function Project(id, input) {
	var self = this;
	this.id = id;
	this.fileName = "Main";
	this.filePath = "./codehat_files/" + id + "/";

	this.input = input;
	// create folder for project if it doesn't exist yet
	if (!fs.existsSync(this.filePath)) {
		fs.mkdirSync(this.filePath);
	}

	this.files = [];

	this.outputError = false;
	this.output = "";

	this.cursors = {};
	this.selections = {};
	this.runner;

	// nsp is the socket.io namespace
	this.nsp = io.of('/'+this.id)

	this.nsp.on('connection', function connection(socket) {
		console.log("new codehat connection");
		socket.emit("socketID", socket.id);
		socket.emit("input", self.input);

		if (self.outputError) {
			socket.emit("outputError", self.output);
		} else {
			socket.emit("output", self.output);
		}

		socket.on("input", function(text) { //updates stored input for people who join
			self.input = text;

			//saving input text to database
			User.ProjectSchema.findOne({_id: self.id}).exec(function(err, project) {
				if (project) {
					project.text = text;

					project.save(function (err) {
						if (err) throw err;
					});
				}
			});
		});

		socket.on("change", function(event) { // emits changes to everyone
			socket.broadcast.emit("change", event);
		});

		socket.on("cursorChange", function(position) { // emits cursor changes
			self.cursors[socket.id] = position;
			self.nsp.emit("cursors", self.cursors);
			// console.log(self.cursors)
		});

		socket.on("selectionChange", function(range) { // emits cursor changes
			self.selections[socket.id] = range;
			self.nsp.emit("selections", self.selections);
			// console.log(self.cursors)
		});

		socket.on("disconnect", function() {
			delete self.cursors[socket.id];
			delete self.selections[socket.id];
			self.nsp.emit("deleteCursor", socket.id);
			self.nsp.emit("deleteSelection", socket.id);
			// console.log(self.cursors);
		});

		socket.on("programInput", function(text) {
			if (self.runner) {
				self.runner.stdin.write(text+"\n");
				// runner.stdin.end();
			}
		});

		socket.on("run", function() {
			self.output = "";
			self.outputError = false;
			socket.broadcast.emit("programRunning");
			// console.log("Saving")
			fs.writeFile(self.filePath + self.fileName + ".java", self.input, function(err) {
				if(err) {
					return console.log(err);
				}

				// console.log("Compiling");
				exec('javac "' + self.filePath + self.fileName + '.java"', function(error, stdout, stderr) {

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

					self.runner = spawn('java', ['-cp', self.filePath, self.fileName]);

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