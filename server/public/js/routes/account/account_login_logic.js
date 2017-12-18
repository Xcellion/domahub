$(document).ready(function() {

  //display message from the server
  loadNotification();

  //if remember me is set in the cookie
  var remember_cookie = readCookie("remember");
  if (remember_cookie){
    $("#remember-checkbox").prop("checked", true);
    $("#email").val(remember_cookie);
  }

  //remember me check box
  $("#remember-checkbox").on("click", function(){
    rememberAccount($(this).is(":checked"));
  });

  //to catch empty emails or empty passwords
  $('#login-form').on("submit", function(event){

    //re-set cookie for remember
    rememberAccount($("#remember-checkbox").is(":checked"));
    $("#login-button").addClass('is-loading');
  });

});

//helper function to remember cookie
function rememberAccount(bool){
  if (bool){
    bakeCookie("remember", $("#email").val())
  }
  else {
    deleteCookie("remember");
  }
}

//helper function to make cookie
function bakeCookie(name, value) {
  var cookie = [name, '=', JSON.stringify(value), '; path=/;'].join('');
  document.cookie = cookie;
}

//helper function to read a cookie
function readCookie(name) {
  var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
  result && (result = JSON.parse(result[1]));
  return result;
}

//helper function to delete a cookie
function deleteCookie(name) {
  //document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
  document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT', '; path=/;'].join('');
}
