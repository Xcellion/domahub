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