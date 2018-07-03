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
});
