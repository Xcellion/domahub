var main = function() {

  $('#login').leanModal({
    top: 100,
    overlay: 0.7,
    closeButton: ".modal_close"
  });

		// // Going back to Social Forms
		// $(".back_btn").click(function() {
		// 		$(".user_login").hide();
		// 		$(".user_register").hide();
		// 		$(".social_login").show();
		// 		$(".header_title").text('Login');
		// 		return false;
		// });

};

$(function() {
  // Calling Login Form
  $("#login_link").click(function() {
      $("#register_form").hide();
      $("#login_form").show();
      return false;
  });

  // Calling Register Form
  $("#register_link").click(function() {
      $("#login_form").hide();
      $("#register_form").show();
      return false;
  });
});

$(document).ready(main);
