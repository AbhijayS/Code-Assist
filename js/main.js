var socket = io().connect();

$(document).ready(function(){

  $('form').submit(function(e){
    e.preventDefault();
    var msg = $('#text-box').val();
    console.log(msg);
    $('#iframe-form').contents().find('#username-text-box').val(msg);
    return false;
  });
});

function frameLoaded(){
  $("#iframe-form").contents().find('#login-form').submit(function(e) {
    e.preventDefault();
    var pass = $('#iframe-form').contents().find('#form-password').val();
    var user = $('#iframe-form').contents().find('#username-text-box').val();
    socket.emit('signup', {username: user, password:pass});
    $('#iframe-form').contents().find('#form-password').val('');
    $('#iframe-form').contents().find('#username-text-box').val('');
  });
}
