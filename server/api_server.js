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

//#endregion

//#region ------------------------------------------SESSION---------------------------------------

//which session store to use depending on DEV or PROD
var session = require('express-session');
if (process.env.NODE_ENV == "prod"){
  console.log("Production environment! Using redis for sessions store for LE API server.");
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
    secret: 'domahub_lets_encrypt_api_prod',
    saveUninitialized: false,
    resave: true,
    rolling: true
  }));
}
else {
  console.log("Development environment! Using memory for sessions store for LE API server.");

  //express session in memory
  app.use(session({
    secret: 'domahub_lets_encrypt_api_dev',
    cookie: {
      secure: false
    },
    saveUninitialized: true,
    resave: true,
    rolling: true
  }));
}

//#endregion

//#region ------------------------------------------DATABASE---------------------------------------

var db = require('./lib/database.js');

//#endregion

//#region ------------------------------------------ROUTES---------------------------------------

//API for Lets Encrypt SSL certs for premium domains listed on domahub
require('./controller/le_api_functions.js')(app);

//404 not found
app.get('*', function(req, res){
  referer = req.header("Referer") || "someone";
  console.log("LEF: 404! Unable to find " + req.originalUrl + ". Coming from " + referer);
  res.sendStatus(404);
});

//#endregion

//lets encrypt server on port 9090
serverHTTP(app).listen(9090, function(){
  console.log("Let's Encrypt SSL server listening on port 9090");
});
