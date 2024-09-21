//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var renter_functions = require("../controller/listing_renter_functions.js");
var main_functions = require("../controller/main_functions.js");

//#endregion

module.exports = function(app){

  //#region -------------------------------FINAL ROUTES (ico, rental forward, 404)-------------------------------

  //drop favicon requests
  app.get('*.ico', function(){});

  //catch future requests if rented (for dev environment and for rental preview)
  app.use("/", [
    renter_functions.rentalForward
  ]);

  //404 not found
  app.get('*', [
    main_functions.notFound
  ]);

  //#endregion

}
