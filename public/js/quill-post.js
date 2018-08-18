window.onload = function(){
  // var Delta = Quill.import('delta');
  // Your code here
  var quillEditor = new Quill('#editor', {
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        ['image', 'code-block']
      ]
    },
    theme: 'snow'
  });

  function editPost() {
    $("#submit").attr("disabled", true);
    $("#postLoading").show();
    var description = JSON.stringify(quillEditor.getContents().ops);

    var formData = new FormData();
    /*  for (var i = 0; i < $('input[type=file]')[0].files.length; i++) {
      formData.append('file', $('input[type=file]')[0].files[i]);
    }*/
    for (var i = 0; i < fileList.length; i++) {
      formData.append('file', fileList[i]);
    }
    formData.append('programming', $('#language-choose').val());
    formData.append('question', $("#question").val());
    formData.append('description', description);

    $.ajax({
      url: "/community/post",
      data: formData,
      type: 'POST',
      contentType: false,
      processData: false,
      success: function(data) {
        if(data.auth) {
          window.location.replace(data.url);
        }else{
          if(data.url) {
            window.location.replace(data.url);
          }

          if(data.questionInvalid) {
            console.log("Invalid question");
            $('#invalid-question').attr('hidden', false);
            $("#postLoading").hide();
            $("#submit").attr("disabled", false);
          }
        }
      }
    });
  };

  $('#save-post').on('submit', function(event) {
    event.preventDefault();
    if((quillEditor.getContents().ops).length == 0 || (quillEditor.getContents().ops)[0].insert.trim() == "") {
      $('#description-warning').modal('show');
    }else{
      editPost();
    }
  });

  $('#no-description-submit').click(function(event) {
    editPost();
  });

  var fileList = [];

  var fileUpload = $("#fileUpload")[0];
  $("#fileUpload").on('change', function(event) {
    for (var i = 0; i < fileUpload.files.length; i++) {
      var allowedExts = ['java','py','cpp','dat','txt','html','css','js','zip','jpg','jpeg','png'];
      var fileExt = fileUpload.files[i].name.split('.').pop();
      if (allowedExts.indexOf(fileExt) == -1) {
        $('<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>.' + fileExt + '</strong> file types are not allowed<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>').insertAfter(".mentor-overview hr")
        continue;
      }

      var breakOut = false;
      for (var j = 0; j < fileList.length; j++) {
        if (fileUpload.files[i].name == fileList[j].name) {
          breakOut = true;
          $('<div class="alert alert-danger alert-dismissible fade show" role="alert">A file with the name <strong>' + fileList[i].name + '</strong> already exists<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>').insertAfter(".mentor-overview hr")
          break;
        }
      }

      if (breakOut)
        continue;

      fileList.push(fileUpload.files[i]);
      $("#fileUploadContainer").append(`
        <div class="btn-group mx-1" role="group">
          <button id='${fileUpload.files[i].name}' class='btn btn-secondary fileBtn'>${fileUpload.files[i].name}</button>
          <button class="btn btn-danger deleteFileBtn"><i class="fa fa-trash" aria-hidden="true"></i></button>
        </div>`);
    }

    $("#fileUploadContainer .deleteFileBtn").click(function(event) {
      event.preventDefault();

      for (var i = fileList.length-1; i >= 0; i--) {
        if (fileList[i].name == $(this).siblings(".btn").attr('id')) {
          fileList.splice(i, 1);
          // console.log(fileList);
          break;
        }
      }
      $(this).parent().remove();
      $('#fileUpload').val("");
    });

    $('#fileUploadContainer .fileBtn').click(function(event) {
      event.preventDefault();
    });

    // console.log(fileList);
  });
};
