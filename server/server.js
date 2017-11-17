//<editor-fold>------------------------------------------ENVIRONMENT SETTINGS---------------------------------------

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

//to delete any temporary uploaded files left
var autoReap = require('multer-autoreap');
autoReap.options = {
  reapOnError: true
};
app.use(autoReap);

//for routing of static files
app.use(express.static(__dirname + '/public'));

//to refresh EJS variables on back button
app.use(function(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
});

//</editor-fold>

//<editor-fold>------------------------------------------SESSION---------------------------------------

//which session store to use depending on DEV or PROD
var session = require('express-session');
if (process.env.NODE_ENV == "dev"){
  console.log("Development environment! Using memory for sessions store.");

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

  //pretty json in dev
  app.set('json spaces', 2);
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
    saveUninitialized: true,
    resave: true,
    rolling: true
  }));

  //compression for production traffic
  var compression = require("compression");
  app.use(compression());
}

//</editor-fold>

//<editor-fold>------------------------------------------DATABASE / AUTH---------------------------------------

//connect to the database
var db = require('./lib/database.js');

//authentication
require('./lib/passport.js').init(app);

//</editor-fold>

//<editor-fold>------------------------------------------ROUTES---------------------------------------

//route to determine host
require('./controller/api_functions.js')(app);

//main routes
require('./routes/router.js')(app);

//</editor-fold>

//HTTP website on port 8080
serverHTTP(app).listen(8080, function(){
  console.log("DomaHub HTTP website listening on port 8080");
});
