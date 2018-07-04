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
};
