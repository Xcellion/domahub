var	account_model = require('../models/account_model.js');
var	validator = require('validator');
var	request = require('request');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// create application/x-www-form-urlencoded parser
module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;
	Account = new account_model(db);

    //array of all views from the main page
    main_page_routes = [
		"/about",		//aka company.ejs
		"/mission",		//aka company.ejs
		"/press",		//aka company.ejs
		"/faq",			//aka company.ejs
		"/careers",
		"/contact",
		"/getstarted",
		"/privacy",
    	"/sellers",
		"/renters",
		"/tos"
    ]

	//default page
	app.get("/", renderMainPage);

    //routes any of the above routes to the appropriate view
	app.get(main_page_routes, mainPageLinksRender);

	//to check email and sign up for beta
	app.post("/beta", [
		urlencodedParser,
		signupBeta
	]);
}

//display main page
function renderMainPage(req, res, next){
	res.render("main_index", {
		message: Auth.messageReset(req),
		user: req.user
	});
}

//displays any page that we have a view for
function mainPageLinksRender(req, res, next){
	var view_name = req.path.slice(1, req.path.length);

	//append main_ to the view name
	res.render("main_" + view_name, {
		message: Auth.messageReset(req),
		user: req.user
	});
}

//to add email to sendgrid beta list
function signupBeta(req, res, next){
	if (validator.isEmail(req.body.betaemail)){
		Account.checkAccount(req.body.betaemail, function(result){
			if (result.state =="success" && result.info.length == 0){
				request({
					url: "https://api.sendgrid.com/v3/contactdb/recipients",
					method: "POST",
					'auth': {
					    'bearer': "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"
				 	},
					body: [
						{
							email: req.body.betaemail,
							lists: 622793
						}
					],
					json: true
				}, function(err, response, body){
					res.json({
						state: "success"
					})
				});
			}
			else {
				res.json({
					state: "error",
					message: "Please enter a valid email address!"
				})
			}
		});
	}
	else {
		res.json({
			state: "error",
			message: "Please enter a valid email address!"
		})
	}
}
