var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool

module.exports = {
  handler: handler
}

//handle errors, either send them back json, or redirect the page
function handler(req, res, message, type) {

  //send back to POST methods (not GET)
  if (type != undefined && req.method == "POST" && req.path != "/login"  && req.path != "/signup"){
    var type = "json";
  }

  switch (type){
    case "api":
      console.log("API ERROR: " + message);
      res.sendStatus(404);
      break;
    //send direct message or redirect page
    case "json":
      console.log("JSON ERROR: " + message);
      res.send({
        state: "error",
        message: message
      });
      break;
    //redirect page
    default:
      var redirectTo = req.header("Referer") || "/login";
      req.session.message = message;

      switch (message){
        case "Invalid user!":
        case "Invalid password!":
        case "Missing credentials!":
          req.session.message = "Invalid username / password!";
          break;
        case "Invalid user / rental!":
          req.session.message = "Invalid rental!";
        case "Invalid rental!":
          var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        case "No rental information!":
        case "Invalid rental / listing!":
        case "Invalid rental owner!":
        case "Invalid domain name for rental!":
          redirectTo = RemoveLastDirectoryPartOf(req.path);
          break;
        case "Cannot activate through URL!":
        case "Invalid stripe token!":
          redirectTo = "/profile";
          break;
        case "Invalid rental data!":
          redirectTo = req.path;
          break;
        case "Invalid listing!":
        case "Invalid domain name!":
        case "Invalid listing activation!":
        case "DNS error!":
          delete req.session.message;
          redirectTo = "/nothinghere";
          break;
        case "Signup error!":
        case "Invalid price!":
        default:
          break;
      }

      console.log("ERROR: " + message + " Sending back to " + redirectTo + " | Requested " + req.originalUrl);
      res.redirect(redirectTo);
      break;
  }
}

//helper function to remove last part of URL
function RemoveLastDirectoryPartOf(the_url){
    var the_arr = the_url.split('/');
    the_arr.pop();
    return( the_arr.join('/') );
}
