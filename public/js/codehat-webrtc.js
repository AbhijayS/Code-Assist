var muted;

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
});