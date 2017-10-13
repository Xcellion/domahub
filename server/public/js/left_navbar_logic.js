$(document).ready(function() {
  //mobile view nav menu
  $(".nav-toggle").on("click", function() {
    $(this).toggleClass("is-active");
    $(".nav-menu").toggleClass("is-active");
  });

  //close user dropdown menu on click outside the element
  $(document).on("click", function(event) {
    if (!$(event.target).closest("#user-dropdown-button").length) {
      if ($(".user-dropdown-menu").is(":visible")) {
        $(".user-dropdown-menu").addClass("is-hidden");
        $("#user-dropdown-button").toggleClass("is-active").blur();
      }
    }
  });

  //toggle user drop down menu on icon button click
  $("#user-dropdown-button").on("click", function() {
    $(this).toggleClass("is-active");
    $(".user-dropdown-menu").toggleClass("is-hidden");
  });

  $(document).keyup(function(e) {
    if (e.which == 27) {
      $('#modal-login').removeClass('is-active');
    }
  });
});
