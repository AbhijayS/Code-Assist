$("#is-assignment").change(function() {
  if ($(this).val() == "No") {
    $("#assignment-div").hide();
    $("#assignment-custom-div").hide();
    $("#assignment-custom").prop('required', false);
  } else {
    if ($("#assignment").val() == "Other") {
      $("#assignment-custom-div").show();
      $("#assignment-custom").prop('required', true);
    } else {
      $("#assignment-custom-div").hide();
      $("#assignment-custom").val('');
      $("#assignment-custom").prop('required', false);
    }

    $("#assignment-div").show();
  }
});

$("#assignment").change(function() {
  if ($(this).val() == "Other") {
    $("#assignment-custom-div").show();
    $("#assignment-custom").prop('required', true);
  } else {
    $("#assignment-custom-div").hide();
    $("#assignment-custom").val('');
    $("#assignment-custom").prop('required', false);
  }
});
