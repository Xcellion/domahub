//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var general_functions = require('../controller/general_functions.js');
var main_functions = require('../controller/main_functions.js');

//</editor-fold>>

module.exports = function(app){

  //<editor-fold>----------------------------------------------------------------------MAIN ROUTES

  //home page
  app.get("/", main_functions.renderMainPage);

  //routes any of the below routes to the appropriate view
  app.get([
    "/features",
    "/privacy",
    "/faq",
    "/contact",
    "/terms",
    "/nothinghere"
  ], main_functions.mainPageLinksRender);

  //to contact us
  app.post("/contact", [
    general_functions.urlencodedParser,
    main_functions.contactUs
  ]);

  //</editor-fold>

}
