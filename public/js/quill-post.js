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

  $('#submit').on('click', function(event) {
    event.preventDefault();
    console.log('');
    console.log('-------------------------------------');
    console.log('community-post clicked');
    var description = JSON.stringify(quillEditor.getContents().ops);

    var formData = new FormData($('#upload_form')[0]);
    for (var i = 0; i < $('input[type=file]')[0].files.length; i++) {
      formData.append('file', $('input[type=file]')[0].files[i]);
    }
    formData.append('programming', $('#language-choose').val());
    formData.append('question', $("#question").val());
    formData.append('description', description);

/*    var data = {
      programming: $('#language-choose').val(),
      question: $("#question").val(),
      description: description
    };*/

    // console.log(data.description);
    // console.log("Object Created");
    // console.log("Object Type: " + typeof data.description);

    $.ajax({
        url: "/community/post",
        data: formData,
        type: 'POST',
        contentType: false,
        processData: false,
        success: function(resData) {
          $(".alert-danger").hide();
          // console.log(resData);
          if (!resData.questionInvalid && !resData.descriptionInvalid) {
            window.location.replace(resData.url);
          } else {
            if (resData.questionInvalid)
              $("#questionInvalid").show();
            if (resData.descriptionInvalid)
              $("#descriptionInvalid").show();
          }
        }
    });

/*    $.post("/community/post", data).done(function(resData) {
      $(".alert-danger").hide();
      // console.log(resData);
      if (!resData.questionInvalid && !resData.descriptionInvalid) {
        window.location.replace(resData.url);
      } else {
        if (resData.questionInvalid)
          $("#questionInvalid").show();
        if (resData.descriptionInvalid)
          $("#descriptionInvalid").show();
      }
    });*/
  });
};
