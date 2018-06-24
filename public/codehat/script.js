// var socket = io.connect();
var socketID;

var editor = ace.edit("editor");

var editorSessions = [];

function EditorSession(session) {
	this.session = session;
	this.curMgr = new AceCollabExt.AceMultiCursorManager(session);
	this.selMgr = new AceCollabExt.AceMultiSelectionManager(session);
}

function getSessionIndex(session) {
	for (var i = 0; i < editorSessions.length; i++) {
		if (editorSessions[i].session == session)
			return i;
	}
}

var AceRange = ace.require('ace/range').Range;

var applyingChanges = false;

$('#output').val("");

$("input:file").change(function() {
	let file = $(this)[0].files[0];
	let reader = new FileReader();
	reader.readAsText(file);
	reader.onload = function(e) {
		let text = e.target.result;
		addFile(file.name, text);
		socket.emit("fileAdded", file.name, text);
	};
});

// new file being created
$("#newFileBtn").click(function() {
	addFile();
	socket.emit("fileAdded");
});

socket.on("addFile", function(fileName, text) {
	addFile(fileName, text);
});

function addFile(fileName, text) {
	if (fileName) {
		$("#fileTabs").append(`<li class="nav-item"><a class="nav-link" data-toggle="tab" href=""><span class="hiddenSpan"></span><input maxlength="100" readonly class="fileName" value="${fileName}" placeholder="untitled" autocomplete="off" spellcheck="false" type="text"></a><button class="close">&times;</button></li>`);
	} else {
		$("#fileTabs").append('<li class="nav-item"><a class="nav-link" data-toggle="tab" href=""><span class="hiddenSpan"></span><input maxlength="100" class="fileName" placeholder="untitled" autocomplete="off" spellcheck="false" type="text"></a><button class="close">&times;</button></li>');
	}

	if ($(".nav-item").length == 1) { // if file was first to be added
  		$("#editor").css('visibility', 'visible');
  		$(".nav-link").eq(0).addClass("active");
	}


	initFileTabs();

	if (text) {
		editorSessions.push(new EditorSession(ace.createEditSession(text, "ace/mode/java")));
	} else {
		editorSessions.push(new EditorSession(ace.createEditSession('', "ace/mode/java")));
	}

	var sessionIndex = editorSessions.length-1;
	$(".nav-item .close").eq(sessionIndex).click(function() {
		var fileIndex = $(".close").index($(this));
		if(confirm("Are you sure you want to delete this file?")) {
			deleteFile(fileIndex);
			socket.emit("deleteFile", fileIndex);
		}
	});

	editorSessions[sessionIndex].session.on('change', function(event) {
		if (applyingChanges) { 
			// prevents fileChange from another user from being detected as a change made by you
			return;
		}
		var fileIndex = getSessionIndex(editor.session);

		// session index should be the same as file index
		socket.emit("updateFile", editor.getValue(), fileIndex);
		socket.emit("fileChange", event, fileIndex);
	});
	editorSessions[sessionIndex].session.selection.on('changeCursor', function(e) {
		var fileIndex = getSessionIndex(editor.session);
		socket.emit("cursorChange", editor.getCursorPosition(), fileIndex);
	});
	editorSessions[sessionIndex].session.selection.on('changeSelection', function(e) {
		var fileIndex = getSessionIndex(editor.session);
		socket.emit("selectionChange", editor.selection.getRange(), fileIndex);
	});

	if (editorSessions.length == 1)
		editor.setSession(editorSessions[0].session);
}

socket.on("fileChange", function(event, sessionIndex) {
	applyingChanges = true;
	editorSessions[sessionIndex].session.getDocument().applyDelta(event);
	applyingChanges = false;
});

socket.on("deleteFile", function(fileIndex) {
	deleteFile(fileIndex);
});

function deleteFile(fileIndex) {
	if ($(".nav-link").eq(fileIndex).hasClass("active")) {
		$(".nav-item").eq(fileIndex).remove();
		editorSessions.splice(fileIndex, 1);

		if ($(".nav-link").length > 0) {
  			$(".nav-link").eq(0).addClass("active");
  			editor.setSession(editorSessions[0].session);
  		}
	} else {
		$(".nav-item").eq(fileIndex).remove();
		editorSessions.splice(fileIndex, 1);
	}

	if ($(".nav-link").length == 0) {
		$("#editor").css('visibility', 'hidden');
	}
}

function initFileTabs() {
	$(".nav-item").click(function(e) {
		// prevents delete button from triggering tab switch
		if (e.target.getAttribute("class") == "close")
			return;

		var sessionIndex = $(".nav-item").index($(this));
		editor.setSession(editorSessions[sessionIndex].session);
	});
	// To auto resize fileName tabs
	$('.fileName').on('input', function() {
		$(this).siblings('.hiddenSpan').text($(this).val());
		$(this).width($(this).siblings('.hiddenSpan').width());
	});
	// initially resize tabs to fit fileName
	$('.fileName').each(function() {
		$(this).siblings('.hiddenSpan').text($(this).val());
		$(this).width($(this).siblings('.hiddenSpan').width());
	});


	$(".fileName").on('keydown', function(e) {
	    if (e.keyCode == 13 && $(this).val().length > 0) {
	        $(this).prop("readonly", true);

			var sessionIndex = $(".fileName").index($(this));
	        socket.emit("fileRenamed", $(this).val(), sessionIndex);
	    }
	});
	$(".fileName").blur(function() {
		if ($(this).val().length > 0) {
			$(this).prop("readonly", true);
		} else {
			$(this).prop("readonly", false);
		}

		var sessionIndex = $(".fileName").index($(this));
        socket.emit("fileRenamed", $(this).val(), sessionIndex);
	});
	$(".fileName").dblclick(function() {
		$(this).prop("readonly", false);
	});
}


$("#programInputForm").submit(function(e) {
	e.preventDefault();
	socket.emit("programInput", $("#programInput").val());
	$("#programInput").val("");
});

socket.on("files", function(files) { // only for when client first joins
	for (var i = 0; i < files.length; i++) {
		addFile(files[i].fileName, files[i].text);

		// setup current cursors and selections
		var curMgr = editorSessions[i].curMgr;
		var cursors = files[i].cursors;
		for (var id in cursors) {
			if (curMgr._cursors[id]) {
				curMgr.setCursor(id, {row: cursors[id].row, column: cursors[id].column});
			} else if (id !== socketID){
				curMgr.addCursor(id, "User", "purple", {row: cursors[id].row, column: cursors[id].column});
			}
		}

		var selMgr = editorSessions[i].selMgr;
		var selections = files[i].selections;
		for (var id in selections) {
			if (selMgr._selections[id]) {
				selMgr.setSelection(id, new AceRange(selections[id].start.row, selections[id].start.column, selections[id].end.row, selections[id].end.column));
			} else if (id !== socketID){
				selMgr.addSelection(id, "User", "purple", [new AceRange(selections[id].start.row, selections[id].start.column, selections[id].end.row, selections[id].end.column)]);
			}
		}
	}

});

socket.on("renameFile", function(newFileName, fileIndex) {
	$('.fileName').eq(fileIndex).val(newFileName);

	// initially resize tabs to fit fileName
	$('.fileName').each(function() {
		$(this).siblings('.hiddenSpan').text($(this).val());
		$(this).width($(this).siblings('.hiddenSpan').width());
	});
});

$("#run").click(function() {
	runProgram();
});

$(document).keydown(function(e) {
	if (e.ctrlKey && e.keyCode == 13) {
		runProgram();
	}
});

function runProgram() {
	var fileIndex = $(".nav-link").index($(".nav-link.active"));
	socket.emit("run", fileIndex);
	$("#loadingWheel").show();
	$("#run").prop("disabled", true);
	$('#output').removeClass("outputError");
	$('#output').val("");
}

socket.on("programRunning", function() {
	$("#loadingWheel").show();
	$("#run").prop("disabled", true);
	$('#output').removeClass("outputError");
	$('#output').val("");
});

socket.on("output", function(text) {
	$('#output').removeClass("outputError");
	$('#output').val($('#output').val() + text);
	$('#output').get(0).scrollTop = $('#output').get(0).scrollHeight;
});

socket.on("runFinished", function() {
	$("#loadingWheel").hide();
	$("#run").prop("disabled", false);
	$("#programInput").prop("disabled", true);
});

socket.on("compileFinished", function() {
	$("#programInput").prop("disabled", false);
});

socket.on("outputError", function(text) {
	$('#output').addClass("outputError");
	$('#output').val($('#output').val() + text);
});


socket.on("socketID", function(id) {
	socketID = id;
});

socket.on("selections", function(selections, sessionIndex) {
	var selMgr = editorSessions[sessionIndex].selMgr;
	for (var id in selections) {
		if (selMgr._selections[id]) {
			selMgr.setSelection(id, new AceRange(selections[id].start.row, selections[id].start.column, selections[id].end.row, selections[id].end.column));
		} else if (id !== socketID){
			selMgr.addSelection(id, "User", "purple", [new AceRange(selections[id].start.row, selections[id].start.column, selections[id].end.row, selections[id].end.column)]);
		}
	}
});

socket.on("cursors", function(cursors, sessionIndex) {
	var curMgr = editorSessions[sessionIndex].curMgr;
	for (var id in cursors) {
		if (curMgr._cursors[id]) {
			curMgr.setCursor(id, {row: cursors[id].row, column: cursors[id].column});
		} else if (id !== socketID){
			curMgr.addCursor(id, "User", "purple", {row: cursors[id].row, column: cursors[id].column});
		}
	}
});

socket.on("deleteCursors", function(id) {
	for (var i = 0; i < editorSessions.length; i++) {
		var curMgr = editorSessions[i].curMgr;
		if (curMgr._cursors[id]) {
			curMgr.removeCursor(id);
		}
	}
});

socket.on("deleteSelections", function(id) {
	for (var i = 0; i < editorSessions.length; i++) {
		var selMgr = editorSessions[i].selMgr;
		if (selMgr._selections[id]) {
			selMgr.removeSelection(id);
		}
	}
});