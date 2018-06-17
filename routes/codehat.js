var express = require('express');
var router = express.Router();
var User = require('../models/user');
var server = require('../app').server;

var socket = require('socket.io');
var io = socket(server);

router.get('/', function(req, res){
	res.render('codehat', {layout: false});
});

var child_process = require('child_process');
var exec = child_process.exec;
var fs = require('fs');
var filePath = "./codehat_files/";
var fileName = "Main";

var input = `public class ${fileName} {
	public static void main(String[] args) {
		
	}
}`;
var compileError = false;
var output = "";

var cursors = {};
var selections = {};

io.on('connection', function connection(socket) {
	socket.emit("socketID", socket.id);
	socket.emit("input", input);

	if (compileError) {
		socket.emit("outputError", output);
	} else {
		socket.emit("output", output);
	}

	socket.on("input", function(text) { //updates stored input for people who join
		input = text;
	});

	socket.on("change", function(event) { // emits changes to everyone
		socket.broadcast.emit("change", event);
	});

	socket.on("cursorChange", function(position) { // emits cursor changes
		cursors[socket.id] = position;
		io.sockets.emit("cursors", cursors);
		// console.log(cursors)
	});
	
	socket.on("selectionChange", function(range) { // emits cursor changes
		selections[socket.id] = range;
		io.sockets.emit("selections", selections);
		// console.log(cursors)
	});

	socket.on("disconnect", function() {
		delete cursors[socket.id];
		delete selections[socket.id];
		io.sockets.emit("deleteCursor", socket.id);
		io.sockets.emit("deleteSelection", socket.id);
		// console.log(cursors);
	});

	socket.on("run", function() {
		socket.broadcast.emit("programRunning");
		// console.log("Saving")
		fs.writeFile(filePath + fileName + ".java", input, function(err) {
			if(err) {
				return console.log(err);
			}
			
			// console.log("Compiling");
			var child = exec('javac "' + filePath + fileName + '.java"', function(error, stdout, stderr) {

				if (error) {
					console.log("Codehat - Compile Error Given");
					var BackSlashPath = filePath.replace(/\//g,"\\\\"); //changes forward slashes to double back slashes to be used with regex
					var result = stderr.replace(new RegExp(BackSlashPath, "g"), ""); // takes out file path from error

					console.log(result.replace(/\n$/, "")); //regex gets rid of newline character
					
					output = result;
					compileError = true;

					io.sockets.emit("outputError", result);
					return false; //breaks out of function
				}

				// console.log("Running");
				// console.log("-------");

				var child2 = exec('java -cp "' + filePath + '" ' + fileName, function(error, stdout, stderr) {
					// console.log(stdout.replace(/\n$/, "")); //regex gets rid of newline character
					// console.log("-------");

					output = stdout;
					compileError = false;

					io.sockets.emit("output", stdout);
					// console.log('Run Finished');
				});

			});

		});
	});
});


module.exports = router;