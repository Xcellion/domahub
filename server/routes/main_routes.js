//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var general_functions = require('../controller/general_functions.js');
var main_functions = require('../controller/main_functions.js');
var auth_functions = require('../controller/auth_functions.js');

//</editor-fold>>

module.exports = function(app){

  //<editor-fold>----------------------------------------------------------------------MAIN ROUTES

  //home page
  app.get("/",[
    auth_functions.logoutDemo,
    main_functions.renderMainPage
  ]);

  //routes any of the below routes to the appropriate view
  app.get([
    "/features",
    "/privacy",
    "/faq",
    "/contact",
    "/terms",
    "/nothinghere"
  ], [
    auth_functions.logoutDemo,
    main_functions.mainPageLinksRender
  ]);

  //to contact us
  app.post("/contact", [
    general_functions.urlencodedParser,
    main_functions.contactUs
  ]);

  //blog redirect
  app.get("/blog", function(req, res){
    res.redirect("https://medium.com/@domahub");
  });

  //</editor-fold>

}
