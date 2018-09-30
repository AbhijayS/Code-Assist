$(document).ready(function() {
  // $('#bell').on('show.bs.dropdown', function () {
  //   $('#bell-menu').append('<a class="dropdown-item" href="/pr">Notification</a>');
  // });
   $('#bell').on('hidden.bs.dropdown', function () {
    console.log("hidden");
  });
});
