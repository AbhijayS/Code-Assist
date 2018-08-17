// redirect to slash url if needed
var lastChar = window.location.href.substr(-1);
if (lastChar != '/' && window.location.search != "?thumbnail=true") {
   var url = window.location.href + '/';
	 window.location.replace(url);
}

// var socket = io.connect();
var socketID;

var modelist = ace.require("ace/ext/modelist");
var editor = ace.edit("editor");

var editorSessions = [];

$('#terminal').terminal(function(input) {
  socket.emit("programInput", input);
}, {
  prompt: '> ',
  greetings: false
});

var terminal = $('#terminal').terminal();

// var htmlPreviewDoc = $("#htmlPreview").get(0).contentWindow.document;

var htmlStarter = `<!DOCTYPE html>
<html>
<head>
	<title></title>
</head>
<body>

</body>
</html>`;

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

// $('#output').val("");

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
	socket.emit("fileAdded", "", "");
});

socket.on("addFile", function(fileName, text) {
	addFile(fileName, text);
});

function addFile(fileName, text) {
	var newTab;
	if (fileName) {
		newTab = $(`<li class="nav-item" data-toggle="popover"><a class="nav-link" data-toggle="tab" href=""><span class="hiddenSpan"></span><input maxlength="100" readonly class="fileName" value="${fileName}" placeholder="untitled" autocomplete="off" spellcheck="false" type="text"></a><button class="close">&times;</button></li>`);
	} else {
		newTab = $('<li class="nav-item" data-toggle="popover"><a class="nav-link" data-toggle="tab" href=""><span class="hiddenSpan"></span><input maxlength="100" class="fileName" placeholder="untitled" autocomplete="off" spellcheck="false" type="text"></a><button class="close">&times;</button></li>');
	}

	$("#fileTabs").append(newTab);
	newTab.popover({
		trigger: 'manual',
		title: "<span style='color:red'>Invalid File Name</span>",
		content: 'File names must be unique and they may not include the following characters: <strong>" * : < > ? / \\ |</strong>',
		placement: 'right',
		html: true
	});

	if ($("#code-editor .nav-item").length == 1) { // if file was first to be added
  		$("#editor").css('visibility', 'visible');
  		$("#code-editor .nav-link").eq(0).addClass("active");
	}


	initFileTab(newTab);

	if (!text)
		text = '';

	var mode;
	if (fileName) {
		mode = modelist.getModeForPath(fileName).mode;
	} else {
		mode = '';
	}

	editorSessions.push(new EditorSession(ace.createEditSession(text, mode)));

	var sessionIndex = editorSessions.length-1;
  editorSessions[sessionIndex].session.setUseWrapMode(true);
	$("#code-editor .nav-item .close").eq(sessionIndex).click(function() {
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

	if (!isThumbnail) {
		editorSessions[sessionIndex].session.selection.on('changeCursor', function(e) {
			var fileIndex = getSessionIndex(editor.session);
			socket.emit("cursorChange", editor.getCursorPosition(), fileIndex);
		});
		editorSessions[sessionIndex].session.selection.on('changeSelection', function(e) {
			var fileIndex = getSessionIndex(editor.session);
			socket.emit("selectionChange", editor.selection.getRange(), fileIndex);
		});
	}

	if (editorSessions.length == 1) {
		editor.setSession(editorSessions[0].session);
		if (fileName) {
			$("#downloadFileBtn").removeClass("disabled");
			$("#downloadFileBtn").attr("href", "file/" + 0);

			updateHtmlPreviewWindow(0);
		}
	}
}

function setSessionMode(newFileName, fileIndex) {
	var mode = modelist.getModeForPath(newFileName).mode;
	editorSessions[fileIndex].session.setMode(mode);
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
	if ($("#code-editor .nav-link").eq(fileIndex).hasClass("active")) {
		$("#code-editor .nav-item").eq(fileIndex).remove();
		editorSessions.splice(fileIndex, 1);

		if ($("#code-editor .nav-link").length > 0) {
			// set to first file tab
  			$("#code-editor .nav-link").eq(0).addClass("active");
  			editor.setSession(editorSessions[0].session);

  			updateHtmlPreviewWindow(0);

  			$("#downloadFileBtn").attr("href", "file/" + 0);
  		}
	} else {
		$("#code-editor .nav-item").eq(fileIndex).remove();
		editorSessions.splice(fileIndex, 1);

		$("#downloadFileBtn").attr("href", "file/" + getSessionIndex(editor.session));
	}

	if ($("#code-editor .nav-link").length == 0) {
		$("#editor").css('visibility', 'hidden');
		$("#previewContainer").hide();

		$("#downloadFileBtn").addClass("disabled");

		$("#htmlPreview").attr("src", "about:blank");
	}
}

function validFileName(name) {
	var pattern = /^(?!^(PRN|AUX|CLOCK\$|NUL|CON|COM\d|LPT\d|\..*)(\..+)?$)[^\x00-\x1f\\?*:\";|/]+$/i;
	var uniqueFile = $(".fileName").filter(function() {return this.value == name}).length <= 1;

	return pattern.test(name) && uniqueFile;
}

function initFileTab(newTab) {
	var fileNameInput = newTab.find(".fileName");
	newTab.click(function(e) {
		var sessionIndex = $("#code-editor .nav-item").index($(this));
		updateHtmlPreviewWindow(sessionIndex);
		// prevents delete button from triggering tab switch
		if (e.target.getAttribute("class") == "close")
			return;

		editor.setSession(editorSessions[sessionIndex].session);

		$("#downloadFileBtn").attr("href", "file/" + sessionIndex);
		if(fileNameInput.val().length == 0) {
			$("#downloadFileBtn").addClass("disabled");
		} else {
			$("#downloadFileBtn").removeClass("disabled");
		}

	});
	// To auto resize fileName tabs
	fileNameInput.on('input', function() {
		$(this).siblings('.hiddenSpan').text($(this).val());
		$(this).width($(this).siblings('.hiddenSpan').width());
	});
	// initially resize tabs to fit fileName
	fileNameInput.each(function() {
		$(this).siblings('.hiddenSpan').text($(this).val());
		$(this).width($(this).siblings('.hiddenSpan').width());
	});

	var enterPressed = false;
	fileNameInput.on('keyup', function(e) {
		if (e.keyCode == 13) {
			enterPressed = false;
		}
	});

	fileNameInput.on('keydown', function(e) {
	    if (!enterPressed && e.keyCode == 13 && $(this).val().length > 0) {
	    	enterPressed = true;
	    	if ($(this).val() == "" || validFileName($(this).val())) {
	    		newTab.popover('hide');
		        $(this).prop("readonly", true);

				var sessionIndex = $(".fileName").index($(this));
		        socket.emit("fileRenamed", $(this).val(), sessionIndex);
		    	setSessionMode($(this).val(), sessionIndex);

		    	updateHtmlPreviewWindow(sessionIndex);

				if ($(".fileName").eq(sessionIndex).val().split('.').pop() == "html") {
					if (!editorSessions[sessionIndex].session.getValue()) {
						editorSessions[sessionIndex].session.setValue(htmlStarter);
					}
				}

				if(fileNameInput.val().length == 0) {
					$("#downloadFileBtn").addClass("disabled");
				} else {
					$("#downloadFileBtn").removeClass("disabled");
				}
	    	} else {
				// $(this).val("");
	    		// alert("Invalid file name");
	    		newTab.popover('show');
	    	}
	    }
	});


	fileNameInput.blur(function() {
		if ($(this).val() == "" || validFileName($(this).val())) {
			newTab.popover('hide');
			if ($(this).val().length > 0) {
				$(this).prop("readonly", true);
			} else {
				$(this).prop("readonly", false);
			}

			var sessionIndex = $(".fileName").index($(this));
	        socket.emit("fileRenamed", $(this).val(), sessionIndex);
			setSessionMode($(this).val(), sessionIndex);

	        updateHtmlPreviewWindow(sessionIndex);

			if ($(".fileName").eq(sessionIndex).val().split('.').pop() == "html") {
				if (!editorSessions[sessionIndex].session.getValue()) {
					editorSessions[sessionIndex].session.setValue(htmlStarter);
				}
			}

			if(fileNameInput.val().length == 0) {
				$("#downloadFileBtn").addClass("disabled");
			} else {
				$("#downloadFileBtn").removeClass("disabled");
			}
		} else {
			// $(this).val("");
			// alert("Invalid file Name")
			newTab.popover('show');
		}
	});
	fileNameInput.dblclick(function() {
		$(this).prop("readonly", false);
	});
}

/*$("#programInputForm").submit(function(e) {
	e.preventDefault();
	socket.emit("programInput", $("#programInput").val());
	$("#programInput").val("");
});*/

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
	$('[data-toggle="popover"]').popover('hide');

	$('.fileName').eq(fileIndex).val(newFileName);
	setSessionMode(newFileName, fileIndex);

	if (getSessionIndex(editor.session) == fileIndex)
		updateHtmlPreviewWindow(fileIndex);

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

function reloadIframe(fileIndex, text) {
	$("#htmlPreview").get(0).contentDocument.location.reload(true);
}

function updateHtmlPreviewWindow(fileIndex) {
	if ($(".fileName").eq(fileIndex).val().split('.').pop() == "html") {

		if ($("#htmlPreview").attr("src") != "htmlPreview/" + fileIndex + "/") {
			$("#htmlPreview").hide();
			$("#htmlPreview").attr("src", "htmlPreview/" + fileIndex + "/");
			$("#htmlPreviewNewWindow").attr("href", "htmlPreview/" + fileIndex + "/");

			$('#htmlPreview').on('load', function() {
				$("#htmlPreview").show();
			});
		}

		$("#previewContainer").show();
	} else {
		$("#previewContainer").hide();
	}
  editor.resize();
}

function runProgram() {
	var fileIndex = $("#code-editor .nav-link").index($("#code-editor .nav-link.active"));
	var fileName = $("#code-editor .nav-link.active").find(".fileName").val();

	socket.emit("run", fileIndex);
	$("#loadingWheel").show();
	$("#run").prop("disabled", true);
	// $('#output').removeClass("outputError");
	// $('#output').val("");
  terminal.clear();

	if (fileName.split('.').pop() == "html") {
		reloadIframe();
	}
}

socket.on("programRunning", function(fileIndex) {
	$("#loadingWheel").show();
	$("#run").prop("disabled", true);
	// $('#output').removeClass("outputError");
	// $('#output').val("");
  terminal.clear();

	var fileName = $(".fileName").eq(fileIndex).val();

	if (fileName.split('.').pop() == "html" && getSessionIndex(editor.session) == fileIndex) {
		reloadIframe();
	}
});

socket.on("output", function(text) {
  terminal.echo(text);
	// $('#output').removeClass("outputError");
	// $('#output').val($('#output').val() + text);
	// $('#output').get(0).scrollTop = $('#output').get(0).scrollHeight;
});

socket.on("runFinished", function() {
	$("#loadingWheel").hide();
	$("#run").prop("disabled", false);
	// $("#programInput").prop("disabled", true);
});

socket.on("readyForInput", function() {
	// $("#programInput").prop("disabled", false);
});

socket.on("programInput", function(text) {
	terminal.echo(terminal.get_prompt() + text);
});

socket.on("outputError", function(text) {
  terminal.error(text);
	// $('#output').addClass("outputError");
	// $('#output').val($('#output').val() + text);
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
