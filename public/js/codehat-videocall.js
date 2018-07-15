easyrtc.setSocketUrl(":8888");

var selfEasyrtcid = "";
var connected = false;
var readyToJoinCall = false;
var muted = false;
var cameraDisabled = false;

easyrtc.setStreamAcceptor(function(callerEasyrtcid, stream) {
	var newVideo = $(`<video autoplay="autoplay" id="video_${callerEasyrtcid}" class="peerVideo"></video>`);
	if ($(".peerVideo").length > 0) {
		newVideo.hide();
	} else {
		newVideo.addClass("active");
	}

	$("#peerVideos").append(newVideo);

	easyrtc.setVideoObjectSrc(newVideo.get(0), stream);
});

easyrtc.setOnStreamClosed(function (callerEasyrtcid) {
	var video = $("#video_" + callerEasyrtcid);
	if (video.hasClass("active") && $(".peerVideo").length > 1) {
		video.remove();

		$(".peerVideo").eq(0).show();
		$(".peerVideo").eq(0).addClass("active");
	} else {
		video.remove();	
	}
});

easyrtc.enableDebug(false);
easyrtc.setRoomOccupantListener(RoomOccupantListener);
easyrtc.setUsername(username);

// easyrtc.enableVideo(false);
easyrtc.initMediaSource(
	function() {       // success callback
		var selfVideo = document.getElementById("selfVideo");
		easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
	}, function(errmesg) {
        console.log(errmesg);
    }
);

$("#joinCallAudio").click(function() {
	if (!connected) {
		videoOff();
		unMuteMic();

		joinCall();
	}
});

$("#joinCallVideo").click(function() {
	if (!connected) {
		videoOn();
		unMuteMic();
		
		joinCall();
	}
});

function joinCall() {
	easyrtc.connect("Video_Conference", connectSuccess, connectFailure);

	$("#joinCallAudio").hide();
	$("#joinCallVideo").hide();
	$("#hangUp").show();
	$("#muteAudio").show();
	$("#toggleVideo").show();
}

$("#hangUp").click(function() {
	easyrtc.disconnect();
	selfEasyrtcid = "";
	connected = false;
	readyToJoinCall = false;

	$("#peerButtons").empty();
	$("#joinCallAudio").show();
	$("#joinCallVideo").show();
	$("#hangUp").hide();
	$("#muteAudio").hide();
	$("#toggleVideo").hide();
});

function connectSuccess(easyrtcid, roomOwner) {
	selfEasyrtcid = easyrtcid;

	easyrtc.joinRoom(namespace.substring(1), null, function(roomName) {
		console.log("connnected to " + roomName);
		readyToJoinCall = true;
	});
}
 
function connectFailure(errorCode, errorText) {
	easyrtc.showError(errorCode, errorText);
}
 
function RoomOccupantListener(roomName, occupants, isPrimary) {
	$("#peerButtons").empty();
	for(var easyrtcid in occupants) {
		// add id buttons
		$("#peerButtons").append(`<button id="${easyrtcid}" class='btn btn-primary'>${easyrtc.idToName(easyrtcid)}</button>`)

		if (readyToJoinCall) {
			console.log("calling " + easyrtcid);
			easyrtc.call(easyrtcid,
			function(easyrtcid, mediaType){
				console.log("Got mediaType " + mediaType + " from " + easyrtc.idToName(easyrtcid));
			},
			function(errorCode, errMessage){
				console.log("call to  " + easyrtc.idToName(easyrtcid) + " failed:" + errMessage);
			},
			function(wasAccepted, easyrtcid){
				if(wasAccepted) {
					console.log("call accepted by " + easyrtc.idToName(easyrtcid));
				} else {
					console.log("call rejected" + easyrtc.idToName(easyrtcid));
				}
			});		
		}

	}

	$("#peerButtons button").click(function() {
		var easyrtcid = $(this).attr("id");
		var video = $("#video_" + easyrtcid);
		$(".peerVideo").hide();
		video.show();

		$(".peerVideo").removeClass("active");
		video.addClass("active");
	});

	if (readyToJoinCall) {
		readyToJoinCall = false;
		connected = true;
	}
}

easyrtc.setAcceptChecker(function(easyrtcid, callback) {
	console.log("accepted call");
	connected = true;
	callback(true);
});

$("#muteAudio").click(function() {
	if (muted) {
		unMuteMic()
	} else {
		muteMic();
	}
});

function muteMic() {
	muted = true;
	easyrtc.enableMicrophone(false);
	$("#muteAudio").text("Unmute");
	$("#muteAudio").addClass("btn-success");
	$("#muteAudio").removeClass("btn-danger");
}

function unMuteMic() {
	muted = false;
	easyrtc.enableMicrophone(true);
	$("#muteAudio").text("Mute");
	$("#muteAudio").removeClass("btn-success");
	$("#muteAudio").addClass("btn-danger");
}

$("#toggleVideo").click(function() {
	if (cameraDisabled) {
		videoOn()
	} else {
		videoOff();
	}
});

function videoOn() {
	cameraDisabled = false;
	easyrtc.enableCamera(true);
	$("#toggleVideo").text("Turn Video Off");
	$("#toggleVideo").removeClass("btn-success");
	$("#toggleVideo").addClass("btn-danger");
}

function videoOff() {
	cameraDisabled = true;
	easyrtc.enableCamera(false);
	$("#toggleVideo").text("Turn Video On");
	$("#toggleVideo").addClass("btn-success");
	$("#toggleVideo").removeClass("btn-danger");
}