
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
    $('#picUpload').val('');
  });

  $('#saveProfilePic').click(function() {

    $('#profilePicModal').modal('hide');
      var formData = new FormData();
      formData.append('file', $('#picUpload')[0].files[0]);
      $.ajax({
          url: "/profile-pic-change",
          data: formData,
          type: 'POST',
          contentType: false,
          processData: false,
          success: function(data) {
            if (data.pic) {
              $('#userPic').attr('src', data.pic);
            }
          }
      });
  });
};
