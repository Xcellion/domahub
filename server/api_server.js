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
	db = require('./lib/database.js'),
	error = require('./lib/error.js'),
	request = require('request'),
	parseDomain = require('parse-domain'),
	url = require('url');

db.connect();	//connect to the database

/**************************************************
** SERVER INITIALIZATION
**************************************************/

//set the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//which session store to use depending on DEV or PROD
if (node_env == "dev"){
	console.log("Development environment! Using memory for sessions store for API server.");

	//express session in memory
	app.use(session({
		secret: 'domahub_market_api',
		saveUninitialized: false,
		resave: true
	}));
}
else {
	console.log("Production environment! Using redis for sessions store for API server.");
	var redisStore = require('connect-redis')(session);

	//compression for production traffic
	var compression = require("compression");
	app.use(compression());

	//redis store session
	app.use(session({
		store: new redisStore({
			host:'127.0.0.1',
			port: 6379,
			pass:"wonmin33"
		}),
		cookie: {
			maxAge: 1800000, //30 minutes
		},
		secret: 'domahub_market_api',
		saveUninitialized: false,
		resave: true
	}));
}

// API for all domains listed on domahub
require('./lib/api_functions.js')(app, db, error);

//catch future requests if rented (for dev environment and for rental preview)
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
	res.redirect('https://domahub.com/nothinghere');
});

//api server on port 9090
serverHTTP(app).listen(9090, function(){
	console.log("API server listening on port 9090");
});
