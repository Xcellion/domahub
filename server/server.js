/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/

var express = require('express'),
	app = express(),
	http = require('http'),
	server = function(appplication){
		return http.createServer(appplication);
	},
 	proxy = require('subdomain-router');

var bodyParser 	= require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	passport = require('passport'),
	db = require('./lib/database.js'),
	error = require('./lib/error.js');

db.connect();

require('./lib/auth.js').auth(db, passport, error);

var auth = require('./lib/auth.js');

/**************************************************
** SERVER INITIALIZATION
**************************************************/

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//express session secret
app.use(session({
	secret: 'w3bbi_market',
	saveUninitialized: true,
	resave: true}
));

app.use(passport.initialize());
app.use(passport.session());

//allow access-control list
app.use(function(req, res, next) {
	var allowedOrigins = [
		'http://www.youreacutie.com',
		'http://youreacutie.com',
		'http://www.imsorryimdumb.com',
		'http://imsorryimdumb.com',
		'http://w3bbi.com',
		'http://www.w3bbi.com',
		'http://localhost:8080'
	];

	var origin = req.headers.origin;

	if (allowedOrigins.indexOf(origin) > -1){
		res.setHeader('Access-Control-Allow-Origin', origin);
	//	res.setHeader('Content-Type', 'application/jsonp');
	}

	next();
});

//for routing of static files
app.use(express.static(__dirname + '/public'));

//favicon requests
app.get('*.ico', function(){})

//main routes
require('./routes/routes.js')(app, db, auth, error);

//404 not found
app.get('*', function(req, res){
	console.log("Unable to find " + req.originalUrl);
	console.log("404, not found!");
	res.redirect('/');
});

//main website on port 8080
server(app).listen(8080, function(){
	console.log("Main website listening on port 8080");
});

// //sub-domain router reverse proxy
// proxy({
//   host: 'w3bbi.com',
//   subdomains: {
//     '': 11111,		//main website at 10000
// 	www: 11111,		//main website at 10000
// 	dns: 11111,		//dns at 10000 as well
// 	api: 11111		//api for display websites
//   }
// }).listen(80);
