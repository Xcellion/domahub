$(document).ready(function() {

$('#login_modal').leanModal({
  top: 100,
  overlay: 0.7,
  closeButton: ".modal_close"
});

$('.nav-button').hover(function() {
  $(this).addClass('hover_navDiv');
  $(this).find('a').css('color', '#FF8751');
}, function() {
  $(this).removeClass('hover_navDiv');
  $(this).find('a').css('color', '#eeeeee');
});

});
