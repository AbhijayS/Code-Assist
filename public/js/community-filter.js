window.onload = function(){
  // Date Modifications
  $('.moment-timestamp').each(function() {

    var timestamp = new Date($(this).text());
    timestamp = moment(timestamp, "MM-DD");
    $(this).text(timestamp.format("MMM D"));
    $(this).show();
  });
  // 
  // function updateQuillContent() {
  //   /* All of the Answers Viewer (Quill) */
  //   var posts = $('.quill-content');
  //   for (var i = 0; i < posts.length; i++)
  //   {
  //     var post = $(posts[i]);
  //     var contents = JSON.parse(post.text());
  //     console.log(contents);
  //
  //     var quill = new Quill(posts[i], {
  //       modules: {
  //         toolbar: false
  //       },
  //       theme: 'snow'
  //     });
  //     quill.setContents();
  //     quill.disable();
  //     console.log(quill.getText());
  //     post.removeClass('d-none');
  //   }
  // }
  // updateQuillContent();

  $("#getMorePosts").click(function() {
    var data = {
      lastPostID: $("#all-post-container .list-group-item").last().attr('id'),
      filter_opt: currentFilter,
      search: lastSearch
    };
    $.post('/community/morePosts', data, function(data) {
      // console.log(data);
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
        var description = postsToAdd[i].descriptionPreview;
        var likeCount = postsToAdd[i].likeCount;
        if (!likeCount)
          likeCount = "";

        var timestamp = new Date(postsToAdd[i].timestamp);
        timestamp = moment(timestamp, "MM-DD");
        timestamp = timestamp.format("MMM D");
        // console.log(timestamp);

        var newPost = `
        <li id="${id}" class="list-group-item list-group-item-action lead" style="font-weight: 400;">
          <div style="font-size: 16px;" class="d-none d-sm-block">
            <p class="text-gray pt-2 my-0">asked <span class="moment-timestamp">${timestamp}</span> ${author}</p>
          </div>

          <a href="/community/${id}">${question}</a>
          <p class="w-100">${description}</p>
          <div class="ml-auto text-right">
            <button class="btn btn-outline-secondary badge-pill p-0 px-2"><span class="badge badge-pill">${likeCount}<i class="far fa-thumbs-up"></i></span></button>
            <span class="badge badge-warning badge-pill">${answers} Answers</span>
            <span class="badge badge-primary badge-pill">${lang}</span>
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
      filter_opt: value,
      search: lastSearch
    };

    if (value != "Remove Filter")
      $("#dropdownMenuLink").text(value);
    else
      $("#dropdownMenuLink").text("Filter By");

    $("#filterLoading").show();
    $.post('/community/filter', data, function(data) {
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
            var description = postsToAdd[i].descriptionPreview;
            var likeCount = postsToAdd[i].likeCount;
            if (!likeCount)
              likeCount = "";

            var timestamp = new Date(postsToAdd[i].timestamp);
            timestamp = moment(timestamp, "MM-DD");
            timestamp = timestamp.format("MMM D");
            // console.log(timestamp);

            var newPost = `
            <li id="${id}" class="list-group-item list-group-item-action lead" style="font-weight: 400;">
              <div style="font-size: 16px;" class="d-none d-sm-block">
                <p class="text-gray pt-2 my-0">asked <span class="moment-timestamp">${timestamp}</span> ${author}</p>
              </div>

              <a href="/community/${id}">${question}</a>
              <p class="w-100">${description}</p>
              <div class="ml-auto text-right">
                <button class="btn btn-outline-secondary badge-pill p-0 px-2"><span class="badge badge-pill">${likeCount}<i class="far fa-thumbs-up"></i></span></button>
                <span class="badge badge-warning badge-pill">${answers} Answers</span>
                <span class="badge badge-primary badge-pill">${lang}</span>
              </div>
            </li>`;

            postsContainer.append(newPost);
          }

        }
      }
      $("#filterLoading").hide();
    });
  });

  var lastSearch = null;
  $('#search-bar').submit(function(event){
    event.preventDefault();
    var key = $("#m").val();
    lastSearch = key;
    $.post("/community/Search",{search:key, filter_opt: currentFilter},function(data){
      var postsContainer = $('#all-posts');
      postsContainer.empty();
      var postsToAdd = data.postsToAdd;

      if (!data.morePostsAvailable) {
        $("#getMorePosts").attr("disabled", true);
      } else {
        $("#getMorePosts").attr("disabled", false);
      }

      if(postsToAdd.length == 0)
      {
        var alert = `
        <div class="alert alert-info">
          <h2>No posts found matching <span style="text-decoration: underline;">${key}</span>!</h2>
        </div>
        `;
        postsContainer.append(alert);
      }else{
        for(var i = 0; i < postsToAdd.length; i++)
        {
          var id = postsToAdd[i]._id;
          var question = postsToAdd[i].question;
          var answers = postsToAdd[i].answers.length;
          var author = postsToAdd[i].author;
          var lang = postsToAdd[i].prog_lang;
          var description = postsToAdd[i].descriptionPreview;
          var likeCount = postsToAdd[i].likeCount;
          if (!likeCount)
            likeCount = "";
          var timestamp = new Date(postsToAdd[i].timestamp);
          timestamp = moment(timestamp, "MM-DD");
          timestamp = timestamp.format("MMM D");

          var newPost = `
          <li id="${id}" class="list-group-item list-group-item-action lead" style="font-weight: 400;">
            <div style="font-size: 16px;" class="d-none d-sm-block">
              <p class="text-gray pt-2 my-0">asked <span class="moment-timestamp">${timestamp}</span> ${author}</p>
            </div>

            <a href="/community/${id}">${question}</a>
            <p class="w-100">${description}</p>
            <div class="ml-auto text-right">
              <button class="btn btn-outline-secondary badge-pill p-0 px-2"><span class="badge badge-pill">${likeCount}<i class="far fa-thumbs-up"></i></span></button>
              <span class="badge badge-warning badge-pill">${answers} Answers</span>
              <span class="badge badge-primary badge-pill">${lang}</span>
            </div>
          </li>`;

          postsContainer.append(newPost);
        }
      }
      // $('#m').val('');
    });
  });
};
