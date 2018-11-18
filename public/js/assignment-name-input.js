$("#is_assignment").change(function() {
  if ($(this).val() == "No") {
    $("#assignment-div").hide();
    $("#assignment-custom-div").hide();
    $("#assignment_custom").prop('required', false);
  } else {
    if ($("#assignment").val() == "Other") {
      $("#assignment-custom-div").show();
      $("#assignment_custom").prop('required', true);
    } else {
      $("#assignment-custom-div").hide();
      $("#assignment_custom").val('');
      $("#assignment_custom").prop('required', false);
    }

    $("#assignment-div").show();
  }
});

$("#assignment").change(function() {
  if ($(this).val() == "Other") {
    $("#assignment-custom-div").show();
    $("#assignment_custom").prop('required', true);
  } else {
    $("#assignment-custom-div").hide();
    $("#assignment_custom").val('');
    $("#assignment_custom").prop('required', false);
  }
});
