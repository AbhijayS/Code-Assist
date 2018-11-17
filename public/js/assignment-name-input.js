$("#is-assignment").change(function() {
  if ($(this).val() == "No") {
    $("#assignment-div").hide();
    $("#assignment-custom-div").hide();
  } else {
    if ($("#assignment").val() == "Other") {
      $("#assignment-custom-div").show();
    } else {
      $("#assignment-custom-div").hide();
      $("#assignment-custom").val('');
    }

    $("#assignment-div").show();
  }
});

$("#assignment").change(function() {
  if ($(this).val() == "Other") {
    $("#assignment-custom-div").show();
  } else {
    $("#assignment-custom-div").hide();
    $("#assignment-custom").val('');
  }
});
