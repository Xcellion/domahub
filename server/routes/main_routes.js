var	account_model = require('../models/account_model.js');

var	validator = require('validator');
var	request = require('request');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var mailOptions = {
    auth: {
        api_key: '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'
    }
}
var mailer = nodemailer.createTransport(sgTransport(mailOptions));

module.exports = function(app, db, auth, error){
	Auth = auth;
	Account = new account_model(db);

    //array of all views from the main page
    main_page_routes = [
		"/about",
		"/mission",
		"/press",
		"/faq",
		"/careers",
		"/contact",
		//"/getstarted",
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

	//to contact us
	app.post("/contact", [
		urlencodedParser,
		contactUs
	]);
}

//display main page
function renderMainPage(req, res, next){
	res.render("main/main_index", {
		message: Auth.messageReset(req),
		user: req.user
	});
}

//displays any page that we have a view for
function mainPageLinksRender(req, res, next){
	var view_name = req.path.slice(1, req.path.length);

	//append main_ to the view name
	res.render("main/main_" + view_name, {
		message: Auth.messageReset(req),
		user: req.user
	});
}

//to add email to sendgrid beta list
function signupBeta(req, res, next){
	if (validator.isEmail(req.body.betaemail)){
		request({
			url: "https://api.sendgrid.com/v3/contactdb/recipients",
			method: "POST",
			'auth': {
			    'bearer': "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"
		 	},
			body: [
				{
					email: req.body.betaemail
				}
			],
			json: true
		}, function(err, response, body){
			res.json({
				state: "success"
			});
		});
	}
	else {
		res.json({
			state: "error",
			message: "Please enter a valid email address!"
		})
	}
}

//function to handle contact us form submission
function contactUs(req, res, next){
	var contact_name = req.body.contact_name;
	var contact_email = req.body.contact_email;
	var contact_message = req.body.contact_message;

	if (!contact_name){
		error.handler(req, res, "Please enter your name!", "json");
	}
	else if (!validator.isEmail(contact_email)){
		error.handler(req, res, "Please enter a valid email address!", "json");
	}
    else if (!contact_message){
        error.handler(req, res, "Please say something!", "json");
    }
	else {
		//email options
		var email = {
			from: req.body.contact_email,
			to: 'general@domahub.com',
			subject: '[CONTACT FORM] - ' + req.body.contact_name + ' says hello! ',
			text: req.body.contact_message
		};

		//send email
		mailer.sendMail(email, function(err) {
			if (err) {console.log(err)}
			res.send({
				state: "success"
			});
		});
	}
}
