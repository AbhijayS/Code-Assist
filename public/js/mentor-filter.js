window.onload = function(){
  $('.moment-timestamp').each(function() {
    var timestamp = new Date($(this).text());
    timestamp = moment(timestamp, "MM-DD");
    $(this).text(timestamp.format("MMM D"));
    $(this).show();
  });

  $("#getMorePosts").click(function() {
    var data = {
      lastPostID: $("#all-post-container .list-group-item").last().attr('id'),
      filter_opt: currentFilter
    };
    $.post('/mentor/morePosts', data, function(data) {
      console.log(data);
      if (!data.morePostsAvailable) {
        $("#getMorePosts").attr("disabled", true);
      } else {
        $("#getMorePosts").attr("disabled", false);
      }
      var postsContainer = $('#all-posts');
      var postsToAdd = data.postsToAdd;
      for(var i = 0; i < postsToAdd.length; i++)
      {
        var id = postsToAdd[i]._id;
        var question = postsToAdd[i].question;
        var answers = postsToAdd[i].answers.length;
        var author = postsToAdd[i].author;
        var lang = postsToAdd[i].prog_lang;
        // console.log(lang);
        var description = postsToAdd[i].description;
        var assignedMentor = postsToAdd[i].assignedMentor;
        if(assignedMentor)
          assignedMentor = assignedMentor.username;
        var assignedToSelf = postsToAdd[i].assignedToSelf;

        var timestamp = new Date(postsToAdd[i].timestamp);
        timestamp = moment(timestamp, "MM-DD");
        timestamp = timestamp.format("MMM D");
        console.log(timestamp);
        var userIsMentor = data.userIsMentor;

        var newPost = `
        <li id="${id}" class="list-group-item list-group-item-action lead" style="font-weight: 400;">
          <div style="font-size: 16px;" class="d-none d-sm-block">
            <p class="text-gray pt-2 my-0">asked <span class="moment-timestamp">${timestamp}</span> ${author}</p>
          </div>

          <a href="/mentor/${id}">${question}</a>
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
    });
  });

  var currentFilter = null;
  $('.filter').on('click', function(event) {
    event.preventDefault();
    var value = $(this).text();
    currentFilter = value;
    var data = {
      filter_opt: value
    };

    if (value != "Remove Filter")
      $("#dropdownMenuLink").text(value);
    else
      $("#dropdownMenuLink").text("Filter By");

    $("#filterLoading").show();
    $.post('/mentor/filter', data, function(data) {
      if(data.url)
      {
        window.location.replace(url);
      }else{
        if (!data.morePostsAvailable) {
          $("#getMorePosts").attr("disabled", true);
        } else {
          $("#getMorePosts").attr("disabled", false);
        }

        $('#all-posts').empty()
        var postsContainer = $('#all-posts');
        if(data.postsToAdd.length == 0)
        {
          var alert = `
          <div class="alert alert-info">
            <h2>No posts found matching <span style="text-decoration: underline;">${value}</span>!</h2>
          </div>
          `;
          postsContainer.append(alert);
        }else{
          var postsToAdd = data.postsToAdd;
          for(var i = 0; i < postsToAdd.length; i++)
          {
            var id = postsToAdd[i]._id;
            var question = postsToAdd[i].question;
            var answers = postsToAdd[i].answers.length;
            var author = postsToAdd[i].author;
            var lang = postsToAdd[i].prog_lang;
            // console.log(lang);
            var description = postsToAdd[i].description;
            var assignedMentor = postsToAdd[i].assignedMentor;
            if(assignedMentor)
              assignedMentor = assignedMentor.username;
            var assignedToSelf = postsToAdd[i].assignedToSelf;

            var timestamp = new Date(postsToAdd[i].timestamp);
            timestamp = moment(timestamp, "MM-DD");
            timestamp = timestamp.format("MMM D");
            // console.log(timestamp);
            var userIsMentor = data.userIsMentor;

            var newPost = `
            <li id="${id}" class="list-group-item list-group-item-action lead" style="font-weight: 400;">
              <div style="font-size: 16px;" class="d-none d-sm-block">
                <p class="text-gray pt-2 my-0">asked <span class="moment-timestamp">${timestamp}</span> ${author}</p>
              </div>

              <a href="/mentor/${id}">${question}</a>
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
