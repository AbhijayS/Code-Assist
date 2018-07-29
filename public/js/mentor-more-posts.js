window.addEventListener('load', function() {
	$("#getMorePosts").click(function() {
	    var data = {
	    	lastPostID: $("#all-post-container .list-group-item").last().attr('id'),
	    	filter_opt: currentFilter
	    };
		$.post('/mentor/history/morePosts', data, function(data) {
			// console.log(data);
			if (!data.morePostsAvailable) {
				$("#getMorePosts").attr("disabled", true);
			} else {
				$("#getMorePosts").attr("disabled", false);
			}
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
		});
	});
});