$(document).ready(function() {

$('#login_modal').click(function() {
  $('#modal_login').addClass('is-active');
});

$('.modal-close').click(function() {
  $('#modal_login').removeClass('is-active');
});

$('.modal-background').click(function() {
  $('#modal_login').removeClass('is-active');
});


});
