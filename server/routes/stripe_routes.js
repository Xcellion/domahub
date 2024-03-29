//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var general_functions = require('../controller/general_functions.js');
var stripe_functions = require('../controller/stripe_functions.js');

//</editor-fold>

//command to use ultrahook
//ultrahook stripe 8080/stripe/webhook

module.exports = function(app){

  //<editor-fold>----------------------------------------------------------------------STRIPE ROUTES

  app.post('/stripe/webhook', [
    general_functions.jsonParser,
    stripe_functions.stripeWebhookEventCatcher
  ]);

  //</editor-fold>

}
