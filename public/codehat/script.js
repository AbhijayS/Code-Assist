// var socket = io.connect();
var socketID;

var editor = ace.edit("editor");

var editorSessions = [];
editorSessions.push(editor.getSession());

var doc = editor.getSession().getDocument();

const curMgr = new AceCollabExt.AceMultiCursorManager(editor.getSession());
const selMgr = new AceCollabExt.AceMultiSelectionManager(editor.getSession());
var AceRange = ace.require('ace/range').Range;

var applyingChanges = false;

$('#output').val("");

$("input:file").change(function() {
	let file = $(this)[0].files[0];
	let reader = new FileReader();
	reader.readAsText(file);
	reader.onload = function(e) {
		let text = e.target.result;
		editor.setValue(text, -1);
	};
});

// new file being created
$("#newFileBtn").click(function() {
	let newTabIndex = $(".nav-item").length;
	$("#fileTabs").append('<li class="nav-item"><a class="nav-link" data-toggle="tab" href=""><span class="hiddenSpan"></span><input class="fileName" placeholder="untitled" autocomplete="off" spellcheck="false" type="text"></a></li>');

	initFileTabs();

	editorSessions[newTabIndex] = ace.createEditSession('', "ace/mode/java");
});

initFileTabs();
function initFileTabs() {
	$(".nav-item").click(function() {
		let sessionIndex = $(".nav-item").index($(this));
		editor.setSession(editorSessions[sessionIndex]);
		// console.log($(".nav-item").index($(this)));
	});
	// To auto resize fileName tabs
	$('.fileName').on('input', function() {
		$(this).siblings('.hiddenSpan').text($(this).val());
		$(this).width($(this).siblings('.hiddenSpan').width());
	});
	$(".fileName").on('keydown', function(e) {
	    if (e.keyCode == 13) {
	        $(this).prop("readonly", true);
	    }
	});
	$(".fileName").blur(function() {
		if ($(this).val().length > 0)
			$(this).prop("readonly", true);
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

editor.getSession().on('change', function(event) {
	console.log("change")
    if (applyingChanges) { // prevents applyDelta from being detected as another change
        return;
    }

	socket.emit("input", editor.getValue());
	socket.emit("change", event);
});

socket.on("change", function(event) {
	applyingChanges = true;
	doc.applyDelta(event);
	applyingChanges = false;
});

socket.on("input", function(text) { // only for people just joining
	// console.log(text);
	applyingChanges = true;
	editor.setValue(text, -1);
	applyingChanges = false;
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
	socket.emit("run");
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
})

editor.session.selection.on('changeCursor', function(e) {
	socket.emit("cursorChange", editor.getCursorPosition())
});

editor.session.selection.on('changeSelection', function(e) {
	// console.log(editor.selection.getRange());
	socket.emit("selectionChange", editor.selection.getRange());
});

socket.on("selections", function(selections) {
	for (var id in selections) {
		if (selMgr._selections[id]) {
			selMgr.setSelection(id, new AceRange(selections[id].start.row, selections[id].start.column, selections[id].end.row, selections[id].end.column));
		} else if (id !== socketID){
//			curMgr.addCursor(id, "User", "purple", {row: cursors[id].start, column: cursors[id].column});
			selMgr.addSelection(id, "User", "purple", [new AceRange(selections[id].start.row, selections[id].start.column, selections[id].end.row, selections[id].end.column)]);
		}
	}
});

socket.on("socketID", function(id) {
	socketID = id;
});

socket.on("cursors", function(cursors) {
	for (var id in cursors) {
		if (curMgr._cursors[id]) {
			curMgr.setCursor(id, {row: cursors[id].row, column: cursors[id].column});
		} else if (id !== socketID){
			curMgr.addCursor(id, "User", "purple", {row: cursors[id].row, column: cursors[id].column});
		}
	}
});

socket.on("deleteCursor", function(id) {
	if (curMgr._cursors[id]) {
		curMgr.removeCursor(id);
	}
});

socket.on("deleteSelection", function(id) {
	if (selMgr._selections[id]) {
		selMgr.removeSelection(id);
	}
});