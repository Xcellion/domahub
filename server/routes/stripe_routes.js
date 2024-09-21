//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var general_functions = require('../controller/general_functions.js');
var stripe_functions = require('../controller/stripe_functions.js');

//#endregion

//command to use ultrahook
//ultrahook stripe 8080/stripe/webhook

module.exports = function(app){

  //#region ----------------------------------------------------------------------STRIPE ROUTES

  app.post('/stripe/webhook', [
    general_functions.jsonParser,
    stripe_functions.stripeWebhookEventCatcher
  ]);

  //#endregion

}
