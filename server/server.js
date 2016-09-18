/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool

var express = require('express'),
	app = express(),
	http = require('http'),
	server = function(application){
		return http.createServer(application);
	};

var bodyParser 	= require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	redisStore = require('connect-redis')(session),
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

//which session store to use depending on DEV or PROD
if (env == "dev"){
	//express session in memory
	app.use(session({
		secret: 'domahub_market',
		saveUninitialized: false,
		resave: false
	}));
}
else {
	//redis store session
	app.use(session({
		store: new redisStore({
			host:'127.0.0.1',
			port: 6379,
			pass:"wonmin33"
		}),
		secret: 'domahub_market',
		resave: false,
		saveUninitialized: false
	}));
}

//for routing of static files
app.use(express.static(__dirname + '/public'));

//initialize passport for auth
app.use(passport.initialize());
app.use(passport.session());

//favicon requests
app.get('*.ico', function(){})

//main routes
require('./routes/routes.js')(app, db, auth, error);

//404 not found
app.get('*', function(req, res){
	referer = req.header("Referer") || "someone";
	console.log("404! Unable to find " + req.originalUrl + ", requested by " + referer);
	res.redirect('/');
});

//main website on port 8080
server(app).listen(8080, function(){
	console.log("Main website listening on port 8080");
});
