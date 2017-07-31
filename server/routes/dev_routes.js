//<editor-fold>

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

//</editor-fold>

module.exports = function(app, db, auth, error){
  Auth = auth;
  Account = new account_model(db);
  Listing = new listing_model(db);
  Data = new data_model(db);

  app.get("/emailviews/:email_template", emailViews);
  app.get("/createcodes/:number", [
    createSignupCodes
  ]);
  app.get("/analysis/:domain_name", analysis);
  app.get("/paypal", paypal);

  //temporary to test /redirect page
  app.get("/redirect", function(req, res){
    res.render("redirect.ejs", {
      redirect: "/"
    });
  });

  app.get('/godaddy', godaddy);
}

//godaddy api connect
function godaddy(req, res, next){
  request({
    url: "https://api.ote-godaddy.com//v1/domains/available?domain=testfuck.com",
    method: "GET",
    headers: {
      'Authorization':'sso-key VUxKSUdS_Bnj2xEUWUGZ7RJ93jmqTe4:Bnj6gnvLHN7z4hsKzUDA5r'
    }
  }, function (err, response, body) {
    console.log(response);
    res.send(response);
  });
}

//<editor-fold>

function paypal(req, res, next){
  res.render("paypaltest.ejs");
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
    listing_info: {
      logo: "http://i.imgur.com/qiJLjgz.png",
      primary_color: "#ff6715"
    },
    name : "offerer",
    owner_name : "OWNERFUCK",
    offerer_name: "BUYERTWAT",
    offerer_email: "test@email.com",
    email: "test@email.com",
    accepted: false,
    offerer_phone: phoneUtil.format(phoneNumber, PNF.INTERNATIONAL),
    phone: phoneUtil.format(phoneNumber, PNF.INTERNATIONAL),
    offer: moneyFormat.to(parseFloat("1231324")),
    verification_code: randomstring.generate(10),
    message: "djkljakljfljasklfjkldasjfklasdjkldfjaskldfjkasdlfjklsajdfklasjdklfjaslkfjklasjdflkjskdlf"
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
function createSignupCodes(req, res, next){
  console.log("F: Creating " + req.params.number + " signup codes...");
  var codes = [];
  var return_lazy = [];

  if (validator.isInt(req.params.number)){
    for (var x = 0; x < req.params.number; x++){
      var random_string = randomstring.generate(10);
      codes.push([random_string, 1]);
      return_lazy.push("https://domahub.com/signup/" + random_string);
    }
  }
  Account.createSignupCodes(codes, function(result){
    res.send(return_lazy.join("</br></br>"));
  });
}

//function to test proxy image
function proxyimage(req, res, next){
  res.render("proxy/proxy-image.ejs", {
    image: "https://clips.twitch.tv/GoodAgileSparrowUWot",
    content: "image",
    edit: false,
    preview: false,
    doma_rental_info : {
      address: "https://clips.twitch.tv/GoodAgileSparrowUWot",
      type: 0,
      rental_id : 359,
      path: "lol",
      domain_name: "youretoxic.com",
      date: 1493352000000,
      duration: 86400000,
      owner_hash_id: "jfka0"
    }
  });
}

//function to test proxy websites
function proxysite(req, res, next){
  var doma_rental_info = {
    address: "http://1minlee.com",
    type: 0,
    rental_id : 359,
    path: "lol",
    domain_name: "youretoxic.com",
    date: 1493352000000,
    duration: 86400000,
    owner_hash_id: "jfka0"
  }

  var address_request = request({
    url: doma_rental_info.address,
    encoding: null
  }, function (err, response, body) {

    var index_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-index.ejs');
    var preview_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-preview.ejs');

    var proxy_index = fs.readFileSync(index_path);
    var proxy_preview = fs.readFileSync(preview_path);

    var rental_info_buffer = new Buffer("<script>var doma_rental_info = " + JSON.stringify(doma_rental_info) + "</script>");
    var buffer_array = [body, proxy_index, proxy_preview, rental_info_buffer];

    //if authenticated to edit the rental preview
    if (req.session.proxy_edit){
      var edit_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-edit.ejs');
      var proxy_preview = fs.readFileSync(edit_path);
      buffer_array.push(proxy_preview);
    }
    else {
      var noedit_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-noedit.ejs');
      var proxy_nopreview = fs.readFileSync(noedit_path);
      buffer_array.push(proxy_nopreview);
    }

    if (!proxy_index || (req.session.proxy_edit && !proxy_preview) || (!req.session.proxy_edit && !proxy_nopreview)) {
      error.handler(req, res, "Invalid rental!");
    }
    else {
      res.set("content-type", response.headers["content-type"]);
      res.end(Buffer.concat(buffer_array));
    }

  });
}

//function to analyze traffic funnel
function analysis(req, res, next){
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
            res.render("dev/analysis.ejs", {
              traffic: traffic
            });
          });
        });
      });
    });
  });
}

//</editor-fold>
