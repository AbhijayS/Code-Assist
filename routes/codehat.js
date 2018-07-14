var express = require('express');
var path = require('path');
var async = require('async');
var router = express.Router();
var User = require('../models/user');
var server = require('../app').server;
var upload = require('../database').upload;
var uniqid = require('uniqid');
var easyrtc_server = require('../easyrtc/easyrtc_server_setup');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
	if(req.user) {
		// User.
	  // findOne({ name: 'Val' }).
	  // populate({
	  //   path: 'friends',
	  //   // Get friends of friends - populate the 'friends' array for every friend
	  //   populate: { path: 'friends' }
	  // });
		User.UserSchema.findOne({_id: req.user._id}).
		populate({
			path: 'projectsWithAccess',
			populate: {path: 'owner'}
		}).
		exec(function(err, user) {
			if(err) throw err;
			var projects = [];
			for(var i = 0; i < user.projectsWithAccess.length; i++) {
				projects.push(user.projectsWithAccess[i]);
			}
			if(user.projectsWithAccess.length > 0){
				res.render('codehat', {layout: 'codehat-layout', projects: projects});
			}else{
				res.render('codehat', {layout: 'codehat-layout'});
			}
		});
	}else{
		req.flash('origin');
		req.flash('origin', '/codehat');
		res.redirect("/login");

	}
});

router.post('/share', function(req, res){
	var emails = req.body.emailInput;
	var projectID = req.body.projectID;

	// in case only one email given
	if (!Array.isArray(emails)) {
		emails = [emails];
	}

	console.log("Share post request ----------------")
	console.log("projectID: " + projectID);

	// var failedEmails = [];
	//
	// async.each(emails, function(email, callback) {
	// 	User.UserSchema.findOne({email: email}, function(err, user) {
	// 		if (user) {
	// 			var e_link = projectID + "/" + uniqid();
	// 			user.e_link = e_link;
	// 			user.save(function(err) {
	// 				if(err) throw err;
	// 			});
	//
	// 			// callback(true);
	//
	// 			console.log("sharing with: " + user.email);
	// 			const output = `
	// 				<p>Hi ${user.username},</p>
	// 				<p>You have been invited to a CodeHat project</p>
	//
	// 				<h3><a href="http://localhost:8080/codehat/invite/${e_link}">Accept invitation</a></h3>
	// 				<!-- <h3><a href="https://codeassist.org/codehat/invite/${e_link}">Accept invitation</a></h3> -->
	// 			`;
	// 			const msg = {
	// 				to: user.email,
	// 				from: `Code Assist <${process.env.SENDER_EMAIL}>`,
	// 				subject: "You're invited to a new project",
	// 				html: output
	// 			};
	//
	// 			sgMail.send(msg);
	// 		} else {
	// 			failedEmails.push(email);
	// 		}
	// 		callback();
	// 	});
	// }, function() {
	// 	console.log("Failed emails: " + failedEmails);
	// 	res.send(failedEmails);
	// });

	var failedEmails = [];
	async.parallel([
			function(callback) {
				async.each(emails, function(email, checkCallback) {
					User.UserSchema.findOne({email: email}, function(err, user) {
						if(err) checkCallback(err);
						if(!user) {
							failedEmails.push(email);
						}
						checkCallback();
					});
				}, function(err) {
					callback(err);
				});
			}
	],
	// optional callback
	function(err) {
		if(err) throw err;
		if(failedEmails.length == 0) {
			var sentEmails = [];
			async.each(emails, function(email, finalCallback) {
				User.UserSchema.findOne({email: email}, function(err, user) {
					if(err) finalCallback(err);

					if(!sentEmails.includes(email)) {
						var e_link = projectID + "/" + uniqid();
						user.e_link = e_link;
						user.save(function(err) {
							if(err) throw err;
						});

						console.log("sharing with: " + user.email);
						const output = `
						<p>Hi ${user.username},</p>
						<p>You have been invited to a CodeHat project</p>

						<h3><a href="http://localhost:8080/codehat/invite/${e_link}">Accept invitation</a></h3>
						<!-- <h3><a href="https://codeassist.org/codehat/invite/${e_link}">Accept invitation</a></h3> -->
						`;
						const msg = {
							to: user.email,
							from: `Code Assist <${process.env.SENDER_EMAIL}>`,
							subject: "You're invited to a new project",
							html: output
						};
						sentEmails.push(email);
						sgMail.send(msg);
					}
					finalCallback();
				});
			}, function(err) {
				if(err) throw err;
				console.log("All Emails sent successfully");
				res.send([]);
			});
		}else{
			console.log("Failed emails: " + failedEmails);
			res.send(failedEmails);
		}
	});

});

router.get('/invite/:projectID/:randomID', function(req, res){
	var projectID = req.params.projectID;
	var randomID = req.params.randomID;
	var e_link = projectID + "/" + randomID;

	if (req.user) {
		if (req.user.e_link == e_link) {
			User.UserSchema.findOne({_id: req.user._id}, function(err, user) {
				// remove e_link from user
				user.e_link = undefined;

				User.ProjectSchema.findOne({_id: projectID}, function(err, project) {
					if (project) {
						user.projectsWithAccess.push(project);
						user.save(function(err) {
							if(err) throw err;
						});

						project.usersWithAccess.push(user);
						project.save(function(err) {
							if(err) throw err;

							res.redirect("/codehat/" + projectID);
						});

					}
				});
			});

		} else {
			res.redirect("/codehat/" + projectID);
		}
	} else {
		req.flash('origin');
		req.flash('origin', '/codehat/invite/' + e_link);
		res.redirect("/login");
	}
});

router.post('/', function(req, res){
	var data = {
		auth: true,
		message: '',
		url: ''
	};
	var project_name = req.body.project_name;
	console.log("Received Name: " + project_name);
	if(req.user) {
		User.UserSchema.findOne({_id: req.user._id}).populate('projectsWithAccess').exec(function(err, user) {
			var projects = user.projectsWithAccess;
			// console.log(projects);
			for(var i = 0; i < projects.length; i++) {
				console.log("Checking Name: " + projects[i].name);
				if(projects[i].name == project_name) {
					data.auth = false;
					data.message = "is-invalid";
					console.log("invalid");
				}
			}
			if(!data.auth == false) {
				console.log("Valid");
				var newProject = new User.ProjectSchema();
				newProject.name = req.body.project_name;
				newProject.owner = req.user._id;
				// newProject.usersWithAccess.push(req.user);

				newProject.status = "new";

				var newProjectFile = new User.ProjectFileSchema();
				newProjectFile.fileName = "";
				newProjectFile.text = "";
				newProjectFile.save(function(err) {
					if(err) throw err;
					// saved
				});
				newProject.files.push(newProjectFile);
				newProject.save(function(err) {
					if(err) throw err;
				});
				// console.log('Project ID: ' + newProject._id);
				user.projectsWithAccess.push(newProject._id);
				// console.log(req.user.projectsWithAccess);
				user.save(function(err) {
					if(err) throw err;
					console.log('new codehat project saved');
				});
				data.auth = true;
				data.message = 'is-valid';
				data.url = "/codehat/" + newProject.id;
			}
			console.log("Data:\n" + data.auth + '\n' + data.url + '\n' + data.message);
			res.send(data);
		});
	}else {
		data.auth = false;
		data.url = "/login"
		data.message = '';
		req.flash('origin');
		req.flash('origin', '/codehat');
		console.log("Data:\n" + data.auth + '\n' + data.url + '\n' + data.message);
		res.send(data);
	}
});

router.get('/:id', function(req, res) {
		var projectID = req.params.id;
		User.ProjectSchema.findOne({_id: projectID}).populate(['files', 'usersWithAccess', 'owner']).exec(function(err, project) {
			if(req.user) {
				if (project) {
					var userAccessLevel = 0;
					for (var i = 0; i < project.usersWithAccess.length; i++) {
						// console.log(typeof req.user._id);
						// console.log(typeof project.usersWithAccess[i].id);
						if (project.usersWithAccess[i].id === req.user.id)
							userAccessLevel = 1;
					}

					if (req.user._id.equals(project.owner.id)) {
						userAccessLevel = 2;
					}
					// console.log(userAccessLevel);
					if (userAccessLevel != 0) {


					console.log("user connecting to codehat project with access level "+userAccessLevel);

					if (!projectActive(projectID)){
						// currentProjects.push(new Project(project._id, project.text));
						currentProjects.push(new Project(project._id, project.files));
					}
					console.log(project.owner.id == req.user.id ? true : false);
					res.render('codehat-project', {layout: 'codehat-project-layout', namespace: '/' + projectID, clearance:userAccessLevel, project: project, users: project.usersWithAccess, owner: project.owner, isowner: project.owner.id == req.user.id ? true : false});

				} else{
					res.send("You don't have access to this project");
				}
			}else {
				res.send("Project Not Found");
			}
		}else{
			req.flash('origin');
			req.flash('origin', '/codehat/'+req.params.id);
			res.redirect("/login");
		}
	});
});

router.post('/share', function(req, res) {
	if(req.user) {

	}else{
		req.flash('origin');
		req.flash('origin', '/codehat/'+req.params.id);
		res.redirect("/login");
	}
});

router.post('/:id/change-project-name', function(req, res) {
	var projectID = req.params.id;
	console.log("--------- Changing Project name ---------");
	if(req.user) {
		User.ProjectSchema.findOne({_id: projectID}, function(err, project) {
			var data = {
				auth: false,
				message: ""
			}
			console.log("Old Name: " + project.name);
			var newName = req.body.newName;
			if(newName.length >= 3) {
				console.log("Valid");
				project.name = newName;
				project.save(function(err){if(err) throw err;});
				console.log("New Name: " + project.name);
				data.auth = true;
				data.message = "is-valid";
			}else{
				console.log("InValid");
				data.auth = false;
				data.message = "is-invalid";
			}
			res.send(data);
		});
	}else{
		req.flash('origin');
		req.flash('origin', '/codehat/'+projectID);
		res.redirect("/login");
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

					// save last last_modified
					var today = new Date();
					console.log(today.toString());
					project.last_modified = today.toString();
					project.save(function(err) {
						if(err) throw err;
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
