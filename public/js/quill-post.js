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

    var data = {
      programming: $('#language-choose').val(),
      question: $("input[name=question]").val(),
      description: description,
    };

    // console.log(data.description);
    // console.log("Object Created");
    // console.log("Object Type: " + typeof data.description);

    $.post("/community/post", data).done(function(resData) {
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
    });
  });
};
