$(document).ready(function() {
  $('#editorContainer').css({
    'padding-left' : $('#sidebar').width()
  });
  layout.resizeAll();

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

  $('#videochat-btn').click(function() {
    layout.toggle("east");
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

});
