window.onload = function() {
  $("#high-school-student").change(function() {
    if ($(this).val() == "No") {
      $("#school-div").hide();
    } else {
      $("#school-div").show();
    }
  });

  $("#school").change(function() {
    if ($(this).val() == "Other") {
      $("#school-name-div").show();
    } else {
      $("#school-name-div").hide();
      $("#schoolCustomInput").val('');
    }

    if ($(this).val())
      $(this).removeClass("is-invalid");
  });
};
