//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var mailer = require("./mailer.js");

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------ERROR FUNCTIONS-------------------------------

  //handle errors, either send them back json, or redirect the page
  handler: function(req, res, message, type) {

    //send back to POST methods (not GET)
    if (type != undefined && req.method == "POST" && req.path != "/login"  && req.path != "/signup"){
      var type = "json";
    }

    switch (type){
      //send direct message or redirect page
      case "json":
        console.log("\x1b[31m", "JSON ERROR: " + message, '\x1b[0m');
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

          //login errors
          case "Invalid user!":
          case "Invalid password!":
          case "Missing credentials!":
            req.session.message = "Invalid username / password!";
            break;

          //expired token
          case "This token has expired!":
            req.session.message = "This link has expired! Please login again to verify your email address.";
            break;

          //redirect to listing
          case "Invalid rental!":                   //not a number
          case "Invalid domain name for rental!":   //wrong domain for rental
            redirectTo = RemoveLastDirectoryPartOf(req.path);
            break;

          //redirect to nothing
          case "Invalid listing!":                //db error
          case "Invalid domain name!":            //not ascii
            delete req.session.message;
            redirectTo = "/nothinghere";
            break;


          default:
            break;
        }

        console.log("\x1b[31m", "ERROR: " + message + " Sending back to " + redirectTo + " | Requested " + req.originalUrl , '\x1b[0m');

        //notify via email of any errors
        if (process.env.NODE_ENV != "dev"){
          mailer.sendBasicMail({
            to: "general@domahub.com",
            from: 'general@domahub.com',
            subject: "There was an error on DomaHub production servers!",
            html: message
          });
        }

        res.redirect(redirectTo);
        break;
    }
  },

  //console log the error and send a mail to notify if production
  log : function(error){
    console.log("\x1b[31m", "ERROR: " + error, '\x1b[0m');

    //notify via email of any errors
    if (process.env.NODE_ENV != "dev"){
      mailer.sendBasicMail({
        to: "general@domahub.com",
        from: 'general@domahub.com',
        subject: "There was an error on DomaHub production servers!",
        html: JSON.stringify(error)
      });
    }
  }

  //</editor-fold>

}

//<editor-fold>-------------------------------HELPERS-------------------------------

//helper function to remove last part of URL
function RemoveLastDirectoryPartOf(the_url){
    var the_arr = the_url.split('/');
    the_arr.pop();
    return( the_arr.join('/') );
}

//</editor-fold>
