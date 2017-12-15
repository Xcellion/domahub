//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require('../models/account_model.js');
var listing_model = require('../models/listing_model.js');
var data_model = require('../models/data_model.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var validator = require('validator');
var request = require('request');

//</editor-fold>

module.exports = function(app){

  //<editor-fold>-------------------------------ROUTES-------------------------------

  //test views
  app.get("/emailviews/:email_template", emailViews);
  app.get("/viewstest/:path/:view_name", showView);

  //create coupon codes
  app.get("/createcodes/:number", [
    createCouponCodes
  ]);

  //parse cold contact excel
  app.get("/parsecontacts/:date/:verbose", parseFolder);
  app.get("/parsejsons/:date/", parseJSON);

  //mailchimp test
  app.get("/monkey", monkey);

  //registrar tests
  app.get("/godaddy", godaddy);
  app.get("/namecheap", namecheap);
  app.get("/dns/:domain_name", dnsCheck);

  //google embed analytics
  app.get("/google", googleAnalytics);

  //testing demo login with fake user
  app.get("/fake", fakeLogin);

  //</editor-fold>

}

//<editor-fold>-------------------------------COUPON-------------------------------------

//coupon
var randomstring = require("randomstring");
var stripe_key = "sk_test_PHd0TEZT5ytlF0qCNvmgAThp";
var stripe = require("stripe")(stripe_key);

//create X sign up codes
function createCouponCodes(req, res, next){
  console.log("F: Creating " + req.params.number + " coupon codes...");

  var createUniqueCoupons = function(number, referrer){
    var codes = [];

    if (validator.isInt(number)){
      for (var x = 0; x < number; x++){
        var random_string = randomstring.generate(10);
        codes.push([random_string, null, 1]);
      }
    }

    return codes;
  }

  var insertCoupons = function(codes, number, cb){
    account_model.createCouponCodes(codes, function(result){
      if (result.state == "error" && result.errcode == "ER_DUP_ENTRY"){
        console.log("Duplicate coupon!");
        insertCoupons(createUniqueCoupons(number), number);
      }
      else if (result.state != "error"){
        cb(codes);
      }
    });
  }

  insertCoupons(createUniqueCoupons(req.params.number), req.params.number, function(codes){
    var stripe_promises = [];
    for (var x = 0 ; x < codes.length ; x++){
      var promise = (function(code){
        var deferred = Q.defer();
        stripe.coupons.create({
          id: code,
          duration: "repeating",
          percent_off: 100,
          duration_in_months: 1,
          max_redemptions : 1
        }, function(err, coupon) {
          if (err){
            deferred.reject(err);
          }
          else {
            deferred.resolve(coupon);
          }
        });
        return deferred.promise;
      })(codes[x][0]);
      stripe_promises.push(promise);
    }

    Q.allSettled(stripe_promises).then(function(results) {
      var success_codes = []
      for (var x = 0 ; x < results.length; x++){
        if (results[x].state == "fulfilled"){
          success_codes.push(results[x].value.id);
        }
        else {
          console.log(results[x]);
        }
      }

      //all successful!
      if (success_codes.length == parseFloat(req.params.number)){
        res.send(success_codes.join("</br>"));
      }
      else {
        res.send("Something went wrong with Stripe coupons!");
      }
    });

  });

}

//</editor-fold>

//<editor-fold>-------------------------------MONKEY-------------------------------------

function monkey(req, res, next){
  request({
    url : "https://us15.api.mailchimp.com/3.0/lists/9bcbd932cd/members",
    method : "POST",
    headers : {
      "Authorization" : "Basic " + new Buffer('any:' + "8255be227b33934b7822c777f2cbb11e-us15" ).toString('base64')
    },
    json : {
      email_address : "test@test.com",
      status : "subscribed",
      merge_fields : {
        "USERNAME" : "testfuck"
      }
    }
  }, function(err, response, body){
    if (err){console.log(err)}
    else {
      res.send(body);
    }
  });
}

//</editor-fold>

//<editor-fold>-------------------------------EMAIL-------------------------------------

var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

//show a specific view
function showView(req, res, next){
  var view_vars = {
    user: "Wonkyu",
    listing_info : {
      domain_name : "testdomain.com",
      primary_color : "#e86666",
      premium: true,
      logo: "",
      compare: false
    },
    compare: false,
    offer_info : {
      name : "WOFJ",
      verification_code : "fdjasks"
    }
  }
  res.render(req.params.path + "/" + req.params.view_name, view_vars);
}

//to read email templates
function emailViews(req, res, next){
  var wNumb = require("wnumb");
  var moneyFormat = wNumb({
    thousand: ',',
    prefix: '$',
    decimals: 0
  });

  var phoneNumber = phoneUtil.parse("+17183097773");

  var data = {
    domain_name: "fuck.com",
    premium: false,
    response: "Hey fuck yourself",
    listing_info: {
      primary_color: "#000"
    },
    user: {
      username: "Blake Griffin"
    },
    token: "",
    name : "offerer",
    owner_name : "OWNERFUCK",
    offerer_name: "BUYERTWAT",
    offerer_email: "test@email.com",
    offer_id: 1,
    username: "fuck",
    email: "test@email.com",
    accepted: false,
    offerer_phone: phoneUtil.format(phoneNumber, PNF.INTERNATIONAL),
    phone: phoneUtil.format(phoneNumber, PNF.INTERNATIONAL),
    offer: moneyFormat.to(parseFloat("1231324")),
    verification_code: randomstring.generate(10),
    message: "djkljakljfljask lfjkldasjfklasdjkldf jaskldfjk asdlfjklsajd klasjdklfjaslk jklasjd flkjskdlf"
  }

  res.render("email/" + req.params.email_template + ".ejs", data);
}

//</editor-fold>

//<editor-fold>-------------------------------EXCEL COLD EMAIL---------------------------------

//research (EXCEL)
var XLSX = require('xlsx');
var Q = require("Q");
var qlimit = require("qlimit");
var glob = require("glob");
var json2csv = require('json2csv');
var whois = require("whois");

//parse all xlsx files in a folder
function parseFolder(req, res, next){
  var verbose = (req.params.verbose == "true") ? true : false;
  var date = req.params.date;

  console.log("Reading folder for CSV files...");

  //look for all csvs
  glob('other/registrations/csv/' + date + '/*.csv', function(err, files) { // read the folder or folders if you want: example json/**/*.json
    if(err) {
      console.log("Cannot read the folder, something went wrong! ", err);
    }
    else {
      console.log("Now parsing " + files.length + " CSV files!");

      var recursive_parse = function(index){
        console.log("\x1b[43m", "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.log("\x1b[0m", "Starting on CSV file # " + index);

        //last one
        if (index == files.length - 1){
          return parseCSV(date, files[index], verbose, function(){
            console.log("all done");
          });
        }
        else {
          return parseCSV(date, files[index], verbose, function(){
            index++
            return recursive_parse(index);
          });
        }
      }

      //node --max-old-space-size=8192 server/server.js

      //start recursion
      // recursive_parse(37);

      //singular parse
      // parseCSV(date, files[83], verbose, function(){
      //   console.log("all done");
      // });
    }
  });
  res.sendStatus(200);
}

//parse all JSONs in a folder and combine them
function parseJSON(req, res, next){
  console.log("Reading folder for JSON files...");

  var this_dir = 'other/registrations/json/' + req.params.date;

  //create raw directory for raw JSON files
  if (!fs.existsSync(this_dir + '/raw')){
    fs.mkdirSync(this_dir + '/raw');
  }

  //parse raw JSON now
  glob(this_dir + '/*.json', { ignore : [
    this_dir + "/" + req.params.date + "-all.json",
    this_dir + "/" + req.params.date + "-multi.json",
    this_dir + "/" + req.params.date + "-failed.json"
  ] }, function(err, files) { // read the folder or folders if you want: example json/**/*.json
    if(err) {
      console.log("Cannot read the folder, something went wrong! ", err);
    }

    console.log("Now parsing " + files.length + " JSON files!");
    var all_contacts = [];
    var failed_domains = [];
    var multi_domains = [];

    var finished_callback = function(){
      console.log("Finished parsing all raw JSON files!");
      console.log("Now creating importable CSV files!");

      //parse multi domain owners
      fs.readFile(this_dir + "/" + req.params.date + "-multi.json", 'utf8', function (err, json_data) { // Read each file
        var csv_version = json2csv({
          data: JSON.parse(json_data),
          fields: ["email", "name", "domain1"]
        });
        fs.writeFileSync(this_dir + "/" + req.params.date + "-multi.csv", csv_version, {encoding:'utf8',flag:'w'});

        //parse error domain owners
        fs.readFile(this_dir + "/" + req.params.date + "-failed.json", 'utf8', function (err, json_data) { // Read each file
          var csv_version = json2csv({
            data: JSON.parse(json_data),
            fields: ["email", "name", "failed_domains"],
            fieldNames: ["email", "name", "domain"]
          });
          fs.writeFileSync(this_dir + "/" + req.params.date + "-failed.csv", csv_version, {encoding:'utf8',flag:'w'});
          console.log("Finished making importable CSV files! Make sure to manually edit the CSV files before importing!");
        });
      });
    }

    //parse all raw JSON files and create master JSON files (move raw to raw folder)
    var index = 0;
    files.forEach(function(file) {
      fs.readFile(file, 'utf8', function (err, data) { // Read each file
        if(err) {
          console.log("cannot read the file, something goes wrong with the file", err);
        }
        var contacts = JSON.parse(data);

        contacts.forEach(function(contact){
          var duplicate = false;
          for (var x = 0 ; x < all_contacts.length; x++){
            if (all_contacts[x].name == contact.name){
              duplicate = true;
            }
          }

          if (!duplicate){
            all_contacts.push(contact);

            if (contact.failed_domains){
              failed_domains.push(contact);
            }
            else {
              multi_domains.push(contact);
            }
          }
          else {
            console.log("Duplicate found! " + contact.name);
          }
        });

        // console.log("\x1b[0m", "Writing to file...");
        fs.rename(file, file.replace("/" + req.params.date + "/", "/" + req.params.date + "/raw/"), function(){
          fs.writeFileSync(this_dir + "/" + req.params.date + "-all.json", JSON.stringify(all_contacts, null, 2), {encoding:'utf8',flag:'w'})
          fs.writeFileSync(this_dir + "/" + req.params.date + "-failed.json", JSON.stringify(failed_domains, null, 2), {encoding:'utf8',flag:'w'})
          fs.writeFileSync(this_dir + "/" + req.params.date + "-multi.json", JSON.stringify(multi_domains, null, 2), {encoding:'utf8',flag:'w'})
          index++;

          //finished!
          if (index == files.length){
            finished_callback();
          }
        });
      });
    });

    //finished already
    if (files.length == 0){
      finished_callback();
    }

    res.sendStatus(200);
  });
}

//array of non-names to filter for
var not_names = [
  ".",
  "agent",
  "against",
  "advantage",
  "alliance",
  "admin",
  "behalf",
  "corp",
  "domain",
  "development",
  "department",
  "designer",
  "enterprises",
  "for sale",
  "gaming",
  "guard",
  "global",
  "hosting",
  "inc.",
  "interactive",
  "llc",
  "network",
  "manager",
  "marketing",
  "publishing",
  "private",
  "privacy",
  "proxy",
  "realty",
  "registration",
  "service",
  "store",
  "support",
  "whois",
  "worldwide",
  "website",
  "webmaster",
]

//build cold contacts from excel sheet
function parseCSV(date, file, verbose, cb){
  console.log("\x1b[0m", "Initializing workbook parsing...");
  var workbook = XLSX.readFile(file);
  var sheet = workbook.Sheets[workbook.SheetNames[0]];
  var range = XLSX.utils.decode_range(sheet['!ref']);
  var json_workbook = XLSX.utils.sheet_to_json(sheet);

  //arrays for all contacts
  var no_website_contacts = [];
  var multi_domain_contacts = [];
  var q_promises = [];

  //loop through all rows
  console.log("\x1b[0m", "Checking for real names...");
  var last_email = "";
  var last_email_count = 0;
  var last_email_contact = false;
  var last_email_domains = [];

  for (var row = 0; row < json_workbook.length; row++){

    //only if we don't have him already (assumed email sorted)
    if (json_workbook[row].registrant_email != last_email){

      //loop to pick out non-names
      var its_a_name = true;
      for (var x = 0; x < not_names.length; x++){
        if (json_workbook[row].registrant_name.toLowerCase().indexOf(not_names[x]) != -1){
          its_a_name = false;
          break;
        }
      }

      //only if it's an actual name, create the promise to see what's behind the domain (new person)
      if (its_a_name){
        var promise = (function(workbook_row){
          return function(){
            return q_function(
              workbook_row.domain_name,
              workbook_row.registrant_name,
              workbook_row.registrant_email
            );
          }
        })(json_workbook[row]);
        q_promises.push(promise);

        //to see if any real people have multiple domains
        last_email_count = 1;
        last_email_contact = json_workbook[row];
        last_email_domains.push(json_workbook[row].domain_name);
      }

      //not a real person, and it's a new email!
      else {

        //only if they own 5 or more
        if (last_email_count >= 5){
          var temp_multi_contact = {
            name : toTitleCase(last_email_contact.registrant_name),
            email : last_email_contact.registrant_email,
          };

          //only if verbose mode
          if (verbose){
            temp_multi_contact.domains = last_email_domains
            temp_multi_contact.count = last_email_count
          }

          multi_domain_contacts.push(temp_multi_contact);
        }

        //reset counters
        last_email_count = 0;
        last_email_contact = false;
        last_email_domains = [];
      }

      //set last email so we can skip duplicate emails
      last_email = json_workbook[row].registrant_email;
    }

    //count how many emails in a row this person has had
    else if (last_email_count > 0){
      last_email_count++;
      last_email_domains.push(json_workbook[row].domain_name);

      //add promise to check all other domains they also own (to see if website behind them)
      var promise = (function(workbook_row){
        return function(){
          return q_function(
            workbook_row.domain_name,
            workbook_row.registrant_name,
            workbook_row.registrant_email
          );
        }
      })(json_workbook[row]);
      q_promises.push(promise);
    }
  }

  // wait for all promises to finish, throttling the parallel promises
  console.log("\x1b[0m", "Starting queries...");
  var limit = qlimit(10);     //limit parallel promises (throttle)

  Q.allSettled(q_promises.map(limit(function(item, index, collection){
    console.log("\x1b[0m", 'Querying #', index + "...");
    return q_promises[index]();
  }))).then(function(results) {
    var success_domains = [];
    var failed_domains = [];

    // figure out which promises passed
    console.log("\x1b[0m", "Now checking for failure domains...");
    for (var y = 0; y < results.length; y++){
      if (results[y].state == "fulfilled"){

        var exists = false;
        for (var z = 0; z < no_website_contacts.length; z++){

          //multiple failed domains by same owner
          if (no_website_contacts[z].name == results[y].value.name){
            exists = true;

            if (verbose){
              no_website_contacts[z].count++;
              no_website_contacts[z].failed_domains.push(results[y].value.domain_name);
            }

            break;
          }

        }

        //new failed domain owner
        if (!exists){
          var temp_no_site_contact = {
            name : results[y].value.name,
            email : results[y].value.email
          }

          //only if verbose mode
          if (verbose){
            temp_no_site_contact.failed_domains = [results[y].value.domain_name]
            temp_no_site_contact.count = 1
          }

          no_website_contacts.push(temp_no_site_contact);
        }

      }
    }

    // loop through multi-domain to see if there are any duplicates
    console.log("\x1b[0m", "Now checking for duplicates...");
    var non_duplicate = [];
    for (var x = 0; x < multi_domain_contacts.length; x++){
      var duplicate = false;
      for (var s = 0; s < no_website_contacts.length; s++){

        //duplicate exists!
        if (no_website_contacts[s].email == multi_domain_contacts[x].email){
          duplicate = true;
          break;
        }
      }

      if (!duplicate){
        non_duplicate.push(multi_domain_contacts[x]);
      }
    }

    console.log("\x1b[0m", "JSON Stringifying...");
    var all_contacts = JSON.stringify(no_website_contacts.concat(non_duplicate));

    console.log("\x1b[0m", "Making directory...");
    fs.mkdir('other/marketing/json/' + date, function(){
      console.log("\x1b[0m", "Writing to file...");
      fs.writeFile(file.replace(".csv", ".json").replace("csv", "json"), all_contacts, {encoding:'utf8',flag:'w'}, function(err){
        console.log("\x1b[43m", "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.log("\x1b[0m", "-------------COMPLETED---------------!!!!!!!!!");

        //callback
        cb();
      });
    });

  });
}

//custom request promise function
function q_function(domain_name, name, email){
  // console.log("\x1b[0m", "Querying - " + domain_name);
  var deferred = Q.defer();
  request.get({
    url: "http://" + domain_name,
    timeout: 100000
  }, function (err, response, body) {

    //if theres something there, reject
    if (!err && response.statusCode != "404"){
      console.log("\x1b[0m", "SUCCESS - Status Code - " + response.statusCode + " - " + domain_name);
      deferred.reject();
    }
    //if connection refused, nothing there
    else {
      var err_code = (err) ? err.code : "404";
      console.log('\x1b[31m', "ERROR - Error Code - " + err_code + " - " + domain_name);
      deferred.resolve({
        name : toTitleCase(name),
        email : email,
        domain_name : domain_name
      });
    }
  });
  return deferred.promise;
}

//make proper nouns titlecase
function toTitleCase(str){
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

//</editor-fold>

//<editor-fold>-------------------------------DNS CHECK-------------------------------

var dns = require('dns');

function dnsCheck(req, res, next){
  var domain_name = req.params.domain_name;
  dns.resolve(domain_name, "A", function (err, address, family) {
    var domain_ip = address;
    dns.resolve("domahub.com", "A", function (err, address, family) {
      var doma_ip = address;
      if (err || !domain_ip || !address || domain_ip[0] != address[0] || domain_ip.length != 1){
        res.send("<h1>oh no</h1></br>" + req.params.domain_name + " - " + domain_ip + "</br>domahub - " + doma_ip);
      }
      else {
        res.send("<h1>oh yeah</h1></br>" + req.params.domain_name + " - " + domain_ip + "</br>domahub - " + doma_ip);
      }
    });
  });
}

//</editor-fold>

//<editor-fold>-------------------------------REGISTRARS-------------------------------

//godaddy production (1min)
// var godaddy_api_prod = "9uBcCfxCjPd_FiwFzPXoaj9ubPzzPpsQVW";
// var godaddy_secret_prod = "FiwHuAgZ13PpiVDvDVpEB2";
// var godaddy_customer_num = "55666970";

//godaddy production (robert)
var godaddy_api_prod = "31uUbY5CvU_2fiCvta5X7kJdqTJtA52CU";
var godaddy_secret_prod = "2fiF9zXdNPLQHke1oXueaY";
var godaddy_customer_num = "5067889";

var namecheap_url = (process.env.NODE_ENV == "dev") ? "https://api.sandbox.namecheap.com/xml.response" : "https://api.namecheap.com/xml.response";
var namecheap_api_key = "90ecfcb1d49e4204a69af26efc6d854a";
var namecheap_username = "domahub";
var parseString = require('xml2js').parseString;

function godaddy(req, res, next){
  request({
    url: "https://api.godaddy.com/v1/domains/cALEntopia.com/records/A",
    method: "PUT",
    json : true,
    body : [
      {
        name : "@",
        data : "208.68.37.82"
      }
    ],
    headers: {
      "X-Shopper-Id" : godaddy_customer_num,
      Authorization : "sso-key " + godaddy_api_prod + ":" + godaddy_secret_prod
    }
  }, function(err, response, body){
    console.log(response.statusCode);
    res.json(body);
  });
}

function namecheap(req, res, next){
  console.log("F: namecheap..." + namecheap_url);
  request({
    url: namecheap_url,
    method: "POST",
    qs : {
      ApiKey : namecheap_api_key,
      ApiUser : namecheap_username,
      UserName : namecheap_username,
      ClientIp : "208.68.37.82",
      Command : "namecheap.domains.dns.setHosts",
      SLD : "domahubdomain1",
      TLD : "com",
      HostName1 : "@",
      RecordType1 : "A",
      Address1 : "208.68.37.82",
      HostName2 : "www",
      RecordType2 : "CNAME",
      Address2 : "domahubdomain1.com"
    }
  }, function(err, response, body){
    console.log(response.statusCode);
    parseString(body, {trim: true}, function (err, result) {
      res.json(result);
    });
  });
}

//</editor-fold>

//<editor-fold>-------------------------------GOOGLE ANALYTICS-------------------------------

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var key = require("../lib/google_embed_api_key.json");
var jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ["https://www.googleapis.com/auth/analytics.readonly"],   // an array of auth scopes
  null
);

//testing google embed analytics
function googleAnalytics(req, res, next){
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
    }
    var access_token = (tokens) ? tokens.access_token : false;
    res.render("dev/googleAnalyticsEmbed.ejs", {
      access_token : access_token
    });
  });
}

//</editor-fold>

//<editor-fold>-------------------------------DEMO LOGIN-------------------------------

var moment = require("moment");
var Descriptions = require("../lib/descriptions.js");

//fake login for demo purposes
function fakeLogin(req, res, next){
  //if user is authenticated in the session, carry on
  if (req.isAuthenticated()){
    console.log("F: Loggin out before fake log in...");
    req.logout();
    req.session.destroy();
    delete req.session;
    delete req.user;
  }

  console.log("F: Attempting to fake log in...");
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  req.login({
    id : false,
    type : 2,
    username : "DomaHubDemo",
    email : "general@domahub.com",
    paypal_email : "general@domahub.com",
    stripe_account_id : "demo",
    stripe_account : {
      addressline1 : "555 Domain Street",
      addressline2 : null,
      birthday_day : 1,
      birthday_month : 1,
      birthday_year : 1970,
      charges_enabled : true,
      city : "Domain City",
      country : "US",
      first_name : "DomaHub",
      last_name : "Demo",
      postal_code : "11111",
      state : "CA",
      transfers_enabled : true,
    },
    stripe_customer_id : "demo",
    stripe_customer : {
      brand : "Visa",
      charges : [],
      last4 : "1234",
      upcoming_invoice : {
        amount_due : 500,
        date : moment().endOf("month").valueOf()
      }
    },
    stripe_subscription_id : "demo",
    stripe_subscription : {
      cancel_at_period_end : false,
      created : moment().valueOf(),
      current_period_end : moment().endOf("month").valueOf()
    },
    listings : [
      {
        id : "demo1",
        domain_name : "cooldomains.com",
        status : 1,
        verified : 1,
        min_price : 10000,
        buy_price : 25000,
        date_created : moment().add(6, "day").subtract(1, "year").valueOf(),
        date_expire : moment().add(6, "day").valueOf(),
        categories : "hightraffic industry other startup",
        description : Descriptions.random(),
        registrar_cost : 12.00,
        registrar_name : "GoDaddy, LLC",
        rentable : 1,
        offers_count : 1,
        price_type : "month",
        price_rate : 200,
        paths : "",
        offers : [
          {
            accepted : null,
            bin : null,
            deadline : null,
            domain_name : "mycooldomains.com",
            email : "dave@buyer.com",
            id : false,
            message : "Hey, this is an amazing domain. I'm interested in purchasing it. Let's talk.",
            name : "Dave Johnson",
            offer : 10000,
            phone : "+1 111-222-3333",
            response : null,
            timestamp : moment().valueOf(),
            user_ip : null
          }
        ]
      },
      {
        id : "demo2",
        domain_name : "mycooldomain.com",
        status : 1,
        verified : 1,
        min_price : 3000,
        buy_price : 5000,
        rented : 1,
        date_created : moment().add(1, "month").subtract(1, "year").valueOf(),
        date_expire : moment().add(1, "month").valueOf(),
        categories : "industry other startup",
        description : Descriptions.random(),
        registrar_cost : 12.00,
        registrar_name : "GoDaddy, LLC",
        rentable : 1,
        offers_count : 0,
        price_type : "week",
        price_rate : 25,
        paths : "",
        offers : [
          {
            accepted : 0,
            bin : null,
            deadline : null,
            domain_name : "mycooldomains.com",
            email : "suspicious@dude.com",
            id : false,
            message : "Hey, let me buy this domain please.",
            name : "Suspicious Buyer",
            offer : 3000,
            phone : "+1 222-222-2222",
            response : null,
            timestamp : moment().valueOf(),
            user_ip : null
          }
        ]
      },
      {
        id : "demo3",
        domain_name : "abc.xyz",
        status : 1,
        verified : 1,
        min_price : 100000,
        buy_price : 0,
        date_created : moment().valueOf(),
        date_expire : moment().add(1, "year").valueOf(),
        categories : "brandable business career industry keywords other promotion startup technology",
        description : Descriptions.random(),
        registrar_cost : 12.00,
        registrar_name : "GoDaddy, LLC",
        rentable : 1,
        offers_count : 3,
        price_type : "month",
        price_rate : 5000,
        paths : "",
        offers : [
          {
            accepted : null,
            bin : null,
            deadline : null,
            domain_name : "abc.xyz",
            email : "sarah@domainers.com",
            id : false,
            message : "OMG this is an amazing deal...let's negotiate.",
            name : "Sarah C",
            offer : 100005,
            phone : "+1 111-222-3333",
            response : null,
            timestamp : moment().subtract(5, "day").valueOf(),
            user_ip : null
          },
          {
            accepted : null,
            bin : null,
            deadline : null,
            domain_name : "abc.xyz",
            email : "lisa@buyer.com",
            id : false,
            message : "Hello, please let me purchase this domain for my next venture.",
            name : "Lisa K",
            offer : 100000,
            phone : "+1 999-888-2255",
            response : null,
            timestamp : moment().subtract(3, "day").valueOf(),
            user_ip : null
          },
          {
            accepted : null,
            bin : null,
            deadline : null,
            domain_name : "abc.xyz",
            email : "john@highroller.com",
            id : false,
            message : "You won't get a better offer elsewhere. I'll match whatever you get.",
            name : "John",
            offer : 150000,
            phone : "+1 999-999-9999",
            response : null,
            timestamp : moment().valueOf(),
            user_ip : null
          }
        ]
      },
      {
        id : "demo4",
        domain_name : "goingon.holiday",
        status : 1,
        verified : 1,
        min_price : 2000,
        buy_price : 0,
        date_created : moment().add(5, "month").subtract(1, "year").valueOf(),
        date_expire : moment().add(5, "month").valueOf(),
        categories : "event hightraffic holiday kids lifestyle niche other personal promotion shopping toys travel",
        description : Descriptions.random(),
        registrar_cost : 9.99,
        registrar_name : "Namecheap, LLC",
        rentable : 0,
        offers_count : 0,
        price_type : "day",
        price_rate : 50,
        paths : "",
        offers : []
      },
      {
        id : "demo5",
        domain_name : "unverifieddomain.com",
        status : 0,
        verified : null,
        min_price : 10000,
        buy_price : 25000,
        date_created : moment(),
        date_expire : moment().add(1, "year").valueOf(),
        categories : "hightraffic industry other startup",
        description : Descriptions.random(),
        registrar_cost : 9.99,
        registrar_name : "NameCheap, LLC",
        rentable : 1,
        offers_count : 0,
        price_type : "month",
        price_rate : 200,
        paths : "",
        offers : []
      },
      {
        id : "demo6",
        domain_name : "mysolddomain.com",
        status : 0,
        deposited : 1,
        transferred : 1,
        accepted : 1,
        verified : 1,
        min_price : 5000,
        buy_price : 25000,
        date_created : moment(),
        date_expire : moment().add(1, "year").valueOf(),
        categories : "hightraffic industry other startup",
        description : Descriptions.random(),
        registrar_cost : 9.99,
        registrar_name : "NameCheap, LLC",
        rentable : 1,
        offers_count : 0,
        price_type : "month",
        price_rate : 200,
        paths : "",
        offers : [
          {
            accepted : 1,
            bin : 1,
            deposited : 1,
            transferred : 1,
            deadline : moment().subtract(1, "week"),
            domain_name : "mysolddomain.com",
            email : "jack@leezak.com",
            id : false,
            message : "Great price, great domain, I'll take it.",
            name : "JackL",
            offer : 25000,
            phone : "+1 123-123-1234",
            response : "Sounds great, Jack. Thanks.",
            timestamp : moment().subtract(1, "week").valueOf(),
            user_ip : null
          },
        ]
      }
    ],
  }, function(err){
    res.redirect("/profile");
  });
}

//</editor-fold>
