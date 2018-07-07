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

  $('.createNewProject').submit(function(event) {
    var form = $(this);
    event.preventDefault();
    console.log('clicked');
    $.post('/codehat/', {project_name: $(this).find('input').val()}, function(data){
      if(data.auth) {
        window.location.replace(data.url);
      }else{
        if(data.url == '') {
          // console.log(data.message);
          form.find('input').toggleClass(data.message);
        }else {
          window.location.replace(data.url);
        }
      }
    });
  });

  // Date Modifications
  $('.date-modified').each(function() {

    var timestamp = new Date($(this).find('.moment-timestamp').text());
    console.log(timestamp);
    timestamp = moment(timestamp, "MM-DD");
    $(this).find('.moment-timestamp').text(timestamp.format("MMM D"));
  });


  // Display project info
  $('#projects .card').mouseover(function() {
    // $(this).find('.card-footer .project-info').removeClass('hide');
    $(this).find('.card-footer .project-info').show();
    $(this).find('.card-body').toggleClass('py-0');
  });

  $('#projects .card').mouseout(function() {
    $(this).find('.card-footer .project-info').hide();
    $(this).find('.card-body').toggleClass('py-0');
  });


  var contextMenu = $(`
    <div class="dropdown-menu">
      <a class="dropdown-item toggle">
        <i class="fas fa-plus-circle"></i>
        <span> Create New Project</span>
      </a>

      <a class="dropdown-item hide">
        <form class="createNewProject">
          <div class="form-group">
            <input type="text" class="form-control" id="exampleInputEmail1" placeholder="Project name">
            <div class="text-danger invalid-feedback">
              Project with this name already exists
            </div>
          </div>
          <button type="submit" name="button" class="btn btn-primary btn-block">Create Project</button>
        </form>
      </a>
    </div>
    `);
  // Context Menu
  $( "#projects" ).contextmenu(function(e) {

    e.preventDefault();
    contextMenu.css({
      "top": e.pageY + "px",
      "left": e.pageX + "px"
    });
    $('#projects').append(contextMenu);
  });

  $(window).click(function(event) {
    var target = $(event.target);
    if(!(target.is(contextMenu) || contextMenu.has(target).length)) {
      contextMenu.find('a').last().attr("class", "dropdown-item hide");
      contextMenu.remove();
    }else{
      if(target.is(contextMenu.find('.toggle')) || target.parent().is(contextMenu.find('.toggle'))) {
        contextMenu.find('a').last().toggleClass('hide');
      }else if(target.is(contextMenu.find('button'))) {
        event.preventDefault();
        $.post('/codehat/', {project_name: contextMenu.find('input').val()}, function(data){
          if(data.auth) {
            window.location.replace(data.url);
          }else{
            if(data.url == '') {
              // console.log(data.message);
              contextMenu.find('input').toggleClass(data.message);
            }else {
              window.location.replace(data.url);
            }
          }
        });
      }
    }
  });

  // $(window).click(function(event) {
  //   var item = $(event.target);
  //   if(item.hasClass('dropdown-menu') || item.parent().hasClass('dropdown-menu') || item.parent().parent().hasClass('dropdown-menu') || item.parent().parent().parent().hasClass('dropdown-menu'))
  //   {
  //     if(item.parent().hasClass('dropdown-menu') && item.parent().children().length == 1) {
  //       contextMenu.append($(`
  //         <a class="dropdown-item" href="#">
  //         <form class="createNewProject">
  //         <div class="form-group">
  //         <input type="text" class="form-control" id="exampleInputEmail1" placeholder="Project name">
  //         </div>
  //         <button type="submit" name="button" class="btn btn-primary btn-block">Create Project</button>
  //         </form>
  //         </a>
  //         `));
  //         console.log(contextMenu);
  //       }else{
  //         contextMenu.find('a').last().remove();
  //       }
  //   }else{
  //     console.log("OUT");
  //     if(item.)
  //     contextMenu.remove();
  //   }
  // });
};
