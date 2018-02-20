var socket = io.connect();
console.log("emit")
$('form').submit(function(e){
  e.preventDefault();
  socket.emit("signup", {username: $("#emailInput").val(), password: $("#passwordInput").val()})
});
