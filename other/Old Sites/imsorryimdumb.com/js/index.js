/* $(document).ready(function() {
  $.when(
    $("body").load("http://localhost:8080/rental_info/" + window.location.hostname, function(data){
      if (data.location){window.location = data.location;}
    }),
    $.getScript("http://localhost:8080/reset/content-tools/editor.js"),
    $.getScript("http://localhost:8080/reset/content-tools/content-tools.min.js"),
    $.getScript("http://localhost:8080/reset/content-tools/content-tools.js")
  );
}); */

$(document).ready(function() {
  $("body").load("http://www.w3bbi.com/rental_info/" + window.location.hostname, function(data){
    if (data.location){window.location = data.location;}
  });
});

//sends the ajax for data needed to update the page
function sendAjax(rentalID){
  rental_id = rentalID || "";

  $.when(
    //$("body").load("http://localhost:8080/rental_info/" + window.location.hostname + "/" + rental_id)
    $("body").load("http://www.w3bbi.com/rental_info/" + window.location.hostname + "/" + rental_id)
  );
}

//home button
$(document).on("click", "#home_button", function(e){
  sendAjax();
});

//faq button
$(document).on("click", "#faq_button, #about_button", function(e){
  sendAjax(1);
});

//example1 button
$(document).on("click", "#example1_button", function(e){
  sendAjax(2);
});

//example2 button
$(document).on("click", "#example2_button", function(e){
  sendAjax(3);
});
