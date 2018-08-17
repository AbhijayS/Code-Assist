window.onload = function() {
  const bronze = {
    color: "#d06f10",
    html: `<i class="fas fa-medal"></i>`
  };
  const silver = {
    color: "#9e9e9e",
    html: `<i class="fas fa-award"></i>`
  };
  const gold = {
    color: "#ffc107",
    html: `<i class="fas fa-trophy"></i>`
  };
  const platinum = {
    color: "#007bff",
    html: `<i class="fas fa-user-tie"></i>`
  };

  function setElementColor(element, color) {
    element.css({'color': color});
  }

  function displayElement(element) {
    element.show();
    element.attr('hidden', false);
  }

  function updateTimestamps() {
    // Date Modifications
    $('.moment-timestamp').each(function() {
      var timestamp = new Date($(this).text());
      timestamp = moment(timestamp, "MM-DD");
      $(this).text(timestamp.format("MMM D"));
      $(this).show();
    });
  }
  updateTimestamps();

  function updateRanks() {
    $('.prize').each(function() {
      var text = $(this).text();
      if(text == "bronze") {

        $(this).html(bronze.html);
        setElementColor($(this), bronze.color);
        displayElement($(this));

      }else if(text == "silver"){

        $(this).html(silver.html);
        setElementColor($(this), silver.color);
        displayElement($(this));

      }else if(text == "gold") {

        $(this).html(gold.html);
        setElementColor($(this), gold.color);
        displayElement($(this));

      }else if(text == "platinum") {

        $(this).html(platinum.html);
        setElementColor($(this), platinum.color)
        displayElement($(this));

      }
    });
  }
  updateRanks();
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

  function addPosts(postsToAdd) {
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
      var likeCount = postsToAdd[i].likeCount;
      if (!likeCount)
        likeCount = "";

      var timestamp = new Date(postsToAdd[i].timestamp);
      timestamp = moment(timestamp, "MM-DD");
      timestamp = timestamp.format("MMM D");
      // console.log(timestamp);

      var newPost = `
      <li id="${id}" class="list-group-item lead" style="font-weight: 400;">

        <div class="d-flex mb-2" style="font-size: 16px;">
          <a href="/users/profile/${author._id}"><div class="profile-pic" style="background-image: url(${author.pic});"></div></a>
          <div class="ml-2">
            <p class="m-0"><span class="prize" hidden>${author.qualities.rank}</span> ${author.username}</p>
            <span class="text-muted">asked <span class="moment-timestamp" style="display: none;">${timestamp}</span></span>
          </div>
        </div>

        <a class="breakWord mb-4" href="/community/${id}" style="font-size: 20px;">${question}</a>
        <br>
        <p class="breakWord quill-content text-muted">${description}</p>
        <div class="ml-auto text-right">
          <button class="btn btn-outline-secondary badge-pill p-0 px-2"><span class="badge badge-pill">${likeCount} <i class="far fa-thumbs-up"></i></span></button>
          <span class="badge badge-warning badge-pill">${answers} Answers</span>
          <span class="badge badge-primary badge-pill">${lang}</span>
        </div>
      </li>`
      postsContainer.append(newPost);
    }

    updateTimestamps();
    updateRanks();
  }

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
      addPosts(data.postsToAdd);
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
          addPosts(data.postsToAdd);
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
        addPosts(postsToAdd);
      }
      // $('#m').val('');
    });
  });

  $(".likeBtn").click(function() {
    if ($(this).hasClass("btn-outline-secondary")) {
      $(this).addClass("btn-success");
      $(this).removeClass("btn-outline-secondary");

      var likeCount = Number($(this).find(".likeCount").text());
      $(this).find(".likeCount").text(likeCount + 1);
    } else {
      $(this).addClass("btn-outline-secondary");
      $(this).removeClass("btn-success");

      var likeCount = Number($(this).find(".likeCount").text());
      if (likeCount - 1 > 0)
        $(this).find(".likeCount").text(likeCount - 1);
      else
        $(this).find(".likeCount").text("");
    }

    var id = $(this).parents(".post").attr("id");
    $.post('/community/like', {type: "post", id: id, postID: id}, function(data) {
      if (data.url) {
        window.location.replace(data.url);
      }
    });
  });
};
