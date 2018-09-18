window.onload = function(){
  function updateTimestamps() {
    $('.moment-timestamp').each(function() {
      var timestamp = new Date($(this).text());
      timestamp = moment(timestamp, "MM-DD");
      $(this).text(timestamp.format("MMM D"));
      $(this).show();
    });
  }
  updateTimestamps();

  function addPosts(postsToAdd, userIsMentor) {
    var postsContainer = $('#all-posts');
    for(var i = 0; i < postsToAdd.length; i++)
    {
      var id = postsToAdd[i]._id;
      var question = postsToAdd[i].question;
      var answers = postsToAdd[i].answers.length;
      var author = postsToAdd[i].author;
      var lang = postsToAdd[i].prog_lang;
      // console.log(lang);
      var description = postsToAdd[i].descriptionPreview;
      var assignedMentor = postsToAdd[i].assignedMentor;
      if(assignedMentor)
        assignedMentor = assignedMentor.username;
      var assignedToSelf = postsToAdd[i].assignedToSelf;

      var timestamp = new Date(postsToAdd[i].timestamp);
      timestamp = moment(timestamp, "MM-DD");
      timestamp = timestamp.format("MMM D");

      var newPost = `
      <li id="${id}" class="list-group-item lead" style="font-weight: 400;">
        <div style="position: absolute; top: 5px; right: 5px;">
          <a href="/mentor/post/edit/${id}"><button type="button" name="button" class="utils answer-edit-btn btn btn-outline-primary py-0"><i class="fas fa-pencil-alt"></i></button></a>
        </div>

        <div class="d-flex mb-2" style="font-size: 16px;">
          <a href="/users/profile/${author._id}"><div class="profile-pic" style="background-image: url(${author.pic});"></div></a>
          <div class="ml-2">
            <p class="m-0"><span class="prize" hidden>${author.qualities.rank}</span> ${author.username}</p>
            <span class="text-muted">asked <span class="moment-timestamp" style="display: none;">${timestamp}</span></span>
          </div>
        </div>

        <a class="breakWord mb-4" href="/mentor/${id}" style="font-size: 20px;">${question}</a>
        <br>
        <p class="breakWord quill-content text-muted">${description}</p>
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

    updateTimestamps();
  }

  $("#getMorePosts").click(function() {
    var data = {
      lastPostID: $("#all-post-container .list-group-item").last().attr('id'),
      filter_opt: currentFilter
    };
    $.post('/mentor/morePosts', data, function(data) {
      if (!data.morePostsAvailable) {
        $("#getMorePosts").attr("disabled", true);
      } else {
        $("#getMorePosts").attr("disabled", false);
      }
      addPosts(data.postsToAdd, data.userIsMentor);
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
          addPosts(data.postsToAdd, data.userIsMentor);
        }
      }
      $("#filterLoading").hide();
    });
  });
};
