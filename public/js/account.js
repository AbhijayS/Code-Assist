
window.onload = function(){
  $('#usernameInput').change(function() {
    var change = $(this).val();
    $.post('/username-change', {username: change}, function(data) {
      if(data.url)
      {
        window.location.replace(data.url);
      }else{
        if(data.status == true)
        {
          // console.log("Available: " + data.status);
          $('#user-status').removeClass();
          $('#user-status').addClass('glyphicon glyphicon-ok');
          $('#username').empty();
          var newContent = `
          <strong>Username</strong>: ${change}
          `;
          $('#username').append(newContent);
        }else{
          $('#user-status').removeClass();
          $('#user-status').addClass('glyphicon glyphicon-remove');
        }
      }
    });
  });

  $('#emailInput').change(function() {
    console.log("User is email...");
    $.post('/email-change', {email: $(this).val()}, function(data) {
      if(data.url)
      {
        window.location.replace(data.url);
      }else{
        if(data.status == true)
        {
          console.log("Available: " + data.status);
          $('#email-status').removeClass();
          $('#email-status').addClass('glyphicon glyphicon-ok');
        }else{
          $('#email-status').removeClass();
          $('#email-status').addClass('glyphicon glyphicon-remove');
        }
      }
    });
  });

  $("#deleteAccount").click(function() {
    var confirmDeletion = confirm("Are you sure you want to delete your account?");
    if (confirmDeletion) {
      $.post('/delete-account', function(url) {
        window.location.replace(url);
      });
    }
  });

  $('#profilePicModal').on('show.bs.modal', function(e) {
    uploader.splice(0);
    $('#fileInfo').text('');
  });

  $('#saveProfilePic').click(function() {
      $('#saveProfilePic').attr("disabled", true);
      uploader.start();
      $('#loadingWheel').show();
      if (uploader.files.length == 0) {
        var formData = new FormData();
        $.ajax({
            url: "/profile-pic-change",
            data: formData,
            type: 'POST',
            contentType: false,
            processData: false,
            success: function(data) {
              if (data.pic) {
                $('#userPic').css('background-image', 'url(' + data.pic + ')');
              }
              $('#profilePicModal').modal('hide');
              $('#loadingWheel').hide();
              $('#saveProfilePic').attr("disabled", false);
            }
        });
      }
  });

  var uploader = new plupload.Uploader({
    browse_button: 'browse', // this can be an id of a DOM element or the DOM element itself
    url: '/profile-pic-change',
    multi_selection: false,
    resize: {
      height: 420,
      width: 420
    },
    filters: {
      mime_types: [{title : "Image files", extensions : "jpg,jpeg,png"}]
    }
  });
   
  uploader.init();

  uploader.bind('FilesAdded', function (up, files) {
    // keep only latest file
    uploader.splice(0, uploader.files.length - 1);

    var file = files[0];
    $('#fileInfo').text(file.name + ' (' + plupload.formatSize(file.size) + ')');
  });

  uploader.bind('FileUploaded', function(up, file, result) {
    var data = JSON.parse(result.response);
    if (data.pic) {
      $('#userPic').css('background-image', 'url(' + data.pic + ')');
    }
    $('#profilePicModal').modal('hide');
    $('#loadingWheel').hide();
    $('#saveProfilePic').attr("disabled", false);
  });
};
