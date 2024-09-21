//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require("../models/account_model.js");
var listing_model = require("../models/listing_model.js");
var general_functions = require("../controller/general_functions.js");
var data_model = require("../models/data_model.js");
var encryptor = require("../lib/encryptor.js");
var mailer = require("../lib/mailer.js");

//#endregion

//#region -------------------------------VARIABLES-------------------------------

var validator = require("validator");
var request = require("request");

//#endregion

module.exports = function (app) {
  //#region -------------------------------ROUTES-------------------------------

  //test views
  app.get("/emailviews/:email_template", emailViews);
  app.get("/viewstest/:path/:view_name", showView);

  //get parked pages and emails, take screenshot, upload to imgur, upload to sendgrid
  app.get(["/parked", "/parked/:date"], renderParkedAdminpage);
  app.post(["/getparked", "/getparked/:date"], getParkedDomains);
  app.post("/sendparked/:date", sendParkedContacts);

  //test functions for parked contact emailing
  app.post("/rebuildcsv/:date", rebuildCSV);
  app.post("/retakescreenshots/:date", [
    general_functions.urlencodedParser,
    retakeScreenshots,
  ]);
  app.get("/screenshot/:domain_name/:which_screenshots", screenshotDomain);
  app.get("/checklist/:date", createFinalChecklistOnly);

  //registrar tests
  app.get("/godaddy", godaddy);
  app.get("/namecheap", namecheap);
  app.get("/namesilo", namesilo);

  //general tests for domains
  app.get("/dns/:domain_name", dnsCheck);
  app.get("/whois/:domain_name", whoisCheck);
  app.get("/request/:domain_name", requestCheck);

  //#endregion
};

//#region -------------------------------PERMANENT-------------------------------------

//#region -------------------------------EMAIL VIEWER-------------------------------------

var PNF = require("google-libphonenumber").PhoneNumberFormat;
var phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();
var randomstring = require("randomstring");

//show a specific view
function showView(req, res, next) {
  var view_vars = {
    user: "Wonkyu",
    listing_info: {
      domain_name: "testdomain.com",
      primary_color: "#3cbc8d",
      premium: true,
      logo: "",
      compare: false,
    },
    compare: false,
    offer_info: {
      name: "WOFJ",
      verification_code: "fdjasks",
    },
  };
  res.render(req.params.path + "/" + req.params.view_name, view_vars);
}

//to read email templates
function emailViews(req, res, next) {
  var wNumb = require("wnumb");
  var moneyFormat = wNumb({
    thousand: ",",
    prefix: "$",
    decimals: 0,
  });

  var phoneNumber = phoneUtil.parse("+6666666666");

  var data = {
    domain_name: "fuck.com",
    premium: false,
    response: "Fuck you",
    listing_info: {
      primary_color: "#000",
    },
    user: {
      username: "Blake Griffin",
    },
    token: "",
    name: "offerer",
    owner_name: "OWNERFUCK",
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
    message:
      "djkljfljask lfjkldasjfklasdjkldf jaskldfjk asdlfjklsajd klasjdklfjaslk jklasjd flkjskdlf",
  };

  res.render("email/" + req.params.email_template + ".ejs", data);
}

//#endregion

//#region -------------------------------DOMAIN CHECKS (WHOIS, DNS, REQUEST)-------------------------------

var dns = require("dns");
//use google servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);
function dnsCheck(req, res, next) {
  console.log("Checking website...");
  var domain_name = req.params.domain_name;
  dns.resolve(domain_name, "A", function (err, address, family) {
    var domain_ip = address;
    dns.resolve("domahub.com", "A", function (err, address, family) {
      var doma_ip = address;
      if (
        err ||
        !domain_ip ||
        !address ||
        domain_ip[0] != address[0] ||
        domain_ip.length != 1
      ) {
        res.send(
          "<h1>oh no</h1></br>" +
            req.params.domain_name +
            " - " +
            domain_ip +
            "</br>domahub - " +
            doma_ip
        );
      } else {
        res.send(
          "<h1>oh yeah</h1></br>" +
            req.params.domain_name +
            " - " +
            domain_ip +
            "</br>domahub - " +
            doma_ip
        );
      }
    });
  });
}
function whoisCheck(req, res, next) {
  console.log("Checking WHOIS...");
  var domain_name = req.params.domain_name;
  whois.lookup(
    domain_name,
    {
      timeout: 10000, // timeout
    },
    function (err, data) {
      var whoisObj = {};
      if (data && !err) {
        var array = parser.parseWhoIsData(data);
        for (var x = 0; x < array.length; x++) {
          whoisObj[array[x].attribute.trim()] = array[x].value;
        }
        res.send(whoisObj);
      } else {
        console.log(err);
      }
    }
  );
}
function requestCheck(req, res, next) {
  console.log("Checking website...");
  request.get(
    {
      url: "http://" + req.params.domain_name,
      timeout: 100000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
      },
    },
    function (err, response, body) {
      res.send(response);
    }
  );
}

//#endregion

//#region -------------------------------REGISTRARS-------------------------------

//godaddy production (1min)
// var godaddy_api_prod = "9uBcCfxCjPd_FiwFzPXoaj9ubPzzPpsQVW";
// var godaddy_secret_prod = "FiwHuAgZ13PpiVDvDVpEB2";
// var godaddy_customer_num = "55666970";

//godaddy production (robert)
var godaddy_api_prod = "";
var godaddy_secret_prod = "";
var godaddy_customer_num = "";

var namecheap_url =
  process.env.NODE_ENV == "dev"
    ? "https://api.sandbox.namecheap.com/xml.response"
    : "https://api.namecheap.com/xml.response";
var namecheap_api_key = "";
var namecheap_username = "domahub";
var parseString = require("xml2js").parseString;

var namesilo_url =
  process.env.NODE_ENV == "dev"
    ? "http://sandbox.namesilo.com/api"
    : "https://www.namesilo.com/api";
var namesilo_api =
  process.env.NODE_ENV == "dev"
    ? "aaa3f4cfdcd5faf386a8b"
    : "1bcd579c7d457db62657ebee";

function godaddy(req, res, next) {
  request(
    {
      url: "https://api.godaddy.com/v1/domains/cALEntopia.com/records/A",
      method: "PUT",
      json: true,
      body: [
        {
          name: "@",
          data: "208.68.37.82",
        },
      ],
      headers: {
        "X-Shopper-Id": godaddy_customer_num,
        Authorization:
          "sso-key " + godaddy_api_prod + ":" + godaddy_secret_prod,
      },
    },
    function (err, response, body) {
      console.log(response.statusCode);
      res.json(body);
    }
  );
}

function namecheap(req, res, next) {
  console.log("F: namecheap..." + namecheap_url);
  request(
    {
      url: namecheap_url,
      method: "POST",
      qs: {
        ApiKey: namecheap_api_key,
        ApiUser: namecheap_username,
        UserName: namecheap_username,
        ClientIp: "208.68.37.82",
        Command: "namecheap.domains.dns.setHosts",
        SLD: "domahubdomain1",
        TLD: "com",
        HostName1: "@",
        RecordType1: "A",
        Address1: "208.68.37.82",
        HostName2: "www",
        RecordType2: "CNAME",
        Address2: "domahubdomain1.com",
      },
    },
    function (err, response, body) {
      console.log(response.statusCode);
      parseString(body, { trim: true }, function (err, result) {
        res.json(result);
      });
    }
  );
}

function namesilo(req, res, next) {
  console.log("F: namesilo...");

  //get list of DNS records
  request(
    {
      url: namesilo_url + "/dnsListRecords",
      method: "GET",
      timeout: 10000,
      qs: {
        version: 1,
        type: "xml",
        key: namesilo_api,
        domain: "testdomahub1.com",
      },
    },
    function (err, response, body) {
      parseString(
        body,
        {
          trim: true,
          explicitRoot: false,
          explicitArray: false,
        },
        function (err, result) {
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
        }
      );
    }
  );

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

function deleteNameSiloDNSRecord(domain_name, record_id) {
  return q.Promise(function (resolve, reject, notify) {
    console.log(
      "F: Setting DNS for NameSilo domain - " +
        domain_name +
        "..." +
        "record " +
        record_id
    );

    //delete an existing DNS record
    request(
      {
        url: namesilo_url + "/dnsDeleteRecord",
        method: "GET",
        timeout: 10000,
        qs: {
          version: 1,
          type: "xml",
          key: namesilo_api,
          domain: domain_name,
          rrid: record_id,
        },
      },
      function (err, response, body) {
        parseString(body, function (err, result) {
          if (err) {
            reject(err);
          } else if (
            !result ||
            !result.namesilo ||
            !result.namesilo.reply ||
            result.namesilo.reply[0].code != "300"
          ) {
            reject();
          } else {
            resolve();
          }
        });
      }
    );
  });
}

//#endregion

//#endregion

//#region -------------------------------COLD EMAIL PARKED DOMAIN OWNERS-------------------------------------

//#region -------------------------------VARIABLES / HELPERS-------------------------------------

var fs = require("fs");
var path = require("path");
var whois = require("whois");
var parser = require("parse-whois");
var moment = require("moment");
var Q = require("q");
var qlimit = require("qlimit");

//test mode or serious mode
// var test_mode = true;
var test_mode = false;
var test_date = "2018-02-28";

//screenshot + imgur upload
const puppeteer = require("puppeteer");
var imgur_mashape_key = "72Ivh0ASpImsh02oTqa4gJe0fD3Dp1iZagojsn1Yt1hWAaIzX3";
var imgur_mashape_authorization = "Client-ID e67be8dd932733c";

//sendgrid
const sendgrid_client = require("@sendgrid/client");
var human = require("humanparser");
var sendgrid_marketing_campaign_key =
  "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";
sendgrid_client.setApiKey(sendgrid_marketing_campaign_key);
var sendgrid_prod_list_url = "/v3/contactdb/lists/2943731/recipients";
var sendgrid_test_list_url = "/v3/contactdb/lists/2943108/recipients";
var json2csv = require("json2csv");
var csv2json = require("csvtojson");

//make proper nouns titlecase
function toTitleCase(str) {
  if (str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  } else {
    return "";
  }
}

//if comparing == blank, check target1 & target2
function fillInBlank(comparing, target1, target2) {
  return target1 == "" ? target2 : target1;
}

//#endregion

//#region -------------------------------FILTER ARRAYS-------------------------------------

//filters for bad emails
var no_bueno_email_strings = [
  "@easydns.com",
  "@anonymize.com",
  "@anonymous.validname.com",
  "@eliminatejunkemail.com",
  "@filteredemailaddress.com",
  "@iddp.net",
  "@idshield.tk",
  "@newvcorp.com",
  "@nojunkemailaddress.com",
  "@obscure.me",
  "@qq.com",
  "@secretregistration.com",
  "@simplesite.com",
  "@simplames.com",
  "@spamfree.bookmyname.com",
  "@webnode.com",
  "academy",
  "account",
  "admin",
  "billing",
  "consulting",
  "contact",
  "dns@",
  "dnsmgr",
  "dnsadm",
  "domain",
  "dotcommedia.com",
  "dropcatch.com",
  "forsale@epik.com",
  "help@",
  "helpus@",
  "hosting",
  "hostmaster",
  "info@",
  "itsystem",
  "junkemail",
  "justhost.com",
  "management",
  "netsolution@",
  "o-w-o.info",
  "photography",
  "privacy",
  "private",
  "protect",
  "proxy",
  "realestate",
  "registrar",
  "registry@loopia.se",
  "sales",
  "service@",
  "server",
  "support@",
  "sysmgr",
  "techsupport",
  "techsystem",
  "webmaster",
  "whois",
  "xserver.co.jp",
  "yummynames.com",
  "webmanager",
];

//filters for bad names
var no_bueno_names = [
  "@",
  "academy",
  "admin",
  "author",
  "bluehost",
  "bluescope",
  "bossman",
  "co.",
  "company",
  "comerc",
  "consult",
  "customer",
  "contact",
  "domain",
  "digital",
  "department",
  "economy",
  "enterprise",
  "events",
  "foods",
  "foundation",
  "group",
  "guide",
  "host",
  "inc.",
  "international",
  "internet",
  "info",
  "kft.",
  "limited",
  "lda.",
  "llc",
  "ltd",
  "master",
  "marketing",
  "manage",
  "media",
  "namesecure",
  "network",
  "operation",
  "office",
  "president",
  "product",
  "reality",
  "registry",
  "service",
  "shop",
  "solution",
  "support",
  "sweepstakes",
  "test",
  "temp name",
  "world",
];

//filters for parked pages
var parked_strings = [
  "mcc.godaddy.com",
  "www.imena.ua",
  "parked.easydns.com",
  "namebrightstatic.com",
  "gandi.net",
  "cdnpark.com",
  "sedoparking",
  // "bluehost - top rated web hosting provider",
  // "web hosting from just host",
  "parkingcrew",
  "parkdomain",
  "domainpark",
  "domain parking",
  "domainparking",
  "domain name is registered and parked",
  "domain name is parked",
  "domain parked by europe",
  "parked free of charge",
  "parked page for domain names",
  "this domain is parked",
  "this domain name is parked",
  "this web page is parked free",
  "courtesy of www.hostmonster.com",
  "would you like to buy this domain",
  "sk-logabpstatus.php",
];

//#endregion

//#region -------------------------------MAIN FUNCTIONS-------------------------------------

//render parked admin page
function renderParkedAdminpage(req, res, next) {
  console.log("Rendering admin parked page...");

  //if no parameter for date, get latest one
  if (!req.params.date) {
    var date_to_get = fs
      .readdirSync("./other/Marketing/parkedcontacts/DailyResults/")
      .filter(function (elem) {
        return elem.indexOf(".json") != -1;
      })
      .sort(function (a, b) {
        var date_a = moment(a.replace(".json", ""));
        var date_b = moment(b.replace(".json", ""));
        return date_a < date_b ? 1 : date_a == date_b ? 0 : -1;
      })[0]
      .replace(".json", "");
  } else {
    var date_to_get = moment(req.params.date).format("YYYY-MM-DD");
  }

  res.render("admin/admin_parked_script.ejs", {
    script_running: fs.existsSync(
      "./other/Marketing/parkedcontacts/DailyResults/" + date_to_get + ".lok"
    ),
    results_exist: fs.existsSync(
      "./other/Marketing/parkedcontacts/DailyResults/" + date_to_get + ".json"
    ),
    csv_exists: fs.existsSync(
      "./other/Marketing/parkedcontacts/FinalCSV/" +
        date_to_get +
        "-checklist.csv"
    ),
    date_to_get: date_to_get,
  });
}

//rebuild CSV for a specific date
function rebuildCSV(req, res, next) {
  //create a lock file
  fs.writeFileSync(
    "./other/Marketing/parkedcontacts/DailyResults/" + req.params.date + ".lok",
    ""
  );

  buildCSV(req.params.date);
  res.send({
    state: "success",
  });
}

//retake specific screenshots for a specific date
function retakeScreenshots(req, res, next) {
  var date_to_get = req.params.date;

  res.send({
    state: "success",
  });

  //minus 2 for excel index offset
  var ids_to_screenshot = req.body.ids_to_screenshot
    ? req.body.ids_to_screenshot.split(",").map(function (elem) {
        return parseInt(elem) - 2;
      })
    : [];

  //if array is legit
  if (
    ids_to_screenshot &&
    ids_to_screenshot.length > 0 &&
    ids_to_screenshot.every(function (elem) {
      return Number.isInteger(parseInt(elem));
    })
  ) {
    //original CSV contents
    var parked_contacts_for_sendgrid = [];
    csv2json()
      .fromFile(
        "./other/Marketing/parkedcontacts/FinalCSV/" +
          date_to_get +
          "-checklist.csv"
      )
      .on("json", (jsonObj) => {
        parked_contacts_for_sendgrid.push(jsonObj);
      })
      .on("done", (error) => {
        //open chrome headless and open a new page
        (async () => {
          const browser = await puppeteer.launch();
          const headless_page = await browser.newPage();

          //take screenshot promises
          var screenshot_promises = [];
          for (var x = 0; x < parked_contacts_for_sendgrid.length; x++) {
            //if exists within the IDS to re-screenshot array
            if (ids_to_screenshot.indexOf(x) != -1) {
              screenshot_promises.push(
                take_screenshot_promise(
                  headless_page,
                  date_to_get,
                  parked_contacts_for_sendgrid[x].domain_name,
                  x,
                  false
                )
              );
            }
          }

          //get new screenshots
          var limit = qlimit(1);
          Q.allSettled(
            screenshot_promises.map(
              limit(function (item, index, collection) {
                return screenshot_promises[index]();
              })
            )
          ).then(function (results) {
            //loop through all successful imgur links and add to the CSV file
            for (var y = 0; y < results.length; y++) {
              if (results[y].state == "fulfilled") {
                if (results[y].value.domahub) {
                  parked_contacts_for_sendgrid[
                    results[y].value.file_index
                  ].link_pic_domahub = results[y].value.imgur_link;
                } else {
                  parked_contacts_for_sendgrid[
                    results[y].value.file_index
                  ].link_pic_existing = results[y].value.imgur_link;
                }
              }
            }

            //re-create CSV file
            json2csv(
              {
                data: parked_contacts_for_sendgrid,
                fields: [
                  "domain_name",
                  "email",
                  "first_name",
                  "last_name",
                  "link_pic_existing",
                  "link_pic_domahub",
                ],
              },
              function (err, parked_contacts_for_sendgrid_csv) {
                if (!err) {
                  //create final check list before adding to sendgrid
                  fs.writeFileSync(
                    "./other/Marketing/parkedcontacts/FinalCSV/" +
                      date_to_get +
                      "-checklist.csv",
                    parked_contacts_for_sendgrid_csv
                  );

                  console.log(
                    "--------------------------------------------------------------"
                  );
                  console.log(
                    "--------------------FINISHED SENDGRID CHECKLIST---------------"
                  );
                  console.log(
                    "-------------------------" +
                      date_to_get +
                      "---------------------------"
                  );
                  console.log(
                    "--------------------------------------------------------------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "------------------------------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "------------------------------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "----GO CHECK THE FINAL LIST---"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "----------" + date_to_get + "----------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "------------------------------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "------------------------------"
                  );
                }
              }
            );
          });
        })();
      });
  }
}

//find parked domains
function getParkedDomains(req, res, next) {
  //date to get
  var date_to_get = (
    test_mode ? moment(test_date) : moment().subtract(1, "month")
  ).format("YYYY-MM-DD");
  if (req.params.date) {
    date_to_get = req.params.date;
  }

  //if lock file already exists, skip finding step
  if (
    !fs.existsSync(
      "./other/Marketing/parkedcontacts/DailyResults/" + date_to_get + ".lok"
    )
  ) {
    //script is running
    res.send({
      state: "running",
    });

    //create a lock file
    fs.writeFileSync(
      "./other/Marketing/parkedcontacts/DailyResults/" + date_to_get + ".lok",
      ""
    );

    //hash for domains and emails already retrieved/seen
    var emails_seen = {};
    fs.readFile(
      "./other/Marketing/parkedcontacts/MasterFiles/seen_domains.json",
      "utf8",
      function (err, data) {
        if (err) {
          console.log("No master domains history file!");
        }
        var domains_seen = data ? JSON.parse(data) : {};
        fs.readFile(
          "./other/Marketing/parkedcontacts/MasterFiles/seen_emails.json",
          "utf8",
          function (err, data) {
            if (err) {
              console.log("No master emails history file!");
            }
            if (data) {
              JSON.parse(data).forEach(function (elem) {
                emails_seen[elem.admin_email] = true;
                emails_seen[elem.tech_email] = true;
                emails_seen[elem.registrant_email] = true;
                domains_seen[elem.domain_name] = true;
              });
            }

            //restart current date_to_get results
            fs.writeFileSync(
              "./other/Marketing/parkedcontacts/DailyResults/" +
                date_to_get +
                ".json",
              []
            );

            //word bank (words_current is the one being used, words_master is the master list of all words)
            var words = JSON.parse(
              fs.readFileSync(
                "./other/Marketing/parkedcontacts/MasterFiles/words_current.json",
                "utf8"
              )
            );

            //build domain list promises (get domains from domainscope)
            var domain_promises = [];
            for (var x = 0; x < words.length; x++) {
              domain_promises.push(
                get_domainscope_domains(
                  words[x],
                  x,
                  words.length,
                  domains_seen,
                  emails_seen,
                  date_to_get
                )
              );
            }

            console.log(
              "--------------------------------------------------------------"
            );
            console.log(
              "----------------------FINDING DOMAINS-------------------------"
            );
            console.log(
              "-------------------------" +
                date_to_get +
                "---------------------------"
            );
            console.log(
              "--------------------------------------------------------------"
            );

            //get all domainscope trending domains
            var limit = qlimit(1);
            Q.allSettled(
              domain_promises.map(
                limit(function (item, index, collection) {
                  return domain_promises[index]();
                })
              )
            ).then(function (results) {
              buildCSV(date_to_get);
            });
          }
        );
      }
    );
  } else {
    //script is done
    res.send({
      state: "finished",
    });

    buildCSV(date_to_get);
  }
}

//done checklist, add contacts to sendgrid
function sendParkedContacts(req, res, next) {
  //date to get
  var date_to_get = (
    test_mode ? moment(test_date) : moment().subtract(1, "month")
  ).format("YYYY-MM-DD");
  if (req.params.date) {
    date_to_get = req.params.date;
  }

  //if CSV file exists
  if (
    fs.existsSync(
      "./other/Marketing/parkedcontacts/FinalCSV/" +
        date_to_get +
        "-checklist.csv"
    )
  ) {
    console.log(
      "--------------------------------------------------------------"
    );
    console.log(
      "----------------PARSING CSV FILE INTO JSON--------------------"
    );
    console.log(
      "-------------------------" + date_to_get + "---------------------------"
    );
    console.log(
      "--------------------------------------------------------------"
    );

    var parked_contacts_for_sendgrid = [];
    csv2json()
      .fromFile(
        "./other/Marketing/parkedcontacts/FinalCSV/" +
          date_to_get +
          "-checklist.csv"
      )
      .on("json", (jsonObj) => {
        parked_contacts_for_sendgrid.push(jsonObj);
      })
      .on("done", (error) => {
        console.log(
          "--------------------------------------------------------------"
        );
        console.log(
          "----------------SENDING CONTACTS TO SENDGRID------------------"
        );
        console.log(
          "-------------------------" +
            date_to_get +
            "---------------------------"
        );
        console.log(
          "--------------------------------------------------------------"
        );

        sendgrid_client
          .request({
            method: "POST",
            url: "/v3/contactdb/recipients",
            body: parked_contacts_for_sendgrid,
          })
          .then(([response, body]) => {
            //add to list if successfully added
            if (response.statusCode == 201 && body && body.new_count > 0) {
              console.log("Adding new contacts to email list...");

              //cold email list
              var send_grid_details = {
                method: "POST",
                url: sendgrid_prod_list_url,
                body: body.persisted_recipients,
              };

              //test list
              if (test_mode) {
                send_grid_details.url = sendgrid_test_list_url;
              }

              sendgrid_client
                .request(send_grid_details)
                .then(([response, body]) => {
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "-----------------------------------------------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "-----------------------------------------------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "------------------------------DONEZO-----------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "-------------------" + date_to_get + "------------------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "-----------------------------------------------"
                  );
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "-----------------------------------------------"
                  );

                  //success or not - adding to list
                  if (response.statusCode == 201) {
                    res.send({
                      state: "success",
                    });
                  } else {
                    res.send({
                      state: "error",
                    });
                  }
                });
            }
          });
      });
  } else {
    res.send({
      state: "error",
    });
  }
}

//build CSV - sort emails, get screenshots, build checklist
function buildCSV(date_to_get) {
  console.log("--------------------------------------------------------------");
  console.log("----------------------FINISHED QUERYING DOMAINS---------------");
  console.log(
    "-------------------------" + date_to_get + "---------------------------"
  );
  console.log("--------------------------------------------------------------");

  //filter for bad emails and sort the emails
  filterAndSortEmails(date_to_get, function () {
    console.log(
      "--------------------------------------------------------------"
    );
    console.log(
      "----------------------FINISHED SORTING EMAILS-----------------"
    );
    console.log(
      "-------------------------" + date_to_get + "---------------------------"
    );
    console.log(
      "--------------------------------------------------------------"
    );

    //get screenshots (current + domahub)
    getScreenshots(date_to_get, function () {
      console.log(
        "--------------------------------------------------------------"
      );
      console.log(
        "----------------------FINISHED SCREENSHOTS--------------------"
      );
      console.log(
        "-------------------------" +
          date_to_get +
          "---------------------------"
      );
      console.log(
        "--------------------------------------------------------------"
      );

      //create a final checklist before sending to sendgrid
      createFinalChecklist(date_to_get);
    });
  });
}

//#endregion

//#region -------------------------------GET EMAIL / WHOIS / PARKED STATUS-------------------------------------

//promise to get list of trending domains from domainscope (filter by keyword + date)
function get_domainscope_domains(
  word,
  index,
  total,
  domains_seen,
  emails_seen,
  date_to_get
) {
  return function () {
    return Q.Promise(function (resolve, reject, notify) {
      console.log(
        "-----------------------------------Word #" +
          (index + 1) +
          "/" +
          total +
          " (" +
          word +
          ") - " +
          date_to_get
      );
      request(
        {
          url:
            "https://domainscope.com/domainview/trending?keywords=" +
            word +
            "&startDate=" +
            date_to_get +
            "&endDate=" +
            date_to_get,
          method: "GET",
          json: true,
        },
        function (err, response, body) {
          buildWhoIsPromises(
            domains_seen,
            emails_seen,
            resolve,
            reject,
            body.domains,
            word,
            false,
            date_to_get
          );
        }
      );
    });
  };
}

//function to build array of whois promises from list of domains
function buildWhoIsPromises(
  domains_seen,
  emails_seen,
  resolve,
  reject,
  domains,
  word,
  property_name,
  date_to_get
) {
  var whois_promises = [];
  if (domains) {
    for (var x = 0; x < domains.length; x++) {
      //havent seen this domain before
      var cur_domain = property_name
        ? domains[x][property_name].toLowerCase()
        : domains[x].toLowerCase();
      if (!domains_seen[cur_domain]) {
        whois_promises.push(get_whois_check_parked_promise(cur_domain, word));
        domains_seen[cur_domain] = true;
      }
    }
  }

  console.log(
    "-----------------------------------Total domains parsed : " +
      Object.keys(domains_seen).length
  );
  fs.writeFileSync(
    "./other/Marketing/parkedcontacts/MasterFiles/seen_domains.json",
    JSON.stringify(domains_seen, null, 4),
    "utf8"
  );

  //go ahead and try new domains
  var limit = qlimit(1); //limit parallel promises (throttle)
  Q.allSettled(
    whois_promises.map(
      limit(function (item, index, collection) {
        return whois_promises[index]();
      })
    )
  ).then(function (results) {
    var successful_domains = [];
    for (var y = 0; y < results.length; y++) {
      if (
        results[y].state == "fulfilled" &&
        (!emails_seen[results[y].value.admin_email] ||
          !emails_seen[results[y].value.tech_email] ||
          !emails_seen[results[y].value.registrant_email])
      ) {
        console.log(
          "\x1b[33m%s\x1b[0m",
          "NEW EMAIL ADDED - " +
            results[y].value.domain_name +
            " - " +
            results[y].value.registrant_email
        );
        successful_domains.push(results[y].value);
        if (results[y].value.admin_email) {
          emails_seen[results[y].value.admin_email] = true;
        }
        if (results[y].value.tech_email) {
          emails_seen[results[y].value.tech_email] = true;
        }
        if (results[y].value.registrant_email) {
          emails_seen[results[y].value.registrant_email] = true;
        }
      }
    }

    //if we got an email
    if (successful_domains.length > 0) {
      overwriteEmailFile(
        word,
        "./other/Marketing/parkedcontacts/DailyResults/" +
          date_to_get +
          ".json",
        successful_domains,
        function () {
          overwriteEmailFile(
            false,
            "./other/Marketing/parkedcontacts/MasterFiles/seen_emails.json",
            successful_domains,
            resolve
          );
        }
      );
    } else {
      reject();
    }
  });
}

//get the WHOIS info of a domain and check if it's parked
function get_whois_check_parked_promise(domain_name, intial_word) {
  return function () {
    return Q.Promise(function (resolve, reject, notify) {
      console.log("WHOIS - " + domain_name);

      try {
        //look up domain owner info
        whois.lookup(
          domain_name,
          {
            follow: 2, // number of times to follow redirects
          },
          function (err, data) {
            console.log("RECEIVED WHOIS - " + domain_name);
            var whoisObj = {};
            if (data && !err) {
              console.log("PARSING WHOIS - " + domain_name);
              var array = parser.parseWhoIsData(data);
              for (var x = 0; x < array.length; x++) {
                whoisObj[array[x].attribute.trim()] = array[x].value;
              }

              if (
                whoisObj["Admin Email"] ||
                whoisObj["Tech Email"] ||
                whoisObj["Registrant Email"]
              ) {
                console.log("CHECKING WHOIS EMAIL - " + domain_name);
                var admin_email = whoisObj["Admin Email"]
                  ? whoisObj["Admin Email"].toLowerCase()
                  : "";
                var tech_email = whoisObj["Tech Email"]
                  ? whoisObj["Tech Email"].toLowerCase()
                  : "";
                var registrant_email = whoisObj["Registrant Email"]
                  ? whoisObj["Registrant Email"].toLowerCase()
                  : "";

                //check if there are any bad emails
                var any_good = no_bueno_email_strings.every(function (
                  bad_email_str
                ) {
                  var admin_check =
                    admin_email != ""
                      ? admin_email.indexOf(bad_email_str) == -1
                      : false;
                  var tech_check =
                    tech_email != ""
                      ? tech_email.indexOf(bad_email_str) == -1
                      : false;
                  var registrant_check =
                    registrant_email != ""
                      ? registrant_email.indexOf(bad_email_str) == -1
                      : false;

                  //remove if bad
                  if (!admin_check) {
                    admin_email = "";
                  }
                  if (!tech_check) {
                    tech_email = "";
                  }
                  if (!registrant_check) {
                    registrant_email = "";
                  }
                  return admin_check || tech_check || registrant_check;
                });

                if (
                  any_good &&
                  (admin_email != "" ||
                    tech_email != "" ||
                    registrant_email != "")
                ) {
                  try {
                    //check if website is parked
                    console.log("REQUEST - " + domain_name);
                    request.get(
                      {
                        url: "http://" + domain_name,
                        timeout: 100000,
                        headers: {
                          "User-Agent":
                            "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
                        },
                      },
                      function (err, response, body) {
                        if (!err && body) {
                          //why it was marked parked
                          console.log("CHECKING PARKED - " + domain_name);
                          var strings = [];
                          var parked = parked_strings.some(function (
                            parked_string
                          ) {
                            var exists =
                              response.body
                                .toLowerCase()
                                .indexOf(parked_string) != -1;
                            if (exists) {
                              strings.push(parked_string);
                            }
                            return exists;
                          });

                          //is it potentially parked or parked?
                          var potentially_parked = false;
                          var potentially_parked_strings = [];
                          if (parked) {
                            console.log(
                              "\x1b[44m%s\x1b[0m",
                              "PARKED!!! - " +
                                domain_name +
                                " - " +
                                JSON.stringify(strings)
                            );
                          } else {
                            var park_potential =
                              response.body.toLowerCase().indexOf("park") != -1
                                ? "park"
                                : "";
                            var domain_potential =
                              response.body.toLowerCase().indexOf("domain") !=
                              -1
                                ? "domain"
                                : "";

                            //why was it potentially parked?
                            if (
                              park_potential != "" ||
                              domain_potential != ""
                            ) {
                              console.log(
                                "\x1b[41m%s\x1b[0m",
                                "Potentially parked - " +
                                  domain_name +
                                  " (" +
                                  park_potential +
                                  " " +
                                  domain_potential +
                                  ")"
                              );
                              var potentially_parked = true;
                              if (park_potential != "") {
                                potentially_parked_strings.push(park_potential);
                              }
                              if (domain_potential != "") {
                                potentially_parked_strings.push(
                                  domain_potential
                                );
                              }
                            }
                          }

                          //figure out names
                          console.log("CHECKING NAMES - " + domain_name);
                          if (
                            whoisObj["Admin Name"] ||
                            whoisObj["Tech Name"] ||
                            whoisObj["Registrant Name"]
                          ) {
                            var admin_name = whoisObj["Admin Name"]
                              ? whoisObj["Admin Name"].toLowerCase()
                              : "";
                            var tech_name = whoisObj["Tech Name"]
                              ? whoisObj["Tech Name"].toLowerCase()
                              : "";
                            var registrant_name = whoisObj["Registrant Name"]
                              ? whoisObj["Registrant Name"].toLowerCase()
                              : "";

                            var admin_name_lower = whoisObj["Admin Name"]
                              ? whoisObj["Admin Name"].toLowerCase()
                              : "";
                            var tech_name_lower = whoisObj["Tech Name"]
                              ? whoisObj["Tech Name"].toLowerCase()
                              : "";
                            var registrant_name_lower = whoisObj[
                              "Registrant Name"
                            ]
                              ? whoisObj["Registrant Name"].toLowerCase()
                              : "";

                            //check if there are any bad names
                            no_bueno_names.some(function (bad_name) {
                              var admin_check =
                                admin_name_lower != ""
                                  ? admin_name_lower.indexOf(bad_name) != -1
                                  : false;
                              var tech_check =
                                tech_name_lower != ""
                                  ? tech_name_lower.indexOf(bad_name) != -1
                                  : false;
                              var registrant_check =
                                registrant_name_lower != ""
                                  ? registrant_name_lower.indexOf(bad_name) !=
                                    -1
                                  : false;

                              //make blank if bad (contains a bad word or has no letters)
                              if (
                                admin_check ||
                                !admin_name_lower.match(/[a-z]/i)
                              ) {
                                admin_name = "";
                              }
                              if (
                                tech_check ||
                                !tech_name_lower.match(/[a-z]/i)
                              ) {
                                tech_name = "";
                              }
                              if (
                                registrant_check ||
                                !registrant_name_lower.match(/[a-z]/i)
                              ) {
                                registrant_name = "";
                              }
                              return (
                                admin_check || tech_check || registrant_check
                              );
                            });
                          } else {
                            var admin_check = "";
                            var tech_check = "";
                            var registrant_check = "";
                          }

                          var admin_name = toTitleCase(admin_name);
                          var tech_name = toTitleCase(tech_name);
                          var registrant_name = toTitleCase(registrant_name);

                          resolve({
                            domain_name: domain_name.toLowerCase(),
                            parked: parked,
                            admin_email:
                              admin_email == ""
                                ? fillInBlank(
                                    admin_email,
                                    tech_email,
                                    registrant_email
                                  )
                                : admin_email,
                            tech_email:
                              tech_email == ""
                                ? fillInBlank(
                                    tech_email,
                                    admin_email,
                                    registrant_email
                                  )
                                : tech_email,
                            registrant_email:
                              registrant_email == ""
                                ? fillInBlank(
                                    registrant_email,
                                    tech_email,
                                    admin_email
                                  )
                                : registrant_email,
                            admin_name:
                              admin_name == ""
                                ? fillInBlank(
                                    admin_name,
                                    tech_name,
                                    registrant_name
                                  )
                                : admin_name,
                            tech_name:
                              tech_name == ""
                                ? fillInBlank(
                                    tech_name,
                                    admin_name,
                                    registrant_name
                                  )
                                : tech_name,
                            registrant_name:
                              registrant_name == ""
                                ? fillInBlank(
                                    registrant_name,
                                    tech_name,
                                    admin_name
                                  )
                                : registrant_name,
                            intial_word: intial_word,
                            parked_strings: strings,
                            potentially_parked: potentially_parked,
                            potentially_parked_strings:
                              potentially_parked_strings,
                          });
                        } else {
                          reject();
                        }
                      }
                    );
                  } catch (error) {
                    console.log("\x1b[33m%s\x1b[0m", error);
                    reject();
                  }
                } else {
                  reject();
                }
              } else {
                reject();
              }
            } else {
              console.log("\x1b[33m%s\x1b[0m", "WHOIS ERR", err);
              reject();
            }
          }
        );
      } catch (error) {
        console.log("\x1b[33m%s\x1b[0m", "TRY CATCH ERR", error);
        reject();
      }
    });
  };
}

//write the email to a file
function overwriteEmailFile(word, file_path, successful_domains, resolve) {
  if (word) {
    console.log(
      "Total emails from '" + word + "' : " + successful_domains.length
    );
  }
  fs.readFile(file_path, function (err, data) {
    try {
      var json = JSON.parse(data);
      json = json.concat(successful_domains);
    } catch (e) {
      var json = successful_domains;
      if (word) {
        console.log(
          "\x1b[41m%s\x1b[0m",
          "Total emails so far : " + json.length
        );
      }
    } finally {
      fs.writeFile(file_path, JSON.stringify(json, null, 4), function () {
        resolve();
      });
    }
  });
}

//check if there are any bad emails and sort the good ones
function filterAndSortEmails(date_to_get, callback) {
  console.log("--------------------------------------------------------------");
  console.log("----------------------SORTING EMAILS--------------------------");
  console.log(
    "-------------------------" + date_to_get + "---------------------------"
  );
  console.log("--------------------------------------------------------------");

  var emails_for_today = JSON.parse(
    fs.readFileSync(
      "./other/Marketing/parkedcontacts/DailyResults/" + date_to_get + ".json",
      "utf8"
    )
  );
  emails_for_today = emails_for_today.filter(function (email_obj) {
    //find and remove bad emails
    return no_bueno_email_strings.every(function (bad_email_str) {
      var admin_check = email_obj.admin_email
        ? email_obj.admin_email.indexOf(bad_email_str) == -1
        : false;
      var tech_check = email_obj.tech_email
        ? email_obj.tech_email.indexOf(bad_email_str) == -1
        : false;
      var registrant_check = email_obj.registrant_email
        ? email_obj.registrant_email.indexOf(bad_email_str) == -1
        : false;

      //remove if bad
      if (email_obj.admin_email && !admin_check) {
        email_obj.admin_email = "";
      }
      if (email_obj.tech_email && !tech_check) {
        email_obj.tech_email = "";
      }
      if (email_obj.registrant_email && !registrant_check) {
        email_obj.registrant_email = "";
      }
      return admin_check || tech_check || registrant_check;
    });
  });
  emails_for_today.sort(function (a, b) {
    return a.domain_name == b.domain_name
      ? 0
      : a.domain_name > b.domain_name
      ? 1
      : -1;
  });

  //move to results folder and delete the existing emails gotten
  fs.writeFileSync(
    "./other/Marketing/parkedcontacts/DailyResults/" + date_to_get + ".json",
    JSON.stringify(emails_for_today, null, 4)
  );

  if (callback) {
    callback();
  }
}

//#endregion

//#region -------------------------------GET SCREENSHOT-------------------------------------

//recreate a single domain's screenshots (for current + domahub)
function screenshotDomain(req, res, next) {
  var domain_name = req.params.domain_name;
  var which_screenshots = req.params.which_screenshots;

  (async () => {
    const browser = await puppeteer.launch();
    const headless_page = await browser.newPage();
    var tempobj = {};

    if (which_screenshots == "domahub" || which_screenshots == "both") {
      //domahub screenshot
      take_screenshot_promise(
        headless_page,
        "link_pic_existing",
        domain_name,
        0,
        true
      )().then(function (result) {
        tempobj.domahub_screenshot = result.imgur_link;

        //both screenshots
        if (which_screenshots == "both") {
          take_screenshot_promise(
            headless_page,
            "link_pic_existing",
            domain_name,
            0,
            false
          )().then(function (result) {
            tempobj.current_screenshot = result.imgur_link;
            res.send(tempobj);
          });
        } else {
          res.send(tempobj);
        }
      });
    } else {
      //current screenshot
      take_screenshot_promise(
        headless_page,
        "link_pic_existing",
        domain_name,
        0,
        false
      )().then(function (result) {
        tempobj.current_screenshot = result.imgur_link;
        res.send(tempobj);
      });
    }
  })();
}

//loop through and find parked domain emails and take screenshots + upload to imgur
function getScreenshots(date_to_get, callback) {
  console.log("--------------------------------------------------------------");
  console.log("----------------------CREATING SCREENSHOTS--------------------");
  console.log(
    "-------------------------" + date_to_get + "---------------------------"
  );
  console.log("--------------------------------------------------------------");

  var emails_for_today = JSON.parse(
    fs.readFileSync(
      "./other/Marketing/parkedcontacts/DailyResults/" + date_to_get + ".json",
      "utf8"
    )
  );
  if (emails_for_today) {
    var screenshot_promises = [];

    //open chrome headless and open a new page
    (async () => {
      const browser = await puppeteer.launch();
      const headless_page = await browser.newPage();

      //take screenshot if parked and has at least 1 email and doesnt have a screenshot already
      for (var x = 0; x < emails_for_today.length; x++) {
        if (
          emails_for_today[x].parked &&
          !emails_for_today[x].current_screenshot &&
          !emails_for_today[x].domahub_screenshot &&
          (emails_for_today[x].admin_email != "" ||
            emails_for_today[x].registrant_email != "" ||
            emails_for_today[x].tech_email != "")
        ) {
          var temp_domain_name = emails_for_today[x].domain_name;
          screenshot_promises.push(
            take_screenshot_promise(
              headless_page,
              date_to_get,
              temp_domain_name,
              x,
              false
            )
          );
          screenshot_promises.push(
            take_screenshot_promise(
              headless_page,
              date_to_get,
              temp_domain_name,
              x,
              true
            )
          );
        }
      }

      //get all screenshots
      var limit = qlimit(1);
      Q.allSettled(
        screenshot_promises.map(
          limit(function (item, index, collection) {
            return screenshot_promises[index]();
          })
        )
      ).then(function (results) {
        console.log(
          "--------------------------------------------------------------"
        );
        console.log(
          "----------------------WRITING SCREENSHOTS TO JSON-------------"
        );
        console.log(
          "-------------------------" +
            date_to_get +
            "---------------------------"
        );
        console.log(
          "--------------------------------------------------------------"
        );

        //loop through all successful imgur links and add to the results file
        for (var y = 0; y < results.length; y++) {
          if (results[y].state == "fulfilled") {
            if (results[y].value.domahub) {
              emails_for_today[results[y].value.file_index].domahub_screenshot =
                results[y].value.imgur_link;
            } else {
              emails_for_today[results[y].value.file_index].current_screenshot =
                results[y].value.imgur_link;
            }
          }
        }

        //write to results file for the day
        fs.writeFileSync(
          "./other/Marketing/parkedcontacts/DailyResults/" +
            date_to_get +
            ".json",
          JSON.stringify(emails_for_today, null, 4)
        );

        if (callback) {
          callback();
        }
      });
    })();
  }
}

//recursive async function to keep reloading page if timed out
async function reloadPage(headless_page, http_url, domahub_or_not_text) {
  try {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "------------Attempting to reload page------------"
    );
    await headless_page
      .reload(http_url, {
        waitUntil: ["networkidle0", "load", "networkidle2", "domcontentloaded"],
        timeout: 30000,
      })
      .then(function () {
        console.log("Success! Loaded" + domahub_or_not_text);
      });
  } catch (error) {
    console.log("\x1b[33m%s\x1b[0m", error);
    if (error.message.indexOf("Timeout Exceeded") != -1) {
      await reloadPage(headless_page, http_url, domahub_or_not_text);
    }
  }
}

//promise to take a screenshot via headless chrome + upload directly to imgur
function take_screenshot_promise(
  headless_page,
  date,
  domain_name,
  file_index,
  domahub
) {
  return function () {
    return Q.Promise(function (resolve, reject, notify) {
      var domahub_or_not_text = domahub ? " DomaHub listing page" : "";
      console.log("Loading page " + domain_name + domahub_or_not_text + "...");

      //variables (depends on if we're taking live photo or domahub photo)
      var file_name =
        date +
        "-" +
        (domahub
          ? domain_name.replace("domahub.com/listing/", "-dh-")
          : domain_name) +
        "-ss.jpg";
      var http_url = domahub
        ? "https://domahub.com/listing/" +
          domain_name +
          "?compare=true&theme=Stars&tutorial=false"
        : "http://" + domain_name;
      var screenshot_properties = {
        type: "jpeg",
        quality: 75,
      };

      //clip the screen if we're taking domahub listing page
      if (domahub) {
        screenshot_properties.clip = {
          x: 0,
          y: 50,
          width: 1249, //1 pixel less because some weird white bar
          height: 700,
        };
      }

      (async () => {
        //set viewport settings
        await headless_page.setViewport({
          width: 1250,
          height: 750,
          isLandscape: true,
          deviceScaleFactor: 0.75,
          isMobile: false,
        });

        try {
          //go to page
          await headless_page
            .goto(http_url, {
              waitUntil: [
                "networkidle0",
                "load",
                "networkidle2",
                "domcontentloaded",
              ],
              timeout: 30000,
            })
            .then(function () {
              console.log("Success! Loaded" + domahub_or_not_text);
            });
        } catch (error) {
          //if timed out, reload page until it works
          if (error.message.indexOf("Timeout Exceeded") != -1) {
            await reloadPage(headless_page, http_url, domahub_or_not_text);
          }
        }

        //pause 3 sec
        await headless_page.waitFor(3000);

        //take a screenshot
        await headless_page
          .screenshot(screenshot_properties)
          .then(function (buffer) {
            //upload buffer directly to imgur
            console.log("Now uploading " + domain_name + " to Imgur...");
            request.post(
              {
                url: "https://imgur-apiv3.p.mashape.com/3/image",
                headers: {
                  "X-Mashape-Key": imgur_mashape_key,
                  Authorization: imgur_mashape_authorization,
                },
                json: true,
                formData: {
                  title: file_name,
                  image: buffer,
                  image_type: "binary",
                },
              },
              function (err, response, body) {
                if (!err && body.success) {
                  console.log(
                    "\x1b[44m%s\x1b[0m",
                    "UPLOADED!!! - " + domain_name + " - " + body.data.link
                  );
                  resolve({
                    domahub: domahub,
                    imgur_link: body.data.link,
                    file_index: file_index,
                  });
                } else {
                  reject();
                }
              }
            );
          });
      })();
    });
  };
}

//#endregion

//#region -------------------------------CREATE FINAL CHECKLIST-------------------------------------

//create the final checklist (test function)
function createFinalChecklistOnly(req, res, next) {
  createFinalChecklist(req.params.date);
}

//return the most occuring string (if none, then return by order)
function mode(array) {
  array = array.filter(function (elem) {
    return elem != "";
  });
  if (array.length == 0) return null;
  var modeMap = {};
  var maxEl = array[0],
    maxCount = 1;
  for (var i = 0; i < array.length; i++) {
    var el = array[i];
    if (modeMap[el] == null) modeMap[el] = 1;
    else modeMap[el]++;
    if (modeMap[el] > maxCount) {
      maxEl = el;
      maxCount = modeMap[el];
    }
  }
  return maxEl;
}

//take admin/tech/registrant name, find the best one and split to first/last name
function splitAndParseNames(registrant_name, tech_name, admin_name) {
  var mode_name = mode([registrant_name, tech_name, admin_name]);
  if (mode_name != "" && mode_name) {
    //remove @email addresses
    mode_name =
      mode_name.indexOf("@") != -1
        ? mode_name.substring(0, mode_name.indexOf("@"))
        : mode_name;
    mode_name =
      mode_name.indexOf("%40") != -1
        ? mode_name.substring(0, mode_name.indexOf("%40"))
        : mode_name;

    //only if both first and last name exist
    var parsed_name = human.parseName(mode_name);
    if (parsed_name.firstName && parsed_name.lastName) {
      return parsed_name;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

//get all successful screenshot + email parked domain owners and add to sendgrid list
function createFinalChecklist(date_to_get) {
  console.log("--------------------------------------------------------------");
  console.log("----------------------CREATING FINAL CHECKLIST----------------");
  console.log(
    "-------------------------" + date_to_get + "---------------------------"
  );
  console.log("--------------------------------------------------------------");

  var emails_for_today = JSON.parse(
    fs.readFileSync(
      "./other/Marketing/parkedcontacts/DailyResults/" + date_to_get + ".json",
      "utf8"
    )
  );
  var parked_contacts_for_sendgrid = [];

  //create the contacts array
  if (emails_for_today) {
    for (var x = 0; x < emails_for_today.length; x++) {
      //if parked and if we have screenshots
      if (
        emails_for_today[x].parked &&
        emails_for_today[x].current_screenshot &&
        emails_for_today[x].domahub_screenshot
      ) {
        //figure out best name + email
        var split_name = splitAndParseNames(
          emails_for_today[x].registrant_name,
          emails_for_today[x].tech_name,
          emails_for_today[x].admin_name
        );
        var mode_email = mode([
          emails_for_today[x].registrant_email,
          emails_for_today[x].tech_email,
          emails_for_today[x].admin_email,
        ]);

        //if first name is longer than 1 char and we have an email
        if (
          split_name &&
          split_name.firstName &&
          split_name.firstName.length > 1 &&
          mode_email
        ) {
          parked_contacts_for_sendgrid.push({
            email: mode_email,
            first_name: split_name.firstName,
            last_name: split_name.lastName,
            domain_name: emails_for_today[x].domain_name,
            link_pic_existing: emails_for_today[x].current_screenshot,
            link_pic_domahub: emails_for_today[x].domahub_screenshot,
          });

          //add first and last name to the results
          emails_for_today[x].first_name = split_name.firstName;
          emails_for_today[x].last_name = split_name.lastName;
        }
      }
    }

    //create CSV file
    json2csv(
      {
        data: parked_contacts_for_sendgrid,
        fields: [
          "domain_name",
          "email",
          "first_name",
          "last_name",
          "link_pic_existing",
          "link_pic_domahub",
        ],
      },
      function (err, parked_contacts_for_sendgrid_csv) {
        if (!err) {
          //create final check list before adding to sendgrid
          fs.writeFileSync(
            "./other/Marketing/parkedcontacts/DailyResults/" +
              date_to_get +
              ".json",
            JSON.stringify(emails_for_today, null, 4)
          );
          fs.writeFileSync(
            "./other/Marketing/parkedcontacts/FinalCSV/" +
              date_to_get +
              "-checklist.csv",
            parked_contacts_for_sendgrid_csv
          );

          //remove lock file now that we're finished
          if (
            fs.existsSync(
              "./other/Marketing/parkedcontacts/DailyResults/" +
                date_to_get +
                ".lok"
            )
          ) {
            fs.unlinkSync(
              "./other/Marketing/parkedcontacts/DailyResults/" +
                date_to_get +
                ".lok"
            );
          }

          console.log(
            "--------------------------------------------------------------"
          );
          console.log(
            "--------------------FINISHED SENDGRID CHECKLIST---------------"
          );
          console.log(
            "-------------------------" +
              date_to_get +
              "---------------------------"
          );
          console.log(
            "--------------------------------------------------------------"
          );
          console.log("\x1b[44m%s\x1b[0m", "------------------------------");
          console.log("\x1b[44m%s\x1b[0m", "------------------------------");
          console.log("\x1b[44m%s\x1b[0m", "----GO CHECK THE FINAL LIST---");
          console.log(
            "\x1b[44m%s\x1b[0m",
            "----------" + date_to_get + "----------"
          );
          console.log("\x1b[44m%s\x1b[0m", "------------------------------");
          console.log("\x1b[44m%s\x1b[0m", "------------------------------");
        }
      }
    );
  }
}

//#endregion

//#endregion
