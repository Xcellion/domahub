/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/

var express = require('express'),
	app = express(),
	http = require('http'),
	server = function(application){
		return http.createServer(application);
	},
	httpProxy = require('http-proxy'),
 	proxy = httpProxy.createProxyServer({});

// Listen for the `error` event on `proxy`.
proxy.on('error', function (err, req, res) {
	console.log(err);
	res.redirect("http://w3bbi.com/error");
});

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
require('./routes/routes.js')(app, db, auth, error, proxy);

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
