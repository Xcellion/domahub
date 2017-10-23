//<editor-fold>-------------------------------------------VARIABLES

var account_model = require('../models/account_model.js');
var listing_model = require('../models/listing_model.js');
var data_model = require('../models/data_model.js');
var validator = require('validator');
var request = require('request');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var dns = require("dns");
var randomstring = require("randomstring");
var awis = require('awis');
var node_env = "dev";
var path = require('path');
var fs = require('fs');
var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
var stripe_key = (node_env == "dev") ? "sk_test_PHd0TEZT5ytlF0qCNvmgAThp" : "sk_live_Nqq1WW2x9JmScHxNbnFlORoh";
var stripe = require("stripe")(stripe_key);
var XLSX = require('xlsx');
var Q = require("Q");
var qlimit = require("qlimit");
var glob = require("glob");
var json2csv = require('json2csv');
var whois = require("whois");
var parser = require('parse-whois');
var parseDomain = require('parse-domain');

//</editor-fold>

module.exports = function(app, db, auth, error){
  Auth = auth;
  Account = new account_model(db);
  Listing = new listing_model(db);
  Data = new data_model(db);

  app.get("/emailviews/:email_template", emailViews);
  app.get("/createcodes/:number", [
    createCouponCodes
  ]);
  app.get("/viewstest/:path/:view_name", showView);
  app.get("/stripe/subscription/:stripe_subscription_id", getStripeSubscription);

  //parse cold contact excel
  app.get("/parsecontacts/:date/:verbose", parseFolder);
  app.get("/parsejsons/:date/", parseJSON);

  //analysis
  app.get("/analysis/searchhistory", analysisSearchHistory);
  app.get("/analysis/:domain_name", analysisDomainTraffic);

}

//<editor-fold>-------------------------------DEV-------------------------------------

//show a specific view
function showView(req, res, next){
  var view_vars = {
    listing_info : {
      domain_name : "testdomain.com",
      primary_color : "#e86666",
      premium: true,
    },
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

//testing alexa get
function alexa(req, res, next){
  if (req.params.domain_name){
    console.log("F: Getting Alexa traffic information for " + req.params.domain_name);
    var client = awis({
      key: "AKIAJVS3NZJHFWJ7QKKA",
      secret: "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"
    });

    // UrlInfo - get information about pages and sites on the web - their traffic, content, and related sites
    // TrafficHistory - get a history of traffic rank
    // CategoryBrowse, CategoryListings - get lists of sites within a specific category ordered by traffic rank, or create a browseable directory of websites
    // SitesLinkingIn - get a list of sites linking in to a specified site

    client({
      'Action': 'TrafficHistory',
      'Url': req.params.domain_name,
      'ResponseGroup': 'History'
      // 'ResponseGroup': 'RelatedLinks,Categories,Rank,RankByCountry,UsageStats,AdultContent,Speed,Language,OwnedDomains,LinksInCount,SiteData'
    }, function (err, data) {
      if(err) { console.log(err); return; }
      res.send(data);
    });
  }
  else {
    res.send("you need a domain name");
  }
}

//function to create X sign up codes
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
    Account.createCouponCodes(codes, function(result){
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

//<editor-fold>-----------------------------STRIPE---------------------------------

function getStripeSubscription(req, res, next){
  stripe.subscriptions.retrieve(req.params.stripe_subscription_id, function(err, subscription){
    if (err) throw err;
    res.json(subscription);
  });
}

//</editor-fold>

//<editor-fold>-----------------------------ANALYSIS---------------------------------

//function to analyze traffic funnel
function analysisDomainTraffic(req, res, next){
  var domain_name = req.params.domain_name;

  var traffic = {
    domain_name : domain_name
  };

  Data.getRentalTraffic(domain_name, function(result){
    traffic.rental_views = result.info;

    Data.getListingRentalTraffic(domain_name, function(result){
      traffic.listing_rental_views = result.info;

      Data.getAvailCheckHistory(domain_name, function(result){
        traffic.avail_check_history = {
          length: result.info.length,
          data: result.info
        }

        Data.getCheckoutHistory(domain_name, function(result){
          traffic.checkout_history = {
            length: result.info.length,
            data: result.info
          }

          Data.getCheckoutActions(domain_name, function(result){
            traffic.checkout_actions = {
              length: result.info.length,
              data: result.info
            }
            res.render("dev/domainAnalysis.ejs", {
              traffic: traffic
            });
          });
        });
      });
    });
  });
}

//function to analyze traffic
function analysisSearchHistory(req, res, next){
  Data.getDemoDomains(function(demo_domains){
    Data.getReferers(function(referers){
      res.render("dev/searchHistory.ejs", {
        demo_domains: demo_domains.info,
        referers: referers.info
      });
    })
  });
}

//</editor-fold>

//<editor-fold>-----------------------------COLD EMAIL---------------------------------

//function to parse all xlsx files in a folder
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

//function to parse all JSONs in a folder and combine them
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

//function to build cold contacts from excel sheet
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

//function to make proper nouns titlecase
function toTitleCase(str){
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

//</editor-fold>
