$(document).ready(function() {

  $(".delete").click(function() {
    $(this).parent().hide(200, function() {
      $(this).remove();
    });
  });

  

});
