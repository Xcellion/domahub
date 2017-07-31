$(document).ready(function() {
  if (auto_redirect){
    redirectDelay(redirect);
  }
});

//redirect after a short delay
function redirectDelay(path){
  var seconds = 3;

  //add a period every second
  window.setInterval(function(){
    seconds--;
    $("#message").text($("#message").text().trim() + ".");

    //redirect after 3 seconds
    if (seconds == 0){
      window.location.href = path;
    }
  }, 1000);
}
