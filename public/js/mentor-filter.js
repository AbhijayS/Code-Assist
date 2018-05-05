window.onload = function(){
  $('.filter').on('click', function(event) {
    event.preventDefault();
    var value = $(this).text();
    console.log('filter button clicked: '+ value);
    var data = {
      filter_opt: value
    };

    $("#filterLoading").show();
    $.post('/mentor/history/filter', data, function(data) {
      if(data.url)
      {
        window.location.replace(url);
      }else{
        console.log("Filter request returned: " + data);
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
            var newPost = `
            <a class="list-group-item" href="/community/${id}">${question} <span class="badge progress-bar-danger">${answers}</span> <span class="badge">${author}</span> <span class="badge progress-bar-info">${lang}</span> </a>
            `;
            postsContainer.append(newPost);
          }

        }
      }
      $("#filterLoading").hide();
    });
  });
};
