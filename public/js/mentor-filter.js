var currentFilter = null;
window.addEventListener('load', function() {
  $('.filter').on('click', function(event) {
    event.preventDefault();
    var value = $(this).text();
    currentFilter = value;
    // console.log('filter button clicked: '+ value);
    var data = {
      filter_opt: value
    };

    $("#filterLoading").show();
    $.post('/mentor/history/filter', data, function(data) {
      if(data.url)
      {
        window.location.replace(url);
      } else {
        if (!data.morePostsAvailable) {
          $("#getMorePosts").attr("disabled", true);
        } else {
          $("#getMorePosts").attr("disabled", false);
        }

        // console.log("Filter request returned:", data);
        $('#all-posts').empty()
        if(data.postsToAdd.length == 0)
        {
          var alert = `
          <div class="alert alert-info">
            <h2>No posts found matching <span style="text-decoration: underline;">${value}</span>!</h2>
          </div>
          `;
          $('#all-posts').append(alert);
        } else {
          for (var i = 0; i < data.postsToAdd.length; i++) {
            var post = data.postsToAdd[i];
            var postHTML = `<a id="${post._id}" class="list-group-item" href="/mentor/history/${post._id}">${post.question}
                      <span class="badge progress-bar-danger">${post.answers.length}</span> 
                      <span class="badge">${post.author}</span>
                      <span class="badge progress-bar-info">${post.prog_lang}</span>`;
            if (data.userIsMentor) {
              if (post.assignedMentor) {
                if (post.assignedToSelf) {
                  postHTML += '<span class="badge progress-bar-success">Assigned to you</span>';
                } else {
                  postHTML += '<span class="badge progress-bar-warning">Assigned to ' + post.assignedMentor.username + '</span>';
                }
              } else {
                postHTML += '<span class="badge progress-bar-danger">Post Unassigned</span>';
              }
            }
            postHTML += '</a>';
            $("#all-posts").append(postHTML);
          }

        }
      }
      $("#filterLoading").hide();
    });
  });
});
