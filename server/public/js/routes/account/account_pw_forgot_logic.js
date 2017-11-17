$(document).ready(function() {
  //submit form
  $('#forgot-form').submit(function(event){
    event.preventDefault();
    $("#forgot-button").addClass('is-loading');
    $.ajax({
      type: "POST",
      url: "/forgot",
      data: {
        email: $("#email").val()
      }
    }).done(function(data){
      //reset the data
      $("#email").val("");

      if (data.state == "success"){
        successMessage(data.message);
        $("#form_to_hide").hide();
        $("#accept").show();
      }
      else {
        $("#forgot-button").removeClass('is-loading');
        errorMessage(data.message);
      }
    });
  });
});
