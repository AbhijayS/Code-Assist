$(document).ready(function() {
  socket.on('disconnect', () => {
    $("#disconnection-modal").modal('show');
  });

  const bronze = {
    color: "#d06f10",
    html: `<i class="fas fa-medal"></i>`
  };
  const silver = {
    color: "#9e9e9e",
    html: `<i class="fas fa-award"></i>`
  };
  const gold = {
    color: "#ffc107",
    html: `<i class="fas fa-trophy"></i>`
  };
  const platinum = {
    color: "#007bff",
    html: `<i class="fas fa-user-tie"></i>`
  };

  function setElementColor(element, color) {
    element.css({'color': color});
  }

  function displayElement(element) {
    element.show();
    element.attr('hidden', false);
  }

  function updateRanks() {
    $('.prize').each(function() {
      var text = $(this).text();
      if(text == "bronze") {

        $(this).html(bronze.html);
        setElementColor($(this), bronze.color);
        displayElement($(this));

      }else if(text == "silver"){

        $(this).html(silver.html);
        setElementColor($(this), silver.color);
        displayElement($(this));

      }else if(text == "gold") {

        $(this).html(gold.html);
        setElementColor($(this), gold.color);
        displayElement($(this));

      }else if(text == "platinum") {

        $(this).html(platinum.html);
        setElementColor($(this), platinum.color)
        displayElement($(this));

      }
    });
  }
  updateRanks();

  /* socket io */
  $('#group-chat #send-message-form').submit(function(event){
    event.preventDefault();
    var form = $(this);
    var message = form.find('#msg');

    if(message.val().length > 0) {
      $.post("/current-user", function(user) {
        if(user){
          socket.emit('chat', message.val(),user._id,user.username);
          message.val('');
        }else{
        }
      });
    }
  });
  socket.on('broadcastchat', function(msg){
    var toAppend = $(`
      <li class="bg-light rounded my-3 py-2 pl-2">
        <h6 class="text-secondary"><b>` + msg.author + `</b></h6>
        <p style="margin: 0;">` + msg.message + `</p>
      </li>
    `);

    var messagesDiv = $('#group-chat #all-messages');
    messagesDiv.append(toAppend);
    messagesDiv.animate({ scrollTop: messagesDiv.prop("scrollHeight")}, 1000);
  });


  $('#add-more-inputs').click(function() {
    var addEmail = $(`
      <div class="row mb-2">
        <div class="col-sm-1">
          <button type="button" class="close mt-2 mx-auto" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="col-sm-10">
          <input type="text" class="form-control" name="credentials" aria-describedby="emailHelp">
          <div class="text-danger invalid-feedback">
            Member not found.
          </div>
        </div>
      </div>
      `);
    addEmail.insertBefore('#settings #send-options');

    $('#settings .close').click(function() {
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
      var modal1 = $('#delete-project-modal');
      var modal2 = $('#transfer-ownership-modal');
      var modal3 = $('#delete-user-modal');
      var modal4 = $('#leave-project-modal');

      // if the target of the click isn't the container nor a descendant of the container
      if (!container.is(e.target) && !modal1.is(e.target) && !modal2.is(e.target) && !modal3.is(e.target) && !modal4.is(e.target) && (container.has(e.target).length === 0) && (modal1.has(e.target).length === 0) && (modal2.has(e.target).length === 0) && (modal3.has(e.target).length === 0) && (modal4.has(e.target).length === 0))
      {
          $('#settings').hide();
      }
  });
  $('#exit-settings').click(function() {
    $('#settings').hide();
  })

  $('#settings-btn').click(function() {
    $('#settings').show();
    $('#close-settings').show();
  });

  $('#videochat-btn').click(function() {
    $('.ui-layout-east .video-chat-view').hide();
    $('.ui-layout-east #videoChat').show();
    if(layout.state.east.isClosed)
      layout.toggle("east");
  });

  $('#toggle-video').click(function() {
    $('.ui-layout-east .video-chat-view').hide();
    $('.ui-layout-east #videoChat').show();
  });

  $('#chat-btn').click(function() {
    // $('.ui-layout-east .video-chat-view').hide();
    // $('.ui-layout-east #chat').show();
    layout.toggle("east");
  });

  $('#toggle-chat').click(function() {
    $('.ui-layout-east .video-chat-view').hide();
    $('.ui-layout-east #chat').show();
  });

  $('#share-project').submit(function(event) {
    event.preventDefault();
    var form = $(this);
    var allCredentials = form.find("input[name=credentials]");
    var toSend = [];
    for(var i = 0; i < allCredentials.length; i++) {
      toSend.push($(allCredentials[i]).val());
    }
    $.post('/projects/share', {credentials: toSend, projectID: window.location.pathname.split('/')[2]}, function(data) {
      if(!data || data.length == 0) {
        var emailsSent = $(`
          <div class="row">
            <div class="col-sm-10 offset-sm-1">
              <div id="emailsSent" class="alert alert-success alert-dismissible fade show" role="alert">
              Invitations sent successfully
              <button type="button" class="close" onclick="$('.alert').alert('close')" aria-label="Close">
              <span aria-hidden="true">&times;</span>
              </button>
              </div>
            </div>
          </div>
        `);
        $('#settings #box #share-project').prepend((emailsSent));

        allCredentials.removeClass();
        allCredentials.addClass('form-control');
        allCredentials.addClass("is-valid");

      }else{
        allCredentials.removeClass();
        allCredentials.addClass('form-control');
        allCredentials.addClass("is-valid");

        for(var i = 0; i < data.length; i++) {
          // console.log(data[i]);
          var temp = data[i];
          $(allCredentials.get(toSend.indexOf(temp))).addClass('is-invalid');
        }
      }
    });

  });

  $('#make-public-btn').click(function() {
    // var public_btn = $('#make-public-btn');
    var public_div = $('.public-div');
    var private_div = $('.private-div');

    $.post('/projects/make-project-public', {projectID: window.location.pathname.split('/')[2]}, function(data) {
      if(data.auth) {
        public_div.removeClass('d-none');
        public_div.addClass('d-none');
        private_div.removeClass('d-none');
      }else{
        window.location.replace('/');
      }
    });
  });

  $('#make-private-btn').click(function() {
    // var public_btn = $('#make-public-btn');
    var public_div = $('.public-div');
    var private_div = $('.private-div');

    $.post('/projects/make-project-private', {projectID: window.location.pathname.split('/')[2]}, function(data) {
      if(data.auth) {
        private_div.removeClass('d-none');
        private_div.addClass('d-none');
        public_div.removeClass('d-none');
      }else{
        window.location.replace('/');
      }
    });
  });

  $('#invite-mentor').submit(function(event) {
    event.preventDefault();
    $.post(window.location.pathname+'invite-mentor', function(data) {
      window.location.replace("http://"+window.location.host+data.url);
    });
  })

  $("#settings #change-project-name").change(function() {
    var input_field = $(this);
    $.post(window.location.pathname+'change-project-name', {newName: $(this).val()}, function(data) {
      if(data.auth) {
        input_field.attr('class', 'form-control is-valid')
      }else{
        input_field.attr('class', 'form-control is-invalid');
        if(data.url)
          window.location.replace(data.url);
      }
    });
  });

  /* Delete Project Button */
  $('#delete-project-confirm').submit(function(event) {
    event.preventDefault();
    var form = $(this);
    var name = form.find('input[name=projectName]');

    $.post(window.location.pathname+'delete', {projectName: name.val()}, function(data) {
      if(data.auth) {
        name.attr('class', 'form-control');
        window.location.replace("http://" + window.location.host + data.url);
      }else{
        name.attr('class', 'form-control is-invalid');
        if(url)
          window.location.replace("http://" + window.location.host + data.url);
      }
    });
  });


  $('#display-chat').click(function() {
    $('#settings').hide();
    $('.ui-layout-east .video-chat-view').hide();
    $('.ui-layout-east #chat').show();
    if(layout.state.east.isClosed)
      layout.toggle("east");
  });

  $('.transfer-ownership.dropdown-item').click(function() {
    var name = $(this).text();
    var userId = $(this).attr('id');
    $('#transfer-ownership-modal .recipient').text(name);
    $('#confirm-transfer').click(function(e) {
      e.preventDefault()
      $.post(window.location.pathname+'transfer-ownership/', {to: userId}, function(data) {
        window.location.replace(data.url);
      })
    })
  });

  $('.delete-user-btn').click(function() {
    var btn = $(this);
    var userID = btn.attr('name');
    var username = btn.find('.name').text();
    $('#delete-user-modal').find('.recipient').text(username);
    $('#delete-user-confirm').click(function(event) {
      event.preventDefault();
      $.post(window.location.pathname+'delete-user', {to: userID}, function(data) {
        if(data.auth) {
          btn.closest('.row').remove();
          window.location.replace(data.url);
        }else{
          if(data.url) {
            window.location.replace(data.url);
          }
        }
      });
    })
  });

  $('#leave-project-confirm').click(function(event) {
    event.preventDefault();
    $.post(window.location.pathname+'leave-project-confirm', function(data) {
      window.location.replace(data.url);
    });
  });

  // Block Ctrl-s for people who have a habit of pressing it LOL!!
  $(document).bind('keydown', function(e) {
    if(e.ctrlKey && ((e.which == 83) || (e.which == 76))) {
      e.preventDefault();
      return false;
    }
  });
});
