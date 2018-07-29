window.onload = function(){
  $('.moment-timestamp').each(function() {
    var timestamp = new Date($(this).text());
    timestamp = moment(timestamp, "MM-DD");
    $(this).text(timestamp.format("MMM D"));
    $(this).show();
  });

  $('.filter').on('click', function(event) {
    event.preventDefault();
    var value = $(this).text();
    var data = {
      filter_opt: value
    };

    $("#filterLoading").show();
    $.post('/mentor/history/filter', data, function(data) {
      if(data.url)
      {
        window.location.replace(url);
      }else{
        $('#all-posts').empty()
        var postsContainer = $('#all-posts');
        var postsReturned = data.posts;
        if(postsReturned.length == 0)
        {
          var alert = `
          <div class="alert alert-info">
            <h2>No posts found matching <span style="text-decoration: underline;">${value}</span>!</h2>
          </div>
          `;
          postsContainer.append(alert);
        }else{
          for(var i = 0; i < postsReturned.length; i++)
          {
            var id = postsReturned[i]._id;
            var question = postsReturned[i].question;
            var answers = postsReturned[i].answers.length;
            var author = postsReturned[i].author;
            var lang = postsReturned[i].prog_lang;
            console.log(lang);
            var description = postsReturned[i].description;
            var assignedMentor = postsReturned[i].assignedMentor;
            if(assignedMentor)
              assignedMentor = assignedMentor.username;
            var assignedToSelf = postsReturned[i].assignedToSelf;

            var timestamp = new Date(postsReturned[i].timestamp);
            timestamp = moment(timestamp, "MM-DD");
            timestamp = timestamp.format("MMM D");
            console.log(timestamp);
            var userIsMentor = data.userIsMentor;

            var newPost = `
            <li class="list-group-item list-group-item-action lead" style="font-weight: 400;">
              <div style="font-size: 16px;" class="d-none d-sm-block">
                <p class="text-gray pt-2 my-0">asked <span class="moment-timestamp">${timestamp}</span> ${author}</p>
              </div>

              <a href="/mentor/history/${id}">${question}</a>
              <p class="w-100">${description}</p>
              <div class="ml-auto text-right">
                <span class="badge badge-warning badge-pill">${answers} Answers</span>
                <span class="badge badge-primary badge-pill">${lang}</span>
                `;

            if(userIsMentor) {
              if(assignedMentor) {
                if(assignedToSelf) {
                  newPost += `<span class="badge badge-info badge-pill">Assigned to you</span>`;
                }else{
                  newPost += `<span class="badge badge-info badge-pill">Assigned to {{this.assignedMentor.username}}</span>`;
                }
              }else{
                newPost += `<span class="badge badge-info badge-pill">Post Unassigned</span>`;
              }
            }
            newPost += `
              </div>
            </li>`;

            postsContainer.append(newPost);
          }

        }
      }
      $("#filterLoading").hide();
    });
  });
};
