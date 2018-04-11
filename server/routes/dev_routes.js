//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require('../models/account_model.js');
var listing_model = require('../models/listing_model.js');
var data_model = require('../models/data_model.js');
var encryptor = require('../lib/encryptor.js');
var mailer = require('../lib/mailer.js');

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

  //get parked pages and emails
  app.get("/parked/:date", findParkedDomains);

  //parse cold contact excel
  app.get("/parsecontacts/:date/:verbose", parseFolder);
  app.get("/parsejsons/:date/", parseJSON);

  //mailchimp test
  app.get("/monkey", monkey);

  //registrar tests
  app.get("/godaddy", godaddy);
  app.get("/namecheap", namecheap);
  app.get("/namesilo", namesilo);

  //general tests for domains
  app.get("/dns/:domain_name", dnsCheck);
  app.get("/whois/:domain_name", whoisCheck);
  app.get("/request/:domain_name", requestCheck);

  //google embed analytics
  app.get("/google", googleAnalytics);

  //paypal payouts
  app.get("/paypal", paypal);

  //</editor-fold>

}

//<editor-fold>-------------------------------CHECK PARKED-------------------------------------

//godaddy production (1min)
var godaddy_api_prod_1min = "9uBcCfxCjPd_FiwFzPXoaj9ubPzzPpsQVW";
var godaddy_secret_prod_1min = "FiwHuAgZ13PpiVDvDVpEB2";
var fs = require("fs");
var whois = require("whois");
var parser = require('parse-whois');
var moment = require('moment');

//filters for bad emails
var no_bueno_email_strings = [
  "domain",
  "private",
  "privacy",
  "proxy",
  "protect",
  "whois",
  "admin",
  "hosting",
  "hostmaster",
  "realestate",
  "registrar",
  "support@",
  "service@",
  "info@",
  "dns@",
  "@anonymize.com",
  "@anonymous.validname.com",
  "@obscure.me",
  "@newvcorp.com",
  "@idshield.tk",
  "@webnode.com",
  "@secretregistration.com",
  "@filteredemailaddress.com",
  "@eliminatejunkemail.com",
  "@nojunkemailaddress.com",
  "@spamfree.bookmyname.com",
  "@simplesite.com",
  "@iddp.net",
  "registry@loopia.se",
  "forsale@epik.com",
  "o-w-o.info",
  "dotcommedia.com",
  "yummynames.com",
  "dropcatch.com",
  "contact.gandi.net",
  "justhost.com",
  "xserver.co.jp",
]

//filters for bad names
var no_bueno_names = [
  "domain",
  "hosting",
  "internet",
  "limited",
  "hostmaster",
  "hostmonster",
  "registry",
  "bluehost",
  "support",
  "namesecure",
  "foundation",
  "limited",
  "admin",
  "@",
  "inc.",
]

//filters for parked pages
var parked_strings = [
  "mcc.godaddy.com",
  "www.imena.ua",
  "parked.easydns.com",
  "namebrightstatic.com",
  "onamae.com/parking",
  "gandi.net",
  "cdnpark.com",
  "name.com",
  "sedoparking",
  "bluehost - top rated web hosting provider",
  "parkingcrew",
  "parkdomain",
  "domainpark",
  "domain parking",
  "domainparking",
  "domain name is registered and parked",
  "domain name is parked",
  "domain parked by europe",
  "parked free of charge",
  "parked at loopia",
  "parked page for domain names",
  "this domain is parked",
  "this domain name is parked",
  "this web page is parked free",
  "dondominio parking",
  "web hosting from just host",
  "courtesy of www.hostmonster.com",
  "would you like to buy this domain",
  "sk-logabpstatus.php",
]

//find parked domains on godaddy
function findParkedDomains(req, res, next){

  //close connection
  res.sendStatus(200);

  //hash for already retrieved/seen
  var domains_seen = JSON.parse(fs.readFileSync("./other/marketing/cold/domains_seen_obj.json", "utf8"));
  var emails_seen = {};
  JSON.parse(fs.readFileSync("./other/marketing/cold/emails_seen.json", "utf8")).forEach(function(elem){
    emails_seen[elem.admin_email] = true;
    emails_seen[elem.tech_email] = true;
    emails_seen[elem.registrant_email] = true;
    domains_seen[elem.domain_name] = true;
  });

  filterAndSortEmails();

  //word bank + words already used
  var words = JSON.parse(fs.readFileSync("./other/marketing/cold/words.json", "utf8"));
  var date_today = (req.params.date) ? moment(req.params.date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");

  //build domain list promises
  var domain_promises = [];
  for (var x = 0 ; x < words.length ; x++){

    // //godaddy
    // domain_promises.push(get_godaddy_recommended_domains(
    //   words[x],
    //   x,
    //   words.length,
    //   domains_seen,
    //   emails_seen
    // ));

    //domain scope
    domain_promises.push(get_domainscope_domains(
      words[x],
      x,
      words.length,
      domains_seen,
      emails_seen,
      date_today
    ));
  }

  console.log("--------------------------------------------------------------");
  console.log("----------------------FINDING DOMAINS-------------------------");
  console.log("-------------------------" + date_today + "---------------------------");
  console.log("--------------------------------------------------------------");

  //get all godaddy recommended premium domains
  var limit = qlimit(2);     //limit parallel promises (throttle)
  Q.allSettled(domain_promises.map(limit(function(item, index, collection){
    return domain_promises[index]();
  }))).then(function(results) {
    filterAndSortEmails(function(){
      console.log("Done");
    });
  });

}

//check if there are any bad emails and sort the good ones
function filterAndSortEmails(callback){
  console.log("Removing bad email domains and sorting...");
  var emails_done = JSON.parse(fs.readFileSync("./other/marketing/cold/emails.json", "utf8"));
  emails_done = emails_done.filter(function(email_obj){
    //find and remove bad emails
    return no_bueno_email_strings.every(function(bad_email_str){
      var admin_check = (email_obj.admin_email) ? email_obj.admin_email.indexOf(bad_email_str) == -1 : false;
      var tech_check = (email_obj.tech_email) ? email_obj.tech_email.indexOf(bad_email_str) == -1 : false;
      var registrant_check = (email_obj.registrant_email) ? email_obj.registrant_email.indexOf(bad_email_str) == -1 : false;

      //remove if bad
      if (email_obj.admin_email && !admin_check){
        email_obj.admin_email = "";
      }
      if (email_obj.tech_email && !tech_check){
        email_obj.tech_email = "";
      }
      if (email_obj.registrant_email && !registrant_check){
        email_obj.registrant_email = "";
      }
      return (admin_check || tech_check || registrant_check);
    });
  });
  emails_done.sort(function(a, b){
    return (a.domain_name == b.domain_name) ? 0 : (a.domain_name > b.domain_name) ? 1 : -1;
  });
  fs.writeFileSync("./other/marketing/cold/emails.json", JSON.stringify(emails_done, null, 4));

  if (callback){
    callback();
  }
}

//promise to get godaddy list of premium domains based on a word
function get_godaddy_recommended_domains(word, index, total, domains_seen, emails_seen){
  return function(){
    return Q.Promise(function(resolve, reject, notify){
      console.log("-----------------------------------Word #" + (index + 1) + "/" + total + " - " + word);
      request({
        url: "https://find.godaddy.com/domainsapi/v1/search/spins?pagestart=0&tlds=com,co,net&source=premium&pagesize=1000&key=dpp_search&q=" + word,
        method: "GET",
        json : true
      }, function(err, response, body){
        buildWhoIsPromises(domains_seen, emails_seen, resolve, reject, body["RecommendedDomains"], word, "Fqdn");
      });
    });
  }
}

//promise to get domains from domainscope
function get_domainscope_domains(word, index, total, domains_seen, emails_seen, date){
  return function(){
    return Q.Promise(function(resolve, reject, notify){
      console.log("-----------------------------------Word #" + (index + 1) + "/" + total + " (" + word + ") - " + date);
      request({
        url: "https://domainscope.com/domainview/trending?keywords=" + word + "&startDate=" + date + "&endDate=" + date,
        method: "GET",
        json : true
      }, function(err, response, body){
        buildWhoIsPromises(domains_seen, emails_seen, resolve, reject, body.domains, word, false);
      });
    });
  }
}

//function to build whois promises from list of domains
function buildWhoIsPromises(domains_seen, emails_seen, resolve, reject, domains, word, property_name){

  var whois_promises = [];
  if (domains){
    for (var x = 0 ; x < domains.length ; x++){
      //havent seen this domain before
      var cur_domain = (property_name) ? domains[x][property_name].toLowerCase() : domains[x].toLowerCase();
      if (!domains_seen[cur_domain]){
        whois_promises.push(getwhois_promise(cur_domain, word));
        domains_seen[cur_domain] = true;
      }
    }
  }

  console.log("-----------------------------------Total domains : " + Object.keys(domains_seen).length);
  fs.writeFileSync("./other/marketing/cold/domains_seen_obj.json", JSON.stringify(domains_seen, null, 4), "utf8");

  //go ahead and try new domains
  var limit = qlimit(2);     //limit parallel promises (throttle)
  Q.allSettled(whois_promises.map(limit(function(item, index, collection){
    return whois_promises[index]();
  }))).then(function(results) {
    var successful_domains = [];
    for (var y = 0 ; y < results.length ; y++){
      if (results[y].state == "fulfilled" &&
      (!emails_seen[results[y].value.admin_email] ||
        !emails_seen[results[y].value.tech_email] ||
        !emails_seen[results[y].value.registrant_email])
      ){
        console.log("\x1b[33m%s\x1b[0m", "NEW EMAIL ADDED - " + results[y].value.domain_name + " - " + results[y].value.registrant_email);
        successful_domains.push(results[y].value);
        if (results[y].value.admin_email){
          emails_seen[results[y].value.admin_email] = true;
        }
        if (results[y].value.tech_email){
          emails_seen[results[y].value.tech_email] = true;
        }
        if (results[y].value.registrant_email){
          emails_seen[results[y].value.registrant_email] = true;
        }
      }
    }

    //if we got an email
    if (successful_domains.length > 0){
      overwriteEmailFile(word, "./other/marketing/cold/emails.json", successful_domains, function(){
        overwriteEmailFile(false, "./other/marketing/cold/emails_seen.json", successful_domains, resolve);
      });
    }
    else {
      reject();
    }
  });
}

function overwriteEmailFile(word, file_path, successful_domains, resolve){
  if (word){
    console.log("Total emails from '" + word + "' : " + successful_domains.length);
  }
  fs.readFile(file_path, function (err, data) {
    try {
      var json = JSON.parse(data);
      json = json.concat(successful_domains);
    } catch (e) {
      var json = successful_domains;
      if (word){
        console.log("\x1b[41m%s\x1b[0m", "Total emails so far : " + json.length);
      }
    } finally {
      fs.writeFile(file_path, JSON.stringify(json, null, 4), function(){
        resolve();
      });
    }
  });
}

function fillInBlank(comparing, target1, target2){
  return (target1 == "") ? target2 : target1;
}

function getwhois_promise(domain_name, intial_word){
  return function(){
    return Q.Promise(function(resolve, reject, notify){
      console.log("WHOIS - " + domain_name);

      //look up domain owner info
      whois.lookup(domain_name,{
        "follow":  10    // number of times to follow redirects
      }, function(err, data){
        var whoisObj = {};
        if (data && !err){
          var array = parser.parseWhoIsData(data);
          for (var x = 0; x < array.length; x++){
            whoisObj[array[x].attribute.trim()] = array[x].value;
          }

          if (whoisObj["Admin Email"] || whoisObj["Tech Email"] || whoisObj["Registrant Email"]){
            var admin_email = (whoisObj["Admin Email"]) ? whoisObj["Admin Email"].toLowerCase() : "";
            var tech_email = (whoisObj["Tech Email"]) ? whoisObj["Tech Email"].toLowerCase() : "";
            var registrant_email = (whoisObj["Registrant Email"]) ? whoisObj["Registrant Email"].toLowerCase() : "";

            //check if there are any bad emails
            var any_good = no_bueno_email_strings.every(function(bad_email_str){
              var admin_check = (admin_email != "") ? admin_email.indexOf(bad_email_str) == -1 : false;
              var tech_check = (tech_email != "") ? tech_email.indexOf(bad_email_str) == -1 : false;
              var registrant_check = (registrant_email != "") ? registrant_email.indexOf(bad_email_str) == -1 : false;

              //remove if bad
              if (!admin_check){
                admin_email = "";
              }
              if (!tech_check){
                tech_email = "";
              }
              if (!registrant_check){
                registrant_email = "";
              }
              return (admin_check || tech_check || registrant_check);
            });

            if (any_good && (admin_email != "" || tech_email != "" || registrant_email != "")){
              //check if website is parked
              // console.log("FOUND EMAIL - " + domain_name + " - " + registrant_email);
              request.get({
                url: "http://" + domain_name,
                timeout: 100000,
                headers : {
                  'User-Agent' : "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"
                }
              }, function (err, response, body) {
                if (!err && body){

                  //why it was marked parked
                  var strings = [];
                  var parked = parked_strings.some(function(parked_string){
                    var exists = response.body.toLowerCase().indexOf(parked_string) != -1;
                    if (exists){
                      strings.push(parked_string);
                    }
                    return exists;
                  });

                  //is it potentially parked or parked?
                  var potentially_parked = false;
                  var potentially_parked_strings = [];
                  if (parked){
                    console.log("\x1b[44m%s\x1b[0m" ,"PARKED!!! - " + domain_name + " - " + JSON.stringify(strings));
                  }
                  else {
                    var park_potential = (response.body.toLowerCase().indexOf("park") != -1) ? "park" : "";
                    var domain_potential = (response.body.toLowerCase().indexOf("domain") != -1) ? "domain" : "";

                    //why was it potentially parked?
                    if (park_potential != "" || domain_potential  != ""){
                      console.log("\x1b[41m%s\x1b[0m", "Potentially parked - " + domain_name + " (" + park_potential + " " + domain_potential + ")");
                      var potentially_parked = true;
                      if (park_potential != ""){
                        potentially_parked_strings.push(park_potential);
                      }
                      if (domain_potential != ""){
                        potentially_parked_strings.push(domain_potential);
                      }
                    }
                  }

                  //figure out names
                  if (whoisObj["Admin Name"] || whoisObj["Tech Name"] || whoisObj["Registrant Name"]){
                    var admin_name = (whoisObj["Admin Name"]) ? whoisObj["Admin Name"].toLowerCase() : "";
                    var tech_name = (whoisObj["Tech Name"]) ? whoisObj["Tech Name"].toLowerCase() : "";
                    var registrant_name = (whoisObj["Registrant Name"]) ? whoisObj["Registrant Name"].toLowerCase() : "";

                    //check if there are any bad names
                    no_bueno_names.some(function(bad_name){
                      var admin_check = (admin_name != "") ? admin_name.indexOf(bad_name) != -1 : false;
                      var tech_check = (tech_name != "") ? tech_name.indexOf(bad_name) != -1 : false;
                      var registrant_check = (registrant_name != "") ? registrant_name.indexOf(bad_name) != -1 : false;

                      //remove if bad
                      if (admin_check){
                        admin_name = "";
                      }
                      if (tech_check){
                        tech_name = "";
                      }
                      if (registrant_check){
                        registrant_name = "";
                      }
                      return (admin_check || tech_check || registrant_check);
                    });
                  }
                  else {
                    var admin_check = "";
                    var tech_check = "";
                    var registrant_check = "";
                  }

                  var admin_name = toTitleCase(admin_name);
                  var tech_name = toTitleCase(tech_name);
                  var registrant_name = toTitleCase(registrant_name);

                  resolve({
                    domain_name : domain_name.toLowerCase(),
                    parked : parked,
                    admin_email : (admin_email == "") ? fillInBlank(admin_email, tech_email, registrant_email) : admin_email,
                    tech_email : (tech_email == "") ? fillInBlank(tech_email, admin_email, registrant_email) : tech_email,
                    registrant_email : (registrant_email == "") ? fillInBlank(registrant_email, tech_email, admin_email) : registrant_email,
                    admin_name : (admin_name == "") ? fillInBlank(admin_name, tech_name, registrant_name) : admin_name,
                    tech_name : (tech_name == "") ? fillInBlank(tech_name, admin_name, registrant_name) : tech_name,
                    registrant_name : (registrant_name == "") ? fillInBlank(registrant_name, tech_name, admin_name) : registrant_name,
                    intial_word : intial_word,
                    parked_strings : strings,
                    potentially_parked : potentially_parked,
                    potentially_parked_strings : potentially_parked_strings,
                  });
                }
                else {
                  // console.log("\x1b[41m%s\x1b[0m", "Error in request!");
                  reject();
                }
              });
            }
            else {
              reject();
            }
          }
          else {
            reject();
          }
        }
        else {
          reject();
        }
      });
    });
  }
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
var randomstring = require("randomstring");

//show a specific view
function showView(req, res, next){
  var view_vars = {
    user: "Wonkyu",
    listing_info : {
      domain_name : "testdomain.com",
      primary_color : "#3cbc8d",
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
    response: "Fuck you",
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
    price: "$5034",
    offer_id: 1,
    username: "fuck",
    email: "test@email.com",
    accepted: true,
    offerer_phone: phoneUtil.format(phoneNumber, PNF.INTERNATIONAL),
    phone: phoneUtil.format(phoneNumber, PNF.INTERNATIONAL),
    offer: moneyFormat.to(parseFloat("1231324")),
    verification_code: "Fjj380bnD",
    message: "djkljfljask lfjkldasjfklasdjkldf jaskldfjk asdlfjklsajd klasjdklfjaslk jklasjd flkjskdlf"
  }

  res.render("email/" + req.params.email_template + ".ejs", data);
}

//</editor-fold>

//<editor-fold>-------------------------------EXCEL COLD EMAIL---------------------------------

//research (EXCEL)
var XLSX = require('xlsx');
var q = require("q");
var qlimit = require("qlimit");
var glob = require("glob");
var json2csv = require('json2csv');

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

        console.log("\x1b[0m", "Writing to file...");
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

  q.allSettled(q_promises.map(limit(function(item, index, collection){
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
  console.log("\x1b[0m", "Querying - " + domain_name);
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

//<editor-fold>-------------------------------DOMAIN CHECKS (WHOIS, DNS, REQUEST)-------------------------------

var dns = require('dns');
//use google servers
dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);
function dnsCheck(req, res, next){
  console.log("Checking website...");
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
function whoisCheck(req, res, next){
  console.log("Checking WHOIS...");
  var domain_name = req.params.domain_name;
  whois.lookup(domain_name, {
    // "proxy" : "whois.geektools.com"
    "follow":  10    // number of times to follow redirects
  }, function(err, data){
    var whoisObj = {};
    if (data && !err){
      var array = parser.parseWhoIsData(data);
      for (var x = 0; x < array.length; x++){
        whoisObj[array[x].attribute.trim()] = array[x].value;
      }
      res.send(whoisObj);
    }
  });
}
function requestCheck(req, res, next){
  console.log("Checking website...");
  request.get({
    url: "http://" + req.params.domain_name,
    timeout: 100000,
    headers : {
      'User-Agent' : "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"
    }
  }, function (err, response, body) {
    res.send(response);
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

var namesilo_url = (process.env.NODE_ENV == "dev") ? "http://sandbox.namesilo.com/api" : "https://www.namesilo.com/api";
var namesilo_api = (process.env.NODE_ENV == "dev") ? "aaa3f4cfdcd5faf386a8b" : "1bcd579c7d457db62657ebee";

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

function namesilo(req, res, next){
  console.log("F: namesilo...");

  //get list of DNS records
  request({
    url: namesilo_url + "/dnsListRecords",
    method: "GET",
    timeout: 10000,
    qs : {
      version : 1,
      type : "xml",
      key : namesilo_api,
      domain : "testdomahub1.com",
    }
  }, function(err, response, body){
    parseString(body, {
      trim: true,
      explicitRoot : false,
      explicitArray : false,
    }, function (err, result) {

      //delete all DNS records
      // var delete_dns_promises = [];
      // for (var x = 0 ; x < result.namesilo.reply[0].resource_record.length ; x++){
      //   delete_dns_promises.push(deleteNameSiloDNSRecord("testdomainwoohoohoohoo.com", result.namesilo.reply[0].resource_record[x].record_id[0]));
      // }
      //
      // //deleted all DNS records, now create the two we need
      // Q.allSettled(delete_dns_promises).then(function(results){
      //   res.send(result);
      // });

      //just see the DNS records
      res.send(result);
    });
  });

  //get all domains
  // request({
  //   url: namesilo_url + "/listDomains",
  //   method: "GET",
  //   timeout: 10000,
  //   qs : {
  //     version : 1,
  //     type : "xml",
  //     key : namesilo_api
  //   }
  // }, function(err, response, body){
  //   parseString(body, {
  //     trim: true,
  //     explicitRoot : false,
  //     explicitArray : false,
  //   }, function (err, result) {
  //     res.json(result);
  //   });
  // });

  // register a new domain
  // for (var x = 0 ; x < 20 ; x++){
  //   request({
  //     url: namesilo_url + "/registerDomain",
  //     method: "GET",
  //     timeout: 10000,
  //     qs : {
  //       version : 1,
  //       type : "xml",
  //       key : namesilo_api,
  //       domain : "testdomahub" + x + ".com",
  //       years : 1
  //     }
  //   }, function(err, response, body){
  //     parseString(body, {trim: true}, function (err, result) {
  //       console.log(err, body);
  //       // res.json(result);
  //     });
  //   });
  // }
  // res.send("okay");

  // //add A record for 208
  // request({
  //   url: namesilo_url + "/dnsAddRecord",
  //   method: "GET",
  //   timeout: 10000,
  //   qs : {
  //     version : 1,
  //     type : "xml",
  //     key : namesilo_api,
  //     domain : "testdomainwoohoohoohoo.com",
  //     rrtype : "CNAME",
  //     rrhost : "www",
  //     rrvalue : "testdomainwoohoohoohoo.com",
  //   }
  // }, function(err, response, body){
  //   parseString(body, {trim: true}, function (err, result) {
  //     res.json(result);
  //   });
  // });
}

function deleteNameSiloDNSRecord(domain_name, record_id){
  return q.Promise(function(resolve, reject, notify){
    console.log("F: Setting DNS for NameSilo domain - " + domain_name + "..." + "record " + record_id);

    //delete an existing DNS record
    request({
      url: namesilo_url + "/dnsDeleteRecord",
      method: "GET",
      timeout: 10000,
      qs : {
        version : 1,
        type : "xml",
        key : namesilo_api,
        domain : domain_name,
        rrid : record_id
      }
    }, function(err, response, body){
      parseString(body, function (err, result) {
        if (err){
          reject(err);
        }
        else if (!result || !result.namesilo || !result.namesilo.reply || result.namesilo.reply[0].code != "300"){
          reject();
        }
        else {
          resolve();
        }
      });
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

//<editor-fold>-------------------------------PAYPAL-------------------------------

var paypal_facilitator = "cumin-facilitator@domahub.com";
var paypal_client_id = "AUhTlwR2uAIPU7rdMv5GZLq_sti0j5QTz6fybkCXkEAZ1iKQXFPcolcYAoXB1IUbFFWyjLdzevkhXwI4";
var paypal_secret = "EIT2ZOp7hHqh4RAm2iHJGWGmcFqqiMbctL6zL3Ac-Pezk06kkGe6sO7P3HKzagzIHJ8OryGqVrqZA2TP";

//testing paypal payouts
function paypal(req, res, next){

}

//</editor-fold>
