//#region ------------------------------------------ENVIRONMENT SETTINGS---------------------------------------

//http server
var express = require('express');
var app = express();
var http = require('http');
serverHTTP = function(application){
  return http.createServer(application);
};

//set the view engine and directory
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//cookie parsing
var cookieParser = require('cookie-parser');
app.use(cookieParser());

//for routing of static files
app.use(express.static(__dirname + '/public'));

//to refresh EJS variables on back button
app.use(function(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
});

//#endregion

//#region ------------------------------------------SESSION---------------------------------------

//which session store to use depending on DEV or PROD
var session = require('express-session');
app.set('json spaces', 2);    //pretty json
console.log("Using memory for sessions store.");

//express session in memory
app.use(session({
  secret: 'domahub_market',
  cookie: {
    secure: false
  },
  saveUninitialized: false,
  resave: false,
  rolling: true
}));

//#endregion

//#region ------------------------------------------DATABASE / AUTH---------------------------------------

//connect to the database
var db = require('./lib/database.js');

//authentication
require('./lib/passport.js').init(app);

//#endregion

//#region ------------------------------------------ROUTES---------------------------------------

// //route to determine host
// require('./controller/api_functions.js')(app);

//main routes
require('./routes/router.js')(app);

//#endregion

//HTTP website on port 8080
serverHTTP(app).listen(process.env.PORT || 8080, function(){
  console.log("DomaHub HTTP website listening on port 8080");
});

app.get('/', (req, res) => {
  res.sendStatus(200)
});
