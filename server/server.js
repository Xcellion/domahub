/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/

var express = require('express'),
	app = express(),
	bodyParser 	= require('body-parser'),
	cookieParser = require('cookie-parser'),
	server = require('http').createServer(app),
	io = require("socket.io").listen(server),
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

app.use(express.static(__dirname + '/public'));

//favicon requests second time for some reason
app.get('*.ico', function(){})
require('./routes/routes.js')(app, db, auth, error);

//404
app.get('*', function(req, res){
	console.log("Unable to find " + req.originalUrl);
	console.log("404, not found!");
	res.redirect('/');
});

var port = Number(process.env.PORT || 8080);
server.listen(port, function(){
	console.log("Listening on port " + port);
});


var dnsd = require("dnsd");
var server = dnsd.createServer(handler)
server.zone('example.com', 'ns1.example.com', 'us@example.com', 'now', '2h', '30m', '2w', '10m').listen(5353, "127.0.0.1")
console.log('Server running at 127.0.0.1:5353')

function handler(req, res) {

	var question = res.question[0]
	, hostname = question.name
	, length = hostname.length
	, ttl = 60;

	console.log("IP of " + req.connection.remoteAddress + " requested " + hostname + " at port " + req.connection.remotePort);

	if (question.type == 'A') {
		res.answer.push({name:hostname, type:'A', data:"111.111.111.111", 'ttl':ttl})
	}
	res.end();
}
