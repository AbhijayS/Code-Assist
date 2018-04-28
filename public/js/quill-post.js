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
    var programming = $('#language-choose').val();
    console.log("Programming Language: " + programming);

    var data = {
      programming: programming,
      question: $("input[name=question]").val(),
      description: description,
    };

    console.log(data.description);
    console.log("Object Created");
    console.log("Object Type: " + typeof data.description);

    $.post("/community/post", data, function(data) {
      console.log("Data sent");
      console.log(data);
      window.location.replace("/community");
    });
  });
};
