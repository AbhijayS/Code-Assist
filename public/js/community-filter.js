window.onload = function(){
  // Date Modifications
  $('.moment-timestamp').each(function() {

    var timestamp = new Date($(this).text());
    timestamp = moment(timestamp, "MM-DD");
    $(this).text(timestamp.format("MMM D"));
    $(this).show();
  });

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
          var description = data[i].description;
          var timestamp = new Date(data[i].timestamp);
          timestamp = moment(timestamp, "MM-DD");
          timestamp = timestamp.format("MMM D");

          var newPost = `
          <li class="list-group-item list-group-item-action lead" style="font-weight: 400;">
          <div style="font-size: 16px;" class="d-none d-sm-block">
          <p class="text-gray pt-2 my-0">asked <span class="moment-timestamp" style="display: none;">${timestamp}</span> ${author}</p>
          </div>

          <a href="/community/${id}">${question}</a>
          <p>${description}</p>
          <div class="ml-auto text-right">
          <span class="badge badge-warning badge-pill mr-3">${answers} Answers</span>
          <span class="badge badge-primary badge-pill mr-3">${lang}</span>
          </div>
          </li>
          `;

          postsContainer.append(newPost);
        }

      }
      $("#filterLoading").hide();
    });
  });
};
