$(document).ready(function() {

$('#login_modal').leanModal({
  top: 250,
  overlay: 0.7,
  closeButton: ".modal_close"
});

$('.nav_link').hover(function() {
  $(this).addClass('hover_navLink');
}, function() {
  $(this).removeClass('hover_navLink');
});

});
