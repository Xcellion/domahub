var	account_model = require('../models/account_model.js');
var	listing_model = require('../models/listing_model.js');
var	data_model = require('../models/data_model.js');

var	validator = require('validator');
var	request = require('request');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true })
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var fs = require('fs');
var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
var path = require('path');

var mailOptions = {
    auth: {
        api_key: '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'
    }
}
var mailer = nodemailer.createTransport(sgTransport(mailOptions));

module.exports = function(app, db, auth, error){
	Auth = auth;
	Account = new account_model(db);
	Listing = new listing_model(db);
	Data = new data_model(db);

    //array of all views from the main page
    main_page_routes = [
		"/about",
		"/mission",
		"/press",
		"/faq",
		"/careers",
		"/contact",
		"/privacy",
        // "/sellers",
		// "/renters",
		"/terms",
        "/nothinghere"
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
    console.log("F: Checking posted email for beta signup...");
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
            if (!err){
                console.log("F: Beta email is good! Sending welcome email...");

                var email_contents_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'email', 'email_verify.html') : path.resolve(process.cwd(), 'views', 'email', 'email_verify.html');
                var email_contents = fs.readFileSync(email_contents_path);
                if (!email_contents){
                    email_contents = "<p>This email is to let you know that you have successfully signed up for DomaHub beta testing!</p><p>We'll be sure to let you know once we begin the next phase of the beta process.</p><p>Thank you!</p></br><p>-- DomaHub</p>"
                }

                //email options
        		var email = {
        			to: req.body.betaemail,
        			from: '"DomaHub Beta" <general@domahub.com>',
        			subject: 'Thank you for signing up at DomaHub!',
        			html: email_contents
        		};

        		//send email
        		mailer.sendMail(email, function(err) {
                    if (err) {
                        res.json({
                            state: "error",
                            message: "Please enter a valid email address!"
                        });
                    }
                    else {
                        res.send({
                            state: "success"
                        });
                    }
        		});
            }
            else {
                res.json({
                    state: "error",
                    message: "Please enter a valid email address!"
                });
            }
		});
	}
	else {
		res.json({
			state: "error",
			message: "Please enter a valid email address!"
		});
	}
}

//function to handle contact us form submission
function contactUs(req, res, next){
    console.log("F: Checking posted email for beta signup...");

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
