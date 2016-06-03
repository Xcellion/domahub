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
	db = require('./lib/database.js');
	
require('./lib/config.js')(passport, db);

/**************************************************
** SERVER INITIALIZATION
**************************************************/
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.set('view engine', 'ejs'); // set up ejs for templating
app.set('views', __dirname + '/views');

//express session
app.use(session({ 
		secret: 'wonminleew3bbi',
		saveUninitialized: true,
		resave: true}
	)); // session secret

app.use(passport.initialize());
app.use(passport.session());

require('./routes/routes.js')(app, db, passport, io);

app.use(express.static(__dirname + '/public'));

//404
app.get('*', function(req, res){
	res.redirect('/');
});

var port = Number(process.env.PORT || 8080);
server.listen(port, function(){
	console.log("Listening on port " + port);
});