var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool

var db = require('./lib/database.js');

db.connect();  //connect to the database

// returns an instance of node-greenlock with additional helper methods
var lex = require('greenlock-express').create({
  server: 'staging',
  // server: 'https://acme-v01.api.letsencrypt.org/directory',
  approveDomains: approveDomains
});

function approveDomains(opts, certs, cb) {
  // This is where you check your database and associated
  // email addresses with domains and agreements and such

  // The domains being approved for the first time are listed in opts.domains
  // Certs being renewed are listed in certs.altnames
  if (certs) {
    console.log(certs);
    opts.domains = ["w3bbi.com"];
  }
  else {
    opts.email = 'wonmin@w3bbi.com';
    opts.agreeTos = true;
  }

  cb(null, { options: opts, certs: certs });
}

var app = require('express')();
app.all('*', ensureSecure); // at top of routing calls
app.use('/', function (req, res) {
  res.end('Hello, World!');
});

function ensureSecure(req, res, next){
  if (req.secure){
    return next();
  }
  else {
    res.redirect('https://' + req.hostname + req.url);
  }
}

// handles acme-challenge and redirects to https
require('http').createServer(lex.middleware(app)).listen(8080, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});

// handles your app
require('https').createServer(lex.middleware(app)).listen(4343, function () {
  console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
});
