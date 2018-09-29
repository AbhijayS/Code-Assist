$(document).ready(function() {
  $('#bell').on('shown.bs.dropdown', function () {
    console.log("shown");
  });
   $('#bell').on('hidden.bs.dropdown', function () {
    console.log("hidden");
  });
});
