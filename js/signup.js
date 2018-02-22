var socket = io.connect();
$('#signupForm').submit(function(e){
  e.preventDefault();
  socket.emit("Signup")
});
