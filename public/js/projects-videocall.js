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

	checkOnlyUserConnected();
});

easyrtc.setOnStreamClosed(function (callerEasyrtcid) {
	var video = $("#video_" + callerEasyrtcid);
	if (video.hasClass("active") && $(".peerVideo").length > 1) {
		video.remove();

		$(".peerVideo").eq(0).show();
		$(".peerVideo").eq(0).addClass("active");

		// highlight selected button
		$("#peerButtons button").removeClass("btn-primary");
		$("#peerButtons button").addClass("btn-secondary");
		$("#peerButtons button").eq(0).removeClass("btn-secondary");
		$("#peerButtons button").eq(0).addClass("btn-primary");
	} else {
		video.remove();
	}

	checkOnlyUserConnected();
});

function checkOnlyUserConnected() {
	// easyrtc.getConnectionCount()
	if ($("#peerVideos").children().length > 0) {
		$("#selfVideo").removeClass("onlyUserConnected");
	} else {
		$("#selfVideo").addClass("onlyUserConnected");
	}
}

easyrtc.enableDebug(false);
easyrtc.setRoomOccupantListener(RoomOccupantListener);

if (username)
	easyrtc.setUsername(username);

$("#joinCallAudio").click(function() {
	if (!connected) {
		initVideo(function() {
			videoOff();
			unMuteMic();

			joinCall();
		});
	}
});

$("#joinCallVideo").click(function() {
	if (!connected) {
		initVideo(function() {
			videoOn();
			unMuteMic();

			joinCall();
		});
	}
});

function initVideo(callback) {
	easyrtc.initMediaSource(
		function() {       // success callback
			var selfVideo = document.getElementById("selfVideo");
			easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
			// $("#selfVideo").show();
			callback();
		}, function(errmesg) {
	        // console.log(errmesg);
	    }
	);
}

function joinCall() {
	easyrtc.connect("Video_Conference", connectSuccess, connectFailure);

	$("#joinCallAudio").hide();
	$("#joinCallVideo").hide();
	$("#callButtons").show();
}

$("#hangUp").click(function() {
	easyrtc.closeLocalMediaStream();
	easyrtc.disconnect();
	selfEasyrtcid = "";
	connected = false;
	readyToJoinCall = false;
	$("#selfVideo").hide();
	easyrtc.enableCamera(false);

	$("#peerButtons").empty();
	$("#joinCallAudio").show();
	$("#joinCallVideo").show();
	$("#callButtons").hide();
	$("#callStatus").text("");
});

function connectSuccess(easyrtcid, roomOwner) {
	selfEasyrtcid = easyrtcid;

	easyrtc.joinRoom(namespace.substring(1), null, function(roomName) {
		// console.log("connnected to " + roomName);
		readyToJoinCall = true;
	});
}

function connectFailure(errorCode, errorText) {
	easyrtc.showError(errorCode, errorText);
}

function RoomOccupantListener(roomName, occupants, isPrimary) {
	$("#peerButtons").empty();
	for(var easyrtcid in occupants) {
		// add peer buttons
		if ($("#peerButtons button").length > 0) {
			$("#peerButtons").append(`<button id="${easyrtcid}" class='btn btn-secondary'>${easyrtc.idToName(easyrtcid)}</button>`)
		} else {
			$("#peerButtons").append(`<button id="${easyrtcid}" class='btn btn-primary'>${easyrtc.idToName(easyrtcid)}</button>`)
		}

		if (readyToJoinCall) {
			easyrtc.call(easyrtcid,
			function(easyrtcid, mediaType){
				// console.log("Got mediaType " + mediaType + " from " + easyrtc.idToName(easyrtcid));
			},
			function(errorCode, errMessage){
				// console.log("call to  " + easyrtc.idToName(easyrtcid) + " failed:" + errMessage);
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

		// highlight selected button
		$("#peerButtons button").removeClass("btn-primary");
		$("#peerButtons button").addClass("btn-secondary");
		$(this).removeClass("btn-secondary");
		$(this).addClass("btn-primary");
	});

	if (readyToJoinCall) {
		readyToJoinCall = false;
		connected = true;
	}

	if (connected) {
		if (Object.keys(occupants).length > 0) {
			$("#callStatus").text("Users");
		} else {
			$("#callStatus").text("No Users Connected");
		}
	} else {
		$("#callStatus").text("");
	}

	checkOnlyUserConnected();
}

easyrtc.setAcceptChecker(function(easyrtcid, callback) {
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
	$("#muteAudio").html('<i class="fas fa-microphone-slash">');
	$("#muteAudio").removeClass("btn-success");
	$("#muteAudio").addClass("btn-danger");
}

function unMuteMic() {
	muted = false;
	easyrtc.enableMicrophone(true);
	$("#muteAudio").html('<i class="fas fa-microphone">');
	$("#muteAudio").addClass("btn-success");
	$("#muteAudio").removeClass("btn-danger");
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
	$("#toggleVideo").html('<i class="fas fa-video">');
	$("#toggleVideo").addClass("btn-success");
	$("#toggleVideo").removeClass("btn-danger");

	$("#selfVideo").show();
}

function videoOff() {
	cameraDisabled = true;
	easyrtc.enableCamera(false);
	$("#toggleVideo").html('<i class="fas fa-video-slash"></i>');
	$("#toggleVideo").removeClass("btn-success");
	$("#toggleVideo").addClass("btn-danger");

	$("#selfVideo").hide();
}
