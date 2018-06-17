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
var spawn = child_process.spawn;
var fs = require('fs');
var filePath = "./codehat_files/";
var fileName = "Main";

var input = `public class ${fileName} {
	public static void main(String[] args) {
		
	}
}`;
var outputError = false;
var output = "";

var cursors = {};
var selections = {};
var runner;

io.on('connection', function connection(socket) {
	socket.emit("socketID", socket.id);
	socket.emit("input", input);

	if (outputError) {
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

	socket.on("programInput", function(text) {
		if (runner) {
			runner.stdin.write(text+"\n");
			// runner.stdin.end();
		}
	});

	socket.on("run", function() {
		output = "";
		outputError = false;
		socket.broadcast.emit("programRunning");
		// console.log("Saving")
		fs.writeFile(filePath + fileName + ".java", input, function(err) {
			if(err) {
				return console.log(err);
			}
			
			// console.log("Compiling");
			exec('javac "' + filePath + fileName + '.java"', function(error, stdout, stderr) {

				if (error) {
					console.log("Codehat - Compile Error Given");
					var BackSlashPath = filePath.replace(/\//g,"\\\\"); //changes forward slashes to double back slashes to be used with regex
					var result = stderr.replace(new RegExp(BackSlashPath, "g"), ""); // takes out file path from error

					console.log(result.replace(/\n$/, "")); //regex gets rid of newline character
					
					output = result;
					outputError = true;

					io.sockets.emit("outputError", result);
					io.sockets.emit("runFinished");
					return false; //breaks out of function
				}

				io.sockets.emit("compileFinished");

				// console.log("Running");
				// console.log("-------");

				runner = spawn('java', ['-cp', filePath, fileName]);

				runner.stdout.on('data', function(data) {
					output += data;
					io.sockets.emit("output", data.toString());
					process.stdout.write(data);
				});

				runner.stderr.on('data', function(data) {
					output += data;
					io.sockets.emit("outputError", data.toString());
					outputError = true;
					process.stdout.write(data);
				});

				runner.on('exit', function() {
					io.sockets.emit("runFinished");
					// console.log('Run Finished');
				});

/*				exec('java -cp "' + filePath + '" ' + fileName, function(error, stdout, stderr) {
					// console.log(stdout.replace(/\n$/, "")); //regex gets rid of newline character
					// console.log("-------");

					output = stdout;
					outputError = false;

					io.sockets.emit("output", stdout);
					// console.log('Run Finished');
				});*/

			});

		});
	});
});


module.exports = router;