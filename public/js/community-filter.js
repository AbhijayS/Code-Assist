window.onload = function(){
  $('.filter').on('click', function(event) {
    event.preventDefault();
    var value = $(this).text();
    // console.log('filter button clicked: '+ value);
    var data = {
      filter_opt: value
    };

    $("#filterLoading").show();
    $.post('/community/filter', data, function(data) {
      // console.log("Filter request returned: " + data);
      $('#all-posts').empty()
      var postsContainer = $('#all-posts');

      if(data.length == 0)
      {
        var alert = `
        <div class="alert alert-info">
          <h2>No posts found matching <span style="text-decoration: underline;">${value}</span>!</h2>
        </div>
        `;
        postsContainer.append(alert);
      }else{
        for(var i = 0; i < data.length; i++)
        {
          // console.log("Post: " + data[i]);
          var id = data[i]._id;
          var question = data[i].question;
          var answers = data[i].answers.length;
          var author = data[i].author;
          var lang = data[i].prog_lang;
          // var newPost = `
          // <a class="list-group-item" href="/community/${id}">${question} <span class="badge progress-bar-danger">${answers}</span> <span class="badge">${author}</span> <span class="badge progress-bar-info">${lang}</span> </a>
          // `;
          var newPost = `
            <a href="/community/${id}">
            <li class="list-group-item list-group-item-action lead" style="font-weight: 400;">
            ${question}
            <span style="position: absolute; right: 0;">
            <span class="badge badge-warning badge-pill mr-3">${answers} Answers</span>
            <span class="badge badge-primary badge-pill mr-3">${lang}</span>
            </span>

            <div class="">
            <p class="text-gray pt-4 my-0">${author}</p>
            </div>
            </li>
            </a>
          `

          postsContainer.append(newPost);
        }

      }
      $("#filterLoading").hide();
    });
  });
};
