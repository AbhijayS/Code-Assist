window.onload = function(){
  var answerEditor = new Quill('#answer-editor', {
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
    var answer = JSON.stringify(answerEditor.getContents().ops);

    $.post("/" + {{post.id}} + "/answer", {answer: answer}, function(answer) {
      console.log("Answer Saved");
      var newAnswer = `
      <a class="list-group-item list-group-item-action flex-column align-items-start">
      <div class="d-flex w-100 justify-content-between">
      <small>{{answer.author}}</small>
      </div>
      <p class="mb-1">{{{answer.answer}}}</p>
      <small>{{answer.timestamp}}</small>
      </a>
      `;

      $("#descriptions_answers").append(newAnswer);
    });
  });
};
