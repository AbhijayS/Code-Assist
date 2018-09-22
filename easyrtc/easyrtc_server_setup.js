var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var io      = require("socket.io");         // web socket external module
var easyrtc = require('./easyrtc_server');  // EasyRTC external module

// Setup and configure Express http server.
var httpApp = express();

// Start Express http server on port 8888
var webServer = http.createServer(httpApp).listen(3001);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer);

// Start EasyRTC server
var easyrtcServer = easyrtc.listen(httpApp, socketServer);
