$(document).ready(function() {
  $('#code-editor').css({
    'margin-left' : $('#sidebar').width()
  });

  $('#add-more-emails').click(function() {
    var addEmail = $(`
      <div class="row mb-2">
        <div class="col-sm-1">
          <button type="button" class="close mt-2 mx-auto" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="col-sm-10">
          <input type="email" class="form-control" name="emailInput" aria-describedby="emailHelp" placeholder="Enter email">
          <div class="text-danger invalid-feedback">
            Member with this email could not be found
          </div>
        </div>
      </div>
      `);
    addEmail.insertBefore('#settings #send-options');

    $('#settings .close').click(function() {
      console.log('clicked');
      $(this).parent().parent().remove();
    });
  });

  $('#close-settings').click(function() {
    $('#settings').hide();
    $(this).hide();
  });

  $('#settings-btn').click(function() {
    $('#settings').show();
    $('#close-settings').show();
  });

  $('#share-project').submit(function(event) {
    event.preventDefault();
    var form = $(this);
    var toSend = [];
    for(var i = 0; i < form.find("input[name=emailInput]").length; i++) {
      toSend.push($(form.find("input[name=emailInput]")[i]).val());
    }
    console.log(window.location.pathname.split('/')[2]);
    $.post('/codehat/share', {emailInput: toSend, projectID: window.location.pathname.split('/')[2]}, function(data){
      if(data.length == 0) {
        console.log("Success");
        if($('#settings #emailsSent').hasClass('hide'))
          $('#settings #emailsSent').toggleClass('hide');

      }else{
        for(var i = 0; i < data.length; i++) {
          console.log(data[i]);
          var temp = data[i];
          $(form.find("input[name=emailInput]").get(toSend.indexOf(temp))).addClass('is-invalid');
        }
      }
    });

  })
});
