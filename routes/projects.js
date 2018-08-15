var express = require('express');
var path = require('path');
var async = require('async');
var router = express.Router();
// var router = express.Router({'strict' : true});
var User = require('../models/user');
// var server = require('../app').server;
var upload = require('../database').upload;
var uniqid = require('uniqid');
var mongoose = require('mongoose');

var zip = new require('node-zip')();
var easyrtc_server = require('../easyrtc/easyrtc_server_setup');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var socket = require('socket.io');
// var io = socket(server);
var io = require('../app').io;

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
			res.render('projects', {layout: 'projects-layout', expanded: req.flash('start-project'), projects: projects});
		});
	}else{
		req.flash('origin');
		req.flash('origin', '/projects');
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
				newProject.name = project_name.trim();
				newProject.owner = req.user._id;
				newProject.thumbnail = project_name.trim().substring(0, 1);
				// newProject.usersWithAccess.push(req.user);

				newProject.status = "new";

				newProject.save(function(err) {
					if(err) throw err;
				});
				// console.log('Project ID: ' + newProject._id);
				user.projectsWithAccess.push(newProject._id);
				// console.log(req.user.projectsWithAccess);
				user.save(function(err) {
					if(err) throw err;
					console.log('new project saved');
				});
				data.auth = true;
				data.message = 'is-valid';
				data.url = "/projects/" + newProject.id + "/";
			}
			console.log("Data:\n" + data.auth + '\n' + data.url + '\n' + data.message);
			res.send(data);
		});
	}else {
		data.auth = false;
		data.url = "/login"
		data.message = '';
		req.flash('origin');
		req.flash('origin', '/projects');
		console.log("Data:\n" + data.auth + '\n' + data.url + '\n' + data.message);
		res.send(data);
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
						<p>You have been invited to a project</p>

						<h3><a href="http://localhost:8080/projects/invite/${e_link}">Accept invitation</a></h3>
						<!-- <h3><a href="https://codeassist.org/projects/invite/${e_link}">Accept invitation</a></h3> -->
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

							res.redirect("/projects/" + projectID + "/");
						});

					}
				});
			});

		} else {
			res.redirect("/projects/" + projectID + "/");
		}
	} else {
		req.flash('origin');
		req.flash('origin', '/projects/invite/' + e_link);
		res.redirect("/login");
	}
});

router.get('/:id', function(req, res) {
	console.log("PROJECTS PAGE LOADING ...");
	var isThumbnail = req.query.thumbnail;
	console.log("isThumbnail:", isThumbnail);
	var projectID = req.params.id;
	User.ProjectSchema.findOne({_id: projectID}).populate(['usersWithAccess', 'owner', 'chatHistory']).exec(function(err, project) {
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
					console.log("user connecting to project with access level "+userAccessLevel);

					if (!projectActive(projectID)){
						// currentProjects.push(new Project(project._id, project.text));
						currentProjects.push(new Project(project._id, project.files));
					}
					// console.log(project.owner.id == req.user.id ? true : false);
					var projectStatus = project.status;
					if(projectStatus == "new") {
						projectStatus = true;
						project.status = "using";
					}else{
						projectStatus = false;
					}
					console.log("Project status:", projectStatus);
					console.log('-------------------------------');
					console.log('');
					project.save(function(err) {
						if(err) throw err;
						res.render('view-project', {layout: 'view-project-layout', isThumbnail: isThumbnail, namespace: '/' + projectID, clearance:userAccessLevel, isNew: projectStatus, project: project, users: project.usersWithAccess, owner: project.owner, isowner: project.owner.id == req.user.id ? true : false});
					})
				} else {
					res.redirect('/projects');
				}
			} else {
				res.redirect('/projects');
			}
		}else {
			req.flash('origin');
			req.flash('origin', '/projects/'+req.params.id);
			res.redirect("/login");
		}
	});
});

router.post('/:id/start-project', function(req, res) {
	User.PostSchema.findOne({_id: req.body.postID}, function(err, post) {
		if(err) throw err;
		if(post){
			req.flash('start-project');
			req.flash('start-project', post.question);
		}
		res.send("");
	});
});

router.post('/:id/delete', function(req, res) {
	var projectID = req.params.id;
	var projectName = req.body.projectName;
	var data = {
		auth: false,
		url: ''
	};

	User.ProjectSchema.findOne({_id: projectID}, function(err, project) {
		if(req.user && project) {
			if(project.name == projectName) {
				data.auth = true;
				data.url = '/projects';
				User.ProjectSchema.deleteOne({_id: projectID}, function (err) {
				  if (err) throw err;
					console.log("Project deleted");
				});
			}
		}else{
			data.url = '/login';
			req.flash('origin');
			req.flash('origin', '/projects/'+projectID);
		}
		res.send(data);
	});
});
// for file downloading
router.get('/:id/file/:fileIndex', function(req, res) {
	var projectID = req.params.id;
	var fileIndex = req.params.fileIndex;

	if(req.user) {
		User.ProjectSchema.findOne({_id: projectID}).populate(['usersWithAccess', 'owner']).exec(function(err, project) {
			if (project) {
				// Check if user has access to project
				var userAccessLevel = 0;
				for (var i = 0; i < project.usersWithAccess.length; i++) {
					if (project.usersWithAccess[i].id === req.user.id)
						userAccessLevel = 1;
				}

				if (req.user._id.equals(project.owner.id)) {
					userAccessLevel = 2;
				}

				if (userAccessLevel != 0) {
					var projectObject = getCurrentProject(projectID);
					if (projectObject && projectObject.files[fileIndex] && projectObject.files[fileIndex].fileName) {
						var fileName = projectObject.files[fileIndex].fileName;
						var file = "./project_files/" + projectID + "/" + fileName;

						if (fs.existsSync(file)) {
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
				} else {
					res.redirect("/projects");
				}
			}
		});
	} else {
		req.flash('origin');
		req.flash('origin', `/projects/${projectID}/file/${fileIndex}`);
		res.redirect("/login");
	}
});

// for downloading project .zip file
router.get('/:id/downloadAll', function(req, res) {
	var projectID = req.params.id;
	var projectDir = "./project_files/" + projectID + "/";

	if(req.user) {
		User.ProjectSchema.findOne({_id: projectID}).populate(['usersWithAccess', 'owner']).exec(function(err, project) {
			if (project) {
				// Check if user has access to project
				var userAccessLevel = 0;
				for (var i = 0; i < project.usersWithAccess.length; i++) {
					if (project.usersWithAccess[i].id === req.user.id)
						userAccessLevel = 1;
				}

				if (req.user._id.equals(project.owner.id)) {
					userAccessLevel = 2;
				}

				if (userAccessLevel != 0) {
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
				} else {
					res.redirect("/projects");
				}
			}
		});
	} else {
		req.flash('origin');
		req.flash('origin', `/projects/${projectID}/downloadAll`);
		res.redirect("/login");
	}
});

// to host html file previews
router.get('/:id/htmlPreview/:fileIndex/', function(req, res) {
	var projectID = req.params.id;
	var fileIndex = req.params.fileIndex;

	var projectObject = getCurrentProject(projectID);

	if (projectObject) {
		var file = projectObject.files[fileIndex];
		if (file && file.htmlPreviewCode) {
			res.send(file.htmlPreviewCode);
		} else {
			res.end();
		}
	} else {
		res.end();
	}
});

// to provide iframe sources
router.get('/:id/htmlPreview/:fileIndex/:fileName', function(req, res) {
	var projectID = req.params.id;
	var fileName = req.params.fileName;

	var projectObject = getCurrentProject(projectID);
	if (projectObject && projectObject.getFileByName(fileName)) {
		var file = projectObject.getFileByName(fileName);
		var filePath = "./project_files/" + projectID + "/" + file.fileName;

		if (fs.existsSync(filePath)) {
			fs.writeFile(filePath, file.text, function(err) {
				if (err)
					console.log(err);

				res.download(filePath);
			});
		} else {
			res.end();
		}
	} else {
		res.end();
	}
});

var child_process = require('child_process');
var exec = child_process.exec;
var spawn = child_process.spawn;
var fs = require('fs');
// var folderPath = "./project_files/";

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
	this.folderPath = "./project_files/" + id + "/";

	this.files = [];

	this.getFileByName = function(fileName) {
		for (var i = 0; i < this.files.length; i++) {
			if (this.files[i].fileName == fileName)
				return this.files[i];
		}
	}

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
	var chatdatanamespace=this.nsp;


	this.nsp.on('connection', function connection(socket) {
		console.log("new projects connection");
		socket.emit("socketID", socket.id);
		socket.emit("files", self.files);

		if (self.outputError) {
			socket.emit("outputError", self.output);
		} else {
			socket.emit("output", self.output);
		}

		//chat handler
		socket.on("chat",function(msg,chatterid,chatter){
			//console.log(msg+'  ');
			var NewChatMessage = new User.ChatSchema();
			NewChatMessage.authorid=chatterid;
			NewChatMessage.author=chatter;
			NewChatMessage.message=msg;
			NewChatMessage.date=new Date();

			//save the new message to the database
			NewChatMessage.save(function(error){
				console.log(self.id);
				User.ProjectSchema.findOne({_id:self.id}).exec(function(error, project){
					project.chatHistory.push(NewChatMessage._id);
					console.log(project);
						project.save(function(error){
							chatdatanamespace.emit('broadcastchat',NewChatMessage);

							if(error){
								console.log(error);
							}
						});
					if(error){
						console.log(error);
					}
				});
				if(error){
					console.log(error);
				}
			});
		});

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
							console.log("Projects - Compile Error Given");
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
							console.log("Projects - Compile Error Given");
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
