
window.onload = function(){
  $('#first-name').change(function() {
    console.log("Changing first name");
    var inputBox = $(this);
    $.post('/first-name-change', {firstName: inputBox.val()}, function(data) {
      if(data.url) {
        window.location.replace("http://" + window.location.host + data.url);
      }else{
        if(data.auth) {
          inputBox.attr('class', 'form-control is-valid');
        }else{
          inputBox.attr('class', 'form-control is-invalid');
          inputBox.next().text(data.message);
        }
      }
    })
  });

  $('#last-name').change(function() {
    var inputBox = $(this);
    $.post('/last-name-change', {lastName: inputBox.val()}, function(data) {
      if(data.url) {
        window.location.replace("http://" + window.location.host + data.url);
      }else{
        if(data.auth) {
          inputBox.attr('class', 'form-control is-valid');
        }else{
          inputBox.attr('class', 'form-control is-invalid');
          inputBox.next().text(data.message);
        }
      }
    })
  });

  $('#usernameInput').change(function() {
    var inputBox = $(this);
    var change = $(this).val();
    $.post('/username-change', {username: change}, function(data) {
      if(data.url)
      {
        window.location.replace(data.url);
      }else{
        if(data.status == true){
          inputBox.attr('class', 'form-control is-valid');
        }else{
          inputBox.attr('class', 'form-control is-invalid');
          inputBox.next().text(data.message);
        }
      }
    });
  });

  $('#emailInput').change(function() {
    var inputBox = $(this);
    $.post('/email-change', {email: inputBox.val()}, function(data) {
      if(data.url)
      {
        window.location.replace("http://" + window.location.host + data.url);
      }else{
        if(data.status == true)
        {
          inputBox.attr('class', 'form-control is-valid');
        }else{
          inputBox.attr('class', 'form-control is-invalid');
          inputBox.next().text(data.message);
        }
      }
    });
  });

  $('#email-checkbox').change(function() {
    $.post('/update-subscription', {data: JSON.stringify($(this).is(':checked'))}, function(data) {
      if(data.url)
        window.location.replace("http://"+window.location.host+url);
    })
  })

  $('#bio-textarea').change(function() {
    var textBox = $(this);
    $.post('/change-bio', {bio: textBox.val()}, function(data) {
      console.log(data);
      if(data.auth) {
        textBox.attr('class', 'form-control is-valid');
      }else{
        textBox.attr('class', 'form-control is-invalid');
        textBox.next().text(data.message);
        if(data.url) {
          window.location.replace("http://"+window.location.host+data.url);
        }
      }
    })
  })
  $(".deleteAccount").click(function() {
    $('.confirm-delete-account').click(function() {
      console.log("Confirmed");
        $.post('/delete-account', function(url) {
          window.location.replace(url);
        });
    })
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
