window.onload =
function() {
  // display or remove settings
  // Please do not modify the following fields. There could be unintended consequences.
  console.log($('#status').text());
  if($('#status').text() == "new") {
    $('#settings').show();
    $.post(window.location.pathname + "/change-status", {newStatus: "using"}, function(data) {
      if(!(data.auth == true)) {
        window.location.replace(data.url);
      }
    });
  }else{
    $('#settings').hide();
  }


  $('#code-editor').css({
    'margin-left' : $('#sidebar').width()
  });

  // code editor
  var editor = ace.edit("editor");
	editor.setTheme("ace/theme/textmate");
	editor.setShowPrintMargin(false);
	editor.$blockScrolling = Infinity;
	editor.focus();
  console.log("Editor Imported");


  //socket io
  $('#chat-ui #send-message-form').submit(function(event){
    event.preventDefault();
    var form = $(this);
    var message = $('#chat-ui #send-message-form #msg');

    $.post("/current-user", function(user) {
      console.log("Sending: " + message.val());
      if(user){
        console.log("User: " + user.username);
        socket.emit('chat', message.val(),user._id,user.username);
        message.val('');
      }else{
        console.log("Message failed");
      }
    });
  });
  socket.on('broadcastchat', function(msg){
    console.log("Broadcasted: " + msg);
    $('#chat-ui #all-messages').append($('<li>').text(msg.author+' : '+msg.message));
  });
  console.log("Chat loaded");


  $('#add-more-emails').click(function() {
    var addEmail = $(`
      <div class="row mb-2">
        <div class="col-sm-1">
          <button type="button" class="close mt-2 mx-auto" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="col-sm-10">
          <input type="email" class="form-control" name="emailInput" aria-describedby="emailHelp" placeholder="Enter email">
          <div class="text-danger invalid-feedback">
            Member with this email could not be found
          </div>
        </div>
      </div>
      `);
    addEmail.insertBefore('#settings #send-options');

    $('#settings .close').click(function() {
      console.log('clicked');
      $(this).parent().parent().remove();
    });
  });

  // $('#close-settings').click(function() {
  //   $('#settings').hide();
  //   $(this).hide();
  // });

  $(document).mouseup(function(e)
  {
      var container = $("#box");

      // if the target of the click isn't the container nor a descendant of the container
      if (!container.is(e.target) && container.has(e.target).length === 0)
      {
          $('#settings').hide();
      }
  });

  $('#settings-btn').click(function() {
    $('#settings').show();
    $('#close-settings').show();
  });

  $('#share-project').submit(function(event) {
    event.preventDefault();
    var form = $(this);
    var toSend = [];
    for(var i = 0; i < form.find("input[name=emailInput]").length; i++) {
      toSend.push($(form.find("input[name=emailInput]")[i]).val());
    }
    // console.log(window.location.pathname.split('/')[2]);
    $.post('/codehat/share', {emailInput: toSend, projectID: window.location.pathname.split('/')[2]}, function(data) {
      console.log("Data Length: " + data.length);
      if(!data || data.length == 0) {
        console.log("Success");
        var emailsSent = $(`
        <div id="emailsSent" class="alert alert-success alert-dismissible fade show" role="alert">
          Email Invitations sent successfully
          <button type="button" class="close" onclick="$('.alert').alert('close')" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        `);
        $('#settings #box').prepend((emailsSent));
        for(var i = 0; i < form.find("input[name=emailInput]").length; i++) {
          var temp = form.find("input[name=emailInput]");
          temp.removeClass();
          temp.addClass('form-control');
          temp.addClass("is-valid");
        }

      }else{
        for(var i = 0; i < form.find("input[name=emailInput]").length; i++) {
          var temp = form.find("input[name=emailInput]");
          temp.removeClass();
          temp.addClass('form-control');
          temp.addClass("is-valid");
        }
        for(var i = 0; i < data.length; i++) {
          // console.log(data[i]);
          var temp = data[i];
          $(form.find("input[name=emailInput]").get(toSend.indexOf(temp))).addClass('is-invalid');
        }
      }
    });

  });
  $("#settings #change-project-name").change(function() {
    var input_field = $(this);
    $.post(window.location.pathname+'/change-project-name', {newName: $(this).val()}, function(data) {
      // console.log(input_field.attr('class'));
      input_field.removeClass();
      input_field.addClass('form-control');
      input_field.css({'border' : ''});
      input_field.addClass(data.message);
    });
  });
};
