var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool

var express = require('express'),
	app = express(),
	http = require('http'),
	serverHTTP = function(application){
		return http.createServer(application);
	};

var bodyParser 	= require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	passport = require('passport'),
	db = require('./lib/database.js'),
	error = require('./lib/error.js'),
	request = require('request'),
	autoReap  = require('multer-autoreap');
	autoReap.options = {
	    reapOnError: true
	},
	parseDomain = require('parse-domain'),
	url = require('url');

db.connect();	//connect to the database

require('./lib/auth.js').init(db, passport, error);
require('./lib/stripe.js').init(db, error);
var auth = require('./lib/auth.js');
var stripe = require('./lib/stripe.js');

/**************************************************
** SERVER INITIALIZATION
**************************************************/

//set the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//which session store to use depending on DEV or PROD
if (node_env == "dev"){
	console.log("Development environment! Using memory for sessions store.");

	//express session in memory
	app.use(session({
		secret: 'domahub_market',
		// cookie: {
		// 	maxAge: 1800000 //30 minutes
		// },
		saveUninitialized: false,
		resave: true
	}));
}
else {
	console.log("Production environment! Using redis for sessions store.");
	var redisStore = require('connect-redis')(session);
	app.set('trust proxy', "loopback");

	//redis store session
	app.use(session({
		store: new redisStore({
			host:'127.0.0.1',
			port: 6379,
			pass:"wonmin33"
		}),
		cookie: {
			maxAge: 1800000, //30 minutes
			secure: true
		},
		proxy: true,
		secret: 'domahub_market',
		saveUninitialized: false,
		resave: true
	}));

	//compression for production traffic
	var compression = require("compression");
	app.use(compression());
}

//for routing of static files
app.use(express.static(__dirname + '/public'));

// API for all domains listed on domahub
require('./lib/api.js')(app, db, error);

app.use(cookieParser());
app.use(autoReap);		//to delete any temporary uploaded files left

//initialize passport for auth
app.use(passport.initialize());
app.use(passport.session());

//main routes
require('./routes/routes.js')(app, db, auth, error, stripe);

//favicon requests
app.get('*.ico', function(){})

//catch future requests if rented (for dev enviroment and for rental preview)
app.use("/", function(req, res, next){
	if (req.header("Referer") && req.header("Referer").indexOf("rentalpreview") != -1 && req.session.rented_info){
		var domain_url = parseDomain(req.session.rented_info.address);
		var protocol = url.parse(req.session.rented_info.address).protocol;
		console.log("F: Proxying future request for " + req.originalUrl + " along to " + protocol + "//www." + domain_url.domain + "." + domain_url.tld);
		req.pipe(request({
			url: protocol + "//www." + domain_url.domain + "." + domain_url.tld + req.originalUrl
		})).pipe(res);
	}
	//go next to 404
	else {
		next();
	}
});

//404 not found
app.get('*', function(req, res){
	referer = req.header("Referer") || "someone";
	console.log("404! Unable to find " + req.originalUrl + ". Coming from " + referer);
	res.redirect('/nothinghere');
});

//HTTP website on port 8080
serverHTTP(app).listen(8080, function(){
	console.log("HTTP website listening on port 8080");
});
