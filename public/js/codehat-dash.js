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
    // console.log('clicked');
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
      <a class="dropdown-item" href="#">
      <i class="fas fa-plus-circle"></i>
      <span> Create New Project</span>
      </a>
    </div>
    `);
  // Context Menu
  $( "#projects .flex-container" ).contextmenu(function(e) {

    e.preventDefault();
    contextMenu.css({
      "top": e.pageY + "px",
      "left": e.pageX + "px"
    });

    $('#projects').append(contextMenu);
  });

  $(window).click(function() {
    contextMenu.remove();
  });
};
