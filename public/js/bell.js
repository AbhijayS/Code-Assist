$(document).ready(function() {
  $('#bell').on('show.bs.dropdown', function () {
    if ($("#unread-icon").is(":visible")) {
      $("#unread-icon").hide();
      $.post('/read-notifications');
    }
  });
  $('#bell').on('hidden.bs.dropdown', function () {
    if ($("#unread-icon").is(":visible")) {
      $("#unread-icon").hide();
      $.post('/read-notifications');
    }
  });
});
