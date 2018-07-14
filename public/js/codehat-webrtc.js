easyrtc.setSocketUrl(":8888");

var selfEasyrtcid = "";
var connected = false;
var readyToJoinCall = false;
 
easyrtc.enableDebug(false);
easyrtc.setRoomOccupantListener(convertListToButtons);
easyrtc.setUsername(username);
easyrtc.easyApp("Video_Conference", "selfVideo", ["callerVideo"], loginSuccess, loginFailure);
 
function clearConnectList() {
	otherClientDiv = document.getElementById("otherClients");
	while (otherClientDiv.hasChildNodes()) {
		otherClientDiv.removeChild(otherClientDiv.lastChild);
	}
}

$("#joinCall").click(function() {
	if (!connected) {
		easyrtc.joinRoom(namespace.substring(1), null, function(roomName) {
			console.log("connnected to " + roomName);
			readyToJoinCall = true;
		});
	}
});
 
function convertListToButtons (roomName, occupants, isPrimary) {
	clearConnectList();
	var otherClientDiv = document.getElementById("otherClients");
	for(var easyrtcid in occupants) {
		var button = document.createElement("button");
		button.onclick = function(easyrtcid) {
			return function() {
				// performCall(easyrtcid);
			};
		}(easyrtcid);

		var label = document.createTextNode(easyrtcid);
		button.appendChild(label);
		otherClientDiv.appendChild(button);

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

	if (readyToJoinCall) {
		readyToJoinCall = false;
		connected = true;
	}
}
 
 
function loginSuccess(easyrtcid) {
	selfEasyrtcid = easyrtcid;
	document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(easyrtcid);
}
 
function loginFailure(errorCode, message) {
	easyrtc.showError(errorCode, message);
}

easyrtc.setAcceptChecker(function(easyrtcid, callback) {
	console.log("accepted call");
	connected = true;
	callback(true);
});

/*var muted;

var webrtc = new SimpleWebRTC({
	// the id/element dom element that will hold "our" video
	localVideoEl: 'localVideo',
	// the id/element dom element that will hold remote videos
	remoteVideosEl: 'remotesVideos',
	// immediately ask for camera access
	autoRequestMedia: false,
	url: 'http://localhost:8888'
});

$("#startCall").click(function() {
	webrtc.startLocalVideo();
	webrtc.joinRoom(namespace);
	muted = false;
	$("#localVideo").show();
});

$("#endCall").click(function() {
	webrtc.stopLocalVideo();
	webrtc.leaveRoom();
	muted = null;
	$("#localVideo").hide();
});

$("#muteAudio").click(function() {
	if (muted) {
		muted = false;
		webrtc.unmute();
		$(this).text("Mute");
		$(this).removeClass("btn-success");
		$(this).addClass("btn-danger");
	} else {
		muted = true;
		webrtc.mute();
		$(this).text("Unmute");
		$(this).addClass("btn-success");
		$(this).removeClass("btn-danger");
	}
});*/