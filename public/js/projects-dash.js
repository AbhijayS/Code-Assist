window.onload =
function() {
  var sidebar = $('#sidebar');
  // var sidebar_expand_width = 350;
  $('#sidebar #create-project').click(function() {
    $('.sidebar-box').width(0);
    $('#sidebar li').not($(this)).removeClass('select');
    $(this).toggleClass('select');
    $('#sidebar .sidebar-box#create-project-box').width() == 0 ? $('#sidebar .sidebar-box#create-project-box').width(350) : $('#sidebar .sidebar-box#create-project-box').width(0);
    $('#projects').css('margin-left') == '75px' ? $('#projects').css({'margin-left' : '350px'}) : $('#projects').css({'margin-left' : '75px'});

  });

  $('#sidebar #global-chat').click(function() {
    $('.sidebar-box').width(0);
    $('#sidebar li').not($(this)).removeClass('select');
    $(this).toggleClass('select');
    $('#projects').css({'margin-left' : '75px'});
    $('#sidebar .sidebar-box#global-chat-box').width() == 0 ? $('#sidebar .sidebar-box#global-chat-box').width('100%') : $('#sidebar .sidebar-box#global-chat-box').width(0);
  });

  function firstLetter() {
    $(this).text($(this).text().substring(0, 1));
  }

  $('.createNewProject').submit(function(event) {
    event.preventDefault();
    var submitForm = $(this);
    $.post('/projects/', {
      project_name: $("#project_name").val(),
      inviteMentor: submitForm.hasClass('mentor-invite'),
      inviteUser: submitForm.hasClass('user-invite'),
      is_assignment: $("#is_assignment").val(),
      assignment: $("#assignment").val(),
      assignment_custom: $("#assignment_custom").val()
    }, function(data){
      if(data.auth) {
        window.location.replace(data.url);
      }else{
        $('#project_name').addClass('is-invalid');
        if(data.url) {
          window.location.replace(data.url);
        }
      }
    });
  });

  // Date Modifications
  $('.date-modified').each(function() {

    var timestamp = new Date($(this).find('.moment-timestamp').text());
    timestamp = moment(timestamp, "MM-DD");
    $(this).find('.moment-timestamp').text(timestamp.format("MMM D"));
  });


  // Display project info
  $('#projects .card').mouseover(function() {
    // $(this).find('.card-footer .project-info').removeClass('hide');
    $(this).find('.card-footer .project-info').show();
    $(this).find('.card-body').addClass('py-0');
  });

  $('#projects .card').mouseout(function() {
    $(this).find('.card-footer .project-info').hide();
    $(this).find('.card-body').removeClass('py-0');
  });


  // var defaultContextMenu = $(`
  //   <div class="dropdown-menu">
  //     <a class="dropdown-item toggle">
  //       <i class="fas fa-plus-circle"></i>
  //       <span> Create New Project</span>
  //     </a>
  //
  //     <a class="dropdown-item hide">
  //       <form class="createNewProject">
  //         <div class="form-group">
  //           <input type="text" class="form-control" placeholder="Project name" autocomplete="off">
  //           <div class="text-danger invalid-feedback">
  //             Project with this name already exists
  //           </div>
  //         </div>
  //         <button type="submit" name="button" class="btn btn-primary btn-block">Create Project</button>
  //       </form>
  //     </a>
  //   </div>
  // `);
  //
  // var projectContextMenu = $(`
  //   <div class="dropdown-menu" id="project-menu">
  //     <a class="dropdown-item toggle" onclick="$('#rename-project').toggleClass('hide');">
  //       Rename Project
  //     </a>
  //     <a id="rename-project" class="dropdown-item hide">
  //       <input type="text" class="form-control" placeholder="New Name" autocomplete="off">
  //     </a>
  //
  //     <hr>
  //     <a class="dropdown-item">
  //       <form class="delete-Project">
  //         <button type="submit" name="button" class="btn btn-danger btn-block">Delete Project</button>
  //       </form>
  //     </a>
  //   </div>
  // `);

//   $( "body" ).contextmenu(function(event) {
//     event.preventDefault();
//   });
//   // Context Menu
//   $( "#projects" ).contextmenu(function(event) {
//     var target = $(event.target);
//     event.preventDefault();
//
//     if(target.is($('.card')) || $('.card').has(target).length) {
//       console.log("Clicked Card");
//       $('.dropdown-menu').remove();
//       projectContextMenu.css({
//         "top": event.pageY + "px",
//         "left": event.pageX + "px"
//       });
//       projectContextMenu.find('#rename-project input').attr('placeholder', target.closest('.card').find('.card-footer .project-name').text().trim());
//       $('#projects').append(projectContextMenu);
//
//       //change project name
//       $('#projects #rename-project input').change(function(){
//         var name = $(this).val();
//         console.log("Name changed: " + name);
//         $.post('/projects/change-project-name', {oldName: target.closest('.card').find('.card-footer .project-name').text().trim(), newName: name}, function(data) {
//           console.log("Server: " + data.message);
//         });
//       });
//     }else{
//       if(!(target.is(defaultContextMenu) || target.is(projectContextMenu) || defaultContextMenu.has(target).length || projectContextMenu.has(target).length))
//       {
//         $('.dropdown-menu').remove();
//         // console.log("Clicked");
//         var viewportWidth = $(window).width();
//         var viewportHeight = $(window).height();
//         var mouseX = event.pageX;
//         var mouseY = event.pageY;
//         var menuWidth = 210;
//         var menuHeight = 150;
//         var menuX = mouseX;
//         var menuY = mouseY;
//
//         if(mouseX+menuWidth >= viewportWidth){
//           menuX = mouseX-menuWidth;
//         }
//         if(mouseY+menuHeight >= viewportHeight){
//           menuY = mouseY-menuHeight;
//         }
//
//         defaultContextMenu.css({
//           "top": menuY + "px",
//           "left": menuX + "px"
//         });
//         $('#projects').append(defaultContextMenu);
//       }
//     }
//   });
//
//   $(window).click(function(event) {
//     var target = $(event.target);
//     if(!(target.is(defaultContextMenu) || target.is(projectContextMenu) || defaultContextMenu.has(target).length || projectContextMenu.has(target).length)) {
//       defaultContextMenu.find('a').last().attr("class", "dropdown-item hide");
//       defaultContextMenu.remove();
//       projectContextMenu.remove();
//     }else{
//       if(target.is(defaultContextMenu.find('.toggle')) || target.parent().is(defaultContextMenu.find('.toggle'))) {
//         defaultContextMenu.find('a').last().toggleClass('hide');
//       }else if(target.is(defaultContextMenu.find('button'))) {
//         event.preventDefault();
//         $.post('/projects/', {project_name: defaultContextMenu.find('input').val()}, function(data){
//           if(data.auth) {
//             window.location.replace(data.url);
//           }else{
//             if(data.url == '') {
//               // console.log(data.message);
//               defaultContextMenu.find('input').toggleClass(data.message);
//             }else {
//               window.location.replace(data.url);
//             }
//           }
//         });
//       }
//     }
//   });
};
