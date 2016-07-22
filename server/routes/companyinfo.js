var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js');

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Account = new account_model(db);
	Listing = new listing_model(db);

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	//default page
	app.get("/about", aboutPage);

}

function aboutPage(req, res, next) {
  res.render("about");
}
